<!-- pages/dashboard/booking/edit/[id].vue -->
<template>
  <div class="edit-booking-page">
    <div class="page-header">
      <div class="header-content">
        <div>
          <h1>Edit Advert</h1>
          <p>Edit advert #{{ advertReference }}</p>
        </div>
        <div class="header-actions">
          <button 
            class="btn btn-secondary"
            @click="goBack"
          >
            ← Back
          </button>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <div>Loading advert...</div>
    </div>

    <div v-else-if="advert" class="content-card">
      <BookingForm
        :initial-data="formData"
        :submitting="submitting"
        :saving="saving"
        @submit="updateAdvert"
        @save-draft="saveAsDraft"
        @calculate-price="calculatePrice"
      >
        <!-- Price Calculator Slot -->
        <template #price-calculator>
          <PriceCalculator 
            :calculation="priceCalculation"
            :loading="priceLoading"
            :currency="selectedCurrency"
          />
        </template>
        
        <!-- File Upload Slot -->
        <template #file-upload>
          <FileUpload 
            :initial-files="existingFiles"
            :advert-id="advertId"
            @files-updated="handleFilesUpdate"
            :disabled="submitting || loading"
          />
        </template>
      </BookingForm>
    </div>

    <div v-else class="error-container">
      <h2>Advert Not Found</h2>
      <p>{{ error }}</p>
      <button class="btn btn-primary" @click="goBack">
        Go Back
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from '#imports'
import BookingForm from '~/components/booking/BookingForm.vue'
import PriceCalculator from '~/components/clerk/PriceCalculator.vue'
import FileUpload from '~/components/clerk/FileUpload.vue'
import { useAdverts } from '~/composables/useAdverts'

const route = useRoute()
const router = useRouter()
const { getAdvertById, updateAdvert: updateAdvertApi, loading: apiLoading } = useAdverts()

const advert = ref(null)
const formData = ref({})
const existingFiles = ref([])
const priceCalculation = ref(null)
const selectedCurrency = ref('UGX')
const loading = ref(true)
const error = ref(null)
const submitting = ref(false)
const saving = ref(false)
const priceLoading = ref(false)

const advertId = route.params.id

const advertReference = computed(() => {
  return advert.value?.reference_number || advert.value?.reference || advertId
})

onMounted(async () => {
  await loadAdvert()
})

const loadAdvert = async () => {
  loading.value = true
  try {
    // Get VGAMS user from localStorage
    const vgamsUser = JSON.parse(localStorage.getItem('vgams_user'))
    
    // Fetch advert from API using direct fetch
    const response = await $fetch(`${process.env.NUXT_PUBLIC_API_BASE || 'https://cms-vgad.visiongroup.co.ug/api'}/adverts/${advertId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-vgams-user-id': vgamsUser?.id
      }
    })
    
    if (response.success && response.data) {
      advert.value = response.data
      transformToFormData()
      
      // Set existing files for FileUpload component
      if (advert.value.attachments) {
        existingFiles.value = advert.value.attachments.map(file => ({
          id: file.id,
          name: file.name,
          size: file.size,
          url: file.url,
          mime: file.mime,
          uploadedAt: file.uploadedAt,
          file: null // Will be populated if re-uploading
        }))
      }
    } else {
      error.value = response.message || 'Advert not found or you do not have permission to edit it'
    }
  } catch (err) {
    error.value = err.message || 'Failed to load advert'
    console.error('Error loading advert:', err)
  } finally {
    loading.value = false
  }
}

const transformToFormData = () => {
  if (!advert.value) return
  
  // Get product category from API response
  const platformCategory = advert.value.product?.category?.type || 'print'
  
  formData.value = {
    clientName: advert.value.client?.company_name || '',
    contactPerson: advert.value.client?.contact_person || '',
    email: advert.value.client?.email || '',
    phone: advert.value.client?.phone || '',
    advertTitle: advert.value.advert_title || '',
    platformCategory: platformCategory,
    specificPlatform: advert.value.product?.id || '',
    productId: advert.value.product?.id || '',
    rateCardId: advert.value.rate_card?.id || '',
    adSize: advert.value.ad_size || '',
    adType: advert.value.ad_type || 'full_color',
    startDate: advert.value.start_date?.split('T')[0] || '',
    endDate: advert.value.end_date?.split('T')[0] || '',
    frequency: advert.value.frequency || 1,
    paymentMethod: advert.value.payment_method || '',
    specialInstructions: advert.value.special_instructions || '',
    // Add missing fields
    basePrice: advert.value.base_price || 0,
    surcharge: advert.value.surcharge || 0,
    totalAmount: advert.value.total_amount || 0,
    product: advert.value.product,
    rateCard: advert.value.rate_card,
    files: advert.value.attachments?.map(file => ({
      id: file.id,
      name: file.name,
      size: file.size,
      url: file.url,
      file: null
    })) || []
  }
  
  // Set price calculation if available
  if (advert.value.total_amount) {
    priceCalculation.value = {
      basePrice: advert.value.base_price || 0,
      surcharge: advert.value.surcharge || 0,
      total: advert.value.total_amount || 0
    }
  }
  
  // Set selected currency based on data
  selectedCurrency.value = 'UGX'
}

const calculatePrice = async (data) => {
  priceLoading.value = true
  try {
    // Use your price calculator API
    const response = await $fetch(`${process.env.NUXT_PUBLIC_API_BASE || 'https://cms-vgad.visiongroup.co.ug/api'}/adverts/calculate-price`, {
      method: 'POST',
      body: data,
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    if (response.success) {
      priceCalculation.value = {
        basePrice: response.basePrice || 0,
        surcharge: response.surcharge || 0,
        total: response.totalAmount || 0
      }
      
      // Update form data with calculated prices
      if (formData.value) {
        formData.value.basePrice = response.basePrice || 0
        formData.value.surcharge = response.surcharge || 0
        formData.value.totalAmount = response.totalAmount || 0
      }
    } else {
      alert('Failed to calculate price: ' + (response.message || 'Unknown error'))
    }
  } catch (err) {
    console.error('Price calculation failed:', err)
    alert('Failed to calculate price: ' + err.message)
  } finally {
    priceLoading.value = false
  }
}

const handleFilesUpdate = (files) => {
  // Handle file updates
  existingFiles.value = files
}

const updateAdvert = async (formData) => {
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
    
    // Prepare update data in the format the API expects
    const updateData = {
      data: {
        advert_title: formData.advertTitle,
        client: advert.value.client?.id, // Keep existing client
        product: formData.productId,
        rate_card: formData.rateCardId,
        ad_size: formData.adSize,
        ad_type: formData.adType,
        frequency: parseInt(formData.frequency) || 1,
        start_date: formData.startDate,
        end_date: formData.endDate || null,
        base_price: formData.basePrice || advert.value.base_price || 0,
        surcharge: formData.surcharge || advert.value.surcharge || 0,
        total_amount: formData.totalAmount || advert.value.total_amount || 0,
        payment_method: formData.paymentMethod,
        special_instructions: formData.specialInstructions,
        status: 'draft', // Keep as draft when editing
        // Update client contact info if needed
        clientName: formData.clientName,
        contactPerson: formData.contactPerson,
        email: formData.email,
        phone: formData.phone,
        // Include VGAMS user data
        vgamsUserId: vgamsUser?.id,
        vgamsUserName: vgamsUser?.name,
        vgamsUserEmail: vgamsUser?.email,
        vgamsUserRole: vgamsUser?.role
      }
    }
    
    // Add price data if recalculated
    if (priceCalculation.value) {
      updateData.data.base_price = priceCalculation.value.basePrice
      updateData.data.surcharge = priceCalculation.value.surcharge
      updateData.data.total_amount = priceCalculation.value.total
    }
    
    console.log('📤 Updating advert with data:', updateData)
    
    // Call update API
    const response = await $fetch(`${process.env.NUXT_PUBLIC_API_BASE || 'https://cms-vgad.visiongroup.co.ug/api'}/adverts/${advertId}`, {
      method: 'PUT',
      body: updateData,
      headers: {
        'Content-Type': 'application/json',
        'x-vgams-user-id': vgamsUser?.id
      }
    })
    
    console.log('✅ Update response:', response)
    
    if (response.success) {
      // Handle file uploads if any new files
      const newFiles = existingFiles.value.filter(file => file.file && file.file instanceof File)
      if (newFiles.length > 0) {
        await uploadFiles(advertId, newFiles)
      }
      
      alert('Advert updated successfully!')
      router.push(`/dashboard/adverts/${advertId}`)
    } else {
      throw new Error(response.message || 'Failed to update advert')
    }
    
  } catch (err) {
    console.error('Update failed:', err)
    alert(`Failed to update advert: ${err.message}`)
  } finally {
    submitting.value = false
  }
}

const saveAsDraft = async (formData) => {
  saving.value = true
  try {
    // Get VGAMS user from localStorage
    const vgamsUser = JSON.parse(localStorage.getItem('vgams_user'))
    
    const updateData = {
      data: {
        advert_title: formData.advertTitle,
        client: advert.value.client?.id,
        product: formData.productId,
        rate_card: formData.rateCardId,
        ad_size: formData.adSize,
        ad_type: formData.adType,
        frequency: parseInt(formData.frequency) || 1,
        start_date: formData.startDate,
        end_date: formData.endDate || null,
        base_price: formData.basePrice || advert.value.base_price || 0,
        surcharge: formData.surcharge || advert.value.surcharge || 0,
        total_amount: formData.totalAmount || advert.value.total_amount || 0,
        payment_method: formData.paymentMethod,
        special_instructions: formData.specialInstructions,
        status: 'draft',
        clientName: formData.clientName,
        contactPerson: formData.contactPerson,
        email: formData.email,
        phone: formData.phone,
        vgamsUserId: vgamsUser?.id,
        vgamsUserName: vgamsUser?.name,
        vgamsUserEmail: vgamsUser?.email,
        vgamsUserRole: vgamsUser?.role
      }
    }
    
    const response = await $fetch(`${process.env.NUXT_PUBLIC_API_BASE || 'https://cms-vgad.visiongroup.co.ug/api'}/adverts/${advertId}`, {
      method: 'PUT',
      body: updateData,
      headers: {
        'Content-Type': 'application/json',
        'x-vgams-user-id': vgamsUser?.id
      }
    })
    
    if (response.success) {
      alert('Draft saved successfully!')
    } else {
      throw new Error(response.message || 'Failed to save draft')
    }
    
  } catch (err) {
    console.error('Save draft failed:', err)
    alert(`Failed to save draft: ${err.message}`)
  } finally {
    saving.value = false
  }
}

const uploadFiles = async (advertId, files) => {
  try {
    const formData = new FormData()
    
    files.forEach(file => {
      if (file.file) {
        formData.append('files', file.file)
      }
    })
    
    // Add reference data for Strapi
    formData.append('ref', 'api::advert.advert')
    formData.append('refId', advertId)
    formData.append('field', 'attachments')
    
    const response = await $fetch(`${process.env.NUXT_PUBLIC_API_BASE || 'https://cms-vgad.visiongroup.co.ug/api'}/upload`, {
      method: 'POST',
      body: formData
    })
    
    console.log('File upload response:', response)
    
  } catch (err) {
    console.error('Failed to upload files:', err)
    alert('Failed to upload files: ' + err.message)
  }
}

const goBack = () => {
  router.back()
}
</script>

<style scoped>
.edit-booking-page {
  width: 100%;
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

.content-card {
  background: white;
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1em;
  transition: all 0.3s;
}

.btn-secondary {
  background: #0066CC;
  color: white;
}

.btn-secondary:hover {
  background: #0052a3;
}

.btn-primary {
  background: #E31E24;
  color: white;
}

.btn-primary:hover {
  background: #c01820;
}

@media (max-width: 768px) {
  .content-card {
    padding: 20px;
  }
}
</style>