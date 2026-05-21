<!-- components/sfa/SfaMyDashboard.vue -->
<!-- Agent's personal dashboard: pipeline stats, follow-up alerts, recent activity.
     All data via useSfaDashboard composable. -->
<template>
  <div class="my-dashboard">

    <!-- Welcome -->
    <div class="welcome-bar">
      <div>
        <div class="welcome-name">Good {{ greeting }}, {{ agentName || 'Sales Agent' }}</div>
        <div class="welcome-date">{{ today }}</div>
      </div>
      <button class="btn-refresh" @click="load">↻</button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="dash-loading">Loading your stats…</div>

    <template v-else-if="stats">

      <!-- KPI strip -->
      <div class="kpi-strip">
        <div class="kpi-card kpi-card--blue">
          <div class="kpi-val">{{ formatCurrency(stats.pipeline_value) }}</div>
          <div class="kpi-label">Pipeline Value</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-val">{{ stats.active_count ?? 0 }}</div>
          <div class="kpi-label">Active Opportunities</div>
        </div>
        <div class="kpi-card kpi-card--green">
          <div class="kpi-val">{{ stats.won_this_month?.count ?? 0 }}</div>
          <div class="kpi-label">Won This Month</div>
          <div class="kpi-sub">{{ formatCurrency(stats.won_this_month?.value) }}</div>
        </div>
        <div class="kpi-card" :class="{ 'kpi-card--amber': stats.overdue_follow_ups > 0 }">
          <div class="kpi-val">{{ stats.overdue_follow_ups ?? 0 }}</div>
          <div class="kpi-label">Overdue Follow-ups</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-val">{{ stats.quotations_out ?? 0 }}</div>
          <div class="kpi-label">Quotations Out</div>
        </div>
        <div class="kpi-card" :class="{ 'kpi-card--amber': stats.pending_approval > 0 }">
          <div class="kpi-val">{{ stats.pending_approval ?? 0 }}</div>
          <div class="kpi-label">Pending Approval</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-val">{{ stats.conversion_rate ?? 0 }}%</div>
          <div class="kpi-label">Conversion Rate</div>
        </div>
      </div>

      <!-- Follow-up alert -->
      <div v-if="followUps.length" class="followup-section">
        <div class="section-title">
          📅 Follow-ups Due Today
          <span class="count-pill">{{ followUps.length }}</span>
        </div>
        <div class="followup-list">
          <div v-for="f in followUps" :key="f.id" class="followup-item">
            <div class="fi-company">{{ f.opportunity?.company?.company_name }}</div>
            <div class="fi-title">{{ f.opportunity?.title }}</div>
            <div class="fi-meta">
              <span class="fi-type">{{ f.type }}</span>
              <span class="fi-date" :class="{ 'fi-date--overdue': isOverdue(f.next_followup_date) }">
                {{ formatDate(f.next_followup_date) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Funnel mini-bar -->
      <div class="funnel-section">
        <div class="section-title">Pipeline by Stage</div>
        <div class="funnel-bars">
          <div
            v-for="stage in SFA_STAGES.filter(s => !['approved','closed_lost'].includes(s.id))"
            :key="stage.id"
            class="funnel-bar-row"
          >
            <div class="fb-label">{{ stage.label }}</div>
            <div class="fb-track">
              <div
                class="fb-fill"
                :style="{
                  width: barWidth(stats.funnel_counts?.[stage.id]),
                  background: stage.color,
                }"
              />
            </div>
            <div class="fb-count" :style="{ color: stage.color }">
              {{ stats.funnel_counts?.[stage.id] ?? 0 }}
            </div>
          </div>
        </div>
      </div>

    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { SFA_STAGES }           from '~/composables/useSfaOpportunities'
import { useSfaDashboard }      from '~/composables/useSfaDashboard'
import { useSfaActivities }     from '~/composables/useSfaActivities'
import { useSfa }               from '~/composables/useSfa'

const { myStats: stats, loading, fetchMyStats } = useSfaDashboard()
const { fetchDueFollowUps } = useSfaActivities()
const { agentName } = useSfa()

const followUps = ref([])

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
})

const today = computed(() =>
  new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
)

const maxCount = computed(() => {
  if (!stats.value?.funnel_counts) return 1
  return Math.max(1, ...Object.values(stats.value.funnel_counts))
})

function barWidth(count) {
  const pct = Math.round(((count || 0) / maxCount.value) * 100)
  return `${Math.max(pct, 2)}%`
}

function formatCurrency(val) {
  const n = parseFloat(val) || 0
  if (n >= 1_000_000) return `UGX ${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `UGX ${(n / 1_000).toFixed(0)}K`
  return `UGX ${n.toLocaleString()}`
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function isOverdue(d) {
  if (!d) return false
  return new Date(d) < new Date()
}

async function load() {
  await fetchMyStats()
  followUps.value = await fetchDueFollowUps()
}

onMounted(load)
</script>

<style scoped>
.my-dashboard { font-family: 'IBM Plex Sans', sans-serif; padding: 20px; }

/* Welcome */
.welcome-bar {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 20px;
}
.welcome-name { font-size: 18px; font-weight: 700; color: #003366; }
.welcome-date { font-size: 12px; color: #8094B8; margin-top: 3px; }
.btn-refresh {
  padding: 6px 10px; border-radius: 4px; font-size: 14px;
  background: #F0F4FA; border: 1.5px solid #D5DDEF; color: #3B4F70;
  cursor: pointer; font-family: inherit;
}
.btn-refresh:hover { background: #E8F0FB; color: #0F62FE; }

.dash-loading { text-align: center; color: #8094B8; font-size: 13px; padding: 40px; }

/* KPI strip */
.kpi-strip {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 10px; margin-bottom: 24px;
}
.kpi-card {
  background: #FFFFFF; border: 1.5px solid #D5DDEF; border-radius: 6px;
  padding: 14px 16px;
}
.kpi-card--blue  { border-color: #003366; background: #003366; }
.kpi-card--blue .kpi-val, .kpi-card--blue .kpi-label, .kpi-card--blue .kpi-sub {
  color: #FFFFFF;
}
.kpi-card--blue .kpi-label { color: #7BA9D5; }
.kpi-card--green { border-color: #24A14844; background: #EDFAF2; }
.kpi-card--green .kpi-val { color: #1A8A3C; }
.kpi-card--amber { border-color: #F1C21B44; background: #FFF8E6; }
.kpi-card--amber .kpi-val { color: #B07D10; }

.kpi-val   {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 22px; font-weight: 700; color: #003366; line-height: 1;
}
.kpi-label { font-size: 11px; color: #8094B8; margin-top: 4px; }
.kpi-sub   { font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: #1A8A3C; margin-top: 2px; }

/* Section title */
.section-title {
  font-size: 10px; font-weight: 700; letter-spacing: 1.2px;
  text-transform: uppercase; color: #8094B8;
  margin-bottom: 12px; font-family: 'IBM Plex Mono', monospace;
  display: flex; align-items: center; gap: 8px;
}
.count-pill {
  background: #C9252D; color: #FFFFFF; border-radius: 10px;
  padding: 1px 6px; font-size: 10px; font-weight: 700;
  font-family: 'IBM Plex Sans', sans-serif;
}

/* Follow-up list */
.followup-section { margin-bottom: 24px; }
.followup-list    { display: flex; flex-direction: column; gap: 6px; }
.followup-item {
  background: #FFFFFF; border: 1.5px solid #D5DDEF; border-radius: 4px;
  padding: 10px 12px;
}
.fi-company { font-size: 10px; font-weight: 600; text-transform: uppercase; color: #8094B8; letter-spacing: 0.5px; }
.fi-title   { font-size: 12px; font-weight: 600; color: #0D1830; margin: 2px 0 4px; }
.fi-meta    { display: flex; gap: 10px; font-size: 11px; }
.fi-type    { color: #3B4F70; background: #EEF2F8; border-radius: 3px; padding: 1px 6px; }
.fi-date    { color: #8094B8; }
.fi-date--overdue { color: #C9252D; font-weight: 600; }

/* Funnel bars */
.funnel-section { margin-bottom: 20px; }
.funnel-bars    { display: flex; flex-direction: column; gap: 8px; }
.funnel-bar-row { display: flex; align-items: center; gap: 10px; }
.fb-label  { font-size: 11px; color: #3B4F70; width: 110px; flex-shrink: 0; text-align: right; }
.fb-track  {
  flex: 1; height: 8px; background: #EEF2F8; border-radius: 4px; overflow: hidden;
}
.fb-fill   { height: 100%; border-radius: 4px; transition: width 0.4s ease; }
.fb-count  {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 11px; font-weight: 700; width: 24px; text-align: right;
}
</style>
