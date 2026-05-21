// composables/useSfaAuth.js
//
// SFA authentication composable.
// Calls /vgams-users/login with { module: 'sfa' } to get the sales person
// profile and SFA role back from the server — no JWT involved.
//
// The session is stored in sessionStorage so it survives page refreshes
// but is cleared when the browser tab is closed.
//
// Every SFA API request body must include sfaProfileDocumentId so the
// controller knows who is calling and what role they have.

import { ref, computed } from 'vue'

const SFA_SESSION_KEY = 'sfa_session'

// Module-level reactive state
const _session = ref(null)

// Restore from sessionStorage on module load (page refresh)
if (typeof window !== 'undefined') {
  try {
    const raw = sessionStorage.getItem(SFA_SESSION_KEY)
    if (raw) _session.value = JSON.parse(raw)
  } catch {
    _session.value = null
  }
}

export function useSfaAuth() {
  const config   = useRuntimeConfig()
  const API_BASE = config.public.apiBase

  const loading    = ref(false)
  const loginError = ref(null)

  // ── Derived ────────────────────────────────────────────────────────────────
  const isLoggedIn  = computed(() => !!_session.value?.sfaProfile?.documentId)
  const salesPerson = computed(() => _session.value?.salesPerson  || null)
  const sfaProfile  = computed(() => _session.value?.sfaProfile   || null)
  const sfaRole     = computed(() => _session.value?.sfaProfile?.sfa_role || null)

  /**
   * Returns the sfaProfileDocumentId to include in every SFA API request body.
   * Controllers use this to look up the profile and apply role-based filters.
   */
  function getSfaProfileDocumentId() {
    return _session.value?.sfaProfile?.documentId || null
  }

  // ── Login ─────────────────────────────────────────────────────────────────
  async function login(email, password) {
    loading.value    = true
    loginError.value = null

    try {
      const response = await $fetch(`${API_BASE}/vgams-users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email:    email.toLowerCase().trim(),
          password,
          module:   'sfa',
        }),
      })

      if (!response?.success) {
        loginError.value = response?.message || 'Login failed.'
        return { success: false, error: loginError.value }
      }

      // Store session — no JWT, just identity + profile
      const session = {
        salesPerson: response.salesPerson,
        sfaProfile:  response.sfaProfile,
        loginAt:     Date.now(),
      }

      _session.value = session
      sessionStorage.setItem(SFA_SESSION_KEY, JSON.stringify(session))

      return { success: true, session }

    } catch (e) {
      const status = e?.response?.status || e?.status
      const msg    = e?.data?.error?.message || e?.message || ''

      if (status === 401) {
        loginError.value = msg || 'Incorrect email or password.'
      } else if (status === 403) {
        loginError.value = msg || 'Your account is not listed as an active sales person.'
      } else if (status === 404) {
        loginError.value = msg || 'No SFA profile configured. Contact an administrator.'
      } else if (status === 500) {
        loginError.value = 'Authentication service temporarily unavailable. Please try again.'
      } else {
        loginError.value = msg || 'Login failed. Please try again.'
      }

      return { success: false, error: loginError.value }
    } finally {
      loading.value = false
    }
  }

  // ── Logout ────────────────────────────────────────────────────────────────
  function logout() {
    _session.value = null
    sessionStorage.removeItem(SFA_SESSION_KEY)
  }

  return {
    loading, loginError,
    isLoggedIn, salesPerson, sfaProfile, sfaRole,
    getSfaProfileDocumentId,
    login, logout,
  }
}
