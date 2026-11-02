// composables/useLivePoll.js
//
// Re-runs a loader every `intervalMs` while the page is open and the browser
// tab is visible — bookings arrive all day, so Copy Desk and Design House
// lists keep themselves current. Pauses while `isPaused()` is true (e.g. a
// dialog is open, so nothing shifts under the user's hands) and refreshes
// straight away when the tab becomes visible again.
//
//   const live = useLivePoll(() => load({ quiet: true }), { intervalMs: 60000, isPaused: () => dialogOpen.value })
//   live.lastRefreshed.value  → Date of the last successful run
import { ref, onMounted, onBeforeUnmount } from 'vue'

export function useLivePoll(loader, { intervalMs = 60000, isPaused = () => false } = {}) {
  const lastRefreshed = ref(null)
  const running = ref(false)
  const enabled = ref(true)
  let timer = null

  async function tick(force = false) {
    if (running.value) return
    if (!force) {
      if (!enabled.value) return
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return
      if (isPaused()) return
    }
    running.value = true
    try {
      await loader()
      lastRefreshed.value = new Date()
    } catch {
      // the page shows its own error; keep polling
    } finally {
      running.value = false
    }
  }

  function onVisible() {
    if (document.visibilityState !== 'visible' || !lastRefreshed.value) return
    if (Date.now() - lastRefreshed.value.getTime() > intervalMs / 2) tick()
  }

  onMounted(() => {
    timer = setInterval(tick, intervalMs)
    document.addEventListener('visibilitychange', onVisible)
  })

  onBeforeUnmount(() => {
    clearInterval(timer)
    document.removeEventListener('visibilitychange', onVisible)
  })

  return {
    lastRefreshed,
    running,
    enabled,
    refreshNow: () => tick(true),
    markRefreshed: () => { lastRefreshed.value = new Date() },
  }
}
