<!--components/design/BriefModal.vue-->
<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-container">
      <div class="modal-header">
        <h2>Creative Brief</h2>
        <button class="modal-close" @click="$emit('close')">×</button>
      </div>

      <div class="modal-body">
        <div class="advert-summary">
          <div class="summary-row">
            <span class="label">Reference:</span>
            <span class="value">{{ advert.reference }}</span>
          </div>
          <div class="summary-row">
            <span class="label">Client:</span>
            <span class="value">{{ advert.clientName }}</span>
          </div>
          <div class="summary-row">
            <span class="label">Advert Title:</span>
            <span class="value">{{ advert.advertTitle }}</span>
          </div>
          <div class="summary-row">
            <span class="label">Platform:</span>
            <span class="value">{{ advert.platform }}</span>
          </div>
          <div class="summary-row">
            <span class="label">Ad Type:</span>
            <span class="value">{{ advert.adType }}</span>
          </div>
          <div class="summary-row">
            <span class="label">Ad Size:</span>
            <span class="value">{{ advert.adSize }}</span>
          </div>
          <div class="summary-row">
            <span class="label">Duration:</span>
            <span class="value">{{ formatDate(advert.startDate) }} - {{ formatDate(advert.endDate) }}</span>
          </div>
        </div>

        <div class="brief-section">
          <h3>Special Instructions / Creative Brief</h3>
          <div v-if="advert.specialInstructions" class="brief-content">
            {{ advert.specialInstructions }}
          </div>
          <div v-else class="no-brief">
            <p>No special instructions provided for this advert.</p>
          </div>
        </div>

        <div v-if="advert.files && advert.files.length > 0" class="files-section">
          <h3>Reference Materials ({{ advert.files.length }})</h3>
          <div class="files-list">
            <div 
              v-for="file in advert.files" 
              :key="file.id"
              class="file-item"
            >
              <div class="file-icon">{{ getFileIcon(file.mime) }}</div>
              <div class="file-info">
                <div class="file-name">{{ file.name }}</div>
                <div class="file-meta">
                  <span>{{ formatFileSize(file.size) }}</span>
                  <span>•</span>
                  <span>{{ formatDate(file.createdAt) }}</span>
                </div>
              </div>
              <div class="file-actions">
                <a 
                  :href="file.url" 
                  target="_blank"
                  class="btn btn-sm btn-info"
                >
                  👁️ View
                </a>
                <a 
                  :href="file.url" 
                  :download="file.name"
                  class="btn btn-sm btn-secondary"
                >
                  ⬇️ Download
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" @click="$emit('close')">
          Close
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  advert: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close'])

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-UG', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  } catch (error) {
    return dateString
  }
}

const formatFileSize = (bytes) => {
  if (!bytes) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

const getFileIcon = (mimeType) => {
  if (!mimeType) return '📄'
  
  if (mimeType.startsWith('image/')) return '🖼️'
  if (mimeType.startsWith('video/')) return '🎥'
  if (mimeType.startsWith('audio/')) return '🎵'
  if (mimeType.includes('pdf')) return '📕'
  if (mimeType.includes('word') || mimeType.includes('document')) return '📝'
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return '📊'
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return '📽️'
  if (mimeType.includes('zip') || mimeType.includes('rar')) return '🗜️'
  
  return '📄'
}
</script>

<style scoped>
.modal-overlay {
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

.modal-container {
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

.advert-summary {
  background: #F9F9F9;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 30px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #E5E5E5;
}

.summary-row:last-child {
  border-bottom: none;
}

.summary-row .label {
  color: #666;
  font-weight: 500;
  min-width: 120px;
}

.summary-row .value {
  color: #333;
  text-align: right;
  flex: 1;
  font-weight: 500;
}

.brief-section {
  margin-bottom: 30px;
}

.brief-section h3 {
  color: #003366;
  margin-bottom: 15px;
  font-size: 1.2em;
  padding-bottom: 10px;
  border-bottom: 2px solid #F5F5F5;
}

.brief-content {
  background: white;
  padding: 20px;
  border: 1px solid #E5E5E5;
  border-radius: 8px;
  line-height: 1.8;
  color: #333;
  white-space: pre-wrap;
}

.no-brief {
  background: #FFF9E6;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
}

.no-brief p {
  color: #666;
  margin: 0;
  font-style: italic;
}

.files-section h3 {
  color: #003366;
  margin-bottom: 15px;
  font-size: 1.2em;
  padding-bottom: 10px;
  border-bottom: 2px solid #F5F5F5;
}

.files-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background: #F9F9F9;
  border-radius: 8px;
  border: 1px solid #E5E5E5;
  transition: all 0.3s;
}

.file-item:hover {
  border-color: #0066CC;
  box-shadow: 0 2px 8px rgba(0, 102, 204, 0.1);
}

.file-icon {
  font-size: 2em;
  flex-shrink: 0;
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-weight: 500;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-meta {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-top: 5px;
  font-size: 0.85em;
  color: #666;
}

.file-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.modal-footer {
  padding: 20px 30px;
  border-top: 2px solid #F5F5F5;
  display: flex;
  justify-content: flex-end;
  gap: 15px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.95em;
  font-weight: 500;
  transition: all 0.3s;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 0.85em;
}

.btn-secondary {
  background: #0066CC;
  color: white;
}

.btn-secondary:hover {
  background: #0052a3;
  transform: translateY(-1px);
}

.btn-info {
  background: #17a2b8;
  color: white;
}

.btn-info:hover {
  background: #138496;
}

@media (max-width: 768px) {
  .modal-container {
    max-width: 100%;
    max-height: 95vh;
  }
  
  .modal-header,
  .modal-body,
  .modal-footer {
    padding: 20px;
  }
  
  .summary-row {
    flex-direction: column;
    gap: 5px;
  }
  
  .summary-row .label,
  .summary-row .value {
    text-align: left;
  }
  
  .file-item {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .file-actions {
    width: 100%;
    flex-direction: column;
  }
  
  .btn-sm {
    width: 100%;
  }
}
</style>