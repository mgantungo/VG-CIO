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

@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');

.form-section { 
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
  box-shadow: var(--shadow-sm); overflow: hidden;
  font-family: var(--font); font-size: 13px;
}

.section-header {
  display: flex; align-items: center; gap: 10px;
  padding: 12px 20px; background: var(--navy);
}
.section-icon {
  width: 28px; height: 28px; background: rgba(255,255,255,.15); border-radius: var(--radius);
  display: flex; align-items: center; justify-content: center; font-size: 1em; flex-shrink: 0;
}
.section-title { margin: 0; color: #fff; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .07em; }
.section-description { color: rgba(255,255,255,.6); font-size: 11px; margin: 0 0 0 auto; }

.form-grid { display: grid; grid-template-columns: repeat(2, 1fr); border-bottom: 1px solid var(--border-lt); }
.form-grid.three-columns { grid-template-columns: repeat(3, 1fr); }

.form-group {
  padding: 14px 20px; border-right: 1px solid var(--border-lt);
  background: var(--surface);
}
.form-group:last-child { border-right: none; }

.form-label { display: flex; align-items: center; gap: 5px; margin-bottom: 6px; }
.form-label label {
  font-size: 11px; font-weight: 600; text-transform: uppercase;
  letter-spacing: .06em; color: var(--text-3);
}
.required { color: var(--red); font-weight: 700; }
.optional { font-size: 10px; color: var(--text-4); font-weight: 400; text-transform: none; letter-spacing: 0; }

.input-container { position: relative; display: flex; align-items: center; }
.input-icon { position: absolute; left: 10px; font-size: .9em; z-index: 1; pointer-events: none; opacity: .5; }

.form-input {
  width: 100%; height: 38px; padding: 0 12px 0 32px;
  border: 1.5px solid var(--border); border-radius: var(--radius);
  font-family: var(--font); font-size: 13px; color: var(--text-1);
  background: var(--surface); outline: none; box-sizing: border-box;
  transition: border-color var(--t), box-shadow var(--t);
}
.form-input:focus { border-color: var(--blue); box-shadow: var(--ring); }
.form-input:disabled { background: var(--page-bg); color: var(--text-4); cursor: not-allowed; }
.form-input::placeholder { color: var(--text-4); }

.form-select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat; background-position: right 10px center; padding-right: 32px;
}
.form-select:disabled { cursor: not-allowed; opacity: .7; }

.select-spinner {
  position: absolute; right: 10px;
  width: 14px; height: 14px; border: 2px solid rgba(0,102,204,.2);
  border-top-color: var(--blue); border-radius: 50%;
  animation: spin .7s linear infinite; pointer-events: none;
}
@keyframes spin { to { transform: rotate(360deg); } }

.input-hint { font-size: 11px; color: var(--text-4); margin-top: 4px; font-style: italic; }
.new-client-hint { margin-top: 6px; }
.badge {
  display: inline-flex; align-items: center; height: 22px; padding: 0 10px;
  background: var(--navy); color: #fff; font-size: 11px; font-weight: 600;
  border-radius: 1px; letter-spacing: .02em;
}

.reference-document-container { width: 100%; position: relative; }
.document-badge {
  position: absolute; top: -28px; right: 0;
  display: inline-flex; align-items: center; gap: 5px;
  padding: 3px 10px; background: var(--blue-lt);
  border: 1px solid rgba(0,102,204,.2); border-radius: 1px;
  font-size: 11px; color: var(--blue); font-weight: 600;
  max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  z-index: 2;
}
.badge-icon { font-size: .9em; }
.badge-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.clear-document {
  background: none; border: none; color: var(--text-4); font-size: 11px;
  cursor: pointer; padding: 1px 4px; border-radius: var(--radius);
  transition: color var(--t);
}
.clear-document:hover { color: var(--red); }

.sector-hint { display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--text-2); margin-top: 4px; }
.sector-code-badge {
  height: 20px; padding: 0 7px; display: inline-flex; align-items: center;
  background: var(--blue-lt); color: var(--blue); border: 1px solid rgba(0,102,204,.2);
  font-size: 10px; font-weight: 700; letter-spacing: .04em; border-radius: 1px;
}
.btn-retry-inline {
  margin-left: 6px; background: none; border: 1px solid var(--red); color: var(--red-text);
  padding: 1px 7px; font-size: 11px; cursor: pointer; border-radius: var(--radius);
  font-family: var(--font); transition: all var(--t);
}
.btn-retry-inline:hover { background: var(--red); color: #fff; border-color: var(--red); }

.input-validation { margin-top: 4px; font-size: 11px; min-height: 16px; }
.validation-text { display: flex; align-items: center; gap: 4px; }
.validation-text.valid { color: var(--green-text); font-weight: 600; }
.input-validation.invalid .validation-text { color: var(--red-text); font-weight: 600; }

.selected-client-info {
  display: flex; flex-wrap: wrap; gap: 6px;
  padding: 10px 20px; background: var(--green-bg); border-top: 1px solid var(--green-bd);
}
.info-badge {
  display: inline-flex; align-items: center; height: 22px; padding: 0 10px;
  background: var(--green-bg); color: var(--green-text);
  border: 1px solid var(--green-bd); border-radius: 1px;
  font-size: 11px; font-weight: 600;
}
.info-badge.bc-badge { background: var(--blue-lt); color: var(--blue); border-color: rgba(0,102,204,.2); }

.validation-summary {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 20px; font-size: 12px; font-weight: 500;
  border-top: 1px solid var(--border-lt);
}
.validation-summary.success { background: var(--green-bg); color: var(--green-text); }
.validation-summary.warning { background: var(--amber-bg); color: var(--amber-text); }
.summary-icon {
  width: 22px; height: 22px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 12px; flex-shrink: 0; border: 1.5px solid currentColor;
}
.summary-text { flex: 1; }

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

@media (max-width: 992px) {
  .form-grid.three-columns { grid-template-columns: repeat(2, 1fr); }
  .form-grid.three-columns .form-group:last-child { grid-column: span 2; border-right: none; }
}
@media (max-width: 768px) {
  .form-grid, .form-grid.three-columns { grid-template-columns: 1fr; }
  .form-group { border-right: none; border-bottom: 1px solid var(--border-lt); }
  .form-grid.three-columns .form-group:last-child { grid-column: auto; }
  .section-header { flex-wrap: wrap; }
  .section-description { margin: 0; }
  .document-badge { position: relative; top: 0; margin-top: 6px; max-width: 100%; }
  .validation-summary { flex-direction: column; text-align: center; }
}

</style>