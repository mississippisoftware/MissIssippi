import { DataTable } from "primereact/datatable";
import type {
  DataTable as DataTableRef,
  DataTableProps,
  DataTableRowEditCompleteEvent,
} from "primereact/datatable";
import { Column } from "primereact/column";
import type { ColumnProps } from "primereact/column";
import { Button } from "primereact/button";
import { InputNumber } from "primereact/inputnumber";
import type { iInventoryDisplayRow, iSize } from "../utils/DataInterfaces";
import { useState, useEffect, useRef, forwardRef, useImperativeHandle, useMemo, useCallback } from "react";
import type { ReactNode } from "react";
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
  embedded?: boolean;
  scrollable?: boolean;
  scrollHeight?: string;
  showRowTotals?: boolean;
  rowTotalHeader?: string;
  onQtyChange?: (itemNumber: string, colorName: string, size: string, qty: number) => void;
  onSave?: (row: iInventoryDisplayRow) => Promise<void> | void;
}

type DataTableFilterMeta = NonNullable<DataTableProps<iInventoryDisplayRow[]>["filters"]>;
type FilterApplyTemplateOptions = Parameters<
  Exclude<ColumnProps["filterApply"], ReactNode | undefined>
>[0];
type FilterClearTemplateOptions = Parameters<
  Exclude<ColumnProps["filterClear"], ReactNode | undefined>
>[0];

const buildInitialFilters = (columns: FilterableColumn[]): DataTableFilterMeta =>
  columns.reduce<DataTableFilterMeta>((acc, col) => {
    acc[col.field] = {
      operator: "and",
      constraints: [{ value: null, matchMode: col.filterMatchMode || "startsWith" }],
    };
    return acc;
  }, {});

const InventoryTable = forwardRef<InventoryTableHandle, InventoryTableProps>(function InventoryTable(
  {
    inventory,
    sizeColumns,
    editable = false,
    filteredColumns = [],
    loading = false,
    embedded = false,
    scrollable = true,
    scrollHeight = "flex",
    showRowTotals = false,
    rowTotalHeader = "Total",
    onQtyChange,
    onSave,
  },
  ref
) {
  const initialFilters = useMemo(() => buildInitialFilters(filteredColumns), [filteredColumns]);
  const [filters, setFilters] = useState<DataTableFilterMeta>(initialFilters);
  const [savingRowId, setSavingRowId] = useState<string | null>(null);
  const dtRef = useRef<DataTableRef<iInventoryDisplayRow[]> | null>(null);

  useImperativeHandle(ref, () => ({
    getProcessedRows: () => dtRef.current?.getProcessedData?.() ?? [],
  }));

  // eslint-disable-next-line react-hooks/set-state-in-effect -- reset filters when columns change
  useEffect(() => setFilters(initialFilters), [initialFilters]);

  const renderFilterFooter = useCallback(
    (field: string) => {
      const columnFilter = filters[field];
      const constraints =
        columnFilter && "constraints" in columnFilter ? columnFilter.constraints : undefined;
      const isFiltered =
        constraints?.some((constraint) => constraint.value !== null && constraint.value !== "") ??
        false;

      const clearFilter = () => {
        if (!columnFilter || !("constraints" in columnFilter)) return;
        const newFilters: DataTableFilterMeta = { ...filters };
        newFilters[field] = {
          ...columnFilter,
          constraints: columnFilter.constraints.map((constraint, index) =>
            index === 0 ? { ...constraint, value: null } : constraint
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
              icon="pi pi-filter-slash"
              className="btn-neutral btn-text btn-icon"
              onClick={clearFilter}
              aria-label="Clear filter"
              tooltip="Clear filter"
            />
          )}
        </div>
      );
    },
    [filters]
  );

  const filterApplyTemplate = useCallback(
    (options: FilterApplyTemplateOptions) => (
      <Button
        icon="pi pi-search"
        className="btn-primary btn-text btn-icon"
        onClick={options.filterApplyCallback}
        aria-label="Apply filter"
      />
    ),
    []
  );

  const filterClearTemplate = useCallback(
    (options: FilterClearTemplateOptions) => (
      <Button
        icon="pi pi-filter-slash"
        className="btn-neutral btn-text btn-icon"
        onClick={options.filterClearCallback}
        aria-label="Clear filter"
      />
    ),
    []
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
            options.rowData.itemNumber,
            options.rowData.colorName,
            sizeName,
            Number(e.value ?? 0)
          )
        }
      />
    );
  };

  const shouldShowRowTotals = showRowTotals && sizeColumns.length > 0;
  const getRowTotal = (row: iInventoryDisplayRow) =>
    sizeColumns.reduce((sum, size) => sum + (row.sizes[size.sizeName]?.qty ?? 0), 0);

  const table = (
    <div className="inventory-table-wrapper">
      <DataTable
        ref={dtRef}
        value={inventory}
        dataKey="id"
        filters={filters}
        onFilter={(e) => setFilters(e.filters)}
        filterDisplay="menu"
        sortMode="multiple"
        editMode={editable ? "row" : undefined}
        onRowEditComplete={editable ? onRowEditComplete : undefined}
        resizableColumns
        scrollable={scrollable}
        scrollHeight={scrollable ? scrollHeight : undefined}
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
            filterFooter={() => renderFilterFooter(col.field)}
            filterApply={filterApplyTemplate}
            filterClear={filterClearTemplate}
            className={col.className}
            sortable
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

        {shouldShowRowTotals && (
          <Column
            key="rowTotal"
            header={rowTotalHeader}
            body={(row) => getRowTotal(row)}
            style={{ textAlign: "center" }}
            className="col-total"
          />
        )}

        {editable && (
          <Column
            rowEditor
            headerStyle={{ width: "10%", minWidth: "8rem" }}
            bodyStyle={{ textAlign: "center" }}
          />
        )}
      </DataTable>
    </div>
  );

  return embedded ? (
    table
  ) : (
    <div className="container">
      <div className="content-card">{table}</div>
    </div>
  );
});

export default InventoryTable;
