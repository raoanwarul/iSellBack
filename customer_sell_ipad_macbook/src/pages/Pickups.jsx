import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import {
  Package, Clock, Navigation, MapPin, Phone, ArrowRight,
  Laptop, Tablet, RefreshCw, Search, Filter
} from 'lucide-react'

const STATUS_CONFIG = {
  'Pickup_Scheduled': { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Scheduled' },
  'Offer_Accepted': { bg: 'bg-green-100', text: 'text-green-700', label: 'Ready' },
  'Agent_Assigned': { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Assigned' },
  'Agent_En_Route': { bg: 'bg-indigo-100', text: 'text-indigo-700', label: 'En Route' },
  'Agent_Arrived': { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Arrived' },
  'Picked_Up': { bg: 'bg-teal-100', text: 'text-teal-700', label: 'Picked Up' },
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
    // Filter
    if (filter === 'pending') {
      if (!['Pickup_Scheduled', 'Offer_Accepted', 'Agent_Assigned'].includes(pickup.status)) return false
    } else if (filter === 'en_route') {
      if (pickup.status !== 'Agent_En_Route') return false
    } else if (filter === 'arrived') {
      if (!['Agent_Arrived', 'Picked_Up'].includes(pickup.status)) return false
    }

    // Search
    if (search) {
      const q = search.toLowerCase()
      const user = pickup.users || {}
      return (
        (pickup.model_name || '').toLowerCase().includes(q) ||
        (user.name || '').toLowerCase().includes(q) ||
        (user.phone || '').includes(q)
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
    <div className="animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">My Pickups</h1>
          <p className="text-sm text-gray-400">{assignedPickups.length} active pickups</p>
        </div>
        <button
          onClick={() => fetchAssignedPickups()}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-orange-600 bg-orange-50 rounded-xl hover:bg-orange-100 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by model, customer name, phone..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTER_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={`px-3 py-2 text-xs font-semibold rounded-xl transition-all ${
                filter === opt.value
                  ? 'gradient-agent text-white shadow-sm shadow-orange-500/20'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Pickups List */}
      {isLoading && assignedPickups.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-10 h-10 border-3 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading pickups...</p>
        </div>
      ) : filteredPickups.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <Package className="w-14 h-14 text-gray-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-900 mb-1">No Pickups Found</h3>
          <p className="text-sm text-gray-400">
            {filter !== 'all' ? 'Try changing your filter' : "You don't have any active pickups"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPickups.map((pickup) => {
            const user = pickup.users || {}
            const isMac = pickup.device_type === 'MacBook'
            const status = STATUS_CONFIG[pickup.status] || { bg: 'bg-gray-100', text: 'text-gray-700', label: pickup.status }

            return (
              <div
                key={pickup.id}
                onClick={() => navigate(`/pickups/${pickup.id}`)}
                className="bg-white rounded-xl border border-gray-100 p-4 lg:p-5 card-hover shadow-sm cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center ${
                    isMac ? 'bg-indigo-50' : 'bg-emerald-50'
                  }`}>
                    {isMac ? <Laptop className="w-5 h-5 text-indigo-600" /> : <Tablet className="w-5 h-5 text-emerald-600" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-gray-900 truncate">
                          {pickup.model_name || pickup.device_type}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          ID: {pickup.id?.substring(0, 8)}...
                        </p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
                        {status.label}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <Phone className="w-3.5 h-3.5" />
                        <span className="truncate">{user.name || 'Customer'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{formatTime(pickup.pickup_scheduled_time)}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-400">
                        {user.phone || '-'}
                      </p>
                      <p className="font-bold text-gray-900">
                        ₹{(pickup.final_price || pickup.admin_offer_price || pickup.system_estimated_price || 0).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>

                  <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0 mt-4" />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
