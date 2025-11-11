import { Table } from "react-bootstrap";
import InventoryRow from "./InventoryRow";
import type { iInventoryDisplayRow, iInventoryCell } from "../DataInterfaces";

interface InventoryTableViewProps {
    inventory: iInventoryDisplayRow[];
    sizeColumns: string[];
    onQtyChange?: (
        styleNumber: string,
        colorName: string,
        size: string,
        value: number
    ) => void;
    onSave?: (row: iInventoryDisplayRow) => void;
}

export default function InventoryTableViewReadOnly({
    inventory,
    sizeColumns,
}: InventoryTableViewProps) {
    return (
        <div className="container mt-3">
            <h3>Inventory</h3>
            <Table bordered hover size="sm">
                <thead>
                    <tr>
                        <th>Style #</th>
                        <th>Color</th>
                        {sizeColumns.map((s) => (
                            <th key={s}>{s}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {inventory.map((row) => (
                        <InventoryRow
                            key={`${row.styleNumber}-${row.colorName}`}
                            row={row}
                            sizeColumns={sizeColumns}
                        />
                    ))}
                </tbody>
            </Table>
        </div>
    );
}