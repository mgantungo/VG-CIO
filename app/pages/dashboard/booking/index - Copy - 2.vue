<!--pages/dashboard/booking/index.vue-->
<template>
  <div class="date-range-adverts-page">
    <div class="page-header">
      <div class="header-top">
        <div class="header-title">
          <h1>
            <span class="page-icon">📋</span>
            Adverts Report
          </h1>
          <p class="page-subtitle">View adverts captured within a specific date range</p>
        </div>
        
        <div class="header-actions">
          <button 
            class="btn btn-success"
            @click="createNewAdvert"
          >
            <span class="btn-icon">➕</span>
            <span class="btn-text">Create New Advert</span>
          </button>
        </div>
      </div>
      
      <div class="header-stats">
        <div class="stat-card stat-primary">
          <div class="stat-icon">📅</div>
          <div class="stat-content">
            <div class="stat-label">Date Range</div>
            <div class="stat-value">{{ dateRangeDisplay }}</div>
          </div>
        </div>
        
        <div class="stat-card stat-success">
          <div class="stat-icon">📋</div>
          <div class="stat-content">
            <div class="stat-label">Total Adverts</div>
            <div class="stat-value">{{ statistics.totalAdverts }}</div>
          </div>
        </div>
        
        <div class="stat-card stat-warning">
          <div class="stat-icon">💰</div>
          <div class="stat-content">
            <div class="stat-label">Total Value</div>
            <div class="stat-value">{{ formatCurrency(statistics.totalAmount) }}</div>
          </div>
        </div>
        
        <div class="stat-card stat-info">
          <div class="stat-icon">👥</div>
          <div class="stat-content">
            <div class="stat-label">Active Users</div>
            <div class="stat-value">{{ statistics.uniqueUsers }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Error message display -->
    <div v-if="error" class="error-message">
      <strong>Error:</strong> {{ error }}
    </div>

    <div class="content-card">
      <!-- Date Range Filter Section -->
      <div class="date-filter-section">
        <div class="filter-header">
          <h3>📅 Filter by Date Range</h3>
        </div>
        
        <div class="date-range-controls">
          <div class="date-input-group">
            <label for="startDate">Start Date:</label>
            <input 
              type="date" 
              id="startDate"
              v-model="startDate"
              class="date-input"
              :max="endDate"
            >
          </div>
          
          <div class="date-input-group">
            <label for="endDate">End Date:</label>
            <input 
              type="date" 
              id="endDate"
              v-model="endDate"
              class="date-input"
              :min="startDate"
              :max="maxDate"
            >
          </div>
          
          <div class="quick-date-buttons">
            <button 
              class="btn btn-outline btn-sm"
              @click="setDateRange('today')"
              :class="{ 'btn-active': activeQuickRange === 'today' }"
            >
              Today
            </button>
            <button 
              class="btn btn-outline btn-sm"
              @click="setDateRange('yesterday')"
              :class="{ 'btn-active': activeQuickRange === 'yesterday' }"
            >
              Yesterday
            </button>
            <button 
              class="btn btn-outline btn-sm"
              @click="setDateRange('thisWeek')"
              :class="{ 'btn-active': activeQuickRange === 'thisWeek' }"
            >
              This Week
            </button>
            <button 
              class="btn btn-outline btn-sm"
              @click="setDateRange('thisMonth')"
              :class="{ 'btn-active': activeQuickRange === 'thisMonth' }"
            >
              This Month
            </button>
            <button 
              class="btn btn-outline btn-sm"
              @click="setDateRange('lastMonth')"
              :class="{ 'btn-active': activeQuickRange === 'lastMonth' }"
            >
              Last Month
            </button>
          </div>
        </div>
        
        <!-- Additional Filters -->
        <div class="additional-filters">
          <div class="filter-group">
            <label for="userFilter">Filter by User:</label>
            <select 
              id="userFilter" 
              v-model="selectedUserId"
              class="filter-select"
              @change="loadAdverts"
            >
              <option value="">All Users</option>
              <option 
                v-for="user in availableUsers" 
                :key="user.id" 
                :value="user.id"
              >
                {{ user.name }} ({{ user.role }})
              </option>
            </select>
          </div>
          
          <div class="filter-group">
            <label for="statusFilter">Filter by Status:</label>
            <select 
              id="statusFilter" 
              v-model="selectedStatus"
              class="filter-select"
              @change="loadAdverts"
            >
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="pending_review">Pending Review</option>
              <option value="editor_approved">Editor Approved</option>
              <option value="manager_approved">Manager Approved</option>
              <option value="editor_rejected">Editor Rejected</option>
              <option value="manager_rejected">Manager Rejected</option>
            </select>
          </div>
          
          <div class="filter-group">
            <label for="searchQuery">Search:</label>
            <input 
              type="text" 
              id="searchQuery"
              v-model="searchQuery"
              class="search-input"
              placeholder="Search by reference, client, title..."
              @keyup.enter="applySearch"
            >
          </div>
        </div>
        
        <div class="filter-actions">
          <button 
            class="btn btn-primary"
            @click="loadAdverts"
            :disabled="loading || isDateRangeInvalid"
          >
            <span v-if="loading">🔍 Loading...</span>
            <span v-else>🔍 Apply Filters</span>
          </button>
          
          <button 
            class="btn btn-secondary"
            @click="resetFilters"
          >
            🔄 Reset
          </button>
          
          <button 
            class="btn btn-success"
            @click="exportData"
            :disabled="adverts.length === 0"
          >
            📊 Export Data
          </button>
        </div>
        
        <div v-if="isDateRangeInvalid" class="date-error">
          ⚠️ End date must be after start date
        </div>
      </div>

      <!-- Results Section -->
      <div class="results-section">
        <div class="results-header">
          <h3>📋 Results ({{ filteredAdverts.length }} adverts)</h3>
          <div class="results-summary">
            <span class="summary-item">
              <span class="summary-label">Total Value:</span>
              <span class="summary-value">{{ formatCurrency(statistics.totalAmount) }}</span>
            </span>
            <span class="summary-item">
              <span class="summary-label">Avg. Amount:</span>
              <span class="summary-value">{{ formatCurrency(statistics.averageAmount) }}</span>
            </span>
            <span class="summary-item">
              <span class="summary-label">Total Discount:</span>
              <span class="summary-value">{{ formatCurrency(statistics.totalDiscount) }}</span>
            </span>
          </div>
        </div>

        <div class="table-container">
          <table class="adverts-table" v-if="filteredAdverts.length > 0">
            <thead>
              <tr>
                <th>Ref #</th>
                <th>Captured By</th>
                <th>Client</th>
                <th>Advert Title</th>
                <th>Product</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="advert in filteredAdverts" :key="advert.id">
                <td class="ref-cell">
                  <span class="ref-number">{{ advert.reference }}</span>
                </td>
                <td class="user-cell">
                  <div class="user-info">
                    <div class="user-name">{{ advert.createdBy?.name || 'Unknown' }}</div>
                    <div class="user-email">{{ advert.createdBy?.email || '' }}</div>
                    <div class="user-role">{{ advert.createdBy?.role || '' }}</div>
                  </div>
                </td>
                <td class="client-cell">
                  <div class="client-name">{{ advert.clientName }}</div>
                  <div class="client-contact">{{ advert.client?.contact_person || '' }}</div>
                </td>
                <td class="title-cell">
                  {{ advert.advertTitle }}
                </td>
                <td class="product-cell">
                  <div>{{ advert.product?.product_name || 'N/A' }}</div>
                  <div class="product-size" v-if="advert.adSize">{{ advert.adSize }}</div>
                </td>
                <td class="amount-cell">
                  <div class="amount-display">
                    <span class="amount">{{ formatCurrency(advert.totalAmount) }}</span>
                    <span v-if="advert.discount > 0" class="discount-badge">
                      -{{ formatCurrency(advert.discount) }}
                    </span>
                  </div>
                </td>
                <td class="status-cell">
                  <span :class="`status-badge badge-${getStatusClass(advert.status)}`">
                    {{ getStatusLabel(advert.status) }}
                  </span>
                </td>
                <td class="date-cell">
                  <div class="date-display-cell">
                    <div class="date">{{ formatDate(advert.createdAt) }}</div>
                    <div class="time">{{ formatTime(advert.createdAt) }}</div>
                  </div>
                </td>
                <td class="actions-cell">
                  <div class="action-buttons">
                    <button class="btn btn-info btn-sm" @click="viewAdvert(advert)">
                      👁️ View
                    </button>
                    <button 
                      v-if="advert.attachments?.length > 0"
                      class="btn btn-download btn-sm"
                      @click="downloadAttachments(advert)"
                      title="View Attachments"
                    >
                      📎 {{ advert.attachments.length }}
                    </button>
                    <button 
                      v-if="advert.status === 'draft'"
                      class="btn btn-warning btn-sm"
                      @click="editAdvert(advert)"
                    >
                      ✏️ Edit
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          
          <!-- Loading state -->
          <div v-if="loading" class="loading-state">
            <div class="spinner"></div>
            <p>Loading adverts...</p>
          </div>

          <!-- Empty state -->
          <div v-if="!loading && filteredAdverts.length === 0" class="empty-state">
            <div class="empty-icon">📊</div>
            <h3>No adverts found</h3>
            <p v-if="searchQuery || selectedUserId || selectedStatus">
              Try adjusting your filters or date range
            </p>
            <p v-else-if="dateRangeDisplay !== 'Today'">
              No adverts found for the selected date range
            </p>
            <p v-else>
              No adverts have been created today.
            </p>
            <div class="empty-state-actions">
              <button 
                class="btn btn-success"
                @click="createNewAdvert"
              >
                ➕ Create Your First Advert
              </button>
              <button 
                v-if="searchQuery || selectedUserId || selectedStatus || dateRangeDisplay !== 'Today'"
                class="btn btn-secondary"
                @click="resetFilters"
              >
                🔄 Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Floating Action Button for Mobile -->
    <button 
      class="floating-action-btn"
      @click="createNewAdvert"
      title="Create New Advert"
    >
      <span class="fab-icon">➕</span>
      <span class="fab-text">New Advert</span>
    </button>
  </div>
</template>

<script setup>
import { useAdverts } from '~/composables/useAdverts'
import { ref, computed, onMounted } from 'vue'
import { useRouter } from '#imports'

const router = useRouter()
const { 
  loading, 
  error,
  getDateRangeAdverts: getDateRangeAdvertsApi
} = useAdverts()

// Reactive data
const adverts = ref([])
const startDate = ref('')
const endDate = ref('')
const selectedUserId = ref('')
const selectedStatus = ref('')
const searchQuery = ref('')
const activeQuickRange = ref('today')
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
      advert.product?.product_name?.toLowerCase().includes(query)
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
    
    adverts.value = response.data || []
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
  // This function is just for triggering search on enter
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
      advert.createdBy?.name || 'Unknown',
      advert.clientName,
      advert.advertTitle,
      advert.product?.product_name || '',
      advert.adSize || '',
      advert.basePrice || 0,
      advert.surcharge || 0,
      advert.discount || 0,
      advert.totalAmount || 0,
      advert.status,
      new Date(advert.createdAt).toLocaleString(),
      advert.startDate ? new Date(advert.startDate).toLocaleDateString() : '',
      advert.endDate ? new Date(advert.endDate).toLocaleDateString() : '',
      advert.paymentMethod || '',
      advert.createdBy?.email || '',
      advert.createdBy?.role || ''
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

const viewAdvert = (advert) => {
  router.push(`/dashboard/adverts/${advert.id}`)
}

const editAdvert = (advert) => {
  if (advert.status === 'draft') {
    router.push(`/dashboard/booking/new?id=${advert.id}`)
  } else {
    alert('Only draft adverts can be edited')
  }
}


const downloadAttachments = async (advert) => {
  try {
    if (advert.attachments?.length > 0) {
      advert.attachments.forEach(attachment => {
        if (attachment.url) {
          // Assuming the URL is relative, prepend the base URL
          const fullUrl = attachment.url.startsWith('http') 
            ? attachment.url 
            : `${API_BASE.replace('/api', '')}${attachment.url}`
          window.open(fullUrl, '_blank')
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
.date-range-adverts-page {
  width: 100%;
}

/* Header Styles */
.page-header {
  background: white;
  padding: 20px 30px;
  border-radius: 10px;
  margin-bottom: 30px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 20px;
}

.header-title {
  flex: 1;
}

.page-icon {
  margin-right: 10px;
}

.page-header h1 {
  color: #003366;
  margin-bottom: 5px;
  font-size: 1.8em;
}

.page-subtitle {
  color: #666;
  margin: 5px 0 0;
  font-size: 1em;
}

.header-actions {
  display: flex;
  gap: 15px;
}

.btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.95em;
  transition: all 0.3s;
  font-weight: 500;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-success {
  background: #28a745;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #218838;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(40, 167, 69, 0.3);
}

.header-stats {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 15px;
  background: white;
  padding: 15px 20px;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  flex: 1;
  min-width: 200px;
  border-left: 4px solid;
}

.stat-icon {
  font-size: 2em;
  opacity: 0.8;
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 0.9em;
  color: #666;
  margin-bottom: 5px;
}

.stat-value {
  font-size: 1.4em;
  font-weight: 700;
}

.stat-primary { border-left-color: #0066CC; }
.stat-success { border-left-color: #28a745; }
.stat-warning { border-left-color: #ffc107; }
.stat-info { border-left-color: #17a2b8; }

/* Content Card */
.content-card {
  background: white;
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

/* Filter Section */
.date-filter-section {
  background: #f8f9fa;
  padding: 25px;
  border-radius: 8px;
  margin-bottom: 30px;
  border: 1px solid #dee2e6;
}

.filter-header {
  margin-bottom: 20px;
}

.filter-header h3 {
  color: #003366;
  margin: 0;
  font-size: 1.3em;
}

.date-range-controls {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.date-input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 150px;
}

.date-input-group label {
  font-size: 0.9em;
  font-weight: 500;
  color: #495057;
}

.date-input {
  padding: 10px 12px;
  border: 1px solid #ced4da;
  border-radius: 5px;
  font-size: 0.95em;
  background: white;
}

.date-input:focus {
  outline: none;
  border-color: #0066CC;
  box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
}

.quick-date-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.btn-outline {
  background: white;
  color: #0066CC;
  border: 1px solid #0066CC;
  padding: 8px 15px;
}

.btn-outline:hover {
  background: #0066CC;
  color: white;
}

.btn-active {
  background: #0066CC !important;
  color: white !important;
}

.additional-filters {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 25px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-group label {
  font-size: 0.9em;
  font-weight: 500;
  color: #495057;
}

.filter-select, .search-input {
  padding: 10px 12px;
  border: 1px solid #ced4da;
  border-radius: 5px;
  font-size: 0.95em;
  background: white;
  width: 100%;
}

.filter-actions {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.btn-primary {
  background: #E31E24;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #c01820;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(227, 30, 36, 0.2);
}

.btn-secondary {
  background: #0066CC;
  color: white;
}

.btn-secondary:hover {
  background: #0052a3;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(0, 102, 204, 0.2);
}

.date-error {
  color: #dc3545;
  margin-top: 10px;
  font-size: 0.9em;
  display: flex;
  align-items: center;
  gap: 5px;
}

/* Results Section */
.results-section {
  margin-top: 30px;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 15px;
}

.results-header h3 {
  color: #003366;
  margin: 0;
}

.results-summary {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 100px;
}

.summary-label {
  font-size: 0.85em;
  color: #666;
  margin-bottom: 3px;
}

.summary-value {
  font-size: 1.1em;
  font-weight: 600;
  color: #003366;
}

/* Table Styles */
.table-container {
  overflow-x: auto;
  border-radius: 8px;
  border: 1px solid #dee2e6;
}

.adverts-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 1000px;
}

.adverts-table th {
  background: #f8f9fa;
  padding: 15px;
  text-align: left;
  font-weight: 600;
  color: #495057;
  border-bottom: 2px solid #dee2e6;
}

.adverts-table td {
  padding: 15px;
  border-bottom: 1px solid #dee2e6;
  vertical-align: top;
}

.adverts-table tr:hover {
  background-color: #f8f9fa;
}

/* Table cell specific styles */
.ref-cell .ref-number {
  font-family: monospace;
  font-weight: 600;
  color: #003366;
  background: #f0f7ff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.9em;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-name {
  font-weight: 500;
  color: #003366;
}

.user-email {
  font-size: 0.85em;
  color: #666;
}

.user-role {
  font-size: 0.8em;
  color: #888;
  font-style: italic;
}

.client-name {
  font-weight: 500;
  color: #333;
}

.client-contact {
  font-size: 0.85em;
  color: #666;
}

.title-cell {
  max-width: 250px;
  word-wrap: break-word;
}

.product-cell .product-size {
  font-size: 0.85em;
  color: #666;
  background: #f8f9fa;
  padding: 2px 6px;
  border-radius: 3px;
  display: inline-block;
  margin-top: 4px;
}

.amount-display {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.amount {
  font-weight: 500;
  color: #28a745;
}

.discount-badge {
  font-size: 0.8em;
  color: #dc3545;
  background: rgba(220, 53, 69, 0.1);
  padding: 2px 6px;
  border-radius: 3px;
  display: inline-block;
}

.status-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.85em;
  font-weight: 500;
  text-transform: capitalize;
}

.badge-draft {
  background-color: rgba(255, 193, 7, 0.15);
  color: #856404;
  border: 1px solid rgba(255, 193, 7, 0.3);
}

.badge-pending {
  background-color: rgba(23, 162, 184, 0.15);
  color: #0c5460;
  border: 1px solid rgba(23, 162, 184, 0.3);
}

.badge-approved {
  background-color: rgba(40, 167, 69, 0.15);
  color: #155724;
  border: 1px solid rgba(40, 167, 69, 0.3);
}

.badge-rejected {
  background-color: rgba(220, 53, 69, 0.15);
  color: #721c24;
  border: 1px solid rgba(220, 53, 69, 0.3);
}

.badge-default {
  background-color: rgba(108, 117, 125, 0.15);
  color: #343a40;
  border: 1px solid rgba(108, 117, 125, 0.3);
}

.date-display-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.date {
  font-size: 0.9em;
  color: #333;
}

.time {
  font-size: 0.85em;
  color: #666;
}

.actions-cell .action-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 0.85em;
}

.btn-info {
  background: #17a2b8;
  color: white;
}

.btn-info:hover {
  background: #138496;
}

.btn-warning {
  background: #ffc107;
  color: #333;
}

.btn-warning:hover {
  background: #e0a800;
}

.btn-download {
  background: #6f42c1;
  color: white;
}

.btn-download:hover {
  background: #5a32a3;
}

/* Loading State */
.loading-state {
  text-align: center;
  padding: 40px;
}

.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #0066CC;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #666;
  border: 2px dashed #dee2e6;
  border-radius: 8px;
  margin-top: 20px;
}

.empty-icon {
  font-size: 3em;
  margin-bottom: 15px;
  opacity: 0.5;
}

.empty-state h3 {
  color: #333;
  margin-bottom: 10px;
  font-weight: 500;
}

.empty-state p {
  margin-bottom: 10px;
}

.empty-state-actions {
  display: flex;
  gap: 15px;
  margin-top: 20px;
  justify-content: center;
  flex-wrap: wrap;
}

.empty-state-actions .btn {
  min-width: 180px;
  padding: 12px 20px;
}

/* Error Message */
.error-message {
  background-color: #f8d7da;
  color: #721c24;
  padding: 12px 20px;
  border-radius: 6px;
  margin-bottom: 20px;
  border: 1px solid #f5c6cb;
}

/* Floating Action Button */
.floating-action-btn {
  position: fixed;
  bottom: 30px;
  right: 30px;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 50px;
  padding: 15px 25px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
  display: flex;
  align-items: center;
  gap: 10px;
  z-index: 100;
  transition: all 0.3s ease;
}

.floating-action-btn:hover {
  background: #218838;
  transform: translateY(-3px);
  box-shadow: 0 6px 15px rgba(40, 167, 69, 0.4);
}

.fab-icon {
  font-size: 1.2em;
}

/* Responsive Styles */
@media (max-width: 768px) {
  .page-header,
  .content-card {
    padding: 20px;
  }
  
  .header-top {
    flex-direction: column;
  }
  
  .header-actions {
    width: 100%;
  }
  
  .btn {
    width: 100%;
    justify-content: center;
  }
  
  .header-stats {
    flex-direction: column;
  }
  
  .stat-card {
    width: 100%;
  }
  
  .date-range-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .date-input-group {
    width: 100%;
  }
  
  .quick-date-buttons {
    width: 100%;
    justify-content: center;
  }
  
  .additional-filters {
    grid-template-columns: 1fr;
  }
  
  .filter-actions {
    flex-direction: column;
  }
  
  .results-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .results-summary {
    justify-content: space-between;
  }
  
  .summary-item {
    min-width: unset;
    flex: 1;
  }
  
  .fab-text {
    display: none;
  }
  
  .floating-action-btn {
    padding: 15px;
    border-radius: 50%;
  }
}
</style>