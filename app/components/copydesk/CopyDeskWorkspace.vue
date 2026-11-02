<!-- components/copydesk/CopyDeskWorkspace.vue -->
<!--
  Copy Desk — step 2 of the print workflow, for one run date.

  Bookings arrive all day, so the list refreshes itself every 60 seconds and
  marks anything new. For each booking Copy Desk:
    1. places it on the day's layout (Auto-fill, or the Pager),
    2. confirms it for the day — a size for display adverts (preset or custom),
       or a plain confirm for classifieds,
    3. confirms the layout when the day is closed. That locks it: no more
       adverts. Anything booked after that shows under "Arrived after
       confirmation" and is deferred to another day.
  Design House sees each clearance (size, page, changes) as it happens.
-->
<template>
  <div class="cd">

    <!-- Toolbar -->
    <section class="cd-card cd-toolbar">
      <div class="cd-field">
        <span class="cd-lbl">Run date</span>
        <div class="cd-date">
          <button class="cd-btn cd-btn--icon" type="button" aria-label="Previous day" @click="shiftDay(-1)">‹</button>
          <input v-model="date" type="date" class="cd-input" aria-label="Run date" @change="changeDay">
          <button class="cd-btn cd-btn--icon" type="button" aria-label="Next day" @click="shiftDay(1)">›</button>
          <button class="cd-btn" type="button" @click="goToday">Today</button>
        </div>
      </div>

      <div class="cd-field">
        <label class="cd-lbl" for="cd-product">Product</label>
        <select id="cd-product" v-model="productId" class="cd-input" @change="changeDay">
          <option value="">All print products</option>
          <option v-for="p in products" :key="p.id" :value="String(p.id)">{{ p.name }}</option>
        </select>
      </div>

      <div class="cd-field">
        <span class="cd-lbl">Print type</span>
        <div class="cd-seg" role="group" aria-label="Print type">
          <button v-for="c in CLASS_FILTERS" :key="c.value" type="button" :class="{ on: classFilter === c.value }" @click="classFilter = c.value">
            {{ c.label }} <b>{{ classCount(c.value) }}</b>
          </button>
        </div>
      </div>

      <div class="cd-field">
        <span class="cd-lbl">Show</span>
        <div class="cd-seg" role="group" aria-label="Status filter">
          <button v-for="f in STATUS_FILTERS" :key="f.value" type="button" :class="{ on: statusFilter === f.value }" @click="statusFilter = f.value">
            {{ f.label }}<b v-if="f.count !== undefined"> {{ f.count }}</b>
          </button>
        </div>
      </div>

      <div class="cd-field cd-field--grow">
        <label class="cd-lbl" for="cd-search">Search</label>
        <input id="cd-search" v-model="search" type="search" class="cd-input" placeholder="Client, advert, reference…">
      </div>

      <div class="cd-live" :title="live.lastRefreshed.value ? `Last updated ${clock(live.lastRefreshed.value)}` : ''">
        <span class="cd-live__dot" :class="{ on: !anyDialogOpen }" aria-hidden="true"></span>
        <span>{{ anyDialogOpen ? 'Paused' : 'Live' }}<template v-if="live.lastRefreshed.value"> · {{ clock(live.lastRefreshed.value) }}</template></span>
        <button class="cd-btn" type="button" :disabled="copyDesk.loading.value || live.running.value" @click="live.refreshNow()">Refresh</button>
      </div>
    </section>

    <div v-if="message.text" class="cd-msg" :class="`cd-msg--${message.kind}`" role="status">
      {{ message.text }}
      <button class="cd-msg__x" type="button" aria-label="Dismiss" @click="message.text = ''">×</button>
    </div>

    <div v-if="newIds.size > 0" class="cd-msg cd-msg--new" role="status">
      <span><b>{{ newIds.size }} new booking{{ newIds.size === 1 ? '' : 's' }}</b> for {{ prettyDate }} since you opened this day — highlighted below.</span>
      <button class="cd-btn" type="button" @click="markSeen">Mark seen</button>
    </div>

    <!-- Arrived after confirmation -->
    <section v-if="lateRows.length" class="cd-card cd-late" aria-label="Arrived after confirmation">
      <header class="cd-card__hd">
        <h2 class="cd-card__t cd-card__t--red">Arrived after confirmation · {{ lateRows.length }}</h2>
        <span class="cd-sub">The layout for {{ prettyDate }} is confirmed. Defer these to another day, or reopen the layout.</span>
      </header>
      <ul class="cd-late__list">
        <li v-for="r in lateRows" :key="r.id" class="cd-late__row">
          <span class="cd-type" :class="`cd-type--${r.printAdClass || 'display'}`">{{ r.printAdClass === 'classified' ? 'Classified' : 'Display' }}</span>
          <span class="cd-late__who"><b>{{ r.clientName }}</b> · {{ r.advertTitle }} <span class="cd-sub">· booked {{ clock(r.createdAt) }}</span></span>
          <span class="cd-mono">{{ r.bookedSize?.label || r.bookedSizeText || '—' }}</span>
          <button class="cd-btn cd-btn--red" type="button" @click="openDefer(r)">Defer</button>
        </li>
      </ul>
    </section>

    <div class="cd-cols">

      <!-- Bookings for the day -->
      <section class="cd-card cd-bookings" aria-label="Bookings for the day">
        <header class="cd-card__hd">
          <h2 class="cd-card__t">Bookings running {{ prettyDate }}</h2>
          <div class="cd-chips">
            <span class="cd-chip cd-chip--amber">Awaiting Copy Desk {{ counts.awaitingClearance ?? 0 }}</span>
            <span class="cd-chip cd-chip--green">Confirmed {{ counts.cleared ?? 0 }}</span>
            <span class="cd-chip cd-chip--red">Not placed {{ counts.unplaced ?? 0 }}</span>
            <span class="cd-chip">Total {{ counts.total ?? 0 }}</span>
          </div>
        </header>

        <div class="cd-selbar">
          <label class="cd-check">
            <input type="checkbox" :checked="allChecked" :disabled="visibleRows.length === 0" @change="toggleAll($event.target.checked)">
            Select all shown ({{ checked.size }} / {{ visibleRows.length }})
          </label>
          <div class="cd-selbar__actions">
            <button class="cd-btn" type="button" :disabled="checked.size === 0 || busy" title="Classifieds are confirmed without a size; display adverts get their booked size" @click="bulkClear">
              Confirm at booked size {{ checked.size || '' }}
            </button>
          </div>
        </div>

        <div class="cd-table-wrap">
          <table class="cd-table">
            <thead>
              <tr>
                <th class="cd-col-check"><span class="cd-sr">Select</span></th>
                <th>Type</th>
                <th>Client · advert</th>
                <th>Booked</th>
                <th>Copy Desk</th>
                <th>Page</th>
                <th>Artwork</th>
                <th class="cd-col-act">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="r in visibleRows"
                :key="r.id"
                :class="{ 'cd-row--sel': checked.has(r.id), 'cd-row--new': newIds.has(r.id), 'cd-row--todo': !isCleared(r) }"
              >
                <td class="cd-col-check">
                  <input type="checkbox" :aria-label="`Select ${r.clientName}`" :checked="checked.has(r.id)" @change="toggleOne(r.id, $event.target.checked)">
                </td>
                <td>
                  <span class="cd-type" :class="`cd-type--${r.printAdClass || 'display'}`">{{ r.printAdClass === 'classified' ? 'Classified' : 'Display' }}</span>
                </td>
                <td>
                  <div class="cd-strong">
                    {{ r.clientName }}
                    <span v-if="newIds.has(r.id)" class="cd-chip cd-chip--navy">New</span>
                  </div>
                  <div class="cd-sub">
                    {{ r.advertTitle }}<template v-if="r.bcReference"> · {{ r.bcReference }}</template> · run {{ r.runIndex }}/{{ r.runCount }}
                    · {{ PAYMENT_METHOD_LABELS[r.paymentMethod] || r.paymentMethod }}
                  </div>
                  <div v-if="r.deferredIn?.length" class="cd-sub cd-sub--warn">Deferred here from {{ formatRunDate(r.deferredIn[r.deferredIn.length - 1].from) }}</div>
                  <div v-if="r.slot && r.slot.slotSize > 1" class="cd-sub">Shares an ad slot with {{ r.slot.slotSize - 1 }} other advert(s)</div>
                </td>
                <td class="cd-mono">{{ r.bookedSize?.label || r.bookedSizeText || '—' }}</td>
                <td>
                  <template v-if="isCleared(r)">
                    <span class="cd-chip" :class="r.clearance.status === 'changed' ? 'cd-chip--amber' : 'cd-chip--green'">
                      {{ r.clearance.status === 'changed' ? 'Changed' : 'Confirmed' }}
                    </span>
                    <div class="cd-sub">{{ r.clearance.sizeLabel || (r.printAdClass === 'classified' ? 'No size (classified)' : '—') }}</div>
                    <div v-if="r.clearance.status === 'changed' && r.clearance.changeNote" class="cd-sub cd-sub--warn">{{ r.clearance.changeNote }}</div>
                  </template>
                  <template v-else>
                    <span class="cd-chip cd-chip--amber">{{ r.clearance?.status === 'withdrawn' ? 'Withdrawn' : 'Awaiting' }}</span>
                    <div v-if="r.clearance?.withdrawnReason" class="cd-sub">{{ r.clearance.withdrawnReason }}</div>
                  </template>
                </td>
                <td>
                  <span v-if="r.placement" class="cd-chip cd-chip--navy">P{{ r.placement.pageNumber }}</span>
                  <span v-else class="cd-chip cd-chip--red">Not placed</span>
                </td>
                <td><span class="cd-chip" :class="artworkClass(r.artwork)">{{ artworkLabel(r.artwork) }}</span></td>
                <td class="cd-col-act">
                  <div class="cd-acts">
                    <button v-if="!r.lateArrival || r.placement" class="cd-btn cd-btn--sm" :class="{ 'cd-btn--pri': !isCleared(r) }" type="button" @click="openClear(r)">
                      {{ isCleared(r) ? 'Edit' : 'Confirm' }}
                    </button>
                    <button v-if="isCleared(r)" class="cd-btn cd-btn--sm" type="button" @click="openWithdraw(r)">Withdraw</button>
                    <button class="cd-btn cd-btn--sm" type="button" @click="openDefer(r)">Defer</button>
                  </div>
                </td>
              </tr>
              <tr v-if="!copyDesk.loading.value && visibleRows.length === 0">
                <td colspan="8" class="cd-empty">
                  {{ rows.length === 0 ? `No print bookings run on ${prettyDate}.` : 'Nothing matches these filters.' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <details v-if="deferredOut.length" class="cd-deferred">
          <summary>{{ deferredOut.length }} advert{{ deferredOut.length === 1 ? '' : 's' }} deferred away from {{ prettyDate }}</summary>
          <ul>
            <li v-for="d in deferredOut" :key="`${d.advertId}-${d.deferredTo}`">
              <b>{{ d.clientName }}</b> · {{ d.advertTitle }} → {{ formatRunDate(d.deferredTo) }} <span class="cd-sub">({{ d.reason }})</span>
            </li>
          </ul>
        </details>
      </section>

      <!-- Layouts for the day -->
      <aside class="cd-card cd-layouts" aria-label="Layouts for the day">
        <header class="cd-card__hd">
          <h2 class="cd-card__t">Layouts for {{ prettyDate }}</h2>
          <button class="cd-btn" type="button" @click="openPager">Open Pager</button>
        </header>

        <div v-if="layouts.length === 0" class="cd-empty cd-empty--box">
          No layout for this date yet. Open the Pager to create one (masthead, date, pages).
        </div>

        <ul v-else class="cd-pubs">
          <li v-for="p in layouts" :key="p.id" class="cd-pub">
            <div class="cd-pub__top">
              <div>
                <div class="cd-strong">{{ p.code || `Layout #${p.id}` }}</div>
                <div class="cd-sub">{{ p.masthead }}<template v-if="p.productName"> · {{ p.productName }}</template> · {{ p.totalPages }} pages · {{ placedOn(p.id) }} placed</div>
              </div>
              <span class="cd-chip" :class="isLocked(p) ? 'cd-chip--green' : 'cd-chip--amber'">{{ isLocked(p) ? 'Confirmed' : 'Open' }}</span>
            </div>

            <!-- Page fill -->
            <div v-if="fillRows(p.id).length" class="cd-fill">
              <div v-for="f in fillRows(p.id)" :key="f.page" class="cd-fill__row" :class="{ over: f.fraction > 1 }">
                <span class="cd-mono">P{{ f.page }}</span>
                <span class="cd-fill__bar" role="img" :aria-label="`Page ${f.page} ${Math.round(f.fraction * 100)}% full`">
                  <span :style="{ width: Math.min(100, f.fraction * 100) + '%' }"></span>
                </span>
                <span class="cd-mono">{{ Math.round(f.fraction * 100) }}%</span>
                <span class="cd-sub">{{ f.adverts }} ad{{ f.adverts === 1 ? '' : 's' }}<template v-if="f.unknown"> · {{ f.unknown }} unsized</template></span>
              </div>
              <p v-if="fillRows(p.id).some(f => f.fraction > 1)" class="cd-sub cd-sub--warn">A page is over 100% — move an advert or add pages.</p>
            </div>

            <div v-if="!isLocked(p)" class="cd-pages">
              <label class="cd-sub" :for="`pg-${p.id}`">Pages</label>
              <input :id="`pg-${p.id}`" v-model.number="pageStep[p.id]" class="cd-input cd-input--xs" type="number" min="1" max="48" step="1">
              <button class="cd-btn cd-btn--sm" type="button" :disabled="busy" @click="changePages(p, 1)">+ Add</button>
              <button class="cd-btn cd-btn--sm" type="button" :disabled="busy" @click="changePages(p, -1)">− Remove</button>
            </div>

            <div class="cd-pub__actions">
              <button class="cd-btn" type="button" :title="`Opens the Pager — choose ${p.code || 'this layout'}`" @click="openPager">Open in Pager</button>
              <button v-if="!isLocked(p)" class="cd-btn" type="button" :disabled="checked.size === 0 || busy" @click="sendChecked(p)">Auto-fill {{ checked.size || '' }}</button>
              <button v-if="!isLocked(p)" class="cd-btn cd-btn--pri" type="button" :disabled="busy" @click="startConfirm(p)">Confirm layout</button>
              <button v-else-if="p.status === 'locked'" class="cd-btn" type="button" :disabled="busy" @click="startReopen(p)">Reopen</button>
            </div>
          </li>
        </ul>

        <div class="cd-legend">
          <p class="cd-legend__t">How the day flows</p>
          <ol>
            <li>Place bookings as they arrive (Auto-fill or the Pager).</li>
            <li>Confirm each one for the day: with a size for display adverts, without one for classifieds.</li>
            <li>Confirm the layout to close the day. Later bookings get deferred.</li>
          </ol>
        </div>
      </aside>
    </div>

    <!-- Pager (existing tool) -->
    <PagerPopup v-model:open="pagerOpen" :checked-advert-ids="checkedAdvertIds" />

    <ClearanceDialog :advert="clearTarget" :date="date" :presets="presetsFor(clearTarget)" @close="clearTarget = null" @saved="onSaved('Saved')" />
    <DeferDialog v-if="deferTarget" :advert="deferTarget" :from-date="date" @close="deferTarget = null" @saved="onDeferred" />

    <!-- Confirm / reopen / withdraw -->
    <div v-if="dialog.open" class="cd-overlay" @click.self="closeDialog">
      <div class="cd-dialog" role="dialog" aria-modal="true" aria-labelledby="cd-dialog-title">
        <h3 id="cd-dialog-title" class="cd-dialog__t">{{ dialogTitle }}</h3>

        <template v-if="dialog.mode === 'confirm'">
          <p v-if="dialog.missing.length === 0" class="cd-dialog__p">
            Locks the layout for {{ prettyDate }}: no more adverts can be placed and pages can't be added or removed.
            Bookings that arrive later will show under "Arrived after confirmation" to be deferred.
          </p>
          <template v-else>
            <p class="cd-dialog__p cd-dialog__p--warn">
              {{ dialog.missing.length }} placed advert{{ dialog.missing.length === 1 ? ' is' : 's are' }} not ready. You can still confirm; give a reason.
            </p>
            <ul class="cd-missing">
              <li v-for="m in dialog.missing" :key="m.advertId">P{{ m.pageNumber }} · {{ m.title || `Advert #${m.advertId}` }} — no {{ (m.problems || ['artwork']).join(', no ') }}</li>
            </ul>
          </template>
        </template>
        <p v-else-if="dialog.mode === 'reopen'" class="cd-dialog__p">
          Sends the layout back to open so adverts and pages can change. Adverts not yet confirmed by Invoicing drop out of their queue until it is confirmed again.
        </p>
        <p v-else class="cd-dialog__p">
          Design House will see this advert as no longer confirmed for {{ prettyDate }}.
        </p>

        <template v-if="needsReason">
          <label class="cd-lbl" for="cd-reason">Reason</label>
          <textarea id="cd-reason" v-model="dialog.reason" class="cd-input cd-textarea" rows="3" placeholder="Reason"></textarea>
        </template>

        <p v-if="dialog.error" class="cd-dialog__err" role="alert">{{ dialog.error }}</p>

        <div class="cd-dialog__actions">
          <button class="cd-btn" type="button" @click="closeDialog">Cancel</button>
          <button class="cd-btn cd-btn--pri" type="button" :disabled="busy || (needsReason && !dialog.reason.trim())" @click="submitDialog">
            {{ busy ? 'Working…' : dialogTitle }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import PagerPopup from '~/components/pager/PagerPopup.vue'
import ClearanceDialog from '~/components/copydesk/ClearanceDialog.vue'
import DeferDialog from '~/components/copydesk/DeferDialog.vue'
import { useCopyDesk } from '~/composables/useCopyDesk'
import { usePager } from '~/composables/usePager'
import { useDesignHouse } from '~/composables/useDesignHouse'
import { useWorkspace } from '~/composables/useWorkspace'
import { useLivePoll } from '~/composables/useLivePoll'
import {
  isoToday, shiftIsoDate, formatRunDate, apiErrorMessage, PAYMENT_METHOD_LABELS,
} from '~/utils/vgamsSession'

const copyDesk = useCopyDesk()
const pager = usePager()
const designHouse = useDesignHouse()
const ws = useWorkspace()

const CLASS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'display', label: 'Display' },
  { value: 'classified', label: 'Classified' },
]

const date = ref(isoToday())
const productId = ref('')
const classFilter = ref('')
const statusFilter = ref('')
const search = ref('')

const products = ref([])
const presetCache = ref({})          // productId → presets
const rows = ref([])
const counts = ref({})
const layouts = ref([])
const pageFill = ref({})
const deferredOut = ref([])
const checked = ref(new Set())
const pageStep = reactive({})
const pagerOpen = ref(false)
const busy = ref(false)
const message = reactive({ text: '', kind: 'ok' })

// New-booking tracking: ids seen on the first load of a day
const seenIds = ref(null)
const newIds = ref(new Set())

const clearTarget = ref(null)
const deferTarget = ref(null)
const dialog = reactive({ open: false, mode: 'confirm', publication: null, row: null, missing: [], reason: '', error: '' })

const anyDialogOpen = computed(() => !!clearTarget.value || !!deferTarget.value || dialog.open || pagerOpen.value)
const prettyDate = computed(() => formatRunDate(date.value))

const isCleared = (r) => !!r.clearance && ['cleared', 'changed'].includes(r.clearance.status)
const lateRows = computed(() => rows.value.filter(r => r.lateArrival))

const STATUS_FILTERS = computed(() => [
  { value: '', label: 'All' },
  { value: 'awaiting', label: 'Awaiting Copy Desk', count: counts.value.awaitingClearance ?? 0 },
  { value: 'changed', label: 'Changed', count: rows.value.filter(r => r.clearance?.status === 'changed').length },
  { value: 'unplaced', label: 'Not placed', count: counts.value.unplaced ?? 0 },
  { value: 'artwork', label: 'Awaiting artwork', count: counts.value.awaitingArtwork ?? 0 },
])

const visibleRows = computed(() => {
  const q = search.value.trim().toLowerCase()
  return rows.value
    .filter(r => !r.lateArrival || r.placement)
    .filter(r => !classFilter.value || (r.printAdClass || 'display') === classFilter.value)
    .filter(r => {
      if (statusFilter.value === 'awaiting') return !isCleared(r)
      if (statusFilter.value === 'changed') return r.clearance?.status === 'changed'
      if (statusFilter.value === 'unplaced') return !r.placement
      if (statusFilter.value === 'artwork') return r.artwork === 'awaiting' || r.artwork === 'dropped'
      return true
    })
    .filter(r => !q || [r.clientName, r.advertTitle, r.reference, r.bcReference].some(v => String(v || '').toLowerCase().includes(q)))
    // New first, then awaiting Copy Desk, then by page
    .sort((a, b) =>
      (newIds.value.has(b.id) - newIds.value.has(a.id))
      || (isCleared(a) - isCleared(b))
      || ((a.placement?.pageNumber ?? 999) - (b.placement?.pageNumber ?? 999)))
})

const allChecked = computed(() => visibleRows.value.length > 0 && visibleRows.value.every(r => checked.value.has(r.id)))

// Ad slots move together: ticking one member ticks the whole slot for the Pager
const checkedAdvertIds = computed(() => {
  const ids = new Set(checked.value)
  for (const r of rows.value) {
    if (checked.value.has(r.id) && r.slot?.allIds) r.slot.allIds.forEach(id => ids.add(id))
  }
  return [...ids]
})

const classCount = (value) => (value ? counts.value[value] ?? 0 : counts.value.total ?? 0)

const toggleOne = (id, on) => {
  const next = new Set(checked.value)
  on ? next.add(id) : next.delete(id)
  checked.value = next
}
const toggleAll = (on) => {
  checked.value = on ? new Set(visibleRows.value.map(r => r.id)) : new Set()
}

const placedOn = (publicationId) => rows.value.filter(r => r.placement?.publicationId === publicationId).length
const isLocked = (p) => p.status === 'locked' || p.status === 'published'
const artworkLabel = (a) => ({ in: 'In', carried: 'Carried', awaiting: 'Awaiting', dropped: 'Dropped' }[a] || a)
const artworkClass = (a) => ({ in: 'cd-chip--green', carried: 'cd-chip--green', awaiting: 'cd-chip--amber', dropped: 'cd-chip--red' }[a] || '')
const clock = (v) => (v ? new Date(v).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '')

const fillRows = (publicationId) => Object.entries(pageFill.value[publicationId] || {})
  .map(([page, f]) => ({ page: Number(page), ...f }))
  .sort((a, b) => a.page - b.page)

const presetsFor = (row) => presetCache.value[row?.productId || 'all'] || []

function flash(text, kind = 'ok') {
  message.text = text
  message.kind = kind
  if (kind === 'ok') setTimeout(() => { if (message.text === text) message.text = '' }, 4000)
}

// ── Data ─────────────────────────────────────────────────────────────────
async function load({ quiet = false } = {}) {
  try {
    const res = await copyDesk.fetchBookingsByDate(date.value, { productId: productId.value || null, quiet })
    rows.value = res?.data || []
    counts.value = res?.counts || {}
    layouts.value = res?.layouts || []
    pageFill.value = res?.pageFill || {}
    deferredOut.value = res?.deferredOut || []

    const ids = rows.value.map(r => r.id)
    if (seenIds.value === null) {
      seenIds.value = new Set(ids)
    } else {
      newIds.value = new Set(ids.filter(id => !seenIds.value.has(id)))
    }
    const keep = new Set(ids)
    checked.value = new Set([...checked.value].filter(id => keep.has(id)))
    for (const l of layouts.value) if (!pageStep[l.id]) pageStep[l.id] = 4
    await ensurePresets()
    live.markRefreshed()
    pushShell()
  } catch (e) {
    if (!quiet) flash(apiErrorMessage(e, 'Could not load the day'), 'err')
  }
}

async function ensurePresets() {
  const pids = [...new Set(rows.value.map(r => r.productId || 'all'))]
  for (const pid of pids) {
    if (presetCache.value[pid]) continue
    presetCache.value = { ...presetCache.value, [pid]: await copyDesk.fetchSizePresets(pid === 'all' ? null : pid).catch(() => []) }
  }
}

const live = useLivePoll(() => load({ quiet: true }), { intervalMs: 60000, isPaused: () => anyDialogOpen.value || busy.value })

function pushShell() {
  ws.setHeader({ eyebrow: 'Step 2 · Copy Desk', title: `Day's layout · ${prettyDate.value}` })
  const total = rows.value.length
  const withArt = rows.value.filter(r => r.artwork === 'in' || r.artwork === 'carried').length
  ws.setPipeline({
    booked: total,
    placed: total - (counts.value.unplaced ?? 0),
    design: counts.value.cleared ?? 0,
    artwork: withArt,
    invoiced: rows.value.filter(r => r.invoiceStage === 'invoiced').length,
  }, 2)
  if (date.value === isoToday()) ws.setBadges({ unplaced: (counts.value.awaitingClearance ?? 0) + (counts.value.lateArrivals ?? 0) })
}

async function loadProducts() {
  try {
    const res = await designHouse.fetchProducts('print')
    products.value = res?.products || []
  } catch {
    products.value = []
  }
}

function changeDay() {
  seenIds.value = null
  newIds.value = new Set()
  checked.value = new Set()
  load()
}
const shiftDay = (n) => { date.value = shiftIsoDate(date.value, n); changeDay() }
const goToday = () => { date.value = isoToday(); changeDay() }
const markSeen = () => {
  seenIds.value = new Set(rows.value.map(r => r.id))
  newIds.value = new Set()
}

// ── Pager and pages ──────────────────────────────────────────────────────
const openPager = () => { pagerOpen.value = true }
watch(pagerOpen, (open, was) => { if (was && !open) load({ quiet: true }) })

async function sendChecked(layout) {
  const chosen = rows.value.filter(r => checked.value.has(r.id) && !r.placement)
  if (chosen.length === 0) {
    flash('Every ticked booking is already placed on a layout.', 'warn')
    return
  }
  // One unit per ad slot (whole slot together), else one per advert
  const units = []
  const seen = new Set()
  for (const r of chosen) {
    const key = r.slot?.slotKey || `a:${r.id}`
    if (seen.has(key)) continue
    seen.add(key)
    units.push({ advertIds: r.slot?.allIds || [r.id] })
  }
  busy.value = true
  try {
    const result = await pager.queueUnitsToPublication(layout.id, units)
    const assigned = result?.assigned?.length || 0
    const skipped = result?.skipped?.length || 0
    flash(`${assigned} advert${assigned === 1 ? '' : 's'} placed on ${layout.code}${skipped ? `; ${skipped} skipped (already placed or not print-eligible)` : ''}.`, skipped ? 'warn' : 'ok')
    checked.value = new Set()
    await load({ quiet: true })
  } catch (e) {
    flash(apiErrorMessage(e, 'Auto-fill failed'), 'err')
  } finally {
    busy.value = false
  }
}

async function changePages(layout, direction) {
  const n = Math.max(1, Math.min(48, Number(pageStep[layout.id]) || 4))
  busy.value = true
  try {
    if (direction > 0) await pager.increasePages(layout.id, n)
    else await pager.decreasePages(layout.id, n)
    flash(`${direction > 0 ? 'Added' : 'Removed'} ${n} page${n === 1 ? '' : 's'} ${direction > 0 ? 'to' : 'from'} ${layout.code}.`)
    await load({ quiet: true })
  } catch (e) {
    flash(apiErrorMessage(e, pager.error.value || 'Could not change the page count'), 'err')
  } finally {
    busy.value = false
  }
}

// ── Clearance ────────────────────────────────────────────────────────────
function openClear(row) {
  clearTarget.value = row
}

function openDefer(row) {
  deferTarget.value = row
}

async function onSaved(text) {
  flash(text)
  await load({ quiet: true })
}

async function onDeferred(res) {
  flash(res?.message || 'Deferred')
  await load({ quiet: true })
}

async function bulkClear() {
  const ids = [...checked.value]
  busy.value = true
  try {
    const res = await copyDesk.clearBulk(date.value, ids)
    const failed = (res?.results || []).filter(r => !r.ok && r.message !== 'Already cleared')
    flash(`${res?.succeeded || 0} confirmed${failed.length ? `; ${failed.length} need attention: ${failed.slice(0, 3).map(f => {
      const r = rows.value.find(x => x.id === f.advertId)
      return `${r?.clientName || `#${f.advertId}`} — ${f.message}`
    }).join('; ')}${failed.length > 3 ? '…' : ''}` : ''}.`, failed.length ? 'warn' : 'ok')
    checked.value = new Set()
    await load({ quiet: true })
  } catch (e) {
    flash(apiErrorMessage(e, 'Bulk confirm failed'), 'err')
  } finally {
    busy.value = false
  }
}

// ── Confirm / reopen / withdraw dialog ───────────────────────────────────
const dialogTitle = computed(() => ({
  confirm: `Confirm layout · ${dialog.publication?.code || ''}`,
  reopen: `Reopen layout · ${dialog.publication?.code || ''}`,
  withdraw: `Withdraw confirmation · ${dialog.row?.clientName || ''}`,
}[dialog.mode]))
const needsReason = computed(() => dialog.mode !== 'confirm' || dialog.missing.length > 0)

function startConfirm(layout) {
  const missing = rows.value
    .filter(r => r.placement?.publicationId === layout.id)
    .map(r => {
      const problems = []
      if (!(r.artwork === 'in' || r.artwork === 'carried')) problems.push('artwork')
      if (!isCleared(r)) problems.push('clearance')
      return { advertId: r.id, title: `${r.clientName} · ${r.advertTitle}`, pageNumber: r.placement.pageNumber, problems }
    })
    .filter(m => m.problems.length > 0)
  Object.assign(dialog, { open: true, mode: 'confirm', publication: layout, row: null, missing, reason: '', error: '' })
}
function startReopen(layout) {
  Object.assign(dialog, { open: true, mode: 'reopen', publication: layout, row: null, missing: [], reason: '', error: '' })
}
function openWithdraw(row) {
  Object.assign(dialog, { open: true, mode: 'withdraw', publication: null, row, missing: [], reason: '', error: '' })
}
function closeDialog() {
  if (!busy.value) dialog.open = false
}

async function submitDialog() {
  busy.value = true
  dialog.error = ''
  try {
    let res
    if (dialog.mode === 'confirm') res = await copyDesk.confirmLayout(dialog.publication.id, dialog.reason.trim())
    else if (dialog.mode === 'reopen') res = await copyDesk.reopenLayout(dialog.publication.id, dialog.reason.trim())
    else res = await copyDesk.withdraw(dialog.row.id, date.value, dialog.reason.trim())
    flash(res?.message || 'Done')
    dialog.open = false
    await load({ quiet: true })
  } catch (e) {
    const data = e?.data || {}
    if (data.code === 'reason_required' && Array.isArray(data.missing)) {
      dialog.missing = data.missing
      dialog.error = 'Give a reason to confirm with these gaps.'
    } else {
      dialog.error = apiErrorMessage(e, 'Could not complete that')
    }
  } finally {
    busy.value = false
  }
}

onMounted(() => {
  loadProducts()
  load()
})
</script>

<style scoped>
.cd {
  --nv: #003366; --rd: #C0181E; --bd: #D1D9E0; --bdl: #E8ECF0;
  --t1: #0F172A; --t2: #334155; --t3: #475569; --t4: #64748B;
  font-family: 'IBM Plex Sans', 'Segoe UI', sans-serif; font-size: 13px; color: var(--t1);
  display: flex; flex-direction: column; gap: 16px;
}
.cd-card { background: #fff; border: 1px solid var(--bd); border-radius: 2px; }
.cd-card__hd { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; padding: 12px 16px; border-bottom: 1px solid var(--bdl); }
.cd-card__t { font-size: 13px; font-weight: 700; color: var(--nv); margin: 0; }
.cd-card__t--red { color: #8A1014; }

.cd-toolbar { display: flex; flex-wrap: wrap; gap: 14px; align-items: flex-end; padding: 14px 16px; }
.cd-field { display: flex; flex-direction: column; gap: 5px; }
.cd-field--grow { flex: 1 1 180px; }
.cd-lbl { font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: var(--t3); }
.cd-input { min-height: 36px; border: 1px solid var(--bd); border-radius: 2px; padding: 6px 10px; font: inherit; color: var(--t1); background: #fff; }
.cd-input--xs { width: 64px; min-height: 30px; padding: 4px 8px; }
.cd-input:focus-visible, .cd-btn:focus-visible { outline: 2px solid #9DC3E6; outline-offset: 1px; }
.cd-textarea { width: 100%; resize: vertical; }
.cd-date { display: flex; gap: 6px; align-items: center; }

.cd-live { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--t3); }
.cd-live__dot { width: 8px; height: 8px; border-radius: 50%; background: #CBD5E1; }
.cd-live__dot.on { background: #16A34A; box-shadow: 0 0 0 3px rgba(22,163,74,.15); }

.cd-btn { min-height: 36px; padding: 0 14px; border: 1px solid var(--bd); background: #fff; color: var(--nv); border-radius: 2px; font: inherit; font-size: 12px; font-weight: 600; cursor: pointer; white-space: nowrap; }
.cd-btn:hover:not(:disabled) { background: #F5F9FD; }
.cd-btn:disabled { opacity: .5; cursor: not-allowed; }
.cd-btn--icon { width: 36px; padding: 0; font-size: 16px; }
.cd-btn--sm { min-height: 30px; padding: 0 10px; font-size: 11.5px; }
.cd-btn--pri { background: var(--nv); border-color: var(--nv); color: #fff; }
.cd-btn--pri:hover:not(:disabled) { background: #002244; }
.cd-btn--red { background: var(--rd); border-color: var(--rd); color: #fff; }
.cd-btn--red:hover:not(:disabled) { background: #A11419; }

.cd-seg { display: inline-flex; border: 1px solid var(--bd); border-radius: 2px; overflow: hidden; flex-wrap: wrap; }
.cd-seg button { min-height: 34px; padding: 0 12px; border: none; border-right: 1px solid var(--bd); background: #fff; color: var(--t2); font: inherit; font-size: 12px; font-weight: 600; cursor: pointer; }
.cd-seg button:last-child { border-right: none; }
.cd-seg button.on { background: var(--nv); color: #fff; }
.cd-seg b { font-family: 'IBM Plex Mono', monospace; font-weight: 600; margin-left: 2px; }

.cd-msg { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 10px 14px; border-radius: 2px; font-size: 12.5px; }
.cd-msg--ok { background: #ECFDF3; border: 1px solid #86D9A8; color: #14532D; }
.cd-msg--warn { background: #FFF7E6; border: 1px solid #F2C46D; color: #7A4A00; }
.cd-msg--err { background: #FDECEC; border: 1px solid #F0A3A5; color: #8A1014; }
.cd-msg--new { background: #E8F0F8; border: 1px solid #9DC3E6; color: var(--nv); }
.cd-msg__x { border: none; background: none; font-size: 18px; cursor: pointer; color: inherit; }

.cd-late { border-color: #F0A3A5; border-top: 3px solid var(--rd); }
.cd-late__list { list-style: none; margin: 0; padding: 6px 16px 12px; display: flex; flex-direction: column; }
.cd-late__row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; padding: 8px 0; border-bottom: 1px solid #F5E1E2; }
.cd-late__row:last-child { border-bottom: none; }
.cd-late__who { flex: 1 1 260px; min-width: 0; }

.cd-cols { display: flex; flex-wrap: wrap; gap: 16px; align-items: flex-start; }
.cd-bookings { flex: 999 1 680px; min-width: 0; }
.cd-layouts { flex: 1 1 320px; min-width: 0; }

.cd-chips { display: flex; gap: 6px; flex-wrap: wrap; }
.cd-chip { display: inline-flex; align-items: center; gap: 4px; padding: 2px 7px; border-radius: 2px; font-size: 10.5px; font-weight: 600; border: 1px solid var(--bd); background: #F8FAFC; color: var(--t2); white-space: nowrap; }
.cd-chip--navy { background: #E8F0F8; border-color: #9DC3E6; color: var(--nv); }
.cd-chip--green { background: #ECFDF3; border-color: #86D9A8; color: #14532D; }
.cd-chip--amber { background: #FFF7E6; border-color: #F2C46D; color: #7A4A00; }
.cd-chip--red { background: #FDECEC; border-color: #F0A3A5; color: #8A1014; }

.cd-type { display: inline-block; padding: 2px 8px; border-radius: 2px; font-size: 11px; font-weight: 700; white-space: nowrap; }
.cd-type--display { background: #E8F0F8; border: 1px solid #9DC3E6; color: var(--nv); }
.cd-type--classified { background: #F3EEF9; border: 1px solid #C9B5E4; color: #4B2A7A; }

.cd-selbar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; padding: 10px 16px; border-bottom: 1px solid var(--bdl); background: #FAFCFE; }
.cd-selbar__actions { display: flex; gap: 6px; flex-wrap: wrap; }
.cd-check { display: inline-flex; align-items: center; gap: 8px; font-weight: 600; color: var(--t2); cursor: pointer; }
.cd-check input, .cd-col-check input { width: 16px; height: 16px; accent-color: var(--nv); }

.cd-table-wrap { overflow-x: auto; max-height: 680px; overflow-y: auto; }
.cd-table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
.cd-table th { position: sticky; top: 0; z-index: 1; text-align: left; font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: var(--t3); background: #F8FAFC; padding: 9px 10px; border-bottom: 1px solid #E2E8F0; white-space: nowrap; }
.cd-table td { padding: 9px 10px; border-bottom: 1px solid #EEF2F6; vertical-align: top; }
.cd-table tr:hover td { background: #F7FBFE; }
.cd-row--sel td { background: #F2F7FC; }
.cd-row--todo td:first-child { box-shadow: inset 3px 0 0 #F2C46D; }
.cd-row--new td { background: #EEF5FC; }
.cd-row--new td:first-child { box-shadow: inset 3px 0 0 var(--nv); }
.cd-col-check { width: 36px; }
.cd-col-act { width: 1%; white-space: nowrap; }
.cd-acts { display: flex; gap: 4px; flex-wrap: wrap; }
.cd-strong { font-weight: 600; color: var(--t1); display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
.cd-sub { font-size: 11.5px; color: var(--t4); margin-top: 2px; }
.cd-sub--warn { color: #7A4A00; }
.cd-mono { font-family: 'IBM Plex Mono', monospace; font-size: 12px; white-space: nowrap; }
.cd-empty { padding: 28px 16px; text-align: center; color: var(--t4); }
.cd-empty--box { margin: 14px 16px; border: 1px dashed #9DC3E6; border-radius: 2px; }
.cd-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }

.cd-deferred { padding: 10px 16px 14px; border-top: 1px solid var(--bdl); font-size: 12px; color: var(--t2); }
.cd-deferred summary { cursor: pointer; font-weight: 600; color: var(--nv); }
.cd-deferred ul { margin: 8px 0 0; padding-left: 18px; display: flex; flex-direction: column; gap: 4px; }

.cd-pubs { list-style: none; margin: 0; padding: 12px 16px; display: flex; flex-direction: column; gap: 10px; }
.cd-pub { border: 1px solid var(--bd); border-radius: 2px; padding: 12px; display: flex; flex-direction: column; gap: 10px; }
.cd-pub__top { display: flex; justify-content: space-between; gap: 8px; align-items: flex-start; }
.cd-pub__actions { display: flex; gap: 6px; flex-wrap: wrap; }
.cd-pages { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }

.cd-fill { display: flex; flex-direction: column; gap: 4px; max-height: 220px; overflow-y: auto; }
.cd-fill__row { display: grid; grid-template-columns: 36px minmax(60px, 1fr) 40px auto; gap: 8px; align-items: center; }
.cd-fill__bar { height: 8px; background: #EEF2F6; border-radius: 1px; overflow: hidden; display: block; }
.cd-fill__bar span { display: block; height: 100%; background: var(--nv); }
.cd-fill__row.over .cd-fill__bar span { background: var(--rd); }
.cd-fill__row.over .cd-mono { color: #8A1014; font-weight: 600; }

.cd-legend { margin: 0 16px 16px; padding: 12px 14px; background: #F5F9FD; border: 1px solid #DEEAF1; border-radius: 2px; font-size: 12px; color: var(--t2); }
.cd-legend__t { margin: 0 0 6px; font-weight: 700; color: var(--nv); }
.cd-legend ol { margin: 0; padding-left: 18px; display: flex; flex-direction: column; gap: 3px; }

.cd-overlay { position: fixed; inset: 0; background: rgba(15,23,42,.45); z-index: 1200; display: flex; align-items: center; justify-content: center; padding: 16px; }
.cd-dialog { background: #fff; width: min(540px, 100%); border-radius: 2px; border-top: 3px solid var(--nv); padding: 20px; display: flex; flex-direction: column; gap: 10px; box-shadow: 0 20px 50px rgba(0,0,0,.25); }
.cd-dialog__t { margin: 0; font-size: 15px; color: var(--nv); }
.cd-dialog__p { margin: 0; color: var(--t2); line-height: 1.5; }
.cd-dialog__p--warn { color: #7A4A00; }
.cd-dialog__err { margin: 0; color: #8A1014; font-weight: 600; }
.cd-dialog__actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 6px; }
.cd-missing { margin: 0; padding: 8px 12px 8px 28px; max-height: 180px; overflow-y: auto; background: #FFF7E6; border: 1px solid #F2C46D; border-radius: 2px; font-size: 12px; color: #7A4A00; }

@media (max-width: 640px) {
  .cd-toolbar { gap: 10px; }
  .cd-seg button { padding: 0 9px; }
  .cd-live { width: 100%; }
}
</style>