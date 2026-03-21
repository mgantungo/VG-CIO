//composables/useAdverts.js
import { ref } from 'vue'
import { useRuntimeConfig } from '#imports'

export const useAdverts = () => {
  const adverts = ref([])
  const loading = ref(false)
  const error   = ref(null)
  const config  = useRuntimeConfig()

  const API_BASE = config.public.apiBase

  // ── Load adverts ────────────────────────────────────────────────────────────
  const loadAdverts = async (params = {}) => {
    loading.value = true
    error.value   = null
    try {
      const vgamsUser = JSON.parse(localStorage.getItem('vgams_user'))
      if (!vgamsUser?.id) throw new Error('User not authenticated')

      const response = await $fetch(`${API_BASE}/adverts/my-adverts`, {
        method: 'POST',
        body:    { vgamsUserId: vgamsUser.id, ...params },
        headers: { 'Content-Type': 'application/json' }
      })

      adverts.value = (response.data || []).map(advert => ({
        id:            advert.id,
        reference:     advert.reference_number,
        advertTitle:   advert.advert_title,
        clientName:    advert.client?.company_name,
        status:        advert.status,
        totalAmount:   advert.total_amount,
        revenueStream: advert.product?.revenue_stream ?? null,
        costStream:    advert.product?.cost_stream    ?? null,
        createdAt:     advert.createdAt,
      }))
    } catch (err) {
      error.value = err.message || 'Failed to load adverts'
      console.error('Failed to load adverts:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // ── Create advert ───────────────────────────────────────────────────────────
  const createAdvert = async (advertData) => {
    //This is what is used to post advert data
    loading.value = true
    error.value   = null
    try {
      const vgamsUser = JSON.parse(localStorage.getItem('vgams_user'))
      if (!vgamsUser?.id) throw new Error('User not authenticated. Please log in.')

      // ── Compile every data field from all form sections ──────────────────────
      //
      //  Source components:
      //    ClientInformation  → clientId, clientName, contactPerson, email,
      //                         phone, referenceDocument
      //    AdvertInformation  → advertTitle, platformCategory, product,
      //                         rateCard (rateCardId), adSize, adType,
      //                         officeLocation, publishOnWeb
      //    SchedulePricing    → startDate, endDate, datesList, dateCount,
      //                         frequency, paymentMethod, discount,
      //                         basePrice, surcharge, totalAmount
      //    SalesAgentSelection→ salesAgentId
      //    AdditionalInfo     → specialInstructions (includes encoded dates)
      //    FileUpload         → files
      //    VGAMS session      → vgamsUserId, vgamsUserName, etc.
      //
      const data = {
        // ── Client (required – selected from dropdown) ───────────────────────
        clientId:          advertData.clientId   || null,   // ← FK used by controller
        clientName:        advertData.clientName || '',     // ← display / fallback
        contactPerson:     advertData.contactPerson     || '',
        contactEmail:      advertData.contactEmail      || advertData.email || '',
        contactNumber:     advertData.contactNumber     || advertData.phone || '',
        email:             advertData.email             || '',
        phone:             advertData.phone             || '',
        referenceDocument: advertData.referenceDocument || '',
        marketSector:  advertData.marketSector  || '',

        // ── Advert info ───────────────────────────────────────────────────────
        advertTitle:      advertData.advertTitle,
        platformCategory: advertData.platformCategory || '',
        product:          advertData.product          || null,
        rateCard:         advertData.rateCard         || null,
        adSize:           advertData.adSize           || '',
        adType:           advertData.adType           || 'full_color',
        officeLocation:   advertData.officeLocation   || '',
        publishOnWeb:     Boolean(advertData.publishOnWeb),

        // ── Schedule & dates ──────────────────────────────────────────────────
        startDate:      advertData.startDate,
        endDate:        advertData.endDate        || null,
        datesList:      advertData.datesList      || [],   // full array of selected ISO dates
        publishingDates: advertData.publishingDates || [], // merged + sorted, saved to DB
        dateCount:      advertData.dateCount      || 1,    // count used in price calculation

        // ── Frequency ────────────────────────────────────────────────────────
        frequency: parseInt(advertData.frequency) || 1,

        // ── Pricing (base × freq × dateCount, then surcharge – discount) ─────
        basePrice:   parseFloat(advertData.basePrice)   || 0,
        surcharge:   parseFloat(advertData.surcharge)   || 0,
        discount:    parseFloat(advertData.discount)    || 0,
        totalAmount: parseFloat(advertData.totalAmount) || 0,

        // ── Payment & workflow ────────────────────────────────────────────────
        paymentMethod:       advertData.paymentMethod,
      
        specialInstructions: advertData.specialInstructions || '',
        status:              advertData.status || 'draft',

        // ── Sales agent ───────────────────────────────────────────────────────
        salesAgentId: advertData.salesAgentId || null,

        // ── VGAMS session user ────────────────────────────────────────────────
        vgamsUserId:    vgamsUser.id,
        vgamsUserName:  vgamsUser.name,
        vgamsUserEmail: vgamsUser.email,
        vgamsUserRole:  vgamsUser.role,
      }

      console.log('📤 Sending advert data:', {
        clientId:      data.clientId,
        advertTitle:   data.advertTitle,
        product:       data.product,
        rateCard:      data.rateCard,
        totalAmount:   data.totalAmount,
        dateCount:     data.dateCount,
        publishOnWeb:  data.publishOnWeb,
        salesAgentId:  data.salesAgentId,
        userId:        vgamsUser.id,
      })

      // Use FormData so files and JSON travel in one multipart request
      const formData = new FormData()
      formData.append('data', JSON.stringify(data))

      if (advertData.files?.length > 0) {
        advertData.files.forEach(file => {
          if (file.file instanceof File) formData.append('files', file.file)
        })
      }

      const response = await $fetch(`${API_BASE}/adverts`, {
        method: 'POST',
        body:   formData
        // Let browser set Content-Type + boundary automatically
      })

      console.log('✅ API response:', response)

      const newAdvert = {
        id:            response.data.id,
        reference:     response.data.reference_number || `ADV-${response.data.id}`,
        revenueStream: response.revenue_stream || null,
        costStream:    response.cost_stream    || null,
        ...response.data
      }

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

  // ── Update advert ───────────────────────────────────────────────────────────
  const updateAdvert = async (advertId, updates) => {
    loading.value = true
    error.value   = null
    try {
      const response = await $fetch(`${API_BASE}/adverts/${advertId}`, {
        method: 'PUT',
        body:   { data: updates }
      })
      const index = adverts.value.findIndex(a => a.id === advertId)
      if (index !== -1) adverts.value[index] = { ...adverts.value[index], ...response.data }
      return response.data
    } catch (err) {
      error.value = err.message || 'Failed to update advert'
      console.error('Failed to update advert:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // ── Delete advert ───────────────────────────────────────────────────────────
  const deleteAdvert = async (advertId) => {
    loading.value = true
    error.value   = null
    try {
      await $fetch(`${API_BASE}/adverts/${advertId}`, { method: 'DELETE' })
      adverts.value = adverts.value.filter(a => a.id !== advertId)
    } catch (err) {
      error.value = err.message || 'Failed to delete advert'
      console.error('Failed to delete advert:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // ── Submit for review ────────────────────────────────────────────────────────
  const submitForReview = async (advertId) => {
    loading.value = true
    error.value   = null
    try {
      return await $fetch(`${API_BASE}/adverts/${advertId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
    } catch (err) {
      error.value = err.message || 'Failed to submit advert'
      console.error('Failed to submit advert:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // ── Get advert by ID ─────────────────────────────────────────────────────────
  const getAdvertById = async (advertId) => {
    loading.value = true
    error.value   = null
    try {
      return await $fetch(`${API_BASE}/adverts/${advertId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
    } catch (err) {
      error.value = err.message || 'Failed to get advert'
      console.error('Failed to get advert:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // ── Calculate price ──────────────────────────────────────────────────────────
  const calculatePrice = async (params) => {
    loading.value = true
    error.value   = null
    try {
      return await $fetch(`${API_BASE}/adverts/calculate-price`, {
        method: 'POST',
        body:   params,
        headers: { 'Content-Type': 'application/json' }
      })
    } catch (err) {
      error.value = err.message || 'Failed to calculate price'
      console.error('Failed to calculate price:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // ── Date range adverts ───────────────────────────────────────────────────────
  const getDateRangeAdverts = async (params = {}) => {
    loading.value = true
    error.value   = null
    try {
      return await $fetch(`${API_BASE}/adverts-by-date-range`, {
        method: 'GET',
        params,
        headers: { 'Content-Type': 'application/json' }
      })
    } catch (err) {
      error.value = err.message || 'Failed to get date range adverts'
      console.error('Failed to get date range adverts:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // ── Schedule helpers ─────────────────────────────────────────────────────────
  const scheduleAdvert = async (advertId, scheduleData) => {
    loading.value = true
    error.value   = null
    try {
      const { mediaFiles, existingAttachmentIds, runDate, runTime, isPublished } = scheduleData

      const formData = new FormData()

      // ── Flat fields — controller reads body.advertId, body.runDate etc. directly ──
      formData.append('advertId',   String(advertId))
      formData.append('runDate',    runDate)
      if (runTime)      formData.append('runTime',    JSON.stringify(runTime))
      if (isPublished !== undefined) formData.append('isPublished', String(isPublished))

      // ── Existing CMS attachment IDs to link to the schedule ──
      if (Array.isArray(existingAttachmentIds) && existingAttachmentIds.length > 0) {
        formData.append('existingAttachmentIds', JSON.stringify(existingAttachmentIds))
      }

      // ── New files — controller checks files.files ──
      if (Array.isArray(mediaFiles) && mediaFiles.length > 0) {
        mediaFiles.forEach(file => {
          if (file instanceof File) formData.append('files', file)
        })
      }

      return await $fetch(`${API_BASE}/advert-daily-schedules/schedule`, {
        method: 'POST',
        body:   formData
        // Do NOT set Content-Type — browser sets multipart/form-data + boundary automatically
      })
    } catch (err) {
      error.value = err.message || 'Failed to schedule advert'
      console.error('Failed to schedule advert:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const getAdvertSchedules = async (advertId) => {
    loading.value = true
    error.value   = null
    try {
      return await $fetch(`${API_BASE}/advert-daily-schedules/advert/${advertId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
    } catch (err) {
      error.value = err.message || 'Failed to get advert schedules'
      console.error('Failed to get advert schedules:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const getSchedulesByDateRange = async (params = {}) => {
    loading.value = true
    error.value   = null
    try {
      return await $fetch(`${API_BASE}/advert-daily-schedules/date-range`, {
        method: 'GET',
        params,
        headers: { 'Content-Type': 'application/json' }
      })
    } catch (err) {
      error.value = err.message || 'Failed to get schedules by date range'
      console.error('Failed to get schedules by date range:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const unscheduleAdvert = async (scheduleId) => {
    loading.value = true
    error.value   = null
    try {
      return await $fetch(`${API_BASE}/advert-daily-schedules/unschedule/${scheduleId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      })
    } catch (err) {
      error.value = err.message || 'Failed to unschedule advert'
      throw err
    } finally {
      loading.value = false
    }
  }

  const toggleSchedulePublish = async (scheduleId, isPublished) => {
    loading.value = true
    error.value   = null
    try {
      return await $fetch(`${API_BASE}/advert-daily-schedules/publish/${scheduleId}`, {
        method: 'PUT',
        body:   { isPublished },
        headers: { 'Content-Type': 'application/json' }
      })
    } catch (err) {
      error.value = err.message || 'Failed to toggle publish status'
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateSchedule = async (scheduleId, updates) => {
    loading.value = true
    error.value   = null
    try {
      return await $fetch(`${API_BASE}/advert-daily-schedules/${scheduleId}/update`, {
        method: 'PUT',
        body:   updates,
        headers: { 'Content-Type': 'application/json' }
      })
    } catch (err) {
      error.value = err.message || 'Failed to update schedule'
      throw err
    } finally {
      loading.value = false
    }
  }

  const getFullSchedules = async (params = {}) => {
    loading.value = true
    error.value   = null
    try {
      return await $fetch(`${API_BASE}/advert-daily-schedules/full`, {
        method: 'GET',
        params,
        headers: { 'Content-Type': 'application/json' }
      })
    } catch (err) {
      error.value = err.message || 'Failed to get full schedules'
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateSchedulePage = async (scheduleId, page) => {
    loading.value = true
    error.value   = null
    try {
      return await $fetch(`${API_BASE}/advert-daily-schedules/${scheduleId}/page`, {
        method: 'PUT',
        body:   { page },
        headers: { 'Content-Type': 'application/json' }
      })
    } catch (err) {
      error.value = err.message || 'Failed to update schedule page'
      throw err
    } finally {
      loading.value = false
    }
  }

  const bulkUpdateSchedulePages = async (updates) => {
    loading.value = true
    error.value   = null
    try {
      return await $fetch(`${API_BASE}/advert-daily-schedules/bulk-update-pages`, {
        method: 'PUT',
        body:   { updates },
        headers: { 'Content-Type': 'application/json' }
      })
    } catch (err) {
      error.value = err.message || 'Failed to bulk update pages'
      throw err
    } finally {
      loading.value = false
    }
  }

    // ── Get BC Sync Status by Reference ───────────────────────────────────────
  const getBcSyncStatus = async (reference) => {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch(`${API_BASE}/adverts/bc-status`, {
        method: 'POST',
        body: { reference },
        headers: { 'Content-Type': 'application/json' }
      })
      
      console.log('📊 BC Sync Status Response:', response)
      return response
    } catch (err) {
      error.value = err.message || 'Failed to get BC sync status'
      console.error('Failed to get BC sync status:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

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
    scheduleAdvert,
    getAdvertSchedules,
    getSchedulesByDateRange,
    getBcSyncStatus, 
    unscheduleAdvert,
    toggleSchedulePublish,
    updateSchedule,
    getFullSchedules,
    updateSchedulePage,
    bulkUpdateSchedulePages,
  }
}