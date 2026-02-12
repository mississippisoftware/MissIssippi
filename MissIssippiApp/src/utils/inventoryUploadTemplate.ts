import type { iSize } from "./DataInterfaces";
import { appendSheet, createWorkbook, saveWorkbook, sheetFromAoa } from "./xlsxUtils";

export const downloadInventoryUploadTemplate = (sizeColumns: iSize[]): void => {
  if (sizeColumns.length === 0) return;

  const sizeNames = sizeColumns.map((size) => size.sizeName);
  const headers = ["Season", "Style", "Color", ...sizeNames];
  const worksheet = sheetFromAoa([headers]);
  const workbook = createWorkbook();
  appendSheet(workbook, worksheet, "Inventory Upload");
  saveWorkbook(workbook, "inventory_upload_template");
};
