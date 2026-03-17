<!-- components/clerk/AdvertInformation.vue -->
<template>
  <div class="form-section">
    <div class="section-header">
      <div class="section-icon">📢</div>
      <h3 class="section-title">Advert Information</h3>
    </div>
    <p class="section-description">Select the platform and details for your advert</p>

    <!-- First Row: Advert Title and Office Location (60-40 split) -->
    <div class="form-row split-60-40">
      <!-- Advert Title - 60% width -->
      <div class="form-group">
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

      <!-- Office Location - 40% width -->
      <div class="form-group">
        <div class="form-label">
          <label>Office Location</label>
          <span class="required">*</span>
        </div>
        <div class="input-container">
          <span class="input-icon">📍</span>
          <select 
            :value="officeLocation"
            required
            :disabled="disabled || officeLocationsLoading"
            @change="selectOfficeLocation($event.target.value)"
            class="form-select"
          >
            <option value="">Select location</option>
            <option 
              v-for="location in officeLocations" 
              :key="location.code" 
              :value="location.code"
            >
              {{ location.office }}
            </option>
          </select>
          <span v-if="officeLocationsLoading" class="select-spinner">↻</span>
        </div>
        <div v-if="officeLocationsError" class="input-error">{{ officeLocationsError }}</div>
      </div>
    </div>

    <!-- Second Row: Platform Category, Product, and Color/Type Toggle -->
    <div class="form-row three-columns">
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

      <!-- Color/Type Toggle -->
      <div class="form-group">
        <div class="form-label">
          <label>Color/Type</label>
          <span class="required">*</span>
        </div>
        <div class="color-toggle-container">
          <button 
            type="button"
            class="color-toggle-btn"
            :class="{ active: adType === 'full_color' }"
            :disabled="disabled"
            @click="updateAdType('full_color')"
          >
            <span class="color-indicator full-color"></span>
            <span class="toggle-text">Full Color</span>
          </button>
          <button 
            type="button"
            class="color-toggle-btn"
            :class="{ active: adType === 'black_white' }"
            :disabled="disabled"
            @click="updateAdType('black_white')"
          >
            <span class="color-indicator bw"></span>
            <span class="toggle-text">B&W</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Third Row: Rate Card, Ad Size, and Publish on Web Toggle -->
    <div class="form-row three-columns">
      <!-- Rate Card (depends on ad type) -->
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
              <span class="web-icon">🌐</span> Web
            </span>
            <span v-else class="no-web-hint">No web</span>
          </div>
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
  publishOnWeb: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  // Categories and Products
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
  // Loading states
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
  },
  // Office locations from store
  officeLocations: {
    type: Array,
    default: () => []
  },
  officeLocationsLoading: {
    type: Boolean,
    default: false
  },
  officeLocationsError: {
    type: String,
    default: ''
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
  'update:publishOnWeb',
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

// Helper function to get rate card display name (depends on adType)
const getRateCardDisplayName = (rateCard) => {
  let displayName = ''
  
  // Get the appropriate price based on selected ad type
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

  // Auto-populate Ad Size with the rate card display name
  const selectedRateCard = props.rateCards.find(rc => String(rc.id) === String(value))
  const displayName = selectedRateCard ? getRateCardDisplayName(selectedRateCard) : ''
  emit('update:adSize', displayName)
}

const updateAdSize = (value) => {
  emit('update:adSize', value)
}

// Update ad type and notify parent
const updateAdType = (value) => {
  if (value !== props.adType) {
    emit('update:adType', value)
    emit('adtype-change', value)
  }
}

// Select office location
const selectOfficeLocation = (locationCode) => {
  emit('update:officeLocation', locationCode)
  emit('office-location-selected', locationCode)
}

const editDetails = () => {
  emit('edit-ratecard-details')
}

// Toggle publish on web
const togglePublishOnWeb = () => {
  if (!props.disabled) {
    const newValue = !props.publishOnWeb
    emit('update:publishOnWeb', newValue)
  }
}
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

.form-row { display: grid; border-bottom: 1px solid var(--border-lt); }
.form-row.split-60-40 { grid-template-columns: 3fr 2fr; }
.form-row.three-columns { grid-template-columns: repeat(3, 1fr); }

.form-group {
  padding: 14px 20px; border-right: 1px solid var(--border-lt); background: var(--surface);
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
.input-icon { position: absolute; left: 10px; z-index: 1; pointer-events: none; opacity: .5; font-size: .9em; }

.form-input, .form-select {
  width: 100%; height: 38px; padding: 0 12px 0 32px;
  border: 1.5px solid var(--border); border-radius: var(--radius);
  font-family: var(--font); font-size: 13px; color: var(--text-1);
  background: var(--surface); outline: none; box-sizing: border-box;
  transition: border-color var(--t), box-shadow var(--t);
}
.form-input:focus, .form-select:focus { border-color: var(--blue); box-shadow: var(--ring); }
.form-input:disabled, .form-select:disabled { background: var(--page-bg); color: var(--text-4); cursor: not-allowed; }
.form-input::placeholder { color: var(--text-4); }

.form-select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat; background-position: right 10px center; padding-right: 32px;
}
.select-spinner { position: absolute; right: 10px; animation: spin 1s linear infinite; color: var(--blue); font-size: 12px; }
@keyframes spin { to { transform: rotate(360deg); } }

.input-hint { font-size: 11px; color: var(--text-4); margin-top: 4px; font-style: italic; }
.input-error { font-size: 11px; color: var(--red-text); margin-top: 4px; }

/* Color / Type Toggle */
.color-toggle-container {
  display: flex; gap: 8px; height: 38px;
}
.color-toggle-btn {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 7px;
  border: 1.5px solid var(--border); border-radius: var(--radius);
  background: var(--surface); color: var(--text-3);
  font-family: var(--font); font-size: 12px; font-weight: 600;
  cursor: pointer; transition: all var(--t); white-space: nowrap;
}
.color-toggle-btn:hover:not(:disabled) { border-color: var(--blue); color: var(--blue); background: var(--blue-lt); }
.color-toggle-btn.active { border-color: var(--blue); background: var(--blue-lt); color: var(--blue); box-shadow: var(--ring); }
.color-toggle-btn:disabled { opacity: .45; cursor: not-allowed; }
.color-indicator { width: 14px; height: 14px; border-radius: var(--radius); flex-shrink: 0; }
.color-indicator.full-color { background: linear-gradient(135deg,#E31E24,#0066CC,#FFC000); }
.color-indicator.bw { background: linear-gradient(135deg,#1e293b,#94a3b8); }
.toggle-text { white-space: nowrap; }

/* Publish toggle */
.toggle-container { display: flex; flex-direction: column; gap: 4px; }
.toggle-wrapper { display: flex; align-items: center; gap: 10px; }
.toggle-btn {
  position: relative; width: 48px; height: 26px;
  background: var(--border); border: 1.5px solid var(--border);
  border-radius: 13px; cursor: pointer;
  transition: background var(--t), border-color var(--t);
  padding: 0; overflow: hidden; flex-shrink: 0;
}
.toggle-btn.active { background: #16a34a; border-color: #15803d; }
.toggle-btn:disabled { opacity: .45; cursor: not-allowed; }
.toggle-slider { position: relative; display: block; width: 100%; height: 100%; }
.toggle-knob {
  position: absolute; top: 2px; left: 2px;
  width: 18px; height: 18px; background: #fff; border-radius: 50%;
  box-shadow: 0 1px 3px rgba(0,0,0,.2);
  transition: transform .2s ease;
}
.toggle-btn.active .toggle-knob { transform: translateX(22px); }
.toggle-label { font-size: 13px; font-weight: 600; color: var(--text-1); min-width: 28px; }
.toggle-hint { font-size: 11px; }
.web-badge {
  display: inline-flex; align-items: center; gap: 4px; height: 20px; padding: 0 8px;
  background: var(--navy); color: #fff; font-size: 10px; font-weight: 700;
  border-radius: 1px; letter-spacing: .03em;
}
.web-icon { font-size: .9em; }
.no-web-hint { color: var(--text-4); font-style: italic; font-size: 11px; }

.edit-details-btn {
  display: inline-flex; align-items: center; gap: 5px;
  height: 28px; padding: 0 10px; margin-top: 8px;
  background: var(--amber-bg); color: var(--amber-text);
  border: 1px solid var(--amber-bd); border-radius: var(--radius);
  font-family: var(--font); font-size: 12px; font-weight: 600;
  cursor: pointer; transition: all var(--t);
}
.edit-details-btn:hover:not(:disabled) { background: var(--amber-bd); }
.edit-details-btn:disabled { opacity: .45; cursor: not-allowed; }

@media (max-width: 1024px) {
  .form-row.three-columns { grid-template-columns: repeat(2, 1fr); }
  .form-row.three-columns .form-group:last-child { grid-column: span 2; border-right: none; }
}
@media (max-width: 768px) {
  .form-row.split-60-40, .form-row.three-columns { grid-template-columns: 1fr; }
  .form-group { border-right: none; border-bottom: 1px solid var(--border-lt); }
  .color-toggle-container { height: auto; }
  .color-toggle-btn { padding: 8px; }
  .toggle-wrapper { flex-direction: column; align-items: flex-start; }
}

</style>