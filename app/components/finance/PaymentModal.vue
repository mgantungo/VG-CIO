<!--components/finance/PaymentModal.vue-->
<template>
  <div v-if="show" class="payment-modal-overlay" @click.self="close">
    <div class="payment-modal">
      <div class="modal-header">
        <h2>Record Payment</h2>
        <button class="modal-close" @click="close">×</button>
      </div>

      <div class="modal-body">
        <div class="invoice-info">
          <div class="info-section">
            <div class="info-row">
              <strong>Invoice:</strong>
              <span>{{ invoice.invoiceNumber }}</span>
            </div>
            <div class="info-row">
              <strong>Client:</strong>
              <span>{{ invoice.clientName }}</span>
            </div>
            <div class="info-row">
              <strong>Advert Reference:</strong>
              <span>{{ invoice.advertReference }}</span>
            </div>
          </div>
          
          <div class="info-section">
            <div class="info-row">
              <strong>Total Amount:</strong>
              <span class="amount total">{{ formatCurrency(invoice.totalAmount) }}</span>
            </div>
            <div class="info-row">
              <strong>Amount Paid:</strong>
              <span class="amount paid">{{ formatCurrency(invoice.amountPaid) }}</span>
            </div>
            <div class="info-row">
              <strong>Balance Due:</strong>
              <span class="amount balance">{{ formatCurrency(invoice.balance) }}</span>
            </div>
          </div>
        </div>

        <form @submit.prevent="submitPayment">
          <div class="payment-details">
            <h3>Payment Details</h3>
            
            <div class="form-row">
              <div class="form-group">
                <label>Payment Amount *</label>
                <div class="amount-input">
                  <span class="currency">UGX</span>
                  <input
                    v-model="paymentAmount"
                    type="number"
                    :min="minPayment"
                    :max="maxPayment"
                    step="1000"
                    required
                    placeholder="Enter amount"
                    :class="{ 'error': errors.paymentAmount }"
                    @input="validateAmount"
                  >
                </div>
                <div v-if="errors.paymentAmount" class="error-message">
                  {{ errors.paymentAmount }}
                </div>
                <div class="amount-hints">
                  <button 
                    type="button" 
                    class="btn-hint"
                    @click="paymentAmount = minPayment"
                  >
                    Minimum ({{ formatCurrency(minPayment) }})
                  </button>
                  <button 
                    type="button" 
                    class="btn-hint"
                    @click="paymentAmount = invoice.balance"
                  >
                    Full Amount
                  </button>
                  <button 
                    type="button" 
                    class="btn-hint"
                    @click="paymentAmount = invoice.balance / 2"
                  >
                    Half
                  </button>
                </div>
              </div>
              
              <div class="form-group">
                <label>Payment Method *</label>
                <select
                  v-model="paymentMethod"
                  required
                  :class="{ 'error': errors.paymentMethod }"
                  @change="clearError('paymentMethod')"
                >
                  <option value="">Select method</option>
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cheque">Cheque</option>
                  <option value="mobile_money">Mobile Money</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="online">Online Payment</option>
                </select>
                <div v-if="errors.paymentMethod" class="error-message">
                  {{ errors.paymentMethod }}
                </div>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Payment Date *</label>
                <input
                  v-model="paymentDate"
                  type="date"
                  required
                  :max="maxDate"
                  :class="{ 'error': errors.paymentDate }"
                  @change="clearError('paymentDate')"
                >
                <div v-if="errors.paymentDate" class="error-message">
                  {{ errors.paymentDate }}
                </div>
              </div>
              
              <div v-if="paymentMethod === 'cheque'" class="form-group">
                <label>Cheque Date</label>
                <input
                  v-model="chequeDate"
                  type="date"
                  :min="paymentDate"
                  :class="{ 'error': errors.chequeDate }"
                  @change="clearError('chequeDate')"
                >
                <div v-if="errors.chequeDate" class="error-message">
                  {{ errors.chequeDate }}
                </div>
              </div>
            </div>

            <div class="form-group">
              <label>Reference Number *</label>
              <input
                v-model="referenceNumber"
                type="text"
                :placeholder="getReferencePlaceholder()"
                required
                :class="{ 'error': errors.referenceNumber }"
                @input="clearError('referenceNumber')"
              >
              <div v-if="errors.referenceNumber" class="error-message">
                {{ errors.referenceNumber }}
              </div>
              <small class="field-hint">
                {{ getReferenceHint() }}
              </small>
            </div>

            <div class="form-group">
              <label>Payment Notes</label>
              <textarea
                v-model="paymentNotes"
                rows="3"
                placeholder="Add any additional notes about this payment..."
                :class="{ 'error': errors.paymentNotes }"
                @input="clearError('paymentNotes')"
              ></textarea>
              <div v-if="errors.paymentNotes" class="error-message">
                {{ errors.paymentNotes }}
              </div>
            </div>

            <div class="payment-summary">
              <h4>Payment Summary</h4>
              <div class="summary-row">
                <span>Previous Balance:</span>
                <span>{{ formatCurrency(invoice.balance) }}</span>
              </div>
              <div class="summary-row">
                <span>This Payment:</span>
                <span>{{ formatCurrency(paymentAmount || 0) }}</span>
              </div>
              <div class="summary-row total">
                <span>New Balance:</span>
                <span :class="getNewBalanceClass()">
                  {{ formatCurrency(newBalance) }}
                </span>
              </div>
              <div class="summary-row">
                <span>Payment Status:</span>
                <span :class="`status-${newStatus}`">
                  {{ formatStatus(newStatus) }}
                </span>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <div class="footer-actions">
              <button 
                type="button" 
                class="btn btn-secondary"
                @click="close"
                :disabled="processing"
              >
                Cancel
              </button>
              
              <button 
                type="submit" 
                class="btn btn-primary"
                :disabled="processing || hasErrors"
              >
                <span v-if="processing">
                  <span class="processing-spinner"></span>
                  Processing...
                </span>
                <span v-else>
                  Record Payment
                </span>
              </button>
            </div>
            
            <div v-if="newBalance === 0" class="receipt-option">
              <label class="checkbox-label">
                <input 
                  v-model="generateReceipt" 
                  type="checkbox"
                >
                <span>Generate and email receipt to client</span>
              </label>
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { formatCurrency } from '~/utils/formatters'

const props = defineProps({
  invoice: {
    type: Object,
    required: true
  },
  show: {
    type: Boolean,
    default: false
  },
  processing: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'submit',
  'close'
])

const paymentAmount = ref('')
const paymentMethod = ref('')
const paymentDate = ref('')
const chequeDate = ref('')
const referenceNumber = ref('')
const paymentNotes = ref('')
const generateReceipt = ref(true)
const errors = ref({})

const minPayment = computed(() => {
  return Math.max(1000, invoice.balance * 0.1) // Minimum 1000 or 10% of balance
})

const maxPayment = computed(() => {
  return props.invoice.balance
})

const maxDate = computed(() => {
  const today = new Date()
  return today.toISOString().split('T')[0]
})

const newBalance = computed(() => {
  const amount = parseFloat(paymentAmount.value) || 0
  return Math.max(0, props.invoice.balance - amount)
})

const newStatus = computed(() => {
  if (newBalance.value === 0) return 'paid'
  if (newBalance.value < props.invoice.balance) return 'partial'
  return 'unpaid'
})

const hasErrors = computed(() => {
  return Object.keys(errors.value).length > 0
})

const formatStatus = (status) => {
  const statusMap = {
    unpaid: 'Unpaid',
    partial: 'Partial',
    paid: 'Paid'
  }
  return statusMap[status] || status
}

const getReferencePlaceholder = () => {
  const placeholders = {
    bank_transfer: 'e.g., BTR2025001',
    cheque: 'e.g., Cheque #12345',
    mobile_money: 'e.g., MM2025001',
    credit_card: 'e.g., TXN-CC-2025001',
    online: 'e.g., ONL-2025001',
    cash: 'e.g., CASH-2025001'
  }
  return placeholders[paymentMethod.value] || 'Enter reference number'
}

const getReferenceHint = () => {
  const hints = {
    bank_transfer: 'Bank transaction reference number',
    cheque: 'Cheque number',
    mobile_money: 'Mobile money transaction ID',
    credit_card: 'Credit card transaction ID',
    online: 'Online payment reference',
    cash: 'Cash receipt number'
  }
  return hints[paymentMethod.value] || 'Unique reference for this payment'
}

const getNewBalanceClass = () => {
  if (newBalance.value === 0) return 'balance-paid'
  if (newBalance.value === props.invoice.balance) return 'balance-unpaid'
  return 'balance-partial'
}

const validateAmount = () => {
  const amount = parseFloat(paymentAmount.value)
  
  if (!amount || isNaN(amount)) {
    errors.value.paymentAmount = 'Please enter a valid amount'
    return false
  }
  
  if (amount < minPayment.value) {
    errors.value.paymentAmount = `Minimum payment is ${formatCurrency(minPayment.value)}`
    return false
  }
  
  if (amount > maxPayment.value) {
    errors.value.paymentAmount = `Cannot exceed balance of ${formatCurrency(maxPayment.value)}`
    return false
  }
  
  delete errors.value.paymentAmount
  return true
}

const validatePaymentDate = () => {
  if (!paymentDate.value) {
    errors.value.paymentDate = 'Payment date is required'
    return false
  }
  
  const selectedDate = new Date(paymentDate.value)
  const today = new Date()
  today.setHours(23, 59, 59, 999) // End of today
  
  if (selectedDate > today) {
    errors.value.paymentDate = 'Payment date cannot be in the future'
    return false
  }
  
  delete errors.value.paymentDate
  return true
}

const validateChequeDate = () => {
  if (paymentMethod.value === 'cheque' && chequeDate.value) {
    const cheque = new Date(chequeDate.value)
    const payment = new Date(paymentDate.value)
    
    if (cheque < payment) {
      errors.value.chequeDate = 'Cheque date cannot be before payment date'
      return false
    }
  }
  
  delete errors.value.chequeDate
  return true
}

const validateForm = () => {
  errors.value = {}
  
  let isValid = true
  
  if (!validateAmount()) isValid = false
  if (!paymentMethod.value) {
    errors.value.paymentMethod = 'Payment method is required'
    isValid = false
  }
  if (!validatePaymentDate()) isValid = false
  if (!validateChequeDate()) isValid = false
  if (!referenceNumber.value.trim()) {
    errors.value.referenceNumber = 'Reference number is required'
    isValid = false
  }
  
  return isValid
}

const clearError = (field) => {
  if (errors.value[field]) {
    delete errors.value[field]
  }
}

const resetForm = () => {
  paymentAmount.value = ''
  paymentMethod.value = ''
  paymentDate.value = new Date().toISOString().split('T')[0]
  chequeDate.value = ''
  referenceNumber.value = ''
  paymentNotes.value = ''
  generateReceipt.value = true
  errors.value = {}
}

const submitPayment = () => {
  if (!validateForm()) return
  
  const paymentData = {
    invoiceId: props.invoice.id,
    amount: parseFloat(paymentAmount.value),
    paymentMethod: paymentMethod.value,
    paymentDate: paymentDate.value,
    referenceNumber: referenceNumber.value.trim(),
    notes: paymentNotes.value.trim(),
    chequeDate: paymentMethod.value === 'cheque' ? chequeDate.value : null,
    generateReceipt: generateReceipt.value
  }
  
  emit('submit', paymentData)
  resetForm()
}

const close = () => {
  emit('close')
  resetForm()
}

// Initialize form with current date
paymentDate.value = new Date().toISOString().split('T')[0]

// Watch for show prop changes
watch(() => props.show, (newValue) => {
  if (!newValue) {
    resetForm()
  }
})

// Watch invoice changes
watch(() => props.invoice, () => {
  resetForm()
}, { deep: true })
</script>

<style scoped>
.payment-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.payment-modal {
  background: white;
  border-radius: 10px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 25px 30px;
  border-bottom: 2px solid #F5F5F5;
}

.modal-header h2 {
  color: #003366;
  margin: 0;
  font-size: 1.5em;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.8em;
  color: #999;
  cursor: pointer;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s;
}

.modal-close:hover {
  background: #F5F5F5;
  color: #E31E24;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 30px;
}

.invoice-info {
  background: #F5F5F5;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 30px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.info-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.info-row strong {
  color: #666;
  font-weight: 500;
  min-width: 120px;
}

.info-row span {
  color: #333;
  text-align: right;
  flex: 1;
}

.info-row .amount {
  font-weight: 600;
}

.info-row .amount.total {
  color: #003366;
}

.info-row .amount.paid {
  color: #28a745;
}

.info-row .amount.balance {
  color: #E31E24;
}

.payment-details {
  margin-top: 30px;
}

.payment-details h3 {
  color: #003366;
  margin-bottom: 20px;
  font-size: 1.2em;
  padding-bottom: 10px;
  border-bottom: 2px solid #F5F5F5;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #333333;
  font-weight: 500;
}

.form-group label::after {
  content: ' *';
  color: #E31E24;
  font-weight: bold;
}

.form-group label:has(+ input:not([required]))::after,
.form-group label:has(+ select:not([required]))::after,
.form-group label:has(+ textarea:not([required]))::after {
  content: '';
}

.amount-input {
  display: flex;
  align-items: center;
  border: 1px solid #DDDDDD;
  border-radius: 5px;
  overflow: hidden;
}

.amount-input .currency {
  background: #F5F5F5;
  padding: 0 15px;
  color: #666;
  font-weight: 500;
  height: 100%;
  display: flex;
  align-items: center;
  border-right: 1px solid #DDDDDD;
}

.amount-input input {
  flex: 1;
  padding: 12px 15px;
  border: none;
  font-size: 1.1em;
  font-weight: 500;
}

.amount-input input:focus {
  outline: none;
}

.amount-input input.error {
  background-color: rgba(220, 53, 69, 0.05);
}

.amount-hints {
  display: flex;
  gap: 10px;
  margin-top: 10px;
  flex-wrap: wrap;
}

.btn-hint {
  padding: 6px 12px;
  border: 1px solid #DDDDDD;
  border-radius: 4px;
  background: white;
  color: #0066CC;
  font-size: 0.85em;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-hint:hover {
  background: #0066CC;
  color: white;
  border-color: #0066CC;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #DDDDDD;
  border-radius: 5px;
  font-size: 1em;
  transition: border-color 0.3s, box-shadow 0.3s;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #0066CC;
  box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
}

.form-group input.error,
.form-group select.error,
.form-group textarea.error {
  border-color: #dc3545;
  background-color: rgba(220, 53, 69, 0.05);
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
}

.field-hint {
  display: block;
  margin-top: 5px;
  color: #666;
  font-size: 0.85em;
}

.error-message {
  color: #dc3545;
  font-size: 0.85em;
  margin-top: 5px;
  padding-left: 5px;
}

.payment-summary {
  background: #F9F9F9;
  padding: 20px;
  border-radius: 8px;
  margin-top: 30px;
}

.payment-summary h4 {
  color: #003366;
  margin-bottom: 15px;
  font-size: 1.1em;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #EEEEEE;
}

.summary-row:last-child {
  border-bottom: none;
}

.summary-row.total {
  border-top: 2px solid #003366;
  border-bottom: none;
  font-size: 1.1em;
  font-weight: 600;
  padding-top: 15px;
  margin-top: 5px;
}

.balance-paid {
  color: #28a745;
}

.balance-unpaid {
  color: #dc3545;
}

.balance-partial {
  color: #ffc107;
}

.status-paid {
  color: #28a745;
  font-weight: 600;
}

.status-partial {
  color: #ffc107;
  font-weight: 600;
}

.status-unpaid {
  color: #dc3545;
  font-weight: 600;
}

.modal-footer {
  padding: 25px 0 0;
  border-top: 2px solid #F5F5F5;
  margin-top: 30px;
}

.footer-actions {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
}

.receipt-option {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #EEEEEE;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  color: #666;
  font-size: 0.95em;
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1em;
  font-weight: 500;
  transition: all 0.3s;
  min-width: 120px;
}

.btn-primary {
  background: #E31E24;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #c01820;
  transform: translateY(-1px);
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-secondary {
  background: #0066CC;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #0052a3;
  transform: translateY(-1px);
}

.processing-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s linear infinite;
  margin-right: 8px;
  vertical-align: middle;
}

@media (max-width: 768px) {
  .payment-modal {
    max-height: 95vh;
  }
  
  .modal-header,
  .modal-body {
    padding: 20px;
  }
  
  .invoice-info {
    grid-template-columns: 1fr;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .footer-actions {
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
  }
}
</style>