import { Table, Form, Button } from "react-bootstrap";
import type { iInventoryDisplayRow } from "../DataInterfaces";

interface InventoryTableViewProps {
  inventory: iInventoryDisplayRow[];
  sizeColumns: string[];
  showStyleNumber?: boolean;
  editable?: boolean;
  onQtyChange?: (styleNumber: string, colorName: string, size: string, qty: number) => void;
  onSave?: (row: iInventoryDisplayRow) => void;
}

export default function InventoryTableView({
  inventory,
  sizeColumns,
  editable = false,
  showStyleNumber = true,
  onQtyChange,
  onSave,
}: InventoryTableViewProps) {
  return (
    <Table bordered hover size="sm">
      <thead>
        <tr>
          {showStyleNumber && <th>Style #</th>}
          <th>Color</th>
          {sizeColumns.map((size) => (
            <th key={size}>{size}</th>
          ))}
          {editable && <th>Actions</th>}
        </tr>
      </thead>
      <tbody>
        {inventory.map((row) => (
          <tr key={row.colorName}>
            {showStyleNumber && <td>{row.styleNumber}</td>}
            <td>{row.colorName}</td>
            {sizeColumns.map((size) => (
              <td key={size}>
                {editable ? (
                  <Form.Control
                    type="number"
                    value={row.sizes[size]?.qty ?? 0}
                    onChange={(e) =>
                      onQtyChange &&
                      onQtyChange(row.styleNumber, row.colorName, size, Number(e.target.value))
                    }
                    size="sm"
                  />
                ) : (
                  row.sizes[size]?.qty ?? 0
                )}
              </td>
            ))}
            {editable && (
              <td>
                <Button size="sm" onClick={() => onSave && onSave(row)}>
                  Save
                </Button>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </Table>
  );
}