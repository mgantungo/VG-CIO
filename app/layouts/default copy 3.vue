<!-- layouts/default.vue -->
<template>
  <div class="default-layout">
    <AppHeader />
    <div class="layout-container">
      <!-- Always show SideMenu, it will handle role resolution -->
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
  console.log('🔄 Layout - Initializing auth...')
  initAuth()
  
  // Debug log after initialization
  setTimeout(() => {
    console.log('📋 Layout - After initAuth:')
    console.log('  - userRole:', userRole.value)
    console.log('  - user object:', user.value)
    console.log('  - route:', route.path)
    
    // Check localStorage directly
    if (process.client) {
      const storedUser = localStorage.getItem('vgams_user')
      console.log('  - localStorage user:', storedUser ? JSON.parse(storedUser) : 'No user found')
    }
  }, 100)
})

// Resolve user role - SIMPLE VERSION
const resolvedUserRole = computed(() => {
  // First, try to get from auth store
  let role = userRole.value || user.value?.role
  
  // If not available from auth store, check localStorage directly
  if (!role && process.client) {
    try {
      const storedUser = localStorage.getItem('vgams_user')
      if (storedUser) {
        const userData = JSON.parse(storedUser)
        role = userData.role
        console.log('📋 Layout - Got role from localStorage:', role)
      }
    } catch (e) {
      console.error('Error reading localStorage:', e)
    }
  }
  
  // Default fallback
  const finalRole = role || 'clerk'
  
  console.log('📋 Layout - Resolved role:', finalRole)
  return finalRole
})

const showBreadcrumb = computed(() => route.meta.showBreadcrumb !== false)
const breadcrumbs = computed(() => route.meta.breadcrumb || [])
</script>

<style scoped>
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