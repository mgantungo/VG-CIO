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
.stat-card {
  display: flex;
  align-items: center;
  gap: 15px;
  background: white;
  padding: 15px 20px;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  flex: 1;
  min-width: 200px;
  border-left: 4px solid;
}

.stat-icon {
  font-size: 2em;
  opacity: 0.8;
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 0.9em;
  color: #666;
  margin-bottom: 5px;
}

.stat-value {
  font-size: 1.1em;
  font-weight: 700;
  color: #333;
}

/* Type-specific styles */
.stat-primary { border-left-color: #0066CC; }
.stat-success { border-left-color: #28a745; }
.stat-warning { border-left-color: #ffc107; }
.stat-info { border-left-color: #17a2b8; }
.stat-danger { border-left-color: #dc3545; }

/* Optional: Add subtle background colors */
.stat-primary .stat-icon { color: #0066CC; }
.stat-success .stat-icon { color: #28a745; }
.stat-warning .stat-icon { color: #ffc107; }
.stat-info .stat-icon { color: #17a2b8; }
.stat-danger .stat-icon { color: #dc3545; }

/* Responsive adjustments */
@media (max-width: 768px) {
  .stat-card {
    width: 100%;
    min-width: unset;
  }
}
</style>