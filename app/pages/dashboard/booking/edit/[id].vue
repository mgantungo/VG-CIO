<!-- pages/dashboard/booking/edit/[id].vue -->
<template>
  <div class="edit-booking-page">
    <div class="page-header">
      <div class="header-content">
        <div>
          <h1>{{ isViewMode ? 'View Advert' : 'Edit Advert' }}</h1>
          <p>{{ isViewMode ? 'Viewing' : 'Editing' }} advert {{ advertReference }}</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary" @click="goBack">← Back</button>
          <button
            v-if="isViewMode && advert && advert.status === 'draft' && !isBcLocked"
            class="btn btn-primary"
            @click="switchToEditMode"
          >
            ✏️ Edit
          </button>
          <span v-if="isBcLocked" class="locked-badge" title="Shared to Business Central — edits are no longer permitted">
            🔒 Locked (Synced to BC)
          </span>
          <button
            v-if="isBcLocked && !advert?.isCanceled && !advert?.isClosed"
            class="btn btn-danger-outline"
            @click="showCancelModal = true"
          >
            🚫 Request Cancellation
          </button>
        </div>
      </div>
    </div>

    <div v-if="pageLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <div>Loading advert...</div>
    </div>

    <div v-else-if="advert" class="content-card">
      <div class="card-header">
        <h2>{{ isViewMode ? 'Advert Details' : 'Edit Advert Information' }}</h2>
        <div class="advert-meta">
          <span class="meta-item">
            <strong>Status:</strong>
            <span :class="`status-badge badge-${getStatusClass(advert.status)}`">{{ getStatusLabel(advert.status) }}</span>
          </span>
          <span class="meta-item"><strong>Created:</strong> {{ formatDateTime(advert.createdAt) }}</span>
          <span class="meta-item"><strong>Created By:</strong> {{ advert.vgams_user?.name || 'Unknown' }}</span>
        </div>
      </div>

      <!-- BC Sync Lock Banner -->
      <div v-if="isBcLocked" class="bc-lock-banner">
        <div class="bc-lock-icon">🔒</div>
        <div class="bc-lock-body">
          <strong>This advert has been shared to Business Central and can no longer be edited.</strong>
          <p>
            Reference: <code>{{ advert.reference_number }}</code>
            &nbsp;·&nbsp;
            BC Reference: <code>{{ advert.bc_reference_number }}</code>
          </p>
          <p v-if="advert.isCanceled || advert.isClosed" class="bc-lock-note">
            A cancellation has already been requested/processed for this advert.
          </p>
          <p v-else class="bc-lock-note">
            To make any changes, submit a cancellation request using both reference numbers above — finance/BC will action the cancellation from there.
          </p>
        </div>
        <button v-if="!advert.isCanceled && !advert.isClosed" class="btn btn-danger-outline btn-sm" @click="showCancelModal = true">
          Request Cancellation
        </button>
      </div>

      <!-- ══════════════════════════════════════════════════════════
           READ-ONLY VIEW MODE
      ═══════════════════════════════════════════════════════════ -->
      <div v-if="isViewMode" class="view-mode">
        <div class="detail-section">
          <h3 class="section-title">Client Information</h3>
          <div class="detail-grid">
            <div class="detail-item"><label>Client Name:</label><div class="detail-value">{{ advert.client?.company_name || 'N/A' }}</div></div>
            <div class="detail-item"><label>Contact Person:</label><div class="detail-value">{{ advert.contact_person || advert.client?.contact_person || 'N/A' }}</div></div>
            <div class="detail-item"><label>Email:</label><div class="detail-value">{{ advert.contact_email || advert.client?.email || 'N/A' }}</div></div>
            <div class="detail-item"><label>Phone:</label><div class="detail-value">{{ advert.contact_number || advert.client?.phone || 'N/A' }}</div></div>
            <div class="detail-item"><label>Market Sector:</label><div class="detail-value">{{ advert.market_sector || 'N/A' }}</div></div>
          </div>
        </div>

        <div class="detail-section">
          <h3 class="section-title">Advert Information</h3>
          <div class="detail-grid">
            <div class="detail-item"><label>Advert Title:</label><div class="detail-value">{{ advert.advert_title }}</div></div>
            <div class="detail-item"><label>Platform Category:</label><div class="detail-value">{{ advert.product?.category?.name || 'N/A' }}</div></div>
            <div class="detail-item"><label>Product:</label><div class="detail-value">{{ advert.product?.product_name || advert.product?.name || 'N/A' }}</div></div>
            <div class="detail-item">
              <label>Rate Card:</label>
              <div class="detail-value">
                {{ advert.rate_card?.ad_type || 'N/A' }}
                <span v-if="advert.rate_card?.size_dimension" class="detail-meta">({{ advert.rate_card.size_dimension }})</span>
              </div>
            </div>
            <div class="detail-item"><label>Ad Size:</label><div class="detail-value">{{ advert.ad_size || 'N/A' }}</div></div>
            <div class="detail-item"><label>Ad Type:</label><div class="detail-value">{{ formatAdType(advert.ad_type) }}</div></div>
            <div class="detail-item"><label>Office Location:</label><div class="detail-value">{{ advert.office_location || 'N/A' }}</div></div>
            <div class="detail-item"><label>Publish on Web:</label><div class="detail-value">{{ advert.publish_onweb ? 'Yes' : 'No' }}</div></div>
          </div>
        </div>

        <div class="detail-section">
          <h3 class="section-title">Schedule & Pricing</h3>
          <div class="detail-grid">
            <div class="detail-item"><label>Start Date:</label><div class="detail-value">{{ formatDate(advert.start_date) }}</div></div>
            <div class="detail-item"><label>End Date:</label><div class="detail-value">{{ formatDate(advert.end_date) || 'N/A' }}</div></div>
            <div class="detail-item"><label>Frequency:</label><div class="detail-value">{{ advert.frequency }} insertion(s)</div></div>
            <div class="detail-item"><label>Payment Method:</label><div class="detail-value">{{ formatPaymentMethod(advert.payment_method) }}</div></div>
            <div class="detail-item full-width"><label>Base Price:</label><div class="detail-value">{{ formatCurrency(advert.base_price) }}</div></div>
            <div class="detail-item full-width" v-if="advert.surcharge > 0"><label>Surcharge:</label><div class="detail-value">{{ formatCurrency(advert.surcharge) }}</div></div>
            <div class="detail-item full-width" v-if="advert.discount > 0"><label>Discount:</label><div class="detail-value discount">-{{ advert.discount }}%</div></div>
            <div class="detail-item full-width total-amount"><label>Total Amount:</label><div class="detail-value">{{ formatCurrency(advert.total_amount) }}</div></div>
          </div>
        </div>

        <div class="detail-section" v-if="publishingDatesList.length">
          <h3 class="section-title">Publishing Dates ({{ publishingDatesList.length }})</h3>
          <div class="pubdate-chips">
            <span v-for="(d, i) in publishingDatesList" :key="i" class="pubdate-chip">{{ formatDate(d) }}</span>
          </div>
        </div>

        <div class="detail-section" v-if="advert.special_instructions">
          <h3 class="section-title">Special Instructions</h3>
          <div class="detail-value">{{ advert.special_instructions }}</div>
        </div>

        <div class="detail-section" v-if="advert.attachments && advert.attachments.length > 0">
          <h3 class="section-title">Attachments ({{ advert.attachments.length }})</h3>
          <div class="attachments-list">
            <div v-for="attachment in advert.attachments" :key="attachment.id" class="attachment-item">
              <div class="attachment-icon">📎</div>
              <div class="attachment-info">
                <div class="attachment-name">{{ attachment.name }}</div>
                <div class="attachment-meta">{{ formatFileSize(attachment.size) }} • {{ formatDateTime(attachment.uploadedAt) }}</div>
              </div>
              <button class="btn btn-sm btn-download" @click="downloadAttachment(attachment)">📥 Download</button>
            </div>
          </div>
        </div>
      </div>

      <!-- ══════════════════════════════════════════════════════════
           EDIT MODE — same form sections/components as new.vue,
           prefilled from the existing advert. Save/Update only —
           no "submit for review" here.
      ═══════════════════════════════════════════════════════════ -->
      <form v-else-if="!isBcLocked" @submit.prevent.stop>
        <div v-if="categoriesError" class="error-message">
          <strong>Error loading categories:</strong> {{ categoriesError }}
          <button type="button" @click="retryLoadCategories" class="btn-retry">Retry</button>
        </div>

        <ClientInformation
          v-model:client-name="form.clientName"
          v-model:client-id="form.clientId"
          v-model:contact-person="form.contactPerson"
          v-model:email="form.email"
          v-model:phone="form.phone"
          v-model:reference-document="form.referenceDocument"
          v-model:market-sector="form.marketSector"
          :disabled="formBusy"
          @changed="handleClientInfoChange"
        />

        <AdvertInformation
          v-model:advert-title="form.advertTitle"
          v-model:platform-category="form.platformCategory"
          v-model:product="form.product"
          v-model:rate-card-id="form.rateCardId"
          v-model:ad-size="form.adSize"
          v-model:ad-type="form.adType"
          v-model:office-location="form.officeLocation"
          v-model:publish-on-web="form.publishOnWeb"
          :disabled="formBusy"
          :categories="categories"
          :products="products"
          :rate-cards="rateCards"
          :rate-card-details="rateCardDetails"
          :categories-loading="categoriesLoading"
          :products-loading="productsLoading"
          :rate-cards-loading="rateCardsLoading"
          :price-loading="priceLoading"
          :office-locations="officeLocations"
          :office-locations-loading="officeLocationsLoading"
          @category-change="loadProductsForCategory"
          @product-change="handleProductSelected"
          @ratecard-change="handleRateCardSelected"
          @adtype-change="handleAdTypeChange"
          @edit-ratecard-details="editRateCardDetails"
          @office-location-selected="handleOfficeLocationSelected"
        />

        <SchedulePricing
          ref="schedulePricingRef"
          v-model:start-date="form.startDate"
          v-model:end-date="form.endDate"
          v-model:frequency="form.frequency"
          v-model:payment-method="form.paymentMethod"
          v-model:discount="form.discount"
          v-model:dates-list="form.datesList"
          :disabled="formBusy"
          :rate-card-id="form.rateCardId"
          :price-calculation="priceCalculation"
          :price-loading="priceLoading"
          :min-date="today"
          :rate-card-details="rateCardDetails"
          :currency="selectedCurrency"
          :platform-category="form.platformCategory"
          @frequency-change="handleFrequencyChange"
          @frequency-adjust="handleFrequencyAdjust"
          @discount-change="handleDiscountChange"
          @dates-updated="handleDatesUpdated"
        />

        <SalesAgentSelection
          v-model="form.salesAgentId"
          :disabled="formBusy"
          @agent-selected="handleAgentSelected"
        />

        <AdditionalInformation
          v-model="form.specialInstructions"
          :disabled="formBusy"
          :dates-string="middleDatesString"
        >
          <template #file-upload>
            <div v-if="existingFiles.length > 0" class="existing-attachments">
              <h4 class="existing-attachments__title">Current Attachments</h4>
              <div class="attachments-list">
                <div v-for="file in existingFiles" :key="file.id" class="attachment-item">
                  <div class="attachment-icon">📎</div>
                  <div class="attachment-info">
                    <div class="attachment-name">{{ file.name }}</div>
                    <div class="attachment-meta">{{ formatFileSize(file.size) }}</div>
                  </div>
                  <button type="button" class="btn btn-sm btn-download" @click="downloadAttachment(file)">📥 Download</button>
                  <button type="button" class="btn btn-sm btn-remove" @click="removeExistingFile(file)" :disabled="formBusy">✕ Remove</button>
                </div>
              </div>
            </div>
            <FileUpload @files-updated="handleFilesUpdate" :disabled="formBusy" />
          </template>
        </AdditionalInformation>

        <!-- Form Actions — Save/Update Draft only, no submit-for-review here -->
        <div class="form-actions">
          <button type="button" class="btn btn-outline" @click="downloadOrderSummary" :disabled="!hasRequiredClientInfo || printingSummary">
            <span v-if="printingSummary">Generating...</span><span v-else>Download PDF</span>
          </button>
          <button type="button" class="btn btn-outline" @click="printOrderSummary" :disabled="!hasRequiredClientInfo || printingSummary">
            <span v-if="printingSummary">Generating...</span><span v-else>Print</span>
          </button>
          <button type="button" class="btn btn-secondary" @click="goBack" :disabled="formBusy">Cancel</button>
          <button type="button" class="btn btn-primary" @click="saveAsDraft" :disabled="formBusy || !hasRequiredClientInfo">
            <span v-if="savingDraft">Saving...</span><span v-else>Update Advert</span>
          </button>
        </div>
      </form>

      <!-- Fallback if a BC-locked advert is reached directly via the edit URL -->
      <div v-else class="bc-locked-fallback">
        <p>Editing is disabled for this advert because it has already been shared to Business Central.</p>
        <button class="btn btn-secondary" @click="isViewMode = true; router.replace({ query: { mode: 'view' } })">
          View Advert Details
        </button>
      </div>
    </div>

    <div v-else class="error-container">
      <h2>Advert Not Found</h2>
      <p>{{ error || 'The advert you are looking for could not be found or you do not have permission to access it.' }}</p>
      <button class="btn btn-primary" @click="goBack">Go Back</button>
    </div>

    <!-- Rate Card Details Modal (per-word / per-column classified builder) -->
    <RateCardDetailsModal
      :show-modal="showRateCardModal"
      :selected-rate-card="selectedRateCard"
      :frequency="form.frequency"
      :ad-type="form.adType"
      @close="handleModalClose"
      @save="handleModalSave"
    />

    <!-- Full Page Mask -->
    <FullPageMask
      :visible="maskVisible"
      :type="maskType"
      :title="maskTitle"
      :message="maskMessage"
      :details="maskDetails"
      :auto-close="maskAutoClose"
      @close="closeMask"
    />

    <!-- Cancellation Request Modal -->
    <div v-if="showCancelModal" class="modal-backdrop" @click.self="showCancelModal = false">
      <div class="modal-box">
        <h3>Request Cancellation</h3>
        <p class="modal-sub">
          This advert has already been synced to Business Central, so it cannot be edited directly.
          Submitting this request escalates a cancellation to finance/BC using both reference numbers below.
        </p>
        <div class="modal-refs">
          <div><label>Reference</label><code>{{ advert?.reference_number }}</code></div>
          <div><label>BC Reference</label><code>{{ advert?.bc_reference_number }}</code></div>
        </div>
        <label class="modal-label">Reason for cancellation <span class="required">*</span></label>
        <textarea v-model="cancelReason" rows="4" placeholder="Explain why this advert needs to be canceled…" :disabled="cancelSubmitting"></textarea>
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="showCancelModal = false" :disabled="cancelSubmitting">Close</button>
          <button class="btn btn-danger" :disabled="!cancelReason.trim() || cancelSubmitting" @click="requestCancellation">
            <span v-if="cancelSubmitting">Submitting…</span><span v-else>Submit Cancellation Request</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// Same component set as components/clerk/New.vue — this page is a prefilled
// replica of that form, not a separate simplified form, so client/advert/
// schedule editing behaves identically to booking creation.
import FileUpload from '~/components/clerk/FileUpload.vue'
import RateCardDetailsModal from '~/components/clerk/RateCardDetailsModal.vue'
import ClientInformation from '~/components/clerk/ClientInformation.vue'
import AdvertInformation from '~/components/clerk/AdvertInformation.vue'
import SchedulePricing from '~/components/clerk/SchedulePricing.vue'
import AdditionalInformation from '~/components/clerk/AdditionalInformation.vue'
import SalesAgentSelection from '~/components/clerk/SalesAgentSelection.vue'
import FullPageMask from '~/components/clerk/FullPageMask.vue'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

import { useProducts } from '~/composables/useProducts'
import { useAdverts } from '~/composables/useAdverts'
import { useOfficeLocationsStore } from '~/stores/officeLocation'
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute, useRuntimeConfig } from '#imports'
import { storeToRefs } from 'pinia'

const route = useRoute()
const router = useRouter()
const config = useRuntimeConfig()

const API_BASE = config.public.apiBase
const UPLOAD_BASE = config.public.uploadBase

const {
  categories,
  products,
  rateCards,
  loadCategories,
  loadProductsByCategoryId,
  loadRateCards,
  calculatePrice: calculatePriceApi,
} = useProducts()

const { getAdvertById } = useAdverts()

const officeLocationsStore = useOfficeLocationsStore()
const { locations: officeLocations, loading: officeLocationsLoading } = storeToRefs(officeLocationsStore)

const today = ref(new Date().toISOString().split('T')[0])
const schedulePricingRef = ref(null)

const advertId = route.params.id
const isViewMode = ref(route.query.mode === 'view')

// ── Page/advert state ──
const advert = ref(null)
const existingFiles = ref([])
const pageLoading = ref(true)
const error = ref(null)

// ── Form state — mirrors new.vue's `form` shape exactly ──
const form = reactive({
  clientName: '',
  contactPerson: '',
  email: '',
  phone: '',
  referenceDocument: '',
  clientId: '',
  marketSector: '',
  advertTitle: '',
  platformCategory: '',
  product: '',
  rateCardId: '',
  adSize: '',
  adType: 'full_color',
  publishOnWeb: false,
  officeLocation: '',
  startDate: '',
  endDate: '',
  frequency: 1,
  paymentMethod: '',
  discount: 0,
  specialInstructions: '',
  files: [],
  datesList: [],
  salesAgentId: ''
})

// Loading states
const categoriesLoading = ref(false)
const categoriesError = ref(null)
const productsLoading = ref(false)
const rateCardsLoading = ref(false)
const priceLoading = ref(false)
const savingDraft = ref(false)
const printingSummary = ref(false)

// Modal state
const showRateCardModal = ref(false)
const rateCardDetails = ref(null)

// Pricing
const priceCalculation = ref(null)
const selectedCurrency = ref('UGX')

// BC / cancellation state
const showCancelModal = ref(false)
const cancelReason = ref('')
const cancelSubmitting = ref(false)

// Mask state
const maskVisible = ref(false)
const maskType = ref('info')
const maskTitle = ref('')
const maskMessage = ref('')
const maskDetails = ref('')
const maskAutoClose = ref(3000)

const showMask = ({ type, title, message, details, autoClose = 3000 }) => {
  maskType.value = type
  maskTitle.value = title
  maskMessage.value = message
  maskDetails.value = details || ''
  maskAutoClose.value = autoClose
  maskVisible.value = true
}
const closeMask = () => {
  maskVisible.value = false
  setTimeout(() => {
    if (!maskVisible.value) {
      maskType.value = 'info'; maskTitle.value = ''; maskMessage.value = ''; maskDetails.value = ''
    }
  }, 300)
}

// Lock frequency to 1 for print media, same as new.vue
watch(() => form.platformCategory, (newCategory) => {
  if (newCategory === 'print') form.frequency = 1
})

const buildPublishingDates = () => {
  const datesSet = new Set([
    ...(form.datesList || []),
    ...(form.startDate ? [form.startDate] : []),
    ...(form.endDate ? [form.endDate] : [])
  ].filter(Boolean))
  return [...datesSet].sort()
}

// ── Computed ──
const advertReference = computed(() => advert.value?.reference_number || `#${advertId}`)

// An advert already shared to Business Central can no longer be edited —
// only a cancellation escalation (using both reference numbers) is allowed.
const isBcLocked = computed(() => !!(advert.value?.bc_reference_number && advert.value?.bc_share_success === true))

const publishingDatesList = computed(() => {
  const raw = advert.value?.publishing_dates
  return Array.isArray(raw) ? raw : []
})

const selectedRateCard = computed(() => form.rateCardId ? rateCards.value.find(rc => rc.id == form.rateCardId) : null)

const hasRequiredClientInfo = computed(() =>
  form.clientName && form.email && form.phone && form.advertTitle && form.officeLocation && form.marketSector
)

const formBusy = computed(() => savingDraft.value || categoriesLoading.value)

// ── Lifecycle ──
onMounted(async () => {
  categoriesLoading.value = true
  try {
    await loadCategories()
  } catch (err) {
    categoriesError.value = err.message || 'Failed to load categories'
  } finally {
    categoriesLoading.value = false
  }
  await loadOfficeLocations()
  await loadAdvert()
})

const loadOfficeLocations = async () => {
  try {
    await officeLocationsStore.fetchOfficeLocations()
  } catch (err) {
    console.error('Failed to load office locations:', err)
  }
}

const retryLoadCategories = async () => {
  categoriesError.value = null
  categoriesLoading.value = true
  try {
    await loadCategories()
  } catch (err) {
    categoriesError.value = err.message || 'Failed to load categories'
  } finally {
    categoriesLoading.value = false
  }
}

// ── Load the existing advert and prefill the form + cascading selects ──
const loadAdvert = async () => {
  pageLoading.value = true
  error.value = null
  try {
    const response = await getAdvertById(advertId)
    if (response.success !== false && (response.data || response)) {
      advert.value = response.data || response
      await populateFormFromAdvert()
      existingFiles.value = (advert.value.attachments || []).map(f => ({
        id: f.id, name: f.name, size: f.size, url: f.url, mime: f.mime, uploadedAt: f.uploadedAt
      }))
    } else {
      error.value = response.message || 'Advert not found'
    }
  } catch (err) {
    error.value = err.message || 'Failed to load advert'
    console.error('Error loading advert:', err)
  } finally {
    pageLoading.value = false
  }
}

// NOTE: this assumes advert.product.category exposes `category_type` the same
// way the categories list does, and that vgams_sales_persons carries a single
// assigned agent as its first entry. Adjust if the actual API shape differs.
const populateFormFromAdvert = async () => {
  const a = advert.value
  if (!a) return

  form.clientName = a.client?.company_name || ''
  form.clientId = a.client?.id || ''
  form.contactPerson = a.contact_person || a.client?.contact_person || ''
  form.email = a.contact_email || a.client?.email || ''
  form.phone = a.contact_number || a.client?.phone || ''
  form.referenceDocument = a.client_reference_no || ''
  form.marketSector = a.market_sector || ''
  form.advertTitle = a.advert_title || ''
  form.adSize = a.ad_size || ''
  form.adType = a.ad_type || 'full_color'
  form.publishOnWeb = !!a.publish_onweb
  form.officeLocation = a.office_location || ''
  form.startDate = a.start_date?.split('T')[0] || ''
  form.endDate = a.end_date?.split('T')[0] || ''
  form.frequency = a.frequency || 1
  form.paymentMethod = a.payment_method || ''
  form.discount = a.discount || 0
  form.specialInstructions = a.special_instructions || ''
  form.datesList = Array.isArray(a.publishing_dates) ? [...a.publishing_dates] : []
  form.salesAgentId = (Array.isArray(a.vgams_sales_persons) ? a.vgams_sales_persons[0]?.id : a.vgams_sales_persons?.id) || ''

  // Cascade category -> products -> rate card WITHOUT resetting selections
  // (loadProductsForCategory below is the reset variant, used only when the
  // user manually changes category afterwards).
  const categoryType = a.product?.category?.category_type
  if (categoryType) {
    form.platformCategory = categoryType
    const category = categories.value.find(c => c.category_type === categoryType)
    if (category) {
      productsLoading.value = true
      try { await loadProductsByCategoryId(category.id) } finally { productsLoading.value = false }
    }
  }

  if (a.product?.id) {
    form.product = a.product.id
    rateCardsLoading.value = true
    try {
      await loadRateCards(form.product)
      if (rateCards.value.length > 0) selectedCurrency.value = rateCards.value[0].currency || 'UGX'
    } finally {
      rateCardsLoading.value = false
    }
  }

  if (a.rate_card?.id) form.rateCardId = a.rate_card.id

  // Use the stored pricing directly rather than recalculating on load — the
  // rate card may have changed since this advert was booked, and we don't
  // want editing to silently reprice an already-agreed booking.
  priceCalculation.value = {
    basePrice: a.base_price || 0,
    subtotal: (a.base_price || 0) * (a.frequency || 1),
    total: a.total_amount || 0,
    surcharge: a.surcharge || 0,
    surchargePercentage: 0,
    currency: selectedCurrency.value || 'UGX',
    frequency: a.frequency || 1
  }
}

// ── Cascading selects (same behaviour as new.vue) ──
const loadProductsForCategory = async () => {
  try {
    productsLoading.value = true
    form.product = ''
    form.rateCardId = ''
    form.adSize = ''
    priceCalculation.value = null
    rateCardDetails.value = null
    if (form.platformCategory === 'print') form.frequency = 1
    if (!form.platformCategory) return
    const category = categories.value.find(cat => cat.category_type === form.platformCategory)
    if (!category) return
    await loadProductsByCategoryId(category.id)
  } catch (err) {
    console.error('Failed to load products:', err)
    alert('Failed to load products. Please try again.')
  } finally {
    productsLoading.value = false
  }
}

const handleProductSelected = async () => {
  try {
    rateCardsLoading.value = true
    form.rateCardId = ''
    priceCalculation.value = null
    rateCardDetails.value = null
    await loadRateCards(form.product)
    if (rateCards.value.length > 0) selectedCurrency.value = rateCards.value[0].currency || 'UGX'
  } catch (err) {
    console.error('Failed to load rate cards:', err)
    alert('Failed to load rate cards. Please try again.')
  } finally {
    rateCardsLoading.value = false
  }
}

const handleRateCardSelected = async () => {
  if (!form.rateCardId) { priceCalculation.value = null; rateCardDetails.value = null; return }
  await calculatePrice()
}

const handleAdTypeChange = () => { if (form.rateCardId) calculatePrice() }

const handleFrequencyChange = () => {
  if (form.platformCategory === 'print') { form.frequency = 1; return }
  if (form.rateCardId) calculatePrice()
}

const handleDiscountChange = () => { if (form.rateCardId) calculatePrice() }

const handleFrequencyAdjust = (newFrequency) => {
  if (form.platformCategory === 'print') { form.frequency = 1; return }
  if (rateCardDetails.value && form.rateCardId === rateCardDetails.value.rateCardId) {
    performPriceCalculationWithDetails(rateCardDetails.value)
  } else if (form.rateCardId) {
    calculatePrice()
  }
}

const handleDatesUpdated = () => { if (form.rateCardId) calculatePrice() }
const handleAgentSelected = () => {}
const handleOfficeLocationSelected = (locationCode) => {
  const location = officeLocations.value.find(loc => loc.code === locationCode)
  if (location) officeLocationsStore.setSelectedLocation(location)
}
const handleClientInfoChange = () => {}

const middleDatesString = computed(() => (form.datesList || []).join(', '))

const calculatePrice = async () => {
  if (!form.rateCardId || !form.frequency || !form.adType) { priceCalculation.value = null; return }

  let rateCard = rateCards.value.find(rc => rc.id === form.rateCardId) || rateCards.value.find(rc => rc.id == form.rateCardId)
  if (!rateCard) return

  const requiresDetails = rateCard && (
    rateCard.size_dimension === 'per cm col' || rateCard.size_dimension === 'per_cm_col' ||
    rateCard.size_dimension === 'per column' || rateCard.size_dimension === 'per_column' ||
    rateCard.size_dimension === 'per word' || rateCard.size_dimension === 'per_word' ||
    rateCard.ad_type === 'classified photo/Logo'
  )

  if (requiresDetails) {
    if (rateCardDetails.value && rateCardDetails.value.rateCardId === form.rateCardId) {
      await performPriceCalculationWithDetails(rateCardDetails.value)
    } else {
      showRateCardModal.value = true
    }
  } else {
    await performPriceCalculation()
  }
}

const performPriceCalculation = async () => {
  try {
    priceLoading.value = true
    const data = await calculatePriceApi(form.product, form.rateCardId, {
      frequency: parseInt(form.frequency) || 1,
      adType: form.adType
    })
    priceCalculation.value = data
    selectedCurrency.value = data.currency || 'UGX'
  } catch (err) {
    console.error('Price calculation failed:', err)
    priceCalculation.value = null
    alert('Failed to calculate price. Please check your selections.')
  } finally {
    priceLoading.value = false
  }
}

const performPriceCalculationWithDetails = async (details) => {
  try {
    priceLoading.value = true
    const response = await $fetch(`${API_BASE}/adverts/calculate-price`, {
      method: 'POST',
      body: {
        productId: form.product,
        rateCardId: form.rateCardId,
        frequency: parseInt(form.frequency) || 1,
        adType: form.adType,
        ...details.details
      }
    })
    priceCalculation.value = {
      basePrice: response.basePrice,
      subtotal: response.subtotal,
      total: response.total,
      surcharge: response.surcharge || 0,
      surchargePercentage: response.surchargePercentage || 0,
      currency: response.currency || 'UGX',
      frequency: response.frequency || form.frequency,
      rateCardId: details.rateCardId,
      sizeDimension: details.sizeDimension,
      rateCardAdType: details.adType,
      rateCardDetails: details.details,
      modalEstimate: details.calculatedPrice
    }
    selectedCurrency.value = response.currency || 'UGX'
  } catch (err) {
    console.error('Price calculation with details failed:', err)
    priceCalculation.value = null
    alert('Failed to calculate price. Please try again.')
  } finally {
    priceLoading.value = false
  }
}

const isRateCardActive = (rateCard) => {
  if (!rateCard.effectiveDate && !rateCard.expiryDate) return true
  const now = new Date()
  const effectiveDate = rateCard.effectiveDate ? new Date(rateCard.effectiveDate) : null
  const expiryDate = rateCard.expiryDate ? new Date(rateCard.expiryDate) : null
  if (effectiveDate && now < effectiveDate) return false
  if (expiryDate && now > expiryDate) return false
  return true
}

const handleModalClose = () => { showRateCardModal.value = false }
const handleModalSave = (details) => {
  showRateCardModal.value = false
  rateCardDetails.value = details
  if (details.composedText) form.specialInstructions = details.composedText
  performPriceCalculationWithDetails(details)
}
const editRateCardDetails = () => { if (selectedRateCard.value) showRateCardModal.value = true }

const handleFilesUpdate = (files) => { form.files = files }
const removeExistingFile = (file) => { existingFiles.value = existingFiles.value.filter(f => f.id !== file.id) }

// ── Formatting helpers ──
const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return 'UGX 0'
  return new Intl.NumberFormat('en-UG', { style: 'currency', currency: selectedCurrency.value || 'UGX', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount)
}
const formatNumber = (n) => (n === undefined || n === null) ? '0' : new Intl.NumberFormat('en-UG').format(n)
const formatDate = (dateString) => {
  if (!dateString) return ''
  try { return new Date(dateString).toLocaleDateString('en-UG', { year: 'numeric', month: 'short', day: 'numeric' }) } catch { return dateString }
}
const formatDateTime = (dateString) => {
  if (!dateString) return ''
  try { return new Date(dateString).toLocaleString('en-UG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) } catch { return dateString }
}
const formatFileSize = (bytes) => {
  if (!bytes) return '0 KB'
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(2)} KB`
  return `${(kb / 1024).toFixed(2)} MB`
}
const formatAdType = (type) => ({ full_color: 'Full Color', black_white: 'Black & White' }[type] || type)
const formatPaymentMethod = (method) => ({
  cash: 'Cash', credit: 'Credit', pdc: 'Post-Dated Cheque', bank_transfer: 'Bank Transfer', mobile_money: 'Mobile Money'
}[method] || method)

const getStatusLabel = (status) => ({
  draft: 'Draft', pending_review: 'Pending Review', editor_approved: 'Editor Approved',
  manager_approved: 'Manager Approved', editor_rejected: 'Editor Rejected', manager_rejected: 'Manager Rejected', published: 'Published'
}[status] || status)
const getStatusClass = (status) => ({
  draft: 'draft', pending_review: 'pending', editor_approved: 'approved',
  manager_approved: 'approved', editor_rejected: 'rejected', manager_rejected: 'rejected', published: 'published'
}[status] || 'default')

// ── Order summary PDF (same layout as new.vue, but reference numbers are
// already known since this advert already exists) ──
const buildOrderSummaryPdf = () => {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 40
  let y = 50

  doc.setFontSize(16); doc.setFont(undefined, 'bold')
  doc.text('VGAMS - Advert Order Summary', margin, y); y += 18
  doc.setFontSize(9); doc.setFont(undefined, 'normal'); doc.setTextColor(100)
  doc.text(`Generated: ${new Date().toLocaleString('en-UG')}`, margin, y); doc.setTextColor(0); y += 16

  doc.setFontSize(10); doc.setFont(undefined, 'bold')
  doc.text(`Booking Number: ${advert.value?.reference_number || '—'}`, margin, y); y += 14
  doc.text(`BC Reference: ${advert.value?.bc_reference_number || 'Pending Business Central sync'}`, margin, y)
  doc.setFont(undefined, 'normal'); y += 20

  doc.setFontSize(12); doc.setFont(undefined, 'bold')
  doc.text('Client Information', margin, y); y += 6
  autoTable(doc, {
    startY: y, margin: { left: margin, right: margin }, theme: 'grid',
    styles: { fontSize: 9, cellPadding: 5 }, headStyles: { fillColor: [0, 51, 102] },
    head: [['Field', 'Value']],
    body: [
      ['Client Name', form.clientName || '-'],
      ['Contact Person', form.contactPerson || '-'],
      ['Email', form.email || '-'],
      ['Phone', form.phone || '-'],
      ['Market Sector', form.marketSector || '-']
    ]
  })
  y = doc.lastAutoTable.finalY + 20

  doc.setFontSize(12); doc.setFont(undefined, 'bold')
  doc.text('Advert Information', margin, y); y += 6
  autoTable(doc, {
    startY: y, margin: { left: margin, right: margin }, theme: 'grid',
    styles: { fontSize: 9, cellPadding: 5 }, headStyles: { fillColor: [0, 51, 102] },
    head: [['Field', 'Value']],
    body: [
      ['Advert Title', form.advertTitle || '-'],
      ['Platform', form.platformCategory || '-'],
      ['Ad Type', form.adType || '-'],
      ['Office Location', form.officeLocation || '-'],
      ['Publish on Web', form.publishOnWeb ? 'Yes' : 'No'],
      ['Start Date', formatDate(form.startDate) || '-'],
      ['End Date', formatDate(form.endDate) || '-'],
      ['Frequency', `${form.frequency || 1} insertion(s)`]
    ]
  })
  y = doc.lastAutoTable.finalY + 20

  doc.setFontSize(12); doc.setFont(undefined, 'bold')
  doc.text('Pricing Breakdown', margin, y); y += 6
  const finalTotal = schedulePricingRef.value?.calculateFinalTotal?.() || priceCalculation.value?.total || 0
  const pricingRows = [
    ['Base Price', formatCurrency(priceCalculation.value?.basePrice || 0)],
    ['Surcharge', `${formatCurrency(priceCalculation.value?.surcharge || 0)} (${priceCalculation.value?.surchargePercentage || 0}%)`],
    ['Subtotal', formatCurrency(priceCalculation.value?.subtotal || 0)],
    ['Discount', formatNumber(form.discount || 0) + '%'],
    ['Frequency', `${priceCalculation.value?.frequency || form.frequency || 1}`],
    ['Final Total', formatCurrency(finalTotal)]
  ]
  if (rateCardDetails.value?.sizeDimension === 'per word' && rateCardDetails.value?.details?.words) {
    pricingRows.splice(1, 0, ['Word Count', `${rateCardDetails.value.details.words} word(s)`])
  }
  autoTable(doc, {
    startY: y, margin: { left: margin, right: margin }, theme: 'grid',
    styles: { fontSize: 9, cellPadding: 5 }, headStyles: { fillColor: [0, 51, 102] },
    head: [['Item', 'Value']], body: pricingRows,
    didParseCell: (data) => { if (data.row.index === pricingRows.length - 1) data.cell.styles.fontStyle = 'bold' }
  })
  y = doc.lastAutoTable.finalY + 20

  if (form.specialInstructions) {
    if (y > 700) { doc.addPage(); y = 50 }
    doc.setFontSize(12); doc.setFont(undefined, 'bold')
    doc.text('Special Instructions / Ad Content', margin, y); y += 16
    doc.setFontSize(10); doc.setFont(undefined, 'normal')
    const wrapped = doc.splitTextToSize(form.specialInstructions, pageWidth - margin * 2)
    wrapped.forEach((line) => {
      if (y > 780) { doc.addPage(); y = 50 }
      doc.text(line, margin, y); y += 13
    })
  }
  return doc
}

const downloadOrderSummary = async () => {
  printingSummary.value = true
  try {
    const doc = buildOrderSummaryPdf()
    const safeClientName = (form.clientName || 'client').replace(/[^a-z0-9]+/gi, '-').toLowerCase()
    doc.save(`advert-summary-${safeClientName}-${new Date().toISOString().split('T')[0]}.pdf`)
  } catch (err) {
    console.error('Failed to generate PDF:', err)
    alert('Failed to generate the print summary. Please try again.')
  } finally {
    printingSummary.value = false
  }
}

const printOrderSummary = async () => {
  printingSummary.value = true
  try {
    const doc = buildOrderSummaryPdf()
    doc.autoPrint()
    const printWindow = window.open(doc.output('bloburl'), '_blank')
    if (!printWindow) alert('Please allow pop-ups for this site to print the summary.')
  } catch (err) {
    console.error('Failed to generate PDF for printing:', err)
    alert('Failed to generate the print summary. Please try again.')
  } finally {
    printingSummary.value = false
  }
}

// ── Save/Update (the only submit path on this page — no submit-for-review) ──
const canEdit = computed(() => advert.value?.status === 'draft' && !isBcLocked.value)

const saveAsDraft = async () => {
  if (!canEdit.value) {
    alert(isBcLocked.value
      ? 'This advert has been shared to Business Central and can no longer be edited. Please submit a cancellation request instead.'
      : 'Only draft adverts can be edited.')
    return
  }
  if (!hasRequiredClientInfo.value) {
    showMask({ type: 'error', title: 'Missing Information', message: 'Please fill in all required client information before saving.', autoClose: 5000 })
    return
  }

  savingDraft.value = true
  showMask({ type: 'loading', title: 'Saving Changes', message: 'Please wait while we update your advert...', autoClose: 0 })

  try {
    const vgamsUser = JSON.parse(localStorage.getItem('vgams_user'))
    const finalTotal = schedulePricingRef.value?.calculateFinalTotal?.() || priceCalculation.value?.total || 0

    // NOTE: this assumes PUT /adverts/:id accepts multipart form-data the same
    // way POST /adverts (createAdvert) does, plus an `existingAttachmentIds`
    // field to preserve attachments that weren't removed — mirroring the
    // pattern already used by scheduleAdvert() in useAdverts.js. Confirm
    // against the actual Strapi controller and adjust if it differs.
    const updateData = {
      advert_title: form.advertTitle,
      ad_size: form.adSize || '',
      ad_type: form.adType,
      frequency: parseInt(form.frequency) || 1,
      start_date: form.startDate,
      end_date: form.endDate || null,
      base_price: priceCalculation.value?.basePrice || 0,
      surcharge: priceCalculation.value?.surcharge || 0,
      total_amount: finalTotal,
      discount: parseFloat(form.discount) || 0,
      payment_method: form.paymentMethod,
      special_instructions: form.specialInstructions?.trim() || '',
      office_location: form.officeLocation,
      publish_onweb: form.publishOnWeb,
      market_sector: form.marketSector || '',
      client_reference_no: form.referenceDocument || '',
      contact_person: form.contactPerson || '',
      contact_email: form.email,
      contact_number: form.phone,
      publishing_dates: buildPublishingDates(),
      status: 'draft',
      vgamsUserId: vgamsUser?.id,
      vgamsUserName: vgamsUser?.name,
      vgamsUserEmail: vgamsUser?.email,
      vgamsUserRole: vgamsUser?.role
    }

    const formData = new FormData()
    formData.append('data', JSON.stringify(updateData))
    formData.append('existingAttachmentIds', JSON.stringify(existingFiles.value.map(f => f.id)))
    if (form.files?.length > 0) {
      form.files.forEach(f => { if (f.file instanceof File) formData.append('files', f.file) })
    }

    const response = await $fetch(`${API_BASE}/adverts/${advertId}`, {
      method: 'PUT',
      headers: { 'x-vgams-user-id': vgamsUser?.id },
      body: formData
    })

    closeMask()
    if (response.success !== false) {
      showMask({ type: 'success', title: 'Advert Updated', message: 'Your changes have been saved.', autoClose: 2500 })
      await loadAdvert()
    } else {
      throw new Error(response.message || 'Failed to update advert')
    }
  } catch (err) {
    console.error('Update failed:', err)
    closeMask()
    showMask({ type: 'error', title: 'Failed to Save', message: err.message || 'An unexpected error occurred while updating your advert.', autoClose: 5000 })
  } finally {
    savingDraft.value = false
  }
}

const switchToEditMode = () => {
  if (isBcLocked.value) { alert('This advert has been shared to Business Central and can no longer be edited.'); return }
  isViewMode.value = false
  router.replace({ query: {} })
}

// Escalates a cancellation request for a BC-synced advert, using both the
// internal reference_number and the Business Central bc_reference_number.
// NOTE: assumes a `/adverts/:id/request-cancellation` route exists — adjust
// if the real route differs.
const requestCancellation = async () => {
  if (!cancelReason.value.trim()) return
  cancelSubmitting.value = true
  try {
    const vgamsUser = JSON.parse(localStorage.getItem('vgams_user'))
    const response = await $fetch(`${API_BASE}/adverts/${advertId}/request-cancellation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-vgams-user-id': vgamsUser?.id },
      body: {
        reference_number: advert.value?.reference_number,
        bc_reference_number: advert.value?.bc_reference_number,
        reason: cancelReason.value.trim(),
        vgamsUserId: vgamsUser?.id,
        vgamsUserName: vgamsUser?.name,
        vgamsUserRole: vgamsUser?.role
      }
    })
    if (response.success !== false) {
      alert('Cancellation request submitted. Finance/BC will action it shortly.')
      showCancelModal.value = false
      cancelReason.value = ''
      await loadAdvert()
    } else {
      throw new Error(response.message || 'Failed to submit cancellation request')
    }
  } catch (err) {
    console.error('Cancellation request failed:', err)
    alert(`Failed to submit cancellation request: ${err.message}`)
  } finally {
    cancelSubmitting.value = false
  }
}

const downloadAttachment = (attachment) => {
  if (attachment.url) {
    const fullUrl = attachment.url.startsWith('http') ? attachment.url : `${UPLOAD_BASE}${attachment.url}`
    window.open(fullUrl, '_blank')
  }
}

const goBack = () => router.back()
</script>

<style scoped>
.edit-booking-page { width: 100%; }

.page-header { background: white; padding: 25px 30px; border-radius: 10px; margin-bottom: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
.header-content { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px; }
.header-content h1 { color: #003366; margin-bottom: 8px; font-size: 1.8em; font-weight: 600; }
.header-content p { color: #666; margin: 0; font-size: 1em; }
.header-actions { display: flex; gap: 15px; align-items: center; flex-wrap: wrap; }

.loading-container, .error-container { text-align: center; padding: 60px; background: white; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
.loading-spinner { width: 40px; height: 40px; border: 3px solid #DDDDDD; border-top-color: #0066CC; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px; }
@keyframes spin { to { transform: rotate(360deg); } }
.error-container h2 { color: #dc3545; margin-bottom: 15px; }
.error-container p { color: #666; margin-bottom: 30px; }

.content-card { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #f0f2f5; flex-wrap: wrap; gap: 15px; }
.card-header h2 { color: #003366; font-size: 1.4em; font-weight: 600; margin: 0; }
.advert-meta { display: flex; gap: 20px; flex-wrap: wrap; }
.meta-item { font-size: 0.9em; color: #444; }
.meta-item strong { color: #003366; margin-right: 4px; }

.status-badge { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 0.85em; font-weight: 600; margin-left: 4px; }
.badge-draft { background: #fff3cd; color: #856404; }
.badge-pending { background: #d1ecf1; color: #0c5460; }
.badge-approved { background: #d4edda; color: #155724; }
.badge-rejected { background: #f8d7da; color: #721c24; }
.badge-published { background: #e6ecf2; color: #003366; }
.badge-default { background: #e2e3e5; color: #383d41; }

/* View mode */
.detail-section { margin-bottom: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px; }
.section-title { color: #003366; font-size: 1.1em; font-weight: 600; margin: 0 0 15px; }
.detail-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 18px; }
.detail-item label { display: block; font-size: 0.8em; color: #888; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 4px; }
.detail-value { color: #333; font-size: 1em; }
.detail-meta { color: #888; font-size: 0.85em; }
.detail-item.full-width { grid-column: 1 / -1; }
.detail-value.discount { color: #e31e24; font-weight: 600; }
.total-amount .detail-value { font-size: 1.3em; font-weight: 700; color: #003366; }

.pubdate-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.pubdate-chip { font-family: 'IBM Plex Mono', 'Consolas', monospace; font-size: 0.8em; font-weight: 600; color: #0066cc; background: #eef4ff; border: 1px solid #bfdbfe; padding: 4px 10px; border-radius: 4px; }

.attachments-list { display: flex; flex-direction: column; gap: 10px; }
.attachment-item { display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: white; border-radius: 6px; border: 1px solid #e5e7eb; }
.attachment-icon { font-size: 1.4em; }
.attachment-info { flex: 1; }
.attachment-name { font-weight: 500; color: #333; }
.attachment-meta { font-size: 0.85em; color: #666; }

.existing-attachments { margin-bottom: 16px; }
.existing-attachments__title { font-size: 0.9em; color: #003366; margin: 0 0 10px; }

/* Error / retry */
.error-message { background-color: #fee; color: #c00; padding: 15px 20px; border-radius: 6px; margin-bottom: 20px; border-left: 4px solid #c00; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; }
.btn-retry { background: #c00; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 0.85em; }
.btn-retry:hover { background: #a00; }

/* Form actions */
.form-actions { display: flex; gap: 15px; justify-content: flex-end; margin-top: 40px; padding-top: 20px; border-top: 1px solid #f0f2f5; flex-wrap: wrap; }

.btn { padding: 12px 28px; border: none; border-radius: 6px; cursor: pointer; font-size: 1em; font-weight: 500; transition: all 0.3s; min-width: 140px; text-align: center; }
.btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none !important; box-shadow: none !important; }

.btn-primary { background: linear-gradient(135deg, #0066cc 0%, #004d99 100%); color: white; box-shadow: 0 2px 4px rgba(0,102,204,0.2); }
.btn-primary:hover:not(:disabled) { background: linear-gradient(135deg, #0052a3 0%, #003d80 100%); transform: translateY(-1px); box-shadow: 0 4px 8px rgba(0,102,204,0.3); }

.btn-secondary { background: #f0f2f5; color: #333; border: 1px solid #d1d9e0; box-shadow: none; }
.btn-secondary:hover:not(:disabled) { background: #e2e8f0; transform: translateY(-1px); }

.btn-outline { background: white; color: #003366; border: 1.5px solid #003366; }
.btn-outline:hover:not(:disabled) { background: #F0F4F8; transform: translateY(-1px); }

.btn-danger { background: linear-gradient(135deg, #e31e24 0%, #c01820 100%); color: white; box-shadow: 0 2px 4px rgba(227,30,36,0.2); }
.btn-danger:hover:not(:disabled) { background: linear-gradient(135deg, #c01820 0%, #a0141a 100%); transform: translateY(-1px); }
.btn-danger-outline { background: white; color: #c01820; border: 2px solid #e31e24; }
.btn-danger-outline:hover:not(:disabled) { background: #fef2f2; }

.btn-sm { padding: 6px 12px; font-size: 0.85em; min-width: auto; }
.btn-download { background: #6f42c1; color: white; }
.btn-download:hover { background: #5a32a3; }
.btn-remove { background: white; color: #c01820; border: 1px solid #e31e24; }
.btn-remove:hover:not(:disabled) { background: #fef2f2; }

/* BC sync lock */
.locked-badge { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; background: #fff7ed; color: #92400e; border: 1px solid #fde68a; border-radius: 6px; font-size: 0.85em; font-weight: 600; white-space: nowrap; }

.bc-lock-banner { display: flex; align-items: flex-start; gap: 14px; background: #fff7ed; border: 1px solid #fde68a; border-radius: 8px; padding: 16px 20px; margin-bottom: 25px; }
.bc-lock-icon { font-size: 1.5em; line-height: 1; }
.bc-lock-body { flex: 1; }
.bc-lock-body strong { color: #92400e; display: block; margin-bottom: 6px; }
.bc-lock-body p { margin: 4px 0; color: #78350f; font-size: 0.9em; }
.bc-lock-body code { font-family: 'IBM Plex Mono', 'Consolas', monospace; background: #ffffff; border: 1px solid #fde68a; padding: 2px 8px; border-radius: 4px; color: #92400e; font-weight: 600; }
.bc-lock-note { font-style: italic; }

.bc-locked-fallback { text-align: center; padding: 40px 20px; color: #666; }
.bc-locked-fallback p { margin-bottom: 16px; }

/* Cancellation modal */
.modal-backdrop { position: fixed; inset: 0; background: rgba(15,23,42,0.55); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
.modal-box { background: white; border-radius: 10px; padding: 28px; width: 100%; max-width: 480px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); }
.modal-box h3 { margin: 0 0 10px; color: #003366; font-size: 1.2em; }
.modal-sub { color: #666; font-size: 0.9em; line-height: 1.5; margin-bottom: 16px; }
.modal-refs { display: flex; gap: 16px; background: #f8f9fa; border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px 14px; margin-bottom: 18px; }
.modal-refs > div { flex: 1; }
.modal-refs label { display: block; font-size: 0.7em; text-transform: uppercase; letter-spacing: 0.05em; color: #9ca3af; font-weight: 700; margin-bottom: 3px; }
.modal-refs code { font-family: 'IBM Plex Mono', 'Consolas', monospace; font-weight: 600; color: #003366; }
.modal-label { display: block; margin-bottom: 8px; color: #333; font-weight: 500; font-size: 0.9em; }
.required { color: #e31e24; }
.modal-box textarea { width: 100%; padding: 12px 15px; border: 1px solid #ddd; border-radius: 6px; font-size: 0.95em; font-family: inherit; resize: vertical; min-height: 90px; }
.modal-box textarea:focus { outline: none; border-color: #0066cc; box-shadow: 0 0 0 3px rgba(0,102,204,0.1); }
.modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 18px; }

@media (max-width: 768px) {
  .page-header, .content-card { padding: 20px; }
  .header-content { flex-direction: column; align-items: flex-start; }
  .header-actions { width: 100%; justify-content: flex-end; }
  .advert-meta { flex-direction: column; gap: 10px; }
  .detail-grid { grid-template-columns: 1fr; }
  .form-actions { flex-direction: column; }
  .btn { width: 100%; min-width: unset; }
}
</style>