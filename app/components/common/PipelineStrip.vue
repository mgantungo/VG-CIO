<!-- components/common/PipelineStrip.vue -->
<!--
  Booked → Placed → In design → Artwork in → Invoiced, with counts.
  Shows where the current page's work sits in the whole print flow.
  Renders nothing until a page has pushed counts (useWorkspace().setPipeline).
-->
<template>
  <div v-if="counts" class="ps" aria-label="Print pipeline">
    <div
      v-for="s in PIPELINE_STEPS"
      :key="s.key"
      class="ps__step"
      :class="{ 'ps__step--cur': isCurrent(s.step) }"
    >
      <span class="ps__n">{{ s.step }}</span>
      {{ s.label }}
      <b v-if="counts[s.key] !== undefined && counts[s.key] !== null">{{ counts[s.key] }}</b>
    </div>
  </div>
</template>

<script setup>
import { PIPELINE_STEPS } from '~/config/roles'

const props = defineProps({
  counts: { type: Object, default: null },
  current: { type: [Number, Array], default: null },
})

const isCurrent = (step) =>
  Array.isArray(props.current) ? props.current.includes(step) : props.current === step
</script>

<style scoped>
.ps { display: flex; flex-wrap: wrap; background: #fff; border-bottom: 1px solid #DEEAF1; padding: 0 24px; font-family: 'IBM Plex Sans', 'Segoe UI', sans-serif; }
.ps__step { display: flex; align-items: center; gap: 8px; padding: 9px 18px 9px 0; margin-right: 18px; font-size: 12px; color: #475569; border-bottom: 3px solid transparent; }
.ps__step b { font-family: 'IBM Plex Mono', monospace; font-size: 13px; color: #0F172A; font-weight: 600; }
.ps__step--cur { border-bottom-color: #003366; color: #003366; font-weight: 600; }
.ps__n { width: 20px; height: 20px; border-radius: 2px; background: #E2E8F0; color: #334155; font-size: 10px; font-weight: 700; display: flex; align-items: center; justify-content: center; }
.ps__step--cur .ps__n { background: #003366; color: #fff; }
@media (max-width: 640px) { .ps { padding: 0 12px; } .ps__step { margin-right: 10px; padding-right: 8px; } }
</style>
