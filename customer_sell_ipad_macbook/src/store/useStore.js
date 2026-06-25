import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useStore = create((set, get) => ({
  // Agent State
  agent: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  activeBusinessId: null,

  // Pickups State
  assignedPickups: [],
  completedPickups: [],
  selectedPickup: null,

  // Stats
  stats: {
    pending: 0,
    enRoute: 0,
    arrived: 0,
    completed: 0,
    totalEarnings: 0,
  },

  // ============ AUTH ACTIONS ============
  login: async (email, password) => {
    set({ isLoading: true, error: null })
    try {
      // Check if agent exists and is active
      const { data: agentData, error: agentError } = await supabase
        .from('agents')
        .select('*')
        .eq('email', email)
        .eq('is_active', true)
        .maybeSingle()

      if (agentError || !agentData) {
        throw new Error('Agent not found or inactive. Contact admin.')
      }

      // Sign in with Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // Store agent data
      localStorage.setItem('agent_id', agentData.id)
      set({
        agent: agentData,
        activeBusinessId: agentData.business_id || null,
        isAuthenticated: true,
        isLoading: false,
      })

      // Fetch pickups after login
      await get().fetchAssignedPickups()
      return true
    } catch (error) {
      set({ error: error.message, isLoading: false })
      return false
    }
  },

  logout: async () => {
    const { agent } = get()
    if (agent) {
      // Set agent offline
      try {
        await supabase
          .from('agent_locations')
          .update({ is_online: false })
          .eq('agent_id', agent.id)
      } catch (e) {
        console.error('Failed to set offline:', e)
      }
    }

    await supabase.auth.signOut()
    localStorage.removeItem('agent_id')
    set({
      agent: null,
      activeBusinessId: null,
      isAuthenticated: false,
      assignedPickups: [],
      completedPickups: [],
      selectedPickup: null,
    })
  },

  checkAuth: async () => {
    try {
      const agentId = localStorage.getItem('agent_id')
      if (!agentId) {
        set({ agent: null, isAuthenticated: false })
        return false
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        localStorage.removeItem('agent_id')
        set({ agent: null, isAuthenticated: false })
        return false
      }

      // Fetch agent data
      const { data: agentData } = await supabase
        .from('agents')
        .select('*')
        .eq('id', agentId)
        .single()

      if (agentData) {
        set({ agent: agentData, activeBusinessId: agentData.business_id || null, isAuthenticated: true })
        await get().fetchAssignedPickups()
        return true
      }

      set({ agent: null, isAuthenticated: false })
      return false
    } catch {
      set({ agent: null, isAuthenticated: false })
      return false
    }
  },

  resetPassword: async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email)
      if (error) throw error
      return true
    } catch (error) {
      set({ error: error.message })
      return false
    }
  },

  // ============ PICKUPS ACTIONS ============
  fetchAssignedPickups: async () => {
    const { agent } = get()
    if (!agent) return

    set({ isLoading: true })
    try {
      const businessScopeId = get().activeBusinessId || agent.business_id || null

      // Fetch active pickups
      let activeQuery = supabase
        .from('sell_requests')
        .select('*, users!sell_requests_user_id_fkey(id, name, phone, email)')
        .eq('assigned_agent_id', agent.id)
        .not('status', 'in', '("Completed", "Rejected", "Cancelled")')
        .order('pickup_scheduled_time', { ascending: true })

      if (businessScopeId) {
        activeQuery = activeQuery.eq('business_id', businessScopeId)
      }

      const { data: activePickups, error: activeError } = await activeQuery

      if (activeError) throw activeError

      // Fetch completed pickups (last 20)
      let completedQuery = supabase
        .from('sell_requests')
        .select('*, users!sell_requests_user_id_fkey(id, name, phone, email)')
        .eq('assigned_agent_id', agent.id)
        .eq('status', 'Completed')
        .order('updated_at', { ascending: false })
        .limit(20)

      if (businessScopeId) {
        completedQuery = completedQuery.eq('business_id', businessScopeId)
      }

      const { data: completed, error: completedError } = await completedQuery

      if (completedError) throw completedError

      // Calculate stats
      const pending = activePickups.filter(p =>
        ['Pickup_Scheduled', 'Offer_Accepted', 'Agent_Assigned'].includes(p.status)
      ).length
      const enRoute = activePickups.filter(p => p.status === 'Agent_En_Route').length
      const arrived = activePickups.filter(p => p.status === 'Agent_Arrived').length
      const totalEarnings = completed.reduce((sum, p) =>
        sum + (p.final_price || p.admin_offer_price || 0), 0
      )

      set({
        assignedPickups: activePickups || [],
        completedPickups: completed || [],
        stats: {
          pending,
          enRoute,
          arrived,
          completed: completed.length,
          totalEarnings,
        },
        isLoading: false,
      })
    } catch (error) {
      set({ error: error.message, isLoading: false })
    }
  },

  selectPickup: (pickup) => set({ selectedPickup: pickup }),

  updatePickupStatus: async (requestId, newStatus) => {
    const { agent } = get()
    if (!agent) return false

    set({ isLoading: true })
    try {
      // Map status
      const statusMap = {
        'en_route': 'Agent_En_Route',
        'arrived': 'Agent_Arrived',
        'picked_up': 'Picked_Up',
        'completed': 'Completed',
      }
      const dbStatus = statusMap[newStatus] || newStatus

      // Update sell_requests
      const { error } = await supabase
        .from('sell_requests')
        .update({ status: dbStatus, updated_at: new Date().toISOString() })
        .eq('id', requestId)

      if (error) throw error

      // Update agent_tracking
      await get().updateAgentTracking(requestId, newStatus)

      // Refresh pickups
      await get().fetchAssignedPickups()

      set({ isLoading: false })
      return true
    } catch (error) {
      set({ error: error.message, isLoading: false })
      return false
    }
  },

  updateAgentTracking: async (requestId, newStatus) => {
    const { agent, assignedPickups } = get()
    if (!agent) return

    try {
      const pickup = assignedPickups.find(p => p.id === requestId)
      const now = new Date().toISOString()

      const data = {
        pickup_status: newStatus,
        updated_at: now,
      }

      if (newStatus === 'en_route') data.started_at = now
      else if (newStatus === 'arrived') data.actual_arrival_time = now
      else if (newStatus === 'completed') data.completed_at = now

      // Check if tracking record exists
      const { data: existing } = await supabase
        .from('agent_tracking')
        .select('id')
        .eq('sell_request_id', requestId)
        .maybeSingle()

      if (existing) {
        await supabase
          .from('agent_tracking')
          .update(data)
          .eq('sell_request_id', requestId)
      } else {
        await supabase.from('agent_tracking').insert({
          sell_request_id: requestId,
          agent_id: agent.id,
          ...data,
        })
      }
    } catch (e) {
      console.error('Failed to update tracking:', e)
    }
  },

  // ============ VERIFICATION ============

  // ============ GEOLOCATION ============
  geoWatchId: null,

  startLocationTracking: (requestId) => {
    const { agent, geoWatchId } = get()
    if (!agent || geoWatchId || !navigator.geolocation) return

    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        try {
          const { data: existing } = await supabase
            .from('agent_tracking')
            .select('id')
            .eq('sell_request_id', requestId)
            .maybeSingle()

          const locationData = {
            agent_latitude: latitude,
            agent_longitude: longitude,
            location_updated_at: new Date().toISOString(),
          }

          if (existing) {
            await supabase.from('agent_tracking').update(locationData).eq('sell_request_id', requestId)
          }
        } catch (e) {
          console.error('Location push failed:', e)
        }
      },
      (err) => console.error('Geolocation error:', err),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
    )
    set({ geoWatchId: watchId })
  },

  stopLocationTracking: () => {
    const { geoWatchId } = get()
    if (geoWatchId !== null) {
      navigator.geolocation.clearWatch(geoWatchId)
      set({ geoWatchId: null })
    }
  },

  uploadVerificationPhoto: async (file, requestId) => {
    try {
      const fileName = `${Date.now()}_${file.name}`
      const path = `agent_verifications/${requestId}/${fileName}`
      const { error } = await supabase.storage.from('device-photos').upload(path, file)
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from('device-photos').getPublicUrl(path)
      return publicUrl
    } catch (error) {
      console.error('Verification photo upload failed:', error)
      return null
    }
  },

  submitVerification: async (requestId, verificationData) => {
    const { agent } = get()
    if (!agent) return false

    set({ isLoading: true })
    try {
      const { error } = await supabase
        .from('sell_requests')
        .update({
          condition_answers: verificationData.verifiedConditions,
          status: 'Completed',
          final_price: verificationData.revisedPrice,
          admin_offer_price: verificationData.revisedPrice,
          admin_notes: verificationData.agentNotes
            ? `Agent verification: ${verificationData.agentNotes}`
            : `Verified by agent. Price revised from ₹${verificationData.originalPrice || 0} to ₹${verificationData.revisedPrice}`,
          bank_details: {
            upi_id: verificationData.upiId || null,
            payment_barcode_url: verificationData.paymentBarcodeUrl || null,
            payment_done: false,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId)

      if (error) throw error

      // Update agent_tracking
      await get().updateAgentTracking(requestId, 'completed')

      // Refresh
      await get().fetchAssignedPickups()
      set({ isLoading: false })
      return true
    } catch (error) {
      set({ error: error.message, isLoading: false })
      return false
    }
  },

  // ============ PROFILE ACTIONS ============
  updateProfile: async (updates) => {
    const { agent } = get()
    if (!agent) return false

    try {
      const { error } = await supabase
        .from('agents')
        .update(updates)
        .eq('id', agent.id)

      if (error) throw error

      set({ agent: { ...agent, ...updates } })
      return true
    } catch (error) {
      set({ error: error.message })
      return false
    }
  },

  // ============ LOCATION ============
  updateLocation: async (latitude, longitude) => {
    const { agent } = get()
    if (!agent) return

    try {
      await supabase.from('agent_locations').upsert({
        agent_id: agent.id,
        latitude,
        longitude,
        is_online: true,
        last_updated: new Date().toISOString(),
      }, { onConflict: 'agent_id' })

      await supabase.from('agents').update({
        current_lat: latitude,
        current_lng: longitude,
        last_location_update: new Date().toISOString(),
      }).eq('id', agent.id)
    } catch (e) {
      console.error('Location update failed:', e)
    }
  },
}))
