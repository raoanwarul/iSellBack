import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { supabase } from '../lib/supabase'
import {
  Laptop, Tablet, ArrowRight, Clock, CheckCircle2, XCircle,
  AlertCircle, RefreshCw, Search, Package
} from 'lucide-react'

const STATUS_CONFIG = {
  'Pending': { bg: 'rgba(245,158,11,0.12)', text: '#F59E0B', label: 'Pending Review', icon: Clock },
  'Reviewing': { bg: 'rgba(59,130,246,0.12)', text: '#3B82F6', label: 'Under Review', icon: AlertCircle },
  'Seller_Confirmed': { bg: 'rgba(16,185,129,0.12)', text: '#10B981', label: 'Seller Confirmed', icon: CheckCircle2 },
  'Agent_Assigned': { bg: 'rgba(6,182,212,0.12)', text: '#06B6D4', label: 'Agent Assigned', icon: Package },
  'Offer_Accepted': { bg: 'rgba(16,185,129,0.12)', text: '#10B981', label: 'Offer Accepted', icon: CheckCircle2 },
  'Pickup_Scheduled': { bg: 'rgba(16,185,129,0.12)', text: '#10B981', label: 'Pickup Scheduled', icon: Package },
  'Completed': { bg: 'rgba(16,185,129,0.12)', text: '#10B981', label: 'Completed', icon: CheckCircle2 },
  'Rejected': { bg: 'rgba(239,68,68,0.12)', text: '#EF4444', label: 'Rejected', icon: XCircle },
  'Cancelled': { bg: 'rgba(148,163,184,0.12)', text: 'var(--color-text-secondary)', label: 'Cancelled', icon: XCircle },
}

const FILTER_OPTIONS = [
  { value: 'all', label: 'All Requests' },
  { value: 'active', label: 'Active' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Cancelled', label: 'Cancelled' },
]

export default function MyRequests() {
  const { sellRequests, fetchUserRequests, isLoading } = useStore()
  const navigate = useNavigate()
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchUserRequests()
  }, [])

  useEffect(() => {
    const channel = supabase
      .channel('my-requests-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sell_requests',
        },
        (payload) => {
          console.log('[REALTIME] Request list updated:', payload)
          fetchUserRequests()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchUserRequests])

  const filteredRequests = sellRequests.filter(req => {
    if (filter === 'active') {
      if (['Completed', 'Rejected', 'Cancelled'].includes(req.status)) return false
    } else if (filter !== 'all') {
      if (req.status !== filter) return false
    }
    if (search) {
      const q = search.toLowerCase()
      return (
        (req.model_name || '').toLowerCase().includes(q) ||
        (req.device_type || '').toLowerCase().includes(q) ||
        (req.id || '').toLowerCase().includes(q)
      )
    }
    return true
  })

  const formatPrice = (p) => (p || 0).toLocaleString('en-IN')
  const formatDate = (d) => {
    if (!d) return '-'
    return new Date(d).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    })
  }

  return (
    <div className="max-w-4xl mx-auto px-2 sm:px-4">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-gradient">My Sell Requests</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>{sellRequests.length} total requests</p>
        </div>
        <button
          onClick={() => fetchUserRequests()}
          disabled={isLoading}
          className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all"
          style={{ background: 'var(--color-primary-glow)', color: 'var(--color-primary)' }}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by model, type, or ID..."
            className="input w-full pl-10 pr-4 py-2 text-sm"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {FILTER_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className="px-3.5 py-2.5 text-xs font-bold rounded-xl transition-all"
              style={filter === opt.value ? {
                background: 'var(--color-primary)',
                color: '#ffffff'
              } : {
                background: 'var(--color-surface-2)',
                color: 'var(--color-text-secondary)'
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Request List */}
      {isLoading && sellRequests.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-10 h-10 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Loading requests...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="text-center py-16 card shadow-sm flex flex-col items-center justify-center p-6">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'var(--color-surface-2)' }}>
            <Package className="w-7 h-7" style={{ color: 'var(--color-text-muted)' }} />
          </div>
          <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--color-text)' }}>No Requests Found</h3>
          <p className="text-sm mb-5 max-w-xs mx-auto" style={{ color: 'var(--color-text-secondary)' }}>
            {filter !== 'all' ? 'Try changing your filter settings' : "You haven't submitted any sell requests yet."}
          </p>
          <button
            onClick={() => navigate('/dashboard/sell')}
            className="inline-flex items-center gap-2 btn-primary px-6 py-3 text-xs"
          >
            Sell a Device <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map((req) => {
            const statusConfig = STATUS_CONFIG[req.status] || {
              bg: 'var(--color-surface-2)', text: 'var(--color-text-secondary)', label: req.status, icon: AlertCircle
            }
            const StatusIcon = statusConfig.icon
            const displayPrice = req.final_price || req.admin_offer_price || req.system_estimated_price || 0

            return (
              <div
                key={req.id}
                onClick={() => navigate(`/dashboard/requests/${req.id}`)}
                className="card p-4 sm:p-5 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-cyan-500/30 transition-all duration-200"
              >
                <div className="flex items-center gap-4">
                  {/* Device Icon */}
                  <div className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center"
                    style={{
                      background: req.device_type === 'MacBook' ? 'rgba(99,102,241,0.08)' : 'rgba(16,185,129,0.08)',
                      color: req.device_type === 'MacBook' ? '#6366F1' : '#10B981'
                    }}>
                    {req.device_type === 'MacBook' ? <Laptop className="w-5 h-5" /> : <Tablet className="w-5 h-5" />}
                  </div>

                  {/* Details */}
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm sm:text-base truncate" style={{ color: 'var(--color-text)' }}>
                      {req.model_name || req.device_type}
                    </h3>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                      ID: {req.id?.substring(0, 8)}... <span className="mx-1">•</span> {formatDate(req.created_at)}
                    </p>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 border-t sm:border-t-0 pt-3 sm:pt-0" style={{ borderColor: 'var(--color-border)' }}>
                  <div className="text-left sm:text-right">
                    <p className="font-extrabold text-sm sm:text-base" style={{ color: 'var(--color-text)' }}>₹{formatPrice(displayPrice)}</p>
                    {req.admin_offer_price && req.admin_offer_price !== req.system_estimated_price && (
                      <p className="text-[10px] line-through" style={{ color: 'var(--color-text-muted)' }}>₹{formatPrice(req.system_estimated_price)}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold"
                      style={{ background: statusConfig.bg, color: statusConfig.text }}>
                      <StatusIcon className="w-3 h-3" />
                      {statusConfig.label}
                    </span>
                    <ArrowRight className="w-4 h-4 text-stone-300 hidden sm:block" style={{ color: 'var(--color-text-muted)' }} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
