<!-- components/editor/MediaViewerModal.vue -->
<template>
  <Teleport to="body">
    <div v-if="show" class="mvm-overlay" @click.self="$emit('close')">
      <div class="mvm-panel">

        <!-- HEADER -->
        <div class="mvm-head">
          <div class="mvm-head__left">
            <div class="mvm-head__eyebrow">Media Files</div>
            <div class="mvm-head__title">{{ schedule?.company_name }}</div>
            <div class="mvm-head__sub">
              <span class="mono">Ref #{{ schedule?.advert_id }}</span>
              <span class="h-sep">·</span>
              <span>{{ schedule?.advert_title }}</span>
              <span class="h-sep">·</span>
              <span>{{ fmtDate(schedule?.run_date) }}</span>
            </div>
          </div>
          <button class="mvm-close" @click="$emit('close')">×</button>
        </div>

        <!-- FILE COUNT BAND -->
        <div class="mvm-band">
          <span class="mvm-band__count">
            {{ files.length }} file{{ files.length !== 1 ? 's' : '' }} attached
          </span>
          <button v-if="files.length > 1" class="mvm-band__dl-all" @click="downloadAll">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <path d="M8 2v8M5 7l3 3 3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M2 12h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            Download All
          </button>
        </div>

        <!-- BODY -->
        <div class="mvm-body">

          <!-- Empty state -->
          <div v-if="files.length === 0" class="mvm-empty">
            <div class="mvm-empty__icon">📎</div>
            <div class="mvm-empty__title">No media files</div>
            <div class="mvm-empty__sub">No artwork or files have been attached to this schedule.</div>
          </div>

          <!-- Files grid -->
          <div v-else class="mvm-files">
            <div v-for="f in files" :key="f.id" class="mvm-file">

              <!-- PREVIEW AREA -->
              <div class="mvm-file__preview" @click="openPreview(f)">
                <!-- Image preview -->
                <img
                  v-if="isImage(f)"
                  :src="resolveUrl(f.url)"
                  :alt="f.name"
                  class="mvm-file__img"
                  @error="onImgError($event, f)"
                >
                <!-- Non-image: icon -->
                <div v-else class="mvm-file__icon-wrap">
                  <span class="mvm-file__icon">{{ fileIcon(f) }}</span>
                  <span class="mvm-file__ext">{{ extOf(f) }}</span>
                </div>
                <!-- Hover overlay -->
                <div class="mvm-file__overlay">
                  <span class="mvm-file__overlay-icon">
                    <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
                      <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" stroke-width="1.5"/>
                      <circle cx="8" cy="8" r="2" stroke="currentColor" stroke-width="1.5"/>
                    </svg>
                  </span>
                  <span class="mvm-file__overlay-lbl">View</span>
                </div>
              </div>

              <!-- FILE INFO -->
              <div class="mvm-file__info">
                <div class="mvm-file__name" :title="f.name">{{ f.name }}</div>
                <div class="mvm-file__meta">
                  <span class="ext-chip">{{ extOf(f) }}</span>
                  <span class="mvm-file__size">{{ fmtSize(f.size) }}</span>
                </div>
                <!-- ACTION BUTTONS -->
                <div class="mvm-file__actions">
                  <button class="mvm-btn mvm-btn--view" @click="openPreview(f)">
                    <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                      <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" stroke-width="1.5"/>
                      <circle cx="8" cy="8" r="2" stroke="currentColor" stroke-width="1.5"/>
                    </svg>
                    View
                  </button>
                  <a
                    :href="resolveUrl(f.url)"
                    :download="f.name"
                    target="_blank"
                    class="mvm-btn mvm-btn--dl"
                    @click.stop
                  >
                    <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                      <path d="M8 2v8M5 7l3 3 3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                      <path d="M2 12h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                    </svg>
                    Download
                  </a>
                </div>
              </div>

            </div>
          </div>
        </div>

        <!-- FOOTER -->
        <div class="mvm-foot">
          <div class="mvm-foot__info" v-if="schedule">
            <span class="fc-lbl">Page / Slot:</span>
            <span class="fc-val" :class="schedule.page > 0 ? 'fc-val--set' : 'fc-val--empty'">
              {{ schedule.page > 0 ? schedule.page : 'Not assigned' }}
            </span>
            <span class="fc-sep">|</span>
            <span class="fc-lbl">Status:</span>
            <span class="status-chip" :class="schedule.is_published ? 'status-chip--pub' : 'status-chip--sched'">
              {{ schedule.is_published ? 'Published' : 'Scheduled' }}
            </span>
          </div>
          <button class="mvm-close-btn" @click="$emit('close')">Close</button>
        </div>

      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'
import { useRuntimeConfig } from '#app'

const props = defineProps({
  show:     { type: Boolean, default: false },
  schedule: { type: Object,  default: null  },
})
defineEmits(['close'])

const config     = useRuntimeConfig()
const uploadBase = config.public?.uploadBase || ''

const resolveUrl = (u) => {
  if (!u) return ''
  if (u.startsWith('http') || u.startsWith('//')) return u
  return uploadBase + (u.startsWith('/') ? u : '/' + u)
}

const files = computed(() => props.schedule?.media || [])

const extOf  = (f) => (f.ext || f.name?.split('.').pop() || '').replace('.','').toUpperCase()
const isImage = (f) => {
  const e = extOf(f).toLowerCase()
  return ['jpg','jpeg','png','gif','webp','svg','bmp'].includes(e)
}
const fileIcon = (f) => {
  const e = extOf(f).toLowerCase()
  return { pdf:'📕', psd:'🎨', ai:'🎨', eps:'🎨', mp4:'🎬', mov:'🎬', avi:'🎬', mp3:'🎵', wav:'🎵', doc:'📄', docx:'📄', xls:'📊', xlsx:'📊' }[e] || '📎'
}
const fmtSize = (b) => {
  if (!b) return ''
  if (b < 1024)    return b + ' B'
  if (b < 1048576) return (b/1024).toFixed(1) + ' KB'
  return (b/1048576).toFixed(1) + ' MB'
}
const fmtDate = (s) => {
  if (!s) return ''
  try { return new Date(s + 'T00:00:00').toLocaleDateString('en-UG', { weekday:'short', month:'short', day:'numeric', year:'numeric' }) }
  catch { return s }
}

const openPreview = (f) => {
  const url = resolveUrl(f.url)
  if (url) window.open(url, '_blank')
}

const downloadAll = () => {
  files.value.forEach((f, i) => {
    setTimeout(() => {
      const a = document.createElement('a')
      a.href     = resolveUrl(f.url)
      a.download = f.name || `file-${i+1}`
      a.target   = '_blank'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }, i * 400)
  })
}

const onImgError = (e, f) => {
  // Replace broken image with icon fallback
  e.target.style.display = 'none'
  const parent = e.target.parentElement
  if (parent && !parent.querySelector('.mvm-file__icon-wrap')) {
    const wrap = document.createElement('div')
    wrap.className = 'mvm-file__icon-wrap'
    wrap.innerHTML = `<span class="mvm-file__icon">${fileIcon(f)}</span><span class="mvm-file__ext">${extOf(f)}</span>`
    parent.insertBefore(wrap, parent.firstChild)
  }
}
</script>

<style scoped>
.mvm-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,.72); backdrop-filter: blur(3px);
  display: flex; align-items: center; justify-content: center;
  z-index: 5000; padding: 20px;
  font-family: 'IBM Plex Sans', 'Segoe UI', sans-serif;
}
.mvm-panel {
  background: #fff; width: 100%; max-width: 820px;
  max-height: 90vh; display: flex; flex-direction: column;
  border-top: 4px solid #1F3864;
  box-shadow: 0 24px 64px rgba(0,0,0,.45);
}

/* HEAD */
.mvm-head {
  background: #1F3864; padding: 14px 20px;
  display: flex; justify-content: space-between; align-items: flex-start; flex-shrink: 0;
}
.mvm-head__left    { display: flex; flex-direction: column; gap: 3px; }
.mvm-head__eyebrow { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #5B7FAC; }
.mvm-head__title   { color: #fff; font-size: 16px; font-weight: 700; }
.mvm-head__sub     { color: #9DC3E6; font-size: 11px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.h-sep { opacity: .4; }
.mono  { font-family: 'IBM Plex Mono', monospace; }
.mvm-close { background: none; border: none; color: #9DC3E6; font-size: 28px; cursor: pointer; padding: 0; line-height: 1; }
.mvm-close:hover { color: #fff; }

/* BAND */
.mvm-band {
  display: flex; align-items: center; justify-content: space-between;
  background: #DEEAF1; border-bottom: 1px solid #9DC3E6; padding: 8px 16px; flex-shrink: 0;
}
.mvm-band__count { font-size: 12px; font-weight: 600; color: #1F3864; }
.mvm-band__dl-all {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 11px; font-weight: 600; padding: 4px 12px;
  border: 1px solid #9DC3E6; background: #fff; color: #1F3864; cursor: pointer; font-family: inherit;
}
.mvm-band__dl-all:hover { background: #1F3864; color: #fff; border-color: #1F3864; }

/* BODY */
.mvm-body { flex: 1; overflow-y: auto; padding: 16px; background: #F0F4F8; }

/* EMPTY */
.mvm-empty { text-align: center; padding: 60px 20px; }
.mvm-empty__icon  { font-size: 36px; margin-bottom: 12px; }
.mvm-empty__title { font-size: 15px; font-weight: 700; color: #1F3864; }
.mvm-empty__sub   { font-size: 12px; color: #999; margin-top: 4px; }

/* FILE GRID */
.mvm-files {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}
.mvm-file {
  background: #fff; border: 1px solid #DEEAF1; display: flex; flex-direction: column;
  overflow: hidden;
}

/* PREVIEW */
.mvm-file__preview {
  position: relative; height: 150px; overflow: hidden; cursor: pointer;
  background: #F7FBFE; border-bottom: 1px solid #DEEAF1;
  display: flex; align-items: center; justify-content: center;
}
.mvm-file__img {
  width: 100%; height: 100%; object-fit: contain;
}
.mvm-file__icon-wrap {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
}
.mvm-file__icon { font-size: 40px; line-height: 1; }
.mvm-file__ext  { font-family: 'IBM Plex Mono', monospace; font-size: 10px; font-weight: 700; color: #6081a3; background: #DEEAF1; border: 1px solid #9DC3E6; padding: 1px 6px; }

.mvm-file__overlay {
  position: absolute; inset: 0;
  background: rgba(31,56,100,.7);
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px;
  opacity: 0; transition: opacity .15s;
}
.mvm-file__preview:hover .mvm-file__overlay { opacity: 1; }
.mvm-file__overlay-icon { color: #fff; }
.mvm-file__overlay-lbl  { color: #fff; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; }

/* INFO */
.mvm-file__info { padding: 10px 12px; display: flex; flex-direction: column; gap: 6px; flex: 1; }
.mvm-file__name {
  font-size: 11px; font-weight: 600; color: #1a1a1a;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.mvm-file__meta { display: flex; align-items: center; gap: 6px; }
.ext-chip { font-family: 'IBM Plex Mono', monospace; font-size: 9px; font-weight: 700; background: #DEEAF1; color: #1F3864; border: 1px solid #9DC3E6; padding: 0 4px; }
.mvm-file__size { font-size: 10px; color: #bbb; }

/* ACTIONS */
.mvm-file__actions { display: flex; gap: 6px; margin-top: auto; }
.mvm-btn {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 11px; font-weight: 600; padding: 5px 10px; border: 1px solid transparent;
  cursor: pointer; text-decoration: none; font-family: inherit;
}
.mvm-btn--view {
  background: #DEEAF1; color: #1F3864; border-color: #9DC3E6; flex: 1; justify-content: center;
}
.mvm-btn--view:hover { background: #1F3864; color: #fff; border-color: #1F3864; }
.mvm-btn--dl {
  background: #E2EFDA; color: #375623; border-color: #A9D18E; flex: 1; justify-content: center;
}
.mvm-btn--dl:hover { background: #375623; color: #fff; border-color: #375623; }

/* FOOTER */
.mvm-foot {
  padding: 12px 20px; border-top: 2px solid #DEEAF1; background: #F7FBFE;
  display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; gap: 12px;
}
.mvm-foot__info { display: flex; align-items: center; gap: 8px; font-size: 12px; flex-wrap: wrap; }
.fc-lbl  { color: #888; font-weight: 500; }
.fc-val  { font-weight: 700; font-family: 'IBM Plex Mono', monospace; }
.fc-val--set   { color: #375623; }
.fc-val--empty { color: #9C5700; }
.fc-sep  { color: #BDD7EE; }
.status-chip { font-size: 9px; font-weight: 700; padding: 2px 7px; border: 1px solid transparent; text-transform: uppercase; letter-spacing: .4px; }
.status-chip--pub   { background: #E2EFDA; color: #375623; border-color: #A9D18E; }
.status-chip--sched { background: #FFEB9C; color: #9C5700; border-color: #FFCC00; }
.mvm-close-btn {
  font-size: 12px; font-weight: 600; padding: 7px 18px;
  border: 1px solid #9DC3E6; background: #DEEAF1; color: #1F3864; cursor: pointer; font-family: inherit;
}
.mvm-close-btn:hover { background: #c5d9ec; }

@media (max-width: 580px) {
  .mvm-files { grid-template-columns: 1fr 1fr; }
  .mvm-foot  { flex-direction: column; align-items: stretch; }
  .mvm-close-btn { width: 100%; text-align: center; }
}
</style>