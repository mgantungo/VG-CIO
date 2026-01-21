<!--pages/dashboard/design/index.vue-->
<template>
  <div class="design-page">
    <div class="page-header">
      <div class="header-content">
        <div>
          <h1>🎨 Design House</h1>
          <p>Access and manage advertising creative materials</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-refresh" @click="refreshData" :disabled="loading">
            <span v-if="loading">⏳ Loading...</span>
            <span v-else>🔄 Refresh</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Date Range Filter -->
    <div class="content-card date-range-card">
      <div class="card-header">
        <h2>Date Range Filter</h2>
      </div>
      
      <div class="date-range-controls">
        <div class="date-input-group">
          <label for="startDate">Start Date</label>
          <input 
            id="startDate"
            type="date" 
            v-model="startDate"
            class="date-input"
            :max="endDate || getTodayFormatted()"
            @change="handleDateChange"
          >
        </div>
        
        <div class="date-input-group">
          <label for="endDate">End Date</label>
          <input 
            id="endDate"
            type="date" 
            v-model="endDate"
            class="date-input"
            :min="startDate"
            :max="getTodayFormatted()"
            @change="handleDateChange"
          >
        </div>
        
        <div class="quick-date-buttons">
          <button 
            class="btn btn-secondary btn-sm"
            :class="{ active: activeQuickRange === 'today' }"
            @click="setQuickDateRange('today')"
          >
            Today
          </button>
          <button 
            class="btn btn-secondary btn-sm"
            :class="{ active: activeQuickRange === 'yesterday' }"
            @click="setQuickDateRange('yesterday')"
          >
            Yesterday
          </button>
          <button 
            class="btn btn-secondary btn-sm"
            :class="{ active: activeQuickRange === 'this_week' }"
            @click="setQuickDateRange('this_week')"
          >
            This Week
          </button>
          <button 
            class="btn btn-secondary btn-sm"
            :class="{ active: activeQuickRange === 'last_week' }"
            @click="setQuickDateRange('last_week')"
          >
            Last Week
          </button>
          <button 
            class="btn btn-secondary btn-sm"
            :class="{ active: activeQuickRange === 'this_month' }"
            @click="setQuickDateRange('this_month')"
          >
            This Month
          </button>
        </div>
        
        <div class="date-range-info">
          <span v-if="startDate && endDate">
            Showing adverts from {{ formatDisplayDate(startDate) }} to {{ formatDisplayDate(endDate) }}
          </span>
          <span v-else-if="startDate">
            Showing adverts from {{ formatDisplayDate(startDate) }} onwards
          </span>
          <span v-else>
            Showing all adverts
          </span>
        </div>
      </div>
    </div>

    <!-- Global Search and Filters -->
    <div class="content-card">
      <div class="card-header">
        <h2>Search & Filters</h2>
      </div>
      
      <div class="global-search-filter-bar">
        <input 
          v-model="searchQuery"
          type="text" 
          class="search-input" 
          placeholder="Search by client, reference, or advert title..."
          @input="handleSearch"
        >
        <select v-model="platformFilter" class="filter-select" @change="applyFilters">
          <option value="">All Platforms</option>
          <option value="Print Media">Print Media</option>
          <option value="Television">Television</option>
          <option value="Radio">Radio</option>
          <option value="Digital">Digital</option>
        </select>
        <select v-model="statusFilter" class="filter-select" @change="applyFilters">
          <option value="">All Status</option>
          <option value="pending">Pending Design</option>
          <option value="complete">Design Complete</option>
        </select>
        <button class="btn btn-secondary btn-sm" @click="resetFilters">
          Reset Filters
        </button>
        
        <div class="active-filters" v-if="hasActiveFilters">
          <span class="filter-label">Active Filters:</span>
          <span v-if="searchQuery" class="filter-badge">
            Search: "{{ searchQuery }}"
            <button @click="clearSearch" class="filter-remove">×</button>
          </span>
          <span v-if="platformFilter" class="filter-badge">
            Platform: {{ platformFilter }}
            <button @click="clearPlatformFilter" class="filter-remove">×</button>
          </span>
          <span v-if="statusFilter" class="filter-badge">
            Status: {{ formatDesignStatus(statusFilter) }}
            <button @click="clearStatusFilter" class="filter-remove">×</button>
          </span>
        </div>
      </div>
    </div>

    <div class="stats-grid">
      <StatCard 
        icon="🎨"
        :value="activeProjects"
        label="Active Projects"
        color="blue"
      />
      <StatCard 
        icon="📤"
        :value="readyToUpload"
        label="Ready to Upload"
        color="green"
      />
      <StatCard 
        icon="✅"
        :value="completedDesigns"
        label="Completed Designs"
        color="teal"
      />
      <StatCard 
        icon="📁"
        :value="totalFiles"
        label="Total Files"
        color="gold"
      />
    </div>

    <!-- Error State -->
    <div v-if="error" class="error-alert">
      <div class="error-icon">⚠️</div>
      <div class="error-content">
        <h3>Error Loading Designs</h3>
        <p>{{ error }}</p>
        <button class="btn btn-secondary" @click="refreshData">Try Again</button>
      </div>
    </div>

    <div class="content-card">
      <div class="card-header">
        <h2>Approved Adverts for Design</h2>
        <div class="result-count">
          {{ filteredAdverts.length }} adverts
          <span v-if="filteredAdverts.length !== adverts.length" class="filtered-count">
            (filtered from {{ adverts.length }})
          </span>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading adverts...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredAdverts.length === 0" class="empty-state">
        <div class="empty-icon">🎨</div>
        <h3>No Adverts Found</h3>
        <p v-if="hasActiveFilters">No adverts match your search criteria</p>
        <p v-else>No adverts available for the selected date range</p>
        <button class="btn btn-secondary" @click="resetAllFilters">
          Reset All Filters
        </button>
      </div>

      <!-- Adverts Table -->
      <div v-else class="table-container">
        <DataTable 
          :headers="tableHeaders"
          :items="filteredAdverts"
          :loading="loading"
          :page-size="10"
          :show-pagination="true"
        >
          <template #cell(reference)="{ item }">
            <div class="ref-info">
              <span class="ref-number">{{ item.reference }}</span>
              <span class="ref-date">{{ formatDate(item.startDate) }}</span>
            </div>
          </template>

          <template #cell(client)="{ item }">
            <div class="client-info">
              <div class="client-name">{{ item.clientName }}</div>
              <div class="advert-title">{{ item.advertTitle }}</div>
            </div>
          </template>

          <template #cell(platform)="{ item }">
            <div class="platform-info">
              <div class="platform-name">{{ item.platform }}</div>
              <span v-if="item.category" class="platform-category">{{ item.category }}</span>
            </div>
          </template>

          <template #cell(attachments)="{ item }">
            <div 
              class="attachments-info clickable"
              @click="viewAttachments(item)"
              :title="`View ${item.attachmentsCount || 0} files`"
            >
              <span class="attachment-count">📎 {{ item.attachmentsCount || 0 }} files</span>
              <span v-if="item.totalFileSize" class="file-size">({{ item.totalFileSize }})</span>
            </div>
          </template>
          
          <template #cell(designStatus)="{ item }">
            <span :class="`status-badge status-${item.designStatus}`">
              {{ formatDesignStatus(item.designStatus) }}
            </span>
          </template>

          <template #cell(deadline)="{ item }">
            <div class="deadline-info">
              <div class="deadline-date">{{ formatDate(item.endDate) }}</div>
              <div v-if="isUrgent(item.endDate)" class="urgent-badge">⚠️ Urgent</div>
            </div>
          </template>
          
          <template #cell(actions)="{ item }">
            <div class="action-buttons">
              <button 
                v-if="item.attachmentsCount > 0"
                class="btn btn-info btn-sm"
                @click="handleDownloadFiles(item)"
                title="Download all files"
              >
                📥 Download
              </button>
              <button 
                class="btn btn-success btn-sm"
                @click="openUploadModal(item)"
                title="Upload design files"
              >
                📤 Upload
              </button>
              <button 
                v-if="item.hasBrief"
                class="btn btn-warning btn-sm"
                @click="viewBrief(item)"
                title="View creative brief"
              >
                📋 Brief
              </button>
              <button 
                v-if="item.designStatus === 'pending'"
                class="btn btn-primary btn-sm"
                @click="handleMarkComplete(item)"
                title="Mark design as complete"
              >
                ✓ Complete
              </button>
            </div>
          </template>
        </DataTable>
      </div>
    </div>

    <!-- Recent Uploads Section -->
    <div v-if="recentUploads.length > 0" class="content-card">
      <div class="card-header">
        <h2>Recent Uploads</h2>
        <span class="result-count">
          {{ filteredRecentUploads.length }} recent
          <span v-if="filteredRecentUploads.length !== recentUploads.length" class="filtered-count">
            (filtered from {{ recentUploads.length }})
          </span>
        </span>
      </div>
      
      <div v-if="filteredRecentUploads.length > 0" class="recent-uploads-scroll-container">
        <div class="recent-uploads-grid">
          <div 
            v-for="upload in filteredRecentUploads" 
            :key="upload.id"
            class="upload-card"
          >
            <div class="upload-header">
              <span class="upload-ref">{{ upload.reference }}</span>
              <span class="upload-date">{{ formatDate(upload.startDate) }}</span>
            </div>
            <div class="upload-client">{{ upload.clientName }}</div>
            <div class="upload-title">{{ upload.advertTitle }}</div>
            <div class="upload-meta">
              <span>📎 {{ upload.attachmentsCount || 0 }} files</span>
              <span>{{ upload.totalFileSize }}</span>
            </div>
            <div class="upload-actions">
              <button 
                class="btn btn-sm btn-info"
                @click="viewAttachments(upload)"
              >
                View Files
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div v-if="filteredRecentUploads.length === 0" class="empty-recent-uploads">
        <div class="empty-icon">📁</div>
        <h4>No Recent Uploads Match Search</h4>
        <p>No recent uploads match your search criteria</p>
      </div>
    </div>

    <!-- Files Modal -->
    <div v-if="showFilesModal" class="modal-overlay" @click.self="closeFilesModal">
      <div class="files-modal">
        <div class="modal-header">
          <h2>Files for {{ selectedAdvert?.reference }}</h2>
          <button class="modal-close" @click="closeFilesModal">×</button>
        </div>
        
        <div class="modal-body">
          <FileList 
            :files="selectedAdvert?.attachments || []"
            :loading="false"
            :show-delete="false"
            :show-stats="true"
            @preview="previewFile"
            @download="downloadFile"
          />
        </div>
        
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeFilesModal">
            Close
          </button>
        </div>
      </div>
    </div>

    <!-- Upload Modal -->
    <UploadDesignModal 
      v-if="showUploadModal"
      :advert="selectedAdvert"
      @close="closeUploadModal"
      @uploaded="handleUploadComplete"
    />

    <!-- Brief Modal -->
    <BriefModal
      v-if="showBriefModal"
      :advert="selectedAdvert"
      @close="closeBriefModal"
    />
  </div>
</template>

<script setup>
import StatCard from '~/components/common/StatCard.vue'
import DataTable from '~/components/common/DataTable.vue'
import UploadDesignModal from '~/components/design/UploadDesign.vue'
import BriefModal from '~/components/design/BriefModal.vue'
import FileList from '~/components/design/FileList.vue'
import { useDesign } from '~/composables/useDesign'
import { ref, computed, onMounted, watch } from 'vue'

// Composable
const { 
  adverts,
  recentUploads,
  activeProjects,
  readyToUpload,
  completedDesigns,
  totalFiles,
  loading,
  error,
  loadDesigns,
  loadDesignStats,
  downloadFiles: downloadAllFiles,
  markDesignComplete,
  getTodayFormatted,
  getDateRange,
  formatDateForAPI
} = useDesign()

// Local state
const searchQuery = ref('')
const platformFilter = ref('')
const statusFilter = ref('')
const selectedAdvert = ref(null)
const showUploadModal = ref(false)
const showBriefModal = ref(false)
const showFilesModal = ref(false)

// Date range state
const startDate = ref('')
const endDate = ref('')
const activeQuickRange = ref('')

// Table configuration
const tableHeaders = [
  { key: 'reference', label: 'Reference' },
  { key: 'client', label: 'Client / Title' },
  { key: 'platform', label: 'Platform' },
  { key: 'attachments', label: 'Attachments' },
  { key: 'designStatus', label: 'Status' },
  { key: 'deadline', label: 'Deadline' },
  { key: 'actions', label: 'Actions' }
]

// Computed - check if filters are active
const hasActiveFilters = computed(() => {
  return searchQuery.value || platformFilter.value || statusFilter.value
})

// Helper function to filter adverts
const filterAdverts = (advertsList) => {
  let filtered = [...advertsList]
  
  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(advert => 
      advert.clientName?.toLowerCase().includes(query) ||
      advert.advertTitle?.toLowerCase().includes(query) ||
      advert.reference?.toLowerCase().includes(query)
    )
  }
  
  // Platform filter
  if (platformFilter.value) {
    filtered = filtered.filter(advert => 
      advert.platform === platformFilter.value
    )
  }

  // Status filter
  if (statusFilter.value) {
    filtered = filtered.filter(advert => 
      advert.designStatus === statusFilter.value
    )
  }
  
  return filtered
}

// Computed - filtered adverts for main table
const filteredAdverts = computed(() => {
  return filterAdverts(adverts.value)
})

// Computed - filtered recent uploads
const filteredRecentUploads = computed(() => {
  return filterAdverts(recentUploads.value)
})

// Lifecycle - load data on mount
onMounted(async () => {
  // Set default date range to today
  const today = getTodayFormatted()
  startDate.value = today
  endDate.value = today
  activeQuickRange.value = 'today'
  
  await loadData()
})

// Watch date range changes
watch([startDate, endDate], ([newStart, newEnd]) => {
  if (newStart || newEnd) {
    loadData()
  }
}, { immediate: false })

// Methods
const loadData = async () => {
  const params = {}
  
  if (startDate.value) {
    params.startDate = formatDateForAPI(startDate.value)
  }
  
  if (endDate.value) {
    params.endDate = formatDateForAPI(endDate.value)
  }
  
  await Promise.all([
    loadDesigns(params),
    loadDesignStats(params)
  ])
}

// View attachments method
const viewAttachments = (advert) => {
  selectedAdvert.value = advert
  showFilesModal.value = true
}

const closeFilesModal = () => {
  showFilesModal.value = false
  selectedAdvert.value = null
}

const previewFile = (file) => {
  if (file.url) {
    window.open(file.url, '_blank', 'noopener,noreferrer')
  } else {
    alert('File URL not available')
  }
}

const downloadFile = (file) => {
  if (file.url) {
    const link = document.createElement('a')
    link.href = file.url
    link.download = file.name || 'download'
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } else {
    alert('File URL not available')
  }
}

const refreshData = async () => {
  await loadData()
}

const handleSearch = () => {
  // Search is reactive via computed property
}

const applyFilters = () => {
  // Filters are reactive via computed property
}

const resetFilters = () => {
  searchQuery.value = ''
  platformFilter.value = ''
  statusFilter.value = ''
}

const clearSearch = () => {
  searchQuery.value = ''
}

const clearPlatformFilter = () => {
  platformFilter.value = ''
}

const clearStatusFilter = () => {
  statusFilter.value = ''
}

const resetAllFilters = () => {
  resetFilters()
  // Reset to today's date
  const today = getTodayFormatted()
  startDate.value = today
  endDate.value = today
  activeQuickRange.value = 'today'
  loadData()
}

const formatDesignStatus = (status) => {
  const statusMap = {
    'pending': 'Pending Design',
    'complete': 'Design Complete'
  }
  return statusMap[status] || status
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

const formatDisplayDate = (dateString) => {
  if (!dateString) return ''
  
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-UG', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  } catch (error) {
    return dateString
  }
}

const isUrgent = (endDate) => {
  if (!endDate) return false
  
  const end = new Date(endDate)
  const now = new Date()
  const daysUntil = Math.ceil((end - now) / (1000 * 60 * 60 * 24))
  
  return daysUntil <= 3 && daysUntil >= 0
}

const openUploadModal = (advert) => {
  selectedAdvert.value = advert
  showUploadModal.value = true
}

const closeUploadModal = () => {
  showUploadModal.value = false
  selectedAdvert.value = null
}

const handleUploadComplete = async () => {
  closeUploadModal()
  // Reload data after successful upload
  await refreshData()
}

const handleDownloadFiles = async (advert) => {
  try {
    if (advert.attachmentsCount === 1) {
      await downloadAllFiles(advert.id)
      alert(`✅ Started downloading file for ${advert.reference}`)
    } else if (advert.attachmentsCount > 1) {
      const confirmed = confirm(`Download ${advert.attachmentsCount} files for ${advert.reference}?\n\nFiles will be downloaded one by one. Please allow multiple downloads.`)
      
      if (confirmed) {
        await downloadAllFiles(advert.id)
      }
    } else {
      alert(`No files available for ${advert.reference}`)
    }
  } catch (err) {
    alert(`❌ Failed to download files: ${err.message}`)
  }
}

const viewBrief = (advert) => {
  selectedAdvert.value = advert
  showBriefModal.value = true
}

const closeBriefModal = () => {
  showBriefModal.value = false
  selectedAdvert.value = null
}

const handleMarkComplete = async (advert) => {
  const notes = prompt(`Mark design as complete for ${advert.reference}?\n\nAdd completion notes (optional):`)
  
  if (notes === null) return // User cancelled
  
  try {
    // Get designer email from localStorage
    const vgamsUser = JSON.parse(localStorage.getItem('vgams_user'))
    
    await markDesignComplete(advert.id, notes || '', vgamsUser?.email)
    alert(`✅ Design marked as complete for ${advert.reference}`)
    
    // Reload data
    await refreshData()
  } catch (err) {
    alert(`❌ Failed to mark complete: ${err.message}`)
  }
}

// Date range methods
const handleDateChange = () => {
  // Clear active quick range when manually changing dates
  activeQuickRange.value = ''
  loadData()
}

const setQuickDateRange = (range) => {
  activeQuickRange.value = range
  const dates = getDateRange(range)
  startDate.value = dates.startDate
  endDate.value = dates.endDate
}
</script>

<style scoped>
.design-page {
  width: 100%;
  padding-bottom: 30px;
}

/* HEADER */
.page-header {
  background: white;
  padding: 25px 30px;
  border-radius: 10px;
  margin-bottom: 30px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
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
  font-size: 0.95em;
}

.header-actions {
  display: flex;
  gap: 15px;
}

/* DATE RANGE CARD */
.date-range-card {
  margin-bottom: 30px;
}

.date-range-controls {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.date-input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.date-input-group label {
  font-weight: 500;
  color: #333;
  font-size: 0.95em;
}

.date-input {
  padding: 10px 15px;
  border: 1px solid #DDDDDD;
  border-radius: 5px;
  font-size: 0.95em;
  max-width: 200px;
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

.quick-date-buttons .btn-sm {
  padding: 6px 12px;
  font-size: 0.85em;
  background: #f0f7ff;
  color: #0066CC;
  border: 1px solid #b3d4ff;
}

.quick-date-buttons .btn-sm:hover {
  background: #e1f0ff;
}

.quick-date-buttons .btn-sm.active {
  background: #0066CC;
  color: white;
  border-color: #0066CC;
}

.date-range-info {
  padding: 10px 15px;
  background: #f0f7ff;
  border-radius: 5px;
  color: #0066CC;
  font-weight: 500;
  font-size: 0.95em;
}

/* Global Search & Filters */
.global-search-filter-bar {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.search-input {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #DDDDDD;
  border-radius: 5px;
  font-size: 1em;
}

.search-input:focus {
  outline: none;
  border-color: #0066CC;
  box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
}

.filter-select {
  padding: 12px 15px;
  border: 1px solid #DDDDDD;
  border-radius: 5px;
  background: white;
  font-size: 1em;
  min-width: 180px;
}

.filter-select:focus {
  outline: none;
  border-color: #0066CC;
}

/* Active Filters */
.active-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  padding: 10px 0;
  border-top: 1px solid #EEEEEE;
  margin-top: 10px;
}

.filter-label {
  color: #666;
  font-size: 0.9em;
  font-weight: 500;
}

.filter-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #f0f7ff;
  color: #0066CC;
  border-radius: 20px;
  font-size: 0.85em;
  font-weight: 500;
}

.filter-remove {
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  font-size: 1.2em;
  padding: 0;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s;
}

.filter-remove:hover {
  background: #ff6b6b;
  color: white;
}

/* Filtered Count */
.filtered-count {
  color: #999;
  font-size: 0.8em;
  font-weight: normal;
  margin-left: 5px;
}

/* STATS GRID */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

/* ERROR ALERT */
.error-alert {
  background: #fff5f5;
  border: 2px solid #feb2b2;
  border-radius: 10px;
  padding: 30px;
  margin-bottom: 30px;
  display: flex;
  align-items: center;
  gap: 20px;
}

.error-icon {
  font-size: 3em;
  color: #e53e3e;
}

.error-content h3 {
  color: #e53e3e;
  margin-bottom: 10px;
}

.error-content p {
  color: #742a2a;
  margin-bottom: 20px;
}

/* CONTENT CARD */
.content-card {
  background: white;
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  margin-bottom: 30px;
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
  font-size: 1.4em;
}

.result-count {
  color: #666;
  font-size: 0.9em;
  font-weight: 500;
}

/* Table Container for Horizontal Scroll */
.table-container {
  width: 100%;
  overflow-x: auto;
  border-radius: 8px;
  border: 1px solid #F5F5F5;
  background: white;
}

/* Ensure DataTable can be wider than container */
.table-container :deep(.data-table) {
  min-width: 1000px; /* Minimum width for table */
}

/* Responsive table cells */
.table-container :deep(.data-table td),
.table-container :deep(.data-table th) {
  white-space: nowrap;
  padding: 12px 16px;
}

/* Action buttons in table */
.table-container :deep(.action-buttons) {
  min-width: 250px;
  justify-content: flex-start;
}

/* Clickable attachments */
.attachments-info.clickable {
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 5px;
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.attachments-info.clickable:hover {
  background: #f0f7ff;
  transform: translateY(-1px);
}

.attachment-count {
  color: #333;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
}

.file-size {
  font-size: 0.85em;
  color: #666;
}

/* LOADING STATE */
.loading-state {
  text-align: center;
  padding: 60px 20px;
}

.spinner {
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

/* EMPTY STATE */
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

.empty-state h3 {
  color: #666;
  margin-bottom: 10px;
  font-weight: 500;
}

.empty-state p {
  color: #999;
  margin-bottom: 30px;
}

/* TABLE CELL STYLES */
.ref-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.ref-number {
  font-family: monospace;
  font-weight: 600;
  color: #003366;
  background: #f0f7ff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.9em;
}

.ref-date {
  font-size: 0.85em;
  color: #666;
}

.client-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.client-name {
  font-weight: 500;
  color: #333;
}

.advert-title {
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

.platform-category {
  display: inline-block;
  padding: 2px 8px;
  background: rgba(0, 102, 204, 0.1);
  color: #0066CC;
  border-radius: 12px;
  font-size: 0.8em;
  font-weight: 500;
  width: fit-content;
}

.deadline-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.deadline-date {
  color: #333;
  font-weight: 500;
}

.urgent-badge {
  display: inline-block;
  padding: 2px 8px;
  background: #fff5f5;
  color: #e53e3e;
  border-radius: 12px;
  font-size: 0.75em;
  font-weight: 600;
  width: fit-content;
}

.status-badge {
  display: inline-block;
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 0.85em;
  font-weight: 600;
  text-transform: capitalize;
}

.status-pending {
  background: #ffeaa7;
  color: #636e72;
}

.status-complete {
  background: #55efc4;
  color: #00b894;
}

.action-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* Recent Uploads Horizontal Scroll */
.recent-uploads-scroll-container {
  width: 100%;
  overflow-x: auto;
  padding-bottom: 10px;
  margin-bottom: 20px;
}

.recent-uploads-grid {
  display: flex;
  gap: 20px;
  padding: 10px 5px;
  min-width: min-content; /* Allow grid to be wider than container */
}

.upload-card {
  flex: 0 0 280px; /* Fixed width cards */
  background: #F9F9F9;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #EEEEEE;
  transition: all 0.3s;
  min-height: 180px;
  display: flex;
  flex-direction: column;
}

.upload-card:hover {
  border-color: #0066CC;
  box-shadow: 0 2px 8px rgba(0, 102, 204, 0.1);
}

.upload-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.upload-ref {
  font-family: monospace;
  font-weight: 600;
  color: #003366;
  font-size: 0.9em;
}

.upload-date {
  font-size: 0.8em;
  color: #666;
}

.upload-client {
  font-weight: 600;
  color: #333;
  margin-bottom: 5px;
}

.upload-title {
  color: #666;
  font-size: 0.9em;
  margin-bottom: 15px;
}

.upload-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85em;
  color: #666;
  margin-bottom: 15px;
  padding-top: 15px;
  border-top: 1px solid #E5E5E5;
}

.upload-actions {
  display: flex;
  gap: 8px;
  margin-top: auto;
}

/* Hide scrollbar for Chrome, Safari and Opera */
.recent-uploads-scroll-container::-webkit-scrollbar {
  height: 8px;
}

.recent-uploads-scroll-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.recent-uploads-scroll-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.recent-uploads-scroll-container::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* Hide scrollbar for IE, Edge and Firefox */
.recent-uploads-scroll-container {
  scrollbar-width: thin;
  scrollbar-color: #c1c1c1 #f1f1f1;
}

/* Empty Recent Uploads */
.empty-recent-uploads {
  text-align: center;
  padding: 40px 20px;
  background: #F9F9F9;
  border-radius: 8px;
  border: 2px dashed #DDDDDD;
  margin-top: 20px;
}

.empty-recent-uploads .empty-icon {
  font-size: 2.5em;
  color: #0066CC;
  margin-bottom: 15px;
}

.empty-recent-uploads h4 {
  color: #666;
  margin-bottom: 10px;
  font-weight: 500;
}

.empty-recent-uploads p {
  color: #999;
  margin-bottom: 0;
}

/* Files Modal */
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
  animation: fadeIn 0.3s ease;
}

.files-modal {
  background: white;
  border-radius: 10px;
  width: 100%;
  max-width: 900px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease;
}

.files-modal .modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 25px 30px;
  border-bottom: 2px solid #F5F5F5;
}

.files-modal .modal-header h2 {
  color: #003366;
  margin: 0;
  font-size: 1.5em;
}

.files-modal .modal-close {
  background: none;
  border: none;
  font-size: 1.8em;
  color: #999;
  cursor: pointer;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s;
}

.files-modal .modal-close:hover {
  background: #F5F5F5;
  color: #E31E24;
}

.files-modal .modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 30px;
}

.files-modal .modal-footer {
  padding: 20px 30px;
  border-top: 2px solid #F5F5F5;
  display: flex;
  justify-content: flex-end;
  gap: 15px;
}

/* Ensure FileList component is scrollable */
.files-modal .modal-body :deep(.file-list) {
  min-width: 600px;
}

.files-modal .modal-body :deep(.files-container) {
  min-width: 600px;
}

/* Scrollbar styling for modal */
.files-modal .modal-body::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.files-modal .modal-body::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.files-modal .modal-body::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.files-modal .modal-body::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* BUTTONS */
.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.95em;
  font-weight: 500;
  transition: all 0.3s;
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
  transform: translateY(-1px);
}

.btn-secondary {
  background: #0066CC;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #0052a3;
  transform: translateY(-1px);
}

.btn-info {
  background: #17a2b8;
  color: white;
}

.btn-info:hover {
  background: #138496;
}

.btn-success {
  background: #28a745;
  color: white;
}

.btn-success:hover {
  background: #218838;
}

.btn-warning {
  background: #ffc107;
  color: #333333;
}

.btn-warning:hover {
  background: #e0a800;
}

.btn-refresh {
  background: #6c757d;
  color: white;
}

.btn-refresh:hover:not(:disabled) {
  background: #5a6268;
}

/* Animations */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { 
    transform: translateY(20px); 
    opacity: 0; 
  }
  to { 
    transform: translateY(0); 
    opacity: 1; 
  }
}

/* RESPONSIVE */
@media (max-width: 768px) {
  .page-header,
  .content-card {
    padding: 20px;
  }
  
  .header-content {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .date-range-controls {
    gap: 15px;
  }
  
  .date-input {
    max-width: 100%;
  }
  
  .quick-date-buttons {
    justify-content: center;
  }
  
  .global-search-filter-bar {
    flex-direction: column;
  }
  
  .search-input,
  .filter-select {
    width: 100%;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .action-buttons {
    flex-direction: column;
    gap: 5px;
  }
  
  .btn-sm {
    width: 100%;
    text-align: center;
  }
  
  .table-container {
    margin: 0 -20px;
    width: calc(100% + 40px);
    border-left: none;
    border-right: none;
    border-radius: 0;
  }
  
  .table-container :deep(.data-table) {
    min-width: 800px;
  }
  
  .recent-uploads-scroll-container {
    margin: 0 -20px;
    width: calc(100% + 40px);
    padding-left: 20px;
    padding-right: 20px;
  }
  
  .upload-card {
    flex: 0 0 260px;
  }
  
  .files-modal {
    max-width: 100%;
    max-height: 90vh;
  }
  
  .files-modal .modal-header,
  .files-modal .modal-body,
  .files-modal .modal-footer {
    padding: 20px;
  }
  
  .files-modal .modal-body :deep(.file-list),
  .files-modal .modal-body :deep(.files-container) {
    min-width: 400px;
  }
  
  .active-filters {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .filter-badge {
    width: 100%;
    justify-content: space-between;
  }
}

/* Desktop layout for date inputs */
@media (min-width: 769px) {
  .date-range-controls {
    display: grid;
    grid-template-columns: auto auto 1fr;
    gap: 20px;
    align-items: end;
  }
  
  .quick-date-buttons {
    grid-column: 1 / span 3;
  }
  
  .date-range-info {
    grid-column: 1 / span 3;
  }
  
  .global-search-filter-bar {
    display: grid;
    grid-template-columns: 1fr auto auto auto;
    gap: 15px;
    align-items: center;
  }
  
  .active-filters {
    grid-column: 1 / span 4;
  }
}

/* For very small screens */
@media (max-width: 480px) {
  .table-container :deep(.data-table) {
    min-width: 700px;
  }
  
  .upload-card {
    flex: 0 0 240px;
  }
}
</style>