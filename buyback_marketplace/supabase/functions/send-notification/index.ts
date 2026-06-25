// =============================================================================
// Edge Function: send-notification
// =============================================================================
// Sends FCM push notification + inserts row in notifications table.
// Called by DB triggers OR directly from apps.
// =============================================================================

// deno-lint-ignore-file no-explicit-any
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotifyPayload {
  user_id: string
  type: string
  title: string
  body: string
  data?: Record<string, unknown>
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const payload: NotifyPayload = await req.json()
    const { user_id, type, title, body, data } = payload

    if (!user_id || !title || !body) {
      return json({ error: 'user_id, title, body required' }, 400)
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // 1. Get user's FCM token
    const { data: user, error: uErr } = await supabase
      .from('app_users')
      .select('fcm_token')
      .eq('id', user_id)
      .maybeSingle()

    // 2. Always insert DB notification (in-app)
    await supabase.from('notifications').insert({ user_id, type, title, body, data })

    if (uErr || !user?.fcm_token) {
      return json({ notified: false, reason: 'no fcm_token' })
    }

    // 3. Send FCM via legacy HTTP API (or upgrade to HTTP v1 with OAuth)
    const fcmKey = Deno.env.get('FCM_SERVER_KEY')
    if (!fcmKey) {
      return json({ notified: false, reason: 'FCM_SERVER_KEY not set' })
    }

    const fcmRes = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Authorization': `key=${fcmKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: user.fcm_token,
        notification: { title, body },
        data: { type, ...(data ?? {}) },
      }),
    })
    const fcmData = await fcmRes.json()

    return json({ notified: true, fcm: fcmData })
  } catch (e: any) {
    return json({ error: e.message }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
