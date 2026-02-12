import type { ItemColorView } from "../service/CatalogService";
import type { ItemListRow } from "../items/itemsColorsTypes";
import { buildColorListHtml, type ColorListPrintRow } from "./buildColorListHtml";
import { buildItemListHtml } from "./buildItemListHtml";
import { printHtml } from "./printHtml";

type PrintItemListArgs = {
  rows: ItemListRow[];
  formatPrice: (value?: number | null) => string;
  getUniqueColors: (colorsForItem: ItemColorView[]) => ItemColorView[];
};

export const printColorList = (rows: ColorListPrintRow[]): void => {
  if (!rows.length) return;
  const html = buildColorListHtml(rows);
  printHtml(html);
};

export const printItemList = ({ rows, formatPrice, getUniqueColors }: PrintItemListArgs): void => {
  if (!rows.length) return;
  const html = buildItemListHtml({ rows, formatPrice, getUniqueColors });
  printHtml(html);
};
