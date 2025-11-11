import React, { useState, useEffect } from "react";
import { Spinner } from "react-bootstrap";
import type { iInventoryDisplayRow, iInventoryCell, iSize } from "../DataInterfaces";

interface InventoryTableProps {
    ViewComponent: React.ComponentType<{
        inventory: iInventoryDisplayRow[];
        sizeColumns: string[];
        onQtyChange: (
            styleNumber: string,
            colorName: string,
            size: string,
            value: number
        ) => void;
        onSave: (row: iInventoryDisplayRow) => void;
    }>;
}

export default function InventoryTable({ ViewComponent }: InventoryTableProps) {
    const [inventory, setInventory] = useState<iInventoryDisplayRow[]>([]);
    const [sizeColumns, setSizeColumns] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    // Load sizes and inventory
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch sizes
                const sizeRes = await fetch("https://localhost:7006/api/Sizes/GetSizes");
                const sizeData: iSize[] = await sizeRes.json();
                const sortedSizes = sizeData.sort((a, b) => a.sizeSequence - b.sizeSequence);
                setSizeColumns(sortedSizes.map((s) => s.sizeName));

                // Fetch inventory
                const invRes = await fetch("https://localhost:7006/api/Inventory/GetInventory");
                const invData = await invRes.json();

                // Group inventory by styleNumber + colorName
                const grouped: Record<string, iInventoryDisplayRow> = {};
                invData.forEach((item: any) => {
                    const key = `${item.styleNumber}-${item.colorName}`;
                    if (!grouped[key]) {
                        grouped[key] = {
                            styleNumber: item.styleNumber,
                            colorName: item.colorName,
                            styleId: item.styleId,
                            colorId: item.colorId,
                            styleColorId: item.styleColorId,
                            seasonName: item.seasonName,
                        };
                    }
                    grouped[key][item.sizeName] = {
                        qty: item.qty,
                        inventoryId: item.inventoryId,
                        sizeId: item.sizeId,
                    } as iInventoryCell;
                });

                setInventory(Object.values(grouped));
            } catch (err) {
                console.error("Error loading data:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Update quantity for a given cell
    const handleQtyChange = (
        styleNumber: string,
        colorName: string,
        size: string,
        value: number
    ) => {
        setInventory((prev) =>
            prev.map((row) =>
                row.styleNumber === styleNumber && row.colorName === colorName
                    ? {
                        ...row,
                        [size]: {
                            ...(row[size] as iInventoryCell || { qty: 0, inventoryId: 0, sizeId: 0 }),
                            qty: value,
                        },
                    }
                    : row
            )
        );
    };

    // Save a row
    const saveInventory = async (row: iInventoryDisplayRow) => {
        try {
            const updates = sizeColumns
                .map((size) => {
                    const cell = row[size] as iInventoryCell;
                    if (!cell) return null;
                    return {
                        StyleNumber: row.styleNumber,
                        ColorName: row.colorName,
                        SeasonName: row.seasonName || "",
                        SizeName: size,
                        InventoryId: cell.inventoryId,
                        StyleColorId: row.styleColorId,
                        StyleId: row.styleId,
                        ColorId: row.colorId,
                        SizeId: cell.sizeId,
                        Qty: Number(cell.qty) ?? 0,
                    };
                })
                .filter(Boolean);

            const res = await fetch("https://localhost:7006/api/InventoryPage/SavePageInventory", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updates),
            });

            if (!res.ok) throw new Error(`Failed to save inventory: ${res.statusText}`);
            alert("Inventory saved successfully!");
        } catch (err) {
            console.error(err);
            alert("Error saving inventory");
        }
    };

    if (loading) return <Spinner animation="border" />;

    const View = ViewComponent;

    return (
        <View
            inventory={inventory}
            sizeColumns={sizeColumns}
            onQtyChange={handleQtyChange}
            onSave={saveInventory}
        />
    );
}