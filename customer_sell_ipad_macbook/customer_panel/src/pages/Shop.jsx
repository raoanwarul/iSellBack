import { useEffect, useState, useMemo, useCallback } from 'react'
import { useNavigate, useSearchParams, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  Search, MapPin, SlidersHorizontal, X, Store, Laptop, Tablet,
  Building2, Star, BadgeCheck, ChevronDown, ChevronRight,
  ArrowRight, ShoppingBag, RefreshCw, Grid3X3, List,
  Package, ArrowUpDown, Phone, Shield,
} from 'lucide-react'
import { LISTING_CONDITIONS, formatListingCondition, applyListingFilters, EMPTY_LISTING_FILTERS, activeFilterCount } from '../lib/storefront'
import { useStore } from '../store/useStore'

export default function Shop() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { slug } = useParams()
  const { setSelectedBusinessId } = useStore()
  const [allListings, setAllListings] = useState([])
  const [businesses, setBusinesses] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterOpen, setFilterOpen] = useState(false)
  const [pincode, setPincode] = useState(searchParams.get('pincode') || '')
  const [searchedPincode, setSearchedPincode] = useState('')
  const [viewMode, setViewMode] = useState('grid')
  const [selectedListing, setSelectedListing] = useState(null)
  const [reportDetails, setReportDetails] = useState(null)
  const [loadingReport, setLoadingReport] = useState(false)

  const handleListingClick = async (listing) => {
    setSelectedListing(listing)
    setReportDetails(null)
    setLoadingReport(true)
    try {
      const { data: fullListing, error: listError } = await supabase
        .from('listings')
        .select('*, businesses(*)')
        .eq('id', listing.id)
        .single()
      
      if (!listError && fullListing) {
        setSelectedListing(fullListing)
        if (fullListing.sell_request_id) {
          const { data: requestData } = await supabase
            .from('sell_requests')
            .select('id, device_type, model_name, condition_answers, specs, final_price, admin_notes, created_at')
            .eq('id', fullListing.sell_request_id)
            .single()

          const { data: certData } = await supabase
            .from('data_wipe_certificates')
            .select('certificate_number, wipe_method, wiped_by_name, created_at, device_serial')
            .eq('sell_request_id', fullListing.sell_request_id)
            .maybeSingle()

          setReportDetails({
            request: requestData,
            certificate: certData
          })
        }
      }
    } catch (err) {
      console.error('Error fetching listing details:', err)
    }
    setLoadingReport(false)
  }

  const initialCategory = searchParams.get('category') || 'all'
  const storeFilter = slug || searchParams.get('store') || ''
  
  const [filters, setFilters] = useState({
    ...EMPTY_LISTING_FILTERS,
    category: initialCategory,
  })

  // Load data
  const loadData = useCallback(async (pin = null) => {
    setLoading(true)
    try {
      let listQuery, bizQuery

      if (pin) {
        const [lr, br] = await Promise.all([
          supabase.rpc('get_listings_by_area', { p_pincode: pin, p_limit: 100 }),
          supabase.rpc('get_businesses_by_area', { p_pincode: pin, p_limit: 20 }),
        ])
        listQuery = lr
        bizQuery = br
      } else {
        const [lr, br] = await Promise.all([
          supabase.from('listings')
            .select('id, title, model, storage_gb, color, year, condition, price_inr, mrp_inr, warranty_months, device_type, business_id, created_at, businesses(name, city, slug, trust_score, google_rating)')
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(100),
          supabase.from('businesses')
            .select('id, slug, name, city, short_description, trust_score, google_rating, logo_url, delivery_options')
            .eq('status', 'active')
            .order('is_featured', { ascending: false })
            .limit(20),
        ])
        listQuery = lr
        bizQuery = br
      }

      setAllListings(listQuery.data || [])
      setBusinesses(bizQuery.data || [])
    } catch (e) {
      console.error('Shop load error:', e)
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleSearch = () => {
    if (!pincode.trim()) return
    setSearchedPincode(pincode.trim())
    loadData(pincode.trim())
  }

  // Apply client-side filters
  const filteredListings = useMemo(() => {
    let items = allListings
    
    // Store filter from URL
    if (storeFilter) {
      items = items.filter(l => l.businesses?.slug === storeFilter || l.business_id === storeFilter)
    }

    return applyListingFilters(items, filters)
  }, [allListings, filters, storeFilter])

  const activeStore = useMemo(() => {
    if (!storeFilter) return null
    return businesses.find(b => b.slug === storeFilter || b.id === storeFilter)
  }, [businesses, storeFilter])

  const updateFilter = (key, value) => setFilters(prev => ({ ...prev, [key]: value }))
  const resetFilters = () => setFilters({ ...EMPTY_LISTING_FILTERS })
  const filterCount = activeFilterCount(filters)

  const formatPrice = (p) => '₹' + Number(p || 0).toLocaleString('en-IN')
  const conditionClass = (c) => `condition-${c || 'good'}`

  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold" style={{ color: 'var(--color-text)' }}>Marketplace</h1>
          <p className="text-xs text-gray-500">
            {searchedPincode
              ? `Showing listings near ${searchedPincode}`
              : 'Browse all certified MacBook & iPad listings'}
          </p>
        </div>
        
        {/* Area search */}
        <div className="flex items-center gap-2">
          <div className="relative flex items-center">
            <MapPin className="absolute left-3 w-4 h-4 text-cyan-400" />
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={pincode}
              onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Pincode"
              className="input h-9 pl-9 pr-3 w-28 text-xs"
            />
          </div>
          <button onClick={handleSearch} disabled={!pincode.trim()} className="btn-primary h-9 px-3 text-xs disabled:opacity-50">
            <Search className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Active Store Header */}
      {activeStore && (
        <div className="bg-gradient-to-r from-cyan-950/40 to-slate-900 border border-cyan-500/20 rounded-2xl p-5 sm:p-6 mb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="badge-success text-[10px] px-2 py-0.5">Verified Partner Store</span>
                <span className="text-xs text-amber-400 font-bold flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-500" />
                  {activeStore.google_rating ? Number(activeStore.google_rating).toFixed(1) : '4.8'}
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-white">{activeStore.name}</h2>
              <p className="text-xs text-gray-300 mt-1 max-w-2xl">{activeStore.short_description || 'Premium Apple device trade-in partner.'}</p>
              {activeStore.storefront_address && (
                <p className="text-[11px] text-gray-500 mt-2 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-gray-600" /> {activeStore.storefront_address}
                </p>
              )}
            </div>
            
            <div className="flex flex-wrap gap-2 md:self-center">
              {activeStore.whatsapp_number && (
                <a href={`https://wa.me/${activeStore.whatsapp_number.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="btn-secondary text-xs h-9 px-3 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-cyan-400" /> WhatsApp
                </a>
              )}
              <button
                onClick={() => {
                  setSelectedBusinessId(activeStore.id)
                  navigate('/dashboard/sell')
                }}
                className="btn-primary text-xs h-9 px-4 flex items-center gap-1.5"
              >
                <ShoppingBag className="w-4 h-4" /> Sell to Store
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Stores bar ─── */}
      {businesses.length > 0 && (
        <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide -mx-3 px-3">
          {storeFilter && (
            <button
              onClick={() => { setSearchParams({}); }}
              className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-semibold badge-error cursor-pointer"
            >
              <X className="w-3 h-3" /> Clear store
            </button>
          )}
          {businesses.slice(0, 8).map(biz => (
            <button
              key={biz.id}
              onClick={() => setSearchParams({ store: biz.slug || biz.id })}
              className={`flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all cursor-pointer border ${
                storeFilter === biz.slug || storeFilter === biz.id
                  ? 'badge-primary border-cyan-400/30'
                  : 'badge-neutral border-transparent hover:border-cyan-400/30 hover:text-cyan-600'
              }`}
            >
              <Building2 className="w-3 h-3" />
              {biz.name}
              {biz.city && <span className="text-gray-600">· {biz.city}</span>}
            </button>
          ))}
        </div>
      )}

      {/* ─── Filter bar ─── */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Category */}
        {['all', 'macbook', 'ipad'].map(cat => (
          <button
            key={cat}
            onClick={() => updateFilter('category', cat)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border ${
              filters.category === cat
                ? 'badge-primary border-cyan-400/30'
                : 'badge-neutral border-transparent hover:border-cyan-400/30 hover:text-cyan-600 cursor-pointer'
            }`}
          >
            {cat === 'all' ? 'All' : cat === 'macbook' ? 'MacBook' : 'iPad'}
          </button>
        ))}

        <div className="flex-1" />

        {/* Sort */}
        <div className="relative">
          <select
            value={filters.sort}
            onChange={(e) => updateFilter('sort', e.target.value)}
            className="input h-8 text-[11px] pl-3 pr-7 w-auto rounded-lg appearance-none cursor-pointer"
            style={{ background: 'var(--color-surface-2)' }}
          >
            <option value="newest">Newest</option>
            <option value="price_asc">Price: Low → High</option>
            <option value="price_desc">Price: High → Low</option>
          </select>
          <ArrowUpDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none" />
        </div>

        {/* Filter toggle */}
        <button
          onClick={() => setFilterOpen(!filterOpen)}
          className={`flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold transition-colors border ${
            filterCount > 0 ? 'badge-primary border-cyan-400/30' : 'btn-secondary text-gray-500 border-transparent'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Filters {filterCount > 0 && `(${filterCount})`}
        </button>

        {/* View toggle */}
        <button onClick={() => setViewMode(v => v === 'grid' ? 'list' : 'grid')} className="btn-secondary h-8 w-8 flex items-center justify-center rounded-lg">
          {viewMode === 'grid' ? <List className="w-3.5 h-3.5 text-gray-400" /> : <Grid3X3 className="w-3.5 h-3.5 text-gray-400" />}
        </button>
      </div>

      {/* ─── Filter panel ─── */}
      {filterOpen && (
        <div className="card p-4 animate-fade-in space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>Filters</span>
            <button onClick={resetFilters} className="text-xs text-cyan-400 font-semibold hover:text-cyan-300">Reset</button>
          </div>

          {/* Search */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Search</label>
            <input
              value={filters.q}
              onChange={(e) => updateFilter('q', e.target.value)}
              placeholder="Search model, color, store..."
              className="input h-9 text-xs"
            />
          </div>

          {/* Condition */}
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">Condition</label>
            <div className="flex flex-wrap gap-1.5">
              {LISTING_CONDITIONS.map(c => (
                <button
                  key={c.value}
                  onClick={() => {
                    const next = filters.conditions.includes(c.value)
                      ? filters.conditions.filter(x => x !== c.value)
                      : [...filters.conditions, c.value]
                    updateFilter('conditions', next)
                  }}
                  className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                    filters.conditions.includes(c.value) ? conditionClass(c.value) : 'badge-neutral hover:bg-white/10'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Price range */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-gray-500 mb-1 block">Min Price</label>
              <input
                type="number"
                value={filters.priceMin ?? ''}
                onChange={(e) => updateFilter('priceMin', e.target.value ? Number(e.target.value) : null)}
                placeholder="₹0"
                className="input h-9 text-xs"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-500 mb-1 block">Max Price</label>
              <input
                type="number"
                value={filters.priceMax ?? ''}
                onChange={(e) => updateFilter('priceMax', e.target.value ? Number(e.target.value) : null)}
                placeholder="₹2,00,000"
                className="input h-9 text-xs"
              />
            </div>
          </div>

          <button onClick={() => setFilterOpen(false)} className="btn-primary w-full h-9 text-sm">
            Apply ({filteredListings.length} results)
          </button>
        </div>
      )}

      {/* ─── Results ─── */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">{filteredListings.length} listings found</p>
      </div>

      {loading ? (
        <div className={viewMode === 'grid' ? 'grid gap-3 grid-cols-2 lg:grid-cols-4' : 'space-y-2'}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={viewMode === 'grid' ? 'h-64 skeleton' : 'h-20 skeleton'} />
          ))}
        </div>
      ) : filteredListings.length === 0 ? (
        <div className="text-center py-16">
          <Package className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--color-text-muted)' }} />
          <h3 className="font-bold mb-1" style={{ color: 'var(--color-text)' }}>No Listings Found</h3>
          <p className="text-sm text-gray-500 mb-4">Try adjusting your filters or search area.</p>
          <button onClick={resetFilters} className="btn-secondary px-5 py-2 text-sm">Clear Filters</button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          {filteredListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} formatPrice={formatPrice} onClick={() => handleListingClick(listing)} />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredListings.map((listing) => (
            <ListingRow key={listing.id} listing={listing} formatPrice={formatPrice} onClick={() => handleListingClick(listing)} />
          ))}
        </div>
      )}

      {/* Listing Details & Certified Report Modal */}
      {selectedListing && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-start justify-center overflow-y-auto py-6 px-4">
          <div className="rounded-2xl w-full max-w-3xl shadow-2xl relative border mt-8 mb-8 animate-fade-in"
            style={{
              background: 'var(--color-surface)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text)'
            }}
          >
            {/* Header */}
            <div className="p-6 border-b flex justify-between items-start gap-4" style={{ borderColor: 'var(--color-border)' }}>
              <div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase condition-${selectedListing.condition || 'good'}`}>
                  {formatListingCondition(selectedListing.condition)}
                </span>
                <h2 className="text-xl font-extrabold mt-1.5" style={{ color: 'var(--color-text)' }}>{selectedListing.title}</h2>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                  {selectedListing.model} {selectedListing.storage_gb ? `· ${selectedListing.storage_gb}GB` : ''} {selectedListing.color ? `· ${selectedListing.color}` : ''} {selectedListing.year ? `· ${selectedListing.year}` : ''}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedListing(null)
                  setReportDetails(null)
                }}
                className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
              {/* Main specifications */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl" style={{ background: 'var(--color-surface-2)' }}>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Price</p>
                  <p className="text-lg font-black" style={{ color: 'var(--color-text)' }}>{formatPrice(selectedListing.price_inr)}</p>
                  {selectedListing.mrp_inr && (
                    <p className="text-xs text-gray-500 line-through">{formatPrice(selectedListing.mrp_inr)}</p>
                  )}
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Warranty</p>
                  <p className="text-sm font-bold text-gray-200">{selectedListing.warranty_months ? `${selectedListing.warranty_months} Months` : 'No Warranty'}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Location</p>
                  <p className="text-sm font-bold text-gray-200">{selectedListing.businesses?.city || 'Local Store'}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Store</p>
                  <p className="text-sm font-bold text-gray-200 truncate">{selectedListing.businesses?.name || 'Partner'}</p>
                </div>
              </div>

              {/* Description */}
              {selectedListing.description && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Seller Notes</h4>
                  <p className="text-xs text-gray-300 leading-relaxed bg-white/5 p-3 rounded-lg border border-white/5">
                    {selectedListing.description}
                  </p>
                </div>
              )}

              {/* Certified Inspection Report Section */}
              <div className="border-t pt-6" style={{ borderColor: 'var(--color-border)' }}>
                <div className="flex items-center gap-2 mb-4">
                  <BadgeCheck className="w-5 h-5 text-cyan-400" />
                  <h3 className="font-extrabold text-sm sm:text-base" style={{ color: 'var(--color-text)' }}>Certified Verification Report</h3>
                </div>

                {loadingReport ? (
                  <div className="flex flex-col items-center justify-center py-8 space-y-2">
                    <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin" />
                    <p className="text-xs text-gray-500">Fetching inspection records...</p>
                  </div>
                ) : reportDetails ? (
                  <div className="space-y-4">
                    {/* Trust Banner */}
                    <div className="p-3 bg-cyan-950/20 border border-cyan-500/20 rounded-xl flex gap-3 text-xs text-cyan-200">
                      <Shield className="w-5 h-5 text-cyan-400 shrink-0" />
                      <div>
                        <p className="font-bold">100% Inspected &amp; Certified Device</p>
                        <p className="text-gray-400 mt-0.5">This device was sourced through our trade-in network. A certified technician performed physical, hardware, and diagnostic verifications.</p>
                      </div>
                    </div>

                    {/* Hardware verified details */}
                    <div className="grid grid-cols-2 gap-4 bg-white/5 p-4 rounded-xl border border-white/5 text-xs">
                      <div>
                        <p className="text-gray-500 uppercase tracking-wider text-[10px]">Verified Battery Health</p>
                        <p className="text-sm font-bold text-white mt-0.5">{reportDetails.request.specs?.battery_health || reportDetails.request.specs?.batteryHealth || 'N/A'}</p>
                      </div>
                      {reportDetails.request.specs?.cycle_count && (
                        <div>
                          <p className="text-gray-500 uppercase tracking-wider text-[10px]">Battery Cycle Count</p>
                          <p className="text-sm font-bold text-white mt-0.5">{reportDetails.request.specs?.cycle_count}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-gray-500 uppercase tracking-wider text-[10px]">Inspection Date</p>
                        <p className="text-sm font-bold text-white mt-0.5">
                          {new Date(reportDetails.request.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 uppercase tracking-wider text-[10px]">Technician Notes</p>
                        <p className="text-xs text-gray-300 mt-0.5 italic truncate max-w-[200px]" title={reportDetails.request.admin_notes}>
                          {reportDetails.request.admin_notes ? reportDetails.request.admin_notes.replace('Agent verification:', '').trim() : 'Verified in working condition'}
                        </p>
                      </div>
                    </div>

                    {/* Secure Data Wipe Section */}
                    {reportDetails.certificate && (
                      <div className="p-4 bg-emerald-950/20 border border-emerald-500/20 rounded-xl space-y-2">
                        <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                          <Shield className="w-4 h-4" /> Secure Data Wipe Certified
                        </div>
                        <p className="text-[11px] text-gray-400 font-medium">This device has undergone verified cryptographic erasure. All previous customer data has been securely deleted.</p>
                        <div className="grid grid-cols-2 gap-2 pt-1.5 text-[10px] text-gray-300">
                          <div>Wipe Method: <strong className="text-white">{reportDetails.certificate.wipe_method === 'factory_reset' ? 'Factory Reset' : reportDetails.certificate.wipe_method === 'disk_utility_erase' ? 'Disk Utility Erase' : 'DFU Restore'}</strong></div>
                          <div>Wiped By: <strong className="text-white">{reportDetails.certificate.wiped_by_name}</strong></div>
                          <div className="col-span-2">Cert #: <strong className="text-emerald-300 select-all font-mono">{reportDetails.certificate.certificate_number}</strong></div>
                        </div>
                      </div>
                    )}

                    {/* Condition answers check-sheet */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Inspection Checklist</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {Object.entries(reportDetails.request.condition_answers || {})
                          .filter(([key, val]) => typeof val === 'string' && key !== 'agent_verification_photos' && key !== 'defect_photos')
                          .map(([key, val]) => {
                            const label = key.replace('_condition', '').replace('_', ' ')
                            return (
                              <div key={key} className="flex justify-between items-center p-2.5 rounded bg-white/5 text-xs">
                                <span className="capitalize text-gray-400">{label}</span>
                                <span className="font-semibold text-emerald-400">✓ {val}</span>
                              </div>
                            )
                          })
                        }
                      </div>
                    </div>

                    {/* Defect Specific Proof Photos */}
                    {reportDetails.request.condition_answers?.defect_photos && Object.keys(reportDetails.request.condition_answers.defect_photos).length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400">Verified Condition Photos (Defects)</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {Object.entries(reportDetails.request.condition_answers.defect_photos).map(([key, url]) => {
                            const label = key.replace('_condition', '').replace('_', ' ')
                            return (
                              <div key={key} className="relative group rounded-lg overflow-hidden border border-white/10 bg-black">
                                <a href={url} target="_blank" rel="noopener noreferrer">
                                  <img src={url} alt={`${label} defect proof`} className="w-full aspect-square object-contain hover:scale-105 transition-transform" />
                                </a>
                                <div className="absolute bottom-0 inset-x-0 bg-black/60 p-1.5 text-center text-[10px] text-gray-300 capitalize truncate">
                                  {label}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 italic">No trade-in verification report associated with this listing. Unit was sourced directly.</p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t flex justify-end gap-3" style={{ borderColor: 'var(--color-border)' }}>
              <button
                onClick={() => {
                  setSelectedListing(null)
                  setReportDetails(null)
                }}
                className="btn-secondary text-xs h-9 px-4 cursor-pointer"
              >
                Close Details
              </button>
              <button
                onClick={() => {
                  if (selectedListing.businesses?.slug) {
                    navigate(`/store/${selectedListing.businesses.slug}`)
                  } else {
                    alert('Contact this store at: ' + (selectedListing.businesses?.name || 'Local Partner'))
                  }
                  setSelectedListing(null)
                  setReportDetails(null)
                }}
                className="btn-primary text-xs h-9 px-4 flex items-center gap-1.5 cursor-pointer"
              >
                Contact Partner Store <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ListingCard({ listing, formatPrice, onClick }) {
  const navigate = useNavigate()
  const isIPad = (listing.title || listing.model || '').toLowerCase().includes('ipad')
  const Icon = isIPad ? Tablet : Laptop
  const savings = listing.mrp_inr && listing.mrp_inr > listing.price_inr ? listing.mrp_inr - listing.price_inr : 0
  const condLabel = formatListingCondition(listing.condition)

  return (
    <div className="card-interactive p-3 group cursor-pointer" onClick={onClick}>
      {/* Image area */}
      <div className="relative h-28 sm:h-32 rounded-xl flex items-center justify-center mb-3 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, var(--color-surface-2), var(--color-surface-3))' }}>
        <Icon className="w-10 h-10 text-gray-600 group-hover:text-cyan-500 group-hover:scale-110 transition-all" />
        <span className={`absolute bottom-1.5 right-1.5 rounded-full px-2 py-0.5 text-[9px] font-bold condition-${listing.condition || 'good'}`}>
          {condLabel}
        </span>
        {savings > 0 && (
          <span className="absolute top-1.5 left-1.5 badge-success text-[9px] px-2">
            Save {formatPrice(savings)}
          </span>
        )}
      </div>

      {/* Details */}
      <h3 className="font-bold text-xs leading-snug mb-0.5 line-clamp-2" style={{ color: 'var(--color-text)' }}>{listing.title}</h3>
      <p className="text-[10px] text-gray-600 mb-2 truncate">
        {listing.model}{listing.storage_gb ? ` · ${listing.storage_gb}GB` : ''}{listing.color ? ` · ${listing.color}` : ''}
      </p>
      
      <div className="flex items-end justify-between">
        <div>
          <p className="text-base font-extrabold" style={{ color: 'var(--color-text)' }}>{formatPrice(listing.price_inr)}</p>
          {listing.mrp_inr && <p className="text-[10px] text-gray-600 line-through">{formatPrice(listing.mrp_inr)}</p>}
        </div>
      </div>

      {listing.businesses && (
        <div className="mt-2 pt-2 flex items-center gap-1.5" style={{ borderTop: '1px solid var(--color-border)' }}>
          <Building2 className="w-3 h-3 text-gray-600 shrink-0" />
          <span className="text-[10px] text-gray-500 truncate">{listing.businesses.name}</span>
          {listing.businesses.city && (
            <span className="text-[10px] text-gray-600 shrink-0">· {listing.businesses.city}</span>
          )}
        </div>
      )}
    </div>
  )
}

function ListingRow({ listing, formatPrice, onClick }) {
  const isIPad = (listing.title || listing.model || '').toLowerCase().includes('ipad')
  const Icon = isIPad ? Tablet : Laptop
  const condLabel = formatListingCondition(listing.condition)

  return (
    <div className="card-interactive flex items-center gap-3 p-3 cursor-pointer" onClick={onClick}>
      <div className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--color-surface-2)' }}>
        <Icon className="w-6 h-6 text-gray-600" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-xs truncate" style={{ color: 'var(--color-text)' }}>{listing.title}</h3>
        <p className="text-[10px] text-gray-500 truncate">
          {listing.model}{listing.storage_gb ? ` · ${listing.storage_gb}GB` : ''}
          {listing.businesses ? ` · ${listing.businesses.name}` : ''}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="font-extrabold text-sm" style={{ color: 'var(--color-text)' }}>{formatPrice(listing.price_inr)}</p>
        <span className={`text-[9px] font-semibold condition-${listing.condition || 'good'} px-2 py-0.5 rounded-full`}>
          {condLabel}
        </span>
      </div>
    </div>
  )
}