import { ref, computed } from 'vue'
import { useRuntimeConfig } from '#imports'

export const useDesign = () => {
  const config = useRuntimeConfig()
  const API_BASE = config.public.apiBase
  
  const adverts = ref([])
  const recentUploads = ref([])
  const loading = ref(false)
  const error = ref(null)
  
  // Statistics
  const activeProjects = ref(0)
  const readyToUpload = ref(0)
  const totalFiles = ref(0)
  const completedDesigns = ref(0)
  
  /**
   * Load adverts ready for design work
   * Criteria:
   * - isPaid = true
   * - isClosed = false
   * - isActive = true
   * - isCanceled = false
   * - Today between start_date and end_date (inclusive)
   */
  const loadDesigns = async () => {
    loading.value = true
    error.value = null
    
    try {
      console.log('🎨 Loading design adverts...')
      
      const response = await $fetch(`${API_BASE}/design-house/active-adverts`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to load design adverts')
      }
      
      console.log(`✅ Loaded ${response.count} design adverts`)
      
      // Transform API data
      adverts.value = (response.data || []).map(advert => ({
        id: advert.id,
        reference: advert.reference_number,
        clientName: advert.client?.company_name || 'N/A',
        advertTitle: advert.advert_title,
        platform: advert.product?.product_name || 'Unknown',
        category: advert.product?.category?.category_name || '',
        attachments: (advert.attachments || []).length,
        fileSize: calculateTotalSize(advert.attachments || []),
        designStatus: advert.isApproved ? 'complete' : 'pending',
        hasBrief: (advert.special_instructions || '').length > 0,
        startDate: advert.start_date,
        endDate: advert.end_date,
        totalAmount: advert.total_amount,
        adType: advert.ad_type,
        adSize: advert.ad_size,
        specialInstructions: advert.special_instructions,
        files: advert.attachments || []
      }))
      
      // Update statistics from response
      if (response.statistics) {
        updateStatistics(response.statistics)
      }
      
      return {
        success: true,
        data: adverts.value,
        count: response.count,
        statistics: response.statistics
      }
      
    } catch (err) {
      error.value = err.message || 'Failed to load design adverts'
      console.error('❌ Error loading designs:', err)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Load design statistics
   */
  const loadDesignStats = async () => {
    loading.value = true
    error.value = null
    
    try {
      console.log('📊 Loading design statistics...')
      
      const response = await $fetch(`${API_BASE}/design-house/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to load statistics')
      }
      
      // Update statistics
      if (response.statistics) {
        activeProjects.value = response.statistics.activeProjects || 0
        readyToUpload.value = response.statistics.readyToUpload || 0
        totalFiles.value = response.statistics.totalFiles || 0
        completedDesigns.value = response.statistics.completedDesigns || 0
      }
      
      console.log('✅ Statistics loaded:', response.statistics)
      
      return response.statistics
      
    } catch (err) {
      error.value = err.message || 'Failed to load statistics'
      console.error('❌ Error loading statistics:', err)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Get specific advert details
   */
  const getAdvertDetails = async (advertId) => {
    loading.value = true
    error.value = null
    
    try {
      console.log(`🔍 Loading advert details for ID: ${advertId}`)
      
      const response = await $fetch(`${API_BASE}/design-house/adverts/${advertId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to load advert details')
      }
      
      console.log('✅ Advert details loaded')
      
      return response.data
      
    } catch (err) {
      error.value = err.message || 'Failed to load advert details'
      console.error('❌ Error loading advert details:', err)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Get all files for an advert
   */
  const getDesignFiles = async (advertId) => {
    loading.value = true
    error.value = null
    
    try {
      console.log(`📁 Loading files for advert ID: ${advertId}`)
      
      const response = await $fetch(`${API_BASE}/design-house/adverts/${advertId}/files`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to load files')
      }
      
      console.log(`✅ Loaded ${response.files.length} files`)
      
      return {
        files: response.files,
        filesByType: response.filesByType,
        statistics: response.statistics,
        advert: response.advert
      }
      
    } catch (err) {
      error.value = err.message || 'Failed to load files'
      console.error('❌ Error loading files:', err)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Upload design files to an advert
   */
  const uploadDesign = async (advertId, files, description = '') => {
    loading.value = true
    error.value = null
    
    try {
      console.log(`📤 Uploading ${files.length} file(s) for advert #${advertId}`)
      
      // Create FormData for file upload
      const formData = new FormData()
      
      // Add files to FormData
      files.forEach((file, index) => {
        if (file instanceof File) {
          formData.append(`files`, file)
        } else if (file.file instanceof File) {
          formData.append(`files`, file.file)
        }
      })
      
      // Add description if provided
      if (description) {
        formData.append('description', description)
      }
      
      // Get current user email for tracking
      let uploaderEmail = null
      try {
        const vgamsUser = JSON.parse(localStorage.getItem('vgams_user'))
        if (vgamsUser?.email) {
          uploaderEmail = vgamsUser.email
          formData.append('uploaderEmail', uploaderEmail)
        }
      } catch (e) {
        console.warn('⚠️ Could not get user email from localStorage')
      }
      
      const response = await $fetch(`${API_BASE}/design-house/adverts/${advertId}/upload`, {
        method: 'POST',
        body: formData
        // Don't set Content-Type header - browser will set it with boundary for multipart
      })
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to upload files')
      }
      
      console.log(`✅ Uploaded ${response.files.length} file(s) successfully`)
      
      // Reload the advert to get updated file list
      await loadDesigns()
      
      return {
        success: true,
        message: response.message,
        files: response.files
      }
      
    } catch (err) {
      error.value = err.message || 'Failed to upload files'
      console.error('❌ Error uploading files:', err)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Mark design work as complete
   */
  const markDesignComplete = async (advertId, notes = '') => {
    loading.value = true
    error.value = null
    
    try {
      console.log(`✅ Marking design complete for advert #${advertId}`)
      
      // Get current user email
      let designerEmail = null
      try {
        const vgamsUser = JSON.parse(localStorage.getItem('vgams_user'))
        if (vgamsUser?.email) {
          designerEmail = vgamsUser.email
        }
      } catch (e) {
        console.warn('⚠️ Could not get user email from localStorage')
      }
      
      const response = await $fetch(`${API_BASE}/design-house/adverts/${advertId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: {
          notes: notes,
          designerEmail: designerEmail
        }
      })
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to mark design complete')
      }
      
      console.log('✅ Design marked as complete')
      
      // Reload adverts to reflect changes
      await loadDesigns()
      
      return response
      
    } catch (err) {
      error.value = err.message || 'Failed to mark design complete'
      console.error('❌ Error marking design complete:', err)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Download files for an advert
   */
  const downloadFiles = async (advertId) => {
    loading.value = true
    error.value = null
    
    try {
      console.log(`⬇️ Downloading files for advert #${advertId}`)
      
      // Get files list first
      const filesData = await getDesignFiles(advertId)
      
      if (!filesData.files || filesData.files.length === 0) {
        throw new Error('No files available for download')
      }
      
      // Download each file
      filesData.files.forEach(file => {
        if (file.url) {
          // Create temporary link and trigger download
          const link = document.createElement('a')
          link.href = file.url
          link.download = file.name || 'download'
          link.target = '_blank'
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
        }
      })
      
      console.log(`✅ Download initiated for ${filesData.files.length} file(s)`)
      
      return {
        success: true,
        message: `Download initiated for ${filesData.files.length} file(s)`
      }
      
    } catch (err) {
      error.value = err.message || 'Failed to download files'
      console.error('❌ Error downloading files:', err)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Load recent uploads
   */
  const loadRecentUploads = async () => {
    loading.value = true
    error.value = null
    
    try {
      // Derive from loaded adverts
      const advertsWithFiles = adverts.value.filter(a => a.attachments > 0)
      
      const uploads = []
      for (const advert of advertsWithFiles) {
        if (advert.files && advert.files.length > 0) {
          advert.files.forEach(file => {
            uploads.push({
              id: file.id,
              name: file.name,
              type: file.ext?.replace('.', '') || 'file',
              size: file.size,
              uploadedAt: new Date(file.createdAt),
              advertReference: advert.reference,
              advertTitle: advert.advertTitle
            })
          })
        }
      }
      
      // Sort by date (most recent first)
      uploads.sort((a, b) => b.uploadedAt - a.uploadedAt)
      
      // Take last 10
      recentUploads.value = uploads.slice(0, 10)
      
      console.log(`✅ Loaded ${recentUploads.value.length} recent uploads`)
      
    } catch (err) {
      error.value = err.message || 'Failed to load recent uploads'
      console.error('❌ Error loading recent uploads:', err)
    } finally {
      loading.value = false
    }
  }
  
  // Helper functions
  const calculateTotalSize = (files) => {
    if (!files || files.length === 0) return '0 KB'
    
    const totalBytes = files.reduce((sum, file) => sum + (file.size || 0), 0)
    
    if (totalBytes === 0) return '0 KB'
    if (totalBytes < 1024) return `${totalBytes} B`
    if (totalBytes < 1024 * 1024) return `${(totalBytes / 1024).toFixed(1)} KB`
    return `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`
  }
  
  const updateStatistics = (stats) => {
    if (stats.total !== undefined) {
      activeProjects.value = stats.total
    }
    if (stats.urgent !== undefined) {
      readyToUpload.value = stats.urgent
    }
  }
  
  // Computed values
  const advertsGroupedByStatus = computed(() => {
    const grouped = {
      pending: [],
      complete: []
    }
    
    adverts.value.forEach(advert => {
      if (advert.designStatus === 'complete') {
        grouped.complete.push(advert)
      } else {
        grouped.pending.push(advert)
      }
    })
    
    return grouped
  })
  
  const advertsGroupedByPlatform = computed(() => {
    const grouped = {}
    
    adverts.value.forEach(advert => {
      const platform = advert.platform || 'Unknown'
      if (!grouped[platform]) {
        grouped[platform] = []
      }
      grouped[platform].push(advert)
    })
    
    return grouped
  })
  
  return {
    // State
    adverts,
    recentUploads,
    loading,
    error,
    
    // Statistics
    activeProjects,
    readyToUpload,
    totalFiles,
    completedDesigns,
    
    // Computed
    advertsGroupedByStatus,
    advertsGroupedByPlatform,
    
    // Methods
    loadDesigns,
    loadDesignStats,
    getAdvertDetails,
    getDesignFiles,
    uploadDesign,
    markDesignComplete,
    downloadFiles,
    loadRecentUploads
  }
}