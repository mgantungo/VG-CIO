// composables/useSfaCompanies.js

import { ref } from 'vue'

export function useSfaCompanies() {
  const config   = useRuntimeConfig()
  const API_BASE = config.public.apiBase

  const prospects = ref([])
  const clients   = ref([])
  const contacts  = ref([])
  const loading   = ref(false)
  const error     = ref(null)

  function caller() {
    return { sfaProfileDocumentId: useSfaAuth().getSfaProfileDocumentId() }
  }

  async function searchProspects(search = '') {
    loading.value = true; error.value = null
    try {
      const res = await $fetch(`${API_BASE}/sfa-companies/search`, {
        method: 'POST', body: { ...caller(), search, pagination: { page: 1, pageSize: 30 } },
      })
      prospects.value = Array.isArray(res) ? res : (res?.data || [])
      return prospects.value
    } catch (e) { error.value = e?.data?.error?.message || 'Search failed'; return [] }
    finally     { loading.value = false }
  }

  async function createProspect(payload) {
    const res = await $fetch(`${API_BASE}/sfa-companies/create`, {
      method: 'POST', body: { ...caller(), ...payload },
    })
    return res?.data || res
  }

  async function updateProspect(id, payload) {
    const res = await $fetch(`${API_BASE}/sfa-companies/update`, {
      method: 'POST', body: { ...caller(), id, ...payload },
    })
    return res?.data || res
  }

  async function searchClients(search = '') {
    if (!search || search.length < 2) { clients.value = []; return [] }
    loading.value = true
    try {
      const res = await $fetch(`${API_BASE}/clients/search-by-name`, {
        method: 'POST', body: { ...caller(), company_name: search },
      })
      clients.value = Array.isArray(res) ? res : (res?.data || [])
      return clients.value
    } catch (e) { error.value = e?.data?.error?.message || 'Search failed'; return [] }
    finally     { loading.value = false }
  }

  async function fetchContacts(companyId) {
    loading.value = true
    try {
      const res = await $fetch(`${API_BASE}/sfa-contacts/by-company`, {
        method: 'POST', body: { ...caller(), companyId },
      })
      contacts.value = Array.isArray(res) ? res : (res?.data || [])
      return contacts.value
    } finally { loading.value = false }
  }

  async function addContact(companyId, payload) {
    const res = await $fetch(`${API_BASE}/sfa-contacts/create`, {
      method: 'POST', body: { ...caller(), ...payload, company: companyId },
    })
    return res?.data || res
  }

  async function updateContact(id, payload) {
    const res = await $fetch(`${API_BASE}/sfa-contacts/update`, {
      method: 'POST', body: { ...caller(), id, ...payload },
    })
    return res?.data || res
  }

  async function removeContact(id) {
    await $fetch(`${API_BASE}/sfa-contacts/remove`, {
      method: 'POST', body: { ...caller(), id },
    })
  }

  return {
    prospects, clients, contacts, loading, error,
    searchProspects, createProspect, updateProspect,
    searchClients,
    fetchContacts, addContact, updateContact, removeContact,
  }
}
