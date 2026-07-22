<!-- components/pager/PagerGrid.vue -->
<template>
  <div class="pg">
    <div v-if="legend.length > 0" class="pg__legend">
      <span class="pg__legend-lbl">Sections:</span>
      <span v-for="item in legend" :key="item.section" class="pg__legend-chip">
        <span class="pg__legend-dot" :style="{ background: item.color.border }"></span>
        {{ item.section }}
      </span>
    </div>

    <div v-for="(pair, i) in pairs" :key="i" class="pg__row">
      <div class="pg__cell">
        <PagerPageCard
          v-if="pair.left"
          :page="pair.left"
          :sections="sections"
          @section-change="(...a) => $emit('section-change', ...a)"
          @remove-advert="(...a) => $emit('remove-advert', ...a)"
          @open-picker="(p) => $emit('open-picker', p)"
        />
      </div>
      <div class="pg__spine"></div>
      <div class="pg__cell">
        <PagerPageCard
          v-if="pair.right"
          :page="pair.right"
          :sections="sections"
          @section-change="(...a) => $emit('section-change', ...a)"
          @remove-advert="(...a) => $emit('remove-advert', ...a)"
          @open-picker="(p) => $emit('open-picker', p)"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import PagerPageCard from './PagerPageCard.vue'
import { getSectionLegend } from '~/composables/usePager'

const props = defineProps({
  left: { type: Array, required: true },
  right: { type: Array, required: true },
  sections: { type: Array, required: true },
})
defineEmits(['section-change', 'remove-advert', 'open-picker'])

// Pair left[i] with right[i] so each spread (e.g. page 1 & the last page)
// renders on the same row — a page with more adverts stretches its row's
// height, and its mirror page on the other side stretches to match, instead
// of the two columns drifting out of alignment independently.
const pairs = computed(() => {
  const count = Math.max(props.left.length, props.right.length)
  const out = []
  for (let i = 0; i < count; i++) {
    out.push({ left: props.left[i] || null, right: props.right[i] || null })
  }
  return out
})

const legend = computed(() => getSectionLegend([...props.left, ...props.right]))
</script>

<style scoped>
.pg { display: flex; flex-direction: column; gap: 10px; padding: 12px; }

.pg__legend {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  background: #fff; border: 1px solid #DEEAF1; border-radius: 2px; padding: 8px 12px;
  font-family: 'IBM Plex Sans', sans-serif; font-size: 11px;
}
.pg__legend-lbl { font-weight: 700; color: #888; text-transform: uppercase; font-size: 9px; letter-spacing: .5px; }
.pg__legend-chip { display: inline-flex; align-items: center; gap: 5px; color: #333; }
.pg__legend-dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }

.pg__row {
  display: grid; grid-template-columns: 1fr 2px 1fr; align-items: stretch; gap: 0;
}
.pg__cell { display: flex; }
.pg__cell > * { flex: 1; }
.pg__spine { width: 2px; background: #D1D9E0; margin: 0 8px; }
</style>