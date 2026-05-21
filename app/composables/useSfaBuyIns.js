// composables/useSfaBuyIns.js

import { ref } from 'vue'

const _buyIns = ref([])
const _loaded = ref(false)

export function useSfaBuyIns() {
  const config   = useRuntimeConfig()
  const API_BASE = config.public.apiBase
  const loading  = ref(false)
  const error    = ref(null)

  function caller() {
    return { sfaProfileDocumentId: useSfaAuth().getSfaProfileDocumentId() }
  }

  async function fetchBuyIns(force = false) {
    if (_loaded.value && !force) return _buyIns.value
    loading.value = true; error.value = null
    try {
      const res = await $fetch(`${API_BASE}/sfa-buy-ins/list`, {
        method: 'POST', body: { ...caller(), filters: { is_active: true } },
      })
      _buyIns.value = Array.isArray(res) ? res : (res?.data || [])
      _loaded.value = true
      return _buyIns.value
    } catch (e) { error.value = e?.data?.error?.message || 'Failed to load catalogue'; return [] }
    finally     { loading.value = false }
  }

  async function fetchOpportunityBuyIns(opportunityId) {
    const res = await $fetch(`${API_BASE}/sfa-opportunity-buy-ins/by-opportunity`, {
      method: 'POST', body: { ...caller(), opportunityId, populate: ['buy_in'] },
    })
    return Array.isArray(res) ? res : (res?.data || [])
  }

  async function saveOpportunityBuyIns(opportunityId, lines) {
    const res = await $fetch(`${API_BASE}/sfa-opportunity-buy-ins/save`, {
      method: 'POST', body: { ...caller(), opportunityId, lines },
    })
    return res?.data || res
  }

  function groupedBuyIns() {
    const groups = {}
    for (const item of _buyIns.value) {
      const cat = item.category || 'other'
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(item)
    }
    return groups
  }

  const CATEGORY_LABELS = {
    radio_ads: 'Radio Advertisements', tv_ads: 'TV Advertisements',
    billboard: 'Billboards & OOH', website_ads: 'Digital / Website Ads',
    courier: 'Courier Services', printing: 'Commercial Printing',
    rig_truck: 'Rig Truck Services', other: 'Other',
  }

  return {
    buyIns: _buyIns, loading, error, CATEGORY_LABELS,
    fetchBuyIns, fetchOpportunityBuyIns, saveOpportunityBuyIns, groupedBuyIns,
  }
}
