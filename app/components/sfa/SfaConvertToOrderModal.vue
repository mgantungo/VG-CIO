<!-- components/sfa/SfaConvertToOrderModal.vue -->
<!-- Convert a confirmed (approved) opportunity to an order.
     After conversion the server resolves the client automatically.
     The done phase shows:
       • Green: existing client found and linked (no creation)
       • Blue:  new client record created in VGAMS clients collection
     All API via useSfaOrders composable. -->
<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="modal-backdrop" @click.self="close">
        <div class="modal">

          <!-- Header -->
          <div class="modal-header">
            <div class="modal-header-icon">{{ phase === 'done' ? '🎉' : '📦' }}</div>
            <div>
              <div class="modal-title">
                {{ phase === 'done' ? 'Order Created' : 'Convert to Order' }}
              </div>
              <div class="modal-sub">
                {{ phase === 'done'
                    ? `Order ${createdOrder?.order_number}`
                    : 'Select confirmation type and upload documents' }}
              </div>
            </div>
            <button class="modal-close" @click="close">✕</button>
          </div>

          <!-- ── Phase: form ─────────────────────────────────────────────── -->
          <div v-if="phase === 'form'" class="modal-body">
            <div v-if="submitError" class="error-banner">⚠ {{ submitError }}</div>

            <!-- Confirmation type -->
            <div class="section-label">Confirmation Type <span class="req">*</span></div>
            <div class="type-list">
              <div
                v-for="ct in CONFIRMATION_TYPES"
                :key="ct.id"
                class="type-card"
                :class="{ 'type-card--active': form.confirmationType === ct.id }"
                @click="form.confirmationType = ct.id"
              >
                <div class="type-check">{{ form.confirmationType === ct.id ? '✓' : '' }}</div>
                <span>{{ ct.label }}</span>
              </div>
            </div>
            <div v-if="errors.confirmationType" class="field-error">{{ errors.confirmationType }}</div>

            <!-- Quotation selector -->
            <div class="section-label mt">Accepted Quotation <span class="req">*</span></div>
            <div v-if="!approvedQuotations.length" class="hint">
              No approved quotations found for this opportunity.
            </div>
            <div v-else class="q-list">
              <div
                v-for="q in approvedQuotations"
                :key="q.id"
                class="q-row"
                :class="{ 'q-row--active': form.quotationId === q.documentId }"
                @click="form.quotationId = q.documentId"
              >
                <div class="q-check">{{ form.quotationId === q.documentId ? '✓' : '' }}</div>
                <div class="q-info">
                  <div class="q-num">{{ q.quotation_number }} · v{{ q.version }}</div>
                  <div class="q-amount">UGX {{ Number(q.total_amount || 0).toLocaleString() }}</div>
                </div>
                <SfaStatusBadge :status="q.status" :map="QUOTATION_STATUSES" small />
              </div>
            </div>
            <div v-if="errors.quotationId" class="field-error">{{ errors.quotationId }}</div>

            <!-- Document upload -->
            <div class="section-label mt">Confirmation Document(s)</div>
            <div class="file-zone" @click="$refs.fileInput.click()" @dragover.prevent @drop.prevent="onFileDrop">
              <span class="fz-icon">📎</span>
              <span class="fz-text">Click or drag — LPO, signed quotation, email screenshot</span>
            </div>
            <input ref="fileInput" type="file" multiple style="display:none" @change="onFileChange" />
            <div v-if="confirmationFiles.length" class="file-list">
              <div v-for="(f, i) in confirmationFiles" :key="i" class="file-chip">
                <span>{{ f.name }}</span>
                <button @click="confirmationFiles.splice(i, 1)">✕</button>
              </div>
            </div>

            <!-- Notes -->
            <div class="field mt">
              <label class="field-label">Notes</label>
              <textarea v-model="form.notes" class="field-input field-textarea" rows="2"
                placeholder="Any notes about this conversion…" />
            </div>
          </div>

          <!-- ── Phase: processing ───────────────────────────────────────── -->
          <div v-if="phase === 'processing'" class="modal-body center-body">
            <div class="spinner" />
            <div class="processing-text">Creating order and registering client…</div>
          </div>

          <!-- ── Phase: done ─────────────────────────────────────────────── -->
          <div v-if="phase === 'done'" class="modal-body">

            <!-- Order summary -->
            <div class="order-summary">
              <div class="os-row">
                <span class="os-k">Order #</span>
                <span class="os-v os-v--mono os-v--navy">{{ createdOrder?.order_number }}</span>
              </div>
              <div class="os-row">
                <span class="os-k">Converted</span>
                <span class="os-v">{{ formatDate(createdOrder?.converted_date) }}</span>
              </div>
            </div>

            <!-- Client result -->
            <!-- Existing client — no change to clients collection -->
            <div v-if="resultClient && !clientIsNew" class="client-result client-result--existing">
              <div class="cr-icon">✅</div>
              <div class="cr-body">
                <div class="cr-title">Linked to existing client</div>
                <div class="cr-name">{{ resultClient.company_name }}</div>
                <div class="cr-meta" v-if="resultClient.bc_no">
                  BC No: {{ resultClient.bc_no }}
                </div>
                <div class="cr-meta">
                  Payment terms: {{ paymentTermsLabel(resultClient.payment_terms) }}
                </div>
              </div>
            </div>

            <!-- New client created -->
            <div v-else-if="resultClient && clientIsNew" class="client-result client-result--new">
              <div class="cr-icon">🆕</div>
              <div class="cr-body">
                <div class="cr-title">New client registered</div>
                <div class="cr-name">{{ resultClient.company_name }}</div>
                <p class="cr-note">
                  A new record has been created in the clients list.
                  Payment terms and credit details can be updated by the Finance team.
                </p>
              </div>
            </div>

            <!-- Edge case — no client resolved (should not happen in normal flow) -->
            <div v-else class="client-result client-result--warn">
              <div class="cr-icon">⚠️</div>
              <div class="cr-body">
                <div class="cr-title">No client linked</div>
                <p class="cr-note">The order was created but could not be linked to a client record. Please notify the administrator.</p>
              </div>
            </div>

          </div>

          <!-- Footer -->
          <div class="modal-footer">
            <div class="footer-spacer" />
            <button v-if="phase === 'form'" class="btn-cancel" @click="close">Cancel</button>
            <button
              v-if="phase === 'form'"
              class="btn-submit"
              :disabled="submitting"
              @click="submit"
            >
              {{ submitting ? 'Converting…' : 'Convert to Order' }}
            </button>
            <button v-if="phase === 'done'" class="btn-submit" @click="finish">Done</button>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed } from 'vue'
import SfaStatusBadge from './SfaStatusBadge.vue'
import { useSfaOrders, CONFIRMATION_TYPES } from '~/composables/useSfaOrders'
import { QUOTATION_STATUSES } from '~/composables/useSfaQuotations'

const props = defineProps({
  modelValue:    Boolean,
  opportunityId: { type: [Number, String], required: true },
  /** All quotations for this opportunity — filtered to approved/accepted in computed */
  quotations:    { type: Array, default: () => [] },
})
const emit = defineEmits(['update:modelValue', 'converted'])

const { convertToOrder } = useSfaOrders()

const form = ref({ confirmationType: '', quotationId: null, notes: '' })
const confirmationFiles = ref([])
const errors      = ref({})
const submitError = ref('')
const submitting  = ref(false)

const phase       = ref('form')   // 'form' | 'processing' | 'done'
const createdOrder = ref(null)
const resultClient = ref(null)
const clientIsNew  = ref(false)

// Only offer quotations that are approved or accepted
const approvedQuotations = computed(() =>
  props.quotations.filter(q => ['approved', 'accepted'].includes(q.status))
)

function onFileChange(e)  { confirmationFiles.value.push(...Array.from(e.target.files)) }
function onFileDrop(e)    { confirmationFiles.value.push(...Array.from(e.dataTransfer.files)) }

function validate() {
  errors.value = {}
  if (!form.value.confirmationType) errors.value.confirmationType = 'Please select a confirmation type'
  if (!form.value.quotationId)      errors.value.quotationId      = 'Please select the accepted quotation'
  return !Object.keys(errors.value).length
}

async function submit() {
  if (!validate()) return
  submitting.value  = true
  submitError.value = ''
  phase.value       = 'processing'

  try {
    const result = await convertToOrder({
      opportunityId:     props.opportunityId,
      quotationId:       form.value.quotationId,
      confirmationType:  form.value.confirmationType,
      notes:             form.value.notes,
      confirmationFiles: confirmationFiles.value,
    })

    createdOrder.value = result.order
    resultClient.value = result.client
    clientIsNew.value  = result.clientIsNew

    phase.value = 'done'
    emit('converted', result.order)
  } catch (e) {
    phase.value       = 'form'
    submitError.value = e?.data?.error?.message || 'Conversion failed. Please try again.'
  } finally {
    submitting.value = false
  }
}

function finish() { emit('update:modelValue', false); resetForm() }
function close()  { if (phase.value !== 'processing') { emit('update:modelValue', false); resetForm() } }

function resetForm() {
  form.value          = { confirmationType: '', quotationId: null, notes: '' }
  confirmationFiles.value = []
  errors.value        = {}
  submitError.value   = ''
  phase.value         = 'form'
  createdOrder.value  = null
  resultClient.value  = null
  clientIsNew.value   = false
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function paymentTermsLabel(terms) {
  const MAP = {
    cash: 'Cash', credit_7: 'Credit 7 days', credit_15: 'Credit 15 days',
    credit_30: 'Credit 30 days', pdc: 'PDC',
  }
  return MAP[terms] || terms || '—'
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed; inset: 0; z-index: 8200;
  background: rgba(10,20,40,0.45);
  display: flex; align-items: center; justify-content: center; padding: 20px;
}
.modal {
  background: #FFFFFF; border-radius: 8px;
  width: 100%; max-width: 520px; max-height: 88vh;
  display: flex; flex-direction: column;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
  font-family: 'IBM Plex Sans', sans-serif; overflow: hidden;
}
.modal-header {
  display: flex; align-items: flex-start; gap: 14px;
  padding: 16px 20px; border-bottom: 1px solid #D5DDEF; flex-shrink: 0;
}
.modal-header-icon { font-size: 22px; }
.modal-title  { font-size: 15px; font-weight: 700; color: #003366; }
.modal-sub    { font-size: 11px; color: #8094B8; margin-top: 2px; }
.modal-close  { margin-left: auto; background: none; border: none; font-size: 16px; color: #8094B8; cursor: pointer; }
.modal-close:hover { color: #C9252D; }
.modal-body   { flex: 1; overflow-y: auto; padding: 18px 20px; }

/* Error */
.error-banner {
  background: #FFF0F0; color: #C9252D; border: 1px solid #C9252D33;
  border-radius: 4px; padding: 8px 12px; font-size: 12px; margin-bottom: 14px;
}

/* Section labels */
.section-label {
  font-size: 10px; font-weight: 700; letter-spacing: 1.2px;
  text-transform: uppercase; color: #8094B8;
  margin-bottom: 8px; font-family: 'IBM Plex Mono', monospace;
}
.section-label.mt { margin-top: 18px; }
.req { color: #C9252D; }
.field-error { font-size: 10px; color: #C9252D; margin-top: 2px; }
.hint { font-size: 12px; color: #8094B8; }

/* Confirmation type */
.type-list { display: flex; flex-direction: column; gap: 6px; }
.type-card {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 12px; border: 1.5px solid #D5DDEF;
  border-radius: 4px; cursor: pointer; font-size: 12px; color: #0D1830; transition: all 0.12s;
}
.type-card:hover      { border-color: #0066CC44; background: #F0F4FA; }
.type-card--active    { border-color: #003366; background: #EBF0FF; font-weight: 600; color: #003366; }
.type-check {
  width: 16px; height: 16px; border-radius: 50%;
  border: 1.5px solid #D5DDEF;
  display: flex; align-items: center; justify-content: center;
  font-size: 10px; color: #003366; font-weight: 700; flex-shrink: 0;
}
.type-card--active .type-check { background: #003366; color: #fff; border-color: #003366; }

/* Quotation list */
.q-list { display: flex; flex-direction: column; gap: 6px; }
.q-row  {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 12px; border: 1.5px solid #D5DDEF; border-radius: 4px;
  cursor: pointer; transition: all 0.12s;
}
.q-row:hover    { border-color: #0066CC44; background: #F0F4FA; }
.q-row--active  { border-color: #003366; background: #EBF0FF; }
.q-check {
  width: 16px; height: 16px; border-radius: 50%; border: 1.5px solid #D5DDEF;
  display: flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 700; color: #003366; flex-shrink: 0;
}
.q-row--active .q-check { background: #003366; color: #fff; border-color: #003366; }
.q-info    { flex: 1; }
.q-num     { font-size: 12px; font-weight: 600; color: #0D1830; }
.q-amount  { font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: #8094B8; }

/* File upload */
.file-zone {
  border: 1.5px dashed #D5DDEF; border-radius: 4px;
  padding: 14px; text-align: center; cursor: pointer; transition: border-color 0.12s;
}
.file-zone:hover { border-color: #0066CC; background: #F0F4FA; }
.fz-icon { font-size: 18px; display: block; margin-bottom: 4px; }
.fz-text { font-size: 11px; color: #8094B8; }
.file-list { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
.file-chip {
  display: flex; align-items: center; gap: 6px;
  background: #EEF2F8; border-radius: 3px; padding: 3px 8px;
  font-size: 11px; color: #3B4F70;
}
.file-chip button { background: none; border: none; color: #C9252D; cursor: pointer; font-size: 10px; }

/* Notes field */
.field.mt { margin-top: 14px; display: flex; flex-direction: column; gap: 4px; }
.field-label { font-size: 11px; font-weight: 600; color: #3B4F70; }
.field-input {
  padding: 7px 10px; border: 1.5px solid #D1D9E0; border-radius: 2px;
  font-size: 12px; color: #0D1830; font-family: inherit;
}
.field-input:focus { outline: none; border-color: #0066CC; }
.field-textarea { resize: vertical; min-height: 60px; }

/* Processing spinner */
.center-body {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 16px; min-height: 160px;
}
.spinner {
  width: 36px; height: 36px; border-radius: 50%;
  border: 3px solid #D5DDEF; border-top-color: #003366;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.processing-text { font-size: 12px; color: #8094B8; }

/* Order summary */
.order-summary {
  background: #F7F9FC; border: 1.5px solid #D5DDEF; border-radius: 6px;
  padding: 12px 14px; margin-bottom: 14px;
}
.os-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 12px; }
.os-k { color: #8094B8; font-weight: 600; }
.os-v { color: #0D1830; font-weight: 500; }
.os-v--mono { font-family: 'IBM Plex Mono', monospace; }
.os-v--navy { color: #003366; font-weight: 700; }

/* Client result cards */
.client-result {
  display: flex; gap: 12px; padding: 14px;
  border-radius: 6px; border: 1.5px solid;
}
.client-result--existing { background: #EDFAF2; border-color: #24A14833; }
.client-result--new      { background: #E8F0FB; border-color: #0066CC33; }
.client-result--warn     { background: #FFF8E6; border-color: #F1C21B44; }
.cr-icon  { font-size: 22px; flex-shrink: 0; }
.cr-title { font-size: 12px; font-weight: 700; color: #0D1830; margin-bottom: 3px; }
.cr-name  { font-size: 14px; font-weight: 700; color: #003366; margin-bottom: 4px; }
.cr-meta  { font-size: 11px; color: #3B4F70; }
.cr-note  { font-size: 11px; color: #3B4F70; line-height: 1.6; margin: 6px 0 0; }

/* Footer */
.modal-footer {
  display: flex; gap: 8px; padding: 12px 20px;
  border-top: 1px solid #D5DDEF; flex-shrink: 0;
}
.footer-spacer { flex: 1; }
.btn-cancel {
  padding: 7px 16px; border-radius: 4px; font-size: 12px; font-weight: 600;
  background: none; border: 1.5px solid #D1D9E0; color: #3B4F70; cursor: pointer; font-family: inherit;
}
.btn-submit {
  padding: 7px 20px; border-radius: 4px; font-size: 12px; font-weight: 600;
  background: #003366; color: #fff; border: none; cursor: pointer; font-family: inherit;
}
.btn-submit:hover    { background: #002244; }
.btn-submit:disabled { background: #8094B8; cursor: not-allowed; }

.modal-enter-active, .modal-leave-active { transition: all 0.2s ease; }
.modal-enter-from, .modal-leave-to       { opacity: 0; transform: scale(0.97); }
</style>
