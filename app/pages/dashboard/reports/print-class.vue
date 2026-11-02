<!-- pages/dashboard/reports/print-class.vue -->
<!-- Display vs Classified report — every role that books, lays out, invoices or manages -->
<template>
  <div v-if="!allowed" class="pr-gate">Checking access…</div>
  <PrintClassReport v-else />
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from '#app'
import PrintClassReport from '~/components/reports/PrintClassReport.vue'
import { readVgamsUser } from '~/utils/vgamsSession'
import { roleHome, flagsFromConfig } from '~/config/roles'

const ALLOWED = [
  'booking_clerk', 'sub_editor', 'design_house', 'design_house_manager',
  'invoicing_officer', 'finance_team', 'advertising_manager', 'administrator',
]
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
.pr-gate { padding: 40px; text-align: center; color: #64748B; font-family: 'IBM Plex Sans', sans-serif; }
</style>
