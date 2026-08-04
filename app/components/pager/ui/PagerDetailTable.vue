<!-- components/pager/ui/PagerDetailTable.vue -->
<template>
  <div class="pdt-wrap">
    <table class="pdt-table">
      <thead>
        <tr><th>#</th><th>Section</th><th>Ad Slot / File</th><th>#</th><th>Section</th><th>Ad Slot / File</th></tr>
      </thead>
      <tbody>
        <tr v-for="([l, r], i) in spreadOrder" :key="i">
          <td class="pdt-num">{{ l }}</td>
          <PagerDetailCell
            :page="findPage(l)"
            :sections="sections"
            @section-change="(...args) => $emit('section-change', ...args)"
            @remove-slot="(...args) => $emit('remove-slot', ...args)"
          />
          <td class="pdt-num">{{ r }}</td>
          <PagerDetailCell
            :page="findPage(r)"
            :sections="sections"
            @section-change="(...args) => $emit('section-change', ...args)"
            @remove-slot="(...args) => $emit('remove-slot', ...args)"
          />
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { buildSpreadOrder } from '~/composables/usePagerExport'
import PagerDetailCell from './PagerDetailCell.vue'

const props = defineProps({
  flatPages: { type: Array, required: true }, // all pages, sorted by page_number
  totalPages: { type: Number, required: true },
  sections: { type: Array, required: true },
})
defineEmits(['section-change', 'remove-slot'])

const spreadOrder = computed(() => buildSpreadOrder(props.totalPages))

function findPage(pageNumber) {
  return props.flatPages.find(p => p.page_number === pageNumber) || null
}
</script>

<style scoped>
.pdt-wrap { overflow-x: auto; }
.pdt-table {
  width: 100%; border-collapse: collapse; font-size: 11px;
  font-family: 'IBM Plex Sans', 'Helvetica Neue', Arial, sans-serif;
}
.pdt-table :deep(th) {
  background: #003366; color: #fff; text-align: left;
  padding: 6px 10px; font-size: 10px; text-transform: uppercase; letter-spacing: .3px;
}
.pdt-table :deep(td) { padding: 6px 10px; border-bottom: 1px solid #eee; vertical-align: top; }
.pdt-table tbody tr:nth-child(even) :deep(td) { background: #F7F9FB; }
.pdt-num { font-weight: 700; }
</style>