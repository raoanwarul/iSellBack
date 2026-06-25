import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import {
  Laptop, Tablet, ArrowRight, ArrowLeft, Check, Camera, Upload,
  Monitor, Smartphone, Battery, Keyboard, Mouse, Usb, Speaker,
  Video, Wifi, Package, ShieldCheck, ChevronDown, X, IndianRupee, Phone as PhoneIcon,
  CheckCircle2, AlertCircle, Info, Minus, Plus, Star, Image,
  Navigation, MapPin, Clock
} from 'lucide-react'

const STEPS = [
  'Device Type',
  'Select Model',
  'Specs & Condition',
  'Price Estimate',
  'Photos',
  'Personal Info',
  'Select Store',
  'Review & Submit',
]

export default function SellDevice() {
  const navigate = useNavigate()
  const store = useStore()
  const {
    sellStep, selectedDeviceType, selectedModel, selectedModelBasePrice,
    specs, conditionAnswers, photos, conditionPhotos, estimatedPrice, priceBreakdown,
    personalInfo, priceEngineModels, deductionsByCategory, isLoading,
    selectedBusinessId, localBusinesses, localBusinessesLoading,
    setSellStep, setDeviceType, setModel, setSpecs, setConditionAnswers,
    setPhotos, setConditionPhotos, setPersonalInfo, calculatePrice,
    uploadPhoto, uploadConditionPhoto, submitSellRequest, resetSellFlow,
    fetchPriceEngine, fetchConditionDeductions,
    setSelectedBusinessId, fetchLocalBusinesses,
  } = store

  useEffect(() => {
    fetchPriceEngine()
    fetchConditionDeductions()
  }, [])

  const goNext = () => setSellStep(Math.min(sellStep + 1, 7))
  const goBack = () => {
    if (sellStep === 0) navigate('/')
    else setSellStep(sellStep - 1)
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-bold text-gray-900">Sell Your Device</h1>
          <span className="text-sm text-gray-500">Step {sellStep + 1} of {STEPS.length}</span>
        </div>
        <div className="flex gap-1">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${
              i <= sellStep ? 'bg-primary-500' : 'bg-gray-200'
            }`} />
          ))}
        </div>
        <p className="text-sm text-gray-500 mt-2">{STEPS[sellStep]}</p>
      </div>

      {/* Step Content */}
      <div className="card p-6">
        {sellStep === 0 && <StepDeviceType setDeviceType={setDeviceType} />}
        {sellStep === 1 && (
          <StepModelSelect
            deviceType={selectedDeviceType}
            models={priceEngineModels.filter(m => m.device_type === selectedDeviceType)}
            onSelect={setModel}
          />
        )}
        {sellStep === 2 && (
          <StepQuestionnaire
            deviceType={selectedDeviceType}
            specs={specs}
            setSpecs={setSpecs}
            conditions={conditionAnswers}
            setConditions={setConditionAnswers}
            deductionsByCategory={deductionsByCategory}
            conditionPhotos={conditionPhotos}
            setConditionPhotos={setConditionPhotos}
            uploadConditionPhoto={uploadConditionPhoto}
            calculatePrice={calculatePrice}
            goNext={goNext}
          />
        )}
        {sellStep === 3 && (
          <StepPricing
            basePrice={selectedModelBasePrice}
            estimatedPrice={estimatedPrice}
            breakdown={priceBreakdown}
            calculatePrice={calculatePrice}
            modelName={selectedModel}
            deviceType={selectedDeviceType}
          />
        )}
        {sellStep === 4 && (
          <StepPhotos
            photos={photos}
            setPhotos={setPhotos}
            uploadPhoto={uploadPhoto}
            goNext={goNext}
          />
        )}
        {sellStep === 5 && (
          <StepPersonalInfo
            info={personalInfo}
            setInfo={setPersonalInfo}
            deliveryMethod={store.deliveryMethod}
            setDeliveryMethod={store.setDeliveryMethod}
            userLocation={store.userLocation}
            setUserLocation={store.setUserLocation}
            idProofType={store.idProofType}
            idProofUrl={store.idProofUrl}
            setIdProof={store.setIdProof}
            uploadIdProof={store.uploadIdProof}
          />
        )}
        {sellStep === 6 && (
          <StepSelectStore
            pincode={personalInfo.pincode}
            city={personalInfo.city}
            selectedBusinessId={selectedBusinessId}
            setSelectedBusinessId={setSelectedBusinessId}
            localBusinesses={localBusinesses}
            localBusinessesLoading={localBusinessesLoading}
            fetchLocalBusinesses={fetchLocalBusinesses}
            deliveryMethod={store.deliveryMethod}
            pickupScheduledTime={store.pickupScheduledTime}
            setPickupScheduledTime={store.setPickupScheduledTime}
            goNext={goNext}
          />
        )}
        {sellStep === 7 && (
          <StepReview
            store={store}
            onSubmit={async () => {
              const result = await submitSellRequest()
              if (result.success) {
                navigate('/dashboard/requests')
              } else {
                alert(result.message)
              }
            }}
            isLoading={isLoading}
          />
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-6">
        <button
          onClick={goBack}
          className="flex items-center gap-2 px-5 py-2.5 text-gray-600 hover:text-gray-900 font-medium rounded-xl hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        {sellStep < 7 && sellStep !== 0 && sellStep !== 1 && (
          <button
            onClick={() => {
              if (sellStep === 3) calculatePrice()
              // Validate questionnaire fields before proceeding from Specs & Condition step
              if (sellStep === 2) {
                // HARD GATE: Cannot proceed if device doesn't turn on
                if (conditionAnswers.deviceTurnsOn === false) {
                  alert("We can't accept devices that don't turn on. Please visit our store or contact support.")
                  return
                }
                // HARD GATE: Cannot proceed if device is not repairable
                if (conditionAnswers.isRepairable === false) {
                  alert("We can't accept devices that have been repaired before. Please visit our store or contact support.")
                  return
                }
                const missing = []
                if (!specs.storage) missing.push('Storage')
                if (!specs.ram) missing.push('RAM')
                if (!specs.batteryHealth) missing.push('Battery Health')
                if (!conditionAnswers.screenCondition) missing.push('Screen Condition')
                if (!conditionAnswers.bodyCondition) missing.push('Body Condition')
                if (!conditionAnswers.speakersCondition) missing.push('Speakers')
                if (!conditionAnswers.cameraCondition) missing.push('Camera')
                if (!conditionAnswers.wifiBluetoothCondition) missing.push('WiFi/Bluetooth')
                if (selectedDeviceType === 'MacBook') {
                  if (!conditionAnswers.keyboardCondition) missing.push('Keyboard')
                  if (!conditionAnswers.trackpadCondition) missing.push('Trackpad')
                  if (!conditionAnswers.portsCondition) missing.push('Ports')
                }
                if (missing.length > 0) {
                  alert(`Please select all required fields:\n\n${missing.join('\n')}`)
                  return
                }
              }
              // Validate address fields before proceeding from Personal Info step
              if (sellStep === 5) {
                const missing = []
                if (!personalInfo.fullName?.trim()) missing.push('Full Name')
                if (!personalInfo.email?.trim()) missing.push('Email')
                if (!personalInfo.phone?.trim()) missing.push('Phone Number')
                if (store.deliveryMethod === 'pickup') {
                  if (!personalInfo.address?.trim()) missing.push('Full Address')
                  if (!personalInfo.city?.trim()) missing.push('City')
                  if (!personalInfo.state?.trim()) missing.push('State')
                  if (!personalInfo.pincode?.trim()) missing.push('Pincode')
                }
                if (missing.length > 0) {
                  alert(`Please fill in all required fields:\n\n${missing.join('\n')}`)
                  return
                }
              }
              // Validate store and booking selection
              if (sellStep === 6) {
                if (!selectedBusinessId) {
                  alert('Please select a store to proceed.')
                  return
                }
                if (!store.pickupScheduledTime) {
                  alert('Please select a booking date and time slot.')
                  return
                }
              }
              goNext()
            }}
            className="flex items-center gap-2 px-6 py-2.5 gradient-bg text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
          >
            {sellStep === 3 ? 'Continue' : 'Next'} <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}

// ============ STEP 0: DEVICE TYPE ============
function StepDeviceType({ setDeviceType }) {
  return (
    <div>
      <h2 className="text-lg font-bold text-gray-900 mb-2">What device do you want to sell?</h2>
      <p className="text-sm text-gray-500 mb-6">Choose your Apple device type</p>
      <div className="grid md:grid-cols-2 gap-4">
        <button
          onClick={() => setDeviceType('MacBook')}
          className="group p-6 rounded-xl border-2 border-gray-200 hover:border-primary-500 hover:shadow-lg transition-all text-left"
        >
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mb-4">
            <Laptop className="w-7 h-7 text-white" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">MacBook</h3>
          <p className="text-sm text-gray-500">MacBook Air, MacBook Pro & more</p>
          <div className="flex items-center gap-1 mt-3 text-primary-600 font-medium text-sm opacity-0 group-hover:opacity-100 transition-opacity">
            Select <ArrowRight className="w-4 h-4" />
          </div>
        </button>
        <button
          onClick={() => setDeviceType('iPad')}
          className="group p-6 rounded-xl border-2 border-gray-200 hover:border-emerald-500 hover:shadow-lg transition-all text-left"
        >
          <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center mb-4">
            <Tablet className="w-7 h-7 text-white" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">iPad</h3>
          <p className="text-sm text-gray-500">iPad Air, iPad Pro, iPad Mini & more</p>
          <div className="flex items-center gap-1 mt-3 text-emerald-600 font-medium text-sm opacity-0 group-hover:opacity-100 transition-opacity">
            Select <ArrowRight className="w-4 h-4" />
          </div>
        </button>
      </div>
    </div>
  )
}

// ============ STEP 1: MODEL SELECT ============
function StepModelSelect({ deviceType, models, onSelect }) {
  const [search, setSearch] = useState('')
  const isMac = deviceType === 'MacBook'
  const filtered = models.filter(m =>
    m.model_name.toLowerCase().includes(search.toLowerCase())
  )

  const formatPrice = (p) => p.toLocaleString('en-IN')

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Select Your {deviceType} Model</h2>
      <p className="text-sm text-gray-500 mb-5">Choose your exact model for accurate pricing</p>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search models..."
        className="w-full px-4 py-3 border border-gray-300 rounded-xl mb-5 outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
      />
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Monitor className="w-14 h-14 mx-auto mb-4 opacity-50" />
            <p className="text-base">No models found</p>
          </div>
        ) : (
          filtered.map((model) => (
            <button
              key={model.id}
              onClick={() => onSelect(model)}
              className="w-full flex items-center gap-4 p-5 rounded-xl border border-gray-200 hover:border-primary-400 hover:shadow-md transition-all text-left group"
            >
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                isMac ? 'bg-indigo-100' : 'bg-emerald-100'
              }`}>
                {isMac
                  ? <Laptop className="w-7 h-7 text-indigo-600" />
                  : <Tablet className="w-7 h-7 text-emerald-600" />
                }
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{model.model_name}</p>
                <span className="inline-block mt-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                  Up to ₹{formatPrice(model.base_price)}
                </span>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-primary-500 transition-colors" />
            </button>
          ))
        )}
      </div>
    </div>
  )
}

// ============ STEP 2: QUESTIONNAIRE ============
function StepQuestionnaire({ deviceType, specs, setSpecs, conditions, setConditions, deductionsByCategory, conditionPhotos, setConditionPhotos, uploadConditionPhoto, calculatePrice, goNext }) {
  const isMac = deviceType === 'MacBook'
  const [uploading, setUploading] = useState(false)
  const condFileRefs = useRef({})

  const conditionSlots = [
    { key: 'screen', label: 'Screen Condition' },
    { key: 'body', label: 'Body Condition' },
  ]

  const handleConditionPhoto = async (key, file) => {
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadConditionPhoto(file, key)
      if (url) setConditionPhotos({ [key]: url })
    } catch (e) { console.error(e) }
    setUploading(false)
  }

  const storageOptions = isMac
    ? ['256GB', '512GB', '1TB', '2TB']
    : ['64GB', '128GB', '256GB', '512GB', '1TB']

  const ramOptions = isMac ? ['8GB', '16GB', '32GB', '36GB', '48GB', '64GB'] : ['4GB', '8GB', '16GB']

  const batteryOptions = ['90-100%', '80-89%', '70-79%', 'Below 70%']

  const screenOptions = ['Perfect (No scratches)', 'Minor scratches', 'Visible scratches', 'Cracked/Broken']
  const bodyOptions = ['Like new', 'Minor dents/scratches', 'Visible dents', 'Major damage']
  const workingOptions = ['Working perfectly', 'Some keys not working', 'Not working']
  const trackpadOptions = ['Working perfectly', 'Click issues', 'Not working']
  const simpleWorkingOptions = ['Working', 'Not working']

  const warrantyOptions = (deductionsByCategory['Warranty'] || []).map(r => r.condition_name)

  // iPad-only keywords - hide these for MacBook (matching Android logic)
  const iPadOnlyKeywords = ['apple pencil', 'smart keyboard']

  const accessoryOptions = (deductionsByCategory['Accessories'] || [])
    .filter(r => (r.value ?? r.deduction_amount ?? 0) < 0)
    .filter(r => !['Box included', 'Charger included', 'Original Box included', 'Original Charger included', 'No charger', 'No box'].includes(r.condition_name))
    .filter(r => {
      if (isMac) {
        const name = r.condition_name.toLowerCase()
        return !iPadOnlyKeywords.some(kw => name.includes(kw))
      }
      return true
    })
    .map(r => r.condition_name)

  // GATE: if device doesn't turn on OR is not repairable, show rejection and hide the form
  const turnsOnRejected = conditions.deviceTurnsOn === false
  const repairRejected = conditions.isRepairable === false
  if (turnsOnRejected || repairRejected) {
    const reasonText = turnsOnRejected
      ? 'Sorry, we only accept devices that power on and boot successfully. If your device does not turn on, we cannot proceed with the buyback.'
      : "Sorry, we don't accept devices that have been repaired or opened before. We can only proceed with devices that have never been repaired."
    return (
      <div className="space-y-6">
        <h2 className="text-lg font-bold text-gray-900">Device Details & Condition</h2>

        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Basic Checks</h3>
          <div className="grid md:grid-cols-2 gap-3">
            <ToggleField
              label="Does your device turn on?"
              value={conditions.deviceTurnsOn}
              onChange={(v) => setConditions({ deviceTurnsOn: v })}
            />
            <ToggleField
              label="Has your device never been repaired?"
              value={conditions.isRepairable ?? true}
              onChange={(v) => setConditions({ isRepairable: v })}
            />
          </div>
        </div>

        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <X className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-red-700 text-lg mb-1">We can't accept this product</h3>
              <p className="text-sm text-red-800 mb-3">{reasonText}</p>
              <div className="bg-white rounded-lg p-3 flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-gray-700">
                  If this was selected by mistake, switch it back only if your device has never been repaired. For help, contact support at +91 8595611340.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-gray-900">Device Details & Condition</h2>

      {/* Basic Checks */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Basic Checks</h3>
        <div className="grid md:grid-cols-2 gap-3">
          <ToggleField
            label="Does your device turn on?"
            value={conditions.deviceTurnsOn}
            onChange={(v) => setConditions({ deviceTurnsOn: v })}
          />
          <ToggleField
            label="Has your device never been repaired?"
            value={conditions.isRepairable ?? true}
            onChange={(v) => {
              setConditions({ isRepairable: v })
              if (v) setConditions({ repairIssues: [] })
            }}
          />
          <ToggleField label="Screen is original?" value={conditions.screenOriginal}
            onChange={(v) => setConditions({ screenOriginal: v })} />
          <ToggleField label="Charger available?" value={conditions.chargerAvailable}
            onChange={(v) => setConditions({ chargerAvailable: v })} />
          <ToggleField label="Box available?" value={conditions.boxAvailable}
            onChange={(v) => setConditions({ boxAvailable: v })} />
        </div>
      </div>

      <hr className="border-gray-200" />

      {/* Specs */}
      <div className="grid md:grid-cols-2 gap-4">
        <SelectField label="Storage" value={specs.storage} options={storageOptions}
          onChange={(v) => setSpecs({ ...specs, storage: v })} />
        <SelectField label="RAM" value={specs.ram} options={ramOptions}
          onChange={(v) => setSpecs({ ...specs, ram: v })} />
        <SelectField label="Battery Health" value={specs.batteryHealth} options={batteryOptions}
          onChange={(v) => setSpecs({ ...specs, batteryHealth: v })} />
        {isMac && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cycle Count</label>
            <input
              type="number"
              value={specs.cycleCount}
              onChange={(e) => setSpecs({ ...specs, cycleCount: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="e.g. 250"
            />
          </div>
        )}
      </div>

      <hr className="border-gray-200" />


      {/* Detailed conditions */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Detailed Condition</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <SelectField label="Screen Condition" value={conditions.screenCondition} options={screenOptions}
            onChange={(v) => setConditions({ screenCondition: v })} />
          <SelectField label="Body Condition" value={conditions.bodyCondition} options={bodyOptions}
            onChange={(v) => setConditions({ bodyCondition: v })} />
          {isMac && (
            <>
              <SelectField label="Keyboard" value={conditions.keyboardCondition} options={workingOptions}
                onChange={(v) => setConditions({ keyboardCondition: v })} />
              <SelectField label="Trackpad" value={conditions.trackpadCondition} options={trackpadOptions}
                onChange={(v) => setConditions({ trackpadCondition: v })} />
              <SelectField label="Ports" value={conditions.portsCondition}
                options={['All working', 'Some not working', 'Most not working']}
                onChange={(v) => setConditions({ portsCondition: v })} />
            </>
          )}
          <SelectField label="Speakers" value={conditions.speakersCondition}
            options={['Working', 'Distorted sound', 'Not working']}
            onChange={(v) => setConditions({ speakersCondition: v })} />
          <SelectField label="Camera" value={conditions.cameraCondition} options={simpleWorkingOptions}
            onChange={(v) => setConditions({ cameraCondition: v })} />
          <SelectField label="WiFi/Bluetooth" value={conditions.wifiBluetoothCondition} options={simpleWorkingOptions}
            onChange={(v) => setConditions({ wifiBluetoothCondition: v })} />
        </div>
      </div>

      {/* Warranty */}
      {warrantyOptions.length > 0 && (
        <>
          <hr className="border-gray-200" />
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Warranty Status</h3>
            <SelectField label="Warranty" value={conditions.warrantyStatus} options={warrantyOptions}
              onChange={(v) => setConditions({ warrantyStatus: v })} />
          </div>
        </>
      )}

      {/* Accessories */}
      {accessoryOptions.length > 0 && (
        <>
          <hr className="border-gray-200" />
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Additional Accessories (Bonus)</h3>
            <div className="grid md:grid-cols-2 gap-2">
              {accessoryOptions.map(acc => (
                <label key={acc} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={conditions.selectedAccessories?.includes(acc)}
                    onChange={(e) => {
                      const current = conditions.selectedAccessories || []
                      const updated = e.target.checked
                        ? [...current, acc]
                        : current.filter(a => a !== acc)
                      setConditions({ selectedAccessories: updated })
                    }}
                    className="w-4 h-4 text-primary-600 rounded"
                  />
                  <span className="text-sm text-gray-700">{acc.replace(' included', '')}</span>
                </label>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Condition Proof Photos - matching Flutter questionnaire_screen */}
      <hr className="border-gray-200" />
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Condition Photos</h3>
        <p className="text-sm text-gray-500 mb-3">Take photos of screen and body condition for verification</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {conditionSlots.map((slot) => {
            const photoUrl = conditionPhotos?.[slot.key]
            return (
              <div key={slot.key} className="relative">
                <input
                  type="file"
                  accept="image/*"
                  ref={el => condFileRefs.current[slot.key] = el}
                  onChange={(e) => handleConditionPhoto(slot.key, e.target.files[0])}
                  className="hidden"
                />
                <button
                  onClick={() => condFileRefs.current[slot.key]?.click()}
                  disabled={uploading}
                  className={`w-full h-32 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all ${
                    photoUrl ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-primary-400'
                  }`}
                >
                  {photoUrl ? (
                    <img src={photoUrl} alt={slot.label} className="w-full h-full object-cover rounded-lg" />
                  ) : uploading ? (
                    <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Image className="w-6 h-6 text-gray-400" />
                      <span className="text-xs text-gray-500">{slot.label}</span>
                    </>
                  )}
                </button>
                {photoUrl && (
                  <div className="absolute top-1 right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <button
        onClick={() => { calculatePrice(); goNext() }}
        className="w-full py-3 gradient-bg text-white font-semibold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
      >
        Get Price Estimate <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  )
}

// ============ STEP 4: PHOTOS (Device Photos Only) ============
function StepPhotos({ photos, setPhotos, uploadPhoto, goNext }) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({})
  const fileInputRefs = useRef({})

  const photoSlots = [
    { key: 'front', label: 'Front View', icon: Monitor },
    { key: 'back', label: 'Back View', icon: Smartphone },
    { key: 'screen_on', label: 'Screen On', icon: Monitor },
    { key: 'about', label: 'About Page', icon: Info },
  ]

  const handleFileSelect = async (key, file) => {
    if (!file) return
    setUploading(true)
    setUploadProgress(p => ({ ...p, [key]: 'uploading' }))

    try {
      const url = await uploadPhoto(file, `device_${Date.now()}`)
      if (url) {
        const idx = photoSlots.findIndex(s => s.key === key)
        const newPhotos = [...photos]
        newPhotos[idx] = url
        setPhotos(newPhotos.filter(Boolean))
      }
      setUploadProgress(p => ({ ...p, [key]: url ? 'done' : 'error' }))
    } catch {
      setUploadProgress(p => ({ ...p, [key]: 'error' }))
    }
    setUploading(false)
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-gray-900">Upload Device Photos</h2>
      <p className="text-sm text-gray-500">Take clear photos of your device for accurate assessment</p>

      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Device Photos (Required)</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {photoSlots.map((slot) => {
            const idx = photoSlots.findIndex(s => s.key === slot.key)
            const photoUrl = photos[idx]
            const status = uploadProgress[slot.key]

            return (
              <div key={slot.key} className="relative">
                <input
                  type="file"
                  accept="image/*"
                  ref={el => fileInputRefs.current[slot.key] = el}
                  onChange={(e) => handleFileSelect(slot.key, e.target.files[0])}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRefs.current[slot.key]?.click()}
                  className={`w-full aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all ${
                    photoUrl ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-primary-400 hover:bg-primary-50'
                  }`}
                >
                  {photoUrl ? (
                    <img src={photoUrl} alt={slot.label} className="w-full h-full object-cover rounded-lg" />
                  ) : status === 'uploading' ? (
                    <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Camera className="w-6 h-6 text-gray-400" />
                      <span className="text-xs text-gray-500 text-center px-1">{slot.label}</span>
                    </>
                  )}
                </button>
                {photoUrl && (
                  <div className="absolute top-1 right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <button
        onClick={goNext}
        className="w-full py-3 gradient-bg text-white font-semibold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
      >
        Continue <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  )
}

// ============ STEP 4: PRICING ============
// Customer-facing: we show ONLY the names of factors that affected the price —
// never the individual ₹ deduction/bonus amounts. The only ₹ value shown is
// the final Estimated Value / Final Estimate.
function StepPricing({ basePrice: _basePrice, estimatedPrice, breakdown, calculatePrice, modelName, deviceType }) {
  useEffect(() => {
    calculatePrice()
  }, [])

  const formatPrice = (p) => (p || 0).toLocaleString('en-IN')

  // Partition breakdown entries into name-only lists
  const deductions = []
  const bonuses = []
  Object.entries(breakdown || {}).forEach(([key, val]) => {
    const str = String(val)
    if (str.startsWith('+')) bonuses.push(key)
    else if (str.startsWith('-')) deductions.push(key)
  })

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Your Estimated Price</h2>
        <p className="text-sm text-gray-500 mb-4">{modelName} ({deviceType})</p>
        <div className="inline-block bg-gradient-to-r from-primary-500 to-purple-600 text-white rounded-2xl p-8">
          <p className="text-sm text-white/80 mb-1">Estimated Value</p>
          <p className="text-4xl font-extrabold">₹{formatPrice(estimatedPrice)}</p>
        </div>
      </div>

      {/* Factor names only (no amounts). The final ₹ is above. */}
      {(deductions.length > 0 || bonuses.length > 0) && (
        <div className="bg-gray-50 rounded-xl p-4 space-y-4">
          {deductions.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 text-sm mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                Factors that reduced your price
              </h3>
              <ul className="space-y-1.5">
                {deductions.map((name) => (
                  <li key={name} className="flex items-center gap-2 text-sm text-gray-700">
                    <span className="w-1 h-1 rounded-full bg-red-400" />
                    {name}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {bonuses.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 text-sm mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                Factors that added to your price
              </h3>
              <ul className="space-y-1.5">
                {bonuses.map((name) => (
                  <li key={name} className="flex items-center gap-2 text-sm text-gray-700">
                    <span className="w-1 h-1 rounded-full bg-green-400" />
                    {name}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <hr className="border-gray-200" />
          <div className="flex justify-between items-center">
            <span className="font-bold text-gray-900">Final Estimate</span>
            <span className="font-bold text-primary-600 text-lg">₹{formatPrice(estimatedPrice)}</span>
          </div>
        </div>
      )}

      {/* No Surprise Guarantee — Trust Differentiator */}
      <div className="rounded-xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <h3 className="font-bold text-emerald-800 text-sm">No Surprise Guarantee</h3>
        </div>
        <ul className="space-y-2 text-sm text-emerald-900">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
            <span>Physical inspection may adjust this estimate by <strong>±10–15%</strong> based on actual device condition.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
            <span>If the final offer drops more than 15%, you can <strong>decline at no cost</strong> and keep your device.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
            <span>Every deduction requires <strong>photo proof</strong> from our agent — full transparency guaranteed.</span>
          </li>
        </ul>
      </div>

      {/* Price Range Indicator */}
      <div className="bg-gray-50 rounded-xl p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Expected Range After Inspection</p>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Minimum</span>
          <span className="font-bold text-amber-600">₹{formatPrice(Math.round(estimatedPrice * 0.85 / 100) * 100)}</span>
        </div>
        <div className="w-full h-2 rounded-full bg-gray-200 my-2 overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-amber-400 via-emerald-400 to-emerald-500" style={{ width: '85%' }} />
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Your Estimate</span>
          <span className="font-bold text-emerald-600">₹{formatPrice(estimatedPrice)}</span>
        </div>
      </div>
    </div>
  )
}

// ============ STEP 5: PERSONAL INFO ============
function StepPersonalInfo({ info, setInfo, deliveryMethod, setDeliveryMethod, userLocation, setUserLocation, idProofType, idProofUrl, setIdProof, uploadIdProof }) {
  const [detectingLocation, setDetectingLocation] = useState(false)
  const [idUploading, setIdUploading] = useState(false)
  const idFileRef = useRef(null)

  const detectLocation = async () => {
    if (!navigator.geolocation) return alert('Geolocation not supported by your browser')
    setDetectingLocation(true)
    
    // Use high accuracy GPS with fresh location (no cache)
    const geoOptions = {
      enableHighAccuracy: true,  // Use GPS if available
      timeout: 30000,            // Wait up to 30 seconds
      maximumAge: 0              // Don't use cached location - get fresh position
    }
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords
        console.log(`[Location] Got position: ${latitude}, ${longitude} (accuracy: ${accuracy}m)`)
        
        try {
          // Use Google Maps Geocoding API if available, fallback to Nominatim
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`)
          const data = await res.json()
          const addr = data.address || {}
          
          // Build a more precise address
          const houseNumber = addr.house_number || ''
          const road = addr.road || addr.street || ''
          const neighbourhood = addr.neighbourhood || addr.suburb || ''
          const city = addr.city || addr.town || addr.village || addr.county || ''
          const state = addr.state || ''
          const pincode = addr.postcode || ''
          
          // Create a cleaner address format
          let addressParts = []
          if (houseNumber) addressParts.push(houseNumber)
          if (road) addressParts.push(road)
          if (neighbourhood) addressParts.push(neighbourhood)
          if (city) addressParts.push(city)
          if (state) addressParts.push(state)
          if (pincode) addressParts.push(pincode)
          
          const fullAddress = addressParts.length > 0 ? addressParts.join(', ') : data.display_name || ''
          
          setUserLocation({ latitude, longitude, address: fullAddress, accuracy })
          setInfo({ address: fullAddress, pincode, city, state })
        } catch (e) {
          console.error('[Location] Reverse geocoding failed:', e)
          setUserLocation({ latitude, longitude, address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}` })
        }
        setDetectingLocation(false)
      },
      (err) => {
        console.error('[Location] Error:', err.code, err.message)
        let errorMsg = 'Location access denied. Please enter address manually.'
        if (err.code === 1) errorMsg = 'Location permission denied. Please allow location access and try again.'
        else if (err.code === 2) errorMsg = 'Location unavailable. Please check your GPS/network and try again.'
        else if (err.code === 3) errorMsg = 'Location request timed out. Please try again or enter address manually.'
        alert(errorMsg)
        setDetectingLocation(false)
      },
      geoOptions
    )
  }

  const handleIdUpload = async (file) => {
    if (!file) return
    setIdUploading(true)
    const url = await uploadIdProof(file)
    if (url) setIdProof(idProofType || 'Aadhaar', url)
    setIdUploading(false)
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-gray-900">Personal Information</h2>
      <p className="text-sm text-gray-500">We need your details for pickup and payment</p>

      {/* Delivery Method */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Delivery Method</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => setDeliveryMethod('pickup')}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              deliveryMethod === 'pickup' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Package className="w-6 h-6 mb-2 text-primary-600" />
            <p className="font-semibold text-gray-900 text-sm">Home Pickup</p>
            <p className="text-xs text-gray-500 mt-1">Agent will come to collect the device</p>
          </button>
          <button
            onClick={() => setDeliveryMethod('store_visit')}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              deliveryMethod === 'store_visit' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <MapPin className="w-6 h-6 mb-2 text-primary-600" />
            <p className="font-semibold text-gray-900 text-sm">Visit Store</p>
            <p className="text-xs text-gray-500 mt-1">Drop the device at our store</p>
          </button>
        </div>
      </div>

      <hr className="border-gray-200" />

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
          <input type="text" value={info.fullName} onChange={(e) => setInfo({ fullName: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Enter your full name" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
          <input type="email" value={info.email} onChange={(e) => setInfo({ email: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="your@email.com" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
          <input type="tel" value={info.phone} onChange={(e) => setInfo({ phone: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="+91 XXXXX XXXXX" />
        </div>
        {deliveryMethod === 'pickup' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pincode *</label>
            <input type="text" value={info.pincode} onChange={(e) => setInfo({ pincode: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="e.g. 110001" />
          </div>
        )}
      </div>

      {/* Store Address Card for Visit Store */}
      {deliveryMethod === 'store_visit' && (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-5">
          <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-indigo-600" /> Store Address
          </h3>
          <p className="text-sm text-gray-700 font-medium">Macintosh Enterprise</p>
          <p className="text-sm text-gray-600 mt-1">Shop No. 157, 1st Floor, The Great India Place, Sector 38A, Noida – 201301, UP, India</p>
          <div className="flex gap-3 mt-3">
            <a href="https://www.google.com/maps/search/?api=1&query=Macintosh+Enterprise+The+Great+India+Place+Noida" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-indigo-600 text-xs font-medium rounded-lg border border-indigo-200 hover:bg-indigo-50 transition-colors">
              <Navigation className="w-3.5 h-3.5" /> Open in Maps
            </a>
            <a href="tel:+918595611340"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-green-600 text-xs font-medium rounded-lg border border-green-200 hover:bg-green-50 transition-colors">
              <PhoneIcon className="w-3.5 h-3.5" /> Call Store
            </a>
          </div>
        </div>
      )}

      {/* Location & Address for Pickup */}
      {deliveryMethod === 'pickup' && (
        <>
          <button onClick={detectLocation} disabled={detectingLocation}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-primary-600 bg-primary-50 border border-primary-200 rounded-xl hover:bg-primary-100 transition-colors disabled:opacity-50">
            {detectingLocation ? (
              <><div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" /> Detecting...</>
            ) : (
              <><Navigation className="w-4 h-4" /> Detect My Location (Optional)</>
            )}
          </button>
          {userLocation && (
            <p className="text-xs text-green-600 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Location detected</p>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Address *</label>
            <textarea value={info.address} onChange={(e) => setInfo({ address: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
              rows={3} placeholder="Street address, locality..." />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
              <input type="text" value={info.city} onChange={(e) => setInfo({ city: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="City" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
              <input type="text" value={info.state} onChange={(e) => setInfo({ state: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="State" />
            </div>
          </div>
        </>
      )}

      {/* ID Proof (Optional) */}
      <hr className="border-gray-200" />
      <div>
        <h3 className="font-semibold text-gray-900 mb-1">ID Proof</h3>
        <p className="text-xs text-gray-500 mb-3">Optional now - Required at pickup</p>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ID Type</label>
            <select value={idProofType} onChange={(e) => setIdProof(e.target.value, idProofUrl)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 bg-white">
              <option value="">Select ID Type</option>
              <option value="Aadhaar">Aadhaar Card</option>
              <option value="Driving License">Driving License</option>
              <option value="Voter ID">Voter ID</option>
              <option value="Passport">Passport</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Upload ID Photo</label>
            <input type="file" accept="image/*" ref={idFileRef} onChange={(e) => handleIdUpload(e.target.files[0])} className="hidden" />
            <button onClick={() => idFileRef.current?.click()} disabled={idUploading}
              className={`w-full px-4 py-2.5 border border-dashed rounded-xl text-sm transition-colors disabled:opacity-50 ${
                idProofUrl ? 'border-green-400 text-green-600 bg-green-50' : 'border-gray-300 text-gray-500 hover:border-primary-400 hover:text-primary-600'
              }`}>
              {idUploading ? 'Uploading...' : idProofUrl ? '✓ ID Proof Uploaded' : 'Choose File'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============ STEP 6: SELECT STORE ============
function StepSelectStore({
  pincode,
  city,
  selectedBusinessId,
  setSelectedBusinessId,
  localBusinesses,
  localBusinessesLoading,
  fetchLocalBusinesses,
  deliveryMethod,
  pickupScheduledTime,
  setPickupScheduledTime,
  goNext
}) {
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedSlot, setSelectedSlot] = useState('')

  useEffect(() => {
    fetchLocalBusinesses(pincode, city)
  }, [pincode, city])

  useEffect(() => {
    if (pickupScheduledTime) {
      const parsedDate = new Date(pickupScheduledTime)
      setSelectedDate(parsedDate)
      const hour = parsedDate.getHours()
      if (hour === 10) setSelectedSlot('morning')
      else if (hour === 13) setSelectedSlot('afternoon')
      else if (hour === 16) setSelectedSlot('evening')
    }
  }, [pickupScheduledTime])

  const formatRating = (r) => (r ? Number(r).toFixed(1) : '4.8')

  const getAvailableDates = () => {
    const dates = []
    for (let i = 1; i <= 7; i++) {
      const d = new Date()
      d.setDate(d.getDate() + i)
      dates.push(d)
    }
    return dates
  }

  const handleDateSelect = (d) => {
    setSelectedDate(d)
    setSelectedSlot('')
    setPickupScheduledTime(null)
  }

  const handleSlotSelect = (slotId, range) => {
    setSelectedSlot(slotId)
    if (!selectedDate) return

    const [startHourStr] = range.split(':')
    let hour = parseInt(startHourStr)
    if (range.includes('PM') && startHourStr !== '12') {
      hour += 12
    } else if (range.includes('AM') && startHourStr === '12') {
      hour = 0
    }

    const bookingTime = new Date(selectedDate)
    bookingTime.setHours(hour, 0, 0, 0)
    setPickupScheduledTime(bookingTime.toISOString())
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Select a Local Store</h2>
        <p className="text-sm text-gray-500">
          Choose a verified local store near {pincode || 'your location'} to process your order.
        </p>
      </div>

      {localBusinessesLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-28 skeleton rounded-xl animate-pulse bg-gray-150" />
          ))}
        </div>
      ) : localBusinesses.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-center">
          <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
          <h3 className="font-bold text-amber-800 text-sm mb-1">No Direct Matches Found</h3>
          <p className="text-xs text-amber-700 max-w-md mx-auto leading-relaxed">
            {deliveryMethod === 'store_visit' ? (
              <>
                No stores are registered in pincode <strong>{pincode}</strong> for drop-off.
                Please go back and select <strong>Home Pickup</strong> so our agent can collect the device from your location.
              </>
            ) : (
              <>
                No stores are registered in pincode <strong>{pincode}</strong>.
                Don't worry! You can proceed and our system will automatically route your request to the nearest available premium partner.
              </>
            )}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {localBusinesses.map((biz) => {
            const isSelected = selectedBusinessId === biz.id
            const supportsPickup = biz.delivery_options?.agent_pickup !== false
            const supportsVisit = biz.delivery_options?.store_visit !== false

            // Skip store if delivery preference is visit but store doesn't support it
            if (deliveryMethod === 'store_visit' && !supportsVisit) return null

            return (
              <div
                key={biz.id}
                onClick={() => setSelectedBusinessId(biz.id)}
                className={`p-5 rounded-xl border-2 transition-all cursor-pointer text-left relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isSelected
                    ? 'border-primary-500 bg-primary-50/50 shadow-sm'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <h3 className="font-extrabold text-gray-900 text-base truncate">{biz.name}</h3>
                    {biz.trust_score >= 90 && (
                      <span className="badge-success text-[10px] py-0.5 px-2">Premium</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2 mb-2.5">
                    {biz.storefront_address || biz.short_description || 'Verified local partner store.'}
                  </p>
                  
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="flex items-center gap-1 text-xs text-amber-500 font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-500" />
                      {formatRating(biz.google_rating)}
                    </span>
                    <span className="text-gray-300">•</span>
                    <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" /> {biz.city || 'India'}
                    </span>
                    <span className="text-gray-300">•</span>
                    <div className="flex gap-1.5">
                      {supportsPickup && (
                        <span className="text-[10px] px-2 py-0.5 bg-cyan-100 text-cyan-700 font-bold rounded-full">
                          Pickup
                        </span>
                      )}
                      {supportsVisit && (
                        <span className="text-[10px] px-2 py-0.5 bg-indigo-100 text-indigo-700 font-bold rounded-full">
                          Visit
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex-shrink-0 flex items-center justify-end sm:justify-center">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                    isSelected ? 'border-primary-500 bg-primary-500' : 'border-gray-300'
                  }`}>
                    {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3px]" />}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Date & Time Slot Booking Section */}
      {selectedBusinessId && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mt-6 space-y-4 text-left">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
            <Clock className="w-5 h-5 text-cyan-600 animate-pulse" />
            <h3 className="font-extrabold text-gray-900 text-sm">
              {deliveryMethod === 'store_visit' ? '📅 Book Your Visit Slot' : '📦 Schedule Your Doorstep Pickup'}
            </h3>
          </div>

          <p className="text-xs text-gray-500">
            Select a preferred date and time slot. Our team will coordinate the appointment during this window.
          </p>

          {/* Date Selector */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Select Date</label>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
              {getAvailableDates().map((d) => {
                const isSelected = selectedDate?.toDateString() === d.toDateString()
                return (
                  <button
                    key={d.toDateString()}
                    type="button"
                    onClick={() => handleDateSelect(d)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border min-w-[75px] text-center transition-all ${
                      isSelected
                        ? 'border-cyan-500 bg-cyan-50/50 text-cyan-600 font-extrabold shadow-sm'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50 bg-white'
                    }`}
                  >
                    <span className="text-[10px] uppercase font-bold text-gray-400">
                      {d.toLocaleDateString('en-IN', { weekday: 'short' })}
                    </span>
                    <span className="text-base font-extrabold mt-1">{d.getDate()}</span>
                    <span className="text-[9px] font-medium text-gray-500 mt-0.5">
                      {d.toLocaleDateString('en-IN', { month: 'short' })}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Time Slot Selector */}
          {selectedDate && (
            <div className="animate-fadeIn">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Select Time Window</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { id: 'morning', label: 'Morning Slot', range: '10:00 AM - 01:00 PM', icon: '🌅' },
                  { id: 'afternoon', label: 'Afternoon Slot', range: '01:00 PM - 04:00 PM', icon: '☀️' },
                  { id: 'evening', label: 'Evening Slot', range: '04:00 PM - 07:00 PM', icon: '🌆' }
                ].map((slot) => {
                  const isSelected = selectedSlot === slot.id
                  return (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => handleSlotSelect(slot.id, slot.range)}
                      className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-cyan-500 bg-cyan-50/50 text-cyan-600 font-extrabold shadow-sm'
                          : 'border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50 bg-white'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="text-[10px] text-gray-400 font-bold uppercase">{slot.label}</p>
                        <p className="text-xs font-semibold text-gray-800 mt-0.5">{slot.range}</p>
                      </div>
                      <span className="text-lg">{slot.icon}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {pickupScheduledTime && (
            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>
                Booking confirmed for <strong>{new Date(pickupScheduledTime).toLocaleString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</strong>
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ============ STEP 7: REVIEW ============
function StepReview({ store, onSubmit, isLoading }) {
  const {
    selectedDeviceType, selectedModel, specs, conditionAnswers,
    photos, estimatedPrice, personalInfo, deliveryMethod, selectedBusinessId, localBusinesses,
  } = store

  const formatPrice = (p) => (p || 0).toLocaleString('en-IN')

  const chosenBiz = localBusinesses.find(b => b.id === selectedBusinessId)

  // iCloud / Find My / MDM Readiness Checklist state
  const [readinessChecks, setReadinessChecks] = useState({
    iCloudSignedOut: false,
    findMyOff: false,
    mdmFree: false,
    appleIdRemoved: false,
  })

  const toggleCheck = (key) => setReadinessChecks(prev => ({ ...prev, [key]: !prev[key] }))
  const allChecked = Object.values(readinessChecks).every(Boolean)

  const readinessItems = [
    { key: 'iCloudSignedOut', label: 'I have signed out of iCloud on this device', help: 'Settings → Apple ID → Sign Out' },
    { key: 'findMyOff', label: `I have turned off Find My ${selectedDeviceType === 'MacBook' ? 'Mac' : 'iPad'}`, help: 'Settings → Apple ID → Find My' },
    { key: 'mdmFree', label: 'This device is not enrolled in any MDM / organization profile', help: 'Settings → General → VPN & Device Management' },
    { key: 'appleIdRemoved', label: 'I have removed my Apple ID / account from this device', help: 'Required for new owner activation' },
  ]

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-gray-900">Review Your Request</h2>
      <p className="text-sm text-gray-500">Please verify all details before submitting</p>

      {/* Device Info */}
      <div className="bg-gray-50 rounded-xl p-4">
        <h3 className="font-semibold text-gray-900 text-sm mb-3">Device Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          <span className="text-gray-500">Type</span><span className="font-medium">{selectedDeviceType}</span>
          <span className="text-gray-500">Model</span><span className="font-medium">{selectedModel}</span>
          <span className="text-gray-500">Storage</span><span className="font-medium">{specs.storage || '-'}</span>
          <span className="text-gray-500">RAM</span><span className="font-medium">{specs.ram || '-'}</span>
          <span className="text-gray-500">Battery Health</span><span className="font-medium">{specs.batteryHealth || '-'}</span>
          {selectedDeviceType === 'MacBook' && (
            <><span className="text-gray-500">Cycle Count</span><span className="font-medium">{specs.cycleCount || '-'}</span></>
          )}
        </div>
      </div>

      {/* Estimated Price */}
      <div className="bg-gradient-to-r from-primary-50 to-purple-50 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-primary-700">Estimated Price</p>
            <p className="text-2xl font-bold text-primary-700">₹{formatPrice(estimatedPrice)}</p>
          </div>
          <IndianRupee className="w-8 h-8 text-primary-400" />
        </div>
      </div>

      {/* Selected Store */}
      <div className="bg-gray-50 rounded-xl p-4">
        <h3 className="font-semibold text-gray-900 text-sm mb-3">Selected Store Partner</h3>
        {chosenBiz ? (
          <div>
            <p className="font-bold text-gray-800 text-sm">{chosenBiz.name}</p>
            <p className="text-xs text-gray-600 mt-1">{chosenBiz.storefront_address || chosenBiz.city || 'Verified store partner'}</p>
            <div className="flex gap-2.5 mt-2.5">
              {chosenBiz.storefront_address && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(chosenBiz.name + ' ' + chosenBiz.storefront_address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary-600 font-semibold hover:underline flex items-center gap-1"
                >
                  <Navigation className="w-3.5 h-3.5" /> Directions
                </a>
              )}
              {chosenBiz.whatsapp_number && (
                <a
                  href={`https://wa.me/${chosenBiz.whatsapp_number.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-green-600 font-semibold hover:underline flex items-center gap-1"
                >
                  <PhoneIcon className="w-3.5 h-3.5" /> Contact Store
                </a>
              )}
            </div>
          </div>
        ) : (
          <p className="text-xs text-gray-500 italic">Auto-routing fallback (Assigned dynamically on submit)</p>
        )}
      </div>

      {/* Personal Info */}
      <div className="bg-gray-50 rounded-xl p-4">
        <h3 className="font-semibold text-gray-900 text-sm mb-3">Personal & Delivery Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          <span className="text-gray-500">Name</span><span className="font-medium">{personalInfo.fullName}</span>
          <span className="text-gray-500">Email</span><span className="font-medium">{personalInfo.email}</span>
          <span className="text-gray-500">Phone</span><span className="font-medium">{personalInfo.phone}</span>
          <span className="text-gray-500">Delivery Method</span><span className="font-medium">{deliveryMethod === 'pickup' ? 'Home Pickup' : 'Visit Store'}</span>
          {deliveryMethod === 'pickup' && (
            <>
              <span className="text-gray-500">Address</span>
              <span className="font-medium">{personalInfo.address}, {personalInfo.city}, {personalInfo.state} - {personalInfo.pincode}</span>
            </>
          )}
        </div>
      </div>

      {/* ─── Device Readiness Checklist (iCloud / Find My / MDM) ─── */}
      <div className="rounded-xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-amber-600" />
          <h3 className="font-bold text-amber-800 text-sm">Device Readiness Checklist</h3>
        </div>
        <p className="text-xs text-amber-700">
          Please confirm you have completed these steps on your {selectedDeviceType}. 
          This is required for a smooth handover and to protect your personal data.
        </p>
        <div className="space-y-2">
          {readinessItems.map(item => (
            <label
              key={item.key}
              onClick={() => toggleCheck(item.key)}
              className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                readinessChecks[item.key]
                  ? 'border-emerald-300 bg-emerald-50'
                  : 'border-gray-200 bg-white hover:border-amber-300'
              }`}
            >
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                readinessChecks[item.key]
                  ? 'border-emerald-500 bg-emerald-500'
                  : 'border-gray-300'
              }`}>
                {readinessChecks[item.key] && <Check className="w-3 h-3 text-white stroke-[3px]" />}
              </div>
              <div>
                <p className={`text-sm font-medium ${readinessChecks[item.key] ? 'text-emerald-800' : 'text-gray-800'}`}>
                  {item.label}
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5">{item.help}</p>
              </div>
            </label>
          ))}
        </div>
        {!allChecked && (
          <p className="text-xs text-amber-700 font-medium flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5" />
            Complete all items above to enable submission
          </p>
        )}
      </div>

      <button
        onClick={onSubmit}
        disabled={isLoading || !allChecked}
        className={`w-full py-3.5 font-bold rounded-xl transition-opacity flex items-center justify-center gap-2 text-lg ${
          allChecked
            ? 'gradient-bg text-white hover:opacity-90'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        }`}
        title={!allChecked ? 'Please complete the device readiness checklist' : ''}
      >
        {isLoading ? (
          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            <CheckCircle2 className="w-5 h-5" />
            {allChecked ? 'Submit Request' : 'Complete Checklist Above'}
          </>
        )}
      </button>
    </div>
  )
}


// ============ SHARED COMPONENTS ============
function SelectField({ label, value, options, onChange }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 bg-white appearance-none"
      >
        <option value="">Select {label}</option>
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  )
}

function ToggleField({ label, value, onChange }) {
  return (
    <div
      onClick={() => onChange(!value)}
      className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all ${
        value ? 'border-green-300 bg-green-50' : 'border-red-200 bg-red-50'
      }`}
    >
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <div className={`w-10 h-6 rounded-full flex items-center transition-colors ${
        value ? 'bg-green-500 justify-end' : 'bg-red-400 justify-start'
      }`}>
        <div className="w-5 h-5 bg-white rounded-full shadow mx-0.5" />
      </div>
    </div>
  )
}

// Customer-facing multi-select for declared repair issues.
// Items are read from the admin-managed `condition_deductions` rows where
// category='RepairIssues'. Deduction amounts are NEVER shown to the customer —
// only the name of each issue. The deductions are applied in `calculatePrice`
// and reflected in the final Estimated Price.
function RepairIssuesPicker({ options, selected, onToggle }) {
  if (!options || options.length === 0) return null
  return (
    <div className="mt-4 p-4 rounded-xl border border-red-200 bg-red-50/60">
      <div className="flex items-start gap-2 mb-3">
        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold text-red-700 text-sm">Declare known issues</h4>
          <p className="text-xs text-red-800/80">
            Tick any hardware issue your device has. Being transparent now leads to a faster, smoother pickup — our agent verifies on arrival.
          </p>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-2">
        {options.map((opt) => {
          const name = opt.condition_name
          const isSel = selected.includes(name)
          return (
            <label
              key={name}
              className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all ${
                isSel ? 'border-primary-500 bg-white' : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <input
                type="checkbox"
                checked={isSel}
                onChange={(e) => onToggle(name, e.target.checked)}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className={`text-sm ${isSel ? 'text-primary-700 font-semibold' : 'text-gray-700'}`}>
                {name}
              </span>
            </label>
          )
        })}
      </div>
    </div>
  )
}
