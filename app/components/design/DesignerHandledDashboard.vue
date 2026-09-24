<!-- components/design/DesignerHandledDashboard.vue
  Design House Dashboard — what each designer has handled, per day.

  Separate page from the Design Desk workspace (DesignDeskWorkspace.vue):
  that's the working queue/layout board; this is the supervision view —
  one row per designer, expandable to the adverts they ticked off and the
  PDF (if any) each one landed on. Read-only, no actions.

  Data comes from a single call to the report endpoint added alongside the
  attribution work: POST /design-house/reports/by-designer, which already
  resolves each handled advert's PDF server-side (see getDesignerReport in
  design-house.js) — this component only renders what it gets back.
-->
<template>
  <div class="dd-page">

    <!-- ── Error banner ────────────────────────────────────────────────── -->
    <div v-if="error" class="dd-error">
      <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>
      <span><strong>Error:</strong> {{ error }}</span>
    </div>

    <!-- ════════════════════════════════════════════════════
         FILTER PANEL
    ═════════════════════════════════════════════════════ -->
    <section class="filter-panel">
      <div class="filter-panel__head">
        <div class="filter-panel__title">
          <svg class="fp-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <span>Design House Dashboard</span>
        </div>
      </div>

      <div class="filter-panel__body">
        <div class="fp-row fp-row--dates">
          <div class="fp-field">
            <label class="fp-label" for="startDate">From</label>
            <input id="startDate" type="date" v-model="startDate" class="fp-input" :max="endDate" @change="onDateInputChange">
          </div>
          <div class="fp-field">
            <label class="fp-label" for="endDate">To</label>
            <input id="endDate" type="date" v-model="endDate" class="fp-input" :min="startDate" :max="maxDate" @change="onDateInputChange">
          </div>
          <div class="fp-quick">
            <button
              v-for="r in QUICK_RANGES"
              :key="r.key"
              class="qr-btn"
              :class="{ active: activeQuickRange === r.key }"
              @click="setDateRange(r.key)"
            >{{ r.label }}</button>
          </div>
        </div>

        <div class="fp-row fp-row--filters">
          <div class="fp-field fp-field--search">
            <label class="fp-label" for="searchQuery">Search</label>
            <div class="fp-search-wrap">
              <svg class="fp-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input
                id="searchQuery" type="text" v-model="searchQuery" class="fp-input fp-input--search"
                placeholder="Designer name, email, advert reference…"
              >
            </div>
          </div>
        </div>

        <div class="fp-actions">
          <button class="btn btn-apply" :disabled="loading || isDateRangeInvalid" @click="load">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <span>{{ loading ? 'Loading…' : 'Apply' }}</span>
          </button>
          <p v-if="isDateRangeInvalid" class="fp-error">⚠ End date must be after start date</p>
        </div>
      </div>
    </section>

    <!-- ════════════════════════════════════════════════════
         RESULTS AREA
    ═════════════════════════════════════════════════════ -->
    <section class="results-section">

      <!-- Summary strip -->
      <div class="summary-strip">
        <div class="ss-left">
          <span class="ss-count">{{ totalHandled }}</span>
          <span class="ss-label">advert{{ totalHandled !== 1 ? 's' : '' }} handled</span>
        </div>
        <div class="ss-stats">
          <div class="ss-stat">
            <span class="ss-stat__label">Designers</span>
            <span class="ss-stat__value">{{ filteredDesigners.length }}</span>
          </div>
          <div class="ss-divider"></div>
          <div class="ss-stat">
            <span class="ss-stat__label">With PDF</span>
            <span class="ss-stat__value ss-stat__value--green">{{ totalWithPdf }}</span>
          </div>
          <div class="ss-divider"></div>
          <div class="ss-stat">
            <span class="ss-stat__label">Pending PDF</span>
            <span class="ss-stat__value" :class="{ 'ss-stat__value--amber': totalPending > 0 }">{{ totalPending }}</span>
          </div>
        </div>
      </div>

      <!-- Loading / error -->
      <div v-if="loading" class="state-block">
        <div class="spinner-ring" />
        <span>Loading…</span>
      </div>

      <!-- Empty -->
      <div v-else-if="filteredDesigners.length === 0" class="empty-block">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        <p>No adverts were marked handled in this date range{{ searchQuery ? ' matching your search' : '' }}.</p>
      </div>

      <!-- Designer table -->
      <div v-else class="table-wrap">
        <table class="designer-table">
          <thead>
            <tr>
              <th class="th-expand" />
              <th>Designer</th>
              <th class="th-num">Handled</th>
              <th class="th-num">With PDF</th>
              <th class="th-num">Pending</th>
              <th>Last Handled</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="d in filteredDesigners" :key="designerKey(d)">
              <tr
                class="designer-row"
                :class="{ 'row--expanded': expanded === designerKey(d) }"
                @click="toggleExpand(designerKey(d))"
              >
                <td class="td-expand">
                  <span class="expand-icon">{{ expanded === designerKey(d) ? '▾' : '▸' }}</span>
                </td>
                <td class="td-designer">
                  <div class="designer-avatar">{{ initials(d.designer) }}</div>
                  <div>
                    <div class="designer-name">{{ d.designer?.name || 'Unattributed' }}</div>
                    <div class="designer-email">{{ d.designer?.email || '—' }}</div>
                  </div>
                </td>
                <td class="td-num td-num--strong">{{ d.handledCount }}</td>
                <td class="td-num">
                  <span class="count-chip count-chip--green">{{ withPdfCount(d) }}</span>
                </td>
                <td class="td-num">
                  <span v-if="pendingCount(d) > 0" class="count-chip count-chip--amber">{{ pendingCount(d) }}</span>
                  <span v-else class="count-chip count-chip--muted">0</span>
                </td>
                <td class="td-date">{{ fmtDateTime(lastHandledAt(d)) }}</td>
              </tr>

              <Transition name="expand">
                <tr v-if="expanded === designerKey(d)" class="detail-row">
                  <td colspan="6">
                    <div class="detail-body">
                      <table class="adverts-table">
                        <thead>
                          <tr>
                            <th>Reference</th>
                            <th>Advert</th>
                            <th>Client</th>
                            <th>Handled</th>
                            <th>PDF</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="a in filteredAdverts(d)" :key="a.id">
                            <td class="dr-mono">
                              {{ a.reference }}
                              <span v-if="a.bcReference" class="dr-bcref">· BC {{ a.bcReference }}</span>
                            </td>
                            <td>{{ a.advertTitle }}</td>
                            <td>{{ a.clientName }}</td>
                            <td class="dr-mono dr-date">{{ fmtDateTime(a.handledAt) }}</td>
                            <td>
                              <a
                                v-if="a.pdf"
                                class="pdf-link"
                                :href="resolveUrl(a.pdf.url)"
                                target="_blank"
                                rel="noopener"
                              >📎 {{ a.pdf.name }}</a>
                              <span v-else class="pdf-pending">Pending</span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </td>
                </tr>
              </Transition>
            </template>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useDesignHouse } from '~/composables/useDesignHouse'

const { fetchDesignerReport, resolveUrl, loading, error } = useDesignHouse()

// ── Date range ───────────────────────────────────────────────────────────
const toDateStr = (d) => d.toISOString().split('T')[0]
const today = new Date()
const maxDate = toDateStr(today)

const startDate = ref(toDateStr(today))
const endDate = ref(toDateStr(today))
const activeQuickRange = ref('today')

const QUICK_RANGES = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'this_week', label: 'This Week' },
  { key: 'this_month', label: 'This Month' },
]

function computeRange(key) {
  const fmt = toDateStr
  const t = new Date()
  switch (key) {
    case 'yesterday': {
      const y = new Date(t); y.setDate(y.getDate() - 1)
      return { startDate: fmt(y), endDate: fmt(y) }
    }
    case 'this_week': {
      const dow = t.getDay() || 7
      const mon = new Date(t); mon.setDate(t.getDate() - dow + 1)
      const sun = new Date(mon); sun.setDate(mon.getDate() + 6)
      return { startDate: fmt(mon), endDate: fmt(sun) }
    }
    case 'this_month': {
      const first = new Date(t.getFullYear(), t.getMonth(), 1)
      const last = new Date(t.getFullYear(), t.getMonth() + 1, 0)
      return { startDate: fmt(first), endDate: fmt(last) }
    }
    default:
      return { startDate: fmt(t), endDate: fmt(t) }
  }
}

function setDateRange(key) {
  activeQuickRange.value = key
  const r = computeRange(key)
  startDate.value = r.startDate
  endDate.value = r.endDate
  load()
}

const isDateRangeInvalid = computed(() => new Date(startDate.value) > new Date(endDate.value))

// ── Search ───────────────────────────────────────────────────────────────
const searchQuery = ref('')

// ── Data ─────────────────────────────────────────────────────────────────
const designers = ref([])

async function load() {
  if (isDateRangeInvalid.value) return
  try {
    const res = await fetchDesignerReport(startDate.value, endDate.value)
    designers.value = res?.designers || []
  } catch (e) {
    // error state is already surfaced via the composable's `error` ref
  }
}

// Any date input change outside the quick-range pills counts as custom
function onDateInputChange() {
  activeQuickRange.value = ''
}

// ── Search filtering ─────────────────────────────────────────────────────
// Filters by designer name/email, or by any advert reference within that
// designer's handled list — matches Indexpage.vue's single search box
// covering reference/client/title.
function matchesDesignerSearch(d) {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return true
  const designerHit =
    (d.designer?.name || 'unattributed').toLowerCase().includes(q) ||
    (d.designer?.email || '').toLowerCase().includes(q)
  const advertHit = (d.adverts || []).some(a =>
    (a.reference || '').toLowerCase().includes(q) ||
    (a.bcReference || '').toLowerCase().includes(q) ||
    (a.advertTitle || '').toLowerCase().includes(q) ||
    (a.clientName || '').toLowerCase().includes(q)
  )
  return designerHit || advertHit
}

const filteredDesigners = computed(() => designers.value.filter(matchesDesignerSearch))

function filteredAdverts(d) {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return d.adverts || []
  const designerNameHits =
    (d.designer?.name || 'unattributed').toLowerCase().includes(q) ||
    (d.designer?.email || '').toLowerCase().includes(q)
  if (designerNameHits) return d.adverts || []
  return (d.adverts || []).filter(a =>
    (a.reference || '').toLowerCase().includes(q) ||
    (a.bcReference || '').toLowerCase().includes(q) ||
    (a.advertTitle || '').toLowerCase().includes(q) ||
    (a.clientName || '').toLowerCase().includes(q)
  )
}

// ── Derived stats ────────────────────────────────────────────────────────
const totalHandled = computed(() => filteredDesigners.value.reduce((s, d) => s + filteredAdverts(d).length, 0))
const totalWithPdf = computed(() => filteredDesigners.value.reduce((s, d) => s + withPdfCount(d), 0))
const totalPending = computed(() => filteredDesigners.value.reduce((s, d) => s + pendingCount(d), 0))

function withPdfCount(d) { return filteredAdverts(d).filter(a => !!a.pdf).length }
function pendingCount(d) { return filteredAdverts(d).filter(a => !a.pdf).length }
function lastHandledAt(d) {
  const dates = filteredAdverts(d).map(a => a.handledAt).filter(Boolean).sort()
  return dates[dates.length - 1] || null
}

// ── Row expand ───────────────────────────────────────────────────────────
const expanded = ref(null)
function designerKey(d) { return d.designer ? `d${d.designer.id}` : 'unattributed' }
function toggleExpand(key) { expanded.value = expanded.value === key ? null : key }

// ── Formatting ───────────────────────────────────────────────────────────
function initials(designer) {
  if (!designer?.name) return '—'
  return designer.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}
function fmtDateTime(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('en-UG', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

onMounted(load)
</script>

<style scoped>
/* ══════════════════════════════════════════════════════════════════════
   TOKENS — matches the existing Adverts Report page's palette so this
   reads as the same product, not a bolted-on new page.
══════════════════════════════════════════════════════════════════════ */
.dd-page {
  --navy:        #003366;
  --blue:        #0066CC;
  --blue-lt:     #EEF4FF;

  --surface:     #FFFFFF;
  --page-bg:     #F0F4F8;
  --border:      #D1D9E0;
  --border-lt:   #E8ECF0;

  --text-1:      #0F172A;
  --text-2:      #334155;
  --text-3:      #64748B;
  --text-4:      #94A3B8;

  --green-text:  #166534;
  --green-bg:    #F0FDF4;
  --green-bd:    #86EFAC;

  --amber-text:  #78350F;
  --amber-bg:    #FFFBEB;
  --amber-bd:    #FCD34D;

  --red-text:    #991B1B;
  --red-bg:      #FEF2F2;
  --red-bd:      #FECACA;

  --radius:      2px;
  --radius-xl:   2px;

  --shadow-md:   0 4px 16px rgba(0,0,0,.08), 0 2px 6px rgba(0,0,0,.05);

  --font: "IBM Plex Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;

  width: 100%;
  min-height: 100%;
  font-family: var(--font);
  font-size: 13px;
  color: var(--text-2);
  padding-bottom: 64px;
}

@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap');

/* ── Error banner ───────────────────────────────────────────────────── */
.dd-error {
  display: flex; align-items: center; gap: 10px;
  margin: 12px 16px; padding: 12px 16px;
  background: var(--red-bg); color: var(--red-text);
  border: 1px solid var(--red-bd); border-radius: var(--radius);
  font-size: 13px;
}
.dd-error svg { width: 18px; height: 18px; flex-shrink: 0; }

/* ── Filter panel ───────────────────────────────────────────────────── */
.filter-panel {
  margin: 16px 16px 0;
  background: var(--surface);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
  overflow: hidden;
}
.filter-panel__head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 18px; border-bottom: 1px solid var(--border-lt);
}
.filter-panel__title {
  display: flex; align-items: center; gap: 8px;
  font-weight: 700; font-size: 14px; color: var(--text-1);
}
.fp-icon { width: 18px; height: 18px; color: var(--blue); }

.filter-panel__body { padding: 16px 18px; }
.fp-row { display: flex; gap: 16px; flex-wrap: wrap; align-items: flex-end; margin-bottom: 12px; }
.fp-row--filters { margin-bottom: 0; }
.fp-field { display: flex; flex-direction: column; gap: 5px; min-width: 140px; }
.fp-field--search { flex: 1; min-width: 220px; }
.fp-label { font-size: 10.5px; font-weight: 600; color: var(--text-3); text-transform: uppercase; letter-spacing: .04em; }
.fp-input {
  font-family: var(--font); font-size: 13px; color: var(--text-1);
  border: 1px solid var(--border); border-radius: var(--radius);
  padding: 8px 10px; background: var(--surface);
}
.fp-input:focus { outline: none; border-color: var(--blue); box-shadow: 0 0 0 3px rgba(0,102,204,.15); }

.fp-quick { display: flex; gap: 6px; flex-wrap: wrap; }
.qr-btn {
  font-family: var(--font); font-size: 12px; font-weight: 600;
  padding: 7px 12px; border-radius: var(--radius);
  border: 1px solid var(--border); background: var(--surface); color: var(--text-2);
  cursor: pointer; transition: all .12s ease;
}
.qr-btn:hover  { border-color: var(--blue); color: var(--blue); background: var(--blue-lt); }
.qr-btn.active { border-color: var(--blue); color: #fff; background: var(--blue); }

.fp-search-wrap { position: relative; }
.fp-search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); width: 15px; height: 15px; color: var(--text-4); }
.fp-input--search { padding-left: 32px; width: 100%; }

.fp-actions { display: flex; align-items: center; gap: 10px; margin-top: 4px; }
.btn {
  font-family: var(--font); font-size: 13px; font-weight: 600;
  padding: 9px 16px; border-radius: var(--radius); border: none;
  display: inline-flex; align-items: center; gap: 7px; cursor: pointer;
  transition: background .12s ease;
}
.btn svg { width: 15px; height: 15px; }
.btn-apply { background: var(--navy); color: #fff; }
.btn-apply:hover:not(:disabled) { background: var(--blue); }
.btn-apply:disabled { opacity: .5; cursor: not-allowed; }
.fp-error { color: var(--red-text); font-size: 12px; margin: 0; }

/* ── Results ────────────────────────────────────────────────────────── */
.results-section { margin: 16px 16px 0; }

.summary-strip {
  display: flex; align-items: center; justify-content: space-between;
  background: var(--surface); border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md); padding: 16px 20px; margin-bottom: 14px;
  flex-wrap: wrap; gap: 12px;
}
.ss-left { display: flex; align-items: baseline; gap: 8px; }
.ss-count { font-size: 26px; font-weight: 700; color: var(--text-1); }
.ss-label { font-size: 12.5px; color: var(--text-3); }
.ss-stats { display: flex; align-items: center; gap: 16px; }
.ss-stat { display: flex; flex-direction: column; gap: 2px; }
.ss-stat__label { font-size: 10.5px; color: var(--text-3); text-transform: uppercase; letter-spacing: .04em; }
.ss-stat__value { font-size: 16px; font-weight: 700; color: var(--text-1); }
.ss-stat__value--green { color: var(--green-text); }
.ss-stat__value--amber { color: var(--amber-text); }
.ss-divider { width: 1px; height: 26px; background: var(--border-lt); }

.state-block, .empty-block {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 10px; padding: 56px 20px; background: var(--surface);
  border-radius: var(--radius-xl); box-shadow: var(--shadow-md); color: var(--text-3);
}
.empty-block svg { width: 36px; height: 36px; color: var(--text-4); }
.empty-block p { margin: 0; font-size: 13px; }
.spinner-ring {
  width: 26px; height: 26px; border: 3px solid var(--border-lt);
  border-top-color: var(--blue); border-radius: 50%; animation: spin .8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Designer table ─────────────────────────────────────────────────── */
.table-wrap {
  background: var(--surface); border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md); overflow: hidden;
}
.designer-table { width: 100%; border-collapse: collapse; }
.designer-table thead th {
  text-align: left; font-size: 10.5px; font-weight: 700; text-transform: uppercase;
  letter-spacing: .04em; color: var(--text-3); padding: 11px 14px;
  background: var(--blue-lt); border-bottom: 1px solid var(--border-lt);
}
.th-num { text-align: right; }
.th-expand { width: 30px; }

.designer-row { cursor: pointer; transition: background .1s ease; }
.designer-row:hover { background: var(--blue-lt); }
.designer-row.row--expanded { background: var(--blue-lt); }
.designer-row td { padding: 12px 14px; border-bottom: 1px solid var(--border-lt); vertical-align: middle; }

.td-expand { width: 30px; }
.expand-icon { color: var(--text-3); font-size: 12px; }

.td-designer { display: flex; align-items: center; gap: 10px; }
.designer-avatar {
  width: 30px; height: 30px; border-radius: 50%; background: var(--navy); color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 700; flex-shrink: 0;
}
.designer-name { font-weight: 600; color: var(--text-1); font-size: 12.5px; }
.designer-email { font-size: 10.5px; color: var(--text-3); }

.td-num { text-align: right; }
.td-num--strong { font-weight: 700; color: var(--text-1); font-size: 14px; }

.count-chip {
  display: inline-block; font-family: "IBM Plex Mono", monospace; font-size: 11px; font-weight: 600;
  padding: 2px 8px; border-radius: 10px;
}
.count-chip--green  { background: var(--green-bg); color: var(--green-text); border: 1px solid var(--green-bd); }
.count-chip--amber  { background: var(--amber-bg); color: var(--amber-text); border: 1px solid var(--amber-bd); }
.count-chip--muted  { background: var(--border-lt); color: var(--text-4); }

.td-date { font-family: "IBM Plex Mono", monospace; font-size: 10.5px; color: var(--text-3); white-space: nowrap; }

/* ── Expanded detail ────────────────────────────────────────────────── */
.detail-row td { padding: 0; background: var(--page-bg); border-bottom: 2px solid var(--border); }
.detail-body { padding: 12px 18px 16px; }

.adverts-table { width: 100%; border-collapse: collapse; background: var(--surface); border-radius: var(--radius); overflow: hidden; }
.adverts-table th {
  text-align: left; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em;
  color: var(--text-3); padding: 8px 12px; border-bottom: 1px solid var(--border-lt);
}
.adverts-table td { padding: 9px 12px; border-bottom: 1px solid var(--border-lt); font-size: 12.5px; color: var(--text-2); }
.adverts-table tr:last-child td { border-bottom: none; }

.dr-mono { font-family: "IBM Plex Mono", monospace; font-size: 11px; }
.dr-bcref { color: var(--blue); }
.dr-date { color: var(--text-3); }

.pdf-link {
  color: var(--blue); text-decoration: none; font-size: 11.5px;
  padding: 2px 8px; background: var(--blue-lt); border-radius: 3px;
}
.pdf-link:hover { text-decoration: underline; }
.pdf-pending {
  font-family: "IBM Plex Mono", monospace; font-size: 10.5px; font-weight: 600;
  color: var(--amber-text); background: var(--amber-bg); border: 1px solid var(--amber-bd);
  padding: 2px 8px; border-radius: 3px;
}

/* ── Expand transition ──────────────────────────────────────────────── */
.expand-enter-active { animation: slide-down .18s ease-out; }
.expand-leave-active { animation: slide-down .14s reverse ease-in; }
@keyframes slide-down { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }

/* ── Responsive ─────────────────────────────────────────────────────── */
@media (max-width: 760px) {
  .fp-row { flex-direction: column; align-items: stretch; }
  .summary-strip { flex-direction: column; align-items: flex-start; }
  .adverts-table { font-size: 11px; }
}
</style>