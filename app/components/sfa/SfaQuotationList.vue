<!-- components/sfa/SfaQuotationList.vue -->
<!-- Lists all quotation versions for an opportunity.
     Agents: create / submit. Supervisors/Managers: approve / reject.
     All API via useSfaQuotations composable. -->
<template>
  <div class="quot-list">

    <div class="ql-header">
      <span class="ql-title">Quotations</span>
      <button
        v-if="!opportunity.is_converted && canCreateNew"
        class="btn-new-quot"
        @click="showForm = true"
      >
        ＋ New Quotation
      </button>
    </div>

    <div v-if="loading" class="ql-loading">Loading quotations…</div>

    <div v-else-if="!quotations.length" class="ql-empty">
      No quotations yet. Create the first one.
    </div>

    <div v-else class="ql-versions">
      <div v-for="q in quotations" :key="q.id" class="quot-card">

        <!-- Card header -->
        <div class="qc-header">
          <div class="qc-header-left">
            <span class="qc-num">{{ q.quotation_number }}</span>
            <span class="qc-ver">v{{ q.version }}</span>
          </div>
          <SfaStatusBadge :status="q.status" :map="QUOTATION_STATUSES" small />
        </div>

        <!-- Amount -->
        <div class="qc-amount">UGX {{ Number(q.total_amount || 0).toLocaleString() }}</div>

        <!-- Meta -->
        <div class="qc-meta">
          <span>By {{ q.submitted_by?.username || '—' }}</span>
          <span v-if="q.reviewed_by">· Reviewed by {{ q.reviewed_by.username }}</span>
        </div>

        <div v-if="q.review_comment" class="qc-comment">
          💬 {{ q.review_comment }}
        </div>

        <!-- Line items preview -->
        <div v-if="q.items?.length" class="qc-items">
          <div v-for="item in q.items" :key="item.id" class="qc-item">
            <span>{{ item.description || item.buy_in?.name }}</span>
            <span class="qc-item-sub">{{ item.quantity }} × {{ Number(item.unit_price || 0).toLocaleString() }}</span>
          </div>
        </div>

        <!-- Actions -->
        <div class="qc-actions">

          <!-- Agent actions -->
          <template v-if="isAgent">
            <button
              v-if="q.status === 'draft' || q.status === 'rejected'"
              class="btn-act btn-secondary"
              @click="openSubmit(q)"
            >Submit for Approval</button>
            <button
              v-if="['approved', 'sent_to_client'].includes(q.status)"
              class="btn-act btn-secondary"
              @click="openSend(q)"
            >Record Send</button>
            <button
              v-if="q.status === 'rejected'"
              class="btn-act btn-ghost"
              @click="openRevise(q)"
            >Create Revision</button>
          </template>

          <!-- Supervisor / Manager approval actions -->
          <template v-if="canApprove && q.status === 'pending_approval'">
            <button class="btn-act btn-approve" @click="openApprove(q)">✓ Approve</button>
            <button class="btn-act btn-reject"  @click="openReject(q)">✗ Reject</button>
          </template>

          <!-- PDF upload — quotations are prepared externally and uploaded here -->
          <button
            v-if="['draft', 'approved', 'sent_to_client', 'pending_approval'].includes(q.status)"
            class="btn-act btn-ghost"
            @click="openPdfUpload(q)"
          >📎 Attach Quotation PDF</button>
        </div>

      </div>
    </div>

    <!-- ── Create / Edit Quotation Form ─────────────────────────────── -->
    <SfaQuotationForm
      v-if="showForm"
      :opportunity-id="opportunityId"
      :revision-of="revisedFrom"
      @saved="onFormSaved"
      @cancel="showForm = false; revisedFrom = null"
    />

    <!-- ── Submit confirm ────────────────────────────────────────────── -->
    <div v-if="pendingSubmit" class="inline-confirm">
      <p>Submit <strong>{{ pendingSubmit.quotation_number }}</strong> for approval?</p>
      <div class="ic-actions">
        <button class="btn-act btn-secondary" @click="pendingSubmit = null">Cancel</button>
        <button class="btn-act btn-primary"   :disabled="acting" @click="doSubmit">
          {{ acting ? 'Submitting…' : 'Submit' }}
        </button>
      </div>
    </div>

    <!-- ── Approval / rejection modal ───────────────────────────────── -->
    <div v-if="pendingApproval" class="inline-confirm inline-confirm--wide">
      <p>
        <strong>{{ approvalMode === 'approve' ? 'Approve' : 'Reject' }}</strong>
        {{ pendingApproval.quotation_number }}?
      </p>
      <div class="field">
        <label class="field-label">{{ approvalMode === 'approve' ? 'Comment (optional)' : 'Reason for rejection *' }}</label>
        <textarea v-model="approvalComment" class="field-input" rows="2" />
      </div>
      <div class="ic-actions">
        <button class="btn-act btn-secondary" @click="pendingApproval = null">Cancel</button>
        <button
          v-if="approvalMode === 'approve'"
          class="btn-act btn-approve"
          :disabled="acting"
          @click="doApprove"
        >{{ acting ? '…' : '✓ Approve' }}</button>
        <button
          v-if="approvalMode === 'reject'"
          class="btn-act btn-reject"
          :disabled="acting || !approvalComment.trim()"
          @click="doReject"
        >{{ acting ? '…' : '✗ Reject' }}</button>
      </div>
    </div>

    <!-- ── Record send modal ─────────────────────────────────────────── -->
    <div v-if="pendingSend" class="inline-confirm">
      <p>Record send of <strong>{{ pendingSend.quotation_number }}</strong></p>
      <div class="field">
        <label class="field-label">Channel</label>
        <select v-model="sendChannel" class="field-input">
          <option v-for="ch in SEND_CHANNELS" :key="ch.id" :value="ch.id">{{ ch.label }}</option>
        </select>
      </div>
      <div class="field">
        <label class="field-label">Date sent</label>
        <input v-model="sendDate" class="field-input" type="date" />
      </div>
      <div class="ic-actions">
        <button class="btn-act btn-secondary" @click="pendingSend = null">Cancel</button>
        <button class="btn-act btn-primary" :disabled="acting" @click="doRecordSend">
          {{ acting ? '…' : 'Record' }}
        </button>
      </div>
    </div>

    <!-- ── PDF upload input ──────────────────────────────────────────── -->
    <input ref="pdfInput" type="file" accept="application/pdf" style="display:none" @change="onPdfChange" />

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import SfaStatusBadge  from './SfaStatusBadge.vue'
import SfaQuotationForm from './SfaQuotationForm.vue'
import { useSfaQuotations, QUOTATION_STATUSES, SEND_CHANNELS } from '~/composables/useSfaQuotations'
import { useSfa } from '~/composables/useSfa'

const props = defineProps({
  opportunityId: { type: [Number, String], required: true },
  opportunity:   { type: Object, required: true },
})
const emit = defineEmits(['updated'])

const { quotations, loading, fetchQuotations, submitForApproval,
        approveQuotation, rejectQuotation, reviseQuotation,
        recordSend, uploadPdf, QUOTATION_STATUSES: QS } = useSfaQuotations()

const { isAgent, canApprove } = useSfa()

const showForm    = ref(false)
const revisedFrom = ref(null)
const acting      = ref(false)

const pendingSubmit   = ref(null)
const pendingApproval = ref(null)
const approvalMode    = ref('approve')
const approvalComment = ref('')
const pendingSend     = ref(null)
const sendChannel     = ref('email')
const sendDate        = ref(new Date().toISOString().slice(0, 10))
const pdfInput        = ref(null)
const pendingPdfQuot  = ref(null)

// Only allow creating new quotation if latest is not pending / draft awaiting resubmit
const canCreateNew = computed(() =>
  !quotations.value.length ||
  !['pending_approval', 'approved', 'accepted'].includes(quotations.value[0]?.status)
)

async function load() { await fetchQuotations(props.opportunityId) }

// ── Open helpers ─────────────────────────────────────────────────────────────
function openSubmit(q)  { pendingSubmit.value = q }
function openApprove(q) { pendingApproval.value = q; approvalMode.value = 'approve'; approvalComment.value = '' }
function openReject(q)  { pendingApproval.value = q; approvalMode.value = 'reject';  approvalComment.value = '' }
function openSend(q)    { pendingSend.value = q }
function openRevise(q)  { revisedFrom.value = q; showForm.value = true }
function openPdfUpload(q) { pendingPdfQuot.value = q; pdfInput.value.click() }

// ── Actions ───────────────────────────────────────────────────────────────────
async function doSubmit() {
  acting.value = true
  try {
    await submitForApproval(pendingSubmit.value.id)
    pendingSubmit.value = null
    await load()
    emit('updated')
  } finally { acting.value = false }
}

async function doApprove() {
  acting.value = true
  try {
    await approveQuotation(pendingApproval.value.id, approvalComment.value)
    pendingApproval.value = null
    await load(); emit('updated')
  } finally { acting.value = false }
}

async function doReject() {
  if (!approvalComment.value.trim()) return
  acting.value = true
  try {
    await rejectQuotation(pendingApproval.value.id, approvalComment.value)
    pendingApproval.value = null
    await load(); emit('updated')
  } finally { acting.value = false }
}

async function doRecordSend() {
  acting.value = true
  try {
    await recordSend({ quotationId: pendingSend.value.id, channel: sendChannel.value, sentAt: sendDate.value })
    pendingSend.value = null
    await load(); emit('updated')
  } finally { acting.value = false }
}

async function onPdfChange(e) {
  const file = e.target.files[0]
  if (!file || !pendingPdfQuot.value) return
  await uploadPdf(pendingPdfQuot.value.id, file)
  pendingPdfQuot.value = null
  await load()
}

function onFormSaved() {
  showForm.value  = false
  revisedFrom.value = null
  load()
  emit('updated')
}

onMounted(load)
</script>

<style scoped>
.quot-list { font-family: 'IBM Plex Sans', sans-serif; }

.ql-header {
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;
}
.ql-title { font-size: 12px; font-weight: 700; color: #003366; }
.btn-new-quot {
  padding: 5px 12px; border-radius: 4px; font-size: 11px; font-weight: 600;
  background: #0F62FE; color: #fff; border: none; cursor: pointer; font-family: inherit;
}
.btn-new-quot:hover { background: #0353E9; }

.ql-loading, .ql-empty { font-size: 12px; color: #8094B8; text-align: center; padding: 20px 0; }

/* Quotation cards */
.ql-versions { display: flex; flex-direction: column; gap: 10px; }
.quot-card {
  border: 1.5px solid #D5DDEF; border-radius: 6px; padding: 12px 14px;
  background: #FFFFFF;
}

.qc-header {
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;
}
.qc-header-left { display: flex; align-items: center; gap: 8px; }
.qc-num { font-family: 'IBM Plex Mono', monospace; font-size: 12px; font-weight: 700; color: #003366; }
.qc-ver { font-size: 10px; color: #8094B8; background: #EEF2F8; padding: 1px 6px; border-radius: 3px; }

.qc-amount {
  font-family: 'IBM Plex Mono', monospace; font-size: 16px; font-weight: 700;
  color: #003366; margin: 4px 0;
}

.qc-meta   { font-size: 11px; color: #8094B8; margin-bottom: 4px; }
.qc-comment {
  font-size: 11px; color: #3B4F70; background: #FFF8E6;
  border-left: 3px solid #F1C21B; padding: 5px 8px; margin: 6px 0; border-radius: 0 3px 3px 0;
}

/* Items */
.qc-items { border-top: 1px solid #EEF2F8; margin-top: 8px; padding-top: 8px; }
.qc-item  {
  display: flex; justify-content: space-between;
  font-size: 11px; color: #3B4F70; padding: 3px 0;
}
.qc-item-sub { color: #8094B8; font-family: 'IBM Plex Mono', monospace; }

/* Actions */
.qc-actions { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; border-top: 1px solid #EEF2F8; padding-top: 10px; }
.btn-act {
  padding: 5px 12px; border-radius: 4px; font-size: 11px; font-weight: 600;
  cursor: pointer; font-family: inherit; border: 1.5px solid transparent;
  transition: all 0.12s;
}
.btn-primary   { background: #003366; color: #fff; border-color: #003366; }
.btn-primary:hover { background: #002244; }
.btn-secondary { background: #F0F4FA; color: #3B4F70; border-color: #D5DDEF; }
.btn-secondary:hover { border-color: #8094B8; }
.btn-approve   { background: #EDFAF2; color: #1A8A3C; border-color: #1A8A3C44; }
.btn-approve:hover { background: #D0F5E2; }
.btn-reject    { background: #FFF0F0; color: #C9252D; border-color: #C9252D44; }
.btn-reject:hover  { background: #FFE0E0; }
.btn-ghost     { background: none; color: #8094B8; border-color: #D5DDEF; }
.btn-ghost:hover   { background: #EEF2F8; color: #3B4F70; }
.btn-act:disabled  { opacity: 0.5; cursor: not-allowed; }

/* Inline confirm boxes */
.inline-confirm {
  border: 1.5px solid #D5DDEF; border-radius: 6px; padding: 14px;
  background: #F7F9FC; margin-top: 10px;
}
.inline-confirm--wide { max-width: 100%; }
.inline-confirm p  { font-size: 13px; color: #0D1830; margin-bottom: 10px; }
.ic-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 10px; }

.field { display: flex; flex-direction: column; gap: 4px; margin-top: 8px; }
.field-label { font-size: 11px; font-weight: 600; color: #3B4F70; }
.field-input {
  padding: 6px 10px; border: 1.5px solid #D1D9E0; border-radius: 2px;
  font-size: 12px; color: #0D1830; font-family: inherit; resize: vertical;
}
.field-input:focus { outline: none; border-color: #0066CC; }
</style>
