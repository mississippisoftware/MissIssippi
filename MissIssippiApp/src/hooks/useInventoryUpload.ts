import { useCallback, useState } from "react";
import type {
  InventoryUploadMode,
  InventoryUploadPreflightResult,
  InventoryUploadRequestPayload,
  InventoryUploadResult,
  InventoryUploadRow,
  MissingSizeBehavior,
} from "../service/InventoryUploadService";
import { parseInventoryUploadFile } from "../utils/parseInventoryUploadFile";

type UploadRequestOptions = {
  seasonNameOverride?: string;
  allowPartial?: boolean;
  allowDuplicateDataset?: boolean;
  missingSizeBehavior?: MissingSizeBehavior;
  userNote?: string;
};

type UseInventoryUploadParams = {
  sizeNames: string[];
  preflightInventory: (
    payload: InventoryUploadRequestPayload
  ) => Promise<InventoryUploadPreflightResult>;
  uploadInventory: (
    payload: InventoryUploadRequestPayload,
    idempotencyKey?: string
  ) => Promise<InventoryUploadResult>;
  createIdempotencyKey: () => string;
};

type UseInventoryUploadResult = {
  fileName: string;
  rows: InventoryUploadRow[];
  parseErrors: string[];
  requiresSeasonSelection: boolean;
  mergedDuplicateRows: number;
  detectedSizeColumns: string[];
  ignoredHeaderColumns: string[];
  idempotencyKey: string;
  setFile: (file: File | null) => Promise<void>;
  uploadResult: InventoryUploadResult | null;
  preflightResult: InventoryUploadPreflightResult | null;
  preflighting: boolean;
  uploading: boolean;
  uploadMode: InventoryUploadMode;
  setUploadMode: (mode: InventoryUploadMode) => void;
  preflight: (
    options?: UploadRequestOptions
  ) => Promise<InventoryUploadPreflightResult | null>;
  upload: (options?: UploadRequestOptions) => Promise<InventoryUploadResult | null>;
  reset: () => void;
};

const normalizeKey = (value: string | undefined | null) => (value ?? "").trim().toLowerCase();

const aggregateRows = (rows: InventoryUploadRow[]): InventoryUploadRow[] => {
  const map = new Map<string, InventoryUploadRow>();

  rows.forEach((row) => {
    const key = [
      normalizeKey(row.seasonName),
      normalizeKey(row.itemNumber),
      normalizeKey(row.colorName),
    ].join("|");

    const existing = map.get(key);
    if (!existing) {
      map.set(key, {
        rowNumber: row.rowNumber,
        seasonName: row.seasonName,
        itemNumber: row.itemNumber,
        colorName: row.colorName,
        sizes: { ...row.sizes },
      });
      return;
    }

    Object.entries(row.sizes).forEach(([sizeName, qty]) => {
      const existingQty = existing.sizes[sizeName] ?? 0;
      existing.sizes[sizeName] = existingQty + (qty ?? 0);
    });

    if (existing.rowNumber === undefined) {
      existing.rowNumber = row.rowNumber;
    } else if (row.rowNumber !== undefined) {
      existing.rowNumber = Math.min(existing.rowNumber, row.rowNumber);
    }
  });

  return [...map.values()];
};

export const useInventoryUpload = ({
  sizeNames,
  preflightInventory,
  uploadInventory,
  createIdempotencyKey,
}: UseInventoryUploadParams): UseInventoryUploadResult => {
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<InventoryUploadRow[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [requiresSeasonSelection, setRequiresSeasonSelection] = useState(false);
  const [mergedDuplicateRows, setMergedDuplicateRows] = useState(0);
  const [detectedSizeColumns, setDetectedSizeColumns] = useState<string[]>([]);
  const [ignoredHeaderColumns, setIgnoredHeaderColumns] = useState<string[]>([]);
  const [idempotencyKey, setIdempotencyKey] = useState(createIdempotencyKey());
  const [uploadResult, setUploadResult] = useState<InventoryUploadResult | null>(null);
  const [preflightResult, setPreflightResult] = useState<InventoryUploadPreflightResult | null>(
    null
  );
  const [preflighting, setPreflighting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMode, setUploadMode] = useState<InventoryUploadMode>("replace");

  const reset = useCallback(() => {
    setFileName("");
    setRows([]);
    setParseErrors([]);
    setRequiresSeasonSelection(false);
    setMergedDuplicateRows(0);
    setDetectedSizeColumns([]);
    setIgnoredHeaderColumns([]);
    setUploadResult(null);
    setPreflightResult(null);
    setIdempotencyKey(createIdempotencyKey());
  }, [createIdempotencyKey]);

  const setFile = useCallback(
    async (file: File | null) => {
      if (!file) {
        reset();
        return;
      }

      reset();
      setFileName(file.name);

      try {
        const buffer = await file.arrayBuffer();
        const parsed = parseInventoryUploadFile({ buffer, sizeNames });
        const aggregatedRows = aggregateRows(parsed.rows);
        setRows(aggregatedRows);
        setParseErrors(parsed.errors);
        setRequiresSeasonSelection(!parsed.seasonColumnDetected);
        setMergedDuplicateRows(parsed.rows.length - aggregatedRows.length);
        setDetectedSizeColumns(parsed.detectedSizeColumns);
        setIgnoredHeaderColumns(parsed.ignoredHeaderColumns);
        setIdempotencyKey(createIdempotencyKey());
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setParseErrors([`Failed to read file: ${message}`]);
      }
    },
    [createIdempotencyKey, reset, sizeNames]
  );

  const buildPayload = useCallback(
    (options?: UploadRequestOptions): InventoryUploadRequestPayload => {
      const seasonNameOverride = options?.seasonNameOverride?.trim() ?? "";
      const normalizedRows = rows.map((row) => ({
        ...row,
        seasonName: row.seasonName?.trim() ? row.seasonName : seasonNameOverride,
      }));

      return {
        rows: normalizedRows,
        mode: uploadMode,
        idempotencyKey,
        allowPartial: options?.allowPartial ?? false,
        allowDuplicateDataset: options?.allowDuplicateDataset ?? false,
        missingSizeBehavior: options?.missingSizeBehavior ?? "zero",
        userNote: options?.userNote?.trim() || undefined,
      };
    },
    [idempotencyKey, rows, uploadMode]
  );

  const preflight = useCallback(
    async (options?: UploadRequestOptions) => {
      if (rows.length === 0 || parseErrors.length > 0) {
        setPreflightResult(null);
        return null;
      }

      setPreflighting(true);
      try {
        const payload = buildPayload(options);
        const result = await preflightInventory(payload);
        setPreflightResult(result);
        return result;
      } finally {
        setPreflighting(false);
      }
    },
    [buildPayload, parseErrors.length, preflightInventory, rows.length]
  );

  const upload = useCallback(
    async (options?: UploadRequestOptions) => {
      if (rows.length === 0 || parseErrors.length > 0) {
        return null;
      }

      setUploading(true);
      setUploadResult(null);
      try {
        const payload = buildPayload(options);
        const result = await uploadInventory(payload, idempotencyKey);
        setUploadResult(result);
        return result;
      } finally {
        setUploading(false);
      }
    },
    [buildPayload, idempotencyKey, parseErrors.length, rows.length, uploadInventory]
  );

  return {
    fileName,
    rows,
    parseErrors,
    requiresSeasonSelection,
    mergedDuplicateRows,
    detectedSizeColumns,
    ignoredHeaderColumns,
    idempotencyKey,
    setFile,
    uploadResult,
    preflightResult,
    preflighting,
    uploading,
    uploadMode,
    setUploadMode,
    preflight,
    upload,
    reset,
  };
};
