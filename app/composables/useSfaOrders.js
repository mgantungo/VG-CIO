// composables/useSfaOrders.js

import { ref } from 'vue'

export const CONFIRMATION_TYPES = [
  { id: 'lpo',                label: 'LPO (Local Purchase Order)' },
  { id: 'email_confirmation', label: 'Email Confirmation' },
  { id: 'signed_quotation',   label: 'Signed Quotation' },
]

export const ORDER_STATUSES = {
  active:        { label: 'Active',        color: '#0066CC', bg: '#E8F0FB' },
  in_production: { label: 'In Production', color: '#B07D10', bg: '#FFF8E6' },
  completed:     { label: 'Completed',     color: '#1A8A3C', bg: '#EDFAF2' },
  cancelled:     { label: 'Cancelled',     color: '#C9252D', bg: '#FFF0F0' },
}

export function useSfaOrders() {
  const config   = useRuntimeConfig()
  const API_BASE = config.public.apiBase

  const orders        = ref([])
  const selectedOrder = ref(null)
  const loading       = ref(false)
  const error         = ref(null)

  function caller() {
    return { sfaProfileDocumentId: useSfaAuth().getSfaProfileDocumentId() }
  }

  async function convertToOrder({ opportunityId, quotationId, confirmationType, notes = '', confirmationFiles = [] }) {
    const form = new FormData()
    form.append('sfaProfileDocumentId', useSfaAuth().getSfaProfileDocumentId())
    form.append('opportunityId',    opportunityId)
    form.append('quotationId',      quotationId)
    form.append('confirmationType', confirmationType)
    if (notes) form.append('notes', notes)
    confirmationFiles.forEach(f => form.append('files.confirmation_document', f))

    const res = await $fetch(`${API_BASE}/sfa-orders/convert`, {
      method: 'POST', body: form,
    })
    return res // { order, client, clientIsNew }
  }

  async function fetchOrders(filters = {}, pagination = { page: 1, pageSize: 50 }) {
    loading.value = true; error.value = null
    try {
      const res = await $fetch(`${API_BASE}/sfa-orders/list`, {
        method: 'POST',
        body: {
          ...caller(), filters, pagination,
          populate: ['opportunity', 'opportunity.company', 'opportunity.existing_client',
                     'accepted_quotation', 'client', 'converted_by'],
        },
      })
      orders.value = Array.isArray(res) ? res : (res?.data || [])
      return orders.value
    } catch (e) { error.value = e?.data?.error?.message || 'Failed to load'; return [] }
    finally     { loading.value = false }
  }

  async function fetchOrderDetail(orderId) {
    loading.value = true
    try {
      const res = await $fetch(`${API_BASE}/sfa-orders/detail`, {
        method: 'POST',
        body: {
          ...caller(), id: orderId,
          populate: ['opportunity', 'opportunity.company', 'opportunity.existing_client',
                     'opportunity.contacts', 'accepted_quotation', 'accepted_quotation.items',
                     'accepted_quotation.items.buy_in', 'client', 'converted_by', 'confirmation_document'],
        },
      })
      selectedOrder.value = res?.data || res
      return selectedOrder.value
    } finally { loading.value = false }
  }

  async function updateOrderStatus(orderId, status) {
    const res = await $fetch(`${API_BASE}/sfa-orders/update-status`, {
      method: 'POST', body: { ...caller(), orderId, status },
    })
    return res?.data || res
  }

  return {
    orders, selectedOrder, loading, error,
    CONFIRMATION_TYPES, ORDER_STATUSES,
    convertToOrder, fetchOrders, fetchOrderDetail, updateOrderStatus,
  }
}
