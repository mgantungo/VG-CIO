// stores/marketSectors.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useMarketSectorsStore = defineStore('marketSectors', () => {
  // ─── State ───────────────────────────────────────────────────────────────────
  const sectors = ref([])
  const loading = ref(false)
  const error = ref(null)
  const loaded = ref(false) // guard against redundant fetches
    // Runtime config
  const config = useRuntimeConfig()

  const API_BASE = config.public.apiBase;// || 'https://cms-vgad.visiongroup.co.ug/api'

  // ─── Getters ─────────────────────────────────────────────────────────────────

  /** Flat list sorted alphabetically by name, ready for a <select> */
  const sectorOptions = computed(() =>
    [...sectors.value].sort((a, b) => a.name.localeCompare(b.name))
  )

  /** Quick lookup: code → full sector object */
  const sectorByCode = computed(() => {
    return sectors.value.reduce((map, sector) => {
      map[sector.code] = sector
      return map
    }, {})
  })

  /** Resolve a code back to the human-readable name */
  const nameForCode = (code) => sectorByCode.value[code]?.name ?? code

  // ─── Actions ─────────────────────────────────────────────────────────────────

  const loadSectors = async ({ force = false } = {}) => {
    // Skip if already loaded unless a forced refresh is requested
    if (loaded.value && !force) return

    loading.value = true
    error.value = null

    try {
      const response = await $fetch(`${API_BASE}/market-sectors`)

      sectors.value = (response.data || []).map((sector) => ({
        id: sector.id,
        documentId: sector.documentId,
        code: sector.code,
        name: sector.name,
      }))

      loaded.value = true
    } catch (err) {
      error.value = err?.message || 'Failed to load market sectors'
      console.error('[MarketSectorsStore] Error:', err)
    } finally {
      loading.value = false
    }
  }

  const clearError = () => {
    error.value = null
  }

  // ─── Expose ──────────────────────────────────────────────────────────────────
  return {
    // State
    sectors,
    loading,
    error,
    loaded,

    // Getters
    sectorOptions,
    sectorByCode,
    nameForCode,

    // Actions
    loadSectors,
    clearError,
  }
})