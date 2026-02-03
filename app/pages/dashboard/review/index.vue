<template>
  <div class="schedule-review-page">
    <div class="page-header">
      <h1>Schedule Review & Page Management</h1>
      <p>Review scheduled adverts and manage page assignments</p>
    </div>
    <!----

    <div class="stats-grid">
      <StatCard 
        icon="📅"
        :value="todaySchedulesCount"
        label="Scheduled Today"
        color="blue"
      />
      <StatCard 
        icon="📰"
        :value="totalPagesAssigned"
        label="Pages Assigned"
        color="green"
      />
      <StatCard 
        icon="✅"
        :value="publishedCount"
        label="Published"
        color="purple"
      />
      <StatCard 
        icon="⏳"
        :value="pendingPublishCount"
        label="Pending Publish"
        color="gold"
      />
    </div>

     -->

    <div class="filters-card">
      <div class="filter-row">
        <div class="filter-group">
          <label>Date Range:</label>
          <input type="date" v-model="filters.startDate" />
          <span>to</span>
          <input type="date" v-model="filters.endDate" />
        </div>
        
        <div class="filter-group">
          <label>Status:</label>
          <select v-model="filters.isPublished">
            <option value="">All</option>
            <option value="true">Published</option>
            <option value="false">Not Published</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label>Client:</label>
          <select v-model="filters.clientId">
            <option value="">All Clients</option>
            <option v-for="client in clients" :key="client.id" :value="client.id">
              {{ client.company_name }}
            </option>
          </select>
        </div>
        
        <button class="btn btn-primary" @click="applyFilters">
          <span v-if="loading">Loading...</span>
          <span v-else>Apply Filters</span>
        </button>
        
        <button class="btn btn-secondary" @click="resetFilters" :disabled="loading">
          Reset
        </button>
      </div>
    </div>

    <div class="content-card">
      <div class="card-header">
        <h2>Scheduled Adverts</h2>
        <div class="header-actions">
          <button class="btn btn-info" @click="exportToCSV" :disabled="schedules.length === 0">
            📊 Export CSV
          </button>
          <button class="btn btn-success" @click="openBulkPageUpdate" :disabled="schedules.length === 0">
            📋 Bulk Page Update
          </button>
        </div>
      </div>

      <div class="tabs">
        <button 
          v-for="tab in tabs"
          :key="tab.id"
          class="tab"
          :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </div>

      <ScheduleReviewQueue 
        :schedules="filteredSchedules"
        :loading="loading"
        @page-update="handlePageUpdate"
        @publish-toggle="handlePublishToggle"
        @view-details="handleViewDetails"
        @refresh="loadSchedules"
      />
    </div>

    <!-- Schedule Details Modal -->
    <ScheduleDetailsModal 
      v-if="selectedSchedule"
      :schedule="selectedSchedule"
      :show="showDetailsModal"
      @close="closeDetailsModal"
      @page-update="handlePageUpdate"
      @publish-toggle="handlePublishToggle"
    />

    <!-- Bulk Page Update Modal -->
    <BulkPageUpdateModal 
      v-if="showBulkUpdateModal"
      :schedules="schedules"
      :show="showBulkUpdateModal"
      @save="handleBulkPageUpdate"
      @close="closeBulkUpdateModal"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import StatCard from '~/components/common/StatCard.vue'
import ScheduleReviewQueue from '~/components/editor/ScheduleReviewQueue.vue'
import ScheduleDetailsModal from '~/components/editor/ScheduleDetailsModal.vue'
import BulkPageUpdateModal from '~/components/editor/BulkPageUpdateModal.vue'
import { useAdverts } from '~/composables/useAdverts'

/**
 * Key Features of the Implementation:
Complete Schedule Management: View, update, and manage advert daily schedules

Page Assignment: Individual and bulk page assignment capabilities

Publish Control: Toggle publish status for schedules

Filtering: Filter by date range, client, and publish status

Media Preview: View attached media files

Export Functionality: Export schedules to CSV

Bulk Operations: Mass update pages for efficiency

Detailed Views: Comprehensive schedule details modal

Statistics Dashboard: Real-time statistics on schedules

Files Structure:
text
components/editor/
├── ScheduleReviewQueue.vue    # Main schedule list with inline editing
├── ScheduleDetailsModal.vue   # Detailed view modal
├── BulkPageUpdateModal.vue    # Bulk page update modal
└── StatCard.vue              # Reusable stat card component
The implementation provides a complete solution for managing advert daily schedules with page assignments, media management, and publish controls, all integrated with your existing Strapi backend.
 */

const tabs = [
  { id: 'all', label: 'All Schedules' },
  { id: 'today', label: 'Today' },
  { id: 'published', label: 'Published' },
  { id: 'unpublished', label: 'Unpublished' },
  { id: 'no_page', label: 'No Page Assigned' }
]

const activeTab = ref('all')
const selectedSchedule = ref(null)
const showDetailsModal = ref(false)
const showBulkUpdateModal = ref(false)

// Filters
const filters = ref({
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date().toISOString().split('T')[0],
  isPublished: '',
  clientId: ''
})

const { 
  getFullSchedules,
  updateSchedulePage,
  bulkUpdateSchedulePages,
  toggleSchedulePublish,
  loading,
  error
} = useAdverts()

const schedules = ref([])
const clients = ref([])
const todaySchedulesCount = ref(0)
const totalPagesAssigned = ref(0)
const publishedCount = ref(0)
const pendingPublishCount = ref(0)

const filteredSchedules = computed(() => {
  let filtered = schedules.value
  
  switch (activeTab.value) {
    case 'today':
      const today = new Date().toISOString().split('T')[0]
      filtered = filtered.filter(s => s.run_date === today)
      break
    case 'published':
      filtered = filtered.filter(s => s.is_published)
      break
    case 'unpublished':
      filtered = filtered.filter(s => !s.is_published)
      break
    case 'no_page':
      filtered = filtered.filter(s => !s.page || s.page === 0)
      break
  }
  
  return filtered
})

onMounted(() => {
  loadSchedules()
})

const loadSchedules = async () => {
  try {
    const params = {}
    
    if (filters.value.startDate) params.startDate = filters.value.startDate
    if (filters.value.endDate) params.endDate = filters.value.endDate
    if (filters.value.isPublished !== '') params.isPublished = filters.value.isPublished
    if (filters.value.clientId) params.clientId = filters.value.clientId
    
    const response = await getFullSchedules(params)
    
    if (response.success) {
      schedules.value = response.data
      
      // Calculate statistics
      calculateStatistics()
      
      // Extract unique clients
      const clientMap = new Map()
      schedules.value.forEach(schedule => {
        if (schedule.client_id && schedule.company_name) {
          clientMap.set(schedule.client_id, {
            id: schedule.client_id,
            company_name: schedule.company_name,
            contact_person: schedule.contact_person
          })
        }
      })
      clients.value = Array.from(clientMap.values())
    }
  } catch (err) {
    console.error('Failed to load schedules:', err)
  }
}

const calculateStatistics = () => {
  const today = new Date().toISOString().split('T')[0]
  
  todaySchedulesCount.value = schedules.value.filter(s => s.run_date === today).length
  totalPagesAssigned.value = schedules.value.filter(s => s.page && s.page > 0).length
  publishedCount.value = schedules.value.filter(s => s.is_published).length
  pendingPublishCount.value = schedules.value.filter(s => !s.is_published).length
}

const applyFilters = () => {
  loadSchedules()
}

const resetFilters = () => {
  const today = new Date().toISOString().split('T')[0]
  filters.value = {
    startDate: today,
    endDate: today,
    isPublished: '',
    clientId: ''
  }
  loadSchedules()
}

const handlePageUpdate = async (scheduleId, page) => {
  try {
    await updateSchedulePage(scheduleId, page)
    
    // Update local state
    const index = schedules.value.findIndex(s => s.schedule_id === scheduleId)
    if (index !== -1) {
      schedules.value[index].page = page
      calculateStatistics()
    }
    
    alert('Page updated successfully!')
  } catch (err) {
    console.error('Failed to update page:', err)
    alert('Failed to update page')
  }
}

const handlePublishToggle = async (scheduleId, isPublished) => {
  try {
    await toggleSchedulePublish(scheduleId, isPublished)
    
    // Update local state
    const index = schedules.value.findIndex(s => s.schedule_id === scheduleId)
    if (index !== -1) {
      schedules.value[index].is_published = isPublished
      calculateStatistics()
    }
    
    alert(`Schedule ${isPublished ? 'published' : 'unpublished'} successfully!`)
  } catch (err) {
    console.error('Failed to toggle publish status:', err)
    alert('Failed to update publish status')
  }
}

const handleViewDetails = (schedule) => {
  selectedSchedule.value = schedule
  showDetailsModal.value = true
}

const closeDetailsModal = () => {
  showDetailsModal.value = false
  selectedSchedule.value = null
}

const openBulkPageUpdate = () => {
  showBulkUpdateModal.value = true
}

const closeBulkUpdateModal = () => {
  showBulkUpdateModal.value = false
}

const handleBulkPageUpdate = async (updates) => {
  try {
    await bulkUpdateSchedulePages(updates)
    
    // Update local state
    updates.forEach(update => {
      const index = schedules.value.findIndex(s => s.schedule_id === update.scheduleId)
      if (index !== -1) {
        schedules.value[index].page = update.page
      }
    })
    
    calculateStatistics()
    alert('Bulk page update completed successfully!')
    closeBulkUpdateModal()
  } catch (err) {
    console.error('Failed to bulk update pages:', err)
    alert('Failed to update pages')
  }
}

const exportToCSV = () => {
  const headers = [
    'Schedule ID',
    'Run Date',
    'Page',
    'Published',
    'Advert Title',
    'Client',
    'Contact Person',
    'Email',
    'Ad Size',
    'Ad Type',
    'Run Times'
  ]
  
  const data = schedules.value.map(schedule => [
    schedule.schedule_id,
    schedule.run_date,
    schedule.page || 'Not assigned',
    schedule.is_published ? 'Yes' : 'No',
    schedule.advert_title,
    schedule.company_name,
    schedule.contact_person || 'N/A',
    schedule.email || 'N/A',
    schedule.ad_size,
    schedule.ad_type,
    schedule.run_time ? schedule.run_time.join(', ') : 'N/A'
  ])
  
  const csvContent = [
    headers.join(','),
    ...data.map(row => row.join(','))
  ].join('\n')
  
  const blob = new Blob([csvContent], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `schedules_${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  window.URL.revokeObjectURL(url)
}


</script>

<style scoped>
.schedule-review-page {
  width: 100%;
}

.page-header {
  background: white;
  padding: 20px 30px;
  border-radius: 10px;
  margin-bottom: 30px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.page-header h1 {
  color: #003366;
  margin-bottom: 10px;
}

.page-header p {
  color: #666;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.filters-card {
  background: white;
  padding: 20px;
  border-radius: 10px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 15px;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.filter-group label {
  font-weight: 600;
  color: #333;
  min-width: 80px;
}

.filter-group input,
.filter-group select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 0.95em;
}

.filter-group input {
  width: 150px;
}

.filter-group select {
  min-width: 150px;
}

.content-card {
  background: white;
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
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
}

.header-actions {
  display: flex;
  gap: 10px;
}

.tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  border-bottom: 2px solid #DDDDDD;
}

.tab {
  padding: 12px 24px;
  cursor: pointer;
  border: none;
  background: none;
  color: #666;
  font-size: 1em;
  border-bottom: 3px solid transparent;
  transition: all 0.3s;
}

.tab:hover {
  color: #E31E24;
}

.tab.active {
  color: #E31E24;
  border-bottom-color: #E31E24;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1em;
  font-weight: 500;
  transition: all 0.3s;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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

.btn-info:hover:not(:disabled) {
  background: #138496;
  transform: translateY(-1px);
}

.btn-success {
  background: #28a745;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #218838;
  transform: translateY(-1px);
}
</style>