import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { supabase } from '../lib/supabase'
import {
  ArrowLeft, Laptop, Tablet, CheckCircle2,
  AlertCircle, Package, ChevronDown, ChevronUp,
  CreditCard, Banknote, Save,
  ZoomIn, ChevronLeft, ChevronRight, X, Shield, Printer
} from 'lucide-react'

const STATUS_CONFIG = {
  'Pending': { bg: 'rgba(245,158,11,0.12)', text: '#F59E0B', label: 'Pending Review', desc: 'Your request is being reviewed by our team.' },
  'Reviewing': { bg: 'rgba(59,130,246,0.12)', text: '#3B82F6', label: 'Under Review', desc: 'Our team is evaluating your device details.' },
  'Offer_Accepted': { bg: 'rgba(16,185,129,0.12)', text: '#10B981', label: 'Offer Accepted', desc: 'Great! The offer has been accepted. Pickup will be scheduled soon.' },
  'Seller_Confirmed': { bg: 'rgba(16,185,129,0.12)', text: '#10B981', label: 'Seller Confirmed', desc: 'You have confirmed the sale. Pickup will be scheduled soon.' },
  'Agent_Assigned': { bg: 'rgba(6,182,212,0.12)', text: '#06B6D4', label: 'Pickup Scheduled', desc: 'Your device pickup has been scheduled.' },
  'Agent_En_Route': { bg: 'rgba(59,130,246,0.12)', text: '#3B82F6', label: 'Pickup In Progress', desc: 'Pickup is in progress.' },
  'Agent_Arrived': { bg: 'rgba(139,92,246,0.12)', text: '#8B5CF6', label: 'Pickup In Progress', desc: 'Pickup is in progress.' },
  'Pickup_Scheduled': { bg: 'rgba(16,185,129,0.12)', text: '#10B981', label: 'Pickup Scheduled', desc: 'Your device pickup has been scheduled.' },
  'Picked_Up': { bg: 'rgba(14,165,233,0.12)', text: '#0EA5E9', label: 'Picked Up', desc: 'Your device has been picked up. Verification in progress.' },
  'Completed': { bg: 'rgba(16,185,129,0.12)', text: '#10B981', label: 'Completed', desc: 'Deal completed successfully! Thank you.' },
  'Cancelled': { bg: 'rgba(148,163,184,0.12)', text: 'var(--color-text-secondary)', label: 'Cancelled', desc: 'This request has been cancelled.' },
}

const STEPPER_STAGES = [
  { label: 'Submitted', desc: 'Request submitted successfully' },
  { label: 'Scheduled', desc: 'Pickup scheduled & agent assigned' },
  { label: 'Inspected', desc: 'Device inspected at your doorstep' },
  { label: 'Completed', desc: 'Deal completed & payment processed' },
]

const getStepIndex = (status) => {
  if (['Pending', 'Reviewing', 'Offer_Accepted', 'Seller_Confirmed'].includes(status)) return 0
  if (['Pickup_Scheduled', 'Agent_Assigned'].includes(status)) return 1
  if (['Agent_En_Route', 'Agent_Arrived', 'Picked_Up', 'Counter_Offered'].includes(status)) return 2
  if (status === 'Completed') return 3
  return 0 // default
}

export default function RequestDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { sellRequests, fetchUserRequests, isLoading } = useStore()
  const [expandConditions, setExpandConditions] = useState(false)
  const [upiId, setUpiId] = useState('')
  const [bankDetails, setBankDetails] = useState({ account_holder: '', bank_name: '', account_number: '', ifsc: '' })
  const [paymentSaving, setPaymentSaving] = useState(false)
  const [paymentSaved, setPaymentSaved] = useState(false)

  const [zoomPhoto, setZoomPhoto] = useState(null)
  const [zoomIndex, setZoomIndex] = useState(0)
  const [photoGallery, setPhotoGallery] = useState([])

  const [existingRating, setExistingRating] = useState(null)
  const [ratingInput, setRatingInput] = useState(5)
  const [reviewInput, setReviewInput] = useState('')
  const [ratingSaving, setRatingSaving] = useState(false)

  const [wipeCertificate, setWipeCertificate] = useState(null)
  const [showCertModal, setShowCertModal] = useState(false)

  useEffect(() => {
    fetchUserRequests()
  }, [id])

  // Realtime subscription for this specific request
  useEffect(() => {
    if (!id) return

    const channel = supabase
      .channel(`request-detail-${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sell_requests',
          filter: `id=eq.${id}`,
        },
        (payload) => {
          console.log('[REALTIME] Request updated:', payload)
          fetchUserRequests()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [id, fetchUserRequests])

  const request = sellRequests.find(r => r.id === id)

  useEffect(() => {
    if (request && request.status === 'Completed') {
      async function fetchWipeCertificate() {
        try {
          const { data } = await supabase
            .from('data_wipe_certificates')
            .select('*')
            .eq('sell_request_id', request.id)
            .maybeSingle()
          if (data) {
            setWipeCertificate(data)
          }
        } catch (err) {
          console.error('Error fetching wipe cert:', err)
        }
      }
      fetchWipeCertificate()
    }
  }, [request?.id, request?.status])

  useEffect(() => {
    if (request && request.status === 'Completed' && request.assigned_agent_id) {
      async function fetchRating() {
        const { data, error } = await supabase
          .from('agent_ratings')
          .select('*')
          .eq('sell_request_id', request.id)
          .maybeSingle()
        if (data) {
          setExistingRating(data)
        }
      }
      fetchRating()
    }
  }, [request?.id, request?.status])

  const handleSubmitRating = async (e) => {
    e.preventDefault()
    if (!request.assigned_agent_id) return
    setRatingSaving(true)
    try {
      const { data, error } = await supabase
        .from('agent_ratings')
        .insert({
          sell_request_id: request.id,
          agent_id: request.assigned_agent_id,
          user_id: request.user_id,
          rating: ratingInput,
          review: reviewInput,
        })
        .select()
        .single()
      if (!error && data) {
        setExistingRating(data)
      } else {
        console.error(error)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setRatingSaving(false)
    }
  }

  if (isLoading && !request) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-sm text-gray-500" style={{ color: 'var(--color-text-secondary)' }}>Loading request details...</p>
      </div>
    )
  }

  if (!request) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20 card p-8">
        <Package className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--color-text-muted)' }} />
        <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--color-text)' }}>Request Not Found</h3>
        <button onClick={() => navigate('/dashboard/requests')} className="font-bold text-xs" style={{ color: 'var(--color-primary)' }}>
          Back to Requests
        </button>
      </div>
    )
  }

  const statusConfig = STATUS_CONFIG[request.status] || { bg: 'var(--color-surface-2)', text: 'var(--color-text-secondary)', label: request.status, desc: '' }
  const specs = request.specs || {}
  const conditions = request.condition_answers || {}
  const isMac = request.device_type === 'MacBook'
  const formatPrice = (p) => (p || 0).toLocaleString('en-IN')
  const displayPrice = request.final_price || request.admin_offer_price || request.system_estimated_price || 0
  const [statusUpdating, setStatusUpdating] = useState(false)

  const handleUpdateStatus = async (newStatus) => {
    setStatusUpdating(true)
    try {
      const { error } = await supabase
        .from('sell_requests')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', request.id)
      
      if (!error) {
        // Log auditing sell_event for customer actions
        try {
          const { data: { user: authUser } } = await supabase.auth.getUser()
          await supabase.from('sell_events').insert({
            sell_request_id: request.id,
            business_id: request.business_id || null,
            actor_user_id: authUser?.id || null,
            actor_email: authUser?.email || null,
            event_type: newStatus === 'Seller_Confirmed' ? 'customer_accepted_counter' : 'customer_declined_counter',
            message: newStatus === 'Seller_Confirmed' 
              ? `Customer accepted the counter offer of ₹${displayPrice.toLocaleString('en-IN')}` 
              : `Customer declined the counter offer and requested the device to be returned.`,
            meta: {
              new_status: newStatus,
              previous_status: request.status,
              counter_price: displayPrice,
            },
          })
        } catch (eventErr) {
          console.warn('sell_event logging failed (non-blocking):', eventErr.message)
        }
        
        await fetchUserRequests()
      }
    } catch (e) {
      console.error('Failed to update status:', e)
    }
    setStatusUpdating(false)
  }

  const handleSavePaymentDetails = async () => {
    if (!upiId && !bankDetails.account_number) return
    setPaymentSaving(true)
    try {
      const updateData = {
        upi_id: upiId || null,
        bank_details: {
          ...(request.bank_details || {}),
          upi_id: upiId || null,
          account_holder_name: bankDetails.account_holder || null,
          bank_name: bankDetails.bank_name || null,
          account_number: bankDetails.account_number || null,
          ifsc_code: bankDetails.ifsc || null,
        }
      }
      const { error } = await supabase
        .from('sell_requests')
        .update(updateData)
        .eq('id', request.id)
      if (!error) {
        setPaymentSaved(true)
        fetchUserRequests()
        setTimeout(() => setPaymentSaved(false), 3000)
      }
    } catch (e) {
      console.error('Failed to save payment details:', e)
    }
    setPaymentSaving(false)
  }

  useEffect(() => {
    if (request) {
      setUpiId(request.upi_id || request.bank_details?.upi_id || '')
      setBankDetails({
        account_holder: request.bank_details?.account_holder_name || '',
        bank_name: request.bank_details?.bank_name || '',
        account_number: request.bank_details?.account_number || '',
        ifsc: request.bank_details?.ifsc_code || '',
      })
    }
  }, [request?.id])

  return (
    <div className="max-w-4xl mx-auto px-2 sm:px-4">
      {/* Header Back Button */}
      <button
        onClick={() => navigate('/dashboard/requests')}
        className="flex items-center gap-2 mb-4 font-bold text-xs transition-colors"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Requests
      </button>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 shrink-0 rounded-xl flex items-center justify-center"
            style={{
              background: isMac ? 'rgba(99,102,241,0.08)' : 'rgba(16,185,129,0.08)',
              color: isMac ? '#6366F1' : '#10B981'
            }}>
            {isMac ? <Laptop className="w-7 h-7" /> : <Tablet className="w-7 h-7" />}
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-black truncate" style={{ color: 'var(--color-text)' }}>{request.model_name || request.device_type}</h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>ID: {request.id?.substring(0, 12)}...</p>
          </div>
        </div>
        <span className="px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap"
          style={{ background: statusConfig.bg, color: statusConfig.text }}>
          {statusConfig.label}
        </span>
      </div>

      {/* Counter Offer Decision Banner */}
      {request.status === 'Counter_Offered' && (
        <div className="bg-indigo-50 border border-indigo-200 dark:bg-indigo-950/20 dark:border-indigo-900/50 rounded-2xl p-5 sm:p-6 mb-6 space-y-4 shadow-sm animate-fadeIn">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 text-lg">
              💰
            </div>
            <div className="space-y-1">
              <h3 className="font-extrabold text-sm sm:text-base text-indigo-950 dark:text-indigo-300">New Price Offer Available</h3>
              <p className="text-xs sm:text-sm text-indigo-900/70 dark:text-indigo-200/70">
                We have updated our offer to <strong>₹{formatPrice(displayPrice)}</strong> after inspection/verification.
                You can either accept this revised price to proceed with the sale, or decline and request the device to be returned back to you at no cost.
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => handleUpdateStatus('Seller_Confirmed')}
              disabled={statusUpdating}
              className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              Accept Revised Offer (₹{formatPrice(displayPrice)})
            </button>
            <button
              onClick={() => handleUpdateStatus('Cancelled')}
              disabled={statusUpdating}
              className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 font-bold text-xs sm:text-sm rounded-xl transition-all border border-gray-200 dark:border-white/5 flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              Decline & Return Device (Free)
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Description Card */}
          <div className="rounded-2xl p-5 border" style={{ background: statusConfig.bg, borderColor: 'transparent' }}>
            <p className="font-extrabold text-sm sm:text-base" style={{ color: statusConfig.text }}>{statusConfig.label}</p>
            <p className="text-xs sm:text-sm mt-1.5 opacity-90" style={{ color: statusConfig.text }}>{statusConfig.desc}</p>
          </div>

          {/* Device Info */}
          <div className="card p-5">
            <h3 className="font-black text-sm uppercase tracking-wider mb-4" style={{ color: 'var(--color-text)' }}>Device Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <InfoRow label="Type" value={request.device_type} />
              <InfoRow label="Model" value={request.model_name} />
              <InfoRow label="Storage" value={specs.storage} />
              <InfoRow label="RAM" value={specs.ram} />
              <InfoRow label="Battery Health" value={specs.battery_health || specs.batteryHealth} />
              {isMac && <InfoRow label="Cycle Count" value={specs.cycle_count || specs.cycleCount} />}
            </div>
          </div>

          {/* Condition Details */}
          <div className="card p-5">
            <button
              onClick={() => setExpandConditions(!expandConditions)}
              className="w-full flex items-center justify-between"
            >
              <h3 className="font-black text-sm uppercase tracking-wider" style={{ color: 'var(--color-text)' }}>Condition Details</h3>
              {expandConditions ? <ChevronUp className="w-5 h-5" style={{ color: 'var(--color-text-muted)' }} /> : <ChevronDown className="w-5 h-5" style={{ color: 'var(--color-text-muted)' }} />}
            </button>
            {expandConditions && (
              <div className="mt-4 space-y-1">
                <ConditionRow label="Device Turns On" value={conditions.device_turns_on !== false ? 'Yes' : 'No'} isGood={conditions.device_turns_on !== false} />
                <ConditionRow label="Repaired Before" value={conditions.is_repairable !== false ? 'No' : 'Yes'} isGood={conditions.is_repairable !== false} />
                {conditions.screen_condition && <ConditionRow label="Screen" value={conditions.screen_condition} />}
                {conditions.screen_discolouration && <ConditionRow label="Screen Discolouration" value={conditions.screen_discolouration} />}
                {conditions.screen_spots && <ConditionRow label="Spots on Screen" value={conditions.screen_spots} />}
                {conditions.screen_lines && <ConditionRow label="Lines on Screen" value={conditions.screen_lines} />}
                {conditions.body_condition && <ConditionRow label="Body" value={conditions.body_condition} />}
                <ConditionRow label="Charger" value={conditions.charger_available !== false ? 'Available' : 'Not Available'} isGood={conditions.charger_available !== false} />
                <ConditionRow label="Box" value={conditions.box_available ? 'Available' : 'Not Available'} isGood={conditions.box_available} />
                {isMac && (
                  <>
                    {conditions.keyboard_condition && <ConditionRow label="Keyboard" value={conditions.keyboard_condition} />}
                    {conditions.trackpad_condition && <ConditionRow label="Trackpad" value={conditions.trackpad_condition} />}
                    {conditions.ports_condition && <ConditionRow label="Ports" value={conditions.ports_condition} />}
                    {conditions.dent_top_panel && <ConditionRow label="Dent on Top Panel" value={conditions.dent_top_panel} />}
                    {conditions.dent_base_panel && <ConditionRow label="Dent on Base Panel" value={conditions.dent_base_panel} />}
                    {conditions.loose_hinges && <ConditionRow label="Loose Hinges" value={conditions.loose_hinges} />}
                    {conditions.cracked_loose_panel && <ConditionRow label="Cracked or Loose Panel" value={conditions.cracked_loose_panel} />}
                    {conditions.hard_drive && <ConditionRow label="Hard Drive / SSD" value={conditions.hard_drive} />}
                    {conditions.motherboard && <ConditionRow label="Motherboard / Logic Board" value={conditions.motherboard} />}
                  </>
                )}
                {conditions.speakers_condition && <ConditionRow label="Speakers" value={conditions.speakers_condition} />}
                {conditions.camera_condition && <ConditionRow label="Camera" value={conditions.camera_condition} />}
                {conditions.wifi_bluetooth_condition && <ConditionRow label="WiFi/Bluetooth" value={conditions.wifi_bluetooth_condition} />}
                {conditions.charging_port && <ConditionRow label="Charging Port" value={conditions.charging_port} />}
                {conditions.warranty_status && (
                  <ConditionRow label="Warranty" value={conditions.warranty_status} />
                )}
                {/* Declared Repair Issues */}
                {Array.isArray(conditions.repair_issues) && conditions.repair_issues.length > 0 && (
                  <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
                    <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-secondary)' }}>Declared repair issues</p>
                    <div className="flex flex-wrap gap-2">
                      {conditions.repair_issues.map((issue) => (
                        <span key={issue} className="px-2.5 py-1 text-xs rounded-full bg-red-500/10 text-red-500 border border-red-500/20 font-medium">
                          {issue}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {/* Condition Photos */}
                {(conditions.screen_condition_photo_url || conditions.body_condition_photo_url) && (
                  <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
                    <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-secondary)' }}>Condition Photos</p>
                    <div className="grid grid-cols-2 gap-3">
                      {conditions.screen_condition_photo_url && (
                        <div>
                          <p className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>Screen</p>
                          <a href={conditions.screen_condition_photo_url} target="_blank" rel="noopener noreferrer">
                            <img src={conditions.screen_condition_photo_url} alt="Screen condition" className="w-full aspect-square object-cover rounded-lg border hover:opacity-90 transition-opacity" style={{ borderColor: 'var(--color-border)' }} />
                          </a>
                        </div>
                      )}
                      {conditions.body_condition_photo_url && (
                        <div>
                          <p className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>Body</p>
                          <a href={conditions.body_condition_photo_url} target="_blank" rel="noopener noreferrer">
                            <img src={conditions.body_condition_photo_url} alt="Body condition" className="w-full aspect-square object-cover rounded-lg border hover:opacity-90 transition-opacity" style={{ borderColor: 'var(--color-border)' }} />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Photos */}
          {request.photos_url && request.photos_url.length > 0 && (
            <div className="card p-5">
              <h3 className="font-black text-sm uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
                Device Photos <span className="text-xs font-normal" style={{ color: 'var(--color-text-muted)' }}>Tap to zoom</span>
              </h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {request.photos_url.map((url, i) => (
                  <div key={i} className="relative cursor-pointer group rounded-lg overflow-hidden border" style={{ borderColor: 'var(--color-border)' }} onClick={() => { setPhotoGallery(request.photos_url); setZoomIndex(i); setZoomPhoto(url); }}>
                    <img src={url} alt={`Photo ${i+1}`} className="w-full aspect-square object-cover group-hover:opacity-80 transition-opacity" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                      <ZoomIn className="w-5 h-5 text-white" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Pricing Card */}
          <div className="card p-5">
            <h3 className="font-black text-sm uppercase tracking-wider mb-4" style={{ color: 'var(--color-text)' }}>Pricing</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span style={{ color: 'var(--color-text-secondary)' }}>Estimated Price</span>
                <span className="font-medium" style={{ color: 'var(--color-text)' }}>₹{formatPrice(request.system_estimated_price)}</span>
              </div>
              {request.admin_offer_price && (
                <div className="flex justify-between">
                  <span style={{ color: 'var(--color-text-secondary)' }}>Our Offer</span>
                  <span className="font-bold text-indigo-500">₹{formatPrice(request.admin_offer_price)}</span>
                </div>
              )}
              {request.final_price && (
                <div className="flex justify-between">
                  <span style={{ color: 'var(--color-text-secondary)' }}>Final Price</span>
                  <span className="font-bold text-emerald-500">₹{formatPrice(request.final_price)}</span>
                </div>
              )}
              <hr style={{ borderColor: 'var(--color-border)' }} />
              <div className="flex justify-between items-center">
                <span className="font-bold" style={{ color: 'var(--color-text)' }}>Current Value</span>
                <span className="font-extrabold text-xl" style={{ color: 'var(--color-primary)' }}>₹{formatPrice(displayPrice)}</span>
              </div>
            </div>
          </div>

          {/* Timeline - Pulsing Stepper */}
          <div className="card p-5">
            <h3 className="font-black text-sm uppercase tracking-wider mb-4" style={{ color: 'var(--color-text)' }}>Timeline</h3>
            {request.status === 'Cancelled' ? (
              <div className="flex gap-3 items-center p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <div>
                  <p className="font-bold">Cancelled</p>
                  <p className="opacity-80">This sell request was cancelled.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {STEPPER_STAGES.map((step, idx) => {
                  const currentIdx = getStepIndex(request.status)
                  const isCompleted = idx < currentIdx
                  const isActive = idx === currentIdx
                  const isPending = idx > currentIdx
                  const isLast = idx === STEPPER_STAGES.length - 1

                  return (
                    <div key={idx} className="flex gap-3 relative">
                      {/* Vertical line between steps */}
                      {!isLast && (
                        <div
                          className="absolute left-[9px] top-6 w-[2px] h-[calc(100%+12px)] transition-colors"
                          style={{
                            background: isCompleted
                              ? 'var(--color-success)'
                              : isActive
                              ? 'linear-gradient(to bottom, var(--color-primary), var(--color-border))'
                              : 'var(--color-border)'
                          }}
                        />
                      )}

                      {/* Step Indicator Dot */}
                      <div className="relative z-10 shrink-0">
                        {isCompleted ? (
                          <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </div>
                        ) : isActive ? (
                          <div className="w-5 h-5 rounded-full bg-cyan-500 flex items-center justify-center text-white relative">
                            {/* Pulsing ring effect */}
                            <span className="absolute -inset-1 rounded-full bg-cyan-500/30 animate-ping" />
                            <div className="w-2.5 h-2.5 rounded-full bg-white" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold"
                            style={{
                              borderColor: 'var(--color-border)',
                              color: 'var(--color-text-muted)',
                              background: 'var(--color-surface)'
                            }}
                          >
                            {idx + 1}
                          </div>
                        )}
                      </div>

                      {/* Step Info */}
                      <div>
                        <p className={`text-xs font-bold ${isActive ? 'text-cyan-400' : isCompleted ? 'text-emerald-500' : 'text-gray-400'}`}>
                          {step.label}
                        </p>
                        <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed font-medium">
                          {step.desc}
                        </p>
                        {/* Timestamps */}
                        {idx === 0 && (
                          <p className="text-[10px] text-gray-500 mt-1 font-mono">
                            {request.created_at ? new Date(request.created_at).toLocaleString('en-IN') : '-'}
                          </p>
                        )}
                        {idx === 1 && request.pickup_scheduled_time && (
                          <p className="text-[10px] text-gray-500 mt-1 font-mono">
                            {new Date(request.pickup_scheduled_time).toLocaleString('en-IN')}
                          </p>
                        )}
                        {idx === 3 && request.status === 'Completed' && request.updated_at && (
                          <p className="text-[10px] text-gray-500 mt-1 font-mono">
                            {new Date(request.updated_at).toLocaleString('en-IN')}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Pickup Agent Info & Rating */}
          {request.assigned_agent_name && (
            <div className="card p-5">
              <h3 className="font-black text-sm uppercase tracking-wider mb-4" style={{ color: 'var(--color-text)' }}>Pickup Agent</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 font-extrabold text-sm">
                  {request.assigned_agent_name[0]?.toUpperCase() || 'A'}
                </div>
                <div>
                  <p className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>{request.assigned_agent_name}</p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Assigned to your pickup</p>
                </div>
              </div>

              {/* Agent Rating (Completed status) */}
              {request.status === 'Completed' && (
                <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
                  {existingRating ? (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-secondary)' }}>Your Agent Rating</p>
                      <div className="flex items-center gap-1 mb-2 text-sm">
                        {Array.from({ length: 5 }).map((_, idx) => (
                          <span key={idx} className={idx < existingRating.rating ? "text-amber-400" : "text-gray-300"}>★</span>
                        ))}
                        <span className="text-xs font-bold ml-1" style={{ color: 'var(--color-text)' }}>({existingRating.rating}/5)</span>
                      </div>
                      {existingRating.review && (
                        <p className="text-xs italic bg-gray-50 dark:bg-white/5 p-2 rounded-lg" style={{ color: 'var(--color-text-secondary)' }}>"{existingRating.review}"</p>
                      )}
                    </div>
                  ) : (
                    <form onSubmit={handleSubmitRating} className="space-y-3">
                      <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>Rate your pickup agent</p>
                      <div className="flex items-center gap-2">
                        {Array.from({ length: 5 }).map((_, idx) => {
                          const val = idx + 1
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setRatingInput(val)}
                              className="text-2xl transition-transform hover:scale-110"
                              style={{ color: val <= ratingInput ? '#F59E0B' : 'var(--color-text-muted)' }}
                            >
                              ★
                            </button>
                          )
                        })}
                      </div>
                      <textarea
                        value={reviewInput}
                        onChange={(e) => setReviewInput(e.target.value)}
                        placeholder="Write a brief review about the agent's behavior, professionalism..."
                        rows={2}
                        className="input w-full text-xs py-2 h-16 resize-none"
                      />
                      <button
                        type="submit"
                        disabled={ratingSaving}
                        className="w-full h-9 flex items-center justify-center bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl transition-all"
                      >
                        {ratingSaving ? 'Submitting...' : 'Submit Rating'}
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Secure Data Wipe Certificate Card */}
          {wipeCertificate && (
            <div className="card p-5 border-l-4 border-indigo-500 bg-indigo-50/5 dark:bg-indigo-950/10">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-black text-sm uppercase tracking-wider mb-1 flex items-center gap-1.5" style={{ color: 'var(--color-text)' }}>
                    <Shield className="w-4 h-4 text-indigo-500" /> Data Wipe Certificate
                  </h3>
                  <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Your device has been verified and securely wiped of all personal data.</p>
                </div>
                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 rounded-full text-[10px] font-bold">
                  WIPED
                </span>
              </div>
              <div className="mt-4 p-3 bg-gray-50 dark:bg-white/5 rounded-xl text-xs space-y-1.5 border" style={{ borderColor: 'var(--color-border)' }}>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--color-text-muted)' }}>Certificate No:</span>
                  <span className="font-semibold" style={{ color: 'var(--color-text)' }}>{wipeCertificate.certificate_number}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--color-text-muted)' }}>Wipe Method:</span>
                  <span className="font-semibold capitalize" style={{ color: 'var(--color-text)' }}>{wipeCertificate.wipe_method?.replace(/_/g, ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--color-text-muted)' }}>Device Serial:</span>
                  <span className="font-semibold uppercase" style={{ color: 'var(--color-text)' }}>{wipeCertificate.device_serial || 'Verified'}</span>
                </div>
              </div>
              <button
                onClick={() => setShowCertModal(true)}
                className="w-full mt-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Printer className="w-4 h-4" /> View & Print Certificate
              </button>
            </div>
          )}

          {/* Payment Details */}
          {['Offer_Accepted', 'Seller_Confirmed', 'Pickup_Scheduled', 'Agent_Assigned', 'Agent_En_Route', 'Agent_Arrived', 'Picked_Up'].includes(request.status) && (
            <div className="card p-5">
              <h3 className="font-black text-sm uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
                <CreditCard className="w-4 h-4" style={{ color: 'var(--color-primary)' }} /> Payment Details
              </h3>
              <p className="text-xs mb-4" style={{ color: 'var(--color-text-secondary)' }}>Add your payment details so we can transfer the amount after pickup verification.</p>
              
              <div className="space-y-4">
                {/* UPI ID */}
                <div>
                  <label className="block text-xs font-bold mb-1" style={{ color: 'var(--color-text-secondary)' }}>UPI ID</label>
                  <div className="flex items-center gap-2">
                    <Banknote className="w-5 h-5 text-emerald-500 shrink-0" />
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="yourname@upi"
                      className="input w-full"
                    />
                  </div>
                </div>

                <div className="relative py-1">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t" style={{ borderColor: 'var(--color-border)' }}></div></div>
                  <div className="relative flex justify-center text-[10px] uppercase font-bold"><span className="px-2" style={{ background: 'var(--color-surface)', color: 'var(--color-text-muted)' }}>OR bank details</span></div>
                </div>

                {/* Bank Details */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase mb-1" style={{ color: 'var(--color-text-muted)' }}>Account Holder Name</label>
                    <input
                      type="text"
                      value={bankDetails.account_holder}
                      onChange={(e) => setBankDetails({ ...bankDetails, account_holder: e.target.value })}
                      placeholder="Full name"
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase mb-1" style={{ color: 'var(--color-text-muted)' }}>Bank Name</label>
                    <input
                      type="text"
                      value={bankDetails.bank_name}
                      onChange={(e) => setBankDetails({ ...bankDetails, bank_name: e.target.value })}
                      placeholder="Bank name"
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase mb-1" style={{ color: 'var(--color-text-muted)' }}>Account Number</label>
                    <input
                      type="text"
                      value={bankDetails.account_number}
                      onChange={(e) => setBankDetails({ ...bankDetails, account_number: e.target.value })}
                      placeholder="Account number"
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase mb-1" style={{ color: 'var(--color-text-muted)' }}>IFSC Code</label>
                    <input
                      type="text"
                      value={bankDetails.ifsc}
                      onChange={(e) => setBankDetails({ ...bankDetails, ifsc: e.target.value.toUpperCase() })}
                      placeholder="IFSC code"
                      className="input w-full"
                    />
                  </div>
                </div>

                {/* Save Button */}
                <button
                  onClick={handleSavePaymentDetails}
                  disabled={paymentSaving || (!upiId && !bankDetails.account_number)}
                  className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                    paymentSaved ? 'bg-emerald-500 text-white' : 'btn-primary'
                  } disabled:opacity-50`}
                >
                  {paymentSaving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : paymentSaved ? (
                    <><CheckCircle2 className="w-4 h-4" /> Saved Successfully!</>
                  ) : (
                    <><Save className="w-4 h-4" /> Save Payment Details</>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Payment Completed Status */}
          {request.bank_details?.payment_done && (
            <div className="rounded-2xl p-5 border flex items-center gap-3" style={{ background: 'rgba(16,185,129,0.08)', borderColor: 'rgba(16,185,129,0.15)' }}>
              <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0" />
              <div>
                <h3 className="font-extrabold text-sm text-emerald-600">Payment Completed!</h3>
                <p className="text-xs text-emerald-600/90 mt-0.5">
                  {request.bank_details.payment_done_at 
                    ? `Paid on ${new Date(request.bank_details.payment_done_at).toLocaleString('en-IN')}`
                    : 'Your payment has been processed.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Photo Zoom Modal */}
      {zoomPhoto && (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center" onClick={() => setZoomPhoto(null)}>
          <button onClick={() => setZoomPhoto(null)} className="absolute top-4 right-4 z-50 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white">
            <X className="w-6 h-6" />
          </button>
          <div className="absolute top-4 left-4 text-white/70 text-sm font-medium bg-black/40 px-3 py-1 rounded-full">
            {zoomIndex + 1} / {photoGallery.length}
          </div>
          <div className="flex-1 flex items-center justify-center w-full px-12 sm:px-20" onClick={e => e.stopPropagation()}>
            <img src={zoomPhoto} alt="Zoomed" className="max-w-full max-h-[75vh] object-contain rounded-lg" />
          </div>
          {photoGallery.length > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); const prev = (zoomIndex - 1 + photoGallery.length) % photoGallery.length; setZoomIndex(prev); setZoomPhoto(photoGallery[prev]); }}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/10 hover:bg-white/25 rounded-full text-white">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); const next = (zoomIndex + 1) % photoGallery.length; setZoomIndex(next); setZoomPhoto(photoGallery[next]); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/10 hover:bg-white/25 rounded-full text-white">
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
          {photoGallery.length > 1 && (
            <div className="flex gap-2 py-3 px-4 overflow-x-auto max-w-full" onClick={e => e.stopPropagation()}>
              {photoGallery.map((url, i) => (
                <img key={i} src={url} alt={`Thumb ${i+1}`}
                  onClick={() => { setZoomIndex(i); setZoomPhoto(url); }}
                  className={`w-14 h-14 object-cover rounded-lg cursor-pointer border-2 shrink-0 transition-all ${i === zoomIndex ? 'border-white opacity-100 scale-110' : 'border-transparent opacity-50 hover:opacity-80'}`} />
              ))}
            </div>
          )}
        </div>
      )}
      {/* Secure Data Wipe Certificate Modal */}
      {showCertModal && wipeCertificate && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto no-print">
          <div className="bg-white text-gray-900 rounded-2xl w-full max-w-2xl shadow-2xl relative border-8 border-double border-indigo-600 p-6 sm:p-10" id="certificate-print-area">
            {/* Print CSS styling embedded inside the modal */}
            <style>{`
              @media print {
                body * {
                  visibility: hidden;
                }
                #certificate-print-area, #certificate-print-area * {
                  visibility: visible;
                }
                #certificate-print-area {
                  position: absolute;
                  left: 0;
                  top: 0;
                  width: 100%;
                  height: auto;
                  border: 12px double #4F46E5 !important;
                  margin: 0 !important;
                  padding: 40px !important;
                  box-shadow: none !important;
                  background: white !important;
                  color: black !important;
                }
                .no-print {
                  display: none !important;
                }
              }
            `}</style>

            {/* Close Button */}
            <button
              onClick={() => setShowCertModal(false)}
              className="absolute top-4 right-4 p-1 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-full transition-colors no-print"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Certificate Header */}
            <div className="text-center space-y-3">
              <div className="flex justify-center">
                <Shield className="w-16 h-16 text-indigo-600 animate-pulse" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-widest text-indigo-900 font-serif">BUYBACK ELITE</h1>
              <p className="text-xs font-bold tracking-widest text-gray-500 uppercase">Official Certificate of Secure Data Destruction</p>
              <div className="w-24 h-1 bg-indigo-600 mx-auto rounded"></div>
            </div>

            {/* Certificate Body */}
            <div className="mt-8 space-y-6 text-sm text-gray-700 leading-relaxed font-sans text-center max-w-lg mx-auto">
              <p>
                This is to officially certify that the device detailed below has successfully undergone a verified, secure data erasure protocol prior to finalizing the buyback transaction.
              </p>
              <p className="font-medium text-gray-900 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100/50 text-left">
                All personal databases, browser caches, system registries, credentials, and manufacturer lock protocols (including Apple ID, iCloud, and Mobile Device Management) have been permanently and irretrievably purged from the device hardware storage.
              </p>
            </div>

            {/* Device Info Sheet */}
            <div className="mt-8 border border-gray-200 rounded-xl overflow-hidden text-xs sm:text-sm">
              <div className="grid grid-cols-2 bg-indigo-900 text-white font-bold p-3">
                <div>SPECIFICATION</div>
                <div>VERIFIED RECORD</div>
              </div>
              <div className="divide-y divide-gray-100">
                <div className="grid grid-cols-2 p-3"><span className="text-gray-500">Device Type</span><span className="font-semibold uppercase">{wipeCertificate.device_type}</span></div>
                <div className="grid grid-cols-2 p-3"><span className="text-gray-500">Model Name</span><span className="font-semibold">{wipeCertificate.model_name || request.model_name}</span></div>
                <div className="grid grid-cols-2 p-3"><span className="text-gray-500">Hardware Serial</span><span className="font-semibold uppercase tracking-wider">{wipeCertificate.device_serial || 'Verified & Locked'}</span></div>
                <div className="grid grid-cols-2 p-3"><span className="text-gray-500">Erasure Method</span><span className="font-semibold capitalize">{wipeCertificate.wipe_method?.replace(/_/g, ' ')}</span></div>
                <div className="grid grid-cols-2 p-3"><span className="text-gray-500">Certification No</span><span className="font-mono font-bold text-indigo-700">{wipeCertificate.certificate_number}</span></div>
                <div className="grid grid-cols-2 p-3"><span className="text-gray-500">Timestamp</span><span className="font-semibold">{new Date(wipeCertificate.wiped_at).toLocaleString('en-IN')}</span></div>
              </div>
            </div>

            {/* Signatures */}
            <div className="mt-10 flex flex-col sm:flex-row justify-between items-center gap-6 border-t border-gray-100 pt-6">
              <div className="text-center sm:text-left">
                <p className="text-xs text-gray-500">Certified Technologist</p>
                <p className="font-bold font-serif text-sm text-gray-900 border-b-2 border-indigo-200 pb-1 px-4 mt-2 italic">{wipeCertificate.wiped_by_name || 'Verified Agent'}</p>
                <p className="text-[10px] text-gray-400 mt-1 font-mono">ID: {wipeCertificate.wiped_by_agent_id?.substring(0, 8)}...</p>
              </div>
              <div className="text-center sm:text-right">
                <p className="text-xs text-gray-500">Security Clearance Authorization</p>
                <div className="flex items-center gap-1.5 justify-center sm:justify-end mt-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-[10px]">✓</div>
                  <span className="font-black text-xs text-emerald-700 tracking-wider font-mono">BBE-SECURE</span>
                </div>
                <p className="text-[10px] text-gray-400 mt-1">Verified Digital Seal</p>
              </div>
            </div>

            {/* Print & Close Controls */}
            <div className="mt-8 flex gap-3 no-print">
              <button
                onClick={() => setShowCertModal(false)}
                className="flex-1 py-3 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all"
              >
                Close View
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 py-3 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20"
              >
                <Printer className="w-4 h-4" /> Print / Save PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>{label}</p>
      <p className="font-semibold text-sm mt-0.5" style={{ color: 'var(--color-text)' }}>{value || '-'}</p>
    </div>
  )
}

function isDeductionValue(v) {
  if (!v || typeof v !== 'string') return false
  const s = v.toLowerCase()
  const badKeywords = [
    'not working', 'not holding', 'not turning', 'not boot',
    'cracked', 'broken', 'major', 'visible', 'distorted',
    'spots', 'lines', 'flicker', 'discolour', 'discolor',
    'missing', 'defective', 'issue', 'damage', 'loose',
    'sticky', 'blurry', 'minor scratches', 'minor dents',
    'some keys', 'some not', 'most not', 'click issues',
    '300-499', '500-799', '800', '1000+',
    'below 70', '70-79', '80-89',
    'upto 2', 'more than 2', '1 or more',
  ]
  return badKeywords.some(k => s.includes(k))
}

function ConditionRow({ label, value, isGood }) {
  const good = typeof isGood === 'boolean' ? isGood : !isDeductionValue(value)
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: 'var(--color-border)' }}>
      <span className="text-xs sm:text-sm" style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
      <span className={`text-xs sm:text-sm font-semibold flex items-center gap-1.5 ${good ? 'text-emerald-500' : 'text-amber-500'}`}>
        {good ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
        {value}
      </span>
    </div>
  )
}
