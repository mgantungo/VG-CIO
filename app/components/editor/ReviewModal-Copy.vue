<template>
  <div v-if="show" class="review-modal-overlay" @click.self="close">
    <div class="review-modal">
      <div class="modal-header">
        <h2>Review Advert</h2>
        <button class="modal-close" @click="close">×</button>
      </div>

      <div class="modal-body">
        <div class="advert-info">
          <div class="info-row">
            <strong>Reference:</strong>
            <span>{{ advert.reference }}</span>
          </div>
          <div class="info-row">
            <strong>Client:</strong>
            <span>{{ advert.clientName }}</span>
          </div>
          <div class="info-row">
            <strong>Title:</strong>
            <span>{{ advert.advertTitle }}</span>
          </div>
          <div class="info-row">
            <strong>Platform:</strong>
            <span>{{ advert.platform }}</span>
          </div>
          <div class="info-row">
            <strong>Amount:</strong>
            <span class="amount">{{ formatCurrency(advert.amount) }}</span>
          </div>
        </div>

        <div v-if="advert.files && advert.files.length > 0" class="files-section">
          <h3>Attached Files</h3>
          <div class="file-list">
            <div v-for="file in advert.files" :key="file.id" class="file-item">
              <div class="file-info">
                <div class="file-icon">{{ getFileIcon(file.name) }}</div>
                <div>
                  <strong>{{ file.name }}</strong>
                  <div class="file-meta">{{ formatFileSize(file.size) }}</div>
                </div>
              </div>
              <button class="btn btn-info btn-sm" @click="previewFile(file)">
                Preview
              </button>
            </div>
          </div>
        </div>

        <div class="comment-section">
          <h3>Review Comments</h3>
          <div v-if="previousComments.length > 0" class="previous-comments">
            <div v-for="comment in previousComments" :key="comment.id" class="previous-comment">
              <div class="comment-header">
                <span class="comment-author">{{ comment.author }}</span>
                <span class="comment-date">{{ formatRelativeTime(comment.createdAt) }}</span>
              </div>
              <div class="comment-text">{{ comment.text }}</div>
            </div>
          </div>

          <div class="new-comment">
            <label for="reviewComment">Your Comments *</label>
            <textarea
              id="reviewComment"
              v-model="comment"
              placeholder="Provide detailed comments for your decision..."
              rows="4"
              :class="{ 'error': errors.comment }"
              @input="clearError('comment')"
            ></textarea>
            <div v-if="errors.comment" class="error-message">
              {{ errors.comment }}
            </div>
          </div>
        </div>

        <div v-if="action === 'request_changes'" class="changes-section">
          <h3>Requested Changes</h3>
          <div class="form-group">
            <label for="deadline">Deadline for Changes</label>
            <input
              id="deadline"
              v-model="deadline"
              type="date"
              :min="minDeadlineDate"
              :class="{ 'error': errors.deadline }"
              @change="clearError('deadline')"
            >
            <div v-if="errors.deadline" class="error-message">
              {{ errors.deadline }}
            </div>
          </div>
          
          <div class="form-group">
            <label for="priority">Priority</label>
            <select
              id="priority"
              v-model="priority"
              :class="{ 'error': errors.priority }"
              @change="clearError('priority')"
            >
              <option value="">Select priority</option>
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
            <div v-if="errors.priority" class="error-message">
              {{ errors.priority }}
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <div class="action-buttons">
          <button 
            class="btn btn-danger" 
            @click="setAction('reject')"
            :class="{ 'active': action === 'reject' }"
          >
            Reject
          </button>
          
          <button 
            v-if="showRequestChanges"
            class="btn btn-warning" 
            @click="setAction('request_changes')"
            :class="{ 'active': action === 'request_changes' }"
          >
            Request Changes
          </button>
          
          <button 
            class="btn btn-success" 
            @click="setAction('approve')"
            :class="{ 'active': action === 'approve' }"
          >
            Approve
          </button>
        </div>

        <div class="submit-section">
          <div class="selected-action">
            Selected Action: 
            <strong :class="actionClass">{{ formatAction(action) }}</strong>
          </div>
          
          <div class="submit-buttons">
            <button class="btn btn-secondary" @click="close">
              Cancel
            </button>
            
            <button 
              class="btn btn-primary" 
              @click="submitReview"
              :disabled="submitting || !action"
            >
              {{ submitting ? 'Processing...' : 'Submit Review' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { formatCurrency, formatFileSize, formatRelativeTime } from '~/utils/formatters'

const props = defineProps({
  advert: {
    type: Object,
    required: true
  },
  show: {
    type: Boolean,
    default: false
  },
  submitting: {
    type: Boolean,
    default: false
  },
  showRequestChanges: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits([
  'approve',
  'reject',
  'request-changes',
  'close'
])

const action = ref('')
const comment = ref('')
const deadline = ref('')
const priority = ref('normal')
const errors = ref({})

const minDeadlineDate = computed(() => {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return tomorrow.toISOString().split('T')[0]
})

const previousComments = computed(() => {
  return props.advert.comments || []
})

const actionClass = computed(() => {
  const classes = {
    approve: 'text-success',
    reject: 'text-danger',
    request_changes: 'text-warning'
  }
  return classes[action.value] || ''
})

const getFileIcon = (filename) => {
  const ext = filename.split('.').pop().toLowerCase()
  if (['doc', 'docx'].includes(ext)) return '📄'
  if (['pdf'].includes(ext)) return '📕'
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return '🖼️'
  if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) return '🎬'
  if (['xls', 'xlsx'].includes(ext)) return '📊'
  if (['zip', 'rar', '7z'].includes(ext)) return '🗜️'
  return '📎'
}

const setAction = (selectedAction) => {
  action.value = selectedAction
  clearErrors()
}

const formatAction = (action) => {
  const actions = {
    approve: 'Approve',
    reject: 'Reject',
    request_changes: 'Request Changes'
  }
  return actions[action] || ''
}

const validate = () => {
  errors.value = {}
  
  if (!action.value) {
    errors.value.action = 'Please select an action'
  }
  
  if (!comment.value.trim()) {
    errors.value.comment = 'Please provide comments for your decision'
  } else if (comment.value.trim().length < 10) {
    errors.value.comment = 'Comments must be at least 10 characters'
  }
  
  if (action.value === 'request_changes') {
    if (!deadline.value) {
      errors.value.deadline = 'Please set a deadline for changes'
    }
    
    if (!priority.value) {
      errors.value.priority = 'Please select priority'
    }
  }
  
  return Object.keys(errors.value).length === 0
}

const clearError = (field) => {
  if (errors.value[field]) {
    delete errors.value[field]
  }
}

const clearErrors = () => {
  errors.value = {}
}

const submitReview = () => {
  if (!validate()) return
  
  const reviewData = {
    advertId: props.advert.id,
    action: action.value,
    comment: comment.value.trim(),
    deadline: action.value === 'request_changes' ? deadline.value : null,
    priority: action.value === 'request_changes' ? priority.value : null
  }
  
  switch (action.value) {
    case 'approve':
      emit('approve', reviewData)
      break
    case 'reject':
      emit('reject', reviewData)
      break
    case 'request_changes':
      emit('request-changes', reviewData)
      break
  }
  
  resetForm()
}

const previewFile = (file) => {
  // Enhanced preview functionality
  if (file.previewUrl) {
    window.open(file.previewUrl, '_blank')
  } else {
    // Fallback to download
    downloadFile(file)
  }
}

const downloadFile = (file) => {
  // Implement actual file download
  const link = document.createElement('a')
  link.href = file.url || `#${file.id}`
  link.download = file.name
  link.target = '_blank'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const close = () => {
  emit('close')
  resetForm()
}

const resetForm = () => {
  action.value = ''
  comment.value = ''
  deadline.value = ''
  priority.value = 'normal'
  errors.value = {}
}

// Watch for show prop changes
watch(() => props.show, (newValue) => {
  if (!newValue) {
    resetForm()
  } else {
    // Reset form when modal opens
    resetForm()
  }
})

// Keyboard shortcuts
const handleKeydown = (e) => {
  if (!props.show) return
  
  if (e.key === 'Escape') {
    close()
  } else if (e.key === 'Enter' && e.ctrlKey && action.value && comment.value.trim().length >= 10) {
    submitReview()
  }
}

// Add keyboard event listener
import { onMounted, onUnmounted } from 'vue'
onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})
onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.review-modal-overlay {
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

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.review-modal {
  background: white;
  border-radius: 10px;
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 25px 30px;
  border-bottom: 2px solid #F5F5F5;
  background: linear-gradient(135deg, #003366 0%, #004488 100%);
  border-radius: 10px 10px 0 0;
}

.modal-header h2 {
  color: white;
  margin: 0;
  font-size: 1.5em;
  font-weight: 600;
}

.modal-close {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  font-size: 1.8em;
  color: white;
  cursor: pointer;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s;
}

.modal-close:hover {
  background: rgba(255, 255, 255, 0.2);
  color: #ff6b6b;
  transform: rotate(90deg);
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 30px;
  background: #fafafa;
}

.advert-info {
  background: white;
  padding: 25px;
  border-radius: 10px;
  margin-bottom: 30px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid #eaeaea;
}

.info-row {
  display: flex;
  margin-bottom: 15px;
  align-items: center;
  padding-bottom: 15px;
  border-bottom: 1px solid #f0f0f0;
}

.info-row:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.info-row strong {
  width: 120px;
  color: #555;
  font-weight: 600;
  flex-shrink: 0;
}

.info-row span {
  flex: 1;
  color: #333;
  font-weight: 500;
}

.info-row .amount {
  color: #E31E24;
  font-weight: bold;
  font-size: 1.2em;
}

.files-section {
  margin-bottom: 30px;
}

.files-section h3,
.comment-section h3,
.changes-section h3 {
  color: #003366;
  margin-bottom: 20px;
  font-size: 1.3em;
  font-weight: 600;
  padding-bottom: 10px;
  border-bottom: 2px solid #eaeaea;
}

.file-list {
  max-height: 250px;
  overflow-y: auto;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 15px;
  background: white;
}

.file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: white;
  border-radius: 8px;
  margin-bottom: 10px;
  border: 1px solid #f0f0f0;
  transition: all 0.3s;
}

.file-item:hover {
  border-color: #0066CC;
  box-shadow: 0 3px 12px rgba(0, 102, 204, 0.1);
  transform: translateY(-2px);
}

.file-item:last-child {
  margin-bottom: 0;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.file-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #0066CC 0%, #004488 100%);
  color: white;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4em;
  flex-shrink: 0;
}

.file-meta {
  font-size: 0.9em;
  color: #777;
  margin-top: 4px;
}

.previous-comments {
  margin-bottom: 25px;
  max-height: 200px;
  overflow-y: auto;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.previous-comment {
  background: white;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 12px;
  border-left: 4px solid #0066CC;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.previous-comment:last-child {
  margin-bottom: 0;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 0.9em;
  align-items: center;
}

.comment-author {
  font-weight: 600;
  color: #003366;
  background: #eef5ff;
  padding: 4px 12px;
  border-radius: 20px;
}

.comment-date {
  color: #888;
  font-size: 0.85em;
}

.comment-text {
  color: #333;
  line-height: 1.6;
  font-size: 1em;
  padding-left: 5px;
}

.new-comment {
  margin-top: 25px;
}

.new-comment label {
  display: block;
  margin-bottom: 10px;
  color: #333;
  font-weight: 600;
  font-size: 1em;
}

.new-comment textarea {
  width: 100%;
  padding: 15px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1em;
  font-family: inherit;
  resize: vertical;
  min-height: 120px;
  transition: all 0.3s;
  background: white;
}

.new-comment textarea:focus {
  outline: none;
  border-color: #0066CC;
  box-shadow: 0 0 0 4px rgba(0, 102, 204, 0.1);
  background: white;
}

.new-comment textarea.error {
  border-color: #dc3545;
  background-color: rgba(220, 53, 69, 0.02);
}

.changes-section {
  margin-top: 30px;
  padding-top: 30px;
  border-top: 2px dashed #ddd;
}

.form-group {
  margin-bottom: 25px;
}

.form-group label {
  display: block;
  margin-bottom: 10px;
  color: #333;
  font-weight: 600;
  font-size: 1em;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 12px 15px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1em;
  transition: all 0.3s;
  background: white;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #0066CC;
  box-shadow: 0 0 0 4px rgba(0, 102, 204, 0.1);
}

.form-group input.error,
.form-group select.error {
  border-color: #dc3545;
  background-color: rgba(220, 53, 69, 0.02);
}

.error-message {
  color: #dc3545;
  font-size: 0.9em;
  margin-top: 8px;
  padding-left: 5px;
  font-weight: 500;
}

.modal-footer {
  padding: 25px 30px;
  border-top: 2px solid #F5F5F5;
  background: white;
  border-bottom-left-radius: 10px;
  border-bottom-right-radius: 10px;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
}

.action-buttons {
  display: flex;
  gap: 15px;
  margin-bottom: 30px;
  justify-content: center;
}

.submit-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
}

.selected-action {
  color: #555;
  font-size: 1em;
  font-weight: 500;
}

.selected-action strong {
  margin-left: 10px;
  font-size: 1.2em;
  font-weight: 600;
}

.text-success {
  color: #28a745;
}

.text-danger {
  color: #dc3545;
}

.text-warning {
  color: #ff9800;
}

.submit-buttons {
  display: flex;
  gap: 15px;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1em;
  font-weight: 600;
  transition: all 0.3s;
  min-width: 140px;
  text-align: center;
  letter-spacing: 0.5px;
  position: relative;
  overflow: hidden;
}

.btn::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 5px;
  height: 5px;
  background: rgba(255, 255, 255, 0.5);
  opacity: 0;
  border-radius: 100%;
  transform: scale(1, 1) translate(-50%);
  transform-origin: 50% 50%;
}

.btn:focus:not(:active)::after {
  animation: ripple 1s ease-out;
}

@keyframes ripple {
  0% {
    transform: scale(0, 0);
    opacity: 0.5;
  }
  20% {
    transform: scale(25, 25);
    opacity: 0.3;
  }
  100% {
    opacity: 0;
    transform: scale(40, 40);
  }
}

.btn-primary {
  background: linear-gradient(135deg, #E31E24 0%, #c01820 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #c01820 0%, #a0141a 100%);
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(227, 30, 36, 0.3);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

.btn-secondary {
  background: linear-gradient(135deg, #0066CC 0%, #004488 100%);
  color: white;
}

.btn-secondary:hover {
  background: linear-gradient(135deg, #004488 0%, #003366 100%);
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 102, 204, 0.3);
}

.btn-success {
  background: linear-gradient(135deg, #28a745 0%, #218838 100%);
  color: white;
}

.btn-success:hover,
.btn-success.active {
  background: linear-gradient(135deg, #218838 0%, #1e7e34 100%);
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(40, 167, 69, 0.3);
}

.btn-success.active {
  box-shadow: 0 0 0 4px rgba(40, 167, 69, 0.2);
}

.btn-danger {
  background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
  color: white;
}

.btn-danger:hover,
.btn-danger.active {
  background: linear-gradient(135deg, #c82333 0%, #bd2130 100%);
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(220, 53, 69, 0.3);
}

.btn-danger.active {
  box-shadow: 0 0 0 4px rgba(220, 53, 69, 0.2);
}

.btn-warning {
  background: linear-gradient(135deg, #ff9800 0%, #e68900 100%);
  color: white;
}

.btn-warning:hover,
.btn-warning.active {
  background: linear-gradient(135deg, #e68900 0%, #cc7a00 100%);
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(255, 152, 0, 0.3);
}

.btn-warning.active {
  box-shadow: 0 0 0 4px rgba(255, 152, 0, 0.2);
}

.btn-info {
  background: linear-gradient(135deg, #17a2b8 0%, #138496 100%);
  color: white;
}

.btn-info:hover {
  background: linear-gradient(135deg, #138496 0%, #117a8b 100%);
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(23, 162, 184, 0.3);
}

.btn-sm {
  padding: 8px 16px;
  font-size: 0.9em;
  min-width: auto;
  border-radius: 6px;
}

@media (max-width: 768px) {
  .review-modal {
    max-height: 95vh;
    max-width: 95vw;
  }
  
  .modal-header,
  .modal-body,
  .modal-footer {
    padding: 20px;
  }
  
  .info-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }
  
  .info-row strong {
    width: 100%;
  }
  
  .action-buttons {
    flex-wrap: wrap;
  }
  
  .submit-section {
    flex-direction: column;
    align-items: stretch;
    gap: 15px;
  }
  
  .submit-buttons {
    width: 100%;
    flex-direction: column;
  }
  
  .btn {
    min-width: 100%;
    margin-bottom: 5px;
  }
  
  .file-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .file-info {
    width: 100%;
  }
  
  .file-icon {
    width: 40px;
    height: 40px;
    font-size: 1.2em;
  }
}
</style>