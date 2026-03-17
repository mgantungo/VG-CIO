<!-- components/clerk/AdvertInformation.vue -->
<template>
  <div class="form-section">
    <div class="section-header">
      <div class="section-icon">📢</div>
      <h3 class="section-title">Advert Information</h3>
    </div>
    <p class="section-description">Select the platform and details for your advert</p>

    <div class="form-grid">
      <!-- Advert Title -->
      <div class="form-group full-width">
        <div class="form-label">
          <label>Advert Title</label>
          <span class="required">*</span>
        </div>
        <div class="input-container">
          <span class="input-icon">📝</span>
          <input 
            :value="advertTitle"
            type="text" 
            placeholder="e.g., New Year Promotion, Job Vacancy, Product Launch"
            required
            :disabled="disabled"
            @input="updateAdvertTitle($event.target.value)"
            class="form-input"
          >
        </div>
        <div class="input-hint">
          A clear, descriptive title for your advert
        </div>
      </div>
    </div>

    <div class="form-grid">
      <!-- Platform Category -->
      <div class="form-group">
        <div class="form-label">
          <label>Platform Category</label>
          <span class="required">*</span>
        </div>
        <div class="input-container">
          <span class="input-icon">📱</span>
          <select 
            :value="platformCategory"
            required
            :disabled="disabled || categoriesLoading"
            @change="handleCategoryChange($event.target.value)"
            class="form-select"
          >
            <option value="">Select category</option>
            <option 
              v-for="category in categories" 
              :key="category.id" 
              :value="category.category_type"
            >
              {{ category.category_type_display || category.category_type }}
            </option>
          </select>
          <span v-if="categoriesLoading" class="select-spinner">↻</span>
        </div>
        <div v-if="categoriesError" class="input-error">{{ categoriesError }}</div>
      </div>

      <!-- Product -->
      <div class="form-group">
        <div class="form-label">
          <label>Product</label>
          <span class="required">*</span>
        </div>
        <div class="input-container">
          <span class="input-icon">📰</span>
          <select 
            :value="product"
            required
            :disabled="!platformCategory || disabled || productsLoading"
            @change="handleProductChange($event.target.value)"
            class="form-select"
          >
            <option value="">Select product</option>
            <option 
              v-for="product in filteredProducts" 
              :key="product.id" 
              :value="product.id"
            >
              {{ product.name }}
            </option>
          </select>
          <span v-if="productsLoading" class="select-spinner">↻</span>
        </div>
      </div>
    </div>

    <!-- Second Row: Rate Card, Ad Size, Ad Type, and Publish on Web Toggle -->
    <div class="form-grid four-columns">
      <!-- Rate Card -->
      <div class="form-group">
        <div class="form-label">
          <label>Rate Card</label>
          <span class="required">*</span>
        </div>
        <div class="input-container">
          <span class="input-icon">💰</span>
          <select 
            :value="rateCardId"
            required
            :disabled="!product || disabled || rateCardsLoading"
            @change="handleRateCardChange($event.target.value)"
            class="form-select"
          >
            <option value="">Select rate card</option>
            <option 
              v-for="rateCard in rateCards" 
              :key="rateCard.id" 
              :value="rateCard.id"
            >
              {{ getRateCardDisplayName(rateCard) }}
            </option>
          </select>
          <span v-if="rateCardsLoading" class="select-spinner">↻</span>
        </div>
        <button 
          v-if="rateCardDetails && rateCardId"
          type="button"
          class="edit-details-btn"
          @click="editDetails"
          :disabled="disabled"
        >
          <span>✎</span> Edit Details
        </button>
      </div>

      <!-- Ad Size (Free text input) -->
      <div class="form-group">
        <div class="form-label">
          <label>Ad Size</label>
          <span class="optional">(Optional)</span>
        </div>
        <div class="input-container">
          <span class="input-icon">📏</span>
          <input 
            :value="adSize"
            type="text" 
            placeholder="e.g., Full Page, 10cm x 3col"
            :disabled="disabled"
            @input="updateAdSize($event.target.value)"
            class="form-input"
          >
        </div>
        <div class="input-hint">
          Specify dimensions or size
        </div>
      </div>

      <!-- Ad Type (Color/B&W) -->
      <div class="form-group">
        <div class="form-label">
          <label>Color/Type</label>
          <span class="required">*</span>
        </div>
        <div class="ad-type-selector">
          <button 
            type="button"
            class="ad-type-btn"
            :class="{ active: adType === 'full_color' }"
            :disabled="disabled"
            @click="updateAdType('full_color')"
          >
            <span class="color-indicator full-color"></span>
            <span>Full Color</span>
          </button>
          <button 
            type="button"
            class="ad-type-btn"
            :class="{ active: adType === 'black_white' }"
            :disabled="disabled"
            @click="updateAdType('black_white')"
          >
            <span class="color-indicator bw"></span>
            <span>Black & White</span>
          </button>
        </div>
      </div>

      <!-- Publish on Web Toggle -->
      <div class="form-group">
        <div class="form-label">
          <label>Publish on Web</label>
          <span class="optional">(Optional)</span>
        </div>
        <div class="toggle-container">
          <div class="toggle-wrapper" :class="{ 'disabled': disabled }">
            <button 
              type="button"
              class="toggle-btn"
              :class="{ 'active': publishOnWeb }"
              :disabled="disabled"
              @click="togglePublishOnWeb"
            >
              <span class="toggle-slider">
                <span class="toggle-knob"></span>
              </span>
            </button>
            <span class="toggle-label">{{ publishOnWeb ? 'Yes' : 'No' }}</span>
          </div>
          <div class="toggle-hint">
            <span v-if="publishOnWeb" class="web-badge">
              <span class="web-icon">🌐</span> Will be published on website
            </span>
            <span v-else class="no-web-hint">No web publication</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Office Location (New Row) -->
    <div class="form-grid">
      <div class="form-group full-width">
        <div class="form-label">
          <label>Office Location</label>
          <span class="required">*</span>
        </div>
        <div class="office-location-selector">
          <button 
            type="button"
            class="location-btn"
            :class="{ active: officeLocation === 'kampala' }"
            :disabled="disabled"
            @click="selectOfficeLocation('kampala')"
          >
            <span class="location-icon">🏙️</span>
            <span class="location-name">Kampala</span>
          </button>
          <button 
            type="button"
            class="location-btn"
            :class="{ active: officeLocation === 'masaka' }"
            :disabled="disabled"
            @click="selectOfficeLocation('masaka')"
          >
            <span class="location-icon">🏞️</span>
            <span class="location-name">Masaka</span>
          </button>
          <button 
            type="button"
            class="location-btn"
            :class="{ active: officeLocation === 'mbarara' }"
            :disabled="disabled"
            @click="selectOfficeLocation('mbarara')"
          >
            <span class="location-icon">⛰️</span>
            <span class="location-name">Mbarara</span>
          </button>
          <button 
            type="button"
            class="location-btn"
            :class="{ active: officeLocation === 'jinja' }"
            :disabled="disabled"
            @click="selectOfficeLocation('jinja')"
          >
            <span class="location-icon">🌊</span>
            <span class="location-name">Jinja</span>
          </button>
          <button 
            type="button"
            class="location-btn"
            :class="{ active: officeLocation === 'gulu' }"
            :disabled="disabled"
            @click="selectOfficeLocation('gulu')"
          >
            <span class="location-icon">🌳</span>
            <span class="location-name">Gulu</span>
          </button>
          <button 
            type="button"
            class="location-btn"
            :class="{ active: officeLocation === 'mbale' }"
            :disabled="disabled"
            @click="selectOfficeLocation('mbale')"
          >
            <span class="location-icon">🏔️</span>
            <span class="location-name">Mbale</span>
          </button>
        </div>
        <div v-if="!officeLocation && !disabled" class="input-hint">
          Select the office location for this booking
        </div>
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
  officeLocation: {
    type: String,
    default: ''
  },
  publishOnWeb: {  // NEW PROP
    type: Boolean,
    default: false
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
  'update:officeLocation',
  'update:publishOnWeb',  // NEW EMIT
  'category-change',
  'product-change',
  'ratecard-change',
  'adtype-change',
  'edit-ratecard-details',
  'office-location-selected'
])

// Filter products based on selected category
const filteredProducts = computed(() => {
  if (!props.platformCategory) return []
  return props.products.filter(product => 
    product.categoryType === props.platformCategory
  )
})

// Helper function to get rate card display name
const getRateCardDisplayName = (rateCard) => {
  let displayName = ''
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

// Format currency helper
const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return 'UGX 0'
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

// Handlers
const updateAdvertTitle = (value) => {
  emit('update:advertTitle', value)
}

const handleCategoryChange = (value) => {
  emit('update:platformCategory', value)
  emit('category-change', value)
}

const handleProductChange = (value) => {
  emit('update:product', value)
  emit('product-change', value)
}

const handleRateCardChange = (value) => {
  emit('update:rateCardId', value)
  emit('ratecard-change', value)
}

const updateAdSize = (value) => {
  emit('update:adSize', value)
}

const updateAdType = (value) => {
  if (value !== props.adType) {
    emit('update:adType', value)
    emit('adtype-change', value)
  }
}

const selectOfficeLocation = (location) => {
  emit('update:officeLocation', location)
  emit('office-location-selected', location)
}

const editDetails = () => {
  emit('edit-ratecard-details')
}

// NEW HANDLER for publish on web toggle
const togglePublishOnWeb = () => {
  if (!props.disabled) {
    const newValue = !props.publishOnWeb
    emit('update:publishOnWeb', newValue)
  }
}
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

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
  margin-bottom: 30px;
}

/* Four-column layout for rate card, ad size, ad type, and publish toggle */
.form-grid.four-columns {
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.form-group {
  margin-bottom: 10px;
}

.form-group.full-width {
  grid-column: 1 / -1;
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

.input-icon {
  position: absolute;
  left: 16px;
  font-size: 1.1em;
  color: #0066cc;
  z-index: 1;
  pointer-events: none;
}

.form-input,
.form-select {
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

.form-select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%234A6FDC' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 16px center;
  background-size: 16px;
  padding-right: 48px;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: #0066cc;
  box-shadow: 0 0 0 4px rgba(0, 102, 204, 0.15);
  background: linear-gradient(0deg, #ffffff 0%, #f0f7ff 100%);
}

.form-input:disabled,
.form-select:disabled {
  background-color: #f7fafc;
  border-color: #cbd5e0;
  color: #a0aec0;
  cursor: not-allowed;
}

.form-input::placeholder {
  color: #a0aec0;
  font-weight: 400;
}

.select-spinner {
  position: absolute;
  right: 16px;
  animation: spin 1s linear infinite;
  color: #0066cc;
  font-size: 14px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.input-hint {
  font-size: 0.85em;
  color: #718096;
  margin-top: 6px;
  padding-left: 4px;
}

.input-error {
  font-size: 0.85em;
  color: #e31e24;
  margin-top: 6px;
  padding-left: 4px;
}

/* Ad Type Selector */
.ad-type-selector {
  display: flex;
  gap: 10px;
}

.ad-type-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  background: white;
  color: #4a5568;
  font-weight: 600;
  font-size: 0.95em;
  cursor: pointer;
  transition: all 0.3s;
}

.ad-type-btn:hover:not(:disabled) {
  border-color: #0066cc;
  background: #f0f7ff;
}

.ad-type-btn.active {
  border-color: #0066cc;
  background: linear-gradient(135deg, #f0f7ff 0%, #e6f0ff 100%);
  color: #0066cc;
  box-shadow: 0 2px 8px rgba(0, 102, 204, 0.15);
}

.ad-type-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.color-indicator {
  width: 20px;
  height: 20px;
  border-radius: 4px;
}

.color-indicator.full-color {
  background: linear-gradient(135deg, #FF6B6B, #4A90E2, #F9CB28);
}

.color-indicator.bw {
  background: linear-gradient(135deg, #333333, #666666);
}

/* Office Location Selector */
.office-location-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.location-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border: 2px solid #e2e8f0;
  border-radius: 30px;
  background: white;
  color: #4a5568;
  font-weight: 600;
  font-size: 0.95em;
  cursor: pointer;
  transition: all 0.3s;
  min-width: 110px;
}

.location-btn:hover:not(:disabled) {
  border-color: #0066cc;
  background: #f0f7ff;
  transform: translateY(-2px);
}

.location-btn.active {
  border-color: #0066cc;
  background: linear-gradient(135deg, #0066cc 0%, #0052a3 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(0, 102, 204, 0.3);
}

.location-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.location-icon {
  font-size: 1.2em;
}

.location-name {
  font-weight: 600;
}

/* Toggle Switch Styles */
.toggle-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.toggle-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toggle-btn {
  position: relative;
  width: 60px;
  height: 30px;
  background: #e2e8f0;
  border: 2px solid #cbd5e0;
  border-radius: 30px;
  cursor: pointer;
  transition: all 0.3s;
  padding: 0;
  overflow: hidden;
}

.toggle-btn.active {
  background: linear-gradient(135deg, #10B981 0%, #34D399 100%);
  border-color: #059669;
}

.toggle-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.toggle-slider {
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
}

.toggle-knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 22px;
  height: 22px;
  background: white;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: transform 0.3s ease;
}

.toggle-btn.active .toggle-knob {
  transform: translateX(30px);
}

.toggle-label {
  font-weight: 600;
  color: #2d3748;
  min-width: 40px;
}

.toggle-hint {
  font-size: 0.85em;
}

.web-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
  color: white;
  border-radius: 20px;
  font-weight: 500;
}

.web-icon {
  font-size: 1.1em;
}

.no-web-hint {
  color: #94a3b8;
  font-style: italic;
}

.edit-details-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  padding: 6px 12px;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.85em;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.edit-details-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

.edit-details-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Responsive Styles */
@media (max-width: 1200px) {
  .form-grid.four-columns {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .form-section {
    padding: 20px;
  }
  
  .form-grid,
  .form-grid.four-columns {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .section-description {
    padding-left: 0;
  }
  
  .section-icon {
    width: 40px;
    height: 40px;
    font-size: 1.5em;
  }
  
  .form-input,
  .form-select {
    padding: 12px 16px 12px 44px;
  }
  
  .office-location-selector {
    flex-direction: column;
  }
  
  .location-btn {
    width: 100%;
    justify-content: center;
  }
  
  .ad-type-selector {
    flex-direction: column;
  }
}

@media (max-width: 480px) {
  .form-section {
    padding: 16px;
    border-radius: 12px;
  }
  
  .section-title {
    font-size: 1.2em;
  }
  
  .toggle-wrapper {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .toggle-label {
    min-width: auto;
  }
}
</style>