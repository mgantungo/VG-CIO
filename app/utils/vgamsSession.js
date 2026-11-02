// app/utils/vgamsSession.js
//
// Small helpers for the stateless identity pattern the Strapi custom routes
// use: the logged-in VGAMS user lives in localStorage ('vgams_user'), and the
// new workflow routes identify the caller by the x-user-email header.
// Nuxt auto-imports everything exported from app/utils.

export function readVgamsUser() {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem('vgams_user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function vgamsUserHeaders(extra = {}) {
  const user = readVgamsUser()
  return {
    ...(user?.email ? { 'x-user-email': user.email } : {}),
    ...extra,
  }
}

/** Server message from a $fetch error, whichever shape Strapi used. */
export function apiErrorMessage(err, fallback = 'Request failed') {
  return err?.data?.message
    || err?.data?.error?.message
    || (typeof err?.data === 'string' ? err.data : null)
    || err?.message
    || fallback
}

export function isoToday() {
  const d = new Date()
  const off = d.getTimezoneOffset()
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10)
}

export function shiftIsoDate(iso, days) {
  const d = new Date(`${iso}T12:00:00`)
  d.setDate(d.getDate() + days)
  const off = d.getTimezoneOffset()
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10)
}

export function formatUgx(value, { compact = false } = {}) {
  const n = Number(value) || 0
  if (compact) {
    if (Math.abs(n) >= 1e9) return `${(n / 1e9).toFixed(2)}B`
    if (Math.abs(n) >= 1e6) return `${(n / 1e6).toFixed(2)}M`
    if (Math.abs(n) >= 1e3) return `${(n / 1e3).toFixed(1)}K`
  }
  return n.toLocaleString('en-UG', { maximumFractionDigits: 0 })
}

export function formatRunDate(iso) {
  if (!iso) return '—'
  const d = new Date(`${iso}T12:00:00`)
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}

export const PAYMENT_METHOD_LABELS = {
  credit: 'Credit',
  bank_transfer: 'Bank transfer',
  cash: 'Cash',
  mobile_money: 'Mobile money',
  pdc: 'PDC',
  unknown: 'Unknown',
}

export const PRINT_CLASS_LABELS = {
  display: 'Display',
  classified: 'Classified',
  unclassified: 'Unclassified',
}
