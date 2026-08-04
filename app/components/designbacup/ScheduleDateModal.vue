<!-- components/design/ScheduleDateModal.vue -->
<template>
  <div v-if="show" class="sdm-overlay" @click.self="close">
    <div class="sdm-modal">

      <!-- ── HEADER ── -->
      <div class="sdm-head">
        <div class="sdm-head__left">
          <div class="sdm-head__title">Schedule Detail</div>
          <div class="sdm-head__sub">{{ advert?.reference }} — {{ advert?.clientName }}</div>
        </div>
        <button class="sdm-head__close" @click="close">×</button>
      </div>

      <!-- ── INFO BAND ── -->
      <div class="sdm-band">
        <div class="sdm-band__cell">
          <div class="sdm-band__lbl">Date</div>
          <div class="sdm-band__val mono">{{ fmtLong(date) }}</div>
        </div>
        <div class="sdm-band__div"></div>
        <div class="sdm-band__cell">
          <div class="sdm-band__lbl">Platform</div>
          <div class="sdm-band__val">{{ advert?.platform }}</div>
        </div>
        <div class="sdm-band__div"></div>
        <div class="sdm-band__cell">
          <div class="sdm-band__lbl">Product</div>
          <div class="sdm-band__val">{{ advert?.product }}</div>
        </div>
      </div>

      <!-- ── BODY ── -->
      <div class="sdm-body">

        <!-- Loading -->
        <div v-if="loading" class="sdm-loading">
          <div class="sdm-spinner"></div>
          <span>Loading schedule…</span>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="sdm-error">
          <span class="sdm-error__icon">⚠</span> {{ error }}
        </div>

        <!-- No schedule found for this date -->
        <div v-else-if="!schedule" class="sdm-empty">
          No schedule entry found for {{ fmtLong(date) }}.
        </div>

        <!-- Schedule Details -->
        <template v-else>

          <!-- Status row -->
          <div class="sdm-status-row">
            <span class="sdm-badge" :class="schedule.is_published ? 'sdm-badge--green' : 'sdm-badge--amber'">
              {{ schedule.is_published ? 'Published' : 'Not Published' }}
            </span>
            <span class="sdm-id">Schedule #{{ schedule.id }}</span>
          </div>

          <!-- Details table -->
          <table class="sdm-tbl">
            <tbody>
              <tr>
                <td class="sdm-tbl__lbl">Run Date</td>
                <td class="sdm-tbl__val mono">{{ fmtLong(schedule.run_date) }}</td>
              </tr>
              <tr v-if="runTimes.length > 0">
                <td class="sdm-tbl__lbl">Run Time{{ runTimes.length > 1 ? 's' : '' }}</td>
                <td class="sdm-tbl__val">
                  <span v-for="t in runTimes" :key="t" class="sdm-time-chip">{{ t }}</span>
                </td>
              </tr>
              <tr v-else-if="advert?.platform === 'Print Media'">
                <td class="sdm-tbl__lbl">Run Time</td>
                <td class="sdm-tbl__val sdm-na">N/A — Print Media</td>
              </tr>
              <tr>
                <td class="sdm-tbl__lbl">Page</td>
                <td class="sdm-tbl__val mono">{{ schedule.page != null ? schedule.page : '—' }}</td>
              </tr>
              <tr>
                <td class="sdm-tbl__lbl">Created</td>
                <td class="sdm-tbl__val mono">{{ fmtDateTime(schedule.createdAt) }}</td>
              </tr>
            </tbody>
          </table>

          <!-- Media files -->
          <div class="sdm-section">
            <div class="sdm-section__head">
              <span class="sdm-section__title">Media Files</span>
              <span class="sdm-section__count">{{ mediaFiles.length }} file{{ mediaFiles.length !== 1 ? 's' : '' }}</span>
            </div>
            <div v-if="mediaFiles.length === 0" class="sdm-no-files">
              No media files attached to this schedule.
            </div>
            <div v-else class="sdm-file-list">
              <div v-for="f in mediaFiles" :key="f.id" class="sdm-file-row">
                <span class="sdm-file-icon">{{ fileIcon(f.name || f.url) }}</span>
                <div class="sdm-file-info">
                  <div class="sdm-file-name">{{ f.name || 'Unnamed file' }}</div>
                  <div class="sdm-file-meta">
                    <span v-if="f.ext" class="sdm-ext">{{ f.ext?.replace('.','').toUpperCase() }}</span>
                    <span v-if="f.size">{{ fmtSize(f.size) }}</span>
                  </div>
                </div>
                <a v-if="f.url" :href="resolveUrl(f.url)" target="_blank" class="sdm-file-link" title="Preview / Download">
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                    <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" stroke-width="1.5"/>
                    <circle cx="8" cy="8" r="2" stroke="currentColor" stroke-width="1.5"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>

        </template>
      </div>

      <!-- ── FOOTER ── -->
      <div class="sdm-footer">
        <button class="sdm-btn sdm-btn--close" @click="close">Close</button>
        <button v-if="schedule" class="sdm-btn sdm-btn--reschedule" @click="reschedule">
          Reschedule This Date
        </button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useAdverts } from '~/composables/useAdverts'
import { useRuntimeConfig } from '#app'

const props = defineProps({
  show:   { type: Boolean, default: false },
  advert: { type: Object,  default: null  },
  date:   { type: String,  default: ''    }, // YYYY-MM-DD
})

const emit = defineEmits(['close', 'reschedule'])

const config      = useRuntimeConfig()
const uploadBase  = config.public?.uploadBase || ''
const resolveUrl  = (url) => (url && !url.startsWith('http') ? uploadBase + url : url)

const { getAdvertSchedules } = useAdverts()

const allSchedules = ref([])
const loading      = ref(false)
const error        = ref('')

// The specific schedule entry for the selected date
const schedule = computed(() => {
  const target = props.date ? props.date.split('T')[0] : ''
  return allSchedules.value.find(s => s.run_date === target) || null
})

const runTimes = computed(() => {
  if (!schedule.value?.run_time) return []
  return Array.isArray(schedule.value.run_time)
    ? schedule.value.run_time
    : [schedule.value.run_time]
})

const mediaFiles = computed(() => schedule.value?.media || [])

// Fetch all schedules for this advert when modal opens
watch(() => [props.show, props.advert?.id], async ([show, id]) => {
  if (!show || !id) return
  loading.value = true
  error.value   = ''
  allSchedules.value = []
  try {
    const res = await getAdvertSchedules(id)
    const raw = res?.data || []
    // Normalise run_date to YYYY-MM-DD regardless of whether Strapi
    // returns '2025-06-01' or '2025-06-01T00:00:00.000Z'
    allSchedules.value = raw.map(s => ({
      ...s,
      run_date: s.run_date ? s.run_date.split('T')[0] : s.run_date,
    }))
  } catch (e) {
    error.value = e.message || 'Failed to load schedule details'
  } finally {
    loading.value = false
  }
}, { immediate: true })

// ── Helpers ──
const fmtLong = (s) => {
  if (!s) return '—'
  try { return new Date(s + 'T00:00:00').toLocaleDateString('en-UG', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) }
  catch { return s }
}

const fmtDateTime = (s) => {
  if (!s) return '—'
  try { return new Date(s).toLocaleString('en-UG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) }
  catch { return s }
}

const fmtSize = (bytes) => {
  if (!bytes) return ''
  if (bytes < 1024)        return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

const fileIcon = (name = '') => {
  const ext = name.split('.').pop().toLowerCase()
  return { pdf:'📕', jpg:'🖼️', jpeg:'🖼️', png:'🖼️', gif:'🖼️', svg:'🎨',
           psd:'🎨', ai:'🎨', eps:'🎨', mp4:'🎬', mov:'🎬', avi:'🎬', wmv:'🎬' }[ext] || '📎'
}

const close = () => emit('close')

const reschedule = () => {
  emit('reschedule', { advert: props.advert, date: props.date })
  close()
}
</script>

<style scoped>
.sdm-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,.68);
  backdrop-filter: blur(3px);
  display: flex; align-items: center; justify-content: center;
  z-index: 5000; padding: 20px;
  font-family: 'IBM Plex Sans', 'Segoe UI', sans-serif;
}

/* ── MODAL ── */
.sdm-modal {
  background: #fff;
  width: 100%; max-width: 560px;
  max-height: 88vh;
  display: flex; flex-direction: column;
  border-top: 4px solid #E31E24;
}

/* ── HEADER ── */
.sdm-head {
  background: #1F3864;
  padding: 14px 20px;
  display: flex; justify-content: space-between; align-items: flex-start;
  flex-shrink: 0;
}
.sdm-head__left  { display: flex; flex-direction: column; gap: 2px; }
.sdm-head__title { color: #fff; font-size: 15px; font-weight: 700; }
.sdm-head__sub   { color: #9DC3E6; font-size: 11px; font-family: 'IBM Plex Mono', monospace; }
.sdm-head__close {
  background: none; border: none; color: #9DC3E6;
  font-size: 24px; cursor: pointer; line-height: 1; padding: 0;
}
.sdm-head__close:hover { color: #fff; }

/* ── INFO BAND ── */
.sdm-band {
  display: flex; align-items: stretch;
  background: #DEEAF1;
  border-bottom: 1px solid #9DC3E6;
  flex-shrink: 0;
}
.sdm-band__cell  { padding: 8px 16px; display: flex; flex-direction: column; gap: 2px; flex: 1; }
.sdm-band__div   { width: 1px; background: #9DC3E6; }
.sdm-band__lbl   { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: #6081a3; }
.sdm-band__val   { font-size: 12px; font-weight: 600; color: #1F3864; }

/* ── BODY ── */
.sdm-body {
  flex: 1; overflow-y: auto;
  padding: 18px 20px;
  display: flex; flex-direction: column; gap: 16px;
}

/* Loading / error / empty */
.sdm-loading {
  display: flex; align-items: center; gap: 10px;
  color: #666; font-size: 13px; padding: 20px 0;
}
.sdm-spinner {
  width: 18px; height: 18px;
  border: 2px solid #DEEAF1; border-top-color: #1F3864;
  border-radius: 50%;
  animation: spin .9s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.sdm-error {
  background: #FCE4D6; border: 1px solid #E31E24; border-left: 4px solid #E31E24;
  padding: 10px 14px; font-size: 12px; color: #9C0006;
}
.sdm-error__icon { margin-right: 6px; }
.sdm-empty { font-size: 12px; color: #888; padding: 10px 0; }

/* Status row */
.sdm-status-row {
  display: flex; align-items: center; gap: 10px;
}
.sdm-badge {
  font-size: 10px; font-weight: 700; padding: 2px 8px;
  border: 1px solid transparent; text-transform: uppercase; letter-spacing: .4px;
}
.sdm-badge--green { background: #E2EFDA; color: #375623; border-color: #A9D18E; }
.sdm-badge--amber { background: #FFEB9C; color: #9C5700; border-color: #FFCC00; }
.sdm-id { font-size: 11px; color: #aaa; font-family: 'IBM Plex Mono', monospace; }

/* Details table */
.sdm-tbl { width: 100%; border-collapse: collapse; font-size: 12px; }
.sdm-tbl tr { border-bottom: 1px solid #EBF4FF; }
.sdm-tbl tr:last-child { border-bottom: none; }
.sdm-tbl__lbl {
  width: 110px; padding: 7px 0;
  font-size: 11px; font-weight: 600; color: #888;
  vertical-align: top;
}
.sdm-tbl__val { padding: 7px 0; color: #222; }
.mono { font-family: 'IBM Plex Mono', monospace; }
.sdm-na { color: #aaa; font-style: italic; }
.sdm-time-chip {
  display: inline-block; margin-right: 4px;
  background: #DEEAF1; color: #1F3864; border: 1px solid #9DC3E6;
  font-family: 'IBM Plex Mono', monospace; font-size: 11px; font-weight: 700;
  padding: 1px 7px;
}

/* ── SECTION (media) ── */
.sdm-section { }
.sdm-section__head {
  display: flex; align-items: center; gap: 8px;
  background: #DEEAF1; border: 1px solid #9DC3E6;
  padding: 5px 10px; margin-bottom: 0;
}
.sdm-section__title { font-size: 10px; font-weight: 700; color: #1F3864; text-transform: uppercase; letter-spacing: .4px; }
.sdm-section__count { font-size: 10px; color: #6081a3; margin-left: auto; }
.sdm-no-files {
  padding: 10px 12px; font-size: 11px; color: #aaa; font-style: italic;
  border: 1px solid #DEEAF1; border-top: none; background: #F7FBFE;
}
.sdm-file-list { border: 1px solid #DEEAF1; border-top: none; }
.sdm-file-row {
  display: flex; align-items: center; gap: 10px;
  padding: 7px 12px;
  border-bottom: 1px solid #EBF4FF;
}
.sdm-file-row:last-child { border-bottom: none; }
.sdm-file-row:nth-child(even) { background: #F7FBFE; }
.sdm-file-icon { font-size: 16px; flex-shrink: 0; }
.sdm-file-info { flex: 1; min-width: 0; }
.sdm-file-name { font-size: 12px; font-weight: 500; color: #222; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sdm-file-meta { display: flex; align-items: center; gap: 6px; margin-top: 2px; }
.sdm-ext {
  font-family: 'IBM Plex Mono', monospace; font-size: 9px; font-weight: 700;
  background: #DEEAF1; color: #1F3864; border: 1px solid #9DC3E6; padding: 0 4px;
}
.sdm-file-meta span:not(.sdm-ext) { font-size: 10px; color: #aaa; }
.sdm-file-link {
  display: inline-flex; align-items: center; justify-content: center;
  width: 26px; height: 26px; flex-shrink: 0;
  border: 1px solid #BDD7EE; background: #F7FBFE; color: #6081a3;
}
.sdm-file-link:hover { background: #DEEAF1; color: #1F3864; }

/* ── FOOTER ── */
.sdm-footer {
  padding: 12px 20px;
  border-top: 2px solid #DEEAF1;
  background: #F7FBFE;
  display: flex; justify-content: flex-end; gap: 8px;
  flex-shrink: 0;
}
.sdm-btn {
  font-size: 12px; font-weight: 600; padding: 6px 16px;
  border: 1px solid transparent; cursor: pointer; border-radius: 0;
  font-family: inherit;
}
.sdm-btn--close      { background: #DEEAF1; color: #1F3864; border-color: #9DC3E6; }
.sdm-btn--close:hover { background: #c5d9ec; }
.sdm-btn--reschedule { background: #E31E24; color: #fff; border-color: #E31E24; }
.sdm-btn--reschedule:hover { background: #c01820; }

@media (max-width: 600px) {
  .sdm-band { flex-direction: column; }
  .sdm-band__div { width: 100%; height: 1px; }
}
</style>