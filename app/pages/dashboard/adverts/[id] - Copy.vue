<!--pages/dashboard/adverts/[id].vue-->
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
          v-if="advert && advert.status === 'draft' && isOwner"
          class="btn btn-warning"
          @click="editAdvert"
        >
          ✏️ Edit
        </button>
        <button 
          v-if="advert && advert.status === 'draft' && isOwner"
          class="btn btn-primary"
          @click="submitForReview"
        >
          📤 Submit for Review
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <div>Loading advert details...</div>
    </div>

    <div v-else-if="error" class="error-container">
      <h2>Error Loading Advert</h2>
      <p>{{ error }}</p>
      <button class="btn btn-primary" @click="loadAdvert">
        🔄 Retry
      </button>
      <button class="btn btn-secondary" @click="goBack">
        ← Back to List
      </button>
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
              <div class="info-value ref-number">{{ advert.reference }}</div>
            </div>
            <div class="info-item">
              <label>Advert Title</label>
              <div class="info-value">{{ advert.title }}</div>
            </div>
            <div class="info-item">
              <label>Created By</label>
              <div class="info-value">
                {{ advert.vgams_user?.name || 'Unknown' }}
                <div class="user-role">{{ advert.vgams_user?.role || '' }}</div>
              </div>
            </div>
            <div class="info-item">
              <label>Created Date</label>
              <div class="info-value">{{ formatDateTime(advert.createdAt) }}</div>
            </div>
            <div class="info-item">
              <label>Last Updated</label>
              <div class="info-value">{{ formatDateTime(advert.updatedAt) }}</div>
            </div>
          </div>
        </div>

        <!-- Client Information -->
        <div class="content-card">
          <div class="card-header">
            <h2>Client Information</h2>
          </div>
          
          <div class="info-grid">
            <div class="info-item">
              <label>Client Name</label>
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
            <div class="info-item">
              <label>Client Company</label>
              <div class="info-value">{{ advert.client?.company_name || 'N/A' }}</div>
            </div>
          </div>
        </div>

        <!-- Platform & Product -->
        <div class="content-card">
          <div class="card-header">
            <h2>Platform & Product</h2>
          </div>
          
          <div class="info-grid">
            <div class="info-item">
              <label>Platform Category</label>
              <div class="info-value">{{ platformCategoryName }}</div>
            </div>
            <div class="info-item">
              <label>Product</label>
              <div class="info-value">
                {{ productName }}
                <div v-if="productCirculation !== 'N/A'" class="product-circulation">
                  Circulation: {{ productCirculation }}
                </div>
              </div>
            </div>
            <div class="info-item">
              <label>Product Description</label>
              <div class="info-value">{{ productDescription || 'N/A' }}</div>
            </div>
            <div class="info-item">
              <label>Rate Card</label>
              <div class="info-value">{{ rateCardName }}</div>
            </div>
            <div class="info-item">
              <label>Ad Size/Duration</label>
              <div class="info-value">{{ advert.adSize || 'N/A' }}</div>
            </div>
            <div class="info-item">
              <label>Color/Type</label>
              <div class="info-value">{{ formatAdType(advert.adType) }}</div>
            </div>
          </div>
        </div>

        <!-- Pricing Information -->
        <div class="content-card">
          <div class="card-header">
            <h2>Pricing Information</h2>
          </div>
          
          <div class="pricing-grid">
            <div class="pricing-item">
              <label>Base Price</label>
              <div class="pricing-value">{{ formatCurrency(advert.basePrice) }}</div>
            </div>
            <div class="pricing-item">
              <label>Frequency</label>
              <div class="pricing-value">{{ advert.frequency }} insertion(s)</div>
            </div>
            <div class="pricing-item">
              <label>Subtotal</label>
              <div class="pricing-value">{{ formatCurrency(advert.basePrice * advert.frequency) }}</div>
            </div>
            <div class="pricing-item">
              <label>Surcharge</label>
              <div class="pricing-value">{{ formatCurrency(advert.surcharge) }}</div>
            </div>
            <div v-if="advert.discount > 0" class="pricing-item">
              <label>Discount</label>
              <div class="pricing-value discount">{{ formatCurrency(advert.discount) }}</div>
            </div>
            <div class="pricing-item total">
              <label>Total Amount</label>
              <div class="pricing-value amount">{{ formatCurrency(advert.totalAmount) }}</div>
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
              <label>Payment Method</label>
              <div class="info-value">{{ formatPaymentMethod(advert.paymentMethod) }}</div>
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
                    • {{ file.mime || 'Unknown type' }}
                    • Uploaded {{ formatRelativeTime(file.uploadedAt) }}
                  </div>
                </div>
              </div>
              <div class="file-actions">
                <button class="btn btn-info btn-sm" @click="downloadFile(file)">
                  📥 Download
                </button>
                <a 
                  :href="getFullFileUrl(file.url)" 
                  target="_blank" 
                  class="btn btn-outline btn-sm"
                >
                  👁️ View
                </a>
              </div>
            </div>
          </div>
          <div v-else class="empty-state">
            <div class="empty-icon">📎</div>
            <p>No files attached</p>
          </div>
        </div>

        <!-- Special Instructions -->
        <div v-if="advert.specialInstructions" class="content-card full-width">
          <div class="card-header">
            <h2>Special Instructions</h2>
          </div>
          <div class="instructions">
            {{ advert.specialInstructions }}
          </div>
        </div>

        <!-- Workflow Timeline -->
        <div v-if="workflowLogs.length > 0" class="content-card full-width">
          <div class="card-header">
            <h2>Workflow Timeline</h2>
          </div>
          <div class="timeline">
            <div v-for="log in workflowLogs" :key="log.id" class="timeline-item">
              <div class="timeline-date">{{ formatDateTime(log.timestamp || log.createdAt) }}</div>
              <div class="timeline-content">
                <div class="timeline-header">
                  <strong>{{ log.action || 'Action' }}</strong> by {{ log.performed_by || log.author || 'System' }}
                </div>
                <div v-if="log.notes" class="timeline-notes">
                  {{ log.notes }}
                </div>
                <div class="timeline-status" v-if="log.previousStatus || log.newStatus">
                  <span v-if="log.previousStatus">{{ formatStatus(log.previousStatus) }}</span>
                  <span v-if="log.previousStatus && log.newStatus"> → </span>
                  <span v-if="log.newStatus">{{ formatStatus(log.newStatus) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Comments -->
        <div class="content-card full-width">
          <div class="card-header">
            <h2>Comments</h2>
            <span class="comment-count">{{ advert.comments?.length || 0 }} comments</span>
          </div>
          <div class="comments-section">
            <div v-if="advert.comments && advert.comments.length > 0" class="comment-list">
              <div v-for="comment in advert.comments" :key="comment.id" class="comment-item">
                <div class="comment-header">
                  <span class="comment-author">{{ comment.author || comment.performed_by || 'Unknown' }}</span>
                  <span class="comment-date">{{ formatDateTime(comment.createdAt || comment.created_at) }}</span>
                </div>
                <div class="comment-body">
                  {{ comment.text || comment.comment_text || comment.notes }}
                </div>
                <div class="comment-type" :class="`type-${comment.type || comment.comment_type || 'general'}`">
                  {{ formatCommentType(comment.type || comment.comment_type) }}
                </div>
              </div>
            </div>
            <div v-else class="empty-state">
              <div class="empty-icon">💬</div>
              <p>No comments yet</p>
            </div>
            
            <div v-if="canComment" class="add-comment">
              <textarea 
                v-model="newComment"
                placeholder="Add a comment..."
                rows="3"
                :disabled="loading"
              ></textarea>
              <div class="comment-actions">
                <button class="btn btn-primary" @click="addComment" :disabled="!newComment.trim() || loading">
                  💬 Add Comment
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="error-container">
      <h2>Advert Not Found</h2>
      <p>The advert you're looking for doesn't exist or you don't have permission to view it.</p>
      <button class="btn btn-primary" @click="goBack">
        ← Go Back
      </button>
    </div>
  </div>
</template>


<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from '#app'
import { useAuth } from '~/composables/useAuth'
import { useProducts } from '~/composables/useProducts' // Add this import
import { useAdverts } from '~/composables/useAdverts'
import { formatCurrency, formatDate, formatDateTime, formatRelativeTime, formatFileSize } from '~/utils/formatters'

const route = useRoute()
const router = useRouter()
const { user, userRole } = useAuth()
const advertsStore = useAdverts()

// Add products composable
const { 
  categories,
  products,
  rateCards,
  loadCategories,
  loadProductsByCategoryId,
  loadAllProducts,
  loadRateCards,
  getProductById
} = useProducts()

const advert = ref(null)
const workflowLogs = ref([])
const newComment = ref('')
const loading = ref(true)
const error = ref(null)

// Add loading states
const categoriesLoading = ref(false)
const productsLoading = ref(false)
const rateCardsLoading = ref(false)

const advertId = route.params.id

const isOwner = computed(() => {
  return advert.value?.createdBy === user.value?.id || advert.value?.vgams_user?.id === user.value?.id
})

const canComment = computed(() => {
  return userRole.value === 'editor' || userRole.value === 'manager' || isOwner.value
})

// Add computed properties for product category mapping
const selectedCategory = computed(() => {
  if (!advert.value?.platformCategory && advert.value?.product?.category) {
    // Try to get category from product data
    return categories.value.find(cat => cat.id === advert.value?.product?.category?.id)
  }
  return categories.value.find(cat => cat.category_type === advert.value?.platformCategory)
})

const platformCategoryName = computed(() => {
  if (selectedCategory.value) {
    return selectedCategory.value.name
  }
  // Fallback to product category name
  return advert.value?.product?.category?.name || advert.value?.platformCategory || 'N/A'
})

const productName = computed(() => {
  return advert.value?.product?.product_name || advert.value?.product?.name || 'N/A'
})

const productDescription = computed(() => {
  return advert.value?.product?.description || ''
})

const productCirculation = computed(() => {
  return advert.value?.product?.circulation ? formatNumber(advert.value.product.circulation) : 'N/A'
})

const rateCardName = computed(() => {
  if (advert.value?.rate_card) {
    const rateCard = advert.value.rate_card
    const price = advert.value.adType === 'full_color' ? rateCard.price_fc : rateCard.price_bw
    let name = rateCard.name || ''
    
    if (rateCard.ad_type) {
      name = rateCard.ad_type
    }
    
    if (price) {
      name += ` - ${formatCurrency(price)}`
    }
    
    if (rateCard.size_dimension) {
      name += ` - ${rateCard.size_dimension}`
    }
    
    return name
  }
  return 'N/A'
})

onMounted(() => {
  loadAdvert()
  loadCategoriesData() // Load categories on mount
})

const loadCategoriesData = async () => {
  try {
    categoriesLoading.value = true
    await loadCategories()
  } catch (err) {
    console.error('Failed to load categories:', err)
  } finally {
    categoriesLoading.value = false
  }
}

const loadAdvert = async () => {
  loading.value = true
  try {
    // Get VGAMS user from localStorage
    const vgamsUser = JSON.parse(localStorage.getItem('vgams_user'))
    
    if (!vgamsUser?.id) {
      error.value = 'User not authenticated'
      loading.value = false
      return
    }
    
    // Fetch advert from API using the custom endpoint
    const response = await $fetch(`${process.env.NUXT_PUBLIC_API_BASE || 'https://cms-vgad.visiongroup.co.ug/api'}/adverts/${advertId}`, {
      method: 'GET',
      headers: {
        'x-vgams-user-id': vgamsUser.id,
        'Content-Type': 'application/json'
      }
    })
    
    if (response.success) {
      advert.value = transformAdvertData(response.data)
      
      // Load additional product data if needed
      if (advert.value.product?.id) {
        await loadAdditionalProductData(advert.value.product.id)
      }
      
      // Load workflow logs if available
      if (advert.value.workflow_history) {
        workflowLogs.value = advert.value.workflow_history
      }
    } else {
      error.value = response.message || 'Advert not found'
    }
  } catch (err) {
    error.value = err.message || 'Failed to load advert'
    console.error('Error loading advert:', err)
  } finally {
    loading.value = false
  }
}

const loadAdditionalProductData = async (productId) => {
  try {
    productsLoading.value = true
    
    // Load all products to get full data
    await loadAllProducts()
    
    // Find the specific product
    const product = products.value.find(p => p.id === productId)
    if (product) {
      // Update advert with full product data
      advert.value.product = {
        ...advert.value.product,
        ...product
      }
      
      // Load rate cards for this product
      if (advert.value.rate_card?.id) {
        await loadRateCards(productId)
        
        // Find and update rate card data
        const rateCard = rateCards.value.find(rc => rc.id === advert.value.rate_card.id)
        if (rateCard) {
          advert.value.rate_card = {
            ...advert.value.rate_card,
            ...rateCard
          }
        }
      }
    }
  } catch (err) {
    console.error('Failed to load additional product data:', err)
  } finally {
    productsLoading.value = false
  }
}

const transformAdvertData = (apiData) => {
  // Determine platform category from product data
  let platformCategory = apiData.platformCategory
  if (!platformCategory && apiData.product?.categoryType) {
    platformCategory = apiData.product.categoryType
  }
  
  return {
    id: apiData.id,
    reference: apiData.reference_number,
    title: apiData.advert_title,
    clientName: apiData.client?.company_name || apiData.client?.client_name,
    contactPerson: apiData.client?.contact_person || '',
    email: apiData.client?.email,
    phone: apiData.client?.phone,
    platformCategory: platformCategory,
    specificPlatform: apiData.product?.product_name,
    productName: apiData.product?.product_name,
    productId: apiData.product?.id,
    product: apiData.product,
    rateCardId: apiData.rate_card?.id,
    rate_card: apiData.rate_card,
    adSize: apiData.ad_size,
    adType: apiData.ad_type,
    totalAmount: apiData.total_amount,
    basePrice: apiData.base_price,
    surcharge: apiData.surcharge,
    discount: apiData.discount || 0,
    startDate: apiData.start_date,
    endDate: apiData.end_date,
    frequency: apiData.frequency,
    paymentMethod: apiData.payment_method,
    status: apiData.status,
    specialInstructions: apiData.special_instructions,
    createdAt: apiData.createdAt,
    updatedAt: apiData.updatedAt,
    submittedAt: apiData.submittedAt,
    createdBy: apiData.vgams_user?.id,
    vgams_user: apiData.vgams_user,
    client: apiData.client,
    files: apiData.attachments?.map(file => ({
      id: file.id,
      name: file.name,
      size: file.size,
      url: file.url,
      mime: file.mime,
      uploadedAt: file.createdAt
    })) || [],
    workflow_history: apiData.workflow_history || [],
    comments: apiData.comments || []
  }
}

// Add helper functions similar to new.vue
const formatNumber = (number) => {
  if (!number && number !== 0) return '0'
  
  return new Intl.NumberFormat('en-UG').format(number)
}

const getPlatformCategoryDisplay = (categoryType) => {
  const categoryMap = {
    'print': 'Print Media',
    'tv': 'Television',
    'radio': 'Radio',
    'digital': 'Digital Media',
    'outdoor': 'Outdoor/OOH'
  }
  return categoryMap[categoryType] || categoryType
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
  const typeMap = {
    full_color: 'Full Color',
    black_white: 'Black & White',
    black_and_white: 'Black & White'
  }
  return typeMap[type] || type
}

const formatPaymentMethod = (method) => {
  const methodMap = {
    cash: 'Cash',
    credit: 'Credit',
    cheque: 'Cheque',
    bank_transfer: 'Bank Transfer',
    mobile_money: 'Mobile Money',
    pdc: 'Post-Dated Cheque'
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

const getFullFileUrl = (url) => {
  const config = useRuntimeConfig()
  const baseUrl = config.public.uploadBase || ''
  return url.startsWith('http') ? url : `${baseUrl}${url}`
}

const goBack = () => {
  router.back()
}

const editAdvert = () => {
  if (advert.value.status === 'draft' && isOwner.value) {
    router.push(`/dashboard/booking/edit/${advert.value.id}`)
  } else {
    alert('Only draft adverts can be edited')
  }
}

const submitForReview = async () => {
  if (!confirm('Submit this advert for editorial review?')) {
    return
  }
  
  try {
    const vgamsUser = JSON.parse(localStorage.getItem('vgams_user'))
    
    const response = await $fetch(`${process.env.NUXT_PUBLIC_API_BASE || 'https://cms-vgad.visiongroup.co.ug/api'}/adverts/${advertId}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-vgams-user-id': vgamsUser?.id
      }
    })
    
    if (response.success) {
      alert('Advert submitted for review successfully!')
      await loadAdvert() // Refresh the advert data
    } else {
      alert(response.message || 'Failed to submit advert')
    }
  } catch (err) {
    console.error('Error submitting advert:', err)
    alert('Failed to submit advert')
  }
}

const downloadFile = (file) => {
  const fullUrl = getFullFileUrl(file.url)
  window.open(fullUrl, '_blank')
}

const addComment = async () => {
  if (!newComment.value.trim()) return
  
  try {
    const vgamsUser = JSON.parse(localStorage.getItem('vgams_user'))
    
    const response = await $fetch(`${process.env.NUXT_PUBLIC_API_BASE || 'https://cms-vgad.visiongroup.co.ug/api'}/adverts/${advertId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-vgams-user-id': vgamsUser?.id
      },
      body: {
        comment_text: newComment.value,
        comment_type: 'general',
        author: vgamsUser?.name || 'User'
      }
    })
    
    if (response.success) {
      // Add comment to local state
      const comment = {
        id: response.data.id,
        author: vgamsUser?.name || 'You',
        text: newComment.value,
        type: 'general',
        createdAt: new Date().toISOString()
      }
      
      if (!advert.value.comments) {
        advert.value.comments = []
      }
      advert.value.comments.unshift(comment)
      newComment.value = ''
    }
  } catch (err) {
    console.error('Error adding comment:', err)
    alert('Failed to add comment')
  }
}
</script>

<style scoped>
.advert-details-page {
  width: 100%;
  padding-bottom: 30px;
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
  font-size: 1.8em;
}

.header-content p {
  color: #666;
  margin: 0;
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
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
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

.content-card.full-width {
  grid-column: 1 / -1;
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
  margin: 0;
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

.status-pending_review {
  background: #74b9ff;
  color: #0984e3;
}

.status-editor_approved {
  background: #55efc4;
  color: #00b894;
}

.status-manager_approved {
  background: #55efc4;
  color: #00b894;
}

.status-editor_rejected {
  background: #ff7675;
  color: #d63031;
}

.status-manager_rejected {
  background: #ff7675;
  color: #d63031;
}

.status-published {
  background: #a29bfe;
  color: #6c5ce7;
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
  font-weight: 500;
}

.info-value {
  color: #333;
  font-weight: 500;
}

.ref-number {
  font-family: monospace;
  font-weight: 600;
  color: #003366;
  background: #f0f7ff;
  padding: 4px 8px;
  border-radius: 4px;
  display: inline-block;
}

.user-role {
  font-size: 0.85em;
  color: #666;
  font-style: italic;
  margin-top: 2px;
}

.product-circulation {
  font-size: 0.85em;
  color: #666;
  margin-top: 3px;
}

/* Pricing Grid */
.pricing-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 15px;
}

.pricing-item {
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
  border-left: 3px solid #0066CC;
}

.pricing-item.total {
  background: #e3f2fd;
  border-left-color: #E31E24;
}

.pricing-item label {
  display: block;
  color: #666;
  font-size: 0.85em;
  margin-bottom: 5px;
}

.pricing-value {
  color: #333;
  font-weight: 600;
}

.pricing-item.total .pricing-value {
  color: #E31E24;
  font-size: 1.1em;
}

.pricing-value.amount {
  color: #E31E24;
  font-weight: bold;
  font-size: 1.1em;
}

.pricing-value.discount {
  color: #dc3545;
}

/* Files Section */
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
  flex-wrap: wrap;
  gap: 10px;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
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
  flex-shrink: 0;
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

.file-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.btn-outline {
  background: white;
  color: #0066CC;
  border: 1px solid #0066CC;
}

.btn-outline:hover {
  background: #0066CC;
  color: white;
}

/* Instructions */
.instructions {
  padding: 15px;
  background: #F5F5F5;
  border-radius: 5px;
  color: #333;
  line-height: 1.6;
  white-space: pre-wrap;
}

/* Timeline */
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

.timeline-header {
  margin-bottom: 8px;
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

/* Comments Section */
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
  margin-bottom: 8px;
}

.comment-type {
  display: inline-block;
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

.type-general {
  background: #74b9ff;
  color: #0984e3;
}

.comment-count {
  color: #666;
  font-size: 0.9em;
}

.add-comment {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #F5F5F5;
}

.add-comment textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #DDDDDD;
  border-radius: 5px;
  margin-bottom: 10px;
  font-family: inherit;
  font-size: 1em;
  resize: vertical;
  min-height: 80px;
}

.add-comment textarea:focus {
  outline: none;
  border-color: #0066CC;
  box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
}

.comment-actions {
  display: flex;
  justify-content: flex-end;
}

/* Empty States */
.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #999;
  font-style: italic;
}

.empty-icon {
  font-size: 2em;
  margin-bottom: 10px;
  opacity: 0.5;
}

/* Buttons */
.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1em;
  transition: all 0.3s;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
}

.btn-primary {
  background: #E31E24;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #c01820;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #0066CC;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #0052a3;
}

.btn-warning {
  background: #ffc107;
  color: #333333;
}

.btn-warning:hover:not(:disabled) {
  background: #e0a800;
}

.btn-info {
  background: #17a2b8;
  color: white;
}

.btn-info:hover:not(:disabled) {
  background: #138496;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 0.9em;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Responsive */
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
  
  .pricing-grid {
    grid-template-columns: 1fr;
  }
  
  .file-item {
    flex-direction: column;
    align-items: stretch;
  }
  
  .file-actions {
    width: 100%;
    justify-content: flex-end;
  }
  
  .comment-header {
    flex-direction: column;
    gap: 5px;
  }
}
</style>