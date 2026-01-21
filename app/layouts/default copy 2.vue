<!-- layouts/default.vue -->
<template>
  <div class="default-layout">
    <AppHeader />
    <div class="layout-container">
      <!-- Use resolvedUserRole (consistent with design) -->
      <SideMenu :role="resolvedUserRole" />
      <main class="main-content">
        <Breadcrumb v-if="showBreadcrumb" :items="breadcrumbs" />
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup>
import AppHeader from '~/components/common/AppHeader.vue'
import SideMenu from '~/components/common/SideMenu.vue'
import Breadcrumb from '~/components/common/Breadcrumb.vue'
import { useAuth } from '~/composables/useAuth'
import { computed, onMounted } from 'vue'
import { useRoute } from '#app'

const { initAuth, user, userRole } = useAuth()
const route = useRoute()

// Initialize auth on component mount
onMounted(() => {
  initAuth()
})

// Use the SAME naming as what works for design
const resolvedUserRole = computed(() => {
  // Get role from auth store
  const authRole = userRole.value || user.value?.role
  
  if (process.dev) {
    console.log('📋 Layout - User:', user.value)
    console.log('📋 Layout - UserRole from auth:', userRole.value)
    console.log('📋 Layout - Resolved role:', authRole)
    console.log('📋 Layout - Current route:', route.path)
  }
  
  // Return role or default to 'clerk'
  return authRole || 'clerk'
})

const showBreadcrumb = computed(() => route.meta.showBreadcrumb !== false)
const breadcrumbs = computed(() => route.meta.breadcrumb || [])
</script>

<style scoped>
/* Your existing styles remain the same */
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
</style>