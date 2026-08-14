<!-- components/editor/index.vue -->
<template>
  <div class="editor-page">

    <!-- PAGE HEADER -->
    <div class="page-hd">
      <div class="page-hd__left">
        <div class="page-hd__eyebrow">Editor Workspace</div>
        <h1 class="page-hd__title">Schedule Queue</h1>
        <p class="page-hd__sub">Assign page/slot numbers, adjust run dates and times, and manage publication status.</p>
      </div>
      <div class="page-hd__right">
        <button class="pager-trigger pager-trigger--ghost" @click="paidAdvertsOpen = true">
          💰 Paid Adverts
        </button>
        <button class="pager-trigger" @click="pagerOpen = true">
          📰 Pager
        </button>
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
          <input type="text" v-model="filters.search" class="filter-search" placeholder="Client or advert title…">
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

    <!-- PRINT QUEUE SELECTION — check off today's adverts to auto-map onto the Pager -->
    <div class="pq-band">
      <div class="pq-band__head">
        <div>
          <div class="pq-band__title">Print Queue Selection</div>
          <div class="pq-band__sub">Check the adverts to include, pick a publication, and send — they'll be spread across its pages automatically.</div>
        </div>
        <button class="pq-collapse-btn" @click="pqCollapsed = !pqCollapsed">{{ pqCollapsed ? 'Show' : 'Hide' }}</button>
      </div>

      <div v-if="!pqCollapsed" class="pq-band__body">
        <div class="pq-toolbar">
          <label class="pq-selectall">
            <input type="checkbox" :checked="allChecked" @change="toggleAll($event.target.checked)">
            Select all ({{ checkedUnitKeys.size }} / {{ printableUnits.length }})
          </label>

          <select v-model="targetPublicationId" class="pq-pub-select">
            <option value="" disabled>Select target publication…</option>
            <option v-for="p in pagerPublications" :key="p.id" :value="p.id">
              {{ p.publication_code }} · {{ p.total_pages }}pg · {{ p.status }}
            </option>
          </select>

          <button
            class="pq-send-btn"
            :disabled="checkedUnitKeys.size === 0 || !targetPublicationId || sendingToPager"
            @click="sendCheckedToPager"
          >{{ sendingToPager ? 'Sending…' : `Send ${checkedUnitKeys.size} to Pager` }}</button>
        </div>

        <div class="pq-table-wrap">
          <table class="pq-table">
            <thead>
              <tr>
                <th></th>
                <th>Client</th>
                <th>Advert / Group</th>
                <th>Ad Size</th>
                <th>Ref</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="u in printableUnits" :key="u.unitKey">
                <td>
                  <input
                    type="checkbox"
                    :checked="checkedUnitKeys.has(u.unitKey)"
                    @change="toggleOne(u.unitKey, $event.target.checked)"
                  >
                </td>
                <td>
                  <template v-if="u.kind === 'group'">{{ u.adverts.length }} client{{ u.adverts.length !== 1 ? 's' : '' }}</template>
                  <template v-else>{{ u.adverts[0]?.company_name || '—' }}</template>
                </td>
                <td>
                  <template v-if="u.kind === 'group'">
                    📁 {{ u.label }}<span v-if="u.fileName"> · {{ u.fileName }}</span>
                    <div class="pq-group-members">{{ u.adverts.map(a => a.advert_title).join(' · ') }}</div>
                  </template>
                  <template v-else>{{ u.adverts[0]?.advert_title || '—' }}</template>
                </td>
                <td class="mono">
                  <template v-if="u.kind === 'group'">multiple</template>
                  <template v-else>{{ u.adverts[0]?.ad_size || '—' }}</template>
                </td>
                <td class="mono">
                  <template v-if="u.kind === 'group'">{{ u.advertIds.length }} adverts</template>
                  <template v-else>{{ u.advertIds[0] }}</template>
                </td>
              </tr>
              <tr v-if="printableUnits.length === 0">
                <td colspan="5" class="pq-empty">No schedules in the current filter.</td>
              </tr>
            </tbody>
          </table>
        </div>
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

    <!-- PAGER POPUP -->
    <PagerPopup v-model:open="pagerOpen" :checked-advert-ids="checkedAdvertIdsFlat" />

    <!-- PAID ADVERTS (read-only, Design House's view for a chosen date) -->
    <PaidAdvertsModal :open="paidAdvertsOpen" @close="paidAdvertsOpen = false" />

    <!-- CONFLICT ALERT — blocking, no click-outside dismiss on purpose -->
    <div v-if="showConflictModal" class="cf-overlay">
      <div class="cf-panel">
        <div class="cf-head">
          <span class="cf-head__icon">⚠</span>
          <div>
            <div class="cf-head__title">Some adverts need your attention</div>
            <div class="cf-head__sub">
              {{ pagerConflicts.length }} advert{{ pagerConflicts.length !== 1 ? 's' : '' }} could not be sent —
              please resolve these before they can be placed.
            </div>
          </div>
        </div>

        <div class="cf-list">
          <div v-for="c in pagerConflicts" :key="c.advertId" class="cf-row">
            <div class="cf-row__main">
              <span class="cf-row__title">{{ c.advert_title }}</span>
              <span class="cf-row__client">{{ c.company_name }}</span>
            </div>
            <div class="cf-row__reason" :class="{ 'cf-row__reason--conflict': !!c.conflictPageNumber }">
              {{ c.reason }}
            </div>
          </div>
        </div>

        <div class="cf-actions">
          <button class="cf-btn cf-btn--ghost" @click="showConflictModal = false">Dismiss</button>
          <button class="cf-btn cf-btn--primary" @click="openPagerToFix">Open Pager to Fix</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import ScheduleReviewQueue  from './ScheduleReviewQueue.vue'
import ScheduleDetailsModal from './ScheduleDetailsModal.vue'
import BulkPageUpdateModal  from './BulkPageUpdateModal.vue'
import PagerPopup           from '~/components/pager/PagerPopup.vue'
import PaidAdvertsModal     from './PaidAdvertsModal.vue'
import { useAdverts } from '~/composables/useAdverts'
import { usePager } from '~/composables/usePager'

definePageMeta({
  layout: 'default',
  middleware: ['auth', 'role'],
  meta: { role: 'editor' },
})

const {
  loading,
  getFullSchedules,
  updateSchedulePage,
  toggleSchedulePublish,
  updateSchedule,
  unscheduleAdvert,
  bulkUpdateSchedulePages,
} = useAdverts()

const pager = usePager()
// Destructured so the template can use it like every other ref here
// (auto-unwrapped) instead of needing pager.publications.value —
// destructuring a ref off a plain object keeps its reactivity intact,
// this isn't reactive()/Pinia state that would break on destructuring.
const { publications: pagerPublications } = pager

// ── STATE ──────────────────────────────────────────────────────────────────
const schedules     = ref([])
const pageError     = ref('')
const toast         = ref('')
const showEditModal = ref(false)
const editTarget    = ref(null)
const showBulkModal = ref(false)
const bulkTargets   = ref([])
const pagerOpen     = ref(false)
const paidAdvertsOpen = ref(false)

// ── PRINT QUEUE SELECTION ────────────────────────────────────────────────────
const pqCollapsed         = ref(false)
const checkedUnitKeys     = ref(new Set())
const targetPublicationId = ref('')
const sendingToPager      = ref(false)
const showConflictModal   = ref(false)
const pagerConflicts      = ref([])

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

// Every advert on a schedule row, flattened across its ad slots and
// ungroupedAdverts — the full set search needs to check now that a row
// can hold more than one advert.
const allAdvertsOf = (s) => [
  ...((s.fileGroups || []).flatMap(g => g.adverts || [])),
  ...(s.ungroupedAdverts || []),
]

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
      allAdvertsOf(x).some(a =>
        (a.company_name || '').toLowerCase().includes(q) ||
        (a.advert_title || '').toLowerCase().includes(q) ||
        (a.contact_person || '').toLowerCase().includes(q) ||
        String(a.id || '').includes(q)
      )
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
  try {
    await toggleSchedulePublish(scheduleId, isPublished)
    patchLocal(scheduleId, { is_published: isPublished })
    showToast(isPublished ? 'Schedule published' : 'Schedule unpublished')
  } catch (e) {
    pageError.value = e.message || 'Failed to toggle publish status'
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

// ── PRINT QUEUE SELECTION ────────────────────────────────────────────────────
// One row per printable UNIT, not per advert: a design-batch ad slot
// (several adverts sharing one physical file — must stay together on one
// pager page) collapses into a single row/checkbox, and an ungrouped advert
// (only one file to itself) stays a normal single row.
const printableUnits = computed(() => {
  const units = []
  for (const s of filteredSchedules.value) {
    for (const g of (s.fileGroups || [])) {
      units.push({
        unitKey:    `group:${s.schedule_id}:${g.groupId}`,
        kind:       'group',
        scheduleId: s.schedule_id,
        label:      g.label || `Ad Slot ${g.groupId}`,
        fileName:   g.file?.name || null,
        advertIds:  (g.adverts || []).map(a => a.id),
        adverts:    g.adverts || [],
      })
    }
    for (const a of (s.ungroupedAdverts || [])) {
      units.push({
        unitKey:    `advert:${a.id}`,
        kind:       'advert',
        scheduleId: s.schedule_id,
        label:      a.advert_title,
        fileName:   null,
        advertIds:  [a.id],
        adverts:    [a],
      })
    }
  }
  return units
})

const checkedAdvertIdsFlat = computed(() =>
  printableUnits.value
    .filter(u => checkedUnitKeys.value.has(u.unitKey))
    .flatMap(u => u.advertIds)
)

const findAdvertDisplay = (advertId) => {
  for (const s of filteredSchedules.value) {
    const match = allAdvertsOf(s).find(a => a.id === advertId)
    if (match) return match
  }
  return null
}

const allChecked = computed(() =>
  printableUnits.value.length > 0 &&
  printableUnits.value.every(u => checkedUnitKeys.value.has(u.unitKey))
)

const toggleOne = (unitKey, checked) => {
  const next = new Set(checkedUnitKeys.value)
  checked ? next.add(unitKey) : next.delete(unitKey)
  checkedUnitKeys.value = next
}

const toggleAll = (checked) => {
  checkedUnitKeys.value = checked
    ? new Set(printableUnits.value.map(u => u.unitKey))
    : new Set()
}

const loadPagerPublications = async () => {
  try {
    await pager.fetchPublications()
  } catch (e) {
    // non-fatal — the panel just shows an empty publication list
  }
}

const sendCheckedToPager = async () => {
  if (!targetPublicationId.value || checkedUnitKeys.value.size === 0) return
  sendingToPager.value = true
  try {
    const checkedUnits = printableUnits.value.filter(u => checkedUnitKeys.value.has(u.unitKey))
    const result = await pager.queueUnitsToPublication(
      targetPublicationId.value,
      checkedUnits.map(u => ({ advertIds: u.advertIds }))
    )

    // A unit only clears from the checklist once every one of its member
    // advert ids was actually assigned — a group is all-or-nothing, so this
    // naturally stays checked (and visible in the conflict modal) if the
    // backend bounced any part of it back.
    const assignedIds = new Set((result?.assigned || []).map(a => a.advertId))
    const fullyAssignedUnitKeys = new Set(
      checkedUnits.filter(u => u.advertIds.every(id => assignedIds.has(id))).map(u => u.unitKey)
    )
    checkedUnitKeys.value = new Set(
      Array.from(checkedUnitKeys.value).filter(key => !fullyAssignedUnitKeys.has(key))
    )

    if (result?.skipped?.length > 0) {
      // Enrich with readable labels from the schedules we already have, and
      // surface this as a blocking modal — a silent toast let conflicts pass
      // unnoticed, which is exactly what put adverts on two different pages.
      pagerConflicts.value = result.skipped.map(s => {
        const match = findAdvertDisplay(s.advertId)
        return {
          ...s,
          company_name: match?.company_name || '—',
          advert_title: match?.advert_title || `Advert #${s.advertId}`,
        }
      })
      showConflictModal.value = true
    }

    const assignedCount = result?.assigned?.length || 0
    if (assignedCount > 0) {
      showToast(`${assignedCount} advert${assignedCount !== 1 ? 's' : ''} sent to pager`)
    }
  } catch (e) {
    pageError.value = e.message || 'Failed to send adverts to the pager'
  } finally {
    sendingToPager.value = false
  }
}

const openPagerToFix = () => {
  showConflictModal.value = false
  pagerOpen.value = true
  if (targetPublicationId.value) {
    pager.loadLayout(targetPublicationId.value)
  }
}

// ── INIT ──────────────────────────────────────────────────────────────────
onMounted(() => {
  applyRange({ label: 'This Week', days: 7 })
  loadPagerPublications()
})
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
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 12px;
  flex-wrap: wrap;
}
.page-hd__eyebrow { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #9DC3E6; }
.page-hd__title   { font-size: 22px; font-weight: 700; color: #1F3864; margin: 4px 0 4px; }
.page-hd__sub     { font-size: 12px; color: #888; margin: 0; }
.page-hd__right   { flex-shrink: 0; display: flex; align-items: center; gap: 8px; }

.pager-trigger {
  font-size: 12px; font-weight: 700; padding: 8px 16px;
  background: #1F3864; color: #fff; border: none; border-radius: 2px;
  cursor: pointer; font-family: inherit;
}
.pager-trigger:hover { background: #0066CC; }
.pager-trigger--ghost { background: #fff; color: #1F3864; border: 1.5px solid #BDD7EE; }
.pager-trigger--ghost:hover { background: #F0F4F8; border-color: #9DC3E6; }

/* PRINT QUEUE SELECTION */
.pq-band {
  background: #fff; border: 1px solid #DEEAF1; border-top: none;
}
.pq-band__head {
  display: flex; justify-content: space-between; align-items: flex-start;
  padding: 12px 14px; gap: 12px;
}
.pq-band__title { font-size: 13px; font-weight: 700; color: #1F3864; }
.pq-band__sub   { font-size: 11px; color: #888; margin-top: 2px; }
.pq-collapse-btn {
  font-size: 11px; font-weight: 600; padding: 5px 12px;
  border: 1px solid #BDD7EE; background: #F7FBFE; color: #6081a3; cursor: pointer; font-family: inherit;
  flex-shrink: 0;
}
.pq-collapse-btn:hover { background: #DEEAF1; color: #1F3864; }

.pq-band__body { padding: 0 14px 14px; }

.pq-toolbar {
  display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 10px;
}
.pq-selectall {
  display: flex; align-items: center; gap: 6px; font-size: 12px; color: #444; cursor: pointer;
}
.pq-pub-select {
  border: 1px solid #BDD7EE; padding: 6px 10px; font-size: 12px;
  font-family: inherit; background: #fff; color: #222; min-width: 240px;
}
.pq-send-btn {
  font-size: 12px; font-weight: 700; padding: 7px 16px;
  background: #1F3864; color: #fff; border: none; border-radius: 2px; cursor: pointer; font-family: inherit;
  margin-left: auto;
}
.pq-send-btn:hover:not(:disabled) { background: #0066CC; }
.pq-send-btn:disabled { opacity: .5; cursor: not-allowed; }

.pq-table-wrap { max-height: 260px; overflow-y: auto; border: 1px solid #DEEAF1; }
.pq-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.pq-table th {
  position: sticky; top: 0; background: #F0F4F8; text-align: left;
  padding: 7px 10px; font-size: 10px; font-weight: 700; text-transform: uppercase;
  letter-spacing: .4px; color: #888; border-bottom: 1.5px solid #DEEAF1;
}
.pq-table td { padding: 6px 10px; border-bottom: 1px solid #F0F4F8; color: #333; }
.pq-group-members { font-size: 10px; color: #999; margin-top: 2px; }
.pq-table tr:hover td { background: #F7FBFE; }
.pq-table .mono { font-family: 'IBM Plex Mono', monospace; font-size: 11px; }
.pq-empty { text-align: center; color: #aaa; padding: 20px; }

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
  .page-hd      { flex-direction: column; align-items: stretch; }
}

/* CONFLICT ALERT MODAL */
.cf-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,.55); z-index: 8000;
  display: flex; align-items: center; justify-content: center; padding: 20px;
}
.cf-panel {
  background: #fff; width: 100%; max-width: 520px; max-height: 80vh;
  display: flex; flex-direction: column; border-top: 4px solid #E31E24;
  box-shadow: 0 24px 64px rgba(0,0,0,.4);
}
.cf-head { display: flex; gap: 12px; padding: 18px 20px; border-bottom: 1px solid #DEEAF1; }
.cf-head__icon { font-size: 22px; flex-shrink: 0; }
.cf-head__title { font-size: 14px; font-weight: 700; color: #1F3864; }
.cf-head__sub   { font-size: 12px; color: #888; margin-top: 3px; line-height: 1.4; }

.cf-list { flex: 1; overflow-y: auto; padding: 8px 20px; }
.cf-row { padding: 9px 0; border-bottom: 1px solid #F0F4F8; }
.cf-row__main { display: flex; justify-content: space-between; gap: 10px; }
.cf-row__title  { font-size: 12px; font-weight: 600; color: #1F3864; }
.cf-row__client { font-size: 11px; color: #888; flex-shrink: 0; }
.cf-row__reason { font-size: 11px; color: #9C5700; margin-top: 2px; }
.cf-row__reason--conflict { color: #9C0006; font-weight: 600; }

.cf-actions {
  display: flex; justify-content: flex-end; gap: 8px; padding: 14px 20px; border-top: 1px solid #DEEAF1;
}
.cf-btn {
  font-size: 12px; font-weight: 700; padding: 8px 16px; border-radius: 2px; cursor: pointer; font-family: inherit;
}
.cf-btn--ghost   { background: #fff; border: 1.5px solid #D1D9E0; color: #555; }
.cf-btn--ghost:hover { background: #F0F4F8; }
.cf-btn--primary { background: #1F3864; border: 1.5px solid #1F3864; color: #fff; }
.cf-btn--primary:hover { background: #0066CC; border-color: #0066CC; }
</style>