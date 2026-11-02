<!-- components/invoicing/InvoicingWorkspace.vue -->
<!--
  Invoicing Officer — step 5 of the print workflow.

  mode="queue"    : Ready to confirm → Ready to invoice (+ Held back for info)
  mode="register" : Invoiced bookings, for reconciliation with Finance

  A booking is ready once Copy Desk has confirmed the layout it sits on and
  Design House has attached artwork for that run date. Credit, Bank
  transfer, Cash and Mobile money are kept apart (tiles + filter) and
  totalled together in "All methods".
-->
<template>
  <div class="iv">

    <!-- Filters -->
    <section class="iv-card iv-toolbar">
      <div class="iv-field">
        <label class="iv-lbl" for="iv-from">Run dates from</label>
        <input id="iv-from" v-model="startDate" type="date" class="iv-input" @change="load">
      </div>
      <div class="iv-field">
        <label class="iv-lbl" for="iv-to">To</label>
        <input id="iv-to" v-model="endDate" type="date" class="iv-input" :min="startDate" @change="load">
      </div>
      <div class="iv-field">
        <span class="iv-lbl">Quick range</span>
        <div class="iv-seg" role="group" aria-label="Quick range">
          <button type="button" @click="setRange(0)">Today</button>
          <button type="button" @click="setRange(6)">7 days</button>
          <button type="button" @click="setRange(29)">30 days</button>
        </div>
      </div>
      <div class="iv-field iv-field--grow">
        <label class="iv-lbl" for="iv-search">Search</label>
        <input id="iv-search" v-model="search" type="search" class="iv-input" placeholder="Client, advert, BC order…">
      </div>
      <button class="iv-btn" type="button" :disabled="inv.loading.value" @click="load">{{ inv.loading.value ? 'Loading…' : 'Refresh' }}</button>
      <button class="iv-btn" type="button" :disabled="visibleRows.length === 0" @click="exportXlsx">Export Excel</button>
    </section>

    <!-- Totals by method (kept apart, merged in "All") -->
    <div class="iv-tiles" role="group" aria-label="Totals by payment method">
      <button
        v-for="t in tiles"
        :key="t.key"
        type="button"
        class="iv-tile"
        :class="{ 'iv-tile--on': methodFilter === t.key, 'iv-tile--all': t.key === '' }"
        :aria-pressed="methodFilter === t.key"
        @click="methodFilter = t.key"
      >
        <span class="iv-tile__l">{{ t.label }}</span>
        <span class="iv-tile__v">{{ formatUgx(t.amount, { compact: true }) }}</span>
        <span class="iv-tile__s">{{ t.count }} booking{{ t.count === 1 ? '' : 's' }} · UGX {{ formatUgx(t.amount) }}</span>
      </button>
    </div>

    <!-- Stage tabs (queue mode) -->
    <div v-if="mode === 'queue'" class="iv-tabs" role="tablist" aria-label="Invoicing stage">
      <button
        v-for="s in QUEUE_STAGES"
        :key="s.key"
        role="tab"
        type="button"
        class="iv-tab"
        :class="{ 'iv-tab--on': stage === s.key }"
        :aria-selected="stage === s.key"
        @click="setStage(s.key)"
      >
        {{ s.label }} <b>{{ stageCounts[s.key]?.count ?? 0 }}</b>
      </button>
    </div>

    <div v-if="message.text" class="iv-msg" :class="`iv-msg--${message.kind}`" role="status">
      {{ message.text }}
      <button class="iv-msg__x" type="button" aria-label="Dismiss" @click="message.text = ''">×</button>
    </div>

    <p v-if="stage === 'held'" class="iv-note">
      Held back: on a confirmed layout but artwork is missing or was dropped for that run date. They move to “Ready to confirm” once Design House attaches artwork.
    </p>

    <!-- Table -->
    <section class="iv-card">
      <header class="iv-card__hd">
        <h2 class="iv-card__t">{{ tableTitle }}</h2>
        <div v-if="canAct" class="iv-bulk">
          <span class="iv-bulk__sum"><b>{{ selectedIds.length }} selected</b> · UGX {{ formatUgx(selectedAmount) }}</span>
          <button
            v-if="stage === 'ready'"
            class="iv-btn"
            type="button"
            :disabled="selectedIds.length === 0 || busy"
            @click="runBulk('confirm')"
          >Confirm {{ selectedIds.length || '' }}</button>
          <button
            class="iv-btn iv-btn--red"
            type="button"
            :disabled="selectedIds.length === 0 || busy"
            @click="runBulk(stage === 'ready' ? 'confirm_and_invoice' : 'invoice')"
          >{{ stage === 'ready' ? 'Confirm & invoice' : 'Invoice' }} {{ selectedIds.length || '' }}</button>
        </div>
      </header>

      <div class="iv-table-wrap">
        <table class="iv-table">
          <thead>
            <tr>
              <th v-if="canAct" class="iv-col-check">
                <input type="checkbox" aria-label="Select all shown" :checked="allSelected" :disabled="visibleRows.length === 0" @change="toggleAll($event.target.checked)">
              </th>
              <th>Artwork</th>
              <th>Client · advert</th>
              <th>Type</th>
              <th>Run · page</th>
              <th>Method</th>
              <th>BC order</th>
              <th class="iv-r">Amount (UGX)</th>
              <th>{{ mode === 'register' ? 'Invoiced' : 'Action' }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in visibleRows" :key="r.id" :class="{ 'iv-row--sel': selected.has(r.id) }">
              <td v-if="canAct" class="iv-col-check">
                <input type="checkbox" :aria-label="`Select ${r.clientName}`" :checked="selected.has(r.id)" @change="toggleOne(r.id, $event.target.checked)">
              </td>
              <td>
                <a v-if="r.artworkPreview?.url" :href="mediaUrl(r.artworkPreview.url)" target="_blank" rel="noopener" class="iv-thumb" :title="r.artworkPreview.name">
                  <img v-if="isImage(r.artworkPreview)" :src="mediaUrl(r.artworkPreview.url)" :alt="`Artwork for ${r.advertTitle}`">
                  <span v-else class="iv-thumb__ext">{{ fileExt(r.artworkPreview.name) }}</span>
                </a>
                <span v-else class="iv-thumb iv-thumb--none" aria-label="No artwork">—</span>
              </td>
              <td>
                <div class="iv-strong">{{ r.clientName }}</div>
                <div class="iv-sub">{{ r.advertTitle }} · {{ r.productName }}</div>
              </td>
              <td>
                <span v-if="r.printAdClass" class="iv-type" :class="`iv-type--${r.printAdClass}`">{{ r.printAdClass === 'classified' ? 'Classified' : 'Display' }}</span>
                <span v-else class="iv-muted">—</span>
              </td>
              <td class="iv-mono">
                <div v-for="d in runSummary(r)" :key="d.date">{{ formatRunDate(d.date) }}<template v-if="d.pageNumber"> · P{{ d.pageNumber }}</template></div>
              </td>
              <td><span class="iv-chip" :class="methodClass(r.paymentMethod)">{{ PAYMENT_METHOD_LABELS[r.paymentMethod] || r.paymentMethod }}</span><div v-if="!r.isPaid" class="iv-sub">unpaid</div></td>
              <td class="iv-mono">{{ r.bcReference || '—' }}</td>
              <td class="iv-r iv-mono">{{ formatUgx(r.totalAmount) }}</td>
              <td>
                <template v-if="mode === 'register'">
                  <div class="iv-mono">{{ shortDate(r.invoicedAt) }}</div>
                  <div class="iv-sub">{{ r.confirmedBy || '' }}</div>
                </template>
                <template v-else-if="stage === 'ready'">
                  <button class="iv-btn iv-btn--sm" type="button" :disabled="busy" @click="runOne(r, 'confirm')">Confirm</button>
                </template>
                <template v-else-if="stage === 'confirmed'">
                  <button class="iv-btn iv-btn--sm iv-btn--red" type="button" :disabled="busy" @click="runOne(r, 'invoice')">Invoice</button>
                </template>
                <span v-else class="iv-chip iv-chip--amber">Waiting for artwork</span>
              </td>
            </tr>
            <tr v-if="!inv.loading.value && visibleRows.length === 0">
              <td :colspan="canAct ? 9 : 8" class="iv-empty">Nothing here for these dates.</td>
            </tr>
          </tbody>
          <tfoot v-if="visibleRows.length > 0">
            <tr>
              <td :colspan="canAct ? 7 : 6" class="iv-foot">
                <span v-for="g in footGroups" :key="g.paymentMethod" class="iv-foot__g">{{ PAYMENT_METHOD_LABELS[g.paymentMethod] || g.paymentMethod }} {{ formatUgx(g.amount, { compact: true }) }}</span>
              </td>
              <td class="iv-r iv-mono iv-foot iv-foot--total">{{ formatUgx(visibleTotal) }}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useInvoicing } from '~/composables/useInvoicing'
import { useWorkspace } from '~/composables/useWorkspace'
import {
  isoToday, shiftIsoDate, formatUgx, formatRunDate, apiErrorMessage, PAYMENT_METHOD_LABELS,
} from '~/utils/vgamsSession'

const props = defineProps({
  mode: { type: String, default: 'queue' }, // 'queue' | 'register'
})

const inv = useInvoicing()
const ws = useWorkspace()
const config = useRuntimeConfig()

const QUEUE_STAGES = [
  { key: 'ready', label: 'Ready to confirm' },
  { key: 'confirmed', label: 'Ready to invoice' },
  { key: 'held', label: 'Held back' },
]
const METHODS = ['credit', 'bank_transfer', 'cash', 'mobile_money', 'pdc']

const startDate = ref(shiftIsoDate(isoToday(), props.mode === 'register' ? -29 : -6))
const endDate = ref(isoToday())
const stage = ref(props.mode === 'register' ? 'invoiced' : 'ready')
const methodFilter = ref('')
const search = ref('')
const rows = ref([])
const stageCounts = ref({})
const selected = ref(new Set())
const busy = ref(false)
const message = reactive({ text: '', kind: 'ok' })

const canAct = computed(() => props.mode === 'queue' && (stage.value === 'ready' || stage.value === 'confirmed'))
const tableTitle = computed(() => ({
  ready: 'Placed on a confirmed layout, artwork attached',
  confirmed: 'Confirmed — ready to invoice',
  held: 'Placed, waiting for artwork',
  invoiced: 'Invoiced bookings',
}[stage.value]))

// Rows for the current stage, before the method filter (tiles use these)
const searched = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return rows.value
  return rows.value.filter(r => [r.clientName, r.advertTitle, r.bcReference, r.reference].some(v => String(v || '').toLowerCase().includes(q)))
})

const visibleRows = computed(() =>
  methodFilter.value ? searched.value.filter(r => r.paymentMethod === methodFilter.value) : searched.value
)

const sumOf = list => list.reduce((t, r) => t + (Number(r.totalAmount) || 0), 0)
const visibleTotal = computed(() => sumOf(visibleRows.value))

const tiles = computed(() => {
  const by = m => searched.value.filter(r => r.paymentMethod === m)
  const methodTiles = METHODS
    .map(m => ({ key: m, label: PAYMENT_METHOD_LABELS[m], count: by(m).length, amount: sumOf(by(m)) }))
    .filter(t => t.key !== 'pdc' || t.count > 0)
  return [...methodTiles, { key: '', label: 'All methods', count: searched.value.length, amount: sumOf(searched.value) }]
})

const footGroups = computed(() => METHODS
  .map(m => ({ paymentMethod: m, amount: sumOf(visibleRows.value.filter(r => r.paymentMethod === m)) }))
  .filter(g => g.amount > 0))

const selectedIds = computed(() => visibleRows.value.filter(r => selected.value.has(r.id)).map(r => r.id))
const selectedAmount = computed(() => sumOf(visibleRows.value.filter(r => selected.value.has(r.id))))
const allSelected = computed(() => visibleRows.value.length > 0 && visibleRows.value.every(r => selected.value.has(r.id)))

const toggleOne = (id, on) => {
  const next = new Set(selected.value)
  on ? next.add(id) : next.delete(id)
  selected.value = next
}
const toggleAll = (on) => {
  selected.value = on ? new Set(visibleRows.value.map(r => r.id)) : new Set()
}

const runSummary = (r) => {
  const pick = stage.value === 'held' ? r.heldDates : r.readyDates
  const dates = (pick && pick.length ? pick : (r.runDates || []).map(d => d.date)).slice(0, 4)
  return dates.map(date => (r.runDates || []).find(d => d.date === date) || { date })
}

const methodClass = m => ({ credit: 'iv-chip--amber', pdc: 'iv-chip--amber' }[m] || '')
const mediaUrl = url => (/^https?:\/\//i.test(url) ? url : `${config.public.uploadBase || ''}${url}`)
const isImage = media => String(media?.mime || '').startsWith('image/')
const fileExt = name => (String(name || '').split('.').pop() || 'file').slice(0, 4).toUpperCase()
const shortDate = v => (v ? String(v).slice(0, 10) : '—')

function flash(text, kind = 'ok') {
  message.text = text
  message.kind = kind
  if (kind === 'ok') setTimeout(() => { if (message.text === text) message.text = '' }, 4000)
}

function setRange(days) {
  endDate.value = isoToday()
  startDate.value = shiftIsoDate(endDate.value, -days)
  load()
}

function setStage(key) {
  stage.value = key
  selected.value = new Set()
  load()
}

async function load() {
  try {
    const res = await inv.fetchQueue({ startDate: startDate.value, endDate: endDate.value, stage: stage.value })
    rows.value = res?.data || []
    stageCounts.value = res?.stages || {}
    const ids = new Set(rows.value.map(r => r.id))
    selected.value = new Set([...selected.value].filter(id => ids.has(id)))
    pushShell()
  } catch (e) {
    rows.value = []
    flash(apiErrorMessage(e, 'Could not load the invoicing queue'), 'err')
  }
}

function pushShell() {
  if (props.mode === 'register') {
    ws.setHeader({ eyebrow: 'Step 5 · Invoicing', title: 'Invoice register' })
  } else {
    ws.setHeader({ eyebrow: 'Step 5 · Invoicing', title: QUEUE_STAGES.find(s => s.key === stage.value)?.label || 'Invoicing' })
    ws.setBadges({ ready: (stageCounts.value.ready?.count || 0) + (stageCounts.value.confirmed?.count || 0) })
  }
  ws.setPipeline({
    invoiced: stageCounts.value.invoiced?.count ?? null,
    artwork: (stageCounts.value.ready?.count || 0) + (stageCounts.value.confirmed?.count || 0),
    placed: (stageCounts.value.ready?.count || 0) + (stageCounts.value.confirmed?.count || 0) + (stageCounts.value.held?.count || 0) + (stageCounts.value.invoiced?.count || 0),
  }, 5)
}

async function runOne(row, action) {
  busy.value = true
  try {
    if (action === 'confirm') {
      await inv.confirm(row.id)
      flash(`${row.clientName} confirmed — now in “Ready to invoice”.`)
    } else {
      const res = await inv.invoice(row.id)
      flash(`${row.clientName}: invoice ${res?.invoice?.invoiceNumber || ''} created (${res?.invoice?.paymentStatus || ''}).`)
    }
    await load()
  } catch (e) {
    flash(apiErrorMessage(e, 'Action failed'), 'err')
  } finally {
    busy.value = false
  }
}

async function runBulk(action) {
  const ids = selectedIds.value
  if (ids.length === 0) return
  const label = { confirm: 'Confirm', invoice: 'Invoice', confirm_and_invoice: 'Confirm and invoice' }[action]
  if (!window.confirm(`${label} ${ids.length} booking${ids.length === 1 ? '' : 's'} worth UGX ${formatUgx(selectedAmount.value)}?`)) return
  busy.value = true
  try {
    const res = await inv.bulk(ids, action)
    const failed = (res?.results || []).filter(r => !r.ok)
    if (failed.length) {
      flash(`${res.succeeded} done, ${failed.length} not: ${failed.slice(0, 3).map(f => `#${f.advertId} ${f.message}`).join('; ')}${failed.length > 3 ? '…' : ''}`, 'warn')
    } else {
      flash(`${res?.succeeded || ids.length} booking${ids.length === 1 ? '' : 's'} done.`)
    }
    selected.value = new Set()
    await load()
  } catch (e) {
    flash(apiErrorMessage(e, 'Bulk action failed'), 'err')
  } finally {
    busy.value = false
  }
}

async function exportXlsx() {
  const XLSX = await import('xlsx')
  const sheet = [
    ['Client', 'Advert', 'Product', 'Type', 'Run dates', 'Pages', 'Payment method', 'Paid', 'BC order', 'Amount (UGX)', 'Stage', 'Confirmed by', 'Invoiced'],
    ...visibleRows.value.map(r => {
      const runs = runSummary(r)
      return [
        r.clientName, r.advertTitle, r.productName,
        r.printAdClass === 'classified' ? 'Classified' : (r.printAdClass ? 'Display' : ''),
        runs.map(d => d.date).join(', '), runs.map(d => d.pageNumber || '').join(', '),
        PAYMENT_METHOD_LABELS[r.paymentMethod] || r.paymentMethod, r.isPaid ? 'Yes' : 'No',
        r.bcReference, r.totalAmount, r.stage, r.confirmedBy || '', shortDate(r.invoicedAt),
      ]
    }),
    [],
    ...METHODS.map(m => [PAYMENT_METHOD_LABELS[m], '', '', '', '', '', '', '', 'Subtotal', sumOf(visibleRows.value.filter(r => r.paymentMethod === m))]),
    ['All methods', '', '', '', '', '', '', '', 'Total', visibleTotal.value],
  ]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sheet), stage.value)
  XLSX.writeFile(wb, `invoicing-${stage.value}_${startDate.value}_${endDate.value}.xlsx`)
}

onMounted(load)
</script>

<style scoped>
.iv {
  --nv: #003366; --rd: #C0181E; --bd: #D1D9E0; --bdl: #E8ECF0;
  --t1: #0F172A; --t2: #334155; --t3: #475569; --t4: #64748B;
  font-family: 'IBM Plex Sans', 'Segoe UI', sans-serif; font-size: 13px; color: var(--t1);
  display: flex; flex-direction: column; gap: 14px;
}
.iv-card { background: #fff; border: 1px solid var(--bd); border-radius: 2px; }
.iv-card__hd { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; padding: 12px 16px; border-bottom: 1px solid var(--bdl); }
.iv-card__t { margin: 0; font-size: 13px; font-weight: 700; color: var(--nv); }

.iv-toolbar { display: flex; flex-wrap: wrap; gap: 14px; align-items: flex-end; padding: 14px 16px; }
.iv-field { display: flex; flex-direction: column; gap: 5px; }
.iv-field--grow { flex: 1 1 200px; }
.iv-lbl { font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: var(--t3); }
.iv-input { min-height: 36px; border: 1px solid var(--bd); border-radius: 2px; padding: 6px 10px; font: inherit; color: var(--t1); background: #fff; }
.iv-seg { display: inline-flex; border: 1px solid var(--bd); border-radius: 2px; overflow: hidden; }
.iv-seg button { min-height: 34px; padding: 0 12px; border: none; border-right: 1px solid var(--bd); background: #fff; color: var(--t2); font: inherit; font-size: 12px; font-weight: 600; cursor: pointer; }
.iv-seg button:last-child { border-right: none; }
.iv-seg button:hover { background: #F5F9FD; }

.iv-btn { min-height: 36px; padding: 0 14px; border: 1px solid var(--bd); background: #fff; color: var(--nv); border-radius: 2px; font: inherit; font-size: 12px; font-weight: 600; cursor: pointer; white-space: nowrap; }
.iv-btn:hover:not(:disabled) { background: #F5F9FD; }
.iv-btn:disabled { opacity: .5; cursor: not-allowed; }
.iv-btn--red { background: var(--rd); border-color: var(--rd); color: #fff; }
.iv-btn--red:hover:not(:disabled) { background: #A11419; }
.iv-btn--sm { min-height: 30px; padding: 0 10px; font-size: 11.5px; }
.iv-input:focus-visible, .iv-btn:focus-visible, .iv-tile:focus-visible, .iv-tab:focus-visible { outline: 2px solid #9DC3E6; outline-offset: 1px; }

.iv-tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 10px; }
.iv-tile { text-align: left; font: inherit; cursor: pointer; background: #fff; border: 1px solid var(--bd); border-top: 3px solid #CBD5E1; border-radius: 2px; padding: 12px 14px; display: flex; flex-direction: column; gap: 4px; }
.iv-tile:hover { background: #FAFCFE; }
.iv-tile--on { border-top-color: var(--nv); box-shadow: inset 0 0 0 1px var(--nv); }
.iv-tile--all { background: #F5F9FD; }
.iv-tile__l { font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: var(--t3); }
.iv-tile--all .iv-tile__l { color: var(--nv); }
.iv-tile__v { font-family: 'IBM Plex Mono', monospace; font-size: 20px; font-weight: 600; color: var(--t1); }
.iv-tile__s { font-size: 11px; color: var(--t4); }

.iv-tabs { display: flex; gap: 0; border-bottom: 2px solid #DEEAF1; flex-wrap: wrap; }
.iv-tab { border: none; background: none; font: inherit; font-size: 13px; font-weight: 600; color: var(--t3); padding: 10px 16px; margin-bottom: -2px; border-bottom: 3px solid transparent; cursor: pointer; min-height: 44px; }
.iv-tab b { font-family: 'IBM Plex Mono', monospace; margin-left: 4px; color: var(--t1); }
.iv-tab--on { color: var(--nv); border-bottom-color: var(--nv); }

.iv-msg { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 10px 14px; border-radius: 2px; font-size: 12.5px; }
.iv-msg--ok { background: #ECFDF3; border: 1px solid #86D9A8; color: #14532D; }
.iv-msg--warn { background: #FFF7E6; border: 1px solid #F2C46D; color: #7A4A00; }
.iv-msg--err { background: #FDECEC; border: 1px solid #F0A3A5; color: #8A1014; }
.iv-msg__x { border: none; background: none; font-size: 18px; cursor: pointer; color: inherit; }
.iv-note { margin: 0; padding: 10px 14px; background: #FFF7E6; border: 1px solid #F2C46D; border-radius: 2px; color: #7A4A00; font-size: 12.5px; }

.iv-bulk { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.iv-bulk__sum { font-size: 12px; color: var(--t2); }

.iv-table-wrap { overflow-x: auto; }
.iv-table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
.iv-table th { text-align: left; font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: var(--t3); background: #F8FAFC; padding: 9px 10px; border-bottom: 1px solid #E2E8F0; white-space: nowrap; }
.iv-table td { padding: 9px 10px; border-bottom: 1px solid #EEF2F6; vertical-align: middle; }
.iv-table tr:hover td { background: #F7FBFE; }
.iv-row--sel td { background: #F2F7FC; }
.iv-col-check { width: 36px; }
.iv-col-check input { width: 16px; height: 16px; accent-color: var(--nv); }
.iv-r { text-align: right; }
.iv-strong { font-weight: 600; }
.iv-sub { font-size: 11.5px; color: var(--t4); margin-top: 2px; }
.iv-mono { font-family: 'IBM Plex Mono', monospace; font-size: 12px; white-space: nowrap; }
.iv-muted { color: var(--t4); }
.iv-empty { padding: 28px 16px; text-align: center; color: var(--t4); }

.iv-thumb { width: 36px; height: 46px; border: 1px solid #9DC3E6; border-radius: 2px; background: #E8F0F8; display: inline-flex; align-items: center; justify-content: center; overflow: hidden; text-decoration: none; }
.iv-thumb img { width: 100%; height: 100%; object-fit: cover; }
.iv-thumb__ext { font-family: 'IBM Plex Mono', monospace; font-size: 9px; font-weight: 600; color: var(--nv); }
.iv-thumb--none { border-style: dashed; background: #fff; color: var(--t4); }

.iv-chip { display: inline-flex; padding: 2px 7px; border-radius: 2px; font-size: 10.5px; font-weight: 600; border: 1px solid var(--bd); background: #F8FAFC; color: var(--t2); white-space: nowrap; }
.iv-chip--amber { background: #FFF7E6; border-color: #F2C46D; color: #7A4A00; }
.iv-type { display: inline-block; padding: 2px 8px; border-radius: 2px; font-size: 11px; font-weight: 700; }
.iv-type--display { background: #E8F0F8; border: 1px solid #9DC3E6; color: var(--nv); }
.iv-type--classified { background: #F3EEF9; border: 1px solid #C9B5E4; color: #4B2A7A; }

.iv-foot { padding: 12px 10px; font-weight: 700; color: var(--nv); border-top: 2px solid #DEEAF1; }
.iv-foot__g { margin-right: 14px; font-weight: 600; color: var(--t2); }
.iv-foot--total { font-size: 13px; }
</style>
