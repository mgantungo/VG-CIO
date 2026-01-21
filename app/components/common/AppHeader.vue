<template>
  <header class="app-header">
    <div class="header-left">
      <NuxtLink to="/" class="logo">
        <h1>Vision Group Adverts</h1>
      </NuxtLink>
    </div>
    
    <div class="header-center">
      <nav class="main-nav">
        <NuxtLink to="/" class="nav-link">Dashboard</NuxtLink>
        <NuxtLink to="/adverts" class="nav-link" v-if="isAuthenticated">My Adverts</NuxtLink>
        <NuxtLink to="/booking/new" class="nav-link" v-if="canCreateAdvert">Book Advert</NuxtLink>
        <NuxtLink to="/review" class="nav-link" v-if="canReview">Review Adverts</NuxtLink>
      </nav>
    </div>
    
    <div class="header-right">
      <!-- Always show logout button -->
      <button class="logout-btn" @click="handleLogout">Logout</button>
    </div>
  </header>
</template>

<script setup>
import { useAuth } from '~/composables/useAuth'
import { computed, ref, onMounted } from 'vue'
import { useRouter } from '#app'

const auth = useAuth()
const router = useRouter()
const user = auth?.user || ref(null)
const userRole = auth?.userRole || ref(null)

// Check authentication from localStorage
const checkAuthFromStorage = () => {
  if (typeof window !== 'undefined') {
    const userData = localStorage.getItem('user')
    const token = localStorage.getItem('token')
    return !!(userData || token)
  }
  return false
}

// Reactive authentication state
const isAuthenticated = ref(false)

// Update auth state on mount
onMounted(() => {
  isAuthenticated.value = checkAuthFromStorage()
  
  // Also check from auth composable if available
  if (user?.value) {
    isAuthenticated.value = true
  }
})

// Safely get display name
const displayName = computed(() => {
  if (!user?.value) {
    // Try to get from localStorage
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem('user')
      if (userData) {
        try {
          const parsedUser = JSON.parse(userData)
          return parsedUser.name || parsedUser.email || 'User'
        } catch (e) {
          console.error('Error parsing user data:', e)
        }
      }
    }
    return 'Guest'
  }
  return user.value.name || user.value.email || 'User'
})

// Safely get formatted role
const formattedRole = computed(() => {
  if (userRole?.value) {
    const role = userRole.value
    return role.charAt(0).toUpperCase() + role.slice(1)
  }
  
  // Try to get from localStorage
  if (typeof window !== 'undefined') {
    const userData = localStorage.getItem('user')
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData)
        if (parsedUser.role) {
          const role = parsedUser.role
          return role.charAt(0).toUpperCase() + role.slice(1)
        }
      } catch (e) {
        console.error('Error parsing user data:', e)
      }
    }
  }
  
  return ''
})

// Check permissions
const canCreateAdvert = computed(() => {
  const role = userRole?.value || getRoleFromStorage()
  return ['clerk', 'admin', 'supervisor'].includes(role)
})

const canReview = computed(() => {
  const role = userRole?.value || getRoleFromStorage()
  return ['reviewer', 'admin', 'supervisor'].includes(role)
})

// Helper to get role from localStorage
const getRoleFromStorage = () => {
  if (typeof window !== 'undefined') {
    const userData = localStorage.getItem('user')
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData)
        return parsedUser.role || ''
      } catch (e) {
        console.error('Error parsing user data:', e)
      }
    }
  }
  return ''
}

// Clear all authentication data from cache/storage
const clearAuthData = () => {
  if (typeof window !== 'undefined') {
    // Clear localStorage
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    localStorage.removeItem('auth_token')
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    
    // Clear sessionStorage
    sessionStorage.removeItem('user')
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('auth_token')
    
    // Clear indexedDB or other storage if needed
    // ...
  }
  
  // Clear from auth composable if available
  if (auth?.logout && typeof auth.logout === 'function') {
    auth.logout()
  }
  
  // Clear user and role refs
  if (user?.value) user.value = null
  if (userRole?.value) userRole.value = null
}

// Logout handler - clears cache and redirects to homepage
const handleLogout = async () => {
  try {
    // Clear all authentication data
    clearAuthData()
    
    // Update auth state
    isAuthenticated.value = false
    
    // Force a page reload to clear any Vue state
    await router.push('/')
    
    // Optional: Force a hard reload to ensure clean state
    window.location.href = '/'
    
  } catch (error) {
    console.error('Error during logout:', error)
    
    // Fallback: Clear storage and redirect
    clearAuthData()
    window.location.href = '/'
  }
}
</script>

<style scoped>
.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  height: 70px;
  background: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.header-left .logo {
  text-decoration: none;
  color: #003366;
}

.header-left h1 {
  font-size: 1.5rem;
  margin: 0;
  font-weight: 600;
}

.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
}

.main-nav {
  display: flex;
  gap: 30px;
}

.nav-link {
  text-decoration: none;
  color: #555;
  font-weight: 500;
  padding: 5px 10px;
  border-radius: 5px;
  transition: all 0.3s;
}

.nav-link:hover {
  color: #003366;
  background: #f5f5f5;
}

.nav-link.router-link-active {
  color: #E31E24;
  font-weight: 600;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.user-menu {
  display: flex;
  align-items: center;
  gap: 15px;
}

.user-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.user-name {
  font-weight: 600;
  color: #333;
}

.user-role {
  font-size: 0.85rem;
  color: #666;
  background: #f0f0f0;
  padding: 2px 8px;
  border-radius: 12px;
}

.logout-btn {
  padding: 8px 16px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background 0.3s;
}

.logout-btn:hover {
  background: #c82333;
}

@media (max-width: 768px) {
  .app-header {
    flex-direction: column;
    height: auto;
    padding: 15px;
    gap: 15px;
  }
  
  .header-center {
    order: 3;
    width: 100%;
  }
  
  .main-nav {
    justify-content: center;
    flex-wrap: wrap;
    gap: 15px;
  }
  
  .user-info {
    align-items: center;
  }
}
</style>