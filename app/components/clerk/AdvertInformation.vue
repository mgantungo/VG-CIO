<!-- components/clerk/AdvertInformation.vue -->
<template>
  <div class="form-section">
    <div class="section-header">
      <h3 class="section-title">Advert Information</h3>
      <div class="section-badge">Required</div>
    </div>
    
    <div class="form-group">
      <label>Advert Title <span class="required">*</span></label>
      <div class="input-wrapper">
        <input 
          :value="advertTitle"
          type="text" 
          placeholder="e.g., MTN New Year Campaign" 
          required
          :disabled="disabled"
          @input="updateAdvertTitle($event.target.value)"
        >
        <div class="input-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M11 5H6C4.89543 5 4 5.89543 4 7V18C4 19.1046 4.89543 20 6 20H17C18.1046 20 19 19.1046 19 18V13M17.5858 3.58579C18.3668 2.80474 19.6332 2.80474 20.4142 3.58579C21.1953 4.36684 21.1953 5.63316 20.4142 6.41421L11.8284 15H9L9 12.1716L17.5858 3.58579Z" stroke="#4A6FDC" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
      </div>
    </div>

    <div class="form-group">
      <label>Platform Category <span class="required">*</span></label>
      <div class="select-wrapper">
        <select 
          :value="platformCategory" 
          required 
          @change="handleCategoryChange($event)"
          :disabled="disabled || categoriesLoading"
          class="styled-select"
        >
          <option value="">Select platform category</option>
          <option 
            v-for="category in activeCategories" 
            :key="category.id" 
            :value="category.category_type"
            :disabled="!category.is_active"
          >
            {{ category.name }}
            <span v-if="!category.is_active">(Inactive)</span>
          </option>
        </select>
        <div class="select-arrow">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 4L6 8L10 4" stroke="#4A6FDC" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div v-if="categoriesLoading" class="select-loading">
          <span class="spinner-small"></span>
        </div>
      </div>
      <small v-if="platformCategory && selectedCategory" class="category-description">
        {{ selectedCategory.description }}
      </small>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label>Product/Section <span class="required">*</span></label>
        <div class="select-wrapper">
          <select 
            :value="product" 
            required 
            @change="handleProductChange($event)"
            :disabled="!platformCategory || disabled || productsLoading"
            class="styled-select"
          >
            <option value="">Select category first</option>
            <option 
              v-for="product in filteredProducts" 
              :key="product.id" 
              :value="product.id"
              :disabled="!product.is_active"
            >
              {{ product.name }}
              <span v-if="!product.is_active">(Inactive)</span>
              <span v-if="product.circulation" class="product-info">
                (Circulation: {{ formatNumber(product.circulation) }})
              </span>
            </option>
          </select>
          <div class="select-arrow">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 4L6 8L10 4" stroke="#4A6FDC" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div v-if="productsLoading" class="select-loading">
            <span class="spinner-small"></span>
          </div>
        </div>
        <small v-if="productsLoading" class="loading-text">Loading products...</small>
        <small v-if="product && selectedProduct" class="product-description">
          {{ selectedProduct.description }}
        </small>
      </div>
      
      <div class="form-group">
        <label>Rate Card <span class="required">*</span></label>
        <div class="select-wrapper">
          <select 
            :value="rateCardId" 
            required 
            @change="handleRateCardChange($event)"
            :disabled="!product || disabled || rateCardsLoading"
            class="styled-select"
          >
            <option value="">Select product first</option>
            <option 
              v-for="rateCard in availableRateCards" 
              :key="rateCard.id" 
              :value="rateCard.id"
            >
              {{ getRateCardDisplayName(rateCard) }}
              <span v-if="!isRateCardActive(rateCard)" class="expired-label">(Expired)</span>
            </option>
          </select>
          <div class="select-arrow">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 4L6 8L10 4" stroke="#4A6FDC" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div v-if="rateCardsLoading" class="select-loading">
            <span class="spinner-small"></span>
          </div>
        </div>
        <small v-if="rateCardsLoading" class="loading-text">Loading rate cards...</small>
        <small v-if="selectedRateCard && selectedRateCard.effectiveDate" class="ratecard-info">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style="vertical-align: middle; margin-right: 4px;">
            <path d="M6 3V6L8 7.5M6 10.5C8.48528 10.5 10.5 8.48528 10.5 6C10.5 3.51472 8.48528 1.5 6 1.5C3.51472 1.5 1.5 3.51472 1.5 6C1.5 8.48528 3.51472 10.5 6 10.5Z" stroke="#4A6FDC" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          Effective: {{ formatDate(selectedRateCard.effectiveDate) }}
          <span v-if="selectedRateCard.expiryDate">
            to {{ formatDate(selectedRateCard.expiryDate) }}
          </span>
        </small>
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label>Ad Size</label>
        <div class="input-wrapper">
          <input 
            :value="adSize"
            type="text" 
            placeholder="e.g., Full Page, 30 sec spot"
            :disabled="disabled"
            @input="updateAdSize($event.target.value)"
          >
          <div class="input-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="18" height="18" rx="2" stroke="#4A6FDC" stroke-width="2"/>
            </svg>
          </div>
        </div>
      </div>
      
      <div class="form-group">
        <label>Color/Type</label>
        <div class="color-select-wrapper">
          <select 
            :value="adType" 
            @change="handleAdTypeChange($event)"
            :disabled="!rateCardId || disabled || priceLoading"
            class="styled-select"
          >
            <option value="full_color" style="color: #4A6FDC; font-weight: 600;">Full Color</option>
            <option value="black_white" style="color: #2D3748; font-weight: 600;">Black & White</option>
          </select>
          <div class="color-preview" :class="adType"></div>
        </div>
      </div>
    </div>
    
    <!-- Display rate card details if available -->
    <div v-if="rateCardDetails" class="ratecard-details-summary">
      <div class="details-header">
        <h4>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="vertical-align: middle; margin-right: 8px;">
            <path d="M8 14C11.3137 14 14 11.3137 14 8C14 4.68629 11.3137 2 8 2C4.68629 2 2 4.68629 2 8C2 11.3137 4.68629 14 8 14Z" stroke="#2A4B8C" stroke-width="1.5"/>
            <path d="M8 5V8M8 11H8.005" stroke="#2A4B8C" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          Rate Card Details
        </h4>
        <button type="button" class="btn-edit-details" @click="editRateCardDetails" :disabled="disabled">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style="vertical-align: middle; margin-right: 4px;">
            <path d="M10.3333 1.66699C10.5084 1.49182 10.7163 1.3536 10.9451 1.2608C11.1739 1.16801 11.419 1.12268 11.6663 1.12752C11.9137 1.13235 12.1581 1.18728 12.3838 1.28891C12.6095 1.39054 12.8118 1.53672 12.9783 1.71833C13.1447 1.89993 13.2718 2.11307 13.3515 2.34436C13.4312 2.57565 13.4617 2.82014 13.4412 3.06281C13.4206 3.30549 13.3495 3.54113 13.2323 3.75497C13.115 3.96881 12.9543 4.15611 12.76 4.30532L5.58333 11.482L1.66667 12.3337L2.51833 8.41702L10.3333 1.66699Z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Edit Details
        </button>
      </div>
      <div class="details-content">
        <template v-if="rateCardDetails.sizeDimension === 'per cm col'">
          <div class="detail-item">
            <span>Size:</span>
            <div class="detail-value">
              <strong>{{ rateCardDetails.details.cm }} cm × {{ rateCardDetails.details.columns }} columns</strong>
              <span class="detail-info">(Total: {{ rateCardDetails.details.cm * rateCardDetails.details.columns }} cm col)</span>
            </div>
          </div>
        </template>
        <template v-else-if="rateCardDetails.sizeDimension === 'per column'">
          <div class="detail-item">
            <span>Columns:</span>
            <strong>{{ rateCardDetails.details.columns }} column(s)</strong>
          </div>
        </template>
        <template v-else-if="rateCardDetails.sizeDimension === 'per word'">
          <div class="detail-item">
            <span>Words:</span>
            <strong>{{ rateCardDetails.details.words }} words</strong>
          </div>
        </template>
        <template v-else-if="rateCardDetails.adType === 'classified photo/Logo'">
          <div class="detail-item">
            <span>Photos/Logos:</span>
            <strong>{{ rateCardDetails.details.photos }} item(s)</strong>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, computed } from 'vue'

const props = defineProps({
  advertTitle: {
    type: String,
    default: ''
  },
  platformCategory: {
    type: String,
    default: ''
  },
  product: {
    type: [String, Number],
    default: ''
  },
  rateCardId: {
    type: [String, Number],
    default: ''
  },
  adSize: {
    type: String,
    default: ''
  },
  adType: {
    type: String,
    default: 'full_color'
  },
  disabled: {
    type: Boolean,
    default: false
  },
  categories: {
    type: Array,
    default: () => []
  },
  products: {
    type: Array,
    default: () => []
  },
  rateCards: {
    type: Array,
    default: () => []
  },
  rateCardDetails: {
    type: Object,
    default: null
  },
  categoriesLoading: {
    type: Boolean,
    default: false
  },
  productsLoading: {
    type: Boolean,
    default: false
  },
  rateCardsLoading: {
    type: Boolean,
    default: false
  },
  priceLoading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'update:advertTitle', 
  'update:platformCategory', 
  'update:product', 
  'update:rateCardId',
  'update:adSize',
  'update:adType',
  'category-change',
  'product-change',
  'ratecard-change',
  'adtype-change',
  'edit-ratecard-details',
  'ratecard-selected',
  'size-dimension-change' 
])

const activeCategories = computed(() => {
  return props.categories.filter(category => category.is_active !== false)
})

const selectedCategory = computed(() => {
  if (!props.platformCategory) return null
  return props.categories.find(c => c.category_type === props.platformCategory)
})

const filteredProducts = computed(() => {
  if (!props.platformCategory) return []
  return props.products.filter(product => 
    product.categoryType === props.platformCategory && 
    product.is_active !== false
  )
})

const selectedProduct = computed(() => {
  if (!props.product) return null
  return props.products.find(p => p.id === props.product)
})

const availableRateCards = computed(() => {
  if (!props.product) return []
  return props.rateCards.filter(rateCard => {
    return isRateCardActive(rateCard)
  })
})

const selectedRateCard = computed(() => {
  if (!props.rateCardId) return null
  return props.rateCards.find(rc => rc.id === props.rateCardId)
})

const updateAdvertTitle = (value) => {
  emit('update:advertTitle', value)
}

const updateAdSize = (value) => {
  emit('update:adSize', value)
}

const handleCategoryChange = (event) => {
  const value = event.target.value
  emit('update:platformCategory', value)
  emit('update:product', '')
  emit('update:rateCardId', '')
  emit('category-change', value)
}

const handleProductChange = (event) => {
  const value = event.target.value
  emit('update:product', value)
  emit('update:rateCardId', '')
  emit('product-change', value)
}

/*
const handleRateCardChange = (event) => {
  const value = event.target.value
  emit('update:rateCardId', value)
  emit('ratecard-change', value)
}
*/

const handleRateCardChange = (event) => {
  const value = event.target.value
  emit('update:rateCardId', value)
  emit('ratecard-change', value)
  
  // Emit the selected rate card's size dimension
  if (value) {
    const selectedCard = props.rateCards.find(rc => rc.id === value)
    if (selectedCard && selectedCard.size_dimension) {
      emit('size-dimension-change', selectedCard.size_dimension)
      // Also emit the entire rate card for other potential uses
      emit('ratecard-selected', selectedCard)
    }
  }
}


const handleAdTypeChange = (event) => {
  const value = event.target.value
  emit('update:adType', value)
  emit('adtype-change', value)
}

const editRateCardDetails = () => {
  if (!props.disabled) {
    emit('edit-ratecard-details')
  }
}

const getRateCardDisplayName = (rateCard) => {
  let displayName = ""
  const price = props.adType === 'full_color' ? rateCard.price_fc : rateCard.price_bw
  
  if (rateCard.ad_type) {
    displayName += `${rateCard.ad_type}`
  }

  if (price) {
    displayName += ` - ${formatCurrency(price)}`
  }
  
  if (rateCard.size_dimension) {
    displayName += ` - ${rateCard.size_dimension}`
  }
  
  return displayName
}

const isRateCardActive = (rateCard) => {
  if (!rateCard.effectiveDate && !rateCard.expiryDate) return true
  
  const today = new Date()
  const effectiveDate = rateCard.effectiveDate ? new Date(rateCard.effectiveDate) : null
  const expiryDate = rateCard.expiryDate ? new Date(rateCard.expiryDate) : null
  
  if (effectiveDate && today < effectiveDate) return false
  if (expiryDate && today > expiryDate) return false
  
  return true
}

const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return 'UGX 0'
  
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

const formatNumber = (number) => {
  if (!number && number !== 0) return '0'
  
  return new Intl.NumberFormat('en-UG').format(number)
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-UG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  } catch (error) {
    return dateString
  }
}

// Expose computed properties
defineExpose({
  selectedCategory,
  selectedProduct,
  selectedRateCard,
  hasRequiredFields: computed(() => {
    return props.advertTitle && props.platformCategory && props.product && props.rateCardId
  })
})
</script>

<style scoped>
.form-section {
  margin-bottom: 40px;
  padding: 30px;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%);
  border-radius: 14px;
  border: 1px solid #e6e9f4;
  box-shadow: 0 6px 15px rgba(42, 75, 140, 0.08);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.section-title {
  color: #2A4B8C;
  font-size: 1.3em;
  font-weight: 700;
  margin: 0;
  background: linear-gradient(90deg, #2A4B8C 0%, #4A6FDC 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.section-badge {
  background: linear-gradient(135deg, #FF6B6B 0%, #FF8E8E 100%);
  color: white;
  font-size: 0.75em;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 20px;
  letter-spacing: 0.5px;
  box-shadow: 0 2px 4px rgba(255, 107, 107, 0.2);
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
  margin-bottom: 30px;
}

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

.input-wrapper {
  position: relative;
}

.input-wrapper input {
  width: 100%;
  padding: 14px 16px 14px 45px;
  border: 2px solid #e6e9f4;
  border-radius: 10px;
  font-size: 1em;
  transition: all 0.3s ease;
  background-color: #ffffff;
  color: #2D3748;
}

.input-wrapper input:focus {
  outline: none;
  border-color: #4A6FDC;
  box-shadow: 0 0 0 3px rgba(74, 111, 220, 0.15);
  background-color: #ffffff;
}

.input-wrapper input:disabled {
  background-color: #F7F9FC;
  cursor: not-allowed;
  opacity: 0.7;
  border-color: #E2E8F0;
}

.input-wrapper input::placeholder {
  color: #94A3B8;
}

.input-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
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

.category-description,
.product-description {
  display: block;
  margin-top: 8px;
  color: #64748B;
  font-size: 0.9em;
  font-style: italic;
  line-height: 1.4;
}

.product-info {
  font-size: 0.85em;
  color: #7C8DB5;
  margin-left: 5px;
}

.ratecard-info {
  display: block;
  margin-top: 8px;
  color: #4A6FDC;
  font-size: 0.85em;
  font-weight: 500;
}

.expired-label {
  color: #FF6B6B;
  font-weight: 600;
}

.loading-text {
  display: block;
  margin-top: 8px;
  color: #4A6FDC;
  font-size: 0.85em;
  font-weight: 500;
}

.color-select-wrapper {
  position: relative;
}

.color-preview {
  position: absolute;
  right: 45px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 2px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.color-preview.full_color {
  background: linear-gradient(135deg, #4A6FDC 0%, #7C8DB5 100%);
}

.color-preview.black_white {
  background: linear-gradient(135deg, #2D3748 0%, #4A5568 100%);
}

.ratecard-details-summary {
  background: linear-gradient(135deg, #F0F4FF 0%, #E6EDFF 100%);
  padding: 20px;
  border-radius: 12px;
  margin-top: 30px;
  border: 1px solid #D6E4FF;
  box-shadow: 0 4px 6px rgba(74, 111, 220, 0.1);
}

.details-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.details-header h4 {
  margin: 0;
  color: #2A4B8C;
  font-size: 1.1em;
  font-weight: 700;
  display: flex;
  align-items: center;
}

.btn-edit-details {
  background: linear-gradient(135deg, #4A6FDC 0%, #2A4B8C 100%);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 0.9em;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
}

.btn-edit-details:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(74, 111, 220, 0.3);
}

.btn-edit-details:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

.details-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 15px;
  font-size: 0.95em;
  padding: 10px;
  background: white;
  border-radius: 8px;
  border: 1px solid #E2E8F0;
}

.detail-item span {
  color: #64748B;
  font-weight: 500;
  min-width: 100px;
}

.detail-item strong {
  color: #2A4B8C;
  font-weight: 700;
}

.detail-info {
  color: #7C8DB5;
  font-size: 0.85em;
  margin-left: 10px;
}

.detail-value {
  display: flex;
  align-items: center;
  gap: 8px;
}

@media (max-width: 768px) {
  .form-section {
    padding: 20px;
  }
  
  .form-row {
    grid-template-columns: 1fr;
    gap: 25px;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .section-badge {
    align-self: flex-start;
  }
  
  .ratecard-details-summary {
    padding: 15px;
  }
  
  .detail-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .detail-item span {
    min-width: auto;
  }
}
</style>