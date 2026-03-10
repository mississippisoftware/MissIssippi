import type { iInventoryDisplayRow } from "./DataInterfaces";

export type InventoryCardGroup = {
  itemNumber: string;
  description?: string;
  rows: iInventoryDisplayRow[];
};

export const buildInventoryCardGroups = (
  results: iInventoryDisplayRow[]
): InventoryCardGroup[] => {
  const groups = new Map<string, InventoryCardGroup>();

  results.forEach((row) => {
    if (!groups.has(row.itemNumber)) {
      groups.set(row.itemNumber, {
        itemNumber: row.itemNumber,
        description: row.description,
        rows: [],
      });
    }
    groups.get(row.itemNumber)?.rows.push(row);
  });

  return Array.from(groups.values());
};
