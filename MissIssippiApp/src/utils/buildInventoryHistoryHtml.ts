import type { InventoryHistoryBatchDetail } from "./inventoryHistoryTypes";

type BuildInventoryHistoryHtmlArgs = {
  title: string;
  timestamp: string;
  batches: InventoryHistoryBatchDetail[];
};

export const buildInventoryHistoryHtml = ({
  title,
  timestamp,
  batches,
}: BuildInventoryHistoryHtmlArgs): string => {
  const formatBatchTimestamp = (value: string) =>
    new Date(value).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

  const batchSections = batches
    .map((batch) => {
      const formattedTimestamp = formatBatchTimestamp(batch.batchTimestamp);
      const rows = batch.lines
        .map(
          (line) => `
            <tr>
              <td>${line.sku ?? ""}</td>
              <td>${line.itemNumber}</td>
              <td>${line.seasonName}</td>
              <td>${line.colorName}</td>
              <td>${line.sizeName}</td>
              <td>${line.oldQty}</td>
              <td>${line.newQty}</td>
              <td>${line.delta}</td>
            </tr>`
        )
        .join("");

      return `
        <div class="batch">
          <div class="batch-header">
            <div>
              <div class="batch-title">Batch ${batch.batchId}</div>
              <div class="batch-meta">${formattedTimestamp} - ${batch.source}</div>
            </div>
            <div class="batch-summary">
              <span>Lines: ${batch.totalLines}</span>
              <span>Total QtyChange: ${batch.totalDelta}</span>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Style</th>
                <th>Season</th>
                <th>Color</th>
                <th>Size</th>
                <th>Old Qty</th>
                <th>New Qty</th>
                <th>QtyChange</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </div>`;
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
      .batch { margin-bottom: 24px; }
      .batch-header { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
      .batch-title { font-weight: 600; }
      .batch-meta { color: #6b7280; font-size: 12px; }
      .batch-summary { display: flex; gap: 12px; font-size: 12px; color: #374151; }
      table { width: 100%; border-collapse: collapse; table-layout: fixed; margin-top: 8px; }
      th, td { border: 1px solid #e5e7eb; padding: 6px 8px; font-size: 12px; text-align: center; }
      th { background: #f8fafc; font-weight: 600; }
      td:nth-child(1),
      td:nth-child(2),
      td:nth-child(3),
      td:nth-child(4),
      td:nth-child(5) { text-align: left; }
    </style>
  </head>
  <body>
    <h1>${title}</h1>
    <div class="timestamp">${timestamp}</div>
    ${batchSections}
  </body>
</html>`;
};
