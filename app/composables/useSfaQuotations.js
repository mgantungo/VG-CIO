// composables/useSfaQuotations.js

import { ref } from 'vue'

export const QUOTATION_STATUSES = {
  draft:            { label: 'Draft',            color: '#8094B8', bg: '#F0F4FA' },
  pending_approval: { label: 'Pending Approval', color: '#B07D10', bg: '#FFF8E6' },
  approved:         { label: 'Approved',         color: '#1A8A3C', bg: '#EDFAF2' },
  sent_to_client:   { label: 'Sent to Client',   color: '#0066CC', bg: '#E8F0FB' },
  revised:          { label: 'Revised',          color: '#9F7AEA', bg: '#F4EFFE' },
  rejected:         { label: 'Rejected',         color: '#C9252D', bg: '#FFF0F0' },
  accepted:         { label: 'Accepted',         color: '#24A148', bg: '#EDFAF2' },
}

export const SEND_CHANNELS = [
  { id: 'email',    label: 'Email' },
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'manual',   label: 'Manual / In-person' },
  { id: 'other',    label: 'Other' },
]

export function useSfaQuotations() {
  const config   = useRuntimeConfig()
  const API_BASE = config.public.apiBase

  const quotations     = ref([])
  const communications = ref([])
  const loading        = ref(false)
  const error          = ref(null)

  function caller() {
    return { sfaProfileDocumentId: useSfaAuth().getSfaProfileDocumentId() }
  }

  async function fetchQuotations(opportunityId) {
    loading.value = true; error.value = null
    try {
      const res = await $fetch(`${API_BASE}/sfa-quotations/by-opportunity`, {
        method: 'POST',
        body: { ...caller(), opportunityId,
          populate: ['items', 'items.buy_in', 'submitted_by', 'reviewed_by', 'parent_quotation', 'pdf_document'] },
      })
      const raw = Array.isArray(res) ? res : (res?.data || [])
      quotations.value = raw.sort((a, b) => (b.version || 1) - (a.version || 1))
      return quotations.value
    } catch (e) { error.value = e?.data?.error?.message || 'Failed to load'; return [] }
    finally     { loading.value = false }
  }

  async function fetchPendingApproval() {
    const res = await $fetch(`${API_BASE}/sfa-quotations/pending-approval`, {
      method: 'POST',
      body: { ...caller(), populate: ['opportunity', 'opportunity.company', 'submitted_by'] },
    })
    return Array.isArray(res) ? res : (res?.data || [])
  }

  async function createQuotation(payload) {
    const res = await $fetch(`${API_BASE}/sfa-quotations/create`, {
      method: 'POST', body: { ...caller(), ...payload },
    })
    return res?.data || res
  }

  async function updateQuotation(id, payload) {
    const res = await $fetch(`${API_BASE}/sfa-quotations/update`, {
      method: 'POST', body: { ...caller(), id, ...payload },
    })
    return res?.data || res
  }

  async function submitForApproval(quotationId) {
    const res = await $fetch(`${API_BASE}/sfa-quotations/submit-for-approval`, {
      method: 'POST', body: { ...caller(), quotationId },
    })
    return res?.data || res
  }

  async function approveQuotation(quotationId, comment = '') {
    const res = await $fetch(`${API_BASE}/sfa-quotations/approve`, {
      method: 'POST', body: { ...caller(), quotationId, comment },
    })
    return res?.data || res
  }

  async function rejectQuotation(quotationId, comment) {
    const res = await $fetch(`${API_BASE}/sfa-quotations/reject`, {
      method: 'POST', body: { ...caller(), quotationId, comment },
    })
    return res?.data || res
  }

  async function reviseQuotation(quotationId, { items, total_amount, notes }) {
    const res = await $fetch(`${API_BASE}/sfa-quotations/revise`, {
      method: 'POST', body: { ...caller(), quotationId, items, total_amount, notes },
    })
    return res?.data || res
  }

  async function recordSend({ quotationId, channel, sentAt, notes = '' }) {
    const res = await $fetch(`${API_BASE}/sfa-quotation-communications/record-send`, {
      method: 'POST', body: { ...caller(), quotationId, channel, sentAt, notes },
    })
    return res?.data || res
  }

  async function recordClientResponse({ quotationId, clientResponse, negotiationNotes, responseDate }) {
    const res = await $fetch(`${API_BASE}/sfa-quotation-communications/record-response`, {
      method: 'POST', body: { ...caller(), quotationId, clientResponse, negotiationNotes, responseDate },
    })
    return res?.data || res
  }

  async function fetchCommunications(quotationId) {
    const res = await $fetch(`${API_BASE}/sfa-quotation-communications/by-quotation`, {
      method: 'POST', body: { ...caller(), quotationId, populate: ['sent_by', 'attachments'] },
    })
    communications.value = Array.isArray(res) ? res : (res?.data || [])
    return communications.value
  }

  async function uploadPdf(quotationId, file) {
    const form = new FormData()
    form.append('sfaProfileDocumentId', useSfaAuth().getSfaProfileDocumentId())
    form.append('quotationId', quotationId)
    form.append('files.pdf_document', file)
    const res = await $fetch(`${API_BASE}/sfa-quotations/upload-pdf`, {
      method: 'POST', body: form,
    })
    return res?.data || res
  }

  function computeTotal(items) {
    return items.reduce((s, i) => s + (parseFloat(i.quantity) || 0) * (parseFloat(i.unit_price) || 0), 0)
  }

  function formatCurrency(amount, currency = 'UGX') {
    return `${currency} ${Number(amount || 0).toLocaleString('en-UG')}`
  }

  return {
    quotations, communications, loading, error,
    QUOTATION_STATUSES, SEND_CHANNELS,
    fetchQuotations, fetchPendingApproval,
    createQuotation, updateQuotation,
    submitForApproval, approveQuotation, rejectQuotation, reviseQuotation,
    recordSend, recordClientResponse, fetchCommunications,
    uploadPdf, computeTotal, formatCurrency,
  }
}
