import type { ItemView } from "../service/CatalogService";
import { formatPrintTimestamp } from "./dateFormat";

type BuildPriceListHtmlArgs = {
  rows: ItemView[];
  formatPrice: (value?: number | null) => string;
};

const escapeHtml = (value: unknown) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export const buildPriceListHtml = ({ rows, formatPrice }: BuildPriceListHtmlArgs): string => {
  const timestamp = formatPrintTimestamp();

  const bodyRows = rows
    .map((row) => {
      const wholesale = row.wholesalePrice == null ? "--" : formatPrice(row.wholesalePrice);
      const retail = row.costPrice == null ? "--" : formatPrice(row.costPrice);
      return `<tr>
  <td>${escapeHtml(row.seasonName ?? "")}</td>
  <td>${escapeHtml(row.itemNumber ?? "")}</td>
  <td>${escapeHtml(row.description ?? "")}</td>
  <td class="num">${escapeHtml(wholesale)}</td>
  <td class="num">${escapeHtml(retail)}</td>
</tr>`;
    })
    .join("");

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Price List</title>
    <style>
      * { box-sizing: border-box; }
      body { font-family: "Segoe UI", Arial, sans-serif; color: #111827; margin: 24px; }
      h1 { font-size: 20px; margin: 0 0 4px 0; }
      .timestamp { color: #6b7280; font-size: 12px; margin-bottom: 14px; }
      table { width: 100%; border-collapse: collapse; }
      th, td { border: 1px solid #d1d5db; padding: 8px 10px; font-size: 12px; text-align: left; }
      th { background: #f8fafc; font-weight: 700; }
      td.num { text-align: right; white-space: nowrap; }
      tbody tr:nth-child(even) { background: #fcfcfd; }
      @media print {
        body { margin: 12px; }
        th { background: #fff; }
      }
    </style>
  </head>
  <body>
    <h1>Price List</h1>
    <div class="timestamp">${timestamp}</div>
    <table>
      <thead>
        <tr>
          <th>Season</th>
          <th>Style</th>
          <th>Description</th>
          <th>Wholesale</th>
          <th>Retail</th>
        </tr>
      </thead>
      <tbody>${bodyRows}</tbody>
    </table>
  </body>
</html>`;
};
