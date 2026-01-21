<!--pages/dashboard/index.vue - FIXED-->
<template>
  <div class="review-page">
    <div class="page-header">
      <div class="header-content">
        <div>
          <h1>📋 Dashboard</h1>
          <p>Review and manage advertising submissions</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-refresh" @click="loadAdverts" :disabled="loading">
            <span v-if="loading">⏳ Loading...</span>
            <span v-else>🔄 Refresh</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Date Range Filter -->
    <div class="date-filter-card">
      <h3>📅 Filter by Date Range</h3>
      <div class="date-controls">
        <div class="date-input-group">
          <label>Start Date:</label>
          <input 
            type="date" 
            v-model="startDate"
            @change="loadAdverts"
            :max="endDate"
          >
        </div>
        <div class="date-input-group">
          <label>End Date:</label>
          <input 
            type="date" 
            v-model="endDate"
            @change="loadAdverts"
            :min="startDate"
            :max="today"
          >
        </div>
        <div class="quick-buttons">
          <button class="btn-quick" @click="setQuickRange('today')">Today</button>
          <button class="btn-quick" @click="setQuickRange('week')">This Week</button>
          <button class="btn-quick" @click="setQuickRange('month')">This Month</button>
        </div>
      </div>
    </div>

    <!-- Statistics Cards - FIXED LAYOUT -->
    <div class="stats-container">
      <div class="stats-grid">
        <StatCard 
          icon="📊"
          :value="statistics.total"
          label="Total Adverts"
          color="blue"
        />
        <StatCard 
          icon="⏳"
          :value="statistics.pendingReview"
          label="Pending Review"
          color="red"
        />
        <StatCard 
          icon="✓"
          :value="statistics.approved"
          label="Approved"
          color="green"
        />
        <StatCard 
          icon="❌"
          :value="statistics.rejected"
          label="Rejected"
          color="red"
        />
        <StatCard 
          icon="💰"
          :value="formatCurrency(statistics.totalRevenue)"
          label="Total Revenue"
          color="green"
        />
        <StatCard 
          icon="📝"
          :value="statistics.drafts"
          label="Drafts"
          color="gold"
        />
      </div>
    </div>

    <!-- Main Content -->
    <div class="content-card">
      <div class="card-header">
        <h2>Adverts by Category</h2>
        <span class="result-count">{{ filteredAdverts.length }} adverts</span>
      </div>

      <!-- Tabs for filtering by platform -->
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

      <!-- Status Filter -->
      <div class="status-filter">
        <label>Filter by Status:</label>
        <select v-model="statusFilter" @change="applyFilters">
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="pending_review">Pending Review</option>
          <option value="editor_approved">Editor Approved</option>
          <option value="manager_approved">Manager Approved</option>
          <option value="editor_rejected">Rejected</option>
        </select>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading adverts...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <div class="error-icon">⚠️</div>
        <h3>Error Loading Data</h3>
        <p>{{ error }}</p>
        <button class="btn btn-primary" @click="loadAdverts">Try Again</button>
      </div>

      <!-- Adverts Table - USING DATA TABLE COMPONENT -->
      <div v-else-if="filteredAdverts.length > 0" class="adverts-container">
        <DataTable 
          :headers="tableHeaders"
          :items="filteredAdverts"
          :loading="loading"
          :page-size="10"
          :show-pagination="true"
        >
          <template #cell(reference)="{ item }">
            <span class="ref-number">{{ item.reference }}</span>
          </template>
          
          <template #cell(client)="{ item }">
            <div class="client-info">
              <div class="client-name">{{ item.clientName }}</div>
              <div class="client-contact">{{ item.contactPerson }}</div>
            </div>
          </template>
          
          <template #cell(platform)="{ item }">
            <div class="platform-info">
              <div class="platform-name">{{ item.productName }}</div>
              <span class="platform-badge" :class="`badge-${item.platformCategory}`">
                {{ formatCategory(item.platformCategory) }}
              </span>
            </div>
          </template>
          
          <template #cell(amount)="{ item }">
            <strong>{{ formatCurrency(item.totalAmount) }}</strong>
          </template>
          
          <template #cell(status)="{ item }">
            <span :class="`status-badge badge-${getStatusClass(item.status)}`">
              {{ getStatusLabel(item.status) }}
            </span>
          </template>
          
          <template #cell(created)="{ item }">
            <div class="date-info">
              <div class="date">{{ formatDate(item.createdAt) }}</div>
              <div class="time">{{ formatTime(item.createdAt) }}</div>
            </div>
          </template>
          
          <template #cell(actions)="{ item }">
            <div class="table-actions">
              <button 
                class="btn btn-sm btn-primary"
                @click="viewAdvert(item)"
              >
                👁️ View
              </button>
              <button 
                v-if="canReview(item)"
                class="btn btn-sm btn-success"
                @click="handleReview(item)"
              >
                ✓ Review
              </button>
            </div>
          </template>
        </DataTable>
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state">
        <div class="empty-icon">📊</div>
        <h3>No adverts found</h3>
        <p>No adverts found for the selected date range and filters</p>
        <button class="btn btn-primary" @click="resetFilters">
          🔄 Reset Filters
        </button>
      </div>
    </div>

    <!-- Review Modal -->
    <ReviewModal 
      v-if="selectedAdvert"
      :advert="selectedAdvert"
      :show="showModal"
      @approve="handleApprove"
      @reject="handleReject"
      @request-changes="handleRequestChanges"
      @close="closeModal"
    />
  </div>
</template>

<script setup>
import StatCard from '~/components/common/StatCard.vue'
import ReviewModal from '~/components/editor/ReviewModal.vue'
import DataTable from '~/components/common/DataTable.vue'
import { useAdverts } from '~/composables/useAdverts'
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRuntimeConfig } from '#imports'

const router = useRouter()
const config = useRuntimeConfig()
const { getDateRangeAdverts, loading, error } = useAdverts()

const API_BASE = config.public.apiBase

// State
const adverts = ref([])
const startDate = ref('')
const endDate = ref('')
const today = ref(new Date().toISOString().split('T')[0])
const activeTab = ref('all')
const statusFilter = ref('all')
const selectedAdvert = ref(null)
const showModal = ref(false)

// Table headers for DataTable
const tableHeaders = ref([
  { key: 'reference', label: 'Reference' },
  { key: 'client', label: 'Client' },
  { key: 'advertTitle', label: 'Title' },
  { key: 'platform', label: 'Platform' },
  { key: 'amount', label: 'Amount' },
  { key: 'status', label: 'Status' },
  { key: 'created', label: 'Created' },
  { key: 'actions', label: 'Actions' }
])

// Tabs configuration
const tabs = ref([
  { id: 'all', label: 'All' },
  { id: 'print', label: 'Print Media' },
  { id: 'tv', label: 'Television' },
  { id: 'radio', label: 'Radio' },
  { id: 'digital', label: 'Digital' }
])

// Product to Category Mapping (Vision Group products)
const productCategoryMap = {
  // Print Media
  'new vision': 'print',
  'bukedde': 'print',
  'orumuri': 'print',
  'vision voice': 'print',
  'saturday vision': 'print',
  'sunday vision': 'print',
  'daily monitor': 'print',
  'monitor': 'print',
  
  // Television
  'ubc tv': 'tv',
  'bukedde tv': 'tv',
  'spark tv': 'tv',
  'nbs tv': 'tv',
  'ntv': 'tv',
  'nbs': 'tv',
  
  // Radio
  'vision group radio': 'radio',
  'akaboozi': 'radio',
  'radio west': 'radio',
  'rupiny fm': 'radio',
  'etop radio': 'radio',
  'flair fm': 'radio',
  
  // Digital
  'newvision.co.ug': 'digital',
  'bukedde.co.ug': 'digital',
  'digital platforms': 'digital',
  'vision group digital': 'digital',
  'website': 'digital',
  'online': 'digital'
}

// Function to determine category from product name
const getCategoryFromProductName = (productName) => {
  if (!productName) return 'other'
  
  const name = productName.toLowerCase().trim()
  
  // Check exact matches first
  if (productCategoryMap[name]) {
    return productCategoryMap[name]
  }
  
  // Check partial matches
  for (const [key, category] of Object.entries(productCategoryMap)) {
    if (name.includes(key) || key.includes(name)) {
      return category
    }
  }
  
  // Default to print for newspapers if we can't determine
  if (name.includes('vision') || name.includes('newspaper') || name.includes('daily')) {
    return 'print'
  }
  
  return 'other'
}

// Computed - Statistics
const statistics = computed(() => {
  const stats = {
    total: adverts.value.length,
    pendingReview: 0,
    approved: 0,
    rejected: 0,
    drafts: 0,
    totalRevenue: 0
  }

  adverts.value.forEach(advert => {
    // Count by status
    if (advert.status === 'pending_review') {
      stats.pendingReview++
    } else if (advert.status === 'editor_approved' || advert.status === 'manager_approved') {
      stats.approved++
    } else if (advert.status === 'editor_rejected' || advert.status === 'manager_rejected') {
      stats.rejected++
    } else if (advert.status === 'draft') {
      stats.drafts++
    }

    // Sum total revenue
    const amount = parseFloat(advert.totalAmount) || 0
    stats.totalRevenue += amount
  })

  return stats
})

// Computed - Filtered Adverts
const filteredAdverts = computed(() => {
  let filtered = [...adverts.value]

  // Filter by platform category
  if (activeTab.value !== 'all') {
    filtered = filtered.filter(advert => 
      advert.platformCategory === activeTab.value
    )
  }

  // Filter by status
  if (statusFilter.value !== 'all') {
    filtered = filtered.filter(advert => 
      advert.status === statusFilter.value
    )
  }

  return filtered
})

// Methods
const initializeDates = () => {
  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  
  startDate.value = firstDayOfMonth.toISOString().split('T')[0]
  endDate.value = today.value
}

const loadAdverts = async () => {
  try {
    const response = await getDateRangeAdverts({
      startDate: startDate.value,
      endDate: endDate.value
    })

    if (response && response.data) {
      // Transform API data with category detection
      adverts.value = response.data.map(advert => {
        // Get product name
        const productName = advert.product?.product_name || ''
        
        // Determine platform category
        let platformCategory = 'other'
        
        // Try to get from product.category if it exists
        if (advert.product?.category?.type) {
          platformCategory = advert.product.category.type
        } else if (advert.product?.category?.category_type) {
          platformCategory = advert.product.category.category_type
        } else {
          // Fallback: Determine from product name
          platformCategory = getCategoryFromProductName(productName)
        }
        
        console.log(`📦 Product "${productName}" → Category: ${platformCategory}`)
        
        return {
          id: advert.id,
          reference: advert.reference || `ADV-${advert.id}`,
          clientName: advert.clientName || advert.client?.company_name || 'N/A',
          contactPerson: advert.contactPerson || advert.client?.contact_person || '',
          email: advert.email || advert.client?.email || '',
          phone: advert.phone || advert.client?.phone || '',
          advertTitle: advert.advertTitle || 'Untitled',
          productName: productName,
          platformCategory: platformCategory,
          categoryName: formatCategory(platformCategory),
          adSize: advert.adSize || '',
          adType: advert.adType || '',
          frequency: advert.frequency || 1,
          startDate: advert.startDate,
          endDate: advert.endDate,
          basePrice: parseFloat(advert.basePrice) || 0,
          surcharge: parseFloat(advert.surcharge) || 0,
          discount: parseFloat(advert.discount) || 0,
          totalAmount: parseFloat(advert.totalAmount) || 0,
          paymentMethod: advert.paymentMethod || '',
          status: advert.status || 'draft',
          specialInstructions: advert.specialInstructions || '',
          attachments: advert.attachments || [],
          createdAt: advert.createdAt,
          updatedAt: advert.updatedAt,
          createdBy: advert.createdBy || null,
          client: advert.client,
          product: advert.product,
          rateCard: advert.rateCard
        }
      })

      console.log('✅ Loaded adverts:', adverts.value.length)
      console.log('📊 Category breakdown:', {
        print: adverts.value.filter(a => a.platformCategory === 'print').length,
        tv: adverts.value.filter(a => a.platformCategory === 'tv').length,
        radio: adverts.value.filter(a => a.platformCategory === 'radio').length,
        digital: adverts.value.filter(a => a.platformCategory === 'digital').length,
        other: adverts.value.filter(a => a.platformCategory === 'other').length
      })
    } else {
      console.warn('⚠️ No data in response')
      adverts.value = []
    }
  } catch (err) {
    console.error('❌ Failed to load adverts:', err)
    alert('Failed to load adverts: ' + err.message)
  }
}

const setQuickRange = (range) => {
  const now = new Date()
  
  switch (range) {
    case 'today':
      startDate.value = today.value
      endDate.value = today.value
      break
    
    case 'week':
      const startOfWeek = new Date(now)
      const day = startOfWeek.getDay()
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1)
      startOfWeek.setDate(diff)
      startDate.value = startOfWeek.toISOString().split('T')[0]
      endDate.value = today.value
      break
    
    case 'month':
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      startDate.value = startOfMonth.toISOString().split('T')[0]
      endDate.value = today.value
      break
  }
  
  loadAdverts()
}

const getTabCount = (tabId) => {
  if (tabId === 'all') return adverts.value.length
  
  return adverts.value.filter(advert => 
    advert.platformCategory === tabId
  ).length
}

const applyFilters = () => {
  // Filters are applied via computed property
}

const resetFilters = () => {
  activeTab.value = 'all'
  statusFilter.value = 'all'
  initializeDates()
  loadAdverts()
}

const canReview = (advert) => {
  return advert.status === 'pending_review'
}

const viewAdvert = (advert) => {
  router.push(`/dashboard/booking/edit/${advert.id}?mode=view`)
}

const handleReview = (advert) => {
  selectedAdvert.value = advert
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  selectedAdvert.value = null
}

const handleApprove = async (comment) => {
  try {
    const vgamsUser = JSON.parse(localStorage.getItem('vgams_user'))
    
    const response = await $fetch(`${API_BASE}/adverts/${selectedAdvert.value.id}/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        action: 'approve',
        comment: comment,
        reviewedBy: vgamsUser?.id
      }
    })
    //, 'x-vgams-user-id': vgamsUser?.id

    if (response.success) {
      alert('Advert approved successfully!')
      closeModal()
      loadAdverts()
    } else {
      throw new Error(response.message || 'Failed to approve')
    }
  } catch (error) {
    console.error('❌ Approval failed:', error)
    alert('Failed to approve advert: ' + error.message)
  }
}

const handleReject = async (reason) => {
  try {
    const vgamsUser = JSON.parse(localStorage.getItem('vgams_user'))
    
    const response = await $fetch(`${API_BASE}/adverts/${selectedAdvert.value.id}/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        action: 'reject',
        comment: reason,
        reviewedBy: vgamsUser?.id
      }
    })
    //,'x-vgams-user-id': vgamsUser?.id

    if (response.success) {
      alert('Advert rejected')
      closeModal()
      loadAdverts()
    } else {
      throw new Error(response.message || 'Failed to reject')
    }
  } catch (error) {
    console.error('❌ Rejection failed:', error)
    alert('Failed to reject advert: ' + error.message)
  }
}

const handleRequestChanges = async (comment) => {
  try {
    const vgamsUser = JSON.parse(localStorage.getItem('vgams_user'))
    
    const response = await $fetch(`${API_BASE}/adverts/${selectedAdvert.value.id}/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        action: 'request_changes',
        comment: comment,
        reviewedBy: vgamsUser?.id
      }
    })
    //,'x-vgams-user-id': vgamsUser?.id

    if (response.success) {
      alert('Changes requested')
      closeModal()
      loadAdverts()
    } else {
      throw new Error(response.message || 'Failed to request changes')
    }
  } catch (error) {
    console.error('❌ Request failed:', error)
    alert('Failed to request changes: ' + error.message)
  }
}

// Helper functions
const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return 'UGX 0'
  
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
    return ''
  }
}

const formatCategory = (category) => {
  const categoryMap = {
    'print': 'Print Media',
    'tv': 'Television',
    'radio': 'Radio',
    'digital': 'Digital',
    'outdoor': 'Outdoor',
    'other': 'Other'
  }
  return categoryMap[category] || category
}

const getStatusLabel = (status) => {
  const statusMap = {
    'draft': 'Draft',
    'pending_review': 'Pending Review',
    'editor_approved': 'Editor Approved',
    'manager_approved': 'Manager Approved',
    'editor_rejected': 'Rejected',
    'manager_rejected': 'Rejected'
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

// Lifecycle
onMounted(() => {
  initializeDates()
  loadAdverts()
})
</script>

<style scoped>
.review-page {
  width: 99%;
  padding-bottom: 30px;
}

/* HEADER */
.page-header {
  background: white;
  padding: 25px 30px;
  border-radius: 10px;
  margin-bottom: 30px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  width: 85%;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
  width: 85%;
}

.page-header h1 {
  color: #003366;
  margin-bottom: 8px;
  font-size: 1.8em;
  font-weight: 600;
}

.page-header p {
  color: #666;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 15px;
}

/* DATE FILTER */
.date-filter-card {
  background: white;
  padding: 20px 30px;
  border-radius: 10px;
  margin-bottom: 30px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  width: 85%;
}

.date-filter-card h3 {
  color: #003366;
  margin-bottom: 15px;
  font-size: 1.2em;
}

.date-controls {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.date-input-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.date-input-group label {
  font-size: 0.9em;
  font-weight: 500;
  color: #666;
}

.date-input-group input {
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 0.95em;
}

.date-input-group input:focus {
  outline: none;
  border-color: #0066CC;
  box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
}

.quick-buttons {
  display: flex;
  gap: 10px;
}

.btn-quick {
  padding: 8px 16px;
  border: 1px solid #0066CC;
  background: white;
  color: #0066CC;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.9em;
  transition: all 0.3s;
}

.btn-quick:hover {
  background: #0066CC;
  color: white;
}

/* STATS CARDS - FIXED CONTAINER */
.stats-container {
  margin-bottom: 30px;
  width: 85%;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  width:100%;
}

/* Ensure cards have proper width */
.stat-card {
  min-width: 0; /* Prevent overflow */
}

/* MAIN CONTENT */
.content-card {
  background: white;
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  width: 85%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 2px solid #F5F5F5;
}

.card-header h2 {
  color: #003366;
  margin: 0;
}

.result-count {
  color: #666;
  font-size: 0.9em;
}

/* TABS */
.tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  border-bottom: 2px solid #DDDDDD;
  flex-wrap: wrap;
}

.tab {
  padding: 12px 20px;
  cursor: pointer;
  border: none;
  background: none;
  color: #666;
  font-size: 0.95em;
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
  border-radius: 12px;
  font-size: 0.85em;
  font-weight: 600;
}

.tab.active .tab-count {
  background: rgba(227, 30, 36, 0.1);
  color: #E31E24;
}

/* STATUS FILTER */
.status-filter {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}

.status-filter label {
  font-weight: 500;
  color: #666;
}

.status-filter select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 0.95em;
}

/* LOADING STATE */
.loading-state {
  text-align: center;
  padding: 60px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #0066CC;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* ERROR STATE */
.error-state {
  text-align: center;
  padding: 60px;
  color: #dc3545;
}

.error-icon {
  font-size: 3em;
  margin-bottom: 15px;
}

/* ADVERTS CONTAINER */
.adverts-container {
  width: 100%;
  overflow-x: auto;
  border-radius: 8px;
}

/* TABLE SLOT STYLES */
.ref-number {
  font-family: monospace;
  font-weight: 600;
  color: #003366;
  background: #f0f7ff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.9em;
}

.client-info {
  min-width: 150px;
}

.client-name {
  font-weight: 500;
  color: #333;
  margin-bottom: 3px;
}

.client-contact {
  font-size: 0.85em;
  color: #666;
}

.platform-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.platform-name {
  font-weight: 500;
  color: #333;
}

.platform-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.8em;
  font-weight: 500;
  width: fit-content;
}

.badge-print { background: rgba(0, 102, 204, 0.1); color: #0066CC; }
.badge-tv { background: rgba(142, 68, 173, 0.1); color: #8E44AD; }
.badge-radio { background: rgba(230, 126, 34, 0.1); color: #E67E22; }
.badge-digital { background: rgba(46, 204, 113, 0.1); color: #2ECC71; }
.badge-other { background: rgba(108, 117, 125, 0.1); color: #6c757d; }

strong {
  color: #28a745;
  font-size: 1em;
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.85em;
  font-weight: 500;
  text-transform: capitalize;
}

.badge-draft {
  background-color: rgba(108, 117, 125, 0.15);
  color: #6c757d;
  border: 1px solid rgba(108, 117, 125, 0.3);
}

.badge-pending {
  background-color: rgba(255, 193, 7, 0.15);
  color: #856404;
  border: 1px solid rgba(255, 193, 7, 0.3);
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

.date-info {
  font-size: 0.9em;
}

.date {
  color: #333;
  margin-bottom: 2px;
}

.time {
  color: #666;
  font-size: 0.9em;
}

.table-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* BUTTONS */
.btn {
  padding: 10px 20px;
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

.btn-sm {
  padding: 6px 12px;
  font-size: 0.85em;
}

.btn-primary {
  background: #0066CC;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #0052a3;
}

.btn-success {
  background: #28a745;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #218838;
}

.btn-refresh {
  background: #6c757d;
  color: white;
}

.btn-refresh:hover:not(:disabled) {
  background: #5a6268;
}

/* EMPTY STATE */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #666;
  border: 2px dashed #dee2e6;
  border-radius: 8px;
}

.empty-icon {
  font-size: 3em;
  margin-bottom: 15px;
  opacity: 0.5;
}

.empty-state h3 {
  color: #333;
  margin-bottom: 10px;
}

.empty-state p {
  margin-bottom: 20px;
}

/* RESPONSIVE */
@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .page-header,
  .date-filter-card,
  .content-card {
    padding: 20px;
  }
  
  .header-content {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .date-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .tabs {
    overflow-x: auto;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .table-actions {
    flex-direction: column;
    gap: 5px;
  }
  
  .btn-sm {
    width: 100%;
    text-align: center;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    gap: 15px;
  }
  
  .stat-card {
    padding: 15px;
  }
}
</style>