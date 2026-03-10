import { appendSheet, createWorkbook, saveWorkbook, sheetFromJson } from "./xlsxUtils";
import type { InventoryHistoryBatchDetail } from "./inventoryHistoryTypes";

type InventoryHistoryExportArgs = {
  batches: InventoryHistoryBatchDetail[];
  baseName?: string;
};

export const exportInventoryHistory = ({
  batches,
  baseName = "inventory_history",
}: InventoryHistoryExportArgs): void => {
  if (!batches.length) return;

  const workbook = createWorkbook();

  const batchRows = batches.map((batch) => ({
    "Batch Timestamp": batch.batchTimestamp,
    Source: batch.source,
    "Total Lines": batch.totalLines,
    "Total QtyChange": batch.totalDelta,
    "Batch Id": batch.batchId,
    Notes: batch.notes ?? "",
  }));

  const batchSheet = sheetFromJson(batchRows, {
    header: [
      "Batch Timestamp",
      "Source",
      "Total Lines",
      "Total QtyChange",
      "Batch Id",
      "Notes",
    ],
  });
  appendSheet(workbook, batchSheet, "Batches");

  const lineRows = batches.flatMap((batch) =>
    batch.lines.map((line) => ({
      "Batch Timestamp": batch.batchTimestamp,
      Source: batch.source,
      "Batch Id": batch.batchId,
      SKU: line.sku ?? "",
      Style: line.itemNumber,
      Season: line.seasonName,
      Color: line.colorName,
      Size: line.sizeName,
      "Old Qty": line.oldQty,
      "New Qty": line.newQty,
      QtyChange: line.delta,
    }))
  );

  const lineSheet = sheetFromJson(lineRows, {
    header: [
      "Batch Timestamp",
      "Source",
      "Batch Id",
      "SKU",
      "Style",
      "Season",
      "Color",
      "Size",
      "Old Qty",
      "New Qty",
      "QtyChange",
    ],
  });
  appendSheet(workbook, lineSheet, "Lines");

  saveWorkbook(workbook, baseName);
};
