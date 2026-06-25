// Supabase Edge Function: sync-cashify-prices
// Fetches latest prices from Cashify website and updates cashify_reference_prices table
// Can be called manually from admin panel or on a cron schedule

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Known Cashify URLs for each model
const CASHIFY_MODELS = [
  { model: 'MacBook Air M1 (2020)', type: 'MacBook', url: 'https://www.cashify.in/sell-old-laptop/apple-macbook-air-m1-2020' },
  { model: 'MacBook Air M2 (2022)', type: 'MacBook', url: 'https://www.cashify.in/sell-old-laptop/apple-macbook-air-m2-2022' },
  { model: 'MacBook Air M3 (2024)', type: 'MacBook', url: 'https://www.cashify.in/sell-old-laptop/apple-macbook-air-m3-2024' },
  { model: 'MacBook Air M4 (2025)', type: 'MacBook', url: 'https://www.cashify.in/sell-old-laptop/apple-macbook-air-m4-2025' },
  { model: 'MacBook Pro M3 14-inch (2024)', type: 'MacBook', url: 'https://www.cashify.in/sell-old-laptop/apple-macbook-pro-14-m3-2023' },
  { model: 'MacBook Pro M3 Pro 16-inch (2024)', type: 'MacBook', url: 'https://www.cashify.in/sell-old-laptop/apple-macbook-pro-16-m3-pro-2023' },
  { model: 'iPad Pro 11-inch M4 (2024)', type: 'iPad', url: 'https://www.cashify.in/sell-old-tablet/apple-ipad-pro-11-m4-2024' },
  { model: 'iPad Air 5th Gen M1 (2022)', type: 'iPad', url: 'https://www.cashify.in/sell-old-tablet/apple-ipad-air-5th-gen-m1-2022' },
]

async function fetchCashifyPrice(url: string): Promise<{ min: number; max: number } | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
    })
    if (!response.ok) return null
    
    const html = await response.text()
    
    // Extract price from Cashify page - they typically show "Get up to ₹XX,XXX"
    const priceMatches = html.match(/₹\s*([\d,]+)/g)
    if (!priceMatches || priceMatches.length === 0) return null
    
    const prices = priceMatches
      .map(p => parseInt(p.replace(/[₹,\s]/g, '')))
      .filter(p => p > 1000 && p < 500000) // Filter out unrealistic values
      .sort((a, b) => a - b)
    
    if (prices.length === 0) return null
    
    return {
      min: prices[0],
      max: prices[prices.length - 1],
    }
  } catch (err) {
    console.error(`Failed to fetch ${url}:`, err.message)
    return null
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const results: Array<{ model: string; status: string; min?: number; max?: number }> = []

    // Fetch prices from Cashify for each known model
    for (const item of CASHIFY_MODELS) {
      const price = await fetchCashifyPrice(item.url)
      
      if (price) {
        // Update in database
        const { error } = await supabase
          .from('cashify_reference_prices')
          .update({
            min_price: price.min,
            max_price: price.max,
            last_updated: new Date().toISOString(),
          })
          .eq('model_name', item.model)
        
        if (!error) {
          results.push({ model: item.model, status: 'updated', min: price.min, max: price.max })
        } else {
          // Try insert if not exists
          await supabase.from('cashify_reference_prices').insert({
            model_name: item.model,
            device_type: item.type,
            min_price: price.min,
            max_price: price.max,
            cashify_url: item.url,
            last_updated: new Date().toISOString(),
          })
          results.push({ model: item.model, status: 'inserted', min: price.min, max: price.max })
        }
      } else {
        results.push({ model: item.model, status: 'failed' })
      }
      
      // Rate limit: wait 2s between requests
      await new Promise(r => setTimeout(r, 2000))
    }

    // Also sync to price_engine (max_price → base_price)
    const { data: allCashify } = await supabase
      .from('cashify_reference_prices')
      .select('model_name, device_type, max_price')
    
    let engineSynced = 0
    if (allCashify) {
      for (const c of allCashify) {
        const { data: existing } = await supabase
          .from('price_engine')
          .select('id, base_price')
          .eq('model_name', c.model_name)
          .single()
        
        if (existing) {
          if (existing.base_price !== c.max_price) {
            await supabase.from('price_engine')
              .update({ base_price: c.max_price, updated_at: new Date().toISOString() })
              .eq('id', existing.id)
            engineSynced++
          }
        } else {
          await supabase.from('price_engine').insert({
            model_name: c.model_name,
            device_type: c.device_type,
            base_price: c.max_price,
            scrap_value: Math.round(c.max_price * 0.15),
            is_active: true,
          })
          engineSynced++
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Fetched ${results.filter(r => r.status !== 'failed').length}/${CASHIFY_MODELS.length} prices from Cashify. Synced ${engineSynced} to price_engine.`,
        results,
        engineSynced,
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
