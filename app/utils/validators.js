/**
 * Validate email address
 * @param {string} email - Email to validate
 * @returns {boolean} Whether email is valid
 */
export const isValidEmail = (email) => {
  if (!email) return false
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate phone number (Ugandan format)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} Whether phone number is valid
 */
export const isValidUgandanPhone = (phone) => {
  if (!phone) return false
  
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '')
  
  // Ugandan phone numbers: +2567XXXXXXXX, 07XXXXXXXX, 2567XXXXXXXX
  const ugandanRegex = /^(?:\+?256|0)?(7[0-9])\d{7}$/
  return ugandanRegex.test(cleaned)
}

/**
 * Validate required field
 * @param {any} value - Value to validate
 * @returns {boolean} Whether value is provided
 */
export const isRequired = (value) => {
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim().length > 0
  if (Array.isArray(value)) return value.length > 0
  return true
}

/**
 * Validate minimum length
 * @param {string} value - Value to validate
 * @param {number} minLength - Minimum length
 * @returns {boolean} Whether value meets minimum length
 */
export const minLength = (value, minLength) => {
  if (!value) return false
  return value.length >= minLength
}

/**
 * Validate maximum length
 * @param {string} value - Value to validate
 * @param {number} maxLength - Maximum length
 * @returns {boolean} Whether value meets maximum length
 */
export const maxLength = (value, maxLength) => {
  if (!value) return true
  return value.length <= maxLength
}

/**
 * Validate number range
 * @param {number} value - Number to validate
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {boolean} Whether value is within range
 */
export const inRange = (value, min, max) => {
  if (value === null || value === undefined || isNaN(value)) return false
  return value >= min && value <= max
}

/**
 * Validate date is in the future
 * @param {string|Date} date - Date to validate
 * @returns {boolean} Whether date is in the future
 */
export const isFutureDate = (date) => {
  if (!date) return false
  
  const dateObj = new Date(date)
  if (isNaN(dateObj.getTime())) return false
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  return dateObj >= today
}

/**
 * Validate end date is after start date
 * @param {string|Date} startDate - Start date
 * @param {string|Date} endDate - End date
 * @returns {boolean} Whether end date is after start date
 */
export const isEndDateAfterStart = (startDate, endDate) => {
  if (!startDate || !endDate) return true
  
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return false
  
  return end >= start
}

/**
 * Validate file type
 * @param {File} file - File to validate
 * @param {Array<string>} allowedTypes - Allowed MIME types or extensions
 * @returns {boolean} Whether file type is allowed
 */
export const isValidFileType = (file, allowedTypes = []) => {
  if (!file) return false
  
  const fileType = file.type
  const fileExtension = file.name.split('.').pop().toLowerCase()
  
  // Check MIME type
  if (allowedTypes.some(type => type.includes('/'))) {
    return allowedTypes.some(type => fileType.includes(type.replace('*', '')))
  }
  
  // Check extension
  return allowedTypes.some(ext => {
    const cleanExt = ext.replace('.', '').toLowerCase()
    return fileExtension === cleanExt
  })
}

/**
 * Validate file size
 * @param {File} file - File to validate
 * @param {number} maxSizeMB - Maximum size in MB
 * @returns {boolean} Whether file size is within limit
 */
export const isValidFileSize = (file, maxSizeMB) => {
  if (!file || !maxSizeMB) return true
  
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  return file.size <= maxSizeBytes
}

/**
 * Validate amount is positive
 * @param {number} amount - Amount to validate
 * @returns {boolean} Whether amount is positive
 */
export const isPositiveAmount = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) return false
  return amount > 0
}

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @returns {boolean} Whether URL is valid
 */
export const isValidUrl = (url) => {
  if (!url) return false
  
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Validate reference number format
 * @param {string} reference - Reference number to validate
 * @returns {boolean} Whether reference is valid
 */
export const isValidReference = (reference) => {
  if (!reference) return false
  
  // Format: #ADV-YYYY-NNNN or #INV-YYYY-NNNN
  const referenceRegex = /^#(ADV|INV)-\d{4}-\d{3,5}$/
  return referenceRegex.test(reference)
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @param {Object} options - Validation options
 * @returns {Object} Validation result with isValid and errors
 */
export const validatePassword = (password, options = {}) => {
  const {
    minLength = 8,
    requireUppercase = true,
    requireLowercase = true,
    requireNumbers = true,
    requireSpecialChars = true
  } = options
  
  const errors = []
  
  if (!password) {
    errors.push('Password is required')
    return { isValid: false, errors }
  }
  
  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long`)
  }
  
  if (requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  
  if (requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  
  if (requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  }
  
  if (requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Validate form field
 * @param {any} value - Field value
 * @param {Array} validators - Array of validator functions
 * @returns {Array} Array of error messages
 */
export const validateField = (value, validators = []) => {
  const errors = []
  
  for (const validator of validators) {
    const error = validator(value)
    if (error) {
      errors.push(error)
    }
  }
  
  return errors
}

/**
 * Create required field validator
 * @param {string} fieldName - Name of the field for error message
 * @returns {Function} Validator function
 */
export const createRequiredValidator = (fieldName) => {
  return (value) => {
    if (!isRequired(value)) {
      return `${fieldName} is required`
    }
    return null
  }
}

/**
 * Create email validator
 * @returns {Function} Validator function
 */
export const createEmailValidator = () => {
  return (value) => {
    if (value && !isValidEmail(value)) {
      return 'Please enter a valid email address'
    }
    return null
  }
}

/**
 * Create phone validator
 * @returns {Function} Validator function
 */
export const createPhoneValidator = () => {
  return (value) => {
    if (value && !isValidUgandanPhone(value)) {
      return 'Please enter a valid Ugandan phone number'
    }
    return null
  }
}