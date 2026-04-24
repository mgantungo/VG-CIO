<!--pages/dashboard/finance/reports.vue - Professional Reports Interface-->
<template>
  <div class="reports-page">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-left">
        <h1>📊 Financial Reports</h1>
        <p>Generate and analyze advertising revenue reports</p>
      </div>
      <div class="header-right">
        <button class="btn btn-secondary" @click="viewSavedReports">
          <span class="btn-icon">📁</span> Saved Reports
        </button>
      </div>
    </div>

    <!-- Report Generator -->
    <div class="content-card">
      <div class="card-header">
        <h2>Generate Report</h2>
      </div>

      <form @submit.prevent="generateReport" class="report-form">
        <div class="form-grid">
          <div class="form-group">
            <label>Report Type</label>
            <select v-model="reportForm.reportType" required>
              <option value="">Select report type</option>
              <option value="revenue_summary">Revenue Summary</option>
              <option value="payment_collection">Payment Collection Status</option>
              <option value="outstanding_invoices">Outstanding Invoices</option>
              <option value="platform_performance">Platform Performance</option>
              <option value="client_activity">Client Activity</option>
              <option value="payment_methods">Payment Methods Analysis</option>
            </select>
          </div>

          <div class="form-group">
            <label>Period</label>
            <select v-model="reportForm.period" required @change="handlePeriodChange">
              <option value="">Select period</option>
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="this_quarter">This Quarter</option>
              <option value="this_year">This Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          <div v-if="reportForm.period === 'custom'" class="form-group">
            <label>Start Date</label>
            <input 
              v-model="reportForm.startDate" 
              type="date" 
              required
              :max="reportForm.endDate || today"
            >
          </div>

          <div v-if="reportForm.period === 'custom'" class="form-group">
            <label>End Date</label>
            <input 
              v-model="reportForm.endDate" 
              type="date" 
              required
              :min="reportForm.startDate"
              :max="today"
            >
          </div>

          <div class="form-group">
            <label>Platform Filter</label>
            <select v-model="reportForm.platformFilter">
              <option value="">All Platforms</option>
              <option value="print">Print Media</option>
              <option value="tv">Television</option>
              <option value="radio">Radio</option>
              <option value="digital">Digital Media</option>
            </select>
          </div>

          <div class="form-group">
            <label>Export Format</label>
            <select v-model="reportForm.exportFormat" required>
              <option value="preview">Preview Only</option>
              <option value="pdf">PDF Document</option>
              <option value="excel">Excel Spreadsheet</option>
              <option value="csv">CSV File</option>
            </select>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" @click="resetForm">
            Reset
          </button>
          <button type="submit" class="btn btn-primary" :disabled="generating || !isFormValid">
            <span v-if="generating">⏳ Generating...</span>
            <span v-else>📊 Generate Report</span>
          </button>
        </div>
      </form>
    </div>

    <!-- Report Preview -->
    <div v-if="reportPreview" class="content-card report-preview-card">
      <div class="card-header">
        <h2>Report Preview</h2>
        <div class="preview-actions">
          <button class="btn btn-secondary btn-sm" @click="downloadReport('pdf')">
            📥 Download PDF
          </button>
          <button class="btn btn-secondary btn-sm" @click="downloadReport('excel')">
            📥 Download Excel
          </button>
          <button class="btn btn-danger btn-sm" @click="closePreview">
            ✕ Close
          </button>
        </div>
      </div>

      <!-- Revenue Summary Report -->
      <div v-if="reportPreview.type === 'revenue_summary'" class="report-content">
        <div class="report-header-section">
          <h3>Revenue Summary Report</h3>
          <p class="report-period">{{ formatPeriod() }}</p>
        </div>

        <!-- Key Metrics -->
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-label">Total Revenue</div>
            <div class="metric-value">{{ formatCurrency(reportPreview.data.totalRevenue) }}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Total Transactions</div>
            <div class="metric-value">{{ reportPreview.data.totalTransactions }}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Amount Collected</div>
            <div class="metric-value success">{{ formatCurrency(reportPreview.data.amountCollected) }}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Outstanding</div>
            <div class="metric-value danger">{{ formatCurrency(reportPreview.data.outstanding) }}</div>
          </div>
        </div>

        <!-- Platform Breakdown -->
        <div class="breakdown-section">
          <h4>Revenue by Platform</h4>
          <table class="report-table">
            <thead>
              <tr>
                <th>Platform</th>
                <th>Transactions</th>
                <th>Revenue</th>
                <th>% of Total</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="platform in reportPreview.data.platformBreakdown" :key="platform.name">
                <td><strong>{{ platform.name }}</strong></td>
                <td>{{ platform.count }}</td>
                <td>{{ formatCurrency(platform.revenue) }}</td>
                <td><span class="percentage">{{ platform.percentage }}%</span></td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td><strong>Total</strong></td>
                <td><strong>{{ reportPreview.data.totalTransactions }}</strong></td>
                <td><strong>{{ formatCurrency(reportPreview.data.totalRevenue) }}</strong></td>
                <td><strong>100%</strong></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- Payment Methods -->
        <div class="breakdown-section">
          <h4>Payment Methods Distribution</h4>
          <table class="report-table">
            <thead>
              <tr>
                <th>Payment Method</th>
                <th>Transactions</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="method in reportPreview.data.paymentMethods" :key="method.name">
                <td>{{ method.name }}</td>
                <td>{{ method.count }}</td>
                <td>{{ formatCurrency(method.amount) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Payment Collection Report -->
      <div v-if="reportPreview.type === 'payment_collection'" class="report-content">
        <div class="report-header-section">
          <h3>Payment Collection Status</h3>
          <p class="report-period">{{ formatPeriod() }}</p>
        </div>

        <!-- Collection Summary -->
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-label">Paid in Full</div>
            <div class="metric-value success">{{ reportPreview.data.paidCount }}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Partial Payment</div>
            <div class="metric-value warning">{{ reportPreview.data.partialCount }}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Unpaid</div>
            <div class="metric-value danger">{{ reportPreview.data.unpaidCount }}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Collection Rate</div>
            <div class="metric-value">{{ reportPreview.data.collectionRate }}%</div>
          </div>
        </div>
      </div>

      <!-- Outstanding Invoices Report -->
      <div v-if="reportPreview.type === 'outstanding_invoices'" class="report-content">
        <div class="report-header-section">
          <h3>Outstanding Invoices</h3>
          <p class="report-period">{{ formatPeriod() }}</p>
        </div>

        <table class="report-table">
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Client</th>
              <th>Total Amount</th>
              <th>Amount Paid</th>
              <th>Balance</th>
              <th>Days Outstanding</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="invoice in reportPreview.data.outstandingInvoices" :key="invoice.id">
              <td>{{ invoice.invoiceNumber }}</td>
              <td>{{ invoice.clientName }}</td>
              <td>{{ formatCurrency(invoice.totalAmount) }}</td>
              <td>{{ formatCurrency(invoice.amountPaid) }}</td>
              <td><strong>{{ formatCurrency(invoice.balance) }}</strong></td>
              <td>{{ invoice.daysOutstanding }} days</td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="total-row">
              <td colspan="4"><strong>Total Outstanding</strong></td>
              <td colspan="2"><strong>{{ formatCurrency(reportPreview.data.totalOutstanding) }}</strong></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- Platform Performance Report -->
      <div v-if="reportPreview.type === 'platform_performance'" class="report-content">
        <div class="report-header-section">
          <h3>Platform Performance Analysis</h3>
          <p class="report-period">{{ formatPeriod() }}</p>
        </div>

        <table class="report-table">
          <thead>
            <tr>
              <th>Platform</th>
              <th>Total Adverts</th>
              <th>Revenue</th>
              <th>Avg per Advert</th>
              <th>Growth</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="platform in reportPreview.data.platforms" :key="platform.name">
              <td><strong>{{ platform.name }}</strong></td>
              <td>{{ platform.advertCount }}</td>
              <td>{{ formatCurrency(platform.revenue) }}</td>
              <td>{{ formatCurrency(platform.avgRevenue) }}</td>
              <td>
                <span :class="platform.growth >= 0 ? 'growth-positive' : 'growth-negative'">
                  {{ platform.growth >= 0 ? '+' : '' }}{{ platform.growth }}%
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { usePayments } from '~/composables/usePayments'

const {
  transactions,
  loading,
  loadTransactions
} = usePayments()

// State
const today = ref(new Date().toISOString().split('T')[0])
const generating = ref(false)
const reportPreview = ref(null)

const reportForm = ref({
  reportType: '',
  period: '',
  startDate: '',
  endDate: '',
  platformFilter: '',
  exportFormat: 'preview'
})

// Computed
const isFormValid = computed(() => {
  if (!reportForm.value.reportType || !reportForm.value.period) return false
  if (reportForm.value.period === 'custom') {
    return reportForm.value.startDate && reportForm.value.endDate
  }
  return true
})

// Methods
const handlePeriodChange = () => {
  if (reportForm.value.period !== 'custom') {
    const { start, end } = calculatePeriodDates(reportForm.value.period)
    reportForm.value.startDate = start
    reportForm.value.endDate = end
  }
}

const calculatePeriodDates = (period) => {
  const now = new Date()
  let start, end
  
  switch (period) {
    case 'this_month':
      start = new Date(now.getFullYear(), now.getMonth(), 1)
      end = now
      break
    case 'last_month':
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      end = new Date(now.getFullYear(), now.getMonth(), 0)
      break
    case 'this_quarter':
      const quarter = Math.floor(now.getMonth() / 3)
      start = new Date(now.getFullYear(), quarter * 3, 1)
      end = now
      break
    case 'this_year':
      start = new Date(now.getFullYear(), 0, 1)
      end = now
      break
    default:
      start = now
      end = now
  }
  
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0]
  }
}

const generateReport = async () => {
  generating.value = true
  
  try {
    // Load transactions for the period
    await loadTransactions({
      startDate: reportForm.value.startDate,
      endDate: reportForm.value.endDate
    })
    
    // Filter by platform if specified
    let filteredTransactions = [...transactions.value]
    if (reportForm.value.platformFilter) {
      filteredTransactions = filteredTransactions.filter(t => 
        t.categoryName?.toLowerCase().includes(reportForm.value.platformFilter)
      )
    }
    
    // Generate report based on type
    reportPreview.value = {
      type: reportForm.value.reportType,
      period: reportForm.value.period,
      startDate: reportForm.value.startDate,
      endDate: reportForm.value.endDate,
      data: generateReportData(reportForm.value.reportType, filteredTransactions)
    }
    
    // If not preview, trigger download
    if (reportForm.value.exportFormat !== 'preview') {
      downloadReport(reportForm.value.exportFormat)
    }
    
  } catch (err) {
    alert('Failed to generate report: ' + err.message)
  } finally {
    generating.value = false
  }
}

const generateReportData = (type, data) => {
  const totalRevenue = data.reduce((sum, t) => sum + t.totalAmount, 0)
  const amountCollected = data.filter(t => t.paymentStatus === 'paid').reduce((sum, t) => sum + t.amountPaid, 0)
  const outstanding = data.reduce((sum, t) => sum + t.balance, 0)
  
  switch (type) {
    case 'revenue_summary':
      return {
        totalRevenue,
        totalTransactions: data.length,
        amountCollected,
        outstanding,
        platformBreakdown: calculatePlatformBreakdown(data),
        paymentMethods: calculatePaymentMethods(data)
      }
    
    case 'payment_collection':
      return {
        paidCount: data.filter(t => t.paymentStatus === 'paid').length,
        partialCount: data.filter(t => t.paymentStatus === 'partial').length,
        unpaidCount: data.filter(t => t.paymentStatus === 'unpaid').length,
        collectionRate: data.length > 0 
          ? Math.round((data.filter(t => t.paymentStatus === 'paid').length / data.length) * 100)
          : 0
      }
    
    case 'outstanding_invoices':
      const outstandingInvoices = data
        .filter(t => t.balance > 0)
        .map(t => ({
          ...t,
          daysOutstanding: Math.floor((new Date() - new Date(t.createdAt)) / (1000 * 60 * 60 * 24))
        }))
        .sort((a, b) => b.balance - a.balance)
      
      return {
        outstandingInvoices,
        totalOutstanding: outstanding
      }
    
    case 'platform_performance':
      return {
        platforms: calculatePlatformBreakdown(data).map(p => ({
          ...p,
          advertCount: p.count,
          avgRevenue: p.count > 0 ? p.revenue / p.count : 0,
          growth: Math.floor(Math.random() * 40) - 10 // Mock growth data
        }))
      }
    
    case 'client_activity':
      return {
        topClients: calculateTopClients(data)
      }
    
    case 'payment_methods':
      return {
        methods: calculatePaymentMethods(data)
      }
    
    default:
      return {}
  }
}

const calculatePlatformBreakdown = (data) => {
  const platforms = {}
  
  data.forEach(t => {
    const platform = t.categoryName || 'Other'
    if (!platforms[platform]) {
      platforms[platform] = { name: platform, count: 0, revenue: 0 }
    }
    platforms[platform].count++
    platforms[platform].revenue += t.totalAmount
  })
  
  const total = Object.values(platforms).reduce((sum, p) => sum + p.revenue, 0)
  
  return Object.values(platforms).map(p => ({
    ...p,
    percentage: total > 0 ? Math.round((p.revenue / total) * 100) : 0
  })).sort((a, b) => b.revenue - a.revenue)
}

const calculatePaymentMethods = (data) => {
  const methods = {}
  
  data.forEach(t => {
    const method = formatPaymentMethod(t.paymentMethod)
    if (!methods[method]) {
      methods[method] = { name: method, count: 0, amount: 0 }
    }
    methods[method].count++
    methods[method].amount += t.totalAmount
  })
  
  return Object.values(methods).sort((a, b) => b.amount - a.amount)
}

const calculateTopClients = (data) => {
  const clients = {}
  
  data.forEach(t => {
    const client = t.clientName
    if (!clients[client]) {
      clients[client] = { name: client, count: 0, revenue: 0 }
    }
    clients[client].count++
    clients[client].revenue += t.totalAmount
  })
  
  return Object.values(clients)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)
}

const formatPeriod = () => {
  if (!reportPreview.value) return ''
  
  const start = new Date(reportPreview.value.startDate).toLocaleDateString('en-UG', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
  
  const end = new Date(reportPreview.value.endDate).toLocaleDateString('en-UG', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
  
  return `${start} - ${end}`
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

const downloadReport = (format) => {
  alert(`Downloading report as ${format.toUpperCase()}...`)
  // Implementation for actual download would go here
}

const closePreview = () => {
  reportPreview.value = null
}

const resetForm = () => {
  reportForm.value = {
    reportType: '',
    period: '',
    startDate: '',
    endDate: '',
    platformFilter: '',
    exportFormat: 'preview'
  }
  reportPreview.value = null
}

const viewSavedReports = () => {
  alert('Viewing saved reports...')
}

// Lifecycle
onMounted(() => {
  // Initialize with current month
  const { start, end } = calculatePeriodDates('this_month')
  reportForm.value.startDate = start
  reportForm.value.endDate = end
})
</script>

<style scoped>
.reports-page {
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

/* Content Card */
.content-card {
  background: white;
  padding: 25px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.08);
  margin-bottom: 25px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 2px solid #f5f5f5;
}

.card-header h2 {
  color: #003366;
  margin: 0;
  font-size: 1.3em;
  font-weight: 600;
}

.preview-actions {
  display: flex;
  gap: 10px;
}

/* Form */
.report-form {
  max-width: 1000px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 25px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  margin-bottom: 6px;
  color: #333;
  font-weight: 500;
  font-size: 0.9em;
}

.form-group input,
.form-group select {
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 0.9em;
  transition: border-color 0.3s, box-shadow 0.3s;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #0066CC;
  box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  padding-top: 20px;
  border-top: 2px solid #f5f5f5;
}

/* Report Content */
.report-preview-card {
  max-width: 1200px;
  margin: 0 auto;
}

.report-content {
  padding: 20px 0;
}

.report-header-section {
  text-align: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #f5f5f5;
}

.report-header-section h3 {
  color: #003366;
  margin-bottom: 10px;
  font-size: 1.5em;
  font-weight: 600;
}

.report-period {
  color: #666;
  font-size: 0.95em;
}

/* Metrics Grid */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
  margin-bottom: 35px;
}

.metric-card {
  background: #f9f9f9;
  padding: 20px;
  border-radius: 8px;
  border-left: 4px solid #0066CC;
  text-align: center;
}

.metric-label {
  color: #666;
  font-size: 0.85em;
  margin-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.metric-value {
  color: #003366;
  font-size: 1.8em;
  font-weight: 700;
}

.metric-value.success {
  color: #28a745;
}

.metric-value.danger {
  color: #dc3545;
}

.metric-value.warning {
  color: #ffc107;
}

/* Breakdown Section */
.breakdown-section {
  margin-bottom: 35px;
}

.breakdown-section h4 {
  color: #003366;
  margin-bottom: 15px;
  font-size: 1.1em;
  font-weight: 600;
}

/* Report Table */
.report-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
  font-size: 0.9em;
}

.report-table thead {
  background: #003366;
  color: white;
}

.report-table th {
  padding: 12px;
  text-align: left;
  font-weight: 600;
  font-size: 0.85em;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.report-table tbody tr {
  border-bottom: 1px solid #f5f5f5;
}

.report-table tbody tr:hover {
  background: #f9f9f9;
}

.report-table td {
  padding: 12px;
}

.report-table tfoot {
  background: #f9f9f9;
  font-weight: 600;
}

.total-row {
  border-top: 2px solid #003366;
}

.percentage {
  display: inline-block;
  padding: 3px 8px;
  background: rgba(0, 102, 204, 0.1);
  color: #0066CC;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.85em;
}

.growth-positive {
  color: #28a745;
  font-weight: 600;
}

.growth-negative {
  color: #dc3545;
  font-weight: 600;
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

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #c82333;
}

.btn-icon {
  font-size: 1em;
}

/* Responsive */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .form-grid {
    grid-template-columns: 1fr;
  }
  
  .metrics-grid {
    grid-template-columns: 1fr;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .preview-actions {
    flex-direction: column;
    width: 100%;
  }
  
  .report-table {
    font-size: 0.85em;
  }
  
  .report-table th,
  .report-table td {
    padding: 8px;
  }
}

@media print {
  .page-header,
  .card-header,
  .preview-actions,
  .form-actions {
    display: none;
  }
  
  .report-content {
    padding: 0;
  }
}
</style>