// composables/useAuth.js
import { useAuthStore } from '~/stores/auth'
import { useRuntimeConfig } from '#imports'

export const useAuth = () => {
  const authStore = useAuthStore()
  const config = useRuntimeConfig()
  
  const apiUrl = config.public.apiBase;
  
  const login = async (credentials) => {
    try {
      //console.log('🔄 Attempting login with email:', credentials.email)
      
      // Validate email format before API call
      if (!validateEmail(credentials.email)) {
        throw new Error('Email must end with @newvision.co.ug')
      }
      
      //console.log('📡 Calling API:', `${apiUrl}/vgams-users/login`)
      
      // Call the API endpoint
      const response = await $fetch(`${apiUrl}/vgams-users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: credentials.email.toLowerCase().trim(),
          password: credentials.password
        })
      })
      
      //console.log('✅ API Response:', response)
      
      // Check if response has an error
      if (response.error) {
        throw new Error(response.message || response.error)
      }
      
      if (response.success) {
        // Store user data in auth store
        authStore.setUser({
          id: response.user.id,
          email: response.user.email,
          name: response.user.name,
          role: response.user.role,
          displayRole: response.user.displayRole
        })
        
        // Also store in localStorage for persistence
        if (process.client) {
          localStorage.setItem('vgams_user', JSON.stringify({
            id: response.user.id,
            email: response.user.email,
            name: response.user.name,
            role: response.user.role,
            displayRole: response.user.displayRole,
            timestamp: new Date().getTime()
          }))
        }
        
        return {
          success: true,
          message: 'Login successful',
          user: response.user,
          redirectTo: response.redirectTo || '/dashboard'
        }
      } else {
        throw new Error(response.message || 'Login failed')
      }
      
    } catch (error) {
      //console.error('❌ Login error:', error)
      
      // Handle different types of errors
      let errorMessage = error.message || 'Login failed. Please check your credentials and try again.'
      
      // If it's a fetch error, check for network issues
      if (error.name === 'FetchError') {
        errorMessage = 'Network error. Please check if the API server is running.'
      }
      
      throw new Error(errorMessage)
    }
  }
  
  
  const logout = () => {
    authStore.clearUser()
    if (process.client) {
      localStorage.removeItem('vgams_user')
    }
  }
  
  // Check if user is logged in (for page guards)
  const checkAuth = () => {
    if (process.client) {
      const storedUser = localStorage.getItem('vgams_user')
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser)
          // Check if session is still valid (e.g., less than 24 hours old)
          const sessionAge = new Date().getTime() - (userData.timestamp || 0)
          if (sessionAge < 24 * 60 * 60 * 1000) { // 24 hours
            authStore.setUser(userData)
            return true
          } else {
            logout() // Clear expired session
            return false
          }
        } catch (e) {
          //console.error('Error parsing stored user:', e)
          logout()
          return false
        }
      }
    }
    return authStore.isAuthenticated
  }
  
  // Initialize auth from localStorage on client side
  /*
  const initAuth = () => {
    if (process.client && !authStore.isAuthenticated) {
      const storedUser = localStorage.getItem('vgams_user')
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser)
          const sessionAge = new Date().getTime() - (userData.timestamp || 0)
          if (sessionAge < 24 * 60 * 60 * 1000) { // 24 hours
            authStore.setUser(userData)
            return true
          } else {
            localStorage.removeItem('vgams_user')
          }
        } catch (e) {
          console.error('Error initializing auth:', e)
          localStorage.removeItem('vgams_user')
        }
      }
    }
    return authStore.isAuthenticated
  }
  */
    const initAuth = () => {
      //console.log('🔄 initAuth called')
      
      if (process.client) {
        const storedUser = localStorage.getItem('vgams_user')
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser)
            const sessionAge = new Date().getTime() - (userData.timestamp || 0)
            
            if (sessionAge < 24 * 60 * 60 * 1000) { // 24 hours
              // Update auth store
              authStore.setUser(userData)
              //console.log('✅ Auth initialized from localStorage:', userData.role)
              return {
                success: true,
                user: userData,
                isAuthenticated: true
              }
            } else {
              // Session expired
              localStorage.removeItem('vgams_user')
              authStore.clearUser()
              //console.log('⚠️ Session expired')
              return {
                success: false,
                message: 'Session expired',
                isAuthenticated: false
              }
            }
          } catch (e) {
            //console.error('❌ Error initializing auth:', e)
            localStorage.removeItem('vgams_user')
            authStore.clearUser()
            return {
              success: false,
              message: 'Error parsing user data',
              isAuthenticated: false
            }
          }
        } else {
          //console.log('ℹ️ No user found in localStorage')
          return {
            success: false,
            message: 'No user found',
            isAuthenticated: false
          }
        }
      }
      
      return {
        success: false,
        message: 'Not client side',
        isAuthenticated: authStore.isAuthenticated
      }
    }
  
  // Helper function to validate email
  const validateEmail = (email) => {
    if (!email) return false
    
    // Check if email ends with @newvision.co.ug
    if (!email.toLowerCase().endsWith('@newvision.co.ug')) {
      return false
    }
    
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }
  

  
  // Get current API URL (for debugging/info)
  const getApiUrl = () => {
    return apiUrl
  }
  
  return {
    // State
    user: authStore.user,
    userRole: authStore.userRole,
    displayRole: authStore.displayRole,
    isAuthenticated: authStore.isAuthenticated,
    
    // Getters
    userName: authStore.userName,
    isAdmin: authStore.isAdmin,
    userInitials: authStore.userInitials,
    userEmailDomain: authStore.userEmailDomain,
    
    // Actions
    login,
    logout,
    checkAuth,
    initAuth,
    validateEmail,
    getApiUrl,
    
    // Role-based access control methods
    hasRole: authStore.hasRole,
    hasAnyRole: authStore.hasAnyRole,
    can: authStore.can
  }
}