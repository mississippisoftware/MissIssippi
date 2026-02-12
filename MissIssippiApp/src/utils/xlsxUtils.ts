import * as XLSX from "xlsx";
import { makeDateStamp } from "./dateFormat";

export const createWorkbook = (): XLSX.WorkBook => XLSX.utils.book_new();

export const appendSheet = (
  workbook: XLSX.WorkBook,
  worksheet: XLSX.WorkSheet,
  sheetName: string
): void => {
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
};

export const sheetFromAoa = (rows: Array<Array<unknown>>): XLSX.WorkSheet =>
  XLSX.utils.aoa_to_sheet(rows);

export const sheetFromJson = <T extends Record<string, unknown>>(
  rows: T[],
  options?: XLSX.SheetJSONOpts
): XLSX.WorkSheet => XLSX.utils.json_to_sheet(rows, options);

export const buildTimestampedFilename = (baseName: string, date: Date = new Date()): string =>
  `${baseName}_${makeDateStamp(date)}.xlsx`;

export const writeWorkbook = (workbook: XLSX.WorkBook, filename: string): void => {
  XLSX.writeFile(workbook, filename);
};

export const saveWorkbook = (workbook: XLSX.WorkBook, baseName: string, date?: Date): void => {
  writeWorkbook(workbook, buildTimestampedFilename(baseName, date ?? new Date()));
};
