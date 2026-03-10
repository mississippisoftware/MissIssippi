import type { iInventoryDisplayRow } from "./DataInterfaces";

export const cloneInventoryRow = (row: iInventoryDisplayRow): iInventoryDisplayRow => ({
  ...row,
  sizes: Object.fromEntries(
    Object.entries(row.sizes).map(([sizeName, cell]) => [
      sizeName,
      cell ? { ...cell } : undefined,
    ])
  ),
});
