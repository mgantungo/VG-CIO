<!-- pages/dashboard/admin.vue -->
<template>
  <!-- Auth gate: page stays invisible until onMounted confirms admin role -->
  <div v-if="!authReady" class="auth-loading">
    <div class="auth-spinner"></div>
    <span class="auth-text">Verifying access&hellip;</span>
  </div>

  <div v-if="authReady" class="admin-shell">

    <!-- ═══════════════════════════════════════════════════════════
         LEFT NAVIGATION RAIL
    ═══════════════════════════════════════════════════════════ -->
    <nav class="rail">
      <div class="rail__brand">
        <svg class="rail__logo" viewBox="0 0 28 28" fill="none">
          <rect width="28" height="28" fill="#003366"/>
          <path d="M6 8h16M6 14h10M6 20h13" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/>
        </svg>
        <span class="rail__name">VGAMS<br><small>Admin</small></span>
      </div>

      <div class="rail__sections">
        <button
          v-for="s in sections"
          :key="s.id"
          class="rail__item"
          :class="{ 'rail__item--active': activeSection === s.id }"
          @click="switchSection(s.id)"
          :title="s.label"
        >
          <span class="rail__icon" v-html="s.icon"></span>
          <span class="rail__label">{{ s.label }}</span>
          <span v-if="s.badge" class="rail__badge">{{ s.badge }}</span>
        </button>
      </div>

      <div class="rail__user">
        <div class="rail__avatar">{{ userInitials }}</div>
        <div class="rail__userinfo">
          <div class="rail__username">{{ userName }}</div>
          <div class="rail__role">Administrator</div>
        </div>
      </div>
    </nav>

    <!-- ═══════════════════════════════════════════════════════════
         MAIN CONTENT AREA
    ═══════════════════════════════════════════════════════════ -->
    <div class="main">

      <!-- SECTION HEADER BAR -->
      <div class="topbar">
        <div class="topbar__left">
          <div class="topbar__eyebrow">Administrator · Vision Group Advertising</div>
          <h1 class="topbar__title">{{ currentSection.title }}</h1>
        </div>
        <div class="topbar__right">
          <div v-if="toast" class="topbar__toast" :class="`toast--${toastType}`">
            <span v-html="toastIcon"></span> {{ toast }}
          </div>
          <button class="topbar__btn" @click="refreshCurrentSection">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M13.5 3A7 7 0 1 0 14 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M14 3v4h-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            Refresh
          </button>
          <span class="topbar__clock">{{ currentTime }}</span>
        </div>
      </div>

      <!-- ══════════════════════════════════════════════════════
           SECTION 1: OVERVIEW
      ══════════════════════════════════════════════════════ -->
      <section v-show="activeSection === 'overview'" class="section-body">

        <!-- KPI Band -->
        <div class="kpi-band">
          <div class="kpi-cell kpi--navy">
            <span class="kpi-val">{{ kpiData.totalAdverts }}</span>
            <span class="kpi-lbl">Total Adverts</span>
          </div>
          <div class="kpi-div"></div>
          <div class="kpi-cell kpi--amber">
            <span class="kpi-val">{{ kpiData.pendingReview }}</span>
            <span class="kpi-lbl">Pending Review</span>
          </div>
          <div class="kpi-div"></div>
          <div class="kpi-cell kpi--green">
            <span class="kpi-val">{{ formatCurrency(kpiData.revenueMonth) }}</span>
            <span class="kpi-lbl">Revenue This Month</span>
          </div>
          <div class="kpi-div"></div>
          <div class="kpi-cell kpi--red">
            <span class="kpi-val">{{ kpiData.awaitingPayment }}</span>
            <span class="kpi-lbl">Awaiting Payment</span>
          </div>
          <div class="kpi-div"></div>
          <div class="kpi-cell kpi--blue">
            <span class="kpi-val">{{ kpiData.published }}</span>
            <span class="kpi-lbl">Published Today</span>
          </div>
        </div>

        <!-- Two-col layout: activity + role quick-access -->
        <div class="overview-grid">

          <!-- Recent Activity -->
          <div class="card">
            <div class="card__hd">
              <span class="card__title">Recent Activity</span>
              <span class="card__badge">Live Feed</span>
            </div>
            <div class="activity-list">
              <div v-for="a in recentActivities" :key="a.id" class="activity-row">
                <div class="activity-dot" :class="`dot--${a.type}`"></div>
                <div class="activity-content">
                  <div class="activity-title">{{ a.title }}</div>
                  <div class="activity-desc">{{ a.description }}</div>
                </div>
                <div class="activity-time">{{ a.date }}</div>
              </div>
            </div>
          </div>

          <!-- Role Quick Access -->
          <div class="card">
            <div class="card__hd">
              <span class="card__title">Role Workspaces</span>
              <span class="card__badge">Jump To</span>
            </div>
            <div class="role-grid role-grid--six">
              <button class="role-card" @click="switchSection('booking_clerk')">
                <div class="role-card__icon role-icon--clerk">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" stroke-width="1.8"/><polyline points="14 2 14 8 20 8" stroke="currentColor" stroke-width="1.8"/><line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" stroke-width="1.8"/><line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" stroke-width="1.8"/></svg>
                </div>
                <div class="role-card__label">Clerk</div>
                <div class="role-card__desc">Booking creation &amp; management</div>
                <div class="role-card__stat">{{ kpiData.totalAdverts }} adverts</div>
              </button>
              <button class="role-card" @click="switchSection('sub_editor')">
                <div class="role-card__icon role-icon--editor">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="1" stroke="currentColor" stroke-width="1.8"/><line x1="3" y1="9" x2="21" y2="9" stroke="currentColor" stroke-width="1.8"/><line x1="9" y1="21" x2="9" y2="9" stroke="currentColor" stroke-width="1.8"/></svg>
                </div>
                <div class="role-card__label">Editor</div>
                <div class="role-card__desc">Schedule queue &amp; publishing</div>
                <div class="role-card__stat">{{ scheduleStats.noPage }} need pages</div>
              </button>
              <button class="role-card" @click="switchSection('advertising_manager')">
                <div class="role-card__icon role-icon--mgr">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M9 11l3 3L22 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </div>
                <div class="role-card__label">Ad. Manager</div>
                <div class="role-card__desc">Approval workflow &amp; oversight</div>
                <div class="role-card__stat">{{ mgrStats.awaiting }} awaiting approval</div>
              </button>
              <button class="role-card" @click="switchSection('design_house')">
                <div class="role-card__icon role-icon--design">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.8"/></svg>
                </div>
                <div class="role-card__label">Design House</div>
                <div class="role-card__desc">Creative upload &amp; version control</div>
                <div class="role-card__stat">{{ designStats.noMedia }} awaiting creative</div>
              </button>
              <button class="role-card" @click="switchSection('payments')">
                <div class="role-card__icon role-icon--finance">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="1" y="4" width="22" height="16" rx="1" stroke="currentColor" stroke-width="1.8"/><line x1="1" y1="10" x2="23" y2="10" stroke="currentColor" stroke-width="1.8"/></svg>
                </div>
                <div class="role-card__label">Finance · Payments</div>
                <div class="role-card__desc">Revenue tracking &amp; collection</div>
                <div class="role-card__stat">{{ formatCurrency(paymentKpis.outstanding) }} outstanding</div>
              </button>
              <button class="role-card" @click="switchSection('reports')">
                <div class="role-card__icon role-icon--reports">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><line x1="18" y1="20" x2="18" y2="10" stroke="currentColor" stroke-width="1.8"/><line x1="12" y1="20" x2="12" y2="4" stroke="currentColor" stroke-width="1.8"/><line x1="6" y1="20" x2="6" y2="14" stroke="currentColor" stroke-width="1.8"/></svg>
                </div>
                <div class="role-card__label">Finance · Reports</div>
                <div class="role-card__desc">Revenue analytics &amp; export</div>
                <div class="role-card__stat">6 report types</div>
              </button>
            </div>
          </div>

        </div><!-- /overview-grid -->

        <!-- System Summary Table -->
        <div class="card" style="margin-top:14px">
          <div class="card__hd">
            <span class="card__title">System Summary — All Roles</span>
          </div>
          <table class="data-table">
            <thead>
              <tr>
                <th>Role</th><th>Primary Page</th><th>Key Actions</th><th>Data Source</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span class="role-pill pill--clerk">booking_clerk</span></td>
                <td><code>pages/dashboard/booking/</code></td>
                <td>Create bookings, select clients, schedule dates, upload media, submit for review</td>
                <td>useAdverts · useClientDropdown · useWorkflow</td>
                <td><span class="status-pill pill--ok">Active</span></td>
              </tr>
              <tr>
                <td><span class="role-pill pill--editor">sub_editor</span></td>
                <td><code>pages/editor/index.vue</code></td>
                <td>Assign page/slot numbers, toggle publish, bulk update, review schedule queue</td>
                <td>useAdverts.getFullSchedules · updateSchedulePage</td>
                <td><span class="status-pill pill--ok">Active</span></td>
              </tr>
              <tr>
                <td><span class="role-pill pill--mgr">advertising_manager</span></td>
                <td><code>pages/dashboard/approval</code></td>
                <td>Approve or reject submitted adverts, financial oversight, view reports</td>
                <td>useAdverts · usePayments (read-only)</td>
                <td><span class="status-pill pill--ok">Active</span></td>
              </tr>
              <tr>
                <td><span class="role-pill pill--design">design_house</span></td>
                <td><code>pages/dashboard/design</code></td>
                <td>View advert briefs, upload creative files, version control for attachments</td>
                <td>useMedia · useAdverts (read-only)</td>
                <td><span class="status-pill pill--ok">Active</span></td>
              </tr>
              <tr>
                <td><span class="role-pill pill--finance">finance_team</span></td>
                <td><code>pages/dashboard/finance/</code></td>
                <td>Record payments, track collection rate, generate revenue reports, export data</td>
                <td>usePayments · useAdverts</td>
                <td><span class="status-pill pill--ok">Active</span></td>
              </tr>
              <tr>
                <td><span class="role-pill pill--admin">administrator</span></td>
                <td><code>pages/dashboard/admin.vue</code></td>
                <td>All 6 role workspaces in one consolidated view — training &amp; support</td>
                <td>All composables · all_permissions</td>
                <td><span class="status-pill pill--ok">This page</span></td>
              </tr>
            </tbody>
          </table>
        </div>

      </section>

      <!-- ══════════════════════════════════════════════════════
           SECTION 2: BOOKING CLERK — BOOKING MANAGEMENT
      ══════════════════════════════════════════════════════ -->
      <section v-show="activeSection === 'booking_clerk'" class="section-body">

        <!-- Toolbar -->
        <div class="toolbar">
          <div class="toolbar__left">
            <input v-model="clerkSearch" class="tb-input" placeholder="Search client or advert title…" @input="filterAdverts">
            <select v-model="clerkStatusFilter" class="tb-sel" @change="filterAdverts">
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="approved">Approved</option>
              <option value="scheduled">Scheduled</option>
              <option value="paid">Paid</option>
            </select>
          </div>
          <div class="toolbar__right">
            <NuxtLink to="/dashboard/booking/new" class="tb-btn tb-btn--primary">
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M8 2v12M2 8h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
              New Booking
            </NuxtLink>
          </div>
        </div>

        <!-- Stats strip -->
        <div class="strip">
          <div class="strip-cell">
            <span class="strip-val">{{ clerkStats.total }}</span>
            <span class="strip-lbl">Total</span>
          </div>
          <div class="strip-div"></div>
          <div class="strip-cell strip--amber">
            <span class="strip-val">{{ clerkStats.draft }}</span>
            <span class="strip-lbl">Draft</span>
          </div>
          <div class="strip-div"></div>
          <div class="strip-cell strip--blue">
            <span class="strip-val">{{ clerkStats.submitted }}</span>
            <span class="strip-lbl">Submitted</span>
          </div>
          <div class="strip-div"></div>
          <div class="strip-cell strip--green">
            <span class="strip-val">{{ clerkStats.approved }}</span>
            <span class="strip-lbl">Approved</span>
          </div>
          <div class="strip-div"></div>
          <div class="strip-cell strip--navy">
            <span class="strip-val">{{ clerkStats.scheduled }}</span>
            <span class="strip-lbl">Scheduled</span>
          </div>
        </div>

        <!-- Adverts table -->
        <div class="card" style="margin-top:0; border-top:none;">
          <div v-if="advertsLoading" class="loading-state">
            <div class="spinner"></div> Loading adverts…
          </div>
          <div v-else-if="advertsError" class="err-banner">
            {{ advertsError }}
            <button class="err-dismiss" @click="loadClerkAdverts">Retry</button>
          </div>
          <table v-else class="data-table">
            <thead>
              <tr>
                <th>Ref</th><th>Client</th><th>Advert Title</th><th>Amount</th>
                <th>Status</th><th>Created</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="filteredAdverts.length === 0">
                <td colspan="7" class="empty-cell">No adverts found. <NuxtLink to="/dashboard/booking/new" class="link">Create one.</NuxtLink></td>
              </tr>
              <tr v-for="a in filteredAdverts" :key="a.id">
                <td><code class="ref-code">{{ a.reference }}</code></td>
                <td class="fw500">{{ a.clientName || '—' }}</td>
                <td>{{ a.advertTitle }}</td>
                <td class="mono">{{ formatCurrency(a.totalAmount) }}</td>
                <td><span :class="`status-pill pill--${getStatusClass(a.status)}`">{{ getStatusLabel(a.status) }}</span></td>
                <td class="text-3">{{ formatDate(a.createdAt) }}</td>
                <td>
                  <div class="action-btns">
                    <NuxtLink :to="`/dashboard/booking/edit/${a.id}`" class="act-btn act-btn--view">View/Edit</NuxtLink>
                    <button v-if="a.status === 'draft'" class="act-btn act-btn--submit" @click="submitAdvert(a.id)">Submit</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Clerk role guide -->
        <div class="role-guide card" style="margin-top:14px">
          <div class="card__hd"><span class="card__title">Clerk Workflow Guide</span></div>
          <div class="guide-steps">
            <div class="guide-step">
              <div class="step-num">1</div>
              <div class="step-body">
                <div class="step-title">Select Client</div>
                <div class="step-desc">Use the client dropdown to find an existing client or enter a new client name. The system auto-fills BC number and contact info from the client database.</div>
              </div>
            </div>
            <div class="guide-step">
              <div class="step-num">2</div>
              <div class="step-body">
                <div class="step-title">Configure Advert</div>
                <div class="step-desc">Choose platform category (Print, Radio, TV, Digital), select the product and rate card. Toggle colour/BW and web publishing options.</div>
              </div>
            </div>
            <div class="guide-step">
              <div class="step-num">3</div>
              <div class="step-body">
                <div class="step-title">Schedule &amp; Price</div>
                <div class="step-desc">Pick advert dates using the calendar picker, set frequency and payment method. The price calculator auto-computes total from the rate card.</div>
              </div>
            </div>
            <div class="guide-step">
              <div class="step-num">4</div>
              <div class="step-body">
                <div class="step-title">Upload Media &amp; Submit</div>
                <div class="step-desc">Upload creative files (PDF, images, docs). Save as draft or submit directly. Submitted adverts enter the editor's review queue.</div>
              </div>
            </div>
          </div>
        </div>

      </section>

      <!-- ══════════════════════════════════════════════════════
           SECTION 3: SUB-EDITOR — SCHEDULE QUEUE
      ══════════════════════════════════════════════════════ -->
      <section v-show="activeSection === 'sub_editor'" class="section-body">

        <!-- Filter bar -->
        <div class="toolbar">
          <div class="toolbar__left">
            <div class="tb-group">
              <label class="tb-lbl">From</label>
              <input type="date" v-model="editorFilters.dateFrom" class="tb-date" @change="loadSchedules">
            </div>
            <div class="tb-group">
              <label class="tb-lbl">To</label>
              <input type="date" v-model="editorFilters.dateTo" class="tb-date" @change="loadSchedules">
            </div>
            <div class="range-pills">
              <button v-for="r in quickRanges" :key="r.label"
                class="range-pill" :class="{'range-pill--active': activeRange === r.label}"
                @click="applyRange(r)">{{ r.label }}</button>
            </div>
          </div>
          <div class="toolbar__right">
            <select v-model="editorFilters.status" class="tb-sel" @change="loadSchedules">
              <option value="">All</option>
              <option value="scheduled">No Page</option>
              <option value="paged">Page Assigned</option>
              <option value="published">Published</option>
            </select>
            <input v-model="editorFilters.search" class="tb-input" placeholder="Search client or title…">
          </div>
        </div>

        <!-- Stats band -->
        <div class="strip strip--dark">
          <div class="strip-cell">
            <span class="strip-val">{{ scheduleStats.total }}</span>
            <span class="strip-lbl">Total</span>
          </div>
          <div class="strip-div"></div>
          <div class="strip-cell strip--amber">
            <span class="strip-val">{{ scheduleStats.noPage }}</span>
            <span class="strip-lbl">No Page</span>
          </div>
          <div class="strip-div"></div>
          <div class="strip-cell strip--blue">
            <span class="strip-val">{{ scheduleStats.paged }}</span>
            <span class="strip-lbl">Page Assigned</span>
          </div>
          <div class="strip-div"></div>
          <div class="strip-cell strip--green">
            <span class="strip-val">{{ scheduleStats.published }}</span>
            <span class="strip-lbl">Published</span>
          </div>
          <div class="strip-div"></div>
          <div class="strip-cell">
            <span class="strip-val">{{ scheduleStats.withMedia }}</span>
            <span class="strip-lbl">With Media</span>
          </div>
        </div>

        <!-- Schedule table -->
        <div class="card" style="border-top:none">
          <div v-if="schedulesLoading" class="loading-state">
            <div class="spinner"></div> Loading schedules…
          </div>
          <div v-else-if="schedulesError" class="err-banner">
            {{ schedulesError }}
            <button class="err-dismiss" @click="loadSchedules">Retry</button>
          </div>
          <table v-else class="data-table data-table--compact">
            <thead>
              <tr>
                <th>ID</th><th>Run Date</th><th>Client</th><th>Advert</th>
                <th>Platform</th><th>Page/Slot</th><th>Published</th><th>Media</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="filteredSchedules.length === 0">
                <td colspan="9" class="empty-cell">No schedules found for this period.</td>
              </tr>
              <tr v-for="s in filteredSchedules" :key="s.schedule_id"
                  :class="{'row--published': s.is_published, 'row--no-page': !s.page || s.page === 0}">
                <td><code class="ref-code">{{ s.schedule_id }}</code></td>
                <td class="mono">{{ formatDate(s.run_date) }}</td>
                <td class="fw500">{{ s.company_name || '—' }}</td>
                <td>{{ truncate(s.advert_title, 28) }}</td>
                <td><span class="platform-pill">{{ s.platform_category || '—' }}</span></td>
                <td>
                  <input
                    type="number" min="1" max="999"
                    :value="s.page || ''"
                    class="page-input"
                    :class="{'page-input--empty': !s.page}"
                    @change="onPageUpdate(s.schedule_id, +$event.target.value)"
                    placeholder="—"
                  >
                </td>
                <td>
                  <button
                    class="pub-toggle"
                    :class="s.is_published ? 'pub-toggle--on' : 'pub-toggle--off'"
                    @click="onPublishToggle(s.schedule_id, !s.is_published)"
                    :title="s.is_published ? 'Click to unpublish' : 'Click to publish'"
                  >{{ s.is_published ? 'Published' : 'Draft' }}</button>
                </td>
                <td>
                  <span v-if="s.media?.length" class="media-badge">{{ s.media.length }} file{{ s.media.length !== 1 ? 's' : '' }}</span>
                  <span v-else class="text-4">None</span>
                </td>
                <td>
                  <button class="act-btn act-btn--danger" @click="onUnschedule(s.schedule_id)">Remove</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Editor workflow guide -->
        <div class="role-guide card" style="margin-top:14px">
          <div class="card__hd"><span class="card__title">Editor Workflow Guide</span></div>
          <div class="guide-steps">
            <div class="guide-step">
              <div class="step-num">1</div>
              <div class="step-body">
                <div class="step-title">Filter the Queue</div>
                <div class="step-desc">Use date range and quick pills (Today / This Week / Next 14d) to focus on the relevant publication window. Filter by status to isolate items needing page assignment.</div>
              </div>
            </div>
            <div class="guide-step">
              <div class="step-num">2</div>
              <div class="step-body">
                <div class="step-title">Assign Page / Slot</div>
                <div class="step-desc">Type the page or slot number directly in the Page/Slot cell and press Enter or tab away. Rows highlighted in amber have no page assigned yet.</div>
              </div>
            </div>
            <div class="guide-step">
              <div class="step-num">3</div>
              <div class="step-body">
                <div class="step-title">Publish</div>
                <div class="step-desc">Once a page is assigned, click the Draft badge to toggle it to Published. The system prevents publishing without a page number. Published items appear green.</div>
              </div>
            </div>
            <div class="guide-step">
              <div class="step-num">4</div>
              <div class="step-body">
                <div class="step-title">Check Media</div>
                <div class="step-desc">The Media column shows how many creative files are attached. Click the badge to review them. Schedules with no media may need follow-up with the clerk.</div>
              </div>
            </div>
          </div>
        </div>

      </section>

      <!-- ══════════════════════════════════════════════════════
           SECTION 4: FINANCE — PAYMENTS
      ══════════════════════════════════════════════════════ -->
      <section v-show="activeSection === 'payments'" class="section-body">

        <!-- Date controls -->
        <div class="toolbar">
          <div class="toolbar__left">
            <div class="tb-group">
              <label class="tb-lbl">From</label>
              <input type="date" v-model="payStartDate" class="tb-date" @change="loadPayments" :max="payEndDate">
            </div>
            <div class="tb-group">
              <label class="tb-lbl">To</label>
              <input type="date" v-model="payEndDate" class="tb-date" @change="loadPayments" :min="payStartDate">
            </div>
            <div class="range-pills">
              <button v-for="r in payQuickRanges" :key="r.label"
                class="range-pill" :class="{'range-pill--active': activePayRange === r.label}"
                @click="applyPayRange(r)">{{ r.label }}</button>
            </div>
          </div>
          <div class="toolbar__right">
            <select v-model="payStatusFilter" class="tb-sel">
              <option value="">All</option>
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
              <option value="unpaid">Unpaid</option>
            </select>
            <input v-model="paySearch" class="tb-input" placeholder="Search client…">
            <button class="tb-btn" @click="exportPayments">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Export
            </button>
          </div>
        </div>

        <!-- KPI band -->
        <div class="kpi-band">
          <div class="kpi-cell kpi--blue">
            <span class="kpi-val">{{ formatCurrency(paymentKpis.totalBilled) }}</span>
            <span class="kpi-lbl">Total Billed</span>
          </div>
          <div class="kpi-div"></div>
          <div class="kpi-cell kpi--green">
            <span class="kpi-val">{{ formatCurrency(paymentKpis.collected) }}</span>
            <span class="kpi-lbl">Collected</span>
            <span class="kpi-sub">{{ paymentKpis.collectionRate }}% rate</span>
          </div>
          <div class="kpi-div"></div>
          <div class="kpi-cell kpi--red">
            <span class="kpi-val">{{ formatCurrency(paymentKpis.outstanding) }}</span>
            <span class="kpi-lbl">Outstanding</span>
          </div>
          <div class="kpi-div"></div>
          <div class="kpi-cell kpi--amber">
            <span class="kpi-val">{{ paymentKpis.pendingCount }}</span>
            <span class="kpi-lbl">Pending Transactions</span>
          </div>
        </div>

        <!-- Transactions table -->
        <div class="card" style="border-top:none">
          <div v-if="paymentsLoading" class="loading-state">
            <div class="spinner"></div> Loading transactions…
          </div>
          <div v-else-if="paymentsError" class="err-banner">
            {{ paymentsError }}
            <button class="err-dismiss" @click="loadPayments">Retry</button>
          </div>
          <table v-else class="data-table">
            <thead>
              <tr>
                <th>Ref</th><th>Client</th><th>Advert</th><th>Total</th>
                <th>Paid</th><th>Balance</th><th>Status</th><th>Platform</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="filteredTransactions.length === 0">
                <td colspan="8" class="empty-cell">No transactions found for this period.</td>
              </tr>
              <tr v-for="t in filteredTransactions" :key="t.id">
                <td><code class="ref-code">{{ t.reference }}</code></td>
                <td class="fw500">{{ t.clientName }}</td>
                <td>{{ truncate(t.advertTitle, 26) }}</td>
                <td class="mono">{{ formatCurrency(t.totalAmount) }}</td>
                <td class="mono text-green">{{ formatCurrency(t.amountPaid || 0) }}</td>
                <td class="mono" :class="t.balance > 0 ? 'text-red' : 'text-green'">{{ formatCurrency(t.balance) }}</td>
                <td>
                  <span :class="`status-pill pill--pay-${t.paymentStatus}`">
                    {{ t.paymentStatus === 'paid' ? 'Paid' : t.paymentStatus === 'partial' ? 'Partial' : 'Unpaid' }}
                  </span>
                </td>
                <td><span class="platform-pill">{{ t.platform || '—' }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Finance workflow guide -->
        <div class="role-guide card" style="margin-top:14px">
          <div class="card__hd"><span class="card__title">Finance — Payments Workflow Guide</span></div>
          <div class="guide-steps">
            <div class="guide-step">
              <div class="step-num">1</div>
              <div class="step-body">
                <div class="step-title">Select Period</div>
                <div class="step-desc">Use the date pickers or quick range buttons (Today / Week / Month) to load transactions. The KPI band updates automatically showing billed, collected, outstanding, and pending counts.</div>
              </div>
            </div>
            <div class="guide-step">
              <div class="step-num">2</div>
              <div class="step-body">
                <div class="step-title">Review Outstanding</div>
                <div class="step-desc">Filter by "Unpaid" status to see clients with outstanding balances. The Balance column shows what is still owed. Partial payments show in a separate status.</div>
              </div>
            </div>
            <div class="guide-step">
              <div class="step-num">3</div>
              <div class="step-body">
                <div class="step-title">Record Payment</div>
                <div class="step-desc">Click on a transaction row to open the payment recording panel. Enter the amount received, payment method, and reference number. The system updates the balance and collection rate.</div>
              </div>
            </div>
            <div class="guide-step">
              <div class="step-num">4</div>
              <div class="step-body">
                <div class="step-title">Export</div>
                <div class="step-desc">Use the Export button to download the current filtered view as CSV for further analysis in Excel or for submission to the finance team.</div>
              </div>
            </div>
          </div>
        </div>

      </section>

      <!-- ══════════════════════════════════════════════════════
           SECTION 5: FINANCE — REPORTS
      ══════════════════════════════════════════════════════ -->
      <section v-show="activeSection === 'reports'" class="section-body">

        <div class="two-col-layout">

          <!-- Report Generator -->
          <div class="card">
            <div class="card__hd">
              <span class="card__title">Generate Report</span>
            </div>
            <div class="report-form">
              <div class="rf-group">
                <label class="rf-lbl">Report Type <span class="req">*</span></label>
                <select v-model="reportForm.reportType" class="rf-sel">
                  <option value="">Select report type</option>
                  <option value="revenue_summary">Revenue Summary</option>
                  <option value="payment_collection">Payment Collection Status</option>
                  <option value="outstanding_invoices">Outstanding Invoices</option>
                  <option value="platform_performance">Platform Performance</option>
                  <option value="client_activity">Client Activity</option>
                  <option value="payment_methods">Payment Methods Analysis</option>
                </select>
              </div>

              <div class="rf-group">
                <label class="rf-lbl">Period <span class="req">*</span></label>
                <select v-model="reportForm.period" class="rf-sel" @change="handlePeriodChange">
                  <option value="">Select period</option>
                  <option value="this_month">This Month</option>
                  <option value="last_month">Last Month</option>
                  <option value="this_quarter">This Quarter</option>
                  <option value="this_year">This Year</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>

              <template v-if="reportForm.period === 'custom'">
                <div class="rf-group">
                  <label class="rf-lbl">Start Date</label>
                  <input type="date" v-model="reportForm.startDate" class="rf-input" :max="reportForm.endDate">
                </div>
                <div class="rf-group">
                  <label class="rf-lbl">End Date</label>
                  <input type="date" v-model="reportForm.endDate" class="rf-input" :min="reportForm.startDate">
                </div>
              </template>

              <div class="rf-group">
                <label class="rf-lbl">Platform</label>
                <select v-model="reportForm.platform" class="rf-sel">
                  <option value="">All Platforms</option>
                  <option value="print">Print (New Vision)</option>
                  <option value="radio">Radio</option>
                  <option value="tv">TV (NBS)</option>
                  <option value="digital">Digital</option>
                </select>
              </div>

              <div class="rf-group">
                <label class="rf-lbl">Format</label>
                <div class="rf-radio-group">
                  <label class="rf-radio">
                    <input type="radio" v-model="reportForm.format" value="table"> Table View
                  </label>
                  <label class="rf-radio">
                    <input type="radio" v-model="reportForm.format" value="csv"> CSV Export
                  </label>
                  <label class="rf-radio">
                    <input type="radio" v-model="reportForm.format" value="pdf"> PDF Export
                  </label>
                </div>
              </div>

              <div class="rf-actions">
                <button class="tb-btn tb-btn--primary" @click="generateReport" :disabled="!reportForm.reportType || !reportForm.period || reportGenerating">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  {{ reportGenerating ? 'Generating…' : 'Generate Report' }}
                </button>
              </div>
            </div>
          </div>

          <!-- Report types guide -->
          <div class="card">
            <div class="card__hd"><span class="card__title">Report Types</span></div>
            <div class="report-types">
              <div class="rt-row" v-for="rt in reportTypes" :key="rt.id"
                :class="{'rt-row--active': reportForm.reportType === rt.id}"
                @click="reportForm.reportType = rt.id">
                <div class="rt-icon" v-html="rt.icon"></div>
                <div class="rt-body">
                  <div class="rt-name">{{ rt.name }}</div>
                  <div class="rt-desc">{{ rt.desc }}</div>
                </div>
              </div>
            </div>
          </div>

        </div><!-- /two-col-layout -->

        <!-- Report output placeholder -->
        <div v-if="reportResult" class="card" style="margin-top:14px">
          <div class="card__hd">
            <span class="card__title">Report: {{ getReportLabel(reportForm.reportType) }} — {{ getPeriodLabel(reportForm.period) }}</span>
            <button class="tb-btn" @click="reportResult = null">Clear</button>
          </div>
          <div class="report-placeholder">
            <div class="rp-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none"><line x1="18" y1="20" x2="18" y2="10" stroke="#003366" stroke-width="1.8"/><line x1="12" y1="20" x2="12" y2="4" stroke="#003366" stroke-width="1.8"/><line x1="6" y1="20" x2="6" y2="14" stroke="#003366" stroke-width="1.8"/></svg>
            </div>
            <p>Report generated successfully. In production this connects to <code>usePayments</code> and renders the selected data set as a table or triggers a download.</p>
            <p class="rp-meta">Type: <strong>{{ getReportLabel(reportForm.reportType) }}</strong> · Period: <strong>{{ getPeriodLabel(reportForm.period) }}</strong> · Platform: <strong>{{ reportForm.platform || 'All' }}</strong></p>
          </div>
        </div>

        <!-- Reports workflow guide -->
        <div class="role-guide card" style="margin-top:14px">
          <div class="card__hd"><span class="card__title">Finance — Reports Workflow Guide</span></div>
          <div class="guide-steps">
            <div class="guide-step">
              <div class="step-num">1</div>
              <div class="step-body">
                <div class="step-title">Choose Report Type</div>
                <div class="step-desc">Click any report type from the right panel or use the dropdown to select. Six types are available: Revenue Summary, Payment Collection, Outstanding Invoices, Platform Performance, Client Activity, and Payment Methods.</div>
              </div>
            </div>
            <div class="guide-step">
              <div class="step-num">2</div>
              <div class="step-body">
                <div class="step-title">Set Period &amp; Filters</div>
                <div class="step-desc">Choose a preset period (This Month, Last Month, This Quarter, This Year) or select Custom Range to enter exact dates. Optionally filter by platform (Print, Radio, TV, Digital).</div>
              </div>
            </div>
            <div class="guide-step">
              <div class="step-num">3</div>
              <div class="step-body">
                <div class="step-title">Select Output Format</div>
                <div class="step-desc">Table View renders the report inline. CSV Export downloads a spreadsheet-ready file. PDF Export generates a printable document with Vision Group branding.</div>
              </div>
            </div>
            <div class="guide-step">
              <div class="step-num">4</div>
              <div class="step-body">
                <div class="step-title">Generate &amp; Share</div>
                <div class="step-desc">Click Generate Report. The system fetches data from the API and renders or downloads the result. Generated reports can be saved to the Saved Reports library for future reference.</div>
              </div>
            </div>
          </div>
        </div>

      </section>

      <!-- ══════════════════════════════════════════════════════
           SECTION 6: ADVERTISING MANAGER — APPROVAL WORKFLOW
      ══════════════════════════════════════════════════════ -->
      <section v-show="activeSection === 'advertising_manager'" class="section-body">

        <!-- Role info banner -->
        <div class="role-info-banner">
          <div class="rib-icon role-icon--mgr">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M9 11l3 3L22 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <div class="rib-body">
            <div class="rib-title">Advertising Manager — <code>advertising_manager</code></div>
            <div class="rib-desc">Redirects to <code>/dashboard/approval</code> after login. Permissions: <strong>approve_adverts · financial_oversight · view_reports</strong></div>
          </div>
          <a href="/dashboard/approval" class="tb-btn">Open Full Page</a>
        </div>

        <!-- Approval queue -->
        <div class="toolbar">
          <div class="toolbar__left">
            <select v-model="mgrStatusFilter" class="tb-sel">
              <option value="submitted">Awaiting Approval</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="">All</option>
            </select>
            <input v-model="mgrSearch" class="tb-input" placeholder="Search client or advert…">
          </div>
        </div>

        <div class="strip">
          <div class="strip-cell strip--amber">
            <span class="strip-val">{{ mgrStats.awaiting }}</span>
            <span class="strip-lbl">Awaiting Approval</span>
          </div>
          <div class="strip-div"></div>
          <div class="strip-cell strip--green">
            <span class="strip-val">{{ mgrStats.approved }}</span>
            <span class="strip-lbl">Approved</span>
          </div>
          <div class="strip-div"></div>
          <div class="strip-cell strip--red">
            <span class="strip-val">{{ mgrStats.rejected }}</span>
            <span class="strip-lbl">Rejected</span>
          </div>
          <div class="strip-div"></div>
          <div class="strip-cell">
            <span class="strip-val">{{ mgrStats.total }}</span>
            <span class="strip-lbl">Total</span>
          </div>
        </div>

        <div class="card" style="border-top:none">
          <table class="data-table">
            <thead>
              <tr>
                <th>Ref</th><th>Client</th><th>Advert Title</th>
                <th>Amount</th><th>Platform</th><th>Status</th><th>Approval Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="mgrFilteredAdverts.length === 0">
                <td colspan="7" class="empty-cell">No adverts match this filter.</td>
              </tr>
              <tr v-for="a in mgrFilteredAdverts" :key="a.id">
                <td><code class="ref-code">{{ a.reference }}</code></td>
                <td class="fw500">{{ a.clientName || '—' }}</td>
                <td>{{ truncate(a.advertTitle, 30) }}</td>
                <td class="mono">{{ formatCurrency(a.totalAmount) }}</td>
                <td><span class="platform-pill">{{ a.revenueStream || '—' }}</span></td>
                <td><span :class="`status-pill pill--${getStatusClass(a.status)}`">{{ getStatusLabel(a.status) }}</span></td>
                <td>
                  <div class="action-btns">
                    <NuxtLink :to="`/dashboard/booking/edit/${a.id}?mode=view`" class="act-btn act-btn--view">Review</NuxtLink>
                    <button v-if="a.status === 'submitted'" class="act-btn act-btn--submit" @click="approveAdvert(a.id)">Approve</button>
                    <button v-if="a.status === 'submitted'" class="act-btn act-btn--danger" @click="rejectAdvert(a.id)">Reject</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="role-guide card" style="margin-top:14px">
          <div class="card__hd"><span class="card__title">Advertising Manager Workflow Guide</span></div>
          <div class="guide-steps">
            <div class="guide-step">
              <div class="step-num">1</div>
              <div class="step-body">
                <div class="step-title">Review Submitted Adverts</div>
                <div class="step-desc">The queue shows all adverts submitted by booking clerks awaiting your approval. Filter by "Awaiting Approval" to focus on actionable items. Click Review to see the full advert details including rate card, dates, and client information.</div>
              </div>
            </div>
            <div class="guide-step">
              <div class="step-num">2</div>
              <div class="step-body">
                <div class="step-title">Verify Details</div>
                <div class="step-desc">Check the client name, advert title, platform, rate card pricing, and scheduled dates. Confirm the market sector and office location are correct. Verify the total amount matches the agreed rate card.</div>
              </div>
            </div>
            <div class="guide-step">
              <div class="step-num">3</div>
              <div class="step-body">
                <div class="step-title">Approve or Reject</div>
                <div class="step-desc">Click Approve to move the advert to the editor's schedule queue. Click Reject to send it back to the booking clerk with a rejection reason. Approved adverts become visible to the sub-editor for scheduling.</div>
              </div>
            </div>
            <div class="guide-step">
              <div class="step-num">4</div>
              <div class="step-body">
                <div class="step-title">Financial Oversight</div>
                <div class="step-desc">Use the Finance reports section (accessible from the Finance Team workspace below) to monitor revenue targets, collection rates, and outstanding invoices. You have view_reports permission to access all financial summaries.</div>
              </div>
            </div>
          </div>
        </div>

      </section>

      <!-- ══════════════════════════════════════════════════════
           SECTION 7: DESIGN HOUSE — CREATIVE MANAGEMENT
      ══════════════════════════════════════════════════════ -->
      <section v-show="activeSection === 'design_house'" class="section-body">

        <!-- Role info banner -->
        <div class="role-info-banner">
          <div class="rib-icon role-icon--design">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/></svg>
          </div>
          <div class="rib-body">
            <div class="rib-title">Design House — <code>design_house</code></div>
            <div class="rib-desc">Redirects to <code>/dashboard/design</code> after login. Permissions: <strong>view_attachments · upload_creatives · version_control</strong></div>
          </div>
          <a href="/dashboard/design" class="tb-btn">Open Full Page</a>
        </div>

        <!-- Design queue -->
        <div class="toolbar">
          <div class="toolbar__left">
            <select v-model="designStatusFilter" class="tb-sel">
              <option value="">All</option>
              <option value="approved">Approved — Needs Creative</option>
              <option value="scheduled">Scheduled — Creative Attached</option>
            </select>
            <input v-model="designSearch" class="tb-input" placeholder="Search client or advert…">
          </div>
        </div>

        <div class="strip">
          <div class="strip-cell strip--amber">
            <span class="strip-val">{{ designStats.noMedia }}</span>
            <span class="strip-lbl">No Creative Yet</span>
          </div>
          <div class="strip-div"></div>
          <div class="strip-cell strip--green">
            <span class="strip-val">{{ designStats.withMedia }}</span>
            <span class="strip-lbl">Creative Attached</span>
          </div>
          <div class="strip-div"></div>
          <div class="strip-cell">
            <span class="strip-val">{{ designStats.total }}</span>
            <span class="strip-lbl">Total</span>
          </div>
        </div>

        <div class="card" style="border-top:none">
          <table class="data-table">
            <thead>
              <tr>
                <th>Ref</th><th>Client</th><th>Advert</th><th>Platform</th>
                <th>Run Dates</th><th>Creative Files</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="designFilteredAdverts.length === 0">
                <td colspan="7" class="empty-cell">No adverts match this filter.</td>
              </tr>
              <tr v-for="a in designFilteredAdverts" :key="a.id">
                <td><code class="ref-code">{{ a.reference }}</code></td>
                <td class="fw500">{{ a.clientName || '—' }}</td>
                <td>{{ truncate(a.advertTitle, 26) }}</td>
                <td><span class="platform-pill">{{ a.revenueStream || '—' }}</span></td>
                <td class="text-3">{{ formatDate(a.createdAt) }}</td>
                <td>
                  <span v-if="a.hasMedia" class="media-badge">Files attached</span>
                  <span v-else class="no-media-badge">No creative</span>
                </td>
                <td>
                  <div class="action-btns">
                    <NuxtLink :to="`/dashboard/booking/edit/${a.id}?mode=view`" class="act-btn act-btn--view">View Brief</NuxtLink>
                    <NuxtLink :to="`/dashboard/design?advert=${a.id}`" class="act-btn act-btn--submit">Upload Creative</NuxtLink>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="role-guide card" style="margin-top:14px">
          <div class="card__hd"><span class="card__title">Design House Workflow Guide</span></div>
          <div class="guide-steps">
            <div class="guide-step">
              <div class="step-num">1</div>
              <div class="step-body">
                <div class="step-title">Review the Brief</div>
                <div class="step-desc">All approved adverts appear in your queue. Click "View Brief" to see the full advert specification: platform, ad size, ad type (full colour vs BW), dimensions, and the client's reference document if available.</div>
              </div>
            </div>
            <div class="guide-step">
              <div class="step-num">2</div>
              <div class="step-body">
                <div class="step-title">Prepare the Creative</div>
                <div class="step-desc">Use the ad size, ad type (full_color / bw), and platform specifications to produce the artwork. Accepted file formats include PDF (print), MP4 (TV/digital), MP3 (radio), and common image formats (JPG, PNG, TIFF).</div>
              </div>
            </div>
            <div class="guide-step">
              <div class="step-num">3</div>
              <div class="step-body">
                <div class="step-title">Upload &amp; Version</div>
                <div class="step-desc">Click "Upload Creative" to attach files to the advert. Multiple versions can be uploaded — the system tracks version history. The sub-editor can see all attached files when scheduling the advert for publication.</div>
              </div>
            </div>
            <div class="guide-step">
              <div class="step-num">4</div>
              <div class="step-body">
                <div class="step-title">Confirm Attachment</div>
                <div class="step-desc">Once uploaded, the advert's creative status updates from "No Creative" to "Files Attached". The schedule queue will show the correct file count. If revisions are needed, upload a new version — old versions are preserved for reference.</div>
              </div>
            </div>
          </div>
        </div>

      </section>

    </div><!-- /main -->

    <!-- Global error banner -->
    <transition name="toast-fade">
      <div v-if="globalError" class="global-err">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5"/><path d="M8 5v3M8 11v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        {{ globalError }}
        <button @click="globalError = ''">×</button>
      </div>
    </transition>

  </div><!-- /admin-shell -->
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { navigateTo } from '#app'
import { useAdverts } from '~/composables/useAdverts'
import { usePayments } from '~/composables/usePayments'
import { useDashboard } from '~/composables/useDashboard'
import { useAuth } from '~/composables/useAuth'

definePageMeta({
  layout: 'admin'   // dedicated blank layout — no AppHeader/SideMenu collision
                       // is null even for valid admins — auth enforced in onMounted
})

  //middleware: ['auth'] // role middleware fires before store hydration; userRole.value
// ── AUTH ──────────────────────────────────────────────────────────────────────
const { userName, userInitials, initAuth } = useAuth()
const authReady = ref(false)

// ── COMPOSABLES ───────────────────────────────────────────────────────────────
const {
  adverts, loading: advertsLoading, error: advertsError,
  loadAdverts, submitForReview,
  getFullSchedules, updateSchedulePage, toggleSchedulePublish, unscheduleAdvert
} = useAdverts()

const {
  transactions, loading: paymentsLoading, error: paymentsError,
  loadTransactions, collectedThisMonth, outstanding, pendingPayments,
  collectionRate, totalRevenue
} = usePayments()

const { stats: dashStats, recentActivities } = useDashboard()

// ── UI STATE ──────────────────────────────────────────────────────────────────
const activeSection  = ref('overview')
const toast          = ref('')
const toastType      = ref('success')
const globalError    = ref('')
const currentTime    = ref('')
let clockTimer       = null
let schedulesLoading = ref(false)
let schedulesError   = ref('')

// ── SECTION NAVIGATION ────────────────────────────────────────────────────────
const sections = computed(() => [
  { id: 'overview',             label: 'Overview',      icon: svgHome,   badge: null },
  { id: 'booking_clerk',        label: 'Booking Clerk', icon: svgDoc,    badge: clerkStats.value.draft || null },
  { id: 'sub_editor',           label: 'Sub-Editor',    icon: svgGrid,   badge: scheduleStats.value.noPage || null },
  { id: 'advertising_manager',  label: 'Ad. Manager',   icon: svgCheck,  badge: mgrStats.value.awaiting || null },
  { id: 'design_house',         label: 'Design House',  icon: svgDesign, badge: designStats.value.noMedia || null },
  { id: 'payments',             label: 'Finance',       icon: svgCard,   badge: paymentKpis.value.pendingCount || null },
  { id: 'reports',              label: 'Reports',       icon: svgBar,    badge: null },
])

const sectionMeta = {
  overview: { title: 'Administrator Overview' },
  booking_clerk:    { title: 'Clerk Workspace — Booking Management' },
  sub_editor:   { title: 'Editor Workspace — Schedule Queue' },
  payments: { title: 'Finance — Payment Collection' },
  reports:  { title: 'Finance — Reports' },
}

const currentSection = computed(() => sectionMeta[activeSection.value])

const switchSection = (id) => {
  activeSection.value = id
  if (id === 'clerk')    loadClerkAdverts()
  if (id === 'editor')   loadSchedules()
  if (id === 'payments') loadPayments()
}

const refreshCurrentSection = () => switchSection(activeSection.value)

// ── SVG ICONS ─────────────────────────────────────────────────────────────────
const svgHome = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`
const svgDoc  = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`
const svgGrid = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="1"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>`
const svgCard = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="1" y="4" width="22" height="16" rx="1"/><line x1="1" y1="10" x2="23" y2="10"/></svg>`
const svgBar  = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`
const svgCheck  = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>`
const svgDesign = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>`

// ── CLOCK ─────────────────────────────────────────────────────────────────────
const updateClock = () => {
  currentTime.value = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

// ── TOAST ─────────────────────────────────────────────────────────────────────
const showToast = (msg, type = 'success') => {
  toast.value = msg; toastType.value = type
  setTimeout(() => { toast.value = '' }, 3000)
}

const toastIcon = computed(() =>
  toastType.value === 'success'
    ? `<svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M2 8l4 4 8-8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`
    : `<svg width="12" height="12" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5"/><path d="M8 5v3" stroke="currentColor" stroke-width="1.5"/></svg>`
)

// ── OVERVIEW KPIs ─────────────────────────────────────────────────────────────
const kpiData = computed(() => ({
  totalAdverts:    adverts.value.length,
  pendingReview:   adverts.value.filter(a => a.status === 'submitted').length,
  revenueMonth:    totalRevenue.value,
  awaitingPayment: pendingPayments.value,
  published:       schedules.value.filter(s => s.is_published).length,
}))

// ── CLERK SECTION ─────────────────────────────────────────────────────────────
const clerkSearch       = ref('')
const clerkStatusFilter = ref('')

const clerkStats = computed(() => ({
  total:     adverts.value.length,
  draft:     adverts.value.filter(a => a.status === 'draft').length,
  submitted: adverts.value.filter(a => a.status === 'submitted').length,
  approved:  adverts.value.filter(a => a.status === 'approved').length,
  scheduled: adverts.value.filter(a => a.status === 'scheduled').length,
}))

const filteredAdverts = computed(() => {
  let list = [...adverts.value]
  if (clerkStatusFilter.value) list = list.filter(a => a.status === clerkStatusFilter.value)
  if (clerkSearch.value) {
    const q = clerkSearch.value.toLowerCase()
    list = list.filter(a =>
      (a.clientName   || '').toLowerCase().includes(q) ||
      (a.advertTitle  || '').toLowerCase().includes(q) ||
      (a.reference    || '').toLowerCase().includes(q)
    )
  }
  return list
})

const loadClerkAdverts = async () => {
  try { await loadAdverts() }
  catch (e) { globalError.value = e.message }
}

const submitAdvert = async (id) => {
  try {
    await submitForReview(id)
    showToast('Advert submitted for review')
    loadClerkAdverts()
  } catch (e) { globalError.value = e.message }
}

const filterAdverts = () => {} // reactive, no action needed

// ── EDITOR SECTION ────────────────────────────────────────────────────────────
const schedules = ref([])
const editorFilters = ref({ dateFrom: '', dateTo: '', status: '', search: '' })
const activeRange   = ref('This Week')

const quickRanges = [
  { label: 'Today',     days: 0 },
  { label: 'This Week', days: 7 },
  { label: 'Next 14d',  days: 14 },
  { label: 'This Month',days: 30 },
]

const applyRange = (r) => {
  const today = new Date()
  const end   = new Date()
  end.setDate(today.getDate() + r.days)
  editorFilters.value.dateFrom = today.toISOString().split('T')[0]
  editorFilters.value.dateTo   = end.toISOString().split('T')[0]
  activeRange.value = r.label
  loadSchedules()
}

const scheduleStats = computed(() => ({
  total:     filteredSchedules.value.length,
  noPage:    filteredSchedules.value.filter(s => !s.page || s.page === 0).length,
  paged:     filteredSchedules.value.filter(s => s.page > 0 && !s.is_published).length,
  published: filteredSchedules.value.filter(s => s.is_published).length,
  withMedia: filteredSchedules.value.filter(s => s.media?.length > 0).length,
}))

const filteredSchedules = computed(() => {
  let s = [...schedules.value]
  if (editorFilters.value.status === 'scheduled') s = s.filter(x => !x.is_published && (!x.page || x.page === 0))
  else if (editorFilters.value.status === 'paged')     s = s.filter(x => x.page > 0 && !x.is_published)
  else if (editorFilters.value.status === 'published') s = s.filter(x => x.is_published)
  if (editorFilters.value.search) {
    const q = editorFilters.value.search.toLowerCase()
    s = s.filter(x =>
      (x.company_name  || '').toLowerCase().includes(q) ||
      (x.advert_title  || '').toLowerCase().includes(q)
    )
  }
  return s
})

const loadSchedules = async () => {
  schedulesLoading.value = true; schedulesError.value = ''
  try {
    const params = {}
    if (editorFilters.value.dateFrom) params.startDate = editorFilters.value.dateFrom
    if (editorFilters.value.dateTo)   params.endDate   = editorFilters.value.dateTo
    const result = await getFullSchedules(params)
    schedules.value = Array.isArray(result) ? result : (result?.data || [])
  } catch (e) { schedulesError.value = e.message || 'Failed to load schedules' }
  finally { schedulesLoading.value = false }
}

const onPageUpdate = async (scheduleId, page) => {
  try {
    await updateSchedulePage(scheduleId, page)
    const i = schedules.value.findIndex(s => s.schedule_id === scheduleId)
    if (i !== -1) schedules.value[i] = { ...schedules.value[i], page }
    showToast(`Page ${page} assigned`)
  } catch (e) { globalError.value = e.message }
}

const onPublishToggle = async (scheduleId, isPublished) => {
  const s = schedules.value.find(x => x.schedule_id === scheduleId)
  if (isPublished && s && (!s.page || s.page < 1)) {
    globalError.value = 'Assign a page number before publishing.'
    return
  }
  try {
    await toggleSchedulePublish(scheduleId, isPublished)
    const i = schedules.value.findIndex(x => x.schedule_id === scheduleId)
    if (i !== -1) schedules.value[i] = { ...schedules.value[i], is_published: isPublished }
    showToast(isPublished ? 'Published' : 'Unpublished')
  } catch (e) { globalError.value = e.message }
}

const onUnschedule = async (scheduleId) => {
  if (!confirm('Remove this schedule?')) return
  try {
    await unscheduleAdvert(scheduleId)
    schedules.value = schedules.value.filter(s => s.schedule_id !== scheduleId)
    showToast('Schedule removed')
  } catch (e) { globalError.value = e.message }
}

// ── PAYMENTS SECTION ──────────────────────────────────────────────────────────
const payStartDate    = ref('')
const payEndDate      = ref('')
const payStatusFilter = ref('')
const paySearch       = ref('')
const activePayRange  = ref('This Month')

const payQuickRanges = [
  { label: 'Today', start: 0, end: 0 },
  { label: 'This Week', start: 7, end: 0 },
  { label: 'This Month', start: 30, end: 0 },
]

const applyPayRange = (r) => {
  const now   = new Date()
  const start = new Date()
  start.setDate(now.getDate() - r.start)
  payStartDate.value   = start.toISOString().split('T')[0]
  payEndDate.value     = now.toISOString().split('T')[0]
  activePayRange.value = r.label
  loadPayments()
}

const paymentKpis = computed(() => ({
  totalBilled:    totalRevenue.value,
  collected:      collectedThisMonth.value,
  outstanding:    outstanding.value,
  collectionRate: collectionRate.value,
  pendingCount:   pendingPayments.value,
}))

const filteredTransactions = computed(() => {
  let t = [...transactions.value]
  if (payStatusFilter.value) t = t.filter(x => x.paymentStatus === payStatusFilter.value)
  if (paySearch.value) {
    const q = paySearch.value.toLowerCase()
    t = t.filter(x => (x.clientName || '').toLowerCase().includes(q) || (x.reference || '').toLowerCase().includes(q))
  }
  return t
})

const loadPayments = async () => {
  try {
    await loadTransactions({ startDate: payStartDate.value, endDate: payEndDate.value })
  } catch (e) { globalError.value = e.message }
}

const exportPayments = () => {
  showToast('Export started — check Downloads folder', 'success')
}

// ── ADVERTISING MANAGER SECTION ───────────────────────────────────────────────
const mgrStatusFilter = ref('submitted')
const mgrSearch       = ref('')

const mgrStats = computed(() => ({
  total:    adverts.value.length,
  awaiting: adverts.value.filter(a => a.status === 'submitted').length,
  approved: adverts.value.filter(a => a.status === 'approved').length,
  rejected: adverts.value.filter(a => a.status === 'cancelled' || a.status === 'rejected').length,
}))

const mgrFilteredAdverts = computed(() => {
  let list = [...adverts.value]
  if (mgrStatusFilter.value) list = list.filter(a => a.status === mgrStatusFilter.value)
  if (mgrSearch.value) {
    const q = mgrSearch.value.toLowerCase()
    list = list.filter(a =>
      (a.clientName  || '').toLowerCase().includes(q) ||
      (a.advertTitle || '').toLowerCase().includes(q)
    )
  }
  return list
})

const approveAdvert = async (id) => {
  // In production: call API endpoint to approve
  showToast(`Advert ${id} approved — moved to editor queue`)
  await loadClerkAdverts()
}

const rejectAdvert = async (id) => {
  // In production: call API endpoint to reject
  showToast(`Advert ${id} returned to booking clerk`, 'error')
  await loadClerkAdverts()
}

// ── DESIGN HOUSE SECTION ──────────────────────────────────────────────────────
const designStatusFilter = ref('')
const designSearch       = ref('')

const designStats = computed(() => ({
  total:    adverts.value.filter(a => ['approved','scheduled'].includes(a.status)).length,
  noMedia:  adverts.value.filter(a => ['approved','scheduled'].includes(a.status) && !a.hasMedia).length,
  withMedia: adverts.value.filter(a => ['approved','scheduled'].includes(a.status) && a.hasMedia).length,
}))

const designFilteredAdverts = computed(() => {
  let list = adverts.value.filter(a => ['approved','scheduled'].includes(a.status))
  if (designStatusFilter.value) list = list.filter(a => a.status === designStatusFilter.value)
  if (designSearch.value) {
    const q = designSearch.value.toLowerCase()
    list = list.filter(a =>
      (a.clientName  || '').toLowerCase().includes(q) ||
      (a.advertTitle || '').toLowerCase().includes(q)
    )
  }
  return list
})

// ── REPORTS SECTION ───────────────────────────────────────────────────────────
const reportGenerating = ref(false)
const reportResult     = ref(null)
const reportForm = ref({
  reportType: '',
  period:     '',
  startDate:  '',
  endDate:    '',
  platform:   '',
  format:     'table',
})

const reportTypes = [
  { id: 'revenue_summary',      name: 'Revenue Summary',          icon: svgBar, desc: 'Total revenue by period, platform and client.' },
  { id: 'payment_collection',   name: 'Payment Collection',       icon: svgCard, desc: 'Collection rates, paid vs outstanding by period.' },
  { id: 'outstanding_invoices', name: 'Outstanding Invoices',     icon: svgDoc, desc: 'All unpaid balances sorted by age and amount.' },
  { id: 'platform_performance', name: 'Platform Performance',     icon: svgGrid, desc: 'Revenue and volume breakdown by Print, Radio, TV, Digital.' },
  { id: 'client_activity',      name: 'Client Activity',          icon: svgHome, desc: 'Bookings, spend and payment history per client.' },
  { id: 'payment_methods',      name: 'Payment Methods Analysis', icon: svgBar, desc: 'Cash, bank transfer, cheque breakdown and trends.' },
]

const handlePeriodChange = () => {
  if (reportForm.value.period !== 'custom') {
    reportForm.value.startDate = ''
    reportForm.value.endDate   = ''
  }
}

const getReportLabel  = (id) => reportTypes.find(r => r.id === id)?.name || id
const getPeriodLabel  = (p) => ({
  this_month: 'This Month', last_month: 'Last Month',
  this_quarter: 'This Quarter', this_year: 'This Year', custom: 'Custom Range'
}[p] || p)

const generateReport = async () => {
  reportGenerating.value = true
  await new Promise(r => setTimeout(r, 900)) // simulate API call
  reportResult.value     = { generated: true }
  reportGenerating.value = false
  showToast('Report generated successfully')
}

// ── HELPERS ───────────────────────────────────────────────────────────────────
const formatCurrency = (n) => {
  if (!n && n !== 0) return '—'
  return 'UGX ' + Number(n).toLocaleString('en-UG', { maximumFractionDigits: 0 })
}

const formatDate = (d) => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

const truncate = (str, n) => str && str.length > n ? str.slice(0, n) + '…' : (str || '—')

const getStatusClass = (s) => ({
  draft: 'draft', submitted: 'submitted', approved: 'approved',
  scheduled: 'scheduled', paid: 'paid', cancelled: 'cancelled'
}[s] || 'draft')

const getStatusLabel = (s) => ({
  draft: 'Draft', submitted: 'Submitted', approved: 'Approved',
  scheduled: 'Scheduled', paid: 'Paid', cancelled: 'Cancelled'
}[s] || s)

// ── LIFECYCLE ─────────────────────────────────────────────────────────────────
onMounted(() => {
  // ── Step 1: Hydrate auth from localStorage FIRST (before any API calls)
  // The role middleware runs before component mount so the Pinia store is empty.
  // We read localStorage directly here to guard the page properly.
  const authResult = initAuth()
  if (!authResult?.isAuthenticated) {
    navigateTo('/login')
    return
  }

  // Role check — read directly from localStorage to avoid stale store state
  try {
    const storedUser = JSON.parse(localStorage.getItem('vgams_user') || '{}')
    if (storedUser?.role !== 'administrator') {
      navigateTo('/unauthorized')
      return
    }
  } catch {
    navigateTo('/login')
    return
  }

  authReady.value = true

  // ── Step 2: Start the clock
  updateClock()
  clockTimer = setInterval(updateClock, 1000)

  // ── Step 3: Set date defaults
  const today  = new Date()
  const wkEnd  = new Date(); wkEnd.setDate(today.getDate() + 7)
  editorFilters.value.dateFrom = today.toISOString().split('T')[0]
  editorFilters.value.dateTo   = wkEnd.toISOString().split('T')[0]

  const mStart = new Date(today.getFullYear(), today.getMonth(), 1)
  payStartDate.value = mStart.toISOString().split('T')[0]
  payEndDate.value   = today.toISOString().split('T')[0]

  // ── Step 4: Load all sections in background
  loadClerkAdverts()
  loadSchedules()
  loadPayments()
})

onUnmounted(() => { if (clockTimer) clearInterval(clockTimer) })
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap');

/* ── DESIGN TOKENS ───────────────────────────────────────────────────────── */
.admin-shell {
  --navy:      #003366;
  --navy-d:    #002244;
  --navy-l:    #004080;
  --red:       #E31E24;
  --blue:      #0066CC;
  --blue-lt:   #EEF4FF;
  --green:     #166534;
  --green-lt:  #F0FDF4;
  --amber:     #78350F;
  --amber-lt:  #FFFBEB;
  --surface:   #FFFFFF;
  --page-bg:   #F0F4F8;
  --border:    #D1D9E0;
  --border-lt: #E8ECF0;
  --text-1:    #0F172A;
  --text-2:    #334155;
  --text-3:    #64748B;
  --text-4:    #94A3B8;
  --radius:    2px;
  --font:      "IBM Plex Sans", -apple-system, "Segoe UI", sans-serif;
  --mono:      "IBM Plex Mono", "Courier New", monospace;
  --shadow:    0 1px 3px rgba(0,0,0,.08), 0 1px 2px rgba(0,0,0,.05);
  --shadow-md: 0 4px 16px rgba(0,0,0,.10);

  display: flex;
  height: 100vh;
  overflow: hidden;
  font-family: var(--font);
  font-size: 13px;
  color: var(--text-1);
  background: var(--page-bg);
}

/* ── RAIL ────────────────────────────────────────────────────────────────── */
.rail {
  width: 196px;
  flex-shrink: 0;
  background: var(--navy);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-right: 1px solid var(--navy-d);
}

.rail__brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 18px 16px 14px;
  border-bottom: 1px solid rgba(255,255,255,.08);
}

.rail__logo { width: 28px; height: 28px; flex-shrink: 0; }

.rail__name {
  font-size: 13px;
  font-weight: 700;
  color: #fff;
  letter-spacing: .04em;
  line-height: 1.3;
}

.rail__name small {
  font-size: 10px;
  font-weight: 400;
  color: rgba(255,255,255,.5);
  text-transform: uppercase;
  letter-spacing: .08em;
  display: block;
}

.rail__sections {
  flex: 1;
  padding: 10px 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow-y: auto;
}

.rail__item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  border: none;
  background: none;
  color: rgba(255,255,255,.6);
  border-radius: var(--radius);
  cursor: pointer;
  font-family: var(--font);
  font-size: 13px;
  font-weight: 500;
  text-align: left;
  width: 100%;
  transition: background 120ms, color 120ms;
  position: relative;
}

.rail__item:hover {
  background: rgba(255,255,255,.07);
  color: rgba(255,255,255,.9);
}

.rail__item--active {
  background: rgba(255,255,255,.12);
  color: #fff;
  font-weight: 600;
}

.rail__item--active::before {
  content: '';
  position: absolute;
  left: 0; top: 6px; bottom: 6px;
  width: 3px;
  background: #9DC3E6;
  border-radius: 0 2px 2px 0;
}

.rail__icon { flex-shrink: 0; display: flex; }
.rail__label { flex: 1; }

.rail__badge {
  height: 18px;
  min-width: 18px;
  padding: 0 5px;
  background: var(--red);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  border-radius: 9px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.rail__user {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-top: 1px solid rgba(255,255,255,.08);
}

.rail__avatar {
  width: 30px; height: 30px;
  background: rgba(255,255,255,.15);
  border: 1px solid rgba(255,255,255,.2);
  border-radius: var(--radius);
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-weight: 700; font-size: 11px; flex-shrink: 0;
}

.rail__username { color: rgba(255,255,255,.9); font-size: 12px; font-weight: 600; }
.rail__role     { color: rgba(255,255,255,.45); font-size: 10px; text-transform: uppercase; letter-spacing: .05em; }

/* ── MAIN ────────────────────────────────────────────────────────────────── */
.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}

/* ── TOPBAR ──────────────────────────────────────────────────────────────── */
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 24px 10px;
  background: var(--surface);
  border-bottom: 2px solid #DEEAF1;
  flex-shrink: 0;
  gap: 16px;
}

.topbar__eyebrow {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .07em;
  color: var(--text-4);
  margin-bottom: 2px;
}

.topbar__title {
  font-size: 18px;
  font-weight: 700;
  color: var(--navy);
  margin: 0;
  line-height: 1.2;
}

.topbar__right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.topbar__toast {
  display: flex; align-items: center; gap: 6px;
  padding: 5px 12px;
  font-size: 12px; font-weight: 600;
  border-radius: var(--radius);
}

.toast--success { background: var(--green-lt); color: var(--green); border: 1px solid #86EFAC; }
.toast--error   { background: #FEF2F2; color: #991B1B; border: 1px solid #FECACA; }

.topbar__btn {
  display: inline-flex; align-items: center; gap: 6px;
  height: 30px; padding: 0 12px;
  background: var(--page-bg); border: 1.5px solid var(--border);
  border-radius: var(--radius); color: var(--text-2);
  font-family: var(--font); font-size: 12px; font-weight: 600;
  cursor: pointer; transition: all 120ms;
}
.topbar__btn:hover { border-color: var(--blue); color: var(--blue); background: var(--blue-lt); }

.topbar__clock {
  font-family: var(--mono);
  font-size: 12px;
  color: var(--text-4);
  letter-spacing: .04em;
}

/* ── SECTION BODY ────────────────────────────────────────────────────────── */
.section-body {
  flex: 1;
  overflow-y: auto;
  padding: 18px 24px 32px;
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* ── KPI BAND ────────────────────────────────────────────────────────────── */
.kpi-band {
  display: flex;
  background: var(--navy);
  border-bottom: 3px solid var(--navy-d);
  margin-bottom: 16px;
  flex-shrink: 0;
}

.kpi-cell {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 14px 12px;
  gap: 3px;
}

.kpi-div { width: 1px; background: rgba(157,195,230,.18); flex-shrink: 0; }

.kpi-val {
  font-size: 20px;
  font-weight: 700;
  color: #fff;
  font-family: var(--mono);
  line-height: 1;
}

.kpi-lbl {
  font-size: 9px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .06em;
  color: rgba(255,255,255,.45);
}

.kpi-sub {
  font-size: 9px;
  color: rgba(255,255,255,.35);
}

.kpi--amber .kpi-val { color: #FFCC00; }
.kpi--green .kpi-val { color: #A9D18E; }
.kpi--red   .kpi-val { color: #FF8080; }
.kpi--blue  .kpi-val { color: #9DC3E6; }
.kpi--navy  .kpi-val { color: #fff; }

/* ── CARDS ───────────────────────────────────────────────────────────────── */
.card {
  background: var(--surface);
  border: 1px solid var(--border-lt);
  box-shadow: var(--shadow);
  margin-bottom: 0;
}

.card__hd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border-bottom: 1px solid var(--border-lt);
  background: var(--page-bg);
}

.card__title {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .06em;
  color: var(--text-3);
}

.card__badge {
  height: 18px; padding: 0 8px;
  display: inline-flex; align-items: center;
  background: var(--navy); color: #fff;
  font-size: 9px; font-weight: 700;
  text-transform: uppercase; letter-spacing: .06em;
  border-radius: 1px;
}

/* ── OVERVIEW GRID ───────────────────────────────────────────────────────── */
.overview-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-bottom: 0;
}

/* Activity */
.activity-list { display: flex; flex-direction: column; }

.activity-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 16px;
  border-bottom: 1px solid var(--border-lt);
  transition: background 100ms;
}
.activity-row:last-child { border-bottom: none; }
.activity-row:hover { background: var(--page-bg); }

.activity-dot {
  width: 8px; height: 8px; border-radius: 50%;
  flex-shrink: 0; margin-top: 4px;
}
.dot--booking { background: var(--blue); }
.dot--payment { background: #16a34a; }
.dot--approval { background: #d97706; }
.dot--info     { background: var(--text-4); }

.activity-content { flex: 1; min-width: 0; }
.activity-title   { font-size: 12px; font-weight: 600; color: var(--text-1); }
.activity-desc    { font-size: 11px; color: var(--text-3); margin-top: 1px; }
.activity-time    { font-size: 10px; color: var(--text-4); flex-shrink: 0; white-space: nowrap; }

/* Role cards */
.role-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
}

.role-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  padding: 14px 16px;
  border: none;
  border-right: 1px solid var(--border-lt);
  border-bottom: 1px solid var(--border-lt);
  background: var(--surface);
  cursor: pointer;
  text-align: left;
  transition: background 120ms;
  font-family: var(--font);
}
.role-card:nth-child(2n) { border-right: none; }
.role-card:nth-child(3), .role-card:nth-child(4) { border-bottom: none; }
.role-card:hover { background: var(--blue-lt); }

.role-card__icon {
  width: 36px; height: 36px;
  display: flex; align-items: center; justify-content: center;
  border-radius: var(--radius); margin-bottom: 6px;
}
.role-icon--clerk   { background: #EEF4FF; color: var(--blue); }
.role-icon--editor  { background: var(--amber-lt); color: var(--amber); }
.role-icon--finance { background: var(--green-lt); color: var(--green); }
.role-icon--reports { background: #F8F0FF; color: #6B21A8; }

.role-card__label { font-size: 13px; font-weight: 700; color: var(--text-1); }
.role-card__desc  { font-size: 11px; color: var(--text-3); }
.role-card__stat  { font-size: 11px; font-weight: 600; color: var(--blue); margin-top: 4px; }

/* ── STRIP ───────────────────────────────────────────────────────────────── */
.strip {
  display: flex;
  background: var(--navy);
  flex-shrink: 0;
}

.strip-cell {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 12px;
  gap: 2px;
}

.strip-div { width: 1px; background: rgba(157,195,230,.18); }

.strip-val {
  font-size: 18px; font-weight: 700;
  color: #fff; font-family: var(--mono); line-height: 1;
}

.strip-lbl {
  font-size: 9px; font-weight: 600;
  text-transform: uppercase; letter-spacing: .06em;
  color: rgba(255,255,255,.4);
}

.strip--amber .strip-val { color: #FFCC00; }
.strip--blue  .strip-val { color: #9DC3E6; }
.strip--green .strip-val { color: #A9D18E; }
.strip--navy  .strip-val { color: #7CB9E8; }

/* ── TOOLBAR ─────────────────────────────────────────────────────────────── */
.toolbar {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding: 10px 14px;
  background: var(--surface);
  border: 1px solid var(--border-lt);
  border-bottom: none;
}

.toolbar__left  { display: flex; align-items: flex-end; gap: 10px; flex-wrap: wrap; flex: 1; }
.toolbar__right { display: flex; align-items: flex-end; gap: 8px; }

.tb-group { display: flex; flex-direction: column; gap: 4px; }
.tb-lbl { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: var(--text-4); }

.tb-input, .tb-sel, .tb-date {
  height: 32px; padding: 0 10px;
  border: 1.5px solid var(--border); border-radius: var(--radius);
  font-family: var(--font); font-size: 12px; color: var(--text-1);
  background: var(--surface); outline: none;
  transition: border-color 120ms;
}
.tb-input:focus, .tb-sel:focus, .tb-date:focus {
  border-color: var(--blue);
  box-shadow: 0 0 0 3px rgba(0,102,204,.12);
}
.tb-input { width: 200px; }

.tb-btn {
  display: inline-flex; align-items: center; gap: 6px;
  height: 32px; padding: 0 14px;
  background: var(--page-bg); border: 1.5px solid var(--border);
  border-radius: var(--radius); color: var(--text-2);
  font-family: var(--font); font-size: 12px; font-weight: 600;
  cursor: pointer; text-decoration: none; white-space: nowrap;
  transition: all 120ms;
}
.tb-btn:hover { border-color: var(--blue); color: var(--blue); background: var(--blue-lt); }

.tb-btn--primary {
  background: var(--navy); color: #fff; border-color: var(--navy-d);
}
.tb-btn--primary:hover { background: var(--navy-l); }

.range-pills { display: flex; align-items: flex-end; gap: 4px; }
.range-pill {
  height: 32px; padding: 0 11px;
  border: 1.5px solid var(--border); background: var(--page-bg);
  color: var(--text-3); font-family: var(--font);
  font-size: 11px; font-weight: 600; cursor: pointer;
  border-radius: var(--radius); transition: all 120ms;
}
.range-pill:hover { background: #DEEAF1; border-color: #9DC3E6; color: var(--navy); }
.range-pill--active { background: var(--navy); color: #fff; border-color: var(--navy); }

/* ── DATA TABLE ──────────────────────────────────────────────────────────── */
.data-table {
  width: 100%; border-collapse: collapse;
  font-size: 12px;
}

.data-table th {
  padding: 8px 14px;
  text-align: left;
  font-size: 10px; font-weight: 700; text-transform: uppercase;
  letter-spacing: .05em; color: var(--text-3);
  background: var(--page-bg);
  border-bottom: 1.5px solid var(--border);
  white-space: nowrap;
}

.data-table td {
  padding: 9px 14px;
  border-bottom: 1px solid var(--border-lt);
  color: var(--text-1);
  vertical-align: middle;
}

.data-table tbody tr:last-child td { border-bottom: none; }
.data-table tbody tr:nth-child(even) td { background: var(--page-bg); }
.data-table tbody tr:hover td { background: var(--blue-lt); }

.data-table--compact td { padding: 7px 10px; }
.data-table--compact th { padding: 7px 10px; }

.row--published td { border-left: 3px solid #16a34a; }
.row--no-page  td:first-child { border-left: 3px solid #d97706; }

.empty-cell { text-align: center; color: var(--text-4); padding: 32px 14px !important; font-style: italic; }

/* ── PILLS & BADGES ──────────────────────────────────────────────────────── */
.status-pill, .role-pill {
  display: inline-flex; align-items: center;
  height: 20px; padding: 0 8px;
  font-size: 10px; font-weight: 700;
  text-transform: uppercase; letter-spacing: .04em;
  border-radius: 1px;
}

.pill--draft     { background: var(--page-bg); color: var(--text-3); border: 1px solid var(--border); }
.pill--submitted { background: #FFFBEB; color: var(--amber); border: 1px solid #FCD34D; }
.pill--approved  { background: var(--green-lt); color: var(--green); border: 1px solid #86EFAC; }
.pill--scheduled { background: var(--blue-lt); color: var(--blue); border: 1px solid rgba(0,102,204,.2); }
.pill--paid      { background: var(--green-lt); color: var(--green); border: 1px solid #86EFAC; }
.pill--cancelled { background: #FEF2F2; color: #991B1B; border: 1px solid #FECACA; }
.pill--ok        { background: var(--green-lt); color: var(--green); border: 1px solid #86EFAC; }

.pill--clerk     { background: var(--blue-lt); color: var(--blue); border: 1px solid rgba(0,102,204,.2); }
.pill--editor    { background: var(--amber-lt); color: var(--amber); border: 1px solid #FCD34D; }
.pill--finance   { background: var(--green-lt); color: var(--green); border: 1px solid #86EFAC; }
.pill--admin     { background: #F3E8FF; color: #6B21A8; border: 1px solid #D8B4FE; }

.pill--pay-paid    { background: var(--green-lt); color: var(--green); border: 1px solid #86EFAC; }
.pill--pay-partial { background: #FFFBEB; color: var(--amber); border: 1px solid #FCD34D; }
.pill--pay-unpaid  { background: #FEF2F2; color: #991B1B; border: 1px solid #FECACA; }

.platform-pill {
  display: inline-flex; align-items: center;
  height: 18px; padding: 0 7px;
  background: #EEF4FF; color: var(--blue);
  border: 1px solid rgba(0,102,204,.15);
  font-size: 9px; font-weight: 700;
  text-transform: uppercase; letter-spacing: .04em;
  border-radius: 1px;
}

/* ── ACTION BUTTONS ──────────────────────────────────────────────────────── */
.action-btns { display: flex; gap: 5px; }

.act-btn {
  display: inline-flex; align-items: center;
  height: 26px; padding: 0 10px;
  border-radius: var(--radius); border: 1.5px solid;
  font-family: var(--font); font-size: 11px; font-weight: 600;
  cursor: pointer; text-decoration: none; white-space: nowrap;
  transition: all 120ms;
}

.act-btn--view   { background: var(--blue-lt); color: var(--blue); border-color: rgba(0,102,204,.2); }
.act-btn--view:hover { background: #dce9ff; }
.act-btn--submit { background: var(--green-lt); color: var(--green); border-color: #86EFAC; }
.act-btn--submit:hover { background: #dcfce7; }
.act-btn--danger { background: #FEF2F2; color: #991B1B; border-color: #FECACA; }
.act-btn--danger:hover { background: #FFE0E0; }

/* ── PAGE INPUT ──────────────────────────────────────────────────────────── */
.page-input {
  width: 58px; height: 28px; padding: 0 6px;
  border: 1.5px solid var(--border); border-radius: var(--radius);
  font-family: var(--mono); font-size: 12px; font-weight: 600;
  color: var(--text-1); background: var(--surface);
  text-align: center; outline: none;
  transition: border-color 120ms;
}
.page-input:focus { border-color: var(--blue); box-shadow: 0 0 0 3px rgba(0,102,204,.12); }
.page-input--empty { border-color: #FCD34D; background: var(--amber-lt); }

/* ── PUBLISH TOGGLE ──────────────────────────────────────────────────────── */
.pub-toggle {
  height: 22px; padding: 0 9px;
  border: 1.5px solid; border-radius: 11px;
  font-family: var(--font); font-size: 10px; font-weight: 700;
  text-transform: uppercase; letter-spacing: .04em;
  cursor: pointer; transition: all 120ms; white-space: nowrap;
}
.pub-toggle--on  { background: var(--green-lt); color: var(--green); border-color: #86EFAC; }
.pub-toggle--off { background: var(--page-bg);  color: var(--text-4); border-color: var(--border); }
.pub-toggle--on:hover  { background: #dcfce7; }
.pub-toggle--off:hover { background: #DEEAF1; color: var(--navy); }

.media-badge {
  display: inline-flex; align-items: center;
  height: 20px; padding: 0 7px;
  background: #EEF4FF; color: var(--blue); border: 1px solid rgba(0,102,204,.15);
  font-size: 10px; font-weight: 600; border-radius: 1px;
}

/* ── MISC TYPOGRAPHY ─────────────────────────────────────────────────────── */
.fw500    { font-weight: 500; }
.mono     { font-family: var(--mono); font-variant-numeric: tabular-nums; }
.text-3   { color: var(--text-3); }
.text-4   { color: var(--text-4); }
.text-green { color: var(--green); }
.text-red   { color: #991B1B; }
.link { color: var(--blue); text-decoration: none; font-weight: 600; }
.link:hover { text-decoration: underline; }
.ref-code {
  font-family: var(--mono); font-size: 11px; font-weight: 600;
  background: var(--page-bg); border: 1px solid var(--border-lt);
  padding: 1px 6px; border-radius: 1px; color: var(--navy);
}

/* ── GUIDE STEPS ─────────────────────────────────────────────────────────── */
.role-guide .guide-steps {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0;
}

.guide-step {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 16px;
  border-right: 1px solid var(--border-lt);
}
.guide-step:last-child { border-right: none; }

.step-num {
  width: 24px; height: 24px;
  background: var(--navy); color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 700;
  border-radius: 1px; flex-shrink: 0;
}

.step-title { font-size: 12px; font-weight: 700; color: var(--text-1); margin-bottom: 3px; }
.step-desc  { font-size: 11px; color: var(--text-3); line-height: 1.55; }

/* ── SYSTEM TABLE ────────────────────────────────────────────────────────── */
.data-table code {
  font-family: var(--mono); font-size: 10px;
  background: var(--page-bg); border: 1px solid var(--border-lt);
  padding: 1px 5px; border-radius: 1px; color: var(--blue);
}

/* ── TWO-COL LAYOUT ──────────────────────────────────────────────────────── */
.two-col-layout {
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 14px;
  margin-bottom: 0;
}

/* ── REPORT FORM ─────────────────────────────────────────────────────────── */
.report-form { padding: 16px; display: flex; flex-direction: column; gap: 14px; }

.rf-group { display: flex; flex-direction: column; gap: 6px; }
.rf-lbl {
  font-size: 10px; font-weight: 700; text-transform: uppercase;
  letter-spacing: .06em; color: var(--text-3);
}
.req { color: var(--red); }

.rf-sel, .rf-input {
  height: 36px; padding: 0 12px;
  border: 1.5px solid var(--border); border-radius: var(--radius);
  font-family: var(--font); font-size: 13px; color: var(--text-1);
  background: var(--surface); outline: none;
  transition: border-color 120ms;
}
.rf-sel:focus, .rf-input:focus { border-color: var(--blue); box-shadow: 0 0 0 3px rgba(0,102,204,.12); }

.rf-radio-group { display: flex; gap: 16px; }
.rf-radio { display: flex; align-items: center; gap: 6px; cursor: pointer; font-size: 12px; color: var(--text-2); }

.rf-actions { padding-top: 4px; }
.rf-actions .tb-btn--primary { height: 36px; padding: 0 20px; font-size: 13px; }
.rf-actions .tb-btn--primary:disabled { opacity: .5; cursor: not-allowed; }

/* ── REPORT TYPES ────────────────────────────────────────────────────────── */
.report-types { display: flex; flex-direction: column; }

.rt-row {
  display: flex; align-items: center; gap: 12px;
  padding: 11px 16px; border-bottom: 1px solid var(--border-lt);
  cursor: pointer; transition: background 100ms;
}
.rt-row:last-child { border-bottom: none; }
.rt-row:hover { background: var(--page-bg); }
.rt-row--active { background: var(--blue-lt) !important; border-left: 3px solid var(--blue); }

.rt-icon { color: var(--navy); opacity: .6; flex-shrink: 0; }
.rt-name { font-size: 12px; font-weight: 700; color: var(--text-1); }
.rt-desc { font-size: 11px; color: var(--text-3); }

/* ── REPORT PLACEHOLDER ──────────────────────────────────────────────────── */
.report-placeholder {
  padding: 28px 20px; text-align: center;
  background: var(--page-bg); border-top: none;
}
.rp-icon { margin: 0 auto 12px; }
.report-placeholder p { color: var(--text-3); font-size: 12px; margin: 0 auto 8px; max-width: 420px; }
.report-placeholder code { font-family: var(--mono); font-size: 11px; background: var(--surface); border: 1px solid var(--border); padding: 1px 5px; color: var(--blue); }
.rp-meta { color: var(--text-4); font-size: 11px; }
.rp-meta strong { color: var(--text-2); }

/* ── LOADING / ERROR ─────────────────────────────────────────────────────── */
.loading-state {
  display: flex; align-items: center; gap: 10px;
  padding: 32px 20px; color: var(--text-3);
  font-size: 12px; justify-content: center;
}

.spinner {
  width: 18px; height: 18px;
  border: 2px solid var(--border);
  border-top-color: var(--blue);
  border-radius: 50%;
  animation: spin .6s linear infinite;
  flex-shrink: 0;
}
@keyframes spin { to { transform: rotate(360deg); } }

.err-banner {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 16px; margin: 0;
  background: #FEF2F2; border-left: 3px solid var(--red);
  font-size: 12px; color: #991B1B;
}
.err-dismiss {
  margin-left: auto; background: none; border: none;
  color: #991B1B; font-size: 12px; font-weight: 600;
  cursor: pointer; padding: 2px 8px;
  border: 1px solid #FECACA; border-radius: var(--radius);
}
.err-dismiss:hover { background: #FECACA; }

.global-err {
  position: fixed; bottom: 20px; left: calc(196px + 20px); right: 20px;
  z-index: 9999;
  display: flex; align-items: center; gap: 8px;
  padding: 10px 16px;
  background: #FEF2F2; border: 1px solid #FECACA; border-left: 4px solid var(--red);
  font-size: 12px; color: #991B1B;
  box-shadow: var(--shadow-md);
}
.global-err button {
  margin-left: auto; background: none; border: none;
  font-size: 18px; cursor: pointer; color: #991B1B; padding: 0; line-height: 1;
}

.toast-fade-enter-active, .toast-fade-leave-active { transition: all .25s ease; }
.toast-fade-enter-from, .toast-fade-leave-to { opacity: 0; transform: translateY(6px); }

/* ── RESPONSIVE ──────────────────────────────────────────────────────────── */
@media (max-width: 1100px) {
  .overview-grid { grid-template-columns: 1fr; }
  .two-col-layout { grid-template-columns: 1fr; }
  .role-guide .guide-steps { grid-template-columns: 1fr 1fr; }
}

@media (max-width: 768px) {
  .admin-shell { flex-direction: column; }
  .rail { width: 100%; height: auto; flex-direction: row; flex-wrap: wrap; }
  .rail__sections { flex-direction: row; padding: 6px; }
  .main { height: calc(100vh - 120px); }
  .role-guide .guide-steps { grid-template-columns: 1fr; }
}

/* ── AUTH LOADING GATE ───────────────────────────────────────────────────── */
.auth-loading {
  position: fixed; inset: 0;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 14px;
  background: #003366;
}

.auth-spinner {
  width: 32px; height: 32px;
  border: 3px solid rgba(255,255,255,.2);
  border-top-color: #9DC3E6;
  border-radius: 50%;
  animation: spin .7s linear infinite;
}

.auth-text {
  font-family: "IBM Plex Sans", sans-serif;
  font-size: 13px; font-weight: 500;
  color: rgba(255,255,255,.5);
  letter-spacing: .04em;
}


/* ── 6-CARD ROLE GRID ────────────────────────────────────────────────────── */
.role-grid--six {
  grid-template-columns: repeat(3, 1fr);
}
.role-grid--six .role-card:nth-child(2n)   { border-right: 1px solid var(--border-lt); }
.role-grid--six .role-card:nth-child(3n)   { border-right: none; }
.role-grid--six .role-card:nth-child(3),
.role-grid--six .role-card:nth-child(4),
.role-grid--six .role-card:nth-child(5),
.role-grid--six .role-card:nth-child(6)    { border-bottom: none; }
.role-grid--six .role-card:nth-child(1),
.role-grid--six .role-card:nth-child(2),
.role-grid--six .role-card:nth-child(3)    { border-bottom: 1px solid var(--border-lt); }

/* ── NEW ROLE ICON COLOURS ───────────────────────────────────────────────── */
.role-icon--mgr    { background: #FDF4FF; color: #7E22CE; }
.role-icon--design { background: #FFF7ED; color: #C2410C; }

/* ── NEW ROLE PILLS ──────────────────────────────────────────────────────── */
.pill--mgr    { background: #FAF5FF; color: #6B21A8; border: 1px solid #E9D5FF; }
.pill--design { background: #FFF7ED; color: #9A3412; border: 1px solid #FED7AA; }

/* ── ROLE INFO BANNER ────────────────────────────────────────────────────── */
.role-info-banner {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 16px;
  background: var(--surface);
  border: 1px solid var(--border-lt);
  border-left: 3px solid var(--navy);
  margin-bottom: 0;
}

.rib-icon {
  width: 40px; height: 40px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  border-radius: var(--radius);
}

.rib-body { flex: 1; }

.rib-title {
  font-size: 13px; font-weight: 700; color: var(--text-1); margin-bottom: 3px;
}

.rib-title code {
  font-family: var(--mono); font-size: 11px;
  background: var(--page-bg); border: 1px solid var(--border-lt);
  padding: 1px 5px; border-radius: 1px; color: var(--navy);
}

.rib-desc {
  font-size: 11px; color: var(--text-3);
}

.rib-desc code {
  font-family: var(--mono); font-size: 10px;
  background: var(--page-bg); border: 1px solid var(--border-lt);
  padding: 1px 4px; border-radius: 1px; color: var(--blue);
}

/* ── NO MEDIA BADGE ──────────────────────────────────────────────────────── */
.no-media-badge {
  display: inline-flex; align-items: center;
  height: 20px; padding: 0 7px;
  background: #FFF7ED; color: #9A3412; border: 1px solid #FED7AA;
  font-size: 10px; font-weight: 600; border-radius: 1px;
}

/* ── STRIP RED VARIANT ───────────────────────────────────────────────────── */
.strip--red .strip-val { color: #FF8080; }

/* ── STRIP (needed in new sections) ─────────────────────────────────────── */
.strip + .card { border-top: none; }


</style>
