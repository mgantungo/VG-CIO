<!-- components/clerk/FullPageMask.vue -->
<template>
  <div v-if="visible" class="full-page-mask" @click.self="handleBackdropClick">
    <div class="mask-content" :class="[type, { 'has-details': details }]">
      <!-- Icon Section -->
      <div class="mask-icon">
        <!-- Success Icon -->
        <svg v-if="type === 'success'" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" fill="currentColor"/>
          <path d="M8 12L11 15L16 9" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        
        <!-- Error Icon -->
        <svg v-else-if="type === 'error'" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" fill="currentColor"/>
          <path d="M12 8V12M12 16H12.01" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        
        <!-- Warning Icon -->
        <svg v-else-if="type === 'warning'" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 9V13M12 17H12.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <path d="M12 3L3 20H21L12 3Z" stroke="currentColor" stroke-width="2" fill="none"/>
        </svg>
        
        <!-- Info Icon -->
        <svg v-else-if="type === 'info'" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
          <path d="M12 8V12M12 16H12.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        
        <!-- Loading Icon (Spinner) -->
        <svg v-else-if="type === 'loading'" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="spinner">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" stroke-dasharray="31.4 31.4" fill="none"/>
          <path d="M12 2C6.48 2 2 6.48 2 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </div>

      <!-- Title Section -->
      <div class="mask-title">{{ title || getDefaultTitle() }}</div>
      
      <!-- Message Section -->
      <div class="mask-message">{{ message || getDefaultMessage() }}</div>
      
      <!-- Details Section (if provided) -->
      <div v-if="details" class="mask-details">
        <div class="details-label">Details:</div>
        <pre class="details-content">{{ details }}</pre>
      </div>
      
      <!-- Additional Info (if needed) -->
      <div v-if="additionalInfo" class="mask-additional">
        {{ additionalInfo }}
      </div>
      
      <!-- Action Buttons -->
      <div class="mask-actions">
        <button 
          v-if="showConfirmButton" 
          class="mask-button mask-button-primary" 
          @click="handleConfirm"
          :disabled="loading"
        >
          {{ confirmText }}
        </button>
        
        <button 
          class="mask-button mask-button-secondary" 
          @click="handleClose"
          :disabled="loading"
        >
          {{ closeText }}
        </button>
        
        <button 
          v-if="showRetryButton" 
          class="mask-button mask-button-retry" 
          @click="handleRetry"
          :disabled="loading"
        >
          {{ retryText }}
        </button>
      </div>
      
      <!-- Loading Indicator (for async actions) -->
      <div v-if="loading" class="mask-loading-overlay">
        <div class="mask-loading-spinner"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, watch, onUnmounted } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  type: {
    type: String,
    default: 'info', // 'success', 'error', 'warning', 'info', 'loading'
    validator: (value) => ['success', 'error', 'warning', 'info', 'loading'].includes(value)
  },
  title: {
    type: String,
    default: ''
  },
  message: {
    type: String,
    default: ''
  },
  details: {
    type: String,
    default: ''
  },
  additionalInfo: {
    type: String,
    default: ''
  },
  autoClose: {
    type: Number,
    default: 0 // milliseconds, 0 = no auto close
  },
  showConfirmButton: {
    type: Boolean,
    default: false
  },
  confirmText: {
    type: String,
    default: 'Confirm'
  },
  showRetryButton: {
    type: Boolean,
    default: false
  },
  retryText: {
    type: String,
    default: 'Retry'
  },
  closeText: {
    type: String,
    default: 'Close'
  },
  closeOnBackdropClick: {
    type: Boolean,
    default: true
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'confirm', 'retry'])

let autoCloseTimer = null

// Get default title based on type
const getDefaultTitle = () => {
  switch (props.type) {
    case 'success':
      return 'Success!'
    case 'error':
      return 'Error'
    case 'warning':
      return 'Warning'
    case 'info':
      return 'Information'
    case 'loading':
      return 'Processing'
    default:
      return 'Notification'
  }
}

// Get default message based on type
const getDefaultMessage = () => {
  switch (props.type) {
    case 'success':
      return 'Operation completed successfully.'
    case 'error':
      return 'An error occurred. Please try again.'
    case 'warning':
      return 'Please check the information below.'
    case 'info':
      return 'Please review the details below.'
    case 'loading':
      return 'Please wait while we process your request...'
    default:
      return ''
  }
}

// Handle close
const handleClose = () => {
  if (props.loading) return
  clearAutoCloseTimer()
  emit('close')
}

// Handle confirm
const handleConfirm = () => {
  if (props.loading) return
  clearAutoCloseTimer()
  emit('confirm')
}

// Handle retry
const handleRetry = () => {
  if (props.loading) return
  clearAutoCloseTimer()
  emit('retry')
}

// Handle backdrop click
const handleBackdropClick = () => {
  if (props.closeOnBackdropClick && !props.loading) {
    handleClose()
  }
}

// Clear auto-close timer
const clearAutoCloseTimer = () => {
  if (autoCloseTimer) {
    clearTimeout(autoCloseTimer)
    autoCloseTimer = null
  }
}

// Auto close functionality
watch(() => props.visible, (newVal) => {
  clearAutoCloseTimer()
  
  if (newVal && props.autoClose > 0 && props.type !== 'loading') {
    autoCloseTimer = setTimeout(() => {
      handleClose()
    }, props.autoClose)
  }
})

// Clean up on unmount
onUnmounted(() => {
  clearAutoCloseTimer()
})
</script>

<style scoped>
.full-page-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(4px);
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.mask-content {
  position: relative;
  background: white;
  border-radius: 20px;
  padding: 32px;
  max-width: 520px;
  width: 90%;
  text-align: center;
  animation: slideUp 0.3s ease-out;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  transition: all 0.3s ease;
}

.mask-content.has-details {
  max-width: 600px;
}

@keyframes slideUp {
  from {
    transform: translateY(30px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Icon Styles */
.mask-icon {
  margin-bottom: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.mask-icon svg {
  width: 64px;
  height: 64px;
}

/* Success */
.mask-content.success .mask-icon svg {
  color: #10b981;
}

.mask-content.success .mask-icon svg circle {
  fill: #10b981;
}

/* Error */
.mask-content.error .mask-icon svg {
  color: #ef4444;
}

.mask-content.error .mask-icon svg circle {
  fill: #ef4444;
}

/* Warning */
.mask-content.warning .mask-icon svg {
  color: #f59e0b;
}

/* Info */
.mask-content.info .mask-icon svg {
  color: #3b82f6;
}

/* Loading */
.mask-content.loading .mask-icon svg {
  color: #3b82f6;
}

.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Title */
.mask-title {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 12px;
  color: #1f2937;
  line-height: 1.3;
}

/* Message */
.mask-message {
  font-size: 16px;
  color: #6b7280;
  margin-bottom: 20px;
  line-height: 1.5;
}

/* Details Section */
.mask-details {
  background: #f9fafb;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 24px;
  text-align: left;
  border: 1px solid #e5e7eb;
}

.details-label {
  font-size: 13px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.details-content {
  font-size: 14px;
  color: #1f2937;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  white-space: pre-wrap;
  word-wrap: break-word;
  margin: 0;
  line-height: 1.6;
  background: transparent;
  border: none;
  padding: 0;
}

/* Additional Info */
.mask-additional {
  font-size: 13px;
  color: #9ca3af;
  margin-bottom: 24px;
  font-style: italic;
}

/* Action Buttons */
.mask-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 8px;
}

.mask-button {
  padding: 10px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  outline: none;
  min-width: 100px;
}

.mask-button:active {
  transform: scale(0.98);
}

.mask-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.mask-button-primary {
  background: linear-gradient(135deg, #e31e24 0%, #c01820 100%);
  color: white;
  box-shadow: 0 2px 4px rgba(227, 30, 36, 0.2);
}

.mask-button-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #c01820 0%, #a0141a 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(227, 30, 36, 0.3);
}

.mask-button-secondary {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #e5e7eb;
}

.mask-button-secondary:hover:not(:disabled) {
  background: #e5e7eb;
  transform: translateY(-1px);
}

.mask-button-retry {
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #fde68a;
}

.mask-button-retry:hover:not(:disabled) {
  background: #fde68a;
  transform: translateY(-1px);
}

/* Success specific button */
.mask-content.success .mask-button-primary {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.mask-content.success .mask-button-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
}

/* Error specific button */
.mask-content.error .mask-button-primary {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}

.mask-content.error .mask-button-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
}

/* Loading overlay */
.mask-loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.mask-loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e5e7eb;
  border-top-color: #e31e24;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* Responsive Design */
@media (max-width: 640px) {
  .mask-content {
    padding: 24px;
    max-width: 90%;
  }
  
  .mask-title {
    font-size: 20px;
  }
  
  .mask-message {
    font-size: 14px;
  }
  
  .mask-actions {
    flex-direction: column;
  }
  
  .mask-button {
    width: 100%;
    min-width: unset;
  }
  
  .mask-icon svg {
    width: 48px;
    height: 48px;
  }
  
  .details-content {
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .mask-content {
    padding: 20px;
  }
  
  .mask-title {
    font-size: 18px;
  }
  
  .mask-details {
    padding: 12px;
  }
}
</style>