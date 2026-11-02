// composables/useDesignHouseView.js
//
// Read-only data access for the editor's "Paid Adverts" popup — lets the
// editor see the exact same day's booking list Design House sees, without
// any of the assignment/batch machinery. Deliberately its own composable
// rather than added to usePager.js: this view has nothing to do with pager
// placement, and keeping it separate means it can't be accidentally coupled
// to that module's state or behavior.
import { useRuntimeConfig } from '#imports'

export function useDesignHouseView() {
  const config = useRuntimeConfig()
  const API = config.public.apiBase

  async function fetchProductCategories() {
    const res = await $fetch(`${API}/design-house/product-categories`)
    return res?.categories || []
  }

  async function fetchProducts(scope = 'print') {
    const res = await $fetch(`${API}/design-house/products`, { query: { scope } })
    return res?.products || []
  }

  // Every advert booked to run on `date` — paid or not, scheduled by Design
  // House or not. scope: category_type to scope by ('print' default on the
  // endpoint itself, 'all' to lift it), productId: narrow to one product.
  async function fetchAdvertsByDate(date, { productId, scope } = {}) {
    const res = await $fetch(`${API}/design-house/adverts/by-date`, {
      method: 'POST',
      body: { date, productId, scope },
    })
    return res?.adverts || []
  }

  return { fetchProductCategories, fetchProducts, fetchAdvertsByDate }
}

// Single source of truth for "is this a classified advert" — matches the
// same ad_type/size_dimension signal used everywhere else classified
// detection already happens in this codebase.
export function isClassifiedAdvert(advert) {
  // The stored Display / Classified value wins (set at booking or by the
  // backfill); the rate-card rule below stays as the fallback.
  const stored = advert?.printAdClass ?? advert?.print_ad_class
  if (stored === 'classified') return true
  if (stored === 'display') return false
  const rc = advert?.rateCard
  if (!rc) return false
  const adType = (rc.adType || '').toString().toLowerCase()
  const sizeDimension = (rc.sizeDimension || '').toString().toLowerCase()
  return adType.includes('classified') || sizeDimension.includes('per word')
}