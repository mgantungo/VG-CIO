<!-- components/sfa/SfaActivityTimeline.vue -->
<template>
  <div class="activity-timeline">

    <div class="at-header">
      <span class="at-title">Activity Log</span>
      <button class="btn-log" @click="showLogModal = true">＋ Log Activity</button>
    </div>

    <!-- Stage badge showing current position -->
    <div v-if="currentStage" class="at-stage-bar">
      <span class="at-stage-label">Current stage:</span>
      <span class="at-stage-pill"
        :style="{ color: currentStage.color, background: currentStage.color + '15', borderColor: currentStage.color + '44' }">
        {{ currentStage.icon }} {{ currentStage.label }}
      </span>
      <span v-if="nextStage" class="at-stage-hint">
        → Log an activity to be prompted to advance to
        <strong>{{ nextStage.label }}</strong>
      </span>
    </div>

    <div v-if="loading" class="at-loading">Loading…</div>

    <div v-else-if="!activities.length" class="at-empty">
      No activities logged yet. Start by logging a call or meeting.
    </div>

    <div v-else class="at-list">
      <div v-for="act in activities" :key="act.id" class="at-item">
        <div class="at-icon"
          :style="{ background: typeMeta(act.type).color + '20', color: typeMeta(act.type).color }">
          {{ typeMeta(act.type).icon }}
        </div>
        <div class="at-content">
          <div class="at-top">
            <span class="at-type">{{ typeMeta(act.type).label }}</span>
            <span class="at-date">{{ formatDate(act.activity_date) }}</span>
          </div>
          <div class="at-summary">{{ act.summary }}</div>
          <div v-if="act.outcome" class="at-outcome">
            <span class="at-outcome-label">Outcome:</span> {{ act.outcome }}
          </div>
          <div v-if="act.next_followup_date" class="at-followup">
            📅 Follow-up: {{ formatDate(act.next_followup_date) }}
          </div>
          <div class="at-by">
            By {{ act.logged_by?.vgams_sales_person?.name || act.logged_by?.name || 'Unknown' }}
          </div>
        </div>
      </div>
    </div>

    <!-- Log modal — passes the current funnel stage so it can prompt correctly -->
    <SfaActivityLogModal
      v-model="showLogModal"
      :opportunity-id="opportunityId"
      :current-funnel-stage="currentFunnelStage"
      @logged="onLogged"
      @stage-advanced="onStageAdvanced"
    />

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import SfaActivityLogModal from './SfaActivityLogModal.vue'
import { useSfaActivities, ACTIVITY_TYPE_MAP } from '~/composables/useSfaActivities'
import { STAGE_MAP } from '~/composables/useSfaOpportunities'

const props = defineProps({
  opportunityId:    { type: [Number, String], required: true },
  currentFunnelStage: { type: String, default: 'opportunity_created' },
})

const emit = defineEmits(['stage-advanced'])

const { activities, loading, fetchActivities } = useSfaActivities()
const showLogModal = ref(false)

const currentStage = computed(() => STAGE_MAP[props.currentFunnelStage] || null)
const nextStage    = computed(() => {
  const next = currentStage.value?.next
  return next ? STAGE_MAP[next] : null
})

function typeMeta(type) {
  return ACTIVITY_TYPE_MAP[type] || { label: type, icon: '📌', color: '#8094B8' }
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

async function onLogged() {
  showLogModal.value = false
  await fetchActivities(props.opportunityId)
}

function onStageAdvanced(newStage) {
  emit('stage-advanced', newStage)
}

onMounted(() => fetchActivities(props.opportunityId))
</script>

<style scoped>
.activity-timeline { font-family: 'IBM Plex Sans', sans-serif; }

.at-header {
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;
}
.at-title { font-size: 12px; font-weight: 700; color: #003366; }
.btn-log {
  padding: 5px 12px; border-radius: 4px; font-size: 11px; font-weight: 600;
  background: #0F62FE; color: #fff; border: none; cursor: pointer; font-family: inherit;
}
.btn-log:hover { background: #0353E9; }

/* Stage bar */
.at-stage-bar {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  background: #F7F9FC; border: 1px solid #D5DDEF; border-radius: 6px;
  padding: 8px 12px; margin-bottom: 14px; font-size: 11px;
}
.at-stage-label { color: #8094B8; font-weight: 600; white-space: nowrap; }
.at-stage-pill {
  display: inline-flex; align-items: center; gap: 4px;
  border: 1.5px solid; border-radius: 20px; padding: 2px 10px;
  font-size: 11px; font-weight: 700; white-space: nowrap;
}
.at-stage-hint { font-size: 10px; color: #8094B8; flex: 1; }

.at-loading, .at-empty { font-size: 12px; color: #8094B8; text-align: center; padding: 20px 0; }
.at-list { display: flex; flex-direction: column; }
.at-item { display: flex; gap: 12px; padding: 12px 0; border-bottom: 1px solid #EEF2F8; }
.at-item:last-child { border-bottom: none; }
.at-icon {
  width: 32px; height: 32px; border-radius: 50%; font-size: 14px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
}
.at-content { flex: 1; min-width: 0; }
.at-top { display: flex; align-items: center; gap: 10px; margin-bottom: 4px; }
.at-type { font-size: 11px; font-weight: 700; color: #0D1830; }
.at-date { font-size: 10px; color: #8094B8; font-family: 'IBM Plex Mono', monospace; }
.at-summary { font-size: 12px; color: #3B4F70; line-height: 1.5; margin-bottom: 4px; }
.at-outcome { font-size: 11px; color: #0D1830; }
.at-outcome-label { font-weight: 600; color: #8094B8; }
.at-followup { font-size: 11px; color: #B07D10; margin-top: 4px; }
.at-by { font-size: 10px; color: #8094B8; margin-top: 4px; }
</style>
