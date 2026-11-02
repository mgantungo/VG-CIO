<!-- pages/dashboard/invoicing/index.vue -->
<!-- Invoicing Officer — confirm and invoice bookings (step 5) -->
<template>
  <div v-if="!allowed" class="iv-gate">Checking access…</div>
  <InvoicingWorkspace v-else mode="queue" />
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from '#app'
import InvoicingWorkspace from '~/components/invoicing/InvoicingWorkspace.vue'
import { readVgamsUser } from '~/utils/vgamsSession'
import { roleHome, flagsFromConfig } from '~/config/roles'

const ALLOWED = ['invoicing_officer', 'finance_team', 'administrator']
const allowed = ref(false)
const router = useRouter()
const config = useRuntimeConfig()

onMounted(() => {
  const user = readVgamsUser()
  if (!user) return router.replace('/login')
  if (!ALLOWED.includes(user.role)) return router.replace(roleHome(user.role, flagsFromConfig(config.public)))
  allowed.value = true
})
</script>

<style scoped>
.iv-gate { padding: 40px; text-align: center; color: #64748B; font-family: 'IBM Plex Sans', sans-serif; }
</style>
