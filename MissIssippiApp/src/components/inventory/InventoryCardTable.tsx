import { Table } from "react-bootstrap";
import { InputNumber } from "primereact/inputnumber";
import type { iInventoryDisplayRow, iSize } from "../../utils/DataInterfaces";

type InventoryCardTableProps = {
  rows: iInventoryDisplayRow[];
  sizeColumns: iSize[];
  editable?: boolean;
  onQtyChange?: (itemNumber: string, colorName: string, sizeName: string, qty: number) => void;
};

const InventoryCardTable = ({
  rows,
  sizeColumns,
  editable = false,
  onQtyChange,
}: InventoryCardTableProps) => (
  <Table responsive bordered hover className="inventory-edit-table">
    <thead className="table-light">
      <tr>
        <th className="inventory-color-col">Color</th>
        {sizeColumns.map((size) => (
          <th key={size.sizeId} className="text-center inventory-size-col">
            {size.sizeName}
          </th>
        ))}
      </tr>
    </thead>
    <tbody>
      {rows.map((row) => {
        const rowKey = row.id || `${row.itemNumber}-${row.colorName}`;
        return (
          <tr key={rowKey}>
            <td className="fw-semibold align-middle inventory-color-cell">{row.colorName}</td>
            {sizeColumns.map((size) => {
              const cell = row.sizes[size.sizeName];
              return (
                <td key={`${rowKey}-${size.sizeId}`} className="align-middle text-center inventory-size-cell">
                  {editable ? (
                    <InputNumber
                      value={cell?.qty ?? 0}
                      onValueChange={(e) =>
                        onQtyChange?.(
                          row.itemNumber,
                          row.colorName,
                          size.sizeName,
                          Number(e.value ?? 0)
                        )
                      }
                      min={0}
                      showButtons={false}
                      className="inventory-cell-input-wrapper"
                      inputClassName="text-center inventory-cell-input"
                    />
                  ) : (
                    cell?.qty ?? 0
                  )}
                </td>
              );
            })}
          </tr>
        );
      })}
    </tbody>
  </Table>
);

export default InventoryCardTable;
