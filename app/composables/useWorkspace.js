// composables/useWorkspace.js
//
// Shared state for the workspace shell (RoleRail + WorkspaceTopbar +
// PipelineStrip). Pages push their own numbers in; the shell only renders.
//
//   const ws = useWorkspace()
//   ws.setHeader({ eyebrow: 'Step 2 · Copy Desk', title: 'Layout for Tue 3 Nov' })
//   ws.setBadges({ unplaced: 7 })
//   ws.setPipeline({ booked: 29, placed: 22 }, 2)
import { useRuntimeConfig, useRoute } from '#imports'
import { flagsFromConfig } from '~/config/roles'

export function useWorkspace() {
  const config = useRuntimeConfig()
  const flags = flagsFromConfig(config.public)
  const route = useRoute()

  // header and pipeline remember which path set them, so they never leak
  // onto the next page regardless of mount / route-change order
  const header = useState('ws-header', () => ({ path: null, eyebrow: '', title: '' }))
  const badges = useState('ws-badges', () => ({}))
  const pipeline = useState('ws-pipeline', () => ({ path: null, counts: null, current: null }))
  const railOpen = useState('ws-rail-open', () => false)

  function setHeader(next = {}) {
    header.value = { path: route.path, eyebrow: next.eyebrow || '', title: next.title || '' }
  }

  function clearHeader() {
    header.value = { path: null, eyebrow: '', title: '' }
  }

  function setBadges(next = {}) {
    badges.value = { ...badges.value, ...next }
  }

  function setPipeline(counts = null, current = null) {
    pipeline.value = { path: route.path, counts, current }
  }

  function clearPipeline() {
    pipeline.value = { path: null, counts: null, current: null }
  }

  return {
    flags,
    header,
    badges,
    pipeline,
    railOpen,
    setHeader,
    clearHeader,
    setBadges,
    setPipeline,
    clearPipeline,
  }
}
