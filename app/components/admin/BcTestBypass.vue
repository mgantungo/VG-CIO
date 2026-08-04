<!-- components/admin/BcTestBypass.vue -->
<template>
  <div class="btb-sheet">
    <!-- Ribbon / title bar -->
    <div class="btb-titlebar">
      <div class="btb-title">
        <span class="btb-icon">⊞</span>
        BC Test Bypass — Advert Field Editor
      </div>
      <span class="btb-badge">TEST ONLY</span>
    </div>

    <!-- Toolbar row: lookup -->
    <div class="btb-toolbar">
      <label class="btb-toolbar-label">bc_reference_number</label>
      <input
        v-model.trim="bcRef"
        class="btb-input mono"
        placeholder="B-SO-235467N"
        @keyup.enter="doLookup"
      />
      <button class="btb-btn" :disabled="!bcRef || loading" @click="doLookup">
        {{ loading && activeAction === 'lookup' ? 'Looking up…' : 'Lookup' }}
      </button>
      <button class="btb-btn ghost" :disabled="!advert" @click="resetForm">Clear</button>
    </div>

    <!-- Status bar -->
    <div v-if="statusMessage" class="btb-status" :class="statusType">
      <span class="btb-status-dot"></span>
      {{ statusMessage }}
    </div>

    <!-- Spreadsheet grid -->
    <div v-if="advert" class="btb-grid-wrap">
      <table class="btb-grid">
        <thead>
          <tr>
            <th class="col-field">Field</th>
            <th class="col-current">Current Value</th>
            <th class="col-new">New Value</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="cell-field">reference_number</td>
            <td class="cell-current mono">{{ advert.reference_number }}</td>
            <td class="cell-new muted">— read only —</td>
          </tr>
          <tr>
            <td class="cell-field">advert_title</td>
            <td class="cell-current" colspan="2">{{ advert.advert_title || '—' }}</td>
          </tr>
          <tr>
            <td class="cell-field">status</td>
            <td class="cell-current mono">{{ advert.status }}</td>
            <td class="cell-new muted">— read only —</td>
          </tr>

          <tr class="row-divider"><td colspan="3"></td></tr>

          <tr>
            <td class="cell-field">isPaid</td>
            <td class="cell-current"><span class="bool-pill" :class="advert.isPaid ? 'on' : 'off'">{{ advert.isPaid }}</span></td>
            <td class="cell-new">
              <select v-model="form.isPaid" class="btb-select">
                <option :value="true">true</option>
                <option :value="false">false</option>
              </select>
            </td>
          </tr>
          <tr>
            <td class="cell-field">isActive</td>
            <td class="cell-current"><span class="bool-pill" :class="advert.isActive ? 'on' : 'off'">{{ advert.isActive }}</span></td>
            <td class="cell-new">
              <select v-model="form.isActive" class="btb-select">
                <option :value="true">true</option>
                <option :value="false">false</option>
              </select>
            </td>
          </tr>
          <tr>
            <td class="cell-field">isScheduled</td>
            <td class="cell-current"><span class="bool-pill" :class="advert.isScheduled ? 'on' : 'off'">{{ advert.isScheduled }}</span></td>
            <td class="cell-new muted">derived — recomputed automatically</td>
          </tr>
          <tr>
            <td class="cell-field">isCanceled</td>
            <td class="cell-current"><span class="bool-pill" :class="advert.isCanceled ? 'on' : 'off'">{{ advert.isCanceled }}</span></td>
            <td class="cell-new muted">— read only —</td>
          </tr>

          <tr class="row-divider"><td colspan="3"></td></tr>

          <tr>
            <td class="cell-field">start_date</td>
            <td class="cell-current mono">{{ advert.start_date || '—' }}</td>
            <td class="cell-new"><input type="date" v-model="form.start_date" class="btb-input mono" /></td>
          </tr>
          <tr>
            <td class="cell-field">end_date</td>
            <td class="cell-current mono">{{ advert.end_date || '—' }}</td>
            <td class="cell-new"><input type="date" v-model="form.end_date" class="btb-input mono" /></td>
          </tr>
          <tr>
            <td class="cell-field">publishing_dates</td>
            <td class="cell-current">
              <div class="date-pills">
                <span v-for="d in advert.publishing_dates || []" :key="d" class="date-pill mono">{{ d }}</span>
                <span v-if="!(advert.publishing_dates || []).length" class="muted">—</span>
              </div>
            </td>
            <td class="cell-new">
              <div class="date-pills editable">
                <span v-for="(d, i) in form.publishing_dates" :key="d + i" class="date-pill mono editable">
                  {{ d }}
                  <span class="date-pill-x" @click="removeDate(i)">&times;</span>
                </span>
                <input
                  type="date"
                  class="btb-input mono add-date-input"
                  v-model="newDateDraft"
                  @change="addDate"
                />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Apply bar -->
    <div v-if="advert" class="btb-applybar">
      <div class="btb-changed-hint">
        {{ changedFieldsLabel }}
      </div>
      <button class="btb-btn primary" :disabled="loading || !hasChanges" @click="applyChanges">
        {{ loading && activeAction === 'apply' ? 'Applying…' : 'Apply Changes' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useBcTestBypass } from '~/composables/useBcTestBypass'

const { loading, lookupByBcReference, markPaidForTesting } = useBcTestBypass()

const bcRef = ref('')
const advert = ref(null)
const activeAction = ref(null) // 'lookup' | 'apply'

const statusMessage = ref('')
const statusType = ref('info') // 'info' | 'success' | 'error'

const newDateDraft = ref('')

const form = reactive({
  isPaid: true,
  isActive: true,
  start_date: '',
  end_date: '',
  publishing_dates: [],
})

function resetForm() {
  advert.value = null
  bcRef.value = ''
  statusMessage.value = ''
  form.isPaid = true
  form.isActive = true
  form.start_date = ''
  form.end_date = ''
  form.publishing_dates = []
}

function hydrateForm(a) {
  form.isPaid = !!a.isPaid
  form.isActive = !!a.isActive
  form.start_date = a.start_date || ''
  form.end_date = a.end_date || ''
  form.publishing_dates = Array.isArray(a.publishing_dates) ? [...a.publishing_dates].sort() : []
}

async function doLookup() {
  if (!bcRef.value) return
  activeAction.value = 'lookup'
  statusMessage.value = ''
  try {
    const res = await lookupByBcReference(bcRef.value)
    advert.value = res.advert
    hydrateForm(res.advert)
    statusType.value = 'info'
    statusMessage.value = `Loaded ${res.advert.reference_number} — edit fields below, then Apply Changes.`
  } catch (e) {
    advert.value = null
    statusType.value = 'error'
    statusMessage.value = e?.data?.message || 'Lookup failed — check bc_reference_number and that ALLOW_BC_TEST_BYPASS=true.'
  } finally {
    activeAction.value = null
  }
}

function addDate() {
  if (!newDateDraft.value) return
  if (!form.publishing_dates.includes(newDateDraft.value)) {
    form.publishing_dates = [...form.publishing_dates, newDateDraft.value].sort()
  }
  newDateDraft.value = ''
}

function removeDate(index) {
  form.publishing_dates = form.publishing_dates.filter((_, i) => i !== index)
}

const hasChanges = computed(() => {
  if (!advert.value) return false
  const a = advert.value
  if (form.isPaid !== !!a.isPaid) return true
  if (form.isActive !== !!a.isActive) return true
  if (form.start_date !== (a.start_date || '')) return true
  if (form.end_date !== (a.end_date || '')) return true
  const currentDates = Array.isArray(a.publishing_dates) ? [...a.publishing_dates].sort() : []
  if (JSON.stringify(currentDates) !== JSON.stringify(form.publishing_dates)) return true
  return false
})

const changedFieldsLabel = computed(() => {
  if (!hasChanges.value) return 'No changes yet.'
  const a = advert.value
  const changed = []
  if (form.isPaid !== !!a.isPaid) changed.push('isPaid')
  if (form.isActive !== !!a.isActive) changed.push('isActive')
  if (form.start_date !== (a.start_date || '')) changed.push('start_date')
  if (form.end_date !== (a.end_date || '')) changed.push('end_date')
  const currentDates = Array.isArray(a.publishing_dates) ? [...a.publishing_dates].sort() : []
  if (JSON.stringify(currentDates) !== JSON.stringify(form.publishing_dates)) changed.push('publishing_dates')
  return `Will update: ${changed.join(', ')}`
})

async function applyChanges() {
  if (!advert.value || !hasChanges.value) return
  activeAction.value = 'apply'
  statusMessage.value = ''
  try {
    const payload = {
      bc_reference_number: advert.value.bc_reference_number,
      isPaid: form.isPaid,
      isActive: form.isActive,
      start_date: form.start_date,
      end_date: form.end_date || null,
      publishing_dates: form.publishing_dates,
    }
    const res = await markPaidForTesting(payload)
    advert.value = res.advert
    hydrateForm(res.advert)
    statusType.value = 'success'
    statusMessage.value = res.message || 'Applied.'
  } catch (e) {
    statusType.value = 'error'
    statusMessage.value = e?.data?.message || 'Apply failed — see console for details.'
  } finally {
    activeAction.value = null
  }
}
</script>

<style scoped>
.btb-sheet {
  font-family: 'IBM Plex Sans', sans-serif;
  background: #F0F4F8;
  border: 1.5px solid #D1D9E0;
  border-radius: 2px;
  color: #1B2733;
  max-width: 920px;
}
.mono { font-family: 'IBM Plex Mono', monospace; }
.muted { color: #8A97A3; font-size: 12px; }

/* Titlebar */
.btb-titlebar {
  background: #003366;
  color: #fff;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: 2px 2px 0 0;
}
.btb-title { font-weight: 600; font-size: 14.5px; display: flex; align-items: center; gap: 8px; }
.btb-icon { font-size: 16px; opacity: .85; }
.btb-badge {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 10px; letter-spacing: .08em; font-weight: 700;
  background: #C0392B; color: #fff;
  padding: 3px 8px; border-radius: 2px;
}

/* Toolbar */
.btb-toolbar {
  display: flex; align-items: center; gap: 10px;
  padding: 12px 16px;
  background: #E4EAF0;
  border-bottom: 1.5px solid #D1D9E0;
  flex-wrap: wrap;
}
.btb-toolbar-label {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 11.5px; color: #445566; white-space: nowrap;
}

/* Inputs & buttons */
.btb-input, .btb-select {
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 13px;
  padding: 6px 9px;
  border: 1.5px solid #D1D9E0;
  border-radius: 2px;
  background: #fff;
  color: #1B2733;
  outline: none;
}
.btb-input:focus, .btb-select:focus {
  border-color: #0066CC;
  box-shadow: 0 0 0 2px rgba(0,102,204,0.18);
}
.btb-toolbar .btb-input { min-width: 220px; }

.btb-btn {
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 12.5px; font-weight: 600;
  padding: 7px 14px;
  border: 1.5px solid #003366;
  background: #fff;
  color: #003366;
  border-radius: 2px;
  cursor: pointer;
}
.btb-btn:hover:not(:disabled) { background: #E4EAF0; }
.btb-btn:disabled { opacity: .45; cursor: not-allowed; }
.btb-btn.primary { background: #003366; color: #fff; }
.btb-btn.primary:hover:not(:disabled) { background: #002347; }
.btb-btn.ghost { border-color: #D1D9E0; color: #556; background: transparent; }

/* Status bar */
.btb-status {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 16px;
  font-size: 12.5px;
  border-bottom: 1.5px solid #D1D9E0;
}
.btb-status-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
.btb-status.info    { background: #EAF1FB; color: #0B3C7A; }
.btb-status.info .btb-status-dot    { background: #0066CC; }
.btb-status.success { background: #E9F7EF; color: #1E6B3E; }
.btb-status.success .btb-status-dot { background: #2E8B4F; }
.btb-status.error   { background: #FBEAEA; color: #A02E2E; }
.btb-status.error .btb-status-dot   { background: #C0392B; }

/* Grid */
.btb-grid-wrap { overflow-x: auto; }
.btb-grid {
  width: 100%;
  border-collapse: collapse;
  background: #fff;
}
.btb-grid thead th {
  background: #003366;
  color: #fff;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 10.5px;
  letter-spacing: .05em;
  text-transform: uppercase;
  text-align: left;
  padding: 8px 12px;
  position: sticky; top: 0;
}
.col-field { width: 22%; }
.col-current { width: 39%; }
.col-new { width: 39%; }

.btb-grid td {
  padding: 8px 12px;
  border-bottom: 1px solid #E4EAF0;
  border-right: 1px solid #EEF2F5;
  font-size: 12.5px;
  vertical-align: middle;
}
.btb-grid tr:nth-child(even) td { background: #FAFBFC; }
.btb-grid tr:hover td { background: #EEF4FB; }

.cell-field {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 11.5px;
  color: #445566;
  font-weight: 600;
  background: #F5F7F9 !important;
}
.row-divider td { padding: 0; border: none; height: 4px; background: #E4EAF0 !important; }

.bool-pill {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 11px; font-weight: 700;
  padding: 2px 8px; border-radius: 2px;
}
.bool-pill.on  { background: #E9F7EF; color: #1E6B3E; }
.bool-pill.off { background: #FBEAEA; color: #A02E2E; }

/* Publishing-date pills */
.date-pills { display: flex; flex-wrap: wrap; gap: 5px; align-items: center; }
.date-pill {
  font-size: 11px;
  padding: 2px 7px;
  border: 1px solid #D1D9E0;
  border-radius: 2px;
  background: #F5F7F9;
  color: #1B2733;
  display: inline-flex; align-items: center; gap: 5px;
}
.date-pill.editable { background: #EAF1FB; border-color: #0066CC; color: #0B3C7A; }
.date-pill-x { cursor: pointer; font-weight: 700; color: #A02E2E; }
.add-date-input { width: 140px; padding: 4px 7px; font-size: 11.5px; }

/* Apply bar */
.btb-applybar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px;
  background: #E4EAF0;
  border-top: 1.5px solid #D1D9E0;
  border-radius: 0 0 2px 2px;
}
.btb-changed-hint {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 11.5px;
  color: #445566;
}
</style>