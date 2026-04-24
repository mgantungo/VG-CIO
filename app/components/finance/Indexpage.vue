<!--components/finance/index.vue-->
<template>
  <div class="fd-page">

    <!-- ════════════════════════════════════════════════
         HEADER PANEL
    ════════════════════════════════════════════════ -->
    <section class="hd-panel">
      <div class="hd-panel__left">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
        <div>
          <div class="hd-title">Finance Dashboard</div>
          <div class="hd-sub">Advertising revenue &amp; payment collections</div>
        </div>
      </div>
      <div class="hd-panel__right">
        <div class="hd-period">
          <label class="fp-label">Period</label>
          <select v-model="selectedPeriod" @change="handlePeriodChange" class="fp-input fp-select">
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
        </div>
        <span class="hd-daterange">{{ formatDateRange() }}</span>
        <button class="btn btn-ghost" @click="refreshData" :disabled="loading">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>
          {{ loading ? 'Loading…' : 'Refresh' }}
        </button>
        <button class="btn btn-outline" @click="navigateTo('/dashboard/finance/reports')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          Reports
        </button>
        <button class="btn btn-primary" @click="navigateTo('/dashboard/finance/payments')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="1"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
          Payments
        </button>
      </div>
    </section>

    <!-- ════════════════════════════════════════════════
         KPI ROW  (Excel-style metric band)
    ════════════════════════════════════════════════ -->
    <div class="kpi-row">
      <div class="kpi-cell kpi--blue">
        <span class="kpi-label">Total Revenue</span>
        <span class="kpi-value">{{ formatCurrency(totalRevenue) }}</span>
      </div>
      <div class="kpi-cell kpi--green">
        <span class="kpi-label">Amount Collected</span>
        <span class="kpi-value">{{ formatCurrency(collectedThisMonth) }}</span>
        <span class="kpi-rate">{{ collectionRate }}% collection rate</span>
      </div>
      <div class="kpi-cell kpi--red">
        <span class="kpi-label">Outstanding</span>
        <span class="kpi-value">{{ formatCurrency(outstanding) }}</span>
      </div>
      <div class="kpi-cell kpi--amber">
        <span class="kpi-label">Pending Payments</span>
        <span class="kpi-value kpi-value--count">{{ pendingPayments }}</span>
        <span class="kpi-rate">transactions</span>
      </div>
    </div>

    <!-- ════════════════════════════════════════════════
         ANALYTICS ROW  (Collection | Methods | Platform | Actions)
    ════════════════════════════════════════════════ -->
    <div class="xl-grid">

      <!-- Collection Performance -->
      <div class="xl-card">
        <div class="xl-card__head">Collection Performance</div>
        <div class="xl-card__body">

          <!-- Rate row -->
          <div class="rate-row">
            <span class="rate-label-txt">Collection Rate</span>
            <span class="rate-bar-wrap">
              <span class="rate-bar" :class="'rate-' + getRateClass(collectionRate)" :style="{ width: collectionRate + '%' }"></span>
            </span>
            <span class="rate-pct" :class="'rp-' + getRateClass(collectionRate)">{{ collectionRate }}%</span>
          </div>

          <!-- Breakdown table -->
          <table class="xl-tbl">
            <thead>
              <tr>
                <th>Status</th>
                <th class="num">Count</th>
                <th class="num">Share</th>
                <th class="bar-col"></th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span class="dot dot-green"></span> Paid in Full</td>
                <td class="num mono">{{ paidCount }}</td>
                <td class="num mono">{{ paidPercentage }}%</td>
                <td class="bar-col"><span class="xl-bar xl-bar--green" :style="{ width: paidPercentage + '%' }"></span></td>
              </tr>
              <tr>
                <td><span class="dot dot-amber"></span> Partial</td>
                <td class="num mono">{{ partialCount }}</td>
                <td class="num mono">{{ partialPercentage }}%</td>
                <td class="bar-col"><span class="xl-bar xl-bar--amber" :style="{ width: partialPercentage + '%' }"></span></td>
              </tr>
              <tr>
                <td><span class="dot dot-red"></span> Unpaid</td>
                <td class="num mono">{{ unpaidCount }}</td>
                <td class="num mono">{{ unpaidPercentage }}%</td>
                <td class="bar-col"><span class="xl-bar xl-bar--red" :style="{ width: unpaidPercentage + '%' }"></span></td>
              </tr>
              <tr class="xl-total">
                <td>Total</td>
                <td class="num mono">{{ paidCount + partialCount + unpaidCount }}</td>
                <td class="num mono">100%</td>
                <td class="bar-col"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Payment Methods -->
      <div class="xl-card">
        <div class="xl-card__head">Payment Methods</div>
        <div class="xl-card__body xl-card__body--flush">
          <table class="xl-tbl xl-tbl--flush">
            <thead>
              <tr>
                <th>Method</th>
                <th class="num">Txns</th>
                <th class="num">Amount</th>
                <th class="bar-col"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="m in paymentMethodsBreakdown" :key="m.name">
                <td>{{ m.name }}</td>
                <td class="num mono">{{ m.count }}</td>
                <td class="num mono">{{ formatCurrency(m.amount) }}</td>
                <td class="bar-col">
                  <span class="xl-bar xl-bar--blue" :style="{ width: getMethodShare(m) + '%' }"></span>
                </td>
              </tr>
              <tr v-if="paymentMethodsBreakdown.length === 0" class="xl-empty">
                <td colspan="4">No data</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Revenue by Platform -->
      <div class="xl-card">
        <div class="xl-card__head">Revenue by Platform</div>
        <div class="xl-card__body xl-card__body--flush">
          <table class="xl-tbl xl-tbl--flush">
            <thead>
              <tr>
                <th>Platform</th>
                <th class="num">Adverts</th>
                <th class="num">Revenue</th>
                <th class="bar-col"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in platformBreakdown" :key="p.name">
                <td>{{ p.name }}</td>
                <td class="num mono">{{ p.count }}</td>
                <td class="num mono">{{ formatCurrency(p.revenue) }}</td>
                <td class="bar-col">
                  <span class="xl-bar" :style="{ width: p.percentage + '%', background: getPlatformColor(p.name) }"></span>
                </td>
              </tr>
              <tr v-if="platformBreakdown.length === 0" class="xl-empty">
                <td colspan="4">No data</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="xl-card">
        <div class="xl-card__head">Quick Actions</div>
        <div class="xl-card__body">
          <div class="qa-grid">
            <button class="qa-btn" @click="navigateTo('/dashboard/finance/payments?tab=unpaid')">
              <div class="qa-icon qa-icon--red">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
              <div class="qa-text">
                <span class="qa-title">View Unpaid</span>
                <span class="qa-sub">{{ unpaidCount }} transactions</span>
              </div>
              <svg class="qa-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
            <button class="qa-btn" @click="navigateTo('/dashboard/finance/payments?tab=overdue')">
              <div class="qa-icon qa-icon--amber">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
              </div>
              <div class="qa-text">
                <span class="qa-title">Overdue Items</span>
                <span class="qa-sub">{{ overdueCount }} items</span>
              </div>
              <svg class="qa-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
            <button class="qa-btn" @click="navigateTo('/dashboard/finance/reports')">
              <div class="qa-icon qa-icon--blue">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              </div>
              <div class="qa-text">
                <span class="qa-title">Generate Report</span>
                <span class="qa-sub">Multiple formats</span>
              </div>
              <svg class="qa-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
            <button class="qa-btn" @click="exportData">
              <div class="qa-icon qa-icon--green">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              </div>
              <div class="qa-text">
                <span class="qa-title">Export Data</span>
                <span class="qa-sub">CSV / Excel</span>
              </div>
              <svg class="qa-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        </div>
      </div>

    </div>

    <!-- ════════════════════════════════════════════════
         RECENT TRANSACTIONS
    ════════════════════════════════════════════════ -->
    <div class="xl-card xl-card--full">
      <div class="xl-card__head xl-card__head--row">
        <span>Recent Transactions</span>
        <button class="btn btn-outline btn-sm" @click="navigateTo('/dashboard/finance/payments')">
          View All
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>

      <div v-if="loading" class="state-loading">
        <div class="spinner"></div><p>Loading…</p>
      </div>

      <div v-else-if="error" class="state-error">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <p>{{ error }}</p>
        <button class="btn btn-primary btn-sm" @click="loadData">Retry</button>
      </div>

      <div v-else-if="recentTransactions.length === 0" class="state-empty">
        <svg viewBox="0 0 64 64" fill="none"><rect x="8" y="8" width="48" height="48" rx="1" stroke="#CBD5E1" stroke-width="3"/><line x1="20" y1="26" x2="44" y2="26" stroke="#CBD5E1" stroke-width="3" stroke-linecap="round"/><line x1="20" y1="34" x2="36" y2="34" stroke="#CBD5E1" stroke-width="3" stroke-linecap="round"/></svg>
        <p>No transactions yet</p>
      </div>

      <div v-else class="tbl-wrap">
        <table class="xl-tbl xl-tbl--flush xl-tbl--full">
          <thead>
            <tr>
              <th>Reference</th>
              <th>Client</th>
              <th>Product</th>
              <th class="num">Amount</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="t in recentTransactions" :key="t.id">
              <td>
                <code class="ref-chip">{{ t.advertReference }}</code>
                <span class="c2">{{ t.invoiceNumber }}</span>
              </td>
              <td><span class="c1">{{ t.clientName }}</span></td>
              <td><span class="c1">{{ t.productName }}</span></td>
              <td class="num"><span class="mono fw7">{{ formatCurrency(t.totalAmount) }}</span></td>
              <td>
                <span :class="'sbadge sbadge--' + t.paymentStatus">{{ formatPaymentStatus(t.paymentStatus) }}</span>
              </td>
              <td><span class="c2">{{ formatDate(t.createdAt) }}</span></td>
            </tr>
          </tbody>
        </table>
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

const getMethodShare = (method) => {
  const max = Math.max(...paymentMethodsBreakdown.value.map(m => m.amount), 1)
  return Math.round((method.amount / max) * 100)
}

// Lifecycle
onMounted(() => {
  handlePeriodChange()
})
</script>
<style scoped>
/* ══════════════════════════════════════════════════════════════════════════════
   TOKENS
══════════════════════════════════════════════════════════════════════════════ */
.fd-page {
  --navy:       #003366;
  --red:        #E31E24;
  --blue:       #0066CC;
  --blue-lt:    #EEF4FF;

  --surface:    #FFFFFF;
  --page-bg:    #F0F4F8;
  --border:     #C8D0DA;
  --border-lt:  #E2E8ED;

  --text-1:     #0F172A;
  --text-2:     #334155;
  --text-3:     #64748B;
  --text-4:     #94A3B8;

  /* Excel-specific surface tints */
  --xl-head-bg: #1F3864;   /* deep navy for table heads */
  --xl-row-alt: #F7F9FB;   /* alternating row */
  --xl-total:   #EEF4FF;   /* totals row */
  --xl-grid:    #D0D7DF;   /* grid line colour */

  --green-text: #166534; --green-bg: #F0FDF4; --green-bd: #86EFAC;
  --red-text:   #991B1B; --red-bg:   #FEF2F2; --red-bd:   #FECACA;
  --amber-text: #78350F; --amber-bg: #FFFBEB; --amber-bd: #FCD34D;

  --ring:       0 0 0 3px rgba(0,102,204,.15);
  --shadow:     0 1px 3px rgba(0,0,0,.08), 0 1px 2px rgba(0,0,0,.05);

  --t:    120ms ease;
  --font: "IBM Plex Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --mono: "IBM Plex Mono", "Courier New", monospace;
}

@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap');

.fd-page {
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
   HEADER PANEL
══════════════════════════════════════════════════════════════════════════════ */
.hd-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding: 0 20px;
  background: var(--navy);
  margin: 16px 16px 0;
  border: 1px solid rgba(255,255,255,.08);
  min-height: 60px;
}

.hd-panel__left {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #fff;
}
.hd-panel__left svg { width: 20px; height: 20px; stroke: rgba(255,255,255,.7); flex-shrink: 0; }

.hd-title { font-size: 15px; font-weight: 700; color: #fff; }
.hd-sub   { font-size: 11px; color: rgba(255,255,255,.55); margin-top: 1px; }

.hd-panel__right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.hd-period {
  display: flex;
  align-items: center;
  gap: 7px;
}

.fp-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .06em;
  color: rgba(255,255,255,.6);
  white-space: nowrap;
}

.fp-input {
  height: 32px;
  padding: 0 10px;
  border: 1px solid rgba(255,255,255,.25);
  background: rgba(255,255,255,.1);
  color: #fff;
  font-family: var(--font);
  font-size: 12px;
  outline: none;
  cursor: pointer;
  border-radius: 1px;
}
.fp-input option { background: var(--navy); color: #fff; }
.fp-input:focus { border-color: rgba(255,255,255,.5); }

.hd-daterange {
  font-size: 12px;
  color: rgba(255,255,255,.6);
  font-family: var(--mono);
  white-space: nowrap;
}

/* ── Buttons ── */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 14px;
  border: none;
  border-radius: 1px;
  font-family: var(--font);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: background var(--t), opacity var(--t), transform var(--t);
  outline: none;
}
.btn svg { width: 13px; height: 13px; flex-shrink: 0; }
.btn:disabled { opacity: .4; cursor: not-allowed; }
.btn:active:not(:disabled) { transform: scale(.97); }
.btn-sm { height: 28px; padding: 0 12px; font-size: 11px; }

.btn-ghost   { background: rgba(255,255,255,.1);  color: #fff; border: 1px solid rgba(255,255,255,.2); }
.btn-ghost:hover:not(:disabled) { background: rgba(255,255,255,.2); }

.btn-outline { background: transparent; color: #fff; border: 1px solid rgba(255,255,255,.35); }
.btn-outline:hover:not(:disabled) { background: rgba(255,255,255,.1); }

.btn-primary { background: var(--red); color: #fff; }
.btn-primary:hover:not(:disabled) { background: #C0181E; }

@media (max-width: 768px) {
  .hd-panel { padding: 12px 14px; margin: 8px 8px 0; }
  .hd-panel__right { flex-wrap: wrap; gap: 6px; }
  .hd-daterange { display: none; }
}

/* ══════════════════════════════════════════════════════════════════════════════
   KPI ROW  — Excel-style metric band with top border accents
══════════════════════════════════════════════════════════════════════════════ */
.kpi-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  margin: 0 16px;
  border: 1px solid var(--border);
  border-top: none;
  background: var(--surface);
}

@media (max-width: 900px)  { .kpi-row { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 520px)  { .kpi-row { grid-template-columns: 1fr; margin: 0 8px; } }

.kpi-cell {
  display: flex;
  flex-direction: column;
  padding: 16px 20px 14px;
  border-right: 1px solid var(--border-lt);
  border-top: 3px solid transparent;
  gap: 2px;
}
.kpi-cell:last-child { border-right: none; }

.kpi--blue  { border-top-color: var(--blue);  }
.kpi--green { border-top-color: #16A34A; }
.kpi--red   { border-top-color: var(--red);   }
.kpi--amber { border-top-color: #D97706; }

.kpi-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .07em;
  color: var(--text-4);
}

.kpi-value {
  font-family: var(--mono);
  font-size: 20px;
  font-weight: 600;
  color: var(--text-1);
  line-height: 1.1;
  margin-top: 4px;
  white-space: nowrap;
}
.kpi-value--count { font-size: 28px; }

.kpi-rate {
  font-size: 11px;
  color: var(--text-3);
  margin-top: 2px;
}

/* ══════════════════════════════════════════════════════════════════════════════
   ANALYTICS GRID
══════════════════════════════════════════════════════════════════════════════ */
.xl-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0;
  margin: 16px 16px 0;
  border: 1px solid var(--border);
  background: var(--border);  /* border gap shows as grid line */
}

@media (max-width: 900px) { .xl-grid { grid-template-columns: 1fr; } }
@media (max-width: 640px) { .xl-grid { margin: 8px 8px 0; } }

/* ── Card ── */
.xl-card {
  background: var(--surface);
}

.xl-card--full {
  margin: 16px 16px 0;
  border: 1px solid var(--border);
  background: var(--surface);
}
@media (max-width: 640px) { .xl-card--full { margin: 8px 8px 0; } }

.xl-card__head {
  padding: 0 16px;
  height: 36px;
  display: flex;
  align-items: center;
  background: var(--xl-head-bg);
  color: rgba(255,255,255,.85);
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .07em;
  border-bottom: 1px solid rgba(255,255,255,.08);
}

.xl-card__head--row {
  justify-content: space-between;
}

.xl-card__body {
  padding: 16px;
}
.xl-card__body--flush { padding: 0; }

/* ══════════════════════════════════════════════════════════════════════════════
   EXCEL TABLE  (xl-tbl)
══════════════════════════════════════════════════════════════════════════════ */
.xl-tbl {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}
.xl-tbl--flush { border: none; }
.xl-tbl--full { min-width: 600px; }

/* TH — styled like Excel frozen header row */
.xl-tbl thead tr {
  background: #DEEAF1;   /* Excel table header blue */
}

.xl-tbl th {
  padding: 7px 12px;
  text-align: left;
  font-size: 11px;
  font-weight: 700;
  color: #1F3864;        /* Excel dark navy text */
  border-right: 1px solid #BDD7EE;
  border-bottom: 2px solid #9DC3E6;
  white-space: nowrap;
  letter-spacing: .04em;
  text-transform: uppercase;
}
.xl-tbl th:last-child { border-right: none; }
.xl-tbl th.num { text-align: right; }
.xl-tbl th.bar-col { width: 80px; border-right: none; }

/* TD */
.xl-tbl tbody tr {
  border-bottom: 1px solid var(--xl-grid);
}
.xl-tbl tbody tr:nth-child(even) { background: var(--xl-row-alt); }
.xl-tbl tbody tr:hover { background: var(--blue-lt); }
.xl-tbl tbody tr:last-child { border-bottom: none; }

.xl-tbl td {
  padding: 7px 12px;
  border-right: 1px solid var(--border-lt);
  vertical-align: middle;
  color: var(--text-2);
}
.xl-tbl td:last-child { border-right: none; }
.xl-tbl td.num  { text-align: right; }
.xl-tbl td.bar-col { padding: 4px 8px; }

/* Totals row */
.xl-total {
  background: var(--xl-total) !important;
  border-top: 2px solid #9DC3E6 !important;
}
.xl-total td {
  font-weight: 700;
  color: var(--text-1) !important;
}

/* Empty row */
.xl-empty td {
  text-align: center;
  color: var(--text-4);
  padding: 20px;
  font-style: italic;
}

/* ══════════════════════════════════════════════════════════════════════════════
   DATA BARS  (Excel conditional-formatting style)
══════════════════════════════════════════════════════════════════════════════ */
/* Collection rate bar */
.rate-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  padding: 10px 12px;
  background: var(--xl-row-alt);
  border: 1px solid var(--border-lt);
}

.rate-label-txt {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .05em;
  color: var(--text-3);
  white-space: nowrap;
  flex-shrink: 0;
}

.rate-bar-wrap {
  flex: 1;
  height: 16px;
  background: var(--page-bg);
  border: 1px solid var(--border);
  position: relative;
  overflow: hidden;
}

.rate-bar {
  display: block;
  height: 100%;
  transition: width .4s ease;
}
.rate-excellent { background: #70AD47; }  /* Excel green */
.rate-good      { background: #5B9BD5; }  /* Excel blue  */
.rate-average   { background: #FFC000; }  /* Excel amber */
.rate-poor      { background: #FF0000; }  /* Excel red   */

.rate-pct {
  font-family: var(--mono);
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
  min-width: 44px;
  text-align: right;
}
.rp-excellent { color: #375623; }
.rp-good      { color: var(--blue); }
.rp-average   { color: #7F6000; }
.rp-poor      { color: var(--red-text); }

/* Inline data bars */
.xl-bar {
  display: block;
  height: 12px;
  transition: width .3s ease;
  max-width: 100%;
}
.xl-bar--green { background: #70AD47; }
.xl-bar--amber { background: #FFC000; }
.xl-bar--red   { background: #FF0000; }
.xl-bar--blue  { background: #5B9BD5; }

/* ── Dot indicators ── */
.dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 6px;
  vertical-align: middle;
  flex-shrink: 0;
}
.dot-green { background: #70AD47; }
.dot-amber { background: #FFC000; }
.dot-red   { background: #FF0000; }

/* ══════════════════════════════════════════════════════════════════════════════
   QUICK ACTIONS
══════════════════════════════════════════════════════════════════════════════ */
.qa-grid {
  display: flex;
  flex-direction: column;
  gap: 0;
  border: 1px solid var(--border);
}

.qa-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 14px;
  border: none;
  border-bottom: 1px solid var(--border-lt);
  background: var(--surface);
  cursor: pointer;
  text-align: left;
  transition: background var(--t);
  font-family: var(--font);
  width: 100%;
}
.qa-btn:last-child { border-bottom: none; }
.qa-btn:hover { background: var(--blue-lt); }

.qa-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border: 1px solid;
}
.qa-icon svg { width: 15px; height: 15px; }

.qa-icon--red   { background: var(--red-bg);   color: var(--red-text);   border-color: var(--red-bd); }
.qa-icon--amber { background: var(--amber-bg);  color: var(--amber-text); border-color: var(--amber-bd); }
.qa-icon--blue  { background: var(--blue-lt);   color: var(--blue);       border-color: rgba(0,102,204,.25); }
.qa-icon--green { background: var(--green-bg);  color: var(--green-text); border-color: var(--green-bd); }

.qa-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
  flex: 1;
  min-width: 0;
}
.qa-title { font-size: 12px; font-weight: 600; color: var(--text-1); }
.qa-sub   { font-size: 11px; color: var(--text-4); }

.qa-arrow { width: 14px; height: 14px; stroke: var(--text-4); flex-shrink: 0; }

/* ══════════════════════════════════════════════════════════════════════════════
   CELL ATOMS
══════════════════════════════════════════════════════════════════════════════ */
.ref-chip {
  display: inline-block;
  font-family: var(--mono);
  font-size: 11px;
  font-weight: 600;
  color: var(--blue);
  background: var(--blue-lt);
  border: 1px solid rgba(0,102,204,.15);
  padding: 2px 7px;
  border-radius: 1px;
  letter-spacing: .04em;
  white-space: nowrap;
}

.c1   { display: block; font-size: 12px; font-weight: 500; color: var(--text-1); }
.c2   { display: block; font-size: 11px; color: var(--text-4); margin-top: 1px; }
.mono { font-family: var(--mono); }
.fw7  { font-weight: 600; }

/* ── Status badges ── */
.sbadge {
  display: inline-flex;
  align-items: center;
  height: 20px;
  padding: 0 9px;
  border-radius: 1px;
  font-size: 10px;
  font-weight: 700;
  white-space: nowrap;
  letter-spacing: .04em;
  text-transform: uppercase;
}

.sbadge--paid    { background: #E2EFDA; color: #375623; border: 1px solid #A9D18E; }   /* Excel green */
.sbadge--unpaid  { background: #FCE4D6; color: #833C00; border: 1px solid #F4B183; }   /* Excel orange */
.sbadge--partial { background: #FFEB9C; color: #7F6000; border: 1px solid #FFCC00; }   /* Excel yellow */
.sbadge--overdue { background: var(--red-bg); color: var(--red-text); border: 1px solid var(--red-bd); }

/* ══════════════════════════════════════════════════════════════════════════════
   RECENT TRANSACTIONS TABLE WRAPPER
══════════════════════════════════════════════════════════════════════════════ */
.tbl-wrap {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  scrollbar-color: var(--border) transparent;
}
.tbl-wrap::-webkit-scrollbar        { height: 5px; }
.tbl-wrap::-webkit-scrollbar-track  { background: transparent; }
.tbl-wrap::-webkit-scrollbar-thumb  { background: var(--border); }

/* ── States ── */
.state-loading, .state-error, .state-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 48px 24px;
  text-align: center;
  color: var(--text-3);
}
.state-error svg, .state-empty svg { width: 48px; height: 48px; opacity: .35; }
.state-error p, .state-empty p { font-size: 13px; margin: 0; }

.spinner {
  width: 32px; height: 32px;
  border: 3px solid var(--border-lt);
  border-top-color: var(--blue);
  border-radius: 50%;
  animation: spin .7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>