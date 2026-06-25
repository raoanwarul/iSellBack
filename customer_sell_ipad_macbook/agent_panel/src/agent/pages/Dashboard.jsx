import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import {
  Package, Clock, Navigation, CheckCircle2, IndianRupee,
  ArrowRight, Laptop, Tablet, MapPin, Phone, RefreshCw, Truck,
} from 'lucide-react'

export default function Dashboard() {
  const { agent, assignedPickups, stats, fetchAssignedPickups, isLoading } = useStore()
  const navigate = useNavigate()

  useEffect(() => {
    fetchAssignedPickups()
  }, [])

  const displayName = agent?.name || agent?.email?.split('@')[0] || 'Agent'

  // Get urgent pickups
  const today = new Date().toDateString()
  const urgentPickups = assignedPickups.filter(p => {
    if (!p.pickup_scheduled_time) return false
    const pickupDate = new Date(p.pickup_scheduled_time).toDateString()
    return pickupDate === today || new Date(p.pickup_scheduled_time) < new Date()
  })

  return (
    <div className="max-w-6xl mx-auto space-y-4 animate-fade-in-up">
      {/* Welcome Banner */}
      <div className="rounded-2xl p-5 text-white relative overflow-hidden noise-overlay" style={{ background: 'var(--ag-gradient)' }}>
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-[80px]" style={{ background: 'rgba(255,255,255,0.1)' }} />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium mb-2" style={{ background: 'rgba(255,255,255,0.15)' }}>
              <Truck className="w-3 h-3" /> Field Agent
            </div>
            <h1 className="text-lg font-extrabold">Hello, {displayName}!</h1>
            <p className="text-white/60 text-xs mt-0.5">
              <span className="font-bold text-white/80">{assignedPickups.length}</span> active pickups today
            </p>
          </div>
          <button
            onClick={() => fetchAssignedPickups()}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors"
            style={{ background: 'rgba(255,255,255,0.15)' }}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
        <StatCard icon={Clock} label="Pending" value={stats.pending} color="orange" onClick={() => navigate('/field-tech/pickups')} />
        <StatCard icon={Navigation} label="En Route" value={stats.enRoute} color="blue" onClick={() => navigate('/field-tech/pickups')} />
        <StatCard icon={MapPin} label="Arrived" value={stats.arrived} color="amber" onClick={() => navigate('/field-tech/pickups')} />
        <StatCard icon={CheckCircle2} label="Completed" value={stats.completed} color="green" onClick={() => navigate('/field-tech/history')} />
        <StatCard icon={IndianRupee} label="Earnings" value={`₹${stats.totalEarnings.toLocaleString('en-IN')}`} color="emerald" className="col-span-2 lg:col-span-1" />
      </div>

      {/* Urgent Pickups */}
      {urgentPickups.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-stone-800 flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              Today's Pickups
            </h2>
            <button onClick={() => navigate('/field-tech/pickups')}
              className="text-xs font-semibold flex items-center gap-1" style={{ color: 'var(--ag-primary)' }}>
              View All <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-2">
            {urgentPickups.slice(0, 3).map((pickup) => (
              <PickupCard key={pickup.id} pickup={pickup} onClick={() => navigate(`/field-tech/pickups/${pickup.id}`)} />
            ))}
          </div>
        </div>
      )}

      {/* All Active Pickups */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-stone-800">Active Pickups</h2>
          <button onClick={() => navigate('/field-tech/pickups')}
            className="text-xs font-semibold flex items-center gap-1" style={{ color: 'var(--ag-primary)' }}>
            View All <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
        {assignedPickups.length === 0 ? (
          <div className="ag-card p-8 text-center">
            <Package className="w-10 h-10 mx-auto mb-2" style={{ color: 'var(--ag-text-muted)' }} />
            <h3 className="font-semibold text-stone-800 text-sm mb-1">No Active Pickups</h3>
            <p className="text-xs text-stone-400">No pickups assigned yet. Check back soon!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {assignedPickups.slice(0, 5).map((pickup) => (
              <PickupCard key={pickup.id} pickup={pickup} onClick={() => navigate(`/field-tech/pickups/${pickup.id}`)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color, onClick, className = '' }) {
  const colors = {
    orange: { bg: 'bg-orange-50', icon: 'text-orange-600', border: 'border-orange-100' },
    blue: { bg: 'bg-blue-50', icon: 'text-blue-600', border: 'border-blue-100' },
    amber: { bg: 'bg-amber-50', icon: 'text-amber-600', border: 'border-amber-100' },
    green: { bg: 'bg-green-50', icon: 'text-green-600', border: 'border-green-100' },
    emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600', border: 'border-emerald-100' },
  }
  const c = colors[color] || colors.orange

  return (
    <div onClick={onClick}
      className={`ag-card p-3 ${onClick ? 'cursor-pointer' : ''} ${className}`}>
      <div className="flex items-center gap-2.5">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${c.bg}`}>
          <Icon className={`w-4 h-4 ${c.icon}`} />
        </div>
        <div>
          <p className="text-lg font-extrabold text-stone-800">{value}</p>
          <p className="text-[11px] text-stone-400">{label}</p>
        </div>
      </div>
    </div>
  )
}

function PickupCard({ pickup, onClick }) {
  const isMac = pickup.device_type === 'MacBook'

  const statusConfig = {
    'Pickup_Scheduled': { cls: 'ag-badge-warning', label: 'Scheduled' },
    'Offer_Accepted': { cls: 'ag-badge-success', label: 'Ready' },
    'Agent_Assigned': { cls: 'ag-badge-primary', label: 'Assigned' },
    'Agent_En_Route': { cls: 'ag-badge-primary', label: 'En Route' },
    'Agent_Arrived': { cls: 'ag-badge-warning', label: 'Arrived' },
    'Picked_Up': { cls: 'ag-badge-success', label: 'Picked Up' },
  }
  const status = statusConfig[pickup.status] || { cls: 'ag-badge-neutral', label: pickup.status }

  const formatTime = (dateStr) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleString('en-IN', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    })
  }

  return (
    <div onClick={onClick} className="ag-card-interactive p-3">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center ${
          isMac ? 'bg-orange-50' : 'bg-emerald-50'
        }`}>
          {isMac ? <Laptop className="w-4 h-4 text-orange-600" /> : <Tablet className="w-4 h-4 text-emerald-600" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-stone-800 text-xs truncate">
              {pickup.model_name || pickup.device_type}
            </h3>
            <span className={`ag-badge text-[10px] ${status.cls}`}>
              {status.label}
            </span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <p className="text-[10px] text-stone-400 flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" />
              {formatTime(pickup.pickup_scheduled_time)}
            </p>
            <p className="font-bold text-xs text-stone-800">
              ₹{(pickup.final_price || pickup.admin_offer_price || pickup.system_estimated_price || 0).toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
