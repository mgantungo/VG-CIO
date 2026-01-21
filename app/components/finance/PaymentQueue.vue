<!--components/finance/PaymentQueue.vue-->
<template>
  <div class="payment-queue">
    <div class="queue-controls">
      <div class="search-filter">
        <input 
          v-model="searchQuery"
          type="text" 
          placeholder="Search invoices..."
          class="search-input"
          @input="handleSearch"
        >
        
        <select v-model="statusFilter" class="filter-select" @change="filterInvoices">
          <option value="">All Status</option>
          <option value="unpaid">Unpaid</option>
          <option value="partial">Partial</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
        </select>
        
        <select v-model="clientFilter" class="filter-select" @change="filterInvoices">
          <option value="">All Clients</option>
          <option v-for="client in clients" :key="client.id" :value="client.id">
            {{ client.name }}
          </option>
        </select>
        
        <button class="btn btn-secondary btn-sm" @click="resetFilters">
          Reset
        </button>
      </div>
      
      <div class="queue-actions">
        <button class="btn btn-primary btn-sm" @click="exportInvoices">
          Export
        </button>
        <button class="btn btn-success btn-sm" @click="bulkPayment">
          Bulk Payment
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <div>Loading invoices...</div>
    </div>

    <div v-else-if="filteredInvoices.length === 0" class="empty-state">
      <div class="empty-icon">💰</div>
      <h4>No Invoices Found</h4>
      <p>No invoices match your search criteria.</p>
      <button class="btn btn-secondary" @click="resetFilters">
        Reset Filters
      </button>
    </div>

    <div v-else class="invoices-list">
      <table class="invoices-table">
        <thead>
          <tr>
            <th>
              <input 
                type="checkbox" 
                v-model="selectAll"
                @change="toggleSelectAll"
              >
            </th>
            <th @click="sortBy('invoiceNumber')">
              Invoice #
              <span class="sort-icon" v-if="sortField === 'invoiceNumber'">
                {{ sortDirection === 'asc' ? '↑' : '↓' }}
              </span>
            </th>
            <th @click="sortBy('clientName')">
              Client
              <span class="sort-icon" v-if="sortField === 'clientName'">
                {{ sortDirection === 'asc' ? '↑' : '↓' }}
              </span>
            </th>
            <th @click="sortBy('totalAmount')">
              Amount
              <span class="sort-icon" v-if="sortField === 'totalAmount'">
                {{ sortDirection === 'asc' ? '↑' : '↓' }}
              </span>
            </th>
            <th @click="sortBy('balance')">
              Balance
              <span class="sort-icon" v-if="sortField === 'balance'">
                {{ sortDirection === 'asc' ? '↑' : '↓' }}
              </span>
            </th>
            <th @click="sortBy('dueDate')">
              Due Date
              <span class="sort-icon" v-if="sortField === 'dueDate'">
                {{ sortDirection === 'asc' ? '↑' : '↓' }}
              </span>
            </th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr 
            v-for="invoice in sortedInvoices" 
            :key="invoice.id"
            :class="{ 
              'selected': selectedInvoices.includes(invoice.id),
              'overdue': isOverdue(invoice.dueDate)
            }"
          >
            <td>
              <input 
                type="checkbox" 
                :checked="selectedInvoices.includes(invoice.id)"
                @change="toggleInvoice(invoice.id)"
              >
            </td>
            <td>
              <div class="invoice-number">{{ invoice.invoiceNumber }}</div>
              <div class="invoice-ref">{{ invoice.advertReference }}</div>
            </td>
            <td>
              <div class="client-name">{{ invoice.clientName }}</div>
              <div class="client-contact">{{ invoice.contactPerson }}</div>
            </td>
            <td>
              <div class="amount total">{{ formatCurrency(invoice.totalAmount) }}</div>
              <div class="amount paid">Paid: {{ formatCurrency(invoice.amountPaid) }}</div>
            </td>
            <td>
              <div 
                class="balance-amount"
                :class="getBalanceClass(invoice.balance, invoice.totalAmount)"
              >
                {{ formatCurrency(invoice.balance) }}
              </div>
              <div 
                class="balance-percentage"
                :class="getPercentageClass(invoice.balance, invoice.totalAmount)"
              >
                {{ calculatePercentage(invoice.balance, invoice.totalAmount) }}%
              </div>
            </td>
            <td>
              <div class="due-date">
                {{ formatDate(invoice.dueDate) }}
              </div>
              <div v-if="isOverdue(invoice.dueDate)" class="overdue-badge">
                Overdue
              </div>
            </td>
            <td>
              <span :class="`status-badge status-${invoice.paymentStatus}`">
                {{ formatStatus(invoice.paymentStatus) }}
              </span>
            </td>
            <td>
              <div class="invoice-actions">
                <button 
                  v-if="invoice.balance > 0"
                  class="btn btn-success btn-sm"
                  @click="$emit('record-payment', invoice)"
                  title="Record Payment"
                >
                  💰
                </button>
                <button 
                  class="btn btn-info btn-sm"
                  @click="$emit('view-details', invoice)"
                  title="View Details"
                >
                  👁️
                </button>
                <button 
                  class="btn btn-warning btn-sm"
                  @click="$emit('send-reminder', invoice)"
                  title="Send Reminder"
                >
                  📧
                </button>
                <button 
                  class="btn btn-secondary btn-sm"
                  @click="$emit('download-invoice', invoice)"
                  title="Download"
                >
                  ⬇️
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="filteredInvoices.length > 0" class="queue-footer">
      <div class="selection-info">
        <span v-if="selectedInvoices.length > 0">
          {{ selectedInvoices.length }} invoice(s) selected
          <button class="btn btn-danger btn-sm" @click="clearSelection">
            Clear
          </button>
        </span>
        <span v-else>
          Total: {{ filteredInvoices.length }} invoice(s)
        </span>
      </div>
      
      <div class="pagination-controls">
        <button 
          class="btn btn-secondary btn-sm"
          :disabled="currentPage === 1"
          @click="prevPage"
        >
          Previous
        </button>
        
        <span class="page-info">
          Page {{ currentPage }} of {{ totalPages }}
        </span>
        
        <button 
          class="btn btn-secondary btn-sm"
          :disabled="currentPage === totalPages"
          @click="nextPage"
        >
          Next
        </button>
      </div>
      
      <div class="queue-stats">
        <span class="stat-item">
          Total: <strong>{{ formatCurrency(totalAmount) }}</strong>
        </span>
        <span class="stat-item">
          Outstanding: <strong>{{ formatCurrency(outstandingAmount) }}</strong>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { formatCurrency, formatDate } from '~/utils/formatters'

const props = defineProps({
  invoices: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  pageSize: {
    type: Number,
    default: 10
  }
})

const emit = defineEmits([
  'record-payment',
  'view-details',
  'send-reminder',
  'download-invoice',
  'bulk-payment',
  'export',
  'page-change'
])

const searchQuery = ref('')
const statusFilter = ref('')
const clientFilter = ref('')
const selectedInvoices = ref([])
const selectAll = ref(false)
const sortField = ref('dueDate')
const sortDirection = ref('asc')
const currentPage = ref(1)

const clients = computed(() => {
  const uniqueClients = []
  const clientMap = {}
  
  props.invoices.forEach(invoice => {
    if (invoice.clientName && !clientMap[invoice.clientName]) {
      clientMap[invoice.clientName] = true
      uniqueClients.push({
        id: invoice.clientId || invoice.clientName,
        name: invoice.clientName
      })
    }
  })
  
  return uniqueClients
})

const filteredInvoices = computed(() => {
  let filtered = [...props.invoices]
  
  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(invoice => 
      invoice.invoiceNumber?.toLowerCase().includes(query) ||
      invoice.clientName?.toLowerCase().includes(query) ||
      invoice.advertReference?.toLowerCase().includes(query) ||
      invoice.contactPerson?.toLowerCase().includes(query)
    )
  }
  
  // Apply status filter
  if (statusFilter.value) {
    filtered = filtered.filter(invoice => 
      invoice.paymentStatus === statusFilter.value
    )
  }
  
  // Apply client filter
  if (clientFilter.value) {
    filtered = filtered.filter(invoice => 
      invoice.clientId === clientFilter.value || 
      invoice.clientName === clientFilter.value
    )
  }
  
  return filtered
})

const sortedInvoices = computed(() => {
  const sorted = [...filteredInvoices.value]
  
  sorted.sort((a, b) => {
    let aValue = a[sortField.value]
    let bValue = b[sortField.value]
    
    // Handle special cases
    if (sortField.value === 'dueDate') {
      aValue = new Date(aValue)
      bValue = new Date(bValue)
    }
    
    if (aValue < bValue) {
      return sortDirection.value === 'asc' ? -1 : 1
    }
    if (aValue > bValue) {
      return sortDirection.value === 'asc' ? 1 : -1
    }
    return 0
  })
  
  // Apply pagination
  const start = (currentPage.value - 1) * props.pageSize
  const end = start + props.pageSize
  return sorted.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(filteredInvoices.value.length / props.pageSize)
})

const totalAmount = computed(() => {
  return filteredInvoices.value.reduce((sum, invoice) => sum + invoice.totalAmount, 0)
})

const outstandingAmount = computed(() => {
  return filteredInvoices.value.reduce((sum, invoice) => sum + invoice.balance, 0)
})

onMounted(() => {
  // Initialize with default sorting by due date (ascending - soonest first)
  sortField.value = 'dueDate'
  sortDirection.value = 'asc'
})

const handleSearch = () => {
  currentPage.value = 1
}

const filterInvoices = () => {
  currentPage.value = 1
}

const resetFilters = () => {
  searchQuery.value = ''
  statusFilter.value = ''
  clientFilter.value = ''
  selectedInvoices.value = []
  selectAll.value = false
  currentPage.value = 1
}

const sortBy = (field) => {
  if (sortField.value === field) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    sortDirection.value = 'asc'
  }
}

const toggleSelectAll = () => {
  if (selectAll.value) {
    selectedInvoices.value = sortedInvoices.value.map(invoice => invoice.id)
  } else {
    selectedInvoices.value = []
  }
}

const toggleInvoice = (invoiceId) => {
  const index = selectedInvoices.value.indexOf(invoiceId)
  if (index === -1) {
    selectedInvoices.value.push(invoiceId)
  } else {
    selectedInvoices.value.splice(index, 1)
  }
  
  // Update selectAll checkbox
  selectAll.value = selectedInvoices.value.length === sortedInvoices.value.length
}

const clearSelection = () => {
  selectedInvoices.value = []
  selectAll.value = false
}

const isOverdue = (dueDate) => {
  if (!dueDate) return false
  
  const due = new Date(dueDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  return due < today
}

const getBalanceClass = (balance, totalAmount) => {
  if (balance === 0) return 'balance-paid'
  if (balance === totalAmount) return 'balance-unpaid'
  return 'balance-partial'
}

const getPercentageClass = (balance, totalAmount) => {
  const percentage = (balance / totalAmount) * 100
  if (percentage === 0) return 'percentage-paid'
  if (percentage === 100) return 'percentage-unpaid'
  if (percentage >= 50) return 'percentage-high'
  return 'percentage-low'
}

const calculatePercentage = (balance, totalAmount) => {
  if (totalAmount === 0) return 0
  return Math.round((balance / totalAmount) * 100)
}

const formatStatus = (status) => {
  const statusMap = {
    unpaid: 'Unpaid',
    partial: 'Partial',
    paid: 'Paid',
    overdue: 'Overdue'
  }
  return statusMap[status] || status
}

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
    emit('page-change', currentPage.value)
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    emit('page-change', currentPage.value)
  }
}

const exportInvoices = () => {
  const exportData = {
    invoices: filteredInvoices.value,
    filters: {
      search: searchQuery.value,
      status: statusFilter.value,
      client: clientFilter.value
    },
    totals: {
      totalAmount: totalAmount.value,
      outstandingAmount: outstandingAmount.value
    }
  }
  
  emit('export', exportData)
}

const bulkPayment = () => {
  if (selectedInvoices.value.length === 0) {
    alert('Please select invoices to process bulk payment')
    return
  }
  
  const selected = filteredInvoices.value.filter(invoice => 
    selectedInvoices.value.includes(invoice.id)
  )
  
  emit('bulk-payment', {
    invoices: selected,
    totalAmount: selected.reduce((sum, invoice) => sum + invoice.balance, 0)
  })
}
</script>

<style scoped>
.payment-queue {
  width: 100%;
}

.queue-controls {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 25px;
  padding-bottom: 20px;
  border-bottom: 2px solid #F5F5F5;
  flex-wrap: wrap;
  gap: 15px;
}

.search-filter {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  flex: 1;
}

.search-input {
  padding: 10px 15px;
  border: 1px solid #DDDDDD;
  border-radius: 5px;
  font-size: 0.95em;
  min-width: 250px;
  flex: 1;
}

.search-input:focus {
  outline: none;
  border-color: #0066CC;
  box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
}

.filter-select {
  padding: 10px 15px;
  border: 1px solid #DDDDDD;
  border-radius: 5px;
  font-size: 0.95em;
  min-width: 150px;
  background: white;
  cursor: pointer;
}

.filter-select:focus {
  outline: none;
  border-color: #0066CC;
}

.queue-actions {
  display: flex;
  gap: 10px;
}

.loading-state {
  text-align: center;
  padding: 60px 20px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #DDDDDD;
  border-top-color: #0066CC;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: #F9F9F9;
  border-radius: 8px;
  border: 2px dashed #DDDDDD;
}

.empty-icon {
  font-size: 3em;
  color: #0066CC;
  margin-bottom: 20px;
}

.empty-state h4 {
  color: #666;
  margin-bottom: 10px;
  font-weight: 500;
}

.empty-state p {
  color: #999;
  margin-bottom: 30px;
}

.invoices-list {
  overflow-x: auto;
}

.invoices-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95em;
}

.invoices-table thead {
  background: #003366;
  color: white;
}

.invoices-table th {
  padding: 15px 12px;
  text-align: left;
  font-weight: 600;
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
}

.invoices-table th:hover {
  background: rgba(255, 255, 255, 0.1);
}

.invoices-table tbody tr {
  border-bottom: 1px solid #F5F5F5;
  transition: background 0.3s;
}

.invoices-table tbody tr:hover {
  background: #F9F9F9;
}

.invoices-table tbody tr.selected {
  background: rgba(0, 102, 204, 0.05);
}

.invoices-table tbody tr.overdue {
  background: rgba(220, 53, 69, 0.05);
}

.invoices-table tbody tr.selected:hover {
  background: rgba(0, 102, 204, 0.1);
}

.invoices-table tbody tr.overdue:hover {
  background: rgba(220, 53, 69, 0.1);
}

.invoices-table td {
  padding: 15px 12px;
  vertical-align: top;
}

.invoice-number {
  font-weight: 600;
  color: #003366;
}

.invoice-ref {
  font-size: 0.85em;
  color: #666;
  margin-top: 3px;
}

.client-name {
  font-weight: 500;
  color: #333;
}

.client-contact {
  font-size: 0.85em;
  color: #666;
  margin-top: 3px;
}

.amount {
  font-weight: 500;
}

.amount.total {
  color: #003366;
  font-size: 1em;
}

.amount.paid {
  color: #28a745;
  font-size: 0.85em;
  margin-top: 3px;
}

.balance-amount {
  font-weight: 600;
  font-size: 1em;
}

.balance-paid {
  color: #28a745;
}

.balance-unpaid {
  color: #dc3545;
}

.balance-partial {
  color: #ffc107;
}

.balance-percentage {
  font-size: 0.85em;
  margin-top: 3px;
}

.percentage-paid {
  color: #28a745;
}

.percentage-unpaid {
  color: #dc3545;
}

.percentage-high {
  color: #ffc107;
}

.percentage-low {
  color: #17a2b8;
}

.due-date {
  font-weight: 500;
  color: #333;
}

.overdue-badge {
  display: inline-block;
  margin-top: 5px;
  padding: 2px 8px;
  background: #dc3545;
  color: white;
  border-radius: 10px;
  font-size: 0.75em;
  font-weight: 600;
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.85em;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-unpaid {
  background: #fab1a0;
  color: #d63031;
}

.status-partial {
  background: #ffeaa7;
  color: #636e72;
}

.status-paid {
  background: #55efc4;
  color: #00b894;
}

.status-overdue {
  background: #ff7675;
  color: #d63031;
}

.invoice-actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.sort-icon {
  margin-left: 5px;
  font-weight: bold;
}

.queue-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 2px solid #DDDDDD;
  flex-wrap: wrap;
  gap: 15px;
}

.selection-info {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #666;
  font-size: 0.9em;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 15px;
}

.page-info {
  color: #666;
  font-size: 0.9em;
  min-width: 100px;
  text-align: center;
}

.queue-stats {
  display: flex;
  gap: 20px;
}

.stat-item {
  color: #666;
  font-size: 0.9em;
}

.stat-item strong {
  color: #003366;
  margin-left: 5px;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.9em;
  font-weight: 500;
  transition: all 0.3s;
}

.btn-primary {
  background: #E31E24;
  color: white;
}

.btn-primary:hover {
  background: #c01820;
  transform: translateY(-1px);
}

.btn-secondary {
  background: #0066CC;
  color: white;
}

.btn-secondary:hover {
  background: #0052a3;
  transform: translateY(-1px);
}

.btn-success {
  background: #28a745;
  color: white;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-warning {
  background: #ffc107;
  color: #333333;
}

.btn-info {
  background: #17a2b8;
  color: white;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 0.85em;
}

@media (max-width: 768px) {
  .queue-controls {
    flex-direction: column;
  }
  
  .search-filter {
    width: 100%;
  }
  
  .search-input,
  .filter-select {
    min-width: 100%;
  }
  
  .invoices-table {
    font-size: 0.9em;
  }
  
  .invoices-table th,
  .invoices-table td {
    padding: 10px 8px;
  }
  
  .invoice-actions {
    flex-direction: column;
  }
  
  .queue-footer {
    flex-direction: column;
    text-align: center;
  }
  
  .queue-stats {
    justify-content: center;
  }
}
</style>