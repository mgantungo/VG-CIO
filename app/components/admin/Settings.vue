<!-- ~/components/admin/Settings.vue -->
<template>
  <div class="settings-container">

    <!-- ── Tabs ──────────────────────────────────────────────────────── -->
    <div class="settings-tabs">
      <button class="settings-tab" :class="{ 'settings-tab--active': activeTab === 'clients' }" @click="activeTab = 'clients'">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        Client Sync
      </button>
      <button class="settings-tab" :class="{ 'settings-tab--active': activeTab === 'rate_cards' }" @click="activeTab = 'rate_cards'">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M7 15h.01M11 15h4"/></svg>
        Rate Cards
      </button>
      <button class="settings-tab" :class="{ 'settings-tab--active': activeTab === 'general' }" @click="activeTab = 'general'" :disabled="true">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H5.78a1.65 1.65 0 0 0-1.51 1 1.65 1.65 0 0 0 .33 1.82"/></svg>
        General <span class="tab-chip">Soon</span>
      </button>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════
         CLIENT SYNC PANEL (UNCHANGED)
    ═══════════════════════════════════════════════════════════════ -->
    <div v-show="activeTab === 'clients'" class="settings-panel">
      <div class="sync-header">
        <h2 class="sync-title">Business Central Client Sync</h2>
        <p class="sync-desc">Synchronize clients from Business Central to the VGAMS database. This will mark inactive clients that no longer exist in BC and create new ones.</p>
      </div>
      <div class="sync-actions">
        <button class="btn btn--primary" @click="handleSync(true)" :disabled="isLoading">
          <svg v-if="isLoading" class="btn__spin" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" fill="none" stroke-width="2"/><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" fill="none" stroke-width="2"/></svg>
          <span v-else>Sync Now</span>
        </button>
        <button class="btn btn--secondary" @click="handleSync(false)" :disabled="isLoading">Dry Run (Validate Only)</button>
        <button v-if="syncResult" class="btn btn--ghost" @click="clearResults">Clear Results</button>
      </div>

      <div v-if="syncError" class="s-alert s-alert--error">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        {{ syncError }}
        <button @click="syncError = null" class="s-alert__x">×</button>
      </div>

      <div v-if="syncResult" class="results">
        <div class="summary-grid">
          <div class="summary-card">
            <div class="sc-label">Mode</div>
            <div class="sc-val" :class="{ 'sc-val--dry': !syncResult.summary?.insertMode || syncResult.summary?.insertMode === 'validate-only' }">
              {{ syncResult.summary?.insertMode === 'insert' ? 'Live Sync' : 'Dry Run' }}
            </div>
            <div class="sc-hint">{{ syncResult.summary?.insertMode === 'insert' ? 'Data written to DB' : 'No changes made' }}</div>
          </div>
          <div class="summary-card"><div class="sc-label">Fetched</div><div class="sc-val">{{ syncResult.summary?.fetched || 0 }}</div><div class="sc-hint">From BC</div></div>
          <div class="summary-card"><div class="sc-label">Inserted</div><div class="sc-val">{{ syncResult.summary?.inserted || 0 }}</div><div class="sc-hint">New clients</div></div>
          <div class="summary-card"><div class="sc-label">Updated</div><div class="sc-val">{{ syncResult.summary?.updated || 0 }}</div><div class="sc-hint">Reactivated</div></div>
          <div class="summary-card"><div class="sc-label">Skipped</div><div class="sc-val">{{ syncResult.summary?.skipped || 0 }}</div><div class="sc-hint">Validation failed</div></div>
          <div class="summary-card"><div class="sc-label">Errors</div><div class="sc-val">{{ syncResult.summary?.errors || 0 }}</div><div class="sc-hint">Processing errors</div></div>
          <div class="summary-card sc-wide"><div class="sc-label">Execution Time</div><div class="sc-val">{{ formatDuration(syncResult.summary?.executionTimeMs) }}</div><div class="sc-hint">Total duration</div></div>
        </div>

        <div v-for="sec in previewSections" :key="sec.field">
          <div v-if="(syncResult.details?.[sec.field]?.length || 0) > 0" :class="['preview-section', sec.cls]">
            <div class="preview-header" @click="sec.open = !sec.open">
              <svg :class="['preview-chevron', { rotated: sec.open }]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="6 9 12 15 18 9"/></svg>
              <span class="preview-title">{{ sec.label }} ({{ syncResult.details[sec.field].length }})</span>
              <span :class="['preview-badge', sec.badgeCls]">{{ sec.badgeText }}</span>
            </div>

            <div v-show="sec.open" class="preview-body">
              <table class="preview-table">
                <thead>
                  <tr>
                    <th v-for="h in sec.headers" :key="h">{{ h }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, i) in syncResult.details[sec.field].slice(0, 50)" :key="i">
                    <td v-for="(col, ci) in sec.cols" :key="ci" v-html="col(item)"></td>
                  </tr>
                </tbody>
              </table>
              <div v-if="syncResult.details[sec.field].length > 50" class="preview-more">
                + {{ syncResult.details[sec.field].length - 50 }} more
              </div>
            </div>

          </div>
        </div>

        <div v-if="syncResult.summary?.insertMode === 'insert' && syncResult.success" class="s-alert s-alert--success">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20 6L9 17l-5-5" stroke-width="2"/></svg>
          {{ syncResult.message }}
        </div>
      </div>

      <div v-else-if="!isLoading && !syncError" class="empty-state">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        <p>No sync performed yet. Click <strong>Sync Now</strong> or run a <strong>Dry Run</strong> first.</p>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════
         RATE CARDS PANEL  — side-by-side workspace (STRAPI 5 UPDATED)
    ═══════════════════════════════════════════════════════════════ -->
    <div v-show="activeTab === 'rate_cards'" class="settings-panel rc-outer">

      <!-- Active-reference context bar -->
      <transition name="ctx-fade">
        <div v-if="selectedBC" class="ctx-bar">
          <div class="ctx-bar__left">
            <span class="ctx-pulse"></span>
            <span class="ctx-label">BC Reference:</span>
            <code class="ctx-no">{{ selectedBC.No }}</code>
            <span class="ctx-name">{{ selectedBC.Name }}</span>
            <span class="ctx-tag">{{ selectedBC.Base_Unit_of_Measure }}</span>
            <span class="ctx-tag ctx-tag--price">{{ numFmt(selectedBC.Unit_Price) }} UGX</span>
          </div>
          <div class="ctx-bar__right">
            <span class="ctx-hint">Open a rate card row → use Assign buttons to set FC / BW codes</span>
            <button class="ctx-clear" @click="selectedBC = null">× Clear</button>
          </div>
        </div>
      </transition>

      <!-- Two-pane workspace -->
      <div class="rc-workspace">

        <!-- ══════════════════════════════════════════
             LEFT PANE — Rate Cards (all fields)
        ══════════════════════════════════════════ -->
        <div class="rc-pane rc-pane--left">

          <div class="rc-pane__head">
            <div class="pane-title-row">
              <div>
                <div class="pane-title">
                  Rate Cards
                  <span v-if="rcMeta.total" class="rc-chip">{{ rcMeta.total.toLocaleString() }} total</span>
                </div>
                <div class="pane-sub">Click any row to expand the edit form. Use Assign buttons to link a BC resource code.</div>
              </div>
              <button v-if="!rcLoaded" class="btn btn--primary btn--sm" @click="doLoadRateCards(1)" :disabled="isLoadingRC">
                Load Rate Cards
              </button>
            </div>

            <div class="pane-search-row">
              <div class="search-wrap">
                <svg class="si" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                <input v-model="rcSearch" class="s-input" placeholder="Ad type, FC No., BW No., product…" @keyup.enter="doLoadRateCards(1)" />
                <button v-if="rcSearch" class="s-clear" @click="rcSearch = ''; doLoadRateCards(1)">×</button>
              </div>
              <button class="btn btn--secondary btn--xs" @click="doLoadRateCards(1)" :disabled="isLoadingRC">
                <svg v-if="isLoadingRC" class="btn__spin btn__spin--xs" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" fill="none" stroke-width="2.5"/><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" fill="none" stroke-width="2.5"/></svg>
                <span v-else>Search</span>
              </button>
            </div>

            <div v-if="rcLoaded" class="pane-pager">
              <button class="pg-btn" :disabled="rcMeta.page <= 1 || isLoadingRC" @click="doLoadRateCards(rcMeta.page - 1)">‹ Prev</button>
              <span class="pg-info">Page {{ rcMeta.page }} of {{ rcMeta.pageCount }} &nbsp;·&nbsp; {{ rcMeta.total.toLocaleString() }} rate cards</span>
              <button class="pg-btn" :disabled="rcMeta.page >= rcMeta.pageCount || isLoadingRC" @click="doLoadRateCards(rcMeta.page + 1)">Next ›</button>
            </div>
          </div>

          <div class="rc-pane__body">

            <div v-if="isLoadingRC" class="pane-spinner"><div class="sp-ring"></div> Loading rate cards…</div>
            <div v-if="rcError" class="pane-err">{{ rcError }} <button @click="rcError = null">×</button></div>

            <div v-if="!rcLoaded && !isLoadingRC && !rcError" class="pane-empty">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M7 15h.01M11 15h4"/></svg>
              <p>Click <strong>Load Rate Cards</strong> to start browsing.</p>
            </div>

            <template v-if="rcLoaded && !isLoadingRC">
              <div v-if="rateCards.length === 0" class="pane-empty">
                <p>No rate cards match. Try a different search term.</p>
              </div>

              <table v-else class="dt">
                <thead>
                  <tr>
                    <th class="th-product">Product</th>
                    <th class="th-adtype">Ad Type</th>
                    <th class="th-size">Size / Dim</th>
                    <th class="th-num">Price FC</th>
                    <th class="th-num">Price BW</th>
                    <th class="th-fc">FC No.</th>
                    <th class="th-bw">BW No.</th>
                    <th class="th-act"></th>
                  </tr>
                </thead>
                <tbody>
                  <template v-for="(rc, rcIdx) in rateCards" :key="rc.id">

                    <tr
                      class="dt-row"
                      :class="{
                        'dt-row--even': rcIdx % 2 === 1,
                        'dt-row--open': editingId === rc.id,
                        'dt-row--match-fc': isLinkedFC(rc),
                        'dt-row--match-bw': isLinkedBW(rc),
                      }"
                      @click="toggleEdit(rc)"
                    >
                      <td class="th-product ell" :title="rcProduct(rc)">{{ rcProduct(rc) }}</td>
                      <td class="th-adtype ell" :title="rc.ad_type">{{ rc.ad_type || '—' }}</td>
                      <td class="th-size">{{ rc.size_dimension || '—' }}</td>
                      <td class="th-num r">{{ rc.price_fc != null ? numFmt(rc.price_fc) : '—' }}</td>
                      <td class="th-num r">{{ rc.price_bw != null ? numFmt(rc.price_bw) : '—' }}</td>
                      <td class="th-fc">
                        <code v-if="rc.full_color_no" class="pill pill--fc">{{ rc.full_color_no }}</code>
                        <span v-else class="dash">—</span>
                      </td>
                      <td class="th-bw">
                        <code v-if="rc.black_color_no" class="pill pill--bw">{{ rc.black_color_no }}</code>
                        <span v-else class="dash">—</span>
                      </td>
                      <td class="th-act">
                        <button
                          :class="editingId === rc.id ? 'row-btn row-btn--close' : 'row-btn'"
                          @click.stop="editingId === rc.id ? closeEdit() : toggleEdit(rc)"
                        >{{ editingId === rc.id ? '✕ Close' : '⌄ Edit' }}</button>
                      </td>
                    </tr>

                    <!-- Inline edit form -->
                    <tr v-if="editingId === rc.id" class="ef-row">
                      <td colspan="8">
                        <div class="ef-form">

                          <!-- Assign strip -->
                          <div v-if="selectedBC" class="assign-strip">
                            <div class="as-ref">
                              <code class="mono">{{ selectedBC.No }}</code>
                              <span>{{ selectedBC.Name }}</span>
                              <span class="as-chip">{{ selectedBC.Base_Unit_of_Measure }}</span>
                              <span class="as-chip as-chip--p">{{ numFmt(selectedBC.Unit_Price) }} UGX</span>
                            </div>
                            <div class="as-btns">
                              <button class="as-btn as-btn--fc" @click="assignFC">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                                Set as FC No.
                              </button>
                              <button class="as-btn as-btn--bw" @click="assignBW">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                                Set as BW No.
                              </button>
                              <button class="as-btn as-btn--both" @click="assignBoth">Set Both</button>
                            </div>
                          </div>
                          <div v-else class="assign-hint">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                            Select a BC resource in the right panel to enable the Assign buttons
                          </div>

                          <!-- Fields -->
                          <div class="ef-grid">
                            <div class="ef"><label class="ef-lbl">Ad Type</label><input v-model="editForm.ad_type" class="ef-inp" /></div>
                            <div class="ef ef--fc">
                              <label class="ef-lbl">Full Color No. <em class="lbl-tag lbl-tag--fc">FC</em></label>
                              <input v-model="editForm.full_color_no" class="ef-inp ef-inp--mono" />
                            </div>
                            <div class="ef ef--bw">
                              <label class="ef-lbl">Black Color No. <em class="lbl-tag lbl-tag--bw">BW</em></label>
                              <input v-model="editForm.black_color_no" class="ef-inp ef-inp--mono" />
                            </div>
                            <div class="ef"><label class="ef-lbl">Base UOM</label><input v-model="editForm.base_unit_of_measure" class="ef-inp ef-inp--mono" /></div>
                            <div class="ef"><label class="ef-lbl">Price FC</label><input v-model.number="editForm.price_fc" type="number" step="any" class="ef-inp ef-inp--num" placeholder="0" /></div>
                            <div class="ef"><label class="ef-lbl">Price BW</label><input v-model.number="editForm.price_bw" type="number" step="any" class="ef-inp ef-inp--num" placeholder="0" /></div>
                            <div class="ef"><label class="ef-lbl">Size / Dimension</label><input v-model="editForm.size_dimension" class="ef-inp" /></div>
                            <div class="ef"><label class="ef-lbl">Duration</label><input v-model="editForm.duration" class="ef-inp" /></div>
                            <div class="ef"><label class="ef-lbl">Time Slot</label><input v-model="editForm.time_slot" class="ef-inp" /></div>
                            <div class="ef"><label class="ef-lbl">Currency</label><input v-model="editForm.currency" class="ef-inp ef-inp--mono" /></div>
                            <div class="ef"><label class="ef-lbl">Effective Date</label><input v-model="editForm.effective_date" type="date" class="ef-inp" /></div>
                            <div class="ef"><label class="ef-lbl">Expiry Date</label><input v-model="editForm.expiry_date" type="date" class="ef-inp" /></div>
                            <div class="ef"><label class="ef-lbl">Surcharge %</label><input v-model.number="editForm.surcharge_percentage" type="number" step="0.01" class="ef-inp ef-inp--num" placeholder="0.00" /></div>
                          </div>

                          <div class="ef-actions">
                            <div class="ef-status">
                              <span v-if="updateSuccess && editingId === rc.id" class="ef-ok">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                                {{ updateSuccess }}
                              </span>
                              <span v-if="updateError && editingId === rc.id" class="ef-err">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/></svg>
                                {{ updateError }}
                              </span>
                            </div>
                            <div class="ef-btns">
                              <button class="btn btn--ghost btn--xs" @click="closeEdit" :disabled="isUpdating">Cancel</button>
                              <button class="btn btn--primary btn--xs" @click="saveEdit(rc.id)" :disabled="isUpdating">
                                <svg v-if="isUpdating" class="btn__spin btn__spin--xs" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" fill="none" stroke-width="2.5"/><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" fill="none" stroke-width="2.5"/></svg>
                                <span v-else>Save Changes</span>
                              </button>
                            </div>
                          </div>

                        </div>
                      </td>
                    </tr>

                  </template>
                </tbody>
              </table>
            </template>
          </div><!-- /rc-pane__body -->
        </div><!-- /rc-pane--left -->

        <!-- ══════════════════════════════════════════
             RIGHT PANE — BC Resources (UNCHANGED)
        ══════════════════════════════════════════ -->
        <div class="rc-pane rc-pane--right">

          <div class="rc-pane__head">
            <div class="pane-title-row">
              <div>
                <div class="pane-title">
                  BC Resources
                  <span v-if="bcLoaded" class="rc-chip rc-chip--bc">{{ bcResources.length.toLocaleString() }}</span>
                </div>
                <div class="pane-sub">Click a row to select it as reference. Then edit a rate card on the left and use Assign.</div>
              </div>
              <button class="btn btn--primary btn--sm" @click="loadBCResources" :disabled="isLoadingBC">
                <svg v-if="isLoadingBC" class="btn__spin btn__spin--xs" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" fill="none" stroke-width="2.5"/><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" fill="none" stroke-width="2.5"/></svg>
                <span v-else>{{ bcLoaded ? 'Reload' : 'Load' }}</span>
              </button>
            </div>

            <div class="pane-search-row">
              <div class="search-wrap" style="flex:1">
                <svg class="si" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                <input v-model="bcSearch" class="s-input" placeholder="Filter by No. or Name…" @input="bcPage = 1" />
                <button v-if="bcSearch" class="s-clear" @click="bcSearch = ''; bcPage = 1">×</button>
              </div>
              <span class="bc-count">{{ filteredBC.length.toLocaleString() }}</span>
            </div>

            <div v-if="bcLoaded && bcPageCount > 1" class="pane-pager">
              <button class="pg-btn" :disabled="bcPage <= 1" @click="bcPage--">‹ Prev</button>
              <span class="pg-info">Page {{ bcPage }} of {{ bcPageCount }}</span>
              <button class="pg-btn" :disabled="bcPage >= bcPageCount" @click="bcPage++">Next ›</button>
            </div>
          </div>

          <div class="rc-pane__body">

            <div v-if="isLoadingBC" class="pane-spinner"><div class="sp-ring"></div> Loading…</div>
            <div v-if="bcError" class="pane-err">{{ bcError }} <button @click="bcError = null">×</button></div>

            <div v-if="!bcLoaded && !isLoadingBC && !bcError" class="pane-empty">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
              <p>Click <strong>Load</strong> to fetch all BC resources.</p>
            </div>

            <template v-if="bcLoaded && !isLoadingBC">
              <div v-if="filteredBC.length === 0" class="pane-empty"><p>No resources match.</p></div>

              <table v-else class="dt">
                <thead>
                  <tr>
                    <th class="th-no">No.</th>
                    <th class="th-bcname">Name</th>
                    <th class="th-uom">UOM</th>
                    <th class="th-num r">Unit Price</th>
                    <th class="th-act"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(r, bcIdx) in pagedBC"
                    :key="r.No"
                    class="dt-row dt-row--bc"
                    :class="{
                      'dt-row--even': bcIdx % 2 === 1,
                      'dt-row--bc-on': selectedBC?.No === r.No
                    }"
                    @click="toggleSelectBC(r)"
                  >
                    <td class="th-no"><code class="mono mono--g">{{ r.No }}</code></td>
                    <td class="th-bcname ell" :title="r.Name">{{ r.Name }}</td>
                    <td class="th-uom">{{ r.Base_Unit_of_Measure }}</td>
                    <td class="th-num r mono-n">{{ numFmt(r.Unit_Price) }}</td>
                    <td class="th-act c">
                      <span v-if="selectedBC?.No === r.No" class="sel-check">✓</span>
                      <span v-else class="sel-arrow">→</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </template>
          </div><!-- /rc-pane__body -->
        </div><!-- /rc-pane--right -->

      </div><!-- /rc-workspace -->
    </div><!-- /rate_cards panel -->

    <!-- ═══════════════════════════════════════════════════════════════
         GENERAL PANEL (UNCHANGED)
    ═══════════════════════════════════════════════════════════════ -->
    <div v-show="activeTab === 'general'" class="settings-panel cs-panel">
      <div class="cs-body">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <h3>More settings coming soon</h3>
        <p>Additional configuration options will be available in a future update.</p>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useClientSync }   from '~/composables/useClientSync'
import { useRateCardSync } from '~/composables/useRateCardSync'

// ── Client sync ──────────────────────────────────────────────────────────
const { isLoading, syncResult, syncError, syncClientsFromBC, clearResults, formatDuration } = useClientSync()

// ── Rate card sync ───────────────────────────────────────────────────────
const {
  bcResources, isLoadingBC, bcError, bcLoaded, fetchBCResources,
  rateCards, rcMeta, isLoadingRC, rcError, fetchRateCards,
  isUpdating, updateError, updateSuccess, updateRateCardFields,
} = useRateCardSync()

// ── Tab ───────────────────────────────────────────────────────────────────
const activeTab = ref('clients')

// ── Client sync helpers (UNCHANGED) ─────────────────────────────────────
const previewSections = ref([
  {
    field: 'wouldInsert', label: 'Would Insert', cls: '', open: true,
    badgeCls: '', badgeText: 'New clients',
    headers: ['BC No.', 'Company Name', 'Phone', 'Contact Person'],
    cols: [i=>`<code>${i.bc_no}</code>`, i=>i.company_name, i=>i.phone||'—', i=>i.contact_person||'—']
  },
  {
    field: 'wouldUpdate', label: 'Would Update', cls: '', open: true,
    badgeCls: '', badgeText: 'To reactivate',
    headers: ['BC No.', 'Company Name', 'Status', 'Would Set Active'],
    cols: [i=>`<code>${i.bc_no}</code>`, i=>i.name, i=>`<span class="${i.currentStatus?.is_active?'st-a':'st-i'}">${i.currentStatus?.is_active?'Active':'Inactive'}</span>`, ()=>'<span class="st-a">Yes</span>']
  },
  {
    field: 'skipped', label: 'Skipped', cls: 'preview-section--warn', open: false,
    badgeCls: 'pb--warn', badgeText: 'Validation failed',
    headers: ['BC No.', 'Name', 'Reasons'],
    cols: [i=>`<code>${i.bc_no||'N/A'}</code>`, i=>i.name||'—', i=>(i.reasons||[]).map(r=>`<span class="reason-tag">${r}</span>`).join('')]
  },
  {
    field: 'errors', label: 'Errors', cls: 'preview-section--err', open: false,
    badgeCls: 'pb--err', badgeText: 'Processing failed',
    headers: ['BC No.', 'Name', 'Error'],
    cols: [i=>`<code>${i.bc_no||'N/A'}</code>`, i=>i.name||'—', i=>`<span class="err-t">${i.error}</span>`]
  },
])

const handleSync = async (insertNew) => {
  if (insertNew && !confirm('⚠️ LIVE sync will:\n- Set all existing clients inactive\n- Only reactivate clients found in BC\n- Create new clients\n\nContinue?')) return
  try {
    await syncClientsFromBC(insertNew)
    if (syncResult.value?.details) {
      previewSections.value[0].open = (syncResult.value.details.wouldInsert?.length || 0) > 0
      previewSections.value[1].open = (syncResult.value.details.wouldUpdate?.length || 0) > 0
    }
  } catch (e) { console.error(e) }
}

// ── BC Resources (UNCHANGED) ─────────────────────────────────────────────
const bcSearch   = ref('')
const bcPage     = ref(1)
const BC_PG      = 75
const selectedBC = ref(null)

const filteredBC  = computed(() => {
  const q = bcSearch.value.trim().toLowerCase()
  if (!q) return bcResources.value
  return bcResources.value.filter(r => r.No.toLowerCase().includes(q) || r.Name.toLowerCase().includes(q))
})
const bcPageCount = computed(() => Math.max(1, Math.ceil(filteredBC.value.length / BC_PG)))
const pagedBC     = computed(() => filteredBC.value.slice((bcPage.value - 1) * BC_PG, bcPage.value * BC_PG))

watch(bcSearch, () => { bcPage.value = 1 })

const loadBCResources = async () => { await fetchBCResources(); bcPage.value = 1 }
const toggleSelectBC  = (r) => { selectedBC.value = selectedBC.value?.No === r.No ? null : r }

// ── Rate Cards (UPDATED FOR STRAPI 5) ────────────────────────────────────
const rcSearch  = ref('')
const rcLoaded  = ref(false)
const editingId = ref(null)
const editForm  = ref({})

const doLoadRateCards = async (page = 1) => {
  await fetchRateCards({ page, pageSize: 50, search: rcSearch.value.trim() })
  rcLoaded.value = true
  closeEdit()
}

// Strapi 5: product is directly accessible, no .attributes nesting
const rcProduct = (rc) => {
  if (rc.product) {
    return rc.product.product_name || rc.product.name || '—'
  }
  return '—'
}

const isLinkedFC = (rc) => !!(selectedBC.value && rc.full_color_no === selectedBC.value.No)
const isLinkedBW = (rc) => !!(selectedBC.value && rc.black_color_no === selectedBC.value.No)

const toggleEdit = (rc) => {
  if (editingId.value === rc.id) { 
    closeEdit() 
    return 
  }
  editingId.value = rc.id
  updateError.value = null
  updateSuccess.value = null
  
  // Strapi 5: fields are directly on rc, not rc.attributes
  editForm.value = {
    ad_type:              rc.ad_type              ?? '',
    full_color_no:        rc.full_color_no        ?? '',
    black_color_no:       rc.black_color_no       ?? '',
    base_unit_of_measure: rc.base_unit_of_measure ?? '',
    price_fc:             rc.price_fc             ?? '',
    price_bw:             rc.price_bw             ?? '',
    size_dimension:       rc.size_dimension       ?? '',
    duration:             rc.duration             ?? '',
    time_slot:            rc.time_slot            ?? '',
    currency:             rc.currency             || 'UGX',
    effective_date:       rc.effective_date       ?? '',
    expiry_date:          rc.expiry_date          ?? '',
    surcharge_percentage: rc.surcharge_percentage ?? '',
  }
}

const closeEdit = () => { 
  editingId.value = null
  editForm.value = {}
}

// Assign BC No. to rate card fields
const assignFC = () => { 
  if (!selectedBC.value) return
  editForm.value.full_color_no = selectedBC.value.No
  editForm.value.base_unit_of_measure = selectedBC.value.Base_Unit_of_Measure
  editForm.value.price_fc = selectedBC.value.Unit_Price
}

const assignBW = () => { 
  if (!selectedBC.value) return
  editForm.value.black_color_no = selectedBC.value.No
  editForm.value.base_unit_of_measure = selectedBC.value.Base_Unit_of_Measure
  editForm.value.price_bw = selectedBC.value.Unit_Price
}

const assignBoth = () => { 
  assignFC()
  assignBW()
}

const saveEdit = async (id) => {
  const fields = {}
  for (const [k, v] of Object.entries(editForm.value)) {
    if (v !== '' && v !== null && v !== undefined) fields[k] = v
  }
  if (!Object.keys(fields).length) { 
    updateError.value = 'No values to save.' 
    return 
  }
  try {
    await updateRateCardFields(id, fields)
    // Update the local rate card object directly (Strapi 5 style)
    const idx = rateCards.value.findIndex(r => r.id === id)
    if (idx !== -1) {
      rateCards.value[idx] = { ...rateCards.value[idx], ...fields }
    }
    setTimeout(() => { 
      if (editingId.value === id) closeEdit() 
    }, 1600)
  } catch (_) { 
    // updateError set in composable 
  }
}

const numFmt = (v) => v != null ? new Intl.NumberFormat('en-UG').format(v) : '—'
</script>

<style scoped>
/* ── Base ──────────────────────────────────────────────────────────────── */
.settings-container { 
  padding: 0; 
  height: 100%;
  display: flex;
  flex-direction: column;
}

.settings-tabs {
  display: flex; gap: 2px;
  border-bottom: 1px solid #E2E8F0;
  padding: 0 0 0 20px;
  flex-shrink: 0;
}
.settings-tab {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 10px 15px; background: none; border: none;
  font-family: inherit; font-size: 12px; font-weight: 500; color: #64748B;
  cursor: pointer; border-bottom: 2px solid transparent; transition: all 130ms;
  white-space: nowrap;
}
.settings-tab:hover:not(:disabled) { color: #0F172A; background: #F8FAFC; }
.settings-tab--active { color: #003366; border-bottom-color: #003366; font-weight: 600; }
.settings-tab:disabled { opacity: 0.4; cursor: not-allowed; }
.tab-chip { font-size: 9px; font-weight: 700; padding: 1px 5px; background: #F1F5F9; color: #94A3B8; border-radius: 8px; }

.settings-panel { 
  padding: 16px 20px 20px; 
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

/* ── Buttons ────────────────────────────────────────────────────────────── */
.btn {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 7px 15px; font-size: 12px; font-weight: 600; font-family: inherit;
  border: 1px solid transparent; border-radius: 2px;
  cursor: pointer; transition: all 130ms; white-space: nowrap;
}
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.btn--primary   { background: #003366; color: #fff; }
.btn--primary:hover:not(:disabled)   { background: #004080; }
.btn--secondary { background: #fff; border-color: #CBD5E1; color: #1E293B; }
.btn--secondary:hover:not(:disabled) { background: #F8FAFC; border-color: #94A3B8; }
.btn--ghost { background: none; border-color: transparent; color: #64748B; }
.btn--ghost:hover:not(:disabled) { background: #F1F5F9; }
.btn--sm  { padding: 5px 12px; font-size: 11px; }
.btn--xs  { padding: 3px 9px; font-size: 11px; }
.btn__spin { animation: spin .7s linear infinite; width: 13px; height: 13px; }
.btn__spin--xs { width: 11px; height: 11px; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Client sync ─────────────────────────────────────────────────────────── */
.sync-header { margin-bottom: 14px; }
.sync-title  { font-size: 14px; font-weight: 700; color: #0F172A; margin: 0 0 3px; }
.sync-desc   { font-size: 11px; color: #64748B; margin: 0; line-height: 1.5; }
.sync-actions { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }

.s-alert { display: flex; align-items: center; gap: 7px; padding: 8px 12px; font-size: 11px; border-radius: 2px; margin-bottom: 14px; }
.s-alert--error   { background: #FFF5F5; border: 1px solid #FED7D7; border-left: 3px solid #E53E3E; color: #9B2C2C; }
.s-alert--success { background: #F0FDF4; border: 1px solid #BBF7D0; border-left: 3px solid #22C55E; color: #166534; }
.s-alert__x { margin-left: auto; background: none; border: none; font-size: 15px; cursor: pointer; opacity: .6; }

.summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 7px; margin-bottom: 16px; }
.summary-card { background: #fff; border: 1px solid #E8ECF0; border-radius: 2px; padding: 9px 8px; text-align: center; }
.sc-wide { grid-column: span 2; }
.sc-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: #94A3B8; margin-bottom: 3px; }
.sc-val   { font-size: 20px; font-weight: 700; color: #0F172A; font-family: monospace; }
.sc-val--dry { color: #F59E0B; }
.sc-hint  { font-size: 9px; color: #94A3B8; margin-top: 3px; }

.preview-section { margin-top: 10px; border: 1px solid #E8ECF0; border-radius: 2px; background: #fff; overflow: hidden; }
.preview-section--warn { border-left: 3px solid #F59E0B; }
.preview-section--err  { border-left: 3px solid #E53E3E; }
.preview-header { display: flex; align-items: center; gap: 6px; padding: 8px 11px; cursor: pointer; background: #F8FAFC; transition: background 130ms; }
.preview-header:hover { background: #F1F5F9; }
.preview-chevron { transition: transform .2s; }
.preview-chevron.rotated { transform: rotate(180deg); }
.preview-title  { font-size: 12px; font-weight: 600; color: #0F172A; margin: 0; }
.preview-badge  { font-size: 9px; font-weight: 700; padding: 1px 6px; background: #E0E7FF; color: #4338CA; border-radius: 8px; }
.pb--warn { background: #FEF3C7; color: #92400E; }
.pb--err  { background: #FEE2E2; color: #991B1B; }
.preview-body { overflow-x: auto; max-height: 300px; overflow-y: auto; }
.preview-table { width: 100%; border-collapse: collapse; font-size: 11px; }
.preview-table th { text-align: left; padding: 6px 9px; font-weight: 600; color: #475569; border-bottom: 1px solid #E8ECF0; background: #fff; position: sticky; top: 0; font-size: 10px; }
.preview-table td { padding: 5px 9px; border-bottom: 1px solid #EEF0F4; color: #334155; }
.preview-table tr:hover td { background: #F8FAFC; }
.preview-more { padding: 6px 9px; text-align: center; font-size: 10px; color: #94A3B8; background: #F8FAFC; border-top: 1px solid #E8ECF0; }
.reason-tag { display: inline-block; padding: 1px 4px; background: #FEF3C7; color: #92400E; border-radius: 2px; font-size: 9px; margin-right: 2px; }
.err-t  { color: #DC2626; font-family: monospace; font-size: 10px; }
.st-a { color: #15803D; font-weight: 500; }
.st-i { color: #DC2626; }

.empty-state { text-align: center; padding: 40px 16px; color: #64748B; }
.empty-state svg { display: block; margin: 0 auto 10px; opacity: .35; }
.empty-state p { font-size: 12px; margin: 0; }

/* ── Rate cards outer ───────────────────────────────────────────────────── */
.rc-outer { 
  padding-top: 12px; 
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

/* Context bar */
.ctx-bar {
  display: flex; align-items: center; justify-content: space-between; gap: 10px;
  padding: 7px 13px; background: #EEF4FF; border: 1px solid #C7DAFF;
  border-radius: 2px; margin-bottom: 10px; flex-wrap: wrap;
  flex-shrink: 0;
}
.ctx-bar__left  { display: flex; align-items: center; gap: 7px; flex-wrap: wrap; }
.ctx-bar__right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.ctx-pulse {
  width: 7px; height: 7px; background: #0055AA; border-radius: 50%; flex-shrink: 0;
  animation: pulse 2s ease-in-out infinite;
}
@keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.8)} }
.ctx-label { font-size: 11px; font-weight: 600; color: #1E3A5F; }
.ctx-no    { font-family: monospace; font-size: 11px; font-weight: 700; color: #0044AA; background: #D0E4FF; padding: 1px 5px; border-radius: 2px; }
.ctx-name  { font-size: 11px; color: #1E3A5F; }
.ctx-tag   { font-size: 10px; padding: 1px 6px; background: rgba(0,85,170,.1); color: #1E3A5F; border-radius: 10px; }
.ctx-tag--price { font-weight: 700; }
.ctx-hint  { font-size: 10px; color: #4A7AAA; font-style: italic; }
.ctx-clear { padding: 2px 8px; font-size: 10px; font-weight: 600; font-family: inherit; background: none; border: 1px solid #B3CEFF; border-radius: 2px; color: #0055AA; cursor: pointer; }
.ctx-clear:hover { background: rgba(0,85,170,.1); }

.ctx-fade-enter-active, .ctx-fade-leave-active { transition: opacity .2s, transform .2s; }
.ctx-fade-enter-from, .ctx-fade-leave-to { opacity: 0; transform: translateY(-4px); }

/* ── Two-pane workspace ──────────────────────────────────────────────────── */
.rc-workspace {
  display: flex; gap: 12px; align-items: stretch;
  flex: 1;
  min-height: 0;
}

.rc-pane {
  display: flex; flex-direction: column;
  border: 1px solid #DDE5EE; border-radius: 3px;
  background: #fff; min-width: 0; overflow: hidden;
}
.rc-pane--left  { flex: 63; }
.rc-pane--right { flex: 37; }

/* Pane header — does not scroll */
.rc-pane__head {
  flex-shrink: 0; background: #F6F9FC;
  border-bottom: 1px solid #DDE5EE; padding: 10px 12px 8px;
}
.pane-title-row {
  display: flex; align-items: flex-start; justify-content: space-between;
  gap: 8px; margin-bottom: 8px;
}
.pane-title {
  font-size: 12px; font-weight: 700; color: #003366;
  display: flex; align-items: center; gap: 6px;
}
.pane-sub { font-size: 10px; color: #64748B; margin-top: 2px; line-height: 1.4; }

.rc-chip     { font-size: 9px; font-weight: 700; padding: 1px 6px; background: #EEF4FF; color: #0055AA; border: 1px solid #C7DAFF; border-radius: 8px; }
.rc-chip--bc { background: #F0FDF4; color: #166534; border-color: #BBF7D0; }

.pane-search-row { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; }
.search-wrap { position: relative; flex: 1; min-width: 0; }
.si { position: absolute; left: 7px; top: 50%; transform: translateY(-50%); color: #94A3B8; pointer-events: none; }
.s-input {
  width: 100%; padding: 5px 22px 5px 24px;
  font-size: 11px; font-family: inherit;
  border: 1px solid #CBD5E1; border-radius: 2px;
  background: #fff; color: #0F172A; box-sizing: border-box;
  transition: border-color 120ms, box-shadow 120ms;
}
.s-input:focus { outline: none; border-color: #0066CC; box-shadow: 0 0 0 2px rgba(0,102,204,.1); }
.s-clear { position: absolute; right: 5px; top: 50%; transform: translateY(-50%); background: none; border: none; font-size: 13px; cursor: pointer; color: #94A3B8; padding: 0; }
.s-clear:hover { color: #475569; }
.bc-count { font-size: 10px; color: #94A3B8; white-space: nowrap; flex-shrink: 0; }

.pane-pager { display: flex; align-items: center; gap: 6px; }
.pg-btn { padding: 2px 7px; font-size: 11px; font-weight: 600; font-family: inherit; background: #fff; border: 1px solid #CBD5E1; border-radius: 2px; cursor: pointer; color: #475569; transition: background 120ms; }
.pg-btn:hover:not(:disabled) { background: #F1F5F9; }
.pg-btn:disabled { opacity: .4; cursor: not-allowed; }
.pg-info { font-size: 10px; color: #64748B; }

/* Pane scrollable body */
.rc-pane__body { flex: 1; overflow-y: auto; overflow-x: auto; min-height: 0; }

/* Pane states */
.pane-spinner { display: flex; align-items: center; gap: 7px; padding: 18px 12px; font-size: 11px; color: #64748B; }
.sp-ring { width: 14px; height: 14px; border: 2px solid #D1D9E0; border-top-color: #003366; border-radius: 50%; animation: spin .7s linear infinite; }
.pane-err { display: flex; align-items: center; gap: 7px; padding: 7px 11px; background: #FFF5F5; border-bottom: 1px solid #FED7D7; color: #9B2C2C; font-size: 11px; }
.pane-err button { margin-left: auto; background: none; border: none; cursor: pointer; font-size: 13px; opacity: .6; }
.pane-empty { text-align: center; padding: 28px 14px; color: #94A3B8; }
.pane-empty svg { display: block; margin: 0 auto 8px; opacity: .35; }
.pane-empty p { font-size: 11px; margin: 0; }
.pane-empty strong { color: #64748B; }

/* ── Data table ──────────────────────────────────────────────────────────── */
.dt { width: 100%; border-collapse: collapse; font-size: 11px; }
.dt thead { position: sticky; top: 0; z-index: 2; }
.dt th {
  text-align: left; padding: 6px 8px;
  font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em;
  color: #5A7A9A; background: #EEF3F8; border-bottom: 1px solid #DDE5EE; white-space: nowrap;
}
/* Rate card rows — alternating backgrounds */
.dt-row { cursor: pointer; transition: background 80ms; }
.dt-row td           { background: #FFFFFF; }              /* odd  rows — white */
.dt-row--even td     { background: #F4F7FA; }              /* even rows — very light blue-grey */
.dt-row:hover td     { background: #E8F0FA !important; }   /* hover — light blue tint */
.dt-row--open td     { background: #E0ECFF !important; border-top: 1px solid #C7DAFF; border-bottom: 1px solid #C7DAFF; } /* expanded */

/* Matching-code column highlight (when a BC resource is selected) */
.dt-row--match-fc .th-fc { background: #FFF8DC !important; }
.dt-row--match-bw .th-bw { background: #E8F5E9 !important; }

/* BC resources pane rows */
.dt-row--bc:hover td { background: #E8F4FF !important; }
.dt-row--bc-on td { background: #EEF4FF !important; }
.dt-row--bc-on td:first-child { border-left: 3px solid #0055AA; }

.dt td {
  padding: 7px 9px; border-bottom: 1px solid #E8ECF0;
  color: #334155; vertical-align: middle; white-space: nowrap;
}
.dt tbody tr:last-child td { border-bottom: none; }

/* Column widths — left pane: 8 columns */
.th-product{ min-width: 130px; max-width: 180px; }
.th-adtype { min-width: 110px; max-width: 150px; }
.th-size   { min-width: 90px; }
.th-num    { width: 88px; }
.th-fc     { width: 96px; }
.th-bw     { width: 96px; }
.th-act    { width: 72px; text-align: center; }
/* Right pane columns */
.th-no     { width: 86px; }
.th-bcname { max-width: 180px; overflow: hidden; text-overflow: ellipsis; }
.th-uom    { width: 60px; }
.ell       { overflow: hidden; text-overflow: ellipsis; }
.r         { text-align: right !important; }
.c         { text-align: center !important; }

.mono    { font-family: "IBM Plex Mono", monospace; font-size: 10px; font-weight: 600; color: #0055AA; background: #EEF4FF; padding: 1px 4px; border-radius: 2px; }
.mono--g { background: #EBF5EC; color: #155724; }
.mono-n  { font-family: "IBM Plex Mono", monospace; font-size: 11px; }
.pill    { font-family: "IBM Plex Mono", monospace; font-size: 10px; font-weight: 600; padding: 1px 4px; border-radius: 2px; }
.pill--fc{ background: #FFF9C4; color: #7B5E00; border: 1px solid #EDD800; }
.pill--bw{ background: #E8F5E9; color: #155724; border: 1px solid #A5D6A7; }
.dash    { color: #CBD5E1; }

.row-btn { padding: 3px 8px; font-size: 10px; font-weight: 600; font-family: inherit; background: #EEF4FF; border: 1px solid #C7DAFF; color: #0055AA; border-radius: 2px; cursor: pointer; transition: background 120ms; white-space: nowrap; }
.row-btn:hover { background: #D0E4FF; }
.row-btn--close { background: #FFF0F0; border-color: #FEC7C7; color: #991B1B; }
.row-btn--close:hover { background: #FFD7D7; }

.sel-check { font-size: 12px; font-weight: 700; color: #0055AA; display: block; text-align: center; }
.sel-arrow { font-size: 11px; color: #CBD5E1; display: block; text-align: center; transition: color 120ms; }
.dt-row--bc:hover .sel-arrow { color: #0055AA; }

/* ── Inline edit form ────────────────────────────────────────────────────── */
.ef-row td { background: #F0F6FF; border-bottom: 2px solid #C7DAFF; cursor: default; padding: 0; }
.ef-row:hover td { background: #F0F6FF; }
.ef-form { padding: 12px 13px 10px; }

/* Assign strip */
.assign-strip {
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
  padding: 7px 11px; border-radius: 2px; margin-bottom: 10px; flex-wrap: wrap;
  background: #EEF4FF; border: 1px solid #C7DAFF; font-size: 11px; color: #1E3A5F;
}
.as-ref   { display: flex; align-items: center; gap: 6px; flex: 1; flex-wrap: wrap; }
.as-chip  { font-size: 10px; padding: 1px 6px; background: rgba(0,85,170,.1); color: #1E3A5F; border-radius: 10px; }
.as-chip--p { font-weight: 700; }
.as-btns  { display: flex; gap: 5px; flex-shrink: 0; }
.as-btn {
  display: inline-flex; align-items: center; gap: 3px;
  padding: 3px 9px; font-size: 10px; font-weight: 700; font-family: inherit;
  border-radius: 2px; cursor: pointer; transition: all 120ms;
}
.as-btn--fc   { background: #FFF9C4; border: 1px solid #EDD800; color: #7B5E00; }
.as-btn--fc:hover { background: #F8EC00; }
.as-btn--bw   { background: #E8F5E9; border: 1px solid #A5D6A7; color: #155724; }
.as-btn--bw:hover { background: #C8E6C9; }
.as-btn--both { background: #F3F0FF; border: 1px solid #C4B5FD; color: #5B21B6; }
.as-btn--both:hover { background: #DDD6FE; }
.assign-hint {
  display: flex; align-items: center; gap: 6px;
  padding: 7px 11px; border-radius: 2px; margin-bottom: 10px;
  background: #F8FAFC; border: 1px dashed #CBD5E1; color: #94A3B8; font-size: 11px;
}

/* Edit fields */
.ef-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(148px, 1fr));
  gap: 7px 10px; margin-bottom: 9px;
}
.ef { display: flex; flex-direction: column; gap: 2px; }
.ef-lbl {
  font-size: 9px; font-weight: 700; text-transform: uppercase;
  letter-spacing: .04em; color: #64748B; display: flex; align-items: center; gap: 4px;
}
.lbl-tag      { font-size: 8px; font-weight: 700; padding: 0 3px; border-radius: 2px; font-style: normal; }
.lbl-tag--fc  { background: #FFF9C4; color: #7B5E00; border: 1px solid #EDD800; }
.lbl-tag--bw  { background: #E8F5E9; color: #155724; border: 1px solid #A5D6A7; }

.ef--fc .ef-inp { border-color: #EDD800; background: #FFFDE7; }
.ef--fc .ef-inp:focus { border-color: #D4A800; box-shadow: 0 0 0 2px rgba(212,168,0,.15); }
.ef--bw .ef-inp { border-color: #A5D6A7; background: #F1F8F2; }
.ef--bw .ef-inp:focus { border-color: #4CAF50; box-shadow: 0 0 0 2px rgba(76,175,80,.12); }

.ef-inp {
  padding: 4px 7px; font-size: 11px; font-family: inherit;
  border: 1px solid #CBD5E1; border-radius: 2px;
  background: #fff; color: #0F172A;
  transition: border-color 120ms, box-shadow 120ms;
}
.ef-inp:focus { outline: none; border-color: #0066CC; box-shadow: 0 0 0 2px rgba(0,102,204,.1); }
.ef-inp--mono { font-family: "IBM Plex Mono", monospace; font-size: 11px; }
.ef-inp--num  { font-family: "IBM Plex Mono", monospace; font-size: 11px; text-align: right; }

.ef-actions {
  display: flex; align-items: center; justify-content: space-between;
  padding-top: 8px; border-top: 1px solid #DDE5EE; gap: 8px; flex-wrap: wrap;
}
.ef-status { display: flex; align-items: center; gap: 5px; font-size: 11px; }
.ef-ok  { display: flex; align-items: center; gap: 4px; color: #166534; font-weight: 600; }
.ef-err { display: flex; align-items: center; gap: 4px; color: #991B1B; font-weight: 600; }
.ef-btns{ display: flex; align-items: center; gap: 5px; }

/* ── Coming soon ─────────────────────────────────────────────────────────── */
.cs-panel { display: flex; align-items: center; justify-content: center; min-height: 220px; }
.cs-body  { text-align: center; color: #64748B; }
.cs-body svg { display: block; margin: 0 auto 10px; opacity: .3; }
.cs-body h3  { margin: 0 0 5px; font-size: 14px; font-weight: 500; }
.cs-body p   { margin: 0; font-size: 11px; }
</style>