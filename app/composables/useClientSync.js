// ~/composables/useClientSync.js
import { ref } from 'vue'
import { useRuntimeConfig } from '#imports'

export const useClientSync = () => {
  const isLoading = ref(false)
  const syncResult = ref(null)
  const syncError = ref(null)
  const config = useRuntimeConfig()

  const API_BASE = config.public.apiBase

  /**
   * Sync clients from Business Central to Strapi
   * @param {boolean} insertNew - If true, insert new clients; if false, dry run
   * @returns {Promise<Object>} Sync results
   */
  const syncClientsFromBC = async (insertNew = true) => {
    isLoading.value = true
    syncError.value = null
    syncResult.value = null

    try {
      // Get auth token from localStorage if needed
      const vgamsUser = JSON.parse(localStorage.getItem('vgams_user'))
      if (!vgamsUser?.id) {
        throw new Error('User not authenticated')
      }

      // Make the API request using $fetch (Nuxt's native fetch)
      const response = await $fetch(`${API_BASE}/clients/sync-from-bc`, {
        method: 'POST',
        params: { insertNew: insertNew },
        headers: {
          'Content-Type': 'application/json'
        }
      })

      syncResult.value = response
      return response
    } catch (error) {
      console.error('Client sync error:', error)
      
      // Handle specific error cases
      if (error.response?.status === 404) {
        syncError.value = 'Sync endpoint not found (404). Please ensure the custom API route is properly registered in Strapi.'
      } else if (error.response?.status === 401) {
        syncError.value = 'Authentication failed. Please log in again.'
      } else if (error.response?.status === 400) {
        syncError.value = error.data?.message || 'Invalid request. Please check server configuration.'
      } else {
        syncError.value = error.message || 'Failed to sync clients from Business Central'
      }
      
      throw error
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Dry run - validate without inserting
   * @returns {Promise<Object>} Validation results
   */
  const validateClientsOnly = async () => {
    return syncClientsFromBC(false)
  }

  /**
   * Clear sync results
   */
  const clearResults = () => {
    syncResult.value = null
    syncError.value = null
  }

  /**
   * Format duration from milliseconds to readable string
   */
  const formatDuration = (ms) => {
    if (!ms) return 'N/A'
    if (ms < 1000) return `${ms}ms`
    const seconds = Math.floor(ms / 1000)
    if (seconds < 60) return `${seconds}.${Math.floor((ms % 1000) / 100)}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  return {
    // State
    isLoading,
    syncResult,
    syncError,
    
    // Methods
    syncClientsFromBC,
    validateClientsOnly,
    clearResults,
    formatDuration
  }
}