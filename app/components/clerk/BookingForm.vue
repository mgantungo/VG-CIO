<template>
  <div class="booking-form">
    <form @submit.prevent="submitForm">
      <div class="form-section">
        <h3>Client & Advert Information</h3>
        
        <div class="form-row">
          <div class="form-group">
            <label>Client Name *</label>
            <input 
              v-model="form.clientName"
              type="text" 
              placeholder="e.g., MTN Uganda" 
              required
              :class="{ 'error': errors.clientName }"
              @blur="validateField('clientName')"
            >
            <div v-if="errors.clientName" class="error-message">
              {{ errors.clientName }}
            </div>
          </div>
          
          <div class="form-group">
            <label>Contact Person</label>
            <input 
              v-model="form.contactPerson"
              type="text" 
              placeholder="Contact name"
            >
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Email Address *</label>
            <input 
              v-model="form.email"
              type="email" 
              placeholder="client@company.com" 
              required
              :class="{ 'error': errors.email }"
              @blur="validateField('email')"
            >
            <div v-if="errors.email" class="error-message">
              {{ errors.email }}
            </div>
          </div>
          
          <div class="form-group">
            <label>Phone Number *</label>
            <input 
              v-model="form.phone"
              type="tel" 
              placeholder="+256 700 000 000" 
              required
              :class="{ 'error': errors.phone }"
              @blur="validateField('phone')"
            >
            <div v-if="errors.phone" class="error-message">
              {{ errors.phone }}
            </div>
          </div>
        </div>

        <div class="form-group">
          <label>Advert Title *</label>
          <input 
            v-model="form.advertTitle"
            type="text" 
            placeholder="e.g., MTN New Year Campaign" 
            required
            :class="{ 'error': errors.advertTitle }"
            @blur="validateField('advertTitle')"
          >
          <div v-if="errors.advertTitle" class="error-message">
            {{ errors.advertTitle }}
          </div>
        </div>
      </div>

      <div class="form-section">
        <h3>Platform & Product Selection</h3>
        
        <div class="form-group">
          <label>Platform Category *</label>
          <select 
            v-model="form.platformCategory" 
            required
            @change="handlePlatformCategoryChange"
            :class="{ 'error': errors.platformCategory }"
          >
            <option value="">Select platform category</option>
            <option value="print">Print Media</option>
            <option value="tv">Television</option>
            <option value="radio">Radio</option>
            <option value="digital">Digital Media</option>
            <option value="outdoor">Outdoor/OOH</option>
          </select>
          <div v-if="errors.platformCategory" class="error-message">
            {{ errors.platformCategory }}
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Specific Platform *</label>
            <select 
              v-model="form.specificPlatform" 
              required
              @change="handlePlatformChange"
              :class="{ 'error': errors.specificPlatform }"
              :disabled="!form.platformCategory"
            >
              <option value="">Select platform</option>
              <option v-for="platform in platforms" :key="platform.id" :value="platform.id">
                {{ platform.name }}
              </option>
            </select>
            <div v-if="errors.specificPlatform" class="error-message">
              {{ errors.specificPlatform }}
            </div>
          </div>
          
          <div class="form-group">
            <label>Product/Section *</label>
            <select 
              v-model="form.productId" 
              required
              @change="handleProductChange"
              :class="{ 'error': errors.productId }"
              :disabled="!form.specificPlatform"
            >
              <option value="">Select product</option>
              <option v-for="product in products" :key="product.id" :value="product.id">
                {{ product.name }} - {{ formatCurrency(product.basePrice) }}
              </option>
            </select>
            <div v-if="errors.productId" class="error-message">
              {{ errors.productId }}
            </div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Rate Card *</label>
            <select 
              v-model="form.rateCardId" 
              required
              @change="calculatePrice"
              :class="{ 'error': errors.rateCardId }"
              :disabled="!form.productId"
            >
              <option value="">Select rate card</option>
              <option v-for="rateCard in rateCards" :key="rateCard.id" :value="rateCard.id">
                {{ rateCard.name }} - {{ formatCurrency(rateCard.basePrice) }}
              </option>
            </select>
            <div v-if="errors.rateCardId" class="error-message">
              {{ errors.rateCardId }}
            </div>
          </div>
          
          <div class="form-group">
            <label>Color/Type</label>
            <select v-model="form.adType" @change="calculatePrice">
              <option value="full_color">Full Color</option>
              <option value="black_white">Black & White</option>
            </select>
          </div>
        </div>
      </div>

      <div class="form-section">
        <h3>Schedule & Frequency</h3>
        
        <div class="form-row">
          <div class="form-group">
            <label>Start Date *</label>
            <input 
              v-model="form.startDate"
              type="date" 
              required
              :min="minStartDate"
              :class="{ 'error': errors.startDate }"
              @blur="validateField('startDate')"
            >
            <div v-if="errors.startDate" class="error-message">
              {{ errors.startDate }}
            </div>
          </div>
          
          <div class="form-group">
            <label>End Date</label>
            <input 
              v-model="form.endDate"
              type="date"
              :min="form.startDate || minStartDate"
              :class="{ 'error': errors.endDate }"
              @blur="validateField('endDate')"
            >
            <div v-if="errors.endDate" class="error-message">
              {{ errors.endDate }}
            </div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Frequency *</label>
            <input 
              v-model="form.frequency"
              type="number" 
              placeholder="Number of insertions" 
              min="1" 
              required
              @change="calculatePrice"
              :class="{ 'error': errors.frequency }"
              @blur="validateField('frequency')"
            >
            <div v-if="errors.frequency" class="error-message">
              {{ errors.frequency }}
            </div>
          </div>
          
          <div class="form-group">
            <label>Payment Method *</label>
            <select 
              v-model="form.paymentMethod" 
              required
              :class="{ 'error': errors.paymentMethod }"
            >
              <option value="">Select payment method</option>
              <option value="cash">Cash</option>
              <option value="credit">Credit (Requires Approval)</option>
              <option value="cheque">Post-Dated Cheque</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="mobile_money">Mobile Money</option>
            </select>
            <div v-if="errors.paymentMethod" class="error-message">
              {{ errors.paymentMethod }}
            </div>
          </div>
        </div>
      </div>

      <div class="form-section">
        <h3>Additional Information</h3>
        
        <div class="form-group">
          <label>Special Instructions</label>
          <textarea 
            v-model="form.specialInstructions"
            rows="4" 
            placeholder="Any special requirements or instructions..."
            :class="{ 'error': errors.specialInstructions }"
            @blur="validateField('specialInstructions')"
          ></textarea>
          <div v-if="errors.specialInstructions" class="error-message">
            {{ errors.specialInstructions }}
          </div>
        </div>
      </div>

      <slot name="price-calculator"></slot>
      
      <slot name="file-upload"></slot>

      <div class="form-actions">
        <button 
          type="button" 
          class="btn btn-secondary" 
          @click="saveDraft"
          :disabled="saving"
        >
          {{ saving ? 'Saving...' : 'Save as Draft' }}
        </button>
        
        <button 
          type="submit" 
          class="btn btn-primary" 
          :disabled="submitting || hasErrors"
        >
          {{ submitting ? 'Submitting...' : 'Submit for Review' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useProductsStore } from '~/stores/products'
import { formatCurrency } from '~/utils/formatters'
import { 
  isValidEmail, 
  isValidUgandanPhone, 
  isRequired, 
  isFutureDate,
  isEndDateAfterStart 
} from '~/utils/validators'

const emit = defineEmits(['submit', 'save-draft', 'calculate-price'])

const props = defineProps({
  initialData: {
    type: Object,
    default: () => ({})
  },
  submitting: {
    type: Boolean,
    default: false
  },
  saving: {
    type: Boolean,
    default: false
  }
})

const productsStore = useProductsStore()

const form = ref({
  clientName: '',
  contactPerson: '',
  email: '',
  phone: '',
  advertTitle: '',
  platformCategory: '',
  specificPlatform: '',
  productId: '',
  rateCardId: '',
  adType: 'full_color',
  startDate: '',
  endDate: '',
  frequency: 1,
  paymentMethod: '',
  specialInstructions: ''
})

const platforms = ref([])
const products = ref([])
const rateCards = ref([])
const errors = ref({})

const minStartDate = computed(() => {
  const today = new Date()
  return today.toISOString().split('T')[0]
})

const hasErrors = computed(() => {
  return Object.keys(errors.value).some(key => errors.value[key])
})

onMounted(() => {
  if (props.initialData) {
    form.value = { ...form.value, ...props.initialData }
  }
  
  loadInitialData()
})

const loadInitialData = async () => {
  await productsStore.loadProducts()
}

const handlePlatformCategoryChange = () => {
  form.value.specificPlatform = ''
  form.value.productId = ''
  form.value.rateCardId = ''
  errors.value.specificPlatform = ''
  errors.value.productId = ''
  errors.value.rateCardId = ''
  
  if (form.value.platformCategory) {
    platforms.value = productsStore.getPlatformsByCategory(form.value.platformCategory)
  } else {
    platforms.value = []
  }
  products.value = []
  rateCards.value = []
}

const handlePlatformChange = () => {
  form.value.productId = ''
  form.value.rateCardId = ''
  errors.value.productId = ''
  errors.value.rateCardId = ''
  
  if (form.value.specificPlatform) {
    products.value = productsStore.getProductsByPlatform(form.value.specificPlatform)
  } else {
    products.value = []
  }
  rateCards.value = []
}

const handleProductChange = () => {
  form.value.rateCardId = ''
  errors.value.rateCardId = ''
  
  if (form.value.productId) {
    rateCards.value = productsStore.getRateCardsByProduct(form.value.productId)
  } else {
    rateCards.value = []
  }
}

const calculatePrice = () => {
  if (form.value.productId && form.value.rateCardId) {
    emit('calculate-price', {
      productId: form.value.productId,
      rateCardId: form.value.rateCardId,
      frequency: parseInt(form.value.frequency) || 1,
      adType: form.value.adType
    })
  }
}

const validateField = (fieldName) => {
  let error = ''
  
  switch (fieldName) {
    case 'clientName':
      if (!isRequired(form.value.clientName)) {
        error = 'Client name is required'
      }
      break
      
    case 'email':
      if (!isRequired(form.value.email)) {
        error = 'Email is required'
      } else if (!isValidEmail(form.value.email)) {
        error = 'Please enter a valid email address'
      }
      break
      
    case 'phone':
      if (!isRequired(form.value.phone)) {
        error = 'Phone number is required'
      } else if (!isValidUgandanPhone(form.value.phone)) {
        error = 'Please enter a valid Ugandan phone number'
      }
      break
      
    case 'advertTitle':
      if (!isRequired(form.value.advertTitle)) {
        error = 'Advert title is required'
      }
      break
      
    case 'platformCategory':
      if (!isRequired(form.value.platformCategory)) {
        error = 'Platform category is required'
      }
      break
      
    case 'specificPlatform':
      if (!isRequired(form.value.specificPlatform)) {
        error = 'Platform is required'
      }
      break
      
    case 'productId':
      if (!isRequired(form.value.productId)) {
        error = 'Product is required'
      }
      break
      
    case 'rateCardId':
      if (!isRequired(form.value.rateCardId)) {
        error = 'Rate card is required'
      }
      break
      
    case 'startDate':
      if (!isRequired(form.value.startDate)) {
        error = 'Start date is required'
      } else if (!isFutureDate(form.value.startDate)) {
        error = 'Start date must be in the future'
      }
      break
      
    case 'endDate':
      if (form.value.endDate && !isEndDateAfterStart(form.value.startDate, form.value.endDate)) {
        error = 'End date must be after start date'
      }
      break
      
    case 'frequency':
      if (!isRequired(form.value.frequency)) {
        error = 'Frequency is required'
      } else if (parseInt(form.value.frequency) < 1) {
        error = 'Frequency must be at least 1'
      }
      break
      
    case 'paymentMethod':
      if (!isRequired(form.value.paymentMethod)) {
        error = 'Payment method is required'
      }
      break
      
    case 'specialInstructions':
      if (form.value.specialInstructions && form.value.specialInstructions.length > 1000) {
        error = 'Special instructions must be less than 1000 characters'
      }
      break
  }
  
  if (error) {
    errors.value[fieldName] = error
  } else {
    delete errors.value[fieldName]
  }
  
  return !error
}

const validateForm = () => {
  const fields = [
    'clientName', 'email', 'phone', 'advertTitle',
    'platformCategory', 'specificPlatform', 'productId',
    'rateCardId', 'startDate', 'frequency', 'paymentMethod'
  ]
  
  let isValid = true
  fields.forEach(field => {
    if (!validateField(field)) {
      isValid = false
    }
  })
  
  if (form.value.endDate) {
    if (!validateField('endDate')) {
      isValid = false
    }
  }
  
  return isValid
}

const submitForm = () => {
  if (validateForm()) {
    emit('submit', form.value)
  } else {
    // Scroll to first error
    const firstErrorField = Object.keys(errors.value)[0]
    if (firstErrorField) {
      const element = document.querySelector(`[name="${firstErrorField}"]`)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        element.focus()
      }
    }
  }
}

const saveDraft = () => {
  emit('save-draft', form.value)
}

// Watch for changes in platform category to update platforms
watch(() => form.value.platformCategory, handlePlatformCategoryChange)

// Watch for changes in platform to update products
watch(() => form.value.specificPlatform, handlePlatformChange)

// Watch for changes in product to update rate cards
watch(() => form.value.productId, handleProductChange)
</script>

<style scoped>
.booking-form {
  width: 100%;
}

.form-section {
  margin-bottom: 40px;
  padding-bottom: 30px;
  border-bottom: 2px solid #F5F5F5;
}

.form-section:last-child {
  border-bottom: none;
  margin-bottom: 20px;
}

.form-section h3 {
  color: #003366;
  margin-bottom: 20px;
  font-size: 1.3em;
  padding-left: 10px;
  border-left: 4px solid #E31E24;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #333333;
  font-weight: 500;
}

.form-group label::after {
  content: ' *';
  color: #E31E24;
  font-weight: bold;
}

.form-group label:has(+ input:not([required]))::after,
.form-group label:has(+ select:not([required]))::after,
.form-group label:has(+ textarea:not([required]))::after {
  content: '';
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #DDDDDD;
  border-radius: 5px;
  font-size: 1em;
  transition: border-color 0.3s, box-shadow 0.3s;
  background-color: white;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #0066CC;
  box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
}

.form-group input.error,
.form-group select.error,
.form-group textarea.error {
  border-color: #dc3545;
  background-color: rgba(220, 53, 69, 0.05);
}

.form-group input.error:focus,
.form-group select.error:focus,
.form-group textarea.error:focus {
  border-color: #dc3545;
  box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.1);
}

.form-group textarea {
  resize: vertical;
  min-height: 100px;
  font-family: inherit;
}

.error-message {
  color: #dc3545;
  font-size: 0.85em;
  margin-top: 5px;
  padding-left: 5px;
}

.form-actions {
  display: flex;
  gap: 15px;
  justify-content: flex-end;
  margin-top: 40px;
  padding-top: 20px;
  border-top: 2px solid #F5F5F5;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1em;
  font-weight: 500;
  transition: all 0.3s;
  min-width: 150px;
  text-align: center;
}

.btn-primary {
  background: #E31E24;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #c01820;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(227, 30, 36, 0.2);
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-secondary {
  background: #0066CC;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #0052a3;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 102, 204, 0.2);
}

.btn-secondary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .form-section {
    margin-bottom: 30px;
    padding-bottom: 20px;
  }
  
  .form-row {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
    min-width: auto;
  }
}
</style>