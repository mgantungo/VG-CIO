<!--components/finance/payments.vue-->
<template>
  <div class="pm-page">

    <!-- ════════════════════════ HEADER ════════════════════════ -->
    <section class="hd-bar">
      <div class="hd-bar__left">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="1"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
        <div>
          <div class="hd-title">Payment Collection</div>
          <div class="hd-sub">Advertising revenue tracking &amp; management</div>
        </div>
      </div>
      <div class="hd-bar__right">
        <div class="hd-period">
          <label class="hd-label">From</label>
          <input type="date" v-model="startDate" @change="loadData" class="hd-input" :max="endDate">
          <label class="hd-label">To</label>
          <input type="date" v-model="endDate" @change="loadData" class="hd-input" :min="startDate" :max="today">
        </div>
        <div class="hd-quick">
          <button class="qr-btn" @click="setDateRange('today')">Today</button>
          <button class="qr-btn" @click="setDateRange('week')">Week</button>
          <button class="qr-btn" @click="setDateRange('month')">Month</button>
        </div>
        <button class="hd-btn" @click="exportData" :disabled="loading">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Export
        </button>
        <button class="hd-btn" @click="refreshData" :disabled="loading">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>
          {{ loading ? 'Loading…' : 'Refresh' }}
        </button>
      </div>
    </section>

    <!-- ════════════════════════ KPI BAND ════════════════════════ -->
    <div class="kpi-band">
      <div class="kpi-cell kpi--blue">
        <span class="kpi-label">Total Billed</span>
        <span class="kpi-value">{{ formatCurrency(totalRevenue) }}</span>
      </div>
      <div class="kpi-cell kpi--green">
        <span class="kpi-label">Collected</span>
        <span class="kpi-value">{{ formatCurrency(collectedThisMonth) }}</span>
        <span class="kpi-sub">{{ collectionRate }}% rate</span>
      </div>
      <div class="kpi-cell kpi--red">
        <span class="kpi-label">Outstanding</span>
        <span class="kpi-value">{{ formatCurrency(outstanding) }}</span>
      </div>
      <div class="kpi-cell kpi--amber">
        <span class="kpi-label">Pending</span>
        <span class="kpi-value kpi-value--n">{{ pendingPayments }}</span>
        <span class="kpi-sub">transactions</span>
      </div>
    </div>

    <!-- ════════════════════════ RIBBON (tabs + search) ════════════════════════ -->
    <div class="ribbon">
      <!-- Tab strip — styled like Excel sheet tabs -->
      <div class="tab-strip">
        <button
          v-for="tab in tabs" :key="tab.id"
          class="tab-btn"
          :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id; currentPage = 1"
        >
          {{ tab.label }}
          <span class="tab-pill" :class="{ 'tab-pill--active': activeTab === tab.id }">{{ getTabCount(tab.id) }}</span>
        </button>
      </div>

      <!-- Search / filter row -->
      <div class="ribbon__filters">
        <div class="search-wrap">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input v-model="searchQuery" type="text" class="xl-input xl-input--search" placeholder="Search client, reference, invoice…">
        </div>
        <select v-model="paymentMethodFilter" class="xl-input xl-select">
          <option value="">All methods</option>
          <option value="cash">Cash</option>
          <option value="bank_transfer">Bank Transfer</option>
          <option value="mobile_money">Mobile Money</option>
          <option value="credit">Credit</option>
        </select>
        <button class="ribbon-btn ribbon-btn--reset" @click="resetFilters">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>
          Reset
        </button>
      </div>
    </div>

    <!-- ════════════════════════ TABLE AREA ════════════════════════ -->
    <div class="xl-sheet">

      <!-- Loading -->
      <div v-if="loading" class="state-box">
        <div class="spinner"></div>
        <p>Loading transactions…</p>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="state-box state-box--error">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <p>{{ error }}</p>
        <button class="ribbon-btn ribbon-btn--primary" @click="loadData">Retry</button>
      </div>

      <!-- Empty -->
      <div v-else-if="filteredTransactions.length === 0" class="state-box">
        <svg viewBox="0 0 64 64" fill="none"><rect x="8" y="8" width="48" height="48" rx="1" stroke="#CBD5E1" stroke-width="3"/><line x1="20" y1="26" x2="44" y2="26" stroke="#CBD5E1" stroke-width="3" stroke-linecap="round"/><line x1="20" y1="34" x2="36" y2="34" stroke="#CBD5E1" stroke-width="3" stroke-linecap="round"/></svg>
        <p>No transactions match the filters</p>
        <button class="ribbon-btn ribbon-btn--reset" @click="resetFilters">Clear filters</button>
      </div>

      <!-- Table -->
      <template v-else>
        <div class="tbl-wrap">
          <table class="xl-tbl">
            <thead>
              <tr>
                <th class="tc-inv">Invoice / Ref</th>
                <th class="tc-client">Client</th>
                <th class="tc-product">Product</th>
                <th class="tc-amount num">Total Billed</th>
                <th class="tc-paid num">Amount Paid</th>
                <th class="tc-bal num">Balance</th>
                <th class="tc-method">Method</th>
                <th class="tc-status">Status</th>
                <th class="tc-actions"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="t in paginatedTransactions" :key="t.id" class="xl-row">

                <td class="tc-inv">
                  <code class="ref-chip">{{ t.invoiceNumber }}</code>
                  <span class="cell-sub">{{ t.advertReference }}</span>
                </td>

                <td class="tc-client">
                  <span class="cell-main">{{ t.clientName }}</span>
                  <span class="cell-sub">{{ t.contactPerson }}</span>
                </td>

                <td class="tc-product">
                  <span class="cell-main">{{ t.productName }}</span>
                  <span class="cell-sub">{{ t.categoryName }}</span>
                </td>

                <td class="tc-amount num">
                  <span class="xl-num">{{ formatCurrency(t.totalAmount) }}</span>
                </td>

                <td class="tc-paid num">
                  <span class="xl-num xl-num--green">{{ formatCurrency(t.amountPaid) }}</span>
                </td>

                <td class="tc-bal num">
                  <span :class="['xl-num', t.balance === 0 ? 'xl-num--green' : 'xl-num--red']">
                    {{ formatCurrency(t.balance) }}
                  </span>
                </td>

                <td class="tc-method">
                  <span class="method-tag">{{ formatPaymentMethod(t.paymentMethod) }}</span>
                </td>

                <td class="tc-status">
                  <span :class="'xlbadge xlbadge--' + t.paymentStatus">
                    {{ formatPaymentStatus(t.paymentStatus) }}
                  </span>
                </td>

                <td class="tc-actions">
                  <div class="act-group">
                    <div v-if="t.balance > 0" class="act-wrap">
                      <button class="act-btn act-pay" @click="markAsPaid(t)" aria-label="Mark as paid">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      </button>
                      <span class="act-tip">Mark paid</span>
                    </div>
                    <div v-else class="act-wrap">
                      <span class="act-settled">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                      </span>
                      <span class="act-tip">Settled</span>
                    </div>
                  </div>
                </td>

              </tr>
            </tbody>

            <!-- ── Excel-style totals row ── -->
            <tfoot>
              <tr class="xl-totals">
                <td colspan="3">
                  <span class="totals-label">Showing {{ paginatedTransactions.length }} of {{ filteredTransactions.length }} records</span>
                </td>
                <td class="num">
                  <span class="xl-num xl-num--total">{{ formatCurrency(pageTotal('totalAmount')) }}</span>
                </td>
                <td class="num">
                  <span class="xl-num xl-num--total xl-num--green">{{ formatCurrency(pageTotal('amountPaid')) }}</span>
                </td>
                <td class="num">
                  <span class="xl-num xl-num--total xl-num--red">{{ formatCurrency(pageTotal('balance')) }}</span>
                </td>
                <td colspan="3"></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- ── Excel-style status bar pagination ── -->
        <div class="status-bar">
          <div class="status-bar__left">
            <span class="sb-stat">
              <span class="sb-key">Total Billed:</span>
              <span class="sb-val">{{ formatCurrency(filteredTotal('totalAmount')) }}</span>
            </span>
            <span class="sb-divider"></span>
            <span class="sb-stat">
              <span class="sb-key">Collected:</span>
              <span class="sb-val sb-val--green">{{ formatCurrency(filteredTotal('amountPaid')) }}</span>
            </span>
            <span class="sb-divider"></span>
            <span class="sb-stat">
              <span class="sb-key">Outstanding:</span>
              <span class="sb-val sb-val--red">{{ formatCurrency(filteredTotal('balance')) }}</span>
            </span>
          </div>
          <div v-if="totalPages > 1" class="status-bar__right">
            <button class="pg-btn" :disabled="currentPage === 1" @click="currentPage--">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <span class="pg-label">Page {{ currentPage }} of {{ totalPages }}</span>
            <button class="pg-btn" :disabled="currentPage === totalPages" @click="currentPage++">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        </div>

      </template>
    </div>

    <!-- ════════════════════════ MODAL ════════════════════════ -->
    <Teleport to="body">
      <div v-if="showPaymentModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal" role="dialog" aria-modal="true">

          <div class="modal__head">
            <div class="modal__title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="1"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
              Confirm Payment
            </div>
            <button class="modal__close" @click="closeModal">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <!-- Transaction summary — Excel table style -->
          <div class="modal__info">
            <table class="modal-tbl">
              <tbody>
                <tr>
                  <td class="modal-tbl__label">Invoice</td>
                  <td><code class="ref-chip">{{ selectedTransaction?.invoiceNumber }}</code></td>
                </tr>
                <tr>
                  <td class="modal-tbl__label">Client</td>
                  <td class="modal-tbl__val">{{ selectedTransaction?.clientName }}</td>
                </tr>
                <tr>
                  <td class="modal-tbl__label">Total Amount</td>
                  <td class="modal-tbl__val modal-tbl__val--num">{{ formatCurrency(selectedTransaction?.totalAmount) }}</td>
                </tr>
                <tr class="modal-tbl__highlight">
                  <td class="modal-tbl__label">Balance Due</td>
                  <td class="modal-tbl__val modal-tbl__val--num modal-tbl__val--red">{{ formatCurrency(selectedTransaction?.balance) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="modal__body">
            <div class="mf-group">
              <label class="mf-label">Payment Date</label>
              <input v-model="paymentForm.paymentDate" type="date" :max="today" class="xl-input">
            </div>
            <div class="mf-group">
              <label class="mf-label">Payment Method</label>
              <select v-model="paymentForm.paymentMethod" class="xl-input xl-select">
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="mobile_money">Mobile Money</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>
            <div class="mf-group">
              <label class="mf-label">Notes <span class="mf-optional">(optional)</span></label>
              <textarea v-model="paymentForm.notes" rows="3" class="xl-input xl-textarea" placeholder="Add payment notes…"></textarea>
            </div>
          </div>

          <div class="modal__foot">
            <button class="ribbon-btn ribbon-btn--cancel" @click="closeModal">Cancel</button>
            <button class="ribbon-btn ribbon-btn--primary" @click="confirmMarkAsPaid" :disabled="processing">
              <svg v-if="!processing" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              <div v-else class="btn-spinner"></div>
              {{ processing ? 'Processing…' : 'Confirm Payment' }}
            </button>
          </div>

        </div>
      </div>
    </Teleport>

  </div>
</template>
<script setup>
import StatCard from '~/components/common/StatCard.vue'
import { usePayments } from '~/composables/usePayments'
import { ref, computed, onMounted } from 'vue'

const {
  transactions,
  loading,
  error,
  collectedThisMonth,
  outstanding,
  pendingPayments,
  collectionRate,
  loadTransactions,
  markAsPaid: markAsPaidAPI
} = usePayments()

// State
const startDate = ref('')
const endDate = ref('')
const today = ref(new Date().toISOString().split('T')[0])
const activeTab = ref('all')
const searchQuery = ref('')
const paymentMethodFilter = ref('')
const currentPage = ref(1)
const pageSize = 15
const showPaymentModal = ref(false)
const selectedTransaction = ref(null)
const processing = ref(false)

const paymentForm = ref({
  paymentDate: today.value,
  paymentMethod: 'cash',
  notes: ''
})

// Tabs
const tabs = [
  { id: 'all', label: 'All' },
  { id: 'unpaid', label: 'Unpaid' },
  { id: 'paid', label: 'Paid' },
  { id: 'partial', label: 'Partial' },
  { id: 'overdue', label: 'Overdue' }
]

// Computed
const filteredTransactions = computed(() => {
  let filtered = [...transactions.value]
  
  // Filter by tab
  if (activeTab.value !== 'all') {
    filtered = filtered.filter(t => t.paymentStatus === activeTab.value)
  }
  
  // Filter by search
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(t => 
      t.clientName?.toLowerCase().includes(query) ||
      t.advertReference?.toLowerCase().includes(query) ||
      t.invoiceNumber?.toLowerCase().includes(query) ||
      t.contactPerson?.toLowerCase().includes(query)
    )
  }
  
  // Filter by payment method
  if (paymentMethodFilter.value) {
    filtered = filtered.filter(t => t.paymentMethod === paymentMethodFilter.value)
  }
  
  return filtered
})

const paginatedTransactions = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  const end = start + pageSize
  return filteredTransactions.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(filteredTransactions.value.length / pageSize)
})

// Methods
const initializeDates = () => {
  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  startDate.value = firstDayOfMonth.toISOString().split('T')[0]
  endDate.value = today.value
}

const loadData = async () => {
  try {
    await loadTransactions({
      startDate: startDate.value,
      endDate: endDate.value
    })
  } catch (err) {
    console.error('Failed to load data:', err)
  }
}

const refreshData = () => {
  loadData()
}

const setDateRange = (range) => {
  const now = new Date()
  
  switch (range) {
    case 'today':
      startDate.value = today.value
      endDate.value = today.value
      break
    
    case 'week':
      const startOfWeek = new Date(now)
      startOfWeek.setDate(now.getDate() - now.getDay() + 1)
      startDate.value = startOfWeek.toISOString().split('T')[0]
      endDate.value = today.value
      break
    
    case 'month':
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      startDate.value = startOfMonth.toISOString().split('T')[0]
      endDate.value = today.value
      break
  }
  
  loadData()
}

const getTabCount = (tabId) => {
  if (tabId === 'all') return transactions.value.length
  return transactions.value.filter(t => t.paymentStatus === tabId).length
}

const resetFilters = () => {
  activeTab.value = 'all'
  searchQuery.value = ''
  paymentMethodFilter.value = ''
  initializeDates()
  loadData()
}

const markAsPaid = (transaction) => {
  selectedTransaction.value = transaction
  paymentForm.value = {
    paymentDate: today.value,
    paymentMethod: transaction.paymentMethod,
    notes: ''
  }
  showPaymentModal.value = true
}

const confirmMarkAsPaid = async () => {
  if (!selectedTransaction.value) return
  
  processing.value = true
  
  try {
    await markAsPaidAPI(selectedTransaction.value.advertReference, {
      paymentMethod: paymentForm.value.paymentMethod,
      paymentDate: paymentForm.value.paymentDate,
      notes: paymentForm.value.notes
    })
    
    alert('✅ Transaction marked as paid successfully!')
    closeModal()
    await loadData()
  } catch (err) {
    alert('❌ Failed to mark as paid: ' + err.message)
  } finally {
    processing.value = false
  }
}

const closeModal = () => {
  showPaymentModal.value = false
  selectedTransaction.value = null
}

const viewDetails = (transaction) => {
  // Navigate to transaction details
  alert(`Viewing details for ${transaction.invoiceNumber}`)
}

const exportData = () => {
  const { exportTransactions } = usePayments()
  exportTransactions('csv')
}

const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return 'UGX 0'
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

const formatPaymentMethod = (method) => {
  const methods = {
    cash: 'Cash',
    bank_transfer: 'Bank Transfer',
    mobile_money: 'Mobile Money',
    credit: 'Credit',
    cheque: 'Cheque'
  }
  return methods[method] || method
}

const formatPaymentStatus = (status) => {
  const statuses = {
    unpaid: 'Unpaid',
    paid: 'Paid',
    partial: 'Partial',
    overdue: 'Overdue'
  }
  return statuses[status] || status
}

const getBalanceClass = (balance) => {
  if (balance === 0) return 'balance-paid'
  return 'balance-unpaid'
}

const pageTotal = (field) => {
  return paginatedTransactions.value.reduce((s, t) => s + (parseFloat(t[field]) || 0), 0)
}

const filteredTotal = (field) => {
  return filteredTransactions.value.reduce((s, t) => s + (parseFloat(t[field]) || 0), 0)
}

// Lifecycle
onMounted(() => {
  initializeDates()
  loadData()
})
</script>
<style scoped>
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap');

/* ══════════════════════════════════════════════════════════════════════════════
   DESIGN TOKENS
══════════════════════════════════════════════════════════════════════════════ */
.pm-page {
  /* Brand */
  --navy:        #1F3864;   /* Excel dark navy */
  --navy-mid:    #2E4D87;
  --red:         #E31E24;

  /* Surfaces */
  --surface:     #FFFFFF;
  --page-bg:     #F2F2F2;   /* Excel workbook grey */

  /* Excel table colours */
  --xl-head-bg:  #DEEAF1;   /* Excel Table Style Medium 2 header */
  --xl-head-txt: #1F3864;   /* Excel header text */
  --xl-head-bd:  #9DC3E6;   /* header bottom border */
  --xl-col-bd:   #BDD7EE;   /* column separator */
  --xl-row-alt:  #F7FBFE;   /* even row tint */
  --xl-row-hov:  #EBF4FF;
  --xl-total-bg: #DEEAF1;   /* totals row = same as header */
  --xl-total-bd: #9DC3E6;

  /* Borders */
  --border:      #BFBFBF;   /* Excel grid line */
  --border-lt:   #D9D9D9;

  /* Text */
  --text-1:      #0F172A;
  --text-2:      #1A1A2E;
  --text-3:      #595959;
  --text-4:      #8C8C8C;

  /* Semantic */
  --green-txt:   #375623;   /* Excel green CF */
  --green-bg:    #E2EFDA;
  --green-bd:    #A9D18E;
  --red-txt:     #833C00;   /* Excel orange-red CF */
  --red-bg:      #FCE4D6;
  --red-bd:      #F4B183;
  --amber-txt:   #7F6000;   /* Excel yellow CF */
  --amber-bg:    #FFEB9C;
  --amber-bd:    #FFCC00;
  --blue-lt:     #EBF4FF;

  /* Misc */
  --ring:        0 0 0 2px #9DC3E6;
  --t:           100ms ease;
  --font:        "IBM Plex Sans", -apple-system, sans-serif;
  --mono:        "IBM Plex Mono", "Courier New", monospace;
}

.pm-page {
  width: 100%;
  min-height: 100vh;
  background: var(--page-bg);
  font-family: var(--font);
  font-size: 13px;
  color: var(--text-2);
  padding-bottom: 64px;
  min-width: 0;
}

/* ══════════════════════════════════════════════════════════════════════════════
   HEADER BAR
══════════════════════════════════════════════════════════════════════════════ */
.hd-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding: 0 20px;
  background: var(--navy);
  margin: 16px 16px 0;
  border: 1px solid rgba(255,255,255,.08);
  min-height: 58px;
}

.hd-bar__left {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #fff;
}
.hd-bar__left svg { width: 20px; height: 20px; stroke: rgba(255,255,255,.65); flex-shrink: 0; }

.hd-title { font-size: 14px; font-weight: 700; color: #fff; }
.hd-sub   { font-size: 11px; color: rgba(255,255,255,.5); margin-top: 1px; }

.hd-bar__right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 10px 0;
}

.hd-period {
  display: flex;
  align-items: center;
  gap: 6px;
}

.hd-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .07em;
  color: rgba(255,255,255,.5);
  white-space: nowrap;
}

.hd-input {
  height: 30px;
  padding: 0 8px;
  border: 1px solid rgba(255,255,255,.2);
  background: rgba(255,255,255,.1);
  color: #fff;
  font-family: var(--font);
  font-size: 12px;
  outline: none;
  border-radius: 0;
  cursor: pointer;
  color-scheme: dark;
}
.hd-input:focus { border-color: #9DC3E6; box-shadow: var(--ring); }

.hd-quick {
  display: flex;
  gap: 4px;
}

.qr-btn {
  height: 28px;
  padding: 0 10px;
  border: 1px solid rgba(255,255,255,.25);
  background: rgba(255,255,255,.08);
  color: rgba(255,255,255,.8);
  font-family: var(--font);
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: background var(--t);
  white-space: nowrap;
  border-radius: 0;
}
.qr-btn:hover { background: rgba(255,255,255,.18); color: #fff; }

.hd-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  padding: 0 12px;
  border: 1px solid rgba(255,255,255,.25);
  background: rgba(255,255,255,.1);
  color: rgba(255,255,255,.85);
  font-family: var(--font);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background var(--t);
  white-space: nowrap;
  border-radius: 0;
}
.hd-btn svg { width: 13px; height: 13px; }
.hd-btn:hover:not(:disabled) { background: rgba(255,255,255,.2); color: #fff; }
.hd-btn:disabled { opacity: .4; cursor: not-allowed; }

@media (max-width: 900px) {
  .hd-bar { padding: 12px 14px; margin: 8px 8px 0; flex-direction: column; align-items: flex-start; }
  .hd-period { flex-wrap: wrap; }
}

/* ══════════════════════════════════════════════════════════════════════════════
   KPI BAND
══════════════════════════════════════════════════════════════════════════════ */
.kpi-band {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  margin: 0 16px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-top: none;
}

@media (max-width: 800px)  { .kpi-band { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 480px)  { .kpi-band { grid-template-columns: 1fr; margin: 0 8px; } }

.kpi-cell {
  display: flex;
  flex-direction: column;
  padding: 14px 18px 12px;
  border-right: 1px solid var(--border-lt);
  border-top: 3px solid transparent;
  gap: 2px;
}
.kpi-cell:last-child { border-right: none; }

.kpi--blue  { border-top-color: #5B9BD5; }  /* Excel blue */
.kpi--green { border-top-color: #70AD47; }  /* Excel green */
.kpi--red   { border-top-color: #FF0000; }  /* Excel red */
.kpi--amber { border-top-color: #FFC000; }  /* Excel amber */

.kpi-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .07em;
  color: var(--text-4);
}

.kpi-value {
  font-family: var(--mono);
  font-size: 18px;
  font-weight: 600;
  color: var(--text-1);
  line-height: 1.1;
  margin-top: 3px;
  white-space: nowrap;
}
.kpi-value--n { font-size: 26px; }

.kpi-sub {
  font-size: 10px;
  color: var(--text-3);
  margin-top: 1px;
}

/* ══════════════════════════════════════════════════════════════════════════════
   RIBBON  (tabs + filters)
══════════════════════════════════════════════════════════════════════════════ */
.ribbon {
  margin: 12px 16px 0;
  background: var(--surface);
  border: 1px solid var(--border);
}

@media (max-width: 640px) { .ribbon { margin: 8px 8px 0; } }

/* Tab strip — Excel sheet-tab style */
.tab-strip {
  display: flex;
  gap: 0;
  border-bottom: 2px solid var(--xl-head-bd);
  overflow-x: auto;
  scrollbar-width: none;
  padding: 0 8px;
  background: #E8EEF4;
}
.tab-strip::-webkit-scrollbar { display: none; }

.tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  padding: 0 16px;
  border: none;
  border-bottom: 2px solid transparent;
  background: transparent;
  font-family: var(--font);
  font-size: 12px;
  font-weight: 500;
  color: var(--text-3);
  cursor: pointer;
  white-space: nowrap;
  transition: color var(--t), background var(--t), border-color var(--t);
  margin-bottom: -2px;
  position: relative;
}
.tab-btn:hover { color: var(--xl-head-txt); background: #D6E4F0; }
.tab-btn.active {
  color: var(--xl-head-txt);
  font-weight: 700;
  background: var(--surface);
  border-color: var(--xl-head-bd);
  border-bottom-color: var(--surface);  /* "lifts" tab above line */
}

.tab-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 18px;
  padding: 0 5px;
  background: var(--border-lt);
  color: var(--text-3);
  font-size: 10px;
  font-weight: 700;
  font-family: var(--mono);
  border: 1px solid var(--border);
}
.tab-pill--active {
  background: var(--xl-head-bg);
  color: var(--xl-head-txt);
  border-color: var(--xl-col-bd);
}

/* Filters row */
.ribbon__filters {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-top: 1px solid var(--border-lt);
  flex-wrap: wrap;
}

.xl-input {
  height: 30px;
  padding: 0 10px;
  border: 1px solid var(--border);
  font-family: var(--font);
  font-size: 12px;
  color: var(--text-1);
  background: var(--surface);
  outline: none;
  border-radius: 0;
  transition: border-color var(--t);
}
.xl-input:focus { border-color: #5B9BD5; box-shadow: var(--ring); }
.xl-select { cursor: pointer; min-width: 130px; }
.xl-textarea { height: auto; padding: 8px 10px; resize: vertical; }

.search-wrap {
  position: relative;
  flex: 1;
  min-width: 200px;
}
.search-icon {
  position: absolute;
  left: 8px; top: 50%;
  transform: translateY(-50%);
  width: 14px; height: 14px;
  stroke: var(--text-4);
  pointer-events: none;
}
.xl-input--search { padding-left: 30px; width: 100%; box-sizing: border-box; }

.ribbon-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  padding: 0 12px;
  border: 1px solid var(--border);
  font-family: var(--font);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: background var(--t), border-color var(--t), opacity var(--t);
  border-radius: 0;
}
.ribbon-btn svg { width: 13px; height: 13px; flex-shrink: 0; }
.ribbon-btn:disabled { opacity: .4; cursor: not-allowed; }

.ribbon-btn--reset   { background: var(--page-bg); color: var(--text-3); }
.ribbon-btn--reset:hover:not(:disabled) { background: var(--border-lt); }

.ribbon-btn--primary { background: var(--red); color: #fff; border-color: var(--red); }
.ribbon-btn--primary:hover:not(:disabled) { background: #C0181E; }

.ribbon-btn--cancel  { background: var(--surface); color: var(--text-2); }
.ribbon-btn--cancel:hover:not(:disabled) { background: var(--page-bg); }

@media (max-width: 640px) {
  .ribbon__filters { flex-direction: column; align-items: stretch; }
  .search-wrap { min-width: unset; }
}

/* ══════════════════════════════════════════════════════════════════════════════
   EXCEL SHEET WRAPPER + TABLE
══════════════════════════════════════════════════════════════════════════════ */
.xl-sheet {
  margin: 0 16px;
  border: 1px solid var(--border);
  border-top: none;
  background: var(--surface);
}
@media (max-width: 640px) { .xl-sheet { margin: 0 8px; } }

.tbl-wrap {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  scrollbar-color: var(--border) transparent;
}
.tbl-wrap::-webkit-scrollbar       { height: 6px; }
.tbl-wrap::-webkit-scrollbar-thumb { background: var(--border); }

/* ── Table ── */
.xl-tbl {
  width: 100%;
  min-width: 860px;
  border-collapse: collapse;
  font-size: 12px;
  table-layout: fixed;
}

/* Column widths */
.tc-inv     { width: 190px; }
.tc-client  { width: 190px; }
.tc-product { width: 150px; }
.tc-amount  { width: 120px; }
.tc-paid    { width: 120px; }
.tc-bal     { width: 120px; }
.tc-method  { width: 115px; }
.tc-status  { width: 100px; }
.tc-actions { width: 56px;  }

/* Sticky invoice column */
.xl-tbl th.tc-inv,
.xl-tbl td.tc-inv {
  position: sticky;
  left: 0;
  z-index: 2;
}
.xl-tbl th.tc-inv { background: var(--xl-head-bg); }
.xl-tbl td.tc-inv { background: var(--surface); box-shadow: 2px 0 4px -2px rgba(0,0,0,.1); }
.xl-row:nth-child(even) td.tc-inv { background: var(--xl-row-alt); }
.xl-row:hover td.tc-inv { background: var(--xl-row-hov) !important; }

/* ── Head — Excel frozen row style ── */
.xl-tbl thead tr { background: var(--xl-head-bg); }

.xl-tbl th {
  padding: 8px 10px;
  text-align: left;
  font-size: 11px;
  font-weight: 700;
  color: var(--xl-head-txt);
  border-right: 1px solid var(--xl-col-bd);
  border-bottom: 2px solid var(--xl-head-bd);
  white-space: nowrap;
  letter-spacing: .04em;
  text-transform: uppercase;
}
.xl-tbl th:last-child { border-right: none; }
.xl-tbl th.num { text-align: right; }

/* ── Body rows ── */
.xl-tbl tbody tr {
  border-bottom: 1px solid var(--border-lt);
  transition: background var(--t);
}
.xl-tbl tbody tr:nth-child(even) { background: var(--xl-row-alt); }
.xl-tbl tbody tr:hover { background: var(--xl-row-hov); }
.xl-tbl tbody tr:last-child { border-bottom: none; }

.xl-tbl td {
  padding: 7px 10px;
  border-right: 1px solid var(--border-lt);
  vertical-align: middle;
  overflow: visible;
}
.xl-tbl td:last-child { border-right: none; }
.xl-tbl td.num { text-align: right; }

/* ── Totals footer row — like Excel totals row ── */
.xl-totals {
  background: var(--xl-total-bg) !important;
  border-top: 2px solid var(--xl-total-bd) !important;
}
.xl-totals td {
  padding: 8px 10px;
  border-right: 1px solid var(--xl-col-bd);
  border-bottom: none;
}
.xl-totals td:last-child { border-right: none; }

.totals-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--xl-head-txt);
  font-style: italic;
}

/* ══════════════════════════════════════════════════════════════════════════════
   CELL ATOMS
══════════════════════════════════════════════════════════════════════════════ */
.ref-chip {
  display: inline-block;
  font-family: var(--mono);
  font-size: 11px;
  font-weight: 600;
  color: #2E4D87;
  background: var(--xl-head-bg);
  border: 1px solid var(--xl-col-bd);
  padding: 2px 7px;
  letter-spacing: .04em;
  white-space: nowrap;
  border-radius: 0;
}

.cell-main {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-1);
  line-height: 1.35;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cell-sub {
  display: block;
  font-size: 10px;
  color: var(--text-4);
  line-height: 1.35;
  margin-top: 1px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Client column — allow wrapping, never truncate */
.tc-client .cell-main,
.tc-client .cell-sub {
  white-space: normal;
  overflow: visible;
  text-overflow: unset;
  word-break: break-word;
}

/* Numbers — Excel right-aligned monospace */
.xl-num {
  font-family: var(--mono);
  font-size: 12px;
  font-weight: 500;
  color: var(--text-1);
  display: block;
  text-align: right;
  white-space: nowrap;
}
.xl-num--green { color: var(--green-txt); }
.xl-num--red   { color: var(--red-txt);   }
.xl-num--total { font-weight: 700; font-size: 12px; }

/* Payment method tag — plain text label like Excel cell */
.method-tag {
  font-size: 11px;
  font-weight: 600;
  color: var(--xl-head-txt);
  background: var(--xl-head-bg);
  border: 1px solid var(--xl-col-bd);
  padding: 2px 8px;
  white-space: nowrap;
  display: inline-block;
}

/* ── Status badges — Excel conditional formatting colours ── */
.xlbadge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 20px;
  padding: 0 8px;
  font-size: 10px;
  font-weight: 700;
  white-space: nowrap;
  letter-spacing: .04em;
  text-transform: uppercase;
  border: 1px solid;
  border-radius: 0;
}
.xlbadge--paid    { background: var(--green-bg);  color: var(--green-txt); border-color: var(--green-bd); }
.xlbadge--unpaid  { background: var(--red-bg);    color: var(--red-txt);   border-color: var(--red-bd);   }
.xlbadge--partial { background: var(--amber-bg);  color: var(--amber-txt); border-color: var(--amber-bd); }
.xlbadge--overdue { background: #FCE4D6; color: #C00000; border-color: #F4B183; }

/* ══════════════════════════════════════════════════════════════════════════════
   ACTION BUTTONS
══════════════════════════════════════════════════════════════════════════════ */
.act-group { display: flex; align-items: center; justify-content: center; }
.act-wrap  { position: relative; display: inline-flex; }

.act-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px; height: 28px;
  border: 1px solid var(--green-bd);
  background: var(--green-bg);
  color: var(--green-txt);
  cursor: pointer;
  transition: background var(--t);
  border-radius: 0;
}
.act-btn svg { width: 14px; height: 14px; pointer-events: none; }
.act-btn:hover { background: #D5EDCA; }

.act-settled {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px; height: 28px;
  color: var(--green-txt);
  opacity: .5;
}
.act-settled svg { width: 18px; height: 18px; }

.act-tip {
  pointer-events: none;
  position: absolute;
  bottom: calc(100% + 6px);
  left: 50%; transform: translateX(-50%);
  white-space: nowrap;
  background: var(--navy);
  color: #fff;
  font-size: 10px;
  font-weight: 600;
  padding: 3px 8px;
  opacity: 0;
  transition: opacity var(--t);
  z-index: 9999;
  border-radius: 0;
}
.act-tip::after {
  content: '';
  position: absolute;
  top: 100%; left: 50%; transform: translateX(-50%);
  border: 4px solid transparent;
  border-top-color: var(--navy);
}
.act-wrap:hover .act-tip { opacity: 1; }

/* ══════════════════════════════════════════════════════════════════════════════
   STATUS BAR  (Excel bottom bar)
══════════════════════════════════════════════════════════════════════════════ */
.status-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  padding: 7px 12px;
  background: #DEEAF1;
  border-top: 2px solid var(--xl-head-bd);
  font-size: 11px;
}

.status-bar__left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.sb-stat { display: flex; align-items: center; gap: 5px; }
.sb-key  { font-weight: 600; color: var(--xl-head-txt); text-transform: uppercase; letter-spacing: .05em; font-size: 10px; }
.sb-val  { font-family: var(--mono); font-weight: 600; color: var(--text-1); }
.sb-val--green { color: var(--green-txt); }
.sb-val--red   { color: var(--red-txt); }

.sb-divider {
  display: inline-block;
  width: 1px;
  height: 12px;
  background: var(--xl-col-bd);
}

.status-bar__right {
  display: flex;
  align-items: center;
  gap: 6px;
}

.pg-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px; height: 26px;
  border: 1px solid var(--xl-col-bd);
  background: var(--surface);
  color: var(--xl-head-txt);
  cursor: pointer;
  transition: background var(--t);
  border-radius: 0;
}
.pg-btn svg { width: 14px; height: 14px; }
.pg-btn:hover:not(:disabled) { background: var(--surface); border-color: #5B9BD5; }
.pg-btn:disabled { opacity: .3; cursor: not-allowed; }

.pg-label {
  font-family: var(--mono);
  font-size: 11px;
  font-weight: 600;
  color: var(--xl-head-txt);
  min-width: 80px;
  text-align: center;
}

/* ══════════════════════════════════════════════════════════════════════════════
   STATES
══════════════════════════════════════════════════════════════════════════════ */
.state-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 56px 24px;
  text-align: center;
  color: var(--text-3);
}
.state-box svg { width: 48px; height: 48px; opacity: .35; }
.state-box p { font-size: 13px; margin: 0; }
.state-box--error { color: #C00000; }
.state-box--error svg { stroke: #C00000; }

.spinner {
  width: 32px; height: 32px;
  border: 3px solid var(--border-lt);
  border-top-color: #5B9BD5;
  border-radius: 50%;
  animation: spin .7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ══════════════════════════════════════════════════════════════════════════════
   MODAL
══════════════════════════════════════════════════════════════════════════════ */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(128, 128, 129, 0.9);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
}

.modal {
  background: var(--surface);
  width: 100%;
  max-width: 460px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 8px 40px rgba(0,0,0,.25);
  border: 1px solid var(--border);
  border-radius: 0;
}

.modal__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  background: var(--navy);
  border-bottom: 2px solid var(--xl-head-bd);
}

.modal__title {
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
}
.modal__title svg { width: 16px; height: 16px; stroke: #fff; }

.modal__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px; height: 28px;
  border: 1px solid rgba(255,255,255,.25);
  background: rgba(255,255,255,.1);
  color: rgba(255,255,255,.8);
  cursor: pointer;
  transition: background var(--t);
  border-radius: 0;
}
.modal__close svg { width: 14px; height: 14px; }
.modal__close:hover { background: rgba(255,255,255,.2); color: #fff; }

/* Modal transaction info — Excel table style */
.modal__info {
  border-bottom: 1px solid var(--border-lt);
}

.modal-tbl {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}
.modal-tbl tr { border-bottom: 1px solid var(--border-lt); }
.modal-tbl tr:last-child { border-bottom: none; }
.modal-tbl td { padding: 9px 16px; }

.modal-tbl__label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .07em;
  color: var(--xl-head-txt);
  background: var(--xl-head-bg);
  border-right: 1px solid var(--xl-col-bd);
  width: 120px;
  white-space: nowrap;
}

.modal-tbl__val {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-1);
}
.modal-tbl__val--num { font-family: var(--mono); font-size: 14px; font-weight: 700; text-align: right; }
.modal-tbl__val--red { color: #C00000; }

.modal-tbl__highlight { background: #FFF2CC; }  /* Excel yellow highlight */

.modal__body {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mf-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.mf-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .07em;
  color: var(--xl-head-txt);
}
.mf-optional { font-weight: 400; text-transform: none; letter-spacing: 0; color: var(--text-4); }

.mf-group .xl-input { width: 100%; box-sizing: border-box; }

.modal__foot {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 20px;
  border-top: 1px solid var(--border-lt);
  background: var(--page-bg);
}

.btn-spinner {
  width: 13px; height: 13px;
  border: 2px solid rgba(255,255,255,.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin .7s linear infinite;
  flex-shrink: 0;
}
</style>