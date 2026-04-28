# Phase 2 Spec — Foundation

> **Status:** Draft, finalized at end of Phase 1 kickoff (April 2026).
> **Owner:** Solo developer (you) + specialist team (Claude).
> **Goal of this document:** One place that defines *exactly* what Phase 2 ships, who owns what, and what is explicitly out of scope. Every Phase 2 decision gets checked against this.

---

## 1. Phase 2 Goal (One Sentence)

Build the technical, visual, and operational foundation — auth, shared front-end primitives, staging, tests, backups, design-spec conformance — so that every business module after Phase 2 (sales orders, customers, purchasing, invoicing, A/R) can be built **fast, safely, and consistently**.

---

## 2. Why This Phase Exists (Rationale)

Three observations from Phase 1 kickoff drove this phase:

1. **"Creating each page takes too long."** The existing app has good visual rules (DESIGN_SPEC.md) and good architecture rules (CLAUDE.md) but inconsistent *enforcement*. Every new page is hand-composed instead of assembled from shared primitives. If Year 1 adds 5 business modules on top of that, the pain compounds.
2. **No auth, no backups, no staging, no tests.** Any one of these is tolerable in a one-week-old internal prototype. All four, in an app that will hold real business data, is not.
3. **Year 1 business value depends on Phase 2 foundation.** Sales orders → POs → invoices is the value chain. None of it is safe to build on the current foundation.

Phase 2 is short, bounded, and non-negotiable before Phase 3 starts.

---

## 3. Definition of Done

Phase 2 is "shipped" when **all** of the following are true:

- [ ] Azure SQL backup configuration verified (PITR ≥ 14 days, LTR weekly/yearly optional)
- [ ] Staging environment live: second App Service slot + second Azure SQL DB
- [ ] Authentication working: Microsoft Entra ID login, single owner role, all API routes require auth, all UI routes require login
- [ ] `User` table exists with `role` column; `role='owner'` is seeded for you; `'salesperson'` role reserved but unused
- [ ] Every future-relevant record type has a `created_by_user_id` column ready (proven by the refactored Inventory reference module)
- [ ] Front-end primitives built, documented, and adopted: `<PageLayout>`, `<DataTable>`, `<Toolbar>`, `<FormField>`, `<Modal>`, `<Drawer>`, `<Button>`, `<Badge>`, `<FilterBar>`
- [ ] Inventory pages refactored to use only the new primitives — zero rule violations against DESIGN_SPEC.md
- [ ] DESIGN_SPEC conformance audit complete: list of violations in existing pages, each either fixed or logged as a Parking Lot item
- [ ] Automated test suite in place: ~10 integration tests on inventory API endpoints; test harness for front-end components ready (Vitest + React Testing Library configured; 2–3 sample tests)
- [ ] CI runs tests on every commit (GitHub Actions or Azure Pipelines, depending on what you're already using — whichever is free and easy)
- [ ] CLAUDE.md updated with Phase 2 additions: auth patterns, transaction boundaries, error handling conventions
- [ ] DESIGN_SPEC.md updated with any rules discovered during primitive extraction
- [ ] **Show-floor order entry wireframe produced** (paper or Figma; not built, just designed) — ready for Phase 3 review
- [ ] You have used the refactored Inventory pages in your real business for at least 3 working days without issue

> **Non-goal check:** Nothing in this list touches sales orders, customers, POs, invoices, or A/R logic. If any task starts to drift there, it goes to Parking Lot.

---

## 4. Deliverables

### 4.1 Infrastructure & Safety (highest urgency)

- **Backup verification.** Confirm PITR on Azure SQL. Increase retention to 14–30 days. Optionally enable LTR.
- **Staging environment.** Separate App Service deployment slot + separate Azure SQL DB (Basic tier is fine). Deploy the current app there first, prove it works, then make it the pre-production target for all future work.
- **Deployment pipeline.** A simple "merge to `main` → deploy to staging; manual approval → deploy to prod" flow. Don't over-engineer.

### 4.2 Authentication

- **Provider:** Microsoft Entra ID (formerly Azure AD). First-party, SSO, MFA-capable, already in your Azure ecosystem.
- **Backend:** ASP.NET Core Identity glued to Entra ID via the Microsoft.Identity.Web package. JWT-based for the SPA.
- **Roles:** One seeded role — `owner`. Second role `salesperson` defined in code but no user is assigned it yet.
- **Data model additions:**
  - `User` table (`UserId`, `EntraObjectId`, `Email`, `DisplayName`, `Role`, `Active`, `CreatedAt`)
  - Foreign key pattern `CreatedByUserId` ready for use on every future transactional table
- **Frontend:** Login screen, logout, "who's logged in" chip in topbar (you already have the avatar circle — we plug a real name into it).

### 4.3 Front-end primitives

Build **once, used everywhere.** Each primitive is a React/TSX component with a TypeScript interface and a one-page usage doc. Every primitive must visually conform to DESIGN_SPEC.md by construction.

| Primitive | Purpose | Replaces |
|---|---|---|
| `<PageLayout>` | Page header (white), canvas (grey), content slot | Hand-coded page shells on every page |
| `<PageHeader>` | h1 + subtitle + action buttons slot + optional stepper | Repeated header markup |
| `<Card>` | White rounded card with optional header band | Repeated card CSS |
| `<DataTable>` | Sortable, filterable, paginated table; supports column config, cell renderers, row actions | Inventory table, upload batches table, inventory history table |
| `<Toolbar>` / `<FilterBar>` | Search + filters + view toggle bar | The filter row you have on Inventory and elsewhere |
| `<FormField>` | Label + input + help + error | Ad-hoc form rows |
| `<Button>` | Primary / secondary / destructive variants, sizes | Scattered button implementations |
| `<Badge>` | Status badges (active/paid/pending/cancelled) | Inline spans |
| `<Modal>` / `<Drawer>` | Overlays for editing, confirmation, side details | Not built yet — needed for Phase 3 |
| `<SegmentedControl>` | The "List / Cards" or "Auto-scan / Manual" toggle pattern | Ad-hoc button groups |

### 4.4 Reference module: refactored Inventory

One complete feature (Inventory) refactored end-to-end to use the new primitives and strictly follow CLAUDE.md's layering. This becomes the **copy-from-this-when-you-build-a-new-module** example. Every future module (Sales Orders, Customers, etc.) uses this as its template.

### 4.5 Design spec conformance audit

A short markdown doc — `design-audit.md` — listing every deviation between existing pages and DESIGN_SPEC.md. Each deviation is either:
- **Fixed in Phase 2** (if small), or
- **Logged to Parking Lot** (if it's a bigger refactor — e.g., a page that needs rebuilding)

### 4.6 Testing foundation

- **Backend:** xUnit + WebApplicationFactory for integration tests. 10 tests covering the happiest paths of inventory endpoints (list, create, update qty, upload batch, undo).
- **Frontend:** Vitest + React Testing Library configured. 2–3 sample tests on `<DataTable>` and `<FormField>`. Convention established, not exhaustive coverage.
- **CI:** Tests run on every PR. Red means blocked.

### 4.7 Rule sheet updates

- **CLAUDE.md additions** (Architect will draft):
  - Auth/authorization pattern (where login check lives, where role check lives)
  - Transaction boundary pattern (services own transactions)
  - Error handling pattern (how errors flow from service → controller → hook → UI)
- **DESIGN_SPEC.md additions** (UX Designer will draft as discoveries arise):
  - Form error state rules (not currently in spec)
  - Loading state rules
  - Empty state rules
  - Anything else uncovered during primitive extraction

### 4.8 Show-floor order entry wireframe (parallel track)

Produced by the UX Designer during Phase 2, **not built**. A clickable Figma (or well-labeled paper scan, or HTML mockup) of:
- Salesperson / owner starts a new order for a customer
- Selects styles from the season catalog
- Enters size-run quantities per color per style
- Reviews and saves
- Works on laptop and tablet-landscape

Purpose: de-risk Phase 3. We learn what we got wrong *before* writing the code.

---

## 5. Specialist Responsibilities

| Specialist | Primary ownership in Phase 2 |
|---|---|
| **Product Manager** | Guards scope; ensures no Phase 3 work creeps in; logs decisions; updates `current-phase.md`, `parking-lot.md`, `decisions-log.md` |
| **Technical Architect** | Auth implementation plan; staging setup; CI pipeline; CLAUDE.md additions; reviews every primitive for architectural correctness |
| **UX/UI Designer** | Primitive visual specifications; design-audit.md; DESIGN_SPEC.md additions; show-floor wireframe |
| **Apparel Industry Expert** | Quiet in Phase 2 (no business logic being built). Reviews the show-floor wireframe when it's ready. |
| **Business/GTM Strategist** | Quiet in Phase 2. Will document the founding story (separate artifact) for future use. |
| **QA/Test Lead** | Test strategy doc; backup verification; defines what "works in real business for 3 days" means in practice; reviews CI setup |
| **You** | Build. Use the refactored inventory daily. Push back if something feels wrong. Don't skip ahead. |

---

## 6. Explicit Non-Goals (NOT in Phase 2)

These are *parked*, not forgotten. Every one of them has a legitimate claim on a future phase.

- ❌ Sales order module (any part)
- ❌ Customer/CRM module
- ❌ Purchase order / supplier module
- ❌ Invoicing or A/R
- ❌ Accounting, P&L, chart of accounts
- ❌ Reporting / dashboards beyond what inventory already has
- ❌ Salesperson role activation (the data column is reserved; the feature is not)
- ❌ Multi-tenancy of any kind
- ❌ Mobile-phone-optimized UI (tablet-landscape and up only)
- ❌ Offline-tolerant behavior (will be revisited when show-floor order entry is designed; not built in Phase 2)
- ❌ Per-customer pricing / volume discounts
- ❌ Retail price / MSRP column (add when ecommerce arrives)
- ❌ Barcode scanner workflow for non-inventory tasks
- ❌ Email notifications, PDF generation, any background job
- ❌ Full component library (e.g., shadcn, MUI). We build our own small primitives against our own spec.

Anything tempting in this list goes to `parking-lot.md`.

---

## 7. Estimated Duration

**Target:** 4–6 weeks of focused solo work.
**Ship gate, not calendar gate:** Phase 2 is done when the definition-of-done checklist is complete and you've used the refactored Inventory for 3 working days. If the calendar hits 6 weeks and you're not done, we have a conversation about what's taking longer than expected — we do not ship a half-done foundation.

Rough internal ordering (not commitments):
1. Week 1 — Backups, staging, CI scaffold, auth infrastructure
2. Week 2 — Auth front-to-back, primitive extraction begins
3. Week 3 — Primitives complete, Inventory refactor begins
4. Week 4 — Inventory refactor complete, audit, tests
5. Parallel throughout — show-floor wireframe, rule-sheet additions
6. Buffer — real-business usage before calling it done

---

## 8. Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Scope creep into Phase 3 ("just one sales order feature while I'm here") | High | PM enforces. Anything that isn't foundation goes to Parking Lot immediately. |
| Over-engineering primitives (building more than the app needs) | Medium | Rule: only build a primitive when the second page would need it. No speculative components. |
| Auth integration harder than expected (Entra ID + SPA + .NET) | Medium | Timebox auth to 1 week. If it's taking longer, Architect proposes fallback (ASP.NET Core Identity with email/password) without breaking scope. |
| DESIGN_SPEC conformance audit surfaces a bigger rebuild than expected | Medium | Default to "log to Parking Lot, don't fix in Phase 2" for any fix that takes more than a day. |
| You lose momentum because "nothing visible is shipping" | Medium-High | The refactored Inventory page is the visible ship. It should look *almost* identical to today but behave better. Psychological win. |
| Real-business data loss between now and backup config | Low-Medium | Config backups **this week**, before any Phase 2 code. |

---

## 9. Phase 3 Preview (for context only)

Phase 3 will be **Sales Orders + Customers** — the show-floor → pick-order → QuickBooks-killer workflow. The show-floor wireframe produced in Phase 2 will be its starting point. This is for context; nothing here is committed yet.

---

*End of Phase 2 spec.*
*Authored: end of Phase 1 kickoff, April 2026. Adjustments require a logged decision in `decisions-log.md`.*
