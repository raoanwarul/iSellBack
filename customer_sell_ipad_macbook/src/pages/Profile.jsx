import { useState, useEffect } from 'react'
import { useStore } from '../store/useStore'
import {
  User, Mail, Phone, MapPin, Edit3, Save, X,
  Package, CheckCircle2, IndianRupee, Clock, Shield, Truck
} from 'lucide-react'

export default function Profile() {
  const { agent, completedPickups, stats, fetchAssignedPickups, updateProfile, isLoading } = useStore()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    name: '',
    phone: '',
  })
  const [saveMsg, setSaveMsg] = useState(null)

  useEffect(() => {
    fetchAssignedPickups()
  }, [])

  useEffect(() => {
    if (agent) {
      setForm({
        name: agent.name || '',
        phone: agent.phone || '',
      })
    }
  }, [agent])

  const handleSave = async () => {
    const success = await updateProfile(form)
    if (success) {
      setSaveMsg({ type: 'success', text: 'Profile updated successfully!' })
      setEditing(false)
    } else {
      setSaveMsg({ type: 'error', text: 'Failed to update profile' })
    }
    setTimeout(() => setSaveMsg(null), 3000)
  }

  const displayName = form.name || agent?.email?.split('@')[0] || 'Agent'
  const joinDate = agent?.created_at
    ? new Date(agent.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : 'Recently'

  return (
    <div className="max-w-4xl mx-auto space-y-5 animate-fade-in-up">
      {/* Profile Header */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-5 shadow-sm">
        <div className="gradient-agent p-6 text-white relative overflow-hidden">
          <div className="absolute inset-0 noise-overlay" />
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-16 h-16 bg-white/15 rounded-full flex items-center justify-center text-2xl font-extrabold backdrop-blur-sm border border-white/20">
              {agent?.profile_photo_url ? (
                <img src={agent.profile_photo_url} alt="Profile" className="w-full h-full object-cover rounded-xl" />
              ) : (
                <span className="text-3xl font-bold text-white">
                  {displayName[0]?.toUpperCase() || 'A'}
                </span>
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white">{displayName}</h1>
              <p className="text-sm text-white/80 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" /> {agent?.email}
              </p>
              {form.phone && (
                <p className="text-sm text-white/80 flex items-center gap-1.5 mt-0.5">
                  <Phone className="w-3.5 h-3.5" /> {form.phone}
                </p>
              )}
              <p className="text-xs text-white/60 mt-2 flex items-center gap-1">
                <Shield className="w-3 h-3" /> Agent since {joinDate}
              </p>
            </div>
            <button
              onClick={() => editing ? handleSave() : setEditing(true)}
              disabled={isLoading}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                editing
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {editing ? (
                <>{isLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />} Save</>
              ) : (
                <><Edit3 className="w-4 h-4" /> Edit</>
              )}
            </button>
          </div>
        </div>
        <div className="pt-6 pb-6 px-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900">{displayName}</h1>
                <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                  {agent?.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-1">
                <Mail className="w-3.5 h-3.5" /> {agent?.email}
              </p>
              {form.phone && (
                <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-0.5">
                  <Phone className="w-3.5 h-3.5" /> {form.phone}
                </p>
              )}
              <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                <Shield className="w-3 h-3" /> Agent since {joinDate}
              </p>
            </div>
          </div>
        </div>
      </div>

      {saveMsg && (
        <div className={`p-3 rounded-xl text-sm ${
          saveMsg.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
        }`}>
          {saveMsg.text}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Package} label="Active Pickups" value={stats.pending + stats.enRoute + stats.arrived} color="orange" />
        <StatCard icon={CheckCircle2} label="Completed" value={stats.completed} color="green" />
        <StatCard icon={Truck} label="Total Deliveries" value={completedPickups.length} color="blue" />
        <StatCard icon={IndianRupee} label="Total Value" value={`₹${stats.totalEarnings.toLocaleString('en-IN')}`} color="emerald" />
      </div>

      {/* Edit Form */}
      {editing && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-5 shadow-sm">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <button onClick={() => setEditing(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
              Edit Profile
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4 p-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Your name"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="+91 XXXXX XXXXX"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Account Info */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-5 shadow-sm">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900 text-sm">Account Information</h2>
        </div>
        <div className="space-y-4 p-5">
          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <Mail className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Email Address</p>
              <p className="font-medium text-gray-900 text-sm">{agent?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Agent ID</p>
              <p className="font-medium text-gray-900 text-sm">{agent?.id?.substring(0, 16)}...</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <MapPin className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Service Area</p>
              <p className="font-medium text-gray-900 text-sm">{agent?.service_area || 'All Areas'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color }) {
  const colors = {
    orange: { bg: 'bg-orange-50', icon: 'text-orange-600' },
    green: { bg: 'bg-emerald-50', icon: 'text-emerald-600' },
    blue: { bg: 'bg-blue-50', icon: 'text-blue-600' },
    emerald: { bg: 'bg-teal-50', icon: 'text-teal-600' },
  }
  const c = colors[color] || colors.orange
  return (
    <div className="bg-white rounded-xl p-4 border border-gray-100 card-hover shadow-sm">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2.5 ${c.bg}`}>
        <Icon className={`w-[18px] h-[18px] ${c.icon}`} />
      </div>
      <p className="text-xl font-extrabold text-gray-900">{value}</p>
      <p className="text-[11px] text-gray-400">{label}</p>
    </div>
  )
}
