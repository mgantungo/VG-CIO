// composables/useMedia.js
import { useRuntimeConfig } from '#imports'

export const useMedia = () => {
  const config = useRuntimeConfig()
  const uploadBase = config.public.uploadBase || ''
  
  /**
   * Get the URL for a media file with the specified format
   * @param {Object} media - The media object from Strapi
   * @param {string} preferFormat - Preferred format (thumbnail, small, medium, large, original)
   * @returns {string} The complete media URL
   */
  const getMediaUrl = (media, preferFormat = 'thumbnail') => {
    if (!media) return '/images/placeholder.png'
    
    let mediaUrl = ''
    
    // Try preferred format first
    if (preferFormat === 'original' && media.url) {
      mediaUrl = media.url
    } else if (media.formats?.[preferFormat]?.url) {
      mediaUrl = media.formats[preferFormat].url
    }
    // Fallback to other formats
    else if (media.url) {
      mediaUrl = media.url
    } else if (media.formats?.small?.url) {
      mediaUrl = media.formats.small.url
    } else if (media.formats?.thumbnail?.url) {
      mediaUrl = media.formats.thumbnail.url
    }
    
    // Prepend upload base for relative URLs
    mediaUrl = prependUploadBase(mediaUrl)
    
    return mediaUrl || '/images/placeholder.png'
  }
  
  /**
   * Get the best available preview URL (highest quality)
   * @param {Object} media - The media object from Strapi
   * @returns {string|null} The best available preview URL
   */
  const getBestPreviewUrl = (media) => {
    if (!media) return null
    
    let previewUrl = ''
    
    // Try to get the best quality available in order
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
    previewUrl = prependUploadBase(previewUrl)
    
    return previewUrl || null
  }
  
  /**
   * Prepend upload base URL to relative URLs
   * @param {string} url - The URL to process
   * @returns {string} The complete URL
   */
  const prependUploadBase = (url) => {
    if (!url) return url
    
    // If URL is already absolute, return as is
    if (url.startsWith('http') || url.startsWith('//')) {
      return url
    }
    
    // If we have an upload base, prepend it
    if (uploadBase) {
      // Remove leading slash if present
      const cleanUrl = url.startsWith('/') ? url.substring(1) : url
      return `${uploadBase}/${cleanUrl}`
    }
    
    return url
  }
  
  /**
   * Format file size in human readable format
   * @param {number} bytes - File size in bytes
   * @returns {string} Formatted file size
   */
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
  
  /**
   * Get media type from extension
   * @param {Object} media - The media object from Strapi
   * @returns {string} Media type (image, video, document, etc.)
   */
  const getMediaType = (media) => {
    if (!media || !media.mime) return 'unknown'
    
    const mime = media.mime.toLowerCase()
    
    if (mime.startsWith('image/')) return 'image'
    if (mime.startsWith('video/')) return 'video'
    if (mime.startsWith('audio/')) return 'audio'
    if (mime.includes('pdf')) return 'pdf'
    if (mime.includes('word') || mime.includes('document')) return 'document'
    if (mime.includes('excel') || mime.includes('spreadsheet')) return 'spreadsheet'
    if (mime.includes('presentation') || mime.includes('powerpoint')) return 'presentation'
    
    return 'document'
  }
  
  /**
   * Handle image loading errors
   * @param {Event} event - The error event
   */
  const handleImageError = (event) => {
    event.target.src = '/images/placeholder.png'
    event.target.onerror = null // Prevent infinite loop
  }
  
  return {
    getMediaUrl,
    getBestPreviewUrl,
    prependUploadBase,
    formatFileSize,
    getMediaType,
    handleImageError,
    uploadBase
  }
}