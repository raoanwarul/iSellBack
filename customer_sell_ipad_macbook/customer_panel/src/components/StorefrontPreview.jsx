import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Laptop,
  MapPin,
  ShieldCheck,
  Smartphone,
  Star,
  Store,
  Tag,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import {
  fetchFeaturedBusinesses,
  fetchFeaturedListings,
  formatListingCondition,
  getListingCategory,
} from '../lib/storefront'

const CONDITION_TONE = {
  like_new: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  excellent: 'bg-blue-50 text-blue-700 border-blue-100',
  good: 'bg-amber-50 text-amber-700 border-amber-100',
  fair: 'bg-rose-50 text-rose-700 border-rose-100',
}

function price(value) {
  if (!value) return '₹0'
  return `₹${Number(value).toLocaleString('en-IN')}`
}

export default function StorefrontPreview({ variant = 'landing' }) {
  const navigate = useNavigate()
  const isCompact = variant === 'dashboard'
  const [listings, setListings] = useState([])
  const [businesses, setBusinesses] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function loadStorefront() {
      setIsLoading(true)
      const [nextListings, nextBusinesses] = await Promise.all([
        fetchFeaturedListings(supabase, isCompact ? 4 : 6),
        fetchFeaturedBusinesses(supabase, isCompact ? 3 : 4),
      ])

      if (!isMounted) return
      setListings(nextListings)
      setBusinesses(nextBusinesses)
      setIsLoading(false)
    }

    loadStorefront()
    return () => {
      isMounted = false
    }
  }, [isCompact])

  const coveredCities = useMemo(() => {
    const cities = new Set()
    businesses.forEach((business) => {
      if (business?.city) cities.add(business.city)
    })
    listings.forEach((listing) => {
      if (listing?.businesses?.city) cities.add(listing.businesses.city)
    })
    return cities.size
  }, [businesses, listings])

  return (
    <section id={isCompact ? undefined : 'storefront'} className={isCompact ? 'space-y-4' : 'py-20 sm:py-24 bg-gray-50/60'}>
      <div className={isCompact ? '' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-indigo-600 font-semibold text-sm uppercase tracking-wider mb-3">
              {isCompact ? 'Storefront' : 'Verified Store Inventory'}
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">
              {isCompact ? 'Browse verified partner inventory' : 'Sell a device or shop verified store listings'}
            </h2>
            <p className="text-base text-gray-500 max-w-3xl leading-relaxed">
              {isCompact
                ? 'Your home screen now includes active inventory from partner businesses, not just the sell flow.'
                : 'Inspired by Apple Trade Hub, the homepage now supports both sides of the marketplace: sell to the right business, or browse live inventory uploaded by verified store partners.'}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              onClick={() => navigate('/shop')}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gray-900 px-5 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-gray-800"
            >
              Browse all listings
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate('/dashboard/sell')}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-indigo-100 bg-white px-5 py-3 text-sm font-semibold text-indigo-700 transition hover:border-indigo-200 hover:bg-indigo-50"
            >
              Sell your device
              <Tag className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className={`mt-8 grid gap-5 ${isCompact ? 'xl:grid-cols-[1.15fr,0.85fr]' : 'xl:grid-cols-[1.2fr,0.8fr]'}`}>
          <div className="space-y-5">
            {isLoading ? (
              <div className={`grid gap-4 ${isCompact ? 'sm:grid-cols-2' : 'sm:grid-cols-2 xl:grid-cols-3'}`}>
                {Array.from({ length: isCompact ? 4 : 6 }).map((_, index) => (
                  <div key={index} className="h-52 animate-pulse rounded-3xl border border-gray-100 bg-white" />
                ))}
              </div>
            ) : listings.length > 0 ? (
              <div className={`grid gap-4 ${isCompact ? 'sm:grid-cols-2' : 'sm:grid-cols-2 xl:grid-cols-3'}`}>
                {listings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} compact={isCompact} onOpenShop={() => navigate('/shop')} />
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-8 text-center shadow-sm">
                <Store className="w-10 h-10 mx-auto text-gray-300 mb-3" />
                <h3 className="text-lg font-bold text-gray-900">Store listings will appear here</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500 max-w-lg mx-auto">
                  As soon as partner businesses publish active inventory, customers will be able to discover those MacBooks and iPads directly from the homepage.
                </p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="overflow-hidden rounded-[28px] bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 p-6 text-white shadow-2xl shadow-indigo-950/20">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-indigo-200">Marketplace status</p>
                  <h3 className="mt-2 text-2xl font-extrabold tracking-tight">Verified partner storefronts</h3>
                </div>
                <BadgeCheck className="w-8 h-8 text-emerald-300" />
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3">
                {[
                  { label: 'Active listings', value: listings.length },
                  { label: 'Partner stores', value: businesses.length },
                  { label: 'Cities covered', value: coveredCities },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-3 text-center">
                    <p className="text-2xl font-extrabold">{item.value}</p>
                    <p className="mt-1 text-[11px] uppercase tracking-wide text-white/55">{item.label}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-relaxed text-white/70">
                Listings shown here come from active businesses. That means the customer sees both the sell flow and the buy-from-store flow on the same home journey.
              </div>
            </div>

            <div className="grid gap-3">
              {businesses.length > 0 ? (
                businesses.map((business) => <BusinessCard key={business.id} business={business} onBrowse={() => navigate('/shop')} />)
              ) : (
                <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">Verified businesses coming soon</h3>
                      <p className="text-xs text-gray-500">Once business onboarding and listings are live, featured store cards will show here.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function ListingCard({ listing, compact, onOpenShop }) {
  const category = getListingCategory(listing)
  const Icon = category === 'ipad' ? Smartphone : Laptop
  const businessName = listing?.businesses?.name || 'Verified partner store'
  const businessCity = listing?.businesses?.city || 'India'
  const savings = listing?.mrp_inr && listing.mrp_inr > listing.price_inr
    ? listing.mrp_inr - listing.price_inr
    : 0

  return (
    <div
      onClick={onOpenShop}
      className="group cursor-pointer rounded-[28px] border border-gray-100 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-100/50"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 text-gray-500 group-hover:from-indigo-50 group-hover:to-purple-50 group-hover:text-indigo-600">
          <Icon className="w-6 h-6" />
        </div>
        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${CONDITION_TONE[listing.condition] || 'bg-gray-50 text-gray-700 border-gray-100'}`}>
          {formatListingCondition(listing.condition)}
        </span>
      </div>
      <div className="mt-4">
        <h3 className="text-base font-bold leading-snug text-gray-900 line-clamp-2">{listing.title}</h3>
        <p className="mt-1 text-xs text-gray-500 line-clamp-1">
          {listing.model}
          {listing.storage_gb ? ` · ${listing.storage_gb}GB` : ''}
          {listing.color ? ` · ${listing.color}` : ''}
          {listing.year ? ` · ${listing.year}` : ''}
        </p>
      </div>
      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-2xl font-extrabold tracking-tight text-gray-900">{price(listing.price_inr)}</p>
          {listing.mrp_inr ? (
            <p className="text-xs text-gray-400 line-through">{price(listing.mrp_inr)}</p>
          ) : null}
        </div>
        {savings > 0 ? (
          <div className="rounded-2xl bg-emerald-50 px-3 py-2 text-right">
            <p className="text-[10px] uppercase tracking-wide text-emerald-600">Savings</p>
            <p className="text-sm font-bold text-emerald-700">{price(savings)}</p>
          </div>
        ) : null}
      </div>
      <div className={`mt-4 flex items-center justify-between gap-3 border-t border-gray-100 pt-4 ${compact ? 'text-xs' : 'text-sm'}`}>
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 truncate">{businessName}</p>
          <p className="mt-1 flex items-center gap-1 text-gray-500 truncate">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            {businessCity}
          </p>
        </div>
        <div className="text-right text-gray-500">
          <p className="font-semibold text-gray-700">{listing.warranty_months || 0} mo</p>
          <p className="text-[11px]">Warranty</p>
        </div>
      </div>
    </div>
  )
}

function BusinessCard({ business, onBrowse }) {
  return (
    <div className="rounded-[28px] border border-gray-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-100/40">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
          {business.logo_url ? (
            <img src={business.logo_url} alt={business.name} className="h-full w-full rounded-2xl object-cover" />
          ) : (
            <Building2 className="w-5 h-5" />
          )}
        </div>
        <div className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
          Verified store
        </div>
      </div>
      <div className="mt-4">
        <h3 className="text-base font-bold text-gray-900">{business.name}</h3>
        <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
          <MapPin className="w-3.5 h-3.5" />
          {business.city || 'India'}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-gray-500 line-clamp-2">
          {business.short_description || 'Active Apple partner storefront with live MacBook and iPad inventory.'}
        </p>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-gray-100 pt-4">
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 font-semibold text-amber-700">
            <Star className="w-3 h-3" />
            {business.google_rating ? Number(business.google_rating).toFixed(1) : '4.8'}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-1 font-semibold text-indigo-700">
            <ShieldCheck className="w-3 h-3" />
            Trust {Math.round(Number(business.trust_score || 92))}
          </span>
        </div>
        <button
          onClick={onBrowse}
          className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
        >
          Browse
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}