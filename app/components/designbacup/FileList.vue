<!--components/design/FileList.vue-->
<template>
  <div class="file-list">

    <!-- ── LOADING ── -->
    <div v-if="loading" class="state-box">
      <div class="spinner"></div>
      <p>Loading files…</p>
    </div>

    <!-- ── EMPTY ── -->
    <div v-else-if="files.length === 0" class="state-box">
      <div class="state-box__icon">&#128193;</div>
      <div class="state-box__title">No Files Available</div>
      <p>No files have been uploaded yet.</p>
    </div>

    <!-- ── TABLE ── -->
    <div v-else class="tbl-wrap">
      <table class="xl-tbl">
        <thead>
          <tr>
            <th class="tc-file">File</th>
            <th class="tc-type">Type</th>
            <th class="tc-size">Size</th>
            <th class="tc-date">Uploaded</th>
            <th class="tc-ref" v-if="hasRefs">Reference</th>
            <th class="tc-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="file in files" :key="file.id" class="xl-row">
            <td class="tc-file">
              <div class="file-name-cell" @click="$emit('preview', file)" style="cursor:pointer;">
                <span :class="`file-icon-box file-icon-box--${getFileIconClass(file)}`">{{ getFileIcon(file) }}</span>
                <div class="file-name-info">
                  <div class="file-name">{{ file.name }}</div>
                </div>
              </div>
            </td>
            <td class="tc-type"><span class="type-chip">{{ getFileType(file) }}</span></td>
            <td class="tc-size num-cell">{{ formatFileSize(file.size) }}</td>
            <td class="tc-date num-cell">{{ file.createdAt ? formatRelativeTime(file.createdAt) : '—' }}</td>
            <td class="tc-ref" v-if="hasRefs">
              <span v-if="file.advertReference" class="ref-chip">{{ file.advertReference }}</span>
              <span v-else class="muted">—</span>
            </td>
            <td class="tc-actions">
              <div class="act-group">
                <a v-if="file.url" :href="resolveUrl(file.url)" target="_blank" class="act-btn act-btn--view" title="Preview" @click.stop>
                  &#128065; View
                </a>
                <a v-if="file.url" :href="resolveUrl(file.url)" :download="file.name" class="act-btn act-btn--dl" title="Download" @click.stop="$emit('download', file)">
                  &#8659; DL
                </a>
                <button v-if="showDelete" class="act-btn act-btn--del" @click.stop="$emit('delete', file)" title="Delete">
                  &#128465;
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ── STATS BAR ── -->
    <div v-if="files.length > 0 && showStats" class="stats-bar">
      <span class="stats-bar__stat">
        <span class="stats-bar__lbl">Total Files</span>
        <span class="stats-bar__val">{{ files.length }}</span>
      </span>
      <span class="stats-bar__div">|</span>
      <span class="stats-bar__stat">
        <span class="stats-bar__lbl">Total Size</span>
        <span class="stats-bar__val">{{ formatFileSize(totalSize) }}</span>
      </span>
      <span v-if="latestUpload" class="stats-bar__div">|</span>
      <span v-if="latestUpload" class="stats-bar__stat">
        <span class="stats-bar__lbl">Latest Upload</span>
        <span class="stats-bar__val">{{ formatRelativeTime(latestUpload.createdAt) }}</span>
      </span>
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
import { computed } from 'vue'

const props = defineProps({
  files: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  showDelete: {
    type: Boolean,
    default: false
  },
  showStats: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['preview', 'download', 'delete'])

// Computed
const totalSize = computed(() => {
  return props.files.reduce((sum, file) => sum + (file.size || 0), 0)
})

const latestUpload = computed(() => {
  if (props.files.length === 0) return null
  
  return props.files.reduce((latest, file) => {
    if (!file.createdAt) return latest
    if (!latest) return file
    
    const fileDate = new Date(file.createdAt)
    const latestDate = new Date(latest.createdAt)
    
    return fileDate > latestDate ? file : latest
  }, null)
})

const hasRefs = computed(() => props.files.some(f => f.advertReference))

// Utility Functions
const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

const formatRelativeTime = (dateString) => {
  if (!dateString) return ''
  
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now - date) / 1000)
    
    if (diffInSeconds < 60) return 'just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hrs ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`
    
    // More than a week, show actual date
    return date.toLocaleDateString('en-UG', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    })
  } catch (error) {
    return dateString
  }
}

const getFileIcon = (file) => {
  const name = file.name || ''
  const ext = name.split('.').pop().toLowerCase()
  
  const iconMap = {
    'doc': '📄', 'docx': '📄',
    'pdf': '📕',
    'jpg': '🖼️', 'jpeg': '🖼️', 'png': '🖼️', 'gif': '🖼️', 'bmp': '🖼️',
    'psd': '🎨', 'ai': '🎨', 'eps': '🎨', 'svg': '🎨', 'indd': '🎨',
    'mp4': '🎬', 'mov': '🎬', 'avi': '🎬', 'wmv': '🎬',
    'mp3': '🎵', 'wav': '🎵', 'aac': '🎵',
    'zip': '🗜️', 'rar': '🗜️', '7z': '🗜️'
  }
  
  return iconMap[ext] || '📎'
}

const getFileIconClass = (file) => {
  const name = file.name || ''
  const ext = name.split('.').pop().toLowerCase()
  
  const iconClasses = {
    'doc': 'doc', 'docx': 'doc',
    'pdf': 'pdf',
    'jpg': 'image', 'jpeg': 'image', 'png': 'image', 'gif': 'image',
    'psd': 'design', 'ai': 'design', 'eps': 'design', 'svg': 'design', 'indd': 'design',
    'mp4': 'video', 'mov': 'video', 'avi': 'video'
  }
  
  return iconClasses[ext] || 'default'
}

const getFileType = (file) => {
  const name = file.name || ''
  const ext = name.split('.').pop().toLowerCase()
  
  const typeMap = {
    'doc': 'DOCX', 'docx': 'DOCX',
    'pdf': 'PDF',
    'jpg': 'JPEG', 'jpeg': 'JPEG', 'png': 'PNG', 'gif': 'GIF',
    'psd': 'PSD', 'ai': 'AI', 'eps': 'EPS', 'svg': 'SVG', 'indd': 'INDD',
    'mp4': 'MP4', 'mov': 'MOV',
    'mp3': 'MP3',
    'zip': 'ZIP', 'rar': 'RAR'
  }
  
  return typeMap[ext] || ext.toUpperCase()
}
</script>

<style scoped>
.file-list {
  width: 100%;
  font-family: 'IBM Plex Sans', 'Segoe UI', sans-serif;
  font-size: 13px;
}

/* ── STATE BOXES ── */
.state-box {
  text-align: center;
  padding: 48px 20px;
  background: #F7FBFE;
  border: 1px dashed #BDD7EE;
}
.state-box__icon  { font-size: 32px; margin-bottom: 10px; opacity: .45; }
.state-box__title { font-size: 13px; font-weight: 600; color: #555; margin-bottom: 4px; }
.state-box p      { font-size: 12px; color: #999; margin: 0; }
.spinner {
  width: 30px; height: 30px;
  border: 3px solid #DEEAF1; border-top-color: #1F3864;
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
  margin: 0 auto 12px;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── TABLE ── */
.tbl-wrap { overflow-x: auto; }
.xl-tbl {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  min-width: 560px;
}
.xl-tbl thead tr { background: #DEEAF1; }
.xl-tbl thead th {
  color: #1F3864; font-weight: 600; font-size: 10px;
  text-transform: uppercase; letter-spacing: .4px;
  padding: 8px 12px;
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

/* ── COL WIDTHS ── */
.tc-file    { min-width: 200px; }
.tc-type    { width: 64px; }
.tc-size    { width: 80px; }
.tc-date    { width: 100px; }
.tc-ref     { width: 110px; }
.tc-actions { width: 120px; }

/* ── CELL CONTENTS ── */
.file-name-cell { display: flex; align-items: center; gap: 8px; }
.file-icon-box {
  width: 28px; height: 28px;
  display: flex; align-items: center; justify-content: center;
  font-size: 15px; flex-shrink: 0;
  border: 1px solid #BDD7EE;
  background: #F7FBFE;
}
.file-icon-box--image   { background: #FFF2CC; border-color: #FFD966; }
.file-icon-box--video   { background: #FCE4D6; border-color: #F4B183; }
.file-icon-box--pdf     { background: #FCE4D6; border-color: #FF7043; }
.file-icon-box--design  { background: #E2EFDA; border-color: #92D050; }
.file-icon-box--doc     { background: #DEEAF1; border-color: #9DC3E6; }

.file-name-info { min-width: 0; }
.file-name { font-weight: 500; color: #222; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 200px; }

.type-chip {
  display: inline-block;
  background: #DEEAF1; color: #1F3864;
  border: 1px solid #9DC3E6;
  font-size: 9px; font-weight: 700;
  padding: 1px 6px;
}
.num-cell { font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: #555; }
.ref-chip {
  display: inline-block;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 10px; font-weight: 700;
  color: #1F3864; background: #DEEAF1;
  border: 1px solid #9DC3E6;
  padding: 1px 6px;
}
.muted { color: #bbb; font-size: 12px; }

/* ── ACTION BUTTONS ── */
.act-group { display: flex; gap: 4px; }
.act-btn {
  display: inline-block;
  font-size: 11px; font-weight: 600;
  padding: 3px 8px;
  border: 1px solid transparent;
  cursor: pointer; border-radius: 0;
  text-decoration: none;
  white-space: nowrap; font-family: inherit;
  transition: opacity .15s;
}
.act-btn--view { background: #DEEAF1; color: #1F3864; border-color: #9DC3E6; }
.act-btn--view:hover { background: #c5d9ec; }
.act-btn--dl   { background: #E2EFDA; color: #375623; border-color: #92D050; }
.act-btn--dl:hover { background: #c8e3b4; }
.act-btn--del  { background: #FCE4D6; color: #9C0006; border-color: #FF7043; }
.act-btn--del:hover { background: #f4c7b4; }

/* ── STATS BAR ── */
.stats-bar {
  background: #DEEAF1;
  border-top: 1px solid #9DC3E6;
  padding: 7px 14px;
  display: flex; align-items: center; gap: 12px;
  font-size: 11px;
}
.stats-bar__stat { display: flex; align-items: center; gap: 6px; }
.stats-bar__lbl  { color: #6081a3; font-weight: 600; text-transform: uppercase; letter-spacing: .3px; font-size: 9px; }
.stats-bar__val  { font-weight: 700; color: #1F3864; font-family: 'IBM Plex Mono', monospace; font-size: 11px; }
.stats-bar__div  { color: #9DC3E6; }
</style>