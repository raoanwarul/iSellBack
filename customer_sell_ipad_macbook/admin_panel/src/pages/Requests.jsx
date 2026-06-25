import { useEffect, useState } from 'react'
import { useStore } from '../store/useStore'
import { supabase } from '../lib/supabase'
import { 
  Search, MapPin, Phone, MessageCircle, X, Check, IndianRupee,
  ChevronRight, ChevronLeft, ExternalLink, ZoomIn, Truck, Calendar,
  UserCheck, CheckCircle2, Eye, CreditCard, Banknote, Copy, XCircle, Send,
  FileText, Camera, ShieldCheck, Store, Package, AlertCircle
} from 'lucide-react'

const statusOptions = [
  { value: 'all', label: 'All Requests' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Reviewing', label: 'Reviewing' },
  { value: 'Offer_Accepted', label: 'Accepted' },
  { value: 'Seller_Confirmed', label: 'Seller Confirmed' },
  { value: 'Pickup_Scheduled', label: 'Pickup Scheduled' },
  { value: 'Agent_En_Route', label: 'Agent En Route' },
  { value: 'Agent_Arrived', label: 'Agent Arrived' },
  { value: 'Picked_Up', label: 'Picked Up' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Cancelled', label: 'Cancelled' },
]

const statusBadge = {
  Pending: 'bg-yellow-100 text-yellow-700',
  Reviewing: 'bg-blue-100 text-blue-700',
  Counter_Offered: 'bg-purple-100 text-purple-700',
  Customer_Countered: 'bg-indigo-100 text-indigo-700',
  Offer_Accepted: 'bg-green-100 text-violet-700',
  Seller_Confirmed: 'bg-teal-100 text-teal-700',
  Pickup_Scheduled: 'bg-indigo-100 text-indigo-700',
  Agent_Assigned: 'bg-cyan-100 text-cyan-700',
  Agent_En_Route: 'bg-cyan-100 text-cyan-700',
  Agent_Arrived: 'bg-teal-100 text-teal-700',
  Picked_Up: 'bg-sky-100 text-sky-700',
  Completed: 'bg-violet-100 text-violet-700',
  Rejected: 'bg-red-100 text-red-700',
  Cancelled: 'bg-gray-100 text-gray-700',
}

export default function Requests() {
  const { 
    requests, fetchRequests, isLoading, selectedRequest, selectRequest,
    updateRequestStatus, fetchAgents, agents,
    schedulePickupWithAgent, markCompleted, markPaymentDone
  } = useStore()
  
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [photoIdx, setPhotoIdx] = useState(0)
  const [msg, setMsg] = useState(null)
  const [photoGallery, setPhotoGallery] = useState([])
  const [currentPhotoIdx, setCurrentPhotoIdx] = useState(0)

  // Pickup scheduling state
  const [selAgent, setSelAgent] = useState('')
  const [pickupDate, setPickupDate] = useState('')
  const [pickupTime, setPickupTime] = useState('')

  // Cashify reference price for selected request
  const [cashifyRef, setCashifyRef] = useState(null)

  // WhatsApp popup state
  const [showWAPopup, setShowWAPopup] = useState(false)
  const [waPhone, setWaPhone] = useState('')
  const [waMessage, setWaMessage] = useState('')

  useEffect(() => { fetchRequests(statusFilter) }, [statusFilter])
  useEffect(() => { fetchAgents() }, [])

  useEffect(() => {
    if (!selectedRequest) { setCashifyRef(null); return }
    const modelName = selectedRequest.model_name
    if (!modelName) return
    supabase.from('cashify_reference_prices').select('*')
      .ilike('model_name', `%${modelName.split(' ').slice(0, 3).join(' ')}%`)
      .limit(1)
      .single()
      .then(({ data }) => setCashifyRef(data || null))
      .catch(() => setCashifyRef(null))
  }, [selectedRequest?.id])

  const showMsg = (t, txt) => { setMsg({ t, txt }); setTimeout(() => setMsg(null), 3000) }

  const filteredRequests = requests.filter(req => {
    if (!searchQuery) return true
    const s = searchQuery.toLowerCase()
    return req.model_name?.toLowerCase().includes(s) || req.device_type?.toLowerCase().includes(s) ||
      req.users?.phone?.includes(s) || req.users?.name?.toLowerCase().includes(s)
  })

  const openMaps = (loc) => loc?.latitude && loc?.longitude && window.open(`https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`, '_blank')
  
  const openWAPopup = (phone, customerName, deviceModel, status) => {
    if (!phone) return
    const name = customerName || 'Customer'
    const device = deviceModel || 'device'
    let defaultMsg = ''
    if (status === 'Pending' || status === 'Reviewing') {
      defaultMsg = `Hi ${name}, thank you for submitting your ${device} on BuyBack Elite. We are reviewing your request and will share the best offer soon. Stay tuned!`
    } else if (status === 'Counter_Offered' || status === 'Offer_Accepted') {
      defaultMsg = `Hi ${name}, we have an offer for your ${device} on BuyBack Elite. Please check the app for details. Thank you!`
    } else if (status === 'Pickup_Scheduled' || status === 'Agent_Assigned') {
      defaultMsg = `Hi ${name}, your pickup for ${device} has been scheduled. Our agent will arrive shortly. Please keep the device and ID proof ready.`
    } else if (status === 'Completed') {
      defaultMsg = `Hi ${name}, your ${device} deal is completed! Payment will be processed shortly. Thank you for choosing BuyBack Elite!`
    } else {
      defaultMsg = `Hi ${name}, this is an update regarding your ${device} sell request on BuyBack Elite.`
    }
    setWaPhone(phone)
    setWaMessage(defaultMsg)
    setShowWAPopup(true)
  }

  const sendWAMessage = () => {
    if (!waPhone) return
    const digits = waPhone.replace(/\D/g, '')
    const number = digits.length === 10 ? `91${digits}` : digits
    window.open(`https://wa.me/${number}?text=${encodeURIComponent(waMessage)}`, '_blank')
    setShowWAPopup(false)
  }

  const handleSchedulePickup = async () => {
    if (!selectedRequest || !selAgent || !pickupDate || !pickupTime) return
    const agent = agents.find(a => a.id === selAgent)
    const slot = getTimeSlot(pickupTime)
    const ok = await schedulePickupWithAgent(
      selectedRequest.id, selAgent, agent?.name || 'Agent', pickupDate, pickupTime, slot
    )
    if (ok) { showMsg('s', 'Pickup scheduled!'); setSelAgent(''); setPickupDate(''); setPickupTime('') }
  }

  const handleMarkCompleted = async () => {
    if (!selectedRequest) return
    const price = selectedRequest.admin_offer_price || selectedRequest.system_estimated_price
    if (!window.confirm(`Mark deal completed at ₹${price?.toLocaleString() || 0}?`)) return
    const ok = await markCompleted(selectedRequest.id, price)
    if (ok) {
      showMsg('s', '✓ Deal marked as completed successfully!')
      // Refresh to show updated status
      setTimeout(() => fetchRequests(statusFilter), 1000)
    } else {
      showMsg('e', 'Failed to mark as completed')
    }
  }

  // Mark Payment Done handler (matching Android admin app)
  const handleMarkPaymentDone = async () => {
    if (!selectedRequest) return
    if (!window.confirm('Mark payment as completed?')) return
    const ok = await markPaymentDone(selectedRequest.id)
    if (ok) {
      showMsg('s', 'Payment marked as done!')
      // Update selectedRequest with new payment status for realtime UI update
      selectRequest({
        ...selectedRequest,
        bank_details: {
          ...selectedRequest.bank_details,
          payment_done: true,
          payment_done_at: new Date().toISOString()
        }
      })
    } else {
      showMsg('e', 'Failed to mark payment')
    }
  }

  // Copy to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    showMsg('s', 'Copied!')
  }

  const getTimeSlot = (time) => {
    if (!time) return null
    const h = parseInt(time.split(':')[0])
    if (h < 12) return '9 AM - 12 PM'
    if (h < 15) return '12 PM - 3 PM'
    if (h < 18) return '3 PM - 6 PM'
    return '6 PM - 9 PM'
  }

  const r = selectedRequest
  const photos = r?.photos_url || []
  const specs = r?.specs || {}
  const cond = r?.condition_answers || {}
  const isStoreVisit = r?.delivery_method === 'self_drop'
  const canSchedule = ['Pending', 'Reviewing', 'Offer_Accepted'].includes(r?.status) && !isStoreVisit
  const canStoreAction = ['Pending', 'Reviewing', 'Offer_Accepted'].includes(r?.status) && isStoreVisit
  const canComplete = ['Pickup_Scheduled', 'Agent_En_Route', 'Agent_Arrived', 'Picked_Up'].includes(r?.status) || (isStoreVisit && ['Pending', 'Reviewing', 'Offer_Accepted', 'Pickup_Scheduled'].includes(r?.status))

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-gray-900">Sell Requests</h1>
        <span className="text-sm text-gray-500">{filteredRequests.length} requests</span>
      </div>

      {msg && <div className={`p-2 rounded-lg text-sm ${msg.t === 's' ? 'bg-green-50 text-violet-700' : 'bg-red-50 text-red-700'}`}>{msg.txt}</div>}

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-violet-500" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none bg-white focus:ring-2 focus:ring-violet-500">
          {statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* List - left column */}
        <div className={`bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm ${r ? 'hidden lg:block' : 'lg:col-span-3'}`}>
          {isLoading ? (
            <div className="h-40 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-sm text-gray-500">No requests</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredRequests.map(req => (
                <div key={req.id} onClick={() => { setPhotoIdx(0); selectRequest(req) }}
                  className={`px-3 py-2.5 cursor-pointer transition-colors hover:bg-gray-50 ${r?.id === req.id ? 'bg-violet-50 border-l-3 border-l-violet-500' : ''}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-medium text-sm text-gray-900 truncate">{req.model_name || req.device_type}</span>
                        <span className={`shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${statusBadge[req.status] || 'bg-gray-100 text-gray-600'}`}>
                          {req.status?.replace(/_/g, ' ')}
                        </span>
                        {/* Payment status badge */}
                        {req.status === 'Completed' && (
                          req.bank_details?.payment_done ? (
                            <span className="shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-700">₹ Paid</span>
                          ) : (
                            <span className="shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-orange-100 text-orange-700">₹ Pending</span>
                          )
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{req.users?.name || req.users?.phone || '—'}</p>
                      <div className="flex gap-3 mt-1 text-xs text-gray-500">
                        <span>Est: <b className="text-gray-800">₹{(req.system_estimated_price || 0).toLocaleString()}</b></span>
                        {req.admin_offer_price > 0 && <span>Offer: <b className="text-violet-600">₹{req.admin_offer_price.toLocaleString()}</b></span>}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detail Panel - 2 columns on desktop */}
        <div className={`lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm ${r ? 'block' : 'hidden lg:block'} flex flex-col max-h-[calc(100vh-160px)] lg:max-h-[calc(100vh-120px)]`}>
          {r ? (
            <>
              {/* Header */}
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-3 min-w-0">
                  <button onClick={() => selectRequest(null)} className="lg:hidden p-1 hover:bg-gray-200 rounded-lg shrink-0">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 truncate">{r.model_name || r.device_type}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusBadge[r.status] || 'bg-gray-100'}`}>{r.status?.replace(/_/g, ' ')}</span>
                      <span className="text-xs text-gray-500">ID: {r.id?.substring(0, 8)}</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => selectRequest(null)} className="hidden lg:block p-1.5 hover:bg-gray-200 rounded-lg"><X className="w-5 h-5" /></button>
              </div>

              <div className="p-2 sm:p-4 space-y-2 sm:space-y-4 overflow-y-auto flex-1 overscroll-contain detail-scroll-container mobile-safe-bottom">
                {/* MOBILE: Ultra Compact All-in-One View - uses CSS class for guaranteed mobile detection */}
                <div className="mobile-detail-view space-y-2">
                  {/* Device Specs - 2 column vertical layout */}
                  <div className="bg-gray-50 rounded-lg p-2 border border-gray-100">
                    <div className="flex items-center gap-1 mb-1.5"><Eye className="w-3 h-3 text-violet-600" /><span className="text-[10px] font-bold text-gray-500 uppercase">Device & Specs</span></div>
                    <div className="mobile-specs-grid">
                      <div><span className="text-gray-400 text-[10px]">Type</span><span className="font-semibold text-gray-800">{r.device_type || '—'}</span></div>
                      <div><span className="text-gray-400 text-[10px]">Model</span><span className="font-semibold text-gray-800 truncate">{r.model_name?.split(' ').slice(-2).join(' ') || '—'}</span></div>
                      <div><span className="text-gray-400 text-[10px]">Storage</span><span className="font-semibold text-gray-800">{specs.storage || '—'}</span></div>
                      <div><span className="text-gray-400 text-[10px]">RAM</span><span className="font-semibold text-gray-800">{specs.ram || '—'}</span></div>
                      <div><span className="text-gray-400 text-[10px]">Battery</span><span className="font-semibold text-gray-800">{specs.battery_health || '—'}</span></div>
                      <div><span className="text-gray-400 text-[10px]">Cycles</span><span className="font-semibold text-gray-800">{specs.cycle_count || '—'}</span></div>
                    </div>
                  </div>

                  {/* Price - Vertical stack */}
                  <div className="bg-violet-50 rounded-lg p-2 border border-violet-100">
                    <div className="flex items-center gap-1 mb-1"><IndianRupee className="w-3 h-3 text-violet-600" /><span className="text-[10px] font-bold text-violet-700 uppercase">Price</span></div>
                    <div className="mobile-price-row text-[11px]">
                      <div className="flex justify-between"><span className="text-gray-500">Estimated</span><span className="font-bold text-gray-900">₹{(r.system_estimated_price || 0).toLocaleString()}</span></div>
                      {r.admin_offer_price > 0 && <div className="flex justify-between"><span className="text-gray-500">Offer</span><span className="font-bold text-orange-600">₹{r.admin_offer_price.toLocaleString()}</span></div>}
                      {r.final_price > 0 && <div className="flex justify-between"><span className="text-gray-500">Final</span><span className="font-bold text-violet-600">₹{r.final_price.toLocaleString()}</span></div>}
                    </div>
                  </div>

                  {/* Customer - Compact */}
                  <div className="bg-gray-50 rounded-lg p-2 border border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1"><UserCheck className="w-3 h-3 text-violet-600" /><span className="text-[10px] font-bold text-gray-500 uppercase">Customer</span></div>
                      <div className="flex items-center gap-2">
                        {r.users?.phone && <button onClick={() => openWAPopup(r.users.phone, r.users?.name, r.model_name || r.device_type, r.status)} className="p-1 bg-green-100 text-violet-600 rounded" title="WhatsApp Customer"><MessageCircle className="w-3 h-3" /></button>}
                        {r.user_location && <button onClick={() => openMaps(r.user_location)} className="p-1 bg-blue-100 text-blue-600 rounded"><MapPin className="w-3 h-3" /></button>}
                      </div>
                    </div>
                    <div className="text-[11px] mt-1">
                      <span className="font-semibold text-gray-900">{r.users?.name || '—'}</span>
                      {r.users?.phone && <span className="text-gray-500 ml-2">{r.users.phone}</span>}
                      {r.users?.email && <span className="text-gray-400 block truncate">{r.users.email}</span>}
                    </div>
                  </div>

                  {/* Conditions - 2-col compact */}
                  {Object.keys(cond).length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-2 border border-gray-100">
                      <div className="flex items-center gap-1 mb-1"><CheckCircle2 className="w-3 h-3 text-violet-600" /><span className="text-[10px] font-bold text-gray-500 uppercase">Conditions</span></div>
                      {(cond.device_turns_on === false || cond.is_repairable === false) && (
                        <div className="mb-1.5 px-2 py-1 bg-red-50 border border-red-300 rounded text-[10px] font-bold text-red-700 flex items-center gap-1">
                          ⚠ {cond.device_turns_on === false ? 'Device does not turn on' : 'Device was repaired before'} — Not Acceptable
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-x-2 gap-y-0 text-[10px]">
                        {Object.entries(cond)
                          .filter(([k]) => !k.toLowerCase().includes('photo') && !k.toLowerCase().includes('url'))
                          .map(([k, v]) => {
                            const isRepairKey = k === 'is_repairable' || k === 'isRepairable'
                            const label = isRepairKey ? 'Repaired Before' : k.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()
                            const displayVal = isRepairKey ? (v === false ? 'Yes' : 'No') : (typeof v === 'boolean' ? (v ? 'Yes' : 'No') : String(v))
                            const isGood = isRepairKey ? v !== false : (typeof v !== 'boolean' || v)
                            return (
                              <div key={k} className="flex justify-between py-0.5 border-b border-gray-100">
                                <span className="text-gray-500 truncate">{label}</span>
                                <span className={`font-semibold shrink-0 ml-1 ${typeof v === 'boolean' ? (isGood ? 'text-violet-600' : 'text-red-500') : 'text-gray-800'}`}>
                                  {displayVal}
                                </span>
                              </div>
                            )
                          })}
                      </div>
                    </div>
                  )}
                </div>

                {/* TABLET+: Original Layout - hidden on mobile via CSS */}
                <div className="desktop-detail-view space-y-4">
                  {/* Device Info + Pricing side by side */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2 bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <h4 className="text-sm font-bold text-gray-600 uppercase mb-3 flex items-center gap-1.5"><Eye className="w-4 h-4 text-violet-500" /> Device & Specs</h4>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <InfoRow k="Type" v={r.device_type || '—'} />
                        <InfoRow k="Model" v={r.model_name || '—'} />
                        {specs.storage && <InfoRow k="Storage" v={specs.storage} />}
                        {specs.ram && <InfoRow k="RAM" v={specs.ram} />}
                        {specs.battery_health && <InfoRow k="Battery" v={specs.battery_health} />}
                        {specs.cycle_count && <InfoRow k="Cycles" v={specs.cycle_count} />}
                        {specs.processor && <InfoRow k="Processor" v={specs.processor} />}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <h4 className="text-sm font-bold text-gray-600 uppercase mb-3 flex items-center gap-1.5"><IndianRupee className="w-4 h-4 text-violet-500" /> Price</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-gray-500">Estimated</span><span className="font-bold text-gray-900 text-base">₹{(r.system_estimated_price || 0).toLocaleString()}</span></div>
                        {r.admin_offer_price > 0 && <div className="flex justify-between"><span className="text-gray-500">Offer</span><span className="font-bold text-orange-600 text-base">₹{r.admin_offer_price.toLocaleString()}</span></div>}
                        {r.final_price > 0 && <div className="flex justify-between"><span className="text-gray-500">Final</span><span className="font-bold text-violet-600 text-base">₹{r.final_price.toLocaleString()}</span></div>}
                        {cashifyRef && (
                          <div className="mt-2 pt-2 border-t border-dashed border-gray-200">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] text-gray-400 font-medium">Cashify Market</span>
                              <span className="text-[11px] font-bold text-teal-600">₹{(cashifyRef.min_price || 0).toLocaleString()} – ₹{(cashifyRef.max_price || 0).toLocaleString()}</span>
                            </div>
                            {cashifyRef.cashify_url && (
                              <a href={cashifyRef.cashify_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-500 hover:underline">View on Cashify ↗</a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Customer */}
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <h4 className="text-sm font-bold text-gray-600 uppercase mb-3 flex items-center gap-1.5"><UserCheck className="w-4 h-4 text-violet-500" /> Customer</h4>
                    <div className="flex items-center gap-3 text-sm flex-wrap">
                      <span className="font-semibold text-gray-900 text-base">{r.users?.name || '—'}</span>
                      {r.users?.phone && (
                        <span className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-gray-400" /> {r.users.phone}
                          <button onClick={() => openWAPopup(r.users.phone, r.users?.name, r.model_name || r.device_type, r.status)} className="p-1 bg-green-100 text-violet-600 rounded hover:bg-green-200" title="WhatsApp Customer"><MessageCircle className="w-3 h-3" /></button>
                        </span>
                      )}
                      {r.users?.email && <span className="text-gray-500">{r.users.email}</span>}
                      {r.user_location && <button onClick={() => openMaps(r.user_location)} className="flex items-center gap-1 text-violet-600 hover:underline font-medium"><MapPin className="w-3.5 h-3.5" /> Map</button>}
                    </div>
                  </div>

                  {/* Conditions */}
                  {Object.keys(cond).length > 0 && (
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <h4 className="text-sm font-bold text-gray-600 uppercase mb-3 flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-violet-500" /> Conditions</h4>
                      {(cond.device_turns_on === false || cond.is_repairable === false) && (
                        <div className="mb-3 flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-300 rounded-lg text-sm font-bold text-red-700">
                          ⚠ {cond.device_turns_on === false ? 'Device does not turn on' : 'Device was repaired before'} — Not Acceptable
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                        {Object.entries(cond)
                          .filter(([k]) => !k.toLowerCase().includes('photo') && !k.toLowerCase().includes('url'))
                          .map(([k, v]) => {
                            const isRepairKey = k === 'is_repairable' || k === 'isRepairable'
                            const label = isRepairKey ? 'Repaired Before' : k.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()
                            const displayVal = isRepairKey ? (v === false ? 'Yes' : 'No') : (typeof v === 'boolean' ? (v ? 'Yes' : 'No') : String(v))
                            const isGood = isRepairKey ? v !== false : (typeof v !== 'boolean' || v)
                            return (
                              <div key={k} className="flex justify-between py-1.5 border-b border-gray-100">
                                <span className="text-gray-500 capitalize">{label}</span>
                                <span className={`font-semibold ${typeof v === 'boolean' ? (isGood ? 'text-violet-600' : 'text-red-500') : 'text-gray-900'}`}>
                                  {displayVal}
                                </span>
                              </div>
                            )
                          })}
                      </div>
                      {/* Condition Photos */}
                      {(cond.screen_condition_photo_url || cond.body_condition_photo_url) && (
                        <div className="flex gap-2 mt-2">
                          {cond.screen_condition_photo_url && (
                            <div className="flex-1">
                              <p className="text-[10px] text-gray-400 uppercase mb-1">Screen Photo</p>
                              <img src={cond.screen_condition_photo_url} alt="Screen" className="w-full h-20 object-cover rounded-lg border cursor-pointer hover:opacity-80" onClick={() => setSelectedPhoto(cond.screen_condition_photo_url)} />
                            </div>
                          )}
                          {cond.body_condition_photo_url && (
                            <div className="flex-1">
                              <p className="text-[10px] text-gray-400 uppercase mb-1">Body Photo</p>
                              <img src={cond.body_condition_photo_url} alt="Body" className="w-full h-20 object-cover rounded-lg border cursor-pointer hover:opacity-80" onClick={() => setSelectedPhoto(cond.body_condition_photo_url)} />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Price Breakdown - Show on all screens */}
                {r.price_breakdown && (
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <h4 className="text-sm font-bold text-gray-600 uppercase mb-3 flex items-center gap-1.5"><IndianRupee className="w-4 h-4 text-violet-500" /> Deductions & Bonuses</h4>
                    {r.price_breakdown.base_price && (
                      <div className="flex justify-between text-sm py-1 border-b border-gray-200 mb-1">
                        <span className="font-medium text-gray-700">Base Price</span>
                        <span className="font-bold text-gray-900">₹{r.price_breakdown.base_price.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm">
                      {(r.price_breakdown.deductions ? Object.entries(r.price_breakdown.deductions) : Object.entries(r.price_breakdown).filter(([k]) => !['base_price', 'final_price'].includes(k))).map(([k, v]) => {
                        const valStr = String(v)
                        const isBonus = valStr.includes('+')
                        const isDeduction = valStr.includes('-')
                        return (
                          <div key={k} className="flex justify-between py-0.5">
                            <span className="text-gray-600 truncate mr-2">{k}</span>
                            <span className={`font-semibold ${isBonus ? 'text-violet-600' : isDeduction ? 'text-red-500' : 'text-gray-700'}`}>{valStr}</span>
                          </div>
                        )
                      })}
                    </div>
                    {r.price_breakdown.final_price && (
                      <div className="flex justify-between text-sm py-1 border-t border-gray-300 mt-1">
                        <span className="font-bold text-gray-700">Final</span>
                        <span className="font-bold text-violet-600">₹{r.price_breakdown.final_price.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Customer ID Proof */}
                {(r.id_proof_type || r.id_proof_url) && (
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <h4 className="text-sm font-bold text-gray-600 uppercase mb-3 flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-violet-500" /> ID Proof</h4>
                    <div className="flex items-center gap-4">
                      {r.id_proof_type && (
                        <div className="bg-white px-3 py-2 rounded-lg border">
                          <p className="text-xs text-gray-400">ID Type</p>
                          <p className="font-semibold text-gray-900 text-sm">{r.id_proof_type}</p>
                        </div>
                      )}
                      {r.id_proof_url && (
                        <div className="flex-1">
                          <p className="text-xs text-gray-400 mb-1">ID Document</p>
                          <img src={r.id_proof_url} alt="ID Proof" className="h-24 object-contain rounded-lg border cursor-pointer hover:opacity-80" onClick={() => setSelectedPhoto(r.id_proof_url)} />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Agent Verification Photos */}
                {cond.agent_verification_photos && cond.agent_verification_photos.length > 0 && (
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <h4 className="text-sm font-bold text-gray-600 uppercase mb-3 flex items-center gap-1.5"><Camera className="w-4 h-4 text-violet-500" /> Agent Verification Photos ({cond.agent_verification_photos.length})</h4>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {cond.agent_verification_photos.map((u, i) => (
                        <img key={i} src={u} alt="" onClick={() => { setPhotoGallery(cond.agent_verification_photos); setCurrentPhotoIdx(i); setSelectedPhoto(u); }}
                          className="w-full h-24 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity" />
                      ))}
                    </div>
                    {cond.customer_signature_url && (
                      <div className="mt-3">
                        <p className="text-xs text-gray-400 mb-1">Customer Signature</p>
                        <img src={cond.customer_signature_url} alt="Signature" className="h-16 object-contain rounded-lg border cursor-pointer" onClick={() => setSelectedPhoto(cond.customer_signature_url)} />
                      </div>
                    )}
                  </div>
                )}

                {/* Photos Row - Gallery with Navigation */}
                {photos.length > 0 && (
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <h4 className="text-sm font-bold text-gray-600 uppercase mb-3 flex items-center gap-1.5"><ZoomIn className="w-4 h-4 text-violet-500" /> Device Photos ({photos.length})</h4>
                    {/* Main Photo Display - Click to zoom */}
                    <div className="relative bg-white rounded-lg border border-gray-200 mb-3 cursor-pointer" 
                      onClick={() => { setPhotoGallery(photos); setSelectedPhoto(photos[currentPhotoIdx]); }}>
                      <img src={photos[currentPhotoIdx]} alt="" className="w-full h-48 sm:h-64 object-contain rounded-lg" />
                      {photos.length > 1 && (
                        <>
                          <button onClick={(e) => { e.stopPropagation(); setCurrentPhotoIdx(p => p > 0 ? p - 1 : photos.length - 1); }}
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-3 rounded-full hover:bg-black/70">
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); setCurrentPhotoIdx(p => p < photos.length - 1 ? p + 1 : 0); }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-3 rounded-full hover:bg-black/70">
                            <ChevronRight className="w-5 h-5" />
                          </button>
                          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                            {currentPhotoIdx + 1} / {photos.length}
                          </div>
                        </>
                      )}
                      {/* Zoom hint */}
                      <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                        <ZoomIn className="w-3 h-3" /> Click to zoom
                      </div>
                    </div>
                    {/* Thumbnail Strip */}
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {photos.map((u, i) => (
                        <img key={i} src={u} alt="" onClick={() => setCurrentPhotoIdx(i)}
                          className={`shrink-0 w-16 h-16 object-cover rounded border-2 cursor-pointer transition-all ${
                            i === currentPhotoIdx ? 'border-violet-500 ring-2 ring-violet-200' : 'border-gray-200 hover:border-violet-300'
                          }`} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Payment Details Section (matching Android admin app) */}
                {(r.upi_id || r.bank_details?.upi_id || r.bank_details?.account_number || r.bank_details?.payment_barcode_url || r.status === 'Completed') && (
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <h4 className="text-sm font-bold text-gray-600 uppercase mb-3 flex items-center gap-1.5"><CreditCard className="w-4 h-4 text-violet-500" /> Payment Details</h4>
                    <div className="space-y-3 text-sm">
                      {/* UPI ID */}
                      {(r.upi_id || r.bank_details?.upi_id) && (
                        <div className="flex items-center justify-between bg-white p-2 rounded-lg border">
                          <div className="flex items-center gap-2">
                            <Banknote className="w-4 h-4 text-violet-600" />
                            <div>
                              <p className="text-[10px] text-gray-400">UPI ID</p>
                              <p className="font-medium text-gray-900">{r.upi_id || r.bank_details?.upi_id}</p>
                            </div>
                          </div>
                          <button onClick={() => copyToClipboard(r.upi_id || r.bank_details?.upi_id)} className="p-1.5 hover:bg-gray-100 rounded"><Copy className="w-3.5 h-3.5 text-gray-400" /></button>
                        </div>
                      )}
                      {/* Bank Details */}
                      {r.bank_details?.account_number && (
                        <div className="bg-white p-2 rounded-lg border space-y-1.5">
                          <div className="flex justify-between text-xs"><span className="text-gray-500">Account Holder</span><span className="font-medium">{r.bank_details.account_holder_name || '—'}</span></div>
                          <div className="flex justify-between text-xs"><span className="text-gray-500">Bank</span><span className="font-medium">{r.bank_details.bank_name || '—'}</span></div>
                          <div className="flex justify-between text-xs"><span className="text-gray-500">Account No.</span><span className="font-medium">{r.bank_details.account_number}</span></div>
                          <div className="flex justify-between text-xs"><span className="text-gray-500">IFSC</span><span className="font-medium">{r.bank_details.ifsc_code || '—'}</span></div>
                        </div>
                      )}
                      {/* QR Code Photo */}
                      {(r.bank_details?.barcode_photo_url || r.bank_details?.payment_barcode_url) && (
                        <div className="bg-white p-2 rounded-lg border">
                          <p className="text-xs text-gray-400 mb-1">UPI QR / Barcode</p>
                          <img src={r.bank_details.barcode_photo_url || r.bank_details.payment_barcode_url} alt="QR" className="w-full max-h-40 object-contain rounded cursor-pointer" onClick={() => setSelectedPhoto(r.bank_details.barcode_photo_url || r.bank_details.payment_barcode_url)} />
                        </div>
                      )}
                      {/* Payment Status */}
                      {r.bank_details?.payment_done ? (
                        <div className="bg-green-50 p-2 rounded-lg border border-green-200 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-violet-600" />
                          <div>
                            <p className="text-violet-700 font-semibold text-xs">Payment Completed</p>
                            {r.bank_details.payment_done_at && <p className="text-violet-600 text-[10px]">{new Date(r.bank_details.payment_done_at).toLocaleString('en-IN')}</p>}
                          </div>
                        </div>
                      ) : r.status === 'Completed' && (
                        <button onClick={handleMarkPaymentDone} className="w-full py-2 bg-violet-600 text-white text-xs font-semibold rounded-lg hover:bg-violet-700 flex items-center justify-center gap-1.5">
                          <Check className="w-3.5 h-3.5" /> Mark Payment Done
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Admin / Agent Notes */}
                {r.admin_notes && (
                  <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                    <h4 className="text-sm font-bold text-amber-700 uppercase mb-2 flex items-center gap-1.5"><FileText className="w-4 h-4" /> Agent Notes</h4>
                    <p className="text-sm text-gray-800">{r.admin_notes}</p>
                  </div>
                )}

                {/* Delivery Method Badge */}
                {r && (
                  <div className={`rounded-xl p-3 border flex items-center gap-3 ${isStoreVisit ? 'bg-indigo-50 border-indigo-200' : 'bg-purple-50 border-purple-200'}`}>
                    {isStoreVisit ? <Store className="w-5 h-5 text-indigo-600" /> : <Truck className="w-5 h-5 text-purple-600" />}
                    <div className="flex-1">
                      <span className={`font-bold text-sm ${isStoreVisit ? 'text-indigo-700' : 'text-purple-700'}`}>
                        {isStoreVisit ? 'Visit Store' : 'Home Pickup'}
                      </span>
                      <p className="text-xs text-gray-500">{isStoreVisit ? 'Customer will drop device at store' : 'Agent will pick up from customer'}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full text-white ${isStoreVisit ? 'bg-indigo-600' : 'bg-purple-600'}`}>
                      {isStoreVisit ? 'STORE' : 'PICKUP'}
                    </span>
                  </div>
                )}

                {/* Store Visit Section */}
                {canStoreAction && (
                  <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-200">
                    <h4 className="text-sm font-bold text-indigo-600 uppercase mb-3 flex items-center gap-1.5"><Store className="w-4 h-4" /> Store Visit</h4>
                    <div className="bg-white rounded-lg p-3 border border-indigo-100 mb-3">
                      <p className="font-semibold text-sm text-gray-900">Macintosh Enterprise</p>
                      <p className="text-xs text-gray-600 mt-1">Shop No. 157, 1st Floor, The Great India Place, Sector 38A, Noida – 201301, UP, India</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-2.5 border border-blue-100 mb-3 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-blue-700">No agent assignment needed. Customer will visit the store.</p>
                    </div>
                    <div className="space-y-2">
                      <button onClick={() => {
                        const phone = r?.users?.phone || r?.customer_phone
                        if (!phone) { showMsg('e', 'No phone number'); return }
                        const digits = phone.replace(/\D/g, '')
                        const number = digits.length === 10 ? `91${digits}` : digits
                        const msg = `Hi ${r?.users?.name || 'Customer'}, your sell request for ${r?.model_name || r?.device_type} has been reviewed.\n\nPlease visit our store:\nMacintosh Enterprise\nShop No. 157, 1st Floor, The Great India Place, Sector 38A, Noida – 201301\n\nBring your device and a valid ID. Thank you! - BuyBack Elite`
                        window.open(`https://wa.me/${number}?text=${encodeURIComponent(msg)}`, '_blank')
                      }} className="w-full py-2 text-sm font-semibold text-violet-700 border border-green-300 rounded-lg hover:bg-green-50 flex items-center justify-center gap-1.5">
                        <MessageCircle className="w-4 h-4" /> WhatsApp - Store Visit Directions
                      </button>
                      <button onClick={async () => {
                        try {
                          await supabase.from('sell_requests').update({ status: 'Pickup_Scheduled', admin_notes: 'Device received at store' }).eq('id', r.id)
                          showMsg('s', 'Marked as received at store')
                          fetchRequests(statusFilter)
                        } catch (e) { showMsg('e', 'Error: ' + e.message) }
                      }} className="w-full py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-1.5">
                        <Package className="w-4 h-4" /> Mark Device Received at Store
                      </button>
                    </div>
                  </div>
                )}

                {/* Assign Agent & Schedule Pickup (like Android admin app - direct assignment) */}
                {canSchedule && (
                  <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                    <h4 className="text-sm font-bold text-purple-600 uppercase mb-3 flex items-center gap-1.5"><Truck className="w-4 h-4" /> Assign Agent & Schedule Pickup</h4>
                    <div className="space-y-2">
                      <select value={selAgent} onChange={e => setSelAgent(e.target.value)}
                        className="w-full px-2.5 py-2 text-sm border border-purple-200 rounded-lg outline-none bg-white focus:ring-1 focus:ring-purple-400">
                        <option value="">Select Agent</option>
                        {agents.map(a => <option key={a.id} value={a.id}>{a.name} ({a.phone})</option>)}
                      </select>
                      <div className="grid grid-cols-2 gap-2">
                        <input type="date" value={pickupDate} onChange={e => setPickupDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          className="px-2.5 py-2 text-sm border border-purple-200 rounded-lg outline-none bg-white focus:ring-1 focus:ring-purple-400" />
                        <input type="time" value={pickupTime} onChange={e => setPickupTime(e.target.value)}
                          className="px-2.5 py-2 text-sm border border-purple-200 rounded-lg outline-none bg-white focus:ring-1 focus:ring-purple-400" />
                      </div>
                      <button onClick={handleSchedulePickup}
                        disabled={!selAgent || !pickupDate || !pickupTime}
                        className="w-full py-2.5 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 disabled:opacity-40 flex items-center justify-center gap-1.5">
                        <Calendar className="w-4 h-4" /> Assign Agent & Schedule
                      </button>
                    </div>
                  </div>
                )}

                {/* Assigned agent info */}
                {r.assigned_agent_name && (
                  <div className="bg-purple-50 rounded-lg p-3 border border-purple-200 flex items-center justify-between">
                    <div>
                      <span className="text-purple-700 font-semibold text-sm">Agent: {r.assigned_agent_name}</span>
                      {r.pickup_scheduled_time && <p className="text-purple-600 text-xs mt-0.5">{new Date(r.pickup_scheduled_time).toLocaleString('en-IN')}</p>}
                    </div>
                    {r.pickup_slot && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">{r.pickup_slot}</span>}
                  </div>
                )}
              </div>

              {/* Bottom Action Bar - only Mark Completed (like Android admin app) */}
              <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50">
                {canComplete && (
                  <button onClick={handleMarkCompleted}
                    className="w-full py-2.5 text-sm font-semibold bg-violet-600 text-white rounded-lg hover:bg-violet-700 flex items-center justify-center gap-1.5">
                    <Check className="w-4 h-4" /> Mark Deal Completed
                  </button>
                )}
                {r.status === 'Completed' && (
                  <div className="text-center text-sm text-violet-600 font-medium py-1">
                    <CheckCircle2 className="w-4 h-4 inline mr-1" /> Deal Completed
                    {r.final_price > 0 && ` at ₹${r.final_price.toLocaleString()}`}
                  </div>
                )}
                {!canComplete && r.status !== 'Completed' && !canSchedule && (
                  <div className="text-center text-xs text-gray-400 py-1">Status: {r.status?.replace(/_/g, ' ')}</div>
                )}
              </div>
            </>
          ) : (
            <div className="h-96 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-base">Select a request to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* WhatsApp Message Popup */}
      {showWAPopup && (
        <div className="fixed inset-0 bg-black/50 z-[90] flex items-center justify-center p-4" onClick={() => setShowWAPopup(false)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Send WhatsApp Message</h3>
                  <p className="text-xs text-gray-500">To: {waPhone}</p>
                </div>
              </div>
              <button onClick={() => setShowWAPopup(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <textarea
              value={waMessage}
              onChange={e => setWaMessage(e.target.value)}
              rows={5}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500 resize-none"
              placeholder="Type your message..."
            />
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowWAPopup(false)} className="flex-1 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">
                Cancel
              </button>
              <button onClick={sendWAMessage} className="flex-1 py-2.5 text-sm font-semibold text-white bg-violet-600 rounded-lg hover:bg-violet-700 flex items-center justify-center gap-1.5">
                <Send className="w-4 h-4" /> Send via WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Zoom Modal with Navigation - Full screen, no scroll needed */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black/95 z-[100] flex flex-col items-center justify-center overflow-hidden" onClick={() => setSelectedPhoto(null)}>
          {/* Top bar with close and counter */}
          <div className="absolute top-0 left-0 right-0 h-14 flex items-center justify-between px-4 z-20">
            {/* Photo counter */}
            {photoGallery.length > 1 && (
              <div className="bg-black/60 text-white text-sm px-4 py-2 rounded-full">
                {currentPhotoIdx + 1} / {photoGallery.length}
              </div>
            )}
            {photoGallery.length <= 1 && <div />}
            {/* Close button */}
            <button className="text-white hover:text-gray-300 p-2 bg-black/40 rounded-full" onClick={() => setSelectedPhoto(null)}>
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {/* Main content area - image with side navigation */}
          <div className="flex-1 w-full flex items-center justify-center relative px-16 py-16">
            {/* Left navigation */}
            {photoGallery.length > 1 && (
              <button 
                onClick={(e) => { e.stopPropagation(); const newIdx = currentPhotoIdx > 0 ? currentPhotoIdx - 1 : photoGallery.length - 1; setCurrentPhotoIdx(newIdx); setSelectedPhoto(photoGallery[newIdx]); }}
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-2 sm:p-3 rounded-full z-10 transition-colors"
              >
                <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
              </button>
            )}
            
            {/* Main image - constrained to viewport */}
            <img 
              src={selectedPhoto} 
              alt="" 
              className="max-w-full max-h-full object-contain select-none" 
              style={{ maxHeight: 'calc(100vh - 140px)', maxWidth: 'calc(100vw - 100px)' }}
              onClick={e => e.stopPropagation()} 
              draggable={false}
            />
            
            {/* Right navigation */}
            {photoGallery.length > 1 && (
              <button 
                onClick={(e) => { e.stopPropagation(); const newIdx = currentPhotoIdx < photoGallery.length - 1 ? currentPhotoIdx + 1 : 0; setCurrentPhotoIdx(newIdx); setSelectedPhoto(photoGallery[newIdx]); }}
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-2 sm:p-3 rounded-full z-10 transition-colors"
              >
                <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
              </button>
            )}
          </div>
          
          {/* Thumbnail strip at bottom */}
          {photoGallery.length > 1 && (
            <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/60 p-2 rounded-xl max-w-[90vw] overflow-x-auto z-20">
              {photoGallery.map((url, i) => (
                <img 
                  key={i} 
                  src={url} 
                  alt="" 
                  onClick={(e) => { e.stopPropagation(); setCurrentPhotoIdx(i); setSelectedPhoto(url); }}
                  className={`w-12 h-12 sm:w-14 sm:h-14 object-cover rounded cursor-pointer transition-all shrink-0 ${
                    selectedPhoto === url ? 'ring-2 ring-white opacity-100' : 'opacity-60 hover:opacity-100'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function InfoRow({ k, v }) {
  return (
    <div className="flex justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-gray-500 text-sm">{k}</span>
      <span className="font-semibold text-gray-900 text-sm">{v}</span>
    </div>
  )
}
