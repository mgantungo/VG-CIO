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
        <div v-if="detailMode === 'per_cm_col'" class="input-group">
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

        <!-- Classified: Semi-Display (same cm x columns model as per cm col, keyed off ad_type) -->
        <div v-else-if="detailMode === 'semi_display'" class="input-group">
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
        <div v-else-if="detailMode === 'per_column'" class="input-group">
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
        <div v-else-if="detailMode === 'per_word'" class="input-group">
          <ClassifiedTextBuilder :disabled="false" />
        </div>
        
        <!-- Classified Photo/Logo, optionally with accompanying billable text -->
        <div v-else-if="detailMode === 'photo_logo'" class="input-group">
          <label>Number of Photos/Logos:</label>
          <input 
            type="number" 
            v-model.number="details.photos"
            min="1"
            placeholder="Enter number of photos"
            @input="validateInput"
          >
          <small class="help-text">Each photo/logo will be charged separately</small>

          <label class="text-toggle-label">
            <input
              type="checkbox"
              v-model="details.includeText"
              :disabled="!wordSiblingRateCard"
            >
            Include accompanying text (billed per word)
          </label>
          <small v-if="!wordSiblingRateCard" class="help-text warning-text">
            No "Classified" (per word) rate card found for this product — text pricing unavailable, photos/logos only.
          </small>

          <div v-if="details.includeText && wordSiblingRateCard" class="nested-builder">
            <ClassifiedTextBuilder :disabled="false" />
          </div>
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
          <div class="info-row" v-if="detailMode">
            <span>Unit:</span>
            <strong>{{ getUnitDisplay() }}</strong>
          </div>
          <template v-if="priceCalculation.breakdown.length">
            <div
              v-for="row in priceCalculation.breakdown"
              :key="row.label"
              class="info-row"
              :class="{ 'info-row-total': row.isTotal }"
            >
              <span>{{ row.label }}:</span>
              <strong :class="{ 'estimated-price': row.isTotal }">{{ row.value }}</strong>
            </div>
          </template>
          <div class="info-row" v-else>
            <span>Base Rate:</span>
            <strong>{{ formatCurrency(resolvedBasePrice) }}</strong>
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
  },
  // Full rate card list for the currently selected product, used to find the
  // sibling "Classified" (per word) rate card when a "Photo/Logo" ad also
  // includes billable accompanying text. Optional — if omitted, the text
  // toggle for Photo/Logo simply stays unavailable.
  allRateCards: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close', 'save'])

// Details object to collect user input
const details = ref({
  cm: null,
  columns: null,
  words: null,
  photos: null,
  includeText: true
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
      photos: null,
      includeText: true
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

// Normalizes a string for case/spacing-insensitive comparison. Mirrors the
// backend's normalize() in price-calculator.js so both sides agree on which
// mode a rate card falls into.
const normalize = (str) => (str || '').toString().toLowerCase().trim().replace(/_/g, ' ')

// Resolves which detail-collection UI to show. ad_type-based checks run
// first for Semi-Display and Photo/Logo because those two don't reliably
// carry a size_dimension value that maps to a generic unit (Semi-Display's
// size_dimension is literally "per col", not "per cm col") — everything
// else falls back to the original size_dimension checks, unchanged.
const detailMode = computed(() => {
  if (!props.selectedRateCard) return null
  const adType = normalize(props.selectedRateCard.ad_type)
  const dimension = normalize(props.selectedRateCard.size_dimension)

  if (adType.includes('semi-display') || adType.includes('semi display')) return 'semi_display'
  if (adType.includes('photo') && adType.includes('logo')) return 'photo_logo'
  if (dimension === 'per cm col') return 'per_cm_col'
  if (dimension === 'per column' || dimension === 'per col') return 'per_column'
  if (dimension === 'per word') return 'per_word'
  return null
})

// Sibling "Classified" (per word) rate card in the same product's rate card
// list, used to price accompanying text on a Photo/Logo ad. Falls back to
// null (text toggle disables itself) if the product has no such rate card.
const wordSiblingRateCard = computed(() => {
  return props.allRateCards.find(rc => {
    const dimension = normalize(rc.size_dimension)
    return dimension === 'per word'
  }) || null
})

// Single source of truth for the selected rate card's base rate, resolved
// against the current Color/Type toggle. Both the "Base Rate" info-row
// display and calculatedPrice read from this, so switching Full Colour /
// Black & White can't leave the two out of sync with each other again.
const resolvedBasePrice = computed(() => {
  if (!props.selectedRateCard) return 0
  return props.selectedRateCard.basePrice ||
    (props.adType === 'full_color' ? props.selectedRateCard.price_fc : props.selectedRateCard.price_bw) || 0
})

const modalTitle = computed(() => {
  if (!props.selectedRateCard) return 'Additional Information Required'
  
  const titles = {
    per_cm_col: 'Specify Advertisement Size',
    semi_display: 'Specify Advertisement Size',
    per_column: 'Specify Number of Columns',
    per_word: 'Specify Word Count',
    photo_logo: 'Specify Number of Photos/Logos'
  }
  
  return titles[detailMode.value] || 'Additional Information Required'
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
  if (detailMode.value === 'per_cm_col' || detailMode.value === 'semi_display') {
    return details.value.cm > 0 && details.value.columns > 0
  } else if (detailMode.value === 'per_column') {
    return details.value.columns > 0
  } else if (detailMode.value === 'per_word') {
    return classifiedStore.isComplete && classifiedStore.wordCount > 0
  } else if (detailMode.value === 'photo_logo') {
    const photosValid = details.value.photos > 0
    const wantsText = details.value.includeText && !!wordSiblingRateCard.value
    if (!wantsText) return photosValid
    return photosValid && classifiedStore.isComplete && classifiedStore.wordCount > 0
  }
  return false
})

// Full step-by-step price breakdown for the currently selected detail mode -
// base rate, the size/count entered, the resulting unit price, frequency,
// and the final total. `calculatedPrice` below stays a thin alias reading
// `.total`, so the save payload and existing logging don't need to change.
const priceCalculation = computed(() => {
  console.log('[MODAL-CALC] === CALCULATING PRICE IN MODAL ===')
  console.log('[MODAL-CALC] selectedRateCard:', props.selectedRateCard)
  console.log('[MODAL-CALC] isValidInput:', isValidInput.value)

  const breakdown = []

  if (!props.selectedRateCard || !isValidInput.value) {
    console.log('[MODAL-CALC] SKIPPED - Missing rate card or invalid input')
    return { breakdown, total: null }
  }

  const basePrice = resolvedBasePrice.value

  console.log('[MODAL-CALC] adType prop:', props.adType)
  console.log('[MODAL-CALC] selectedRateCard.basePrice:', props.selectedRateCard.basePrice)
  console.log('[MODAL-CALC] selectedRateCard.price_fc:', props.selectedRateCard.price_fc)
  console.log('[MODAL-CALC] selectedRateCard.price_bw:', props.selectedRateCard.price_bw)
  console.log('[MODAL-CALC] Resolved basePrice:', basePrice)

  let unitPrice = basePrice

  if ((detailMode.value === 'per_cm_col' || detailMode.value === 'semi_display') && details.value.cm && details.value.columns) {
    unitPrice = basePrice * details.value.cm * details.value.columns
    breakdown.push({ label: 'Base Rate', value: `${formatCurrency(basePrice)} per cm/col` })
    breakdown.push({ label: 'Size', value: `${details.value.cm}cm × ${details.value.columns} column(s) = ${totalSize.value} cm/col` })
    breakdown.push({ label: 'Unit Price', value: `${formatCurrency(basePrice)} × ${totalSize.value} = ${formatCurrency(unitPrice)}` })
    console.log('[MODAL-CALC]', detailMode.value, ': basePrice', basePrice, '× cm', details.value.cm, '× columns', details.value.columns, '=', unitPrice)
  } else if (detailMode.value === 'per_column' && details.value.columns) {
    unitPrice = basePrice * details.value.columns
    breakdown.push({ label: 'Base Rate', value: `${formatCurrency(basePrice)} per column` })
    breakdown.push({ label: 'Columns', value: `${details.value.columns}` })
    breakdown.push({ label: 'Unit Price', value: `${formatCurrency(basePrice)} × ${details.value.columns} = ${formatCurrency(unitPrice)}` })
    console.log('[MODAL-CALC] per column: basePrice', basePrice, '× columns', details.value.columns, '=', unitPrice)
  } else if (detailMode.value === 'per_word' && details.value.words) {
    unitPrice = basePrice * details.value.words
    breakdown.push({ label: 'Base Rate', value: `${formatCurrency(basePrice)} per word` })
    breakdown.push({ label: 'Word Count', value: `${details.value.words} word(s)` })
    breakdown.push({ label: 'Unit Price', value: `${formatCurrency(basePrice)} × ${details.value.words} = ${formatCurrency(unitPrice)}` })
    console.log('[MODAL-CALC] per word: basePrice', basePrice, '× words', details.value.words, '=', unitPrice)
  } else if (detailMode.value === 'photo_logo' && details.value.photos) {
    const photoSubtotal = basePrice * details.value.photos
    breakdown.push({ label: 'Photo/Logo Rate', value: `${formatCurrency(basePrice)} each` })
    breakdown.push({ label: 'Photos/Logos', value: `${details.value.photos}` })
    breakdown.push({ label: 'Photo Subtotal', value: `${formatCurrency(basePrice)} × ${details.value.photos} = ${formatCurrency(photoSubtotal)}` })

    let wordSubtotal = 0
    if (details.value.includeText && wordSiblingRateCard.value && details.value.words) {
      // Classified text is always billed at the black & white per-word
      // rate, regardless of the ad's own Color/Type toggle - there is no
      // full-colour rate for per-word classified text, so following
      // props.adType here priced it at an empty/0 price_fc.
      const wordRate = wordSiblingRateCard.value.price_bw || 0
      wordSubtotal = wordRate * details.value.words
      breakdown.push({ label: 'Text Rate', value: `${formatCurrency(wordRate)} per word (always B&W)` })
      breakdown.push({ label: 'Word Count', value: `${details.value.words} word(s)` })
      breakdown.push({ label: 'Text Subtotal', value: `${formatCurrency(wordRate)} × ${details.value.words} = ${formatCurrency(wordSubtotal)}` })
    }
    unitPrice = photoSubtotal + wordSubtotal
    if (wordSubtotal > 0) {
      breakdown.push({ label: 'Combined Unit Price', value: `${formatCurrency(photoSubtotal)} + ${formatCurrency(wordSubtotal)} = ${formatCurrency(unitPrice)}` })
    }
    console.log('[MODAL-CALC] photo_logo: photoSubtotal', photoSubtotal, '+ wordSubtotal', wordSubtotal, '=', unitPrice)
  } else {
    return { breakdown: [], total: null }
  }

  // Apply frequency
  const finalPrice = unitPrice * props.frequency
  breakdown.push({ label: 'Frequency', value: `${formatCurrency(unitPrice)} × ${props.frequency} = ${formatCurrency(finalPrice)}` })
  breakdown.push({ label: 'Total', value: formatCurrency(finalPrice), isTotal: true })

  console.log('[MODAL-CALC] Applying frequency: unitPrice', unitPrice, '× frequency', props.frequency, '=', finalPrice)
  console.log('[MODAL-CALC] FINAL CALCULATED PRICE:', finalPrice)

  return { breakdown, total: finalPrice }
})

const calculatedPrice = computed(() => priceCalculation.value.total)

// Methods
const getUnitDisplay = () => {
  if (detailMode.value === 'per_cm_col' || detailMode.value === 'semi_display') {
    return 'per cm column'
  } else if (detailMode.value === 'per_column') {
    return 'per column'
  } else if (detailMode.value === 'per_word') {
    return 'per word'
  } else if (detailMode.value === 'photo_logo') {
    return details.value.includeText && wordSiblingRateCard.value
      ? 'per photo/logo + per word'
      : 'per photo/logo'
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
  // Ensure positive numbers. Only applies to the numeric fields — includeText
  // is a boolean and must not be swept up by this (false < 1 is true, which
  // would otherwise null it out and break the checkbox).
  const numericKeys = ['cm', 'columns', 'words', 'photos']
  numericKeys.forEach(key => {
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
  const includesText = detailMode.value === 'photo_logo' && details.value.includeText && !!wordSiblingRateCard.value

  if (detailMode.value === 'per_cm_col' || detailMode.value === 'semi_display') {
    detailsToSave.cm = details.value.cm
    detailsToSave.columns = details.value.columns
    detailsToSave.totalSize = totalSize.value
  } else if (detailMode.value === 'per_column') {
    detailsToSave.columns = details.value.columns
  } else if (detailMode.value === 'per_word') {
    // Only 'words' goes into details.details, since that object gets spread
    // directly into the backend price-calculation request body.
    detailsToSave.words = details.value.words
    if (classifiedStore.isBulk) detailsToSave.isBulk = true
  } else if (detailMode.value === 'photo_logo') {
    detailsToSave.photos = details.value.photos
    if (includesText) {
      // wordRateCardId tells the backend which sibling rate card to price
      // the accompanying text against, since it's separate from the
      // Photo/Logo rate card's own basePrice.
      detailsToSave.words = details.value.words
      detailsToSave.wordRateCardId = wordSiblingRateCard.value.id
      if (classifiedStore.isBulk) detailsToSave.isBulk = true
    }
  }
  
  const usesClassifiedText = detailMode.value === 'per_word' || includesText

  const emitData = {
    rateCardId: props.selectedRateCard.id,
    sizeDimension: sizeDimension.value,
    adType: props.selectedRateCard.ad_type,
    details: detailsToSave,
    calculatedPrice: calculatedPrice.value,
    // Top-level convenience fields (not spread into the price API): the assembled
    // classified ad copy + which template produced it. New.vue uses `composedText`
    // to populate Special Instructions.
    templateId: usesClassifiedText ? classifiedStore.templateId : null,
    composedText: usesClassifiedText ? classifiedStore.text : null
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
.help-text.warning-text { color: var(--amber-text); }

.text-toggle-label {
  display: flex !important; align-items: center; gap: 8px; margin-top: 14px;
  text-transform: none !important; letter-spacing: normal !important;
  font-size: 12px !important; font-weight: 500 !important; color: var(--text-2) !important;
  cursor: pointer;
}
.text-toggle-label input[type="checkbox"] {
  width: 16px; height: 16px; margin: 0; accent-color: var(--blue); cursor: pointer;
}
.nested-builder {
  margin-top: 12px; padding: 12px; background: var(--page-bg);
  border: 1px solid var(--border-lt); border-radius: var(--radius);
}

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
.info-row-total { border-top: 2px solid var(--navy); background: var(--blue-lt) !important; }
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