import { useEffect } from 'react'
import { useStore } from '../store/useStore'
import { 
  AlertTriangle, 
  CheckCircle, 
  User,
  Phone,
  Clock
} from 'lucide-react'

export default function FraudAlerts() {
  const { fraudAlerts, fetchFraudAlerts, resolveFraudAlert, isLoading } = useStore()

  useEffect(() => {
    fetchFraudAlerts()
  }, [])

  const getAlertTypeInfo = (type) => {
    const types = {
      multiple_requests: {
        label: 'Multiple Requests',
        description: 'User has submitted many requests in a short period',
        color: 'bg-yellow-100 text-yellow-700'
      },
      same_id_different_users: {
        label: 'Duplicate ID',
        description: 'Same ID proof used by different accounts',
        color: 'bg-red-100 text-red-700'
      },
      suspicious_location: {
        label: 'Suspicious Location',
        description: 'Location pattern seems unusual',
        color: 'bg-orange-100 text-orange-700'
      }
    }
    return types[type] || { label: type, description: '', color: 'bg-gray-100 text-gray-700' }
  }

  const handleResolve = async (alertId) => {
    await resolveFraudAlert(alertId)
  }

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div>
        <h1 className="text-xl font-extrabold text-gray-900">Fraud Alerts</h1>
        <p className="text-gray-400 text-sm">Monitor and resolve suspicious activities</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 p-4 card-hover shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400">Active Alerts</p>
              <p className="text-2xl font-extrabold text-red-600 mt-1">{fraudAlerts.length}</p>
            </div>
            <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="px-5 py-3.5 border-b border-gray-100">
          <h2 className="font-bold text-gray-900 text-sm">Active Alerts</h2>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full mx-auto"></div>
          </div>
        ) : fraudAlerts.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-14 h-14 bg-violet-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-7 h-7 text-violet-400" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1 text-sm">All Clear!</h3>
            <p className="text-gray-400 text-sm">No active fraud alerts at the moment</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {fraudAlerts.map((alert) => {
              const typeInfo = getAlertTypeInfo(alert.alert_type)
              return (
                <div key={alert.id} className="px-5 py-3.5 hover:bg-gray-50/80 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="w-9 h-9 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${typeInfo.color}`}>
                          {typeInfo.label}
                        </span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(alert.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-900 font-medium">{alert.alert_message}</p>
                      <p className="text-sm text-gray-500 mt-1">{typeInfo.description}</p>
                      
                      {alert.users && (
                        <div className="mt-3 flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1 text-gray-600">
                            <User className="w-4 h-4" />
                            {alert.users.name || 'Unknown'}
                          </div>
                          <div className="flex items-center gap-1 text-gray-600">
                            <Phone className="w-4 h-4" />
                            {alert.users.phone}
                          </div>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleResolve(alert.id)}
                      className="px-3 py-1.5 bg-violet-50 text-violet-700 rounded-lg hover:bg-violet-100 transition-colors text-xs font-semibold flex items-center gap-1.5"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Resolve
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4">
        <h3 className="font-bold text-amber-800 mb-2 text-sm">About Fraud Detection</h3>
        <ul className="text-xs text-amber-700 space-y-1">
          <li>• <strong>Multiple Requests:</strong> Triggered when a user submits 5+ requests in 30 days</li>
          <li>• <strong>Duplicate ID:</strong> Same ID proof detected across different user accounts</li>
          <li>• <strong>Suspicious Location:</strong> Unusual location patterns or VPN usage detected</li>
        </ul>
      </div>
    </div>
  )
}
