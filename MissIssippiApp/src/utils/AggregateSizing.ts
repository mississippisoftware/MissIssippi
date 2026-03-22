import type { iInventoryDisplayRow, iSize } from "./DataInterfaces";

export default function aggregateByItem(
    inventory: iInventoryDisplayRow[],
    sizeColumns: iSize[]
): iInventoryDisplayRow[] {
    const map: Record<string, iInventoryDisplayRow> = {};

    inventory.forEach((row) => {
        const key = row.itemNumber;

        if (!map[key]) {
            map[key] = {
                id: `agg-${key}`,
                itemNumber: row.itemNumber,
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
