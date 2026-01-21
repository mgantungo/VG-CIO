<!--components/design/UploadDesign.vue - UPDATED with correct method name-->
<template>
  <div v-if="show" class="upload-modal-overlay" @click.self="close">
    <div class="upload-modal">
      <div class="modal-header">
        <h2>Upload Design Files</h2>
        <button class="modal-close" @click="close">×</button>
      </div>

      <div class="modal-body">
        <div v-if="advert" class="advert-info">
          <div class="info-row">
            <strong>Advert:</strong>
            <span>{{ advert.reference }}</span>
          </div>
          <div class="info-row">
            <strong>Client:</strong>
            <span>{{ advert.clientName }}</span>
          </div>
          <div class="info-row">
            <strong>Title:</strong>
            <span>{{ advert.advertTitle }}</span>
          </div>
        </div>

        <form @submit.prevent="submitUpload">
          <div class="upload-section">
            <h3>Select Files</h3>
            
            <div 
              class="upload-area"
              :class="{ 'dragover': isDragging, 'has-files': files.length > 0 }"
              @dragover.prevent="handleDragOver"
              @dragleave="handleDragLeave"
              @drop.prevent="handleDrop"
            >
              <input 
                type="file" 
                ref="fileInput"
                multiple 
                style="display: none;" 
                :accept="acceptedFileTypes"
                @change="handleFileSelect"
              >
              
              <div v-if="files.length === 0" class="upload-prompt">
                <div class="upload-icon">📤</div>
                <h4>Drop files here or click to browse</h4>
                <p>Supported: {{ supportedFileTypes }}</p>
                <button 
                  type="button" 
                  class="btn btn-primary"
                  @click="triggerFileInput"
                >
                  Browse Files
                </button>
              </div>
              
              <div v-else class="files-preview">
                <div class="files-header">
                  <h4>{{ files.length }} file(s) selected</h4>
                  <button 
                    type="button" 
                    class="btn btn-secondary btn-sm"
                    @click="triggerFileInput"
                  >
                    Add More
                  </button>
                </div>
                
                <div class="files-list">
                  <div v-for="(file, index) in files" :key="index" class="file-preview">
                    <div class="file-info">
                      <div class="file-icon">{{ getFileIcon(file.name) }}</div>
                      <div>
                        <div class="file-name">{{ file.name }}</div>
                        <div class="file-size">{{ formatFileSize(file.size) }}</div>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      class="btn btn-danger btn-sm"
                      @click="removeFile(index)"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="upload-limits">
              <span>Max file size: {{ maxFileSizeMB }}MB per file</span>
              <span>Total limit: {{ maxTotalSizeMB }}MB</span>
            </div>
          </div>

          <div class="upload-details">
            <h3>Upload Details</h3>
            
            <div class="form-group">
              <label>Description *</label>
              <textarea
                v-model="description"
                placeholder="Describe the files you're uploading (e.g., 'Final print files', 'TV commercial rough cut')"
                rows="3"
                required
                :class="{ 'error': errors.description }"
                @input="clearError('description')"
              ></textarea>
              <div v-if="errors.description" class="error-message">
                {{ errors.description }}
              </div>
            </div>
          </div>

          <div class="upload-progress" v-if="uploading">
            <h4>Uploading Files...</h4>
            <div class="progress-bar">
              <div class="progress-fill indeterminate"></div>
            </div>
            <div class="progress-info">
              Please wait while files are being uploaded...
            </div>
          </div>

          <div v-if="uploadError" class="error-alert">
            <div class="error-icon">⚠️</div>
            <div class="error-message">{{ uploadError }}</div>
          </div>

          <div class="modal-footer">
            <div class="footer-actions">
              <button 
                type="button" 
                class="btn btn-secondary"
                @click="close"
                :disabled="uploading"
              >
                Cancel
              </button>
              
              <button 
                type="submit" 
                class="btn btn-primary"
                :disabled="uploading || files.length === 0 || !description"
              >
                <span v-if="uploading">
                  <span class="processing-spinner"></span>
                  Uploading...
                </span>
                <span v-else>
                  Upload {{ files.length }} File(s)
                </span>
              </button>
            </div>
            
            <div class="upload-stats">
              <span>Total size: {{ formatFileSize(totalFileSize) }}</span>
              <span v-if="files.length > 0">{{ files.length }} file(s)</span>
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
.upload-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.upload-modal {
  background: white;
  border-radius: 10px;
  width: 100%;
  max-width: 700px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from { 
    transform: translateY(20px); 
    opacity: 0; 
  }
  to { 
    transform: translateY(0); 
    opacity: 1; 
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 25px 30px;
  border-bottom: 2px solid #F5F5F5;
}

.modal-header h2 {
  color: #003366;
  margin: 0;
  font-size: 1.5em;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.8em;
  color: #999;
  cursor: pointer;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s;
}

.modal-close:hover {
  background: #F5F5F5;
  color: #E31E24;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 30px;
}

.advert-info {
  background: #F9F9F9;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 30px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #E5E5E5;
}

.info-row:last-child {
  border-bottom: none;
}

.info-row strong {
  color: #666;
  font-weight: 500;
  min-width: 80px;
}

.info-row span {
  color: #333;
  text-align: right;
  flex: 1;
  font-weight: 500;
}

.upload-section {
  margin-bottom: 30px;
}

.upload-section h3 {
  color: #003366;
  margin-bottom: 15px;
  font-size: 1.2em;
  padding-bottom: 10px;
  border-bottom: 2px solid #F5F5F5;
}

.upload-area {
  border: 2px dashed #DDDDDD;
  border-radius: 8px;
  padding: 30px;
  text-align: center;
  transition: all 0.3s;
  background: #FAFAFA;
  margin-bottom: 15px;
}

.upload-area.dragover {
  border-color: #0066CC;
  background: rgba(0, 102, 204, 0.05);
}

.upload-area.has-files {
  border-style: solid;
  border-color: #28a745;
  background: rgba(40, 167, 69, 0.05);
}

.upload-prompt {
  padding: 20px;
}

.upload-icon {
  font-size: 3em;
  margin-bottom: 15px;
  color: #0066CC;
}

.upload-prompt h4 {
  color: #333;
  margin-bottom: 10px;
  font-size: 1.1em;
}

.upload-prompt p {
  color: #666;
  margin-bottom: 20px;
  font-size: 0.9em;
}

.files-preview {
  text-align: left;
}

.files-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 2px solid #E5E5E5;
}

.files-header h4 {
  color: #333;
  margin: 0;
  font-size: 1.1em;
}

.files-list {
  max-height: 300px;
  overflow-y: auto;
  padding: 10px;
}

.file-preview {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: #F9F9F9;
  border-radius: 5px;
  margin-bottom: 8px;
}

.file-preview:last-child {
  margin-bottom: 0;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.file-icon {
  width: 36px;
  height: 36px;
  background: #0066CC;
  color: white;
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2em;
  flex-shrink: 0;
}

.file-name {
  font-weight: 500;
  color: #333;
  font-size: 0.95em;
  word-break: break-word;
}

.file-size {
  color: #666;
  font-size: 0.85em;
  margin-top: 2px;
}

.upload-limits {
  display: flex;
  justify-content: space-between;
  color: #999;
  font-size: 0.85em;
}

.upload-details h3 {
  color: #003366;
  margin-bottom: 15px;
  font-size: 1.2em;
  padding-bottom: 10px;
  border-bottom: 2px solid #F5F5F5;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #333333;
  font-weight: 500;
}

.form-group textarea {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #DDDDDD;
  border-radius: 5px;
  font-size: 1em;
  transition: border-color 0.3s, box-shadow 0.3s;
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
}

.form-group textarea:focus {
  outline: none;
  border-color: #0066CC;
  box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
}

.form-group textarea.error {
  border-color: #dc3545;
  background-color: rgba(220, 53, 69, 0.05);
}

.upload-progress {
  background: #F9F9F9;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.upload-progress h4 {
  color: #333;
  margin-bottom: 15px;
  font-size: 1.1em;
}

.progress-bar {
  height: 10px;
  background: #F5F5F5;
  border-radius: 5px;
  overflow: hidden;
  margin-bottom: 10px;
}

.progress-fill {
  height: 100%;
  background: #28a745;
  transition: width 0.3s;
}

.progress-fill.indeterminate {
  width: 100%;
  animation: indeterminate 1.5s infinite;
  background: linear-gradient(90deg, #28a745 0%, #5cb85c 50%, #28a745 100%);
  background-size: 200% 100%;
}

@keyframes indeterminate {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.progress-info {
  color: #666;
  font-size: 0.9em;
  text-align: center;
}

.error-alert {
  background: #fff5f5;
  border: 1px solid #fed7d7;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 15px;
}

.error-icon {
  font-size: 1.5em;
  color: #e53e3e;
}

.modal-footer {
  padding-top: 30px;
  border-top: 2px solid #F5F5F5;
}

.footer-actions {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  margin-bottom: 20px;
}

.upload-stats {
  display: flex;
  justify-content: space-between;
  color: #666;
  font-size: 0.9em;
  padding-top: 15px;
  border-top: 1px solid #EEEEEE;
}

.error-message {
  color: #dc3545;
  font-size: 0.85em;
  margin-top: 5px;
  padding-left: 5px;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1em;
  font-weight: 500;
  transition: all 0.3s;
}

.btn-primary {
  background: #E31E24;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #c01820;
  transform: translateY(-1px);
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  background: #cccccc;
}

.btn-secondary {
  background: #0066CC;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #0052a3;
  transform: translateY(-1px);
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 0.9em;
}

.processing-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s linear infinite;
  margin-right: 8px;
  vertical-align: middle;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .upload-modal {
    max-height: 95vh;
  }
  
  .modal-header,
  .modal-body {
    padding: 20px;
  }
  
  .footer-actions {
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
  }
  
  .upload-stats {
    flex-direction: column;
    gap: 10px;
    text-align: center;
  }
}
</style>