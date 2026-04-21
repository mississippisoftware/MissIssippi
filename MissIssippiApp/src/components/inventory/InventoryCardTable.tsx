import type { ReactNode } from "react";
import { InputNumber } from "primereact/inputnumber";
import type { iInventoryDisplayRow, iSize } from "../../utils/DataInterfaces";
import ColorDot from "../ColorDot";

type InventoryCardTableProps = {
  rows: iInventoryDisplayRow[];
  sizeColumns: iSize[];
  editable?: boolean;
  readonlyCellBoxed?: boolean;
  compact?: boolean;
  borderless?: boolean;
  hoverable?: boolean;
  leadingColumn?: ReactNode;
  leadingColumnHeader?: string;
  colorColumnHeader?: string;
  onQtyChange?: (itemNumber: string, colorName: string, sizeName: string, qty: number) => void;
};

const InventoryCardTable = ({
  rows,
  sizeColumns,
  editable = false,
  readonlyCellBoxed = false,
  compact = false,
  borderless = false,
  hoverable = true,
  leadingColumn,
  leadingColumnHeader = "",
  colorColumnHeader = "Color",
  onQtyChange,
}: InventoryCardTableProps) => {
  const hasLeadingColumn = Boolean(leadingColumn);
  const tableClassName = `inventory-edit-table${compact ? " inventory-edit-table--compact" : ""}${borderless ? " inventory-edit-table--borderless" : ""}`;

  return (
    <div className="table-responsive"><table className={`table${hoverable ? " table-hover" : ""}${!borderless ? " table-bordered" : ""} ${tableClassName}`}>
      <thead className="table-light">
        <tr>
          {hasLeadingColumn ? <th className="inventory-style-col">{leadingColumnHeader}</th> : null}
          <th className="inventory-color-col">{colorColumnHeader}</th>
          {sizeColumns.map((size) => (
            <th key={size.sizeId} className="inventory-size-col">
              {size.sizeName}
            </th>
          ))}
          <th className="inventory-total-col">Total</th>
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            {hasLeadingColumn ? <td className="inventory-style-cell">{leadingColumn}</td> : null}
            <td className="inventory-color-col inventory-color-cell">No colors</td>
            {sizeColumns.map((size) => (
              <td key={`empty-${size.sizeId}`} className="inventory-size-col zero">
                0
              </td>
            ))}
            <td className="inventory-total-col zero">0</td>
          </tr>
        ) : (
          rows.map((row, rowIndex) => {
            const rowKey = row.id || `${row.itemNumber}-${row.colorName}`;
            const rowTotal = sizeColumns.reduce(
              (sum, size) => sum + Number(row.sizes[size.sizeName]?.qty ?? 0),
              0
            );
            return (
              <tr key={rowKey}>
                {hasLeadingColumn && rowIndex === 0 ? (
                  <td className="inventory-style-cell" rowSpan={rows.length}>
                    {leadingColumn}
                  </td>
                ) : null}
                <td className="inventory-color-col">
                  <span className="inventory-color-chip" title={row.colorName}>
                    <ColorDot colorName={row.colorName} size="sm" />
                    <span className="inventory-color-name">{row.colorName}</span>
                  </span>
                </td>
                {sizeColumns.map((size) => {
                  const cell = row.sizes[size.sizeName];
                  const qty = cell?.qty ?? 0;
                  return (
                    <td key={`${rowKey}-${size.sizeId}`} className={`inventory-size-col${qty === 0 ? " zero" : ""}`}>
                      {editable ? (
                        <InputNumber
                          value={qty}
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
                        <span
                          className={`inventory-cell-readonly${
                            readonlyCellBoxed ? " inventory-cell-readonly--boxed" : ""
                          } ${qty === 0 ? "inv-val-zero" : "inv-val-pos"}`}
                        >
                          {qty}
                        </span>
                      )}
                    </td>
                  );
                })}
                <td className={`inventory-total-col${rowTotal === 0 ? " zero" : ""}`}>{rowTotal}</td>
              </tr>
            );
          })
        )}
      </tbody>
    </table></div>
  );
};

export default InventoryCardTable;
