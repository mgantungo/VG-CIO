<!-- pages/dashboard/booking/edit/[id].vue -->
<template>
  <div class="edit-booking-page">
    <div class="page-header">
      <div class="header-content">
        <div>
          <h1>{{ isViewMode ? 'View Advert' : 'Edit Advert' }}</h1>
          <p>{{ isViewMode ? 'Viewing' : 'Editing' }} advert {{ advertReference }}</p>
        </div>
        <div class="header-actions">
          <button 
            class="btn btn-secondary"
            @click="goBack"
          >
            ← Back
          </button>
          <button 
            v-if="isViewMode && advert && advert.status === 'draft'"
            class="btn btn-primary"
            @click="switchToEditMode"
          >
            ✏️ Edit
          </button>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <div>Loading advert...</div>
    </div>

    <div v-else-if="advert" class="content-card">
      <div class="card-header">
        <h2>{{ isViewMode ? 'Advert Details' : 'Edit Advert Information' }}</h2>
        <div v-if="advert" class="advert-meta">
          <span class="meta-item">
            <strong>Status:</strong>
            <span :class="`status-badge badge-${getStatusClass(advert.status)}`">
              {{ getStatusLabel(advert.status) }}
            </span>
          </span>
          <span class="meta-item">
            <strong>Created:</strong> {{ formatDateTime(advert.createdAt) }}
          </span>
          <span class="meta-item">
            <strong>Created By:</strong> {{ advert.vgams_user?.name || 'Unknown' }}
          </span>
        </div>
      </div>

      <!-- Read-only View Mode -->
      <div v-if="isViewMode" class="view-mode">
        <div class="detail-section">
          <h3 class="section-title">Client Information</h3>
          <div class="detail-grid">
            <div class="detail-item">
              <label>Client Name:</label>
              <div class="detail-value">{{ advert.client?.company_name || 'N/A' }}</div>
            </div>
            <div class="detail-item">
              <label>Contact Person:</label>
              <div class="detail-value">{{ advert.client?.contact_person || 'N/A' }}</div>
            </div>
            <div class="detail-item">
              <label>Email:</label>
              <div class="detail-value">{{ advert.client?.email || 'N/A' }}</div>
            </div>
            <div class="detail-item">
              <label>Phone:</label>
              <div class="detail-value">{{ advert.client?.phone || 'N/A' }}</div>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <h3 class="section-title">Advert Information</h3>
          <div class="detail-grid">
            <div class="detail-item">
              <label>Advert Title:</label>
              <div class="detail-value">{{ advert.advert_title }}</div>
            </div>
            <div class="detail-item">
              <label>Platform Category:</label>
              <div class="detail-value">{{ advert.product?.category?.name || 'N/A' }}</div>
            </div>
            <div class="detail-item">
              <label>Product:</label>
              <div class="detail-value">{{ advert.product?.product_name || 'N/A' }}</div>
            </div>
            <div class="detail-item">
              <label>Rate Card:</label>
              <div class="detail-value">
                {{ advert.rate_card?.ad_type || 'N/A' }}
                <span v-if="advert.rate_card?.size_dimension" class="detail-meta">
                  ({{ advert.rate_card.size_dimension }})
                </span>
              </div>
            </div>
            <div class="detail-item">
              <label>Ad Size:</label>
              <div class="detail-value">{{ advert.ad_size || 'N/A' }}</div>
            </div>
            <div class="detail-item">
              <label>Ad Type:</label>
              <div class="detail-value">{{ formatAdType(advert.ad_type) }}</div>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <h3 class="section-title">Schedule & Pricing</h3>
          <div class="detail-grid">
            <div class="detail-item">
              <label>Start Date:</label>
              <div class="detail-value">{{ formatDate(advert.start_date) }}</div>
            </div>
            <div class="detail-item">
              <label>End Date:</label>
              <div class="detail-value">{{ formatDate(advert.end_date) || 'N/A' }}</div>
            </div>
            <div class="detail-item">
              <label>Frequency:</label>
              <div class="detail-value">{{ advert.frequency }} insertion(s)</div>
            </div>
            <div class="detail-item">
              <label>Payment Method:</label>
              <div class="detail-value">{{ formatPaymentMethod(advert.payment_method) }}</div>
            </div>
            <div class="detail-item full-width">
              <label>Base Price:</label>
              <div class="detail-value">{{ formatCurrency(advert.base_price) }}</div>
            </div>
            <div class="detail-item full-width" v-if="advert.surcharge > 0">
              <label>Surcharge:</label>
              <div class="detail-value">{{ formatCurrency(advert.surcharge) }}</div>
            </div>
            <div class="detail-item full-width" v-if="advert.discount > 0">
              <label>Discount:</label>
              <div class="detail-value discount">-{{ advert.discount }}%</div>
            </div>
            <div class="detail-item full-width total-amount">
              <label>Total Amount:</label>
              <div class="detail-value">{{ formatCurrency(advert.total_amount) }}</div>
            </div>
          </div>
        </div>

        <div class="detail-section" v-if="advert.special_instructions">
          <h3 class="section-title">Special Instructions</h3>
          <div class="detail-value">{{ advert.special_instructions }}</div>
        </div>

        <div class="detail-section" v-if="advert.attachments && advert.attachments.length > 0">
          <h3 class="section-title">Attachments ({{ advert.attachments.length }})</h3>
          <div class="attachments-list">
            <div 
              v-for="attachment in advert.attachments" 
              :key="attachment.id" 
              class="attachment-item"
            >
              <div class="attachment-icon">📎</div>
              <div class="attachment-info">
                <div class="attachment-name">{{ attachment.name }}</div>
                <div class="attachment-meta">
                  {{ formatFileSize(attachment.size) }} • 
                  {{ formatDateTime(attachment.uploadedAt) }}
                </div>
              </div>
              <button 
                class="btn btn-sm btn-download"
                @click="downloadAttachment(attachment)"
              >
                📥 Download
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Edit Mode Form -->
      <form v-else @submit.prevent="updateAdvert">
        <!-- Client Information -->
        <div class="form-section">
          <h3 class="section-title">Client Information</h3>
          
          <div class="form-row">
            <div class="form-group">
              <label>Client Name <span class="required">*</span></label>
              <input 
                v-model="formData.clientName"
                type="text" 
                placeholder="e.g., MTN Uganda" 
                required
                :disabled="submitting"
              >
            </div>
            <div class="form-group">
              <label>Contact Person</label>
              <input 
                v-model="formData.contactPerson"
                type="text" 
                placeholder="Contact name"
                :disabled="submitting"
              >
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Email Address <span class="required">*</span></label>
              <input 
                v-model="formData.email"
                type="email" 
                placeholder="client@company.com" 
                required
                :disabled="submitting"
              >
            </div>
            <div class="form-group">
              <label>Phone Number <span class="required">*</span></label>
              <input 
                v-model="formData.phone"
                type="tel" 
                placeholder="+256 700 000 000" 
                required
                :disabled="submitting"
              >
            </div>
          </div>
        </div>

        <!-- Advert Information -->
        <div class="form-section">
          <h3 class="section-title">Advert Information</h3>
          
          <div class="form-group">
            <label>Advert Title <span class="required">*</span></label>
            <input 
              v-model="formData.advertTitle"
              type="text" 
              placeholder="e.g., MTN New Year Campaign" 
              required
              :disabled="submitting"
            >
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Product/Platform</label>
              <input 
                type="text" 
                :value="advert.product?.product_name || 'N/A'"
                disabled
                class="readonly-input"
              >
              <small class="help-text">Product cannot be changed once created</small>
            </div>
            
            <div class="form-group">
              <label>Rate Card</label>
              <input 
                type="text" 
                :value="getRateCardDisplay()"
                disabled
                class="readonly-input"
              >
              <small class="help-text">Rate card cannot be changed once created</small>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Ad Size</label>
              <input 
                v-model="formData.adSize"
                type="text" 
                placeholder="e.g., Full Page, 30 sec spot"
                :disabled="submitting"
              >
            </div>
            
            <div class="form-group">
              <label>Color/Type</label>
              <select 
                v-model="formData.adType" 
                @change="recalculatePrice"
                :disabled="submitting"
              >
                <option value="full_color">Full Color</option>
                <option value="black_white">Black & White</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Schedule & Pricing -->
        <div class="form-section">
          <h3 class="section-title">Schedule & Pricing</h3>
          
          <div class="form-row">
            <div class="form-group">
              <label>Start Date <span class="required">*</span></label>
              <input 
                v-model="formData.startDate"
                type="date" 
                required
                :disabled="submitting"
              >
            </div>
            <div class="form-group">
              <label>End Date</label>
              <input 
                v-model="formData.endDate"
                type="date"
                :min="formData.startDate"
                :disabled="submitting"
              >
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Frequency</label>
              <div class="input-with-buttons">
                <input 
                  v-model.number="formData.frequency"
                  type="number" 
                  min="1" 
                  @change="recalculatePrice"
                  :disabled="submitting"
                >
                <div class="frequency-buttons">
                  <button 
                    type="button" 
                    class="btn-frequency" 
                    @click="adjustFrequency(-1)"
                    :disabled="formData.frequency <= 1 || submitting"
                  >-</button>
                  <button 
                    type="button" 
                    class="btn-frequency" 
                    @click="adjustFrequency(1)"
                    :disabled="submitting"
                  >+</button>
                </div>
              </div>
              <small class="help-text">Number of times the advert will run</small>
            </div>
            
            <div class="form-group">
              <label>Payment Method <span class="required">*</span></label>
              <select 
                v-model="formData.paymentMethod" 
                required
                :disabled="submitting"
              >
                <option value="">Select payment method</option>
                <option value="cash">Cash</option>
                <option value="credit">Credit (Requires Approval)</option>
                <option value="pdc">Post-Dated Cheque</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="mobile_money">Mobile Money</option>
              </select>
            </div>
          </div>

          <!-- Price Display -->
          <div class="price-display">
            <div class="price-item">
              <span>Base Price:</span>
              <strong>{{ formatCurrency(formData.basePrice) }}</strong>
            </div>
            <div class="price-item">
              <span>Frequency (×{{ formData.frequency }}):</span>
              <strong>{{ formatCurrency(formData.basePrice * formData.frequency) }}</strong>
            </div>
            <div v-if="formData.surcharge > 0" class="price-item">
              <span>Surcharge:</span>
              <strong>{{ formatCurrency(formData.surcharge) }}</strong>
            </div>
            <div class="price-item total">
              <span>Total Amount:</span>
              <strong>{{ formatCurrency(formData.totalAmount) }}</strong>
            </div>
          </div>
        </div>

        <!-- Special Instructions -->
        <div class="form-section">
          <h3 class="section-title">Special Instructions</h3>
          
          <div class="form-group">
            <textarea 
              v-model="formData.specialInstructions"
              rows="4" 
              placeholder="Any special requirements or instructions..."
              :disabled="submitting"
            ></textarea>
          </div>
        </div>

        <!-- Existing Attachments -->
        <div class="form-section" v-if="existingFiles.length > 0">
          <h3 class="section-title">Current Attachments</h3>
          <div class="attachments-list">
            <div 
              v-for="file in existingFiles" 
              :key="file.id" 
              class="attachment-item"
            >
              <div class="attachment-icon">📎</div>
              <div class="attachment-info">
                <div class="attachment-name">{{ file.name }}</div>
                <div class="attachment-meta">{{ formatFileSize(file.size) }}</div>
              </div>
              <button 
                type="button"
                class="btn btn-sm btn-download"
                @click="downloadAttachment(file)"
              >
                📥 Download
              </button>
            </div>
          </div>
        </div>

        <!-- Form Actions -->
        <div class="form-actions">
          <button 
            type="button" 
            class="btn btn-secondary" 
            @click="goBack"
            :disabled="submitting"
          >
            Cancel
          </button>
          <button 
            type="button" 
            class="btn btn-outline" 
            @click="saveAsDraft"
            :disabled="submitting || saving"
          >
            <span v-if="saving">Saving...</span>
            <span v-else>Save Draft</span>
          </button>
          <button 
            type="submit" 
            class="btn btn-primary" 
            :disabled="submitting || !isFormValid"
          >
            <span v-if="submitting">Updating...</span>
            <span v-else>Update Advert</span>
          </button>
        </div>
      </form>
    </div>

    <div v-else class="error-container">
      <h2>Advert Not Found</h2>
      <p>{{ error || 'The advert you are looking for could not be found or you do not have permission to access it.' }}</p>
      <button class="btn btn-primary" @click="goBack">
        Go Back
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute, useRuntimeConfig } from '#imports'

const route = useRoute()
const router = useRouter()
const config = useRuntimeConfig()

const API_BASE = config.public.apiBase
const UPLOAD_BASE = config.public.uploadBase

// State
const advert = ref(null)
const formData = ref({
  clientName: '',
  contactPerson: '',
  email: '',
  phone: '',
  advertTitle: '',
  productId: '',
  rateCardId: '',
  adSize: '',
  adType: 'full_color',
  startDate: '',
  endDate: '',
  frequency: 1,
  paymentMethod: '',
  specialInstructions: '',
  basePrice: 0,
  surcharge: 0,
  totalAmount: 0
})
const existingFiles = ref([])
const loading = ref(true)
const error = ref(null)
const submitting = ref(false)
const saving = ref(false)

const advertId = route.params.id
const isViewMode = ref(route.query.mode === 'view')

// Computed
const advertReference = computed(() => {
  return advert.value?.reference_number || `#${advertId}`
})

const isFormValid = computed(() => {
  return (
    formData.value.clientName &&
    formData.value.email &&
    formData.value.phone &&
    formData.value.advertTitle &&
    formData.value.startDate &&
    formData.value.paymentMethod
  )
})

// Lifecycle
onMounted(async () => {
  await loadAdvert()
})

// Methods
const loadAdvert = async () => {
  loading.value = true
  error.value = null
  
  try {
    // Get VGAMS user from localStorage
    const vgamsUser = JSON.parse(localStorage.getItem('vgams_user'))
    
    console.log('📥 Loading advert:', advertId)
    
    // Fetch advert from API
    const response = await $fetch(`${API_BASE}/adverts/${advertId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    console.log('✅ Advert loaded:', response)
    
    if (response.success && response.data) {
      advert.value = response.data
      transformToFormData()
      
      // Set existing files for display
      if (advert.value.attachments) {
        existingFiles.value = advert.value.attachments.map(file => ({
          id: file.id,
          name: file.name,
          size: file.size,
          url: file.url,
          mime: file.mime,
          uploadedAt: file.uploadedAt
        }))
      }
    } else {
      error.value = response.message || 'Advert not found'
    }
  } catch (err) {
    error.value = err.message || 'Failed to load advert'
    console.error('❌ Error loading advert:', err)
  } finally {
    loading.value = false
  }
}

const transformToFormData = () => {
  if (!advert.value) return
  
  console.log('🔄 Transforming advert data to form format')
  
  // Transform API response to form data
  formData.value = {
    clientName: advert.value.client?.company_name || '',
    contactPerson: advert.value.client?.contact_person || '',
    email: advert.value.client?.email || '',
    phone: advert.value.client?.phone || '',
    advertTitle: advert.value.advert_title || '',
    productId: advert.value.product?.id || '',
    rateCardId: advert.value.rate_card?.id || '',
    adSize: advert.value.ad_size || '',
    adType: advert.value.ad_type || 'full_color',
    startDate: advert.value.start_date?.split('T')[0] || '',
    endDate: advert.value.end_date?.split('T')[0] || '',
    frequency: advert.value.frequency || 1,
    paymentMethod: advert.value.payment_method || '',
    specialInstructions: advert.value.special_instructions || '',
    basePrice: advert.value.base_price || 0,
    surcharge: advert.value.surcharge || 0,
    totalAmount: advert.value.total_amount || 0
  }
  
  console.log('✅ Form data:', formData.value)
}

const recalculatePrice = async () => {
  if (!formData.value.rateCardId || !formData.value.frequency) return
  
  try {
    console.log('💰 Recalculating price...')
    
    const response = await $fetch(`${API_BASE}/adverts/calculate-price`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        productId: formData.value.productId,
        rateCardId: formData.value.rateCardId,
        frequency: parseInt(formData.value.frequency) || 1,
        adType: formData.value.adType
      }
    })
    
    if (response.success) {
      formData.value.basePrice = response.basePrice || 0
      formData.value.surcharge = response.surcharge || 0
      formData.value.totalAmount = response.totalAmount || 0
      console.log('✅ Price recalculated:', formData.value.totalAmount)
    }
  } catch (err) {
    console.error('❌ Price calculation failed:', err)
  }
}

const adjustFrequency = (change) => {
  const newFrequency = parseInt(formData.value.frequency) + change
  if (newFrequency >= 1) {
    formData.value.frequency = newFrequency
    recalculatePrice()
  }
}

const updateAdvert = async () => {
  if (!isFormValid.value) {
    alert('Please fill in all required fields')
    return
  }
  
  if (advert.value.status !== 'draft') {
    alert('Only draft adverts can be edited')
    return
  }
  
  if (!confirm('Update this advert?')) {
    return
  }
  
  submitting.value = true
  
  try {
    // Get VGAMS user from localStorage
    const vgamsUser = JSON.parse(localStorage.getItem('vgams_user'))
    
    console.log('📤 Updating advert...')
    
    // Prepare update data
    const updateData = {
      data: {
        advert_title: formData.value.advertTitle,
        ad_size: formData.value.adSize,
        ad_type: formData.value.adType,
        frequency: parseInt(formData.value.frequency) || 1,
        start_date: formData.value.startDate,
        end_date: formData.value.endDate || null,
        base_price: formData.value.basePrice,
        surcharge: formData.value.surcharge,
        total_amount: formData.value.totalAmount,
        payment_method: formData.value.paymentMethod,
        special_instructions: formData.value.specialInstructions,
        // Update client info
        clientName: formData.value.clientName,
        contactPerson: formData.value.contactPerson,
        email: formData.value.email,
        phone: formData.value.phone,
        // Keep status as draft
        status: 'draft',
        // Include VGAMS user data
        vgamsUserId: vgamsUser?.id,
        vgamsUserName: vgamsUser?.name,
        vgamsUserEmail: vgamsUser?.email,
        vgamsUserRole: vgamsUser?.role
      }
    }
    
    console.log('📤 Update data:', updateData)
    
    // Call update API
    const response = await $fetch(`${API_BASE}/adverts/${advertId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-vgams-user-id': vgamsUser?.id
      },
      body: updateData
    })
    
    console.log('✅ Update response:', response)
    
    if (response.success) {
      alert('Advert updated successfully!')
      router.push('/dashboard/booking')
    } else {
      throw new Error(response.message || 'Failed to update advert')
    }
    
  } catch (err) {
    console.error('❌ Update failed:', err)
    alert(`Failed to update advert: ${err.message}`)
  } finally {
    submitting.value = false
  }
}

const saveAsDraft = async () => {
  if (!isFormValid.value) {
    alert('Please fill in required client information before saving')
    return
  }
  
  saving.value = true
  
  try {
    // Get VGAMS user
    const vgamsUser = JSON.parse(localStorage.getItem('vgams_user'))
    
    const updateData = {
      data: {
        advert_title: formData.value.advertTitle,
        ad_size: formData.value.adSize,
        ad_type: formData.value.adType,
        frequency: parseInt(formData.value.frequency) || 1,
        start_date: formData.value.startDate,
        end_date: formData.value.endDate || null,
        base_price: formData.value.basePrice,
        surcharge: formData.value.surcharge,
        total_amount: formData.value.totalAmount,
        payment_method: formData.value.paymentMethod,
        special_instructions: formData.value.specialInstructions,
        clientName: formData.value.clientName,
        contactPerson: formData.value.contactPerson,
        email: formData.value.email,
        phone: formData.value.phone,
        status: 'draft',
        vgamsUserId: vgamsUser?.id,
        vgamsUserName: vgamsUser?.name,
        vgamsUserEmail: vgamsUser?.email,
        vgamsUserRole: vgamsUser?.role
      }
    }
    
    const response = await $fetch(`${API_BASE}/adverts/${advertId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-vgams-user-id': vgamsUser?.id
      },
      body: updateData
    })
    
    if (response.success) {
      alert('Draft saved successfully!')
    } else {
      throw new Error(response.message || 'Failed to save draft')
    }
    
  } catch (err) {
    console.error('❌ Save draft failed:', err)
    alert(`Failed to save draft: ${err.message}`)
  } finally {
    saving.value = false
  }
}

const switchToEditMode = () => {
  isViewMode.value = false
  // Remove mode query parameter
  router.replace({ query: {} })
}

const downloadAttachment = (attachment) => {
  if (attachment.url) {
    const fullUrl = attachment.url.startsWith('http') 
      ? attachment.url 
      : `${UPLOAD_BASE}${attachment.url}`
    window.open(fullUrl, '_blank')
  }
}

const goBack = () => {
  router.back()
}

// Helper functions
const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return 'UGX 0'
  
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

const formatDateTime = (dateString) => {
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

const formatFileSize = (bytes) => {
  if (!bytes) return '0 KB'
  
  const kb = bytes / 1024
  if (kb < 1024) {
    return `${kb.toFixed(2)} KB`
  }
  
  const mb = kb / 1024
  return `${mb.toFixed(2)} MB`
}

const formatAdType = (type) => {
  const typeMap = {
    'full_color': 'Full Color',
    'black_white': 'Black & White'
  }
  return typeMap[type] || type
}

const formatPaymentMethod = (method) => {
  const methodMap = {
    'cash': 'Cash',
    'credit': 'Credit',
    'pdc': 'Post-Dated Cheque',
    'bank_transfer': 'Bank Transfer',
    'mobile_money': 'Mobile Money'
  }
  return methodMap[method] || method
}

const getRateCardDisplay = () => {
  if (!advert.value?.rate_card) return 'N/A'
  
  const rc = advert.value.rate_card
  let display = rc.ad_type || ''
  
  if (rc.size_dimension) {
    display += ` (${rc.size_dimension})`
  }
  
  return display
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
.edit-booking-page {
  width: 100%;
}

.page-header {
  background: white;
  padding: 25px 30px;
  border-radius: 10px;
  margin-bottom: 30px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
}

.header-content h1 {
  color: #003366;
  margin-bottom: 8px;
  font-size: 1.8em;
  font-weight: 600;
}

.header-content p {
  color: #666;
  margin: 0;
  font-size: 1em;
}

.header-actions {
  display: flex;
  gap: 15px;
}

.loading-container {
  text-align: center;
  padding: 60px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
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
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.error-container h2 {
  color: #dc3545;
  margin-bottom: 15px;
}

.error-container p {
  color: #666;
  margin-bottom: 30px;
}

.content-card {
  background: white;
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.card-header {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #f0f2f5;
}

.card-header h2 {
  color: #003366;
  font-size: 1.4em;
  font-weight: 600;
  margin-bottom: 15px;
}

.advert-meta {
  display: flex;
  gap: 25px;
  flex-wrap: wrap;
  font-size: 0.9em;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.meta-item strong {
  color: #666;
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
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

/* View Mode Styles */
.view-mode {
  width: 100%;
}

.detail-section {
  margin-bottom: 35px;
  padding: 25px;
  background: #f8f9fa;
  border-radius: 8px;
}

.section-title {
  color: #003366;
  font-size: 1.2em;
  font-weight: 600;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e9ecef;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.detail-item.full-width {
  grid-column: 1 / -1;
}

.detail-item label {
  font-weight: 600;
  color: #666;
  font-size: 0.9em;
}

.detail-value {
  color: #333;
  font-size: 1em;
  padding: 8px 0;
}

.detail-meta {
  font-size: 0.85em;
  color: #888;
}

.detail-item.total-amount {
  border-top: 2px solid #dee2e6;
  padding-top: 15px;
  margin-top: 10px;
}

.total-amount .detail-value {
  font-size: 1.3em;
  font-weight: 700;
  color: #003366;
}

.detail-value.discount {
  color: #dc3545;
  font-weight: 600;
}

.attachments-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.attachment-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background: white;
  border-radius: 6px;
  border: 1px solid #dee2e6;
}

.attachment-icon {
  font-size: 1.5em;
}

.attachment-info {
  flex: 1;
}

.attachment-name {
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.attachment-meta {
  font-size: 0.85em;
  color: #666;
}

/* Form Styles */
.form-section {
  margin-bottom: 40px;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 25px;
  margin-bottom: 25px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #333;
  font-weight: 500;
  font-size: 0.95em;
}

.required {
  color: #e31e24;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1em;
  transition: all 0.3s;
  background-color: white;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #0066cc;
  box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
}

.form-group input:disabled,
.form-group select:disabled,
.form-group textarea:disabled {
  background-color: #f8f9fa;
  cursor: not-allowed;
  opacity: 0.7;
}

.readonly-input {
  background-color: #f8f9fa !important;
  cursor: not-allowed !important;
  color: #666;
}

.form-group textarea {
  resize: vertical;
  min-height: 100px;
}

.help-text {
  display: block;
  margin-top: 6px;
  color: #666;
  font-size: 0.85em;
  font-style: italic;
}

.input-with-buttons {
  display: flex;
  gap: 10px;
}

.input-with-buttons input {
  flex: 1;
}

.frequency-buttons {
  display: flex;
  gap: 2px;
}

.btn-frequency {
  width: 40px;
  height: 46px;
  padding: 0;
  border: 1px solid #ddd;
  background: white;
  color: #333;
  font-size: 1.2em;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.btn-frequency:hover:not(:disabled) {
  background: #f0f2f5;
  border-color: #ccc;
}

.btn-frequency:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.price-display {
  margin-top: 20px;
  padding: 20px;
  background: white;
  border-radius: 6px;
  border: 1px solid #dee2e6;
}

.price-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-size: 0.95em;
}

.price-item span {
  color: #666;
}

.price-item strong {
  color: #333;
}

.price-item.total {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 2px solid #e9ecef;
  font-size: 1.1em;
  font-weight: 600;
}

.price-item.total strong {
  color: #003366;
}

.form-actions {
  display: flex;
  gap: 15px;
  justify-content: flex-end;
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid #f0f2f5;
}

.btn {
  padding: 12px 28px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1em;
  font-weight: 500;
  transition: all 0.3s;
  min-width: 140px;
  text-align: center;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}

.btn-primary {
  background: linear-gradient(135deg, #e31e24 0%, #c01820 100%);
  color: white;
  box-shadow: 0 2px 4px rgba(227, 30, 36, 0.2);
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #c01820 0%, #a0141a 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(227, 30, 36, 0.3);
}

.btn-secondary {
  background: linear-gradient(135deg, #0066cc 0%, #0052a3 100%);
  color: white;
  box-shadow: 0 2px 4px rgba(0, 102, 204, 0.2);
}

.btn-secondary:hover:not(:disabled) {
  background: linear-gradient(135deg, #0052a3 0%, #004080 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 102, 204, 0.3);
}

.btn-outline {
  background: white;
  color: #0066cc;
  border: 2px solid #0066cc;
}

.btn-outline:hover:not(:disabled) {
  background: #f0f7ff;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 0.85em;
  min-width: auto;
}

.btn-download {
  background: #6f42c1;
  color: white;
}

.btn-download:hover {
  background: #5a32a3;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .page-header,
  .content-card {
    padding: 20px;
  }
  
  .header-content {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .header-actions {
    width: 100%;
    justify-content: flex-end;
  }
  
  .advert-meta {
    flex-direction: column;
    gap: 10px;
  }
  
  .form-row {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .detail-grid {
    grid-template-columns: 1fr;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
    min-width: unset;
  }
  
  .attachment-item {
    flex-wrap: wrap;
  }
}

@media (max-width: 480px) {
  .detail-section {
    padding: 15px;
  }
  
  .attachment-item {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>