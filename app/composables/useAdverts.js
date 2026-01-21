//composables/useAdverts.js
import { ref } from 'vue'
import { useRuntimeConfig } from '#imports'

export const useAdverts = () => {
  const adverts = ref([])
  const loading = ref(false)
  const error = ref(null)
  const config = useRuntimeConfig()
  
  // API base URL from environment
  const API_BASE = config.public.apiBase;//process.env.NUXT_PUBLIC_API_BASE || 'https://cms-vgad.visiongroup.co.ug/api'
  //const apiUrl = config.public.apiBase;
  
  const loadAdverts = async (params = {}) => {
    loading.value = true
    error.value = null
    try {
      // Get VGAMS user from localStorage
      const vgamsUser = JSON.parse(localStorage.getItem('vgams_user'))
      
      if (!vgamsUser || !vgamsUser.id) {
        throw new Error('User not authenticated')
      }
      
      // Send user ID in body for POST request
      const response = await $fetch(`${API_BASE}/adverts/my-adverts`, {
        method: 'POST',
        body: {
          vgamsUserId: vgamsUser.id,
          ...params
        },
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      // Transform response
      adverts.value = (response.data || []).map(advert => ({
        id: advert.id,
        reference: advert.reference_number,
        advertTitle: advert.advert_title,
        clientName: advert.client?.client_name,
        status: advert.status,
        totalAmount: advert.total_amount,
        createdAt: advert.createdAt,
        // ... other fields
      }))
      
    } catch (err) {
      error.value = err.message || 'Failed to load adverts'
      console.error('Failed to load adverts:', err)
      throw err
    } finally {
      loading.value = false
    }
  }
  /*

  commented out by vincent Mujuzi on 2026-08-01
  const createAdvert = async (advertData) => {
    loading.value = true
    error.value = null
    try {
      // Prepare data for Strapi
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
          frequency: advertData.frequency,
          paymentMethod: advertData.paymentMethod,
          specialInstructions: advertData.specialInstructions,
          totalAmount: advertData.totalAmount,
          status: 'draft'
        }
      }
      
      const response = await $fetch(`${API_BASE}/adverts`, {
        method: 'POST',
        body: data
      })
      
      // Transform response
      const newAdvert = {
        id: response.data.id,
        reference: response.data.attributes?.reference || `#ADV-${new Date().getFullYear()}-${response.data.id}`,
        ...response.data.attributes
      }
      
      // Add to local state
      adverts.value.unshift(newAdvert)
      
      return newAdvert
    } catch (err) {
      error.value = err.message || 'Failed to create advert'
      console.error('Failed to create advert:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  */
/*
const createAdvert = async (advertData) => {
  loading.value = true
  error.value = null
  try {
    // Get VGAMS user from localStorage
    const vgamsUser = JSON.parse(localStorage.getItem('vgams_user'))
    
    if (!vgamsUser || !vgamsUser.id) {
      throw new Error('User not authenticated. Please log in.')
    }
    
    // Prepare data for Strapi v5
    const data = {
      data: {
        // Advert data
        advertTitle: advertData.advertTitle,
        clientName: advertData.clientName,
        contactPerson: advertData.contactPerson || '',
        email: advertData.email,
        phone: advertData.phone,
        platformCategory: advertData.platformCategory,
        product: advertData.product,
        rateCard: advertData.rateCard,
        adSize: advertData.adSize || '',
        adType: advertData.adType || 'full_color',
        frequency: parseInt(advertData.frequency) || 1,
        startDate: advertData.startDate,
        endDate: advertData.endDate || null,
        basePrice: parseFloat(advertData.basePrice) || 0,
        surcharge: parseFloat(advertData.surcharge) || 0,
        totalAmount: parseFloat(advertData.totalAmount) || 0,
        paymentMethod: advertData.paymentMethod,
        specialInstructions: advertData.specialInstructions || '',
        status: advertData.status || 'draft',
        
        // VGAMS user data
        vgamsUserId: vgamsUser.id,
        vgamsUserName: vgamsUser.name,
        vgamsUserEmail: vgamsUser.email,
        vgamsUserRole: vgamsUser.role
      }
    }
    
    console.log('📤 Sending advert data with VGAMS user in body:', {
      userId: vgamsUser.id,
      userName: vgamsUser.name
    });
    
    const response = await $fetch(`${API_BASE}/adverts`, {
      method: 'POST',
      body: data,
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    console.log('✅ API response:', response);
    
    // Transform response
    const newAdvert = {
      id: response.data.id,
      reference: response.data.attributes.reference_number || `ADV-${response.data.id}`,
      ...response.data.attributes
    }
    
    // Add to local state
    adverts.value.unshift(newAdvert)
    
    return newAdvert
  } catch (err) {
    error.value = err.message || 'Failed to create advert'
    console.error('❌ Failed to create advert:', err)
    throw err
  } finally {
    loading.value = false
  }
}
*/

const createAdvert = async (advertData) => {
  loading.value = true
  error.value = null
  try {
    // Get VGAMS user from localStorage
    const vgamsUser = JSON.parse(localStorage.getItem('vgams_user'))
    
    if (!vgamsUser || !vgamsUser.id) {
      throw new Error('User not authenticated. Please log in.')
    }
    
    // Create FormData for file upload
    const formData = new FormData()
    
    // Add the data object as JSON string
    const data = {
      advertTitle: advertData.advertTitle,
      clientName: advertData.clientName,
      contactPerson: advertData.contactPerson || '',
      email: advertData.email,
      phone: advertData.phone,
      platformCategory: advertData.platformCategory,
      product: advertData.product,
      rateCard: advertData.rateCard,
      adSize: advertData.adSize || '',
      adType: advertData.adType || 'full_color',
      frequency: parseInt(advertData.frequency) || 1,
      startDate: advertData.startDate,
      endDate: advertData.endDate || null,
      basePrice: parseFloat(advertData.basePrice) || 0,
      surcharge: parseFloat(advertData.surcharge) || 0,
      totalAmount: parseFloat(advertData.totalAmount) || 0,
      paymentMethod: advertData.paymentMethod,
      specialInstructions: advertData.specialInstructions || '',
      status: advertData.status || 'draft',
      
      // VGAMS user data
      vgamsUserId: vgamsUser.id,
      vgamsUserName: vgamsUser.name,
      vgamsUserEmail: vgamsUser.email,
      vgamsUserRole: vgamsUser.role
    }
    
    // Add data as JSON string
    formData.append('data', JSON.stringify(data))
    
    // Add files if any
    if (advertData.files && advertData.files.length > 0) {
      advertData.files.forEach((file, index) => {
        if (file.file instanceof File) {
          formData.append(`files`, file.file)
        }
      })
    }
    
    console.log('📤 Sending advert data with files:', {
      hasFiles: advertData.files?.length || 0,
      userId: vgamsUser.id
    })
    
    const response = await $fetch(`${API_BASE}/adverts`, {
      method: 'POST',
      body: formData
      // Don't set Content-Type header - let browser set it with boundary for multipart/form-data
    })
    
    console.log('✅ API response:', response)
    
    // Transform response
    const newAdvert = {
      id: response.data.id,
      reference: response.data.reference_number || `ADV-${response.data.id}`,
      ...response.data
    }
    
    // Add to local state
    adverts.value.unshift(newAdvert)
    
    return newAdvert
  } catch (err) {
    error.value = err.message || 'Failed to create advert'
    console.error('❌ Failed to create advert:', err)
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
          ...response.data.attributes
        }
      }
      
      return response.data
    } catch (err) {
      error.value = err.message || 'Failed to update advert'
      console.error('Failed to update advert:', err)
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
      
      // Remove from local state
      adverts.value = adverts.value.filter(a => a.id !== advertId)
    } catch (err) {
      error.value = err.message || 'Failed to delete advert'
      console.error('Failed to delete advert:', err)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  const submitForReview = async (advertId) => {
    loading.value = true
    error.value = null
    try {
      await $fetch(`${API_BASE}/adverts/${advertId}/submit`, {
        method: 'POST'
      })
      
      // Update local status
      const index = adverts.value.findIndex(a => a.id === advertId)
      if (index !== -1) {
        adverts.value[index].status = 'pending_review'
      }
    } catch (err) {
      error.value = err.message || 'Failed to submit advert for review'
      console.error('Failed to submit advert for review:', err)
      throw err
    } finally {
      loading.value = false
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
    
    await $fetch(`${API_BASE}/adverts/${advertId}/attachments`, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('jwt')}`
      }
    })
  } catch (err) {
    console.error('Failed to upload files:', err)
  }
}
  
  const getAdvertById = async (advertId) => {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch(`${API_BASE}/adverts/${advertId}?populate=*`)
      
      return response.data
    } catch (err) {
      error.value = err.message || 'Failed to get advert details'
      console.error('Failed to get advert details:', err)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  // Keep the calculatePrice function if needed for backward compatibility
  const calculatePrice = async (data) => {
    try {
      // Use the price calculator endpoint
      const response = await $fetch(`${API_BASE}/adverts/calculate-price`, {
        method: 'POST',
        body: data
      })
      
      return response
    } catch (err) {
      console.error('Failed to calculate price:', err)
      throw err
    }
  }

  const getDateRangeAdverts = async (params = {}) => {
      loading.value = true
      error.value = null
      try {
        // Set default to today if no dates provided
        if (!params.startDate && !params.endDate) {
          const today = new Date()
          params.startDate = today.toISOString().split('T')[0]
          params.endDate = today.toISOString().split('T')[0]
        }
        
        console.log('📅 Fetching date range adverts with params:', params)
        
        const response = await $fetch(`${API_BASE}/adverts-by-date-range`, {
          method: 'GET',
          params: params,
          headers: {
            'Content-Type': 'application/json'
          }
        })
        
        console.log('✅ API Response received:', response)
        
        if (!response.success) {
          throw new Error(response.message || 'Failed to fetch adverts')
        }
        
        // Transform the data to match your component's needs
        const advertsList = (response.data || []).map(advert => ({
          id: advert.id,
          reference: advert.reference_number,
          advertTitle: advert.advert_title,
          clientName: advert.client?.company_name,
          client: advert.client,
          product: advert.product,
          rateCard: advert.rate_card,
          adSize: advert.ad_size,
          adType: advert.ad_type,
          frequency: advert.frequency,
          startDate: advert.start_date,
          endDate: advert.end_date,
          basePrice: advert.base_price,
          surcharge: advert.surcharge,
          discount: advert.discount,
          totalAmount: advert.total_amount,
          paymentMethod: advert.payment_method,
          specialInstructions: advert.special_instructions,
          status: advert.status,
          attachments: advert.attachments,
          createdAt: advert.createdAt,
          updatedAt: advert.updatedAt,
          createdBy: advert.createdByUser ? {
            id: advert.createdByUser.id,
            name: advert.createdByUser.name,
            email: advert.createdByUser.email,
            role: advert.createdByUser.role
          } : null
        }))
        
        return {
          data: advertsList,
          count: response.count || 0,
          statistics: response.statistics || {
            totalAmount: 0,
            totalDiscount: 0,
            averageAmount: 0,
            uniqueUsers: 0
          },
          dateRange: response.dateRange || {},
          users: response.users || []
        }
        
      } catch (err) {
        error.value = err.message || 'Failed to load date range adverts'
        console.error('❌ Failed to load date range adverts:', err)
        throw err
      } finally {
        loading.value = false
      }
    }


    const scheduleAdvert = async (scheduleData) => {
          loading.value = true
          error.value = null
          try {
            const API_BASE = config.public.apiBase
            
            // Create FormData
            const formData = new FormData()
            
            // Add fields as simple strings
            formData.append('advertId', scheduleData.advertId.toString())
            formData.append('runDate', scheduleData.runDate)
            
            if (scheduleData.runTime) {
              formData.append('runTime', JSON.stringify(scheduleData.runTime))
            }
            
            formData.append('isPublished', (scheduleData.isPublished || false).toString())
            
            // Add files - ensure they're File objects
            if (scheduleData.mediaFiles && scheduleData.mediaFiles.length > 0) {
              scheduleData.mediaFiles.forEach((file) => {
                if (file instanceof File) {
                  formData.append('mediaFiles', file)
                } else if (file.file instanceof File) {
                  formData.append('mediaFiles', file.file)
                }
              })
            }
            
            // Debug what's being sent
            console.log('Sending FormData:')
            for (let [key, value] of formData.entries()) {
              if (value instanceof File) {
                console.log(`${key}: File - ${value.name} (${value.size} bytes)`)
              } else {
                console.log(`${key}: ${value}`)
              }
            }
            
            // Send request WITHOUT Content-Type header
            const response = await $fetch(`${API_BASE}/advert-daily-schedules/schedule`, {
              method: 'POST',
              body: formData
            })
            
            console.log('Response:', response)
            
            return response
            
          } catch (err) {
            error.value = err.message || 'Failed to schedule advert'
            console.error('Error:', err)
            throw err
          } finally {
            loading.value = false
          }
        }

      // Add this function to useAdverts.js for getting schedules by advert ID
      const getAdvertSchedules = async (advertId) => {
        loading.value = true
        error.value = null
        try {
          console.log('📋 Getting schedules for advert:', advertId)
          
          const response = await $fetch(`${API_BASE}/advert-daily-schedules/advert/${advertId}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          })
          
          console.log('✅ Schedules response:', response)
          
          return response
          
        } catch (err) {
          error.value = err.message || 'Failed to get advert schedules'
          console.error('❌ Failed to get advert schedules:', err)
          throw err
        } finally {
          loading.value = false
        }
      }

      // Add this function to useAdverts.js for getting schedules by date range
      const getSchedulesByDateRange = async (params = {}) => {
        loading.value = true
        error.value = null
        try {
          console.log('📅 Getting schedules by date range:', params)
          
          const response = await $fetch(`${API_BASE}/advert-daily-schedules/date-range`, {
            method: 'GET',
            params: params,
            headers: {
              'Content-Type': 'application/json'
            }
          })
          
          console.log('✅ Date range schedules response:', response)
          
          return response
          
        } catch (err) {
          error.value = err.message || 'Failed to get schedules by date range'
          console.error('❌ Failed to get schedules by date range:', err)
          throw err
        } finally {
          loading.value = false
        }
      }

      // Add this function to useAdverts.js for unscheduling an advert
      const unscheduleAdvert = async (scheduleId) => {
        loading.value = true
        error.value = null
        try {
          console.log('🗑️ Unscheduling schedule:', scheduleId)
          
          const response = await $fetch(`${API_BASE}/advert-daily-schedules/unschedule/${scheduleId}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json'
            }
          })
          
          console.log('✅ Unschedule response:', response)
          
          return response
          
        } catch (err) {
          error.value = err.message || 'Failed to unschedule advert'
          console.error('❌ Failed to unschedule advert:', err)
          throw err
        } finally {
          loading.value = false
        }
      }

      // Add this function to useAdverts.js for toggling publish status
      const toggleSchedulePublish = async (scheduleId, isPublished) => {
        loading.value = true
        error.value = null
        try {
          console.log('📢 Toggling publish status:', { scheduleId, isPublished })
          
          const response = await $fetch(`${API_BASE}/advert-daily-schedules/publish/${scheduleId}`, {
            method: 'PUT',
            body: { isPublished },
            headers: {
              'Content-Type': 'application/json'
            }
          })
          
          console.log('✅ Publish status response:', response)
          
          return response
          
        } catch (err) {
          error.value = err.message || 'Failed to toggle publish status'
          console.error('❌ Failed to toggle publish status:', err)
          throw err
        } finally {
          loading.value = false
        }
      }

      // Add this function to useAdverts.js for updating a schedule
      const updateSchedule = async (scheduleId, updates) => {
        loading.value = true
        error.value = null
        try {
          console.log('✏️ Updating schedule:', { scheduleId, updates })
          
          const response = await $fetch(`${API_BASE}/advert-daily-schedules/${scheduleId}`, {
            method: 'PUT',
            body: updates,
            headers: {
              'Content-Type': 'application/json'
            }
          })
          
          console.log('✅ Update schedule response:', response)
          
          return response
          
        } catch (err) {
          error.value = err.message || 'Failed to update schedule'
          console.error('❌ Failed to update schedule:', err)
          throw err
        } finally {
          loading.value = false
        }
      }

      // Get full schedules with all details (advert, client, media, page)
      const getFullSchedules = async (params = {}) => {
        loading.value = true
        error.value = null
        try {
          console.log('📊 Getting full schedules:', params)
          
          const response = await $fetch(`${API_BASE}/advert-daily-schedules/full`, {
            method: 'GET',
            params: params,
            headers: {
              'Content-Type': 'application/json'
            }
          })
          
          console.log('✅ Full schedules response:', response)
          
          return response
          
        } catch (err) {
          error.value = err.message || 'Failed to get full schedules'
          console.error('❌ Failed to get full schedules:', err)
          throw err
        } finally {
          loading.value = false
        }
      }

      // Update page for a single schedule
      const updateSchedulePage = async (scheduleId, page) => {
        loading.value = true
        error.value = null
        try {
          console.log('📄 Updating schedule page:', { scheduleId, page })
          
          const response = await $fetch(`${API_BASE}/advert-daily-schedules/${scheduleId}/page`, {
            method: 'PUT',
            body: { page },
            headers: {
              'Content-Type': 'application/json'
            }
          })
          
          console.log('✅ Update page response:', response)
          
          return response
          
        } catch (err) {
          error.value = err.message || 'Failed to update schedule page'
          console.error('❌ Failed to update schedule page:', err)
          throw err
        } finally {
          loading.value = false
        }
      }

      // Bulk update pages for multiple schedules
      const bulkUpdateSchedulePages = async (updates) => {
        loading.value = true
        error.value = null
        try {
          console.log('📋 Bulk updating pages:', updates)
          
          const response = await $fetch(`${API_BASE}/advert-daily-schedules/bulk-update-pages`, {
            method: 'PUT',
            body: { updates },
            headers: {
              'Content-Type': 'application/json'
            }
          })
          
          console.log('✅ Bulk update pages response:', response)
          
          return response
          
        } catch (err) {
          error.value = err.message || 'Failed to bulk update pages'
          console.error('❌ Failed to bulk update pages:', err)
          throw err
        } finally {
          loading.value = false
        }
      }
  
  /*
  return {
    adverts,
    loading,
    error,
    loadAdverts,
    createAdvert,
    updateAdvert,
    deleteAdvert,
    submitForReview,
    getAdvertById,
    calculatePrice,
    getDateRangeAdverts
     // Keep for compatibility
  }
  */

  return {
      adverts,
      loading,
      error,
      loadAdverts,
      createAdvert,
      updateAdvert,
      deleteAdvert,
      submitForReview,
      getAdvertById,
      calculatePrice,
      getDateRangeAdverts,
      // Add the new schedule functions:
      scheduleAdvert,
      getAdvertSchedules,
      getSchedulesByDateRange,
      unscheduleAdvert,
      toggleSchedulePublish,
      updateSchedule,
      getFullSchedules,
      updateSchedulePage,
      bulkUpdateSchedulePages
    }


}