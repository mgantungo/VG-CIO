<!-- components/reports/PrintClassReport.vue -->
<!-- Display vs Classified — separate totals for the two kinds of print advert -->
<template>
  <div class="pr">
    <section class="pr-card pr-toolbar">
      <div class="pr-field">
        <label class="pr-lbl" for="pr-from">From</label>
        <input id="pr-from" v-model="filters.startDate" type="date" class="pr-input">
      </div>
      <div class="pr-field">
        <label class="pr-lbl" for="pr-to">To</label>
        <input id="pr-to" v-model="filters.endDate" type="date" class="pr-input" :min="filters.startDate">
      </div>
      <div class="pr-field">
        <span class="pr-lbl">Count by</span>
        <div class="pr-seg" role="group" aria-label="Date basis">
          <button type="button" :class="{ on: filters.basis === 'booked' }" @click="filters.basis = 'booked'">Booked date</button>
          <button type="button" :class="{ on: filters.basis === 'run' }" @click="filters.basis = 'run'">Run date</button>
        </div>
      </div>
      <div class="pr-field">
        <label class="pr-lbl" for="pr-product">Product</label>
        <select id="pr-product" v-model="filters.productId" class="pr-input">
          <option value="">All print products</option>
          <option v-for="p in products" :key="p.id" :value="String(p.id)">{{ p.name }}</option>
        </select>
      </div>
      <div class="pr-field">
        <label class="pr-lbl" for="pr-method">Payment method</label>
        <select id="pr-method" v-model="filters.paymentMethod" class="pr-input">
          <option value="">All methods</option>
          <option v-for="(label, key) in METHOD_OPTIONS" :key="key" :value="key">{{ label }}</option>
        </select>
      </div>
      <div class="pr-quick">
        <button class="pr-btn" type="button" @click="quick('month')">This month</button>
        <button class="pr-btn" type="button" @click="quick('last')">Last month</button>
      </div>
      <button class="pr-btn pr-btn--pri" type="button" :disabled="report.loading.value || invalid" @click="run">{{ report.loading.value ? 'Loading…' : 'Run report' }}</button>
      <button class="pr-btn" type="button" :disabled="!summary || exporting" @click="exportXlsx">{{ exporting ? 'Exporting…' : 'Export Excel' }}</button>
    </section>

    <p v-if="error" class="pr-err" role="alert">{{ error }}</p>
    <p v-if="basisNote" class="pr-note">{{ basisNote }}</p>

    <template v-if="summary">
      <div class="pr-kpis">
        <button
          v-for="c in KPI_CLASSES"
          :key="c.key"
          type="button"
          class="pr-kpi"
          :class="[`pr-kpi--${c.key}`, { 'pr-kpi--on': drill === c.key }]"
          :aria-pressed="drill === c.key"
          @click="openDrill(c.key)"
        >
          <span class="pr-kpi__l">{{ c.label }}</span>
          <span class="pr-kpi__v">UGX {{ formatUgx(summary.classes[c.key]?.amount, { compact: true }) }}</span>
          <span class="pr-kpi__row">
            <span>Bookings <b>{{ summary.classes[c.key]?.bookings || 0 }}</b></span>
            <span>Runs <b>{{ summary.classes[c.key]?.runs || 0 }}</b></span>
            <span v-if="c.key === 'display'">Col-cm <b>{{ formatUgx(summary.classes.display?.columnCm) }}</b></span>
            <span v-if="c.key === 'classified'">Words <b>{{ formatUgx(summary.classes.classified?.words) }}</b></span>
            <span>Share <b>{{ summary.classes[c.key]?.sharePct || 0 }}%</b></span>
          </span>
          <span class="pr-kpi__hint">{{ drill === c.key ? 'Showing adverts below' : 'Show adverts' }}</span>
        </button>
      </div>

      <p v-if="summary.classes.unclassified?.bookings" class="pr-note">
        {{ summary.classes.unclassified.bookings }} print booking{{ summary.classes.unclassified.bookings === 1 ? '' : 's' }}
        (UGX {{ formatUgx(summary.classes.unclassified.amount) }}) have no type yet — run the class backfill or correct them in Field Correction.
        <button class="pr-link" type="button" @click="openDrill('unclassified')">Show them</button>
      </p>

      <section class="pr-card">
        <header class="pr-card__hd"><h2 class="pr-card__t">By product</h2><span class="pr-muted">Total UGX {{ formatUgx(summary.totals.amount) }} · {{ summary.totals.bookings }} bookings</span></header>
        <div class="pr-table-wrap">
          <table class="pr-table">
            <thead>
              <tr><th>Product</th><th class="pr-r">Display bookings</th><th class="pr-r">Display UGX</th><th class="pr-r">Classified bookings</th><th class="pr-r">Classified UGX</th><th>Split</th><th class="pr-r">Total UGX</th></tr>
            </thead>
            <tbody>
              <tr v-for="p in summary.byProduct" :key="p.productId || p.productName">
                <td class="pr-strong">{{ p.productName }}</td>
                <td class="pr-r pr-mono">{{ p.display.bookings }}</td>
                <td class="pr-r pr-mono">{{ formatUgx(p.display.amount) }}</td>
                <td class="pr-r pr-mono">{{ p.classified.bookings }}</td>
                <td class="pr-r pr-mono">{{ formatUgx(p.classified.amount) }}</td>
                <td><span class="pr-split" role="img" :aria-label="`${pct(p.display.amount, p.total)}% display`"><span class="pr-split__d" :style="{ width: pct(p.display.amount, p.total) + '%' }"></span><span class="pr-split__c" :style="{ width: pct(p.classified.amount, p.total) + '%' }"></span></span></td>
                <td class="pr-r pr-mono pr-strong">{{ formatUgx(p.total) }}</td>
              </tr>
              <tr v-if="summary.byProduct.length === 0"><td colspan="7" class="pr-empty">No print adverts in this range.</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="pr-card">
        <header class="pr-card__hd"><h2 class="pr-card__t">By payment method</h2></header>
        <div class="pr-table-wrap">
          <table class="pr-table">
            <thead><tr><th>Method</th><th class="pr-r">Display UGX</th><th class="pr-r">Classified UGX</th><th class="pr-r">Total UGX</th></tr></thead>
            <tbody>
              <tr v-for="m in summary.byPaymentMethod" :key="m.paymentMethod">
                <td>{{ PAYMENT_METHOD_LABELS[m.paymentMethod] || m.paymentMethod }}</td>
                <td class="pr-r pr-mono">{{ formatUgx(m.display.amount) }}</td>
                <td class="pr-r pr-mono">{{ formatUgx(m.classified.amount) }}</td>
                <td class="pr-r pr-mono pr-strong">{{ formatUgx(m.total) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section v-if="drill" class="pr-card">
        <header class="pr-card__hd">
          <h2 class="pr-card__t">{{ PRINT_CLASS_LABELS[drill] }} adverts · {{ drillRows.length }}</h2>
          <button class="pr-btn" type="button" @click="drill = ''">Close</button>
        </header>
        <div class="pr-table-wrap">
          <table class="pr-table">
            <thead><tr><th>Reference</th><th>Client · advert</th><th>Product</th><th>Size / words</th><th>Run dates</th><th>Method</th><th class="pr-r">Counted UGX</th></tr></thead>
            <tbody>
              <tr v-for="r in drillRows" :key="r.id">
                <td class="pr-mono">{{ r.reference }}<div class="pr-muted">{{ r.bcReference }}</div></td>
                <td><div class="pr-strong">{{ r.clientName }}</div><div class="pr-muted">{{ r.advertTitle }}</div></td>
                <td>{{ r.productName }}</td>
                <td class="pr-mono">{{ r.printAdClass === 'classified' ? (r.words ? `${r.words} words` : '—') : (r.adSize || '—') }}</td>
                <td class="pr-mono">{{ (r.publishingDates || []).slice(0, 3).join(', ') }}<template v-if="(r.publishingDates || []).length > 3"> +{{ r.publishingDates.length - 3 }}</template></td>
                <td>{{ PAYMENT_METHOD_LABELS[r.paymentMethod] || r.paymentMethod }}</td>
                <td class="pr-r pr-mono">{{ formatUgx(r.amount) }}</td>
              </tr>
              <tr v-if="drillLoading"><td colspan="7" class="pr-empty">Loading…</td></tr>
              <tr v-else-if="drillRows.length === 0"><td colspan="7" class="pr-empty">None.</td></tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>

    <div v-else-if="!report.loading.value" class="pr-card pr-empty pr-empty--box">Choose a range and run the report.</div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { usePrintClassReport } from '~/composables/usePrintClassReport'
import { useDesignHouse } from '~/composables/useDesignHouse'
import { useWorkspace } from '~/composables/useWorkspace'
import { isoToday, formatUgx, apiErrorMessage, PAYMENT_METHOD_LABELS, PRINT_CLASS_LABELS } from '~/utils/vgamsSession'

const report = usePrintClassReport()
const designHouse = useDesignHouse()
const ws = useWorkspace()

const KPI_CLASSES = [
  { key: 'display', label: 'Display ads' },
  { key: 'classified', label: 'Classifieds' },
]
const METHOD_OPTIONS = { credit: 'Credit', bank_transfer: 'Bank transfer', cash: 'Cash', mobile_money: 'Mobile money', pdc: 'PDC' }

const monthStart = (d) => `${d.slice(0, 8)}01`
const filters = reactive({
  startDate: monthStart(isoToday()),
  endDate: isoToday(),
  basis: 'booked',
  productId: '',
  paymentMethod: '',
})

const products = ref([])
const summary = ref(null)
const error = ref('')
const drill = ref('')
const drillRows = ref([])
const drillLoading = ref(false)
const exporting = ref(false)

const invalid = computed(() => !filters.startDate || !filters.endDate || filters.startDate > filters.endDate)
const basisNote = computed(() => (summary.value && summary.value.filters?.basis === 'run'
  ? 'Counted by run date: a multi-day booking’s amount is split evenly across its run dates, and only the dates inside the range count.'
  : ''))

const payload = () => ({
  startDate: filters.startDate,
  endDate: filters.endDate,
  basis: filters.basis,
  ...(filters.productId ? { productId: Number(filters.productId) } : {}),
  ...(filters.paymentMethod ? { paymentMethod: filters.paymentMethod } : {}),
})

const pct = (part, total) => (Number(total) > 0 ? Math.round((Number(part) / Number(total)) * 100) : 0)

function quick(which) {
  const today = isoToday()
  if (which === 'month') {
    filters.startDate = monthStart(today)
    filters.endDate = today
  } else {
    const d = new Date(`${monthStart(today)}T12:00:00`)
    d.setDate(0) // last day of previous month
    const last = d.toISOString().slice(0, 10)
    filters.startDate = monthStart(last)
    filters.endDate = last
  }
  run()
}

async function run() {
  if (invalid.value) return
  error.value = ''
  drill.value = ''
  try {
    summary.value = await report.fetchSummary(payload())
    ws.setHeader({ eyebrow: 'Reports · Print', title: `Display vs Classified · ${filters.startDate} to ${filters.endDate}` })
  } catch (e) {
    summary.value = null
    error.value = apiErrorMessage(e, 'Could not run the report')
  }
}

async function openDrill(cls) {
  if (drill.value === cls) { drill.value = ''; return }
  drill.value = cls
  drillLoading.value = true
  drillRows.value = []
  try {
    const res = await report.fetchList({ ...payload(), printAdClass: cls })
    drillRows.value = res?.data || []
  } catch (e) {
    error.value = apiErrorMessage(e, 'Could not load the adverts')
  } finally {
    drillLoading.value = false
  }
}

async function exportXlsx() {
  if (!summary.value) return
  exporting.value = true
  try {
    const res = await report.fetchList(payload())
    await report.exportXlsx(summary.value, res?.data || [], payload())
  } catch (e) {
    error.value = apiErrorMessage(e, 'Export failed')
  } finally {
    exporting.value = false
  }
}

onMounted(async () => {
  try {
    const res = await designHouse.fetchProducts('print')
    products.value = res?.products || []
  } catch {
    products.value = []
  }
  run()
})
</script>

<style scoped>
.pr {
  --nv: #003366; --pu: #4B2A7A; --bd: #D1D9E0; --bdl: #E8ECF0;
  --t1: #0F172A; --t2: #334155; --t3: #475569; --t4: #64748B;
  font-family: 'IBM Plex Sans', 'Segoe UI', sans-serif; font-size: 13px; color: var(--t1);
  display: flex; flex-direction: column; gap: 14px;
}
.pr-card { background: #fff; border: 1px solid var(--bd); border-radius: 2px; }
.pr-card__hd { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; padding: 12px 16px; border-bottom: 1px solid var(--bdl); }
.pr-card__t { margin: 0; font-size: 13px; font-weight: 700; color: var(--nv); }

.pr-toolbar { display: flex; flex-wrap: wrap; gap: 14px; align-items: flex-end; padding: 14px 16px; }
.pr-field { display: flex; flex-direction: column; gap: 5px; }
.pr-lbl { font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: var(--t3); }
.pr-input { min-height: 36px; border: 1px solid var(--bd); border-radius: 2px; padding: 6px 10px; font: inherit; color: var(--t1); background: #fff; }
.pr-seg { display: inline-flex; border: 1px solid var(--bd); border-radius: 2px; overflow: hidden; }
.pr-seg button { min-height: 34px; padding: 0 12px; border: none; border-right: 1px solid var(--bd); background: #fff; color: var(--t2); font: inherit; font-size: 12px; font-weight: 600; cursor: pointer; }
.pr-seg button:last-child { border-right: none; }
.pr-seg button.on { background: var(--nv); color: #fff; }
.pr-quick { display: flex; gap: 6px; }

.pr-btn { min-height: 36px; padding: 0 14px; border: 1px solid var(--bd); background: #fff; color: var(--nv); border-radius: 2px; font: inherit; font-size: 12px; font-weight: 600; cursor: pointer; white-space: nowrap; }
.pr-btn:hover:not(:disabled) { background: #F5F9FD; }
.pr-btn:disabled { opacity: .5; cursor: not-allowed; }
.pr-btn--pri { background: var(--nv); border-color: var(--nv); color: #fff; }
.pr-btn--pri:hover:not(:disabled) { background: #002244; }
.pr-input:focus-visible, .pr-btn:focus-visible, .pr-kpi:focus-visible { outline: 2px solid #9DC3E6; outline-offset: 1px; }

.pr-kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; }
.pr-kpi { text-align: left; font: inherit; cursor: pointer; background: #fff; border: 1px solid var(--bd); border-top: 3px solid var(--nv); border-radius: 2px; padding: 16px 18px; display: flex; flex-direction: column; gap: 6px; }
.pr-kpi--classified { border-top-color: #6B46A6; }
.pr-kpi--on { box-shadow: inset 0 0 0 1px var(--nv); }
.pr-kpi--classified.pr-kpi--on { box-shadow: inset 0 0 0 1px #6B46A6; }
.pr-kpi__l { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .07em; color: var(--nv); }
.pr-kpi--classified .pr-kpi__l, .pr-kpi--classified .pr-kpi__v { color: var(--pu); }
.pr-kpi__v { font-family: 'IBM Plex Mono', monospace; font-size: 26px; font-weight: 600; color: var(--nv); }
.pr-kpi__row { display: flex; flex-wrap: wrap; gap: 16px; font-size: 12px; color: var(--t3); }
.pr-kpi__row b { font-family: 'IBM Plex Mono', monospace; color: var(--t1); font-weight: 600; }
.pr-kpi__hint { font-size: 11px; color: var(--t4); text-decoration: underline; }

.pr-table-wrap { overflow-x: auto; }
.pr-table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
.pr-table th { text-align: left; font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: var(--t3); background: #F8FAFC; padding: 9px 12px; border-bottom: 1px solid #E2E8F0; white-space: nowrap; }
.pr-table td { padding: 10px 12px; border-bottom: 1px solid #EEF2F6; vertical-align: middle; }
.pr-r { text-align: right; }
.pr-strong { font-weight: 600; }
.pr-mono { font-family: 'IBM Plex Mono', monospace; font-size: 12px; white-space: nowrap; }
.pr-muted { color: var(--t4); font-size: 11.5px; }
.pr-empty { padding: 28px 16px; text-align: center; color: var(--t4); }
.pr-empty--box { border-style: dashed; border-color: #9DC3E6; }
.pr-split { display: flex; width: 140px; height: 8px; background: #EEF2F6; border-radius: 1px; overflow: hidden; }
.pr-split__d { background: var(--nv); }
.pr-split__c { background: #A98BD3; }

.pr-err { margin: 0; padding: 10px 14px; background: #FDECEC; border: 1px solid #F0A3A5; border-radius: 2px; color: #8A1014; font-weight: 600; }
.pr-note { margin: 0; padding: 10px 14px; background: #F5F9FD; border: 1px solid #DEEAF1; border-radius: 2px; color: var(--t2); font-size: 12.5px; }
.pr-link { border: none; background: none; color: var(--nv); font: inherit; font-weight: 600; text-decoration: underline; cursor: pointer; padding: 0 0 0 4px; }
</style>
