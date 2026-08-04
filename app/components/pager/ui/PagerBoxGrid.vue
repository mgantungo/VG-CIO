<!-- components/pager/ui/PagerBoxGrid.vue -->
<template>
  <div>
    <div class="pbg-grid">
      <PagerGridBox
        v-for="page in pages"
        :key="page.id"
        :page="page"
        :sections="sections"
        @section-change="(...args) => $emit('section-change', ...args)"
        @remove-slot="(...args) => $emit('remove-slot', ...args)"
        @open-picker="(p) => $emit('open-picker', p)"
      />
    </div>
    <PagerLegend />
  </div>
</template>

<script setup>
import PagerGridBox from './PagerGridBox.vue'
import PagerLegend from './PagerLegend.vue'

defineProps({
  pages: { type: Array, required: true }, // already ordered — see usePagerExport's buildOrderedPages
  sections: { type: Array, required: true },
})
defineEmits(['section-change', 'remove-slot', 'open-picker'])
</script>

<style scoped>
.pbg-grid {
  display: grid;
  grid-template-columns: repeat(11, 1fr);
  gap: 4px;
  padding: 4px;
}
@media (max-width: 1100px) {
  .pbg-grid { grid-template-columns: repeat(7, 1fr); }
}
@media (max-width: 700px) {
  .pbg-grid { grid-template-columns: repeat(4, 1fr); }
}
</style>