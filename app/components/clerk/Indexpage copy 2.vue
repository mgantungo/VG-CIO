<!--components/clerk/Indexpage.vue-->
<template>
  <div class="dash">

    <!-- ── Error banner ── -->
    <div v-if="error" class="dash-error">
      <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>
      <span><strong>Error:</strong> {{ error }}</span>
    </div>

    <!-- ════════════════════════════════════════════════════
         PAGE HEADER
    ═════════════════════════════════════════════════════ -->
    <header class="dash-head">
      <div class="dash-head__title">
        <div class="dash-head__eyebrow">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          Adverts Dashboard
        </div>
        <p class="dash-head__sub">
          {{ dateRangeDisplay }}
          <span class="dash-head__dot">·</span>
          {{ overallStats.totalAdverts }} advert{{ overallStats.totalAdverts !== 1 ? 's' : '' }}
          <span class="dash-head__dot">·</span>
          {{ overallStats.uniqueUsers }} user{{ overallStats.uniqueUsers !== 1 ? 's' : '' }}
        </p>
      </div>
      <button class="btn btn-new" @click="createNewAdvert">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        New Advert
      </button>
    </header>

    <!-- ════════════════════════════════════════════════════
         FILTER TOOLBAR
    ═════════════════════════════════════════════════════ -->
    <section class="toolbar">
      <div class="tb-row tb-row--dates">
        <div class="tb-field">
          <label class="tb-label" for="startDate">From</label>
          <input type="date" id="startDate" v-model="startDate" class="tb-input" :max="endDate">
        </div>
        <div class="tb-field">
          <label class="tb-label" for="endDate">To</label>
          <input type="date" id="endDate" v-model="endDate" class="tb-input" :min="startDate" :max="maxDate">
        </div>
        <div class="tb-quick">
          <button v-for="r in quickRanges" :key="r.key"
            class="qr-btn"
            :class="{ active: activeQuickRange === r.key }"
            @click="setDateRange(r.key)">{{ r.label }}</button>
        </div>
      </div>

      <div class="tb-row tb-row--filters">
        <div class="tb-field">
          <label class="tb-label" for="userFilter">User</label>
          <select id="userFilter" v-model="selectedUserId" class="tb-input tb-select" @change="loadAdverts">
            <option value="">All users</option>
            <option v-for="user in availableUsers" :key="user.id" :value="user.id">
              {{ user.name }} ({{ user.role }})
            </option>
          </select>
        </div>
        <div class="tb-field">
          <label class="tb-label" for="statusFilter">Status</label>
          <select id="statusFilter" v-model="selectedStatus" class="tb-input tb-select" @change="loadAdverts">
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="pending_review">Pending Review</option>
            <option value="editor_approved">Editor Approved</option>
            <option value="manager_approved">Manager Approved</option>
            <option value="editor_rejected">Editor Rejected</option>
            <option value="manager_rejected">Manager Rejected</option>
            <option value="published">Published</option>
          </select>
        </div>
        <div class="tb-field">
          <label class="tb-label" for="paymentFilter">Payment</label>
          <select id="paymentFilter" v-model="selectedPayment" class="tb-input tb-select" @change="loadAdverts">
            <option value="">All payments</option>
            <option value="paid">Paid only</option>
            <option value="unpaid">Unpaid only</option>
          </select>
        </div>
        <div class="tb-field tb-field--search">
          <label class="tb-label" for="searchQuery">Search</label>
          <div class="tb-search-wrap">
            <svg class="tb-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" id="searchQuery" v-model="searchQuery" class="tb-input tb-input--search"
                   placeholder="Reference, client, title…" @keyup.enter="applySearch">
            <button v-if="searchQuery" type="button" class="tb-search-clear" @click="searchQuery = ''" title="Clear search">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><line x1="9" y1="9" x2="15" y2="15"/><line x1="15" y1="9" x2="9" y2="15"/></svg>
            </button>
          </div>
        </div>
      </div>

      <div class="tb-actions">
        <button class="btn btn-apply" @click="loadAdverts" :disabled="loading || isDateRangeInvalid">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <span>{{ loading ? 'Loading…' : 'Apply' }}</span>
        </button>
        <button class="btn btn-reset" @click="resetFilters">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>
          Reset
        </button>
        <p v-if="isDateRangeInvalid" class="tb-error">⚠ End date must be after start date</p>
      </div>
    </section>

    <!-- ════════════════════════════════════════════════════
         COLLAPSE TOGGLE — hide KPIs/charts, keep filters + ledger
    ═════════════════════════════════════════════════════ -->
    <section class="collapse-bar">
      <button class="collapse-toggle" @click="toggleDashboard">
        <svg class="collapse-chevron" :class="{ 'collapse-chevron--collapsed': dashboardCollapsed }"
             viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
        <span>{{ dashboardCollapsed ? 'Show' : 'Hide' }} Dashboard Overview</span>
      </button>
      <div v-if="dashboardCollapsed" class="collapse-summary">
        <span>{{ overallStats.totalAdverts }} advert{{ overallStats.totalAdverts !== 1 ? 's' : '' }}</span>
        <span class="collapse-dot">·</span>
        <span>{{ formatCurrency(overallStats.totalAmount) }}</span>
        <span class="collapse-dot">·</span>
        <span class="collapse-paid">{{ paymentBreakdown.paid }} paid</span>
        <span class="collapse-dot">·</span>
        <span class="collapse-unpaid">{{ paymentBreakdown.unpaid }} unpaid</span>
      </div>
    </section>

    <!-- ════════════════════════════════════════════════════
         KPI ROW — accent-strip tiles w/ sparkline
    ═════════════════════════════════════════════════════ -->
    <section class="kpi-row" v-show="!dashboardCollapsed">
      <div v-for="k in kpis" :key="k.title" class="kpi-tile" :class="`accent-${k.color}`">
        <div class="kpi-header">
          <div class="kpi-icon" :class="`icon-${k.color}`"><KpiIcon :name="k.icon" /></div>
          <div class="kpi-meta">
            <span class="kpi-title">{{ k.title }}</span>
            <span v-if="k.subtitle" class="kpi-subtitle">{{ k.subtitle }}</span>
          </div>
        </div>
        <div class="kpi-divider"></div>
        <div class="kpi-body">
          <div class="kpi-value-wrap">
            <span class="kpi-value">{{ k.display }}</span>
          </div>
          <div v-if="k.spark" class="kpi-spark">
            <div v-for="(bar, i) in k.spark" :key="i" class="spark-bar" :class="`accent-${k.color}`" :style="{ height: bar + '%' }"></div>
          </div>
        </div>
        <div class="kpi-indicator" :class="`accent-${k.color}`"></div>
      </div>
    </section>

    <!-- Loading -->
    <div v-if="loading" class="fx-loading">
      <div class="loading-bar"><div class="loading-progress"></div></div>
      <p>Loading adverts…</p>
    </div>

    <template v-if="!loading">

      <template v-if="overallStats.totalAdverts > 0 && !dashboardCollapsed">

        <!-- ════════════════════════════════════════════════════
             TREND — value over time, paid vs unpaid
        ═════════════════════════════════════════════════════ -->
        <section class="fx-panel">
          <div class="panel-head">
            <div class="panel-title-group">
              <span class="panel-icon icon-blue"><TrendGlyph /></span>
              <span class="panel-title">Value Trend</span>
              <span class="panel-hint">by {{ trendGranularity }}</span>
            </div>
            <ul class="mini-legend">
              <li><span class="dot dot-paid"></span> Paid</li>
              <li><span class="dot dot-unpaid"></span> Unpaid</li>
            </ul>
          </div>
          <div class="trend-chart">
            <template v-if="trendLineChart && trendLineChart.mode === 'line'">
              <svg class="trend-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
                <line x1="0" y1="100" x2="100" y2="100" class="trend-axis" vector-effect="non-scaling-stroke" />
                <polyline :points="trendLineChart.unpaidPoints" class="trend-line trend-line--unpaid" vector-effect="non-scaling-stroke" />
                <polyline :points="trendLineChart.paidPoints" class="trend-line trend-line--paid" vector-effect="non-scaling-stroke" />
                <g v-for="(b, i) in trendLineChart.buckets" :key="b.key">
                  <circle :cx="b.x" :cy="b.unpaidY" r="1.6" class="trend-dot trend-dot--unpaid" vector-effect="non-scaling-stroke">
                    <title>{{ b.label }}: {{ formatCurrency(b.unpaidValue) }} unpaid</title>
                  </circle>
                  <circle :cx="b.x" :cy="b.paidY" r="1.6" class="trend-dot trend-dot--paid" vector-effect="non-scaling-stroke">
                    <title>{{ b.label }}: {{ formatCurrency(b.paidValue) }} paid</title>
                  </circle>
                </g>
              </svg>
              <div class="trend-x-labels">
                <span v-for="b in trendLineChart.buckets" v-show="b.showLabel" :key="b.key" class="trend-x-label" :style="{ left: b.x + '%' }">{{ b.label }}</span>
              </div>
            </template>

            <!-- A line needs 2+ points to show a trend - a single-bucket
                 range (e.g. "today") is shown as a plain snapshot instead
                 of a flat, meaningless line. -->
            <div v-else-if="trendLineChart && trendLineChart.mode === 'single'" class="trend-single">
              <div class="trend-single-stat">
                <span class="trend-single-label"><span class="dot dot-paid"></span> Paid</span>
                <span class="trend-single-value trend-single-value--paid">{{ formatCurrency(trendLineChart.paidValue) }}</span>
              </div>
              <div class="trend-single-divider"></div>
              <div class="trend-single-stat">
                <span class="trend-single-label"><span class="dot dot-unpaid"></span> Unpaid</span>
                <span class="trend-single-value trend-single-value--unpaid">{{ formatCurrency(trendLineChart.unpaidValue) }}</span>
              </div>
              <span class="trend-single-date">{{ trendLineChart.label }}</span>
            </div>

            <div v-else class="trend-empty">No data in the selected range</div>
          </div>
        </section>

        <!-- ════════════════════════════════════════════════════
             PAYMENT ANALYSIS — paid vs unpaid over time + split
        ═════════════════════════════════════════════════════ -->
        <PaymentAnalysisPanel
          :adverts="filteredAdverts"
          :start-date="startDate"
          :end-date="endDate"
        />

        <!-- ════════════════════════════════════════════════════
             CHARTS ROW — payment ledger / status mix / top breakdown
        ═════════════════════════════════════════════════════ -->
        <section class="charts-row">

          <!-- Payment breakdown (ledger + bars, CommissionStats-style) -->
          <div class="fx-panel">
            <div class="panel-head">
              <div class="panel-title-group">
                <span class="panel-icon icon-amber"><CoinGlyph /></span>
                <span class="panel-title">Payment Status</span>
              </div>
              <div class="panel-total-badge">
                <span>Outstanding:</span>
                <strong>{{ formatCurrency(paymentBreakdown.unpaidValue) }}</strong>
              </div>
            </div>

            <div class="ledger">
              <div class="ledger-header">
                <span class="lh-cell">Metric</span>
                <span class="lh-cell text-right">Value</span>
              </div>
              <div class="ledger-row">
                <div class="lr-label-wrap"><span class="lr-dot dot-blue"></span><span class="lr-label">Paid Adverts</span></div>
                <span class="lr-value">{{ paymentBreakdown.paid.toLocaleString() }}</span>
              </div>
              <div class="ledger-row">
                <div class="lr-label-wrap"><span class="lr-dot dot-amber"></span><span class="lr-label">Unpaid Adverts</span></div>
                <span class="lr-value">{{ paymentBreakdown.unpaid.toLocaleString() }}</span>
              </div>
              <div class="ledger-row">
                <div class="lr-label-wrap"><span class="lr-dot dot-blue"></span><span class="lr-label">Paid Value</span></div>
                <span class="lr-value val-credit">{{ formatCurrency(paymentBreakdown.paidValue) }}</span>
              </div>
              <div class="ledger-row">
                <div class="lr-label-wrap"><span class="lr-dot dot-amber"></span><span class="lr-label">Unpaid Value</span></div>
                <span class="lr-value val-warn">{{ formatCurrency(paymentBreakdown.unpaidValue) }}</span>
              </div>
            </div>

            <div class="panel-divider"></div>
            <div class="breakdown">
              <div class="breakdown-title">Share of Adverts</div>
              <div class="breakdown-bars">
                <div class="bbar-row">
                  <span class="bb-label">Paid</span>
                  <div class="bb-track"><div class="bb-fill paid" :style="{ width: paymentBreakdown.paidPct + '%' }"></div></div>
                  <span class="bb-val paid-text">{{ paymentBreakdown.paidPct }}%</span>
                </div>
                <div class="bbar-row">
                  <span class="bb-label">Unpaid</span>
                  <div class="bb-track"><div class="bb-fill unpaid" :style="{ width: (100 - paymentBreakdown.paidPct) + '%' }"></div></div>
                  <span class="bb-val unpaid-text">{{ 100 - paymentBreakdown.paidPct }}%</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Status distribution (segment bar + table, OrderStatusChart-style) -->
          <div class="fx-panel">
            <div class="panel-head">
              <div class="panel-title-group">
                <span class="panel-icon icon-purple"><PieGlyph /></span>
                <span class="panel-title">Status Distribution</span>
              </div>
              <div class="panel-total">
                <span class="pt-num">{{ overallStats.totalAdverts.toLocaleString() }}</span>
                <span class="pt-lbl">total</span>
              </div>
            </div>

            <div class="segment-wrap" title="Hover a segment to highlight">
              <div class="segment-bar">
                <div v-for="s in statusBreakdown" :key="s.cls" class="segment"
                     :class="{ dimmed: hoveredStatus && hoveredStatus !== s.cls }"
                     :style="{ width: s.pct + '%', background: s.color }"
                     @mouseenter="hoveredStatus = s.cls" @mouseleave="hoveredStatus = null"
                     :title="`${s.label}: ${s.count} (${s.pct}%)`"></div>
              </div>
            </div>

            <div class="sp-table">
              <div class="spt-header">
                <span class="sph-cell">Status</span>
                <span class="sph-cell text-right">Count</span>
                <span class="sph-cell text-right">Share</span>
                <span class="sph-cell">Distribution</span>
              </div>
              <div v-for="s in statusBreakdown" :key="s.cls" class="spt-row"
                   :class="{ 'spt-row--active': hoveredStatus === s.cls }"
                   @mouseenter="hoveredStatus = s.cls" @mouseleave="hoveredStatus = null">
                <div class="spt-label"><span class="spt-dot" :style="{ background: s.color }"></span><span class="spt-name">{{ s.label }}</span></div>
                <span class="spt-count">{{ s.count.toLocaleString() }}</span>
                <span class="spt-pct" :style="{ color: s.color }">{{ s.pct }}%</span>
                <div class="spt-bar-wrap"><div class="spt-bar-fill" :style="{ width: s.pct + '%', background: s.color }"></div></div>
              </div>
            </div>
          </div>

          <!-- Top breakdown (RevenueBreakdown-style stream rows, with tabs) -->
          <div class="fx-panel">
            <div class="panel-head">
              <div class="panel-title-group">
                <span class="panel-icon icon-green"><BarGlyph /></span>
                <span class="panel-title">Top {{ activeBreakdownTab.label }}</span>
              </div>
              <div class="tabs">
                <button v-for="t in breakdownTabs" :key="t.key" class="tab-btn" :class="{ active: breakdownTab === t.key }" @click="breakdownTab = t.key">{{ t.short }}</button>
              </div>
            </div>

            <div class="streams" v-if="topBreakdown.length">
              <div class="stream-header">
                <span class="sh-label">Name</span>
                <span class="sh-label text-right">Value</span>
                <span class="sh-label text-right">Share</span>
              </div>
              <div v-for="row in topBreakdown" :key="row.label" class="stream-row">
                <div class="stream-info">
                  <div class="stream-dot"></div>
                  <div class="stream-meta">
                    <span class="stream-name" :title="row.label">{{ row.label }}</span>
                    <span class="stream-desc">{{ row.count }} advert{{ row.count !== 1 ? 's' : '' }}</span>
                  </div>
                </div>
                <span class="stream-amount">{{ formatCurrency(row.value) }}</span>
                <span class="stream-pct">{{ row.pct }}%</span>
                <div class="stream-bar-wrap"><div class="stream-bar-fill" :style="{ width: row.pct + '%' }"></div></div>
              </div>
            </div>
            <p v-else class="rank-empty">No data for this view.</p>
          </div>
        </section>
      </template>

      <!-- Empty -->
      <div v-if="filteredAdverts.length === 0" class="fx-empty">
        <svg viewBox="0 0 64 64" fill="none"><rect x="8" y="8" width="48" height="48" rx="6" stroke="#CBD5E1" stroke-width="3"/><line x1="20" y1="26" x2="44" y2="26" stroke="#CBD5E1" stroke-width="3" stroke-linecap="round"/><line x1="20" y1="34" x2="36" y2="34" stroke="#CBD5E1" stroke-width="3" stroke-linecap="round"/></svg>
        <h5>No adverts found</h5>
        <p>{{ searchQuery || selectedUserId || selectedStatus || selectedPayment ? 'Try adjusting your filters or date range.' : 'No adverts were created in this date range.' }}</p>
        <div class="fx-empty__actions">
          <button class="btn btn-new" @click="createNewAdvert">Create New Advert</button>
          <button v-if="searchQuery || selectedUserId || selectedStatus || selectedPayment" class="btn btn-reset" @click="resetFilters">Clear Filters</button>
        </div>
      </div>

      <!-- ════════════════════════════════════════════════════
           LEDGER TABLE
      ═════════════════════════════════════════════════════ -->
      <div v-else class="fx-table-panel">

        <!-- Toolbar -->
        <div class="panel-toolbar">
          <div class="toolbar-left">
            <div class="panel-title-sm"><TableGlyph /><span>Advert Ledger</span></div>
            <span class="rc-badge">{{ sortedAdverts.length.toLocaleString() }}</span>
            <span class="rc-label">records</span>
          </div>
          <div class="toolbar-right">
            <div class="page-size-control">
              <label class="psc-label">Rows:</label>
              <select v-model.number="pageSize" class="psc-select">
                <option :value="10">10</option>
                <option :value="20">20</option>
                <option :value="50">50</option>
                <option :value="100">100</option>
              </select>
            </div>
            <button class="toolbar-btn" @click="collapseAll" title="Collapse all rows">
              <CollapseGlyph />
            </button>
            <div class="col-menu-wrap">
              <button class="toolbar-btn" :class="{ active: hiddenColumnKeys.size > 0 }" @click="showColMenu = !showColMenu" title="Show/hide columns">
                <ColumnsGlyph />
                <span v-if="hiddenColumnKeys.size > 0" class="col-menu-badge">{{ hiddenColumnKeys.size }}</span>
              </button>
              <div v-if="showColMenu" class="col-menu-backdrop" @click="showColMenu = false"></div>
              <div v-if="showColMenu" class="col-menu-dropdown">
                <div class="col-menu-header">
                  <span>Columns</span>
                  <button type="button" class="col-menu-reset" @click="showAllColumns">Show all</button>
                </div>
                <label class="col-menu-option col-menu-locked">
                  <input type="checkbox" checked disabled />
                  <span>Ref #, Amount, Date</span>
                </label>
                <label v-for="col in COLUMN_DEFS" :key="col.key" class="col-menu-option">
                  <input type="checkbox" :checked="isColVisible(col.key)" @change="toggleColumn(col.key)" />
                  <span>{{ col.label }}</span>
                </label>
              </div>
            </div>
            <button class="toolbar-btn accent" @click="exportData" :disabled="filteredAdverts.length === 0" title="Export to Excel (.xlsx)">
              <ExportGlyph /><span>Download Excel</span>
            </button>
          </div>
        </div>

        <!-- Grid -->
        <div class="fx-grid-wrap">
          <table class="fx-grid">
            <colgroup>
              <col style="width:42px">
              <col style="width:210px">
              <col v-if="isColVisible('client')" style="width:150px">
              <col v-if="isColVisible('title')" style="width:180px">
              <col v-if="isColVisible('capturedBy')" style="width:130px">
              <col v-if="isColVisible('product')" style="width:150px">
              <col v-if="isColVisible('office')" style="width:120px">
              <col style="width:115px">
              <col v-if="isColVisible('payment')" style="width:95px">
              <col v-if="isColVisible('status')" style="width:130px">
              <col style="width:100px">
              <col style="width:96px">
            </colgroup>
            <thead class="fx-thead">
              <tr class="header-row">
                <th class="th-rownum sticky-col-0">#</th>
                <th class="th-cell sticky-col-1" @click="toggleSort('reference')">
                  <div class="th-inner"><span class="th-label">Ref #</span><SortMark :active="sortKey==='reference'" :dir="sortDir" /></div>
                </th>
                <th v-if="isColVisible('client')" class="th-cell" @click="toggleSort('client')">
                  <div class="th-inner"><span class="th-label">Client</span><SortMark :active="sortKey==='client'" :dir="sortDir" /></div>
                </th>
                <th v-if="isColVisible('title')" class="th-cell"><div class="th-inner"><span class="th-label">Advert Title</span></div></th>
                <th v-if="isColVisible('capturedBy')" class="th-cell"><div class="th-inner"><span class="th-label">Captured By</span></div></th>
                <th v-if="isColVisible('product')" class="th-cell"><div class="th-inner"><span class="th-label">Product / Size</span></div></th>
                <th v-if="isColVisible('office')" class="th-cell"><div class="th-inner"><span class="th-label">Office / Ref</span></div></th>
                <th class="th-cell text-right" @click="toggleSort('amount')">
                  <div class="th-inner"><span class="th-label">Amount</span><SortMark :active="sortKey==='amount'" :dir="sortDir" /></div>
                </th>
                <th v-if="isColVisible('payment')" class="th-cell" @click="toggleSort('payment')">
                  <div class="th-inner"><span class="th-label">Payment</span><SortMark :active="sortKey==='payment'" :dir="sortDir" /></div>
                </th>
                <th v-if="isColVisible('status')" class="th-cell" @click="toggleSort('status')">
                  <div class="th-inner"><span class="th-label">Status</span><SortMark :active="sortKey==='status'" :dir="sortDir" /></div>
                </th>
                <th class="th-cell" @click="toggleSort('date')">
                  <div class="th-inner"><span class="th-label">Date</span><SortMark :active="sortKey==='date'" :dir="sortDir" /></div>
                </th>
                <th class="th-cell th-actions">Actions</th>
              </tr>
            </thead>

            <tbody class="fx-tbody">
              <template v-for="(advert, idx) in pagedAdverts" :key="advert.id">
                <tr class="fx-row" :class="{ 'row-stripe': idx % 2 !== 0, 'row-selected': isExpanded(advert.id) }"
                    @click="toggleExpand(advert.id)">

                  <td class="td-rownum sticky-col-0">{{ (currentPage - 1) * pageSize + idx + 1 }}</td>

                  <td class="td-cell td-order sticky-col-1">
                    <div class="order-cell">
                      <span class="order-chip">{{ advert.reference }}</span>
                      <svg class="expand-icon" :class="{ 'expand-icon--open': isExpanded(advert.id) }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 6 15 12 9 18"/></svg>
                    </div>
                    <code v-if="advert.bcReference" class="bc-chip">{{ advert.bcReference }}</code>
                  </td>

                  <td v-if="isColVisible('client')" class="td-cell td-wrap">
                    <span class="cell-primary">{{ advert.clientName || '—' }}</span>
                    <span v-if="advert.client?.contactPerson" class="cell-secondary">{{ advert.client.contactPerson }}</span>
                  </td>

                  <td v-if="isColVisible('title')" class="td-cell td-wrap"><span class="cell-primary">{{ advert.advertTitle || '—' }}</span></td>

                  <td v-if="isColVisible('capturedBy')" class="td-cell">
                    <span class="cell-primary">{{ advert.createdBy?.name || 'Unknown' }}</span>
                    <span class="cell-secondary cell-cap">{{ advert.createdBy?.role || '' }}</span>
                  </td>

                  <td v-if="isColVisible('product')" class="td-cell">
                    <span class="cell-primary">{{ advert.product?.name || 'N/A' }}</span>
                    <span v-if="advert.adSize" class="mini-chip chip-gray">{{ advert.adSize }}</span>
                  </td>

                  <td v-if="isColVisible('office')" class="td-cell">
                    <span v-if="advert.officeLocation" class="cell-primary">{{ advert.officeLocation }}</span>
                    <span v-if="advert.clientRefNo" class="cell-secondary">{{ advert.clientRefNo }}</span>
                    <span v-if="!advert.officeLocation && !advert.clientRefNo" class="cell-empty">—</span>
                  </td>

                  <td class="td-cell td-num">
                    <span class="num-value total">{{ formatCurrency(advert.totalAmount) }}</span>
                    <span v-if="advert.discount > 0" class="mini-chip chip-red">-{{ advert.discount }}%</span>
                  </td>

                  <td v-if="isColVisible('payment')" class="td-cell">
                    <span class="bool-pill" :class="advert.isPaid ? 'bool-paid' : 'bool-unpaid'">
                      <span class="bool-dot"></span>{{ advert.isPaid ? 'Paid' : 'Unpaid' }}
                    </span>
                  </td>

                  <td v-if="isColVisible('status')" class="td-cell">
                    <span class="status-pill" :class="'status-' + getStatusClass(advert.status)">{{ getStatusLabel(advert.status) }}</span>
                  </td>

                  <td class="td-cell">
                    <div class="dt-stack">
                      <span class="dt-date">{{ formatDate(advert.createdAt) }}</span>
                      <span class="dt-time">{{ formatTime(advert.createdAt) }}</span>
                    </div>
                  </td>

                  <td class="td-cell td-actions" @click.stop>
                    <div class="action-group">
                      <button class="act-btn" @click="viewAdvert(advert)" title="View advert">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                      </button>
                      <button v-if="advert.status === 'draft'" class="act-btn amber" @click="editAdvert(advert)" title="Edit draft">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                      </button>
                      <button v-if="advert.attachments?.length > 0" class="act-btn purple" @click="downloadAttachments(advert)" :title="`${advert.attachments.length} file(s)`">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/></svg>
                      </button>
                      <button class="act-btn blue" @click="downloadAdvertPdf(advert)" title="Download PDF">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2"/></svg>
                      </button>
                      <button class="act-btn green" @click="printAdvertPdf(advert)" title="Print">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>

                <!-- Expanded detail row -->
                <tr v-if="isExpanded(advert.id)" class="fx-detail-row" :class="{ 'row-stripe': idx % 2 !== 0 }">
                  <td :colspan="detailColspan" class="detail-cell">
                    <div class="detail-wrap">
                      <div class="detail-toolbar">
                        <button class="btn-mini" @click="downloadAdvertPdf(advert)">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2"/></svg>
                          Download PDF
                        </button>
                        <button class="btn-mini" @click="printAdvertPdf(advert)">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z"/></svg>
                          Print
                        </button>
                      </div>
                      <div class="detail-info-strip">
                        <div class="dis-item" v-if="advert.contactPerson"><span class="dis-label">Contact Person</span><span class="dis-value">{{ advert.contactPerson }}</span></div>
                        <div class="dis-item" v-if="advert.contactEmail"><span class="dis-label">Email</span><span class="dis-value mono">{{ advert.contactEmail }}</span></div>
                        <div class="dis-item" v-if="advert.contactNumber"><span class="dis-label">Phone</span><span class="dis-value mono">{{ advert.contactNumber }}</span></div>
                        <div class="dis-item" v-if="advert.marketSector"><span class="dis-label">Market Sector</span><span class="dis-value">{{ advert.marketSector }}</span></div>
                        <div class="dis-item" v-if="advert.paymentMethod"><span class="dis-label">Payment Method</span><span class="dis-value cell-cap">{{ advert.paymentMethod.replace(/_/g, ' ') }}</span></div>
                        <div class="dis-item" v-if="advert.basePrice !== undefined"><span class="dis-label">Base Price</span><span class="dis-value mono">{{ formatCurrency(advert.basePrice) }}</span></div>
                        <div class="dis-item" v-if="advert.surcharge"><span class="dis-label">Surcharge</span><span class="dis-value mono">{{ formatCurrency(advert.surcharge) }}</span></div>
                        <div class="dis-item" v-if="advert.startDate"><span class="dis-label">Start Date</span><span class="dis-value">{{ formatDate(advert.startDate) }}</span></div>
                        <div class="dis-item" v-if="advert.endDate"><span class="dis-label">End Date</span><span class="dis-value">{{ formatDate(advert.endDate) }}</span></div>
                        <div class="dis-item" v-if="advert.frequency"><span class="dis-label">Frequency</span><span class="dis-value">{{ advert.frequency }}</span></div>
                      </div>
                      <div v-if="getPublishingDates(advert).length" class="detail-pubdates">
                        <span class="dis-label">Publishing Dates ({{ getPublishingDates(advert).length }})</span>
                        <div class="detail-files">
                          <span v-for="(d, i) in getPublishingDates(advert)" :key="i" class="date-chip">{{ formatDate(d) }}</span>
                        </div>
                      </div>
                      <p v-if="advert.specialInstructions" class="detail-notes"><strong>Special instructions:</strong> {{ advert.specialInstructions }}</p>
                      <div v-if="advert.attachments?.length" class="detail-files">
                        <a v-for="f in advert.attachments" :key="f.id || f.url" :href="f.fullUrl" target="_blank" rel="noopener" class="file-chip">{{ f.name || 'Attachment' }}</a>
                      </div>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>

            <!-- Page totals -->
            <tfoot v-if="pagedAdverts.length" class="fx-tfoot">
              <tr class="totals-row">
                <td class="td-rownum sticky-col-0 totals-label" :colspan="beforeAmountColspan"><span>Σ Page Total</span></td>
                <td class="td-cell td-num totals-val">{{ formatCurrency(pageTotalAmount) }}</td>
                <td class="td-cell" :colspan="afterAmountColspan"></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- Pagination -->
        <div class="fx-pagebar">
          <div class="page-info">
            Showing <strong>{{ sortedAdverts.length ? (currentPage - 1) * pageSize + 1 : 0 }}</strong>
            – <strong>{{ Math.min(currentPage * pageSize, sortedAdverts.length) }}</strong>
            of <strong>{{ sortedAdverts.length.toLocaleString() }}</strong>
          </div>
          <div class="page-nav">
            <button class="pn-btn" :disabled="currentPage === 1" @click="goPage(1)">«</button>
            <button class="pn-btn" :disabled="currentPage === 1" @click="goPage(currentPage - 1)">‹</button>
            <div class="page-pills">
              <button v-for="p in pagePills" :key="p" class="pp-btn" :class="{ active: p === currentPage, ellipsis: p === '…' }"
                      :disabled="p === '…'" @click="p !== '…' && goPage(p)">{{ p }}</button>
            </div>
            <button class="pn-btn" :disabled="currentPage === totalPages" @click="goPage(currentPage + 1)">›</button>
            <button class="pn-btn" :disabled="currentPage === totalPages" @click="goPage(totalPages)">»</button>
          </div>
        </div>
      </div>
    </template>

    <!-- FAB -->
    <button class="fab" @click="createNewAdvert" title="Create New Advert">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      <span class="fab-label">New Advert</span>
    </button>

  </div>
</template>

<script setup>
import { useAdverts } from '~/composables/useAdverts'
import { ref, computed, watch, onMounted, h } from 'vue'
import { useRouter, useRuntimeConfig } from '#imports';
import { useAdvertPdf } from '~/composables/useAdvertPdf'
import { usePaymentAnalysis } from '~/composables/usePaymentAnalysis'
import PaymentAnalysisPanel from './PaymentAnalysisPanel.vue'

const router = useRouter()
const config = useRuntimeConfig()
// Shared PDF builder - same composable New.vue uses for its order summary,
// so both stay visually identical by construction
const { downloadAdvertPdf: downloadPdf, printAdvertPdf: printPdf } = useAdvertPdf()
const {
  loading,
  error,
  getDateRangeAdverts: getDateRangeAdvertsApi
} = useAdverts()

const API_BASE = config.public.apiBase
const UPLOAD_BASE = config.public.uploadBase

// ── Small inline icon components (kept consistent with the app's inline-SVG icon convention) ──
const SortMark = (props) => h('span', { class: 'sort-mark' + (props.active ? ' sort-mark--active' : '') },
  props.active ? (props.dir === 'asc' ? '▲' : '▼') : '↕')

const svgIcon = (children) => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, children)

const KPI_ICON_PATHS = {
  calendar: ['M8 7V3M16 7V3M4 11h16M6 5h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2z'],
  list: ['M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01'],
  coins: ['M12 8c-3.314 0-6 1.79-6 4s2.686 4 6 4 6-1.79 6-4-2.686-4-6-4z', 'M12 8V4M12 20v-4'],
  chart: ['M3 3v18h18', 'M7 15l3.5-4 3 3L19 8'],
  check: ['M21 12a9 9 0 11-18 0 9 9 0 0118 0z', 'M8.5 12l2.5 2.5 4.5-5'],
  hourglass: ['M6 2h12M6 22h12', 'M6 2c0 5 4 5 4 10s-4 5-4 10', 'M18 2c0 5-4 5-4 10s4 5 4 10']
}
const KpiIcon = (props) => svgIcon((KPI_ICON_PATHS[props.name] || KPI_ICON_PATHS.chart).map(d => h('path', { d })))
const TrendGlyph = () => svgIcon([h('path', { d: 'M3 3v18h18' }), h('path', { d: 'M7 15l3.5-4 3 3L19 8' })])
const CoinGlyph = () => svgIcon([h('circle', { cx: 12, cy: 12, r: 8 }), h('path', { d: 'M12 8v8M9.5 10a2.5 2 0 012.5-1.2c1.5 0 2.5.7 2.5 1.7s-1 1.5-2.5 1.5-2.5.5-2.5 1.5 1 1.7 2.5 1.7a2.5 2 0 002.5-1.2' })])
const PieGlyph = () => svgIcon([h('path', { d: 'M12 2v10l7 5A10 10 0 0012 2z' }), h('path', { d: 'M12 12l-7 5A10 10 0 0012 22a10 10 0 007-3l-7-5z' })])
const BarGlyph = () => svgIcon([h('path', { d: 'M4 20V10M12 20V4M20 20v-7' })])
const TableGlyph = () => svgIcon([h('rect', { x: 3, y: 4, width: 18, height: 16, rx: 1.5 }), h('path', { d: 'M3 9h18M9 9v11' })])
const CollapseGlyph = () => svgIcon([h('polyline', { points: '7 13 12 18 17 13' }), h('polyline', { points: '7 6 12 11 17 6' })])
const ExportGlyph = () => svgIcon([h('path', { d: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4' }), h('polyline', { points: '7 10 12 15 17 10' }), h('line', { x1: 12, y1: 15, x2: 12, y2: 3 })])
const ColumnsGlyph = () => svgIcon([h('rect', { x: 3, y: 4, width: 18, height: 16, rx: 1.5 }), h('line', { x1: 9, y1: 4, x2: 9, y2: 20 }), h('line', { x1: 15, y1: 4, x2: 15, y2: 20 })])

// ── Reactive filter/data state ──
const adverts = ref([])
const startDate = ref('')
const endDate = ref('')
const selectedUserId = ref('')
const selectedStatus = ref('')
const selectedPayment = ref('') // '', 'paid', 'unpaid'
const searchQuery = ref('')
const activeQuickRange = ref('thisMonth')
const quickRanges = [
  { key: 'today',     label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'thisWeek',  label: 'This Week' },
  { key: 'thisMonth', label: 'This Month' },
  { key: 'lastMonth', label: 'Last Month' },
]
const availableUsers = ref([])
const hoveredStatus = ref(null)

// ── Column visibility (which optional columns show in the ledger table) ──
const COLUMN_DEFS = [
  { key: 'client',      label: 'Client' },
  { key: 'title',       label: 'Advert Title' },
  { key: 'capturedBy',  label: 'Captured By' },
  { key: 'product',     label: 'Product / Size' },
  { key: 'office',      label: 'Office / Ref' },
  { key: 'payment',     label: 'Payment' },
  { key: 'status',      label: 'Status' },
]
const COLUMN_STORAGE_KEY = 'vgams_clerk_ledger_hidden_columns'
const hiddenColumnKeys = ref(new Set())
const showColMenu = ref(false)
const isColVisible = (key) => !hiddenColumnKeys.value.has(key)
const persistHiddenColumns = () => {
  try { localStorage.setItem(COLUMN_STORAGE_KEY, JSON.stringify(Array.from(hiddenColumnKeys.value))) } catch {}
}
const toggleColumn = (key) => {
  const s = new Set(hiddenColumnKeys.value)
  s.has(key) ? s.delete(key) : s.add(key)
  hiddenColumnKeys.value = s
  persistHiddenColumns()
}
const showAllColumns = () => { hiddenColumnKeys.value = new Set(); persistHiddenColumns() }

// Column count either side of the always-visible Amount column, used to keep
// the detail row and the page-totals footer row spanning correctly however
// many optional columns are currently shown.
const BEFORE_AMOUNT_KEYS = ['client', 'title', 'capturedBy', 'product', 'office']
const AFTER_AMOUNT_KEYS = ['payment', 'status']
const beforeAmountColspan = computed(() => 2 + BEFORE_AMOUNT_KEYS.filter(isColVisible).length) // row#, Ref#
const afterAmountColspan = computed(() => 2 + AFTER_AMOUNT_KEYS.filter(isColVisible).length)   // Date, Actions
const detailColspan = computed(() => beforeAmountColspan.value + 1 + afterAmountColspan.value)

// ── Collapse the KPI/chart overview, keep filters + ledger visible ──
const DASHBOARD_COLLAPSE_KEY = 'vgams_clerk_dashboard_collapsed'
const dashboardCollapsed = ref(false)
const toggleDashboard = () => {
  dashboardCollapsed.value = !dashboardCollapsed.value
  try { localStorage.setItem(DASHBOARD_COLLAPSE_KEY, dashboardCollapsed.value ? '1' : '0') } catch {}
}

// ── Row expand/collapse ──
const expandedIds = ref(new Set())
const toggleExpand = (id) => {
  const s = new Set(expandedIds.value)
  s.has(id) ? s.delete(id) : s.add(id)
  expandedIds.value = s
}
const isExpanded = (id) => expandedIds.value.has(id)
const collapseAll = () => { expandedIds.value = new Set() }

// ── Sorting & pagination ──
const sortKey = ref('date')
const sortDir = ref('desc')
const pageSize = ref(20)
const currentPage = ref(1)
const jumpPage = ref(1)

const sortAccessor = {
  reference: a => a.reference || '',
  client:    a => (a.clientName || '').toLowerCase(),
  amount:    a => Number(a.totalAmount) || 0,
  payment:   a => a.isPaid ? 1 : 0,
  status:    a => a.status || '',
  date:      a => new Date(a.createdAt || 0).getTime()
}

const toggleSort = (key) => {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortDir.value = key === 'date' || key === 'amount' ? 'desc' : 'asc'
  }
}

// ── Computed properties ──
const dateRangeDisplay = computed(() => {
  if (!startDate.value || !endDate.value) return 'Select date range'
  const start = new Date(startDate.value).toLocaleDateString('en-UG', { month: 'short', day: 'numeric' })
  const end = new Date(endDate.value).toLocaleDateString('en-UG', { month: 'short', day: 'numeric', year: 'numeric' })
  return start === end ? start : `${start} - ${end}`
})

// `.toISOString()` converts to UTC first, so building a date at local
// midnight and formatting it that way can roll back a day for any
// timezone ahead of UTC (e.g. Uganda, UTC+3) - this formats the date's own
// local year/month/day instead, with no UTC conversion involved.
const toLocalISODate = (date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const maxDate = computed(() => toLocalISODate(new Date()))

const isDateRangeInvalid = computed(() => {
  if (!startDate.value || !endDate.value) return false
  return new Date(startDate.value) > new Date(endDate.value)
})

const filteredAdverts = computed(() => {
  let filtered = [...adverts.value]

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(advert =>
      advert.clientName?.toLowerCase().includes(query) ||
      advert.advertTitle?.toLowerCase().includes(query) ||
      advert.reference?.toLowerCase().includes(query) ||
      advert.createdBy?.name?.toLowerCase().includes(query) ||
      advert.product?.name?.toLowerCase().includes(query)
    )
  }

  if (selectedPayment.value === 'paid') filtered = filtered.filter(a => a.isPaid === true)
  else if (selectedPayment.value === 'unpaid') filtered = filtered.filter(a => a.isPaid !== true)

  return filtered
})

const sortedAdverts = computed(() => {
  const accessor = sortAccessor[sortKey.value] || sortAccessor.date
  const list = [...filteredAdverts.value]
  list.sort((a, b) => {
    const av = accessor(a), bv = accessor(b)
    if (av < bv) return sortDir.value === 'asc' ? -1 : 1
    if (av > bv) return sortDir.value === 'asc' ? 1 : -1
    return 0
  })
  return list
})

const totalPages = computed(() => Math.max(1, Math.ceil(sortedAdverts.value.length / pageSize.value)))

const pagedAdverts = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return sortedAdverts.value.slice(start, start + pageSize.value)
})

const pageTotalAmount = computed(() => pagedAdverts.value.reduce((sum, a) => sum + (Number(a.totalAmount) || 0), 0))

const pagePills = computed(() => {
  const total = totalPages.value
  const cur = currentPage.value
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pills = [1]
  if (cur > 3) pills.push('…')
  const start = Math.max(2, cur - 1)
  const end = Math.min(total - 1, cur + 1)
  for (let i = start; i <= end; i++) pills.push(i)
  if (cur < total - 2) pills.push('…')
  pills.push(total)
  return pills
})

const goPage = (p) => {
  if (p === '…') return
  currentPage.value = Math.min(totalPages.value, Math.max(1, p))
  jumpPage.value = currentPage.value
}

// Reset to page 1 whenever the underlying result set or page size changes
watch([filteredAdverts, pageSize], () => { currentPage.value = 1 })

// ── Client-side aggregate stats (always in sync with active filters/search) ──
const overallStats = computed(() => {
  const list = filteredAdverts.value
  const totalAmount = list.reduce((s, a) => s + (Number(a.totalAmount) || 0), 0)
  const uniqueUserIds = new Set(list.map(a => a.createdBy?.id).filter(Boolean))
  return {
    totalAdverts: list.length,
    totalAmount,
    averageAmount: list.length ? totalAmount / list.length : 0,
    uniqueUsers: uniqueUserIds.size
  }
})

// ── Payment breakdown ──
const paymentBreakdown = computed(() => {
  const list = filteredAdverts.value
  let paid = 0, unpaid = 0, paidValue = 0, unpaidValue = 0
  list.forEach(a => {
    if (a.isPaid) { paid++; paidValue += Number(a.totalAmount) || 0 }
    else { unpaid++; unpaidValue += Number(a.totalAmount) || 0 }
  })
  const total = list.length
  return { total, paid, unpaid, paidValue, unpaidValue, paidPct: total ? Math.round((paid / total) * 100) : 0 }
})

// ── Status breakdown ──
const STATUS_META = {
  draft:     { label: 'Draft',           color: '#D97706' },
  pending:   { label: 'Pending Review',  color: '#1E40AF' },
  approved:  { label: 'Approved',        color: '#16A366' },
  rejected:  { label: 'Rejected',        color: '#DC2626' },
  published: { label: 'Published',       color: '#003366' },
  default:   { label: 'Other',           color: '#64748B' }
}

const statusBreakdown = computed(() => {
  const counts = {}
  filteredAdverts.value.forEach(a => {
    const cls = getStatusClass(a.status)
    counts[cls] = (counts[cls] || 0) + 1
  })
  const total = filteredAdverts.value.length || 1
  return Object.entries(counts)
    .map(([cls, count]) => ({ cls, count, pct: Math.round((count / total) * 100), ...(STATUS_META[cls] || STATUS_META.default) }))
    .sort((a, b) => b.count - a.count)
})

// ── Trend over time (paid vs unpaid value per bucket) ──
// Reuses the same granularity/bucketing rules as the Payment Analysis panel
// (day / month / quarter, driven by the selected date range) so the two
// panels never disagree on what "by month" vs "by quarter" means for the
// same range.
const { granularity: trendGranularity, buckets: trendBuckets } = usePaymentAnalysis(filteredAdverts, startDate, endDate)

// Paid/unpaid trend as a line graph (one shared origin/axis) rather than a
// per-bucket bar pair. A line only says something with 2+ points to compare,
// so a single bucket (e.g. a one-day range) is shown as a plain paid/unpaid
// snapshot instead of a fabricated "flat line".
const trendLineChart = computed(() => {
  const buckets = trendBuckets.value
  if (!buckets.length) return null

  if (buckets.length === 1) {
    const only = buckets[0]
    return { mode: 'single', label: only.label, paidValue: only.paidValue, unpaidValue: only.unpaidValue }
  }

  const maxValue = Math.max(1, ...buckets.map(b => Math.max(b.paidValue, b.unpaidValue)))
  const n = buckets.length
  const toX = (i) => (i / (n - 1)) * 100
  const toY = (v) => 100 - Math.min(100, (v / maxValue) * 100)

  // Cap x-axis labels so they don't crowd out on wide date ranges - always
  // show the first and last bucket, plus evenly spaced ones in between.
  const maxLabels = 6
  const labelStep = Math.max(1, Math.ceil(n / maxLabels))

  const plotted = buckets.map((b, i) => ({
    ...b,
    x: toX(i),
    paidY: toY(b.paidValue),
    unpaidY: toY(b.unpaidValue),
    showLabel: i === 0 || i === n - 1 || i % labelStep === 0,
  }))

  return {
    mode: 'line',
    buckets: plotted,
    paidPoints: plotted.map(b => `${b.x},${b.paidY}`).join(' '),
    unpaidPoints: plotted.map(b => `${b.x},${b.unpaidY}`).join(' '),
  }
})

// Real (non-decorative) sparkline series for the KPI tiles, drawn from the last 8 trend buckets
const sparkSeries = (pick) => {
  const buckets = trendBuckets.value.slice(-8)
  if (!buckets.length) return null
  const padded = buckets.length < 8 ? [...Array(8 - buckets.length).fill(null), ...buckets] : buckets
  const values = padded.map(b => (b ? pick(b) : 0))
  const max = Math.max(1, ...values)
  return values.map(v => Math.max(4, Math.round((v / max) * 100)))
}

// ── Top breakdown (client / product / captured by) ──
const breakdownTabs = [
  { key: 'client',  label: 'Clients',     short: 'Clients' },
  { key: 'product', label: 'Products',    short: 'Products' },
  { key: 'user',    label: 'Captured By', short: 'Users' },
]
const breakdownTab = ref('client')
const activeBreakdownTab = computed(() => breakdownTabs.find(t => t.key === breakdownTab.value) || breakdownTabs[0])

const topBreakdown = computed(() => {
  const map = new Map()
  filteredAdverts.value.forEach(a => {
    let key
    if (breakdownTab.value === 'client') key = a.clientName || 'Unknown client'
    else if (breakdownTab.value === 'product') key = a.product?.name || 'Unknown product'
    else key = a.createdBy?.name || 'Unknown user'

    if (!map.has(key)) map.set(key, { label: key, count: 0, value: 0 })
    const e = map.get(key)
    e.count++
    e.value += Number(a.totalAmount) || 0
  })

  const arr = Array.from(map.values()).sort((a, b) => b.value - a.value).slice(0, 6)
  const maxVal = arr[0]?.value || 1
  return arr.map(x => ({ ...x, pct: Math.max(4, Math.round((x.value / maxVal) * 100)) }))
})

// ── KPI cards ──
const kpis = computed(() => [
  { title: 'Date Range',    subtitle: `${overallStats.value.uniqueUsers} user${overallStats.value.uniqueUsers !== 1 ? 's' : ''}`, display: dateRangeDisplay.value, icon: 'calendar', color: 'primary', spark: null },
  { title: 'Total Adverts', subtitle: 'in selected range',  display: overallStats.value.totalAdverts.toLocaleString(), icon: 'list', color: 'info', spark: sparkSeries(b => b.count) },
  { title: 'Total Value',   subtitle: 'gross booked value', display: formatCurrency(overallStats.value.totalAmount), icon: 'coins', color: 'warning', spark: sparkSeries(b => b.total) },
  { title: 'Average',       subtitle: 'per advert',         display: formatCurrency(overallStats.value.averageAmount), icon: 'chart', color: 'primary', spark: sparkSeries(b => b.count ? b.total / b.count : 0) },
  { title: 'Paid Value',    subtitle: `${paymentBreakdown.value.paid} advert${paymentBreakdown.value.paid !== 1 ? 's' : ''}`, display: formatCurrency(paymentBreakdown.value.paidValue), icon: 'check', color: 'success', spark: sparkSeries(b => b.paidValue) },
  { title: 'Unpaid Value',  subtitle: `${paymentBreakdown.value.unpaid} advert${paymentBreakdown.value.unpaid !== 1 ? 's' : ''}`, display: formatCurrency(paymentBreakdown.value.unpaidValue), icon: 'hourglass', color: 'danger', spark: sparkSeries(b => b.unpaidValue) },
])

// ── Initialize with this month's date range ──
const initializeDates = () => {
  const today = new Date()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  startDate.value = toLocalISODate(startOfMonth)
  endDate.value = toLocalISODate(today)
}

// ── Load adverts ──
const loadAdverts = async () => {
  if (isDateRangeInvalid.value) {
    alert('Please select a valid date range')
    return
  }

  try {
    const params = {
      startDate: startDate.value,
      endDate: endDate.value
    }

    if (selectedUserId.value) params.userId = selectedUserId.value
    if (selectedStatus.value) params.status = selectedStatus.value
    if (selectedPayment.value === 'paid') params.isPaid = true
    if (selectedPayment.value === 'unpaid') params.isPaid = false

    const response = await getDateRangeAdvertsApi(params)

    adverts.value = (response.data || []).map(a => ({
      ...a,
      isPaid: a.isPaid === true,
      attachments: (a.attachments || []).map(f => ({
        ...f,
        fullUrl:      f.url          ? (f.url.startsWith('http')          ? f.url          : `${UPLOAD_BASE}${f.url}`)          : null,
        thumbnailUrl: f.thumbnailUrl ? (f.thumbnailUrl.startsWith('http') ? f.thumbnailUrl : `${UPLOAD_BASE}${f.thumbnailUrl}`) : null,
      }))
    }))

    if (response.users && response.users.length > 0) {
      availableUsers.value = response.users
    } else {
      const userMap = new Map()
      adverts.value.forEach(advert => {
        if (advert.createdBy?.id && !userMap.has(advert.createdBy.id)) {
          userMap.set(advert.createdBy.id, advert.createdBy)
        }
      })
      availableUsers.value = Array.from(userMap.values())
    }

  } catch (err) {
    console.error('Failed to load adverts:', err)
    error.value = err.message
  }
}

// ── Quick date range buttons ──
const setDateRange = (range) => {
  const today = new Date()
  const result = new Date()
  activeQuickRange.value = range

  switch (range) {
    case 'today':
      startDate.value = toLocalISODate(today)
      endDate.value = toLocalISODate(today)
      break
    case 'yesterday':
      result.setDate(today.getDate() - 1)
      startDate.value = toLocalISODate(result)
      endDate.value = toLocalISODate(result)
      break
    case 'thisWeek': {
      const startOfWeek = new Date(today)
      const day = startOfWeek.getDay()
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1)
      startOfWeek.setDate(diff)
      startDate.value = toLocalISODate(startOfWeek)
      endDate.value = toLocalISODate(today)
      break
    }
    case 'thisMonth': {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      startDate.value = toLocalISODate(startOfMonth)
      endDate.value = toLocalISODate(today)
      break
    }
    case 'lastMonth': {
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0)
      startDate.value = toLocalISODate(lastMonth)
      endDate.value = toLocalISODate(endOfLastMonth)
      break
    }
  }
  loadAdverts()
}

const applySearch = () => {}

const resetFilters = () => {
  initializeDates()
  selectedUserId.value = ''
  selectedStatus.value = ''
  selectedPayment.value = ''
  searchQuery.value = ''
  activeQuickRange.value = 'thisMonth'
  sortKey.value = 'date'
  sortDir.value = 'desc'
  loadAdverts()
}

// ── Export to Excel (.xlsx) — column widths, currency/date number formats, autofilter, summary sheet ──
const exportData = async () => {
  try {
    const XLSX = await import('xlsx')
    const rows = filteredAdverts.value

    const headers = [
      'Ref #', 'BC Ref #', 'Captured By', 'Client', 'Advert Title', 'Product', 'Ad Size',
      'Office Location', 'Client Ref No', 'Revenue Stream', 'Cost Stream',
      'Base Price', 'Surcharge', 'Discount %', 'Total Amount', 'Payment Status',
      'Status', 'Created At', 'Start Date', 'End Date', 'Payment Method',
      'User Email', 'User Role'
    ]

    const dataRows = rows.map(a => ([
      a.reference || '',
      a.bcReference || '',
      a.createdBy?.name || 'Unknown',
      a.clientName || '',
      a.advertTitle || '',
      a.product?.name || '',
      a.adSize || '',
      a.officeLocation || '',
      a.clientRefNo || '',
      a.revenueStream || '',
      a.costStream || '',
      Number(a.basePrice) || 0,
      Number(a.surcharge) || 0,
      Number(a.discount) || 0,
      Number(a.totalAmount) || 0,
      a.isPaid ? 'Paid' : 'Unpaid',
      getStatusLabel(a.status),
      a.createdAt ? new Date(a.createdAt) : '',
      a.startDate ? new Date(a.startDate) : '',
      a.endDate ? new Date(a.endDate) : '',
      (a.paymentMethod || '').replace(/_/g, ' '),
      a.createdBy?.email || '',
      a.createdBy?.role || ''
    ]))

    const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows])

    ws['!cols'] = [
      { wch: 20 }, { wch: 16 }, { wch: 18 }, { wch: 20 }, { wch: 26 }, { wch: 16 }, { wch: 10 },
      { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 10 },
      { wch: 14 }, { wch: 12 }, { wch: 16 }, { wch: 18 }, { wch: 12 }, { wch: 12 }, { wch: 16 }, { wch: 22 }, { wch: 12 }
    ]
    ws['!rows'] = [{ hpx: 22 }]

    const range = XLSX.utils.decode_range(ws['!ref'])
    const currencyCols = [11, 12, 14]   // Base Price, Surcharge, Total Amount
    const dateCols = [17, 18, 19]       // Created At, Start Date, End Date
    for (let R = 1; R <= range.e.r; R++) {
      currencyCols.forEach(C => {
        const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })]
        if (cell) cell.z = '#,##0'
      })
      dateCols.forEach(C => {
        const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })]
        if (cell && cell.v instanceof Date) cell.z = 'dd mmm yyyy'
      })
    }
    ws['!autofilter'] = { ref: ws['!ref'] }

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Adverts')

    const summaryRows = [
      ['Metric', 'Value'],
      ['Date Range', dateRangeDisplay.value],
      ['Total Adverts', overallStats.value.totalAdverts],
      ['Total Value (UGX)', overallStats.value.totalAmount],
      ['Average Value (UGX)', overallStats.value.averageAmount],
      ['Paid Adverts', paymentBreakdown.value.paid],
      ['Paid Value (UGX)', paymentBreakdown.value.paidValue],
      ['Unpaid Adverts', paymentBreakdown.value.unpaid],
      ['Unpaid Value (UGX)', paymentBreakdown.value.unpaidValue],
      ['Unique Users', overallStats.value.uniqueUsers],
      ['Generated At', new Date()]
    ]
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows)
    wsSummary['!cols'] = [{ wch: 22 }, { wch: 24 }]
    ;[3, 4, 6, 8].forEach(R => {
      const c = wsSummary[XLSX.utils.encode_cell({ r: R, c: 1 })]
      if (c) c.z = '#,##0'
    })
    const genCell = wsSummary[XLSX.utils.encode_cell({ r: 10, c: 1 })]
    if (genCell) genCell.z = 'dd mmm yyyy hh:mm'
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary')

    XLSX.writeFile(wb, `adverts-report_${startDate.value}_to_${endDate.value}.xlsx`)
  } catch (err) {
    console.error('Export failed:', err)
    alert('Failed to export to Excel. Make sure the "xlsx" package is installed (npm install xlsx).')
  }
}

// Maps a saved advert record into the normalized shape the shared
// useAdvertPdf composable expects.
const buildAdvertPdfData = (advert) => ({
  systemReference: advert.reference,
  bcReference: advert.bcReference,
  statusLabel: getStatusLabel(advert.status),
  clientName: advert.clientName,
  contactPerson: advert.contactPerson || advert.client?.contactPerson,
  contactEmail: advert.contactEmail,
  contactPhone: advert.contactNumber,
  clientRefNo: advert.clientRefNo,
  marketSector: advert.marketSector,
  advertTitle: advert.advertTitle,
  product: advert.product?.name,
  adSize: advert.adSize,
  // Same caveat as salesAgent above - not referenced elsewhere in this file,
  // so confirm this is the right key against your advert API response.
  colorType: advert.adType || advert.colorType || advert.ad_type || '',
  // Not accessed anywhere else in this component, so the exact shape the
  // API returns it in is unconfirmed - covering the common shapes (nested
  // object with a name, or a flat string field) here. Adjust the field
  // name below if your advert API uses a different key.
  salesAgent: advert.salesAgent?.name || advert.salesAgentName || advert.agent?.name || advert.agentName || '',
  officeLocation: advert.officeLocation,
  basePrice: advert.basePrice || 0,
  surcharge: advert.surcharge || 0,
  discountPercent: Number(advert.discount || 0),
  totalAmount: advert.totalAmount || 0,
  paymentMethod: advert.paymentMethod,
  paymentStatus: advert.isPaid ? 'Paid' : 'Unpaid',
  publishingDates: getPublishingDates(advert),
  specialInstructions: advert.specialInstructions,
  filename: `advert-${advert.reference || advert.id}.pdf`
})

// ── Download a single advert as a PDF (booking confirmation, for reprints) ──
const downloadAdvertPdf = async (advert) => {
  try {
    await downloadPdf(buildAdvertPdfData(advert))
  } catch (err) {
    console.error('PDF generation failed:', err)
    alert('Failed to generate PDF for this advert. Make sure "jsbarcode" and "qrcode" are installed (npm install jsbarcode qrcode).')
  }
}

// ── Print a single advert's PDF (opens print dialog) ──
const printAdvertPdf = async (advert) => {
  try {
    await printPdf(buildAdvertPdfData(advert))
  } catch (err) {
    if (err?.message === 'POPUP_BLOCKED') {
      alert('Please allow pop-ups for this site to print.')
    } else {
      console.error('PDF generation failed:', err)
      alert('Failed to generate PDF for this advert. Make sure "jsbarcode" and "qrcode" are installed (npm install jsbarcode qrcode).')
    }
  }
}

// ── Navigation ──
const createNewAdvert = () => router.push('/dashboard/booking/new')
const viewAdvert = (advert) => router.push(`/dashboard/booking/edit/${advert.id}?mode=view`)
const editAdvert = (advert) => {
  if (advert.status === 'draft') router.push(`/dashboard/booking/edit/${advert.id}`)
  else alert('Only draft adverts can be edited. Click "View" to see the advert details.')
}
const downloadAttachments = async (advert) => {
  try {
    if (advert.attachments?.length > 0) {
      advert.attachments.forEach(attachment => { if (attachment.fullUrl) window.open(attachment.fullUrl, '_blank') })
    } else {
      alert('No attachments available for this advert')
    }
  } catch (error) {
    console.error('Download failed:', error)
    alert('Failed to download attachments')
  }
}

// ── Helper functions ──
function formatCurrency (amount) {
  if (amount === undefined || amount === null) return 'UGX 0'
  return new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount)
}
function getPublishingDates (advert) {
  let raw = advert?.publishingDates ?? advert?.publishing_dates
  if (!raw) return []
  if (typeof raw === 'string') {
    try { raw = JSON.parse(raw) } catch { return [] }
  }
  if (!Array.isArray(raw)) return []
  return raw.filter(Boolean)
}
function formatDate (dateString) {
  if (!dateString) return ''
  try { return new Date(dateString).toLocaleDateString('en-UG', { month: 'short', day: 'numeric', year: 'numeric' }) } catch { return dateString }
}
function formatTime (dateString) {
  if (!dateString) return ''
  try { return new Date(dateString).toLocaleTimeString('en-UG', { hour: '2-digit', minute: '2-digit', hour12: true }) } catch { return dateString }
}
function getStatusLabel (status) {
  const statusMap = {
    draft: 'Draft', pending_review: 'Pending Review', editor_approved: 'Editor Approved',
    manager_approved: 'Manager Approved', editor_rejected: 'Editor Rejected',
    manager_rejected: 'Manager Rejected', published: 'Published'
  }
  return statusMap[status] || status
}
function getStatusClass (status) {
  const statusClassMap = {
    draft: 'draft', pending_review: 'pending', editor_approved: 'approved',
    manager_approved: 'approved', editor_rejected: 'rejected', manager_rejected: 'rejected', published: 'published'
  }
  return statusClassMap[status] || 'default'
}

onMounted(() => {
  try { dashboardCollapsed.value = localStorage.getItem(DASHBOARD_COLLAPSE_KEY) === '1' } catch {}
  try {
    const saved = JSON.parse(localStorage.getItem(COLUMN_STORAGE_KEY) || '[]')
    if (Array.isArray(saved)) hiddenColumnKeys.value = new Set(saved)
  } catch {}
  initializeDates()
  loadAdverts()
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@600;700&display=swap');

/* ══════════════════════════════════════════════════════════════════════════════
   TOKENS
══════════════════════════════════════════════════════════════════════════════ */
.dash {
  --font-ui:   'IBM Plex Sans', 'Segoe UI', system-ui, sans-serif;
  --font-mono: 'IBM Plex Mono', 'Consolas', monospace;

  --navy:   #003366;
  --blue:   #2563eb;
  --blue-lt:#eff6ff;
  --green:  #16a366;
  --amber:  #d97706;
  --red:    #dc2626;
  --purple: #7c3aed;

  --ink:      #111827;
  --body:     #374151;
  --muted:    #6b7280;
  --faint:    #9ca3af;
  --border:   #e5e7eb;
  --border-lt:#f3f4f6;
  --page-bg:  #f0f4f8;
  --surface:  #ffffff;
  --header-bg:#0f1c2e;
  --header-hover: #16283d;
  --stripe-bg:#f9fafb;
  --hover-bg: #eff6ff;
  --selected-bg: #dbeafe;
  --total-bg: #eff6ff;
  --total-text: #1d4ed8;

  --radius: 8px;
  --shadow-sm: 0 1px 3px rgba(0,0,0,.06), 0 1px 2px rgba(0,0,0,.04);
  --shadow-md: 0 4px 16px rgba(0,0,0,.08), 0 2px 6px rgba(0,0,0,.05);
  --t: 150ms ease;

  display: flex; flex-direction: column; gap: 1rem;
  max-width: 1520px; margin: 0 auto; padding: 1.25rem 1.25rem 5rem;
  font-family: var(--font-ui); color: var(--body); background: var(--page-bg);
  min-height: 100%; box-sizing: border-box;
}
.dash *, .dash *::before, .dash *::after { box-sizing: border-box; }

/* ── Error banner ── */
.dash-error {
  display: flex; align-items: center; gap: 0.5rem; background: #fee2e2; color: #991b1b;
  border: 1px solid #fecaca; border-radius: var(--radius); padding: 0.625rem 0.875rem; font-size: 0.8125rem;
}
.dash-error svg { width: 18px; height: 18px; flex-shrink: 0; }

/* ── Page header ── */
.dash-head { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
.dash-head__eyebrow { display: flex; align-items: center; gap: 0.5rem; font-size: 1.25rem; font-weight: 700; color: var(--navy); letter-spacing: -.01em; }
.dash-head__eyebrow svg { width: 22px; height: 22px; }
.dash-head__sub { margin: 0.25rem 0 0; font-size: 0.8125rem; color: var(--muted); display: flex; align-items: center; gap: 0.375rem; flex-wrap: wrap; }
.dash-head__dot { color: var(--faint); }

/* ── Buttons ── */
.btn {
  display: inline-flex; align-items: center; gap: 0.4375rem; height: 2.25rem; padding: 0 1rem;
  border: 1px solid var(--border); border-radius: 6px; background: var(--surface); color: var(--body);
  font-family: var(--font-ui); font-size: 0.8125rem; font-weight: 600; cursor: pointer;
  transition: background var(--t), border-color var(--t), color var(--t); white-space: nowrap;
}
.btn svg { width: 15px; height: 15px; flex-shrink: 0; }
.btn:disabled { opacity: .5; cursor: not-allowed; }
.btn-new { background: var(--navy); color: #fff; border-color: var(--navy); }
.btn-new:hover:not(:disabled) { background: #004d99; }
.btn-apply { background: var(--blue); color: #fff; border-color: var(--blue); }
.btn-apply:hover:not(:disabled) { background: #1d4ed8; }
.btn-reset:hover { background: var(--page-bg); }

/* ══════════════════════════════════════════════════════════════════════════════
   FILTER TOOLBAR
══════════════════════════════════════════════════════════════════════════════ */
.toolbar { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); box-shadow: var(--shadow-sm); padding: 1rem; display: flex; flex-direction: column; gap: 0.875rem; }
.tb-row { display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: flex-end; }
.tb-field { display: flex; flex-direction: column; gap: 0.3125rem; min-width: 130px; }
.tb-field--search { flex: 1; min-width: 220px; }
.tb-label { font-size: 0.6875rem; font-weight: 700; color: var(--faint); text-transform: uppercase; letter-spacing: .06em; }
.tb-input {
  height: 2.25rem; padding: 0 0.625rem; border: 1px solid var(--border); border-radius: 6px;
  font-family: var(--font-ui); font-size: 0.8125rem; color: var(--ink); background: var(--surface);
  transition: border-color var(--t), box-shadow var(--t);
}
.tb-input:focus { outline: none; border-color: var(--blue); box-shadow: 0 0 0 3px rgba(37,99,235,.15); }
.tb-select { cursor: pointer; }
.tb-search-wrap { position: relative; }
.tb-search-icon { position: absolute; left: 0.625rem; top: 50%; transform: translateY(-50%); width: 15px; height: 15px; color: var(--faint); }
.tb-input--search { width: 100%; padding-left: 2.125rem; padding-right: 2rem; }
.tb-search-clear { position: absolute; right: 0.5rem; top: 50%; transform: translateY(-50%); width: 20px; height: 20px; border: none; background: transparent; color: var(--faint); cursor: pointer; display: flex; align-items: center; justify-content: center; }
.tb-search-clear svg { width: 16px; height: 16px; }
.tb-search-clear:hover { color: var(--red); }
.tb-quick { display: flex; gap: 0.375rem; flex-wrap: wrap; }
.qr-btn {
  height: 2.25rem; padding: 0 0.75rem; border: 1px solid var(--border); border-radius: 6px;
  background: var(--surface); color: var(--muted); font-family: var(--font-ui); font-size: 0.75rem; font-weight: 600;
  cursor: pointer; transition: all var(--t);
}
.qr-btn:hover { background: var(--page-bg); }
.qr-btn.active { background: var(--blue-lt); color: var(--blue); border-color: var(--blue); }
.tb-actions { display: flex; align-items: center; gap: 0.625rem; flex-wrap: wrap; }
.tb-error { color: #dc2626; font-size: 0.75rem; font-weight: 600; margin: 0; }

/* ══════════════════════════════════════════════════════════════════════════════
   COLLAPSE TOGGLE
══════════════════════════════════════════════════════════════════════════════ */
.collapse-bar {
  display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; flex-wrap: wrap;
  background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius);
  padding: 0.5rem 0.875rem;
}
.collapse-toggle {
  display: inline-flex; align-items: center; gap: 0.4375rem; border: none; background: transparent;
  color: var(--blue); font-family: var(--font-ui); font-size: 0.75rem; font-weight: 700; cursor: pointer;
  padding: 0.25rem 0; transition: color var(--t);
}
.collapse-toggle:hover { color: #1d4ed8; }
.collapse-chevron { width: 14px; height: 14px; transition: transform var(--t); }
.collapse-chevron--collapsed { transform: rotate(-90deg); }
.collapse-summary { display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; color: var(--muted); font-family: var(--font-mono); }
.collapse-dot { color: var(--faint); font-family: var(--font-ui); }
.collapse-paid { color: #1d4ed8; font-weight: 700; }
.collapse-unpaid { color: #a16207; font-weight: 700; }

/* ══════════════════════════════════════════════════════════════════════════════
   KPI TILES  (SummaryCard-style — accent strip, icon badge, mono value, sparkline)
══════════════════════════════════════════════════════════════════════════════ */
.kpi-row { display: flex; gap: 0.75rem; flex-wrap: wrap; }
.kpi-tile {
  position: relative; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius);
  padding: 0.875rem 1rem 0.875rem 1.125rem; overflow: hidden; transition: box-shadow var(--t), transform var(--t);
  flex: 1 1 200px; min-width: 200px; display: flex; flex-direction: column;
}
.kpi-tile:hover { box-shadow: var(--shadow-md); transform: translateY(-1px); }
.kpi-indicator { position: absolute; left: 0; top: 0; bottom: 0; width: 4px; border-radius: var(--radius) 0 0 var(--radius); }
.kpi-header { display: flex; align-items: flex-start; gap: 0.625rem; margin-bottom: 0.625rem; }
.kpi-icon { width: 32px; height: 32px; border-radius: 6px; display: flex; align-items: center; justify-content: center; color: #fff; flex-shrink: 0; }
.kpi-icon svg { width: 16px; height: 16px; }
.kpi-meta { flex: 1; display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.kpi-title { font-size: 0.6875rem; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.kpi-subtitle { font-size: 0.625rem; color: var(--faint); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.kpi-divider { height: 1px; background: var(--border-lt); margin: 0 -0.25rem 0.625rem; }
.kpi-body { display: flex; align-items: flex-end; justify-content: space-between; gap: 0.5rem; flex: 1; }
.kpi-value-wrap { min-width: 0; flex: 1; }
.kpi-value { font-size: 1.1875rem; font-weight: 800; color: var(--ink); font-family: var(--font-mono); line-height: 1.15; letter-spacing: -.02em; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.kpi-spark { display: flex; align-items: flex-end; gap: 2px; height: 28px; flex-shrink: 0; }
.spark-bar { width: 4px; border-radius: 2px 2px 0 0; opacity: .3; transition: opacity var(--t); }
.kpi-tile:hover .spark-bar { opacity: .55; }

.kpi-indicator.accent-primary { background: var(--blue); }
.kpi-indicator.accent-success { background: var(--green); }
.kpi-indicator.accent-info    { background: #0891b2; }
.kpi-indicator.accent-warning { background: var(--amber); }
.kpi-indicator.accent-danger  { background: var(--red); }
.icon-primary { background: linear-gradient(135deg, #3b82f6, #1d4ed8); }
.icon-success { background: linear-gradient(135deg, #16a366, #059669); }
.icon-info    { background: linear-gradient(135deg, #06b6d4, #0284c7); }
.icon-warning { background: linear-gradient(135deg, #f59e0b, #d97706); }
.icon-danger  { background: linear-gradient(135deg, #ef4444, #dc2626); }
.spark-bar.accent-primary { background: var(--blue); }
.spark-bar.accent-success { background: var(--green); }
.spark-bar.accent-info    { background: #0891b2; }
.spark-bar.accent-warning { background: var(--amber); }
.spark-bar.accent-danger  { background: var(--red); }

/* ══════════════════════════════════════════════════════════════════════════════
   GENERIC PANEL SHELL (chart cards)
══════════════════════════════════════════════════════════════════════════════ */
.fx-panel { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; display: flex; flex-direction: column; }
.panel-head { display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1rem; background: #f8fafc; border-bottom: 1px solid var(--border); flex-wrap: wrap; gap: 0.5rem; }
.panel-title-group { display: flex; align-items: center; gap: 0.5rem; }
.panel-icon { width: 28px; height: 28px; border-radius: 6px; display: flex; align-items: center; justify-content: center; color: #fff; flex-shrink: 0; }
.panel-icon svg { width: 14px; height: 14px; }
.panel-icon.icon-blue   { background: linear-gradient(135deg, #3b82f6, #1d4ed8); }
.panel-icon.icon-amber  { background: linear-gradient(135deg, #f59e0b, #d97706); }
.panel-icon.icon-purple { background: linear-gradient(135deg, #7c3aed, #4f46e5); }
.panel-icon.icon-green  { background: linear-gradient(135deg, #16a366, #059669); }
.panel-title { font-size: 0.8125rem; font-weight: 700; color: var(--ink); }
.panel-hint { font-size: 0.6875rem; color: var(--faint); font-weight: 500; }
.panel-divider { height: 1px; background: var(--border-lt); margin: 0 1rem; }

.panel-total { display: flex; align-items: baseline; gap: 0.3125rem; }
.pt-num { font-size: 1.0625rem; font-weight: 800; font-family: var(--font-mono); color: var(--ink); letter-spacing: -.02em; }
.pt-lbl { font-size: 0.625rem; text-transform: uppercase; letter-spacing: .07em; font-weight: 700; color: var(--faint); }

.panel-total-badge { font-size: 0.6875rem; color: var(--muted); display: flex; align-items: center; gap: 0.375rem; }
.panel-total-badge strong { font-family: var(--font-mono); color: var(--amber); font-weight: 700; }

.mini-legend { list-style: none; display: flex; gap: 0.875rem; margin: 0; padding: 0; }
.mini-legend li { display: flex; align-items: center; gap: 0.375rem; font-size: 0.75rem; color: var(--muted); font-weight: 600; }
.dot { width: 9px; height: 9px; border-radius: 50%; display: inline-block; flex-shrink: 0; }
.dot-paid, .dot-blue { background: var(--blue); }
.dot-unpaid, .dot-amber { background: var(--amber); }

/* ── Trend chart (paid/unpaid line graph, one shared origin) ── */
.trend-chart { position: relative; padding: 1rem 1rem 1.5rem; height: 6.5rem; }
.trend-svg { width: 100%; height: 100%; display: block; overflow: visible; }
.trend-axis { stroke: var(--border); stroke-width: 1; }
.trend-line { fill: none; stroke-width: 1.75; stroke-linejoin: round; stroke-linecap: round; transition: d .4s ease; }
.trend-line--paid { stroke: var(--blue); }
.trend-line--unpaid { stroke: var(--amber); }
.trend-dot { stroke: var(--panel-bg, #fff); stroke-width: 0.6; }
.trend-dot--paid { fill: var(--blue); }
.trend-dot--unpaid { fill: var(--amber); }
.trend-x-labels { position: relative; height: 0.875rem; }
.trend-x-label { position: absolute; top: 0; transform: translateX(-50%); font-size: 0.625rem; color: var(--faint); white-space: nowrap; font-weight: 600; font-family: var(--font-mono); }

/* ── Trend chart: single-bucket snapshot / empty states ── */
.trend-single { display: flex; align-items: center; justify-content: center; gap: 1.5rem; height: 100%; position: relative; }
.trend-single-stat { display: flex; flex-direction: column; align-items: center; gap: 0.375rem; }
.trend-single-label { display: flex; align-items: center; gap: 0.375rem; font-size: 0.75rem; color: var(--muted); font-weight: 600; }
.trend-single-value { font-size: 1.375rem; font-weight: 700; font-family: var(--font-mono); }
.trend-single-value--paid { color: var(--blue); }
.trend-single-value--unpaid { color: var(--amber); }
.trend-single-divider { width: 1px; height: 2.5rem; background: var(--border); }
.trend-single-date { position: absolute; bottom: -0.25rem; left: 50%; transform: translateX(-50%); font-size: 0.625rem; color: var(--faint); font-weight: 600; font-family: var(--font-mono); }
.trend-empty { display: flex; align-items: center; justify-content: center; height: 100%; color: var(--faint); font-size: 0.8125rem; }

/* ══════════════════════════════════════════════════════════════════════════════
   CHARTS ROW
══════════════════════════════════════════════════════════════════════════════ */
.charts-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1rem; align-items: start; }

/* Ledger (CommissionStats-style) */
.ledger { padding: 0 0 0.25rem; }
.ledger-header { display: flex; justify-content: space-between; padding: 0.375rem 1rem; background: #f8fafc; border-bottom: 1px solid var(--border-lt); }
.lh-cell { font-size: 0.5625rem; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: var(--faint); }
.lh-cell.text-right { text-align: right; }
.ledger-row { display: flex; justify-content: space-between; align-items: center; padding: 0.4375rem 1rem; border-bottom: 1px solid #f9fafb; transition: background .1s; }
.ledger-row:hover { background: #f9fafb; }
.lr-label-wrap { display: flex; align-items: center; gap: 0.5rem; }
.lr-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.lr-label { font-size: 0.75rem; color: var(--body); font-weight: 500; }
.lr-value { font-size: 0.75rem; font-family: var(--font-mono); font-weight: 700; color: var(--ink); }
.val-credit { color: #15803d; } .val-warn { color: #a16207; }

.breakdown { padding: 0.75rem 1rem 1rem; }
.breakdown-title { font-size: 0.5625rem; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: var(--faint); margin-bottom: 0.625rem; }
.breakdown-bars { display: flex; flex-direction: column; gap: 0.5rem; }
.bbar-row { display: grid; grid-template-columns: 52px 1fr 40px; align-items: center; gap: 0.5rem; }
.bb-label { font-size: 0.6875rem; color: var(--muted); font-weight: 500; }
.bb-track { height: 6px; background: var(--border-lt); border-radius: 3px; overflow: hidden; }
.bb-fill { height: 100%; border-radius: 3px; transition: width .5s ease; }
.bb-fill.paid { background: linear-gradient(90deg, var(--blue), #60a5fa); }
.bb-fill.unpaid { background: linear-gradient(90deg, var(--amber), #fbbf24); }
.bb-val { font-size: 0.6875rem; font-family: var(--font-mono); font-weight: 700; text-align: right; }
.paid-text { color: #1d4ed8; } .unpaid-text { color: #a16207; }

/* Status segment bar + table (OrderStatusChart-style) */
.segment-wrap { padding: 1rem 1rem 0; }
.segment-bar { display: flex; height: 18px; border-radius: 4px; overflow: hidden; gap: 1px; background: var(--border-lt); }
.segment { height: 100%; transition: opacity .2s, filter .2s; cursor: pointer; min-width: 2px; }
.segment.dimmed { opacity: .25; filter: grayscale(.4); }
.sp-table { margin: 0.75rem 0 0.25rem; border-top: 1px solid var(--border-lt); }
.spt-header { display: grid; grid-template-columns: 1fr 52px 52px 1fr; align-items: center; gap: 0.25rem; padding: 0.375rem 1rem; background: #f8fafc; border-bottom: 1px solid var(--border-lt); }
.sph-cell { font-size: 0.5625rem; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: var(--faint); }
.sph-cell.text-right { text-align: right; }
.spt-row { display: grid; grid-template-columns: 1fr 52px 52px 1fr; align-items: center; gap: 0.25rem; padding: 0.4375rem 1rem; border-bottom: 1px solid #f9fafb; transition: background .1s; }
.spt-row:hover, .spt-row--active { background: #f9fafb; }
.spt-label { display: flex; align-items: center; gap: 0.5rem; min-width: 0; }
.spt-dot { width: 8px; height: 8px; border-radius: 2px; flex-shrink: 0; }
.spt-name { font-size: 0.75rem; font-weight: 500; color: var(--body); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.spt-count { font-size: 0.75rem; font-family: var(--font-mono); font-weight: 700; color: var(--body); text-align: right; }
.spt-pct { font-size: 0.6875rem; font-family: var(--font-mono); font-weight: 700; text-align: right; }
.spt-bar-wrap { height: 6px; background: var(--border-lt); border-radius: 3px; overflow: hidden; }
.spt-bar-fill { height: 100%; border-radius: 3px; transition: width .5s ease; }

/* Top breakdown / streams (RevenueBreakdown-style) */
.tabs { display: flex; gap: 0.25rem; background: var(--page-bg); border-radius: 6px; padding: 3px; }
.tab-btn { height: 24px; padding: 0 0.5rem; border: none; border-radius: 4px; background: transparent; color: var(--muted); font-family: var(--font-ui); font-size: 0.6875rem; font-weight: 600; cursor: pointer; transition: all var(--t); }
.tab-btn:hover { color: var(--ink); }
.tab-btn.active { background: var(--surface); color: var(--blue); box-shadow: var(--shadow-sm); }
.streams { padding: 0.75rem 1rem 1rem; }
.stream-header { display: grid; grid-template-columns: 1fr 96px 48px; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; padding-bottom: 0.375rem; border-bottom: 1px solid var(--border-lt); }
.sh-label { font-size: 0.5625rem; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: var(--faint); }
.sh-label.text-right { text-align: right; }
.stream-row { display: grid; grid-template-columns: 1fr 96px 48px; grid-template-rows: auto auto; align-items: center; gap: 0.25rem 0.75rem; margin-bottom: 0.625rem; }
.stream-row:last-child { margin-bottom: 0; }
.stream-info { grid-row: 1; grid-column: 1; display: flex; align-items: center; gap: 0.5rem; min-width: 0; }
.stream-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; background: var(--green); }
.stream-meta { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.stream-name { font-size: 0.75rem; font-weight: 600; color: var(--body); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.stream-desc { font-size: 0.625rem; color: var(--faint); }
.stream-amount { grid-row: 1; grid-column: 2; font-size: 0.75rem; font-weight: 700; font-family: var(--font-mono); color: var(--ink); text-align: right; white-space: nowrap; }
.stream-pct { grid-row: 1; grid-column: 3; font-size: 0.6875rem; font-weight: 600; font-family: var(--font-mono); color: var(--muted); text-align: right; }
.stream-bar-wrap { grid-row: 2; grid-column: 1 / -1; height: 6px; background: var(--border-lt); border-radius: 3px; overflow: hidden; width: 100%; }
.stream-bar-fill { height: 100%; border-radius: 3px; background: linear-gradient(90deg, var(--green), #34d399); transition: width .6s ease; }
.rank-empty { font-size: 0.8125rem; color: var(--faint); text-align: center; padding: 1.5rem 0; margin: 0; }

/* ══════════════════════════════════════════════════════════════════════════════
   LOADING / EMPTY
══════════════════════════════════════════════════════════════════════════════ */
.fx-loading { padding: 2.5rem 1.5rem; text-align: center; color: var(--faint); font-size: 0.8125rem; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); }
.loading-bar { height: 3px; background: var(--border); border-radius: 2px; overflow: hidden; margin-bottom: 1rem; max-width: 240px; margin-left: auto; margin-right: auto; }
.loading-progress { height: 100%; width: 40%; background: var(--blue); border-radius: 2px; animation: loadpulse 1.4s ease-in-out infinite; }
@keyframes loadpulse { 0% { transform: translateX(-100%); } 100% { transform: translateX(350%); } }

.fx-empty { display: flex; flex-direction: column; align-items: center; gap: 0.625rem; padding: 3.5rem 1.25rem; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); text-align: center; color: var(--faint); }
.fx-empty svg { width: 56px; height: 56px; }
.fx-empty h5 { margin: 0; font-size: 0.9375rem; font-weight: 700; color: var(--body); }
.fx-empty p { margin: 0; font-size: 0.8125rem; color: var(--muted); max-width: 22rem; }
.fx-empty__actions { display: flex; gap: 0.625rem; margin-top: 0.375rem; }

/* ══════════════════════════════════════════════════════════════════════════════
   LEDGER TABLE PANEL
══════════════════════════════════════════════════════════════════════════════ */
.fx-table-panel { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; display: flex; flex-direction: column; }

/* Toolbar */
.panel-toolbar { display: flex; align-items: center; justify-content: space-between; padding: 0.625rem 1rem; background: #f8fafc; border-bottom: 1px solid var(--border); gap: 0.75rem; flex-wrap: wrap; }
.toolbar-left { display: flex; align-items: center; gap: 0.625rem; }
.toolbar-right { display: flex; align-items: center; gap: 0.5rem; }
.panel-title-sm { display: flex; align-items: center; gap: 0.375rem; font-size: 0.8125rem; font-weight: 700; color: var(--ink); }
.panel-title-sm svg { width: 15px; height: 15px; color: var(--blue); }
.rc-badge { background: var(--blue); color: #fff; font-size: 0.625rem; font-weight: 700; padding: 0.125rem 0.5rem; border-radius: 10px; font-family: var(--font-mono); }
.rc-label { font-size: 0.6875rem; color: var(--muted); }
.page-size-control { display: flex; align-items: center; gap: 0.375rem; }
.psc-label { font-size: 0.6875rem; color: var(--muted); white-space: nowrap; }
.psc-select { height: 28px; padding: 0 0.375rem; border: 1px solid var(--border); border-radius: 4px; font-size: 0.75rem; background: #fff; color: var(--body); cursor: pointer; outline: none; }
.psc-select:focus { border-color: var(--blue); }
.toolbar-btn {
  height: 28px; padding: 0 0.625rem; border: 1px solid var(--border); border-radius: 4px; background: #fff; color: var(--muted);
  font-size: 0.75rem; cursor: pointer; display: flex; align-items: center; gap: 0.375rem; transition: all var(--t); white-space: nowrap;
}
.toolbar-btn svg { width: 13px; height: 13px; }
.toolbar-btn:hover { background: var(--border-lt); border-color: var(--faint); color: var(--body); }
.toolbar-btn.accent { background: var(--blue); border-color: var(--blue); color: #fff; font-weight: 600; }
.toolbar-btn.accent:hover:not(:disabled) { background: #1d4ed8; }
.toolbar-btn.active { background: var(--blue-lt); border-color: var(--blue); color: var(--blue); }

/* Column visibility dropdown */
.col-menu-wrap { position: relative; }
.col-menu-badge {
  position: absolute; top: -6px; right: -6px; min-width: 15px; height: 15px; padding: 0 3px;
  background: var(--blue); color: #fff; font-size: 0.5625rem; font-weight: 700; border-radius: 8px;
  display: inline-flex; align-items: center; justify-content: center; line-height: 1; font-family: var(--font-mono);
}
.col-menu-backdrop { position: fixed; inset: 0; z-index: 30; }
.col-menu-dropdown {
  position: absolute; top: calc(100% + 6px); right: 0; z-index: 31; width: 220px;
  background: #fff; border: 1px solid var(--border); border-radius: 8px; box-shadow: var(--shadow-md);
  padding: 0.5rem; display: flex; flex-direction: column;
}
.col-menu-header { display: flex; align-items: center; justify-content: space-between; padding: 0.25rem 0.375rem 0.5rem; border-bottom: 1px solid var(--border-lt); margin-bottom: 0.25rem; }
.col-menu-header span { font-size: 0.6875rem; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: var(--muted); }
.col-menu-reset { border: none; background: none; color: var(--blue); font-size: 0.6875rem; font-weight: 600; cursor: pointer; padding: 0; }
.col-menu-reset:hover { text-decoration: underline; }
.col-menu-option { display: flex; align-items: center; gap: 0.5rem; padding: 0.3125rem 0.375rem; font-size: 0.75rem; color: var(--body); border-radius: 4px; cursor: pointer; }
.col-menu-option:hover { background: var(--border-lt); }
.col-menu-option input { accent-color: var(--blue); cursor: pointer; }
.col-menu-locked { opacity: .6; cursor: default; }
.col-menu-locked:hover { background: transparent; }
.toolbar-btn:disabled { opacity: .5; cursor: not-allowed; }

/* Grid wrapper */
.fx-grid-wrap { overflow: auto; scrollbar-width: thin; scrollbar-color: #cbd5e1 transparent; }
.fx-grid-wrap::-webkit-scrollbar { height: 8px; width: 8px; }
.fx-grid-wrap::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }

.fx-grid { width: 100%; border-collapse: collapse; min-width: 1420px; font-size: 0.75rem; table-layout: fixed; }

/* Head — dark navy-slate, like the FoodXpress ledger */
.fx-thead { position: sticky; top: 0; z-index: 20; }
.header-row th { background: var(--header-bg); border-right: 1px solid #1c2e45; border-bottom: 2px solid #0a1622; padding: 0; }
.th-rownum { width: 42px; background: var(--header-bg); font-size: 0.5625rem; font-weight: 700; color: #64748b; text-align: center; }
.th-cell { cursor: pointer; user-select: none; vertical-align: middle; }
.th-cell:hover { background: var(--header-hover); }
.th-inner { display: flex; align-items: center; justify-content: space-between; gap: 0.375rem; padding: 0.5625rem 0.75rem; }
.text-right .th-inner { justify-content: flex-end; }
.th-label { font-size: 0.625rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: .06em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sort-mark { font-size: 0.5625rem; color: #4b5563; flex-shrink: 0; margin-left: 4px; }
.sort-mark--active { color: #60a5fa; }
.th-actions { padding: 0.5625rem 0.75rem; font-size: 0.625rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: .06em; cursor: default; }

/* Frozen row-number column */
.sticky-col-0 { position: sticky; left: 0; z-index: 10; }
.fx-thead .sticky-col-0 { background: #0a1622; border-right: 2px solid #0a1622; z-index: 25; }
.sticky-col-1 { position: sticky; left: 42px; z-index: 9; background: #fff; box-shadow: 2px 0 6px -2px rgba(0,0,0,.08); }
.fx-thead .sticky-col-1 { background: var(--header-bg); z-index: 24; box-shadow: none; }
.row-stripe .sticky-col-1 { background: var(--stripe-bg); }
.fx-row:hover .sticky-col-1 { background: var(--hover-bg); }
.row-selected .sticky-col-1 { background: var(--selected-bg) !important; }

/* Rows */
.fx-row { cursor: pointer; transition: background .1s; }
.fx-row:hover td { background: var(--hover-bg); }
.fx-row:hover .sticky-col-0 { background: #dbeafe; }
.row-stripe td { background: var(--stripe-bg); }
.row-stripe .sticky-col-0 { background: #f5f8fa; }
.row-selected td { background: var(--selected-bg) !important; }

.td-rownum { padding: 0 0.5rem; font-size: 0.625rem; font-family: var(--font-mono); color: var(--faint); text-align: center; background: #f8fafc; border-right: 2px solid #e2e8f0; vertical-align: middle; white-space: nowrap; }
.td-cell { padding: 0.4375rem 0.75rem; border-bottom: 1px solid var(--border-lt); border-right: 1px solid var(--border-lt); vertical-align: top; background: #fff; white-space: nowrap; }
.row-stripe .td-cell { background: var(--stripe-bg); }
.td-wrap { white-space: normal; }

/* Cell atoms */
.order-cell { display: flex; align-items: center; gap: 0.375rem; }
.order-chip { font-family: var(--font-mono); font-size: 0.6875rem; font-weight: 700; color: #1d4ed8; background: #eff6ff; padding: 0.1875rem 0.5rem; border-radius: 4px; white-space: nowrap; }
.bc-chip { display: inline-block; margin-top: 3px; font-family: var(--font-mono); font-size: 0.625rem; color: var(--faint); background: var(--page-bg); border: 1px solid var(--border); padding: 0.0625rem 0.375rem; border-radius: 3px; }
.expand-icon { width: 12px; height: 12px; color: var(--faint); flex-shrink: 0; transition: transform var(--t); }
.expand-icon--open { transform: rotate(90deg); color: var(--blue); }

.cell-primary { display: block; font-size: 0.75rem; font-weight: 600; color: var(--ink); line-height: 1.35; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cell-secondary { display: block; font-size: 0.6875rem; color: var(--muted); font-family: var(--font-mono); line-height: 1.4; margin-top: 1px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.td-wrap .cell-primary, .td-wrap .cell-secondary { white-space: normal; overflow: visible; text-overflow: unset; word-break: break-word; font-family: var(--font-ui); }
.cell-cap { text-transform: capitalize; }
.cell-empty { color: var(--border); font-size: 0.75rem; }

.mini-chip { display: inline-block; margin-top: 3px; margin-right: 3px; font-size: 0.5625rem; font-weight: 700; padding: 0.0625rem 0.375rem; border-radius: 3px; letter-spacing: .02em; white-space: normal; }
.chip-gray { color: var(--muted); background: var(--page-bg); border: 1px solid var(--border); }
.chip-red { color: #991b1b; background: #fef2f2; border: 1px solid #fecaca; }

.td-num { text-align: right; }
.num-value { font-family: var(--font-mono); font-size: 0.75rem; font-weight: 700; display: block; text-align: right; color: var(--ink); }

.bool-pill { display: inline-flex; align-items: center; gap: 0.3125rem; font-size: 0.625rem; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; padding: 0.1875rem 0.5rem; border-radius: 3px; }
.bool-dot { width: 5px; height: 5px; border-radius: 50%; background: currentColor; flex-shrink: 0; }
.bool-paid { background: #dbeafe; color: #1d4ed8; }
.bool-unpaid { background: #fef3c7; color: #a16207; }

.status-pill { display: inline-flex; align-items: center; height: 20px; padding: 0 0.5rem; border-radius: 3px; font-size: 0.625rem; font-weight: 700; white-space: nowrap; letter-spacing: .02em; text-transform: uppercase; }
.status-draft { background: #fffbeb; color: #92400e; border: 1px solid #fde68a; }
.status-pending { background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; }
.status-approved { background: #f0fdf4; color: #15803d; border: 1px solid #86efac; }
.status-rejected { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
.status-published { background: #e6ecf2; color: var(--navy); border: 1px solid #c7d4e0; }
.status-default { background: var(--page-bg); color: var(--muted); border: 1px solid var(--border); }

.dt-stack { display: flex; flex-direction: column; gap: 1px; }
.dt-date { font-size: 0.6875rem; font-weight: 600; color: var(--body); }
.dt-time { font-size: 0.625rem; color: var(--faint); font-family: var(--font-mono); }

.td-actions { text-align: center; }
.action-group { display: flex; align-items: center; justify-content: center; gap: 0.25rem; }
.act-btn { width: 26px; height: 26px; border-radius: 4px; border: 1px solid var(--border); background: #fff; color: var(--muted); cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0; transition: all .15s; }
.act-btn svg { width: 13px; height: 13px; }
.act-btn:hover { background: var(--border-lt); border-color: var(--faint); color: var(--body); transform: translateY(-1px); }
.act-btn.amber:hover { background: #fffbeb; border-color: #fde68a; color: #b45309; }
.act-btn.purple:hover { background: #f3e8ff; border-color: #e9d5ff; color: #7c3aed; }
.act-btn.green:hover { background: #f0fdf4; border-color: #86efac; color: #15803d; }
.act-btn.blue:hover { background: var(--blue-lt); border-color: #bfdbfe; color: var(--blue); }

/* Expanded detail row */
.fx-detail-row { cursor: default; }
.detail-cell { padding: 0; background: #f8fafc !important; border-bottom: 2px solid var(--blue); }
.detail-wrap { padding: 0.875rem 1.25rem; display: flex; flex-direction: column; gap: 0.75rem; }
.detail-toolbar { display: flex; justify-content: flex-end; }
.btn-mini {
  display: inline-flex; align-items: center; gap: 0.375rem; height: 28px; padding: 0 0.75rem;
  border: 1px solid var(--green); border-radius: 6px; background: #f0fdf4; color: #15803d;
  font-family: var(--font-ui); font-size: 0.75rem; font-weight: 600; cursor: pointer; transition: background var(--t);
}
.btn-mini svg { width: 14px; height: 14px; }
.btn-mini:hover { background: #dcfce7; }
.detail-info-strip { display: flex; flex-wrap: wrap; gap: 0.75rem; padding: 0.5rem 0.75rem; background: #fff; border: 1px solid var(--border); border-radius: 6px; }
.dis-item { display: flex; flex-direction: column; gap: 1px; min-width: 100px; }
.dis-label { font-size: 0.5rem; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: var(--faint); }
.dis-value { font-size: 0.75rem; font-weight: 500; color: var(--body); }
.dis-value.mono { font-family: var(--font-mono); }
.detail-notes { margin: 0; font-size: 0.75rem; color: var(--body); line-height: 1.5; }
.detail-notes strong { color: var(--ink); }
.detail-pubdates { display: flex; flex-direction: column; gap: 0.375rem; }
.date-chip { display: inline-flex; align-items: center; height: 24px; padding: 0 0.625rem; font-size: 0.6875rem; font-weight: 700; font-family: var(--font-mono); color: #1d4ed8; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 4px; }
.detail-files { display: flex; flex-wrap: wrap; gap: 0.375rem; }
.file-chip { display: inline-flex; align-items: center; height: 24px; padding: 0 0.625rem; font-size: 0.6875rem; font-weight: 600; color: #7c3aed; background: #f3e8ff; border: 1px solid #e9d5ff; border-radius: 4px; text-decoration: none; transition: background var(--t); }
.file-chip:hover { background: #e9d5ff; }

/* Page totals footer */
.fx-tfoot .totals-row td { background: var(--total-bg); border-top: 2px solid #93c5fd; border-bottom: none; }
.totals-label { font-size: 0.625rem; font-weight: 700; color: var(--total-text); text-transform: uppercase; text-align: center; }
.totals-val { font-family: var(--font-mono); font-size: 0.6875rem; font-weight: 700; color: var(--total-text); text-align: right; }

/* Pagination */
.fx-pagebar { display: flex; align-items: center; justify-content: space-between; padding: 0.5rem 1rem; background: #f8fafc; border-top: 1px solid var(--border); gap: 0.75rem; flex-wrap: wrap; }
.page-info { font-size: 0.6875rem; color: var(--muted); white-space: nowrap; }
.page-info strong { font-family: var(--font-mono); color: var(--body); }
.page-nav { display: flex; align-items: center; gap: 0.25rem; }
.pn-btn { width: 28px; height: 28px; border: 1px solid var(--border); border-radius: 4px; background: #fff; color: var(--muted); cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; transition: all .15s; padding: 0; }
.pn-btn:hover:not(:disabled) { background: var(--blue); border-color: var(--blue); color: #fff; }
.pn-btn:disabled { opacity: .4; cursor: not-allowed; }
.page-pills { display: flex; gap: 0.125rem; }
.pp-btn { min-width: 28px; height: 28px; padding: 0 0.375rem; border: 1px solid var(--border); border-radius: 4px; background: #fff; color: var(--body); cursor: pointer; font-size: 0.6875rem; font-family: var(--font-mono); font-weight: 600; transition: all .15s; }
.pp-btn.active { background: var(--blue); border-color: var(--blue); color: #fff; }
.pp-btn.ellipsis { border-color: transparent; background: transparent; cursor: default; }
.pp-btn:hover:not(.active):not(.ellipsis) { background: var(--border-lt); }

/* ══════════════════════════════════════════════════════════════════════════════
   FAB
══════════════════════════════════════════════════════════════════════════════ */
.fab {
  position: fixed; bottom: 24px; right: 24px; display: flex; align-items: center; gap: 8px;
  height: 48px; padding: 0 22px; background: var(--navy); color: #fff; border: none; border-radius: 6px;
  font-family: var(--font-ui); font-size: 0.8125rem; font-weight: 700; cursor: pointer;
  box-shadow: 0 4px 20px rgba(0,51,102,.35); z-index: 100; transition: all var(--t);
}
.fab svg { width: 18px; height: 18px; flex-shrink: 0; }
.fab:hover { background: #004d99; box-shadow: 0 6px 28px rgba(0,51,102,.45); transform: translateY(-2px); }

@media (max-width: 640px) {
  .fab { width: 52px; height: 52px; padding: 0; justify-content: center; border-radius: 50%; bottom: 20px; right: 16px; }
  .fab-label { display: none; }
  .dash { padding: 0.875rem 0.875rem 5rem; }
}
</style>