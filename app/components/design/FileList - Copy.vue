<!--components/design/FileList.vue-->
<template>
  <div class="file-list">
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <div>Loading files...</div>
    </div>

    <div v-else-if="files.length === 0" class="empty-state">
      <div class="empty-icon">📁</div>
      <h4>No Files Available</h4>
      <p>No files have been uploaded yet.</p>
    </div>

    <div v-else class="files-container">
      <div v-for="file in files" :key="file.id" class="file-item">
        <div class="file-info" @click="$emit('preview', file)">
          <div class="file-icon" :class="getFileIconClass(file)">
            {{ getFileIcon(file) }}
          </div>
          
          <div class="file-details">
            <div class="file-name">{{ file.name }}</div>
            
            <div class="file-meta">
              <span class="file-size">{{ formatFileSize(file.size) }}</span>
              <span class="file-type">{{ getFileType(file) }}</span>
              <span class="file-date" v-if="file.uploadedAt">
                Uploaded {{ formatRelativeTime(file.uploadedAt) }}
              </span>
              <span class="file-uploader" v-if="file.uploadedBy">
                by {{ file.uploadedBy }}
              </span>
            </div>
            
            <div v-if="file.advertReference" class="file-context">
              <span class="ref-badge">{{ file.advertReference }}</span>
            </div>
          </div>
        </div>

        <div class="file-actions">
          <button 
            class="btn btn-info btn-sm"
            @click="$emit('preview', file)"
            title="Preview"
          >
            👁️
          </button>
          
          <button 
            class="btn btn-success btn-sm"
            @click="$emit('download', file)"
            title="Download"
          >
            ⬇️
          </button>
          
          <button 
            v-if="showDelete"
            class="btn btn-danger btn-sm"
            @click="$emit('delete', file)"
            title="Delete"
          >
            🗑️
          </button>
          
          <button 
            v-if="showVersion && file.version > 1"
            class="btn btn-secondary btn-sm"
            @click="$emit('versions', file)"
            title="View Versions"
          >
            🔄
          </button>
        </div>
      </div>
    </div>

    <div v-if="files.length > 0 && showStats" class="file-stats">
      <div class="stat-item">
        <span class="stat-label">Total Files:</span>
        <span class="stat-value">{{ files.length }}</span>
      </div>
      
      <div class="stat-item">
        <span class="stat-label">Total Size:</span>
        <span class="stat-value">{{ formatFileSize(totalSize) }}</span>
      </div>
      
      <div v-if="latestUpload" class="stat-item">
        <span class="stat-label">Latest:</span>
        <span class="stat-value">{{ formatRelativeTime(latestUpload.uploadedAt) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { formatFileSize, formatRelativeTime } from '~/utils/formatters'

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
    default: true
  },
  showVersion: {
    type: Boolean,
    default: true
  },
  showStats: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['preview', 'download', 'delete', 'versions'])

const totalSize = computed(() => {
  return props.files.reduce((sum, file) => sum + (file.size || 0), 0)
})

const latestUpload = computed(() => {
  if (props.files.length === 0) return null
  
  return props.files.reduce((latest, file) => {
    if (!file.uploadedAt) return latest
    if (!latest) return file
    
    const fileDate = new Date(file.uploadedAt)
    const latestDate = new Date(latest.uploadedAt)
    
    return fileDate > latestDate ? file : latest
  }, null)
})

const getFileIcon = (file) => {
  const name = file.name || ''
  const ext = name.split('.').pop().toLowerCase()
  
  if (['doc', 'docx'].includes(ext)) return '📄'
  if (['pdf'].includes(ext)) return '📕'
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(ext)) return '🖼️'
  if (['psd', 'ai', 'eps'].includes(ext)) return '🎨'
  if (['mp4', 'mov', 'avi', 'wmv'].includes(ext)) return '🎬'
  if (['mp3', 'wav', 'aac'].includes(ext)) return '🎵'
  if (['zip', 'rar', '7z'].includes(ext)) return '🗜️'
  return '📎'
}

const getFileIconClass = (file) => {
  const name = file.name || ''
  const ext = name.split('.').pop().toLowerCase()
  
  const iconClasses = {
    'doc': 'icon-doc',
    'docx': 'icon-doc',
    'pdf': 'icon-pdf',
    'jpg': 'icon-image',
    'jpeg': 'icon-image',
    'png': 'icon-image',
    'gif': 'icon-image',
    'psd': 'icon-design',
    'ai': 'icon-design',
    'mp4': 'icon-video',
    'mov': 'icon-video'
  }
  
  return iconClasses[ext] || 'icon-default'
}

const getFileType = (file) => {
  const name = file.name || ''
  const ext = name.split('.').pop().toLowerCase()
  
  const typeMap = {
    'doc': 'Word Document',
    'docx': 'Word Document',
    'pdf': 'PDF Document',
    'jpg': 'JPEG Image',
    'jpeg': 'JPEG Image',
    'png': 'PNG Image',
    'gif': 'GIF Image',
    'psd': 'Photoshop File',
    'ai': 'Illustrator File',
    'mp4': 'MP4 Video',
    'mov': 'QuickTime Video',
    'mp3': 'MP3 Audio',
    'zip': 'Zip Archive',
    'rar': 'RAR Archive'
  }
  
  return typeMap[ext] || ext.toUpperCase()
}
</script>

<style scoped>
.file-list {
  width: 100%;
}

.loading-state {
  text-align: center;
  padding: 60px 20px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #DDDDDD;
  border-top-color: #0066CC;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: #F9F9F9;
  border-radius: 8px;
  border: 2px dashed #DDDDDD;
}

.empty-icon {
  font-size: 3em;
  color: #0066CC;
  margin-bottom: 20px;
}

.empty-state h4 {
  color: #666;
  margin-bottom: 10px;
  font-weight: 500;
}

.empty-state p {
  color: #999;
  margin-bottom: 0;
}

.files-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: white;
  border: 1px solid #DDDDDD;
  border-radius: 8px;
  transition: all 0.3s;
}

.file-item:hover {
  border-color: #0066CC;
  box-shadow: 0 4px 12px rgba(0, 102, 204, 0.1);
  transform: translateY(-2px);
}

.file-info {
  display: flex;
  align-items: center;
  gap: 20px;
  flex: 1;
  cursor: pointer;
  min-width: 0; /* Allow text truncation */
}

.file-icon {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8em;
  flex-shrink: 0;
}

.icon-doc {
  background: linear-gradient(135deg, #185abd, #1e6feb);
  color: white;
}

.icon-pdf {
  background: linear-gradient(135deg, #e63946, #ff6b6b);
  color: white;
}

.icon-image {
  background: linear-gradient(135deg, #2a9d8f, #2ec4b6);
  color: white;
}

.icon-design {
  background: linear-gradient(135deg, #f4a261, #ff9f1c);
  color: white;
}

.icon-video {
  background: linear-gradient(135deg, #9d4edd, #c77dff);
  color: white;
}

.icon-default {
  background: linear-gradient(135deg, #6c757d, #adb5bd);
  color: white;
}

.file-details {
  flex: 1;
  min-width: 0; /* Allow text truncation */
}

.file-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
  font-size: 1.1em;
  word-break: break-word;
}

.file-meta {
  display: flex;
  align-items: center;
  gap: 15px;
  flex-wrap: wrap;
  font-size: 0.85em;
  color: #666;
  margin-bottom: 8px;
}

.file-size {
  font-weight: 500;
  color: #0066CC;
}

.file-type {
  background: #F5F5F5;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 0.8em;
}

.file-date {
  color: #999;
}

.file-uploader {
  color: #666;
  font-style: italic;
}

.file-context {
  margin-top: 5px;
}

.ref-badge {
  display: inline-block;
  padding: 3px 10px;
  background: #E31E24;
  color: white;
  border-radius: 12px;
  font-size: 0.8em;
  font-weight: 600;
}

.file-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.btn {
  padding: 8px 12px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.9em;
  transition: all 0.3s;
}

.btn-info {
  background: #17a2b8;
  color: white;
}

.btn-info:hover {
  background: #138496;
  transform: translateY(-1px);
}

.btn-success {
  background: #28a745;
  color: white;
}

.btn-success:hover {
  background: #218838;
  transform: translateY(-1px);
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover {
  background: #c82333;
  transform: translateY(-1px);
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #5a6268;
  transform: translateY(-1px);
}

.btn-sm {
  padding: 6px 10px;
  font-size: 0.85em;
}

.file-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 2px solid #F5F5F5;
  flex-wrap: wrap;
  gap: 15px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stat-label {
  color: #666;
  font-size: 0.9em;
  font-weight: 500;
}

.stat-value {
  color: #003366;
  font-weight: 600;
}

@media (max-width: 768px) {
  .file-item {
    flex-direction: column;
    align-items: stretch;
    gap: 15px;
  }
  
  .file-info {
    flex-direction: column;
    text-align: center;
    gap: 15px;
  }
  
  .file-meta {
    justify-content: center;
  }
  
  .file-actions {
    justify-content: center;
  }
  
  .file-stats {
    flex-direction: column;
    text-align: center;
  }
}
</style>