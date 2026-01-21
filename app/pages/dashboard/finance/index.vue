<!--pages/dashboard/finance/index.vue - Finance Dashboard Overview-->
<template>
  <div class="finance-dashboard">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-left">
        <h1>💰 Finance Dashboard</h1>
        <p>Overview of advertising revenue and payment collections</p>
      </div>
      <div class="header-right">
        <button class="btn btn-secondary" @click="navigateTo('/dashboard/finance/reports')">
          <span class="btn-icon">📊</span> Reports
        </button>
        <button class="btn btn-primary" @click="navigateTo('/dashboard/finance/payments')">
          <span class="btn-icon">💳</span> Payments
        </button>
      </div>
    </div>

    <!-- Date Range Filter -->
    <div class="filter-card">
      <div class="filter-controls">
        <div class="date-group">
          <label>Period:</label>
          <select v-model="selectedPeriod" @change="handlePeriodChange" class="period-select">
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
        </div>
        <div class="date-range">
          <span class="date-display">{{ formatDateRange() }}</span>
        </div>
        <button class="btn btn-refresh btn-sm" @click="refreshData" :disabled="loading">
          <span v-if="loading">⏳</span>
          <span v-else>🔄</span> Refresh
        </button>
      </div>
    </div>

    <!-- Key Metrics Grid -->
    <div class="metrics-section">
      <h2 class="section-title">Key Metrics</h2>
      <div class="stats-grid">
        <StatCard 
          icon="💵"
          :value="formatCurrency(totalRevenue)"
          label="Total Revenue"
          color="blue"
        />
        <StatCard 
          icon="✓"
          :value="formatCurrency(collectedThisMonth)"
          label="Amount Collected"
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
      </div>
    </div>

    <!-- Collection Rate & Payment Status -->
    <div class="analytics-grid">
      <!-- Collection Rate Card -->
      <div class="content-card">
        <div class="card-header">
          <h3>Collection Performance</h3>
        </div>
        <div class="card-body">
          <div class="collection-stats">
            <div class="collection-rate-display">
              <div class="rate-circle" :class="getRateClass(collectionRate)">
                <span class="rate-value">{{ collectionRate }}%</span>
                <span class="rate-label">Collection Rate</span>
              </div>
            </div>
            <div class="collection-breakdown">
              <div class="breakdown-item">
                <span class="item-label">Paid in Full</span>
                <div class="item-bar">
                  <div class="bar-fill paid" :style="{ width: paidPercentage + '%' }"></div>
                </div>
                <span class="item-value">{{ paidCount }} ({{ paidPercentage }}%)</span>
              </div>
              <div class="breakdown-item">
                <span class="item-label">Partial Payment</span>
                <div class="item-bar">
                  <div class="bar-fill partial" :style="{ width: partialPercentage + '%' }"></div>
                </div>
                <span class="item-value">{{ partialCount }} ({{ partialPercentage }}%)</span>
              </div>
              <div class="breakdown-item">
                <span class="item-label">Unpaid</span>
                <div class="item-bar">
                  <div class="bar-fill unpaid" :style="{ width: unpaidPercentage + '%' }"></div>
                </div>
                <span class="item-value">{{ unpaidCount }} ({{ unpaidPercentage }}%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Payment Methods Card -->
      <div class="content-card">
        <div class="card-header">
          <h3>Payment Methods</h3>
        </div>
        <div class="card-body">
          <div class="payment-methods-list">
            <div 
              v-for="method in paymentMethodsBreakdown" 
              :key="method.name"
              class="method-item"
            >
              <div class="method-info">
                <span class="method-icon">{{ getPaymentMethodIcon(method.name) }}</span>
                <span class="method-name">{{ method.name }}</span>
              </div>
              <div class="method-stats">
                <span class="method-count">{{ method.count }} txns</span>
                <span class="method-amount">{{ formatCurrency(method.amount) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Platform Revenue & Recent Transactions -->
    <div class="analytics-grid">
      <!-- Platform Revenue Card -->
      <div class="content-card">
        <div class="card-header">
          <h3>Revenue by Platform</h3>
        </div>
        <div class="card-body">
          <div class="platform-list">
            <div 
              v-for="platform in platformBreakdown" 
              :key="platform.name"
              class="platform-item"
            >
              <div class="platform-header">
                <span class="platform-name">{{ platform.name }}</span>
                <span class="platform-amount">{{ formatCurrency(platform.revenue) }}</span>
              </div>
              <div class="platform-bar">
                <div 
                  class="bar-fill" 
                  :style="{ 
                    width: platform.percentage + '%',
                    background: getPlatformColor(platform.name)
                  }"
                ></div>
              </div>
              <div class="platform-meta">
                <span class="platform-count">{{ platform.count }} adverts</span>
                <span class="platform-percentage">{{ platform.percentage }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions Card -->
      <div class="content-card">
        <div class="card-header">
          <h3>Quick Actions</h3>
        </div>
        <div class="card-body">
          <div class="quick-actions-grid">
            <button class="action-card" @click="navigateTo('/dashboard/finance/payments?tab=unpaid')">
              <div class="action-icon unpaid">⏳</div>
              <div class="action-content">
                <span class="action-title">View Unpaid</span>
                <span class="action-count">{{ unpaidCount }} transactions</span>
              </div>
            </button>
            
            <button class="action-card" @click="navigateTo('/dashboard/finance/payments?tab=overdue')">
              <div class="action-icon overdue">⚠️</div>
              <div class="action-content">
                <span class="action-title">Overdue Items</span>
                <span class="action-count">{{ overdueCount }} items</span>
              </div>
            </button>
            
            <button class="action-card" @click="navigateTo('/dashboard/finance/reports')">
              <div class="action-icon reports">📊</div>
              <div class="action-content">
                <span class="action-title">Generate Report</span>
                <span class="action-count">Multiple formats</span>
              </div>
            </button>
            
            <button class="action-card" @click="exportData">
              <div class="action-icon export">📥</div>
              <div class="action-content">
                <span class="action-title">Export Data</span>
                <span class="action-count">CSV / Excel</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Transactions -->
    <div class="content-card">
      <div class="card-header">
        <h3>Recent Transactions</h3>
        <button class="btn btn-sm btn-secondary" @click="navigateTo('/dashboard/finance/payments')">
          View All →
        </button>
      </div>
      
      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading transactions...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <div class="error-icon">⚠️</div>
        <p>{{ error }}</p>
        <button class="btn btn-primary btn-sm" @click="loadData">Try Again</button>
      </div>

      <!-- Transactions Table -->
      <div v-else-if="recentTransactions.length > 0" class="card-body">
        <div class="table-container">
          <table class="transactions-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Client</th>
                <th>Product</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="transaction in recentTransactions" :key="transaction.id">
                <td>
                  <div class="ref-cell">
                    <div class="ref-number">{{ transaction.advertReference }}</div>
                    <div class="invoice-number">{{ transaction.invoiceNumber }}</div>
                  </div>
                </td>
                <td>
                  <div class="client-cell">
                    <div class="client-name">{{ transaction.clientName }}</div>
                  </div>
                </td>
                <td>
                  <div class="product-name">{{ transaction.productName }}</div>
                </td>
                <td>
                  <strong>{{ formatCurrency(transaction.totalAmount) }}</strong>
                </td>
                <td>
                  <span :class="`status-badge status-${transaction.paymentStatus}`">
                    {{ formatPaymentStatus(transaction.paymentStatus) }}
                  </span>
                </td>
                <td>
                  <span class="date-text">{{ formatDate(transaction.createdAt) }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state">
        <div class="empty-icon">💰</div>
        <h4>No Transactions Yet</h4>
        <p>Transactions will appear here once created</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import StatCard from '~/components/common/StatCard.vue'
import { usePayments } from '~/composables/usePayments'
import { ref, computed, onMounted } from 'vue'
import { useRouter } from '#imports'

const router = useRouter()
const navigateTo = router.push

const {
  transactions,
  loading,
  error,
  collectedThisMonth,
  outstanding,
  pendingPayments,
  collectionRate,
  totalRevenue,
  loadTransactions,
  exportTransactions
} = usePayments()

// State
const selectedPeriod = ref('month')
const startDate = ref('')
const endDate = ref('')
const today = ref(new Date().toISOString().split('T')[0])

// Computed
const recentTransactions = computed(() => {
  return transactions.value.slice(0, 10)
})

const paidCount = computed(() => {
  return transactions.value.filter(t => t.paymentStatus === 'paid').length
})

const partialCount = computed(() => {
  return transactions.value.filter(t => t.paymentStatus === 'partial').length
})

const unpaidCount = computed(() => {
  return transactions.value.filter(t => t.paymentStatus === 'unpaid').length
})

const overdueCount = computed(() => {
  return transactions.value.filter(t => t.paymentStatus === 'overdue').length
})

const paidPercentage = computed(() => {
  if (transactions.value.length === 0) return 0
  return Math.round((paidCount.value / transactions.value.length) * 100)
})

const partialPercentage = computed(() => {
  if (transactions.value.length === 0) return 0
  return Math.round((partialCount.value / transactions.value.length) * 100)
})

const unpaidPercentage = computed(() => {
  if (transactions.value.length === 0) return 0
  return Math.round((unpaidCount.value / transactions.value.length) * 100)
})

const platformBreakdown = computed(() => {
  const platforms = {}
  
  transactions.value.forEach(t => {
    const platform = t.categoryName || 'Other'
    if (!platforms[platform]) {
      platforms[platform] = { name: platform, count: 0, revenue: 0 }
    }
    platforms[platform].count++
    platforms[platform].revenue += t.totalAmount
  })
  
  const total = Object.values(platforms).reduce((sum, p) => sum + p.revenue, 0)
  
  return Object.values(platforms)
    .map(p => ({
      ...p,
      percentage: total > 0 ? Math.round((p.revenue / total) * 100) : 0
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)
})

const paymentMethodsBreakdown = computed(() => {
  const methods = {}
  
  transactions.value.forEach(t => {
    const method = formatPaymentMethod(t.paymentMethod)
    if (!methods[method]) {
      methods[method] = { name: method, count: 0, amount: 0 }
    }
    methods[method].count++
    methods[method].amount += t.totalAmount
  })
  
  return Object.values(methods).sort((a, b) => b.amount - a.amount)
})

// Methods
const handlePeriodChange = () => {
  const { start, end } = calculatePeriodDates(selectedPeriod.value)
  startDate.value = start
  endDate.value = end
  loadData()
}

const calculatePeriodDates = (period) => {
  const now = new Date()
  let start, end
  
  switch (period) {
    case 'today':
      start = now
      end = now
      break
    case 'week':
      start = new Date(now)
      start.setDate(now.getDate() - now.getDay() + 1)
      end = now
      break
    case 'month':
      start = new Date(now.getFullYear(), now.getMonth(), 1)
      end = now
      break
    case 'quarter':
      const quarter = Math.floor(now.getMonth() / 3)
      start = new Date(now.getFullYear(), quarter * 3, 1)
      end = now
      break
    case 'year':
      start = new Date(now.getFullYear(), 0, 1)
      end = now
      break
    default:
      start = new Date(now.getFullYear(), now.getMonth(), 1)
      end = now
  }
  
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0]
  }
}

const formatDateRange = () => {
  if (!startDate.value || !endDate.value) return ''
  
  const start = new Date(startDate.value).toLocaleDateString('en-UG', {
    month: 'short',
    day: 'numeric'
  })
  
  const end = new Date(endDate.value).toLocaleDateString('en-UG', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
  
  return `${start} - ${end}`
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

const exportData = () => {
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

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('en-UG', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

const getRateClass = (rate) => {
  if (rate >= 80) return 'excellent'
  if (rate >= 60) return 'good'
  if (rate >= 40) return 'average'
  return 'poor'
}

const getPlatformColor = (platform) => {
  const colors = {
    'Print Media': '#0066CC',
    'Television': '#8E44AD',
    'Radio': '#E67E22',
    'Digital': '#2ECC71',
    'Other': '#6c757d'
  }
  return colors[platform] || '#0066CC'
}

const getPaymentMethodIcon = (method) => {
  const icons = {
    'Cash': '💵',
    'Bank Transfer': '🏦',
    'Mobile Money': '📱',
    'Credit': '💳',
    'Cheque': '📝'
  }
  return icons[method] || '💰'
}

// Lifecycle
onMounted(() => {
  handlePeriodChange()
})
</script>

<style scoped>
.finance-dashboard {
  width: 100%;
  padding-bottom: 30px;
}

/* Page Header */
.page-header {
  background: white;
  padding: 20px 30px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
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
  padding: 15px 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.08);
}

.filter-controls {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.date-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.date-group label {
  font-size: 0.9em;
  color: #666;
  font-weight: 500;
}

.period-select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 0.9em;
  background: white;
  cursor: pointer;
}

.date-range {
  flex: 1;
}

.date-display {
  color: #333;
  font-size: 0.9em;
  font-weight: 500;
}

/* Section Title */
.section-title {
  color: #003366;
  font-size: 1.2em;
  font-weight: 600;
  margin-bottom: 15px;
}

/* Metrics Section */
.metrics-section {
  margin-bottom: 25px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
}

/* Analytics Grid */
.analytics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 25px;
}

/* Content Card */
.content-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.08);
  overflow: hidden;
}

.card-header {
  padding: 15px 20px;
  border-bottom: 2px solid #f5f5f5;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  color: #003366;
  margin: 0;
  font-size: 1.1em;
  font-weight: 600;
}

.card-body {
  padding: 20px;
}

/* Collection Stats */
.collection-stats {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 30px;
  align-items: center;
}

.collection-rate-display {
  display: flex;
  justify-content: center;
}

.rate-circle {
  width: 140px;
  height: 140px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 8px solid;
  position: relative;
}

.rate-circle.excellent {
  border-color: #28a745;
  background: rgba(40, 167, 69, 0.05);
}

.rate-circle.good {
  border-color: #0066CC;
  background: rgba(0, 102, 204, 0.05);
}

.rate-circle.average {
  border-color: #ffc107;
  background: rgba(255, 193, 7, 0.05);
}

.rate-circle.poor {
  border-color: #dc3545;
  background: rgba(220, 53, 69, 0.05);
}

.rate-value {
  font-size: 2em;
  font-weight: 700;
  color: #003366;
}

.rate-label {
  font-size: 0.75em;
  color: #666;
  text-align: center;
  margin-top: 5px;
}

.collection-breakdown {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.breakdown-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.item-label {
  font-size: 0.85em;
  color: #666;
  font-weight: 500;
}

.item-bar {
  width: 100%;
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.bar-fill.paid {
  background: #28a745;
}

.bar-fill.partial {
  background: #ffc107;
}

.bar-fill.unpaid {
  background: #dc3545;
}

.item-value {
  font-size: 0.85em;
  color: #333;
  font-weight: 600;
}

/* Payment Methods */
.payment-methods-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.method-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 6px;
  border-left: 3px solid #0066CC;
}

.method-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.method-icon {
  font-size: 1.3em;
}

.method-name {
  font-weight: 500;
  color: #333;
}

.method-stats {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.method-count {
  font-size: 0.8em;
  color: #666;
}

.method-amount {
  font-weight: 600;
  color: #003366;
  font-size: 0.95em;
}

/* Platform List */
.platform-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.platform-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.platform-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.platform-name {
  font-weight: 500;
  color: #333;
  font-size: 0.9em;
}

.platform-amount {
  font-weight: 600;
  color: #003366;
  font-size: 0.95em;
}

.platform-bar {
  width: 100%;
  height: 6px;
  background: #f0f0f0;
  border-radius: 3px;
  overflow: hidden;
}

.platform-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.8em;
  color: #666;
}

/* Quick Actions */
.quick-actions-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.action-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 15px;
  background: #f9f9f9;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.action-card:hover {
  background: white;
  border-color: #0066CC;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.action-icon {
  width: 45px;
  height: 45px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3em;
}

.action-icon.unpaid {
  background: rgba(220, 53, 69, 0.1);
}

.action-icon.overdue {
  background: rgba(255, 193, 7, 0.1);
}

.action-icon.reports {
  background: rgba(0, 102, 204, 0.1);
}

.action-icon.export {
  background: rgba(40, 167, 69, 0.1);
}

.action-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.action-title {
  font-weight: 600;
  color: #333;
  font-size: 0.9em;
}

.action-count {
  font-size: 0.8em;
  color: #666;
}

/* Transactions Table */
.table-container {
  overflow-x: auto;
  border: 1px solid #dee2e6;
  border-radius: 8px;
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
  padding: 10px 12px;
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
  padding: 10px 12px;
  vertical-align: middle;
}

.ref-cell,
.client-cell {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.ref-number,
.client-name {
  font-weight: 500;
  color: #333;
}

.invoice-number {
  font-size: 0.85em;
  color: #666;
}

.product-name {
  color: #333;
}

.date-text {
  color: #666;
  font-size: 0.9em;
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

/* Loading/Error/Empty States */
.loading-state,
.error-state,
.empty-state {
  text-align: center;
  padding: 40px 20px;
}

.spinner {
  width: 35px;
  height: 35px;
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

.error-icon,
.empty-icon {
  font-size: 2.5em;
  margin-bottom: 10px;
  opacity: 0.6;
}

.empty-state h4 {
  color: #666;
  margin-bottom: 8px;
  font-size: 1.1em;
}

.empty-state p {
  color: #999;
  font-size: 0.9em;
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
  padding: 8px 14px;
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

/* Responsive */
@media (max-width: 1024px) {
  .analytics-grid {
    grid-template-columns: 1fr;
  }
  
  .collection-stats {
    grid-template-columns: 1fr;
    text-align: center;
  }
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .header-right {
    width: 100%;
    justify-content: flex-end;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .quick-actions-grid {
    grid-template-columns: 1fr;
  }
  
  .transactions-table {
    font-size: 0.85em;
  }
  
  .transactions-table th,
  .transactions-table td {
    padding: 8px;
  }
}
</style>