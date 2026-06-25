import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useStore } from '../store/useStore'
import {
  MapPin, Star, Search, Phone, Shield, Package,
  ChevronRight, Building2, RefreshCw, Laptop, Truck,
  BadgeCheck, ExternalLink,
} from 'lucide-react'

export default function Stores() {
  const navigate = useNavigate()
  const { setSelectedBusinessId } = useStore()
  const [businesses, setBusinesses] = useState([])
  const [loading, setLoading] = useState(true)
  const [pincode, setPincode] = useState('')
  const [searchedPin, setSearchedPin] = useState('')

  const loadBusinesses = useCallback(async (pin = null) => {
    setLoading(true)
    try {
      let result
      if (pin) {
        const { data } = await supabase.rpc('get_businesses_by_area', {
          p_pincode: pin,
          p_limit: 30,
        })
        result = data
      } else {
        const { data } = await supabase
          .from('businesses')
          .select(
            'id, slug, name, city, short_description, trust_score, google_rating, logo_url, delivery_options, storefront_address, whatsapp_number, phone, is_featured'
          )
          .eq('status', 'active')
          .order('is_featured', { ascending: false })
          .limit(30)
        result = data
      }
      setBusinesses(result || [])
    } catch (e) {
      console.error('Stores load error:', e)
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadBusinesses() }, [loadBusinesses])

  const handleSearch = () => {
    if (!pincode.trim()) return
    setSearchedPin(pincode.trim())
    loadBusinesses(pincode.trim())
  }

  const handleSellHere = (biz) => {
    setSelectedBusinessId(biz.id)
    navigate('/dashboard/sell')
  }

  const handleViewListings = (biz) => {
    navigate(`/shop?store=${biz.slug || biz.id}`)
  }

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* ─── Header ─── */}
      <div
        className="relative rounded-2xl p-5 sm:p-6 overflow-hidden noise-overlay"
        style={{ background: 'var(--color-surface)' }}
      >
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.14) 0%, rgba(139,92,246,0.09) 60%, rgba(16,185,129,0.07) 100%)' }}
        />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium badge-primary mb-3">
            <Building2 className="w-3 h-3" /> Certified Partner Stores
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold mb-1" style={{ color: 'var(--color-text)' }}>
            Find a Store Near You
          </h1>
          <p className="text-sm max-w-md mb-4" style={{ color: 'var(--color-text-muted)' }}>
            Browse our certified buyback partners. Visit in person or schedule a doorstep pickup.
          </p>
          {/* Pincode search */}
          <div className="flex items-center gap-2 max-w-sm">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-500" />
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Enter pincode to find nearby"
                className="input h-10 pl-10 pr-3 text-sm"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={!pincode.trim()}
              className="btn-primary h-10 px-4 text-sm disabled:opacity-50 flex items-center gap-1.5"
            >
              <Search className="w-4 h-4" />
              Search
            </button>
            {searchedPin && (
              <button
                onClick={() => { setPincode(''); setSearchedPin(''); loadBusinesses() }}
                className="btn-secondary h-10 px-3 text-sm flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {searchedPin && (
            <p className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>
              Showing stores near <strong>{searchedPin}</strong>
            </p>
          )}
        </div>
      </div>

      {/* ─── Results count ─── */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
          {loading ? 'Loading stores...' : `${businesses.length} partner store${businesses.length !== 1 ? 's' : ''} found`}
        </p>
      </div>

      {/* ─── Stores Grid ─── */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-52 skeleton" />
          ))}
        </div>
      ) : businesses.length === 0 ? (
        <div className="text-center py-16 card">
          <Building2 className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--color-text-muted)' }} />
          <h3 className="font-bold mb-1" style={{ color: 'var(--color-text)' }}>No Stores Found</h3>
          <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
            {searchedPin
              ? `No partner stores near pincode ${searchedPin}. Try a different area.`
              : 'No stores available at the moment.'}
          </p>
          {searchedPin && (
            <button
              onClick={() => { setPincode(''); setSearchedPin(''); loadBusinesses() }}
              className="btn-secondary px-5 py-2 text-sm"
            >
              Show All Stores
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {businesses.map((biz) => (
            <StoreCard
              key={biz.id}
              biz={biz}
              onSellHere={() => handleSellHere(biz)}
              onViewListings={() => handleViewListings(biz)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function StoreCard({ biz, onSellHere, onViewListings }) {
  const hasDelivery = biz.delivery_options?.includes('doorstep') || biz.delivery_options?.doorstep
  const hasWalkIn = biz.delivery_options?.includes('walkin') || biz.delivery_options?.walk_in

  return (
    <div className="card-glow flex flex-col overflow-hidden">
      {/* Store header */}
      <div
        className="p-4 pb-3"
        style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.08), rgba(139,92,246,0.05))' }}
      >
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-black text-lg shrink-0"
            style={{ background: 'linear-gradient(135deg, #0891B2, #7C3AED)' }}
          >
            {biz.logo_url ? (
              <img src={biz.logo_url} alt={biz.name} className="w-full h-full object-cover rounded-xl" />
            ) : (
              (biz.name?.[0] || 'S').toUpperCase()
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <h3 className="font-bold text-sm truncate" style={{ color: 'var(--color-text)' }}>
                {biz.name}
              </h3>
              {biz.trust_score >= 4 && (
                <BadgeCheck className="w-4 h-4 text-cyan-500 shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-2">
              {biz.city && (
                <span className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                  <MapPin className="w-3 h-3" /> {biz.city}
                </span>
              )}
              {biz.google_rating && (
                <span className="flex items-center gap-0.5 text-[11px] font-semibold text-amber-500">
                  <Star className="w-3 h-3 fill-amber-500" />
                  {Number(biz.google_rating).toFixed(1)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 pt-3 flex flex-col flex-1 gap-3">
        {biz.short_description && (
          <p className="text-xs line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>
            {biz.short_description}
          </p>
        )}

        {/* Address */}
        {biz.storefront_address && (
          <div className="flex items-start gap-2">
            <MapPin className="w-3.5 h-3.5 text-cyan-500 mt-0.5 shrink-0" />
            <p className="text-[11px] leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
              {biz.storefront_address}
            </p>
          </div>
        )}

        {/* Delivery options */}
        <div className="flex flex-wrap gap-1.5">
          {hasDelivery && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold badge-success">
              <Truck className="w-3 h-3" /> Doorstep Pickup
            </span>
          )}
          {hasWalkIn && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold badge-info">
              <Building2 className="w-3 h-3" /> Walk-in
            </span>
          )}
          {!hasDelivery && !hasWalkIn && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold badge-neutral">
              <Shield className="w-3 h-3" /> Certified Store
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-auto pt-1">
          <button
            onClick={onSellHere}
            className="flex-1 btn-primary py-2 text-xs flex items-center justify-center gap-1.5"
          >
            <Laptop className="w-3.5 h-3.5" /> Sell Here
          </button>
          <button
            onClick={onViewListings}
            className="flex-1 btn-secondary py-2 text-xs flex items-center justify-center gap-1.5"
          >
            <Package className="w-3.5 h-3.5" /> View Devices
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {/* WhatsApp */}
        {biz.whatsapp_number && (
          <a
            href={`https://wa.me/${biz.whatsapp_number.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-[11px] font-semibold text-green-600 hover:bg-green-50 transition-colors"
            style={{ border: '1px solid rgba(22,163,74,0.2)' }}
          >
            <Phone className="w-3 h-3" /> WhatsApp Store
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  )
}
