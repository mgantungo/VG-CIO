<!-- components/pager/PagerPageCard.vue -->
<template>
  <div
    class="ppc"
    :class="{
      'ppc--cover': page.is_cover,
      'ppc--back-cover': page.is_back_cover,
      'ppc--assigned': !!page.section && !page.is_cover && !page.is_back_cover,
    }"
    :style="cardStyle"
  >
    <div class="ppc__num">{{ page.page_number }}</div>

    <div class="ppc__section-row">
      <span v-if="color" class="ppc__dot" :style="{ background: color.border }"></span>
      <select
        class="ppc__section"
        :value="page.section || ''"
        :disabled="page.is_back_cover || page.is_cover"
        @change="$emit('section-change', page.id, $event.target.value)"
      >
        <option value="" disabled>Select section…</option>
        <option v-for="s in sections" :key="s" :value="s">{{ s }}</option>
      </select>
    </div>

    <div class="ppc__adverts">
      <div v-if="!page.adverts || page.adverts.length === 0" class="ppc__empty">No adverts</div>
      <div v-for="a in page.adverts" :key="a.id" class="ppc__chip">
        <div class="ppc__chip-row">
          <span class="ppc__chip-serial mono">{{ a.client?.bc_no || a.client?.client_reference_no || '—' }}</span>
          <button class="ppc__chip-x" title="Remove" @click="$emit('remove-advert', page.id, a.id)">×</button>
        </div>
        <div class="ppc__chip-name">{{ a.client?.company_name || 'Unknown client' }}</div>
        <div class="ppc__chip-meta">
          <span class="ppc__chip-title">{{ a.advert_title }}</span>
          <span class="ppc__chip-size">{{ a.ad_size }}</span>
        </div>
      </div>
    </div>

    <button class="ppc__add-btn" @click="$emit('open-picker', page)">+ Add advert</button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { getSectionColor } from '~/composables/usePager'

const props = defineProps({
  page: { type: Object, required: true },
  sections: { type: Array, required: true },
})
defineEmits(['section-change', 'remove-advert', 'open-picker'])

const color = computed(() => {
  if (!props.page.section || props.page.is_cover || props.page.is_back_cover) return null
  return getSectionColor(props.page.section)
})

const cardStyle = computed(() => {
  if (!color.value) return {}
  return {
    background: color.value.bg,
    borderColor: color.value.border,
  }
})
</script>

<style scoped>
.ppc {
  background: #fff; border: 1.5px solid #D1D9E0; border-radius: 2px;
  display: flex; flex-direction: column; gap: 6px; padding: 8px;
  min-height: 140px; font-family: 'IBM Plex Sans', sans-serif;
  transition: background .15s, border-color .15s;
}
.ppc--cover      { border-color: #0066CC; border-width: 2px; background: #EEF6FF; }
.ppc--back-cover { border-color: #003366; border-width: 2px; background: #DEEAF1; }

.ppc__num {
  font-family: 'IBM Plex Mono', monospace; font-weight: 700; font-size: 13px;
  color: #003366; align-self: center;
}
.ppc__section-row { display: flex; align-items: center; gap: 5px; }
.ppc__dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.ppc__section {
  flex: 1; font-size: 10px; border: 1.5px solid #D1D9E0; border-radius: 2px; padding: 3px 4px;
  font-family: inherit; background: #fff; color: #222;
}
.ppc__section:disabled { background: rgba(255,255,255,.6); color: #003366; font-weight: 600; }

.ppc__adverts { flex: 1; display: flex; flex-direction: column; gap: 5px; overflow-y: auto; }
.ppc__empty { font-size: 10px; color: #aaa; text-align: center; padding: 8px 0; }

.ppc__chip {
  background: rgba(255,255,255,.75); border: 1px solid #D1D9E0; border-radius: 2px; padding: 5px 6px;
  display: flex; flex-direction: column; gap: 2px; font-size: 10px;
}
.ppc__chip-row { display: flex; align-items: center; justify-content: space-between; }
.ppc__chip-serial { font-size: 9px; font-weight: 700; color: #0066CC; }
.mono { font-family: 'IBM Plex Mono', monospace; }
.ppc__chip-name {
  font-weight: 700; color: #003366; font-size: 11px;
  white-space: normal; word-break: break-word; line-height: 1.3;
}
.ppc__chip-meta {
  display: flex; justify-content: space-between; gap: 6px;
  color: #666; white-space: normal; word-break: break-word; line-height: 1.3;
}
.ppc__chip-title { flex: 1; }
.ppc__chip-size  { flex-shrink: 0; font-weight: 600; color: #888; }
.ppc__chip-x {
  border: none; background: none; color: #999; cursor: pointer; font-size: 14px;
  line-height: 1; padding: 0 2px; flex-shrink: 0;
}
.ppc__chip-x:hover { color: #E31E24; }

.ppc__add-btn {
  font-size: 10px; font-weight: 600; border: 1.5px dashed #9DC3E6; border-radius: 2px;
  background: rgba(255,255,255,.7); color: #0066CC; cursor: pointer; padding: 4px; font-family: inherit;
}
.ppc__add-btn:hover { background: #fff; }
</style>