<template>
  <div class="sales-agent-section">
    <div class="section-header">
      <h3 class="section-title">
        <span class="section-icon">👔</span>
        Sales Agent Assignment
      </h3>
      <div v-if="isRequired" class="required-badge">Required</div>
    </div>
    
    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading sales agents...</p>
    </div>
    
    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <div class="error-icon">⚠️</div>
      <div class="error-content">
        <p class="error-title">Failed to load sales agents</p>
        <p class="error-message">{{ error }}</p>
        <button class="btn-retry" @click="loadSalesAgents">
          Retry
        </button>
      </div>
    </div>
    
    <!-- Main Content -->
    <div v-else class="sales-agent-content">
      <div class="form-group">
        <label>
          Select Sales Agent
          <span v-if="isRequired" class="required">*</span>
        </label>
        
        <!-- Dropdown Container -->
        <div class="dropdown-container">
          <div 
            class="dropdown-select"
            :class="{ 
              'dropdown-open': showDropdown,
              'dropdown-disabled': disabled,
              'dropdown-error': hasError
            }"
            @click="toggleDropdown"
          >
            <div class="selected-value">
              <template v-if="selectedAgent">
                <div class="selected-agent">
                  <div class="agent-avatar-sm">
                    {{ getInitials(selectedAgent.name) }}
                  </div>
                  <div class="agent-info-sm">
                    <div class="agent-name-sm">{{ selectedAgent.name }}</div>
                    <div class="agent-email-sm">{{ selectedAgent.email }}</div>
                  </div>
                </div>
              </template>
              <template v-else>
                <span class="placeholder">Select a sales agent...</span>
              </template>
            </div>
            <div class="dropdown-arrow">
              <span class="arrow-icon">{{ showDropdown ? '▲' : '▼' }}</span>
            </div>
          </div>
          
          <!-- Dropdown Options - WITH HIGH Z-INDEX -->
          <div v-if="showDropdown && !disabled" class="dropdown-options">
            <!-- Search Input -->
            <div class="dropdown-search">
              <div class="search-input-wrapper">
                <span class="search-icon">🔍</span>
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="Search sales agents..."
                  class="search-input"
                  @input="handleSearch"
                  @click.stop
                  ref="searchInput"
                />
                <button
                  v-if="searchQuery"
                  type="button"
                  class="clear-search"
                  @click="clearSearch"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <!-- Options List -->
            <div class="options-list" ref="optionsList">
              <div v-if="filteredAgents.length === 0" class="no-options">
                <div class="no-options-icon">👔</div>
                <div class="no-options-content">
                  <p>No sales agents found</p>
                  <p v-if="searchQuery" class="no-options-subtext">
                    Try a different search term
                  </p>
                </div>
              </div>
              
              <div
                v-for="agent in filteredAgents"
                :key="agent.id"
                class="dropdown-option"
                :class="{ 'option-selected': modelValue === agent.id }"
                @click="selectAgent(agent)"
              >
                <div class="option-content">
                  <div class="option-avatar">
                    {{ getInitials(agent.name) }}
                  </div>
                  <div class="option-info">
                    <div class="option-name">{{ agent.name }}</div>
                    <div class="option-email">{{ agent.email }}</div>
                  </div>
                </div>
                <div v-if="modelValue === agent.id" class="option-check">
                  ✓
                </div>
              </div>
            </div>
            
            <!-- Quick Stats -->
            <div class="dropdown-footer" v-if="!searchQuery">
              <div class="footer-stats">
                <span class="stat-item">
                  <span class="stat-label">Active Agents:</span>
                  <span class="stat-value">{{ activeAgentsCount }}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Validation Error -->
        <div v-if="hasError && !selectedAgent" class="validation-error">
          <span class="error-icon">⚠️</span>
          <span class="error-text">Please select a sales agent</span>
        </div>
        
        <!-- Selected Agent Details -->
         <!----
        <div v-if="selectedAgent" class="selected-agent-details">
          <div class="details-header">
            <h4 class="details-title">Selected Agent Details</h4>
            <button
              v-if="!disabled"
              type="button"
              class="btn-change"
              @click="clearSelection"
            >
              Change
            </button>
          </div>
          <div class="details-content">
            <div class="detail-row">
              <span class="detail-label">Name:</span>
              <span class="detail-value">{{ selectedAgent.name }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Email:</span>
              <span class="detail-value">{{ selectedAgent.email }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Status:</span>
              <span class="detail-value status-active">
                <span class="status-dot"></span>
                Active
              </span>
            </div>
          </div>
        </div>
      -->
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useSalesAgentsStore } from '~/stores/salesAgents'

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  },
  isRequired: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:modelValue', 'agent-selected'])

// Store
const salesAgentsStore = useSalesAgentsStore()

// Refs
const showDropdown = ref(false)
const searchQuery = ref('')
const searchInput = ref(null)
const optionsList = ref(null)

// Computed properties from store
const salesAgents = computed(() => salesAgentsStore.activeAgents)
const loading = computed(() => salesAgentsStore.loading || props.loading)
const error = computed(() => salesAgentsStore.error)

// Local computed properties
const filteredAgents = computed(() => {
  if (!searchQuery.value.trim()) {
    return salesAgents.value
  }
  
  const query = searchQuery.value.toLowerCase().trim()
  return salesAgents.value.filter(agent => 
    agent.name?.toLowerCase().includes(query) ||
    agent.email?.toLowerCase().includes(query)
  )
})

const selectedAgent = computed(() => {
  return salesAgentsStore.getAgentById(props.modelValue) || null
})

const activeAgentsCount = computed(() => salesAgents.value.length)

const hasError = computed(() => props.isRequired && !props.modelValue)

// Lifecycle
onMounted(async () => {
  await loadSalesAgents()
  
  // Close dropdown when clicking outside
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// Methods
const loadSalesAgents = async () => {
  if (salesAgents.value.length === 0) {
    await salesAgentsStore.fetchSalesAgents()
  }
}

const toggleDropdown = () => {
  if (props.disabled) return
  
  showDropdown.value = !showDropdown.value
  
  if (showDropdown.value) {
    nextTick(() => {
      if (searchInput.value) {
        searchInput.value.focus()
      }
    })
  }
}

const handleClickOutside = (event) => {
  const dropdown = document.querySelector('.dropdown-container')
  if (dropdown && !dropdown.contains(event.target)) {
    showDropdown.value = false
    searchQuery.value = ''
  }
}

const handleSearch = () => {
  // Search is handled by computed property
}

const clearSearch = () => {
  searchQuery.value = ''
  nextTick(() => {
    if (searchInput.value) {
      searchInput.value.focus()
    }
  })
}

const selectAgent = (agent) => {
  if (props.disabled) return
  
  const newValue = agent.id
  emit('update:modelValue', newValue)
  emit('agent-selected', newValue)
  
  showDropdown.value = false
  searchQuery.value = ''
}

const clearSelection = () => {
  if (props.disabled) return
  
  emit('update:modelValue', '')
  emit('agent-selected', '')
}

const getInitials = (name) => {
  if (!name) return '??'
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// Watch for external loading state changes
watch(() => props.loading, (newValue) => {
  if (newValue && salesAgents.value.length === 0) {
    loadSalesAgents()
  }
})

// Watch for modelValue changes to ensure agent exists
watch(() => props.modelValue, async (newValue) => {
  if (newValue && !selectedAgent.value && salesAgents.value.length === 0) {
    await loadSalesAgents()
  }
})
</script>

<style scoped>

@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');

.sales-agent-section { 
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

  background: var(--surface); border-radius: var(--radius);
  box-shadow: var(--shadow-sm); overflow: visible;
  font-family: var(--font); font-size: 13px;
  position: relative; z-index: 3;
}

.section-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 12px 20px; background: var(--navy);
}
.section-title {
  display: flex; align-items: center; gap: 8px;
  font-size: 12px; font-weight: 700; text-transform: uppercase;
  letter-spacing: .07em; color: #fff; margin: 0;
}
.section-icon { font-size: .9em; }
.required-badge {
  height: 22px; padding: 0 10px; display: inline-flex; align-items: center;
  background: var(--red); color: #fff; border-radius: 1px;
  font-size: 10px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase;
}

.loading-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 32px 16px; text-align: center; color: var(--text-3); font-size: 13px;
}
.loading-spinner {
  width: 28px; height: 28px; border: 2px solid var(--border);
  border-top-color: var(--blue); border-radius: 50%;
  animation: spin .7s linear infinite; margin-bottom: 12px;
}
@keyframes spin { to { transform: rotate(360deg); } }
.loading-state p { margin: 0; color: var(--text-3); }

.error-state {
  display: flex; align-items: flex-start; gap: 12px;
  padding: 16px 20px; background: var(--red-bg);
  border-top: 1px solid var(--red-bd); border-left: 3px solid var(--red);
}
.error-icon { font-size: 1.2em; color: var(--red); flex-shrink: 0; }
.error-content { flex: 1; }
.error-title { color: var(--red-text); font-weight: 700; margin-bottom: 3px; font-size: 13px; }
.error-message { color: var(--red-text); font-size: 12px; margin-bottom: 10px; opacity: .8; }
.btn-retry {
  height: 32px; padding: 0 14px; background: var(--red); color: #fff; border: none;
  border-radius: var(--radius); font-family: var(--font); font-size: 12px; font-weight: 600;
  cursor: pointer; transition: all var(--t);
}
.btn-retry:hover { background: #C0181E; }

.form-group { padding: 16px 20px; border-bottom: 1px solid var(--border-lt); }
.form-group label {
  display: block; margin-bottom: 8px;
  font-size: 11px; font-weight: 600; text-transform: uppercase;
  letter-spacing: .06em; color: var(--text-3);
}
.required { color: var(--red); margin-left: 3px; }

.dropdown-container { position: relative; width: 100%; z-index: 100; }

.dropdown-select {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 12px; height: 42px;
  background: var(--surface); border: 1.5px solid var(--border);
  border-radius: var(--radius); cursor: pointer;
  transition: border-color var(--t), box-shadow var(--t);
  position: relative; z-index: 101; box-sizing: border-box;
}
.dropdown-select:hover:not(.dropdown-disabled) { border-color: var(--blue); }
.dropdown-select:focus-within:not(.dropdown-disabled) { border-color: var(--blue); box-shadow: var(--ring); outline: none; }
.dropdown-open { border-color: var(--blue); box-shadow: var(--ring); }
.dropdown-disabled { background: var(--page-bg); cursor: not-allowed; opacity: .6; }
.dropdown-error { border-color: var(--red); background: var(--red-bg); }

.selected-value { flex: 1; display: flex; align-items: center; }
.placeholder { color: var(--text-4); font-size: 13px; }

.selected-agent { display: flex; align-items: center; gap: 10px; }
.agent-avatar-sm {
  width: 30px; height: 30px; background: var(--navy); border-radius: var(--radius);
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-weight: 700; font-size: 11px; flex-shrink: 0;
}
.agent-info-sm { display: flex; flex-direction: column; gap: 1px; }
.agent-name-sm { font-size: 13px; font-weight: 600; color: var(--text-1); }
.agent-email-sm { font-size: 11px; color: var(--text-4); }

.dropdown-arrow { display: flex; align-items: center; justify-content: center; width: 20px; height: 20px; transition: transform var(--t); }
.dropdown-open .dropdown-arrow { transform: rotate(180deg); }
.arrow-icon { color: var(--text-3); font-size: .8em; }

.dropdown-options {
  position: absolute; top: 100%; left: 0; right: 0;
  background: #FFFFFF; border: 1.5px solid #D1D9E0;
  border-top: 2px solid #003366; border-radius: 0 0 2px 2px;
  box-shadow: 0 8px 32px rgba(0,0,0,.16); z-index: 9999;
  max-height: 380px; overflow: hidden; display: flex; flex-direction: column;
}

.dropdown-search {
  padding: 10px 12px; border-bottom: 1px solid #E8ECF0;
  background: #F0F4F8; position: relative; z-index: 10000;
}
.search-input-wrapper { position: relative; display: flex; align-items: center; }
.search-icon { position: absolute; left: 10px; color: #94A3B8; font-size: .9em; }
.search-input {
  width: 100%; height: 34px; padding: 0 32px 0 30px;
  border: 1.5px solid #D1D9E0; border-radius: 2px;
  font-family: "IBM Plex Sans", -apple-system, sans-serif; font-size: 13px; color: #0F172A;
  background: #FFFFFF; outline: none; box-sizing: border-box;
  transition: border-color 140ms ease, box-shadow 140ms ease;
}
.search-input:focus { border-color: #0066CC; box-shadow: 0 0 0 3px rgba(0,102,204,.15); }
.clear-search {
  position: absolute; right: 10px; background: none; border: none;
  color: #94A3B8; font-size: .9em; cursor: pointer; padding: 0;
  width: 18px; height: 18px; display: flex; align-items: center; justify-content: center;
  border-radius: 2px; transition: color 140ms ease;
}
.clear-search:hover { color: #E31E24; }

.options-list { flex: 1; overflow-y: auto; max-height: 280px; background: #FFFFFF; position: relative; z-index: 10000; }

.no-options {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 32px 16px; text-align: center; color: #64748B; background: #FFFFFF;
}
.no-options-icon { font-size: 1.8em; color: #94A3B8; margin-bottom: 8px; opacity: .5; }
.no-options-content p:first-child { font-weight: 600; margin-bottom: 3px; font-size: 13px; }
.no-options-subtext { font-size: 11px; color: #94A3B8; }

.dropdown-option {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 12px; cursor: pointer;
  border-bottom: 1px solid #E8ECF0;
  background: #FFFFFF; transition: background 140ms ease;
  position: relative; z-index: 10000;
}
.dropdown-option:last-child { border-bottom: none; }
.dropdown-option:nth-child(even) { background: #F0F4F8; }
.dropdown-option:hover { background: #EEF4FF !important; }
.option-selected { background: #EEF4FF !important; border-left: 3px solid #0066CC; }

.option-content { display: flex; align-items: center; gap: 10px; flex: 1; }
.option-avatar {
  width: 28px; height: 28px; background: #003366; border-radius: 2px;
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-weight: 700; font-size: 11px; flex-shrink: 0;
}
.option-info { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.option-name { font-size: 13px; font-weight: 500; color: #0F172A; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.option-email { font-size: 11px; color: #94A3B8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.option-check { color: #166534; font-weight: bold; font-size: 13px; flex-shrink: 0; }

.dropdown-footer {
  padding: 8px 12px; border-top: 1px solid #E8ECF0;
  background: #F0F4F8; position: relative; z-index: 10000;
}
.footer-stats { display: flex; justify-content: center; }
.stat-item { display: flex; align-items: center; gap: 5px; color: #64748B; font-size: 11px; }
.stat-label { font-weight: 600; }
.stat-value { font-weight: 700; color: #0066CC; }

.validation-error {
  display: flex; align-items: center; gap: 7px;
  margin-top: 6px; padding: 8px 12px;
  background: var(--red-bg); border: 1px solid var(--red-bd); border-radius: var(--radius);
}
.validation-error .error-icon { font-size: .9em; color: var(--red); }
.error-text { color: var(--red-text); font-size: 12px; font-weight: 500; }

.selected-agent-details {
  padding: 14px 20px; background: var(--page-bg);
  border-top: 1px solid var(--border-lt); position: relative; z-index: 5;
}
.details-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.details-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: var(--text-3); margin: 0; }
.btn-change {
  height: 28px; padding: 0 12px; background: var(--blue-lt); color: var(--blue);
  border: 1.5px solid rgba(0,102,204,.2); border-radius: var(--radius);
  font-family: var(--font); font-size: 12px; font-weight: 600; cursor: pointer;
  transition: all var(--t);
}
.btn-change:hover { background: #dce9ff; }

.details-content { display: flex; flex-direction: column; gap: 6px; }
.detail-row {
  display: flex; align-items: center; gap: 10px;
  padding-bottom: 6px; border-bottom: 1px solid var(--border-lt);
}
.detail-row:last-child { border-bottom: none; padding-bottom: 0; }
.detail-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; color: var(--text-3); min-width: 52px; }
.detail-value { font-size: 13px; color: var(--text-1); font-weight: 500; }
.status-active { display: flex; align-items: center; gap: 6px; color: var(--green-text); font-weight: 600; font-size: 13px; }
.status-dot { width: 7px; height: 7px; background: #16a34a; border-radius: 50%; }

@media (max-width: 768px) {
  .dropdown-select { padding: 0 10px; }
  .dropdown-options { max-height: 320px; }
}
@media (max-width: 480px) {
  .section-header { flex-direction: column; align-items: flex-start; gap: 6px; }
}

</style>