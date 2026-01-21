<template>
  <div class="advert-details-page">
    <div class="page-header">
      <div class="header-content">
        <h1>Advert Details</h1>
        <p>View and manage advert information</p>
      </div>
      <div class="header-actions">
        <button class="btn btn-secondary" @click="goBack">
          ← Back
        </button>
        <button 
          v-if="advert.status === 'draft' && isOwner"
          class="btn btn-warning"
          @click="editAdvert"
        >
          Edit
        </button>
        <button 
          v-if="advert.status === 'draft' && isOwner"
          class="btn btn-primary"
          @click="submitForReview"
        >
          Submit for Review
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <div>Loading advert details...</div>
    </div>

    <div v-else-if="advert" class="advert-content">
      <div class="content-grid">
        <!-- Main Information -->
        <div class="content-card">
          <div class="card-header">
            <h2>Basic Information</h2>
            <span :class="`status-badge status-${advert.status}`">
              {{ formatStatus(advert.status) }}
            </span>
          </div>
          
          <div class="info-grid">
            <div class="info-item">
              <label>Reference Number</label>
              <div class="info-value">{{ advert.reference }}</div>
            </div>
            <div class="info-item">
              <label>Advert Title</label>
              <div class="info-value">{{ advert.title }}</div>
            </div>
            <div class="info-item">
              <label>Client</label>
              <div class="info-value">{{ advert.clientName }}</div>
            </div>
            <div class="info-item">
              <label>Contact Person</label>
              <div class="info-value">{{ advert.contactPerson || 'N/A' }}</div>
            </div>
            <div class="info-item">
              <label>Email</label>
              <div class="info-value">{{ advert.email }}</div>
            </div>
            <div class="info-item">
              <label>Phone</label>
              <div class="info-value">{{ advert.phone }}</div>
            </div>
          </div>
        </div>

        <!-- Platform & Pricing -->
        <div class="content-card">
          <div class="card-header">
            <h2>Platform & Pricing</h2>
          </div>
          
          <div class="info-grid">
            <div class="info-item">
              <label>Platform Category</label>
              <div class="info-value">{{ formatPlatformCategory(advert.platformCategory) }}</div>
            </div>
            <div class="info-item">
              <label>Specific Platform</label>
              <div class="info-value">{{ advert.specificPlatform }}</div>
            </div>
            <div class="info-item">
              <label>Product/Section</label>
              <div class="info-value">{{ advert.productName }}</div>
            </div>
            <div class="info-item">
              <label>Ad Size/Duration</label>
              <div class="info-value">{{ advert.adSize }}</div>
            </div>
            <div class="info-item">
              <label>Color/Type</label>
              <div class="info-value">{{ formatAdType(advert.adType) }}</div>
            </div>
            <div class="info-item">
              <label>Total Amount</label>
              <div class="info-value amount">{{ formatCurrency(advert.totalAmount) }}</div>
            </div>
          </div>
        </div>

        <!-- Schedule & Payment -->
        <div class="content-card">
          <div class="card-header">
            <h2>Schedule & Payment</h2>
          </div>
          
          <div class="info-grid">
            <div class="info-item">
              <label>Start Date</label>
              <div class="info-value">{{ formatDate(advert.startDate) }}</div>
            </div>
            <div class="info-item">
              <label>End Date</label>
              <div class="info-value">{{ advert.endDate ? formatDate(advert.endDate) : 'N/A' }}</div>
            </div>
            <div class="info-item">
              <label>Frequency</label>
              <div class="info-value">{{ advert.frequency }} insertion(s)</div>
            </div>
            <div class="info-item">
              <label>Payment Method</label>
              <div class="info-value">{{ formatPaymentMethod(advert.paymentMethod) }}</div>
            </div>
            <div class="info-item">
              <label>Created Date</label>
              <div class="info-value">{{ formatDateTime(advert.createdAt) }}</div>
            </div>
            <div class="info-item" v-if="advert.submittedAt">
              <label>Submitted Date</label>
              <div class="info-value">{{ formatDateTime(advert.submittedAt) }}</div>
            </div>
          </div>
        </div>

        <!-- Files -->
        <div class="content-card">
          <div class="card-header">
            <h2>Attached Files</h2>
            <span class="file-count">{{ advert.files?.length || 0 }} files</span>
          </div>
          
          <div v-if="advert.files && advert.files.length > 0" class="file-list">
            <div v-for="file in advert.files" :key="file.id" class="file-item">
              <div class="file-info">
                <div class="file-icon">{{ getFileIcon(file.name) }}</div>
                <div>
                  <strong>{{ file.name }}</strong>
                  <div class="file-meta">
                    {{ formatFileSize(file.size) }}
                    • Uploaded {{ formatRelativeTime(file.uploadedAt) }}
                  </div>
                </div>
              </div>
              <button class="btn btn-info btn-sm" @click="downloadFile(file)">
                Download
              </button>
            </div>
          </div>
          <div v-else class="empty-state">
            No files attached
          </div>
        </div>

        <!-- Special Instructions -->
        <div v-if="advert.specialInstructions" class="content-card">
          <div class="card-header">
            <h2>Special Instructions</h2>
          </div>
          <div class="instructions">
            {{ advert.specialInstructions }}
          </div>
        </div>

        <!-- Workflow Timeline -->
        <div class="content-card">
          <div class="card-header">
            <h2>Workflow Timeline</h2>
          </div>
          <div class="timeline">
            <div v-for="log in workflowLogs" :key="log.id" class="timeline-item">
              <div class="timeline-date">{{ formatDateTime(log.timestamp) }}</div>
              <div class="timeline-content">
                <strong>{{ log.action }}</strong> by {{ log.performedBy }}
                <div v-if="log.notes" class="timeline-notes">
                  {{ log.notes }}
                </div>
                <div class="timeline-status">
                  {{ log.previousStatus }} → {{ log.newStatus }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Comments -->
        <div class="content-card">
          <div class="card-header">
            <h2>Comments</h2>
          </div>
          <div class="comments-section">
            <div v-if="advert.comments && advert.comments.length > 0" class="comment-list">
              <div v-for="comment in advert.comments" :key="comment.id" class="comment-item">
                <div class="comment-header">
                  <span class="comment-author">{{ comment.author }}</span>
                  <span class="comment-date">{{ formatDateTime(comment.createdAt) }}</span>
                </div>
                <div class="comment-body">
                  {{ comment.text }}
                </div>
                <div class="comment-type" :class="`type-${comment.type}`">
                  {{ formatCommentType(comment.type) }}
                </div>
              </div>
            </div>
            <div v-else class="empty-state">
              No comments yet
            </div>
            
            <div v-if="canComment" class="add-comment">
              <textarea 
                v-model="newComment"
                placeholder="Add a comment..."
                rows="3"
              ></textarea>
              <button class="btn btn-primary" @click="addComment">
                Add Comment
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="error-container">
      <h2>Advert Not Found</h2>
      <p>The advert you're looking for doesn't exist or you don't have permission to view it.</p>
      <button class="btn btn-primary" @click="goBack">
        Go Back
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from '#app'
import { useAuth } from '~/composables/useAuth'
import { useAdvertsStore } from '~/stores/adverts'
import { formatCurrency, formatDate, formatDateTime, formatRelativeTime, formatFileSize } from '~/utils/formatters'

const route = useRoute()
const router = useRouter()
const { user, userRole } = useAuth()
const advertsStore = useAdvertsStore()

const advert = ref(null)
const workflowLogs = ref([])
const newComment = ref('')
const loading = ref(true)
const error = ref(null)

const advertId = route.params.id

const isOwner = computed(() => {
  return advert.value?.createdBy === user.value?.id
})

const canComment = computed(() => {
  return userRole.value === 'editor' || userRole.value === 'manager' || isOwner.value
})

onMounted(() => {
  loadAdvert()
})

const loadAdvert = async () => {
  loading.value = true
  try {
    // Mock data - in production, fetch from API
    advert.value = {
      id: advertId,
      reference: '#ADV-2025-001',
      title: 'New Year Campaign',
      clientName: 'MTN Uganda',
      contactPerson: 'John Marketing',
      email: 'marketing@mtn.co.ug',
      phone: '+256 700 123456',
      platformCategory: 'print',
      specificPlatform: 'New Vision',
      productName: 'Front Page',
      adSize: 'Full Page',
      adType: 'full_color',
      totalAmount: 15500000,
      startDate: '2025-01-15',
      endDate: '2025-01-31',
      frequency: 5,
      paymentMethod: 'credit',
      status: 'pending_review',
      specialInstructions: 'Please ensure brand colors are accurate. Include MTN logo prominently.',
      createdAt: '2025-01-04T09:30:00Z',
      submittedAt: '2025-01-04T09:35:00Z',
      createdBy: 'user1',
      files: [
        {
          id: '1',
          name: 'Campaign_Brief.docx',
          size: 2300000,
          uploadedAt: '2025-01-04T09:31:00Z'
        },
        {
          id: '2',
          name: 'MTN_Logo_HighRes.png',
          size: 5800000,
          uploadedAt: '2025-01-04T09:32:00Z'
        }
      ],
      comments: [
        {
          id: '1',
          author: 'Editor',
          text: 'Please provide high-resolution logo files.',
          type: 'review',
          createdAt: '2025-01-04T10:15:00Z'
        }
      ]
    }

    workflowLogs.value = [
      {
        id: '1',
        action: 'created',
        performedBy: 'John Doe',
        previousStatus: 'none',
        newStatus: 'draft',
        timestamp: '2025-01-04T09:30:00Z',
        notes: ''
      },
      {
        id: '2',
        action: 'submitted',
        performedBy: 'John Doe',
        previousStatus: 'draft',
        newStatus: 'pending_review',
        timestamp: '2025-01-04T09:35:00Z',
        notes: ''
      }
    ]
  } catch (err) {
    error.value = err.message || 'Failed to load advert'
    console.error('Error loading advert:', err)
  } finally {
    loading.value = false
  }
}

const formatStatus = (status) => {
  const statusMap = {
    draft: 'Draft',
    pending_review: 'Pending Review',
    editor_approved: 'Editor Approved',
    editor_rejected: 'Editor Rejected',
    manager_approved: 'Manager Approved',
    manager_rejected: 'Manager Rejected',
    published: 'Published'
  }
  return statusMap[status] || status
}

const formatPlatformCategory = (category) => {
  const categoryMap = {
    print: 'Print Media',
    tv: 'Television',
    radio: 'Radio',
    digital: 'Digital Media',
    outdoor: 'Outdoor/OOH'
  }
  return categoryMap[category] || category
}

const formatAdType = (type) => {
  return type === 'full_color' ? 'Full Color' : 'Black & White'
}

const formatPaymentMethod = (method) => {
  const methodMap = {
    cash: 'Cash',
    credit: 'Credit',
    cheque: 'Cheque',
    bank_transfer: 'Bank Transfer',
    mobile_money: 'Mobile Money'
  }
  return methodMap[method] || method
}

const formatCommentType = (type) => {
  const typeMap = {
    review: 'Review Comment',
    approval: 'Approval Comment',
    rejection: 'Rejection Comment',
    general: 'General Comment'
  }
  return typeMap[type] || type
}

const getFileIcon = (filename) => {
  const ext = filename.split('.').pop().toLowerCase()
  if (['doc', 'docx'].includes(ext)) return '📄'
  if (['pdf'].includes(ext)) return '📕'
  if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return '🖼️'
  if (['mp4', 'mov', 'avi'].includes(ext)) return '🎬'
  return '📎'
}

const goBack = () => {
  router.back()
}

const editAdvert = () => {
  router.push(`/dashboard/booking/new?id=${advertId}`)
}

const submitForReview = async () => {
  if (confirm('Submit this advert for editorial review?')) {
    try {
      // Call API to submit
      alert('Advert submitted for review successfully!')
      await loadAdvert()
    } catch (err) {
      console.error('Error submitting advert:', err)
      alert('Failed to submit advert')
    }
  }
}

const downloadFile = (file) => {
  // Implement file download
  alert(`Downloading ${file.name}`)
}

const addComment = () => {
  if (!newComment.value.trim()) return

  const comment = {
    id: Date.now().toString(),
    author: user.value?.name || 'You',
    text: newComment.value,
    type: userRole.value === 'editor' ? 'review' : 'general',
    createdAt: new Date().toISOString()
  }

  advert.value.comments.unshift(comment)
  newComment.value = ''
}
</script>

<style scoped>
.advert-details-page {
  width: 100%;
}

.page-header {
  background: white;
  padding: 20px 30px;
  border-radius: 10px;
  margin-bottom: 30px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.header-content h1 {
  color: #003366;
  margin-bottom: 10px;
}

.header-content p {
  color: #666;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.loading-container {
  text-align: center;
  padding: 60px;
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

.error-container {
  text-align: center;
  padding: 60px;
}

.error-container h2 {
  color: #dc3545;
  margin-bottom: 15px;
}

.error-container p {
  color: #666;
  margin-bottom: 30px;
}

.advert-content {
  width: 100%;
}

.content-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
}

.content-card {
  background: white;
  padding: 25px;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #F5F5F5;
}

.card-header h2 {
  color: #003366;
  font-size: 1.2em;
}

.status-badge {
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 0.85em;
  font-weight: 600;
  text-transform: uppercase;
}

.status-draft {
  background: #ffeaa7;
  color: #636e72;
}

.status-pending_review {
  background: #74b9ff;
  color: #0984e3;
}

.status-editor_approved {
  background: #55efc4;
  color: #00b894;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.info-item {
  margin-bottom: 10px;
}

.info-item label {
  display: block;
  color: #666;
  font-size: 0.9em;
  margin-bottom: 5px;
}

.info-value {
  color: #333;
  font-weight: 500;
}

.info-value.amount {
  color: #E31E24;
  font-weight: bold;
  font-size: 1.1em;
}

.file-list {
  margin-top: 15px;
}

.file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #F5F5F5;
  border-radius: 5px;
  margin-bottom: 10px;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.file-icon {
  width: 40px;
  height: 40px;
  background: #0066CC;
  color: white;
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2em;
}

.file-meta {
  font-size: 0.85em;
  color: #666;
  margin-top: 4px;
}

.file-count {
  color: #666;
  font-size: 0.9em;
}

.instructions {
  padding: 15px;
  background: #F5F5F5;
  border-radius: 5px;
  color: #333;
  line-height: 1.6;
}

.timeline {
  position: relative;
  padding-left: 30px;
  margin-top: 20px;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #DDDDDD;
}

.timeline-item {
  position: relative;
  padding-bottom: 30px;
}

.timeline-item::before {
  content: '';
  position: absolute;
  left: -35px;
  top: 0;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #0066CC;
  border: 2px solid white;
  box-shadow: 0 0 0 2px #0066CC;
}

.timeline-date {
  color: #999;
  font-size: 0.85em;
  margin-bottom: 5px;
}

.timeline-content {
  background: white;
  padding: 15px;
  border-radius: 5px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.timeline-notes {
  margin-top: 8px;
  padding: 8px;
  background: #F5F5F5;
  border-radius: 3px;
  font-size: 0.9em;
  color: #666;
}

.timeline-status {
  margin-top: 8px;
  font-size: 0.85em;
  color: #E31E24;
  font-weight: 500;
}

.comments-section {
  margin-top: 15px;
}

.comment-list {
  margin-bottom: 20px;
}

.comment-item {
  background: #F5F5F5;
  padding: 15px;
  border-radius: 5px;
  margin-bottom: 10px;
  border-left: 4px solid #0066CC;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 0.9em;
}

.comment-author {
  font-weight: bold;
  color: #003366;
}

.comment-date {
  color: #999;
}

.comment-body {
  color: #333;
  line-height: 1.5;
}

.comment-type {
  display: inline-block;
  margin-top: 8px;
  padding: 3px 8px;
  border-radius: 3px;
  font-size: 0.8em;
  font-weight: 500;
}

.type-review {
  background: #ffeaa7;
  color: #636e72;
}

.type-approval {
  background: #55efc4;
  color: #00b894;
}

.type-rejection {
  background: #ff7675;
  color: #d63031;
}

.add-comment {
  margin-top: 20px;
}

.add-comment textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #DDDDDD;
  border-radius: 5px;
  margin-bottom: 10px;
  font-family: inherit;
  font-size: 1em;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #999;
  font-style: italic;
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

.btn-warning {
  background: #ffc107;
  color: #333333;
}

.btn-warning:hover {
  background: #e0a800;
}

.btn-info {
  background: #17a2b8;
  color: white;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 0.9em;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 15px;
  }
  
  .header-actions {
    width: 100%;
    justify-content: flex-end;
  }
  
  .content-grid {
    grid-template-columns: 1fr;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>