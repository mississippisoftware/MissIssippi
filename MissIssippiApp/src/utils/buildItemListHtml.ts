import type { ItemColorView } from "../service/CatalogService";
import type { ItemListRow } from "../items/itemsColorsTypes";
import { getReadableTextColor } from "../items/itemsColorsUtils";
import { formatPrintTimestamp } from "./dateFormat";

type BuildItemListHtmlArgs = {
  rows: ItemListRow[];
  formatPrice: (value?: number | null) => string;
  getUniqueColors: (colorsForItem: ItemColorView[]) => ItemColorView[];
};

export const buildItemListHtml = ({
  rows,
  formatPrice,
  getUniqueColors,
}: BuildItemListHtmlArgs): string => {
  const timestamp = formatPrintTimestamp();

  const cards = rows
    .map((row) => {
      const colors = getUniqueColors(row.colors ?? []);
      const colorHtml = colors.length
        ? colors
            .map((color) => {
              const bg = color.hexValue ?? "#f8fafc";
              const text = color.hexValue ? getReadableTextColor(color.hexValue) : "#334155";
              return `<span class="color-pill" style="background:${bg};color:${text}">${color.colorName}</span>`;
            })
            .join("")
        : `<span class="color-empty">No colors</span>`;

      const wholesale = row.wholesalePrice == null ? "--" : formatPrice(row.wholesalePrice);
      const retail = row.costPrice == null ? "--" : formatPrice(row.costPrice);

      return `<div class="item-card">
  <div class="item-card-header">
    <div>
      <div class="item-season">${row.seasonName ?? ""}</div>
      <div class="item-style">${row.itemNumber ?? ""}</div>
      <div class="item-desc">${row.description ?? ""}</div>
    </div>
    <div class="item-meta">
      <div><span class="label">Active</span><span class="value">${row.inProduction ? "Yes" : "No"}</span></div>
      <div><span class="label">Wholesale</span><span class="value">${wholesale}</span></div>
      <div><span class="label">Retail</span><span class="value">${retail}</span></div>
    </div>
  </div>
  <div class="item-card-colors">${colorHtml}</div>
</div>`;
    })
    .join("");

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Item List</title>
    <style>
      * { box-sizing: border-box; }
      body { font-family: "Segoe UI", Arial, sans-serif; margin: 24px; color: #111827; }
      h1 { font-size: 20px; margin: 0 0 6px 0; }
      .timestamp { font-size: 12px; color: #6b7280; margin-bottom: 16px; }
      .item-grid { display: grid; gap: 12px; }
      .item-card { border: 1px solid #e5e7eb; padding: 12px; border-radius: 10px; background: #fff; }
      .item-card-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
      .item-season { font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: #94a3b8; }
      .item-style { font-size: 16px; font-weight: 700; margin-top: 4px; }
      .item-desc { font-size: 12px; color: #475569; margin-top: 4px; }
      .item-meta { min-width: 180px; display: grid; gap: 6px; font-size: 12px; color: #475569; }
      .item-meta .label { display: inline-block; width: 80px; color: #94a3b8; }
      .item-meta .value { font-weight: 600; color: #0f172a; }
      .item-card-colors { margin-top: 10px; display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; }
      .color-pill { padding: 4px 10px; border-radius: 6px; border: 1px solid #d1d5db; font-size: 11px; font-weight: 600; }
      .color-empty { color: #94a3b8; font-size: 12px; }
    </style>
  </head>
  <body>
    <h1>Item List</h1>
    <div class="timestamp">${timestamp}</div>
    <div class="item-grid">${cards}</div>
  </body>
</html>`;
};
