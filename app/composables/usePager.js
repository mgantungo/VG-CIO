// composables/usePager.js
import { ref } from 'vue'
import { useRuntimeConfig } from '#imports'

export const PUBLICATION_SECTIONS = [
  "Adverts", "Beat", "Business", "Business Vision", "CSI", "Case Files", "Classified",
  "Comments", "Community News", "Court", "Crocs", "Election News", "Feature", "Green UG",
  "Harvest Money", "Health", "Her Vision", "Homes", "International News", "JobMart",
  "Leisure", "Letters", "Lifestyle", "Motor Mart", "Mwalimu", "NIE", "National News",
  "New Era", "News", "OPED", "Oil, Gas and Infrastructure", "Opportunities", "PLE",
  "OLEVEL", "ALEVEL", "Pakasa", "Relationships", "Schools", "Series", "Special Report",
  "Sport", "Spotlight", "Supplements", "Teen Vision", "TV and Leisure", "The Hot Sport",
  "Weekend Xtra", "Muslim News", "Back Cover Page", "Cover Page",
]

// ── Per-section color map ────────────────────────────────────────────────
const COLOR_EXCLUDED = new Set(['Cover Page', 'Back Cover Page'])
const COLORED_SECTIONS = PUBLICATION_SECTIONS.filter(s => !COLOR_EXCLUDED.has(s))

const SECTION_COLOR_MAP = new Map(
  COLORED_SECTIONS.map((section, i) => {
    const hue = Math.round((i * 137.508) % 360)
    return [section, {
      bg:     `hsl(${hue}, 65%, 93%)`,
      border: `hsl(${hue}, 55%, 62%)`,
      text:   `hsl(${hue}, 60%, 28%)`,
    }]
  })
)

export function getSectionColor(section) {
  return SECTION_COLOR_MAP.get(section) || null
}

export function getSectionLegend(pages) {
  const used = new Set((pages || []).map(p => p.section).filter(s => s && !COLOR_EXCLUDED.has(s)))
  return PUBLICATION_SECTIONS
    .filter(s => used.has(s))
    .map(s => ({ section: s, color: getSectionColor(s) }))
}

export function usePager() {
  const config = useRuntimeConfig()
  const API = config.public.apiBase

  const publications = ref([])
  const activePublication = ref(null) // { publication, left, right }
  const loading = ref(false)
  const error = ref(null)

  const extractMsg = (e, fallback) => e?.data?.error?.message || e?.message || fallback

  // ── Publications list ───────────────────────────────────────────────────
  async function fetchPublications(params = {}) {
    loading.value = true
    error.value = null
    try {
      const res = await $fetch(`${API}/pager-publications`, { query: params })
      publications.value = Array.isArray(res) ? res : (res?.data || [])
      return publications.value
    } catch (e) {
      error.value = extractMsg(e, 'Failed to load publications')
      throw e
    } finally {
      loading.value = false
    }
  }

  // ── Initialize a new publication ────────────────────────────────────────
  async function createPublication({ masthead, publicationDate, totalPages, notes }) {
    try {
      const res = await $fetch(`${API}/pager-publications`, {
        method: 'POST',
        body: {
          masthead,
          publication_date: publicationDate,
          total_pages: totalPages,
          notes: notes || '',
        },
      })
      await fetchPublications()
      return res
    } catch (e) {
      error.value = extractMsg(e, 'Failed to initialize publication')
      throw e
    }
  }

  // ── Load the full spread layout for the popup ───────────────────────────
  async function loadLayout(publicationId) {
    loading.value = true
    error.value = null
    try {
      const res = await $fetch(`${API}/pager-publications/${publicationId}/layout`)
      activePublication.value = res
      return res
    } catch (e) {
      error.value = extractMsg(e, 'Failed to load publication layout')
      throw e
    } finally {
      loading.value = false
    }
  }

  // ── Increase / decrease pages ────────────────────────────────────────────
  async function increasePages(publicationId, additionalPages) {
    try {
      await $fetch(`${API}/pager-publications/${publicationId}/increase-pages`, {
        method: 'PUT',
        body: { additionalPages },
      })
      await loadLayout(publicationId)
    } catch (e) {
      error.value = extractMsg(e, 'Failed to add pages')
      throw e
    }
  }

  async function decreasePages(publicationId, reducePages) {
    try {
      await $fetch(`${API}/pager-publications/${publicationId}/decrease-pages`, {
        method: 'PUT',
        body: { reducePages },
      })
      await loadLayout(publicationId)
    } catch (e) {
      error.value = extractMsg(e, 'Failed to remove pages')
      throw e
    }
  }

  // ── Auto-map checked printable units onto a publication's pages ─────────
  // units: [{ advertIds: [...] }, ...] — each unit is one printable item:
  // an ad slot (several adverts sharing one physical file, must land on
  // the same page) or a single ungrouped advert (a unit of one).
  async function queueUnitsToPublication(publicationId, units) {
    try {
      const res = await $fetch(`${API}/pager-publications/${publicationId}/queue-adverts`, {
        method: 'POST',
        body: { units },
      })
      return res // { assigned: [...], skipped: [...] }
    } catch (e) {
      error.value = extractMsg(e, 'Failed to queue adverts to the pager')
      throw e
    }
  }

  // ── Legacy flat-list version — kept for any other caller still using it.
  async function queueAdvertsToPublication(publicationId, advertIds) {
    return queueUnitsToPublication(publicationId, advertIds.map((advertId) => ({ advertIds: [advertId] })))
  }

  // ── Lock / status ────────────────────────────────────────────────────────
  async function lockPublication(publicationId) {
    try {
      await $fetch(`${API}/pager-publications/${publicationId}/lock`, { method: 'PUT' })
      await loadLayout(publicationId)
    } catch (e) {
      error.value = extractMsg(e, 'Failed to lock publication')
      throw e
    }
  }

  async function setPublicationStatus(publicationId, status) {
    try {
      await $fetch(`${API}/pager-publications/${publicationId}/status`, {
        method: 'PUT',
        body: { status },
      })
      await loadLayout(publicationId)
    } catch (e) {
      error.value = extractMsg(e, 'Failed to update status')
      throw e
    }
  }

  // ── Page-level actions ───────────────────────────────────────────────────
  async function updatePageSection(pageId, section) {
    try {
      await $fetch(`${API}/pager-pages/${pageId}/section`, {
        method: 'PUT',
        body: { section },
      })
      if (activePublication.value?.publication?.id) {
        await loadLayout(activePublication.value.publication.id)
      }
    } catch (e) {
      error.value = extractMsg(e, 'Failed to update section')
      throw e
    }
  }

  // ── Assign / unassign — plural (slot-aware) versions the UI should use ──
  // An ad slot's adverts must move together, never split, so these accept
  // an array and place/remove them on the page atomically, in one call.
  async function assignAdverts(pageId, advertIds) {
    try {
      await $fetch(`${API}/pager-pages/${pageId}/assign-adverts`, {
        method: 'POST',
        body: { advertIds },
      })
      if (activePublication.value?.publication?.id) {
        await loadLayout(activePublication.value.publication.id)
      }
    } catch (e) {
      error.value = extractMsg(e, 'Failed to assign advert(s)')
      throw e
    }
  }

  async function unassignAdverts(pageId, advertIds) {
    try {
      await $fetch(`${API}/pager-pages/${pageId}/unassign-adverts`, {
        method: 'POST',
        body: { advertIds },
      })
      if (activePublication.value?.publication?.id) {
        await loadLayout(activePublication.value.publication.id)
      }
    } catch (e) {
      error.value = extractMsg(e, 'Failed to remove advert(s)')
      throw e
    }
  }

  // ── Legacy single-advert wrappers — kept for any other caller ───────────
  async function assignAdvert(pageId, advertId) {
    return assignAdverts(pageId, [advertId])
  }
  async function unassignAdvert(pageId, advertId) {
    return unassignAdverts(pageId, [advertId])
  }

  // ── Available adverts for a page, grouped by ad slot ────────────────────
  // Returns { data, groups, ungrouped } — groups/ungrouped is what the
  // picker should actually render (one selectable unit per ad slot or
  // single advert); data is the old flat list, kept for backward compat.
  async function getAvailableAdverts(pageId) {
    try {
      const res = await $fetch(`${API}/pager-pages/${pageId}/available-adverts`)
      return {
        data: res?.data || [],
        groups: res?.groups || [],
        ungrouped: res?.ungrouped || [],
      }
    } catch (e) {
      error.value = extractMsg(e, 'Failed to load available adverts')
      throw e
    }
  }

  // ── Where is this advert placed? ─────────────────────────────────────────
  async function getAdvertPagerAssignments(advertId) {
    try {
      const res = await $fetch(`${API}/adverts/${advertId}/pager-assignments`)
      return res?.data || []
    } catch (e) {
      error.value = extractMsg(e, 'Failed to load advert placements')
      throw e
    }
  }

  return {
    publications,
    activePublication,
    loading,
    error,
    fetchPublications,
    createPublication,
    loadLayout,
    increasePages,
    decreasePages,
    queueUnitsToPublication,
    queueAdvertsToPublication,
    lockPublication,
    setPublicationStatus,
    updatePageSection,
    assignAdverts,
    unassignAdverts,
    assignAdvert,
    unassignAdvert,
    getAvailableAdverts,
    getAdvertPagerAssignments,
    PUBLICATION_SECTIONS,
  }
}