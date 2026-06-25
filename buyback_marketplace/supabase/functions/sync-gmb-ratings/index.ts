// =============================================================================
// Edge Function: sync-gmb-ratings
// =============================================================================
// Scheduled daily (via Supabase Cron) — fetches fresh rating + review_count
// from Google Places API for every active business with gmb_place_id.
// Can also be invoked manually by super admin.
// =============================================================================

// deno-lint-ignore-file no-explicit-any
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY')
    if (!apiKey) return json({ error: 'GOOGLE_PLACES_API_KEY not set' }, 500)

    // Optional: filter to a specific business via POST body
    let businessFilter: string | null = null
    try {
      const body = await req.json()
      businessFilter = body?.business_id ?? null
    } catch { /* no body */ }

    // Load businesses needing sync
    let query = supabase
      .from('businesses')
      .select('id, business_name, gmb_place_id')
      .not('gmb_place_id', 'is', null)
      .eq('is_active', true)

    if (businessFilter) query = query.eq('id', businessFilter)

    const { data: businesses, error } = await query
    if (error) return json({ error: error.message }, 500)
    if (!businesses?.length) return json({ synced: 0, message: 'No businesses to sync' })

    const results: any[] = []
    for (const biz of businesses) {
      try {
        const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(biz.gmb_place_id!)}&fields=rating,user_ratings_total,url&key=${apiKey}`
        const res = await fetch(url)
        const data = await res.json()
        if (data.status !== 'OK' || !data.result) {
          results.push({ business_id: biz.id, error: data.status, details: data.error_message })
          continue
        }
        const rating = typeof data.result.rating === 'number' ? data.result.rating : null
        const reviewCount = typeof data.result.user_ratings_total === 'number' ? data.result.user_ratings_total : null
        const gmbUrl = typeof data.result.url === 'string' ? data.result.url : null

        await supabase
          .from('businesses')
          .update({
            gmb_rating: rating,
            gmb_review_count: reviewCount,
            gmb_url: gmbUrl,
            gmb_last_synced: new Date().toISOString(),
          })
          .eq('id', biz.id)

        results.push({ business_id: biz.id, business_name: biz.business_name, rating, review_count: reviewCount })
      } catch (e: any) {
        results.push({ business_id: biz.id, error: e.message })
      }
    }

    return json({ synced: results.length, results })
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
