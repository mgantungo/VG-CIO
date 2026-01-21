<template>
  <Teleport to="body">
    <div v-if="show" class="modal-overlay" @click.self="handleClose">
      <div class="modal-content">
        <div class="modal-header">
          <h2>📋 Schedule Details</h2>
          <button class="close-btn" @click="handleClose" aria-label="Close">×</button>
        </div>
        
        <div class="modal-body">
          <div class="details-grid">
            <!-- Schedule Details -->
            <div class="details-section">
              <h3>Schedule Information</h3>
              <div class="detail-row">
                <span class="detail-label">Schedule ID:</span>
                <span class="detail-value">{{ schedule.schedule_id }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Run Date:</span>
                <span class="detail-value">{{ formatDate(schedule.run_date) }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Run Times:</span>
                <span class="detail-value">
                  <span v-if="schedule.run_time && schedule.run_time.length > 0">
                    {{ schedule.run_time.join(', ') }}
                  </span>
                  <span v-else class="text-muted">Not specified</span>
                </span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Page:</span>
                <span class="detail-value">
                  <div class="page-control">
                    <input 
                      type="number" 
                      v-model="pageInput" 
                      min="0" 
                      class="page-input"
                      @change="updatePage"
                    />
                    <span class="page-status" :class="{ 'assigned': schedule.page > 0 }">
                      {{ schedule.page > 0 ? 'Assigned' : 'Not assigned' }}
                    </span>
                  </div>
                </span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Published:</span>
                <span class="detail-value">
                  <label class="switch">
                    <input type="checkbox" v-model="publishInput" @change="togglePublish">
                    <span class="slider round"></span>
                  </label>
                  <span class="publish-status" :class="{ 'published': schedule.is_published }">
                    {{ schedule.is_published ? 'Published' : 'Not published' }}
                  </span>
                </span>
              </div>
            </div>
            
            <!-- Advert Details -->
            <div class="details-section">
              <h3>Advert Information</h3>
              <div class="detail-row">
                <span class="detail-label">Advert ID:</span>
                <span class="detail-value">ADV-{{ schedule.advert_id }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Title:</span>
                <span class="detail-value">{{ schedule.advert_title }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Ad Size:</span>
                <span class="detail-value">{{ schedule.ad_size }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Ad Type:</span>
                <span class="detail-value">{{ formatAdType(schedule.ad_type) }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Start Date:</span>
                <span class="detail-value">{{ formatDate(schedule.start_date) }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">End Date:</span>
                <span class="detail-value">{{ formatDate(schedule.end_date) }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Frequency:</span>
                <span class="detail-value">{{ schedule.frequency }} times</span>
              </div>
            </div>
            
            <!-- Client Details -->
            <div class="details-section">
              <h3>Client Information</h3>
              <div class="detail-row">
                <span class="detail-label">Company:</span>
                <span class="detail-value">{{ schedule.company_name }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Contact Person:</span>
                <span class="detail-value">{{ schedule.contact_person || 'Not specified' }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Email:</span>
                <span class="detail-value">{{ schedule.email || 'Not specified' }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Phone:</span>
                <span class="detail-value">{{ schedule.phone || 'Not specified' }}</span>
              </div>
            </div>
            
            <!-- Media Files -->
            <div class="details-section media-section">
              <h3>Media Files</h3>
              <div v-if="schedule.media && schedule.media.length > 0" class="media-grid">
                <div 
                  v-for="(media, index) in schedule.media" 
                  :key="index"
                  class="media-item"
                  @click="previewMedia(media)"
                >
                  <div class="media-preview">
                    <img 
                      :src="getMediaThumbnail(media)" 
                      :alt="media.name"
                      class="media-image"
                      @error="handleImageError"
                    />
                    <div class="media-overlay">
                      <span class="preview-icon">👁️</span>
                    </div>
                  </div>
                  <div class="media-info">
                    <div class="media-name">{{ media.name }}</div>
                    <div class="media-size">{{ formatFileSize(media.size) }}</div>
                    <div class="media-type">{{ media.ext?.toUpperCase() || 'File' }}</div>
                  </div>
                </div>
              </div>
              <div v-else class="no-media">
                No media files attached
              </div>
            </div>
            
            <!-- Special Instructions -->
            <div v-if="schedule.special_instructions" class="details-section">
              <h3>Special Instructions</h3>
              <div class="instructions-box">
                {{ schedule.special_instructions }}
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="handleClose">
            Close
          </button>
          <button class="btn btn-primary" @click="printSchedule">
            🖨️ Print Details
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRuntimeConfig } from '#imports'

const config = useRuntimeConfig()
const uploadBase = config.public.uploadBase || ''

const props = defineProps({
  schedule: {
    type: Object,
    required: true
  },
  show: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'page-update', 'publish-toggle'])

// Local state for inputs
const pageInput = ref(props.schedule.page || 0)
const publishInput = ref(props.schedule.is_published || false)

// Watch for prop changes
watch(() => props.schedule, (newSchedule) => {
  pageInput.value = newSchedule.page || 0
  publishInput.value = newSchedule.is_published || false
})

const handleClose = () => {
  emit('close')
}

const formatDate = (dateString) => {
  if (!dateString) return 'Not specified'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-UG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const formatAdType = (adType) => {
  const typeMap = {
    'full_color': 'Full Color',
    'black_white': 'Black & White'
  }
  return typeMap[adType] || adType
}

const getMediaThumbnail = (media) => {
  if (!media) return '/images/placeholder.png'
  
  let mediaUrl = ''
  
  // Try thumbnail format first
  if (media.formats?.thumbnail?.url) {
    mediaUrl = media.formats.thumbnail.url
  }
  // Try small format
  else if (media.formats?.small?.url) {
    mediaUrl = media.formats.small.url
  }
  // Try original URL
  else if (media.url) {
    mediaUrl = media.url
  }
  
  // If URL is relative, prepend upload base URL
  if (mediaUrl && !mediaUrl.startsWith('http') && !mediaUrl.startsWith('//') && uploadBase) {
    const cleanMediaUrl = mediaUrl.startsWith('/') ? mediaUrl.substring(1) : mediaUrl
    mediaUrl = `${uploadBase}/${cleanMediaUrl}`
  }
  
  return mediaUrl || '/images/placeholder.png'
}

const getBestPreviewUrl = (media) => {
  if (!media) return null
  
  let previewUrl = ''
  
  // Try to get the best quality available
  if (media.url) {
    previewUrl = media.url
  } else if (media.formats?.large?.url) {
    previewUrl = media.formats.large.url
  } else if (media.formats?.medium?.url) {
    previewUrl = media.formats.medium.url
  } else if (media.formats?.small?.url) {
    previewUrl = media.formats.small.url
  } else if (media.formats?.thumbnail?.url) {
    previewUrl = media.formats.thumbnail.url
  }
  
  // Prepend upload base for relative URLs
  if (previewUrl && !previewUrl.startsWith('http') && !previewUrl.startsWith('//') && uploadBase) {
    const cleanUrl = previewUrl.startsWith('/') ? previewUrl.substring(1) : previewUrl
    previewUrl = `${uploadBase}/${cleanUrl}`
  }
  
  return previewUrl
}

const handleImageError = (event) => {
  event.target.src = '/images/placeholder.png'
}

const formatFileSize = (bytes) => {
  if (!bytes) return 'Unknown'
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  return `${Math.round(size)} ${units[unitIndex]}`
}

const updatePage = () => {
  const pageNum = parseInt(pageInput.value)
  if (!isNaN(pageNum) && pageNum >= 0) {
    emit('page-update', props.schedule.schedule_id, pageNum)
  }
}

const togglePublish = () => {
  emit('publish-toggle', props.schedule.schedule_id, publishInput.value)
}

const previewMedia = (media) => {
  const previewUrl = getBestPreviewUrl(media)
  if (previewUrl) {
    window.open(previewUrl, '_blank')
  }
}

const printSchedule = () => {
  window.print()
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  backdrop-filter: blur(2px);
}

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  padding: 25px 30px;
  border-bottom: 2px solid #f0f2f5;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8f9fa;
  border-radius: 12px 12px 0 0;
}

.modal-header h2 {
  margin: 0;
  color: #003366;
  font-size: 1.5em;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 2.5em;
  cursor: pointer;
  color: #666;
  line-height: 0.8;
  padding: 0;
  width: 35px;
  height: 35px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #333;
}

.modal-body {
  padding: 30px;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 30px;
}

.details-section {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #dee2e6;
}

.details-section h3 {
  margin: 0 0 20px 0;
  color: #003366;
  font-size: 1.2em;
  padding-bottom: 10px;
  border-bottom: 2px solid #0066CC;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.detail-row:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.detail-label {
  font-weight: 600;
  color: #666;
  font-size: 0.9em;
  min-width: 120px;
}

.detail-value {
  color: #333;
  font-size: 0.95em;
  text-align: right;
  flex: 1;
  margin-left: 10px;
}

.text-muted {
  color: #999;
  font-style: italic;
}

.page-control {
  display: flex;
  align-items: center;
  gap: 10px;
}

.page-input {
  width: 80px;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1em;
  text-align: center;
}

.page-input:focus {
  outline: none;
  border-color: #0066CC;
  box-shadow: 0 0 0 2px rgba(0, 102, 204, 0.1);
}

.page-status {
  font-size: 0.85em;
  padding: 4px 8px;
  border-radius: 12px;
  background: #f8f9fa;
  color: #666;
}

.page-status.assigned {
  background: #d4edda;
  color: #155724;
}

.switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
  margin-right: 10px;
  vertical-align: middle;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
}

.slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: .4s;
}

input:checked + .slider {
  background-color: #28a745;
}

input:focus + .slider {
  box-shadow: 0 0 1px #28a745;
}

input:checked + .slider:before {
  transform: translateX(26px);
}

.slider.round {
  border-radius: 24px;
}

.slider.round:before {
  border-radius: 50%;
}

.publish-status {
  font-size: 0.85em;
  padding: 4px 8px;
  border-radius: 12px;
  background: #f8f9fa;
  color: #666;
}

.publish-status.published {
  background: #d4edda;
  color: #155724;
}

.media-section {
  grid-column: 1 / -1;
}

.media-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 15px;
}

.media-item {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid #dee2e6;
}

.media-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.media-preview {
  position: relative;
  height: 100px;
  overflow: hidden;
  background: #f5f5f5;
}

.media-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.media-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
}

.media-item:hover .media-overlay {
  opacity: 1;
}

.preview-icon {
  color: white;
  font-size: 1.5em;
}

.media-info {
  padding: 10px;
}

.media-name {
  font-size: 0.85em;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 5px;
}

.media-size {
  font-size: 0.75em;
  color: #666;
  margin-bottom: 2px;
}

.media-type {
  font-size: 0.7em;
  color: #999;
  text-transform: uppercase;
}

.no-media {
  text-align: center;
  padding: 30px;
  color: #999;
  font-style: italic;
}

.instructions-box {
  background: white;
  padding: 15px;
  border-radius: 8px;
  border-left: 4px solid #0066CC;
  margin-top: 10px;
  font-size: 0.95em;
  line-height: 1.5;
  color: #333;
}

.modal-footer {
  padding: 20px 30px;
  border-top: 2px solid #f0f2f5;
  display: flex;
  gap: 15px;
  justify-content: flex-end;
  background: #f8f9fa;
  border-radius: 0 0 12px 12px;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.95em;
  transition: all 0.3s;
  min-width: 140px;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #5a6268;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(108, 117, 125, 0.3);
}

.btn-primary {
  background: #0066CC;
  color: white;
}

.btn-primary:hover {
  background: #0052a3;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 102, 204, 0.3);
}

@media (max-width: 768px) {
  .modal-overlay {
    padding: 10px;
  }
  
  .modal-content {
    max-height: 95vh;
  }
  
  .modal-header,
  .modal-body,
  .modal-footer {
    padding: 20px;
  }
  
  .details-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .detail-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }
  
  .detail-value {
    text-align: left;
    width: 100%;
  }
  
  .modal-footer {
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
  }
}
</style>