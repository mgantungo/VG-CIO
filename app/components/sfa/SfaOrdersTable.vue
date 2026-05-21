<!-- components/sfa/SfaOrdersTable.vue -->
<template>
  <div class="orders-view">

    <!-- Toolbar -->
    <div class="toolbar">
      <div class="toolbar-left">
        <span class="toolbar-title">Orders</span>
        <span class="toolbar-count">{{ filtered.length }} order{{ filtered.length !== 1 ? 's' : '' }}</span>
      </div>
      <div class="toolbar-right">
        <div class="search-wrap">
          <span class="si">🔍</span>
          <input v-model="search" class="search-input" placeholder="Search order, company, agent…" />
        </div>
        <!-- Agent filter — supervisor and manager only -->
        <select v-if="canSeeAll || isSupervisor" v-model="agentFilter" class="filter-select">
          <option value="">All agents</option>
          <option v-for="a in uniqueAgents" :key="a.id" :value="a.id">{{ a.name }}</option>
        </select>
        <select v-model="statusFilter" class="filter-select">
          <option value="">All statuses</option>
          <option v-for="(meta, key) in ORDER_STATUSES" :key="key" :value="key">{{ meta.label }}</option>
        </select>
        <button class="btn-refresh" @click="load">↻ Refresh</button>
      </div>
    </div>

    <div v-if="loading" class="state-msg">Loading orders…</div>
    <div v-else-if="!filtered.length" class="state-msg">No orders found.</div>

    <div v-else class="table-wrap">
      <table class="orders-table">
        <thead>
          <tr>
            <th>Order #</th>
            <th>Company / Opportunity</th>
            <th>Client (VGAMS)</th>
            <th>Value (UGX)</th>
            <th>Confirmation</th>
            <th>Sales Agent</th>
            <th>Status</th>
            <th>Converted</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="order in filtered"
            :key="order.id"
            class="order-row"
            @click="openDetail(order)"
          >
            <td class="td-mono td-ordnum">{{ order.order_number }}</td>

            <td>
              <div class="td-company">{{ orderCompanyName(order) }}</div>
              <div class="td-opp">{{ order.opportunity?.title }}</div>
            </td>

            <td>
              <div v-if="order.client" class="client-tag client-tag--ok">
                <span class="client-dot" style="background:#24A148" />
                <div>
                  <div class="client-name">{{ order.client.company_name }}</div>
                  <div v-if="order.client.bc_no" class="client-bc">BC: {{ order.client.bc_no }}</div>
                  <div v-if="order.client_is_new" class="client-new-badge">New record</div>
                </div>
              </div>
              <div v-else class="client-tag client-tag--none">
                <span class="client-dot" style="background:#D1D9E0" />
                <span>Not linked</span>
              </div>
            </td>

            <td class="td-mono">
              {{ order.accepted_quotation?.total_amount
                  ? Number(order.accepted_quotation.total_amount).toLocaleString()
                  : '—' }}
            </td>

            <td>
              <span class="conf-tag">{{ confirmationLabel(order.confirmation_type) }}</span>
            </td>

            <!-- Agent cell — supervisor and manager only -->
            <td>
              <div v-if="order.converted_by" class="agent-cell">
                <div class="agent-avatar">{{ agentInitial(order) }}</div>
                <div>
                  <div class="agent-name">{{ agentName(order) }}</div>
                  <div v-if="order.converted_by?.unit?.name" class="agent-unit">
                    {{ order.converted_by.unit.name }}
                  </div>
                </div>
              </div>
              <span v-else class="td-none">—</span>
            </td>

            <td>
              <SfaStatusBadge :status="order.status" :map="ORDER_STATUSES" small />
            </td>

            <td class="td-date td-mono">{{ formatDate(order.converted_date) }}</td>

            <td class="td-arrow">›</td>
          </tr>
        </tbody>
      </table>
    </div>

    <SfaOrderDetailDrawer
      v-if="selectedOrder"
      v-model="showDetail"
      :order-id="selectedOrder.documentId"
      @updated="load"
    />

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import SfaStatusBadge      from './SfaStatusBadge.vue'
import SfaOrderDetailDrawer from './SfaOrderDetailDrawer.vue'
import { useSfaOrders, ORDER_STATUSES, CONFIRMATION_TYPES } from '~/composables/useSfaOrders'
import { useSfa } from '~/composables/useSfa'

const { orders, loading, fetchOrders } = useSfaOrders()
const { canSeeAll, isSupervisor }      = useSfa()

const search       = ref('')
const statusFilter = ref('')
const agentFilter  = ref('')
const showDetail   = ref(false)
const selectedOrder = ref(null)

// ── Agent helpers — resolved via sfa-agent-profile → vgams_sales_person ──────
function agentName(order) {
  return order.converted_by?.vgams_sales_person?.name || '—'
}
function agentInitial(order) {
  const n = agentName(order)
  return n !== '—' ? n.charAt(0).toUpperCase() : '?'
}

// ── Company name — prefer existing_client, fall back to prospect company ──────
function orderCompanyName(order) {
  return order.opportunity?.existing_client?.company_name
      || order.opportunity?.company?.company_name
      || order.client?.company_name
      || '—'
}

// ── Build unique agent list for the dropdown ──────────────────────────────────
const uniqueAgents = computed(() => {
  const map = {}
  for (const o of orders.value || []) {
    const a = o.converted_by
    if (!a) continue
    const id   = a.documentId
    const name = a.vgams_sales_person?.name || id
    if (!map[id]) map[id] = { id, name }
  }
  return Object.values(map).sort((a, b) => a.name.localeCompare(b.name))
})

// ── Filtered list ─────────────────────────────────────────────────────────────
const filtered = computed(() => {
  let list = orders.value || []
  if (statusFilter.value) list = list.filter(o => o.status === statusFilter.value)
  if (agentFilter.value)  list = list.filter(o => o.converted_by?.documentId === agentFilter.value)
  if (search.value) {
    const q = search.value.toLowerCase()
    list = list.filter(o =>
      (o.order_number || '').toLowerCase().includes(q) ||
      (orderCompanyName(o)).toLowerCase().includes(q) ||
      (o.opportunity?.title || '').toLowerCase().includes(q) ||
      (agentName(o)).toLowerCase().includes(q)
    )
  }
  return list
})

function openDetail(order) { selectedOrder.value = order; showDetail.value = true }
function confirmationLabel(type) { return CONFIRMATION_TYPES.find(t => t.id === type)?.label || type || '—' }
function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
async function load() { await fetchOrders() }
onMounted(load)
</script>

<style scoped>
.orders-view { display: flex; flex-direction: column; height: 100%; font-family: 'IBM Plex Sans', sans-serif; }

.toolbar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 20px; border-bottom: 1px solid #D5DDEF;
  background: #FFFFFF; flex-shrink: 0; gap: 10px; flex-wrap: wrap;
}
.toolbar-left  { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.toolbar-title { font-size: 15px; font-weight: 700; color: #003366; }
.toolbar-count { font-size: 12px; color: #8094B8; }
.toolbar-right { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

.search-wrap {
  display: flex; align-items: center; gap: 6px;
  border: 1.5px solid #D1D9E0; border-radius: 2px; padding: 5px 10px; background: #F7F9FC;
}
.si { font-size: 12px; color: #8094B8; }
.search-input { border: none; background: transparent; outline: none; font-size: 12px; color: #0D1830; width: 180px; font-family: inherit; }
.filter-select { padding: 6px 10px; border: 1.5px solid #D1D9E0; border-radius: 2px; font-size: 12px; color: #0D1830; background: #F7F9FC; cursor: pointer; font-family: inherit; }
.btn-refresh { padding: 6px 12px; border-radius: 4px; font-size: 12px; font-weight: 600; background: none; border: 1.5px solid #D1D9E0; color: #3B4F70; cursor: pointer; font-family: inherit; }
.btn-refresh:hover { background: #F0F4FA; }

.state-msg { padding: 40px; text-align: center; color: #8094B8; font-size: 13px; }

.table-wrap   { flex: 1; overflow: auto; }
.orders-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.orders-table thead tr { background: #F7F9FC; border-bottom: 1.5px solid #D5DDEF; position: sticky; top: 0; z-index: 1; }
.orders-table th { padding: 9px 14px; text-align: left; font-size: 10px; font-weight: 700; letter-spacing: 0.8px; text-transform: uppercase; color: #8094B8; white-space: nowrap; }
.order-row { border-bottom: 1px solid #EEF2F8; cursor: pointer; transition: background 0.1s; }
.order-row:hover { background: #F7F9FC; }
.orders-table td { padding: 10px 14px; vertical-align: middle; }

.td-ordnum { font-weight: 700; color: #003366; }
.td-company { font-weight: 600; color: #0D1830; }
.td-opp     { font-size: 10px; color: #8094B8; margin-top: 2px; }
.td-mono    { font-family: 'IBM Plex Mono', monospace; }
.td-date    { font-size: 11px; color: #8094B8; }
.td-arrow   { color: #8094B8; font-size: 16px; text-align: right; }
.td-none    { color: #D1D9E0; }

/* Client tag */
.client-tag {
  display: flex; align-items: flex-start; gap: 7px;
  font-size: 12px; color: #0D1830;
}
.client-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; margin-top: 3px; }
.client-name { font-weight: 600; }
.client-bc   { font-family: 'IBM Plex Mono', monospace; font-size: 10px; color: #8094B8; margin-top: 1px; }
.client-new-badge {
  font-size: 9px; font-weight: 700; color: #0066CC;
  background: #E8F0FB; border-radius: 3px; padding: 1px 5px; margin-top: 2px; display: inline-block;
}
.client-tag--none { color: #8094B8; font-size: 11px; }

/* Confirmation tag */
.conf-tag {
  font-size: 10px; font-weight: 600;
  background: #F0F4FA; color: #3B4F70;
  border-radius: 3px; padding: 2px 7px; white-space: nowrap;
}

/* Agent cell */
.agent-cell   { display: flex; align-items: center; gap: 8px; }
.agent-avatar {
  width: 28px; height: 28px; border-radius: 50%;
  background: #003366; color: #fff;
  font-size: 11px; font-weight: 700; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
}
.agent-name { font-size: 12px; font-weight: 600; color: #0D1830; }
.agent-unit { font-size: 10px; color: #8094B8; margin-top: 1px; }
</style>
