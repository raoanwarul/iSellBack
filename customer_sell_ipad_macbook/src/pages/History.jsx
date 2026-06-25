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
    <div className="animate-fade-in-up">
      <div className="mb-5">
        <h1 className="text-xl font-extrabold text-gray-900">Pickup History</h1>
        <p className="text-sm text-gray-400">{completedPickups.length} completed deliveries</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-white rounded-xl border border-gray-100 p-4 card-hover shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-[18px] h-[18px] text-emerald-600" />
            </div>
            <div>
              <p className="text-xl font-extrabold text-gray-900">{completedPickups.length}</p>
              <p className="text-[11px] text-gray-400">Completed</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 card-hover shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-teal-50 rounded-lg flex items-center justify-center">
              <IndianRupee className="w-[18px] h-[18px] text-teal-600" />
            </div>
            <div>
              <p className="text-xl font-extrabold text-gray-900">₹{totalEarnings.toLocaleString('en-IN')}</p>
              <p className="text-[11px] text-gray-400">Total Value</p>
            </div>
          </div>
        </div>
      </div>

      {/* History List */}
      {isLoading && completedPickups.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-10 h-10 border-3 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading history...</p>
        </div>
      ) : completedPickups.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <Package className="w-14 h-14 text-gray-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-900 mb-1">No Completed Pickups</h3>
          <p className="text-sm text-gray-400">Your completed pickups will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {completedPickups.map((pickup) => {
            const user = pickup.users || {}
            const isMac = pickup.device_type === 'MacBook'

            return (
              <div
                key={pickup.id}
                onClick={() => navigate(`/pickups/${pickup.id}`)}
                className="bg-white rounded-xl border border-gray-100 p-4 card-hover shadow-sm cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center ${
                    isMac ? 'bg-indigo-50' : 'bg-emerald-50'
                  }`}>
                    {isMac ? <Laptop className="w-5 h-5 text-indigo-600" /> : <Tablet className="w-5 h-5 text-emerald-600" />}
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
                      <ArrowRight className="w-4 h-4 text-gray-400" />
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
