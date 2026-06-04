# V1 Inventory Search — Backend Test Checklist

**Base URL (dev):** `http://localhost:5139`
**Swagger:** `http://localhost:5139/swagger`

All endpoints are on `GET /api/Inventory/{Action}`.

---

## Files Inspected

| File | Lines read |
|---|---|
| `Controllers/InventoryController.cs` | Full file |
| `Services/InventoryService.cs` | Lines 511–1341 (all 8 new methods) |
| `Models/InventorySearchModels.cs` | Full file |
| `docs/PROJECT_PLAN.md` | Full file |
| `Properties/launchSettings.json` | Full file |

---

## Issues Found

### ISSUE-1 — `SearchInventory`: SKU fetch uses cartesian filter, not pair filter
**Severity:** Low (efficiency only, no incorrect data)
**Location:** `Services/InventoryService.cs` around the `skuMap` build
**Detail:** The SKU lookup filters `pageItemColorIds.Contains(s.ItemColorId) && pageSizeIds.Contains(s.SizeId)`. This is two independent IN clauses, not an (ItemColorId, SizeId) pair filter. Extra rows may be fetched from the DB. The `skuMap` dictionary keyed on `(ItemColorId, SizeId)` ensures only the correct SKU is used per row — so no wrong data is returned, just a slightly over-broad DB read.
**Recommendation:** List for fix in a future step. One-line change to a join.

### ISSUE-2 — `SearchByColor`: ordering within pages is non-deterministic ✅ FIXED
**Severity:** Medium (pagination consistency)
**Fix:** Both `primaryMatchIds` and `secondaryMatchIds` are now sorted with `.OrderBy(id => id)` before being combined into the paginated list. Pagination is now deterministic and stable across calls.

### ISSUE-3 — `CheckAvailability`: no validation when both inputs are omitted ✅ FIXED
**Fix:** Controller now returns `400 Bad Request: "Either SkuValues or ItemColorId is required."` when neither parameter is provided. Return type changed from `Task<CheckAvailabilityResult>` to `Task<IActionResult>`.

### ISSUE-4 — `GetInventoryActivityForVariant`: unknown SKU returns 200 empty instead of 404 ✅ FIXED
**Fix:** Service method return type changed to `Task<InventoryActivityResult?>`. When `SkuValue` is provided but not found in the Sku table, the service returns `null`. Controller returns `404 Not Found: "SKU '{value}' not found."` when the result is null.

### ISSUE-5 — `PROJECT_PLAN.md`: stale `⬅ CURRENT` marker on Step 4
**Severity:** Docs only
**Detail:** Step 4 appears twice — once with `⬅ CURRENT` (stale, from partial editing) and once as `✅`. Step 4 is complete.
**Fix:** Tiny docs cleanup. Fixing now — see PROJECT_PLAN.md update.

### ISSUE-6 — `SearchByStyleNumber`: no result size cap ✅ FIXED
**Fix:** Added `.Take(200)` before `.ToListAsync()` in the service. A broad partial match can now return at most 200 items. `StyleNumberResult.Total` reflects the capped count. Use a more specific style number to narrow results if needed.

---

## Verdict

**Step 6 passes.** All approved fixes applied (Issues 2, 3, 4, 6). No correctness bugs that produce wrong data remain. Issue 1 (SearchInventory SKU over-fetch) is deferred — efficiency only, no wrong data. Issue 5 (stale docs marker) was a docs-only fix.

---

## Manual Test Checklist

Run these in Swagger (`http://localhost:5139/swagger`) or a browser.

---

### 1. SearchInventory

**Endpoint:** `GET /api/Inventory/SearchInventory`

| Test | URL | Expected |
|---|---|---|
| No filters (first page) | `/api/Inventory/SearchInventory?Page=1&PageSize=10` | Returns up to 10 rows, `Total` reflects full count. Each row has `skuValue`, `itemNumber`, `colorName`, `sizeName`, `qty`, `inStock`, `inProduction`. |
| Filter by season | `/api/Inventory/SearchInventory?SeasonId=1&PageSize=25` | Only rows from that season. |
| In-stock only | `/api/Inventory/SearchInventory?InStockOnly=true&PageSize=25` | All rows have `qty > 0` and `inStock = true`. |
| Filter by color name | `/api/Inventory/SearchInventory?ColorName=red&PageSize=25` | Matches primary color only (known limitation). |
| Filter by item number | `/api/Inventory/SearchInventory?ItemNumber=10&PageSize=25` | Partial match — any style containing "10". |
| Page 2 | `/api/Inventory/SearchInventory?Page=2&PageSize=10` | Returns items 11–20. `Page=2`, `PageSize=10` in response. |
| In-production only | `/api/Inventory/SearchInventory?InProductionOnly=true&PageSize=25` | Only items where `inProduction=true`. |

---

### 2. CheckAvailability

**Endpoint:** `GET /api/Inventory/CheckAvailability`

| Test | URL | Expected |
|---|---|---|
| By SKU value | `/api/Inventory/CheckAvailability?SkuValues=*SS251BLUM*` | Replace with a real SKU. Returns `Results` array with 1 row. |
| Multiple SKUs | `/api/Inventory/CheckAvailability?SkuValues=SKU1&SkuValues=SKU2` | Returns up to 2 rows. |
| By ItemColorId (all sizes) | `/api/Inventory/CheckAvailability?ItemColorId=1` | Returns one row per size for that variant. Ordered by `SizeSequence`. |
| By ItemColorId + SizeId | `/api/Inventory/CheckAvailability?ItemColorId=1&SizeId=2` | Returns exactly one row. |
| No params *(Issue 3)* | `/api/Inventory/CheckAvailability` | Currently returns `200` with empty `Results`. Should be `400` (pending fix). |

---

### 3. GetProductDetails

**Endpoint:** `GET /api/Inventory/GetProductDetails`

| Test | URL | Expected |
|---|---|---|
| Valid item | `/api/Inventory/GetProductDetails?ItemId=1` | Returns full detail: item fields + `Variants` array. Each variant has `Sizes`, `SecondaryColors`, `Images`. |
| Invalid item | `/api/Inventory/GetProductDetails?ItemId=99999` | `404 Not Found`. |
| Missing param | `/api/Inventory/GetProductDetails?ItemId=0` | `400 Bad Request`. |
| Item with no variants | Use an ItemId that has no ItemColors | Returns item fields with empty `Variants` array. |

---

### 4. SearchByColor

**Endpoint:** `GET /api/Inventory/SearchByColor`

| Test | URL | Expected |
|---|---|---|
| By color name | `/api/Inventory/SearchByColor?ColorName=blue&PageSize=25` | Rows where primary color contains "blue". `MatchedVia="primary"`. |
| Include secondary | `/api/Inventory/SearchByColor?ColorName=blue&IncludeSecondary=true&PageSize=25` | May return additional rows where blue is a secondary color. `MatchedVia="secondary"`. |
| In stock only | `/api/Inventory/SearchByColor?ColorName=red&InStockOnly=true` | Only variants with `TotalQty > 0`. |
| By collection | `/api/Inventory/SearchByColor?CollectionId=1&PageSize=25` | All active variants whose primary color belongs to that collection. |
| No filters | `/api/Inventory/SearchByColor?PageSize=10` | Returns first 10 active variants. *(Note: ordering is non-deterministic — Issue 2.)* |
| Both flags false | `/api/Inventory/SearchByColor?IncludePrimary=false&IncludeSecondary=false` | Returns empty result immediately (guard clause). |

---

### 5. GetLowStockItems

**Endpoint:** `GET /api/Inventory/GetLowStockItems`

| Test | URL | Expected |
|---|---|---|
| Out of stock only | `/api/Inventory/GetLowStockItems?MaxQty=0&PageSize=50` | Only rows where `qty = 0`. Ordered by qty ascending. |
| Low stock threshold | `/api/Inventory/GetLowStockItems?MaxQty=5&PageSize=50` | Rows where `qty <= 5`, lowest qty first. |
| Scoped to season | `/api/Inventory/GetLowStockItems?MaxQty=3&SeasonId=1&PageSize=50` | Low-stock rows for that season only. |
| In production only | `/api/Inventory/GetLowStockItems?MaxQty=0&InProductionOnly=true` | Only in-production styles. |
| Page 2 | `/api/Inventory/GetLowStockItems?MaxQty=10&Page=2&PageSize=25` | Items 26–50. |

---

### 6. SearchByStyleNumber

**Endpoint:** `GET /api/Inventory/SearchByStyleNumber`

| Test | URL | Expected |
|---|---|---|
| Partial match | `/api/Inventory/SearchByStyleNumber?ItemNumber=10` | All styles containing "10" in the number, all seasons. |
| Exact match | `/api/Inventory/SearchByStyleNumber?ItemNumber=1042` | Only styles with number "1042". |
| With season filter | `/api/Inventory/SearchByStyleNumber?ItemNumber=10&SeasonId=1` | Partial match scoped to season. |
| With variant summary | `/api/Inventory/SearchByStyleNumber?ItemNumber=1042&IncludeVariantSummary=true` | Rows include `variantCount` and `totalQty` (non-null). |
| Without variant summary | `/api/Inventory/SearchByStyleNumber?ItemNumber=1042` | `variantCount` and `totalQty` are null. |
| Empty input | `/api/Inventory/SearchByStyleNumber` | Returns empty result (guard clause on empty `ItemNumber`). |

---

### 7. SearchBySeason

**Endpoint:** `GET /api/Inventory/SearchBySeason`

| Test | URL | Expected |
|---|---|---|
| Valid season | `/api/Inventory/SearchBySeason?SeasonId=1&PageSize=50` | Returns items for that season. Each row has `variantCount`, `totalQty`, `inStockVariantCount`. |
| In stock only | `/api/Inventory/SearchBySeason?SeasonId=1&InStockOnly=true` | Only items with `totalQty > 0`. |
| In production only | `/api/Inventory/SearchBySeason?SeasonId=1&InProductionOnly=true` | Only `inProduction=true` items. |
| Both filters | `/api/Inventory/SearchBySeason?SeasonId=1&InStockOnly=true&InProductionOnly=true` | In-production AND in-stock. |
| Missing SeasonId | `/api/Inventory/SearchBySeason` | `400 Bad Request: "SeasonId is required."` |
| SeasonId=0 | `/api/Inventory/SearchBySeason?SeasonId=0` | `400 Bad Request`. |

---

### 8. GetInventoryActivityForVariant

**Endpoint:** `GET /api/Inventory/GetInventoryActivityForVariant`

| Test | URL | Expected |
|---|---|---|
| By ItemColorId | `/api/Inventory/GetInventoryActivityForVariant?ItemColorId=1` | Returns log lines for all sizes of that variant. Ordered most-recent-first by `logTimestamp`. |
| By SKU value | `/api/Inventory/GetInventoryActivityForVariant?SkuValue=*SS251BLUM*` | Resolves SKU to (ItemColorId, SizeId). Returns logs for that size only. |
| Date range | `/api/Inventory/GetInventoryActivityForVariant?ItemColorId=1&FromDate=2025-01-01&ToDate=2025-12-31` | Only logs where `activityDate` is in range. |
| Unknown SKU *(Issue 4)* | `/api/Inventory/GetInventoryActivityForVariant?SkuValue=DOESNOTEXIST` | Currently returns `200` empty. Should ideally return `404` (pending fix). |
| No params | `/api/Inventory/GetInventoryActivityForVariant` | `400 Bad Request: "Either SkuValue or ItemColorId is required."` |
| Pagination | `/api/Inventory/GetInventoryActivityForVariant?ItemColorId=1&Page=2&PageSize=20` | Page 2, items 21–40. `Total` reflects full log count. |

---

## Known Limitations (by design, not bugs)

| Endpoint | Limitation |
|---|---|
| `SearchInventory` | `ColorName` filter matches primary colour only. Secondary-colour matching not supported. |
| `SearchByStyleNumber` | No pagination. All matching styles returned in one response. |
| `SearchByColor` | `Total` count is computed before DB detail fetch; within-group ordering is non-deterministic (Issue 2). |
| `SearchBySeason` | All items for the season loaded from DB before in-memory filter/pagination. Fine for bounded catalog. |
