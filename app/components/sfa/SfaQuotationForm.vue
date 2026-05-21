<!-- components/sfa/SfaQuotationForm.vue -->
<!-- Create a new quotation or revise an existing one.
     Line items reference sfa-buy-ins from the catalogue.
     All API via useSfaQuotations + useSfaBuyIns composables only. -->
<template>
  <div class="quot-form">

    <div class="qf-header">
      <span class="qf-title">{{ revisionOf ? 'Revise Quotation' : 'New Quotation' }}</span>
      <button class="qf-close" @click="$emit('cancel')">✕</button>
    </div>

    <div v-if="submitError" class="error-banner">⚠ {{ submitError }}</div>

    <!-- Notes -->
    <div class="field">
      <label class="field-label">Notes / Cover Message</label>
      <textarea v-model="form.notes" class="field-input" rows="2"
        placeholder="Any additional notes for this quotation…" />
    </div>

    <!-- Line items -->
    <div class="section-label mt">Line Items</div>

    <div class="line-table">
      <!-- Header -->
      <div class="lt-head">
        <span class="lt-col lt-col--desc">Description / Product</span>
        <span class="lt-col lt-col--qty">Qty</span>
        <span class="lt-col lt-col--price">Unit Price (UGX)</span>
        <span class="lt-col lt-col--sub">Subtotal</span>
        <span class="lt-col lt-col--rm"></span>
      </div>

      <!-- Existing lines -->
      <div v-for="(line, idx) in form.items" :key="idx" class="lt-row">

        <!-- Description / buy-in picker -->
        <div class="lt-col lt-col--desc">
          <div v-if="line.buy_in" class="line-selected-bi">
            <span class="lbi-name">{{ line.buy_in_name }}</span>
            <button class="lbi-clear" @click="clearBuyIn(idx)">✕</button>
          </div>
          <div v-else class="bi-picker">
            <input
              v-model="line.searchTerm"
              class="field-input bi-search"
              placeholder="Search catalogue…"
              @input="onLineSearch(idx)"
            />
            <div v-if="line.searchResults?.length" class="bi-dropdown">
              <div
                v-for="bi in line.searchResults"
                :key="bi.id"
                class="bi-option"
                @click="pickBuyIn(idx, bi)"
              >
                <span class="bio-name">{{ bi.name }}</span>
                <span class="bio-price">UGX {{ Number(bi.base_price || 0).toLocaleString() }}</span>
              </div>
            </div>
          </div>
          <!-- Custom description override -->
          <input
            v-if="line.buy_in"
            v-model="line.description"
            class="field-input line-desc-input"
            placeholder="Custom description (optional)"
          />
        </div>

        <div class="lt-col lt-col--qty">
          <input v-model.number="line.quantity" class="field-input" type="number" min="1"
            @input="recalcLine(idx)" />
        </div>

        <div class="lt-col lt-col--price">
          <input v-model.number="line.unit_price" class="field-input" type="number" min="0"
            @input="recalcLine(idx)" />
        </div>

        <div class="lt-col lt-col--sub mono">
          {{ Number((line.quantity || 0) * (line.unit_price || 0)).toLocaleString() }}
        </div>

        <div class="lt-col lt-col--rm">
          <button class="rm-btn" @click="removeLine(idx)">✕</button>
        </div>
      </div>

      <!-- Add line -->
      <div class="lt-foot">
        <button class="btn-add-line" @click="addLine">＋ Add Line Item</button>
        <div class="total-row">
          <span class="total-label">Total</span>
          <span class="total-val">UGX {{ totalFormatted }}</span>
        </div>
      </div>
    </div>

    <!-- Footer actions -->
    <div class="qf-footer">
      <button class="btn-cancel" @click="$emit('cancel')">Cancel</button>
      <button
        class="btn-save"
        :disabled="submitting || !form.items.length"
        @click="save"
      >
        {{ submitting ? 'Saving…' : (revisionOf ? 'Save Revision' : 'Save Quotation') }}
      </button>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useSfaQuotations } from '~/composables/useSfaQuotations'
import { useSfaBuyIns }     from '~/composables/useSfaBuyIns'

const props = defineProps({
  opportunityId: { type: [Number, String], required: true },
  /** When set, the form creates a new version of this quotation */
  revisionOf:    { type: Object, default: null },
})
const emit = defineEmits(['saved', 'cancel'])

const { createQuotation, reviseQuotation } = useSfaQuotations()
const { buyIns, fetchBuyIns }              = useSfaBuyIns()

const form = ref({
  notes: props.revisionOf?.notes || '',
  items: [],
})

const submitting  = ref(false)
const submitError = ref('')

// ── Seed lines from revision source ───────────────────────────────────────────
function seedLines() {
  if (!props.revisionOf?.items?.length) { addLine(); return }
  form.value.items = props.revisionOf.items.map(i => ({
    buy_in:        i.buy_in?.id   || null,
    buy_in_name:   i.buy_in?.name || '',
    description:   i.description  || '',
    quantity:      i.quantity      || 1,
    unit_price:    i.unit_price    || 0,
    searchTerm:    '',
    searchResults: [],
  }))
}

function addLine() {
  form.value.items.push({
    buy_in:        null,
    buy_in_name:   '',
    description:   '',
    quantity:      1,
    unit_price:    0,
    searchTerm:    '',
    searchResults: [],
  })
}

function removeLine(idx)     { form.value.items.splice(idx, 1) }
function recalcLine(_idx)    { /* reactivity handles computed */ }

// ── Buy-in search within a line ───────────────────────────────────────────────
let searchTimers = {}
function onLineSearch(idx) {
  const line = form.value.items[idx]
  clearTimeout(searchTimers[idx])
  if (!line.searchTerm || line.searchTerm.length < 2) {
    line.searchResults = []
    return
  }
  searchTimers[idx] = setTimeout(() => {
    const q     = line.searchTerm.toLowerCase()
    line.searchResults = buyIns.value.filter(bi =>
      bi.name.toLowerCase().includes(q) ||
      (bi.category || '').toLowerCase().includes(q)
    ).slice(0, 8)
  }, 200)
}

function pickBuyIn(idx, bi) {
  const line = form.value.items[idx]
  line.buy_in        = bi.id
  line.buy_in_name   = bi.name
  line.unit_price    = bi.base_price || 0
  line.description   = ''
  line.searchTerm    = ''
  line.searchResults = []
}

function clearBuyIn(idx) {
  const line = form.value.items[idx]
  line.buy_in        = null
  line.buy_in_name   = ''
  line.searchTerm    = ''
  line.searchResults = []
}

// ── Total ─────────────────────────────────────────────────────────────────────
const total = computed(() =>
  form.value.items.reduce((s, l) => s + (l.quantity || 0) * (l.unit_price || 0), 0)
)
const totalFormatted = computed(() => total.value.toLocaleString())

// ── Save ──────────────────────────────────────────────────────────────────────
async function save() {
  if (!form.value.items.length) return
  submitting.value  = true
  submitError.value = ''
  try {
    const items = form.value.items.map(l => ({
      buy_in:      l.buy_in,
      description: l.description || l.buy_in_name,
      quantity:    l.quantity,
      unit_price:  l.unit_price,
      subtotal:    (l.quantity || 0) * (l.unit_price || 0),
      notes:       '',
    }))

    if (props.revisionOf) {
      await reviseQuotation(props.revisionOf.id, {
        items,
        total_amount: total.value,
        notes:        form.value.notes,
      })
    } else {
      await createQuotation({
        opportunity:  props.opportunityId,
        items,
        total_amount: total.value,
        notes:        form.value.notes,
      })
    }
    emit('saved')
  } catch (e) {
    submitError.value = e?.data?.error?.message || 'Failed to save quotation'
  } finally {
    submitting.value = false
  }
}

onMounted(() => { fetchBuyIns(); seedLines() })
</script>

<style scoped>
.quot-form {
  border: 1.5px solid #D5DDEF; border-radius: 6px;
  background: #FFFFFF; padding: 16px;
  margin-top: 12px; font-family: 'IBM Plex Sans', sans-serif;
}

.qf-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 14px;
}
.qf-title { font-size: 13px; font-weight: 700; color: #003366; }
.qf-close {
  background: none; border: none; color: #8094B8; cursor: pointer; font-size: 14px;
}
.qf-close:hover { color: #C9252D; }

.error-banner {
  background: #FFF0F0; color: #C9252D;
  border: 1px solid #C9252D33; border-radius: 4px;
  padding: 8px 12px; font-size: 12px; margin-bottom: 12px;
}

/* Fields */
.field  { display: flex; flex-direction: column; gap: 4px; }
.field-label { font-size: 11px; font-weight: 600; color: #3B4F70; }
.field-input {
  padding: 6px 10px; border: 1.5px solid #D1D9E0; border-radius: 2px;
  font-size: 12px; color: #0D1830; font-family: 'IBM Plex Sans', sans-serif;
  background: #FFFFFF;
}
.field-input:focus { outline: none; border-color: #0066CC; box-shadow: 0 0 0 2px #0066CC22; }

.section-label {
  font-size: 10px; font-weight: 700; letter-spacing: 1.2px;
  text-transform: uppercase; color: #8094B8;
  margin-bottom: 8px; font-family: 'IBM Plex Mono', monospace;
}
.section-label.mt { margin-top: 16px; }

/* Line table */
.line-table {
  border: 1.5px solid #D5DDEF; border-radius: 4px; overflow: visible;
}

.lt-head {
  display: grid;
  grid-template-columns: 3fr 80px 140px 120px 30px;
  padding: 7px 10px; background: #F7F9FC;
  border-bottom: 1px solid #D5DDEF; gap: 8px;
}
.lt-head .lt-col {
  font-size: 10px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.5px; color: #8094B8;
}

.lt-row {
  display: grid;
  grid-template-columns: 3fr 80px 140px 120px 30px;
  padding: 8px 10px; border-bottom: 1px solid #EEF2F8;
  gap: 8px; align-items: start; position: relative; overflow: visible;
}
.lt-row:last-of-type { border-bottom: none; }

.lt-col       { display: flex; flex-direction: column; gap: 4px; }
.lt-col--desc { position: relative; }
.lt-col--qty  { }
.lt-col--price { }
.lt-col--sub  { padding-top: 8px; font-size: 12px; color: #003366; }
.lt-col--rm   { padding-top: 6px; }

.mono { font-family: 'IBM Plex Mono', monospace; font-weight: 600; }

/* Buy-in picker */
.bi-picker { position: relative; }
.bi-search  { width: 100%; box-sizing: border-box; }
.bi-dropdown {
  position: absolute; top: 100%; left: 0; right: 0; z-index: 200;
  background: #FFFFFF; border: 1.5px solid #D5DDEF;
  border-radius: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  max-height: 200px; overflow-y: auto;
}
.bi-option {
  display: flex; justify-content: space-between; align-items: center;
  padding: 8px 10px; cursor: pointer; font-size: 12px;
  border-bottom: 1px solid #EEF2F8;
}
.bi-option:hover { background: #F0F4FA; }
.bio-name  { color: #0D1830; font-weight: 500; }
.bio-price { font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: #8094B8; }

.line-selected-bi {
  display: flex; align-items: center; justify-content: space-between;
  background: #EBF0FF; border: 1.5px solid #0F62FE33;
  border-radius: 3px; padding: 4px 8px;
}
.lbi-name  { font-size: 12px; font-weight: 600; color: #003366; }
.lbi-clear { background: none; border: none; color: #8094B8; cursor: pointer; font-size: 11px; }

.line-desc-input { margin-top: 4px; font-size: 11px; }

.rm-btn {
  background: none; border: none; color: #C9252D; cursor: pointer;
  font-size: 13px; padding: 2px;
}

/* Footer row inside table */
.lt-foot {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 10px; border-top: 1px solid #D5DDEF; background: #F7F9FC;
}
.btn-add-line {
  background: none; border: none; color: #0066CC; font-size: 12px; font-weight: 600;
  cursor: pointer; font-family: inherit; padding: 4px 0;
}
.btn-add-line:hover { text-decoration: underline; }

.total-row    { display: flex; align-items: center; gap: 16px; }
.total-label  { font-size: 12px; font-weight: 700; color: #3B4F70; }
.total-val    {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 15px; font-weight: 700; color: #003366;
}

/* Form footer */
.qf-footer {
  display: flex; justify-content: flex-end; gap: 8px; margin-top: 14px;
}
.btn-cancel {
  padding: 7px 16px; border-radius: 4px; font-size: 12px; font-weight: 600;
  background: none; border: 1.5px solid #D1D9E0; color: #3B4F70; cursor: pointer; font-family: inherit;
}
.btn-cancel:hover { border-color: #8094B8; }
.btn-save {
  padding: 7px 20px; border-radius: 4px; font-size: 12px; font-weight: 600;
  background: #003366; color: #fff; border: none; cursor: pointer; font-family: inherit;
}
.btn-save:hover    { background: #002244; }
.btn-save:disabled { background: #8094B8; cursor: not-allowed; }
</style>
