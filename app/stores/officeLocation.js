// stores/officeLocations.js
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useOfficeLocationsStore = defineStore('officeLocations', () => {
  // State
  const locations = ref([])
  const loading = ref(false)
  const error = ref(null)
  const selectedLocation = ref(null)
    // Runtime config
  const config = useRuntimeConfig()
  const API_BASE = config.public.apiBase;

  // Fetch office locations from API
  const fetchOfficeLocations = async () => {
    loading.value = true
    error.value = null
    
    try {
      console.log('[OFFICE-STORE] Fetching office locations...')
      const response = await fetch(`${API_BASE}/advert/get-office-location`)
      const data = await response.json()
      
      console.log('[OFFICE-STORE] Raw API response:', data)
      
      // Handle the actual response structure: { success: true, data: [...], count: 1 }
      if (data.success && Array.isArray(data.data)) {
        locations.value = data.data.map(loc => ({
          id: loc.code,           // Use code as id
          code: loc.code,          // Keep the code
          name: loc.office,        // Map 'office' field to 'name' for display
          office: loc.office,      // Keep original field
          ...loc                   // Include any other fields
        }))
        console.log('[OFFICE-STORE] SUCCESS - Loaded', locations.value.length, 'locations:', locations.value)
      } else {
        console.warn('[OFFICE-STORE] Unexpected response format:', data)
        locations.value = []
        error.value = 'Invalid response format from server'
      }
      
    } catch (err) {
      error.value = err.message
      console.error('[OFFICE-STORE] Error fetching office locations:', err)
      locations.value = []
    } finally {
      loading.value = false
    }
  }

  // Set selected location
  const setSelectedLocation = (location) => {
    selectedLocation.value = location
    console.log('[OFFICE-STORE] Selected location:', location)
  }

  // Get location by code
  const getLocationByCode = (code) => {
    return locations.value.find(loc => loc.code === code) || null
  }

  // Get location name by code (helper for display)
  const getLocationName = (code) => {
    const location = getLocationByCode(code)
    return location ? location.office : code
  }

  return {
    // State
    locations,
    loading,
    error,
    selectedLocation,
    
    // Getters
    getLocationByCode,
    getLocationName,
    
    // Actions
    fetchOfficeLocations,
    setSelectedLocation
  }
})