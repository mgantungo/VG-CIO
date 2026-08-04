// composables/useBcTestBypass.js
import { ref } from 'vue'

/**
 * Standalone composable for the BC test-bypass admin tool.
 * Deliberately separate from useDesignHouse — this hits a different,
 * dev/test-only controller (bc-test.js) gated by ALLOW_BC_TEST_BYPASS,
 * not the design-house/design-batch domain.
 */
export function useBcTestBypass() {
  const config = useRuntimeConfig()
  const API_BASE = config.public.apiBase

  const loading = ref(false)
  const error   = ref(null)

  async function request(path, opts = {}) {
    loading.value = true
    error.value = null
    try {
      return await $fetch(`${API_BASE}${path}`, opts)
    } catch (e) {
      const serverMessage = e?.data?.message || e?.data?.error?.message
      error.value = serverMessage || e.message || 'Request failed'
      console.error(`[useBcTestBypass] ${opts.method || 'GET'} ${path} failed:`, e?.data ?? e)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * GET /bc/test/lookup/:bc_reference_number
   * Pulls current field values so the form can be pre-filled before editing.
   */
  async function lookupByBcReference(bcReferenceNumber) {
    return request(`/bc/test/lookup/${encodeURIComponent(bcReferenceNumber)}`, { method: 'GET' })
  }

  /**
   * POST /bc/test/mark-paid
   * Body: { bc_reference_number, isPaid?, isActive?, start_date?, end_date?, publishing_dates? }
   * Only fields actually present in `payload` get updated server-side.
   */
  async function markPaidForTesting(payload) {
    return request('/bc/test/mark-paid', {
      method: 'POST',
      body: payload,
    })
  }

  return {
    loading,
    error,
    lookupByBcReference,
    markPaidForTesting,
  }
}