import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { notifyCustomer } from '../lib/notifications'

export const useStore = create((set, get) => ({
  // Auth State
  admin: null,
  isAuthenticated: false,
  
  // Requests State
  requests: [],
  selectedRequest: null,
  isLoading: false,
  error: null,
  
  // Price Engine State
  priceEngineModels: [],
  
  // Condition Deductions State
  conditionDeductions: [],
  
  // Agents State
  agents: [],

  // Business Scope State
  businesses: [],
  selectedBusinessId: null,
  businessScopeStatus: 'idle',

  // Fraud Alerts State
  fraudAlerts: [],
  
  // Real-time subscription
  realtimeSubscription: null,
  
  // Stats
  stats: {
    totalRequests: 0,
    pendingRequests: 0,
    completedRequests: 0,
    totalRevenue: 0
  },

  // Verify admin status matching Flutter auth_provider.dart
  _verifyAdmin: async (email) => {
    try {
      // Primary: admin_users table
      const { data: adminUser } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', email)
        .maybeSingle()
      if (adminUser) {
        return adminUser.is_active !== false ? adminUser : null
      }

      return null
    } catch {
      return null
    }
  },

  _getBusinessScopeId: () => {
    const { selectedBusinessId, admin } = get()
    return selectedBusinessId || admin?.primary_business_id || null
  },

  fetchAccessibleBusinesses: async () => {
    const { admin, selectedBusinessId } = get()
    if (!admin) {
      set({ businesses: [], selectedBusinessId: null, businessScopeStatus: 'idle' })
      return []
    }

    set({ businessScopeStatus: 'loading' })

    try {
      let query = supabase
        .from('businesses')
        .select('*')
        .order('is_default', { ascending: false })
        .order('name', { ascending: true })

      if (admin.role !== 'super_admin' && admin.primary_business_id) {
        query = query.eq('id', admin.primary_business_id)
      }

      const { data, error } = await query
      if (error) throw error

      const businesses = data || []
      const nextSelectedBusinessId = selectedBusinessId
        || admin.primary_business_id
        || businesses[0]?.id
        || null

      set({
        businesses,
        selectedBusinessId: nextSelectedBusinessId,
        businessScopeStatus: 'ready',
      })

      return businesses
    } catch (error) {
      console.warn('Business scope bootstrap skipped:', error.message)
      set({
        businesses: [],
        selectedBusinessId: admin.primary_business_id || null,
        businessScopeStatus: 'unavailable',
      })
      return []
    }
  },

  setSelectedBusinessId: async (businessId) => {
    set({ selectedBusinessId: businessId || null })
    await Promise.all([
      get().fetchRequests(),
      get().fetchAgents(),
      get().fetchStats(),
    ])
  },

  // Auth Actions (matches Flutter admin auth_provider.dart)
  login: async (email, password) => {
    set({ isLoading: true, error: null })
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      if (error) throw error

      const adminData = await get()._verifyAdmin(email)
      if (!adminData) {
        await supabase.auth.signOut()
        throw new Error('Access denied. Admin privileges required.')
      }
      
      set({
        admin: adminData,
        isAuthenticated: true,
        isLoading: false,
        selectedBusinessId: adminData.primary_business_id || null,
      })
      await get().fetchAccessibleBusinesses()
      return true
    } catch (error) {
      set({ error: error.message, isLoading: false })
      return false
    }
  },

  logout: async () => {
    await supabase.auth.signOut()
    set({
      admin: null,
      isAuthenticated: false,
      businesses: [],
      selectedBusinessId: null,
      businessScopeStatus: 'idle',
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
        const adminData = await get()._verifyAdmin(session.user.email)
        if (adminData) {
          set({
            admin: adminData,
            isAuthenticated: true,
            selectedBusinessId: adminData.primary_business_id || null,
          })
          await get().fetchAccessibleBusinesses()
          return true
        }
      }
      set({ admin: null, isAuthenticated: false })
      return false
    } catch {
      set({ admin: null, isAuthenticated: false })
      return false
    }
  },

  // Requests Actions
  fetchRequests: async (status = null) => {
    set({ isLoading: true })
    try {
      const businessScopeId = get()._getBusinessScopeId()
      let query = supabase
        .from('sell_requests')
        .select(`
          *,
          users (id, phone, name, email)
        `)
        .order('created_at', { ascending: false })
      
      if (status && status !== 'all') {
        query = query.eq('status', status)
      }

      if (businessScopeId) {
        query = query.eq('business_id', businessScopeId)
      }
      
      const { data, error } = await query
      if (error) throw error
      
      set({ requests: data || [], isLoading: false })
    } catch (error) {
      set({ error: error.message, isLoading: false })
    }
  },

  selectRequest: (request) => {
    set({ selectedRequest: request })
  },

  // Real-time sync - subscribe to sell_requests changes
  subscribeToRealtime: () => {
    const existingSub = get().realtimeSubscription
    if (existingSub) return // Already subscribed

    const channel = supabase
      .channel('admin-sell-requests')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'sell_requests' },
        async (payload) => {
          console.log('Realtime update:', payload.eventType, payload.new?.id)
          // Refresh requests on any change
          await get().fetchRequests()
          // Update selected request if it was modified
          const selected = get().selectedRequest
          if (selected && payload.new?.id === selected.id) {
            const updated = get().requests.find(r => r.id === selected.id)
            if (updated) set({ selectedRequest: updated })
          }
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'condition_deductions' },
        async () => {
          console.log('Condition deductions updated')
          await get().fetchConditionDeductions()
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'price_engine' },
        async () => {
          console.log('Price engine updated')
          await get().fetchPriceEngine()
        }
      )
      .subscribe()

    set({ realtimeSubscription: channel })
    console.log('Realtime subscription active')
  },

  unsubscribeFromRealtime: () => {
    const sub = get().realtimeSubscription
    if (sub) {
      supabase.removeChannel(sub)
      set({ realtimeSubscription: null })
      console.log('Realtime subscription removed')
    }
  },

  updateRequestStatus: async (requestId, status, additionalData = {}) => {
    set({ isLoading: true })
    try {
      // Get the request first to know the customer user_id
      const { data: request } = await supabase
        .from('sell_requests')
        .select('user_id, device_name, model_name, business_id')
        .eq('id', requestId)
        .single()

      const { error } = await supabase
        .from('sell_requests')
        .update({ status, ...additionalData })
        .eq('id', requestId)
      
      if (error) throw error

      // ─── Audit: log sell event for transparency trail ───
      const { admin } = get()
      if (admin) {
        try {
          let eventType = 'admin_status_update'
          let msg = `Admin updated status to ${status}`
          if (additionalData.assigned_agent_id) {
            eventType = 'agent_assigned'
            msg = `Admin assigned agent ${additionalData.assigned_agent_name || 'Agent'} and scheduled pickup`
          } else if (additionalData.admin_offer_price !== undefined || additionalData.final_price !== undefined) {
            eventType = 'price_overridden'
            msg = `Admin updated offer price to ₹${additionalData.admin_offer_price || additionalData.final_price}`
          }

          await supabase.from('sell_events').insert({
            sell_request_id: requestId,
            business_id: request?.business_id || get().selectedBusinessId || null,
            actor_user_id: admin.id,
            actor_email: admin.email,
            event_type: eventType,
            message: msg,
            meta: {
              status,
              ...additionalData,
            },
          })
        } catch (eventErr) {
          console.warn('sell_event logging failed (non-blocking):', eventErr.message)
        }
      }
      
      // Send push notification to customer
      if (request?.user_id) {
        const statusMessages = {
          'Offer_Accepted': { title: 'Offer Accepted! 🎉', body: `Your ${request.device_name || request.model_name || 'device'} sell request has been accepted.` },
          'Rejected': { title: 'Request Update', body: `Your ${request.device_name || request.model_name || 'device'} sell request has been reviewed.` },
          'Counter_Offered': { title: 'New Counter Offer! 💰', body: `We have a new offer for your ${request.device_name || request.model_name || 'device'}.` },
          'Pickup_Scheduled': { title: 'Pickup Scheduled! 📦', body: `Pickup has been scheduled for your ${request.device_name || request.model_name || 'device'}.` },
          'Completed': { title: 'Transaction Complete! ✅', body: `Your ${request.device_name || request.model_name || 'device'} sell request is now complete.` },
        }
        const msg = statusMessages[status]
        if (msg) {
          notifyCustomer(request.user_id, msg.title, msg.body, { request_id: requestId, status }).catch(err => 
            console.error('Push notification failed (non-blocking):', err)
          )
        }
      }

      // Refresh requests
      await get().fetchRequests()
      set({ isLoading: false })
      return true
    } catch (error) {
      set({ error: error.message, isLoading: false })
      return false
    }
  },

  acceptRequest: async (requestId) => {
    return get().updateRequestStatus(requestId, 'Offer_Accepted')
  },

  rejectRequest: async (requestId, reason) => {
    return get().updateRequestStatus(requestId, 'Rejected', { 
      rejection_reason: reason,
      updated_at: new Date().toISOString()
    })
  },

  counterOffer: async (requestId, price) => {
    return get().updateRequestStatus(requestId, 'Counter_Offered', { 
      admin_offer_price: price,
      updated_at: new Date().toISOString()
    })
  },

  confirmSeller: async (requestId) => {
    return get().updateRequestStatus(requestId, 'Seller_Confirmed', { 
      seller_confirmed: true,
      seller_confirmed_at: new Date().toISOString()
    })
  },

  // Mark Payment Done (matches Android admin app _markPaymentDone)
  markPaymentDone: async (requestId) => {
    try {
      // Get current request to preserve existing bank_details
      const { data: current } = await supabase
        .from('sell_requests')
        .select('bank_details')
        .eq('id', requestId)
        .single()
      
      const existingBankDetails = current?.bank_details || {}
      const updatedBankDetails = {
        ...existingBankDetails,
        payment_done: true,
        payment_done_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('sell_requests')
        .update({ bank_details: updatedBankDetails })
        .eq('id', requestId)
      
      if (error) throw error
      await get().fetchRequests()
      return true
    } catch (error) {
      console.error('Error marking payment done:', error)
      return false
    }
  },

  // Fetch agents from database (matches Flutter _fetchAgents)
  fetchAgents: async () => {
    try {
      const businessScopeId = get()._getBusinessScopeId()
      let query = supabase
        .from('agents')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (businessScopeId) {
        query = query.eq('business_id', businessScopeId)
      }

      const { data, error } = await query
      if (error) throw error
      set({ agents: data || [] })
      return data || []
    } catch (error) {
      console.error('Error fetching agents:', error)
      return []
    }
  },

  // Fetch all agents (including inactive) for management
  fetchAllAgents: async () => {
    try {
      const businessScopeId = get()._getBusinessScopeId()
      let query = supabase
        .from('agents')
        .select('*')
        .order('created_at', { ascending: false })

      if (businessScopeId) {
        query = query.eq('business_id', businessScopeId)
      }

      const { data, error } = await query
      if (error) throw error
      set({ agents: data || [] })
      return data || []
    } catch (error) {
      console.error('Error fetching all agents:', error)
      return []
    }
  },

  // Add approved agent email (admin adds email, agent can only register with this email)
  addApprovedAgentEmail: async (email, name, phone, city) => {
    try {
      // Insert into approved_agent_emails table
      const { error: approvedError } = await supabase
        .from('approved_agent_emails')
        .insert({
          email: email.toLowerCase().trim(),
          name: name || '',
          phone: phone || '',
          city: city || '',
          is_active: true,
          added_by: get().admin?.id || null
        })
      if (approvedError) throw approvedError
      return { success: true }
    } catch (error) {
      console.error('Error adding approved agent:', error)
      return { success: false, message: error.message }
    }
  },

  // Fetch approved agent emails
  fetchApprovedAgentEmails: async () => {
    try {
      const { data, error } = await supabase
        .from('approved_agent_emails')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching approved agents:', error)
      return []
    }
  },

  // Remove approved agent email
  removeApprovedAgentEmail: async (id) => {
    try {
      const { error } = await supabase
        .from('approved_agent_emails')
        .delete()
        .eq('id', id)
      if (error) throw error
      return true
    } catch (error) {
      console.error('Error removing approved agent:', error)
      return false
    }
  },

  // Toggle agent active status
  toggleAgentStatus: async (agentId, isActive) => {
    try {
      const { error } = await supabase
        .from('agents')
        .update({ is_active: isActive })
        .eq('id', agentId)
      if (error) throw error
      await get().fetchAllAgents()
      return true
    } catch (error) {
      console.error('Error toggling agent status:', error)
      return false
    }
  },

  // Schedule pickup with agent assignment (matches Flutter _schedulePickup)
  schedulePickupWithAgent: async (requestId, agentId, agentName, pickupDate, pickupTime, pickupSlot, pickupPincode) => {
    try {
      const pickupDateTime = new Date(pickupDate)
      if (pickupTime) {
        const [h, m] = pickupTime.split(':')
        pickupDateTime.setHours(parseInt(h), parseInt(m))
      }
      const updateData = {
        status: 'Pickup_Scheduled',
        assigned_agent_id: agentId,
        assigned_agent_name: agentName,
        pickup_scheduled_time: pickupDateTime.toISOString(),
        pickup_date: pickupDate,
        updated_at: new Date().toISOString(),
      }
      if (pickupSlot) updateData.pickup_slot = pickupSlot
      if (pickupPincode) updateData.pickup_pincode = pickupPincode

      const { error } = await supabase
        .from('sell_requests')
        .update(updateData)
        .eq('id', requestId)
      if (error) throw error
      await get().fetchRequests()
      set({ selectedRequest: null })
      return true
    } catch (error) {
      set({ error: error.message })
      return false
    }
  },

  markCompleted: async (requestId, finalPrice) => {
    const updateData = { status: 'Completed', updated_at: new Date().toISOString() }
    if (finalPrice) updateData.final_price = finalPrice
    return get().updateRequestStatus(requestId, 'Completed', updateData)
  },

  // Price Engine Actions (matches Flutter price_management_screen.dart)
  fetchPriceEngine: async () => {
    set({ isLoading: true })
    try {
      const { data, error } = await supabase
        .from('price_engine')
        .select('*')
        .eq('is_active', true)
        .order('device_type', { ascending: true })
        .order('model_name', { ascending: true })
      
      if (error) throw error
      set({ priceEngineModels: data || [], isLoading: false })
    } catch (error) {
      set({ error: error.message, isLoading: false })
    }
  },

  addPriceModel: async (deviceType, modelName, basePrice) => {
    try {
      const { error } = await supabase
        .from('price_engine')
        .insert({
          device_type: deviceType,
          model_name: modelName,
          base_price: basePrice,
          is_active: true,
        })
      if (error) throw error
      await get().fetchPriceEngine()
      return true
    } catch (error) {
      set({ error: error.message })
      return false
    }
  },

  updatePriceEngine: async (id, updates) => {
    try {
      const { error } = await supabase
        .from('price_engine')
        .update(updates)
        .eq('id', id)
      
      if (error) throw error
      await get().fetchPriceEngine()
      return true
    } catch (error) {
      set({ error: error.message })
      return false
    }
  },

  deletePriceModel: async (id) => {
    try {
      // Soft delete
      const { error } = await supabase
        .from('price_engine')
        .update({ is_active: false })
        .eq('id', id)
      if (error) throw error
      await get().fetchPriceEngine()
      return true
    } catch (error) {
      set({ error: error.message })
      return false
    }
  },

  // Condition Deductions Actions (matches Flutter condition_pricing_screen.dart)
  fetchConditionDeductions: async () => {
    set({ isLoading: true })
    try {
      let data = []
      try {
        const res = await supabase
          .from('condition_deductions')
          .select('*')
          .order('category')
          .order('display_order')
        data = res.data || []
      } catch {
        const res = await supabase
          .from('condition_deductions')
          .select('*')
          .order('category')
          .order('condition_name')
        data = res.data || []
      }

      // Normalize: ensure 'value' field exists
      const normalized = data.map(item => {
        const obj = { ...item }
        if (obj.value === undefined && obj.deduction_amount !== undefined) {
          obj.value = obj.deduction_amount
        }
        return obj
      })

      set({ conditionDeductions: normalized, isLoading: false })
    } catch (error) {
      set({ error: error.message, isLoading: false })
    }
  },

  saveConditionDeductions: async (deductions) => {
    set({ isLoading: true })
    try {
      // Delete all existing deductions first, then insert fresh (matches Flutter app approach)
      const { error: deleteError } = await supabase
        .from('condition_deductions')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000')

      if (deleteError) {
        console.error('Delete error:', deleteError)
        throw deleteError
      }

      // Build insert data - resolve 'value' from either field name
      const getVal = (d) => typeof d.value === 'number' ? d.value
        : typeof d.deduction_amount === 'number' ? d.deduction_amount
        : parseInt(d.value ?? d.deduction_amount) || 0

      // Try 1: Full Android schema (HYBRID_PRICING_SQL.sql columns)
      const fullInsert = deductions.map((d, idx) => ({
        category: d.category,
        condition_name: d.condition_name,
        value: getVal(d),
        deduction_type: d.deduction_type || 'FLAT',
        impact_level: d.impact_level || (getVal(d) < 0 ? 'BONUS' : 'MINOR'),
        display_order: d.display_order ?? idx,
        is_active: d.is_active !== undefined ? d.is_active : true,
      }))

      let { error: insertError } = await supabase
        .from('condition_deductions')
        .insert(fullInsert)

      // Try 2: Fallback with deduction_amount column (fix_condition_deductions_rls.sql schema)
      if (insertError) {
        console.warn('Full insert failed, trying deduction_amount fallback:', insertError.message)
        const fallbackInsert = deductions.map((d) => ({
          category: d.category,
          condition_name: d.condition_name,
          deduction_amount: getVal(d),
        }))
        const res2 = await supabase.from('condition_deductions').insert(fallbackInsert)
        insertError = res2.error
      }

      if (insertError) {
        console.error('Insert error (both attempts):', insertError)
        throw insertError
      }
      
      await get().fetchConditionDeductions()
      set({ isLoading: false })
      return true
    } catch (error) {
      console.error('Save condition deductions error:', error)
      set({ error: error.message, isLoading: false })
      return { success: false, message: error.message || 'Unknown error' }
    }
  },

  // Fraud Alerts Actions
  fetchFraudAlerts: async () => {
    set({ isLoading: true })
    try {
      const businessScopeId = get()._getBusinessScopeId()
      let scopedRequestIds = null

      if (businessScopeId) {
        const { data: scopedRequests, error: scopedRequestsError } = await supabase
          .from('sell_requests')
          .select('id')
          .eq('business_id', businessScopeId)

        if (scopedRequestsError) throw scopedRequestsError
        scopedRequestIds = (scopedRequests || []).map((request) => request.id)
      }

      let query = supabase
        .from('fraud_alerts')
        .select(`
          *,
          users (id, phone, name)
        `)
        .eq('is_resolved', false)
        .order('created_at', { ascending: false })

      if (Array.isArray(scopedRequestIds)) {
        if (scopedRequestIds.length === 0) {
          set({ fraudAlerts: [], isLoading: false })
          return
        }
        query = query.in('sell_request_id', scopedRequestIds)
      }

      const { data, error } = await query
      
      if (error) throw error
      set({ fraudAlerts: data || [], isLoading: false })
    } catch (error) {
      set({ error: error.message, isLoading: false })
    }
  },

  resolveFraudAlert: async (alertId) => {
    try {
      const { error } = await supabase
        .from('fraud_alerts')
        .update({ is_resolved: true })
        .eq('id', alertId)
      
      if (error) throw error
      await get().fetchFraudAlerts()
      return true
    } catch (error) {
      set({ error: error.message })
      return false
    }
  },

  // Stats Actions
  fetchStats: async () => {
    try {
      const businessScopeId = get()._getBusinessScopeId()
      let query = supabase
        .from('sell_requests')
        .select('status, final_price, admin_offer_price, user_expected_price')

      if (businessScopeId) {
        query = query.eq('business_id', businessScopeId)
      }

      const { data: requests } = await query
      
      if (requests) {
        const totalRequests = requests.length
        const pendingRequests = requests.filter(r => 
          ['Pending', 'Reviewing'].includes(r.status)
        ).length
        const completedRequests = requests.filter(r => 
          r.status === 'Completed'
        ).length
        const totalRevenue = requests
          .filter(r => r.status === 'Completed')
          .reduce((sum, r) => sum + (r.final_price || r.admin_offer_price || r.user_expected_price || 0), 0)
        
        set({ 
          stats: { 
            totalRequests, 
            pendingRequests, 
            completedRequests, 
            totalRevenue 
          } 
        })
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  },

  updateBusinessProfile: async (businessId, updates) => {
    try {
      const { error } = await supabase
        .from('businesses')
        .update(updates)
        .eq('id', businessId)
      if (error) throw error
      await get().fetchAccessibleBusinesses()
      return true
    } catch (error) {
      console.error('Error updating business profile:', error)
      return false
    }
  },

  fetchServiceZones: async () => {
    try {
      const businessScopeId = get()._getBusinessScopeId()
      if (!businessScopeId) return []
      const { data, error } = await supabase
        .from('business_service_zones')
        .select('*')
        .eq('business_id', businessScopeId)
        .order('pincode')
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching service zones:', error)
      return []
    }
  },

  addServiceZone: async (pincode, city = '', state = '') => {
    try {
      const businessScopeId = get()._getBusinessScopeId()
      if (!businessScopeId) throw new Error('No active store scope')
      const { error } = await supabase
        .from('business_service_zones')
        .insert({
          business_id: businessScopeId,
          pincode: pincode.trim(),
          city: city.trim(),
          state: state.trim(),
          is_active: true
        })
      if (error) throw error
      return true
    } catch (error) {
      console.error('Error adding service zone:', error)
      return false
    }
  },

  removeServiceZone: async (id) => {
    try {
      const { error } = await supabase
        .from('business_service_zones')
        .delete()
        .eq('id', id)
      if (error) throw error
      return true
    } catch (error) {
      console.error('Error removing service zone:', error)
      return false
    }
  }
}))
