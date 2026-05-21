<!-- pages/dashboard/sfa.vue -->
<template>
  <div class="sfa-page">

    <SfaSidebar
      :active-view="activeView"
      :active-stage="activeStage"
      :counts="boardCounts"
      @navigate="onNavigate"
      @new-opportunity="showNewOpp = true"
      @filter-stage="onFilterStage"
    />

    <main class="sfa-main">

      <div v-if="boardLoading" class="page-state">
        <div class="state-spinner" />
        <span class="state-text">Loading pipeline…</span>
      </div>

      <template v-else>

        <template v-if="activeView === 'dashboard'">
          <SfaManagerDashboard v-if="isManager || isSupervisor" />
          <SfaMyDashboard      v-else />
        </template>

        <SfaKanbanView v-else-if="activeView === 'board'" />

        <SfaOpportunitiesTable
          v-else-if="activeView === 'list'"
          :stage-filter="activeStage"
          @clear-filter="activeStage = ''"
          @new="showNewOpp = true"
        />

        <SfaOrdersTable v-else-if="activeView === 'orders'" />

        <SfaManagerDashboard v-else-if="activeView === 'analytics'" />

      </template>

    </main>

    <SfaNewOpportunityModal
      v-model="showNewOpp"
      @created="onOpportunityCreated"
    />

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

import SfaSidebar             from '~/components/sfa/SfaSidebar.vue'
import SfaKanbanView          from '~/components/sfa/SfaKanbanView.vue'
import SfaMyDashboard         from '~/components/sfa/SfaMyDashboard.vue'
import SfaManagerDashboard    from '~/components/sfa/SfaManagerDashboard.vue'
import SfaNewOpportunityModal from '~/components/sfa/SfaNewOpportunityModal.vue'
import SfaOrdersTable         from '~/components/sfa/SfaOrdersTable.vue'
import SfaOpportunitiesTable  from '~/components/sfa/SfaOpportunitiesTable.vue'

import { useSfaAuth }          from '~/composables/useSfaAuth'
import { useSfa }              from '~/composables/useSfa'
import { useSfaOpportunities } from '~/composables/useSfaOpportunities'

definePageMeta({ layout: 'admin' })

const router = useRouter()
const { isLoggedIn }                                         = useSfaAuth()
const { isManager, isSupervisor }                            = useSfa()
const { counts: boardCounts, loading: boardLoading, fetchBoard } = useSfaOpportunities()

const activeView  = ref('dashboard')
const activeStage = ref('')
const showNewOpp  = ref(false)

onMounted(async () => {
  if (!isLoggedIn.value) {
    router.replace('/sfa-login')
    return
  }
  await fetchBoard()
})

function onNavigate(view)       { activeView.value = view; activeStage.value = '' }
function onFilterStage(stageId) { activeView.value = 'list'; activeStage.value = stageId }
function onOpportunityCreated() { showNewOpp.value = false; activeView.value = 'board'; fetchBoard() }
</script>

<style scoped>
.sfa-page {
  display: flex; height: 100vh; overflow: hidden;
  background: #F0F4F8; font-family: 'IBM Plex Sans', sans-serif;
}
.sfa-main {
  flex: 1; overflow: hidden; display: flex; flex-direction: column; min-width: 0;
}
.page-state {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 14px;
}
.state-spinner {
  width: 32px; height: 32px; border-radius: 50%;
  border: 3px solid #D5DDEF; border-top-color: #003366;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.state-text { font-size: 13px; color: #8094B8; }
</style>