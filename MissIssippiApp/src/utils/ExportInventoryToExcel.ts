import type { iInventoryDisplayRow, iSize } from "./DataInterfaces";
import type { FilterableColumn } from "../inventory/InventoryTable";
import {
  appendSheet,
  buildTimestampedFilename,
  createWorkbook,
  sheetFromAoa,
  writeWorkbook,
} from "./xlsxUtils";

interface ExportArgs {
  rows: iInventoryDisplayRow[];
  sizeColumns: iSize[];
  uiColumns: FilterableColumn[];
  title?: string;
  sheetName?: string;
  filename?: string;
}

export function exportInventoryToExcel({
  rows,
  sizeColumns,
  uiColumns,
  title = "Inventory Download",
  sheetName = "Inventory",
  filename,
}: ExportArgs) {
  if (!rows || rows.length === 0) return;

  const now = new Date();
  const timestamp = `Downloaded: ${now.toLocaleString()}`;

  // Column order matches your table: filteredColumns first, then sizeColumns
  const headers = [
    ...uiColumns.map((c) => c.header),
    ...sizeColumns.map((s) => s.sizeName),
  ];

  const dataRows = rows.map((r) => ([
    ...uiColumns.map((c) => (r as any)[c.field] ?? ""),
    ...sizeColumns.map((s) => r.sizes?.[s.sizeName]?.qty ?? 0),
  ]));

  // Title + timestamp + blank row + headers + data
  const aoa: any[][] = [
    [title],
    [timestamp],
    [],
    headers,
    ...dataRows,
  ];

  const ws = sheetFromAoa(aoa);

  // Merge title/timestamp across all columns
  const lastCol = Math.max(headers.length - 1, 0);
  (ws as any)["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: lastCol } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: lastCol } },
  ];

  const wb = createWorkbook();
  appendSheet(wb, ws, sheetName);

  const safeDefault = buildTimestampedFilename("inventory", now);

  writeWorkbook(wb, filename || safeDefault);
}
