<template>
  <div class="review-queue">
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <div>Loading adverts for review...</div>
    </div>

    <div v-else-if="adverts.length === 0" class="empty-state">
      <div class="empty-icon">📋</div>
      <h3>No Adverts Pending Review</h3>
      <p>All adverts have been reviewed. Great job!</p>
      <button class="btn btn-secondary" @click="$emit('refresh')">
        Refresh
      </button>
    </div>

    <div v-else class="adverts-list">
      <div v-for="advert in adverts" :key="advert.id" class="advert-card">
        <div class="advert-header">
          <div class="advert-ref">
            <span class="ref-number">{{ advert.reference }}</span>
            <span :class="`priority-badge priority-${advert.priority}`">
              {{ advert.priority }}
            </span>
          </div>
          <div class="advert-date">
            Submitted {{ formatRelativeTime(advert.submittedAt) }}
          </div>
        </div>

        <div class="advert-content">
          <div class="advert-info">
            <h4>{{ advert.advertTitle }}</h4>
            <div class="advert-details">
              <div class="detail">
                <span class="label">Client:</span>
                <span class="value">{{ advert.clientName }}</span>
              </div>
              <div class="detail">
                <span class="label">Platform:</span>
                <span class="value">{{ advert.platform }}</span>
              </div>
              <div class="detail">
                <span class="label">Amount:</span>
                <span class="value amount">{{ formatCurrency(advert.amount) }}</span>
              </div>
              <div class="detail">
                <span class="label">Submitted By:</span>
                <span class="value">{{ advert.submittedBy }}</span>
              </div>
            </div>
          </div>

          <div v-if="advert.files && advert.files.length > 0" class="advert-files">
            <div class="files-count">
              <span class="file-icon">📎</span>
              {{ advert.files.length }} file(s) attached
            </div>
          </div>
        </div>

        <div class="advert-actions">
          <button 
            class="btn btn-info btn-sm"
            @click="$emit('preview', advert)"
          >
            Preview Files
          </button>
          <button 
            class="btn btn-primary"
            @click="$emit('review', advert)"
          >
            Review Now
          </button>
        </div>
      </div>
    </div>

    <div v-if="adverts.length > 0 && !loading" class="queue-footer">
      <div class="queue-stats">
        Showing {{ adverts.length }} advert(s) pending review
      </div>
      <button class="btn btn-secondary" @click="$emit('refresh')">
        Refresh Queue
      </button>
    </div>
  </div>
</template>

<script setup>
import { formatCurrency, formatRelativeTime } from '~/utils/formatters'

defineProps({
  adverts: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
})

defineEmits(['review', 'preview', 'refresh'])
</script>

<style scoped>
.review-queue {
  width: 100%;
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
}

.empty-icon {
  font-size: 3em;
  color: #DDDDDD;
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

.adverts-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.advert-card {
  background: white;
  border: 1px solid #DDDDDD;
  border-radius: 8px;
  padding: 25px;
  transition: all 0.3s;
}

.advert-card:hover {
  border-color: #0066CC;
  box-shadow: 0 4px 12px rgba(0, 102, 204, 0.1);
  transform: translateY(-2px);
}

.advert-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #F5F5F5;
}

.advert-ref {
  display: flex;
  align-items: center;
  gap: 10px;
}

.ref-number {
  font-size: 1.1em;
  font-weight: 600;
  color: #003366;
}

.priority-badge {
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 0.75em;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.priority-high {
  background: #ff7675;
  color: #d63031;
}

.priority-normal {
  background: #74b9ff;
  color: #0984e3;
}

.priority-low {
  background: #55efc4;
  color: #00b894;
}

.advert-date {
  color: #999;
  font-size: 0.85em;
}

.advert-content {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 30px;
  margin-bottom: 25px;
}

.advert-info h4 {
  color: #333333;
  margin-bottom: 15px;
  font-size: 1.2em;
  font-weight: 600;
}

.advert-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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
  min-width: 100px;
}

.detail .value {
  color: #333;
  font-size: 0.95em;
}

.detail .value.amount {
  color: #E31E24;
  font-weight: 600;
}

.advert-files {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 200px;
}

.files-count {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: #F5F5F5;
  border-radius: 5px;
  color: #666;
  font-size: 0.9em;
}

.file-icon {
  font-size: 1.1em;
}

.advert-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 20px;
  border-top: 2px solid #F5F5F5;
}

.queue-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 2px solid #DDDDDD;
}

.queue-stats {
  color: #666;
  font-size: 0.9em;
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

.btn-secondary:hover {
  background: #0052a3;
  transform: translateY(-1px);
}

.btn-info {
  background: #17a2b8;
  color: white;
}

.btn-sm {
  padding: 8px 16px;
  font-size: 0.9em;
}

@media (max-width: 768px) {
  .advert-content {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .advert-header {
    flex-direction: column;
    gap: 10px;
  }
  
  .advert-details {
    grid-template-columns: 1fr;
  }
  
  .detail .label {
    min-width: 80px;
  }
  
  .advert-actions {
    flex-direction: column;
  }
  
  .queue-footer {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }
}
</style>