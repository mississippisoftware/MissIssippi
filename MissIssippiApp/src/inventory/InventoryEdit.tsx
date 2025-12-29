import { useMemo, useState } from "react";
import { useInventoryStore } from "../stores/InventoryStore";
import InventoryTable from "./InventoryTable";
import SearchPanel from "./SearchPanel";

import { Container } from "react-bootstrap";
import { Card } from "primereact/card";
import type { iInventoryDisplayRow } from "../utils/DataInterfaces";

export default function InventoryPage() {
    const inventory = useInventoryStore((s) => s.inventory);
    const sizeColumns = useInventoryStore((s) => s.sizeColumns);
    const updateCell = useInventoryStore((s) => s.updateCell);
    const saveInventory = useInventoryStore((s) => s.saveInventory);
    const loading = useInventoryStore((s) => s.loading);

    const [filters, setFilters] = useState<Record<string, string[]>>({});

    // Derived filtered inventory
    const filteredInventory = useMemo(() => {
        if (!inventory) return [];
        return inventory.filter((row) =>
            Object.entries(filters).every(([key, selectedValues]) => {
                if (!selectedValues?.length) return true;
                const typedKey = key as keyof typeof row;
                return selectedValues.includes(String(row[typedKey]));
            })
        );
    }, [inventory, filters]);

    if (loading) return <div>Loading...</div>;

    return (
        <Container fluid className="mt-3">
            {/* Filters Card (20% height) */}
            <Card className="mb-3" style={{ height: "20%" }}>
                <SearchPanel inventory={inventory} filters={filters} setFilters={setFilters}
                    fields={["styleNumber", "colorName"]} />
            </Card>

            <div className="d-flex justify-content-center"
                style={{ marginTop: "1rem" }}>
                <div style={{ width: "100%" }}>
                    <InventoryTable
                        inventory={filteredInventory}
                        sizeColumns={sizeColumns}
                        editable={true}
                        onQtyChange={updateCell}
                        onSave={async (row: iInventoryDisplayRow) => {
                            try {
                                await saveInventory(row);
                            } catch (err) {
                                console.error(err);
                                alert("Error saving inventory");
                            }
                        }}
                    />
                </div>
            </div>
        </Container>
    );
}