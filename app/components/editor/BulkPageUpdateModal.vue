<!-- components/editor/BulkPageUpdateModal.vue -->
<template>
  <Teleport to="body">
    <div v-if="show" class="bpu-overlay" @click.self="$emit('close')">
      <div class="bpu-modal">

        <div class="bpu-header">
          <div class="bpu-header__left">
            <span class="bpu-header__label">Bulk Edit</span>
            <span class="bpu-count">{{ schedules.length }} schedule{{ schedules.length !== 1 ? 's' : '' }}</span>
          </div>
          <button class="bpu-close" @click="$emit('close')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <!-- Apply-to-all strip -->
        <div class="bpu-strip">
          <span class="bpu-strip__label">Apply to all:</span>
          <div class="bpu-apply-group">
            <span class="bpu-apply-lbl">Date</span>
            <div class="bpu-apply-row">
              <input type="date" class="bpu-inp bpu-inp--date" v-model="applyDate" />
              <button class="bpu-apply-btn" @click="applyDateAll" :disabled="!applyDate">Apply</button>
            </div>
          </div>
          <div class="bpu-apply-group">
            <span class="bpu-apply-lbl">Page / Slot</span>
            <div class="bpu-apply-row">
              <input type="number" class="bpu-inp bpu-inp--num" v-model.number="applyPage" min="0" placeholder="e.g. 5" />
              <button class="bpu-apply-btn" @click="applyPageAll" :disabled="applyPage === null || applyPage === ''">Apply</button>
            </div>
          </div>
          <div class="bpu-apply-group">
            <span class="bpu-apply-lbl">Sequential pages</span>
            <div class="bpu-apply-row">
              <input type="number" class="bpu-inp bpu-inp--num" v-model.number="seqStart" min="1" placeholder="Start" />
              <button class="bpu-apply-btn" @click="applySequential" :disabled="!seqStart">Apply</button>
            </div>
          </div>
        </div>

        <!-- Table -->
        <div class="bpu-table-wrap">
          <table class="bpu-tbl">
            <thead>
              <tr>
                <th class="bc-advert">Advert · Client</th>
                <th class="bc-curr">Current Date</th>
                <th class="bc-new">New Date</th>
                <th class="bc-curr">Cur. Page</th>
                <th class="bc-new">New Page</th>
                <th class="bc-diff">Change</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(s, idx) in schedules" :key="s.schedule_id"
                  class="bpu-row"
                  :class="{ 'bpu-row--alt': idx%2!==0, 'bpu-row--dirty': rowIsDirty(idx) }">
                <td class="bc-advert">
                  <div class="adv-title">{{ s.advert_title }}</div>
                  <div class="adv-sub">
                    <span class="ref-chip">ADV-{{ s.advert_id }}</span>
                    <span class="adv-client">{{ s.company_name }}</span>
                  </div>
                </td>
                <td class="bc-curr"><span class="curr-val">{{ fmtDate(s.run_date) }}</span></td>
                <td class="bc-new">
                  <input type="date" class="bpu-cell-inp"
                         :value="updates[idx].run_date"
                         @change="updates[idx].run_date = $event.target.value" />
                </td>
                <td class="bc-curr"><span class="curr-val mono">{{ s.page || '—' }}</span></td>
                <td class="bc-new">
                  <input type="number" class="bpu-cell-inp bpu-cell-inp--num"
                         v-model.number="updates[idx].page" min="0" />
                </td>
                <td class="bc-diff">
                  <template v-if="rowIsDirty(idx)">
                    <span v-if="updates[idx].run_date !== (s.run_date||'').split('T')[0]" class="diff-chip diff-chip--date">date</span>
                    <span v-if="updates[idx].page !== (s.page||0)" class="diff-chip diff-chip--page">
                      {{ s.page||0 }} → {{ updates[idx].page }}
                    </span>
                  </template>
                  <span v-else class="diff-none">—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Summary -->
        <div class="bpu-summary">
          <div class="bpu-summary__stats">
            <span class="stat-item"><span class="stat-n">{{ changedCount }}</span> rows changed</span>
            <span class="stat-sep">·</span>
            <span class="stat-item"><span class="stat-n">{{ schedules.length - changedCount }}</span> unchanged</span>
          </div>
          <div v-if="changedRows.length" class="bpu-preview">
            <div v-for="u in changedRows" :key="u.scheduleId" class="preview-row">
              <span class="preview-name">{{ schedules.find(s=>s.schedule_id===u.scheduleId)?.advert_title }}</span>
              <div class="preview-chips">
                <span v-if="u.run_date" class="prev-chip prev-chip--date">
                  {{ fmtDate(schedules.find(s=>s.schedule_id===u.scheduleId)?.run_date) }} → {{ fmtDate(u.run_date) }}
                </span>
                <span v-if="u.page !== undefined" class="prev-chip prev-chip--page">
                  pg {{ schedules.find(s=>s.schedule_id===u.scheduleId)?.page||0 }} → {{ u.page }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="bpu-footer">
          <button class="bpu-btn bpu-btn--ghost" @click="resetAll">Reset</button>
          <div style="display:flex;gap:8px">
            <button class="bpu-btn bpu-btn--ghost" @click="$emit('close')">Cancel</button>
            <button class="bpu-btn bpu-btn--save" @click="handleSave" :disabled="changedCount===0||saving">
              <svg v-if="saving" class="spin-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              {{ saving ? 'Saving…' : `Save ${changedCount} Change${changedCount!==1?'s':''}` }}
            </button>
          </div>
        </div>

      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  schedules: { type: Array, default: () => [] },
  show:      { type: Boolean, default: false }
})
const emit = defineEmits(['save', 'close'])

const applyDate = ref('')
const applyPage = ref('')
const seqStart  = ref('')
const updates   = ref([])
const saving    = ref(false)

watch(() => [props.show, props.schedules], () => {
  updates.value = props.schedules.map(s => ({
    scheduleId: s.schedule_id,
    run_date: (s.run_date||'').split('T')[0],
    page: s.page || 0
  }))
  applyDate.value = applyPage.value = seqStart.value = ''
}, { immediate: true })

const applyDateAll = () => { if (!applyDate.value) return; updates.value.forEach(u => u.run_date = applyDate.value); applyDate.value = '' }
const applyPageAll = () => { const p=parseInt(applyPage.value); if(isNaN(p)) return; updates.value.forEach(u => u.page=p); applyPage.value='' }
const applySequential = () => { let n=parseInt(seqStart.value); if(isNaN(n)) return; updates.value.forEach(u => u.page=n++); seqStart.value='' }
const resetAll = () => { updates.value = props.schedules.map(s => ({ scheduleId:s.schedule_id, run_date:(s.run_date||'').split('T')[0], page:s.page||0 })) }

const rowIsDirty = (i) => {
  const s=props.schedules[i], u=updates.value[i]
  if (!s||!u) return false
  return u.run_date !== (s.run_date||'').split('T')[0] || u.page !== (s.page||0)
}
const changedCount = computed(() => updates.value.filter((_,i) => rowIsDirty(i)).length)
const changedRows = computed(() =>
  updates.value.filter((_,i) => rowIsDirty(i)).map((u,_) => {
    const s = props.schedules.find(s=>s.schedule_id===u.scheduleId)
    const c = { scheduleId: u.scheduleId }
    if (u.run_date !== (s?.run_date||'').split('T')[0]) c.run_date = u.run_date
    if (u.page !== (s?.page||0)) c.page = u.page
    return c
  })
)

const handleSave = async () => {
  if (!changedCount.value) return
  saving.value = true
  try { emit('save', changedRows.value) } finally { saving.value = false }
}

const fmtDate = (d) => {
  if (!d) return '—'
  return new Date((d+'').split('T')[0]+'T00:00:00').toLocaleDateString('en-UG',{day:'numeric',month:'short',year:'numeric'})
}
</script>

<style scoped>
.bpu-overlay{position:fixed;inset:0;background:rgba(10,20,40,.55);backdrop-filter:blur(3px);display:flex;align-items:center;justify-content:center;z-index:2000;padding:16px;}
.bpu-modal{background:#fff;border-radius:2px;width:100%;max-width:900px;max-height:90vh;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,.25);font-family:'IBM Plex Sans','Segoe UI',sans-serif;font-size:13px;animation:bpu-in .18s ease-out;}
@keyframes bpu-in{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:none}}
.bpu-header{background:#1F3864;padding:12px 16px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;border-bottom:2px solid #E31E24;}
.bpu-header__left{display:flex;align-items:center;gap:10px;}
.bpu-header__label{font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#9DC3E6;}
.bpu-count{font-family:'IBM Plex Mono',monospace;font-size:13px;font-weight:700;color:#fff;background:#162d52;border:1px solid #4a6fa5;padding:2px 8px;}
.bpu-close{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.1);color:#9DC3E6;cursor:pointer;padding:4px;border-radius:1px;display:flex;align-items:center;transition:background .12s,color .12s;}
.bpu-close:hover{background:rgba(255,255,255,.15);color:#fff;}
.bpu-strip{display:flex;flex-wrap:wrap;align-items:flex-end;gap:16px;padding:12px 16px;background:#F2F6FB;border-bottom:1px solid #BDD7EE;flex-shrink:0;}
.bpu-strip__label{font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#888;align-self:center;white-space:nowrap;}
.bpu-apply-group{display:flex;flex-direction:column;gap:4px;}
.bpu-apply-lbl{font-size:10px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:#999;}
.bpu-apply-row{display:flex;gap:4px;}
.bpu-inp{font-family:'IBM Plex Mono',monospace;font-size:12px;border:1px solid #BDD7EE;padding:4px 8px;border-radius:1px;outline:none;background:#fff;}
.bpu-inp:focus{border-color:#1F3864;box-shadow:0 0 0 2px rgba(31,56,100,.1);}
.bpu-inp--date{width:140px;}
.bpu-inp--num{width:72px;text-align:center;}
.bpu-apply-btn{background:#1F3864;color:#fff;border:none;padding:4px 12px;font-size:11px;font-weight:600;font-family:inherit;cursor:pointer;border-radius:1px;}
.bpu-apply-btn:hover:not(:disabled){background:#162d52;}
.bpu-apply-btn:disabled{opacity:.4;cursor:not-allowed;}
.bpu-table-wrap{flex:1;overflow:auto;}
.bpu-tbl{width:100%;border-collapse:collapse;min-width:680px;}
.bpu-tbl thead tr{background:#1F3864;color:#fff;}
.bpu-tbl th{padding:8px 10px;font-size:10px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;text-align:left;white-space:nowrap;border-right:1px solid #2a4a7c;}
.bpu-tbl th:last-child{border-right:none;}
.bc-advert{width:auto;min-width:180px;}
.bc-curr{width:110px;}
.bc-new{width:130px;}
.bc-diff{width:150px;}
.bpu-row td{padding:7px 10px;border-bottom:1px solid #E8EEF4;border-right:1px solid #F0F4F9;vertical-align:middle;background:#fff;}
.bpu-row td:last-child{border-right:none;}
.bpu-row--alt td{background:#F8FAFD;}
.bpu-row:hover td{background:#EEF4FA !important;}
.bpu-row--dirty td:first-child{border-left:3px solid #FFB300;}
.adv-title{font-weight:600;font-size:12px;color:#1F3864;}
.adv-sub{display:flex;align-items:center;gap:5px;margin-top:2px;}
.ref-chip{font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:700;color:#1F3864;background:#DEEAF1;border:1px solid #9DC3E6;padding:0 5px;border-radius:1px;}
.adv-client{font-size:11px;color:#666;}
.curr-val{font-size:12px;color:#666;}
.curr-val.mono{font-family:'IBM Plex Mono',monospace;font-weight:600;color:#1F3864;}
.bpu-cell-inp{font-family:'IBM Plex Mono',monospace;font-size:12px;border:1px solid #BDD7EE;padding:3px 6px;border-radius:1px;outline:none;width:100%;background:#fff;}
.bpu-cell-inp:focus{border-color:#1F3864;box-shadow:0 0 0 2px rgba(31,56,100,.1);}
.bpu-cell-inp--num{text-align:center;max-width:68px;}
.diff-chip{display:inline-block;font-size:10px;font-weight:600;padding:1px 7px;border-radius:1px;margin-right:3px;}
.diff-chip--date{background:#DEEAF1;color:#0C5460;border:1px solid #BEE5EB;}
.diff-chip--page{background:#FFF3CD;color:#856404;border:1px solid #FFEAA0;font-family:'IBM Plex Mono',monospace;}
.diff-none{color:#ccc;}
.bpu-summary{border-top:1px solid #E8EEF4;padding:10px 16px;background:#FAFBFD;max-height:130px;overflow-y:auto;flex-shrink:0;}
.bpu-summary__stats{display:flex;align-items:center;gap:6px;margin-bottom:6px;}
.stat-item{font-size:12px;color:#555;}
.stat-n{font-family:'IBM Plex Mono',monospace;font-weight:700;color:#1F3864;}
.stat-sep{color:#BDD7EE;}
.bpu-preview{display:flex;flex-direction:column;gap:3px;}
.preview-row{display:flex;align-items:center;gap:8px;padding:3px 0;border-bottom:1px solid #F0F4F9;}
.preview-row:last-child{border-bottom:none;}
.preview-name{font-size:11px;font-weight:600;color:#333;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:200px;}
.preview-chips{display:flex;flex-wrap:wrap;gap:4px;}
.prev-chip{font-size:10px;font-weight:600;padding:1px 7px;border-radius:1px;}
.prev-chip--date{background:#DEEAF1;color:#0C5460;border:1px solid #BEE5EB;}
.prev-chip--page{background:#FFF3CD;color:#856404;border:1px solid #FFEAA0;font-family:'IBM Plex Mono',monospace;}
.bpu-footer{padding:10px 16px;border-top:1px solid #E8EEF4;background:#F8FAFD;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;}
.bpu-btn{display:inline-flex;align-items:center;gap:5px;padding:5px 14px;font-size:12px;font-family:inherit;font-weight:500;border:1px solid transparent;cursor:pointer;border-radius:1px;transition:background .12s;}
.bpu-btn--ghost{background:#fff;border-color:#BDD7EE;color:#555;}
.bpu-btn--ghost:hover{background:#F2F6FB;}
.bpu-btn--save{background:#1F3864;color:#fff;border-color:#1F3864;font-weight:600;}
.bpu-btn--save:hover:not(:disabled){background:#162d52;}
.bpu-btn--save:disabled{opacity:.6;cursor:not-allowed;}
.spin-icon{animation:spin .8s linear infinite;}
@keyframes spin{to{transform:rotate(360deg)}}
</style>