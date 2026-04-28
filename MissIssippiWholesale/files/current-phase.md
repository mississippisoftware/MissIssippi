# Current Phase

> **Purpose:** Living document showing exactly where we are right now. Update at the start and end of every working session. Refer to this *before* starting any task.

---

## Current Phase

**Phase number:** 2
**Phase name:** Foundation
**Started:** 2026-04-20 (planning) / 2026-04-27 (active work)
**Target ship date:** 2026-05-25 to 2026-06-08 (4–6 week window; ships on definition-of-done, not calendar)

> **Phase 1 closed 2026-04-20.** See `decisions-log.md` D-002 through D-009 and `phase-2-spec.md` for what was produced.

---

## Definition of Done

Phase 2 ships when **all** of the following are true. See `phase-2-spec.md` for full detail.

- [x] Azure SQL backup verified (PITR 7d + LTR 12 weekly) — 2026-04-27
- [x] Staging DB live (`MississippiDB-Staging`, 14 tables match production) — 2026-04-27
- [ ] ~~Staging App Service slot~~ — deferred to Phase 3 per **D-010**
- [ ] CI runs tests on every PR
- [ ] Auth working end-to-end (Microsoft Entra ID, single `owner` role)
- [ ] `User` table exists; `CreatedByUserId` FK pattern established on inventory tables
- [ ] Front-end primitives built and documented: `<PageLayout>`, `<PageHeader>`, `<Card>`, `<DataTable>`, `<Toolbar>`/`<FilterBar>`, `<FormField>`, `<Button>`, `<Badge>`, `<Modal>`, `<Drawer>`, `<SegmentedControl>`
- [ ] Inventory pages refactored to use only the new primitives (reference module)
- [ ] `design-audit.md` produced; each item fixed or logged to Parking Lot
- [ ] Backend integration tests (~10) covering inventory happy paths
- [ ] Frontend test harness configured with 2–3 sample tests
- [ ] CLAUDE.md updated with auth / transaction / error-handling sections
- [ ] DESIGN_SPEC.md updated with any rules discovered (form error / loading / empty states)
- [ ] Show-floor order-entry wireframe produced (design only; no code)
- [ ] Operator used refactored Inventory in real business for 3 working days without issue

---

## In Progress

- Nothing actively in flight. Last session ended after staging DB shipped.

---

## Blocked / Waiting

- Nothing blocked.

---

## Recently Shipped

### 2026-04-27 session
- Verified Azure SQL backup posture (PITR 7d, LTR 12 weekly)
- Logged decisions D-010 (staging DB only, defer slot) and D-011 (defer App Service tier upgrade)
- Created `MississippiDB-Staging` (Basic tier, ~$5/mo)
- Applied schema; verified 14 tables match production
- Saved canonical `Schema.md` to project knowledge (was missing before this session)
- Updated `parking-lot.md` with App Service tier upgrade item
- Added `current-app-state.md` Staging DB entry + corrected backup verification date

### Phase 1 (kickoff) — shipped 2026-04-20
- Team assembled (PM, Architect, UX/UI, Apparel Expert, GTM, QA)
- North Star refined (Year 1 = operator; Year 2+ = other brands)
- Scope locked (5 modules for Year 1; rest deferred)
- Existing schema reviewed and approved as foundation
- Existing rule sheets (CLAUDE.md, DESIGN_SPEC.md) adopted as "foundation constitution"
- Nine decisions logged (D-001 through D-009)
- `phase-2-spec.md` produced with full deliverables, responsibilities, non-goals, and risks

---

## Not Yet Started (this phase only)

- [ ] CI pipeline scaffold (GitHub Actions or Azure Pipelines — tests on every PR)
- [ ] Microsoft Entra ID app registration
- [ ] ASP.NET Core auth wiring + `User` table migration
- [ ] React login flow + topbar user chip
- [ ] Extract `<PageLayout>`, `<Card>`, `<DataTable>` (highest-leverage three)
- [ ] Extract remaining primitives
- [ ] Refactor Inventory pages to consume only primitives
- [ ] DESIGN_SPEC conformance audit → `design-audit.md`
- [ ] Backend integration test suite (~10 tests)
- [ ] Frontend test harness + 2–3 sample tests
- [ ] CLAUDE.md / DESIGN_SPEC.md addendums
- [ ] Show-floor order-entry wireframe (parallel track, UX Designer)
- [ ] Real-business usage of refactored Inventory (3 working days)

---

## Working Cadence (per operator's choice)

- **Sequencing:** Option B (parallel tracks). Architect/operator on infra+auth; UX Designer producing primitive specs in parallel.
- **Cadence:** Mixed — operator drives some tasks solo, requests step-by-step walkthroughs for others.

---

## Next Session — Open Choices

Operator picks one to start:
- **(a)** CI scaffold (GitHub Actions or Azure Pipelines)
- **(b)** Microsoft Entra ID app registration (auth precursor)
- **(c)** UX Designer presents `<PageLayout>` and `<Card>` specs for review (Track 2 parallel work)

---

## Session Log

### 2026-04-27
- Phase 2 active work began.
- Backup retention configured (PITR 7d, LTR 12 weekly).
- Created staging Azure SQL DB; applied schema; verified.
- Two decisions logged (D-010, D-011) reflecting cost-driven scope adjustments.
- Project knowledge updated: decisions-log, parking-lot, current-app-state, current-phase, Schema.md.
- **Next session:** operator picks (a) CI, (b) Entra ID app registration, or (c) review UX primitive specs.

### 2026-04-20
- Full kickoff completed. Team assembled. Scope and north star locked.
- Reviewed existing schema — approved.
- Reviewed existing rule sheets (CLAUDE.md, DESIGN_SPEC.md) — approved as foundation.
- Confirmed stack: .NET + React/TS + Azure SQL DB + App Service.
- Phase 2 spec written and saved to project.
- Nine decisions logged.

---

*Last updated: 2026-04-27*
