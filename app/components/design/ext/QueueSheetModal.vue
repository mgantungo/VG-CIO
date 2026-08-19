<!-- components/design/ext/QueueSheetModal.vue -->
<!--
  Spreadsheet-style alternative to the queue cards, for a given day. Left pane
  lists every booking with a filter (matches Reference or BC Reference), a
  "Handled" checkbox (local marker, backed by markDesignComplete — see note
  below), Brief/Files viewers, and a way to add a row to the active batch.
  Right pane is the SAME Layout Board panel already used on the main page
  (FileGroupCard.vue + AssignBar.vue) — not a re-implementation — so grouping
  adverts into a design batch here behaves identically to doing it from a
  queue card.

  Two ways to add a row to the batch, both ending at the same place:
    1. Drag the row onto a FileGroupCard (or drop it to create a new group
       via "+ New Ad Slot" first, same as today).
    2. Click "+ Batch" on the row — same as clicking "+ Add to Board" on a
       QueueCard — opens the existing AssignBar to pick a group.

  NOTE on "Handled": your backend's markDesignComplete(advertId) sets
  isApproved = true, and the checkbox itself stays a one-way, locked toggle
  (disabled once checked) - it is NOT a free toggle. To reverse a mistaken
  mark, a separate "↺" button appears next to the checkbox once handled;
  clicking it emits 'request-unmark' for the parent to open
  UnmarkCompleteModal.vue, which requires typing the advert's BC reference
  code plus an explicit confirm before calling unmarkDesignComplete.
-->
<template>
  <Teleport to="body">
    <div class="dd-modal-backdrop" :class="{ open: !!open }" @click.self="$emit('close')">
      <div class="dd-sheet-modal" v-if="open">

        <div class="dd-sheet-head">
          <div>
            <h3>Design Queue — Spreadsheet View</h3>
            <div class="sub">
              {{ dateLabel }} · {{ bookings.length }} booking{{ bookings.length !== 1 ? 's' : '' }}
              <span v-if="productLabel"> · {{ productLabel }}</span>
              <span v-if="activeBatch"> · Batch {{ activeBatch.reference }}</span>
            </div>
          </div>
          <button class="dd-modal-close" @click="$emit('close')">&times;</button>
        </div>

        <div class="dd-sheet-toolbar">
          <div class="dd-sheet-filter" :class="{ 'has-value': !!filterText }">
            <span class="icon">⌕</span>
            <input
              v-model.trim="filterText"
              type="text"
              placeholder="Filter by ADV or BC code…"
            />
            <button v-if="filterText" class="clear" @click="filterText = ''">&times;</button>
          </div>
          <span class="dd-sheet-filter-hint">matches Reference or BC Reference</span>
          <span class="dd-sheet-count">
            <b>{{ handledCount }}</b> handled · <b>{{ inBatchCount }}</b> in batch
          </span>
          <button class="dd-btn green" @click="exportExcel">⬇ Export to Excel</button>
        </div>

        <!-- Assign bar — reused as-is, same component the main page uses -->
        <AssignBar
          :advert="pendingAssignAdvert"
          :groups="activeBatch?.fileGroups || []"
          @assign="gid => $emit('assign', gid)"
          @assign-new="$emit('assign-new')"
          @cancel="$emit('cancel-assign')"
        />

        <div class="dd-sheet-split">

          <!-- LEFT: Queue table -->
          <div class="dd-sheet-queue">
            <table class="dd-sheet-tbl">
              <colgroup>
                <col style="width:26px">
                <col style="width:130px">
                <col style="width:110px">
                <col style="width:20%">
                <col style="width:100px">
                <col style="width:16%">
                <col style="width:90px">
                <col style="width:46px">
                <col style="width:52px">
                <col style="width:90px">
                <col style="width:76px">
              </colgroup>
              <thead>
                <tr>
                  <th class="chk-col" title="Handled — marks this booking as processed">✓</th>
                  <th>Reference</th>
                  <th>BC Reference</th>
                  <th>Advert Title</th>
                  <th>Client</th>
                  <th>Ad Size</th>
                  <th>Total</th>
                  <th>Brief</th>
                  <th>Files</th>
                  <th>Status</th>
                  <th>Batch</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="a in filteredBookings"
                  :key="a.id"
                  draggable="true"
                  :class="{ handled: a.isApproved, 'on-batch': pinnedAdvertIds.has(String(a.id)) }"
                  @dragstart="onDragStart($event, a)"
                >
                  <td class="chk-col">
                    <input
                      type="checkbox"
                      :checked="a.isApproved"
                      :disabled="a.isApproved"
                      title="Handled — click the ↺ to unmark (requires verification)"
                      @click="$emit('toggle-handled', a.id)"
                    >
                    <button
                      v-if="a.isApproved"
                      class="unmark-btn"
                      title="Unmark as complete (requires BC code verification)"
                      @click="$emit('request-unmark', a)"
                    >↺</button>
                  </td>
                  <td class="mono ref-cell">{{ a.reference }}</td>
                  <td class="mono bc-cell">{{ a.bcReference }}</td>
                  <td class="title-cell">{{ a.advertTitle }}</td>
                  <td>{{ a.clientName }}</td>
                  <td class="adsize-cell">{{ a.adSize }}</td>
                  <td class="mono amount-cell">{{ formatCurrency(a.totalAmount) }}</td>
                  <td class="vcenter">
                    <button v-if="a.hasBrief" class="brief-btn" title="View brief" @click="$emit('view-brief', a)">📝</button>
                    <span v-else class="files-none">—</span>
                  </td>
                  <td class="vcenter">
                    <button v-if="a.attachmentsCount > 0" class="files-badge" title="View attached files" @click="$emit('view-attachments', a)">
                      📎 {{ a.attachmentsCount }}
                    </button>
                    <span v-else class="files-none">—</span>
                  </td>
                  <td class="vcenter">
                    <span class="status-pill" :class="scheduledFor(a) ? 'scheduled' : 'needs'">
                      {{ scheduledFor(a) ? '✓ Sched' : 'Needs' }}
                    </span>
                  </td>
                  <td class="batch-col vcenter">
                    <span
                      v-if="pinnedAdvertIds.has(String(a.id))"
                      class="dd-btn xsmall ghost"
                      style="cursor:default;color:var(--dd-green);border-color:var(--dd-green);"
                    >✓ In batch</span>
                    <button
                      v-else
                      class="dd-btn xsmall primary"
                      :disabled="!(a.pendingDates || []).includes(activeDate)"
                      :title="!(a.pendingDates || []).includes(activeDate) ? `Not booked (or already scheduled) for ${activeDate}` : ''"
                      @click="$emit('add-to-board', a)"
                    >⊕ Batch</button>
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-if="filteredBookings.length === 0" class="dd-sheet-empty">No adverts match that filter.</div>
          </div>

          <!-- RIGHT: Layout Board panel — same components the main page uses -->
          <div class="dd-sheet-batch">
            <div class="dd-batch-head">
              <div class="name">📋 {{ activeBatch ? activeBatch.label : 'Current Batch' }}</div>
              <div class="meta" v-if="activeBatch">{{ activeBatch.reference }} · {{ activeBatch.status }}</div>
              <div class="meta" v-else>No active batch yet — add a row to start one.</div>
            </div>
            <div class="dd-batch-body">
              <div v-if="scanFeedback" class="dd-scan-feedback" :class="scanFeedback.type">
                {{ scanFeedback.message }}
              </div>
              <template v-if="activeBatch">
                <FileGroupCard
                  v-for="group in activeBatch.fileGroups"
                  :key="group.id"
                  :group="group"
                  @upload-file="file => $emit('upload-file', { groupId: group.id, file })"
                  @remove-advert="advertId => $emit('remove-advert', { groupId: group.id, advertId })"
                  @remove-group="$emit('remove-group', group.id)"
                  @assign-advert="advertId => $emit('assign-advert-to-group', { groupId: group.id, advertId })"
                  @scan-advert="value => onScanAdvert(group.id, value)"
                />
                <button class="dd-btn ghost" style="width:100%;justify-content:center;" @click="$emit('add-group')">
                  + New Ad Slot
                </button>
              </template>
              <div v-else class="dd-sheet-empty" style="padding:24px 8px;">
                Drag a row onto this panel, or click "+ Batch" on a row, to start today's batch.
              </div>
            </div>
          </div>

        </div>

        <div class="dd-sheet-foot">
          <div class="left">Drag a row onto a group on the right, or use the ⊕ Batch button. Design files can be attached to a group now or later.</div>
        </div>

      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, ref } from 'vue'
import FileGroupCard from '../FileGroupCard.vue'
import AssignBar from './AssignBar.vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  bookings: { type: Array, default: () => [] },       // day's adverts — same array DesignDeskWorkspace already loads
  activeBatch: { type: Object, default: null },        // getBatchDetail shape — same one already in DesignDeskWorkspace
  pendingAssignAdvert: { type: Object, default: null }, // same ref DesignDeskWorkspace already has
  activeDate: { type: String, default: null },         // targetRunDate / selectedDate, for the "+ Batch" enabled check
  dateLabel: { type: String, default: '' },
  productLabel: { type: String, default: null },       // selected product name, for header display only — filtering itself happens server-side before `bookings` arrives
})

const emit = defineEmits([
  'close',
  'view-brief',
  'view-attachments',
  'add-to-board',          // same event QueueCard emits — opens AssignBar via existing onAddToBoard
  'assign',                // AssignBar -> assignToGroup(groupId)
  'assign-new',             // AssignBar -> assignToNewGroup()
  'cancel-assign',          // AssignBar -> pendingAssignAdvert = null
  'assign-advert-to-group', // FileGroupCard drop-an-advert path (bypasses AssignBar)
  'upload-file',             // FileGroupCard -> onGroupFile
  'remove-advert',           // FileGroupCard -> onGroupRemoveAdvert
  'remove-group',            // FileGroupCard -> onRemoveGroup
  'add-group',               // "+ New Ad Slot" -> addEmptyGroup
  'toggle-handled',          // checkbox -> markDesignComplete
  'request-unmark',          // ↺ button -> parent opens UnmarkCompleteModal (two-step verified)
])

const filterText = ref('')

const filteredBookings = computed(() => {
  const q = filterText.value.toLowerCase().trim()
  if (!q) return props.bookings
  return props.bookings.filter(a =>
    (a.reference || '').toLowerCase().includes(q) ||
    (a.bcReference || '').toLowerCase().includes(q)
  )
})

const handledCount = computed(() => props.bookings.filter(a => a.isApproved).length)

// Every advert id already pinned into any ad slot on the active batch —
// same computation DesignDeskWorkspace already does for QueueCard's on-layout prop.
const pinnedAdvertIds = computed(() => {
  const ids = new Set()
  ;(props.activeBatch?.fileGroups || []).forEach(g => {
    (g.adverts || []).forEach(a => ids.add(String(a.id)))
  })
  return ids
})
const inBatchCount = computed(() => pinnedAdvertIds.value.size)

function scheduledFor(a) {
  return a.scheduledForThisDate ?? (props.activeDate ? a.scheduledDates?.includes(props.activeDate) : false)
}

function formatCurrency(amount) {
  if (!amount && amount !== 0) return 'UGX 0'
  return new Intl.NumberFormat('en-UG', {
    style: 'currency', currency: 'UGX', minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount)
}

function onDragStart(evt, advert) {
  evt.dataTransfer.setData('text/plain', String(advert.id))
  evt.dataTransfer.effectAllowed = 'move'
}

// ── Scan to add ─────────────────────────────────────────────────────────
// Resolves a scanned/typed code (system reference or BC reference — see
// FileGroupCard's comment on why both are checked) against the day's full
// booking list, then re-emits the SAME 'assign-advert-to-group' event the
// drag-and-drop path already uses — so from DesignDeskWorkspace's
// perspective, a scan is indistinguishable from a drag: same handler
// (assignAdvertDirectly), same server-side validation, nothing new to wire.
const scanFeedback = ref(null)
let scanFeedbackTimer = null

function flashScanFeedback(type, message) {
  clearTimeout(scanFeedbackTimer)
  scanFeedback.value = { type, message }
  scanFeedbackTimer = setTimeout(() => { scanFeedback.value = null }, 4000)
}

function onScanAdvert(groupId, rawValue) {
  const q = rawValue.trim().toLowerCase()

  const match = props.bookings.find(a =>
    (a.reference || '').toLowerCase() === q ||
    (a.bcReference || '').toLowerCase() === q
  )

  if (!match) {
    flashScanFeedback('error', `No booking for "${rawValue}" today — check the code and try again.`)
    return
  }

  if (pinnedAdvertIds.value.has(String(match.id))) {
    flashScanFeedback('error', `${match.reference} is already in the batch.`)
    return
  }

  emit('assign-advert-to-group', { groupId, advertId: match.id })
  flashScanFeedback('success', `Added ${match.reference} — ${match.advertTitle}`)
}

// ── Excel export ────────────────────────────────────────────────────────
// Exports whatever's currently filtered — no separate "selection" concept,
// since the checkbox here means Handled, not "chosen for export".
async function exportExcel() {
  const XLSX = await import('xlsx')
  const rows = filteredBookings.value.map(a => ({
    'Reference': a.reference,
    'BC Reference': a.bcReference,
    'Advert Title': a.advertTitle,
    'Client': a.clientName,
    'Ad Size': a.adSize,
    'Total Amount': a.totalAmount,
    'Attachments': a.attachmentsCount,
    'Status': scheduledFor(a) ? 'Scheduled' : 'Needs Design',
    'Handled': a.isApproved ? 'Yes' : 'No',
  }))
  const ws = XLSX.utils.json_to_sheet(rows)
  ws['!cols'] = [
    { wch: 22 }, { wch: 16 }, { wch: 40 }, { wch: 18 },
    { wch: 30 }, { wch: 14 }, { wch: 12 }, { wch: 14 }, { wch: 10 },
  ]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Design Queue')
  const dateSuffix = props.activeDate || new Date().toISOString().split('T')[0]
  XLSX.writeFile(wb, `design-queue-${dateSuffix}.xlsx`)
}
</script>

<style scoped>
.dd-modal-backdrop{
  position:fixed; inset:0; background:rgba(28,27,24,.5);
  display:none; align-items:center; justify-content:center; padding:22px; z-index:1000;
}
.dd-modal-backdrop.open{ display:flex; }
.dd-sheet-modal{
  background:var(--dd-parch, #f6f3ec); border:1px solid var(--dd-rule-strong, #b7ae97); border-radius:3px;
  width:80vw; min-width:820px; height:90vh; display:flex; flex-direction:column;
  box-shadow:0 20px 60px rgba(0,0,0,.3);
}

.dd-sheet-head{
  display:flex; align-items:center; justify-content:space-between;
  padding:14px 22px; border-bottom:1px solid var(--dd-rule-strong, #b7ae97);
  background:var(--dd-navy, #003366); border-radius:3px 3px 0 0;
}
.dd-sheet-head h3{ margin:0; font-family:'Source Serif 4',serif; font-size:17px; font-weight:600; color:#fff; }
.dd-sheet-head .sub{ font-family:'IBM Plex Mono',monospace; font-size:10.5px; color:rgba(255,255,255,.6); margin-top:2px; }
.dd-modal-close{ cursor:pointer; font-size:22px; color:rgba(255,255,255,.7); background:none; border:none; line-height:1; }
.dd-modal-close:hover{ color:#fff; }

.dd-sheet-toolbar{
  display:flex; align-items:center; gap:12px; padding:10px 22px;
  border-bottom:1px solid var(--dd-rule, #d9d3c3); background:var(--dd-card, #fffdf8); flex-wrap:wrap;
}
.dd-sheet-filter{ position:relative; flex:1; min-width:220px; max-width:340px; }
.dd-sheet-filter input{
  width:100%; height:32px; padding:0 28px 0 28px; border:1px solid var(--dd-rule-strong, #b7ae97);
  border-radius:2px; font-family:'IBM Plex Mono',monospace; font-size:12px; background:#fff;
}
.dd-sheet-filter input:focus{ outline:none; border-color:var(--dd-blue, #1c3fa8); box-shadow:0 0 0 3px var(--dd-blue-soft, #e7ecfb); }
.dd-sheet-filter .icon{ position:absolute; left:9px; top:50%; transform:translateY(-50%); color:var(--dd-ink-soft, #6b6658); font-size:12.5px; pointer-events:none; }
.dd-sheet-filter .clear{ position:absolute; right:6px; top:50%; transform:translateY(-50%); background:none; border:none; font-size:15px; color:var(--dd-ink-soft, #6b6658); cursor:pointer; display:none; }
.dd-sheet-filter.has-value .clear{ display:block; }
.dd-sheet-filter-hint{ font-size:10px; color:var(--dd-ink-soft, #6b6658); }
.dd-sheet-count{
  margin-left:auto; font-family:'IBM Plex Mono',monospace; font-size:11px; color:var(--dd-ink-soft, #6b6658);
  background:var(--dd-parch, #f6f3ec); border:1px solid var(--dd-rule, #d9d3c3); padding:4px 9px; border-radius:2px;
}
.dd-sheet-count b{ color:var(--dd-ink, #1c1b18); }

.dd-btn{
  font-family:'IBM Plex Sans',sans-serif; font-size:12px; font-weight:600;
  padding:7px 12px; border-radius:2px; border:1px solid var(--dd-ink, #1c1b18);
  background:var(--dd-card, #fffdf8); color:var(--dd-ink, #1c1b18); cursor:pointer;
  display:inline-flex; align-items:center; gap:5px; white-space:nowrap;
}
.dd-btn:disabled{ opacity:.4; cursor:not-allowed; }
.dd-btn.xsmall{ padding:3px 7px; font-size:10.5px; }
.dd-btn.primary{ background:var(--dd-blue, #1c3fa8); border-color:var(--dd-blue, #1c3fa8); color:#fff; }
.dd-btn.green{ background:var(--dd-green, #2f6f4f); border-color:var(--dd-green, #2f6f4f); color:#fff; }
.dd-btn.green:hover:not(:disabled){ background:#255a3f; }
.dd-btn.ghost{ background:transparent; }
.dd-btn.ghost:hover{ background:var(--dd-parch, #f6f3ec); }

.dd-sheet-split{ flex:1; display:flex; overflow:hidden; }
.dd-sheet-queue{ flex:1 1 62%; overflow:auto; border-right:1px solid var(--dd-rule-strong, #b7ae97); }
.dd-sheet-batch{ flex:1 1 38%; overflow-y:auto; background:#efe9d8; display:flex; flex-direction:column; }

.dd-batch-head{
  padding:12px 16px 10px; border-bottom:1px solid var(--dd-rule-strong, #b7ae97);
  background:var(--dd-card, #fffdf8); position:sticky; top:0; z-index:2;
}
.dd-batch-head .name{ font-family:'Source Serif 4',serif; font-weight:600; font-size:14.5px; }
.dd-batch-head .meta{ font-family:'IBM Plex Mono',monospace; font-size:10.5px; color:var(--dd-ink-soft, #6b6658); margin-top:2px; }
.dd-batch-body{ padding:12px 14px; display:flex; flex-direction:column; gap:10px; flex:1; }
.dd-scan-feedback{
  font-size:11.5px; padding:7px 10px; border-radius:2px; line-height:1.4;
}
.dd-scan-feedback.success{ background:var(--dd-green-soft, #e5efe9); color:var(--dd-green, #2f6f4f); border:1px solid var(--dd-green, #2f6f4f); }
.dd-scan-feedback.error{ background:#FCE4D6; color:#9C0006; border:1px solid #E31E24; }

table.dd-sheet-tbl{ width:100%; border-collapse:collapse; font-size:12px; table-layout:fixed; }
.dd-sheet-tbl thead th{
  position:sticky; top:0; z-index:2;
  text-align:left; font-size:10px; text-transform:uppercase; letter-spacing:.05em;
  color:var(--dd-ink-soft, #6b6658); background:var(--dd-parch, #f6f3ec);
  padding:9px 8px; border-bottom:2px solid var(--dd-rule-strong, #b7ae97); white-space:nowrap;
}
.dd-sheet-tbl td{
  padding:7px 8px; border-bottom:1px solid var(--dd-rule, #d9d3c3); vertical-align:top;
  white-space:normal; word-break:break-word; overflow-wrap:break-word;
}
.dd-sheet-tbl tbody tr{ cursor:grab; }
.dd-sheet-tbl tbody tr:nth-child(even){ background:#faf8f2; }
.dd-sheet-tbl tbody tr:hover{ background:var(--dd-blue-soft, #e7ecfb); }
.dd-sheet-tbl tbody tr.handled{ opacity:.5; }
.dd-sheet-tbl tbody tr.handled .title-cell{ text-decoration:line-through; }
.dd-sheet-tbl tbody tr.on-batch{ background:#e5efe9 !important; }

.mono{ font-family:'IBM Plex Mono',monospace; }
.ref-cell{ color:var(--dd-ink, #1c1b18); }
.bc-cell{ color:var(--dd-blue, #1c3fa8); }
.title-cell{ font-weight:500; line-height:1.35; }
.adsize-cell{ line-height:1.35; color:var(--dd-ink-soft, #6b6658); }
.amount-cell{ text-align:right; font-weight:600; white-space:nowrap; }
.chk-col{ width:52px; text-align:center; vertical-align:middle; }
.unmark-btn{
  margin-left: 4px; background: none; border: 1px solid var(--dd-rule-strong, #b7ae97);
  border-radius: 2px; color: var(--dd-ink-soft, #6b6658); font-size: 11px; line-height: 1;
  width: 18px; height: 18px; cursor: pointer; padding: 0; vertical-align: middle;
}
.unmark-btn:hover{ background: #FCE4D6; border-color: #E31E24; color: #9C0006; }
.vcenter{ vertical-align:middle; }
.batch-col{ width:76px; vertical-align:middle; }

.files-badge{
  font-family:'IBM Plex Mono',monospace; font-size:10px; font-weight:600;
  padding:2px 6px; border-radius:2px; border:1px solid var(--dd-amber, #a3691a); color:var(--dd-amber, #a3691a);
  background:var(--dd-amber-soft, #f6ecdb); cursor:pointer;
}
.files-badge:hover{ background:#efd9b3; }
.brief-btn{
  background:var(--dd-blue-soft, #e7ecfb); border:1px solid rgba(28,63,168,.25); color:var(--dd-blue, #1c3fa8);
  border-radius:2px; padding:2px 6px; font-size:11.5px; cursor:pointer;
}
.brief-btn:hover{ background:#d9e2f8; }
.files-none{ color:var(--dd-ink-soft, #6b6658); font-size:10.5px; }

.status-pill{
  font-family:'IBM Plex Mono',monospace; font-size:9.5px; font-weight:600; letter-spacing:.03em;
  padding:2px 6px; border-radius:2px; text-transform:uppercase; white-space:nowrap;
}
.status-pill.needs{ color:var(--dd-amber, #a3691a); background:var(--dd-amber-soft, #f6ecdb); }
.status-pill.scheduled{ color:var(--dd-green, #2f6f4f); background:var(--dd-green-soft, #e5efe9); }

input[type="checkbox"]{ width:14px; height:14px; accent-color:var(--dd-green, #2f6f4f); cursor:pointer; }

.dd-sheet-empty{ padding:40px; text-align:center; color:var(--dd-ink-soft, #6b6658); font-style:italic; }

.dd-sheet-foot{
  display:flex; align-items:center; padding:10px 22px;
  border-top:1px solid var(--dd-rule-strong, #b7ae97); background:var(--dd-card, #fffdf8);
  border-radius:0 0 3px 3px;
}
.dd-sheet-foot .left{ font-size:10.5px; color:var(--dd-ink-soft, #6b6658); }
</style>