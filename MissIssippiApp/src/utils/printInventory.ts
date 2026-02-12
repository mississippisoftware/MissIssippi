import type { iInventoryDisplayRow, iSize } from "./DataInterfaces";
import type { FilterableColumn } from "../inventory/InventoryTable";
import type { InventoryCardGroup } from "./buildInventoryCardGroups";
import { buildInventoryCardsHtml } from "./InventoryCardPrint";
import { buildInventoryListHtml } from "./buildInventoryListHtml";
import { formatPrintTimestamp } from "./dateFormat";
import { printHtml } from "./printHtml";

type PrintInventoryListArgs = {
  rows: iInventoryDisplayRow[] | null | undefined;
  sizeColumns: iSize[];
  uiColumns: FilterableColumn[];
  title: string;
  subtitle?: string;
};

type PrintInventoryCardsArgs = {
  groups: InventoryCardGroup[] | null | undefined;
  sizeColumns: iSize[];
  subtitle: string;
};

type PrintOptions = {
  onError?: () => void;
};

export const printInventoryList = ({
  rows,
  sizeColumns,
  uiColumns,
  title,
  subtitle,
}: PrintInventoryListArgs, options?: PrintOptions): void => {
  if (!rows || rows.length === 0) return;
  const html = buildInventoryListHtml({
    rows,
    sizeColumns,
    uiColumns,
    title,
    subtitle,
    timestamp: formatPrintTimestamp(),
  });
  printHtml(html, options);
};

export const printInventoryCards = ({
  groups,
  sizeColumns,
  subtitle,
}: PrintInventoryCardsArgs, options?: PrintOptions): void => {
  if (!groups || groups.length === 0) return;
  const html = buildInventoryCardsHtml({
    subtitle,
    sizeColumns,
    groups,
  });
  printHtml(html, options);
};
