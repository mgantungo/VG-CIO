/**
 * Format currency amount
 * @param {number} amount - The amount to format
 * @param {string} currency - Currency code (default: UGX)
 * @param {string} locale - Locale (default: en-UG)
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currency = 'UGX', locale = 'en-UG') => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return `${currency} 0`
  }
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

/**
 * Format date
 * @param {string|Date} date - Date to format
 * @param {string} locale - Locale (default: en-UG)
 * @returns {string} Formatted date string
 */
export const formatDate = (date, locale = 'en-UG') => {
  if (!date) return 'N/A'
  
  const dateObj = new Date(date)
  if (isNaN(dateObj.getTime())) return 'Invalid date'
  
  return dateObj.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

/**
 * Format date and time
 * @param {string|Date} date - Date to format
 * @param {string} locale - Locale (default: en-UG)
 * @returns {string} Formatted date and time string
 */
export const formatDateTime = (date, locale = 'en-UG') => {
  if (!date) return 'N/A'
  
  const dateObj = new Date(date)
  if (isNaN(dateObj.getTime())) return 'Invalid date'
  
  return dateObj.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Format relative time (e.g., "2 hours ago")
 * @param {string|Date} date - Date to format
 * @returns {string} Relative time string
 */
export const formatRelativeTime = (date) => {
  if (!date) return 'N/A'
  
  const dateObj = new Date(date)
  if (isNaN(dateObj.getTime())) return 'Invalid date'
  
  const now = new Date()
  const diffMs = now - dateObj
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)
  
  if (diffSec < 60) {
    return 'just now'
  } else if (diffMin < 60) {
    return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`
  } else if (diffHour < 24) {
    return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`
  } else if (diffDay < 7) {
    return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`
  } else {
    return formatDate(date)
  }
}

/**
 * Format file size
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Format phone number
 * @param {string} phone - Phone number to format
 * @param {string} countryCode - Country code (default: +256)
 * @returns {string} Formatted phone number
 */
export const formatPhoneNumber = (phone, countryCode = '+256') => {
  if (!phone) return ''
  
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '')
  
  // If starts with country code without plus, add it
  if (cleaned.startsWith('256')) {
    return `+${cleaned}`
  }
  
  // If starts with 0, replace with country code
  if (cleaned.startsWith('0')) {
    return countryCode + cleaned.substring(1)
  }
  
  // If already has country code with plus
  if (cleaned.startsWith('256')) {
    return '+' + cleaned
  }
  
  // Otherwise add country code
  return countryCode + cleaned
}

/**
 * Format platform category
 * @param {string} category - Platform category code
 * @returns {string} Formatted category name
 */
export const formatPlatformCategory = (category) => {
  const categories = {
    print: 'Print Media',
    tv: 'Television',
    radio: 'Radio',
    digital: 'Digital Media',
    outdoor: 'Outdoor/OOH'
  }
  
  return categories[category] || category
}

/**
 * Format advert status
 * @param {string} status - Advert status code
 * @returns {string} Formatted status name
 */
export const formatAdvertStatus = (status) => {
  const statuses = {
    draft: 'Draft',
    pending_review: 'Pending Review',
    editor_approved: 'Editor Approved',
    editor_rejected: 'Editor Rejected',
    manager_approved: 'Manager Approved',
    manager_rejected: 'Manager Rejected',
    published: 'Published'
  }
  
  return statuses[status] || status
}

/**
 * Format payment method
 * @param {string} method - Payment method code
 * @returns {string} Formatted payment method
 */
export const formatPaymentMethod = (method) => {
  const methods = {
    cash: 'Cash',
    credit: 'Credit',
    cheque: 'Cheque',
    bank_transfer: 'Bank Transfer',
    mobile_money: 'Mobile Money'
  }
  
  return methods[method] || method
}

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text) return ''
  if (text.length <= maxLength) return text
  
  return text.substring(0, maxLength) + '...'
}

/**
 * Format percentage
 * @param {number} value - Percentage value (0-100)
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted percentage
 */
export const formatPercentage = (value, decimals = 0) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0%'
  }
  
  return value.toFixed(decimals) + '%'
}

/**
 * Format number with thousands separators
 * @param {number} number - Number to format
 * @param {string} locale - Locale (default: en-UG)
 * @returns {string} Formatted number
 */
export const formatNumber = (number, locale = 'en-UG') => {
  if (number === null || number === undefined || isNaN(number)) {
    return '0'
  }
  
  return new Intl.NumberFormat(locale).format(number)
}