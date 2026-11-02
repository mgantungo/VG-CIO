<!-- layouts/default.vue -->
<!--
  Two shells behind one flag (runtimeConfig.public.workspaceShell /
  NUXT_PUBLIC_WORKSPACE_SHELL):

    off (default) — the original AppHeader + grey SideMenu, unchanged.
    on            — the workspace shell every role shares: navy RoleRail
                    (same look as the Admin Hub), WorkspaceTopbar and the
                    print PipelineStrip. Menu items come from config/roles.js.

  Every page that uses the default layout switches together, so all roles get
  the same menu at the same time and one env change rolls it back.
-->
<template>
  <div v-if="shellOn" class="ws-layout">
    <template v-if="isReady">
      <RoleRail :role="role" :user="user" />
      <div class="ws-main">
        <WorkspaceTopbar :role="role" />
        <PipelineStrip
          v-if="pipelineForPage"
          :counts="pipelineForPage.counts"
          :current="pipelineForPage.current"
        />
        <main class="ws-content">
          <slot />
        </main>
      </div>
    </template>
  </div>

  <div v-else class="default-layout">
    <AppHeader />
    <div class="layout-container">
      <SideMenu v-if="isReady" :role="userRoleProp" />
      <main class="main-content">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup>
import AppHeader from '~/components/common/AppHeader.vue'
import SideMenu from '~/components/common/SideMenu.vue'
import RoleRail from '~/components/common/RoleRail.vue'
import WorkspaceTopbar from '~/components/common/WorkspaceTopbar.vue'
import PipelineStrip from '~/components/common/PipelineStrip.vue'
import { useAuth } from '~/composables/useAuth'
import { useWorkspace } from '~/composables/useWorkspace'
import { ref, computed, onMounted } from 'vue'
import { useRoute } from '#app'

const { initAuth } = useAuth()
const ws = useWorkspace()
const route = useRoute()

const shellOn = computed(() => ws.flags.workspaceShell)

const userRoleProp = ref('clerk')
const role = ref('booking_clerk')
const user = ref(null)
const isReady = ref(false)

const pipelineForPage = computed(() => {
  const p = ws.pipeline.value
  return p && p.counts && p.path === route.path ? p : null
})

onMounted(() => {
  // Role straight from localStorage first (Pinia hydration timing — see
  // engineering notes: auth checks run client-side in onMounted)
  if (process.client) {
    try {
      const storedUser = localStorage.getItem('vgams_user')
      if (storedUser) {
        const userData = JSON.parse(storedUser)
        userRoleProp.value = userData.role || 'clerk'
        role.value = userData.role || 'booking_clerk'
        user.value = { name: userData.name, email: userData.email }
      }
    } catch (error) {
      console.error('Error reading localStorage:', error)
    }
  }

  setTimeout(() => {
    initAuth()
    isReady.value = true
  }, 0)
})
</script>

<style scoped>
/* ── Original shell (flag off) — unchanged ─────────────────────────────── */
.default-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.layout-container {
  display: flex;
  flex: 1;
}

.main-content {
  flex: 1;
  min-width: 0;          /* critical: lets flex child shrink below content width */
  overflow-x: hidden;    /* contain overflow at layout level; child scroll still works */
  margin-left: 250px;
  margin-top: 70px;
  padding: 30px;
  background: #F5F5F5;
  min-height: calc(100vh - 70px);
}

@media (max-width: 768px) {
  .main-content {
    margin-left: 0;
  }
}

/* ── Workspace shell (flag on) ─────────────────────────────────────────── */
.ws-layout {
  min-height: 100vh;
  background: #F0F4F8;
  font-family: 'IBM Plex Sans', 'Segoe UI', sans-serif;
}

.ws-main {
  margin-left: 204px;
  min-width: 0;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.ws-content {
  flex: 1;
  min-width: 0;
  overflow-x: hidden;
  padding: 20px 24px 32px;
}

@media (max-width: 900px) {
  .ws-main { margin-left: 0; }
  .ws-content { padding: 14px 12px 24px; }
}
</style>
