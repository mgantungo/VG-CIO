//app/middleware/auth.js
/*
export default defineNuxtRouteMiddleware((to, from) => {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated.value) {
    return navigateTo('/login')
  }
})

*/
export default defineNuxtRouteMiddleware((to, from) => {
  const { isAuthenticated } = useAuth()
  const publicPages = ['/login', '/', '/reset-password']

  // Redirect authenticated users away from login page
  if (to.path === '/login' && isAuthenticated.value) {
    return navigateTo('/dashboard')
  }

  // Protect non-public pages
  if (!publicPages.includes(to.path) && !isAuthenticated.value) {
    return navigateTo('/login')
  }
})