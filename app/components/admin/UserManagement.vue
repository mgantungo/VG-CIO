<!-- components/admin/UserManagement.vue -->
<template>
  <div class="um">

    <!-- ── Stats band ─────────────────────────────────────────────── -->
    <div class="um-stats">
      <div class="um-sc"><span class="um-sv">{{ stats.total }}</span><span class="um-sl">Total Users</span></div>
      <div class="um-sd"></div>
      <div class="um-sc um-sc--gn"><span class="um-sv">{{ stats.active }}</span><span class="um-sl">Active</span></div>
      <div class="um-sd"></div>
      <div class="um-sc um-sc--rd"><span class="um-sv">{{ stats.inactive }}</span><span class="um-sl">Inactive</span></div>
      <div class="um-sd"></div>
      <div class="um-sc um-sc--am"><span class="um-sv">{{ stats.admins }}</span><span class="um-sl">Administrators</span></div>
    </div>

    <!-- ── Toolbar ────────────────────────────────────────────────── -->
    <div class="um-toolbar">
      <div class="um-toolbar__left">
        <input
          v-model="search"
          type="text"
          class="um-input"
          placeholder="Search name or email…"
        />
        <select v-model="roleFilter" class="um-select">
          <option value="">All roles</option>
          <option v-for="r in VGAMS_ROLES" :key="r.value" :value="r.value">{{ r.label }}</option>
        </select>
        <select v-model="statusFilter" class="um-select">
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
      <div class="um-toolbar__right">
        <button class="um-refresh" @click="refresh" :disabled="loading" title="Refresh">
          <span v-html="ic.refresh" :class="{ 'um-spin': loading }"></span>
        </button>
        <button class="um-new-btn" @click="openCreate">
          <span v-html="ic.plus"></span> New User
        </button>
      </div>
    </div>

    <!-- ── Error banner ───────────────────────────────────────────── -->
    <div v-if="error" class="um-err">
      <span v-html="ic.warn"></span>
      <span>{{ error }}</span>
      <button @click="error = null">×</button>
    </div>

    <!-- ── Table ──────────────────────────────────────────────────── -->
    <div class="um-table-wrap">
      <table class="um-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Created</th>
            <th class="um-actions-h">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading && !filteredUsers.length">
            <td colspan="6" class="um-empty">Loading users…</td>
          </tr>
          <tr v-else-if="!filteredUsers.length">
            <td colspan="6" class="um-empty">No users match your filters.</td>
          </tr>
          <tr v-for="u in filteredUsers" :key="u.id" :class="{ 'um-row--self': isSelf(u) }">
            <td class="um-name">
              {{ u.name }}
              <span v-if="isSelf(u)" class="um-you">you</span>
              <span v-if="isProtected(u)" class="um-locked" title="Protected account — cannot be edited or deleted">
                <span v-html="ic.lock"></span>protected
              </span>
            </td>
            <td class="um-mono">{{ u.email }}</td>
            <td><span class="um-role" :class="roleClass(u.role)">{{ roleLabel(u.role) }}</span></td>
            <td>
              <span class="um-status" :class="u.isActive ? 'um-status--on' : 'um-status--off'">
                {{ u.isActive ? 'Active' : 'Inactive' }}
              </span>
            </td>
            <td class="um-mono um-date">{{ formatDate(u.createdAt) }}</td>
            <td class="um-actions">
              <button
                class="um-icon-btn"
                :class="{ 'um-icon-btn--disabled': isProtected(u) }"
                :disabled="isProtected(u)"
                title="Edit"
                @click="openEdit(u)"
              >
                <span v-html="ic.edit"></span>
              </button>
              <button
                v-if="u.isActive"
                class="um-icon-btn"
                :class="{ 'um-icon-btn--disabled': isLocked(u) }"
                :disabled="isLocked(u)"
                title="Deactivate"
                @click="handleDeactivate(u)"
              >
                <span v-html="ic.pause"></span>
              </button>
              <button
                v-else
                class="um-icon-btn"
                :class="{ 'um-icon-btn--disabled': isProtected(u) }"
                :disabled="isProtected(u)"
                title="Activate"
                @click="handleActivate(u)"
              >
                <span v-html="ic.play"></span>
              </button>
              <button
                class="um-icon-btn um-icon-btn--danger"
                :class="{ 'um-icon-btn--disabled': isLocked(u) }"
                :disabled="isLocked(u)"
                title="Delete"
                @click="confirmDelete(u)"
              >
                <span v-html="ic.trash"></span>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ═══════════════════════ CREATE / EDIT MODAL ═══════════════════════ -->
    <div v-if="showModal" class="um-modal-mask" @click.self="closeModal">
      <div class="um-modal">
        <div class="um-modal__head">
          <h3>{{ editTarget ? 'Edit User' : 'New User' }}</h3>
          <button class="um-modal__close" @click="closeModal">×</button>
        </div>

        <div class="um-modal__body">
          <div class="um-field">
            <label>Full Name</label>
            <input v-model="form.name" type="text" placeholder="e.g. Jane Namutebi" />
          </div>

          <div class="um-field">
            <label>Company Email</label>
            <input v-model="form.email" type="email" placeholder="jane.namutebi@newvision.co.ug" />
            <span class="um-hint">Must be a @newvision.co.ug address — access is authenticated against Active Directory, not a stored password.</span>
          </div>

          <div class="um-field">
            <label>Role</label>
            <select v-model="form.role">
              <option value="" disabled>Select a role…</option>
              <option v-for="r in VGAMS_ROLES" :key="r.value" :value="r.value">{{ r.label }}</option>
            </select>
          </div>

          <div class="um-field um-field--row">
            <label class="um-switch">
              <input type="checkbox" v-model="form.isActive" />
              <span class="um-switch__track"><span class="um-switch__thumb"></span></span>
              <span class="um-switch__label">{{ form.isActive ? 'Active' : 'Inactive' }}</span>
            </label>
          </div>

          <div v-if="formError" class="um-form-err">{{ formError }}</div>
        </div>

        <div class="um-modal__foot">
          <button class="um-btn-ghost" @click="closeModal">Cancel</button>
          <button class="um-btn-primary" :disabled="saving" @click="submitForm">
            {{ saving ? 'Saving…' : (editTarget ? 'Save Changes' : 'Create User') }}
          </button>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════ DELETE CONFIRM MODAL ═══════════════════════ -->
    <div v-if="deleteTarget" class="um-modal-mask" @click.self="deleteTarget = null">
      <div class="um-modal um-modal--sm">
        <div class="um-modal__head">
          <h3>Delete User</h3>
          <button class="um-modal__close" @click="deleteTarget = null">×</button>
        </div>
        <div class="um-modal__body">
          <p class="um-confirm-text">
            Delete <strong>{{ deleteTarget.name }}</strong> ({{ deleteTarget.email }})?
            This is permanent. If this account has linked adverts, payments, or
            workflow logs, deletion may fail — consider deactivating instead.
          </p>
        </div>
        <div class="um-modal__foot">
          <button class="um-btn-ghost" @click="deleteTarget = null">Cancel</button>
          <button class="um-btn-danger" :disabled="saving" @click="handleDelete">
            {{ saving ? 'Deleting…' : 'Delete Permanently' }}
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useVgamsUsers, VGAMS_ROLES, PROTECTED_EMAILS } from '~/composables/useVgamsUsers'
import { useAuth } from '~/composables/useAuth'

const auth = useAuth()

const {
  users, loading, error,
  loadUsers, createUser, updateUser, activateUser, deactivateUser, deleteUser,
} = useVgamsUsers()

// ── Filters ──────────────────────────────────────────────────────────────
const search       = ref('')
const roleFilter    = ref('')
const statusFilter  = ref('')

const filteredUsers = computed(() => {
  const q = search.value.trim().toLowerCase()
  return users.value.filter(u => {
    if (q && !(u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q))) return false
    if (roleFilter.value && u.role !== roleFilter.value) return false
    if (statusFilter.value === 'active' && !u.isActive) return false
    if (statusFilter.value === 'inactive' && u.isActive) return false
    return true
  })
})

const stats = computed(() => ({
  total:    users.value.length,
  active:   users.value.filter(u => u.isActive).length,
  inactive: users.value.filter(u => !u.isActive).length,
  admins:   users.value.filter(u => u.role === 'administrator').length,
}))

function refresh() { loadUsers().catch(() => {}) }

// ── Self-protection UI (mirrors server-side guard) ──────────────────────
function currentAdminEmail() {
  return (auth?.user?.value?.email || auth?.userEmail?.value || '').toLowerCase()
}
function isSelf(u) {
  return u.email?.toLowerCase() === currentAdminEmail()
}
function isProtected(u) {
  return PROTECTED_EMAILS.includes(u.email?.toLowerCase())
}
function isLocked(u) {
  return isSelf(u) || isProtected(u)
}

// ── Role display helpers ─────────────────────────────────────────────────
function roleLabel(value) {
  return VGAMS_ROLES.find(r => r.value === value)?.label || value
}
function roleClass(value) {
  return `um-role--${value}`
}
function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ── Create / Edit modal ──────────────────────────────────────────────────
const showModal  = ref(false)
const editTarget = ref(null)
const saving     = ref(false)
const formError  = ref('')
const form = ref({ name: '', email: '', role: '', isActive: true })

function openCreate() {
  editTarget.value = null
  form.value = { name: '', email: '', role: '', isActive: true }
  formError.value = ''
  showModal.value = true
}

function openEdit(u) {
  if (isProtected(u)) return
  editTarget.value = u
  form.value = { name: u.name, email: u.email, role: u.role, isActive: u.isActive }
  formError.value = ''
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editTarget.value = null
}

async function submitForm() {
  formError.value = ''

  if (!form.value.name?.trim() || !form.value.email?.trim() || !form.value.role) {
    formError.value = 'Name, email, and role are required.'
    return
  }

  saving.value = true
  try {
    if (editTarget.value) {
      await updateUser(editTarget.value.id, {
        name: form.value.name,
        email: form.value.email,
        role: form.value.role,
        isActive: form.value.isActive,
      })
    } else {
      await createUser({
        name: form.value.name,
        email: form.value.email,
        role: form.value.role,
        isActive: form.value.isActive,
      })
    }
    closeModal()
    await refresh()
  } catch (e) {
    formError.value = e?.data?.error?.message || e?.message || 'Something went wrong.'
  } finally {
    saving.value = false
  }
}

// ── Activate / Deactivate ────────────────────────────────────────────────
async function handleDeactivate(u) {
  if (isLocked(u)) return
  try { await deactivateUser(u.id) } catch (e) { /* surfaced via composable `error` */ }
}
async function handleActivate(u) {
  if (isProtected(u)) return
  try { await activateUser(u.id) } catch (e) { /* surfaced via composable `error` */ }
}

// ── Delete ────────────────────────────────────────────────────────────────
const deleteTarget = ref(null)
function confirmDelete(u) {
  if (isLocked(u)) return
  deleteTarget.value = u
}
async function handleDelete() {
  if (!deleteTarget.value) return
  saving.value = true
  try {
    await deleteUser(deleteTarget.value.id)
    deleteTarget.value = null
  } catch (e) {
    // composable sets `error`; keep modal open so the user sees the banner isn't enough —
    // surface inline instead
  } finally {
    saving.value = false
  }
}

// ── Icons ─────────────────────────────────────────────────────────────────
const ic = {
  plus:    `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
  edit:    `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
  trash:   `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>`,
  pause:   `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`,
  play:    `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polygon points="5 3 19 12 5 21 5 3"/></svg>`,
  refresh: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>`,
  warn:    `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  lock:    `<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>`,
}

onMounted(() => { refresh() })
</script>

<style scoped>
.um {
  --nv: #003366; --nvd: #002244; --nvl: #004080;
  --rd: #C0181E;
  --bl: #0066CC; --bll: #EEF4FF;
  --bdl: #E1E8ED; --sf: #fff; --pg: #F5F7F9;
  --t1: #1A2733; --t3: #6B7C8C; --t4: #97A6B3;
  --r: 3px; --sh: 0 1px 2px rgba(0,0,0,.04); --shm: 0 2px 8px rgba(0,0,0,.08);
  --t: .15s ease;
  font-family: 'IBM Plex Sans', -apple-system, sans-serif;
  color: var(--t1);
}
.um-mono { font-family: 'IBM Plex Mono', monospace; }

/* Stats band */
.um-stats { display: flex; background: var(--nv); border-bottom: 3px solid var(--nvd); }
.um-sc { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 14px 12px; gap: 3px; }
.um-sd { width: 1px; background: rgba(157,195,230,.15); flex-shrink: 0; }
.um-sv { font-size: 22px; font-weight: 700; color: #fff; font-family: 'IBM Plex Mono', monospace; line-height: 1; }
.um-sl { font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; color: rgba(255,255,255,.4); }
.um-sc--gn .um-sv { color: #A9D18E; }
.um-sc--rd .um-sv { color: #FF9E9E; }
.um-sc--am .um-sv { color: #FFCC00; }

/* Toolbar */
.um-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; padding: 14px 22px; background: var(--sf); border-bottom: 1px solid var(--bdl); }
.um-toolbar__left  { display: flex; gap: 8px; flex-wrap: wrap; }
.um-toolbar__right { display: flex; gap: 8px; align-items: center; }
.um-input, .um-select {
  height: 34px; padding: 0 10px; font-size: 12px; font-family: inherit;
  border: 1px solid var(--bdl); border-radius: var(--r); background: #fff; color: var(--t1);
}
.um-input { width: 220px; }
.um-input:focus, .um-select:focus { outline: none; border-color: var(--bl); box-shadow: 0 0 0 2px rgba(0,102,204,.1); }
.um-refresh {
  width: 34px; height: 34px; display: inline-flex; align-items: center; justify-content: center;
  border: 1px solid var(--bdl); background: #fff; color: var(--t3); border-radius: var(--r); cursor: pointer; transition: background var(--t);
}
.um-refresh:hover { background: var(--pg); }
.um-spin { display: inline-flex; animation: um-spin 0.8s linear infinite; }
@keyframes um-spin { to { transform: rotate(360deg); } }
.um-new-btn {
  display: inline-flex; align-items: center; gap: 7px; height: 34px; padding: 0 16px;
  background: var(--nv); color: #fff; border: none; border-radius: var(--r);
  font-family: inherit; font-size: 12px; font-weight: 600; cursor: pointer; transition: background var(--t);
}
.um-new-btn:hover { background: var(--nvl); }

/* Error banner */
.um-err {
  display: flex; align-items: center; gap: 8px; background: #FDECEC; border: 1px solid var(--rd);
  border-left: 4px solid var(--rd); padding: 10px 14px; font-size: 12px; color: #7A0E12; margin: 0;
}
.um-err button { margin-left: auto; background: none; border: none; font-size: 18px; cursor: pointer; color: #7A0E12; padding: 0; line-height: 1; }

/* Table */
.um-table-wrap { overflow-x: auto; background: var(--sf); }
.um-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.um-table thead th {
  text-align: left; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em;
  color: var(--t4); padding: 10px 16px; border-bottom: 2px solid var(--bdl); background: var(--pg); white-space: nowrap;
}
.um-actions-h { text-align: right; }
.um-table tbody td { padding: 11px 16px; border-bottom: 1px solid var(--bdl); vertical-align: middle; }
.um-table tbody tr:hover { background: #FAFCFD; }
.um-row--self { background: var(--bll); }
.um-name { font-weight: 600; color: var(--t1); }
.um-you { margin-left: 6px; font-size: 9px; font-weight: 700; text-transform: uppercase; color: var(--bl); background: #fff; border: 1px solid var(--bl); padding: 1px 5px; border-radius: 2px; }
.um-locked { margin-left: 6px; display: inline-flex; align-items: center; gap: 3px; font-size: 9px; font-weight: 700; text-transform: uppercase; color: var(--rd); background: #fff; border: 1px solid var(--rd); padding: 1px 5px; border-radius: 2px; }
.um-date { color: var(--t3); }
.um-empty { text-align: center; padding: 32px; color: var(--t4); font-size: 12px; }

.um-role {
  display: inline-block; font-size: 10px; font-weight: 600; padding: 3px 8px; border-radius: 2px;
  background: var(--pg); color: var(--t3); border: 1px solid var(--bdl); text-transform: capitalize;
}
.um-role--administrator      { background: #FFF7E6; color: #8A5A00; border-color: #FFCC00; }
.um-role--advertising_manager{ background: #FAF5FF; color: #7E22CE; border-color: #E9D5FF; }
.um-role--finance_team       { background: #F0FDF4; color: #166534; border-color: #BBF7D0; }
.um-role--design_house       { background: #FFF7ED; color: #C2410C; border-color: #FED7AA; }
.um-role--sub_editor         { background: #FFFBEB; color: #78350F; border-color: #FDE68A; }
.um-role--booking_clerk      { background: #EEF4FF; color: #0066CC; border-color: #BFDBFE; }
.um-role--sales_team         { background: #FDF2F8; color: #BE185D; border-color: #FBCFE8; }
.um-role--hr_team            { background: #ECFEFF; color: #0E7490; border-color: #A5F3FC; }
.um-role--invoicing_officer  { background: #F0FDF4; color: #14532D; border-color: #86D9A8; }

.um-status { display: inline-flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 600; }
.um-status::before { content: ''; width: 6px; height: 6px; border-radius: 50%; }
.um-status--on::before  { background: #16A34A; }
.um-status--off::before { background: var(--rd); }
.um-status--on  { color: #166534; }
.um-status--off { color: #7A0E12; }

.um-actions { text-align: right; white-space: nowrap; }
.um-icon-btn {
  width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center;
  border: 1px solid var(--bdl); background: #fff; color: var(--t3); border-radius: var(--r);
  cursor: pointer; margin-left: 5px; transition: background var(--t), color var(--t), border-color var(--t);
}
.um-icon-btn:hover { background: var(--bll); border-color: var(--bl); color: var(--bl); }
.um-icon-btn--danger:hover { background: #FDECEC; border-color: var(--rd); color: var(--rd); }
.um-icon-btn--disabled, .um-icon-btn[disabled] { opacity: .35; cursor: not-allowed; }
.um-icon-btn--disabled:hover, .um-icon-btn[disabled]:hover { background: #fff; border-color: var(--bdl); color: var(--t3); }

/* Modal */
.um-modal-mask {
  position: fixed; inset: 0; background: rgba(0,20,40,.45); z-index: 1000;
  display: flex; align-items: center; justify-content: center; padding: 20px;
}
.um-modal {
  width: 420px; max-width: 100%; background: #fff; border-radius: var(--r); box-shadow: 0 8px 32px rgba(0,0,0,.25);
  display: flex; flex-direction: column; max-height: 90vh;
}
.um-modal--sm { width: 380px; }
.um-modal__head { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid var(--bdl); }
.um-modal__head h3 { margin: 0; font-size: 14px; font-weight: 700; color: var(--nv); }
.um-modal__close { background: none; border: none; font-size: 20px; line-height: 1; color: var(--t3); cursor: pointer; }
.um-modal__body { padding: 18px 20px; overflow-y: auto; }
.um-modal__foot { display: flex; justify-content: flex-end; gap: 8px; padding: 14px 20px; border-top: 1px solid var(--bdl); }

.um-field { display: flex; flex-direction: column; gap: 5px; margin-bottom: 14px; }
.um-field label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; color: var(--t3); }
.um-field input, .um-field select {
  height: 36px; padding: 0 10px; font-size: 13px; font-family: inherit;
  border: 1px solid var(--bdl); border-radius: var(--r); color: var(--t1);
}
.um-field input:focus, .um-field select:focus { outline: none; border-color: var(--bl); box-shadow: 0 0 0 2px rgba(0,102,204,.1); }
.um-hint { font-size: 10px; color: var(--t4); line-height: 1.4; }

.um-field--row { flex-direction: row; align-items: center; }
.um-switch { display: inline-flex; align-items: center; gap: 8px; cursor: pointer; }
.um-switch input { display: none; }
.um-switch__track { width: 34px; height: 18px; background: var(--bdl); border-radius: 9px; position: relative; transition: background var(--t); }
.um-switch__thumb { position: absolute; top: 2px; left: 2px; width: 14px; height: 14px; border-radius: 50%; background: #fff; transition: transform var(--t); box-shadow: 0 1px 2px rgba(0,0,0,.2); }
.um-switch input:checked + .um-switch__track { background: #16A34A; }
.um-switch input:checked + .um-switch__track .um-switch__thumb { transform: translateX(16px); }
.um-switch__label { font-size: 12px; font-weight: 600; color: var(--t1); }

.um-form-err { margin-top: 4px; font-size: 12px; color: var(--rd); background: #FDECEC; border: 1px solid var(--rd); border-radius: var(--r); padding: 8px 10px; }
.um-confirm-text { font-size: 13px; line-height: 1.6; color: var(--t1); margin: 0; }

.um-btn-ghost, .um-btn-primary, .um-btn-danger {
  height: 36px; padding: 0 18px; border-radius: var(--r); font-family: inherit; font-size: 12px; font-weight: 600;
  cursor: pointer; border: none; transition: background var(--t);
}
.um-btn-ghost { background: #fff; border: 1px solid var(--bdl); color: var(--t3); }
.um-btn-ghost:hover { background: var(--pg); }
.um-btn-primary { background: var(--nv); color: #fff; }
.um-btn-primary:hover { background: var(--nvl); }
.um-btn-primary:disabled { opacity: .6; cursor: not-allowed; }
.um-btn-danger { background: var(--rd); color: #fff; }
.um-btn-danger:hover { background: #A31419; }
.um-btn-danger:disabled { opacity: .6; cursor: not-allowed; }

@media (max-width: 768px) {
  .um-toolbar { flex-direction: column; align-items: stretch; }
  .um-input { width: 100%; }
}
</style>