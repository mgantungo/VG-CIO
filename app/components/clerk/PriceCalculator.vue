<!-- components/clerk/PriceCalculator.vue -->
<template>
  <div class="pricing-calculator">
    <h3>Price Calculation</h3>
    
    <div v-if="loading" class="loading">
      Calculating price...
    </div>
    
    <div v-else-if="calculation" class="price-details">
      <div class="price-row">
        <span>Base Price:</span>
        <span>{{ formatCurrency(calculation.basePrice) }}</span>
      </div>
      <div class="price-row">
        <span>Frequency (× {{ calculation.frequency || 1 }}):</span>
        <span>{{ formatCurrency(calculation.subtotal) }}</span>
      </div>
      <div class="price-row" v-if="calculation.dateCount && calculation.dateCount > 1">
        <span>Date Count (× {{ calculation.dateCount }}):</span>
        <span>{{ formatCurrency(calculation.subtotalWithDates || (calculation.subtotal * calculation.dateCount)) }}</span>
      </div>
      <div class="price-row" v-if="calculation.surcharge > 0">
        <span>Special Position Surcharge ({{ calculation.surchargePercentage }}%):</span>
        <span>{{ formatCurrency(calculation.surcharge) }}</span>
      </div>
      <div class="price-row discount-row" v-if="discount > 0">
        <span>Discount ({{ discount }}%):</span>
        <span class="discount-amount">-{{ formatCurrency(calculateDiscountAmount()) }}</span>
      </div>
      <div class="price-row total">
        <span>Total Amount:</span>
        <span>{{ formatCurrency(calculateFinalTotal()) }}</span>
      </div>
    </div>
    
    <div v-else class="empty-state">
      Select product and rate card to see pricing
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  calculation: {
    type: Object,
    default: null
  },
  loading: {
    type: Boolean,
    default: false
  },
  currency: {
    type: String,
    default: 'UGX'
  },
  rateCardDetails: {
    type: Object,
    default: null
  },
  discount: {
    type: [String, Number],
    default: 0
  }
})

const calculateDiscountAmount = () => {
  if (!props.calculation || !props.discount) return 0
  
  const discountPercentage = parseFloat(props.discount) / 100
  return props.calculation.total * discountPercentage
}

const calculateFinalTotal = () => {
  if (!props.calculation) return 0
  
  const discountAmount = calculateDiscountAmount()
  return props.calculation.total - discountAmount
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
</script>

<style scoped>
.pricing-calculator {
  background: #F5F5F5;
  padding: 20px;
  border-radius: 10px;
  margin-top: 20px;
}

.pricing-calculator h3 {
  color: #003366;
  margin-bottom: 15px;
}

.loading {
  text-align: center;
  padding: 20px;
  color: #666;
  font-style: italic;
}

.empty-state {
  text-align: center;
  padding: 20px;
  color: #999;
  font-style: italic;
}

.price-details {
  margin-top: 10px;
}

.price-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #DDDDDD;
}

.price-row.discount-row {
  background: linear-gradient(135deg, #F0FFF4 0%, #E6FFFA 100%);
  padding: 10px;
  border-radius: 6px;
  margin: 5px 0;
  border: 1px solid #9AE6B4;
}

.discount-amount {
  color: #10B981;
  font-weight: 700;
}

.price-row.total {
  border-top: 2px solid #003366;
  border-bottom: none;
  font-size: 1.3em;
  font-weight: bold;
  color: #003366;
  padding-top: 15px;
  margin-top: 10px;
}
</style>