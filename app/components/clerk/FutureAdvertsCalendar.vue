<!--
  FutureAdvertsCalendar.vue

  A button that opens a calendar of adverts scheduled to run in the future,
  independent of the main dashboard's date-range filters. Built for the
  case where the clerk doesn't know or care when an advert was *booked* -
  only that it's coming up - so opening it asks for nothing: no date range
  to fill in, just click and browse by publishing date.

  Self-contained: owns its fetch (via useFutureAdverts), its own icons,
  navigation, and styling - the host page only needs to drop in
  <FutureAdvertsCalendar />.
-->
<template>
  <div class="fac-root">
    <button class="fac-trigger" @click="open">
      <CalendarGlyph />
      <span>Run Calendar</span>
    </button>

    <div v-if="isOpen" class="fac-overlay" @click.self="close">
      <div class="fac-modal">
        <div class="fac-modal-head">
          <div class="fac-modal-title">
            <CalendarGlyph />
            <span>Run Calendar</span>
          </div>
          <button class="fac-close" @click="close" title="Close">
            <CloseGlyph />
          </button>
        </div>

        <div v-if="error" class="fac-error">{{ error }}</div>

        <div class="fac-filter-bar">
          <div class="fac-search">
            <SearchGlyph />
            <input
              v-model="searchQuery"
              type="text"
              class="fac-search-input"
              placeholder="Search reference, client, contact, phone, title, product…"
              :disabled="loading"
            >
            <button v-if="searchQuery" class="fac-search-clear" @click="searchQuery = ''" title="Clear search">
              <CloseGlyph />
            </button>
          </div>

          <div class="fac-filters">
            <select v-model="filterProduct" class="fac-filter-select" :disabled="loading">
              <option value="">All Products</option>
              <option v-for="p in productOptions" :key="p" :value="p">{{ p }}</option>
            </select>
            <select v-model="filterPaymentMethod" class="fac-filter-select" :disabled="loading">
              <option value="">All Payment Methods</option>
              <option v-for="m in paymentMethodOptions" :key="m" :value="m">{{ formatPaymentMethod(m) }}</option>
            </select>
            <select v-model="filterSalesAgent" class="fac-filter-select" :disabled="loading">
              <option value="">All Sales Agents</option>
              <option v-for="s in salesAgentOptions" :key="s" :value="s">{{ s }}</option>
            </select>
            <select v-model="filterCapturedBy" class="fac-filter-select" :disabled="loading">
              <option value="">All Captured By</option>
              <option v-for="c in capturedByOptions" :key="c" :value="c">{{ c }}</option>
            </select>
            <button v-if="hasActiveFilters" class="fac-filter-clear" @click="clearFilters">Clear filters</button>
          </div>
        </div>

        <div v-if="loading" class="fac-loading">Loading upcoming bookings…</div>

        <template v-else-if="isFiltering">
          <div class="fac-search-results">
            <div v-if="!searchResults.length" class="fac-empty">No upcoming adverts match these filters.</div>
            <ul v-else class="fac-detail-list">
              <li v-for="advert in searchResults" :key="advert.id" class="fac-detail-row">
                <div class="fac-detail-main">
                  <span class="fac-detail-ref">{{ advert.reference }}</span>
                  <span class="fac-detail-client">{{ advert.clientName }}</span>
                  <span class="fac-detail-advert-title">{{ advert.advertTitle }}</span>
                  <span class="fac-detail-date">{{ formatRunDate(nextRunDate(advert)) }}</span>
                </div>
                <div class="fac-detail-meta">
                  <span class="fac-status-badge" :class="`fac-status--${getStatusClass(advert.status)}`">
                    {{ getStatusLabel(advert.status) }}
                  </span>
                  <span class="fac-detail-value">{{ formatCurrency(advert.totalAmount) }}</span>
                  <button class="fac-view-btn" @click="selectedAdvert = advert">Details</button>
                </div>
              </li>
            </ul>
          </div>
        </template>

        <template v-else>
          <div class="fac-nav">
            <button class="fac-nav-btn" :disabled="!canGoPrev" @click="goToMonth(-1)">
              <ChevronGlyph direction="left" />
            </button>
            <div class="fac-nav-label">
              <span class="fac-month">{{ monthLabel }}</span>
              <button v-if="!isCurrentMonth" class="fac-today-btn" @click="goToToday">Today</button>
            </div>
            <button class="fac-nav-btn" :disabled="!canGoNext" @click="goToMonth(1)">
              <ChevronGlyph direction="right" />
            </button>
          </div>

          <div class="fac-grid">
            <div v-for="w in WEEKDAY_LABELS" :key="w" class="fac-weekday">{{ w }}</div>
            <div
              v-for="(cell, i) in calendarDays"
              :key="cell ? cell.key : `blank-${i}`"
              class="fac-day"
              :class="{
                'fac-day--blank': !cell,
                'fac-day--past': cell && cell.isPast,
                'fac-day--today': cell && cell.isToday,
                'fac-day--has-adverts': cell && cell.count > 0,
                'fac-day--selected': cell && cell.key === selectedDay,
              }"
              @click="cell && cell.count > 0 && selectDay(cell.key)"
            >
              <template v-if="cell">
                <span class="fac-day-num">{{ cell.day }}</span>
                <span v-if="cell.count" class="fac-day-badge">{{ cell.count }}</span>
              </template>
            </div>
          </div>

          <div v-if="selectedDaySummary" class="fac-detail">
            <div class="fac-detail-head">
              <span class="fac-detail-title">{{ selectedDayLabel }}</span>
              <span class="fac-detail-sub">
                {{ selectedDaySummary.count }} advert{{ selectedDaySummary.count !== 1 ? 's' : '' }}
                · {{ formatCurrency(selectedDaySummary.totalValue) }}
              </span>
            </div>
            <ul class="fac-detail-list">
              <li v-for="advert in selectedDaySummary.adverts" :key="advert.id" class="fac-detail-row">
                <div class="fac-detail-main">
                  <span class="fac-detail-ref">{{ advert.reference }}</span>
                  <span class="fac-detail-client">{{ advert.clientName }}</span>
                  <span class="fac-detail-advert-title">{{ advert.advertTitle }}</span>
                </div>
                <div class="fac-detail-meta">
                  <span class="fac-status-badge" :class="`fac-status--${getStatusClass(advert.status)}`">
                    {{ getStatusLabel(advert.status) }}
                  </span>
                  <span class="fac-detail-value">{{ formatCurrency(advert.totalAmount) }}</span>
                  <button class="fac-view-btn" @click="selectedAdvert = advert">Details</button>
                </div>
              </li>
            </ul>
          </div>
        </template>
      </div>
    </div>

    <AdvertLedgerDetail :advert="selectedAdvert" @close="selectedAdvert = null" />
  </div>
</template>

<script setup>
import { ref, computed, h } from 'vue'
import { useFutureAdverts } from '~/composables/useFutureAdverts'
import AdvertLedgerDetail from './AdvertLedgerDetail.vue'

const { loading, error, adverts, daySummary, fetchFutureAdverts, fetchedThroughMonths } = useFutureAdverts()

const isOpen = ref(false)
const hasFetched = ref(false)
const viewMonth = ref(startOfMonth(new Date()))
const selectedDay = ref(null)
const searchQuery = ref('')
const selectedAdvert = ref(null)
const filterProduct = ref('')
const filterPaymentMethod = ref('')
const filterSalesAgent = ref('')
const filterCapturedBy = ref('')

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

const toLocalISODate = (date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const open = async () => {
  isOpen.value = true
  if (!hasFetched.value) {
    hasFetched.value = true
    await fetchFutureAdverts()
  }
}
const close = () => {
  isOpen.value = false
  selectedDay.value = null
  selectedAdvert.value = null
  clearFilters()
}

const isCurrentMonth = computed(() => {
  const now = startOfMonth(new Date())
  return viewMonth.value.getFullYear() === now.getFullYear() && viewMonth.value.getMonth() === now.getMonth()
})
const canGoPrev = computed(() => !isCurrentMonth.value)
const canGoNext = computed(() => {
  const limit = startOfMonth(new Date())
  limit.setMonth(limit.getMonth() + fetchedThroughMonths.value)
  const next = startOfMonth(viewMonth.value)
  next.setMonth(next.getMonth() + 1)
  return next <= limit
})

const goToMonth = (delta) => {
  const next = startOfMonth(viewMonth.value)
  next.setMonth(next.getMonth() + delta)
  viewMonth.value = next
  selectedDay.value = null
}
const goToToday = () => {
  viewMonth.value = startOfMonth(new Date())
  selectedDay.value = null
}

const monthLabel = computed(() => viewMonth.value.toLocaleDateString('en-UG', { month: 'long', year: 'numeric' }))

const calendarDays = computed(() => {
  const year = viewMonth.value.getFullYear()
  const month = viewMonth.value.getMonth()
  const firstWeekday = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const todayKey = toLocalISODate(new Date())

  const cells = []
  for (let i = 0; i < firstWeekday; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d)
    const key = toLocalISODate(date)
    const summary = daySummary(key)
    cells.push({
      key,
      day: d,
      isToday: key === todayKey,
      isPast: key < todayKey,
      count: summary.count,
    })
  }
  return cells
})

const selectDay = (key) => {
  selectedDay.value = selectedDay.value === key ? null : key
}
const selectedDaySummary = computed(() => (selectedDay.value ? daySummary(selectedDay.value) : null))
const selectedDayLabel = computed(() => {
  if (!selectedDay.value) return ''
  return new Date(selectedDay.value).toLocaleDateString('en-UG', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })
})

// The nearest upcoming day an advert runs on, for sorting/labeling search
// results (which can span many months, unlike a single calendar day).
const nextRunDate = (advert) => {
  const todayKey = toLocalISODate(new Date())
  const days = (advert.publishingDates && advert.publishingDates.length)
    ? advert.publishingDates.map((d) => String(d).slice(0, 10))
    : [advert.startDate, advert.endDate].filter(Boolean).map((d) => String(d).slice(0, 10))
  const upcoming = days.filter((d) => d >= todayKey).sort()
  return upcoming[0] || days.sort()[0] || null
}
const formatRunDate = (dateKey) => {
  if (!dateKey) return '—'
  return new Date(dateKey).toLocaleDateString('en-UG', { month: 'short', day: 'numeric', year: 'numeric' })
}

// Phone numbers show up in every locally-conventional form - "0772123456",
// "+256772123456", "256772123456", with spaces or dashes - so comparisons
// strip everything but digits, then drop a leading country code or trunk
// "0" to get the same canonical local-subscriber-number suffix regardless
// of which form was typed or stored.
const normalizePhoneDigits = (value) => {
  let digits = String(value || '').replace(/\D/g, '')
  if (digits.startsWith('256')) digits = digits.slice(3)
  else if (digits.startsWith('0')) digits = digits.slice(1)
  return digits
}

const matchesQuery = (advert, rawQuery) => {
  const q = rawQuery.trim().toLowerCase()
  if (!q) return true

  const textFields = [
    advert.reference, advert.clientName, advert.client?.name,
    advert.contactPerson, advert.client?.contactPerson,
    advert.advertTitle, advert.product?.name,
  ]
  if (textFields.some((f) => (f || '').toLowerCase().includes(q))) return true

  const qDigits = normalizePhoneDigits(q)
  if (qDigits) {
    const phoneFields = [advert.contactNumber, advert.client?.phone].map(normalizePhoneDigits)
    if (phoneFields.some((p) => p && p.includes(qDigits))) return true
  }
  return false
}

const matchesFilters = (advert) => {
  if (filterProduct.value && advert.product?.name !== filterProduct.value) return false
  if (filterPaymentMethod.value && advert.paymentMethod !== filterPaymentMethod.value) return false
  if (filterSalesAgent.value && !(advert.salesAgents || []).some((a) => a.name === filterSalesAgent.value)) return false
  if (filterCapturedBy.value && advert.createdBy?.name !== filterCapturedBy.value) return false
  return true
}

const hasActiveFilters = computed(() =>
  !!(searchQuery.value.trim() || filterProduct.value || filterPaymentMethod.value || filterSalesAgent.value || filterCapturedBy.value)
)
const isFiltering = hasActiveFilters
const searchResults = computed(() => {
  if (!hasActiveFilters.value) return []
  return adverts.value
    .filter((a) => matchesQuery(a, searchQuery.value) && matchesFilters(a))
    .sort((a, b) => (nextRunDate(a) || '').localeCompare(nextRunDate(b) || ''))
})
const clearFilters = () => {
  searchQuery.value = ''
  filterProduct.value = ''
  filterPaymentMethod.value = ''
  filterSalesAgent.value = ''
  filterCapturedBy.value = ''
}

// Filter dropdown option lists, derived from whatever's already fetched -
// no separate lookup call needed.
const uniqueSorted = (values) => [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b))
const productOptions = computed(() => uniqueSorted(adverts.value.map((a) => a.product?.name)))
const paymentMethodOptions = computed(() => uniqueSorted(adverts.value.map((a) => a.paymentMethod)))
const salesAgentOptions = computed(() => uniqueSorted(adverts.value.flatMap((a) => (a.salesAgents || []).map((s) => s.name))))
const capturedByOptions = computed(() => uniqueSorted(adverts.value.map((a) => a.createdBy?.name)))

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount || 0)

const formatPaymentMethod = (method) => method ? method.replace(/_/g, ' ') : ''

const STATUS_LABELS = {
  draft: 'Draft', pending_review: 'Pending Review', editor_approved: 'Editor Approved',
  manager_approved: 'Manager Approved', editor_rejected: 'Editor Rejected',
  manager_rejected: 'Manager Rejected', published: 'Published',
}
const STATUS_CLASSES = {
  draft: 'draft', pending_review: 'pending', editor_approved: 'approved',
  manager_approved: 'approved', editor_rejected: 'rejected', manager_rejected: 'rejected', published: 'published',
}
const getStatusLabel = (status) => STATUS_LABELS[status] || status
const getStatusClass = (status) => STATUS_CLASSES[status] || 'default'

// Local, dependency-free icons.
const svgIcon = (children) =>
  h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, children)
const CalendarGlyph = () => svgIcon([
  h('rect', { x: 3, y: 4, width: 18, height: 18, rx: 2, ry: 2 }),
  h('line', { x1: 16, y1: 2, x2: 16, y2: 6 }),
  h('line', { x1: 8, y1: 2, x2: 8, y2: 6 }),
  h('line', { x1: 3, y1: 10, x2: 21, y2: 10 }),
])
const CloseGlyph = () => svgIcon([h('line', { x1: 18, y1: 6, x2: 6, y2: 18 }), h('line', { x1: 6, y1: 6, x2: 18, y2: 18 })])
const SearchGlyph = () => svgIcon([h('circle', { cx: 11, cy: 11, r: 7 }), h('line', { x1: 21, y1: 21, x2: 16.65, y2: 16.65 })])
const ChevronGlyph = (props) => svgIcon([
  h('polyline', { points: props.direction === 'left' ? '15 18 9 12 15 6' : '9 18 15 12 9 6' }),
])
</script>

<style scoped>
.fac-root { display: inline-block; }

.fac-trigger {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.5rem 0.875rem; border-radius: var(--radius, 8px);
  border: 1px solid var(--border, #e5e7eb); background: var(--surface, #fff);
  color: var(--ink, #111827); font-size: 0.8125rem; font-weight: 600;
  cursor: pointer; transition: background var(--t, 150ms ease);
}
.fac-trigger:hover { background: var(--hover-bg, #eff6ff); }
.fac-trigger svg { width: 16px; height: 16px; }

.fac-overlay {
  position: fixed; inset: 0; background: rgba(15, 23, 42, 0.45);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000; padding: 1rem;
}
.fac-modal {
  background: var(--surface, #fff); border-radius: var(--radius, 8px);
  width: 100%; max-width: 720px; max-height: 90vh; overflow-y: auto;
  box-shadow: var(--shadow-md, 0 4px 16px rgba(0,0,0,.08));
  display: flex; flex-direction: column;
}
.fac-modal-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 1rem 1.25rem; border-bottom: 1px solid var(--border, #e5e7eb);
}
.fac-modal-title { display: flex; align-items: center; gap: 0.5rem; font-weight: 700; color: var(--ink, #111827); }
.fac-modal-title svg { width: 18px; height: 18px; color: var(--blue, #2563eb); }
.fac-close { background: none; border: none; cursor: pointer; color: var(--muted, #6b7280); padding: 0.25rem; }
.fac-close svg { width: 18px; height: 18px; }

.fac-error {
  margin: 0.75rem 1.25rem 0; padding: 0.625rem 0.875rem; border-radius: var(--radius, 8px);
  background: #fee2e2; color: #991b1b; font-size: 0.8125rem;
}

.fac-filter-bar {
  margin: 0.875rem 1.25rem 0; padding: 0.875rem;
  border-radius: 10px; background: var(--page-bg, #f0f4f8);
  border: 1px solid var(--border, #e5e7eb);
  display: flex; flex-direction: column; gap: 0.625rem;
}

.fac-search {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0 0.75rem; height: 2.5rem;
  background: var(--surface, #fff);
  border: 1.5px solid var(--blue, #2563eb);
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(37, 99, 235, 0.12);
}
.fac-search svg { width: 16px; height: 16px; color: var(--blue, #2563eb); flex-shrink: 0; }
.fac-search-input {
  border: none; outline: none; flex: 1; font-size: 0.875rem; color: var(--ink, #111827);
  background: transparent; font-family: inherit;
}
.fac-search-clear { background: none; border: none; cursor: pointer; color: var(--faint, #9ca3af); padding: 0.125rem; flex-shrink: 0; }
.fac-search-clear svg { width: 14px; height: 14px; }
.fac-search-clear:hover { color: var(--red, #dc2626); }

.fac-filters { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem; }
.fac-filter-select {
  font-size: 0.75rem; font-weight: 600; color: var(--ink, #111827);
  background: var(--surface, #fff); border: 1px solid var(--border, #e5e7eb);
  border-radius: 999px; padding: 0.375rem 1.75rem 0.375rem 0.75rem; cursor: pointer;
  max-width: 170px; text-overflow: ellipsis;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
  background-repeat: no-repeat; background-position: right 0.5rem center; background-size: 12px;
}
.fac-filter-select:hover { border-color: var(--blue, #2563eb); }
.fac-filter-select:disabled { opacity: 0.6; cursor: not-allowed; }
.fac-filter-clear {
  font-size: 0.75rem; font-weight: 600; color: var(--blue, #2563eb);
  background: var(--blue-lt, #eff6ff); border: none; border-radius: 999px;
  padding: 0.375rem 0.75rem; cursor: pointer;
}
.fac-filter-clear:hover { background: #dbeafe; }

.fac-search-results { padding: 0.875rem 1.25rem 1.25rem; }
.fac-empty { padding: 1.5rem 0; text-align: center; color: var(--faint, #9ca3af); font-size: 0.8125rem; }
.fac-detail-date { font-size: 0.6875rem; color: var(--blue, #2563eb); font-weight: 600; font-family: var(--font-mono, monospace); }

.fac-nav {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0.875rem 1.25rem;
}
.fac-nav-btn {
  width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;
  border-radius: 6px; border: 1px solid var(--border, #e5e7eb); background: var(--surface, #fff);
  cursor: pointer; color: var(--ink, #111827);
}
.fac-nav-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.fac-nav-btn svg { width: 14px; height: 14px; }
.fac-nav-label { display: flex; align-items: center; gap: 0.625rem; }
.fac-month { font-weight: 700; color: var(--ink, #111827); font-size: 0.9375rem; }
.fac-today-btn {
  font-size: 0.6875rem; font-weight: 600; color: var(--blue, #2563eb);
  background: var(--blue-lt, #eff6ff); border: none; border-radius: 999px;
  padding: 0.125rem 0.5rem; cursor: pointer;
}

.fac-loading { padding: 2rem; text-align: center; color: var(--muted, #6b7280); font-size: 0.8125rem; }

.fac-grid {
  display: grid; grid-template-columns: repeat(7, 1fr);
  gap: 2px; padding: 0 1.25rem 1rem;
}
.fac-weekday {
  text-align: center; font-size: 0.6875rem; font-weight: 700; color: var(--faint, #9ca3af);
  padding-bottom: 0.375rem; text-transform: uppercase;
}
.fac-day {
  position: relative; aspect-ratio: 1; border-radius: 6px;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  font-size: 0.75rem; color: var(--ink, #111827);
}
.fac-day--blank { visibility: hidden; }
.fac-day--past { color: var(--faint, #9ca3af); }
.fac-day--today { border: 1.5px solid var(--blue, #2563eb); font-weight: 700; }
.fac-day--has-adverts { background: var(--blue-lt, #eff6ff); cursor: pointer; font-weight: 600; }
.fac-day--has-adverts:hover { background: #dbeafe; }
.fac-day--selected { background: var(--blue, #2563eb); color: #fff; }
.fac-day--selected .fac-day-badge { background: #fff; color: var(--blue, #2563eb); }
.fac-day-num { line-height: 1; }
.fac-day-badge {
  position: absolute; bottom: 3px; font-size: 0.5625rem; font-weight: 700;
  background: var(--blue, #2563eb); color: #fff; border-radius: 999px;
  min-width: 14px; padding: 0 3px; line-height: 14px; text-align: center;
}

.fac-detail { border-top: 1px solid var(--border, #e5e7eb); padding: 1rem 1.25rem 1.25rem; }
.fac-detail-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 0.625rem; }
.fac-detail-title { font-weight: 700; color: var(--ink, #111827); font-size: 0.875rem; }
.fac-detail-sub { font-size: 0.75rem; color: var(--muted, #6b7280); }
.fac-detail-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.5rem; }
.fac-detail-row {
  display: flex; align-items: center; justify-content: space-between; gap: 0.75rem;
  padding: 0.625rem 0.75rem; border-radius: 6px; background: var(--page-bg, #f0f4f8);
}
.fac-detail-main { display: flex; flex-direction: column; gap: 0.125rem; min-width: 0; }
.fac-detail-ref { font-size: 0.6875rem; font-weight: 700; color: var(--muted, #6b7280); font-family: var(--font-mono, monospace); }
.fac-detail-client { font-size: 0.8125rem; font-weight: 600; color: var(--ink, #111827); }
.fac-detail-advert-title { font-size: 0.75rem; color: var(--muted, #6b7280); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.fac-detail-meta { display: flex; align-items: center; gap: 0.625rem; flex-shrink: 0; }
.fac-detail-value { font-size: 0.8125rem; font-weight: 700; font-family: var(--font-mono, monospace); color: var(--ink, #111827); }
.fac-view-btn {
  font-size: 0.75rem; font-weight: 600; color: #fff; background: var(--blue, #2563eb);
  border: none; border-radius: 6px; padding: 0.3rem 0.625rem; cursor: pointer;
}

.fac-status-badge { font-size: 0.6875rem; font-weight: 700; padding: 0.125rem 0.5rem; border-radius: 999px; white-space: nowrap; }
.fac-status--draft     { background: #fef3c7; color: #92400e; }
.fac-status--pending    { background: #dbeafe; color: #1e40af; }
.fac-status--approved   { background: #dcfce7; color: #166534; }
.fac-status--rejected   { background: #fee2e2; color: #991b1b; }
.fac-status--published  { background: #e0e7ff; color: #3730a3; }
.fac-status--default    { background: #f3f4f6; color: #374151; }

@media (max-width: 480px) {
  .fac-detail-row { flex-direction: column; align-items: flex-start; }
  .fac-filter-select { max-width: none; flex: 1 1 auto; }
}
</style>