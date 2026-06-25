import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import {
  Laptop, Tablet, ArrowRight, Store, ShoppingBag,
  TrendingUp, Clock, CheckCircle2, ClipboardList,
  Sparkles, ChevronRight, MapPin, Building2,
  ArrowUpRight, BarChart3, Package, Star, HelpCircle
} from 'lucide-react'

export default function Home() {
  const {
    user, userProfile, sellRequests,
    fetchUserRequests, fetchPriceEngine, fetchConditionDeductions,
    priceEngineModels, setDeviceType, setModel, resetSellFlow,
  } = useStore()
  const navigate = useNavigate()
  const [pickedDevice, setPickedDevice] = useState(null)
  const [pickedModelId, setPickedModelId] = useState(null)

  useEffect(() => {
    fetchUserRequests()
    fetchPriceEngine()
    fetchConditionDeductions()
  }, [])

  const displayName = userProfile?.name || user?.user_metadata?.name || 'there'
  const pendingCount = sellRequests.filter(r => ['Pending', 'Reviewing'].includes(r.status)).length
  const activeCount = sellRequests.filter(r => !['Completed', 'Rejected', 'Cancelled'].includes(r.status)).length
  const completedCount = sellRequests.filter(r => r.status === 'Completed').length

  const deviceModels = useMemo(
    () => priceEngineModels.filter(m => m.device_type === pickedDevice),
    [priceEngineModels, pickedDevice]
  )

  function handlePickDevice(type) {
    setPickedDevice(type)
    setPickedModelId(null)
  }

  function handleSellDevice(type) {
    resetSellFlow()
    setDeviceType(type)
    navigate('/dashboard/sell')
  }

  function handleContinue() {
    if (!pickedDevice) return
    resetSellFlow()
    setDeviceType(pickedDevice)
    if (pickedModelId) {
      const model = deviceModels.find(m => m.id === pickedModelId)
      if (model) setModel(model)
    }
    navigate('/dashboard/sell')
  }

  const formatPrice = (p) => '₹' + Number(p || 0).toLocaleString('en-IN')

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* ─── Welcome + Quick Sell Hero ─── */}
      <div className="relative rounded-2xl overflow-hidden noise-overlay" style={{ background: 'var(--color-surface)' }}>
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.18) 0%, rgba(139,92,246,0.12) 50%, rgba(245,158,11,0.10) 100%)' }} />
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-[100px]" style={{ background: 'rgba(6,182,212,0.15)' }} />
        
        <div className="relative z-10 p-5 sm:p-6 lg:p-8">
          <div className="mb-5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium badge-primary mb-3">
              <Sparkles className="w-3 h-3" /> Quick Sell
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold mb-1" style={{ color: 'var(--color-text)' }}>
              Hello, {displayName}!
            </h1>
            <p className="text-sm max-w-md" style={{ color: 'var(--color-text-muted)' }}>
              Select device to get an instant quote, or browse the marketplace.
            </p>
          </div>

          {/* Device Type Selector */}
          <div className="flex flex-wrap gap-2.5 mb-4">
            {[
              { id: 'MacBook', icon: Laptop, gradient: 'linear-gradient(135deg, #06B6D4, #0EA5E9)' },
              { id: 'iPad', icon: Tablet, gradient: 'linear-gradient(135deg, #10B981, #059669)' },
            ].map(({ id, icon: Icon, gradient }) => (
              <button
                key={id}
                onClick={() => handlePickDevice(id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                  pickedDevice === id
                    ? 'text-white shadow-md scale-[1.03]'
                    : 'border hover:scale-[1.02]'
                }`}
                style={pickedDevice === id
                  ? { background: gradient }
                  : { background: 'var(--color-surface)', color: 'var(--color-text-secondary)', borderColor: 'var(--color-border-hover)' }
                }
              >
                <Icon className="w-4 h-4" /> {id}
              </button>
            ))}
            <button
              onClick={() => navigate('/dashboard/stores')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm border transition-all hover:scale-[1.02]"
              style={{ background: 'var(--color-surface)', color: 'var(--color-text-secondary)', borderColor: 'var(--color-border-hover)' }}
            >
              <Store className="w-4 h-4 text-cyan-500" /> Browse Store
            </button>
          </div>

          {/* Model Picker */}
          {pickedDevice && (
            <div className="flex flex-wrap items-center gap-2 animate-fade-in">
              <div className="relative">
                <select
                  value={pickedModelId || ''}
                  onChange={e => setPickedModelId(e.target.value || null)}
                  className="h-10 rounded-xl text-sm pl-3 pr-8 outline-none appearance-none cursor-pointer"
                  style={{
                    background: 'var(--color-surface-2)',
                    color: 'var(--color-text)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <option value="">Select {pickedDevice} model…</option>
                  {deviceModels.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.model_name} — up to {formatPrice(m.base_price)}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleContinue}
                className="btn-primary h-10 px-4 text-sm flex items-center gap-1.5"
              >
                {pickedModelId ? 'Continue' : 'Start sell flow'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ─── Stats Cards ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: ClipboardList, label: 'Total Orders', value: sellRequests.length, color: 'text-cyan-400', bg: 'var(--color-primary-glow)' },
          { icon: Clock, label: 'Pending', value: pendingCount, color: 'text-amber-400', bg: 'rgba(245,158,11,0.12)' },
          { icon: TrendingUp, label: 'Active', value: activeCount, color: 'text-violet-400', bg: 'rgba(139,92,246,0.12)' },
          { icon: CheckCircle2, label: 'Completed', value: completedCount, color: 'text-emerald-400', bg: 'rgba(16,185,129,0.12)' },
        ].map((stat, i) => (
          <div key={i} className="card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: stat.bg }}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-lg font-extrabold" style={{ color: 'var(--color-text)' }}>{stat.value}</p>
                <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ─── Quick Actions ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { icon: Store, label: 'Browse Store', desc: 'Find devices', onClick: () => navigate('/dashboard/stores'), gradient: 'linear-gradient(135deg, rgba(6,182,212,0.15), rgba(6,182,212,0.05))' },
          { icon: ShoppingBag, label: 'Sell MacBook', desc: 'Get a quote', onClick: () => handleSellDevice('MacBook'), gradient: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05))' },
          { icon: Tablet, label: 'Sell iPad', desc: 'Get a quote', onClick: () => handleSellDevice('iPad'), gradient: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))' },
          { icon: BarChart3, label: 'My Orders', desc: 'Track status', onClick: () => navigate('/dashboard/requests'), gradient: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(139,92,246,0.05))' },
          { icon: HelpCircle, label: 'Support Center', desc: 'File a ticket', onClick: () => navigate('/dashboard/support'), gradient: 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.05))' },
        ].map((action, i) => (
          <div key={i} onClick={action.onClick} className="card-interactive p-4 group cursor-pointer" style={{ background: action.gradient }}>
            <action.icon className="w-5 h-5 text-gray-500 group-hover:text-cyan-500 transition-colors mb-3" />
            <p className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>{action.label}</p>
            <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>{action.desc}</p>
          </div>
        ))}
      </div>

      {/* ─── Device Cards + Recent Requests ─── */}
      <div className="grid lg:grid-cols-5 gap-5">
        {/* Device Cards */}
        <div className="lg:col-span-2">
          <h2 className="text-sm font-bold mb-3" style={{ color: 'var(--color-text)' }}>Sell a Device</h2>
          <div className="space-y-3">
            <div onClick={() => handleSellDevice('MacBook')} className="group card-interactive overflow-hidden cursor-pointer">
              <div className="h-28 lg:h-32 flex items-center justify-center relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #06B6D4, #0EA5E9, #3B82F6)' }}>
                <Laptop className="w-14 h-14 text-white/50 group-hover:scale-110 transition-transform" />
              </div>
              <div className="p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>Sell MacBook</h3>
                  <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>Air, Pro & more</p>
                </div>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--color-primary-glow)' }}>
                  <ArrowRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </div>

            <div onClick={() => handleSellDevice('iPad')} className="group card-interactive overflow-hidden cursor-pointer">
              <div className="h-28 lg:h-32 flex items-center justify-center relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #10B981, #059669, #047857)' }}>
                <Tablet className="w-14 h-14 text-white/50 group-hover:scale-110 transition-transform" />
              </div>
              <div className="p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>Sell iPad</h3>
                  <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>Air, Pro, Mini & more</p>
                </div>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.12)' }}>
                  <ArrowRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Requests */}
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>Recent Orders</h2>
            {sellRequests.length > 0 && (
              <button onClick={() => navigate('/dashboard/requests')}
                className="text-xs text-cyan-400 font-semibold hover:text-cyan-300 flex items-center gap-1">
                View All <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
          {sellRequests.length === 0 ? (
            <div className="card p-10 text-center">
              <ClipboardList className="w-10 h-10 text-gray-700 mx-auto mb-3" />
              <h3 className="font-semibold text-sm mb-1" style={{ color: 'var(--color-text)' }}>No Orders Yet</h3>
              <p className="text-xs mb-4" style={{ color: 'var(--color-text-muted)' }}>Start by selling your first device</p>
              <button onClick={() => navigate('/dashboard/sell')}
                className="text-xs text-cyan-400 font-semibold hover:text-cyan-300">
                Start Selling →
              </button>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
                {sellRequests.slice(0, 5).map((req) => (
                  <div key={req.id} onClick={() => navigate(`/dashboard/requests/${req.id}`)}
                    className="px-4 py-3.5 hover:bg-white/[0.02] transition-colors cursor-pointer flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                        style={{
                          background: req.device_type === 'MacBook' ? 'var(--color-primary-glow)' : 'rgba(16,185,129,0.12)'
                        }}>
                        {req.device_type === 'MacBook'
                          ? <Laptop className="w-4 h-4 text-cyan-400" />
                          : <Tablet className="w-4 h-4 text-emerald-400" />
                        }
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate" style={{ color: 'var(--color-text)' }}>{req.model_name || req.device_type}</p>
                        <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                          {new Date(req.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>
                        {formatPrice(req.admin_offer_price || req.system_estimated_price)}
                      </p>
                      <StatusBadge status={req.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  const config = {
    'Pending': { cls: 'badge-warning' },
    'Reviewing': { cls: 'badge-info' },
    'Approved': { cls: 'badge-success' },
    'Offer_Accepted': { cls: 'badge-success' },
    'Seller_Confirmed': { cls: 'badge-primary' },
    'Agent_Assigned': { cls: 'badge-primary' },
    'Pickup_Scheduled': { cls: 'badge-primary' },
    'Completed': { cls: 'badge-success' },
    'Rejected': { cls: 'badge-error' },
    'Cancelled': { cls: 'badge-neutral' },
  }
  const labels = {
    'Offer_Accepted': 'Accepted',
    'Seller_Confirmed': 'Confirmed',
    'Agent_Assigned': 'Assigned',
    'Pickup_Scheduled': 'Pickup',
  }
  const c = config[status] || { cls: 'badge-neutral' }
  return (
    <span className={`badge text-[10px] ${c.cls}`}>
      {labels[status] || status}
    </span>
  )
}
