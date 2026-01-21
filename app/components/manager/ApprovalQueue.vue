<template>
  <div class="approval-queue">
    <div class="queue-header">
      <h3>Manager Approval Queue</h3>
      <div class="queue-actions">
        <button class="btn btn-secondary btn-sm" @click="refreshQueue">
          Refresh
        </button>
        <button class="btn btn-primary btn-sm" @click="exportQueue">
          Export
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <div>Loading approvals...</div>
    </div>

    <div v-else-if="adverts.length === 0" class="empty-state">
      <div class="empty-icon">✅</div>
      <h4>All Adverts Approved</h4>
      <p>No adverts currently require your approval.</p>
    </div>

    <div v-else class="approval-list">
      <div v-for="advert in adverts" :key="advert.id" class="approval-item">
        <div class="approval-header">
          <div class="approval-ref">
            <span class="ref-number">{{ advert.reference }}</span>
            <span class="approval-type">For Final Approval</span>
          </div>
          <div class="approval-meta">
            <span class="editor">Reviewed by: {{ advert.editor }}</span>
            <span class="date">Editor approved {{ formatRelativeTime(advert.reviewedAt) }}</span>
          </div>
        </div>

        <div class="approval-content">
          <div class="advert-details">
            <h5>{{ advert.advertTitle }}</h5>
            <div class="details-grid">
              <div class="detail">
                <span class="label">Client:</span>
                <span class="value">{{ advert.clientName }}</span>
              </div>
              <div class="detail">
                <span class="label">Platform:</span>
                <span class="value">{{ advert.platform }}</span>
              </div>
              <div class="detail">
                <span class="label">Revenue:</span>
                <span class="value revenue">{{ formatCurrency(advert.revenue) }}</span>
              </div>
              <div class="detail">
                <span class="label">Cost:</span>
                <span class="value cost">{{ formatCurrency(advert.cost) }}</span>
              </div>
            </div>
          </div>

          <div class="financial-metrics">
            <div class="metric">
              <div class="metric-label">Profit Margin</div>
              <div class="metric-value" :class="getProfitMarginClass(advert.profitMargin)">
                {{ advert.profitMargin }}%
              </div>
            </div>
            <div class="metric">
              <div class="metric-label">ROI</div>
              <div class="metric-value" :class="getROIClass(advert.roi)">
                {{ advert.roi }}%
              </div>
            </div>
            <div class="metric">
              <div class="metric-label">Budget Used</div>
              <div class="metric-value">
                {{ advert.budgetUsed }}%
              </div>
            </div>
          </div>

          <div class="editor-notes">
            <div class="notes-header">
              <strong>Editor's Notes:</strong>
            </div>
            <div class="notes-content">
              {{ advert.editorNotes || 'No additional notes provided.' }}
            </div>
          </div>
        </div>

        <div class="approval-actions">
          <div class="quick-actions">
            <button 
              class="btn btn-info btn-sm"
              @click="$emit('view-details', advert)"
            >
              View Details
            </button>
            <button 
              class="btn btn-warning btn-sm"
              @click="$emit('download-files', advert)"
            >
              Download Files
            </button>
            <button 
              class="btn btn-secondary btn-sm"
              @click="$emit('request-info', advert)"
            >
              Request More Info
            </button>
          </div>
          
          <div class="decision-actions">
            <button 
              class="btn btn-danger"
              @click="$emit('reject', advert)"
            >
              Reject
            </button>
            <button 
              class="btn btn-success"
              @click="$emit('approve', advert)"
            >
              Approve
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="adverts.length > 0" class="queue-footer">
      <div class="pagination-controls">
        <button 
          class="btn btn-secondary btn-sm"
          :disabled="currentPage === 1"
          @click="prevPage"
        >
          Previous
        </button>
        
        <span class="page-info">
          Page {{ currentPage }} of {{ totalPages }}
        </span>
        
        <button 
          class="btn btn-secondary btn-sm"
          :disabled="currentPage === totalPages"
          @click="nextPage"
        >
          Next
        </button>
      </div>
      
      <div class="queue-summary">
        <span class="summary-item">
          Total Value: <strong>{{ formatCurrency(totalValue) }}</strong>
        </span>
        <span class="summary-item">
          Average Margin: <strong>{{ avgMargin }}%</strong>
        </span>
        <span class="summary-item">
          Items: <strong>{{ adverts.length }}</strong>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { formatCurrency, formatRelativeTime } from '~/utils/formatters'

const props = defineProps({
  adverts: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  pageSize: {
    type: Number,
    default: 10
  }
})

const emit = defineEmits([
  'refresh',
  'export',
  'view-details',
  'download-files',
  'request-info',
  'approve',
  'reject',
  'page-change'
])

const currentPage = ref(1)

const totalPages = computed(() => {
  return Math.ceil(props.adverts.length / props.pageSize)
})

const paginatedAdverts = computed(() => {
  const start = (currentPage.value - 1) * props.pageSize
  const end = start + props.pageSize
  return props.adverts.slice(start, end)
})

const totalValue = computed(() => {
  return props.adverts.reduce((sum, advert) => sum + (advert.revenue || 0), 0)
})

const avgMargin = computed(() => {
  if (props.adverts.length === 0) return 0
  
  const totalMargin = props.adverts.reduce((sum, advert) => sum + (advert.profitMargin || 0), 0)
  return Math.round(totalMargin / props.adverts.length)
})

const getProfitMarginClass = (margin) => {
  if (margin >= 50) return 'text-success'
  if (margin >= 30) return 'text-warning'
  return 'text-danger'
}

const getROIClass = (roi) => {
  if (roi >= 200) return 'text-success'
  if (roi >= 100) return 'text-warning'
  return 'text-danger'
}

const refreshQueue = () => {
  emit('refresh')
  currentPage.value = 1
}

const exportQueue = () => {
  emit('export', {
    adverts: props.adverts,
    totalValue: totalValue.value,
    avgMargin: avgMargin.value
  })
}

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
    emit('page-change', currentPage.value)
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    emit('page-change', currentPage.value)
  }
}
</script>

<style scoped>
.approval-queue {
  width: 100%;
}

.queue-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 2px solid #F5F5F5;
}

.queue-header h3 {
  color: #003366;
  margin: 0;
  font-size: 1.3em;
}

.queue-actions {
  display: flex;
  gap: 10px;
}

.loading-state {
  text-align: center;
  padding: 60px 20px;
}

.loading-spinner {
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

.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: #F9F9F9;
  border-radius: 8px;
  border: 2px dashed #DDDDDD;
}

.empty-icon {
  font-size: 3em;
  color: #28a745;
  margin-bottom: 20px;
}

.empty-state h4 {
  color: #666;
  margin-bottom: 10px;
  font-weight: 500;
}

.empty-state p {
  color: #999;
  margin-bottom: 0;
}

.approval-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.approval-item {
  background: white;
  border: 1px solid #DDDDDD;
  border-radius: 8px;
  padding: 25px;
  transition: all 0.3s;
}

.approval-item:hover {
  border-color: #0066CC;
  box-shadow: 0 4px 12px rgba(0, 102, 204, 0.1);
  transform: translateY(-2px);
}

.approval-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #F5F5F5;
  flex-wrap: wrap;
  gap: 10px;
}

.approval-ref {
  display: flex;
  align-items: center;
  gap: 10px;
}

.ref-number {
  font-size: 1.1em;
  font-weight: 600;
  color: #003366;
  background: #F5F5F5;
  padding: 4px 8px;
  border-radius: 4px;
}

.approval-type {
  font-size: 0.85em;
  color: #28a745;
  background: rgba(40, 167, 69, 0.1);
  padding: 3px 8px;
  border-radius: 12px;
  font-weight: 500;
}

.approval-meta {
  display: flex;
  flex-direction: column;
  gap: 5px;
  text-align: right;
}

.approval-meta .editor {
  color: #666;
  font-size: 0.9em;
}

.approval-meta .date {
  color: #999;
  font-size: 0.85em;
}

.approval-content {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 30px;
  margin-bottom: 25px;
}

.advert-details h5 {
  color: #333333;
  margin-bottom: 15px;
  font-size: 1.1em;
  font-weight: 600;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.detail {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.detail .label {
  color: #666;
  font-size: 0.9em;
  font-weight: 500;
  min-width: 60px;
}

.detail .value {
  color: #333;
  font-size: 0.95em;
  font-weight: 500;
}

.detail .value.revenue {
  color: #28a745;
}

.detail .value.cost {
  color: #dc3545;
}

.financial-metrics {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.metric {
  background: #F9F9F9;
  padding: 15px;
  border-radius: 5px;
  text-align: center;
}

.metric-label {
  color: #666;
  font-size: 0.85em;
  margin-bottom: 5px;
  font-weight: 500;
}

.metric-value {
  font-size: 1.3em;
  font-weight: 700;
}

.text-success {
  color: #28a745;
}

.text-warning {
  color: #ffc107;
}

.text-danger {
  color: #dc3545;
}

.editor-notes {
  grid-column: 1 / -1;
  background: #F5F5F5;
  padding: 15px;
  border-radius: 5px;
  margin-top: 10px;
}

.notes-header {
  color: #003366;
  margin-bottom: 8px;
  font-size: 0.95em;
}

.notes-content {
  color: #333;
  line-height: 1.5;
  font-size: 0.9em;
}

.approval-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 20px;
  border-top: 2px solid #F5F5F5;
  flex-wrap: wrap;
  gap: 15px;
}

.quick-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.decision-actions {
  display: flex;
  gap: 10px;
}

.queue-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 2px solid #DDDDDD;
  flex-wrap: wrap;
  gap: 15px;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 15px;
}

.page-info {
  color: #666;
  font-size: 0.9em;
  min-width: 100px;
  text-align: center;
}

.queue-summary {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.summary-item {
  color: #666;
  font-size: 0.9em;
}

.summary-item strong {
  color: #003366;
  margin-left: 5px;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.9em;
  font-weight: 500;
  transition: all 0.3s;
}

.btn-primary {
  background: #E31E24;
  color: white;
}

.btn-primary:hover {
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

.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-success {
  background: #28a745;
  color: white;
}

.btn-success:hover {
  background: #218838;
  transform: translateY(-1px);
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover {
  background: #c82333;
  transform: translateY(-1px);
}

.btn-warning {
  background: #ffc107;
  color: #333333;
}

.btn-warning:hover {
  background: #e0a800;
  transform: translateY(-1px);
}

.btn-info {
  background: #17a2b8;
  color: white;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 0.85em;
}

@media (max-width: 768px) {
  .queue-header {
    flex-direction: column;
    align-items: stretch;
    gap: 15px;
  }
  
  .queue-actions {
    justify-content: flex-end;
  }
  
  .approval-content {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .details-grid {
    grid-template-columns: 1fr;
  }
  
  .approval-actions {
    flex-direction: column;
    align-items: stretch;
  }
  
  .quick-actions,
  .decision-actions {
    width: 100%;
    justify-content: center;
  }
  
  .queue-footer {
    flex-direction: column;
    text-align: center;
  }
  
  .queue-summary {
    justify-content: center;
  }
}
</style>