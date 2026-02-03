<!-- components/clerk/SchedulePricing.vue -->
<template>
  <div class="form-section">
    <div class="section-header">
      <h3 class="section-title">Schedule & Pricing</h3>
      <div class="section-badge">Financial</div>
    </div>
    
    <div class="form-row">
      <div class="form-group">
        <label>Advert Dates <span class="required">*</span></label>
        <div class="date-input-wrapper">
          <div class="multi-date-selector">
            <div class="selected-dates-header" @click="toggleDatePicker">
              <div class="selected-dates-summary">
                <template v-if="selectedDates.length === 0">
                  <span class="placeholder-text">Select advert dates</span>
                </template>
                <template v-else>
                  <div class="date-range-display">
                    <span class="date-count">{{ selectedDates.length }} date(s) selected</span>
                    <span class="date-range">
                      {{ formatDate(earliestDate) }} to {{ formatDate(latestDate) }}
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
                        'range-start': day.isRangeStart,
                        'range-end': day.isRangeEnd,
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
            Click to select multiple dates. First date = Start, Last date = End, Others will be added to notes.
          </small>
        </div>
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label>
          Frequency
          <span v-if="isPrintMedia" class="print-media-note">(Print Media: Fixed at 1)</span>
        </label>
        <div class="input-with-buttons">
          <div class="frequency-wrapper">
            <input 
              :value="frequency"
              type="number" 
              placeholder="Number of insertions/spots" 
              min="1" 
              @change="handleFrequencyChange($event)"
              :disabled="!rateCardId || disabled || priceLoading || isPrintMedia"
              :class="{ 'locked': isPrintMedia }"
            >
            <div class="frequency-label">times</div>
          </div>
          <div class="frequency-buttons" v-if="!isPrintMedia">
            <button 
              type="button" 
              class="btn-frequency btn-minus"
              @click="adjustFrequency(-1)"
              :disabled="frequency <= 1 || !rateCardId || disabled"
            >
              <svg width="14" height="2" viewBox="0 0 14 2" fill="none">
                <path d="M1 1H13" stroke="white" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
            <button 
              type="button" 
              class="btn-frequency btn-plus"
              @click="adjustFrequency(1)"
              :disabled="!rateCardId || disabled"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1V13M1 7H13" stroke="white" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
          <div class="print-media-lock" v-else>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect x="5" y="11" width="14" height="10" rx="2" stroke="#94A3B8" stroke-width="2"/>
              <path d="M8 11V7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7V11" stroke="#94A3B8" stroke-width="2"/>
              <circle cx="12" cy="16" r="1" fill="#94A3B8"/>
            </svg>
          </div>
        </div>
        <small class="help-text">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style="vertical-align: middle; margin-right: 4px;">
            <circle cx="6" cy="6" r="5" stroke="#7C8DB5" stroke-width="1.5"/>
            <path d="M6 4V6M6 8H6.005" stroke="#7C8DB5" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          <span v-if="isPrintMedia">Print media adverts run once per selected date</span>
          <span v-else>Number of times the advert will run</span>
        </small>
      </div>
      
      <div class="form-group">
        <label>Discount (%)</label>
        <div class="discount-wrapper">
          <input 
            :value="discount"
            type="number" 
            placeholder="Enter discount percentage" 
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
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style="vertical-align: middle; margin-right: 4px;">
            <circle cx="6" cy="6" r="5" stroke="#7C8DB5" stroke-width="1.5"/>
            <path d="M6 4V6M6 8H6.005" stroke="#7C8DB5" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          Apply a percentage discount (0-100%)
        </small>
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label>Payment Method <span class="required">*</span></label>
        <div class="payment-select-wrapper">
          <select 
            :value="paymentMethod" 
            required
            :disabled="disabled"
            @change="updatePaymentMethod($event.target.value)"
            class="styled-select"
          >
            <option value="">Select payment method</option>
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
      </div>
    </div>

    <!-- Date Summary Display -->
    <div v-if="selectedDates.length > 0" class="date-summary-section">
      <div class="date-summary-header">
        <h4>Date Summary</h4>
        <div class="date-count-badge">{{ selectedDates.length }} dates</div>
      </div>
      
      <div class="date-summary-content">
        <div class="summary-row">
          <div class="summary-item">
            <span class="summary-label">Start Date:</span>
            <span class="summary-value start-date">{{ formatDate(earliestDate) }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">End Date:</span>
            <span class="summary-value end-date">{{ formatDate(latestDate) }}</span>
          </div>
        </div>
        
        <div v-if="middleDates.length > 0" class="middle-dates-summary">
          <span class="summary-label">Additional Dates:</span>
          <div class="middle-dates-list">
            <span 
              v-for="(date, index) in middleDates" 
              :key="date.toISOString()"
              class="middle-date"
            >
              {{ formatDate(date) }}
              <span v-if="index < middleDates.length - 1">, </span>
            </span>
          </div>
          <small class="summary-note">
            These dates will be added to special instructions as: dates[{{ formatMiddleDatesForInstructions() }}]
          </small>
        </div>
      </div>
    </div>

    <!-- Price Calculator -->
    <div class="price-calculator-section">
      <slot name="price-calculator">
        <!-- Default slot for price calculator -->
        <div class="no-price-info">
          <div class="price-placeholder-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="6" width="18" height="12" rx="2" stroke="#CBD5E0" stroke-width="2"/>
              <path d="M3 10H21" stroke="#CBD5E0" stroke-width="2"/>
              <circle cx="18" cy="12" r="1" fill="#CBD5E0"/>
              <path d="M6 12H9M12 12H15" stroke="#CBD5E0" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
          <p>Select all advert information above to see pricing.</p>
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
            <small>Including all charges</small>
          </div>
          <div class="total-amount">
            <strong>{{ formatCurrency(calculateFinalTotal()) }}</strong>
            <div class="total-badge">Final Price</div>
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
  'dates-updated'
])

// Reactive state for date picker
const showDatePicker = ref(false)
const currentDate = ref(new Date())
const selectedDates = ref([])

// Computed: Check if platform is print media
const isPrintMedia = computed(() => {
  return props.platformCategory === 'print'
})

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
      isEmpty: false,
      isRangeStart: false,
      isRangeEnd: false
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

// Existing functions
const updateEndDate = (value) => {
  emit('update:endDate', value)
}

const updatePaymentMethod = (value) => {
  emit('update:paymentMethod', value)
}

const updateDiscount = (value) => {
  const discountValue = parseFloat(value) || 0
  emit('update:discount', Math.min(Math.max(discountValue, 0), 100)) // Clamp between 0 and 100
  emit('discount-change')
}

const handleStartDateChange = (event) => {
  const value = event.target.value
  emit('update:startDate', value)
  
  if (props.endDate && new Date(props.endDate) < new Date(value)) {
    emit('update:endDate', value)
  }
}

const handleFrequencyChange = (event) => {
  // For print media, always keep frequency at 1
  if (isPrintMedia.value) {
    emit('update:frequency', 1)
    return
  }
  
  const value = parseInt(event.target.value) || 1
  emit('update:frequency', value)
  emit('frequency-change', value)
}

const adjustFrequency = (change) => {
  // Don't allow frequency adjustment for print media
  if (isPrintMedia.value) return
  
  const newFrequency = parseInt(props.frequency) + change
  if (newFrequency >= 1) {
    emit('update:frequency', newFrequency)
    emit('frequency-adjust', newFrequency)
  }
}

// Calculate subtotal with dates
const calculateSubtotalWithDates = () => {
  if (!props.priceCalculation) return 0
  
  const dateCount = selectedDates.value.length > 0 ? selectedDates.value.length : 1
  const baseSubtotal = props.priceCalculation.subtotal || props.priceCalculation.basePrice
  
  return baseSubtotal * dateCount
}

// Calculate discount amount based on subtotal with dates
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

const formatPriceWithDetails = (amount) => {
  if (!amount && amount !== 0) return `${props.currency} 0`
  
  let priceText = formatCurrency(amount)
  
  if (props.rateCardDetails && props.rateCardDetails.details) {
    const details = props.rateCardDetails.details
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

// Expose computed property for validation
defineExpose({
  hasRequiredFields: computed(() => {
    return selectedDates.value.length > 0 && props.paymentMethod && props.priceCalculation?.total
  }),
  getMiddleDatesForInstructions: formatMiddleDatesForInstructions,
  selectedDates: sortedSelectedDates,
  calculateFinalTotal
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
  background: linear-gradient(135deg, #10B981 0%, #34D399 100%);
  color: white;
  font-size: 0.75em;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 20px;
  letter-spacing: 0.5px;
  box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);
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

/* Print Media Specific Styles */
.print-media-note {
  color: #F59E0B;
  font-size: 0.85em;
  font-weight: 600;
  margin-left: 8px;
}

.frequency-wrapper input.locked {
  background: linear-gradient(135deg, #FFF5F5 0%, #FEE2E2 100%);
  border-color: #FECACA;
  cursor: not-allowed;
}

.print-media-lock {
  width: 50px;
  height: 104px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #F7F9FC 0%, #EDF2F7 100%);
  border-radius: 10px;
  border: 2px solid #E2E8F0;
}

/* Multi Date Selector Styles */
.date-input-wrapper {
  max-width: 600px;
  min-width: 400px;
}

.multi-date-selector {
  position: relative;
}

.selected-dates-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border: 2px solid #e6e9f4;
  border-radius: 10px;
  background-color: #ffffff;
  cursor: pointer;
  transition: all 0.3s ease;
}

.selected-dates-header:hover {
  border-color: #4A6FDC;
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
  gap: 4px;
}

.date-count {
  color: #2D3748;
  font-weight: 600;
  font-size: 0.95em;
}

.date-range {
  color: #64748B;
  font-size: 0.85em;
}

.calendar-icon {
  color: #4A6FDC;
}

/* Date Picker Modal */
.date-picker-modal {
  position: absolute;
  top: calc(100% + 8px);
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
  padding: 16px;
  border-bottom: 1px solid #e6e9f4;
  background: linear-gradient(135deg, #F0F4FF 0%, #E6EDFF 100%);
  border-radius: 12px 12px 0 0;
}

.date-picker-header h4 {
  margin: 0;
  color: #2A4B8C;
  font-size: 1.1em;
  font-weight: 700;
}

.close-picker {
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.3s ease;
}

.close-picker:hover {
  background: rgba(100, 116, 139, 0.1);
}

.date-picker-controls {
  padding: 16px;
  border-bottom: 1px solid #e6e9f4;
}

.month-navigation {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.nav-button {
  background: linear-gradient(135deg, #8bb1fe 0%, #8bb1fe 100%);
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #000805;
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
  font-size: 1.1em;
}

.date-selection-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.action-button {
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 0.9em;
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
  padding: 16px;
}

.weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
  margin-bottom: 12px;
}

.weekday {
  text-align: center;
  color: #64748B;
  font-weight: 600;
  font-size: 0.9em;
  padding: 8px 0;
}

.calendar-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
}

.calendar-day {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  cursor: pointer;
  position: relative;
  transition: all 0.3s ease;
  font-size: 0.9em;
  font-weight: 500;
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
  top: 4px;
  right: 4px;
  width: 6px;
  height: 6px;
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

.calendar-day.selected:hover {
  background: linear-gradient(135deg, #2A4B8C 0%, #1E3A8A 100%);
}

.day-number {
  position: relative;
  z-index: 1;
}

/* Selected Dates List */
.selected-dates-list {
  padding: 16px;
  border-top: 1px solid #e6e9f4;
  background: #F8F9FA;
}

.selected-dates-title {
  color: #2A4B8C;
  font-weight: 600;
  margin-bottom: 12px;
  font-size: 0.95em;
}

.selected-dates-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.selected-date-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: linear-gradient(135deg, #4A6FDC 0%, #2A4B8C 100%);
  color: white;
  border-radius: 20px;
  font-size: 0.85em;
  font-weight: 500;
}

.remove-date {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
  transition: background 0.3s ease;
}

.remove-date:hover {
  background: rgba(255, 255, 255, 0.3);
}

.remove-date:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.no-dates-selected {
  color: #64748B;
  font-style: italic;
  text-align: center;
  padding: 20px;
  background: white;
  border-radius: 8px;
  border: 1px dashed #CBD5E0;
}

/* Date Summary Section */
.date-summary-section {
  margin-top: 30px;
  padding: 20px;
  background: linear-gradient(135deg, #F0F4FF 0%, #E6EDFF 100%);
  border-radius: 12px;
  border: 1px solid #D6E4FF;
  box-shadow: 0 4px 6px rgba(74, 111, 220, 0.1);
}

.date-summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #D6E4FF;
}

.date-summary-header h4 {
  margin: 0;
  color: #2A4B8C;
  font-size: 1.1em;
  font-weight: 700;
}

.date-count-badge {
  background: linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%);
  color: white;
  font-size: 0.8em;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 20px;
  letter-spacing: 0.5px;
}

.date-summary-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.summary-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.summary-label {
  color: #64748B;
  font-size: 0.9em;
  font-weight: 500;
}

.summary-value {
  color: #2D3748;
  font-weight: 600;
  font-size: 1em;
}

.summary-value.start-date {
  color: #10B981;
  font-weight: 700;
}

.summary-value.end-date {
  color: #EF4444;
  font-weight: 700;
}

.middle-dates-summary {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: white;
  border-radius: 8px;
  border: 1px solid #E2E8F0;
}

.middle-dates-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.middle-date {
  color: #4A6FDC;
  font-weight: 500;
  font-size: 0.9em;
}

.summary-note {
  color: #64748B;
  font-size: 0.85em;
  font-style: italic;
}

/* Help Text */
.help-text {
  display: block;
  margin-top: 8px;
  color: #64748B;
  font-size: 0.85em;
  display: flex;
  align-items: center;
}

/* Frequency Input */
.input-with-buttons {
  display: flex;
  gap: 12px;
}

.frequency-wrapper {
  flex: 1;
  position: relative;
}

.frequency-wrapper input {
  width: 100%;
  padding: 14px 16px 14px 16px;
  border: 2px solid #e6e9f4;
  border-radius: 10px;
  font-size: 1em;
  transition: all 0.3s ease;
  background-color: #ffffff;
  color: #2D3748;
  text-align: center;
}

.frequency-wrapper input:focus {
  outline: none;
  border-color: #4A6FDC;
  box-shadow: 0 0 0 3px rgba(74, 111, 220, 0.15);
}

.frequency-wrapper input:disabled {
  background-color: #F7F9FC;
  cursor: not-allowed;
  opacity: 0.7;
  border-color: #E2E8F0;
}

.frequency-label {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: #64748B;
  font-size: 0.9em;
  font-weight: 500;
  pointer-events: none;
}

.frequency-buttons {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.btn-frequency {
  width: 50px;
  height: 50px;
  padding: 0;
  border: none;
  color: white;
  font-size: 1.2em;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
}

.btn-minus {
  background: linear-gradient(135deg, #FF6B6B 0%, #FF8E8E 100%);
}

.btn-plus {
  background: linear-gradient(135deg, #10B981 0%, #34D399 100%);
}

.btn-frequency:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.btn-frequency:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

/* Discount Wrapper */
.discount-wrapper {
  position: relative;
}

.discount-input {
  width: 100%;
  padding: 14px 45px 14px 16px;
  border: 2px solid #e6e9f4;
  border-radius: 10px;
  font-size: 1em;
  transition: all 0.3s ease;
  background-color: #ffffff;
  color: #2D3748;
  text-align: right;
}

.discount-input:focus {
  outline: none;
  border-color: #4A6FDC;
  box-shadow: 0 0 0 3px rgba(74, 111, 220, 0.15);
}

.discount-input:disabled {
  background-color: #F7F9FC;
  cursor: not-allowed;
  opacity: 0.7;
  border-color: #E2E8F0;
}

.discount-icon {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: #4A6FDC;
  font-weight: 600;
  font-size: 1.1em;
  pointer-events: none;
}

/* Payment Method Selector */
.payment-select-wrapper {
  position: relative;
}

.payment-select-wrapper .styled-select {
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

.payment-select-wrapper .styled-select:focus {
  outline: none;
  border-color: #4A6FDC;
  box-shadow: 0 0 0 3px rgba(74, 111, 220, 0.15);
}

.payment-select-wrapper .styled-select:disabled {
  background-color: #F7F9FC;
  cursor: not-allowed;
  opacity: 0.7;
  border-color: #E2E8F0;
}

.payment-icon {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: #4A6FDC;
}

/* Price Calculator Section */
.price-calculator-section {
  margin-top: 30px;
  padding: 25px;
  background: linear-gradient(135deg, #F0F4FF 0%, #E6EDFF 100%);
  border-radius: 12px;
  border: 1px solid #D6E4FF;
  box-shadow: 0 4px 6px rgba(74, 111, 220, 0.1);
}

.no-price-info {
  text-align: center;
  padding: 30px 20px;
  color: #64748B;
  font-style: italic;
}

.price-placeholder-icon {
  margin-bottom: 15px;
  opacity: 0.5;
}

.price-summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #D6E4FF;
}

.price-summary-header h4 {
  margin: 0;
  color: #2A4B8C;
  font-size: 1.1em;
  font-weight: 700;
}

.currency-badge {
  background: linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%);
  color: white;
  font-size: 0.8em;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 6px;
  letter-spacing: 0.5px;
}

.price-summary {
  padding-top: 15px;
}

.price-summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding: 12px 15px;
  background: white;
  border-radius: 8px;
  border: 1px solid #E2E8F0;
  font-size: 0.95em;
  transition: all 0.3s ease;
}

.price-summary-item:hover {
  border-color: #4A6FDC;
  box-shadow: 0 2px 8px rgba(74, 111, 220, 0.1);
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

.price-summary-item .base-price {
  color: #10B981;
  font-weight: 700;
}

.price-summary-item .surcharge-price {
  color: #EF4444;
  font-weight: 700;
}

.price-summary-item .discount-price {
  color: #10B981;
  font-weight: 700;
}

.price-summary-item.date-count-item strong {
  color: #3B82F6;
  font-weight: 700;
}

.price-summary-item.total {
  margin-top: 20px;
  padding: 20px;
  background: linear-gradient(135deg, #2A4B8C 0%, #4A6FDC 100%);
  border: none;
  color: white;
  font-size: 1.1em;
}

.price-summary-item.total:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(42, 75, 140, 0.25);
}

.total-label {
  display: flex;
  flex-direction: column;
}

.total-label span {
  color: white;
  font-weight: 600;
  font-size: 1.1em;
}

.total-label small {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.85em;
  margin-top: 4px;
}

.total-amount {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.total-amount strong {
  color: white;
  font-weight: 700;
  font-size: 1.3em;
  margin-bottom: 5px;
}

.total-badge {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  font-size: 0.75em;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
  backdrop-filter: blur(4px);
}

/* Responsive Styles */
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
  
  .input-with-buttons {
    flex-direction: column;
  }
  
  .frequency-buttons {
    flex-direction: row;
    width: 100%;
  }
  
  .btn-frequency {
    flex: 1;
    height: 44px;
  }
  
  .print-media-lock {
    width: 100%;
    height: 44px;
  }
  
  .price-calculator-section {
    padding: 20px;
  }
  
  .date-picker-modal {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 90%;
    max-height: 80vh;
  }
  
  .summary-row {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .price-summary-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .price-summary-item span,
  .price-summary-item strong {
    width: 100%;
    text-align: left;
  }
  
  .total-amount {
    align-items: flex-start;
  }
}

@media (max-width: 480px) {
  .calendar-days {
    gap: 4px;
  }
  
  .calendar-day {
    font-size: 0.8em;
  }
  
  .selected-date-tag {
    font-size: 0.8em;
  }
  
  .date-summary-section {
    padding: 15px;
  }
  
  .price-summary-item {
    padding: 10px;
    font-size: 0.9em;
  }
  
  .price-summary-item.total {
    padding: 15px;
  }
}
</style>