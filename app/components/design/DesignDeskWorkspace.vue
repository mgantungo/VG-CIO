<!-- components/design/DesignDeskWorkspace.vue -->
<template>
  <div class="dd-root">
    <!-- Masthead -->
    <div class="dd-masthead dd-fade" style="--dd-d:0s;">
      <div class="dd-masthead-left">
        <span class="dd-eyebrow"><i class="dd-led dd-led-live"></i>VGAMS</span>
        <h1>Design Desk</h1>
      </div>
      <div class="dd-masthead-right">
        <div class="dd-today">
          <b>{{ todayLabel }}</b>
          {{ todayDow }}
        </div>
      </div>
    </div>

    <!-- Stats strip (overview, not date-scoped) -->
    <div class="dd-stats">
      <div class="dd-stat accent-amber dd-fade" style="--dd-d:.05s;">
        <span class="n">{{ stats.pendingDesign ?? '—' }}</span>
        <span class="l"><i class="dd-led"></i>Pending Design</span>
      </div>
      <div class="dd-stat accent-blue dd-fade" style="--dd-d:.10s;">
        <span class="n">{{ stats.designApproved ?? '—' }}</span>
        <span class="l"><i class="dd-led"></i>Design Approved</span>
      </div>
      <div class="dd-stat accent-green dd-fade" style="--dd-d:.15s;">
        <span class="n">{{ stats.scheduled ?? '—' }}</span>
        <span class="l"><i class="dd-led"></i>Scheduled</span>
      </div>
      <div class="dd-stat dd-fade" style="--dd-d:.20s;">
        <span class="n">{{ stats.upcoming ?? '—' }}</span>
        <span class="l"><i class="dd-led"></i>Upcoming</span>
      </div>
      <div class="dd-stat dd-fade" style="--dd-d:.25s;">
        <span class="n">{{ stats.totalFiles ?? '—' }}</span>
        <span class="l"><i class="dd-led"></i>Files on Record</span>
      </div>
    </div>

    <!-- Day switcher -->
    <div class="dd-day-switcher dd-fade" style="--dd-d:.28s;">
      <div class="dd-day-center">
        <button class="dd-day-nav" @click="shiftDay(-1)">
          <span class="arrow">&larr;</span>
          <span class="peek">{{ formatShort(prevDate) }}</span>
        </button>
        <div class="dd-day-current">
          <div class="dow dd-mono">{{ currentDow }}</div>
          <div class="dm">{{ currentDayMonth }}</div>
        </div>
        <button class="dd-day-nav" @click="shiftDay(1)">
          <span class="peek">{{ formatShort(nextDate) }}</span>
          <span class="arrow">&rarr;</span>
        </button>
      </div>

      <div class="dd-day-jump">
        Jump to
        <input type="date" v-model="selectedDate" @change="loadDay" />
      </div>
    </div>

    <!-- Toolbar with search -->
    <div class="dd-toolbar dd-fade" style="--dd-d:.34s;">
      <div class="dd-tabs">
        <button class="dd-tab" :class="{ active: activeTab === 'queue' }" @click="activeTab = 'queue'">
          Queue <span class="count dd-mono">{{ bookings.length }}</span>
        </button>
        <button class="dd-tab" :class="{ active: activeTab === 'batches' }" @click="activeTab = 'batches'">
          Batches <span class="count dd-mono">{{ batchesForDate.length }}</span>
        </button>
      </div>

      <div class="dd-search">
        <span class="dd-search-icon">⌕</span>
        <input
          v-model.trim="searchQuery"
          type="text"
          class="dd-search-input"
          placeholder="Search BC ref, contact person, or number…"
        />
        <button v-if="searchQuery" class="dd-search-clear" @click="searchQuery = ''">&times;</button>
      </div>

      <select
        v-model="selectedScope"
        class="dd-product-select"
        title="Filter by category"
        @change="onScopeChange"
      >
        <option v-for="opt in scopeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
      </select>

      <select
        v-model="selectedProductId"
        class="dd-product-select"
        title="Filter by product"
        @change="onProductFilterChange"
      >
        <option value="">All Products</option>
        <option v-for="p in products" :key="p.id" :value="p.id">{{ p.name }}</option>
      </select>

      <button class="dd-btn ghost" @click="showSheetModal = true">📊 Spreadsheet View</button>
      <button class="dd-btn primary" @click="newBatch">+ New Batch</button>
    </div>

    <!-- Assign bar — reused inside QueueSheetModal too -->
    <AssignBar
      :advert="pendingAssignAdvert"
      :groups="activeBatch?.fileGroups || []"
      @assign="assignToGroup"
      @assign-new="assignToNewGroup"
      @cancel="pendingAssignAdvert = null"
    />

    <!-- Main split -->
    <div class="dd-board">
      <!-- Left: Queue or Batches -->
      <div class="dd-col dd-col-queue">
        <template v-if="activeTab === 'queue'">
          <div class="dd-col-heading">
            <h2>Bookings — {{ currentDayMonth }}</h2>
            <span class="hint">
              {{ (searchQuery || clearFilter) ? `${filteredBookings.length} of ${bookings.length}` : `${bookings.length} total` }}
              <span class="dd-live" :title="live.lastRefreshed.value ? `Updated ${clockLabel(live.lastRefreshed.value)}` : ''">
                <i :class="{ on: !anyModalOpen }"></i>{{ anyModalOpen ? 'Paused' : 'Live' }}<template v-if="live.lastRefreshed.value"> · {{ clockLabel(live.lastRefreshed.value) }}</template>
              </span>
            </span>
          </div>

          <!-- Copy Desk clearance filter -->
          <div class="dd-clearseg" role="group" aria-label="Copy Desk clearance">
            <button v-for="f in clearFilters" :key="f.value" type="button" :class="{ on: clearFilter === f.value }" @click="clearFilter = f.value">
              {{ f.label }} <b>{{ f.count }}</b>
            </button>
          </div>
          <div v-if="newlyCleared.size > 0" class="dd-newclear" role="status">
            <span><b>{{ newlyCleared.size }}</b> advert{{ newlyCleared.size === 1 ? '' : 's' }} cleared or changed by Copy Desk since you opened this day.</span>
            <button class="dd-btn small ghost" type="button" @click="clearFilter = 'cleared'; ackCleared()">Show</button>
            <button class="dd-btn small ghost" type="button" @click="ackCleared">Dismiss</button>
          </div>

          <div v-if="loadingDay" class="dd-empty">Loading…</div>
          <div v-else-if="bookings.length === 0" class="dd-empty">No bookings touch this day.</div>
          <div v-else-if="filteredBookings.length === 0" class="dd-empty">{{ searchQuery ? `No matches for "${searchQuery}".` : 'Nothing matches this filter.' }}</div>
          <QueueCard
            v-for="(advert, qi) in filteredBookings"
            :key="advert.id"
            :advert="advert"
            :active-date="activeBatch?.targetRunDate || selectedDate"
            :on-layout="pinnedAdvertIds.has(String(advert.id))"
            :file-group-name="getFileGroupName(advert.id)"
            class="dd-fade"
            :style="{ '--dd-d': Math.min(qi * 0.06, 0.4) + 's' }"
            @add-to-board="onAddToBoard"
            @view-brief="briefAdvert = $event"
            @view-attachments="attachmentsAdvert = $event"
            :placement="placements[advert.id] || null"
            @attach-artwork="artworkAdvert = $event"
          />
        </template>

        <template v-else>
          <div class="dd-col-heading">
            <h2>Batches — {{ currentDayMonth }}</h2>
            <span class="hint">{{ batchesForDate.length }} total</span>
          </div>
          <div v-if="batchesForDate.length === 0" class="dd-empty">No batches for this day yet.</div>
          <div
            v-for="b in batchesForDate"
            :key="b.id"
            class="dd-batch-row"
            @click="openBatchDetail(b.id)"
          >
            <div>
              <div class="br-title">{{ b.label || b.reference }}</div>
              <div class="br-meta">{{ b.advertsCount }} advert(s) · {{ b.fileGroupsCount }} group(s) · {{ b.filesCount }} file(s)</div>
            </div>
            <span class="dd-stamp" :class="b.status">{{ b.status }}</span>
          </div>
        </template>
      </div>

      <!-- Right: persistent active layout board -->
      <div class="dd-col dd-col-layout">
        <div class="dd-col-heading">
          <h2>Layout Board</h2>
          <span class="hint" v-if="activeBatch">{{ activeBatch.reference }}</span>
        </div>

        <div v-if="!activeBatch" class="dd-empty">
          No active batch. Click "+ New Ad Slot" or pin an advert from the queue to start one.
        </div>

        <template v-else>
          <div class="dd-ticket">
            <div class="dd-ticket-row">
              <div class="dd-field">
                <label>Label</label>
                <input type="text" v-model="batchLabel" @change="saveLabel" />
              </div>
              <div class="dd-field">
                <label>Target Run Date</label>
                <input type="text" :value="formatShort(activeBatch.targetRunDate)" disabled />
              </div>
              <div class="dd-field">
                <label>Status</label>
                <input type="text" :value="activeBatch.status" disabled />
              </div>
            </div>
            <div class="dd-field">
              <label>Notes</label>
              <textarea rows="2" v-model="batchNotes" @change="saveNotes"></textarea>
            </div>
            <div class="dd-ticket-row" style="margin-top:10px;margin-bottom:0;">
              <button class="dd-btn small ghost" :disabled="activeBatch.status !== 'draft'" @click="doMarkReady">Mark Ready</button>
              <button class="dd-btn small ghost" @click="doArchive">Archive</button>
            </div>
          </div>

          <FileGroupCard
            v-for="group in activeBatch.fileGroups"
            :key="group.id"
            :group="group"
            @upload-file="file => onGroupFile(group.id, file)"
            @remove-advert="advertId => onGroupRemoveAdvert(group.id, advertId)"
            @remove-group="onRemoveGroup(group.id)"
            @assign-advert="advertId => assignAdvertDirectly(group.id, advertId)"
          />

          <button class="dd-btn ghost" style="width:100%;justify-content:center;margin-bottom:16px;" @click="addEmptyGroup">
            + New Ad Slot
          </button>

          <button
            class="dd-btn primary"
            style="width:100%;justify-content:center;"
            :disabled="!activeBatch.advertsCount"
            @click="openAttach"
          >
            Attach to Schedule
          </button>
        </template>
      </div>
    </div>

    <BriefModal :advert="briefAdvert" @close="briefAdvert = null" />
    <AttachmentsModal :advert="attachmentsAdvert" @close="attachmentsAdvert = null" />
    <UnmarkCompleteModal :advert="unmarkTargetAdvert" @close="unmarkTargetAdvert = null" @unmarked="onUnmarked" />

    <AttachScheduleModal
      :batch="attachTarget"
      @close="attachTarget = null"
      @confirm="onAttachConfirm"
    />

    <!-- Workflow re-order: artwork per run date for any booking -->
    <ArtworkModal
      :advert="artworkAdvert"
      :placement="artworkAdvert ? (placements[artworkAdvert.id] || null) : null"
      @close="artworkAdvert = null"
      @saved="onArtworkSaved"
    />

    <BatchDetailModal
      :batch="detailBatch"
      @close="detailBatch = null"
      @edit="onEditFromDetail"
      @delete="onDeleteFromDetail"
    />

    <QueueSheetModal
      :open="showSheetModal"
      :bookings="filteredBookings"
      :active-batch="activeBatch"
      :pending-assign-advert="pendingAssignAdvert"
      :active-date="activeBatch?.targetRunDate || selectedDate"
      :date-label="currentDayMonth"
      :product-label="selectedProductName"
      @close="showSheetModal = false"
      @view-brief="briefAdvert = $event"
      @view-attachments="attachmentsAdvert = $event"
      @add-to-board="onAddToBoard"
      @assign="assignToGroup"
      @assign-new="assignToNewGroup"
      @cancel-assign="pendingAssignAdvert = null"
      @assign-advert-to-group="({ groupId, advertId }) => assignAdvertDirectly(groupId, advertId)"
      @upload-file="({ groupId, file }) => onGroupFile(groupId, file)"
      @remove-advert="({ groupId, advertId }) => onGroupRemoveAdvert(groupId, advertId)"
      @remove-group="onRemoveGroup"
      @add-group="addEmptyGroup"
      @toggle-handled="toggleHandled"
      @request-unmark="unmarkTargetAdvert = $event"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useDesignHouse } from '~/composables/useDesignHouse'
import { useAuth } from '~/composables/useAuth'
import QueueCard from './QueueCard.vue'
import FileGroupCard from './FileGroupCard.vue'
import BriefModal from './BriefModal.vue'
import AttachmentsModal from './AttachmentsModal.vue'
import UnmarkCompleteModal from './ext/UnmarkCompleteModal.vue'
import AttachScheduleModal from './AttachScheduleModal.vue'
import BatchDetailModal from './BatchDetailModal.vue'
import AssignBar from './ext/AssignBar.vue'
import QueueSheetModal from './ext/QueueSheetModal.vue'
import ArtworkModal from './ArtworkModal.vue'
import { useWorkspace } from '~/composables/useWorkspace'
import { useLivePoll } from '~/composables/useLivePoll'


const {
  fetchBookingsByDate,
  fetchDesignStats,
  createBatch,
  listBatches,
  getBatchDetail,
  updateBatch,
  deleteBatch,
  addFileGroup,
  removeFileGroup,
  addAdvertToFileGroup,
  removeAdvertFromFileGroup,
  uploadFileToGroup,
  attachBatch,
  markReady,
  archiveBatch,
  markDesignComplete,
  fetchProducts,
  fetchProductCategories,
  fetchPlacements,
  attachBatchMulti,
} = useDesignHouse()

// ── Workflow re-order: Copy Desk placement per advert + artwork modal ────
const ws = useWorkspace()
const placements = ref({})      // advertId → { runDates, placed, nextPlacement, nextUnplaced }
const artworkAdvert = ref(null)

async function refreshPlacements() {
  const ids = (bookings.value || []).map(a => a.id)
  placements.value = await fetchPlacements(ids)
  const notPlaced = (bookings.value || []).filter(a => {
    const p = placements.value[a.id]
    const forDay = p?.runDates?.find(s => s.date === selectedDate.value)
    return !forDay?.placed
  }).length
  ws.setBadges({ notPlaced })
}

async function onArtworkSaved() {
  await loadDay()
  // keep the modal open on the same advert with fresh dates
  if (artworkAdvert.value) {
    artworkAdvert.value = (bookings.value || []).find(a => a.id === artworkAdvert.value.id) || artworkAdvert.value
  }
}

const { user: currentUser } = useAuth()
const designerEmail = computed(() => currentUser.value?.email || '')

// ── Date state ───────────────────────────────────────────────────────────
function toDateStr(d) { return d.toISOString().split('T')[0] }

const selectedDate = ref(toDateStr(new Date()))
const activeTab = ref('queue')
const loadingDay = ref(false)

const prevDate = computed(() => {
  const d = new Date(selectedDate.value); d.setDate(d.getDate() - 1); return toDateStr(d)
})
const nextDate = computed(() => {
  const d = new Date(selectedDate.value); d.setDate(d.getDate() + 1); return toDateStr(d)
})
const currentDow = computed(() => new Date(selectedDate.value).toLocaleDateString('en-UG', { weekday: 'long' }))
const currentDayMonth = computed(() => new Date(selectedDate.value).toLocaleDateString('en-UG', { day: '2-digit', month: 'short', year: 'numeric' }))

const todayLabel = computed(() => new Date().toLocaleDateString('en-UG', { day: '2-digit', month: 'short', year: 'numeric' }))
const todayDow = computed(() => new Date().toLocaleDateString('en-UG', { weekday: 'long' }))

function formatShort(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-UG', { day: '2-digit', month: 'short' })
}

function shiftDay(delta) {
  const d = new Date(selectedDate.value)
  d.setDate(d.getDate() + delta)
  selectedDate.value = toDateStr(d)
  loadDay()
}

// ── Data ─────────────────────────────────────────────────────────────────
const bookings = ref([])
const batchesForDate = ref([])
const activeBatch = ref(null)

// Every advert id already pinned into any ad slot on the active batch
const pinnedAdvertIds = computed(() => {
  const ids = new Set()
  ;(activeBatch.value?.fileGroups || []).forEach(g => {
    (g.adverts || []).forEach(a => ids.add(String(a.id)))
  })
  return ids
})

// Get the ad slot name for a specific advert
function getFileGroupName(advertId) {
  if (!activeBatch.value?.fileGroups) return null
  const group = activeBatch.value.fileGroups.find(g => 
    g.adverts?.some(a => String(a.id) === String(advertId))
  )
  return group?.label || group?.name || null
}

const searchQuery = ref('')
// ── Copy Desk clearance per advert for the working date ──────────────────
const workDate = computed(() => activeBatch.value?.targetRunDate || selectedDate.value)
function clearanceOf(advertId) {
  const s = placements.value[advertId]?.runDates?.find(r => r.date === workDate.value)
  return s?.clearance || null
}
const isClearedNow = (c) => !!c && (c.status === 'cleared' || c.status === 'changed')
const clearFilter = ref('')   // '' | 'cleared' | 'awaiting' | 'changed'
const clearFilters = computed(() => {
  const all = bookings.value || []
  const cs = all.map(a => clearanceOf(a.id))
  return [
    { value: '', label: 'All', count: all.length },
    { value: 'cleared', label: 'Cleared for design', count: cs.filter(isClearedNow).length },
    { value: 'changed', label: 'Changed', count: cs.filter(c => c?.status === 'changed').length },
    { value: 'awaiting', label: 'Awaiting Copy Desk', count: cs.filter(c => !isClearedNow(c)).length },
  ]
})

// Cleared/changed since the day was opened: key = id + status + changedAt
const seenClearKeys = ref(null)
const newlyCleared = ref(new Set())
function clearKey(advertId) {
  const c = clearanceOf(advertId)
  return isClearedNow(c) ? `${advertId}:${c.status}:${c.changedAt || c.clearedAt || ''}` : null
}
function trackClearances() {
  const keys = (bookings.value || []).map(a => clearKey(a.id)).filter(Boolean)
  if (seenClearKeys.value === null) {
    seenClearKeys.value = new Set(keys)
    newlyCleared.value = new Set()
    return
  }
  newlyCleared.value = new Set(keys.filter(k => !seenClearKeys.value.has(k)))
}
function ackCleared() {
  for (const k of newlyCleared.value) seenClearKeys.value?.add(k)
  newlyCleared.value = new Set()
}

const anyModalOpen = computed(() => !!(artworkAdvert.value || briefAdvert.value || attachmentsAdvert.value
  || unmarkTargetAdvert.value || attachTarget.value || detailBatch.value || showSheetModal.value || pendingAssignAdvert.value))
const clockLabel = (d) => new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

const filteredBookings = computed(() => {
  const q = searchQuery.value.toLowerCase().trim()
  const byClear = (bookings.value || []).filter(a => {
    if (!clearFilter.value) return true
    const c = clearanceOf(a.id)
    if (clearFilter.value === 'cleared') return isClearedNow(c)
    if (clearFilter.value === 'changed') return c?.status === 'changed'
    return !isClearedNow(c)
  })
  if (!q) return byClear
  return byClear.filter(a => {
    const bcRef    = (a.bcReference    || '').toLowerCase()
    const person   = (a.contactPerson  || '').toLowerCase()
    const number   = (a.contactNumber  || '').toLowerCase()
    return bcRef.includes(q) || person.includes(q) || number.includes(q)
  })
})
const batchNotes = ref('')
const batchLabel = ref('')
const stats = ref({})

// ── Category scope (radio) + product filter (select) ───────────────────────
// scope defaults to 'print' — Design House works on print layout day-to-day —
// but the radio options themselves come from whatever categories actually
// exist (product-category), so nothing here is a hardcoded guess at TV/Radio/
// Billboard/etc. spellings.
const categories = ref([])
const selectedScope = ref('print')
const products = ref([])
const selectedProductId = ref('') // '' = all products within the current scope

const scopeOptions = computed(() => [
  ...categories.value.map(c => ({ value: c.type, label: c.name })),
  { value: 'all', label: 'All' },
])

const selectedProductName = computed(() => {
  if (selectedProductId.value) {
    return products.value.find(p => String(p.id) === String(selectedProductId.value))?.name || null
  }
  const scopeOpt = scopeOptions.value.find(o => o.value === selectedScope.value)
  return scopeOpt && scopeOpt.value !== 'all' ? scopeOpt.label : null
})

async function loadCategories() {
  try {
    const res = await fetchProductCategories()
    categories.value = res.categories || []
  } catch (e) { /* surfaced via composable's error ref if needed */ }
}

async function loadProducts() {
  try {
    const res = await fetchProducts(selectedScope.value)
    products.value = res.products || []
    // The previously selected product may not exist in the new scope —
    // fall back to "All Products" within that scope rather than silently
    // keeping a stale, now-invalid productId in subsequent requests.
    if (selectedProductId.value && !products.value.some(p => String(p.id) === String(selectedProductId.value))) {
      selectedProductId.value = ''
    }
  } catch (e) { /* surfaced via composable's error ref if needed */ }
}

async function loadStats() {
  try {
    const res = await fetchDesignStats(null, null, selectedProductId.value || null, selectedScope.value)
    stats.value = res.statistics || {}
  } catch (e) { /* surfaced via composable's error ref if needed */ }
}

async function refreshBatchesList() {
  const res = await listBatches({ date: selectedDate.value })
  batchesForDate.value = res.batches || []
}

// quiet: background refresh from useLivePoll — no "Loading…" flash, and the
// active batch is only re-read (never swapped) so work in progress stays put.
let loadedKey = null
async function loadDay({ quiet = false } = {}) {
  const key = `${selectedDate.value}|${selectedProductId.value}|${selectedScope.value}`
  if (key !== loadedKey) {
    loadedKey = key
    seenClearKeys.value = null
    newlyCleared.value = new Set()
  }
  if (!quiet) loadingDay.value = true
  try {
    const [bookingsRes] = await Promise.all([
      fetchBookingsByDate(selectedDate.value, selectedProductId.value || null, selectedScope.value),
      refreshBatchesList(),
    ])
    bookings.value = bookingsRes.adverts || []
    await refreshPlacements()
    trackClearances()
    live.markRefreshed()

    if (quiet) {
      if (activeBatch.value) await refreshActiveBatch()
      return
    }

    const draft = batchesForDate.value.find(b => b.status === 'draft')
    if (draft) {
      const detail = await getBatchDetail(draft.id)
      activeBatch.value = detail.batch
      batchNotes.value = detail.batch.notes || ''
      batchLabel.value = detail.batch.label || ''
    } else {
      activeBatch.value = null
      batchNotes.value = ''
      batchLabel.value = ''
    }
  } finally {
    if (!quiet) loadingDay.value = false
  }
}

// Bookings and Copy Desk clearances change all day — refresh every minute
// while the tab is visible and no modal is open.
const live = useLivePoll(() => loadDay({ quiet: true }), { intervalMs: 60000, isPaused: () => anyModalOpen.value || loadingDay.value })

async function onScopeChange() {
  await loadProducts()
  await Promise.all([loadDay(), loadStats()])
}

async function onProductFilterChange() {
  await Promise.all([loadDay(), loadStats()])
}

async function refreshActiveBatch() {
  if (!activeBatch.value) return
  const detail = await getBatchDetail(activeBatch.value.id)
  activeBatch.value = detail.batch
}

async function saveNotes() {
  if (!activeBatch.value) return
  await updateBatch(activeBatch.value.id, { notes: batchNotes.value })
}
async function saveLabel() {
  if (!activeBatch.value) return
  await updateBatch(activeBatch.value.id, { label: batchLabel.value })
  await refreshBatchesList()
}

// ── Batch actions ────────────────────────────────────────────────────────
async function newBatch() {
  const label = `Layout Board — ${currentDayMonth.value}`
  const res = await createBatch({ label, targetRunDate: selectedDate.value })
  const detail = await getBatchDetail(res.batch.id)
  activeBatch.value = detail.batch
  batchNotes.value = detail.batch.notes || ''
  batchLabel.value = detail.batch.label || ''
  await refreshBatchesList()
}

async function addEmptyGroup() {
  if (!activeBatch.value) return
  await addFileGroup(activeBatch.value.id)
  await refreshActiveBatch()
}

async function onGroupFile(groupId, file) {
  await uploadFileToGroup(activeBatch.value.id, groupId, file, designerEmail.value)
  await refreshActiveBatch()
}
async function onGroupRemoveAdvert(groupId, advertId) {
  await removeAdvertFromFileGroup(activeBatch.value.id, groupId, advertId, designerEmail.value)
  await refreshActiveBatch()
  await refreshBatchesList()
}
async function onRemoveGroup(groupId) {
  if (!confirm('Remove this ad slot? Any pinned adverts will be unpinned.')) return
  await removeFileGroup(activeBatch.value.id, groupId)
  await refreshActiveBatch()
  await refreshBatchesList()
}

async function doMarkReady() {
  await markReady(activeBatch.value.id)
  await refreshActiveBatch()
  await refreshBatchesList()
}
async function doArchive() {
  if (!confirm('Archive this batch?')) return
  await archiveBatch(activeBatch.value.id)
  activeBatch.value = null
  await refreshBatchesList()
}

// ── Assign-from-queue flow ───────────────────────────────────────────────
const pendingAssignAdvert = ref(null)

async function onAddToBoard(advert) {
  if (!activeBatch.value) {
    await newBatch()
  }
  pendingAssignAdvert.value = advert
}

async function assignToGroup(groupId) {
  try {
    await addAdvertToFileGroup(activeBatch.value.id, groupId, pendingAssignAdvert.value.id, designerEmail.value)
    pendingAssignAdvert.value = null
    await refreshActiveBatch()
    await refreshBatchesList()
  } catch (e) {
    alert(e?.data?.message || 'Could not add this advert to the group.')
  }
}

async function assignToNewGroup() {
  try {
    const created = await addFileGroup(activeBatch.value.id, pendingAssignAdvert.value.advertTitle)
    const groups = created.fileGroups || []
    const newGroup = groups[groups.length - 1]
    await addAdvertToFileGroup(activeBatch.value.id, newGroup.id, pendingAssignAdvert.value.id, designerEmail.value)
    pendingAssignAdvert.value = null
    await refreshActiveBatch()
    await refreshBatchesList()
  } catch (e) {
    alert(e?.data?.message || 'Could not create a new group for this advert.')
  }
}

// Drag-and-drop path — an advert row was dropped directly onto a FileGroupCard
// inside QueueSheetModal, bypassing the AssignBar picker. Only reachable when
// activeBatch already exists, since that's the only way a FileGroupCard is
// rendered to drop onto in the first place — so no "create batch first" step
// is needed here, unlike onAddToBoard.
async function assignAdvertDirectly(groupId, advertId) {
  try {
    await addAdvertToFileGroup(activeBatch.value.id, groupId, advertId, designerEmail.value)
    await refreshActiveBatch()
    await refreshBatchesList()
  } catch (e) {
    alert(e?.data?.message || 'Could not add this advert to the group.')
  }
}

// "Handled" checkbox in QueueSheetModal. markDesignComplete sets isApproved
// = true server-side. Updates the local row optimistically rather than
// reloading the whole day for a snappier check.
async function toggleHandled(advertId) {
  try {
    await markDesignComplete(advertId, '', designerEmail.value)
    const row = bookings.value.find(a => String(a.id) === String(advertId))
    if (row) row.isApproved = true
  } catch (e) {
    // The backend now rejects this until the advert has a designed file
    // pinned to an ad slot — surface that message rather than the generic
    // fallback so the designer knows what's actually missing.
    alert(e?.data?.message || 'Could not mark this advert as handled.')
  }
}

// Fired by UnmarkCompleteModal once the server confirms the two-step
// verified reversal actually went through - same optimistic local-row
// update convention as toggleHandled above, just flipping isApproved back.
function onUnmarked(advertId) {
  const row = bookings.value.find(a => String(a.id) === String(advertId))
  if (row) row.isApproved = false
}

// ── Modals ───────────────────────────────────────────────────────────────
const briefAdvert = ref(null)
const attachmentsAdvert = ref(null)
const unmarkTargetAdvert = ref(null)
const attachTarget = ref(null)
const detailBatch = ref(null)
const showSheetModal = ref(false)

function openAttach() {
  attachTarget.value = activeBatch.value
}

async function onAttachConfirm(runTime, opts = {}) {
  // "All remaining run dates" carries the batch's artwork to every later
  // date its adverts are booked for (POST /design-batches/:id/attach-multi)
  if (opts.carryForward) {
    await attachBatchMulti(attachTarget.value.id, 'all_pending', runTime)
  } else {
    await attachBatch(attachTarget.value.id, runTime)
  }
  attachTarget.value = null
  await loadDay()
  await loadStats()
}

async function openBatchDetail(batchId) {
  const res = await getBatchDetail(batchId)
  detailBatch.value = res.batch
}

function onEditFromDetail(batch) {
  activeBatch.value = batch
  batchNotes.value = batch.notes || ''
  batchLabel.value = batch.label || ''
  detailBatch.value = null
  activeTab.value = 'queue'
}

async function onDeleteFromDetail(batch) {
  if (!confirm(`Delete batch "${batch.label}"? This can't be undone.`)) return
  await deleteBatch(batch.id)
  detailBatch.value = null
  if (activeBatch.value?.id === batch.id) activeBatch.value = null
  await refreshBatchesList()
}

onMounted(() => {
  loadCategories()
  loadProducts()
  loadStats()
  loadDay()
})
</script>

<style scoped>
/* ══════════════════════════════════════════════════════════
   Design tokens — brushed-metal / machined control-panel look.
   Kept local to this component (scoped), matching the pattern
   already used by QueueCard.vue.
   ══════════════════════════════════════════════════════════ */
.dd-root{
  --dd-metal-50:   #F7F8F9;
  --dd-metal-100:  #EEF0F2;
  --dd-metal-200:  #E1E4E7;
  --dd-metal-300:  #CDD1D6;
  --dd-metal-rail: #B7BCC2;
  --dd-ink:        #1D2226;
  --dd-ink-soft:   #5B6169;
  --dd-ink-faint:  #8A8F96;
  --dd-navy:       #00335F;
  --dd-navy-glow:  #2E5F9E;
  --dd-navy-soft:  #E7EDF5;
  --dd-red:        #BE1622;
  --dd-led-green:  #2E8B57;
  --dd-led-green-soft: #E6F4EC;
  --dd-led-amber:  #C08A22;
  --dd-led-amber-soft: #F8F0DC;
  --dd-led-blue:   #3E6FB0;
  --dd-led-blue-soft:  #E9F0F9;
  --dd-led-red:    #C23B3B;
  --dd-led-red-soft:   #FBEAEA;
  --dd-bevel-out:
    0 1px 0 rgba(255,255,255,.75) inset,
    0 -1px 0 rgba(0,0,0,.10) inset,
    0 1px 2px rgba(20,24,28,.08);
  --dd-bevel-in:
    0 1px 2px rgba(0,0,0,.14) inset,
    0 -1px 0 rgba(255,255,255,.5) inset;

  background: var(--dd-metal-50);
  color: var(--dd-ink);
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  line-height: 1.45;
}
.dd-mono{font-family:'IBM Plex Mono',monospace;}

/* ── Entrance fade-in for native elements in this template ─── */
.dd-fade{
  opacity: 0;
  animation: dd-fade-in .55s cubic-bezier(.22,.68,.36,1) forwards;
  animation-delay: var(--dd-d, 0s);
}
@keyframes dd-fade-in{
  from{ opacity:0; transform: translateY(8px); }
  to{ opacity:1; transform: translateY(0); }
}
.dd-masthead.dd-fade{ animation-name: dd-power-on; }
@keyframes dd-power-on{
  from{ opacity:0; filter: brightness(.6) saturate(.7); }
  to{ opacity:1; filter: brightness(1) saturate(1); }
}

/* ── LED indicators (reused across masthead / stats) ────────── */
.dd-led{
  width:6px; height:6px; border-radius:50%;
  background: var(--dd-metal-rail);
  display:inline-block;
  flex-shrink:0;
}
.dd-led-live{
  background: var(--dd-led-green);
  box-shadow: 0 0 6px 1.5px rgba(46,139,87,.9);
  margin-right: 7px;
}

/* ── Masthead — lit power-strip header ─────────────────────── */
.dd-masthead{
  display:flex;
  align-items:center;
  justify-content:space-between;
  padding:18px 28px 16px;
  background: linear-gradient(180deg, #0A3D6B 0%, var(--dd-navy) 55%, #002748 100%);
  position: relative;
  box-shadow: 0 1px 0 rgba(255,255,255,.08) inset, 0 3px 8px rgba(0,0,0,.25);
}
.dd-masthead::after{
  content:'';
  position:absolute; top:0; left:0; right:0; height:3px;
  background: linear-gradient(90deg, var(--dd-led-blue), #6FA8DC 50%, var(--dd-led-blue));
  box-shadow: 0 0 8px rgba(111,168,220,.7);
}
.dd-masthead-left{
  display:flex;
  align-items:baseline;
  gap:14px;
}
.dd-eyebrow{
  font-family:'IBM Plex Mono',monospace;
  font-size:10.5px;
  letter-spacing:.16em;
  color:#9FC2E8;
  text-transform:uppercase;
  display:inline-flex;
  align-items:center;
}
.dd-masthead h1{
  font-family:'IBM Plex Sans', sans-serif;
  font-weight:700;
  font-size:22px;
  margin:0;
  letter-spacing:-.005em;
  color:#F4F7FB;
}
.dd-masthead-right{
  display:flex;
  align-items:center;
  gap:18px;
}
.dd-today{
  font-family:'IBM Plex Mono',monospace;
  font-size:12px;
  color:#C7D8EB;
  text-align:right;
  line-height:1.3;
}
.dd-today b{
  color:#fff;
  display:block;
  font-size:13.5px;
}

/* ── Stats strip — gauge tiles ──────────────────────────────── */
.dd-stats{
  display:flex;
  background: var(--dd-metal-300);
  border-bottom:1px solid var(--dd-metal-rail);
  flex-wrap:wrap;
  gap:1px;
}
.dd-stat{
  flex:1;
  min-width:120px;
  padding:14px 20px 12px;
  background: linear-gradient(180deg, #FCFDFD, var(--dd-metal-100));
  display:flex;
  flex-direction:column;
  gap:5px;
  position: relative;
}
.dd-stat::before{
  content:'';
  position:absolute; top:0; left:0; right:0; height:2px;
  background: var(--dd-stat-color, var(--dd-metal-rail));
  opacity:.75;
}
.dd-stat .n{
  font-family:'IBM Plex Mono',monospace;
  font-size:22px;
  font-weight:600;
  color: var(--dd-ink);
}
.dd-stat .l{
  display:flex; align-items:center; gap:6px;
  font-size:10.5px;
  letter-spacing:.06em;
  text-transform:uppercase;
  color:var(--dd-ink-soft);
}
.dd-stat .l .dd-led{ background: var(--dd-stat-color, var(--dd-metal-rail)); }
.dd-stat.accent-blue{ --dd-stat-color: var(--dd-led-blue); }
.dd-stat.accent-blue .n{ color: var(--dd-led-blue); }
.dd-stat.accent-red{ --dd-stat-color: var(--dd-led-red); }
.dd-stat.accent-red .n{ color: var(--dd-led-red); }
.dd-stat.accent-green{ --dd-stat-color: var(--dd-led-green); }
.dd-stat.accent-green .n{ color: var(--dd-led-green); }
.dd-stat.accent-amber{ --dd-stat-color: var(--dd-led-amber); }
.dd-stat.accent-amber .n{ color: var(--dd-led-amber); }

/* ── Day Switcher — tactile control ─────────────────────────── */
.dd-day-switcher {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 16px 28px;
  border-bottom: 1px solid var(--dd-metal-300);
  background: var(--dd-metal-100);
  flex-wrap: wrap;
}

.dd-day-center {
  display: flex;
  align-items: center;
  gap: 18px;
}
.dd-day-nav {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  cursor: pointer;
  padding: 6px 16px;
  border-radius: 20px;
  color: var(--dd-navy);
  background: linear-gradient(180deg, #FDFDFE, var(--dd-metal-200));
  box-shadow: var(--dd-bevel-out), 0 2px 3px rgba(20,24,28,.10);
  border: none;
  font-family: inherit;
  transition: box-shadow .1s ease, transform .1s ease;
}
.dd-day-nav:hover {
  box-shadow: var(--dd-bevel-out), 0 2px 5px rgba(20,24,28,.16);
}
.dd-day-nav:active {
  box-shadow: var(--dd-bevel-in);
  transform: translateY(1px);
}
.dd-day-nav .arrow {
  font-size: 14px;
}
.dd-day-nav .peek {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 9px;
}
.dd-day-current {
  text-align: center;
  min-width: 116px;
  background: linear-gradient(180deg, #23282D, #14181B);
  border-radius: 4px;
  padding: 8px 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,.3), 0 0 0 1px rgba(0,0,0,.4);
}
.dd-day-current .dow {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 10px;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: #6FA8DC;
}
.dd-day-current .dm {
  font-family: 'IBM Plex Sans', sans-serif;
  font-weight: 600;
  font-size: 16px;
  line-height: 1.3;
  color: #F4F7FB;
}

.dd-day-jump {
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: 11.5px;
  color: var(--dd-ink-soft);
}
.dd-day-jump input[type="date"] {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 12px;
  border: none;
  border-radius: 3px;
  padding: 7px 9px;
  background: #fff;
  box-shadow: var(--dd-bevel-in), 0 0 0 1px var(--dd-metal-300);
  color: var(--dd-ink);
}

/* ── Toolbar ─────────────────────────────────────────────────── */
.dd-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 28px;
  border-bottom: 1px solid var(--dd-metal-300);
  background: var(--dd-metal-50);
  flex-wrap: wrap;
  gap: 12px;
}

.dd-tabs {
  display: flex;
  background: var(--dd-metal-200);
  border-radius: 4px;
  padding: 3px;
  box-shadow: var(--dd-bevel-in);
  gap: 2px;
}
.dd-tab {
  font-size: 12.5px;
  font-weight: 600;
  padding: 8px 16px;
  border-radius: 3px;
  cursor: pointer;
  color: var(--dd-ink-soft);
  border: none;
  background: none;
  font-family: inherit;
  display: flex;
  align-items: center;
  gap: 7px;
  transition: background .12s ease, color .12s ease, box-shadow .12s ease;
}
.dd-tab.active {
  background: linear-gradient(180deg, #fff, var(--dd-metal-100));
  color: var(--dd-navy);
  box-shadow: var(--dd-bevel-out);
}
.dd-tab .count {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 10.5px;
  padding: 1px 6px;
  border-radius: 8px;
  background: var(--dd-metal-300);
  color: var(--dd-ink-soft);
}
.dd-tab.active .count {
  background: var(--dd-navy-soft);
  color: var(--dd-navy);
}

/* ── Search Box ────────────────────────────────────────────────────────── */
.dd-search {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1 1 300px;
  max-width: 400px;
  min-width: 180px;
  background: #fff;
  border-radius: 4px;
  padding: 0 10px;
  box-shadow: var(--dd-bevel-in), 0 0 0 1px var(--dd-metal-300);
}
.dd-search-icon {
  color: var(--dd-ink-faint);
  font-size: 14px;
  flex-shrink: 0;
}
.dd-search-input {
  flex: 1;
  border: none;
  background: none;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  padding: 8px 4px;
  color: var(--dd-ink);
  outline: none;
  min-width: 100px;
}
.dd-search-input::placeholder {
  color: var(--dd-ink-faint);
}
.dd-search-clear {
  border: none;
  background: none;
  color: var(--dd-ink-faint);
  font-size: 18px;
  cursor: pointer;
  line-height: 1;
  padding: 0 4px;
  flex-shrink: 0;
}
.dd-search-clear:hover {
  color: var(--dd-red);
}

.dd-product-select {
  height: 36px;
  padding: 0 10px;
  background: #fff;
  border: none;
  border-radius: 4px;
  box-shadow: var(--dd-bevel-in), 0 0 0 1px var(--dd-metal-300);
  font-family: 'Inter', sans-serif;
  font-size: 12.5px;
  color: var(--dd-ink);
  cursor: pointer;
  min-width: 140px;
  flex-shrink: 0;
}
.dd-product-select:focus {
  outline: none;
  box-shadow: var(--dd-bevel-in), 0 0 0 2px var(--dd-navy-glow);
}

.dd-btn {
  font-family: 'Inter', sans-serif;
  font-size: 12.5px;
  font-weight: 600;
  padding: 9px 15px;
  border-radius: 4px;
  border: none;
  background: linear-gradient(180deg, #fff, var(--dd-metal-100));
  color: var(--dd-ink);
  box-shadow: var(--dd-bevel-out), 0 0 0 1px var(--dd-metal-300);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: box-shadow .1s ease, transform .1s ease, background .12s ease;
}
.dd-btn:active{
  box-shadow: var(--dd-bevel-in);
  transform: translateY(1px);
}
.dd-btn:disabled {
  opacity: .45;
  cursor: not-allowed;
}
.dd-btn.primary {
  background: linear-gradient(180deg, var(--dd-navy-glow), var(--dd-navy));
  border-color: var(--dd-navy);
  color: #fff;
  box-shadow: 0 1px 0 rgba(255,255,255,.25) inset, 0 2px 4px rgba(0,51,95,.35);
}
.dd-btn.primary:hover:not(:disabled){
  background: linear-gradient(180deg, #3B6EAE, #06427A);
}
.dd-btn.primary:active{
  box-shadow: 0 1px 3px rgba(0,51,95,.4) inset;
}
.dd-btn.ghost {
  background: transparent;
  box-shadow: 0 0 0 1px var(--dd-metal-300);
}
.dd-btn.small {
  padding: 6px 11px;
  font-size: 11.5px;
}

/* ── Responsive ────────────────────────────────────────────────────────── */
@media (max-width: 768px) {
  .dd-day-switcher {
    flex-direction: column;
    gap: 12px;
  }
  .dd-toolbar {
    flex-direction: column;
    align-items: stretch;
  }
  .dd-search {
    flex: 1 1 auto;
    max-width: none;
    width: 100%;
  }
  .dd-tabs {
    justify-content: center;
  }
  .dd-toolbar .dd-btn {
    align-self: center;
  }
}

.dd-board{
  display:grid;
  grid-template-columns:1fr 1.7fr;
  gap:0;
  border-bottom:1px solid var(--dd-metal-300);
}
@media (max-width: 900px){
  .dd-board{
    grid-template-columns:1fr;
  }
}
.dd-col{
  padding:20px 24px 26px;
}
.dd-col-queue{
  border-right:1px solid var(--dd-metal-300);
  background:var(--dd-metal-100);
  max-height:720px;
  overflow-y:auto;
}
.dd-col-layout{
  background:#FBFCFC;
}
.dd-col-heading{
  display:flex;
  align-items:baseline;
  justify-content:space-between;
  margin-bottom:16px;
  gap:8px;
  flex-wrap:wrap;
}
.dd-col-heading h2{
  font-family:'IBM Plex Sans', sans-serif;
  font-weight:700;
  font-size:13px;
  margin:0;
  text-transform:uppercase;
  letter-spacing:.07em;
  color: var(--dd-ink);
  padding-left: 10px;
  border-left: 3px solid var(--dd-navy);
}
.dd-col-heading .hint{
  font-size:11px;
  color:var(--dd-ink-faint);
}
.dd-empty{
  padding:30px 10px;
  text-align:center;
  color:var(--dd-ink-faint);
  font-size:12.5px;
}

.dd-ticket{
  background:linear-gradient(180deg, #fff, var(--dd-metal-50));
  border-radius:4px;
  box-shadow: var(--dd-bevel-out), 0 0 0 1px var(--dd-metal-300);
  padding:16px 18px;
  margin-bottom:18px;
}
.dd-ticket-row{
  display:flex;
  gap:16px;
  margin-bottom:12px;
  flex-wrap:wrap;
}
.dd-field{
  flex:1;
  min-width:140px;
}
.dd-field label{
  display:block;
  font-size:9.5px;
  letter-spacing:.08em;
  text-transform:uppercase;
  color:var(--dd-ink-faint);
  margin-bottom:5px;
  font-weight:600;
}
.dd-field input,
.dd-field select,
.dd-field textarea{
  width:100%;
  font-family:'Inter',sans-serif;
  font-size:12.5px;
  padding:8px 10px;
  border:none;
  border-radius:3px;
  background:#fff;
  box-shadow: var(--dd-bevel-in), 0 0 0 1px var(--dd-metal-300);
  color:var(--dd-ink);
}
.dd-field input:disabled{
  color:var(--dd-ink-soft);
  background:var(--dd-metal-100);
  box-shadow: 0 0 0 1px var(--dd-metal-300);
}

.dd-note-box{
  background: var(--dd-navy-soft);
  color: var(--dd-navy);
  font-size:12px;
  padding:10px 12px;
  border-radius:4px;
  margin-top:12px;
}

.dd-batch-row{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:10px;
  padding:11px 13px;
  background:linear-gradient(180deg, #fff, var(--dd-metal-50));
  border-radius:4px;
  box-shadow: var(--dd-bevel-out), 0 0 0 1px var(--dd-metal-300);
  margin-bottom:8px;
  cursor:pointer;
  transition: transform .14s cubic-bezier(.22,.68,.36,1), box-shadow .14s ease;
}
.dd-batch-row:hover{
  transform: translateY(-1px);
  box-shadow: var(--dd-bevel-out), 0 0 0 1px var(--dd-metal-rail), 0 6px 14px -8px rgba(20,24,28,.2);
}
.dd-batch-row .br-title{
  font-weight:600;
  font-size:12.5px;
  color: var(--dd-ink);
}
.dd-batch-row .br-meta{
  font-size:11px;
  color:var(--dd-ink-soft);
}

.dd-stamp{
  font-family:'IBM Plex Mono',monospace;
  font-size:10px;
  font-weight:700;
  letter-spacing:.05em;
  text-transform:uppercase;
  padding:4px 10px 4px 8px;
  border-radius:10px;
  display:inline-flex;
  align-items:center;
  gap:6px;
}
.dd-stamp::before{
  content:'';
  width:6px; height:6px; border-radius:50%;
  background: currentColor;
}
.dd-stamp.attached{
  color:#1e5c3d;
  background: var(--dd-led-green-soft);
}
.dd-stamp.draft{
  color:var(--dd-ink-soft);
  background: var(--dd-metal-200);
}
.dd-stamp.ready{
  color:var(--dd-navy);
  background: var(--dd-navy-soft);
}
.dd-stamp.archived{
  color:var(--dd-ink-faint);
  background: var(--dd-metal-200);
}

/* ── Motion preferences ──────────────────────────────────────── */
@media (prefers-reduced-motion: reduce){
  .dd-fade{ animation:none !important; opacity:1 !important; transform:none !important; filter:none !important; }
  .dd-batch-row{ transition: box-shadow .14s ease; }
  .dd-batch-row:hover{ transform:none; }
  .dd-day-nav{ transition: box-shadow .1s ease; }
}
/* ── Workflow re-order: live refresh + Copy Desk clearance filter ───── */
.dd-live{ display:inline-flex; align-items:center; gap:5px; margin-left:10px; font-size:11px; color:var(--dd-ink-soft); }
.dd-live i{ width:7px; height:7px; border-radius:50%; background:#CBD5E1; display:inline-block; }
.dd-live i.on{ background:#2E8B57; box-shadow:0 0 0 3px rgba(46,139,87,.15); }
.dd-clearseg{ display:flex; flex-wrap:wrap; border:1px solid var(--dd-metal-300); border-radius:3px; overflow:hidden; margin:-6px 0 12px; }
.dd-clearseg button{ flex:1 1 auto; min-height:32px; padding:0 10px; border:none; border-right:1px solid var(--dd-metal-300); background:#fff; color:var(--dd-ink-soft); font:600 11.5px 'IBM Plex Sans', sans-serif; cursor:pointer; }
.dd-clearseg button:last-child{ border-right:none; }
.dd-clearseg button.on{ background:var(--dd-navy); color:#fff; }
.dd-clearseg b{ font-family:'IBM Plex Mono', monospace; font-weight:600; }
.dd-newclear{ display:flex; flex-wrap:wrap; align-items:center; gap:8px; margin:0 0 12px; padding:8px 10px; border:1px solid #86D9A8; background:#ECFDF3; color:#14532D; border-radius:3px; font-size:12px; }
.dd-newclear span{ flex:1 1 180px; }
</style>