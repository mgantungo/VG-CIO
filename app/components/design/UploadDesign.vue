<!-- components/design/UploadDesign.vue -->
<template>
  <div v-if="show" class="ud-overlay" @click.self="close">
    <div class="ud-modal">

      <!-- Header -->
      <div class="ud-header">
        <div class="ud-header__left">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="margin-right:8px;flex-shrink:0">
            <path d="M8 1v9M4 5l4-4 4 4" stroke="#9DC3E6" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M2 12v1a1 1 0 001 1h10a1 1 0 001-1v-1" stroke="#9DC3E6" stroke-width="1.8" stroke-linecap="round"/>
          </svg>
          <span class="ud-header__title">Upload Design Files</span>
        </div>
        <button class="ud-close" @click="close" title="Close">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M12 4L4 12M4 4L12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        </button>
      </div>

      <!-- Advert info band -->
      <div v-if="advert" class="ud-info-band">
        <div class="ud-info-cell">
          <span class="ud-info-label">Reference</span>
          <span class="ud-info-val mono">{{ advert.reference }}</span>
        </div>
        <div class="ud-info-sep"></div>
        <div class="ud-info-cell">
          <span class="ud-info-label">Client</span>
          <span class="ud-info-val">{{ advert.clientName }}</span>
        </div>
        <div class="ud-info-sep"></div>
        <div class="ud-info-cell">
          <span class="ud-info-label">Title</span>
          <span class="ud-info-val">{{ advert.advertTitle }}</span>
        </div>
      </div>

      <!-- Body -->
      <div class="ud-body">
        <form @submit.prevent="submitUpload">

          <!-- Drop zone -->
          <div class="ud-section">
            <div class="ud-section__hd">
              <span>Select Files</span>
              <span class="ud-limits">Max {{ maxFileSizeMB }}MB per file &nbsp;·&nbsp; {{ maxTotalSizeMB }}MB total</span>
            </div>

            <div
              class="ud-drop"
              :class="{ 'ud-drop--over': isDragging, 'ud-drop--filled': files.length > 0 }"
              @dragover.prevent="handleDragOver"
              @dragleave="handleDragLeave"
              @drop.prevent="handleDrop"
              @click="files.length === 0 && triggerFileInput()"
            >
              <input
                type="file"
                ref="fileInput"
                multiple
                style="display:none"
                :accept="acceptedFileTypes"
                @change="handleFileSelect"
              >

              <!-- Empty state -->
              <div v-if="files.length === 0" class="ud-drop__empty">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" style="margin-bottom:10px">
                  <path d="M16 4v18M8 12l8-8 8 8" stroke="#9DC3E6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M4 24v2a2 2 0 002 2h20a2 2 0 002-2v-2" stroke="#9DC3E6" stroke-width="2" stroke-linecap="round"/>
                </svg>
                <p class="ud-drop__title">Drop files here or click to browse</p>
                <p class="ud-drop__sub">{{ supportedFileTypes }}</p>
                <button type="button" class="ud-btn ud-btn--primary" @click.stop="triggerFileInput">Browse Files</button>
              </div>

              <!-- Files list -->
              <div v-else class="ud-files">
                <div class="ud-files__hd">
                  <span class="ud-files__count">
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style="vertical-align:middle;margin-right:4px"><path d="M13 2H3a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1V3a1 1 0 00-1-1z" stroke="#375623" stroke-width="1.5"/><path d="M5 8h6M5 5h6M5 11h3" stroke="#375623" stroke-width="1.5" stroke-linecap="round"/></svg>
                    {{ files.length }} file{{ files.length !== 1 ? 's' : '' }} selected
                  </span>
                  <button type="button" class="ud-btn ud-btn--ghost" @click.stop="triggerFileInput">
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M8 1v9M4 5l4-4 4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    Add More
                  </button>
                </div>
                <table class="ud-tbl">
                  <thead>
                    <tr>
                      <th>File</th>
                      <th class="ud-tc-size">Size</th>
                      <th class="ud-tc-type">Type</th>
                      <th class="ud-tc-rm"></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(file, index) in files" :key="index" class="ud-tbl__row">
                      <td>
                        <div class="ud-fname">
                          <span class="ud-ficon">{{ getFileIcon(file.name) }}</span>
                          <span class="ud-fname__text">{{ file.name }}</span>
                        </div>
                      </td>
                      <td class="ud-tc-size mono">{{ formatFileSize(file.size) }}</td>
                      <td class="ud-tc-type">
                        <span class="ud-ext">{{ file.name.split('.').pop().toUpperCase() }}</span>
                      </td>
                      <td class="ud-tc-rm">
                        <button type="button" class="ud-rm-btn" @click.stop="removeFile(index)" title="Remove">
                          <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M12 4L4 12M4 4L12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div class="ud-files__footer">
                  <span class="ud-total-size mono">Total: {{ formatFileSize(totalFileSize) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Description -->
          <div class="ud-section">
            <div class="ud-section__hd">
              <span>Upload Notes <span class="ud-req">*</span></span>
            </div>
            <textarea
              v-model="description"
              class="ud-textarea"
              :class="{ 'ud-textarea--err': errors.description }"
              rows="3"
              placeholder="Describe the files you're uploading — e.g. 'Final print-ready PDF', 'TV commercial rough cut v2', 'High-res JPEG for web'"
              :disabled="uploading"
              @input="clearError('description')"
            ></textarea>
            <div v-if="errors.description" class="ud-err-msg">{{ errors.description }}</div>
          </div>

          <!-- Upload progress -->
          <div v-if="uploading" class="ud-progress">
            <div class="ud-progress__bar">
              <div class="ud-progress__fill"></div>
            </div>
            <span class="ud-progress__label">Uploading files, please wait…</span>
          </div>

          <!-- Error alert -->
          <div v-if="uploadError" class="ud-alert">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style="flex-shrink:0"><circle cx="8" cy="8" r="6" stroke="#9C0006" stroke-width="1.5"/><path d="M8 5v3M8 10h.01" stroke="#9C0006" stroke-width="1.5" stroke-linecap="round"/></svg>
            {{ uploadError }}
          </div>

          <!-- Footer -->
          <div class="ud-footer">
            <div class="ud-footer__stats">
              <span v-if="files.length > 0">{{ files.length }} file{{ files.length !== 1 ? 's' : '' }} &nbsp;·&nbsp; {{ formatFileSize(totalFileSize) }}</span>
            </div>
            <div class="ud-footer__actions">
              <button type="button" class="ud-btn ud-btn--ghost" @click="close" :disabled="uploading">Cancel</button>
              <button
                type="submit"
                class="ud-btn ud-btn--primary"
                :disabled="uploading || files.length === 0 || !description"
              >
                <span v-if="uploading">
                  <span class="ud-spinner"></span>Uploading…
                </span>
                <span v-else>
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style="vertical-align:middle;margin-right:5px"><path d="M8 1v9M4 5l4-4 4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 12v1a1 1 0 001 1h10a1 1 0 001-1v-1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
                  Upload {{ files.length > 0 ? files.length + ' File' + (files.length !== 1 ? 's' : '') : 'Files' }}
                </span>
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useDesign } from '~/composables/useDesign'

const props = defineProps({
  advert: {
    type: Object,
    default: null
  },
  show: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'uploaded'])

// Use the composable for API calls - FIXED: Changed from uploadDesign to uploadDesignFiles
const { uploadDesignFiles } = useDesign()

// Local state
const fileInput = ref(null)
const files = ref([])
const description = ref('')
const isDragging = ref(false)
const errors = ref({})
const uploading = ref(false)
const uploadError = ref('')

// Constants
const acceptedFileTypes = '.pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.psd,.ai,.eps,.svg,.indd,.mp4,.mov,.avi,.zip,.rar'
const supportedFileTypes = 'PDF, Word, Images, Design Files (PSD, AI, EPS, SVG, INDD), Videos, Archives'
const maxFileSizeMB = 50
const maxTotalSizeMB = 500

// Computed
const totalFileSize = computed(() => {
  return files.value.reduce((sum, file) => sum + file.size, 0)
})

const exceedsMaxTotalSize = computed(() => {
  return totalFileSize.value > maxTotalSizeMB * 1024 * 1024
})

// Methods
const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileSelect = (event) => {
  const selectedFiles = Array.from(event.target.files)
  addFiles(selectedFiles)
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const handleDragOver = () => {
  isDragging.value = true
}

const handleDragLeave = () => {
  isDragging.value = false
}

const handleDrop = (event) => {
  isDragging.value = false
  const droppedFiles = Array.from(event.dataTransfer.files)
  addFiles(droppedFiles)
}

const addFiles = (newFiles) => {
  const validFiles = []
  const newErrors = []
  
  newFiles.forEach(file => {
    // Check file size
    const fileSizeMB = file.size / 1024 / 1024
    if (fileSizeMB > maxFileSizeMB) {
      newErrors.push(`${file.name}: File exceeds ${maxFileSizeMB}MB limit`)
      return
    }
    
    // Check if file already added
    const isDuplicate = files.value.some(f => f.name === file.name && f.size === file.size)
    if (isDuplicate) {
      newErrors.push(`${file.name}: File already added`)
      return
    }
    
    validFiles.push(file)
  })
  
  if (newErrors.length > 0) {
    alert('Some files could not be added:\n' + newErrors.join('\n'))
  }
  
  files.value = [...files.value, ...validFiles]
  
  // Check total size
  if (exceedsMaxTotalSize.value) {
    alert(`Total file size exceeds ${maxTotalSizeMB}MB limit. Please remove some files.`)
  }
}

const removeFile = (index) => {
  files.value.splice(index, 1)
}

const clearError = (field) => {
  if (errors.value[field]) {
    delete errors.value[field]
  }
}

const validateForm = () => {
  errors.value = {}
  
  if (!description.value.trim()) {
    errors.value.description = 'Description is required'
    return false
  }
  
  if (files.value.length === 0) {
    alert('Please select at least one file to upload')
    return false
  }
  
  if (exceedsMaxTotalSize.value) {
    alert(`Total file size exceeds ${maxTotalSizeMB}MB limit`)
    return false
  }
  
  return true
}

const submitUpload = async () => {
  if (!validateForm()) return
  
  if (!props.advert || !props.advert.id) {
    alert('No advert selected')
    return
  }
  
  uploading.value = true
  uploadError.value = ''
  
  try {
    // Call the composable's uploadDesignFiles method - FIXED: Using correct method name
    const result = await uploadDesignFiles(
      props.advert.id,
      files.value,
      description.value
    )
    
    alert(`✅ Successfully uploaded ${files.value.length} file(s) for ${props.advert.reference}`)
    
    // Emit success event
    emit('uploaded', result)
    
    // Reset form
    resetForm()
    
  } catch (error) {
    console.error('Upload failed:', error)
    uploadError.value = error.message || 'Failed to upload files'
    alert(`❌ Upload failed: ${uploadError.value}`)
  } finally {
    uploading.value = false
  }
}

const resetForm = () => {
  files.value = []
  description.value = ''
  errors.value = {}
  uploadError.value = ''
}

const close = () => {
  if (!uploading.value) {
    resetForm()
    emit('close')
  }
}

// Utility Functions
const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

const getFileIcon = (filename) => {
  if (!filename) return '📎'
  
  const ext = filename.split('.').pop().toLowerCase()
  
  const iconMap = {
    'pdf': '📕',
    'doc': '📄',
    'docx': '📄',
    'jpg': '🖼️',
    'jpeg': '🖼️',
    'png': '🖼️',
    'gif': '🖼️',
    'psd': '🎨',
    'ai': '🎨',
    'eps': '🎨',
    'svg': '🎨',
    'indd': '🎨',
    'mp4': '🎬',
    'mov': '🎬',
    'avi': '🎬',
    'zip': '🗜️',
    'rar': '🗜️'
  }
  
  return iconMap[ext] || '📎'
}

// Watch for modal visibility changes
watch(() => props.show, (newValue) => {
  if (!newValue) {
    resetForm()
  }
})
</script>

<style scoped>
/* ── Overlay & modal shell ─────────────────────────────────────────────────── */
.ud-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
  font-family: 'IBM Plex Sans', 'Segoe UI', sans-serif;
}

.ud-modal {
  background: #fff;
  border: 1px solid #BDD7EE;
  width: 100%;
  max-width: 660px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  border-radius: 0;
  box-shadow: 0 8px 32px rgba(31,56,100,.18);
}

/* ── Header ───────────────────────────────────────────────────────────────── */
.ud-header {
  background: #1F3864;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  flex-shrink: 0;
}
.ud-header__left { display: flex; align-items: center; }
.ud-header__title { font-size: 13px; font-weight: 600; letter-spacing: .2px; }
.ud-close {
  background: none; border: none; color: #9DC3E6; cursor: pointer;
  width: 26px; height: 26px; display: flex; align-items: center; justify-content: center;
  border-radius: 0; transition: color .15s;
}
.ud-close:hover { color: #fff; }

/* ── Info band ────────────────────────────────────────────────────────────── */
.ud-info-band {
  background: #DEEAF1;
  border-bottom: 1px solid #9DC3E6;
  display: flex;
  align-items: stretch;
  flex-shrink: 0;
}
.ud-info-cell {
  display: flex;
  flex-direction: column;
  padding: 8px 16px;
  flex: 1;
  min-width: 0;
}
.ud-info-sep { width: 1px; background: #9DC3E6; }
.ud-info-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: #6081a3; }
.ud-info-val { font-size: 12px; font-weight: 600; color: #1F3864; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 1px; }
.mono { font-family: 'IBM Plex Mono', monospace; }

/* ── Body ─────────────────────────────────────────────────────────────────── */
.ud-body {
  flex: 1;
  overflow-y: auto;
  padding: 18px 20px;
  background: #F2F2F2;
}

/* ── Section ──────────────────────────────────────────────────────────────── */
.ud-section { background: #fff; border: 1px solid #BDD7EE; margin-bottom: 14px; }
.ud-section__hd {
  background: #DEEAF1;
  border-bottom: 1px solid #9DC3E6;
  padding: 6px 12px;
  font-size: 11px;
  font-weight: 700;
  color: #1F3864;
  text-transform: uppercase;
  letter-spacing: .4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.ud-req { color: #E31E24; }
.ud-limits { font-size: 10px; font-weight: 400; color: #6081a3; text-transform: none; letter-spacing: 0; }

/* ── Drop zone ────────────────────────────────────────────────────────────── */
.ud-drop {
  min-height: 140px;
  transition: background .15s, border-color .15s;
  cursor: pointer;
}
.ud-drop--over  { background: #EBF4FF; outline: 2px dashed #9DC3E6; outline-offset: -4px; }
.ud-drop--filled { cursor: default; }

.ud-drop__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 28px 20px;
  text-align: center;
}
.ud-drop__title { font-size: 13px; font-weight: 600; color: #1F3864; margin: 0 0 4px; }
.ud-drop__sub   { font-size: 11px; color: #888; margin: 0 0 14px; }

/* ── Files table ──────────────────────────────────────────────────────────── */
.ud-files { padding: 0; }
.ud-files__hd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid #DEEAF1;
  background: #F7FBFE;
}
.ud-files__count { font-size: 11px; font-weight: 600; color: #375623; display: flex; align-items: center; }
.ud-files__footer {
  padding: 6px 12px;
  border-top: 1px solid #DEEAF1;
  background: #F7FBFE;
  text-align: right;
}
.ud-total-size { font-size: 11px; color: #555; }

.ud-tbl { width: 100%; border-collapse: collapse; font-size: 12px; }
.ud-tbl thead tr { background: #DEEAF1; }
.ud-tbl thead th {
  padding: 6px 10px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .4px;
  color: #1F3864;
  border-bottom: 1px solid #9DC3E6;
  border-right: 1px solid #BDD7EE;
  text-align: left;
}
.ud-tbl thead th:last-child { border-right: none; }
.ud-tbl__row { border-bottom: 1px solid #EBF4FF; }
.ud-tbl__row:last-child { border-bottom: none; }
.ud-tbl__row:nth-child(even) { background: #F7FBFE; }
.ud-tbl__row:hover { background: #EBF4FF; }
.ud-tbl td { padding: 7px 10px; border-right: 1px solid #EBF4FF; vertical-align: middle; }
.ud-tbl td:last-child { border-right: none; }

.ud-tc-size { width: 80px; text-align: right; }
.ud-tc-type { width: 60px; text-align: center; }
.ud-tc-rm   { width: 36px; text-align: center; }

.ud-fname { display: flex; align-items: center; gap: 7px; }
.ud-ficon { font-size: 14px; flex-shrink: 0; }
.ud-fname__text { font-weight: 500; color: #222; word-break: break-word; }
.ud-ext {
  display: inline-block;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 9px;
  font-weight: 700;
  background: #DEEAF1;
  color: #1F3864;
  border: 1px solid #9DC3E6;
  padding: 1px 4px;
}
.ud-rm-btn {
  background: none; border: none; cursor: pointer; color: #bbb;
  width: 22px; height: 22px; display: flex; align-items: center; justify-content: center;
  border-radius: 0; transition: color .12s;
}
.ud-rm-btn:hover { color: #E31E24; }

/* ── Description textarea ─────────────────────────────────────────────────── */
.ud-textarea {
  width: 100%;
  border: none;
  border-top: none;
  padding: 10px 12px;
  font-size: 12px;
  font-family: inherit;
  resize: vertical;
  min-height: 72px;
  color: #222;
  background: #fff;
  box-sizing: border-box;
  outline: none;
  transition: box-shadow .15s;
}
.ud-textarea:focus { box-shadow: inset 0 0 0 2px #9DC3E6; }
.ud-textarea--err  { box-shadow: inset 0 0 0 2px #E31E24; }
.ud-textarea:disabled { background: #f8f8f8; color: #aaa; cursor: not-allowed; }
.ud-err-msg { font-size: 11px; color: #E31E24; padding: 4px 12px 8px; background: #fff; }

/* ── Progress ─────────────────────────────────────────────────────────────── */
.ud-progress {
  background: #fff;
  border: 1px solid #BDD7EE;
  padding: 12px 14px;
  margin-bottom: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.ud-progress__bar { height: 4px; background: #DEEAF1; overflow: hidden; }
.ud-progress__fill {
  height: 100%;
  background: #1F3864;
  animation: ud-slide 1.4s ease-in-out infinite;
  width: 40%;
}
@keyframes ud-slide {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(350%); }
}
.ud-progress__label { font-size: 11px; color: #555; }

/* ── Error alert ──────────────────────────────────────────────────────────── */
.ud-alert {
  background: #FCE4D6;
  border: 1px solid #E31E24;
  border-left: 3px solid #E31E24;
  padding: 9px 12px;
  margin-bottom: 14px;
  font-size: 12px;
  color: #9C0006;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* ── Footer ───────────────────────────────────────────────────────────────── */
.ud-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 14px;
  border-top: 1px solid #BDD7EE;
  gap: 12px;
}
.ud-footer__stats { font-size: 11px; color: #888; font-family: 'IBM Plex Mono', monospace; }
.ud-footer__actions { display: flex; gap: 8px; }

/* ── Buttons ──────────────────────────────────────────────────────────────── */
.ud-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 600;
  font-family: inherit;
  border: 1px solid transparent;
  cursor: pointer;
  border-radius: 0;
  transition: opacity .12s, background .12s;
  white-space: nowrap;
}
.ud-btn:disabled { opacity: .5; cursor: not-allowed; }

.ud-btn--primary { background: #E31E24; color: #fff; border-color: #E31E24; }
.ud-btn--primary:hover:not(:disabled) { background: #c01820; border-color: #c01820; }

.ud-btn--ghost { background: #fff; color: #1F3864; border-color: #9DC3E6; }
.ud-btn--ghost:hover:not(:disabled) { background: #DEEAF1; }

/* ── Spinner ──────────────────────────────────────────────────────────────── */
.ud-spinner {
  display: inline-block;
  width: 12px; height: 12px;
  border: 2px solid rgba(255,255,255,.35);
  border-top-color: #fff;
  border-radius: 50%;
  animation: ud-spin .8s linear infinite;
  vertical-align: middle;
  margin-right: 5px;
}
@keyframes ud-spin { to { transform: rotate(360deg); } }

/* ── Responsive ───────────────────────────────────────────────────────────── */
@media (max-width: 600px) {
  .ud-info-band { flex-wrap: wrap; }
  .ud-info-sep  { display: none; }
  .ud-info-cell { flex: 1 1 45%; border-bottom: 1px solid #9DC3E6; }
  .ud-footer    { flex-direction: column; align-items: stretch; }
  .ud-footer__actions { justify-content: flex-end; }
}
</style>