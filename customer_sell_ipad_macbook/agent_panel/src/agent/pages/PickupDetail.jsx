import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { supabase } from '../../lib/supabase'
import {
  ArrowLeft, Laptop, Tablet, Phone, Mail, MapPin, Clock,
  Navigation, CheckCircle2, Package, IndianRupee, User,
  ExternalLink, AlertCircle, Camera, FileText, CreditCard,
  ChevronDown, ChevronUp, Edit3, Check, X, MessageCircle, Shield
} from 'lucide-react'

const STATUS_FLOW = [
  { key: 'pending', label: 'Pending', statuses: ['Pickup_Scheduled', 'Offer_Accepted', 'Agent_Assigned'] },
  { key: 'en_route', label: 'En Route', statuses: ['Agent_En_Route'] },
  { key: 'arrived', label: 'Arrived', statuses: ['Agent_Arrived'] },
  { key: 'picked_up', label: 'Picked Up', statuses: ['Picked_Up'] },
  { key: 'completed', label: 'Completed', statuses: ['Completed'] },
]

export default function PickupDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { assignedPickups, completedPickups, fetchAssignedPickups, updatePickupStatus, uploadVerificationPhoto, submitVerification, startLocationTracking, stopLocationTracking, isLoading } = useStore()
  const [actionLoading, setActionLoading] = useState(null)
  const [showVerification, setShowVerification] = useState(false)

  // Verification state
  const [verifiedConditions, setVerifiedConditions] = useState({})
  const [verificationPhotos, setVerificationPhotos] = useState([])
  const [upiId, setUpiId] = useState('')
  const [paymentBarcodeUrl, setPaymentBarcodeUrl] = useState(null)
  const [agentNotes, setAgentNotes] = useState('')
  const [customerConsent, setCustomerConsent] = useState(false)
  const [photoUploading, setPhotoUploading] = useState(false)
  const verPhotoRef = useRef(null)
  const barcodeRef = useRef(null)

  const [dataWipeConfirmed, setDataWipeConfirmed] = useState(false)
  const [deviceSerial, setDeviceSerial] = useState('')
  const [wipeMethod, setWipeMethod] = useState('factory_reset')
  const [dataWipeNotes, setDataWipeNotes] = useState('')
  const [defectPhotos, setDefectPhotos] = useState({})

  // WhatsApp popup state
  const [showWAPopup, setShowWAPopup] = useState(false)
  const [waPhone, setWaPhone] = useState('')
  const [waMessage, setWaMessage] = useState('')

  // Price recalculation state (matching Flutter Android app)
  const [conditionDeductions, setConditionDeductions] = useState([])
  const [revisedPrice, setRevisedPrice] = useState(0)
  const [priceBreakdownDetails, setPriceBreakdownDetails] = useState({ customerDeductions: {}, agentDeductions: {}, basePrice: 0 })

  useEffect(() => {
    if (assignedPickups.length === 0) fetchAssignedPickups()
    // Fetch condition deductions for price recalculation
    const fetchDeductions = async () => {
      try {
        const { data } = await supabase
          .from('condition_deductions')
          .select()
          .order('category')
        if (data) {
          // Log Body category specifically with actual values
          const bodyDeductions = data.filter(d => (d.category || '').toLowerCase() === 'body')
          console.log('[DB] Body deductions from Supabase:', bodyDeductions.map(d => ({
            name: d.condition_name,
            value: d.value,
            deduction_amount: d.deduction_amount,
            actual: d.value ?? d.deduction_amount ?? 0
          })))
          // Alert for debugging - remove after fix
          const visibleDents = bodyDeductions.find(d => (d.condition_name || '').toLowerCase() === 'visible dents')
          if (visibleDents) {
            const actualValue = visibleDents.value ?? visibleDents.deduction_amount ?? 0
            console.warn(`[DEBUG] Visible dents deduction from DB = ₹${actualValue}`)
          }
          setConditionDeductions(data)
        }
      } catch (e) {
        console.error('Failed to fetch condition deductions:', e)
      }
    }
    fetchDeductions()
    return () => stopLocationTracking()
  }, [])

  const pickup = assignedPickups.find(p => p.id === id) || completedPickups.find(p => p.id === id)

  if (!pickup) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Pickup Not Found</h3>
        <button onClick={() => navigate('/field-tech/pickups')} className="text-orange-600 font-medium hover:underline">
          Back to Pickups
        </button>
      </div>
    )
  }

  const user = pickup.users || {}
  const specs = pickup.specs || {}
  const conditions = pickup.condition_answers || {}
  const isMac = pickup.device_type === 'MacBook'
  const formatPrice = (p) => (p || 0).toLocaleString('en-IN')
  const originalPrice = pickup.system_estimated_price || 0

  // Initialize verification conditions from customer's conditions
  useEffect(() => {
    if (pickup && Object.keys(verifiedConditions).length === 0) {
      setVerifiedConditions({ ...conditions })
    }
  }, [pickup])

  // ============ PRICE RECALCULATION (matching Flutter Android app) ============
  const CATEGORY_MAP = {
    screen_condition: 'Screen',
    body_condition: 'Body',
    keyboard_condition: 'Keyboard',
    trackpad_condition: 'Trackpad',
    ports_condition: 'Ports',
    speakers_condition: 'Speakers',
    camera_condition: 'Camera',
    wifi_bluetooth_condition: 'WiFi/Bluetooth',
  }

  const readDeductionValue = (row) => {
    // Check both possible column names from different SQL schemas
    const raw = row?.value ?? row?.deduction_amount ?? row?.amount ?? 0
    if (raw == null) return 0
    const result = typeof raw === 'number' ? Math.round(raw) : (parseInt(String(raw)) || 0)
    return result
  }

  const getDeductionForCondition = useCallback((key, value) => {
    const category = CATEGORY_MAP[key]
    if (!category || !value) return 0
    // Case-insensitive matching for both category and condition_name
    const categoryLower = category.toLowerCase()
    const valueLower = value.toLowerCase()
    const match = conditionDeductions.find(
      d => (d.category || '').toLowerCase() === categoryLower && 
           (d.condition_name || '').toLowerCase() === valueLower
    )
    const result = match ? readDeductionValue(match) : 0
    console.log(`[DEDUCTION] ${category} -> "${value}" = ₹${result}`, match)
    return result
  }, [conditionDeductions])

  const getAccessoryDeduction = useCallback((conditionName) => {
    const nameLower = conditionName.toLowerCase()
    const match = conditionDeductions.find(
      d => (d.category || '').toLowerCase() === 'accessories' && 
           (d.condition_name || '').toLowerCase() === nameLower
    )
    return match ? readDeductionValue(match) : 0
  }, [conditionDeductions])

  const recalculatePrice = useCallback(() => {
    if (!conditionDeductions.length || !originalPrice) {
      setRevisedPrice(originalPrice)
      return
    }

    const customerAnswers = conditions || {}
    const customerDeductionsMap = {}
    const agentDeductionsMap = {}

    // Calculate customer's deductions (what was already applied to get originalPrice)
    let customerTotal = 0
    Object.entries(customerAnswers).forEach(([key, value]) => {
      if (typeof value === 'string' && value) {
        const ded = getDeductionForCondition(key, value)
        if (ded > 0) {
          customerDeductionsMap[CONDITION_LABELS[key] || key] = { value, deduction: ded }
          customerTotal += ded
        }
      } else if (typeof value === 'boolean') {
        if (key === 'charger_available' && value === false) {
          const ded = getAccessoryDeduction('No charger')
          if (ded > 0) { customerDeductionsMap['No Charger'] = { value: 'Missing', deduction: ded }; customerTotal += ded }
        }
        if (key === 'box_available' && value === true) {
          const ded = getAccessoryDeduction('Box included')
          if (ded < 0) { customerDeductionsMap['Box Included'] = { value: 'Yes', deduction: ded }; customerTotal += ded }
        }
      }
    })

    // Reconstruct base price (before any deductions)
    const basePrice = originalPrice + customerTotal

    // Calculate agent's verified deductions
    let agentTotal = 0
    Object.entries(verifiedConditions).forEach(([key, value]) => {
      if (typeof value === 'string' && value) {
        const ded = getDeductionForCondition(key, value)
        if (ded > 0) {
          agentDeductionsMap[CONDITION_LABELS[key] || key] = { value, deduction: ded }
          agentTotal += ded
        }
      } else if (typeof value === 'boolean') {
        if (key === 'charger_available' && value === false) {
          const ded = getAccessoryDeduction('No charger')
          if (ded > 0) { agentDeductionsMap['No Charger'] = { value: 'Missing', deduction: ded }; agentTotal += ded }
        }
        if (key === 'box_available' && value === true) {
          const ded = getAccessoryDeduction('Box included')
          if (ded < 0) { agentDeductionsMap['Box Included'] = { value: 'Yes', deduction: ded }; agentTotal += ded }
        }
      }
    })

    const newPrice = Math.max(0, basePrice - agentTotal)
    setRevisedPrice(newPrice)
    setPriceBreakdownDetails({ customerDeductions: customerDeductionsMap, agentDeductions: agentDeductionsMap, basePrice, customerTotal, agentTotal })
  }, [conditionDeductions, conditions, verifiedConditions, originalPrice, getDeductionForCondition, getAccessoryDeduction])

  // Recalculate whenever conditions change or deductions load
  useEffect(() => {
    recalculatePrice()
  }, [recalculatePrice])

  // Get current step index
  const currentStepIndex = STATUS_FLOW.findIndex(step => step.statuses.includes(pickup.status))

  // Get next action
  const getNextAction = () => {
    if (['Pickup_Scheduled', 'Offer_Accepted', 'Agent_Assigned'].includes(pickup.status)) {
      return { action: 'en_route', label: 'Start Journey', color: 'bg-blue-600 hover:bg-blue-700' }
    }
    if (pickup.status === 'Agent_En_Route') {
      return { action: 'arrived', label: 'Mark Arrived', color: 'bg-purple-600 hover:bg-purple-700' }
    }
    if (pickup.status === 'Agent_Arrived') {
      return { action: 'picked_up', label: 'Confirm Pickup', color: 'bg-teal-600 hover:bg-teal-700' }
    }
    if (pickup.status === 'Picked_Up') {
      return { action: 'completed', label: 'Complete Delivery', color: 'gradient-success' }
    }
    return null
  }

  const nextAction = getNextAction()

  const handleStatusUpdate = async (action) => {
    if (action === 'picked_up') {
      setShowVerification(true)
      return
    }
    setActionLoading(action)
    await updatePickupStatus(pickup.id, action)
    // Start GPS tracking when agent goes en route
    if (action === 'en_route') {
      startLocationTracking(pickup.id)
    }
    setActionLoading(null)
  }

  // Condition option maps
  const CONDITION_OPTIONS = {
    screen_condition: ['Perfect (No scratches)', 'Minor scratches', 'Visible scratches', 'Cracked/Broken'],
    body_condition: ['Like new', 'Minor dents/scratches', 'Visible dents', 'Major damage'],
    keyboard_condition: ['Working perfectly', 'Some keys not working', 'Not working'],
    trackpad_condition: ['Working perfectly', 'Click issues', 'Not working'],
    ports_condition: ['All working', 'Some not working', 'Most not working'],
    speakers_condition: ['Working', 'Distorted sound', 'Not working'],
    camera_condition: ['Working', 'Not working'],
    wifi_bluetooth_condition: ['Working', 'Not working'],
  }

  const CONDITION_LABELS = {
    screen_condition: 'Screen Condition',
    body_condition: 'Body Condition',
    keyboard_condition: 'Keyboard',
    trackpad_condition: 'Trackpad',
    ports_condition: 'Ports',
    speakers_condition: 'Speakers',
    camera_condition: 'Camera',
    wifi_bluetooth_condition: 'WiFi / Bluetooth',
  }

  const handleConditionChange = (key, value) => {
    setVerifiedConditions(prev => ({ ...prev, [key]: value }))
  }

  const handleVerificationPhotoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoUploading(true)
    try {
      const url = await uploadVerificationPhoto(file, pickup.id)
      if (url) setVerificationPhotos(prev => [...prev, url])
    } catch (err) { console.error(err) }
    setPhotoUploading(false)
    if (verPhotoRef.current) verPhotoRef.current.value = ''
  }

  const handleBarcodeUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoUploading(true)
    try {
      const url = await uploadVerificationPhoto(file, pickup.id)
      if (url) setPaymentBarcodeUrl(url)
    } catch (err) { console.error(err) }
    setPhotoUploading(false)
    if (barcodeRef.current) barcodeRef.current.value = ''
  }

  const isConditionChanged = (key) => {
    return conditions[key] !== undefined && verifiedConditions[key] !== undefined && conditions[key] !== verifiedConditions[key]
  }

  const handleVerificationSubmit = async () => {
    if (!customerConsent) return alert('Customer consent is required before submitting.')

    // Enforce Anti Bait-and-Switch rule
    const priceRatio = revisedPrice / originalPrice
    if (priceRatio < 0.85) {
      if (verificationPhotos.length === 0) {
        return alert('Warning: The revised offer is more than 15% below the original quote. Since we guarantee price transparency, you must upload at least one verification photo as proof of device condition/defects.')
      }
      if (!agentNotes || agentNotes.trim().length < 10) {
        return alert('Warning: The revised offer is more than 15% below the original quote. You must provide a clear inspection explanation of at least 10 characters in the Agent Notes field.')
      }

      // Enforce per-defect photos for degraded conditions if price drops >15%
      const degradedKeys = Object.keys(CONDITION_OPTIONS).filter(key => {
        if (!isMac && (key === 'keyboard_condition' || key === 'trackpad_condition')) return false
        const customerValue = conditions[key]
        const agentValue = verifiedConditions[key]
        return getDeductionForCondition(key, agentValue) > getDeductionForCondition(key, customerValue)
      })
      const missingPhotos = degradedKeys.filter(key => !defectPhotos[key])
      if (missingPhotos.length > 0) {
        const labels = missingPhotos.map(key => CONDITION_LABELS[key] || key).join(', ')
        return alert(`Warning: The revised offer is more than 15% below the original quote. You must upload defect-specific photo proof for the degraded conditions: ${labels}`)
      }
    }

    // Validate Data Wipe Serial Number
    if (dataWipeConfirmed && !deviceSerial.trim()) {
      return alert('Serial number is required to generate the Secure Data Wipe Certificate.')
    }

    setActionLoading('verification')
    try {
      const dataWipe = dataWipeConfirmed ? {
        deviceSerial: deviceSerial.trim(),
        wipeMethod,
        notes: dataWipeNotes.trim() || 'Factory data reset completed.',
        deviceType: pickup.device_type,
        modelName: pickup.model_name,
        customerEmail: user.email,
        customerName: user.name
      } : null

      await submitVerification(pickup.id, {
        verifiedConditions: {
          ...verifiedConditions,
          agent_verification_photos: verificationPhotos,
          defect_photos: defectPhotos,
        },
        revisedPrice,
        originalPrice,
        upiId,
        paymentBarcodeUrl,
        agentNotes,
        dataWipe,
      })
      stopLocationTracking()
      setShowVerification(false)
      navigate('/field-tech/pickups')
    } catch (err) {
      console.error(err)
      alert('Failed to submit verification. Please try again.')
    }
    setActionLoading(null)
  }

  const openMaps = () => {
    const location = pickup.user_location || {}
    const lat = location.latitude || pickup.pickup_lat
    const lng = location.longitude || pickup.pickup_lng
    const address = location.address || pickup.pickup_address

    if (lat && lng) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank')
    } else if (address) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank')
    }
  }

  const openWhatsApp = () => {
    const phone = pickup.customer_phone || user.phone
    if (!phone) return
    const digits = phone.replace(/\D/g, '')
    const waNumber = digits.length === 10 ? `91${digits}` : digits
    const deviceModel = pickup.model_name || pickup.device_type || 'your device'
    const customerName = user.name || 'Customer'
    const schedTime = pickup.pickup_scheduled_time
      ? new Date(pickup.pickup_scheduled_time).toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
      : ''
    const msg = `Hi ${customerName}! 👋\n\nThis is your BuyBack Elite pickup agent. I have been assigned to collect your *${deviceModel}*.${schedTime ? `\n\n📅 Scheduled: ${schedTime}` : ''}\n\nI will be reaching your location soon. Please keep your device and ID proof ready.\n\nFeel free to reply here if you have any questions. 🙏`
    window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  const callCustomer = () => {
    const phone = pickup.customer_phone || user.phone
    if (phone) {
      // Try tel: link (works on mobile/tablets), fallback to clipboard copy on desktop
      const isMobileDevice = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
      if (isMobileDevice) {
        window.open(`tel:${phone}`, '_self')
      } else {
        navigator.clipboard.writeText(phone).then(() => {
          alert(`Phone number copied: ${phone}`)
        }).catch(() => {
          prompt('Copy phone number:', phone)
        })
      }
    }
  }

  const openWAPopup = () => {
    const phone = pickup.customer_phone || user.phone
    if (!phone) return alert('Customer phone number not available')
    const name = user.name || 'Customer'
    const device = pickup.model_name || pickup.device_type || 'device'
    const status = pickup.status
    let defaultMsg = ''
    if (status === 'Agent_En_Route') {
      defaultMsg = `Hi ${name}, I am your BuyBack Elite pickup agent. I am on my way to pick up your ${device}. Please keep the device ready. Thank you!`
    } else if (status === 'Agent_Arrived') {
      defaultMsg = `Hi ${name}, I have arrived at your location for the ${device} pickup. Please come to the door. Thank you!`
    } else {
      defaultMsg = `Hi ${name}, I am your BuyBack Elite pickup agent assigned for your ${device} pickup. I will be arriving shortly. Thank you!`
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

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <button
        onClick={() => navigate('/field-tech/pickups')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 font-medium"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Pickups
      </button>

      <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-4 min-w-0">
          <div className={`w-14 h-14 shrink-0 rounded-xl flex items-center justify-center ${
            isMac ? 'bg-indigo-100' : 'bg-emerald-100'
          }`}>
            {isMac ? <Laptop className="w-7 h-7 text-indigo-600" /> : <Tablet className="w-7 h-7 text-emerald-600" />}
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 break-words">{pickup.model_name || pickup.device_type}</h1>
            <p className="text-sm text-gray-500">ID: {pickup.id?.substring(0, 12)}...</p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xl sm:text-2xl font-bold text-gray-900">
            ₹{formatPrice(pickup.final_price || pickup.admin_offer_price || pickup.system_estimated_price)}
          </p>
        </div>
      </div>

      {/* Status Progress */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Pickup Progress</h3>
        <div className="flex items-center justify-between overflow-x-auto pb-2">
          {STATUS_FLOW.map((step, idx) => {
            const isCompleted = idx < currentStepIndex
            const isCurrent = idx === currentStepIndex
            const isLast = idx === STATUS_FLOW.length - 1

            return (
              <div key={step.key} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    isCompleted ? 'bg-green-500 text-white' :
                    isCurrent ? 'bg-orange-500 text-white' :
                    'bg-gray-200 text-gray-500'
                  }`}>
                    {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                  </div>
                  <span className={`text-xs mt-1 ${isCurrent ? 'font-semibold text-orange-600' : 'text-gray-500'}`}>
                    {step.label}
                  </span>
                </div>
                {!isLast && (
                  <div className={`flex-1 h-1 mx-2 rounded ${
                    isCompleted ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Customer Information</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Name</p>
                  <p className="font-medium text-gray-900">{user.name || 'Customer'}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div
                  onClick={callCustomer}
                  className="flex-1 flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-green-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Phone className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="font-medium text-gray-900">{pickup.customer_phone || user.phone || '-'}</p>
                  </div>
                  <span className="text-xs text-green-600 font-medium">Tap to call</span>
                </div>
                {(pickup.customer_phone || user.phone) && (
                  <button onClick={openWhatsApp} className="p-3 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors shrink-0" title="WhatsApp Customer">
                    <MessageCircle className="w-5 h-5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Mail className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="font-medium text-gray-900 text-sm">{user.email || '-'}</p>
                </div>
              </div>

              <div
                onClick={openMaps}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors"
              >
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Address</p>
                  <p className="font-medium text-gray-900 text-sm">
                    {pickup.user_location?.address || pickup.pickup_address || 'Address not available'}
                  </p>
                </div>
                <ExternalLink className="w-4 h-4 text-indigo-600" />
              </div>

              {/* WhatsApp Customer Button */}
              {(user.phone || pickup.customer_phone) && (
                <button
                  onClick={openWAPopup}
                  className="w-full flex items-center justify-center gap-2 p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors border border-green-200"
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5 text-green-600 fill-current">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  <span className="text-green-700 font-semibold text-sm">Message Customer via WhatsApp</span>
                </button>
              )}
            </div>
          </div>

          {/* Device Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Device Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoRow label="Type" value={pickup.device_type} />
              <InfoRow label="Model" value={pickup.model_name} />
              <InfoRow label="Storage" value={specs.storage} />
              <InfoRow label="RAM" value={specs.ram} />
              <InfoRow label="Battery Health" value={specs.battery_health || specs.batteryHealth} />
              {isMac && <InfoRow label="Cycle Count" value={specs.cycle_count || specs.cycleCount} />}
            </div>
          </div>

          {/* Basic Checks */}
          {Object.keys(conditions).length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Basic Checks</h3>
              {(conditions.device_turns_on === false || conditions.deviceTurnsOn === false ||
                conditions.is_repairable === false || conditions.isRepairable === false) && (
                <div className="mb-4 flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-3">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-red-700">Not Acceptable</p>
                    <p className="text-xs text-red-600">
                      {(conditions.device_turns_on === false || conditions.deviceTurnsOn === false)
                        ? 'Device does not turn on — cannot proceed with buyback.'
                        : 'Device was repaired or opened before — only never-repaired devices are accepted.'}
                    </p>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2 text-sm">
                {[
                  { keys: ['device_turns_on', 'deviceTurnsOn'], label: 'Device Turns On', invert: false },
                  { keys: ['is_repairable', 'isRepairable'], label: 'Repaired Before', invert: true },
                  { keys: ['screen_original', 'screenOriginal'], label: 'Screen Original', invert: false },
                  { keys: ['charger_available', 'chargerAvailable'], label: 'Charger Available', invert: false },
                  { keys: ['box_available', 'boxAvailable'], label: 'Box Available', invert: false },
                ].map(({ keys, label, invert }) => {
                  const val = conditions[keys[0]] ?? conditions[keys[1]]
                  if (val === undefined || val === null) return null
                  const isGood = invert ? val !== false : val === true
                  const displayVal = invert ? (val === false ? 'Yes' : 'No') : (val ? 'Yes' : 'No')
                  return (
                    <div key={label} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                      <span className="text-gray-600 text-xs">{label}</span>
                      <span className={`font-semibold text-xs px-2 py-0.5 rounded-full ${isGood ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {displayVal}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Photos */}
          {pickup.photos_url && pickup.photos_url.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Device Photos</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {pickup.photos_url.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                    <img src={url} alt={`Photo ${i+1}`} className="w-full aspect-square object-cover rounded-lg border border-gray-200 hover:opacity-90 transition-opacity" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Action Button */}
          {nextAction && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Next Action</h3>
              <button
                onClick={() => handleStatusUpdate(nextAction.action)}
                disabled={actionLoading === nextAction.action || isLoading}
                className={`w-full py-3.5 text-white font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${nextAction.color}`}
              >
                {actionLoading === nextAction.action ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    {nextAction.action === 'en_route' && <Navigation className="w-5 h-5" />}
                    {nextAction.action === 'arrived' && <MapPin className="w-5 h-5" />}
                    {nextAction.action === 'picked_up' && <Package className="w-5 h-5" />}
                    {nextAction.action === 'completed' && <CheckCircle2 className="w-5 h-5" />}
                    {nextAction.label}
                  </>
                )}
              </button>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <button
                onClick={openMaps}
                className="w-full flex items-center gap-3 p-3 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-colors"
              >
                <Navigation className="w-5 h-5" />
                <span className="font-medium">Navigate to Location</span>
              </button>
              <button
                onClick={callCustomer}
                className="w-full flex items-center gap-3 p-3 bg-green-50 text-green-700 rounded-xl hover:bg-green-100 transition-colors"
              >
                <Phone className="w-5 h-5" />
                <span className="font-medium">Call Customer {user.phone ? `(${user.phone})` : ''}</span>
              </button>
              {user.phone && (
                <button
                  onClick={openWhatsApp}
                  className="w-full flex items-center gap-3 p-3 bg-emerald-50 text-emerald-700 rounded-xl hover:bg-emerald-100 transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span className="font-medium">WhatsApp Customer</span>
                </button>
              )}
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Pricing</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">System Estimate</span>
                <span className="font-medium">₹{formatPrice(pickup.system_estimated_price)}</span>
              </div>
              {pickup.admin_offer_price && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Admin Offer</span>
                  <span className="font-medium">₹{formatPrice(pickup.admin_offer_price)}</span>
                </div>
              )}
              {pickup.final_price && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Final Price</span>
                  <span className="font-bold text-green-600">₹{formatPrice(pickup.final_price)}</span>
                </div>
              )}
              <hr className="my-2" />
              <div className="flex justify-between">
                <span className="font-semibold">Amount to Pay</span>
                <span className="font-bold text-lg text-orange-600">
                  ₹{formatPrice(pickup.final_price || pickup.admin_offer_price || pickup.system_estimated_price)}
                </span>
              </div>
            </div>
          </div>

          {/* Price Breakdown - Deductions & Bonuses */}
          {pickup.price_breakdown && Object.keys(pickup.price_breakdown).length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Deductions & Bonuses</h3>
              {pickup.price_breakdown.base_price > 0 && (
                <div className="flex justify-between text-sm py-1 border-b border-gray-200 mb-2">
                  <span className="text-gray-700 font-medium">Base Price</span>
                  <span className="font-bold text-gray-900">₹{formatPrice(pickup.price_breakdown.base_price)}</span>
                </div>
              )}
              {pickup.price_breakdown.deductions && Object.keys(pickup.price_breakdown.deductions).length > 0 && (
                <div className="space-y-1">
                  {Object.entries(pickup.price_breakdown.deductions).map(([key, val]) => (
                    <div key={key} className="flex justify-between text-xs py-0.5">
                      <span className="text-gray-600 truncate max-w-[60%]">{key}</span>
                      <span className="font-semibold text-red-600">-₹{formatPrice(Math.abs(typeof val === 'number' ? val : parseInt(String(val).replace(/[^\d-]/g, '')) || 0))}</span>
                    </div>
                  ))}
                </div>
              )}
              {pickup.price_breakdown.bonuses && Object.keys(pickup.price_breakdown.bonuses).length > 0 && (
                <div className="space-y-1 mt-2">
                  {Object.entries(pickup.price_breakdown.bonuses).map(([key, val]) => (
                    <div key={key} className="flex justify-between text-xs py-0.5">
                      <span className="text-gray-600 truncate max-w-[60%]">{key}</span>
                      <span className="font-semibold text-green-600">+₹{formatPrice(Math.abs(typeof val === 'number' ? val : parseInt(String(val).replace(/[^\d-]/g, '')) || 0))}</span>
                    </div>
                  ))}
                </div>
              )}
              {pickup.price_breakdown.final_price > 0 && (
                <div className="flex justify-between text-sm py-1 border-t border-gray-300 mt-2">
                  <span className="text-gray-700 font-bold">Final</span>
                  <span className="font-bold text-green-600">₹{formatPrice(pickup.price_breakdown.final_price)}</span>
                </div>
              )}
            </div>
          )}

          {/* Schedule */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Schedule</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Scheduled Time</p>
                <p className="font-medium text-gray-900">
                  {pickup.pickup_scheduled_time
                    ? new Date(pickup.pickup_scheduled_time).toLocaleString('en-IN', {
                        weekday: 'short', day: 'numeric', month: 'short',
                        hour: '2-digit', minute: '2-digit'
                      })
                    : 'Not scheduled'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Verification Modal/Overlay */}
      {showVerification && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center overflow-y-auto py-4 sm:py-8">
          <div className="bg-gray-50 rounded-2xl w-full max-w-3xl mx-2 sm:mx-4 shadow-2xl">
            {/* Verification Header with Price Comparison */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Pickup Verification</h2>
                <button onClick={() => setShowVerification(false)} className="text-white/80 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="flex items-center justify-around">
                <div className="text-center">
                  <p className="text-white/70 text-sm">Original Quote</p>
                  <p className="text-2xl font-bold">₹{formatPrice(originalPrice)}</p>
                </div>
                <div className="bg-white/20 rounded-full p-2">
                  <ArrowLeft className="w-5 h-5 rotate-180" />
                </div>
                <div className="text-center">
                  <p className="text-white/70 text-sm">Revised Price</p>
                  <p className={`text-2xl font-bold ${revisedPrice !== originalPrice ? 'text-yellow-300' : 'text-white'}`}>₹{formatPrice(revisedPrice)}</p>
                </div>
              </div>
              <p className="text-center text-white/60 text-xs mt-2">
                {revisedPrice !== originalPrice && <span className="text-yellow-300 text-xs font-medium block mb-1">Price changed by ₹{formatPrice(Math.abs(revisedPrice - originalPrice))} {revisedPrice > originalPrice ? '↑' : '↓'}</span>}
                {pickup.device_type} - {pickup.model_name} | {specs.storage} | {specs.ram}
              </p>
            </div>

            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Price Breakdown Details - Always show when conditions changed */}
              {Object.keys(verifiedConditions).length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <h4 className="font-bold text-amber-800 text-sm mb-3 flex items-center gap-2">
                    <IndianRupee className="w-4 h-4" /> Price Calculation Breakdown
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="font-semibold text-gray-700 mb-1">Customer Reported:</p>
                      {Object.entries(priceBreakdownDetails.customerDeductions || {}).map(([k, v]) => (
                        <div key={k} className="flex justify-between py-0.5">
                          <span className="text-gray-600">{k}: {v.value}</span>
                          <span className="text-red-600 font-medium">-₹{formatPrice(v.deduction)}</span>
                        </div>
                      ))}
                      {Object.keys(priceBreakdownDetails.customerDeductions || {}).length === 0 && (
                        <p className="text-gray-400 italic">No deductions</p>
                      )}
                      <div className="border-t mt-1 pt-1 font-semibold flex justify-between">
                        <span>Total</span>
                        <span className="text-red-600">-₹{formatPrice(priceBreakdownDetails.customerTotal || 0)}</span>
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-700 mb-1">Agent Verified:</p>
                      {Object.entries(priceBreakdownDetails.agentDeductions || {}).map(([k, v]) => (
                        <div key={k} className="flex justify-between py-0.5">
                          <span className="text-gray-600">{k}: {v.value}</span>
                          <span className="text-red-600 font-medium">-₹{formatPrice(v.deduction)}</span>
                        </div>
                      ))}
                      {Object.keys(priceBreakdownDetails.agentDeductions || {}).length === 0 && (
                        <p className="text-gray-400 italic">No deductions</p>
                      )}
                      <div className="border-t mt-1 pt-1 font-semibold flex justify-between">
                        <span>Total</span>
                        <span className="text-red-600">-₹{formatPrice(priceBreakdownDetails.agentTotal || 0)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-amber-300 text-sm space-y-1">
                    <div className="flex justify-between"><span className="text-gray-700">Base Price (Model):</span><span className="font-bold">₹{formatPrice(priceBreakdownDetails.basePrice || 0)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-700">Agent Deductions:</span><span className="font-bold text-red-600">-₹{formatPrice(priceBreakdownDetails.agentTotal || 0)}</span></div>
                    <div className="flex justify-between pt-1 border-t border-amber-300"><span className="font-bold text-gray-900">Final Price:</span><span className="font-bold text-green-600">₹{formatPrice(revisedPrice)}</span></div>
                  </div>
                </div>
              )}

              {/* Info Card */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">Verify each condition carefully</p>
                  <p>Compare the actual device condition with customer's reported answers. Mark any differences — this helps ensure fair pricing.</p>
                </div>
              </div>

              {/* Condition Verification Sections */}
              <div className="space-y-4">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-indigo-600" /> Condition Verification
                </h3>

                {Object.entries(CONDITION_OPTIONS).map(([key, options]) => {
                  // Skip keyboard/trackpad for iPad
                  if (!isMac && (key === 'keyboard_condition' || key === 'trackpad_condition')) return null

                  const customerValue = conditions[key]
                  const agentValue = verifiedConditions[key]
                  const changed = isConditionChanged(key)

                  const isDeductionHigher = getDeductionForCondition(key, agentValue) > getDeductionForCondition(key, customerValue)

                  return (
                    <div key={key} className="bg-white rounded-xl border border-gray-200 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <label className="font-semibold text-gray-800 text-sm">{CONDITION_LABELS[key]}</label>
                        {changed && (
                          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Changed</span>
                        )}
                      </div>
                      {customerValue && (
                        <p className="text-xs text-gray-500 mb-2">Customer reported: <span className="font-medium text-gray-700">{customerValue}</span>
                          <span className="text-red-500 ml-1">(-₹{formatPrice(getDeductionForCondition(key, customerValue))})</span>
                        </p>
                      )}
                      {agentValue && (
                        <p className="text-xs text-green-600 mb-2">Agent verified: <span className="font-medium">{agentValue}</span>
                          <span className="ml-1">(-₹{formatPrice(getDeductionForCondition(key, agentValue))})</span>
                        </p>
                      )}
                      <select
                        value={agentValue || ''}
                        onChange={(e) => handleConditionChange(key, e.target.value)}
                        className={`w-full border rounded-lg px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                          changed ? 'border-amber-400 bg-amber-50' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Select condition</option>
                        {options.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>

                      {isDeductionHigher && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-lg space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-red-700 flex items-center gap-1">
                              <Camera className="w-3.5 h-3.5" /> Defect Photo Proof Required
                            </span>
                            {defectPhotos[key] && (
                              <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">Uploaded</span>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              id={`defect-photo-${key}`}
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0]
                                if (file) {
                                  setActionLoading(`upload-${key}`)
                                  try {
                                    const url = await uploadVerificationPhoto(file, pickup.id)
                                    if (url) {
                                      setDefectPhotos(prev => ({ ...prev, [key]: url }))
                                    }
                                  } catch (err) {
                                    console.error(err)
                                  }
                                  setActionLoading(null)
                                }
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => document.getElementById(`defect-photo-${key}`)?.click()}
                              disabled={actionLoading === `upload-${key}`}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors font-medium text-xs disabled:opacity-50"
                            >
                              {actionLoading === `upload-${key}` ? (
                                <div className="w-3.5 h-3.5 border-2 border-red-700 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Camera className="w-3.5 h-3.5" />
                              )}
                              {actionLoading === `upload-${key}` ? 'Uploading...' : defectPhotos[key] ? 'Change Photo' : 'Upload Proof'}
                            </button>
                            {defectPhotos[key] && (
                              <div className="relative w-12 h-12 rounded border overflow-hidden">
                                <img src={defectPhotos[key]} alt="Defect proof" className="w-full h-full object-cover" />
                                <button
                                  type="button"
                                  onClick={() => setDefectPhotos(prev => {
                                    const copy = { ...prev }
                                    delete copy[key]
                                    return copy
                                  })}
                                  className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-0.5"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}

                {/* Accessories toggles */}
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <label className="font-semibold text-gray-800 text-sm block mb-3">Accessories</label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={verifiedConditions.charger_available ?? conditions.charger_available ?? false}
                        onChange={(e) => handleConditionChange('charger_available', e.target.checked)}
                        className="w-4 h-4 text-indigo-600 rounded"
                      />
                      <span className="text-sm text-gray-700">Charger Included</span>
                      {conditions.charger_available !== undefined && (verifiedConditions.charger_available ?? false) !== (conditions.charger_available ?? false) && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">Changed</span>
                      )}
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={verifiedConditions.box_available ?? conditions.box_available ?? false}
                        onChange={(e) => handleConditionChange('box_available', e.target.checked)}
                        className="w-4 h-4 text-indigo-600 rounded"
                      />
                      <span className="text-sm text-gray-700">Box Included</span>
                      {conditions.box_available !== undefined && (verifiedConditions.box_available ?? false) !== (conditions.box_available ?? false) && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">Changed</span>
                      )}
                    </label>
                  </div>
                </div>
              </div>

              {/* Verification Photos */}
              <div className="space-y-3">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Camera className="w-5 h-5 text-indigo-600" /> Verification Photos
                </h3>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <p className="text-sm text-gray-600 mb-3">Take photos of the device as evidence of its current condition.</p>
                  <input ref={verPhotoRef} type="file" accept="image/*" capture="environment" onChange={handleVerificationPhotoUpload} className="hidden" />
                  <button
                    onClick={() => verPhotoRef.current?.click()}
                    disabled={photoUploading}
                    className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors font-medium text-sm disabled:opacity-50"
                  >
                    {photoUploading ? (
                      <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4" />
                    )}
                    {photoUploading ? 'Uploading...' : 'Add Photo'}
                  </button>
                  {verificationPhotos.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
                      {verificationPhotos.map((url, i) => (
                        <div key={i} className="relative">
                          <img src={url} alt={`Verification ${i + 1}`} className="w-full aspect-square object-cover rounded-lg border" />
                          <button
                            onClick={() => setVerificationPhotos(prev => prev.filter((_, idx) => idx !== i))}
                            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Information */}
              <div className="space-y-3">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-indigo-600" /> Payment Information
                </h3>
                <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Customer UPI ID</label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="e.g. customer@upi"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Payment Barcode/QR Photo (Optional)</label>
                    <input ref={barcodeRef} type="file" accept="image/*" capture="environment" onChange={handleBarcodeUpload} className="hidden" />
                    <button
                      onClick={() => barcodeRef.current?.click()}
                      disabled={photoUploading}
                      className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium text-sm border border-gray-300 disabled:opacity-50"
                    >
                      <FileText className="w-4 h-4" />
                      {paymentBarcodeUrl ? 'Change Barcode Photo' : 'Upload Barcode Photo'}
                    </button>
                    {paymentBarcodeUrl && (
                      <img src={paymentBarcodeUrl} alt="Barcode" className="mt-2 w-32 h-32 object-contain rounded-lg border" />
                    )}
                  </div>
                </div>
              </div>

              {/* Agent Notes */}
              <div className="space-y-3">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" /> Agent Notes
                </h3>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <textarea
                    value={agentNotes}
                    onChange={(e) => setAgentNotes(e.target.value)}
                    placeholder="Any additional observations about the device or pickup..."
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                  />
                </div>
              </div>

              {/* Secure Data Wipe Certification */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <Shield className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-gray-900 text-sm">Secure Data Wipe Certification</h3>
                </div>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dataWipeConfirmed}
                    onChange={(e) => setDataWipeConfirmed(e.target.checked)}
                    className="w-5 h-5 text-indigo-600 rounded mt-0.5"
                  />
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">Perform Secure Data Erasure</p>
                    <p className="text-xs text-gray-500 mt-0.5">Check this if you have executed (or will immediately execute) a secure factory data wipe on this device. This generates a Data Wipe Certificate for the customer.</p>
                  </div>
                </label>

                {dataWipeConfirmed && (
                  <div className="space-y-3 pt-2 bg-indigo-50/50 p-3 rounded-lg border border-indigo-100 animate-fadeIn">
                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1">Device Serial Number <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        value={deviceSerial}
                        onChange={(e) => setDeviceSerial(e.target.value)}
                        placeholder="e.g. C02F1234XL56 (check settings > general > about)"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1">Wipe Method <span className="text-red-500">*</span></label>
                      <select
                        value={wipeMethod}
                        onChange={(e) => setWipeMethod(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="factory_reset">Factory Reset (Erase All Content and Settings)</option>
                        <option value="disk_utility_erase">Disk Utility Erase (Recovery Mode Format)</option>
                        <option value="dfu_restore">Apple Configurator / DFU Restore</option>
                        <option value="manual">Manual Sign-out & App Erase</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1">Wipe Notes</label>
                      <input
                        type="text"
                        value={dataWipeNotes}
                        onChange={(e) => setDataWipeNotes(e.target.value)}
                        placeholder="e.g. Completed iCloud sign-out. Erased all settings."
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Bait-and-Switch Prevention System Alert */}
              {revisedPrice < originalPrice * 0.85 && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex gap-3 animate-pulse">
                  <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
                  <div className="text-xs text-rose-800 space-y-1">
                    <p className="font-bold">⚠️ Significant Offer Deduction (&gt;15% Drop)</p>
                    <p>The revised offer of <strong>₹{formatPrice(revisedPrice)}</strong> is more than 15% below the initial quote (<strong>₹{formatPrice(originalPrice)}</strong>).</p>
                    <p className="font-semibold text-rose-900 mt-1">Requirements for completion:</p>
                    <ul className="list-disc pl-4 space-y-0.5 font-medium">
                      <li className={verificationPhotos.length > 0 ? "text-green-700" : "text-rose-700 font-bold"}>
                        {verificationPhotos.length > 0 ? "✓ Uploaded defect photo proof" : "✗ Upload at least one verification photo as defect evidence"}
                      </li>
                      <li className={agentNotes?.trim().length >= 10 ? "text-green-700" : "text-rose-700 font-bold"}>
                        {agentNotes?.trim().length >= 10 ? "✓ Provided inspection explanation" : "✗ Write detailed explanation of defects in notes (min 10 chars)"}
                      </li>
                    </ul>
                    <p className="text-rose-700 mt-1">If the customer rejects this revised offer, they can select "Decline & Return Device" to receive the device back at no cost.</p>
                  </div>
                </div>
              )}

              {/* Customer Consent */}
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={customerConsent}
                    onChange={(e) => setCustomerConsent(e.target.checked)}
                    className="w-5 h-5 text-indigo-600 rounded mt-0.5"
                  />
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">Customer Consent</p>
                    <p className="text-xs text-gray-500 mt-0.5">I confirm that the customer has agreed to the verified conditions and the revised price, and has handed over the device voluntarily.</p>
                  </div>
                </label>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleVerificationSubmit}
                disabled={!customerConsent || actionLoading === 'verification'}
                className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg shadow-lg"
              >
                {actionLoading === 'verification' ? (
                  <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Check className="w-6 h-6" />
                    Submit Verification & Complete Pickup
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Message Popup */}
      {showWAPopup && (
        <div className="fixed inset-0 bg-black/50 z-[90] flex items-center justify-center p-4" onClick={() => setShowWAPopup(false)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 text-green-600 fill-current">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
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
              <button onClick={sendWAMessage} className="flex-1 py-2.5 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 flex items-center justify-center gap-1.5">
                <Check className="w-4 h-4" /> Send via WhatsApp
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
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-medium text-gray-900 text-sm">{value || '-'}</p>
    </div>
  )
}
