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

@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@600&display=swap');

.pricing-calculator { 
  --navy:        #003366;
  --navy-light:  #004080;
  --red:         #E31E24;
  --blue:        #0066CC;
  --blue-lt:     #EEF4FF;
  --surface:     #FFFFFF;
  --page-bg:     #F0F4F8;
  --border:      #D1D9E0;
  --border-lt:   #E8ECF0;
  --text-1:      #0F172A;
  --text-2:      #334155;
  --text-3:      #64748B;
  --text-4:      #94A3B8;
  --green-text:  #166534;
  --green-bg:    #F0FDF4;
  --green-bd:    #86EFAC;
  --cyan-text:   #155E75;
  --cyan-bg:     #ECFEFF;
  --cyan-bd:     #67E8F9;
  --red-text:    #991B1B;
  --red-bg:      #FEF2F2;
  --red-bd:      #FECACA;
  --amber-text:  #78350F;
  --amber-bg:    #FFFBEB;
  --amber-bd:    #FCD34D;
  --radius:      2px;
  --ring:        0 0 0 3px rgba(0,102,204,.15);
  --shadow-sm:   0 1px 3px rgba(0,0,0,.07), 0 1px 2px rgba(0,0,0,.05);
  --shadow-md:   0 4px 16px rgba(0,0,0,.08), 0 2px 6px rgba(0,0,0,.05);
  --t:           140ms ease;
  --font:        "IBM Plex Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
 font-family: var(--font); font-size: 13px; background: var(--surface); border-radius: var(--radius); box-shadow: var(--shadow-sm); overflow: hidden; }

.pricing-calculator h3 {
  margin: 0; padding: 12px 18px;
  background: var(--navy); color: #fff;
  font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .07em;
}

.loading, .empty-state {
  padding: 32px 18px; text-align: center;
  color: var(--text-3); font-size: 13px; font-style: italic;
  background: var(--surface);
}

.price-details { border-top: 1px solid var(--border-lt); }

.price-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 9px 18px; border-bottom: 1px solid var(--border-lt);
  font-size: 13px;
}
.price-row:last-child { border-bottom: none; }
.price-row:nth-child(even) { background: var(--page-bg); }
.price-row span:first-child { color: var(--text-3); font-weight: 500; }
.price-row span:last-child { color: var(--text-1); font-weight: 600; }

.price-row.discount-row {
  background: var(--green-bg) !important;
  border-color: var(--green-bd);
  padding: 9px 18px;
}
.discount-amount { color: var(--green-text) !important; font-weight: 700; }

.price-row.total {
  background: var(--navy) !important;
  border: none; padding: 12px 18px;
  font-size: 14px;
}
.price-row.total span { color: rgba(255,255,255,.75) !important; font-weight: 600; }
.price-row.total span:last-child { color: #fff !important; font-weight: 700; }

</style>