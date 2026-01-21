<!-- layouts/default.vue -->
<template>
  <div class="default-layout">
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
import { useAuth } from '~/composables/useAuth'
import { ref, onMounted } from 'vue'

const { initAuth } = useAuth()
const userRoleProp = ref('clerk')
const isReady = ref(false)

onMounted(() => {
  console.log('🔄 Layout mounting...')
  
  // Get role directly from localStorage first (immediate)
  if (process.client) {
    try {
      const storedUser = localStorage.getItem('vgams_user')
      if (storedUser) {
        const userData = JSON.parse(storedUser)
        userRoleProp.value = userData.role || 'clerk'
        console.log('✅ Got role from localStorage:', userRoleProp.value)
      }
    } catch (error) {
      console.error('Error reading localStorage:', error)
    }
  }
  
  // Then initialize auth (async)
  setTimeout(() => {
    initAuth()
    isReady.value = true
    console.log('✅ Layout ready')
  }, 0)
})
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