<!-- components/pager/ui/PagerDetailCell.vue -->
<!-- Renders the [Section, Ad Slot/File] cell pair for ONE page — used twice
     per row in PagerDetailTable (once for the left page, once for the
     right). A real SFC rather than an inline render function so scoped
     styles apply the normal, reliable way. -->
<template>
  <td>
    <template v-if="!page">—</template>
    <em v-else-if="info.kind === 'cover'">{{ info.label }}</em>
    <select
      v-else
      class="pdc-select"
      :value="page.section || ''"
      @change="$emit('section-change', page.id, $event.target.value)"
    >
      <option value="" disabled>Section…</option>
      <option v-for="s in sections" :key="s" :value="s">{{ s }}</option>
    </select>
  </td>
  <td>
    <template v-if="!page">—</template>
    <em v-else-if="info.kind === 'cover'">{{ info.label }}</em>
    <div v-else-if="info.kind === 'adslot'">
      <div v-for="(slot, i) in info.slots" :key="i" class="pdc-slot-line">
        <span class="pdc-slot-tag">SLOT</span>{{ slot.label }}
        <span v-if="slot.fileName" class="pdc-slot-file">({{ slot.fileName }})</span>
        <button class="pdc-slot-x" title="Remove this ad slot from this page" @click="$emit('remove-slot', page.id, slot.advertIds)">×</button>
      </div>
    </div>
    <template v-else>—</template>
  </td>
</template>

<script setup>
import { computed } from 'vue'
import { classifyPage } from '~/composables/usePagerExport'

const props = defineProps({
  page: { type: Object, default: null },
  sections: { type: Array, required: true },
})
defineEmits(['section-change', 'remove-slot'])

const info = computed(() => classifyPage(props.page))
</script>

<style scoped>
.pdc-select {
  font-size: 10.5px; border: 1px solid #D1D9E0; border-radius: 2px; padding: 3px 5px;
  font-family: inherit; width: 100%; max-width: 160px; background: #fff; color: #333;
}
.pdc-select:focus { border-color: #0066CC; outline: none; }

.pdc-slot-line { display: flex; align-items: baseline; gap: 5px; margin-bottom: 3px; }
.pdc-slot-line:last-child { margin-bottom: 0; }
.pdc-slot-tag {
  display: inline-block; flex-shrink: 0;
  background: #EAF1FB; color: #0B3C7A; border: 1px solid #9DC3E6;
  border-radius: 2px; padding: 1px 6px; font-size: 9px; font-weight: 700;
  text-transform: uppercase; letter-spacing: .3px;
}
.pdc-slot-file { color: #999; font-size: 10.5px; }
.pdc-slot-x {
  border: none; background: none; color: #bbb; font-size: 13px; line-height: 1;
  cursor: pointer; padding: 0 2px; margin-left: auto;
}
.pdc-slot-x:hover { color: #E31E24; }
</style>