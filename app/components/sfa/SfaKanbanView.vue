<!-- components/sfa/SfaKanbanView.vue -->
<!-- Horizontally scrollable pipeline board. Drag-drop between columns.
     All data operations go through useSfaOpportunities composable only. -->
<template>
  <div class="kanban-view">

    <!-- Toolbar -->
    <div class="board-toolbar">
      <div class="toolbar-left">
        <span class="toolbar-title">Pipeline Board</span>
        <span class="toolbar-total">{{ totalOpportunities }} opportunities</span>
      </div>
      <div class="toolbar-right">
        <button class="toolbar-btn" :class="{ 'btn--loading': loading }" @click="refresh">
          <span :class="['refresh-icon', { spinning: loading }]">↻</span>
          Refresh
        </button>
        <div v-if="error" class="toolbar-error">{{ error }}</div>
      </div>
    </div>

    <!-- Toast -->
    <Transition name="toast">
      <div v-if="toast.msg" class="toast" :class="`toast--${toast.type}`">
        {{ toast.msg }}
      </div>
    </Transition>

    <!-- Columns -->
    <div class="board-scroll">
      <div class="board-columns">
        <SfaKanbanColumn
          v-for="stage in SFA_STAGES"
          :key="stage.id"
          :stage="stage"
          :opportunities="board[stage.id] || []"
          @drop="onDrop"
          @card-click="openDetail"
          @drag-start="activeDrag = $event"
        />
      </div>
    </div>

    <!-- Opportunity detail drawer -->
    <SfaOpportunityDetailDrawer
      v-if="selectedOpportunity"
      v-model="showDetail"
      :opportunity-id="selectedOpportunity.documentId"
      @converted="onConverted"
      @updated="refresh"
    />

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import SfaKanbanColumn           from './SfaKanbanColumn.vue'
import SfaOpportunityDetailDrawer from './SfaOpportunityDetailDrawer.vue'
import { useSfaOpportunities, SFA_STAGES } from '~/composables/useSfaOpportunities'

const {
  board, loading, error, totalOpportunities,
  fetchBoard, changeStage, moveCardOptimistic,
} = useSfaOpportunities()

// ── Detail drawer ─────────────────────────────────────────────────────────────
const showDetail         = ref(false)
const selectedOpportunity = ref(null)

function openDetail(opp) {
  selectedOpportunity.value = opp
  showDetail.value = true
}

// ── Toast ─────────────────────────────────────────────────────────────────────
const toast = ref({ msg: '', type: 'ok' })
let toastTimer = null

function showToast(msg, type = 'ok') {
  clearTimeout(toastTimer)
  toast.value = { msg, type }
  toastTimer  = setTimeout(() => { toast.value.msg = '' }, 3000)
}

// ── Drag-drop ─────────────────────────────────────────────────────────────────
const activeDrag = ref(null)

async function onDrop({ opportunityId, fromStage, toStage }) {
  // Optimistic move for instant feedback
  moveCardOptimistic(opportunityId, fromStage, toStage)
  try {
    await changeStage(opportunityId, toStage)
    showToast(`✓ Moved to ${SFA_STAGES.find(s => s.id === toStage)?.label}`)
  } catch (e) {
    // Revert on failure
    moveCardOptimistic(opportunityId, toStage, fromStage)
    showToast('✗ Failed to move card', 'err')
  }
}

function onConverted() {
  showDetail.value = false
  showToast('✓ Opportunity converted to order', 'ok')
  refresh()
}

async function refresh() {
  await fetchBoard()
}

onMounted(refresh)
</script>

<style scoped>
.kanban-view {
  display: flex; flex-direction: column;
  height: 100%; overflow: hidden;
  font-family: 'IBM Plex Sans', sans-serif;
}

/* Toolbar */
.board-toolbar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 20px;
  background: #FFFFFF;
  border-bottom: 1px solid #D5DDEF;
  flex-shrink: 0;
}
.toolbar-left  { display: flex; align-items: center; gap: 12px; }
.toolbar-title {
  font-size: 15px; font-weight: 700; color: #003366;
  font-family: 'IBM Plex Sans', sans-serif;
}
.toolbar-total { font-size: 12px; color: #8094B8; }
.toolbar-right { display: flex; align-items: center; gap: 10px; }

.toolbar-btn {
  display: flex; align-items: center; gap: 5px;
  padding: 6px 14px; border-radius: 4px;
  font-size: 12px; font-weight: 600;
  background: #F0F4FA; color: #3B4F70;
  border: 1.5px solid #D5DDEF; cursor: pointer;
  transition: all 0.12s;
}
.toolbar-btn:hover { background: #E8F0FB; color: #0F62FE; border-color: #0F62FE44; }
.btn--loading      { opacity: 0.7; pointer-events: none; }

.refresh-icon      { font-size: 14px; display: inline-block; }
.spinning          { animation: spin 0.8s linear infinite; }
@keyframes spin    { to { transform: rotate(360deg); } }

.toolbar-error { font-size: 11px; color: #C9252D; }

/* Toast */
.toast {
  position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
  z-index: 9000; padding: 8px 20px; border-radius: 6px;
  font-size: 12px; font-weight: 600;
  box-shadow: 0 4px 16px rgba(13,24,48,0.14);
  pointer-events: none;
}
.toast--ok  { background: #EDFAF2; color: #1A8A3C; border: 1px solid #1A8A3C33; }
.toast--err { background: #FFF0F0; color: #C9252D; border: 1px solid #C9252D33; }
.toast--info{ background: #E8F0FB; color: #0066CC; border: 1px solid #0066CC33; }

.toast-enter-active, .toast-leave-active { transition: all 0.2s ease; }
.toast-enter-from, .toast-leave-to       { opacity: 0; transform: translate(-50%, 10px); }

/* Board scroll */
.board-scroll {
  flex: 1; overflow-x: auto; overflow-y: hidden;
  padding: 16px 20px;
}
.board-columns {
  display: flex; gap: 12px;
  height: 100%; min-width: max-content;
}
</style>