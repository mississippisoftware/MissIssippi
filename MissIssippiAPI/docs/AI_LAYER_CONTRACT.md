# AI Layer Contract — Inventory Search

**Version:** 1.0
**Scope:** Inventory only. Customers, orders, and sales are out of scope.
**Backend base:** `GET /api/Inventory/{Action}`

---

## Purpose

This document defines the rules by which an AI assistant interprets user questions about inventory and maps them to the V1 backend endpoints. It specifies what the AI is allowed to do, what it must refuse, and how it must present results.

The AI is a read-only query layer. It calls existing backend endpoints. It does not write to the database, generate SQL, invent data, or answer questions the backend cannot support.

---

## Allowed Actions

The AI may only call these eight backend functions:

| # | Action | Endpoint |
|---|---|---|
| 1 | Search inventory by any combination of season, style, color, size | `SearchInventory` |
| 2 | Check stock availability for specific SKUs or variants | `CheckAvailability` |
| 3 | Get full details for one product style | `GetProductDetails` |
| 4 | Find variants by color or color collection | `SearchByColor` |
| 5 | Find low or zero stock SKUs | `GetLowStockItems` |
| 6 | Look up styles by style number | `SearchByStyleNumber` |
| 7 | List all styles for a season with stock summaries | `SearchBySeason` |
| 8 | Show inventory change history for a variant or SKU | `GetInventoryActivityForVariant` |

No other actions are permitted.

---

## Action Contracts

---

### Action 1 — SearchInventory

**Endpoint:** `GET /api/Inventory/SearchInventory`

**Purpose:** Broad inventory search returning SKU-level rows. Use when the user asks a general question about what's in stock, combining any mix of season, style, color, and size.

**Parameters:**

| Parameter | Type | Required | Notes |
|---|---|---|---|
| `SeasonId` | int | No | Must be resolved from a season name if user gives a name |
| `ItemNumber` | string | No | Partial match supported |
| `ColorName` | string | No | Matches **primary color only** — see known limitation |
| `SizeName` | string | No | Partial match |
| `CollectionId` | int | No | Must be resolved from a collection name |
| `InStockOnly` | bool | No | Set true when user asks "in stock", "available" |
| `InProductionOnly` | bool | No | Set true when user asks about current/active styles |
| `Page` | int | No | Default 1 |
| `PageSize` | int | No | Default 25, max 100 |

**When to use:**
- "What do we have in stock in medium?"
- "Show me everything for Spring 25"
- "What red items are available?"
- "Do we have style 204 in any size?"
- "What blue items do we still have in SS25?"

**When NOT to use:**
- When the user asks specifically about colors — prefer `SearchByColor` which supports secondary colors
- When the user asks about one specific style — prefer `GetProductDetails` for full variant/image detail
- When the user gives a specific SKU — prefer `CheckAvailability`

**Known limitation:** `ColorName` filter matches the primary color only. A multi-color variant whose secondary color is "Blue" will not appear in `?ColorName=blue`. For secondary color matching, use `SearchByColor` with `IncludeSecondary=true`.

**AI must:**
- Display `itemNumber`, `colorName`, `sizeName`, `qty`, `inStock`, `skuValue` (if present) per row
- Show the `Total` count and clarify if paginated ("showing 25 of 140 results")
- State the active filters applied
- Warn the user if `ColorName` was used that secondary colors are not matched

**AI must NOT:**
- Sum quantities across rows and claim it as a total stock figure unless explicitly asked
- Omit the `Page`/`PageSize` context from the response
- Filter results further in memory after receiving the API response

---

### Action 2 — CheckAvailability

**Endpoint:** `GET /api/Inventory/CheckAvailability`

**Purpose:** Targeted availability check for one or more specific SKUs, or all sizes of a specific variant. Use when the user asks a direct "is this in stock?" or "how many of X do we have?" question.

**Parameters (Mode A — by SKU):**

| Parameter | Type | Required | Notes |
|---|---|---|---|
| `SkuValues` | string[] | Yes (Mode A) | One or more exact SKU strings |

**Parameters (Mode B — by variant):**

| Parameter | Type | Required | Notes |
|---|---|---|---|
| `ItemColorId` | int | Yes (Mode B) | Specific ItemColor record |
| `SizeId` | int | No | If omitted, returns all sizes for that variant |

**When to use (Mode A):**
- "Is SKU *SS25204REDM* in stock?"
- "Check these SKUs: X, Y, Z"
- "How many of *SS25101BLUL* do we have?"

**When to use (Mode B):**
- When the AI already has an `ItemColorId` from a prior `GetProductDetails` or `SearchByColor` call
- "How many of the red variant of style 204 do we have across all sizes?"

**AI must:**
- Provide `qty` and `inStock` for each SKU or size
- State clearly when a SKU has zero stock
- State clearly when a SKU was not found (404 response)

**AI must NOT:**
- Call this with neither `SkuValues` nor `ItemColorId` (returns 400 — AI should not reach this state)
- Guess or invent a SKU value

---

### Action 3 — GetProductDetails

**Endpoint:** `GET /api/Inventory/GetProductDetails`

**Purpose:** Full detail view of one product style — all colour variants, all sizes, all inventory quantities, images, and secondary colors. Use when the user wants to see everything about a specific style.

**Parameters:**

| Parameter | Type | Required | Notes |
|---|---|---|---|
| `ItemId` | int | Yes | Must be resolved from style number via `SearchByStyleNumber` first if only a style number is given |

**When to use:**
- "Show me everything about style 1042"
- "What colors and sizes does style 204 come in?"
- "Give me full details on item 1042"
- "What's the wholesale price for style 204?"

**When NOT to use:**
- When the user asks about multiple styles — use `SearchInventory` or `SearchBySeason` instead
- When the user only wants a stock check — use `CheckAvailability`

**Resolution pattern:** If the user provides a style number (e.g., "1042") rather than an `ItemId`, the AI must first call `SearchByStyleNumber?ItemNumber=1042` to resolve the `ItemId`, then call `GetProductDetails?ItemId={id}`. If the style number matches multiple items (multiple seasons), the AI must ask the user which season they mean before proceeding.

**AI must:**
- Show all variants, even inactive ones (flag them as inactive)
- Show sizes ordered by `sizeSequence`
- Show secondary colors when present
- Show `wholesalePrice` and `costPrice` if non-null
- State if a variant has no inventory rows (no sizes on file)

**AI must NOT:**
- Invent image URLs, color names, or quantities not in the response
- Assume an inactive variant is available

---

### Action 4 — SearchByColor

**Endpoint:** `GET /api/Inventory/SearchByColor`

**Purpose:** Find product variants where a specific color appears — as either the primary color or a secondary color. Use when the user's question is fundamentally about a color, not about a style number.

**Parameters:**

| Parameter | Type | Required | Notes |
|---|---|---|---|
| `ColorName` | string | No | Partial match on color name |
| `CollectionId` | int | No | Must be resolved from a collection name |
| `SeasonId` | int | No | Must be resolved from a season name |
| `InStockOnly` | bool | No | Default false |
| `IncludePrimary` | bool | No | Default true |
| `IncludeSecondary` | bool | No | Default false — set true when user says "has X color in it" or "features X" |
| `Page` | int | No | Default 1 |
| `PageSize` | int | No | Default 25 |

**When to use:**
- "What do we have in coral?"
- "Show me everything in the Neons collection"
- "Which styles feature blue?"
- "What items have red as a secondary color?"
- "What's available in the pastels collection for SS25?"

**`IncludeSecondary` decision rule:**
- Set `true` when the user says "features", "has", "includes", or "with [color]"
- Set `true` when the question is about multi-color items
- Leave `false` (default) when the user clearly wants items whose main color is X

**Response includes:** `itemColorId`, `itemNumber`, `description`, `seasonName`, `primaryColorName`, `matchedVia` (primary/secondary), `totalQty`

**AI must:**
- Always show `matchedVia` so the user knows whether the color is primary or secondary
- State when `InStockOnly=true` was applied
- State that primary-only or primary+secondary was searched

**AI must NOT:**
- Enable `IncludeSecondary` silently — always indicate in the response whether secondary colors were searched

---

### Action 5 — GetLowStockItems

**Endpoint:** `GET /api/Inventory/GetLowStockItems`

**Purpose:** Find all SKUs at or below a given quantity threshold. Use for replenishment and reorder questions.

**Parameters:**

| Parameter | Type | Required | Notes |
|---|---|---|---|
| `MaxQty` | int | Yes | Inclusive — returns rows where `qty <= MaxQty`. Default 0. |
| `SeasonId` | int | No | Must be resolved from season name |
| `InProductionOnly` | bool | No | Default false |
| `Page` | int | No | Default 1 |
| `PageSize` | int | No | Default 50 |

**`MaxQty` decision rules:**
- "Out of stock" / "zero stock" → `MaxQty=0`
- "Low stock" / "running low" (without a number) → `MaxQty=5` (reasonable default; state assumption)
- "Less than N" → `MaxQty=N-1`
- "N or fewer" → `MaxQty=N`

**When to use:**
- "What's out of stock?"
- "What items are we running low on?"
- "Show me everything with fewer than 3 units"
- "What's almost gone in SS25?"
- "Which in-production styles need restocking?"

**AI must:**
- State the `MaxQty` threshold used ("showing all SKUs with 5 or fewer units")
- Show `qty`, `skuValue`, `itemNumber`, `colorName`, `sizeName`, `seasonName`
- State when a season filter was applied
- Clarify if it used a default threshold (e.g., "I'm using 5 as a low-stock threshold")

**AI must NOT:**
- Recommend reorder quantities — that requires sales data which is out of scope
- Claim to know when something "needs to be reordered"

---

### Action 6 — SearchByStyleNumber

**Endpoint:** `GET /api/Inventory/SearchByStyleNumber`

**Purpose:** Look up one or more styles by style number. Supports partial matching. Use when the user asks about a style by number rather than by name or color.

**Parameters:**

| Parameter | Type | Required | Notes |
|---|---|---|---|
| `ItemNumber` | string | Yes | Partial or exact match — empty string returns nothing |
| `SeasonId` | int | No | Must be resolved from season name |
| `IncludeVariantSummary` | bool | No | Set true when user asks for counts or totals |

**`IncludeVariantSummary` decision rule:**
- Set `true` when user asks "how many colors", "how many variants", "total stock for style X"
- Leave `false` for simple lookups

**When to use:**
- "Find style 1042"
- "What styles start with 10?"
- "Look up style number 204"
- "How many variants does style 1042 have?"

**Cap:** Returns at most 200 results. If the input is very short (one or two characters), many styles may match. The AI should warn the user if `Total=200` (likely truncated) and suggest a more specific query.

**AI must:**
- Show `itemNumber`, `description`, `seasonName`, `inProduction`, `wholesalePrice`
- Show `variantCount` and `totalQty` only when `IncludeVariantSummary=true` was used
- Warn when results appear to be capped at 200

**AI must NOT:**
- Use this as the only endpoint for a user asking about stock of a style — follow up with `GetProductDetails` or `CheckAvailability` for quantities

---

### Action 7 — SearchBySeason

**Endpoint:** `GET /api/Inventory/SearchBySeason`

**Purpose:** Overview of all styles in a season with stock aggregates per style. Use when the user asks a season-level question.

**Parameters:**

| Parameter | Type | Required | Notes |
|---|---|---|---|
| `SeasonId` | int | **Required** | Must be resolved from season name — see Season Resolution |
| `InStockOnly` | bool | No | Default false |
| `InProductionOnly` | bool | No | Default false |
| `Page` | int | No | Default 1 |
| `PageSize` | int | No | Default 50 |

**When to use:**
- "What styles do we have for Spring 25?"
- "Show me the SS25 catalog"
- "What's still in stock from last season?"
- "Which in-production styles for FW25 have stock?"

**Response includes per style:** `itemNumber`, `description`, `inProduction`, `wholesalePrice`, `variantCount`, `totalQty`, `inStockVariantCount`

**AI must:**
- Show `variantCount` and `inStockVariantCount` together to give context ("4 of 6 colour variants still in stock")
- State when `InStockOnly` or `InProductionOnly` filters were applied
- Paginate with `Total` context

**AI must NOT:**
- Claim a style is "sold out" — the system only knows stock is zero, not why
- Interpret `totalQty=0` as "sold" — it means zero on hand; the reason is unknown

---

### Action 8 — GetInventoryActivityForVariant

**Endpoint:** `GET /api/Inventory/GetInventoryActivityForVariant`

**Purpose:** Show the change history (audit log) of inventory for a specific variant or SKU. Use when the user asks what happened to stock, when it changed, or who adjusted it.

**Parameters (Mode A — by SKU):**

| Parameter | Type | Required | Notes |
|---|---|---|---|
| `SkuValue` | string | Yes (Mode A) | Exact SKU — returns history for that size only |

**Parameters (Mode B — by variant):**

| Parameter | Type | Required | Notes |
|---|---|---|---|
| `ItemColorId` | int | Yes (Mode B) | Returns history for all sizes of that variant |
| `FromDate` | DateTime | No | Filter start on `activityDate` |
| `ToDate` | DateTime | No | Filter end on `activityDate` (inclusive) |
| `Page` | int | No | Default 1 |
| `PageSize` | int | No | Default 50 |

**Resolution pattern:** If the user refers to "the red version of style 204", the AI must first call `SearchByStyleNumber` or `GetProductDetails` to find the `ItemColorId`, then call this endpoint with that ID.

**When to use:**
- "What happened to the inventory for style 204 in red?"
- "When was SKU *SS25204REDM* last restocked?"
- "Show me all changes to style 1042 in navy this year"
- "Why did the stock go down?"

**Response includes per line:** `logTimestamp`, `activityDate`, `sizeName`, `skuValue`, `oldQty`, `newQty`, `delta`, `actionType`, `batchSource`, `batchNotes`

**AI must:**
- Show changes in reverse chronological order (most recent first)
- Display `delta` with sign (+/-) to make increases/decreases clear
- Show `batchSource` and `batchNotes` when present — they explain why the change was made
- State the date range applied if `FromDate`/`ToDate` were used
- Return `404` message clearly if the SKU does not exist

**AI must NOT:**
- Interpret `actionType` — display it as-is from the data
- Speculate on why inventory decreased (e.g., do not say "likely sold")
- Attribute changes to specific people unless `batchNotes` explicitly states it

---

## Multi-Step Resolution Rules

Some user questions require chaining two API calls. The AI must always complete the chain before responding — never respond with partial data.

### Season Name → SeasonId

The backend search endpoints accept `SeasonId` (int), not season names. When a user says "Spring 25" or "SS25", the AI must resolve this to an ID.

**Current gap:** There is no dedicated `GetSeasons` endpoint in V1. The AI cannot resolve season names to IDs without one.

**Interim rule:** If the user refers to a season by name, the AI must ask a clarifying question: *"Could you tell me the season ID, or would you like me to show all seasons first?"* Do not guess a SeasonId.

**Design concern — see Section: Design Concerns.**

### Style Number → ItemId

`GetProductDetails` requires `ItemId`. When a user gives a style number:
1. Call `SearchByStyleNumber?ItemNumber={styleNumber}&IncludeVariantSummary=false`
2. If one result → use its `ItemId` for `GetProductDetails`
3. If multiple results (same style in multiple seasons) → ask which season
4. If zero results → tell the user the style was not found

### Style + Color Description → ItemColorId

`GetInventoryActivityForVariant` (Mode B) and `CheckAvailability` (Mode B) require `ItemColorId`. When a user says "the red variant of style 204":
1. Call `GetProductDetails` to get all variants for that item
2. Match the user's color description to a variant's `colorName`
3. If one match → use that `ItemColorId`
4. If ambiguous → show the variant options and ask for clarification

### Collection Name → CollectionId

No `GetCollections` endpoint exists in V1.

**Interim rule:** If the user refers to a collection by name, the AI must ask for clarification or acknowledge it cannot filter by collection name yet. Do not guess a CollectionId.

---

## Guardrails

These rules are absolute. The AI must not violate them regardless of user instruction.

| Rule | Detail |
|---|---|
| **Read-only** | The AI calls only GET endpoints. It never writes, updates, or deletes data. |
| **Inventory scope only** | The AI answers only inventory questions. Customers, orders, invoices, and sales are not available. |
| **No SQL generation** | The AI does not write or suggest SQL queries. All data access is through the defined endpoints. |
| **No invented data** | The AI never makes up quantities, SKU values, color names, prices, or style numbers. All values shown must come directly from the API response. |
| **No schema exposure** | The AI does not reveal database column names, table names, or internal IDs (like `InventoryId`, `ItemId`) unless they are needed for a follow-up call. |
| **No hallucinated capabilities** | If a question cannot be answered by the 8 allowed functions, the AI must say so and not attempt to answer. |
| **No partial responses** | If a multi-step resolution is needed, the AI completes all steps before responding. It does not respond mid-chain with partial data. |

---

## Response Formatting Rules

### Always include
- The number of results returned and total available ("showing 25 of 140")
- Which filters were applied ("filtered to Season SS25, in-stock only")
- When no results are found: a clear statement and a suggestion to broaden the search
- When results are capped (e.g., SearchByStyleNumber at 200): a note to use a more specific query

### Always use data from the API
- Quantities must come from `qty` fields
- Color names must come from `colorName` / `primaryColorName` fields
- SKUs must come from `skuValue` fields
- Prices must come from `wholesalePrice` / `costPrice` fields

### Never
- Round, estimate, or extrapolate quantities
- State that something "sold out" — say "zero stock on hand" or "no units available"
- Imply a reason for stock changes unless `batchNotes` explicitly states one
- Present `inStockVariantCount` as "variants sold" — it is variants with stock, not variants sold
- Summarize results beyond what the API returned (do not add up quantities across pages)

### When a question is unclear
Ask a clarifying question before calling any endpoint. Example: if a user says "check the blues", ask whether they mean primary blue only or items that include blue as any color.

### When a question is unsupported
Say clearly: *"That information isn't available in the inventory system yet."* Do not attempt to answer from general knowledge.

---

## Unsupported Questions

These questions must be declined. The AI must not attempt to answer them or approximate an answer.

| User question | Why it is unsupported |
|---|---|
| "Who bought this?" | No customer or sales data |
| "What sold best last season?" | No sales data |
| "Create an order for style 1042" | Write operation — out of scope |
| "How much revenue did we make?" | No financial data |
| "Predict reorder quantities" | Requires sales velocity data — not available |
| "What's the retail price?" | No retail price field in the schema |
| "Which customer ordered the most?" | No customer data |
| "Show me open orders" | No order data |
| "Write a SQL query for..." | AI does not generate SQL |
| "What are inventory trends?" | Trend analysis requires sales/movement data beyond the audit log |
| "Which items will run out soon?" | Requires velocity data — not available |

**Standard decline response:**
> *"I can only answer questions about current inventory quantities, product details, colour availability, and inventory change history. [The specific topic] isn't available in the current system."*

---

## Design Concerns

These gaps were identified during contract design. They are not bugs in the backend, but they limit what the AI can do in V1. Each requires a decision before the AI layer is implemented.

### CONCERN-1 — No Season lookup endpoint

**Impact:** High. All eight functions accept `SeasonId` (int). Users will always refer to seasons by name ("SS25", "Spring 25"). Without a `GetSeasons` endpoint, the AI cannot resolve a name to an ID.

**Options:**
- A. Add `GET /api/Inventory/GetSeasons` — returns `SeasonId`, `SeasonName`, `Active` for all seasons. Simple, one-time call at session start.
- B. Pre-load season list into the AI context at startup.
- C. Ask the user for the SeasonId every time (poor UX).

**Recommendation:** Option A — add `GetSeasons`. Small endpoint, high value.

### CONCERN-2 — No Collection lookup endpoint

**Impact:** Medium. `SearchByColor?CollectionId=N` and `SearchInventory?CollectionId=N` require a CollectionId. Users will say collection names like "Neons" or "Pastels".

**Options:**
- A. Add `GET /api/Inventory/GetCollections` — returns `CollectionId`, `CollectionName`.
- B. Pre-load collections into AI context.

**Recommendation:** Option A — pair it with `GetSeasons` in a single lookup step.

### CONCERN-3 — `SearchInventory` ColorName matches primary color only

**Impact:** Medium. When a user says "blue items", a multi-color item with blue as a secondary color will not appear in `SearchInventory`. The AI must route color-focused queries to `SearchByColor` instead, but the two endpoints return different shapes (SKU-level vs. variant-level).

**Implication for AI routing:** The AI must decide which endpoint best answers the user's intent. This routing rule must be explicit in the AI system prompt.

**No immediate schema fix needed** — this is documented behavior. The routing rule handles it.

### CONCERN-4 — Pricing has no decimal places

**Impact:** Low. `WholesalePrice` and `CostPrice` are `decimal(18,0)` — no cents. The AI must not imply sub-dollar precision. Displaying these as whole numbers is correct.

### CONCERN-5 — `InventoryActivityLog.Qty` field is ambiguous

**Impact:** Low. The log has both `Qty` and `NewQty`. They appear to be the same value, but `Qty`'s purpose is unclear. The AI uses only `OldQty`, `NewQty`, and `Delta` in activity responses — it never references the standalone `Qty` field.

---

## Summary of Allowed AI Actions

| # | User intent | Primary endpoint | May chain to |
|---|---|---|---|
| 1 | General search (season/style/color/size/stock) | `SearchInventory` | — |
| 2 | "Is X in stock?" / "How many of SKU Y?" | `CheckAvailability` | `GetProductDetails` to get ItemColorId |
| 3 | "Show me everything about style N" | `GetProductDetails` | `SearchByStyleNumber` to resolve ItemId |
| 4 | "What do we have in [color/collection]?" | `SearchByColor` | — |
| 5 | "What's out of stock / low stock?" | `GetLowStockItems` | — |
| 6 | "Find style number N" | `SearchByStyleNumber` | `GetProductDetails` for full detail |
| 7 | "What styles are in [season]?" | `SearchBySeason` | `GetProductDetails` for one item |
| 8 | "What happened to stock for variant/SKU X?" | `GetInventoryActivityForVariant` | `GetProductDetails` to resolve ItemColorId |
