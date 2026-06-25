import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { 
  ShoppingBag, Clock, CheckCircle, DollarSign,
  TrendingUp, AlertTriangle, ArrowRight, Laptop,
  Tablet, Users, Package, Store,
} from 'lucide-react'

export default function Dashboard() {
  const { stats, requests, fraudAlerts, fetchStats, fetchRequests, fetchFraudAlerts, isLoading, selectRequest } = useStore()
  const navigate = useNavigate()

  useEffect(() => {
    fetchStats()
    fetchRequests()
    fetchFraudAlerts()
  }, [])

  const recentRequests = requests.slice(0, 6)

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Page Header */}
      <div className="relative rounded-2xl overflow-hidden noise-overlay p-6" style={{ background: 'var(--bo-gradient)' }}>
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-[100px]" style={{ background: 'rgba(255,255,255,0.1)' }} />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium mb-3" style={{ background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)' }}>
            <Store className="w-3 h-3" /> Store Dashboard
          </div>
          <h1 className="text-xl lg:text-2xl font-extrabold text-white mb-1">Welcome back!</h1>
          <p className="text-white/75 text-sm">Here's what's happening with your store today.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={ShoppingBag} label="Total Requests" value={stats.totalRequests} color="violet" />
        <StatCard icon={Clock} label="Pending" value={stats.pendingRequests} color="amber" />
        <StatCard icon={CheckCircle} label="Completed" value={stats.completedRequests} color="emerald" />
        <StatCard icon={DollarSign} label="Total Value" value={`₹${(stats.totalRevenue || 0).toLocaleString()}`} color="blue" />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Package, label: 'Add Listing', desc: 'List a device', onClick: () => navigate('/listings'), gradient: 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(124,58,237,0.02))' },
          { icon: ClipboardList, label: 'View Orders', desc: 'Manage requests', onClick: () => navigate('/requests'), gradient: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(245,158,11,0.02))' },
          { icon: Users, label: 'Agents', desc: 'Manage team', onClick: () => navigate('/agents'), gradient: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(16,185,129,0.02))' },
          { icon: TrendingUp, label: 'Pricing', desc: 'Price engine', onClick: () => navigate('/price-engine'), gradient: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(59,130,246,0.02))' },
        ].map((action, i) => (
          <div key={i} onClick={action.onClick} className="bo-card-interactive p-4 group cursor-pointer" style={{ background: action.gradient }}>
            <action.icon className="w-5 h-5 text-gray-400 group-hover:text-violet-500 transition-colors mb-3" />
            <p className="font-bold text-gray-800 text-sm">{action.label}</p>
            <p className="text-[11px] text-gray-400">{action.desc}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-4">
        {/* Recent Requests */}
        <div className="lg:col-span-3 bo-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: '1px solid var(--bo-border)' }}>
            <h2 className="font-bold text-gray-800 text-sm">Recent Orders</h2>
            <button onClick={() => navigate('/requests')}
              className="text-xs font-semibold flex items-center gap-1 hover:opacity-80 transition-opacity" style={{ color: 'var(--bo-primary)' }}>
              View All <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          {recentRequests.length === 0 ? (
            <div className="p-10 text-center text-gray-400 text-sm">No requests yet</div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden sm:block">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--bo-border)' }}>
                      <th className="text-left px-5 py-2.5 text-xs font-bold text-gray-400 uppercase tracking-wider">Device</th>
                      <th className="text-left px-5 py-2.5 text-xs font-bold text-gray-400 uppercase tracking-wider">Customer</th>
                      <th className="text-right px-5 py-2.5 text-xs font-bold text-gray-400 uppercase tracking-wider">Price</th>
                      <th className="text-right px-5 py-2.5 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentRequests.map((request) => (
                      <tr key={request.id}
                        className="hover:bg-gray-50/80 transition-colors cursor-pointer"
                        style={{ borderBottom: '1px solid var(--bo-border)' }}
                        onClick={() => { selectRequest(request); navigate('/requests') }}>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                              request.device_type === 'MacBook' ? 'bg-violet-50' : 'bg-violet-50'
                            }`}>
                              {request.device_type === 'MacBook' 
                                ? <Laptop className="w-3.5 h-3.5 text-violet-600" />
                                : <Tablet className="w-3.5 h-3.5 text-violet-600" />}
                            </div>
                            <span className="font-semibold text-gray-800 text-sm truncate">{request.model_name || request.device_type}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-sm text-gray-500">{request.users?.name || request.users?.phone || 'Unknown'}</td>
                        <td className="px-5 py-3 text-right font-bold text-sm text-gray-800">₹{(request.system_estimated_price || 0).toLocaleString()}</td>
                        <td className="px-5 py-3 text-right">
                          <StatusBadge status={request.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Mobile list */}
              <div className="sm:hidden">
                {recentRequests.map((request) => (
                  <div key={request.id}
                    className="px-4 py-3 hover:bg-gray-50/80 transition-colors cursor-pointer"
                    style={{ borderBottom: '1px solid var(--bo-border)' }}
                    onClick={() => { selectRequest(request); navigate('/requests') }}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-800 text-sm truncate">{request.model_name || request.device_type}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{request.users?.name || 'Unknown'}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-gray-800 text-sm">₹{(request.system_estimated_price || 0).toLocaleString()}</p>
                        <StatusBadge status={request.status} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Right Column: Fraud Alerts */}
        <div className="lg:col-span-2 bo-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: '1px solid var(--bo-border)' }}>
            <h2 className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-red-500" /> Fraud Alerts
            </h2>
            <button onClick={() => navigate('/fraud-alerts')}
              className="text-xs font-semibold flex items-center gap-1 hover:opacity-80" style={{ color: 'var(--bo-primary)' }}>
              View All <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          {fraudAlerts.length === 0 ? (
            <div className="p-10 text-center">
              <CheckCircle className="w-10 h-10 text-violet-300 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No active alerts</p>
            </div>
          ) : (
            <div>
              {fraudAlerts.slice(0, 5).map((alert) => (
                <div key={alert.id} className="px-5 py-3 hover:bg-gray-50/80 transition-colors" style={{ borderBottom: '1px solid var(--bo-border)' }}>
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 bg-red-50 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-800 text-sm truncate">{alert.alert_message}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{new Date(alert.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color }) {
  const colors = {
    blue: { bg: 'bg-blue-50', icon: 'text-blue-600', border: 'border-blue-100' },
    amber: { bg: 'bg-amber-50', icon: 'text-amber-600', border: 'border-amber-100' },
    emerald: { bg: 'bg-violet-50', icon: 'text-violet-600', border: 'border-violet-100' },
    violet: { bg: 'bg-violet-50', icon: 'text-violet-600', border: 'border-violet-100' },
  }
  const c = colors[color] || colors.blue

  return (
    <div className={`bo-card ${c.border} p-4`}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.bg}`}>
          <Icon className={`w-5 h-5 ${c.icon}`} />
        </div>
        <div>
          <p className="text-lg lg:text-xl font-extrabold text-gray-800">{value}</p>
          <p className="text-[11px] text-gray-400">{label}</p>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  const config = {
    'Pending': 'bo-badge-warning',
    'Reviewing': 'bo-badge-primary',
    'Approved': 'bo-badge-success',
    'Completed': 'bo-badge-success',
    'Rejected': 'bo-badge-error',
    'Cancelled': 'bo-badge-neutral',
  }
  return (
    <span className={`bo-badge text-[10px] ${config[status] || 'bo-badge-neutral'}`}>
      {status?.replace(/_/g, ' ')}
    </span>
  )
}

// This import was used in the old quick-action section
const ClipboardList = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/>
  </svg>
)
