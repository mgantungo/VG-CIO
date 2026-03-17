<!-- components/clerk/AdditionalInformation -->
<template>
  <div class="form-section">
    <div class="section-header">
      <h3 class="section-title">Additional Information</h3>
      <div class="section-badge">Optional</div>
    </div>
    
    <div class="form-group">
      <label>
        Special Instructions
        <span v-if="hasDatesInInstructions" class="dates-indicator">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3.5 7L5.5 9L10.5 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Dates Included
        </span>
      </label>
      <div class="textarea-wrapper">
        <textarea 
          :value="modelValue"
          rows="4" 
          placeholder="Any special requirements or instructions..."
          :disabled="disabled"
          @input="updateValue($event.target.value)"
          ref="textareaRef"
        ></textarea>
        <div class="textarea-actions" v-if="hasDatesInInstructions">
          <button 
            type="button" 
            class="action-button view-dates" 
            @click="toggleDatesView"
            :disabled="disabled"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 2.33301C4.33333 2.33301 2.33333 4.99967 2.33333 4.99967C2.33333 4.99967 4.33333 7.66634 7 7.66634C9.66667 7.66634 11.6667 4.99967 11.6667 4.99967C11.6667 4.99967 9.66667 2.33301 7 2.33301Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              <circle cx="7" cy="5" r="1.33333" stroke="currentColor" stroke-width="1.5"/>
            </svg>
            {{ showDates ? 'Hide Dates' : 'View Dates' }}
          </button>
          <button 
            type="button" 
            class="action-button remove-dates" 
            @click="removeDatesFromInstructions"
            :disabled="disabled"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 5L5 9M5 5L9 9M7 12.3337C3.68629 12.3337 1 9.64737 1 6.33366C1 3.01995 3.68629 0.33366 7 0.33366C10.3137 0.33366 13 3.01995 13 6.33366C13 9.64737 10.3137 12.3337 7 12.3337Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Remove Dates
          </button>
        </div>
      </div>
      
      <!-- Dates Preview -->
      <div v-if="showDates && extractedDates.length > 0" class="dates-preview">
        <div class="dates-preview-header">
          <h4>Included Dates</h4>
          <span class="dates-count">{{ extractedDates.length }} dates</span>
        </div>
        <div class="dates-list">
          <div 
            v-for="date in extractedDates" 
            :key="date"
            class="date-item"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <rect x="2" y="3" width="8" height="7" rx="1" stroke="#4A6FDC" stroke-width="1.5"/>
              <path d="M2 5H10" stroke="#4A6FDC" stroke-width="1.5"/>
              <path d="M4 1.5V3" stroke="#4A6FDC" stroke-width="1.5" stroke-linecap="round"/>
              <path d="M8 1.5V3" stroke="#4A6FDC" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            <span>{{ formatDateForDisplay(date) }}</span>
          </div>
        </div>
        <div class="dates-format-note">
          Format: <code>dates[{{ extractedDates.join(', ') }}]</code>
        </div>
      </div>
      
      <div class="form-group-underline"></div>
      <small class="help-text">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style="vertical-align: middle; margin-right: 4px;">
          <circle cx="6" cy="6" r="5" stroke="#7C8DB5" stroke-width="1.5"/>
          <path d="M6 4V6M6 8H6.005" stroke="#7C8DB5" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        Dates from schedule will be automatically added in the format: dates[2024-01-15, 2024-01-20]
      </small>
    </div>

    <div class="form-actions" v-if="hasDatesInInstructions">
      <button 
        type="button" 
        class="btn-copy-dates" 
        @click="copyDatesToClipboard"
        :disabled="disabled"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="3.5" y="3.5" width="7" height="7" rx="1" stroke="currentColor" stroke-width="1.5"/>
          <path d="M7 1.16699H4.66667C3.74619 1.16699 3 1.91318 3 2.83366V5.16699" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        Copy Dates
      </button>
      <button 
        type="button" 
        class="btn-add-manual" 
        @click="openDateInput"
        :disabled="disabled"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M7 1V13M1 7H13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        Add Date Manually
      </button>
    </div>

    <!-- Manual Date Input Modal -->
    <div v-if="showManualDateInput" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h4>Add Date Manually</h4>
          <button type="button" class="close-modal" @click="closeDateInput">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M12 4L4 12M4 4L12 12" stroke="#64748B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Date (YYYY-MM-DD)</label>
            <input 
              v-model="manualDateInput"
              type="date"
              class="date-input"
              :min="minDate"
              :disabled="disabled"
              @keyup.enter="addManualDate"
            >
            <small class="help-text">Enter date in YYYY-MM-DD format</small>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-cancel" @click="closeDateInput">Cancel</button>
            <button 
              type="button" 
              class="btn-add" 
              @click="addManualDate"
              :disabled="!manualDateInput || disabled"
            >
              Add Date
            </button>
          </div>
        </div>
      </div>
    </div>

    <slot name="file-upload">
      <!-- Slot for file upload component -->
      <div v-if="!$slots['file-upload']" class="no-file-upload-message">
        <svg class="upload-icon" width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="#7C8DB5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M17 8L12 3L7 8" stroke="#7C8DB5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M12 3V15" stroke="#7C8DB5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <p>File upload component not provided</p>
      </div>
    </slot>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, ref, computed, watch, onMounted } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  },
  // Optional prop to receive dates from parent
  datesString: {
    type: String,
    default: ''
  },
  // Minimum date for manual entry
  minDate: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue'])

// Refs
const textareaRef = ref(null)
const showDates = ref(false)
const showManualDateInput = ref(false)
const manualDateInput = ref('')

// Computed properties
const hasDatesInInstructions = computed(() => {
  return extractDatesFromText(props.modelValue).length > 0
})

const extractedDates = computed(() => {
  return extractDatesFromText(props.modelValue)
})

// Watch for datesString prop changes (from SchedulePricing component)
watch(() => props.datesString, (newDatesString) => {
  if (newDatesString) {
    addDatesToInstructions(newDatesString)
  }
})

// Methods
const updateValue = (value) => {
  emit('update:modelValue', value)
}

const extractDatesFromText = (text) => {
  if (!text) return []
  
  // Look for dates pattern: dates[2024-01-15, 2024-01-20]
  const datesMatch = text.match(/dates\[([^\]]+)\]/)
  if (!datesMatch) return []
  
  const datesString = datesMatch[1]
  return datesString.split(',').map(date => date.trim()).filter(date => date)
}

const addDatesToInstructions = (datesString) => {
  const currentText = props.modelValue || ''
  const datesPattern = /dates\[[^\]]*\]/
  
  // If dates already exist, replace them
  if (datesPattern.test(currentText)) {
    const updatedText = currentText.replace(datesPattern, `dates[${datesString}]`)
    updateValue(updatedText)
  } else {
    // Add dates to beginning of text
    const prefix = currentText ? '\n\n' : ''
    const updatedText = `dates[${datesString}]${prefix}${currentText}`
    updateValue(updatedText)
  }
}

const removeDatesFromInstructions = () => {
  const currentText = props.modelValue || ''
  const datesPattern = /dates\[[^\]]*\]/
  
  if (datesPattern.test(currentText)) {
    const updatedText = currentText.replace(datesPattern, '').trim()
    updateValue(updatedText)
    showDates.value = false
  }
}

const toggleDatesView = () => {
  showDates.value = !showDates.value
}

const formatDateForDisplay = (dateString) => {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  } catch (error) {
    return dateString
  }
}

const copyDatesToClipboard = async () => {
  const datesText = extractedDates.value.join(', ')
  try {
    await navigator.clipboard.writeText(datesText)
    // You could add a toast notification here
    alert('Dates copied to clipboard!')
  } catch (err) {
    console.error('Failed to copy dates:', err)
    // Fallback for older browsers
    const textArea = document.createElement('textarea')
    textArea.value = datesText
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    alert('Dates copied to clipboard!')
  }
}

const openDateInput = () => {
  showManualDateInput.value = true
  // Set today's date as default
  const today = new Date().toISOString().split('T')[0]
  manualDateInput.value = today
}

const closeDateInput = () => {
  showManualDateInput.value = false
  manualDateInput.value = ''
}

const addManualDate = () => {
  if (!manualDateInput.value) return
  
  const newDate = manualDateInput.value
  const currentDates = [...extractedDates.value]
  
  // Check if date already exists
  if (!currentDates.includes(newDate)) {
    currentDates.push(newDate)
    // Sort dates
    currentDates.sort()
    
    // Update instructions
    const datesString = currentDates.join(', ')
    addDatesToInstructions(datesString)
  }
  
  closeDateInput()
}

// Focus the textarea when dates are added
watch(extractedDates, (newDates) => {
  if (newDates.length > 0 && textareaRef.value) {
    textareaRef.value.focus()
  }
})

// Initialize with current value
onMounted(() => {
  if (props.datesString) {
    addDatesToInstructions(props.datesString)
  }
})
</script>

<style scoped>

@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@600&display=swap');

.form-section { 
  --navy:        #003366;
  --navy-light:  #004080;
  --red:         #E31E24;
  --blue:        #0066CC;
  --blue-lt:     #EEF4FF;
  --surface:     #FFFFFF;
  --page-bg:     #F0F4F8;
  --border:      #D1D9E0;
  --border-lt:   #E8ECF0;
  --text-1:      #0F172A;
  --text-2:      #334155;
  --text-3:      #64748B;
  --text-4:      #94A3B8;
  --green-text:  #166534;
  --green-bg:    #F0FDF4;
  --green-bd:    #86EFAC;
  --red-text:    #991B1B;
  --red-bg:      #FEF2F2;
  --red-bd:      #FECACA;
  --amber-text:  #78350F;
  --amber-bg:    #FFFBEB;
  --amber-bd:    #FCD34D;
  --radius:      2px;
  --ring:        0 0 0 3px rgba(0,102,204,.15);
  --shadow-sm:   0 1px 3px rgba(0,0,0,.07), 0 1px 2px rgba(0,0,0,.05);
  --shadow-md:   0 4px 16px rgba(0,0,0,.08), 0 2px 6px rgba(0,0,0,.05);
  --t:           140ms ease;
  --font:        "IBM Plex Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;

  background: var(--surface); border-radius: var(--radius);
  box-shadow: var(--shadow-sm); overflow: hidden;
  font-family: var(--font); font-size: 13px;
}

.section-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 20px; background: var(--navy);
}
.section-title { margin: 0; color: #fff; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .07em; }
.section-badge {
  height: 22px; padding: 0 10px; display: inline-flex; align-items: center;
  border-radius: 1px; font-size: 11px; font-weight: 600; letter-spacing: .03em;
  background: var(--amber-bg); color: var(--amber-text); border: 1px solid var(--amber-bd);
}

.form-group { padding: 16px 20px; border-bottom: 1px solid var(--border-lt); }
.form-group:last-child { border-bottom: none; }

.form-group label {
  display: flex; align-items: center; gap: 8px;
  font-size: 11px; font-weight: 600; text-transform: uppercase;
  letter-spacing: .06em; color: var(--text-3); margin-bottom: 8px;
}

.dates-indicator {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: .04em;
  padding: 2px 8px; border-radius: 1px;
  background: var(--green-bg); color: var(--green-text); border: 1px solid var(--green-bd);
}

.textarea-wrapper { position: relative; }
.textarea-wrapper textarea {
  width: 100%; padding: 10px 12px; min-height: 90px;
  border: 1.5px solid var(--border); border-radius: var(--radius);
  font-family: var(--font); font-size: 13px; color: var(--text-1);
  background: var(--surface); resize: vertical; outline: none; box-sizing: border-box;
  transition: border-color var(--t), box-shadow var(--t);
}
.textarea-wrapper textarea:focus { border-color: var(--blue); box-shadow: var(--ring); }
.textarea-wrapper textarea:disabled { background: var(--page-bg); color: var(--text-4); cursor: not-allowed; }

.textarea-actions { display: flex; gap: 6px; margin-top: 8px; }

.action-button {
  display: inline-flex; align-items: center; gap: 5px;
  height: 30px; padding: 0 12px; border-radius: var(--radius);
  font-family: var(--font); font-size: 12px; font-weight: 600;
  cursor: pointer; border: 1.5px solid var(--border); background: var(--surface);
  color: var(--text-3); transition: all var(--t);
}
.action-button:hover:not(:disabled) { border-color: var(--blue); color: var(--blue); background: var(--blue-lt); }
.action-button:disabled { opacity: .45; cursor: not-allowed; }

.view-dates { }
.remove-dates:hover:not(:disabled) { border-color: var(--red); color: var(--red-text); background: var(--red-bg); }

.dates-preview {
  margin-top: 10px; border-radius: var(--radius); overflow: hidden;
  border: 1px solid var(--border-lt); box-shadow: var(--shadow-sm);
}
.dates-preview-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 8px 12px; background: var(--navy);
}
.dates-preview-header h4 { margin: 0; color: #fff; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; }
.dates-count {
  height: 20px; padding: 0 8px; display: inline-flex; align-items: center;
  background: rgba(255,255,255,.15); color: #fff; font-size: 10px; font-weight: 700;
  border-radius: 1px;
}

.dates-list { display: flex; flex-wrap: wrap; gap: 6px; padding: 12px; background: var(--surface); }
.date-item {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 11px; font-weight: 600; color: var(--blue);
  background: var(--blue-lt); border: 1px solid rgba(0,102,204,.15);
  padding: 3px 8px; border-radius: 1px;
  font-family: "IBM Plex Mono", monospace;
}

.dates-format-note {
  padding: 8px 12px; font-size: 11px; color: var(--text-3);
  border-top: 1px solid var(--border-lt); background: var(--page-bg);
}
.dates-format-note code {
  background: var(--surface); border: 1px solid var(--border);
  padding: 1px 5px; border-radius: 1px;
  font-family: "IBM Plex Mono", monospace; color: var(--blue); font-size: 10px;
}

.form-group-underline { display: none; }

.help-text {
  display: flex; align-items: center; margin-top: 8px;
  font-size: 11px; color: var(--text-4); font-style: italic;
}

.form-actions {
  display: flex; gap: 8px; padding: 14px 20px;
  border-top: 1px solid var(--border-lt); background: var(--page-bg);
}

.btn-copy-dates,
.btn-add-manual {
  display: inline-flex; align-items: center; gap: 6px;
  height: 34px; padding: 0 14px; border-radius: var(--radius);
  font-family: var(--font); font-size: 12px; font-weight: 600;
  cursor: pointer; border: none; transition: all var(--t);
}
.btn-copy-dates { background: var(--navy); color: #fff; }
.btn-copy-dates:hover:not(:disabled) { background: var(--navy-light); }
.btn-add-manual { background: var(--surface); color: var(--text-2); border: 1.5px solid var(--border); }
.btn-add-manual:hover:not(:disabled) { border-color: var(--blue); color: var(--blue); background: var(--blue-lt); }
.btn-copy-dates:disabled, .btn-add-manual:disabled { opacity: .45; cursor: not-allowed; }

/* Modal */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,.45);
  display: flex; align-items: center; justify-content: center; z-index: 1000;
}
.modal-content {
  background: var(--surface); border-radius: var(--radius);
  width: 90%; max-width: 380px; box-shadow: 0 20px 60px rgba(0,0,0,.25);
  overflow: hidden;
}
.modal-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 12px 18px; background: var(--navy);
}
.modal-header h4 { margin: 0; color: #fff; font-size: 13px; font-weight: 700; }
.close-modal {
  background: none; border: none; color: rgba(255,255,255,.7);
  cursor: pointer; padding: 2px; border-radius: var(--radius);
  display: flex; align-items: center; justify-content: center;
  transition: color var(--t);
}
.close-modal:hover { color: #fff; }

.modal-body { padding: 18px; }
.modal-body .form-group { margin-bottom: 14px; padding: 0; border: none; }
.modal-body .form-group label {
  display: block; margin-bottom: 6px; font-size: 11px; font-weight: 600;
  text-transform: uppercase; letter-spacing: .06em; color: var(--text-3);
}
.date-input { 
  width: 100%; height: 38px; padding: 0 12px;
  border: 1.5px solid var(--border); border-radius: var(--radius);
  font-family: var(--font); font-size: 13px; color: var(--text-1);
  background: var(--surface); outline: none; box-sizing: border-box;
  transition: border-color var(--t), box-shadow var(--t);
 }
.date-input:focus { border-color: var(--blue); box-shadow: var(--ring); }
.modal-body .help-text { display: block; margin-top: 5px; font-size: 11px; color: var(--text-4); font-style: italic; }

.modal-actions {
  display: flex; justify-content: flex-end; gap: 8px;
  padding-top: 14px; border-top: 1px solid var(--border-lt);
}
.btn-cancel, .btn-add {
  height: 34px; padding: 0 16px; border-radius: var(--radius);
  font-family: var(--font); font-size: 13px; font-weight: 600;
  cursor: pointer; border: none; transition: all var(--t);
}
.btn-cancel { background: var(--page-bg); color: var(--text-2); border: 1.5px solid var(--border); }
.btn-cancel:hover { background: #E2E8F0; }
.btn-add { background: var(--navy); color: #fff; }
.btn-add:hover:not(:disabled) { background: var(--navy-light); }
.btn-add:disabled { opacity: .45; cursor: not-allowed; }

.no-file-upload-message {
  margin: 16px 20px; padding: 28px 16px; text-align: center;
  background: var(--page-bg); border: 1.5px dashed var(--border);
  border-radius: var(--radius); color: var(--text-3); font-size: 13px;
  transition: border-color var(--t);
}
.no-file-upload-message:hover { border-color: var(--blue); }
.no-file-upload-message p { margin-top: 10px; font-weight: 500; }
.upload-icon { margin: 0 auto 10px; opacity: .4; }

@keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }

@media (max-width: 768px) {
  .section-header { flex-direction: column; align-items: flex-start; gap: 6px; }
  .form-actions { flex-direction: column; }
  .dates-list { flex-direction: column; }
}

</style>