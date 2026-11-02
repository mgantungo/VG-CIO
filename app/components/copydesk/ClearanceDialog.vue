<!-- components/copydesk/ClearanceDialog.vue -->
<!--
  Confirm one advert for a run date (step 2) — Design House sees it as cleared for design.
  * Display adverts need a size: a preset (Quarter page, Half page vertical…)
    or custom columns × cm. Classifieds can be confirmed with no size.
  * A size different from the booked one needs a reason (the price is not changed).
  * Applies to the chosen run date and, by default, every later run date.
-->
<template>
  <div v-if="advert" class="cl-overlay" @click.self="close">
    <div class="cl" role="dialog" aria-modal="true" aria-labelledby="cl-title">
      <header class="cl-hd">
        <div>
          <p class="cl-eye">Step 2 · Confirm advert for the day</p>
          <h3 id="cl-title" class="cl-title">{{ advert.clientName }} · {{ advert.advertTitle }}</h3>
          <p class="cl-sub">
            <span class="cl-type" :class="`cl-type--${isClassified ? 'classified' : 'display'}`">{{ isClassified ? 'Classified' : 'Display' }}</span>
            Booked: <b>{{ advert.bookedSize?.label || advert.bookedSizeText || '—' }}</b>
            <template v-if="advert.placement"> · Page {{ advert.placement.pageNumber }}</template>
          </p>
        </div>
        <button class="cl-x" type="button" aria-label="Close" @click="close">&times;</button>
      </header>

      <div class="cl-body">
        <!-- Classified: size is optional -->
        <div v-if="isClassified" class="cl-mode" role="radiogroup" aria-label="Classified size">
          <label class="cl-radio" :class="{ on: mode === 'none' }">
            <input v-model="mode" type="radio" value="none"> Confirm without a size
          </label>
          <label class="cl-radio" :class="{ on: mode !== 'none' }">
            <input type="radio" :checked="mode !== 'none'" @change="mode = 'preset'"> Set a size
          </label>
        </div>

        <template v-if="!isClassified || mode !== 'none'">
          <p class="cl-lbl">Size</p>
          <div class="cl-presets" role="radiogroup" aria-label="Size preset">
            <button
              v-for="p in sizePresets"
              :key="p.id"
              type="button"
              class="cl-preset"
              :class="{ on: mode === 'preset' && presetId === p.id }"
              :aria-pressed="mode === 'preset' && presetId === p.id"
              @click="pickPreset(p)"
            >
              <span class="cl-preset__name">{{ p.name }}</span>
              <span class="cl-preset__dim">{{ p.columns && p.heightCm ? `${p.columns} col × ${p.heightCm} cm` : 'size not set' }}</span>
              <em v-if="p.id === advert.suggestedPresetId" class="cl-preset__hint">matches booking</em>
            </button>
            <button type="button" class="cl-preset" :class="{ on: mode === 'custom' }" :aria-pressed="mode === 'custom'" @click="mode = 'custom'">
              <span class="cl-preset__name">Custom</span>
              <span class="cl-preset__dim">columns × cm</span>
            </button>
          </div>
          <p v-if="sizePresets.length === 0" class="cl-note">No size presets yet — use Custom, or add presets in the admin panel.</p>

          <div v-if="mode === 'custom'" class="cl-custom">
            <label class="cl-field"><span class="cl-lbl">Columns</span><input v-model.number="columns" class="cl-input" type="number" min="1" step="0.5" inputmode="decimal"></label>
            <span class="cl-times">×</span>
            <label class="cl-field"><span class="cl-lbl">Height (cm)</span><input v-model.number="heightCm" class="cl-input" type="number" min="1" step="0.5" inputmode="decimal"></label>
          </div>

          <div v-if="differs" class="cl-warn">
            <p>Different from the booked size ({{ advert.bookedSize.label }}). The price is not changed.</p>
            <label class="cl-field">
              <span class="cl-lbl">Reason</span>
              <input v-model="differsReason" class="cl-input" type="text" placeholder="e.g. Client approved upgrade by phone">
            </label>
          </div>
        </template>

        <label class="cl-field">
          <span class="cl-lbl">Position (optional)</span>
          <input v-model="position" class="cl-input" type="text" maxlength="120" placeholder="e.g. Top right, solus, facing editorial">
        </label>

        <div class="cl-dates">
          <p class="cl-lbl">Run dates</p>
          <div class="cl-chips">
            <label v-for="d in futureDates" :key="d" class="cl-chip" :class="{ on: selected.has(d) }">
              <input type="checkbox" :checked="selected.has(d)" @change="toggle(d, $event.target.checked)">
              {{ formatRunDate(d) }}
            </label>
          </div>
          <label class="cl-carry"><input v-model="carryForward" type="checkbox"> Apply to every later run date as well</label>
        </div>

        <p v-if="error" class="cl-err" role="alert">{{ error }}</p>
        <ul v-if="failures.length" class="cl-fails">
          <li v-for="f in failures" :key="f.runDate">{{ formatRunDate(f.runDate) }}: {{ f.message }}</li>
        </ul>
      </div>

      <footer class="cl-ft">
        <button class="cl-btn" type="button" :disabled="busy" @click="close">Cancel</button>
        <button class="cl-btn cl-btn--pri" type="button" :disabled="busy || !canSubmit" @click="submit">
          {{ busy ? 'Saving…' : `Confirm for ${formatRunDate(date)}` }}
        </button>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useCopyDesk } from '~/composables/useCopyDesk'
import { isoToday, formatRunDate, apiErrorMessage } from '~/utils/vgamsSession'

const props = defineProps({
  advert: { type: Object, default: null },  // a row from bookings-by-date
  date: { type: String, required: true },
  presets: { type: Array, default: () => [] },
})
const emit = defineEmits(['close', 'saved'])

const copyDesk = useCopyDesk()

const mode = ref('none')
const presetId = ref(null)
const columns = ref(null)
const heightCm = ref(null)
const position = ref('')
const differsReason = ref('')
const carryForward = ref(true)
const selected = ref(new Set())
const busy = ref(false)
const error = ref('')
const failures = ref([])

const isClassified = computed(() => props.advert?.printAdClass === 'classified')
const sizePresets = computed(() => props.presets.filter(p => p.appliesTo !== 'classified' || isClassified.value))
const futureDates = computed(() => {
  const today = isoToday()
  return (props.advert?.publishingDates || []).filter(d => d >= today || d === props.date)
})

const chosen = computed(() => {
  if (mode.value === 'custom') return columns.value && heightCm.value ? { columns: Number(columns.value), heightCm: Number(heightCm.value) } : null
  if (mode.value === 'preset') {
    const p = props.presets.find(x => x.id === presetId.value)
    return p && p.columns && p.heightCm ? { columns: p.columns, heightCm: p.heightCm } : null
  }
  return null
})

const differs = computed(() => {
  const b = props.advert?.bookedSize
  return !!(b && chosen.value && (Number(b.columns) !== chosen.value.columns || Number(b.heightCm) !== chosen.value.heightCm))
})

const canSubmit = computed(() => {
  if (selected.value.size === 0) return false
  if (mode.value === 'none') return isClassified.value
  if (mode.value === 'preset' && !presetId.value) return false
  if (mode.value === 'custom' && !chosen.value) return false
  if (differs.value && !differsReason.value.trim()) return false
  return true
})

// Start from the existing clearance, else the booking
watch(() => props.advert, (a) => {
  error.value = ''
  failures.value = []
  differsReason.value = ''
  carryForward.value = true
  selected.value = new Set(a ? [props.date] : [])
  if (!a) return
  const c = a.clearance && a.clearance.status !== 'withdrawn' ? a.clearance : null
  position.value = c?.position || ''
  if (c?.sizeMode === 'preset' && c.presetId) {
    mode.value = 'preset'; presetId.value = c.presetId
  } else if (c?.sizeMode === 'custom') {
    mode.value = 'custom'; columns.value = c.columns; heightCm.value = c.heightCm
  } else if (a.printAdClass === 'classified') {
    mode.value = 'none'; presetId.value = null
  } else if (a.suggestedPresetId) {
    mode.value = 'preset'; presetId.value = a.suggestedPresetId
  } else {
    mode.value = a.bookedSize ? 'custom' : 'preset'
    presetId.value = null
    columns.value = a.bookedSize?.columns ?? null
    heightCm.value = a.bookedSize?.heightCm ?? null
  }
  differsReason.value = c?.sizeDiffersReason || ''
}, { immediate: true })

function pickPreset(p) {
  mode.value = 'preset'
  presetId.value = p.id
}

function toggle(d, on) {
  const next = new Set(selected.value)
  on ? next.add(d) : next.delete(d)
  selected.value = next
}

function close() {
  if (!busy.value) emit('close')
}

async function submit() {
  busy.value = true
  error.value = ''
  failures.value = []
  try {
    const res = await copyDesk.clear({
      advertId: props.advert.id,
      runDates: [...selected.value],
      carryForward: carryForward.value,
      sizeMode: mode.value,
      ...(mode.value === 'preset' ? { presetId: presetId.value } : {}),
      ...(mode.value === 'custom' ? { columns: Number(columns.value), heightCm: Number(heightCm.value) } : {}),
      position: position.value.trim() || null,
      sizeDiffersReason: differs.value ? differsReason.value.trim() : null,
    })
    failures.value = (res?.results || []).filter(r => !r.ok)
    if (failures.value.length === 0) {
      emit('saved', res)
      emit('close')
    } else {
      emit('saved', res)
      error.value = 'Some run dates could not be confirmed:'
    }
  } catch (e) {
    error.value = apiErrorMessage(e, 'Could not confirm this advert')
  } finally {
    busy.value = false
  }
}
</script>

<style scoped>
.cl-overlay { position: fixed; inset: 0; background: rgba(15,23,42,.45); z-index: 1200; display: flex; align-items: center; justify-content: center; padding: 16px; }
.cl { background: #fff; width: min(640px, 100%); max-height: 92vh; display: flex; flex-direction: column; border-radius: 2px; border-top: 3px solid #003366; box-shadow: 0 20px 50px rgba(0,0,0,.25); font-family: 'IBM Plex Sans', 'Segoe UI', sans-serif; color: #0F172A; font-size: 13px; }
.cl-hd { display: flex; justify-content: space-between; gap: 12px; padding: 16px 20px; border-bottom: 1px solid #E8ECF0; }
.cl-eye { margin: 0 0 2px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .07em; color: #64748B; }
.cl-title { margin: 0; font-size: 15px; color: #003366; }
.cl-sub { margin: 4px 0 0; font-size: 12px; color: #475569; display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
.cl-x { border: none; background: none; font-size: 22px; line-height: 1; cursor: pointer; color: #475569; width: 36px; height: 36px; }
.cl-body { padding: 16px 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 14px; }
.cl-ft { display: flex; justify-content: flex-end; gap: 8px; padding: 12px 20px; border-top: 1px solid #E8ECF0; }

.cl-type { display: inline-block; padding: 1px 7px; border-radius: 2px; font-size: 10.5px; font-weight: 700; }
.cl-type--display { background: #E8F0F8; border: 1px solid #9DC3E6; color: #003366; }
.cl-type--classified { background: #F3EEF9; border: 1px solid #C9B5E4; color: #4B2A7A; }

.cl-lbl { display: block; margin: 0 0 6px; font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: #475569; }
.cl-mode { display: flex; gap: 8px; flex-wrap: wrap; }
.cl-radio { display: inline-flex; align-items: center; gap: 8px; min-height: 40px; padding: 0 14px; border: 1px solid #D1D9E0; border-radius: 2px; cursor: pointer; font-weight: 600; }
.cl-radio.on { border: 2px solid #003366; padding: 0 13px; color: #003366; }
.cl-radio input { accent-color: #003366; }

.cl-presets { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 8px; }
.cl-preset { text-align: left; font: inherit; cursor: pointer; background: #fff; border: 1px solid #D1D9E0; border-radius: 2px; padding: 10px 12px; display: flex; flex-direction: column; gap: 3px; min-height: 58px; }
.cl-preset:hover { background: #F5F9FD; }
.cl-preset.on { border: 2px solid #003366; padding: 9px 11px; background: #F5F9FD; }
.cl-preset__name { font-weight: 700; color: #0F172A; }
.cl-preset.on .cl-preset__name { color: #003366; }
.cl-preset__dim { font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: #64748B; }
.cl-preset__hint { font-style: normal; font-size: 10px; font-weight: 600; color: #14532D; }

.cl-custom { display: flex; align-items: flex-end; gap: 10px; }
.cl-times { padding-bottom: 10px; color: #64748B; }
.cl-field { display: flex; flex-direction: column; flex: 1; }
.cl-input { min-height: 38px; border: 1px solid #D1D9E0; border-radius: 2px; padding: 6px 10px; font: inherit; color: #0F172A; background: #fff; }
.cl-input:focus-visible, .cl-btn:focus-visible, .cl-preset:focus-visible { outline: 2px solid #9DC3E6; outline-offset: 1px; }

.cl-warn { background: #FFF7E6; border: 1px solid #F2C46D; border-radius: 2px; padding: 10px 12px; color: #7A4A00; display: flex; flex-direction: column; gap: 8px; }
.cl-warn p { margin: 0; }
.cl-note { margin: 0; font-size: 12px; color: #64748B; }

.cl-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.cl-chip { display: inline-flex; align-items: center; gap: 6px; min-height: 34px; padding: 0 10px; border: 1px solid #D1D9E0; border-radius: 2px; font-family: 'IBM Plex Mono', monospace; font-size: 12px; cursor: pointer; }
.cl-chip.on { border-color: #003366; background: #E8F0F8; color: #003366; }
.cl-chip input, .cl-carry input { accent-color: #003366; width: 15px; height: 15px; }
.cl-carry { display: flex; align-items: center; gap: 8px; margin-top: 8px; font-weight: 600; color: #003366; cursor: pointer; }

.cl-err { margin: 0; color: #8A1014; font-weight: 600; }
.cl-fails { margin: 0; padding-left: 18px; color: #8A1014; font-size: 12px; }

.cl-btn { min-height: 36px; padding: 0 14px; border: 1px solid #D1D9E0; background: #fff; color: #003366; border-radius: 2px; font: inherit; font-size: 12px; font-weight: 600; cursor: pointer; }
.cl-btn:disabled { opacity: .5; cursor: not-allowed; }
.cl-btn--pri { background: #003366; border-color: #003366; color: #fff; }
</style>