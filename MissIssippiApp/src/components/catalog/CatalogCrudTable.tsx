import type { ReactNode } from "react";
import { DataTable, type DataTableRowEditCompleteEvent, type DataTableValue } from "primereact/datatable";

type CatalogCrudTableProps<TRecord extends DataTableValue> = {
  data: TRecord[];
  dataKey: string;
  loading: boolean;
  editingRows: Record<string, boolean>;
  onRowEditChange: (event: unknown) => void;
  onRowEditComplete: (event: DataTableRowEditCompleteEvent) => void | Promise<void>;
  onRowEditCancel: (event: unknown) => void;
  children: ReactNode;
  className?: string;
  wrapperClassName?: string;
  sortField?: string;
  sortOrder?: 1 | -1 | 0;
  sortMode?: "single" | "multiple";
  emptyMessage?: string;
};

export default function CatalogCrudTable<TRecord extends DataTableValue>({
  data,
  dataKey,
  loading,
  editingRows,
  onRowEditChange,
  onRowEditComplete,
  onRowEditCancel,
  children,
  className = "p-datatable-gridlines items-colors-table",
  wrapperClassName = "items-table-wrapper mt-3",
  sortField,
  sortOrder,
  sortMode = "single",
  emptyMessage,
}: CatalogCrudTableProps<TRecord>) {
  return (
    <div className={wrapperClassName}>
      <DataTable
        value={data}
        dataKey={dataKey}
        loading={loading}
        rowHover
        editMode="row"
        editingRows={editingRows}
        onRowEditChange={onRowEditChange}
        onRowEditComplete={onRowEditComplete}
        onRowEditCancel={onRowEditCancel}
        className={className}
        sortField={sortField}
        sortOrder={sortOrder}
        sortMode={sortMode}
        emptyMessage={emptyMessage}
      >
        {children}
      </DataTable>
    </div>
  );
}
