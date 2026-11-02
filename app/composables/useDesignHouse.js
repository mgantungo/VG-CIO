// composables/useDesignHouse.js
import { ref } from 'vue'
import { readVgamsUser, vgamsUserHeaders } from '~/utils/vgamsSession'

export function useDesignHouse() {
  const config = useRuntimeConfig()
  const API_BASE    = config.public.apiBase
  const UPLOAD_BASE  = config.public.uploadBase

  const loading = ref(false)
  const error   = ref(null)

  // Resolve a Strapi media url (relative "/uploads/xyz.pdf") against the upload host.
  function resolveUrl(url) {
    if (!url) return ''
    if (/^https?:\/\//i.test(url)) return url
    return `${UPLOAD_BASE || ''}${url}`
  }

  async function request(path, opts = {}) {
    loading.value = true
    error.value = null
    try {
      return await $fetch(`${API_BASE}${path}`, opts)
    } catch (e) {
      const serverMessage = e?.data?.message || e?.data?.error?.message
      error.value = serverMessage || e.message || 'Request failed'
      console.error(`[useDesignHouse] ${opts.method || 'GET'} ${path} failed:`, e?.data ?? e)
      throw e
    } finally {
      loading.value = false
    }
  }

  // ── Design House (advert-level) ───────────────────────────────────────────

  /** Day-first working view — every advert booked to run on one exact date. */
  async function fetchBookingsByDate(date, productId = null, scope = 'print') {
    return request('/design-house/adverts/by-date', {
      method: 'POST',
      body: { date, ...(productId ? { productId } : {}), scope },
    })
  }

  /** Full "still pending, across all dates" queue. */
  async function fetchActiveAdverts(startDate = null, endDate = null, productId = null, scope = 'print') {
    return request('/design-house/active-adverts', {
      method: 'POST',
      body: {
        ...(startDate ? { startDate } : {}),
        ...(endDate ? { endDate } : {}),
        ...(productId ? { productId } : {}),
        scope,
      },
    })
  }

  async function fetchDesignStats(startDate = null, endDate = null, productId = null, scope = 'print') {
    return request('/design-house/stats', {
      method: 'POST',
      body: {
        ...(startDate ? { startDate } : {}),
        ...(endDate ? { endDate } : {}),
        ...(productId ? { productId } : {}),
        scope,
      },
    })
  }

  /** Products for the product filter dropdown, scoped by category (defaults to print). */
  async function fetchProducts(scope = 'print') {
    return request('/design-house/products', { method: 'GET', params: { scope } })
  }

  /** Every product category that exists — powers the scope radio buttons dynamically. */
  async function fetchProductCategories() {
    return request('/design-house/product-categories', { method: 'GET' })
  }

  async function fetchAdvertDetails(advertId) {
    return request(`/design-house/adverts/${advertId}`, { method: 'GET' })
  }

  async function markDesignComplete(advertId, notes = '', designerEmail = '') {
    return request(`/design-house/adverts/${advertId}/complete`, {
      method: 'POST',
      body: { notes, designerEmail },
    })
  }

  /**
   * Reverse an accidental "mark as complete". bcCodeSuffix is whatever the
   * user typed in step 1 of the confirmation flow (with or without the
   * "B-SO-" prefix) - the server does the real re-verification against
   * this advert's actual bc_reference_number.
   */
  async function unmarkDesignComplete(advertId, bcCodeSuffix, notes = '') {
    return request(`/design-house/adverts/${advertId}/unmark-complete`, {
      method: 'POST',
      body: { bcCodeSuffix, notes },
    })
  }

  // ── Design Batches ───────────────────────────────────────────────────────
  // Matches design-batch.js exactly: camelCase body fields, label required
  // on create, one advert per call for group membership, dedicated upload
  // and status-transition endpoints rather than a single "update" catch-all.

  /** POST /design-batches — body: { label, targetRunDate, designerId?, notes? } */
  async function createBatch({ label, targetRunDate, designerId = null, notes = null }) {
    return request('/design-batches', {
      method: 'POST',
      body: { label, targetRunDate, designerId, notes },
    })
  }

  /** GET /design-batches?status=&date= */
  async function listBatches({ status = null, date = null } = {}) {
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    if (date) params.set('date', date)
    const qs = params.toString()
    return request(`/design-batches${qs ? `?${qs}` : ''}`, { method: 'GET' })
  }

  /** GET /design-batches/:id — full detail, enriched adverts, dailySchedules */
  async function getBatchDetail(batchId) {
    return request(`/design-batches/${batchId}`, { method: 'GET' })
  }

  /** PUT /design-batches/:id — body: any of { label, targetRunDate, designerId, notes, status } */
  async function updateBatch(batchId, payload) {
    return request(`/design-batches/${batchId}`, { method: 'PUT', body: payload })
  }

  /** DELETE /design-batches/:id — blocked once status = attached */
  async function deleteBatch(batchId) {
    return request(`/design-batches/${batchId}`, { method: 'DELETE' })
  }

  /** POST /design-batches/:id/file-groups — body: { label? } */
  async function addFileGroup(batchId, label = null) {
    return request(`/design-batches/${batchId}/file-groups`, {
      method: 'POST',
      body: { label },
    })
  }

  /** DELETE /design-batches/:id/file-groups/:groupId */
  async function removeFileGroup(batchId, groupId) {
    return request(`/design-batches/${batchId}/file-groups/${groupId}`, { method: 'DELETE' })
  }

  /**
   * POST /design-batches/:id/file-groups/:groupId/adverts — body: { advertId }
   * Server-side gate: advert must be paid, not cancelled, and the batch's
   * target_run_date must be one of the advert's own pendingDates. A 400
   * here carries a `pendingDates` array explaining why it was rejected.
   */
  async function addAdvertToFileGroup(batchId, groupId, advertId, designerEmail = '') {
    return request(`/design-batches/${batchId}/file-groups/${groupId}/adverts`, {
      method: 'POST',
      body: { advertId, ...(designerEmail ? { designerEmail } : {}) },
    })
  }

  /**
   * DELETE /design-batches/:id/file-groups/:groupId/adverts/:advertId
   * designerEmail rides as a query param since this is a DELETE (no body
   * convention shared across this app's DELETE routes) — the server
   * accepts it either way, but the query param is what it's documented for.
   */
  async function removeAdvertFromFileGroup(batchId, groupId, advertId, designerEmail = '') {
    const qs = designerEmail ? `?designerEmail=${encodeURIComponent(designerEmail)}` : ''
    return request(`/design-batches/${batchId}/file-groups/${groupId}/adverts/${advertId}${qs}`, { method: 'DELETE' })
  }

  /** POST /design-batches/:id/file-groups/:groupId/upload — multipart, field name "file" */
  async function uploadFileToGroup(batchId, groupId, file, designerEmail = '') {
    const form = new FormData()
    form.append('file', file)
    if (designerEmail) form.append('designerEmail', designerEmail)
    return request(`/design-batches/${batchId}/file-groups/${groupId}/upload`, {
      method: 'POST',
      body: form,
    })
  }

  /** POST /design-batches/:id/attach — body: { runTime? }. Run date is always the batch's own target_run_date. */
  async function attachBatch(batchId, runTime = null) {
    return request(`/design-batches/${batchId}/attach`, {
      method: 'POST',
      body: { ...(runTime ? { runTime } : {}) },
    })
  }

  /** POST /design-batches/:id/mark-ready */
  async function markReady(batchId) {
    return request(`/design-batches/${batchId}/mark-ready`, { method: 'POST' })
  }

  /** POST /design-batches/:id/archive */
  async function archiveBatch(batchId) {
    return request(`/design-batches/${batchId}/archive`, { method: 'POST' })
  }

  // ── Designer Report (dashboard) ────────────────────────────────────────

  /** POST /design-house/reports/by-designer — body: { startDate, endDate } */
  async function fetchDesignerReport(startDate, endDate) {
    return request('/design-house/reports/by-designer', {
      method: 'POST',
      body: { startDate, endDate },
    })
  }

  /** GET /design-house/reports/missing-design-file — backlog of adverts blocked by the mark-complete gate */
  async function fetchMissingDesignFile() {
    return request('/design-house/reports/missing-design-file', { method: 'GET' })
  }

  // ── Workflow re-order: artwork per run date + Copy Desk placement ──────

  /**
   * POST /design-house/adverts/:id/artwork (multipart)
   * Attach artwork to any cleared booking — new or old — for chosen run
   * dates; carryForward (default true) fills every later remaining date too.
   */
  async function attachArtwork(advertId, { files = [], existingMediaIds = [], runDates = [], carryForward = true, replaceOwn = false, notes = '', designerEmail = '' } = {}) {
    const form = new FormData()
    for (const f of files) if (f instanceof File) form.append('files', f)
    if (existingMediaIds.length) form.append('existingMediaIds', JSON.stringify(existingMediaIds))
    if (runDates.length) form.append('runDates', JSON.stringify(runDates))
    form.append('carryForward', String(!!carryForward))
    form.append('replaceOwn', String(!!replaceOwn))
    if (notes) form.append('notes', notes)
    const email = designerEmail || readVgamsUser()?.email || ''
    if (email) form.append('userEmail', email)
    return request(`/design-house/adverts/${advertId}/artwork`, {
      method: 'POST',
      body: form,
      headers: vgamsUserHeaders(),
    })
  }

  /** POST /design-house/schedules/:scheduleId/drop — reason required */
  async function dropRunDate(scheduleId, reason) {
    return request(`/design-house/schedules/${scheduleId}/drop`, {
      method: 'POST',
      body: { reason, userEmail: readVgamsUser()?.email || '' },
      headers: vgamsUserHeaders(),
    })
  }

  /** POST /design-batches/:id/attach-multi — runDates: string[] | 'all_pending' */
  async function attachBatchMulti(batchId, runDates = 'all_pending', runTime = null) {
    return request(`/design-batches/${batchId}/attach-multi`, {
      method: 'POST',
      body: { runDates, ...(runTime ? { runTime } : {}), userEmail: readVgamsUser()?.email || '' },
      headers: vgamsUserHeaders(),
    })
  }

  /**
   * POST /design-house/placements — Copy Desk page + artwork state per run date.
   * Returns { [advertId]: { runDates, placed, nextPlacement, nextUnplaced } }.
   * Never throws: placement badges are a convenience, not a blocker.
   */
  async function fetchPlacements(advertIds = []) {
    if (!advertIds.length) return {}
    try {
      const res = await $fetch(`${API_BASE}/design-house/placements`, {
        method: 'POST',
        body: { advertIds },
      })
      return res?.data || {}
    } catch (e) {
      console.warn('[useDesignHouse] placements unavailable:', e?.data ?? e)
      return {}
    }
  }

  return {
    loading,
    error,
    resolveUrl,
    // workflow re-order
    attachArtwork,
    dropRunDate,
    attachBatchMulti,
    fetchPlacements,
    // design-house
    fetchBookingsByDate,
    fetchActiveAdverts,
    fetchDesignStats,
    fetchAdvertDetails,
    markDesignComplete,
    unmarkDesignComplete,
    fetchProducts,
    fetchProductCategories,
    // design-batch
    createBatch,
    listBatches,
    getBatchDetail,
    updateBatch,
    deleteBatch,
    addFileGroup,
    removeFileGroup,
    addAdvertToFileGroup,
    removeAdvertFromFileGroup,
    uploadFileToGroup,
    attachBatch,
    markReady,
    archiveBatch,
    // designer report
    fetchDesignerReport,
    fetchMissingDesignFile,
  }
}