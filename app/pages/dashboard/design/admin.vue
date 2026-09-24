<!-- pages/dashboard/design/admin.vue
  Design House Dashboard — supervision view showing what each designer
  has handled, per day. The actual dashboard lives in the reusable
  component (DesignerHandledDashboard.vue) so it can be embedded
  elsewhere later if needed; this is just the route.
-->
<template>
  <DesignerHandledDashboard />
</template>

<script setup>
import DesignerHandledDashboard from '~/components/design/DesignerHandledDashboard.vue'

definePageMeta({
  // Explicit, not left to convention — this now lives under pages/dashboard/,
  // the same parent folder as pages/dashboard/admin.vue, which is what
  // layouts/admin.vue is reserved for (full-screen shell, no AppHeader/
  // SideMenu, overflow:hidden on html/body). This page needs the normal
  // chrome, so the layout is pinned explicitly rather than left to any
  // filename/folder convention that might otherwise resolve to 'admin'.
  layout: 'default',
  middleware: ['auth', 'role'],
  // Supervision role — sees what every designer has handled, not a
  // designer's own working view (that's Design Desk, gated separately).
  role: 'design_house_manager',
})
</script>