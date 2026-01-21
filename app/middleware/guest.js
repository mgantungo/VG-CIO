export default defineNuxtRouteMiddleware((to, from) => {
  const { isAuthenticated } = useAuth()

  // Only for login page - redirect if already logged in
  if (to.path === '/login' && isAuthenticated.value) {
    return navigateTo('/dashboard')
  }
})