import { makeDateStamp } from "./dateFormat";

export type InventoryLabelRow = {
  itemNumber: string;
  colorName: string;
  sizeName: string;
  sku: string;
  labelQty: number;
};

type LabelCell = {
  line1: string;
  line2: string;
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const buildLabelCells = (rows: InventoryLabelRow[]): LabelCell[] => {
  const labels: LabelCell[] = [];
  rows.forEach((row) => {
    const count = Math.max(0, Math.floor(row.labelQty));
    if (!count) return;
    const line1 = [row.itemNumber, row.colorName, row.sizeName].filter(Boolean).join(" ");
    const line2 = row.sku;
    for (let i = 0; i < count; i += 1) {
      labels.push({ line1, line2 });
    }
  });
  return labels;
};

const buildLabelHtml = (labels: LabelCell[]): string => {
  const labelsPerPage = 30;
  const columns = 3;
  const rowsPerPage = 10;
  const totalLabels = Math.max(labels.length, 1);
  const totalPages = Math.ceil(totalLabels / labelsPerPage);
  let index = 0;

  const pages = Array.from({ length: totalPages }, () => {
    let tableRows = "";
    for (let rowIndex = 0; rowIndex < rowsPerPage; rowIndex += 1) {
      let cells = "";
      for (let colIndex = 0; colIndex < columns; colIndex += 1) {
        const label = labels[index] ?? { line1: "", line2: "" };
        const line1 = escapeHtml(label.line1);
        const line2 = escapeHtml(label.line2);
        cells += `
          <td class="label-cell">
            <div class="label-inner">
              <div class="label-line1">${line1}</div>
              <div class="label-line2">${line2}</div>
            </div>
          </td>`;
        index += 1;
      }
      tableRows += `<tr>${cells}</tr>`;
    }
    return `<div class="label-page"><table class="label-table">${tableRows}</table></div>`;
  }).join("");

  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">
  <head>
    <meta charset="utf-8" />
    <style>
      @page { size: 8.5in 11in; margin: 0.5in 0.1875in; }
      body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
      .label-page { width: 8.125in; page-break-after: always; }
      .label-table { width: 8.125in; border-collapse: separate; border-spacing: 0.125in 0; }
      .label-cell { width: 2.625in; height: 1in; vertical-align: top; padding: 0; }
      .label-inner { height: 1in; padding: 0.06in 0.05in 0 0.05in; box-sizing: border-box; }
      .label-line1 { font-size: 9pt; font-weight: 600; line-height: 1.1; }
      .label-line2 { font-size: 12pt; line-height: 1.1; font-family: "Free 3 of 9", "Free3of9", sans-serif; }
    </style>
  </head>
  <body>${pages}</body>
</html>`;
};

export const downloadInventoryLabelsDoc = (
  rows: InventoryLabelRow[],
  filenamePrefix = "inventory_labels"
): boolean => {
  const labels = buildLabelCells(rows);
  if (labels.length === 0) {
    return false;
  }

  const html = buildLabelHtml(labels);
  const blob = new Blob(["\ufeff", html], { type: "application/msword" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filenamePrefix}_${makeDateStamp()}.doc`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  return true;
};
