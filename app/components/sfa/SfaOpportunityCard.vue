<!-- components/sfa/SfaOpportunityCard.vue -->
<!-- Compact kanban card representing one opportunity. Draggable, clickable. -->
<template>
  <div
    class="opp-card"
    :class="{ 'opp-card--dragging': dragging }"
    draggable="true"
    @dragstart="onDragStart"
    @dragend="dragging = false"
    @click="$emit('click', opportunity)"
  >
    <!-- Top row: company + stage dot -->
    <div class="opp-card__top">
      <span class="opp-card__company">
        {{ opportunity.existing_client?.company_name || opportunity.company?.company_name || '—' }}
      </span>
      <span class="opp-card__dot" :style="{ background: stageMeta?.color || '#8094B8' }" />
    </div>

    <!-- Title -->
    <div class="opp-card__title">{{ opportunity.title }}</div>

    <!-- Value + close date -->
    <div class="opp-card__meta">
      <span v-if="opportunity.expected_value" class="opp-card__value">
        {{ formatValue(opportunity.expected_value) }}
      </span>
      <span v-if="opportunity.expected_close_date" class="opp-card__date">
        {{ formatDate(opportunity.expected_close_date) }}
      </span>
    </div>

    <!-- Agent (visible to supervisor/manager) -->
    <div v-if="showAgent && opportunity.created_by_agent" class="opp-card__agent">
      <span class="agent-initial">{{ initial(agentDisplayName) }}</span>
      <span class="agent-name">{{ agentDisplayName }}</span>
    </div>

    <!-- Buy-in count -->
    <div class="opp-card__footer">
      <span v-if="opportunity.buy_ins_count > 0" class="opp-card__buyin-pill">
        {{ opportunity.buy_ins_count }} product{{ opportunity.buy_ins_count > 1 ? 's' : '' }}
      </span>
      <span class="opp-card__id">{{ opportunity.documentId || `#${opportunity.id}` }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { STAGE_MAP } from '~/composables/useSfaOpportunities'
import { useSfa } from '~/composables/useSfa'

const props = defineProps({
  opportunity: { type: Object, required: true },
})
defineEmits(['click', 'drag-start'])

const { isSupervisor, isManager } = useSfa()
const showAgent = computed(() => isSupervisor.value || isManager.value)

const dragging   = ref(false)
const stageMeta  = computed(() => STAGE_MAP[props.opportunity.funnel_stage] || null)
const agentDisplayName = computed(() =>
  props.opportunity.created_by_agent?.vgams_sales_person?.name || '—'
)

function onDragStart(e) {
  dragging.value = true
  e.dataTransfer.setData('opportunityId', props.opportunity.documentId)
  e.dataTransfer.setData('fromStage', props.opportunity.funnel_stage)
  e.dataTransfer.effectAllowed = 'move'
}

function formatValue(val) {
  const n = parseFloat(val) || 0
  if (n >= 1_000_000) return `UGX ${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `UGX ${(n / 1_000).toFixed(0)}K`
  return `UGX ${n.toLocaleString()}`
}

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function initial(name = '') {
  return name.charAt(0).toUpperCase()
}

// Needed for v-if in template
import { computed } from 'vue'
</script>

<style scoped>
.opp-card {
  background: #FFFFFF;
  border: 1.5px solid #D5DDEF;
  border-radius: 6px;
  padding: 10px 12px;
  cursor: pointer;
  transition: box-shadow 0.12s, border-color 0.12s, transform 0.1s;
  font-family: 'IBM Plex Sans', sans-serif;
  user-select: none;
}
.opp-card:hover {
  box-shadow: 0 2px 10px rgba(13, 24, 48, 0.1);
  border-color: #0F62FE44;
}
.opp-card--dragging {
  opacity: 0.5;
  transform: scale(0.97);
}

/* Top row */
.opp-card__top {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 4px;
}
.opp-card__company {
  font-size: 10px; font-weight: 600; text-transform: uppercase;
  letter-spacing: 0.5px; color: #8094B8;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 130px;
}
.opp-card__dot {
  width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0;
}

/* Title */
.opp-card__title {
  font-size: 12px; font-weight: 600; color: #0D1830;
  line-height: 1.4; margin-bottom: 6px;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}

/* Meta */
.opp-card__meta {
  display: flex; align-items: center; gap: 8px; margin-bottom: 6px;
}
.opp-card__value {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 11px; font-weight: 600; color: #003366;
}
.opp-card__date {
  font-size: 10px; color: #8094B8;
  border: 1px solid #EEF2F8; border-radius: 3px; padding: 1px 5px;
}

/* Agent */
.opp-card__agent {
  display: flex; align-items: center; gap: 5px; margin-bottom: 5px;
}
.agent-initial {
  width: 18px; height: 18px; border-radius: 50%;
  background: #003366; color: #fff;
  font-size: 9px; font-weight: 700; display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.agent-name { font-size: 10px; color: #3B4F70; }

/* Footer */
.opp-card__footer {
  display: flex; align-items: center; justify-content: space-between;
}
.opp-card__buyin-pill {
  font-size: 9px; font-weight: 600;
  background: #EEF2F8; color: #3B4F70;
  border-radius: 3px; padding: 1px 6px;
}
.opp-card__id {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 9px; color: #8094B8;
}
</style>
