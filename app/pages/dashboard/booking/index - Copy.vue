<template>
  <div class="my-adverts-page">
    <div class="page-header">
      <h1>My Adverts</h1>
      <p>Track and manage all your advertising bookings</p>
    </div>

    <!-- Error message display -->
    <div v-if="error" class="error-message">
      <strong>Error:</strong> {{ error }}
    </div>

    <div class="content-card">
      <div class="search-filter-bar">
        <input 
          v-model="searchQuery"
          type="text" 
          class="search-input" 
          placeholder="Search adverts by client, title, or reference..."
          @keyup.enter="searchAdverts"
        >
        <select v-model="platformFilter" class="filter-select">
          <option value="">All Platforms</option>
          <option value="print">Print Media</option>
          <option value="tv">Television</option>
          <option value="radio">Radio</option>
          <option value="digital">Digital</option>
          <option value="outdoor">Outdoor</option>
        </select>
        <select v-model="statusFilter" class="filter-select">
          <option value="">All Status</option>
          <option value="draft">Draft</option>
          <option value="pending">Pending Review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <button class="btn btn-primary" @click="searchAdverts" :disabled="loading">
          {{ loading ? 'Searching...' : 'Search' }}
        </button>
        <button class="btn btn-secondary" @click="clearFilters">
          Clear
        </button>
      </div>

      <DataTable 
        :headers="tableHeaders"
        :items="filteredAdverts"
        :loading="loading"
      >
        <template #cell(actions)="{ item }">
          <div class="action-buttons">
            <button class="btn btn-info btn-sm" @click="viewAdvert(item)">
              View
            </button>
            <button 
              v-if="item.status === 'draft'"
              class="btn btn-warning btn-sm"
              @click="editAdvert(item)"
            >
              Edit
            </button>
            <button 
              v-if="item.status === 'draft'"
              class="btn btn-success btn-sm"
              @click="submitAdvert(item)"
            >
              Submit
            </button>
            <button 
              v-if="['approved', 'manager_approved', 'editor_approved'].includes(item.status)"
              class="btn btn-download btn-sm"
              @click="downloadAdvert(item)"
            >
              Download
            </button>
            <button 
              v-if="item.status === 'draft'"
              class="btn btn-danger btn-sm"
              @click="deleteAdvert(item)"
            >
              Delete
            </button>
          </div>
        </template>

        <template #cell(status)="{ item }">
          <span :class="`status-badge badge-${getStatusClass(item.status)}`">
            {{ getStatusLabel(item.status) }}
          </span>
        </template>

        <template #cell(totalAmount)="{ item }">
          {{ formatCurrency(item.totalAmount) }}
        </template>

        <template #cell(createdAt)="{ item }">
          {{ formatDate(item.createdAt) }}
        </template>
      </DataTable>

      <!-- Empty state -->
      <div v-if="!loading && filteredAdverts.length === 0" class="empty-state">
        <div class="empty-icon">📋</div>
        <h3>No adverts found</h3>
        <p v-if="searchQuery || platformFilter || statusFilter">
          Try adjusting your search filters
        </p>
        <p v-else>
          You haven't created any adverts yet. <a href="/dashboard/booking/new">Click to Create Advert</a>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import DataTable from '~/components/common/DataTable.vue'
import { useAdverts } from '~/composables/useAdverts'
import { ref, computed, onMounted } from 'vue'
import { useRouter } from '#imports'

const router = useRouter()
const { 
  adverts, 
  loading, 
  error,
  loadAdverts, 
  deleteAdvert: deleteAdvertApi,
  submitForReview: submitForReviewApi
} = useAdverts()

const searchQuery = ref('')
const platformFilter = ref('')
const statusFilter = ref('')

const tableHeaders = [
  { key: 'reference', label: 'Ref #' },
  { key: 'clientName', label: 'Client' },
  { key: 'advertTitle', label: 'Advert Title' },
  { key: 'platform', label: 'Platform' },
  { key: 'totalAmount', label: 'Amount (UGX)' },
  { key: 'status', label: 'Status' },
  { key: 'createdAt', label: 'Date' },
  { key: 'actions', label: 'Actions' }
]

const filteredAdverts = computed(() => {
  let filtered = [...adverts.value]
  
  // Client-side filtering (only if we loaded all adverts without filters)
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(advert => 
      advert.clientName?.toLowerCase().includes(query) ||
      advert.advertTitle?.toLowerCase().includes(query) ||
      advert.reference?.toLowerCase().includes(query)
    )
  }
  
  if (platformFilter.value) {
    filtered = filtered.filter(advert => 
      advert.platformCategory === platformFilter.value
    )
  }
  
  if (statusFilter.value) {
    filtered = filtered.filter(advert => {
      // Map UI status to API status
      const statusMap = {
        'draft': ['draft'],
        'pending': ['pending_review'],
        'approved': ['editor_approved', 'manager_approved'],
        'rejected': ['editor_rejected', 'manager_rejected']
      }
      
      const targetStatus = statusMap[statusFilter.value]
      if (Array.isArray(targetStatus)) {
        return targetStatus.includes(advert.status)
      }
      return advert.status === targetStatus
    })
  }
  
  return filtered
})

onMounted(() => {
  loadAdverts()
})

const searchAdverts = () => {
  // Build API filter params
  const filters = {}
  
  if (searchQuery.value) {
    filters.search = searchQuery.value
  }
  if (platformFilter.value) {
    filters.platformCategory = platformFilter.value
  }
  if (statusFilter.value) {
    // Map UI status to API status for server-side filtering
    const statusMap = {
      'draft': 'draft',
      'pending': 'pending_review',
      'approved': 'editor_approved', // Use editor_approved as primary
      'rejected': 'editor_rejected' // Use editor_rejected as primary
    }
    filters.status = statusMap[statusFilter.value]
  }
  
  loadAdverts(filters)
}

const clearFilters = () => {
  searchQuery.value = ''
  platformFilter.value = ''
  statusFilter.value = ''
  loadAdverts() // Reload without filters
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

const downloadAdvert = async (advert) => {
  try {
    // Call API to generate/download files
    alert(`Downloading files for ${advert.reference}`)
    // TODO: Implement actual file download from API
    // const response = await $fetch(`${process.env.NUXT_PUBLIC_API_BASE}/adverts/${advert.id}/download`, {
    //   method: 'GET'
    // })
  } catch (error) {
    console.error('Download failed:', error)
    alert('Failed to download files')
  }
}

const deleteAdvert = async (advert) => {
  if (confirm(`Are you sure you want to delete advert ${advert.reference}? This action cannot be undone.`)) {
    try {
      await deleteAdvertApi(advert.id)
      alert('Advert deleted successfully')
    } catch (error) {
      console.error('Delete failed:', error)
      alert('Failed to delete advert')
    }
  }
}

const submitAdvert = async (advert) => {
  if (confirm(`Submit "${advert.advertTitle}" for review? Once submitted, you cannot make further changes until it's reviewed.`)) {
    try {
      await submitForReviewApi(advert.id)
      alert('Advert submitted for review successfully')
      // Reload adverts to update status
      await loadAdverts()
    } catch (error) {
      console.error('Submit failed:', error)
      alert('Failed to submit advert for review')
    }
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
      year: 'numeric',
      month: 'short',
      day: 'numeric'
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
</script>

<style scoped>
.my-adverts-page {
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
  font-size: 1.8em;
}

.page-header p {
  color: #666;
  margin: 0;
}

.content-card {
  background: white;
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.error-message {
  background-color: #f8d7da;
  color: #721c24;
  padding: 12px 20px;
  border-radius: 6px;
  margin-bottom: 20px;
  border: 1px solid #f5c6cb;
}

.search-filter-bar {
  display: flex;
  gap: 15px;
  margin-bottom: 25px;
  flex-wrap: wrap;
  align-items: center;
}

.search-input {
  flex: 1;
  min-width: 250px;
  padding: 10px 15px;
  border: 1px solid #DDDDDD;
  border-radius: 5px;
  font-size: 0.95em;
}

.search-input:focus {
  outline: none;
  border-color: #0066CC;
  box-shadow: 0 0 0 2px rgba(0, 102, 204, 0.1);
}

.filter-select {
  padding: 10px 15px;
  border: 1px solid #DDDDDD;
  border-radius: 5px;
  min-width: 150px;
  font-size: 0.95em;
  background-color: white;
}

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
  color: #333333;
}

.btn-warning:hover {
  background: #e0a800;
}

.btn-success {
  background: #28a745;
  color: white;
}

.btn-success:hover {
  background: #218838;
}

.btn-download {
  background: #6f42c1;
  color: white;
}

.btn-download:hover {
  background: #5a32a3;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover {
  background: #c82333;
}

.action-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
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

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #666;
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

.empty-state a {
  color: #0066CC;
  text-decoration: none;
  font-weight: 500;
}

.empty-state a:hover {
  text-decoration: underline;
}

@media (max-width: 768px) {
  .search-filter-bar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-input,
  .filter-select {
    width: 100%;
    min-width: unset;
  }
  
  .page-header,
  .content-card {
    padding: 20px;
  }
  
  .action-buttons {
    flex-direction: column;
    gap: 5px;
  }
  
  .btn-sm {
    width: 100%;
    text-align: center;
  }
}
</style>