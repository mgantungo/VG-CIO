<!--components/design/UploadDesign.vue-->
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

            <div class="form-row">
              <div class="form-group">
                <label>File Type</label>
                <select v-model="fileType">
                  <option value="">Select file type</option>
                  <option value="final">Final Design</option>
                  <option value="draft">Draft/Concept</option>
                  <option value="source">Source Files</option>
                  <option value="proof">Proof/Review</option>
                  <option value="supporting">Supporting Files</option>
                </select>
              </div>
              
              <div class="form-group">
                <label>Version</label>
                <input
                  v-model="version"
                  type="text"
                  placeholder="e.g., v1.0, Final"
                >
              </div>
            </div>

            <div class="form-group">
              <label>Tags (comma separated)</label>
              <input
                v-model="tagsInput"
                type="text"
                placeholder="e.g., print, frontpage, color"
                @input="updateTags"
              >
              <small class="field-hint">Add tags to make files easier to find</small>
              
              <div v-if="tags.length > 0" class="tags-preview">
                <span v-for="tag in tags" :key="tag" class="tag">
                  {{ tag }}
                  <button type="button" @click="removeTag(tag)">×</button>
                </span>
              </div>
            </div>

            <div class="form-group">
              <label class="checkbox-label">
                <input 
                  v-model="replaceExisting" 
                  type="checkbox"
                >
                <span>Replace existing files of same type</span>
              </label>
              
              <label class="checkbox-label">
                <input 
                  v-model="notifyTeam" 
                  type="checkbox"
                >
                <span>Notify team members about this upload</span>
              </label>
            </div>
          </div>

          <div class="upload-progress" v-if="uploading">
            <h4>Uploading Files ({{ uploadProgress }}%)</h4>
            <div class="progress-bar">
              <div 
                class="progress-fill"
                :style="{ width: `${uploadProgress}%` }"
              ></div>
            </div>
            <div class="progress-info">
              Uploading {{ currentFileIndex + 1 }} of {{ files.length }} files
              <span v-if="currentFileName">- {{ currentFileName }}</span>
            </div>
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
                :disabled="uploading || files.length === 0"
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
import { formatFileSize } from '~/utils/formatters'
import { isValidFileType, isValidFileSize } from '~/utils/validators'

const props = defineProps({
  advert: {
    type: Object,
    default: null
  },
  show: {
    type: Boolean,
    default: false
  },
  uploading: {
    type: Boolean,
    default: false
  },
  uploadProgress: {
    type: Number,
    default: 0
  },
  currentFileIndex: {
    type: Number,
    default: 0
  },
  currentFileName: {
    type: String,
    default: ''
  }
})

const emit = defineEmits([
  'submit',
  'close'
])

const fileInput = ref(null)
const files = ref([])
const description = ref('')
const fileType = ref('')
const version = ref('')
const tagsInput = ref('')
const tags = ref([])
const replaceExisting = ref(false)
const notifyTeam = ref(true)
const isDragging = ref(false)
const errors = ref({})

const acceptedFileTypes = '.pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.psd,.ai,.eps,.mp4,.mov,.avi,.zip,.rar'
const supportedFileTypes = 'PDF, Word, Images (JPG, PNG, GIF), Design (PSD, AI, EPS), Videos (MP4, MOV), Archives (ZIP, RAR)'
const maxFileSizeMB = 50
const maxTotalSizeMB = 500

const totalFileSize = computed(() => {
  return files.value.reduce((sum, file) => sum + file.size, 0)
})

const exceedsMaxTotalSize = computed(() => {
  return totalFileSize.value > maxTotalSizeMB * 1024 * 1024
})

const triggerFileInput = () => {
  fileInput.value.click()
}

const handleFileSelect = (event) => {
  const selectedFiles = Array.from(event.target.files)
  addFiles(selectedFiles)
  fileInput.value.value = ''
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
    // Check file type
    if (!isValidFileType(file, acceptedFileTypes.split(','))) {
      newErrors.push(`${file.name}: Unsupported file type`)
      return
    }
    
    // Check file size
    if (!isValidFileSize(file, maxFileSizeMB)) {
      newErrors.push(`${file.name}: File exceeds ${maxFileSizeMB}MB limit`)
      return
    }
    
    // Check for duplicates
    const isDuplicate = files.value.some(
      existingFile => existingFile.name === file.name && existingFile.size === file.size
    )
    
    if (isDuplicate) {
      newErrors.push(`${file.name}: File already added`)
      return
    }
    
    validFiles.push(file)
  })
  
  if (newErrors.length > 0) {
    alert('Some files were skipped:\n' + newErrors.join('\n'))
  }
  
  files.value.push(...validFiles)
}

const removeFile = (index) => {
  files.value.splice(index, 1)
}

const getFileIcon = (filename) => {
  const ext = filename.split('.').pop().toLowerCase()
  if (['doc', 'docx'].includes(ext)) return '📄'
  if (['pdf'].includes(ext)) return '📕'
  if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return '🖼️'
  if (['psd', 'ai', 'eps'].includes(ext)) return '🎨'
  if (['mp4', 'mov', 'avi'].includes(ext)) return '🎬'
  if (['zip', 'rar'].includes(ext)) return '🗜️'
  return '📎'
}

const updateTags = () => {
  const tagArray = tagsInput.value
    .split(',')
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0)
    .slice(0, 10) // Limit to 10 tags
    
  tags.value = [...new Set(tagArray)] // Remove duplicates
}

const removeTag = (tagToRemove) => {
  tags.value = tags.value.filter(tag => tag !== tagToRemove)
  tagsInput.value = tags.value.join(', ')
}

const validateForm = () => {
  errors.value = {}
  
  if (files.value.length === 0) {
    errors.value.files = 'Please select at least one file'
  }
  
  if (exceedsMaxTotalSize.value) {
    errors.value.files = `Total file size exceeds ${maxTotalSizeMB}MB limit`
  }
  
  if (!description.value.trim()) {
    errors.value.description = 'Description is required'
  }
  
  return Object.keys(errors.value).length === 0
}

const clearError = (field) => {
  if (errors.value[field]) {
    delete errors.value[field]
  }
}

const resetForm = () => {
  files.value = []
  description.value = ''
  fileType.value = ''
  version.value = ''
  tagsInput.value = ''
  tags.value = []
  replaceExisting.value = false
  notifyTeam.value = true
  errors.value = {}
  isDragging.value = false
}

const submitUpload = () => {
  if (!validateForm()) return
  
  const uploadData = {
    advertId: props.advert?.id,
    files: files.value,
    description: description.value.trim(),
    fileType: fileType.value,
    version: version.value,
    tags: tags.value,
    replaceExisting: replaceExisting.value,
    notifyTeam: notifyTeam.value
  }
  
  emit('submit', uploadData)
}

const close = () => {
  if (!props.uploading) {
    emit('close')
    resetForm()
  }
}

// Watch for show prop changes
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
  max-width: 800px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
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
  background: #F5F5F5;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 30px;
}

.advert-info .info-row {
  display: flex;
  margin-bottom: 8px;
}

.advert-info .info-row:last-child {
  margin-bottom: 0;
}

.advert-info .info-row strong {
  color: #666;
  font-weight: 500;
  min-width: 80px;
}

.advert-info .info-row span {
  color: #333;
  flex: 1;
}

.upload-section {
  margin-bottom: 30px;
}

.upload-section h3,
.upload-details h3 {
  color: #003366;
  margin-bottom: 15px;
  font-size: 1.2em;
}

.upload-area {
  border: 2px dashed #DDDDDD;
  border-radius: 8px;
  padding: 40px 20px;
  text-align: center;
  transition: all 0.3s;
  margin-bottom: 15px;
}

.upload-area.dragover {
  border-color: #0066CC;
  background: rgba(0, 102, 204, 0.05);
}

.upload-area.has-files {
  padding: 20px;
  text-align: left;
}

.upload-prompt {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.upload-icon {
  font-size: 3em;
  color: #0066CC;
}

.upload-prompt h4 {
  color: #333;
  margin: 0;
  font-size: 1.1em;
}

.upload-prompt p {
  color: #666;
  margin: 0;
}

.files-preview {
  width: 100%;
}

.files-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.files-header h4 {
  color: #333;
  margin: 0;
  font-size: 1.1em;
}

.files-list {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #EEEEEE;
  border-radius: 5px;
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
}

.file-name {
  font-weight: 500;
  color: #333;
  font-size: 0.95em;
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

.upload-details {
  margin-bottom: 30px;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
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

.form-group label::after {
  content: ' *';
  color: #E31E24;
  font-weight: bold;
}

.form-group label:has(+ input:not([required]))::after,
.form-group label:has(+ select:not([required]))::after,
.form-group label:has(+ textarea:not([required]))::after {
  content: '';
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #DDDDDD;
  border-radius: 5px;
  font-size: 1em;
  transition: border-color 0.3s, box-shadow 0.3s;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #0066CC;
  box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
}

.form-group textarea.error {
  border-color: #dc3545;
  background-color: rgba(220, 53, 69, 0.05);
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
}

.field-hint {
  display: block;
  margin-top: 5px;
  color: #666;
  font-size: 0.85em;
}

.tags-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: #E31E24;
  color: white;
  padding: 4px 10px;
  border-radius: 15px;
  font-size: 0.85em;
  font-weight: 500;
}

.tag button {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 1.2em;
  line-height: 1;
  padding: 0;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tag button:hover {
  color: #FFB612;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  color: #666;
  font-size: 0.95em;
  margin-bottom: 10px;
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
}

.upload-progress {
  background: #F9F9F9;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 30px;
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

.progress-info {
  color: #666;
  font-size: 0.9em;
  text-align: center;
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
  
  .form-row {
    grid-template-columns: 1fr;
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