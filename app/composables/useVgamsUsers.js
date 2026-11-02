// composables/useVgamsUsers.js
//
// Talks to the custom /vgams-users/admin/* endpoints (see
// controllers/vgams-user.js + routes/custom.js). Every write call sends
// `adminEmail` — the currently logged-in administrator's email — because
// that's how the server-side guard (requireAdmin) confirms the caller is
// an active administrator. There is no Strapi JWT in play for this API,
// matching the rest of the VGAMS auth pattern.
//
// Follows the same request()-wrapper convention as useDesignHouse.js:
// config.public.apiBase as the base URL, centralized loading/error state,
// same server-error unwrapping.

import { ref } from 'vue'
import { useAuth } from '~/composables/useAuth'

// Accounts that cannot be edited or deleted from this UI. Real enforcement
// lives server-side in the controller (updateUserAdmin/deleteUserAdmin) —
// this copy is for disabling the buttons / showing the "Protected" badge.
export const PROTECTED_EMAILS = [
  'vmujuzi@newvision.co.ug',
  'fssembajjwe@newvision.co.ug',
  'pikanza@newvision.co.ug',
]

export const VGAMS_ROLES = [
  { value: 'booking_clerk',        label: 'Booking Clerk' },
  { value: 'sub_editor',           label: 'Copy Desk (Sub-Editor)' },
  { value: 'advertising_manager',  label: 'Advertising Manager' },
  { value: 'design_house',         label: 'Design House' },
  { value: 'finance_team',         label: 'Finance Team' },
  { value: 'administrator',        label: 'Administrator' },
  { value: 'sales_team',           label: 'Sales Team' },
  { value: 'hr_team',              label: 'HR Team' },
  { value: 'invoicing_officer',    label: 'Invoicing Officer' },
]

// Candidate localStorage keys — admin.vue's onMounted comment confirms
// auth.initAuth() reads the confirmed user object back out of localStorage
// ("same object saved to localStorage"), but the exact key isn't known yet.
// Trying the likely ones here so this composable works without useAuth.js.
const LOCAL_STORAGE_USER_KEYS = ['vgams_user', 'vgamsUser', 'user', 'auth_user', 'authUser']

let warnedOnce = false

/**
 * Resolve the currently logged-in administrator's email.
 * Tries several likely useAuth() shapes, then falls back to localStorage.
 * Confirmed working against the live app (list/create/update/delete all
 * resolve correctly) — kept as a fallback chain rather than collapsed to
 * a single lookup since useAuth.js's exact shape hasn't been confirmed.
 * If useAuth.js ever gets shared, this can be simplified to one line.
 */
function resolveAdminEmail(auth) {
  const candidates = [
    auth?.user?.value?.email,
    auth?.userEmail?.value,
    auth?.currentUser?.value?.email,
    auth?.email?.value,
    auth?.user?.email,        // in case it's not a ref
    auth?.currentUser?.email,
  ]

  for (const c of candidates) {
    if (c) return c
  }

  // Fallback: read straight out of localStorage
  if (typeof window !== 'undefined' && window.localStorage) {
    for (const key of LOCAL_STORAGE_USER_KEYS) {
      try {
        const raw = window.localStorage.getItem(key)
        if (!raw) continue
        const parsed = JSON.parse(raw)
        const email = parsed?.email || parsed?.user?.email
        if (email) return email
      } catch {
        // not JSON, or not the right shape — keep trying other keys
      }
    }
  }

  if (!warnedOnce) {
    warnedOnce = true
    console.warn(
      '[useVgamsUsers] Could not resolve the current administrator email from ' +
      'useAuth() or localStorage. Every admin write call will be rejected with ' +
      '"Administrator email is required" until this is fixed. ' +
      'Checked auth object:', auth,
      'and localStorage keys:', LOCAL_STORAGE_USER_KEYS
    )
  }

  return ''
}

export function useVgamsUsers() {
  const config   = useRuntimeConfig()
  const API_BASE = config.public.apiBase

  const auth = useAuth()

  const users   = ref([])
  const loading = ref(false)
  const error   = ref(null)

  function adminEmail() {
    return resolveAdminEmail(auth)
  }

  // ── Shared request wrapper — mirrors useDesignHouse.js exactly ─────────
  async function request(path, opts = {}) {
    loading.value = true
    error.value = null
    try {
      return await $fetch(`${API_BASE}${path}`, opts)
    } catch (e) {
      const serverMessage = e?.data?.message || e?.data?.error?.message
      error.value = serverMessage || e.message || 'Request failed'
      console.error(`[useVgamsUsers] ${opts.method || 'GET'} ${path} failed:`, e?.data ?? e)
      throw e
    } finally {
      loading.value = false
    }
  }

  // ── List ───────────────────────────────────────────────────────────────
  async function loadUsers() {
    const res = await request('/vgams-users/admin/list', {
      method: 'GET',
      params: { adminEmail: adminEmail() },
    })
    users.value = res.users || []
    return users.value
  }

  // ── Create ─────────────────────────────────────────────────────────────
  async function createUser({ name, email, role, isActive = true }) {
    const res = await request('/vgams-users/admin/create', {
      method: 'POST',
      body: { name, email, role, isActive, adminEmail: adminEmail() },
    })
    if (res?.user) users.value = [...users.value, res.user]
    return res
  }

  // ── Update (name / email / role / isActive — send only what changed) ───
  async function updateUser(id, changes) {
    const res = await request(`/vgams-users/admin/${id}`, {
      method: 'PUT',
      body: { ...changes, adminEmail: adminEmail() },
    })
    if (res?.user) {
      const idx = users.value.findIndex(u => u.id === id)
      if (idx !== -1) users.value[idx] = { ...users.value[idx], ...res.user }
    }
    return res
  }

  // ── Convenience: activate / deactivate ──────────────────────────────────
  const activateUser   = (id) => updateUser(id, { isActive: true })
  const deactivateUser = (id) => updateUser(id, { isActive: false })

  // ── Delete (hard delete — see controller notes on relation constraints) ─
  async function deleteUser(id) {
    const res = await request(`/vgams-users/admin/${id}`, {
      method: 'DELETE',
      body: { adminEmail: adminEmail() },
    })
    users.value = users.value.filter(u => u.id !== id)
    return res
  }

  return {
    users, loading, error,
    loadUsers, createUser, updateUser,
    activateUser, deactivateUser, deleteUser,
  }
}