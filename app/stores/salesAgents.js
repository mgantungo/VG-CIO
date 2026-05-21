import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useSalesAgentsStore = defineStore('salesAgents', () => {
  // State
  const salesAgents = ref([])
  const loading = ref(false)
  const error = ref(null)

  // API base URL from environment
  const config = useRuntimeConfig()
  const API_BASE = config.public.apiBase;// || 'https://cms-vgad.visiongroup.co.ug/api'

  // Getters
  const activeAgents = computed(() => {
    return salesAgents.value.filter(agent => agent.isActive)
  })

  const formattedDropdownOptions = computed(() => {
    return activeAgents.value.map(agent => ({
      value: agent.id,
      label: agent.name,
      email: agent.email
    }))
  })

  const getAgentById = computed(() => {
    return (id) => salesAgents.value.find(agent => agent.id === id)
  })

  // Actions
  const fetchSalesAgents = async () => {
    try {
      loading.value = true
      error.value = null

      const response = await $fetch(`${API_BASE}/sales-agents/active`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.success && response.data) {
        salesAgents.value = response.data.map(agent => ({
          id: agent.id,
          name: agent.name,
          email: agent.email,
          isActive: true
        }))
      } else {
        throw new Error(response.message || 'Failed to load sales agents')
      }
    } catch (err) {
      console.error('Failed to fetch sales agents:', err)
      error.value = err.message || 'Unable to load sales agents. Please try again.'
      
      // Fallback to mock data for development
      if (process.dev) {
        salesAgents.value = getMockSalesAgents()
      }
    } finally {
      loading.value = false
    }
  }

  const searchSalesAgents = async (query) => {
    try {
      loading.value = true
      
      const response = await $fetch(`${API_BASE}/sales-agents/search`, {
        method: 'GET',
        params: { q: query },
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.success && response.data) {
        return response.data.map(agent => ({
          id: agent.id,
          name: agent.name,
          email: agent.email,
          isActive: true
        }))
      } else {
        throw new Error(response.message || 'Failed to search sales agents')
      }
    } catch (err) {
      console.error('Failed to search sales agents:', err)
      error.value = err.message || 'Unable to search sales agents. Please try again.'
      return []
    } finally {
      loading.value = false
    }
  }

  // Mock data for development
  const getMockSalesAgents = () => [
    {
      id: 1,
      name: 'John Mwesigwa',
      email: 'john.mwesigwa@visiongroup.co.ug',
      isActive: true
    },
    {
      id: 2,
      name: 'Sarah Nakato',
      email: 'sarah.nakato@visiongroup.co.ug',
      isActive: true
    },
    {
      id: 3,
      name: 'David Omondi',
      email: 'david.omondi@visiongroup.co.ug',
      isActive: true
    },
    {
      id: 4,
      name: 'Grace Akello',
      email: 'grace.akello@visiongroup.co.ug',
      isActive: false
    },
    {
      id: 5,
      name: 'Robert Ssempijja',
      email: 'robert.ssempijja@visiongroup.co.ug',
      isActive: true
    }
  ]

  return {
    // State
    salesAgents,
    loading,
    error,
    
    // Getters
    activeAgents,
    formattedDropdownOptions,
    getAgentById,
    
    // Actions
    fetchSalesAgents,
    searchSalesAgents
  }
})