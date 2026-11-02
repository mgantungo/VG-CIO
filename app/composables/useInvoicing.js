// composables/useInvoicing.js
//
// Invoicing Officer — step 5. Every call sends x-user-email; the server
// accepts invoicing_officer, finance_team and administrator.
import { ref } from 'vue'
import { useRuntimeConfig } from '#imports'
import { readVgamsUser, vgamsUserHeaders, apiErrorMessage } from '~/utils/vgamsSession'

export const INVOICE_STAGES = [
  { key: 'ready', label: 'Ready to confirm' },
  { key: 'confirmed', label: 'Ready to invoice' },
  { key: 'held', label: 'Held back' },
  { key: 'invoiced', label: 'Invoiced' },
]

export function useInvoicing() {
  const config = useRuntimeConfig()
  const API = config.public.apiBase

  const loading = ref(false)
  const error = ref(null)

  async function post(path, body = {}) {
    loading.value = true
    error.value = null
    try {
      return await $fetch(`${API}${path}`, {
        method: 'POST',
        body: { ...body, userEmail: readVgamsUser()?.email || '' },
        headers: vgamsUserHeaders(),
      })
    } catch (e) {
      error.value = apiErrorMessage(e, 'Invoicing request failed')
      throw e
    } finally {
      loading.value = false
    }
  }

  /** { groups, totals, stages, data } for one stage in a run-date range */
  const fetchQueue = ({ startDate, endDate, stage = 'ready', paymentMethod = null, productId = null } = {}) =>
    post('/invoicing/queue', {
      startDate, endDate, stage,
      ...(paymentMethod ? { paymentMethod } : {}),
      ...(productId ? { productId } : {}),
    })

  const fetchSummary = ({ startDate, endDate } = {}) => post('/invoicing/summary', { startDate, endDate })

  const confirm = (advertId, notes = '') => post(`/invoicing/${advertId}/confirm`, { notes })

  const invoice = (advertId, { dueDate = null, notes = '', confirmFirst = false } = {}) =>
    post(`/invoicing/${advertId}/invoice`, {
      ...(dueDate ? { dueDate } : {}),
      notes,
      ...(confirmFirst ? { confirm: true } : {}),
    })

  /** action: 'confirm' | 'invoice' | 'confirm_and_invoice' */
  const bulk = (advertIds, action, { dueDate = null, notes = '' } = {}) =>
    post('/invoicing/bulk', { advertIds, action, ...(dueDate ? { dueDate } : {}), notes })

  return { loading, error, fetchQueue, fetchSummary, confirm, invoice, bulk }
}
