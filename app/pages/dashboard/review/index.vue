<!-- pages/review/index.vue -->
<template>
  <div class="editor-page">

    <!-- PAGE HEADER -->
    <div class="page-hd">
      <div class="page-hd__left">
        <div class="page-hd__eyebrow">Editor Workspace</div>
        <h1 class="page-hd__title">Schedule Queue</h1>
        <p class="page-hd__sub">Assign page/slot numbers, adjust run dates and times, and manage publication status.</p>
      </div>
    </div>

    <!-- FILTER / TOOLBAR BAR -->
    <div class="filter-bar">
      <div class="filter-bar__left">
        <!-- Date Range -->
        <div class="filter-group">
          <label class="filter-lbl">From</label>
          <input type="date" v-model="filters.dateFrom" class="filter-date" @change="load">
        </div>
        <div class="filter-group">
          <label class="filter-lbl">To</label>
          <input type="date" v-model="filters.dateTo" class="filter-date" @change="load">
        </div>

        <!-- Quick range pills -->
        <div class="range-pills">
          <button
            v-for="r in quickRanges"
            :key="r.label"
            class="range-pill"
            :class="{ 'range-pill--active': activeRange === r.label }"
            @click="applyRange(r)"
          >{{ r.label }}</button>
        </div>
      </div>

      <div class="filter-bar__right">
        <!-- Status filter -->
        <div class="filter-group">
          <label class="filter-lbl">Status</label>
          <select v-model="filters.status" class="filter-sel" @change="load">
            <option value="">All</option>
            <option value="scheduled">Scheduled</option>
            <option value="paged">Page Assigned</option>
            <option value="published">Published</option>
          </select>
        </div>
        <!-- Search -->
        <div class="filter-group">
          <label class="filter-lbl">Search</label>
          <input type="text" v-model="filters.search" class="filter-search" placeholder="Client or advert title…" @input="applySearch">
        </div>
        <button class="filter-refresh-btn" @click="load" title="Refresh">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M13.5 3A7 7 0 1 0 14 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M14 3v4h-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </div>
    </div>

    <!-- STATS BAND -->
    <div class="stats-band">
      <div class="stat-cell">
        <div class="stat-val">{{ stats.total }}</div>
        <div class="stat-lbl">Total</div>
      </div>
      <div class="stat-div"></div>
      <div class="stat-cell stat-cell--amber">
        <div class="stat-val">{{ stats.noPage }}</div>
        <div class="stat-lbl">No Page Assigned</div>
      </div>
      <div class="stat-div"></div>
      <div class="stat-cell stat-cell--blue">
        <div class="stat-val">{{ stats.paged }}</div>
        <div class="stat-lbl">Page Assigned</div>
      </div>
      <div class="stat-div"></div>
      <div class="stat-cell stat-cell--green">
        <div class="stat-val">{{ stats.published }}</div>
        <div class="stat-lbl">Published</div>
      </div>
      <div class="stat-div"></div>
      <div class="stat-cell">
        <div class="stat-val">{{ stats.withMedia }}</div>
        <div class="stat-lbl">With Media</div>
      </div>
    </div>

    <!-- ERROR BANNER -->
    <div v-if="pageError" class="err-banner">
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5"/><path d="M8 5v3M8 11v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
      {{ pageError }}
      <button class="err-dismiss" @click="pageError = ''">×</button>
    </div>

    <!-- SUCCESS TOAST -->
    <transition name="toast-fade">
      <div v-if="toast" class="toast">
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M2 8l4 4 8-8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        {{ toast }}
      </div>
    </transition>

    <!-- MAIN PANEL -->
    <div class="main-panel">
      <ScheduleReviewQueue
        :schedules="filteredSchedules"
        :loading="loading"
        @page-update="onPageUpdate"
        @publish-toggle="onPublishToggle"
        @edit="onEdit"
        @unschedule="onUnschedule"
        @bulk-page="onBulkPage"
        @view-media="onViewMedia"
        @refresh="load"
      />
    </div>

    <!-- EDIT MODAL -->
    <ScheduleDetailsModal
      :show="showEditModal"
      :schedule="editTarget"
      @close="showEditModal = false"
      @saved="onSaveSchedule"
    />

    <!-- BULK PAGE MODAL -->
    <BulkPageUpdateModal
      :show="showBulkModal"
      :schedules="bulkTargets"
      @close="showBulkModal = false"
      @save="onBulkSave"
    />

    <!-- MEDIA VIEWER -->
    <MediaViewerModal
      :show="showMediaModal"
      :schedule="mediaTarget"
      @close="showMediaModal = false"
    />

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import ScheduleReviewQueue  from '~/components/editor/ScheduleReviewQueue.vue'
import ScheduleDetailsModal from '~/components/editor/ScheduleDetailsModal.vue'
import BulkPageUpdateModal  from '~/components/editor/BulkPageUpdateModal.vue'
import MediaViewerModal     from '~/components/editor/MediaViewerModal.vue'
import { useAdverts } from '~/composables/useAdverts'

/*
definePageMeta({
  layout: 'default',
  middleware: ['auth', 'role'],
  meta: { role: 'editor' },
})
*/

const {
  loading,
  getFullSchedules,
  updateSchedulePage,
  toggleSchedulePublish,
  updateSchedule,
  unscheduleAdvert,
  bulkUpdateSchedulePages,
} = useAdverts()

// ── STATE ──────────────────────────────────────────────────────────────────
const schedules     = ref([])
const pageError     = ref('')
const toast         = ref('')
const showEditModal = ref(false)
const editTarget    = ref(null)
const showBulkModal = ref(false)
const bulkTargets   = ref([])
const showMediaModal  = ref(false)
const mediaTarget     = ref(null)

const filters = ref({
  dateFrom: '',
  dateTo:   '',
  status:   '',
  search:   '',
})
const activeRange = ref('This Week')

// ── QUICK RANGES ───────────────────────────────────────────────────────────
const quickRanges = [
  { label: 'Today',     days: 0 },
  { label: 'This Week', days: 7 },
  { label: 'Next 14d',  days: 14 },
  { label: 'This Month',days: 30 },
]

const applyRange = (r) => {
  const today = new Date()
  const end   = new Date()
  end.setDate(today.getDate() + r.days)
  filters.value.dateFrom = today.toISOString().split('T')[0]
  filters.value.dateTo   = end.toISOString().split('T')[0]
  activeRange.value       = r.label
  load()
}

// ── STATS ─────────────────────────────────────────────────────────────────
const stats = computed(() => ({
  total:     filteredSchedules.value.length,
  noPage:    filteredSchedules.value.filter(s => !s.page || s.page === 0).length,
  paged:     filteredSchedules.value.filter(s => s.page > 0 && !s.is_published).length,
  published: filteredSchedules.value.filter(s => s.is_published).length,
  withMedia: filteredSchedules.value.filter(s => s.media?.length > 0).length,
}))

// ── FILTERED SCHEDULES ─────────────────────────────────────────────────────
const filteredSchedules = computed(() => {
  let s = [...schedules.value]

  if (filters.value.status === 'scheduled')
    s = s.filter(x => !x.is_published && (!x.page || x.page === 0))
  else if (filters.value.status === 'paged')
    s = s.filter(x => x.page > 0 && !x.is_published)
  else if (filters.value.status === 'published')
    s = s.filter(x => x.is_published)

  if (filters.value.search) {
    const q = filters.value.search.toLowerCase()
    s = s.filter(x =>
      (x.company_name    || '').toLowerCase().includes(q) ||
      (x.advert_title    || '').toLowerCase().includes(q) ||
      (x.contact_person  || '').toLowerCase().includes(q) ||
      String(x.advert_id || '').includes(q)
    )
  }

  return s
})

// ── LOAD DATA ──────────────────────────────────────────────────────────────
const load = async () => {
  pageError.value = ''
  try {
    const params = {}
    if (filters.value.dateFrom) params.startDate = filters.value.dateFrom
    if (filters.value.dateTo)   params.endDate   = filters.value.dateTo
    const result  = await getFullSchedules(params)
    schedules.value = Array.isArray(result) ? result : (result?.data || [])
  } catch (e) {
    pageError.value = e.message || 'Failed to load schedules'
  }
}

// ── SEARCH (debounce) ─────────────────────────────────────────────────────
let searchTimer = null
const applySearch = () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {}, 300) // search is client-side, no reload needed
}

// ── ACTION HANDLERS ───────────────────────────────────────────────────────
const showToast = (msg, duration = 2800) => {
  toast.value = msg
  setTimeout(() => { toast.value = '' }, duration)
}

const patchLocal = (scheduleId, patch) => {
  const i = schedules.value.findIndex(s => s.schedule_id === scheduleId)
  if (i !== -1) schedules.value[i] = { ...schedules.value[i], ...patch }
}

const onPageUpdate = async (scheduleId, page) => {
  try {
    await updateSchedulePage(scheduleId, page)
    patchLocal(scheduleId, { page })
    showToast(`Page ${page} assigned`)
  } catch (e) {
    pageError.value = e.message || 'Failed to update page number'
  }
}

const onPublishToggle = async (scheduleId, isPublished) => {
  // Client-side guard mirrors the server guard
  const s = schedules.value.find(x => x.schedule_id === scheduleId)
  if (isPublished && s && (!s.page || s.page < 1)) {
    pageError.value = 'Assign a page / slot number before publishing this schedule.'
    return
  }
  try {
    await toggleSchedulePublish(scheduleId, isPublished)
    patchLocal(scheduleId, { is_published: isPublished })
    showToast(isPublished ? 'Schedule published' : 'Schedule unpublished')
  } catch (e) {
    pageError.value = e.data?.error?.message || e.message || 'Failed to toggle publish status'
  }
}

const onEdit = (schedule) => {
  editTarget.value    = schedule
  showEditModal.value = true
}

const onSaveSchedule = async ({ scheduleId, runDate, runTime, page, isPublished }) => {
  try {
    // Update date/time via dedicated endpoint
    if (runDate || runTime) {
      await updateSchedule(scheduleId, { runDate, runTime })
    }
    // Update page if changed
    const existing = schedules.value.find(s => s.schedule_id === scheduleId)
    if (existing && page !== existing.page) {
      await updateSchedulePage(scheduleId, page)
    }
    // Update publish status if changed
    if (existing && isPublished !== existing.is_published) {
      await toggleSchedulePublish(scheduleId, isPublished)
    }
    // Patch local state
    patchLocal(scheduleId, {
      run_date:     runDate     || existing?.run_date,
      run_time:     runTime     || existing?.run_time,
      page,
      is_published: isPublished,
    })
    showEditModal.value = false
    showToast('Schedule updated')
  } catch (e) {
    pageError.value = e.message || 'Failed to save schedule'
  }
}

const onUnschedule = async (scheduleId) => {
  try {
    await unscheduleAdvert(scheduleId)
    schedules.value = schedules.value.filter(s => s.schedule_id !== scheduleId)
    showToast('Schedule removed')
  } catch (e) {
    pageError.value = e.message || 'Failed to remove schedule'
  }
}

const onBulkPage = (targets) => {
  bulkTargets.value   = targets
  showBulkModal.value = true
}

const onViewMedia = (schedule) => {
  mediaTarget.value    = schedule
  showMediaModal.value = true
}

const onBulkSave = async (changes) => {
  try {
    await bulkUpdateSchedulePages(changes)
    changes.forEach(({ scheduleId, page }) => patchLocal(scheduleId, { page }))
    showBulkModal.value = false
    showToast(`${changes.length} page${changes.length !== 1 ? 's' : ''} updated`)
  } catch (e) {
    pageError.value = e.message || 'Bulk update failed'
  }
}

// ── INIT ──────────────────────────────────────────────────────────────────
onMounted(() => { applyRange({ label: 'This Week', days: 7 }) })
</script>

<style scoped>
.editor-page {
  font-family: 'IBM Plex Sans', 'Segoe UI', sans-serif;
  font-size: 13px;
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* PAGE HEADER */
.page-hd {
  padding: 0 0 16px 0;
  border-bottom: 2px solid #DEEAF1;
  margin-bottom: 0;
}
.page-hd__eyebrow { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #9DC3E6; }
.page-hd__title   { font-size: 22px; font-weight: 700; color: #1F3864; margin: 4px 0 4px; }
.page-hd__sub     { font-size: 12px; color: #888; margin: 0; }

/* FILTER BAR */
.filter-bar {
  display: flex; justify-content: space-between; align-items: flex-end;
  gap: 12px; flex-wrap: wrap;
  background: #fff; border: 1px solid #DEEAF1; border-top: none; padding: 12px 14px;
}
.filter-bar__left  { display: flex; align-items: flex-end; gap: 12px; flex-wrap: wrap; flex: 1; }
.filter-bar__right { display: flex; align-items: flex-end; gap: 10px; flex-wrap: wrap; }
.filter-group { display: flex; flex-direction: column; gap: 4px; }
.filter-lbl { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .4px; color: #888; }
.filter-date, .filter-sel, .filter-search {
  border: 1px solid #BDD7EE; padding: 6px 10px; font-size: 12px;
  border-radius: 0; font-family: inherit; background: #fff; color: #222;
}
.filter-search { width: 200px; }
.filter-date:focus, .filter-sel:focus, .filter-search:focus {
  outline: none; border-color: #1F3864; box-shadow: 0 0 0 2px rgba(31,56,100,.08);
}
.range-pills { display: flex; align-items: flex-end; gap: 4px; }
.range-pill {
  font-size: 11px; font-weight: 600; padding: 5px 11px;
  border: 1px solid #BDD7EE; background: #F7FBFE; color: #6081a3; cursor: pointer; font-family: inherit;
}
.range-pill:hover { background: #DEEAF1; border-color: #9DC3E6; color: #1F3864; }
.range-pill--active { background: #1F3864; color: #fff; border-color: #1F3864; }
.filter-refresh-btn {
  width: 32px; height: 32px; border: 1px solid #BDD7EE; background: #F7FBFE;
  color: #6081a3; cursor: pointer; display: inline-flex; align-items: center; justify-content: center;
}
.filter-refresh-btn:hover { background: #DEEAF1; color: #1F3864; }

/* STATS BAND */
.stats-band {
  display: flex; background: #1F3864; border-bottom: 3px solid #152a4e;
}
.stat-cell { flex: 1; padding: 12px 16px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; }
.stat-div  { width: 1px; background: rgba(157,195,230,.2); flex-shrink: 0; }
.stat-val  { font-size: 22px; font-weight: 700; color: #fff; font-family: 'IBM Plex Mono', monospace; line-height: 1; }
.stat-lbl  { font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: .6px; color: #5B7FAC; }
.stat-cell--amber .stat-val { color: #FFCC00; }
.stat-cell--blue  .stat-val { color: #9DC3E6; }
.stat-cell--green .stat-val { color: #A9D18E; }

/* ERROR / TOAST */
.err-banner {
  display: flex; align-items: center; gap: 8px;
  background: #FCE4D6; border: 1px solid #E31E24; border-left: 4px solid #E31E24;
  padding: 10px 14px; font-size: 12px; color: #9C0006; margin-top: 8px;
}
.err-dismiss { margin-left: auto; background: none; border: none; font-size: 18px; cursor: pointer; color: #9C0006; padding: 0; line-height: 1; }

.toast {
  position: fixed; bottom: 24px; right: 24px; z-index: 9999;
  background: #1F3864; color: #fff; font-size: 12px; font-weight: 600;
  padding: 10px 18px; border-left: 4px solid #A9D18E;
  display: flex; align-items: center; gap: 8px;
  box-shadow: 0 4px 16px rgba(0,0,0,.3);
}
.toast-fade-enter-active, .toast-fade-leave-active { transition: all .25s ease; }
.toast-fade-enter-from, .toast-fade-leave-to { opacity: 0; transform: translateY(8px); }

/* MAIN PANEL */
.main-panel {
  background: #fff;
  border: 1px solid #DEEAF1;
  border-top: none;
}

@media (max-width: 768px) {
  .filter-bar   { flex-direction: column; align-items: stretch; }
  .stats-band   { flex-wrap: wrap; }
  .stat-cell    { min-width: 50%; }
}
</style>