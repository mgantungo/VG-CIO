// composables/useClientDropdown.js
import { storeToRefs } from 'pinia'

export const useClientDropdown = (options = {}) => {
  const {
    enableSearch = true,
    lazyLoad = true,
    placeholder = 'Select a client...',
    clearable = true
  } = options

  const store = useClientDropdownStore()
  const { 
    dropdownOptions, 
    searchOptions, 
    loading, 
    searchLoading,
    hasMore,
    totalItems
  } = storeToRefs(store)

  // Local state
  const searchQuery = ref('')
  const debouncedSearch = refDebounced(searchQuery, 300)
  const isOpen = ref(false)
  const selectedClient = ref(null)
  const dropdownRef = ref(null)
  const virtualListRef = ref(null)

  // Computed
  const displayOptions = computed(() => {
    if (searchQuery.value && searchOptions.value.length > 0) {
      return searchOptions.value
    }
    return dropdownOptions.value
  })

  const isEmpty = computed(() => displayOptions.value.length === 0)
  const showNoResults = computed(() => 
    searchQuery.value && searchOptions.value.length === 0 && !searchLoading.value
  )
  const showSearch = computed(() => enableSearch && !searchLoading.value)

  const totalCount = computed(() => totalItems.value)

  // Methods
  const loadInitial = async () => {
    if (lazyLoad && dropdownOptions.value.length === 0) {
      await store.loadInitialClients()
    }
  }

  const onScroll = async (event) => {
    const { scrollTop, scrollHeight, clientHeight } = event.target
    const bottom = scrollHeight - scrollTop - clientHeight < 50
    
    if (bottom && hasMore.value && !loading.value && !searchQuery.value) {
      await store.loadMore()
    }
  }

  const onSearch = async (query) => {
    if (!query || query.length < 2) {
      store.clearSearch()
      return
    }
    await store.searchClients(query)
  }

  const selectClient = (client) => {
    selectedClient.value = client
    isOpen.value = false
    searchQuery.value = ''
    store.clearSearch()
  }

  const clearSelection = () => {
    selectedClient.value = null
  }

  const focus = () => {
    dropdownRef.value?.focus()
  }

  const blur = () => {
    dropdownRef.value?.blur()
  }

  // Watchers
  watch(debouncedSearch, async (query) => {
    await onSearch(query)
  })

  watch(isOpen, async (open) => {
    if (open && dropdownOptions.value.length === 0) {
      await loadInitial()
    }
  })

  // Lifecycle
  onMounted(() => {
    if (!lazyLoad) {
      loadInitial()
    }
  })

  return {
    // State
    searchQuery,
    isOpen,
    selectedClient,
    loading,
    searchLoading,
    hasMore,
    
    // Computed
    displayOptions,
    isEmpty,
    showNoResults,
    showSearch,
    totalCount,
    
    // Refs
    dropdownRef,
    virtualListRef,
    
    // Methods
    loadInitial,
    onScroll,
    selectClient,
    clearSelection,
    focus,
    blur,
    
    // Store actions (expose if needed)
    refreshStore: store.refresh,
    getClientById: store.getClientById
  }
}