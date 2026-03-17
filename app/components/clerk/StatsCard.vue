<template>
  <div class="stat-card" :class="`stat-${type}`">
    <div class="stat-icon">{{ icon }}</div>
    <div class="stat-content">
      <div class="stat-label">{{ label }}</div>
      <div class="stat-value">{{ formattedValue }}</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  icon: {
    type: String,
    required: true
  },
  label: {
    type: String,
    required: true
  },
  value: {
    type: [String, Number],
    default: ''
  },
  type: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'success', 'warning', 'info', 'danger'].includes(value)
  },
  formatCurrency: {
    type: Boolean,
    default: false
  }
})

const formattedValue = computed(() => {
  if (props.formatCurrency) {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(props.value || 0)
  }
  return props.value
})
</script>

<style scoped>

@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');

.stat-card { 
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

  display: flex; align-items: center; gap: 14px;
  background: var(--surface); padding: 14px 18px;
  border-radius: var(--radius); box-shadow: var(--shadow-sm);
  flex: 1; min-width: 180px;
  border-left: 3px solid var(--border);
  font-family: var(--font); font-size: 13px;
  transition: box-shadow var(--t);
}
.stat-card:hover { box-shadow: var(--shadow-md); }

.stat-icon { font-size: 1.6em; opacity: .7; flex-shrink: 0; }

.stat-content { flex: 1; }

.stat-label {
  font-size: 10px; font-weight: 600; text-transform: uppercase;
  letter-spacing: .06em; color: var(--text-4); margin-bottom: 3px;
}

.stat-value { font-size: 15px; font-weight: 700; color: var(--text-1); font-variant-numeric: tabular-nums; }

.stat-primary { border-left-color: var(--blue); }
.stat-success { border-left-color: #16a34a; }
.stat-warning { border-left-color: #d97706; }
.stat-info    { border-left-color: #0891b2; }
.stat-danger  { border-left-color: var(--red); }

.stat-primary .stat-icon { color: var(--blue); }
.stat-success .stat-icon { color: #16a34a; }
.stat-warning .stat-icon { color: #d97706; }
.stat-info    .stat-icon { color: #0891b2; }
.stat-danger  .stat-icon { color: var(--red); }

@media (max-width: 768px) { .stat-card { width: 100%; min-width: unset; } }

</style>