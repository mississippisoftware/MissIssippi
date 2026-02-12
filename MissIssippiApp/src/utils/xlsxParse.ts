import * as XLSX from "xlsx";
import { normalizeHeader } from "../items/itemsColorsUtils";

export const normalizeHeaderValue = (value: unknown) => normalizeHeader(value);

export const normalizeHeaders = (headerRow: unknown[]): string[] =>
  headerRow.map(normalizeHeaderValue);

export const findHeaderIndex = (normalizedHeaders: string[], candidates: string[]): number => {
  for (const candidate of candidates) {
    const index = normalizedHeaders.indexOf(normalizeHeaderValue(candidate));
    if (index >= 0) return index;
  }
  return -1;
};

export const buildHeaderIndexMap = (normalizedHeaders: string[]): Map<string, number> => {
  const map = new Map<string, number>();
  normalizedHeaders.forEach((header, index) => {
    if (!header) return;
    map.set(header, index);
  });
  return map;
};

export const readFirstSheetRows = (
  buffer: ArrayBuffer
): { rows: unknown[][]; errors: string[] } => {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return { rows: [], errors: ["No worksheet found in the file."] };
  }

  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1, defval: "" });
  if (rows.length === 0) {
    return { rows: [], errors: ["The worksheet is empty."] };
  }

  return { rows, errors: [] };
};

export const parseOptionalNumber = (value: unknown): number | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  const raw = String(value).trim();
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isNaN(parsed) ? null : parsed;
};
