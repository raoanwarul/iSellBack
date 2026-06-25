import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Bell, Check, CheckCheck, Trash2, Clock, Package, UserCheck, DollarSign } from 'lucide-react'

const typeIcons = {
  status_change: Package,
  agent_assigned: UserCheck,
  offer: DollarSign,
  general: Bell,
}

const typeColors = {
  status_change: { bg: 'rgba(59,130,246,0.12)', text: '#3B82F6' },
  agent_assigned: { bg: 'rgba(139,92,246,0.12)', text: '#8B5CF6' },
  offer: { bg: 'rgba(16,185,129,0.12)', text: '#10B981' },
  general: { bg: 'rgba(107,114,128,0.12)', text: 'var(--color-text-secondary)' },
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

    const channel = supabase
      .channel('customer_notifications_page')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
      }, (payload) => {
        // Only add if it's for the current user
        supabase.auth.getUser().then(({ data: { user } }) => {
          if (user && payload.new.user_id === user.id) {
            setNotifications(prev => [payload.new, ...prev])
          }
        })
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  async function loadNotifications() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
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
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false)
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-2 sm:px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-black text-gradient">Notifications</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all"
            style={{ background: 'var(--color-primary-glow)', color: 'var(--color-primary)' }}
          >
            <CheckCheck className="w-3.5 h-3.5" /> Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-16 card flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ background: 'var(--color-surface-2)' }}>
            <Bell className="w-6 h-6" style={{ color: 'var(--color-text-muted)' }} />
          </div>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {notifications.map((n) => {
            const Icon = typeIcons[n.type] || typeIcons.general
            const colorClass = typeColors[n.type] || typeColors.general
            return (
              <div
                key={n.id}
                className="flex items-start gap-3.5 p-4 rounded-xl border transition-colors duration-150"
                style={n.read ? {
                  background: 'var(--color-surface)',
                  borderColor: 'var(--color-border)',
                } : {
                  background: 'var(--color-primary-glow)',
                  borderColor: 'rgba(6,182,212,0.2)',
                }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: colorClass.bg, color: colorClass.text }}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm" style={n.read ? { color: 'var(--color-text)' } : { color: 'var(--color-text)', fontWeight: 800 }}>
                    {n.title}
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>{n.body || n.message}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Clock className="w-3 h-3" style={{ color: 'var(--color-text-muted)' }} />
                    <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>{timeAgo(n.created_at)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {!n.read && (
                    <button
                      onClick={() => markAsRead(n.id)}
                      className="p-1.5 rounded-lg hover:bg-black/5 transition-colors"
                      title="Mark as read"
                    >
                      <Check className="w-3.5 h-3.5" style={{ color: 'var(--color-primary)' }} />
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(n.id)}
                    className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" style={{ color: 'var(--color-text-muted)' }} />
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
