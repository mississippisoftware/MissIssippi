import { Table } from "react-bootstrap";
import InventoryRow from "./InventoryRow";
import type { iInventoryDisplayRow, iInventoryCell } from "../DataInterfaces";

interface InventoryTableViewProps {
  inventory: iInventoryDisplayRow[];
  sizeColumns: string[];
  onQtyChange: (
    styleNumber: string,
    colorName: string,
    size: string,
    value: number
  ) => void;
  onSave: (row: iInventoryDisplayRow) => void;
}

export default function InventoryTableViewEditable({
  inventory,
  sizeColumns,
  onQtyChange,
  onSave,
}: InventoryTableViewProps) {
  return (
    <div className="container mt-3">
      <h3>Inventory (Editable)</h3>
      <Table bordered hover size="sm">
        <thead>
          <tr>
            <th>Style #</th>
            <th>Color</th>
            {sizeColumns.map((s) => (
              <th key={s}>{s}</th>
            ))}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {inventory.map((row) => (
            <InventoryRow
              key={`${row.styleNumber}-${row.colorName}`}
              row={row}
              sizeColumns={sizeColumns}
              onQtyChange={onQtyChange}
              onSave={onSave}
            />
          ))}
        </tbody>
      </Table>
    </div>
  );
}