<!-- pages/dashboard/copy-desk/index.vue -->
<!-- Copy Desk (stored role: sub_editor) — day's layout, step 2 of the print workflow -->
<template>
  <div v-if="!allowed" class="cd-gate">Checking access…</div>
  <CopyDeskWorkspace v-else />
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from '#app'
import CopyDeskWorkspace from '~/components/copydesk/CopyDeskWorkspace.vue'
import { readVgamsUser } from '~/utils/vgamsSession'
import { roleHome, flagsFromConfig } from '~/config/roles'

const ALLOWED = ['sub_editor', 'administrator']
const allowed = ref(false)
const router = useRouter()
const config = useRuntimeConfig()

// Role check client-side in onMounted (Pinia hydration timing)
onMounted(() => {
  const user = readVgamsUser()
  if (!user) return router.replace('/login')
  if (!ALLOWED.includes(user.role)) return router.replace(roleHome(user.role, flagsFromConfig(config.public)))
  allowed.value = true
})
</script>

<style scoped>
.cd-gate { padding: 40px; text-align: center; color: #64748B; font-family: 'IBM Plex Sans', sans-serif; }
</style>
