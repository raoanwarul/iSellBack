import { useState, useEffect, useRef, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Search, MapPin, ArrowRight, Store, ShoppingBag,
  Shield, Zap, Truck, CreditCard, Laptop, Tablet,
  ChevronRight, Star, BadgeCheck, CheckCircle2, ChevronDown,
  Menu, X, Sparkles, Building2, ArrowUpRight,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useStore } from '../store/useStore'
import ThemeToggle from '../components/ThemeToggle'
import { adminUrl, agentUrl } from '../lib/panelUrls'

// Decorative floral SVG elements
const FloralCornerTL = () => (
  <svg className="absolute top-0 left-0 w-32 h-32 sm:w-48 sm:h-48 opacity-[0.06] pointer-events-none" viewBox="0 0 200 200" fill="none">
    <path d="M0 0 C40 10, 60 40, 50 80 C40 60, 20 50, 0 60Z" fill="currentColor" style={{ color: 'var(--color-primary)' }} />
    <path d="M10 0 C50 20, 80 60, 70 100 C55 75, 30 55, 0 50Z" fill="currentColor" style={{ color: 'var(--color-primary)', opacity: 0.5 }} />
    <circle cx="25" cy="25" r="3" fill="currentColor" style={{ color: 'var(--color-primary)', opacity: 0.4 }} />
    <circle cx="50" cy="15" r="2" fill="currentColor" style={{ color: 'var(--color-primary)', opacity: 0.3 }} />
    <path d="M5 0 Q20 25 10 50 Q5 30 0 20Z" fill="currentColor" style={{ color: 'var(--color-accent)', opacity: 0.3 }} />
  </svg>
)
const FloralCornerBR = () => (
  <svg className="absolute bottom-0 right-0 w-32 h-32 sm:w-48 sm:h-48 opacity-[0.06] pointer-events-none rotate-180" viewBox="0 0 200 200" fill="none">
    <path d="M0 0 C40 10, 60 40, 50 80 C40 60, 20 50, 0 60Z" fill="currentColor" style={{ color: 'var(--color-primary)' }} />
    <path d="M10 0 C50 20, 80 60, 70 100 C55 75, 30 55, 0 50Z" fill="currentColor" style={{ color: 'var(--color-primary)', opacity: 0.5 }} />
    <circle cx="25" cy="25" r="3" fill="currentColor" style={{ color: 'var(--color-primary)', opacity: 0.4 }} />
    <path d="M5 0 Q20 25 10 50 Q5 30 0 20Z" fill="currentColor" style={{ color: 'var(--color-accent)', opacity: 0.3 }} />
  </svg>
)
const FloralCornerTR = () => (
  <svg className="absolute top-0 right-0 w-24 h-24 sm:w-36 sm:h-36 opacity-[0.05] pointer-events-none" viewBox="0 0 200 200" fill="none" style={{ transform: 'scaleX(-1)' }}>
    <path d="M0 0 C40 10, 60 40, 50 80 C40 60, 20 50, 0 60Z" fill="currentColor" style={{ color: 'var(--color-primary)' }} />
    <circle cx="30" cy="20" r="4" fill="currentColor" style={{ color: 'var(--color-accent)', opacity: 0.4 }} />
    <path d="M15 5 Q35 30 25 55 Q15 35 5 25Z" fill="currentColor" style={{ color: 'var(--color-primary)', opacity: 0.4 }} />
  </svg>
)
const LeafDivider = () => (
  <div className="flex items-center justify-center gap-3 py-2 opacity-30">
    <svg width="24" height="12" viewBox="0 0 24 12" fill="none">
      <path d="M0 6 Q6 0 12 6 Q18 12 24 6" stroke="currentColor" strokeWidth="1" style={{ color: 'var(--color-primary)' }} />
    </svg>
    <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor" style={{ color: 'var(--color-primary)' }}>
      <circle cx="4" cy="4" r="2" />
    </svg>
    <svg width="24" height="12" viewBox="0 0 24 12" fill="none">
      <path d="M0 6 Q6 12 12 6 Q18 0 24 6" stroke="currentColor" strokeWidth="1" style={{ color: 'var(--color-primary)' }} />
    </svg>
  </div>
)

function useReveal() {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add('visible'); observer.unobserve(el) } },
      { threshold: 0.12 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return ref
}

function Reveal({ children, className = '', type = 'reveal', delay = '' }) {
  const ref = useReveal()
  return <div ref={ref} className={`${type} ${delay} ${className}`}>{children}</div>
}

export default function LandingPage() {
  const navigate = useNavigate()
  const { isAuthenticated, checkAuth } = useStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [pincode, setPincode] = useState('')
  const [listings, setListings] = useState([])
  const [businesses, setBusinesses] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchDone, setSearchDone] = useState(false)
  const [listingCategory, setListingCategory] = useState('all')
  const [faqOpenIndex, setFaqOpenIndex] = useState(null)
  const [screenshotIndex, setScreenshotIndex] = useState(0)

  // Filter listings by category for in-place filtering
  const filteredLandingListings = useMemo(() => {
    if (listingCategory === 'all') return listings
    return listings.filter(l => {
      const deviceType = l.device_type || l.title || l.model || ''
      if (listingCategory === 'macbook') return deviceType.toLowerCase().includes('macbook')
      if (listingCategory === 'ipad') return deviceType.toLowerCase().includes('ipad')
      return true
    })
  }, [listings, listingCategory])

  useEffect(() => { checkAuth() }, [checkAuth])

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Load initial featured data
  useEffect(() => {
    async function loadInitial() {
      try {
        const [listRes, bizRes] = await Promise.all([
          supabase.from('listings').select('id, title, model, storage_gb, color, condition, price_inr, mrp_inr, device_type, business_id, created_at, businesses(name, city, slug, trust_score, google_rating)').eq('status', 'active').order('created_at', { ascending: false }).limit(8),
          supabase.from('businesses').select('id, slug, name, city, short_description, trust_score, google_rating, logo_url, is_featured, delivery_options').eq('status', 'active').order('is_featured', { ascending: false }).limit(6),
        ])
        setListings(listRes.data || [])
        setBusinesses(bizRes.data || [])
      } catch (e) { console.error(e) }
      setIsLoading(false)
    }
    loadInitial()
  }, [])

  const handleAreaSearch = async () => {
    if (!pincode.trim()) return
    setIsLoading(true)
    setSearchDone(true)
    try {
      const [listRes, bizRes] = await Promise.all([
        supabase.rpc('get_listings_by_area', { p_pincode: pincode.trim(), p_limit: 12 }),
        supabase.rpc('get_businesses_by_area', { p_pincode: pincode.trim(), p_limit: 8 }),
      ])
      setListings(listRes.data || [])
      setBusinesses(bizRes.data || [])
    } catch (e) {
      console.error('Area search failed:', e)
    }
    setIsLoading(false)
  }

  const formatPrice = (p) => '₹' + Number(p || 0).toLocaleString('en-IN')
  const conditionClass = (c) => `condition-${c || 'good'}`
  const conditionLabel = (c) => ({ like_new: 'Like New', excellent: 'Excellent', good: 'Good', fair: 'Fair' })[c] || 'Good'

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      {/* ─── NAVIGATION ─── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'glass-strong shadow-lg shadow-black/20' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--gradient-cta)' }}>
                <span className="text-white font-black text-xs">BE</span>
              </div>
              <span className="text-lg font-extrabold text-gradient">BuyBack Elite</span>
            </Link>

            <div className="hidden md:flex items-center gap-2">
              {['Marketplace', 'How It Works', 'Stores', 'FAQ'].map(item => (
                <a key={item} href={`#${item.toLowerCase().replace(/ /g, '-')}`}
                  className="px-3 py-2 text-sm font-medium rounded-xl transition-all"
                  style={{ color: 'var(--color-text-muted)' }}
                  onMouseEnter={e => { e.target.style.color = 'var(--color-primary)'; e.target.style.background = 'var(--color-primary-glow)' }}
                  onMouseLeave={e => { e.target.style.color = 'var(--color-text-muted)'; e.target.style.background = 'transparent' }}>
                  {item}
                </a>
              ))}
              <div className="w-px h-5 mx-1" style={{ background: 'var(--color-border)' }} />
              <a href={adminUrl('/login')} target="_blank" rel="noopener noreferrer"
                className="px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5"
                style={{ background: 'rgba(124,58,237,0.1)', color: '#8B5CF6', border: '1px solid rgba(124,58,237,0.2)' }}>
                <Building2 className="w-3.5 h-3.5" /> Store Login
              </a>
              <a href={agentUrl('/login')} target="_blank" rel="noopener noreferrer"
                className="px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5"
                style={{ background: 'rgba(234,88,12,0.1)', color: '#EA580C', border: '1px solid rgba(234,88,12,0.2)' }}>
                <Truck className="w-3.5 h-3.5" /> Agent Login
              </a>
            </div>

            <div className="hidden sm:flex items-center gap-2">
              <ThemeToggle />
              {isAuthenticated ? (
                <>
                  <button onClick={() => navigate('/dashboard')} className="btn-secondary px-4 py-2 text-sm">Dashboard</button>
                  <button onClick={() => navigate('/dashboard/sell')} className="btn-primary px-5 py-2.5 text-sm">Sell Now</button>
                </>
              ) : (
                <>
                  <Link to="/login" className="font-medium px-4 py-2 rounded-xl transition-all text-sm" style={{ color: 'var(--color-text-secondary)' }}>Login</Link>
                  <button onClick={() => navigate('/dashboard/sell')} className="btn-primary px-5 py-2.5 text-sm flex items-center gap-2">
                    Sell Now <ArrowRight className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>

            <button className="sm:hidden p-2 rounded-xl transition-colors" style={{ color: 'var(--color-text-secondary)' }} onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="sm:hidden py-4 space-y-1 animate-fade-in" style={{ borderTop: '1px solid var(--color-border)' }}>
              {['Marketplace', 'How It Works', 'Stores'].map(item => (
                <a key={item} href={`#${item.toLowerCase().replace(/ /g, '-')}`}
                  className="block px-4 py-2.5 rounded-xl text-sm font-medium"
                  style={{ color: 'var(--color-text-muted)' }}
                  onClick={() => setMobileMenuOpen(false)}>{item}</a>
              ))}
              <div className="pt-3 space-y-2" style={{ borderTop: '1px solid var(--color-border)' }}>
                <button onClick={() => { navigate('/dashboard/sell'); setMobileMenuOpen(false) }}
                  className="w-full btn-primary px-4 py-2.5 text-sm">Sell Now</button>
                <a href={adminUrl('/register')} target="_blank" rel="noopener noreferrer"
                  className="block w-full text-center px-4 py-2.5 text-sm font-bold rounded-xl transition-all"
                  style={{ background: 'rgba(124,58,237,0.1)', color: '#8B5CF6', border: '1px solid rgba(124,58,237,0.2)' }}>
                  🏪 Register Your Store
                </a>
                <a href={agentUrl('/login')} target="_blank" rel="noopener noreferrer"
                  className="block w-full text-center px-4 py-2.5 text-sm font-bold rounded-xl transition-all"
                  style={{ background: 'rgba(234,88,12,0.1)', color: '#EA580C', border: '1px solid rgba(234,88,12,0.2)' }}>
                  🚚 Agent Login
                </a>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="landing-hero relative pt-28 pb-16 lg:pt-36 lg:pb-24">
        {/* Floral corner decorations */}
        <FloralCornerTL />
        <FloralCornerBR />
        <FloralCornerTR />

        <div className="absolute top-32 left-10 w-80 h-80 rounded-full blur-[120px] animate-blob" style={{ background: 'rgba(8,145,178,0.06)' }} />
        <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full blur-[120px] animate-blob" style={{ background: 'rgba(124,58,237,0.04)', animationDelay: '3s' }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 badge-primary px-4 py-1.5 rounded-full text-xs font-semibold mb-6 animate-fade-in-up">
              <Sparkles className="w-3.5 h-3.5" />
              India's Apple Device Marketplace
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <span style={{ color: 'var(--color-text)' }}>Buy & Sell</span>{' '}
              <span className="text-gradient">Pre-Owned MacBook & iPad</span>{' '}
              <span style={{ color: 'var(--color-text)' }}>Near You</span>
            </h1>

            <p className="text-lg mb-8 max-w-xl mx-auto leading-relaxed animate-fade-in-up" style={{ color: 'var(--color-text-secondary)', animationDelay: '0.2s' }}>
              Find verified stores in your area. Browse certified MacBooks & iPads, sell your device for the best price, or exchange — all from trusted local partners.
            </p>


            {/* ─── AREA SEARCH ─── */}
            <div className="max-w-lg mx-auto animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <div className="relative flex items-center gap-2 p-2 rounded-2xl glass" style={{ background: 'rgba(17,24,39,0.7)' }}>
                <div className="relative flex-1">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400" />
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                    onKeyDown={(e) => e.key === 'Enter' && handleAreaSearch()}
                    placeholder="Enter your pincode..."
                    className="w-full h-12 pl-11 pr-4 bg-transparent text-white text-sm font-medium outline-none placeholder:text-gray-500"
                  />
                </div>
                <button
                  onClick={handleAreaSearch}
                  disabled={!pincode.trim()}
                  className="btn-primary h-12 px-6 text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                >
                  <Search className="w-4 h-4" />
                  <span className="hidden sm:inline">Find Stores</span>
                </button>
              </div>
              {searchDone && (
                <p className="mt-3 text-xs text-gray-500">
                  Showing {listings.length} listings from {businesses.length} stores near {pincode}
                </p>
              )}
            </div>

            {/* Quick Actions */}
            <div className="mt-8 flex flex-wrap gap-3 justify-center animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              <button onClick={() => navigate('/shop')} className="flex items-center gap-2 btn-secondary px-5 py-2.5 text-sm">
                <Store className="w-4 h-4 text-cyan-400" /> Browse Marketplace
              </button>
              <button onClick={() => navigate('/dashboard/sell')} className="flex items-center gap-2 btn-sell px-5 py-2.5 text-sm">
                <ShoppingBag className="w-4 h-4" /> Sell Your Device
              </button>
            </div>

            {/* Trust indicators */}
            <div className="mt-10 flex items-center gap-6 justify-center animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
              {[
                { icon: Shield, text: 'Verified Stores', color: 'text-emerald-400' },
                { icon: Zap, text: 'Instant Quote', color: 'text-amber-400' },
                { icon: Truck, text: 'Free Pickup', color: 'text-cyan-400' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-gray-500">
                  <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <LeafDivider />

      {/* ─── APP SCREENSHOT SLIDER ─── */}
      <section className="py-20 relative overflow-hidden" style={{ background: 'var(--color-surface-2)' }}>
        <div className="absolute inset-0 noise-overlay pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            {/* Left side info */}
            <div className="lg:col-span-5 space-y-6">
              <Reveal>
                <p style={{ color: 'var(--color-primary)' }} className="font-semibold text-xs uppercase tracking-wider mb-2">Mobile Application</p>
                <h2 className="text-3xl sm:text-4xl font-extrabold leading-tight" style={{ color: 'var(--color-text)' }}>
                  A Seamless <span className="text-gradient">Mobile-First</span> Experience
                </h2>
                <p className="text-sm sm:text-base mt-4" style={{ color: 'var(--color-text-muted)' }}>
                  Track your device pickups, verify conditions in real-time, and download secure wipe certificates from any device. Optimized for mobile viewports.
                </p>
              </Reveal>

              <div className="space-y-3">
                {[
                  { title: "Device Valuation Engine", desc: "Select device conditions and instantly check pricing from local stores." },
                  { title: "Doorstep Verification Tracking", desc: "Know exactly when the agent is arriving with real-time status updates." },
                  { title: "Secure Digital Wipe Certificates", desc: "Get certificates confirming successful sanitization of your private data." }
                ].map((screen, idx) => {
                  const isActive = screenshotIndex === idx;
                  return (
                    <Reveal key={idx} delay={`stagger-${idx + 1}`}>
                      <div 
                        onClick={() => setScreenshotIndex(idx)}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all duration-300 ${
                          isActive ? 'border-cyan-500 bg-white dark:bg-white/5 shadow-md shadow-cyan-500/5' : 'border-transparent hover:bg-stone-50/50 dark:hover:bg-white/[0.01]'
                        }`}
                      >
                        <h4 className="font-bold text-xs sm:text-sm flex items-center gap-2" style={{ color: isActive ? 'var(--color-primary)' : 'var(--color-text)' }}>
                          <span className="w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-bold" style={{ 
                            background: isActive ? 'var(--color-primary-glow)' : 'var(--color-border)',
                            color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)'
                          }}>
                            {idx + 1}
                          </span>
                          {screen.title}
                        </h4>
                        {isActive && (
                          <p className="text-xs mt-2 pl-7 animate-fadeIn" style={{ color: 'var(--color-text-muted)' }}>
                            {screen.desc}
                          </p>
                        )}
                      </div>
                    </Reveal>
                  );
                })}
              </div>
            </div>

            {/* Right side phone mockup */}
            <div className="lg:col-span-7 flex justify-center">
              <Reveal type="scale">
                {/* Phone container */}
                <div 
                  className="w-[280px] h-[560px] rounded-[40px] border-8 border-stone-800 dark:border-stone-900 shadow-2xl relative overflow-hidden flex flex-col bg-stone-950"
                  style={{ boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}
                >
                  {/* Speaker notch */}
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-4 bg-stone-800 dark:bg-stone-900 rounded-full z-30 flex items-center justify-center">
                    <div className="w-12 h-1 bg-stone-750 rounded-full mb-1" />
                  </div>

                  {/* Phone screen slider */}
                  <div className="flex-1 flex flex-col relative z-20 pt-8 pb-4 px-4 overflow-hidden">
                    {/* Simulated Screen 1: Estimate */}
                    {screenshotIndex === 0 && (
                      <div className="flex-1 flex flex-col text-white animate-fadeIn">
                        <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                          <span className="text-[10px] font-black tracking-widest text-cyan-400">BE ESTIMATE</span>
                          <span className="text-[9px] text-gray-500">₹ INR</span>
                        </div>
                        <h4 className="text-xs font-black uppercase mb-3">Valuation Questionnaire</h4>
                        
                        <div className="space-y-2.5 flex-1">
                          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
                            <p className="text-[9px] uppercase tracking-wider text-gray-400 font-bold">Pick Device</p>
                            <p className="text-xs font-bold">MacBook Pro 14" M2</p>
                          </div>

                          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
                            <p className="text-[9px] uppercase tracking-wider text-gray-400 font-bold">Does screen turn on?</p>
                            <div className="flex gap-2">
                              <span className="text-[9px] font-bold px-3 py-1 rounded bg-cyan-500 text-white">Yes</span>
                              <span className="text-[9px] font-bold px-3 py-1 rounded bg-white/5 border border-white/10 text-gray-400">No</span>
                            </div>
                          </div>

                          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
                            <p className="text-[9px] uppercase tracking-wider text-gray-400 font-bold">Are there screen lines?</p>
                            <div className="flex gap-2">
                              <span className="text-[9px] font-bold px-3 py-1 rounded bg-white/5 border border-white/10 text-gray-400">Yes</span>
                              <span className="text-[9px] font-bold px-3 py-1 rounded bg-cyan-500 text-white">No</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-auto p-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl text-center shadow-lg">
                          <p className="text-[9px] uppercase font-bold text-white/70">Estimated Payout</p>
                          <p className="text-lg font-black text-white mt-0.5">₹58,700</p>
                        </div>
                      </div>
                    )}

                    {/* Simulated Screen 2: Pickup */}
                    {screenshotIndex === 1 && (
                      <div className="flex-1 flex flex-col text-white animate-fadeIn">
                        <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                          <span className="text-[10px] font-black tracking-widest text-amber-400">TRACK PICKUP</span>
                          <span className="text-[9px] text-gray-500">Live Status</span>
                        </div>
                        <h4 className="text-xs font-black uppercase mb-2">Doorstep Inspection</h4>

                        {/* Simulated Mini Map */}
                        <div className="h-32 rounded-xl border border-white/10 relative overflow-hidden bg-stone-900 mb-3 flex items-center justify-center">
                          <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 100 100">
                            <line x1="0" y1="30" x2="100" y2="30" stroke="white" strokeWidth="2" />
                            <line x1="40" y1="0" x2="40" y2="100" stroke="white" strokeWidth="2" />
                          </svg>
                          <div className="w-12 h-12 rounded-full bg-amber-500/10 blur flex items-center justify-center absolute" />
                          <div className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-white relative z-10 animate-pulse" />
                        </div>

                        <div className="space-y-2 flex-1">
                          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                            <div>
                              <p className="text-[9px] uppercase tracking-wider text-gray-400 font-bold">Assigned Agent</p>
                              <p className="text-xs font-bold mt-0.5">Rahul Kumar</p>
                            </div>
                            <span className="text-[8px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400">En Route</span>
                          </div>
                          
                          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                            <p className="text-[9px] uppercase tracking-wider text-gray-400 font-bold">Scheduled Window</p>
                            <p className="text-xs font-bold mt-0.5">Today, 4:00 PM - 6:00 PM</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Simulated Screen 3: Wipe */}
                    {screenshotIndex === 2 && (
                      <div className="flex-1 flex flex-col text-white animate-fadeIn">
                        <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                          <span className="text-[10px] font-black tracking-widest text-emerald-400">SECURE SHIELD</span>
                          <span className="text-[9px] text-gray-500">AD-FREE</span>
                        </div>
                        
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-600/20 to-teal-600/10 border border-emerald-500/20 flex-1 flex flex-col items-center justify-center text-center space-y-4">
                          <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                            <Shield className="w-6 h-6 text-emerald-400" />
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-white">Data Sanitization</h4>
                            <p className="text-[10px] text-gray-400 mt-1 max-w-[180px] mx-auto leading-relaxed">
                              Successfully completed a military-grade data erasure on your MacBook.
                            </p>
                          </div>

                          <div className="w-full bg-black/30 border border-white/5 p-3 rounded-xl space-y-1.5 text-left text-[9px] text-gray-400 font-mono">
                            <div className="flex justify-between"><span>Cert:</span><span className="text-white font-bold">BBE-WIPE-9A3K</span></div>
                            <div className="flex justify-between"><span>Method:</span><span className="text-white capitalize font-semibold">Factory Reset</span></div>
                            <div className="flex justify-between"><span>Serial:</span><span className="text-white font-semibold">C02F1234XL56</span></div>
                          </div>

                          <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold rounded-full tracking-wider">
                            SECURE & VERIFIED
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Phone Home Button bar */}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-28 h-1 bg-stone-800 dark:bg-stone-900 rounded-full z-30" />
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      <LeafDivider />

      {/* ─── FEATURED STORES ─── */}
      <section id="stores" className="py-16 relative" style={{ background: 'var(--color-bg)' }}>
        <FloralCornerTR />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="flex items-end justify-between mb-8">
            <div>
              <p className="font-semibold text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--color-primary)' }}>Verified Partners</p>
              <h2 className="text-2xl sm:text-3xl font-extrabold" style={{ color: 'var(--color-text)' }}>
                {searchDone ? `Stores Near ${pincode}` : 'Featured Stores'}
              </h2>
            </div>
            <button onClick={() => navigate('/shop')} className="hidden sm:flex items-center gap-1 text-sm text-cyan-400 font-semibold hover:text-cyan-300 transition-colors">
              View All <ChevronRight className="w-4 h-4" />
            </button>
          </Reveal>

          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 snap-x snap-mandatory">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex-shrink-0 w-[280px] h-40 skeleton snap-center" />
              ))
            ) : businesses.length > 0 ? (
              businesses.map((biz) => (
                <div
                  key={biz.id}
                  onClick={() => navigate(`/shop?store=${biz.slug || biz.id}`)}
                  className="flex-shrink-0 w-[280px] card-interactive p-5 snap-center"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-primary-glow)' }}>
                      <Building2 className="w-5 h-5 text-cyan-400" />
                    </div>
                    <span className="badge-success text-[10px]">
                      <BadgeCheck className="w-3 h-3" /> Verified
                    </span>
                  </div>
                  <h3 className="font-bold text-sm mb-1 truncate" style={{ color: 'var(--color-text)' }}>{biz.name}</h3>
                  <p className="flex items-center gap-1 text-xs mb-3" style={{ color: 'var(--color-text-muted)' }}>
                    <MapPin className="w-3 h-3" /> {biz.city || 'India'}
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-xs text-amber-400 font-semibold">
                      <Star className="w-3 h-3 fill-amber-400" />
                      {biz.google_rating ? Number(biz.google_rating).toFixed(1) : '4.8'}
                    </span>
                    <span className="text-xs text-gray-600">•</span>
                    <span className="text-xs text-gray-500">{biz.listing_count || 0} listings</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="w-full text-center py-8">
                <Store className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No stores found. Try a different pincode.</p>
              </div>
            )}
          </div>

          {/* ─── MAP VISUALIZATION ─── */}
          {!isLoading && businesses.length > 0 && (
            <Reveal className="mt-10 animate-fadeIn">
              <div 
                className="rounded-3xl border overflow-hidden p-6 lg:p-8" 
                style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
              >
                <div className="grid lg:grid-cols-5 gap-6">
                  {/* Left Column: Stores list with simulated distances */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="space-y-1">
                      <h3 className="text-base font-black uppercase tracking-wider" style={{ color: 'var(--color-text)' }}>Store Locations Map</h3>
                      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Interactive coverage of verified local store partners.</p>
                    </div>
                    
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
                      {businesses.slice(0, 4).map((biz, idx) => {
                        const distances = ["0.8 km away", "1.5 km away", "2.3 km away", "3.1 km away"];
                        return (
                          <div 
                            key={biz.id}
                            className="p-3.5 rounded-xl border hover:border-cyan-500/30 transition-all flex items-start justify-between gap-3 bg-stone-50/20 dark:bg-white/[0.01]"
                            style={{ borderColor: 'var(--color-border)' }}
                          >
                            <div className="min-w-0">
                              <h4 className="font-bold text-xs sm:text-sm truncate" style={{ color: 'var(--color-text)' }}>{biz.name}</h4>
                              <p className="text-[11px] truncate mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{biz.legal_name || biz.city || 'India'}</p>
                              <span className="text-[10px] font-bold text-emerald-500 mt-1 block flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Pickup Available
                              </span>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-500 whitespace-nowrap">
                              {distances[idx % distances.length]}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right Column: Stylized SVG Map */}
                  <div className="lg:col-span-3 h-[300px] rounded-2xl border relative overflow-hidden flex items-center justify-center bg-stone-50 dark:bg-stone-900" style={{ borderColor: 'var(--color-border)' }}>
                    {/* Simulated Grid Streets Map */}
                    <svg className="absolute inset-0 w-full h-full opacity-35 dark:opacity-20 pointer-events-none" viewBox="0 0 400 300">
                      <defs>
                        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" style={{ color: 'var(--color-border)' }} />
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#grid)" />
                      {/* Streets path */}
                      <path d="M 0 50 Q 150 70, 200 150 T 400 220" fill="none" stroke="currentColor" strokeWidth="8" style={{ color: 'var(--color-border)' }} />
                      <path d="M 120 0 L 120 300" fill="none" stroke="currentColor" strokeWidth="6" style={{ color: 'var(--color-border)' }} />
                      <path d="M 280 0 Q 300 150, 280 300" fill="none" stroke="currentColor" strokeWidth="4" style={{ color: 'var(--color-border)' }} />
                    </svg>

                    {/* Glowing Coverage Zone */}
                    <div className="absolute w-44 h-44 rounded-full bg-cyan-500/10 dark:bg-cyan-500/5 blur-xl animate-pulse" />

                    {/* Animated Pulsing Store Pins */}
                    {businesses.slice(0, 4).map((biz, idx) => {
                      const coords = [
                        { top: '25%', left: '35%' },
                        { top: '55%', left: '65%' },
                        { top: '70%', left: '20%' },
                        { top: '35%', left: '75%' }
                      ];
                      const pos = coords[idx % coords.length];
                      return (
                        <div 
                          key={biz.id} 
                          className="absolute flex flex-col items-center group cursor-pointer"
                          style={{ top: pos.top, left: pos.left }}
                        >
                          <div className="relative flex items-center justify-center">
                            <span className="absolute w-6 h-6 rounded-full bg-cyan-500/30 animate-ping" />
                            <div className="w-3.5 h-3.5 rounded-full bg-cyan-500 border-2 border-white dark:border-stone-900 shadow-md relative z-10" />
                          </div>
                          
                          {/* Tooltip */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute bottom-5 px-2.5 py-1 bg-stone-950 text-white rounded text-[10px] font-bold whitespace-nowrap pointer-events-none shadow-lg z-20">
                            {biz.name}
                          </div>
                        </div>
                      );
                    })}

                    {/* Map Watermark */}
                    <div className="absolute bottom-3 right-3 text-[10px] font-bold uppercase tracking-widest opacity-25" style={{ color: 'var(--color-text-muted)' }}>
                      BE Coverage Map
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          )}
        </div>
      </section>

      {/* ─── TRENDING LISTINGS ─── */}
      <section id="marketplace" className="py-16 relative overflow-hidden">
        <div className="absolute inset-0 gradient-mesh pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-10">
            <p className="font-semibold text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--color-primary)' }}>Marketplace</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-3" style={{ color: 'var(--color-text)' }}>
              {searchDone ? `Listings Near ${pincode}` : 'Trending Listings'}
            </h2>
            <p className="max-w-lg mx-auto text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Certified pre-owned MacBooks & iPads from verified store partners.
            </p>
          </Reveal>

          {/* Category pills — filter in-place */}
          <div className="flex justify-center gap-2 mb-8">
            {[
              { id: 'all', label: 'All Devices' },
              { id: 'macbook', label: 'MacBook' },
              { id: 'ipad', label: 'iPad' },
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setListingCategory(cat.id)}
                className={`px-4 py-2 text-xs font-semibold rounded-full cursor-pointer transition-colors ${
                  listingCategory === cat.id ? 'badge-primary' : 'badge-neutral hover:bg-white/10'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-64 skeleton" />
              ))}
            </div>
          ) : filteredLandingListings.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {filteredLandingListings.slice(0, 8).map((listing) => {
                const isIPad = (listing.title || listing.model || '').toLowerCase().includes('ipad')
                const Icon = isIPad ? Tablet : Laptop
                const savings = listing.mrp_inr && listing.mrp_inr > listing.price_inr ? listing.mrp_inr - listing.price_inr : 0

                return (
                  <div
                    key={listing.id}
                    onClick={() => navigate('/shop')}
                    className="card-interactive p-4 group"
                  >
                    {/* Device visual */}
                    <div className="h-32 rounded-xl flex items-center justify-center relative overflow-hidden mb-4" style={{ background: 'linear-gradient(135deg, var(--color-surface-2), var(--color-surface-3))' }}>
                      <Icon className="w-12 h-12 text-gray-600 group-hover:text-cyan-500 transition-colors" />
                      <span className={`absolute bottom-2 right-2 rounded-full px-2.5 py-1 text-[10px] font-semibold ${conditionClass(listing.condition)}`}>
                        {conditionLabel(listing.condition)}
                      </span>
                    </div>

                    {/* Details */}
                    <h3 className="font-bold text-sm leading-snug mb-1 line-clamp-2" style={{ color: 'var(--color-text)' }}>{listing.title}</h3>
                    <p className="text-xs mb-3 truncate" style={{ color: 'var(--color-text-muted)' }}>
                      {listing.model}{listing.storage_gb ? ` · ${listing.storage_gb}GB` : ''}{listing.color ? ` · ${listing.color}` : ''}
                    </p>

                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-lg font-extrabold" style={{ color: 'var(--color-text)' }}>{formatPrice(listing.price_inr)}</p>
                        {listing.mrp_inr && <p className="text-xs text-gray-600 line-through">{formatPrice(listing.mrp_inr)}</p>}
                      </div>
                      {savings > 0 && (
                        <span className="badge-success text-[10px]">Save {formatPrice(savings)}</span>
                      )}
                    </div>

                    {/* Store info */}
                    {listing.businesses && (
                      <div className="mt-3 pt-3 flex items-center gap-2" style={{ borderTop: '1px solid var(--color-border)' }}>
                        <Building2 className="w-3 h-3 text-gray-600" />
                        <span className="text-[11px] text-gray-500 truncate">{listing.businesses.name}</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Store className="w-10 h-10 text-gray-600 mx-auto mb-3" />
              <p className="font-semibold" style={{ color: 'var(--color-text-muted)' }}>No listings found</p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>Try a different pincode or browse all listings.</p>
            </div>
          )}

          <Reveal className="text-center mt-10">
            <button onClick={() => navigate('/shop')} className="btn-secondary px-8 py-3 text-sm flex items-center gap-2 mx-auto">
              View All Listings <ArrowRight className="w-4 h-4" />
            </button>
          </Reveal>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how-it-works" className="py-20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-14">
            <p className="font-semibold text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--color-primary)' }}>Simple Process</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-3" style={{ color: 'var(--color-text)' }}>How It Works</h2>
            <p className="max-w-lg mx-auto text-sm" style={{ color: 'var(--color-text-muted)' }}>Buy or sell in 3 simple steps.</p>
          </Reveal>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Buy flow */}
            <Reveal>
              <div className="card p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-primary-glow)' }}>
                    <Store className="w-5 h-5 text-cyan-400" />
                  </div>
                  <h3 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>Want to Buy?</h3>
                </div>
                <div className="space-y-4">
                  {[
                    { num: '01', title: 'Search Your Area', desc: 'Enter pincode to find stores & listings near you.' },
                    { num: '02', title: 'Browse & Select', desc: 'Filter by model, condition, and price. Pick your device.' },
                    { num: '03', title: 'Visit Store or Get Delivery', desc: 'Visit the store or request agent delivery to your doorstep.' },
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="text-2xl font-extrabold text-cyan-900">{step.num}</span>
                      <div>
                        <p className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>{step.title}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            {/* Sell flow */}
            <Reveal delay="stagger-2">
              <div className="card p-6" style={{ borderColor: 'rgba(245,158,11,0.15)' }}>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.12)' }}>
                    <ShoppingBag className="w-5 h-5 text-amber-400" />
                  </div>
                  <h3 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>Want to Sell?</h3>
                </div>
                <div className="space-y-4">
                  {[
                    { num: '01', title: 'Get Instant Quote', desc: 'Select your device model & answer condition questions.' },
                    { num: '02', title: 'Choose Store or Pickup', desc: 'Visit a nearby store or schedule free agent pickup.' },
                    { num: '03', title: 'Get Paid Instantly', desc: 'Device verified on spot. Instant UPI/bank payment.' },
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="text-2xl font-extrabold" style={{ color: 'rgba(245,158,11,0.2)' }}>{step.num}</span>
                      <div>
                        <p className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>{step.title}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ─── WHY CHOOSE US ─── */}
      <section className="py-16 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-10">
            <p style={{ color: 'var(--color-primary)' }} className="font-semibold text-xs uppercase tracking-wider mb-2">Why BuyBack Elite</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold" style={{ color: 'var(--color-text)' }}>
              Trusted by <span className="text-gradient">Thousands</span>
            </h2>
          </Reveal>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: BadgeCheck, title: 'Verified Stores', desc: 'Every store is vetted and verified', color: 'text-cyan-400', bg: 'var(--color-primary-glow)' },
              { icon: Zap, title: 'Instant Payment', desc: 'UPI / Bank transfer same day', color: 'text-amber-400', bg: 'rgba(245,158,11,0.12)' },
              { icon: Shield, title: 'Data Security', desc: 'Secure factory reset guaranteed', color: 'text-emerald-400', bg: 'rgba(16,185,129,0.12)' },
              { icon: Truck, title: 'Free Pickup', desc: 'Agent comes to your doorstep', color: 'text-blue-400', bg: 'rgba(59,130,246,0.12)' },
            ].map((item, i) => (
              <Reveal key={i} delay={`stagger-${i + 1}`}>
                <div className="card-glow p-5 text-center h-full">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ background: item.bg }}>
                    <item.icon className={`w-6 h-6 ${item.color}`} />
                  </div>
                  <h3 className="font-bold text-sm mb-1" style={{ color: 'var(--color-text)' }}>{item.title}</h3>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{item.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── OWN A STORE? ─── */}
      <section className="py-16" style={{ background: 'var(--color-bg)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Business Owner Card */}
              <a href={adminUrl('/register')} target="_blank" rel="noopener noreferrer"
                className="group relative rounded-2xl overflow-hidden p-8 transition-all duration-300 hover:scale-[1.02]"
                style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(167,139,250,0.06))', border: '1px solid rgba(124,58,237,0.15)' }}>
                <div className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" style={{ background: 'rgba(124,58,237,0.15)' }}>
                  <ArrowUpRight className="w-5 h-5" style={{ color: '#8B5CF6' }} />
                </div>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5" style={{ background: 'linear-gradient(135deg, #7C3AED, #8B5CF6)' }}>
                  <Building2 className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-extrabold mb-2" style={{ color: 'var(--color-text)' }}>Own a Store? Register Now</h3>
                <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
                  Create your store, list MacBook & iPad for sale, manage sell requests, set coverage areas, and grow your business on India's #1 Apple device marketplace.
                </p>
                <div className="flex flex-wrap gap-2">
                  {['List Products', 'Set Coverage Area', 'Manage Agents', 'Track Orders'].map(tag => (
                    <span key={tag} className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                      style={{ background: 'rgba(124,58,237,0.1)', color: '#A78BFA' }}>{tag}</span>
                  ))}
                </div>
              </a>

              {/* Agent Card */}
              <a href={agentUrl('/login')} target="_blank" rel="noopener noreferrer"
                className="group relative rounded-2xl overflow-hidden p-8 transition-all duration-300 hover:scale-[1.02]"
                style={{ background: 'linear-gradient(135deg, rgba(234,88,12,0.12), rgba(251,146,60,0.06))', border: '1px solid rgba(234,88,12,0.15)' }}>
                <div className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" style={{ background: 'rgba(234,88,12,0.15)' }}>
                  <ArrowUpRight className="w-5 h-5" style={{ color: '#EA580C' }} />
                </div>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5" style={{ background: 'linear-gradient(135deg, #EA580C, #F97316)' }}>
                  <Truck className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-extrabold mb-2" style={{ color: 'var(--color-text)' }}>Field Agent? Login Here</h3>
                <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
                  Manage assigned pickups, navigate to customer locations, update pickup status in real-time, and track your earnings.
                </p>
                <div className="flex flex-wrap gap-2">
                  {['View Pickups', 'Navigate', 'Update Status', 'Track Earnings'].map(tag => (
                    <span key={tag} className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                      style={{ background: 'rgba(234,88,12,0.1)', color: '#FB923C' }}>{tag}</span>
                  ))}
                </div>
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── FAQ ACCORDION ─── */}
      <section id="faq" className="py-20 relative overflow-hidden" style={{ background: 'var(--color-surface-2)' }}>
        <div className="absolute inset-0 noise-overlay pointer-events-none" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-12">
            <p style={{ color: 'var(--color-primary)' }} className="font-semibold text-xs uppercase tracking-wider mb-2">Frequently Asked Questions</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold" style={{ color: 'var(--color-text)' }}>
              Got Questions? <span className="text-gradient">We Have Answers</span>
            </h2>
          </Reveal>
          
          <div className="space-y-4">
            {[
              {
                q: "How is my device valuation calculated?",
                a: "Our system matches your device's exact specifications (processor, RAM, storage, battery health, and cycle count) against local market demand. The final price is dynamically computed by applying pre-configured deduction rules based on any functional or physical defects you declare."
              },
              {
                q: "What happens during the doorstep verification?",
                a: "A certified agent will visit your home at your scheduled time. They will run a quick diagnostics check to verify the device specs and physical condition. If everything matches your description, they will initiate an instant payout via UPI or bank transfer on the spot."
              },
              {
                q: "Is my personal data safe after selling?",
                a: "Absolutely. Security is our top concern. Once the device is picked up, it goes through a secure military-grade data erasure process at our hub. After successful sanitization, we generate and issue a digital Data Wipe Certificate directly to your dashboard as proof of data destruction."
              },
              {
                q: "What if the agent finds additional issues not declared in the request?",
                a: "If the agent uncovers discrepancies in specifications or condition, they will submit a revised assessment. The admin will immediately calculate a counter-offer. You can accept this counter-offer to complete the sale, or decline it. If declined, your device remains with you, and the visit is 100% free."
              },
              {
                q: "How long does the entire process take?",
                a: "After you submit a sell request, local stores usually review it and schedule an agent within 24 to 48 hours. The doorstep inspection and payout verification process itself takes only 10 to 15 minutes."
              }
            ].map((faq, idx) => {
              const isOpen = faqOpenIndex === idx;
              return (
                <Reveal key={idx} delay={`stagger-${idx + 1}`}>
                  <div 
                    className="rounded-2xl border transition-all duration-300 overflow-hidden"
                    style={{ 
                      borderColor: 'var(--color-border)', 
                      background: 'var(--color-surface)',
                      boxShadow: isOpen ? '0 4px 20px rgba(0,0,0,0.02)' : 'none'
                    }}
                  >
                    <button
                      onClick={() => setFaqOpenIndex(isOpen ? null : idx)}
                      className="w-full px-6 py-5 flex items-center justify-between text-left transition-colors hover:bg-stone-50/50 dark:hover:bg-white/[0.02]"
                    >
                      <span className="font-bold text-sm sm:text-base" style={{ color: 'var(--color-text)' }}>
                        {faq.q}
                      </span>
                      <span 
                        className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border transition-transform duration-300"
                        style={{ 
                          borderColor: 'var(--color-border)',
                          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                          background: isOpen ? 'var(--color-primary-glow)' : 'transparent',
                          color: isOpen ? 'var(--color-primary)' : 'var(--color-text-muted)'
                        }}
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </span>
                    </button>
                    <div 
                      className="transition-all duration-300 ease-in-out overflow-hidden"
                      style={{ 
                        maxHeight: isOpen ? '200px' : '0px',
                        opacity: isOpen ? 1 : 0
                      }}
                    >
                      <div className="px-6 pb-6 pt-1 text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                        {faq.a}
                      </div>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="relative rounded-3xl overflow-hidden p-8 sm:p-12 text-center" style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.15), rgba(139,92,246,0.1))' }}>
              <div className="absolute inset-0 noise-overlay" />
              <div className="relative z-10">
                <h2 className="text-2xl sm:text-3xl font-extrabold mb-4" style={{ color: 'var(--color-text)' }}>
                  Ready to Get Started?
                </h2>
                <p className="max-w-md mx-auto mb-8 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  Join thousands of customers buying and selling Apple devices through verified local stores.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button onClick={() => navigate('/shop')} className="btn-primary px-8 py-3.5 text-sm flex items-center justify-center gap-2">
                    <Store className="w-4 h-4" /> Browse Marketplace
                  </button>
                  <button onClick={() => navigate('/dashboard/sell')} className="btn-sell px-8 py-3.5 text-sm flex items-center justify-center gap-2">
                    <ShoppingBag className="w-4 h-4" /> Sell Your Device
                  </button>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="py-12" style={{ borderTop: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--gradient-cta)' }}>
                  <span className="text-white font-black text-xs">BE</span>
                </div>
                <span className="text-base font-extrabold text-gradient">BuyBack Elite</span>
              </div>
              <p className="text-xs leading-relaxed mb-4" style={{ color: 'var(--color-text-muted)' }}>
                India's #1 marketplace for pre-owned MacBook & iPad. Buy, sell, or exchange Apple devices through verified local stores.
              </p>
            </div>

            {/* Customer */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--color-text)' }}>For Customers</h4>
              <div className="space-y-2.5">
                <Link to="/shop" className="block text-xs transition-colors" style={{ color: 'var(--color-text-muted)' }}>Browse Marketplace</Link>
                <Link to="/dashboard/sell" className="block text-xs transition-colors" style={{ color: 'var(--color-text-muted)' }}>Sell Your Device</Link>
                <Link to="/login" className="block text-xs transition-colors" style={{ color: 'var(--color-text-muted)' }}>Customer Login</Link>
                <Link to="/register" className="block text-xs transition-colors" style={{ color: 'var(--color-text-muted)' }}>Create Account</Link>
              </div>
            </div>

            {/* Business */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--color-text)' }}>For Business</h4>
              <div className="space-y-2.5">
                <a href={adminUrl('/register')} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs transition-colors" style={{ color: '#8B5CF6' }}>
                  <Building2 className="w-3 h-3" /> Register Store
                </a>
                <a href={adminUrl('/login')} target="_blank" rel="noopener noreferrer" className="block text-xs transition-colors" style={{ color: 'var(--color-text-muted)' }}>
                  Store Owner Login
                </a>
                <a href={agentUrl('/login')} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs transition-colors" style={{ color: '#EA580C' }}>
                  <Truck className="w-3 h-3" /> Agent Login
                </a>
              </div>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--color-text)' }}>Company</h4>
              <div className="space-y-2.5">
                <Link to="/about-us" className="block text-xs transition-colors" style={{ color: 'var(--color-text-muted)' }}>About Us</Link>
                <Link to="/privacy-policy" className="block text-xs transition-colors" style={{ color: 'var(--color-text-muted)' }}>Privacy Policy</Link>
                <Link to="/terms-of-service" className="block text-xs transition-colors" style={{ color: 'var(--color-text-muted)' }}>Terms of Service</Link>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3" style={{ borderTop: '1px solid var(--color-border)' }}>
            <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>© 2026 BuyBack Elite. All rights reserved. MacBook & iPad only.</p>
            <div className="flex items-center gap-4">
              <span className="text-[11px] px-2.5 py-1 rounded-full font-semibold" style={{ background: 'rgba(124,58,237,0.1)', color: '#8B5CF6' }}>🏪 Store Panel</span>
              <span className="text-[11px] px-2.5 py-1 rounded-full font-semibold" style={{ background: 'rgba(234,88,12,0.1)', color: '#EA580C' }}>🚚 Agent Panel</span>
              <span className="text-[11px] px-2.5 py-1 rounded-full font-semibold" style={{ background: 'var(--color-primary-glow)', color: 'var(--color-primary)' }}>👤 Customer</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
