<!--pages/dashboard/design/index.vue-->
<template>
  <div class="dh-page">

    <!-- ── HEADER BAR ── -->
    <div class="hd-bar">
      <div class="hd-left">
        <div class="hd-title">Design House</div>
        <div class="hd-sub">Advert creative materials &amp; scheduling</div>
      </div>
      <div class="hd-right">
        <div class="hd-period">
          <label class="hd-label">From</label>
          <input type="date" v-model="startDate" :max="endDate" class="hd-input" @change="handleDateChange">
          <label class="hd-label">To</label>
          <input type="date" v-model="endDate" :min="startDate" :max="maxAllowedDate" class="hd-input" @change="handleDateChange">
        </div>
        <div class="hd-quick">
          <button v-for="r in quickRanges" :key="r.key" class="qr-btn" :class="{ 'qr-btn--active': activeQuickRange === r.key }" @click="setQuickDateRange(r.key)">{{ r.label }}</button>
        </div>
        <button class="hd-btn" @click="refreshData" :disabled="loading">
          <span v-if="loading">Loading…</span>
          <span v-else>Refresh</span>
        </button>
      </div>
    </div>

    <!-- ── PROCESS FLOW STRIP ── -->
    <div class="flow-strip">
      <div class="flow-step flow-step--blue">
        <div class="flow-num">{{ activeProjects }}</div>
        <div class="flow-lbl">Active Projects</div>
        <div class="flow-icon">&#9998;</div>
      </div>
      <div class="flow-arrow">&#9654;</div>
      <div class="flow-step flow-step--amber">
        <div class="flow-num">{{ filteredAdverts.filter(a => a.designStatus === 'pending').length }}</div>
        <div class="flow-lbl">Pending Design</div>
        <div class="flow-icon">&#9716;</div>
      </div>
      <div class="flow-arrow">&#9654;</div>
      <div class="flow-step flow-step--teal">
        <div class="flow-num">{{ completedDesigns }}</div>
        <div class="flow-lbl">Design Complete</div>
        <div class="flow-icon">&#10003;</div>
      </div>
      <div class="flow-arrow">&#9654;</div>
      <div class="flow-step flow-step--green">
        <div class="flow-num">{{ readyToSchedule }}</div>
        <div class="flow-lbl">Ready to Schedule</div>
        <div class="flow-icon">&#128197;</div>
      </div>
      <div class="flow-arrow">&#9654;</div>
      <div class="flow-step flow-step--gold">
        <div class="flow-num">{{ totalFiles }}</div>
        <div class="flow-lbl">Total Files</div>
        <div class="flow-icon">&#128196;</div>
      </div>
    </div>

    <!-- ── RIBBON: FILTERS ── -->
    <div class="ribbon">
      <div class="ribbon__tab-strip">
        <button class="tab-btn" :class="{ 'tab-btn--active': !statusFilter }" @click="statusFilter = ''; applyFilters()">All Adverts</button>
        <button class="tab-btn" :class="{ 'tab-btn--active': statusFilter === 'pending' }" @click="statusFilter = 'pending'; applyFilters()">Pending Design</button>
        <button class="tab-btn" :class="{ 'tab-btn--active': statusFilter === 'complete' }" @click="statusFilter = 'complete'; applyFilters()">Design Complete</button>
      </div>
      <div class="ribbon__filters">
        <div class="search-wrap">
          <svg class="search-icon" viewBox="0 0 16 16"><circle cx="6.5" cy="6.5" r="4.5" fill="none" stroke="currentColor" stroke-width="1.4"/><line x1="10.5" y1="10.5" x2="14" y2="14" stroke="currentColor" stroke-width="1.4"/></svg>
          <input v-model="searchQuery" type="text" class="xl-input xl-input--search" placeholder="Search client, reference, title…" @input="handleSearch">
        </div>
        <select v-model="platformFilter" class="xl-select" @change="applyFilters">
          <option value="">All Platforms</option>
          <option value="Print Media">Print Media</option>
          <option value="Television">Television</option>
          <option value="Radio">Radio</option>
          <option value="Digital">Digital</option>
        </select>
        <button class="ribbon-btn ribbon-btn--reset" @click="resetFilters">Reset</button>
        <div class="result-badge">
          {{ filteredAdverts.length }} adverts
          <span v-if="filteredAdverts.length !== adverts.length" class="result-filtered">(filtered from {{ adverts.length }})</span>
        </div>
      </div>
      <div v-if="hasActiveFilters" class="ribbon__chips">
        <span class="chip-lbl">Active filters:</span>
        <span v-if="searchQuery" class="xl-chip">Search: "{{ searchQuery }}" <button @click="clearSearch" class="chip-x">×</button></span>
        <span v-if="platformFilter" class="xl-chip">Platform: {{ platformFilter }} <button @click="clearPlatformFilter" class="chip-x">×</button></span>
        <span v-if="statusFilter" class="xl-chip">Status: {{ formatDesignStatus(statusFilter) }} <button @click="clearStatusFilter" class="chip-x">×</button></span>
      </div>
    </div>

    <!-- ── ERROR ── -->
    <div v-if="error" class="xl-error">
      <span class="xl-error__icon">&#9888;</span>
      <div>
        <div class="xl-error__title">Error Loading Designs</div>
        <div class="xl-error__msg">{{ error }}</div>
      </div>
      <button class="ribbon-btn ribbon-btn--reset" @click="refreshData">Retry</button>
    </div>

    <!-- ── MAIN TABLE SHEET ── -->
    <div class="xl-sheet">
      <div class="xl-sheet__head">
        <span class="xl-sheet__title">Approved Adverts for Design</span>
        <span class="xl-sheet__count">{{ filteredAdverts.length }} records</span>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="state-box">
        <div class="spinner"></div>
        <p>Loading adverts…</p>
      </div>

      <!-- Empty -->
      <div v-else-if="filteredAdverts.length === 0" class="state-box">
        <div class="state-box__icon">&#128197;</div>
        <div class="state-box__title">No Adverts Found</div>
        <p v-if="hasActiveFilters">No adverts match your filters</p>
        <p v-else>No adverts for the selected date range</p>
        <button class="ribbon-btn ribbon-btn--primary" @click="resetAllFilters">Reset All Filters</button>
      </div>

      <!-- Table -->
      <div v-else class="tbl-wrap">
        <DataTable
          :headers="tableHeaders"
          :items="filteredAdverts"
          :loading="loading"
          :page-size="10"
          :show-pagination="true"
        >
          <template #cell(reference)="{ item }">
            <div class="ref-cell">
              <span class="ref-chip">{{ item.reference }}</span>
              <span class="ref-date">{{ formatDate(item.startDate) }}</span>
            </div>
          </template>

          <template #cell(client)="{ item }">
            <div class="cell-stack">
              <span class="cell-main">{{ item.clientName }}</span>
              <span class="cell-sub">{{ item.advertTitle }}</span>
            </div>
          </template>

          <template #cell(platform)="{ item }">
            <div class="cell-stack">
              <span class="cell-main">{{ item.platform }}</span>
              <span v-if="item.category" class="plat-tag">{{ item.category }}</span>
            </div>
          </template>

          <template #cell(attachments)="{ item }">
            <div class="attach-cell" @click="viewAttachments(item)" :title="`View ${item.attachmentsCount || 0} files`">
              <span class="attach-count">&#128206; {{ item.attachmentsCount || 0 }} files</span>
              <span v-if="item.totalFileSize" class="attach-size">{{ item.totalFileSize }}</span>
            </div>
          </template>

          <template #cell(designStatus)="{ item }">
            <span :class="`xlbadge xlbadge--${item.designStatus}`">{{ formatDesignStatus(item.designStatus) }}</span>
          </template>

          <template #cell(deadline)="{ item }">
            <div class="cell-stack">
              <span class="cell-main">{{ formatDate(item.endDate) }}</span>
              <span v-if="isUrgent(item.endDate)" class="urgent-tag">&#9888; Urgent</span>
            </div>
          </template>

          <template #cell(actions)="{ item }">
            <div class="act-group">
              <button v-if="item.attachmentsCount > 0" class="act-btn act-btn--dl" @click="handleDownloadFiles(item)" title="Download all files">&#8659; DL</button>
              <button class="act-btn act-btn--sched" @click="openScheduleModal(item)" title="Schedule advert">&#128197; Schedule</button>
              <button v-if="item.hasBrief" class="act-btn act-btn--brief" @click="viewBrief(item)" title="View creative brief">&#128203; Brief</button>
              <button v-if="item.designStatus === 'pending'" class="act-btn act-btn--done" @click="handleMarkComplete(item)" title="Mark design as complete">&#10003; Complete</button>
            </div>
          </template>
        </DataTable>
      </div>

      <!-- Status bar -->
      <div class="status-bar">
        <div class="sb-left">
          <span class="sb-stat">Showing <strong>{{ filteredAdverts.length }}</strong> of <strong>{{ adverts.length }}</strong> adverts</span>
          <span class="sb-div">|</span>
          <span class="sb-stat">Pending: <strong class="sb-val--amber">{{ filteredAdverts.filter(a=>a.designStatus==='pending').length }}</strong></span>
          <span class="sb-div">|</span>
          <span class="sb-stat">Complete: <strong class="sb-val--green">{{ filteredAdverts.filter(a=>a.designStatus==='complete').length }}</strong></span>
        </div>
        <div class="sb-right">
          <span v-if="startDate && endDate" class="sb-range">&#128197; {{ formatDisplayDate(startDate) }} – {{ formatDisplayDate(endDate) }}</span>
        </div>
      </div>
    </div>

    <!-- ── RECENT UPLOADS ── -->
    <div v-if="recentUploads.length > 0" class="xl-sheet" style="margin-top:16px;">
      <div class="xl-sheet__head">
        <span class="xl-sheet__title">Recent Uploads</span>
        <span class="xl-sheet__count">
          {{ filteredRecentUploads.length }} recent
          <span v-if="filteredRecentUploads.length !== recentUploads.length">(filtered from {{ recentUploads.length }})</span>
        </span>
      </div>

      <div v-if="filteredRecentUploads.length > 0" class="uploads-tbl-wrap">
        <table class="xl-tbl">
          <thead>
            <tr>
              <th class="tc-ref">Reference</th>
              <th class="tc-client">Client</th>
              <th class="tc-title">Advert Title</th>
              <th class="tc-files">Files</th>
              <th class="tc-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="upload in filteredRecentUploads" :key="upload.id" class="xl-row">
              <td class="tc-ref">
                <div class="ref-cell">
                  <span class="ref-chip">{{ upload.reference }}</span>
                  <span class="ref-date">{{ formatDate(upload.startDate) }}</span>
                </div>
              </td>
              <td class="tc-client">{{ upload.clientName }}</td>
              <td class="tc-title"><span class="cell-sub">{{ upload.advertTitle }}</span></td>
              <td class="tc-files">
                <span class="attach-count">&#128206; {{ upload.attachmentsCount || 0 }} files</span>
                <span v-if="upload.totalFileSize" class="attach-size">&nbsp;({{ upload.totalFileSize }})</span>
              </td>
              <td class="tc-actions">
                <button class="act-btn act-btn--brief" @click="viewAttachments(upload)">&#128065; View Files</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="state-box" style="padding:30px;">
        <div class="state-box__icon">&#128193;</div>
        <div class="state-box__title">No Recent Uploads Match Search</div>
      </div>
    </div>

    <!-- ── FILES MODAL ── -->
    <div v-if="showFilesModal" class="modal-overlay" @click.self="closeFilesModal">
      <div class="xl-modal">
        <div class="xl-modal__head">
          <div>
            <div class="xl-modal__title">Attachments</div>
            <div class="xl-modal__ref">{{ selectedAdvert?.reference }}</div>
          </div>
          <button class="xl-modal__close" @click="closeFilesModal">×</button>
        </div>
        <div class="xl-modal__body">
          <FileList
            :files="selectedAdvert?.attachments || []"
            :loading="false"
            :show-delete="false"
            :show-stats="true"
            @preview="previewFile"
            @download="downloadFile"
          />
        </div>
        <div class="xl-modal__foot">
          <button class="act-btn act-btn--sched" @click="closeFilesModal">Close</button>
        </div>
      </div>
    </div>

    <!-- ── SCHEDULE MODAL ── -->
    <AdvertScheduler
      v-if="showScheduleModal"
      :advert="selectedAdvert"
      :show="showScheduleModal"
      @close="closeScheduleModal"
      @scheduled="handleScheduleComplete"
    />

    <!-- ── BRIEF MODAL ── -->
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
import AdvertScheduler from '~/components/design/AdvertScheduler.vue'
import BriefModal from '~/components/design/BriefModal.vue'
import FileList from '~/components/design/FileList.vue'
import { useDesign } from '~/composables/useDesign'
import { ref, computed, onMounted, watch } from 'vue'

// Composable
const { 
  adverts,
  recentUploads,
  activeProjects,
  readyToSchedule,
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
const showScheduleModal = ref(false)
const showBriefModal = ref(false)
const showFilesModal = ref(false)

// Date range state
const startDate = ref('')
const endDate = ref('')
const activeQuickRange = ref('')

const quickRanges = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'this_week', label: 'This Week' },
  { key: 'last_week', label: 'Last Week' },
  { key: 'this_month', label: 'This Month' },
]

const maxAllowedDate = computed(() => {
  const maxDate = new Date()
  maxDate.setFullYear(maxDate.getFullYear() + 2) // 2 years from now
  return maxDate.toISOString().split('T')[0]
});

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

const openScheduleModal = (advert) => {
  console.log('Opening schedule modal for:', advert)
  selectedAdvert.value = advert
  showScheduleModal.value = true
  console.log('showScheduleModal set to:', showScheduleModal.value)
}

const closeScheduleModal = () => {
  console.log('Closing schedule modal')
  showScheduleModal.value = false
  selectedAdvert.value = null
}

const handleScheduleComplete = async () => {
  console.log('Schedule completed')
  closeScheduleModal()
  // Reload data after successful scheduling
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
/* ── TOKENS ── */
:root {
  --navy:       #1F3864;
  --xl-hd-bg:   #DEEAF1;
  --xl-hd-txt:  #1F3864;
  --xl-hd-bd:   #9DC3E6;
  --xl-col-bd:  #BDD7EE;
  --xl-row-alt: #F7FBFE;
  --xl-row-hov: #EBF4FF;
  --page-bg:    #F2F2F2;
  --border:     #BFBFBF;
  --red:        #E31E24;
  --green-bg:   #E2EFDA;
  --green-txt:  #375623;
  --amber-bg:   #FFEB9C;
  --amber-txt:  #9C5700;
  --red-bg:     #FCE4D6;
  --red-txt:    #9C0006;
  --teal-bg:    #DDEBF7;
  --teal-txt:   #244F75;
}

.dh-page {
  width: 100%;
  padding-bottom: 40px;
  background: #F2F2F2;
  font-family: 'IBM Plex Sans', 'Segoe UI', sans-serif;
  font-size: 13px;
}

/* ── HEADER BAR ── */
.hd-bar {
  background: #1F3864;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  min-height: 56px;
  border-bottom: 3px solid #E31E24;
  margin-bottom: 0;
}
.hd-left { display: flex; flex-direction: column; gap: 1px; }
.hd-title { color: #fff; font-size: 15px; font-weight: 700; letter-spacing: .3px; }
.hd-sub   { color: #9DC3E6; font-size: 11px; }
.hd-right {
  display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
  padding: 8px 0;
}
.hd-period { display: flex; align-items: center; gap: 6px; }
.hd-label  { color: #9DC3E6; font-size: 11px; white-space: nowrap; }
.hd-input  {
  background: #162d52; color: #fff; border: 1px solid #4a6fa5;
  padding: 4px 8px; font-size: 12px; height: 28px;
  border-radius: 0; font-family: 'IBM Plex Mono', monospace;
}
.hd-input:focus { outline: none; border-color: #9DC3E6; }
.hd-quick { display: flex; gap: 4px; }
.qr-btn {
  background: #162d52; color: #9DC3E6; border: 1px solid #4a6fa5;
  padding: 3px 9px; font-size: 11px; cursor: pointer; border-radius: 0;
  transition: background .15s;
}
.qr-btn:hover      { background: #1e4080; color: #fff; }
.qr-btn--active    { background: #E31E24; color: #fff; border-color: #E31E24; }
.hd-btn {
  background: #E31E24; color: #fff; border: none;
  padding: 5px 14px; font-size: 12px; font-weight: 600; cursor: pointer;
  border-radius: 0; height: 28px;
}
.hd-btn:disabled { opacity: .6; cursor: not-allowed; }
.hd-btn:hover:not(:disabled) { background: #c01820; }

/* ── PROCESS FLOW STRIP ── */
.flow-strip {
  display: flex;
  align-items: center;
  background: #fff;
  border-bottom: 1px solid #BDD7EE;
  padding: 0 20px;
}
.flow-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 24px;
  position: relative;
  min-width: 110px;
  border-right: 1px solid #DEEAF1;
}
.flow-step:last-child { border-right: none; }
.flow-num  { font-size: 22px; font-weight: 700; font-family: 'IBM Plex Mono', monospace; line-height: 1; }
.flow-lbl  { font-size: 11px; color: #666; margin-top: 2px; white-space: nowrap; }
.flow-icon { font-size: 13px; margin-top: 2px; opacity: .5; }
.flow-step--blue  .flow-num { color: #1F3864; }
.flow-step--amber .flow-num { color: #9C5700; }
.flow-step--teal  .flow-num { color: #244F75; }
.flow-step--green .flow-num { color: #375623; }
.flow-step--gold  .flow-num { color: #7F6000; }
.flow-arrow { color: #BDD7EE; font-size: 14px; padding: 0 4px; flex-shrink: 0; }

/* ── RIBBON ── */
.ribbon {
  background: #fff;
  border-bottom: 1px solid #BDD7EE;
  margin-bottom: 16px;
}
.ribbon__tab-strip {
  display: flex;
  border-bottom: 1px solid #BDD7EE;
  padding: 0 20px;
}
.tab-btn {
  padding: 8px 18px;
  border: 1px solid transparent;
  border-bottom: none;
  background: #E8EEF4;
  color: #555;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  margin-right: 3px;
  margin-top: 6px;
  border-radius: 0;
  position: relative;
  bottom: -1px;
}
.tab-btn:hover       { background: #DEEAF1; color: #1F3864; }
.tab-btn--active     {
  background: #fff; color: #1F3864; font-weight: 700;
  border-color: #9DC3E6 #9DC3E6 #fff #9DC3E6;
}
.ribbon__filters {
  display: flex; align-items: center; gap: 10px; padding: 10px 20px;
  flex-wrap: wrap;
}
.search-wrap { position: relative; flex: 1 1 200px; max-width: 340px; }
.search-icon {
  position: absolute; left: 8px; top: 50%; transform: translateY(-50%);
  width: 14px; height: 14px; color: #999; pointer-events: none;
}
.xl-input {
  width: 100%; border: 1px solid #BDD7EE; padding: 5px 8px;
  font-size: 12px; border-radius: 0; background: #fff;
}
.xl-input--search { padding-left: 28px; }
.xl-input:focus, .xl-select:focus { outline: none; border-color: #9DC3E6; box-shadow: 0 0 0 2px rgba(157,195,230,.25); }
.xl-select {
  border: 1px solid #BDD7EE; padding: 5px 8px;
  font-size: 12px; border-radius: 0; background: #fff; min-width: 140px;
}
.ribbon-btn {
  padding: 5px 12px; border: none; font-size: 12px;
  cursor: pointer; border-radius: 0; font-weight: 500;
}
.ribbon-btn--reset   { background: #DEEAF1; color: #1F3864; border: 1px solid #9DC3E6; }
.ribbon-btn--reset:hover { background: #c5d9ec; }
.ribbon-btn--primary { background: #E31E24; color: #fff; }
.ribbon-btn--primary:hover { background: #c01820; }
.result-badge { margin-left: auto; font-size: 12px; color: #555; white-space: nowrap; }
.result-filtered { color: #999; font-size: 11px; }
.ribbon__chips {
  display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
  padding: 6px 20px 10px;
  border-top: 1px solid #DEEAF1;
}
.chip-lbl { color: #888; font-size: 11px; }
.xl-chip {
  display: inline-flex; align-items: center; gap: 4px;
  background: #DEEAF1; color: #1F3864; border: 1px solid #9DC3E6;
  padding: 2px 8px; font-size: 11px; border-radius: 0;
}
.chip-x {
  background: none; border: none; color: #666;
  cursor: pointer; font-size: 13px; padding: 0; line-height: 1;
}
.chip-x:hover { color: #E31E24; }

/* ── ERROR ── */
.xl-error {
  background: #FCE4D6; border: 1px solid #FF7043;
  display: flex; align-items: center; gap: 12px;
  padding: 12px 20px; margin-bottom: 16px;
}
.xl-error__icon  { font-size: 18px; color: #9C0006; }
.xl-error__title { font-weight: 600; color: #9C0006; font-size: 13px; }
.xl-error__msg   { font-size: 12px; color: #5D4037; }

/* ── SHEET ── */
.xl-sheet {
  background: #fff;
  border: 1px solid #BDD7EE;
}
.xl-sheet__head {
  background: #1F3864;
  color: #fff;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.xl-sheet__title { font-size: 13px; font-weight: 600; }
.xl-sheet__count { font-size: 11px; color: #9DC3E6; }

/* ── TABLE ── */
.tbl-wrap, .uploads-tbl-wrap { overflow-x: auto; }
.xl-tbl {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  min-width: 800px;
}
.xl-tbl thead tr { background: #DEEAF1; }
.xl-tbl thead th {
  color: #1F3864;
  font-weight: 600;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: .4px;
  padding: 8px 12px;
  border-bottom: 2px solid #9DC3E6;
  border-right: 1px solid #BDD7EE;
  text-align: left;
  white-space: nowrap;
}
.xl-tbl thead th:last-child { border-right: none; }
.xl-tbl tbody tr.xl-row { transition: background .1s; }
.xl-tbl tbody tr.xl-row:nth-child(even) { background: #F7FBFE; }
.xl-tbl tbody tr.xl-row:hover { background: #EBF4FF; }
.xl-tbl tbody td {
  padding: 8px 12px;
  border-bottom: 1px solid #DEEAF1;
  border-right: 1px solid #EBF4FF;
  vertical-align: middle;
}
.xl-tbl tbody td:last-child { border-right: none; }

/* also style DataTable deep cells the same way */
.tbl-wrap :deep(table) {
  border-collapse: collapse;
  width: 100%;
  font-size: 12px;
}
.tbl-wrap :deep(thead tr) { background: #1F3864; }
.tbl-wrap :deep(thead th) {
  color: #fff; font-weight: 600; font-size: 11px;
  text-transform: uppercase; letter-spacing: .4px;
  padding: 8px 12px;
  border-bottom: 2px solid #162d52;
  border-right: 1px solid #2e4f7a;
  text-align: left; white-space: nowrap;
}
.tbl-wrap :deep(thead th:last-child) { border-right: none; }
.tbl-wrap :deep(tbody tr:nth-child(even)) { background: #F7FBFE; }
.tbl-wrap :deep(tbody tr:hover) { background: #EBF4FF; }
.tbl-wrap :deep(tbody td) {
  padding: 8px 12px;
  border-bottom: 1px solid #DEEAF1;
  border-right: 1px solid #EBF4FF;
  vertical-align: middle;
  font-size: 12px;
}
.tbl-wrap :deep(tbody td:last-child) { border-right: none; }

/* ── CELL COMPONENTS ── */
.ref-cell   { display: flex; flex-direction: column; gap: 2px; }
.ref-chip   {
  display: inline-block;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 11px; font-weight: 700;
  color: #1F3864; background: #DEEAF1;
  border: 1px solid #9DC3E6;
  padding: 1px 7px;
}
.ref-date   { font-size: 10px; color: #888; }
.cell-stack { display: flex; flex-direction: column; gap: 2px; }
.cell-main  { font-weight: 500; color: #222; font-size: 12px; }
.cell-sub   { font-size: 11px; color: #888; }
.plat-tag   {
  display: inline-block; background: #DEEAF1; color: #1F3864;
  border: 1px solid #9DC3E6; padding: 1px 6px; font-size: 10px; font-weight: 600;
  width: fit-content;
}
.attach-cell {
  cursor: pointer; display: flex; flex-direction: column; gap: 2px;
  padding: 4px 8px;
  transition: background .15s;
}
.attach-cell:hover { background: #DEEAF1; }
.attach-count { font-size: 12px; font-weight: 500; color: #333; }
.attach-size  { font-size: 10px; color: #888; }

/* ── BADGES ── */
.xlbadge {
  display: inline-block;
  font-size: 10px; font-weight: 700;
  padding: 2px 9px;
  border: 1px solid transparent;
  text-transform: uppercase; letter-spacing: .3px;
}
.xlbadge--pending  { background: #FFEB9C; color: #9C5700; border-color: #FFCC00; }
.xlbadge--complete { background: #E2EFDA; color: #375623; border-color: #92D050; }
.urgent-tag {
  display: inline-block;
  background: #FCE4D6; color: #9C0006;
  border: 1px solid #FF7043;
  font-size: 10px; font-weight: 700;
  padding: 1px 6px;
}

/* ── ACTION BUTTONS ── */
.act-group { display: flex; gap: 4px; flex-wrap: wrap; align-items: center; }
.act-btn {
  display: inline-block;
  font-size: 11px; font-weight: 600;
  padding: 4px 9px;
  border: 1px solid transparent;
  cursor: pointer; border-radius: 0;
  white-space: nowrap;
  transition: opacity .15s;
}
.act-btn:disabled { opacity: .5; cursor: not-allowed; }
.act-btn--dl     { background: #DEEAF1; color: #1F3864; border-color: #9DC3E6; }
.act-btn--dl:hover { background: #c5d9ec; }
.act-btn--sched  { background: #1F3864; color: #fff; }
.act-btn--sched:hover { background: #162d52; }
.act-btn--brief  { background: #DDEBF7; color: #244F75; border-color: #9DC3E6; }
.act-btn--brief:hover { background: #c5d9ec; }
.act-btn--done   { background: #E2EFDA; color: #375623; border-color: #92D050; }
.act-btn--done:hover { background: #c8e3b4; }

/* ── STATUS BAR ── */
.status-bar {
  background: #DEEAF1;
  border-top: 1px solid #9DC3E6;
  padding: 6px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  color: #555;
}
.sb-left   { display: flex; align-items: center; gap: 10px; }
.sb-stat   { white-space: nowrap; }
.sb-div    { color: #9DC3E6; }
.sb-val--green { color: #375623; }
.sb-val--amber { color: #9C5700; }
.sb-right  { font-size: 11px; color: #1F3864; }
.sb-range  { font-weight: 500; }

/* ── STATE BOXES ── */
.state-box {
  text-align: center;
  padding: 60px 20px;
  background: #F9FBFD;
  border-top: 1px solid #DEEAF1;
}
.state-box__icon  { font-size: 36px; margin-bottom: 12px; opacity: .5; }
.state-box__title { font-size: 14px; font-weight: 600; color: #555; margin-bottom: 6px; }
.state-box p      { font-size: 12px; color: #999; margin: 0 0 16px; }
.spinner {
  width: 32px; height: 32px;
  border: 3px solid #DEEAF1; border-top-color: #1F3864;
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
  margin: 0 auto 14px;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── MODAL ── */
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,.62);
  display: flex; align-items: center; justify-content: center;
  z-index: 3000; padding: 20px;
}
.xl-modal {
  background: #fff;
  width: 100%; max-width: 640px;
  max-height: 88vh;
  display: flex; flex-direction: column;
  border-top: 4px solid #1F3864;
}
.xl-modal__head {
  background: #1F3864;
  padding: 14px 20px;
  display: flex; justify-content: space-between; align-items: flex-start;
}
.xl-modal__title { color: #fff; font-size: 14px; font-weight: 700; }
.xl-modal__ref   { color: #9DC3E6; font-size: 11px; font-family: 'IBM Plex Mono', monospace; margin-top: 2px; }
.xl-modal__close {
  background: none; border: none; color: #9DC3E6; font-size: 22px;
  cursor: pointer; line-height: 1; padding: 0;
}
.xl-modal__close:hover { color: #fff; }
.xl-modal__body { flex: 1; overflow-y: auto; padding: 20px; }
.xl-modal__foot {
  padding: 12px 20px;
  border-top: 1px solid #DEEAF1;
  display: flex; justify-content: flex-end;
  background: #F7FBFE;
}

/* ── COL WIDTHS ── */
.tc-ref     { width: 120px; }
.tc-client  { width: 160px; }
.tc-title   { }
.tc-files   { width: 140px; }
.tc-actions { width: 120px; }

@media (max-width: 768px) {
  .hd-bar   { flex-direction: column; align-items: flex-start; padding: 12px 16px; }
  .flow-strip { overflow-x: auto; }
  .flow-step  { min-width: 90px; padding: 10px 14px; }
  .ribbon__filters { flex-direction: column; align-items: stretch; }
  .search-wrap { max-width: 100%; }
  .xl-modal { max-width: 100%; }
}
</style>