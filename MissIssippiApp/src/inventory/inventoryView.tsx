import { useEffect, useMemo, useRef } from "react";
import { useInventoryStore } from "../stores/InventoryStore";
import InventoryTable from "./InventoryTable";
import type { FilterableColumn, InventoryTableHandle } from "./InventoryTable";
import ExportButton from "../components/ExportToExcelButton";
import { exportInventoryToExcel } from "../utils/ExportInventoryToExcel";

export default function InventoryView() {
    const inventory = useInventoryStore((s) => s.inventory);
    const sizeColumns = useInventoryStore((s) => s.sizeColumns);
    const loading = useInventoryStore((s) => s.loading);
    const fetchInventory = useInventoryStore((s) => s.fetchInventory);

    const tableRef = useRef<InventoryTableHandle>(null);

    useEffect(() => {
        fetchInventory();
    }, [fetchInventory]);

    const filteredColumns: FilterableColumn[] = useMemo(
        () => [
            { field: "seasonName", header: "Season", filterMatchMode: "startsWith", className: "col-season" },
            { field: "styleNumber", header: "Style", filterMatchMode: "startsWith", className: "col-style" },
            { field: "colorName", header: "Color", filterMatchMode: "contains", className: "col-color" },
        ],
        []
    );

    const handleExport = () => {
        const rows = tableRef.current?.getProcessedRows() ?? [];
        exportInventoryToExcel({
            rows,
            sizeColumns,
            uiColumns: filteredColumns,
            title: "Inventory Download",
            sheetName: "Inventory",
            filename: "inventory.xlsx",
        });
    };

    if (loading) {
        return <div>Loading inventory...</div>;
    }

    return (
        <>
            <div className="portal-page-header">
                <h1 className="portal-page-title">Inventory</h1>

                <ExportButton
                    onClick={handleExport}
                    className="portal-btn portal-btn-outline"
                    label="Export to Excel"
                />
            </div>

            <div className="portal-content-card">
                <InventoryTable
                    ref={tableRef}
                    inventory={inventory}
                    sizeColumns={sizeColumns}
                    loading={loading}
                    filteredColumns={filteredColumns}
                    editable={false}
                />
            </div>
        </>
    );
}