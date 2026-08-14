<!-- components/editor/PaidAdvertsModal.vue -->
<!--
  Read-only replica of the Design Desk's spreadsheet view (QueueSheetModal.vue)
  for the editor: shows every advert paid to run on a chosen date, exactly as
  Design House sees it, via the same /design-house/adverts/by-date endpoint —
  same visual language, same table columns, minus everything assignment-
  related (the "Handled" checkbox, the drag-and-drop batch panel, AssignBar,
  FileGroupCard, "+ Batch"). Fully self-contained: owns its own date/category/
  product selection and fetches its own data, rather than being fed props by
  a parent workspace the way QueueSheetModal is.

  Classified adverts get a highlighted row (amber left border + tint) plus an
  explicit "Classified" tag, so relying on color alone isn't the only signal.
-->
<template>
  <Teleport to="body">
    <div class="pam-backdrop" :class="{ open: !!open }" @click.self="$emit('close')">
      <div class="pam-modal" v-if="open">

        <div class="pam-head">
          <div>
            <h3>Paid Adverts — {{ dateLabel }}</h3>
            <div class="sub">
              {{ bookings.length }} advert{{ bookings.length !== 1 ? 's' : '' }}
              <span v-if="selectedProductId"> · {{ selectedProductName }}</span>
              <span v-if="classifiedCount"> · {{ classifiedCount }} classified</span>
            </div>
          </div>
          <button class="pam-close" @click="$emit('close')">&times;</button>
        </div>

        <div class="pam-toolbar">
          <div class="pam-field">
            <label>Date</label>
            <input type="date" v-model="selectedDate" class="pam-input">
          </div>

          <div class="pam-field">
            <label>Category</label>
            <select v-model="selectedCategoryType" class="pam-input">
              <option v-if="categories.length === 0" value="print">Print</option>
              <option value="all">All</option>
              <option v-for="c in categories" :key="c.id" :value="c.type">{{ c.name }}</option>
            </select>
          </div>

          <div class="pam-field">
            <label>Product</label>
            <select v-model="selectedProductId" class="pam-input" :disabled="productsLoading">
              <option :value="''">All products</option>
              <option v-for="p in products" :key="p.id" :value="p.id">{{ p.name }}</option>
            </select>
          </div>

          <div class="pam-filter" :class="{ 'has-value': !!filterText }">
            <span class="icon">⌕</span>
            <input v-model.trim="filterText" type="text" placeholder="Filter by ADV, BC code, client or title…">
            <button v-if="filterText" class="clear" @click="filterText = ''">&times;</button>
          </div>

          <span class="pam-count">
            <b>{{ scheduledCount }}</b> scheduled · <b>{{ needsDesignCount }}</b> needs design
          </span>

          <button class="pam-btn green" :disabled="bookings.length === 0" @click="exportExcel">⬇ Export to Excel</button>
        </div>

        <div class="pam-body">
          <div v-if="loading" class="pam-msg">Loading…</div>
          <div v-else-if="loadError" class="pam-msg pam-msg--error">{{ loadError }}</div>
          <template v-else>
            <table class="pam-tbl">
              <colgroup>
                <col style="width:130px">
                <col style="width:110px">
                <col style="width:22%">
                <col style="width:16%">
                <col style="width:110px">
                <col style="width:90px">
                <col style="width:46px">
                <col style="width:52px">
                <col style="width:90px">
                <col style="width:80px">
              </colgroup>
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>BC Reference</th>
                  <th>Advert Title</th>
                  <th>Client</th>
                  <th>Ad Size</th>
                  <th>Total</th>
                  <th>Brief</th>
                  <th>Files</th>
                  <th>Status</th>
                  <th>Handled</th>
                </tr>
              </thead>
              <tbody>
                <template v-for="a in filteredBookings" :key="a.id">
                  <tr :class="{ classified: isClassifiedAdvert(a) }">
                    <td class="mono ref-cell">{{ a.reference }}</td>
                    <td class="mono bc-cell">{{ a.bcReference }}</td>
                    <td class="title-cell">
                      {{ a.advertTitle }}
                      <span v-if="isClassifiedAdvert(a)" class="classified-tag">Classified</span>
                    </td>
                    <td>{{ a.clientName }}</td>
                    <td class="adsize-cell">{{ a.adSize }}</td>
                    <td class="mono amount-cell">{{ formatCurrency(a.totalAmount) }}</td>
                    <td class="vcenter">
                      <button v-if="a.hasBrief" class="brief-btn" title="View brief" @click="toggleBrief(a.id)">📝</button>
                      <span v-else class="none-cell">—</span>
                    </td>
                    <td class="vcenter">
                      <button v-if="a.attachmentsCount > 0" class="files-badge" :title="`${a.attachmentsCount} file(s)`" @click="viewingFilesAdvert = a">
                        📎 {{ a.attachmentsCount }}
                      </button>
                      <span v-else class="none-cell">—</span>
                    </td>
                    <td class="vcenter">
                      <span class="status-pill" :class="scheduledFor(a) ? 'scheduled' : 'needs'">
                        {{ scheduledFor(a) ? '✓ Sched' : 'Needs' }}
                      </span>
                    </td>
                    <td class="vcenter">
                      <span class="status-pill" :class="a.isApproved ? 'scheduled' : 'pending'">
                        {{ a.isApproved ? '✓ Yes' : 'Pending' }}
                      </span>
                    </td>
                  </tr>
                  <tr v-if="expandedBriefId === a.id" class="brief-row">
                    <td colspan="10">
                      <div class="brief-box">{{ a.specialInstructions || '—' }}</div>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
            <div v-if="filteredBookings.length === 0" class="pam-empty">
              No paid adverts match {{ filterText ? 'that filter' : 'this date/product' }}.
            </div>
          </template>
        </div>

        <div class="pam-foot">
          <div class="left">Read-only — this is exactly what Design House sees for this date. To make changes, use the Schedule Queue.</div>
        </div>

      </div>
    </div>
  </Teleport>

  <!-- Reused as-is (not modified) - its `advert` prop shape ({ reference,
       attachments }) matches our booking objects exactly, so the selected
       booking is passed straight through with no mapping needed -->
  <AttachmentsModal
    :advert="viewingFilesAdvert"
    @close="viewingFilesAdvert = null"
  />
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useDesignHouseView, isClassifiedAdvert } from '~/composables/useDesignHouseView'
import AttachmentsModal from './AttachmentsModal.vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  // Optional initial date - defaults to today if omitted
  initialDate: { type: String, default: null },
})
const emit = defineEmits(['close'])

const dh = useDesignHouseView()

const todayStr = () => new Date().toISOString().split('T')[0]
const selectedDate = ref(props.initialDate || todayStr())
const selectedCategoryType = ref('print')
const selectedProductId = ref('')
const categories = ref([])
const products = ref([])
const productsLoading = ref(false)

const bookings = ref([])
const loading = ref(false)
const loadError = ref('')

const filterText = ref('')
const expandedBriefId = ref(null)
const viewingFilesAdvert = ref(null)

const selectedProductName = computed(() => {
  const p = products.value.find(p => p.id === selectedProductId.value)
  return p?.name || ''
})

const dateLabel = computed(() => {
  if (!selectedDate.value) return ''
  try {
    return new Date(selectedDate.value).toLocaleDateString('en-UG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return selectedDate.value
  }
})

const filteredBookings = computed(() => {
  const q = filterText.value.toLowerCase().trim()
  if (!q) return bookings.value
  return bookings.value.filter(a =>
    (a.reference || '').toLowerCase().includes(q) ||
    (a.bcReference || '').toLowerCase().includes(q) ||
    (a.clientName || '').toLowerCase().includes(q) ||
    (a.advertTitle || '').toLowerCase().includes(q)
  )
})

const classifiedCount = computed(() => bookings.value.filter(isClassifiedAdvert).length)
const scheduledCount = computed(() => bookings.value.filter(a => scheduledFor(a)).length)
const needsDesignCount = computed(() => bookings.value.length - scheduledCount.value)

function scheduledFor(a) {
  return a.scheduledForThisDate ?? (selectedDate.value ? a.scheduledDates?.includes(selectedDate.value) : false)
}

function toggleBrief(advertId) {
  expandedBriefId.value = expandedBriefId.value === advertId ? null : advertId
}

function formatCurrency(amount) {
  if (!amount && amount !== 0) return 'UGX 0'
  return new Intl.NumberFormat('en-UG', {
    style: 'currency', currency: 'UGX', minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount)
}

async function loadCategories() {
  try {
    categories.value = await dh.fetchProductCategories()
  } catch (e) {
    // non-fatal - Category select falls back to the built-in Print/All options
  }
}

async function loadProducts(scope) {
  productsLoading.value = true
  selectedProductId.value = ''
  try {
    products.value = await dh.fetchProducts(scope === 'all' ? 'all' : scope)
  } catch (e) {
    products.value = []
  } finally {
    productsLoading.value = false
  }
}

async function loadBookings() {
  if (!selectedDate.value) return
  loading.value = true
  loadError.value = ''
  try {
    bookings.value = await dh.fetchAdvertsByDate(selectedDate.value, {
      productId: selectedProductId.value || undefined,
      scope: 'all', // date/product already scope this precisely - avoid double-constraining via category
    })
  } catch (e) {
    loadError.value = e?.data?.message || e?.message || 'Failed to load adverts for this date'
    bookings.value = []
  } finally {
    loading.value = false
  }
}

watch(selectedCategoryType, (scope) => { loadProducts(scope) })
watch([selectedDate, selectedProductId], () => { loadBookings() })
watch(() => props.open, (isOpen) => {
  if (isOpen) {
    expandedBriefId.value = null
    viewingFilesAdvert.value = null
    loadCategories()
    loadProducts(selectedCategoryType.value)
  }
})

onMounted(() => {
  if (props.open) {
    loadCategories()
    loadProducts(selectedCategoryType.value)
  }
})

// ── Excel export ──────────────────────────────────────────────────────────
async function exportExcel() {
  const XLSX = await import('xlsx')
  const rows = filteredBookings.value.map(a => ({
    'Reference': a.reference,
    'BC Reference': a.bcReference,
    'Advert Title': a.advertTitle,
    'Client': a.clientName,
    'Ad Size': a.adSize,
    'Total Amount': a.totalAmount,
    'Classified': isClassifiedAdvert(a) ? 'Yes' : 'No',
    'Attachments': a.attachmentsCount,
    'Status': scheduledFor(a) ? 'Scheduled' : 'Needs Design',
    'Handled': a.isApproved ? 'Yes' : 'No',
  }))
  const ws = XLSX.utils.json_to_sheet(rows)
  ws['!cols'] = [
    { wch: 22 }, { wch: 16 }, { wch: 40 }, { wch: 18 },
    { wch: 30 }, { wch: 14 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 10 },
  ]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Paid Adverts')
  XLSX.writeFile(wb, `paid-adverts-${selectedDate.value}.xlsx`)
}
</script>

<style scoped>
.pam-backdrop{
  position:fixed; inset:0; background:rgba(28,27,24,.5);
  display:none; align-items:center; justify-content:center; padding:22px; z-index:1000;
}
.pam-backdrop.open{ display:flex; }
.pam-modal{
  background:var(--dd-parch, #f6f3ec); border:1px solid var(--dd-rule-strong, #b7ae97); border-radius:3px;
  width:84vw; min-width:820px; height:88vh; display:flex; flex-direction:column;
  box-shadow:0 20px 60px rgba(0,0,0,.3);
}

.pam-head{
  display:flex; align-items:center; justify-content:space-between;
  padding:14px 22px; border-bottom:1px solid var(--dd-rule-strong, #b7ae97);
  background:var(--dd-navy, #003366); border-radius:3px 3px 0 0;
}
.pam-head h3{ margin:0; font-family:'Source Serif 4',serif; font-size:17px; font-weight:600; color:#fff; }
.pam-head .sub{ font-family:'IBM Plex Mono',monospace; font-size:10.5px; color:rgba(255,255,255,.6); margin-top:2px; }
.pam-close{ cursor:pointer; font-size:22px; color:rgba(255,255,255,.7); background:none; border:none; line-height:1; }
.pam-close:hover{ color:#fff; }

.pam-toolbar{
  display:flex; align-items:flex-end; gap:12px; padding:10px 22px;
  border-bottom:1px solid var(--dd-rule, #d9d3c3); background:var(--dd-card, #fffdf8); flex-wrap:wrap;
}
.pam-field{ display:flex; flex-direction:column; gap:3px; }
.pam-field label{ font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.4px; color:var(--dd-ink-soft, #6b6658); }
.pam-input{
  height:32px; padding:0 8px; border:1px solid var(--dd-rule-strong, #b7ae97);
  border-radius:2px; font-family:'IBM Plex Sans',sans-serif; font-size:12px; background:#fff; color:var(--dd-ink, #1c1b18);
}
.pam-input:focus{ outline:none; border-color:var(--dd-blue, #1c3fa8); box-shadow:0 0 0 3px var(--dd-blue-soft, #e7ecfb); }

.pam-filter{ position:relative; flex:1; min-width:200px; max-width:320px; }
.pam-filter input{
  width:100%; height:32px; padding:0 28px 0 28px; border:1px solid var(--dd-rule-strong, #b7ae97);
  border-radius:2px; font-family:'IBM Plex Mono',monospace; font-size:12px; background:#fff;
}
.pam-filter input:focus{ outline:none; border-color:var(--dd-blue, #1c3fa8); box-shadow:0 0 0 3px var(--dd-blue-soft, #e7ecfb); }
.pam-filter .icon{ position:absolute; left:9px; top:50%; transform:translateY(-50%); color:var(--dd-ink-soft, #6b6658); font-size:12.5px; pointer-events:none; }
.pam-filter .clear{ position:absolute; right:6px; top:50%; transform:translateY(-50%); background:none; border:none; font-size:15px; color:var(--dd-ink-soft, #6b6658); cursor:pointer; display:none; }
.pam-filter.has-value .clear{ display:block; }

.pam-count{
  margin-left:auto; font-family:'IBM Plex Mono',monospace; font-size:11px; color:var(--dd-ink-soft, #6b6658);
  background:var(--dd-parch, #f6f3ec); border:1px solid var(--dd-rule, #d9d3c3); padding:4px 9px; border-radius:2px;
  white-space:nowrap;
}
.pam-count b{ color:var(--dd-ink, #1c1b18); }

.pam-btn{
  font-family:'IBM Plex Sans',sans-serif; font-size:12px; font-weight:600;
  padding:7px 12px; border-radius:2px; border:1px solid var(--dd-ink, #1c1b18);
  background:var(--dd-card, #fffdf8); color:var(--dd-ink, #1c1b18); cursor:pointer;
  display:inline-flex; align-items:center; gap:5px; white-space:nowrap;
}
.pam-btn:disabled{ opacity:.4; cursor:not-allowed; }
.pam-btn.green{ background:var(--dd-green, #2f6f4f); border-color:var(--dd-green, #2f6f4f); color:#fff; }
.pam-btn.green:hover:not(:disabled){ background:#255a3f; }

.pam-body{ flex:1; overflow:auto; }
.pam-msg{ padding:40px; text-align:center; color:var(--dd-ink-soft, #6b6658); }
.pam-msg--error{ color:#9C0006; }

table.pam-tbl{ width:100%; border-collapse:collapse; font-size:12px; table-layout:fixed; }
.pam-tbl thead th{
  position:sticky; top:0; z-index:2;
  text-align:left; font-size:10px; text-transform:uppercase; letter-spacing:.05em;
  color:var(--dd-ink-soft, #6b6658); background:var(--dd-parch, #f6f3ec);
  padding:9px 8px; border-bottom:2px solid var(--dd-rule-strong, #b7ae97); white-space:nowrap;
}
.pam-tbl td{
  padding:7px 8px; border-bottom:1px solid var(--dd-rule, #d9d3c3); vertical-align:top;
  white-space:normal; word-break:break-word; overflow-wrap:break-word;
}
.pam-tbl tbody tr:nth-child(even){ background:#faf8f2; }
.pam-tbl tbody tr:hover{ background:var(--dd-blue-soft, #e7ecfb); }

/* Classified highlight - amber left border + tint, same visual language
   used elsewhere in this codebase for "needs attention"/grouped rows */
.pam-tbl tbody tr.classified{
  background:var(--dd-amber-soft, #f6ecdb) !important;
  box-shadow: inset 3px 0 0 var(--dd-amber, #a3691a);
}
.classified-tag{
  display:inline-block; margin-left:6px; font-size:9px; font-weight:700; letter-spacing:.03em;
  text-transform:uppercase; color:var(--dd-amber, #a3691a); background:#fff;
  border:1px solid var(--dd-amber, #a3691a); border-radius:2px; padding:1px 5px; vertical-align:middle;
}

.mono{ font-family:'IBM Plex Mono',monospace; }
.ref-cell{ color:var(--dd-ink, #1c1b18); }
.bc-cell{ color:var(--dd-blue, #1c3fa8); }
.title-cell{ font-weight:500; line-height:1.35; }
.adsize-cell{ line-height:1.35; color:var(--dd-ink-soft, #6b6658); }
.amount-cell{ text-align:right; font-weight:600; white-space:nowrap; }
.vcenter{ vertical-align:middle; }

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
.none-cell{ color:var(--dd-ink-soft, #6b6658); font-size:10.5px; }

.brief-row td{ background:#fff; padding:0; border-bottom:1px solid var(--dd-rule, #d9d3c3); }
.brief-box{ padding:10px 16px; font-size:12px; line-height:1.5; color:var(--dd-ink, #1c1b18); white-space:pre-wrap; }

.status-pill{
  font-family:'IBM Plex Mono',monospace; font-size:9.5px; font-weight:600; letter-spacing:.03em;
  padding:2px 6px; border-radius:2px; text-transform:uppercase; white-space:nowrap;
}
.status-pill.needs{ color:var(--dd-amber, #a3691a); background:var(--dd-amber-soft, #f6ecdb); }
.status-pill.scheduled{ color:var(--dd-green, #2f6f4f); background:var(--dd-green-soft, #e5efe9); }
.status-pill.pending{ color:var(--dd-ink-soft, #6b6658); background:var(--dd-rule, #d9d3c3); }

.pam-empty{ padding:40px; text-align:center; color:var(--dd-ink-soft, #6b6658); font-style:italic; }

.pam-foot{
  display:flex; align-items:center; padding:10px 22px;
  border-top:1px solid var(--dd-rule-strong, #b7ae97); background:var(--dd-card, #fffdf8);
  border-radius:0 0 3px 3px;
}
.pam-foot .left{ font-size:10.5px; color:var(--dd-ink-soft, #6b6658); }
</style>