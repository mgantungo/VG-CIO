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
        <span>Frequency (× {{ calculation.frequency }}):</span>
        <span>{{ formatCurrency(calculation.subtotal) }}</span>
      </div>
      <div class="price-row" v-if="calculation.surcharge > 0">
        <span>Special Position Surcharge ({{ calculation.surchargePercentage }}%):</span>
        <span>{{ formatCurrency(calculation.surcharge) }}</span>
      </div>
      <div class="price-row">
        <span>Discount:</span>
        <span>{{ formatCurrency(0) }}</span>
      </div>
      <div class="price-row total">
        <span>Total Amount:</span>
        <span>{{ formatCurrency(calculation.total) }}</span>
      </div>
    </div>
    
    <div v-else class="empty-state">
      Select product and rate card to see pricing
    </div>
  </div>
</template>

<script setup>
/*  
defineProps({
  calculation: {
    type: Object,
    default: null
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const formatCurrency = (amount) => {
  if (!amount) return 'UGX 0'
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX'
  }).format(amount)
}
  */

  defineProps({
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
  }
})

const formatCurrency = (amount) => {
  if (!amount) return 'UGX 0'
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
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