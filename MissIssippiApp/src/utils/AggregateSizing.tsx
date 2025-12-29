import type { iInventoryDisplayRow, iSize } from "./DataInterfaces";

export default function aggregateByStyle(
    inventory: iInventoryDisplayRow[],
    sizeColumns: iSize[]
): iInventoryDisplayRow[] {
    const map: Record<string, iInventoryDisplayRow> = {};

    inventory.forEach((row) => {
        const key = row.styleNumber;

        if (!map[key]) {
            map[key] = {
                id: `agg-${key}`,
                styleNumber: row.styleNumber,
                colorName: "TOTAL",
                seasonName: row.seasonName,
                description: row.description,
                sizes: {},
            };

            sizeColumns.forEach((s) => {
                map[key].sizes[s.sizeName] = { qty: 0 };
            });
        }

        sizeColumns.forEach((s) => {
            const qty = row.sizes[s.sizeName]?.qty ?? 0;
            map[key].sizes[s.sizeName]!.qty += qty;
        });
    });

    return Object.values(map);
}