import { DataTable } from "primereact/datatable";
import type { DataTable as DataTableRef, DataTableRowEditCompleteEvent } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputNumber } from "primereact/inputnumber";
import type { iInventoryDisplayRow, iSize } from "../utils/DataInterfaces";
import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { inventoryFieldLabels } from "../utils/LabelMap";

export interface FilterableColumn {
  field: string;
  header: string;
  filterMatchMode?: "startsWith" | "contains";
  className?: string;
}

export interface InventoryTableHandle {
  getProcessedRows: () => iInventoryDisplayRow[];
}

interface InventoryTableProps {
  inventory: iInventoryDisplayRow[];
  sizeColumns: iSize[];
  editable?: boolean;
  filteredColumns?: FilterableColumn[];
  loading?: boolean;
  onQtyChange?: (styleNumber: string, colorName: string, size: string, qty: number) => void;
  onSave?: (row: iInventoryDisplayRow) => Promise<void> | void;
}

const InventoryTable = forwardRef<InventoryTableHandle, InventoryTableProps>(function InventoryTable(
  {
    inventory,
    sizeColumns,
    editable = false,
    filteredColumns = [],
    loading = false,
    onQtyChange,
    onSave,
  },
  ref
) {
  const [filters, setFilters] = useState<any>({});
  const [savingRowId, setSavingRowId] = useState<string | null>(null);
  const dtRef = useRef<DataTableRef<iInventoryDisplayRow[]>>(null);

  useImperativeHandle(ref, () => ({
    getProcessedRows: () =>
      (dtRef.current?.getProcessedData?.() as iInventoryDisplayRow[]) ?? [],
  }));

  // Initialize filters
  useEffect(() => {
    const f: any = {};
    filteredColumns.forEach((col) => {
      f[col.field] = {
        operator: "and",
        constraints: [{ value: null, matchMode: col.filterMatchMode || "startsWith" }],
      };
    });
    setFilters(f);
  }, [filteredColumns]);

  const FilterFooterTemplate = ({ field }: { field: string }) => {
    const columnFilter = filters[field];
    const isFiltered = columnFilter?.constraints?.some(
      (c: any) => c.value !== null && c.value !== ""
    );

    const clearFilter = () => {
      if (!columnFilter?.constraints) return;
      const newFilters = { ...filters };
      newFilters[field] = {
        ...newFilters[field],
        constraints: newFilters[field].constraints.map((c: any, i: number) =>
          i === 0 ? { ...c, value: null } : c
        ),
      };
      setFilters(newFilters);
    };

    const label = inventoryFieldLabels[field] || field;

    return (
      <div className="p-column-filter-footer-info">
        <span>
          Filter by <strong>{label}</strong>
        </span>
        {isFiltered && (
          <Button
            icon="pi pi-times"
            className="p-button-rounded p-button-text p-button-danger"
            onClick={clearFilter}
            tooltip="Clear filter"
          />
        )}
      </div>
    );
  };

  const filterApplyTemplate = (options: any) => (
    <Button
      icon="pi pi-check"
      className="p-button-success p-button-icon-only p-button-secondary"
      onClick={options.filterApplyCallback}
    />
  );

  const filterClearTemplate = (options: any) => (
    <Button
      icon="pi pi-times"
      className="p-button p-button-icon-only p-button-secondary"
      onClick={options.filterClearCallback}
    />
  );

  const onRowEditComplete = async ({ newData }: DataTableRowEditCompleteEvent) => {
    if (!onSave) return;

    const typedRow = newData as iInventoryDisplayRow;
    setSavingRowId(typedRow.id);
    await onSave(typedRow);
    setSavingRowId(null);
  };

  const renderSizeEditor = (
    options: { rowData: iInventoryDisplayRow },
    sizeName: string
  ) => {
    const cell = options.rowData.sizes[sizeName];
    return (
      <InputNumber
        value={cell?.qty ?? 0}
        inputClassName="w-full"
        onValueChange={(e) =>
          onQtyChange?.(
            options.rowData.styleNumber,
            options.rowData.colorName,
            sizeName,
            Number(e.value ?? 0)
          )
        }
      />
    );
  };

  return (
    <div className="container">
      <div className="content-card">
        <div className="inventory-table-wrapper">
          <DataTable
            ref={dtRef}
            value={inventory}
            dataKey="id"
            filters={filters}
            onFilter={(e) => setFilters(e.filters)}
            filterDisplay="menu"
            editMode={editable ? "row" : undefined}
            onRowEditComplete={editable ? onRowEditComplete : undefined}
            resizableColumns
            scrollable
            scrollHeight="flex"
            columnResizeMode="expand"
            className="p-datatable-gridlines"
            loading={loading || savingRowId !== null}
          >
            {filteredColumns.map((col) => (
              <Column
                key={col.field}
                field={col.field}
                header={col.header}
                filter
                filterMatchMode={col.filterMatchMode || "startsWith"}
                filterFooter={() => <FilterFooterTemplate field={col.field} />}
                filterApply={filterApplyTemplate}
                filterClear={filterClearTemplate}
                className={col.className}
              />
            ))}

            {sizeColumns.map((size) => (
              <Column
                key={size.sizeName}
                header={size.sizeName}
                body={(row) => row.sizes[size.sizeName]?.qty ?? 0}
                editor={editable ? (options) => renderSizeEditor(options, size.sizeName) : undefined}
                style={{ textAlign: "center" }}
                className="col-size"
              />
            ))}

            {editable && (
              <Column
                rowEditor
                headerStyle={{ width: "10%", minWidth: "8rem" }}
                bodyStyle={{ textAlign: "center" }}
              />
            )}
          </DataTable>
        </div>
      </div>
    </div>
  );
});

export default InventoryTable;
