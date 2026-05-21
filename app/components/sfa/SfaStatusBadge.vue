<!-- components/sfa/SfaStatusBadge.vue -->
<!-- Reusable coloured status badge. Pass either a status string + map, or direct color/label. -->
<template>
  <span class="sfa-badge" :style="styles">{{ resolved.label }}</span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  status:   { type: String,  default: '' },
  label:    { type: String,  default: '' },
  color:    { type: String,  default: '' },
  bg:       { type: String,  default: '' },
  /** Pass a status-map object like QUOTATION_STATUSES or ORDER_STATUSES */
  map:      { type: Object,  default: null },
  small:    { type: Boolean, default: false },
})

const resolved = computed(() => {
  if (props.map && props.status && props.map[props.status]) {
    return props.map[props.status]
  }
  return {
    label: props.label || props.status || '—',
    color: props.color || '#8094B8',
    bg:    props.bg    || '#F0F4FA',
  }
})

const styles = computed(() => ({
  background: resolved.value.bg    || resolved.value.color + '18',
  color:      resolved.value.color,
  border:     `1px solid ${resolved.value.color}30`,
  fontSize:   props.small ? '10px' : '11px',
  padding:    props.small ? '1px 6px' : '2px 8px',
}))
</script>

<style scoped>
.sfa-badge {
  display: inline-flex;
  align-items: center;
  border-radius: 3px;
  font-family: 'IBM Plex Sans', sans-serif;
  font-weight: 600;
  letter-spacing: 0.3px;
  white-space: nowrap;
  line-height: 1.6;
}
</style>
