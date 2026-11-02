<!-- components/design/ArtworkModal.vue -->
<!--
  Attach artwork to one booking — new or older — per run date.
  * Upload once; "Carry to remaining dates" fills every later run date
    with the same file (each date gets its own schedule row, marked carried).
  * Any single date can be dropped with a reason; the row stays so Copy Desk
    sees the gap instead of a silently missing advert.
  * Works whether or not Copy Desk has placed the advert yet; when it has,
    the page number is shown and copied onto the schedule row.
-->
<template>
  <Teleport to="body">
    <div class="am-backdrop" :class="{ open: !!advert }" @click.self="close">
      <div v-if="advert" class="am" role="dialog" aria-modal="true" aria-labelledby="am-title">
        <div class="am-head">
          <div>
            <p class="am-eye">Steps 3–4 · Artwork</p>
            <h3 id="am-title" class="am-title">{{ advert.clientName }} · {{ advert.advertTitle }}</h3>
            <p class="am-sub">
              <span v-if="advert.printAdClass" class="am-type" :class="`am-type--${advert.printAdClass}`">{{ advert.printAdClass === 'classified' ? 'Classified' : 'Display' }}</span>
              {{ advert.adSize || '—' }} · {{ advert.reference }}<template v-if="advert.bcReference"> · BC {{ advert.bcReference }}</template>
            </p>
          </div>
          <button class="am-x" type="button" aria-label="Close" @click="close">&times;</button>
        </div>

        <div class="am-body">
          <label class="am-drop" :class="{ 'am-drop--has': files.length > 0 }">
            <input type="file" multiple class="am-file" @change="onFiles">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
            <span v-if="files.length === 0">Choose the artwork file(s) — PDF, image or design export</span>
            <span v-else><b>{{ files.map(f => f.name).join(', ') }}</b> · {{ totalSize }}</span>
          </label>

          <div class="am-dates">
            <div class="am-dates__hd">
              <span>Run dates</span>
              <span class="am-muted">{{ selectedDates.length }} selected</span>
            </div>
            <div v-for="d in dateRows" :key="d.date" class="am-date" :class="{ 'am-date--past': d.past }">
              <label class="am-date__pick">
                <input
                  type="checkbox"
                  :checked="selected.has(d.date)"
                  :disabled="d.past || busy"
                  @change="toggleDate(d.date, $event.target.checked)"
                >
                <span class="am-mono">{{ formatRunDate(d.date) }}</span>
              </label>
              <span class="am-chip" :class="placementClass(d)">{{ placementLabel(d) }}</span>
              <span class="am-chip" :class="artworkClass(d.artwork)">{{ artworkLabel(d.artwork) }}</span>
              <span class="am-chip" :class="clearanceClass(d)" :title="d.clearance?.changeNote || d.clearance?.withdrawnReason || ''">{{ clearanceLabel(d) }}</span>

              <template v-if="d.scheduleId && d.artwork !== 'dropped' && !d.past">
                <button v-if="dropFor !== d.date" class="am-link" type="button" :disabled="busy" @click="startDrop(d.date)">Drop day</button>
              </template>

              <div v-if="dropFor === d.date" class="am-dropbox">
                <input v-model="dropReason" class="am-input" type="text" placeholder="Reason, e.g. client pulled this run" :aria-label="`Reason to drop ${d.date}`">
                <button class="am-btn" type="button" :disabled="busy" @click="dropFor = null">Cancel</button>
                <button class="am-btn am-btn--red" type="button" :disabled="busy || !dropReason.trim()" @click="confirmDrop(d)">Drop</button>
              </div>
            </div>
            <p v-if="dateRows.length === 0" class="am-muted">This booking has no run dates.</p>
          </div>

          <label class="am-opt">
            <input v-model="carryForward" type="checkbox" :disabled="busy">
            Carry this artwork to every later run date of this booking
          </label>
          <label class="am-opt">
            <input v-model="replaceOwn" type="checkbox" :disabled="busy">
            Also replace dates that already have their own artwork
          </label>

          <p v-if="error" class="am-err" role="alert">{{ error }}</p>
          <p v-if="done" class="am-ok" role="status">{{ done }}</p>
        </div>

        <div class="am-foot">
          <button class="am-btn" type="button" :disabled="busy" @click="close">Close</button>
          <button
            class="am-btn am-btn--pri"
            type="button"
            :disabled="busy || files.length === 0 || selectedDates.length === 0"
            @click="submit"
          >{{ busy ? 'Attaching…' : `Attach to ${selectedDates.length} date${selectedDates.length === 1 ? '' : 's'}` }}</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useDesignHouse } from '~/composables/useDesignHouse'
import { isoToday, formatRunDate, apiErrorMessage } from '~/utils/vgamsSession'

const props = defineProps({
  advert: { type: Object, default: null },   // design-house advert shape
  placement: { type: Object, default: null }, // fetchPlacements()[advert.id]
})
const emit = defineEmits(['close', 'saved'])

const { attachArtwork, dropRunDate } = useDesignHouse()

const files = ref([])
const selected = ref(new Set())
const carryForward = ref(true)
const replaceOwn = ref(false)
const busy = ref(false)
const error = ref('')
const done = ref('')
const dropFor = ref(null)
const dropReason = ref('')

const today = isoToday()

const dateRows = computed(() => {
  if (!props.advert) return []
  const states = props.placement?.runDates || []
  const dates = [...new Set([...(props.advert.publishingDates || []), ...states.map(s => s.date)])].sort()
  return dates.map(date => {
    const s = states.find(x => x.date === date) || {}
    const scheduled = (props.advert.scheduledDates || []).includes(date)
    return {
      date,
      past: date < today,
      placed: !!s.placed,
      locked: !!s.locked,
      pageNumber: s.pageNumber ?? null,
      masthead: s.masthead ?? null,
      artwork: s.artwork || (scheduled ? 'in' : 'awaiting'),
      scheduleId: s.scheduleId ?? null,
      clearance: s.clearance || null,
    }
  })
})

const selectedDates = computed(() => [...selected.value].sort())
const totalSize = computed(() => {
  const bytes = files.value.reduce((t, f) => t + (f.size || 0), 0)
  return bytes > 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`
})

watch(() => props.advert, (a) => {
  files.value = []
  error.value = ''
  done.value = ''
  dropFor.value = null
  dropReason.value = ''
  carryForward.value = true
  replaceOwn.value = false
  // Default: the earliest upcoming date still awaiting artwork (carry fills the rest)
  const first = dateRows.value.find(d => !d.past && (d.artwork === 'awaiting' || d.artwork === 'dropped'))
    || dateRows.value.find(d => !d.past)
  selected.value = new Set(first ? [first.date] : [])
}, { immediate: true })

// With carry on, ticking a date implies every later date
watch(carryForward, (on) => {
  if (!on || selected.value.size === 0) return
  const first = selectedDates.value[0]
  const next = new Set(selected.value)
  dateRows.value.filter(d => !d.past && d.date > first).forEach(d => next.add(d.date))
  selected.value = next
})

function toggleDate(date, on) {
  const next = new Set(selected.value)
  on ? next.add(date) : next.delete(date)
  selected.value = next
}

function onFiles(e) {
  files.value = Array.from(e.target.files || [])
}

const placementLabel = (d) => (d.placed ? `Page ${d.pageNumber}${d.masthead ? ` · ${d.masthead}` : ''}${d.locked ? ' · confirmed' : ''}` : 'Not on layout yet')
// Copy Desk clearance: the size to design to for that date
const clearanceLabel = (d) => {
  const c = d.clearance
  if (!c) return 'Awaiting Copy Desk'
  if (c.status === 'withdrawn') return 'Clearance withdrawn'
  const size = c.sizeLabel || (props.advert?.printAdClass === 'classified' ? 'No size' : '')
  return `${c.status === 'changed' ? 'Changed' : 'Cleared'}${size ? ` · ${size}` : ''}`
}
const clearanceClass = (d) => {
  const st = d.clearance?.status
  if (st === 'cleared') return 'am-chip--green'
  if (st === 'withdrawn') return 'am-chip--red'
  return 'am-chip--amber'
}
const placementClass = (d) => (d.placed ? 'am-chip--navy' : 'am-chip--red')
const artworkLabel = (a) => ({ in: 'Artwork in', carried: 'Carried', awaiting: 'Awaiting', dropped: 'Dropped' }[a] || a)
const artworkClass = (a) => ({ in: 'am-chip--green', carried: 'am-chip--green', awaiting: 'am-chip--amber', dropped: 'am-chip--grey' }[a] || '')

function close() {
  if (!busy.value) emit('close')
}

function startDrop(date) {
  dropFor.value = date
  dropReason.value = ''
}

async function confirmDrop(d) {
  busy.value = true
  error.value = ''
  try {
    await dropRunDate(d.scheduleId, dropReason.value.trim())
    done.value = `${formatRunDate(d.date)} dropped.`
    dropFor.value = null
    emit('saved', { advertId: props.advert.id, dropped: d.date })
  } catch (e) {
    error.value = apiErrorMessage(e, 'Could not drop that date')
  } finally {
    busy.value = false
  }
}

async function submit() {
  busy.value = true
  error.value = ''
  done.value = ''
  try {
    const res = await attachArtwork(props.advert.id, {
      files: files.value,
      runDates: selectedDates.value,
      carryForward: carryForward.value,
      replaceOwn: replaceOwn.value,
    })
    const kept = (res?.dates || []).filter(d => String(d.outcome).startsWith('kept')).length
    done.value = `${res?.message || 'Artwork attached'}${kept ? ` · ${kept} date(s) kept their existing artwork` : ''}.`
    files.value = []
    emit('saved', { advertId: props.advert.id, result: res })
  } catch (e) {
    error.value = apiErrorMessage(e, 'Could not attach the artwork')
  } finally {
    busy.value = false
  }
}
</script>

<style scoped>
.am-backdrop { position: fixed; inset: 0; background: rgba(15,23,42,.45); display: none; align-items: center; justify-content: center; z-index: 1100; padding: 16px; }
.am-backdrop.open { display: flex; }
.am { background: #fff; width: min(640px, 100%); max-height: 90vh; display: flex; flex-direction: column; border-radius: 2px; border-top: 3px solid #003366; box-shadow: 0 20px 50px rgba(0,0,0,.25); font-family: 'IBM Plex Sans', 'Segoe UI', sans-serif; color: #0F172A; }
.am-head { display: flex; justify-content: space-between; gap: 12px; padding: 16px 20px; border-bottom: 1px solid #E8ECF0; }
.am-eye { margin: 0 0 2px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .07em; color: #64748B; }
.am-title { margin: 0; font-size: 15px; color: #003366; }
.am-sub { margin: 4px 0 0; font-size: 12px; color: #475569; display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
.am-x { border: none; background: none; font-size: 22px; line-height: 1; cursor: pointer; color: #475569; width: 36px; height: 36px; }
.am-body { padding: 16px 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 14px; }
.am-foot { display: flex; justify-content: flex-end; gap: 8px; padding: 12px 20px; border-top: 1px solid #E8ECF0; }

.am-drop { position: relative; display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 18px; border: 1px dashed #9DC3E6; background: #F5F9FD; border-radius: 2px; text-align: center; font-size: 12.5px; color: #334155; cursor: pointer; }
.am-drop--has { border-style: solid; border-color: #003366; }
.am-drop svg { color: #003366; }
.am-file { position: absolute; inset: 0; opacity: 0; cursor: pointer; }

.am-dates { border: 1px solid #E2E8F0; border-radius: 2px; }
.am-dates__hd { display: flex; justify-content: space-between; padding: 8px 12px; background: #F8FAFC; border-bottom: 1px solid #E2E8F0; font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: #475569; }
.am-date { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 9px 12px; border-bottom: 1px solid #EEF2F6; }
.am-date:last-child { border-bottom: none; }
.am-date--past { opacity: .55; }
.am-date__pick { display: inline-flex; align-items: center; gap: 8px; min-width: 120px; cursor: pointer; }
.am-date__pick input, .am-opt input { width: 16px; height: 16px; accent-color: #003366; }
.am-dropbox { flex-basis: 100%; display: flex; gap: 6px; }
.am-input { flex: 1; min-height: 34px; border: 1px solid #D1D9E0; border-radius: 2px; padding: 6px 10px; font: inherit; font-size: 12.5px; }

.am-chip { display: inline-flex; padding: 2px 7px; border-radius: 2px; font-size: 10.5px; font-weight: 600; border: 1px solid #D1D9E0; background: #F8FAFC; color: #334155; white-space: nowrap; }
.am-chip--navy { background: #E8F0F8; border-color: #9DC3E6; color: #003366; }
.am-chip--green { background: #ECFDF3; border-color: #86D9A8; color: #14532D; }
.am-chip--amber { background: #FFF7E6; border-color: #F2C46D; color: #7A4A00; }
.am-chip--red { background: #FDECEC; border-color: #F0A3A5; color: #8A1014; }
.am-chip--grey { background: #fff; border-style: dashed; color: #64748B; text-decoration: line-through; }
.am-type { display: inline-block; padding: 1px 7px; border-radius: 2px; font-size: 10.5px; font-weight: 700; }
.am-type--display { background: #E8F0F8; border: 1px solid #9DC3E6; color: #003366; }
.am-type--classified { background: #F3EEF9; border: 1px solid #C9B5E4; color: #4B2A7A; }

.am-opt { display: flex; align-items: center; gap: 8px; font-size: 12.5px; font-weight: 600; color: #003366; cursor: pointer; }
.am-link { margin-left: auto; border: none; background: none; color: #8A1014; font: inherit; font-size: 12px; font-weight: 600; text-decoration: underline; cursor: pointer; min-height: 32px; }
.am-mono { font-family: 'IBM Plex Mono', monospace; font-size: 12px; }
.am-muted { color: #64748B; font-size: 12px; }
.am-err { margin: 0; color: #8A1014; font-weight: 600; font-size: 12.5px; }
.am-ok { margin: 0; color: #14532D; font-weight: 600; font-size: 12.5px; }

.am-btn { min-height: 36px; padding: 0 14px; border: 1px solid #D1D9E0; background: #fff; color: #003366; border-radius: 2px; font: inherit; font-size: 12px; font-weight: 600; cursor: pointer; }
.am-btn:disabled { opacity: .5; cursor: not-allowed; }
.am-btn--pri { background: #003366; border-color: #003366; color: #fff; }
.am-btn--red { background: #C0181E; border-color: #C0181E; color: #fff; }
</style>
