<!-- layouts/admin.vue -->
<!--
  Dedicated layout for the Administrator Hub.

  Renders ONLY the page content — no AppHeader, no SideMenu, no padding.
  The admin page (pages/dashboard/admin.vue) has its own full-screen shell
  (rail + topbar + content area) so it must not inherit the default layout's
  margin-left:250px / margin-top:70px / padding:30px from .main-content.

  Usage in pages/dashboard/admin.vue:
    definePageMeta({ layout: 'admin', middleware: ['auth'] })
-->
<template>
  <div class="admin-layout">
    <slot />
  </div>
</template>

<style>
/* Global reset scoped to this layout —
   ensure nothing from the app's base styles
   adds unwanted margin or overflow to the admin shell */
html, body {
  margin: 0;
  padding: 0;
  overflow: hidden;
}

.admin-layout {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #F0F4F8;
}
</style>