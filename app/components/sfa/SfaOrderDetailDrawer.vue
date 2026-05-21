<!-- components/sfa/SfaOrderDetailDrawer.vue -->
<!-- Full order detail view.
     When a BC client is linked, displays fields that mirror the clients collection:
     company_name, bc_no, contact_person, payment_terms, credit_approved, credit_limit.
     If no BC client: shows advisory + option to request account creation.
     All data via useSfaOrders composable. -->
<template>
  <Teleport to="body">
    <Transition name="slide">
      <div v-if="modelValue" class="drawer-overlay" @click.self="close">
        <div class="drawer">

          <!-- Header -->
          <div class="drawer-header">
            <div class="dh-left">
              <div class="dh-order-id">ORDER</div>
              <div class="dh-num">{{ order?.order_number || '…' }}</div>
            </div>
            <div class="dh-right">
              <SfaStatusBadge
                v-if="order?.status"
                :status="order.status"
                :map="ORDER_STATUSES"
              />
              <button class="dh-close" @click="close">✕</button>
            </div>
          </div>

          <!-- Loading -->
          <div v-if="loading" class="state-loading"><div class="spinner" /></div>

          <template v-else-if="order">
            <div class="drawer-body">

              <!-- ── BC Client section ─────────────────────────────────── -->
              <div class="section-title">Business Central Client</div>

              <!-- Matched client — reuse fields from clients schema -->
              <div v-if="order.client" class="bc-card bc-card--matched">
                <div class="bc-badge">✅ Client found in BC</div>
                <div class="bc-grid">
                  <div class="bc-row">
                    <span class="bk">Company Name</span>
                    <span class="bv bv--strong">{{ order.client.company_name }}</span>
                  </div>
                  <div class="bc-row">
                    <span class="bk">BC Number</span>
                    <span class="bv bv--mono bv--blue">{{ order.client.bc_no || '—' }}</span>
                  </div>
                  <div class="bc-row" v-if="order.client.contact_person">
                    <span class="bk">Contact Person</span>
                    <span class="bv">{{ order.client.contact_person }}</span>
                  </div>
                  <div class="bc-row" v-if="order.client.phone">
                    <span class="bk">Phone</span>
                    <span class="bv">{{ order.client.phone }}</span>
                  </div>
                  <div class="bc-row" v-if="order.client.email">
                    <span class="bk">Email</span>
                    <span class="bv">{{ order.client.email }}</span>
                  </div>
                  <div class="bc-row">
                    <span class="bk">Payment Terms</span>
                    <span class="bv">{{ paymentTermsLabel(order.client.payment_terms) }}</span>
                  </div>
                  <div class="bc-row">
                    <span class="bk">Credit Approved</span>
                    <span class="bv" :class="order.client.credit_approved ? 'bv--green' : 'bv--grey'">
                      {{ order.client.credit_approved ? 'Yes' : 'No' }}
                    </span>
                  </div>
                  <div class="bc-row" v-if="order.client.credit_approved && order.client.credit_limit">
                    <span class="bk">Credit Limit</span>
                    <span class="bv bv--mono">UGX {{ Number(order.client.credit_limit).toLocaleString() }}</span>
                  </div>
                  <div class="bc-row" v-if="order.client.clientTin">
                    <span class="bk">TIN</span>
                    <span class="bv bv--mono">{{ order.client.clientTin }}</span>
                  </div>
                </div>
              </div>

              <!-- Not matched: account creation advisory -->
              <div v-else class="bc-card bc-card--advisory">
                <div class="bc-advisory-icon">⚠️</div>
                <div class="bc-advisory-body">
                  <div class="bc-advisory-title">No BC client account found</div>
                  <p class="bc-advisory-text">
                    <strong>{{ order.opportunity?.company?.company_name }}</strong> does not yet have
                    a client account in Business Central. Invoicing cannot proceed until the account
                    is created by the Finance / Admin team.
                  </p>
                  <div class="bc-advisory-status">
                    <template v-if="order.client_account_requested">
                      <span class="req-badge">📩 Account creation requested on {{ formatDate(order.client_account_request_date) }}</span>
                    </template>
                    <button
                      v-else
                      class="btn-request"
                      :disabled="requesting"
                      @click="doRequestCreation"
                    >
                      {{ requesting ? 'Sending…' : '📩 Request client account creation' }}
                    </button>
                  </div>
                </div>
              </div>

              <!-- ── Order info ────────────────────────────────────────── -->
              <div class="section-title mt">Order Details</div>
              <div class="info-grid">
                <div class="info-row">
                  <span class="ik">Order Number</span>
                  <span class="iv iv--mono iv--blue">{{ order.order_number }}</span>
                </div>
                <div class="info-row">
                  <span class="ik">Opportunity</span>
                  <span class="iv">{{ order.opportunity?.title }}</span>
                </div>
                <div class="info-row">
                  <span class="ik">Company</span>
                  <span class="iv">{{ order.opportunity?.company?.company_name }}</span>
                </div>
                <div class="info-row">
                  <span class="ik">Confirmation Type</span>
                  <span class="iv">{{ confirmationLabel(order.confirmation_type) }}</span>
                </div>
                <div class="info-row">
                  <span class="ik">Converted By</span>
                  <span class="iv">{{ order.converted_by?.username || '—' }}</span>
                </div>
                <div class="info-row">
                  <span class="ik">Converted Date</span>
                  <span class="iv">{{ formatDate(order.converted_date) }}</span>
                </div>
                <div class="info-row" v-if="order.notes">
                  <span class="ik">Notes</span>
                  <span class="iv">{{ order.notes }}</span>
                </div>
              </div>

              <!-- ── Accepted quotation summary ─────────────────────────── -->
              <div class="section-title mt" v-if="order.accepted_quotation">Accepted Quotation</div>
              <div v-if="order.accepted_quotation" class="quot-summary">
                <div class="qs-header">
                  <span class="qs-num">{{ order.accepted_quotation.quotation_number }}</span>
                  <span class="qs-amount">UGX {{ Number(order.accepted_quotation.total_amount || 0).toLocaleString() }}</span>
                </div>
                <div v-if="order.accepted_quotation.items?.length" class="qs-items">
                  <div v-for="item in order.accepted_quotation.items" :key="item.id" class="qs-item">
                    <span>{{ item.description || item.buy_in?.name }}</span>
                    <span class="qs-sub">{{ item.quantity }} × {{ Number(item.unit_price || 0).toLocaleString() }}</span>
                  </div>
                </div>
              </div>

              <!-- ── Contacts ──────────────────────────────────────────── -->
              <div class="section-title mt" v-if="order.opportunity?.contacts?.length">Contacts</div>
              <div v-for="c in order.opportunity?.contacts" :key="c.id" class="contact-chip">
                <div class="cc-name">{{ c.full_name }}</div>
                <div class="cc-meta">{{ c.position }}{{ c.position && c.phone ? ' · ' : '' }}{{ c.phone }}</div>
              </div>

              <!-- ── Status update ─────────────────────────────────────── -->
              <div class="section-title mt">Update Status</div>
              <div class="status-pills">
                <button
                  v-for="(meta, key) in ORDER_STATUSES"
                  :key="key"
                  class="status-pill"
                  :class="{ 'status-pill--active': order.status === key }"
                  :style="order.status === key
                    ? { background: meta.bg, color: meta.color, borderColor: meta.color + '44' }
                    : {}"
                  :disabled="updating || order.status === key"
                  @click="updateStatus(key)"
                >
                  {{ meta.label }}
                </button>
              </div>

            </div>
          </template>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue'
import SfaStatusBadge from './SfaStatusBadge.vue'
import { useSfaOrders, ORDER_STATUSES, CONFIRMATION_TYPES } from '~/composables/useSfaOrders'

const props = defineProps({
  modelValue: Boolean,
  orderId:    { type: [Number, String], required: true },
})
const emit = defineEmits(['update:modelValue', 'updated'])

const { fetchOrderDetail, requestClientAccountCreation, updateOrderStatus } = useSfaOrders()

const order     = ref(null)
const loading   = ref(false)
const requesting = ref(false)
const updating   = ref(false)

async function load() {
  loading.value = true
  try { order.value = await fetchOrderDetail(props.orderId) }
  finally { loading.value = false }
}

async function doRequestCreation() {
  requesting.value = true
  try {
    await requestClientAccountCreation(props.orderId)
    // Refresh to show updated state
    await load()
    emit('updated')
  } finally {
    requesting.value = false
  }
}

async function updateStatus(status) {
  updating.value = true
  try {
    await updateOrderStatus(props.orderId, status)
    await load()
    emit('updated')
  } finally {
    updating.value = false
  }
}

function close() { emit('update:modelValue', false) }

function paymentTermsLabel(terms) {
  const MAP = {
    cash: 'Cash', credit_7: 'Credit 7 days', credit_15: 'Credit 15 days',
    credit_30: 'Credit 30 days', pdc: 'PDC',
  }
  return MAP[terms] || terms || '—'
}

function confirmationLabel(type) {
  return CONFIRMATION_TYPES.find(t => t.id === type)?.label || type || '—'
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

watch(() => props.modelValue, v => { if (v) load() })
</script>

<style scoped>
.drawer-overlay {
  position: fixed; inset: 0; z-index: 7500;
  background: rgba(10,20,40,0.35);
}
.drawer {
  position: absolute; top: 0; right: 0; bottom: 0;
  width: 540px; max-width: 100vw;
  background: #FFFFFF; display: flex; flex-direction: column;
  box-shadow: -4px 0 30px rgba(13,24,48,0.14);
  font-family: 'IBM Plex Sans', sans-serif; overflow: hidden;
}

/* Header */
.drawer-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px; border-bottom: 1px solid #D5DDEF;
  background: #003366; flex-shrink: 0;
}
.dh-order-id {
  font-family: 'IBM Plex Mono', monospace; font-size: 10px;
  font-weight: 600; color: #7BA9D5; letter-spacing: 1px; margin-bottom: 3px;
}
.dh-num {
  font-family: 'IBM Plex Mono', monospace; font-size: 18px;
  font-weight: 700; color: #FFFFFF;
}
.dh-right { display: flex; align-items: center; gap: 10px; }
.dh-close {
  background: none; border: none; color: #7BA9D5;
  font-size: 16px; cursor: pointer; padding: 2px 6px;
}
.dh-close:hover { color: #FFFFFF; }

.state-loading {
  flex: 1; display: flex; align-items: center; justify-content: center;
}
.spinner {
  width: 28px; height: 28px; border-radius: 50%;
  border: 3px solid #D5DDEF; border-top-color: #003366;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.drawer-body { flex: 1; overflow-y: auto; padding: 20px; }

.section-title {
  font-size: 9px; font-weight: 700; letter-spacing: 1.5px;
  text-transform: uppercase; color: #8094B8;
  margin-bottom: 10px; font-family: 'IBM Plex Mono', monospace;
}
.section-title.mt { margin-top: 22px; }

/* BC client card */
.bc-card {
  border-radius: 6px; padding: 14px; margin-bottom: 4px;
}
.bc-card--matched  { background: #EDFAF2; border: 1.5px solid #24A14833; }
.bc-card--advisory { background: #FFF8E6; border: 1.5px solid #B07D1033;
  display: flex; gap: 12px; }

.bc-badge {
  font-size: 11px; font-weight: 700; color: #1A8A3C;
  margin-bottom: 10px; display: block;
}

.bc-grid { display: flex; flex-direction: column; gap: 0; }
.bc-row  {
  display: flex; justify-content: space-between; align-items: baseline;
  padding: 5px 0; border-bottom: 1px solid #D0F5E233; font-size: 12px;
}
.bc-row:last-child { border-bottom: none; }
.bk { color: #1A8A3C88; font-weight: 600; }
.bv { color: #0D4A28; font-weight: 500; text-align: right; }
.bv--strong { font-weight: 700; color: #003366; }
.bv--mono   { font-family: 'IBM Plex Mono', monospace; }
.bv--blue   { color: #003366; }
.bv--green  { color: #1A8A3C; font-weight: 700; }
.bv--grey   { color: #8094B8; }

/* Advisory */
.bc-advisory-icon { font-size: 24px; flex-shrink: 0; }
.bc-advisory-title { font-size: 13px; font-weight: 700; color: #0D1830; margin-bottom: 6px; }
.bc-advisory-text  { font-size: 12px; color: #3B4F70; line-height: 1.6; margin-bottom: 10px; }
.req-badge {
  display: inline-block; background: #EDFAF2; color: #1A8A3C;
  border-radius: 4px; padding: 5px 10px; font-size: 11px; font-weight: 600;
}
.btn-request {
  padding: 7px 14px; border-radius: 4px; font-size: 12px; font-weight: 600;
  background: #003366; color: #fff; border: none; cursor: pointer; font-family: inherit;
}
.btn-request:hover    { background: #002244; }
.btn-request:disabled { background: #8094B8; cursor: default; }

/* Info grid */
.info-grid { display: flex; flex-direction: column; }
.info-row  {
  display: flex; justify-content: space-between; align-items: flex-start;
  padding: 6px 0; border-bottom: 1px solid #F0F4FA; font-size: 12px;
}
.ik { color: #8094B8; font-weight: 600; }
.iv { color: #0D1830; font-weight: 500; text-align: right; max-width: 60%; }
.iv--mono { font-family: 'IBM Plex Mono', monospace; }
.iv--blue { color: #003366; font-weight: 700; }

/* Quotation summary */
.quot-summary {
  border: 1.5px solid #D5DDEF; border-radius: 4px; overflow: hidden;
}
.qs-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 8px 12px; background: #F7F9FC; border-bottom: 1px solid #D5DDEF;
}
.qs-num    { font-family: 'IBM Plex Mono', monospace; font-size: 12px; font-weight: 700; color: #003366; }
.qs-amount { font-family: 'IBM Plex Mono', monospace; font-size: 14px; font-weight: 700; color: #003366; }
.qs-items  { padding: 8px 12px; }
.qs-item   {
  display: flex; justify-content: space-between;
  font-size: 11px; color: #3B4F70; padding: 3px 0;
  border-bottom: 1px solid #EEF2F8;
}
.qs-item:last-child { border-bottom: none; }
.qs-sub { font-family: 'IBM Plex Mono', monospace; color: #8094B8; }

/* Contacts */
.contact-chip {
  border: 1.5px solid #D5DDEF; border-radius: 4px; padding: 8px 10px; margin-bottom: 6px;
}
.cc-name { font-size: 12px; font-weight: 600; color: #0D1830; }
.cc-meta { font-size: 11px; color: #8094B8; margin-top: 2px; }

/* Status pills */
.status-pills { display: flex; flex-wrap: wrap; gap: 6px; }
.status-pill {
  padding: 6px 14px; border-radius: 20px; font-size: 11px; font-weight: 600;
  border: 1.5px solid #D5DDEF; background: none; color: #3B4F70;
  cursor: pointer; font-family: inherit; transition: all 0.12s;
}
.status-pill:hover:not(:disabled) { border-color: #8094B8; color: #0D1830; }
.status-pill--active { font-weight: 700; }
.status-pill:disabled { opacity: 0.6; cursor: default; }

/* Slide transition */
.slide-enter-active, .slide-leave-active { transition: transform 0.22s ease; }
.slide-enter-from, .slide-leave-to       { transform: translateX(100%); }
</style>
