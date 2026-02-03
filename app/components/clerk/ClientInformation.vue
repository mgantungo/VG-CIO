<!-- components/clerk/ClientInformation.vue -->
<template>
  <div class="form-section">
    <div class="section-header">
      <div class="section-icon">👤</div>
      <h3 class="section-title">Client Information</h3>
    </div>
    <p class="section-description">Enter the client's contact details for this advert</p>
    
    <div class="form-grid">
      <div class="form-group">
        <div class="form-label">
          <label>Client Name</label>
          <span class="required">*</span>
        </div>
        <div class="input-container">
          <span class="input-icon">🏢</span>
          <input 
            :value="clientName"
            type="text" 
            placeholder="e.g., MTN Uganda" 
            required
            :disabled="disabled"
            @input="updateClientName($event.target.value)"
            class="form-input"
          >
        </div>
        <div v-if="!clientName && !disabled" class="input-hint">
          Enter the company or client name
        </div>
      </div>
      
      <div class="form-group">
        <div class="form-label">
          <label>Contact Person</label>
          <span class="optional">(Optional)</span>
        </div>
        <div class="input-container">
          <span class="input-icon">👨‍💼</span>
          <input 
            :value="contactPerson"
            type="text" 
            placeholder="Contact name"
            :disabled="disabled"
            @input="updateContactPerson($event.target.value)"
            class="form-input"
          >
        </div>
        <div v-if="!contactPerson && !disabled" class="input-hint">
          Primary contact person at the client
        </div>
      </div>
    </div>

    <div class="form-grid">
      <div class="form-group">
        <div class="form-label">
          <label>Email Address</label>
          <span class="required">*</span>
        </div>
        <div class="input-container">
          <span class="input-icon">📧</span>
          <input 
            :value="email"
            type="email" 
            placeholder="client@company.com" 
            required
            :disabled="disabled"
            @input="updateEmail($event.target.value)"
            class="form-input"
          >
        </div>
        <div class="input-validation" :class="{ 'valid': isValidEmail, 'invalid': email && !isValidEmail }">
          <span v-if="email && !isValidEmail" class="validation-text">Please enter a valid email address</span>
          <span v-else-if="isValidEmail" class="validation-text valid">✓ Valid email format</span>
        </div>
      </div>
      
      <div class="form-group">
        <div class="form-label">
          <label>Phone Number</label>
          <span class="required">*</span>
        </div>
        <div class="input-container">
          <span class="input-icon">📱</span>
          <input 
            :value="phone"
            type="tel" 
            placeholder="+256 700 000 000" 
            required
            :disabled="disabled"
            @input="updatePhone($event.target.value)"
            class="form-input"
          >
        </div>
        <div class="input-validation" :class="{ 'valid': isValidPhone, 'invalid': phone && !isValidPhone }">
          <span v-if="phone && !isValidPhone" class="validation-text">Enter a valid phone number</span>
          <span v-else-if="isValidPhone" class="validation-text valid">✓ Phone number looks good</span>
          <span v-else class="input-hint">Include country code (e.g., +256)</span>
        </div>
      </div>
    </div>

    <!-- Validation Summary -->
    <div v-if="hasRequiredInfo" class="validation-summary success">
      <span class="summary-icon">✓</span>
      <span class="summary-text">All required client information is complete</span>
    </div>
    <div v-else class="validation-summary warning">
      <span class="summary-icon">!</span>
      <span class="summary-text">Fill in all required fields marked with *</span>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, computed } from 'vue'

const props = defineProps({
  clientName: {
    type: String,
    default: ''
  },
  contactPerson: {
    type: String,
    default: ''
  },
  email: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'update:clientName', 
  'update:contactPerson', 
  'update:email', 
  'update:phone',
  'changed'
])

const updateClientName = (value) => {
  emit('update:clientName', value)
  emit('changed', { field: 'clientName', value })
}

const updateContactPerson = (value) => {
  emit('update:contactPerson', value)
  emit('changed', { field: 'contactPerson', value })
}

const updateEmail = (value) => {
  emit('update:email', value)
  emit('changed', { field: 'email', value })
}

const updatePhone = (value) => {
  emit('update:phone', value)
  emit('changed', { field: 'phone', value })
}

// Validation computed properties
const isValidEmail = computed(() => {
  if (!props.email) return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(props.email)
})

const isValidPhone = computed(() => {
  if (!props.phone) return false
  // Basic phone validation - accepts international format
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
  const cleanPhone = props.phone.replace(/\s+/g, '')
  return phoneRegex.test(cleanPhone)
})

// Expose a computed property to check if required fields are filled
const hasRequiredInfo = computed(() => {
  return props.clientName && isValidEmail.value && isValidPhone.value
})

// Expose the computed property
defineExpose({ hasRequiredInfo })
</script>

<style scoped>
.form-section {
  margin-bottom: 40px;
  background: linear-gradient(135deg, #ffffff 0%, #f8faff 100%);
  padding: 30px;
  border-radius: 16px;
  border: 1px solid #e1e8ff;
  box-shadow: 0 4px 20px rgba(0, 51, 102, 0.08);
  transition: all 0.3s ease;
}

.form-section:hover {
  box-shadow: 0 6px 25px rgba(0, 51, 102, 0.12);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.section-icon {
  font-size: 1.8em;
  background: linear-gradient(135deg, #a0d0ff 0%, #a0d0ff 100%);
  color: white;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 102, 204, 0.2);
}

.section-title {
  color: #003366;
  font-size: 1.4em;
  font-weight: 700;
  margin: 0;
  background: linear-gradient(135deg, #003366 0%, #0066cc 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.section-description {
  color: #666;
  font-size: 0.95em;
  margin-bottom: 25px;
  padding-left: 60px;
  line-height: 1.5;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
  margin-bottom: 30px;
}

.form-group {
  margin-bottom: 10px;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.form-label label {
  color: #1a365d;
  font-weight: 600;
  font-size: 0.95em;
}

.required {
  color: #e31e24;
  font-size: 0.85em;
  font-weight: 600;
  background: rgba(227, 30, 36, 0.1);
  padding: 2px 8px;
  border-radius: 4px;
}

.optional {
  color: #718096;
  font-size: 0.85em;
  font-style: italic;
}

.input-container {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 16px;
  font-size: 1.1em;
  color: #0066cc;
  z-index: 1;
}

.form-input {
  width: 100%;
  padding: 14px 20px 14px 48px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  font-size: 1em;
  transition: all 0.3s;
  background: white;
  color: #2d3748;
  font-weight: 500;
}

.form-input:focus {
  outline: none;
  border-color: #0066cc;
  box-shadow: 0 0 0 4px rgba(0, 102, 204, 0.15);
  background: linear-gradient(0deg, #ffffff 0%, #f0f7ff 100%);
}

.form-input:disabled {
  background-color: #f7fafc;
  border-color: #cbd5e0;
  color: #a0aec0;
  cursor: not-allowed;
}

.form-input::placeholder {
  color: #a0aec0;
  font-weight: 400;
}

.input-hint {
  font-size: 0.85em;
  color: #718096;
  margin-top: 6px;
  padding-left: 4px;
}

.input-validation {
  margin-top: 6px;
  padding-left: 4px;
  font-size: 0.85em;
  height: 20px;
}

.validation-text {
  display: flex;
  align-items: center;
  gap: 6px;
}

.validation-text.valid {
  color: #38a169;
  font-weight: 500;
}

.validation-text.invalid {
  color: #e31e24;
  font-weight: 500;
}

.input-validation.invalid .validation-text::before {
  content: "⚠";
  margin-right: 4px;
}

.input-validation.valid .validation-text::before {
  content: "✓";
  margin-right: 4px;
}

.validation-summary {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-radius: 10px;
  margin-top: 25px;
  font-size: 0.95em;
  font-weight: 500;
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
}

.validation-summary.success {
  background: linear-gradient(135deg, #f0fff4 0%, #e6fffa 100%);
  border: 1px solid #9ae6b4;
  color: #22543d;
}

.validation-summary.warning {
  background: linear-gradient(135deg, #fffaf0 0%, #feebc8 100%);
  border: 1px solid #fbd38d;
  color: #744210;
}

.summary-icon {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}

.validation-summary.success .summary-icon {
  background: linear-gradient(135deg, #38a169 0%, #2f855a 100%);
  color: white;
}

.validation-summary.warning .summary-icon {
  background: linear-gradient(135deg, #dd6b20 0%, #c05621 100%);
  color: white;
}

.summary-text {
  flex: 1;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .form-section {
    padding: 20px;
  }
  
  .form-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .section-description {
    padding-left: 0;
  }
  
  .section-icon {
    width: 40px;
    height: 40px;
    font-size: 1.5em;
  }
  
  .form-input {
    padding: 12px 16px 12px 44px;
  }
}

@media (max-width: 480px) {
  .form-section {
    padding: 16px;
    border-radius: 12px;
  }
  
  .section-title {
    font-size: 1.2em;
  }
  
  .validation-summary {
    flex-direction: column;
    text-align: center;
    gap: 8px;
  }
}
</style>