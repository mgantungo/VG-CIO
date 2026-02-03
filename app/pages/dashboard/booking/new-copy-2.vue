<!--pages/dashboard/booking/new.vue-->
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
            <span v-else>Save as Draft</span>
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
          v-model:contact-person="form.contactPerson"
          v-model:email="form.email"
          v-model:phone="form.phone"
          :disabled="submitting || categoriesLoading"
          @changed="handleClientInfoChange"
        />

        <!-- Advert Information -->
        <AdvertInformation
          v-model:advert-title="form.advertTitle"
          v-model:platform-category="form.platformCategory"
          v-model:product="form.product"
          v-model:rate-card-id="form.rateCardId"
          v-model:ad-size="form.adSize"
          v-model:ad-type="form.adType"
          :disabled="submitting || categoriesLoading"
          :categories="categories"
          :products="products"
          :rate-cards="rateCards"
          :rate-card-details="rateCardDetails"
          :categories-loading="categoriesLoading"
          :products-loading="productsLoading"
          :rate-cards-loading="rateCardsLoading"
          :price-loading="priceLoading"
          @category-change="loadProductsForCategory"
          @product-change="handleProductSelected"
          @ratecard-change="handleRateCardSelected"
          @adtype-change="handleAdTypeChange"
          @edit-ratecard-details="editRateCardDetails"
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
            <span v-else>Save as Draft</span>
          </button>
          <button 
            type="submit" 
            class="btn btn-primary" 
            :disabled="!isFormValid || submitting || categoriesLoading"
          >
            <span v-if="submitting">Submitting...</span>
            <span v-else>Submit for Review</span>
          </button>
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
  </div>
</template>

<script setup>
// Import components
import FileUpload from '~/components/clerk/FileUpload.vue'
import RateCardDetailsModal from '~/components/clerk/RateCardDetailsModal.vue'

// Import new form section components
import ClientInformation from '~/components/clerk/ClientInformation.vue'
import AdvertInformation from '~/components/clerk/AdvertInformation.vue'
import SchedulePricing from '~/components/clerk/SchedulePricing.vue'
import AdditionalInformation from '~/components/clerk/AdditionalInformation.vue'

import { useProducts } from '~/composables/useProducts'
import { useAdverts } from '~/composables/useAdverts'
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter } from '#imports'

const router = useRouter()

// Use the composable
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

const { createAdvert } = useAdverts()

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
  advertTitle: '',
  platformCategory: '',
  product: '',
  rateCardId: '',
  adSize: '',
  adType: 'full_color',
  startDate: '',
  endDate: '',
  frequency: 1,
  paymentMethod: '',
  discount: 0,
  specialInstructions: '',
  files: [],
  datesList: []
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

// Watch platform category changes and lock frequency to 1 for print media
watch(() => form.platformCategory, (newCategory) => {
  if (newCategory === 'print') {
    form.frequency = 1
  }
})

// Computed property for middle dates string
const middleDatesString = computed(() => {
  if (!form.datesList || form.datesList.length <= 2) return ''
  
  const sortedDates = [...form.datesList].sort()
  const middleDates = sortedDates.slice(1, -1)
  
  return middleDates.join(', ')
})

// Helper function to format dates for special instructions
const formatDatesForInstructions = () => {
  if (!schedulePricingRef.value) return ''
  
  const middleDatesString = schedulePricingRef.value.getMiddleDatesForInstructions()
  if (!middleDatesString) return ''
  
  return `dates[${middleDatesString}]`
}

// Helper function to build special instructions with dates
const buildSpecialInstructions = () => {
  const datesString = formatDatesForInstructions()
  const userInstructions = form.specialInstructions?.trim() || ''
  
  if (datesString && userInstructions) {
    return `${datesString}\n\n${userInstructions}`
  } else if (datesString) {
    return datesString
  } else {
    return userInstructions
  }
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
  return rateCards.value.find(rc => rc.id === form.rateCardId)
})

const hasRequiredClientInfo = computed(() => {
  return form.clientName && form.email && form.phone && form.advertTitle
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
         rateCardsLoading.value || priceLoading.value
})

// Lifecycle
onMounted(async () => {
  await initializeForm()
})

// Methods
const initializeForm = async () => {
  try {
    categoriesLoading.value = true
    await loadCategories()
    
    // Set default dates
    form.startDate = today.value
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + 7)
    form.endDate = endDate.toISOString().split('T')[0]
  } catch (error) {
    categoriesError.value = error.message || 'Failed to load categories'
    console.error('Failed to initialize form:', error)
  } finally {
    categoriesLoading.value = false
  }
}

const retryLoadCategories = async () => {
  categoriesError.value = null
  await initializeForm()
}

const loadProductsForCategory = async () => {
  try {
    productsLoading.value = true
    // Clear dependent fields
    form.product = ''
    form.rateCardId = ''
    form.adSize = ''
    priceCalculation.value = null
    rateCardDetails.value = null
    
    // Set frequency to 1 for print media
    if (form.platformCategory === 'print') {
      form.frequency = 1
    }
    
    if (!form.platformCategory) return
    
    const category = categories.value.find(cat => cat.category_type === form.platformCategory)
    if (!category) {
      console.error('Category not found:', form.platformCategory)
      return
    }
    
    await loadProductsByCategoryId(category.id)
    
  } catch (error) {
    console.error('Failed to load products:', error)
    alert('Failed to load products. Please try again.')
  } finally {
    productsLoading.value = false
  }
}

const handleProductSelected = async () => {
  try {
    rateCardsLoading.value = true
    form.rateCardId = ''
    priceCalculation.value = null
    rateCardDetails.value = null
    
    await loadRateCards(form.product)
    
    if (rateCards.value.length > 0) {
      selectedCurrency.value = rateCards.value[0].currency || 'UGX'
    }
  } catch (error) {
    console.error('Failed to load rate cards:', error)
    alert('Failed to load rate cards. Please try again.')
  } finally {
    rateCardsLoading.value = false
  }
}

const handleRateCardSelected = async () => {
  if (!form.rateCardId) {
    priceCalculation.value = null
    rateCardDetails.value = null
    return
  }
  
  await calculatePrice()
}

const handleAdTypeChange = () => {
  if (form.rateCardId) {
    calculatePrice()
  }
}

const handleFrequencyChange = () => {
  // Don't allow frequency changes for print media
  if (form.platformCategory === 'print') {
    form.frequency = 1
    return
  }
  
  if (form.rateCardId) {
    calculatePrice()
  }
}

const handleDiscountChange = () => {
  if (form.rateCardId) {
    calculatePrice()
  }
}

const handleFrequencyAdjust = (newFrequency) => {
  // Don't allow frequency changes for print media
  if (form.platformCategory === 'print') {
    form.frequency = 1
    return
  }
  
  if (rateCardDetails.value && form.rateCardId === rateCardDetails.value.rateCardId) {
    performPriceCalculationWithDetails(rateCardDetails.value)
  } else if (form.rateCardId) {
    calculatePrice()
  }
}

const handleDatesUpdated = (datesString) => {
  if (datesString) {
    console.log('Middle dates updated:', datesString)
  }
  // Recalculate price when dates change
  if (form.rateCardId) {
    calculatePrice()
  }
}

const calculatePrice = async () => {
  if (!form.rateCardId || !form.frequency || !form.adType) {
    priceCalculation.value = null
    return
  }
  
  const rateCard = rateCards.value.find(rc => rc.id === form.rateCardId)
  
  if (rateCard && 
      (rateCard.size_dimension === 'per cm col' || 
       rateCard.size_dimension === 'per column' || 
       rateCard.size_dimension === 'per word' ||
       rateCard.ad_type === 'classified photo/Logo')) {
    
    if (rateCardDetails.value && rateCardDetails.value.rateCardId === form.rateCardId) {
      await performPriceCalculationWithDetails(rateCardDetails.value)
    } else {
      showRateCardModal.value = true
    }
    return
  }
  
  await performPriceCalculation()
}

const performPriceCalculation = async () => {
  try {
    priceLoading.value = true
    
    const data = await calculatePriceApi(
      form.product,
      form.rateCardId,
      {
        frequency: parseInt(form.frequency) || 1,
        adType: form.adType
      }
    )
    
    priceCalculation.value = data
    selectedCurrency.value = data.currency || 'UGX'
  } catch (error) {
    console.error('Price calculation failed:', error)
    priceCalculation.value = null
    alert('Failed to calculate price. Please check your selections.')
  } finally {
    priceLoading.value = false
  }
}

const performPriceCalculationWithDetails = async (details) => {
  try {
    priceLoading.value = true
    
    const requestBody = {
      productId: form.product,
      rateCardId: form.rateCardId,
      frequency: parseInt(form.frequency) || 1,
      adType: form.adType,
      ...details.details
    }
    
    const response = await $fetch(`${process.env.NUXT_PUBLIC_API_BASE || 'https://cms-vgad.visiongroup.co.ug/api'}/adverts/calculate-price`, {
      method: 'POST',
      body: requestBody
    })
    
    priceCalculation.value = {
      ...response,
      ...details,
      sizeDimension: details.sizeDimension,
      adType: details.adType
    }
    
    selectedCurrency.value = response.currency || 'UGX'
    
  } catch (error) {
    console.error('Price calculation with details failed:', error)
    priceCalculation.value = null
    alert('Failed to calculate price. Please try again.')
  } finally {
    priceLoading.value = false
  }
}

const adjustFrequency = (change) => {
  const newFrequency = parseInt(form.frequency) + change
  if (newFrequency >= 1) {
    form.frequency = newFrequency
    
    if (rateCardDetails.value && form.rateCardId === rateCardDetails.value.rateCardId) {
      performPriceCalculationWithDetails(rateCardDetails.value)
    } else if (form.rateCardId) {
      calculatePrice()
    }
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
  showRateCardModal.value = false
}

const handleModalSave = (details) => {
  showRateCardModal.value = false
  rateCardDetails.value = details
  
  performPriceCalculationWithDetails(details)
}

const editRateCardDetails = () => {
  if (selectedRateCard.value) {
    showRateCardModal.value = true
  }
}

const handleFilesUpdate = (files) => {
  form.files = files
}

const handleClientInfoChange = ({ field, value }) => {
  console.log(`Client info changed: ${field} = ${value}`)
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

const saveDraft = async () => {
  if (!hasRequiredClientInfo.value) {
    alert('Please fill in required client information before saving draft.')
    return
  }
  
  console.log(`discount: ${form.discount}`);

  try {
    savingDraft.value = true
    
    // Get pricing data from SchedulePricing component
    const finalTotal = schedulePricingRef.value?.calculateFinalTotal() || 0
    const dateCount = form.datesList.length > 0 ? form.datesList.length : 1
    
    const advertData = {
      advertTitle: form.advertTitle,
      clientName: form.clientName,
      contactPerson: form.contactPerson || '',
      email: form.email,
      phone: form.phone,
      platformCategory: form.platformCategory,
      product: form.product,
      rateCard: form.rateCardId,
      adSize: form.adSize || '',
      adType: form.adType,
      frequency: parseInt(form.frequency) || 1,
      startDate: form.startDate,
      endDate: form.endDate || null,
      datesList: form.datesList,
      dateCount: dateCount,
      basePrice: priceCalculation.value?.basePrice || 0,
      surcharge: priceCalculation.value?.surcharge || 0,
      discount: parseFloat(form.discount) || 0, // Discount as number
      totalAmount: finalTotal, // From SchedulePricing
      paymentMethod: form.paymentMethod,
      specialInstructions: buildSpecialInstructions(), // Includes dates
      status: 'draft',
      files: form.files,
      rateCardDetails: rateCardDetails.value
    }
    
    const result = await createAdvert(advertData)
    
    alert(`Draft saved successfully! Reference: ${result.reference}`)
    
    router.push('/dashboard/booking/')
    
  } catch (error) {
    console.error('Failed to save draft:', error)
    alert(`Failed to save draft: ${error.message}`)
  } finally {
    savingDraft.value = false
  }
}

const submitAdvert = async () => {
  if (!isFormValid.value) {
    alert('Please fill in all required fields and ensure price is calculated.')
    return
  }
  
  if (!confirm('Submit this advert for review? Once submitted, you cannot make changes until it\'s reviewed.')) {
    return
  }
  
  try {
    submitting.value = true
    
    // Get pricing data from SchedulePricing component
    const finalTotal = schedulePricingRef.value?.calculateFinalTotal() || 0
    const dateCount = form.datesList.length > 0 ? form.datesList.length : 1
    
    const advertData = {
      advertTitle: form.advertTitle,
      clientName: form.clientName,
      contactPerson: form.contactPerson || '',
      email: form.email,
      phone: form.phone,
      platformCategory: form.platformCategory,
      product: form.product,
      rateCard: form.rateCardId,
      adSize: form.adSize || '',
      adType: form.adType,
      frequency: parseInt(form.frequency) || 1,
      startDate: form.startDate,
      endDate: form.endDate || null,
      datesList: form.datesList,
      dateCount: dateCount,
      basePrice: priceCalculation.value?.basePrice || 0,
      surcharge: priceCalculation.value?.surcharge || 0,
      discount: parseFloat(form.discount) || 0, // Discount as number
      totalAmount: finalTotal, // From SchedulePricing
      paymentMethod: form.paymentMethod,
      specialInstructions: buildSpecialInstructions(), // Includes dates
      status: 'pending_review',
      files: form.files,
      rateCardDetails: rateCardDetails.value
    }
    
    const result = await createAdvert(advertData)
    
    alert(`Advert submitted successfully! Reference: ${result.reference}`)
    
    router.push('/dashboard/booking')
    
  } catch (error) {
    console.error('Submission failed:', error)
    alert(`Failed to submit advert: ${error.message}`)
  } finally {
    submitting.value = false
  }
}

const resetForm = () => {
  Object.keys(form).forEach(key => {
    if (Array.isArray(form[key])) {
      form[key] = []
    } else {
      form[key] = ''
    }
  })
  
  form.adType = 'full_color'
  form.frequency = 1
  form.discount = 0
  form.startDate = today.value
  const endDate = new Date()
  endDate.setDate(endDate.getDate() + 7)
  form.endDate = endDate.toISOString().split('T')[0]
  
  priceCalculation.value = null
  rateCardDetails.value = null
  selectedCurrency.value = 'UGX'
}
</script>

<style scoped>
/* All existing styles remain the same */
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
