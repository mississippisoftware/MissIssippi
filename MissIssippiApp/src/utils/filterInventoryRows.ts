import type { iInventoryDisplayRow } from "./DataInterfaces";

export const filterInventoryRows = (
  rows: iInventoryDisplayRow[],
  query: string
): iInventoryDisplayRow[] => {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return rows;
  return rows.filter((row) =>
    [row.seasonName, row.itemNumber, row.colorName, row.description]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedQuery))
  );
};
