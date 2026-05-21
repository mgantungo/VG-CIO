// composables/useSfaOpportunities.js

import { ref, computed } from 'vue'

export const SFA_STAGES = [
  { id: 'opportunity_created', label: 'New',             icon: '📥', color: '#4589FF', next: 'contact_engaged' },
  { id: 'contact_engaged',     label: 'Contacted',       icon: '📞', color: '#33B1FF', next: 'requirement_defined' },
  { id: 'requirement_defined', label: 'Qualified',       icon: '🔍', color: '#08BDBA', next: 'quotation_created' },
  { id: 'quotation_created',   label: 'Quotation Draft', icon: '📝', color: '#9F7AEA', next: 'quotation_sent' },
  { id: 'quotation_sent',      label: 'Quotation Sent',  icon: '📤', color: '#F1C21B', next: 'negotiation' },
  { id: 'negotiation',         label: 'Negotiation',     icon: '🤝', color: '#FF7EB6', next: 'approved' },
  { id: 'approved',            label: 'Won / Approved',  icon: '✅', color: '#24A148', next: null },
  { id: 'closed_lost',         label: 'Closed Lost',     icon: '❌', color: '#C9252D', next: null },
]

export const STAGE_MAP = Object.fromEntries(SFA_STAGES.map(s => [s.id, s]))

export const OPP_STATUS = {
  new:            { label: 'New',            color: '#4589FF' },
  in_progress:    { label: 'In Progress',    color: '#33B1FF' },
  quotation_sent: { label: 'Quotation Sent', color: '#F1C21B' },
  negotiation:    { label: 'Negotiation',    color: '#FF7EB6' },
  won:            { label: 'Won',            color: '#24A148' },
  lost:           { label: 'Lost',           color: '#C9252D' },
}

export function useSfaOpportunities() {
  const config   = useRuntimeConfig()
  const API_BASE = config.public.apiBase

  const board               = ref({})
  const counts              = ref({})
  const opportunitiesList   = ref([])
  const selectedOpportunity = ref(null)
  const loading             = ref(false)
  const error               = ref(null)

  const totalOpportunities = computed(() =>
    Object.values(counts.value).reduce((s, c) => s + c, 0)
  )

  // sfaProfileDocumentId identifies the caller to every controller
  function caller() {
    return { sfaProfileDocumentId: useSfaAuth().getSfaProfileDocumentId() }
  }

  async function fetchBoard() {
    loading.value = true; error.value = null
    try {
      const res = await $fetch(`${API_BASE}/sfa-opportunities/my-board`, {
        method: 'POST', body: caller(),
      })
      board.value  = res.board  || {}
      counts.value = res.counts || {}
    } catch (e) { error.value = e?.data?.error?.message || 'Failed to load board' }
    finally      { loading.value = false }
  }

  async function fetchOpportunitiesList(filters = {}, pagination = { page: 1, pageSize: 50 }) {
    loading.value = true; error.value = null
    try {
      const res = await $fetch(`${API_BASE}/sfa-opportunities/list`, {
        method: 'POST',
        body: { ...caller(), filters, pagination },
      })
      opportunitiesList.value = Array.isArray(res) ? res : (res?.data || [])
      return opportunitiesList.value
    } catch (e) { error.value = e?.data?.error?.message || 'Failed to load'; return [] }
    finally     { loading.value = false }
  }

  async function fetchOpportunity(id) {
    loading.value = true
    try {
      const res = await $fetch(`${API_BASE}/sfa-opportunities/detail`, {
        method: 'POST', body: { ...caller(), id },
      })
      selectedOpportunity.value = res?.data || res
      return selectedOpportunity.value
    } finally { loading.value = false }
  }

  async function createOpportunity(payload) {
    const res = await $fetch(`${API_BASE}/sfa-opportunities/create`, {
      method: 'POST', body: { ...caller(), ...payload },
    })
    await fetchBoard()
    return res?.data || res
  }

  async function updateOpportunity(id, payload) {
    const res = await $fetch(`${API_BASE}/sfa-opportunities/update`, {
      method: 'POST', body: { ...caller(), id, ...payload },
    })
    await fetchBoard()
    if (selectedOpportunity.value?.id === id) await fetchOpportunity(id)
    return res?.data || res
  }

  async function changeStage(id, funnelStage) {
    const res = await $fetch(`${API_BASE}/sfa-opportunities/change-stage`, {
      method: 'POST', body: { ...caller(), id, funnel_stage: funnelStage },
    })
    await fetchBoard()
    return res?.data || res
  }

  async function markLost(id, reason = '') {
    const res = await $fetch(`${API_BASE}/sfa-opportunities/mark-lost`, {
      method: 'POST', body: { ...caller(), id, reason },
    })
    await fetchBoard()
    return res?.data || res
  }

  function moveCardOptimistic(id, fromStage, toStage) {
    const fromList = board.value[fromStage]
    if (!fromList) return
    const idx = fromList.findIndex(o => o.id == id)
    if (idx === -1) return
    const [card] = fromList.splice(idx, 1)
    if (!board.value[toStage]) board.value[toStage] = []
    board.value[toStage].unshift(card)
    counts.value[fromStage] = Math.max((counts.value[fromStage] || 1) - 1, 0)
    counts.value[toStage]   = (counts.value[toStage] || 0) + 1
  }

  return {
    board, counts, opportunitiesList, selectedOpportunity,
    loading, error, totalOpportunities,
    SFA_STAGES, STAGE_MAP, OPP_STATUS,
    fetchBoard, fetchOpportunitiesList, fetchOpportunity,
    createOpportunity, updateOpportunity, changeStage,
    markLost, moveCardOptimistic,
  }
}
