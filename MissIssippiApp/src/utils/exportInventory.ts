import type { RefObject } from "react";
import type { iInventoryDisplayRow, iSize } from "./DataInterfaces";
import type { FilterableColumn, InventoryTableHandle } from "../inventory/InventoryTable";
import { exportInventoryToExcel } from "./ExportInventoryToExcel";

type ExportInventoryArgs = {
  tableRef: RefObject<InventoryTableHandle | null>;
  fallbackRows: iInventoryDisplayRow[];
  sizeColumns: iSize[];
  uiColumns: FilterableColumn[];
  title: string;
  sheetName: string;
  filename: string;
};

export const exportInventory = ({
  tableRef,
  fallbackRows,
  sizeColumns,
  uiColumns,
  title,
  sheetName,
  filename,
}: ExportInventoryArgs): void => {
  const rows = tableRef.current?.getProcessedRows() ?? fallbackRows;
  exportInventoryToExcel({
    rows,
    sizeColumns,
    uiColumns,
    title,
    sheetName,
    filename,
  });
};
