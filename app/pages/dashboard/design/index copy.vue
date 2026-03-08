<!--pages/dashboard/design/index.vue-->
<template>
  <div class="dh-page">

    <!-- ── HEADER BAR ── -->
    <div class="hd-bar">
      <div class="hd-left">
        <div class="hd-title">Design House</div>
        <div class="hd-sub">Advert creative materials &amp; scheduling pipeline</div>
      </div>
      <div class="hd-right">
        <div class="hd-period">
          <label class="hd-label">From</label>
          <input type="date" v-model="startDate" :max="endDate" class="hd-input" @change="handleDateChange">
          <label class="hd-label">To</label>
          <input type="date" v-model="endDate" :min="startDate" :max="maxAllowedDate" class="hd-input" @change="handleDateChange">
        </div>
        <div class="hd-quick">
          <button v-for="r in quickRanges" :key="r.key"
            class="qr-btn" :class="{ 'qr-btn--active': activeQuickRange === r.key }"
            @click="setQuickDateRange(r.key)">{{ r.label }}</button>
        </div>
        <button class="hd-btn" @click="refreshData" :disabled="loading">
          <span v-if="loading">Loading…</span>
          <span v-else>&#8635; Refresh</span>
        </button>
      </div>
    </div>

    <!-- ── PROCESS FLOW STRIP ── -->
    <div class="flow-strip">
      <div class="flow-step flow-step--blue">
        <div class="flow-num">{{ running }}</div>
        <div class="flow-lbl">Running Now</div>
      </div>
      <div class="flow-arrow">&#9654;</div>
      <div class="flow-step flow-step--teal">
        <div class="flow-num">{{ upcoming }}</div>
        <div class="flow-lbl">Upcoming</div>
      </div>
      <div class="flow-arrow">&#9654;</div>
      <div class="flow-step flow-step--amber">
        <div class="flow-num">{{ pendingDesign }}</div>
        <div class="flow-lbl">Pending Design</div>
      </div>
      <div class="flow-arrow">&#9654;</div>
      <div class="flow-step flow-step--green">
        <div class="flow-num">{{ designApproved }}</div>
        <div class="flow-lbl">Design Approved</div>
      </div>
      <div class="flow-arrow">&#9654;</div>
      <div class="flow-step flow-step--gold">
        <div class="flow-num">{{ readyToSchedule }}</div>
        <div class="flow-lbl">Ready to Schedule</div>
      </div>
      <div class="flow-arrow">&#9654;</div>
      <div class="flow-step flow-step--navy">
        <div class="flow-num">{{ scheduled }}</div>
        <div class="flow-lbl">Scheduled</div>
      </div>
      <div class="flow-spacer"></div>
      <div class="flow-step flow-step--slate">
        <div class="flow-num">{{ totalFiles }}</div>
        <div class="flow-lbl">Total Files</div>
      </div>
    </div>

    <!-- ── RIBBON ── -->
    <div class="ribbon">
      <div class="ribbon__tab-strip">
        <button class="tab-btn" :class="{ 'tab-btn--active': viewTab === 'all' }" @click="viewTab = 'all'">
          All <span class="tab-pill">{{ adverts.length }}</span>
        </button>
        <button class="tab-btn" :class="{ 'tab-btn--active': viewTab === 'running' }" @click="viewTab = 'running'">
          Running Now <span class="tab-pill tab-pill--blue">{{ adverts.filter(a=>a.runningNow).length }}</span>
        </button>
        <button class="tab-btn" :class="{ 'tab-btn--active': viewTab === 'upcoming' }" @click="viewTab = 'upcoming'">
          Upcoming <span class="tab-pill tab-pill--teal">{{ adverts.filter(a=>a.isUpcoming).length }}</span>
        </button>
        <button class="tab-btn" :class="{ 'tab-btn--active': viewTab === 'pending' }" @click="viewTab = 'pending'">
          Pending Design <span class="tab-pill tab-pill--amber">{{ adverts.filter(a=>!a.isApproved).length }}</span>
        </button>
        <button class="tab-btn" :class="{ 'tab-btn--active': viewTab === 'approved' }" @click="viewTab = 'approved'">
          Design Approved <span class="tab-pill tab-pill--green">{{ adverts.filter(a=>a.isApproved).length }}</span>
        </button>
      </div>

      <div class="ribbon__filters">
        <div class="search-wrap">
          <svg class="search-icon" viewBox="0 0 16 16"><circle cx="6.5" cy="6.5" r="4.5" fill="none" stroke="currentColor" stroke-width="1.4"/><line x1="10.5" y1="10.5" x2="14" y2="14" stroke="currentColor" stroke-width="1.4"/></svg>
          <input v-model="searchQuery" type="text" class="xl-input xl-input--search" placeholder="Search client, reference, title, contact…" @input="handleSearch">
        </div>
        <select v-model="platformFilter" class="xl-select" @change="applyFilters">
          <option value="">All Platforms</option>
          <option value="Print Media">Print Media</option>
          <option value="Television">Television</option>
          <option value="Radio">Radio</option>
          <option value="Digital">Digital</option>
        </select>
        <select v-model="productFilter" class="xl-select" @change="applyFilters">
          <option value="">All Products</option>
          <option v-for="p in productOptions" :key="p" :value="p">{{ p }}</option>
        </select>
        <button class="ribbon-btn ribbon-btn--reset" @click="resetFilters">Reset</button>
        <div class="result-badge">
          {{ filteredAdverts.length }} adverts
          <span v-if="filteredAdverts.length !== adverts.length" class="result-filtered">(of {{ adverts.length }})</span>
        </div>
      </div>

      <div v-if="hasActiveFilters" class="ribbon__chips">
        <span class="chip-lbl">Filters:</span>
        <span v-if="searchQuery"    class="xl-chip">Search: "{{ searchQuery }}" <button @click="clearSearch" class="chip-x">x</button></span>
        <span v-if="platformFilter" class="xl-chip">Platform: {{ platformFilter }} <button @click="clearPlatformFilter" class="chip-x">x</button></span>
        <span v-if="productFilter" class="xl-chip">Product: {{ productFilter }} <button @click="productFilter = ''" class="chip-x">x</button></span>
      </div>
    </div>

    <!-- ── ERROR ── -->
    <div v-if="error" class="xl-error">
      <span class="xl-error__icon">!</span>
      <div><div class="xl-error__title">Error Loading Designs</div><div class="xl-error__msg">{{ error }}</div></div>
      <button class="ribbon-btn ribbon-btn--reset" @click="refreshData">Retry</button>
    </div>

    <!-- ── MAIN TABLE ── -->
    <div class="xl-sheet">
      <div class="xl-sheet__head">
        <span class="xl-sheet__title">
          <span v-if="viewTab==='running'">Running Now</span>
          <span v-else-if="viewTab==='upcoming'">Upcoming Adverts</span>
          <span v-else-if="viewTab==='pending'">Pending Design Approval</span>
          <span v-else-if="viewTab==='approved'">Design Approved — Ready for Scheduling</span>
          <span v-else>All Adverts in Range</span>
        </span>
        <span class="xl-sheet__count">{{ filteredAdverts.length }} records</span>
      </div>

      <div v-if="loading" class="state-box">
        <div class="spinner"></div>
        <p>Loading adverts…</p>
      </div>

      <div v-else-if="filteredAdverts.length === 0" class="state-box">
        <div class="state-box__icon">&#128197;</div>
        <div class="state-box__title">No Adverts Found</div>
        <p v-if="hasActiveFilters || viewTab !== 'all'">No adverts match your current filters</p>
        <p v-else>No paid adverts found for the selected date range</p>
        <button class="ribbon-btn ribbon-btn--primary" @click="resetAllFilters">Reset All</button>
      </div>

      <div v-else class="tbl-wrap">
        <table class="xl-tbl">
          <thead>
            <tr>
              <th class="tc-ref">Reference</th>
              <th class="tc-status">Design</th>
              <th class="tc-client">Client / Title</th>
              <th class="tc-platform">Platform</th>
              <th class="tc-product">Product</th>
              <th class="tc-dates">Publishing Dates</th>
              <th class="tc-files">Files</th>
              <th class="tc-deadline">Deadline</th>
              <th class="tc-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in paginatedAdverts" :key="item.id"
              class="xl-row"
              :class="{
                'xl-row--scheduled': item.isScheduled,
                'xl-row--running':   item.runningNow && !item.isScheduled,
                'xl-row--upcoming':  item.isUpcoming && !item.isScheduled,
                'xl-row--approved':  item.isApproved && !item.isScheduled,
              }">

              <td class="tc-ref">
                <div class="ref-cell">
                  <span class="ref-chip">{{ item.reference }}</span>
                  <span class="ref-date">{{ fmtDate(item.startDate) }}</span>
                  <span v-if="item.runningNow"  class="run-badge run-badge--on">LIVE</span>
                  <span v-else-if="item.isUpcoming" class="run-badge run-badge--soon">SOON</span>
                </div>
              </td>

              <td class="tc-status">
                <span :class="`xlbadge xlbadge--${item.designStatus}`">
                  {{ item.isApproved ? 'Approved' : 'Pending' }}
                </span>
                <div v-if="item.isScheduled" class="sched-tag">Scheduled</div>
              </td>

              <td class="tc-client">
                <div class="cell-stack">
                  <span class="cell-main">{{ item.clientName }}</span>
                  <span v-if="item.contactPerson" class="cell-contact">
                    <svg width="10" height="10" viewBox="0 0 16 16" fill="none" style="vertical-align:middle;margin-right:2px"><circle cx="8" cy="5" r="3" stroke="#6081a3" stroke-width="1.5"/><path d="M2 14c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="#6081a3" stroke-width="1.5" stroke-linecap="round"/></svg>{{ item.contactPerson }}
                  </span>
                  <span v-if="item.contactNumber" class="cell-contact-detail">
                    <svg width="10" height="10" viewBox="0 0 16 16" fill="none" style="vertical-align:middle;margin-right:2px"><path d="M3 2h3l1.5 3.5-2 1.2a9 9 0 004.8 4.8l1.2-2L15 11v3a1 1 0 01-1 1A13 13 0 012 3a1 1 0 011-1z" stroke="#6081a3" stroke-width="1.4" stroke-linejoin="round"/></svg>{{ item.contactNumber }}
                  </span>
                  <span v-if="item.contactEmail" class="cell-contact-detail cell-contact-email">
                    <svg width="10" height="10" viewBox="0 0 16 16" fill="none" style="vertical-align:middle;margin-right:2px"><rect x="2" y="4" width="12" height="9" rx="1" stroke="#6081a3" stroke-width="1.4"/><path d="M2 5l6 5 6-5" stroke="#6081a3" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>{{ item.contactEmail }}
                  </span>
                  <span class="cell-sub">{{ item.advertTitle }}</span>
                  <span v-if="item.adSize" class="cell-meta">{{ item.adSize }}</span>
                </div>
              </td>

              <td class="tc-platform">
                <div class="cell-stack">
                  <span class="cell-main">{{ item.platform }}</span>
                  <span v-if="item.category !== item.platform" class="plat-tag">{{ item.category }}</span>
                </div>
              </td>

              <td class="tc-product">
                <div class="cell-stack">
                  <span v-if="item.product && item.product !== '—'" class="prod-name">{{ item.product }}</span>
                  <span v-else class="pub-none">—</span>
                </div>
              </td>

              <td class="tc-dates">
                <div class="pub-dates">
                  <span v-if="!item.publishingDates || item.publishingDates.length === 0" class="pub-none">—</span>
                  <template v-else>
                    <span v-for="d in item.publishingDates" :key="d"
                      class="pub-chip"
                      :class="{ 'pub-chip--today': d === today, 'pub-chip--past': d < today }">
                      {{ fmtShortDate(d) }}
                    </span>
                    <span class="pub-total">{{ item.publishingDates.length }} day{{ item.publishingDates.length !== 1 ? 's' : '' }}</span>
                  </template>
                </div>
              </td>

              <td class="tc-files">
                <div class="attach-cell" @click="viewAttachments(item)">
                  <span class="attach-count">{{ item.attachmentsCount }} file{{ item.attachmentsCount !== 1 ? 's' : '' }}</span>
                  <span v-if="item.totalFileSize && item.attachmentsCount > 0" class="attach-size">{{ item.totalFileSize }}</span>
                  <span v-if="item.attachmentsCount === 0" class="attach-none">No files yet</span>
                </div>
              </td>

              <td class="tc-deadline">
                <div class="cell-stack">
                  <span class="cell-main">{{ fmtDate(item.endDate) }}</span>
                  <span v-if="isUrgent(item.endDate)" class="urgent-tag">Urgent</span>
                </div>
              </td>

              <td class="tc-actions">
                <div class="act-group">
                  <!-- Upload -->
                  <button class="act-btn act-btn--upload" @click="openUploadModal(item)" title="Upload design files">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 1v9M4 5l4-4 4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 12v1a1 1 0 001 1h10a1 1 0 001-1v-1" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
                  </button>
                  <!-- View files -->
                  <button v-if="item.attachmentsCount > 0" class="act-btn act-btn--view" @click="viewAttachments(item)" title="View files">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" stroke-width="1.5"/><circle cx="8" cy="8" r="2" stroke="currentColor" stroke-width="1.5"/></svg>
                  </button>
                  <!-- Approve design -->
                  <button v-if="!item.isApproved" class="act-btn act-btn--approve" @click="handleMarkComplete(item)" title="Approve design">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 8l4 4 8-8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  </button>
                  <!-- Schedule -->
                  <button v-if="item.isApproved" class="act-btn act-btn--sched" @click="openScheduleModal(item)" title="Schedule advert">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="11" rx="1" stroke="currentColor" stroke-width="1.5"/><path d="M5 1v3M11 1v3M2 7h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                  </button>
                  <!-- Brief -->
                  <button v-if="item.hasBrief" class="act-btn act-btn--brief" @click="viewBrief(item)" title="View creative brief">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="3" y="1" width="10" height="14" rx="1" stroke="currentColor" stroke-width="1.5"/><path d="M6 5h4M6 8h4M6 11h2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                  </button>
                  <!-- Download -->
                  <button v-if="item.attachmentsCount > 0" class="act-btn act-btn--dl" @click="handleDownloadFiles(item)" title="Download files">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 1v9M4 11l4 4 4-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 13v1a1 1 0 001 1h10a1 1 0 001-1v-1" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="status-bar">
        <div class="sb-left">
          <span class="sb-stat">Showing <strong>{{ paginatedAdverts.length }}</strong> of <strong>{{ filteredAdverts.length }}</strong></span>
          <span class="sb-div">|</span>
          <span class="sb-stat">Pending: <strong class="sb-val--amber">{{ filteredAdverts.filter(a=>!a.isApproved).length }}</strong></span>
          <span class="sb-div">|</span>
          <span class="sb-stat">Approved: <strong class="sb-val--green">{{ filteredAdverts.filter(a=>a.isApproved).length }}</strong></span>
          <span class="sb-div">|</span>
          <span class="sb-stat">Scheduled: <strong class="sb-val--blue">{{ filteredAdverts.filter(a=>a.isScheduled).length }}</strong></span>
        </div>
        <div class="sb-right">
          <button class="pg-btn" :disabled="currentPage <= 1" @click="currentPage--">&#8592;</button>
          <span class="pg-label">Page {{ currentPage }} / {{ totalPages }}</span>
          <button class="pg-btn" :disabled="currentPage >= totalPages" @click="currentPage++">&#8594;</button>
        </div>
      </div>
    </div>

    <!-- ── RECENT UPLOADS ── -->


    <!-- ── MODALS ── -->
    <div v-if="showFilesModal" class="modal-overlay" @click.self="closeFilesModal">
      <div class="xl-modal">
        <div class="xl-modal__head">
          <div>
            <div class="xl-modal__title">Attachments</div>
            <div class="xl-modal__ref">{{ selectedAdvert?.reference }} — {{ selectedAdvert?.clientName }}</div>
          </div>
          <button class="xl-modal__close" @click="closeFilesModal">x</button>
        </div>
        <div class="xl-modal__body">
          <FileList
            :files="selectedAdvert?.attachments || []"
            :loading="false"
            :show-delete="false"
            :show-stats="true"
            @preview="previewFile"
            @download="downloadFile"
          />
        </div>
        <div class="xl-modal__foot">
          <button class="act-btn act-btn--sched" @click="closeFilesModal">Close</button>
        </div>
      </div>
    </div>

    <UploadDesign
      v-if="showUploadModal"
      :advert="selectedAdvert"
      :show="showUploadModal"
      @close="closeUploadModal"
      @uploaded="handleUploadComplete"
    />

    <AdvertScheduler
      v-if="showScheduleModal"
      :advert="selectedAdvert"
      :show="showScheduleModal"
      @close="closeScheduleModal"
      @scheduled="handleScheduleComplete"
    />

    <BriefModal
      v-if="showBriefModal"
      :advert="selectedAdvert"
      @close="closeBriefModal"
    />

  </div>
</template>

<script setup>
import DataTable       from '~/components/common/DataTable.vue'
import AdvertScheduler from '~/components/design/AdvertScheduler.vue'
import BriefModal      from '~/components/design/BriefModal.vue'
import FileList        from '~/components/design/FileList.vue'
import UploadDesign    from '~/components/design/UploadDesign.vue'
import { useDesign }   from '~/composables/useDesign'
import { ref, computed, onMounted, watch } from 'vue'

const {
  adverts, running, upcoming, pendingDesign,
  designApproved, readyToSchedule, scheduled, totalFiles,
  loading, error, loadDesigns, loadDesignStats,
  downloadFiles: downloadAllFiles, markDesignComplete,
  getTodayFormatted, getDateRange, formatDateForAPI,
} = useDesign()

const searchQuery    = ref('')
const platformFilter = ref('')
const productFilter   = ref('')
const viewTab        = ref('all')
const selectedAdvert = ref(null)
const showScheduleModal = ref(false)
const showBriefModal    = ref(false)
const showFilesModal    = ref(false)
const showUploadModal   = ref(false)
const startDate         = ref('')
const endDate           = ref('')
const activeQuickRange  = ref('')
const currentPage       = ref(1)
const pageSize          = 12

const today = getTodayFormatted()

const quickRanges = [
  { key: 'today',      label: 'Today'      },
  { key: 'this_week',  label: 'This Week'  },
  { key: 'this_month', label: 'This Month' },
  { key: 'next_month', label: 'Next Month' },
]

const productOptions = computed(() => {
  const set = new Set(adverts.value.map(a => a.product).filter(p => p && p !== '—'))
  return [...set].sort()
})

const maxAllowedDate = computed(() => {
  const d = new Date(); d.setFullYear(d.getFullYear() + 2)
  return d.toISOString().split('T')[0]
})

const filteredAdverts = computed(() => {
  let list = [...adverts.value]
  if (viewTab.value === 'running')  list = list.filter(a =>  a.runningNow)
  if (viewTab.value === 'upcoming') list = list.filter(a =>  a.isUpcoming)
  if (viewTab.value === 'pending')  list = list.filter(a => !a.isApproved)
  if (viewTab.value === 'approved') list = list.filter(a =>  a.isApproved)
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(a =>
      a.clientName?.toLowerCase().includes(q) ||
      a.advertTitle?.toLowerCase().includes(q) ||
      a.reference?.toLowerCase().includes(q) ||
      a.product?.toLowerCase().includes(q) ||
      a.contactPerson?.toLowerCase().includes(q) ||
      a.contactNumber?.toLowerCase().includes(q) ||
      a.contactEmail?.toLowerCase().includes(q)
    )
  }
  if (platformFilter.value) list = list.filter(a => a.platform === platformFilter.value)
  if (productFilter.value)  list = list.filter(a => a.product === productFilter.value)
  return list
})

const totalPages      = computed(() => Math.max(1, Math.ceil(filteredAdverts.value.length / pageSize)))
const paginatedAdverts = computed(() => {
  const s = (currentPage.value - 1) * pageSize
  return filteredAdverts.value.slice(s, s + pageSize)
})
watch(filteredAdverts, () => { currentPage.value = 1 })
const hasActiveFilters = computed(() => searchQuery.value || platformFilter.value || productFilter.value)

onMounted(async () => {
  const t = getTodayFormatted()
  startDate.value = t; endDate.value = t; activeQuickRange.value = 'today'
  await loadData()
})
watch([startDate, endDate], () => loadData(), { immediate: false })

const loadData = async () => {
  const p = {
    startDate: startDate.value ? formatDateForAPI(startDate.value) : undefined,
    endDate:   endDate.value   ? formatDateForAPI(endDate.value)   : undefined,
  }
  await Promise.all([loadDesigns(p), loadDesignStats(p)])
}
const refreshData = () => loadData()

const handleSearch = () => {}
const applyFilters = () => {}
const resetFilters = () => { searchQuery.value = ''; platformFilter.value = ''; productFilter.value = '' }
const clearSearch         = () => { searchQuery.value = '' }
const clearPlatformFilter = () => { platformFilter.value = '' }
const resetAllFilters = () => {
  resetFilters(); viewTab.value = 'all'
  const t = getTodayFormatted()
  startDate.value = t; endDate.value = t; activeQuickRange.value = 'today'
  loadData()
}
const handleDateChange = () => { activeQuickRange.value = ''; loadData() }
const setQuickDateRange = (range) => {
  activeQuickRange.value = range
  const d = getDateRange(range)
  startDate.value = d.startDate; endDate.value = d.endDate
}

const fmtDate = (s) => {
  if (!s) return '—'
  try { return new Date(s).toLocaleDateString('en-UG', { month: 'short', day: 'numeric', year: 'numeric' }) }
  catch { return s }
}
const fmtShortDate = (s) => {
  if (!s) return '—'
  try { return new Date(s + 'T00:00:00').toLocaleDateString('en-UG', { month: 'short', day: 'numeric' }) }
  catch { return s }
}
const isUrgent = (d) => {
  if (!d) return false
  const days = Math.ceil((new Date(d) - new Date()) / 86400000)
  return days >= 0 && days <= 3
}

const viewAttachments   = (a) => { selectedAdvert.value = a; showFilesModal.value = true }
const closeFilesModal   = () => { showFilesModal.value = false; selectedAdvert.value = null }
const openUploadModal   = (a) => { selectedAdvert.value = a; showUploadModal.value = true }
const closeUploadModal  = () => { showUploadModal.value = false; selectedAdvert.value = null }
const handleUploadComplete = async () => { closeUploadModal(); await refreshData() }
const openScheduleModal  = (a) => { selectedAdvert.value = a; showScheduleModal.value = true }
const closeScheduleModal = () => { showScheduleModal.value = false; selectedAdvert.value = null }
const handleScheduleComplete = async () => { closeScheduleModal(); await refreshData() }
const viewBrief    = (a) => { selectedAdvert.value = a; showBriefModal.value = true }
const closeBriefModal = () => { showBriefModal.value = false; selectedAdvert.value = null }
const previewFile  = (f) => { if (f.url) window.open(f.url, '_blank', 'noopener') }
const downloadFile = (f) => {
  if (!f.url) return
  const a = document.createElement('a')
  a.href = f.url; a.download = f.name || 'file'; a.target = '_blank'
  document.body.appendChild(a); a.click(); document.body.removeChild(a)
}
const handleDownloadFiles = async (advert) => {
  try {
    if (advert.attachmentsCount === 0) { alert('No files available'); return }
    const ok = advert.attachmentsCount > 1 ? confirm(`Download ${advert.attachmentsCount} files for ${advert.reference}?`) : true
    if (ok) await downloadAllFiles(advert.id)
  } catch (e) { alert(`Download failed: ${e.message}`) }
}
const handleMarkComplete = async (advert) => {
  const notes = prompt(`Approve design for ${advert.reference}?\n\nAdd approval notes (optional):`)
  if (notes === null) return
  try {
    const vgamsUser = JSON.parse(localStorage.getItem('vgams_user') || '{}')
    await markDesignComplete(advert.id, notes || '', vgamsUser?.email || '')
    alert(`Design approved for ${advert.reference}`)
    await refreshData()
  } catch (e) { alert(`Failed: ${e.message}`) }
}
</script>

<style scoped>
.dh-page { width:100%; padding-bottom:40px; background:#F2F2F2; font-family:'IBM Plex Sans','Segoe UI',sans-serif; font-size:13px; }

.hd-bar { background:#1F3864; padding:0 20px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px; min-height:54px; border-bottom:3px solid #E31E24; }
.hd-left { display:flex; flex-direction:column; gap:1px; }
.hd-title { color:#fff; font-size:15px; font-weight:700; letter-spacing:.3px; }
.hd-sub { color:#9DC3E6; font-size:11px; }
.hd-right { display:flex; align-items:center; gap:10px; flex-wrap:wrap; padding:8px 0; }
.hd-period { display:flex; align-items:center; gap:6px; }
.hd-label { color:#9DC3E6; font-size:11px; white-space:nowrap; }
.hd-input { background:#162d52; color:#fff; border:1px solid #4a6fa5; padding:4px 8px; font-size:12px; height:28px; border-radius:0; font-family:'IBM Plex Mono',monospace; }
.hd-input:focus { outline:none; border-color:#9DC3E6; }
.hd-quick { display:flex; gap:4px; }
.qr-btn { background:#162d52; color:#9DC3E6; border:1px solid #4a6fa5; padding:3px 9px; font-size:11px; cursor:pointer; border-radius:0; }
.qr-btn:hover { background:#1e4080; color:#fff; }
.qr-btn--active { background:#E31E24; color:#fff; border-color:#E31E24; }
.hd-btn { background:#E31E24; color:#fff; border:none; padding:5px 14px; font-size:12px; font-weight:600; cursor:pointer; border-radius:0; height:28px; }
.hd-btn:disabled { opacity:.6; cursor:not-allowed; }
.hd-btn:hover:not(:disabled) { background:#c01820; }

.flow-strip { display:flex; align-items:center; background:#fff; border-bottom:1px solid #BDD7EE; overflow-x:auto; }
.flow-step { display:flex; flex-direction:column; align-items:center; padding:11px 20px; min-width:100px; border-right:1px solid #DEEAF1; }
.flow-num { font-size:22px; font-weight:700; font-family:'IBM Plex Mono',monospace; line-height:1; }
.flow-lbl { font-size:10px; color:#666; margin-top:2px; white-space:nowrap; text-align:center; }
.flow-arrow { color:#BDD7EE; font-size:12px; padding:0 2px; flex-shrink:0; }
.flow-spacer { flex:1; border-right:2px dashed #DEEAF1; min-width:20px; }
.flow-step--blue  .flow-num { color:#1F3864; }
.flow-step--teal  .flow-num { color:#244F75; }
.flow-step--amber .flow-num { color:#9C5700; }
.flow-step--green .flow-num { color:#375623; }
.flow-step--gold  .flow-num { color:#7F6000; }
.flow-step--navy  .flow-num { color:#203864; }
.flow-step--slate .flow-num { color:#595959; }

.ribbon { background:#fff; border-bottom:1px solid #BDD7EE; margin-bottom:14px; }
.ribbon__tab-strip { display:flex; border-bottom:1px solid #BDD7EE; padding:0 16px; flex-wrap:wrap; }
.tab-btn { display:flex; align-items:center; gap:6px; padding:7px 14px; border:1px solid transparent; border-bottom:none; background:#E8EEF4; color:#555; font-size:12px; font-weight:500; cursor:pointer; margin-right:3px; margin-top:5px; position:relative; bottom:-1px; border-radius:0; }
.tab-btn:hover { background:#DEEAF1; color:#1F3864; }
.tab-btn--active { background:#fff; color:#1F3864; font-weight:700; border-color:#9DC3E6 #9DC3E6 #fff; }
.tab-pill { background:#BDD7EE; color:#1F3864; font-size:10px; font-weight:700; padding:1px 6px; min-width:18px; text-align:center; }
.tab-pill--blue  { background:#DEEAF1; }
.tab-pill--teal  { background:#DDEBF7; color:#244F75; }
.tab-pill--amber { background:#FFEB9C; color:#9C5700; }
.tab-pill--green { background:#E2EFDA; color:#375623; }

.ribbon__filters { display:flex; align-items:center; gap:10px; padding:10px 16px; flex-wrap:wrap; }
.search-wrap { position:relative; flex:1 1 180px; max-width:300px; }
.search-icon { position:absolute; left:8px; top:50%; transform:translateY(-50%); width:14px; height:14px; color:#999; pointer-events:none; }
.xl-input { width:100%; border:1px solid #BDD7EE; padding:5px 8px; font-size:12px; border-radius:0; }
.xl-input--search { padding-left:28px; }
.xl-input:focus,.xl-select:focus { outline:none; border-color:#9DC3E6; box-shadow:0 0 0 2px rgba(157,195,230,.2); }
.xl-select { border:1px solid #BDD7EE; padding:5px 8px; font-size:12px; border-radius:0; min-width:130px; }
.ribbon-btn { padding:5px 12px; border:none; font-size:12px; cursor:pointer; border-radius:0; font-weight:500; }
.ribbon-btn--reset { background:#DEEAF1; color:#1F3864; border:1px solid #9DC3E6; }
.ribbon-btn--reset:hover { background:#c5d9ec; }
.ribbon-btn--primary { background:#E31E24; color:#fff; }
.ribbon-btn--primary:hover { background:#c01820; }
.result-badge { margin-left:auto; font-size:12px; color:#555; white-space:nowrap; }
.result-filtered { color:#999; font-size:11px; }
.ribbon__chips { display:flex; align-items:center; gap:6px; flex-wrap:wrap; padding:6px 16px 10px; border-top:1px solid #DEEAF1; }
.chip-lbl { color:#888; font-size:11px; }
.xl-chip { display:inline-flex; align-items:center; gap:4px; background:#DEEAF1; color:#1F3864; border:1px solid #9DC3E6; padding:2px 8px; font-size:11px; }
.chip-x { background:none; border:none; color:#666; cursor:pointer; font-size:14px; padding:0; line-height:1; }
.chip-x:hover { color:#E31E24; }

.xl-error { background:#FCE4D6; border:1px solid #FF7043; display:flex; align-items:center; gap:12px; padding:10px 16px; margin-bottom:14px; }
.xl-error__icon { font-size:16px; color:#9C0006; font-weight:700; }
.xl-error__title { font-weight:600; color:#9C0006; font-size:13px; }
.xl-error__msg { font-size:12px; color:#5D4037; }

.xl-sheet { background:#fff; border:1px solid #BDD7EE; }
.xl-sheet__head { background:#1F3864; color:#fff; padding:8px 14px; display:flex; justify-content:space-between; align-items:center; }
.xl-sheet__title { font-size:13px; font-weight:600; }
.xl-sheet__count { font-size:11px; color:#9DC3E6; }

.tbl-wrap { overflow-x:auto; }
.xl-tbl { width:100%; border-collapse:collapse; font-size:12px; min-width:1100px; }
.xl-tbl thead tr { background:#1F3864; }
.xl-tbl thead th { color:#fff; font-weight:600; font-size:10px; text-transform:uppercase; letter-spacing:.4px; padding:8px 10px; border-bottom:2px solid #162d52; border-right:1px solid #2e4f7a; text-align:left; white-space:nowrap; }
.xl-tbl thead th:last-child { border-right:none; }
.xl-tbl tbody tr.xl-row:nth-child(even) { background:#F7FBFE; }
.xl-tbl tbody tr.xl-row:hover { background:#EBF4FF; }
.xl-tbl tbody tr.xl-row--scheduled { background:#FFF0EE !important; border-left:3px solid #E31E24; }
.xl-tbl tbody tr.xl-row--scheduled:hover { background:#FFE4E1 !important; }
.xl-tbl tbody tr.xl-row--running  { border-left:3px solid #1F3864; }
.xl-tbl tbody tr.xl-row--upcoming { border-left:3px solid #244F75; }
.xl-tbl tbody tr.xl-row--approved { border-left:3px solid #375623; }
.xl-tbl tbody td { padding:8px 10px; border-bottom:1px solid #DEEAF1; border-right:1px solid #EBF4FF; vertical-align:top; }
.xl-tbl tbody td:last-child { border-right:none; }

.tc-ref      { width:110px; }
.tc-status   { width:88px; }
.tc-client   { min-width:180px; }
.tc-platform { width:110px; }
.tc-product  { width:120px; }
.tc-dates    { width:200px; }
.tc-files    { width:100px; }
.tc-deadline { width:100px; }
.tc-actions  { width:130px; }

.ref-cell { display:flex; flex-direction:column; gap:3px; }
.ref-chip { display:inline-block; font-family:'IBM Plex Mono',monospace; font-size:11px; font-weight:700; color:#1F3864; background:#DEEAF1; border:1px solid #9DC3E6; padding:1px 6px; }
.ref-date { font-size:10px; color:#888; }
.run-badge { display:inline-block; font-size:9px; font-weight:800; letter-spacing:.5px; padding:1px 5px; border:1px solid transparent; }
.run-badge--on   { background:#1F3864; color:#fff; }
.run-badge--soon { background:#DEEAF1; color:#1F3864; border-color:#9DC3E6; }

.cell-stack { display:flex; flex-direction:column; gap:2px; }
.cell-main { font-weight:500; color:#222; }
.cell-sub  { font-size:11px; color:#888; }
.cell-meta { font-size:10px; color:#aaa; font-family:'IBM Plex Mono',monospace; }
.plat-tag  { display:inline-block; background:#DEEAF1; color:#1F3864; border:1px solid #9DC3E6; padding:1px 5px; font-size:10px; font-weight:600; width:fit-content; }

.pub-dates { display:flex; flex-wrap:wrap; gap:3px; align-items:center; }
.pub-none  { font-size:11px; color:#bbb; }
.pub-chip  { display:inline-block; font-family:'IBM Plex Mono',monospace; font-size:10px; font-weight:600; background:#DEEAF1; color:#1F3864; border:1px solid #9DC3E6; padding:1px 5px; }
.pub-chip--today { background:#1F3864; color:#fff; border-color:#1F3864; }
.pub-chip--past  { background:#F7FBFE; color:#aaa; border-color:#DEEAF1; }
.pub-more  { font-size:10px; font-weight:700; color:#1F3864; background:#BDD7EE; border:1px solid #9DC3E6; padding:1px 5px; cursor:help; }
.pub-total { font-size:10px; color:#888; margin-left:2px; white-space:nowrap; }
.prod-name { font-size:11px; font-weight:600; color:#244F75; }
.cell-contact { font-size:10px; color:#6081a3; display:flex; align-items:center; }
.cell-contact-detail { font-size:10px; color:#6081a3; display:flex; align-items:center; }
.cell-contact-email { color:#244F75; }
.cell-product { font-size:10px; color:#244F75; background:#DDEBF7; border:1px solid #9DC3E6; padding:1px 5px; display:inline-flex; align-items:center; width:fit-content; }

.attach-cell { cursor:pointer; padding:2px 4px; display:flex; flex-direction:column; gap:2px; }
.attach-cell:hover { background:#DEEAF1; }
.attach-count { font-size:12px; font-weight:500; color:#333; }
.attach-size  { font-size:10px; color:#888; }
.attach-none  { font-size:10px; color:#bbb; font-style:italic; }

.xlbadge { display:inline-block; font-size:10px; font-weight:700; padding:2px 8px; border:1px solid transparent; text-transform:uppercase; letter-spacing:.3px; }
.xlbadge--pending  { background:#FFEB9C; color:#9C5700; border-color:#FFCC00; }
.xlbadge--approved { background:#E2EFDA; color:#375623; border-color:#92D050; }
.sched-tag { margin-top:3px; font-size:9px; font-weight:600; color:#1F3864; }
.urgent-tag { display:inline-block; background:#FCE4D6; color:#9C0006; border:1px solid #FF7043; font-size:10px; font-weight:700; padding:1px 5px; }

.act-group { display:flex; gap:3px; flex-wrap:wrap; align-items:center; }
.act-btn { display:inline-flex; align-items:center; font-size:11px; font-weight:600; padding:4px 8px; border:1px solid transparent; cursor:pointer; border-radius:0; white-space:nowrap; font-family:inherit; transition:opacity .12s; position:relative; }
.act-btn { display:inline-flex; align-items:center; justify-content:center; width:28px; height:28px; padding:0; border:1px solid transparent; cursor:pointer; border-radius:0; font-family:inherit; transition:opacity .12s; position:relative; }
.act-btn[title]:hover::after {
  content: attr(title);
  position: absolute;
  bottom: calc(100% + 5px);
  left: 50%;
  transform: translateX(-50%);
  background: #1F3864;
  color: #fff;
  font-size: 10px;
  font-weight: 500;
  white-space: nowrap;
  padding: 3px 8px;
  pointer-events: none;
  z-index: 999;
  letter-spacing: .2px;
  box-shadow: 0 2px 6px rgba(0,0,0,.25);
}
.act-btn[title]:hover::before {
  content: '';
  position: absolute;
  bottom: calc(100% + 1px);
  left: 50%;
  transform: translateX(-50%);
  border: 4px solid transparent;
  border-top-color: #1F3864;
  pointer-events: none;
  z-index: 999;
}
.act-btn:disabled { opacity:.45; cursor:not-allowed; }
.act-btn--upload  { background:#1F3864; color:#fff; }
.act-btn--upload:hover  { background:#162d52; }
.act-btn--view    { background:#DEEAF1; color:#1F3864; border-color:#9DC3E6; }
.act-btn--view:hover    { background:#c5d9ec; }
.act-btn--approve { background:#E2EFDA; color:#375623; border-color:#92D050; }
.act-btn--approve:hover { background:#c8e3b4; }
.act-btn--sched   { background:#244F75; color:#fff; }
.act-btn--sched:hover   { background:#1a3a59; }
.act-btn--brief   { background:#FFF2CC; color:#7F6000; border-color:#FFD966; }
.act-btn--brief:hover   { background:#ffe08a; }
.act-btn--dl      { background:#F7FBFE; color:#555; border-color:#BDD7EE; }
.act-btn--dl:hover      { background:#DEEAF1; }

.status-bar { background:#DEEAF1; border-top:1px solid #9DC3E6; padding:6px 14px; display:flex; justify-content:space-between; align-items:center; font-size:11px; color:#555; }
.sb-left { display:flex; align-items:center; gap:10px; }
.sb-stat { white-space:nowrap; }
.sb-div  { color:#9DC3E6; }
.sb-val--green { color:#375623; }
.sb-val--amber { color:#9C5700; }
.sb-val--blue  { color:#1F3864; }
.sb-right { display:flex; align-items:center; gap:6px; }
.pg-btn { background:#DEEAF1; border:1px solid #9DC3E6; color:#1F3864; padding:2px 8px; font-size:12px; cursor:pointer; border-radius:0; }
.pg-btn:disabled { opacity:.4; cursor:default; }
.pg-label { font-size:11px; font-weight:500; color:#1F3864; white-space:nowrap; }

.state-box { text-align:center; padding:56px 20px; background:#F7FBFE; border-top:1px solid #DEEAF1; }
.state-box__icon  { font-size:34px; margin-bottom:12px; opacity:.4; }
.state-box__title { font-size:14px; font-weight:600; color:#555; margin-bottom:6px; }
.state-box p { font-size:12px; color:#999; margin:0 0 14px; }
.spinner { width:30px; height:30px; border:3px solid #DEEAF1; border-top-color:#1F3864; border-radius:50%; animation:spin .9s linear infinite; margin:0 auto 12px; }
@keyframes spin { to { transform:rotate(360deg); } }

.modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,.7); backdrop-filter:blur(3px); display:flex; align-items:center; justify-content:center; z-index:3000; padding:20px; }
.xl-modal { background:#fff; width:100%; max-width:640px; max-height:88vh; display:flex; flex-direction:column; border-top:4px solid #1F3864; }
.xl-modal__head { background:#1F3864; padding:14px 18px; display:flex; justify-content:space-between; align-items:flex-start; }
.xl-modal__title { color:#fff; font-size:14px; font-weight:700; }
.xl-modal__ref { color:#9DC3E6; font-size:11px; font-family:'IBM Plex Mono',monospace; margin-top:2px; }
.xl-modal__close { background:none; border:none; color:#9DC3E6; font-size:22px; cursor:pointer; line-height:1; padding:0; }
.xl-modal__close:hover { color:#fff; }
.xl-modal__body { flex:1; overflow-y:auto; padding:18px; }
.xl-modal__foot { padding:10px 18px; border-top:1px solid #DEEAF1; display:flex; justify-content:flex-end; background:#F7FBFE; }

@media (max-width:768px) {
  .hd-bar { flex-direction:column; align-items:flex-start; padding:10px 14px; }
  .flow-strip { overflow-x:auto; }
  .flow-step { min-width:84px; padding:9px 12px; }
  .ribbon__filters { flex-direction:column; align-items:stretch; }
  .xl-modal { max-width:100%; }
}
</style>