<!-- components/clerk/OfficeLocationDropdown.vue -->
<template>
  <div class="form-group">
    <label>Office Location <span class="required">*</span></label>
    <div class="select-wrapper">
      <select 
        :value="modelValue"
        @change="handleLocationChange"
        :disabled="disabled || loading"
        class="styled-select"
        required
      >
        <option value="">Select office location</option>
        <option 
          v-for="location in locations" 
          :key="location.code" 
          :value="location.code"
        >
          {{ location.office }}
        </option>
      </select>
      <div class="select-arrow">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 4L6 8L10 4" stroke="#4A6FDC" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <div v-if="loading" class="select-loading">
        <span class="spinner-small"></span>
      </div>
    </div>
    
    <!-- Error message if API fails -->
    <small v-if="error" class="error-message">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style="vertical-align: middle; margin-right: 4px;">
        <path d="M6 4V6M6 8H6.005M11 6C11 8.76142 8.76142 11 6 11C3.23858 11 1 8.76142 1 6C1 3.23858 3.23858 1 6 1C8.76142 1 11 3.23858 11 6Z" stroke="#FF6B6B" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
      Failed to load locations. Using default.
    </small>
    
    <!-- Retry button if needed -->
    <button 
      v-if="error && !loading" 
      @click="retryFetch" 
      class="retry-button"
      type="button"
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style="margin-right: 4px;">
        <path d="M10 2L8 4M8 4L10 6M8 4H9.5C10.8807 4 12 5.11929 12 6.5C12 7.88071 10.8807 9 9.5 9H8M2 10L4 8M4 8L2 6M4 8H2.5C1.11929 8 0 6.88071 0 5.5C0 4.11929 1.11929 3 2.5 3H4" stroke="#4A6FDC" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
      Retry
    </button>
    
    <!-- Helper text -->
    <small class="helper-text">
      Select your branch/office location
    </small>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useOfficeLocationsStore } from '@/stores/officeLocation'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'location-selected'])

// Use the store
const officeLocationsStore = useOfficeLocationsStore()

// Computed properties from store
const locations = computed(() => officeLocationsStore.locations)
const loading = computed(() => officeLocationsStore.loading)
const error = computed(() => officeLocationsStore.error)

// Handle location change
const handleLocationChange = (event) => {
  const value = event.target.value
  emit('update:modelValue', value)
  
  // Find and emit the full location object
  const selectedLocation = officeLocationsStore.getLocationByCode(value)
  emit('location-selected', selectedLocation)
}

// Retry fetching locations
const retryFetch = () => {
  officeLocationsStore.fetchOfficeLocations()
}

// Fetch locations on mount
onMounted(() => {
  officeLocationsStore.fetchOfficeLocations()
})
</script>

<style scoped>

@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');

.form-group { 
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
 margin-bottom: 0; font-family: var(--font); font-size: 13px; }

.form-group label {
  display: block; margin-bottom: 6px;
  font-size: 11px; font-weight: 600; text-transform: uppercase;
  letter-spacing: .06em; color: var(--text-3);
}
.required { color: var(--red); font-weight: 700; margin-left: 2px; }

.select-wrapper { position: relative; }

.styled-select {
  width: 100%; height: 38px; padding: 0 36px 0 12px;
  border: 1.5px solid var(--border); border-radius: var(--radius);
  font-family: var(--font); font-size: 13px; color: var(--text-1);
  background: var(--surface); appearance: none; cursor: pointer; outline: none;
  transition: border-color var(--t), box-shadow var(--t); box-sizing: border-box;
}
.styled-select:focus { border-color: var(--blue); box-shadow: var(--ring); }
.styled-select:disabled { background: var(--page-bg); cursor: not-allowed; opacity: .7; color: var(--text-4); }

.select-arrow { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); pointer-events: none; color: var(--text-3); }

.select-loading {
  position: absolute; right: 34px; top: 50%; transform: translateY(-50%);
  display: flex; align-items: center; pointer-events: none;
}
.spinner-small {
  width: 14px; height: 14px; border: 2px solid var(--border);
  border-top-color: var(--blue); border-radius: 50%; animation: spin .7s linear infinite; display: inline-block;
}
@keyframes spin { to { transform: rotate(360deg); } }

.error-message { display: block; margin-top: 4px; color: var(--red-text); font-size: 11px; font-weight: 500; }
.helper-text { display: block; margin-top: 4px; color: var(--text-4); font-size: 11px; font-style: italic; }

.retry-button {
  margin-top: 6px; background: none; border: 1.5px solid var(--blue);
  color: var(--blue); padding: 0 12px; height: 30px; border-radius: var(--radius);
  font-family: var(--font); font-size: 12px; font-weight: 600; cursor: pointer;
  display: inline-flex; align-items: center; transition: all var(--t);
}
.retry-button:hover { background: var(--blue); color: #fff; }

</style>