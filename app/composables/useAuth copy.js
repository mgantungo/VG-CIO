//composables/useAuth.js
import { useAuthStore } from '~/stores/auth'

export const useAuth = () => {
  const authStore = useAuthStore()
  
  const login = async (credentials) => {
    // Mock login - in production, call your API
    return new Promise((resolve) => {
      setTimeout(() => {
        authStore.setUser({
          id: '1',
          email: credentials.email,
          name: credentials.email.split('@')[0],
          role: credentials.role
        })
        resolve()
      }, 500)
    })
  }
  
  const logout = () => {
    authStore.clearUser()
  }
  
  return {
    user: authStore.user,
    userRole: authStore.userRole,
    isAuthenticated: authStore.isAuthenticated,
    login,
    logout
  }
}