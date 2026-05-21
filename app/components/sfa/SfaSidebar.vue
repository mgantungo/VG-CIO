<!-- components/sfa/SfaSidebar.vue -->
<!-- Left navigation sidebar for the SFA module. Role-aware nav items + stage legend. -->
<template>
  <aside class="sfa-sidebar">

    <!-- Logo / module header -->
    <div class="sidebar-logo">
      <span class="logo-mark">◎</span>
      <span class="logo-text">Sales Force</span>
    </div>

    <!-- Primary nav -->
    <nav class="sidebar-nav">
      <a
        v-for="item in navItems"
        :key="item.id"
        class="nav-item"
        :class="{ 'nav-item--active': activeView === item.id }"
        @click="$emit('navigate', item.id)"
      >
        <span class="nav-icon">{{ item.icon }}</span>
        <span>{{ item.label }}</span>
      </a>
    </nav>

    <!-- New opportunity CTA -->
    <a class="nav-item nav-item--new" @click="$emit('new-opportunity')">
      <span class="nav-icon">＋</span>
      <span>New Opportunity</span>
    </a>

    <!-- Funnel stage legend with counts -->
    <div class="sidebar-legend">
      <div class="legend-title">Pipeline Stages</div>
      <div
        v-for="stage in SFA_STAGES"
        :key="stage.id"
        class="legend-item"
        :class="{ 'legend-item--active': activeView === 'list' && activeStage === stage.id }"
        @click="$emit('filter-stage', stage.id)"
      >
        <span class="legend-dot" :style="{ background: stage.color }" />
        <span class="legend-label">{{ stage.label }}</span>
        <span
          class="legend-count"
          :style="activeView === 'list' && activeStage === stage.id
            ? { color: stage.color, fontWeight: '700' } : {}"
        >{{ counts[stage.id] ?? 0 }}</span>
      </div>
    </div>

    <!-- Footer -->
    <div class="sidebar-footer">
      <div class="sf-agent">
        <span class="agent-dot" />
        <span class="sf-name">{{ agentName || 'Sales Agent' }}</span>
      </div>
      <div class="sf-role">{{ roleLabel(sfaRole) }}</div>
      <div class="sf-date">{{ today }}</div>
    </div>

  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { SFA_STAGES } from '~/composables/useSfaOpportunities'
import { useSfa } from '~/composables/useSfa'

const props = defineProps({
  activeView:  { type: String, default: 'dashboard' },
  activeStage: { type: String, default: '' },
  counts:      { type: Object, default: () => ({}) },
})

defineEmits(['navigate', 'new-opportunity', 'filter-stage'])

const { sfaRole, agentName, isManager, isSupervisor, roleLabel } = useSfa()

// Build nav items based on role
const navItems = computed(() => {
  const base = [
    { id: 'dashboard', label: 'Dashboard',     icon: '◈' },
    { id: 'board',     label: 'Pipeline Board', icon: '⬛' },
    { id: 'list',      label: 'Opportunities',  icon: '📋' },
    { id: 'orders',    label: 'Orders',         icon: '✅' },
    { id: 'analytics', label: 'Analytics',      icon: '📈' },
  ]
  if (isManager.value || isSupervisor.value) {
    base.splice(1, 0, { id: 'approvals', label: 'Approvals', icon: '🔔' })
  }
  return base
})

const today = computed(() =>
  new Date().toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  })
)
</script>

<style scoped>
.sfa-sidebar {
  width: 220px;
  flex-shrink: 0;
  background: #FFFFFF;
  border-right: 1px solid #D5DDEF;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 2px 0 8px rgba(13, 24, 48, 0.04);
  font-family: 'IBM Plex Sans', sans-serif;
}

/* Logo */
.sidebar-logo {
  display: flex; align-items: center; gap: 10px;
  padding: 18px 20px 16px;
  border-bottom: 1px solid #D5DDEF;
}
.logo-mark { font-size: 18px; color: #003366; line-height: 1; }
.logo-text  {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 13px; font-weight: 700;
  color: #003366; letter-spacing: 0.5px;
}

/* Nav */
.sidebar-nav { padding: 10px 0; border-bottom: 1px solid #D5DDEF; }

.nav-item {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 20px;
  font-size: 12px; font-weight: 500;
  color: #3B4F70; cursor: pointer;
  transition: background 0.12s, color 0.12s;
  text-decoration: none; user-select: none;
}
.nav-item:hover { background: #EEF2F8; color: #0D1830; }
.nav-item--active {
  background: #EBF0FF; color: #0F62FE;
  border-left: 3px solid #0F62FE;
  padding-left: 17px; font-weight: 600;
}
.nav-icon { font-size: 13px; }

.nav-item--new {
  color: #0F62FE; font-weight: 600;
  border-top: 1px solid #D5DDEF;
}

/* Stage legend */
.sidebar-legend {
  flex: 1; padding: 14px 20px; overflow-y: auto;
}
.legend-title {
  font-size: 9px; font-weight: 700; letter-spacing: 1.5px;
  text-transform: uppercase; color: #8094B8;
  margin-bottom: 10px; font-family: 'IBM Plex Mono', monospace;
}
.legend-item {
  display: flex; align-items: center; gap: 8px;
  padding: 5px 8px; border-radius: 4px; cursor: pointer;
  transition: background 0.12s; margin: 0 -8px;
}
.legend-item:hover           { background: #EEF2F8; }
.legend-item--active         { background: #EBF0FF; }
.legend-item--active .legend-label { color: #0D1830; font-weight: 600; }
.legend-dot   { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.legend-label { font-size: 11px; color: #3B4F70; flex: 1; }
.legend-count {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 11px; color: #8094B8; min-width: 20px; text-align: right;
}

/* Footer */
.sidebar-footer {
  padding: 12px 16px 14px;
  border-top: 1px solid #D5DDEF;
  background: #F7F9FC;
  display: flex; flex-direction: column; gap: 4px;
}
.sf-agent {
  display: flex; align-items: center; gap: 6px;
}
.agent-dot {
  width: 7px; height: 7px; border-radius: 50%;
  background: #24A148; flex-shrink: 0;
}
.sf-name { font-size: 12px; font-weight: 600; color: #0D1830; }
.sf-role { font-size: 10px; color: #3B4F70; }
.sf-date { font-family: 'IBM Plex Mono', monospace; font-size: 10px; color: #8094B8; margin-top: 2px; }
</style>
