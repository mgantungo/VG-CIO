<template>
  <div class="file-upload">
    <div 
      class="file-upload-area"
      :class="{ 'dragover': isDragging }"
      @dragover.prevent="handleDragOver"
      @dragleave="handleDragLeave"
      @drop.prevent="handleDrop"
      @click="triggerFileInput"
    >
      <div class="upload-icon">📁</div>
      <h3>Upload Advert Materials</h3>
      <p>Click to browse or drag and drop files here</p>
      <p class="file-types">
        Supported: Word, PDF, Images (JPG, PNG), Videos (MP4, MOV)
      </p>
      <input 
        type="file" 
        ref="fileInput"
        multiple 
        style="display: none;" 
        accept=".doc,.docx,.pdf,.jpg,.jpeg,.png,.mp4,.mov"
        @change="handleFileSelect"
      >
    </div>

    <div v-if="files.length > 0" class="uploaded-files">
      <h4>Uploaded Files ({{ files.length }})</h4>
      <div v-for="file in files" :key="file.id" class="file-item">
        <div class="file-info">
          <div class="file-icon">{{ getFileIcon(file.name) }}</div>
          <div>
            <strong>{{ file.name }}</strong>
            <div class="file-meta">
              {{ formatFileSize(file.size) }}
              <span v-if="file.progress !== undefined">
                • {{ file.progress }}% uploaded
              </span>
              <span v-else-if="file.uploadedAt">
                • {{ formatDate(file.uploadedAt) }}
              </span>
            </div>
          </div>
        </div>
        <div class="file-actions">
          <button 
            v-if="file.progress !== undefined"
            class="btn btn-warning btn-sm"
            @click="cancelUpload(file.id)"
          >
            Cancel
          </button>
          <button 
            v-else
            class="btn btn-info btn-sm"
            @click="previewFile(file)"
          >
            Preview
          </button>
          <button 
            class="btn btn-danger btn-sm"
            @click="removeFile(file.id)"
          >
            Remove
          </button>
        </div>
      </div>
      
      <div v-if="uploading" class="upload-progress">
        <div class="progress-bar">
          <div 
            class="progress-fill"
            :style="{ width: `${uploadProgress}%` }"
          ></div>
        </div>
        <div class="progress-info">
          Uploading {{ currentUpload }} of {{ files.length }} files
          ({{ uploadProgress }}%)
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const emit = defineEmits(['files-updated'])

const fileInput = ref(null)
const files = ref([])
const isDragging = ref(false)
const uploading = ref(false)
const uploadProgress = ref(0)

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
  const fileObjects = newFiles.map(file => ({
    id: Date.now() + Math.random(),
    name: file.name,
    size: file.size,
    file: file,
    progress: 0
  }))
  
  files.value.push(...fileObjects)
  emitFilesUpdate()
}

const removeFile = (fileId) => {
  files.value = files.value.filter(f => f.id !== fileId)
  emitFilesUpdate()
}

const cancelUpload = (fileId) => {
  // Implement upload cancellation
  removeFile(fileId)
}

const previewFile = (file) => {
  // Implement file preview
  console.log('Preview file:', file.name)
}

const getFileIcon = (filename) => {
  const ext = filename.split('.').pop().toLowerCase()
  if (['doc', 'docx'].includes(ext)) return '📄'
  if (['pdf'].includes(ext)) return '📕'
  if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return '🖼️'
  if (['mp4', 'mov', 'avi'].includes(ext)) return '🎬'
  return '📎'
}

const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

const formatDate = (date) => {
  return new Date(date).toLocaleString()
}

const emitFilesUpdate = () => {
  emit('files-updated', files.value)
}

const currentUpload = computed(() => {
  return files.value.filter(f => f.progress === 100).length + 1
})
</script>

<style scoped>
.file-upload {
  margin-top: 30px;
}

.file-upload-area {
  border: 2px dashed #DDDDDD;
  border-radius: 10px;
  padding: 40px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  margin-bottom: 20px;
}

.file-upload-area:hover {
  border-color: #0066CC;
  background: rgba(0, 102, 204, 0.05);
}

.file-upload-area.dragover {
  border-color: #E31E24;
  background: rgba(227, 30, 36, 0.05);
}

.upload-icon {
  font-size: 3em;
  color: #0066CC;
  margin-bottom: 15px;
}

.file-upload-area h3 {
  color: #003366;
  margin-bottom: 10px;
}

.file-upload-area p {
  color: #666;
  margin-bottom: 5px;
}

.file-types {
  color: #999;
  font-size: 0.9em;
  margin-top: 10px;
}

.uploaded-files {
  margin-top: 20px;
}

.uploaded-files h4 {
  color: #003366;
  margin-bottom: 15px;
}

.file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #F5F5F5;
  border-radius: 5px;
  margin-bottom: 10px;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}

.file-icon {
  width: 40px;
  height: 40px;
  background: #0066CC;
  color: white;
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2em;
}

.file-meta {
  font-size: 0.85em;
  color: #666;
  margin-top: 4px;
}

.file-actions {
  display: flex;
  gap: 8px;
}

.btn {
  padding: 6px 12px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.9em;
  transition: all 0.3s;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 0.9em;
}

.btn-info {
  background: #17a2b8;
  color: white;
}

.btn-info:hover {
  background: #138496;
}

.btn-warning {
  background: #ffc107;
  color: #333333;
}

.btn-warning:hover {
  background: #e0a800;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover {
  background: #c82333;
}

.upload-progress {
  margin-top: 20px;
  padding: 15px;
  background: white;
  border-radius: 5px;
  border: 1px solid #DDDDDD;
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
  text-align: center;
  color: #666;
  font-size: 0.9em;
}
</style>