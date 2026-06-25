import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import {
  Package, CheckCircle2, Laptop, Tablet, Clock, IndianRupee, ArrowRight
} from 'lucide-react'

export default function History() {
  const { completedPickups, fetchAssignedPickups, isLoading } = useStore()
  const navigate = useNavigate()

  useEffect(() => {
    fetchAssignedPickups()
  }, [])

  const totalEarnings = completedPickups.reduce((sum, p) =>
    sum + (p.final_price || p.admin_offer_price || 0), 0
  )

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    })
  }

  const formatPrice = (p) => (p || 0).toLocaleString('en-IN')

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Completed Pickups</h1>
        <p className="text-sm text-gray-500">{completedPickups.length} completed deliveries</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{completedPickups.length}</p>
          <p className="text-xs text-gray-500">Total Completed</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mb-3">
            <IndianRupee className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">₹{formatPrice(totalEarnings)}</p>
          <p className="text-xs text-gray-500">Total Value</p>
        </div>
      </div>

      {/* History List */}
      {isLoading && completedPickups.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-10 h-10 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading history...</p>
        </div>
      ) : completedPickups.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No Completed Pickups</h3>
          <p className="text-sm text-gray-500">Your completed pickups will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {completedPickups.map((pickup) => {
            const user = pickup.users || {}
            const isMac = pickup.device_type === 'MacBook'

            return (
              <div
                key={pickup.id}
                onClick={() => navigate(`/field-tech/pickups/${pickup.id}`)}
                className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center ${
                    isMac ? 'bg-indigo-100' : 'bg-emerald-100'
                  }`}>
                    {isMac ? <Laptop className="w-6 h-6 text-indigo-600" /> : <Tablet className="w-6 h-6 text-emerald-600" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-gray-900 truncate">
                          {pickup.model_name || pickup.device_type}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {user.name || 'Customer'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">
                          ₹{formatPrice(pickup.final_price || pickup.admin_offer_price)}
                        </p>
                        <span className="inline-block px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          Completed
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(pickup.updated_at)}
                      </p>
                      <ArrowRight className="w-4 h-4 text-gray-300" />
                    </div>
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
