<!-- pages/dashboard/admin.vue -->
<!--
  Administrator Hub — component-based, no page reload on section switch.

  layout: 'admin' →  uses layouts/admin.vue — bare full-screen wrapper.
                    No AppHeader, no SideMenu, no margin/padding offsets.
                    Place layouts/admin.vue in your layouts/ directory.

  Confirmed component imports (from uploaded page wrappers):
    booking_new      → ~/components/clerk/New.vue
    sub_editor       → ~/components/editor/Index.vue
    finance_index    → ~/components/finance/Indexpage.vue
    finance_payments → ~/components/finance/payments.vue
    finance_reports  → ~/components/finance/Reports.vue  (Nuxt auto-import)

  Not yet confirmed (overwritten uploads):
    advertising_manager  → nav panel (component path not yet provided)
-->
<template>

  <!-- Auth gate: hidden until onMounted confirms administrator role -->
  <div v-if="!authReady" class="auth-loading">
    <div class="auth-spinner"></div>
    <span class="auth-text">Verifying access…</span>
  </div>

  <div v-else class="admin-shell">

    <!-- ═══════════════════════════ RAIL ═══════════════════════════ -->
    <nav class="rail">

      <div class="rail__brand">
        <svg class="rail__logo" viewBox="0 0 28 28" fill="none">
          <rect width="28" height="28" fill="#003366"/>
          <path d="M6 8h16M6 14h10M6 20h13" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/>
        </svg>
        <div class="rail__name">VGAMS<br><small>Admin Hub</small></div>
      </div>

      <div class="rail__scroll">

        <button class="rail__item" :class="{ 'rail__item--on': s === 'overview' }" @click="go('overview')">
          <span v-html="ic.home"></span>Overview
        </button>

        <p class="rail__grp">Booking Clerk</p>

        <button class="rail__item" :class="{ 'rail__item--on': s === 'booking_list' }" @click="go('booking_list')">
          <span v-html="ic.list"></span>Booking List
          <em v-if="kpi.drafts" class="rail__dot">{{ kpi.drafts }}</em>
        </button>

        <button class="rail__item" :class="{ 'rail__item--on': s === 'booking_new' }" @click="go('booking_new')">
          <span v-html="ic.plus"></span>New Booking
        </button>

        <p class="rail__grp">Workflow</p>

        <button class="rail__item" :class="{ 'rail__item--on': s === 'copy_desk' }" @click="go('copy_desk')">
          <span v-html="ic.grid"></span>Copy Desk — Day's Layout
        </button>
        <button class="rail__item" :class="{ 'rail__item--on': s === 'sub_editor' }" @click="go('sub_editor')">
          <span v-html="ic.grid"></span>Copy Desk — Pager
        </button>
        <!----
        <button class="rail__item" :class="{ 'rail__item--on': s === 'advertising_manager' }" @click="go('advertising_manager')">
          <span v-html="ic.tick"></span>Ad. Manager
          <em v-if="kpi.submitted" class="rail__dot">{{ kpi.submitted }}</em>
        </button>
      -->
        <button class="rail__item" :class="{ 'rail__item--on': s === 'design_house' }" @click="go('design_house')">
          <span v-html="ic.design"></span>Design House
        </button>
        <button class="rail__item" :class="{ 'rail__item--on': s === 'design_house_manager' }" @click="go('design_house_manager')">
          <span v-html="ic.bar"></span>Design House Reports
        </button>

        <p class="rail__grp">Invoicing</p>

        <button class="rail__item" :class="{ 'rail__item--on': s === 'invoicing_queue' }" @click="go('invoicing_queue')">
          <span v-html="ic.tick"></span>Invoicing Queue
        </button>
        <button class="rail__item" :class="{ 'rail__item--on': s === 'invoicing_register' }" @click="go('invoicing_register')">
          <span v-html="ic.list"></span>Invoice Register
        </button>
        <button class="rail__item" :class="{ 'rail__item--on': s === 'print_class_report' }" @click="go('print_class_report')">
          <span v-html="ic.bar"></span>Display vs Classified
        </button>

        <p class="rail__grp">Finance</p>

        <button class="rail__item" :class="{ 'rail__item--on': s === 'finance_index' }" @click="go('finance_index')">
          <span v-html="ic.dollar"></span>Finance Dashboard
        </button>

        <button class="rail__item" :class="{ 'rail__item--on': s === 'finance_payments' }" @click="go('finance_payments')">
          <span v-html="ic.card"></span>Payments
          <em v-if="kpi.pending" class="rail__dot">{{ kpi.pending }}</em>
        </button>

        <button class="rail__item" :class="{ 'rail__item--on': s === 'finance_reports' }" @click="go('finance_reports')">
          <span v-html="ic.bar"></span>Reports
        </button>

        <p class="rail__grp">Testing</p>

        <button class="rail__item" :class="{ 'rail__item--on': s === 'payment_training' }" @click="go('payment_training')">
          <span v-html="ic.flask"></span>Payment Training
        </button>

        <button class="rail__item" :class="{ 'rail__item--on': s === 'settings' }" @click="go('settings')">
          <span v-html="ic.settings"></span>Settings
        </button>

        <p class="rail__grp">System</p>

        <button class="rail__item" :class="{ 'rail__item--on': s === 'user_management' }" @click="go('user_management')">
          <span v-html="ic.users"></span>User Management
        </button>

      </div><!-- /rail__scroll -->

      <div class="rail__foot">
        <div class="rail__av">{{ initials }}</div>
        <div>
          <div class="rail__uname">{{ displayName }}</div>
          <div class="rail__urole">Administrator</div>
        </div>
      </div>

    </nav><!-- /rail -->

    <!-- ═══════════════════════════ MAIN ═══════════════════════════ -->
    <div class="main">

      <!-- Topbar -->
      <div class="topbar">
        <div>
          <div class="topbar__eye">VGAMS · Administrator</div>
          <h1 class="topbar__h1">{{ titles[s] }}</h1>
        </div>
        <div class="topbar__right">
          <transition name="tf">
            <span v-if="toast" class="topbar__toast">{{ toast }}</span>
          </transition>
          <span class="topbar__clk">{{ clk }}</span>
        </div>
      </div>

      <!-- Content — v-show keeps all components mounted, just hidden -->
      <div class="body">

        <!-- ── OVERVIEW ──────────────────────────────── -->
        <div v-show="s === 'overview'">
          <div class="kpi-band">
            <div class="kpi-c kpi--nv"><span class="kv">{{ kpi.total }}</span><span class="kl">Total Adverts</span></div>
            <div class="kd"></div>
            <div class="kpi-c kpi--am"><span class="kv">{{ kpi.drafts }}</span><span class="kl">Drafts</span></div>
            <div class="kd"></div>
            <div class="kpi-c kpi--bl"><span class="kv">{{ kpi.submitted }}</span><span class="kl">Awaiting Approval</span></div>
            <div class="kd"></div>
            <div class="kpi-c kpi--gn"><span class="kv">{{ kpi.scheduled }}</span><span class="kl">Scheduled</span></div>
          </div>
          <div class="ov-tiles">
            <button v-for="ws in workspaces" :key="ws.id" class="ov-tile" @click="go(ws.id)">
              <div class="ov-ico" :class="ws.cls" v-html="ws.icon"></div>
              <div class="ov-body">
                <div class="ov-lbl">{{ ws.label }}</div>
                <div class="ov-desc">{{ ws.desc }}</div>
                <code class="ov-key">{{ ws.key }}</code>
              </div>
              <span class="ov-arr" v-html="ic.arr"></span>
            </button>
          </div>
        </div>

        <!-- ── BOOKING LIST ──────────────────────────────────────────
             ~/components/clerk/Indexpage.vue
        -->
        <div v-show="s === 'booking_list'" class="bare">
          <ClerkIndexpage />
        </div>

        <!-- ── NEW BOOKING ────────────────────────────────────────────
             pages/dashboard/booking/new.vue:
               import New from '~/components/clerk/New.vue'
        -->
        <div v-show="s === 'booking_new'" class="bare">
          <New />
        </div>

        <!-- ── SUB-EDITOR ──────────────────────────────────────────────
             ~/components/editor/Index.vue
        -->
        <div v-show="s === 'sub_editor'" class="bare">
          <EditorIndex />
        </div>

        <!-- ── WORKFLOW RE-ORDER (mounted only when opened: v-if, so the
             Hub does not load every day's bookings on first paint) ──── -->
        <div v-if="s === 'copy_desk'" class="bare padded">
          <CopyDeskWorkspace />
        </div>
        <div v-if="s === 'invoicing_queue'" class="bare padded">
          <InvoicingWorkspace mode="queue" />
        </div>
        <div v-if="s === 'invoicing_register'" class="bare padded">
          <InvoicingWorkspace mode="register" />
        </div>
        <div v-if="s === 'print_class_report'" class="bare padded">
          <PrintClassReport />
        </div>


        <!-- ── ADVERTISING MANAGER ──────────────────────────────────── -->
        <div v-show="s === 'advertising_manager'" class="nav-panel">
          <div class="np-ico ws-ic--mgr" v-html="ic.tick"></div>
          <div class="np-body">
            <div class="np-title">Advertising Manager <code>pages/dashboard/approval/index.vue</code></div>
            <p class="np-desc">Approval queue for submitted adverts. Approve or reject, add comments, monitor revenue targets. Upload the approval index.vue to confirm the component name.</p>
            <div class="np-perms">
              <span class="pm">approve_adverts</span><span class="pm">financial_oversight</span><span class="pm">view_reports</span>
            </div>
          </div>
          <button class="open-btn" @click="push('/dashboard/approval')">
            <span v-html="ic.arr"></span> Open Approval Workspace
          </button>
        </div>

        <!-- ── DESIGN HOUSE ──────────────────────────────────────────
             ~/components/design/Index.vue
        -->
        <div v-show="s === 'design_house'" class="bare">
          <DesignIndex />
        </div>

        <!-- ── DESIGN HOUSE REPORTS ────────────────────────────────────
             ~/components/design/DesignerHandledDashboard.vue
             Supervision view — what each designer has handled, per day.
        -->
        <div v-show="s === 'design_house_manager'" class="bare">
          <DesignerHandledDashboard />
        </div>

        <!-- ── FINANCE DASHBOARD ────────────────────────────────────────
             ~/components/finance/Indexpage.vue
        -->
        <div v-show="s === 'finance_index'" class="bare">
          <FinanceIndex />
        </div>

        <!-- ── PAYMENTS ─────────────────────────────────────────────────
             pages/dashboard/finance/payments.vue:
               import payments from '~/components/finance/payments.vue'
        -->
        <div v-show="s === 'finance_payments'" class="bare">
          <payments />
        </div>

        <!-- ── REPORTS ──────────────────────────────────────────────────
             ~/components/finance/reports.vue
        -->
        <div v-show="s === 'finance_reports'" class="bare">
          <FinanceReports />
        </div>

        <div v-show="s === 'settings'" class="bare">
          <Settings />
        </div>

        <!-- ── PAYMENT TRAINING (BC Test Bypass) ─────────────────────────
             ~/components/admin/BcTestBypass.vue
             Dev/test tool — simulate BC-confirmed payment + reshape
             start_date/end_date/publishing_dates without a real BC call.
             Gated server-side by ALLOW_BC_TEST_BYPASS=true.
        -->
        <div v-show="s === 'payment_training'" class="bare padded">
          <BcTestBypass />
        </div>

        <!-- ── USER MANAGEMENT ─────────────────────────────────────────
             ~/components/admin/UserManagement.vue
        -->
        <div v-show="s === 'user_management'" class="bare">
          <UserManagement />
        </div>

      </div><!-- /body -->
    </div><!-- /main -->
  </div><!-- /admin-shell -->
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from '#imports'
import { navigateTo } from '#app'

// ── Component imports — identical paths to the role page wrappers ──────────
// booking
import ClerkIndexpage from '~/components/clerk/Indexpage.vue'   // booking list
import New            from '~/components/clerk/New.vue'          // new booking

// editor
import EditorIndex from '~/components/editor/Index.vue'          // sub-editor
import CopyDeskWorkspace  from '~/components/copydesk/CopyDeskWorkspace.vue'     // copy desk (workflow re-order)
import InvoicingWorkspace from '~/components/invoicing/InvoicingWorkspace.vue'   // invoicing officer
import PrintClassReport   from '~/components/reports/PrintClassReport.vue'       // display vs classified

// finance
import FinanceIndex   from '~/components/finance/Indexpage.vue'  // finance dashboard
import payments       from '~/components/finance/payments.vue'   // payments
import FinanceReports from '~/components/finance/reports.vue'    // reports

// design
import DesignIndex from '~/components/design/DesignDeskWorkspace.vue'          // design house
import DesignerHandledDashboard from '~/components/design/DesignerHandledDashboard.vue' // design house reports

import { useAuth }     from '~/composables/useAuth'
import { useAdverts }  from '~/composables/useAdverts'
import { usePayments } from '~/composables/usePayments'

import Settings from '~/components/admin/Settings.vue'
import BcTestBypass from '~/components/admin/BcTestBypass.vue'
import UserManagement from '~/components/admin/UserManagement.vue'

// ── layout: 'admin' ──────────────────────────────────────────────────────────
// Uses layouts/admin.vue — a bare full-screen wrapper with no AppHeader,
// no SideMenu, and no margin/padding offsets from layouts/default.vue.
// Place layouts/admin.vue in your project's layouts/ directory.
definePageMeta({
  layout: 'admin',  // → layouts/admin.vue — bare full-screen wrapper, no AppHeader/SideMenu
  // No middleware here — auth middleware reads isAuthenticated from the Pinia store,
  // but the store is not yet hydrated from localStorage when middleware runs,
  // so isAuthenticated is false and the middleware redirects to /login.
  // Auth + role are enforced client-side in onMounted via auth.initAuth().
})
// ── Auth ───────────────────────────────────────────────────────────────────
// Keep full auth object — don't destructure userName/userInitials since they
// are Pinia store getter values and lose reactivity when destructured as plain
// values from the composable return object.
const auth = useAuth()
const authReady   = ref(false)
const displayName = ref('')
const initials    = ref('')
const router      = useRouter()

// ── Composables ────────────────────────────────────────────────────────────
const {
  adverts, loadAdverts,
  getFullSchedules, updateSchedulePage, toggleSchedulePublish,
  updateSchedule, unscheduleAdvert, bulkUpdateSchedulePages,
} = useAdverts()

const { pendingPayments, loadTransactions } = usePayments()

// ── UI state ───────────────────────────────────────────────────────────────
const s     = ref('overview')   // active section id
const toast = ref('')
const clk   = ref('')
let   clkT  = null

// ── Section titles ─────────────────────────────────────────────────────────
const titles = {
  overview:            'Administrator Overview',
  booking_list:        'Booking Clerk — Booking List',
  booking_new:         'Booking Clerk — New Booking',
  sub_editor:          'Copy Desk — Pager & Print Queue',
  copy_desk:           "Copy Desk — Day's Layout",
  invoicing_queue:     'Invoicing — Confirm & Invoice',
  invoicing_register:  'Invoicing — Invoice Register',
  print_class_report:  'Reports — Display vs Classified',
  advertising_manager: 'Advertising Manager — Approval',
  design_house:        'Design House — Creatives',
  design_house_manager: 'Design House — Handled Report',
  finance_index:       'Finance Dashboard',
  finance_payments:    'Finance — Payments',
  finance_reports:     'Finance — Reports',
  payment_training:    'Payment Training — BC Test Bypass',
  user_management:     'System — User Management',
}

// ── Icons ──────────────────────────────────────────────────────────────────
const ic = {
  home:   `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  list:   `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
  plus:   `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
  grid:   `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="1"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>`,
  tick:   `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>`,
  design: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>`,
  dollar: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>`,
  card:   `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="1" y="4" width="22" height="16" rx="1"/><line x1="1" y1="10" x2="23" y2="10"/></svg>`,
  bar:    `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
  arr:    `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`,
  settings: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H5.78a1.65 1.65 0 0 0-1.51 1 1.65 1.65 0 0 0 .33 1.82l.03.03A10 10 0 0 0 12 17.66a10 10 0 0 0 6.37-2.63z"/></svg>`,
  flask:    `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 2v6.5L3.5 18a2 2 0 001.7 3h13.6a2 2 0 001.7-3L15 8.5V2"/><path d="M8.5 2h7"/><path d="M6.5 15h11"/></svg>`,
  users:    `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>`,
}

// ── Overview tiles ─────────────────────────────────────────────────────────
const workspaces = [
  { id:'booking_list',        label:'Booking List',      desc:'View and manage all bookings.',                   key:'booking_clerk',       icon:ic.list,   cls:'ws-ic--clerk'   },
  { id:'booking_new',         label:'New Booking',       desc:'Create a new advertising booking.',               key:'booking_clerk',       icon:ic.plus,   cls:'ws-ic--clerk'   },
  { id:'sub_editor',          label:'Sub-Editor',        desc:'Schedule queue — assign pages, publish.',         key:'sub_editor',          icon:ic.grid,   cls:'ws-ic--editor'  },
  { id:'advertising_manager', label:'Ad. Manager',       desc:'Approve or reject submitted adverts.',            key:'advertising_manager', icon:ic.tick,   cls:'ws-ic--mgr'     },
  { id:'design_house',        label:'Design House',      desc:'Upload creative files, manage versions.',         key:'design_house',        icon:ic.design, cls:'ws-ic--design'  },
  { id:'design_house_manager', label:'Design House Reports', desc:'What each designer has handled, per day.',    key:'design_house_manager', icon:ic.bar,   cls:'ws-ic--design'  },
  { id:'finance_index',       label:'Finance Dashboard', desc:'Revenue overview and financial KPIs.',            key:'finance_team',        icon:ic.dollar, cls:'ws-ic--finance' },
  { id:'finance_payments',    label:'Payments',          desc:'Record payments, track collections.',             key:'finance_team',        icon:ic.card,   cls:'ws-ic--finance' },
  { id:'finance_reports',     label:'Reports',           desc:'Generate and export revenue reports.',            key:'finance_team',        icon:ic.bar,    cls:'ws-ic--finance' },
  { id:'payment_training',    label:'Payment Training',  desc:'Simulate BC-confirmed payment for testing.',      key:'administrator',       icon:ic.flask,  cls:'ws-ic--test'    },
  { id:'settings', label:'Settings', desc:'System configuration and client sync.', key:'administrator', icon:ic.settings, cls:'ws-ic--settings' },
  { id:'user_management', label:'User Management', desc:'Create, edit, and deactivate VGAMS accounts.', key:'administrator', icon:ic.users, cls:'ws-ic--settings' },
]

// ── KPI ────────────────────────────────────────────────────────────────────
const kpi = computed(() => ({
  total:     adverts.value.length,
  drafts:    adverts.value.filter(a => a.status === 'draft').length,
  submitted: adverts.value.filter(a => a.status === 'submitted').length,
  scheduled: adverts.value.filter(a => a.status === 'scheduled').length,
  pending:   pendingPayments.value || null,
}))

// ── Navigation ─────────────────────────────────────────────────────────────
const go   = (id) => { s.value = id }
const push = (r)  => { router.push(r) }

const showToast = (msg) => {
  toast.value = msg; setTimeout(() => { toast.value = '' }, 3000)
}

// ── Clock ──────────────────────────────────────────────────────────────────
const tick = () => {
  clk.value = new Date().toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

// ═══════════════════════════════════════════════════════════════════════════
//  EDITOR (sub_editor) — state and handlers from pages/editor/index.vue
// ═══════════════════════════════════════════════════════════════════════════
const eLoading    = ref(false)
const eErr        = ref('')
const eToast      = ref('')
const schedules   = ref([])
const showEdit    = ref(false)
const editTarget  = ref(null)
const showBulk    = ref(false)
const bulkTargets = ref([])
const showMedia   = ref(false)
const mediaTarget = ref(null)

const ef     = ref({ dateFrom:'', dateTo:'', status:'', search:'' })
const eRange = ref('This Week')

const qRanges = [
  { label:'Today',      days:0  },
  { label:'This Week',  days:7  },
  { label:'Next 14d',   days:14 },
  { label:'This Month', days:30 },
]

const applyRange = (r) => {
  const today = new Date(), end = new Date()
  end.setDate(today.getDate() + r.days)
  ef.value.dateFrom = today.toISOString().split('T')[0]
  ef.value.dateTo   = end.toISOString().split('T')[0]
  eRange.value      = r.label
  editorLoad()
}

const eStats = computed(() => ({
  total:     filteredSchedules.value.length,
  noPage:    filteredSchedules.value.filter(s => !s.page || s.page === 0).length,
  paged:     filteredSchedules.value.filter(s => s.page > 0 && !s.is_published).length,
  published: filteredSchedules.value.filter(s => s.is_published).length,
  withMedia: filteredSchedules.value.filter(s => s.media?.length > 0).length,
}))

const filteredSchedules = computed(() => {
  let list = [...schedules.value]
  if (ef.value.status === 'scheduled')       list = list.filter(x => !x.is_published && (!x.page || x.page === 0))
  else if (ef.value.status === 'paged')      list = list.filter(x => x.page > 0 && !x.is_published)
  else if (ef.value.status === 'published')  list = list.filter(x => x.is_published)
  if (ef.value.search) {
    const q = ef.value.search.toLowerCase()
    list = list.filter(x =>
      (x.company_name   || '').toLowerCase().includes(q) ||
      (x.advert_title   || '').toLowerCase().includes(q) ||
      (x.contact_person || '').toLowerCase().includes(q) ||
      String(x.advert_id || '').includes(q)
    )
  }
  return list
})

const editorLoad = async () => {
  eErr.value = ''; eLoading.value = true
  try {
    const params = {}
    if (ef.value.dateFrom) params.startDate = ef.value.dateFrom
    if (ef.value.dateTo)   params.endDate   = ef.value.dateTo
    const r = await getFullSchedules(params)
    schedules.value = Array.isArray(r) ? r : (r?.data || [])
  } catch (e) {
    eErr.value = e.message || 'Failed to load schedules'
  } finally { eLoading.value = false }
}

const eShowToast = (msg) => {
  eToast.value = msg; setTimeout(() => { eToast.value = '' }, 2800)
}

const patchLocal = (id, patch) => {
  const i = schedules.value.findIndex(x => x.schedule_id === id)
  if (i !== -1) schedules.value[i] = { ...schedules.value[i], ...patch }
}

const onPageUpdate = async (scheduleId, page) => {
  try {
    await updateSchedulePage(scheduleId, page)
    patchLocal(scheduleId, { page })
    eShowToast(`Page ${page} assigned`)
  } catch (e) { eErr.value = e.message || 'Failed to update page' }
}

const onPublishToggle = async (scheduleId, isPublished) => {
  const item = schedules.value.find(x => x.schedule_id === scheduleId)
  if (isPublished && item && (!item.page || item.page < 1)) {
    eErr.value = 'Assign a page / slot number before publishing this schedule.'
    return
  }
  try {
    await toggleSchedulePublish(scheduleId, isPublished)
    patchLocal(scheduleId, { is_published: isPublished })
    eShowToast(isPublished ? 'Schedule published' : 'Schedule unpublished')
  } catch (e) { eErr.value = e.data?.error?.message || e.message || 'Failed to toggle publish' }
}

const onEdit      = (item) => { editTarget.value = item; showEdit.value = true }
const onViewMedia = (item) => { mediaTarget.value = item; showMedia.value = true }
const onBulkPage  = (targets) => { bulkTargets.value = targets; showBulk.value = true }

const onSaveSchedule = async ({ scheduleId, runDate, runTime, page, isPublished }) => {
  try {
    if (runDate || runTime) await updateSchedule(scheduleId, { runDate, runTime })
    const ex = schedules.value.find(x => x.schedule_id === scheduleId)
    if (ex && page !== ex.page) await updateSchedulePage(scheduleId, page)
    if (ex && isPublished !== ex.is_published) await toggleSchedulePublish(scheduleId, isPublished)
    patchLocal(scheduleId, {
      run_date: runDate || ex?.run_date,
      run_time: runTime || ex?.run_time,
      page,
      is_published: isPublished,
    })
    showEdit.value = false
    eShowToast('Schedule updated')
  } catch (e) { eErr.value = e.message || 'Failed to save schedule' }
}

const onUnschedule = async (scheduleId) => {
  try {
    await unscheduleAdvert(scheduleId)
    schedules.value = schedules.value.filter(x => x.schedule_id !== scheduleId)
    eShowToast('Schedule removed')
  } catch (e) { eErr.value = e.message || 'Failed to remove schedule' }
}

const onBulkSave = async (changes) => {
  try {
    await bulkUpdateSchedulePages(changes)
    changes.forEach(({ scheduleId, page }) => patchLocal(scheduleId, { page }))
    showBulk.value = false
    eShowToast(`${changes.length} page${changes.length !== 1 ? 's' : ''} updated`)
  } catch (e) { eErr.value = e.message || 'Bulk update failed' }
}

// ── Lifecycle ──────────────────────────────────────────────────────────────
onMounted(() => {
  // 1. Hydrate auth from localStorage
  const result = auth.initAuth()

  if (!result?.isAuthenticated) {
    navigateTo('/login')
    return
  }

  // 2. Enforce administrator role and populate display name
  //    Read from initAuth result.user (same object saved to localStorage)
  const user = result.user
  if (!user || user.role !== 'administrator') {
    navigateTo('/unauthorized')
    return
  }

  // 3. Set display values from the confirmed user object
  displayName.value = user.name || user.email || 'Administrator'
  initials.value    = (user.name || user.email || 'A')
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  // 4. Show the page
  authReady.value = true
  tick()
  clkT = setInterval(tick, 1000)

  // 5. Load KPI data (non-blocking)
  loadAdverts().catch(() => {})
  loadTransactions().catch(() => {})

  // 6. Pre-load editor queue
  applyRange({ label: 'This Week', days: 7 })
})

onUnmounted(() => { if (clkT) clearInterval(clkT) })
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap');

/* ── Tokens ──────────────────────────────────────────────────────────────── */
.admin-shell {
  --nv: #003366; --nvd: #002244; --nvl: #004080;
  --rd: #E31E24;
  --bl: #0066CC; --bll: #EEF4FF;
  --sf: #FFFFFF; --pg: #F0F4F8;
  --bd: #D1D9E0; --bdl: #E8ECF0;
  --t1: #0F172A; --t2: #334155; --t3: #64748B; --t4: #94A3B8;
  --r: 2px; --t: 140ms ease;
  --fn: "IBM Plex Sans", -apple-system, "Segoe UI", sans-serif;
  --mn: "IBM Plex Mono", "Courier New", monospace;
  --sh: 0 1px 3px rgba(0,0,0,.07), 0 1px 2px rgba(0,0,0,.05);
  --shm: 0 4px 16px rgba(0,0,0,.10);

  /* Full viewport — layouts/admin.vue is a bare wrapper with no offsets */
  display: flex;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  font-family: var(--fn);
  font-size: 13px;
  color: var(--t1);
  background: var(--pg);
}

/* ── Auth loading ─────────────────────────────────────────────────────────── */
.auth-loading {
  position: fixed; inset: 0; background: var(--nv);
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px;
}
.auth-spinner {
  width: 32px; height: 32px;
  border: 3px solid rgba(255,255,255,.15); border-top-color: #9DC3E6;
  border-radius: 50%; animation: spin .7s linear infinite;
}
.auth-text { font-size: 12px; font-weight: 500; color: rgba(255,255,255,.4); letter-spacing: .04em; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Rail ─────────────────────────────────────────────────────────────────── */
.rail {
  width: 204px; flex-shrink: 0; background: var(--nv);
  display: flex; flex-direction: column; border-right: 1px solid var(--nvd);
}

.rail__brand {
  display: flex; align-items: center; gap: 10px;
  padding: 16px 14px 12px; border-bottom: 1px solid rgba(255,255,255,.07); flex-shrink: 0;
}
.rail__logo { width: 26px; height: 26px; flex-shrink: 0; }
.rail__name { font-size: 12px; font-weight: 700; color: #fff; letter-spacing: .04em; line-height: 1.3; }
.rail__name small { font-size: 9px; font-weight: 400; color: rgba(255,255,255,.4); text-transform: uppercase; letter-spacing: .08em; display: block; }

.rail__scroll {
  flex: 1; overflow-y: auto; padding: 8px;
  display: flex; flex-direction: column; gap: 1px;
}

.rail__grp {
  font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em;
  color: rgba(255,255,255,.28); padding: 10px 10px 4px; margin: 0;
}

.rail__item {
  display: flex; align-items: center; gap: 9px; padding: 8px 10px;
  border: none; background: none; color: rgba(255,255,255,.55); border-radius: var(--r);
  cursor: pointer; font-family: var(--fn); font-size: 12px; font-weight: 500;
  text-align: left; width: 100%; transition: background var(--t), color var(--t); position: relative;
}
.rail__item:hover  { background: rgba(255,255,255,.07); color: rgba(255,255,255,.85); }
.rail__item--on {
  background: rgba(255,255,255,.12); color: #fff; font-weight: 600;
}
.rail__item--on::before {
  content: ''; position: absolute; left: 0; top: 5px; bottom: 5px;
  width: 3px; background: #9DC3E6; border-radius: 0 2px 2px 0;
}
.rail__dot {
  margin-left: auto; min-width: 16px; height: 16px; padding: 0 4px;
  background: var(--rd); color: #fff; font-size: 9px; font-weight: 700;
  border-radius: 8px; display: inline-flex; align-items: center; justify-content: center;
  font-style: normal;
}

.rail__foot {
  display: flex; align-items: center; gap: 9px;
  padding: 10px 12px; border-top: 1px solid rgba(255,255,255,.07); flex-shrink: 0;
}
.rail__av    { width: 26px; height: 26px; background: rgba(255,255,255,.13); border: 1px solid rgba(255,255,255,.18); border-radius: var(--r); display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 10px; flex-shrink: 0; }
.rail__uname { color: rgba(255,255,255,.85); font-size: 11px; font-weight: 600; }
.rail__urole { color: rgba(255,255,255,.35); font-size: 9px; text-transform: uppercase; letter-spacing: .06em; }

/* ── Main ─────────────────────────────────────────────────────────────────── */
.main { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0; }

/* ── Topbar ───────────────────────────────────────────────────────────────── */
.topbar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 22px 9px; background: var(--sf);
  border-bottom: 2px solid #DEEAF1; flex-shrink: 0; gap: 16px;
}
.topbar__eye   { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .07em; color: var(--t4); margin-bottom: 2px; }
.topbar__h1    { font-size: 17px; font-weight: 700; color: var(--nv); margin: 0; }
.topbar__right { display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
.topbar__toast { padding: 5px 12px; font-size: 11px; font-weight: 600; background: #F0FDF4; color: #166534; border: 1px solid #86EFAC; border-radius: var(--r); }
.topbar__clk   { font-family: var(--mn); font-size: 11px; color: var(--t4); }
.tf-enter-active, .tf-leave-active { transition: opacity .2s ease; }
.tf-enter-from,   .tf-leave-to     { opacity: 0; }

/* ── Body / content area ──────────────────────────────────────────────────── */
.body { flex: 1; overflow-y: auto; min-height: 0; }

/* Bare: zero extra chrome — imported component controls its own layout */
.bare { width: 100%; min-height: 100%; }

/* ── Overview KPI band ────────────────────────────────────────────────────── */
.kpi-band { display: flex; background: var(--nv); border-bottom: 3px solid var(--nvd); }
.kpi-c    { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 14px 12px; gap: 3px; }
.kd       { width: 1px; background: rgba(157,195,230,.15); flex-shrink: 0; }
.kv       { font-size: 22px; font-weight: 700; color: #fff; font-family: var(--mn); line-height: 1; }
.kl       { font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; color: rgba(255,255,255,.4); }
.kpi--am .kv { color: #FFCC00; }
.kpi--bl .kv { color: #9DC3E6; }
.kpi--gn .kv { color: #A9D18E; }

/* ── Overview tiles ───────────────────────────────────────────────────────── */
.ov-tiles { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; padding: 18px 22px; }
.ov-tile  { display: flex; align-items: center; gap: 12px; padding: 14px 16px; background: var(--sf); border: 1px solid var(--bdl); border-radius: var(--r); box-shadow: var(--sh); cursor: pointer; text-align: left; font-family: var(--fn); color: inherit; transition: box-shadow var(--t), border-color var(--t), background var(--t); }
.ov-tile:hover { border-color: var(--bl); box-shadow: var(--shm); background: var(--bll); }
.ov-tile:hover .ov-arr { opacity: 1; transform: translateX(3px); }
.ov-ico  { width: 36px; height: 36px; border-radius: var(--r); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.ov-body { flex: 1; min-width: 0; }
.ov-lbl  { font-size: 12px; font-weight: 700; color: var(--t1); margin-bottom: 2px; }
.ov-desc { font-size: 10px; color: var(--t3); margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ov-key  { font-family: var(--mn); font-size: 9px; color: var(--t4); background: var(--pg); border: 1px solid var(--bdl); padding: 1px 5px; border-radius: 1px; }
.ov-arr  { color: var(--bl); opacity: .35; flex-shrink: 0; transition: opacity var(--t), transform var(--t); display: flex; }

/* Workspace icon colours */
.ws-ic--clerk   { background: #EEF4FF; color: #0066CC; }
.ws-ic--editor  { background: #FFFBEB; color: #78350F; }
.ws-ic--mgr     { background: #FAF5FF; color: #7E22CE; }
.ws-ic--design  { background: #FFF7ED; color: #C2410C; }
.ws-ic--finance { background: #F0FDF4; color: #166534; }
.ws-ic--test    { background: #FDF2F8; color: #BE185D; }
.ws-ic--settings{ background: #F5F7F9; color: #445566; }

/* Bare content that still needs breathing room (e.g. a card-style tool, not a full-bleed workspace) */
.bare.padded { padding: 22px; }

/* ── Nav panel ───────────────────────────────────────────────────────────── */
.nav-panel {
  display: flex; align-items: flex-start; justify-content: space-between;
  gap: 20px; flex-wrap: wrap; margin: 22px; padding: 20px 22px;
  background: var(--sf); border: 1px solid var(--bdl);
  border-left: 4px solid var(--nv); box-shadow: var(--sh);
}
.np-ico   { width: 44px; height: 44px; border-radius: var(--r); flex-shrink: 0; display: flex; align-items: center; justify-content: center; margin-top: 2px; }
.np-body  { flex: 1; min-width: 0; }
.np-title { font-size: 13px; font-weight: 700; color: var(--t1); margin-bottom: 6px; display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; }
.np-title code { font-family: var(--mn); font-size: 11px; color: var(--bl); background: var(--bll); border: 1px solid rgba(0,102,204,.15); padding: 1px 6px; border-radius: 1px; font-weight: 400; }
.np-desc  { font-size: 12px; color: var(--t3); line-height: 1.6; margin: 0 0 10px; }
.np-perms { display: flex; flex-wrap: wrap; gap: 5px; }
.pm       { font-family: var(--mn); font-size: 10px; font-weight: 600; color: var(--t3); background: var(--pg); border: 1px solid var(--bdl); padding: 2px 7px; border-radius: 1px; }
.open-btn { display: inline-flex; align-items: center; gap: 8px; height: 38px; padding: 0 20px; flex-shrink: 0; background: var(--nv); color: #fff; border: none; border-radius: var(--r); font-family: var(--fn); font-size: 13px; font-weight: 600; cursor: pointer; transition: background var(--t); white-space: nowrap; }
.open-btn:hover { background: var(--nvl); }

/* ── Editor filter/stats (matches pages/editor/index.vue exactly) ─────────── */
.editor-wrap { display: flex; flex-direction: column; }

.filter-bar { display: flex; justify-content: space-between; align-items: flex-end; gap: 12px; flex-wrap: wrap; background: #fff; border: 1px solid #DEEAF1; border-top: none; padding: 12px 14px; }
.filter-bar__left  { display: flex; align-items: flex-end; gap: 12px; flex-wrap: wrap; flex: 1; }
.filter-bar__right { display: flex; align-items: flex-end; gap: 10px; flex-wrap: wrap; }
.fg    { display: flex; flex-direction: column; gap: 4px; }
.fl    { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .4px; color: #888; }
.fd, .fsel, .fsrch { border: 1px solid #BDD7EE; padding: 6px 10px; font-size: 12px; font-family: inherit; background: #fff; color: #222; }
.fsrch { width: 200px; }
.fd:focus, .fsel:focus, .fsrch:focus { outline: none; border-color: #1F3864; box-shadow: 0 0 0 2px rgba(31,56,100,.08); }
.range-pills { display: flex; align-items: flex-end; gap: 4px; }
.rp        { font-size: 11px; font-weight: 600; padding: 5px 11px; border: 1px solid #BDD7EE; background: #F7FBFE; color: #6081a3; cursor: pointer; font-family: inherit; }
.rp:hover  { background: #DEEAF1; border-color: #9DC3E6; color: #1F3864; }
.rp--on    { background: #1F3864; color: #fff; border-color: #1F3864; }
.fref      { width: 32px; height: 32px; border: 1px solid #BDD7EE; background: #F7FBFE; color: #6081a3; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; }
.fref:hover { background: #DEEAF1; color: #1F3864; }

.stats-band { display: flex; background: #1F3864; border-bottom: 3px solid #152a4e; }
.sc    { flex: 1; padding: 12px 16px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; }
.sd    { width: 1px; background: rgba(157,195,230,.2); flex-shrink: 0; }
.sv    { font-size: 22px; font-weight: 700; color: #fff; font-family: var(--mn); line-height: 1; }
.sl    { font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: .6px; color: #5B7FAC; }
.sc--am .sv { color: #FFCC00; }
.sc--bl .sv { color: #9DC3E6; }
.sc--gn .sv { color: #A9D18E; }

.e-err  { display: flex; align-items: center; gap: 8px; background: #FCE4D6; border: 1px solid #E31E24; border-left: 4px solid #E31E24; padding: 10px 14px; font-size: 12px; color: #9C0006; }
.e-err button { margin-left: auto; background: none; border: none; font-size: 18px; cursor: pointer; color: #9C0006; padding: 0; line-height: 1; }
.e-toast { position: fixed; bottom: 24px; right: 24px; z-index: 9999; background: #1F3864; color: #fff; font-size: 12px; font-weight: 600; padding: 10px 18px; border-left: 4px solid #A9D18E; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 16px rgba(0,0,0,.3); }
.e-panel { background: #fff; border: 1px solid #DEEAF1; border-top: none; }

/* ── Responsive ───────────────────────────────────────────────────────────── */
@media (max-width: 1280px) { .ov-tiles { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 960px)  { .ov-tiles { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 768px) {
  .admin-shell { flex-direction: column; }
  .rail        { width: 100%; height: auto; }
  .rail__scroll { flex-direction: row; flex-wrap: wrap; }
  .ov-tiles    { grid-template-columns: 1fr; }
  .filter-bar  { flex-direction: column; align-items: stretch; }
}
</style>