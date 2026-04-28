# Decisions Log

> **Purpose:** Record of significant decisions made, with date and reasoning. Prevents re-debating settled questions. If we ever wonder "why did we do it that way?" — the answer lives here.

---

## What Counts as a Decision to Log

Log it if it:

- Changes the North Star
- Changes the Scope (adds, removes, or reorders modules)
- Changes the definition of done for the current phase
- Chooses between two real alternatives (tech choice, design choice, business choice)
- Establishes a rule or convention for the project

Do NOT log routine implementation choices. This is a log, not a diary.

---

## Format

Each decision:
- **ID:** D-001, D-002, etc.
- **Date:**
- **Title:** short name
- **Context:** what was the situation or question
- **Options considered:** what were the real alternatives
- **Decision:** what we chose
- **Reasoning:** why
- **Revisit when:** what would cause us to reopen this

---

## Decisions

---

### D-001 — Use markdown files in Claude Project for project documents

- **Date:** 2026-01-10
- **Title:** Use markdown files in Claude Project for project documents
- **Context:** Needed a way to maintain North Star, Scope, and other living docs across sessions, since Claude has no memory by default.
- **Options considered:**
  1. Paste full documents into every new chat
  2. Use Claude's memory feature
  3. Use a Claude Project with knowledge documents
- **Decision:** Claude Project with markdown knowledge documents.
- **Reasoning:** Project automatically includes context in every chat in the project; markdown is easy to edit and readable; no risk of losing state between sessions.
- **Revisit when:** If Claude's memory feature becomes more reliable across long time horizons, or if project knowledge file limits become a constraint.

---

### D-002 — Year 1 scope = 5 modules; reporting/accounting/roles/multi-tenancy deferred to Year 2+

- **Date:** 2026-04-20
- **Title:** Lock Year 1 scope to five modules
- **Context:** Initial `scope.md` listed 9 in-scope modules across 8 phases. The Year 1 vision (enter orders at show → manufacturing POs → receive inventory → invoices/pick orders → A/R) only requires 5. PM flagged risk of building Year 2 features in Year 1 timeframe.
- **Options considered:**
  1. Build all 9 modules in Year 1 as originally sketched
  2. Lock Year 1 to the 5 that directly serve the Year 1 vision; formally defer the rest
  3. Leave scope ambiguous and decide module-by-module
- **Decision:** Option 2. Year 1 = Sales Orders, Customers, Purchasing & Suppliers, Invoicing & Payments, basic A/R. Year 2+ = Reporting/dashboards, full accounting, User roles & permissions (beyond minimal auth), Multi-tenancy.
- **Reasoning:** Year 1 vision is a linear workflow; the 5 modules are the workflow. Everything else is leverage on top of a working workflow. Building leverage before the workflow exists is wasted work. Also: "build for the operator first, generalize later" from the GTM strategist's guidance.
- **Revisit when:** End of Phase 3 (Sales Orders + Customers), when we'll have real usage data and can re-evaluate whether the remaining Year 1 modules still look right.

---

### D-003 — Phase 2 = foundation only (no business modules)

- **Date:** 2026-04-20
- **Title:** Phase 2 is foundation-only
- **Context:** Existing app has no auth, no backups, no staging, no tests, and — by operator's own admission — front-end architecture that makes each new page slow to build. Without addressing these, every Year 1 business module would be built on unstable ground.
- **Options considered:**
  1. Start building Sales Orders immediately; fix foundation opportunistically
  2. Spend Phase 2 entirely on foundation; no business modules shipped
  3. Parallel tracks: foundation + Sales Orders simultaneously
- **Decision:** Option 2. Phase 2 is foundation-only: minimal auth, staging, backups, tests, shared front-end primitives, Inventory refactored as reference module, design-spec audit, CI, rule-sheet updates. Show-floor wireframe produced in parallel (design only, no code).
- **Reasoning:** Foundation debt compounds. Each business module built on shaky foundation costs more later than building foundation first costs now. Operator confirmed the "creating each page takes too long" pain is real. Timebox is 4–6 weeks — bounded.
- **Revisit when:** If Phase 2 exceeds 6 weeks, revisit scope of Phase 2 itself (cut something) rather than extend indefinitely.

---

### D-004 — Keep existing schema; build on top, do not rebuild

- **Date:** 2026-04-20
- **Title:** Existing inventory schema is the foundation
- **Context:** Apparel Industry Expert reviewed the full schema. Item → ItemColor → Sku model is correct for apparel. Season/Collection structure works. Inventory batch/history/undo mechanism is well-designed. No structural problems found.
- **Options considered:**
  1. Rebuild the schema from scratch with "cleaner" choices
  2. Keep the schema; add new tables (User, Customer, SalesOrder, etc.) alongside
  3. Partial rewrite of specific tables
- **Decision:** Option 2. Keep every existing table. Add User table in Phase 2. Add Customer, SalesOrder, SalesOrderLine, PurchaseOrder, Invoice, Payment tables in future phases.
- **Reasoning:** Schema quality is good. Rebuilding costs weeks with no user-visible improvement. Operator's existing data stays intact. Schema-first approach lets new features accrete.
- **Revisit when:** If a future business module reveals that the existing schema can't support it without an unreasonable contortion. No change expected in Year 1.

---

### D-005 — Minimal auth in Phase 2: one role (owner), salesperson seat reserved

- **Date:** 2026-04-20
- **Title:** Minimal auth scope
- **Context:** Operator expressed desire to build full roles-and-permissions "at the outset." PM pushed back: operator is the only user in Year 1; salespeople currently write on paper; full RBAC is weeks of work before any business value ships. But: data model can reserve space for salesperson role cheaply.
- **Options considered:**
  1. Build full role-based access control in Phase 2 (owner + salesperson + admin, per-resource permissions)
  2. No auth in Phase 2; add later
  3. Minimal auth: login required, single role (owner), data model reserves salesperson seat via role column and created_by_user_id FKs
- **Decision:** Option 3.
- **Reasoning:** Every unbuilt feature is fastest to build later when the need is concrete, not speculative. The data-model reservation (role column + FK patterns) costs ~1 day and avoids costly migration later. Permission-check middleware, multi-role UI, invite flows, etc. only get built when a salesperson is actually about to log in.
- **Revisit when:** When operator is ready to invite first salesperson. At that point, a focused ~1-week sprint adds salesperson role + permission checks + invite flow. Expected Phase 3 or later.

---

### D-006 — Tech stack confirmed: .NET + React/TypeScript + Azure SQL Database + App Service

- **Date:** 2026-04-20
- **Title:** Confirm existing stack, do not change
- **Context:** During kickoff, initial description was ambiguous ("Node, customAPI"). Later clarified: backend is .NET (C#), frontend is React with TypeScript built via Vite, database is Azure SQL Database (PaaS), hosted on Azure App Service.
- **Options considered:**
  1. Stay on current stack
  2. Migrate some component (e.g., move to Next.js, Postgres, serverless)
- **Decision:** Option 1. Full stop.
- **Reasoning:** Coherent Microsoft-ecosystem stack; operator already productive in it; schema proves solid usage of SQL Server features; no pain signals indicating the stack is wrong for the workload. Year 1 is not the time to change stacks.
- **Revisit when:** If a specific, concrete scaling or capability need arises that the current stack genuinely cannot meet. None foreseen in Year 1.

---

### D-007 — Auth provider: Microsoft Entra ID

- **Date:** 2026-04-20
- **Title:** Auth via Microsoft Entra ID (Azure AD)
- **Context:** Need an auth provider for Phase 2. Operator already uses Microsoft/Azure for everything.
- **Options considered:**
  1. Microsoft Entra ID (first-party, SSO/MFA included)
  2. ASP.NET Core Identity with email/password
  3. Third-party (Auth0, Clerk, Supabase Auth)
- **Decision:** Option 1, with Microsoft.Identity.Web on the .NET side.
- **Reasoning:** First-party integration with existing Azure environment; SSO, MFA, password reset, account recovery all free; reduces "roll your own auth" risk.
- **Revisit when:** If Entra ID integration turns out to be unworkable for the SPA flow, fallback is ASP.NET Core Identity. Architect will timebox auth to 1 week before calling the fallback.

---

### D-008 — DESIGN_SPEC.md and CLAUDE.md are the "foundation constitution"

- **Date:** 2026-04-20
- **Title:** Adopt existing rule sheets as governing docs; extract primitives that enforce them
- **Context:** Operator authored DESIGN_SPEC.md (visual) and CLAUDE.md (architecture). UX Designer and Architect both assessed them as genuinely strong. Problem is enforcement, not content.
- **Options considered:**
  1. Keep rule sheets as documentation; continue relying on vigilance
  2. Replace rule sheets with a prebuilt design system (shadcn, MUI)
  3. Keep rule sheets as source of truth; extract primitives in Phase 2 that encode the rules by construction
- **Decision:** Option 3.
- **Reasoning:** Rule sheets reflect operator's actual taste and existing work. Replacing them would throw away good decisions. Extracting primitives that bake rules in is exactly the fix for "rules exist but aren't enforced."
- **Revisit when:** If rule sheets become contradictory or obstructive during primitive extraction, amendments are logged in the sheets themselves (not this log).

---

### D-009 — Target device for Year 1: tablet-landscape and up

- **Date:** 2026-04-20
- **Title:** Supported devices for Year 1
- **Context:** Show-floor order entry will happen on a mix of laptops and tablets. Phones are not a realistic target for order entry in Year 1.
- **Options considered:**
  1. Responsive design down to phones
  2. Laptop-only
  3. Laptop + tablet-landscape (~1024px+) as the supported range
- **Decision:** Option 3. Touch-friendly tap targets (≥44px) baked into primitives so tablet use is pleasant without a separate mobile track.
- **Revisit when:** If real Phase 3 usage reveals a concrete phone need.

---

### D-010 — Phase 2 staging environment = separate Azure SQL Database only; App Service slot deferred

- **Date:** 2026-04-27
- **Title:** Staging DB only for Phase 2; defer App Service slot
- **Context:** Phase 2 spec called for full staging environment (App Service slot + separate SQL DB). Operator currently runs both `mississippi-api` and `mississippi-web` on the **Free (F1) tier** App Service Plan. Free tier does not support deployment slots; slots require Standard (S1, ~$70/mo). Operator named **cost** as the constraint. Without the slot, you can't dress-rehearse a full deployment in Azure — but you *can* dress-rehearse schema migrations and risky data work against a separate DB at ~$5/month.
- **Options considered:**
  1. Upgrade App Service Plan to Standard (S1, ~$70/mo) and create a staging slot — full staging environment
  2. Stay on Free tier; create staging Azure SQL Database only (~$5/mo); test risky changes from localhost against staging DB before promoting to prod
  3. No staging at all (test everything against prod)
- **Decision:** Option 2 for Phase 2.
- **Reasoning:** Cost-effective protection for the highest-risk class of changes (schema migrations, bulk data work) at ~$5/month. Solo operator with no concurrent collaborators means localhost serves as the staging *app*; we just needed a separate staging *database*. The full slot setup adds value once real customer/order data is in production — which is Phase 3.
- **Action taken 2026-04-27:** Created `MississippiDB-Staging` (Basic tier, same server as production); ran full schema script; verified 14 tables match production.
- **Revisit when:** Start of Phase 3, when sales-order and customer data start accumulating in production. At that point, upgrade plan to S1, create production+staging slots, formalize the staging deploy step.

---

### D-011 — App Service tier upgrade deferred (Free → Basic/Standard)

- **Date:** 2026-04-27
- **Title:** Stay on Free tier App Service for Phase 2
- **Context:** Both `mississippi-api` and `mississippi-web` run on the F1 (Free) App Service Plan. Free tier limits: apps sleep after ~20 minutes of inactivity (5–30s cold-start on next request), no custom domains with SSL, 60 minutes CPU/day quota, no deployment slots, no production SLA. Acceptable for solo Phase 2 development; not acceptable for show-floor use by salespeople.
- **Options considered:**
  1. Upgrade to Basic (B1, ~$13/mo) now
  2. Upgrade to Standard (S1, ~$70/mo) now (would also enable slots → see D-010)
  3. Stay on Free; revisit before Phase 3 ships
- **Decision:** Option 3.
- **Reasoning:** Operator is the only user of the system right now. Cold starts are tolerable when the only user is the developer. Cost matters during pre-revenue Phase 2. The upgrade decision will be much clearer when an actual show-floor usage moment is on the calendar.
- **Revisit when:** Before Phase 3 ships — at the latest, before a salesperson hits the system at a show. Earlier if the cold-start delay becomes an active annoyance during Phase 2 development.

---

*Last updated: 2026-04-27*
