# Scope

> **Purpose:** Defines what is in scope and what is out of scope for the whole project, and the phased build order. Prevents scope creep. If a request doesn't fit in an in-scope module, it goes to the Parking Lot.

---

## Year 1 — In Scope (the platform WILL include)

Locked 2026-04-20 per decision D-002.

1. **Inventory** — *shipped as baseline; will be refactored in Phase 2*
2. **Sales orders** — order entry (especially show-floor), order lifecycle, pick tickets
3. **Customers (wholesale accounts)** — customer records, contact info, order history
4. **Purchasing & suppliers** — purchase orders to manufacturers, supplier records, receiving
5. **Invoicing** — invoice generation from shipped orders
6. **Basic A/R** — track receivables, record payments, simple aging

---

## Year 2+ — Deferred (in scope for the product long-term, NOT in Year 1)

Logged in Parking Lot for review at phase transitions.

- Reporting & dashboards (beyond per-module primitives)
- Full accounting (P&L, balance sheet, chart of accounts) — likely QB export instead
- User management & RBAC beyond Phase 2's minimal auth
- Multi-tenancy
- Retail / e-commerce features (MSRP, pricebooks, integrations)
- Per-customer pricing / volume discounts
- Email/PDF document automation
- Barcode scanning beyond inventory
- Mobile-phone-optimized UI
- QuickBooks integration / export
- Offline-tolerant show-floor order entry

---

## Out of Scope (the platform will NOT include, ever)

- Full e-commerce storefront (integrate with Shopify/Woo; don't replicate)
- Full accounting suite (not replacing QuickBooks)
- Payroll
- Point-of-sale hardware integration
- Manufacturing / BOM / production planning
- Marketing automation / email campaigns

---

## Phased Build Order

Build in phases. Each phase ships (works in real business) before the next starts.

| Phase | Module(s) | Status | Exit criteria |
|-------|-----------|--------|---------------|
| 0 | Inventory (baseline) | ✅ shipped (Apr 2026, in real use) | Already in use |
| 1 | Planning / kickoff | ✅ shipped (Apr 20, 2026) | Team assembled, scope locked, Phase 2 spec produced, decisions logged |
| 2 | **Foundation** — auth, staging, CI, backups, front-end primitives, Inventory refactor, design audit, tests, rule-sheet updates, show-floor wireframe (design only) | 🟡 in progress | See `phase-2-spec.md` |
| 3 | Sales orders + Customers — show-floor order entry, customer records, pick tickets | ⏳ future | Operator can enter show orders into system and generate pick tickets without paper/Excel |
| 4 | Purchasing + suppliers — POs to manufacturers, receiving | ⏳ future | Operator can place manufacturing POs from sales-order consolidation and receive inventory into the system |
| 5 | Invoicing + basic A/R — generate invoices from shipped orders, record payments, basic aging | ⏳ future | Operator no longer uses QuickBooks to create invoices for wholesale orders |
| 6 | Year 1 polish / QB export / operator dogfooding phase | ⏳ future | Operator runs business end-to-end in the platform for a full season |
| 7+ | Year 2+ — multi-tenancy, RBAC, reporting module, e-commerce prep, GTM | ⏳ future | Product-ready for first external customer |

---

## Scope Change Policy

Any change to scope (adding a module, removing a module, reordering phases) requires:

1. A proposal written out (what changes, why).
2. A logged decision in `decisions-log.md`.
3. An update to this document.

No silent scope changes. No "just one more thing."

---

*Last updated: 2026-04-20*
