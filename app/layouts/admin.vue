<!-- layouts/admin.vue -->
<!--
  Dedicated blank layout for the administrator dashboard.
  The admin page has its own full-screen shell (rail + main area)
  so it must NOT inherit AppHeader or SideMenu from the default layout.
  Using this layout also sidesteps the role middleware timing issue
  by letting the page guard auth client-side in onMounted.
-->
<template>
  <div class="admin-layout">
    <slot />
  </div>
</template>
 
<style scoped>
.admin-layout {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #F0F4F8;
}
</style>