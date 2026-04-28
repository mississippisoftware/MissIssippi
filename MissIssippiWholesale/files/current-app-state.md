# Current App State

> **Purpose:** Factual snapshot of the existing inventory app — what it does today, how it's built, what's working, what's not. This is the baseline the rest of the platform grows from.
>
> **Update cadence:** Refresh whenever a fact in here genuinely changes (new feature shipped, new infrastructure, new dependency). Not a planning doc — a *truth* doc.

---

## 1. Overview

- **App name:** MissIssippiApp
- **What it does in one sentence:** Tracks inventory (style × color × size × season) of girls' apparel, with batch-tracked adjustments and undoable upload imports.
- **How long it's been in use:** ~3 weeks (real use began early April 2026)
- **Is it live in my real business?** Yes — running on Azure App Service (Free tier), used for active inventory entry. No auth yet; not yet on a custom domain.

---

## 2. Tech Stack

- **Frontend:** React + Vite + TypeScript, deployed as `mississippi-web` (App Service)
- **Backend:** .NET (C#) Web API, REST, deployed as `mississippi-api` (App Service)
- **Hosting plan:** `ASP-rgMissIssippi-82e8`, **Free (F1) tier** *(per D-011 — upgrade deferred to Phase 3)*
- **Production database:** `MississippiDB` (Azure SQL Database, PaaS) on server `mississippi.database.windows.net`
- **Staging database:** `MississippiDB-Staging` (Azure SQL Basic tier, ~$5/mo, same server, empty schema). Created 2026-04-27. Used for schema/migration testing from localhost. *(Per D-010 — staging App Service slot deferred to Phase 3.)*
- **Auth:** None currently. App is open. Phase 2 will add Microsoft Entra ID (Azure AD) login with a single `owner` role.
- **Other key libraries / services:** *(to be filled in once primitive extraction begins — UI library, form library, validation library if any)*

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

## 4. Data Model (what exists today)

Source of truth: `Schema.md` (full schema saved in project).

### Reference / lookup tables
- **Sizes** — `SizeId`, `SizeName`, `SizeSequence` (drives ordered display: 8, 10, 12, XXS, XS, S, M, L, XL, …)
- **Season** — `SeasonId`, `SeasonName`, `SeasonDateCreated`, `Active` (e.g., SS26, FW25)
- **Collection** — `CollectionId`, `CollectionName` (within a season: Casual / Elegant)
- **Color** — `ColorId`, `ColorName`, optional `SeasonId` + `CollectionId`, `PantoneColor`, `HexValue`
- **ImageType** — image classification (front, back, swatch, etc.) with sequence

### Merchandising / catalog
- **Item** — the *style* (e.g., 1102 / Tee). Holds `ItemNumber`, `Description`, `CostPrice`, `WholesalePrice`, `Weight`, `SeasonId`, `InProduction` flag, `ItemDateCreated`.
- **ItemColor** — a style in a specific colorway. Supports primary + secondary colors via `ItemColorSecondaryColor` for prints/patterns. Has `Active` flag and `CompositeSignature` for variant disambiguation.
- **Sku** — the inventory unit: `ItemColor` × `Size`. Carries the actual SKU code (auto-generated/editable).
- **ItemImage** — images attached at the `ItemColor` level by image type and sequence.

### Inventory
- **Inventory** — current quantity by `ItemColor` × `Size`. Persisted `InStock` computed column.
- **InventoryAdjustmentBatch** — batch envelope for any adjustment (scan, manual, upload).
- **InventoryActivityLog** — line-by-line history with `OldQty`, `NewQty`, `Delta`, `ActionType`, timestamp, batch FK.
- **InventoryUploadBatch** — full audit of file uploads: hash, idempotency key, row counts, errors, undo state, result JSON.

> Full DDL with constraints and indexes lives in `Schema.md`. Both production and staging databases share this same schema (verified 2026-04-27).

---

## 5. Features Currently Working

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

## 6. Features Partially Built / Known Gaps

- No login / auth — app is open *(Phase 2 deliverable)*
- No staging App Service / deployment slot *(deferred to Phase 3 per D-010; staging DB exists)*
- No automated tests *(Phase 2 deliverable)*
- No CI pipeline *(Phase 2 deliverable)*
- Front-end primitives not yet extracted (every page hand-composed); enforcement of `DESIGN_SPEC.md` and `CLAUDE.md` rules is partial *(Phase 2 deliverable)*
- App Service Free tier — apps cold-start after idle, no custom domain SSL, no SLA *(deferred per D-011)*
- No `User`, `Customer`, `SalesOrder`, `PurchaseOrder`, `Invoice`, `Payment` tables yet *(by design — those arrive in later phases)*

---

## 7. What's Working Well

- The Item → ItemColor → Sku model is correct apparel structure (validated by the team during Phase 1 kickoff)
- Inventory batch tracking + undo is unusually robust for an early-stage app
- Visual design has real direction — clean, professional, restrained — and a documented spec to back it up
- Architecture has direction too (`UI → Hooks → Backend` layering documented)
- Operator (me) is productive in the codebase

---

## 8. What's Annoying

- Front-end architecture is under-extracted — building each new page takes too long because primitives don't exist yet
- The rule sheets (`DESIGN_SPEC.md`, `CLAUDE.md`) aren't enforced by the code structure — only by vigilance
- Repeating UI patterns are duplicated across pages instead of composed from a shared component
- No auth means I can't safely invite anyone else to look at the system

> Phase 2 directly addresses every item in this list.

---

## 9. About the Business (context for the team)

- **Retail / wholesale / both:** Wholesale today; retail (e-commerce) planned post-Year-1
- **Online / physical / both:** Neither currently — wholesale-only, no direct-to-consumer channel yet
- **Roughly how many SKUs:** ~2,500 per season
- **Roughly how many orders:** ~400 per season
- **Sales channels:** Wholesale accounts, divided across multiple salespeople
- **Team size:** Solo operator (me) + Claude as specialist team
- **Seasonal pattern:** Spring drop + Fall drop
- **Current order-flow pain:** Salespeople write orders on paper → office types into Excel → manually consolidated → manually re-entered into QuickBooks for invoicing/pick orders. Same data entered three times. Killing this pipeline is the Year 1 win.

---

## 10. Supported Devices (Year 1)

- Tablet-landscape (~1024px) and up
- Laptop / desktop primary
- Phone-optimized UI is **not** in scope for Year 1 *(per decision D-009)*

---

## 11. One-Sentence Vision for Year 1

> *Enter orders at the show, generate manufacturing POs from those orders, receive inventory against those POs, create invoices and pick orders from sales orders, and run A/R bookkeeping — all in one system, with each piece of information entered exactly once.*

---

## 12. Related Documents

- `north-star.md` — vision
- `scope.md` — what's in / out / when
- `phase-2-spec.md` — current phase deliverables
- `current-phase.md` — where we are right now
- `decisions-log.md` — why we made the choices we made
- `parking-lot.md` — what's deferred and to where
- `Schema.md` — full DDL of the existing database
- `DESIGN_SPEC.md` — visual rules
- `CLAUDE.md` — architecture rules

---

*Last updated: 2026-04-27*
