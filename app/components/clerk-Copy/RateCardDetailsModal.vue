<template>
  <div v-if="showModal" class="modal-overlay">
    <div class="modal-content">
      <div class="modal-header">
        <h3>{{ modalTitle }}</h3>
        <button type="button" class="modal-close" @click="closeModal">Ã—</button>
      </div>
      
      <div class="modal-body">
        <!-- DEBUG INFO (remove in production) -->
        <div style="background: #f0f0f0; padding: 10px; margin-bottom: 15px; font-size: 12px; border-radius: 4px;">
          <strong>DEBUG - Rate Card Detection:</strong><br>
          sizeDimension: "<strong>{{ sizeDimension }}</strong>"<br>
          selectedRateCard.size_dimension (raw): "{{ selectedRateCard?.size_dimension }}"<br>
          selectedRateCard.ad_type: "{{ selectedRateCard?.ad_type }}"<br>
          <br>
          <strong>Conditions:</strong><br>
          ✓ sizeDimension === 'per cm col': <strong>{{ sizeDimension === 'per cm col' }}</strong><br>
          ✓ sizeDimension === 'per column': <strong>{{ sizeDimension === 'per column' }}</strong><br>
          ✓ sizeDimension === 'per word': <strong>{{ sizeDimension === 'per word' }}</strong><br>
          ✓ ad_type === 'classified photo/Logo': <strong>{{ selectedRateCard?.ad_type === 'classified photo/Logo' }}</strong>
        </div>
        
        <!-- Per cm col -->
        <div v-if="sizeDimension === 'per cm col'" class="input-group">
          <label>Number of Centimeters:</label>
          <input 
            type="number" 
            v-model.number="details.cm"
            min="1"
            placeholder="Enter centimeters"
            @input="validateInput"
          >
          <label>Number of Columns:</label>
          <input 
            type="number" 
            v-model.number="details.columns"
            min="1"
            placeholder="Enter columns"
            @input="validateInput"
          >
          <small class="help-text">Total size: {{ totalSize }} cm col ({{ details.cm }}cm Ã— {{ details.columns }}col)</small>
        </div>
        
        <!-- Per column -->
        <div v-else-if="sizeDimension === 'per column'" class="input-group">
          <label>Number of Columns:</label>
          <input 
            type="number" 
            v-model.number="details.columns"
            min="1"
            placeholder="Enter columns"
            @input="validateInput"
          >
          <small class="help-text">Will occupy {{ details.columns }} column(s)</small>
        </div>
        
        <!-- Per word -->
        <div v-else-if="sizeDimension === 'per word'" class="input-group">
          <label>Number of Words:</label>
          <input 
            type="number" 
            v-model.number="details.words"
            min="1"
            placeholder="Enter word count"
            @input="validateInput"
          >
          <small class="help-text">Estimated reading time: {{ estimatedReadingTime }}</small>
        </div>
        
        <!-- Classified photo/Logo -->
        <div v-else-if="selectedRateCard?.ad_type === 'classified photo/Logo'" class="input-group">
          <label>Number of Photos/Logos:</label>
          <input 
            type="number" 
            v-model.number="details.photos"
            min="1"
            placeholder="Enter number of photos"
            @input="validateInput"
          >
          <small class="help-text">Each photo/logo will be charged separately</small>
        </div>
        
        <!-- FALLBACK - No condition matched -->
        <div v-else class="input-group" style="background: #fff3cd; padding: 15px; border-radius: 4px;">
          <strong style="color: #856404;">⚠️ No matching rate card type detected!</strong>
          <p style="margin: 10px 0 0 0; color: #856404;">
            None of the expected conditions matched. This rate card may not require additional details,
            or there may be a configuration issue.
          </p>
        </div>
        
        <!-- Display selected rate card info -->
        <div class="ratecard-info" v-if="selectedRateCard">
          <div class="info-row">
            <span>Base Rate:</span>
            <strong>{{ formatCurrency(selectedRateCard.basePrice || selectedRateCard.price_fc) }}</strong>
          </div>
          <div class="info-row" v-if="sizeDimension || selectedRateCard.ad_type === 'classified photo/Logo'">
            <span>Unit:</span>
            <strong>{{ getUnitDisplay() }}</strong>
          </div>
          <div class="info-row" v-if="calculatedPrice">
            <span>Estimated Price:</span>
            <strong class="estimated-price">{{ formatCurrency(calculatedPrice) }}</strong>
          </div>
        </div>
      </div>
      
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" @click="closeModal">Cancel</button>
        <button 
          type="button" 
          class="btn btn-primary" 
          @click="saveDetails"
          :disabled="!isValidInput"
        >
          Continue with Calculation
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  showModal: {
    type: Boolean,
    default: false
  },
  selectedRateCard: {
    type: Object,
    default: null
  },
  frequency: {
    type: Number,
    default: 1
  },
  adType: {
    type: String,
    default: 'full_color'
  }
})

const emit = defineEmits(['close', 'save'])

// Details object to collect user input
const details = ref({
  cm: null,
  columns: null,
  words: null,
  photos: null
})

// Reset details when modal opens/closes
watch(() => props.showModal, (newVal) => {
  if (newVal) {
    console.log('[MODAL] ===== RATE CARD DETAILS MODAL OPENED =====')
    console.log('[MODAL] selectedRateCard:', props.selectedRateCard)
    console.log('[MODAL] selectedRateCard.size_dimension (raw):', props.selectedRateCard?.size_dimension)
    console.log('[MODAL] selectedRateCard.ad_type:', props.selectedRateCard?.ad_type)
    console.log('[MODAL] sizeDimension (normalized):', sizeDimension.value)
    console.log('[MODAL] adType prop:', props.adType)
    console.log('[MODAL] ===========================================')
    
    details.value = {
      cm: null,
      columns: null,
      words: null,
      photos: null
    }
  }
})

// Computed properties
const sizeDimension = computed(() => {
  if (!props.selectedRateCard) return ''
  const dimension = props.selectedRateCard.size_dimension || ''
  // Normalize underscore format to space format (e.g., "per_cm_col" -> "per cm col")
  return dimension.replace(/_/g, ' ')
})

const modalTitle = computed(() => {
  if (!props.selectedRateCard) return 'Additional Information Required'
  
  const titles = {
    'per cm col': 'Specify Advertisement Size',
    'per column': 'Specify Number of Columns',
    'per word': 'Specify Word Count',
    'classified photo/Logo': 'Specify Number of Photos/Logos'
  }
  
  return titles[sizeDimension.value] || 
         (props.selectedRateCard.ad_type === 'classified photo/Logo' ? 'Specify Number of Photos/Logos' : 
          'Additional Information Required')
})

const totalSize = computed(() => {
  if (details.value.cm && details.value.columns) {
    return details.value.cm * details.value.columns
  }
  return 0
})

const estimatedReadingTime = computed(() => {
  if (!details.value.words) return ''
  const minutes = Math.ceil(details.value.words / 200) // Assuming 200 words per minute
  return `${minutes} minute${minutes !== 1 ? 's' : ''}`
})

const isValidInput = computed(() => {
  if (sizeDimension.value === 'per cm col') {
    return details.value.cm > 0 && details.value.columns > 0
  } else if (sizeDimension.value === 'per column') {
    return details.value.columns > 0
  } else if (sizeDimension.value === 'per word') {
    return details.value.words > 0
  } else if (props.selectedRateCard?.ad_type === 'classified photo/Logo') {
    return details.value.photos > 0
  }
  return false
})

const calculatedPrice = computed(() => {
  console.log('[MODAL-CALC] === CALCULATING PRICE IN MODAL ===')
  console.log('[MODAL-CALC] selectedRateCard:', props.selectedRateCard)
  console.log('[MODAL-CALC] isValidInput:', isValidInput.value)
  
  if (!props.selectedRateCard || !isValidInput.value) {
    console.log('[MODAL-CALC] SKIPPED - Missing rate card or invalid input')
    return null
  }
  
  const basePrice = props.selectedRateCard.basePrice || 
                   (props.adType === 'full_color' ? props.selectedRateCard.price_fc : props.selectedRateCard.price_bw) || 0
  
  console.log('[MODAL-CALC] adType prop:', props.adType)
  console.log('[MODAL-CALC] selectedRateCard.basePrice:', props.selectedRateCard.basePrice)
  console.log('[MODAL-CALC] selectedRateCard.price_fc:', props.selectedRateCard.price_fc)
  console.log('[MODAL-CALC] selectedRateCard.price_bw:', props.selectedRateCard.price_bw)
  console.log('[MODAL-CALC] Resolved basePrice:', basePrice)
  
  let unitPrice = basePrice
  
  if (sizeDimension.value === 'per cm col' && details.value.cm && details.value.columns) {
    unitPrice = basePrice * details.value.cm * details.value.columns
    console.log('[MODAL-CALC] per cm col: basePrice', basePrice, '× cm', details.value.cm, '× columns', details.value.columns, '=', unitPrice)
  } else if (sizeDimension.value === 'per column' && details.value.columns) {
    unitPrice = basePrice * details.value.columns
    console.log('[MODAL-CALC] per column: basePrice', basePrice, '× columns', details.value.columns, '=', unitPrice)
  } else if (sizeDimension.value === 'per word' && details.value.words) {
    unitPrice = basePrice * details.value.words
    console.log('[MODAL-CALC] per word: basePrice', basePrice, '× words', details.value.words, '=', unitPrice)
  } else if (props.selectedRateCard.ad_type === 'classified photo/Logo' && details.value.photos) {
    unitPrice = basePrice * details.value.photos
    console.log('[MODAL-CALC] classified photo: basePrice', basePrice, '× photos', details.value.photos, '=', unitPrice)
  }
  
  // Apply frequency
  const finalPrice = unitPrice * props.frequency
  console.log('[MODAL-CALC] Applying frequency: unitPrice', unitPrice, '× frequency', props.frequency, '=', finalPrice)
  console.log('[MODAL-CALC] FINAL CALCULATED PRICE:', finalPrice)
  
  return finalPrice
})

// Methods
const getUnitDisplay = () => {
  if (sizeDimension.value === 'per cm col') {
    return 'per cm column'
  } else if (sizeDimension.value === 'per column') {
    return 'per column'
  } else if (sizeDimension.value === 'per word') {
    return 'per word'
  } else if (props.selectedRateCard?.ad_type === 'classified photo/Logo') {
    return 'per photo/logo'
  }
  return 'unit'
}

const formatCurrency = (amount) => {
  if (!amount) return 'UGX 0'
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

const validateInput = () => {
  // Ensure positive numbers
  Object.keys(details.value).forEach(key => {
    if (details.value[key] < 1) {
      details.value[key] = null
    }
  })
}

const closeModal = () => {
  emit('close')
}

const saveDetails = () => {
  if (!isValidInput.value) return
  
  console.log('[MODAL-SAVE] === SAVING RATE CARD DETAILS ===')
  console.log('[MODAL-SAVE] Input values:', details.value)
  console.log('[MODAL-SAVE] sizeDimension:', sizeDimension.value)
  console.log('[MODAL-SAVE] calculatedPrice (from modal):', calculatedPrice.value)
  
  // Prepare the details object with only relevant data
  const detailsToSave = {}
  
  if (sizeDimension.value === 'per cm col') {
    detailsToSave.cm = details.value.cm
    detailsToSave.columns = details.value.columns
    detailsToSave.totalSize = totalSize.value
  } else if (sizeDimension.value === 'per column') {
    detailsToSave.columns = details.value.columns
  } else if (sizeDimension.value === 'per word') {
    detailsToSave.words = details.value.words
  } else if (props.selectedRateCard?.ad_type === 'classified photo/Logo') {
    detailsToSave.photos = details.value.photos
  }
  
  const emitData = {
    rateCardId: props.selectedRateCard.id,
    sizeDimension: sizeDimension.value,
    adType: props.selectedRateCard.ad_type,
    details: detailsToSave,
    calculatedPrice: calculatedPrice.value
  }
  
  console.log('[MODAL-SAVE] Emitting save event with:', JSON.stringify(emitData, null, 2))
  emit('save', emitData)
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 10px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
  color: #003366;
  font-size: 1.3em;
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.3s;
}

.modal-close:hover {
  background-color: #f5f5f5;
}

.modal-body {
  padding: 20px;
}

.input-group {
  margin-bottom: 20px;
}

.input-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

.input-group input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 16px;
  margin-bottom: 15px;
}

.input-group input:focus {
  outline: none;
  border-color: #0066cc;
  box-shadow: 0 0 0 2px rgba(0, 102, 204, 0.1);
}

.help-text {
  display: block;
  color: #666;
  font-size: 0.85em;
  margin-top: 5px;
}

.ratecard-info {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 6px;
  margin-top: 20px;
  border: 1px solid #e9ecef;
}

.info-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e9ecef;
}

.info-row:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.estimated-price {
  color: #003366;
  font-size: 1.1em;
}

.modal-footer {
  padding: 20px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s;
}

.btn-primary {
  background: #0066cc;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #0052a3;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #5a6268;
}
</style>