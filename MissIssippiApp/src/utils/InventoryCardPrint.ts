import type { iInventoryDisplayRow, iSize } from "./DataInterfaces";

export type InventoryCardGroup = {
  itemNumber: string;
  description?: string;
  rows: iInventoryDisplayRow[];
};

const formatTimestamp = (date: Date) =>
  date.toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

export const buildInventoryCardsHtml = ({
  title = "Miss Issippi",
  subtitle,
  sizeColumns,
  groups,
}: {
  title?: string;
  subtitle?: string;
  sizeColumns: iSize[];
  groups: InventoryCardGroup[];
}) => {
  const headerCells = sizeColumns.map((size) => `<th>${size.sizeName}</th>`).join("");
  const timestamp = formatTimestamp(new Date());
  const subtitleHtml = subtitle ? `<div class="subtitle">${subtitle}</div>` : "";

  const cards = groups
    .map((group) => {
      const description = group.description?.trim() || "No description";
      const bodyRows = group.rows
        .map((row) => {
          const cells = sizeColumns
            .map((size) => {
              const qty = row.sizes[size.sizeName]?.qty ?? 0;
              return `<td class="qty">${qty}</td>`;
            })
            .join("");
          return `<tr><td class="color">${row.colorName}</td>${cells}</tr>`;
        })
        .join("");

      return `<div class="card">
  <div class="header">
    <div>
      <div class="style-number">${group.itemNumber}</div>
      <div class="description">${description}</div>
    </div>
    <div class="image-placeholder">No Image Available</div>
  </div>
  <table>
    <thead>
      <tr>
        <th class="color">Color</th>
        ${headerCells}
      </tr>
    </thead>
    <tbody>
      ${bodyRows}
    </tbody>
  </table>
</div>`;
    })
    .join("");

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${title} Inventory</title>
    <style>
      * { box-sizing: border-box; }
      body { font-family: "Segoe UI", Arial, sans-serif; color: #1f2937; margin: 24px; }
      h1 { font-size: 20px; margin: 0 0 4px 0; }
      .subtitle { color: #6b7280; font-size: 13px; margin-bottom: 6px; }
      .timestamp { color: #6b7280; font-size: 12px; margin-bottom: 16px; }
      .card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 24px; page-break-inside: avoid; }
      .header { display: grid; grid-template-columns: 30% 70%; gap: 16px; align-items: center; margin-bottom: 16px; }
      .style-number { font-size: 32px; font-weight: 700; margin: 0; }
      .description { margin: 6px 0 0 0; color: #6b7280; }
      .image-placeholder { border: 1px dashed #d1d5db; border-radius: 6px; height: 140px; display: flex; align-items: center; justify-content: center; color: #9ca3af; font-size: 12px; }
      table { width: 100%; border-collapse: collapse; table-layout: fixed; }
      th, td { border: 1px solid #e5e7eb; padding: 6px 8px; font-size: 12px; text-align: center; }
      th { background: #f7f7f7; font-weight: 600; }
      td.color, th.color { text-align: left; width: 35%; }
      td.qty { width: 3.5rem; }
      @media print {
        body { margin: 12mm; }
      }
    </style>
  </head>
  <body>
    <h1>${title}</h1>
    ${subtitleHtml}
    <div class="timestamp">${timestamp}</div>
    ${cards}
  </body>
</html>`;
};
