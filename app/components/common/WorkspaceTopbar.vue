<!-- components/common/WorkspaceTopbar.vue -->
<!--
  Eyebrow + title for the current page. Pages can set their own through
  useWorkspace().setHeader(); otherwise it is derived from the rail item
  that matches the route (group title → eyebrow, item label → title).
-->
<template>
  <header class="wt">
    <button class="wt__menu" type="button" aria-label="Open menu" @click="ws.railOpen.value = true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
    </button>
    <div class="wt__titles">
      <p class="wt__eye">{{ eyebrow }}</p>
      <h1 class="wt__h1">{{ title }}</h1>
    </div>
    <div class="wt__right">
      <slot name="actions" />
      <span class="wt__clk">{{ clock }}</span>
    </div>
  </header>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from '#app'
import { matchRailItem } from '~/config/roles'
import { useWorkspace } from '~/composables/useWorkspace'

const props = defineProps({
  role: { type: String, required: true },
})

const route = useRoute()
const ws = useWorkspace()

const match = computed(() => matchRailItem(props.role, route.path, ws.flags))

const own = computed(() => (ws.header.value.path === route.path ? ws.header.value : null))

const eyebrow = computed(() => {
  if (own.value?.eyebrow) return own.value.eyebrow
  const step = match.value?.item?.step
  const group = match.value?.group?.title || 'VGAMS'
  return step ? `Step ${step} · ${group}` : group
})
const title = computed(() => own.value?.title || match.value?.item?.label || 'Dashboard')

const clock = ref('')
let timer = null
const tick = () => {
  clock.value = new Date().toLocaleString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}
onMounted(() => { tick(); timer = setInterval(tick, 30000) })
onBeforeUnmount(() => clearInterval(timer))
</script>

<style scoped>
.wt {
  display: flex; align-items: center; justify-content: space-between; gap: 14px; flex-wrap: wrap;
  padding: 12px 24px 10px; background: #fff; border-bottom: 2px solid #DEEAF1;
  font-family: 'IBM Plex Sans', 'Segoe UI', sans-serif;
}
.wt__menu { display: none; width: 38px; height: 38px; border: 1px solid #D1D9E0; background: #fff; color: #003366; border-radius: 2px; cursor: pointer; align-items: center; justify-content: center; }
.wt__menu svg { width: 18px; height: 18px; }
.wt__titles { flex: 1; min-width: 200px; }
.wt__eye { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .07em; color: #64748B; margin: 0 0 2px; }
.wt__h1 { font-size: 18px; font-weight: 700; color: #003366; margin: 0; line-height: 1.25; }
.wt__right { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.wt__clk { font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: #64748B; }
@media (max-width: 900px) {
  .wt { padding: 10px 12px; }
  .wt__menu { display: inline-flex; }
  .wt__clk { display: none; }
}
</style>
