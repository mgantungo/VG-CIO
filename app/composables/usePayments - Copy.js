import { ref, computed } from 'vue'
import { useRuntimeConfig } from '#imports'

export const usePayments = () => {
  const config = useRuntimeConfig()
  const API_BASE = config.public.apiBase
  
  const transactions = ref([])
  const loading = ref(false)
  const error = ref(null)
  
  // Computed statistics
  const collectedThisMonth = computed(() => {
    return transactions.value
      .filter(t => t.paymentStatus === 'paid')
      .reduce((sum, t) => sum + t.totalAmount, 0)
  })
  
  const outstanding = computed(() => {
    return transactions.value
      .filter(t => t.paymentStatus === 'unpaid')
      .reduce((sum, t) => sum + t.balance, 0)
  })
  
  const pendingPayments = computed(() => {
    return transactions.value.filter(t => t.paymentStatus === 'unpaid').length
  })
  
  const collectionRate = computed(() => {
    if (transactions.value.length === 0) return 0
    const paidCount = transactions.value.filter(t => t.paymentStatus === 'paid').length
    return Math.round((paidCount / transactions.value.length) * 100)
  })
  
  const totalRevenue = computed(() => {
    return transactions.value.reduce((sum, t) => sum + t.totalAmount, 0)
  })
  
  /**
   * Load transactions within a date range
   */
  const loadTransactions = async (params = {}) => {
    loading.value = true
    error.value = null
    
    try {
      // Set default dates if not provided
      const now = new Date()
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      
      const startDate = params.startDate || firstDayOfMonth.toISOString().split('T')[0]
      const endDate = params.endDate || now.toISOString().split('T')[0]
      
      console.log('💰 Loading transactions:', { startDate, endDate })
      
      const response = await $fetch(`${API_BASE}/adverts/filtered-transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: {
          startDate,
          endDate
        }
      })
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to load transactions')
      }
      
      console.log('✅ Transactions loaded:', response.count)
      
      // Transform API data to invoice format
      transactions.value = (response.data || []).map(advert => {
        // Determine payment status based on advert status
        let paymentStatus = 'unpaid'
        if (advert.status === 'paid' || advert.payment_status === 'paid') {
          paymentStatus = 'paid'
        } else if (advert.status === 'partial_payment' || advert.payment_status === 'partial') {
          paymentStatus = 'partial'
        }
        
        // Check if overdue (simplified - you may want to add a due date field)
        const created = new Date(advert.createdAt)
        const daysSinceCreated = Math.floor((now - created) / (1000 * 60 * 60 * 24))
        if (paymentStatus === 'unpaid' && daysSinceCreated > 30) {
          paymentStatus = 'overdue'
        }
        
        return {
          id: advert.id,
          advertId: advert.id,
          invoiceNumber: `${advert.reference_number}`,
          advertReference: advert.reference_number,
          clientName: advert.client?.company_name || 'N/A',
          clientId: advert.client?.id,
          contactPerson: advert.client?.contact_person || '',
          email: advert.client?.email || '',
          phone: advert.client?.phone || '',
          advertTitle: advert.advert_title,
          productName: advert.product?.product_name || '',
          categoryName: advert.product?.category?.category_name || '',
          totalAmount: parseFloat(advert.total_amount) || 0,
          amountPaid: paymentStatus === 'paid' ? parseFloat(advert.total_amount) : 0,
          balance: paymentStatus === 'paid' ? 0 : parseFloat(advert.total_amount) || 0,
          paymentMethod: advert.payment_method || 'cash',
          paymentStatus: paymentStatus,
          advertStatus: advert.status,
          invoiceDate: advert.createdAt,
          dueDate: advert.end_date || null,
          createdAt: advert.createdAt,
          updatedAt: advert.updatedAt,
          vgamsUser: advert.vgams_user
        }
      })
      
      return {
        success: true,
        data: transactions.value,
        count: response.count,
        totals: response.totals,
        statistics: response.statistics
      }
      
    } catch (err) {
      error.value = err.message || 'Failed to load transactions'
      console.error('❌ Error loading transactions:', err)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Mark a transaction as paid
   */
  const markAsPaid = async (referenceNumber, paymentData = {}) => {
    loading.value = true
    error.value = null
    
    try {
      console.log('💳 Marking as paid:', referenceNumber)
      
      const response = await $fetch(`${API_BASE}/adverts/mark-paid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: {
          referenceNumber: referenceNumber,
          paymentMethod: paymentData.paymentMethod || 'cash',
          paymentDate: paymentData.paymentDate || new Date().toISOString().split('T')[0],
          paymentNotes: paymentData.notes || '',
          recordedBy: paymentData.recordedBy || 'Finance Team'
        }
      })
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to mark as paid')
      }
      
      // Update local transaction
      const transaction = transactions.value.find(t => 
        t.advertReference === referenceNumber || t.invoiceNumber.includes(referenceNumber)
      )
      
      if (transaction) {
        transaction.paymentStatus = 'paid'
        transaction.amountPaid = transaction.totalAmount
        transaction.balance = 0
        transaction.advertStatus = 'paid'
      }
      
      console.log('✅ Marked as paid successfully')
      
      return response
      
    } catch (err) {
      error.value = err.message || 'Failed to mark as paid'
      console.error('❌ Error marking as paid:', err)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Record a payment (for partial payments)
   */
  const recordPayment = async (referenceNumber, paymentData) => {
    loading.value = true
    error.value = null
    
    try {
      console.log('💵 Recording payment:', { referenceNumber, amount: paymentData.amount })
      
      const response = await $fetch(`${API_BASE}/adverts/record-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: {
          referenceNumber: referenceNumber,
          amount: paymentData.amount,
          paymentMethod: paymentData.paymentMethod || 'cash',
          paymentDate: paymentData.paymentDate || new Date().toISOString().split('T')[0],
          transactionRef: paymentData.referenceNumber || '',
          notes: paymentData.notes || '',
          recordedBy: paymentData.recordedBy || 'Finance Team'
        }
      })
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to record payment')
      }
      
      // Update local transaction
      const transaction = transactions.value.find(t => 
        t.advertReference === referenceNumber || t.invoiceNumber.includes(referenceNumber)
      )
      
      if (transaction) {
        transaction.amountPaid += parseFloat(paymentData.amount)
        transaction.balance = transaction.totalAmount - transaction.amountPaid
        
        if (transaction.balance <= 0) {
          transaction.paymentStatus = 'paid'
          transaction.balance = 0
        } else {
          transaction.paymentStatus = 'partial'
        }
      }
      
      console.log('✅ Payment recorded successfully')
      
      return response
      
    } catch (err) {
      error.value = err.message || 'Failed to record payment'
      console.error('❌ Error recording payment:', err)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Get payment statistics for reporting
   */
  const getPaymentStats = async (params = {}) => {
    try {
      const result = await loadTransactions(params)
      
      return {
        totalRevenue: totalRevenue.value,
        collectedAmount: collectedThisMonth.value,
        outstandingAmount: outstanding.value,
        pendingCount: pendingPayments.value,
        collectionRate: collectionRate.value,
        transactionCount: transactions.value.length,
        ...result.statistics
      }
    } catch (err) {
      console.error('❌ Error getting payment stats:', err)
      throw err
    }
  }
  
  /**
   * Export transactions to CSV/Excel
   */
  const exportTransactions = (format = 'csv') => {
    const headers = [
      'Invoice Number',
      'Reference',
      'Client',
      'Product',
      'Amount',
      'Amount Paid',
      'Balance',
      'Payment Method',
      'Status',
      'Date'
    ]
    
    const rows = transactions.value.map(t => [
      t.invoiceNumber,
      t.advertReference,
      t.clientName,
      t.productName,
      t.totalAmount,
      t.amountPaid,
      t.balance,
      t.paymentMethod,
      t.paymentStatus,
      new Date(t.createdAt).toLocaleDateString()
    ])
    
    if (format === 'csv') {
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n')
      
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
    }
  }
  
  return {
    // State
    transactions,
    loading,
    error,
    
    // Computed
    collectedThisMonth,
    outstanding,
    pendingPayments,
    collectionRate,
    totalRevenue,
    
    // Methods
    loadTransactions,
    markAsPaid,
    recordPayment,
    getPaymentStats,
    exportTransactions,
    
    // Legacy aliases for backward compatibility
    invoices: transactions,
    loadInvoices: loadTransactions,
    loadPaymentStats: getPaymentStats
  }
}