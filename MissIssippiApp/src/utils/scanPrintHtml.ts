import type { SkuLookupResult } from "./SkuInterfaces";
import type { iInventoryDisplayRow, iSize } from "./DataInterfaces";
import { printHtml } from "./printHtml";
import { formatSignedQty } from "./format";

type ScannedItem = SkuLookupResult & {
  delta: number;
  scans: number;
  direction: 1 | -1;
};

type BuildScanPrintHtmlArgs = {
  mode: "add" | "remove" | null;
  totalDelta: number;
  scannedItems: ScannedItem[];
  scanView: "list" | "table";
  sizeColumns: iSize[];
  scanTableRows: iInventoryDisplayRow[];
};

const formatTimestamp = (date: Date) =>
  date.toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

export const buildScanPrintHtml = ({
  mode,
  totalDelta,
  scannedItems,
  scanView,
  sizeColumns,
  scanTableRows,
}: BuildScanPrintHtmlArgs) => {
  const timestamp = formatTimestamp(new Date());
  const modeLabel =
    mode === "add" ? "Add Inventory" : mode === "remove" ? "Remove Inventory" : "Scan Inventory";
  const netChange = formatSignedQty(totalDelta);
  const itemCount = scannedItems.length;
  const itemLabel = `${itemCount} item${itemCount === 1 ? "" : "s"}`;
  const useTableView = scanView === "table" && sizeColumns.length > 0 && scanTableRows.length > 0;

  const tableHeader = useTableView
    ? `<tr><th>Season</th><th>Style</th><th>Color</th>${sizeColumns
        .map((size) => `<th>${size.sizeName}</th>`)
        .join("")}<th class="total">Total</th></tr>`
    : "<tr><th>SKU</th><th>Style</th><th>Color</th><th>Size</th><th class=\"qty\">Qty</th></tr>";

  const tableRows = useTableView
    ? scanTableRows
        .map((row) => {
          const sizeCells = sizeColumns
            .map((size) => `<td class="qty">${row.sizes[size.sizeName]?.qty ?? 0}</td>`)
            .join("");
          const rowTotal = sizeColumns.reduce(
            (sum, size) => sum + (row.sizes[size.sizeName]?.qty ?? 0),
            0
          );
          return `<tr><td>${row.seasonName ?? ""}</td><td>${row.itemNumber}</td><td>${row.colorName}</td>${sizeCells}<td class="total">${rowTotal}</td></tr>`;
        })
        .join("")
    : scannedItems
        .map((item) => {
          const qty = formatSignedQty(item.delta);
          return `<tr><td>${item.sku}</td><td>${item.itemNumber}</td><td>${item.colorName}</td><td>${item.sizeName}</td><td class="qty">${qty}</td></tr>`;
        })
        .join("");

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Scanned Items</title>
    <style>
      * { box-sizing: border-box; }
      body { font-family: "Segoe UI", Arial, sans-serif; color: #1f2937; margin: 24px; }
      h1 { font-size: 20px; margin: 0 0 4px 0; }
      .meta { color: #6b7280; font-size: 12px; margin-bottom: 16px; display: flex; gap: 12px; flex-wrap: wrap; }
      table { width: 100%; border-collapse: collapse; table-layout: fixed; }
      th, td { border: 1px solid #e5e7eb; padding: 6px 8px; font-size: 12px; text-align: left; }
      th { background: #f7f7f7; font-weight: 600; }
      th.qty, td.qty, th.total, td.total { text-align: center; }
      @media print { body { margin: 12mm; } }
    </style>
  </head>
  <body>
    <h1>Miss Issippi - Scanned Items</h1>
    <div class="meta">
      <span>${modeLabel}</span>
      <span>${timestamp}</span>
      <span>${itemLabel}</span>
      <span>Net change: ${netChange}</span>
    </div>
    <table>
      <thead>${tableHeader}</thead>
      <tbody>${tableRows}</tbody>
    </table>
  </body>
</html>`;
};

export const printScanHtml = (
  args: BuildScanPrintHtmlArgs,
  options?: { onError?: () => void }
) => {
  const html = buildScanPrintHtml(args);
  printHtml(html, options);
};
