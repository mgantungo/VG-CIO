<!-- components/ClientDropdown.vue -->
<template>
  <div class="client-dropdown" ref="dropdownRef">
    <!-- Dropdown Trigger / Selected Value -->
    <div 
      class="dropdown-trigger"
      :class="[
        { 
          'open': isOpen, 
          'has-value': selectedClient,
          'disabled': disabled,
          [`size-${size}`]: true
        }
      ]"
      @click="toggleDropdown"
      @keydown.enter="toggleDropdown"
      @keydown.esc="closeDropdown"
      @keydown.down="focusDropdown"
      tabindex="0"
      role="combobox"
      :aria-expanded="isOpen"
      :aria-haspopup="listbox"
    >
      <div class="selected-value-container">
        <span class="selected-icon" v-if="selectedClient">🏢</span>
        <span class="selected-value" v-if="selectedClient">
          {{ selectedClient.label }}
        </span>
        <span class="placeholder" v-else>
          {{ placeholder }}
        </span>
      </div>
      
      <div class="dropdown-icons">
        <!-- Loading Indicator -->
        <span v-if="isLoading" 
              class="loading-icon" 
              title="Loading...">↻</span>
        <span v-if="clearable && selectedClient" 
              class="clear-icon" 
              @click.stop="clearSelection"
              title="Clear selection">✕</span>
        <span class="arrow-icon" :class="{ 'open': isOpen }">▼</span>
      </div>
    </div>

    <!-- Dropdown Menu -->
    <Teleport to="body">
      <transition name="dropdown">
        <div v-if="isOpen" 
             class="dropdown-menu"
             :style="menuStyles"
             ref="menuRef"
             @click.self="closeDropdown"
        >
          <!-- Search Input -->
          <div class="search-container">
            <span class="search-icon">🔍</span>
            <input
              v-model="searchQuery"
              type="text"
              class="search-input"
              :placeholder="searchPlaceholder"
              autofocus
              @click.stop
              @input="handleSearchInput"
            />
            <span v-if="isSearching" class="search-spinner">↻</span>
            <span v-if="searchQuery && !isSearching" 
                  class="clear-search" 
                  @click.stop="clearSearch">✕</span>
          </div>

          <!-- Quick Results Stats -->
          <div class="results-stats" v-if="!isSearching && !isLoading">
            <span>{{ displayOptions.length }} clients</span>
            <span v-if="hasLocalResults" class="local-badge">including cached</span>
          </div>

          <!-- Options List -->
          <div 
            class="options-container"
            ref="scrollContainerRef"
            @scroll="handleScroll"
          >
            <!-- Loading State -->
            <div v-if="isLoading && !displayOptions.length" class="loading-state">
              <span class="spinner"></span>
              <span>Loading clients...</span>
            </div>

            <!-- Search Loading State -->
            <div v-else-if="isSearching" class="loading-state">
              <span class="spinner-small"></span>
              <span>Searching...</span>
            </div>

            <!-- No Results -->
            <div v-else-if="!displayOptions.length" class="empty-state">
              <span class="empty-icon">🔍</span>
              <span>{{ noResultsMessage }}</span>
              <span v-if="searchQuery" class="empty-hint">Try a different search term</span>
            </div>

            <!-- Results List -->
            <template v-else>
              <div
                v-for="(item, index) in displayOptions"
                :key="item.value"
                class="dropdown-item"
                :class="{ 
                  'selected': selectedClient?.value === item.value,
                  'highlighted': hoveredIndex === index,
                  [`size-${size}`]: true
                }"
                @click="selectItem(item)"
                @mouseenter="hoveredIndex = index"
                @mouseleave="hoveredIndex = -1"
              >
                <div class="item-content">
                  <span class="item-icon">🏢</span>
                  <div class="item-details">
                    <span class="item-label">{{ item.label }}</span>
                    <span class="item-meta" v-if="item.bc_no || item.email">
                      <span v-if="item.bc_no" class="item-bc">BC: {{ item.bc_no }}</span>
                      <span v-if="item.email" class="item-email">{{ item.email }}</span>
                    </span>
                  </div>
                </div>
                <div class="item-status">
                  <span v-if="selectedClient?.value === item.value" class="check-icon">✓</span>
                </div>
              </div>

              <!-- Loading More Indicator (only when not searching) -->
              <div v-if="isLoadingMore && !searchQuery" class="loading-more">
                <span class="spinner-small"></span>
                <span>Loading more...</span>
              </div>
            </template>
          </div>

          <!-- Footer -->
          <div class="dropdown-footer">
            <div class="footer-left">
              <span class="total-badge">{{ totalCount || 0 }} total</span>
              <span v-if="!searchQuery && loadedCount < totalCount" class="loaded-badge">
                {{ loadedCount }} loaded
              </span>
            </div>
            <div class="footer-right">
              <button v-if="loadError" 
                      class="retry-btn" 
                      @click.stop="retryLoad">
                ⟳ Retry
              </button>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useClientDropdownStore } from '~/stores/clientDropdown'
import { storeToRefs } from 'pinia'

const props = defineProps({
  modelValue: {
    type: [Number, String, Object],
    default: null
  },
  placeholder: {
    type: String,
    default: 'Select a client...'
  },
  searchPlaceholder: {
    type: String,
    default: 'Search by name or BC number...'
  },
  clearable: {
    type: Boolean,
    default: true
  },
  enableSearch: {
    type: Boolean,
    default: true
  },
  disabled: {
    type: Boolean,
    default: false
  },
  size: {
    type: String,
    default: 'medium',
    validator: (value) => ['small', 'medium', 'large'].includes(value)
  },
  autoInitialize: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:modelValue', 'change', 'focus', 'blur'])

// Store
const store = useClientDropdownStore()
const { 
  dropdownOptions, 
  searchResults,
  loading, 
  loadingMore,
  searchLoading,
  hasMore,
  totalItems,
  isInitialized
} = storeToRefs(store)

// Local state
const searchQuery = ref('')
const searchDebounce = ref(null)
const isOpen = ref(false)
const selectedClient = ref(null)
const hoveredIndex = ref(-1)
const loadError = ref(false)
const dropdownRef = ref(null)
const menuRef = ref(null)
const scrollContainerRef = ref(null)

// Computed
const isLoading = computed(() => loading.value && !searchQuery.value)
const isSearching = computed(() => searchLoading.value)
const isLoadingMore = computed(() => loadingMore.value && !searchQuery.value)
const totalCount = computed(() => totalItems.value)
const loadedCount = computed(() => dropdownOptions.value.length)

// Display options based on search state
const displayOptions = computed(() => {
  if (searchQuery.value) {
    return searchResults.value.map(client => ({
      value: client.id,
      label: client.company_name,
      ...client
    }))
  }
  return dropdownOptions.value.map(client => ({
    value: client.id,
    label: client.company_name,
    ...client
  }))
})

const hasLocalResults = computed(() => {
  if (!searchQuery.value) return false
  return dropdownOptions.value.some(c => 
    c.company_name.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

const noResultsMessage = computed(() => {
  if (searchQuery.value) {
    return `No clients found matching "${searchQuery.value}"`
  }
  return 'No clients available'
})

// Menu positioning
const menuStyles = computed(() => {
  if (!dropdownRef.value) return {}
  
  const rect = dropdownRef.value.getBoundingClientRect()
  const spaceBelow = window.innerHeight - rect.bottom
  const menuHeight = Math.min(400, spaceBelow - 20)
  
  return {
    position: 'absolute',
    top: `${rect.bottom + window.scrollY}px`,
    left: `${rect.left + window.scrollX}px`,
    width: `${rect.width}px`,
    maxHeight: `${menuHeight}px`,
    transformOrigin: 'top'
  }
})

// Methods
const toggleDropdown = () => {
  if (props.disabled) return
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    emit('focus')
    loadInitial()
  } else {
    emit('blur')
    clearSearch()
  }
}

const closeDropdown = () => {
  isOpen.value = false
  clearSearch()
  emit('blur')
}

const clearSearch = () => {
  searchQuery.value = ''
  store.clearSearch()
}

const loadInitial = async () => {
  if (props.autoInitialize && !isInitialized.value) {
    loadError.value = false
    try {
      await store.loadInitialClients({ background: false })
    } catch (error) {
      loadError.value = true
      console.error('Failed to load clients:', error)
    }
  }
}

const retryLoad = () => {
  loadError.value = false
  loadInitial()
}

const handleSearchInput = () => {
  if (searchDebounce.value) {
    clearTimeout(searchDebounce.value)
  }
  
  searchDebounce.value = setTimeout(() => {
    performSearch()
  }, 300)
}

const performSearch = async () => {
  if (!searchQuery.value || searchQuery.value.length < 2) {
    store.clearSearch()
    return
  }
  
  await store.searchClients(searchQuery.value)
}

const handleScroll = async (event) => {
  const { scrollTop, scrollHeight, clientHeight } = event.target
  const bottom = scrollHeight - scrollTop - clientHeight < 100
  
  // Load more when scrolling near bottom (only when not searching)
  if (bottom && hasMore.value && !loadingMore.value && !searchQuery.value) {
    await store.loadMore({ background: false })
  }
}

const selectItem = (item) => {
  selectedClient.value = item
  emit('update:modelValue', item.value)
  emit('change', item)
  closeDropdown()
}

const clearSelection = () => {
  selectedClient.value = null
  emit('update:modelValue', null)
  emit('change', null)
}

const getClientById = (id) => {
  return store.getClientById(id)
}

// Watchers
watch(isOpen, (open) => {
  if (open) {
    // Reset scroll position
    if (scrollContainerRef.value) {
      scrollContainerRef.value.scrollTop = 0
    }
  }
})

watch(() => props.modelValue, async (newVal) => {
  if (newVal) {
    let client = getClientById(newVal)
    if (client) {
      selectedClient.value = {
        value: client.id,
        label: client.company_name,
        ...client
      }
    } else {
      // If not in cache, try to fetch or show placeholder
      selectedClient.value = { 
        value: newVal, 
        label: `Client ${newVal}` 
      }
    }
  } else {
    selectedClient.value = null
  }
}, { immediate: true })

// Keyboard navigation
const handleKeyDown = (e) => {
  if (!isOpen.value) return

  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault()
      if (displayOptions.value.length) {
        hoveredIndex.value = Math.min(
          hoveredIndex.value + 1, 
          displayOptions.value.length - 1
        )
        scrollToItem(hoveredIndex.value)
      }
      break
      
    case 'ArrowUp':
      e.preventDefault()
      if (displayOptions.value.length) {
        hoveredIndex.value = Math.max(hoveredIndex.value - 1, 0)
        scrollToItem(hoveredIndex.value)
      }
      break
      
    case 'Enter':
      e.preventDefault()
      if (hoveredIndex.value >= 0 && displayOptions.value[hoveredIndex.value]) {
        selectItem(displayOptions.value[hoveredIndex.value])
      }
      break
      
    case 'Escape':
      closeDropdown()
      break
      
    case 'Tab':
      closeDropdown()
      break
  }
}

const scrollToItem = (index) => {
  if (!scrollContainerRef.value || !displayOptions.value.length) return
  
  const itemHeight = props.size === 'small' ? 40 : props.size === 'large' ? 64 : 52
  const scrollTop = index * itemHeight
  
  scrollContainerRef.value.scrollTo({
    top: scrollTop,
    behavior: 'smooth'
  })
}

// Click outside
const handleClickOutside = (e) => {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target) &&
      menuRef.value && !menuRef.value.contains(e.target)) {
    closeDropdown()
  }
}

// Lifecycle
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleKeyDown)
  if (searchDebounce.value) {
    clearTimeout(searchDebounce.value)
  }
})

// Expose methods
defineExpose({
  focus: () => dropdownRef.value?.focus(),
  blur: closeDropdown,
  clear: clearSelection,
  refresh: store.refresh
})
</script>

<style scoped>
.client-dropdown {
  position: relative;
  width: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

/* Dropdown Trigger */
.dropdown-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  outline: none;
}

.dropdown-trigger:hover:not(.disabled) {
  border-color: #3b82f6;
  background-color: #f8fafc;
}

.dropdown-trigger:focus:not(.disabled) {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.dropdown-trigger.open {
  border-color: #3b82f6;
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}

.dropdown-trigger.disabled {
  background-color: #f1f5f9;
  border-color: #cbd5e1;
  cursor: not-allowed;
  opacity: 0.6;
}

/* Size variants */
.dropdown-trigger.size-small {
  padding: 6px 12px;
  min-height: 36px;
  font-size: 13px;
}

.dropdown-trigger.size-medium {
  padding: 8px 16px;
  min-height: 42px;
  font-size: 14px;
}

.dropdown-trigger.size-large {
  padding: 10px 20px;
  min-height: 48px;
  font-size: 16px;
}

.selected-value-container {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.selected-icon {
  font-size: 1.1em;
  opacity: 0.7;
}

.selected-value {
  color: #1e293b;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.placeholder {
  color: #94a3b8;
}

.dropdown-icons {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 8px;
}

.loading-icon {
  animation: spin 1s linear infinite;
  color: #3b82f6;
  font-size: 14px;
}

.clear-icon {
  color: #94a3b8;
  font-size: 14px;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
}

.clear-icon:hover {
  color: #ef4444;
  background-color: #fee2e2;
}

.arrow-icon {
  color: #64748b;
  font-size: 12px;
  transition: transform 0.2s;
}

.arrow-icon.open {
  transform: rotate(180deg);
  color: #3b82f6;
}

/* Dropdown Menu */
.dropdown-menu {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
  z-index: 9999;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-width: 280px;
  animation: slideDown 0.2s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Search */
.search-container {
  padding: 10px;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
  position: relative;
}

.search-icon {
  position: absolute;
  left: 18px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  font-size: 14px;
  z-index: 1;
}

.search-input {
  width: 100%;
  padding: 8px 12px 8px 36px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
  transition: all 0.2s;
  background: white;
}

.search-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.search-spinner {
  position: absolute;
  right: 18px;
  top: 50%;
  transform: translateY(-50%);
  animation: spin 1s linear infinite;
  color: #3b82f6;
  font-size: 14px;
}

.clear-search {
  position: absolute;
  right: 18px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  font-size: 14px;
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
}

.clear-search:hover {
  color: #ef4444;
  background-color: #fee2e2;
}

/* Results Stats */
.results-stats {
  padding: 6px 12px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  font-size: 12px;
  color: #64748b;
  display: flex;
  justify-content: space-between;
}

.local-badge {
  background: #e2e8f0;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
}

/* Options Container */
.options-container {
  overflow-y: auto;
  max-height: 300px;
  background: white;
}

/* Loading States */
.loading-state {
  padding: 40px 20px;
  text-align: center;
  color: #64748b;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e2e8f0;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid #e2e8f0;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  display: inline-block;
}

/* Empty State */
.empty-state {
  padding: 40px 20px;
  text-align: center;
  color: #94a3b8;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.empty-icon {
  font-size: 32px;
  opacity: 0.5;
  margin-bottom: 8px;
}

.empty-hint {
  font-size: 12px;
  color: #cbd5e1;
}

/* Dropdown Items */
.dropdown-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  cursor: pointer;
  transition: background-color 0.15s;
  border-bottom: 1px solid #f1f5f9;
}

.dropdown-item.size-small {
  height: 40px;
}

.dropdown-item.size-medium {
  height: 48px;
}

.dropdown-item.size-large {
  height: 56px;
}

.dropdown-item:hover {
  background-color: #f1f5f9;
}

.dropdown-item.highlighted {
  background-color: #eff6ff;
}

.dropdown-item.selected {
  background-color: #f0f9ff;
}

.item-content {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.item-icon {
  font-size: 1.1em;
  opacity: 0.6;
  flex-shrink: 0;
}

.item-details {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.item-label {
  font-weight: 500;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-meta {
  display: flex;
  gap: 8px;
  font-size: 11px;
  color: #64748b;
  margin-top: 2px;
}

.item-bc, .item-email {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
}

.item-bc {
  color: #3b82f6;
}

.item-email {
  color: #10b981;
}

.item-status {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.check-icon {
  color: #10b981;
  font-weight: bold;
  font-size: 16px;
}

/* Loading More */
.loading-more {
  padding: 12px;
  text-align: center;
  color: #64748b;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
}

/* Footer */
.dropdown-footer {
  padding: 8px 12px;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
  font-size: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.footer-left {
  display: flex;
  gap: 8px;
  align-items: center;
}

.total-badge {
  background: #3b82f6;
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 500;
}

.loaded-badge {
  background: #e2e8f0;
  color: #475569;
  padding: 2px 8px;
  border-radius: 4px;
}

.retry-btn {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 11px;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s;
}

.retry-btn:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

/* Animations */
@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Responsive */
@media (max-width: 640px) {
  .dropdown-menu {
    width: 100% !important;
    left: 0 !important;
    margin: 0 auto;
  }
}
</style>