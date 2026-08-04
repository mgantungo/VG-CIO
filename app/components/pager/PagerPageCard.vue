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

      <!-- Each cluster is one ad slot (2+ adverts sharing a physical file) or
           one standalone advert — clustered adverts get a single shared
           remove action so a slot can never be split apart one advert at a
           time. -->
      <div v-for="cluster in clusters" :key="cluster.key" class="ppc__cluster" :class="{ 'ppc__cluster--slot': cluster.isSlot }">
        <template v-if="cluster.isSlot">
          <div class="ppc__cluster-head">
            <span class="ppc__cluster-label">📁 Ad slot · {{ cluster.adverts.length }} advert{{ cluster.adverts.length !== 1 ? 's' : '' }}</span>
            <button class="ppc__chip-x" title="Remove entire ad slot from this page" @click="$emit('remove-advert', page.id, cluster.adverts.map(a => a.id))">×</button>
          </div>

          <div v-if="cluster.file" class="ppc__slot-file">
            <div>
              <div v-if="cluster.label && cluster.label !== cluster.file.name" class="ppc__slot-label">{{ cluster.label }}</div>
              <span class="ppc__slot-file-name">{{ cluster.file.name }}</span>
            </div>
            <div class="ppc__slot-file-actions">
              <a :href="resolveMediaUrl(cluster.file.url)" target="_blank" rel="noopener" class="ppc__slot-file-link">View</a>
              <a :href="resolveMediaUrl(cluster.file.url)" :download="cluster.file.name" class="ppc__slot-file-link">Download</a>
            </div>
          </div>
          <div v-else class="ppc__slot-file ppc__slot-file--none">No file attached to this ad slot</div>
        </template>

        <template v-if="!cluster.isSlot">
          <div v-for="a in cluster.adverts" :key="a.id" class="ppc__chip">
            <div class="ppc__chip-row">
              <span class="ppc__chip-serial mono">{{ a.client?.bc_no || a.client?.client_reference_no || '—' }}</span>
              <button class="ppc__chip-x" title="Remove" @click="$emit('remove-advert', page.id, [a.id])">×</button>
            </div>
            <div class="ppc__chip-name">{{ a.client?.company_name || 'Unknown client' }}</div>
            <div class="ppc__chip-meta">
              <span class="ppc__chip-title">{{ a.advert_title }}</span>
              <span class="ppc__chip-size">{{ a.ad_size }}</span>
            </div>
          </div>
        </template>
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

const config = useRuntimeConfig()
function resolveMediaUrl(url) {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  return `${config.public.uploadBase || ''}${url}`
}

const cardStyle = computed(() => {
  if (!color.value) return {}
  return {
    background: color.value.bg,
    borderColor: color.value.border,
  }
})

// Group adverts by slotKey (stamped server-side by getLayout/findOne) —
// present whenever a schedule row has a design file attached OR more than
// one advert on it, since either way the Pager should show the SLOT (and
// its file, if any) as one unit rather than listing adverts individually.
// Adverts with no slotKey render as their own standalone chip, unchanged.
const clusters = computed(() => {
  const adverts = props.page.adverts || []
  const bySlot = new Map() // slotKey -> { adverts: [], file }
  const standalone = []

  for (const a of adverts) {
    if (a.slotKey) {
      if (!bySlot.has(a.slotKey)) bySlot.set(a.slotKey, { adverts: [], file: a.slotFile || null, label: a.slotLabel || null })
      bySlot.get(a.slotKey).adverts.push(a)
    } else {
      standalone.push(a)
    }
  }

  const out = [...bySlot.entries()].map(([key, { adverts, file, label }]) => ({ key, isSlot: true, adverts, file, label }))
  for (const a of standalone) {
    out.push({ key: `single:${a.id}`, isSlot: false, adverts: [a], file: null, label: null })
  }
  return out
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

.ppc__cluster { display: flex; flex-direction: column; gap: 4px; }
.ppc__cluster--slot {
  border: 1.5px dashed #FFCC00; border-radius: 2px; padding: 4px; background: rgba(255,243,214,.4);
}
.ppc__cluster-head { display: flex; align-items: center; justify-content: space-between; padding: 0 2px; }
.ppc__cluster-label { font-size: 9px; font-weight: 700; color: #9C5700; text-transform: uppercase; letter-spacing: .3px; }

.ppc__slot-file {
  display: flex; align-items: center; justify-content: space-between; gap: 6px;
  background: rgba(255,255,255,.75); border: 1px solid #D1D9E0; border-radius: 2px;
  padding: 6px 8px; font-size: 10px;
}
.ppc__slot-file--none { color: #999; font-style: italic; justify-content: center; }
.ppc__slot-label { font-size: 9px; font-weight: 700; color: #9C5700; text-transform: uppercase; letter-spacing: .3px; margin-bottom: 1px; }
.ppc__slot-file-name { font-weight: 600; color: #003366; word-break: break-all; }
.ppc__slot-file-actions { display: flex; gap: 8px; flex-shrink: 0; }
.ppc__slot-file-link { font-size: 10px; font-weight: 700; color: #0066CC; text-decoration: none; }
.ppc__slot-file-link:hover { text-decoration: underline; }

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