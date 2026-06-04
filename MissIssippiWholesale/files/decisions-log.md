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
- **Context:** Needed a way to maintain North Star, Scope, and other living docs across sessions, since Claude has no memory by default.
- **Options considered:** (1) Paste into every chat. (2) Use Claude memory. (3) Use a Claude Project with knowledge documents.
- **Decision:** Claude Project with markdown knowledge documents.
- **Reasoning:** Project automatically includes context; markdown is editable; no risk of state loss.
- **Revisit when:** Memory feature improves or project knowledge limits become a constraint.

---

### D-002 — Year 1 scope = 5 modules; reporting/accounting/roles/multi-tenancy deferred to Year 2+

- **Date:** 2026-04-20
- **Context:** Initial scope listed 9 modules across 8 phases. Year 1 vision only requires 5.
- **Options considered:** (1) Build all 9. (2) Lock to 5; defer rest. (3) Decide module-by-module.
- **Decision:** Option 2. Year 1 = Sales Orders, Customers, Purchasing & Suppliers, Invoicing & Payments, basic A/R.
- **Reasoning:** The 5 modules ARE the Year 1 workflow; the rest are leverage on a working workflow that doesn't exist yet.
- **Revisit when:** End of Phase 3, when real usage data exists.

---

### D-003 — Phase 2 = foundation only (no business modules)

- **Date:** 2026-04-20
- **Context:** Existing app has no auth, backups, staging, or tests. Foundation debt would compound across every business module.
- **Options considered:** (1) Build sales orders immediately. (2) Foundation-only Phase 2. (3) Parallel tracks.
- **Decision:** Option 2.
- **Reasoning:** Foundation debt compounds. Bounded 4–6 week timebox (now extended per D-015).
- **Revisit when:** If Phase 2 exceeds revised 10-week timebox, cut Phase 2 scope rather than extending indefinitely.

---

### D-004 — Keep existing schema; build on top, do not rebuild

- **Date:** 2026-04-20
- **Context:** Apparel Industry Expert reviewed schema. Item → ItemColor → Sku model is correct apparel structure.
- **Options considered:** (1) Rebuild schema. (2) Keep + add tables. (3) Partial rewrite.
- **Decision:** Option 2. Keep all 14 existing tables; add User in Phase 2; add Customer/SalesOrder/etc. in future phases.
- **Reasoning:** Schema quality is good. Rebuilding loses weeks for no user-visible improvement.
- **Revisit when:** If a future module exposes an unfixable schema constraint. Not expected in Year 1.

---

### D-005 — Minimal auth in Phase 2: one role (owner), salesperson seat reserved

- **Date:** 2026-04-20
- **Context:** Operator wanted full RBAC at outset. PM scoped down: solo operator now; salesperson role data-modeled but not built.
- **Options considered:** (1) Full RBAC now. (2) No auth in Phase 2. (3) Minimal auth + reserved seat.
- **Decision:** Option 3.
- **Reasoning:** Speculative features cost weeks before any business value. Reserved seat (role column + `CreatedByUserId` FKs) is ~1 day of work and avoids costly later migration.
- **Revisit when:** Operator is ready to invite first salesperson.

---

### D-006 — Tech stack confirmed: .NET + React/TypeScript + Azure SQL Database + App Service

- **Date:** 2026-04-20
- **Context:** Initial description ambiguous; later clarified.
- **Decision:** Stay on .NET 8 / React+Vite+TS / Azure SQL DB / App Service. No stack changes for Year 1.
- **Reasoning:** Coherent Microsoft-ecosystem stack; operator already productive.
- **Revisit when:** A specific scaling or capability need that the current stack genuinely cannot meet.

---

### D-007 — Auth provider: Microsoft Entra ID

- **Date:** 2026-04-20
- **Context:** Operator already uses Microsoft/Azure for everything.
- **Options considered:** (1) Microsoft Entra ID. (2) ASP.NET Core Identity (email/password). (3) Third-party (Auth0, Clerk).
- **Decision:** Option 1, with Microsoft.Identity.Web on the .NET side.
- **Reasoning:** First-party integration; SSO/MFA included; no roll-your-own auth risk.
- **Revisit when:** If Entra ID + SPA flow proves unworkable. Fallback is ASP.NET Core Identity.
- **Action taken 2026-04-27:** Entra ID app registration `MissIssippi` created. Single tenant, SPA platform, four redirect URIs, scope `access_as_user` enabled.

---

### D-008 — DESIGN_SPEC.md and CLAUDE.md are the "foundation constitution"

- **Date:** 2026-04-20
- **Context:** Existing rule sheets were assessed as good content but inconsistently enforced.
- **Decision:** Keep rule sheets; extract primitives that encode the rules by construction.
- **Note:** Per D-012, DESIGN_SPEC.md substantially rewritten. Per D-017 + Phase 2 plan, CLAUDE.md substantially expanded. The principle holds — rule sheets are governing.
- **Revisit when:** Rule sheets become contradictory or obstructive.

---

### D-009 — Target device for Year 1: tablet-landscape and up

- **Date:** 2026-04-20
- **Context:** Show-floor entry happens on laptops + tablets. Phones not realistic.
- **Decision:** Laptop + tablet-landscape (~1024px+). Touch-friendly tap targets (≥44px) baked in.
- **Revisit when:** Real Phase 3 usage reveals a phone need.

---

### D-010 — Phase 2 staging environment = separate Azure SQL Database only; App Service slot deferred

- **Date:** 2026-04-27
- **Context:** Free-tier App Services don't support deployment slots; Standard is $70/mo.
- **Options considered:** (1) Upgrade to Standard + slot. (2) Stay Free + staging DB only. (3) No staging.
- **Decision:** Option 2 for Phase 2.
- **Action taken 2026-04-27:** Created `MississippiDB-Staging` (Basic tier, same server). Schema deployed. 14 tables verified.
- **Revisit when:** Phase 3 start — upgrade to Standard + create slots.

---

### D-011 — App Service tier upgrade deferred (Free → Basic/Standard)

- **Date:** 2026-04-27
- **Context:** Free tier sleeps apps after ~20 minutes idle.
- **Decision:** Stay Free for Phase 2.
- **Revisit when:** Before Phase 3 ships, at the latest.

---

### D-012 — Adopt Booklytics-style visual identity for MissIssippi UI

- **Date:** 2026-04-27
- **Context:** Operator shared CSS from a different project ("Booklytics") matching their preference better than the existing DESIGN_SPEC.md.
- **Options considered:** (1) Keep existing identity. (2) Adopt Booklytics-style. (3) Mix elements.
- **Decision:** Option 2.
- **Reasoning:** Operator's own preference; established working CSS provides a concrete starting reference; tokens are semantic and well-organized.
- **Implication:** DESIGN_SPEC.md substantially rewritten in Phase 2.
- **Revisit when:** Operator finds the visual system isn't working in real use.

---

### D-013 — Switch frontend framework from PrimeReact to Ant Design; migrate existing pages

- **Date:** 2026-04-27
- **Context:** PrimeReact style overrides were fragile and inconsistently effective. Ant Design's `ConfigProvider` + design tokens API is more cooperative.
- **Options considered:** (1) Stay on PrimeReact. (2) Ant for new code only, parallel systems. (3) Full migration, no parallel systems. (4) Raw HTML+CSS.
- **Decision:** Option 3.
- **Reasoning:** Operator chose "go forward cleanly." Phase 2 is the cheapest moment — solo operator, only user, no production customer data yet. Parallel systems create forever-debt.
- **Implication:** Phase 2 timeline extends (D-015). PrimeReact removed after migration. **Migration shipped 2026-05-11.**
- **Revisit when:** N/A — shipped.

---

### D-014 — Adopt audit/persistence rules from Booklytics CLAUDE.md into MissIssippi CLAUDE.md

- **Date:** 2026-04-27
- **Context:** Operator shared a different project's CLAUDE.md with good audit/data-access rules.
- **Decision:** Selectively adopt: audit fields on every custom table, FK delete behavior (`NoAction`), migrations in CI/CD, EF Core+LINQ only.
- **Rules NOT adopted:** Booklytics' singular-table-name rule (conflicts with existing schema per D-004), specific FK naming, specific UserProfile structure.
- **Reasoning:** These rules prevent specific known failure modes.
- **Implication:** CLAUDE.md updated with Audit & Persistence Rules section.
- **Revisit when:** A specific rule proves unworkable.

---

### D-015 — Phase 2 timeline extends from 4–6 weeks to 6–10 weeks

- **Date:** 2026-04-27
- **Context:** D-013 added the full PrimeReact → Ant Design migration, which the original estimate didn't include.
- **Decision:** Phase 2 target extends to 6–10 weeks.
- **Ship gate, not calendar gate.**
- **Revisit when:** Mid-phase check at week 4.

---

### D-016 — Claude Code as bounded coding partner; spec-driven, not fire-and-forget

- **Date:** 2026-04-27
- **Context:** Unsupervised wholesale refactor produces code that compiles but is wrong in subtle ways.
- **Decision:** Use Claude Code for bounded tasks only — one component or page at a time, with clear spec and acceptance criteria.
- **Revisit when:** Workflow proves to be a bottleneck.

---

### D-017 — Skinny code is a project-wide principle

- **Date:** 2026-04-27
- **Context:** Operator stated: *"my goal is skinny, well-organized, clean code."*
- **Decision:** Adopt "Skinny Code Principle" as the top-level rule in CLAUDE.md, above architecture rules.
- **Key specifics:** Less code by default; Wrapper Rule; no speculative abstractions; one way to do each thing; deletion is normal workflow; accept framework defaults; ask before adding.
- **Reasoning:** Most codebase rot is additive. Thin code compounds positively.
- **Revisit when:** Never. If a specific sub-rule proves wrong, fix that rule; the principle stands.

---

### D-018 — Operating Principles adopted to correct over-cautious Architect default

- **Date:** 2026-05-11
- **Context:** During Phase 2 migration, the Architect repeatedly bounded sessions to single concerns and parked cross-cutting concerns. Net result: 14+ clean-shipping sessions with real drift accumulating between them — multiple toggle implementations, parallel CSS systems, wrapper proliferation, orphan CSS. Drift discovered only when operator spotted visual inconsistencies. Required a retrospective audit and multi-hour cleanup.
- **Options considered:** (1) Continue bounded-scope default; address drift reactively. (2) Document failure pattern; keep behavior. (3) Adopt explicit Operating Principles as CLAUDE.md Section 0.
- **Decision:** Option 3.
- **Key shifts:** Meta-goal (skinny code, one source of truth, consistency) takes precedence over bounded session scope. Bounded scope is a tool, not a default. Proactive drift detection via mini-audits. Adjacent decisions made explicitly when a foundational decision is made. Trade-offs named to operator; operator decides.
- **Implementation:** New Section 0 in `CLAUDE.md` (7 sub-sections, 0.1–0.7).
- **Revisit when:** Never. If a specific sub-principle proves wrong, fix it; the meta-correction stands.

---

### D-019 — Test database for xUnit integration tests: staging Azure SQL

- **Date:** 2026-06-03
- **Context:** Track F starting. Needed to choose between in-memory EF and staging Azure SQL for the WebApplicationFactory test database.
- **Options considered:**
  1. **In-memory EF** — fast, no network dependency, but misses SQL-specific constraints (unique indexes, check constraints, computed columns like `InStock`).
  2. **Staging Azure SQL (`MississippiDB-Staging`)** — real SQL behavior, validates actual constraints, but requires network + connection string secret in CI.
- **Decision:** Option 2 — staging Azure SQL.
- **Reasoning:** The existing schema has real constraints that matter (unique indexes, check constraints, persisted computed columns). In-memory EF would give false confidence on constraint-sensitive operations (duplicate SKU creation, inventory adjustments). The staging DB already exists, CI already has Azure secrets, and at ~10 tests the network overhead is not a concern. Revisit if the test suite grows large enough that latency becomes a bottleneck.
- **Implication:** CI will need the staging connection string added as a GitHub Actions secret. Tests must clean up after themselves (each test seeds and tears down its own data, or uses transactions rolled back at test end).
- **Revisit when:** Test suite grows to 100+ tests and network latency is measurably slowing the CI gate. At that point, evaluate a local SQL Server container (e.g., `testcontainers-dotnet`) as a middle path.

---

D-020 — Switch auth provider from Microsoft Entra ID to ASP.NET Core Identity

Date: 2026-06-04
Context: Entra ID adds frontend complexity (MSAL, redirect flows, app registration management) that isn't justified for a solo operator in Year 1. ASP.NET Core Identity with email + password is simpler to build, simpler to use, and simpler to maintain at this stage.
Options considered: (1) Keep Entra ID. (2) Switch to ASP.NET Core Identity.
Decision: Option 2.
Implications: Microsoft.Identity.Web removed from backend. MSAL removed from frontend plan. Entra ID app registration stays in Azure but goes unused for now. User table stays as-is (no EntraObjectId column needed). Track B respecified around ASP.NET Core Identity.
Revisit when: Year 2+, if multi-tenancy or SSO for external customers becomes a requirement

*Last updated: 2026-06-03 — D-019 added.*
