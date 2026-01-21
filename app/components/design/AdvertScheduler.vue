<!-- components/design/AdvertScheduler.vue -->
<template>
  <div v-if="show" class="scheduler-modal-overlay" @click.self="close">
    <div class="scheduler-modal">
      <div class="modal-header">
        <h2>Schedule Advert</h2>
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
          <div class="info-row">
            <strong>Platform:</strong>
            <span>{{ advert.platform }}</span>
          </div>
        </div>

        <form @submit.prevent="submitSchedule">
          <!-- 1. Date to Run -->
          <div class="form-section">
            <h3>Schedule Details</h3>
            
            <div class="form-group">
              <label>Date to Run *</label>
              <input 
                type="date" 
                v-model="scheduleDate"
                :min="minDate"
                :max="maxDate"
                class="date-input"
                required
                :class="{ 'error': errors.scheduleDate }"
                @input="clearError('scheduleDate')"
              >
              <div v-if="errors.scheduleDate" class="error-message">
                {{ errors.scheduleDate }}
              </div>
            </div>

            <!-- 2. Run Time (only show if not Print Media) -->
            <div v-if="advert?.platform !== 'Print Media'" class="form-group">
              <label>Run Time *</label>
              <div class="time-input-group">
                <select v-model="runHour" class="time-select" required>
                  <option value="">Hour</option>
                  <option v-for="h in 12" :key="h" :value="h">{{ h }}</option>
                </select>
                <span>:</span>
                <select v-model="runMinute" class="time-select" required>
                  <option value="">Minute</option>
                  <option v-for="m in 60" :key="m" :value="m">{{ m.toString().padStart(2, '0') }}</option>
                </select>
                <select v-model="runPeriod" class="period-select" required>
                  <option value="">AM/PM</option>
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
              <div v-if="errors.runTime" class="error-message">
                {{ errors.runTime }}
              </div>
            </div>
          </div>

          <!-- 3. Upload Media with Preview -->
          <div class="form-section">
            <h3>Media Files</h3>
            
            <div class="upload-section">
              <div 
                class="upload-area"
                :class="{ 'dragover': isDragging, 'has-files': mediaFiles.length > 0 }"
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
                
                <div v-if="mediaFiles.length === 0" class="upload-prompt">
                  <div class="upload-icon">📤</div>
                  <h4>Drop media files here or click to browse</h4>
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
                    <h4>{{ mediaFiles.length }} file(s) selected</h4>
                    <button 
                      type="button" 
                      class="btn btn-secondary btn-sm"
                      @click="triggerFileInput"
                    >
                      Add More
                    </button>
                  </div>
                  
                  <div class="files-list">
                    <div v-for="(file, index) in mediaFiles" :key="index" class="file-preview">
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
          </div>

          <!-- Preview section for media files -->
          <div v-if="mediaFiles.length > 0" class="form-section">
            <h3>Media Preview</h3>
            <div class="media-preview-container">
              <div v-for="(file, index) in mediaFiles" :key="index" class="media-preview">
                <div class="preview-header">
                  <span class="preview-title">{{ file.name }}</span>
                  <span class="preview-size">{{ formatFileSize(file.size) }}</span>
                </div>
                <div class="preview-content">
                  <div v-if="isImage(file)" class="image-preview">
                    <img :src="getObjectURL(file)" :alt="file.name" class="preview-image">
                  </div>
                  <div v-else-if="isVideo(file)" class="video-preview">
                    <video controls class="preview-video">
                      <source :src="getObjectURL(file)" :type="file.type">
                      Your browser does not support the video tag.
                    </video>
                  </div>
                  <div v-else class="file-preview-icon">
                    <div class="icon-large">{{ getFileIcon(file.name) }}</div>
                    <span class="file-type">{{ getFileExtension(file.name) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="scheduling" class="scheduling-progress">
            <h4>Scheduling Advert...</h4>
            <div class="progress-bar">
              <div class="progress-fill indeterminate"></div>
            </div>
            <div class="progress-info">
              Please wait while we schedule your advert...
            </div>
          </div>

          <div v-if="scheduleError" class="error-alert">
            <div class="error-icon">⚠️</div>
            <div class="error-message">{{ scheduleError }}</div>
          </div>

          <div class="modal-footer">
            <div class="footer-actions">
              <button 
                type="button" 
                class="btn btn-secondary"
                @click="close"
                :disabled="scheduling"
              >
                Cancel
              </button>
              
              <button 
                type="submit" 
                class="btn btn-primary"
                :disabled="scheduling || !scheduleDate || mediaFiles.length === 0"
              >
                <span v-if="scheduling">
                  <span class="processing-spinner"></span>
                  Scheduling...
                </span>
                <span v-else>
                  Schedule Advert
                </span>
              </button>
            </div>
            
            <div class="upload-stats">
              <span>Total size: {{ formatFileSize(totalFileSize) }}</span>
              <span v-if="mediaFiles.length > 0">{{ mediaFiles.length }} file(s)</span>
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useAdverts } from '~/composables/useAdverts'

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

const emit = defineEmits(['close', 'scheduled'])

// Import the scheduleAdvert function from useAdverts
const { scheduleAdvert } = useAdverts()

// Local state
const fileInput = ref(null)
const mediaFiles = ref([])
const scheduleDate = ref('')
const runHour = ref('')
const runMinute = ref('')
const runPeriod = ref('')
const isDragging = ref(false)
const errors = ref({})
const scheduling = ref(false)
const scheduleError = ref('')

// Constants
const acceptedFileTypes = '.jpg,.jpeg,.png,.gif,.mp4,.mov,.avi,.wmv,.pdf,.psd,.ai,.eps,.svg'
const supportedFileTypes = 'Images, Videos, PDF, Design Files'
const maxFileSizeMB = 100
const maxTotalSizeMB = 1000

// Computed
const totalFileSize = computed(() => {
  return mediaFiles.value.reduce((sum, file) => sum + file.size, 0)
})

const minDate = computed(() => {
  const today = new Date()
  today.setDate(today.getDate() + 1) // Can't schedule for today
  return today.toISOString().split('T')[0]
})

const maxDate = computed(() => {
  const max = new Date()
  max.setFullYear(max.getFullYear() + 1) // Max 1 year in advance
  return max.toISOString().split('T')[0]
})

const formattedRunTime = computed(() => {
  if (!runHour.value || !runMinute.value || !runPeriod.value) return ''
  const hour = runHour.value.padStart(2, '0')
  const minute = runMinute.value.padStart(2, '0')
  return `${hour}:${minute} ${runPeriod.value}`
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
    
    // Check file type
    const fileExtension = file.name.split('.').pop().toLowerCase()
    const acceptedExtensions = acceptedFileTypes.replace(/\./g, '').split(',')
    if (!acceptedExtensions.includes(fileExtension)) {
      newErrors.push(`${file.name}: File type not supported`)
      return
    }
    
    // Check if file already added
    const isDuplicate = mediaFiles.value.some(f => f.name === file.name && f.size === file.size)
    if (isDuplicate) {
      newErrors.push(`${file.name}: File already added`)
      return
    }
    
    validFiles.push(file)
  })
  
  if (newErrors.length > 0) {
    alert('Some files could not be added:\n' + newErrors.join('\n'))
  }
  
  mediaFiles.value = [...mediaFiles.value, ...validFiles]
  
  // Check total size
  if (totalFileSize.value > maxTotalSizeMB * 1024 * 1024) {
    alert(`Total file size exceeds ${maxTotalSizeMB}MB limit. Please remove some files.`)
  }
}

const removeFile = (index) => {
  mediaFiles.value.splice(index, 1)
}

const clearError = (field) => {
  if (errors.value[field]) {
    delete errors.value[field]
  }
}

const validateForm = () => {
  errors.value = {}
  
  if (!scheduleDate.value) {
    errors.value.scheduleDate = 'Schedule date is required'
    return false
  }
  
  // Validate date is not in the past
  const selectedDate = new Date(scheduleDate.value)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  if (selectedDate < today) {
    errors.value.scheduleDate = 'Cannot schedule in the past'
    return false
  }
  
  // Validate run time for non-print media
  if (props.advert?.platform !== 'Print Media') {
    if (!runHour.value || !runMinute.value || !runPeriod.value) {
      errors.value.runTime = 'Run time is required for this platform'
      return false
    }
  }
  
  if (mediaFiles.value.length === 0) {
    alert('Please select at least one media file')
    return false
  }
  
  if (totalFileSize.value > maxTotalSizeMB * 1024 * 1024) {
    alert(`Total file size exceeds ${maxTotalSizeMB}MB limit`)
    return false
  }
  
  return true
}

const submitSchedule = async () => {
  if (!validateForm()) return
  
  if (!props.advert || !props.advert.id) {
    alert('No advert selected')
    return
  }
  
  scheduling.value = true
  scheduleError.value = ''
  
  try {
    // Prepare schedule data
    const scheduleData = {
      advertId: props.advert.id,
      runDate: scheduleDate.value,
      mediaFiles: mediaFiles.value, // This should be an array of File objects
      isPublished: false
    }
    
    // Add run time for non-print media
    if (props.advert.platform !== 'Print Media') {
      scheduleData.runTime = [formattedRunTime.value]
    }
    
    console.log('📤 Sending schedule data:', scheduleData)
    console.log('📁 Files to upload:', mediaFiles.value.map(f => ({
      name: f.name,
      size: f.size,
      type: f.type
    })))
    
    // Call the scheduleAdvert function
    const result = await scheduleAdvert(scheduleData)
    
    console.log('✅ Schedule response:', result)
    
    if (result && result.success) {
      alert(`✅ Successfully scheduled ${props.advert.reference} for ${scheduleDate.value}`)
      
      // Emit success event
      emit('scheduled', {
        advertId: props.advert.id,
        scheduleDate: scheduleDate.value,
        runTime: formattedRunTime.value,
        fileCount: mediaFiles.value.length,
        scheduleId: result.data?.schedule?.id,
        result: result
      })
      
      // Reset form
      resetForm()
    } else {
      throw new Error(result?.message || 'Failed to schedule advert')
    }
    
  } catch (error) {
    console.error('❌ Scheduling failed:', error)
    
    // Show more detailed error
    if (error.data) {
      console.error('Error data:', error.data)
      scheduleError.value = error.data.error || error.data.message || error.message
    } else {
      scheduleError.value = error.message || 'Failed to schedule advert'
    }
    
    alert(`❌ Scheduling failed: ${scheduleError.value}`)
  } finally {
    scheduling.value = false
  }
}

const resetForm = () => {
  mediaFiles.value = []
  scheduleDate.value = ''
  runHour.value = ''
  runMinute.value = ''
  runPeriod.value = ''
  errors.value = {}
  scheduleError.value = ''
}

const close = () => {
  if (!scheduling.value) {
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
    'jpg': '🖼️',
    'jpeg': '🖼️',
    'png': '🖼️',
    'gif': '🖼️',
    'psd': '🎨',
    'ai': '🎨',
    'eps': '🎨',
    'svg': '🎨',
    'mp4': '🎬',
    'mov': '🎬',
    'avi': '🎬',
    'wmv': '🎬'
  }
  
  return iconMap[ext] || '📎'
}

const getFileExtension = (filename) => {
  if (!filename) return ''
  return filename.split('.').pop().toUpperCase()
}

const isImage = (file) => {
  return file.type.startsWith('image/')
}

const isVideo = (file) => {
  return file.type.startsWith('video/')
}

const getObjectURL = (file) => {
  return URL.createObjectURL(file)
}

// Clean up object URLs
watch(mediaFiles, (newFiles, oldFiles) => {
  oldFiles.forEach(file => {
    if (file && (isImage(file) || isVideo(file))) {
      URL.revokeObjectURL(getObjectURL(file))
    }
  })
})

// Watch for modal visibility changes
watch(() => props.show, (newValue) => {
  if (!newValue) {
    resetForm()
  } else {
    // Set default date to tomorrow
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    scheduleDate.value = tomorrow.toISOString().split('T')[0]
    
    // Set default time to 12:00 PM for non-print media
    if (props.advert?.platform !== 'Print Media') {
      runHour.value = '12'
      runMinute.value = '00'
      runPeriod.value = 'PM'
    }
    
    console.log('📅 Modal opened for advert:', props.advert)
  }
})
</script>

<style scoped>
.scheduler-modal-overlay {
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

.scheduler-modal {
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

.form-section {
  margin-bottom: 30px;
}

.form-section h3 {
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

.date-input {
  width: 100%;
  max-width: 250px;
  padding: 12px 15px;
  border: 1px solid #DDDDDD;
  border-radius: 5px;
  font-size: 1em;
  transition: border-color 0.3s, box-shadow 0.3s;
}

.date-input:focus {
  outline: none;
  border-color: #0066CC;
  box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
}

.date-input.error {
  border-color: #dc3545;
  background-color: rgba(220, 53, 69, 0.05);
}

.time-input-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.time-select,
.period-select {
  padding: 12px 15px;
  border: 1px solid #DDDDDD;
  border-radius: 5px;
  background: white;
  font-size: 1em;
  min-width: 100px;
}

.time-select:focus,
.period-select:focus {
  outline: none;
  border-color: #0066CC;
}

.upload-section {
  margin-top: 15px;
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
  max-height: 200px;
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

.media-preview-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
  margin-top: 15px;
}

.media-preview {
  background: #F9F9F9;
  border: 1px solid #E5E5E5;
  border-radius: 8px;
  overflow: hidden;
}

.preview-header {
  padding: 10px 15px;
  background: #003366;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.preview-title {
  font-weight: 500;
  font-size: 0.9em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preview-size {
  font-size: 0.8em;
  opacity: 0.9;
}

.preview-content {
  padding: 15px;
  text-align: center;
}

.image-preview img {
  max-width: 100%;
  max-height: 200px;
  object-fit: contain;
  border-radius: 4px;
}

.video-preview video {
  max-width: 100%;
  max-height: 200px;
  border-radius: 4px;
}

.file-preview-icon {
  padding: 20px;
}

.icon-large {
  font-size: 3em;
  margin-bottom: 10px;
}

.file-type {
  display: block;
  color: #666;
  font-size: 0.9em;
  font-weight: 500;
}

.scheduling-progress {
  background: #F9F9F9;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.scheduling-progress h4 {
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
  .scheduler-modal {
    max-height: 95vh;
  }
  
  .modal-header,
  .modal-body {
    padding: 20px;
  }
  
  .time-input-group {
    flex-wrap: wrap;
  }
  
  .media-preview-container {
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