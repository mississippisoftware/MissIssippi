import type { iInventoryCell, iInventoryDisplayRow, iSize } from "./DataInterfaces";

export const normalizePivotInventoryRows = (
  rows: iInventoryDisplayRow[],
  sizeColumns: iSize[]
): iInventoryDisplayRow[] => {
  const sizeIdByName = new Map(sizeColumns.map((size) => [size.sizeName, size.sizeId]));

  return rows.map((row) => ({
    ...row,
    sizes: Object.entries(row.sizes).reduce<Record<string, iInventoryCell>>((acc, [sizeName, cell]) => {
      if (!cell) {
        return acc;
      }
      acc[sizeName] = {
        qty: Number(cell.qty ?? 0),
        inventoryId: cell.inventoryId,
        sizeId: cell.sizeId ?? sizeIdByName.get(sizeName),
      };
      return acc;
    }, {}),
  }));
};
