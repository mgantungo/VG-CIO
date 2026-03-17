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
.form-section {
  margin-bottom: 40px;
  padding: 30px;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%);
  border-radius: 14px;
  border: 1px solid #e6e9f4;
  box-shadow: 0 6px 15px rgba(42, 75, 140, 0.08);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.section-title {
  color: #2A4B8C;
  font-size: 1.3em;
  font-weight: 700;
  margin: 0;
  background: linear-gradient(90deg, #2A4B8C 0%, #4A6FDC 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.section-badge {
  background: linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%);
  color: white;
  font-size: 0.75em;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 20px;
  letter-spacing: 0.5px;
  box-shadow: 0 2px 4px rgba(139, 92, 246, 0.2);
}

.form-group {
  margin-bottom: 25px;
  position: relative;
}

.form-group label {
  display: block;
  margin-bottom: 10px;
  color: #2A4B8C;
  font-weight: 600;
  font-size: 0.95em;
  letter-spacing: 0.3px;
}

.dates-indicator {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-left: 8px;
  padding: 2px 8px;
  background: linear-gradient(135deg, #10B981 0%, #34D399 100%);
  color: white;
  font-size: 0.75em;
  font-weight: 600;
  border-radius: 12px;
  vertical-align: middle;
}

.dates-indicator svg {
  stroke: currentColor;
}

.textarea-wrapper {
  position: relative;
}

.form-group textarea {
  width: 100%;
  padding: 14px 16px;
  border: 2px solid #e6e9f4;
  border-radius: 10px;
  font-size: 1em;
  transition: all 0.3s ease;
  background-color: #ffffff;
  resize: vertical;
  min-height: 120px;
  color: #2D3748;
  font-family: inherit;
}

.form-group textarea:focus {
  outline: none;
  border-color: #4A6FDC;
  box-shadow: 0 0 0 3px rgba(74, 111, 220, 0.15);
  background-color: #ffffff;
}

.form-group textarea:disabled {
  background-color: #F7F9FC;
  cursor: not-allowed;
  opacity: 0.7;
  border-color: #E2E8F0;
}

.form-group textarea::placeholder {
  color: #94A3B8;
  font-style: italic;
}

.textarea-actions {
  position: absolute;
  right: 12px;
  top: 12px;
  display: flex;
  gap: 8px;
  z-index: 1;
}

.action-button {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 0.8em;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
}

.action-button.view-dates {
  background: rgba(74, 111, 220, 0.1);
  color: #4A6FDC;
}

.action-button.view-dates:hover:not(:disabled) {
  background: rgba(74, 111, 220, 0.2);
}

.action-button.remove-dates {
  background: rgba(239, 68, 68, 0.1);
  color: #EF4444;
}

.action-button.remove-dates:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.2);
}

.action-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Dates Preview */
.dates-preview {
  margin-top: 15px;
  padding: 15px;
  background: linear-gradient(135deg, #F0F4FF 0%, #E6EDFF 100%);
  border-radius: 8px;
  border: 1px solid #D6E4FF;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dates-preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #D6E4FF;
}

.dates-preview-header h4 {
  margin: 0;
  color: #2A4B8C;
  font-size: 0.95em;
  font-weight: 700;
}

.dates-count {
  background: linear-gradient(135deg, #4A6FDC 0%, #2A4B8C 100%);
  color: white;
  font-size: 0.75em;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 12px;
}

.dates-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.date-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: white;
  border-radius: 6px;
  border: 1px solid #E2E8F0;
  font-size: 0.85em;
  font-weight: 500;
  color: #2D3748;
  transition: all 0.3s ease;
}

.date-item:hover {
  border-color: #4A6FDC;
  box-shadow: 0 2px 4px rgba(74, 111, 220, 0.1);
}

.date-item svg {
  flex-shrink: 0;
}

.dates-format-note {
  padding: 8px;
  background: white;
  border-radius: 6px;
  border: 1px solid #E2E8F0;
  font-size: 0.8em;
  color: #64748B;
}

.dates-format-note code {
  background: #F7F9FC;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  color: #4A6FDC;
  font-weight: 600;
}

/* Form Actions */
.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
  margin-bottom: 25px;
}

.btn-copy-dates,
.btn-add-manual {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 0.85em;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
}

.btn-copy-dates {
  background: linear-gradient(135deg, #4A6FDC 0%, #2A4B8C 100%);
  color: white;
}

.btn-copy-dates:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(74, 111, 220, 0.3);
}

.btn-add-manual {
  background: #F7F9FC;
  color: #4A6FDC;
  border: 1px solid #E2E8F0;
}

.btn-add-manual:hover:not(:disabled) {
  background: #F0F4FF;
  border-color: #4A6FDC;
}

.btn-copy-dates:disabled,
.btn-add-manual:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

/* Modal Styles */
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
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e6e9f4;
  background: linear-gradient(135deg, #F0F4FF 0%, #E6EDFF 100%);
  border-radius: 12px 12px 0 0;
}

.modal-header h4 {
  margin: 0;
  color: #2A4B8C;
  font-size: 1.1em;
  font-weight: 700;
}

.close-modal {
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.3s ease;
}

.close-modal:hover {
  background: rgba(100, 116, 139, 0.1);
}

.modal-body {
  padding: 20px;
}

.modal-body .form-group {
  margin-bottom: 20px;
}

.date-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e6e9f4;
  border-radius: 8px;
  font-size: 1em;
  transition: all 0.3s ease;
  background-color: #ffffff;
  color: #2D3748;
}

.date-input:focus {
  outline: none;
  border-color: #4A6FDC;
  box-shadow: 0 0 0 3px rgba(74, 111, 220, 0.15);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
}

.btn-cancel,
.btn-add {
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 0.9em;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
}

.btn-cancel {
  background: #F7F9FC;
  color: #64748B;
  border: 1px solid #E2E8F0;
}

.btn-cancel:hover {
  background: #F1F5F9;
}

.btn-add {
  background: linear-gradient(135deg, #10B981 0%, #34D399 100%);
  color: white;
}

.btn-add:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.btn-add:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

/* Existing styles */
.form-group-underline {
  position: absolute;
  bottom: -5px;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, #4A6FDC 0%, #7C8DB5 100%);
  opacity: 0.5;
  border-radius: 2px;
}

.help-text {
  display: block;
  margin-top: 8px;
  color: #64748B;
  font-size: 0.85em;
  display: flex;
  align-items: center;
}

.no-file-upload-message {
  color: #64748B;
  font-style: italic;
  text-align: center;
  padding: 30px 20px;
  background: linear-gradient(135deg, #F7F9FC 0%, #EDF2F7 100%);
  border-radius: 10px;
  border: 2px dashed #CBD5E0;
  transition: all 0.3s ease;
}

.no-file-upload-message:hover {
  border-color: #4A6FDC;
  background: linear-gradient(135deg, #F0F4FF 0%, #E6EDFF 100%);
}

.no-file-upload-message p {
  margin-top: 12px;
  color: #475569;
  font-weight: 500;
}

.upload-icon {
  margin: 0 auto 15px;
  opacity: 0.7;
  transition: transform 0.3s ease;
}

.no-file-upload-message:hover .upload-icon {
  transform: translateY(-5px);
  opacity: 1;
}

@media (max-width: 768px) {
  .form-section {
    padding: 20px;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .section-badge {
    align-self: flex-start;
  }
  
  .textarea-actions {
    position: static;
    margin-top: 10px;
    justify-content: flex-start;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .dates-list {
    flex-direction: column;
  }
  
  .date-item {
    justify-content: space-between;
  }
}
</style>