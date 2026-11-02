<!-- components/common/SideMenu.vue -->
<template>
  <aside class="side-menu">
    <!-- Main Dashboard - Hidden for design-only and finance-only users -->
    <!----
    <div v-if="showMainDashboard" class="menu-section">
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
  -->

    <!-- DESIGN USERS: Show ONLY this section -->
    <div v-if="isDesignOnly" class="menu-section">
      <div class="menu-section-title">Design</div>
      <div 
        class="menu-item"
        :class="{ active: $route.path === '/dashboard/design' }"
        @click="navigateTo('/dashboard/design')"
      >
        <span class="menu-icon">🎨</span>
        <span>Design House</span>
      </div>
    </div>

    <!-- For NON-DESIGN users: Show other menus based on role -->
    <template v-if="!isDesignOnly">
      <!-- Clerk Menu -->
      <div v-if="clerkMenu.length > 0" class="menu-section">
        <div class="menu-section-title">Advert Booking</div>
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

      <!-- Editor Menu -->
      <div v-if="editorMenu.length > 0" class="menu-section">
        <div class="menu-section-title">Copy Desk</div>
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

      <!-- Invoicing Menu (workflow re-order) -->
      <div v-if="invoicingMenu.length > 0" class="menu-section">
        <div class="menu-section-title">Invoicing</div>
        <div
          v-for="item in invoicingMenu"
          :key="item.path"
          class="menu-item"
          :class="{ active: $route.path === item.path }"
          @click="navigateTo(item.path)"
        >
          <span class="menu-icon">{{ item.icon }}</span>
          <span>{{ item.label }}</span>
        </div>
      </div>

      <!-- Reports Menu (workflow re-order) -->
      <div v-if="reportsMenu.length > 0" class="menu-section">
        <div class="menu-section-title">Reports</div>
        <div
          v-for="item in reportsMenu"
          :key="item.path"
          class="menu-item"
          :class="{ active: $route.path === item.path }"
          @click="navigateTo(item.path)"
        >
          <span class="menu-icon">{{ item.icon }}</span>
          <span>{{ item.label }}</span>
        </div>
      </div>

      <!-- Manager Menu -->
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

      <!-- Design Menu (for admins only when not design-only) -->
      <div v-if="designMenuForNonDesign.length > 0" class="menu-section">
        <div class="menu-section-title">Design</div>
        <div 
          v-for="item in designMenuForNonDesign"
          :key="item.path"
          class="menu-item"
          :class="{ active: $route.path === item.path }"
          @click="navigateTo(item.path)"
        >
          <span class="menu-icon">{{ item.icon }}</span>
          <span>{{ item.label }}</span>
        </div>
      </div>

      <!-- Finance Menu -->
      <div v-if="financeMenu.length > 0" class="menu-section">
        <div class="menu-section-title">Finance</div>
        <div 
          v-for="item in financeMenu"
          :key="item.path"
          class="menu-item"
          :class="{ active: $route.path === item.path || $route.path.startsWith(item.path) }"
          @click="navigateTo(item.path)"
        >
          <span class="menu-icon">{{ item.icon }}</span>
          <span>{{ item.label }}</span>
        </div>
      </div>

      <!-- Settings - Only for admins -->
      <div v-if="showSettings" class="menu-section">
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
    </template>
  </aside>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from '#app'

const props = defineProps({
  role: {
    type: String,
    default: 'clerk'
  }
})

const route = useRoute()
const router = useRouter()
const localStorageRole = ref(null)

onMounted(() => {
  // Always check localStorage as backup
  if (process.client) {
    try {
      const storedUser = localStorage.getItem('vgams_user')
      if (storedUser) {
        const userData = JSON.parse(storedUser)
        localStorageRole.value = userData.role
      }
    } catch (error) {
      console.error('SideMenu localStorage error:', error)
    }
  }
})

// Get role from props or localStorage
const effectiveRole = computed(() => {
  const role = localStorageRole.value || props.role || 'clerk'
  
  // If role already matches menu format, return it
  const menuRoles = ['clerk', 'editor', 'manager', 'design', 'finance', 'admin', 'invoicing']
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
    'administrator': 'admin',
    'invoicing_officer': 'invoicing',
    'design_house_manager': 'design'
  }
  
  return roleMapping[role] || 'clerk'
})

// Rest of your computed properties...
const isDesignOnly = computed(() => effectiveRole.value === 'design')
const isFinanceOnly = computed(() => effectiveRole.value === 'finance')
const showMainDashboard = computed(() => !isDesignOnly.value && !isFinanceOnly.value)

const designMenuForNonDesign = computed(() => 
  effectiveRole.value === 'admin' ? [
    { path: '/dashboard/design', icon: '🎨', label: 'Design House' }
  ] : []
)

const clerkMenu = computed(() => 
  effectiveRole.value === 'clerk' || effectiveRole.value === 'admin' ? [
    { path: '/dashboard/booking/new', icon: '📝', label: 'Book New Advert' },
    { path: '/dashboard/booking', icon: '📋', label: 'My Adverts' }
  ] : []
)

const editorMenu = computed(() => 
  effectiveRole.value === 'editor' || effectiveRole.value === 'admin' ? [
    { path: '/dashboard/review', icon: '✓', label: 'Review Queue' },
    { path: '/dashboard/editor', icon: '📰', label: 'Pager & Print Queue' }
  ] : []
)

const invoicingMenu = computed(() =>
  ['invoicing', 'finance', 'admin'].includes(effectiveRole.value) ? [
    { path: '/dashboard/invoicing', icon: '🧾', label: 'Invoicing Queue' },
    { path: '/dashboard/invoicing/register', icon: '📒', label: 'Invoice Register' }
  ] : []
)

const reportsMenu = computed(() =>
  ['clerk', 'editor', 'invoicing', 'finance', 'manager', 'admin'].includes(effectiveRole.value) ? [
    { path: '/dashboard/reports/print-class', icon: '📊', label: 'Display vs Classified' }
  ] : []
)

const managerMenu = computed(() => 
  effectiveRole.value === 'manager' || effectiveRole.value === 'admin' ? [
    { path: '/dashboard/approval', icon: '👨‍💼', label: 'Approvals' },
    { path: '/dashboard/revenue', icon: '💹', label: 'Revenue Analysis' }
  ] : []
)

const financeMenu = computed(() => 
  effectiveRole.value === 'finance' || effectiveRole.value === 'admin' ? [
    { path: '/dashboard/finance', icon: '🏠', label: 'Finance Dashboard' },
    { path: '/dashboard/finance/payments', icon: '💰', label: 'Payment Collection' }
    /*{ path: '/dashboard/finance/reports', icon: '📊', label: 'Billing Reports' }*/
  ] : []
)

const showSettings = computed(() => effectiveRole.value === 'admin')

const navigateTo = (path) => router.push(path)
</script>

<style scoped>
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