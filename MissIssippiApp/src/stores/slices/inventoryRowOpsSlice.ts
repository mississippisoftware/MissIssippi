import type { StateCreator } from "zustand";
import type { iInventoryCell, iInventoryDisplayRow, iSize } from "../../utils/DataInterfaces";
import { cloneInventoryRow as cloneInventoryRowUtil } from "../../utils/cloneInventoryRow";
import { normalizePivotInventoryRows } from "../../utils/normalizePivotInventoryRows";

type UpdateCellOptions = {
  sizeColumns?: iSize[];
  ensureSizeId?: boolean;
};

export const getRowKey = (row: iInventoryDisplayRow) =>
  row.id || `${row.itemNumber}|${row.colorName}|${row.seasonName ?? ""}`;

const getRowQty = (row: iInventoryDisplayRow, sizeName: string) => row.sizes[sizeName]?.qty ?? 0;

const getCompareSizeNames = (
  row: iInventoryDisplayRow,
  original: iInventoryDisplayRow | undefined,
  sizeColumns: iSize[]
) => {
  if (sizeColumns.length > 0) {
    return sizeColumns.map((size) => size.sizeName);
  }
  const sizeNames = new Set<string>(Object.keys(row.sizes));
  if (original) {
    Object.keys(original.sizes).forEach((sizeName) => sizeNames.add(sizeName));
  }
  return Array.from(sizeNames);
};

export const isRowDirty = (
  row: iInventoryDisplayRow,
  original: iInventoryDisplayRow | undefined,
  sizeColumns: iSize[]
) => {
  if (!original) return true;
  const sizeNames = getCompareSizeNames(row, original, sizeColumns);
  return sizeNames.some((sizeName) => getRowQty(row, sizeName) !== getRowQty(original, sizeName));
};

export const buildDirtyItemsSet = (
  rows: iInventoryDisplayRow[],
  originalResultsById: Record<string, iInventoryDisplayRow>,
  sizeColumns: iSize[]
) => {
  const dirtyItems = new Set<string>();
  rows.forEach((row) => {
    if (isRowDirty(row, originalResultsById[getRowKey(row)], sizeColumns)) {
      dirtyItems.add(row.itemNumber);
    }
  });
  return dirtyItems;
};

export const updateCell = (
  rows: iInventoryDisplayRow[],
  itemNumber: string,
  colorName: string,
  sizeName: string,
  qty: number,
  options?: UpdateCellOptions
): iInventoryDisplayRow[] => {
  const ensureSizeId = options?.ensureSizeId ?? false;
  const sizeColumns = options?.sizeColumns ?? [];

  return rows.map((row) => {
    if (row.itemNumber !== itemNumber || row.colorName !== colorName) {
      return row;
    }

    const prev = row.sizes[sizeName];
    const nextCell: iInventoryCell = ensureSizeId
      ? {
          ...(prev ?? {}),
          qty,
          sizeId: prev?.sizeId ?? sizeColumns.find((size) => size.sizeName === sizeName)?.sizeId,
        }
      : {
          ...(prev ?? {}),
          qty,
        };

    return {
      ...row,
      sizes: {
        ...row.sizes,
        [sizeName]: nextCell,
      },
    };
  });
};

export const cloneInventoryRow = (row: iInventoryDisplayRow): iInventoryDisplayRow =>
  cloneInventoryRowUtil(row);

export const normalizeRowForSave = (
  row: iInventoryDisplayRow,
  sizeColumns: iSize[]
): iInventoryDisplayRow => normalizePivotInventoryRows([row], sizeColumns)[0];

export const normalizeRowsForSave = (
  rows: iInventoryDisplayRow[],
  sizeColumns: iSize[]
): iInventoryDisplayRow[] => normalizePivotInventoryRows(rows, sizeColumns);

export type InventoryRowOpsSlice = {
  buildDirtyItemsSet: typeof buildDirtyItemsSet;
  getRowKey: typeof getRowKey;
  updateCell: typeof updateCell;
  cloneInventoryRow: typeof cloneInventoryRow;
  normalizeRowForSave: typeof normalizeRowForSave;
  normalizeRowsForSave: typeof normalizeRowsForSave;
};

export const createInventoryRowOpsSlice: StateCreator<
  InventoryRowOpsSlice,
  [],
  [],
  InventoryRowOpsSlice
> = () => ({
  buildDirtyItemsSet,
  getRowKey,
  updateCell,
  cloneInventoryRow,
  normalizeRowForSave,
  normalizeRowsForSave,
});
