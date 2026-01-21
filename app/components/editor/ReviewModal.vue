<!--components/editor/ReviewModal.vue-->
<template>
  <Teleport to="body">
    <div v-if="show" class="modal-overlay" @click.self="handleClose">
      <div class="modal-content">
        <div class="modal-header">
          <h2>📋 Review Advert</h2>
          <button class="close-btn" @click="handleClose" aria-label="Close">×</button>
        </div>
        
        <div class="modal-body">
          <!-- Advert Details Summary -->
          <div class="advert-summary">
            <div class="summary-row">
              <span class="summary-label">Reference:</span>
              <span class="summary-value ref-number">{{ advert.reference }}</span>
            </div>
            <div class="summary-row">
              <span class="summary-label">Title:</span>
              <span class="summary-value">{{ advert.advertTitle }}</span>
            </div>
            <div class="summary-row">
              <span class="summary-label">Client:</span>
              <span class="summary-value">{{ advert.clientName }}</span>
            </div>
            <div class="summary-row">
              <span class="summary-label">Product:</span>
              <span class="summary-value">{{ advert.productName }}</span>
            </div>
            <div class="summary-row">
              <span class="summary-label">Platform:</span>
              <span class="platform-badge" :class="`badge-${advert.platformCategory}`">
                {{ formatCategory(advert.platformCategory) }}
              </span>
            </div>
            <div class="summary-row">
              <span class="summary-label">Amount:</span>
              <span class="summary-value amount">{{ formatCurrency(advert.totalAmount) }}</span>
            </div>
            <div class="summary-row">
              <span class="summary-label">Created By:</span>
              <span class="summary-value">{{ advert.createdBy?.name || 'Unknown' }}</span>
            </div>
            <div class="summary-row">
              <span class="summary-label">Date:</span>
              <span class="summary-value">{{ formatDate(advert.createdAt) }}</span>
            </div>
          </div>
          
          <!-- Action Tabs -->
          <div class="action-tabs">
            <button 
              class="action-tab"
              :class="{ active: selectedAction === 'approve' }"
              @click="selectedAction = 'approve'"
            >
              ✓ Approve
            </button>
            <button 
              class="action-tab"
              :class="{ active: selectedAction === 'request_changes' }"
              @click="selectedAction = 'request_changes'"
            >
              ↻ Request Changes
            </button>
            <button 
              class="action-tab"
              :class="{ active: selectedAction === 'reject' }"
              @click="selectedAction = 'reject'"
            >
              ✗ Reject
            </button>
          </div>
          
          <!-- Comment/Reason Input -->
          <div class="form-group">
            <label>
              <span v-if="selectedAction === 'approve'">Comment (optional):</span>
              <span v-else-if="selectedAction === 'request_changes'">
                What changes are needed? <span class="required">*</span>
              </span>
              <span v-else>Reason for rejection: <span class="required">*</span></span>
            </label>
            <textarea 
              v-model="comment"
              rows="5"
              :placeholder="getPlaceholder()"
              :required="selectedAction !== 'approve'"
              class="comment-textarea"
            ></textarea>
            <small v-if="showError" class="error-message">
              Please provide a reason
            </small>
          </div>
          
          <!-- Additional Options for Approval -->
          <div v-if="selectedAction === 'approve'" class="additional-options">
            <label class="checkbox-label">
              <input type="checkbox" v-model="notifyClient">
              Notify client of approval
            </label>
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="handleClose">
            Cancel
          </button>
          
          <button 
            class="btn btn-primary"
            :class="{
              'btn-success': selectedAction === 'approve',
              'btn-warning': selectedAction === 'request_changes',
              'btn-danger': selectedAction === 'reject'
            }"
            @click="handleSubmit"
            :disabled="submitting"
          >
            <span v-if="submitting">Processing...</span>
            <span v-else-if="selectedAction === 'approve'">✓ Approve Advert</span>
            <span v-else-if="selectedAction === 'request_changes'">↻ Request Changes</span>
            <span v-else>✗ Reject Advert</span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  advert: {
    type: Object,
    required: true
  },
  show: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['approve', 'reject', 'request-changes', 'close'])

// State
const selectedAction = ref('approve')
const comment = ref('')
const notifyClient = ref(false)
const showError = ref(false)
const submitting = ref(false)

// Methods
const handleClose = () => {
  // Reset state
  selectedAction.value = 'approve'
  comment.value = ''
  notifyClient.value = false
  showError.value = false
  submitting.value = false
  
  emit('close')
}

const handleSubmit = async () => {
  // Validate required comment for reject and request_changes
  if (selectedAction.value !== 'approve' && !comment.value.trim()) {
    showError.value = true
    return
  }
  
  showError.value = false
  submitting.value = true
  
  try {
    if (selectedAction.value === 'approve') {
      await emit('approve', comment.value)
    } else if (selectedAction.value === 'reject') {
      await emit('reject', comment.value)
    } else {
      await emit('request-changes', comment.value)
    }
    
    // Don't close here - let parent component handle it after API call
  } catch (error) {
    console.error('Action failed:', error)
  } finally {
    submitting.value = false
  }
}

const getPlaceholder = () => {
  switch (selectedAction.value) {
    case 'approve':
      return 'Add any comments about this approval (optional)...'
    case 'request_changes':
      return 'Describe what changes are needed...'
    case 'reject':
      return 'Explain why this advert is being rejected...'
    default:
      return 'Enter your comments...'
  }
}

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
    return date.toLocaleString('en-UG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (error) {
    return dateString
  }
}

const formatCategory = (category) => {
  const categoryMap = {
    'print': 'Print Media',
    'tv': 'Television',
    'radio': 'Radio',
    'digital': 'Digital',
    'outdoor': 'Outdoor'
  }
  return categoryMap[category] || category
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
  max-width: 700px;
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

/* Advert Summary */
.advert-summary {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 25px;
  border: 1px solid #dee2e6;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.summary-row:last-child {
  border-bottom: none;
}

.summary-label {
  font-weight: 600;
  color: #666;
  font-size: 0.9em;
  min-width: 120px;
}

.summary-value {
  color: #333;
  font-size: 0.95em;
  text-align: right;
}

.summary-value.ref-number {
  font-family: monospace;
  font-weight: 600;
  color: #003366;
  background: white;
  padding: 4px 8px;
  border-radius: 4px;
}

.summary-value.amount {
  font-weight: 700;
  color: #28a745;
  font-size: 1.1em;
}

.platform-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.85em;
  font-weight: 500;
}

.badge-print { background: rgba(0, 102, 204, 0.1); color: #0066CC; }
.badge-tv { background: rgba(142, 68, 173, 0.1); color: #8E44AD; }
.badge-radio { background: rgba(230, 126, 34, 0.1); color: #E67E22; }
.badge-digital { background: rgba(46, 204, 113, 0.1); color: #2ECC71; }

/* Action Tabs */
.action-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.action-tab {
  flex: 1;
  padding: 12px;
  border: 2px solid #dee2e6;
  background: white;
  color: #666;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.95em;
  font-weight: 500;
  transition: all 0.3s;
}

.action-tab:hover {
  border-color: #adb5bd;
  background: #f8f9fa;
}

.action-tab.active {
  background: #28a745;
  color: white;
  border-color: #28a745;
}

.action-tab.active:nth-child(2) {
  background: #ffc107;
  border-color: #ffc107;
  color: #333;
}

.action-tab.active:nth-child(3) {
  background: #dc3545;
  border-color: #dc3545;
}

/* Form Group */
.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 10px;
  font-weight: 600;
  color: #333;
  font-size: 0.95em;
}

.required {
  color: #dc3545;
}

.comment-textarea {
  width: 100%;
  padding: 12px 15px;
  border: 2px solid #dee2e6;
  border-radius: 8px;
  font-size: 1em;
  font-family: inherit;
  resize: vertical;
  transition: all 0.3s;
  min-height: 120px;
}

.comment-textarea:focus {
  outline: none;
  border-color: #0066CC;
  box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
}

.error-message {
  display: block;
  margin-top: 8px;
  color: #dc3545;
  font-size: 0.85em;
}

/* Additional Options */
.additional-options {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-size: 0.95em;
  color: #333;
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

/* Modal Footer */
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

.btn-success {
  background: #28a745;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #218838;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(40, 167, 69, 0.3);
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #c82333;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(220, 53, 69, 0.3);
}

.btn-warning {
  background: #ffc107;
  color: #333;
}

.btn-warning:hover:not(:disabled) {
  background: #e0a800;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(255, 193, 7, 0.3);
}

/* Responsive */
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
  
  .action-tabs {
    flex-direction: column;
  }
  
  .summary-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }
  
  .summary-value {
    text-align: left;
  }
  
  .modal-footer {
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
  }
}
</style>