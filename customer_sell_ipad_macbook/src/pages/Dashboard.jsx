import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import {
  Package, Clock, Navigation, CheckCircle2, IndianRupee,
  ArrowRight, Laptop, Tablet, MapPin, RefreshCw, Calendar
} from 'lucide-react'

export default function Dashboard() {
  const { agent, assignedPickups, stats, fetchAssignedPickups, isLoading } = useStore()
  const navigate = useNavigate()

  useEffect(() => { fetchAssignedPickups() }, [])

  const displayName = agent?.name || agent?.email?.split('@')[0] || 'Agent'

  const today = new Date().toDateString()
  const urgentPickups = assignedPickups.filter(p => {
    if (!p.pickup_scheduled_time) return false
    const pickupDate = new Date(p.pickup_scheduled_time).toDateString()
    return pickupDate === today || new Date(p.pickup_scheduled_time) < new Date()
  })

  const formatTime = (dateStr) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  const formatTimeOnly = (dateStr) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Welcome Banner */}
      <div className="relative rounded-2xl overflow-hidden gradient-agent p-5 lg:p-6">
        <div className="absolute inset-0 noise-overlay" />
        <div className="absolute top-0 right-0 w-56 h-56 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="text-lg lg:text-xl font-extrabold text-white">Welcome, {displayName}!</h1>
            <p className="text-white/50 text-xs mt-0.5">You have <span className="font-bold text-white/90">{assignedPickups.length}</span> active pickups</p>
          </div>
          <button onClick={() => fetchAssignedPickups()} disabled={isLoading}
            className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-xl text-xs text-white font-medium hover:bg-white/25 transition-colors border border-white/10">
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard icon={Clock} label="Pending" value={stats.pending} color="orange" border="border-orange-100" onClick={() => navigate('/pickups')} />
        <StatCard icon={Navigation} label="En Route" value={stats.enRoute} color="blue" border="border-blue-100" onClick={() => navigate('/pickups')} />
        <StatCard icon={MapPin} label="Arrived" value={stats.arrived} color="violet" border="border-violet-100" onClick={() => navigate('/pickups')} />
        <StatCard icon={CheckCircle2} label="Completed" value={stats.completed} color="emerald" border="border-emerald-100" onClick={() => navigate('/history')} />
        <StatCard icon={IndianRupee} label="Earnings" value={`₹${stats.totalEarnings.toLocaleString('en-IN')}`} color="teal" border="border-teal-100" className="col-span-2 lg:col-span-1" />
      </div>

      <div className="grid lg:grid-cols-5 gap-5">
        {/* Today's Schedule - Left (3 cols) */}
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-orange-500" /> Today's Schedule
              {urgentPickups.length > 0 && (
                <span className="min-w-[20px] h-5 flex items-center justify-center px-1.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-600">
                  {urgentPickups.length}
                </span>
              )}
            </h2>
            <button onClick={() => navigate('/pickups')}
              className="text-xs text-orange-600 font-semibold hover:text-orange-700 flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {urgentPickups.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center shadow-sm">
              <Calendar className="w-10 h-10 text-gray-200 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900 text-sm mb-1">No Pickups Today</h3>
              <p className="text-xs text-gray-400">You're all caught up!</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Desktop Table */}
              <div className="hidden sm:block">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left px-4 py-2.5 text-xs font-bold text-gray-400 uppercase tracking-wider">Time</th>
                      <th className="text-left px-4 py-2.5 text-xs font-bold text-gray-400 uppercase tracking-wider">Device</th>
                      <th className="text-right px-4 py-2.5 text-xs font-bold text-gray-400 uppercase tracking-wider">Value</th>
                      <th className="text-right px-4 py-2.5 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {urgentPickups.map((pickup) => {
                      const isMac = pickup.device_type === 'MacBook'
                      const status = getStatusConfig(pickup.status)
                      return (
                        <tr key={pickup.id} className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                          onClick={() => navigate(`/pickups/${pickup.id}`)}>
                          <td className="px-4 py-3">
                            <span className="text-sm font-medium text-gray-900">{formatTimeOnly(pickup.pickup_scheduled_time)}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isMac ? 'bg-indigo-50' : 'bg-emerald-50'}`}>
                                {isMac ? <Laptop className="w-3.5 h-3.5 text-indigo-600" /> : <Tablet className="w-3.5 h-3.5 text-emerald-600" />}
                              </div>
                              <span className="font-semibold text-sm text-gray-900 truncate">{pickup.model_name || pickup.device_type}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="font-bold text-sm text-gray-900">
                              ₹{(pickup.final_price || pickup.admin_offer_price || pickup.system_estimated_price || 0).toLocaleString('en-IN')}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${status.bg} ${status.text}`}>
                              <span className={`w-1 h-1 rounded-full ${status.text.replace('text-', 'bg-')}`} />
                              {status.label}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              {/* Mobile cards */}
              <div className="sm:hidden divide-y divide-gray-50">
                {urgentPickups.map((pickup) => (
                  <PickupCard key={pickup.id} pickup={pickup} onClick={() => navigate(`/pickups/${pickup.id}`)} formatTime={formatTime} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Active Pickups - Right (2 cols) */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-900">All Active</h2>
            <button onClick={() => navigate('/pickups')}
              className="text-xs text-orange-600 font-semibold hover:text-orange-700 flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          {assignedPickups.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center shadow-sm">
              <Package className="w-10 h-10 text-gray-200 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900 text-sm mb-1">No Active Pickups</h3>
              <p className="text-xs text-gray-400">No pickups assigned yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {assignedPickups.slice(0, 5).map((pickup) => (
                <PickupCard key={pickup.id} pickup={pickup} onClick={() => navigate(`/pickups/${pickup.id}`)} formatTime={formatTime} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function getStatusConfig(status) {
  const config = {
    'Pickup_Scheduled': { bg: 'bg-orange-50', text: 'text-orange-600', label: 'Scheduled' },
    'Offer_Accepted': { bg: 'bg-emerald-50', text: 'text-emerald-600', label: 'Ready' },
    'Agent_Assigned': { bg: 'bg-blue-50', text: 'text-blue-600', label: 'Assigned' },
    'Agent_En_Route': { bg: 'bg-indigo-50', text: 'text-indigo-600', label: 'En Route' },
    'Agent_Arrived': { bg: 'bg-violet-50', text: 'text-violet-600', label: 'Arrived' },
    'Picked_Up': { bg: 'bg-teal-50', text: 'text-teal-600', label: 'Picked Up' },
  }
  return config[status] || { bg: 'bg-gray-50', text: 'text-gray-600', label: status }
}

function StatCard({ icon: Icon, label, value, color, border, onClick, className = '' }) {
  const colors = {
    orange: { bg: 'bg-orange-50', icon: 'text-orange-600' },
    blue: { bg: 'bg-blue-50', icon: 'text-blue-600' },
    violet: { bg: 'bg-violet-50', icon: 'text-violet-600' },
    emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600' },
    teal: { bg: 'bg-teal-50', icon: 'text-teal-600' },
  }
  const c = colors[color] || colors.orange

  return (
    <div onClick={onClick}
      className={`bg-white rounded-xl p-3.5 border ${border || 'border-gray-100'} card-hover shadow-sm ${onClick ? 'cursor-pointer' : ''} ${className}`}>
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${c.bg}`}>
          <Icon className={`w-[18px] h-[18px] ${c.icon}`} />
        </div>
        <div>
          <p className="text-base lg:text-lg font-extrabold text-gray-900">{value}</p>
          <p className="text-[11px] text-gray-400">{label}</p>
        </div>
      </div>
    </div>
  )
}

function PickupCard({ pickup, onClick, formatTime }) {
  const isMac = pickup.device_type === 'MacBook'
  const status = getStatusConfig(pickup.status)

  return (
    <div onClick={onClick}
      className="bg-white rounded-xl border border-gray-100 p-3.5 card-hover shadow-sm cursor-pointer">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-lg shrink-0 flex items-center justify-center ${isMac ? 'bg-indigo-50' : 'bg-emerald-50'}`}>
          {isMac ? <Laptop className="w-4 h-4 text-indigo-600" /> : <Tablet className="w-4 h-4 text-emerald-600" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-gray-900 text-xs truncate">{pickup.model_name || pickup.device_type}</h3>
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${status.bg} ${status.text}`}>
              <span className={`w-1 h-1 rounded-full ${status.text.replace('text-', 'bg-')}`} />
              {status.label}
            </span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <p className="text-[11px] text-gray-400 flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" /> {formatTime(pickup.pickup_scheduled_time)}
            </p>
            <p className="font-bold text-xs text-gray-900">
              ₹{(pickup.final_price || pickup.admin_offer_price || pickup.system_estimated_price || 0).toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
