<!-- components/pager/PagerPopup.vue -->
<template>
  <Teleport to="body">
    <!-- Minimized docked tab -->
    <button v-if="open && minimized" class="pp-tab" @click="minimized = false">
      <span class="pp-tab__icon">📰</span>
      <span class="pp-tab__label">{{ pager.activePublication.value?.publication?.publication_code || 'Pager' }}</span>
    </button>

    <!-- Full panel -->
    <div v-if="open && !minimized" class="pp-overlay" @click.self="close">
      <div class="pp-panel">

        <div class="pp-head">
          <div class="pp-head__left">
            <div class="pp-head__eyebrow">Print Layout</div>
            <div class="pp-head__title">
              {{ pager.activePublication.value?.publication?.publication_code || 'Pager' }}
            </div>
            <div v-if="pager.activePublication.value" class="pp-head__sub">
              {{ pager.activePublication.value.publication.total_pages }} pages ·
              {{ pager.activePublication.value.publication.status }}
            </div>
          </div>
          <div class="pp-head__actions">
            <button
              v-if="pager.activePublication.value"
              class="pp-head__btn"
              @click="openPagesModal('add')"
            >+ Pages</button>
            <button
              v-if="pager.activePublication.value"
              class="pp-head__btn"
              @click="openPagesModal('reduce')"
            >− Pages</button>
            <button
              v-if="pager.activePublication.value"
              class="pp-head__btn"
              @click="openExportPanel"
            >⬇ Export Pager Map</button>
            <button
              v-if="pager.activePublication.value"
              class="pp-head__btn"
              @click="backToList"
            >All Publications</button>
            <button class="pp-head__btn pp-head__btn--icon" title="Minimize" @click="minimized = true">–</button>
            <button class="pp-head__btn pp-head__btn--icon" title="Close" @click="close">×</button>
          </div>
        </div>

        <div v-if="pager.error.value" class="pp-err">{{ pager.error.value }}</div>

        <div class="pp-body">
          <div v-if="pager.loading.value" class="pp-loading">Loading…</div>

          <PagerInitModal
            v-else-if="!pager.activePublication.value"
            :publications="pager.publications.value"
            @open="openPublication"
            @create="onCreate"
          />

          <template v-else>
            <div class="pp-viewmode-row">
              <span class="pp-viewmode-label">View:</span>
              <button class="pp-scope-btn" :class="{ active: viewMode === 'pairs' }" @click="viewMode = 'pairs'">Page Pairs</button>
              <button class="pp-scope-btn" :class="{ active: viewMode === 'sequential' }" @click="viewMode = 'sequential'">Sequential</button>
              <button class="pp-scope-btn" :class="{ active: viewMode === 'detail' }" @click="viewMode = 'detail'">Detail</button>
            </div>

            <PagerDetailTable
              v-if="viewMode === 'detail'"
              :flat-pages="flatPagesForDisplay"
              :total-pages="pager.activePublication.value.publication.total_pages"
              :sections="pager.PUBLICATION_SECTIONS"
              @section-change="onSectionChange"
              @remove-slot="onRemoveAdvert"
            />
            <PagerBoxGrid
              v-else
              :pages="orderedPagesForDisplay"
              :sections="pager.PUBLICATION_SECTIONS"
              @section-change="onSectionChange"
              @remove-slot="onRemoveAdvert"
              @open-picker="openPicker"
            />
          </template>
        </div>
      </div>
    </div>

    <!-- Adjust pages mini-modal (add or reduce) -->
    <div v-if="pagesModalMode" class="pp-add-overlay" @click.self="pagesModalMode = null">
      <div class="pp-add-panel">
        <div class="pp-add-title">{{ pagesModalMode === 'add' ? 'Add pages' : 'Remove pages' }}</div>
        <p class="pp-add-hint">
          {{ pagesModalMode === 'add'
            ? 'Must be added in multiples of 4.'
            : 'Removes trailing pages, in multiples of 4. Blocked if any of those pages still have adverts.' }}
        </p>
        <input v-model.number="pagesModalValue" type="number" min="4" step="4" class="pp-add-input">
        <div class="pp-add-actions">
          <button class="pp-add-cancel" @click="pagesModalMode = null">Cancel</button>
          <button class="pp-add-confirm" @click="onConfirmPagesModal">
            {{ pagesModalMode === 'add' ? 'Add' : 'Remove' }}
          </button>
        </div>
      </div>
    </div>

    <PagerAdvertPicker
      :show="pickerOpen"
      :page="pickerPage"
      :groups="pickerGroups"
      :ungrouped="pickerUngrouped"
      :loading="pickerLoading"
      @close="pickerOpen = false"
      @select="onAdvertSelect"
    />

    <!-- Export Pager Map panel — pick which publication(s), export all as
         one combined PDF or just the ones ticked. -->
    <div v-if="exportPanelOpen" class="pp-export-overlay" @click.self="exportPanelOpen = false">
      <div class="pp-export-panel">
        <div class="pp-export-head">
          <h3>Export Pager Map</h3>
          <button class="pp-export-close" @click="exportPanelOpen = false">×</button>
        </div>

        <div class="pp-export-body">
          <div class="pp-export-list">
            <label v-for="p in pager.publications.value" :key="p.id" class="pp-export-row">
              <input
                type="checkbox"
                :checked="exportSelectedIds.has(p.id)"
                :disabled="exportScope === 'all'"
                @change="toggleExportSelected(p.id)"
              >
              <div>
                <div class="pp-export-code">{{ p.publication_code }}</div>
                <div class="pp-export-meta">{{ p.masthead }} · {{ p.total_pages }} pages · {{ p.publication_date }}</div>
              </div>
            </label>
            <div v-if="pager.publications.value.length === 0" class="pp-export-empty">No publications yet.</div>
          </div>

          <div class="pp-export-scope">
            <button class="pp-scope-btn" :class="{ active: exportScope === 'all' }" @click="exportScope = 'all'">Export All</button>
            <button class="pp-scope-btn" :class="{ active: exportScope === 'selected' }" @click="exportScope = 'selected'">Export Selected</button>
          </div>

          <div class="pp-export-hint">
            <span v-if="exportScope === 'all'">Will export all {{ pager.publications.value.length }} publication(s) into one combined PDF.</span>
            <span v-else-if="exportSelectedIds.size === 0">Tick at least one publication to export.</span>
            <span v-else>Will export {{ exportSelectedIds.size }} publication(s) into one combined PDF.</span>
          </div>
        </div>

        <div class="pp-export-foot">
          <button class="pp-export-cancel" @click="exportPanelOpen = false">Cancel</button>
          <button
            class="pp-export-confirm"
            :disabled="exporting || (exportScope === 'selected' && exportSelectedIds.size === 0)"
            @click="runExport"
          >{{ exporting ? 'Exporting…' : '⬇ Export PDF' }}</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { usePager } from '~/composables/usePager'
import { usePagerExport, buildOrderedPages, flattenPages } from '~/composables/usePagerExport'
import PagerInitModal from './PagerInitModal.vue'
import PagerBoxGrid from './ui/PagerBoxGrid.vue'
import PagerDetailTable from './ui/PagerDetailTable.vue'
import PagerAdvertPicker from './PagerAdvertPicker.vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  checkedAdvertIds: { type: Array, default: () => [] },
})
const emit = defineEmits(['update:open'])

const pager = usePager()
const pagerExport = usePagerExport()
const minimized = ref(false)

// ── Live view mode — Page Pairs, Sequential, or Detail table ────────────
// Uses the exact same buildOrderedPages/flattenPages helpers as the PDF
// export, so what's shown here while working can never disagree with what
// gets exported. The box-grid views (pairs/sequential) render one
// continuous grid — see PagerBoxGrid — not the old two-column left/right
// split, since that's not how the reference layout actually looks.
const viewMode = ref('pairs') // 'pairs' | 'sequential' | 'detail'

const orderedPagesForDisplay = computed(() => {
  const pub = pager.activePublication.value
  if (!pub) return []
  return buildOrderedPages(pub, viewMode.value === 'sequential' ? 'sequential' : 'pairs')
})

const flatPagesForDisplay = computed(() => {
  const pub = pager.activePublication.value
  if (!pub) return []
  return flattenPages(pub)
})

const pagesModalMode = ref(null) // null | 'add' | 'reduce'
const pagesModalValue = ref(4)

const pickerOpen = ref(false)
const pickerPage = ref(null)
const pickerGroups = ref([])    // ad slots — every member already ticked, or the whole slot is left out
const pickerUngrouped = ref([]) // standalone adverts, individually selectable
const pickerLoading = ref(false)

const exporting = ref(false)

watch(() => props.open, (v) => {
  if (v) {
    minimized.value = false
    pager.fetchPublications()
  }
})

const close = () => emit('update:open', false)

const backToList = () => {
  pager.activePublication.value = null
  pager.fetchPublications()
}

const openPublication = async (id) => {
  await pager.loadLayout(id)
}

const onCreate = async (formData, resolve, reject) => {
  try {
    const created = await pager.createPublication(formData)
    await pager.loadLayout(created.id)
    resolve()
  } catch (e) {
    reject(e)
  }
}

const openPagesModal = (mode) => {
  pagesModalMode.value = mode
  pagesModalValue.value = 4
}

const onConfirmPagesModal = async () => {
  const pubId = pager.activePublication.value?.publication?.id
  if (!pubId) return
  try {
    if (pagesModalMode.value === 'add') {
      await pager.increasePages(pubId, pagesModalValue.value)
    } else {
      await pager.decreasePages(pubId, pagesModalValue.value)
    }
    pagesModalMode.value = null
  } catch (e) {
    // error surfaced via pager.error, modal stays open so the user can adjust
  }
}

const onSectionChange = (pageId, section) => pager.updatePageSection(pageId, section)

// PagerPageCard always emits the full cluster's advert ids now — a single
// standalone advert is just an array of one, an ad slot is the whole set.
// Either way, unassignAdverts removes them from the page together.
const onRemoveAdvert = (pageId, advertIds) => pager.unassignAdverts(pageId, advertIds)

const openPicker = async (page) => {
  pickerPage.value = page
  pickerOpen.value = true
  pickerLoading.value = true
  try {
    // getAvailableAdverts already excludes anything not print-eligible or
    // already placed elsewhere in this publication, and groups whatever's
    // left by ad slot. Narrow both groups and ungrouped down to what's been
    // ticked in the Index table — a group only survives if EVERY one of its
    // members is checked, since a partially-ticked slot can't be placed as
    // a whole unit (and must never be split to place just the ticked part).
    const { groups, ungrouped } = await pager.getAvailableAdverts(page.id)
    const checkedSet = new Set(props.checkedAdvertIds)

    pickerGroups.value = groups.filter(g => g.adverts.every(a => checkedSet.has(a.id)))
    pickerUngrouped.value = ungrouped.filter(a => checkedSet.has(a.id))
  } finally {
    pickerLoading.value = false
  }
}

const onAdvertSelect = async (advertIds) => {
  if (!pickerPage.value) return
  await pager.assignAdverts(pickerPage.value.id, advertIds)
  pickerOpen.value = false
}

// ── Pager Map export ──────────────────────────────────────────────────────
const exportPanelOpen = ref(false)
const exportScope = ref('selected') // 'all' | 'selected'
const exportSelectedIds = ref(new Set())

const openExportPanel = async () => {
  if (pager.publications.value.length === 0) {
    await pager.fetchPublications()
  }
  // Default the selection to whatever's currently open in the popup — the
  // most common case is "export the one I'm looking at."
  const openId = pager.activePublication.value?.publication?.id
  exportSelectedIds.value = new Set(openId ? [openId] : [])
  exportScope.value = 'selected'
  exportPanelOpen.value = true
}

const toggleExportSelected = (id) => {
  const next = new Set(exportSelectedIds.value)
  next.has(id) ? next.delete(id) : next.add(id)
  exportSelectedIds.value = next
}

const runExport = async () => {
  const ids = exportScope.value === 'all'
    ? pager.publications.value.map(p => p.id)
    : [...exportSelectedIds.value]

  if (ids.length === 0) return

  exporting.value = true
  try {
    await pagerExport.exportPagerMap(ids)
    exportPanelOpen.value = false
  } catch (e) {
    pager.error.value = e?.message || 'Failed to export Pager Map'
  } finally {
    exporting.value = false
  }
}
</script>

<style scoped>
.pp-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,.45);
  display: flex; justify-content: flex-end; z-index: 4000;
  font-family: 'IBM Plex Sans', sans-serif;
}
.pp-panel {
  width: 75vw; height: 100vh; background: #F0F4F8; display: flex; flex-direction: column;
  box-shadow: -12px 0 40px rgba(0,0,0,.3);
  animation: pp-slide-in .22s ease-out;
}
@keyframes pp-slide-in {
  from { transform: translateX(100%); }
  to   { transform: translateX(0); }
}

.pp-head {
  background: #003366; padding: 14px 20px; display: flex; justify-content: space-between;
  align-items: flex-start; flex-shrink: 0; flex-wrap: wrap; gap: 10px;
}
.pp-head__eyebrow { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #9DC3E6; }
.pp-head__title   { color: #fff; font-size: 17px; font-weight: 700; margin-top: 2px; font-family: 'IBM Plex Mono', monospace; }
.pp-head__sub     { color: #9DC3E6; font-size: 11px; margin-top: 2px; }
.pp-head__actions { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
.pp-head__btn {
  font-size: 11px; font-weight: 600; padding: 6px 12px; border: 1px solid #9DC3E6;
  background: transparent; color: #9DC3E6; cursor: pointer; font-family: inherit; border-radius: 2px;
  white-space: nowrap; flex-shrink: 0;
}
.pp-head__btn:hover { background: #0066CC; color: #fff; border-color: #0066CC; }
.pp-head__btn:disabled { opacity: .5; cursor: not-allowed; }
.pp-head__btn:disabled:hover { background: transparent; color: #9DC3E6; border-color: #9DC3E6; }
.pp-head__btn--icon { padding: 6px 11px; font-size: 15px; line-height: 1; }

.pp-viewmode-row {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 20px; border-bottom: 1px solid #D1D9E0; background: #fff;
}
.pp-viewmode-label { font-size: 11px; font-weight: 700; color: #003366; }

.pp-err {
  background: #FCE4D6; border-bottom: 1px solid #E31E24; color: #9C0006;
  font-size: 12px; padding: 8px 20px; flex-shrink: 0;
}

.pp-body { flex: 1; overflow-y: auto; }
.pp-loading { padding: 40px; text-align: center; color: #888; font-size: 13px; }

/* Minimized docked tab */
.pp-tab {
  position: fixed; right: 0; top: 50%; transform: translateY(-50%);
  z-index: 4000; background: #003366; color: #fff; border: none; border-radius: 4px 0 0 4px;
  padding: 12px 8px; display: flex; flex-direction: column; align-items: center; gap: 6px;
  cursor: pointer; box-shadow: -4px 0 16px rgba(0,0,0,.25); font-family: 'IBM Plex Sans', sans-serif;
}
.pp-tab:hover { background: #0066CC; }
.pp-tab__icon { font-size: 16px; }
.pp-tab__label {
  writing-mode: vertical-rl; text-orientation: mixed; font-size: 10px; font-weight: 700;
  letter-spacing: .5px; font-family: 'IBM Plex Mono', monospace;
}

/* Add-pages mini modal */
.pp-add-overlay {
  position: fixed; inset: 0; background: rgba(0,51,102,.5); z-index: 6000;
  display: flex; align-items: center; justify-content: center;
}
.pp-add-panel {
  background: #fff; border-radius: 2px; padding: 20px; width: 280px;
  font-family: 'IBM Plex Sans', sans-serif;
}
.pp-add-title { font-size: 13px; font-weight: 700; color: #003366; }
.pp-add-hint  { font-size: 11px; color: #888; margin: 4px 0 10px; }
.pp-add-input {
  width: 100%; border: 1.5px solid #D1D9E0; border-radius: 2px; padding: 7px 10px;
  font-size: 12px; font-family: inherit; box-sizing: border-box;
}
.pp-add-actions { display: flex; gap: 8px; margin-top: 14px; justify-content: flex-end; }
.pp-add-cancel, .pp-add-confirm {
  font-size: 12px; font-weight: 600; padding: 6px 14px; border-radius: 2px; cursor: pointer; font-family: inherit;
}
.pp-add-cancel  { background: #F0F4F8; border: 1.5px solid #D1D9E0; color: #555; }
.pp-add-confirm { background: #003366; border: 1.5px solid #003366; color: #fff; }
.pp-add-confirm:hover { background: #0066CC; }

@media (max-width: 900px) {
  .pp-panel { width: 100vw; }
}

/* Export Pager Map panel */
.pp-export-overlay {
  position: fixed; inset: 0; background: rgba(0,51,102,.5); z-index: 6000;
  display: flex; align-items: center; justify-content: center; padding: 20px;
}
.pp-export-panel {
  background: #fff; width: 100%; max-width: 420px; border-radius: 3px;
  display: flex; flex-direction: column; max-height: 80vh;
  box-shadow: 0 24px 64px rgba(0,0,0,.4);
}
.pp-export-head {
  background: #003366; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center;
}
.pp-export-head h3 { color: #fff; font-size: 14px; margin: 0; }
.pp-export-close { background: none; border: none; color: #9DC3E6; font-size: 22px; cursor: pointer; line-height: 1; }
.pp-export-close:hover { color: #fff; }

.pp-export-body { padding: 14px 16px; overflow-y: auto; }
.pp-export-list { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
.pp-export-row {
  display: flex; align-items: center; gap: 10px; padding: 8px 10px;
  border: 1px solid #D1D9E0; border-radius: 2px; cursor: pointer;
}
.pp-export-row:hover { background: #F0F4F8; }
.pp-export-row input { width: 15px; height: 15px; flex-shrink: 0; }
.pp-export-row input:disabled { opacity: .4; }
.pp-export-code { font-family: 'IBM Plex Mono', monospace; font-weight: 700; font-size: 12px; color: #003366; }
.pp-export-meta { font-size: 10.5px; color: #888; }
.pp-export-empty { font-size: 11px; color: #999; text-align: center; padding: 12px; }

.pp-export-scope { display: flex; gap: 4px; background: #F0F4F8; padding: 3px; border-radius: 3px; margin-bottom: 10px; }
.pp-scope-btn {
  flex: 1; font-size: 11px; font-weight: 700; padding: 6px 10px; border: none; border-radius: 2px;
  background: transparent; color: #666; cursor: pointer;
}
.pp-scope-btn.active { background: #003366; color: #fff; }

.pp-export-hint { font-size: 10.5px; color: #888; text-align: center; }

.pp-export-foot { display: flex; justify-content: flex-end; gap: 8px; padding: 12px 16px; border-top: 1px solid #F0F4F8; }
.pp-export-cancel, .pp-export-confirm {
  font-size: 12px; font-weight: 700; padding: 7px 16px; border-radius: 2px; cursor: pointer; font-family: inherit;
}
.pp-export-cancel { background: #F0F4F8; border: 1.5px solid #D1D9E0; color: #555; }
.pp-export-confirm { background: #003366; border: 1.5px solid #003366; color: #fff; }
.pp-export-confirm:hover:not(:disabled) { background: #0066CC; }
.pp-export-confirm:disabled { background: #999; border-color: #999; cursor: not-allowed; }
</style>