<template>
  <div class="schedule-review-queue">
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <div>Loading scheduled adverts...</div>
    </div>

    <div v-else-if="schedules.length === 0" class="empty-state">
      <div class="empty-icon">📅</div>
      <h3>No Schedules Found</h3>
      <p>No adverts are scheduled for the selected date range.</p>
      <button class="btn btn-secondary" @click="$emit('refresh')">
        Refresh
      </button>
    </div>

    <div v-else class="schedules-list">
      <table class="schedules-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Page</th>
            <th>Advert Title</th>
            <th>Client</th>
            <th>Ad Size/Type</th>
            <th>Status</th>
            <th>Media</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="schedule in schedules" :key="schedule.schedule_id" class="schedule-row">
            <td class="run-date">
              <div class="date-display">{{ formatDate(schedule.run_date) }}</div>
              <div v-if="schedule.run_time" class="run-times">
                {{ schedule.run_time.join(', ') }}
              </div>
            </td>
            
            <td class="page-cell">
              <div class="page-input-group">
                <input 
                  type="number" 
                  :value="schedule.page || ''" 
                  @change="updatePage(schedule, $event.target.value)"
                  min="0"
                  class="page-input"
                  placeholder="Page #"
                />
                <div class="page-actions">
                  <button 
                    class="btn-icon btn-sm btn-info"
                    @click="suggestPage(schedule)"
                    title="Suggest page number"
                  >
                    💡
                  </button>
                </div>
              </div>
            </td>
            
            <td class="advert-info">
              <div class="advert-title">{{ schedule.advert_title }}</div>
              <div class="advert-ref">Ref: ADV-{{ schedule.advert_id }}</div>
            </td>
            
            <td class="client-info">
              <div class="company-name">{{ schedule.company_name }}</div>
              <div v-if="schedule.contact_person" class="contact-person">
                {{ schedule.contact_person }}
              </div>
              <div v-if="schedule.email" class="client-email">
                {{ schedule.email }}
              </div>
            </td>
            
            <td class="ad-details">
              <div class="ad-size">{{ schedule.ad_size }}</div>
              <div class="ad-type">{{ formatAdType(schedule.ad_type) }}</div>
            </td>
            
            <td class="status-cell">
              <div class="status-badge" :class="getStatusClass(schedule)">
                {{ schedule.is_published ? 'Published' : 'Scheduled' }}
              </div>
              <button 
                class="btn-toggle-publish"
                @click="togglePublish(schedule)"
                :title="schedule.is_published ? 'Unpublish' : 'Publish'"
              >
                {{ schedule.is_published ? '📢' : '📋' }}
              </button>
            </td>
            
            <td class="media-cell">
              <div v-if="schedule.media && schedule.media.length > 0" class="media-preview">
                <div class="media-count">
                  📎 {{ schedule.media.length }}
                </div>
                <div class="media-thumbnails">
                  <img 
                    v-for="(media, index) in schedule.media.slice(0, 2)" 
                    :key="index"
                    :src="getMediaThumbnail(media)"
                    :alt="media.name"
                    class="media-thumbnail"
                    @click="previewMedia(media)"
                    @error="handleImageError"
                  />
                </div>
              </div>
              <div v-else class="no-media">
                No media
              </div>
            </td>
            
            <td class="actions-cell">
              <div class="action-buttons">
                <button 
                  class="btn-icon btn-sm btn-info"
                  @click="$emit('view-details', schedule)"
                  title="View details"
                >
                  👁️
                </button>
                <button 
                  class="btn-icon btn-sm btn-warning"
                  @click="editSchedule(schedule)"
                  title="Edit schedule"
                >
                  ✏️
                </button>
                <button 
                  class="btn-icon btn-sm btn-danger"
                  @click="unschedule(schedule)"
                  title="Unschedule"
                >
                  🗑️
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="schedules.length > 0 && !loading" class="queue-footer">
      <div class="queue-stats">
        Showing {{ schedules.length }} schedule(s) • 
        {{ assignedPagesCount }} with page assignments •
        {{ publishedSchedulesCount }} published
      </div>
      <div class="queue-actions">
        <button class="btn btn-secondary" @click="$emit('refresh')">
          Refresh Queue
        </button>
        <button class="btn btn-primary" @click="selectAllForBulkUpdate" v-if="schedules.length > 1">
          Select All for Bulk Update
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRuntimeConfig } from '#imports'

const config = useRuntimeConfig()
const uploadBase = config.public.uploadBase || ''

const props = defineProps({
  schedules: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['page-update', 'publish-toggle', 'view-details', 'refresh'])

const assignedPagesCount = computed(() => {
  return props.schedules.filter(s => s.page && s.page > 0).length
})

const publishedSchedulesCount = computed(() => {
  return props.schedules.filter(s => s.is_published).length
})

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('en-UG', {
    weekday: 'short',
    month: 'short',
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

const getStatusClass = (schedule) => {
  if (schedule.is_published) return 'status-published'
  if (schedule.page && schedule.page > 0) return 'status-assigned'
  return 'status-scheduled'
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

const updatePage = (schedule, page) => {
  const pageNum = parseInt(page)
  if (!isNaN(pageNum) && pageNum >= 0) {
    emit('page-update', schedule.schedule_id, pageNum)
  }
}

const suggestPage = (schedule) => {
  // Simple suggestion algorithm - can be enhanced
  const suggestedPage = schedule.page || Math.floor(Math.random() * 10) + 1
  if (confirm(`Set page to ${suggestedPage} for "${schedule.advert_title}"?`)) {
    emit('page-update', schedule.schedule_id, suggestedPage)
  }
}

const togglePublish = (schedule) => {
  const newStatus = !schedule.is_published
  if (confirm(`${newStatus ? 'Publish' : 'Unpublish'} "${schedule.advert_title}"?`)) {
    emit('publish-toggle', schedule.schedule_id, newStatus)
  }
}

const previewMedia = (media) => {
  const previewUrl = getBestPreviewUrl(media)
  if (previewUrl) {
    window.open(previewUrl, '_blank')
  }
}

const editSchedule = (schedule) => {
  // Navigate to edit page or open edit modal
  console.log('Edit schedule:', schedule)
  // This would typically navigate to an edit page
  // router.push(`/schedules/${schedule.schedule_id}/edit`)
}

const unschedule = (schedule) => {
  if (confirm(`Are you sure you want to unschedule "${schedule.advert_title}" on ${schedule.run_date}?`)) {
    console.log('Unschedule:', schedule)
    // Call unschedule API
  }
}

const selectAllForBulkUpdate = () => {
  const selectedSchedules = props.schedules.map(s => ({
    scheduleId: s.schedule_id,
    currentPage: s.page || 0,
    advertTitle: s.advert_title
  }))
  
  // Emit or open bulk update modal
  console.log('Selected for bulk update:', selectedSchedules)
}
</script>

<style scoped>
.schedule-review-queue {
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
}

.empty-icon {
  font-size: 3em;
  color: #DDDDDD;
  margin-bottom: 20px;
}

.empty-state h3 {
  color: #666;
  margin-bottom: 10px;
  font-weight: 500;
}

.empty-state p {
  color: #999;
  margin-bottom: 30px;
}

.schedules-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
}

.schedules-table th {
  text-align: left;
  padding: 15px;
  background: #f8f9fa;
  color: #333;
  font-weight: 600;
  border-bottom: 2px solid #dee2e6;
}

.schedules-table td {
  padding: 15px;
  border-bottom: 1px solid #eee;
}

.schedule-row:hover {
  background: #f8f9fa;
}

.run-date {
  min-width: 120px;
}

.date-display {
  font-weight: 600;
  color: #333;
}

.run-times {
  font-size: 0.85em;
  color: #666;
  margin-top: 5px;
}

.page-cell {
  min-width: 120px;
}

.page-input-group {
  display: flex;
  gap: 5px;
}

.page-input {
  width: 70px;
  padding: 8px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  text-align: center;
  font-size: 0.95em;
}

.page-input:focus {
  outline: none;
  border-color: #0066CC;
  box-shadow: 0 0 0 2px rgba(0, 102, 204, 0.1);
}

.page-actions {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.advert-info {
  min-width: 200px;
}

.advert-title {
  font-weight: 600;
  color: #333;
  margin-bottom: 5px;
}

.advert-ref {
  font-size: 0.85em;
  color: #666;
}

.client-info {
  min-width: 200px;
}

.company-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 5px;
}

.contact-person {
  font-size: 0.9em;
  color: #666;
}

.client-email {
  font-size: 0.85em;
  color: #0066CC;
}

.ad-details {
  min-width: 120px;
}

.ad-size {
  font-weight: 600;
  color: #333;
  margin-bottom: 5px;
}

.ad-type {
  font-size: 0.9em;
  color: #666;
  text-transform: capitalize;
}

.status-cell {
  min-width: 120px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.85em;
  font-weight: 500;
}

.status-published {
  background: #d4edda;
  color: #155724;
}

.status-assigned {
  background: #d1ecf1;
  color: #0c5460;
}

.status-scheduled {
  background: #fff3cd;
  color: #856404;
}

.btn-toggle-publish {
  background: none;
  border: none;
  font-size: 1.2em;
  cursor: pointer;
  padding: 5px;
  border-radius: 4px;
  transition: all 0.3s;
}

.btn-toggle-publish:hover {
  background: rgba(0, 0, 0, 0.05);
}

.media-cell {
  min-width: 100px;
}

.media-preview {
  display: flex;
  align-items: center;
  gap: 10px;
}

.media-count {
  font-size: 0.9em;
  color: #666;
}

.media-thumbnails {
  display: flex;
  gap: 5px;
}

.media-thumbnail {
  width: 30px;
  height: 30px;
  object-fit: cover;
  border-radius: 4px;
  cursor: pointer;
  border: 1px solid #ddd;
  background: #f5f5f5;
}

.media-thumbnail:hover {
  transform: scale(1.1);
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.no-media {
  color: #999;
  font-size: 0.9em;
  font-style: italic;
}

.actions-cell {
  min-width: 150px;
}

.action-buttons {
  display: flex;
  gap: 5px;
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 1.1em;
  transition: all 0.3s;
}

.btn-sm {
  padding: 4px 8px;
  font-size: 1em;
}

.btn-info {
  color: #17a2b8;
}

.btn-info:hover {
  background: rgba(23, 162, 184, 0.1);
}

.btn-warning {
  color: #ffc107;
}

.btn-warning:hover {
  background: rgba(255, 193, 7, 0.1);
}

.btn-danger {
  color: #dc3545;
}

.btn-danger:hover {
  background: rgba(220, 53, 69, 0.1);
}

.queue-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 2px solid #DDDDDD;
}

.queue-stats {
  color: #666;
  font-size: 0.9em;
}

.queue-actions {
  display: flex;
  gap: 10px;
}

.btn {
  padding: 10px 20px;
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

.btn-primary:hover {
  background: #c01820;
  transform: translateY(-1px);
}

.btn-secondary {
  background: #0066CC;
  color: white;
}

.btn-secondary:hover {
  background: #0052a3;
  transform: translateY(-1px);
}

@media (max-width: 1200px) {
  .schedules-table {
    display: block;
    overflow-x: auto;
  }
  
  .schedules-table th,
  .schedules-table td {
    min-width: 150px;
  }
  
  .queue-footer {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }
}
</style>