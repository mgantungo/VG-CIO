<!-- components/sfa/SfaOpportunityDetailDrawer.vue -->
<template>
  <Teleport to="body">
    <Transition name="slide">
      <div v-if="modelValue" class="drawer-overlay" @click.self="close">
        <div class="drawer">

          <!-- Header -->
          <div class="drawer-header">
            <div class="dh-left">
              <div class="dh-opp-id">{{ opp?.documentId || `#${opportunityId}` }}</div>
              <div class="dh-title">{{ opp?.title || '…' }}</div>
            </div>
            <div class="dh-right">
              <SfaStatusBadge
                v-if="opp?.funnel_stage"
                :status="opp.funnel_stage"
                :map="STAGE_BADGE_MAP"
              />
              <button class="dh-close" @click="close">✕</button>
            </div>
          </div>

          <!-- Loading -->
          <div v-if="loading" class="drawer-loading">
            <div class="spinner" />
          </div>

          <template v-else-if="opp">

            <!-- Tabs -->
            <div class="tab-bar">
              <button
                v-for="tab in TABS"
                :key="tab.id"
                class="tab-btn"
                :class="{ 'tab-btn--active': activeTab === tab.id }"
                @click="activeTab = tab.id"
              >
                {{ tab.icon }} {{ tab.label }}
                <span v-if="tab.id === 'attachments' && allAttachments.length" class="tab-count">
                  {{ allAttachments.length }}
                </span>
              </button>
            </div>

            <!-- Tab content -->
            <div class="drawer-body">

              <!-- ── Overview ──────────────────────────────────────────── -->
              <template v-if="activeTab === 'overview'">

                <!-- Company / Client -->
                <div class="section-title">Company</div>
                <div v-if="opp.company" class="info-grid">
                  <div class="info-row">
                    <span class="ik">Name</span>
                    <span class="iv">{{ opp.company.company_name }}</span>
                  </div>
                  <div v-if="opp.company.industry" class="info-row">
                    <span class="ik">Industry</span>
                    <span class="iv">{{ opp.company.industry }}</span>
                  </div>
                  <div v-if="opp.company.location" class="info-row">
                    <span class="ik">Location</span>
                    <span class="iv">{{ opp.company.location }}</span>
                  </div>
                  <div v-if="opp.company.phone" class="info-row">
                    <span class="ik">Phone</span>
                    <span class="iv">{{ opp.company.phone }}</span>
                  </div>
                </div>
                <div v-else-if="opp.existing_client" class="info-grid">
                  <div class="info-row">
                    <span class="ik">Client</span>
                    <span class="iv">{{ opp.existing_client.company_name }}</span>
                  </div>
                  <div v-if="opp.existing_client.bc_no" class="info-row">
                    <span class="ik">BC No</span>
                    <span class="iv iv--mono">{{ opp.existing_client.bc_no }}</span>
                  </div>
                  <div class="info-row">
                    <span class="ik">Type</span>
                    <span class="iv">↩ Return Client</span>
                  </div>
                </div>

                <!-- Contacts -->
                <template v-if="opp.contacts?.length">
                  <div class="section-title mt">Contacts</div>
                  <div v-for="c in opp.contacts" :key="c.id" class="contact-chip">
                    <div class="cc-name">{{ c.full_name }}</div>
                    <div class="cc-meta">{{ [c.position, c.phone].filter(Boolean).join(' · ') }}</div>
                  </div>
                </template>

                <!-- Details -->
                <div class="section-title mt">Details</div>
                <div class="info-grid">
                  <div v-if="opp.expected_value" class="info-row">
                    <span class="ik">Expected Value</span>
                    <span class="iv iv--mono">UGX {{ Number(opp.expected_value).toLocaleString() }}</span>
                  </div>
                  <div v-if="opp.expected_close_date" class="info-row">
                    <span class="ik">Close Date</span>
                    <span class="iv">{{ formatDate(opp.expected_close_date) }}</span>
                  </div>
                  <div v-if="opp.source" class="info-row">
                    <span class="ik">Source</span>
                    <span class="iv">{{ opp.source }}</span>
                  </div>
                  <div class="info-row">
                    <span class="ik">Sales Agent</span>
                    <span class="iv">{{ opp.created_by_agent?.vgams_sales_person?.name || '—' }}</span>
                  </div>
                  <div v-if="opp.created_by_agent?.unit" class="info-row">
                    <span class="ik">Unit</span>
                    <span class="iv">{{ opp.created_by_agent.unit.name }}</span>
                  </div>
                </div>

                <!-- Products / Services -->
                <div class="section-title mt">Products / Services</div>
                <div v-if="buyInLines.length" class="buy-in-table">
                  <div class="bi-row bi-row--head">
                    <span>Product</span>
                    <span>Qty</span>
                    <span>Unit Price</span>
                    <span>Subtotal</span>
                  </div>
                  <div v-for="l in buyInLines" :key="l.id" class="bi-row">
                    <span>{{ l.buy_in?.name || l.custom_offer || '—' }}</span>
                    <span>{{ l.quantity }}</span>
                    <span>{{ Number(l.unit_price || 0).toLocaleString() }}</span>
                    <span class="bi-sub">{{ Number((l.quantity || 0) * (l.unit_price || 0)).toLocaleString() }}</span>
                  </div>
                  <div class="bi-total">
                    <span>Total</span>
                    <span class="bi-total-val">UGX {{ buyInTotal }}</span>
                  </div>
                </div>
                <div v-else class="hint">No products/services added yet.</div>

                <!-- Description -->
                <template v-if="opp.description">
                  <div class="section-title mt">Description</div>
                  <p class="desc-text">{{ opp.description }}</p>
                </template>

                <!-- Actions -->
                <div class="section-title mt">Actions</div>
                <div class="action-row">
                  <button class="btn-action btn-secondary" @click="activeTab = 'activities'">
                    📝 Log Activity
                  </button>
                  <button
                    v-if="!opp.is_converted && opp.funnel_stage !== 'closed_lost'"
                    class="btn-action btn-secondary"
                    @click="activeTab = 'quotations'"
                  >
                    📋 Quotations
                  </button>
                  <button
                    v-if="opp.funnel_stage === 'approved' && !opp.is_converted"
                    class="btn-action btn-primary"
                    @click="showConvert = true"
                  >
                    📦 Convert to Order
                  </button>
                  <button
                    v-if="!['approved','closed_lost'].includes(opp.funnel_stage) && !opp.is_converted"
                    class="btn-action btn-ghost"
                    @click="showMarkLost = true"
                  >
                    ✗ Mark Lost
                  </button>
                </div>

              </template>

              <!-- ── Activities ────────────────────────────────────────── -->
              <template v-if="activeTab === 'activities'">
                <SfaActivityTimeline
                  :opportunity-id="opportunityId"
                  :current-funnel-stage="opp?.funnel_stage || 'opportunity_created'"
                  @stage-advanced="onStageAdvanced"
                  @convert-to-order="onConvertToOrder"
                />
              </template>

              <!-- ── Quotations ─────────────────────────────────────────── -->
              <template v-if="activeTab === 'quotations'">
                <SfaQuotationList
                  :opportunity-id="opportunityId"
                  :opportunity="opp"
                  @updated="loadDetail"
                />
              </template>

              <!-- ── Attachments ────────────────────────────────────────── -->
              <template v-if="activeTab === 'attachments'">
                <div class="attach-tab">

                  <div v-if="attachLoading" class="attach-loading">
                    <div class="spinner" />
                    <span>Loading attachments…</span>
                  </div>

                  <div v-else-if="!allAttachments.length" class="attach-empty">
                    <div class="attach-empty-icon">📎</div>
                    <div>No attachments yet.</div>
                    <div class="attach-empty-hint">
                      Files uploaded when logging activities will appear here.
                    </div>
                  </div>

                  <div v-else class="attach-list">
                    <div v-for="(file, i) in allAttachments" :key="i" class="attach-item">

                      <div class="attach-icon">{{ fileIcon(file) }}</div>

                      <div class="attach-info">
                        <a
                          :href="file.url"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="attach-name"
                        >{{ file.name }}</a>
                        <div class="attach-meta">
                          <span>{{ fileSize(file.size) }}</span>
                          <span class="meta-sep">·</span>
                          <span>{{ formatDate(file.activityDate) }}</span>
                          <span class="meta-sep">·</span>
                          <span>{{ ACTIVITY_TYPE_LABELS[file.activityType] || file.activityType }}</span>
                          <span class="meta-sep">·</span>
                          <span>{{ file.loggedBy }}</span>
                        </div>
                        <div class="attach-context">{{ file.activitySummary }}</div>
                      </div>

                      <a
                        :href="file.url"
                        :download="file.name"
                        target="_blank"
                        class="attach-dl"
                        title="Download"
                      >⬇</a>

                    </div>
                  </div>

                </div>
              </template>

            </div><!-- end .drawer-body -->

          </template>

          <!-- Convert modal -->
          <SfaConvertToOrderModal
            v-if="showConvert"
            v-model="showConvert"
            :opportunity-id="opportunityId"
            :quotations="convertQuotations"
            :company-name="opp?.company?.company_name || opp?.existing_client?.company_name || ''"
            @converted="onConverted"
          />

          <!-- Mark lost confirm -->
          <div v-if="showMarkLost" class="confirm-overlay" @click.self="showMarkLost = false">
            <div class="confirm-box">
              <div class="confirm-title">Mark as Lost?</div>
              <textarea v-model="lostReason" class="field-input" rows="2" placeholder="Reason (optional)" />
              <div class="confirm-actions">
                <button class="btn-action btn-secondary" @click="showMarkLost = false">Cancel</button>
                <button class="btn-action btn-danger" @click="confirmMarkLost">Mark Lost</button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import SfaStatusBadge         from './SfaStatusBadge.vue'
import SfaActivityTimeline    from './SfaActivityTimeline.vue'
import SfaQuotationList       from './SfaQuotationList.vue'
import SfaConvertToOrderModal from './SfaConvertToOrderModal.vue'
import { useSfaOpportunities, SFA_STAGES } from '~/composables/useSfaOpportunities'
import { useSfaBuyIns }     from '~/composables/useSfaBuyIns'
import { useSfaActivities } from '~/composables/useSfaActivities'

const props = defineProps({
  modelValue:    Boolean,
  opportunityId: { type: [Number, String], required: true },
})
const emit = defineEmits(['update:modelValue', 'converted', 'updated'])

const { fetchOpportunity, markLost } = useSfaOpportunities()
const { fetchOpportunityBuyIns }     = useSfaBuyIns()
// Use the composable's reactive ref directly — shared with SfaActivityTimeline
const { activities: allActivities, fetchActivities } = useSfaActivities()

const TABS = [
  { id: 'overview',    label: 'Overview',    icon: '◈' },
  { id: 'activities',  label: 'Activities',  icon: '📝' },
  { id: 'quotations',  label: 'Quotations',  icon: '📋' },
  { id: 'attachments', label: 'Attachments', icon: '📎' },
]

const STAGE_BADGE_MAP = Object.fromEntries(
  SFA_STAGES.map(s => [s.id, { label: s.label, color: s.color, bg: s.color + '15' }])
)

const opp              = ref(null)
const buyInLines       = ref([])
const loading          = ref(false)
const attachLoading    = ref(false)
const activeTab        = ref('overview')
const showConvert      = ref(false)
const showMarkLost     = ref(false)
const lostReason       = ref('')
const convertQuotations = ref([])

// ── Data loading ──────────────────────────────────────────────────────────
async function loadDetail() {
  loading.value = true
  try {
    const [oppData, lines] = await Promise.all([
      fetchOpportunity(props.opportunityId),
      fetchOpportunityBuyIns(props.opportunityId),
    ])
    opp.value        = oppData
    buyInLines.value = lines
  } finally {
    loading.value = false
  }
}

// ── Buy-in total ──────────────────────────────────────────────────────────
const buyInTotal = computed(() => {
  return buyInLines.value
    .reduce((s, l) => s + (l.quantity || 0) * (l.unit_price || 0), 0)
    .toLocaleString()
})

// ── Attachments — aggregated from all activities ──────────────────────────
// allActivities is the module-level reactive ref inside useSfaActivities.
// It is kept live by both this component (via the attachments tab watch)
// and by SfaActivityTimeline (via its onMounted fetch).
const allAttachments = computed(() => {
  const mediaBase = useRuntimeConfig().public.apiBase.replace(/\/api\/?$/, '')

  const files = []
  for (const act of allActivities.value) {
    if (!act.attachments?.length) continue
    for (const file of act.attachments) {
      const url = file.url?.startsWith('http')
        ? file.url
        : `${mediaBase}${file.url}`

      files.push({
        ...file,
        url,
        activityType:    act.type,
        activityDate:    act.activity_date,
        activitySummary: act.summary,
        loggedBy:        act.logged_by?.vgams_sales_person?.name || '—',
      })
    }
  }
  return files
})

// ── Handlers ──────────────────────────────────────────────────────────────
async function confirmMarkLost() {
  await markLost(props.opportunityId, lostReason.value)
  showMarkLost.value = false
  emit('updated')
  close()
}

function onConverted(order) {
  showConvert.value = false
  emit('converted', order)
  close()
}

async function onStageAdvanced() {
  await loadDetail()
  emit('updated')
}

// Called when agent confirms "Convert to Order" from the activity log modal
// (stage just moved to 'approved'). Open the conversion modal immediately.
async function onConvertToOrder() {
  await loadDetail()      // reload so opp.funnel_stage = 'approved'
  showConvert.value = true
}

function close() { emit('update:modelValue', false) }

// ── Watchers ──────────────────────────────────────────────────────────────
watch(() => props.modelValue, async v => {
  if (!v) return
  activeTab.value = 'overview'
  await loadDetail()
})

// Switching to Attachments tab → re-fetch activities to ensure files are fresh
watch(activeTab, async tab => {
  if (tab !== 'attachments') return
  attachLoading.value = true
  try {
    await fetchActivities(props.opportunityId)
  } finally {
    attachLoading.value = false
  }
})

// ── Helpers ───────────────────────────────────────────────────────────────
const ACTIVITY_TYPE_LABELS = {
  call:          'Phone Call',
  email:         'Email',
  visit:         'Physical Visit',
  meeting:       'Meeting',
  internal_note: 'Internal Note',
}

function fileIcon(file) {
  const mime = (file.mime || '').toLowerCase()
  if (mime.startsWith('image/'))                        return '🖼'
  if (mime === 'application/pdf')                       return '📄'
  if (mime.includes('word') || mime.includes('docx'))   return '📝'
  if (mime.includes('sheet') || mime.includes('excel')) return '📊'
  if (mime.includes('zip') || mime.includes('rar'))     return '🗜'
  if (mime.startsWith('video/'))                        return '🎬'
  if (mime.startsWith('audio/'))                        return '🎵'
  return '📎'
}

function fileSize(bytes) {
  if (!bytes)              return ''
  if (bytes < 1024)        return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}
</script>

<style scoped>
/* ── Overlay & drawer ────────────────────────────────────────────────────── */
.drawer-overlay {
  position: fixed; inset: 0; z-index: 7000;
  background: rgba(10,20,40,0.35);
}
.drawer {
  position: absolute; top: 0; right: 0; bottom: 0;
  width: 520px; max-width: 100vw;
  background: #FFFFFF; display: flex; flex-direction: column;
  box-shadow: -4px 0 30px rgba(13,24,48,0.14);
  font-family: 'IBM Plex Sans', sans-serif;
  overflow: hidden;
}

/* ── Header ──────────────────────────────────────────────────────────────── */
.drawer-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  gap: 10px; padding: 16px 20px;
  border-bottom: 1px solid #D5DDEF; flex-shrink: 0;
  background: #003366;
}
.dh-opp-id {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 10px; font-weight: 600; color: #7BA9D5;
  letter-spacing: 0.5px; margin-bottom: 4px;
}
.dh-title { font-size: 15px; font-weight: 700; color: #FFFFFF; line-height: 1.3; }
.dh-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
.dh-close { background: none; border: none; color: #7BA9D5; font-size: 16px; cursor: pointer; padding: 2px 6px; }
.dh-close:hover { color: #FFFFFF; }

/* ── Loading ─────────────────────────────────────────────────────────────── */
.drawer-loading { flex: 1; display: flex; align-items: center; justify-content: center; }
.spinner {
  width: 28px; height: 28px; border-radius: 50%;
  border: 3px solid #D5DDEF; border-top-color: #003366;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Tabs ────────────────────────────────────────────────────────────────── */
.tab-bar {
  display: flex; border-bottom: 1px solid #D5DDEF;
  flex-shrink: 0; background: #F7F9FC;
}
.tab-btn {
  flex: 1; padding: 9px 4px; font-size: 11px; font-weight: 600;
  color: #8094B8; background: none; border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer; font-family: inherit; transition: all 0.12s;
}
.tab-btn:hover { color: #003366; }
.tab-btn--active { color: #003366; border-bottom-color: #003366; background: #FFFFFF; }
.tab-count {
  display: inline-flex; align-items: center; justify-content: center;
  background: #0066CC; color: #fff;
  font-size: 9px; font-weight: 700; border-radius: 10px;
  padding: 1px 5px; margin-left: 4px; vertical-align: middle;
}

/* ── Body ────────────────────────────────────────────────────────────────── */
.drawer-body { flex: 1; overflow-y: auto; padding: 18px 20px; }

/* ── Section titles ──────────────────────────────────────────────────────── */
.section-title {
  font-size: 9px; font-weight: 700; letter-spacing: 1.5px;
  text-transform: uppercase; color: #8094B8;
  margin-bottom: 8px; font-family: 'IBM Plex Mono', monospace;
}
.section-title.mt { margin-top: 20px; }

/* ── Info grid ───────────────────────────────────────────────────────────── */
.info-grid { display: flex; flex-direction: column; }
.info-row {
  display: flex; justify-content: space-between;
  padding: 6px 0; border-bottom: 1px solid #F0F4FA; font-size: 12px;
}
.ik { color: #8094B8; font-weight: 600; }
.iv { color: #0D1830; font-weight: 500; text-align: right; }
.iv--mono { font-family: 'IBM Plex Mono', monospace; }

/* ── Contacts ────────────────────────────────────────────────────────────── */
.contact-chip { border: 1.5px solid #D5DDEF; border-radius: 4px; padding: 8px 10px; margin-bottom: 6px; }
.cc-name { font-size: 12px; font-weight: 600; color: #0D1830; }
.cc-meta { font-size: 11px; color: #8094B8; margin-top: 2px; }

/* ── Buy-in table ────────────────────────────────────────────────────────── */
.buy-in-table { border: 1.5px solid #D5DDEF; border-radius: 4px; overflow: hidden; }
.bi-row {
  display: grid; grid-template-columns: 2fr 1fr 1fr 1fr;
  padding: 7px 10px; border-bottom: 1px solid #EEF2F8; font-size: 11px; color: #0D1830;
}
.bi-row:last-child { border-bottom: none; }
.bi-row--head { background: #F7F9FC; font-weight: 700; color: #8094B8; font-size: 10px; }
.bi-sub { font-family: 'IBM Plex Mono', monospace; }
.bi-total {
  display: grid; grid-template-columns: 1fr auto;
  padding: 8px 10px; font-weight: 700; font-size: 12px;
  color: #003366; border-top: 1px solid #D5DDEF;
}
.bi-total-val { font-family: 'IBM Plex Mono', monospace; }

.desc-text { font-size: 12px; color: #3B4F70; line-height: 1.6; }
.hint      { font-size: 12px; color: #8094B8; font-style: italic; }

/* ── Actions ─────────────────────────────────────────────────────────────── */
.action-row { display: flex; flex-wrap: wrap; gap: 8px; }
.btn-action {
  padding: 7px 14px; border-radius: 4px; font-size: 12px; font-weight: 600;
  cursor: pointer; font-family: inherit; border: 1.5px solid transparent; transition: all 0.12s;
}
.btn-primary   { background: #003366; color: #fff; border-color: #003366; }
.btn-primary:hover   { background: #002244; }
.btn-secondary { background: #F0F4FA; color: #3B4F70; border-color: #D5DDEF; }
.btn-secondary:hover { border-color: #8094B8; color: #0D1830; }
.btn-ghost  { background: none; color: #C9252D; border-color: #C9252D33; }
.btn-ghost:hover { background: #FFF0F0; }
.btn-danger { background: #C9252D; color: #fff; border-color: #C9252D; }
.btn-danger:hover { background: #A01E25; }

/* ── Mark lost confirm ───────────────────────────────────────────────────── */
.confirm-overlay {
  position: absolute; inset: 0; background: rgba(10,20,40,0.4);
  display: flex; align-items: center; justify-content: center; z-index: 100;
}
.confirm-box {
  background: #FFFFFF; border-radius: 6px; padding: 20px;
  width: 320px; display: flex; flex-direction: column; gap: 12px;
  box-shadow: 0 8px 30px rgba(0,0,0,0.15);
}
.confirm-title { font-size: 14px; font-weight: 700; color: #003366; }
.field-input {
  padding: 7px 10px; border: 1.5px solid #D1D9E0; border-radius: 2px;
  font-size: 12px; color: #0D1830; font-family: inherit; resize: vertical;
}
.field-input:focus { outline: none; border-color: #0066CC; }
.confirm-actions { display: flex; gap: 8px; justify-content: flex-end; }

/* ── Transitions ─────────────────────────────────────────────────────────── */
.slide-enter-active, .slide-leave-active { transition: transform 0.22s ease; }
.slide-enter-from, .slide-leave-to       { transform: translateX(100%); }

/* ── Attachments tab ─────────────────────────────────────────────────────── */
.attach-tab { padding: 4px 0; }

.attach-loading {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 12px;
  padding: 40px 0; color: #8094B8; font-size: 12px;
}

.attach-empty { text-align: center; padding: 40px 20px; color: #8094B8; font-size: 13px; }
.attach-empty-icon { font-size: 36px; margin-bottom: 10px; }
.attach-empty-hint { font-size: 11px; color: #C0CCDD; margin-top: 6px; line-height: 1.5; }

.attach-list { display: flex; flex-direction: column; }
.attach-item {
  display: flex; align-items: flex-start; gap: 12px;
  padding: 12px 0; border-bottom: 1px solid #EEF2F8;
}
.attach-item:last-child { border-bottom: none; }

.attach-icon {
  font-size: 22px; width: 36px; height: 36px; border-radius: 6px;
  background: #F0F4F8; display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}

.attach-info { flex: 1; min-width: 0; }

.attach-name {
  font-size: 12px; font-weight: 600; color: #003366; text-decoration: none;
  display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.attach-name:hover { text-decoration: underline; }

.attach-meta {
  font-size: 10px; color: #8094B8; margin-top: 3px;
  display: flex; flex-wrap: wrap; gap: 3px;
}
.meta-sep { color: #D1D9E0; }

.attach-context {
  font-size: 10px; color: #8094B8; margin-top: 3px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-style: italic;
}

.attach-dl {
  font-size: 16px; color: #8094B8; text-decoration: none;
  padding: 4px; border-radius: 4px; transition: background 0.1s; flex-shrink: 0;
}
.attach-dl:hover { background: #F0F4F8; color: #003366; }
</style>
