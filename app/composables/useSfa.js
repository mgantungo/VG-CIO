// composables/useSfa.js
// Role helpers derived from the SFA session stored by useSfaAuth.
// No JWT, no auth store — everything comes from sessionStorage.

import { computed } from 'vue'

export function useSfa() {
  const { sfaProfile, salesPerson, sfaRole } = useSfaAuth()

  // ── Identity ───────────────────────────────────────────────────────────────
  const agentName    = computed(() => salesPerson.value?.name     || '')
  const agentEmail   = computed(() => salesPerson.value?.email    || '')
  const agentBcCode  = computed(() => salesPerson.value?.bc_code  || '')
  const agentUnitId  = computed(() => sfaProfile.value?.unit?.documentId || null)
  const agentUnit    = computed(() => sfaProfile.value?.unit      || null)

  // ── Role flags ─────────────────────────────────────────────────────────────
  const isAgent      = computed(() => sfaRole.value === 'sales_agent')
  const isSupervisor = computed(() => sfaRole.value === 'supervisor')
  const isManager    = computed(() => ['manager', 'admin'].includes(sfaRole.value))
  const canApprove   = computed(() => isSupervisor.value || isManager.value)
  const canSeeAll    = computed(() => isManager.value)

  function roleLabel(role) {
    return {
      sales_agent: 'Sales Agent',
      supervisor:  'Supervisor',
      manager:     'Manager',
      admin:       'Administrator',
    }[role] || role
  }

  return {
    sfaProfile, salesPerson, sfaRole,
    agentName, agentEmail, agentBcCode, agentUnitId, agentUnit,
    isAgent, isSupervisor, isManager, canApprove, canSeeAll,
    roleLabel,
  }
}
