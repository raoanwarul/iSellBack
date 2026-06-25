export const LISTING_CONDITIONS = [
  { value: 'like_new', label: 'Like New' },
  { value: 'excellent', label: 'Excellent' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
]

export const FALLBACK_BUSINESSES = [
  {
    id: 'flagship-macintosh-enterprise',
    slug: 'macintosh-enterprise',
    name: 'Macintosh Enterprise',
    city: 'Noida',
    state: 'Uttar Pradesh',
    short_description: 'Flagship Apple buyback and verified resale partner for Delhi NCR.',
    google_rating: 4.8,
    trust_score: 94,
    logo_url: null,
  },
]

export const EMPTY_LISTING_FILTERS = {
  q: '',
  category: 'all',
  conditions: [],
  priceMin: null,
  priceMax: null,
  city: '',
  sort: 'newest',
}

export function formatListingCondition(condition) {
  return LISTING_CONDITIONS.find((entry) => entry.value === condition)?.label || condition || 'Good'
}

export function getListingCategory(listing) {
  const haystack = `${listing?.title || ''} ${listing?.model || ''}`.toLowerCase()
  return haystack.includes('ipad') ? 'ipad' : 'macbook'
}

function matchesCategory(listing, category) {
  if (category === 'all') return true
  return getListingCategory(listing) === category
}

function matchesQuery(listing, query) {
  const needle = query.trim().toLowerCase()
  if (!needle) return true
  const haystack = [
    listing?.title,
    listing?.model,
    listing?.color,
    listing?.businesses?.name,
    listing?.businesses?.city,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return needle.split(/\s+/).every((token) => haystack.includes(token))
}

export function applyListingFilters(rows, filters) {
  const filtered = (rows || []).filter((listing) => {
    if (!matchesQuery(listing, filters.q)) return false
    if (!matchesCategory(listing, filters.category)) return false
    if (filters.conditions.length > 0 && !filters.conditions.includes(listing.condition)) return false
    if (filters.priceMin != null && listing.price_inr < filters.priceMin) return false
    if (filters.priceMax != null && listing.price_inr > filters.priceMax) return false
    if (filters.city && (listing?.businesses?.city || '').toLowerCase() !== filters.city.toLowerCase()) return false
    return true
  })

  const sorted = [...filtered]
  if (filters.sort === 'price_asc') sorted.sort((a, b) => a.price_inr - b.price_inr)
  else if (filters.sort === 'price_desc') sorted.sort((a, b) => b.price_inr - a.price_inr)
  else sorted.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))

  return sorted
}

export function activeFilterCount(filters) {
  let count = 0
  if (filters.q.trim()) count += 1
  if (filters.category !== 'all') count += 1
  if (filters.conditions.length > 0) count += 1
  if (filters.priceMin != null || filters.priceMax != null) count += 1
  if (filters.city) count += 1
  return count
}

export async function fetchFeaturedListings(supabase, limit = 6) {
  try {
    const { data, error } = await supabase
      .from('listings')
      .select(`
        id,
        title,
        model,
        storage_gb,
        color,
        year,
        condition,
        price_inr,
        mrp_inr,
        warranty_months,
        business_id,
        created_at,
        businesses(name, city, slug, trust_score, google_rating, short_description)
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  } catch (error) {
    console.warn('Featured listings unavailable:', error.message)
    return []
  }
}

export async function fetchFeaturedBusinesses(supabase, limit = 4) {
  try {
    const { data, error } = await supabase
      .from('businesses')
      .select('id, slug, name, city, trust_score, google_rating, short_description, logo_url, is_featured, updated_at')
      .eq('status', 'active')
      .order('is_featured', { ascending: false })
      .order('updated_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  } catch (error) {
    console.warn('Featured businesses unavailable:', error.message)
    return FALLBACK_BUSINESSES.slice(0, limit)
  }
}