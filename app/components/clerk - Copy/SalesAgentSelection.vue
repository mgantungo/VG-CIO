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
.sales-agent-section {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 16px;
  border: 1px solid rgba(226, 232, 240, 0.6);
  padding: 30px;
  margin-bottom: 30px;
  transition: all 0.3s ease;
  position: relative; /* ADDED: Establish positioning context */
  z-index: 3; /* ADDED: Base z-index */
}

.sales-agent-section:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.05);
  border-color: rgba(59, 130, 246, 0.2);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 2px solid #f1f5f9;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 1.4em;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.section-icon {
  font-size: 1.2em;
}

.required-badge {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.8em;
  font-weight: 600;
  letter-spacing: 0.5px;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  text-align: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f1f5f9;
  border-top: 3px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-state p {
  color: #64748b;
  font-size: 1em;
  font-weight: 500;
}

/* Error State */
.error-state {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  padding: 20px;
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  border-radius: 12px;
  border: 1px solid #fecaca;
}

.error-icon {
  font-size: 2em;
  color: #ef4444;
}

.error-content {
  flex: 1;
}

.error-title {
  color: #dc2626;
  font-weight: 600;
  margin-bottom: 5px;
  font-size: 1.1em;
}

.error-message {
  color: #991b1b;
  font-size: 0.9em;
  margin-bottom: 15px;
}

.btn-retry {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 0.9em;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-retry:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
}

/* Form Group */
.form-group {
  width: 100%;
}

.form-group label {
  display: block;
  margin-bottom: 12px;
  color: #334155;
  font-weight: 600;
  font-size: 1em;
}

.required {
  color: #ef4444;
  margin-left: 4px;
}

/* Dropdown Container */
.dropdown-container {
  position: relative;
  width: 100%;
  z-index: 10; /* ADDED: Container z-index */
}

.dropdown-select {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  min-height: 56px;
  position: relative; /* ADDED */
  z-index: 11; /* ADDED */
}

.dropdown-select:hover:not(.dropdown-disabled) {
  border-color: #cbd5e1;
}

.dropdown-select:focus-within:not(.dropdown-disabled) {
  border-color: #3b82f6;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
  outline: none;
}

.dropdown-open {
  border-color: #3b82f6;
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}

.dropdown-disabled {
  background: #f8fafc;
  cursor: not-allowed;
  opacity: 0.7;
}

.dropdown-error {
  border-color: #ef4444;
}

.selected-value {
  flex: 1;
  display: flex;
  align-items: center;
}

.placeholder {
  color: #94a3b8;
  font-size: 1em;
}

.selected-agent {
  display: flex;
  align-items: center;
  gap: 12px;
}

.agent-avatar-sm {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 0.9em;
  flex-shrink: 0;
}

.agent-info-sm {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.agent-name-sm {
  font-weight: 600;
  color: #1e293b;
  font-size: 1em;
}

.agent-email-sm {
  color: #64748b;
  font-size: 0.85em;
}

.dropdown-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  transition: transform 0.3s ease;
}

.dropdown-open .dropdown-arrow {
  transform: rotate(180deg);
}

.arrow-icon {
  color: #64748b;
  font-size: 0.8em;
}

/* Dropdown Options - FIXED Z-INDEX */
.dropdown-options {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 2px solid #3b82f6;
  border-top: none;
  border-radius: 0 0 12px 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  z-index: 1000; /* INCREASED: Much higher z-index */
  max-height: 400px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.dropdown-search {
  padding: 16px;
  border-bottom: 1px solid #f1f5f9;
  background: white; /* ADDED */
  position: relative;
  z-index: 1001; /* ADDED */
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  color: #94a3b8;
  font-size: 1em;
}

.search-input {
  width: 100%;
  padding: 12px 40px 12px 40px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.95em;
  transition: all 0.2s ease;
  background: #f8fafc;
  color: #1e293b;
}

.search-input:focus {
  outline: none;
  border-color: #3b82f6;
  background: white;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.clear-search {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 1.1em;
  cursor: pointer;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.clear-search:hover {
  background: #f1f5f9;
  color: #64748b;
}

/* Options List */
.options-list {
  flex: 1;
  overflow-y: auto;
  max-height: 300px;
  background: white; /* ADDED */
  position: relative;
  z-index: 1001; /* ADDED */
}

.no-options {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}

.no-options-icon {
  font-size: 2.5em;
  color: #cbd5e1;
  margin-bottom: 12px;
}

.no-options-content p:first-child {
  color: #64748b;
  font-weight: 500;
  margin-bottom: 4px;
}

.no-options-subtext {
  color: #94a3b8;
  font-size: 0.9em;
}

.dropdown-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 1px solid #f8fafc;
  background: white; /* ADDED */
  position: relative;
  z-index: 1001; /* ADDED */
}

.dropdown-option:hover {
  background: #f8fafc;
}

.option-selected {
  background: #f0f9ff;
  border-left: 3px solid #3b82f6;
}

.option-content {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.option-avatar {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 0.85em;
  flex-shrink: 0;
}

.option-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.option-name {
  font-weight: 500;
  color: #1e293b;
  font-size: 0.95em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.option-email {
  color: #64748b;
  font-size: 0.85em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.option-check {
  color: #10b981;
  font-weight: bold;
  font-size: 1.1em;
  flex-shrink: 0;
}

/* Dropdown Footer */
.dropdown-footer {
  padding: 12px 16px;
  border-top: 1px solid #f1f5f9;
  background: #f8fafc;
  position: relative;
  z-index: 1001; /* ADDED */
}

.footer-stats {
  display: flex;
  justify-content: center;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #64748b;
  font-size: 0.85em;
}

.stat-label {
  font-weight: 500;
}

.stat-value {
  font-weight: 600;
  color: #3b82f6;
}

/* Validation Error */
.validation-error {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  padding: 8px 12px;
  background: #fef2f2;
  border-radius: 6px;
  border: 1px solid #fecaca;
}

.validation-error .error-icon {
  font-size: 1em;
  color: #ef4444;
}

.error-text {
  color: #dc2626;
  font-size: 0.9em;
  font-weight: 500;
}

/* Selected Agent Details */
.selected-agent-details {
  margin-top: 20px;
  padding: 20px;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-radius: 12px;
  border: 2px solid #bae6fd;
  position: relative; /* ADDED */
  z-index: 5; /* Lower than dropdown but still above other content */
}

.details-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.details-title {
  font-size: 1.1em;
  font-weight: 600;
  color: #0369a1;
  margin: 0;
}

.btn-change {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.85em;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-change:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(59, 130, 246, 0.2);
}

.details-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.detail-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.detail-label {
  font-weight: 600;
  color: #475569;
  font-size: 0.9em;
  min-width: 60px;
}

.detail-value {
  color: #1e293b;
  font-size: 0.95em;
}

.status-active {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #059669;
  font-weight: 500;
}

.status-dot {
  width: 8px;
  height: 8px;
  background: #10b981;
  border-radius: 50%;
}

/* Responsive Design */
@media (max-width: 768px) {
  .sales-agent-section {
    padding: 20px;
  }
  
  .dropdown-select {
    padding: 12px 14px;
    min-height: 52px;
  }
  
  .selected-agent {
    gap: 10px;
  }
  
  .agent-avatar-sm {
    width: 32px;
    height: 32px;
    font-size: 0.85em;
  }
  
  .agent-name-sm {
    font-size: 0.95em;
  }
  
  .agent-email-sm {
    font-size: 0.8em;
  }
  
  .dropdown-options {
    max-height: 350px;
  }
}

@media (max-width: 480px) {
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .dropdown-select {
    padding: 10px 12px;
  }
  
  .selected-agent {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .agent-info-sm {
    width: 100%;
  }
}
</style>