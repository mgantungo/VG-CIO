<!--pages/dashboard/finance/payments.vue - Professional Finance Interface-->
<template>
  <div class="payments-page">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-left">
        <h1>💰 Payment Collection</h1>
        <p>Manage advertising payments and track collections</p>
      </div>
      <div class="header-right">
        <button class="btn btn-secondary" @click="exportData" :disabled="loading">
          <span class="btn-icon">📥</span> Export
        </button>
        <button class="btn btn-refresh" @click="refreshData" :disabled="loading">
          <span v-if="loading">⏳</span>
          <span v-else>🔄</span> Refresh
        </button>
      </div>
    </div>

    <!-- Date Range Filter -->
    <div class="filter-card">
      <div class="filter-header">
        <h3>📅 Date Range</h3>
      </div>
      <div class="filter-controls">
        <div class="date-group">
          <label>From:</label>
          <input 
            type="date" 
            v-model="startDate"
            @change="loadData"
            :max="endDate"
          >
        </div>
        <div class="date-group">
          <label>To:</label>
          <input 
            type="date" 
            v-model="endDate"
            @change="loadData"
            :min="startDate"
            :max="today"
          >
        </div>
        <div class="quick-filters">
          <button class="btn-quick" @click="setDateRange('today')">Today</button>
          <button class="btn-quick" @click="setDateRange('week')">This Week</button>
          <button class="btn-quick" @click="setDateRange('month')">This Month</button>
        </div>
      </div>
    </div>

    <!-- Statistics Cards -->
    <div class="stats-grid">
      <StatCard 
        icon="💵"
        :value="formatCurrency(collectedThisMonth)"
        label="Collected"
        color="green"
        :trend="`${collectionRate}%`"
        trend-direction="up"
      />
      <StatCard 
        icon="⏳"
        :value="formatCurrency(outstanding)"
        label="Outstanding"
        color="red"
      />
      <StatCard 
        icon="📊"
        :value="pendingPayments"
        label="Pending Payments"
        color="gold"
      />
      <StatCard 
        icon="📈"
        :value="`${collectionRate}%`"
        label="Collection Rate"
        color="blue"
      />
    </div>

    <!-- Main Content -->
    <div class="content-card">
      <div class="card-header">
        <h2>Payment Queue</h2>
        <span class="result-count">{{ filteredTransactions.length }} transactions</span>
      </div>

      <!-- Tabs and Filters -->
      <div class="controls-section">
        <div class="tabs">
          <button 
            v-for="tab in tabs"
            :key="tab.id"
            class="tab"
            :class="{ active: activeTab === tab.id }"
            @click="activeTab = tab.id"
          >
            {{ tab.label }}
            <span class="tab-count">{{ getTabCount(tab.id) }}</span>
          </button>
        </div>

        <div class="search-filter-bar">
          <input 
            v-model="searchQuery"
            type="text" 
            class="search-input" 
            placeholder="Search by client, reference, or invoice..."
          >
          <select v-model="paymentMethodFilter" class="filter-select">
            <option value="">All Payment Methods</option>
            <option value="cash">Cash</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="mobile_money">Mobile Money</option>
            <option value="credit">Credit</option>
          </select>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading transactions...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <div class="error-icon">⚠️</div>
        <h3>Error Loading Data</h3>
        <p>{{ error }}</p>
        <button class="btn btn-primary" @click="loadData">Try Again</button>
      </div>

      <!-- Transactions Table -->
      <div v-else-if="filteredTransactions.length > 0" class="table-container">
        <table class="transactions-table">
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Client</th>
              <th>Product</th>
              <th class="amount-col">Amount</th>
              <th class="amount-col">Paid</th>
              <th class="amount-col">Balance</th>
              <th>Payment Method</th>
              <th>Status</th>
              <th class="actions-col">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="transaction in paginatedTransactions" :key="transaction.id">
              <td>
                <div class="invoice-cell">
                  <div class="invoice-number">{{ transaction.invoiceNumber }}</div>
                  <div class="invoice-ref">{{ transaction.advertReference }}</div>
                </div>
              </td>
              <td>
                <div class="client-cell">
                  <div class="client-name">{{ transaction.clientName }}</div>
                  <div class="client-contact">{{ transaction.contactPerson }}</div>
                </div>
              </td>
              <td>
                <div class="product-cell">
                  <div class="product-name">{{ transaction.productName }}</div>
                  <div class="product-category">{{ transaction.categoryName }}</div>
                </div>
              </td>
              <td class="amount-col">
                <strong>{{ formatCurrency(transaction.totalAmount) }}</strong>
              </td>
              <td class="amount-col paid">
                {{ formatCurrency(transaction.amountPaid) }}
              </td>
              <td class="amount-col">
                <span :class="getBalanceClass(transaction.balance)">
                  {{ formatCurrency(transaction.balance) }}
                </span>
              </td>
              <td>
                <span class="payment-method">{{ formatPaymentMethod(transaction.paymentMethod) }}</span>
              </td>
              <td>
                <span :class="`status-badge status-${transaction.paymentStatus}`">
                  {{ formatPaymentStatus(transaction.paymentStatus) }}
                </span>
              </td>
              <td class="actions-col">
                <div class="action-buttons">
                  <button 
                    v-if="transaction.balance > 0"
                    class="btn btn-success btn-sm"
                    @click="markAsPaid(transaction)"
                    title="Mark as Paid"
                  >
                    ✓ Paid
                  </button>
                  <!----
                  <button 
                    class="btn btn-info btn-sm"
                    @click="viewDetails(transaction)"
                    title="View Details"
                  >
                    👁️
                  </button>
                -->
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="pagination">
          <button 
            class="btn btn-sm" 
            :disabled="currentPage === 1"
            @click="currentPage--"
          >
            Previous
          </button>
          <span class="page-info">
            Page {{ currentPage }} of {{ totalPages }}
          </span>
          <button 
            class="btn btn-sm" 
            :disabled="currentPage === totalPages"
            @click="currentPage++"
          >
            Next
          </button>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state">
        <div class="empty-icon">💰</div>
        <h3>No Transactions Found</h3>
        <p>No transactions found for the selected date range and filters</p>
        <button class="btn btn-secondary" @click="resetFilters">
          Reset Filters
        </button>
      </div>
    </div>

    <!-- Mark as Paid Modal -->
    <div v-if="showPaymentModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <div class="modal-header">
          <h3>Mark Transaction as Paid</h3>
          <button class="modal-close" @click="closeModal">×</button>
        </div>
        
        <div class="modal-body">
          <div class="transaction-info">
            <div class="info-row">
              <span class="label">Invoice:</span>
              <span class="value">{{ selectedTransaction?.invoiceNumber }}</span>
            </div>
            <div class="info-row">
              <span class="label">Client:</span>
              <span class="value">{{ selectedTransaction?.clientName }}</span>
            </div>
            <div class="info-row">
              <span class="label">Amount:</span>
              <span class="value">{{ formatCurrency(selectedTransaction?.totalAmount) }}</span>
            </div>
          </div>

          <div class="form-group">
            <label>Payment Date</label>
            <input 
              v-model="paymentForm.paymentDate"
              type="date" 
              :max="today"
            >
          </div>

          <div class="form-group">
            <label>Payment Method</label>
            <select v-model="paymentForm.paymentMethod">
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="mobile_money">Mobile Money</option>
              <option value="cheque">Cheque</option>
            </select>
          </div>

          <div class="form-group">
            <label>Notes (Optional)</label>
            <textarea 
              v-model="paymentForm.notes"
              rows="3"
              placeholder="Add any payment notes..."
            ></textarea>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeModal">Cancel</button>
          <button 
            class="btn btn-primary" 
            @click="confirmMarkAsPaid"
            :disabled="processing"
          >
            {{ processing ? 'Processing...' : 'Confirm Payment' }}
          </button>
        </div>
      </div>
    </div>
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

// Lifecycle
onMounted(() => {
  initializeDates()
  loadData()
})
</script>

<style scoped>
.payments-page {
  width: 100%;
  padding-bottom: 30px;
}

/* Page Header */
.page-header {
  background: white;
  padding: 20px 30px;
  border-radius: 8px;
  margin-bottom: 25px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
}

.header-left h1 {
  color: #003366;
  margin-bottom: 5px;
  font-size: 1.6em;
  font-weight: 600;
}

.header-left p {
  color: #666;
  margin: 0;
  font-size: 0.9em;
}

.header-right {
  display: flex;
  gap: 10px;
}

/* Filter Card */
.filter-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 25px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.08);
}

.filter-header h3 {
  color: #003366;
  margin-bottom: 15px;
  font-size: 1em;
  font-weight: 600;
}

.filter-controls {
  display: flex;
  align-items: center;
  gap: 15px;
  flex-wrap: wrap;
}

.date-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.date-group label {
  font-size: 0.85em;
  color: #666;
  font-weight: 500;
}

.date-group input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 0.9em;
}

.quick-filters {
  display: flex;
  gap: 8px;
  margin-left: auto;
}

.btn-quick {
  padding: 8px 14px;
  border: 1px solid #0066CC;
  background: white;
  color: #0066CC;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.85em;
  transition: all 0.3s;
}

.btn-quick:hover {
  background: #0066CC;
  color: white;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 25px;
}

/* Content Card */
.content-card {
  background: white;
  padding: 25px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.08);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #f5f5f5;
}

.card-header h2 {
  color: #003366;
  margin: 0;
  font-size: 1.3em;
  font-weight: 600;
}

.result-count {
  color: #666;
  font-size: 0.9em;
}

/* Controls Section */
.controls-section {
  margin-bottom: 25px;
}

.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 15px;
  border-bottom: 2px solid #ddd;
  flex-wrap: wrap;
}

.tab {
  padding: 10px 18px;
  cursor: pointer;
  border: none;
  background: none;
  color: #666;
  font-size: 0.9em;
  border-bottom: 3px solid transparent;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.tab:hover {
  color: #E31E24;
}

.tab.active {
  color: #E31E24;
  border-bottom-color: #E31E24;
}

.tab-count {
  background: #f0f2f5;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 0.85em;
  font-weight: 600;
}

.tab.active .tab-count {
  background: rgba(227, 30, 36, 0.1);
  color: #E31E24;
}

.search-filter-bar {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.search-input {
  flex: 1;
  min-width: 250px;
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 0.9em;
}

.search-input:focus {
  outline: none;
  border-color: #0066CC;
  box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
}

.filter-select {
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 0.9em;
  background: white;
  cursor: pointer;
  min-width: 180px;
}

/* Loading/Error States */
.loading-state,
.error-state {
  text-align: center;
  padding: 50px 20px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #0066CC;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-icon {
  font-size: 2.5em;
  margin-bottom: 15px;
}

.error-state h3 {
  color: #dc3545;
  margin-bottom: 10px;
}

/* Table */
.table-container {
  overflow-x: auto;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  margin-bottom: 20px;
}

.transactions-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9em;
}

.transactions-table thead {
  background: #003366;
  color: white;
}

.transactions-table th {
  padding: 12px;
  text-align: left;
  font-weight: 600;
  font-size: 0.85em;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.transactions-table tbody tr {
  border-bottom: 1px solid #f5f5f5;
  transition: background 0.3s;
}

.transactions-table tbody tr:hover {
  background: #f9f9f9;
}

.transactions-table td {
  padding: 12px;
  vertical-align: top;
}

.invoice-cell,
.client-cell,
.product-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.invoice-number,
.client-name,
.product-name {
  font-weight: 500;
  color: #333;
}

.invoice-ref,
.client-contact,
.product-category {
  font-size: 0.85em;
  color: #666;
}

.amount-col {
  text-align: right;
  font-weight: 500;
}

.amount-col.paid {
  color: #28a745;
}

.balance-paid {
  color: #28a745;
  font-weight: 600;
}

.balance-unpaid {
  color: #dc3545;
  font-weight: 600;
}

.payment-method {
  font-size: 0.85em;
  color: #666;
}

.status-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.8em;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-unpaid {
  background: rgba(220, 53, 69, 0.1);
  color: #dc3545;
}

.status-paid {
  background: rgba(40, 167, 69, 0.1);
  color: #28a745;
}

.status-partial {
  background: rgba(255, 193, 7, 0.1);
  color: #856404;
}

.status-overdue {
  background: rgba(220, 53, 69, 0.2);
  color: #721c24;
}

.actions-col {
  white-space: nowrap;
}

.action-buttons {
  display: flex;
  gap: 6px;
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  padding: 20px 0;
}

.page-info {
  color: #666;
  font-size: 0.9em;
  min-width: 100px;
  text-align: center;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 50px 20px;
  background: #f9f9f9;
  border-radius: 8px;
  border: 2px dashed #ddd;
}

.empty-icon {
  font-size: 3em;
  margin-bottom: 15px;
  opacity: 0.5;
}

.empty-state h3 {
  color: #666;
  margin-bottom: 10px;
}

/* Buttons */
.btn {
  padding: 10px 18px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.9em;
  font-weight: 500;
  transition: all 0.3s;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 0.85em;
}

.btn-primary {
  background: #E31E24;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #c01820;
}

.btn-secondary {
  background: #0066CC;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #0052a3;
}

.btn-success {
  background: #28a745;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #218838;
}

.btn-info {
  background: #17a2b8;
  color: white;
}

.btn-info:hover:not(:disabled) {
  background: #138496;
}

.btn-refresh {
  background: #6c757d;
  color: white;
}

.btn-refresh:hover:not(:disabled) {
  background: #5a6268;
}

.btn-icon {
  font-size: 1em;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
}

.modal {
  background: white;
  border-radius: 8px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 2px solid #f5f5f5;
}

.modal-header h3 {
  color: #003366;
  margin: 0;
  font-size: 1.2em;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.8em;
  color: #999;
  cursor: pointer;
  width: 35px;
  height: 35px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s;
}

.modal-close:hover {
  background: #f5f5f5;
  color: #E31E24;
}

.modal-body {
  padding: 20px;
}

.transaction-info {
  background: #f9f9f9;
  padding: 15px;
  border-radius: 5px;
  margin-bottom: 20px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}

.info-row:last-child {
  border-bottom: none;
}

.info-row .label {
  color: #666;
  font-weight: 500;
}

.info-row .value {
  color: #333;
  font-weight: 600;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  color: #333;
  font-weight: 500;
  font-size: 0.9em;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 0.9em;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #0066CC;
  box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
}

.modal-footer {
  padding: 20px;
  border-top: 2px solid #f5f5f5;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* Responsive */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .header-right {
    width: 100%;
    justify-content: flex-end;
  }
  
  .filter-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .quick-filters {
    margin-left: 0;
    width: 100%;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .search-filter-bar {
    flex-direction: column;
  }
  
  .search-input,
  .filter-select {
    width: 100%;
  }
  
  .transactions-table {
    font-size: 0.85em;
  }
  
  .transactions-table th,
  .transactions-table td {
    padding: 8px;
  }
  
  .action-buttons {
    flex-direction: column;
  }
}
</style>