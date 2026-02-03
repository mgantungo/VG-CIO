import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAdvertsStore = defineStore('adverts', () => {
  const adverts = ref([])
  const selectedAdvert = ref(null)
  const loading = ref(false)
  const error = ref(null)
  
  // API base URL from environment
  const API_BASE = process.env.NUXT_PUBLIC_API_BASE || 'https://cms-vgad.visiongroup.co.ug/api'
  
  // Getters
  const draftAdverts = computed(() => {
    return adverts.value.filter(advert => advert.status === 'draft')
  })
  
  const pendingAdverts = computed(() => {
    return adverts.value.filter(advert => advert.status === 'pending_review')
  })
  
  const approvedAdverts = computed(() => {
    return adverts.value.filter(advert => 
      advert.status === 'editor_approved' || 
      advert.status === 'manager_approved'
    )
  })
  
  const rejectedAdverts = computed(() => {
    return adverts.value.filter(advert => 
      advert.status === 'editor_rejected' || 
      advert.status === 'manager_rejected'
    )
  })
  
  const totalRevenue = computed(() => {
    return adverts.value.reduce((sum, advert) => {
      if (advert.status !== 'rejected') {
        return sum + (advert.totalAmount || 0)
      }
      return sum
    }, 0)
  })
  
  // Actions
  const loadAdverts = async (params = {}) => {
    loading.value = true
    error.value = null
    try {
      const queryParams = new URLSearchParams()
      
      // Add filters if provided
      if (params.status) {
        queryParams.append('filters[status][$eq]', params.status)
      }
      if (params.platformCategory) {
        queryParams.append('filters[platformCategory][$eq]', params.platformCategory)
      }
      if (params.search) {
        queryParams.append('filters[$or][0][clientName][$contains]', params.search)
        queryParams.append('filters[$or][1][advertTitle][$contains]', params.search)
        queryParams.append('filters[$or][2][reference][$contains]', params.search)
      }
      
      // Add populate and sort
      queryParams.append('populate[platform]', '*')
      queryParams.append('populate[product]', '*')
      queryParams.append('populate[rateCard]', '*')
      queryParams.append('populate[attachments]', '*')
      queryParams.append('populate[created_by_clerk]', '*')
      queryParams.append('sort', 'createdAt:desc')
      
      const response = await $fetch(`${API_BASE}/adverts?${queryParams}`)
      
      adverts.value = (response.data || []).map(advert => ({
        id: advert.id,
        reference: advert.attributes?.reference || advert.reference,
        clientName: advert.attributes?.clientName || advert.clientName,
        contactPerson: advert.attributes?.contactPerson || advert.contactPerson,
        email: advert.attributes?.email || advert.email,
        phone: advert.attributes?.phone || advert.phone,
        advertTitle: advert.attributes?.advertTitle || advert.advertTitle,
        platformCategory: advert.attributes?.platformCategory || advert.platformCategory,
        platform: advert.attributes?.platform?.data?.attributes?.name || advert.platform,
        platformId: advert.attributes?.platform?.data?.id || advert.platformId,
        product: advert.attributes?.product?.data?.attributes?.name || advert.product,
        productId: advert.attributes?.product?.data?.id || advert.productId,
        rateCard: advert.attributes?.rateCard?.data?.attributes?.name || advert.rateCard,
        rateCardId: advert.attributes?.rateCard?.data?.id || advert.rateCardId,
        adType: advert.attributes?.adType || advert.adType,
        startDate: advert.attributes?.startDate || advert.startDate,
        endDate: advert.attributes?.endDate || advert.endDate,
        frequency: advert.attributes?.frequency || advert.frequency,
        paymentMethod: advert.attributes?.paymentMethod || advert.paymentMethod,
        specialInstructions: advert.attributes?.specialInstructions || advert.specialInstructions,
        totalAmount: advert.attributes?.totalAmount || advert.totalAmount,
        status: advert.attributes?.status || advert.status,
        createdAt: advert.attributes?.createdAt || advert.createdAt,
        updatedAt: advert.attributes?.updatedAt || advert.updatedAt,
        submittedAt: advert.attributes?.submittedAt || advert.submittedAt,
        reviewedAt: advert.attributes?.reviewedAt || advert.reviewedAt,
        attachments: advert.attributes?.attachments?.data || advert.attachments || [],
        createdBy: advert.attributes?.created_by_clerk?.data?.attributes?.username || 'User',
        ...advert.attributes
      }))
    } catch (err) {
      error.value = err.message || 'Failed to load adverts'
      console.error('Error loading adverts:', err)
    } finally {
      loading.value = false
    }
  }
  
  const createAdvert = async (advertData) => {
    loading.value = true
    error.value = null

    console.log(`Testing Sales Agent ${advertData.salesAgentId}`)

    try {
      const data = {
        data: {
          clientName: advertData.clientName,
          contactPerson: advertData.contactPerson,
          email: advertData.email,
          phone: advertData.phone,
          advertTitle: advertData.advertTitle,
          platformCategory: advertData.platformCategory,
          platform: advertData.specificPlatform,
          product: advertData.product,
          rateCard: advertData.rateCardId,
          adType: advertData.adType,
          startDate: advertData.startDate,
          endDate: advertData.endDate,
          frequency: parseInt(advertData.frequency) || 1,
          paymentMethod: advertData.paymentMethod,
          specialInstructions: advertData.specialInstructions,
          totalAmount: advertData.totalAmount || 0,
          salesAgentId: advertData.salesAgentId,
          status: 'draft'
        }
      }
      
      const response = await $fetch(`${API_BASE}/adverts`, {
        method: 'POST',
        body: data
      })
      
      const newAdvert = {
        id: response.data.id,
        reference: response.data.attributes?.reference || `#ADV-${new Date().getFullYear()}-${response.data.id}`,
        ...response.data.attributes
      }
      
      adverts.value.unshift(newAdvert)
      return newAdvert
    } catch (err) {
      error.value = err.message || 'Failed to create advert'
      console.error('Error creating advert:', err)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  const updateAdvert = async (advertId, updates) => {
    loading.value = true
    error.value = null
    try {
      const data = {
        data: updates
      }
      
      const response = await $fetch(`${API_BASE}/adverts/${advertId}`, {
        method: 'PUT',
        body: data
      })
      
      // Update local state
      const index = adverts.value.findIndex(a => a.id === advertId)
      if (index !== -1) {
        adverts.value[index] = {
          ...adverts.value[index],
          ...response.data.attributes,
          id: advertId
        }
      }
      
      // Update selected advert if it's the same
      if (selectedAdvert.value?.id === advertId) {
        selectedAdvert.value = {
          ...selectedAdvert.value,
          ...updates
        }
      }
      
      return response.data
    } catch (err) {
      error.value = err.message || 'Failed to update advert'
      console.error('Error updating advert:', err)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  const deleteAdvert = async (advertId) => {
    loading.value = true
    error.value = null
    try {
      await $fetch(`${API_BASE}/adverts/${advertId}`, {
        method: 'DELETE'
      })
      
      adverts.value = adverts.value.filter(a => a.id !== advertId)
      
      // Clear selected advert if it's the deleted one
      if (selectedAdvert.value?.id === advertId) {
        selectedAdvert.value = null
      }
    } catch (err) {
      error.value = err.message || 'Failed to delete advert'
      console.error('Error deleting advert:', err)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  const setSelectedAdvert = (advertId) => {
    selectedAdvert.value = adverts.value.find(a => a.id === advertId) || null
  }
  
  const clearSelectedAdvert = () => {
    selectedAdvert.value = null
  }
  
  const submitForReview = async (advertId) => {
    return updateAdvert(advertId, { 
      status: 'pending_review',
      submittedAt: new Date().toISOString()
    })
  }
  
  const getAdvertById = async (advertId) => {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch(`${API_BASE}/adverts/${advertId}?populate=*`)
      
      if (response.data) {
        const advert = {
          id: response.data.id,
          reference: response.data.attributes?.reference,
          clientName: response.data.attributes?.clientName,
          contactPerson: response.data.attributes?.contactPerson,
          email: response.data.attributes?.email,
          phone: response.data.attributes?.phone,
          advertTitle: response.data.attributes?.advertTitle,
          platformCategory: response.data.attributes?.platformCategory,
          platform: response.data.attributes?.platform?.data?.attributes?.name,
          platformId: response.data.attributes?.platform?.data?.id,
          product: response.data.attributes?.product?.data?.attributes?.name,
          productId: response.data.attributes?.product?.data?.id,
          rateCard: response.data.attributes?.rateCard?.data?.attributes?.name,
          rateCardId: response.data.attributes?.rateCard?.data?.id,
          adType: response.data.attributes?.adType,
          startDate: response.data.attributes?.startDate,
          endDate: response.data.attributes?.endDate,
          frequency: response.data.attributes?.frequency,
          paymentMethod: response.data.attributes?.paymentMethod,
          specialInstructions: response.data.attributes?.specialInstructions,
          totalAmount: response.data.attributes?.totalAmount,
          status: response.data.attributes?.status,
          createdAt: response.data.attributes?.createdAt,
          updatedAt: response.data.attributes?.updatedAt,
          attachments: response.data.attributes?.attachments?.data || [],
          ...response.data.attributes
        }
        
        return advert
      }
      
      return response
    } catch (err) {
      error.value = err.message || 'Failed to get advert details'
      console.error('Error getting advert details:', err)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  const attachFile = async (advertId, file) => {
    loading.value = true
    error.value = null
    try {
      const formData = new FormData()
      formData.append('files', file)
      formData.append('ref', 'api::advert.advert')
      formData.append('refId', advertId)
      formData.append('field', 'attachments')
      
      const response = await $fetch(`${process.env.NUXT_PUBLIC_UPLOAD_BASE || 'https://cms-vgad.visiongroup.co.ug'}/upload`, {
        method: 'POST',
        body: formData
      })
      
      // Update local advert attachments
      const index = adverts.value.findIndex(a => a.id === advertId)
      if (index !== -1) {
        if (!Array.isArray(adverts.value[index].attachments)) {
          adverts.value[index].attachments = []
        }
        adverts.value[index].attachments.push(...(Array.isArray(response) ? response : [response]))
      }
      
      return response
    } catch (err) {
      error.value = err.message || 'Failed to attach file'
      console.error('Error attaching file:', err)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  const calculatePrice = async (data) => {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch(`${API_BASE}/adverts/calculate-price`, {
        method: 'POST',
        body: data
      })
      
      return response
    } catch (err) {
      error.value = err.message || 'Failed to calculate price'
      console.error('Error calculating price:', err)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  return {
    // State
    adverts,
    selectedAdvert,
    loading,
    error,
    
    // Getters
    draftAdverts,
    pendingAdverts,
    approvedAdverts,
    rejectedAdverts,
    totalRevenue,
    
    // Actions
    loadAdverts,
    createAdvert,
    updateAdvert,
    deleteAdvert,
    setSelectedAdvert,
    clearSelectedAdvert,
    submitForReview,
    getAdvertById,
    attachFile,
    calculatePrice
  }
})