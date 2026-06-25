// Supabase Edge Function: send-push-notification
// Deploy: supabase functions deploy send-push-notification --project-ref zdyzqbufilsfesdusfci
//
// Required Secrets (Dashboard > Edge Functions > Secrets):
//   FIREBASE_SERVICE_ACCOUNT_JSON = Firebase service account JSON (full contents)
//
// DUAL PATH: sends FCM push AND inserts into notifications table (in-app bell)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
}

function toFcmDataMap(data: Record<string, unknown>): Record<string, string> {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return {}
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => {
      if (value == null) return [key, '']
      if (typeof value === 'string') return [key, value]
      if (typeof value === 'number' || typeof value === 'boolean') return [key, String(value)]
      return [key, JSON.stringify(value)]
    })
  )
}

function resolveDeviceTypes(
  userId: string | undefined,
  agentEmail: string | undefined,
  notificationType: string,
  requestedDeviceTypes: string[] | undefined,
): string[] {
  if (Array.isArray(requestedDeviceTypes) && requestedDeviceTypes.length > 0) {
    return requestedDeviceTypes
  }
  if (agentEmail) return ['android_agent', 'web_agent']
  if (userId) return ['android_customer', 'web_customer']
  if (notificationType?.startsWith('admin_')) return ['android_admin', 'web_admin']
  return []
}

function resolveAndroidChannel(deviceType: string): string {
  switch (deviceType) {
    case 'android_agent': return 'agent_notifications'
    case 'android_admin': return 'admin_notifications'
    default: return 'buyback_notifications'
  }
}

// Google OAuth2 access token from service account
async function getAccessToken(serviceAccount: Record<string, string>): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const header = { alg: 'RS256', typ: 'JWT' }
  const payload = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }

  const encode = (obj: unknown): string => {
    const bytes = new TextEncoder().encode(JSON.stringify(obj))
    let binary = ''
    for (const b of bytes) binary += String.fromCharCode(b)
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  }

  const headerB64 = encode(header)
  const payloadB64 = encode(payload)
  const unsignedToken = `${headerB64}.${payloadB64}`

  const pemContents = serviceAccount.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s/g, '')
  const binaryKey = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0))

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  )

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(unsignedToken),
  )

  const sigBytes = new Uint8Array(signature)
  let sigBinary = ''
  for (const b of sigBytes) sigBinary += String.fromCharCode(b)
  const signatureB64 = btoa(sigBinary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

  const jwt = `${unsignedToken}.${signatureB64}`

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  })

  const tokenData = await tokenRes.json()
  if (!tokenData.access_token) {
    console.error('❌ Google OAuth token exchange failed:', JSON.stringify(tokenData))
    throw new Error(`Google OAuth failed: ${tokenData.error_description || tokenData.error || 'unknown'}`)
  }
  return tokenData.access_token
}

// Send FCM notification via HTTP v1 API
async function sendFcmNotification(
  accessToken: string,
  projectId: string,
  fcmToken: string,
  deviceType: string,
  title: string,
  body: string,
  data: Record<string, unknown> = {},
) {
  const url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`
  const stringData = toFcmDataMap(data)
  const androidChannel = resolveAndroidChannel(deviceType)

  const message = {
    message: {
      token: fcmToken,
      notification: { title, body },
      data: stringData,
      webpush: {
        notification: { title, body, icon: '/logo.png' },
        ...(stringData.route ? { fcm_options: { link: stringData.route } } : {}),
      },
      android: {
        priority: 'high',
        notification: { title, body, channel_id: androidChannel },
      },
    },
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  })

  const result = await response.json()
  if (!response.ok) {
    console.error(`❌ FCM send failed for ${deviceType} (${fcmToken.substring(0, 15)}...):`, JSON.stringify(result))
  } else {
    console.log(`✅ FCM sent to ${deviceType} (${fcmToken.substring(0, 15)}...)`)
  }
  return { ok: response.ok, result }
}

// Insert notification into notifications table (in-app bell notification)
async function insertInAppNotification(
  supabase: ReturnType<typeof createClient>,
  userId: string | undefined,
  agentEmail: string | undefined,
  title: string,
  body: string,
  type: string,
  data: Record<string, unknown>,
) {
  try {
    // For admin broadcasts (no user_id, no agent_email), skip in-app insert
    // because there's no single user/agent to target in the notifications table
    if (!userId && !agentEmail) {
      // For admin broadcast, insert one notification per admin user
      const { data: adminUsers } = await supabase
        .from('admin_users')
        .select('id, email')
      if (adminUsers && adminUsers.length > 0) {
        for (const admin of adminUsers) {
          // admin_users.id might not be a UUID from auth.users, so we try email lookup
          const { data: authUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', admin.email)
            .maybeSingle()
          if (authUser) {
            await supabase.from('notifications').insert({
              user_id: authUser.id,
              title,
              body,
              type,
              data,
              read: false,
            })
          }
        }
        console.log(`📋 In-app notification inserted for ${adminUsers.length} admin(s)`)
      }
      return
    }

    if (userId) {
      await supabase.from('notifications').insert({
        user_id: userId,
        title,
        body,
        type,
        data,
        read: false,
      })
      console.log(`📋 In-app notification inserted for user: ${userId.substring(0, 8)}...`)
    }
    if (agentEmail) {
      await supabase.from('notifications').insert({
        agent_email: agentEmail,
        title,
        body,
        type,
        data,
        read: false,
      })
      console.log(`📋 In-app notification inserted for agent: ${agentEmail}`)
    }
  } catch (e) {
    console.error('⚠️ Failed to insert in-app notification:', e.message)
  }
}

// Send WhatsApp message via Meta Cloud API
// Requires secrets: WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID
async function sendWhatsAppMessage(to: string, message: string): Promise<boolean> {
  const accessToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN')
  const phoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID')
  if (!accessToken || !phoneNumberId) return false

  // Normalize phone: remove +, spaces, dashes → pure digits with country code
  const normalized = to.replace(/\D/g, '')
  if (normalized.length < 10) return false

  try {
    const res = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: normalized,
        type: 'text',
        text: { body: message },
      }),
    })
    const result = await res.json()
    if (!res.ok) {
      console.error('❌ WhatsApp send failed:', JSON.stringify(result))
      return false
    }
    console.log(`✅ WhatsApp sent to ${normalized.substring(0, 6)}... (${normalized.length} digits)`)
    return true
  } catch (e) {
    console.error('❌ WhatsApp error:', e.message)
    return false
  }
}

// Look up phone number for WhatsApp notification target
async function getTargetPhone(
  supabase: ReturnType<typeof createClient>,
  userId: string | undefined,
  agentEmail: string | undefined,
  notificationType: string,
): Promise<string | null> {
  // Admin notifications → use WHATSAPP_ADMIN_PHONE env secret; no hardcoded fallback
  if (!userId && !agentEmail) {
    return Deno.env.get('WHATSAPP_ADMIN_PHONE') || null
  }
  // Customer notifications → look up phone from users table
  if (userId) {
    const { data } = await supabase.from('users').select('phone').eq('id', userId).maybeSingle()
    return data?.phone || null
  }
  // Agent notifications → look up phone from agents table
  if (agentEmail) {
    const { data } = await supabase.from('agents').select('phone').eq('email', agentEmail).maybeSingle()
    return data?.phone || null
  }
  return null
}

// Build WhatsApp message body for notification type
function buildWhatsAppMessage(notificationType: string, title: string, body: string, data: Record<string, unknown>): string {
  const deviceModel = (data?.device_model || data?.model || '') as string
  const requestId = (data?.request_id || '') as string
  const shortId = requestId ? String(requestId).substring(0, 8) : ''

  switch (notificationType) {
    case 'admin_new_request':
      return `🆕 *New Sell Request*\n\n${body}\n\n📱 Device: ${deviceModel || 'Unknown'}\n🔖 Request ID: ${shortId}...\n\n_BuyBack Elite_`
    case 'offer':
    case 'counter_offer':
      return `💰 *${title}*\n\n${body}\n\n_Tap the app to view details._\n\n_BuyBack Elite_`
    case 'agent_assigned':
    case 'new_pickup':
      return `🚗 *${title}*\n\n${body}\n\n_Open the app to track your pickup._\n\n_BuyBack Elite_`
    case 'status_update':
    case 'pickup_update':
      return `📦 *${title}*\n\n${body}\n\n_BuyBack Elite_`
    default:
      return `*${title}*\n\n${body}\n\n_BuyBack Elite_`
  }
}

// Notification types for which WhatsApp should be sent
const WHATSAPP_ENABLED_TYPES = new Set([
  'admin_new_request',
  'offer',
  'counter_offer',
  'agent_assigned',
  'new_pickup',
  'pickup_update',
  'status_update',
])

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  const diagnostics: string[] = []
  const log = (msg: string) => { console.log(msg); diagnostics.push(msg) }

  try {
    const {
      user_id,
      agent_email,
      title,
      body,
      data,
      device_types,
      type,
      notification_type,
    } = await req.json()

    log(`📨 Request: user_id=${user_id || 'none'}, agent_email=${agent_email || 'none'}, type=${type || notification_type || 'none'}, device_types=${JSON.stringify(device_types || [])}`)

    if (!title || !body) {
      return new Response(JSON.stringify({ error: 'title and body are required' }), {
        status: 400,
        headers: CORS_HEADERS,
      })
    }

    const resolvedType = notification_type || type || 'general'
    const resolvedDeviceTypes = resolveDeviceTypes(user_id, agent_email, resolvedType, device_types)
    log(`🔍 Resolved device types: ${JSON.stringify(resolvedDeviceTypes)}`)

    if (!user_id && !agent_email && resolvedDeviceTypes.length === 0) {
      return new Response(JSON.stringify({ error: 'user_id, agent_email, or device_types is required', diagnostics }), {
        status: 400,
        headers: CORS_HEADERS,
      })
    }

    // Initialize Supabase (service role for full access)
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

    // STEP 1: Always insert in-app notification (works even if FCM fails)
    await insertInAppNotification(supabase, user_id, agent_email, title, body, resolvedType, data || {})

    // STEP 2: Attempt FCM push notification
    const FIREBASE_SERVICE_ACCOUNT_JSON = Deno.env.get('FIREBASE_SERVICE_ACCOUNT_JSON')
    if (!FIREBASE_SERVICE_ACCOUNT_JSON) {
      log('❌ FIREBASE_SERVICE_ACCOUNT_JSON secret is NOT set! Push notifications will not work.')
      return new Response(JSON.stringify({
        error: 'FIREBASE_SERVICE_ACCOUNT_JSON secret not configured',
        in_app_sent: true,
        push_sent: 0,
        diagnostics,
      }), { status: 200, headers: CORS_HEADERS })
    }

    let serviceAccount: Record<string, string>
    try {
      serviceAccount = JSON.parse(FIREBASE_SERVICE_ACCOUNT_JSON)
      log(`🔑 Firebase project: ${serviceAccount.project_id}, client: ${serviceAccount.client_email?.substring(0, 20)}...`)
    } catch (parseErr) {
      log(`❌ FIREBASE_SERVICE_ACCOUNT_JSON is invalid JSON: ${parseErr.message}`)
      return new Response(JSON.stringify({
        error: 'Invalid FIREBASE_SERVICE_ACCOUNT_JSON',
        in_app_sent: true,
        push_sent: 0,
        diagnostics,
      }), { status: 200, headers: CORS_HEADERS })
    }

    let accessToken: string
    try {
      accessToken = await getAccessToken(serviceAccount)
      log('✅ Firebase access token obtained')
    } catch (authErr) {
      log(`❌ Firebase auth failed: ${authErr.message}`)
      return new Response(JSON.stringify({
        error: `Firebase auth failed: ${authErr.message}`,
        in_app_sent: true,
        push_sent: 0,
        diagnostics,
      }), { status: 200, headers: CORS_HEADERS })
    }

    // STEP 3: Query FCM tokens
    let query = supabase.from('fcm_tokens').select('token, device_type, user_id')

    if (user_id) {
      query = query.eq('user_id', user_id)
    }
    if (agent_email) {
      query = query.eq('user_id', agent_email)
    }
    if (resolvedDeviceTypes.length > 0) {
      query = query.in('device_type', resolvedDeviceTypes)
    }

    const { data: tokens, error: tokenError } = await query
    if (tokenError) {
      log(`❌ Token query failed: ${tokenError.message}`)
      throw new Error(`Failed to fetch tokens: ${tokenError.message}`)
    }

    log(`📱 Found ${tokens?.length || 0} FCM token(s) in database`)
    if (tokens && tokens.length > 0) {
      tokens.forEach((t, i) => {
        log(`  Token ${i + 1}: device_type=${t.device_type}, user_id=${t.user_id?.substring(0, 15)}..., token=${t.token?.substring(0, 15)}...`)
      })
    }

    if (!tokens || tokens.length === 0) {
      return new Response(JSON.stringify({
        message: 'No FCM tokens found for target',
        in_app_sent: true,
        push_sent: 0,
        total: 0,
        diagnostics,
      }), { headers: CORS_HEADERS })
    }

    // STEP 4: Send FCM to all tokens
    const results = await Promise.allSettled(
      tokens.map((t) =>
        sendFcmNotification(
          accessToken,
          serviceAccount.project_id,
          t.token,
          t.device_type,
          title,
          body,
          {
            ...(data || {}),
            type: resolvedType,
            ...(user_id ? { user_id } : {}),
            ...(agent_email ? { agent_email } : {}),
          },
        )
      ),
    )

    const sent = results.filter((r) => r.status === 'fulfilled' && r.value.ok).length
    const failed = results.length - sent
    log(`📊 Push results: ${sent} sent, ${failed} failed out of ${tokens.length}`)

    // Log individual failures for debugging
    for (let i = 0; i < results.length; i++) {
      const r = results[i]
      if (r.status === 'fulfilled' && !r.value.ok) {
        const errMsg = JSON.stringify(r.value.result?.error || r.value.result)
        log(`  ❌ Token ${i + 1} failed: ${errMsg}`)
        const errorCode = r.value.result?.error?.details?.[0]?.errorCode
        if (errorCode === 'UNREGISTERED') {
          await supabase.from('fcm_tokens').delete().eq('token', tokens[i].token)
          log(`  🗑️ Cleaned up unregistered token: ${tokens[i].token.substring(0, 15)}...`)
        }
      } else if (r.status === 'rejected') {
        log(`  ❌ Token ${i + 1} threw: ${r.reason}`)
      }
    }

    // STEP 5: Send WhatsApp notification (non-blocking, best-effort)
    let whatsappSent = false
    if (WHATSAPP_ENABLED_TYPES.has(resolvedType)) {
      const targetPhone = await getTargetPhone(supabase, user_id, agent_email, resolvedType)
      if (targetPhone) {
        const waMessage = buildWhatsAppMessage(resolvedType, title, body, data || {})
        whatsappSent = await sendWhatsAppMessage(targetPhone, waMessage)
        log(`📱 WhatsApp to ${targetPhone.substring(0, 6)}...: ${whatsappSent ? '✅ sent' : '⚠️ skipped/failed'}`)
      } else {
        log('📱 WhatsApp: no phone number found for target')
      }
    }

    return new Response(JSON.stringify({
      sent,
      failed,
      total: tokens.length,
      in_app_sent: true,
      whatsapp_sent: whatsappSent,
      diagnostics,
    }), { headers: CORS_HEADERS })
  } catch (error) {
    console.error('💥 Edge function error:', error)
    return new Response(JSON.stringify({ error: error.message, diagnostics }), {
      status: 500,
      headers: CORS_HEADERS,
    })
  }
})
