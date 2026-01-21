// src/composables/useProducts.js
import { ref } from 'vue'

export const useProducts = () => {
  const categories = ref([])
  const products = ref([])
  const rateCards = ref([])
  const loading = ref(false)
  const error = ref(null)
  
  // API base URL from environment
  const API_BASE = process.env.NUXT_PUBLIC_API_BASE || 'https://cms-vgad.visiongroup.co.ug/api'
  
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
      console.error('Failed to load categories:', err)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  // Load products by category ID
  const loadProductsByCategoryId = async (categoryId) => {
    loading.value = true
    error.value = null
    try {
      let productsData
      
      // Try the new endpoint first
      try {
        const response = await $fetch(`${API_BASE}/products/category/${categoryId}`)
        productsData = response.data || response
      } catch (endpointErr) {
        console.warn('Products by category endpoint not available, using category endpoint:', endpointErr.message)
        // Fallback: Get category with products
        const category = await getCategoryWithProducts(categoryId)
        productsData = category?.products || []
      }
      
      // Find the category to get its details
      const category = categories.value.find(cat => cat.id === categoryId) || 
                       await getCategoryWithProducts(categoryId)
      
      // Transform products
      products.value = Array.isArray(productsData) ? productsData.map(product => {
        const attributes = product.attributes || product
        
        return {
          id: product.id,
          name: attributes.product_name || attributes.name,
          product_name: attributes.product_name,
          product_id: attributes.product_id,
          category: categoryId,
          categoryType: category?.category_type,
          categoryName: category?.name,
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
      console.error('Failed to load products:', err)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  // Load all products
  const loadAllProducts = async () => {
    loading.value = true
    error.value = null
    try {
      const queryParams = new URLSearchParams()
      queryParams.append('populate[category]', '*')
      queryParams.append('sort', 'product_name:asc')
      
      let response
      
      // Try the new endpoint
      try {
        response = await $fetch(`${API_BASE}/products?${queryParams}`)
      } catch (endpointErr) {
        console.warn('Products endpoint not available, using categories as fallback:', endpointErr.message)
        // Fallback: Load categories and extract products
        if (categories.value.length === 0) {
          await loadCategories()
        }
        
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
      console.error('Failed to load products:', err)
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
      console.error('Failed to load rate cards:', err)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  // Calculate price
  const calculatePrice = async (productId, rateCardId, options = {}) => {
    loading.value = true
    error.value = null
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
      
      return response
    } catch (err) {
      error.value = err.message || 'Failed to calculate price'
      console.error('Failed to calculate price:', err)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  // Get category with populated products
  const getCategoryWithProducts = async (categoryId) => {
    if (!categoryId) return null
    
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
      console.error('Failed to get category:', err)
      return null
    }
  }
  
  // Get product by ID
  const getProductById = async (productId) => {
    if (!productId) return null
    
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
      console.error('Failed to get product:', err)
      return null
    }
  }
  
  // Helper function to get category by type
  const getCategoryByType = (categoryType) => {
    return categories.value.find(category => category.category_type === categoryType)
  }
  
  // Helper function to get products by category type
  const getProductsByCategoryType = (categoryType) => {
    const category = getCategoryByType(categoryType)
    if (!category) return []
    return products.value.filter(product => product.category === category.id)
  }
  
  return {
    // State
    categories,
    products,
    rateCards,
    loading,
    error,
    
    // Actions
    loadCategories,
    loadProductsByCategoryId,
    loadAllProducts,
    loadRateCards,
    calculatePrice,
    getCategoryWithProducts,
    getProductById,
    getCategoryByType,
    getProductsByCategoryType
  }
}