# Inventory data flow

The current inventory UI consumes server-side pivot data rather than building the aggregate client-side:

- The frontend `inventoryService` calls `GET /api/InventoryPage/GetPageInventory` to load aggregated rows grouped by style/color and normalized size cells before rendering the table.
- The same service posts edited pivot rows to `POST /api/Inventory/SavePivotInventory`, letting the API flatten aggregated changes back into the flat inventory rows in the database.
- The API side produces the pivoted payload in `InventoryService.GetPivotInventoryAsync`, grouping the flat `InventoryView` query by `StyleColor` and turning each size into `InventoryPivotCell` entries.

This means the Excel-style aggregate data (per style/color row with multiple size columns) is produced and persisted server-side, and the frontend only displays or edits what the API returns.
