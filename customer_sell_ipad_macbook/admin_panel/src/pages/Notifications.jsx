import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Bell, Check, CheckCheck, Trash2, Clock, Package, UserCheck, DollarSign, AlertTriangle } from 'lucide-react'

const typeIcons = {
  status_change: Package,
  agent_assigned: UserCheck,
  offer: DollarSign,
  fraud_alert: AlertTriangle,
  general: Bell,
}

const typeColors = {
  status_change: 'bg-blue-100 text-blue-600',
  agent_assigned: 'bg-purple-100 text-purple-600',
  offer: 'bg-emerald-100 text-emerald-600',
  fraud_alert: 'bg-red-100 text-red-600',
  general: 'bg-gray-100 text-gray-600',
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export default function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadNotifications()

    // Subscribe to new notifications
    const channel = supabase
      .channel('admin_notifications_page')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
      }, (payload) => {
        setNotifications(prev => [payload.new, ...prev])
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  async function loadNotifications() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Admin sees all notifications (both their own and system-wide)
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (!error) setNotifications(data || [])
    } catch (e) {
      console.error('Failed to load notifications:', e)
    } finally {
      setLoading(false)
    }
  }

  async function markAsRead(id) {
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  async function markAllAsRead() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('notifications').update({ read: true }).eq('read', false)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  async function deleteNotification(id) {
    await supabase.from('notifications').delete().eq('id', id)
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const unreadCount = notifications.filter(n => !n.read).length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5" /> Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <Bell className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const Icon = typeIcons[n.type] || typeIcons.general
            const colorClass = typeColors[n.type] || typeColors.general
            return (
              <div
                key={n.id}
                className={`flex items-start gap-3 p-4 rounded-xl border transition-colors ${
                  n.read
                    ? 'bg-white border-gray-100'
                    : 'bg-emerald-50/50 border-emerald-100'
                }`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${n.read ? 'text-gray-700' : 'text-gray-900 font-semibold'}`}>
                    {n.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body || n.message}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Clock className="w-3 h-3 text-gray-300" />
                    <span className="text-[10px] text-gray-400">{timeAgo(n.created_at)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {!n.read && (
                    <button
                      onClick={() => markAsRead(n.id)}
                      className="p-1.5 hover:bg-emerald-100 rounded-lg transition-colors"
                      title="Mark as read"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(n.id)}
                    className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-gray-300 hover:text-red-400" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
