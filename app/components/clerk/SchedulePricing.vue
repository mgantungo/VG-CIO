<!-- components/clerk/SchedulePricing.vue -->
<template>
  <div class="form-section">
    <div class="section-header">
      <h3 class="section-title">Schedule & Pricing</h3>
      <div class="section-badge">Financial</div>
    </div>
    
    <!-- First Row: Advert Dates and Payment Method -->
    <div class="form-row two-columns">
      <!-- Advert Dates -->
      <div class="form-group">
        <label>Advert Dates <span class="required">*</span></label>
        <div class="date-input-wrapper">
          <div class="multi-date-selector">
            <div 
              class="selected-dates-header" 
              :class="{ 'error': showDateError && selectedDates.length === 0 }"
              @click="toggleDatePicker"
            >
              <div class="selected-dates-summary">
                <template v-if="selectedDates.length === 0">
                  <span class="placeholder-text">Select advert dates</span>
                </template>
                <template v-else>
                  <div class="date-range-display">
                    <span class="date-count">{{ selectedDates.length }} date(s)</span>
                    <span class="date-range">
                      {{ formatDate(earliestDate) }} - {{ formatDate(latestDate) }}
                    </span>
                  </div>
                </template>
              </div>
              <div class="calendar-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="4" width="18" height="18" rx="2" stroke="#4A6FDC" stroke-width="2"/>
                  <path d="M3 10H21" stroke="#4A6FDC" stroke-width="2"/>
                  <path d="M8 2V6" stroke="#4A6FDC" stroke-width="2" stroke-linecap="round"/>
                  <path d="M16 2V6" stroke="#4A6FDC" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </div>
            </div>
            
            <!-- Date Picker Modal -->
            <div v-if="showDatePicker" class="date-picker-modal">
              <div class="date-picker-header">
                <h4>Select Advert Dates</h4>
                <button type="button" class="close-picker" @click="closeDatePicker">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M12 4L4 12M4 4L12 12" stroke="#64748B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
              </div>
              
              <div class="date-picker-controls">
                <div class="month-navigation">
                  <button type="button" class="nav-button" @click="previousMonth">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M10 12L6 8L10 4" stroke="#4A6FDC" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </button>
                  <div class="current-month">{{ currentMonthYear }}</div>
                  <button type="button" class="nav-button" @click="nextMonth">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M6 12L10 8L6 4" stroke="#4A6FDC" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </button>
                </div>
                
                <div class="date-selection-actions">
                  <button 
                    type="button" 
                    class="action-button clear-dates" 
                    @click="clearAllDates"
                    :disabled="selectedDates.length === 0"
                  >
                    Clear All
                  </button>
                  <button 
                    type="button" 
                    class="action-button done-button" 
                    @click="applyDateSelection"
                  >
                    Done
                  </button>
                </div>
              </div>
              
              <div class="calendar-grid">
                <div class="weekdays">
                  <div v-for="day in weekDays" :key="day" class="weekday">{{ day }}</div>
                </div>
                <div class="calendar-days">
                  <div 
                    v-for="day in calendarDays" 
                    :key="day.id"
                    :class="[
                      'calendar-day',
                      {
                        'empty': day.isEmpty,
                        'today': day.isToday,
                        'selected': day.isSelected,
                        'disabled': day.isDisabled
                      }
                    ]"
                    @click="!day.isDisabled && !day.isEmpty ? toggleDateSelection(day.date) : null"
                  >
                    <template v-if="!day.isEmpty">
                      <span class="day-number">{{ day.day }}</span>
                      <div v-if="day.isSelected" class="selected-indicator"></div>
                    </template>
                  </div>
                </div>
              </div>
              
              <div class="selected-dates-list">
                <div class="selected-dates-title">Selected Dates ({{ selectedDates.length }})</div>
                <div class="selected-dates-container" v-if="selectedDates.length > 0">
                  <div 
                    v-for="(date, index) in sortedSelectedDates" 
                    :key="date.toISOString()"
                    class="selected-date-tag"
                  >
                    <span>{{ formatDate(date) }}</span>
                    <button 
                      type="button" 
                      class="remove-date" 
                      @click="removeDate(date)"
                      :disabled="disabled"
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M9 3L3 9M3 3L9 9" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </button>
                  </div>
                </div>
                <div v-else class="no-dates-selected">
                  No dates selected. Click on calendar dates to select them.
                </div>
              </div>
            </div>
          </div>
          <small class="help-text">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style="vertical-align: middle; margin-right: 4px;">
              <circle cx="6" cy="6" r="5" stroke="#7C8DB5" stroke-width="1.5"/>
              <path d="M6 4V6M6 8H6.005" stroke="#7C8DB5" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            First date = Start, Last date = End
          </small>
          <div v-if="showDateError && selectedDates.length === 0" class="field-error">
            ⚠️ Please select at least one date
          </div>
        </div>
      </div>

      <!-- Payment Method -->
      <div class="form-group">
        <label>Payment Method <span class="required">*</span></label>
        <div class="payment-select-wrapper">
          <select 
            :value="paymentMethod" 
            required
            :class="{ 'error': showPaymentError && !paymentMethod }"
            :disabled="disabled"
            @change="updatePaymentMethod($event.target.value)"
            class="styled-select"
          >
            <option value="" disabled selected>-- Select payment method --</option>
            <option value="cash" style="color: #10B981; font-weight: 600;">💵 Cash</option>
            <option value="credit" style="color: #F59E0B; font-weight: 600;">💳 Credit (Requires Approval)</option>
            <option value="pdc" style="color: #8B5CF6; font-weight: 600;">📝 Post-Dated Cheque</option>
            <option value="bank_transfer" style="color: #3B82F6; font-weight: 600;">🏦 Bank Transfer</option>
            <option value="mobile_money" style="color: #EF4444; font-weight: 600;">📱 Mobile Money</option>
          </select>
          <div class="payment-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="4" width="20" height="16" rx="2" stroke="#4A6FDC" stroke-width="2"/>
              <path d="M2 10H22" stroke="#4A6FDC" stroke-width="2"/>
              <circle cx="18" cy="15" r="1" fill="#4A6FDC"/>
            </svg>
          </div>
        </div>
        <small class="help-text payment-prompt">
          <span class="prompt-icon">💡</span>
          Select how the client will pay for this advert
        </small>
        <div v-if="showPaymentError && !paymentMethod" class="field-error">
          ⚠️ Please select a payment method
        </div>
      </div>
    </div>

    <!-- Second Row: Frequency and Discount -->
    <div class="form-row two-columns">
      <!-- Frequency -->
      <div class="form-group">
        <label>
          Frequency
          <span v-if="isPrintMedia" class="print-media-note">(Fixed at 1)</span>
          <span v-else class="required">*</span>
        </label>
        <div class="frequency-compact">
          <div class="frequency-wrapper">
            <input 
              :value="frequency"
              type="number" 
              placeholder="Times" 
              min="1" 
              required
              :class="{ 'locked': isPrintMedia, 'error': showFrequencyError && !isPrintMedia && !frequency }"
              @change="handleFrequencyChange($event)"
              :disabled="!rateCardId || disabled || priceLoading || isPrintMedia"
            >
          </div>
          <div class="frequency-buttons-compact" v-if="!isPrintMedia">
            <button 
              type="button" 
              class="btn-frequency-compact btn-minus"
              @click="adjustFrequency(-1)"
              :disabled="frequency <= 1 || !rateCardId || disabled"
              title="Decrease frequency"
            >
              <svg width="12" height="2" viewBox="0 0 12 2" fill="none">
                <path d="M1 1H11" stroke="white" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
            <button 
              type="button" 
              class="btn-frequency-compact btn-plus"
              @click="adjustFrequency(1)"
              :disabled="!rateCardId || disabled"
              title="Increase frequency"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 1V11M1 6H11" stroke="white" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
          <div class="print-media-lock-compact" v-else>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="4" y="9" width="12" height="8" rx="2" stroke="#94A3B8" stroke-width="2"/>
              <path d="M7 9V6C7 4.34315 8.34315 3 10 3C11.6569 3 13 4.34315 13 6V9" stroke="#94A3B8" stroke-width="2"/>
              <circle cx="10" cy="13" r="1" fill="#94A3B8"/>
            </svg>
          </div>
        </div>
        <small class="help-text">
          <span v-if="isPrintMedia">Once per selected date</span>
          <span v-else>Number of insertions/spots</span>
        </small>
        <div v-if="showFrequencyError && !isPrintMedia && !frequency" class="field-error">
          ⚠️ Please enter frequency
        </div>
      </div>

      <!-- Discount -->
      <div class="form-group">
        <label>Discount (%)</label>
        <div class="discount-wrapper">
          <input 
            :value="discount"
            type="number" 
            placeholder="0-100%" 
            min="0"
            max="100"
            step="0.1"
            @input="updateDiscount($event.target.value)"
            :disabled="!rateCardId || disabled || priceLoading"
            class="discount-input"
          >
          <div class="discount-icon">%</div>
        </div>
        <small class="help-text">
          Apply percentage discount (optional)
        </small>
      </div>
    </div>

    <!-- Date Summary Display (Compact) -->
    <div v-if="selectedDates.length > 0" class="date-summary-compact">
      <div class="date-summary-header">
        <span class="summary-label">Dates:</span>
        <span class="date-count-badge">{{ selectedDates.length }}</span>
      </div>
      <div class="date-summary-content">
        <span class="date-range-compact">
          {{ formatDate(earliestDate) }} - {{ formatDate(latestDate) }}
        </span>
        <span v-if="middleDates.length > 0" class="middle-dates-compact">
          +{{ middleDates.length }} more
        </span>
      </div>
    </div>

    <!-- Required Fields Summary -->
    <div v-if="showRequiredSummary" class="required-summary">
      <div class="summary-icon">⚠️</div>
      <div class="summary-message">
        Please complete all required fields marked with <span class="required-star">*</span>
      </div>
    </div>

    <!-- Price Calculator -->
    <div class="price-calculator-section">
      <slot name="price-calculator">
        <div class="no-price-info" v-if="!priceCalculation">
          <div class="price-placeholder-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="6" width="18" height="12" rx="2" stroke="#CBD5E0" stroke-width="2"/>
              <path d="M3 10H21" stroke="#CBD5E0" stroke-width="2"/>
              <circle cx="18" cy="12" r="1" fill="#CBD5E0"/>
            </svg>
          </div>
          <p>Select all options to see pricing</p>
        </div>
      </slot>
      
      <div v-if="priceCalculation" class="price-summary">
        <div class="price-summary-header">
          <h4>Price Breakdown</h4>
          <div class="currency-badge">{{ currency }}</div>
        </div>
        <div class="price-summary-item">
          <span>Base Price:</span>
          <strong class="base-price">{{ formatCurrency(priceCalculation.basePrice) }}</strong>
        </div>
        <div class="price-summary-item" v-if="!isPrintMedia">
          <span>Frequency (×{{ frequency }}):</span>
          <strong>{{ formatCurrency(priceCalculation.subtotal) }}</strong>
        </div>
        <div class="price-summary-item date-count-item">
          <span>Date Count (×{{ selectedDates.length }}):</span>
          <strong>{{ formatCurrency(calculateSubtotalWithDates()) }}</strong>
        </div>
        <div v-if="priceCalculation.surcharge > 0" class="price-summary-item surcharge-item">
          <span>Surcharge ({{ priceCalculation.surchargePercentage }}%):</span>
          <strong class="surcharge-price">{{ formatCurrency(priceCalculation.surcharge) }}</strong>
        </div>
        <div v-if="discount > 0" class="price-summary-item discount-item">
          <span>Discount ({{ discount }}%):</span>
          <strong class="discount-price">-{{ formatCurrency(calculateDiscountAmount()) }}</strong>
        </div>
        <div class="price-summary-item total">
          <div class="total-label">
            <span>Total Amount:</span>
          </div>
          <div class="total-amount">
            <strong>{{ formatCurrency(calculateFinalTotal()) }}</strong>
            <div class="total-badge">Final</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, computed, ref, watch } from 'vue'

const props = defineProps({
  startDate: {
    type: String,
    default: ''
  },
  endDate: {
    type: String,
    default: ''
  },
  frequency: {
    type: [String, Number],
    default: 1
  },
  paymentMethod: {
    type: String,
    default: ''
  },
  discount: {
    type: [String, Number],
    default: 0
  },
  disabled: {
    type: Boolean,
    default: false
  },
  rateCardId: {
    type: [String, Number],
    default: ''
  },
  priceCalculation: {
    type: Object,
    default: null
  },
  priceLoading: {
    type: Boolean,
    default: false
  },
  minDate: {
    type: String,
    default: ''
  },
  rateCardDetails: {
    type: Object,
    default: null
  },
  currency: {
    type: String,
    default: 'UGX'
  },
  datesList: {
    type: Array,
    default: () => []
  },
  platformCategory: {
    type: String,
    default: ''
  },
  // Validation control props
  validateFields: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'update:startDate', 
  'update:endDate', 
  'update:frequency',
  'update:paymentMethod',
  'update:discount',
  'update:datesList',
  'frequency-change',
  'frequency-adjust',
  'discount-change',
  'dates-updated',
  'validation-change'
])

// Reactive state for date picker and validation
const showDatePicker = ref(false)
const currentDate = ref(new Date())
const selectedDates = ref([])

// Validation state
const showDateError = ref(false)
const showPaymentError = ref(false)
const showFrequencyError = ref(false)

// Computed: Check if platform is print media
const isPrintMedia = computed(() => {
  return props.platformCategory === 'print'
})

// Watch for validation trigger
watch(() => props.validateFields, (newVal) => {
  if (newVal) {
    validateRequiredFields()
  }
})

// Validate required fields
const validateRequiredFields = () => {
  showDateError.value = selectedDates.value.length === 0
  showPaymentError.value = !props.paymentMethod
  showFrequencyError.value = !isPrintMedia.value && !props.frequency
  
  const isValid = !showDateError.value && !showPaymentError.value && !showFrequencyError.value
  emit('validation-change', isValid)
  return isValid
}

// Watch for print media change - force frequency to 1
watch(isPrintMedia, (newValue) => {
  if (newValue && props.frequency !== 1) {
    emit('update:frequency', 1)
    emit('frequency-change', 1)
  }
})

// Initialize selected dates from props
watch(() => props.datesList, (newDates) => {
  if (newDates && newDates.length > 0) {
    selectedDates.value = newDates.map(dateStr => new Date(dateStr)).sort((a, b) => a - b)
  } else {
    selectedDates.value = []
  }
}, { immediate: true })

// Computed for required fields summary
const showRequiredSummary = computed(() => {
  return (showDateError.value || showPaymentError.value || showFrequencyError.value)
})

// Weekday labels
const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// Computed properties for calendar
const currentMonthYear = computed(() => {
  return currentDate.value.toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  })
})

const calendarDays = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startingWeekday = firstDay.getDay()
  
  const days = []
  
  // Add empty days for starting weekday
  for (let i = 0; i < startingWeekday; i++) {
    days.push({ isEmpty: true })
  }
  
  // Add days of month
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day)
    const dateString = date.toISOString().split('T')[0]
    const isToday = date.toDateString() === today.toDateString()
    const isSelected = selectedDates.value.some(
      selectedDate => selectedDate.toDateString() === date.toDateString()
    )
    const isDisabled = props.minDate && date < new Date(props.minDate)
    
    days.push({
      id: dateString,
      day: day,
      date: date,
      isToday,
      isSelected,
      isDisabled,
      isEmpty: false
    })
  }
  
  return days
})

// Sorted selected dates
const sortedSelectedDates = computed(() => {
  return [...selectedDates.value].sort((a, b) => a - b)
})

// Earliest date (start date)
const earliestDate = computed(() => {
  if (selectedDates.value.length === 0) return null
  return sortedSelectedDates.value[0]
})

// Latest date (end date)
const latestDate = computed(() => {
  if (selectedDates.value.length === 0) return null
  return sortedSelectedDates.value[sortedSelectedDates.value.length - 1]
})

// Middle dates (dates between earliest and latest)
const middleDates = computed(() => {
  if (selectedDates.value.length <= 2) return []
  return sortedSelectedDates.value.slice(1, -1)
})

// Date selection functions
const toggleDateSelection = (date) => {
  if (props.disabled) return
  
  const dateString = date.toDateString()
  const existingIndex = selectedDates.value.findIndex(
    d => d.toDateString() === dateString
  )
  
  if (existingIndex > -1) {
    selectedDates.value.splice(existingIndex, 1)
  } else {
    selectedDates.value.push(new Date(date))
  }
  
  // Clear date error if dates are selected
  if (selectedDates.value.length > 0) {
    showDateError.value = false
  }
}

const removeDate = (date) => {
  if (props.disabled) return
  
  const dateString = date.toDateString()
  const index = selectedDates.value.findIndex(
    d => d.toDateString() === dateString
  )
  
  if (index > -1) {
    selectedDates.value.splice(index, 1)
  }
}

const clearAllDates = () => {
  selectedDates.value = []
}

const applyDateSelection = () => {
  const dateStrings = sortedSelectedDates.value.map(date => date.toISOString().split('T')[0])
  
  emit('update:datesList', dateStrings)
  
  if (earliestDate.value) {
    emit('update:startDate', earliestDate.value.toISOString().split('T')[0])
  } else {
    emit('update:startDate', '')
  }
  
  if (latestDate.value) {
    emit('update:endDate', latestDate.value.toISOString().split('T')[0])
  } else {
    emit('update:endDate', '')
  }
  
  if (middleDates.value.length > 0) {
    const datesString = formatMiddleDatesForInstructions()
    emit('dates-updated', datesString)
  }
  
  closeDatePicker()
}

// Calendar navigation
const previousMonth = () => {
  currentDate.value = new Date(
    currentDate.value.getFullYear(),
    currentDate.value.getMonth() - 1,
    1
  )
}

const nextMonth = () => {
  currentDate.value = new Date(
    currentDate.value.getFullYear(),
    currentDate.value.getMonth() + 1,
    1
  )
}

// Date picker visibility
const toggleDatePicker = () => {
  if (props.disabled) return
  showDatePicker.value = !showDatePicker.value
}

const closeDatePicker = () => {
  showDatePicker.value = false
}

// Formatting functions
const formatDate = (date) => {
  if (!date) return ''
  
  try {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  } catch (error) {
    return date.toString()
  }
}

const formatMiddleDatesForInstructions = () => {
  return middleDates.value.map(date => {
    return date.toISOString().split('T')[0]
  }).join(', ')
}

// Update functions
const updatePaymentMethod = (value) => {
  emit('update:paymentMethod', value)
  if (value) {
    showPaymentError.value = false
  }
}

const updateDiscount = (value) => {
  const discountValue = parseFloat(value) || 0
  emit('update:discount', Math.min(Math.max(discountValue, 0), 100))
  emit('discount-change')
}

const handleFrequencyChange = (event) => {
  if (isPrintMedia.value) {
    emit('update:frequency', 1)
    return
  }
  
  const value = parseInt(event.target.value) || 1
  emit('update:frequency', value)
  emit('frequency-change', value)
  
  if (value) {
    showFrequencyError.value = false
  }
}

const adjustFrequency = (change) => {
  if (isPrintMedia.value) return
  
  const newFrequency = parseInt(props.frequency) + change
  if (newFrequency >= 1) {
    emit('update:frequency', newFrequency)
    emit('frequency-adjust', newFrequency)
    
    if (newFrequency) {
      showFrequencyError.value = false
    }
  }
}

// Calculate subtotal with dates
const calculateSubtotalWithDates = () => {
  if (!props.priceCalculation) return 0
  
  const dateCount = selectedDates.value.length > 0 ? selectedDates.value.length : 1
  const baseSubtotal = props.priceCalculation.subtotal || props.priceCalculation.basePrice
  
  return baseSubtotal * dateCount
}

// Calculate discount amount
const calculateDiscountAmount = () => {
  if (!props.priceCalculation || !props.discount) return 0
  
  const subtotalWithDates = calculateSubtotalWithDates()
  const withSurcharge = subtotalWithDates + (props.priceCalculation.surcharge || 0)
  const discountPercentage = parseFloat(props.discount) / 100
  
  return withSurcharge * discountPercentage
}

// Calculate final total
const calculateFinalTotal = () => {
  if (!props.priceCalculation) return 0
  
  const subtotalWithDates = calculateSubtotalWithDates()
  const withSurcharge = subtotalWithDates + (props.priceCalculation.surcharge || 0)
  const discountAmount = calculateDiscountAmount()
  
  return withSurcharge - discountAmount
}

const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return `${props.currency} 0`
  
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: props.currency || 'UGX',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

// Expose methods
defineExpose({
  hasRequiredFields: computed(() => {
    return selectedDates.value.length > 0 && props.paymentMethod && 
           (isPrintMedia.value || props.frequency) && props.priceCalculation?.total
  }),
  getMiddleDatesForInstructions: formatMiddleDatesForInstructions,
  selectedDates: sortedSelectedDates,
  calculateFinalTotal,
  validateRequiredFields
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
  margin-bottom: 25px;
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
  background: linear-gradient(135deg, #10B981 0%, #34D399 100%);
  color: white;
  font-size: 0.75em;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 20px;
  letter-spacing: 0.5px;
  box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);
}

/* Two-column layout */
.form-row.two-columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 5px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #2A4B8C;
  font-weight: 600;
  font-size: 0.95em;
  letter-spacing: 0.3px;
}

.required {
  color: #FF6B6B;
  font-weight: 700;
}

/* Print Media Note */
.print-media-note {
  color: #F59E0B;
  font-size: 0.8em;
  font-weight: 600;
  margin-left: 6px;
}

/* Date Input Styles */
.date-input-wrapper {
  width: 100%;
}

.multi-date-selector {
  position: relative;
}

.selected-dates-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border: 2px solid #e6e9f4;
  border-radius: 10px;
  background-color: #ffffff;
  cursor: pointer;
  transition: all 0.3s ease;
  min-height: 48px;
}

.selected-dates-header:hover {
  border-color: #4A6FDC;
}

.selected-dates-header.error {
  border-color: #FF6B6B;
  background-color: #FFF5F5;
}

.selected-dates-summary {
  flex: 1;
}

.placeholder-text {
  color: #94A3B8;
  font-style: italic;
}

.date-range-display {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.date-count {
  color: #2D3748;
  font-weight: 600;
  font-size: 0.9em;
}

.date-range {
  color: #64748B;
  font-size: 0.8em;
}

.calendar-icon {
  color: #4A6FDC;
  margin-left: 10px;
}

/* Date Picker Modal */
.date-picker-modal {
  position: absolute;
  top: calc(100% + 5px);
  left: 0;
  width: 100%;
  background: white;
  border-radius: 12px;
  border: 2px solid #e6e9f4;
  box-shadow: 0 10px 25px rgba(42, 75, 140, 0.15);
  z-index: 1000;
  max-height: 500px;
  overflow-y: auto;
}

.date-picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e6e9f4;
  background: linear-gradient(135deg, #F0F4FF 0%, #E6EDFF 100%);
  border-radius: 12px 12px 0 0;
}

.date-picker-header h4 {
  margin: 0;
  color: #2A4B8C;
  font-size: 1em;
  font-weight: 700;
}

.close-picker {
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  border-radius: 4px;
}

.close-picker:hover {
  background: rgba(100, 116, 139, 0.1);
}

.date-picker-controls {
  padding: 12px 16px;
  border-bottom: 1px solid #e6e9f4;
}

.month-navigation {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.nav-button {
  background: linear-gradient(135deg, #8bb1fe 0%, #8bb1fe 100%);
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.nav-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(74, 111, 220, 0.3);
}

.nav-button svg {
  stroke: white;
}

.current-month {
  color: #2A4B8C;
  font-weight: 700;
  font-size: 1em;
}

.date-selection-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.action-button {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.85em;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
}

.clear-dates {
  background: #F7F9FC;
  color: #64748B;
  border: 1px solid #E2E8F0;
}

.clear-dates:hover:not(:disabled) {
  background: #F1F5F9;
  border-color: #CBD5E0;
}

.clear-dates:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.done-button {
  background: linear-gradient(135deg, #10B981 0%, #34D399 100%);
  color: white;
}

.done-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

/* Calendar Grid */
.calendar-grid {
  padding: 12px 16px;
}

.weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  margin-bottom: 8px;
}

.weekday {
  text-align: center;
  color: #64748B;
  font-weight: 600;
  font-size: 0.8em;
  padding: 4px 0;
}

.calendar-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.calendar-day {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  transition: all 0.3s ease;
  font-size: 0.85em;
  font-weight: 500;
  height: 32px;
}

.calendar-day.empty {
  cursor: default;
  background: transparent;
}

.calendar-day.today {
  background: #E6EDFF;
  color: #4A6FDC;
  font-weight: 700;
}

.calendar-day.selected {
  background: linear-gradient(135deg, #4A6FDC 0%, #2A4B8C 100%);
  color: white;
  font-weight: 700;
}

.calendar-day.selected .selected-indicator {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 4px;
  height: 4px;
  background: white;
  border-radius: 50%;
}

.calendar-day.disabled {
  color: #CBD5E0;
  cursor: not-allowed;
  background: #F7F9FC;
}

.calendar-day:not(.empty):not(.disabled):hover {
  background: #F0F4FF;
  color: #4A6FDC;
}

/* Selected Dates List */
.selected-dates-list {
  padding: 12px 16px;
  border-top: 1px solid #e6e9f4;
  background: #F8F9FA;
}

.selected-dates-title {
  color: #2A4B8C;
  font-weight: 600;
  margin-bottom: 8px;
  font-size: 0.9em;
}

.selected-dates-container {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}

.selected-date-tag {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: linear-gradient(135deg, #4A6FDC 0%, #2A4B8C 100%);
  color: white;
  border-radius: 16px;
  font-size: 0.8em;
  font-weight: 500;
}

.remove-date {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
}

.remove-date:hover {
  background: rgba(255, 255, 255, 0.3);
}

.no-dates-selected {
  color: #64748B;
  font-style: italic;
  text-align: center;
  padding: 12px;
  background: white;
  border-radius: 6px;
  border: 1px dashed #CBD5E0;
  font-size: 0.85em;
}

/* Compact Frequency Styles */
.frequency-compact {
  display: flex;
  gap: 8px;
  align-items: center;
}

.frequency-wrapper {
  flex: 1;
  position: relative;
}

.frequency-wrapper input {
  width: 100%;
  padding: 10px 12px;
  border: 2px solid #e6e9f4;
  border-radius: 8px;
  font-size: 0.95em;
  transition: all 0.3s ease;
  background-color: #ffffff;
  color: #2D3748;
  text-align: center;
  height: 42px;
}

.frequency-wrapper input:focus {
  outline: none;
  border-color: #4A6FDC;
  box-shadow: 0 0 0 3px rgba(74, 111, 220, 0.15);
}

.frequency-wrapper input.locked {
  background: linear-gradient(135deg, #FFF5F5 0%, #FEE2E2 100%);
  border-color: #FECACA;
  cursor: not-allowed;
}

.frequency-wrapper input.error {
  border-color: #FF6B6B;
  background-color: #FFF5F5;
}

.frequency-buttons-compact {
  display: flex;
  gap: 4px;
}

.btn-frequency-compact {
  width: 36px;
  height: 42px;
  padding: 0;
  border: none;
  color: white;
  font-size: 1em;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
}

.btn-minus {
  background: linear-gradient(135deg, #FF6B6B 0%, #FF8E8E 100%);
}

.btn-plus {
  background: linear-gradient(135deg, #10B981 0%, #34D399 100%);
}

.btn-frequency-compact:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.btn-frequency-compact:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.print-media-lock-compact {
  width: 36px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #F7F9FC 0%, #EDF2F7 100%);
  border-radius: 8px;
  border: 2px solid #E2E8F0;
}

/* Discount Styles */
.discount-wrapper {
  position: relative;
}

.discount-input {
  width: 100%;
  padding: 10px 35px 10px 12px;
  border: 2px solid #e6e9f4;
  border-radius: 8px;
  font-size: 0.95em;
  transition: all 0.3s ease;
  background-color: #ffffff;
  color: #2D3748;
  text-align: right;
  height: 42px;
}

.discount-input:focus {
  outline: none;
  border-color: #4A6FDC;
  box-shadow: 0 0 0 3px rgba(74, 111, 220, 0.15);
}

.discount-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #4A6FDC;
  font-weight: 600;
  font-size: 1em;
  pointer-events: none;
}

/* Payment Method Styles */
.payment-select-wrapper {
  position: relative;
}

.payment-select-wrapper .styled-select {
  width: 100%;
  padding: 10px 35px 10px 12px;
  border: 2px solid #e6e9f4;
  border-radius: 8px;
  font-size: 0.95em;
  transition: all 0.3s ease;
  background-color: #ffffff;
  color: #2D3748;
  appearance: none;
  cursor: pointer;
  height: 42px;
}

.payment-select-wrapper .styled-select:focus {
  outline: none;
  border-color: #4A6FDC;
  box-shadow: 0 0 0 3px rgba(74, 111, 220, 0.15);
}

.payment-select-wrapper .styled-select.error {
  border-color: #FF6B6B;
  background-color: #FFF5F5;
}

.payment-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: #4A6FDC;
  display: flex;
  align-items: center;
}

/* Help Text with Prompt */
.help-text {
  display: block;
  margin-top: 4px;
  color: #64748B;
  font-size: 0.8em;
}

.payment-prompt {
  color: #4A6FDC;
  font-weight: 500;
  background: #E6EDFF;
  padding: 4px 8px;
  border-radius: 4px;
  margin-top: 6px;
}

.prompt-icon {
  margin-right: 4px;
}

/* Field Error */
.field-error {
  color: #FF6B6B;
  font-size: 0.8em;
  font-weight: 500;
  margin-top: 4px;
  padding-left: 4px;
}

/* Compact Date Summary */
.date-summary-compact {
  margin-top: 15px;
  padding: 10px 12px;
  background: linear-gradient(135deg, #F0F4FF 0%, #E6EDFF 100%);
  border-radius: 8px;
  border: 1px solid #D6E4FF;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.date-summary-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.date-summary-header .summary-label {
  color: #2A4B8C;
  font-weight: 600;
  font-size: 0.9em;
}

.date-count-badge {
  background: linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%);
  color: white;
  font-size: 0.7em;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 12px;
}

.date-summary-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.date-range-compact {
  color: #2D3748;
  font-weight: 500;
  font-size: 0.85em;
}

.middle-dates-compact {
  color: #4A6FDC;
  font-size: 0.8em;
  font-weight: 600;
  padding: 2px 6px;
  background: white;
  border-radius: 12px;
}

/* Required Fields Summary */
.required-summary {
  margin-top: 15px;
  padding: 10px 12px;
  background: linear-gradient(135deg, #FFF5F5 0%, #FEE2E2 100%);
  border-radius: 8px;
  border: 1px solid #FECACA;
  display: flex;
  align-items: center;
  gap: 10px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
}

.summary-icon {
  font-size: 1.2em;
}

.summary-message {
  color: #991B1B;
  font-size: 0.9em;
  font-weight: 500;
}

.required-star {
  color: #FF6B6B;
  font-weight: 700;
}

/* Price Calculator Section */
.price-calculator-section {
  margin-top: 25px;
  padding: 20px;
  background: linear-gradient(135deg, #F0F4FF 0%, #E6EDFF 100%);
  border-radius: 12px;
  border: 1px solid #D6E4FF;
  box-shadow: 0 4px 6px rgba(74, 111, 220, 0.1);
}

.no-price-info {
  text-align: center;
  padding: 20px;
  color: #64748B;
  font-style: italic;
}

.price-placeholder-icon {
  margin-bottom: 10px;
  opacity: 0.5;
}

.price-summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 2px solid #D6E4FF;
}

.price-summary-header h4 {
  margin: 0;
  color: #2A4B8C;
  font-size: 1em;
  font-weight: 700;
}

.currency-badge {
  background: linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%);
  color: white;
  font-size: 0.75em;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
}

.price-summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding: 8px 12px;
  background: white;
  border-radius: 6px;
  border: 1px solid #E2E8F0;
  font-size: 0.9em;
}

.price-summary-item.surcharge-item {
  background: linear-gradient(135deg, #FFF5F5 0%, #FEE2E2 100%);
  border-color: #FECACA;
}

.price-summary-item.discount-item {
  background: linear-gradient(135deg, #F0FFF4 0%, #E6FFFA 100%);
  border-color: #9AE6B4;
}

.price-summary-item.date-count-item {
  background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%);
  border-color: #BFDBFE;
}

.price-summary-item span {
  color: #64748B;
  font-weight: 500;
}

.price-summary-item strong {
  color: #2D3748;
  font-weight: 600;
}

.base-price {
  color: #10B981;
  font-weight: 700;
}

.surcharge-price {
  color: #EF4444;
  font-weight: 700;
}

.discount-price {
  color: #10B981;
  font-weight: 700;
}

.price-summary-item.total {
  margin-top: 15px;
  padding: 12px;
  background: linear-gradient(135deg, #2A4B8C 0%, #4A6FDC 100%);
  border: none;
  color: white;
}

.total-label span {
  color: white;
  font-weight: 600;
}

.total-amount {
  display: flex;
  align-items: center;
  gap: 8px;
}

.total-amount strong {
  color: white;
  font-weight: 700;
  font-size: 1.1em;
}

.total-badge {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  font-size: 0.7em;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
}

/* Responsive Styles */
@media (max-width: 768px) {
  .form-section {
    padding: 20px;
  }
  
  .form-row.two-columns {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .date-picker-modal {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 90%;
    max-height: 80vh;
  }
  
  .frequency-compact {
    flex-wrap: wrap;
  }
  
  .frequency-buttons-compact {
    width: 100%;
    justify-content: center;
  }
  
  .btn-frequency-compact {
    flex: 1;
  }
}
</style>