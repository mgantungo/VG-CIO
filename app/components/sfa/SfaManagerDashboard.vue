<!-- components/sfa/SfaManagerDashboard.vue -->
<!-- Management dashboard: team pipeline overview, agent ranking, funnel breakdown.
     Only rendered for supervisor / manager / admin roles.
     All data via useSfaDashboard composable. -->
<template>
  <div class="mgr-dashboard">

    <!-- Header + filters -->
    <div class="dash-header">
      <div>
        <div class="dash-title">Management Overview</div>
        <div class="dash-sub">{{ sfaRole === 'supervisor' ? 'Your unit' : 'All units' }}</div>
      </div>
      <div class="dash-filters">
        <input v-model="filters.date_from" type="date" class="filter-input" />
        <span class="filter-sep">→</span>
        <input v-model="filters.date_to"   type="date" class="filter-input" />
        <button class="btn-apply" @click="load">Apply</button>
        <button class="btn-refresh" @click="load">↻</button>
      </div>
    </div>

    <div v-if="loading" class="dash-loading">Loading management stats…</div>

    <template v-else-if="stats">

      <!-- KPI strip -->
      <div class="kpi-strip">
        <div class="kpi-card kpi-card--navy">
          <div class="kpi-val">{{ formatCurrency(stats.total_pipeline_value) }}</div>
          <div class="kpi-label">Total Pipeline</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-val">{{ stats.total_opportunities ?? 0 }}</div>
          <div class="kpi-label">Open Opportunities</div>
        </div>
        <div class="kpi-card kpi-card--green">
          <div class="kpi-val">{{ stats.won_this_month?.count ?? 0 }}</div>
          <div class="kpi-label">Won This Month</div>
          <div class="kpi-sub">{{ formatCurrency(stats.won_this_month?.value) }}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-val">{{ stats.lost_this_month?.count ?? 0 }}</div>
          <div class="kpi-label">Lost This Month</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-val">{{ stats.conversion_rate ?? 0 }}%</div>
          <div class="kpi-label">Conversion Rate</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-val">{{ stats.avg_cycle_days ?? '—' }}</div>
          <div class="kpi-label">Avg. Cycle (days)</div>
        </div>
        <div class="kpi-card kpi-card--blue">
          <div class="kpi-val">{{ formatCurrency(stats.revenue_forecast) }}</div>
          <div class="kpi-label">Revenue Forecast</div>
        </div>
      </div>

      <!-- Two column: funnel + ranking -->
      <div class="two-col">

        <!-- Funnel breakdown -->
        <div class="panel">
          <div class="panel-title">Funnel Breakdown</div>
          <div class="funnel-list">
            <div
              v-for="stage in SFA_STAGES"
              :key="stage.id"
              class="funnel-row"
            >
              <div class="fr-dot" :style="{ background: stage.color }" />
              <div class="fr-label">{{ stage.label }}</div>
              <div class="fr-bar-track">
                <div
                  class="fr-bar-fill"
                  :style="{
                    width: funnelBarWidth(stats.funnel_counts?.[stage.id]),
                    background: stage.color,
                  }"
                />
              </div>
              <div class="fr-count" :style="{ color: stage.color }">
                {{ stats.funnel_counts?.[stage.id] ?? 0 }}
              </div>
            </div>
          </div>
        </div>

        <!-- Agent ranking -->
        <div class="panel">
          <div class="panel-title">Agent Ranking</div>
          <div v-if="!teamRanking.length" class="empty-msg">No data</div>
          <div class="ranking-list">
            <div
              v-for="(agent, idx) in teamRanking"
              :key="agent.agent?.id || idx"
              class="rank-row"
            >
              <div class="rank-num" :class="`rank-num--${idx + 1}`">{{ idx + 1 }}</div>
              <div class="rank-initial">{{ initial(agent.agent?.username) }}</div>
              <div class="rank-info">
                <div class="rank-name">{{ agent.agent?.username || '—' }}</div>
                <div class="rank-unit">{{ agent.agent?.unit?.name || '' }}</div>
              </div>
              <div class="rank-stats">
                <div class="rs-won">{{ agent.won_count }} won</div>
                <div class="rs-val">{{ formatCurrency(agent.pipeline_value) }}</div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- Pending approvals summary -->
      <div v-if="pendingApprovals.length" class="panel mt">
        <div class="panel-title">
          Quotations Pending Approval
          <span class="count-pill">{{ pendingApprovals.length }}</span>
        </div>
        <div class="approval-list">
          <div
            v-for="q in pendingApprovals"
            :key="q.id"
            class="approval-row"
          >
            <div class="ar-info">
              <div class="ar-num">{{ q.quotation_number }}</div>
              <div class="ar-company">{{ q.opportunity?.company?.company_name }}</div>
            </div>
            <div class="ar-amount">UGX {{ Number(q.total_amount || 0).toLocaleString() }}</div>
            <div class="ar-agent">By {{ q.submitted_by?.username }}</div>
          </div>
        </div>
      </div>

    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { SFA_STAGES }          from '~/composables/useSfaOpportunities'
import { useSfaDashboard }     from '~/composables/useSfaDashboard'
import { useSfaQuotations }    from '~/composables/useSfaQuotations'
import { useSfa }              from '~/composables/useSfa'

const { managementStats: stats, teamRanking, loading, fetchManagementStats } = useSfaDashboard()
const { fetchPendingApproval } = useSfaQuotations()
const { sfaRole } = useSfa()

const filters = ref({ date_from: '', date_to: '' })
const pendingApprovals = ref([])

const maxFunnelCount = computed(() => {
  if (!stats.value?.funnel_counts) return 1
  return Math.max(1, ...Object.values(stats.value.funnel_counts))
})

function funnelBarWidth(count) {
  const pct = Math.round(((count || 0) / maxFunnelCount.value) * 100)
  return `${Math.max(pct, 2)}%`
}

function formatCurrency(val) {
  const n = parseFloat(val) || 0
  if (n >= 1_000_000_000) return `UGX ${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000)     return `UGX ${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)         return `UGX ${(n / 1_000).toFixed(0)}K`
  return `UGX ${n.toLocaleString()}`
}

function initial(name = '') { return (name || '?').charAt(0).toUpperCase() }

async function load() {
  const f = {}
  if (filters.value.date_from) f.date_from = filters.value.date_from
  if (filters.value.date_to)   f.date_to   = filters.value.date_to
  await fetchManagementStats(f)
  pendingApprovals.value = await fetchPendingApproval()
}

onMounted(load)
</script>

<style scoped>
.mgr-dashboard { font-family: 'IBM Plex Sans', sans-serif; padding: 20px; }

/* Header */
.dash-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  margin-bottom: 20px; gap: 20px; flex-wrap: wrap;
}
.dash-title { font-size: 18px; font-weight: 700; color: #003366; }
.dash-sub   { font-size: 12px; color: #8094B8; margin-top: 3px; }
.dash-filters { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

.filter-input {
  padding: 6px 10px; border: 1.5px solid #D1D9E0; border-radius: 2px;
  font-size: 12px; color: #0D1830; background: #FFFFFF; font-family: inherit;
}
.filter-sep { font-size: 12px; color: #8094B8; }
.btn-apply, .btn-refresh {
  padding: 6px 14px; border-radius: 4px; font-size: 12px; font-weight: 600;
  border: 1.5px solid #D5DDEF; cursor: pointer; font-family: inherit;
}
.btn-apply   { background: #003366; color: #fff; border-color: #003366; }
.btn-apply:hover { background: #002244; }
.btn-refresh { background: #F0F4FA; color: #3B4F70; }
.btn-refresh:hover { background: #E8F0FB; color: #0F62FE; }

.dash-loading { text-align: center; color: #8094B8; font-size: 13px; padding: 40px; }

/* KPI strip */
.kpi-strip {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 10px; margin-bottom: 20px;
}
.kpi-card {
  background: #FFFFFF; border: 1.5px solid #D5DDEF; border-radius: 6px; padding: 14px 16px;
}
.kpi-card--navy  { background: #003366; border-color: #003366; }
.kpi-card--navy .kpi-val   { color: #FFFFFF; }
.kpi-card--navy .kpi-label { color: #7BA9D5; }
.kpi-card--green { background: #EDFAF2; border-color: #24A14844; }
.kpi-card--green .kpi-val { color: #1A8A3C; }
.kpi-card--blue  { background: #E8F0FB; border-color: #0066CC44; }
.kpi-card--blue .kpi-val { color: #003366; }

.kpi-val   { font-family: 'IBM Plex Mono', monospace; font-size: 20px; font-weight: 700; color: #003366; line-height: 1; }
.kpi-label { font-size: 11px; color: #8094B8; margin-top: 4px; }
.kpi-sub   { font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: #1A8A3C; margin-top: 2px; }

/* Two column layout */
.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px; }
@media (max-width: 900px) { .two-col { grid-template-columns: 1fr; } }

/* Panels */
.panel {
  background: #FFFFFF; border: 1.5px solid #D5DDEF; border-radius: 6px; padding: 16px;
}
.panel.mt { margin-top: 0; }
.panel-title {
  font-size: 10px; font-weight: 700; letter-spacing: 1.2px;
  text-transform: uppercase; color: #8094B8;
  margin-bottom: 14px; font-family: 'IBM Plex Mono', monospace;
  display: flex; align-items: center; gap: 8px;
}
.count-pill {
  background: #C9252D; color: #FFFFFF; border-radius: 10px;
  padding: 1px 6px; font-size: 10px; font-weight: 700;
  font-family: 'IBM Plex Sans', sans-serif;
}
.empty-msg { font-size: 12px; color: #8094B8; text-align: center; padding: 20px 0; }

/* Funnel list */
.funnel-list { display: flex; flex-direction: column; gap: 8px; }
.funnel-row  { display: flex; align-items: center; gap: 8px; }
.fr-dot      { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.fr-label    { font-size: 11px; color: #3B4F70; width: 100px; flex-shrink: 0; }
.fr-bar-track {
  flex: 1; height: 7px; background: #EEF2F8; border-radius: 4px; overflow: hidden;
}
.fr-bar-fill { height: 100%; border-radius: 4px; transition: width 0.5s ease; }
.fr-count    { font-family: 'IBM Plex Mono', monospace; font-size: 11px; font-weight: 700; width: 22px; text-align: right; }

/* Ranking */
.ranking-list { display: flex; flex-direction: column; gap: 6px; }
.rank-row {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 0; border-bottom: 1px solid #EEF2F8;
}
.rank-row:last-child { border-bottom: none; }

.rank-num {
  width: 22px; height: 22px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 700; flex-shrink: 0;
  background: #EEF2F8; color: #8094B8;
}
.rank-num--1 { background: #FFD700; color: #6B5200; }
.rank-num--2 { background: #D0D0D0; color: #3B3B3B; }
.rank-num--3 { background: #CD7F32; color: #FFFFFF; }

.rank-initial {
  width: 30px; height: 30px; border-radius: 50%;
  background: #003366; color: #FFFFFF;
  font-size: 12px; font-weight: 700;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.rank-info { flex: 1; }
.rank-name { font-size: 12px; font-weight: 600; color: #0D1830; }
.rank-unit { font-size: 10px; color: #8094B8; }
.rank-stats { text-align: right; }
.rs-won { font-size: 11px; font-weight: 700; color: #1A8A3C; }
.rs-val { font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: #003366; }

/* Approval list */
.approval-list { display: flex; flex-direction: column; gap: 6px; }
.approval-row {
  display: flex; align-items: center; gap: 12px;
  padding: 8px 10px; border: 1.5px solid #D5DDEF; border-radius: 4px;
  font-size: 12px;
}
.ar-info   { flex: 1; }
.ar-num    { font-family: 'IBM Plex Mono', monospace; font-weight: 700; color: #003366; }
.ar-company { font-size: 11px; color: #8094B8; }
.ar-amount { font-family: 'IBM Plex Mono', monospace; font-weight: 700; color: #003366; white-space: nowrap; }
.ar-agent  { font-size: 11px; color: #3B4F70; white-space: nowrap; }
</style>
