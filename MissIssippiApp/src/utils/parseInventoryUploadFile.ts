import type { InventoryUploadRow } from "../service/InventoryUploadService";
import {
  buildHeaderIndexMap,
  findHeaderIndex,
  normalizeHeaders,
  normalizeHeaderValue,
  readFirstSheetRows,
} from "./xlsxParse";

const REQUIRED_HEADERS = {
  season: ["season", "season name", "seasonname"],
  style: ["style", "style number", "stylenumber", "style #", "style no"],
  color: ["color", "colour", "color name", "colour name", "colorname", "colourname"],
};

export type ParseInventoryUploadResult = {
  rows: InventoryUploadRow[];
  errors: string[];
  seasonColumnDetected: boolean;
  detectedSizeColumns: string[];
  ignoredHeaderColumns: string[];
};

export const parseInventoryUploadFile = (args: {
  buffer: ArrayBuffer;
  sizeNames: string[];
}): ParseInventoryUploadResult => {
  const { buffer, sizeNames } = args;
  const { rows: rawRows, errors: sheetErrors } = readFirstSheetRows(buffer);
  if (sheetErrors.length > 0) {
    return {
      rows: [],
      errors: sheetErrors,
      seasonColumnDetected: false,
      detectedSizeColumns: [],
      ignoredHeaderColumns: [],
    };
  }

  const headerRow = rawRows[0] as unknown[];
  const normalizedHeaders = normalizeHeaders(headerRow);

  const seasonIndex = findHeaderIndex(normalizedHeaders, REQUIRED_HEADERS.season);
  const styleIndex = findHeaderIndex(normalizedHeaders, REQUIRED_HEADERS.style);
  const colorIndex = findHeaderIndex(normalizedHeaders, REQUIRED_HEADERS.color);

  const missingRequired = [
    styleIndex < 0 ? "Style" : null,
    colorIndex < 0 ? "Color" : null,
  ].filter(Boolean) as string[];

  if (missingRequired.length > 0) {
    return {
      rows: [],
      errors: [`Missing required columns: ${missingRequired.join(", ")}.`],
      seasonColumnDetected: seasonIndex >= 0,
      detectedSizeColumns: [],
      ignoredHeaderColumns: [],
    };
  }

  const sizeIndexMap = buildHeaderIndexMap(normalizedHeaders);
  const availableSizeColumns = sizeNames.filter((sizeName) =>
    sizeIndexMap.has(normalizeHeaderValue(sizeName))
  );

  if (availableSizeColumns.length === 0) {
    return {
      rows: [],
      errors: ["No recognized size columns found in the file header."],
      seasonColumnDetected: seasonIndex >= 0,
      detectedSizeColumns: [],
      ignoredHeaderColumns: [],
    };
  }

  const requiredHeaderCandidates = new Set<string>([
    ...REQUIRED_HEADERS.season,
    ...REQUIRED_HEADERS.style,
    ...REQUIRED_HEADERS.color,
  ].map(normalizeHeaderValue));
  const knownSizeCandidates = new Set(sizeNames.map((sizeName) => normalizeHeaderValue(sizeName)));
  const ignoredHeaderColumns = headerRow
    .map((value, index) => ({ raw: String(value ?? "").trim(), normalized: normalizedHeaders[index] ?? "" }))
    .filter((column) => column.raw && column.normalized)
    .filter(
      (column) =>
        !requiredHeaderCandidates.has(column.normalized) &&
        !knownSizeCandidates.has(column.normalized)
    )
    .map((column) => column.raw);

  const parsedRows: InventoryUploadRow[] = [];
  const errors: string[] = [];

  rawRows.slice(1).forEach((row, rowIndex) => {
    const values = row as Array<unknown>;
    const rowNumber = rowIndex + 2;

    const seasonName = seasonIndex >= 0 ? String(values[seasonIndex] ?? "").trim() : "";
    const itemNumber = String(values[styleIndex] ?? "").trim();
    const colorName = String(values[colorIndex] ?? "").trim();

    const hasSizeValues = availableSizeColumns.some((sizeName) => {
      const sizeIndex = sizeIndexMap.get(normalizeHeaderValue(sizeName)) ?? -1;
      const cell = values[sizeIndex];
      return cell !== "" && cell !== null && cell !== undefined;
    });

    if (!seasonName && !itemNumber && !colorName && !hasSizeValues) {
      return;
    }

    if (seasonIndex >= 0 && !seasonName) {
      errors.push(`Row ${rowNumber}: Season is required.`);
    }
    if (!itemNumber) {
      errors.push(`Row ${rowNumber}: Style is required.`);
    }
    if (!colorName) {
      errors.push(`Row ${rowNumber}: Color is required.`);
    }

    const sizesPayload: Record<string, number | null> = {};
    sizeNames.forEach((sizeName) => {
      const sizeIndex = sizeIndexMap.get(normalizeHeaderValue(sizeName)) ?? -1;
      const rawValue = values[sizeIndex];
      if (rawValue === "" || rawValue === null || rawValue === undefined) {
        sizesPayload[sizeName] = null;
        return;
      }

      const numericValue =
        typeof rawValue === "number" ? rawValue : Number(String(rawValue).trim());
      if (Number.isNaN(numericValue)) {
        errors.push(`Row ${rowNumber}: Quantity for size '${sizeName}' is not a number.`);
        sizesPayload[sizeName] = null;
        return;
      }

      sizesPayload[sizeName] = Math.max(0, Math.floor(numericValue));
    });

    parsedRows.push({
      rowNumber,
      seasonName,
      itemNumber,
      colorName,
      sizes: sizesPayload,
    });
  });

  return {
    rows: parsedRows,
    errors,
    seasonColumnDetected: seasonIndex >= 0,
    detectedSizeColumns: availableSizeColumns,
    ignoredHeaderColumns,
  };
};
