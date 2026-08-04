<!-- components/pager/PagerAdvertPicker.vue -->
<template>
  <Teleport to="body">
    <div v-if="show" class="pap-overlay" @click.self="$emit('close')">
      <div class="pap-panel">
        <div class="pap-head">
          <div>
            <div class="pap-head__eyebrow">Ticked in Index · Page {{ page?.page_number }}</div>
            <div class="pap-head__title">{{ page?.section || 'No section selected' }}</div>
          </div>
          <button class="pap-close" @click="$emit('close')">×</button>
        </div>

        <input
          v-model="search"
          type="text"
          class="pap-search"
          placeholder="Search by title, client, or reference…"
          autofocus
        >

        <div class="pap-body">
          <div v-if="loading" class="pap-msg">Loading adverts…</div>
          <div v-else-if="units.length === 0" class="pap-msg">
            No adverts ticked yet. Go to the Print Queue Selection panel in the Schedule Queue and
            tick off the adverts you want on the pager, then come back here.
          </div>
          <div v-else-if="filtered.length === 0" class="pap-msg">No ticked adverts match your search.</div>

          <div
            v-for="u in filtered"
            :key="u.unitKey"
            class="pap-row"
            :class="{ 'pap-row--group': u.kind === 'group' }"
            @click="$emit('select', u.advertIds)"
          >
            <template v-if="u.kind === 'group'">
              <div class="pap-row__main">
                <span class="pap-row__title">📁 {{ u.adverts.length }} adverts — one ad slot</span>
                <span class="pap-row__ref mono">moves together</span>
              </div>
              <div class="pap-row__sub">{{ u.adverts.map(a => a.advert_title).join(' · ') }}</div>
            </template>
            <template v-else>
              <div class="pap-row__main">
                <span class="pap-row__title">{{ u.adverts[0].advert_title }}</span>
                <span class="pap-row__ref mono">#{{ u.adverts[0].reference_number }}</span>
              </div>
              <div class="pap-row__sub">{{ u.adverts[0].client?.company_name || '—' }} · {{ u.adverts[0].ad_size }}</div>
            </template>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  show:      { type: Boolean, default: false },
  page:      { type: Object,  default: null },
  groups:    { type: Array,   default: () => [] }, // [{ slotKey, adverts: [...] }] — must move together
  ungrouped: { type: Array,   default: () => [] },  // plain adverts, free to place individually
  loading:   { type: Boolean, default: false },
})
defineEmits(['close', 'select']) // select emits an array of advertIds — always, even for a single ungrouped advert

const search = ref('')
watch(() => props.show, (v) => { if (!v) search.value = '' })

// One printable unit per row: a whole ad slot, or a single ungrouped advert —
// matches the same model already used in Print Queue Selection and the
// Schedule Queue, so selecting here can never split a slot across pages.
const units = computed(() => {
  const out = []
  for (const g of props.groups) {
    out.push({ unitKey: `group:${g.slotKey}`, kind: 'group', adverts: g.adverts, advertIds: g.adverts.map(a => a.id) })
  }
  for (const a of props.ungrouped) {
    out.push({ unitKey: `advert:${a.id}`, kind: 'advert', adverts: [a], advertIds: [a.id] })
  }
  return out
})

const filtered = computed(() => {
  if (!search.value) return units.value
  const q = search.value.toLowerCase()
  return units.value.filter(u =>
    u.adverts.some(a =>
      (a.advert_title || '').toLowerCase().includes(q) ||
      (a.client?.company_name || '').toLowerCase().includes(q) ||
      String(a.reference_number || '').toLowerCase().includes(q)
    )
  )
})
</script>

<style scoped>
.pap-overlay {
  position: fixed; inset: 0; background: rgba(0,51,102,.55);
  display: flex; align-items: center; justify-content: center;
  z-index: 6000; padding: 20px; font-family: 'IBM Plex Sans', sans-serif;
}
.pap-panel {
  background: #fff; width: 100%; max-width: 480px; max-height: 78vh;
  display: flex; flex-direction: column; border-radius: 2px;
  box-shadow: 0 24px 64px rgba(0,0,0,.4);
}
.pap-head {
  background: #003366; padding: 12px 16px; display: flex; justify-content: space-between; align-items: flex-start;
}
.pap-head__eyebrow { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .8px; color: #9DC3E6; }
.pap-head__title   { color: #fff; font-size: 14px; font-weight: 700; margin-top: 2px; }
.pap-close { background: none; border: none; color: #9DC3E6; font-size: 24px; cursor: pointer; line-height: 1; padding: 0; }
.pap-close:hover { color: #fff; }

.pap-search {
  border: none; border-bottom: 1.5px solid #D1D9E0; padding: 10px 14px; font-size: 13px;
  font-family: inherit; outline: none;
}
.pap-search:focus { border-bottom-color: #0066CC; }

.pap-body { flex: 1; overflow-y: auto; }
.pap-msg { padding: 24px; text-align: center; font-size: 12px; color: #999; }

.pap-row { padding: 10px 14px; border-bottom: 1px solid #F0F4F8; cursor: pointer; }
.pap-row:hover { background: #F0F4F8; }
.pap-row--group { background: #FFF9E6; border-left: 3px solid #FFCC00; }
.pap-row--group:hover { background: #FFF3D6; }
.pap-row__main { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
.pap-row__title { font-size: 12px; font-weight: 600; color: #003366; }
.pap-row__ref   { font-size: 10px; color: #999; }
.pap-row__sub   { font-size: 11px; color: #888; margin-top: 2px; }
.mono { font-family: 'IBM Plex Mono', monospace; }
</style>