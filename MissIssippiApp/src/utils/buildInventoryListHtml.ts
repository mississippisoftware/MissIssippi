import type { iInventoryDisplayRow, iSize } from "./DataInterfaces";
import type { FilterableColumn } from "../inventory/InventoryTable";

type BuildInventoryListHtmlArgs = {
  title: string;
  subtitle?: string;
  rows: iInventoryDisplayRow[];
  sizeColumns: iSize[];
  uiColumns: FilterableColumn[];
  timestamp: string;
};

export const buildInventoryListHtml = ({
  title,
  rows,
  sizeColumns,
  uiColumns,
  timestamp,
}: BuildInventoryListHtmlArgs): string => {
  const headerCells = [
    ...uiColumns.map((col) => `<th>${col.header}</th>`),
    ...sizeColumns.map((size) => `<th>${size.sizeName}</th>`),
  ].join("");

  const bodyRows = rows
    .map((row) => {
      const baseCells = uiColumns
        .map((col) => `<td>${row[col.field as keyof iInventoryDisplayRow] ?? ""}</td>`)
        .join("");
      const sizeCells = sizeColumns
        .map((size) => `<td>${row.sizes?.[size.sizeName]?.qty ?? 0}</td>`)
        .join("");
      return `<tr>${baseCells}${sizeCells}</tr>`;
    })
    .join("");

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${title}</title>
    <style>
      * { box-sizing: border-box; }
      body { font-family: "Segoe UI", Arial, sans-serif; color: #111827; margin: 24px; }
      h1 { font-size: 20px; margin: 0 0 4px 0; }
      .timestamp { color: #6b7280; font-size: 12px; margin-bottom: 16px; }
      table { width: 100%; border-collapse: collapse; table-layout: fixed; }
      th, td { border: 1px solid #e5e7eb; padding: 6px 8px; font-size: 12px; text-align: center; }
      th { background: #f8fafc; font-weight: 600; }
      td:first-child, th:first-child { text-align: left; }
    </style>
  </head>
  <body>
    <h1>${title}</h1>
    <div class="timestamp">${timestamp}</div>
    <table>
      <thead>
        <tr>${headerCells}</tr>
      </thead>
      <tbody>
        ${bodyRows}
      </tbody>
    </table>
  </body>
</html>`;
};
