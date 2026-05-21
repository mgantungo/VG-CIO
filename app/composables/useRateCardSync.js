// ~/composables/useRateCardSync.js
import { ref } from 'vue'
import { useRuntimeConfig } from '#imports'

export const useRateCardSync = () => {
  const config  = useRuntimeConfig()
  const API_BASE = config.public.apiBase

  // ── BC Resources ────────────────────────────────────────────────────────
  const bcResources = ref([])
  const isLoadingBC = ref(false)
  const bcError     = ref(null)
  const bcLoaded    = ref(false)

  // ── Rate Cards ───────────────────────────────────────────────────────────
  const rateCards   = ref([])
  const rcMeta      = ref({ page: 1, pageSize: 25, pageCount: 0, total: 0 })
  const isLoadingRC = ref(false)
  const rcError     = ref(null)

  // ── Field Update ─────────────────────────────────────────────────────────
  const isUpdating    = ref(false)
  const updateError   = ref(null)
  const updateSuccess = ref(null)

  // ─────────────────────────────────────────────────────────────────────────
  const getAuthHeaders = () => {
    try {
      const user  = JSON.parse(localStorage.getItem('vgams_user') || '{}')
      const token = user?.jwt || user?.token
      return token ? { Authorization: `Bearer ${token}` } : {}
    } catch { return {} }
  }

  // ── Fetch all BC resources from analyzeResources endpoint ─────────────────
  const fetchBCResources = async () => {
    isLoadingBC.value = true
    bcError.value     = null
    try {
      const res = await $fetch(`${API_BASE}/rate-cards/analyzeResources`, {
        headers: getAuthHeaders()
      })
      bcResources.value = res.data?.value || []
      bcLoaded.value    = true
    } catch (err) {
      bcError.value = err?.data?.message || err?.message || 'Failed to load BC resources'
    } finally {
      isLoadingBC.value = false
    }
  }

  // ── Fetch Strapi rate cards with pagination + search ──────────────────────
  const fetchRateCards = async ({ page = 1, pageSize = 25, search = '' } = {}) => {
  isLoadingRC.value = true
  rcError.value     = null
  try {
    // Build URL parameters manually
    const params = new URLSearchParams()
    params.append('pagination[page]', page)
    params.append('pagination[pageSize]', pageSize)
    params.append('populate[product][fields][0]', 'product_name')
    params.append('populate[product][fields][1]', 'product_id')
    
    if (search.trim()) {
      params.append('filters[$or][0][ad_type][$containsi]', search)
      params.append('filters[$or][1][full_color_no][$containsi]', search)
      params.append('filters[$or][2][black_color_no][$containsi]', search)
    }
    
    const res = await $fetch(`${API_BASE}/rate-cards?${params.toString()}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    })
    
    rateCards.value = res.data || []
    if (res.meta?.pagination) rcMeta.value = res.meta.pagination
  } catch (err) {
    console.error('Fetch error:', err)
    rcError.value = err?.data?.error?.message || err?.data?.message || err?.message || 'Failed to load rate cards'
  } finally {
    isLoadingRC.value = false
  }
}

  // ── PATCH a single rate card's fields ─────────────────────────────────────
  const updateRateCardFields = async (id, fields) => {
    isUpdating.value    = true
    updateError.value   = null
    updateSuccess.value = null
    try {
      const res = await $fetch(`${API_BASE}/rate-cards/${id}/fields`, {
        method:  'PATCH',
        body:    { fields },
        headers: getAuthHeaders()
      })
      updateSuccess.value = res.message || `Rate card #${id} updated`
      return res
    } catch (err) {
      updateError.value = err?.data?.error?.message || err?.data?.message || err?.message || 'Update failed'
      throw err
    } finally {
      isUpdating.value = false
    }
  }

  return {
    // BC Resources
    bcResources, isLoadingBC, bcError, bcLoaded,
    fetchBCResources,

    // Rate Cards
    rateCards, rcMeta, isLoadingRC, rcError,
    fetchRateCards,

    // Field update
    isUpdating, updateError, updateSuccess,
    updateRateCardFields,
  }
}