<!--pages/dashboard/design/index.vue-->
<template>
  <div class="design-page">
    <div class="page-header">
      <h1>Design House</h1>
      <p>Access and manage advertising creative materials</p>
    </div>

    <div class="stats-grid">
      <StatCard 
        icon="🎨"
        :value="activeProjects"
        label="Active Projects"
        color="blue"
      />
      <StatCard 
        icon="✓"
        :value="readyToUpload"
        label="Ready to Upload"
        color="green"
      />
      <StatCard 
        icon="📁"
        :value="totalFiles"
        label="Total Files"
        color="gold"
      />
    </div>

    <div class="content-card">
      <div class="card-header">
        <h2>Approved Adverts for Design</h2>
        <button class="btn btn-primary" @click="openUploadModal">
          Upload New Design
        </button>
      </div>

      <div class="search-filter-bar">
        <input 
          v-model="searchQuery"
          type="text" 
          class="search-input" 
          placeholder="Search by client or advert title..."
        >
        <select v-model="platformFilter" class="filter-select">
          <option>All Platforms</option>
          <option>Print Media</option>
          <option>Television</option>
          <option>Radio</option>
          <option>Digital</option>
        </select>
        <button class="btn btn-secondary" @click="searchDesigns">
          Search
        </button>
      </div>

      <DataTable 
        :headers="tableHeaders"
        :items="filteredDesigns"
        :loading="loading"
      >
        <template #cell(attachments)="{ item }">
          <div class="attachments-info">
            <span>{{ item.attachments }} files</span>
            <span class="file-size">({{ item.fileSize }})</span>
          </div>
        </template>
        
        <template #cell(designStatus)="{ item }">
          <span :class="`status-badge status-${item.designStatus}`">
            {{ formatDesignStatus(item.designStatus) }}
          </span>
        </template>
        
        <template #cell(actions)="{ item }">
          <div class="action-buttons">
            <button 
              v-if="item.attachments > 0"
              class="btn btn-info btn-sm"
              @click="downloadFiles(item)"
            >
              Download All
            </button>
            <button 
              class="btn btn-success btn-sm"
              @click="openUploadModal(item)"
            >
              Upload
            </button>
            <button 
              v-if="item.hasBrief"
              class="btn btn-warning btn-sm"
              @click="viewBrief(item)"
            >
              View Brief
            </button>
          </div>
        </template>
      </DataTable>
    </div>

    <div class="content-card">
      <div class="card-header">
        <h2>Recent Uploads</h2>
      </div>
      <FileList 
        :files="recentUploads"
        @view="viewFile"
        @download="downloadFile"
      />
    </div>

    <UploadDesignModal 
      v-if="showUploadModal"
      :advert="selectedAdvert"
      @close="closeUploadModal"
      @uploaded="handleUploadComplete"
    />
  </div>
</template>

<script setup>
import StatCard from '~/components/common/StatCard.vue'
import DataTable from '~/components/common/DataTable.vue'
import FileList from '~/components/design/FileList.vue'
//import UploadDesignModal from '~/components/design/UploadDesignModal.vue'
import UploadDesignModal from '~/components/design/UploadDesign.vue'
import { useDesign } from '~/composables/useDesign'
import { ref, computed, onMounted } from 'vue'

const { 
  designs,
  recentUploads,
  activeProjects,
  readyToUpload,
  totalFiles,
  loading,
  loadDesigns,
  loadRecentUploads 
} = useDesign()

const searchQuery = ref('')
const platformFilter = ref('All Platforms')
const selectedAdvert = ref(null)
const showUploadModal = ref(false)

const tableHeaders = [
  { key: 'reference', label: 'Ref #' },
  { key: 'clientName', label: 'Client' },
  { key: 'advertTitle', label: 'Advert Title' },
  { key: 'platform', label: 'Platform' },
  { key: 'attachments', label: 'Attachments' },
  { key: 'designStatus', label: 'Design Status' },
  { key: 'actions', label: 'Actions' }
]

const filteredDesigns = computed(() => {
  let filtered = [...designs.value]
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(design => 
      design.clientName?.toLowerCase().includes(query) ||
      design.advertTitle?.toLowerCase().includes(query)
    )
  }
  
  if (platformFilter.value !== 'All Platforms') {
    filtered = filtered.filter(design => 
      design.platform === platformFilter.value
    )
  }
  
  return filtered
})

onMounted(() => {
  loadDesigns()
  loadRecentUploads()
})

const searchDesigns = () => {
  // Search is handled by computed property
}

const formatDesignStatus = (status) => {
  const statusMap = {
    'pending': 'In Progress',
    'complete': 'Design Complete',
    'approved': 'Approved'
  }
  return statusMap[status] || status
}

const openUploadModal = (advert = null) => {
  selectedAdvert.value = advert
  showUploadModal.value = true
}

const closeUploadModal = () => {
  showUploadModal.value = false
  selectedAdvert.value = null
}

const handleUploadComplete = () => {
  closeUploadModal()
  loadRecentUploads()
  loadDesigns()
}

const downloadFiles = (design) => {
  alert(`Downloading all files for ${design.reference}`)
}

const viewBrief = (design) => {
  alert(`Viewing brief for ${design.reference}`)
}

const viewFile = (file) => {
  // Implement file viewing
  console.log('View file:', file)
}

const downloadFile = (file) => {
  // Implement file download
  console.log('Download file:', file)
}
</script>

<style scoped>
.design-page {
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

.content-card {
  background: white;
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-bottom: 20px;
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

.search-filter-bar {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  align-items: center;
}

.search-input {
  flex: 1;
  min-width: 250px;
  padding: 10px 15px;
  border: 1px solid #DDDDDD;
  border-radius: 5px;
}

.filter-select {
  padding: 10px 15px;
  border: 1px solid #DDDDDD;
  border-radius: 5px;
  min-width: 150px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1em;
  transition: all 0.3s;
}

.btn-primary {
  background: #E31E24;
  color: white;
}

.btn-primary:hover {
  background: #c01820;
}

.btn-secondary {
  background: #0066CC;
  color: white;
}

.btn-secondary:hover {
  background: #0052a3;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 0.9em;
}

.btn-info {
  background: #17a2b8;
  color: white;
}

.btn-success {
  background: #28a745;
  color: white;
}

.btn-warning {
  background: #ffc107;
  color: #333333;
}

.attachments-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.file-size {
  font-size: 0.85em;
  color: #666;
}

.action-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.status-badge {
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 0.85em;
  font-weight: 600;
}

.status-pending {
  background: #74b9ff;
  color: #0984e3;
}

.status-complete {
  background: #55efc4;
  color: #00b894;
}

.status-approved {
  background: #55efc4;
  color: #00b894;
}

@media (max-width: 768px) {
  .search-filter-bar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-input,
  .filter-select {
    width: 100%;
  }
  
  .card-header {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }
}
</style>