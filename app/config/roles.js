// app/config/roles.js
//
// Single source of truth for every VGAMS role in the frontend: display name,
// home route, pipeline step and the rail menu. RoleRail, the workspace topbar,
// login redirects and permission checks all read from here, so adding a role
// (e.g. invoicing_officer) is one entry instead of edits in three files.
//
// Stored role values are unchanged — sub_editor is shown as "Copy Desk".

export const PIPELINE_STEPS = [
  { step: 1, key: 'booked',    label: 'Booked' },
  { step: 2, key: 'placed',    label: 'Placed' },
  { step: 3, key: 'design',    label: 'In design' },
  { step: 4, key: 'artwork',   label: 'Artwork in' },
  { step: 5, key: 'invoiced',  label: 'Invoiced' },
]

// Rail item `when` keys are feature flags from runtimeConfig.public
// (see flagsFromConfig). An item without `when` always shows.
const REPORTS = {
  title: 'Reports',
  items: [
    { to: '/dashboard/reports/print-class', label: 'Display vs Classified', icon: 'chart' },
  ],
}

const CLERK_GROUP = {
  title: 'Bookings',
  items: [
    { to: '/dashboard/booking/new', label: 'New Booking', icon: 'plus', step: 1 },
    { to: '/dashboard/booking', label: 'My Bookings', icon: 'list', exact: true, step: 1, badge: 'drafts' },
  ],
}

const COPY_DESK_GROUP = {
  title: 'Copy Desk',
  items: [
    { to: '/dashboard/copy-desk', label: "Day's Layout", icon: 'layout', step: 2, badge: 'unplaced', when: 'copyDeskV2' },
    { to: '/dashboard/editor', label: 'Pager & Print Queue', icon: 'grid', step: 2 },
    { to: '/dashboard/review', label: 'Schedule Queue', icon: 'list', step: 2, legacyWhen: 'copyDeskV2' },
  ],
}

const DESIGN_GROUP = {
  title: 'Design House',
  items: [
    { to: '/dashboard/design', label: 'Design Queue', icon: 'pen', exact: true, step: 3, badge: 'notPlaced' },
  ],
}

const DESIGN_MANAGER_GROUP = {
  title: 'Design House',
  items: [
    { to: '/dashboard/design', label: 'Design Queue', icon: 'pen', exact: true, step: 3 },
    { to: '/dashboard/design/admin', label: 'Design Reports', icon: 'bar' },
  ],
}

const INVOICING_GROUP = {
  title: 'Invoicing',
  items: [
    { to: '/dashboard/invoicing', label: 'Invoicing Queue', icon: 'check', exact: true, step: 5, badge: 'ready' },
    { to: '/dashboard/invoicing/register', label: 'Invoice Register', icon: 'receipt', step: 5 },
  ],
}

const FINANCE_GROUP = {
  title: 'Finance',
  items: [
    { to: '/dashboard/finance', label: 'Finance Dashboard', icon: 'dollar', exact: true },
    { to: '/dashboard/finance/payments', label: 'Payment Collection', icon: 'card' },
  ],
}

const MANAGER_GROUP = {
  title: 'Management',
  items: [
    { to: '/dashboard/approval', label: 'Approvals', icon: 'tick' },
  ],
}

const ADMIN_GROUP = {
  title: 'System',
  items: [
    { to: '/dashboard/admin', label: 'Admin Hub', icon: 'settings' },
  ],
}

export const ROLES = {
  booking_clerk: {
    label: 'Booking Clerk',
    home: '/dashboard/booking',
    step: 1,
    legacyMenuKey: 'clerk',
    permissions: ['create_advert', 'view_adverts', 'edit_adverts', 'view_reports'],
    groups: [CLERK_GROUP, REPORTS],
  },
  sub_editor: {
    label: 'Copy Desk',
    home: '/dashboard/review',
    homeWhen: { copyDeskV2: '/dashboard/copy-desk' },
    step: 2,
    legacyMenuKey: 'editor',
    permissions: ['review_adverts', 'approve_adverts', 'assign_adverts', 'confirm_layout', 'view_reports'],
    groups: [COPY_DESK_GROUP, REPORTS],
  },
  design_house: {
    label: 'Design House',
    home: '/dashboard/design',
    step: 3,
    legacyMenuKey: 'design',
    permissions: ['view_attachments', 'upload_creatives', 'version_control', 'view_reports'],
    groups: [DESIGN_GROUP, REPORTS],
  },
  design_house_manager: {
    label: 'Design House Manager',
    home: '/dashboard/design',
    step: 3,
    legacyMenuKey: 'design',
    permissions: ['view_attachments', 'view_design_reports', 'view_reports'],
    groups: [DESIGN_MANAGER_GROUP, REPORTS],
  },
  invoicing_officer: {
    label: 'Invoicing Officer',
    home: '/dashboard/invoicing',
    step: 5,
    legacyMenuKey: 'invoicing',
    permissions: ['confirm_invoicing', 'create_invoices', 'view_financials', 'view_reports'],
    groups: [INVOICING_GROUP, REPORTS],
  },
  finance_team: {
    label: 'Finance Team',
    home: '/dashboard/finance',
    step: 5,
    legacyMenuKey: 'finance',
    permissions: ['process_payments', 'view_financials', 'generate_reports', 'confirm_invoicing', 'create_invoices', 'view_reports'],
    groups: [FINANCE_GROUP, INVOICING_GROUP, REPORTS],
  },
  advertising_manager: {
    label: 'Advertising Manager',
    home: '/dashboard/approval',
    step: null,
    legacyMenuKey: 'manager',
    permissions: ['approve_adverts', 'financial_oversight', 'view_reports'],
    groups: [MANAGER_GROUP, REPORTS],
  },
  administrator: {
    label: 'Administrator',
    home: '/dashboard/admin',
    step: null,
    legacyMenuKey: 'admin',
    permissions: ['manage_users', 'system_settings', 'all_permissions'],
    groups: [ADMIN_GROUP, CLERK_GROUP, COPY_DESK_GROUP, DESIGN_MANAGER_GROUP, INVOICING_GROUP, FINANCE_GROUP, REPORTS],
  },
}

/** Feature flags the rail and home routes depend on, from runtimeConfig.public. */
export function flagsFromConfig(publicConfig = {}) {
  const on = v => String(v || '').trim().toLowerCase() === 'on'
  return {
    workspaceShell: on(publicConfig.workspaceShell),
    copyDeskV2: on(publicConfig.copyDeskV2),
    productionGate: String(publicConfig.productionGate || 'paid').trim().toLowerCase(),
  }
}

export function roleConfig(role) {
  return ROLES[role] || null
}

export function roleLabel(role) {
  return ROLES[role]?.label || role || 'User'
}

export function roleHome(role, flags = {}) {
  const cfg = ROLES[role]
  if (!cfg) return '/dashboard'
  for (const [flag, path] of Object.entries(cfg.homeWhen || {})) {
    if (flags[flag]) return path
  }
  return cfg.home
}

/** Rail groups for a role with feature-flagged items resolved. */
export function railGroups(role, flags = {}) {
  const cfg = ROLES[role] || ROLES.booking_clerk
  const seen = new Set()
  return cfg.groups
    .map(group => ({
      title: group.title,
      items: group.items.filter(item => {
        if (item.when && !flags[item.when]) return false
        if (seen.has(`${group.title}|${item.to}`)) return false
        seen.add(`${group.title}|${item.to}`)
        return true
      }).map(item => ({
        ...item,
        label: item.legacyWhen && flags[item.legacyWhen] ? `${item.label} (legacy)` : item.label,
      })),
    }))
    .filter(group => group.items.length > 0)
}

/** Find the rail item (and its group) that matches a route path. */
export function matchRailItem(role, path, flags = {}) {
  const groups = railGroups(role, flags)
  let best = null
  for (const group of groups) {
    for (const item of group.items) {
      const hit = item.exact ? path === item.to : (path === item.to || path.startsWith(`${item.to}/`))
      if (hit && (!best || item.to.length > best.item.to.length)) best = { group, item }
    }
  }
  return best
}

export function roleCan(role, permission) {
  if (role === 'administrator') return true
  return (ROLES[role]?.permissions || []).includes(permission)
}

/** Old SideMenu.vue menu keys (clerk, editor, …) for the legacy shell. */
export function legacyMenuKey(role) {
  return ROLES[role]?.legacyMenuKey || 'clerk'
}
