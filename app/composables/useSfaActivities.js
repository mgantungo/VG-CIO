// composables/useSfaActivities.js
//
// activities, loading, error are module-level refs.
// This means every component that calls useSfaActivities() shares the SAME
// reactive state — the drawer's allActivities and the timeline's activities
// are the same ref, so a fetch from either updates both.

import { ref } from 'vue'

export const ACTIVITY_TYPES = [
  { id: 'call',          label: 'Phone Call',     icon: '📞', color: '#33B1FF' },
  { id: 'email',         label: 'Email',          icon: '✉️', color: '#9F7AEA' },
  { id: 'visit',         label: 'Physical Visit', icon: '🚶', color: '#08BDBA' },
  { id: 'meeting',       label: 'Meeting',        icon: '👥', color: '#F1C21B' },
  { id: 'internal_note', label: 'Internal Note',  icon: '📌', color: '#8094B8' },
]

export const ACTIVITY_TYPE_MAP = Object.fromEntries(ACTIVITY_TYPES.map(t => [t.id, t]))

// ── Module-level shared state ─────────────────────────────────────────────
const _activities = ref([])
const _loading    = ref(false)
const _error      = ref(null)

export function useSfaActivities() {
  const config   = useRuntimeConfig()
  const API_BASE = config.public.apiBase

  function caller() {
    return { sfaProfileDocumentId: useSfaAuth().getSfaProfileDocumentId() }
  }

  async function fetchActivities(opportunityId) {
    _loading.value = true
    _error.value   = null
    try {
      const res = await $fetch(`${API_BASE}/sfa-activities/by-opportunity`, {
        method: 'POST',
        body: {
          ...caller(),
          opportunityId,
          populate: ['logged_by', 'logged_by.vgams_sales_person', 'attachments'],
        },
      })
      _activities.value = Array.isArray(res) ? res : (res?.data || [])
      return _activities.value
    } catch (e) {
      _error.value = e?.data?.error?.message || 'Failed to load activities'
      return []
    } finally {
      _loading.value = false
    }
  }

  async function logActivity(payload) {
    const { attachments, ...data } = payload

    if (attachments?.length) {
      const form = new FormData()
      form.append('data', JSON.stringify({ ...caller(), ...data }))
      attachments.forEach(f => form.append('files.attachments', f))
      const res = await $fetch(`${API_BASE}/sfa-activities/log`, {
        method: 'POST', body: form,
      })
      return res?.data || res
    }

    const res = await $fetch(`${API_BASE}/sfa-activities/log`, {
      method: 'POST', body: { ...caller(), ...data },
    })
    return res?.data || res
  }

  async function fetchDueFollowUps() {
    const res = await $fetch(`${API_BASE}/sfa-activities/due-followups`, {
      method: 'POST', body: caller(),
    })
    return Array.isArray(res) ? res : (res?.data || [])
  }

  async function deleteActivity(id) {
    await $fetch(`${API_BASE}/sfa-activities/remove`, {
      method: 'POST', body: { ...caller(), id },
    })
    _activities.value = _activities.value.filter(a => a.id !== id)
  }

  return {
    activities: _activities,
    loading:    _loading,
    error:      _error,
    ACTIVITY_TYPES,
    ACTIVITY_TYPE_MAP,
    fetchActivities,
    logActivity,
    fetchDueFollowUps,
    deleteActivity,
  }
}
