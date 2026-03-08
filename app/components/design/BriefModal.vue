<!--components/design/BriefModal.vue-->
<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="brief-modal">

      <!-- ── HEADER ── -->
      <div class="brief-modal__head">
        <div class="brief-modal__head-left">
          <div class="brief-modal__title">Creative Brief</div>
          <div class="brief-modal__ref">{{ advert.reference }}</div>
        </div>
        <button class="brief-modal__close" @click="$emit('close')">×</button>
      </div>

      <!-- ── ADVERT INFO TABLE ── -->
      <div class="brief-modal__info-band">
        <table class="info-tbl">
          <tbody>
            <tr>
              <td class="info-tbl__lbl">Reference</td>
              <td class="info-tbl__val info-tbl__val--mono">{{ advert.reference }}</td>
              <td class="info-tbl__lbl">Client</td>
              <td class="info-tbl__val">{{ advert.clientName }}</td>
            </tr>
            <tr>
              <td class="info-tbl__lbl">Advert Title</td>
              <td class="info-tbl__val" colspan="3">{{ advert.advertTitle }}</td>
            </tr>
            <tr>
              <td class="info-tbl__lbl">Platform</td>
              <td class="info-tbl__val">
                <span class="plat-chip">{{ advert.platform }}</span>
              </td>
              <td class="info-tbl__lbl">Ad Type</td>
              <td class="info-tbl__val">{{ advert.adType || '—' }}</td>
            </tr>
            <tr>
              <td class="info-tbl__lbl">Ad Size</td>
              <td class="info-tbl__val">{{ advert.adSize || '—' }}</td>
              <td class="info-tbl__lbl">Duration</td>
              <td class="info-tbl__val info-tbl__val--mono">{{ formatDate(advert.startDate) }} – {{ formatDate(advert.endDate) }}</td>
            </tr>
            <tr v-if="advert.publishingDates && advert.publishingDates.length > 0">
              <td class="info-tbl__lbl">Publishing Dates</td>
              <td class="info-tbl__val" colspan="3">
                <div class="pub-dates-cell">
                  <span
                    v-for="d in advert.publishingDates"
                    :key="d"
                    class="pub-chip"
                    :class="{ 'pub-chip--today': d === todayStr, 'pub-chip--past': d < todayStr }">
                    {{ fmtShortDate(d) }}
                  </span>
                  <span class="pub-total">{{ advert.publishingDates.length }} publishing day{{ advert.publishingDates.length !== 1 ? 's' : '' }}</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ── BODY ── -->
      <div class="brief-modal__body">

        <!-- Creative Brief Section -->
        <div class="xl-section">
          <div class="xl-section__head">
            <span class="xl-section__num">01</span>
            <span class="xl-section__title">Special Instructions / Creative Brief</span>
          </div>
          <div class="xl-section__body">
            <div v-if="advert.specialInstructions" class="brief-content">{{ advert.specialInstructions }}</div>
            <div v-else class="brief-empty">
              <span class="brief-empty__icon">&#128203;</span>
              <span>No special instructions provided for this advert.</span>
            </div>
          </div>
        </div>

        <!-- Reference Materials -->
        <div v-if="advert.files && advert.files.length > 0" class="xl-section">
          <div class="xl-section__head">
            <span class="xl-section__num">02</span>
            <span class="xl-section__title">Reference Materials</span>
            <span class="xl-section__count">{{ advert.files.length }} file(s)</span>
          </div>
          <div class="xl-section__body" style="padding:0;">
            <table class="xl-tbl">
              <thead>
                <tr>
                  <th>File</th>
                  <th>Type</th>
                  <th>Size</th>
                  <th>Uploaded</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="file in advert.files" :key="file.id" class="xl-row">
                  <td>
                    <div class="file-name-cell">
                      <span class="file-icon">{{ getFileIcon(file.mime) }}</span>
                      <span class="file-name">{{ file.name }}</span>
                    </div>
                  </td>
                  <td><span class="type-chip">{{ getMimeLabel(file.mime) }}</span></td>
                  <td class="num-cell">{{ formatFileSize(file.size) }}</td>
                  <td class="num-cell">{{ formatDate(file.createdAt) }}</td>
                  <td>
                    <div class="act-group">
                      <a :href="resolveUrl(file.url)" target="_blank" class="act-btn act-btn--view">&#128065; View</a>
                      <a :href="resolveUrl(file.url)" :download="file.name" class="act-btn act-btn--dl">&#8659; DL</a>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>

      <!-- ── FOOTER ── -->
      <div class="brief-modal__foot">
        <button class="act-btn act-btn--close" @click="$emit('close')">Close</button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { useRuntimeConfig } from '#app'
const { public: { uploadBase = '' } } = useRuntimeConfig()
const resolveUrl = (url) => {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  return `${uploadBase}${url}`
}

const props = defineProps({
  advert: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close'])

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-UG', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  } catch (error) {
    return dateString
  }
}

const formatFileSize = (bytes) => {
  if (!bytes) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

const getFileIcon = (mimeType) => {
  if (!mimeType) return '📄'
  
  if (mimeType.startsWith('image/')) return '🖼️'
  if (mimeType.startsWith('video/')) return '🎥'
  if (mimeType.startsWith('audio/')) return '🎵'
  if (mimeType.includes('pdf')) return '📕'
  if (mimeType.includes('word') || mimeType.includes('document')) return '📝'
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return '📊'
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return '📽️'
  if (mimeType.includes('zip') || mimeType.includes('rar')) return '🗜️'
  
  return '📄'
}

const getMimeLabel = (mimeType) => {
  if (!mimeType) return 'File'
  if (mimeType.startsWith('image/')) return mimeType.split('/')[1].toUpperCase()
  if (mimeType.startsWith('video/')) return mimeType.split('/')[1].toUpperCase()
  if (mimeType.includes('pdf')) return 'PDF'
  if (mimeType.includes('word')) return 'DOCX'
  if (mimeType.includes('sheet')) return 'XLSX'
  return mimeType.split('/').pop().toUpperCase().slice(0,8)
}

// Publishing dates helpers
const todayStr = new Date().toISOString().split('T')[0]

const fmtShortDate = (s) => {
  if (!s) return '—'
  try { return new Date(s + 'T00:00:00').toLocaleDateString('en-UG', { month: 'short', day: 'numeric' }) }
  catch { return s }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,.72);
  backdrop-filter: blur(3px);
  display: flex; align-items: center; justify-content: center;
  z-index: 4000; padding: 20px;
}

/* ── MODAL SHELL ── */
.brief-modal {
  background: #fff;
  width: 100%; max-width: 720px;
  max-height: 90vh;
  display: flex; flex-direction: column;
  border-top: 4px solid #1F3864;
  font-family: 'IBM Plex Sans', 'Segoe UI', sans-serif;
  font-size: 13px;
}

/* ── HEADER ── */
.brief-modal__head {
  background: #1F3864;
  padding: 14px 20px;
  display: flex; justify-content: space-between; align-items: flex-start;
  flex-shrink: 0;
}
.brief-modal__head-left { display: flex; flex-direction: column; gap: 2px; }
.brief-modal__title { color: #fff; font-size: 15px; font-weight: 700; }
.brief-modal__ref   { color: #9DC3E6; font-size: 11px; font-family: 'IBM Plex Mono', monospace; }
.brief-modal__close {
  background: none; border: none; color: #9DC3E6;
  font-size: 24px; cursor: pointer; line-height: 1; padding: 0;
}
.brief-modal__close:hover { color: #fff; }

/* ── INFO BAND (two-col table) ── */
.brief-modal__info-band {
  background: #DEEAF1;
  border-bottom: 2px solid #9DC3E6;
  flex-shrink: 0;
}
.info-tbl { width: 100%; border-collapse: collapse; }
.info-tbl tr:not(:last-child) td { border-bottom: 1px solid #c8dcea; }
.info-tbl__lbl {
  background: #DEEAF1;
  color: #6081a3;
  font-size: 10px; font-weight: 700;
  text-transform: uppercase; letter-spacing: .4px;
  padding: 8px 14px;
  border-right: 1px solid #9DC3E6;
  white-space: nowrap;
  width: 110px;
}
.info-tbl__val {
  padding: 8px 14px;
  font-size: 12px; font-weight: 600; color: #1F3864;
  border-right: 1px solid #c8dcea;
}
.info-tbl__val:last-child { border-right: none; }
.info-tbl__val--mono { font-family: 'IBM Plex Mono', monospace; }
.plat-chip {
  display: inline-block;
  background: #1F3864; color: #fff;
  font-size: 10px; font-weight: 700;
  padding: 1px 8px;
}

/* ── BODY ── */
.brief-modal__body { flex: 1; overflow-y: auto; }

/* ── SECTIONS ── */
.xl-section { border-bottom: 1px solid #DEEAF1; }
.xl-section:last-child { border-bottom: none; }
.xl-section__head {
  background: #F7FBFE;
  border-bottom: 1px solid #DEEAF1;
  padding: 8px 20px;
  display: flex; align-items: center; gap: 10px;
}
.xl-section__num {
  background: #1F3864; color: #fff;
  font-size: 10px; font-weight: 700;
  padding: 1px 6px;
  font-family: 'IBM Plex Mono', monospace;
}
.xl-section__title { font-size: 12px; font-weight: 700; color: #1F3864; text-transform: uppercase; letter-spacing: .4px; }
.xl-section__count { font-size: 11px; color: #888; margin-left: auto; }
.xl-section__body  { padding: 16px 20px; }

/* ── BRIEF CONTENT ── */
.brief-content {
  background: #fff;
  border: 1px solid #BDD7EE;
  padding: 14px 16px;
  font-size: 13px; line-height: 1.8; color: #333;
  white-space: pre-wrap;
  border-left: 3px solid #1F3864;
}
.brief-empty {
  background: #DEEAF1;
  border: 1px solid #9DC3E6;
  padding: 14px 16px;
  font-size: 12px; color: #6081a3;
  display: flex; align-items: center; gap: 8px;
  font-style: italic;
}
.brief-empty__icon { font-size: 16px; }

/* ── FILES TABLE ── */
.xl-tbl { width: 100%; border-collapse: collapse; font-size: 12px; }
.xl-tbl thead tr { background: #DEEAF1; }
.xl-tbl thead th {
  color: #1F3864; font-weight: 600; font-size: 10px;
  text-transform: uppercase; letter-spacing: .4px;
  padding: 7px 12px;
  border-bottom: 2px solid #9DC3E6;
  border-right: 1px solid #BDD7EE;
  text-align: left; white-space: nowrap;
}
.xl-tbl thead th:last-child { border-right: none; }
.xl-tbl tbody tr.xl-row:nth-child(even) { background: #F7FBFE; }
.xl-tbl tbody tr.xl-row:hover { background: #EBF4FF; }
.xl-tbl tbody td {
  padding: 8px 12px;
  border-bottom: 1px solid #DEEAF1;
  border-right: 1px solid #EBF4FF;
  vertical-align: middle;
}
.xl-tbl tbody td:last-child { border-right: none; }

.file-name-cell { display: flex; align-items: center; gap: 8px; }
.file-icon { font-size: 16px; flex-shrink: 0; }
.file-name { font-weight: 500; color: #333; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 200px; }
.type-chip {
  display: inline-block;
  background: #DEEAF1; color: #1F3864;
  border: 1px solid #9DC3E6;
  font-size: 9px; font-weight: 700;
  padding: 1px 6px;
}
.num-cell { font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: #555; }

/* ── ACTION BUTTONS ── */
.act-group { display: flex; gap: 4px; }
.act-btn {
  display: inline-block;
  font-size: 11px; font-weight: 600;
  padding: 4px 9px;
  border: 1px solid transparent;
  cursor: pointer; border-radius: 0;
  text-decoration: none;
  white-space: nowrap;
  font-family: inherit;
}
.act-btn--view  { background: #DEEAF1; color: #1F3864; border-color: #9DC3E6; }
.act-btn--view:hover { background: #c5d9ec; }
.act-btn--dl    { background: #E2EFDA; color: #375623; border-color: #92D050; }
.act-btn--dl:hover { background: #c8e3b4; }
.act-btn--close { background: #1F3864; color: #fff; padding: 7px 18px; font-size: 12px; }
.act-btn--close:hover { background: #162d52; }

/* ── FOOTER ── */
.brief-modal__foot {
  padding: 12px 20px;
  border-top: 2px solid #DEEAF1;
  display: flex; justify-content: flex-end;
  background: #F7FBFE;
  flex-shrink: 0;
}

.pub-dates-cell { display: flex; flex-wrap: wrap; gap: 3px; align-items: center; }
.pub-chip {
  display: inline-block;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 10px; font-weight: 600;
  background: #DEEAF1; color: #1F3864;
  border: 1px solid #9DC3E6;
  padding: 2px 6px;
}
.pub-chip--today { background: #1F3864; color: #fff; border-color: #1F3864; }
.pub-chip--past  { background: #F7FBFE; color: #aaa; border-color: #DEEAF1; }
.pub-total { font-size: 10px; color: #888; margin-left: 4px; }

@media (max-width: 768px) {
  .info-tbl, .info-tbl tbody, .info-tbl tr, .info-tbl td { display: block; }
  .info-tbl__lbl { width: 100%; border-right: none; border-bottom: 1px solid #c8dcea; }
  .info-tbl__val { width: 100%; border-right: none; }
}
</style>