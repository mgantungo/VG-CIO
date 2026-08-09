<template>
  <div v-if="showModal" class="modal-overlay">
    <div class="modal-content">
      <div class="modal-header">
        <h3>{{ modalTitle }}</h3>
        <button type="button" class="modal-close" @click="closeModal">X</button>
      </div>
      
      <div class="modal-body">
        <!-- DEBUG INFO (remove in production) -->
        <!----
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
      -->
        
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
          <ClassifiedTextBuilder :disabled="false" />
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
import ClassifiedTextBuilder from './ClassifiedTextBuilder.vue'
import { useClassifiedAdStore } from '~/stores/classifiedAd'

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

// Classified ("per word") state now lives in a Pinia store so it survives
// modal re-opens (e.g. switching Full Colour / Black & White re-selects the
// rate card and re-opens this modal) instead of being wiped every time.
const classifiedStore = useClassifiedAdStore()

// Keep details.words in sync with the store's live word count for pricing
watch(() => classifiedStore.wordCount, (newCount) => {
  details.value.words = newCount
}, { immediate: true })

// Reset details when modal opens/closes. Note: classifiedStore is intentionally
// NOT cleared here - it persists across opens/closes so progress isn't lost.
// Use the "Start Over" button inside ClassifiedTextBuilder to clear it explicitly.
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
      words: classifiedStore.wordCount,
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
    return classifiedStore.isComplete && classifiedStore.wordCount > 0
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
    // Only 'words' goes into details.details, since that object gets spread
    // directly into the backend price-calculation request body.
    detailsToSave.words = details.value.words
  } else if (props.selectedRateCard?.ad_type === 'classified photo/Logo') {
    detailsToSave.photos = details.value.photos
  }
  
  const emitData = {
    rateCardId: props.selectedRateCard.id,
    sizeDimension: sizeDimension.value,
    adType: props.selectedRateCard.ad_type,
    details: detailsToSave,
    calculatedPrice: calculatedPrice.value,
    // Top-level convenience fields (not spread into the price API): the assembled
    // classified ad copy + which template produced it. New.vue uses `composedText`
    // to populate Special Instructions.
    templateId: sizeDimension.value === 'per word' ? classifiedStore.templateId : null,
    composedText: sizeDimension.value === 'per word' ? classifiedStore.text : null
  }
  
  console.log('[MODAL-SAVE] Emitting save event with:', JSON.stringify(emitData, null, 2))
  emit('save', emitData)
}
</script>

<style scoped>

@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');

.modal-overlay { 
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

  position: fixed; inset: 0; background: rgba(0,0,0,.45);
  display: flex; justify-content: center; align-items: center;
  z-index: 1000; padding: 16px; font-family: var(--font); font-size: 13px;
}

.modal-content {
  background: var(--surface); border-radius: var(--radius);
  width: 100%; max-width: 480px; max-height: 90vh; overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0,0,0,.25); overflow: hidden;
}

.modal-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 14px 20px; background: var(--navy);
}
.modal-header h3 { margin: 0; color: #fff; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; }
.modal-close {
  background: none; border: none; font-size: 20px; cursor: pointer;
  color: rgba(255,255,255,.7); width: 28px; height: 28px;
  display: flex; align-items: center; justify-content: center;
  border-radius: var(--radius); transition: all var(--t);
}
.modal-close:hover { color: #fff; background: rgba(255,255,255,.1); }

.modal-body { padding: 20px; max-height: calc(90vh - 120px); overflow-y: auto; }

.input-group { margin-bottom: 18px; }
.input-group label {
  display: block; margin-bottom: 6px;
  font-size: 11px; font-weight: 600; text-transform: uppercase;
  letter-spacing: .06em; color: var(--text-3);
}
.input-group input {
  width: 100%; height: 38px; padding: 0 12px;
  border: 1.5px solid var(--border); border-radius: var(--radius);
  font-family: var(--font); font-size: 13px; color: var(--text-1);
  background: var(--surface); outline: none; box-sizing: border-box;
  margin-bottom: 0; transition: border-color var(--t), box-shadow var(--t);
}
.input-group input:focus { border-color: var(--blue); box-shadow: var(--ring); }

.help-text { display: block; color: var(--text-4); font-size: 11px; margin-top: 5px; font-style: italic; }

.ratecard-info {
  background: var(--page-bg); border: 1px solid var(--border-lt);
  border-radius: var(--radius); margin-top: 18px; overflow: hidden;
  border-top: 2px solid var(--navy);
}
.info-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 9px 14px; border-bottom: 1px solid var(--border-lt);
  font-size: 13px; transition: background var(--t);
}
.info-row:last-child { border-bottom: none; }
.info-row:nth-child(even) { background: var(--surface); }
.info-row span:first-child { color: var(--text-3); font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .05em; }
.estimated-price { color: var(--navy); font-size: 14px; font-weight: 700; font-variant-numeric: tabular-nums; }

.modal-footer {
  padding: 14px 20px; border-top: 1px solid var(--border-lt);
  background: var(--page-bg); display: flex; justify-content: flex-end; gap: 8px;
}

.btn {
  display: inline-flex; align-items: center; height: 38px; padding: 0 18px;
  border: none; border-radius: var(--radius); font-family: var(--font);
  font-size: 13px; font-weight: 600; cursor: pointer; white-space: nowrap;
  transition: all var(--t); outline: none;
}
.btn:disabled { opacity: .45; cursor: not-allowed; }
.btn:active:not(:disabled) { transform: scale(.97); }

.btn-primary { background: var(--navy); color: #fff; }
.btn-primary:hover:not(:disabled) { background: var(--navy-light); }

.btn-secondary { background: var(--page-bg); color: var(--text-2); border: 1.5px solid var(--border); }
.btn-secondary:hover { background: #E2E8F0; }

</style>