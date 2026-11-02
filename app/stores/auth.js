// stores/auth.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { roleCan, roleLabel } from '~/config/roles'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref(null)
  const userRole = ref(null)
  const displayRole = ref(null)
  const isAuthenticated = ref(false)

  // Actions
  const setUser = (userData) => {
    user.value = {
      id: userData.id,
      name: userData.name,
      email: userData.email
    }
    userRole.value = userData.role
    displayRole.value = userData.displayRole || roleLabel(userData.role)
    isAuthenticated.value = true
  }

  const clearUser = () => {
    user.value = null
    userRole.value = null
    displayRole.value = null
    isAuthenticated.value = false
  }

  // Helper methods for role checking
  const hasRole = (role) => {
    return userRole.value === role
  }

  const hasAnyRole = (roles) => {
    return roles.includes(userRole.value)
  }

  // Check if user has permission for specific actions.
  // Permissions now live with each role in config/roles.js (single source
  // shared with the rail menu); administrator still passes everything.
  const can = (permission) => roleCan(userRole.value, permission)

  // Getters (computed properties)
  const userName = computed(() => {
    return user.value?.name || user.value?.email?.split('@')[0] || 'User'
  })

  const isAdmin = computed(() => {
    return userRole.value === 'administrator'
  })

  const userInitials = computed(() => {
    if (!user.value?.name) return 'U'
    return user.value.name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  })

  const userEmailDomain = computed(() => {
    if (!user.value?.email) return ''
    return user.value.email.split('@')[1] || ''
  })

  // Return everything
  return {
    // State
    user,
    userRole,
    displayRole,
    isAuthenticated,
    
    // Actions
    setUser,
    clearUser,
    hasRole,
    hasAnyRole,
    can,
    
    // Getters
    userName,
    isAdmin,
    userInitials,
    userEmailDomain
  }
})


/*
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const token = ref(null)
  
  const isAuthenticated = computed(() => !!user.value)
  const userRole = computed(() => user.value?.role || null)
  
  const setUser = (userData) => {
    user.value = userData
    // In production, also store token
  }
  
  const clearUser = () => {
    user.value = null
    token.value = null
  }
  
  return {
    user,
    token,
    isAuthenticated,
    userRole,
    setUser,
    clearUser
  }
})
*/