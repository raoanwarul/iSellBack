// =============================================================================
// Edge Function: request-quotes
// =============================================================================
// Triggered when a customer submits a sell_request (status='quote_requested').
// For each eligible business in the customer's pincode:
//   1. Load base_price (business_variant_prices override OR platform default)
//   2. Load business's condition_deductions
//   3. Calculate quoted_price = base - sum(matching deductions) + bonuses
//   4. Insert row into quote_requests
// Finally notifies the customer: "You have N quotes"
// =============================================================================

// deno-lint-ignore-file no-explicit-any
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SellRequestPayload {
  sell_request_id: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { sell_request_id }: SellRequestPayload = await req.json()
    if (!sell_request_id) {
      return json({ error: 'sell_request_id required' }, 400)
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // 1. Load sell_request with variant info
    const { data: sellRequest, error: srErr } = await supabase
      .from('sell_requests')
      .select('id, customer_id, variant_id, condition_answers, pickup_pincode, pickup_city, status')
      .eq('id', sell_request_id)
      .single()

    if (srErr || !sellRequest) {
      return json({ error: 'sell_request not found', details: srErr?.message }, 404)
    }

    if (sellRequest.status !== 'quote_requested') {
      return json({ error: `cannot request quotes for status: ${sellRequest.status}` }, 400)
    }

    // 2. Load variant to get platform_base_price fallback
    const { data: variant, error: vErr } = await supabase
      .from('device_variants')
      .select('id, platform_base_price, model_id')
      .eq('id', sellRequest.variant_id)
      .single()

    if (vErr || !variant) {
      return json({ error: 'variant not found' }, 404)
    }

    // 3. Find eligible businesses (active + verified + serving customer's pincode)
    const { data: eligibleBusinesses, error: bErr } = await supabase
      .from('businesses')
      .select('id, business_name, gmb_rating')
      .eq('is_active', true)
      .eq('is_verified', true)
      .contains('pincodes_served', [sellRequest.pickup_pincode])

    if (bErr) {
      return json({ error: 'failed to load businesses', details: bErr.message }, 500)
    }

    if (!eligibleBusinesses || eligibleBusinesses.length === 0) {
      return json({ quotes_created: 0, message: 'No businesses in this pincode' }, 200)
    }

    // 4. For each business, compute quote
    const quotes: any[] = []
    const conditionAnswers = sellRequest.condition_answers || {}

    for (const biz of eligibleBusinesses) {
      // 4a. Get business's variant price (or platform default)
      const { data: bvp } = await supabase
        .from('business_variant_prices')
        .select('base_price')
        .eq('business_id', biz.id)
        .eq('variant_id', variant.id)
        .eq('is_active', true)
        .maybeSingle()

      const basePrice = bvp?.base_price ?? variant.platform_base_price

      // 4b. Get business's condition deductions
      const { data: deductions } = await supabase
        .from('business_condition_deductions')
        .select('category, condition_name, value, impact_level')
        .eq('business_id', biz.id)
        .eq('is_active', true)

      // 4c. Match customer's condition answers against business's deduction rules
      let totalDeduction = 0
      const breakdown: Array<{ category: string; condition: string; amount: number }> = []
      const categoryMap: Record<string, string> = {
        screen_condition: 'Screen',
        body_condition: 'Body',
        keyboard_condition: 'Keyboard',
        trackpad_condition: 'Trackpad',
        ports_condition: 'Ports',
        speakers_condition: 'Speakers',
        camera_condition: 'Camera',
        wifi_bluetooth_condition: 'WiFi/Bluetooth',
        screen_discolouration: 'ScreenDiscolouration',
        screen_spots: 'ScreenSpots',
        screen_lines: 'ScreenLines',
        dent_top_panel: 'DentTopPanel',
        dent_base_panel: 'DentBasePanel',
        loose_hinges: 'LooseHinges',
        cracked_loose_panel: 'CrackedLoosePanel',
        charging_port: 'ChargingPort',
        hard_drive: 'HardDrive',
        motherboard: 'Motherboard',
        battery_health: 'Battery',
        storage: 'Storage',
        ram: 'RAM',
        warranty: 'Warranty',
        cycle_count: 'CycleCount',
      }

      for (const [key, value] of Object.entries(conditionAnswers)) {
        if (typeof value !== 'string' || !value) continue
        const category = categoryMap[key]
        if (!category) continue

        const rule = (deductions ?? []).find(
          (d: any) =>
            d.category?.toLowerCase() === category.toLowerCase() &&
            d.condition_name?.toLowerCase() === value.toLowerCase()
        )
        if (rule && rule.value !== 0) {
          totalDeduction += rule.value
          breakdown.push({ category, condition: value, amount: rule.value })
        }
      }

      // 4d. Handle accessories (charger/box)
      if (conditionAnswers.charger_available === false) {
        const rule = (deductions ?? []).find(
          (d: any) => d.category?.toLowerCase() === 'accessories' && d.condition_name?.toLowerCase() === 'no charger'
        )
        if (rule) {
          totalDeduction += rule.value
          breakdown.push({ category: 'Accessories', condition: 'No charger', amount: rule.value })
        }
      }
      if (conditionAnswers.box_available === true) {
        const rule = (deductions ?? []).find(
          (d: any) => d.category?.toLowerCase() === 'accessories' && d.condition_name?.toLowerCase() === 'box included'
        )
        if (rule) {
          totalDeduction += rule.value
          breakdown.push({ category: 'Accessories', condition: 'Box included', amount: rule.value })
        }
      }

      const quotedPrice = Math.max(0, basePrice - totalDeduction)

      // 4e. Insert quote
      const { data: quote, error: qErr } = await supabase
        .from('quote_requests')
        .insert({
          sell_request_id,
          business_id: biz.id,
          quoted_price: quotedPrice,
          base_price: basePrice,
          deductions_breakdown: breakdown,
          status: 'active',
        })
        .select()
        .single()

      if (!qErr && quote) {
        quotes.push({ business_id: biz.id, business_name: biz.business_name, quoted_price: quotedPrice })
      }
    }

    // 5. Update sell_request status
    await supabase
      .from('sell_requests')
      .update({ status: 'quotes_received' })
      .eq('id', sell_request_id)

    // 6. Notify customer
    await supabase.from('notifications').insert({
      user_id: sellRequest.customer_id,
      type: 'quotes_received',
      title: `${quotes.length} Quote${quotes.length !== 1 ? 's' : ''} Received`,
      body: `You have ${quotes.length} offer${quotes.length !== 1 ? 's' : ''} for your device. Tap to view.`,
      data: { sell_request_id, quote_count: quotes.length },
    })

    return json({ quotes_created: quotes.length, quotes }, 200)
  } catch (e: any) {
    console.error('request-quotes error:', e)
    return json({ error: e.message }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
