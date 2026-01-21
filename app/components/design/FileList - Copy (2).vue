<!--components/design/FileList.vue - UPDATED with Utility Functions-->
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
              <span class="file-date" v-if="file.createdAt">
                {{ formatRelativeTime(file.createdAt) }}
              </span>
            </div>
            
            <div v-if="file.advertReference" class="file-context">
              <span class="ref-badge">{{ file.advertReference }}</span>
            </div>
          </div>
        </div>

        <div class="file-actions">
          <a 
            v-if="file.url"
            :href="file.url"
            target="_blank"
            class="btn btn-info btn-sm"
            title="Preview"
          >
            👁️
          </a>
          
          <a 
            v-if="file.url"
            :href="file.url"
            :download="file.name"
            class="btn btn-success btn-sm"
            title="Download"
          >
            ⬇️
          </a>
          
          <button 
            v-if="showDelete"
            class="btn btn-danger btn-sm"
            @click="$emit('delete', file)"
            title="Delete"
          >
            🗑️
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
        <span class="stat-value">{{ formatRelativeTime(latestUpload.createdAt) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
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
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
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
    'doc': '📄',
    'docx': '📄',
    'pdf': '📕',
    'jpg': '🖼️',
    'jpeg': '🖼️',
    'png': '🖼️',
    'gif': '🖼️',
    'bmp': '🖼️',
    'psd': '🎨',
    'ai': '🎨',
    'eps': '🎨',
    'svg': '🎨',
    'indd': '🎨',
    'mp4': '🎬',
    'mov': '🎬',
    'avi': '🎬',
    'wmv': '🎬',
    'mp3': '🎵',
    'wav': '🎵',
    'aac': '🎵',
    'zip': '🗜️',
    'rar': '🗜️',
    '7z': '🗜️'
  }
  
  return iconMap[ext] || '📎'
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
    'eps': 'icon-design',
    'svg': 'icon-design',
    'indd': 'icon-design',
    'mp4': 'icon-video',
    'mov': 'icon-video',
    'avi': 'icon-video'
  }
  
  return iconClasses[ext] || 'icon-default'
}

const getFileType = (file) => {
  const name = file.name || ''
  const ext = name.split('.').pop().toLowerCase()
  
  const typeMap = {
    'doc': 'Word',
    'docx': 'Word',
    'pdf': 'PDF',
    'jpg': 'JPEG',
    'jpeg': 'JPEG',
    'png': 'PNG',
    'gif': 'GIF',
    'psd': 'Photoshop',
    'ai': 'Illustrator',
    'eps': 'EPS',
    'svg': 'SVG',
    'indd': 'InDesign',
    'mp4': 'MP4',
    'mov': 'QuickTime',
    'mp3': 'MP3',
    'zip': 'ZIP',
    'rar': 'RAR'
  }
  
  return typeMap[ext] || ext.toUpperCase()
}
</script>

<style scoped>
/* Keep all existing styles - they're excellent */
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
  min-width: 0;
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
  min-width: 0;
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
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
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