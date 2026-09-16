<!--
  AdvertLedgerDetail.vue

  A wide, spread-out popup showing one advert's full ledger: client &
  contact, advert & booking, pricing & payment, and schedule - everything
  the compact calendar row can't fit. Triggered from FutureAdvertsCalendar
  (or anywhere else that has a full advert record) by passing it in as a
  prop; stacks on top of whatever opened it.

  Self-contained like its sibling components: owns its own icons, status/
  currency formatting, and - via useAdvertPdf - the ability to download or
  print the same PDF layout used everywhere else in the app.

  Props:
    advert - the full advert record (as returned by getScheduleAdverts /
             getDateRangeAdverts), or null/undefined to render nothing.
  Emits:
    close - requested to be dismissed.
-->
<template>
  <div v-if="advert" class="ald-overlay" @click.self="$emit('close')">
    <div class="ald-modal">
      <div class="ald-head">
        <div class="ald-head-main">
          <span class="ald-ref">{{ advert.reference || 'DRAFT' }}</span>
          <span v-if="advert.bcReference" class="ald-bc-ref">BC {{ advert.bcReference }}</span>
          <span class="ald-status-badge" :class="`ald-status--${getStatusClass(advert.status)}`">
            {{ getStatusLabel(advert.status) }}
          </span>
        </div>
        <button class="ald-close" @click="$emit('close')" title="Close">
          <CloseGlyph />
        </button>
      </div>

      <div class="ald-title-line">{{ advert.advertTitle || 'Untitled advert' }}</div>

      <div class="ald-body">
        <div class="ald-grid">
          <!-- ── Client & Contact ── -->
          <section class="ald-card">
            <h3 class="ald-card-title">Client & Contact</h3>
            <dl class="ald-fields">
              <div class="ald-field"><dt>Client</dt><dd>{{ advert.clientName || advert.client?.name || '—' }}</dd></div>
              <div class="ald-field"><dt>Contact Person</dt><dd>{{ advert.contactPerson || advert.client?.contactPerson || '—' }}</dd></div>
              <div class="ald-field"><dt>Email</dt><dd>{{ advert.contactEmail || advert.client?.email || '—' }}</dd></div>
              <div class="ald-field"><dt>Phone</dt><dd>{{ advert.contactNumber || advert.client?.phone || '—' }}</dd></div>
              <div class="ald-field"><dt>Client Ref No</dt><dd>{{ advert.clientRefNo || '—' }}</dd></div>
              <div class="ald-field"><dt>Market Sector</dt><dd>{{ advert.marketSector || '—' }}</dd></div>
              <div v-if="advert.client?.address" class="ald-field"><dt>Address</dt><dd>{{ advert.client.address }}</dd></div>
              <div v-if="advert.client?.bcNo" class="ald-field"><dt>Client BC No</dt><dd>{{ advert.client.bcNo }}</dd></div>
            </dl>
          </section>

          <!-- ── Advert & Booking ── -->
          <section class="ald-card">
            <h3 class="ald-card-title">Advert & Booking</h3>
            <dl class="ald-fields">
              <div class="ald-field"><dt>Product</dt><dd class="ald-strong">{{ advert.product?.name || '—' }}</dd></div>
              <div class="ald-field"><dt>Ad Definition</dt><dd class="ald-strong">{{ advert.adSize || '—' }}</dd></div>
              <div class="ald-field"><dt>Color/Type</dt><dd class="ald-strong">{{ formatColorType(advert.adType) }}</dd></div>
              <div class="ald-field"><dt>Rate Card</dt><dd>{{ rateCardLabel }}</dd></div>
              <div class="ald-field"><dt>Frequency</dt><dd>{{ advert.frequency || '—' }}</dd></div>
              <div class="ald-field"><dt>Office Location</dt><dd>{{ advert.officeLocation || '—' }}</dd></div>
              <div class="ald-field"><dt>Captured By</dt><dd>{{ advert.createdBy?.name || '—' }}</dd></div>
              <div class="ald-field"><dt>Sales Agent(s)</dt><dd>{{ salesAgentsLabel }}</dd></div>
              <div v-if="advert.revenueStream" class="ald-field"><dt>Revenue Stream</dt><dd>{{ advert.revenueStream }}</dd></div>
              <div v-if="advert.costStream" class="ald-field"><dt>Cost Stream</dt><dd>{{ advert.costStream }}</dd></div>
            </dl>
          </section>

          <!-- ── Pricing & Payment ── -->
          <section class="ald-card">
            <h3 class="ald-card-title">Pricing & Payment</h3>
            <dl class="ald-fields">
              <div class="ald-field"><dt>Base Price</dt><dd>{{ formatCurrency(advert.basePrice) }}</dd></div>
              <div class="ald-field"><dt>Surcharge</dt><dd>{{ formatCurrency(advert.surcharge) }}</dd></div>
              <div class="ald-field"><dt>Discount</dt><dd>{{ Number(advert.discount || 0).toFixed(1) }}%</dd></div>
              <div class="ald-field"><dt>Total Amount</dt><dd class="ald-strong">{{ formatCurrency(advert.totalAmount) }}</dd></div>
              <div class="ald-field"><dt>Payment Method</dt><dd>{{ formatPaymentMethod(advert.paymentMethod) }}</dd></div>
              <div class="ald-field">
                <dt>Payment Status</dt>
                <dd><span class="ald-pay-badge" :class="advert.isPaid ? 'ald-pay--paid' : 'ald-pay--unpaid'">{{ advert.isPaid ? 'Paid' : 'Unpaid' }}</span></dd>
              </div>
            </dl>
          </section>

          <!-- ── Schedule ── -->
          <section class="ald-card">
            <h3 class="ald-card-title">Schedule</h3>
            <dl class="ald-fields">
              <div class="ald-field"><dt>Start Date</dt><dd>{{ formatDate(advert.startDate) }}</dd></div>
              <div class="ald-field"><dt>End Date</dt><dd>{{ formatDate(advert.endDate) }}</dd></div>
            </dl>
            <div v-if="publishingDatesList.length" class="ald-date-chips">
              <span v-for="d in publishingDatesList" :key="d" class="ald-date-chip">{{ formatDate(d) }}</span>
            </div>
          </section>
        </div>

        <!-- ── Special Instructions ── -->
        <section v-if="advert.specialInstructions" class="ald-card ald-card--full">
          <h3 class="ald-card-title">Special Instructions</h3>
          <p class="ald-instructions">{{ advert.specialInstructions }}</p>
        </section>
      </div>

      <div v-if="pdfError" class="ald-error">{{ pdfError }}</div>

      <div class="ald-actions">
        <button class="ald-btn ald-btn--ghost" :disabled="pdfBusy" @click="handleDownload">
          <DownloadGlyph /> {{ pdfBusy === 'download' ? 'Preparing…' : 'Download PDF' }}
        </button>
        <button class="ald-btn ald-btn--ghost" :disabled="pdfBusy" @click="handlePrint">
          <PrintGlyph /> {{ pdfBusy === 'print' ? 'Preparing…' : 'Print' }}
        </button>
        <button class="ald-btn ald-btn--primary" @click="openInEditor">
          <ExternalGlyph /> Open in Booking Editor
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, h } from 'vue'
import { useRouter } from '#imports'
import { useAdvertPdf } from '~/composables/useAdvertPdf'

const props = defineProps({
  advert: {
    type: Object,
    default: null,
  },
})
defineEmits(['close'])

const router = useRouter()
const { downloadAdvertPdf, printAdvertPdf } = useAdvertPdf()

const pdfBusy = ref(null) // null | 'download' | 'print'
const pdfError = ref(null)

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount || 0)

const formatDate = (dateValue) => {
  if (!dateValue) return '—'
  const d = new Date(dateValue)
  if (isNaN(d.getTime())) return String(dateValue)
  return d.toLocaleDateString('en-UG', { month: 'short', day: 'numeric', year: 'numeric' })
}

const formatColorType = (colorType) => {
  if (colorType === 'full_color') return 'Full Color'
  if (colorType === 'black_white') return 'Black & White'
  return colorType || '—'
}

const formatPaymentMethod = (method) => method ? method.replace(/_/g, ' ') : '—'

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

const rateCardLabel = computed(() => {
  const rc = props.advert?.rateCard
  if (!rc) return '—'
  const parts = [rc.adType, rc.sizeDimension].filter(Boolean)
  return parts.length ? parts.join(' · ') : '—'
})

const salesAgentsLabel = computed(() => {
  const agents = props.advert?.salesAgents || []
  return agents.length ? agents.map((a) => a.name).filter(Boolean).join(', ') : '—'
})

const publishingDatesList = computed(() => {
  const advert = props.advert
  if (!advert) return []
  if (advert.publishingDates && advert.publishingDates.length) return advert.publishingDates
  return [advert.startDate, advert.endDate].filter(Boolean)
})

// Same normalized shape useAdvertPdf expects everywhere else in the app -
// see useAdvertPdf.js's own header comment for the full field list.
const buildPdfData = (advert) => ({
  systemReference: advert.reference,
  bcReference: advert.bcReference,
  statusLabel: getStatusLabel(advert.status),
  clientName: advert.clientName || advert.client?.name,
  contactPerson: advert.contactPerson || advert.client?.contactPerson,
  contactEmail: advert.contactEmail || advert.client?.email,
  contactPhone: advert.contactNumber || advert.client?.phone,
  clientRefNo: advert.clientRefNo,
  marketSector: advert.marketSector,
  advertTitle: advert.advertTitle,
  product: advert.product?.name,
  adSize: advert.adSize,
  colorType: advert.adType,
  salesAgent: (advert.salesAgents || []).map((a) => a.name).filter(Boolean).join(', '),
  officeLocation: advert.officeLocation,
  basePrice: advert.basePrice || 0,
  surcharge: advert.surcharge || 0,
  discountPercent: advert.discount || 0,
  totalAmount: advert.totalAmount || 0,
  paymentMethod: advert.paymentMethod,
  paymentStatus: advert.isPaid ? 'Paid' : 'Unpaid',
  publishingDates: advert.publishingDates || [],
  specialInstructions: advert.specialInstructions,
  filename: `advert-${advert.reference || advert.id}.pdf`,
})

const handleDownload = async () => {
  if (!props.advert) return
  pdfBusy.value = 'download'
  pdfError.value = null
  try {
    await downloadAdvertPdf(buildPdfData(props.advert))
  } catch (err) {
    pdfError.value = 'Failed to generate PDF. Make sure "jsbarcode" and "qrcode" are installed.'
    console.error('PDF generation failed:', err)
  } finally {
    pdfBusy.value = null
  }
}

const handlePrint = async () => {
  if (!props.advert) return
  pdfBusy.value = 'print'
  pdfError.value = null
  try {
    await printAdvertPdf(buildPdfData(props.advert))
  } catch (err) {
    if (err?.message === 'POPUP_BLOCKED') {
      pdfError.value = 'Please allow pop-ups for this site to print.'
    } else {
      pdfError.value = 'Failed to generate PDF. Make sure "jsbarcode" and "qrcode" are installed.'
      console.error('PDF generation failed:', err)
    }
  } finally {
    pdfBusy.value = null
  }
}

const openInEditor = () => {
  if (!props.advert) return
  router.push(`/dashboard/booking/edit/${props.advert.id}?mode=view`)
}

// Local, dependency-free icons.
const svgIcon = (children) =>
  h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, children)
const CloseGlyph = () => svgIcon([h('line', { x1: 18, y1: 6, x2: 6, y2: 18 }), h('line', { x1: 6, y1: 6, x2: 18, y2: 18 })])
const DownloadGlyph = () => svgIcon([
  h('path', { d: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4' }),
  h('polyline', { points: '7 10 12 15 17 10' }),
  h('line', { x1: 12, y1: 15, x2: 12, y2: 3 }),
])
const PrintGlyph = () => svgIcon([
  h('polyline', { points: '6 9 6 2 18 2 18 9' }),
  h('path', { d: 'M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2' }),
  h('rect', { x: 6, y: 14, width: 12, height: 8 }),
])
const ExternalGlyph = () => svgIcon([
  h('path', { d: 'M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6' }),
  h('polyline', { points: '15 3 21 3 21 9' }),
  h('line', { x1: 10, y1: 14, x2: 21, y2: 3 }),
])
</script>

<style scoped>
.ald-overlay {
  position: fixed; inset: 0; background: rgba(15, 23, 42, 0.55);
  display: flex; align-items: center; justify-content: center;
  z-index: 1100; padding: 1.5rem;
}
.ald-modal {
  background: var(--surface, #fff); border-radius: var(--radius, 8px);
  width: 100%; max-width: 880px; max-height: 92vh; overflow-y: auto;
  box-shadow: var(--shadow-md, 0 4px 16px rgba(0,0,0,.08));
  display: flex; flex-direction: column;
}

.ald-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 1.125rem 1.5rem 0;
}
.ald-head-main { display: flex; align-items: center; gap: 0.625rem; flex-wrap: wrap; }
.ald-ref { font-size: 1rem; font-weight: 700; color: var(--ink, #111827); font-family: var(--font-mono, monospace); }
.ald-bc-ref { font-size: 0.75rem; font-weight: 600; color: var(--muted, #6b7280); font-family: var(--font-mono, monospace); }
.ald-close { background: none; border: none; cursor: pointer; color: var(--muted, #6b7280); padding: 0.25rem; flex-shrink: 0; }
.ald-close svg { width: 20px; height: 20px; }

.ald-title-line { padding: 0.375rem 1.5rem 1rem; font-size: 1.0625rem; font-weight: 700; color: var(--navy, #003366); }

.ald-body { padding: 0 1.5rem 1.25rem; display: flex; flex-direction: column; gap: 1rem; }

.ald-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.ald-card {
  border: 1px solid var(--border, #e5e7eb); border-radius: var(--radius, 8px);
  padding: 1rem 1.125rem;
}
.ald-card--full { grid-column: 1 / -1; }
.ald-card-title {
  margin: 0 0 0.75rem; font-size: 0.75rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.04em; color: var(--blue, #2563eb);
}

.ald-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 0.625rem 1rem; margin: 0; }
.ald-field { display: flex; flex-direction: column; gap: 0.125rem; min-width: 0; }
.ald-field dt { font-size: 0.6875rem; color: var(--faint, #9ca3af); font-weight: 600; }
.ald-field dd { margin: 0; font-size: 0.8125rem; color: var(--ink, #111827); overflow-wrap: break-word; }
.ald-strong { font-weight: 700; }

.ald-date-chips { display: flex; flex-wrap: wrap; gap: 0.375rem; margin-top: 0.75rem; }
.ald-date-chip {
  font-size: 0.6875rem; font-weight: 600; font-family: var(--font-mono, monospace);
  background: var(--blue-lt, #eff6ff); color: var(--blue, #2563eb);
  border-radius: 999px; padding: 0.1875rem 0.625rem;
}

.ald-instructions { margin: 0; font-size: 0.8125rem; color: var(--body, #374151); white-space: pre-wrap; line-height: 1.5; }

.ald-pay-badge { font-size: 0.6875rem; font-weight: 700; padding: 0.125rem 0.5rem; border-radius: 999px; }
.ald-pay--paid { background: #dcfce7; color: #166534; }
.ald-pay--unpaid { background: #fef3c7; color: #92400e; }

.ald-status-badge { font-size: 0.6875rem; font-weight: 700; padding: 0.1875rem 0.625rem; border-radius: 999px; white-space: nowrap; }
.ald-status--draft     { background: #fef3c7; color: #92400e; }
.ald-status--pending    { background: #dbeafe; color: #1e40af; }
.ald-status--approved   { background: #dcfce7; color: #166534; }
.ald-status--rejected   { background: #fee2e2; color: #991b1b; }
.ald-status--published  { background: #e0e7ff; color: #3730a3; }
.ald-status--default    { background: #f3f4f6; color: #374151; }

.ald-error {
  margin: 0 1.5rem 1rem; padding: 0.625rem 0.875rem; border-radius: var(--radius, 8px);
  background: #fee2e2; color: #991b1b; font-size: 0.8125rem;
}

.ald-actions {
  display: flex; align-items: center; justify-content: flex-end; gap: 0.625rem;
  padding: 1rem 1.5rem; border-top: 1px solid var(--border, #e5e7eb);
}
.ald-btn {
  display: flex; align-items: center; gap: 0.4375rem;
  font-size: 0.8125rem; font-weight: 600; border-radius: 6px;
  padding: 0.5rem 0.875rem; cursor: pointer; border: 1px solid transparent;
}
.ald-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.ald-btn svg { width: 15px; height: 15px; }
.ald-btn--ghost { background: var(--surface, #fff); color: var(--ink, #111827); border-color: var(--border, #e5e7eb); }
.ald-btn--ghost:hover:not(:disabled) { background: var(--page-bg, #f0f4f8); }
.ald-btn--primary { background: var(--blue, #2563eb); color: #fff; }
.ald-btn--primary:hover { background: #1d4ed8; }

@media (max-width: 640px) {
  .ald-grid { grid-template-columns: 1fr; }
  .ald-fields { grid-template-columns: 1fr; }
  .ald-actions { flex-wrap: wrap; }
  .ald-btn { flex: 1; justify-content: center; }
}
</style>