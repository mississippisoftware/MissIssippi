# Current App State

> **Purpose:** Factual snapshot of the existing inventory app — what it does today, how it's built, what's working, what's not. This is the baseline the rest of the platform grows from.
>
> **Update cadence:** Refresh whenever a fact in here genuinely changes (new feature shipped, new infrastructure, new dependency). Not a planning doc — a *truth* doc.

---

## 1. Overview

- **App name:** MissIssippiApp (frontend) + MissIssippiAPI (backend) — single repo `MissIssippi`
- **What it does in one sentence:** Tracks inventory (style × color × size × season) of girls' apparel, with batch-tracked adjustments and undoable upload imports.
- **How long it's been in use:** ~7 weeks (real use began early April 2026)
- **Is it live in my real business?** Yes — running on Azure App Service (Free tier), used for active inventory entry. No auth yet; not yet on a custom domain.

---

## 2. Tech Stack

### Current (production today)
- **Frontend:** React + Vite + TypeScript, deployed as `mississippi-web` (App Service)
- **Frontend UI library:** **Ant Design** (`antd` + `@ant-design/icons`). All UI components ship from Ant Design; styling is driven by Ant `ConfigProvider` with tokens from `src/styles/index.css`. PrimeReact fully removed 2026-05-11.
- **Backend:** .NET (C#) Web API, REST, deployed as `mississippi-api` (App Service)
- **Hosting plan:** `ASP-rgMissIssippi-82e8`, **Free (F1) tier** *(per D-011 — upgrade deferred to Phase 3)*
- **Production database:** `MississippiDB` (Azure SQL Database, PaaS) on server `mississippi.database.windows.net`
- **Staging database:** `MississippiDB-Staging` (Azure SQL Basic tier, ~$5/mo, same server). Created 2026-04-27. Used for schema/migration testing from localhost, and as the **test database for xUnit integration tests** (per D-019).
- **Auth:** None currently. App is open. Phase 2 will add Microsoft Entra ID (Azure AD) login with a single `owner` role.
- **Repo:** Single repo on GitHub — `mississippisoftware/MissIssippi`. Contains `MissIssippiAPI/`, `MissIssippiApp/`, `MissIssippiDB/` (SQL Database Project), `MissIssippiWholesale/` (local copy of project docs), and `.github/workflows/`.

### Styling architecture (single source of truth)

```
src/styles/
  index.css         ← All design tokens (--color-*, --space-*, --font-*, --radius-*, --shadow-*, --transition-*)
  antd-theme.ts     ← Ant Design ConfigProvider theme (mirrors index.css)
  portal-theme.css  ← Original component CSS classes (consumes index.css tokens; no token definitions of its own)
```

`index.css` is the **single source of token truth**. Both `antd-theme.ts` and `portal-theme.css` consume those tokens; neither defines competing values. `portal-theme.css` may be renamed to `components.css` in a future cleanup session (parking lot).

---

## 3. Backup Posture

- **Service:** Azure SQL Database automated backups (PITR + LTR)
- **PITR retention:** 7 days *(slider-capped at this tier)*
- **LTR weekly:** 12 weekly snapshots
- **LTR monthly / yearly:** none configured
- **Verified / configured:** 2026-04-27
- **Earliest restore point on file (at verification):** 2026-04-20 16:09 UTC

> *Revisit if service tier changes or if 7-day PITR proves too short during real Phase 2 use.*

---

## 4. CI/CD Posture

- **Repo:** GitHub (`mississippisoftware/MissIssippi`)
- **CI workflow:** `.github/workflows/ci.yml` — runs on every push and PR. Two parallel jobs:
  - `Build & Test API` — .NET 8 restore + build + test (test project being added Track F)
  - `Build & Lint Web` — Node 20, npm ci, lint (with `continue-on-error: true` until codebase is clean), vite build
- **Deployment workflows:**
  - `main_mississippi-api.yml` — auto-deploys API on push to main when `MissIssippiAPI/**` changes. **Has known typo on publish-profile line** (parking lot) that needs fixing before next API push.
  - `main_mississippi-web.yml` — auto-deploys web on every push to main. Lacks path filter (parking lot).
- **Secrets configured in GitHub:** `AZUREAPPSERVICE_CLIENTID_*`, `AZUREAPPSERVICE_TENANTID_*`, `AZUREAPPSERVICE_SUBSCRIPTIONID_*`, `AZURE_WEBAPP_PUBLISH_PROFILE`.
- **Migrations strategy:** Currently EF Core migrations run on app startup. Phase 2 Track E will move migrations into the CI/CD pipeline per D-014 (build → migrate → deploy order). Not yet done.

---

## 5. Auth Posture

- **Current:** None. App is open.
- **Phase 2 plan:** Microsoft Entra ID (single tenant), SPA flow with PKCE.
- **Entra ID configuration done 2026-04-27:**
  - App registration `MissIssippi` exists in tenant
  - Single tenant only
  - SPA platform with four redirect URIs: `http://localhost:5173`, `http://localhost:5173/`, `https://mississippi-web.azurewebsites.net`, `https://mississippi-web.azurewebsites.net/`
  - Application ID URI: `api://[client-id]`
  - One scope: `access_as_user` — admins and users can consent
- **Phase 2 still to do (code side):**
  - Backend: ASP.NET Core + Microsoft.Identity.Web + JWT validation
  - Frontend: React + MSAL.js login flow + user chip in topbar
  - `User` table in DB; seed operator as `role='owner'`
  - `CreatedByUserId` FK pattern on inventory tables

---

## 6. Data Model (what exists today)

Source of truth: `Schema.md` (full schema saved in project) + the `MissIssippiDB/` SQL Database Project in the repo. **Both must be kept in sync** when the schema changes.

### Reference / lookup tables
- **Sizes** — `SizeId`, `SizeName`, `SizeSequence`
- **Season** — `SeasonId`, `SeasonName`, `SeasonDateCreated`, `Active`
- **Collection** — `CollectionId`, `CollectionName`
- **Color** — `ColorId`, `ColorName`, optional `SeasonId` + `CollectionId`, `PantoneColor`, `HexValue`
- **ImageType** — image classification with sequence

### Merchandising / catalog
- **Item** — the style. `ItemNumber`, `Description`, `CostPrice`, `WholesalePrice`, `Weight`, `SeasonId`, `InProduction`, `ItemDateCreated`.
- **ItemColor** — a style in a colorway. `Active` flag, `CompositeSignature`. Secondary colors via `ItemColorSecondaryColor`.
- **Sku** — inventory unit: `ItemColor` × `Size`.
- **ItemImage** — images at `ItemColor` level by type and sequence.

### Inventory
- **Inventory** — current quantity by `ItemColor` × `Size`. Persisted `InStock` computed column.
- **InventoryAdjustmentBatch** — batch envelope for any adjustment.
- **InventoryActivityLog** — line-by-line history with `OldQty`, `NewQty`, `Delta`, `ActionType`.
- **InventoryUploadBatch** — audit of file uploads: hash, idempotency key, row counts, undo state, result JSON.

> Full DDL with constraints and indexes lives in `Schema.md`.

### Phase 2 schema additions (planned, not yet shipped)
- `User` (UserId, EntraObjectId, Email, DisplayName, Role, Active, CreatedAtUtc, ModifiedAtUtc)
- `CreatedByUserId`, `ModifiedByUserId`, `CreatedAtUtc`, `ModifiedAtUtc` columns on existing custom tables (per D-014)

---

## 7. Features Currently Working

- Item / style management (add, edit, list, with season + collection + colors)
- Color management (with Pantone + hex)
- SKU generator / editor (rules-based, editable)
- Image upload by image-type, multi-image per item-color
- Inventory list view with size-grid display per item
- Inventory cards view (alternative layout)
- Filter / search / view-toggle on inventory page
- **Scan inventory** — barcode/SKU scan with auto-scan or manual mode, batch memo, save-or-discard, recent batches list
- **Upload inventory** — 3-step wizard (Prepare → Configure → Review), with `Change` / `Add` / `Subtract` modes, partial-upload allowance, duplicate-dataset detection, idempotency, undo of applied batches, downloadable template
- **Inventory history** — batches by source (scan / upload), filterable, with batch detail drill-in
- **Labels and PDF/XLSX export** from inventory list

---

## 8. Features Partially Built / Known Gaps

- No login / auth — app is open *(Phase 2 Track B + C; Entra ID config done; code wiring pending)*
- No staging App Service / deployment slot *(deferred to Phase 3 per D-010; staging DB exists)*
- No automated tests *(Phase 2 Track F — xUnit + WebApplicationFactory backend starting now; frontend Vitest second)*
- ✅ CI pipeline exists; test project will accrete into it
- Migrations still run on app startup *(Phase 2 Track E — move to CI/CD pipeline per D-014)*
- App Service Free tier *(deferred per D-011)*
- No `User`, `Customer`, `SalesOrder`, `PurchaseOrder`, `Invoice`, `Payment` tables yet *(by design)*
- Audit fields not yet on existing 14 custom tables *(Phase 2 Track D — depends on User table + auth)*

---

## 9. What's Working Well

- Item → ItemColor → Sku model is correct apparel structure
- Inventory batch tracking + undo is unusually robust for an early-stage app
- Operator (me) is productive in the codebase
- Backups, staging DB, CI, Entra ID all in place
- **Phase 2 framework migration complete (2026-05-11):** Ant Design sole framework, single CSS token source, all 12 pages migrated, ~2,790 orphan lines deleted, 0 TS errors
- **Operating Principles (D-018) adopted:** CLAUDE.md Section 0 corrects over-cautious bounded-scope default

---

## 10. What's Annoying

- No auth means I can't safely invite anyone else to look at the system *(Phase 2 Track B + C)*
- Salespeople still write orders on paper *(Phase 3)*
- Same data still entered three times (paper → Excel → QuickBooks) *(Phases 3–5)*

---

## 11. About the Business

- **Retail / wholesale / both:** Wholesale today; retail planned post-Year-1
- **Roughly how many SKUs:** ~2,500 per season
- **Roughly how many orders:** ~400 per season
- **Sales channels:** Wholesale accounts, multiple salespeople
- **Seasonal pattern:** Spring drop + Fall drop
- **Current order-flow pain:** Paper orders → Excel → QuickBooks re-entry. Same data entered three times. Killing this is the Year 1 win.

---

## 12. Supported Devices (Year 1)

- Tablet-landscape (~1024px) and up
- Phone-optimized UI is **not** in scope for Year 1 *(per D-009)*

---

## 13. One-Sentence Vision for Year 1

> *Enter orders at the show, generate manufacturing POs from those orders, receive inventory against those POs, create invoices and pick orders from sales orders, and run A/R bookkeeping — all in one system, with each piece of information entered exactly once.*

---

## 14. Related Documents

- `north-star.md` — vision
- `scope.md` — what's in / out / when
- `phase-2-spec.md` — current phase deliverables
- `current-phase.md` — where we are right now
- `decisions-log.md` — why we made the choices we made (D-001 through D-019)
- `parking-lot.md` — what's deferred and to where
- `Schema.md` — full DDL of the existing database
- `DESIGN_SPEC.md` — visual rules (Booklytics-style; ConfigProvider authoritative)
- `CLAUDE.md` — architecture rules (Section 0: Operating Principles; Sections 1–8: architecture, layering, wrappers, conventions, error handling, audit rules, examples, ask-before-acting)

---

*Last updated: 2026-06-03, Track F start.*
