# Parking Lot

> **Purpose:** Ideas, features, and improvements that are NOT in the current phase. Captured here so they aren't forgotten — and don't derail the current phase.
>
> **Rules:**
> 1. Anything not in the current phase's definition of done goes here, not in the to-do list.
> 2. The Parking Lot is reviewed only at phase transitions, not mid-phase.
> 3. At each review, items are either: promoted to a future phase in `scope.md`, kept in the Parking Lot, or deleted.

---

## Format

Each item:
- **Title:** short name
- **Captured:** date
- **Trigger:** what conversation or moment led to this idea
- **Description:** one or two sentences
- **Potential phase:** which future phase this might belong to (or "unclear")

---

## Items

---

### App Service tier upgrade (Free → Basic/Standard) + add deployment slot

- **Captured:** 2026-04-27
- **Trigger:** D-010 + D-011. App Services on Free (F1) tier — sleeps apps, no slots, no custom-domain SSL.
- **Description:** Upgrade `ASP-rgMissIssippi-82e8` to Basic (B1, ~$13/mo) for always-on + custom domain, or Standard (S1, ~$70/mo) for slots + auto-scale. Standard unlocks the staging slot deferred per D-010.
- **Potential phase:** Before Phase 3 ships, at the latest.

---

### Salesperson role + RBAC UI

- **Captured:** 2026-04-20
- **Trigger:** D-005 minimal-auth scope.
- **Description:** Second user role (`salesperson`), invite/onboard flow, permission checks, per-resource access. Phase 2 reserves the seat in the data model; the UI/enforcement layer is deferred.
- **Potential phase:** Phase 3 or later — triggered when operator is ready to invite a salesperson.

---

### Retail / MSRP pricing

- **Captured:** 2026-04-20
- **Trigger:** `Item` has `CostPrice` + `WholesalePrice` but no retail price.
- **Description:** Add `RetailPrice` column (or per-channel pricebook) when e-commerce / retail channel becomes real.
- **Potential phase:** Year 2+.

---

### Per-customer pricing / volume discounts

- **Captured:** 2026-04-20
- **Trigger:** Apparel Expert flagged wholesale brands inevitably need this.
- **Description:** Price overrides per customer, volume tiers, key-account pricing.
- **Potential phase:** Year 2+.

---

### Offline-tolerant show-floor order entry

- **Captured:** 2026-04-20
- **Trigger:** Trade-show Wi-Fi is unreliable.
- **Description:** Order entry continues working when network is flaky.
- **Potential phase:** Phase 3 or 3.5.

---

### Mobile-phone-optimized UI

- **Captured:** 2026-04-20
- **Trigger:** D-009 scoped Year 1 to tablet-landscape and up.
- **Potential phase:** Post-Year 1.

---

### Barcode scanner for non-inventory flows

- **Captured:** 2026-04-20
- **Description:** Extend barcode scan workflow to PO receiving and pick tickets.
- **Potential phase:** Phase 4 or later.

---

### Email notifications & PDF generation

- **Captured:** 2026-04-20
- **Description:** Email invoices; generate PDF pick tickets; order confirmations. Requires background worker + template system.
- **Potential phase:** Phase 3 or 4.

---

### QuickBooks export / integration

- **Captured:** 2026-04-20
- **Description:** Export invoices/payments/customers to QB Online, or bidirectional sync.
- **Potential phase:** Phase 4 or 5.

---

### Reporting & dashboards beyond inventory

- **Captured:** 2026-04-20
- **Description:** Sales trends, stock turnover, A/R aging, cash flow. Dedicated reporting module.
- **Potential phase:** Year 2+.

---

### Full accounting suite (beyond basic A/R)

- **Captured:** 2026-04-20
- **Description:** Chart of accounts, journal entries, P&L, balance sheet. QB export is the right answer, not building this.
- **Potential phase:** Probably never.

---

### Multi-tenancy

- **Captured:** 2026-04-20
- **Description:** Tenant isolation for multiple brands on one deployment. Required before selling SaaS.
- **Potential phase:** Year 2+, before first external customer.

---

### Marketing automation / email campaigns

- **Captured:** 2026-04-20
- **Potential phase:** Probably never inside this product.

---

### Payroll

- **Captured:** 2026-04-20
- **Potential phase:** Never.

---

### Domain-specific UI components (defer until pattern emerges)

- **Captured:** 2026-04-27
- **Trigger:** D-013 + D-017. Don't build until 3+ pages need the same thing (Rule of Three).
- **Description:** Watch for: `<MoneyInput>`, `<SizeRunGrid>`, `<BatchTable>`. `<ColorChip>` / `<ColorSwatch>` already exists and survived migration ✅.
- **Potential phase:** Phase 3+ — when real repeated pattern emerges.

---

### Fix existing `main_mississippi-api.yml` deployment workflow

- **Captured:** 2026-04-27
- **Trigger:** Typo on publish-profile line — markdown link syntax accidentally pasted into YAML.
- **Description:** Replace `publish-profile: ${{ [secrets.AZURE](http://secrets.AZURE)_WEBAPP_PUBLISH_PROFILE }}` with the correct syntax. Will block API auto-deploy until fixed.
- **Potential phase:** Phase 2, before first significant API code push (during auth wiring Track B).

---

### Tighten lint enforcement at end of Phase 2

- **Captured:** 2026-04-27
- **Description:** Remove `continue-on-error: true` from CI lint step; lint failures should block merge.
- **Potential phase:** End of Phase 2.

---

### Path-filter the web deployment workflow

- **Captured:** 2026-04-27
- **Description:** Add `paths: - 'MissIssippiApp/**'` to `main_mississippi-web.yml` trigger.
- **Potential phase:** Phase 2 cleanup, low priority.

---

### Sync `MissIssippiDB/.sqlproj` and `Schema.md` when schema changes

- **Captured:** 2026-04-27
- **Description:** Standing reminder — every schema change (User table, Customer/SalesOrder later) requires both files updated.
- **Potential phase:** Standing — applies to every schema change.

---

### Reconcile `<PageFiltersBar>` with planned `<FilterBar>`

- **Captured:** 2026-04-27
- **Description:** CLAUDE.md §3.4 + DESIGN_SPEC.md §6 reference `<FilterBar>` but `<PageFiltersBar>` is what exists (used by 7 pages). Rename, move to `src/components/layout/FilterBar.tsx`, update imports.
- **Potential phase:** Phase 2 cleanup, before Phase 3 starts.

---

### Custom sort header pattern — document for reuse

- **Captured:** 2026-04-27
- **Description:** Document the custom sort pattern from Color List (clickable title + SortIndicator + sortStates + sortColumn handler + sortedColors useMemo) in DESIGN_SPEC.md or CLAUDE.md. Lower priority now that all migrations are done.
- **Potential phase:** Phase 2 doc cleanup.

---

### Two-file pattern per page (route wrapper + real component) — consolidate

- **Captured:** 2026-04-27
- **Description:** Every page has two files: a 5-line re-export wrapper + the real component. Consolidate into a single file at `src/pages/<Feature>/<Page>Page.tsx` per CLAUDE.md §4.1.
- **Potential phase:** Phase 2 cleanup or Phase 3 prep.

---

### Page size violations (refactor large pages)

- **Captured:** 2026-05-11
- **Trigger:** Audit found 7 pages exceed CLAUDE.md §1's ~100-line guidance.
- **Description:** Large offenders: `ColorList.tsx` (1,582), `ItemsColorsPage.tsx` (869), `InventoryUpload.tsx` (821), `inventoryView.tsx` (714), `SkuList.tsx` (708), `InventoryHistory.tsx` (514), `SizeList.tsx` (419), `SeasonList.tsx` (405), `InventoryLabels.tsx` (394). Extract business logic to hooks per CLAUDE.md §2. Each page is its own refactor session.
- **Potential phase:** Phase 3 prep. NOT bundled with Phase 2 cleanup.

---

### Rename `portal-theme.css` → `components.css`

- **Captured:** 2026-05-11
- **Description:** After token migration, file no longer contains "theme" tokens — only component CSS rules. Rename to `components.css` per DESIGN_SPEC §14, or split into `base.css` + `layout.css` + `components.css` + `utilities.css`.
- **Potential phase:** Phase 2 cleanup (Track H), low priority.

---

### Audit `portal-theme.css` for remaining orphans

- **Captured:** 2026-05-11
- **Description:** Session 2 deleted ~2,790 lines (7,668 → 4,878). Likely still contains some orphans missed by grep (dynamically-composed class names, ambiguous template literals). Final sweep after rename.
- **Potential phase:** End of Phase 2 (Track H).

---

### Direct DOM manipulation cleanup

- **Captured:** 2026-05-11
- **Trigger:** Audit found `document.getElementById("scan-sku-input")?.focus()` in InventoryScan.tsx:150; `document.createElement("textarea")` clipboard hack in ItemsColorsPage.tsx:128–133; 4× `setTimeout(() => ref.current?.focus(), 0)` patterns.
- **Description:** Replace `getElementById` focus with `useRef`. Replace textarea clipboard hack with `navigator.clipboard.writeText()`. Replace `setTimeout(...0)` focus with Ant Modal's `afterOpenChange` or `autoFocus` where possible.
- **Potential phase:** Phase 2 cleanup, low priority. Or Phase 3 prep.

---

### Data normalization in page files (CLAUDE.md violation)

- **Captured:** 2026-05-11
- **Description:** `normalizeSeasonRow` defined in `SeasonList.tsx` page file. Per CLAUDE.md §2.1, transformation belongs in a hook. Move to `useSeasonList.ts`.
- **Potential phase:** Phase 2 cleanup, low priority.

---

### Suspect packages — verify `react-bootstrap` and `bootswatch` are actually used

- **Captured:** 2026-05-11
- **Description:** No `react-bootstrap` component imports found in source. `bootswatch` may also be orphaned. Bootstrap utility classes (`text-muted`, `mb-2`, etc.) ARE used in TSX — investigate whether these packages provide those styles or can be removed.
- **Potential phase:** Phase 2 cleanup, low priority.

---

### Test harness: testcontainers-dotnet as future alternative to staging DB

- **Captured:** 2026-06-03
- **Trigger:** D-019. Staging DB chosen now; testcontainers noted as a future option if CI latency becomes a concern.
- **Description:** If xUnit test suite grows to 100+ tests and staging DB network latency measurably slows CI, evaluate `testcontainers-dotnet` (SQL Server container spun up per test run). No action until that threshold is reached.
- **Potential phase:** Phase 3+ — only if test count makes it necessary.

---

### Workflow improvement: easier Claude Project knowledge editing

- **Captured:** 2026-04-27
- **Description:** Operator manually edits project knowledge files between sessions. As docs evolve faster, this friction grows.
- **Potential phase:** Workflow concern, not project work. Address whenever.

---

## Review Log

### 2026-04-20 — end of Phase 1 kickoff
- Populated from Phase 1 conversations.

### 2026-04-27 — Phase 2 active session
- Added: App Service tier upgrade, Domain-specific UI components, CI workflow fixes, Schema sync reminder, Claude Project editing workflow

### 2026-04-27 — After Sub-Sessions 2A/2B/2C
- Added: Two-file pattern per page consolidation, portal-theme.css orphan audit

### 2026-04-27 — After Sub-Sessions 3A/3B
- Added: Reconcile PageFiltersBar/FilterBar, custom sort header documentation

### 2026-05-11 — After Foundation + Cleanup sessions ship
- **CLOSED:** Remove dead `<Toast>` JSX + `toastRef` from 14 pages ✅
- **CLOSED:** Audit portal-theme.css for orphans (first pass — 2,790 lines deleted) ✅ *(second pass remains open)*
- **CLOSED:** `page-filters-chips-inline` missing CSS bug ✅
- **CLOSED:** `unstyled` prop bug on Ant Button ✅
- **CLOSED:** PrimeReact removal (primereact, primeicons, primeflex, ActionButton, PrimeReactProvider, portal-passthrough.ts) ✅
- **CLOSED:** Token consolidation (`--pt-*` replaced with `--color-*` from index.css) ✅
- **CLOSED:** Form migration (17 files → Ant Input/Select) ✅
- **CLOSED:** Modal `destroyOnHidden` standardization ✅
- **CLOSED:** Toggle consolidation (Ant `<Segmented>`) ✅
- **CLOSED:** Empty state migration to Ant `<Empty>` ✅
- **CLOSED:** Inline style consolidation (shared classes) ✅
- **CLOSED:** `p-datatable-gridlines` class rename ✅
- **CLOSED:** Bootstrap utility classes orphan check (verified self-contained) ✅
- Added: Page size violations, Rename portal-theme.css, Direct DOM manipulation cleanup, Data normalization violation, Suspect packages

### 2026-06-03 — Track F start + doc backfill
- Added: testcontainers-dotnet as future CI alternative (from D-019)
- No items closed

---

*Last updated: 2026-06-03, Track F start.*
