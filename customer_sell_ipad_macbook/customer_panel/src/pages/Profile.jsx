import { useState, useEffect } from 'react'
import { useStore } from '../store/useStore'
import {
  User, Mail, Phone, MapPin, Edit3, Save, X,
  ShoppingBag, CheckCircle2, IndianRupee, Clock, Shield, Wallet,
  Bell, Trash2, Plus, Check
} from 'lucide-react'

export default function Profile() {
  const { user, userProfile, sellRequests, fetchUserRequests, updateProfile, isLoading } = useStore()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    upi_id: '',
  })
  const [saveMsg, setSaveMsg] = useState(null)
  
  const [notifs, setNotifs] = useState({ email: true, sms: true, push: true })
  const [addresses, setAddresses] = useState([])
  const [newAddrLabel, setNewAddrLabel] = useState('Home')
  const [newAddrVal, setNewAddrVal] = useState('')
  const [addingAddress, setAddingAddress] = useState(false)

  useEffect(() => {
    fetchUserRequests()
  }, [])

  useEffect(() => {
    if (userProfile) {
      setForm({
        name: userProfile.name || user?.user_metadata?.name || '',
        phone: userProfile.phone || '',
        address: userProfile.address || userProfile.saved_address || '',
        upi_id: userProfile.upi_id || '',
      })
      setNotifs(userProfile.notification_preferences || { email: true, sms: true, push: true })
      setAddresses(userProfile.saved_addresses || [])
    }
  }, [userProfile, user])

  const totalRequests = sellRequests.length
  const completedRequests = sellRequests.filter(r => r.status === 'Completed').length
  const activeRequests = sellRequests.filter(r => !['Completed', 'Rejected', 'Cancelled'].includes(r.status)).length
  const totalEarnings = sellRequests
    .filter(r => r.status === 'Completed')
    .reduce((sum, r) => sum + (r.final_price || r.admin_offer_price || r.system_estimated_price || 0), 0)

  const handleSave = async () => {
    const success = await updateProfile({
      name: form.name,
      phone: form.phone,
      saved_address: form.address,
      upi_id: form.upi_id || null,
    })
    if (success) {
      setSaveMsg({ type: 'success', text: 'Profile updated successfully!' })
      setEditing(false)
    } else {
      setSaveMsg({ type: 'error', text: 'Failed to update profile' })
    }
    setTimeout(() => setSaveMsg(null), 3000)
  }

  const handleToggleNotif = async (key) => {
    const updated = { ...notifs, [key]: !notifs[key] }
    setNotifs(updated)
    await updateProfile({ notification_preferences: updated })
  }

  const handleAddAddress = async () => {
    if (!newAddrVal.trim()) return
    const newAddr = { id: Math.random().toString(36).substring(7), label: newAddrLabel, address: newAddrVal.trim() }
    const updated = [...addresses, newAddr]
    setAddresses(updated)
    setNewAddrVal('')
    setAddingAddress(false)
    const updates = { saved_addresses: updated }
    if (!userProfile?.saved_address && !form.address) {
      updates.saved_address = newAddr.address
      setForm(f => ({ ...f, address: newAddr.address }))
    }
    await updateProfile(updates)
  }

  const handleDeleteAddress = async (id) => {
    const updated = addresses.filter(a => a.id !== id)
    setAddresses(updated)
    await updateProfile({ saved_addresses: updated })
  }

  const handleSetPrimaryAddress = async (addrText) => {
    setForm(f => ({ ...f, address: addrText }))
    await updateProfile({ saved_address: addrText })
  }

  const displayName = form.name || user?.email?.split('@')[0] || 'Customer'
  const joinDate = userProfile?.created_at
    ? new Date(userProfile.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : 'Recently'

  return (
    <div className="max-w-4xl mx-auto space-y-6 px-2 sm:px-4">
      {/* Profile Header */}
      <div className="card overflow-hidden">
        <div className="h-32 relative" style={{ background: 'var(--gradient-cta)' }}>
          <div className="absolute -bottom-10 left-6">
            <div className="w-20 h-20 rounded-2xl shadow-lg flex items-center justify-center border-4"
              style={{ background: 'var(--color-surface)', borderColor: 'var(--color-surface)' }}>
              <span className="text-3xl font-black text-gradient">
                {displayName[0]?.toUpperCase() || 'C'}
              </span>
            </div>
          </div>
        </div>
        <div className="pt-12 pb-5 px-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-lg sm:text-xl font-black" style={{ color: 'var(--color-text)' }}>{displayName}</h1>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                <p className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> {user?.email}
                </p>
                {form.phone && (
                  <p className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" /> {form.phone}
                  </p>
                )}
              </div>
              <p className="text-[10px] uppercase font-bold tracking-wider mt-2.5 flex items-center gap-1.5" style={{ color: 'var(--color-text-muted)' }}>
                <Shield className="w-3.5 h-3.5" /> Member since {joinDate}
              </p>
            </div>
            <button
              onClick={() => editing ? handleSave() : setEditing(true)}
              disabled={isLoading}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                editing
                  ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                  : 'btn-secondary text-stone-700'
              }`}
            >
              {editing ? (
                <>{isLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save Details</>
              ) : (
                <><Edit3 className="w-3.5 h-3.5" /> Edit Profile</>
              )}
            </button>
          </div>
        </div>
      </div>

      {saveMsg && (
        <div className={`p-3.5 rounded-xl text-xs font-bold animate-fade-in ${
          saveMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
        }`}>
          {saveMsg.text}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={ShoppingBag} label="Total Requests" value={totalRequests} color="blue" />
        <StatCard icon={Clock} label="Active Requests" value={activeRequests} color="orange" />
        <StatCard icon={CheckCircle2} label="Completed Deals" value={completedRequests} color="green" />
        <StatCard icon={IndianRupee} label="Total Earnings" value={`₹${totalEarnings.toLocaleString('en-IN')}`} color="purple" />
      </div>

      {/* Edit Form Card */}
      {editing && (
        <div className="card p-5 sm:p-6 animate-scale-in">
          <div className="flex items-center justify-between mb-4 pb-2 border-b" style={{ borderColor: 'var(--color-border)' }}>
            <h2 className="text-base font-black uppercase tracking-wider" style={{ color: 'var(--color-text)' }}>Edit Profile</h2>
            <button onClick={() => setEditing(false)} style={{ color: 'var(--color-text-muted)' }} className="hover:text-stone-600 p-1">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase mb-1" style={{ color: 'var(--color-text-secondary)' }}>Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input w-full pl-10 text-sm"
                  placeholder="Your name"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-1" style={{ color: 'var(--color-text-secondary)' }}>Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="input w-full pl-10 text-sm"
                  placeholder="+91 XXXXX XXXXX"
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase mb-1" style={{ color: 'var(--color-text-secondary)' }}>Address</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
                <textarea
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="input w-full pl-10 pr-4 py-2.5 h-20"
                  placeholder="Your complete pickup address"
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase mb-1" style={{ color: 'var(--color-text-secondary)' }}>UPI ID (for payouts)</label>
              <div className="relative">
                <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
                <input
                  type="text"
                  value={form.upi_id}
                  onChange={(e) => setForm({ ...form, upi_id: e.target.value })}
                  className="input w-full pl-10 text-sm"
                  placeholder="yourname@upi"
                />
              </div>
              <p className="text-[10px] mt-1.5 font-medium" style={{ color: 'var(--color-text-muted)' }}>This UPI ID is used by shop agents to process your device payment instantly.</p>
            </div>
          </div>
        </div>
      )}

      {/* Account Info Details */}
      <div className="card p-5 sm:p-6">
        <h2 className="text-base font-black uppercase tracking-wider mb-4 pb-2 border-b" style={{ color: 'var(--color-text)', borderColor: 'var(--color-border)' }}>Account Details</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3.5 p-3.5 rounded-2xl" style={{ background: 'var(--color-surface-2)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(8,145,178,0.08)', color: 'var(--color-primary)' }}>
              <Mail className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Email Address</p>
              <p className="font-semibold text-sm mt-0.5 truncate" style={{ color: 'var(--color-text)' }}>{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3.5 p-3.5 rounded-2xl" style={{ background: 'var(--color-surface-2)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(16,185,129,0.08)', color: '#10B981' }}>
              <User className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Full Name</p>
              <p className="font-semibold text-sm mt-0.5 truncate" style={{ color: 'var(--color-text)' }}>{form.name || 'Not configured'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3.5 p-3.5 rounded-2xl" style={{ background: 'var(--color-surface-2)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(245,158,11,0.08)', color: '#F59E0B' }}>
              <Phone className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Phone Number</p>
              <p className="font-semibold text-sm mt-0.5 truncate" style={{ color: 'var(--color-text)' }}>{form.phone || 'Not configured'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3.5 p-3.5 rounded-2xl" style={{ background: 'var(--color-surface-2)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(139,92,246,0.08)', color: '#8B5CF6' }}>
              <Wallet className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>UPI ID</p>
              <p className="font-semibold text-sm mt-0.5 truncate" style={{ color: 'var(--color-text)' }}>{form.upi_id || 'Not configured'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Saved Addresses Section */}
      <div className="card p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4 pb-2 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <h2 className="text-base font-black uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
            <MapPin className="w-5 h-5 text-cyan-500" /> Saved Pickup Addresses
          </h2>
          <button
            onClick={() => setAddingAddress(!addingAddress)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold btn-secondary hover:bg-black/5 dark:hover:bg-white/5 transition-all text-stone-700"
          >
            <Plus className="w-3.5 h-3.5" /> Add New Address
          </button>
        </div>

        {addingAddress && (
          <div className="bg-stone-50/50 dark:bg-white/5 p-4 rounded-2xl mb-4 border border-dashed space-y-3" style={{ borderColor: 'var(--color-border)' }}>
            <div className="flex gap-2">
              {['Home', 'Office', 'Other'].map(lbl => (
                <button
                  key={lbl}
                  type="button"
                  onClick={() => setNewAddrLabel(lbl)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
                    newAddrLabel === lbl ? 'bg-cyan-500 border-cyan-500 text-white shadow-sm' : 'border-stone-300 dark:border-white/10 text-stone-600 dark:text-stone-400'
                  }`}
                >
                  {lbl}
                </button>
              ))}
            </div>
            <textarea
              value={newAddrVal}
              onChange={(e) => setNewAddrVal(e.target.value)}
              placeholder="Enter complete address..."
              rows={2}
              className="input w-full text-xs py-2 resize-none"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setAddingAddress(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-stone-500 hover:bg-black/5"
              >
                Cancel
              </button>
              <button
                onClick={handleAddAddress}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-cyan-500 text-white hover:bg-cyan-600 shadow-sm"
              >
                Add Address
              </button>
            </div>
          </div>
        )}

        {addresses.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>No saved addresses. Your primary profile address is used for device pickups.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {addresses.map((addr) => {
              const isPrimary = form.address === addr.address;
              return (
                <div key={addr.id} className="p-3.5 rounded-2xl border flex items-start justify-between gap-3 bg-stone-50/20 dark:bg-white/[0.01]" style={{ borderColor: 'var(--color-border)' }}>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-500">
                        {addr.label}
                      </span>
                      {isPrimary && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Primary Pickup
                        </span>
                      )}
                    </div>
                    <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{addr.address}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {!isPrimary && (
                      <button
                        onClick={() => handleSetPrimaryAddress(addr.address)}
                        className="text-[10px] font-bold uppercase tracking-wider text-cyan-500 hover:underline px-2 py-1"
                      >
                        Set Primary
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteAddress(addr.id)}
                      className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Delete address"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Notification Preferences Section */}
      <div className="card p-5 sm:p-6">
        <h2 className="text-base font-black uppercase tracking-wider mb-4 pb-2 border-b flex items-center gap-2" style={{ color: 'var(--color-text)', borderColor: 'var(--color-border)' }}>
          <Bell className="w-5 h-5 text-cyan-500" /> Notification Preferences
        </h2>
        <div className="space-y-4">
          {[
            { key: 'email', label: 'Email Notifications', desc: 'Receive valuation offers, device verification certificates, and pickup reminders via email.' },
            { key: 'sms', label: 'SMS Notifications', desc: 'Receive instant pickup alerts, agent contact details, and payment notifications via SMS.' },
            { key: 'push', label: 'Push Notifications', desc: 'Receive real-time dashboard alerts, in-app support message updates, and tracking details.' }
          ].map((item) => (
            <div key={item.key} className="flex items-start justify-between gap-4 py-2">
              <div className="space-y-0.5 max-w-[80%]">
                <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{item.label}</p>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{item.desc}</p>
              </div>
              <button
                type="button"
                onClick={() => handleToggleNotif(item.key)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  notifs[item.key] ? 'bg-cyan-500' : 'bg-stone-200 dark:bg-white/10'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    notifs[item.key] ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color }) {
  const colors = {
    blue: { bg: 'rgba(59,130,246,0.08)', text: '#3B82F6' },
    orange: { bg: 'rgba(245,158,11,0.08)', text: '#F59E0B' },
    green: { bg: 'rgba(16,185,129,0.08)', text: '#10B981' },
    purple: { bg: 'rgba(139,92,246,0.08)', text: '#8B5CF6' },
  }
  return (
    <div className="card p-4 sm:p-5 flex flex-col justify-between">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 shrink-0"
        style={{ background: colors[color].bg, color: colors[color].text }}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-lg sm:text-xl font-black" style={{ color: 'var(--color-text)' }}>{value}</p>
        <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>{label}</p>
      </div>
    </div>
  )
}
