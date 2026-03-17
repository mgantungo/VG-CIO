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
.form-group {
  margin-bottom: 25px;
}

.form-group label {
  display: block;
  margin-bottom: 10px;
  color: #2A4B8C;
  font-weight: 600;
  font-size: 0.95em;
  letter-spacing: 0.3px;
}

.required {
  color: #FF6B6B;
  font-weight: 700;
}

.select-wrapper {
  position: relative;
}

.styled-select {
  width: 100%;
  padding: 14px 45px 14px 16px;
  border: 2px solid #e6e9f4;
  border-radius: 10px;
  font-size: 1em;
  transition: all 0.3s ease;
  background-color: #ffffff;
  color: #2D3748;
  appearance: none;
  cursor: pointer;
}

.styled-select:focus {
  outline: none;
  border-color: #4A6FDC;
  box-shadow: 0 0 0 3px rgba(74, 111, 220, 0.15);
}

.styled-select:disabled {
  background-color: #F7F9FC;
  cursor: not-allowed;
  opacity: 0.7;
  border-color: #E2E8F0;
}

.select-arrow {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: #4A6FDC;
}

.select-loading {
  position: absolute;
  right: 40px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  pointer-events: none;
}

.spinner-small {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(74, 111, 220, 0.2);
  border-radius: 50%;
  border-top-color: #4A6FDC;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-message {
  display: block;
  margin-top: 8px;
  color: #FF6B6B;
  font-size: 0.85em;
  font-weight: 500;
}

.helper-text {
  display: block;
  margin-top: 8px;
  color: #64748B;
  font-size: 0.85em;
}

.retry-button {
  margin-top: 8px;
  background: none;
  border: 1px solid #4A6FDC;
  color: #4A6FDC;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.85em;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  transition: all 0.2s ease;
}

.retry-button:hover {
  background: #4A6FDC;
  color: white;
}
</style>