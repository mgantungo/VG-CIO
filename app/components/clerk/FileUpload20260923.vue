<!-- components/clerk/FileUpload.vue -->
<template>
  <div class="file-upload">
    <div class="section-header">
      <h3>📎 File Attachments</h3>
      <div class="section-subtitle">
        Upload files related to this advert (PDF, images, documents)
      </div>
    </div>

    <!-- Existing Files -->
    <div v-if="initialFiles && initialFiles.length > 0" class="existing-files-section">
      <div class="section-header">
        <h4>Existing Files</h4>
        <span class="file-count">{{ initialFiles.length }} file(s)</span>
      </div>
      <div class="existing-files-list">
        <div v-for="file in initialFiles" :key="file.id" class="existing-file-item">
          <div class="file-preview">
            <div class="file-icon" :class="getFileTypeClass(file)">
              {{ getFileIcon(file.name) }}
            </div>
            <div class="file-details">
              <div class="file-name">{{ file.name }}</div>
              <div class="file-meta">
                <span class="file-size">{{ formatFileSize(file.size) }}</span>
                <span class="file-type">{{ getFileExtension(file.name) }}</span>
                <span class="file-date" v-if="file.uploadedAt">
                  Uploaded {{ formatRelativeTime(file.uploadedAt) }}
                </span>
              </div>
            </div>
          </div>
          <div class="file-actions">
            <a 
              v-if="file.url"
              :href="getFullFileUrl(file.url)"
              target="_blank"
              class="btn btn-view"
              title="View File"
            >
              👁️ View
            </a>
            <button 
              v-if="!disabled"
              class="btn btn-remove"
              @click="removeExistingFile(file.id)"
              title="Remove File"
            >
              🗑️ Remove
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- New File Upload -->
    <div class="new-files-section" v-if="!disabled">
      <div class="upload-area" 
           @dragover.prevent="dragover = true"
           @dragleave.prevent="dragover = false"
           @drop.prevent="handleDrop"
           :class="{ 'drag-over': dragover }"
      >
        <div class="upload-content">
          <div class="upload-icon">📁</div>
          <div class="upload-text">
            <strong>Drop files here or click to upload</strong>
            <p>Max file size: 10MB • Supported: PDF, JPG, PNG, DOC, DOCX</p>
          </div>
          <input
            type="file"
            ref="fileInput"
            multiple
            :accept="acceptedTypes"
            @change="handleFileSelect"
            class="file-input"
          />
          <button 
            type="button"
            class="btn btn-browse"
            @click="triggerFileInput"
          >
            📂 Browse Files
          </button>
        </div>
      </div>

      <!-- Selected Files Preview -->
      <div v-if="selectedFiles.length > 0" class="selected-files">
        <div class="selected-files-header">
          <h4>Selected Files ({{ selectedFiles.length }})</h4>
          <button 
            type="button"
            class="btn btn-clear"
            @click="clearAllFiles"
            v-if="selectedFiles.length > 0"
          >
            🗑️ Clear All
          </button>
        </div>
        
        <div class="selected-files-list">
          <div v-for="(file, index) in selectedFiles" :key="index" class="selected-file-item">
            <div class="file-preview">
              <div class="file-icon" :class="getFileTypeClass(file)">
                {{ getFileIcon(file.name) }}
              </div>
              <div class="file-details">
                <div class="file-name">{{ file.name }}</div>
                <div class="file-meta">
                  <span class="file-size">{{ formatFileSize(file.size) }}</span>
                  <span class="file-status" :class="getUploadStatusClass(file)">
                    {{ getUploadStatus(file) }}
                  </span>
                </div>
                <div v-if="file.error" class="file-error">
                  ⚠️ {{ file.error }}
                </div>
                <div v-if="file.progress !== undefined" class="upload-progress">
                  <div class="progress-bar">
                    <div 
                      class="progress-fill"
                      :style="{ width: `${file.progress}%` }"
                    ></div>
                  </div>
                  <span class="progress-text">{{ file.progress }}%</span>
                </div>
              </div>
            </div>
            <div class="file-actions">
              <button 
                v-if="!file.uploading"
                class="btn btn-remove"
                @click="removeSelectedFile(index)"
                title="Remove File"
              >
                🗑️
              </button>
              <div v-else class="uploading-indicator">
                <span class="spinner"></span>
              </div>
            </div>
          </div>
        </div>

        <div class="upload-actions">
          <button 
            type="button"
            class="btn btn-primary"
            @click="uploadFiles"
            :disabled="!canUpload || isUploading"
          >
            <span v-if="isUploading">
              <span class="spinner-small"></span> Uploading...
            </span>
            <span v-else>📤 Upload {{ selectedFiles.length }} File(s)</span>
          </button>
        </div>
      </div>

      <!-- Upload Status -->
      <div v-if="uploadStatus" class="upload-status" :class="uploadStatus.type">
        <div class="status-icon">{{ uploadStatus.icon }}</div>
        <div class="status-content">
          <strong>{{ uploadStatus.title }}</strong>
          <p>{{ uploadStatus.message }}</p>
        </div>
        <button 
          v-if="uploadStatus.dismissible"
          class="btn-close-status"
          @click="clearUploadStatus"
        >
          ×
        </button>
      </div>
    </div>

    <!-- Upload Restrictions -->
    <div class="upload-info">
      <div class="info-icon">ℹ️</div>
      <div class="info-content">
        <strong>Upload Guidelines:</strong>
        <ul>
          <li>Maximum file size: 10MB per file</li>
          <li>Supported formats: PDF, JPG, PNG, DOC, DOCX</li>
          <li>Total upload limit: 50MB per advert</li>
          <li>Files will be attached to the advert for reference</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRuntimeConfig } from '#imports'

const props = defineProps({
  initialFiles: {
    type: Array,
    default: () => []
  },
  disabled: {
    type: Boolean,
    default: false
  },
  advertId: {
    type: [String, Number],
    default: null
  },
  maxFiles: {
    type: Number,
    default: 10
  },
  maxSize: {
    type: Number,
    default: 10 * 1024 * 1024 // 10MB in bytes
  }
})

const emit = defineEmits(['files-updated', 'upload-complete', 'upload-error'])

const config = useRuntimeConfig()
const fileInput = ref(null)
const dragover = ref(false)
const selectedFiles = ref([])
const isUploading = ref(false)
const uploadStatus = ref(null)

// Accepted file types
const acceptedTypes = '.pdf,.jpg,.jpeg,.png,.doc,.docx'

// Computed properties
const canUpload = computed(() => {
  return selectedFiles.value.length > 0 && 
         selectedFiles.value.every(file => !file.error) &&
         !isUploading.value
})

const totalSelectedSize = computed(() => {
  return selectedFiles.value.reduce((total, file) => total + file.size, 0)
})

// Methods
const getFileIcon = (filename) => {
  const ext = filename.split('.').pop().toLowerCase()
  const iconMap = {
    pdf: '📕',
    jpg: '🖼️',
    jpeg: '🖼️',
    png: '🖼️',
    doc: '📄',
    docx: '📄',
    default: '📎'
  }
  return iconMap[ext] || iconMap.default
}

const getFileTypeClass = (file) => {
  const ext = file.name.split('.').pop().toLowerCase()
  const typeMap = {
    pdf: 'type-pdf',
    jpg: 'type-image',
    jpeg: 'type-image',
    png: 'type-image',
    doc: 'type-doc',
    docx: 'type-doc',
    default: 'type-other'
  }
  return typeMap[ext] || typeMap.default
}

const getFileExtension = (filename) => {
  return filename.split('.').pop().toUpperCase()
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatRelativeTime = (dateString) => {
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now - date) / 1000)
    
    if (diffInSeconds < 60) return 'just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`
    
    return date.toLocaleDateString()
  } catch {
    return 'unknown time'
  }
}

const getFullFileUrl = (url) => {
  if (!url) return ''
  const baseUrl = config.public.uploadBase || ''
  return url.startsWith('http') ? url : `${baseUrl}${url}`
}

const triggerFileInput = () => {
  if (fileInput.value && !props.disabled) {
    fileInput.value.click()
  }
}

const handleFileSelect = (event) => {
  const files = Array.from(event.target.files)
  addFiles(files)
  event.target.value = '' // Reset input
}

const handleDrop = (event) => {
  dragover.value = false
  if (props.disabled) return
  
  const files = Array.from(event.dataTransfer.files)
  addFiles(files)
}

const validateFile = (file) => {
  const errors = []
  
  // Check file size
  if (file.size > props.maxSize) {
    errors.push(`File size exceeds ${props.maxSize / (1024 * 1024)}MB limit`)
  }
  
  // Check file type
  const ext = file.name.split('.').pop().toLowerCase()
  const allowedExts = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx']
  if (!allowedExts.includes(ext)) {
    errors.push('File type not supported')
  }
  
  // Check total number of files
  const totalFiles = selectedFiles.value.length + props.initialFiles.length
  if (totalFiles >= props.maxFiles) {
    errors.push(`Maximum ${props.maxFiles} files allowed`)
  }
  
  return errors.length > 0 ? errors.join(', ') : null
}

const addFiles = (files) => {
  if (props.disabled) return
  
  files.forEach(file => {
    const error = validateFile(file)
    
    selectedFiles.value.push({
      id: Date.now() + Math.random(),
      file: file,
      name: file.name,
      size: file.size,
      type: file.type,
      error: error,
      progress: 0,
      uploading: false
    })
  })
  
  emit('files-updated', getCombinedFiles())
}

const getCombinedFiles = () => {
  return [
    ...props.initialFiles,
    ...selectedFiles.value.map(f => ({
      id: f.id,
      name: f.name,
      size: f.size,
      type: f.type,
      file: f.file,
      uploading: f.uploading
    }))
  ]
}

const removeExistingFile = (fileId) => {
  if (props.disabled) return
  
  const updatedFiles = props.initialFiles.filter(file => file.id !== fileId)
  emit('files-updated', [
    ...updatedFiles,
    ...selectedFiles.value.map(f => ({
      id: f.id,
      name: f.name,
      size: f.size,
      type: f.type,
      file: f.file,
      uploading: f.uploading
    }))
  ])
}

const removeSelectedFile = (index) => {
  if (props.disabled || isUploading.value) return
  
  selectedFiles.value.splice(index, 1)
  emit('files-updated', getCombinedFiles())
}

const clearAllFiles = () => {
  if (props.disabled || isUploading.value) return
  
  if (confirm('Remove all selected files?')) {
    selectedFiles.value = []
    emit('files-updated', getCombinedFiles())
  }
}

const getUploadStatus = (file) => {
  if (file.error) return 'Error'
  if (file.uploading) return 'Uploading...'
  if (file.progress === 100) return 'Uploaded'
  return 'Ready to upload'
}

const getUploadStatusClass = (file) => {
  if (file.error) return 'status-error'
  if (file.uploading) return 'status-uploading'
  if (file.progress === 100) return 'status-uploaded'
  return 'status-ready'
}

const uploadFiles = async () => {
  if (!canUpload.value || isUploading.value) return
  
  isUploading.value = true
  setUploadStatus('info', '📤 Uploading Files', 'Please wait while files are being uploaded...', false)
  
  try {
    const formData = new FormData()
    
    // Add files to FormData
    selectedFiles.value.forEach((fileObj, index) => {
      if (fileObj.file && !fileObj.error) {
        formData.append(`files`, fileObj.file)
        fileObj.uploading = true
        fileObj.progress = 0
      }
    })
    
    // Add advert ID if available
    if (props.advertId) {
      formData.append('refId', props.advertId)
      formData.append('ref', 'api::advert.advert')
      formData.append('field', 'attachments')
    }
    
    // Simulate upload progress (in real implementation, use axios or fetch with progress)
    // For now, we'll simulate progress
    selectedFiles.value.forEach((fileObj, index) => {
      if (fileObj.file && !fileObj.error) {
        simulateUploadProgress(fileObj, index)
      }
    })
    
    // In a real implementation, you would make an API call here:
    /*
    const response = await fetch(`${config.public.apiBase}/upload`, {
      method: 'POST',
      body: formData
    })
    
    if (!response.ok) {
      throw new Error('Upload failed')
    }
    
    const result = await response.json()
    */
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Mark files as uploaded
    selectedFiles.value.forEach(fileObj => {
      if (fileObj.file && !fileObj.error) {
        fileObj.uploading = false
        fileObj.progress = 100
      }
    })
    
    setUploadStatus('success', '✅ Upload Complete', 'All files have been uploaded successfully!', true)
    emit('upload-complete', getCombinedFiles())
    
    // Clear selected files after successful upload
    setTimeout(() => {
      selectedFiles.value = []
      clearUploadStatus()
    }, 3000)
    
  } catch (error) {
    console.error('Upload failed:', error)
    setUploadStatus('error', '❌ Upload Failed', error.message || 'Failed to upload files', true)
    emit('upload-error', error)
    
    // Reset upload states
    selectedFiles.value.forEach(fileObj => {
      fileObj.uploading = false
      fileObj.progress = 0
    })
  } finally {
    isUploading.value = false
  }
}

const simulateUploadProgress = (fileObj, index) => {
  let progress = 0
  const interval = setInterval(() => {
    if (progress >= 100) {
      clearInterval(interval)
      fileObj.uploading = false
      return
    }
    
    progress += Math.random() * 20
    if (progress > 100) progress = 100
    
    fileObj.progress = progress
  }, 200)
}

const setUploadStatus = (type, title, message, dismissible = true) => {
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  }
  
  uploadStatus.value = {
    type,
    icon: icons[type] || 'ℹ️',
    title,
    message,
    dismissible
  }
}

const clearUploadStatus = () => {
  uploadStatus.value = null
}

// Watch for initialFiles changes
watch(() => props.initialFiles, () => {
  // Re-emit combined files when initial files change
  emit('files-updated', getCombinedFiles())
}, { deep: true })
</script>

<style scoped>

@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');

.file-upload { 
  --navy:#003366; --navy-light:#004080; --red:#E31E24; --blue:#0066CC; --blue-lt:#EEF4FF;
  --surface:#FFFFFF; --page-bg:#F0F4F8; --border:#D1D9E0; --border-lt:#E8ECF0;
  --text-1:#0F172A; --text-2:#334155; --text-3:#64748B; --text-4:#94A3B8;
  --green-text:#166534; --green-bg:#F0FDF4; --green-bd:#86EFAC;
  --red-text:#991B1B; --red-bg:#FEF2F2; --red-bd:#FECACA;
  --amber-text:#78350F; --amber-bg:#FFFBEB; --amber-bd:#FCD34D;
  --radius:2px; --ring:0 0 0 3px rgba(0,102,204,.15);
  --shadow-sm:0 1px 3px rgba(0,0,0,.07),0 1px 2px rgba(0,0,0,.05);
  --shadow-md:0 4px 16px rgba(0,0,0,.08),0 2px 6px rgba(0,0,0,.05);
  --t:140ms ease; --font:"IBM Plex Sans",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;

  background: var(--surface); border-radius: var(--radius);
  box-shadow: var(--shadow-sm); overflow: hidden;
  font-family: var(--font); font-size: 13px;
}

.section-header {
  padding: 12px 20px; background: var(--navy);
  display: flex; flex-direction: column; gap: 2px;
}
.section-header h3 { margin: 0; color: #fff; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .07em; }
.section-subtitle { color: rgba(255,255,255,.6); font-size: 11px; }

.existing-files-section { border-bottom: 1px solid var(--border-lt); }
.existing-files-section .section-header {
  background: var(--page-bg); flex-direction: row; align-items: center;
  justify-content: space-between; border-bottom: 1px solid var(--border-lt);
}
.existing-files-section .section-header h4 { color: var(--text-2); font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; }
.file-count {
  height: 20px; padding: 0 8px; display: inline-flex; align-items: center;
  background: var(--navy); color: #fff; font-size: 10px; font-weight: 700; border-radius: 1px;
}

.existing-files-list, .selected-files-list { display: flex; flex-direction: column; }

.existing-file-item, .selected-file-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 20px; border-bottom: 1px solid var(--border-lt); background: var(--surface);
  transition: background var(--t);
}
.existing-file-item:last-child, .selected-file-item:last-child { border-bottom: none; }
.existing-file-item:nth-child(even), .selected-file-item:nth-child(even) { background: var(--page-bg); }
.existing-file-item:hover, .selected-file-item:hover { background: var(--blue-lt); }

.file-preview { display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0; }
.file-icon {
  width: 38px; height: 38px; border-radius: var(--radius);
  display: flex; align-items: center; justify-content: center;
  font-size: 1.2em; flex-shrink: 0; border: 1px solid var(--border-lt);
  background: var(--page-bg);
}
.type-pdf   { background: var(--red-bg);   border-color: var(--red-bd);   color: var(--red-text); }
.type-image { background: #ECFEFF;          border-color: #67E8F9;         color: #155E75; }
.type-doc   { background: var(--blue-lt);   border-color: rgba(0,102,204,.2); color: var(--blue); }
.type-other { background: var(--page-bg);   border-color: var(--border);   color: var(--text-3); }

.file-details { flex: 1; min-width: 0; }
.file-name { font-size: 13px; font-weight: 500; color: var(--text-1); margin-bottom: 3px; word-break: break-word; }
.file-meta { display: flex; gap: 8px; font-size: 11px; color: var(--text-4); flex-wrap: wrap; }
.file-status { font-weight: 600; }
.status-ready    { color: var(--green-text); }
.status-uploading { color: var(--blue); }
.status-uploaded  { color: #0891b2; }
.status-error     { color: var(--red-text); }
.file-error { color: var(--red-text); font-size: 11px; margin-top: 3px; }

.upload-progress { display: flex; align-items: center; gap: 8px; margin-top: 6px; }
.progress-bar {
  flex: 1; height: 4px; background: var(--border-lt);
  border-radius: 2px; overflow: hidden;
}
.progress-fill { height: 100%; background: var(--blue); transition: width .3s; }
.progress-text { font-size: 11px; color: var(--text-3); min-width: 32px; }

.file-actions { display: flex; gap: 6px; flex-shrink: 0; }

.new-files-section { }

.upload-area {
  margin: 16px 20px; border: 1.5px dashed var(--border);
  border-radius: var(--radius); background: var(--page-bg);
  transition: border-color var(--t), background var(--t); cursor: pointer;
}
.upload-area.drag-over { border-color: var(--blue); background: var(--blue-lt); }

.upload-content {
  display: flex; flex-direction: column; align-items: center;
  padding: 28px 16px; gap: 10px; position: relative;
}
.upload-icon { font-size: 2em; opacity: .4; }
.upload-text { text-align: center; }
.upload-text strong { color: var(--text-2); font-size: 13px; }
.upload-text p { margin: 4px 0 0; font-size: 11px; color: var(--text-4); }

.file-input { position: absolute; inset: 0; opacity: 0; cursor: pointer; width: 100%; height: 100%; }

.btn {
  display: inline-flex; align-items: center; gap: 6px;
  height: 34px; padding: 0 14px; border: none; border-radius: var(--radius);
  font-family: var(--font); font-size: 12px; font-weight: 600; cursor: pointer;
  transition: all var(--t); white-space: nowrap;
}
.btn:disabled { opacity: .45; cursor: not-allowed; }
.btn:active:not(:disabled) { transform: scale(.97); }

.btn-browse { background: var(--navy); color: #fff; position: relative; z-index: 1; }
.btn-browse:hover { background: var(--navy-light); }
.btn-view { background: var(--blue-lt); color: var(--blue); border: 1px solid rgba(0,102,204,.2); text-decoration: none; }
.btn-view:hover { background: #dce9ff; }
.btn-remove { background: var(--red-bg); color: var(--red-text); border: 1px solid var(--red-bd); }
.btn-remove:hover { background: var(--red-bd); }
.btn-clear { background: var(--page-bg); color: var(--text-2); border: 1.5px solid var(--border); }
.btn-clear:hover { background: #E2E8F0; }

.selected-files { border-top: 1px solid var(--border-lt); }
.selected-files-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 8px 20px; background: var(--page-bg); border-bottom: 1px solid var(--border-lt);
}
.selected-files-header h4 { margin: 0; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: var(--text-2); }

.uploading-indicator { width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; }

.spinner, .spinner-small {
  display: inline-block; width: 16px; height: 16px;
  border: 2px solid var(--border); border-top-color: var(--blue);
  border-radius: 50%; animation: spin .7s linear infinite;
}
.spinner-small { width: 13px; height: 13px; }
@keyframes spin { to { transform: rotate(360deg); } }

.upload-actions {
  display: flex; justify-content: flex-end; padding: 12px 20px;
  background: var(--page-bg); border-top: 1px solid var(--border-lt);
}
.upload-actions .btn-primary {
  background: var(--navy); color: #fff; height: 38px; padding: 0 20px; font-size: 13px;
}
.upload-actions .btn-primary:hover:not(:disabled) { background: var(--navy-light); }
.upload-actions .btn-primary:disabled { opacity: .45; cursor: not-allowed; }

.upload-status {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 12px 20px; border-top: 1px solid var(--border-lt); font-size: 12px;
}
.upload-status.success { background: var(--green-bg); border-left: 3px solid #16a34a; color: var(--green-text); }
.upload-status.error   { background: var(--red-bg);   border-left: 3px solid var(--red); color: var(--red-text); }
.upload-status.warning { background: var(--amber-bg); border-left: 3px solid #d97706; color: var(--amber-text); }
.upload-status.info    { background: var(--blue-lt);  border-left: 3px solid var(--blue); color: var(--blue); }
.status-icon { font-size: 1em; flex-shrink: 0; margin-top: 1px; }
.status-content { flex: 1; }
.status-content strong { display: block; margin-bottom: 2px; font-size: 12px; }
.status-content p { margin: 0; }
.btn-close-status {
  background: none; border: none; font-size: 1.1em; cursor: pointer;
  color: inherit; opacity: .6; padding: 0 4px; transition: opacity var(--t);
}
.btn-close-status:hover { opacity: 1; }

.upload-info {
  display: flex; gap: 10px; padding: 12px 20px;
  background: var(--blue-lt); border-top: 1px solid rgba(0,102,204,.1);
  font-size: 12px;
}
.info-icon { font-size: 1em; flex-shrink: 0; margin-top: 1px; }
.info-content strong { display: block; margin-bottom: 4px; font-weight: 700; color: var(--navy); font-size: 11px; text-transform: uppercase; letter-spacing: .05em; }
.info-content ul { margin: 0; padding-left: 16px; color: var(--text-3); }
.info-content li { margin-bottom: 2px; }

@media (max-width: 768px) {
  .existing-file-item, .selected-file-item { flex-direction: column; align-items: stretch; gap: 8px; padding: 12px 16px; }
  .file-actions { width: 100%; justify-content: flex-end; }
  .selected-files-header { flex-direction: column; gap: 8px; }
  .upload-info { flex-direction: column; }
}

</style>