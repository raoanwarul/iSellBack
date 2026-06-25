import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useStore = create((set, get) => ({
  // Auth State
  user: null,
  userProfile: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  // Sell Flow State
  sellStep: 0, // 0=deviceType, 1=modelSelect, 2=questionnaire, 3=photos, 4=pricing, 5=personalInfo, 6=review
  selectedDeviceType: null,
  selectedModel: null,
  selectedModelBasePrice: 0,
  specs: { ram: '', storage: '', batteryHealth: '', cycleCount: '' },
  conditionAnswers: {
    deviceTurnsOn: true,
    isRepairable: true,
    screenOriginal: true,
    hasDents: false,
    screenIssue: false,
    batteryIssue: false,
    keyboardIssue: false,
    chargerAvailable: true,
    boxAvailable: false,
    screenCondition: null,
    bodyCondition: null,
    keyboardCondition: null,
    trackpadCondition: null,
    portsCondition: null,
    speakersCondition: null,
    cameraCondition: null,
    wifiBluetoothCondition: null,
    warrantyStatus: null,
    selectedAccessories: [],
    repairIssues: [],
  },
  photos: [],
  conditionPhotos: { screen: null, body: null },
  estimatedPrice: 0,
  priceBreakdown: {},
  personalInfo: { fullName: '', email: '', phone: '', address: '', city: '', state: '', pincode: '' },
  deliveryMethod: 'pickup', // 'pickup' or 'store_visit'
  pickupScheduledTime: null,
  userLocation: null, // { latitude, longitude, address }
  idProofType: '',
  idProofUrl: null,
  selectedBusinessId: null,
  localBusinesses: [],
  localBusinessesLoading: false,

  // Data State
  priceEngineModels: [],
  conditionDeductions: [],
  deductionsByCategory: {},
  sellRequests: [],
  selectedRequest: null,
  resolvedBusiness: null,
  businessResolutionStatus: 'idle',
  businessResolutionError: null,

  // ============ AUTH ACTIONS ============
  register: async (email, password, name) => {
    set({ isLoading: true, error: null })
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name, full_name: name } }
      })
      if (error) throw error

      // Create user in users table
      if (data.user) {
        await supabase.from('users').upsert({
          id: data.user.id,
          email: email,
          name: name,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' })
      }

      set({ isLoading: false })
      return { success: true, message: 'Account created! Please check your email to verify.' }
    } catch (error) {
      set({ error: error.message, isLoading: false })
      return { success: false, message: error.message }
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null })
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error

      const userProfile = await get().fetchUserProfile(data.user.id)
      set({
        user: data.user,
        userProfile,
        isAuthenticated: true,
        isLoading: false,
        personalInfo: {
          fullName: userProfile?.name || data.user.user_metadata?.name || '',
          email: data.user.email || '',
          phone: userProfile?.phone || '',
          address: '', city: '', state: '', pincode: ''
        }
      })
      return true
    } catch (error) {
      set({ error: error.message, isLoading: false })
      return false
    }
  },

  loginWithGoogle: async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin }
      })
      if (error) throw error
    } catch (error) {
      set({ error: error.message })
    }
  },

  logout: async () => {
    await supabase.auth.signOut()
    set({
      user: null, userProfile: null, isAuthenticated: false,
      sellStep: 0, selectedDeviceType: null, selectedModel: null,
      photos: [], estimatedPrice: 0, sellRequests: [], selectedRequest: null,
    })
  },

  resetPassword: async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) throw error
      return true
    } catch (error) {
      set({ error: error.message })
      return false
    }
  },

  checkAuth: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const userProfile = await get().fetchUserProfile(session.user.id)
        set({
          user: session.user,
          userProfile,
          isAuthenticated: true,
          personalInfo: {
            fullName: userProfile?.name || session.user.user_metadata?.name || '',
            email: session.user.email || '',
            phone: userProfile?.phone || '',
            address: '', city: '', state: '', pincode: ''
          }
        })
        return true
      }
      set({ user: null, isAuthenticated: false })
      return false
    } catch {
      set({ user: null, isAuthenticated: false })
      return false
    }
  },

  fetchUserProfile: async (userId) => {
    try {
      const { data } = await supabase.from('users').select('*').eq('id', userId).single()
      return data
    } catch {
      return null
    }
  },

  updateProfile: async (updates) => {
    const { user } = get()
    if (!user) return false
    try {
      const { error } = await supabase.from('users').update({
        ...updates,
        updated_at: new Date().toISOString()
      }).eq('id', user.id)
      if (error) throw error
      const userProfile = await get().fetchUserProfile(user.id)
      set({ userProfile })
      return true
    } catch (error) {
      set({ error: error.message })
      return false
    }
  },

  // ============ PRICE ENGINE ============
  fetchPriceEngine: async () => {
    try {
      const { data, error } = await supabase
        .from('price_engine')
        .select('*')
        .eq('is_active', true)
        .order('device_type')
        .order('model_name')
      if (error) throw error
      set({ priceEngineModels: data || [] })
    } catch (error) {
      console.error('Error fetching price engine:', error)
    }
  },

  getModelsByType: (deviceType) => {
    return get().priceEngineModels.filter(m => m.device_type === deviceType)
  },

  // ============ CONDITION DEDUCTIONS ============
  fetchConditionDeductions: async () => {
    try {
      let data = []
      // Try with is_active and display_order first
      const response = await supabase
        .from('condition_deductions')
        .select('*')
        .order('category')
      
      if (response.error) {
        console.error('Error fetching condition_deductions:', response.error)
        return
      }
      
      data = response.data || []

      const byCategory = {}
      data.forEach(rule => {
        if (!byCategory[rule.category]) byCategory[rule.category] = []
        byCategory[rule.category].push(rule)
      })

      set({ conditionDeductions: data, deductionsByCategory: byCategory })
    } catch (error) {
      console.error('Error fetching deductions:', error)
    }
  },

  getRule: (category, conditionName) => {
    if (!conditionName) return null
    const rules = get().deductionsByCategory[category] || []
    const normalized = conditionName.trim().toLowerCase()
    return rules.find(r => r.condition_name.trim().toLowerCase() === normalized) || null
  },

  resolveBusinessForPincode: async (pincode, city = null) => {
    const normalizedPincode = pincode?.trim()
    const normalizedCity = city?.trim() || null

    if (!normalizedPincode) {
      set({
        resolvedBusiness: null,
        businessResolutionStatus: 'idle',
        businessResolutionError: null,
      })
      return null
    }

    set({ businessResolutionStatus: 'loading', businessResolutionError: null })

    try {
      const { data, error } = await supabase.rpc('resolve_business_for_request', {
        p_pincode: normalizedPincode,
        p_city: normalizedCity,
      })

      if (error) throw error

      const resolvedBusiness = Array.isArray(data) ? (data[0] || null) : (data || null)

      set({
        resolvedBusiness,
        businessResolutionStatus: resolvedBusiness ? 'resolved' : 'idle',
        businessResolutionError: null,
      })

      return resolvedBusiness
    } catch (error) {
      console.error('Business resolution failed:', error)
      set({
        resolvedBusiness: null,
        businessResolutionStatus: 'error',
        businessResolutionError: error.message,
      })
      return null
    }
  },

  clearResolvedBusiness: () => set({
    resolvedBusiness: null,
    businessResolutionStatus: 'idle',
    businessResolutionError: null,
  }),

  setSelectedBusinessId: (id) => set({ selectedBusinessId: id }),

  fetchLocalBusinesses: async (pincode, city = null) => {
    set({ localBusinessesLoading: true, error: null })
    try {
      const { data, error } = await supabase.rpc('get_businesses_by_area', {
        p_pincode: pincode?.trim() || null,
        p_city: city?.trim() || null,
      })
      if (error) throw error
      set({ localBusinesses: data || [], localBusinessesLoading: false })
      return data || []
    } catch (error) {
      console.error('Error fetching local businesses:', error)
      set({ localBusinesses: [], localBusinessesLoading: false, error: error.message })
      return []
    }
  },

  // ============ HYBRID PRICE CALCULATION ============
  calculatePrice: () => {
    const { selectedModelBasePrice, conditionAnswers, selectedDeviceType } = get()
    const getRule = get().getRule
    const basePrice = selectedModelBasePrice
    const scrapValue = 5000 // Fixed scrap value matching Android app
    const isMacBook = selectedDeviceType === 'MacBook'
    const breakdown = {}
    let currentPrice = basePrice

    // Safety: if no base price is set, return scrap value
    if (!basePrice || basePrice <= 0) {
      set({
        estimatedPrice: scrapValue,
        priceBreakdown: { 'No Model Selected': `Default - ₹${scrapValue}` }
      })
      return scrapValue
    }

    // SCRAP CHECK
    if (!conditionAnswers.deviceTurnsOn) {
      set({
        estimatedPrice: scrapValue,
        priceBreakdown: { 'Device Not Turning On': `SCRAP - ₹${scrapValue}` }
      })
      return scrapValue
    }

    let totalFlatDeduction = 0

    // Helper: get deduction value as integer (matching Flutter's null-coalescing logic)
    const getVal = (rule) => Math.round(rule.value ?? rule.deduction_amount ?? 0)

    // Screen
    const screenRule = getRule('Screen', conditionAnswers.screenCondition)
    if (screenRule && getVal(screenRule) > 0) {
      const val = getVal(screenRule)
      totalFlatDeduction += val
      breakdown[`Screen: ${conditionAnswers.screenCondition}`] = `-₹${val}`
    }

    // Body
    const bodyRule = getRule('Body', conditionAnswers.bodyCondition)
    if (bodyRule && getVal(bodyRule) > 0) {
      const val = getVal(bodyRule)
      totalFlatDeduction += val
      breakdown[`Body: ${conditionAnswers.bodyCondition}`] = `-₹${val}`
    }

    // Battery
    const batteryRule = getRule('Battery', conditionAnswers.batteryHealth || get().specs.batteryHealth)
    if (batteryRule && getVal(batteryRule) > 0) {
      const val = getVal(batteryRule)
      totalFlatDeduction += val
      breakdown[`Battery: ${conditionAnswers.batteryHealth || get().specs.batteryHealth}`] = `-₹${val}`
    }

    // MacBook specific
    if (isMacBook) {
      const macParts = [
        ['Keyboard', conditionAnswers.keyboardCondition],
        ['Trackpad', conditionAnswers.trackpadCondition],
        ['Ports', conditionAnswers.portsCondition],
      ]
      macParts.forEach(([cat, cond]) => {
        const rule = getRule(cat, cond)
        if (rule && getVal(rule) > 0) {
          const val = getVal(rule)
          totalFlatDeduction += val
          breakdown[`${cat}: ${cond}`] = `-₹${val}`
        }
      })

      // Cycle Count
      const cycleCount = parseInt(get().specs.cycleCount) || 0
      let cycleRange = '0-299 cycles'
      if (cycleCount >= 800) cycleRange = '800+ cycles'
      else if (cycleCount >= 500) cycleRange = '500-799 cycles'
      else if (cycleCount >= 300) cycleRange = '300-499 cycles'
      const cycleRule = getRule('CycleCount', cycleRange)
      if (cycleRule && getVal(cycleRule) > 0) {
        const val = getVal(cycleRule)
        totalFlatDeduction += val
        breakdown[`Cycle Count (${cycleCount})`] = `-₹${val}`
      }
    }

    // Speakers, Camera
    const otherParts = [
      ['Speakers', conditionAnswers.speakersCondition],
      ['Camera', conditionAnswers.cameraCondition],
    ]
    otherParts.forEach(([cat, cond]) => {
      const rule = getRule(cat, cond)
      if (rule && getVal(rule) > 0) {
        const val = getVal(rule)
        totalFlatDeduction += val
        breakdown[`${cat}: ${cond}`] = `-₹${val}`
      }
    })

    // WiFi/Bluetooth (DB stores as separate 'WiFi' and 'Bluetooth' categories)
    if (conditionAnswers.wifiBluetoothCondition) {
      const wifiRule = getRule('WiFi', conditionAnswers.wifiBluetoothCondition) || getRule('Bluetooth', conditionAnswers.wifiBluetoothCondition)
      if (wifiRule && getVal(wifiRule) > 0) {
        const val = getVal(wifiRule)
        totalFlatDeduction += val
        breakdown[`WiFi/Bluetooth: ${conditionAnswers.wifiBluetoothCondition}`] = `-₹${val}`
      }
    }

    // Storage & RAM deductions
    const storageRule = getRule('Storage', get().specs.storage)
    if (storageRule && getVal(storageRule) > 0) {
      const val = getVal(storageRule)
      totalFlatDeduction += val
      breakdown[`Storage: ${get().specs.storage}`] = `-₹${val}`
    }
    const ramRule = getRule('RAM', get().specs.ram)
    if (ramRule && getVal(ramRule) > 0) {
      const val = getVal(ramRule)
      totalFlatDeduction += val
      breakdown[`RAM: ${get().specs.ram}`] = `-₹${val}`
    }

    // No Charger
    if (!conditionAnswers.chargerAvailable) {
      const chargerRule = getRule('Accessories', 'No charger')
      if (chargerRule && getVal(chargerRule) > 0) {
        const val = getVal(chargerRule)
        totalFlatDeduction += val
        breakdown['No Charger'] = `-₹${val}`
      }
    }

    currentPrice -= totalFlatDeduction

    // Warranty
    let totalBonus = 0
    if (conditionAnswers.warrantyStatus) {
      const warrantyRule = getRule('Warranty', conditionAnswers.warrantyStatus)
      if (warrantyRule) {
        const val = getVal(warrantyRule)
        if (val < 0) {
          const bonus = Math.abs(val)
          totalBonus += bonus
          breakdown[`Warranty: ${conditionAnswers.warrantyStatus}`] = `+₹${bonus} (Bonus)`
        } else if (val > 0) {
          totalFlatDeduction += val
          currentPrice -= val
          breakdown[`Warranty: ${conditionAnswers.warrantyStatus}`] = `-₹${val}`
        }
      }
    }

    // Box bonus (try both naming variants)
    if (conditionAnswers.boxAvailable) {
      const boxRule = getRule('Accessories', 'Box included') || getRule('Accessories', 'Original Box included')
      if (boxRule) {
        const val = getVal(boxRule)
        if (val < 0) {
          const bonus = Math.abs(val)
          totalBonus += bonus
          breakdown['Box Included'] = `+₹${bonus} (Bonus)`
        }
      }
    }

    // Accessories bonuses
    if (conditionAnswers.selectedAccessories?.length > 0) {
      conditionAnswers.selectedAccessories.forEach(acc => {
        const rule = getRule('Accessories', acc)
        if (rule) {
          const val = getVal(rule)
          if (val < 0) {
            const bonus = Math.abs(val)
            totalBonus += bonus
            breakdown[acc.replace(' included', '')] = `+₹${bonus} (Bonus)`
          }
        }
      })
    }

    // Repair-issues deductions (admin-managed under category 'RepairIssues')
    if (conditionAnswers.repairIssues?.length > 0) {
      conditionAnswers.repairIssues.forEach((issue) => {
        const rule = getRule('RepairIssues', issue)
        if (rule) {
          const val = getVal(rule)
          if (val > 0) {
            totalFlatDeduction += val
            currentPrice -= val
            breakdown[`Repair: ${issue}`] = `-₹${val}`
          }
        }
      })
    }

    currentPrice += totalBonus

    // Floor check
    if (currentPrice < scrapValue) currentPrice = scrapValue

    // Round to nearest 100
    currentPrice = Math.round(currentPrice / 100) * 100

    set({ estimatedPrice: currentPrice, priceBreakdown: breakdown })
    return currentPrice
  },

  // ============ SELL FLOW ACTIONS ============
  setSellStep: (step) => set({ sellStep: step }),
  setDeviceType: (type) => set({ selectedDeviceType: type, sellStep: 1 }),
  setModel: (model) => {
    set({
      selectedModel: model.model_name,
      selectedModelBasePrice: model.base_price,
      sellStep: 2
    })
  },
  setSpecs: (specs) => set({ specs }),
  setConditionAnswers: (answers) => set({ conditionAnswers: { ...get().conditionAnswers, ...answers } }),
  setPhotos: (photos) => set({ photos }),
  setConditionPhotos: (photos) => set({ conditionPhotos: { ...get().conditionPhotos, ...photos } }),
  setPersonalInfo: (info) => {
    const currentInfo = get().personalInfo
    const nextInfo = { ...currentInfo, ...info }
    const pincodeChanged = info.pincode !== undefined && info.pincode !== currentInfo.pincode
    const cityChanged = info.city !== undefined && info.city !== currentInfo.city

    set({
      personalInfo: nextInfo,
      ...(pincodeChanged || cityChanged
        ? {
            resolvedBusiness: null,
            businessResolutionStatus: 'idle',
            businessResolutionError: null,
          }
        : {}),
    })
  },
  setDeliveryMethod: (method) => set({ deliveryMethod: method }),
  setUserLocation: (location) => set({ userLocation: location }),
  setIdProof: (type, url) => set({ idProofType: type, idProofUrl: url }),
  setPickupScheduledTime: (time) => set({ pickupScheduledTime: time }),

  resetSellFlow: () => set({
    sellStep: 0,
    selectedDeviceType: null,
    selectedModel: null,
    selectedModelBasePrice: 0,
    specs: { ram: '', storage: '', batteryHealth: '', cycleCount: '' },
    conditionAnswers: {
      deviceTurnsOn: true, isRepairable: true, screenOriginal: true, hasDents: false,
      screenIssue: false, batteryIssue: false, keyboardIssue: false,
      chargerAvailable: true, boxAvailable: false,
      screenCondition: null, bodyCondition: null,
      keyboardCondition: null, trackpadCondition: null,
      portsCondition: null, speakersCondition: null,
      cameraCondition: null, wifiBluetoothCondition: null,
      warrantyStatus: null, selectedAccessories: [], repairIssues: [],
    },
    photos: [],
    conditionPhotos: { screen: null, body: null },
    estimatedPrice: 0,
    priceBreakdown: {},
    deliveryMethod: 'pickup',
    pickupScheduledTime: null,
    userLocation: null,
    idProofType: '',
    idProofUrl: null,
    selectedBusinessId: null,
    localBusinesses: [],
  }),

  // ============ PHOTO UPLOAD ============
  uploadPhoto: async (file, folder) => {
    try {
      const fileName = `${Date.now()}_${file.name}`
      const path = `${folder}/${fileName}`
      const { error } = await supabase.storage.from('device-photos').upload(path, file)
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from('device-photos').getPublicUrl(path)
      return publicUrl
    } catch (error) {
      console.error('Photo upload failed:', error)
      set({ error: `Photo upload failed: ${error.message}` })
      return null
    }
  },

  uploadConditionPhoto: async (file, type) => {
    try {
      const fileName = `${Date.now()}_${type}_${file.name}`
      const path = `condition_photos/${fileName}`
      // Use device-photos bucket (condition_photos subfolder) since bucket already exists
      const { error } = await supabase.storage.from('device-photos').upload(path, file)
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from('device-photos').getPublicUrl(path)
      return publicUrl
    } catch (error) {
      console.error('Condition photo upload failed:', error)
      set({ error: `Condition photo upload failed: ${error.message}` })
      return null
    }
  },

  uploadIdProof: async (file) => {
    try {
      const fileName = `${Date.now()}_id_${file.name}`
      const path = `id_proofs/${fileName}`
      const { error } = await supabase.storage.from('device-photos').upload(path, file)
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from('device-photos').getPublicUrl(path)
      return publicUrl
    } catch (error) {
      console.error('ID proof upload failed:', error)
      set({ error: `ID proof upload failed: ${error.message}` })
      return null
    }
  },

  // ============ SUBMIT REQUEST ============
  submitSellRequest: async () => {
    const state = get()
    if (!state.user) return { success: false, message: 'Please login first' }

    set({ isLoading: true, error: null })
    try {
      // Ensure user exists in users table
      await supabase.from('users').upsert({
        id: state.user.id,
        email: state.user.email,
        name: state.personalInfo.fullName || state.user.user_metadata?.name,
        phone: state.personalInfo.phone,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })

      // Fetch or resolve the assigned business
      let assignedBusinessId = state.selectedBusinessId
      let chosenBusiness = null
      if (assignedBusinessId) {
        chosenBusiness = state.localBusinesses.find(b => b.id === assignedBusinessId)
      }
      
      const resolvedBusiness = await get().resolveBusinessForPincode(
        state.personalInfo.pincode,
        state.personalInfo.city
      )

      if (!assignedBusinessId && resolvedBusiness) {
        assignedBusinessId = resolvedBusiness.business_id
        chosenBusiness = {
          id: resolvedBusiness.business_id,
          name: resolvedBusiness.business_name,
          city: resolvedBusiness.business_city,
          slug: resolvedBusiness.business_slug,
          assignment_source: resolvedBusiness.assignment_source,
        }
      }

      const requestData = {
        user_id: state.user.id,
        device_type: state.selectedDeviceType,
        model_name: state.selectedModel,
        specs: {
          ram: state.specs.ram,
          storage: state.specs.storage,
          battery_health: state.specs.batteryHealth,
          cycle_count: state.specs.cycleCount,
        },
        condition_answers: {
          device_turns_on: state.conditionAnswers.deviceTurnsOn,
          is_repairable: state.conditionAnswers.isRepairable,
          screen_original: state.conditionAnswers.screenOriginal,
          has_dents: state.conditionAnswers.hasDents,
          screen_issue: state.conditionAnswers.screenIssue,
          battery_issue: state.conditionAnswers.batteryIssue,
          keyboard_issue: state.conditionAnswers.keyboardIssue,
          charger_available: state.conditionAnswers.chargerAvailable,
          box_available: state.conditionAnswers.boxAvailable,
          screen_condition: state.conditionAnswers.screenCondition,
          body_condition: state.conditionAnswers.bodyCondition,
          screen_condition_photo_url: state.conditionPhotos.screen,
          body_condition_photo_url: state.conditionPhotos.body,
          keyboard_condition: state.conditionAnswers.keyboardCondition,
          trackpad_condition: state.conditionAnswers.trackpadCondition,
          ports_condition: state.conditionAnswers.portsCondition,
          speakers_condition: state.conditionAnswers.speakersCondition,
          camera_condition: state.conditionAnswers.cameraCondition,
          wifi_bluetooth_condition: state.conditionAnswers.wifiBluetoothCondition,
          warranty_status: state.conditionAnswers.warrantyStatus,
          selected_accessories: state.conditionAnswers.selectedAccessories,
          repair_issues: state.conditionAnswers.repairIssues || [],
        },
        photos_url: state.photos,
        system_estimated_price: state.estimatedPrice,
        user_expected_price: state.estimatedPrice,
        status: 'Pending',
        id_proof_url: state.idProofUrl || null,
        id_proof_type: state.idProofType || null,
        customer_phone: state.personalInfo.phone || null,
        pickup_pincode: state.personalInfo.pincode || null,
        delivery_preference: state.deliveryMethod === 'pickup' ? 'agent_pickup' : 'store_visit',
        selected_business_id: state.selectedBusinessId || null,
        pickup_scheduled_time: state.pickupScheduledTime || null,
        ...(state.userLocation ? { user_location: state.userLocation } : {}),
        price_breakdown: {
          base_price: state.selectedModelBasePrice,
          deductions: state.priceBreakdown,
          final_price: state.estimatedPrice,
          delivery_method: state.deliveryMethod,
        },
        ...(assignedBusinessId
          ? {
              business_id: assignedBusinessId,
              business_assignment_source: chosenBusiness?.assignment_source || (state.selectedBusinessId ? 'customer_selection' : 'system_fallback'),
              business_assignment_notes: state.selectedBusinessId 
                ? `Selected by customer in sell flow`
                : `Resolved in customer app via ${chosenBusiness?.assignment_source || 'system'}`,
              business_snapshot: chosenBusiness ? {
                id: chosenBusiness.id,
                name: chosenBusiness.name,
                city: chosenBusiness.city,
                slug: chosenBusiness.slug,
                assignment_source: chosenBusiness.assignment_source || (state.selectedBusinessId ? 'customer_selection' : 'system_fallback'),
              } : null,
            }
          : {}),
      }

      const { data: insertedData, error } = await supabase.from('sell_requests').insert(requestData).select('id').single()
      if (error) throw error

      // ─── Audit: log sell event for transparency trail ───
      if (insertedData?.id) {
        try {
          await supabase.from('sell_events').insert({
            sell_request_id: insertedData.id,
            business_id: assignedBusinessId || null,
            actor_user_id: state.user.id,
            actor_email: state.user.email,
            event_type: 'request_submitted',
            message: `Customer submitted sell request for ${state.selectedDeviceType} ${state.selectedModel}`,
            meta: {
              device_type: state.selectedDeviceType,
              model: state.selectedModel,
              system_estimated_price: state.estimatedPrice,
              delivery_method: state.deliveryMethod,
              readiness_confirmed: true, // iCloud/MDM checklist was completed
            },
          })
        } catch (eventErr) {
          console.warn('sell_event logging failed (non-blocking):', eventErr.message)
        }
      }

      get().resetSellFlow()
      await get().fetchUserRequests()
      set({ isLoading: false })
      return { success: true, message: 'Request submitted successfully!' }
    } catch (error) {
      set({ isLoading: false, error: error.message })
      return { success: false, message: error.message }
    }
  },

  // ============ REQUESTS ============
  fetchUserRequests: async () => {
    const { user } = get()
    if (!user) return
    set({ isLoading: true })
    try {
      const { data, error } = await supabase
        .from('sell_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      set({ sellRequests: data || [], isLoading: false })
    } catch (error) {
      set({ error: error.message, isLoading: false })
    }
  },

  selectRequest: (request) => set({ selectedRequest: request }),

  // Agent tracking has been removed from customer view.
  // Kept stub for backward compatibility with any lingering callers.
  fetchAgentTracking: async () => null,
}))
