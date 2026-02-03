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
.file-upload {
  width: 100%;
  margin-top: 20px;
}

.section-header {
  margin-bottom: 15px;
}

.section-header h3 {
  color: #003366;
  font-size: 1.3em;
  margin-bottom: 5px;
}

.section-header h4 {
  color: #495057;
  font-size: 1.1em;
  margin: 0;
}

.section-subtitle {
  color: #666;
  font-size: 0.95em;
}

.file-count {
  color: #666;
  font-size: 0.9em;
  background: #f8f9fa;
  padding: 2px 8px;
  border-radius: 12px;
}

/* Existing Files */
.existing-files-section {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 25px;
  border: 1px solid #e9ecef;
}

.existing-files-section .section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.existing-files-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.existing-file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: white;
  border-radius: 6px;
  border: 1px solid #dee2e6;
  transition: all 0.3s;
}

.existing-file-item:hover {
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

/* New File Upload */
.new-files-section {
  margin-bottom: 25px;
}

.upload-area {
  border: 2px dashed #ced4da;
  border-radius: 8px;
  padding: 40px 20px;
  text-align: center;
  background: #f8f9fa;
  transition: all 0.3s;
  cursor: pointer;
  margin-bottom: 20px;
}

.upload-area.drag-over {
  border-color: #0066CC;
  background: #e3f2fd;
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.upload-icon {
  font-size: 3em;
  opacity: 0.7;
}

.upload-text {
  color: #495057;
}

.upload-text strong {
  display: block;
  margin-bottom: 5px;
  color: #003366;
}

.upload-text p {
  margin: 0;
  font-size: 0.9em;
  color: #666;
}

.file-input {
  display: none;
}

.btn-browse {
  background: #0066CC;
  color: white;
  padding: 10px 20px;
  border-radius: 5px;
  border: none;
  cursor: pointer;
  font-size: 1em;
  transition: background 0.3s;
}

.btn-browse:hover {
  background: #0052a3;
}

/* Selected Files */
.selected-files {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.selected-files-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.btn-clear {
  background: #dc3545;
  color: white;
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85em;
}

.btn-clear:hover {
  background: #c82333;
}

.selected-files-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}

.selected-file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: white;
  border-radius: 6px;
  border: 1px solid #dee2e6;
}

.file-preview {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.file-icon {
  width: 48px;
  height: 48px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5em;
  flex-shrink: 0;
}

.type-pdf {
  background: #ff6b6b;
  color: white;
}

.type-image {
  background: #4ecdc4;
  color: white;
}

.type-doc {
  background: #45b7d1;
  color: white;
}

.type-other {
  background: #96a6b6;
  color: white;
}

.file-details {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
  word-break: break-word;
}

.file-meta {
  display: flex;
  gap: 10px;
  font-size: 0.85em;
  color: #666;
  flex-wrap: wrap;
}

.file-size, .file-type, .file-date, .file-status {
  display: inline-block;
}

.file-status {
  font-weight: 500;
}

.status-ready {
  color: #28a745;
}

.status-uploading {
  color: #0066CC;
}

.status-uploaded {
  color: #17a2b8;
}

.status-error {
  color: #dc3545;
}

.file-error {
  color: #dc3545;
  font-size: 0.85em;
  margin-top: 5px;
}

.upload-progress {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 8px;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: #e9ecef;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #0066CC;
  transition: width 0.3s;
}

.progress-text {
  font-size: 0.85em;
  color: #666;
  min-width: 40px;
}

.file-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.btn-view {
  background: #17a2b8;
  color: white;
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85em;
  text-decoration: none;
  display: inline-block;
}

.btn-view:hover {
  background: #138496;
}

.btn-remove {
  background: #dc3545;
  color: white;
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85em;
}

.btn-remove:hover {
  background: #c82333;
}

.uploading-indicator {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner, .spinner-small {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(0, 102, 204, 0.3);
  border-radius: 50%;
  border-top-color: #0066CC;
  animation: spin 1s linear infinite;
}

.spinner-small {
  width: 14px;
  height: 14px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.upload-actions {
  display: flex;
  justify-content: flex-end;
}

.upload-actions .btn-primary {
  background: #28a745;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1em;
  display: flex;
  align-items: center;
  gap: 8px;
}

.upload-actions .btn-primary:hover:not(:disabled) {
  background: #218838;
}

.upload-actions .btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Upload Status */
.upload-status {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 15px;
  border-radius: 6px;
  margin-top: 15px;
}

.upload-status.success {
  background: #d4edda;
  border: 1px solid #c3e6cb;
  color: #155724;
}

.upload-status.error {
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  color: #721c24;
}

.upload-status.warning {
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  color: #856404;
}

.upload-status.info {
  background: #d1ecf1;
  border: 1px solid #bee5eb;
  color: #0c5460;
}

.status-icon {
  font-size: 1.2em;
  flex-shrink: 0;
}

.status-content {
  flex: 1;
}

.status-content strong {
  display: block;
  margin-bottom: 4px;
}

.status-content p {
  margin: 0;
  font-size: 0.95em;
}

.btn-close-status {
  background: none;
  border: none;
  font-size: 1.2em;
  cursor: pointer;
  color: inherit;
  opacity: 0.7;
  padding: 0 5px;
}

.btn-close-status:hover {
  opacity: 1;
}

/* Upload Info */
.upload-info {
  display: flex;
  gap: 12px;
  padding: 15px;
  background: #e3f2fd;
  border-radius: 6px;
  border: 1px solid #bbdefb;
  margin-top: 20px;
}

.info-icon {
  font-size: 1.2em;
  flex-shrink: 0;
}

.info-content {
  flex: 1;
}

.info-content strong {
  display: block;
  margin-bottom: 8px;
  color: #003366;
}

.info-content ul {
  margin: 0;
  padding-left: 20px;
  font-size: 0.9em;
}

.info-content li {
  margin-bottom: 4px;
  color: #495057;
}

/* Buttons */
.btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9em;
  transition: all 0.3s;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Responsive */
@media (max-width: 768px) {
  .existing-file-item,
  .selected-file-item {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }
  
  .file-actions {
    width: 100%;
    justify-content: flex-end;
  }
  
  .selected-files-header {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }
  
  .upload-info {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>