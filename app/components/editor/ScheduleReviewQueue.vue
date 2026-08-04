<!-- components/editor/ScheduleReviewQueue.vue -->
<template>
  <div class="srq">

    <!-- BULK ACTION BAR -->
    <transition name="bulk-slide">
      <div v-if="selected.length > 0" class="srq-bulk">
        <span class="srq-bulk__count">{{ selected.length }} row{{ selected.length !== 1 ? 's' : '' }} selected</span>
        <div class="srq-bulk__actions">
          <button class="srq-bulk-btn" @click="$emit('bulk-page', selectedSchedules)">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="12" height="12" rx="1" stroke="currentColor" stroke-width="1.5"/><path d="M5 8h6M8 5v6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            Bulk Assign Pages
          </button>
          <button class="srq-bulk-btn srq-bulk-btn--ghost" @click="clearSelection">✕ Clear</button>
        </div>
      </div>
    </transition>

    <!-- LOADING -->
    <div v-if="loading" class="srq-loading">
      <div class="srq-spinner"></div>
      <span>Loading schedule queue…</span>
    </div>

    <!-- EMPTY -->
    <div v-else-if="displaySchedules.length === 0" class="srq-empty">
      <div class="srq-empty__icon">📅</div>
      <div class="srq-empty__title">{{ colSearch ? 'No results match your search' : 'No schedules found' }}</div>
      <div class="srq-empty__sub">{{ colSearch ? 'Try a different client, contact, email or advert title.' : 'Adjust the date range or filters above.' }}</div>
      <button v-if="colSearch" class="srq-empty__clear" @click="colSearch = ''">Clear search</button>
    </div>

    <!-- TABLE -->
    <div v-else class="srq-scroll">
      <table class="srq-tbl">
        <thead>
          <tr>
            <th class="tc-chk">
              <input type="checkbox" :checked="allSelected" @change="toggleAll" class="srq-check">
            </th>
            <th class="tc-date">Run Date</th>
            <th class="tc-time">Time</th>
            <th class="tc-page">Page / Slot</th>
            <th class="tc-ref">Ref #</th>
            <!-- CLIENT / TITLE — inline search lives in the header -->
            <th class="tc-client">
              <div class="col-hd">
                <span class="col-hd__label">Client / Title</span>
                <div class="col-search-wrap">
                  <svg class="col-search-ico" width="10" height="10" viewBox="0 0 16 16" fill="none"><circle cx="6.5" cy="6.5" r="4" stroke="currentColor" stroke-width="1.5"/><path d="M10 10l3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                  <input
                    type="text"
                    v-model="colSearch"
                    class="col-search-inp"
                    placeholder="Search…"
                    @click.stop
                  >
                  <button v-if="colSearch" class="col-search-clear" @click.stop="colSearch = ''">×</button>
                </div>
              </div>
            </th>
            <th class="tc-size">Ad Size</th>
            <th class="tc-status">Status</th>
            <th class="tc-media">Files</th>
            <th class="tc-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="s in displaySchedules"
            :key="s.schedule_id"
            class="srq-row"
            :class="{
              'srq-row--published': s.is_published,
              'srq-row--selected':  selected.includes(s.schedule_id),
              'srq-row--today':     isToday(s.run_date) && !s.is_published,
            }"
          >
            <!-- Checkbox -->
            <td class="tc-chk td-mid">
              <input type="checkbox"
                :checked="selected.includes(s.schedule_id)"
                @change="toggleSelect(s.schedule_id)"
                class="srq-check">
            </td>

            <!-- Run Date -->
            <td class="tc-date">
              <div class="run-date" :class="{ 'run-date--today': isToday(s.run_date) }">
                {{ fmtDate(s.run_date) }}
              </div>
              <span v-if="isToday(s.run_date)" class="today-tag">TODAY</span>
            </td>

            <!-- Time -->
            <td class="tc-time">
              <div v-if="s.run_time && s.run_time.length" class="time-chips">
                <span v-for="t in (Array.isArray(s.run_time) ? s.run_time : [s.run_time])" :key="t" class="time-chip">{{ t }}</span>
              </div>
              <span v-else class="no-val">—</span>
            </td>

            <!-- Page / Slot — inline editable -->
            <td class="tc-page td-mid">
              <input
                type="number"
                :value="s.page || ''"
                @change="onPageChange(s, $event.target.value)"
                @keydown.enter="$event.target.blur()"
                min="0"
                class="page-input"
                :class="{ 'page-input--set': s.page > 0 }"
                placeholder="—"
                title="Click to set page / slot number"
              >
            </td>

            <!-- Ref # — group count chip when this row has an ad slot, single ref otherwise -->
            <td class="tc-ref td-mid">
              <span v-if="isGrouped(s)" class="ref-chip ref-chip--group" :title="`${allAdverts(s).length} adverts across ${s.fileGroups.length} ad slot${s.fileGroups.length !== 1 ? 's' : ''}`">
                📁 {{ allAdverts(s).length }}
              </span>
              <span v-else class="ref-chip">{{ primaryAdvert(s)?.id }}</span>
            </td>

            <!-- Client / Title + full contact info — group-aware -->
            <td class="tc-client">
              <template v-if="!isGrouped(s)">
                <div class="client-name" v-html="hl(primaryAdvert(s)?.company_name)"></div>
                <div class="advert-title-line" v-html="hl(primaryAdvert(s)?.advert_title)"></div>
                <!-- Contact block — always visible -->
                <div class="contact-block">
                  <div v-if="primaryAdvert(s)?.contact_person" class="contact-row">
                    <svg class="c-ico" width="9" height="9" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="6" r="3" stroke="currentColor" stroke-width="1.5"/><path d="M2 14c0-3.314 2.686-5 6-5s6 1.686 6 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                    <span v-html="hl(primaryAdvert(s).contact_person)"></span>
                  </div>
                  <div v-if="primaryAdvert(s)?.contact_email" class="contact-row">
                    <svg class="c-ico" width="9" height="9" viewBox="0 0 16 16" fill="none"><rect x="1" y="3" width="14" height="10" rx="1" stroke="currentColor" stroke-width="1.5"/><path d="M1 5l7 5 7-5" stroke="currentColor" stroke-width="1.5"/></svg>
                    <a :href="`mailto:${primaryAdvert(s).contact_email}`" class="c-link" @click.stop>
                      <span v-html="hl(primaryAdvert(s).contact_email)"></span>
                    </a>
                  </div>
                  <div v-if="primaryAdvert(s)?.contact_number" class="contact-row">
                    <svg class="c-ico" width="9" height="9" viewBox="0 0 16 16" fill="none"><path d="M3 2h3l1 3-1.5 1.5c.8 1.6 2.4 3.2 4 4L11 9l3 1v3c0 .6-.5 1-1 1C5 14 2 8 2 3c0-.5.4-1 1-1z" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    <a :href="`tel:${primaryAdvert(s).contact_number}`" class="c-link" @click.stop>{{ primaryAdvert(s).contact_number }}</a>
                  </div>
                </div>
              </template>

              <!-- Grouped: one physical file, several adverts — list them all, don't pretend it's one -->
              <template v-else>
                <div v-for="g in s.fileGroups" :key="g.groupId" class="group-block">
                  <div class="group-block__label">📁 {{ g.label || `Ad Slot ${g.groupId}` }}<span v-if="g.file"> · {{ g.file.name }}</span></div>
                  <div v-for="a in g.adverts" :key="a.id" class="group-block__advert">
                    <span class="client-name client-name--sm" v-html="hl(a.company_name)"></span>
                    <span class="advert-title-line" v-html="hl(a.advert_title)"></span>
                  </div>
                </div>
                <div v-if="s.ungroupedAdverts && s.ungroupedAdverts.length" class="group-block">
                  <div v-for="a in s.ungroupedAdverts" :key="a.id" class="group-block__advert">
                    <span class="client-name client-name--sm" v-html="hl(a.company_name)"></span>
                    <span class="advert-title-line" v-html="hl(a.advert_title)"></span>
                  </div>
                </div>
              </template>
            </td>

            <!-- Ad Size -->
            <td class="tc-size">
              <span class="size-chip">{{ s.ad_size }}</span>
              <div class="ad-type-label">{{ fmtAdType(s.ad_type) }}</div>
            </td>

            <!-- Status -->
            <td class="tc-status td-mid">
              <span class="status-badge" :class="statusClass(s)">{{ statusLabel(s) }}</span>
            </td>

            <!-- Files — opens media viewer -->
            <td class="tc-media td-mid">
              <button v-if="s.media && s.media.length" class="media-btn" @click="$emit('view-media', s)">
                <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M5 4V3a1 1 0 011-1h4a1 1 0 011 1v1M3 4v9a1 1 0 001 1h8a1 1 0 001-1V4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                <span class="media-btn__n">{{ s.media.length }}</span>
              </button>
              <span v-else class="no-val">—</span>
            </td>

            <!-- Actions -->
            <td class="tc-actions td-mid">
              <div class="act-row">

                <!-- Edit -->
                <div class="act-wrap">
                  <button class="act-btn act-btn--edit" @click="$emit('edit', s)">
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M11.5 2.5l2 2-9 9H2.5v-2l9-9z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>
                  </button>
                  <span class="act-tip">Edit</span>
                </div>

                <!-- Publish / Unpublish — locked when no page assigned and not yet published -->
                <div class="act-wrap">
                  <button
                    class="act-btn"
                    :class="publishBtnClass(s)"
                    :disabled="cannotPublish(s)"
                    @click="!cannotPublish(s) && $emit('publish-toggle', s.schedule_id, !s.is_published)"
                  >
                    <!-- Published: tick -->
                    <svg v-if="s.is_published" width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M2 8l4 4 8-8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    <!-- No page: padlock -->
                    <svg v-else-if="cannotPublish(s)" width="12" height="12" viewBox="0 0 16 16" fill="none"><rect x="4" y="7" width="8" height="7" rx="1" stroke="currentColor" stroke-width="1.5"/><path d="M5.5 7V5a2.5 2.5 0 015 0v2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                    <!-- Ready to publish: clock -->
                    <svg v-else width="12" height="12" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5"/><path d="M8 5v3l2 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                  </button>
                  <span class="act-tip">
                    {{ s.is_published ? 'Unpublish' : cannotPublish(s) ? 'Assign page / slot first' : 'Publish' }}
                  </span>
                </div>

                <!-- Remove -->
                <div class="act-wrap">
                  <button class="act-btn act-btn--danger" @click="onUnschedule(s)">
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M6 4V2h4v2M5 4v9a1 1 0 001 1h4a1 1 0 001-1V4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  </button>
                  <span class="act-tip">Remove</span>
                </div>

              </div>
            </td>

          </tr>
        </tbody>
      </table>
    </div>

    <!-- FOOTER -->
    <div v-if="!loading && schedules.length > 0" class="srq-foot">
      <div class="srq-foot__stats">
        <span class="fs-item">
          <strong>{{ displaySchedules.length }}</strong>
          <template v-if="colSearch"> of {{ schedules.length }}</template>
          &nbsp;total
        </span>
        <span class="fs-div">|</span>
        <span class="fs-item fs-green"><strong>{{ publishedCount }}</strong> published</span>
        <span class="fs-div">|</span>
        <span class="fs-item fs-amber"><strong>{{ noPagesCount }}</strong> no page</span>
        <span class="fs-div">|</span>
        <span class="fs-item fs-lock"><strong>{{ needsPageCount }}</strong> need page to publish</span>
        <span class="fs-div">|</span>
        <span class="fs-item"><strong>{{ withMediaCount }}</strong> with files</span>
      </div>
      <div class="srq-foot__actions">
        <button class="foot-btn" @click="$emit('refresh')">↺ Refresh</button>
        <button v-if="schedules.length > 1" class="foot-btn foot-btn--navy" @click="$emit('bulk-page', schedules)">
          Bulk Assign Pages
        </button>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  schedules: { type: Array,   default: () => [] },
  loading:   { type: Boolean, default: false },
})
const emit = defineEmits(['page-update', 'publish-toggle', 'edit', 'unschedule', 'bulk-page', 'refresh', 'view-media'])

const todayStr  = new Date().toISOString().split('T')[0]
const selected  = ref([])
const colSearch = ref('')

// Every advert on a schedule row — flattened across its ad slots and
// ungroupedAdverts, since that's the full set search/highlight needs to
// check against now that a row can hold more than one advert.
const allAdverts = (s) => [
  ...((s.fileGroups || []).flatMap(g => g.adverts || [])),
  ...(s.ungroupedAdverts || []),
]
const isGrouped    = (s) => (s.fileGroups || []).length > 0
const primaryAdvert = (s) => allAdverts(s)[0] || null

// ── Column-level search ──────────────────────────────────────────────────────
const displaySchedules = computed(() => {
  const q = colSearch.value.trim().toLowerCase()
  if (!q) return props.schedules
  return props.schedules.filter(s =>
    allAdverts(s).some(a =>
      (a.company_name   || '').toLowerCase().includes(q) ||
      (a.advert_title   || '').toLowerCase().includes(q) ||
      (a.contact_person || '').toLowerCase().includes(q) ||
      (a.contact_email  || '').toLowerCase().includes(q) ||
      (a.contact_number || '').toLowerCase().includes(q) ||
      String(a.id || '').includes(q)
    )
  )
})

// Highlight matched text (safe — only plain-text fields)
const hl = (text) => {
  if (!colSearch.value || !text) return text || ''
  const escaped = colSearch.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return text.replace(new RegExp(`(${escaped})`, 'gi'), '<mark class="srq-hl">$1</mark>')
}

// ── Computed stats ────────────────────────────────────────────────────────────
const allSelected       = computed(() => displaySchedules.value.length > 0 && displaySchedules.value.every(s => selected.value.includes(s.schedule_id)))
const selectedSchedules = computed(() => props.schedules.filter(s => selected.value.includes(s.schedule_id)))
const publishedCount    = computed(() => props.schedules.filter(s =>  s.is_published).length)
const noPagesCount      = computed(() => props.schedules.filter(s => !s.page || s.page < 1).length)
const needsPageCount    = computed(() => props.schedules.filter(s => (!s.page || s.page < 1) && !s.is_published).length)
const withMediaCount    = computed(() => props.schedules.filter(s => s.media?.length > 0).length)

// ── Helpers ───────────────────────────────────────────────────────────────────
const toggleAll    = () => { selected.value = allSelected.value ? [] : displaySchedules.value.map(s => s.schedule_id) }
const toggleSelect = (id) => { const i = selected.value.indexOf(id); i === -1 ? selected.value.push(id) : selected.value.splice(i, 1) }
const clearSelection = () => { selected.value = [] }
const isToday = (d) => d && d.split('T')[0] === todayStr

const fmtDate = (s) => {
  if (!s) return '—'
  try { return new Date(s + 'T00:00:00').toLocaleDateString('en-UG', { weekday: 'short', month: 'short', day: 'numeric' }) }
  catch { return s }
}
const fmtAdType   = (t) => ({ full_color: 'Full Colour', black_white: 'B&W' }[t] || t || '')
const statusClass = (s) => s.is_published ? 'status--pub' : (s.page > 0 ? 'status--paged' : 'status--sched')
const statusLabel = (s) => s.is_published ? 'Published' : (s.page > 0 ? 'Page Assigned' : 'Scheduled')

// Publish guard: cannot publish without a page/slot number
const cannotPublish  = (s) => !s.is_published && (!s.page || s.page < 1)
const publishBtnClass = (s) => ({
  'act-btn--published': s.is_published,
  'act-btn--stage':     !s.is_published && !cannotPublish(s),
  'act-btn--locked':    cannotPublish(s),
})

const onPageChange = (s, val) => {
  const n = parseInt(val)
  if (!isNaN(n) && n >= 0 && n !== (s.page || 0)) emit('page-update', s.schedule_id, n)
}
const onUnschedule = (s) => {
  const adverts = allAdverts(s)
  const msg = adverts.length > 1
    ? `Remove schedule on ${fmtDate(s.run_date)}?\n\nThis will unschedule ALL ${adverts.length} adverts sharing this file:\n${adverts.map(a => `  • ${a.advert_title} (${a.company_name || '—'})`).join('\n')}\n\nThis cannot be undone.`
    : `Remove schedule for "${adverts[0]?.advert_title}" on ${fmtDate(s.run_date)}?\n\nThis cannot be undone.`
  if (confirm(msg)) emit('unschedule', s.schedule_id)
}
</script>

<style scoped>
.srq { font-family: 'IBM Plex Sans', 'Segoe UI', sans-serif; font-size: 13px; }

/* ── BULK BAR ── */
.srq-bulk { display: flex; align-items: center; gap: 12px; background: #1F3864; padding: 9px 16px; }
.srq-bulk__count { color: #9DC3E6; font-size: 12px; font-weight: 600; font-family: 'IBM Plex Mono', monospace; }
.srq-bulk__actions { display: flex; gap: 8px; margin-left: auto; }
.srq-bulk-btn { font-size: 11px; font-weight: 600; padding: 5px 12px; border: 1px solid #9DC3E6; background: transparent; color: #fff; cursor: pointer; display: inline-flex; align-items: center; gap: 5px; font-family: inherit; }
.srq-bulk-btn:hover { background: rgba(157,195,230,.2); }
.srq-bulk-btn--ghost { border-color: #FCE4D6; color: #FCE4D6; }
.bulk-slide-enter-active, .bulk-slide-leave-active { transition: all .2s ease; }
.bulk-slide-enter-from, .bulk-slide-leave-to { opacity: 0; transform: translateY(-6px); }

/* ── LOADING / EMPTY ── */
.srq-loading { display: flex; align-items: center; gap: 12px; padding: 40px 20px; color: #888; font-size: 13px; }
.srq-spinner { width: 20px; height: 20px; border: 2px solid #DEEAF1; border-top-color: #1F3864; border-radius: 50%; animation: spin .9s linear infinite; flex-shrink: 0; }
@keyframes spin { to { transform: rotate(360deg); } }
.srq-empty { text-align: center; padding: 52px 20px; background: #F7FBFE; border: 1px solid #DEEAF1; }
.srq-empty__icon  { font-size: 32px; margin-bottom: 10px; }
.srq-empty__title { font-size: 14px; font-weight: 700; color: #1F3864; }
.srq-empty__sub   { font-size: 12px; color: #999; margin-top: 4px; }
.srq-empty__clear { margin-top: 12px; font-size: 11px; font-weight: 600; padding: 5px 14px; border: 1px solid #9DC3E6; background: #DEEAF1; color: #1F3864; cursor: pointer; font-family: inherit; }
.srq-empty__clear:hover { background: #1F3864; color: #fff; border-color: #1F3864; }

/* ── TABLE ── */
.srq-scroll { overflow-x: auto; }
.srq-tbl { width: 100%; border-collapse: collapse; font-size: 12px; min-width: 980px; }

/* Navy header row */
.srq-tbl thead tr { background: #1F3864; }
.srq-tbl thead th {
  font-size: 10px; font-weight: 700; text-transform: uppercase;
  letter-spacing: .5px; color: #9DC3E6;
  border-right: 1px solid rgba(157,195,230,.2); text-align: left;
  /* padding applied per-cell below */
  vertical-align: top;
}
.srq-tbl thead th:not(.tc-client) { padding: 9px 10px; white-space: nowrap; }
.srq-tbl thead th:last-child { border-right: none; }

/* CLIENT header — extra height for search input */
.tc-client { min-width: 240px; }
.col-hd { padding: 7px 10px 7px; display: flex; flex-direction: column; gap: 5px; }
.col-hd__label { white-space: nowrap; display: block; }
.col-search-wrap {
  display: flex; align-items: center;
  border: 1px solid rgba(157,195,230,.35); background: rgba(255,255,255,.07);
  padding: 2px 6px;
}
.col-search-ico { color: #9DC3E6; flex-shrink: 0; }
.col-search-inp {
  background: transparent; border: none; color: #fff;
  font-size: 11px; padding: 3px 5px; width: 130px;
  font-family: inherit; outline: none;
}
.col-search-inp::placeholder { color: rgba(157,195,230,.45); }
.col-search-clear { background: none; border: none; color: #9DC3E6; cursor: pointer; font-size: 15px; padding: 0 2px; line-height: 1; }
.col-search-clear:hover { color: #fff; }

/* ── ROWS ── */
.srq-row { border-bottom: 1px solid #EBF4FF; transition: background .1s; }
.srq-row:nth-child(even)   { background: #FAFCFF; }
.srq-row:hover             { background: #EBF4FF !important; }
.srq-row--published        { background: #F0FDF4 !important; }
.srq-row--selected         { background: #E8F2FF !important; outline: 1px solid #9DC3E6; }
.srq-row--today:not(.srq-row--published) { background: #FFFDE7 !important; }
.srq-tbl td { padding: 9px 10px; border-right: 1px solid #EBF4FF; vertical-align: top; }
.srq-tbl td:last-child { border-right: none; overflow: visible; }
.td-mid { vertical-align: middle !important; }

/* ── COL WIDTHS ── */
.tc-chk  { width: 34px; text-align: center; }
.tc-date { min-width: 110px; }
.tc-time { min-width: 90px; }
.tc-page { width: 84px; }
.tc-ref  { width: 80px; }
.tc-size { min-width: 90px; }
.tc-status { min-width: 110px; }
.tc-media  { width: 72px; text-align: center; }
.tc-actions { width: 106px; overflow: visible; }

.srq-check { accent-color: #1F3864; cursor: pointer; width: 13px; height: 13px; }

/* ── DATE ── */
.run-date { font-family: 'IBM Plex Mono', monospace; font-size: 11px; font-weight: 600; color: #1F3864; white-space: nowrap; }
.run-date--today { color: #9C0006; }
.today-tag { display: inline-block; font-size: 8px; font-weight: 700; letter-spacing: .8px; color: #9C0006; background: #FCE4D6; border: 1px solid #E31E24; padding: 0 4px; margin-top: 3px; }

/* ── TIME ── */
.time-chips { display: flex; flex-direction: column; gap: 2px; }
.time-chip  { display: inline-block; font-family: 'IBM Plex Mono', monospace; font-size: 10px; font-weight: 600; background: #DEEAF1; color: #1F3864; border: 1px solid #9DC3E6; padding: 1px 5px; white-space: nowrap; }
.no-val { color: #ccc; font-size: 11px; }

/* ── PAGE / SLOT INPUT ── */
.page-input {
  width: 64px; border: 1px solid #BDD7EE; padding: 5px 6px;
  font-size: 12px; font-family: 'IBM Plex Mono', monospace;
  border-radius: 0; text-align: center; background: #fff; display: block;
}
.page-input:focus { outline: none; border-color: #1F3864; box-shadow: 0 0 0 2px rgba(31,56,100,.12); }
.page-input--set  { border-color: #375623; background: #E2EFDA; font-weight: 700; color: #375623; }
.page-input::placeholder { color: #ccc; }

/* ── REF ── */
.ref-chip { display: inline-block; font-family: 'IBM Plex Mono', monospace; font-size: 10px; font-weight: 700; color: #1F3864; background: #DEEAF1; border: 1px solid #9DC3E6; padding: 1px 6px; white-space: nowrap; }
.ref-chip--group { background: #FFF3D6; border-color: #FFCC00; color: #9C5700; cursor: help; }

/* ── GROUPED ADVERT BLOCKS ── */
.group-block { padding: 4px 0; }
.group-block + .group-block { margin-top: 6px; padding-top: 6px; border-top: 1px dashed #E8F2FF; }
.group-block__label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .4px; color: #9C5700; margin-bottom: 3px; }
.group-block__advert { display: flex; align-items: baseline; gap: 6px; font-size: 11px; padding: 1px 0; }
.client-name--sm { font-size: 11px; font-weight: 700; color: #1a1a1a; }

/* ── CLIENT / CONTACT BLOCK ── */
.client-name       { font-size: 12px; font-weight: 700; color: #1a1a1a; line-height: 1.3; }
.advert-title-line { font-size: 11px; color: #555; margin-top: 2px; }
.contact-block     { margin-top: 6px; display: flex; flex-direction: column; gap: 3px; padding-top: 6px; border-top: 1px dashed #E8F2FF; }
.contact-row { display: flex; align-items: center; gap: 5px; font-size: 10px; color: #777; }
.c-ico  { color: #9DC3E6; flex-shrink: 0; }
.c-link { color: #1F3864; text-decoration: none; font-weight: 500; }
.c-link:hover { text-decoration: underline; color: #E31E24; }

/* Search highlight */
:deep(.srq-hl) { background: #FFEB9C; color: #9C5700; font-style: normal; padding: 0 1px; border-radius: 1px; }

/* ── SIZE ── */
.size-chip     { display: inline-block; font-size: 10px; font-weight: 600; background: #F7FBFE; border: 1px solid #BDD7EE; color: #4a4a4a; padding: 1px 6px; white-space: nowrap; }
.ad-type-label { font-size: 10px; color: #bbb; margin-top: 2px; }

/* ── STATUS ── */
.status-badge  { display: inline-block; font-size: 9px; font-weight: 700; padding: 2px 7px; border: 1px solid transparent; text-transform: uppercase; letter-spacing: .4px; white-space: nowrap; }
.status--pub   { background: #E2EFDA; color: #375623; border-color: #A9D18E; }
.status--paged { background: #DEEAF1; color: #1F3864; border-color: #9DC3E6; }
.status--sched { background: #FFEB9C; color: #9C5700; border-color: #FFCC00; }

/* ── MEDIA BUTTON ── */
.media-btn {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 11px; font-weight: 700; color: #1F3864;
  border: 1px solid #9DC3E6; background: #DEEAF1;
  padding: 4px 8px; cursor: pointer; font-family: 'IBM Plex Mono', monospace;
}
.media-btn:hover { background: #1F3864; color: #fff; border-color: #1F3864; }
.media-btn__n { font-size: 12px; }

/* ── ACTIONS ── */
.act-row  { display: flex; gap: 4px; align-items: center; overflow: visible; }
.act-wrap { position: relative; display: inline-flex; }
.act-btn  {
  width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center;
  border: 1px solid #BDD7EE; background: #F7FBFE; color: #6081a3; cursor: pointer;
}
.act-btn:hover:not(:disabled) { background: #DEEAF1; color: #1F3864; border-color: #9DC3E6; }
.act-btn--published      { background: #E2EFDA; color: #375623; border-color: #A9D18E; }
.act-btn--stage          { background: #FFEB9C; color: #9C5700; border-color: #FFCC00; }
.act-btn--stage:hover:not(:disabled) { background: #375623; color: #fff; border-color: #375623; }
/* Locked = no page assigned, cannot publish */
.act-btn--locked         { background: #F3F4F6 !important; color: #C0C8D4 !important; border-color: #E2E8F0 !important; cursor: not-allowed !important; }
.act-btn--danger:hover:not(:disabled) { background: #FCE4D6; color: #9C0006; border-color: #E31E24; }
.act-btn:disabled        { cursor: not-allowed; }

/* Tooltip */
.act-tip {
  position: absolute; bottom: calc(100% + 6px); left: 50%; transform: translateX(-50%);
  background: #1F3864; color: #fff; font-size: 10px; white-space: nowrap; font-weight: 600;
  padding: 3px 8px; pointer-events: none; opacity: 0; z-index: 9999; transition: opacity .15s;
  font-family: 'IBM Plex Sans', sans-serif;
}
.act-tip::after { content: ''; position: absolute; top: 100%; left: 50%; transform: translateX(-50%); border: 4px solid transparent; border-top-color: #1F3864; }
.act-wrap:hover .act-tip { opacity: 1; }

/* ── FOOTER ── */
.srq-foot {
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px 14px; background: #F7FBFE; border-top: 2px solid #DEEAF1;
  flex-wrap: wrap; gap: 8px;
}
.srq-foot__stats { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #666; flex-wrap: wrap; }
.fs-div   { color: #BDD7EE; }
.fs-green { color: #375623; }
.fs-amber { color: #9C5700; }
.fs-lock  { color: #aaa; }
.srq-foot__actions { display: flex; gap: 8px; flex-shrink: 0; }
.foot-btn { font-size: 11px; font-weight: 600; padding: 5px 12px; border: 1px solid #9DC3E6; background: #fff; color: #1F3864; cursor: pointer; font-family: inherit; }
.foot-btn:hover { background: #DEEAF1; }
.foot-btn--navy { background: #1F3864; color: #fff; border-color: #1F3864; }
.foot-btn--navy:hover { background: #152a4e; }
</style>