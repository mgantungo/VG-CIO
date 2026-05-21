<!-- components/sfa/SfaNewOpportunityModal.vue -->
<!-- 4-step opportunity creation modal.
     Step 2 lets the agent choose:
       A) An existing confirmed client (return order) → sets existing_client
       B) A prospect company from sfa-company → sets company
       C) Create a brand-new prospect → creates sfa-company then sets company
     All API via composables only. -->
<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="modal-backdrop" @click.self="cancel">
        <div class="modal">

          <!-- Header -->
          <div class="modal-header">
            <div class="modal-header-icon">{{ stepMeta[step].icon }}</div>
            <div>
              <div class="modal-title">New Opportunity</div>
              <div class="modal-sub">{{ stepMeta[step].label }}</div>
            </div>
            <button class="modal-close" @click="cancel">✕</button>
          </div>

          <!-- Step bar -->
          <div class="step-bar">
            <div
              v-for="(s, i) in stepMeta"
              :key="i"
              class="step-pip"
              :class="{ 'step-pip--done': i < step, 'step-pip--active': i === step }"
            >
              <span class="pip-num">{{ i + 1 }}</span>
              <span class="pip-label">{{ s.short }}</span>
            </div>
          </div>

          <!-- Body -->
          <div class="modal-body">
            <div v-if="submitError" class="error-banner">⚠ {{ submitError }}</div>

            <!-- ── Step 1: Basic Info ────────────────────────────────────── -->
            <template v-if="step === 0">
              <div class="field-grid">
                <div class="field field--full">
                  <label class="field-label">Title <span class="req">*</span></label>
                  <input v-model="form.title" class="field-input"
                    :class="{ 'field-input--error': errors.title }"
                    placeholder="e.g. MTN Q3 Digital Campaign" />
                  <span v-if="errors.title" class="field-error">{{ errors.title }}</span>
                </div>
                <div class="field field--full">
                  <label class="field-label">Description</label>
                  <textarea v-model="form.description" class="field-input field-textarea" rows="3"
                    placeholder="Brief description…" />
                </div>
                <div class="field">
                  <label class="field-label">Source</label>
                  <select v-model="form.source" class="field-input">
                    <option value="">Select source</option>
                    <option v-for="s in SOURCES" :key="s" :value="s">{{ s }}</option>
                  </select>
                </div>
                <div class="field">
                  <label class="field-label">Expected Value (UGX)</label>
                  <input v-model.number="form.expected_value" class="field-input" type="number" />
                </div>
                <div class="field">
                  <label class="field-label">Expected Close Date</label>
                  <input v-model="form.expected_close_date" class="field-input" type="date" />
                </div>
              </div>
            </template>

            <!-- ── Step 2: Client or Prospect ──────────────────────────── -->
            <template v-if="step === 1">

              <!-- Toggle: return client vs new prospect -->
              <div class="source-toggle">
                <button
                  class="source-btn"
                  :class="{ 'source-btn--active': clientMode === 'existing' }"
                  @click="setClientMode('existing')"
                >
                  🔁 Return Client
                </button>
                <button
                  class="source-btn"
                  :class="{ 'source-btn--active': clientMode === 'prospect' }"
                  @click="setClientMode('prospect')"
                >
                  🆕 New Prospect
                </button>
              </div>

              <div class="mode-hint">
                <span v-if="clientMode === 'existing'">
                  Search for a client already confirmed in the system.
                </span>
                <span v-else>
                  Search for a prospect company or create one from scratch.
                </span>
              </div>

              <!-- ── Existing client search ───────────────── -->
              <template v-if="clientMode === 'existing'">
                <div class="search-wrap">
                  <input
                    v-model="clientSearch"
                    class="field-input"
                    placeholder="Search client name…"
                    @input="onClientSearch"
                  />
                  <div v-if="clientResults.length" class="dropdown">
                    <div
                      v-for="c in clientResults"
                      :key="c.id"
                      class="dropdown-option"
                      @click="selectExistingClient(c)"
                    >
                      <div class="do-name">{{ c.company_name }}</div>
                      <div class="do-meta">
                        <span v-if="c.bc_no" class="bc-pill">BC: {{ c.bc_no }}</span>
                        {{ c.payment_terms }}
                      </div>
                    </div>
                  </div>
                </div>

                <div v-if="selectedExistingClient" class="selected-card selected-card--blue">
                  <div class="sc-name">{{ selectedExistingClient.company_name }}</div>
                  <div class="sc-meta">
                    <span v-if="selectedExistingClient.bc_no">BC: {{ selectedExistingClient.bc_no }} ·</span>
                    {{ selectedExistingClient.payment_terms }}
                  </div>
                  <button class="sc-clear" @click="clearExistingClient">✕ Change</button>
                </div>
              </template>

              <!-- ── Prospect search / create ─────────────── -->
              <template v-else>
                <div class="search-wrap">
                  <input
                    v-model="prospectSearch"
                    class="field-input"
                    placeholder="Search prospect companies…"
                    @input="onProspectSearch"
                  />
                  <div v-if="prospectResults.length" class="dropdown">
                    <div
                      v-for="c in prospectResults"
                      :key="c.id"
                      class="dropdown-option"
                      @click="selectProspect(c)"
                    >
                      <div class="do-name">{{ c.company_name }}</div>
                      <div class="do-meta">{{ c.industry }} · {{ c.location }}</div>
                    </div>
                  </div>
                </div>

                <div v-if="selectedProspect" class="selected-card selected-card--green">
                  <div class="sc-name">{{ selectedProspect.company_name }}</div>
                  <div class="sc-meta">{{ selectedProspect.industry }} · {{ selectedProspect.location }}</div>
                  <button class="sc-clear" @click="clearProspect">✕ Change</button>
                </div>

                <div v-if="!selectedProspect" class="create-toggle">
                  <button class="btn-link" @click="showNewProspect = !showNewProspect">
                    {{ showNewProspect ? '▲ Hide' : '▼ Create new prospect company' }}
                  </button>
                </div>

                <div v-if="showNewProspect && !selectedProspect" class="new-prospect-form">
                  <div class="field-grid">
                    <div class="field field--full">
                      <label class="field-label">Company Name <span class="req">*</span></label>
                      <input v-model="newProspect.company_name" class="field-input" placeholder="e.g. MTN Uganda Limited" />
                    </div>
                    <div class="field">
                      <label class="field-label">Contact Person</label>
                      <input v-model="newProspect.contact_person" class="field-input" />
                    </div>
                    <div class="field">
                      <label class="field-label">Phone</label>
                      <input v-model="newProspect.phone" class="field-input" placeholder="0700000000" />
                    </div>
                    <div class="field">
                      <label class="field-label">Email</label>
                      <input v-model="newProspect.email" class="field-input" type="email" />
                    </div>
                    <div class="field">
                      <label class="field-label">Industry</label>
                      <input v-model="newProspect.industry" class="field-input" />
                    </div>
                    <div class="field">
                      <label class="field-label">Location</label>
                      <input v-model="newProspect.location" class="field-input" placeholder="e.g. Kampala" />
                    </div>
                    <div class="field field--full">
                      <label class="field-label">Address</label>
                      <textarea v-model="newProspect.address" class="field-input field-textarea" rows="2" />
                    </div>
                  </div>
                </div>
              </template>

              <div v-if="errors.client_source" class="field-error mt">{{ errors.client_source }}</div>

              <!-- Contacts -->
              <div class="section-label mt">Contacts</div>
              <div v-for="(c, idx) in form.contacts" :key="idx" class="contact-row">
                <div class="field-grid">
                  <div class="field">
                    <label class="field-label">Full Name</label>
                    <input v-model="c.full_name" class="field-input" />
                  </div>
                  <div class="field">
                    <label class="field-label">Position</label>
                    <input v-model="c.position" class="field-input" />
                  </div>
                  <div class="field">
                    <label class="field-label">Phone</label>
                    <input v-model="c.phone" class="field-input" />
                  </div>
                  <div class="field">
                    <label class="field-label">Email</label>
                    <input v-model="c.email" class="field-input" type="email" />
                  </div>
                </div>
                <button class="remove-contact" @click="form.contacts.splice(idx, 1)">✕</button>
              </div>
              <button class="btn-add-contact" @click="form.contacts.push({ full_name: '', position: '', phone: '', email: '' })">
                ＋ Add Contact
              </button>
            </template>

            <!-- ── Step 3: Buy-ins ──────────────────────────────────────── -->
            <template v-if="step === 2">
              <div v-if="buyInsLoading" class="loading-row">Loading catalogue…</div>
              <div v-for="(items, cat) in groupedBuyIns()" :key="cat" class="buy-in-group">
                <div class="buy-in-cat">{{ CATEGORY_LABELS[cat] || cat }}</div>
                <div
                  v-for="bi in items" :key="bi.id"
                  class="buy-in-item"
                  :class="{ 'buy-in-item--selected': isSelected(bi.id) }"
                  @click="toggleBuyIn(bi)"
                >
                  <div class="bi-check">{{ isSelected(bi.id) ? '✓' : '' }}</div>
                  <div class="bi-info">
                    <div class="bi-name">{{ bi.name }}</div>
                    <div class="bi-unit">{{ bi.unit }} · Base: UGX {{ Number(bi.base_price || 0).toLocaleString() }}</div>
                  </div>
                </div>
              </div>
              <div v-if="form.buy_in_lines.length" class="buy-in-lines">
                <div class="section-label mt">Selected Items</div>
                <div v-for="line in form.buy_in_lines" :key="line.buy_in_id" class="line-row">
                  <div class="line-name">{{ line.name }}</div>
                  <div class="line-fields">
                    <div class="line-field"><label>Qty</label><input v-model.number="line.quantity" class="field-input line-input" type="number" min="1" /></div>
                    <div class="line-field"><label>Unit Price</label><input v-model.number="line.unit_price" class="field-input line-input" type="number" min="0" /></div>
                  </div>
                  <div class="line-sub">UGX {{ ((line.quantity||0)*(line.unit_price||0)).toLocaleString() }}</div>
                  <button class="line-remove" @click="removeBuyIn(line.buy_in_id)">✕</button>
                </div>
                <div class="lines-total">
                  <span>Total</span>
                  <span class="total-val">UGX {{ totalFormatted }}</span>
                </div>
              </div>
            </template>

            <!-- ── Step 4: Review ───────────────────────────────────────── -->
            <template v-if="step === 3">
              <div class="review-section">
                <div class="review-title">{{ form.title }}</div>
                <div v-if="form.description" class="review-desc">{{ form.description }}</div>
              </div>
              <div class="review-grid">
                <div class="review-row">
                  <span class="rk">{{ clientMode === 'existing' ? 'Client (Return)' : 'Prospect Company' }}</span>
                  <span class="rv rv--strong">
                    {{ clientMode === 'existing'
                        ? selectedExistingClient?.company_name
                        : (selectedProspect?.company_name || newProspect.company_name) }}
                  </span>
                </div>
                <div class="review-row" v-if="form.expected_value">
                  <span class="rk">Expected Value</span>
                  <span class="rv rv--mono">UGX {{ Number(form.expected_value).toLocaleString() }}</span>
                </div>
                <div class="review-row" v-if="form.expected_close_date">
                  <span class="rk">Close Date</span>
                  <span class="rv">{{ form.expected_close_date }}</span>
                </div>
                <div class="review-row">
                  <span class="rk">Contacts</span>
                  <span class="rv">{{ form.contacts.length }} contact(s)</span>
                </div>
                <div class="review-row">
                  <span class="rk">Products</span>
                  <span class="rv">{{ form.buy_in_lines.length }} item(s)</span>
                </div>
                <div class="review-row" v-if="form.buy_in_lines.length">
                  <span class="rk">Total</span>
                  <span class="rv rv--mono rv--blue">UGX {{ totalFormatted }}</span>
                </div>
              </div>
            </template>
          </div>

          <!-- Footer -->
          <div class="modal-footer">
            <button v-if="step > 0" class="btn-back" @click="step--">← Back</button>
            <div class="footer-spacer" />
            <button class="btn-cancel" @click="cancel">Cancel</button>
            <button v-if="step < 3" class="btn-next" :disabled="!canProceed" @click="next">Next →</button>
            <button v-else class="btn-submit" :disabled="submitting" @click="submit">
              {{ submitting ? 'Creating…' : 'Create Opportunity' }}
            </button>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useSfaOpportunities }  from '~/composables/useSfaOpportunities'
import { useSfaCompanies }      from '~/composables/useSfaCompanies'
import { useSfaBuyIns }         from '~/composables/useSfaBuyIns'

const props  = defineProps({ modelValue: Boolean })
const emit   = defineEmits(['update:modelValue', 'created'])

const { createOpportunity }                          = useSfaOpportunities()
const { searchClients, searchProspects, createProspect } = useSfaCompanies()
const { buyIns, loading: buyInsLoading, fetchBuyIns, groupedBuyIns, CATEGORY_LABELS } = useSfaBuyIns()

const SOURCES = ['Referral', 'Cold Call', 'Inbound', 'Email Campaign', 'Tender', 'Existing Client', 'Other']

const step     = ref(0)
const stepMeta = [
  { icon: '📋', label: 'Basic information',   short: 'Basics' },
  { icon: '🏢', label: 'Client / Company',    short: 'Client' },
  { icon: '🛒', label: 'Products & services', short: 'Buy-ins' },
  { icon: '✅', label: 'Review & submit',      short: 'Review' },
]

// ── Form ──────────────────────────────────────────────────────────────────────
const form = ref({
  title: '', description: '', source: '',
  expected_value: null, expected_close_date: '',
  contacts: [], buy_in_lines: [],
})
const errors      = ref({})
const submitError = ref('')
const submitting  = ref(false)

// ── Step 2: client / prospect state ──────────────────────────────────────────
const clientMode           = ref('existing')   // 'existing' | 'prospect'
const clientSearch         = ref('')
const clientResults        = ref([])
const selectedExistingClient = ref(null)

const prospectSearch  = ref('')
const prospectResults = ref([])
const selectedProspect = ref(null)
const showNewProspect  = ref(false)
const newProspect      = ref({ company_name: '', contact_person: '', phone: '', email: '', industry: '', location: '', address: '' })

function setClientMode(mode) {
  clientMode.value = mode
  clearExistingClient()
  clearProspect()
}

// Existing client search (clients collection)
let clientSearchTimer = null
async function onClientSearch() {
  clearTimeout(clientSearchTimer)
  if (clientSearch.value.length < 2) { clientResults.value = []; return }
  clientSearchTimer = setTimeout(async () => {
    clientResults.value = await searchClients(clientSearch.value)
  }, 300)
}
function selectExistingClient(c) {
  selectedExistingClient.value = c
  clientSearch.value           = ''
  clientResults.value          = []
}
function clearExistingClient() {
  selectedExistingClient.value = null
  clientSearch.value           = ''
  clientResults.value          = []
}

// Prospect search (sfa-company)
let prospectSearchTimer = null
async function onProspectSearch() {
  clearTimeout(prospectSearchTimer)
  if (prospectSearch.value.length < 2) { prospectResults.value = []; return }
  prospectSearchTimer = setTimeout(async () => {
    prospectResults.value = await searchProspects(prospectSearch.value)
  }, 300)
}
function selectProspect(c) {
  selectedProspect.value = c
  prospectSearch.value   = ''
  prospectResults.value  = []
  showNewProspect.value  = false
}
function clearProspect() {
  selectedProspect.value = null
  prospectSearch.value   = ''
  prospectResults.value  = []
}

// ── Buy-ins ───────────────────────────────────────────────────────────────────
function isSelected(id) { return form.value.buy_in_lines.some(l => l.buy_in_id === id) }
function toggleBuyIn(bi) {
  if (isSelected(bi.id)) {
    form.value.buy_in_lines = form.value.buy_in_lines.filter(l => l.buy_in_id !== bi.id)
  } else {
    form.value.buy_in_lines.push({ buy_in_id: bi.id, name: bi.name, quantity: 1, unit_price: bi.base_price || 0 })
  }
}
function removeBuyIn(id) {
  form.value.buy_in_lines = form.value.buy_in_lines.filter(l => l.buy_in_id !== id)
}
const totalFormatted = computed(() => {
  const t = form.value.buy_in_lines.reduce((s, l) => s + (l.quantity||0)*(l.unit_price||0), 0)
  return t.toLocaleString()
})

// ── Validation ────────────────────────────────────────────────────────────────
const canProceed = computed(() => {
  if (step.value === 0) return !!form.value.title.trim()
  if (step.value === 1) {
    if (clientMode.value === 'existing') return !!selectedExistingClient.value
    return !!(selectedProspect.value || newProspect.value.company_name.trim())
  }
  return true
})

function next() { if (canProceed.value) step.value++ }

// ── Submit ────────────────────────────────────────────────────────────────────
async function submit() {
  submitError.value = ''
  submitting.value  = true
  try {
    let existingClientId = null
    let companyId        = null

    if (clientMode.value === 'existing') {
      existingClientId = selectedExistingClient.value?.documentId
    } else {
      // Use selected prospect or create a new one
      if (selectedProspect.value) {
        companyId = selectedProspect.value.documentId
      } else if (newProspect.value.company_name.trim()) {
        const created = await createProspect(newProspect.value)
        companyId     = created.documentId
      } else {
        submitError.value = 'Please select or create a company.'
        return
      }
    }

    const result = await createOpportunity({
      title:               form.value.title,
      description:         form.value.description,
      source:              form.value.source,
      expected_value:      form.value.expected_value,
      expected_close_date: form.value.expected_close_date,
      existing_client:     existingClientId || null,
      company:             companyId        || null,
      contacts:            form.value.contacts,
      buy_in_lines:        form.value.buy_in_lines.map(l => ({
        buy_in: l.buy_in_id, quantity: l.quantity, unit_price: l.unit_price,
      })),
    })

    emit('created', result)
    emit('update:modelValue', false)
    resetForm()
  } catch (e) {
    submitError.value = e?.data?.error?.message || 'Failed to create opportunity'
  } finally {
    submitting.value = false
  }
}

function cancel() { if (!submitting.value) { emit('update:modelValue', false); resetForm() } }

function resetForm() {
  step.value = 0
  form.value = { title: '', description: '', source: '', expected_value: null, expected_close_date: '', contacts: [], buy_in_lines: [] }
  newProspect.value = { company_name: '', contact_person: '', phone: '', email: '', industry: '', location: '', address: '' }
  clearExistingClient(); clearProspect()
  clientMode.value  = 'existing'
  submitError.value = ''
  errors.value      = {}
}

watch(() => step.value, v => { if (v === 2) fetchBuyIns() })
</script>

<style scoped>
/* ── Backdrop & Modal ──────────────────────────────────────────────────────── */
.modal-backdrop {
  position: fixed; inset: 0; z-index: 8000;
  background: rgba(10,20,40,0.45);
  display: flex; align-items: center; justify-content: center; padding: 20px;
}
.modal {
  background: #FFFFFF; border-radius: 8px;
  width: 100%; max-width: 640px; max-height: 90vh;
  display: flex; flex-direction: column;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
  font-family: 'IBM Plex Sans', sans-serif; overflow: hidden;
}
.modal-header {
  display: flex; align-items: flex-start; gap: 14px;
  padding: 18px 20px; border-bottom: 1px solid #D5DDEF; flex-shrink: 0;
}
.modal-header-icon { font-size: 24px; }
.modal-title { font-size: 16px; font-weight: 700; color: #003366; }
.modal-sub   { font-size: 12px; color: #8094B8; margin-top: 2px; }
.modal-close { margin-left: auto; background: none; border: none; font-size: 16px; color: #8094B8; cursor: pointer; }
.modal-close:hover { color: #C9252D; }

/* Step bar */
.step-bar { display: flex; padding: 10px 20px; border-bottom: 1px solid #D5DDEF; flex-shrink: 0; }
.step-pip { display: flex; align-items: center; gap: 6px; flex: 1; padding-bottom: 6px; border-bottom: 2px solid #D5DDEF; }
.step-pip--active { border-bottom-color: #0F62FE; }
.step-pip--done   { border-bottom-color: #24A148; }
.pip-num {
  width: 20px; height: 20px; border-radius: 50%;
  background: #EEF2F8; color: #8094B8;
  font-size: 10px; font-weight: 700; display: flex; align-items: center; justify-content: center;
}
.step-pip--active .pip-num { background: #0F62FE; color: #fff; }
.step-pip--done   .pip-num { background: #24A148; color: #fff; }
.pip-label { font-size: 10px; color: #8094B8; }
.step-pip--active .pip-label { color: #0F62FE; font-weight: 600; }

/* Body */
.modal-body { flex: 1; overflow-y: auto; padding: 20px; }

.error-banner {
  background: #FFF0F0; color: #C9252D; border: 1px solid #C9252D33;
  border-radius: 4px; padding: 8px 12px; font-size: 12px; margin-bottom: 14px;
}

/* Fields */
.field-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.field--full { grid-column: 1 / -1; }
.field { display: flex; flex-direction: column; gap: 4px; }
.field-label { font-size: 11px; font-weight: 600; color: #3B4F70; }
.req { color: #C9252D; }
.field-input {
  padding: 7px 10px; border: 1.5px solid #D1D9E0; border-radius: 2px;
  font-size: 13px; color: #0D1830; background: #FFFFFF; font-family: 'IBM Plex Sans', sans-serif;
}
.field-input:focus { outline: none; border-color: #0066CC; box-shadow: 0 0 0 2px #0066CC22; }
.field-input--error { border-color: #C9252D; }
.field-textarea { resize: vertical; min-height: 60px; }
.field-error { font-size: 10px; color: #C9252D; }

/* Section label */
.section-label {
  font-size: 10px; font-weight: 700; letter-spacing: 1.2px; text-transform: uppercase;
  color: #8094B8; margin-bottom: 10px; margin-top: 4px; font-family: 'IBM Plex Mono', monospace;
}
.section-label.mt { margin-top: 20px; }

/* Source toggle (step 2) */
.source-toggle {
  display: flex; gap: 8px; margin-bottom: 10px;
}
.source-btn {
  flex: 1; padding: 8px; border-radius: 6px; font-size: 12px; font-weight: 600;
  border: 1.5px solid #D5DDEF; background: #F7F9FC; color: #3B4F70; cursor: pointer; font-family: inherit;
  transition: all 0.12s;
}
.source-btn--active { background: #003366; color: #fff; border-color: #003366; }
.mode-hint { font-size: 11px; color: #8094B8; margin-bottom: 12px; }

/* Search & dropdown */
.search-wrap { position: relative; margin-bottom: 10px; }
.dropdown {
  position: absolute; top: 100%; left: 0; right: 0; z-index: 100;
  background: #fff; border: 1.5px solid #D5DDEF; border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1); max-height: 200px; overflow-y: auto;
}
.dropdown-option {
  padding: 9px 12px; cursor: pointer; border-bottom: 1px solid #EEF2F8;
}
.dropdown-option:hover { background: #F0F4FA; }
.do-name { font-size: 12px; font-weight: 600; color: #0D1830; }
.do-meta { font-size: 10px; color: #8094B8; margin-top: 2px; }
.bc-pill {
  background: #E8F0FB; color: #003366; border-radius: 2px;
  padding: 1px 5px; font-size: 9px; font-weight: 700; font-family: 'IBM Plex Mono', monospace;
  margin-right: 4px;
}

/* Selected card */
.selected-card {
  border-radius: 4px; padding: 10px 12px;
  display: flex; align-items: center; gap: 10px; margin-bottom: 10px;
}
.selected-card--blue  { background: #E8F0FB; border: 1.5px solid #0066CC44; }
.selected-card--green { background: #EDFAF2; border: 1.5px solid #24A14844; }
.sc-name { font-size: 13px; font-weight: 600; color: #003366; flex: 1; }
.sc-meta { font-size: 11px; color: #8094B8; }
.sc-clear { background: none; border: none; color: #C9252D; font-size: 11px; cursor: pointer; white-space: nowrap; }

.create-toggle { margin-bottom: 10px; }
.btn-link { background: none; border: none; color: #0066CC; font-size: 12px; cursor: pointer; padding: 0; font-family: inherit; }
.btn-link:hover { text-decoration: underline; }

.new-prospect-form {
  border: 1.5px dashed #D5DDEF; border-radius: 4px; padding: 12px; margin-bottom: 12px;
}
.field-error.mt { margin-top: 6px; }

/* Contacts */
.contact-row {
  border: 1.5px solid #D5DDEF; border-radius: 4px; padding: 10px; margin-bottom: 8px; position: relative;
}
.remove-contact { position: absolute; top: 8px; right: 8px; background: none; border: none; color: #C9252D; cursor: pointer; font-size: 12px; }
.btn-add-contact {
  background: none; border: 1.5px dashed #D5DDEF; border-radius: 4px;
  width: 100%; padding: 8px; color: #0066CC; font-size: 12px; font-weight: 600;
  cursor: pointer; margin-top: 4px; font-family: inherit;
}
.btn-add-contact:hover { background: #F0F4FA; }

/* Buy-ins */
.buy-in-group { margin-bottom: 14px; }
.buy-in-cat { font-size: 10px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: #8094B8; margin-bottom: 6px; font-family: 'IBM Plex Mono', monospace; }
.buy-in-item {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 10px; border: 1.5px solid #D5DDEF; border-radius: 4px; margin-bottom: 4px; cursor: pointer; transition: all 0.12s;
}
.buy-in-item:hover      { border-color: #0066CC44; background: #F0F4FA; }
.buy-in-item--selected  { border-color: #0F62FE; background: #EBF0FF; }
.bi-check { width: 18px; height: 18px; border-radius: 3px; border: 1.5px solid #D5DDEF; display: flex; align-items: center; justify-content: center; font-size: 11px; color: #0F62FE; font-weight: 700; flex-shrink: 0; }
.buy-in-item--selected .bi-check { background: #0F62FE; color: #fff; border-color: #0F62FE; }
.bi-name { font-size: 12px; font-weight: 600; color: #0D1830; }
.bi-unit { font-size: 10px; color: #8094B8; }
.loading-row { padding: 20px; text-align: center; color: #8094B8; font-size: 12px; }

/* Line items */
.buy-in-lines { border-top: 1px solid #EEF2F8; padding-top: 14px; margin-top: 4px; }
.line-row { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid #EEF2F8; }
.line-name  { flex: 1; font-size: 12px; font-weight: 600; color: #0D1830; }
.line-fields { display: flex; gap: 8px; }
.line-field  { display: flex; flex-direction: column; gap: 2px; }
.line-field label { font-size: 9px; color: #8094B8; font-weight: 600; }
.line-input  { width: 90px; padding: 4px 6px; font-size: 12px; }
.line-sub    { font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: #003366; font-weight: 700; white-space: nowrap; }
.line-remove { background: none; border: none; color: #C9252D; cursor: pointer; font-size: 12px; }
.lines-total { display: flex; justify-content: space-between; align-items: center; padding: 10px 0 0; font-size: 13px; font-weight: 700; color: #003366; }
.total-val   { font-family: 'IBM Plex Mono', monospace; }

/* Review */
.review-section { margin-bottom: 16px; }
.review-title   { font-size: 16px; font-weight: 700; color: #003366; }
.review-desc    { font-size: 12px; color: #3B4F70; margin-top: 4px; }
.review-grid    { display: flex; flex-direction: column; }
.review-row     { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #EEF2F8; font-size: 12px; }
.rk     { color: #8094B8; font-weight: 600; }
.rv     { color: #0D1830; font-weight: 500; text-align: right; }
.rv--strong { font-weight: 700; color: #003366; }
.rv--mono   { font-family: 'IBM Plex Mono', monospace; }
.rv--blue   { color: #003366; }

/* Footer */
.modal-footer { display: flex; align-items: center; gap: 8px; padding: 14px 20px; border-top: 1px solid #D5DDEF; flex-shrink: 0; }
.footer-spacer { flex: 1; }
.btn-back, .btn-cancel {
  padding: 7px 16px; border-radius: 4px; font-size: 12px; font-weight: 600;
  cursor: pointer; font-family: inherit; background: none; border: 1.5px solid #D1D9E0; color: #3B4F70;
}
.btn-back:hover, .btn-cancel:hover { border-color: #8094B8; color: #0D1830; }
.btn-next, .btn-submit {
  padding: 7px 20px; border-radius: 4px; font-size: 12px; font-weight: 600;
  cursor: pointer; font-family: inherit; border: none; background: #0F62FE; color: #fff;
}
.btn-next:hover, .btn-submit:hover { background: #0353E9; }
.btn-next:disabled, .btn-submit:disabled { background: #8094B8; cursor: not-allowed; }
.btn-submit { background: #003366; }
.btn-submit:hover { background: #002244; }

.modal-enter-active, .modal-leave-active { transition: all 0.2s ease; }
.modal-enter-from, .modal-leave-to       { opacity: 0; transform: scale(0.97); }
</style>
