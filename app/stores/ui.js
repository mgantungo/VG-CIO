//stores/ui.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUIStore = defineStore('ui', () => {
  const sidebarOpen = ref(true)
  const mobileMenuOpen = ref(false)
  const currentTheme = ref('light')
  const notifications = ref([])
  const loading = ref(false)
  const modals = ref({})
  const toasts = ref([])
  const breadcrumbs = ref([])
  
  // Getters
  const hasUnreadNotifications = computed(() => {
    return notifications.value.some(n => !n.read)
  })
  
  const unreadNotificationCount = computed(() => {
    return notifications.value.filter(n => !n.read).length
  })
  
  const activeModals = computed(() => {
    return Object.keys(modals.value).filter(key => modals.value[key])
  })
  
  const latestToast = computed(() => {
    return toasts.value[toasts.value.length - 1]
  })
  
  // Actions
  const toggleSidebar = () => {
    sidebarOpen.value = !sidebarOpen.value
  }
  
  const toggleMobileMenu = () => {
    mobileMenuOpen.value = !mobileMenuOpen.value
  }
  
  const setSidebarOpen = (isOpen) => {
    sidebarOpen.value = isOpen
  }
  
  const setMobileMenuOpen = (isOpen) => {
    mobileMenuOpen.value = isOpen
  }
  
  const toggleTheme = () => {
    currentTheme.value = currentTheme.value === 'light' ? 'dark' : 'light'
    // In production, you would apply the theme to the document
    document.documentElement.setAttribute('data-theme', currentTheme.value)
  }
  
  const setTheme = (theme) => {
    if (['light', 'dark'].includes(theme)) {
      currentTheme.value = theme
      document.documentElement.setAttribute('data-theme', theme)
    }
  }
  
  const showModal = (modalName) => {
    modals.value[modalName] = true
  }
  
  const hideModal = (modalName) => {
    modals.value[modalName] = false
  }
  
  const toggleModal = (modalName) => {
    modals.value[modalName] = !modals.value[modalName]
  }
  
  const showToast = (toastData) => {
    const toast = {
      id: Date.now().toString(),
      type: toastData.type || 'info',
      message: toastData.message,
      title: toastData.title,
      duration: toastData.duration || 5000,
      createdAt: new Date()
    }
    
    toasts.value.push(toast)
    
    // Auto-remove after duration
    if (toast.duration > 0) {
      setTimeout(() => {
        removeToast(toast.id)
      }, toast.duration)
    }
  }
  
  const removeToast = (toastId) => {
    toasts.value = toasts.value.filter(toast => toast.id !== toastId)
  }
  
  const clearToasts = () => {
    toasts.value = []
  }
  
  const addNotification = (notificationData) => {
    const notification = {
      id: Date.now().toString(),
      type: notificationData.type || 'info',
      title: notificationData.title,
      message: notificationData.message,
      read: false,
      createdAt: new Date(),
      action: notificationData.action,
      actionLabel: notificationData.actionLabel
    }
    
    notifications.value.unshift(notification)
    
    // Limit notifications
    if (notifications.value.length > 50) {
      notifications.value = notifications.value.slice(0, 50)
    }
  }
  
  const markNotificationAsRead = (notificationId) => {
    const notification = notifications.value.find(n => n.id === notificationId)
    if (notification) {
      notification.read = true
    }
  }
  
  const markAllNotificationsAsRead = () => {
    notifications.value.forEach(notification => {
      notification.read = true
    })
  }
  
  const removeNotification = (notificationId) => {
    notifications.value = notifications.value.filter(n => n.id !== notificationId)
  }
  
  const clearNotifications = () => {
    notifications.value = []
  }
  
  const setBreadcrumbs = (items) => {
    breadcrumbs.value = items
  }
  
  const addBreadcrumb = (item) => {
    breadcrumbs.value.push(item)
  }
  
  const clearBreadcrumbs = () => {
    breadcrumbs.value = []
  }
  
  const setLoading = (isLoading) => {
    loading.value = isLoading
  }
  
  const showSuccess = (message, title = 'Success') => {
    showToast({
      type: 'success',
      title,
      message
    })
  }
  
  const showError = (message, title = 'Error') => {
    showToast({
      type: 'error',
      title,
      message
    })
  }
  
  const showWarning = (message, title = 'Warning') => {
    showToast({
      type: 'warning',
      title,
      message
    })
  }
  
  const showInfo = (message, title = 'Info') => {
    showToast({
      type: 'info',
      title,
      message
    })
  }
  
  return {
    // State
    sidebarOpen,
    mobileMenuOpen,
    currentTheme,
    notifications,
    loading,
    modals,
    toasts,
    breadcrumbs,
    
    // Getters
    hasUnreadNotifications,
    unreadNotificationCount,
    activeModals,
    latestToast,
    
    // Actions
    toggleSidebar,
    toggleMobileMenu,
    setSidebarOpen,
    setMobileMenuOpen,
    toggleTheme,
    setTheme,
    showModal,
    hideModal,
    toggleModal,
    showToast,
    removeToast,
    clearToasts,
    addNotification,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    removeNotification,
    clearNotifications,
    setBreadcrumbs,
    addBreadcrumb,
    clearBreadcrumbs,
    setLoading,
    showSuccess,
    showError,
    showWarning,
    showInfo
  }
})