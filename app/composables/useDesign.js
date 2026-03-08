// composables/useDesign.js
import { ref } from 'vue'
import { useRuntimeConfig } from '#app'

export const useDesign = () => {
  const config     = useRuntimeConfig()
  const apiBase    = config.public?.apiBase    || ''
  const uploadBase = config.public?.uploadBase || ''

  /**
   * Prepend uploadBase to a Strapi media URL when the URL is relative.
   * Strapi returns paths like /uploads/image.jpg — prefix with uploadBase.
   * Absolute URLs (http/https) are left unchanged.
   */
  const resolveUrl = (url) => {
    if (!url) return ''
    if (/^https?:\/\//i.test(url)) return url
    return `${uploadBase}${url}`
  }

  /**
   * Walk an advert's attachments and fix every URL in place.
   */
  const resolveAttachmentUrls = (advert) => {
    if (!advert?.attachments) return advert
    return {
      ...advert,
      attachments: advert.attachments.map(f => ({ ...f, url: resolveUrl(f.url) })),
    }
  }

  // ── Data ──────────────────────────────────────────────────────────────────
  const adverts       = ref([])
  const recentUploads = ref([])
  const loading       = ref(false)
  const error         = ref(null)

  // ── Stats (all driven by loadDesignStats) ─────────────────────────────────
  const running         = ref(0)   // adverts active right now
  const upcoming        = ref(0)   // adverts starting in the future
  const pendingDesign   = ref(0)   // isApproved = false
  const designApproved  = ref(0)   // isApproved = true
  const readyToSchedule = ref(0)   // isApproved = true AND isScheduled = false
  const scheduled       = ref(0)   // isScheduled = true
  const totalFiles      = ref(0)

  // Legacy aliases kept so existing template bindings don't break
  const activeProjects   = running
  const completedDesigns = designApproved

  // ─────────────────────────────────────────────────────────────────────────
  // Date Helpers
  // ─────────────────────────────────────────────────────────────────────────

  const getTodayFormatted = () => new Date().toISOString().split('T')[0]

  const formatDateForAPI = (dateStr) => dateStr   // already YYYY-MM-DD

  const getDateRange = (range) => {
    const today = new Date()
    const fmt   = (d) => d.toISOString().split('T')[0]

    switch (range) {
      case 'today':
        return { startDate: fmt(today), endDate: fmt(today) }

      case 'yesterday': {
        const y = new Date(today); y.setDate(y.getDate() - 1)
        return { startDate: fmt(y), endDate: fmt(y) }
      }

      case 'this_week': {
        const dow = today.getDay() || 7              // 1=Mon … 7=Sun
        const mon = new Date(today); mon.setDate(today.getDate() - dow + 1)
        const sun = new Date(mon);   sun.setDate(mon.getDate() + 6)
        return { startDate: fmt(mon), endDate: fmt(sun) }
      }

      case 'last_week': {
        const dow = today.getDay() || 7
        const mon = new Date(today); mon.setDate(today.getDate() - dow + 1 - 7)
        const sun = new Date(mon);   sun.setDate(mon.getDate() + 6)
        return { startDate: fmt(mon), endDate: fmt(sun) }
      }

      case 'this_month': {
        const first = new Date(today.getFullYear(), today.getMonth(), 1)
        const last  = new Date(today.getFullYear(), today.getMonth() + 1, 0)
        return { startDate: fmt(first), endDate: fmt(last) }
      }

      case 'next_month': {
        const first = new Date(today.getFullYear(), today.getMonth() + 1, 1)
        const last  = new Date(today.getFullYear(), today.getMonth() + 2, 0)
        return { startDate: fmt(first), endDate: fmt(last) }
      }

      default:
        return { startDate: fmt(today), endDate: fmt(today) }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // API Calls
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Load adverts for design work.
   * Populates `adverts` and `recentUploads`.
   */
  const loadDesigns = async (params = {}) => {
    loading.value = true
    error.value   = null
    try {
      const res = await fetch(`${apiBase}/design-house/active-adverts`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          startDate: params.startDate || getTodayFormatted(),
          endDate:   params.endDate   || getTodayFormatted(),
        }),
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()

      if (data.success) {
        adverts.value = (data.adverts || []).map(resolveAttachmentUrls)

        // Recent uploads = adverts with at least one file, sorted newest-first
        recentUploads.value = [...adverts.value]
          .filter(a => a.attachmentsCount > 0)
          .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
          .slice(0, 12)
      } else {
        error.value = data.message || 'Failed to load designs'
      }
    } catch (e) {
      console.error('loadDesigns error:', e)
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  /**
   * Load stats panel numbers.
   */
  const loadDesignStats = async (params = {}) => {
    try {
      const res = await fetch(`${apiBase}/design-house/stats`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          startDate: params.startDate || getTodayFormatted(),
          endDate:   params.endDate   || getTodayFormatted(),
        }),
      })
      if (!res.ok) return
      const data = await res.json()
      if (data.success) {
        const s          = data.statistics
        running.value         = s.running         ?? 0
        upcoming.value        = s.upcoming         ?? 0
        pendingDesign.value   = s.pendingDesign    ?? 0
        designApproved.value  = s.designApproved   ?? 0
        readyToSchedule.value = s.readyToSchedule  ?? 0
        scheduled.value       = s.scheduled        ?? 0
        totalFiles.value      = s.totalFiles       ?? 0
      }
    } catch (e) {
      console.error('loadDesignStats error:', e)
    }
  }

  /**
   * Upload design files to an advert.
   * @param {number|string} advertId
   * @param {File[]}        files
   * @param {string}        description
   */
  const uploadDesignFiles = async (advertId, files, description) => {
    const formData = new FormData()
    files.forEach(f => formData.append('files', f))
    if (description) formData.append('description', description)

    const res = await fetch(`${apiBase}/design-house/adverts/${advertId}/upload`, {
      method: 'POST',
      body:   formData,
    })
    const data = await res.json()
    if (!data.success) throw new Error(data.message || 'Upload failed')
    return data
  }

  /**
   * Mark an advert's design as approved (isApproved = true).
   */
  const markDesignComplete = async (advertId, notes = '', designerEmail = '') => {
    const res = await fetch(`${apiBase}/design-house/adverts/${advertId}/complete`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ notes, designerEmail }),
    })
    const data = await res.json()
    if (!data.success) throw new Error(data.message || 'Failed to approve design')
    return data
  }

  /**
   * Trigger browser download for all attachments on an advert.
   */
  const downloadFiles = async (advertId) => {
    const res  = await fetch(`${apiBase}/design-house/adverts/${advertId}`)
    const data = await res.json()
    const files = data.advert?.attachments || []
    files.forEach(file => {
      if (!file.url) return
      const a       = document.createElement('a')
      a.href        = file.url
      a.download    = file.name || 'file'
      a.target      = '_blank'
      a.rel         = 'noopener'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    })
  }

  // ─────────────────────────────────────────────────────────────────────────
  return {
    // State
    adverts,
    recentUploads,
    loading,
    error,

    // Stats
    running,
    upcoming,
    pendingDesign,
    designApproved,
    readyToSchedule,
    scheduled,
    totalFiles,

    // Legacy aliases
    activeProjects,
    completedDesigns,

    // Actions
    loadDesigns,
    loadDesignStats,
    uploadDesignFiles,
    markDesignComplete,
    downloadFiles,

    // URL helpers
    resolveUrl,
    resolveAttachmentUrls,

    // Date helpers
    getTodayFormatted,
    formatDateForAPI,
    getDateRange,
  }
}