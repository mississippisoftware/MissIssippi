# Current Phase

> **Purpose:** Living document showing exactly where we are right now. Update at the start and end of every working session. Refer to this *before* starting any task.

---

## Current Phase

**Phase number:** 2
**Phase name:** Foundation
**Started:** 2026-04-20 (planning) / 2026-04-27 (active work)
**Framework migration shipped:** 2026-05-11
**Target Phase 2 ship date:** 2026-06-08 to 2026-07-06 (6–10 week window per D-015; ships on definition-of-done)

---

## 🎉 MILESTONE — Phase 2 Framework Migration COMPLETE (2026-05-11)

After 14+ migration sessions plus two final Foundation/Cleanup sessions, the PrimeReact → Ant Design migration is **fully shipped**:

- ✅ Ant Design is the sole UI framework
- ✅ Single source of token truth (`index.css`)
- ✅ PrimeReact fully removed (`primereact`, `primeicons`, `primeflex` gone from `package.json`)
- ✅ All 12 pages migrated end-to-end (layouts + bodies + forms)
- ✅ Visual design system unified (no more divergent `#3ac47d` vs `#15a362` greens)
- ✅ ~2,790 orphan CSS lines deleted (`portal-theme.css` shrank from 7,668 → 4,878 lines)
- ✅ Empty states canonical (Ant `<Empty>`)
- ✅ Modal state canonical (`destroyOnHidden` everywhere)
- ✅ Toggle pattern canonical (Ant `<Segmented>`)
- ✅ Forms canonical (Ant `<Input>` / `<Select>` across 17 files)
- ✅ TypeScript: 0 errors. Production build: 3,156 modules, 0 errors.

This unblocks the remaining Phase 2 work (auth, tests, wireframe).

---

## Definition of Done

See `phase-2-spec.md` §3 for full list. Top-level summary:

**Done:**
- [x] Azure SQL backup verified (PITR 7d + LTR 12 weekly)
- [x] Staging Azure SQL DB live (`MississippiDB-Staging`)
- [x] CI workflow runs build + lint on every push
- [x] Microsoft Entra ID app registration complete (single tenant, SPA, scope `access_as_user`)
- [x] **CLAUDE.md updated** with Skinny Code Principle, Ant Design integration, Wrapper Rule, audit/persistence rules, ask-before-acting rule (Sections 1–8) **plus Section 0 — Operating Principles** added per D-018
- [x] **DESIGN_SPEC.md rewritten** to Booklytics-style identity (ConfigProvider authoritative)
- [x] **Ant Design installed and configured** with `ConfigProvider` at app root
- [x] **`<AppShell>` built and shipped**
- [x] **`<PageLayout>` built and shipped** (used on all 12 pages)
- [x] **All 12 pages migrated** from PrimeReact to Ant Design
- [x] **Legacy layout components deleted**: `<PageShell>`, `<CatalogPageLayout>`, `<PortalPageHeader>`, `<ActionButton>`, `<ViewToggle>`, `<UploadModal>`
- [x] **All PrimeReact runtime removed** from app code AND package.json
- [x] **130 `pi pi-*` icons migrated to `@ant-design/icons`**
- [x] **Toast type cleanup** (3 files)
- [x] **Token consolidation** — `--pt-*` system removed, all CSS rules consume `--color-*` / `--space-*` from `index.css`
- [x] **CSS orphan cleanup** (~2,790 lines deleted)
- [x] **Form migration** (17 files: raw `<input>` / `<select>` → Ant `<Input>` / `<Select>`)
- [x] **Modal standardization** (`destroyOnHidden` everywhere; zero `destroyOnClose` remaining)
- [x] **Empty state migration** to Ant `<Empty>` (10 files)
- [x] **Toggle consolidation** to Ant `<Segmented>` (5 files)
- [x] **Inline style violations** addressed (`modal-footer-actions`, `grid-full-span` shared classes)
- [x] **`page-filters-chips-inline` silent bug fixed**
- [x] **`unstyled` prop bug fixed** on ColorList
- [x] **`p-datatable-gridlines` class renamed** to `.ant-table-gridlines`

**In flight or upcoming:**
- [ ] Backend auth wiring (ASP.NET Core + Microsoft.Identity.Web + JWT validation)
- [ ] Frontend auth wiring (MSAL.js + login/logout/user chip in topbar)
- [ ] `User` table schema migration (added to production + staging DBs)
- [ ] Audit fields retrofit on 14 existing custom tables (Path 1 per D-014)
- [ ] Migrations moved to CI/CD pipeline (no startup migrations per D-014)
- [x] **Backend integration test harness** — xUnit + WebApplicationFactory against staging DB (Track F, this session)
- [ ] Frontend test harness (Vitest + React Testing Library, samples)
- [ ] Show-floor order-entry wireframe (UX Designer track; design only)
- [ ] Operator uses migrated app in real business for 3+ working days without issue

---

## In Progress

- **Track F — Backend test harness** (this session)
  - `.sln` at `MissIssippiAPI/MissIssippiAPI.sln`
  - No existing test project
  - Test DB: staging Azure SQL (`MississippiDB-Staging`) per D-019
  - Sequence: xUnit + WebApplicationFactory backend first, Vitest frontend second

---

## Blocked / Waiting

- Nothing blocked.

---

## Architecture State (Post-Migration)

```
<App>
  └── <ConfigProvider theme={antdTheme}>     ← ant-theme.ts mirrors index.css tokens
        └── <AppShell>                        ← Ant Layout (Sider + Header + Content)
              └── <Outlet />
                    └── <PageLayout>          ← Original layout primitive
                          └── {page body}     ← Ant components throughout
```

### Styling files (single source of truth)

```
src/styles/
  index.css         ← All design tokens (--color-*, --space-*, --font-*, --radius-*, --shadow-*, --transition-*)
  antd-theme.ts     ← Ant ConfigProvider theme (mirrors index.css)
  portal-theme.css  ← Original component classes (consumes index.css tokens; no token definitions of its own)
```

**One source of token truth: `index.css`.** Both `antd-theme.ts` and `portal-theme.css` consume those tokens; neither defines competing values.

### Layout primitives

| Primitive | Purpose | Status |
|---|---|---|
| `<AppShell>` | Global frame (sidebar + topbar + content) | ✅ Built, in use |
| `<PageLayout>` | Per-page header + canvas | ✅ Built, used on all 12 pages |
| `<FilterBar>` | Search + filters bar | ⚠️ Currently implemented as `<PageFiltersBar>`; rename + relocate pending (parking lot) |

---

## Page Migration State (12 pages, all complete)

| Page | Layout | Body Framework | Forms | Notes |
|---|---|---|---|---|
| Color List | `<PageLayout>` | Ant Design | Ant `<Input>` / `<Select>` | Save & Add Another pattern shipped |
| Item List (ItemsColors) | `<PageLayout>` | Ant Design | Ant | Expandable rows |
| SKU List | `<PageLayout>` | Ant Design | Ant | |
| Season List | `<PageLayout>` | Ant Design | Ant | |
| Size List | `<PageLayout>` | Ant Design | Ant | |
| Price List | `<PageLayout>` | Ant Design | Ant | |
| Inventory (main) | `<PageLayout>` | Ant Design | Ant | |
| Inventory Cards View | `<PageLayout>` | Ant Design | Ant | |
| Scan Inventory | `<PageLayout>` | Ant Design | Ant | |
| Upload Inventory | `<PageLayout>` | Ant Design | Ant | 3-step wizard |
| Inventory History | `<PageLayout>` | Ant Design | Ant | |
| Inventory Labels | `<PageLayout>` | Ant Design | Ant | |

---

## Recently Shipped

### 2026-06-03 — Track F start + doc backfill
- Confirmed doc state for current-phase, current-app-state, decisions-log, parking-lot
- D-019 logged: staging DB chosen as test database for xUnit integration tests
- Track F (backend test harness) starting this session

### 2026-05-11 — Foundation Session (Session 1)
- Added complete superset of tokens to `index.css`
- Migrated all `var(--pt-*)` references in `portal-theme.css` to canonical tokens
- Deleted `--pt-*` `:root` block from `portal-theme.css` (~280 lines removed)
- Replaced `<ActionButton>` (17 usages, 4 consumers) with direct Ant `<Button>` + Ant icons
- Removed `<PrimeReactProvider>` from App.tsx; deleted `portal-passthrough.ts`
- Migrated 130 `pi pi-*` icon usages across 22 files to `@ant-design/icons`
- Removed dead `toastRef` + `editingRows` state; renamed `p-datatable-gridlines`; fixed `unstyled` bug
- Removed `primereact`, `primeicons`, `primeflex` from `package.json`

### 2026-05-11 — Cleanup Session (Session 2)
- Defined missing `page-filters-chips-inline` CSS class (silent layout bug)
- Migrated all `destroyOnClose` modals → `destroyOnHidden`
- Migrated 10 files to Ant `<Empty>`; deleted `<ViewToggle>`; consolidated 5 files to Ant `<Segmented>`
- Added `modal-footer-actions` and `grid-full-span` shared classes
- Deleted ~2,790 orphan CSS lines (portal-theme.css: 7,668 → 4,878 lines)
- Migrated 17 form-bearing files to Ant `<Input>` / `<Select>`

### 2026-05-11 — Operating Principles (D-018)
- Section 0 added to `CLAUDE.md`; D-018 logged

### Earlier 2026-05-09 to 2026-05-10 — Sub-Sessions 3A through 3K-Polish-K
- Full inventory page body migration; shared wrapper migration; useNotifier migration
- Inventory History + Scan Inventory clusters complete

### 2026-04-27 — Sub-Sessions 2A / 2B / 2C
- `<PageLayout>` built; all 12 pages migrated to it; legacy layout components deleted

### 2026-04-27 — Foundation infrastructure
- Backups, staging DB, CI, Entra ID, CLAUDE.md + DESIGN_SPEC.md rewrites, D-010–D-017 logged

### 2026-04-20 — Phase 1 kickoff
- Team assembled, scope locked, schema reviewed, Phase 2 spec produced, D-001–D-009 logged

---

## Next Session — Open Tracks

### 🟡 Track F — Test Harnesses (IN PROGRESS)
- **Backend:** xUnit + WebApplicationFactory + ~10 inventory integration tests against staging DB
- **Frontend:** Vitest + React Testing Library + 2–3 sample tests on layout primitives (second)
- `.sln` at `MissIssippiAPI/MissIssippiAPI.sln`; no existing test project
- Estimated: 1–2 sessions total

### Track B — Backend Auth Wiring
- ASP.NET Core + Microsoft.Identity.Web; JWT validation middleware; `ICurrentUserService`; all endpoints authorized
- Estimated: 1–2 sessions

### Track C — Frontend Auth Wiring
- MSAL.js + React MSAL provider; login/logout; user chip in topbar; Axios 401 interceptor
- Estimated: 1 session

### Track D — User Table + Audit Fields Retrofit
- `User` table migration; audit fields retrofit on 14 existing tables (Path 1 per D-014)
- Depends on auth wired
- Estimated: 1 session

### Track E — Migrations to CI/CD
- Move `dotnet ef database update` from app startup → GitHub Actions (build → migrate → deploy)
- Estimated: 1 short session

### Track G — Show-Floor Order Entry Wireframe
- UX Designer track. Design only. Validates Phase 3 starting point.
- Estimated: 1 session

### Track H — Doc Cleanup
- Close completed parking-lot items; audit `portal-theme.css` for remaining orphans; rename to `components.css`
- Estimated: short session

---

## Phase 2 Real Burndown (Remaining Work)

1. **Track F** — test harnesses (in progress)
2. **Tracks B + C** — backend + frontend auth wiring (most critical for multi-user use)
3. **Track D** — User table + audit fields (depends on auth)
4. **Track E** — migrations to CI/CD (safety before audit retrofit)
5. **Track G** — show-floor wireframe (can run in parallel)
6. **Track H** — doc cleanup

**Realistic remaining time:** 4–7 focused sessions to reach full Phase 2 ship.

---

## Session Log

### 2026-06-03 — Doc backfill + Track F start
- Updated all four living docs (current-phase, current-app-state, decisions-log, parking-lot)
- D-019 logged: staging DB as test database decision
- Track F backend harness beginning

### 2026-05-11 (Foundation + Cleanup) — Phase 2 framework migration COMPLETE
- ~30 files modified, 3 deleted; portal-theme.css 7,668 → 4,878 lines; 0 TS errors; 3,156 build modules
- D-018 logged: Operating Principles (CLAUDE.md Section 0)

### 2026-05-09 to 2026-05-10 — Sub-Sessions 3A through 3K-Polish-K
- Incremental inventory page migration and polish

### 2026-04-27 — Sub-Sessions 2A/2B/2C + Foundation infrastructure

### 2026-04-20 — Phase 1 kickoff

---

*Last updated: 2026-06-03, Track F start + doc backfill.*
