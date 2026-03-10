import { fetchJson } from "./apiClient";

const API = {
  uploadInventory: "/InventoryUpload/UploadInventory",
  preflightInventory: "/InventoryUpload/PreflightInventory",
  getUploadBatches: "/InventoryUpload/GetUploadBatches",
  undoUploadBatch: "/InventoryUpload/UndoUploadBatch",
};

export interface InventoryUploadRow {
  rowNumber?: number;
  seasonName: string;
  itemNumber: string;
  colorName: string;
  sizes: Record<string, number | null>;
}

export type InventoryUploadMode = "replace" | "add" | "subtract";
export type MissingSizeBehavior = "zero" | "ignore";

export interface InventoryUploadError {
  rowNumber: number;
  message: string;
}

export interface InventoryUploadWarning {
  rowNumber: number;
  message: string;
}

export interface InventoryUploadIssue {
  rowNumber: number;
  severity: "error" | "warning";
  code: string;
  field: string;
  message: string;
  suggestions: string[];
}

export interface InventoryUploadPreflightResult {
  canUpload: boolean;
  duplicateDatasetDetected: boolean;
  duplicateUploadBatchId?: string | null;
  datasetHash?: string | null;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  warningCount: number;
  errorCount: number;
  issues: InventoryUploadIssue[];
}

export interface InventoryUploadResult {
  success: boolean;
  partialApplied: boolean;
  duplicateDatasetDetected: boolean;
  undone: boolean;
  message?: string | null;
  datasetHash?: string | null;
  uploadBatchId?: string | null;
  inventoryHistoryBatchId?: string | null;
  processedRows: number;
  createdSkus: number;
  createdItemColors: number;
  createdInventory: number;
  updatedInventory: number;
  warnings: InventoryUploadWarning[];
  errors: InventoryUploadError[];
}

export interface InventoryUploadBatchSummary {
  uploadBatchId: string;
  createdAt: string;
  status: string;
  mode: string;
  datasetHash: string;
  rowCount: number;
  processedRows: number;
  errorCount: number;
  warningCount: number;
  isUndone: boolean;
  inventoryHistoryBatchId?: string | null;
  undoHistoryBatchId?: string | null;
  message?: string | null;
}

export interface InventoryUploadRequestPayload {
  rows: InventoryUploadRow[];
  mode: InventoryUploadMode;
  idempotencyKey?: string;
  allowPartial?: boolean;
  allowDuplicateDataset?: boolean;
  missingSizeBehavior?: MissingSizeBehavior;
  userNote?: string;
}

export const InventoryUploadService = {
  async preflightInventory(payload: InventoryUploadRequestPayload): Promise<InventoryUploadPreflightResult> {
    return fetchJson<InventoryUploadPreflightResult>(API.preflightInventory, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },

  async uploadInventory(payload: InventoryUploadRequestPayload, idempotencyKey?: string): Promise<InventoryUploadResult> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (idempotencyKey) {
      headers["Idempotency-Key"] = idempotencyKey;
    }

    return fetchJson<InventoryUploadResult>(API.uploadInventory, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
  },

  async getUploadBatches(take = 50): Promise<InventoryUploadBatchSummary[]> {
    return fetchJson<InventoryUploadBatchSummary[]>(`${API.getUploadBatches}?take=${take}`);
  },

  async undoUploadBatch(uploadBatchId: string): Promise<InventoryUploadResult> {
    return fetchJson<InventoryUploadResult>(
      `${API.undoUploadBatch}?uploadBatchId=${encodeURIComponent(uploadBatchId)}`,
      {
        method: "POST",
      }
    );
  },

  createIdempotencyKey(): string {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
    return `upload-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  },

  toErrorRows(
    issues: InventoryUploadIssue[],
    uploadErrors: InventoryUploadError[],
    uploadWarnings: InventoryUploadWarning[]
  ): Array<Record<string, string | number>> {
    const rowsFromIssues = issues.map((issue) => ({
      source: "preflight",
      severity: issue.severity,
      rowNumber: issue.rowNumber,
      field: issue.field,
      code: issue.code,
      message: issue.message,
      suggestions: issue.suggestions.join(" | "),
    }));

    const rowsFromUploadErrors = uploadErrors.map((error) => ({
      source: "upload",
      severity: "error",
      rowNumber: error.rowNumber,
      field: "",
      code: "upload_error",
      message: error.message,
      suggestions: "",
    }));

    const rowsFromWarnings = uploadWarnings.map((warning) => ({
      source: "upload",
      severity: "warning",
      rowNumber: warning.rowNumber,
      field: "",
      code: "upload_warning",
      message: warning.message,
      suggestions: "",
    }));

    return [...rowsFromIssues, ...rowsFromUploadErrors, ...rowsFromWarnings];
  },
};

export default InventoryUploadService;
