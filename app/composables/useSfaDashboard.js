// composables/useSfaDashboard.js

import { ref } from 'vue'

export function useSfaDashboard() {
  const config   = useRuntimeConfig()
  const API_BASE = config.public.apiBase

  const myStats         = ref(null)
  const managementStats = ref(null)
  const teamRanking     = ref([])
  const funnelData      = ref([])
  const loading         = ref(false)
  const error           = ref(null)

  function caller() {
    return { sfaProfileDocumentId: useSfaAuth().getSfaProfileDocumentId() }
  }

  async function fetchMyStats() {
    loading.value = true; error.value = null
    try {
      const res = await $fetch(`${API_BASE}/sfa-dashboard/my-stats`, {
        method: 'POST', body: caller(),
      })
      myStats.value = res?.data || res
      return myStats.value
    } catch (e) { error.value = e?.data?.error?.message || 'Failed to load stats' }
    finally     { loading.value = false }
  }

  async function fetchManagementStats(filters = {}) {
    loading.value = true; error.value = null
    try {
      const res = await $fetch(`${API_BASE}/sfa-dashboard/management-stats`, {
        method: 'POST', body: { ...caller(), filters },
      })
      const data = res?.data || res
      managementStats.value = data
      teamRanking.value     = data?.team_ranking  || []
      funnelData.value      = data?.funnel_counts || {}
      return data
    } catch (e) { error.value = e?.data?.error?.message || 'Failed to load stats' }
    finally     { loading.value = false }
  }

  async function fetchFollowUpSummary() {
    const res = await $fetch(`${API_BASE}/sfa-dashboard/followup-summary`, {
      method: 'POST', body: caller(),
    })
    return res?.data || res
  }

  return {
    myStats, managementStats, teamRanking, funnelData, loading, error,
    fetchMyStats, fetchManagementStats, fetchFollowUpSummary,
  }
}
