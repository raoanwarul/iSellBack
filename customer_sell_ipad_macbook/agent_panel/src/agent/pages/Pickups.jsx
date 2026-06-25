import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import {
  Package, Clock, Navigation, MapPin, Phone, ArrowRight,
  Laptop, Tablet, RefreshCw, Search, Filter
} from 'lucide-react'

const STATUS_CONFIG = {
  'Pickup_Scheduled': { cls: 'ag-badge-warning', label: 'Scheduled' },
  'Offer_Accepted': { cls: 'ag-badge-success', label: 'Ready' },
  'Agent_Assigned': { cls: 'ag-badge-primary', label: 'Assigned' },
  'Agent_En_Route': { cls: 'ag-badge-primary', label: 'En Route' },
  'Agent_Arrived': { cls: 'ag-badge-warning', label: 'Arrived' },
  'Picked_Up': { cls: 'ag-badge-success', label: 'Picked Up' },
}

const FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'en_route', label: 'En Route' },
  { value: 'arrived', label: 'Arrived' },
]

export default function Pickups() {
  const { assignedPickups, fetchAssignedPickups, isLoading } = useStore()
  const navigate = useNavigate()
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchAssignedPickups()
  }, [])

  const filteredPickups = assignedPickups.filter(pickup => {
    if (filter === 'pending') {
      if (!['Pickup_Scheduled', 'Offer_Accepted', 'Agent_Assigned'].includes(pickup.status)) return false
    } else if (filter === 'en_route') {
      if (pickup.status !== 'Agent_En_Route') return false
    } else if (filter === 'arrived') {
      if (!['Agent_Arrived', 'Picked_Up'].includes(pickup.status)) return false
    }
    if (search) {
      const q = search.toLowerCase()
      const user = pickup.users || {}
      return (
        (pickup.model_name || '').toLowerCase().includes(q) ||
        (user.name || '').toLowerCase().includes(q) ||
        (pickup.customer_phone || user.phone || '').includes(q)
      )
    }
    return true
  })

  const formatTime = (dateStr) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleString('en-IN', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    })
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl font-extrabold text-stone-800">My Pickups</h1>
          <p className="text-xs text-stone-400">{assignedPickups.length} active pickups</p>
        </div>
        <button onClick={() => fetchAssignedPickups()} disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium ag-btn-secondary">
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} style={{ color: 'var(--ag-primary)' }} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search model, customer, phone..."
            className="ag-input pl-10 pr-4" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {FILTER_OPTIONS.map(opt => (
            <button key={opt.value} onClick={() => setFilter(opt.value)}
              className={`px-3 py-2 text-xs font-semibold rounded-full transition-colors ${
                filter === opt.value
                  ? 'ag-badge-primary'
                  : 'ag-badge-neutral hover:bg-stone-100'
              }`}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Pickups List */}
      {isLoading && assignedPickups.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-10 h-10 border-3 rounded-full animate-spin mx-auto mb-4" style={{ borderColor: 'var(--ag-primary)', borderTopColor: 'transparent' }} />
          <p className="text-stone-400">Loading pickups...</p>
        </div>
      ) : filteredPickups.length === 0 ? (
        <div className="text-center py-16 ag-card">
          <Package className="w-14 h-14 mx-auto mb-3" style={{ color: 'var(--ag-text-muted)' }} />
          <h3 className="text-base font-bold text-stone-800 mb-1">No Pickups Found</h3>
          <p className="text-sm text-stone-400">
            {filter !== 'all' ? 'Try changing your filter' : "You don't have any active pickups"}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredPickups.map((pickup) => {
            const user = pickup.users || {}
            const isMac = pickup.device_type === 'MacBook'
            const status = STATUS_CONFIG[pickup.status] || { cls: 'ag-badge-neutral', label: pickup.status }

            return (
              <div key={pickup.id} onClick={() => navigate(`/field-tech/pickups/${pickup.id}`)}
                className="ag-card-interactive p-4">
                <div className="flex items-start gap-3.5">
                  <div className={`w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center ${
                    isMac ? 'bg-orange-50' : 'bg-emerald-50'
                  }`}>
                    {isMac ? <Laptop className="w-5 h-5 text-orange-600" /> : <Tablet className="w-5 h-5 text-emerald-600" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-stone-800 text-sm truncate">
                          {pickup.model_name || pickup.device_type}
                        </h3>
                        <p className="text-[11px] text-stone-400 mt-0.5">
                          ID: {pickup.id?.substring(0, 8)}...
                        </p>
                      </div>
                      <span className={`ag-badge text-[10px] ${status.cls}`}>
                        {status.label}
                      </span>
                    </div>

                    <div className="mt-2.5 grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1.5 text-stone-500">
                        <Phone className="w-3.5 h-3.5" />
                        <span className="truncate">{user.name || 'Customer'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-stone-500">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{formatTime(pickup.pickup_scheduled_time)}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-2.5 pt-2.5" style={{ borderTop: '1px solid var(--ag-border-light)' }}>
                      <p className="text-xs text-stone-400">
                        {pickup.customer_phone || user.phone || '-'}
                      </p>
                      <p className="font-extrabold text-stone-800 text-sm">
                        ₹{(pickup.final_price || pickup.admin_offer_price || pickup.system_estimated_price || 0).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>

                  <ArrowRight className="w-4 h-4 text-stone-300 flex-shrink-0 mt-3" />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
