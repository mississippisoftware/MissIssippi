import type { iInventoryCell, iInventoryDisplayRow } from "./DataInterfaces";

type ScanTableRowItem = {
  delta: number;
  seasonName?: string;
  itemNumber: string;
  colorName: string;
  sizeName: string;
};

export const buildScanTableRows = (scannedItems: ScanTableRowItem[]): iInventoryDisplayRow[] => {
  const rows = new Map<string, iInventoryDisplayRow>();

  scannedItems
    .filter((item) => item.delta !== 0)
    .forEach((item) => {
      const key = `${item.seasonName}|${item.itemNumber}|${item.colorName}`;
      if (!rows.has(key)) {
        rows.set(key, {
          id: key,
          itemNumber: item.itemNumber,
          colorName: item.colorName,
          seasonName: item.seasonName,
          sizes: {},
        });
      }

      const row = rows.get(key);
      if (!row) return;
      const currentQty = row.sizes[item.sizeName]?.qty ?? 0;
      row.sizes[item.sizeName] = {
        qty: currentQty + item.delta,
      } as iInventoryCell;
    });

  return Array.from(rows.values()).sort((a, b) => {
    const itemCompare = a.itemNumber.localeCompare(b.itemNumber);
    if (itemCompare !== 0) return itemCompare;
    return a.colorName.localeCompare(b.colorName);
  });
};
