<!-- ~/components/admin/Settings.vue -->
<template>
  <div class="settings-container">
    <!-- Tabs Navigation -->
    <div class="settings-tabs">
      <button 
        class="settings-tab" 
        :class="{ 'settings-tab--active': activeTab === 'clients' }"
        @click="activeTab = 'clients'"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
        Client Sync
      </button>
      <button 
        class="settings-tab" 
        :class="{ 'settings-tab--active': activeTab === 'general' }"
        @click="activeTab = 'general'"
        :disabled="true"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H5.78a1.65 1.65 0 0 0-1.51 1 1.65 1.65 0 0 0 .33 1.82l.03.03A10 10 0 0 0 12 17.66a10 10 0 0 0 6.37-2.63z"/>
        </svg>
        General (Coming Soon)
      </button>
    </div>

    <!-- Client Sync Panel -->
    <div v-show="activeTab === 'clients'" class="settings-panel">
      
      <!-- Header -->
      <div class="sync-header">
        <div>
          <h2 class="sync-title">Business Central Client Sync</h2>
          <p class="sync-desc">
            Synchronize clients from Business Central to the VGAMS database. 
            This will mark inactive clients that no longer exist in BC and create new ones.
          </p>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="sync-actions">
        <button 
          class="btn btn--primary" 
          @click="handleSync(true)"
          :disabled="isLoading"
        >
          <svg v-if="isLoading" class="btn__spinner" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" fill="none" stroke-width="2"/>
            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" fill="none" stroke-width="2"/>
          </svg>
          <span v-else>Sync Now</span>
        </button>

        <button 
          class="btn btn--secondary" 
          @click="handleSync(false)"
          :disabled="isLoading"
        >
          Dry Run (Validate Only)
        </button>

        <button 
          v-if="syncResult"
          class="btn btn--ghost" 
          @click="clearResults"
        >
          Clear Results
        </button>
      </div>

      <!-- Error Display -->
      <div v-if="syncError" class="error-banner">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span>{{ syncError }}</span>
        <button @click="syncError = null" class="error-banner__close">×</button>
      </div>

      <!-- Results Display -->
      <div v-if="syncResult" class="results">
        <!-- Summary Cards -->
        <div class="summary-grid">
          <div class="summary-card">
            <div class="summary-card__label">Mode</div>
            <div class="summary-card__value" :class="{ 'mode-dry': !syncResult.summary?.insertMode || syncResult.summary?.insertMode === 'validate-only' }">
              {{ syncResult.summary?.insertMode === 'insert' ? 'Live Sync' : 'Dry Run' }}
            </div>
            <div class="summary-card__hint">
              {{ syncResult.summary?.insertMode === 'insert' ? 'Data was written to database' : 'No changes were made' }}
            </div>
          </div>

          <div class="summary-card">
            <div class="summary-card__label">Fetched</div>
            <div class="summary-card__value">{{ syncResult.summary?.fetched || 0 }}</div>
            <div class="summary-card__hint">Clients from BC</div>
          </div>

          <div class="summary-card">
            <div class="summary-card__label">Inserted</div>
            <div class="summary-card__value">{{ syncResult.summary?.inserted || 0 }}</div>
            <div class="summary-card__hint">New clients added</div>
          </div>

          <div class="summary-card">
            <div class="summary-card__label">Updated</div>
            <div class="summary-card__value">{{ syncResult.summary?.updated || 0 }}</div>
            <div class="summary-card__hint">Existing clients reactivated</div>
          </div>

          <div class="summary-card">
            <div class="summary-card__label">Skipped</div>
            <div class="summary-card__value">{{ syncResult.summary?.skipped || 0 }}</div>
            <div class="summary-card__hint">Validation failed</div>
          </div>

          <div class="summary-card">
            <div class="summary-card__label">Errors</div>
            <div class="summary-card__value">{{ syncResult.summary?.errors || 0 }}</div>
            <div class="summary-card__hint">Processing errors</div>
          </div>

          <div class="summary-card summary-card--wide">
            <div class="summary-card__label">Execution Time</div>
            <div class="summary-card__value">{{ formatDuration(syncResult.summary?.executionTimeMs) }}</div>
            <div class="summary-card__hint">Total sync duration</div>
          </div>
        </div>

        <!-- Insert Preview (for dry runs) -->
        <div v-if="syncResult.details?.wouldInsert?.length > 0" class="preview-section">
          <div class="preview-header" @click="showInsertPreview = !showInsertPreview">
            <svg class="preview-header__chevron" :class="{ rotated: showInsertPreview }" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
            <h3 class="preview-title">Would Insert ({{ syncResult.details.wouldInsert.length }})</h3>
            <span class="preview-badge">New clients ready for import</span>
          </div>
          <div v-show="showInsertPreview" class="preview-table-wrapper">
            <table class="preview-table">
              <thead>
                <tr><th>BC No.</th><th>Company Name</th><th>Phone</th><th>Contact Person</th></tr>
              </thead>
              <tbody>
                <tr v-for="(client, idx) in syncResult.details.wouldInsert.slice(0, 50)" :key="idx">
                  <td><code>{{ client.bc_no }}</code></td>
                  <td>{{ client.company_name }}</td>
                  <td>{{ client.phone }}</td>
                  <td>{{ client.contact_person || '—' }}</td>
                </tr>
              </tbody>
            </table>
            <div v-if="syncResult.details.wouldInsert.length > 50" class="preview-more">
              + {{ syncResult.details.wouldInsert.length - 50 }} more clients
            </div>
          </div>
        </div>

        <!-- Update Preview (for dry runs) -->
        <div v-if="syncResult.details?.wouldUpdate?.length > 0" class="preview-section">
          <div class="preview-header" @click="showUpdatePreview = !showUpdatePreview">
            <svg class="preview-header__chevron" :class="{ rotated: showUpdatePreview }" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
            <h3 class="preview-title">Would Update ({{ syncResult.details.wouldUpdate.length }})</h3>
            <span class="preview-badge">Existing clients to reactivate</span>
          </div>
          <div v-show="showUpdatePreview" class="preview-table-wrapper">
            <table class="preview-table">
              <thead>
                <tr><th>BC No.</th><th>Company Name</th><th>Current Status</th><th>Would Set Active</th></tr>
              </thead>
              <tbody>
                <tr v-for="(client, idx) in syncResult.details.wouldUpdate.slice(0, 50)" :key="idx">
                  <td><code>{{ client.bc_no }}</code></td>
                  <td>{{ client.name }}</td>
                  <td><span :class="{ 'status-inactive': !client.currentStatus?.is_active }">{{ client.currentStatus?.is_active ? 'Active' : 'Inactive' }}</span></td>
                  <td><span class="status-active">Yes</span></td>
                </tr>
              </tbody>
            </table>
            <div v-if="syncResult.details.wouldUpdate.length > 50" class="preview-more">
              + {{ syncResult.details.wouldUpdate.length - 50 }} more clients
            </div>
          </div>
        </div>

        <!-- Skipped Items -->
        <div v-if="syncResult.details?.skipped?.length > 0" class="preview-section preview-section--warning">
          <div class="preview-header" @click="showSkipped = !showSkipped">
            <svg class="preview-header__chevron" :class="{ rotated: showSkipped }" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
            <h3 class="preview-title">Skipped ({{ syncResult.details.skipped.length }})</h3>
            <span class="preview-badge preview-badge--warning">Validation failed</span>
          </div>
          <div v-show="showSkipped" class="preview-table-wrapper">
            <table class="preview-table">
              <thead>
                <tr><th>BC No.</th><th>Name</th><th>Skipped Reasons</th></tr>
              </thead>
              <tbody>
                <tr v-for="(item, idx) in syncResult.details.skipped" :key="idx">
                  <td><code>{{ item.bc_no || 'N/A' }}</code></td>
                  <td>{{ item.name || '—' }}</td>
                  <td>
                    <span v-for="(reason, ri) in item.reasons" :key="ri" class="reason-tag">
                      {{ reason }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Errors -->
        <div v-if="syncResult.details?.errors?.length > 0" class="preview-section preview-section--error">
          <div class="preview-header" @click="showErrors = !showErrors">
            <svg class="preview-header__chevron" :class="{ rotated: showErrors }" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
            <h3 class="preview-title">Errors ({{ syncResult.details.errors.length }})</h3>
            <span class="preview-badge preview-badge--error">Processing failed</span>
          </div>
          <div v-show="showErrors" class="preview-table-wrapper">
            <table class="preview-table">
              <thead>
                <tr><th>BC No.</th><th>Name</th><th>Error</th></tr>
              </thead>
              <tbody>
                <tr v-for="(item, idx) in syncResult.details.errors" :key="idx">
                  <td><code>{{ item.bc_no || 'N/A' }}</code></td>
                  <td>{{ item.name || '—' }}</td>
                  <td class="error-cell">{{ item.error }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Success Message (for live sync) -->
        <div v-if="syncResult.summary?.insertMode === 'insert' && syncResult.success" class="success-banner">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2" fill="none"/>
          </svg>
          <span>{{ syncResult.message }}</span>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="!isLoading && !syncError" class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
        <p>No sync has been performed yet</p>
        <p class="empty-state__hint">Click "Sync Now" to import clients from Business Central, or use "Dry Run" to preview changes without modifying the database.</p>
      </div>
    </div>

    <!-- General Settings Panel (placeholder) -->
    <div v-show="activeTab === 'general'" class="settings-panel coming-soon">
      <div class="coming-soon__content">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <h3>More settings coming soon</h3>
        <p>Additional configuration options will be available in future updates.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useClientSync } from '~/composables/useClientSync'

const { isLoading, syncResult, syncError, syncClientsFromBC, clearResults, formatDuration } = useClientSync()

// UI State
const activeTab = ref('clients')
const showInsertPreview = ref(true)
const showUpdatePreview = ref(true)
const showSkipped = ref(false)
const showErrors = ref(false)

const handleSync = async (insertNew) => {
  try {
    if (insertNew) {
      const confirmed = confirm(
        '⚠️ WARNING: This will perform a LIVE sync.\n\n' +
        '- All existing clients will be set to inactive\n' +
        '- Only clients found in Business Central will be marked active\n' +
        '- New clients will be created\n\n' +
        'Do you want to continue?'
      )
      if (!confirmed) return
    }
    
    await syncClientsFromBC(insertNew)
    
    // Auto-expand relevant sections based on results
    if (syncResult.value?.details) {
      showInsertPreview.value = syncResult.value.details.wouldInsert?.length > 0
      showUpdatePreview.value = syncResult.value.details.wouldUpdate?.length > 0
    }
  } catch (err) {
    // Error already handled by composable
    console.error('Sync failed:', err)
  }
}
</script>

<style scoped>
.settings-container {
  padding: 0;
}

/* Tabs */
.settings-tabs {
  display: flex;
  gap: 4px;
  border-bottom: 1px solid var(--bdl, #e2e8f0);
  margin-bottom: 24px;
  padding: 0 0 0 22px;
}

.settings-tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: none;
  border: none;
  font-size: 13px;
  font-weight: 500;
  color: var(--t3, #64748b);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all var(--t, 0.14s ease);
}

.settings-tab:hover:not(:disabled) {
  color: var(--t1, #0f172a);
  background: var(--bll, #f1f5f9);
}

.settings-tab--active {
  color: var(--nv, #003366);
  border-bottom-color: var(--nv, #003366);
}

.settings-tab:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Panel */
.settings-panel {
  padding: 0 22px 22px;
}

/* Sync Header */
.sync-header {
  margin-bottom: 24px;
}

.sync-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--t1, #0f172a);
  margin: 0 0 4px;
}

.sync-desc {
  font-size: 13px;
  color: var(--t3, #64748b);
  margin: 0;
  line-height: 1.5;
}

/* Action Buttons */
.sync-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 20px;
  font-size: 13px;
  font-weight: 600;
  border-radius: var(--r, 4px);
  cursor: pointer;
  transition: all var(--t, 0.14s ease);
  border: 1px solid transparent;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn--primary {
  background: var(--nv, #003366);
  color: white;
}

.btn--primary:hover:not(:disabled) {
  background: var(--nvl, #004080);
}

.btn--secondary {
  background: white;
  border-color: var(--bd, #cbd5e1);
  color: var(--t1, #0f172a);
}

.btn--secondary:hover:not(:disabled) {
  background: var(--pg, #f8fafc);
  border-color: var(--bl, #3b82f6);
}

.btn--ghost {
  background: none;
  border-color: transparent;
  color: var(--t3, #64748b);
}

.btn--ghost:hover:not(:disabled) {
  background: var(--bll, #f1f5f9);
  color: var(--t1, #0f172a);
}

.btn__spinner {
  animation: spin 0.7s linear infinite;
  width: 16px;
  height: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Error Banner */
.error-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-left: 4px solid #dc2626;
  padding: 12px 16px;
  border-radius: var(--r, 4px);
  margin-bottom: 24px;
  color: #991b1b;
  font-size: 13px;
}

.error-banner__close {
  margin-left: auto;
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #991b1b;
  padding: 0 4px;
}

/* Success Banner */
.success-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-left: 4px solid #22c55e;
  padding: 12px 16px;
  border-radius: var(--r, 4px);
  margin-top: 24px;
  color: #166534;
  font-size: 13px;
}

/* Summary Grid */
.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
  margin-bottom: 24px;
}

.summary-card {
  background: var(--sf, white);
  border: 1px solid var(--bdl, #e2e8f0);
  border-radius: var(--r, 4px);
  padding: 14px 12px;
  text-align: center;
}

.summary-card--wide {
  grid-column: span 2;
}

.summary-card__label {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--t4, #94a3b8);
  margin-bottom: 6px;
}

.summary-card__value {
  font-size: 28px;
  font-weight: 700;
  color: var(--t1, #0f172a);
  font-family: var(--mn, monospace);
  line-height: 1.2;
}

.summary-card__value.mode-dry {
  color: #f59e0b;
}

.summary-card__hint {
  font-size: 10px;
  color: var(--t4, #94a3b8);
  margin-top: 6px;
}

/* Preview Sections */
.preview-section {
  margin-top: 20px;
  border: 1px solid var(--bdl, #e2e8f0);
  border-radius: var(--r, 4px);
  background: var(--sf, white);
  overflow: hidden;
}

.preview-section--warning {
  border-left: 3px solid #f59e0b;
}

.preview-section--error {
  border-left: 3px solid #dc2626;
}

.preview-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  cursor: pointer;
  background: var(--pg, #f8fafc);
  transition: background var(--t);
}

.preview-header:hover {
  background: var(--bll, #f1f5f9);
}

.preview-header__chevron {
  transition: transform 0.2s ease;
}

.preview-header__chevron.rotated {
  transform: rotate(180deg);
}

.preview-title {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--t1, #0f172a);
}

.preview-badge {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 8px;
  background: #e0e7ff;
  color: #4338ca;
  border-radius: 12px;
}

.preview-badge--warning {
  background: #fef3c7;
  color: #92400e;
}

.preview-badge--error {
  background: #fee2e2;
  color: #991b1b;
}

.preview-table-wrapper {
  overflow-x: auto;
  max-height: 400px;
  overflow-y: auto;
}

.preview-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.preview-table th {
  text-align: left;
  padding: 10px 12px;
  background: var(--pg, #f8fafc);
  font-weight: 600;
  color: var(--t2, #334155);
  border-bottom: 1px solid var(--bdl, #e2e8f0);
  position: sticky;
  top: 0;
  background: var(--sf, white);
}

.preview-table td {
  padding: 8px 12px;
  border-bottom: 1px solid var(--bdl, #e2e8f0);
  color: var(--t2, #334155);
}

.preview-table tr:hover td {
  background: var(--bll, #f1f5f9);
}

.reason-tag {
  display: inline-block;
  padding: 2px 6px;
  background: #fef3c7;
  color: #92400e;
  border-radius: 3px;
  font-size: 10px;
  margin-right: 4px;
  margin-bottom: 2px;
}

.error-cell {
  color: #dc2626;
  font-family: var(--mn, monospace);
  font-size: 11px;
}

.status-active {
  color: #16a34a;
  font-weight: 500;
}

.status-inactive {
  color: #dc2626;
}

.preview-more {
  padding: 10px 12px;
  text-align: center;
  font-size: 11px;
  color: var(--t4, #94a3b8);
  background: var(--pg, #f8fafc);
  border-top: 1px solid var(--bdl, #e2e8f0);
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 48px 24px;
  color: var(--t3, #64748b);
}

.empty-state svg {
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state p {
  margin: 8px 0;
  font-size: 14px;
}

.empty-state__hint {
  font-size: 12px;
  opacity: 0.7;
}

/* Coming Soon */
.coming-soon {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

.coming-soon__content {
  text-align: center;
  color: var(--t3, #64748b);
}

.coming-soon__content svg {
  margin-bottom: 16px;
  opacity: 0.5;
}

.coming-soon__content h3 {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 500;
}

.coming-soon__content p {
  margin: 0;
  font-size: 13px;
}
</style>