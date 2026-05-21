<!-- components/sfa/SfaOpportunitiesTable.vue -->
<template>
  <div class="opp-table-view">

    <!-- Toolbar -->
    <div class="toolbar">
      <div class="toolbar-left">
        <span class="toolbar-title">Opportunities</span>
        <SfaStatusBadge
          v-if="stageFilter"
          :label="STAGE_MAP[stageFilter]?.label"
          :color="STAGE_MAP[stageFilter]?.color"
          :bg="STAGE_MAP[stageFilter]?.color + '15'"
        />
        <button v-if="stageFilter" class="btn-clear-filter" @click="$emit('clear-filter')">✕ Clear</button>
        <span class="toolbar-count">{{ filtered.length }} opportunities</span>
      </div>
      <div class="toolbar-right">
        <div class="search-wrap">
          <span class="si">🔍</span>
          <input v-model="search" class="search-input" placeholder="Search title, company, agent…" />
        </div>
        <!-- Agent filter — supervisor and manager only -->
        <select v-if="canSeeAll || isSupervisor" v-model="agentFilter" class="filter-select">
          <option value="">All agents</option>
          <option v-for="a in uniqueAgents" :key="a.id" :value="a.id">{{ a.name }}</option>
        </select>
        <select v-model="statusFilter" class="filter-select">
          <option value="">All stages</option>
          <option v-for="s in SFA_STAGES" :key="s.id" :value="s.id">{{ s.label }}</option>
        </select>
        <button class="btn-new" @click="$emit('new')">＋ New</button>
      </div>
    </div>

    <div v-if="loading" class="state-msg">Loading…</div>
    <div v-else-if="!filtered.length" class="state-msg">No opportunities found.</div>

    <div v-else class="table-wrap">
      <table class="opps-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Company / Client</th>
            <th>Stage</th>
            <th>Value (UGX)</th>
            <th>Close Date</th>
            <th>Sales Agent</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="opp in filtered"
            :key="opp.id"
            class="opp-row"
            @click="openDetail(opp)"
          >
            <td class="td-title">{{ opp.title }}</td>
            <td>
              <div class="td-company">{{ clientName(opp) }}</div>
              <div v-if="opp.existing_client" class="td-return-tag">↩ Return client</div>
            </td>
            <td>
              <SfaStatusBadge :status="opp.funnel_stage" :map="STAGE_BADGE_MAP" small />
            </td>
            <td class="td-mono">
              {{ opp.expected_value ? Number(opp.expected_value).toLocaleString() : '—' }}
            </td>
            <td class="td-date td-mono">{{ formatDate(opp.expected_close_date) }}</td>
            <td>
              <div class="agent-cell">
                <div class="agent-avatar">{{ agentInitial(opp) }}</div>
                <div>
                  <div class="agent-name">{{ agentName(opp) }}</div>
                  <div v-if="opp.created_by_agent?.unit?.name" class="agent-unit">
                    {{ opp.created_by_agent.unit.name }}
                  </div>
                </div>
              </div>
            </td>
            <td>
              <span v-if="opp.is_converted" class="conv-tag">Converted</span>
              <span v-else class="open-tag">Open</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <SfaOpportunityDetailDrawer
      v-if="selectedOpp"
      v-model="showDetail"
      :opportunity-id="selectedOpp.documentId"
      @converted="load"
      @updated="load"
    />

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import SfaStatusBadge             from './SfaStatusBadge.vue'
import SfaOpportunityDetailDrawer from './SfaOpportunityDetailDrawer.vue'
import { useSfaOpportunities, SFA_STAGES, STAGE_MAP } from '~/composables/useSfaOpportunities'
import { useSfa } from '~/composables/useSfa'

const props = defineProps({ stageFilter: { type: String, default: '' } })
defineEmits(['clear-filter', 'new'])

const { opportunitiesList: opps, loading, fetchOpportunitiesList } = useSfaOpportunities()
const { canSeeAll, isSupervisor } = useSfa()

const search       = ref('')
const statusFilter = ref(props.stageFilter || '')
const agentFilter  = ref('')
const showDetail   = ref(false)
const selectedOpp  = ref(null)

const STAGE_BADGE_MAP = Object.fromEntries(
  SFA_STAGES.map(s => [s.id, { label: s.label, color: s.color, bg: s.color + '15' }])
)

// Agent name comes from sfa-agent-profile → vgams_sales_person → name
function agentName(opp) {
  return opp.created_by_agent?.vgams_sales_person?.name || '—'
}
function agentInitial(opp) {
  const n = agentName(opp)
  return n !== '—' ? n.charAt(0).toUpperCase() : '?'
}

// Company name: prefer existing_client (return order) then prospect company
function clientName(opp) {
  return opp.existing_client?.company_name || opp.company?.company_name || '—'
}

// Build unique agent list for the filter dropdown
const uniqueAgents = computed(() => {
  const map = {}
  for (const opp of opps.value || []) {
    const a = opp.created_by_agent
    if (!a) continue
    const id   = a.documentId
    const name = a.vgams_sales_person?.name || id
    if (!map[id]) map[id] = { id, name }
  }
  return Object.values(map).sort((a, b) => a.name.localeCompare(b.name))
})

const filtered = computed(() => {
  let list = opps.value || []
  const stage = statusFilter.value || props.stageFilter
  if (stage)           list = list.filter(o => o.funnel_stage === stage)
  if (agentFilter.value) list = list.filter(o => o.created_by_agent?.documentId === agentFilter.value)
  if (search.value) {
    const q = search.value.toLowerCase()
    list = list.filter(o =>
      (o.title || '').toLowerCase().includes(q) ||
      (clientName(o)).toLowerCase().includes(q) ||
      (agentName(o)).toLowerCase().includes(q)
    )
  }
  return list
})

function openDetail(opp) { selectedOpp.value = opp; showDetail.value = true }
function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
async function load() { await fetchOpportunitiesList() }

watch(() => props.stageFilter, v => { statusFilter.value = v })
onMounted(load)
</script>

<style scoped>
.opp-table-view { display: flex; flex-direction: column; height: 100%; font-family: 'IBM Plex Sans', sans-serif; }
.toolbar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 20px; border-bottom: 1px solid #D5DDEF;
  background: #FFFFFF; flex-shrink: 0; gap: 10px; flex-wrap: wrap;
}
.toolbar-left  { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.toolbar-title { font-size: 15px; font-weight: 700; color: #003366; }
.toolbar-count { font-size: 12px; color: #8094B8; }
.toolbar-right { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.btn-clear-filter { background: none; border: none; color: #8094B8; cursor: pointer; font-size: 11px; }
.search-wrap {
  display: flex; align-items: center; gap: 6px;
  border: 1.5px solid #D1D9E0; border-radius: 2px; padding: 5px 10px; background: #F7F9FC;
}
.si { font-size: 12px; color: #8094B8; }
.search-input { border: none; background: transparent; outline: none; font-size: 12px; color: #0D1830; width: 180px; font-family: inherit; }
.filter-select { padding: 6px 10px; border: 1.5px solid #D1D9E0; border-radius: 2px; font-size: 12px; color: #0D1830; background: #F7F9FC; cursor: pointer; font-family: inherit; }
.btn-new { padding: 6px 14px; border-radius: 4px; font-size: 12px; font-weight: 600; background: #003366; color: #fff; border: none; cursor: pointer; font-family: inherit; }
.btn-new:hover { background: #002244; }
.state-msg { padding: 40px; text-align: center; color: #8094B8; font-size: 13px; }

.table-wrap { flex: 1; overflow: auto; }
.opps-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.opps-table thead tr { background: #F7F9FC; border-bottom: 1.5px solid #D5DDEF; position: sticky; top: 0; z-index: 1; }
.opps-table th { padding: 9px 14px; text-align: left; font-size: 10px; font-weight: 700; letter-spacing: 0.8px; text-transform: uppercase; color: #8094B8; white-space: nowrap; }
.opp-row { border-bottom: 1px solid #EEF2F8; cursor: pointer; transition: background 0.1s; }
.opp-row:hover { background: #F7F9FC; }
.opps-table td { padding: 10px 14px; vertical-align: middle; }

.td-title     { font-weight: 600; color: #0D1830; max-width: 200px; }
.td-company   { font-weight: 500; color: #0D1830; }
.td-return-tag { font-size: 9px; color: #8094B8; margin-top: 2px; }
.td-mono      { font-family: 'IBM Plex Mono', monospace; }
.td-date      { font-size: 11px; color: #8094B8; }

.agent-cell   { display: flex; align-items: center; gap: 8px; }
.agent-avatar {
  width: 28px; height: 28px; border-radius: 50%;
  background: #003366; color: #fff;
  font-size: 11px; font-weight: 700; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
}
.agent-name { font-size: 12px; font-weight: 600; color: #0D1830; }
.agent-unit { font-size: 10px; color: #8094B8; margin-top: 1px; }

.conv-tag { font-size: 10px; font-weight: 700; background: #EDFAF2; color: #1A8A3C; border-radius: 3px; padding: 2px 7px; }
.open-tag { font-size: 10px; font-weight: 600; background: #EBF0FF; color: #0066CC; border-radius: 3px; padding: 2px 7px; }
</style>
