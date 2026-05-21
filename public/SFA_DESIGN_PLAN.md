# Sales Force Automation (SFA) Module — Design Plan
**Project:** VGAMS — Vision Group Advertising Management System  
**Stack:** Strapi 5 (CMS/API) · Nuxt 4 (Vue 3) · Pinia · IBM Plex design system  
**Date:** 2026-05-17  

---

## 0. Key Principles & Guard-Rails

| Rule | Detail |
|------|--------|
| **Visibility before conversion** | An opportunity is private to its creator (sales agent) and the agent's supervisor until it is converted to an order. Post-conversion it is visible to all authorised roles. |
| **Role hierarchy** | `sales_agent` → `supervisor` (unit-scoped) → `manager` (all units) → `admin` (system config) |
| **API pattern** | `const config = useRuntimeConfig(); const API_BASE = config.public.apiBase` — all fetch calls use this base. |
| **Design language** | IBM Plex Sans/Mono typography, navy `#003366` headers, `#0F62FE` IBM-blue actions, `#F0F4FA` page background — consistent with existing system. |
| **Strapi 5** | Flat response shape (no nested `attributes`). Relations are populated via `?populate=*` or named populate objects. |

---

## 1. Role Model

```
admin
  └── manager                    (sees all units, all opportunities, all orders)
       └── supervisor             (sees own unit's opportunities + orders)
            └── sales_agent       (sees only own opportunities; all orders post-conversion)
```

### Role Enforcement Strategy

**Strapi side (backend)**
- Every content type that touches `sfa_opportunity` has a `createdByAgent` relation.
- Custom Strapi policies on each route check the caller's role (from JWT) and apply filters:
  - `sales_agent` → `filters[createdByAgent][id][$eq]=<userId>`
  - `supervisor` → `filters[createdByAgent][unit][supervisor][id][$eq]=<userId>` (same unit)
  - `manager`/`admin` → no filter
- For **orders** (post-conversion), all roles can read; write is still role-gated.

**Nuxt side (frontend)**
- Auth composable (`useAuth`) already reads role from localStorage/Pinia.
- SFA composable reads `auth.user.sfaRole` and sets query filters accordingly.
- UI panels conditionally rendered via `v-if="canApprove"`, `v-if="isManager"` etc.

---

## 2. Strapi 5 — Collections Schema

### 2.1 `sfa-unit`
Represents a sales team/unit.

| Field | Type | Notes |
|-------|------|-------|
| `name` | String (required) | e.g. "East Africa Digital" |
| `code` | String (unique) | Short identifier |
| `supervisor` | Relation → `plugin::users-permissions.user` (one) | The unit's supervisor |
| `agents` | Relation → `plugin::users-permissions.user` (many) | All agents in unit |

---

### 2.2 `sfa-agent-profile`
One-to-one extension of the system user, holds SFA-specific data.

| Field | Type | Notes |
|-------|------|-------|
| `user` | Relation → `users-permissions.user` (one, unique) | The linked system user |
| `unit` | Relation → `sfa-unit` (one) | Agent's team |
| `sfa_role` | Enum: `sales_agent`, `supervisor`, `manager`, `admin` | Role within SFA |
| `employee_code` | String | Optional HR ref |
| `is_active` | Boolean (default true) | |

---

### 2.3 `sfa-company`
Client companies.

| Field | Type | Notes |
|-------|------|-------|
| `name` | String (required) | |
| `business_model` | String | B2B / B2C / Gov / NGO etc. |
| `industry` | String | |
| `address` | Text | |
| `location` | String | City/region |
| `contacts` | Relation → `sfa-contact` (many) | People at this company |

---

### 2.4 `sfa-contact`
Individual contacts at client companies.

| Field | Type | Notes |
|-------|------|-------|
| `full_name` | String (required) | |
| `phone` | String | |
| `email` | Email | |
| `position` | String | Job title |
| `company` | Relation → `sfa-company` (one) | |

---

### 2.5 `sfa-buy-in`
Product/service catalogue (managed by Admin).

| Field | Type | Notes |
|-------|------|-------|
| `name` | String (required) | e.g. "Radio Advertisement Spot" |
| `category` | Enum: `radio_ads`, `tv_ads`, `billboard`, `website_ads`, `courier`, `printing`, `rig_truck`, `other` | |
| `description` | Text | |
| `base_price` | Decimal | Reference price |
| `unit` | String | e.g. "per spot", "per month" |
| `is_active` | Boolean (default true) | |

---

### 2.6 `sfa-opportunity`
The core entity. Heart of the module.

| Field | Type | Notes |
|-------|------|-------|
| `title` | String (required) | |
| `description` | Text | |
| `source` | String | Referral / Cold Call / Inbound etc. |
| `status` | Enum: `new`, `in_progress`, `quotation_sent`, `negotiation`, `won`, `lost` | Funnel stage |
| `expected_value` | Decimal | Estimated deal value |
| `expected_close_date` | Date | |
| `created_by_agent` | Relation → `plugin::users-permissions.user` (one) | The sales agent |
| `company` | Relation → `sfa-company` (one) | |
| `contacts` | Relation → `sfa-contact` (many) | People involved |
| `is_converted` | Boolean (default false) | Set true on order creation |
| `converted_at` | DateTime | |
| `funnel_stage` | Enum: `opportunity_created`, `contact_engaged`, `requirement_defined`, `quotation_created`, `quotation_sent`, `negotiation`, `approved`, `won`, `closed_lost` | More granular than `status` |

---

### 2.7 `sfa-opportunity-buy-in`
Junction table: which buy-ins are attached to an opportunity, with pricing details.

| Field | Type | Notes |
|-------|------|-------|
| `opportunity` | Relation → `sfa-opportunity` (one) | |
| `buy_in` | Relation → `sfa-buy-in` (one) | |
| `quantity` | Integer | |
| `unit_price` | Decimal | Negotiated price (may differ from base) |
| `subtotal` | Decimal | Computed: qty × unit_price |
| `notes` | Text | |
| `custom_offer` | Text | Free-form custom description |

---

### 2.8 `sfa-activity`
All communication and interaction logs per opportunity.

| Field | Type | Notes |
|-------|------|-------|
| `opportunity` | Relation → `sfa-opportunity` (one) | |
| `type` | Enum: `call`, `email`, `visit`, `meeting`, `internal_note` | |
| `activity_date` | DateTime (required) | When it happened |
| `summary` | Text (required) | What was discussed |
| `outcome` | Text | Result / next steps |
| `next_followup_date` | Date | |
| `logged_by` | Relation → `plugin::users-permissions.user` (one) | Who logged it |
| `attachments` | Media (multiple) | Optional files |

---

### 2.9 `sfa-quotation`
Versioned quotations per opportunity.

| Field | Type | Notes |
|-------|------|-------|
| `quotation_number` | String (unique, auto-generated) | Format: `QT-YYYYMM-XXXX` |
| `opportunity` | Relation → `sfa-opportunity` (one) | |
| `version` | Integer (default 1) | Increments on each revision |
| `status` | Enum: `draft`, `pending_approval`, `approved`, `sent_to_client`, `revised`, `rejected`, `accepted` | |
| `total_amount` | Decimal | |
| `notes` | Text | Internal notes |
| `submitted_by` | Relation → `plugin::users-permissions.user` (one) | Creator |
| `reviewed_by` | Relation → `plugin::users-permissions.user` (one) | Supervisor/Manager who acted |
| `reviewed_at` | DateTime | |
| `review_comment` | Text | Approval/rejection reason |
| `pdf_document` | Media (single) | Generated/uploaded PDF |
| `parent_quotation` | Relation → `sfa-quotation` (self, one) | Points to previous version |

---

### 2.10 `sfa-quotation-item`
Line items within a quotation.

| Field | Type | Notes |
|-------|------|-------|
| `quotation` | Relation → `sfa-quotation` (one) | |
| `buy_in` | Relation → `sfa-buy-in` (one) | |
| `description` | String | May override buy-in name |
| `quantity` | Integer | |
| `unit_price` | Decimal | |
| `subtotal` | Decimal | |
| `notes` | Text | |

---

### 2.11 `sfa-quotation-communication`
Tracks every send/response cycle for a quotation.

| Field | Type | Notes |
|-------|------|-------|
| `quotation` | Relation → `sfa-quotation` (one) | |
| `sent_at` | DateTime | |
| `channel` | Enum: `email`, `whatsapp`, `manual`, `other` | How it was sent |
| `sent_by` | Relation → `plugin::users-permissions.user` (one) | |
| `client_response` | Text | What client said |
| `response_date` | DateTime | |
| `negotiation_notes` | Text | |
| `attachments` | Media (multiple) | Email screenshot, reply scans |

---

### 2.12 `sfa-order`
An opportunity that has been won and converted. Visible to all.

| Field | Type | Notes |
|-------|------|-------|
| `order_number` | String (unique, auto-generated) | Format: `SFA-ORD-YYYYMM-XXXX` |
| `opportunity` | Relation → `sfa-opportunity` (one, unique) | Source opportunity |
| `accepted_quotation` | Relation → `sfa-quotation` (one) | The winning quotation version |
| `confirmation_type` | Enum: `lpo`, `email_confirmation`, `signed_quotation` | |
| `confirmation_document` | Media (multiple) | LPO, email export, signed PDF |
| `converted_date` | DateTime | |
| `converted_by` | Relation → `plugin::users-permissions.user` (one) | |
| `status` | Enum: `active`, `in_production`, `completed`, `cancelled` | |
| `notes` | Text | |

---

## 3. Strapi Custom Routes / Controllers (Summary)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/sfa-opportunities/my-board` | GET | Returns kanban board data filtered by caller's role |
| `/api/sfa-opportunities/:id/change-status` | PUT | Move opportunity through funnel |
| `/api/sfa-quotations/:id/submit-for-approval` | PUT | Agent submits → pending_approval |
| `/api/sfa-quotations/:id/approve` | PUT | Supervisor/Manager approves |
| `/api/sfa-quotations/:id/reject` | PUT | Supervisor/Manager rejects |
| `/api/sfa-quotations/:id/revise` | POST | Creates new version (increments version #) |
| `/api/sfa-orders/convert` | POST | Converts opportunity → order; sets `is_converted=true` |
| `/api/sfa-dashboard/my-stats` | GET | Per-agent stats (opportunities, pipeline value, follow-ups) |
| `/api/sfa-dashboard/management-stats` | GET | Manager-level aggregated stats |

---

## 4. Nuxt — File & Component Structure

```
pages/
  dashboard/
    sfa.vue                          # Main SFA page shell (layout: 'dashboard')

components/
  sfa/
    # ── Shell ────────────────────────────────────────────────────────
    SfaShell.vue                     # Sidebar + main-content wrapper
    SfaSidebar.vue                   # Left nav: views, stage legend, quick stats

    # ── Dashboard / Stats ─────────────────────────────────────────────
    SfaMyDashboard.vue               # Agent: my pipeline, follow-ups, quotation status
    SfaManagerDashboard.vue          # Manager: all units, funnel chart, team ranking

    # ── Opportunity Board (Kanban) ─────────────────────────────────────
    SfaKanbanView.vue                # Scrollable kanban shell
    SfaKanbanColumn.vue              # Single funnel stage column
    SfaOpportunityCard.vue           # Compact card in column

    # ── Opportunities List (Table) ─────────────────────────────────────
    SfaOpportunitiesTable.vue        # Filterable table of all visible opportunities

    # ── Opportunity Create / Edit ──────────────────────────────────────
    SfaNewOpportunityModal.vue       # Step-form: Basic → Company → Buy-ins → Submit
    SfaOpportunityDetailDrawer.vue   # Right-side drawer: full detail + actions

    # ── Company & Contact ─────────────────────────────────────────────
    SfaCompanySearchCreate.vue       # Inline search-or-create company
    SfaContactList.vue               # Contacts attached to an opportunity
    SfaContactForm.vue               # Add/edit a contact

    # ── Buy-ins ───────────────────────────────────────────────────────
    SfaBuyInSelector.vue             # Multi-select buy-ins with qty/price inline
    SfaBuyInLineItem.vue             # Single buy-in row (editable)

    # ── Activity Log ─────────────────────────────────────────────────
    SfaActivityTimeline.vue          # Chronological activity list
    SfaActivityLogModal.vue          # Log new call/email/visit/meeting/note

    # ── Quotations ────────────────────────────────────────────────────
    SfaQuotationList.vue             # All versions for an opportunity
    SfaQuotationForm.vue             # Create/edit quotation (items + totals)
    SfaQuotationCard.vue             # Compact version card
    SfaQuotationApprovalModal.vue    # Supervisor: approve / reject / comment
    SfaQuotationSendModal.vue        # Record that quotation was sent + channel
    SfaQuotationCommunicationLog.vue # All send/response records for a quotation

    # ── Order Conversion ─────────────────────────────────────────────
    SfaConvertToOrderModal.vue       # Upload LPO/confirmation, set type, convert
    SfaOrdersTable.vue               # Post-conversion orders (visible to all roles)
    SfaOrderDetailDrawer.vue         # Order detail (read-heavy)

    # ── Analytics ────────────────────────────────────────────────────
    SfaFunnelChart.vue               # SVG/CSS horizontal funnel visualisation
    SfaAnalyticsDashboard.vue        # Charts: win rate, avg cycle, revenue forecast

    # ── Shared UI ────────────────────────────────────────────────────
    SfaStatusBadge.vue               # Reusable coloured badge
    SfaEmptyState.vue                # Empty state with CTA

composables/
  useSfa.js                          # Auth role helpers + shared reactive state
  useSfaOpportunities.js             # CRUD + board fetch for opportunities
  useSfaQuotations.js                # Quotation lifecycle
  useSfaOrders.js                    # Order conversion + fetch
  useSfaDashboard.js                 # Stats endpoints
  useSfaCompanies.js                 # Company + contact management
  useSfaBuyIns.js                    # Buy-in catalogue
```

---

## 5. Funnel Stage → Kanban Column Mapping

| Column ID | Label | Color | Allowed Transitions |
|-----------|-------|-------|---------------------|
| `opportunity_created` | New | `#4589FF` | → `contact_engaged` |
| `contact_engaged` | Contacted | `#33B1FF` | → `requirement_defined` |
| `requirement_defined` | Qualified | `#08BDBA` | → `quotation_created` |
| `quotation_created` | Quotation Draft | `#9F7AEA` | → `quotation_sent` (after approval) |
| `quotation_sent` | Quotation Sent | `#F1C21B` | → `negotiation` |
| `negotiation` | Negotiation | `#FF7EB6` | → `approved` or `closed_lost` |
| `approved` | Won / Approved | `#24A148` | → Convert to Order |
| `closed_lost` | Closed Lost | `#C9252D` | Terminal |

**Visibility note:** All columns above are invisible to roles other than the creator and their supervisor/manager until the opportunity is converted. The `SfaOrdersTable` (post-conversion) is visible to all.

---

## 6. Composable API Pattern

```js
// composables/useSfaOpportunities.js
export function useSfaOpportunities() {
  const config   = useRuntimeConfig()
  const API_BASE = config.public.apiBase

  const opportunities = ref([])
  const board         = ref({})
  const counts        = ref({})
  const loading       = ref(false)
  const error         = ref(null)

  async function fetchBoard() {
    loading.value = true
    try {
      const res = await $fetch(`${API_BASE}/api/sfa-opportunities/my-board`)
      board.value  = res.board  || {}
      counts.value = res.counts || {}
    } catch (e) {
      error.value = e?.data?.error?.message || 'Failed to load board'
    } finally {
      loading.value = false
    }
  }

  async function createOpportunity(payload) {
    const res = await $fetch(`${API_BASE}/api/sfa-opportunities`, {
      method: 'POST',
      body: { data: payload }
    })
    await fetchBoard()
    return res
  }

  async function changeStatus(id, funnelStage) {
    const res = await $fetch(`${API_BASE}/api/sfa-opportunities/${id}/change-status`, {
      method: 'PUT',
      body: { funnel_stage: funnelStage }
    })
    await fetchBoard()
    return res
  }

  // ... more methods: update, logActivity, etc.

  return { opportunities, board, counts, loading, error,
           fetchBoard, createOpportunity, changeStatus }
}
```

---

## 7. Role-Aware Visibility in Components

```js
// composables/useSfa.js  — shared role helpers
export function useSfa() {
  const auth = useAuth()   // existing auth composable

  const sfaRole = computed(() => auth.user.value?.sfaRole || 'sales_agent')

  const isAgent      = computed(() => sfaRole.value === 'sales_agent')
  const isSupervisor = computed(() => sfaRole.value === 'supervisor')
  const isManager    = computed(() => ['manager', 'admin'].includes(sfaRole.value))
  const canApprove   = computed(() => isSupervisor.value || isManager.value)
  const canSeeAll    = computed(() => isManager.value)

  return { sfaRole, isAgent, isSupervisor, isManager, canApprove, canSeeAll }
}
```

In templates:
```html
<!-- Only supervisor/manager see approval actions -->
<SfaQuotationApprovalModal v-if="canApprove" ... />

<!-- Only manager sees all-units view -->
<SfaManagerDashboard v-if="isManager" />
<SfaMyDashboard      v-else />
```

---

## 8. New Opportunity — Multi-Step Form Flow

```
Step 1 — Basic Info
  Title, Description, Source, Expected Value, Expected Close Date

Step 2 — Company & Contacts
  Search existing company OR create new
  Add one or more contacts (with position, phone, email)

Step 3 — Buy-ins
  Multi-select from catalogue
  Set quantity + unit price per item
  Custom offer notes per item
  Running total shown

Step 4 — Review & Submit
  Summary of all data
  Submit → creates sfa-opportunity with funnel_stage = 'opportunity_created'
  Toast: "Opportunity #OPP-202505-0042 created"
```

---

## 9. Quotation Lifecycle Flow

```
[Agent] Creates quotation (Draft)
   │
   ▼
[Agent] Submits for approval → status: pending_approval
   │
   ▼
[Supervisor / Manager] Reviews
   ├── Approves → status: approved
   │     │
   │     ▼
   │   [Agent] Sends to client → status: sent_to_client
   │     │
   │     ▼
   │   [Agent] Logs client response
   │     ├── Client accepts → Convert to Order
   │     └── Client negotiates → Create Revision (new version, parent_quotation set)
   │
   └── Rejects → status: rejected (agent must revise)
         │
         ▼
       [Agent] Creates revision → new sfa-quotation record, version + 1
```

---

## 10. Order Conversion Flow

```
Opportunity status = 'approved' (client accepted quotation)
   │
   ▼
Agent clicks "Convert to Order"
→ SfaConvertToOrderModal opens
   - Select confirmation type (LPO / Email / Signed Quotation)
   - Upload confirmation document(s)
   - Add notes
   │
   ▼
POST /api/sfa-orders/convert
   - Creates sfa-order record
   - Sets sfa-opportunity.is_converted = true
   - Sets sfa-opportunity.status = 'won'
   │
   ▼
Opportunity disappears from private board
Order appears in SfaOrdersTable (visible to ALL roles)
```

---

## 11. Page Layout — `pages/dashboard/sfa.vue`

```
┌─────────────────────────────────────────────────────────────────────┐
│  SIDEBAR (220px)              │  MAIN CONTENT (flex-1)              │
│  ─────────────────────────── │  ─────────────────────────────────  │
│  ◈ SFA                        │  <Transition>                       │
│                               │    <SfaMyDashboard>       (home)   │
│  [Dashboard]  ←active         │    <SfaKanbanView>        (board)  │
│  [Board]                      │    <SfaOpportunitiesTable>(list)   │
│  [My Opportunities]           │    <SfaOrdersTable>       (orders) │
│  [Quotations]                 │    <SfaAnalyticsDashboard>(charts) │
│  [Orders]                     │  </Transition>                      │
│  [Analytics]                  │                                     │
│                               │                                     │
│  ── PIPELINE ──────────────   │                                     │
│  ● New              12        │                                     │
│  ● Contacted         8        │                                     │
│  ● Qualified         5        │                                     │
│  ● Quotation Draft   3        │                                     │
│  ● Quotation Sent    4        │                                     │
│  ● Negotiation       2        │                                     │
│  ● Won               7        │                                     │
│  ● Lost              3        │                                     │
│                               │                                     │
│  [+ New Opportunity]          │                                     │
│  ─────────────────────────── │                                     │
│  Mon 17 May 2026              │                                     │
│  Last sync: 09:42:11          │                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 12. Opportunity Detail Drawer Layout

```
┌──────────────────────────────────────────────────┐
│  OPP-202505-0042                        [×]      │
│  MTN Uganda — Digital Campaign Q3               │
│  [● In Progress]   [📋 Quotation]  [✓ Won]      │
├──────────────────────────────────────────────────┤
│  TABS: [Overview] [Activities] [Quotations]      │
├──────────────────────────────────────────────────┤
│  Overview Tab:                                   │
│  Company:    MTN Uganda                         │
│  Contacts:   John Doe (Marketing Mgr)           │
│  Value:      UGX 45,000,000                     │
│  Close Date: 30 Jun 2026                        │
│  Source:     Referral                           │
│                                                  │
│  Buy-ins:                                        │
│  ┌──────────────────────────────────────────┐   │
│  │ TV Advertisement (30s)    2 × 5,000,000  │   │
│  │ Radio Spot (60s)          10 × 500,000   │   │
│  │ Website Banner            1 × 2,000,000  │   │
│  │                    Total: 22,000,000     │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
│  [Log Activity]  [Create Quotation]             │
│  [Change Status] [Convert to Order ▸]           │
├──────────────────────────────────────────────────┤
│  Activities Tab:                                 │
│  ● Call — 15 May — "Discussed pricing…"         │
│  ● Email — 12 May — "Sent brief…"              │
│  ● Visit — 08 May — "Initial meeting"           │
├──────────────────────────────────────────────────┤
│  Quotations Tab:                                 │
│  QT-202505-0001 v3  [Accepted]  UGX 22,000,000 │
│  QT-202505-0001 v2  [Revised]   UGX 24,000,000 │
│  QT-202505-0001 v1  [Rejected]  UGX 28,000,000 │
└──────────────────────────────────────────────────┘
```

---

## 13. Dashboard Stats Cards (Agent View)

```
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  My Pipeline    │ │ Follow-ups Today│ │ Quotations Out  │ │ Won This Month  │
│   UGX 145M      │ │       3         │ │       4         │ │       2         │
│  14 active opps │ │  (overdue: 1)   │ │ (pending appr:2)│ │  UGX 38M value  │
└─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘
```

---

## 14. Implementation Sequence

### Phase 1 — Strapi Collections (Backend)
1. Create all 12 collections in Strapi admin UI
2. Set permissions per role (Public read on sfa-buy-in only; others require auth)
3. Write custom routes + controllers for:
   - `my-board` (role-filtered kanban data)
   - `change-status`
   - Quotation approval workflow
   - Order conversion

### Phase 2 — Composables (Data Layer)
4. `useSfa.js` — role helpers
5. `useSfaOpportunities.js` — board + CRUD
6. `useSfaQuotations.js` — full quotation lifecycle
7. `useSfaOrders.js` — conversion + fetch
8. `useSfaDashboard.js` — stats
9. `useSfaCompanies.js` + `useSfaBuyIns.js`

### Phase 3 — Core UI Components
10. `SfaSidebar.vue` + `SfaShell.vue`
11. `SfaKanbanView.vue` + `SfaKanbanColumn.vue` + `SfaOpportunityCard.vue`
12. `SfaNewOpportunityModal.vue` (4-step form)
13. `SfaOpportunityDetailDrawer.vue` (tabbed)
14. `SfaActivityTimeline.vue` + `SfaActivityLogModal.vue`

### Phase 4 — Quotation Flow
15. `SfaQuotationForm.vue` + `SfaQuotationCard.vue`
16. `SfaQuotationApprovalModal.vue`
17. `SfaQuotationSendModal.vue` + `SfaQuotationCommunicationLog.vue`

### Phase 5 — Order Conversion & Lists
18. `SfaConvertToOrderModal.vue`
19. `SfaOrdersTable.vue` + `SfaOrderDetailDrawer.vue`
20. `SfaOpportunitiesTable.vue` (list view)

### Phase 6 — Dashboard & Analytics
21. `SfaMyDashboard.vue`
22. `SfaManagerDashboard.vue`
23. `SfaFunnelChart.vue` + `SfaAnalyticsDashboard.vue`

### Phase 7 — Integration
24. `pages/dashboard/sfa.vue` page shell
25. Add SFA nav link to main app sidebar
26. Wire notifications (follow-up reminders, approval alerts)

---

## 15. Naming Conventions

| Concern | Convention | Example |
|---------|------------|---------|
| Strapi collection | kebab-case, `sfa-` prefix | `sfa-opportunity` |
| Strapi API endpoint | `/api/sfa-*` | `/api/sfa-quotations` |
| Vue component | PascalCase, `Sfa` prefix | `SfaKanbanColumn.vue` |
| Composable | camelCase, `useSfa` prefix | `useSfaOpportunities.js` |
| CSS class | BEM-like within scoped style | `.opp-card__header` |

---

## 16. nuxt.config.ts Addition Required

Ensure `apiBase` is exposed in `runtimeConfig.public`:

```ts
runtimeConfig: {
  public: {
    // ... existing keys ...
    apiBase: process.env.API_BASE,   // ← add this
  }
}
```

And in `.env`:
```
API_BASE=https://your-strapi-host.com
```

---

*End of Design Plan — ready to proceed to implementation phase by phase.*
