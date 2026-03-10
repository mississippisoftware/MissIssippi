import { formatPrintTimestamp } from "./dateFormat";
import { printHtml } from "./printHtml";
import { buildInventoryHistoryHtml } from "./buildInventoryHistoryHtml";
import type { InventoryHistoryBatchDetail } from "./inventoryHistoryTypes";

type PrintInventoryHistoryArgs = {
  batches: InventoryHistoryBatchDetail[] | null | undefined;
  title: string;
};

type PrintOptions = {
  onError?: () => void;
};

export const printInventoryHistory = (
  { batches, title }: PrintInventoryHistoryArgs,
  options?: PrintOptions
): void => {
  if (!batches || batches.length === 0) return;
  const html = buildInventoryHistoryHtml({
    title,
    timestamp: formatPrintTimestamp(),
    batches,
  });
  printHtml(html, options);
};
