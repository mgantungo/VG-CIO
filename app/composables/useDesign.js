// composables/useDesign.js
import { ref, computed } from 'vue'
import { useRuntimeConfig } from '#imports'

export const useDesign = () => {
  const adverts = ref([])
  const loading = ref(false)
  const error = ref(null)
  const config = useRuntimeConfig()
  
  const API_BASE = config.public.apiBase
  const UPLOAD_BASE = config.public.uploadBase || API_BASE // Get upload base from config
  
  // Computed properties
  const recentUploads = computed(() => {
    return adverts.value
      .filter(advert => advert.attachments && advert.attachments.length > 0)
      .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
      .slice(0, 6)
  })
  
  const activeProjects = computed(() => {
    return adverts.value.filter(advert => advert.designStatus === 'pending').length
  })
  
  const readyToUpload = computed(() => {
    return adverts.value.filter(advert => 
      !advert.attachments || advert.attachments.length === 0
    ).length
  })
  
  const completedDesigns = computed(() => {
    return adverts.value.filter(advert => advert.designStatus === 'complete').length
  })
  
  const totalFiles = computed(() => {
    return adverts.value.reduce((total, advert) => 
      total + (advert.attachments?.length || 0), 0)
  })
  
  /**
   * Load active adverts for design work
   */
  const loadDesigns = async (params = {}) => {
    loading.value = true
    error.value = null
    
    try {
      const { startDate, endDate } = params
      
      console.log('🎨 Loading design adverts with params:', { startDate, endDate })
      
      const response = await $fetch(`${API_BASE}/design-house/active-adverts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: {
          startDate,
          endDate
        }
      })
      
      if (response.success) {
        // Transform API response to match component expectations
        adverts.value = (response.data || []).map(advert => {
          // Calculate total file size from attachments (convert KB to bytes if needed)
          const totalFileSizeBytes = advert.attachments?.reduce((sum, file) => {
            let fileSize = file.size || 0
            // If size is in KB (like 841.17 from API), convert to bytes
            if (fileSize < 10000 && fileSize > 0) {
              fileSize = fileSize * 1024 // Convert KB to bytes
            }
            return sum + fileSize
          }, 0) || 0
          
          // Process attachment URLs to include the upload base
          const processedAttachments = advert.attachments?.map(attachment => {
            let fileSize = attachment.size || 0
            // Convert KB to bytes if needed
            if (fileSize < 10000 && fileSize > 0) {
              fileSize = fileSize * 1024
            }
            
            return {
              ...attachment,
              id: attachment.id || attachment.documentId,
              size: fileSize,
              url: attachment.url ? `${UPLOAD_BASE}${attachment.url}` : null,
              fullUrl: attachment.url ? `${UPLOAD_BASE}${attachment.url}` : null,
              mime: attachment.mime || getMimeType(attachment.name)
            }
          }) || []
          
          return {
            id: advert.id,
            documentId: advert.documentId,
            reference: advert.reference_number,
            advertTitle: advert.advert_title,
            clientName: advert.client?.company_name || advert.client?.contact_person || 'Unknown Client',
            platform: advert.product?.category?.category_name || advert.product?.category_name || 'Unknown',
            category: advert.product?.product_name || 'Unknown Product',
            startDate: advert.start_date,
            endDate: advert.end_date,
            attachments: processedAttachments, // Array of processed attachments
            attachmentsCount: processedAttachments.length, // Count for display
            totalFileSize: formatFileSize(totalFileSizeBytes), // Total size of all files
            designStatus: getDesignStatus(advert), // Calculate based on attachments
            hasBrief: !!advert.special_instructions,
            specialInstructions: advert.special_instructions,
            adSize: advert.ad_size,
            adType: advert.ad_type,
            totalAmount: advert.total_amount,
            createdAt: advert.createdAt,
            updatedAt: advert.updatedAt,
            client: advert.client,
            product: advert.product,
            rateCard: advert.rate_card
          }
        })
        
        console.log(`✅ Loaded ${adverts.value.length} design adverts`)
        
        return {
          success: true,
          data: adverts.value,
          count: response.count,
          statistics: response.statistics,
          queryParameters: response.filters_applied
        }
      } else {
        throw new Error(response.message || 'Failed to load design adverts')
      }
      
    } catch (err) {
      error.value = err.message || 'Failed to load design adverts'
      console.error('❌ Error loading design adverts:', err)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Helper: Determine design status based on attachments
   */
  const getDesignStatus = (advert) => {
    // If API returns a designStatus, use it
    if (advert.designStatus) {
      return advert.designStatus
    }
    
    // Otherwise determine based on attachments
    if (advert.attachments && advert.attachments.length > 0) {
      return 'complete'
    }
    
    return 'pending'
  }
  
  /**
   * Helper: Get MIME type from filename
   */
  const getMimeType = (filename) => {
    if (!filename) return 'application/octet-stream'
    
    const ext = filename.split('.').pop().toLowerCase()
    const mimeTypes = {
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'psd': 'image/vnd.adobe.photoshop',
      'ai': 'application/postscript',
      'eps': 'application/postscript',
      'svg': 'image/svg+xml',
      'indd': 'application/x-indesign',
      'mp4': 'video/mp4',
      'mov': 'video/quicktime',
      'avi': 'video/x-msvideo',
      'zip': 'application/zip',
      'rar': 'application/x-rar-compressed'
    }
    
    return mimeTypes[ext] || 'application/octet-stream'
  }
  
  /**
   * Load design statistics (alias for loadDesigns if you want separate endpoint)
   */
  const loadDesignStats = async (params = {}) => {
    // If you have a separate stats endpoint, use it here
    // Otherwise, just call loadDesigns and extract stats
    try {
      const result = await loadDesigns(params)
      return result.statistics || {}
    } catch (err) {
      console.error('❌ Error loading design stats:', err)
      throw err
    }
  }
  
  /**
   * Get specific advert details
   */
  const getAdvertDetails = async (advertId) => {
    loading.value = true
    error.value = null
    
    try {
      console.log(`🔍 Fetching advert details for ID: ${advertId}`)
      
      const response = await $fetch(`${API_BASE}/design-house/adverts/${advertId}`, {
        method: 'GET'
      })
      
      if (response.success) {
        // Process attachments with upload base URL
        const processedAttachments = response.data.attachments?.map(attachment => {
          let fileSize = attachment.size || 0
          // Convert KB to bytes if needed
          if (fileSize < 10000 && fileSize > 0) {
            fileSize = fileSize * 1024
          }
          
          return {
            ...attachment,
            id: attachment.id || attachment.documentId,
            size: fileSize,
            url: attachment.url ? `${UPLOAD_BASE}${attachment.url}` : null,
            fullUrl: attachment.url ? `${UPLOAD_BASE}${attachment.url}` : null,
            mime: attachment.mime || getMimeType(attachment.name)
          }
        }) || []
        
        console.log('✅ Loaded advert details')
        return {
          ...response.data,
          attachments: processedAttachments
        }
      } else {
        throw new Error(response.message || 'Failed to load advert details')
      }
      
    } catch (err) {
      error.value = err.message || 'Failed to load advert details'
      console.error('❌ Error loading advert details:', err)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Upload design files
   */
  const uploadDesignFiles = async (advertId, files, description = '') => {
    loading.value = true
    error.value = null
    
    try {
      console.log(`📤 Uploading ${files.length} file(s) for advert #${advertId}`)
      
      const formData = new FormData()
      
      files.forEach((file) => {
        if (file instanceof File) {
          formData.append('files', file)
        } else if (file.file instanceof File) {
          formData.append('files', file.file)
        }
      })
      
      if (description) {
        formData.append('description', description)
      }
      
      // Get uploader info from localStorage
      const vgamsUser = JSON.parse(localStorage.getItem('vgams_user') || '{}')
      if (vgamsUser.email) {
        formData.append('uploaderEmail', vgamsUser.email)
        formData.append('uploaderName', vgamsUser.name || vgamsUser.email)
      }
      
      const response = await $fetch(`${API_BASE}/design-house/adverts/${advertId}/upload`, {
        method: 'POST',
        body: formData
      })
      
      if (response.success) {
        console.log('✅ Files uploaded successfully')
        
        // Process uploaded files with upload base URL
        const processedFiles = response.files?.map(file => {
          let fileSize = file.size || 0
          // Convert KB to bytes if needed
          if (fileSize < 10000 && fileSize > 0) {
            fileSize = fileSize * 1024
          }
          
          return {
            ...file,
            size: fileSize,
            url: file.url ? `${UPLOAD_BASE}${file.url}` : null,
            fullUrl: file.url ? `${UPLOAD_BASE}${file.url}` : null,
            mime: file.mime || getMimeType(file.name)
          }
        }) || []
        
        // Refresh adverts after upload
        await loadDesigns()
        
        return {
          success: true,
          files: processedFiles,
          count: processedFiles.length,
          errors: response.errors
        }
      } else {
        throw new Error(response.message || 'Failed to upload files')
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
   * Mark design as complete
   */
  const markDesignComplete = async (advertId, notes = '', designerEmail = '') => {
    loading.value = true
    error.value = null
    
    try {
      console.log(`✅ Marking design complete for advert #${advertId}`)
      
      const response = await $fetch(`${API_BASE}/design-house/adverts/${advertId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: {
          notes,
          designerEmail
        }
      })
      
      if (response.success) {
        console.log('✅ Design marked as complete')
        // Refresh adverts after completion
        await loadDesigns()
        return response
      } else {
        throw new Error(response.message || 'Failed to mark design complete')
      }
      
    } catch (err) {
      error.value = err.message || 'Failed to mark design complete'
      console.error('❌ Error marking design complete:', err)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Download design files for an advert (Fixed version)
   */
  const downloadFiles = async (advertId) => {
    try {
      console.log(`📥 Downloading files for advert #${advertId}`)
      
      // Get advert details first
      const advert = adverts.value.find(a => a.id === advertId)
      if (!advert) {
        throw new Error('Advert not found')
      }
      
      // Check if advert has attachments
      if (!advert.attachments || advert.attachments.length === 0) {
        alert(`No files available for ${advert.reference}`)
        return
      }
      
      // Helper function to download a single file
      const downloadSingleFile = (file) => {
        return new Promise((resolve) => {
          try {
            const link = document.createElement('a')
            link.href = file.url
            link.download = file.name || 'download'
            link.target = '_blank'
            link.style.display = 'none'
            
            // Add to document and click
            document.body.appendChild(link)
            link.click()
            
            // Clean up after a delay
            setTimeout(() => {
              if (link.parentNode) {
                document.body.removeChild(link)
              }
              resolve()
            }, 1000)
            
          } catch (error) {
            console.error('Error downloading file:', error)
            resolve() // Continue even if one file fails
          }
        })
      }
      
      if (advert.attachments.length === 1) {
        // Single file - direct download
        await downloadSingleFile(advert.attachments[0])
      } else {
        // Multiple files - sequential download with delays
        for (let i = 0; i < advert.attachments.length; i++) {
          const file = advert.attachments[i]
          console.log(`⬇️ Downloading file ${i + 1}/${advert.attachments.length}: ${file.name}`)
          
          await downloadSingleFile(file)
          
          // Add delay between downloads (except for the last one)
          if (i < advert.attachments.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500))
          }
        }
      }
      
      console.log('✅ Download completed for', advert.attachments.length, 'files')
      
    } catch (err) {
      console.error('❌ Error downloading files:', err)
      throw err
    }
  }
  
  /**
   * Get file download URL with upload base
   */
  const getFileUrl = (filePath) => {
    if (!filePath) return null
    
    // Check if already has full URL
    if (filePath.startsWith('http://') || filePath.startsWith('https://') || filePath.startsWith('data:')) {
      return filePath
    }
    
    // Prepend upload base URL
    return `${UPLOAD_BASE}${filePath.startsWith('/') ? '' : '/'}${filePath}`
  }
  
  /**
   * Helper: Format file size
   */
  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B'
    
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }
  
  /**
   * Helper: Format date to YYYY-MM-DD
   */
  const formatDateForAPI = (date) => {
    if (!date) return null
    
    if (typeof date === 'string') {
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return date
      }
      date = new Date(date)
    }
    
    if (date instanceof Date && !isNaN(date)) {
      return date.toISOString().split('T')[0]
    }
    
    return null
  }
  
  /**
   * Helper: Get today's date in YYYY-MM-DD format
   */
  const getTodayFormatted = () => {
    return new Date().toISOString().split('T')[0]
  }
  
  /**
   * Helper: Get date range
   */
  const getDateRange = (range) => {
    const now = new Date()
    const today = getTodayFormatted()
    
    switch (range) {
      case 'today':
        return { startDate: today, endDate: today }
      
      case 'yesterday':
        const yesterday = new Date(now)
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayFormatted = formatDateForAPI(yesterday)
        return { startDate: yesterdayFormatted, endDate: yesterdayFormatted }
      
      case 'this_week':
        const startOfWeek = new Date(now)
        const day = startOfWeek.getDay()
        const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1)
        startOfWeek.setDate(diff)
        return { 
          startDate: formatDateForAPI(startOfWeek), 
          endDate: today 
        }
      
      case 'last_week':
        const lastWeekEnd = new Date(now)
        lastWeekEnd.setDate(lastWeekEnd.getDate() - lastWeekEnd.getDay())
        const lastWeekStart = new Date(lastWeekEnd)
        lastWeekStart.setDate(lastWeekStart.getDate() - 6)
        return {
          startDate: formatDateForAPI(lastWeekStart),
          endDate: formatDateForAPI(lastWeekEnd)
        }
      
      case 'this_month':
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        return { 
          startDate: formatDateForAPI(startOfMonth), 
          endDate: today 
        }
      
      default:
        return { startDate: today, endDate: today }
    }
  }
  
  return {
    // State
    adverts,
    loading,
    error,
    
    // Computed Properties
    recentUploads,
    activeProjects,
    readyToUpload,
    completedDesigns,
    totalFiles,
    
    // Methods
    loadDesigns,
    loadDesignStats,
    getAdvertDetails,
    uploadDesignFiles,
    markDesignComplete,
    downloadFiles,
    getFileUrl,
    
    // Helpers
    formatDateForAPI,
    getTodayFormatted,
    getDateRange,
    formatFileSize
  }
}