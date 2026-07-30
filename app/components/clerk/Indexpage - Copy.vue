<!--components/clerk/Indexpage.vue-->
<template>
  <div class="rp-page">

    <!-- ── Error banner ── -->
    <div v-if="error" class="rp-error">
      <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>
      <span><strong>Error:</strong> {{ error }}</span>
    </div>

    <!-- ════════════════════════════════════════════════════
         FILTER PANEL
    ═════════════════════════════════════════════════════ -->
    <section class="filter-panel">
      <div class="filter-panel__head">
        <div class="filter-panel__title">
          <svg class="fp-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <span>Adverts Report</span>
        </div>
        <button class="btn btn-new" @click="createNewAdvert">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Advert
        </button>
      </div>

      <div class="filter-panel__body">
        <!-- Date inputs -->
        <div class="fp-row fp-row--dates">
          <div class="fp-field">
            <label class="fp-label" for="startDate">From</label>
            <input type="date" id="startDate" v-model="startDate" class="fp-input" :max="endDate">
          </div>
          <div class="fp-field">
            <label class="fp-label" for="endDate">To</label>
            <input type="date" id="endDate" v-model="endDate" class="fp-input" :min="startDate" :max="maxDate">
          </div>
          <!-- Quick ranges -->
          <div class="fp-quick">
            <button v-for="r in quickRanges" :key="r.key"
              class="qr-btn"
              :class="{ active: activeQuickRange === r.key }"
              @click="setDateRange(r.key)">{{ r.label }}</button>
          </div>
        </div>

        <!-- Additional filters -->
        <div class="fp-row fp-row--filters">
          <div class="fp-field">
            <label class="fp-label" for="userFilter">User</label>
            <select id="userFilter" v-model="selectedUserId" class="fp-input fp-select" @change="loadAdverts">
              <option value="">All users</option>
              <option v-for="user in availableUsers" :key="user.id" :value="user.id">
                {{ user.name }} ({{ user.role }})
              </option>
            </select>
          </div>
          <div class="fp-field">
            <label class="fp-label" for="statusFilter">Status</label>
            <select id="statusFilter" v-model="selectedStatus" class="fp-input fp-select" @change="loadAdverts">
              <option value="">All statuses</option>
              <option value="draft">Draft</option>
              <option value="pending_review">Pending Review</option>
              <option value="editor_approved">Editor Approved</option>
              <option value="manager_approved">Manager Approved</option>
              <option value="editor_rejected">Editor Rejected</option>
              <option value="manager_rejected">Manager Rejected</option>
            </select>
          </div>
          <div class="fp-field fp-field--search">
            <label class="fp-label" for="searchQuery">Search</label>
            <div class="fp-search-wrap">
              <svg class="fp-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input type="text" id="searchQuery" v-model="searchQuery" class="fp-input fp-input--search"
                     placeholder="Reference, client, title…" @keyup.enter="applySearch">
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="fp-actions">
          <button class="btn btn-apply" @click="loadAdverts" :disabled="loading || isDateRangeInvalid">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <span>{{ loading ? 'Loading…' : 'Apply' }}</span>
          </button>
          <button class="btn btn-reset" @click="resetFilters">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>
            Reset
          </button>
          <button class="btn btn-export" @click="exportData" :disabled="adverts.length === 0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export CSV
          </button>
          <p v-if="isDateRangeInvalid" class="fp-error">⚠ End date must be after start date</p>
        </div>
      </div>
    </section>

    <!-- ════════════════════════════════════════════════════
         RESULTS AREA
    ═════════════════════════════════════════════════════ -->
    <section class="results-section">

      <!-- Summary strip -->
      <div class="summary-strip">
        <div class="ss-left">
          <span class="ss-count">{{ filteredAdverts.length }}</span>
          <span class="ss-label">advert{{ filteredAdverts.length !== 1 ? 's' : '' }}</span>
        </div>
        <div class="ss-stats">
          <div class="ss-stat">
            <span class="ss-stat__label">Total Value</span>
            <span class="ss-stat__value">{{ formatCurrency(statistics.totalAmount) }}</span>
          </div>
          <div class="ss-divider"></div>
          <div class="ss-stat">
            <span class="ss-stat__label">Average</span>
            <span class="ss-stat__value">{{ formatCurrency(statistics.averageAmount) }}</span>
          </div>
          <div class="ss-divider"></div>
          <div class="ss-stat">
            <span class="ss-stat__label">Discounts</span>
            <span class="ss-stat__value ss-stat__value--red">{{ formatCurrency(statistics.totalDiscount) }}</span>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="state-loading">
        <div class="spinner"></div>
        <p>Loading adverts…</p>
      </div>

      <!-- Empty -->
      <div v-if="!loading && filteredAdverts.length === 0" class="state-empty">
        <svg viewBox="0 0 64 64" fill="none"><rect x="8" y="8" width="48" height="48" rx="6" stroke="#CBD5E1" stroke-width="3"/><line x1="20" y1="26" x2="44" y2="26" stroke="#CBD5E1" stroke-width="3" stroke-linecap="round"/><line x1="20" y1="34" x2="36" y2="34" stroke="#CBD5E1" stroke-width="3" stroke-linecap="round"/></svg>
        <h3>No adverts found</h3>
        <p>{{ searchQuery || selectedUserId || selectedStatus ? 'Try adjusting your filters or date range.' : 'No adverts were created in this date range.' }}</p>
        <div class="state-empty__actions">
          <button class="btn btn-new" @click="createNewAdvert">Create New Advert</button>
          <button v-if="searchQuery || selectedUserId || selectedStatus" class="btn btn-reset" @click="resetFilters">Clear Filters</button>
        </div>
      </div>

      <!-- ── TABLE ── -->
      <template v-if="!loading && filteredAdverts.length > 0">
        <div class="tbl-wrap">
          <table class="adv-tbl">
            <thead>
              <tr>
                <th class="tc-ref">Ref #</th>
                <th class="tc-client">Client</th>
                <th class="tc-title">Advert Title</th>
                <th class="tc-by">Captured By</th>
                <th class="tc-product">Product / Size</th>
                <th class="tc-office">Office / Ref</th>
                <th class="tc-amount">Amount</th>
                <th class="tc-status">Status</th>
                <th class="tc-date">Date</th>
                <th class="tc-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="advert in filteredAdverts" :key="advert.id" class="adv-row">

                <td class="tc-ref">
                  <p><code class="ref-chip">{{ advert.reference}}</code></p></br>
                  <p><code class="ref-chip">{{ advert.bcReference}}</code></p>
                </td>

                <td class="tc-client">
                  <span class="c1">{{ advert.clientName || '—' }}</span>
                  <span v-if="advert.client?.contactPerson" class="c2">{{ advert.client.contactPerson }}</span>
                </td>

                <td class="tc-title">
                  <span class="c1">{{ advert.advertTitle || '—' }}</span>
                </td>

                <td class="tc-by">
                  <span class="c1">{{ advert.createdBy?.name || 'Unknown' }}</span>
                  <span class="c2 c-cap">{{ advert.createdBy?.role || '' }}</span>
                </td>

                <td class="tc-product">
                  <span class="c1">{{ advert.product?.name || 'N/A' }}</span>
                  <span v-if="advert.adSize" class="chip chip-size">{{ advert.adSize }}</span>
                  <span v-if="advert.revenueStream" class="chip chip-rev">{{ advert.revenueStream }}</span>
                  <span v-if="advert.costStream" class="chip chip-cost">{{ advert.costStream }}</span>
                </td>

                <td class="tc-office">
                  <span v-if="advert.officeLocation" class="c1">{{ advert.officeLocation }}</span>
                  <span v-if="advert.clientRefNo" class="c2">{{ advert.clientRefNo }}</span>
                  <span v-if="!advert.officeLocation && !advert.clientRefNo" class="c-empty">—</span>
                </td>

                <td class="tc-amount">
                  <span class="amount-val">{{ formatCurrency(advert.totalAmount) }}</span>
                  <span v-if="advert.discount > 0" class="chip chip-disc">-{{ advert.discount }}%</span>
                </td>

                <td class="tc-status">
                  <span :class="'sbadge sbadge--' + getStatusClass(advert.status)">
                    {{ getStatusLabel(advert.status) }}
                  </span>
                </td>

                <td class="tc-date">
                  <span class="c1">{{ formatDate(advert.createdAt) }}</span>
                  <span class="c2">{{ formatTime(advert.createdAt) }}</span>
                </td>

                <td class="tc-actions">
                  <div class="act-group">
                    <div class="act-wrap">
                      <button class="act-btn act-view" @click="viewAdvert(advert)" aria-label="View advert">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                      </button>
                      <span class="act-tip">View</span>
                    </div>
                    <div v-if="advert.status === 'draft'" class="act-wrap">
                      <button class="act-btn act-edit" @click="editAdvert(advert)" aria-label="Edit advert">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                      </button>
                      <span class="act-tip">Edit draft</span>
                    </div>
                    <div v-if="advert.attachments?.length > 0" class="act-wrap">
                      <button class="act-btn act-file" @click="downloadAttachments(advert)" aria-label="Open attachments">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/></svg>
                        <em class="act-badge">{{ advert.attachments.length }}</em>
                      </button>
                      <span class="act-tip">{{ advert.attachments.length }} file{{ advert.attachments.length > 1 ? 's' : '' }}</span>
                    </div>
                  </div>
                </td>

              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </section>

    <!-- FAB -->
    <button class="fab" @click="createNewAdvert" title="Create New Advert">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      <span class="fab-label">New Advert</span>
    </button>

  </div>
</template>
<script setup>
import { useAdverts } from '~/composables/useAdverts'
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRuntimeConfig } from '#imports';
import StatsCard from './StatsCard.vue';

const router = useRouter()
const config = useRuntimeConfig()
const { 
  loading, 
  error,
  getDateRangeAdverts: getDateRangeAdvertsApi
} = useAdverts()

const API_BASE = config.public.apiBase
const UPLOAD_BASE = config.public.uploadBase

// Reactive data
const adverts = ref([])
const expandedIds = ref(new Set())

const toggleExpand = (id) => {
  const s = new Set(expandedIds.value)
  s.has(id) ? s.delete(id) : s.add(id)
  expandedIds.value = s
}
const isExpanded = (id) => expandedIds.value.has(id)
const startDate = ref('')
const endDate = ref('')
const selectedUserId = ref('')
const selectedStatus = ref('')
const searchQuery = ref('')
const activeQuickRange = ref('today')
const quickRanges = [
  { key: 'today',     label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'thisWeek',  label: 'This Week' },
  { key: 'thisMonth', label: 'This Month' },
  { key: 'lastMonth', label: 'Last Month' },
]
const availableUsers = ref([])
const statistics = ref({
  totalAdverts: 0,
  totalAmount: 0,
  totalDiscount: 0,
  averageAmount: 0,
  uniqueUsers: 0
})

// Computed properties
const dateRangeDisplay = computed(() => {
  if (!startDate.value || !endDate.value) return 'Select date range'
  
  const start = new Date(startDate.value).toLocaleDateString('en-UG', {
    month: 'short',
    day: 'numeric'
  })
  
  const end = new Date(endDate.value).toLocaleDateString('en-UG', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
  
  return start === end ? start : `${start} - ${end}`
})

//HeaderStatus
const statItems = computed(() => [
      {
        icon: '📅',
        label: 'Date Range',
        value: dateRangeDisplay.value,
        type: 'primary'
      },
      {
        icon: '📋',
        label: 'Total Adverts',
        value: statistics.value.totalAdverts,
        type: 'success'
      },
      {
        icon: '💰',
        label: 'Total Value',
        value: statistics.value.totalAmount,
        type: 'warning',
        formatCurrency: true
      },
      {
        icon: '👥',
        label: 'Active Users',
        value: statistics.value.uniqueUsers,
        type: 'info'
      }
    ]);

const maxDate = computed(() => {
  const today = new Date()
  return today.toISOString().split('T')[0]
})

const isDateRangeInvalid = computed(() => {
  if (!startDate.value || !endDate.value) return false
  return new Date(startDate.value) > new Date(endDate.value)
})

const filteredAdverts = computed(() => {
  let filtered = [...adverts.value]
  
  // Apply client-side search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(advert => 
      advert.clientName?.toLowerCase().includes(query) ||
      advert.advertTitle?.toLowerCase().includes(query) ||
      advert.reference?.toLowerCase().includes(query) ||
      advert.createdBy?.name?.toLowerCase().includes(query) ||
      advert.product?.name?.toLowerCase().includes(query)
    )
  }
  
  return filtered
})

// Initialize with today's date
const initializeDates = () => {
  const today = new Date()
  startDate.value = today.toISOString().split('T')[0]
  endDate.value = today.toISOString().split('T')[0]
}

// Load adverts
const loadAdverts = async () => {
  if (isDateRangeInvalid.value) {
    alert('Please select a valid date range')
    return
  }
  
  try {
    const params = {
      startDate: startDate.value,
      endDate: endDate.value
    }
    
    if (selectedUserId.value) {
      params.userId = selectedUserId.value
    }
    
    if (selectedStatus.value) {
      params.status = selectedStatus.value
    }
    
    console.log('📤 Loading adverts with params:', params)
    
    const response = await getDateRangeAdvertsApi(params)
    
    console.log('📥 Adverts loaded:', response.data.length)
    
    // API already returns camelCase — only thing left for the frontend is
    // resolving relative attachment URLs against UPLOAD_BASE.
    adverts.value = (response.data || []).map(a => ({
      ...a,
      attachments: (a.attachments || []).map(f => ({
        ...f,
        fullUrl:      f.url          ? (f.url.startsWith('http')          ? f.url          : `${UPLOAD_BASE}${f.url}`)          : null,
        thumbnailUrl: f.thumbnailUrl ? (f.thumbnailUrl.startsWith('http') ? f.thumbnailUrl : `${UPLOAD_BASE}${f.thumbnailUrl}`) : null,
      }))
    }))

    statistics.value = {
      totalAdverts: response.count || 0,
      totalAmount: response.statistics?.totalAmount || 0,
      totalDiscount: response.statistics?.totalDiscount || 0,
      averageAmount: response.statistics?.averageAmount || 0,
      uniqueUsers: response.statistics?.uniqueUsers || 0
    }
    
    // Update available users from response
    if (response.users && response.users.length > 0) {
      availableUsers.value = response.users
    } else {
      // Extract unique users from adverts
      const userMap = new Map()
      adverts.value.forEach(advert => {
        if (advert.createdBy?.id) {
          if (!userMap.has(advert.createdBy.id)) {
            userMap.set(advert.createdBy.id, advert.createdBy)
          }
        }
      })
      availableUsers.value = Array.from(userMap.values())
    }
    
  } catch (err) {
    console.error('Failed to load adverts:', err)
    error.value = err.message
  }
}

// Quick date range buttons
const setDateRange = (range) => {
  const today = new Date()
  const result = new Date()
  
  activeQuickRange.value = range
  
  switch (range) {
    case 'today':
      startDate.value = today.toISOString().split('T')[0]
      endDate.value = today.toISOString().split('T')[0]
      break
    
    case 'yesterday':
      result.setDate(today.getDate() - 1)
      startDate.value = result.toISOString().split('T')[0]
      endDate.value = result.toISOString().split('T')[0]
      break
    
    case 'thisWeek':
      // Start of week (Monday)
      const startOfWeek = new Date(today)
      const day = startOfWeek.getDay()
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1)
      startOfWeek.setDate(diff)
      startDate.value = startOfWeek.toISOString().split('T')[0]
      endDate.value = today.toISOString().split('T')[0]
      break
    
    case 'thisMonth':
      // Start of month
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      startDate.value = startOfMonth.toISOString().split('T')[0]
      endDate.value = today.toISOString().split('T')[0]
      break
    
    case 'lastMonth':
      // Last month
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0)
      startDate.value = lastMonth.toISOString().split('T')[0]
      endDate.value = endOfLastMonth.toISOString().split('T')[0]
      break
  }
  
  // Load adverts for the new date range
  loadAdverts()
}

// Apply search
const applySearch = () => {
  // Client-side search is already handled by computed property
  console.log('Search applied:', searchQuery.value)
}

// Reset all filters
const resetFilters = () => {
  initializeDates()
  selectedUserId.value = ''
  selectedStatus.value = ''
  searchQuery.value = ''
  activeQuickRange.value = 'today'
  loadAdverts()
}

// Export data
const exportData = async () => {
  try {
    // Prepare CSV data
    const headers = [
      'Ref #',
      'Captured By',
      'Client',
      'Advert Title',
      'Product',
      'Ad Size',
      'Office Location',
      'Client Ref No',
      'Revenue Stream',
      'Cost Stream',
      'Base Price',
      'Surcharge',
      'Discount',
      'Total Amount',
      'Status',
      'Created At',
      'Start Date',
      'End Date',
      'Payment Method',
      'User Email',
      'User Role'
    ]

    const csvData = adverts.value.map(advert => [
      advert.reference,
      advert.createdBy?.name    || 'Unknown',
      advert.clientName         || '',
      advert.advertTitle        || '',
      advert.product?.name      || '',
      advert.adSize             || '',
      advert.officeLocation     || '',
      advert.clientRefNo        || '',
      advert.revenueStream      || '',
      advert.costStream         || '',
      advert.basePrice          || 0,
      advert.surcharge          || 0,
      advert.discount           || 0,
      advert.totalAmount        || 0,
      advert.status,
      new Date(advert.createdAt).toLocaleString(),
      advert.startDate ? new Date(advert.startDate).toLocaleDateString() : '',
      advert.endDate   ? new Date(advert.endDate).toLocaleDateString()   : '',
      advert.paymentMethod      || '',
      advert.createdBy?.email   || '',
      advert.createdBy?.role    || ''
    ])
    
    // Add summary row
    csvData.push([])
    csvData.push(['Summary', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''])
    csvData.push([
      `Total Adverts: ${statistics.value.totalAdverts}`,
      `Total Amount: ${formatCurrency(statistics.value.totalAmount)}`,
      `Average: ${formatCurrency(statistics.value.averageAmount)}`,
      `Total Discount: ${formatCurrency(statistics.value.totalDiscount)}`,
      `Unique Users: ${statistics.value.uniqueUsers}`,
      `Date Range: ${dateRangeDisplay.value}`
    ])
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n')
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    
    // Generate filename with date range
    const filename = `adverts-report_${startDate.value}_to_${endDate.value}.csv`
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
  } catch (err) {
    console.error('Export failed:', err)
    alert('Failed to export data')
  }
}

// Navigation functions
const createNewAdvert = () => {
  router.push('/dashboard/booking/new')
}

// FIXED: Updated viewAdvert to route to edit page in view mode
const viewAdvert = (advert) => {
  // Route to edit page with mode=view query parameter
  router.push(`/dashboard/booking/edit/${advert.id}?mode=view`)
}

// FIXED: Updated editAdvert to route to correct edit page path
const editAdvert = (advert) => {
  if (advert.status === 'draft') {
    router.push(`/dashboard/booking/edit/${advert.id}`)
  } else {
    alert('Only draft adverts can be edited. Click "View" to see the advert details.')
  }
}

const downloadAttachments = async (advert) => {
  try {
    if (advert.attachments?.length > 0) {
      advert.attachments.forEach(attachment => {
        if (attachment.fullUrl) {
          window.open(attachment.fullUrl, '_blank')
        }
      })
    } else {
      alert('No attachments available for this advert')
    }
  } catch (error) {
    console.error('Download failed:', error)
    alert('Failed to download attachments')
  }
}

// Helper functions
const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return 'UGX 0'
  
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-UG', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  } catch (error) {
    return dateString
  }
}

const formatTime = (dateString) => {
  if (!dateString) return ''
  
  try {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-UG', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  } catch (error) {
    return dateString
  }
}

const getStatusLabel = (status) => {
  const statusMap = {
    'draft': 'Draft',
    'pending_review': 'Pending Review',
    'editor_approved': 'Editor Approved',
    'manager_approved': 'Manager Approved',
    'editor_rejected': 'Editor Rejected',
    'manager_rejected': 'Manager Rejected'
  }
  
  return statusMap[status] || status
}

const getStatusClass = (status) => {
  const statusClassMap = {
    'draft': 'draft',
    'pending_review': 'pending',
    'editor_approved': 'approved',
    'manager_approved': 'approved',
    'editor_rejected': 'rejected',
    'manager_rejected': 'rejected'
  }
  
  return statusClassMap[status] || 'default'
}

// Initialize on mount
onMounted(() => {
  initializeDates()
  loadAdverts()
})
</script>
<style scoped>
/* ══════════════════════════════════════════════════════════════════════════════
   TOKENS
══════════════════════════════════════════════════════════════════════════════ */
.rp-page {
  --navy:        #003366;
  --navy-light:  #004080;
  --red:         #E31E24;
  --blue:        #0066CC;
  --blue-lt:     #EEF4FF;

  --surface:     #FFFFFF;
  --page-bg:     #F0F4F8;
  --border:      #D1D9E0;
  --border-lt:   #E8ECF0;

  --text-1:      #0F172A;   /* headings */
  --text-2:      #334155;   /* body */
  --text-3:      #64748B;   /* secondary */
  --text-4:      #94A3B8;   /* hint */

  --green-text:  #166534;
  --green-bg:    #F0FDF4;
  --green-bd:    #86EFAC;

  --cyan-text:   #155E75;
  --cyan-bg:     #ECFEFF;
  --cyan-bd:     #67E8F9;

  --red-text:    #991B1B;
  --red-bg:      #FEF2F2;
  --red-bd:      #FECACA;

  --amber-text:  #78350F;
  --amber-bg:    #FFFBEB;
  --amber-bd:    #FCD34D;

  --radius:      2px;
  --radius-lg:   2px;
  --radius-xl:   2px;

  --ring:        0 0 0 3px rgba(0, 102, 204, .15);
  --shadow-sm:   0 1px 3px rgba(0,0,0,.07), 0 1px 2px rgba(0,0,0,.05);
  --shadow-md:   0 4px 16px rgba(0,0,0,.08), 0 2px 6px rgba(0,0,0,.05);
  --shadow-lg:   0 10px 40px rgba(0,0,0,.10), 0 4px 12px rgba(0,0,0,.06);

  --t: 140ms ease;
  --font: "IBM Plex Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

/* ══════════════════════════════════════════════════════════════════════════════
   GOOGLE FONT IMPORT (IBM Plex Sans — clean & professional)
══════════════════════════════════════════════════════════════════════════════ */
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@600&display=swap');

/* ══════════════════════════════════════════════════════════════════════════════
   PAGE SHELL
══════════════════════════════════════════════════════════════════════════════ */
.rp-page {
  width: 100%;
  min-height: 100vh;
  background: var(--page-bg);
  font-family: var(--font);
  font-size: 13px;
  color: var(--text-2);
  padding-bottom: 96px;
}

/* ══════════════════════════════════════════════════════════════════════════════
   ERROR BANNER
══════════════════════════════════════════════════════════════════════════════ */
.rp-error {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 12px 16px;
  padding: 12px 16px;
  background: var(--red-bg);
  color: var(--red-text);
  border: 1px solid var(--red-bd);
  border-radius: var(--radius);
  font-size: 13px;
}
.rp-error svg { width: 18px; height: 18px; flex-shrink: 0; }

/* ══════════════════════════════════════════════════════════════════════════════
   FILTER PANEL
══════════════════════════════════════════════════════════════════════════════ */
.filter-panel {
  margin: 16px 16px 0;
  background: var(--surface);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
  overflow: hidden;
}

/* Head bar */
.filter-panel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: var(--navy);
  color: #fff;
}

.filter-panel__title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: .01em;
  color: #fff;
}

.fp-icon {
  width: 20px;
  height: 20px;
  stroke: #fff;
  flex-shrink: 0;
}

/* Body */
.filter-panel__body {
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Rows inside body */
.fp-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-end;
}

/* Field */
.fp-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 130px;
  flex: 0 0 auto;
}

.fp-field--search { flex: 1; min-width: 200px; }

.fp-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .06em;
  color: var(--text-3);
}

.fp-input {
  height: 38px;
  padding: 0 12px;
  border: 1.5px solid var(--border);
  border-radius: var(--radius);
  font-family: var(--font);
  font-size: 13px;
  color: var(--text-1);
  background: var(--surface);
  transition: border-color var(--t), box-shadow var(--t);
  outline: none;
}
.fp-input:focus {
  border-color: var(--blue);
  box-shadow: var(--ring);
}

.fp-select { cursor: pointer; }

/* Search field */
.fp-search-wrap {
  position: relative;
}
.fp-search-icon {
  position: absolute;
  left: 10px; top: 50%;
  transform: translateY(-50%);
  width: 16px; height: 16px;
  stroke: var(--text-4);
  pointer-events: none;
}
.fp-input--search { padding-left: 36px; width: 100%; }

/* Quick-range pills */
.fp-quick {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: flex-end;
  padding-bottom: 1px;
}

.qr-btn {
  height: 32px;
  padding: 0 14px;
  border: 1.5px solid var(--border);
  border-radius: 1px;
  background: #fff;
  font-family: var(--font);
  font-size: 12px;
  font-weight: 500;
  color: var(--text-3);
  cursor: pointer;
  transition: all var(--t);
  white-space: nowrap;
}
.qr-btn:hover  { border-color: var(--blue); color: var(--blue); background: var(--blue-lt); }
.qr-btn.active { border-color: var(--blue); color: #fff; background: var(--blue); }

/* Actions row */
.fp-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding-top: 4px;
  border-top: 1px solid var(--border-lt);
}

.fp-error {
  font-size: 12px;
  color: var(--red-text);
  margin: 0;
}

/* ── Responsive ── */
@media (max-width: 640px) {
  .filter-panel { margin: 8px 8px 0; border-radius: var(--radius-lg); }
  .filter-panel__head { padding: 14px 16px; }
  .filter-panel__body { padding: 14px 16px; gap: 12px; }
  .fp-row { flex-direction: column; align-items: stretch; }
  .fp-field { min-width: unset; flex: unset; }
  .fp-field--search { min-width: unset; }
  .fp-quick { justify-content: flex-start; }
  .fp-actions .btn { flex: 1; justify-content: center; min-width: 0; }
}

/* ══════════════════════════════════════════════════════════════════════════════
   BUTTONS (shared)
══════════════════════════════════════════════════════════════════════════════ */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 38px;
  padding: 0 18px;
  border: none;
  border-radius: var(--radius);
  font-family: var(--font);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: background var(--t), box-shadow var(--t), transform var(--t), opacity var(--t);
  outline: none;
}
.btn svg { width: 15px; height: 15px; flex-shrink: 0; }
.btn:disabled { opacity: .45; cursor: not-allowed; }
.btn:active:not(:disabled) { transform: scale(.97); }

.btn-new    { background: #fff; color: var(--navy); border: none; }
.btn-new:hover:not(:disabled) { background: #EEF4FF; }

.btn-apply  { background: var(--red); color: #fff; }
.btn-apply:hover:not(:disabled) { background: #C0181E; box-shadow: 0 4px 12px rgba(227,30,36,.3); }

.btn-reset  { background: var(--blue-lt); color: var(--blue); border: 1.5px solid rgba(0,102,204,.2); }
.btn-reset:hover:not(:disabled) { background: #dce9ff; }

.btn-export { background: var(--page-bg); color: var(--text-2); border: 1.5px solid var(--border); }
.btn-export:hover:not(:disabled) { background: #E2E8F0; }

/* ══════════════════════════════════════════════════════════════════════════════
   RESULTS SECTION
══════════════════════════════════════════════════════════════════════════════ */
.results-section {
  margin: 16px 16px 0;
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* Summary strip */
.summary-strip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  padding: 14px 20px;
  background: var(--surface);
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  border-bottom: 1px solid var(--border-lt);
  box-shadow: var(--shadow-sm);
}

.ss-left {
  display: flex;
  align-items: baseline;
  gap: 5px;
}
.ss-count {
  font-size: 22px;
  font-weight: 700;
  color: var(--navy);
  line-height: 1;
}
.ss-label {
  font-size: 13px;
  color: var(--text-3);
  font-weight: 500;
}

.ss-stats {
  display: flex;
  align-items: center;
  gap: 0;
  border: 1px solid var(--border-lt);
  border-radius: var(--radius);
  overflow: hidden;
}

.ss-stat {
  display: flex;
  flex-direction: column;
  padding: 6px 16px;
}
.ss-stat__label {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .06em;
  color: var(--text-4);
}
.ss-stat__value {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-1);
  white-space: nowrap;
}
.ss-stat__value--red { color: var(--red-text); }
.ss-divider { width: 1px; background: var(--border-lt); align-self: stretch; }

@media (max-width: 640px) {
  .results-section { margin: 8px 8px 0; }
  .summary-strip { padding: 12px 14px; }
  .ss-stats { flex: 1; }
  .ss-stat { flex: 1; padding: 6px 10px; }
  .ss-stat__value { font-size: 12px; }
}

/* ── States ── */
.state-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 64px 24px;
  background: var(--surface);
  color: var(--text-3);
  border-radius: 1px;
}

.spinner {
  width: 36px; height: 36px;
  border: 3px solid var(--border-lt);
  border-top-color: var(--blue);
  border-radius: 50%;
  animation: spin .7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.state-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 56px 24px;
  background: var(--surface);
  border-radius: 1px;
  text-align: center;
  color: var(--text-3);
}
.state-empty svg { width: 64px; height: 64px; opacity: .5; margin-bottom: 4px; }
.state-empty h3  { font-size: 16px; font-weight: 700; color: var(--text-2); margin: 0; }
.state-empty p   { font-size: 13px; margin: 0; max-width: 340px; }
.state-empty__actions { display: flex; gap: 8px; margin-top: 8px; flex-wrap: wrap; justify-content: center; }

/* ══════════════════════════════════════════════════════════════════════════════
   TABLE WRAPPER — scrollable
══════════════════════════════════════════════════════════════════════════════ */
.tbl-wrap {
  /* THIS IS THE KEY: overflow must be set HERE and the table gets a min-width */
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  background: var(--surface);
  border-radius: 1px;
  box-shadow: var(--shadow-md);
  /* Custom thin scrollbar */
  scrollbar-width: thin;
  scrollbar-color: var(--border) transparent;
}
.tbl-wrap::-webkit-scrollbar        { height: 6px; }
.tbl-wrap::-webkit-scrollbar-track  { background: transparent; }
.tbl-wrap::-webkit-scrollbar-thumb  { background: var(--border); border-radius: 1px; }
.tbl-wrap::-webkit-scrollbar-thumb:hover { background: var(--text-4); }

/* ══════════════════════════════════════════════════════════════════════════════
   TABLE  — min-width forces horizontal scroll, no column squishing
══════════════════════════════════════════════════════════════════════════════ */
.adv-tbl {
  width: 100%;
  min-width: 980px;   /* ← THIS makes horizontal scroll kick in on small screens */
  border-collapse: collapse;
  font-size: 13px;
  table-layout: fixed;
}

/* ── Column widths ── */
.tc-ref     { width: 180px; }
.tc-client  { width: 160px; }
.tc-title   { width: 190px; }
.tc-by      { width: 140px; }
.tc-product { width: 160px; }
.tc-office  { width: 130px; }
.tc-amount  { width: 110px; }
.tc-status  { width: 130px; }
.tc-date    { width: 100px; }
.tc-actions { width: 100px; }

/* ── Header ── */
.adv-tbl thead tr {
  background: var(--navy);
}

.adv-tbl th {
  padding: 11px 14px;
  text-align: left;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .07em;
  text-transform: uppercase;
  color: rgba(255,255,255,.7);
  white-space: nowrap;
  border-right: 1px solid rgba(255,255,255,.07);
}
.adv-tbl th:last-child { border-right: none; }

/* Sticky Ref col */
.adv-tbl th.tc-ref,
.adv-tbl td.tc-ref {
  position: sticky;
  left: 0;
  z-index: 2;
}
.adv-tbl th.tc-ref { background: var(--navy); }
.adv-tbl td.tc-ref {
  background: #fff;
  border-right: 1px solid var(--border-lt);
  box-shadow: 2px 0 6px -2px rgba(0,0,0,.06);
  overflow: visible;
  white-space: nowrap;
}
.adv-tbl .adv-row:hover td.tc-ref { background: #EEF4FF; }

/* ── Body rows ── */
.adv-tbl tbody tr {
  border-bottom: 1px solid var(--border-lt);
  transition: background var(--t);
}
.adv-tbl tbody tr:last-child { border-bottom: none; }
.adv-tbl tbody tr.adv-row:hover { background: #EEF4FF; }

/* Subtle zebra on non-hover */
.adv-tbl tbody tr:nth-child(even) { background: #FAFBFC; }
.adv-tbl tbody tr:nth-child(even):hover { background: #EEF4FF; }

.adv-tbl td {
  padding: 10px 14px;
  vertical-align: top;
  border-right: 1px solid var(--border-lt);
  overflow: visible;
}
.adv-tbl td:last-child { border-right: none; }

/* ══════════════════════════════════════════════════════════════════════════════
   CELL CONTENT ATOMS
══════════════════════════════════════════════════════════════════════════════ */

/* Primary + secondary lines */
.c1 {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-1);
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.c2 {
  display: block;
  font-size: 11px;
  color: var(--text-4);
  line-height: 1.4;
  margin-top: 1px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Client and Title columns: always show full text, never truncate */
.tc-client .c1,
.tc-client .c2,
.tc-title  .c1 {
  white-space: normal;
  overflow: visible;
  text-overflow: unset;
  word-break: break-word;
}

.c-cap { text-transform: capitalize; }
.c-empty { color: var(--border); font-size: 13px; }

/* Ref chip */
.ref-chip {
  display: inline-block;
  font-family: "IBM Plex Mono", monospace;
  font-size: 11px;
  font-weight: 600;
  color: var(--blue);
  background: var(--blue-lt);
  border: 1px solid rgba(0,102,204,.15);
  padding: 3px 8px;
  border-radius: 1px;
  letter-spacing: .04em;
  white-space: nowrap;
}

/* Amount */
.amount-val {
  display: block;
  font-size: 13px;
  font-weight: 700;
  color: var(--text-1);
  white-space: nowrap;
}

/* Generic chips */
.chip {
  display: inline-block;
  margin-top: 3px;
  margin-right: 3px;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 1px;
  letter-spacing: .02em;
  white-space: nowrap;
}

.chip-disc { color: var(--red-text);   background: var(--red-bg);   border: 1px solid var(--red-bd);   }
.chip-size { color: var(--text-3);     background: var(--page-bg);  border: 1px solid var(--border); white-space: normal; word-break: break-word; }
.chip-rev  { color: var(--green-text); background: var(--green-bg); border: 1px solid var(--green-bd); }
.chip-cost { color: var(--cyan-text);  background: var(--cyan-bg);  border: 1px solid var(--cyan-bd);  }

/* ══════════════════════════════════════════════════════════════════════════════
   STATUS BADGES
══════════════════════════════════════════════════════════════════════════════ */
.sbadge {
  display: inline-flex;
  align-items: center;
  height: 22px;
  padding: 0 10px;
  border-radius: 1px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
  letter-spacing: .03em;
}

.sbadge--draft    { background: var(--amber-bg); color: var(--amber-text); border: 1px solid var(--amber-bd); }
.sbadge--pending  { background: #EEF4FF;         color: #1E40AF;           border: 1px solid #BFDBFE;         }
.sbadge--approved { background: var(--green-bg); color: var(--green-text); border: 1px solid var(--green-bd); }
.sbadge--rejected { background: var(--red-bg);   color: var(--red-text);   border: 1px solid var(--red-bd);   }
.sbadge--default  { background: var(--page-bg);  color: var(--text-3);     border: 1px solid var(--border);   }

/* ══════════════════════════════════════════════════════════════════════════════
   ACTION ICON BUTTONS
══════════════════════════════════════════════════════════════════════════════ */
.act-group {
  display: flex;
  align-items: center;
  gap: 4px;
}

.act-wrap {
  position: relative;
  display: inline-flex;
}

.act-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px; height: 30px;
  border: none;
  border-radius: var(--radius);
  cursor: pointer;
  transition: background var(--t), transform var(--t);
  flex-shrink: 0;
}
.act-btn svg { width: 15px; height: 15px; pointer-events: none; }
.act-btn:active { transform: scale(.92); }

.act-view { background: #E0F2FE; color: #0369A1; }
.act-view:hover { background: #BAE6FD; }

.act-edit { background: var(--amber-bg); color: #B45309; }
.act-edit:hover { background: var(--amber-bd); }

.act-file { background: #F3E8FF; color: #7C3AED; }
.act-file:hover { background: #E9D5FF; }

/* file count badge */
.act-badge {
  position: absolute;
  top: -4px; right: -4px;
  min-width: 15px; height: 15px;
  padding: 0 3px;
  background: #7C3AED;
  color: #fff;
  font-style: normal;
  font-size: 9px;
  font-weight: 700;
  border-radius: 1px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  pointer-events: none;
  font-family: var(--font);
}

/* Tooltip */
.act-tip {
  pointer-events: none;
  position: absolute;
  bottom: calc(100% + 7px);
  left: 50%; transform: translateX(-50%);
  white-space: nowrap;
  background: var(--text-1);
  color: #fff;
  font-size: 11px;
  font-weight: 500;
  padding: 4px 9px;
  border-radius: var(--radius);
  opacity: 0;
  transition: opacity var(--t);
  z-index: 9999;
}
.act-tip::after {
  content: '';
  position: absolute;
  top: 100%; left: 50%; transform: translateX(-50%);
  border: 4px solid transparent;
  border-top-color: var(--text-1);
}
.act-wrap:hover .act-tip { opacity: 1; }

/* ══════════════════════════════════════════════════════════════════════════════
   FAB
══════════════════════════════════════════════════════════════════════════════ */
.fab {
  position: fixed;
  bottom: 24px; right: 24px;
  display: flex; align-items: center; gap: 8px;
  height: 48px;
  padding: 0 22px;
  background: var(--navy);
  color: #fff;
  border: none;
  border-radius: 1px;
  font-family: var(--font);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(0,51,102,.35);
  z-index: 100;
  transition: background var(--t), box-shadow var(--t), transform var(--t);
}
.fab svg { width: 18px; height: 18px; flex-shrink: 0; }
.fab:hover { background: var(--navy-light); box-shadow: 0 6px 28px rgba(0,51,102,.45); transform: translateY(-2px); }

@media (max-width: 640px) {
  .fab { width: 52px; height: 52px; padding: 0; justify-content: center; border-radius: 50%; bottom: 20px; right: 16px; }
  .fab-label { display: none; }
}
</style>