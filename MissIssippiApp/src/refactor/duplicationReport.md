# Frontend Duplication Report

Generated during incremental refactor planning for `MissIssippiApp/src`.

## Top 10 Duplicated Helpers / Blocks

1. `getErrorMessage(err, fallback)` helper
   - Files: `src/sizes/SizeList.tsx`, `src/seasons/SeasonList.tsx`, `src/skus/SkuList.tsx`, `src/prices/PriceList.tsx`, `src/inventory/InventoryScan.tsx`, `src/inventory/InventoryLabels.tsx`, `src/hooks/useCatalogLookups.ts`, `src/pages/itemsColors/useItemUpload.ts`, `src/pages/itemsColors/useColorUpload.ts`, `src/pages/itemsColors/useItemList.ts`, `src/stores/slices/inventoryMetaSlice.ts`, and others.
   - Extract to: `src/utils/errors.ts`

2. PrimeReact DataTable `EditorOptions<T>` local type
   - Files: `src/sizes/SizeList.tsx`, `src/seasons/SeasonList.tsx`, `src/colors/ColorList.tsx`, `src/pages/itemsColors/ItemsTable.tsx`
   - Extract to: `src/types/editor.ts`

3. CRUD row-edit DataTable wiring (`editingRows`, `onRowEditChange`, `onRowEditComplete`, `onRowEditCancel`)
   - Files: `src/sizes/SizeList.tsx`, `src/seasons/SeasonList.tsx` (similar pattern also appears in other catalog pages)
   - Extract to: `src/components/catalog/CatalogCrudTable.tsx`

4. CRUD catalog page state machine (load/refresh, temp negative IDs, delete modal selection, edit re-open on failed save)
   - Files: `src/sizes/SizeList.tsx`, `src/seasons/SeasonList.tsx`
   - Extract to: `src/hooks/useCatalogCrud.ts`

5. Bootstrap action row markup (`Row` + `Col` + repeated Add/Refresh button layout)
   - Files: `src/sizes/SizeList.tsx`, `src/seasons/SeasonList.tsx`, `src/pages/itemsColors/ItemsTable.tsx`, others
   - Reuse existing: `src/components/PageActionsRow.tsx`

6. XLSX file parse flow (read file -> first sheet -> headers -> row loop -> parse errors)
   - Files: `src/pages/itemsColors/useItemUpload.ts`, `src/pages/itemsColors/useColorUpload.ts`, `src/colors/ColorList.tsx`, `src/prices/PriceList.tsx`, `src/skus/SkuList.tsx`
   - Consolidate in: `src/hooks/useXlsxUpload.ts` (parsing-focused API)

7. Items/colors upload helper logic (`getConflictName`, `pickExistingColor`, color component grouping)
   - Files: `src/pages/itemsColors/useItemUpload.ts`, `src/pages/itemsColors/useColorUpload.ts`
   - Extract to: `src/pages/itemsColors/uploadShared.ts` (future pass)

8. Upload feedback UI blocks (parse error alerts, “rows ready”, upload summary alerts)
   - Files: `src/skus/SkuList.tsx`, `src/prices/PriceList.tsx`, `src/colors/ColorList.tsx`, `src/pages/itemsColors/ItemUploadActions.tsx`
   - Extract to: `src/components/uploads/UploadFeedbackPanel.tsx` (future pass)

9. Duplicate “source items by color name” accumulation for review flows
   - Files: `src/pages/itemsColors/useItemUpload.ts`, `src/pages/itemsColors/useColorUpload.ts`
   - Extract to: `src/pages/itemsColors/uploadColorSources.ts` (future pass)

10. Repeated delete confirmation modal pattern (same keyboard submit + cancel/delete buttons)
    - Files: `src/sizes/SizeList.tsx`, `src/seasons/SeasonList.tsx` (and similar patterns elsewhere)
    - Extract to: `src/components/catalog/CatalogDeleteConfirmModal.tsx` (future pass)

## Top 5 Biggest Files (by lines) and Why They Are Big

1. `src/colors/ColorList.tsx` (~1498 lines)
   - Mixed responsibilities: list UI, CRUD editing, upload parsing/execution, collection management, migration flow, export/print, similarity hints.

2. `src/pages/itemsColors/useItemUpload.ts` (~792 lines)
   - Heavy XLSX parsing + validation + color resolution + item/color creation/update orchestration + conflict recovery.

3. `src/pages/itemsColors/ItemsColorsPage.tsx` (~759 lines)
   - Page composition with many dialogs, table behaviors, upload/review flow wiring, and state orchestration.

4. `src/inventory/InventoryUpload.tsx` (~731 lines)
   - Large upload workflow UI plus parsing/validation/reporting interactions.

5. `src/pages/itemsColors/useColorResolution.ts` (~665 lines)
   - Color resolution memory, modal workflow, manual + upload review logic, and save orchestration.

## Recommended Extraction Targets (Exact File Names)

- `src/utils/errors.ts`
- `src/types/editor.ts`
- `src/hooks/useCatalogCrud.ts`
- `src/components/catalog/CatalogCrudTable.tsx`
- `src/components/catalog/CatalogDeleteConfirmModal.tsx` (optional follow-up)
- `src/hooks/useXlsxUpload.ts` (extend existing with parser-focused API)
- `src/colors/colorData.ts`
- `src/pages/itemsColors/uploadShared.ts` (future pass for shared color upload helpers)
- `src/components/uploads/UploadFeedbackPanel.tsx` (future pass)

