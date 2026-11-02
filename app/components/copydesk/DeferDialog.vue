<!-- components/copydesk/DeferDialog.vue -->
<!--
  Move one run date of an advert to another day — used for bookings that
  arrive after the day's layout is confirmed (or when a day runs out of space).
  Shows the next days with their layout status; confirmed days can't be picked.
  The booking clerk sees "Deferred: old → new" on My Bookings.
-->
<template>
  <div v-if="advert" class="df-overlay" @click.self="close">
    <div class="df" role="dialog" aria-modal="true" aria-labelledby="df-title">
      <header class="df-hd">
        <div>
          <p class="df-eye">Defer advert</p>
          <h3 id="df-title" class="df-title">{{ advert.clientName }} · {{ advert.advertTitle }}</h3>
          <p class="df-sub">Move the run on <b>{{ formatRunDate(fromDate) }}</b> to:</p>
        </div>
        <button class="df-x" type="button" aria-label="Close" @click="close">&times;</button>
      </header>

      <div class="df-body">
        <div class="df-days" role="radiogroup" aria-label="New run date">
          <button
            v-for="d in days"
            :key="d.date"
            type="button"
            class="df-day"
            :class="{ on: toDate === d.date, blocked: !d.allowed }"
            :disabled="!d.allowed"
            :aria-pressed="toDate === d.date"
            :title="d.note"
            @click="toDate = d.date"
          >
            <span class="df-day__d">{{ formatRunDate(d.date) }}</span>
            <span class="df-day__s">{{ d.label }}</span>
          </button>
        </div>

        <label class="df-field">
          <span class="df-lbl">Or pick a date</span>
          <input v-model="toDate" class="df-input" type="date" :min="minDate">
        </label>
        <p v-if="pickedStatus === 'confirmed'" class="df-err">The layout for {{ formatRunDate(toDate) }} is already confirmed. Pick another date.</p>

        <label class="df-field">
          <span class="df-lbl">Reason</span>
          <input v-model="reason" class="df-input" type="text" placeholder="e.g. Booked after the layout was confirmed">
        </label>

        <p class="df-note">
          The booking's run date changes, its clearance and any attached artwork move with it,
          and the clerk sees the change on My Bookings so the client can be told.
        </p>
        <p v-if="error" class="df-err" role="alert">{{ error }}</p>
      </div>

      <footer class="df-ft">
        <button class="df-btn" type="button" :disabled="busy" @click="close">Cancel</button>
        <button class="df-btn df-btn--pri" type="button" :disabled="busy || !canSubmit" @click="submit">
          {{ busy ? 'Deferring…' : `Defer to ${toDate ? formatRunDate(toDate) : '…'}` }}
        </button>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useCopyDesk } from '~/composables/useCopyDesk'
import { isoToday, shiftIsoDate, formatRunDate, apiErrorMessage } from '~/utils/vgamsSession'

const props = defineProps({
  advert: { type: Object, default: null },  // a row from bookings-by-date
  fromDate: { type: String, required: true },
})
const emit = defineEmits(['close', 'saved'])

const copyDesk = useCopyDesk()
const toDate = ref('')
const reason = ref('')
const busy = ref(false)
const error = ref('')
const status = ref({})

const minDate = computed(() => {
  const next = shiftIsoDate(props.fromDate, 1)
  const today = isoToday()
  return next > today ? next : today
})

const days = computed(() => {
  const list = []
  for (let i = 0; i < 7; i++) {
    const date = shiftIsoDate(minDate.value, i)
    const st = status.value[date]?.status || 'unknown'
    const already = (props.advert?.publishingDates || []).includes(date)
    list.push({
      date,
      allowed: st !== 'confirmed' && !already,
      label: already ? 'Already booked' : ({ confirmed: 'Layout confirmed', open: 'Layout open', none: 'No layout yet', unknown: '…' }[st]),
      note: already ? 'This advert already runs on that day' : '',
    })
  }
  return list
})

const pickedStatus = computed(() => status.value[toDate.value]?.status || null)
const canSubmit = computed(() => !!toDate.value && toDate.value >= minDate.value && pickedStatus.value !== 'confirmed'
  && !(props.advert?.publishingDates || []).includes(toDate.value) && reason.value.trim().length > 0)

async function loadStatus(extra = []) {
  const dates = [...new Set([...Array.from({ length: 7 }, (_, i) => shiftIsoDate(minDate.value, i)), ...extra])]
  try {
    status.value = { ...status.value, ...(await copyDesk.fetchLayoutStatus(dates, props.advert?.productId || null)) }
  } catch {
    // status chips stay "…"; the server still refuses confirmed days
  }
}

watch(() => props.advert, (a) => {
  error.value = ''
  reason.value = a?.lateArrival ? 'Booked after the layout was confirmed' : ''
  toDate.value = ''
  status.value = {}
  if (a) loadStatus().then(() => {
    const first = days.value.find(d => d.allowed)
    if (first && !toDate.value) toDate.value = first.date
  })
}, { immediate: true })

watch(toDate, (d) => {
  if (d && !status.value[d]) loadStatus([d])
})

function close() {
  if (!busy.value) emit('close')
}

async function submit() {
  busy.value = true
  error.value = ''
  try {
    const res = await copyDesk.defer(props.advert.id, props.fromDate, toDate.value, reason.value.trim())
    emit('saved', res)
    emit('close')
  } catch (e) {
    error.value = apiErrorMessage(e, 'Could not defer this advert')
  } finally {
    busy.value = false
  }
}
</script>

<style scoped>
.df-overlay { position: fixed; inset: 0; background: rgba(15,23,42,.45); z-index: 1200; display: flex; align-items: center; justify-content: center; padding: 16px; }
.df { background: #fff; width: min(560px, 100%); max-height: 92vh; display: flex; flex-direction: column; border-radius: 2px; border-top: 3px solid #C0181E; box-shadow: 0 20px 50px rgba(0,0,0,.25); font-family: 'IBM Plex Sans', 'Segoe UI', sans-serif; color: #0F172A; font-size: 13px; }
.df-hd { display: flex; justify-content: space-between; gap: 12px; padding: 16px 20px; border-bottom: 1px solid #E8ECF0; }
.df-eye { margin: 0 0 2px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .07em; color: #64748B; }
.df-title { margin: 0; font-size: 15px; color: #003366; }
.df-sub { margin: 4px 0 0; font-size: 12.5px; color: #475569; }
.df-x { border: none; background: none; font-size: 22px; line-height: 1; cursor: pointer; color: #475569; width: 36px; height: 36px; }
.df-body { padding: 16px 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 14px; }
.df-ft { display: flex; justify-content: flex-end; gap: 8px; padding: 12px 20px; border-top: 1px solid #E8ECF0; }

.df-days { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 8px; }
.df-day { text-align: left; font: inherit; cursor: pointer; background: #fff; border: 1px solid #D1D9E0; border-radius: 2px; padding: 9px 11px; display: flex; flex-direction: column; gap: 2px; min-height: 52px; }
.df-day:hover:not(:disabled) { background: #F5F9FD; }
.df-day.on { border: 2px solid #003366; padding: 8px 10px; background: #F5F9FD; }
.df-day.blocked { opacity: .55; cursor: not-allowed; background: #F8FAFC; }
.df-day__d { font-family: 'IBM Plex Mono', monospace; font-size: 12px; font-weight: 600; }
.df-day__s { font-size: 11px; color: #64748B; }

.df-field { display: flex; flex-direction: column; }
.df-lbl { margin: 0 0 6px; font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: #475569; }
.df-input { min-height: 38px; border: 1px solid #D1D9E0; border-radius: 2px; padding: 6px 10px; font: inherit; color: #0F172A; background: #fff; }
.df-input:focus-visible, .df-btn:focus-visible, .df-day:focus-visible { outline: 2px solid #9DC3E6; outline-offset: 1px; }
.df-note { margin: 0; font-size: 12px; color: #475569; background: #F5F9FD; border: 1px solid #DEEAF1; border-radius: 2px; padding: 10px 12px; }
.df-err { margin: 0; color: #8A1014; font-weight: 600; }

.df-btn { min-height: 36px; padding: 0 14px; border: 1px solid #D1D9E0; background: #fff; color: #003366; border-radius: 2px; font: inherit; font-size: 12px; font-weight: 600; cursor: pointer; }
.df-btn:disabled { opacity: .5; cursor: not-allowed; }
.df-btn--pri { background: #C0181E; border-color: #C0181E; color: #fff; }
</style>
