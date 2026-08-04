<!-- components/pager/ui/PagerGridBox.vue -->
<template>
  <div
    class="pgb"
    :class="[
      `pgb--${info.kind}`,
      { 'pgb--multi': isMulti, 'pgb--empty': info.kind === 'empty' }
    ]"
  >
    <div class="pgb__top">
      <span class="pgb__num">{{ page.page_number }}</span>
      <span v-if="isMulti" class="pgb__badge">{{ info.slots.length }}</span>
    </div>

    <!-- Cover / back cover — locked server-side, nothing to edit -->
    <div v-if="info.kind === 'cover'" class="pgb__label pgb__label--cover">{{ info.label }}</div>

    <!-- Every other page: section is ALWAYS visible and editable here,
         regardless of whether the page also has ad slots on it — this was
         previously only shown for section/empty pages, silently hiding it
         the moment a page had an ad slot. -->
    <template v-else>
      <select
        class="pgb__select"
        :value="page.section || ''"
        @click.stop
        @change="onSectionChange"
      >
        <option value="" disabled>Section…</option>
        <option v-for="s in sections" :key="s" :value="s">{{ s }}</option>
      </select>

      <div v-if="info.kind === 'adslot'" class="pgb__slots">
        <div v-for="(slot, i) in info.slots" :key="i" class="pgb__slot-line">
          <span class="pgb__slot-icon">📁</span>
          <span class="pgb__slot-text">{{ slot.label }}</span>
          <button class="pgb__slot-x" title="Remove this ad slot from this page" @click.stop="$emit('remove-slot', page.id, slot.advertIds)">×</button>
        </div>
      </div>
    </template>

    <button v-if="info.kind !== 'cover'" class="pgb__add" title="Add advert to this page" @click.stop="$emit('open-picker', page)">+</button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { classifyPage } from '~/composables/usePagerExport'

const props = defineProps({
  page: { type: Object, required: true },
  sections: { type: Array, required: true },
})
const emit = defineEmits(['section-change', 'remove-slot', 'open-picker'])

const info = computed(() => classifyPage(props.page))
const isMulti = computed(() => info.value.kind === 'adslot' && info.value.slots.length > 1)

function onSectionChange(e) {
  emit('section-change', props.page.id, e.target.value)
}
</script>

<style scoped>
.pgb {
  min-height: 90px;
  border: 1px solid #bbb;
  border-radius: 2px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 3px 4px;
  font-size: 8px;
  position: relative;
  background: #fafafa;
  font-family: 'IBM Plex Sans', 'Helvetica Neue', Arial, sans-serif;
}

.pgb__top { display: flex; justify-content: space-between; align-items: flex-start; flex-shrink: 0; }
.pgb__num {
  font-weight: 700; font-size: 11px; color: #003366; font-family: 'IBM Plex Mono', 'Courier New', monospace;
}
.pgb__badge {
  background: #0066CC; color: #fff; font-size: 7px; font-weight: 700;
  border-radius: 50%; width: 13px; height: 13px; display: flex; align-items: center; justify-content: center;
}

.pgb__label { font-size: 7.5px; color: #444; line-height: 1.15; word-break: break-word; }
.pgb__label--cover { color: #fff; font-weight: 700; }

.pgb--cover { background: #003366; border-color: #003366; }
.pgb--adslot { background: #EAF1FB; border-color: #0066CC; }
.pgb--adslot.pgb--multi { border-width: 2px; border-color: #FFCC00; background: #FFF9E6; }
.pgb--empty {
  background: repeating-linear-gradient(45deg, #f5f5f5, #f5f5f5 4px, #eee 4px, #eee 8px);
  border-style: dashed;
}

.pgb__select {
  font-size: 7px; border: 1px solid #9DC3E6; border-radius: 1px; padding: 1.5px 2px;
  font-family: inherit; width: 100%; background: #fff; color: #333; flex-shrink: 0;
}
.pgb__select:focus { border-color: #0066CC; outline: none; }

.pgb__slots { display: flex; flex-direction: column; gap: 1.5px; overflow-y: auto; flex: 1; }
.pgb__slot-line {
  display: flex; align-items: center; gap: 2px;
  font-size: 6.8px; line-height: 1.15; color: #0B3C7A; font-weight: 600;
  background: rgba(255,255,255,.6); border-radius: 1px; padding: 1px 2px;
}
.pgb__slot-icon { font-size: 6.5px; flex-shrink: 0; }
.pgb__slot-text { flex: 1; word-break: break-word; }
.pgb__slot-x {
  border: none; background: none; color: #999; font-size: 9px; line-height: 1;
  cursor: pointer; padding: 0 1px; flex-shrink: 0;
}
.pgb__slot-x:hover { color: #E31E24; }

.pgb__add {
  position: absolute; bottom: 2px; right: 2px;
  width: 12px; height: 12px; border-radius: 50%;
  border: 1px solid #9DC3E6; background: rgba(255,255,255,.85); color: #0066CC;
  font-size: 9px; line-height: 1; cursor: pointer; display: flex; align-items: center; justify-content: center;
  opacity: 0; transition: opacity .1s;
}
.pgb:hover .pgb__add { opacity: 1; }
.pgb__add:hover { background: #0066CC; color: #fff; }
</style>