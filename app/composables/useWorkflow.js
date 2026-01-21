import { ref } from 'vue'

export const useWorkflow = () => {
  const adverts = ref([])
  const approvalAdverts = ref([])
  const loading = ref(false)
  const pendingCount = ref(12)
  const approvedToday = ref(45)
  const needsRevision = ref(3)
  const pendingApprovals = ref(8)
  const pendingRevenue = ref(65000000)
  const approvalRate = ref(92)
  
  const loadAdverts = async () => {
    loading.value = true
    try {
      // Mock data
      adverts.value = [
        {
          id: '1',
          reference: '#ADV-2025-001',
          clientName: 'MTN Uganda',
          advertTitle: 'New Year Campaign',
          platform: 'New Vision - Front Page',
          platformCategory: 'print',
          submittedBy: 'John Doe',
          submittedAt: '2025-01-04 09:30',
          priority: 'high',
          status: 'pending_review',
          amount: 15500000
        },
        {
          id: '2',
          reference: '#ADV-2025-004',
          clientName: 'Airtel Uganda',
          advertTitle: 'Data Bundle Promo',
          platform: 'Bukedde',
          platformCategory: 'print',
          submittedBy: 'Sarah Nambi',
          submittedAt: '2025-01-04 10:15',
          priority: 'normal',
          status: 'pending_review',
          amount: 8200000
        }
      ]
    } catch (error) {
      console.error('Failed to load adverts:', error)
      throw error
    } finally {
      loading.value = false
    }
  }
  
  const loadApprovalAdverts = async () => {
    loading.value = true
    try {
      // Mock data
      approvalAdverts.value = [
        {
          id: '1',
          reference: '#ADV-2025-002',
          clientName: 'Coca-Cola',
          platform: 'UBC TV',
          revenue: 2500000,
          cost: 800000,
          editor: 'Mary Editor',
          status: 'editor_approved'
        },
        {
          id: '2',
          reference: '#ADV-2025-005',
          clientName: 'Safaricom',
          platform: 'Radio Package',
          revenue: 4200000,
          cost: 1500000,
          editor: 'Peter Okello',
          status: 'editor_approved'
        }
      ]
    } catch (error) {
      console.error('Failed to load approval adverts:', error)
      throw error
    } finally {
      loading.value = false
    }
  }
  
  const reviewAdvert = async (advertId, action, comment = '') => {
    loading.value = true
    try {
      // Mock API call
      return new Promise((resolve) => {
        setTimeout(() => {
          console.log(`Review action: ${action} on advert ${advertId}`, comment)
          // Update local state
          const index = adverts.value.findIndex(a => a.id === advertId)
          if (index !== -1) {
            if (action === 'approve') {
              adverts.value[index].status = 'editor_approved'
            } else if (action === 'reject') {
              adverts.value[index].status = 'editor_rejected'
            } else if (action === 'request_changes') {
              adverts.value[index].status = 'draft'
            }
          }
          resolve()
        }, 1000)
      })
    } catch (error) {
      console.error('Failed to review advert:', error)
      throw error
    } finally {
      loading.value = false
    }
  }
  
  const approveAdvert = async (advertId, comment = '') => {
    loading.value = true
    try {
      // Mock API call
      return new Promise((resolve) => {
        setTimeout(() => {
          console.log(`Approve advert ${advertId}`, comment)
          resolve()
        }, 1000)
      })
    } catch (error) {
      console.error('Failed to approve advert:', error)
      throw error
    } finally {
      loading.value = false
    }
  }
  
  const rejectAdvert = async (advertId, reason) => {
    loading.value = true
    try {
      // Mock API call
      return new Promise((resolve) => {
        setTimeout(() => {
          console.log(`Reject advert ${advertId}`, reason)
          resolve()
        }, 1000)
      })
    } catch (error) {
      console.error('Failed to reject advert:', error)
      throw error
    } finally {
      loading.value = false
    }
  }
  
  return {
    adverts,
    approvalAdverts,
    loading,
    pendingCount,
    approvedToday,
    needsRevision,
    pendingApprovals,
    pendingRevenue,
    approvalRate,
    loadAdverts,
    loadApprovalAdverts,
    reviewAdvert,
    approveAdvert,
    rejectAdvert
  }
}