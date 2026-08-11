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

      <!-- Discount (agreed amount is the default entry method; percentage remains available) -->
      <div class="form-group">
        <label>
          Discount
          <div class="discount-mode-toggle">
            <button
              type="button"
              class="mode-btn"
              :class="{ active: discountMode === 'amount' }"
              :disabled="!rateCardId || disabled || priceLoading"
              @click="setDiscountMode('amount')"
            >Agreed Amount</button>
            <button
              type="button"
              class="mode-btn"
              :class="{ active: discountMode === 'percentage' }"
              :disabled="!rateCardId || disabled || priceLoading"
              @click="setDiscountMode('percentage')"
            >Percentage</button>
          </div>
        </label>

        <div v-if="discountMode === 'amount'" class="agreed-amount-wrapper">
          <div class="agreed-amount-currency">{{ currency }}</div>
          <input
            :value="agreedAmountDisplay"
            type="text"
            inputmode="numeric"
            placeholder="Amount customer pays"
            @input="updateAgreedAmount($event.target.value)"
            :disabled="!rateCardId || disabled || priceLoading"
            class="agreed-amount-input"
          >
        </div>
        <div v-else class="discount-wrapper">
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

        <small v-if="discountMode === 'amount'" class="help-text">
          Enter what the customer pays — discount is computed automatically
          <span v-if="discount > 0">({{ Number(discount).toFixed(1) }}%)</span>
        </small>
        <small v-else class="help-text">
          Apply percentage discount (optional)
        </small>
        <div v-if="agreedAmountExceedsBase" class="field-error">
          ⚠️ Agreed amount can't exceed the calculated price of {{ formatCurrency(priceBeforeDiscount) }} — discount set to 0%
        </div>
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
          <span>Discount ({{ Number(discount).toFixed(1) }}%):</span>
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

// Discount entry mode. 'amount' (agreed amount the customer pays, system
// derives the discount %) is the default per team preference; 'percentage'
// (type the % directly, as before) remains available. Only `discount` (a
// percentage) is ever emitted to the parent — the parent, backend, and PDF
// summary are unaffected by which entry method produced that percentage.
const discountMode = ref('amount')
const agreedAmount = ref(null)

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

// Serializes a Date as YYYY-MM-DD using its LOCAL year/month/day, never
// converting through UTC. toISOString() converts to UTC first, which
// silently shifts the date backward by a day in any timezone ahead of UTC
// (e.g. Uganda, UTC+3) - selecting Aug 12 at local midnight serializes to
// "2026-08-11". This is the actual date string sent to the backend via
// update:startDate/endDate/datesList, so the bug was real, not cosmetic.
const toLocalDateString = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Inverse of toLocalDateString: parses a YYYY-MM-DD string as LOCAL midnight
// by constructing the Date from its components directly, rather than
// `new Date(dateStr)`, which the JS spec parses as UTC midnight for
// date-only ISO strings - correct only by coincidence in timezones ahead of
// UTC, and wrong (shifts a day earlier) in any timezone behind UTC.
const fromLocalDateString = (dateStr) => {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

// Initialize selected dates from props
watch(() => props.datesList, (newDates) => {
  if (newDates && newDates.length > 0) {
    selectedDates.value = newDates.map(fromLocalDateString).sort((a, b) => a - b)
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
    const dateString = toLocalDateString(date)
    const isToday = date.toDateString() === today.toDateString()
    const isSelected = selectedDates.value.some(
      selectedDate => selectedDate.toDateString() === date.toDateString()
    )
    // Print media needs at least one day of lead time - today's date can't
    // be selected as a run date, only tomorrow onward. Other platforms
    // (TV, radio, web, billboard) can still book same-day.
    const isBlockedForPrint = isPrintMedia.value && isToday
    const isDisabled = (props.minDate && date < fromLocalDateString(props.minDate)) || isBlockedForPrint
    
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
  const dateStrings = sortedSelectedDates.value.map(toLocalDateString)
  
  emit('update:datesList', dateStrings)
  
  if (earliestDate.value) {
    emit('update:startDate', toLocalDateString(earliestDate.value))
  } else {
    emit('update:startDate', '')
  }
  
  if (latestDate.value) {
    emit('update:endDate', toLocalDateString(latestDate.value))
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
  return middleDates.value.map(toLocalDateString).join(', ')
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

// Calculate subtotal with dates
const calculateSubtotalWithDates = () => {
  if (!props.priceCalculation) return 0
  
  const dateCount = selectedDates.value.length > 0 ? selectedDates.value.length : 1
  const baseSubtotal = props.priceCalculation.subtotal || props.priceCalculation.basePrice
  
  return baseSubtotal * dateCount
}

// Price before any discount is applied (subtotal across all
// selected dates, plus surcharge). Single source of truth used by the
// discount-amount calc, the final total, and the agreed-amount back
// calculation below - previously duplicated inline in three places.
const priceBeforeDiscount = computed(() => {
  if (!props.priceCalculation) return 0
  return calculateSubtotalWithDates() + (props.priceCalculation.surcharge || 0)
})

// Calculate discount amount
const calculateDiscountAmount = () => {
  if (!props.priceCalculation || !props.discount) return 0
  
  const discountPercentage = parseFloat(props.discount) / 100
  
  return priceBeforeDiscount.value * discountPercentage
}

// Calculate final total
const calculateFinalTotal = () => {
  if (!props.priceCalculation) return 0
  
  const discountAmount = calculateDiscountAmount()
  
  return priceBeforeDiscount.value - discountAmount
}

// True when the clerk has typed an agreed amount greater than what the
// system calculated before discount - can't produce a negative
// discount (a markup), so it's clamped to 0% and flagged here.
const agreedAmountExceedsBase = computed(() => {
  return discountMode.value === 'amount' &&
    agreedAmount.value !== null &&
    priceBeforeDiscount.value > 0 &&
    agreedAmount.value > priceBeforeDiscount.value
})

// Derives the discount % from the agreed amount and emits it via the same
// 'update:discount' contract updateDiscount() uses, so the parent/backend/PDF
// summary keep consuming a plain percentage exactly as before regardless of
// which entry method produced it.
const applyAgreedAmount = () => {
  const base = priceBeforeDiscount.value
  
  if (!base || agreedAmount.value === null) {
    emit('update:discount', 0)
    emit('discount-change')
    return
  }
  
  const discountAmount = base - agreedAmount.value
  const discountPercentage = (discountAmount / base) * 100
  const clamped = Math.min(Math.max(discountPercentage, 0), 100)
  
  // Full precision, unrounded: this percentage gets multiplied back against
  // `base` (often in the millions) to compute the discount amount and final
  // total, so rounding it here (previously to 2dp) reintroduces a real,
  // visible currency error - e.g. a 0.004% rounding error against an
  // 11.3M base becomes a 450 UGX mismatch between what the clerk typed and
  // what the Total Amount displays. Rounding for readability still happens
  // at render time via .toFixed(1) in the template.
  emit('update:discount', clamped)
  emit('discount-change')
}

// Comma-formatted display for the agreed-amount input, so clerks see
// 1,000,000 as they type rather than a raw digit string. The underlying
// agreedAmount stays a plain number - this is display-only.
const agreedAmountDisplay = computed(() => {
  if (agreedAmount.value === null || agreedAmount.value === undefined || isNaN(agreedAmount.value)) {
    return ''
  }
  return Math.trunc(agreedAmount.value).toLocaleString('en-UG')
})

const updateAgreedAmount = (value) => {
  // Strip everything but digits - commas from the display formatting,
  // currency symbols, stray characters from paste, etc. Amounts here are
  // always whole units (matching formatCurrency's 0-decimal formatting
  // elsewhere in this file), so no decimal point is preserved.
  const digitsOnly = String(value).replace(/[^0-9]/g, '')
  const amountValue = digitsOnly ? parseInt(digitsOnly, 10) : NaN
  agreedAmount.value = isNaN(amountValue) ? null : Math.max(amountValue, 0)
  applyAgreedAmount()
}

const setDiscountMode = (mode) => {
  if (mode === discountMode.value) return
  
  if (mode === 'amount') {
    // Seed the agreed-amount field with today's computed final total so
    // switching modes doesn't lose ground - clerk can fine-tune from there.
    agreedAmount.value = priceBeforeDiscount.value > 0 ? calculateFinalTotal() : null
  }
  
  discountMode.value = mode
  
  if (mode === 'amount') {
    applyAgreedAmount()
  }
}

// If the base price shifts (frequency, dates, or surcharge change) while in
// amount mode, re-derive the discount % so the agreed amount keeps
// reflecting what the customer actually pays.
watch(priceBeforeDiscount, () => {
  if (discountMode.value === 'amount' && agreedAmount.value !== null) {
    applyAgreedAmount()
  }
})

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

@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@600&display=swap');

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
  box-shadow: var(--shadow-sm); overflow: visible;
  font-family: var(--font); font-size: 13px;
}

/* Section header */
.section-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 20px; background: var(--navy);
}
.section-title { margin: 0; color: #fff; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .07em; }
.section-badge {
  height: 22px; padding: 0 10px; display: inline-flex; align-items: center;
  background: var(--amber-bg); color: var(--amber-text); border: 1px solid var(--amber-bd);
  border-radius: 1px; font-size: 11px; font-weight: 600; letter-spacing: .03em;
}

/* Two-column grid rows */
.form-row.two-columns {
  display: grid; grid-template-columns: 1fr 1fr;
  border-bottom: 1px solid var(--border-lt);
  overflow: visible;
}

.form-group {
  padding: 14px 20px; border-right: 1px solid var(--border-lt); background: var(--surface);
  overflow: visible; position: relative;
}
.form-group:last-child { border-right: none; }

.form-group > label {
  display: block; margin-bottom: 6px;
  font-size: 11px; font-weight: 600; text-transform: uppercase;
  letter-spacing: .06em; color: var(--text-3);
}
.required { color: var(--red); font-weight: 700; }
.print-media-note { color: var(--text-4); font-size: 10px; font-style: italic; text-transform: none; letter-spacing: 0; font-weight: 400; }

/* ── Date picker trigger ── */
.date-input-wrapper { width: 100%; position: relative; }
.multi-date-selector { position: relative; width: 100%; z-index: 50; }

.selected-dates-header {
  display: flex; align-items: center; justify-content: space-between;
  height: 38px; padding: 0 12px;
  border: 1.5px solid var(--border); border-radius: var(--radius);
  background: var(--surface); cursor: pointer;
  transition: border-color var(--t), box-shadow var(--t); user-select: none;
}
.selected-dates-header:hover { border-color: var(--blue); }
.selected-dates-header.error { border-color: var(--red); background: var(--red-bg); }

.selected-dates-summary { flex: 1; font-size: 13px; color: var(--text-1); }
.placeholder-text { color: var(--text-4); }
.date-range-display { display: flex; align-items: center; gap: 8px; }
.date-count {
  height: 20px; padding: 0 7px; display: inline-flex; align-items: center;
  background: var(--navy); color: #fff; font-size: 10px; font-weight: 700; border-radius: 1px;
}
.date-range { color: var(--text-1); font-weight: 500; font-size: 13px; }
.calendar-icon { opacity: .5; flex-shrink: 0; }

/* ── Date picker modal ── */
.date-picker-modal {
  position: absolute; top: calc(100% + 4px); left: 0; z-index: 9999;
  background: var(--surface); border: 1.5px solid var(--border);
  border-top: 2px solid var(--navy); border-radius: var(--radius);
  box-shadow: 0 8px 32px rgba(0,0,0,.18); width: 340px;
  overflow: visible;
}

.date-picker-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px 14px; background: var(--navy);
}
.date-picker-header h4 { margin: 0; color: #fff; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .07em; }
.close-picker {
  background: none; border: none; color: rgba(255,255,255,.7); cursor: pointer;
  padding: 2px; border-radius: var(--radius); display: flex; align-items: center; transition: color var(--t);
}
.close-picker:hover { color: #fff; }

.date-picker-controls {
  display: flex; justify-content: space-between; align-items: center;
  padding: 8px 12px; background: var(--page-bg); border-bottom: 1px solid var(--border-lt);
}
.month-navigation { display: flex; align-items: center; gap: 8px; }
.nav-button {
  width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;
  background: var(--surface); border: 1.5px solid var(--border); border-radius: var(--radius);
  cursor: pointer; transition: all var(--t);
}
.nav-button:hover { border-color: var(--blue); color: var(--blue); background: var(--blue-lt); }
.current-month { font-size: 12px; font-weight: 700; color: var(--text-1); min-width: 116px; text-align: center; }
.date-selection-actions { display: flex; gap: 6px; }
.action-button {
  height: 28px; padding: 0 12px; border-radius: var(--radius);
  font-family: var(--font); font-size: 11px; font-weight: 600; cursor: pointer;
  border: 1.5px solid var(--border); background: var(--surface); color: var(--text-2);
  transition: all var(--t);
}
.action-button:hover:not(:disabled) { border-color: var(--blue); color: var(--blue); background: var(--blue-lt); }
.action-button:disabled { opacity: .45; cursor: not-allowed; }
.done-button { background: var(--navy); color: #fff; border-color: var(--navy); }
.done-button:hover { background: var(--navy-light); border-color: var(--navy-light); }

/* Calendar grid */
.calendar-grid { padding: 10px; background: var(--surface); }
.weekdays { display: grid; grid-template-columns: repeat(7,1fr); margin-bottom: 4px; gap: 2px; }
.weekday {
  text-align: center; font-size: 10px; font-weight: 700; text-transform: uppercase;
  color: var(--text-4); letter-spacing: .04em; padding: 4px 0;
  background: var(--page-bg); border-radius: var(--radius);
}
.calendar-days { display: grid; grid-template-columns: repeat(7,1fr); gap: 3px; }
.calendar-day {
  position: relative; display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  min-height: 36px; cursor: pointer;
  border: 1px solid var(--border-lt); border-radius: var(--radius);
  background: var(--surface); transition: all var(--t); font-size: 12px;
}
.calendar-day:hover:not(.disabled):not(.empty) { border-color: var(--blue); background: var(--blue-lt); color: var(--blue); }
.calendar-day.today { border-color: var(--blue); font-weight: 700; color: var(--blue); }
.calendar-day.selected { background: var(--navy) !important; border-color: var(--navy) !important; color: #fff; }
.calendar-day.disabled { background: var(--page-bg); color: var(--text-4); cursor: not-allowed; opacity: .5; }
.calendar-day.empty { background: transparent; border-color: transparent; cursor: default; }
.day-number { font-size: 11px; line-height: 1; }
.selected-indicator { position: absolute; bottom: 2px; width: 3px; height: 3px; background: rgba(255,255,255,.6); border-radius: 50%; }

/* Selected dates list */
.selected-dates-list {
  border-top: 1px solid var(--border-lt); padding: 10px;
  background: var(--page-bg);
}
.selected-dates-title {
  font-size: 10px; font-weight: 700; text-transform: uppercase;
  letter-spacing: .06em; color: var(--text-4); margin-bottom: 6px;
}
.selected-dates-container { display: flex; flex-wrap: wrap; gap: 4px; max-height: 100px; overflow-y: auto; }
.selected-date-tag {
  display: inline-flex; align-items: center; gap: 4px;
  height: 22px; padding: 0 8px;
  background: var(--navy); color: #fff;
  border-radius: 1px; font-size: 11px; font-weight: 600;
  font-family: "IBM Plex Mono", monospace;
}
.remove-date {
  background: none; border: none; color: rgba(255,255,255,.7); cursor: pointer;
  padding: 1px; display: flex; align-items: center; justify-content: center;
  transition: color var(--t);
}
.remove-date:hover { color: #fff; }
.remove-date:disabled { opacity: .45; cursor: not-allowed; }
.no-dates-selected { font-size: 11px; color: var(--text-4); font-style: italic; }

/* Help / error */
.help-text { display: flex; align-items: center; margin-top: 6px; font-size: 11px; color: var(--text-4); font-style: italic; }
.field-error { margin-top: 4px; font-size: 11px; color: var(--red-text); font-weight: 600; }

/* Payment select */
.payment-select-wrapper { position: relative; }
.styled-select {
  width: 100%; height: 38px; padding: 0 36px 0 12px;
  border: 1.5px solid var(--border); border-radius: var(--radius);
  font-family: var(--font); font-size: 13px; color: var(--text-1);
  background: var(--surface); appearance: none; cursor: pointer; outline: none;
  transition: border-color var(--t), box-shadow var(--t); box-sizing: border-box;
}
.styled-select:focus { border-color: var(--blue); box-shadow: var(--ring); }
.styled-select:disabled { background: var(--page-bg); color: var(--text-4); cursor: not-allowed; opacity: .7; }
.styled-select.error { border-color: var(--red); background: var(--red-bg); }
.payment-icon { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); pointer-events: none; opacity: .4; }
.payment-prompt { font-style: normal; }
.prompt-icon { margin-right: 4px; }

/* Frequency */
.frequency-compact { display: flex; align-items: center; gap: 6px; }
.frequency-wrapper { flex: 1; }
.frequency-wrapper input {
  width: 100%; height: 38px; padding: 0 12px;
  border: 1.5px solid var(--border); border-radius: var(--radius);
  font-family: var(--font); font-size: 13px; color: var(--text-1);
  background: var(--surface); outline: none; box-sizing: border-box;
  transition: border-color var(--t), box-shadow var(--t);
}
.frequency-wrapper input:focus { border-color: var(--blue); box-shadow: var(--ring); }
.frequency-wrapper input:disabled, .frequency-wrapper input.locked { background: var(--page-bg); color: var(--text-4); cursor: not-allowed; }
.frequency-wrapper input.error { border-color: var(--red); background: var(--red-bg); }

.frequency-buttons-compact { display: flex; gap: 4px; flex-shrink: 0; }
.btn-frequency-compact {
  width: 30px; height: 30px; border: none; border-radius: var(--radius);
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: all var(--t); flex-shrink: 0; font-family: var(--font);
}
.btn-minus { background: var(--red-bg); color: var(--red-text); border: 1px solid var(--red-bd); }
.btn-minus:hover:not(:disabled) { background: var(--red-bd); }
.btn-plus  { background: var(--green-bg); color: var(--green-text); border: 1px solid var(--green-bd); }
.btn-plus:hover:not(:disabled)  { background: var(--green-bd); }
.btn-frequency-compact:disabled { opacity: .45; cursor: not-allowed; }

.print-media-lock-compact { display: flex; align-items: center; color: var(--text-4); opacity: .7; }

/* Discount */
.discount-wrapper { position: relative; display: flex; align-items: center; }
.discount-input {
  width: 100%; height: 38px; padding: 0 28px 0 12px;
  border: 1.5px solid var(--border); border-radius: var(--radius);
  font-family: var(--font); font-size: 13px; color: var(--text-1);
  background: var(--surface); outline: none; box-sizing: border-box;
  transition: border-color var(--t), box-shadow var(--t);
}
.discount-input:focus { border-color: var(--blue); box-shadow: var(--ring); }
.discount-input:disabled { background: var(--page-bg); color: var(--text-4); cursor: not-allowed; }
.discount-icon { position: absolute; right: 10px; color: var(--text-3); font-weight: 700; font-size: 12px; pointer-events: none; }

.discount-mode-toggle { display: flex; gap: 4px; margin-left: auto; text-transform: none; letter-spacing: normal; }
.mode-btn {
  height: 22px; padding: 0 8px; border-radius: var(--radius);
  border: 1px solid var(--border); background: var(--surface); color: var(--text-3);
  font-family: var(--font); font-size: 10px; font-weight: 600; text-transform: uppercase;
  letter-spacing: .04em; cursor: pointer; transition: all var(--t);
}
.mode-btn:hover:not(:disabled) { border-color: var(--blue); color: var(--blue); }
.mode-btn.active { background: var(--navy); border-color: var(--navy); color: #fff; }
.mode-btn:disabled { opacity: .45; cursor: not-allowed; }

.agreed-amount-wrapper { position: relative; display: flex; align-items: center; }
.agreed-amount-currency {
  position: absolute; left: 10px; color: var(--text-3); font-weight: 700; font-size: 11px; pointer-events: none;
}
.agreed-amount-input {
  width: 100%; height: 38px; padding: 0 12px 0 52px;
  border: 1.5px solid var(--border); border-radius: var(--radius);
  font-family: var(--font); font-size: 13px; color: var(--text-1);
  background: var(--surface); outline: none; box-sizing: border-box;
  transition: border-color var(--t), box-shadow var(--t);
}
.agreed-amount-input:focus { border-color: var(--blue); box-shadow: var(--ring); }
.agreed-amount-input:disabled { background: var(--page-bg); color: var(--text-4); cursor: not-allowed; }

/* Date summary compact */
.date-summary-compact {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 20px; background: var(--blue-lt);
  border-top: 1px solid rgba(0,102,204,.15);
  border-bottom: 1px solid rgba(0,102,204,.15);
}
.date-summary-header { display: flex; align-items: center; gap: 6px; }
.date-summary-header .summary-label { color: var(--blue); font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; }
.date-count-badge {
  height: 18px; padding: 0 6px; display: inline-flex; align-items: center;
  background: var(--amber-bg); color: var(--amber-text); border: 1px solid var(--amber-bd);
  font-size: 10px; font-weight: 700; border-radius: 1px;
}
.date-summary-content { display: flex; align-items: center; gap: 8px; }
.date-range-compact { color: var(--text-1); font-weight: 500; font-size: 12px; }
.middle-dates-compact {
  height: 18px; padding: 0 7px; display: inline-flex; align-items: center;
  background: var(--surface); color: var(--blue);
  border: 1px solid rgba(0,102,204,.2); font-size: 10px; font-weight: 700; border-radius: 1px;
}

/* Required summary */
.required-summary {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 20px; background: var(--red-bg);
  border-top: 1px solid var(--red-bd); border-left: 3px solid var(--red);
  font-size: 12px;
}
.summary-icon { font-size: 1em; }
.summary-message { color: var(--red-text); font-weight: 600; }
.required-star { color: var(--red); font-weight: 700; }

/* Price calculator section */
.price-calculator-section { border-top: 2px solid var(--navy); background: var(--surface); }

.no-price-info {
  text-align: center; padding: 24px 16px;
  color: var(--text-4); font-style: italic; font-size: 13px;
  background: var(--page-bg);
}
.no-price-info p { margin: 8px 0 0; }
.price-placeholder-icon { opacity: .3; margin-bottom: 6px; }

.price-summary { background: var(--surface); }
.price-summary-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px 20px; background: var(--page-bg);
  border-bottom: 1px solid var(--border-lt);
}
.price-summary-header h4 { margin: 0; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .07em; color: var(--text-3); }
.currency-badge {
  height: 20px; padding: 0 8px; display: inline-flex; align-items: center;
  background: var(--amber-bg); color: var(--amber-text); border: 1px solid var(--amber-bd);
  font-size: 10px; font-weight: 700; border-radius: 1px; letter-spacing: .04em;
}

.price-summary-item {
  display: flex; justify-content: space-between; align-items: center;
  padding: 9px 20px; border-bottom: 1px solid var(--border-lt); font-size: 13px;
  background: var(--surface); transition: background var(--t);
}
.price-summary-item:nth-child(even) { background: var(--page-bg); }
.price-summary-item span { color: var(--text-3); font-weight: 500; }
.price-summary-item strong { color: var(--text-1); font-weight: 700; font-variant-numeric: tabular-nums; }

.price-summary-item.surcharge-item { background: var(--red-bg) !important; border-left: 3px solid var(--red); }
.price-summary-item.discount-item  { background: var(--green-bg) !important; border-left: 3px solid #16a34a; }
.price-summary-item.date-count-item { background: var(--blue-lt) !important; border-left: 3px solid var(--blue); }

.base-price      { color: var(--green-text) !important; }
.surcharge-price { color: var(--red-text) !important; }
.discount-price  { color: var(--green-text) !important; }

.price-summary-item.total {
  background: var(--navy) !important; border: none;
  border-top: 2px solid var(--navy-light); padding: 12px 20px;
}
.total-label span { color: rgba(255,255,255,.75) !important; font-weight: 600; }
.total-amount { display: flex; align-items: center; gap: 8px; }
.total-amount strong { color: #fff !important; font-weight: 700; font-size: 14px; font-variant-numeric: tabular-nums; }
.total-badge {
  height: 20px; padding: 0 7px; display: inline-flex; align-items: center;
  background: rgba(255,255,255,.15); color: #fff;
  font-size: 10px; font-weight: 700; border-radius: 1px;
}

@media (max-width: 768px) {
  .form-row.two-columns { grid-template-columns: 1fr; }
  .form-group { border-right: none; border-bottom: 1px solid var(--border-lt); }
  .section-header { flex-direction: column; align-items: flex-start; gap: 6px; }
  .date-picker-modal { position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 92%; max-width: 360px; max-height: 90vh; overflow-y: auto; }
  .frequency-compact { flex-wrap: wrap; }
  .frequency-buttons-compact { width: 100%; justify-content: center; }
  .btn-frequency-compact { flex: 1; }
}

</style>