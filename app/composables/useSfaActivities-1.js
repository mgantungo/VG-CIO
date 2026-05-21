// composables/useSfaActivities.js

import { ref } from 'vue'

export const ACTIVITY_TYPES = [
  { id: 'call',          label: 'Phone Call',     icon: '📞', color: '#33B1FF' },
  { id: 'email',         label: 'Email',          icon: '✉️', color: '#9F7AEA' },
  { id: 'visit',         label: 'Physical Visit', icon: '🚶', color: '#08BDBA' },
  { id: 'meeting',       label: 'Meeting',        icon: '👥', color: '#F1C21B' },
  { id: 'internal_note', label: 'Internal Note',  icon: '📌', color: '#8094B8' },
]

export const ACTIVITY_TYPE_MAP = Object.fromEntries(ACTIVITY_TYPES.map(t => [t.id, t]))

export function useSfaActivities() {
  const config   = useRuntimeConfig()
  const API_BASE = config.public.apiBase

  const activities = ref([])
  const loading    = ref(false)
  const error      = ref(null)

  function caller() {
    return { sfaProfileDocumentId: useSfaAuth().getSfaProfileDocumentId() }
  }

  async function fetchActivities(opportunityId) {
    loading.value = true; error.value = null
    try {
      const res = await $fetch(`${API_BASE}/sfa-activities/by-opportunity`, {
        method: 'POST',
        body: { ...caller(), opportunityId, populate: ['logged_by', 'attachments'] },
      })
      activities.value = Array.isArray(res) ? res : (res?.data || [])
      return activities.value
    } catch (e) { error.value = e?.data?.error?.message || 'Failed to load'; return [] }
    finally     { loading.value = false }
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
    activities.value = activities.value.filter(a => a.id !== id)
  }

  return {
    activities, loading, error,
    ACTIVITY_TYPES, ACTIVITY_TYPE_MAP,
    fetchActivities, logActivity, fetchDueFollowUps, deleteActivity,
  }
}
