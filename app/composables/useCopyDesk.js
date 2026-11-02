// composables/useCopyDesk.js
//
// Copy Desk (stored role: sub_editor) — step 2 of the print workflow.
// Bookings for a day come straight from the clerk (cleared at booking);
// the layout itself is the existing Pager (usePager). Copy Desk clears each
// advert for design with a size (display) or without one (classifieds),
// confirms the day's layout (which locks it), and defers late adverts.
import { ref } from 'vue'
import { useRuntimeConfig } from '#imports'
import { readVgamsUser, vgamsUserHeaders, apiErrorMessage } from '~/utils/vgamsSession'

export function useCopyDesk() {
  const config = useRuntimeConfig()
  const API = config.public.apiBase

  const loading = ref(false)
  const error = ref(null)

  // quiet: background refresh — no loading flag, errors kept out of `error`
  async function call(path, body, { quiet = false, method = 'POST' } = {}) {
    if (!quiet) {
      loading.value = true
      error.value = null
    }
    try {
      return await $fetch(`${API}${path}`, {
        method,
        ...(method === 'GET' ? { query: body } : { body: { ...body, userEmail: readVgamsUser()?.email || '' } }),
        headers: vgamsUserHeaders(),
      })
    } catch (e) {
      if (!quiet) error.value = apiErrorMessage(e, 'Copy Desk request failed')
      throw e
    } finally {
      if (!quiet) loading.value = false
    }
  }

  /** Cleared print bookings running on `date`, with placement, clearance, artwork, page fill. */
  async function fetchBookingsByDate(date, { productId = null, publicationId = null, printAdClass = null, quiet = false } = {}) {
    return call('/copy-desk/bookings-by-date', {
      date,
      ...(productId ? { productId } : {}),
      ...(publicationId ? { publicationId } : {}),
      ...(printAdClass ? { printAdClass } : {}),
    }, { quiet })
  }

  /** Active size presets for a masthead (shared presets included). */
  async function fetchSizePresets(productId = null) {
    const res = await call('/copy-desk/size-presets', productId ? { productId } : {}, { method: 'GET', quiet: true })
    return res?.data || []
  }

  /** { [date]: { status: 'none'|'open'|'confirmed', layouts: [...] } } */
  async function fetchLayoutStatus(dates, productId = null) {
    const res = await call('/copy-desk/layout-status', { dates, ...(productId ? { productId } : {}) }, { quiet: true })
    return res?.data || {}
  }

  /**
   * Clear one advert for design.
   * spec: { advertId, runDates, carryForward, sizeMode: 'preset'|'custom'|'none',
   *         presetId?, columns?, heightCm?, position?, sizeDiffersReason? }
   * A different size from the booking answers 400 { code: 'size_reason_required', bookedSize }.
   */
  const clear = (spec) => call('/copy-desk/clear', spec)

  /** Confirm several adverts for one date at their booked size (classifieds with no size). */
  const clearBulk = (date, advertIds) => call('/copy-desk/clear-bulk', { date, advertIds })

  const withdraw = (advertId, runDate, reason) => call('/copy-desk/withdraw', { advertId, runDate, reason })

  const defer = (advertId, fromDate, toDate, reason) => call('/copy-desk/defer', { advertId, fromDate, toDate, reason })

  /**
   * Confirm (lock) a day layout. If placed adverts still lack artwork or
   * clearance the server answers 400 { code: 'reason_required', missing: [...] }.
   */
  const confirmLayout = (publicationId, reason = '') =>
    call('/copy-desk/confirm-layout', { publicationId, ...(reason ? { reason } : {}) })

  const reopenLayout = (publicationId, reason) => call('/copy-desk/reopen-layout', { publicationId, reason })

  /** Publications (day layouts) for one date, via the core pager-publication list. */
  async function fetchPublicationsForDate(date) {
    try {
      const res = await $fetch(`${API}/pager-publications`, {
        query: {
          'filters[publication_date][$eq]': date,
          'pagination[pageSize]': 100,
          'populate[product][fields][0]': 'product_name',
        },
      })
      return Array.isArray(res) ? res : (res?.data || [])
    } catch (e) {
      error.value = apiErrorMessage(e, 'Failed to load layouts for the day')
      return []
    }
  }

  return {
    loading,
    error,
    fetchBookingsByDate,
    fetchSizePresets,
    fetchLayoutStatus,
    clear,
    clearBulk,
    withdraw,
    defer,
    confirmLayout,
    reopenLayout,
    fetchPublicationsForDate,
  }
}
