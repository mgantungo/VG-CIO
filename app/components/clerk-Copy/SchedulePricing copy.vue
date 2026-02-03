<!-- components/clerk/SchedulePricing.vue -->
<template>
  <div class="form-section">
    <div class="section-header">
      <h3 class="section-title">Schedule & Pricing</h3>
      <div class="section-badge">Financial</div>
    </div>
    
    <div class="form-row">
      <div class="form-group">
        <label>Start Date <span class="required">*</span></label>
        <div class="date-input-wrapper">
          <input 
            :value="startDate"
            type="date" 
            required
            :min="minDate"
            :disabled="disabled"
            @change="handleStartDateChange($event)"
          >
          <div class="date-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="4" width="18" height="18" rx="2" stroke="#4A6FDC" stroke-width="2"/>
              <path d="M3 10H21" stroke="#4A6FDC" stroke-width="2"/>
              <path d="M8 2V6" stroke="#4A6FDC" stroke-width="2" stroke-linecap="round"/>
              <path d="M16 2V6" stroke="#4A6FDC" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
        </div>
      </div>
      <div class="form-group">
        <label>End Date</label>
        <div class="date-input-wrapper">
          <input 
            :value="endDate"
            type="date"
            :min="startDate || minDate"
            :disabled="disabled"
            @change="updateEndDate($event.target.value)"
          >
          <div class="date-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="4" width="18" height="18" rx="2" stroke="#4A6FDC" stroke-width="2"/>
              <path d="M3 10H21" stroke="#4A6FDC" stroke-width="2"/>
              <path d="M8 2V6" stroke="#4A6FDC" stroke-width="2" stroke-linecap="round"/>
              <path d="M16 2V6" stroke="#4A6FDC" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
        </div>
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label>Frequency</label>
        <div class="input-with-buttons">
          <div class="frequency-wrapper">
            <input 
              :value="frequency"
              type="number" 
              placeholder="Number of insertions/spots" 
              min="1" 
              @change="handleFrequencyChange($event)"
              :disabled="!rateCardId || disabled || priceLoading"
            >
            <div class="frequency-label">times</div>
          </div>
          <div class="frequency-buttons">
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
        </div>
        <small class="help-text">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style="vertical-align: middle; margin-right: 4px;">
            <circle cx="6" cy="6" r="5" stroke="#7C8DB5" stroke-width="1.5"/>
            <path d="M6 4V6M6 8H6.005" stroke="#7C8DB5" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          Number of times the advert will run
        </small>
      </div>
      
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
        <div class="price-summary-item">
          <span>Frequency (×{{ frequency }}):</span>
          <strong>{{ formatCurrency(priceCalculation.subtotal) }}</strong>
        </div>
        <div v-if="priceCalculation.surcharge > 0" class="price-summary-item surcharge-item">
          <span>Surcharge ({{ priceCalculation.surchargePercentage }}%):</span>
          <strong class="surcharge-price">{{ formatCurrency(priceCalculation.surcharge) }}</strong>
        </div>
        <div class="price-summary-item total">
          <div class="total-label">
            <span>Total Amount:</span>
            <small>Including all charges</small>
          </div>
          <div class="total-amount">
            <strong>{{ formatPriceWithDetails(priceCalculation.total) }}</strong>
            <div class="total-badge">Final Price</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, computed } from 'vue'

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
  }
})

const emit = defineEmits([
  'update:startDate', 
  'update:endDate', 
  'update:frequency',
  'update:paymentMethod',
  'frequency-change',
  'frequency-adjust'
])

const updateEndDate = (value) => {
  emit('update:endDate', value)
}

const updatePaymentMethod = (value) => {
  emit('update:paymentMethod', value)
}

const handleStartDateChange = (event) => {
  const value = event.target.value
  emit('update:startDate', value)
  
  // If end date is before start date, update it
  if (props.endDate && new Date(props.endDate) < new Date(value)) {
    emit('update:endDate', value)
  }
}

const handleFrequencyChange = (event) => {
  const value = parseInt(event.target.value) || 1
  emit('update:frequency', value)
  emit('frequency-change', value)
}

const adjustFrequency = (change) => {
  const newFrequency = parseInt(props.frequency) + change
  if (newFrequency >= 1) {
    emit('update:frequency', newFrequency)
    emit('frequency-adjust', newFrequency)
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

const formatPriceWithDetails = (amount) => {
  if (!amount && amount !== 0) return `${props.currency} 0`
  
  let priceText = formatCurrency(amount)
  
  // Add details if available
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
    return props.startDate && props.paymentMethod && props.priceCalculation?.total
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

.date-input-wrapper {
  position: relative;
}

.date-input-wrapper input {
  width: 100%;
  padding: 14px 16px 14px 45px;
  border: 2px solid #e6e9f4;
  border-radius: 10px;
  font-size: 1em;
  transition: all 0.3s ease;
  background-color: #ffffff;
  color: #2D3748;
  cursor: pointer;
}

.date-input-wrapper input:focus {
  outline: none;
  border-color: #4A6FDC;
  box-shadow: 0 0 0 3px rgba(74, 111, 220, 0.15);
}

.date-input-wrapper input:disabled {
  background-color: #F7F9FC;
  cursor: not-allowed;
  opacity: 0.7;
  border-color: #E2E8F0;
}

.date-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: #4A6FDC;
}

.help-text {
  display: block;
  margin-top: 8px;
  color: #64748B;
  font-size: 0.85em;
  display: flex;
  align-items: center;
}

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
  
  .price-calculator-section {
    padding: 20px;
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
</style>