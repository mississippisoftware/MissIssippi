# Parking Lot

> **Purpose:** Ideas, features, and improvements that are NOT in the current phase. They are captured here so they aren't forgotten — and so they don't derail the current phase.
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
- **Trigger:** D-010 + D-011. App Services currently on Free (F1) tier. Free tier sleeps apps, has no slots, no custom-domain SSL, no SLA. Fine for solo Phase 2 development; unacceptable for salespeople at a show.
- **Description:** Upgrade `ASP-rgMissIssippi-82e8` plan to Basic (B1, ~$13/mo) for always-on + custom domain, or Standard (S1, ~$70/mo) for slots + auto-scale. Standard also unlocks the full staging environment that D-010 deferred (production slot + staging slot + manual-approval promote).
- **Potential phase:** Before Phase 3 ships, at the latest. Trigger: a salesperson is about to log in, or cold-start delay becomes an annoyance during Phase 2 development.

---

### Salesperson role + RBAC UI

- **Captured:** 2026-04-20
- **Trigger:** Operator asked to build full roles-and-permissions at the outset; PM pushed back and scoped it to minimal auth in Phase 2.
- **Description:** Second user role (`salesperson`), invite/onboard flow, permission checks ("salesperson can only see their own customers' orders"), per-resource access rules. The Phase 2 data model reserves the seat; the UI and enforcement layer are deferred.
- **Potential phase:** Phase 3 or later — triggered when operator is ready to actually invite a salesperson.

---

### Retail / MSRP pricing

- **Captured:** 2026-04-20
- **Trigger:** Apparel Expert noted that `Item` has `CostPrice` + `WholesalePrice` but no retail price.
- **Description:** Add `RetailPrice` column (or Price-per-channel structure) when e-commerce / retail channel becomes real. Possibly tied to a channel/pricebook concept.
- **Potential phase:** Year 2+, when e-commerce arrives.

---

### Per-customer pricing / volume discounts

- **Captured:** 2026-04-20
- **Trigger:** Apparel Expert flagged that wholesale brands inevitably need it.
- **Description:** Price overrides per customer account; volume tiers; key-account pricing. Small wholesale brands all eventually need this.
- **Potential phase:** Year 2+.

---

### Offline-tolerant show-floor order entry

- **Captured:** 2026-04-20
- **Trigger:** UX Designer noted trade-show Wi-Fi is notoriously unreliable.
- **Description:** Order entry should continue functioning (at least buffering, ideally full offline) when network is flaky. Not required for Year 1 but likely painful without.
- **Potential phase:** Phase 3 (decide when designing show-floor flow) or Phase 3.5.

---

### Mobile-phone-optimized UI

- **Captured:** 2026-04-20
- **Trigger:** Device-support decision D-009 scoped Year 1 to tablet-landscape and up.
- **Description:** Phone-optimized layouts for salespeople in the field, customers placing small orders, etc.
- **Potential phase:** Post-Year 1.

---

### Barcode scanner for non-inventory flows

- **Captured:** 2026-04-20
- **Trigger:** Inventory already has scan-based adjustments; same hardware could speed up picking/packing and receiving POs.
- **Description:** Extend barcode scan workflow to receive POs and to generate pick tickets. Keyboard-wedge mode first; mobile camera scanning later.
- **Potential phase:** Phase 4 (receiving) or later.

---

### Email notifications & PDF generation

- **Captured:** 2026-04-20
- **Trigger:** Phase 2 explicitly excludes background jobs, async work, and document generation.
- **Description:** Email invoices to customers; generate PDF pick tickets; order confirmation emails. All require a background worker + template system.
- **Potential phase:** Phase 3 (pick tickets) or Phase 4 (invoices).

---

### QuickBooks export / integration

- **Captured:** 2026-04-20
- **Trigger:** Year 1 North Star is "kill the paper → Excel → QB re-entry pipeline." Full QB replacement is out of scope; export likely needed.
- **Description:** Export invoices / payments / customer records to QB Online, or bidirectional sync. Lets operator keep accountant workflows intact.
- **Potential phase:** Phase 4 or Phase 5.

---

### Reporting & dashboards beyond inventory

- **Captured:** 2026-04-20
- **Trigger:** Original scope listed "Reporting & Dashboards" as a module; D-002 deferred it.
- **Description:** Sales trend reports, stock turnover, A/R aging, cash-flow view. Each module will add primitive reports as it ships; this item is for the dedicated reporting module that composes across them.
- **Potential phase:** Year 2+.

---

### Full accounting suite (beyond basic A/R)

- **Captured:** 2026-04-20
- **Trigger:** Scope explicitly says "basic accounting only."
- **Description:** Chart of accounts, journal entries, P&L, balance sheet, tax reports. We are not replacing QuickBooks.
- **Potential phase:** Probably never inside this product. QB export is the right answer.

---

### Multi-tenancy

- **Captured:** 2026-04-20
- **Trigger:** GTM Strategist's guidance to stay operator-focused in Year 1.
- **Description:** Tenant isolation so multiple brands can run on one deployment. Required before selling SaaS to other brands.
- **Potential phase:** Year 2+, before first external customer.

---

### Marketing automation / email campaigns

- **Captured:** 2026-04-20
- **Trigger:** Explicitly out of scope.
- **Description:** Customer segmentation, email campaigns, re-engagement flows.
- **Potential phase:** Probably never inside this product.

---

### Payroll

- **Captured:** 2026-04-20
- **Trigger:** Explicitly out of scope.
- **Description:** Operator will keep using whatever payroll system they have.
- **Potential phase:** Never.

---

## Review Log

### 2026-04-20 — end of Phase 1 kickoff

- Populated from Phase 1 conversations.
- Next review: end of Phase 2.

### 2026-04-27 — Phase 2 start session

- Added: App Service tier upgrade (linked to D-010 + D-011).

---

*Last updated: 2026-04-27*
