# AI Inventory Search — Manual Test Guide

**Endpoint:** `POST /api/InventoryAi/Ask`
**Base URL (dev):** `http://localhost:5139`
**Swagger:** `http://localhost:5139/swagger`
**Provider:** Mock (no API key required — set `Ai:Provider=Mock` in appsettings)

All requests send JSON with a `question` field. All responses include `answer`, `toolCallsUsed`, `records`, `clarificationNeeded`, and `unsupported`.

---

## How to test (no API key needed)

The API is running on the Mock provider. Send any POST request to `/api/InventoryAi/Ask` with a plain-English question. The mock uses keyword matching to route to the correct backend tool, runs the real database query, and returns:

- `answer` — a mock summary (real text when a live AI provider is connected)
- `toolCallsUsed` — which backend tools were called
- `records` — the actual structured data returned from the database
- `clarificationNeeded` — true if the question was too vague
- `unsupported` — true if the question is outside inventory scope

---

## Test 1 — General inventory search (in stock)

**Request:**
```http
POST /api/InventoryAi/Ask
Content-Type: application/json

{
  "question": "What do we have available in stock?"
}
```

**Expected routing:** `search_inventory` with `inStockOnly=true`

**Expected `toolCallsUsed`:** `["search_inventory"]`

**Expected `records`:** Paginated list of in-stock inventory rows with `itemNumber`, `colorName`, `sizeName`, `qty`, `skuValue`.

---

## Test 2 — Low stock / out-of-stock check

**Request:**
```http
POST /api/InventoryAi/Ask
Content-Type: application/json

{
  "question": "What items are out of stock?"
}
```

**Expected routing:** `get_low_stock_items` with `maxQty=0`

**Expected `toolCallsUsed`:** `["get_low_stock_items"]`

**Expected `records`:** Items with `qty=0`, ordered lowest first.

---

## Test 3 — Style number lookup with variant summary

**Request:**
```http
POST /api/InventoryAi/Ask
Content-Type: application/json

{
  "question": "Show me style 1042 with all variant details"
}
```

**Expected routing:** `search_by_style_number` with `itemNumber="1042"`, `includeVariantSummary=true`

**Expected `toolCallsUsed`:** `["search_by_style_number"]`

**Expected `records`:** List of matching styles with `variantCount` and `totalQty`.

---

## Test 4 — Color search

**Request:**
```http
POST /api/InventoryAi/Ask
Content-Type: application/json

{
  "question": "What do we have in blue?"
}
```

**Expected routing:** `search_by_color` with `colorName="blue"`

**Expected `toolCallsUsed`:** `["search_by_color"]`

**Expected `records`:** Variant-level results showing `primaryColorName`, `matchedVia`, `totalQty`.

---

## Test 5 — Unsupported question

**Request:**
```http
POST /api/InventoryAi/Ask
Content-Type: application/json

{
  "question": "Which customer bought the most last season?"
}
```

**Expected:** No tool calls. `unsupported=true`.

**Expected `answer`:** "I can only answer questions about current inventory quantities..."

**Expected `toolCallsUsed`:** `[]`

---

## Test 6 — Season overview

**Request:**
```http
POST /api/InventoryAi/Ask
Content-Type: application/json

{
  "question": "Show me the season catalog"
}
```

**Expected routing:** `get_seasons` (returns all loaded seasons)

**Expected `toolCallsUsed`:** `["get_seasons"]`

**Expected `records`:** List of seasons with `seasonId`, `seasonName`, `active`.

---

## Test 7 — Empty question (validation)

**Request:**
```http
POST /api/InventoryAi/Ask
Content-Type: application/json

{
  "question": ""
}
```

**Expected:** `400 Bad Request` — "Question is required."

---

## Response structure reference

```json
{
  "answer": "string — AI text response (mock summary or real AI text)",
  "toolCallsUsed": ["tool_name_1", "tool_name_2"],
  "records": { /* last tool result, sanitized */ },
  "clarificationNeeded": false,
  "unsupported": false
}
```

**Sanitization applied to all responses:**
- `costPrice` is always `null` in product detail records (Q3 decision)
- `batchNotes` is always `null` in inventory activity records (Q4 decision)

---

## Switching to a real AI provider (future)

When a real provider is implemented:

1. Add `Ai:Provider=Anthropic` to appsettings or environment
2. Add `Ai:ApiKey=your-key` via .NET user secrets (never in source):
   ```
   dotnet user-secrets set "Ai:ApiKey" "sk-ant-..."
   ```
3. Implement `AnthropicAiChatService : IAiChatService` and register it in `Program.cs`
4. The `InventoryAiController`, `InventoryAiService`, and all tool dispatch code require no changes

The `answer` field will then contain real natural language from the AI instead of the mock template.
