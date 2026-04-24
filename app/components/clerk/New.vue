<!--components/clerk/New.vue-->
<template>
  <div class="booking-page">
    <div class="page-header">
      <div class="header-content">
        <div>
          <h1>Book New Advert</h1>
          <p>Create a new advertising booking across Vision Group platforms</p>
        </div>
        <div class="header-actions">
          <button 
            type="button" 
            class="btn btn-secondary"
            @click="saveDraft"
            :disabled="submitting || categoriesLoading"
          >
            <span v-if="savingDraft">Saving...</span>
            <span v-else>Save Advert</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Error message display -->
    <div v-if="categoriesError" class="error-message">
      <strong>Error loading categories:</strong> {{ categoriesError }}
      <button @click="retryLoadCategories" class="btn-retry">Retry</button>
    </div>

    <div class="content-card">
      <div class="card-header">
        <h2>Client & Advert Information</h2>
        <div v-if="loading" class="loading-indicator">
          <span class="spinner"></span> Loading...
        </div>
      </div>

      <form @submit.prevent="submitAdvert">
        <!-- Client Information -->
        <ClientInformation
          v-model:client-name="form.clientName"
          v-model:client-id="form.clientId" 
          v-model:contact-person="form.contactPerson"
          v-model:email="form.email"
          v-model:phone="form.phone"
          v-model:reference-document="form.referenceDocument"
          v-model:market-sector="form.marketSector"
          :disabled="submitting || categoriesLoading"
          @changed="handleClientInfoChange"
        />

        <!-- Advert Information - WITH OFFICE LOCATIONS FROM STORE -->
        <AdvertInformation
          v-model:advert-title="form.advertTitle"
          v-model:platform-category="form.platformCategory"
          v-model:product="form.product"
          v-model:rate-card-id="form.rateCardId"
          v-model:ad-size="form.adSize"
          v-model:ad-type="form.adType"
          v-model:office-location="form.officeLocation"
          v-model:publish-on-web="form.publishOnWeb"
          :disabled="submitting || categoriesLoading"
          :categories="categories"
          :products="products"
          :rate-cards="rateCards"
          :rate-card-details="rateCardDetails"
          :categories-loading="categoriesLoading"
          :products-loading="productsLoading"
          :rate-cards-loading="rateCardsLoading"
          :price-loading="priceLoading"
          :office-locations="officeLocations"
          :office-locations-loading="officeLocationsLoading"
          @category-change="loadProductsForCategory"
          @product-change="handleProductSelected"
          @ratecard-change="handleRateCardSelected"
          @adtype-change="handleAdTypeChange"
          @edit-ratecard-details="editRateCardDetails"
          @office-location-selected="handleOfficeLocationSelected"
        />

        <!-- Schedule & Pricing -->
        <SchedulePricing
          ref="schedulePricingRef"
          v-model:start-date="form.startDate"
          v-model:end-date="form.endDate"
          v-model:frequency="form.frequency"
          v-model:payment-method="form.paymentMethod"
          v-model:discount="form.discount"
          v-model:dates-list="form.datesList"
          :disabled="submitting || categoriesLoading"
          :rate-card-id="form.rateCardId"
          :price-calculation="priceCalculation"
          :price-loading="priceLoading"
          :min-date="today"
          :rate-card-details="rateCardDetails"
          :currency="selectedCurrency"
          :platform-category="form.platformCategory"
          @frequency-change="handleFrequencyChange"
          @frequency-adjust="handleFrequencyAdjust"
          @discount-change="handleDiscountChange"
          @dates-updated="handleDatesUpdated"
        />

        <!-- Sales Agent Assignment -->
        <SalesAgentSelection
          v-model="form.salesAgentId"
          :disabled="submitting || categoriesLoading"
          @agent-selected="handleAgentSelected"
        />

        <!-- Special Instructions & Files -->
        <AdditionalInformation
          v-model="form.specialInstructions"
          :disabled="submitting || categoriesLoading"
          :dates-string="middleDatesString"
        >
          <template #file-upload>
            <FileUpload 
              @files-updated="handleFilesUpdate"
              :disabled="submitting || categoriesLoading"
            />
          </template>
        </AdditionalInformation>

        <!-- Form Actions -->
        <div class="form-actions">
          <button 
            type="button" 
            class="btn btn-secondary" 
            @click="saveDraft"
            :disabled="submitting || categoriesLoading || savingDraft || !hasRequiredClientInfo"
          >
            <span v-if="savingDraft">Saving...</span>
            <span v-else>Save Advert</span>
          </button>
          <!----
          <button 
            type="submit" 
            class="btn btn-primary" 
            :disabled="!isFormValid || submitting || categoriesLoading"
          >
            <span v-if="submitting">Submitting...</span>
            <span v-else>Submit for Review</span>
          </button>
          -->
        </div>
      </form>
    </div>
    
    <!-- Rate Card Details Modal -->
    <RateCardDetailsModal
      :show-modal="showRateCardModal"
      :selected-rate-card="selectedRateCard"
      :frequency="form.frequency"
      :ad-type="form.adType"
      @close="handleModalClose"
      @save="handleModalSave"
    />

    <!-- Full Page Mask -->
    <FullPageMask
      :visible="maskVisible"
      :type="maskType"
      :title="maskTitle"
      :message="maskMessage"
      :details="maskDetails"
      :auto-close="maskAutoClose"
      @close="closeMask"
    />
  </div>
</template>

<script setup>
// Import components
import FileUpload from './FileUpload.vue'
import RateCardDetailsModal from './RateCardDetailsModal.vue'

// Import form section components
import ClientInformation from './ClientInformation.vue'
import AdvertInformation from './AdvertInformation.vue'
import SchedulePricing from './SchedulePricing.vue'
import AdditionalInformation from './AdditionalInformation.vue'
import SalesAgentSelection from './SalesAgentSelection.vue'
import FullPageMask from './FullPageMask.vue'
// Import composables and stores
import { useProducts } from '~/composables/useProducts'
import { useAdverts} from '~/composables/useAdverts'
import { useOfficeLocationsStore } from '~/stores/officeLocation'
import { ref, reactive, computed, onMounted, watch, onUnmounted } from 'vue'
import { useRouter } from '#imports'
import { storeToRefs } from 'pinia'


const router = useRouter()

// Use the composables
const { 
  categories,
  products,
  rateCards,
  loadCategories,
  loadProductsByCategoryId,
  loadAllProducts,
  loadRateCards,
  calculatePrice: calculatePriceApi,
  getProductById
} = useProducts()

const { createAdvert, getBcSyncStatus } = useAdverts()

// Use office locations store
const officeLocationsStore = useOfficeLocationsStore()
const { locations: officeLocations, loading: officeLocationsLoading } = storeToRefs(officeLocationsStore)

// Today's date for date validation
const today = ref(new Date().toISOString().split('T')[0])

// Ref to SchedulePricing component to access its exposed methods
const schedulePricingRef = ref(null)

// Form state
const form = reactive({
  clientName: '',
  contactPerson: '',
  email: '',
  phone: '',
  referenceDocument: '',
  clientId: '', 
  marketSector: '', 
  advertTitle: '',
  platformCategory: '',
  product: '',
  rateCardId: '',
  adSize: '',
  adType: 'full_color',
  publishOnWeb: false,
  officeLocation: '',
  startDate: '',
  endDate: '',
  frequency: 1,
  paymentMethod: '',
  discount: 0,
  specialInstructions: '',
  files: [],
  datesList: [],
  salesAgentId: ''
})

// Loading states
const categoriesLoading = ref(false)
const categoriesError = ref(null)
const productsLoading = ref(false)
const rateCardsLoading = ref(false)
const priceLoading = ref(false)
const submitting = ref(false)
const savingDraft = ref(false)

// Modal state
const showRateCardModal = ref(false)
const rateCardDetails = ref(null)

// Data
const priceCalculation = ref(null)
const selectedCurrency = ref('UGX')

// Check if platform is print media
const isPrintMedia = computed(() => {
  return form.platformCategory === 'print'
})

// Add a new ref for polling
let pollingInterval = null

// Mask state
const maskVisible = ref(false)
const maskType = ref('info') // 'success', 'error', 'loading'
const maskTitle = ref('')
const maskMessage = ref('')
const maskDetails = ref('')
const maskAutoClose = ref(3000) // 3 seconds auto close for success

// Mask methods
const showMask = ({ type, title, message, details, autoClose = 3000 }) => {
  maskType.value = type
  maskTitle.value = title
  maskMessage.value = message
  maskDetails.value = details || ''
  maskAutoClose.value = autoClose
  maskVisible.value = true
}

const closeMask = () => {
  maskVisible.value = false
  // Reset after animation
  setTimeout(() => {
    if (!maskVisible.value) {
      maskType.value = 'info'
      maskTitle.value = ''
      maskMessage.value = ''
      maskDetails.value = ''
    }
  }, 300)
}




// Watch platform category changes and lock frequency to 1 for print media
watch(() => form.platformCategory, (newCategory) => {
  console.log('[WATCH-CATEGORY] Platform category changed:', newCategory)
  if (newCategory === 'print') {
    console.log('[WATCH-CATEGORY] Print media detected, setting frequency to 1')
    form.frequency = 1
  }
})

// Publishing dates are stored in the publishing_dates field — no longer embedded in special_instructions

// Build the publishing_dates JSON: all selected dates + startDate + endDate, deduped, sorted asc
const buildPublishingDates = () => {
  const datesSet = new Set([
    ...(form.datesList || []),
    ...(form.startDate ? [form.startDate] : []),
    ...(form.endDate   ? [form.endDate]   : [])
  ].filter(Boolean))
  return [...datesSet].sort()
}

// Computed properties
const activeCategories = computed(() => {
  return categories.value.filter(category => category.is_active !== false)
})

const selectedCategory = computed(() => {
  if (!form.platformCategory) return null
  return categories.value.find(c => c.category_type === form.platformCategory)
})

const filteredProducts = computed(() => {
  if (!form.platformCategory) return []
  return products.value.filter(product => 
    product.categoryType === form.platformCategory && 
    product.is_active !== false
  )
})

const selectedProduct = computed(() => {
  if (!form.product) return null
  return products.value.find(p => p.id === form.product)
})

const availableRateCards = computed(() => {
  if (!form.product) return []
  return rateCards.value.filter(rateCard => {
    return isRateCardActive(rateCard)
  })
})

const selectedRateCard = computed(() => {
  if (!form.rateCardId) return null
  return rateCards.value.find(rc => rc.id == form.rateCardId)
})

const hasRequiredClientInfo = computed(() => {
  return form.clientName && form.email && form.phone && form.advertTitle && form.officeLocation && form.marketSector 
})

const isFormValid = computed(() => {
  return (
    hasRequiredClientInfo.value &&
    form.platformCategory &&
    form.product &&
    form.rateCardId &&
    form.datesList.length > 0 &&
    form.paymentMethod &&
    schedulePricingRef.value?.calculateFinalTotal() > 0
  )
})

const loading = computed(() => {
  return categoriesLoading.value || productsLoading.value || 
         rateCardsLoading.value || priceLoading.value || officeLocationsLoading.value
})

// Lifecycle
onMounted(async () => {
  console.log('[MOUNTED] Component mounted, initializing form...')
  await initializeForm()
  await loadOfficeLocations()
})

// Methods
const initializeForm = async () => {
  try {
    console.log('[INIT] Starting form initialization...')
    categoriesLoading.value = true
    await loadCategories()
    console.log('[INIT] SUCCESS - Loaded', categories.value.length, 'categories')
    
    // Set default dates
    form.startDate = today.value
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + 7)
    form.endDate = endDate.toISOString().split('T')[0]
    console.log('[INIT] Default dates set:', form.startDate, 'to', form.endDate)
  } catch (error) {
    categoriesError.value = error.message || 'Failed to load categories'
    console.error('[INIT] ERROR - Failed to initialize form:', error)
  } finally {
    categoriesLoading.value = false
  }
}

const loadOfficeLocations = async () => {
  try {
    console.log('[OFFICE] Loading office locations...')
    await officeLocationsStore.fetchOfficeLocations()
    console.log('[OFFICE] SUCCESS - Loaded', officeLocations.value.length, 'locations')
  } catch (error) {
    console.error('[OFFICE] ERROR - Failed to load office locations:', error)
  }
}

const retryLoadCategories = async () => {
  console.log('[RETRY] Retrying category load...')
  categoriesError.value = null
  await initializeForm()
}

const loadProductsForCategory = async () => {
  try {
    console.log('[PRODUCTS] Loading products for category:', form.platformCategory)
    productsLoading.value = true
    // Clear dependent fields
    form.product = ''
    form.rateCardId = ''
    form.adSize = ''
    priceCalculation.value = null
    rateCardDetails.value = null
    console.log('[PRODUCTS] Cleared dependent fields')
    
    // Set frequency to 1 for print media
    if (form.platformCategory === 'print') {
      console.log('[PRODUCTS] Print media detected, locking frequency to 1')
      form.frequency = 1
    }
    
    if (!form.platformCategory) {
      console.log('[PRODUCTS] WARNING - No platform category selected')
      return
    }
    
    const category = categories.value.find(cat => cat.category_type === form.platformCategory)
    if (!category) {
      console.error('[PRODUCTS] ERROR - Category not found:', form.platformCategory)
      return
    }
    
    console.log('[PRODUCTS] Found category ID:', category.id, '- loading products...')
    await loadProductsByCategoryId(category.id)
    console.log('[PRODUCTS] SUCCESS - Loaded', products.value.length, 'products')
    
  } catch (error) {
    console.error('[PRODUCTS] ERROR - Failed to load products:', error)
    alert('Failed to load products. Please try again.')
  } finally {
    productsLoading.value = false
  }
}

const handleProductSelected = async () => {
  try {
    console.log('[PRODUCT-SELECT] Product selected:', form.product)
    rateCardsLoading.value = true
    form.rateCardId = ''
    priceCalculation.value = null
    rateCardDetails.value = null
    console.log('[PRODUCT-SELECT] Cleared rate card and pricing')
    
    await loadRateCards(form.product)
    console.log('[PRODUCT-SELECT] SUCCESS - Loaded', rateCards.value.length, 'rate cards')
    
    if (rateCards.value.length > 0) {
      selectedCurrency.value = rateCards.value[0].currency || 'UGX'
      console.log('[PRODUCT-SELECT] Currency set to:', selectedCurrency.value)
    }
  } catch (error) {
    console.error('[PRODUCT-SELECT] ERROR - Failed to load rate cards:', error)
    alert('Failed to load rate cards. Please try again.')
  } finally {
    rateCardsLoading.value = false
  }
}

const handleRateCardSelected = async () => {
  console.log('[RATECARD-SELECT] ========================================')
  console.log('[RATECARD-SELECT] RATE CARD SELECTION - COMPREHENSIVE DEBUG')
  console.log('[RATECARD-SELECT] ========================================')
  console.log('[RATECARD-SELECT] 1. form.rateCardId:', form.rateCardId)
  console.log('[RATECARD-SELECT] 2. typeof form.rateCardId:', typeof form.rateCardId)
  console.log('[RATECARD-SELECT] 3. form.rateCardId stringified:', JSON.stringify(form.rateCardId))
  console.log('[RATECARD-SELECT] 4. Total rate cards available:', rateCards.value.length)
  
  // Log each rate card for comparison
  console.log('[RATECARD-SELECT] 5. All available rate cards:')
  rateCards.value.forEach((rc, index) => {
    console.log(`   [${index}] ID: ${rc.id} (${typeof rc.id}), ad_type: "${rc.ad_type}", size_dimension: "${rc.size_dimension}"`)
  })
  
  if (!form.rateCardId) {
    console.log('[RATECARD-SELECT] WARNING - No rate card ID, clearing calculations')
    priceCalculation.value = null
    rateCardDetails.value = null
    return
  }
  
  // Try both strict and loose comparison
  console.log('[RATECARD-SELECT] 6. Attempting STRICT comparison (===)...')
  let rateCard = rateCards.value.find(rc => rc.id === form.rateCardId)
  console.log('[RATECARD-SELECT]    Result:', rateCard ? 'FOUND' : 'NOT FOUND')
  
  if (!rateCard) {
    console.log('[RATECARD-SELECT] 7. Attempting LOOSE comparison (==)...')
    rateCard = rateCards.value.find(rc => rc.id == form.rateCardId)
    console.log('[RATECARD-SELECT]    Result:', rateCard ? 'FOUND' : 'NOT FOUND')
  }
  
  if (!rateCard) {
    console.log('[RATECARD-SELECT] 8. Attempting STRING comparison...')
    rateCard = rateCards.value.find(rc => String(rc.id) === String(form.rateCardId))
    console.log('[RATECARD-SELECT]    Result:', rateCard ? 'FOUND' : 'NOT FOUND')
  }
  
  if (!rateCard) {
    console.error('[RATECARD-SELECT] ❌ ERROR - Rate card not found with any comparison method!')
    console.error('[RATECARD-SELECT] Searched for ID:', form.rateCardId, '(type:', typeof form.rateCardId, ')')
    console.error('[RATECARD-SELECT] Available rate card IDs:', rateCards.value.map(rc => `${rc.id} (${typeof rc.id})`))
    alert('Error: Selected rate card not found. Please try selecting again.')
    return
  }
  
  console.log('[RATECARD-SELECT] ✅ SUCCESS - Rate card found!')
  console.log('[RATECARD-SELECT] Rate card details:', {
    id: rateCard.id,
    name: rateCard.name,
    ad_type: rateCard.ad_type,
    size_dimension: rateCard.size_dimension,
    price_fc: rateCard.price_fc,
    price_bw: rateCard.price_bw
  })
  console.log('[RATECARD-SELECT] ========================================')
  
  // Directly call calculatePrice - it will handle modal logic
  await calculatePrice()
}

const handleAdTypeChange = () => {
  console.log('[ADTYPE-CHANGE] Ad type changed to:', form.adType)
  if (form.rateCardId) {
    calculatePrice()
  }
}

const handleFrequencyChange = () => {
  console.log('[FREQUENCY-CHANGE] Frequency change requested')
  // Don't allow frequency changes for print media
  if (form.platformCategory === 'print') {
    console.log('[FREQUENCY-CHANGE] BLOCKED - Print media must have frequency = 1')
    form.frequency = 1
    return
  }
  
  console.log('[FREQUENCY-CHANGE] New frequency:', form.frequency)
  if (form.rateCardId) {
    calculatePrice()
  }
}

const handleDiscountChange = () => {
  console.log('[DISCOUNT-CHANGE] Discount changed to:', form.discount, '%')
  if (form.rateCardId) {
    calculatePrice()
  }
}

const handleFrequencyAdjust = (newFrequency) => {
  console.log('[FREQUENCY-ADJUST] Frequency adjust to:', newFrequency)
  // Don't allow frequency changes for print media
  if (form.platformCategory === 'print') {
    console.log('[FREQUENCY-ADJUST] BLOCKED - Print media must have frequency = 1')
    form.frequency = 1
    return
  }
  
  if (rateCardDetails.value && form.rateCardId === rateCardDetails.value.rateCardId) {
    console.log('[FREQUENCY-ADJUST] Has rate card details, recalculating with details...')
    performPriceCalculationWithDetails(rateCardDetails.value)
  } else if (form.rateCardId) {
    console.log('[FREQUENCY-ADJUST] No details, standard calculation...')
    calculatePrice()
  }
}

const handleDatesUpdated = (datesString) => {
  if (datesString) {
    console.log('[DATES-UPDATE] Middle dates updated:', datesString)
  }
  // Recalculate price when dates change
  if (form.rateCardId) {
    calculatePrice()
  }
}

const handleAgentSelected = (agentId) => {
  console.log('[AGENT-SELECT] Sales agent selected:', agentId)
}

const handleOfficeLocationSelected = (locationCode) => {
  console.log('[OFFICE-LOCATION] Office location selected:', locationCode)
  const location = officeLocations.value.find(loc => loc.code === locationCode)
  if (location) {
    officeLocationsStore.setSelectedLocation(location)
  }
}

const handleClientInfoChange = ({ field, value }) => {
  console.log('[CLIENT-INFO] Client info changed:', field, '=', value)
}

const calculatePrice = async () => {
  console.log('[CALCULATE-PRICE] ===== STARTING PRICE CALCULATION =====')
  console.log('[CALCULATE-PRICE] Current state:', {
    rateCardId: form.rateCardId,
    frequency: form.frequency,
    adType: form.adType,
    hasDetails: !!rateCardDetails.value
  })
  
  if (!form.rateCardId || !form.frequency || !form.adType) {
    console.log('[CALCULATE-PRICE] WARNING - Missing required fields, clearing calculation')
    priceCalculation.value = null
    return
  }
  
  // Find rate card with both strict and loose comparison
  let rateCard = rateCards.value.find(rc => rc.id === form.rateCardId)
  if (!rateCard) {
    console.log('[CALCULATE-PRICE] WARNING - Strict comparison failed, trying loose')
    rateCard = rateCards.value.find(rc => rc.id == form.rateCardId)
  }
  
  if (!rateCard) {
    console.error('[CALCULATE-PRICE] ERROR - Rate card not found!')
    console.log('[CALCULATE-PRICE] Searched for:', form.rateCardId)
    console.log('[CALCULATE-PRICE] Available IDs:', rateCards.value.map(rc => rc.id))
    return
  }
  
  console.log('[CALCULATE-PRICE] Rate card found:', {
    id: rateCard.id,
    ad_type: rateCard.ad_type,
    size_dimension: rateCard.size_dimension
  })
  
  // Check if this rate card requires additional details
  const requiresDetails = rateCard && 
      (rateCard.size_dimension === 'per cm col' || 
       rateCard.size_dimension === 'per_cm_col' ||
       rateCard.size_dimension === 'per column' || 
       rateCard.size_dimension === 'per_column' ||
       rateCard.size_dimension === 'per word' ||
       rateCard.size_dimension === 'per_word' ||
       rateCard.ad_type === 'classified photo/Logo')
  
  console.log('[CALCULATE-PRICE] Checking requirements:', {
    hasRateCard: !!rateCard,
    size_dimension: rateCard?.size_dimension,
    size_dimension_exact: JSON.stringify(rateCard?.size_dimension),
    ad_type: rateCard?.ad_type,  
    ad_type_exact: JSON.stringify(rateCard?.ad_type),
    requiresDetails: requiresDetails
  })
  
  if (requiresDetails) {
    console.log('[CALCULATE-PRICE] REQUIRES-DETAILS - This rate card needs additional input')
    console.log('[CALCULATE-PRICE] Size dimension:', rateCard.size_dimension)
    console.log('[CALCULATE-PRICE] Ad type:', rateCard.ad_type)
    
    // Only calculate if we already have details for this rate card
    if (rateCardDetails.value && rateCardDetails.value.rateCardId === form.rateCardId) {
      console.log('[CALCULATE-PRICE] SUCCESS - Details found for this rate card, calculating with details...')
      await performPriceCalculationWithDetails(rateCardDetails.value)
    } else {
      console.log('[CALCULATE-PRICE] MODAL-TRIGGER - No details yet, showing modal...')
      console.log('[CALCULATE-PRICE] Current rateCardDetails:', rateCardDetails.value)
      // Show modal to collect details
      showRateCardModal.value = true
      console.log('[CALCULATE-PRICE] SUCCESS - Modal should be visible now. showRateCardModal =', showRateCardModal.value)
    }
  } else {
    console.log('[CALCULATE-PRICE] STANDARD - Standard rate card, proceeding with normal calculation...')
    // Regular rate card - calculate immediately
    await performPriceCalculation()
  }
}

const performPriceCalculation = async () => {
  try {
    console.log('[CALC-SIMPLE] Starting simple price calculation...')
    priceLoading.value = true
    
    const params = {
      frequency: parseInt(form.frequency) || 1,
      adType: form.adType
    }
    console.log('[CALC-SIMPLE] Request params:', params)
    
    const data = await calculatePriceApi(
      form.product,
      form.rateCardId,
      params
    )
    
    console.log('[CALC-SIMPLE] Response received:', data)
    priceCalculation.value = data
    selectedCurrency.value = data.currency || 'UGX'
    console.log('[CALC-SIMPLE] SUCCESS - Calculation complete. Total:', selectedCurrency.value, data.total)
  } catch (error) {
    console.error('[CALC-SIMPLE] ERROR - Price calculation failed:', error)
    priceCalculation.value = null
    alert('Failed to calculate price. Please check your selections.')
  } finally {
    priceLoading.value = false
  }
}

const performPriceCalculationWithDetails = async (details) => {
  try {
    console.log('[CALC-DETAILS] Starting price calculation with details...')
    console.log('[CALC-DETAILS] Details object:', details)
    priceLoading.value = true
    
    const requestBody = {
      productId: form.product,
      rateCardId: form.rateCardId,
      frequency: parseInt(form.frequency) || 1,
      adType: form.adType,
      ...details.details
    }
    
    console.log('[CALC-DETAILS] REQUEST - Sending to calculate-price endpoint')
    console.log('[CALC-DETAILS] Endpoint:', `${process.env.NUXT_PUBLIC_API_BASE || 'https://cms-vgad.visiongroup.co.ug/api'}/adverts/calculate-price`)
    console.log('[CALC-DETAILS] Request Body:', JSON.stringify(requestBody, null, 2))
    
    const response = await $fetch(`${process.env.NUXT_PUBLIC_API_BASE || 'https://cms-vgad.visiongroup.co.ug/api'}/adverts/calculate-price`, {
      method: 'POST',
      body: requestBody
    })
    
    console.log('[CALC-DETAILS] RESPONSE - Received from calculate-price endpoint')
    console.log('[CALC-DETAILS] Response data:', JSON.stringify(response, null, 2))
    
    priceCalculation.value = {
      basePrice: response.basePrice,
      subtotal: response.subtotal,
      total: response.total,
      surcharge: response.surcharge || 0,
      surchargePercentage: response.surchargePercentage || 0,
      currency: response.currency || 'UGX',
      frequency: response.frequency || form.frequency,
      rateCardId: details.rateCardId,
      sizeDimension: details.sizeDimension,
      rateCardAdType: details.adType,
      rateCardDetails: details.details,
      modalEstimate: details.calculatedPrice
    }
    
    console.log('[CALC-DETAILS] Stored priceCalculation:', priceCalculation.value)
    selectedCurrency.value = response.currency || 'UGX'
    console.log('[CALC-DETAILS] SUCCESS - Calculation complete. Total:', selectedCurrency.value, response.total)
    
  } catch (error) {
    console.error('[CALC-DETAILS] ERROR - Price calculation with details failed:', error)
    priceCalculation.value = null
    alert('Failed to calculate price. Please try again.')
  } finally {
    priceLoading.value = false
  }
}

const getRateCardDisplayName = (rateCard) => {
  let displayName = ""
  const price = form.adType === 'full_color' ? rateCard.price_fc : rateCard.price_bw
  
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

// Modal handlers
const handleModalClose = () => {
  console.log('[MODAL-CLOSE] Modal closed without saving')
  showRateCardModal.value = false
}

const handleModalSave = (details) => {
  console.log('[MODAL-SAVE] Modal saved with details:', details)
  showRateCardModal.value = false
  rateCardDetails.value = details
  console.log('[MODAL-SAVE] SUCCESS - Details stored, triggering price calculation...')
  
  performPriceCalculationWithDetails(details)
}

const editRateCardDetails = () => {
  console.log('[MODAL-EDIT] Edit rate card details requested')
  if (selectedRateCard.value) {
    console.log('[MODAL-EDIT] SUCCESS - Opening modal for rate card:', selectedRateCard.value.id)
    showRateCardModal.value = true
  } else {
    console.log('[MODAL-EDIT] WARNING - No rate card selected')
  }
}

const handleFilesUpdate = (files) => {
  console.log('[FILES-UPDATE] Files updated:', files.length, 'file(s)')
  form.files = files
}

const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return 'UGX 0'
  
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: selectedCurrency.value || 'UGX',
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

/*
const saveDraft = async () => {
  console.log('[DRAFT-SAVE] Save draft requested')
  
  if (!hasRequiredClientInfo.value) {
    console.log('[DRAFT-SAVE] ERROR - Missing required client info')
    alert('Please fill in required client information before saving draft.')
    return
  }
  
  console.log('[DRAFT-SAVE] Form discount value:', form.discount)

  try {
    savingDraft.value = true
    
    // Get pricing data from SchedulePricing component
    const finalTotal = schedulePricingRef.value?.calculateFinalTotal() || 0
    const dateCount = form.datesList.length > 0 ? form.datesList.length : 1
    
    const advertData = {
      advertTitle: form.advertTitle,
      clientId: form.clientId || null,
      clientName: form.clientName,
      marketSector: form.marketSector || '', 
      contactPerson: form.contactPerson || '',
      email: form.email,
      phone: form.phone,
      referenceDocument: form.referenceDocument || '',
      officeLocation: form.officeLocation,
      publishOnWeb: form.publishOnWeb,
      platformCategory: form.platformCategory,
      product: form.product,
      rateCard: form.rateCardId,
      adSize: form.adSize || '',
      adType: form.adType,
      frequency: parseInt(form.frequency) || 1,
      startDate: form.startDate,
      endDate: form.endDate || null,
      datesList: form.datesList,
      publishingDates: buildPublishingDates(),
      dateCount: dateCount,
      basePrice: priceCalculation.value?.basePrice || 0,
      surcharge: priceCalculation.value?.surcharge || 0,
      discount: parseFloat(form.discount) || 0,
      totalAmount: finalTotal,
      paymentMethod: form.paymentMethod,
      specialInstructions: form.specialInstructions?.trim() || '',
      contactEmail: form.email,
      contactNumber: form.phone,
      status: 'draft',
      files: form.files,
      rateCardDetails: rateCardDetails.value,
      salesAgentId: form.salesAgentId || null
    }
    
    console.log('[DRAFT-SAVE] Sending advert data:', advertData)
    
    const result = await createAdvert(advertData)
    
    console.log('[DRAFT-SAVE] SUCCESS - Draft saved:', result)
    alert(`Draft saved successfully! Reference: ${result.reference}`)
    
    router.push('/dashboard/booking/')
    
  } catch (error) {
    console.error('[DRAFT-SAVE] ERROR - Failed to save draft:', error)
    alert(`Failed to save draft: ${error.message}`)
  } finally {
    savingDraft.value = false
  }
}
*/
/*
const saveDraft = async () => {
  console.log('[DRAFT-SAVE] Save draft requested')
  
  if (!hasRequiredClientInfo.value) {
    console.log('[DRAFT-SAVE] ERROR - Missing required client info')
    showMask({
      type: 'error',
      title: 'Missing Information',
      message: 'Please fill in all required client information before saving draft.',
      autoClose: 5000
    })
    return
  }
  
  console.log('[DRAFT-SAVE] Form discount value:', form.discount)

  try {
    savingDraft.value = true
    
    // Show loading mask
    showMask({
      type: 'loading',
      title: 'Saving Draft',
      message: 'Please wait while we save your advert...',
      autoClose: 0 // Don't auto close loading state
    })
    
    // Get pricing data from SchedulePricing component
    const finalTotal = schedulePricingRef.value?.calculateFinalTotal() || 0
    const dateCount = form.datesList.length > 0 ? form.datesList.length : 1
    
    const advertData = {
      advertTitle: form.advertTitle,
      clientId: form.clientId || null,
      clientName: form.clientName,
      marketSector: form.marketSector || '', 
      contactPerson: form.contactPerson || '',
      email: form.email,
      phone: form.phone,
      referenceDocument: form.referenceDocument || '',
      officeLocation: form.officeLocation,
      publishOnWeb: form.publishOnWeb,
      platformCategory: form.platformCategory,
      product: form.product,
      rateCard: form.rateCardId,
      adSize: form.adSize || '',
      adType: form.adType,
      frequency: parseInt(form.frequency) || 1,
      startDate: form.startDate,
      endDate: form.endDate || null,
      datesList: form.datesList,
      publishingDates: buildPublishingDates(),
      dateCount: dateCount,
      basePrice: priceCalculation.value?.basePrice || 0,
      surcharge: priceCalculation.value?.surcharge || 0,
      discount: parseFloat(form.discount) || 0,
      totalAmount: finalTotal,
      paymentMethod: form.paymentMethod,
      specialInstructions: form.specialInstructions?.trim() || '',
      contactEmail: form.email,
      contactNumber: form.phone,
      status: 'draft',
      files: form.files,
      rateCardDetails: rateCardDetails.value,
      salesAgentId: form.salesAgentId || null,
      vgamsUserId: 1 // You need to get this from your auth store
    }
    
    console.log('[DRAFT-SAVE] Sending advert data:', advertData)
    
    const result = await createAdvert(advertData)
    
    console.log('[DRAFT-SAVE] SUCCESS - Draft saved:', result)
    
    // Close loading mask and show success
    closeMask()
    showMask({
      type: 'success',
      title: 'Draft Saved Successfully!',
      message: `Your advert draft has been saved.`,
      details: `Reference Number: ${result.bcReference || result.data?.bcReference || 'N/A'}`,
      autoClose: 3000
    })
    
    // Navigate after mask closes
    setTimeout(() => {
      router.push('/dashboard/booking/')
    }, 3000)
    
  } catch (error) {
    console.error('[DRAFT-SAVE] ERROR - Failed to save draft:', error)
    
    // Close loading mask if it's still showing
    closeMask()
    
    // Show error mask
    showMask({
      type: 'error',
      title: 'Failed to Save Draft',
      message: error.message || 'An unexpected error occurred while saving your draft.',
      details: error.response?.data?.message || error.toString(),
      autoClose: 5000
    })
  } finally {
    savingDraft.value = false
  }
}
*/

/*
const submitAdvert = async () => {
  console.log('[SUBMIT] Submit advert requested')
  
  if (!isFormValid.value) {
    console.log('[SUBMIT] ERROR - Form validation failed')
    alert('Please fill in all required fields and ensure price is calculated.')
    return
  }
  
  if (!confirm('Submit this advert for review? Once submitted, you cannot make changes until it\'s reviewed.')) {
    console.log('[SUBMIT] CANCELLED - User cancelled submission')
    return
  }
  
  try {
    submitting.value = true
    
    // Get pricing data from SchedulePricing component
    const finalTotal = schedulePricingRef.value?.calculateFinalTotal() || 0
    const dateCount = form.datesList.length > 0 ? form.datesList.length : 1
    
    const advertData = {
      advertTitle: form.advertTitle,
      clientId: form.clientId || null,
      clientName: form.clientName,
      marketSector: form.marketSector || '', 
      contactPerson: form.contactPerson || '',
      email: form.email,
      phone: form.phone,
      referenceDocument: form.referenceDocument || '',
      officeLocation: form.officeLocation,
      publishOnWeb: form.publishOnWeb,
      platformCategory: form.platformCategory,
      product: form.product,
      rateCard: form.rateCardId,
      adSize: form.adSize || '',
      adType: form.adType,
      frequency: parseInt(form.frequency) || 1,
      startDate: form.startDate,
      endDate: form.endDate || null,
      datesList: form.datesList,
      publishingDates: buildPublishingDates(),
      dateCount: dateCount,
      basePrice: priceCalculation.value?.basePrice || 0,
      surcharge: priceCalculation.value?.surcharge || 0,
      discount: parseFloat(form.discount) || 0,
      totalAmount: finalTotal,
      paymentMethod: form.paymentMethod,
      specialInstructions: form.specialInstructions?.trim() || '',
      contactEmail: form.email,
      contactNumber: form.phone,
      status: 'pending_review',
      files: form.files,
      rateCardDetails: rateCardDetails.value,
      salesAgentId: form.salesAgentId || null
    }
    
    console.log('[SUBMIT] Sending advert data:', advertData)
    
    const result = await createAdvert(advertData)
    
    console.log('[SUBMIT] SUCCESS - Advert submitted:', result)
    alert(`Advert submitted successfully! Reference: ${result.reference}`)
    
    router.push('/dashboard/booking')
    
  } catch (error) {
    console.error('[SUBMIT] ERROR - Submission failed:', error)
    alert(`Failed to submit advert: ${error.message}`)
  } finally {
    submitting.value = false
  }
}
*/
/*
const saveDraft = async () => {
  console.log('[DRAFT-SAVE] Save draft requested')
  
  if (!hasRequiredClientInfo.value) {
    console.log('[DRAFT-SAVE] ERROR - Missing required client info')
    showMask({
      type: 'error',
      title: 'Missing Information',
      message: 'Please fill in all required client information before saving draft.',
      autoClose: 5000
    })
    return
  }
  
  console.log('[DRAFT-SAVE] Form discount value:', form.discount)

  try {
    savingDraft.value = true
    
    // Show loading mask
    showMask({
      type: 'loading',
      title: 'Saving Draft',
      message: 'Please wait while we save your advert...',
      autoClose: 0
    })
    
    // Get pricing data from SchedulePricing component
    const finalTotal = schedulePricingRef.value?.calculateFinalTotal() || 0
    const dateCount = form.datesList.length > 0 ? form.datesList.length : 1
    
    const advertData = {
      advertTitle: form.advertTitle,
      clientId: form.clientId || null,
      clientName: form.clientName,
      marketSector: form.marketSector || '', 
      contactPerson: form.contactPerson || '',
      email: form.email,
      phone: form.phone,
      referenceDocument: form.referenceDocument || '',
      officeLocation: form.officeLocation,
      publishOnWeb: form.publishOnWeb,
      platformCategory: form.platformCategory,
      product: form.product,
      rateCard: form.rateCardId,
      adSize: form.adSize || '',
      adType: form.adType,
      frequency: parseInt(form.frequency) || 1,
      startDate: form.startDate,
      endDate: form.endDate || null,
      datesList: form.datesList,
      publishingDates: buildPublishingDates(),
      dateCount: dateCount,
      basePrice: priceCalculation.value?.basePrice || 0,
      surcharge: priceCalculation.value?.surcharge || 0,
      discount: parseFloat(form.discount) || 0,
      totalAmount: finalTotal,
      paymentMethod: form.paymentMethod,
      specialInstructions: form.specialInstructions?.trim() || '',
      contactEmail: form.email,
      contactNumber: form.phone,
      status: 'draft',
      files: form.files,
      rateCardDetails: rateCardDetails.value,
      salesAgentId: form.salesAgentId || null,
      vgamsUserId: 1 // You need to get this from your auth store
    }
    
    console.log('[DRAFT-SAVE] Sending advert data:', advertData)
    
    const result = await createAdvert(advertData)
    
    console.log('[DRAFT-SAVE] SUCCESS - Draft saved:', result)
    
    // Get the reference number from the response
    const referenceNumber = result.reference || result.data?.reference
    const bcReference = result.bc_reference || result.data?.bc_reference
    const bcSyncSuccess = result.bc_sync_success || result.data?.bc_sync_success || false
    
    console.log('[DRAFT-SAVE] Reference:', referenceNumber)
    console.log('[DRAFT-SAVE] BC Reference:', bcReference)
    console.log('[DRAFT-SAVE] BC Sync Success:', bcSyncSuccess)
    
    // If BC sync is already complete and successful, show success immediately
    if (bcSyncSuccess && bcReference) {
      closeMask()
      showMask({
        type: 'success',
        title: 'Draft Saved Successfully!',
        message: 'Your advert draft has been saved and synced with Business Central.',
        details: `Strapi Reference: ${referenceNumber}\nBC Reference: ${bcReference}\nBC Sync: ✓ Successful`,
        autoClose: 5000
      })
      
      setTimeout(() => {
        router.push('/dashboard/booking/')
      }, 5000)
    } 
    // If BC sync is not complete yet, show initial success and poll for status
    else if (referenceNumber) {
      // Show initial success with pending BC status
      closeMask()
      showMask({
        type: 'info',
        title: 'Draft Saved Successfully!',
        message: 'Your advert has been saved. Syncing with Business Central...',
        details: `Strapi Reference: ${referenceNumber}\nBC Sync: ⏳ In Progress\n\nPlease wait while we sync with Business Central...`,
        autoClose: 0 // Don't auto close while polling
      })
      
      // Start polling for BC status
      try {
        const bcStatus = await pollBcStatus(referenceNumber, 15, 2000) // 15 attempts, 2 second intervals = 30 seconds max
        
        // After polling completes, update the mask
        if (bcStatus && bcStatus.bc_reference_number) {
          updateMaskWithBcStatus(bcStatus)
        }
      } catch (error) {
        console.error('[DRAFT-SAVE] Polling error:', error)
        // Show error for BC sync failure
        closeMask()
        showMask({
          type: 'warning',
          title: 'Draft Saved - BC Sync Pending',
          message: 'Your draft was saved but BC sync is taking longer than expected.',
          details: `Strapi Reference: ${referenceNumber}\nYou can check the status later from the adverts list.`,
          autoClose: 5000
        })
      }
      
      setTimeout(() => {
        router.push('/dashboard/booking/')
      }, 8000)
    } else {
      // Fallback if no reference
      closeMask()
      showMask({
        type: 'success',
        title: 'Draft Saved Successfully!',
        message: 'Your advert draft has been saved.',
        autoClose: 3000
      })
      
      setTimeout(() => {
        router.push('/dashboard/booking/')
      }, 3000)
    }
    
  } catch (error) {
    console.error('[DRAFT-SAVE] ERROR - Failed to save draft:', error)
    
    // Close loading mask if it's still showing
    closeMask()
    
    // Show error mask
    showMask({
      type: 'error',
      title: 'Failed to Save Draft',
      message: error.message || 'An unexpected error occurred while saving your draft.',
      details: error.response?.data?.message || error.toString(),
      autoClose: 5000
    })
  } finally {
    savingDraft.value = false
    // Clear any existing polling interval
    if (pollingInterval) {
      clearInterval(pollingInterval)
      pollingInterval = null
    }
  }
}
  */

const saveDraft = async () => {
  console.log('[DRAFT-SAVE] Save draft requested')
  
  if (!hasRequiredClientInfo.value) {
    console.log('[DRAFT-SAVE] ERROR - Missing required client info')
    showMask({
      type: 'error',
      title: 'Missing Information',
      message: 'Please fill in all required client information before saving draft.',
      autoClose: 0
    })
    return
  }
  
  console.log('[DRAFT-SAVE] Form discount value:', form.discount)

  try {
    savingDraft.value = true
    
    // Show loading mask
    showMask({
      type: 'loading',
      title: 'Saving Draft',
      message: 'Please wait while we save your advert...',
      autoClose: 0
    })
    
    // Get pricing data from SchedulePricing component
    const finalTotal = schedulePricingRef.value?.calculateFinalTotal() || 0
    const dateCount = form.datesList.length > 0 ? form.datesList.length : 1
    
    const advertData = {
      advertTitle: form.advertTitle,
      clientId: form.clientId || null,
      clientName: form.clientName,
      marketSector: form.marketSector || '', 
      contactPerson: form.contactPerson || '',
      email: form.email,
      phone: form.phone,
      referenceDocument: form.referenceDocument || '',
      officeLocation: form.officeLocation,
      publishOnWeb: form.publishOnWeb,
      platformCategory: form.platformCategory,
      product: form.product,
      rateCard: form.rateCardId,
      adSize: form.adSize || '',
      adType: form.adType,
      frequency: parseInt(form.frequency) || 1,
      startDate: form.startDate,
      endDate: form.endDate || null,
      datesList: form.datesList,
      publishingDates: buildPublishingDates(),
      dateCount: dateCount,
      basePrice: priceCalculation.value?.basePrice || 0,
      surcharge: priceCalculation.value?.surcharge || 0,
      discount: parseFloat(form.discount) || 0,
      totalAmount: finalTotal,
      paymentMethod: form.paymentMethod,
      specialInstructions: form.specialInstructions?.trim() || '',
      contactEmail: form.email,
      contactNumber: form.phone,
      status: 'draft',
      files: form.files,
      rateCardDetails: rateCardDetails.value,
      salesAgentId: form.salesAgentId || null,
      vgamsUserId: 1 // You need to get this from your auth store
    }
    
    console.log('[DRAFT-SAVE] Sending advert data:', advertData)
    
    const result = await createAdvert(advertData)
    
    console.log('[DRAFT-SAVE] SUCCESS - Draft saved:', result)
    
    // Get the reference number from the response
    const referenceNumber = result.reference || result.data?.reference
    const bcReference = result.bc_reference || result.data?.bc_reference
    const bcSyncSuccess = result.bc_sync_success || result.data?.bc_sync_success || false
    
    console.log('[DRAFT-SAVE] Reference:', referenceNumber)
    console.log('[DRAFT-SAVE] BC Reference:', bcReference)
    console.log('[DRAFT-SAVE] BC Sync Success:', bcSyncSuccess)
    
    // If BC sync is already complete and successful, show success immediately
    if (bcSyncSuccess && bcReference) {
      closeMask()
      showMask({
        type: 'success',
        title: '✓ Draft Saved Successfully!',
        message: 'Your advert draft has been saved and synced with Business Central.',
        details: `Strapi Reference: ${referenceNumber}\nBC Reference: ${bcReference}\nBC Sync: ✓ Successful\n\nStatus: ${result.status || 'draft'}\nClient: ${form.clientName}\nTitle: ${form.advertTitle}`,
        autoClose: 0
      })
    } 
    // If BC sync is not complete yet, show initial success and poll for status
    else if (referenceNumber) {
      // Show initial success with pending BC status
      closeMask()
      showMask({
        type: 'info',
        title: '✓ Draft Saved Successfully!',
        message: 'Your advert has been saved.',
        details: `Strapi Reference: ${referenceNumber}\nBC Sync: ⏳ In Progress\n\nSyncing with Business Central...\n\nPlease wait while we complete the sync.`,
        autoClose: 0
      })
      
      // Start polling for BC status
      try {
        await pollBcStatus(referenceNumber, 20, 2000) // 20 attempts, 2 second intervals = 40 seconds max
      } catch (error) {
        console.error('[DRAFT-SAVE] Polling error:', error)
        // Error already handled in pollBcStatus
      }
    } else {
      // Fallback if no reference
      closeMask()
      showMask({
        type: 'success',
        title: '✓ Draft Saved Successfully!',
        message: 'Your advert draft has been saved.',
        details: 'The advert has been created successfully.',
        autoClose: 0
      })
    }
    
  } catch (error) {
    console.error('[DRAFT-SAVE] ERROR - Failed to save draft:', error)
    
    // Close loading mask if it's still showing
    closeMask()
    
    // Show error mask - NO AUTO CLOSE
    showMask({
      type: 'error',
      title: '✗ Failed to Save Draft',
      message: error.message || 'An unexpected error occurred while saving your draft.',
      details: error.response?.data?.message || error.toString(),
      autoClose: 0
    })
  } finally {
    savingDraft.value = false
  }
}



  /*
const submitAdvert = async () => {
  console.log('[SUBMIT] Submit advert requested')
  
  if (!isFormValid.value) {
    console.log('[SUBMIT] ERROR - Form validation failed')
    showMask({
      type: 'error',
      title: 'Validation Error',
      message: 'Please fill in all required fields and ensure price is calculated.',
      autoClose: 5000
    })
    return
  }
  
  if (!confirm('Submit this advert for review? Once submitted, you cannot make changes until it\'s reviewed.')) {
    console.log('[SUBMIT] CANCELLED - User cancelled submission')
    return
  }
  
  try {
    submitting.value = true
    
    // Show loading mask
    showMask({
      type: 'loading',
      title: 'Submitting Advert',
      message: 'Please wait while we submit your advert for review...',
      autoClose: 0
    })
    
    // Get pricing data from SchedulePricing component
    const finalTotal = schedulePricingRef.value?.calculateFinalTotal() || 0
    const dateCount = form.datesList.length > 0 ? form.datesList.length : 1
    
    const advertData = {
      advertTitle: form.advertTitle,
      clientId: form.clientId || null,
      clientName: form.clientName,
      marketSector: form.marketSector || '', 
      contactPerson: form.contactPerson || '',
      email: form.email,
      phone: form.phone,
      referenceDocument: form.referenceDocument || '',
      officeLocation: form.officeLocation,
      publishOnWeb: form.publishOnWeb,
      platformCategory: form.platformCategory,
      product: form.product,
      rateCard: form.rateCardId,
      adSize: form.adSize || '',
      adType: form.adType,
      frequency: parseInt(form.frequency) || 1,
      startDate: form.startDate,
      endDate: form.endDate || null,
      datesList: form.datesList,
      publishingDates: buildPublishingDates(),
      dateCount: dateCount,
      basePrice: priceCalculation.value?.basePrice || 0,
      surcharge: priceCalculation.value?.surcharge || 0,
      discount: parseFloat(form.discount) || 0,
      totalAmount: finalTotal,
      paymentMethod: form.paymentMethod,
      specialInstructions: form.specialInstructions?.trim() || '',
      contactEmail: form.email,
      contactNumber: form.phone,
      status: 'pending_review',
      files: form.files,
      rateCardDetails: rateCardDetails.value,
      salesAgentId: form.salesAgentId || null,
      vgamsUserId: 1 // You need to get this from your auth store
    }
    
    console.log('[SUBMIT] Sending advert data:', advertData)
    
    const result = await createAdvert(advertData)
    
    console.log('[SUBMIT] SUCCESS - Advert submitted:', result)
    
    // Close loading mask and show success
    closeMask()
    showMask({
      type: 'success',
      title: 'Advert Submitted Successfully!',
      message: `Your advert has been submitted for review.`,
      details: `Reference Number: ${result.bcReference || result.data?.bcReference || 'N/A'}`,
      autoClose: 3000
    })
    
    // Navigate after mask closes
    setTimeout(() => {
      router.push('/dashboard/booking')
    }, 3000)
    
  } catch (error) {
    console.error('[SUBMIT] ERROR - Submission failed:', error)
    
    // Close loading mask if it's still showing
    closeMask()
    
    // Show error mask
    showMask({
      type: 'error',
      title: 'Failed to Submit Advert',
      message: error.message || 'An unexpected error occurred while submitting your advert.',
      details: error.response?.data?.message || error.toString(),
      autoClose: 5000
    })
  } finally {
    submitting.value = false
  }
}
*/

const submitAdvert = async () => {
  console.log('[SUBMIT] Submit advert requested')
  
  if (!isFormValid.value) {
    console.log('[SUBMIT] ERROR - Form validation failed')
    showMask({
      type: 'error',
      title: 'Validation Error',
      message: 'Please fill in all required fields and ensure price is calculated.',
      autoClose: 0
    })
    return
  }
  
  if (!confirm('Submit this advert for review? Once submitted, you cannot make changes until it\'s reviewed.')) {
    console.log('[SUBMIT] CANCELLED - User cancelled submission')
    return
  }
  
  try {
    submitting.value = true
    
    // Show loading mask
    showMask({
      type: 'loading',
      title: 'Submitting Advert',
      message: 'Please wait while we submit your advert for review...',
      autoClose: 0
    })
    
    // Get pricing data from SchedulePricing component
    const finalTotal = schedulePricingRef.value?.calculateFinalTotal() || 0
    const dateCount = form.datesList.length > 0 ? form.datesList.length : 1
    
    const advertData = {
      advertTitle: form.advertTitle,
      clientId: form.clientId || null,
      clientName: form.clientName,
      marketSector: form.marketSector || '', 
      contactPerson: form.contactPerson || '',
      email: form.email,
      phone: form.phone,
      referenceDocument: form.referenceDocument || '',
      officeLocation: form.officeLocation,
      publishOnWeb: form.publishOnWeb,
      platformCategory: form.platformCategory,
      product: form.product,
      rateCard: form.rateCardId,
      adSize: form.adSize || '',
      adType: form.adType,
      frequency: parseInt(form.frequency) || 1,
      startDate: form.startDate,
      endDate: form.endDate || null,
      datesList: form.datesList,
      publishingDates: buildPublishingDates(),
      dateCount: dateCount,
      basePrice: priceCalculation.value?.basePrice || 0,
      surcharge: priceCalculation.value?.surcharge || 0,
      discount: parseFloat(form.discount) || 0,
      totalAmount: finalTotal,
      paymentMethod: form.paymentMethod,
      specialInstructions: form.specialInstructions?.trim() || '',
      contactEmail: form.email,
      contactNumber: form.phone,
      status: 'pending_review',
      files: form.files,
      rateCardDetails: rateCardDetails.value,
      salesAgentId: form.salesAgentId || null,
      vgamsUserId: 1 // You need to get this from your auth store
    }
    
    console.log('[SUBMIT] Sending advert data:', advertData)
    
    const result = await createAdvert(advertData)
    
    console.log('[SUBMIT] SUCCESS - Advert submitted:', result)
    
    // Get the reference number from the response
    const referenceNumber = result.reference || result.data?.reference
    const bcReference = result.bc_reference || result.data?.bc_reference
    const bcSyncSuccess = result.bc_sync_success || result.data?.bc_sync_success || false
    
    // If BC sync is already complete and successful
    if (bcSyncSuccess && bcReference) {
      closeMask()
      showMask({
        type: 'success',
        title: '✓ Advert Submitted Successfully!',
        message: 'Your advert has been submitted for review and synced with Business Central.',
        details: `Strapi Reference: ${referenceNumber}\nBC Reference: ${bcReference}\nBC Sync: ✓ Successful\n\nStatus: ${result.status || 'pending_review'}\nClient: ${form.clientName}\nTitle: ${form.advertTitle}`,
        autoClose: 0
      })
    } 
    // If BC sync is not complete yet, show initial success and poll for status
    else if (referenceNumber) {
      closeMask()
      showMask({
        type: 'info',
        title: '✓ Advert Submitted Successfully!',
        message: 'Your advert has been submitted for review.',
        details: `Strapi Reference: ${referenceNumber}\nBC Sync: ⏳ In Progress\n\nSyncing with Business Central...\n\nPlease wait while we complete the sync.`,
        autoClose: 0
      })
      
      // Start polling for BC status
      try {
        await pollBcStatus(referenceNumber, 20, 2000)
      } catch (error) {
        console.error('[SUBMIT] Polling error:', error)
        // Error already handled in pollBcStatus
      }
    } else {
      closeMask()
      showMask({
        type: 'success',
        title: '✓ Advert Submitted Successfully!',
        message: 'Your advert has been submitted for review.',
        details: 'The advert has been created and submitted successfully.',
        autoClose: 0
      })
    }
    
  } catch (error) {
    console.error('[SUBMIT] ERROR - Submission failed:', error)
    
    // Close loading mask if it's still showing
    closeMask()
    
    // Show error mask - NO AUTO CLOSE
    showMask({
      type: 'error',
      title: '✗ Failed to Submit Advert',
      message: error.message || 'An unexpected error occurred while submitting your advert.',
      details: error.response?.data?.message || error.toString(),
      autoClose: 0
    })
  } finally {
    submitting.value = false
  }
}

// Add cleanup on component unmount
onUnmounted(() => {
  if (pollingInterval) {
    clearInterval(pollingInterval)
    pollingInterval = null
  }
})


// Function to poll BC status
const pollBcStatus = async (reference, maxAttempts = 15, interval = 2000) => {
  let attempts = 0
  
  return new Promise((resolve, reject) => {
    pollingInterval = setInterval(async () => {
      attempts++
      
      try {
        console.log(`[BC-POLL] Attempt ${attempts}/${maxAttempts} for reference: ${reference}`)
        
        const response = await getBcSyncStatus(reference)
        
        if (response.success && response.data) {
          const bcStatus = response.data
          
          console.log('[BC-POLL] Status update:', {
            bc_reference_number: bcStatus.bc_reference_number,
            bc_share_success: bcStatus.bc_share_success
          })
          
          // If BC sync is complete (successful or has reference)
          if (bcStatus.bc_share_success === true || bcStatus.bc_reference_number !== null) {
            clearInterval(pollingInterval)
            pollingInterval = null
            
            // Update the mask with BC status
            updateMaskWithBcStatus(bcStatus)
            resolve(bcStatus)
          }
          
          // If we've reached max attempts, stop polling
          if (attempts >= maxAttempts) {
            clearInterval(pollingInterval)
            pollingInterval = null
            console.log('[BC-POLL] Max attempts reached, stopping polling')
            
            // Show timeout message
            showMask({
              type: 'warning',
              title: 'BC Sync Still Processing',
              message: 'Business Central sync is taking longer than expected.',
              details: `Reference: ${reference}\nStatus: ${bcStatus.bc_share_success ? 'Completed' : 'In Progress'}\n\nYou can close this window and check the status later.`,
              autoClose: 0
            })
            resolve(bcStatus)
          }
        }
      } catch (error) {
        console.error('[BC-POLL] Error fetching status:', error)
        
        if (attempts >= maxAttempts) {
          clearInterval(pollingInterval)
          pollingInterval = null
          
          showMask({
            type: 'error',
            title: 'BC Sync Status Check Failed',
            message: 'Unable to check Business Central sync status.',
            details: error.message || 'Please check the advert details later.',
            autoClose: 0
          })
          reject(error)
        }
      }
    }, interval)
  })
}

// Function to update mask with BC status
const updateMaskWithBcStatus = (bcStatus) => {
  const hasBCReference = bcStatus.bc_reference_number !== null && bcStatus.bc_reference_number !== ''
  const bcSyncSuccess = bcStatus.bc_share_success === true
  
  let details = `Strapi Reference: ${bcStatus.reference}\n`
  
  if (hasBCReference) {
    details += `BC Reference: ${bcStatus.bc_reference_number}\n`
    details += `BC Sync: ${bcSyncSuccess ? '✓ Successful' : '⚠ Failed'}`
  } else {
    details += `BC Sync: ${bcSyncSuccess ? '✓ Completed' : '⏳ In Progress or Failed'}`
  }
  
  details += `\n\nStatus: ${bcStatus.status || 'N/A'}`
  details += `\nClient: ${bcStatus.clientName || 'N/A'}`
  details += `\nTitle: ${bcStatus.advertTitle || 'N/A'}`
  
  // Update the mask with BC details - NO AUTO CLOSE
  showMask({
    type: bcSyncSuccess ? 'success' : 'warning',
    title: bcSyncSuccess ? '✓ BC Sync Complete!' : '⚠ BC Sync Status',
    message: bcSyncSuccess 
      ? 'Advert successfully synced with Business Central' 
      : hasBCReference 
        ? 'BC sync completed with issues' 
        : 'BC sync is still processing',
    details: details,
    autoClose: 0 // User must click close button
  })
}



const resetForm = () => {
  console.log('[RESET] Resetting form...')
  Object.keys(form).forEach(key => {
    if (Array.isArray(form[key])) {
      form[key] = []
    } else if (typeof form[key] === 'boolean') {
      form[key] = false
    } else {
      form[key] = ''
    }
  })
  
  form.adType = 'full_color'
  form.publishOnWeb = false
  form.frequency = 1
  form.discount = 0
  form.startDate = today.value
  const endDate = new Date()
  endDate.setDate(endDate.getDate() + 7)
  form.endDate = endDate.toISOString().split('T')[0]
  
  priceCalculation.value = null
  rateCardDetails.value = null
  selectedCurrency.value = 'UGX'
  console.log('[RESET] SUCCESS - Form reset complete')
}
</script>

<style scoped>
.booking-page {
  width: 100%;
  padding-bottom: 40px;
}

.page-header {
  background: white;
  padding: 25px 30px;
  border-radius: 10px;
  margin-bottom: 30px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
}

.header-content h1 {
  color: #003366;
  margin-bottom: 8px;
  font-size: 1.8em;
  font-weight: 600;
}

.header-content p {
  color: #666;
  margin: 0;
  font-size: 1em;
}

.header-actions {
  display: flex;
  gap: 15px;
}

.content-card {
  background: white;
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #f0f2f5;
}

.card-header h2 {
  color: #003366;
  font-size: 1.4em;
  font-weight: 600;
  margin: 0;
}

.loading-indicator {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #0066cc;
  font-size: 0.9em;
}

.spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(0, 102, 204, 0.3);
  border-radius: 50%;
  border-top-color: #0066cc;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-message {
  background-color: #fee;
  color: #c00;
  padding: 15px 20px;
  border-radius: 6px;
  margin-bottom: 20px;
  border-left: 4px solid #c00;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.error-message strong {
  font-weight: 600;
}

.btn-retry {
  background: #c00;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85em;
  transition: background 0.3s;
}

.btn-retry:hover {
  background: #a00;
}

.form-actions {
  display: flex;
  gap: 15px;
  justify-content: flex-end;
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid #f0f2f5;
}

.btn {
  padding: 12px 28px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1em;
  font-weight: 500;
  transition: all 0.3s;
  min-width: 140px;
  text-align: center;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}

.btn-primary {
  background: linear-gradient(135deg, #e31e24 0%, #c01820 100%);
  color: white;
  box-shadow: 0 2px 4px rgba(227, 30, 36, 0.2);
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #c01820 0%, #a0141a 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(227, 30, 36, 0.3);
}

.btn-secondary {
  background: linear-gradient(135deg, #0066cc 0%, #0052a3 100%);
  color: white;
  box-shadow: 0 2px 4px rgba(0, 102, 204, 0.2);
}

.btn-secondary:hover:not(:disabled) {
  background: linear-gradient(135deg, #0052a3 0%, #004080 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 102, 204, 0.3);
}

@media (max-width: 768px) {
  .page-header,
  .content-card {
    padding: 20px;
  }
  
  .header-content {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .header-actions {
    width: 100%;
    justify-content: flex-end;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
    min-width: unset;
  }
}

@media (max-width: 480px) {
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}
</style>