# Project Plan — MissIssippi AI Inventory Search

## Goal
Build an AI-powered inventory search tool for an apparel wholesale system.

## Current Scope
Inventory only. Customers, orders, and sales are out of scope.

---

## Steps

### Step 1 — Inventory Analysis ✅
Analyzed all models, entities, and database tables related to products, SKUs, colours, sizes, seasons, inventory quantities, and pricing. Identified weak and missing areas in the current design.

### Step 2 — Backend Function Design ✅
Designed V1 backend function contracts for inventory search:
- SearchInventory
- GetProductDetails
- CheckAvailability
- GetLowStockItems
- SearchByStyleNumber
- SearchByColor
- SearchBySeason
- GetInventoryActivityForVariant

Clearly marked functions excluded due to missing schema support.

### Step 3 — Implement SearchInventory and CheckAvailability ✅
Implemented two read-only endpoints in the existing `InventoryController` and `InventoryService`.

**Files changed:**
- `Models/InventorySearchModels.cs` — created (query + result DTOs)
- `Services/InventoryService.cs` — added `SearchInventoryAsync` and `CheckAvailabilityAsync`
- `Controllers/InventoryController.cs` — added `SearchInventory` and `CheckAvailability` actions

**Endpoints:**
- `GET /api/Inventory/SearchInventory`
- `GET /api/Inventory/CheckAvailability`

**Known limitation:** `SearchInventory` filters `ColorName` on the primary colour only. Secondary colour name matching is deferred to a later step.

### Step 4 — Expand Backend Functions (partial)
Implemented V1 functions from the Step 2 contracts in sub-steps.

**Sub-step 4a — GetProductDetails + SearchByColor ✅**

Files changed:
- `Models/InventorySearchModels.cs` — added DTOs: `ProductDetailsResult`, `ProductVariantDto`, `ProductVariantSizeDto`, `ProductVariantSecondaryColorDto`, `ProductVariantImageDto`, `SearchByColorQuery`, `SearchByColorRow`, `SearchByColorResult`
- `Services/InventoryService.cs` — added `GetProductDetailsAsync` and `SearchByColorAsync`
- `Controllers/InventoryController.cs` — added `GetProductDetails` and `SearchByColor` actions

Endpoints:
- `GET /api/Inventory/GetProductDetails`
- `GET /api/Inventory/SearchByColor`

**Sub-step 4b — GetLowStockItems + SearchByStyleNumber + SearchBySeason ✅**

Files changed:
- `Models/InventorySearchModels.cs` — added DTOs: `LowStockQuery`, `LowStockRow`, `LowStockResult`, `StyleNumberQuery`, `StyleNumberRow`, `StyleNumberResult`, `SearchBySeasonQuery`, `SearchBySeasonRow`, `SearchBySeasonResult`
- `Services/InventoryService.cs` — added `GetLowStockItemsAsync`, `SearchByStyleNumberAsync`, `SearchBySeasonAsync`
- `Controllers/InventoryController.cs` — added `GetLowStockItems`, `SearchByStyleNumber`, `SearchBySeason` actions

Endpoints:
- `GET /api/Inventory/GetLowStockItems`
- `GET /api/Inventory/SearchByStyleNumber`
- `GET /api/Inventory/SearchBySeason`

### Step 4 — Expand Backend Functions ✅

All V1 search functions implemented across sub-steps 4a and 4b (see above).

### Step 5 — GetInventoryActivityForVariant ✅

**Sub-step 5 — GetInventoryActivityForVariant**

Files changed:
- `Models/InventorySearchModels.cs` — added `InventoryActivityQuery`, `InventoryActivityRow`, `InventoryActivityResult`
- `Services/InventoryService.cs` — added `GetInventoryActivityForVariantAsync`
- `Controllers/InventoryController.cs` — added `GetInventoryActivityForVariant` action

Endpoint:
- `GET /api/Inventory/GetInventoryActivityForVariant`

Behaviour:
- If `SkuValue` provided: resolves to `(ItemColorId, SizeId)` via Sku table; returns history for that specific size only.
- If `ItemColorId` provided: returns history for all sizes of that variant.
- Either parameter is required; returns 400 if both omitted.
- Supports optional `FromDate`/`ToDate` filters on `InventoryActivityDate`.
- Ordered most-recent-first by `LogTimestamp`.
- Uses: `InventoryActivityLog`, `InventoryAdjustmentBatch`, `Sku`, `Size`.

### Step 6 — Test and Verify V1 Endpoints ✅

Inspected all 8 endpoints. Build is clean (no compiler errors in new code).
Test checklist written to `docs/V1_TEST_CHECKLIST.md`.

Issues found and resolved:
- ISSUE-1: `SearchInventory` SKU fetch is cartesian, not pair-keyed — deferred (efficiency only, no wrong data)
- ISSUE-2: `SearchByColor` ordering — ✅ fixed (`.OrderBy(id => id)` before combining)
- ISSUE-3: `CheckAvailability` empty input — ✅ fixed (returns 400)
- ISSUE-4: `GetInventoryActivityForVariant` unknown SKU — ✅ fixed (returns 404)
- ISSUE-5: Stale docs marker — ✅ fixed
- ISSUE-6: `SearchByStyleNumber` result cap — ✅ fixed (`.Take(200)` applied)

### Step 7 — Design AI Layer Contract ✅

Created `docs/AI_LAYER_CONTRACT.md`.

Defines:
- 8 allowed AI actions mapped to the 8 backend endpoints
- Per-action user question examples, parameter rules, and routing decisions
- Multi-step resolution rules (style number → ItemId, color description → ItemColorId)
- Guardrails (read-only, no SQL, no invented data, inventory scope only)
- Response formatting rules
- Unsupported question list with standard decline response

Design concerns identified (require decisions before implementation):
- CONCERN-1: No `GetSeasons` endpoint — AI cannot resolve season names to IDs
- CONCERN-2: No `GetCollections` endpoint — AI cannot resolve collection names to IDs
- CONCERN-3: `SearchInventory` ColorName matches primary color only — AI routing rule documented
- CONCERN-4: Pricing is `decimal(18,0)` — no cents
- CONCERN-5: `InventoryActivityLog.Qty` field is ambiguous — AI ignores it

### Step 8 — Add GetSeasons and GetCollections lookup endpoints ✅

Added two read-only AI routing lookup endpoints to the existing `InventoryController` and `InventoryService`.

**Why:** The AI layer needs to resolve user-friendly names ("SS25", "Neons") into `SeasonId` and `CollectionId` integers before calling inventory search functions. Resolves CONCERN-1 and CONCERN-2 from the AI Layer Contract.

**Files changed:**
- `Models/InventorySearchModels.cs` — added `SeasonLookupDto`, `CollectionLookupDto`
- `Services/InventoryService.cs` — added `GetSeasonsAsync`, `GetCollectionsAsync`
- `Controllers/InventoryController.cs` — added `GetSeasons`, `GetCollections` actions

**Endpoints:**
- `GET /api/Inventory/GetSeasons` — active seasons first, then by `SeasonDateCreated` descending
- `GET /api/Inventory/GetCollections` — alphabetical by `CollectionName`

**Not changed:** `SeasonController.GetSeasons` and `CollectionController.GetCollections` (used by existing app management UI).

### Step 9 — AI System Prompt and Routing Design ✅

Created `docs/AI_SYSTEM_PROMPT_AND_ROUTING.md`.

Contains:
- **Part 1 — System prompt:** Exact text for the AI `system` message. Covers role, capabilities, hard limits, data rules, result display rules, session setup, clarification rules, and tool chaining.
- **Part 2 — Tool definitions:** All 10 tools in Claude API `tool_use` JSON schema format (get_seasons, get_collections, search_inventory, check_availability, get_product_details, search_by_color, get_low_stock_items, search_by_style_number, search_by_season, get_inventory_activity).
- **Part 3 — Routing decision tree:** Full priority-ordered branch logic mapping any user question to the correct tool path.
- **Part 4 — Season/collection resolution:** Step-by-step name→ID resolution using loaded lookup data.
- **Part 5 — Clarification rules:** When to ask, when to default, when to refuse.
- **Part 6 — Response format templates:** Standard templates for each result type.
- **Part 7 — Hard boundaries:** Non-negotiable rules.
- **Part 8 — Tool call sequence examples:** Six end-to-end examples showing tool chains.

Unresolved design questions identified (Q1–Q6) — require decisions before implementation.

### Step 10 — Finalize AI Routing and Response Decisions ✅

Updated `docs/AI_SYSTEM_PROMPT_AND_ROUTING.md` to v1.1. All six unresolved design questions resolved and applied throughout the document.

**Decisions applied:**
- Q1: No auto-pagination. First page only. Tell user total and offer next page on request.
- Q2: Refresh `get_seasons` + `get_collections` at the start of every session.
- Q3: `costPrice` hidden from all AI responses. Wholesale price only.
- Q4: `batchNotes` hidden from all AI responses. Batch source only.
- Q5: Maximum 3 tool calls per user turn. Ask user to narrow if more would be needed.
- Q6: `search_inventory` is the default for combined questions. `search_by_color` only when color/collection is the primary subject OR secondary-color matching is needed.

**Document sections updated:** system prompt (DATA RULES, RESULT DISPLAY, SESSION SETUP, TOOL CHAINING), tool definitions (Tools 5 and 10), Part 3 routing tree (Q6 branch), Part 5 clarification rules (Q5 rule), Part 6 response templates (costPrice and batchNotes removed), Part 7 hard boundaries (3 new rows), "Unresolved Questions" section replaced with "AI Decision Summary".

### Step 11 — Implement AI Backend Layer (Mock Provider) ✅

Implemented the full AI backend endpoint using a provider-neutral structure. No paid API packages added. No API key required. Fully testable with the Mock provider.

**Files created:**
- `Models/AiModels.cs` — `AiAskRequest`, `AiAskResponse`, and internal conversation types (`AiConversation`, `AiMessage`, `AiTurnResponse`, `AiToolUse`, `AiToolResult`, `AiToolDefinition`)
- `Services/AI/IAiChatService.cs` — provider-neutral interface (`CompleteAsync`)
- `Services/AI/MockAiChatService.cs` — keyword-based mock; no API calls; routes questions to tools using pattern matching
- `Services/AI/InventoryAiService.cs` — orchestration loop, tool dispatch to `InventoryService`, 3-call cap, costPrice/batchNotes sanitization
- `Controllers/InventoryAiController.cs` — `POST /api/InventoryAi/Ask`
- `docs/AI_MANUAL_TEST.md` — 7 manual test examples with expected responses

**Files modified:**
- `Program.cs` — DI registration for `IAiChatService` (Mock by default) and `InventoryAiService`; provider selected via `Ai:Provider` config key
- `appsettings.json` — added `"Ai": { "Provider": "Mock", "ApiKey": "" }` section
- `appsettings.Development.json` — same section, `Provider=Mock`

**Endpoint:** `POST /api/InventoryAi/Ask`

**To add a real AI provider later:**
1. Implement `AnthropicAiChatService : IAiChatService`
2. Set `Ai:Provider=Anthropic` in config
3. Set `Ai:ApiKey` via .NET user secrets
4. No changes needed to controller, service, or tool dispatch

**Build:** Clean — zero CS compiler errors in new code.

### Step 12 — Manual Testing of Mock AI Endpoint ✅

Tested all 7 cases from `docs/AI_MANUAL_TEST.md` against the live API. All passed.

**Endpoint:** `POST /api/InventoryAi/Ask`

| # | Test | Result | Tool Called | Notes |
|---|---|---|---|---|
| 1 | General in-stock search | ✅ Pass | `search_inventory` | `inStockOnly=true` applied |
| 2 | Out-of-stock check | ✅ Pass | `get_low_stock_items` | Real records returned (2142 zero-stock SKUs) |
| 3 | Style number lookup | ✅ Pass | `search_by_style_number` | `variantCount` and `totalQty` populated |
| 4 | Color search | ✅ Pass | `search_by_color` | Real colour variants returned |
| 5 | Unsupported question | ✅ Pass | none | `unsupported=true`, no tool called |
| 6 | Season catalog | ✅ Pass | `get_seasons` | Returns live season data |
| 7a | Empty question | ✅ Pass | — | `400 Bad Request` |
| 7b | Null question | ✅ Pass | — | `400 Bad Request` |
| 7c | Missing question | ✅ Pass | — | `400 Bad Request` |

**Bug found and fixed:**
- `" revenue"` had a leading space in `UnsupportedKeywords` — "Revenue ..." at start of sentence was not caught. Fixed to `"revenue"` (one-character typo, no approval needed).

**Known limitations (not bugs):**
- `costPrice` and `batchNotes` sanitization cannot be live-tested via the mock because the mock never routes to `get_product_details` or returns populated `get_inventory_activity` results. Sanitization code is correct in static review. Will be verifiable when a real AI provider chains tool calls.
- The mock routes only one tool per question (no chaining). Multi-step chains (e.g., style number → product details) require a real AI provider.

**Build:** Clean — zero CS compiler errors.

### Step 13 — Add AI Response Limits and Summary Metadata ✅

Added four summary metadata fields to `AiAskResponse` so callers receive structured context without parsing the `Records` object. No inventory endpoint changes. No schema changes.

**Files changed:**
- `Models/AiModels.cs` — added `RecordCount`, `TotalAvailable`, `HasMore`, `LastToolUsed` to `AiAskResponse`
- `Services/AI/InventoryAiService.cs` — added `ExtractRecordMeta` method; wired into `BuildFinalResponse`

**New response fields:**

| Field | Type | Meaning |
|---|---|---|
| `recordCount` | int? | Items in this response page |
| `totalAvailable` | int? | Total matching records in DB |
| `hasMore` | bool | True when more pages exist |
| `lastToolUsed` | string? | Backend tool that produced `records` |

`ExtractRecordMeta` uses C# pattern matching to extract counts from all 10 result types. Falls through to `(null, null, false)` for error objects or unknown types.

**Build:** Clean — zero CS compiler errors.

### Step 14 — Next ⬅
