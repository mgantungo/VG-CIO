// src/stores/products.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useProductsStore = defineStore('products', () => {
  // State
  const categories = ref([])
  const products = ref([])
  const rateCards = ref([])
  
  const loading = ref(false)
  const error = ref(null)
  
  // API base URL from environment
  const API_BASE = config.public.apiBase;//process.env.NUXT_PUBLIC_API_BASE;// || 'https://cms-vgad.visiongroup.co.ug/api'
  
  // Getters
  const activeCategories = computed(() => {
    return categories.value.filter(category => category.is_active !== false)
  })
  
  const categoriesByType = computed(() => {
    return (type) => {
      return categories.value.filter(category => category.category_type === type)
    }
  })
  
  const getProductsByCategoryId = computed(() => {
    return (categoryId) => {
      return products.value.filter(product => product.category === categoryId)
    }
  })
  
  const getProductsByCategoryType = computed(() => {
    return (categoryType) => {
      const category = categories.value.find(cat => cat.category_type === categoryType)
      if (!category) return []
      return products.value.filter(product => product.category === category.id)
    }
  })
  
  const getRateCardsByProduct = computed(() => {
    return (productId) => {
      return rateCards.value.filter(rateCard => rateCard.productId === productId)
    }
  })
  
  const getProductById = computed(() => {
    return (productId) => {
      return products.value.find(product => product.id === productId)
    }
  })
  
  const getCategoryById = computed(() => {
    return (categoryId) => {
      return categories.value.find(category => category.id === categoryId)
    }
  })
  
  const getCategoryByType = computed(() => {
    return (categoryType) => {
      return categories.value.find(category => category.category_type === categoryType)
    }
  })
  
  // ACTIONS
  
  // Load categories
  const loadCategories = async (params = {}) => {
    loading.value = true
    error.value = null
    try {
      const queryParams = new URLSearchParams()
      
      if (params.type) {
        queryParams.append('categoryType', params.type)
      }
      
      if (params.isActive !== false) {
        queryParams.append('isActive', true)
      }
      
      // Always populate products
      queryParams.append('populate[products]', '*')
      
      const response = await $fetch(`${API_BASE}/product-categories?${queryParams}`)
      
      // Transform Strapi response
      categories.value = (response.data || response).map(category => {
        const attributes = category.attributes || category
        const productsData = attributes.products?.data || attributes.products || []
        
        // Transform products in category
        const categoryProducts = productsData.map(product => {
          const productAttrs = product.attributes || product
          return {
            id: product.id,
            name: productAttrs.product_name || productAttrs.name,
            product_name: productAttrs.product_name,
            description: productAttrs.description,
            circulation: productAttrs.circulation,
            readership: productAttrs.readership,
            is_active: productAttrs.is_active,
            ...productAttrs
          }
        })
        
        return {
          id: category.id,
          name: attributes.category_name,
          category_name: attributes.category_name,
          description: attributes.description,
          product_id: attributes.product_id,
          category_type: attributes.category_type,
          is_active: attributes.is_active,
          products: categoryProducts,
          ...attributes
        }
      })
      
      return categories.value
    } catch (err) {
      error.value = err.message || 'Failed to load categories'
      console.error('Error loading categories:', err)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  // Load products by category ID (using new endpoint)
  const loadProductsByCategoryId = async (categoryId, isActive = true) => {
    loading.value = true
    error.value = null
    try {
      // Try new endpoint first
      const endpoint = `${API_BASE}/products/category/${categoryId}?isActive=${isActive}`
      
      let response
      try {
        response = await $fetch(endpoint)
      } catch (endpointErr) {
        console.warn('Products by category endpoint not available, using fallback:', endpointErr.message)
        // Fallback: get category with populated products
        const categoryResponse = await $fetch(`${API_BASE}/product-categories/${categoryId}?populate[products]=*`)
        const categoryData = categoryResponse.data || categoryResponse
        const attributes = categoryData.attributes || categoryData
        
        const productsData = attributes.products?.data || attributes.products || []
        response = productsData.map(product => {
          const productAttrs = product.attributes || product
          return {
            id: product.id,
            attributes: productAttrs
          }
        })
      }
      
      // Transform products
      const productsData = response.data || response
      const transformedProducts = Array.isArray(productsData) ? productsData.map(product => {
        const attributes = product.attributes || product
        const categoryData = attributes.category?.data || attributes.category
        
        return {
          id: product.id,
          name: attributes.product_name || attributes.name,
          product_name: attributes.product_name,
          product_id: attributes.product_id,
          category: categoryData?.id || categoryId,
          categoryType: categoryData?.attributes?.category_type || categoryData?.category_type,
          categoryName: categoryData?.attributes?.category_name || categoryData?.name,
          description: attributes.description,
          circulation: attributes.circulation,
          readership: attributes.readership,
          is_active: attributes.is_active,
          metadata: attributes.metadata,
          ...attributes
        }
      }) : []
      
      // Update store
      products.value = transformedProducts
      return transformedProducts
      
    } catch (err) {
      error.value = err.message || 'Failed to load products by category'
      console.error('Error loading products by category:', err)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  // Load all products
  const loadAllProducts = async (params = {}) => {
    loading.value = true
    error.value = null
    try {
      const queryParams = new URLSearchParams()
      
      if (params.isActive !== undefined) {
        queryParams.append('isActive', params.isActive)
      }
      
      queryParams.append('populate[category]', '*')
      queryParams.append('sort', 'product_name:asc')
      
      // Try the new endpoint
      const endpoint = `${API_BASE}/products?${queryParams}`
      
      let response
      try {
        response = await $fetch(endpoint)
      } catch (endpointErr) {
        console.warn('Products endpoint not available, using categories as fallback:', endpointErr.message)
        // Fallback: Load categories and extract products
        await loadCategories({ isActive: params.isActive })
        
        const allProducts = []
        categories.value.forEach(category => {
          if (category.products && category.products.length > 0) {
            category.products.forEach(product => {
              allProducts.push({
                ...product,
                category: category.id,
                categoryType: category.category_type,
                categoryName: category.name
              })
            })
          }
        })
        
        products.value = allProducts
        return products.value
      }
      
      // Transform Strapi response
      const productsData = response.data || response
      products.value = Array.isArray(productsData) ? productsData.map(product => {
        const attributes = product.attributes || product
        const categoryData = attributes.category?.data || attributes.category
        
        return {
          id: product.id,
          name: attributes.product_name || attributes.name,
          product_name: attributes.product_name,
          product_id: attributes.product_id,
          category: categoryData?.id,
          categoryType: categoryData?.attributes?.category_type || categoryData?.category_type,
          categoryName: categoryData?.attributes?.category_name || categoryData?.name,
          description: attributes.description,
          circulation: attributes.circulation,
          readership: attributes.readership,
          is_active: attributes.is_active,
          metadata: attributes.metadata,
          ...attributes
        }
      }) : []
      
      return products.value
    } catch (err) {
      error.value = err.message || 'Failed to load products'
      console.error('Error loading products:', err)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  // Load rate cards for a product
  const loadRateCards = async (productId) => {
    loading.value = true
    error.value = null
    try {
      if (!productId) {
        rateCards.value = []
        return []
      }
      
      const response = await $fetch(`${API_BASE}/products/${productId}/rate-cards`)
      
      const rateCardsData = response.data || response
      
      if (Array.isArray(rateCardsData)) {
        rateCards.value = rateCardsData.map(rateCard => {
          const attributes = rateCard.attributes || rateCard
          const productData = attributes.product?.data || attributes.product
          
          return {
            id: rateCard.id,
            name: attributes.name || rateCard.name,
            productId: productData?.id || productId,
            product_id: attributes.product_id,
            basePrice: attributes.basePrice,
            price_fc: attributes.price_fc,
            price_bw: attributes.price_bw,
            surchargePercentage: attributes.surchargePercentage || attributes.surcharge_percentage,
            effectiveDate: attributes.effectiveDate || attributes.effective_date,
            expiryDate: attributes.expiryDate || attributes.expiry_date,
            currency: attributes.currency,
            is_active: attributes.is_active,
            ...attributes
          }
        })
      }
      
      return rateCards.value
    } catch (err) {
      error.value = err.message || 'Failed to load rate cards'
      console.error('Error loading rate cards:', err)
      throw err
    } finally {
      loading.value = false
    }
  }
 
  /*
  // Calculate price - old
  const calculatePrice = async (productId, rateCardId, options = {}) => {
    loading.value = true
    try {
      const response = await $fetch(`${API_BASE}/adverts/calculate-price`, {
        method: 'POST',
        body: {
          productId,
          rateCardId,
          frequency: options.frequency || 1,
          adType: options.adType || 'full_color'
        }
      })
      
      // Get product and rate card info
      const product = products.value.find(p => p.id === productId)
      const rateCard = rateCards.value.find(r => r.id === rateCardId)
      
      return {
        ...response,
        productName: product?.name || 'Product',
        rateCardName: rateCard?.name || 'Rate Card'
      }
    } catch (err) {
      error.value = err.message || 'Failed to calculate price'
      console.error('Error calculating price:', err)
      throw err
    } finally {
      loading.value = false
    }
  }
  */

const calculatePrice = async (productId, rateCardId, options = {}) => {
  loading.value = true
  try {
    const requestBody = {
      productId,
      rateCardId,
      frequency: options.frequency || 1,
      adType: options.adType || 'full_color',
      // Add the additional parameters from modal
      ...(options.details || {})
    }
    
    const response = await $fetch(`${API_BASE}/adverts/calculate-price`, {
      method: 'POST',
      body: requestBody
    })
    
    // Get product and rate card info
    const product = products.value.find(p => p.id === productId)
    const rateCard = rateCards.value.find(r => r.id === rateCardId)
    
    return {
      ...response,
      productName: product?.name || 'Product',
      rateCardName: rateCard?.name || 'Rate Card',
      // Include details in response if provided
      ...(options.details ? { details: options.details } : {})
    }
  } catch (err) {
    error.value = err.message || 'Failed to calculate price'
    console.error('Error calculating price:', err)
    throw err
  } finally {
    loading.value = false
  }
}
  
  // Get category with populated products
  const getCategoryWithProducts = async (categoryId) => {
    try {
      const response = await $fetch(`${API_BASE}/product-categories/${categoryId}?populate[products]=*`)
      
      const categoryData = response.data || response
      const attributes = categoryData.attributes || categoryData
      
      const productsData = attributes.products?.data || attributes.products || []
      const categoryProducts = productsData.map(product => {
        const productAttrs = product.attributes || product
        return {
          id: product.id,
          name: productAttrs.product_name || productAttrs.name,
          product_name: productAttrs.product_name,
          description: productAttrs.description,
          circulation: productAttrs.circulation,
          readership: productAttrs.readership,
          is_active: productAttrs.is_active,
          ...productAttrs
        }
      })
      
      return {
        id: categoryData.id,
        name: attributes.category_name,
        category_name: attributes.category_name,
        description: attributes.description,
        product_id: attributes.product_id,
        category_type: attributes.category_type,
        is_active: attributes.is_active,
        products: categoryProducts,
        ...attributes
      }
    } catch (err) {
      console.error('Error getting category with products:', err)
      return null
    }
  }
  
  // Get product by ID
  const getProductByIdApi = async (productId) => {
    try {
      const response = await $fetch(`${API_BASE}/products/${productId}?populate[category,rate_cards]`)
      
      const productData = response.data || response
      const attributes = productData.attributes || productData
      const categoryData = attributes.category?.data || attributes.category
      
      return {
        id: productData.id,
        name: attributes.product_name || attributes.name,
        product_name: attributes.product_name,
        product_id: attributes.product_id,
        category: categoryData?.id,
        categoryType: categoryData?.attributes?.category_type || categoryData?.category_type,
        categoryName: categoryData?.attributes?.category_name || categoryData?.name,
        description: attributes.description,
        circulation: attributes.circulation,
        readership: attributes.readership,
        is_active: attributes.is_active,
        metadata: attributes.metadata,
        ...attributes
      }
    } catch (err) {
      console.error('Error getting product by ID:', err)
      return null
    }
  }
  
  // Initialize store
  const initializeStore = async () => {
    try {
      await loadCategories()
      // Don't load all products initially to avoid duplicate data
      // They'll be loaded on-demand when needed
    } catch (err) {
      console.error('Failed to initialize store:', err)
    }
  }
  
  return {
    // State
    categories,
    products,
    rateCards,
    loading,
    error,
    
    // Getters
    activeCategories,
    categoriesByType,
    getProductsByCategoryId,
    getProductsByCategoryType,
    getRateCardsByProduct,
    getProductById,
    getCategoryById,
    getCategoryByType,
    
    // Actions
    loadCategories,
    loadProductsByCategoryId,
    loadAllProducts,
    loadRateCards,
    calculatePrice,
    getCategoryWithProducts,
    getProductByIdApi,
    initializeStore
  }
})