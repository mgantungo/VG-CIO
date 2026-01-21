<template>
  <div class="review-page">
    <div class="page-header">
      <h1>Review Queue</h1>
      <p>Review and approve advertising submissions</p>
    </div>

    <div class="stats-grid">
      <StatCard 
        icon="⏳"
        :value="pendingCount"
        label="Pending Review"
        color="red"
      />
      <StatCard 
        icon="✓"
        :value="approvedToday"
        label="Approved Today"
        color="green"
      />
      <StatCard 
        icon="📋"
        :value="needsRevision"
        label="Needs Revision"
        color="gold"
      />
    </div>

    <div class="content-card">
      <div class="card-header">
        <h2>Adverts Awaiting Review</h2>
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

      <ReviewQueue 
        :adverts="filteredAdverts"
        :loading="loading"
        @review="handleReview"
        @refresh="loadAdverts"
      />
    </div>

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
import ReviewQueue from '~/components/editor/ReviewQueue.vue'
import ReviewModal from '~/components/editor/ReviewModal.vue'
import { useWorkflow } from '~/composables/useWorkflow'
import { ref, computed, onMounted } from 'vue'

const tabs = [
  { id: 'all', label: 'All' },
  { id: 'print', label: 'Print Media' },
  { id: 'tv', label: 'Television' },
  { id: 'radio', label: 'Radio' },
  { id: 'digital', label: 'Digital' }
]

const activeTab = ref('all')
const selectedAdvert = ref(null)
const showModal = ref(false)

const { 
  adverts,
  pendingCount,
  approvedToday,
  needsRevision,
  loading,
  loadAdverts,
  reviewAdvert 
} = useWorkflow()

const filteredAdverts = computed(() => {
  if (activeTab.value === 'all') return adverts.value
  return adverts.value.filter(advert => 
    advert.platformCategory === activeTab.value
  )
})

onMounted(() => {
  loadAdverts()
})

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
    await reviewAdvert(selectedAdvert.value.id, 'approve', comment)
    alert('Advert approved successfully!')
    closeModal()
    loadAdverts()
  } catch (error) {
    console.error('Approval failed:', error)
    alert('Failed to approve advert')
  }
}

const handleReject = async (comment) => {
  try {
    await reviewAdvert(selectedAdvert.value.id, 'reject', comment)
    alert('Advert rejected')
    closeModal()
    loadAdverts()
  } catch (error) {
    console.error('Rejection failed:', error)
    alert('Failed to reject advert')
  }
}

const handleRequestChanges = async (comment) => {
  try {
    await reviewAdvert(selectedAdvert.value.id, 'request_changes', comment)
    alert('Changes requested')
    closeModal()
    loadAdverts()
  } catch (error) {
    console.error('Request failed:', error)
    alert('Failed to request changes')
  }
}
</script>

<style scoped>
.review-page {
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
</style>