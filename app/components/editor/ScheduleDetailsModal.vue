<!-- components/editor/ScheduleDetailsModal.vue -->
<template>
  <Teleport to="body">
    <div v-if="show" class="sdm-overlay" @click.self="handleClose">
      <div class="sdm-modal">

        <!-- Header -->
        <div class="sdm-header">
          <div class="sdm-header__left">
            <span class="sdm-header__label">Schedule Details</span>
            <span class="sdm-ref">ADV-{{ schedule.advert_id }}</span>
          </div>
          <div class="sdm-header__right">
            <span class="sdm-status" :class="statusClass">
              {{ schedule.is_published ? 'Published' : schedule.page > 0 ? 'Page Assigned' : 'Scheduled' }}
            </span>
            <button class="sdm-close" @click="handleClose" aria-label="Close">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        <!-- Body -->
        <div class="sdm-body">

          <!-- Controls strip -->
          <div class="sdm-controls">

            <!-- Date -->
            <div class="sdm-ctrl-group">
              <span class="sdm-ctrl-label">Run Date</span>
              <div v-if="editingField === 'run_date'" class="ctrl-edit-wrap">
                <input type="date" class="ctrl-inp" v-model="localDate"
                       @keydown.escape="cancelEdit" @blur="commitDate" />
              </div>
              <div v-else class="ctrl-val ctrl-val--clickable" @click="startEdit('run_date')">
                <div>
                  <div class="ctrl-val__main">{{ fmtDateFull(localDate) }}</div>
                  <div class="ctrl-val__sub">{{ fmtWeekday(localDate) }}</div>
                </div>
                <svg class="ctrl-pencil" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </div>
              <span v-if="dirty.run_date" class="dirty-dot"></span>
            </div>

            <!-- Page -->
            <div class="sdm-ctrl-group sdm-ctrl-group--page">
              <span class="sdm-ctrl-label">Page / Slot</span>
              <div v-if="editingField === 'page'" class="ctrl-edit-wrap">
                <input type="number" class="ctrl-inp ctrl-inp--num" v-model.number="localPage"
                       min="0"
                       @keydown.enter="commitPage"
                       @keydown.escape="cancelEdit"
                       @blur="commitPage" />
              </div>
              <div v-else class="ctrl-val ctrl-val--clickable" @click="startEdit('page')">
                <span class="page-display" :class="{ 'page-display--set': localPage > 0 }">
                  {{ localPage || '—' }}
                </span>
                <svg class="ctrl-pencil" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </div>
              <span v-if="dirty.page" class="dirty-dot"></span>
            </div>

            <!-- Time slots (only for non-print) -->
            <div v-if="hasTime" class="sdm-ctrl-group sdm-ctrl-group--time" style="position:relative">
              <span class="sdm-ctrl-label">Time Slots</span>
              <div class="time-editor">
                <div class="time-chips">
                  <span v-for="(t, i) in localTimes" :key="t" class="t-chip">
                    {{ t }}
                    <button class="chip-x" @click="removeTime(i)">×</button>
                  </span>
                  <span v-if="!localTimes.length" class="t-empty">No times</span>
                </div>
                <button class="time-add-btn" @click="showTimePicker = !showTimePicker">
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Add
                </button>
                <span v-if="dirty.run_time" class="dirty-dot"></span>
              </div>
              <!-- Time picker -->
              <div v-if="showTimePicker" class="time-picker" @click.stop>
                <div class="tp-head">
                  Pick time slots
                  <button class="tp-close" @click="showTimePicker = false">×</button>
                </div>
                <div class="tp-grid">
                  <label v-for="slot in TIME_SLOTS" :key="slot" class="tp-opt"
                         :class="{ 'tp-opt--on': localTimes.includes(slot) }">
                    <input type="checkbox" :checked="localTimes.includes(slot)" @change="toggleSlot(slot)" />
                    {{ slot }}
                  </label>
                </div>
                <div class="tp-footer">
                  <button class="sdm-btn sdm-btn--sm sdm-btn--navy" @click="showTimePicker = false">Done</button>
                </div>
              </div>
            </div>

            <!-- Publish toggle -->
            <div class="sdm-ctrl-group sdm-ctrl-group--pub">
              <span class="sdm-ctrl-label">Publish</span>
              <label class="tog">
                <input type="checkbox" v-model="localPublished" @change="onTogglePublish" />
                <span class="tog-track"><span class="tog-knob"></span></span>
              </label>
              <span class="tog-lbl" :class="{ 'tog-lbl--on': localPublished }">
                {{ localPublished ? 'Published' : 'Draft' }}
              </span>
            </div>

          </div><!-- /sdm-controls -->

          <!-- Info grid -->
          <div class="sdm-grid">
            <section class="sdm-section">
              <div class="sdm-sh">Advert</div>
              <table class="sdm-dtbl">
                <tbody>
                  <tr><td class="dk">Title</td><td class="dv">{{ schedule.advert_title }}</td></tr>
                  <tr><td class="dk">Ad Size</td><td class="dv">{{ schedule.ad_size }}</td></tr>
                  <tr><td class="dk">Ad Type</td><td class="dv">{{ fmtAdType(schedule.ad_type) }}</td></tr>
                  <tr v-if="schedule.start_date"><td class="dk">Period</td><td class="dv">{{ fmtDateShort(schedule.start_date) }} — {{ fmtDateShort(schedule.end_date) }}</td></tr>
                  <tr v-if="schedule.frequency"><td class="dk">Frequency</td><td class="dv">{{ schedule.frequency }}×</td></tr>
                </tbody>
              </table>
            </section>
            <section class="sdm-section">
              <div class="sdm-sh">Client</div>
              <table class="sdm-dtbl">
                <tbody>
                  <tr><td class="dk">Company</td><td class="dv dv--b">{{ schedule.company_name }}</td></tr>
                  <tr><td class="dk">Contact</td><td class="dv">{{ schedule.contact_person || '—' }}</td></tr>
                  <tr><td class="dk">Email</td><td class="dv">{{ schedule.contact_email || '—' }}</td></tr>
                  <tr><td class="dk">Phone</td><td class="dv">{{ schedule.contact_number || '—' }}</td></tr>
                </tbody>
              </table>
            </section>
          </div>

          <!-- Media -->
          <section v-if="schedule.media?.length" class="sdm-section sdm-section--full sdm-section--media">
            <div class="sdm-sh">
              Attached Files
              <span class="media-badge">{{ schedule.media.length }}</span>
            </div>
            <div class="media-grid">
              <div v-for="(m, i) in schedule.media" :key="i" class="mc" @click="openMedia(m)">
                <div class="mc__thumb">
                  <img :src="mediaThumbnail(m)" :alt="m.name" @error="$event.target.style.display='none'" />
                  <div class="mc__ext">{{ (m.ext || '').replace('.','').toUpperCase() }}</div>
                </div>
                <div class="mc__info">
                  <div class="mc__name" :title="m.name">{{ m.name }}</div>
                  <div class="mc__meta">{{ fmtSize(m.size) }}</div>
                </div>
                <div class="mc__ov">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                </div>
              </div>
            </div>
          </section>

          <!-- Instructions -->
          <section v-if="schedule.special_instructions" class="sdm-section sdm-section--full">
            <div class="sdm-sh">Special Instructions</div>
            <div class="instructions">{{ schedule.special_instructions }}</div>
          </section>

        </div><!-- /sdm-body -->

        <!-- Footer -->
        <div class="sdm-footer">
          <div class="sdm-footer__l">
            <span v-if="hasDirty" class="dirty-notice">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFB300" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              Unsaved changes
            </span>
          </div>
          <div class="sdm-footer__r">
            <button class="sdm-btn sdm-btn--ghost" @click="handleClose">Close</button>
            <button v-if="hasDirty" class="sdm-btn sdm-btn--discard" @click="discardChanges">Discard</button>
            <button v-if="hasDirty" class="sdm-btn sdm-btn--save" @click="saveChanges" :disabled="saving">
              {{ saving ? 'Saving…' : 'Save Changes' }}
            </button>
          </div>
        </div>

      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRuntimeConfig } from '#imports'

const config = useRuntimeConfig()
const uploadBase = config.public.uploadBase || ''

const TIME_SLOTS = [
  '6:00 AM','7:00 AM','8:00 AM','9:00 AM','10:00 AM','11:00 AM',
  '12:00 PM','1:00 PM','2:00 PM','3:00 PM','4:00 PM','5:00 PM',
  '6:00 PM','7:00 PM','8:00 PM','9:00 PM','10:00 PM','11:00 PM'
]

const props = defineProps({
  schedule: { type: Object, required: true },
  show:     { type: Boolean, default: false }
})
const emit = defineEmits(['close', 'save-changes', 'publish-toggle'])

const localDate      = ref('')
const localPage      = ref(0)
const localTimes     = ref([])
const localPublished = ref(false)
const dirty          = ref({ run_date: false, page: false, run_time: false })
const saving         = ref(false)
const editingField   = ref(null)
const showTimePicker = ref(false)

const hasTime  = computed(() => props.schedule.run_time !== null && props.schedule.run_time !== undefined)
const hasDirty = computed(() => dirty.value.run_date || dirty.value.page || dirty.value.run_time)

watch(() => [props.show, props.schedule], ([show]) => {
  if (!show) return
  localDate.value      = (props.schedule.run_date || '').split('T')[0]
  localPage.value      = props.schedule.page || 0
  localTimes.value     = [...(props.schedule.run_time || [])]
  localPublished.value = props.schedule.is_published || false
  dirty.value          = { run_date: false, page: false, run_time: false }
  editingField.value   = null
  showTimePicker.value = false
}, { immediate: true })

const startEdit  = (f) => { showTimePicker.value = false; editingField.value = f }
const cancelEdit = () => { editingField.value = null }
const commitDate = () => {
  dirty.value.run_date = localDate.value !== (props.schedule.run_date || '').split('T')[0]
  editingField.value = null
}
const commitPage = () => {
  dirty.value.page = localPage.value !== (props.schedule.page || 0)
  editingField.value = null
}
const toggleSlot = (slot) => {
  const i = localTimes.value.indexOf(slot)
  if (i >= 0) localTimes.value.splice(i, 1)
  else { localTimes.value.push(slot); localTimes.value.sort((a, b) => TIME_SLOTS.indexOf(a) - TIME_SLOTS.indexOf(b)) }
  dirty.value.run_time = JSON.stringify(localTimes.value) !== JSON.stringify(props.schedule.run_time || [])
}
const removeTime = (i) => {
  localTimes.value.splice(i, 1)
  dirty.value.run_time = JSON.stringify(localTimes.value) !== JSON.stringify(props.schedule.run_time || [])
}
const onTogglePublish = () => emit('publish-toggle', props.schedule.schedule_id, localPublished.value)

const saveChanges = async () => {
  saving.value = true
  try {
    const changes = { scheduleId: props.schedule.schedule_id }
    if (dirty.value.run_date) changes.run_date = localDate.value
    if (dirty.value.page)     changes.page     = localPage.value
    if (dirty.value.run_time) changes.run_time  = localTimes.value
    emit('save-changes', changes)
    dirty.value = { run_date: false, page: false, run_time: false }
  } finally { saving.value = false }
}
const discardChanges = () => {
  localDate.value  = (props.schedule.run_date || '').split('T')[0]
  localPage.value  = props.schedule.page || 0
  localTimes.value = [...(props.schedule.run_time || [])]
  dirty.value = { run_date: false, page: false, run_time: false }
}
const handleClose = () => emit('close')

const fmtDateFull  = (d) => { if (!d) return '—'; return new Date(d+'T00:00:00').toLocaleDateString('en-UG',{day:'numeric',month:'long',year:'numeric'}) }
const fmtDateShort = (d) => { if (!d) return '—'; return new Date(d+'T00:00:00').toLocaleDateString('en-UG',{day:'numeric',month:'short',year:'numeric'}) }
const fmtWeekday   = (d) => { if (!d) return ''; return new Date(d+'T00:00:00').toLocaleDateString('en-UG',{weekday:'long'}) }
const fmtAdType    = (t) => ({full_color:'Full Colour',black_white:'B & W'}[t] || t || '—')
const fmtSize      = (b) => { if (!b) return ''; const u=['B','KB','MB','GB']; let v=b,i=0; while(v>=1024&&i<3){v/=1024;i++} return `${Math.round(v)} ${u[i]}` }

const statusClass = computed(() => {
  if (props.schedule.is_published) return 'sdm-status--published'
  if ((props.schedule.page||0) > 0) return 'sdm-status--assigned'
  return 'sdm-status--scheduled'
})

const mediaThumbnail = (m) => {
  const raw = m.formats?.thumbnail?.url || m.formats?.small?.url || m.url || ''
  if (!raw || raw.startsWith('http') || raw.startsWith('//')) return raw
  return `${uploadBase}/${raw.replace(/^\//,'')}`
}
const openMedia = (m) => {
  const raw = m.url || m.formats?.large?.url || ''
  if (!raw) return
  window.open(raw.startsWith('http') ? raw : `${uploadBase}/${raw.replace(/^\//,'')}`, '_blank')
}
</script>

<style scoped>
.sdm-overlay{position:fixed;inset:0;background:rgba(10,20,40,.55);backdrop-filter:blur(3px);display:flex;align-items:center;justify-content:center;z-index:2000;padding:16px;}
.sdm-modal{background:#fff;border-radius:2px;width:100%;max-width:780px;max-height:90vh;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,.25);font-family:'IBM Plex Sans','Segoe UI',sans-serif;font-size:13px;animation:sdm-in .18s ease-out;}
@keyframes sdm-in{from{opacity:0;transform:translateY(-10px) scale(.98)}to{opacity:1;transform:none}}
.sdm-header{background:#1F3864;padding:12px 16px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;border-bottom:2px solid #E31E24;}
.sdm-header__left{display:flex;align-items:center;gap:10px;}
.sdm-header__label{font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#9DC3E6;}
.sdm-ref{font-family:'IBM Plex Mono',monospace;font-size:13px;font-weight:700;color:#fff;background:#162d52;border:1px solid #4a6fa5;padding:2px 8px;}
.sdm-header__right{display:flex;align-items:center;gap:10px;}
.sdm-status{font-size:10px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;padding:3px 9px;border-radius:1px;}
.sdm-status--scheduled{background:#FFF3CD;color:#856404;}
.sdm-status--assigned{background:#D1ECF1;color:#0C5460;}
.sdm-status--published{background:#D4EDDA;color:#155724;}
.sdm-close{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.1);color:#9DC3E6;cursor:pointer;padding:4px;border-radius:1px;display:flex;align-items:center;transition:background .12s,color .12s;}
.sdm-close:hover{background:rgba(255,255,255,.15);color:#fff;}
.sdm-body{flex:1;overflow-y:auto;}
/* Controls */
.sdm-controls{display:flex;flex-wrap:wrap;border-bottom:1px solid #BDD7EE;background:#F2F6FB;}
.sdm-ctrl-group{padding:10px 14px;border-right:1px solid #BDD7EE;min-width:130px;position:relative;flex-shrink:0;}
.sdm-ctrl-group--time{flex:1;min-width:200px;border-right:1px solid #BDD7EE;}
.sdm-ctrl-group--pub{min-width:auto;display:flex;align-items:center;gap:8px;border-right:none;padding:10px 14px;}
.sdm-ctrl-label{font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#888;margin-bottom:5px;display:block;}
.sdm-ctrl-group--pub .sdm-ctrl-label{margin-bottom:0;}
.ctrl-val{display:flex;align-items:center;gap:6px;}
.ctrl-val--clickable{cursor:pointer;}
.ctrl-val--clickable:hover .ctrl-pencil{opacity:1;}
.ctrl-pencil{opacity:0;color:#9DC3E6;transition:opacity .15s;flex-shrink:0;}
.ctrl-val__main{font-size:13px;font-weight:600;color:#1F3864;}
.ctrl-val__sub{font-size:10px;color:#888;}
.ctrl-edit-wrap{display:flex;}
.ctrl-inp{font-family:'IBM Plex Mono',monospace;font-size:12px;border:1px solid #4a6fa5;padding:3px 7px;border-radius:1px;outline:none;background:#fff;box-shadow:0 0 0 2px rgba(31,56,100,.12);}
.ctrl-inp--num{width:70px;text-align:center;}
.dirty-dot{position:absolute;top:7px;right:7px;width:7px;height:7px;background:#FFB300;border-radius:50%;}
.page-display{font-family:'IBM Plex Mono',monospace;font-size:22px;font-weight:700;color:#ccc;}
.page-display--set{color:#1F3864;background:#DEEAF1;border:1px solid #9DC3E6;padding:2px 14px;font-size:20px;}
/* Time editor */
.time-editor{display:flex;flex-wrap:wrap;align-items:center;gap:6px;position:relative;}
.time-chips{display:flex;flex-wrap:wrap;gap:3px;}
.t-chip{display:inline-flex;align-items:center;gap:4px;font-family:'IBM Plex Mono',monospace;font-size:10px;background:#DEEAF1;color:#1F3864;border:1px solid #9DC3E6;padding:2px 7px;border-radius:1px;}
.chip-x{background:none;border:none;cursor:pointer;color:#888;font-size:14px;line-height:1;padding:0;}
.chip-x:hover{color:#E31E24;}
.t-empty{font-size:12px;color:#aaa;}
.time-add-btn{display:inline-flex;align-items:center;gap:3px;background:none;border:1px dashed #9DC3E6;color:#1F3864;font-size:11px;padding:2px 8px;cursor:pointer;border-radius:1px;}
.time-add-btn:hover{background:#DEEAF1;}
/* Time picker */
.time-picker{position:absolute;top:100%;left:0;z-index:9999;background:#fff;border:1px solid #BDD7EE;box-shadow:0 4px 16px rgba(0,0,0,.12);min-width:280px;border-radius:1px;margin-top:4px;}
.tp-head{background:#1F3864;color:#fff;padding:7px 10px;font-size:11px;font-weight:600;letter-spacing:.04em;display:flex;justify-content:space-between;align-items:center;}
.tp-close{background:none;border:none;color:#9DC3E6;font-size:16px;cursor:pointer;padding:0;}
.tp-close:hover{color:#fff;}
.tp-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:1px;padding:8px;background:#F2F6FB;}
.tp-opt{display:flex;align-items:center;gap:5px;padding:4px 6px;background:#fff;border:1px solid #F2F6FB;cursor:pointer;font-size:11px;font-family:'IBM Plex Mono',monospace;border-radius:1px;transition:background .1s;}
.tp-opt:hover,.tp-opt--on{background:#DEEAF1;border-color:#9DC3E6;}
.tp-footer{padding:6px 8px;border-top:1px solid #BDD7EE;display:flex;justify-content:flex-end;}
/* Toggle */
.tog{position:relative;display:inline-block;width:36px;height:20px;cursor:pointer;flex-shrink:0;}
.tog input{opacity:0;width:0;height:0;}
.tog-track{position:absolute;inset:0;background:#ccc;border-radius:20px;transition:background .2s;}
.tog input:checked+.tog-track{background:#28a745;}
.tog-knob{position:absolute;top:2px;left:2px;width:16px;height:16px;background:#fff;border-radius:50%;transition:transform .2s;box-shadow:0 1px 3px rgba(0,0,0,.2);}
.tog input:checked+.tog-track .tog-knob{transform:translateX(16px);}
.tog-lbl{font-size:12px;color:#888;}
.tog-lbl--on{color:#28a745;font-weight:600;}
/* Grid */
.sdm-grid{display:grid;grid-template-columns:1fr 1fr;border-bottom:1px solid #E8EEF4;}
.sdm-section{padding:14px 16px;border-right:1px solid #E8EEF4;}
.sdm-section:last-child{border-right:none;}
.sdm-section--full{grid-column:1/-1;border-right:none;border-top:1px solid #E8EEF4;}
.sdm-section--media{padding:14px 16px;}
.sdm-sh{font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#888;padding-bottom:8px;margin-bottom:8px;border-bottom:1px solid #E8EEF4;display:flex;align-items:center;gap:6px;}
.media-badge{background:#1F3864;color:#fff;font-family:'IBM Plex Mono',monospace;font-size:10px;padding:0 5px;border-radius:1px;}
/* Detail table */
.sdm-dtbl{width:100%;border-collapse:collapse;}
.sdm-dtbl tr{border-bottom:1px solid #F0F4F9;}
.sdm-dtbl tr:last-child{border-bottom:none;}
.dk{padding:5px 0;font-size:11px;color:#888;font-weight:500;white-space:nowrap;width:80px;vertical-align:top;}
.dv{padding:5px 0 5px 8px;font-size:12px;color:#333;}
.dv--b{font-weight:600;color:#1F3864;}
/* Media grid */
.media-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:8px;}
.mc{border:1px solid #BDD7EE;border-radius:1px;overflow:hidden;cursor:pointer;position:relative;transition:box-shadow .15s,transform .15s;}
.mc:hover{box-shadow:0 4px 12px rgba(0,0,0,.12);transform:translateY(-1px);}
.mc__thumb{height:64px;background:#F2F6FB;display:flex;align-items:center;justify-content:center;overflow:hidden;position:relative;}
.mc__thumb img{width:100%;height:100%;object-fit:cover;}
.mc__ext{position:absolute;bottom:3px;right:3px;background:rgba(31,56,100,.8);color:#fff;font-family:'IBM Plex Mono',monospace;font-size:8px;font-weight:700;padding:1px 4px;}
.mc__info{padding:5px 6px;}
.mc__name{font-size:10px;color:#333;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.mc__meta{font-size:10px;color:#999;margin-top:1px;}
.mc__ov{position:absolute;inset:0;background:rgba(31,56,100,.55);display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .15s;}
.mc:hover .mc__ov{opacity:1;}
/* Instructions */
.instructions{background:#F8FAFD;border-left:3px solid #1F3864;padding:10px 12px;font-size:12px;line-height:1.6;color:#444;}
/* Footer */
.sdm-footer{padding:10px 16px;border-top:1px solid #E8EEF4;background:#F8FAFD;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;}
.sdm-footer__l{display:flex;align-items:center;}
.sdm-footer__r{display:flex;align-items:center;gap:8px;}
.dirty-notice{display:flex;align-items:center;gap:5px;font-size:11px;color:#856404;}
/* Buttons */
.sdm-btn{display:inline-flex;align-items:center;gap:5px;padding:5px 14px;font-size:12px;font-family:inherit;font-weight:500;border:1px solid transparent;cursor:pointer;border-radius:1px;transition:background .12s,color .12s;}
.sdm-btn--ghost{background:#fff;border-color:#BDD7EE;color:#555;}
.sdm-btn--ghost:hover{background:#F2F6FB;}
.sdm-btn--discard{background:#fff;border-color:#ffc107;color:#856404;}
.sdm-btn--discard:hover{background:#FFF8DC;}
.sdm-btn--save{background:#1F3864;color:#fff;border-color:#1F3864;font-weight:600;}
.sdm-btn--save:hover:not(:disabled){background:#162d52;}
.sdm-btn--save:disabled{opacity:.6;cursor:not-allowed;}
.sdm-btn--navy{background:#1F3864;color:#fff;}
.sdm-btn--navy:hover{background:#162d52;}
.sdm-btn--sm{padding:3px 9px;font-size:11px;}
</style>