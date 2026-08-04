<!-- components/design/AdvertScheduler.vue -->
<template>
  <div v-if="show" class="modal-overlay" @click.self="close">
    <div class="sched-modal">

      <!-- ── MODAL HEADER ── -->
      <div class="sched-modal__head">
        <div class="sched-modal__head-left">
          <div class="sched-modal__title">Schedule Advert</div>
          <div v-if="advert" class="sched-modal__ref">{{ advert.reference }} — {{ advert.clientName }}</div>
        </div>
        <button class="sched-modal__close" @click="close">×</button>
      </div>

      <!-- ── ADVERT INFO BAND ── -->
      <div v-if="advert" class="info-band">
        <div class="info-band__cell">
          <div class="info-band__lbl">Client</div>
          <div class="info-band__val">{{ advert.clientName }}</div>
        </div>
        <div class="info-band__div"></div>
        <div class="info-band__cell">
          <div class="info-band__lbl">Title</div>
          <div class="info-band__val">{{ advert.advertTitle }}</div>
        </div>
        <div class="info-band__div"></div>
        <div class="info-band__cell">
          <div class="info-band__lbl">Platform</div>
          <div class="info-band__val"><span class="plat-chip">{{ advert.platform }}</span></div>
        </div>
        <div class="info-band__div"></div>
        <div class="info-band__cell">
          <div class="info-band__lbl">Reference</div>
          <div class="info-band__val ref-mono">{{ advert.reference }}</div>
        </div>
      </div>

      <!-- ── PUBLISHING DATES BAND ── -->
      <div v-if="advert && advert.publishingDates && advert.publishingDates.length > 0" class="pub-band">
        <div class="pub-band__lbl">
          Publishing Dates
          <span class="pub-band__count">{{ advert.publishingDates.length }} day{{ advert.publishingDates.length !== 1 ? 's' : '' }}</span>
        </div>
        <div class="pub-band__dates">
          <span
            v-for="d in advert.publishingDates"
            :key="d"
            class="pub-chip"
            :class="{
              'pub-chip--scheduled': advert.scheduledDates?.includes(d),
              'pub-chip--today':     d === todayStr && !advert.scheduledDates?.includes(d),
              'pub-chip--past':      d < todayStr,
              'pub-chip--match':     scheduleDate === d && !advert.scheduledDates?.includes(d)
            }"
            @click="selectDate(d)"
            :title="advert.scheduledDates && advert.scheduledDates.includes(d) ? `Already scheduled for ${d} — click to reschedule` : `Click to set schedule date to ${d}`"
          >
            {{ fmtShortDate(d) }}
          </span>
        </div>
      </div>

      <!-- ── BODY ── -->
      <div class="sched-modal__body">
        <form @submit.prevent="submitSchedule">

          <!-- ── SECTION 1: Schedule Details ── -->
          <div class="xl-section">
            <div class="xl-section__head">
              <span class="xl-section__num">01</span>
              <span class="xl-section__title">Schedule Details</span>
            </div>
            <div class="xl-section__body">
              <div class="form-row">
                <!-- Date to Run -->
                <div class="fgroup">
                  <label class="flabel">Date to Run <span class="req">*</span></label>
                  <input
                    type="date"
                    v-model="scheduleDate"
                    :min="minDate"
                    :max="maxDate"
                    class="xl-input"
                    :class="{ 'xl-input--error': errors.scheduleDate }"
                    required
                    @input="clearError('scheduleDate')"
                  >
                  <div v-if="errors.scheduleDate" class="ferror">{{ errors.scheduleDate }}</div>
                  <div v-if="scheduleDate && advert?.publishingDates?.length && !advert.publishingDates.includes(scheduleDate)" class="fwarn">
                    This date is not in the advert's publishing dates list
                  </div>
                </div>

                <!-- Run Time (non-Print only) -->
                <div v-if="advert?.platform !== 'Print Media'" class="fgroup">
                  <label class="flabel">Run Time <span class="req">*</span></label>
                  <div class="time-row">
                    <select v-model="runHour" class="xl-select time-sel" required>
                      <option value="">Hr</option>
                      <option v-for="h in 12" :key="h" :value="h">{{ h }}</option>
                    </select>
                    <span class="time-colon">:</span>
                    <select v-model="runMinute" class="xl-select time-sel" required>
                      <option value="">Min</option>
                      <option v-for="m in 60" :key="m-1" :value="m-1">{{ (m-1).toString().padStart(2, '0') }}</option>
                    </select>
                    <select v-model="runPeriod" class="xl-select period-sel" required>
                      <option value="">—</option>
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                  <div v-if="errors.runTime" class="ferror">{{ errors.runTime }}</div>
                </div>

                <div v-if="advert?.platform === 'Print Media'" class="fgroup fgroup--note">
                  <label class="flabel">Run Time</label>
                  <div class="note-box">Not required for Print Media</div>
                </div>
              </div>
            </div>
          </div>

          <!-- ── SECTION 2: Existing Attachments from CMS ── -->
          <div v-if="advert?.attachments?.length > 0" class="xl-section">
            <div class="xl-section__head">
              <span class="xl-section__num">02</span>
              <span class="xl-section__title">Design Files on CMS</span>
              <span class="xl-section__badge--green">{{ advert.attachments.length }} file{{ advert.attachments.length !== 1 ? 's' : '' }} available</span>
              <span class="xl-section__limits">Select files already uploaded to the CMS to use for this schedule</span>
            </div>
            <div class="xl-section__body att-body">
              <div class="att-select-all">
                <label class="att-check-lbl">
                  <input type="checkbox" :checked="allAttachmentsSelected" @change="toggleSelectAll" class="att-check">
                  <span>{{ allAttachmentsSelected ? 'Deselect All' : 'Select All' }}</span>
                </label>
                <span class="att-sel-count" v-if="selectedAttachmentIds.length > 0">
                  {{ selectedAttachmentIds.length }} selected
                </span>
              </div>
              <div class="att-table-wrap">
                <table class="att-tbl">
                  <thead>
                    <tr>
                      <th class="att-tc-chk"></th>
                      <th>File Name</th>
                      <th class="att-tc-type">Type</th>
                      <th class="att-tc-size">Size</th>
                      <th class="att-tc-prev">Preview</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="att in advert.attachments" :key="att.id"
                      class="att-row"
                      :class="{ 'att-row--selected': selectedAttachmentIds.includes(att.id) }"
                      @click="toggleAttachment(att.id)"
                    >
                      <td class="att-tc-chk">
                        <input type="checkbox"
                          :checked="selectedAttachmentIds.includes(att.id)"
                          @click.stop="toggleAttachment(att.id)"
                          class="att-check"
                        >
                      </td>
                      <td>
                        <div class="att-fname">
                          <span class="att-icon">{{ getFileIcon(att.name) }}</span>
                          <span class="att-name-text">{{ att.name }}</span>
                        </div>
                      </td>
                      <td class="att-tc-type">
                        <span class="att-ext">{{ att.name?.split('.').pop().toUpperCase() }}</span>
                      </td>
                      <td class="att-tc-size mono">{{ att.size ? formatFileSize(att.size) : '—' }}</td>
                      <td class="att-tc-prev">
                        <a v-if="att.url" :href="att.url" target="_blank" class="att-prev-link" @click.stop title="Preview">
                          <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" stroke-width="1.5"/><circle cx="8" cy="8" r="2" stroke="currentColor" stroke-width="1.5"/></svg>
                        </a>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- ── SECTION 3: Upload Additional Media ── -->
          <div class="xl-section">
            <div class="xl-section__head">
              <span class="xl-section__num">{{ advert?.attachments?.length > 0 ? '03' : '02' }}</span>
              <span class="xl-section__title">Upload Additional Files</span>
              <span v-if="selectedAttachmentIds.length > 0" class="xl-section__optional">(Optional — CMS files selected above)</span>
              <span class="xl-section__limits">Max {{ maxFileSizeMB }}MB per file &nbsp;|&nbsp; {{ maxTotalSizeMB }}MB total &nbsp;|&nbsp; Supported: {{ supportedFileTypes }}</span>
            </div>
            <div class="xl-section__body">
              <div
                class="drop-zone"
                :class="{ 'drop-zone--over': isDragging, 'drop-zone--filled': mediaFiles.length > 0 }"
                @dragover.prevent="handleDragOver"
                @dragleave="handleDragLeave"
                @drop.prevent="handleDrop"
              >
                <input type="file" ref="fileInput" multiple style="display:none;" :accept="acceptedFileTypes" @change="handleFileSelect">

                <div v-if="mediaFiles.length === 0" class="drop-zone__empty">
                  <div class="drop-zone__icon">&#8679;</div>
                  <div class="drop-zone__msg">Drop media files here or <button type="button" class="drop-zone__browse" @click="triggerFileInput">Browse Files</button></div>
                  <div class="drop-zone__sub">Images, Videos, PDF, Design files (.jpg .png .mp4 .pdf .psd .ai …)</div>
                </div>

                <div v-else class="drop-zone__list">
                  <div class="drop-zone__list-head">
                    <span class="drop-zone__list-count">{{ mediaFiles.length }} file(s) selected &nbsp;·&nbsp; {{ formatFileSize(totalFileSize) }} total</span>
                    <button type="button" class="act-btn act-btn--dl" @click="triggerFileInput">+ Add More</button>
                  </div>
                  <div class="file-rows">
                    <div v-for="(file, index) in mediaFiles" :key="index" class="file-row">
                      <span class="file-row__icon">{{ getFileIcon(file.name) }}</span>
                      <div class="file-row__info">
                        <div class="file-row__name">{{ file.name }}</div>
                        <div class="file-row__meta">{{ formatFileSize(file.size) }} &nbsp;·&nbsp; {{ getFileExtension(file.name) }}</div>
                      </div>
                      <button type="button" class="act-btn act-btn--remove" @click="removeFile(index)">Remove</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- ── SECTION 3: Media Preview ── -->
          <div v-if="mediaFiles.length > 0" class="xl-section">
            <div class="xl-section__head">
              <span class="xl-section__num">{{ advert?.attachments?.length > 0 ? '04' : '03' }}</span>
              <span class="xl-section__title">New Files Preview</span>
            </div>
            <div class="xl-section__body">
              <div class="preview-grid">
                <div v-for="(file, index) in mediaFiles" :key="index" class="preview-card">
                  <div class="preview-card__head">
                    <span class="preview-card__name">{{ file.name }}</span>
                    <span class="preview-card__size">{{ formatFileSize(file.size) }}</span>
                  </div>
                  <div class="preview-card__body">
                    <img v-if="isImage(file)" :src="getObjectURL(file)" :alt="file.name" class="preview-card__img">
                    <video v-else-if="isVideo(file)" controls class="preview-card__video">
                      <source :src="getObjectURL(file)" :type="file.type">
                    </video>
                    <div v-else class="preview-card__file">
                      <div class="preview-card__file-icon">{{ getFileIcon(file.name) }}</div>
                      <div class="preview-card__file-type">{{ getFileExtension(file.name) }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- ── PROGRESS ── -->
          <div v-if="scheduling" class="sched-progress">
            <div class="sched-progress__label">Scheduling Advert…</div>
            <div class="prog-bar"><div class="prog-fill prog-fill--indeterminate"></div></div>
            <div class="sched-progress__sub">Please wait while we schedule your advert</div>
          </div>

          <!-- ── ERROR ── -->
          <div v-if="scheduleError" class="xl-error-box">
            <span class="xl-error-box__icon">&#9888;</span>
            <span>{{ scheduleError }}</span>
          </div>

          <!-- ── FOOTER ── -->
          <div class="sched-footer">
            <div class="sched-footer__stats">
              <span v-if="selectedAttachmentIds.length > 0" class="sfd-cms">
                <svg width="11" height="11" viewBox="0 0 16 16" fill="none" style="vertical-align:middle;margin-right:3px"><path d="M2 8l4 4 8-8" stroke="#375623" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                {{ selectedAttachmentIds.length }} CMS file{{ selectedAttachmentIds.length !== 1 ? 's' : '' }}
              </span>
              <span v-if="selectedAttachmentIds.length > 0 && mediaFiles.length > 0" class="sfd-div">+</span>
              <span v-if="mediaFiles.length > 0">{{ mediaFiles.length }} new file{{ mediaFiles.length !== 1 ? 's' : '' }}</span>
              <span v-if="mediaFiles.length === 0 && selectedAttachmentIds.length === 0" class="sfd-empty">No files selected</span>
              <span v-if="mediaFiles.length > 0" class="sfd-div">|</span>
              <span v-if="mediaFiles.length > 0">{{ formatFileSize(totalFileSize) }}</span>
            </div>
            <div class="sched-footer__actions">
              <button type="button" class="act-btn act-btn--dl" @click="close" :disabled="scheduling">Cancel</button>
              <button
                type="submit"
                class="act-btn act-btn--submit"
                :disabled="scheduling || !scheduleDate || (mediaFiles.length === 0 && selectedAttachmentIds.length === 0)"
              >
                <span v-if="scheduling"><span class="btn-spinner"></span> Scheduling…</span>
                <span v-else>Schedule Advert</span>
              </button>
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
const selectedAttachmentIds = ref([])

// Constants
const acceptedFileTypes = '.jpg,.jpeg,.png,.gif,.mp4,.mov,.avi,.wmv,.pdf,.psd,.ai,.eps,.svg'
const supportedFileTypes = 'Images, Videos, PDF, Design Files'
const maxFileSizeMB = 100
const maxTotalSizeMB = 1000

// Today string for publishing dates highlight
const todayStr = new Date().toISOString().split('T')[0]

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
  if (!runHour.value || runMinute.value === '' || !runPeriod.value) return ''
  const hour   = String(runHour.value).padStart(2, '0')
  const minute = String(runMinute.value).padStart(2, '0')
  return `${hour}:${minute} ${runPeriod.value}`
})

// Attachment selection helpers
const allAttachmentsSelected = computed(() => {
  const atts = props.advert?.attachments || []
  return atts.length > 0 && atts.every(a => selectedAttachmentIds.value.includes(a.id))
})

const toggleAttachment = (id) => {
  const idx = selectedAttachmentIds.value.indexOf(id)
  if (idx === -1) selectedAttachmentIds.value.push(id)
  else selectedAttachmentIds.value.splice(idx, 1)
}

const toggleSelectAll = () => {
  const atts = props.advert?.attachments || []
  if (allAttachmentsSelected.value) {
    selectedAttachmentIds.value = []
  } else {
    selectedAttachmentIds.value = atts.map(a => a.id)
  }
}

// Click a publishing date chip to pre-fill the schedule date
const selectDate = (d) => {
  if (d >= minDate.value) {
    scheduleDate.value = d
    clearError('scheduleDate')
  }
}

// Short date formatter for publishing date chips
const fmtShortDate = (s) => {
  if (!s) return '—'
  try { return new Date(s + 'T00:00:00').toLocaleDateString('en-UG', { month: 'short', day: 'numeric' }) }
  catch { return s }
}

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
  
  if (mediaFiles.value.length === 0 && selectedAttachmentIds.value.length === 0) {
    alert('Please select at least one file — either choose from existing CMS attachments or upload new files')
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
      mediaFiles: mediaFiles.value,
      existingAttachmentIds: selectedAttachmentIds.value,
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
    
    // Call the scheduleAdvert function — composable expects (advertId, scheduleData)
    const { advertId: _id, ...restScheduleData } = scheduleData
    const result = await scheduleAdvert(_id, restScheduleData)
    
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
  selectedAttachmentIds.value = []
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
</script>

<style scoped>
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,.72);
  backdrop-filter: blur(3px);
  display: flex; align-items: center; justify-content: center;
  z-index: 4000; padding: 20px;
}

/* ── MODAL SHELL ── */
.sched-modal {
  background: #fff;
  width: 100%; max-width: 720px;
  max-height: 92vh;
  display: flex; flex-direction: column;
  border-top: 4px solid #1F3864;
  font-family: 'IBM Plex Sans', 'Segoe UI', sans-serif;
  font-size: 13px;
}
.sched-modal__head {
  background: #1F3864;
  padding: 14px 20px;
  display: flex; justify-content: space-between; align-items: flex-start;
  flex-shrink: 0;
}
.sched-modal__head-left { display: flex; flex-direction: column; gap: 2px; }
.sched-modal__title { color: #fff; font-size: 15px; font-weight: 700; }
.sched-modal__ref   { color: #9DC3E6; font-size: 11px; font-family: 'IBM Plex Mono', monospace; }
.sched-modal__close {
  background: none; border: none; color: #9DC3E6;
  font-size: 24px; cursor: pointer; line-height: 1; padding: 0;
}
.sched-modal__close:hover { color: #fff; }

/* ── INFO BAND ── */
.info-band {
  display: flex; align-items: stretch;
  background: #DEEAF1;
  border-bottom: 1px solid #9DC3E6;
  flex-shrink: 0;
}
.info-band__cell { padding: 10px 16px; flex: 1; }
.info-band__div  { width: 1px; background: #9DC3E6; }
.info-band__lbl  { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: .4px; color: #6081a3; }
.info-band__val  { font-size: 12px; font-weight: 600; color: #1F3864; margin-top: 2px; }
.plat-chip {
  display: inline-block;
  background: #1F3864; color: #fff;
  font-size: 10px; font-weight: 700;
  padding: 1px 8px;
}
.ref-mono { font-family: 'IBM Plex Mono', monospace; }

/* ── PUBLISHING DATES BAND ── */
.pub-band {
  background: #F7FBFE;
  border-bottom: 2px solid #9DC3E6;
  padding: 9px 16px;
  display: flex; align-items: flex-start; gap: 12px;
  flex-shrink: 0;
}
.pub-band__lbl {
  font-size: 10px; font-weight: 700;
  text-transform: uppercase; letter-spacing: .4px;
  color: #1F3864;
  white-space: nowrap;
  padding-top: 3px;
  display: flex; align-items: center; gap: 6px;
}
.pub-band__count {
  background: #DEEAF1; color: #1F3864;
  border: 1px solid #9DC3E6;
  font-size: 10px; font-weight: 700;
  padding: 1px 6px;
}
.pub-band__dates { display: flex; flex-wrap: wrap; gap: 4px; }
.pub-chip {
  display: inline-block;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 10px; font-weight: 600;
  background: #DEEAF1; color: #1F3864;
  border: 1px solid #9DC3E6;
  padding: 2px 7px;
  cursor: pointer;
  user-select: none;
  transition: background .1s;
}
.pub-chip:hover { background: #BDD7EE; }
.pub-chip--today { background: #1F3864; color: #fff; border-color: #1F3864; }
.pub-chip--past  { background: #F7FBFE; color: #aaa; border-color: #DEEAF1; cursor: default; }
.pub-chip--match     { background: #375623; color: #fff; border-color: #375623; }
.pub-chip--scheduled {
  background: #FCE4D6; color: #9C0006;
  border-color: #E31E24; font-weight: 700;
}
.pub-chip--scheduled:hover { background: #f4c7b4; }

/* ── BODY ── */
.sched-modal__body { flex: 1; overflow-y: auto; padding: 0; }

/* ── SECTIONS ── */
.xl-section { border-bottom: 1px solid #DEEAF1; }
.xl-section:last-child { border-bottom: none; }
.xl-section__head {
  background: #F7FBFE;
  border-bottom: 1px solid #DEEAF1;
  padding: 8px 20px;
  display: flex; align-items: center; gap: 10px;
}
.xl-section__num   {
  background: #1F3864; color: #fff;
  font-size: 10px; font-weight: 700;
  padding: 1px 6px;
  font-family: 'IBM Plex Mono', monospace;
}
.xl-section__title { font-size: 12px; font-weight: 700; color: #1F3864; text-transform: uppercase; letter-spacing: .4px; }
.xl-section__limits{ font-size: 10px; color: #888; margin-left: auto; }
.xl-section__body  { padding: 16px 20px; }

/* ── FORM ── */
.form-row { display: flex; gap: 20px; flex-wrap: wrap; }
.fgroup   { display: flex; flex-direction: column; gap: 5px; flex: 1; min-width: 160px; }
.fgroup--note { justify-content: flex-end; }
.flabel   { font-size: 11px; font-weight: 600; color: #555; }
.req      { color: #E31E24; }
.xl-input {
  border: 1px solid #BDD7EE; padding: 6px 10px;
  font-size: 12px; border-radius: 0;
  font-family: 'IBM Plex Mono', monospace;
  background: #fff;
}
.xl-input:focus   { outline: none; border-color: #9DC3E6; box-shadow: 0 0 0 2px rgba(157,195,230,.25); }
.xl-input--error  { border-color: #E31E24; background: #FFF5F5; }
.xl-select {
  border: 1px solid #BDD7EE; padding: 6px 8px;
  font-size: 12px; border-radius: 0; background: #fff;
}
.xl-select:focus  { outline: none; border-color: #9DC3E6; }
.ferror   { font-size: 11px; color: #E31E24; }
.fwarn    { font-size: 11px; color: #9C5700; background: #FFEB9C; border: 1px solid #FFCC00; padding: 3px 7px; }
.note-box {
  background: #DEEAF1; color: #1F3864;
  border: 1px solid #9DC3E6;
  padding: 6px 10px; font-size: 11px; font-weight: 500;
}
.time-row    { display: flex; align-items: center; gap: 4px; }
.time-sel    { width: 56px; }
.period-sel  { width: 66px; }
.time-colon  { font-weight: 700; color: #555; }

/* ── DROP ZONE ── */
.drop-zone {
  border: 2px dashed #BDD7EE;
  background: #F7FBFE;
  transition: border-color .15s, background .15s;
  min-height: 120px;
  display: flex; align-items: center; justify-content: center;
}
.drop-zone--over   { border-color: #1F3864; background: #DEEAF1; }
.drop-zone--filled { border-style: solid; border-color: #9DC3E6; background: #fff; align-items: flex-start; }
.drop-zone__empty  { text-align: center; padding: 28px 20px; }
.drop-zone__icon   { font-size: 32px; color: #9DC3E6; line-height: 1; }
.drop-zone__msg    { font-size: 13px; color: #555; margin: 8px 0 4px; }
.drop-zone__browse {
  background: none; border: none; color: #1F3864;
  text-decoration: underline; cursor: pointer; font-size: 13px; font-weight: 600;
}
.drop-zone__browse:hover { color: #E31E24; }
.drop-zone__sub    { font-size: 11px; color: #999; }
.drop-zone__list   { width: 100%; padding: 14px 16px; }
.drop-zone__list-head {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 10px;
}
.drop-zone__list-count { font-size: 12px; font-weight: 600; color: #1F3864; }
.file-rows { display: flex; flex-direction: column; gap: 4px; }
.file-row {
  display: flex; align-items: center; gap: 10px;
  padding: 6px 10px;
  background: #F7FBFE;
  border: 1px solid #DEEAF1;
}
.file-row__icon { font-size: 16px; flex-shrink: 0; }
.file-row__info { flex: 1; min-width: 0; }
.file-row__name { font-size: 12px; font-weight: 500; color: #333; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.file-row__meta { font-size: 10px; color: #999; }

/* ── PREVIEW GRID ── */
.preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}
.preview-card { border: 1px solid #BDD7EE; overflow: hidden; }
.preview-card__head {
  background: #1F3864; color: #fff;
  padding: 6px 10px;
  display: flex; justify-content: space-between; align-items: center;
}
.preview-card__name { font-size: 10px; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; }
.preview-card__size { font-size: 10px; opacity: .7; margin-left: 8px; flex-shrink: 0; }
.preview-card__body { padding: 10px; text-align: center; background: #F7FBFE; }
.preview-card__img  { max-width: 100%; max-height: 160px; object-fit: contain; }
.preview-card__video{ max-width: 100%; max-height: 160px; }
.preview-card__file { padding: 16px 0; }
.preview-card__file-icon { font-size: 32px; }
.preview-card__file-type { font-size: 11px; color: #666; font-weight: 600; margin-top: 4px; }

/* ── PROGRESS ── */
.sched-progress {
  background: #F7FBFE;
  border: 1px solid #DEEAF1;
  margin: 0 20px 16px;
  padding: 14px 16px;
}
.sched-progress__label { font-size: 12px; font-weight: 600; color: #1F3864; margin-bottom: 8px; }
.sched-progress__sub   { font-size: 11px; color: #888; margin-top: 6px; }
.prog-bar { height: 6px; background: #DEEAF1; overflow: hidden; }
.prog-fill { height: 100%; background: #375623; }
.prog-fill--indeterminate {
  width: 100%;
  animation: indeterminate 1.4s infinite;
  background: linear-gradient(90deg, #1F3864 0%, #9DC3E6 50%, #1F3864 100%);
  background-size: 200% 100%;
}
@keyframes indeterminate {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ── ERROR BOX ── */
.xl-error-box {
  background: #FCE4D6; border: 1px solid #FF7043;
  display: flex; align-items: center; gap: 10px;
  padding: 10px 20px; margin: 0 20px 16px;
  font-size: 12px; color: #9C0006;
}
.xl-error-box__icon { font-size: 15px; }

/* ── FOOTER ── */
.sched-footer {
  padding: 14px 20px;
  border-top: 2px solid #DEEAF1;
  background: #F7FBFE;
  display: flex; justify-content: space-between; align-items: center;
  flex-shrink: 0;
}
.sched-footer__stats { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #666; }
.sfd-div { color: #BDD7EE; }
.sched-footer__actions { display: flex; gap: 8px; }

/* ── ACTION BUTTONS ── */
.act-btn {
  display: inline-block;
  font-size: 12px; font-weight: 600;
  padding: 6px 14px;
  border: 1px solid transparent;
  cursor: pointer; border-radius: 0;
  white-space: nowrap; font-family: inherit;
  transition: opacity .15s;
}
.act-btn:disabled { opacity: .5; cursor: not-allowed; }
.act-btn--dl      { background: #DEEAF1; color: #1F3864; border-color: #9DC3E6; }
.act-btn--dl:hover:not(:disabled) { background: #c5d9ec; }
.act-btn--remove  { background: #FCE4D6; color: #9C0006; border-color: #FF7043; font-size: 11px; padding: 3px 8px; }
.act-btn--remove:hover { background: #f4c7b4; }
.act-btn--submit  {
  background: #E31E24; color: #fff; border-color: #E31E24;
  display: inline-flex; align-items: center; gap: 6px;
}
.act-btn--submit:hover:not(:disabled) { background: #c01820; }
.btn-spinner {
  display: inline-block;
  width: 12px; height: 12px;
  border: 2px solid rgba(255,255,255,.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
  vertical-align: middle;
}
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 768px) {
  .info-band { flex-direction: column; }
  .info-band__div { width: 100%; height: 1px; }
  .pub-band { flex-direction: column; gap: 6px; }
  .form-row { flex-direction: column; }
  .preview-grid { grid-template-columns: 1fr; }
  .sched-footer { flex-direction: column; gap: 10px; align-items: stretch; }
  .sched-footer__actions { flex-direction: column; }
  .act-btn { width: 100%; text-align: center; justify-content: center; }
}
/* ── ATTACHMENTS TABLE ── */
.att-body       { padding: 0; }
.att-select-all {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 14px;
  background: #F7FBFE;
  border-bottom: 1px solid #DEEAF1;
}
.att-check-lbl  { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 600; color: #1F3864; cursor: pointer; }
.att-check      { accent-color: #1F3864; cursor: pointer; }
.att-sel-count  { font-size: 11px; color: #375623; font-weight: 700; background: #E2EFDA; border: 1px solid #A9D18E; padding: 1px 7px; }
.att-table-wrap { overflow-x: auto; }
.att-tbl { width: 100%; border-collapse: collapse; font-size: 12px; }
.att-tbl thead tr { background: #DEEAF1; }
.att-tbl thead th {
  padding: 6px 10px; font-size: 10px; font-weight: 700;
  text-transform: uppercase; letter-spacing: .4px; color: #1F3864;
  border-bottom: 1px solid #9DC3E6; border-right: 1px solid #BDD7EE;
  text-align: left; white-space: nowrap;
}
.att-tbl thead th:last-child { border-right: none; }
.att-row { border-bottom: 1px solid #EBF4FF; cursor: pointer; transition: background .1s; }
.att-row:last-child { border-bottom: none; }
.att-row:nth-child(even) { background: #F7FBFE; }
.att-row:hover { background: #EBF4FF; }
.att-row--selected { background: #E2EFDA !important; }
.att-tbl td { padding: 7px 10px; border-right: 1px solid #EBF4FF; vertical-align: middle; }
.att-tbl td:last-child { border-right: none; }
.att-tc-chk  { width: 32px; text-align: center; }
.att-tc-type { width: 60px; text-align: center; }
.att-tc-size { width: 80px; text-align: right; }
.att-tc-prev { width: 44px; text-align: center; }
.att-fname   { display: flex; align-items: center; gap: 7px; }
.att-icon    { font-size: 14px; flex-shrink: 0; }
.att-name-text { font-weight: 500; color: #222; word-break: break-word; }
.att-ext {
  display: inline-block; font-family: 'IBM Plex Mono', monospace;
  font-size: 9px; font-weight: 700;
  background: #DEEAF1; color: #1F3864; border: 1px solid #9DC3E6; padding: 1px 4px;
}
.att-prev-link {
  display: inline-flex; align-items: center; justify-content: center;
  width: 24px; height: 24px; color: #6081a3;
  border: 1px solid #BDD7EE; background: #F7FBFE;
}
.att-prev-link:hover { color: #1F3864; background: #DEEAF1; }
.xl-section__badge--green {
  font-size: 10px; font-weight: 700; color: #375623;
  background: #E2EFDA; border: 1px solid #A9D18E; padding: 1px 7px; margin-left: 8px;
}
.xl-section__optional { font-size: 10px; color: #9C5700; background: #FFEB9C; border: 1px solid #FFCC00; padding: 1px 7px; margin-left: 8px; font-weight: 600; }
.sfd-cms   { color: #375623; font-weight: 600; }
.sfd-empty { color: #bbb; font-style: italic; }

</style>