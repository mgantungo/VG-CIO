//app/middleware/role.js
export default defineNuxtRouteMiddleware((to, from) => {
  const { userRole } = useAuth()
  const requiredRole = to.meta.role

  if (!requiredRole) return true

  if (userRole.value !== requiredRole) {
    // You might want to show an unauthorized page instead
    return navigateTo('/unauthorized')
  }
})