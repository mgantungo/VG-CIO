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
              :disabled="exporting"
              @click="exportPdf"
            >{{ exporting ? 'Exporting…' : '⬇ Export PDF' }}</button>
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

          <PagerGrid
            v-else
            :left="pager.activePublication.value.left"
            :right="pager.activePublication.value.right"
            :sections="pager.PUBLICATION_SECTIONS"
            @section-change="onSectionChange"
            @remove-advert="onRemoveAdvert"
            @open-picker="openPicker"
          />
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
      :adverts="pickerAdverts"
      :loading="pickerLoading"
      @close="pickerOpen = false"
      @select="onAdvertSelect"
    />
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue'
import { usePager } from '~/composables/usePager'
import PagerInitModal from './PagerInitModal.vue'
import PagerGrid from './PagerGrid.vue'
import PagerAdvertPicker from './PagerAdvertPicker.vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  checkedAdvertIds: { type: Array, default: () => [] },
})
const emit = defineEmits(['update:open'])

const pager = usePager()
const minimized = ref(false)

const pagesModalMode = ref(null) // null | 'add' | 'reduce'
const pagesModalValue = ref(4)

const pickerOpen = ref(false)
const pickerPage = ref(null)
const pickerAdverts = ref([])
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
const onRemoveAdvert   = (pageId, advertId) => pager.unassignAdvert(pageId, advertId)

const openPicker = async (page) => {
  pickerPage.value = page
  pickerOpen.value = true
  pickerLoading.value = true
  try {
    // getAvailableAdverts already excludes anything not print-eligible or
    // already placed elsewhere in this publication — narrow that further to
    // only what's been ticked off in the Index table, so the Pager can't
    // pull in an advert nobody actually queued for print.
    const eligible = await pager.getAvailableAdverts(page.id)
    const checkedSet = new Set(props.checkedAdvertIds)
    pickerAdverts.value = eligible.filter(a => checkedSet.has(a.id))
  } finally {
    pickerLoading.value = false
  }
}

const onAdvertSelect = async (advertId) => {
  if (!pickerPage.value) return
  await pager.assignAdvert(pickerPage.value.id, advertId)
  pickerOpen.value = false
}

// ── PDF export ────────────────────────────────────────────────────────────
const exportPdf = async () => {
  const pub = pager.activePublication.value
  if (!pub) return
  exporting.value = true
  try {
    const { default: jsPDF } = await import('jspdf')
    const autoTable = (await import('jspdf-autotable')).default

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pageWidth = doc.internal.pageSize.getWidth()

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.setTextColor(0, 51, 102)
    doc.text(pub.publication.publication_code, 14, 16)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(80, 80, 80)
    const dateStr = pub.publication.publication_date
      ? new Date(pub.publication.publication_date).toLocaleDateString('en-UG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
      : ''
    doc.text(`${pub.publication.masthead} · ${pub.publication.total_pages} pages · ${dateStr}`, 14, 22)

    const advertsText = (page) =>
      (page.adverts || []).length === 0
        ? '—'
        : page.adverts.map(a => `${a.client?.company_name || 'Unknown'} (${a.ad_size || '—'})`).join(', ')

    const maxRows = Math.max(pub.left.length, pub.right.length)
    const rows = []
    for (let i = 0; i < maxRows; i++) {
      const l = pub.left[i]
      const r = pub.right[i]
      rows.push([
        l ? String(l.page_number) : '',
        l ? (l.section || '—') : '',
        l ? advertsText(l) : '',
        r ? String(r.page_number) : '',
        r ? (r.section || '—') : '',
        r ? advertsText(r) : '',
      ])
    }

    autoTable(doc, {
      startY: 28,
      head: [['#', 'Section', 'Adverts', '#', 'Section', 'Adverts']],
      body: rows,
      styles: { font: 'helvetica', fontSize: 8, cellPadding: 2, valign: 'top' },
      headStyles: { fillColor: [0, 51, 102], textColor: 255, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center', fontStyle: 'bold' },
        1: { cellWidth: 28 },
        2: { cellWidth: 'auto' },
        3: { cellWidth: 8, halign: 'center', fontStyle: 'bold' },
        4: { cellWidth: 28 },
        5: { cellWidth: 'auto' },
      },
      alternateRowStyles: { fillColor: [240, 244, 248] },
      margin: { left: 14, right: 14 },
      tableWidth: pageWidth - 28,
    })

    doc.save(`${pub.publication.publication_code}-pager.pdf`)
  } catch (e) {
    pager.error.value = e?.message || 'Failed to export PDF'
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
</style>