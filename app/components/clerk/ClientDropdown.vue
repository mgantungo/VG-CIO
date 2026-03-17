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

@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@600&display=swap');

.client-dropdown { 
  --navy:#003366; --navy-light:#004080; --red:#E31E24; --blue:#0066CC; --blue-lt:#EEF4FF;
  --surface:#FFFFFF; --page-bg:#F0F4F8; --border:#D1D9E0; --border-lt:#E8ECF0;
  --text-1:#0F172A; --text-2:#334155; --text-3:#64748B; --text-4:#94A3B8;
  --green-text:#166534; --green-bg:#F0FDF4; --green-bd:#86EFAC;
  --red-text:#991B1B; --red-bg:#FEF2F2; --red-bd:#FECACA;
  --amber-text:#78350F; --amber-bg:#FFFBEB; --amber-bd:#FCD34D;
  --radius:2px; --ring:0 0 0 3px rgba(0,102,204,.15);
  --shadow-sm:0 1px 3px rgba(0,0,0,.07),0 1px 2px rgba(0,0,0,.05);
  --shadow-md:0 4px 16px rgba(0,0,0,.08),0 2px 6px rgba(0,0,0,.05);
  --t:140ms ease; --font:"IBM Plex Sans",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
 position: relative; width: 100%; font-family: var(--font); font-size: 13px; }

.dropdown-trigger {
  display: flex; align-items: center; justify-content: space-between;
  width: 100%; height: 38px; padding: 0 12px;
  background: var(--surface); border: 1.5px solid var(--border);
  border-radius: var(--radius); cursor: pointer; outline: none;
  transition: border-color var(--t), box-shadow var(--t); box-sizing: border-box;
}
.dropdown-trigger:hover:not(.disabled) { border-color: var(--blue); }
.dropdown-trigger:focus:not(.disabled) { border-color: var(--blue); box-shadow: var(--ring); }
.dropdown-trigger.open { border-color: var(--blue); box-shadow: var(--ring); }
.dropdown-trigger.disabled { background: var(--page-bg); border-color: var(--border); cursor: not-allowed; opacity: .6; }

.dropdown-trigger.size-small  { height: 32px; font-size: 12px; padding: 0 10px; }
.dropdown-trigger.size-medium { height: 38px; font-size: 13px; }
.dropdown-trigger.size-large  { height: 44px; font-size: 14px; padding: 0 14px; }

.selected-value-container { display: flex; align-items: center; gap: 7px; flex: 1; min-width: 0; }
.selected-icon { font-size: .85em; opacity: .6; }
.selected-value { color: var(--text-1); font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.placeholder { color: var(--text-4); }

.dropdown-icons { display: flex; align-items: center; gap: 6px; margin-left: 6px; }
.loading-icon { animation: spin 1s linear infinite; color: var(--blue); font-size: 12px; }
.clear-icon { color: var(--text-4); font-size: 12px; cursor: pointer; padding: 2px 4px; border-radius: var(--radius); transition: all var(--t); }
.clear-icon:hover { color: var(--red-text); background: var(--red-bg); }
.arrow-icon { color: var(--text-3); font-size: 10px; transition: transform var(--t); }
.arrow-icon.open { transform: rotate(180deg); color: var(--blue); }

/* Menu */
.dropdown-menu {
  background: #FFFFFF; border: 1.5px solid #D1D9E0;
  border-top: 2px solid #003366; border-radius: 0 0 2px 2px;
  box-shadow: 0 8px 32px rgba(0,0,0,.16); z-index: 99999; overflow: hidden;
  display: flex; flex-direction: column; min-width: 280px;
  font-family: "IBM Plex Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-size: 13px; color: #0F172A;
  animation: dropDown .12s ease;
}
@keyframes dropDown { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }

.search-container {
  padding: 8px 10px; border-bottom: 1px solid #E8ECF0;
  background: #F0F4F8; position: relative;
}
.search-icon { position: absolute; left: 18px; top: 50%; transform: translateY(-50%); color: #94A3B8; font-size: 12px; z-index: 1; }
.search-input {
  width: 100%; height: 34px; padding: 0 30px 0 30px;
  border: 1.5px solid #D1D9E0; border-radius: 2px;
  font-family: "IBM Plex Sans", -apple-system, sans-serif; font-size: 13px; color: #0F172A;
  background: #FFFFFF; outline: none; box-sizing: border-box;
  transition: border-color 140ms ease, box-shadow 140ms ease;
}
.search-input:focus { border-color: #0066CC; box-shadow: 0 0 0 3px rgba(0,102,204,.15); }
.search-spinner { position: absolute; right: 18px; top: 50%; transform: translateY(-50%); animation: spin 1s linear infinite; color: #0066CC; font-size: 12px; }
.clear-search { position: absolute; right: 18px; top: 50%; transform: translateY(-50%); color: #94A3B8; font-size: 12px; cursor: pointer; padding: 2px 4px; border-radius: 2px; }
.clear-search:hover { color: #991B1B; }

.results-stats {
  padding: 5px 12px; background: #F0F4F8;
  border-bottom: 1px solid #E8ECF0;
  font-size: 11px; color: #64748B;
  display: flex; justify-content: space-between;
}
.local-badge {
  height: 18px; padding: 0 7px; display: inline-flex; align-items: center;
  background: #E8ECF0; color: #64748B; border-radius: 1px;
  font-size: 10px; font-weight: 600;
}

.options-container { overflow-y: auto; max-height: 280px; background: #FFFFFF; }

.loading-state {
  padding: 32px 16px; text-align: center; color: #64748B;
  display: flex; flex-direction: column; align-items: center; gap: 10px; font-size: 13px;
  background: #FFFFFF;
}
.spinner {
  width: 28px; height: 28px; border: 2px solid #E8ECF0;
  border-top-color: #0066CC; border-radius: 50%; animation: spin .7s linear infinite;
}
.spinner-small {
  width: 14px; height: 14px; border: 2px solid #E8ECF0;
  border-top-color: #0066CC; border-radius: 50%; animation: spin .7s linear infinite; display: inline-block;
}
@keyframes spin { to { transform: rotate(360deg); } }

.empty-state {
  padding: 32px 16px; text-align: center; color: #94A3B8;
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  background: #FFFFFF;
}
.empty-icon { font-size: 1.8em; opacity: .35; margin-bottom: 4px; }
.empty-hint { font-size: 11px; color: #94A3B8; }

.dropdown-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 12px; cursor: pointer;
  border-bottom: 1px solid #E8ECF0;
  transition: background 140ms ease;
}
.dropdown-item.size-small  { height: 36px; }
.dropdown-item.size-medium { height: 44px; }
.dropdown-item.size-large  { height: 52px; }
.dropdown-item:last-child { border-bottom: none; }
.dropdown-item:nth-child(even) { background: #F0F4F8; }
.dropdown-item:hover { background: #EEF4FF !important; }
.dropdown-item.highlighted { background: #F0F4F8 !important; }
.dropdown-item.selected { background: #EEF4FF !important; border-left: 3px solid #0066CC; }

.item-content { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; }
.item-icon { font-size: .85em; opacity: .55; flex-shrink: 0; }
.item-details { display: flex; flex-direction: column; min-width: 0; flex: 1; }
.item-label { font-size: 13px; font-weight: 500; color: #0F172A; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.item-meta { display: flex; gap: 8px; font-size: 11px; color: #94A3B8; margin-top: 2px; }
.item-bc { color: #0066CC; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100px; font-family: "IBM Plex Mono", monospace; }
.item-email { color: #166534; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 120px; }
.item-status { display: flex; align-items: center; flex-shrink: 0; }
.check-icon { color: #166534; font-weight: bold; font-size: 14px; }

.loading-more {
  padding: 10px 12px; text-align: center; color: #64748B; font-size: 11px;
  display: flex; align-items: center; justify-content: center; gap: 6px;
  background: #F0F4F8; border-top: 1px solid #E8ECF0;
}

.dropdown-footer {
  padding: 7px 12px; border-top: 1px solid #E8ECF0;
  background: #F0F4F8; font-size: 11px;
  display: flex; justify-content: space-between; align-items: center;
}
.footer-left { display: flex; gap: 6px; align-items: center; }
.total-badge {
  height: 20px; padding: 0 8px; display: inline-flex; align-items: center;
  background: #003366; color: #fff; font-size: 10px; font-weight: 700; border-radius: 1px;
}
.loaded-badge {
  height: 20px; padding: 0 8px; display: inline-flex; align-items: center;
  background: #E8ECF0; color: #64748B; font-size: 10px; font-weight: 600; border-radius: 1px;
}
.retry-btn {
  height: 26px; padding: 0 10px; background: #FFFFFF;
  border: 1.5px solid #D1D9E0; border-radius: 2px;
  font-family: "IBM Plex Sans", -apple-system, sans-serif; font-size: 11px; font-weight: 600; color: #334155;
  cursor: pointer; transition: all 140ms ease;
}
.retry-btn:hover { border-color: #0066CC; color: #0066CC; background: #EEF4FF; }

@media (max-width: 640px) { .dropdown-menu { width: 100% !important; left: 0 !important; } }

</style>