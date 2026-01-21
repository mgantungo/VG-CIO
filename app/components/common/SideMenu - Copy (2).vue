<!-- components/common/SideMenu.vue -->
<script setup>
import { computed } from 'vue'
import { useRoute } from '#app'

const props = defineProps({
  role: {
    type: String,
    default: 'clerk'
  }
})

// Map incoming role to menu-compatible role
const effectiveRole = computed(() => {
  const role = props.role || 'clerk'
  
  // If role already matches menu format, return it
  const menuRoles = ['clerk', 'editor', 'manager', 'design', 'finance', 'admin']
  if (menuRoles.includes(role.toLowerCase())) {
    return role.toLowerCase()
  }
  
  // Map backend roles to menu roles
  const roleMapping = {
    'booking_clerk': 'clerk',
    'sub_editor': 'editor',
    'advertising_manager': 'manager',
    'design_house': 'design',
    'finance_team': 'finance',
    'administrator': 'admin'
  }
  
  return roleMapping[role] || 'clerk'
})

// Debug only in development
if (process.dev) {
  console.log('📋 SideMenu - Received role:', props.role, 'Mapped to:', effectiveRole.value)
}

// Update computed properties to use effectiveRole
const clerkMenu = computed(() => {
  return effectiveRole.value === 'clerk' || effectiveRole.value === 'admin' ? [
    { path: '/dashboard/booking/new', icon: '📝', label: 'Book New Advert' },
    { path: '/dashboard/booking', icon: '📋', label: 'My Adverts' }
  ] : []
})

const editorMenu = computed(() => {
  return effectiveRole.value === 'editor' || effectiveRole.value === 'admin' ? [
    { path: '/dashboard/review', icon: '✓', label: 'Review Queue' }
  ] : []
})

const managerMenu = computed(() => {
  return effectiveRole.value === 'manager' || effectiveRole.value === 'admin' ? [
    { path: '/dashboard/approval', icon: '👨‍💼', label: 'Approvals' },
    { path: '/dashboard/revenue', icon: '💹', label: 'Revenue Analysis' }
  ] : []
})

const designMenu = computed(() => {
  return effectiveRole.value === 'design' || effectiveRole.value === 'admin' ? [
    { path: '/dashboard/design', icon: '🎨', label: 'Design House' }
  ] : []
})

const financeMenu = computed(() => {
  return effectiveRole.value === 'finance' || effectiveRole.value === 'admin' ? [
    { path: '/dashboard/finance/payments', icon: '💰', label: 'Payment Collection' },
    { path: '/dashboard/finance/reports', icon: '📊', label: 'Billing Reports' }
  ] : []
})

const navigateTo = useRouter().push
</script>

<template>
  <!-- Keep template EXACTLY as it is, no changes needed -->
  <aside class="side-menu">
    <div class="menu-section">
      <div class="menu-section-title">Main</div>
      <div 
        class="menu-item"
        :class="{ active: $route.path === '/dashboard' }"
        @click="navigateTo('/dashboard')"
      >
        <span class="menu-icon">🏠</span>
        <span>Dashboard</span>
      </div>
    </div>

    <div v-if="clerkMenu.length > 0" class="menu-section">
      <div class="menu-section-title">Advert Management</div>
      <div 
        v-for="item in clerkMenu"
        :key="item.path"
        class="menu-item"
        :class="{ active: $route.path === item.path }"
        @click="navigateTo(item.path)"
      >
        <span class="menu-icon">{{ item.icon }}</span>
        <span>{{ item.label }}</span>
      </div>
    </div>

    <div v-if="editorMenu.length > 0" class="menu-section">
      <div class="menu-section-title">Editorial</div>
      <div 
        v-for="item in editorMenu"
        :key="item.path"
        class="menu-item"
        :class="{ active: $route.path === item.path }"
        @click="navigateTo(item.path)"
      >
        <span class="menu-icon">{{ item.icon }}</span>
        <span>{{ item.label }}</span>
      </div>
    </div>

    <div v-if="managerMenu.length > 0" class="menu-section">
      <div class="menu-section-title">Management</div>
      <div 
        v-for="item in managerMenu"
        :key="item.path"
        class="menu-item"
        :class="{ active: $route.path === item.path }"
        @click="navigateTo(item.path)"
      >
        <span class="menu-icon">{{ item.icon }}</span>
        <span>{{ item.label }}</span>
      </div>
    </div>

    <div v-if="designMenu.length > 0" class="menu-section">
      <div class="menu-section-title">Design</div>
      <div 
        v-for="item in designMenu"
        :key="item.path"
        class="menu-item"
        :class="{ active: $route.path === item.path }"
        @click="navigateTo(item.path)"
      >
        <span class="menu-icon">{{ item.icon }}</span>
        <span>{{ item.label }}</span>
      </div>
    </div>

    <div v-if="financeMenu.length > 0" class="menu-section">
      <div class="menu-section-title">Finance</div>
      <div 
        v-for="item in financeMenu"
        :key="item.path"
        class="menu-item"
        :class="{ active: $route.path === item.path }"
        @click="navigateTo(item.path)"
      >
        <span class="menu-icon">{{ item.icon }}</span>
        <span>{{ item.label }}</span>
      </div>
    </div>

    <div class="menu-section">
      <div class="menu-section-title">Settings</div>
      <div 
        class="menu-item"
        :class="{ active: $route.path === '/dashboard/' }"
        @click="navigateTo('/dashboard/')"
      >
        <span class="menu-icon">⚙️</span>
        <span>Settings</span>
      </div>
    </div>
    <!--
    <div class="menu-section">
      <div class="menu-section-title">Settings</div>
      <div 
        class="menu-item"
        :class="{ active: $route.path === '/dashboard/settings' }"
        @click="navigateTo('/dashboard/settings')"
      >
        <span class="menu-icon">⚙️</span>
        <span>Settings</span>
      </div>
    </div>
    -->


  </aside>
</template>

<style scoped>
/* Keep all existing styles exactly as they are */
.side-menu {
  width: 250px;
  background: #333333;
  color: white;
  position: fixed;
  left: 0;
  top: 70px;
  bottom: 0;
  overflow-y: auto;
  padding: 20px 0;
  z-index: 900;
}

.menu-section {
  margin-bottom: 30px;
}

.menu-section-title {
  color: #FFB612;
  padding: 10px 20px;
  font-size: 0.85em;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 600;
}

.menu-item {
  padding: 12px 20px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 10px;
  border-left: 3px solid transparent;
}

.menu-item:hover {
  background: rgba(255, 255, 255, 0.1);
  border-left-color: #E31E24;
}

.menu-item.active {
  background: rgba(227, 30, 36, 0.2);
  border-left-color: #E31E24;
}

.menu-icon {
  width: 20px;
  text-align: center;
  font-size: 1.1em;
}

@media (max-width: 768px) {
  .side-menu {
    transform: translateX(-100%);
    transition: transform 0.3s;
  }
  
  .side-menu.mobile-open {
    transform: translateX(0);
  }
}
</style>