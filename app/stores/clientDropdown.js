// stores/clientDropdown.js
import { defineStore } from 'pinia'

export const useClientDropdownStore = defineStore('clientDropdown', () => {
  // State
  const clients = ref([])
  const loading = ref(false)
  const loadingMore = ref(false)
  const hasMore = ref(true)
  const currentPage = ref(1)
  const searchResults = ref([])
  const searchLoading = ref(false)
  const totalItems = ref(0)
  const pageSize = ref(1000) // Match API page size
  
  // Background loading state
  const backgroundLoading = ref(false)
  const backgroundPaused = ref(false)
  const backgroundComplete = ref(false)
  const backgroundProgress = ref(0)
  const backgroundQueue = ref([])
  const backgroundCurrentPage = ref(1)
  const backgroundTotalPages = ref(0)
  const backgroundError = ref(null)

    // Runtime config
  const config = useRuntimeConfig()
  
  // API base URL from environment
  const API_BASE = config.public.apiBase;// || 'https://cms-vgad.visiongroup.co.ug/api';
  
  // Cache for quick lookup
  const clientMap = ref(new Map())
  
  // Background loading configuration
  const backgroundChunkSize = ref(500) // Clients per background chunk
  const backgroundInterval = ref(300) // ms between chunks
  
  // Getters
  const getClientById = (id) => clientMap.value.get(id)
  
  const dropdownOptions = computed(() => 
    clients.value.map(client => ({
      value: client.id,
      label: client.company_name,
      ...client
    }))
  )

  const searchOptions = computed(() => 
    searchResults.value.map(client => ({
      value: client.id,
      label: client.company_name,
      ...client
    }))
  )

  const loadedPages = computed(() => Math.ceil(clients.value.length / pageSize.value))
  const remainingPages = computed(() => Math.ceil((totalItems.value - clients.value.length) / pageSize.value))
  const loadProgress = computed(() => 
    totalItems.value ? Math.round((clients.value.length / totalItems.value) * 100) : 0
  )

  const isFullyLoaded = computed(() => 
    totalItems.value > 0 && clients.value.length >= totalItems.value
  )

  const needsBackgroundLoad = computed(() => 
    !isFullyLoaded.value && !backgroundComplete.value && totalItems.value > 0
  )

  // Actions
  const loadInitialClients = async (options = {}) => {
    const { force = false, background = false } = options
    
    if (!force && clients.value.length > 0) return
    if (loading.value && !background) return
    
    loading.value = true
    
    try {
      const { data, error } = await useFetch(`${API_BASE}/clients/get-ad-client`, {
        query: {
          page: 1,
          pageSize: pageSize.value,
          sort: 'company_name:asc'
        }
      })

      if (error.value) throw error.value

      const response = data.value
      clients.value = response.data
      totalItems.value = response.meta?.pagination?.total || response.data.length
      
      // Calculate total pages
      backgroundTotalPages.value = Math.ceil(totalItems.value / pageSize.value)
      
      // Update cache
      response.data.forEach(client => {
        clientMap.value.set(client.id, client)
      })
      
      currentPage.value = 1
      backgroundCurrentPage.value = 1
      hasMore.value = response.data.length === pageSize.value
      
      // Auto-start background loading if configured
      if (options.autoBackgroundLoad !== false && needsBackgroundLoad.value) {
        startBackgroundLoading()
      }
      
    } catch (error) {
      console.error('Error loading initial clients:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const loadMore = async (options = {}) => {
    const { background = false } = options
    
    if (!hasMore.value || loadingMore.value) return

    const nextPage = currentPage.value + 1
    loadingMore.value = true
    
    try {
      const { data, error } = await useFetch(`${API_BASE}/clients/get-ad-client`, {
        query: {
          page: nextPage,
          pageSize: pageSize.value,
          sort: 'company_name:asc'
        }
      })

      if (error.value) throw error.value

      const response = data.value
      
      if (response.data.length > 0) {
        clients.value = [...clients.value, ...response.data]
        currentPage.value = nextPage
        hasMore.value = response.data.length === pageSize.value
        
        // Update cache
        response.data.forEach(client => {
          clientMap.value.set(client.id, client)
        })
      } else {
        hasMore.value = false
      }
      
    } catch (error) {
      console.error('Error loading more clients:', error)
      throw error
    } finally {
      loadingMore.value = false
    }
  }

  // Load a specific page if needed
  const loadPage = async (page) => {
    if (page <= currentPage.value) return // Already loaded
    
    try {
      const { data, error } = await useFetch(`${API_BASE}/clients/get-ad-client`, {
        query: {
          page: page,
          pageSize: pageSize.value,
          sort: 'company_name:asc'
        }
      })

      if (error.value) throw error.value

      const response = data.value
      
      if (response.data.length > 0) {
        // Add only new clients
        const newClients = response.data.filter(
          newClient => !clientMap.value.has(newClient.id)
        )
        
        if (newClients.length > 0) {
          // Insert at correct position to maintain order
          const startIndex = (page - 1) * pageSize.value
          const newClientsArray = [...clients.value]
          newClientsArray.splice(startIndex, 0, ...newClients)
          clients.value = newClientsArray
          
          // Update cache
          newClients.forEach(client => {
            clientMap.value.set(client.id, client)
          })
        }
        
        if (page > currentPage.value) {
          currentPage.value = page
        }
        hasMore.value = response.data.length === pageSize.value
      }
      
    } catch (error) {
      console.error(`Error loading page ${page}:`, error)
      throw error
    }
  }

  // Background loading methods
  const startBackgroundLoading = async (options = {}) => {
    const { 
      startPage = currentPage.value + 1, 
      chunkSize = backgroundChunkSize.value,
      delay = backgroundInterval.value 
    } = options
    
    if (backgroundLoading.value || isFullyLoaded.value || backgroundComplete.value) {
      return
    }

    // If we don't have total items yet, we can't background load
    if (totalItems.value === 0) {
      console.warn('Cannot start background loading: total items unknown')
      return
    }

    backgroundLoading.value = true
    backgroundPaused.value = false
    backgroundError.value = null
    
    // Build queue of pages to load
    backgroundQueue.value = []
    for (let page = startPage; page <= backgroundTotalPages.value; page++) {
      backgroundQueue.value.push(page)
    }
    
    // Start processing
    await processBackgroundQueue({ chunkSize, delay })
  }

  const processBackgroundQueue = async (options = {}) => {
    const { chunkSize = 500, delay = 300 } = options
    
    while (backgroundQueue.value.length > 0 && backgroundLoading.value && !backgroundPaused.value) {
      // Check if we should stop (all loaded)
      if (isFullyLoaded.value) {
        backgroundComplete.value = true
        backgroundLoading.value = false
        backgroundProgress.value = 100
        return
      }
      
      // Get next page to load
      const nextPage = backgroundQueue.value[0]
      
      try {
        // Load the page in background
        await loadBackgroundPage(nextPage)
        
        // Remove from queue
        backgroundQueue.value.shift()
        
        // Update progress
        const loadedPagesCount = backgroundTotalPages.value - backgroundQueue.value.length
        backgroundProgress.value = Math.round((loadedPagesCount / backgroundTotalPages.value) * 100)
        
        // Small delay between requests to avoid overwhelming the server
        if (backgroundQueue.value.length > 0 && delay > 0) {
          await new Promise(resolve => setTimeout(resolve, delay))
        }
        
      } catch (error) {
        console.error(`Error loading background page ${nextPage}:`, error)
        backgroundError.value = error
        
        // Pause on error
        backgroundPaused.value = true
        
        // Could implement retry logic here
        break
      }
    }
    
    // Check if complete
    if (backgroundQueue.value.length === 0 || isFullyLoaded.value) {
      backgroundComplete.value = true
      backgroundLoading.value = false
      backgroundProgress.value = 100
    }
  }

  const loadBackgroundPage = async (page) => {
    try {
      const { data, error } = await useFetch(`${API_BASE}/clients/get-ad-client`, {
        query: {
          page,
          pageSize: pageSize.value,
          sort: 'company_name:asc'
        }
      })

      if (error.value) throw error.value

      const response = data.value
      
      if (response.data.length > 0) {
        // Add to clients (avoid duplicates)
        const newClients = response.data.filter(
          newClient => !clientMap.value.has(newClient.id)
        )
        
        if (newClients.length > 0) {
          clients.value = [...clients.value, ...newClients]
          
          // Update cache
          newClients.forEach(client => {
            clientMap.value.set(client.id, client)
          })
        }
        
        // Update current page if this page is the next one sequentially
        if (page === currentPage.value + 1) {
          currentPage.value = page
          hasMore.value = response.data.length === pageSize.value
        }
      }
      
      return response
      
    } catch (error) {
      throw error
    }
  }

  const pauseBackgroundLoading = () => {
    if (backgroundLoading.value) {
      backgroundPaused.value = true
    }
  }

  const resumeBackgroundLoading = () => {
    if (backgroundLoading.value && backgroundPaused.value) {
      backgroundPaused.value = false
      processBackgroundQueue()
    } else if (!backgroundLoading.value && needsBackgroundLoad.value && !backgroundComplete.value) {
      startBackgroundLoading()
    }
  }

  const stopBackgroundLoading = () => {
    backgroundLoading.value = false
    backgroundPaused.value = false
    backgroundQueue.value = []
  }

  const loadAllNow = async (options = {}) => {
    const { onProgress, chunkSize = 500, delay = 100 } = options
    
    if (isFullyLoaded.value) return
    
    // Stop any background loading
    stopBackgroundLoading()
    
    // Load all remaining pages
    const startPage = currentPage.value + 1
    const pagesToLoad = []
    
    for (let page = startPage; page <= backgroundTotalPages.value; page++) {
      pagesToLoad.push(page)
    }
    
    for (let i = 0; i < pagesToLoad.length; i++) {
      const page = pagesToLoad[i]
      
      try {
        await loadBackgroundPage(page)
        
        // Update progress
        const progress = Math.round(((currentPage.value) / backgroundTotalPages.value) * 100)
        backgroundProgress.value = progress
        
        if (onProgress) {
          onProgress({
            page,
            totalPages: backgroundTotalPages.value,
            loaded: currentPage.value,
            progress
          })
        }
        
        // Small delay between requests
        if (i < pagesToLoad.length - 1 && delay > 0) {
          await new Promise(resolve => setTimeout(resolve, delay))
        }
        
      } catch (error) {
        console.error(`Error loading page ${page}:`, error)
        throw error
      }
    }
    
    backgroundComplete.value = true
    backgroundProgress.value = 100
  }

  const searchClients = async (query) => {
    if (!query || query.length < 2) {
      searchResults.value = []
      return
    }

    searchLoading.value = true
    
    try {
      // First try local cache (much faster)
      const localResults = Array.from(clientMap.value.values())
        .filter(client => {
          const searchTerm = query.toLowerCase()
          return client.company_name?.toLowerCase().includes(searchTerm) ||
                 (client.bc_no && client.bc_no.toLowerCase().includes(searchTerm)) ||
                 (client.email && client.email.toLowerCase().includes(searchTerm))
        })
        .slice(0, 100) // Limit to 100 results for performance

      // If we have enough local results, use them immediately
      if (localResults.length >= 5) {
        searchResults.value = localResults
        searchLoading.value = false
        return
      }

      // If not enough local results, fetch from API
      const { data, error } = await useFetch(`${API_BASE}/clients/search`, {
        query: { 
          q: query, 
          limit: 50,
          page: 1,
          pageSize: 50
        }
      })

      if (error.value) throw error.value

      // Merge API results with local cache (avoid duplicates)
      const apiResults = data.value || []
      const mergedResults = [...localResults]
      
      apiResults.forEach(client => {
        if (!mergedResults.some(c => c.id === client.id)) {
          mergedResults.push(client)
        }
      })
      
      searchResults.value = mergedResults
      
    } catch (error) {
      console.error('Error searching clients:', error)
      // If API fails, at least show local results
      if (localResults.length > 0) {
        searchResults.value = localResults
      } else {
        searchResults.value = []
      }
    } finally {
      searchLoading.value = false
    }
  }

  const clearSearch = () => {
    searchResults.value = []
  }

  const refresh = async (options = {}) => {
    const { clearCache = true, restartBackground = true } = options
    
    clients.value = []
    clientMap.value.clear()
    currentPage.value = 1
    backgroundCurrentPage.value = 1
    hasMore.value = true
    
    // Reset background state
    if (restartBackground) {
      stopBackgroundLoading()
      backgroundComplete.value = false
      backgroundProgress.value = 0
      backgroundQueue.value = []
      backgroundError.value = null
    }
    
    await loadInitialClients({ force: true })
  }

  const getClientByIndex = (index) => {
    return clients.value[index]
  }

  const preloadPages = async (pages) => {
    const pagesToLoad = pages.filter(p => p > currentPage.value)
    
    for (const page of pagesToLoad) {
      if (!clientMap.value.has(page)) {
        await loadBackgroundPage(page)
      }
    }
  }

  const getLoadStatus = () => ({
    isFullyLoaded: isFullyLoaded.value,
    backgroundLoading: backgroundLoading.value,
    backgroundPaused: backgroundPaused.value,
    backgroundComplete: backgroundComplete.value,
    backgroundProgress: backgroundProgress.value,
    loadedPages: loadedPages.value,
    remainingPages: remainingPages.value,
    totalItems: totalItems.value,
    loadedItems: clients.value.length,
    backgroundError: backgroundError.value
  })

  return {
    // State
    clients: readonly(clients),
    loading,
    loadingMore,
    hasMore,
    searchResults,
    searchLoading,
    totalItems,
    pageSize,
    
    // Background state
    backgroundLoading,
    backgroundPaused,
    backgroundComplete,
    backgroundProgress,
    backgroundError,
    
    // Getters
    dropdownOptions,
    searchOptions,
    getClientById,
    getClientByIndex,
    loadProgress,
    loadedPages,
    remainingPages,
    isFullyLoaded,
    needsBackgroundLoad,
    getLoadStatus,
    
    // Actions
    loadInitialClients,
    loadMore,
    loadPage,  // Now this is defined
    searchClients,
    clearSearch,
    refresh,
    preloadPages,
    
    // Background actions
    startBackgroundLoading,
    pauseBackgroundLoading,
    resumeBackgroundLoading,
    stopBackgroundLoading,
    loadAllNow
  }
})