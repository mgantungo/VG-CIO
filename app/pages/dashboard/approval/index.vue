<!--pages/dashboard/approval/index.vue-->
<template>
  <div class="approval-page">
    <div class="page-header">
      <h1>Manager Approvals</h1>
      <p>Review revenue projections and approve advertising campaigns</p>
    </div>

    <div class="stats-grid">
      <StatCard 
        icon="👨‍💼"
        :value="pendingApprovals"
        label="Awaiting Approval"
        color="gold"
      />
      <StatCard 
        icon="💰"
        :value="formatCurrency(pendingRevenue)"
        label="Pending Revenue"
        color="green"
      />
      <StatCard 
        icon="📊"
        :value="`${approvalRate}%`"
        label="Approval Rate"
        color="blue"
      />
    </div>

    <div class="content-card">
      <div class="card-header">
        <h2>Adverts for Final Approval</h2>
      </div>

      <DataTable 
        :headers="tableHeaders"
        :items="approvalAdverts"
        :loading="loading"
      >
        <template #cell(profitMargin)="{ item }">
          <span :style="{ color: item.profitMargin > 50 ? '#28a745' : '#ffc107', fontWeight: 'bold' }">
            {{ item.profitMargin }}%
          </span>
        </template>
        
        <template #cell(status)="{ item }">
          <span class="status-badge status-approved">
            {{ formatStatus(item.status) }}
          </span>
        </template>
        
        <template #cell(actions)="{ item }">
          <div class="action-buttons">
            <button class="btn btn-success btn-sm" @click="approveAdvert(item)">
              Approve
            </button>
            <button class="btn btn-danger btn-sm" @click="rejectAdvert(item)">
              Reject
            </button>
            <button class="btn btn-info btn-sm" @click="viewDetails(item)">
              Details
            </button>
          </div>
        </template>
      </DataTable>
    </div>
  </div>
</template>

<script setup>
import StatCard from '~/components/common/StatCard.vue'
import DataTable from '~/components/common/DataTable.vue'
import { useWorkflow } from '~/composables/useWorkflow'
import { ref, computed, onMounted } from 'vue'

const { 
  approvalAdverts: approvalAdvertsApi,
  pendingApprovals,
  pendingRevenue,
  approvalRate,
  loading,
  loadApprovalAdverts,
  approveAdvert: approveAdvertApi,
  rejectAdvert: rejectAdvertApi 
} = useWorkflow()

const tableHeaders = [
  { key: 'reference', label: 'Ref #' },
  { key: 'clientName', label: 'Client' },
  { key: 'platform', label: 'Platform' },
  { key: 'revenue', label: 'Revenue (UGX)' },
  { key: 'cost', label: 'Cost (UGX)' },
  { key: 'profitMargin', label: 'Profit Margin' },
  { key: 'editor', label: 'Editor' },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: 'Actions' }
]

const approvalAdverts = computed(() => {
  return approvalAdvertsApi.value.map(advert => ({
    ...advert,
    profitMargin: calculateProfitMargin(advert.revenue, advert.cost)
  }))
})

onMounted(() => {
  loadApprovalAdverts()
})

const calculateProfitMargin = (revenue, cost) => {
  if (!revenue || !cost) return 0
  return Math.round(((revenue - cost) / revenue) * 100)
}

const formatCurrency = (amount) => {
  if (!amount) return 'UGX 0'
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX'
  }).format(amount)
}

const formatStatus = (status) => {
  const statusMap = {
    'editor_approved': 'Editor Approved',
    'pending_manager': 'Pending Manager',
    'manager_approved': 'Manager Approved'
  }
  return statusMap[status] || status
}

const approveAdvert = async (advert) => {
  if (confirm(`Approve advert ${advert.reference}?`)) {
    try {
      await approveAdvertApi(advert.id)
      alert('Advert approved successfully!')
      loadApprovalAdverts()
    } catch (error) {
      console.error('Approval failed:', error)
      alert('Failed to approve advert')
    }
  }
}

const rejectAdvert = async (advert) => {
  const reason = prompt('Enter rejection reason:')
  if (reason) {
    try {
      await rejectAdvertApi(advert.id, reason)
      alert('Advert rejected')
      loadApprovalAdverts()
    } catch (error) {
      console.error('Rejection failed:', error)
      alert('Failed to reject advert')
    }
  }
}

const viewDetails = (advert) => {
  navigateTo(`/adverts/${advert.id}`)
}

const navigateTo = useRouter().push
</script>

<style scoped>
.approval-page {
  width: 100%;
}

.page-header {
  background: white;
  padding: 20px 30px;
  border-radius: 10px;
  margin-bottom: 30px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.page-header h1 {
  color: #003366;
  margin-bottom: 10px;
}

.page-header p {
  color: #666;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.content-card {
  background: white;
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 2px solid #F5F5F5;
}

.card-header h2 {
  color: #003366;
}

.status-badge {
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 0.85em;
  font-weight: 600;
}

.status-approved {
  background: #55efc4;
  color: #00b894;
}

.action-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.btn {
  padding: 6px 12px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.9em;
  transition: all 0.3s;
}

.btn-success {
  background: #28a745;
  color: white;
}

.btn-success:hover {
  background: #218838;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover {
  background: #c82333;
}

.btn-info {
  background: #17a2b8;
  color: white;
}

.btn-info:hover {
  background: #138496;
}
</style>