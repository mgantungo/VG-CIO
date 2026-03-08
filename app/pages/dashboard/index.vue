<!--pages/dashboard/index.vue-->
<template>
  <div class="db-page">

    <!-- ════════════════════════════════════════════════════
         FILTER PANEL
    ═════════════════════════════════════════════════════ -->
    <section class="filter-panel">
      <div class="filter-panel__head">
        <div class="filter-panel__title">
          <svg class="fp-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
          </svg>
          <span>Dashboard</span>
        </div>
        <button class="btn btn-refresh" @click="loadAdverts" :disabled="loading">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>
          <span>{{ loading ? 'Loading…' : 'Refresh' }}</span>
        </button>
      </div>

      <div class="filter-panel__body">
        <div class="fp-row">
          <div class="fp-field">
            <label class="fp-label">From</label>
            <input type="date" v-model="startDate" @change="loadAdverts" class="fp-input" :max="endDate">
          </div>
          <div class="fp-field">
            <label class="fp-label">To</label>
            <input type="date" v-model="endDate" @change="loadAdverts" class="fp-input" :min="startDate" :max="today">
          </div>
          <div class="fp-quick">
            <button class="qr-btn" @click="setQuickRange('today')">Today</button>
            <button class="qr-btn" @click="setQuickRange('week')">This Week</button>
            <button class="qr-btn" @click="setQuickRange('month')">This Month</button>
          </div>
        </div>
      </div>
    </section>

    <!-- ════════════════════════════════════════════════════
         STATS ROW
    ═════════════════════════════════════════════════════ -->
    <div class="stats-row">

      <div class="stat-card sc--blue">
        <span class="stat-card__label">Total Adverts</span>
        <span class="stat-card__value">{{ statistics.total }}</span>
      </div>

      <div class="stat-card sc--amber">
        <span class="stat-card__label">Pending Review</span>
        <span class="stat-card__value">{{ statistics.pendingReview }}</span>
      </div>

      <div class="stat-card sc--green">
        <span class="stat-card__label">Approved</span>
        <span class="stat-card__value">{{ statistics.approved }}</span>
      </div>

      <div class="stat-card sc--red">
        <span class="stat-card__label">Rejected</span>
        <span class="stat-card__value">{{ statistics.rejected }}</span>
      </div>

      <div class="stat-card sc--navy">
        <span class="stat-card__label">Total Revenue</span>
        <span class="stat-card__value stat-card__value--rev">{{ formatCurrency(statistics.totalRevenue) }}</span>
      </div>

      <div class="stat-card sc--gray">
        <span class="stat-card__label">Drafts</span>
        <span class="stat-card__value">{{ statistics.drafts }}</span>
      </div>

    </div>

    <!-- ════════════════════════════════════════════════════
         ADVERTS TABLE
    ═════════════════════════════════════════════════════ -->
    <section class="results-section">

      <!-- Controls: tabs + status filter -->
      <div class="controls-bar">
        <div class="tabs">
          <button
            v-for="tab in tabs" :key="tab.id"
            class="tab-btn"
            :class="{ active: activeTab === tab.id }"
            @click="activeTab = tab.id"
          >
            {{ tab.label }}
            <span class="tab-count" :class="{ active: activeTab === tab.id }">{{ getTabCount(tab.id) }}</span>
          </button>
        </div>

        <div class="controls-right">
          <label class="fp-label" style="white-space:nowrap">Status</label>
          <select v-model="statusFilter" @change="applyFilters" class="fp-input fp-select">
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="pending_review">Pending Review</option>
            <option value="editor_approved">Editor Approved</option>
            <option value="manager_approved">Manager Approved</option>
            <option value="editor_rejected">Rejected</option>
          </select>
        </div>
      </div>

      <!-- Summary strip -->
      <div class="summary-strip">
        <span class="ss-count">{{ filteredAdverts.length }}</span>
        <span class="ss-label">advert{{ filteredAdverts.length !== 1 ? 's' : '' }}</span>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="state-loading">
        <div class="spinner"></div>
        <p>Loading adverts…</p>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="state-error">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <h3>Failed to load</h3>
        <p>{{ error }}</p>
        <button class="btn btn-apply" @click="loadAdverts">Try Again</button>
      </div>

      <!-- Empty -->
      <div v-else-if="filteredAdverts.length === 0" class="state-empty">
        <svg viewBox="0 0 64 64" fill="none"><rect x="8" y="8" width="48" height="48" rx="2" stroke="#CBD5E1" stroke-width="3"/><line x1="20" y1="26" x2="44" y2="26" stroke="#CBD5E1" stroke-width="3" stroke-linecap="round"/><line x1="20" y1="34" x2="36" y2="34" stroke="#CBD5E1" stroke-width="3" stroke-linecap="round"/></svg>
        <h3>No adverts found</h3>
        <p>No adverts match the selected filters.</p>
        <button class="btn btn-reset" @click="resetFilters">Reset Filters</button>
      </div>

      <!-- Table via DataTable component -->
      <template v-else>
        <div class="tbl-outer">
          <DataTable
            :headers="tableHeaders"
            :items="filteredAdverts"
            :loading="loading"
            :page-size="10"
            :show-pagination="true"
          >
            <template #cell(reference)="{ item }">
              <code class="ref-chip">{{ item.reference }}</code>
            </template>

            <template #cell(client)="{ item }">
              <span class="c1">{{ item.clientName }}</span>
              <span class="c2">{{ item.contactPerson }}</span>
            </template>

            <template #cell(platform)="{ item }">
              <span class="c1">{{ item.productName }}</span>
              <span :class="'pcat pcat--' + item.platformCategory">{{ formatCategory(item.platformCategory) }}</span>
            </template>

            <template #cell(amount)="{ item }">
              <span class="amount-val">{{ formatCurrency(item.totalAmount) }}</span>
            </template>

            <template #cell(status)="{ item }">
              <span :class="'sbadge sbadge--' + getStatusClass(item.status)">
                {{ getStatusLabel(item.status) }}
              </span>
            </template>

            <template #cell(created)="{ item }">
              <span class="c1">{{ formatDate(item.createdAt) }}</span>
              <span class="c2">{{ formatTime(item.createdAt) }}</span>
            </template>

            <template #cell(actions)="{ item }">
              <div class="act-group">
                <div class="act-wrap">
                  <button class="act-btn act-view" @click="viewAdvert(item)" aria-label="View">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                  </button>
                  <span class="act-tip">View</span>
                </div>
                <div v-if="canReview(item)" class="act-wrap">
                  <button class="act-btn act-review" @click="handleReview(item)" aria-label="Review">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  </button>
                  <span class="act-tip">Review</span>
                </div>
              </div>
            </template>
          </DataTable>
        </div>
      </template>

    </section>

    <!-- Review Modal (unchanged) -->
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
/* ══════════════════════════════════════════════════════════════════════════════
   TOKENS
══════════════════════════════════════════════════════════════════════════════ */
.db-page {
  --navy:       #003366;
  --navy-light: #004080;
  --red:        #E31E24;
  --blue:       #0066CC;
  --blue-lt:    #EEF4FF;

  --surface:    #FFFFFF;
  --page-bg:    #F0F4F8;
  --border:     #D1D9E0;
  --border-lt:  #E8ECF0;

  --text-1:     #0F172A;
  --text-2:     #334155;
  --text-3:     #64748B;
  --text-4:     #94A3B8;

  --green-text: #166534; --green-bg: #F0FDF4; --green-bd: #86EFAC;
  --red-text:   #991B1B; --red-bg:   #FEF2F2; --red-bd:   #FECACA;
  --amber-text: #78350F; --amber-bg: #FFFBEB; --amber-bd: #FCD34D;
  --gray-text:  #374151; --gray-bg:  #F1F5F9; --gray-bd:  #CBD5E1;

  --ring:       0 0 0 3px rgba(0,102,204,.15);
  --shadow-sm:  0 1px 3px rgba(0,0,0,.07), 0 1px 2px rgba(0,0,0,.04);
  --shadow-md:  0 4px 16px rgba(0,0,0,.08), 0 2px 6px rgba(0,0,0,.04);

  --t:    140ms ease;
  --font: "IBM Plex Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@600&display=swap');

.db-page {
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
   FILTER PANEL
══════════════════════════════════════════════════════════════════════════════ */
.filter-panel {
  margin: 16px 16px 0;
  background: var(--surface);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border-lt);
}

.filter-panel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: var(--navy);
}

.filter-panel__title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
  font-weight: 700;
  color: #fff;
}

.fp-icon { width: 18px; height: 18px; stroke: #fff; flex-shrink: 0; }

.filter-panel__body { padding: 18px 24px; }

.fp-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-end;
}

.fp-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 130px;
  flex: 0 0 auto;
}

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
  font-family: var(--font);
  font-size: 13px;
  color: var(--text-1);
  background: var(--surface);
  transition: border-color var(--t), box-shadow var(--t);
  outline: none;
  border-radius: 1px;
}
.fp-input:focus { border-color: var(--blue); box-shadow: var(--ring); }
.fp-select { cursor: pointer; }

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

@media (max-width: 640px) {
  .filter-panel { margin: 8px 8px 0; }
  .filter-panel__head { padding: 14px 16px; flex-wrap: wrap; gap: 10px; }
  .filter-panel__body { padding: 14px 16px; }
  .fp-row { flex-direction: column; align-items: stretch; }
  .fp-field { min-width: unset; }
}

/* ══════════════════════════════════════════════════════════════════════════════
   BUTTONS
══════════════════════════════════════════════════════════════════════════════ */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 36px;
  padding: 0 16px;
  border: none;
  border-radius: 1px;
  font-family: var(--font);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: background var(--t), box-shadow var(--t), transform var(--t), opacity var(--t);
  outline: none;
}
.btn svg { width: 14px; height: 14px; flex-shrink: 0; }
.btn:disabled { opacity: .45; cursor: not-allowed; }
.btn:active:not(:disabled) { transform: scale(.97); }

.btn-refresh { background: rgba(255,255,255,.12); color: #fff; border: 1px solid rgba(255,255,255,.25); }
.btn-refresh:hover:not(:disabled) { background: rgba(255,255,255,.22); }

.btn-apply  { background: var(--red); color: #fff; }
.btn-apply:hover:not(:disabled) { background: #C0181E; }

.btn-reset  { background: var(--blue-lt); color: var(--blue); border: 1.5px solid rgba(0,102,204,.2); }
.btn-reset:hover:not(:disabled) { background: #dce9ff; }

/* ══════════════════════════════════════════════════════════════════════════════
   STATS ROW
══════════════════════════════════════════════════════════════════════════════ */
.stats-row {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  margin: 16px 16px 0;
  background: var(--surface);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-md);
  overflow: hidden;
}

@media (max-width: 1100px) { .stats-row { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 640px)  { .stats-row { grid-template-columns: repeat(2, 1fr); margin: 8px 8px 0; } }

.stat-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 20px 20px 16px;
  border-right: 1px solid var(--border-lt);
  border-top: 3px solid transparent;
  transition: background var(--t);
}
.stat-card:last-child { border-right: none; }
.stat-card:hover { background: #FAFBFC; }

.sc--blue  { border-top-color: var(--blue); }
.sc--amber { border-top-color: #F59E0B; }
.sc--green { border-top-color: #16A34A; }
.sc--red   { border-top-color: var(--red); }
.sc--navy  { border-top-color: var(--navy); }
.sc--gray  { border-top-color: #94A3B8; }

.stat-card__label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .06em;
  color: var(--text-4);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.stat-card__value {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-1);
  line-height: 1;
  white-space: nowrap;
}
.stat-card__value--rev {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-1);
  line-height: 1.4;
  white-space: normal;
  word-break: break-word;
}

/* ══════════════════════════════════════════════════════════════════════════════
   RESULTS SECTION
══════════════════════════════════════════════════════════════════════════════ */
.results-section {
  margin: 16px 16px 0;
  display: flex;
  flex-direction: column;
}

@media (max-width: 640px) { .results-section { margin: 8px 8px 0; } }

/* Controls bar */
.controls-bar {
  background: var(--surface);
  border: 1px solid var(--border-lt);
  border-bottom: none;
  display: flex;
  align-items: stretch;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0;
}

.tabs {
  display: flex;
  overflow-x: auto;
  scrollbar-width: none;
  border-bottom: 1px solid var(--border-lt);
  flex: 1;
}
.tabs::-webkit-scrollbar { display: none; }

.tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 44px;
  padding: 0 16px;
  border: none;
  background: none;
  font-family: var(--font);
  font-size: 13px;
  font-weight: 500;
  color: var(--text-3);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  white-space: nowrap;
  transition: color var(--t), border-color var(--t);
  margin-bottom: -1px;
}
.tab-btn:hover  { color: var(--text-1); }
.tab-btn.active { color: var(--red); border-bottom-color: var(--red); font-weight: 600; }

.tab-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  background: var(--page-bg);
  color: var(--text-3);
  border-radius: 1px;
  font-size: 11px;
  font-weight: 700;
  transition: background var(--t), color var(--t);
}
.tab-count.active { background: rgba(227,30,36,.1); color: var(--red); }

.controls-right {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 16px;
  border-left: 1px solid var(--border-lt);
  border-bottom: 1px solid var(--border-lt);
}

/* Summary strip */
.summary-strip {
  display: flex;
  align-items: baseline;
  gap: 5px;
  padding: 10px 20px;
  background: var(--surface);
  border: 1px solid var(--border-lt);
  border-bottom: none;
}

.ss-count { font-size: 20px; font-weight: 700; color: var(--navy); line-height: 1; }
.ss-label { font-size: 13px; color: var(--text-3); font-weight: 500; }

/* States */
.state-loading, .state-error, .state-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 64px 24px;
  background: var(--surface);
  border: 1px solid var(--border-lt);
  text-align: center;
  color: var(--text-3);
}
.state-error svg, .state-empty svg { width: 56px; height: 56px; opacity: .35; }
.state-error h3, .state-empty h3 { font-size: 15px; font-weight: 700; color: var(--text-2); margin: 0; }
.state-error h3 { color: var(--red-text); }
.state-error p, .state-empty p { font-size: 13px; margin: 0; max-width: 320px; }

.spinner {
  width: 36px; height: 36px;
  border: 3px solid var(--border-lt);
  border-top-color: var(--blue);
  border-radius: 50%;
  animation: spin .7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* DataTable outer wrapper — forces scroll within component */
.tbl-outer {
  background: var(--surface);
  border: 1px solid var(--border-lt);
  overflow: hidden;
}

/* ══════════════════════════════════════════════════════════════════════════════
   DATATABLE SLOT CONTENT ATOMS
   (these style the content we inject via slots — DataTable renders the shell)
══════════════════════════════════════════════════════════════════════════════ */
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

.c1 {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-1);
  line-height: 1.4;
  word-break: break-word;
}
.c2 {
  display: block;
  font-size: 11px;
  color: var(--text-4);
  line-height: 1.4;
  margin-top: 1px;
}

.amount-val {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-1);
  white-space: nowrap;
}

/* Platform category chips */
.pcat {
  display: inline-block;
  margin-top: 3px;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 1px;
  letter-spacing: .03em;
  white-space: nowrap;
}
.pcat--print   { background: var(--blue-lt);  color: var(--blue);      border: 1px solid rgba(0,102,204,.2); }
.pcat--tv      { background: #F5F3FF;          color: #5B21B6;          border: 1px solid #C4B5FD;            }
.pcat--radio   { background: #FFF7ED;          color: #C2410C;          border: 1px solid #FED7AA;            }
.pcat--digital { background: var(--green-bg);  color: var(--green-text);border: 1px solid var(--green-bd);   }
.pcat--other   { background: var(--gray-bg);   color: var(--gray-text); border: 1px solid var(--gray-bd);    }

/* Status badges */
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
.sbadge--default  { background: var(--gray-bg);  color: var(--gray-text);  border: 1px solid var(--gray-bd);  }

/* Action icon buttons */
.act-group { display: flex; align-items: center; gap: 4px; }
.act-wrap  { position: relative; display: inline-flex; }

.act-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px; height: 30px;
  border: none;
  border-radius: 1px;
  cursor: pointer;
  transition: background var(--t), transform var(--t);
}
.act-btn svg { width: 15px; height: 15px; }
.act-btn:active { transform: scale(.92); }

.act-view   { background: #E0F2FE; color: #0369A1; }
.act-view:hover { background: #BAE6FD; }
.act-review { background: var(--green-bg); color: var(--green-text); border: 1px solid var(--green-bd); }
.act-review:hover { background: #DCFCE7; }

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
  border-radius: 1px;
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
</style>