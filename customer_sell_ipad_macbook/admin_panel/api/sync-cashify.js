import { createClient } from '@supabase/supabase-js'

// Cashify model URLs to scrape
const CASHIFY_MODELS = [
  { model: 'MacBook Air M1 (2020)', type: 'MacBook', url: 'https://www.cashify.in/sell-old-laptop/apple-macbook-air-m1-chip-8-gb-ram-256-gb-ssd' },
  { model: 'MacBook Air M2 (2022)', type: 'MacBook', url: 'https://www.cashify.in/sell-old-laptop/apple-macbook-air-m2-chip-8-gb-ram-256-gb-ssd' },
  { model: 'MacBook Air M2 15-inch (2023)', type: 'MacBook', url: 'https://www.cashify.in/sell-old-laptop/apple-macbook-air-15-inch-m2-chip-8-gb-ram-256-gb-ssd' },
  { model: 'MacBook Air M3 (2024)', type: 'MacBook', url: 'https://www.cashify.in/sell-old-laptop/apple-macbook-air-m3-chip-8-gb-ram-256-gb-ssd' },
  { model: 'MacBook Pro M1 Pro 14-inch (2021)', type: 'MacBook', url: 'https://www.cashify.in/sell-old-laptop/apple-macbook-pro-14-inch-m1-pro-chip-16-gb-ram-512-gb-ssd' },
  { model: 'MacBook Pro M2 Pro 14-inch (2023)', type: 'MacBook', url: 'https://www.cashify.in/sell-old-laptop/apple-macbook-pro-14-inch-m2-pro-chip-16-gb-ram-512-gb-ssd' },
  { model: 'MacBook Pro M3 14-inch (2024)', type: 'MacBook', url: 'https://www.cashify.in/sell-old-laptop/apple-macbook-pro-14-inch-m3-chip-8-gb-ram-512-gb-ssd' },
  { model: 'MacBook Pro M3 Pro 14-inch (2024)', type: 'MacBook', url: 'https://www.cashify.in/sell-old-laptop/apple-macbook-pro-14-inch-m3-pro-chip-18-gb-ram-512-gb-ssd' },
  { model: 'MacBook Pro M3 Pro 16-inch (2024)', type: 'MacBook', url: 'https://www.cashify.in/sell-old-laptop/apple-macbook-pro-16-inch-m3-pro-chip-18-gb-ram-512-gb-ssd' },
  { model: 'iPad 10.2-inch (2021) 9th Gen', type: 'iPad', url: 'https://www.cashify.in/sell-old-tablet/apple-ipad-9th-generation-64-gb-wifi-only' },
  { model: 'iPad 10.9-inch (2022) 10th Gen', type: 'iPad', url: 'https://www.cashify.in/sell-old-tablet/apple-ipad-10th-generation-64-gb-wifi-only' },
  { model: 'iPad Air 5th Gen M1 (2022)', type: 'iPad', url: 'https://www.cashify.in/sell-old-tablet/apple-ipad-air-5th-generation-64-gb-wifi-only' },
  { model: 'iPad Pro 11-inch M2 (2022)', type: 'iPad', url: 'https://www.cashify.in/sell-old-tablet/apple-ipad-pro-11-inch-3rd-gen-128-gb-wifi-only' },
  { model: 'iPad Pro 11-inch M4 (2024)', type: 'iPad', url: 'https://www.cashify.in/sell-old-tablet/apple-ipad-pro-11-inch-m4-chip-256-gb-wifi-only' },
  { model: 'iPad Mini 6th Gen (2021)', type: 'iPad', url: 'https://www.cashify.in/sell-old-tablet/apple-ipad-mini-6th-generation-64-gb-wifi-only' },
]

async function fetchCashifyPrice(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    })
    if (!response.ok) return null

    const html = await response.text()

    // Extract prices - Cashify shows "Get up to ₹XX,XXX" or price ranges
    const priceMatches = html.match(/(?:₹|Rs\.?|INR)\s*([\d,]+)/gi)
    if (!priceMatches || priceMatches.length === 0) return null

    const prices = priceMatches
      .map(p => parseInt(p.replace(/[^\d]/g, '')))
      .filter(p => p > 3000 && p < 500000)
      .sort((a, b) => a - b)

    if (prices.length === 0) return null

    // Remove duplicates
    const unique = [...new Set(prices)]
    return {
      min: unique[0],
      max: unique[unique.length - 1],
    }
  } catch (err) {
    console.error(`Failed to fetch ${url}:`, err.message)
    return null
  }
}

export default async function handler(req, res) {
  // CORS — restrict to admin panel origin; defaults to same-origin in production
  const allowedOrigin = process.env.ADMIN_PANEL_URL || 'http://localhost:3000'
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin)
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-sync-secret')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Auth: require shared secret header to prevent unauthenticated callers
  const syncSecret = process.env.ADMIN_SYNC_SECRET
  if (syncSecret) {
    const provided = req.headers['x-sync-secret']
    if (!provided || provided !== syncSecret) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  // Service role key is required — anon key MUST NOT be used for write operations
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Missing Supabase SERVICE_ROLE_KEY — this function requires elevated permissions' })
  }

  const supabase = createClient(supabaseUrl, supabaseKey)
  const results = []

  for (const item of CASHIFY_MODELS) {
    const price = await fetchCashifyPrice(item.url)

    if (price) {
      // Update cashify_reference_prices
      const { data: existing } = await supabase
        .from('cashify_reference_prices')
        .select('id')
        .eq('model_name', item.model)
        .single()

      if (existing) {
        await supabase
          .from('cashify_reference_prices')
          .update({ min_price: price.min, max_price: price.max, last_updated: new Date().toISOString() })
          .eq('id', existing.id)
      } else {
        await supabase.from('cashify_reference_prices').insert({
          model_name: item.model,
          device_type: item.type,
          min_price: price.min,
          max_price: price.max,
          cashify_url: item.url,
          last_updated: new Date().toISOString(),
        })
      }

      // Also sync to price_engine
      const { data: engineRow } = await supabase
        .from('price_engine')
        .select('id, base_price')
        .eq('model_name', item.model)
        .single()

      if (engineRow && engineRow.base_price !== price.max) {
        await supabase.from('price_engine')
          .update({ base_price: price.max, updated_at: new Date().toISOString() })
          .eq('id', engineRow.id)
      }

      results.push({ model: item.model, status: 'updated', min: price.min, max: price.max })
    } else {
      results.push({ model: item.model, status: 'failed' })
    }

    // Rate limit between requests
    await new Promise(r => setTimeout(r, 1500))
  }

  const successCount = results.filter(r => r.status === 'updated').length
  return res.status(200).json({
    success: true,
    message: `Fetched ${successCount}/${CASHIFY_MODELS.length} prices from Cashify.`,
    results,
    timestamp: new Date().toISOString(),
  })
}
