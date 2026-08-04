<!-- components/design/Index.vue -->
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
      <div class="dd-day-jump">
        Jump to
        <input type="date" v-model="selectedDate" @change="loadDay" />
      </div>
    </div>

    <!-- Toolbar -->
    <div class="dd-toolbar">
      <div class="dd-tabs">
        <button class="dd-tab" :class="{ active: activeTab === 'queue' }" @click="activeTab = 'queue'">
          Queue <span class="count dd-mono">{{ bookings.length }}</span>
        </button>
        <button class="dd-tab" :class="{ active: activeTab === 'batches' }" @click="activeTab = 'batches'">
          Batches <span class="count dd-mono">{{ batchesForDate.length }}</span>
        </button>
      </div>
      <button class="dd-btn primary" @click="newBatch">+ New Batch</button>
    </div>

    <!-- Assign bar — appears while placing a queue advert into a file group -->
    <div v-if="pendingAssignAdvert" class="dd-note-box" style="margin:0 28px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
      <span>Assign <b>{{ pendingAssignAdvert.advertTitle }}</b> to:</span>
      <button
        v-for="g in (activeBatch?.fileGroups || [])"
        :key="g.id"
        class="dd-btn small ghost"
        @click="assignToGroup(g.id)"
      >{{ g.label || `Group ${g.id}` }}</button>
      <button class="dd-btn small primary" @click="assignToNewGroup">+ New Group</button>
      <button class="dd-btn small ghost" @click="pendingAssignAdvert = null">Cancel</button>
    </div>

    <!-- Main split -->
    <div class="dd-board">
      <!-- Left: Queue or Batches -->
      <div class="dd-col dd-col-queue">
        <template v-if="activeTab === 'queue'">
          <div class="dd-col-heading">
            <h2>Bookings — {{ currentDayMonth }}</h2>
            <span class="hint">{{ bookings.length }} total</span>
          </div>
          <div v-if="loadingDay" class="dd-empty">Loading…</div>
          <div v-else-if="bookings.length === 0" class="dd-empty">No bookings touch this day.</div>
          <QueueCard
            v-for="advert in bookings"
            :key="advert.id"
            :advert="advert"
            :active-date="activeBatch?.targetRunDate || selectedDate"
            @add-to-board="onAddToBoard"
            @view-brief="briefAdvert = $event"
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
          No active batch. Click "+ New Batch" or pin an advert from the queue to start one.
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
          />

          <button class="dd-btn ghost" style="width:100%;justify-content:center;margin-bottom:16px;" @click="addEmptyGroup">
            + New File Group
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useDesignHouse } from '~/composables/useDesignHouse'
import QueueCard from './QueueCard.vue'
import FileGroupCard from './FileGroupCard.vue'
import BriefModal from './BriefModal.vue'
import AttachScheduleModal from './AttachScheduleModal.vue'
import BatchDetailModal from './BatchDetailModal.vue'

import '~/assets/css/design-desk.css'

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
const activeBatch = ref(null) // getBatchDetail shape: { id, reference, label, status, targetRunDate, notes, advertsCount, fileGroupsCount, filesCount, fileGroups[], dailySchedules[], ... }
const batchNotes = ref('')
const batchLabel = ref('')
const stats = ref({})

async function loadStats() {
  try {
    const res = await fetchDesignStats()
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
      fetchBookingsByDate(selectedDate.value),
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

const scheduleExistsForActiveDate = computed(() => {
  const target = activeBatch.value?.targetRunDate
  return bookings.value.some(a => target && a.scheduledDates?.includes(target))
})

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
  if (!confirm('Remove this file group? Any pinned adverts will be unpinned.')) return
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
    // Server rejects if the advert isn't booked (or already scheduled) for
    // this batch's target date — e.data.pendingDates explains why, if present.
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

// ── Modals ───────────────────────────────────────────────────────────────
const briefAdvert = ref(null)
const attachTarget = ref(null)
const detailBatch = ref(null)

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
  loadStats()
  loadDay()
})
</script>