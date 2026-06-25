import { useEffect, useState } from 'react'
import { useStore } from '../store/useStore'
import {
  Store, MapPin, Phone, Clock, Plus, Trash2, CheckCircle2,
  AlertCircle, ShieldCheck, Save, RefreshCw, X
} from 'lucide-react'

export default function StoreSettings() {
  const {
    admin,
    businesses,
    selectedBusinessId,
    fetchAccessibleBusinesses,
    updateBusinessProfile,
    fetchServiceZones,
    addServiceZone,
    removeServiceZone
  } = useStore()

  const [activeBiz, setActiveBiz] = useState(null)
  const [zones, setZones] = useState([])
  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [addingZone, setAddingZone] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [profileError, setProfileError] = useState(null)
  const [zoneError, setZoneError] = useState(null)

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    name: '',
    short_description: '',
    whatsapp_number: '',
    storefront_address: '',
    business_hours: '',
    cover_image_url: '',
    delivery_options: { agent_pickup: true, store_visit: true }
  })

  // Service Zone Form State
  const [zoneForm, setZoneForm] = useState({
    pincode: '',
    city: '',
    state: ''
  })

  useEffect(() => {
    if (!businesses.length) {
      fetchAccessibleBusinesses()
    }
  }, [])

  useEffect(() => {
    if (selectedBusinessId && businesses.length) {
      const biz = businesses.find(b => b.id === selectedBusinessId)
      if (biz) {
        setActiveBiz(biz)
        setProfileForm({
          name: biz.name || '',
          short_description: biz.short_description || '',
          whatsapp_number: biz.whatsapp_number || '',
          storefront_address: biz.storefront_address || '',
          business_hours: biz.business_hours || '',
          cover_image_url: biz.cover_image_url || '',
          delivery_options: biz.delivery_options || { agent_pickup: true, store_visit: true }
        })
        loadZones()
      }
    }
  }, [selectedBusinessId, businesses])

  async function loadZones() {
    setLoading(true)
    try {
      const zData = await fetchServiceZones()
      setZones(zData)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    if (!activeBiz) return
    setSavingProfile(true)
    setProfileSuccess(false)
    setProfileError(null)

    try {
      const success = await updateBusinessProfile(activeBiz.id, profileForm)
      if (success) {
        setProfileSuccess(true)
        setTimeout(() => setProfileSuccess(false), 3000)
      } else {
        setProfileError('Failed to update store settings profile.')
      }
    } catch (err) {
      setProfileError(err.message)
    } finally {
      setSavingProfile(false)
    }
  }

  const handleDeliveryToggle = (key) => {
    const current = profileForm.delivery_options || { agent_pickup: true, store_visit: true }
    setProfileForm({
      ...profileForm,
      delivery_options: {
        ...current,
        [key]: !current[key]
      }
    })
  }

  const handleAddZone = async (e) => {
    e.preventDefault()
    if (!zoneForm.pincode.trim()) return
    setAddingZone(true)
    setZoneError(null)

    try {
      const success = await addServiceZone(
        zoneForm.pincode,
        zoneForm.city,
        zoneForm.state
      )
      if (success) {
        setZoneForm({ pincode: '', city: '', state: '' })
        await loadZones()
      } else {
        setZoneError('Failed to add coverage pincode. It might already exist.')
      }
    } catch (err) {
      setZoneError(err.message)
    } finally {
      setAddingZone(false)
    }
  }

  const handleRemoveZone = async (id) => {
    if (!confirm('Are you sure you want to remove coverage for this pincode?')) return
    try {
      const success = await removeServiceZone(id)
      if (success) {
        await loadZones()
      }
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Store Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure your storefront profiles, coverage pincodes, and pickup modes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card & Info */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleProfileSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 bg-gray-50/70 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-gray-900 text-sm">Storefront Profile</h2>
                <p className="text-xs text-gray-400 mt-0.5">Customize how your store appears to customers on the marketplace.</p>
              </div>
              <Store className="w-5 h-5 text-violet-500" />
            </div>

            <div className="p-5 sm:p-6 space-y-4">
              {profileSuccess && (
                <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm font-medium">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  Store profile saved successfully!
                </div>
              )}

              {profileError && (
                <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {profileError}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block mb-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">Store Name *</label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 text-sm outline-none focus:border-violet-400 focus:bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">WhatsApp Number *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={profileForm.whatsapp_number}
                      onChange={(e) => setProfileForm({ ...profileForm, whatsapp_number: e.target.value })}
                      className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-3.5 text-sm outline-none focus:border-violet-400 focus:bg-white"
                      placeholder="+91 XXXXX XXXXX"
                      required
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block mb-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">Short Description</label>
                  <input
                    type="text"
                    value={profileForm.short_description}
                    onChange={(e) => setProfileForm({ ...profileForm, short_description: e.target.value })}
                    className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 text-sm outline-none focus:border-violet-400 focus:bg-white"
                    placeholder="e.g. Best price for premium pre-owned Apple devices in Noida Sector 18."
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block mb-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">Storefront Address</label>
                  <textarea
                    value={profileForm.storefront_address}
                    onChange={(e) => setProfileForm({ ...profileForm, storefront_address: e.target.value })}
                    rows={2}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm outline-none focus:border-violet-400 focus:bg-white resize-none"
                    placeholder="Full storefront address that drop-off customers will visit..."
                  />
                </div>

                <div>
                  <label className="block mb-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">Business Hours</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={profileForm.business_hours}
                      onChange={(e) => setProfileForm({ ...profileForm, business_hours: e.target.value })}
                      className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-3.5 text-sm outline-none focus:border-violet-400 focus:bg-white"
                      placeholder="e.g. 10:00 AM - 08:00 PM"
                    />
                  </div>
                </div>

                <div>
                  <label className="block mb-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">Cover Image URL</label>
                  <input
                    type="text"
                    value={profileForm.cover_image_url}
                    onChange={(e) => setProfileForm({ ...profileForm, cover_image_url: e.target.value })}
                    className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 text-sm outline-none focus:border-violet-400 focus:bg-white"
                    placeholder="https://example.com/store.jpg"
                  />
                </div>
              </div>

              {/* Delivery / Dropoff Options */}
              <div className="pt-2">
                <label className="block mb-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Service Handover Options</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => handleDeliveryToggle('agent_pickup')}
                    className={`flex items-center justify-between p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                      profileForm.delivery_options?.agent_pickup ? 'border-violet-300 bg-violet-50/40' : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div>
                      <p className="font-bold text-xs text-gray-800">Home Agent Pickup</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">Send agent to collect from user's address.</p>
                    </div>
                    <div className={`w-9 h-5 rounded-full flex items-center transition-colors ${
                      profileForm.delivery_options?.agent_pickup ? 'bg-violet-600 justify-end' : 'bg-gray-300 justify-start'
                    }`}>
                      <div className="w-4 h-4 bg-white rounded-full shadow mx-0.5" />
                    </div>
                  </div>

                  <div
                    onClick={() => handleDeliveryToggle('store_visit')}
                    className={`flex items-center justify-between p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                      profileForm.delivery_options?.store_visit ? 'border-violet-300 bg-violet-50/40' : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div>
                      <p className="font-bold text-xs text-gray-800">Storefront Drop-off</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">Let customers drop device directly at shop.</p>
                    </div>
                    <div className={`w-9 h-5 rounded-full flex items-center transition-colors ${
                      profileForm.delivery_options?.store_visit ? 'bg-violet-600 justify-end' : 'bg-gray-300 justify-start'
                    }`}>
                      <div className="w-4 h-4 bg-white rounded-full shadow mx-0.5" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/40 flex justify-end">
              <button
                type="submit"
                disabled={savingProfile}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold text-xs hover:shadow-lg transition-all disabled:opacity-50"
              >
                {savingProfile ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                {savingProfile ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Service Zones / Pincodes */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="px-5 py-4 border-b border-gray-50 bg-gray-50/70">
              <h2 className="font-bold text-gray-900 text-sm">Service Coverage Zones</h2>
              <p className="text-xs text-gray-400 mt-0.5">Manage which areas/pincodes your agents can pick up from.</p>
            </div>

            {/* Add Zone form */}
            <form onSubmit={handleAddZone} className="p-4 border-b border-gray-100 bg-gray-50/30 space-y-3">
              {zoneError && (
                <div className="p-2.5 bg-red-50 border border-red-100 text-red-600 rounded-lg text-xs flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {zoneError}
                </div>
              )}
              
              <div>
                <label className="block mb-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Pincode *</label>
                <input
                  type="text"
                  maxLength={6}
                  value={zoneForm.pincode}
                  onChange={(e) => setZoneForm({ ...zoneForm, pincode: e.target.value.replace(/\D/g, '') })}
                  placeholder="e.g. 110001"
                  className="h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs outline-none focus:border-violet-400"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block mb-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">City (Optional)</label>
                  <input
                    type="text"
                    value={zoneForm.city}
                    onChange={(e) => setZoneForm({ ...zoneForm, city: e.target.value })}
                    placeholder="Noida"
                    className="h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs outline-none focus:border-violet-400"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">State (Optional)</label>
                  <input
                    type="text"
                    value={zoneForm.state}
                    onChange={(e) => setZoneForm({ ...zoneForm, state: e.target.value })}
                    placeholder="UP"
                    className="h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs outline-none focus:border-violet-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={addingZone || !zoneForm.pincode}
                className="w-full flex items-center justify-center gap-1.5 h-9 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-bold text-xs transition-colors disabled:opacity-50"
              >
                {addingZone ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <Plus className="w-3.5 h-3.5" />
                )}
                Add Coverage Area
              </button>
            </form>

            {/* Coverage zones list */}
            <div className="flex-1 overflow-y-auto max-h-[300px] p-4 divide-y divide-gray-50">
              {loading ? (
                <div className="text-center py-6">
                  <RefreshCw className="w-5 h-5 text-gray-300 animate-spin mx-auto mb-2" />
                  <p className="text-xs text-gray-400">Loading pincodes...</p>
                </div>
              ) : zones.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <MapPin className="w-8 h-8 mx-auto mb-2 opacity-40 text-gray-500" />
                  <p className="text-xs">No active service zones.</p>
                  <p className="text-[10px] text-gray-500 mt-1">Add pincodes above to start receiving home pickups.</p>
                </div>
              ) : (
                zones.map((zone) => (
                  <div key={zone.id} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0 group">
                    <div>
                      <p className="font-bold text-xs text-gray-900">{zone.pincode}</p>
                      {zone.city && (
                        <p className="text-[10px] text-gray-400 mt-0.5">{zone.city}{zone.state ? `, ${zone.state}` : ''}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveZone(zone.id)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                      title="Remove pincode"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
