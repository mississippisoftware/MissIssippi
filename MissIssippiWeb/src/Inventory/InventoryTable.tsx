import { useMemo } from "react";
import { Spinner } from "react-bootstrap";
import { useInventoryStore } from "./inventoryStore";
import InventoryTableView from "./InventoryTableView";

interface InventoryTableProps {
    styleNumber?: string;       // optional filter for a single style
    editable?: boolean;         // cells editable or not
    showStyleNumber?: boolean;  // toggle first column
}

export default function InventoryTable({
    styleNumber,
    editable = false,
    showStyleNumber = true,
}: InventoryTableProps) {
    const allInventory = useInventoryStore((state) => state.inventory);
    const sizeColumnsRaw = useInventoryStore((state) => state.sizeColumns);
    const loading = useInventoryStore((state) => state.loading);
    const updateCell = useInventoryStore((state) => state.updateCell);
    const saveInventory = useInventoryStore((state) => state.saveInventory);

    // Filter inventory if a styleNumber is provided
    const inventory = useMemo(
        () => (styleNumber ? allInventory.filter((row) => row.styleNumber === styleNumber) : allInventory),
        [allInventory, styleNumber]
    );

    // Memoize size column names
    const sizeColumns = useMemo(() => sizeColumnsRaw.map((s) => s.sizeName), [sizeColumnsRaw]);

    if (loading) return <Spinner animation="border" />;

    return (
        <InventoryTableView
            inventory={inventory}
            sizeColumns={sizeColumns}
            editable={editable}
            showStyleNumber={showStyleNumber}
            onQtyChange={updateCell}
            onSave={saveInventory}
        />
    );
}