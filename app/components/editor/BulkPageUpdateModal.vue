<template>
  <Teleport to="body">
    <div v-if="show" class="modal-overlay" @click.self="handleClose">
      <div class="modal-content">
        <div class="modal-header">
          <h2>📋 Bulk Page Update</h2>
          <button class="close-btn" @click="handleClose" aria-label="Close">×</button>
        </div>
        
        <div class="modal-body">
          <div class="bulk-instructions">
            <p>Update page numbers for multiple schedules at once. Use the options below to set pages:</p>
          </div>
          
          <!-- Bulk Update Options -->
          <div class="bulk-options">
            <div class="option-group">
              <h3>Quick Actions</h3>
              <div class="quick-actions">
                <button class="btn btn-info" @click="setAllToZero">
                  Set All to 0
                </button>
                <button class="btn btn-info" @click="assignSequentialPages">
                  Assign Sequential Pages
                </button>
                <button class="btn btn-info" @click="assignRandomPages">
                  Assign Random Pages (1-20)
                </button>
              </div>
            </div>
            
            <div class="option-group">
              <h3>Manual Update</h3>
              <div class="manual-update">
                <div class="input-group">
                  <label>Set all to page:</label>
                  <div class="input-with-button">
                    <input 
                      type="number" 
                      v-model="manualPage" 
                      min="0" 
                      class="page-input"
                      placeholder="Enter page number"
                    />
                    <button class="btn btn-primary" @click="setAllToManualPage">
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Schedules List -->
          <div class="schedules-list-container">
            <h3>Selected Schedules ({{ schedules.length }})</h3>
            
            <div class="table-header">
              <div class="header-cell">Advert Title</div>
              <div class="header-cell">Run Date</div>
              <div class="header-cell">Current Page</div>
              <div class="header-cell">New Page</div>
            </div>
            
            <div class="schedules-list">
              <div 
                v-for="(schedule, index) in schedules" 
                :key="schedule.schedule_id"
                class="schedule-item"
              >
                <div class="item-cell advert-title">
                  {{ schedule.advert_title }}
                </div>
                <div class="item-cell run-date">
                  {{ formatDate(schedule.run_date) }}
                </div>
                <div class="item-cell current-page">
                  {{ schedule.page || 0 }}
                </div>
                <div class="item-cell new-page">
                  <input 
                    type="number" 
                    v-model="updates[index].page"
                    min="0"
                    class="page-input-sm"
                    @input="validatePageInput(index)"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <!-- Preview Changes -->
          <div class="preview-section">
            <h3>Preview Changes</h3>
            <div class="preview-stats">
              <div class="stat-item">
                <span class="stat-label">Total schedules:</span>
                <span class="stat-value">{{ schedules.length }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Pages updated:</span>
                <span class="stat-value">{{ updatedSchedulesCount }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">No change:</span>
                <span class="stat-value">{{ unchangedSchedulesCount }}</span>
              </div>
            </div>
            
            <div v-if="updatedSchedulesCount > 0" class="changes-list">
              <div v-for="(update, index) in updates" :key="index">
                <div 
                  v-if="update.page !== (schedules[index].page || 0)"
                  class="change-item"
                >
                  <span class="advert-name">{{ schedules[index].advert_title }}</span>
                  <span class="page-change">
                    {{ schedules[index].page || 0 }} → {{ update.page }}
                  </span>
                </div>
              </div>
            </div>
            <div v-else class="no-changes">
              No changes detected. Adjust page numbers above.
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="handleClose">
            Cancel
          </button>
          <button 
            class="btn btn-primary" 
            @click="handleSave"
            :disabled="updatedSchedulesCount === 0 || saving"
          >
            <span v-if="saving">Saving...</span>
            <span v-else>Save {{ updatedSchedulesCount }} Changes</span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  schedules: {
    type: Array,
    default: () => []
  },
  show: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['save', 'close'])

// State
const manualPage = ref('')
const updates = ref([])
const saving = ref(false)

// Initialize updates when schedules change
watch(() => props.schedules, (newSchedules) => {
  updates.value = newSchedules.map(schedule => ({
    scheduleId: schedule.schedule_id,
    page: schedule.page || 0
  }))
}, { immediate: true })

// Computed properties
const updatedSchedulesCount = computed(() => {
  return updates.value.filter((update, index) => {
    const currentPage = props.schedules[index].page || 0
    return update.page !== currentPage
  }).length
})

const unchangedSchedulesCount = computed(() => {
  return props.schedules.length - updatedSchedulesCount.value
})

// Methods
const handleClose = () => {
  emit('close')
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('en-UG', {
    month: 'short',
    day: 'numeric'
  })
}

const validatePageInput = (index) => {
  const page = updates.value[index].page
  if (page < 0) {
    updates.value[index].page = 0
  }
}

const setAllToZero = () => {
  updates.value.forEach(update => {
    update.page = 0
  })
}

const assignSequentialPages = () => {
  let page = 1
  updates.value.forEach(update => {
    update.page = page
    page++
  })
}

const assignRandomPages = () => {
  updates.value.forEach(update => {
    update.page = Math.floor(Math.random() * 20) + 1
  })
}

const setAllToManualPage = () => {
  const page = parseInt(manualPage.value)
  if (!isNaN(page) && page >= 0) {
    updates.value.forEach(update => {
      update.page = page
    })
    manualPage.value = ''
  }
}

const handleSave = async () => {
  if (updatedSchedulesCount.value === 0) {
    alert('No changes to save.')
    return
  }
  
  saving.value = true
  try {
    const changes = updates.value
      .filter((update, index) => {
        const currentPage = props.schedules[index].page || 0
        return update.page !== currentPage
      })
      .map(update => ({
        scheduleId: update.scheduleId,
        page: update.page
      }))
    
    emit('save', changes)
  } catch (error) {
    console.error('Error saving changes:', error)
    alert('Failed to save changes')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  backdrop-filter: blur(2px);
}

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  padding: 25px 30px;
  border-bottom: 2px solid #f0f2f5;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8f9fa;
  border-radius: 12px 12px 0 0;
}

.modal-header h2 {
  margin: 0;
  color: #003366;
  font-size: 1.5em;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 2.5em;
  cursor: pointer;
  color: #666;
  line-height: 0.8;
  padding: 0;
  width: 35px;
  height: 35px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #333;
}

.modal-body {
  padding: 30px;
}

.bulk-instructions {
  background: #e3f2fd;
  padding: 15px 20px;
  border-radius: 8px;
  margin-bottom: 25px;
  border-left: 4px solid #2196f3;
}

.bulk-instructions p {
  margin: 0;
  color: #1565c0;
  font-size: 0.95em;
}

.bulk-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  margin-bottom: 30px;
}

@media (max-width: 768px) {
  .bulk-options {
    grid-template-columns: 1fr;
  }
}

.option-group {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #dee2e6;
}

.option-group h3 {
  margin: 0 0 15px 0;
  color: #003366;
  font-size: 1.1em;
  padding-bottom: 10px;
  border-bottom: 2px solid #0066CC;
}

.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.manual-update {
  margin-top: 15px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.input-group label {
  font-weight: 600;
  color: #333;
  font-size: 0.9em;
}

.input-with-button {
  display: flex;
  gap: 10px;
}

.page-input {
  flex: 1;
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1em;
}

.page-input:focus {
  outline: none;
  border-color: #0066CC;
  box-shadow: 0 0 0 2px rgba(0, 102, 204, 0.1);
}

.schedules-list-container {
  margin-bottom: 30px;
}

.schedules-list-container h3 {
  margin: 0 0 15px 0;
  color: #003366;
  font-size: 1.2em;
}

.table-header {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 10px;
  padding: 12px 15px;
  background: #f8f9fa;
  border-radius: 8px 8px 0 0;
  border: 1px solid #dee2e6;
  border-bottom: none;
  font-weight: 600;
  color: #333;
  font-size: 0.9em;
}

.header-cell {
  padding: 0 5px;
}

.schedules-list {
  border: 1px solid #dee2e6;
  border-radius: 0 0 8px 8px;
  max-height: 300px;
  overflow-y: auto;
}

.schedule-item {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 10px;
  padding: 12px 15px;
  border-bottom: 1px solid #eee;
}

.schedule-item:last-child {
  border-bottom: none;
}

.schedule-item:hover {
  background: #f8f9fa;
}

.item-cell {
  padding: 0 5px;
  display: flex;
  align-items: center;
}

.advert-title {
  font-weight: 600;
  color: #333;
  font-size: 0.95em;
}

.run-date {
  color: #666;
  font-size: 0.9em;
}

.current-page {
  font-weight: 600;
  color: #0066CC;
  font-size: 1em;
}

.new-page {
  display: flex;
  align-items: center;
}

.page-input-sm {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9em;
  text-align: center;
}

.page-input-sm:focus {
  outline: none;
  border-color: #0066CC;
  box-shadow: 0 0 0 2px rgba(0, 102, 204, 0.1);
}

.preview-section {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #dee2e6;
}

.preview-section h3 {
  margin: 0 0 15px 0;
  color: #003366;
  font-size: 1.2em;
}

.preview-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  margin-bottom: 20px;
}

@media (max-width: 768px) {
  .preview-stats {
    grid-template-columns: 1fr;
  }
}

.stat-item {
  background: white;
  padding: 15px;
  border-radius: 8px;
  border: 1px solid #dee2e6;
}

.stat-label {
  display: block;
  color: #666;
  font-size: 0.9em;
  margin-bottom: 5px;
}

.stat-value {
  display: block;
  font-size: 1.5em;
  font-weight: 600;
  color: #0066CC;
}

.changes-list {
  max-height: 200px;
  overflow-y: auto;
}

.change-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  background: white;
  border-radius: 8px;
  border: 1px solid #dee2e6;
  margin-bottom: 10px;
}

.advert-name {
  font-weight: 600;
  color: #333;
  font-size: 0.95em;
}

.page-change {
  background: #e3f2fd;
  padding: 6px 12px;
  border-radius: 12px;
  font-weight: 600;
  color: #1565c0;
  font-size: 0.9em;
}

.no-changes {
  text-align: center;
  padding: 30px;
  color: #999;
  font-style: italic;
  background: white;
  border-radius: 8px;
  border: 1px solid #dee2e6;
}

.modal-footer {
  padding: 20px 30px;
  border-top: 2px solid #f0f2f5;
  display: flex;
  gap: 15px;
  justify-content: flex-end;
  background: #f8f9fa;
  border-radius: 0 0 12px 12px;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.95em;
  transition: all 0.3s;
  min-width: 140px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #5a6268;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(108, 117, 125, 0.3);
}

.btn-primary {
  background: #0066CC;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #0052a3;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 102, 204, 0.3);
}

.btn-info {
  background: #17a2b8;
  color: white;
}

.btn-info:hover:not(:disabled) {
  background: #138496;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(23, 162, 184, 0.3);
}

@media (max-width: 768px) {
  .modal-overlay {
    padding: 10px;
  }
  
  .modal-content {
    max-height: 95vh;
  }
  
  .modal-header,
  .modal-body,
  .modal-footer {
    padding: 20px;
  }
  
  .table-header,
  .schedule-item {
    grid-template-columns: 1fr;
    gap: 5px;
  }
  
  .header-cell,
  .item-cell {
    display: block;
    padding: 5px 0;
  }
  
  .modal-footer {
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
  }
}
</style>