
import type { iInventoryDisplayRow, iInventoryCell } from "../DataInterfaces";

interface Props {
    row: iInventoryDisplayRow;
    sizeColumns: string[];
    onQtyChange?: (styleNumber: string, colorName: string, size: string, value: number) => void;
    onSave?: (row: iInventoryDisplayRow) => void;
}

export default function InventoryRow({ row, sizeColumns, onQtyChange, onSave }: Props) {
    return (
        <tr>
            <td>{row.styleNumber}</td>
            <td>{row.colorName}</td>

            {sizeColumns.map((size) => {
                const cell = row[size] as iInventoryCell | undefined;
                return (
                    <td key={size}>
                        {cell ? (
                            <input
                                type="number"
                                value={cell.qty}
                                min={0}
                                onChange={(e) =>
                                    onQtyChange?.(row.styleNumber, row.colorName, size, Number(e.target.value))
                                }
                                style={{ width: "60px" }}
                                readOnly={!onQtyChange}
                            />
                        ) : (
                            "-"
                        )}
                    </td>
                );
            })}

            {/* Show Save button only if onSave is provided */}
            {onSave && (
                <td>
                    <button className="btn btn-sm btn-primary" onClick={() => onSave(row)}>
                        Save
                    </button>
                </td>
            )}
        </tr>
    );
}