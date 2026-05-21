<!-- components/sfa/SfaKanbanColumn.vue -->
<!-- Single stage column in the pipeline kanban board. Handles drop events. -->
<template>
  <div
    class="kanban-col"
    :class="{ 'kanban-col--drag-over': dragOver }"
    @dragover.prevent="dragOver = true"
    @dragleave="dragOver = false"
    @drop.prevent="onDrop"
  >
    <!-- Column header -->
    <div class="col-header" :style="{ borderTopColor: stage.color }">
      <div class="col-header__left">
        <span class="col-icon">{{ stage.icon }}</span>
        <span class="col-label">{{ stage.label }}</span>
      </div>
      <span class="col-count" :style="{ color: stage.color }">{{ opportunities.length }}</span>
    </div>

    <!-- Cards -->
    <div class="col-body">
      <div v-if="!opportunities.length" class="col-empty">No opportunities</div>

      <SfaOpportunityCard
        v-for="opp in opportunities"
        :key="opp.id"
        :opportunity="opp"
        class="col-card"
        @click="$emit('card-click', opp)"
        @drag-start="$emit('drag-start', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import SfaOpportunityCard from './SfaOpportunityCard.vue'

const props = defineProps({
  stage:         { type: Object, required: true },
  opportunities: { type: Array,  default: () => [] },
})

const emit = defineEmits(['drop', 'card-click', 'drag-start'])

const dragOver = ref(false)

function onDrop(e) {
  dragOver.value = false
  const opportunityId = e.dataTransfer.getData('opportunityId')
  const fromStage     = e.dataTransfer.getData('fromStage')
  if (!opportunityId || fromStage === props.stage.id) return
  emit('drop', { opportunityId, fromStage, toStage: props.stage.id })
}
</script>

<style scoped>
.kanban-col {
  width: 220px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: #F7F9FC;
  border: 1.5px solid #D5DDEF;
  border-radius: 6px;
  overflow: hidden;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.kanban-col--drag-over {
  border-color: #0F62FE;
  box-shadow: 0 0 0 3px #0F62FE22;
}

/* Header */
.col-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 12px 8px;
  background: #FFFFFF;
  border-top: 3px solid transparent;
  border-bottom: 1px solid #D5DDEF;
}
.col-header__left { display: flex; align-items: center; gap: 6px; }
.col-icon  { font-size: 13px; }
.col-label {
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 11px; font-weight: 700;
  color: #0D1830; letter-spacing: 0.2px;
}
.col-count {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 12px; font-weight: 700;
}

/* Body */
.col-body {
  flex: 1; overflow-y: auto;
  padding: 8px;
  display: flex; flex-direction: column; gap: 6px;
}
.col-empty {
  padding: 20px 0; text-align: center;
  font-size: 11px; color: #8094B8; font-style: italic;
  font-family: 'IBM Plex Sans', sans-serif;
}
.col-card {
  /* cards handle their own style */
}
</style>
