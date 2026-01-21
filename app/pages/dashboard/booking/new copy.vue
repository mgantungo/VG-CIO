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
        <div class="form-section">
          <h3 class="section-title">Client Information</h3>
          
          <div class="form-row">
            <div class="form-group">
              <label>Client Name <span class="required">*</span></label>
              <input 
                v-model="form.clientName"
                type="text" 
                placeholder="e.g., MTN Uganda" 
                required
                :disabled="submitting || categoriesLoading"
              >
            </div>
            <div class="form-group">
              <label>Contact Person</label>
              <input 
                v-model="form.contactPerson"
                type="text" 
                placeholder="Contact name"
                :disabled="submitting || categoriesLoading"
              >
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Email Address <span class="required">*</span></label>
              <input 
                v-model="form.email"
                type="email" 
                placeholder="client@company.com" 
                required
                :disabled="submitting || categoriesLoading"
              >
            </div>
            <div class="form-group">
              <label>Phone Number <span class="required">*</span></label>
              <input 
                v-model="form.phone"
                type="tel" 
                placeholder="+256 700 000 000" 
                required
                :disabled="submitting || categoriesLoading"
              >
            </div>
          </div>
        </div>

        <!-- Advert Information -->
        <div class="form-section">
          <h3 class="section-title">Advert Information</h3>
          
          <div class="form-group">
            <label>Advert Title <span class="required">*</span></label>
            <input 
              v-model="form.advertTitle"
              type="text" 
              placeholder="e.g., MTN New Year Campaign" 
              required
              :disabled="submitting || categoriesLoading"
            >
          </div>

          <div class="form-group">
            <label>Platform Category <span class="required">*</span></label>
            <div class="select-wrapper">
              <select 
                v-model="form.platformCategory" 
                required 
                @change="loadProductsForCategory"
                :disabled="submitting || categoriesLoading"
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
              <div v-if="categoriesLoading" class="select-loading">
                <span class="spinner-small"></span>
              </div>
            </div>
            <small v-if="form.platformCategory && selectedCategory" class="category-description">
              {{ selectedCategory.description }}
            </small>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Product/Section <span class="required">*</span></label>
              <div class="select-wrapper">
                <select 
                  v-model="form.product" 
                  required 
                  @change="handleProductSelected"
                  :disabled="!form.platformCategory || submitting || productsLoading"
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
                <div v-if="productsLoading" class="select-loading">
                  <span class="spinner-small"></span>
                </div>
              </div>
              <small v-if="productsLoading" class="loading-text">Loading products...</small>
              <small v-if="form.product && selectedProduct" class="product-description">
                {{ selectedProduct.description }}
              </small>
            </div>
            
            <div class="form-group">
              <label>Rate Card <span class="required">*</span></label>
              <div class="select-wrapper">
                <select 
                  v-model="form.rateCardId" 
                  required 
                  @change="handleRateCardSelected"
                  :disabled="!form.product || submitting || rateCardsLoading"
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
                <div v-if="rateCardsLoading" class="select-loading">
                  <span class="spinner-small"></span>
                </div>
              </div>
              <small v-if="rateCardsLoading" class="loading-text">Loading rate cards...</small>
              <small v-if="selectedRateCard && selectedRateCard.effectiveDate" class="ratecard-info">
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
              <input 
                v-model="form.adSize"
                type="text" 
                placeholder="e.g., Full Page, 30 sec spot"
                :disabled="submitting || categoriesLoading"
              >
            </div>
            
            <div class="form-group">
              <label>Color/Type</label>
              <select 
                v-model="form.adType" 
                @change="handleAdTypeChange"
                :disabled="!form.rateCardId || submitting || priceLoading"
              >
                <option value="full_color">Full Color</option>
                <option value="black_white">Black & White</option>
              </select>
            </div>
          </div>
          
          <!-- Display rate card details if available -->
          <div v-if="rateCardDetails" class="ratecard-details-summary">
            <div class="details-header">
              <h4>Rate Card Details</h4>
              <button type="button" class="btn-edit-details" @click="editRateCardDetails">
                Edit
              </button>
            </div>
            <div class="details-content">
              <template v-if="rateCardDetails.sizeDimension === 'per cm col'">
                <div class="detail-item">
                  <span>Size:</span>
                  <strong>{{ rateCardDetails.details.cm }} cm × {{ rateCardDetails.details.columns }} columns</strong>
                  <span class="detail-info">(Total: {{ rateCardDetails.details.cm * rateCardDetails.details.columns }} cm col)</span>
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

        <!-- Schedule & Pricing -->
        <div class="form-section">
          <h3 class="section-title">Schedule & Pricing</h3>
          
          <div class="form-row">
            <div class="form-group">
              <label>Start Date <span class="required">*</span></label>
              <input 
                v-model="form.startDate"
                type="date" 
                required
                :min="today"
                :disabled="submitting || categoriesLoading"
              >
            </div>
            <div class="form-group">
              <label>End Date</label>
              <input 
                v-model="form.endDate"
                type="date"
                :min="form.startDate || today"
                :disabled="submitting || categoriesLoading"
              >
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Frequency</label>
              <div class="input-with-buttons">
                <input 
                  v-model.number="form.frequency"
                  type="number" 
                  placeholder="Number of insertions/spots" 
                  min="1" 
                  @change="handleFrequencyChange"
                  :disabled="!form.rateCardId || submitting || priceLoading"
                >
                <div class="frequency-buttons">
                  <button 
                    type="button" 
                    class="btn-frequency" 
                    @click="adjustFrequency(-1)"
                    :disabled="form.frequency <= 1 || !form.rateCardId || submitting"
                  >-</button>
                  <button 
                    type="button" 
                    class="btn-frequency" 
                    @click="adjustFrequency(1)"
                    :disabled="!form.rateCardId || submitting"
                  >+</button>
                </div>
              </div>
              <small class="help-text">Number of times the advert will run</small>
            </div>
            
            <div class="form-group">
              <label>Payment Method <span class="required">*</span></label>
              <select 
                v-model="form.paymentMethod" 
                required
                :disabled="submitting || categoriesLoading"
              >
                <option value="">Select payment method</option>
                <option value="cash">Cash</option>
                <option value="credit">Credit (Requires Approval)</option>
                <option value="pdc">Post-Dated Cheque</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="mobile_money">Mobile Money</option>
              </select>
            </div>
          </div>

          <!-- Price Calculator -->
          <div class="price-calculator-section">
            <PriceCalculator 
              :calculation="priceCalculation"
              :loading="priceLoading"
              :currency="selectedCurrency"
              :rate-card-details="rateCardDetails"
            />
            
            <div v-if="priceCalculation" class="price-summary">
              <div class="price-summary-item">
                <span>Base Price:</span>
                <strong>{{ formatCurrency(priceCalculation.basePrice) }}</strong>
              </div>
              <div class="price-summary-item">
                <span>Frequency (×{{ form.frequency }}):</span>
                <strong>{{ formatCurrency(priceCalculation.subtotal) }}</strong>
              </div>
              <div v-if="priceCalculation.surcharge > 0" class="price-summary-item">
                <span>Surcharge ({{ priceCalculation.surchargePercentage }}%):</span>
                <strong>{{ formatCurrency(priceCalculation.surcharge) }}</strong>
              </div>
              <div class="price-summary-item total">
                <span>Total Amount:</span>
                <strong>{{ formatPriceWithDetails(priceCalculation.total) }}</strong>
              </div>
            </div>
          </div>
        </div>

        <!-- Special Instructions & Files -->
        <div class="form-section">
          <h3 class="section-title">Additional Information</h3>
          
          <div class="form-group">
            <label>Special Instructions</label>
            <textarea 
              v-model="form.specialInstructions"
              rows="4" 
              placeholder="Any special requirements or instructions..."
              :disabled="submitting || categoriesLoading"
            ></textarea>
          </div>

          <FileUpload 
            @files-updated="handleFilesUpdate"
            :disabled="submitting || categoriesLoading"
          />
        </div>

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
import PriceCalculator from '~/components/clerk/PriceCalculator.vue'
import FileUpload from '~/components/clerk/FileUpload.vue'
import RateCardDetailsModal from '~/components/clerk/RateCardDetailsModal.vue'
import { useProducts } from '~/composables/useProducts'
import { useAdverts } from '~/composables/useAdverts'
import { ref, reactive, computed, onMounted } from 'vue'
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
  specialInstructions: '',
  files: []
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
    // Check if rate card is active (not expired)
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
    form.startDate &&
    form.paymentMethod &&
    priceCalculation.value?.total
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
    endDate.setDate(endDate.getDate() + 7) // Default 7 days later
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
    
    if (!form.platformCategory) return
    
    // Find the selected category to get its ID
    const category = categories.value.find(cat => cat.category_type === form.platformCategory)
    if (!category) {
      console.error('Category not found:', form.platformCategory)
      return
    }
    
    // Load products using the category ID
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
    // Clear dependent fields
    form.rateCardId = ''
    priceCalculation.value = null
    rateCardDetails.value = null
    
    await loadRateCards(form.product)
    
    // Set currency from first rate card
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
  if (form.rateCardId) {
    calculatePrice()
  }
}

const calculatePrice = async () => {
  if (!form.rateCardId || !form.frequency || !form.adType) {
    priceCalculation.value = null
    return
  }
  
  // Check if selected rate card requires additional details
  const rateCard = rateCards.value.find(rc => rc.id === form.rateCardId)
  
  if (rateCard && 
      (rateCard.size_dimension === 'per cm col' || 
       rateCard.size_dimension === 'per column' || 
       rateCard.size_dimension === 'per word' ||
       rateCard.ad_type === 'classified photo/Logo')) {
    
    // Check if we already have details for this rate card
    if (rateCardDetails.value && rateCardDetails.value.rateCardId === form.rateCardId) {
      // Use existing details
      await performPriceCalculationWithDetails(rateCardDetails.value)
    } else {
      // Show modal to collect additional details
      showRateCardModal.value = true
    }
    return
  }
  
  // Regular price calculation (no additional details needed)
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
    
    // Prepare the request body with additional details
    const requestBody = {
      productId: form.product,
      rateCardId: form.rateCardId,
      frequency: parseInt(form.frequency) || 1,
      adType: form.adType,
      ...details.details
    }
    
    // Call the API with additional details
    // Note: You may need to modify your calculatePriceApi function or create a new one
    const response = await $fetch(`${process.env.NUXT_PUBLIC_API_BASE || 'https://cms-vgad.visiongroup.co.ug/api'}/adverts/calculate-price`, {
      method: 'POST',
      body: requestBody
    })
    
    // Merge the response with our details
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
    
    // If we have rate card details, recalculate with them
    if (rateCardDetails.value && form.rateCardId === rateCardDetails.value.rateCardId) {
      performPriceCalculationWithDetails(rateCardDetails.value)
    } else if (form.rateCardId) {
      calculatePrice()
    }
  }
}

const getRateCardDisplayName = (rateCard) => {
  //let displayName = rateCard.name || 'Untitled Rate Card'
  let displayName ="";
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
  
  // Check if today is after effective date (if set)
  if (effectiveDate && today < effectiveDate) return false
  
  // Check if today is before expiry date (if set)
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
  
  // Continue with price calculation using the details
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

const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return 'UGX 0'
  
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: selectedCurrency.value || 'UGX',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

const formatPriceWithDetails = (amount) => {
  if (!amount && amount !== 0) return 'UGX 0'
  
  let priceText = formatCurrency(amount)
  
  // Add details if available
  if (rateCardDetails.value && rateCardDetails.value.details) {
    const details = rateCardDetails.value.details
    if (details.cm && details.columns) {
      priceText += ` (${details.cm}cm × ${details.columns}col)`
    } else if (details.columns) {
      priceText += ` (${details.columns} col)`
    } else if (details.words) {
      priceText += ` (${details.words} words)`
    } else if (details.photos) {
      priceText += ` (${details.photos} photos)`
    }
  }
  
  return priceText
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
  if (!hasRequiredClientInfo.value) {
    alert('Please fill in required client information before saving draft.')
    return
  }
  
  try {
    savingDraft.value = true
    
    // Create draft advert data
    const advertData = {
      clientName: form.clientName,
      contactPerson: form.contactPerson,
      email: form.email,
      phone: form.phone,
      advertTitle: form.advertTitle,
      platformCategory: form.platformCategory,
      product: form.product,
      rateCard: form.rateCardId,
      adType: form.adType,
      startDate: form.startDate,
      endDate: form.endDate,
      frequency: parseInt(form.frequency) || 1,
      paymentMethod: form.paymentMethod,
      specialInstructions: form.specialInstructions,
      totalAmount: priceCalculation.value?.total || 0,
      status: 'draft',
      ...(rateCardDetails.value ? { rateCardDetails: rateCardDetails.value } : {})
    }
    
    const result = await createAdvert(advertData)
    
    alert(`Draft saved successfully! Reference: ${result.reference}`)
    
    // Redirect to my adverts page
    router.push('/dashboard/adverts')
    
  } catch (error) {
    console.error('Failed to save draft:', error)
    alert('Failed to save draft. Please try again.')
  } finally {
    savingDraft.value = false
  }
}
*/

const saveDraft = async () => {
  if (!hasRequiredClientInfo.value) {
    alert('Please fill in required client information before saving draft.')
    return
  }
  
  try {
    savingDraft.value = true
    
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
      paymentMethod: form.paymentMethod,
      specialInstructions: form.specialInstructions || '',
      totalAmount: priceCalculation.value?.total || 0,
      status: 'draft',
      files: form.files
    }
    
    const result = await createAdvert(advertData)
    
    alert(`Draft saved successfully! Reference: ${result.reference}`)
    
    // Redirect to my adverts page
    router.push('/dashboard/adverts')
    
  } catch (error) {
    console.error('Failed to save draft:', error)
    alert(`Failed to save draft: ${error.message}`)
  } finally {
    savingDraft.value = false
  }
}

/*
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
    
    // Create advert data
    const advertData = {
      clientName: form.clientName,
      contactPerson: form.contactPerson,
      email: form.email,
      phone: form.phone,
      advertTitle: form.advertTitle,
      platformCategory: form.platformCategory,
      product: form.product,
      rateCard: form.rateCardId,
      adType: form.adType,
      startDate: form.startDate,
      endDate: form.endDate,
      frequency: parseInt(form.frequency) || 1,
      paymentMethod: form.paymentMethod,
      specialInstructions: form.specialInstructions,
      totalAmount: priceCalculation.value?.total || 0,
      status: 'pending_review',
      ...(rateCardDetails.value ? { rateCardDetails: rateCardDetails.value } : {})
    }
    
    const result = await createAdvert(advertData)
    
    alert(`Advert submitted successfully! Reference: ${result.reference}`)
    
    // Reset form
    resetForm()
    
    // Redirect to my adverts page
    router.push('/dashboard/adverts')
    
  } catch (error) {
    console.error('Submission failed:', error)
    alert('Failed to submit advert. Please try again.')
  } finally {
    submitting.value = false
  }
}
*/

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
    
    // Prepare advert data for Strapi
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
      paymentMethod: form.paymentMethod,
      specialInstructions: form.specialInstructions || '',
      totalAmount: priceCalculation.value?.total || 0,
      status: 'pending_review'
    }
    
    const result = await createAdvert(advertData)
    
    alert(`Advert submitted successfully! Reference: ${result.reference}`)
    
    // Redirect to my adverts page
    router.push('/dashboard/adverts')
    
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
  
  // Reset default values
  form.adType = 'full_color'
  form.frequency = 1
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

.form-section {
  margin-bottom: 40px;
}

.section-title {
  color: #003366;
  font-size: 1.2em;
  font-weight: 600;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f0f2f5;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 25px;
  margin-bottom: 25px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #333;
  font-weight: 500;
  font-size: 0.95em;
}

.required {
  color: #e31e24;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1em;
  transition: all 0.3s;
  background-color: white;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #0066cc;
  box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
}

.form-group input:disabled,
.form-group select:disabled,
.form-group textarea:disabled {
  background-color: #f8f9fa;
  cursor: not-allowed;
  opacity: 0.7;
}

.form-group textarea {
  resize: vertical;
  min-height: 100px;
}

.category-description,
.product-description {
  display: block;
  margin-top: 6px;
  color: #666;
  font-size: 0.9em;
  font-style: italic;
}

.product-info {
  font-size: 0.85em;
  color: #888;
  margin-left: 5px;
}

.ratecard-info {
  display: block;
  margin-top: 6px;
  color: #666;
  font-size: 0.85em;
}

.expired-label {
  color: #e31e24;
  font-weight: 500;
}

.loading-text {
  display: block;
  margin-top: 6px;
  color: #0066cc;
  font-size: 0.85em;
}

.help-text {
  display: block;
  margin-top: 6px;
  color: #666;
  font-size: 0.85em;
}

.select-wrapper {
  position: relative;
}

.select-loading {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  pointer-events: none;
}

.spinner-small {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(0, 102, 204, 0.2);
  border-radius: 50%;
  border-top-color: #0066cc;
  animation: spin 1s ease-in-out infinite;
}

.input-with-buttons {
  display: flex;
  gap: 10px;
}

.input-with-buttons input {
  flex: 1;
}

.frequency-buttons {
  display: flex;
  gap: 2px;
}

.btn-frequency {
  width: 40px;
  height: 46px;
  padding: 0;
  border: 1px solid #ddd;
  background: white;
  color: #333;
  font-size: 1.2em;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.btn-frequency:hover:not(:disabled) {
  background: #f0f2f5;
  border-color: #ccc;
}

.btn-frequency:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ratecard-details-summary {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 6px;
  margin-top: 20px;
  border: 1px solid #e9ecef;
}

.details-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.details-header h4 {
  margin: 0;
  color: #003366;
  font-size: 1em;
  font-weight: 600;
}

.btn-edit-details {
  background: #0066cc;
  color: white;
  border: none;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 0.85em;
  cursor: pointer;
  transition: background 0.3s;
}

.btn-edit-details:hover {
  background: #0052a3;
}

.details-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.9em;
}

.detail-item span {
  color: #666;
}

.detail-item strong {
  color: #333;
}

.detail-info {
  color: #888;
  font-size: 0.85em;
}

.price-calculator-section {
  margin-top: 30px;
  padding: 25px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.price-summary {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e9ecef;
}

.price-summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-size: 0.95em;
}

.price-summary-item.total {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 2px solid #e9ecef;
  font-size: 1.1em;
  font-weight: 600;
  color: #003366;
}

.price-summary-item span {
  color: #666;
}

.price-summary-item strong {
  color: #333;
}

.price-summary-item.total strong {
  color: #003366;
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

/* Responsive adjustments */
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
  
  .form-row {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
    min-width: unset;
  }
  
  .input-with-buttons {
    flex-direction: column;
  }
  
  .frequency-buttons {
    width: 100%;
  }
  
  .btn-frequency {
    flex: 1;
    height: 44px;
  }
  
  .ratecard-details-summary {
    padding: 12px;
  }
  
  .detail-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }
}

@media (max-width: 480px) {
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .price-calculator-section {
    padding: 15px;
  }
  
  .price-summary-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }
  
  .price-summary-item span,
  .price-summary-item strong {
    width: 100%;
    text-align: left;
  }
}
</style>