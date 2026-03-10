<!-- components/clerk/ClientInformation.vue -->
<template>
  <div class="form-section">
    <div class="section-header">
      <div class="section-icon">👤</div>
      <h3 class="section-title">Client Information</h3>
    </div>
    <p class="section-description">Enter the client's contact details for this advert</p>
    
    <!-- First Row: Client Name and Contact Person -->
    <div class="form-grid">
      <!-- Client Dropdown -->
      <div class="form-group">
        <div class="form-label">
          <label>Client Name</label>
          <span class="required">*</span>
        </div>
        <div class="input-container">
          <span class="input-icon">🏢</span>
          <ClientDropdown
            :model-value="selectedClientId"
            :placeholder="'Search or select client...'"
            :enable-search="true"
            :clearable="true"
            :disabled="disabled"
            @update:model-value="handleClientIdUpdate"
            @change="handleClientSelect"
            @focus="loadClients"
            ref="clientDropdownRef"
          />
        </div>
        <div v-if="!selectedClient && !disabled && !clientName" class="input-hint">
          Search for existing client or type new client name
        </div>
        <div v-if="clientName && !selectedClient" class="input-hint new-client-hint">
          <span class="badge">New client: "{{ clientName }}" will be created</span>
        </div>
      </div>
      
      <div class="form-group">
        <div class="form-label">
          <label>Contact Person</label>
          <span class="optional">(Optional)</span>
        </div>
        <div class="input-container">
          <span class="input-icon">👨‍💼</span>
          <input 
            :value="contactPerson"
            type="text" 
            placeholder="Contact name"
            :disabled="disabled"
            @input="updateContactPerson($event.target.value)"
            class="form-input"
          >
        </div>
        <div v-if="!contactPerson && !disabled" class="input-hint">
          Primary contact person at the client
        </div>
      </div>
    </div>

    <!-- Second Row: Email, Phone, and Reference Document -->
    <div class="form-grid three-columns">
      <div class="form-group">
        <div class="form-label">
          <label>Email Address</label>
          <span class="required">*</span>
        </div>
        <div class="input-container">
          <span class="input-icon">📧</span>
          <input 
            :value="email"
            type="email" 
            placeholder="client@company.com" 
            required
            :disabled="disabled"
            @input="updateEmail($event.target.value)"
            class="form-input"
          >
        </div>
        <div class="input-validation" :class="{ 'valid': isValidEmail, 'invalid': email && !isValidEmail }">
          <span v-if="email && !isValidEmail" class="validation-text">Please enter a valid email address</span>
          <span v-else-if="isValidEmail" class="validation-text valid">✓ Valid email format</span>
        </div>
      </div>
      
      <div class="form-group">
        <div class="form-label">
          <label>Phone Number</label>
          <span class="required">*</span>
        </div>
        <div class="input-container">
          <span class="input-icon">📱</span>
          <input 
            :value="phone"
            type="tel" 
            placeholder="+256 700 000 000" 
            required
            :disabled="disabled"
            @input="updatePhone($event.target.value)"
            class="form-input"
          >
        </div>
        <div class="input-validation" :class="{ 'valid': isValidPhone, 'invalid': phone && !isValidPhone }">
          <span v-if="phone && !isValidPhone" class="validation-text">Enter a valid phone number</span>
          <span v-else-if="isValidPhone" class="validation-text valid">✓ Phone number looks good</span>
          <span v-else class="input-hint">Include country code (e.g., +256)</span>
        </div>
      </div>

      <!-- Reference Document -->
      <div class="form-group">
        <div class="form-label">
          <label>Reference Document</label>
          <span class="optional">(Optional)</span>
        </div>
        <div class="reference-document-container">
          <div class="input-container">
            <span class="input-icon">📄</span>
            <input 
              :value="referenceDocument"
              type="text" 
              placeholder="e.g., client ref no."
              :disabled="disabled"
              @input="updateReferenceDocument($event.target.value)"
              class="form-input"
            >
          </div>
          <div v-if="referenceDocument" class="document-badge">
            <span class="badge-icon">📋</span>
            <span class="badge-text">{{ referenceDocument }}</span>
            <button 
              v-if="!disabled" 
              class="clear-document" 
              @click="clearReferenceDocument"
              title="Clear document reference"
            >✕</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Third Row: Market Sector (full-width on its own row) -->
    <div class="form-grid">
      <div class="form-group">
        <div class="form-label">
          <label>Market Sector</label>
          <span class="required">*</span>
        </div>
        <div class="input-container select-container">
          <span class="input-icon">🏭</span>
          <select
            :value="marketSector"
            :disabled="disabled || sectorsLoading"
            @change="updateMarketSector($event.target.value)"
            class="form-input form-select"
          >
            <option value="" disabled>
              {{ sectorsLoading ? 'Loading sectors…' : 'Select a market sector' }}
            </option>
            <option
              v-for="sector in sectorOptions"
              :key="sector.code"
              :value="sector.code"
            >
              {{ sector.name }} ({{ sector.code }})
            </option>
          </select>
          <!-- Loading spinner inside the select row -->
          <span v-if="sectorsLoading" class="select-spinner"></span>
        </div>
        <div v-if="sectorsError" class="input-hint" style="color:#e31e24;">
          {{ sectorsError }}
          <button class="btn-retry-inline" @click="reloadSectors">Retry</button>
        </div>
        <div v-else-if="!marketSector && !disabled" class="input-hint">
          Choose the industry category that best describes this client
        </div>
        <div v-else-if="marketSector" class="input-hint sector-hint">
          <span class="sector-code-badge">{{ marketSector }}</span>
          {{ resolvedSectorName }}
        </div>
      </div>

      <!-- Placeholder column to keep the 2-col grid balanced -->
      <div></div>
    </div>

    <!-- Show selected client info when existing client is chosen -->
    <div v-if="selectedClient" class="selected-client-info">
      <span class="info-badge">✓ Existing client selected</span>
      <span v-if="selectedClient.bc_no" class="info-badge bc-badge">BC: {{ selectedClient.bc_no }}</span>
    </div>

    <!-- Validation Summary -->
    <div v-if="hasRequiredInfo" class="validation-summary success">
      <span class="summary-icon">✓</span>
      <span class="summary-text">All required client information is complete</span>
    </div>
    <div v-else class="validation-summary warning">
      <span class="summary-icon">!</span>
      <span class="summary-text">Fill in all required fields marked with *</span>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, computed, ref, watch, onMounted } from 'vue'
import ClientDropdown from './ClientDropdown.vue'
import { useClientDropdownStore } from '~/stores/clientDropdown'
import { useMarketSectorsStore } from '~/stores/marketSectors'
import { storeToRefs } from 'pinia'

const props = defineProps({
  clientName: {
    type: String,
    default: ''
  },
  contactPerson: {
    type: String,
    default: ''
  },
  email: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    default: ''
  },
  referenceDocument: {
    type: String,
    default: ''
  },
  /** Market sector code (e.g. "FIN", "HEA") — value stored and passed up */
  marketSector: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'update:clientName',
  'update:contactPerson',
  'update:email',
  'update:phone',
  'update:referenceDocument',
  'update:clientId',
  'update:marketSector',
  'changed'
])

// ─── Stores ──────────────────────────────────────────────────────────────────
const clientStore = useClientDropdownStore()

const marketSectorsStore = useMarketSectorsStore()
const { sectorOptions, loading: sectorsLoading, error: sectorsError } = storeToRefs(marketSectorsStore)

// ─── Local state ─────────────────────────────────────────────────────────────
const selectedClient = ref(null)
const selectedClientId = ref(null)
const clientDropdownRef = ref(null)

// ─── Computed ─────────────────────────────────────────────────────────────────
const isValidEmail = computed(() => {
  if (!props.email) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(props.email)
})

const isValidPhone = computed(() => {
  if (!props.phone) return false
  const clean = props.phone.replace(/\s+/g, '')
  return /^[\+]?[1-9][\d]{0,15}$/.test(clean)
})

const hasRequiredInfo = computed(() => {
  return props.clientName && isValidEmail.value && isValidPhone.value && !!props.marketSector
})

/** Human-readable name for the currently selected sector code */
const resolvedSectorName = computed(() => {
  return marketSectorsStore.nameForCode(props.marketSector)
})

// ─── Methods ─────────────────────────────────────────────────────────────────
const loadClients = () => {
  clientStore.loadInitialClients()
}

const reloadSectors = () => {
  marketSectorsStore.loadSectors({ force: true })
}

const handleClientIdUpdate = (value) => {
  selectedClientId.value = value
  emit('update:clientId', value)
}

const handleClientSelect = (client) => {
  selectedClient.value = client

  if (client) {
    emit('update:clientName', client.label)
    if (client.email) emit('update:email', client.email)
    if (client.phone) emit('update:phone', client.phone)
    if (client.contact_person) emit('update:contactPerson', client.contact_person)
  } else {
    emit('update:clientName', '')
    emit('update:clientId', null)
    selectedClient.value = null
  }

  emit('changed', { field: 'client', value: client })
}

const updateContactPerson = (value) => {
  emit('update:contactPerson', value)
  emit('changed', { field: 'contactPerson', value })
}

const updateEmail = (value) => {
  emit('update:email', value)
  emit('changed', { field: 'email', value })
}

const updatePhone = (value) => {
  emit('update:phone', value)
  emit('changed', { field: 'phone', value })
}

const updateReferenceDocument = (value) => {
  emit('update:referenceDocument', value)
  emit('changed', { field: 'referenceDocument', value })
}

const clearReferenceDocument = () => {
  emit('update:referenceDocument', '')
  emit('changed', { field: 'referenceDocument', value: '' })
}

const updateMarketSector = (value) => {
  emit('update:marketSector', value)
  emit('changed', { field: 'marketSector', value })
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────
onMounted(() => {
  // Background-load clients
  clientStore.loadInitialClients({ background: true }).catch((err) => {
    console.log('Background client loading failed, will load on focus', err)
  })

  // Load market sectors (no-op if already loaded)
  marketSectorsStore.loadSectors()
})

watch(() => props.clientName, (newName) => {
  if (newName && !selectedClient.value) {
    selectedClient.value = null
    selectedClientId.value = null
  }
})

// ─── Expose ───────────────────────────────────────────────────────────────────
defineExpose({
  hasRequiredInfo,
  focusDropdown: () => clientDropdownRef.value?.focus(),
  clearSelection: () => {
    clientDropdownRef.value?.clear()
    selectedClient.value = null
    selectedClientId.value = null
  },
  clearReferenceDocument
})
</script>

<style scoped>
.form-section {
  margin-bottom: 40px;
  background: linear-gradient(135deg, #ffffff 0%, #f8faff 100%);
  padding: 30px;
  border-radius: 16px;
  border: 1px solid #e1e8ff;
  box-shadow: 0 4px 20px rgba(0, 51, 102, 0.08);
  transition: all 0.3s ease;
}

.form-section:hover {
  box-shadow: 0 6px 25px rgba(0, 51, 102, 0.12);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.section-icon {
  font-size: 1.8em;
  background: linear-gradient(135deg, #a0d0ff 0%, #a0d0ff 100%);
  color: white;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 102, 204, 0.2);
}

.section-title {
  color: #003366;
  font-size: 1.4em;
  font-weight: 700;
  margin: 0;
  background: linear-gradient(135deg, #003366 0%, #0066cc 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.section-description {
  color: #666;
  font-size: 0.95em;
  margin-bottom: 25px;
  padding-left: 60px;
  line-height: 1.5;
}

/* Grid layouts */
.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
  margin-bottom: 30px;
}

.form-grid.three-columns {
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.form-group {
  margin-bottom: 10px;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.form-label label {
  color: #1a365d;
  font-weight: 600;
  font-size: 0.95em;
}

.required {
  color: #e31e24;
  font-size: 0.85em;
  font-weight: 600;
  background: rgba(227, 30, 36, 0.1);
  padding: 2px 8px;
  border-radius: 4px;
}

.optional {
  color: #718096;
  font-size: 0.85em;
  font-style: italic;
}

.input-container {
  position: relative;
  display: flex;
  align-items: center;
}

/* Extra right padding room for the spinner */
.select-container {
  position: relative;
}

.input-icon {
  position: absolute;
  left: 16px;
  font-size: 1.1em;
  color: #0066cc;
  z-index: 1;
  pointer-events: none;
}

.form-input {
  width: 100%;
  padding: 14px 20px 14px 48px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  font-size: 1em;
  transition: all 0.3s;
  background: white;
  color: #2d3748;
  font-weight: 500;
}

.form-input:focus {
  outline: none;
  border-color: #0066cc;
  box-shadow: 0 0 0 4px rgba(0, 102, 204, 0.15);
  background: linear-gradient(0deg, #ffffff 0%, #f0f7ff 100%);
}

.form-input:disabled {
  background-color: #f7fafc;
  border-color: #cbd5e0;
  color: #a0aec0;
  cursor: not-allowed;
}

.form-input::placeholder {
  color: #a0aec0;
  font-weight: 400;
}

/* Native <select> tweaks */
.form-select {
  appearance: none;
  -webkit-appearance: none;
  padding-right: 44px; /* room for chevron */
  cursor: pointer;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%230066cc' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 14px center;
}

.form-select:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

/* Loading spinner inside select row */
.select-spinner {
  position: absolute;
  right: 38px;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(0, 102, 204, 0.25);
  border-top-color: #0066cc;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  pointer-events: none;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Sector hint below the select */
.sector-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #2d3748;
}

.sector-code-badge {
  display: inline-block;
  padding: 2px 8px;
  background: #ebf4ff;
  color: #0066cc;
  border: 1px solid #bee3f8;
  border-radius: 4px;
  font-size: 0.78em;
  font-weight: 700;
  letter-spacing: 0.03em;
}

/* Inline retry button for error state */
.btn-retry-inline {
  margin-left: 8px;
  background: none;
  border: 1px solid #e31e24;
  color: #e31e24;
  padding: 1px 8px;
  border-radius: 4px;
  font-size: 0.8em;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-retry-inline:hover {
  background: #e31e24;
  color: white;
}

.input-hint {
  font-size: 0.85em;
  color: #718096;
  margin-top: 6px;
  padding-left: 4px;
}

.new-client-hint {
  margin-top: 8px;
}

.badge {
  display: inline-block;
  padding: 4px 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 20px;
  font-size: 0.8em;
  font-weight: 600;
  animation: fadeIn 0.3s ease;
}

/* Reference document styles */
.reference-document-container {
  width: 100%;
  position: relative;
}

.document-badge {
  position: absolute;
  top: -30px;
  right: 0;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  background: linear-gradient(135deg, #f0f9ff 0%, #e6f7ff 100%);
  border: 1px solid #bae6fd;
  border-radius: 30px;
  font-size: 0.8em;
  color: #0369a1;
  animation: fadeIn 0.3s ease;
  z-index: 2;
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.badge-icon { font-size: 1em; }

.badge-text {
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.clear-document {
  background: none;
  border: none;
  color: #64748b;
  font-size: 12px;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 50%;
  transition: all 0.2s;
  margin-left: 2px;
}

.clear-document:hover {
  color: #ef4444;
  background-color: #fee2e2;
}

.input-validation {
  margin-top: 6px;
  padding-left: 4px;
  font-size: 0.85em;
  min-height: 20px;
}

.validation-text {
  display: flex;
  align-items: center;
  gap: 6px;
}

.validation-text.valid { color: #38a169; font-weight: 500; }
.validation-text.invalid { color: #e31e24; font-weight: 500; }

.input-validation.invalid .validation-text::before { content: "⚠"; margin-right: 4px; }
.input-validation.valid .validation-text::before { content: "✓"; margin-right: 4px; }

/* Selected client info */
.selected-client-info {
  margin: 10px 0 0 0;
  padding-left: 4px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.info-badge {
  display: inline-block;
  padding: 4px 12px;
  background: #38a169;
  color: white;
  border-radius: 20px;
  font-size: 0.8em;
  font-weight: 600;
  animation: fadeIn 0.3s ease;
}

.info-badge.bc-badge { background: #3b82f6; }

.validation-summary {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-radius: 10px;
  margin-top: 25px;
  font-size: 0.95em;
  font-weight: 500;
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-5px); }
  to   { opacity: 1; transform: translateY(0); }
}

.validation-summary.success {
  background: linear-gradient(135deg, #f0fff4 0%, #e6fffa 100%);
  border: 1px solid #9ae6b4;
  color: #22543d;
}

.validation-summary.warning {
  background: linear-gradient(135deg, #fffaf0 0%, #feebc8 100%);
  border: 1px solid #fbd38d;
  color: #744210;
}

.summary-icon {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}

.validation-summary.success .summary-icon {
  background: linear-gradient(135deg, #38a169 0%, #2f855a 100%);
  color: white;
}

.validation-summary.warning .summary-icon {
  background: linear-gradient(135deg, #dd6b20 0%, #c05621 100%);
  color: white;
}

.summary-text { flex: 1; }

/* Responsive */
@media (max-width: 992px) {
  .form-grid.three-columns {
    grid-template-columns: repeat(2, 1fr);
  }

  .form-grid.three-columns .form-group:last-child {
    grid-column: span 2;
  }
}

@media (max-width: 768px) {
  .form-section { padding: 20px; }

  .form-grid,
  .form-grid.three-columns {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .form-grid.three-columns .form-group:last-child { grid-column: auto; }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .section-description { padding-left: 0; }

  .section-icon { width: 40px; height: 40px; font-size: 1.5em; }

  .form-input { padding: 12px 16px 12px 44px; }

  .document-badge {
    position: relative;
    top: 0;
    margin-top: 8px;
    max-width: 100%;
  }
}

@media (max-width: 480px) {
  .form-section { padding: 16px; border-radius: 12px; }
  .section-title { font-size: 1.2em; }

  .validation-summary {
    flex-direction: column;
    text-align: center;
    gap: 8px;
  }

  .selected-client-info { flex-direction: column; }
}
</style>