export type InventoryHistorySource = "scan" | "edit" | "upload";

export type InventoryHistoryBatchSummary = {
  batchId: string;
  batchTimestamp: string;
  source: InventoryHistorySource;
  totalLines: number;
  totalDelta: number;
  notes?: string | null;
};

export type InventoryHistoryLine = {
  sku?: string | null;
  itemNumber: string;
  seasonName: string;
  colorName: string;
  sizeName: string;
  oldQty: number;
  newQty: number;
  delta: number;
};

export type InventoryHistoryBatchDetail = InventoryHistoryBatchSummary & {
  lines: InventoryHistoryLine[];
};
