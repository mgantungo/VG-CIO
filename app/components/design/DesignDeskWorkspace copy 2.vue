<!-- components/design/DesignDeskWorkspace.vue -->
<template>
  <div class="dd-root">
    <!-- Masthead -->
    <div class="dd-masthead">
      <div class="dd-masthead-left">
        <span class="dd-eyebrow">VGAMS</span>
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
      <div class="dd-stat accent-amber">
        <span class="n">{{ stats.pendingDesign ?? '—' }}</span>
        <span class="l">Pending Design</span>
      </div>
      <div class="dd-stat accent-blue">
        <span class="n">{{ stats.designApproved ?? '—' }}</span>
        <span class="l">Design Approved</span>
      </div>
      <div class="dd-stat accent-green">
        <span class="n">{{ stats.scheduled ?? '—' }}</span>
        <span class="l">Scheduled</span>
      </div>
      <div class="dd-stat">
        <span class="n">{{ stats.upcoming ?? '—' }}</span>
        <span class="l">Upcoming</span>
      </div>
      <div class="dd-stat">
        <span class="n">{{ stats.totalFiles ?? '—' }}</span>
        <span class="l">Files on Record</span>
      </div>
    </div>

    <!-- Day switcher -->
    <div class="dd-day-switcher">
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
    <div class="dd-toolbar">
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
              {{ searchQuery ? `${filteredBookings.length} of ${bookings.length}` : `${bookings.length} total` }}
            </span>
          </div>
          <div v-if="loadingDay" class="dd-empty">Loading…</div>
          <div v-else-if="bookings.length === 0" class="dd-empty">No bookings touch this day.</div>
          <div v-else-if="filteredBookings.length === 0" class="dd-empty">No matches for "{{ searchQuery }}".</div>
          <QueueCard
            v-for="advert in filteredBookings"
            :key="advert.id"
            :advert="advert"
            :active-date="activeBatch?.targetRunDate || selectedDate"
            :on-layout="pinnedAdvertIds.has(String(advert.id))"
            :file-group-name="getFileGroupName(advert.id)"
            @add-to-board="onAddToBoard"
            @view-brief="briefAdvert = $event"
            @view-attachments="attachmentsAdvert = $event"
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
import QueueCard from './QueueCard.vue'
import FileGroupCard from './FileGroupCard.vue'
import BriefModal from './BriefModal.vue'
import AttachmentsModal from './AttachmentsModal.vue'
import UnmarkCompleteModal from './ext/UnmarkCompleteModal.vue'
import AttachScheduleModal from './AttachScheduleModal.vue'
import BatchDetailModal from './BatchDetailModal.vue'
import AssignBar from './ext/AssignBar.vue'
import QueueSheetModal from './ext/QueueSheetModal.vue'


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
} = useDesignHouse()

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
const filteredBookings = computed(() => {
  const q = searchQuery.value.toLowerCase().trim()
  if (!q) return bookings.value
  return bookings.value.filter(a => {
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

async function loadDay() {
  loadingDay.value = true
  try {
    const [bookingsRes] = await Promise.all([
      fetchBookingsByDate(selectedDate.value, selectedProductId.value || null, selectedScope.value),
      refreshBatchesList(),
    ])
    bookings.value = bookingsRes.adverts || []

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
    loadingDay.value = false
  }
}

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
  await uploadFileToGroup(activeBatch.value.id, groupId, file)
  await refreshActiveBatch()
}
async function onGroupRemoveAdvert(groupId, advertId) {
  await removeAdvertFromFileGroup(activeBatch.value.id, groupId, advertId)
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
    await addAdvertToFileGroup(activeBatch.value.id, groupId, pendingAssignAdvert.value.id)
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
    await addAdvertToFileGroup(activeBatch.value.id, newGroup.id, pendingAssignAdvert.value.id)
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
    await addAdvertToFileGroup(activeBatch.value.id, groupId, advertId)
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
    await markDesignComplete(advertId)
    const row = bookings.value.find(a => String(a.id) === String(advertId))
    if (row) row.isApproved = true
  } catch (e) {
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

async function onAttachConfirm(runTime) {
  await attachBatch(attachTarget.value.id, runTime)
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
.dd-root{
  background:#f6f3ec;
  color:#1c1b18;
  font-family:'Inter',sans-serif;
  font-size:14px;
  line-height:1.45;
}
.dd-mono{font-family:'IBM Plex Mono',monospace;}

.dd-masthead{
  display:flex;
  align-items:center;
  justify-content:space-between;
  padding:14px 28px;
  border-bottom:2px solid #1c1b18;
  background:#f6f3ec;
}
.dd-masthead-left{
  display:flex;
  align-items:baseline;
  gap:14px;
}
.dd-eyebrow{
  font-family:'IBM Plex Mono',monospace;
  font-size:10.5px;
  letter-spacing:.14em;
  color:#6b6658;
  text-transform:uppercase;
  border:1px solid #b7ae97;
  padding:3px 7px;
  border-radius:2px;
}
.dd-masthead h1{
  font-family:'Source Serif 4',serif;
  font-weight:900;
  font-size:26px;
  margin:0;
  letter-spacing:-.01em;
}
.dd-masthead-right{
  display:flex;
  align-items:center;
  gap:18px;
}
.dd-today{
  font-family:'IBM Plex Mono',monospace;
  font-size:12px;
  color:#6b6658;
  text-align:right;
  line-height:1.3;
}
.dd-today b{
  color:#1c1b18;
  display:block;
  font-size:12.5px;
}

.dd-stats{
  display:flex;
  border-bottom:1px solid #b7ae97;
  background:#efeade;
  flex-wrap:wrap;
}
.dd-stat{
  flex:1;
  min-width:120px;
  padding:12px 20px;
  border-right:1px solid #d9d3c3;
  display:flex;
  flex-direction:column;
  gap:2px;
}
.dd-stat:last-child{border-right:none;}
.dd-stat .n{
  font-family:'IBM Plex Mono',monospace;
  font-size:22px;
  font-weight:600;
}
.dd-stat .l{
  font-size:10.5px;
  letter-spacing:.08em;
  text-transform:uppercase;
  color:#6b6658;
}
.dd-stat.accent-blue .n{color:#1c3fa8;}
.dd-stat.accent-red .n{color:#a8261e;}
.dd-stat.accent-green .n{color:#2f6f4f;}
.dd-stat.accent-amber .n{color:#a3691a;}

/* ── Day Switcher ──────────────────────────────────────────────────────── */
.dd-day-switcher {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 14px 28px;
  border-bottom: 1px solid #b7ae97;
  background: #f6f3ec;
}

.dd-day-center {
  display: flex;
  align-items: center;
  gap: 22px;
}
.dd-day-nav {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  cursor: pointer;
  padding: 4px 12px;
  border-radius: 2px;
  color: #6b6658;
  background: none;
  border: none;
  font-family: inherit;
}
.dd-day-nav:hover {
  background: #efeade;
}
.dd-day-nav .arrow {
  font-size: 14px;
}
.dd-day-nav .peek {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 10px;
}
.dd-day-current {
  text-align: center;
}
.dd-day-current .dow {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 10.5px;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: #1c3fa8;
}
.dd-day-current .dm {
  font-family: 'Source Serif 4', serif;
  font-weight: 900;
  font-size: 24px;
  line-height: 1.1;
}

.dd-day-jump {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #6b6658;
}
.dd-day-jump input[type="date"] {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 12px;
  border: 1px solid #b7ae97;
  border-radius: 2px;
  padding: 5px 8px;
  background: #fffdf8;
  color: #1c1b18;
}

/* ── Toolbar ───────────────────────────────────────────────────────────── */
.dd-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 28px;
  border-bottom: 1px solid #d9d3c3;
  flex-wrap: wrap;
  gap: 12px;
}

.dd-tabs {
  display: flex;
  gap: 2px;
}
.dd-tab {
  font-size: 12.5px;
  font-weight: 600;
  padding: 7px 13px;
  border-radius: 2px;
  cursor: pointer;
  color: #6b6658;
  border: 1px solid transparent;
  background: none;
  font-family: inherit;
}
.dd-tab.active {
  background: #1c1b18;
  color: #f6f3ec;
}
.dd-tab .count {
  font-family: 'IBM Plex Mono', monospace;
  opacity: .65;
  margin-left: 5px;
}

/* ── Search Box ────────────────────────────────────────────────────────── */
.dd-search {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1 1 300px;
  max-width: 400px;
  min-width: 180px;
  background: #fffdf8;
  border: 1px solid #b7ae97;
  border-radius: 2px;
  padding: 0 10px;
}
.dd-search-icon {
  color: #6b6658;
  font-size: 14px;
  flex-shrink: 0;
}
.dd-search-input {
  flex: 1;
  border: none;
  background: none;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  padding: 7px 4px;
  color: #1c1b18;
  outline: none;
  min-width: 100px;
}
.dd-search-input::placeholder {
  color: #6b6658;
}
.dd-search-clear {
  border: none;
  background: none;
  color: #6b6658;
  font-size: 18px;
  cursor: pointer;
  line-height: 1;
  padding: 0 4px;
  flex-shrink: 0;
}
.dd-search-clear:hover {
  color: #a8261e;
}

.dd-product-select {
  height: 34px;
  padding: 0 10px;
  background: #fffdf8;
  border: 1px solid #b7ae97;
  border-radius: 2px;
  font-family: 'Inter', sans-serif;
  font-size: 12.5px;
  color: #1c1b18;
  cursor: pointer;
  min-width: 140px;
  flex-shrink: 0;
}
.dd-product-select:focus {
  outline: none;
  border-color: #1c3fa8;
  box-shadow: 0 0 0 3px rgba(28, 63, 168, 0.15);
}

.dd-btn {
  font-family: 'Inter', sans-serif;
  font-size: 12.5px;
  font-weight: 600;
  padding: 8px 14px;
  border-radius: 2px;
  border: 1px solid #1c1b18;
  background: #fffdf8;
  color: #1c1b18;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.dd-btn:disabled {
  opacity: .45;
  cursor: not-allowed;
}
.dd-btn.primary {
  background: #1c3fa8;
  border-color: #1c3fa8;
  color: #fff;
}
.dd-btn.ghost {
  background: transparent;
}
.dd-btn.small {
  padding: 5px 9px;
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
  border-bottom:1px solid #b7ae97;
}
@media (max-width: 900px){
  .dd-board{
    grid-template-columns:1fr;
  }
}
.dd-col{
  padding:18px 24px;
}
.dd-col-queue{
  border-right:1px solid #b7ae97;
  background:#f6f3ec;
  max-height:720px;
  overflow-y:auto;
}
.dd-col-layout{
  background:#efeade;
}
.dd-col-heading{
  display:flex;
  align-items:baseline;
  justify-content:space-between;
  margin-bottom:14px;
  gap:8px;
  flex-wrap:wrap;
}
.dd-col-heading h2{
  font-family:'Source Serif 4',serif;
  font-weight:700;
  font-size:15px;
  margin:0;
  text-transform:uppercase;
  letter-spacing:.04em;
}
.dd-col-heading .hint{
  font-size:11px;
  color:#6b6658;
}
.dd-empty{
  padding:30px 10px;
  text-align:center;
  color:#6b6658;
  font-size:12.5px;
}

.dd-ticket{
  background:#fffdf8;
  border:1px solid #b7ae97;
  border-radius:2px;
  padding:14px 16px;
  margin-bottom:16px;
}
.dd-ticket-row{
  display:flex;
  gap:16px;
  margin-bottom:10px;
  flex-wrap:wrap;
}
.dd-field{
  flex:1;
  min-width:140px;
}
.dd-field label{
  display:block;
  font-size:10px;
  letter-spacing:.06em;
  text-transform:uppercase;
  color:#6b6658;
  margin-bottom:4px;
}
.dd-field input,
.dd-field select,
.dd-field textarea{
  width:100%;
  font-family:'Inter',sans-serif;
  font-size:13px;
  padding:7px 9px;
  border:1px solid #b7ae97;
  border-radius:2px;
  background:#fffdf8;
  color:#1c1b18;
}
.dd-field input:disabled{
  color:#6b6658;
  background:#efeade;
}

.dd-note-box{
  background:#e7ebf8;
  color:#1c3fa8;
  font-size:12px;
  padding:10px 12px;
  border-radius:2px;
  margin-top:12px;
}

.dd-batch-row{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:10px;
  padding:10px 12px;
  background:#fffdf8;
  border:1px solid #d9d3c3;
  border-radius:2px;
  margin-bottom:8px;
  cursor:pointer;
}
.dd-batch-row:hover{
  border-color:#b7ae97;
}
.dd-batch-row .br-title{
  font-weight:600;
  font-size:12.5px;
}
.dd-batch-row .br-meta{
  font-size:11px;
  color:#6b6658;
}

.dd-stamp{
  font-family:'IBM Plex Mono',monospace;
  font-size:10.5px;
  font-weight:700;
  letter-spacing:.06em;
  text-transform:uppercase;
  padding:3px 9px;
  border-radius:2px;
  display:inline-block;
}
.dd-stamp.attached{
  color:#2f6f4f;
  border:1.5px solid #2f6f4f;
  transform:rotate(-2deg);
}
.dd-stamp.draft{
  color:#6b6658;
  border:1.5px dashed #b7ae97;
}
.dd-stamp.ready{
  color:#1c3fa8;
  border:1.5px solid #1c3fa8;
}
.dd-stamp.archived{
  color:#6b6658;
  border:1.5px solid #b7ae97;
}
</style>