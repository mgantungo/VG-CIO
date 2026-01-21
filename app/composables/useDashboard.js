import { ref } from 'vue'

export const useDashboard = () => {
  const stats = ref([
    { icon: '📝', value: '45', label: 'Active Adverts', color: 'blue' },
    { icon: '⏳', value: '12', label: 'Pending Review', color: 'red' },
    { icon: '💰', value: 'UGX 45M', label: 'Revenue This Month', color: 'green' },
    { icon: '📊', value: '28', label: 'Awaiting Payment', color: 'gold' }
  ])
  
  const recentActivities = ref([
    { 
      id: 1, 
      date: '2 hours ago', 
      title: 'New Advert Booked', 
      description: 'Full page advert for MTN in New Vision (Front Page)' 
    },
    { 
      id: 2, 
      date: '5 hours ago', 
      title: 'Payment Received', 
      description: 'UGX 2.5M from Coca-Cola for TV Spot Package' 
    },
    { 
      id: 3, 
      date: 'Yesterday', 
      title: 'Advert Approved', 
      description: 'Radio campaign for Stanbic Bank approved by management' 
    }
  ])
  
  const pendingReviews = ref(12)
  const pendingApprovals = ref(8)
  
  const loadDashboardData = async () => {
    // In production, fetch from API
    console.log('Loading dashboard data...')
  }
  
  return {
    stats,
    recentActivities,
    pendingReviews,
    pendingApprovals,
    loadDashboardData
  }
}