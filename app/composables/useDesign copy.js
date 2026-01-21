import { ref } from 'vue'

export const useDesign = () => {
  const designs = ref([])
  const recentUploads = ref([])
  const loading = ref(false)
  const activeProjects = ref(23)
  const readyToUpload = ref(15)
  const totalFiles = ref(156)
  
  const loadDesigns = async () => {
    loading.value = true
    try {
      // Mock data
      designs.value = [
        {
          id: '1',
          reference: '#ADV-2025-002',
          clientName: 'Coca-Cola',
          advertTitle: 'Prime Time TV Spot',
          platform: 'UBC TV',
          attachments: 3,
          fileSize: '12.5 MB',
          designStatus: 'complete',
          hasBrief: true
        },
        {
          id: '2',
          reference: '#ADV-2025-006',
          clientName: 'Bank of Africa',
          advertTitle: 'Loan Campaign',
          platform: 'New Vision - Full Page',
          attachments: 5,
          fileSize: '8.2 MB',
          designStatus: 'pending',
          hasBrief: true
        },
        {
          id: '3',
          reference: '#ADV-2025-001',
          clientName: 'MTN Uganda',
          advertTitle: 'New Year Campaign',
          platform: 'New Vision - Front Page',
          attachments: 4,
          fileSize: '25.3 MB',
          designStatus: 'complete',
          hasBrief: true
        }
      ]
    } catch (error) {
      console.error('Failed to load designs:', error)
      throw error
    } finally {
      loading.value = false
    }
  }
  
  const loadRecentUploads = async () => {
    loading.value = true
    try {
      // Mock data
      recentUploads.value = [
        {
          id: '1',
          name: 'MTN_Campaign_Final.psd',
          type: 'psd',
          size: 45200000, // 45.2 MB in bytes
          uploadedBy: 'James Designer',
          uploadedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          advertReference: '#ADV-2025-001'
        },
        {
          id: '2',
          name: 'Stanbic_Print_Ad.pdf',
          type: 'pdf',
          size: 8500000, // 8.5 MB
          uploadedBy: 'Sarah Creative',
          uploadedAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
          advertReference: '#ADV-2025-006'
        },
        {
          id: '3',
          name: 'CocaCola_TV_Storyboard.docx',
          type: 'docx',
          size: 3200000, // 3.2 MB
          uploadedBy: 'John Designer',
          uploadedAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
          advertReference: '#ADV-2025-002'
        }
      ]
    } catch (error) {
      console.error('Failed to load recent uploads:', error)
      throw error
    } finally {
      loading.value = false
    }
  }
  
  const uploadDesign = async (advertId, files, description = '') => {
    loading.value = true
    try {
      // Mock upload
      return new Promise((resolve) => {
        setTimeout(() => {
          console.log(`Uploading ${files.length} files for advert ${advertId}`, description)
          resolve()
        }, 2000)
      })
    } catch (error) {
      console.error('Failed to upload design:', error)
      throw error
    } finally {
      loading.value = false
    }
  }
  
  const downloadFiles = async (advertId) => {
    loading.value = true
    try {
      // Mock download
      return new Promise((resolve) => {
        setTimeout(() => {
          console.log(`Downloading files for advert ${advertId}`)
          resolve()
        }, 1000)
      })
    } catch (error) {
      console.error('Failed to download files:', error)
      throw error
    } finally {
      loading.value = false
    }
  }
  
  return {
    designs,
    recentUploads,
    loading,
    activeProjects,
    readyToUpload,
    totalFiles,
    loadDesigns,
    loadRecentUploads,
    uploadDesign,
    downloadFiles
  }
}