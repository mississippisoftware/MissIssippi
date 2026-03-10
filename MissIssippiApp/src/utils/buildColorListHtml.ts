import { getReadableTextColor } from "../items/itemsColorsUtils";
import { formatPrintTimestamp } from "./dateFormat";

export type ColorListPrintRow = {
  colorName: string;
  seasonName?: string | null;
  collection?: string | null;
  pantoneColor?: string | null;
  hexValue?: string | null;
};

export const buildColorListHtml = (rows: ColorListPrintRow[]): string => {
  const timestamp = formatPrintTimestamp();

  const cards = rows
    .map((row) => {
      const bg = row.hexValue ?? "#f8fafc";
      const text = row.hexValue ? getReadableTextColor(row.hexValue) ?? "#334155" : "#334155";
      return `<div class="color-card">
  <div class="color-swatch" style="background:${bg};color:${text}">${row.colorName}</div>
    <div class="color-meta">
      <div><span class="label">Season</span>${row.seasonName ?? ""}</div>
      <div><span class="label">Collection</span>${row.collection ?? "--"}</div>
      <div><span class="label">Pantone</span>${row.pantoneColor ?? "--"}</div>
      <div><span class="label">Hex</span>${row.hexValue ?? "--"}</div>
    </div>
</div>`;
    })
    .join("");

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Color List</title>
    <style>
      * { box-sizing: border-box; }
      body { font-family: "Segoe UI", Arial, sans-serif; color: #111827; margin: 24px; }
      h1 { font-size: 20px; margin: 0 0 4px 0; }
      .timestamp { color: #6b7280; font-size: 12px; margin-bottom: 16px; }
      .color-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
      .color-card { border: 1px solid #e5e7eb; border-radius: 10px; padding: 12px 16px; display: grid; gap: 8px; }
      .color-swatch { border-radius: 8px; padding: 10px 12px; font-weight: 600; text-align: center; border: 1px solid rgba(0,0,0,0.08); }
      .color-meta { display: grid; gap: 4px; font-size: 12px; color: #475569; }
      .label { display: inline-block; width: 70px; color: #94a3b8; }
      @media print {
        .color-grid { grid-template-columns: 1fr; }
      }
    </style>
  </head>
  <body>
    <h1>Color List</h1>
    <div class="timestamp">${timestamp}</div>
    <div class="color-grid">${cards}</div>
  </body>
</html>`;
};
