import { type ChangeEvent, useEffect, useMemo, useState } from "react";
import { Button } from 'primereact/button';
import PageShell from "../layout/PageShell";
import type { FilterableColumn } from "./InventoryTable";
import { useInventorySizes } from "../hooks/useInventorySizes";
import { useInventoryUpload } from "../hooks/useInventoryUpload";
import { InventoryService, type SeasonRecord } from "../service/InventoryService";
import {
  type InventoryUploadBatchSummary,
  type InventoryUploadError,
  InventoryUploadService,
  type InventoryUploadWarning,
  type MissingSizeBehavior,
} from "../service/InventoryUploadService";
import { downloadInventoryUploadTemplate } from "../utils/inventoryUploadTemplate";
import { exportInventoryToExcel } from "../utils/ExportInventoryToExcel";
import { appendSheet, createWorkbook, saveWorkbook, sheetFromJson } from "../utils/xlsxUtils";
import { formatBatchTimestamp } from "../utils/dateFormat";

const getStatusVariant = (status: string) => {
  const normalized = status.toLowerCase();
  if (normalized === "applied") return "success";
  if (normalized === "undone") return "secondary";
  if (normalized === "duplicate_blocked") return "warning";
  return "danger";
};

const INVENTORY_EXPORT_COLUMNS: FilterableColumn[] = [
  { field: "seasonName", header: "Season", filterMatchMode: "startsWith", className: "col-season" },
  { field: "itemNumber", header: "Style", filterMatchMode: "startsWith", className: "col-style" },
  { field: "colorName", header: "Color", filterMatchMode: "contains", className: "col-color" },
];

export default function InventoryUpload() {
  const [pageError, setPageError] = useState<string | null>(null);
  const [seasonOptions, setSeasonOptions] = useState<SeasonRecord[]>([]);
  const [loadingSeasons, setLoadingSeasons] = useState(true);
  const [seasonLookupError, setSeasonLookupError] = useState<string | null>(null);
  const [selectedSeasonName, setSelectedSeasonName] = useState("");
  const [allowPartial, setAllowPartial] = useState(false);
  const [allowDuplicateDataset, setAllowDuplicateDataset] = useState(false);
  const [missingSizeBehavior, setMissingSizeBehavior] =
    useState<MissingSizeBehavior>("ignore");
  const [userNote, setUserNote] = useState("");
  const [uploadBatches, setUploadBatches] = useState<InventoryUploadBatchSummary[]>([]);
  const [loadingUploadBatches, setLoadingUploadBatches] = useState(true);
  const [undoingBatchId, setUndoingBatchId] = useState<string | null>(null);
  const [downloadingInventory, setDownloadingInventory] = useState(false);

  const { sizeColumns: sizes, sizeLoading: loadingSizes, sizeError } = useInventorySizes();

  const sizeNames = useMemo(() => sizes.map((size) => size.sizeName), [sizes]);
  const {
    fileName,
    rows,
    parseErrors,
    requiresSeasonSelection,
    mergedDuplicateRows,
    detectedSizeColumns,
    ignoredHeaderColumns,
    idempotencyKey,
    uploadResult,
    preflightResult,
    preflighting,
    uploading,
    uploadMode,
    setUploadMode,
    setFile,
    preflight,
    upload,
  } = useInventoryUpload({
    sizeNames,
    preflightInventory: InventoryUploadService.preflightInventory,
    uploadInventory: InventoryUploadService.uploadInventory,
    createIdempotencyKey: InventoryUploadService.createIdempotencyKey,
  });

  useEffect(() => {
    let isMounted = true;

    InventoryService.getSeasons()
      .then((seasons) => {
        if (!isMounted) return;
        setSeasonOptions(seasons.filter((season) => season.seasonName?.trim()));
        setSeasonLookupError(null);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        console.error(err);
        const message = err instanceof Error ? err.message : "Failed to load seasons.";
        setSeasonLookupError(message);
      })
      .finally(() => {
        if (!isMounted) return;
        setLoadingSeasons(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const loadUploadBatches = async () => {
    setLoadingUploadBatches(true);
    try {
      const data = await InventoryUploadService.getUploadBatches(25);
      setUploadBatches(data);
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Failed to load recent upload batches.";
      setPageError(message);
    } finally {
      setLoadingUploadBatches(false);
    }
  };

  useEffect(() => {
    loadUploadBatches();
  }, []);

  const sizeErrorMessage = sizeError ? `Failed to load sizes: ${sizeError}` : null;
  const seasonErrorMessage = seasonLookupError
    ? `Failed to load seasons: ${seasonLookupError}`
    : null;
  const effectivePageError = pageError ?? sizeErrorMessage ?? seasonErrorMessage;

  const rowItemNumberMap = useMemo(() => {
    const map = new Map<number, string>();
    rows.forEach((row) => {
      const rowNumber = row.rowNumber;
      const itemNumber = row.itemNumber?.trim();
      if (!rowNumber || !itemNumber || map.has(rowNumber)) {
        return;
      }
      map.set(rowNumber, itemNumber);
    });
    return map;
  }, [rows]);

  const getErrorRowLabel = (rowNumber: number) => {
    if (!rowNumber || rowNumber <= 0) {
      return "Row 0";
    }
    const itemNumber = rowItemNumberMap.get(rowNumber);
    return itemNumber ? `Row ${rowNumber} | Item ${itemNumber}` : `Row ${rowNumber}`;
  };

  const renderParseErrorText = (error: string) => {
    const match = error.match(/^Row\s+(\d+):\s*(.*)$/i);
    if (!match) {
      return error;
    }
    const rowNumber = Number(match[1]);
    const message = match[2] || "";
    const label = getErrorRowLabel(rowNumber);
    return `${label}: ${message}`;
  };

  const handleDownloadTemplate = () => {
    downloadInventoryUploadTemplate(sizes);
  };

  const handleDownloadInventory = async () => {
    setPageError(null);
    setDownloadingInventory(true);
    try {
      const inventoryRows = await InventoryService.getPivotInventory();
      exportInventoryToExcel({
        rows: inventoryRows,
        sizeColumns: sizes,
        uiColumns: INVENTORY_EXPORT_COLUMNS,
        title: "Inventory Download",
        sheetName: "Inventory",
        filename: "inventory.xlsx",
      });
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Failed to download inventory.";
      setPageError(message);
    } finally {
      setDownloadingInventory(false);
    }
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    await setFile(event.target.files?.[0] ?? null);
    setPageError(null);
    setAllowDuplicateDataset(false);
  };

  const buildUploadOptions = () => ({
    seasonNameOverride: selectedSeasonName,
    allowPartial,
    allowDuplicateDataset,
    missingSizeBehavior,
    userNote: userNote.trim() || undefined,
  });

  const ensureSeasonSelection = () => {
    if (requiresSeasonSelection && !selectedSeasonName.trim()) {
      setPageError("Please choose a season for this file before validating or uploading.");
      return false;
    }
    return true;
  };

  const handleValidate = async () => {
    if (!ensureSeasonSelection()) return;
    if (rows.length === 0 || parseErrors.length > 0) return;

    setPageError(null);
    try {
      await preflight(buildUploadOptions());
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Preflight failed.";
      setPageError(message);
    }
  };

  const handleUpload = async () => {
    if (!ensureSeasonSelection()) return;
    if (rows.length === 0 || parseErrors.length > 0) return;

    setPageError(null);
    try {
      const preflightResult = await preflight(buildUploadOptions());
      if (preflightResult && !preflightResult.canUpload) {
        setPageError(
          "Upload is blocked by preflight validation. Review and resolve issues before uploading."
        );
        return;
      }

      const result = await upload(buildUploadOptions());
      if (result) {
        await loadUploadBatches();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setPageError(`Upload failed: ${message}`);
    }
  };

  const handleExportIssues = () => {
    const issueRows = InventoryUploadService.toErrorRows(
      preflightResult?.issues ?? [],
      uploadResult?.errors ?? [],
      uploadResult?.warnings ?? []
    );

    if (issueRows.length === 0) {
      setPageError("No issues are available to export.");
      return;
    }

    const exportRows = issueRows.map((row) => {
      const rowNumberRaw = row.rowNumber;
      const rowNumber =
        typeof rowNumberRaw === "number"
          ? rowNumberRaw
          : Number.isFinite(Number(rowNumberRaw))
            ? Number(rowNumberRaw)
            : 0;
      const itemNumber = rowNumber > 0 ? rowItemNumberMap.get(rowNumber) ?? "" : "";
      return {
        source: row.source ?? "",
        severity: row.severity ?? "",
        rowNumber: row.rowNumber ?? "",
        itemNumber,
        field: row.field ?? "",
        code: row.code ?? "",
        message: row.message ?? "",
        suggestions: row.suggestions ?? "",
      };
    });

    const sheet = sheetFromJson(exportRows);
    const columnSpecs = [
      { key: "source", min: 12, max: 16 },
      { key: "severity", min: 12, max: 14 },
      { key: "rowNumber", min: 12, max: 12 },
      { key: "itemNumber", min: 14, max: 18 },
      { key: "field", min: 16, max: 20 },
      { key: "code", min: 22, max: 36 },
      { key: "message", min: 48, max: 110 },
      { key: "suggestions", min: 40, max: 110 },
    ] as const;
    (sheet as { ["!cols"]?: Array<{ wch: number }> })["!cols"] = columnSpecs.map((spec) => {
      const headerLength = spec.key.length;
      const valueLength = exportRows.reduce((max, row) => {
        const value = row[spec.key];
        const text = value === null || value === undefined ? "" : String(value);
        return Math.max(max, text.length);
      }, 0);
      const width = Math.max(spec.min, Math.min(spec.max, Math.max(headerLength + 2, valueLength + 2)));
      return { wch: width };
    });
    const workbook = createWorkbook();
    appendSheet(workbook, sheet, "Issues");
    saveWorkbook(workbook, "inventory_upload_issues");
  };

  const handleUndoBatch = async (uploadBatchId: string) => {
    setUndoingBatchId(uploadBatchId);
    setPageError(null);
    try {
      const result = await InventoryUploadService.undoUploadBatch(uploadBatchId);
      if (!result.success) {
        setPageError(result.message ?? "Undo failed.");
      }
      await loadUploadBatches();
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Undo failed.";
      setPageError(message);
    } finally {
      setUndoingBatchId(null);
    }
  };

  const uploadErrors: InventoryUploadError[] = uploadResult?.errors ?? [];
  const uploadWarnings: InventoryUploadWarning[] = uploadResult?.warnings ?? [];
  const hasUploadErrors = uploadErrors.length > 0;
  const preflightErrors = preflightResult?.issues.filter((issue) => issue.severity === "error") ?? [];
  const preflightWarnings =
    preflightResult?.issues.filter((issue) => issue.severity === "warning") ?? [];

  return (
    <PageShell
      title="Upload Inventory"
      subtitle="Validate uploaded inventory before applying updates, then track and undo upload batches if needed."
      actions={
        <>
          <button
            type="button"
            className="btn-neutral btn-outlined"
            onClick={handleDownloadTemplate}
            disabled={loadingSizes || downloadingInventory}
          >
            <i className="pi pi-file-excel" aria-hidden="true" />
            {loadingSizes ? "Loading..." : "Download Template"}
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => { void handleDownloadInventory(); }}
            disabled={loadingSizes || downloadingInventory}
          >
            <i className="pi pi-download" aria-hidden="true" />
            {downloadingInventory ? "Downloading..." : "Download Inventory"}
          </button>
        </>
      }
      tabs={
        <div className="pt-page-header__steps">
          <div className="pt-step-tab">
            <span className="pt-step-num pt-step-num--done">✓</span>
            <span className="pt-text-step-tab pt-text-step-tab--done">Prepare file</span>
          </div>
          <div className="pt-step-tab pt-step-tab--active">
            <span className="pt-step-num pt-step-num--active">2</span>
            <span className="pt-text-step-tab pt-text-step-tab--active">Configure &amp; upload</span>
          </div>
          <div className="pt-step-tab">
            <span className="pt-step-num">3</span>
            <span className="pt-text-step-tab">Review &amp; apply</span>
          </div>
        </div>
      }
    >
      {/* ── Two-column body ──────────────────────────────────────────────── */}
      <div className="pt-page-body">

        {/* Left column */}
        <div className="pt-flex-col-gap">

          {/* Card 1: Configure & Upload */}
          <div className="portal-content-card">

            {/* Card header */}
            <div className="pt-upload-section-top">
              <div className="pt-text-card-title">Configure &amp; Upload</div>
              <div className="pt-text-card-sub">Choose how validated quantities will be applied to inventory.</div>
            </div>

            <div className="pt-upload-section-body">

              {/* Mode tiles */}
              <div className="pt-text-label">Update mode</div>
              <div className="pt-mode-grid">
                <button
                  type="button"
                  className={`pt-mode-btn${uploadMode === "replace" ? " pt-mode-btn--selected" : ""}`}
                  onClick={() => setUploadMode("replace")}
                >
                  <span className="pt-mode-btn__icon"><i className="pi pi-pencil" /></span>
                  <span className="pt-text-body-strong">Change</span>
                  <span className="pt-mode-btn__desc">Replace with uploaded values</span>
                </button>
                <button
                  type="button"
                  className={`pt-mode-btn${uploadMode === "add" ? " pt-mode-btn--selected" : ""}`}
                  onClick={() => setUploadMode("add")}
                >
                  <span className="pt-mode-btn__icon"><i className="pi pi-plus" /></span>
                  <span className="pt-text-body-strong">Add</span>
                  <span className="pt-mode-btn__desc">Add to current stock</span>
                </button>
                <button
                  type="button"
                  className={`pt-mode-btn pt-mode-btn--danger${uploadMode === "subtract" ? " pt-mode-btn--selected" : ""}`}
                  onClick={() => setUploadMode("subtract")}
                >
                  <span className="pt-mode-btn__icon"><i className="pi pi-minus" /></span>
                  <span className="pt-text-body-strong">Subtract</span>
                  <span className="pt-mode-btn__desc">Deduct from current stock</span>
                </button>
              </div>

              {/* Upload zone */}
              <div className="pt-text-label">Upload file</div>
              <label className="pt-upload-zone">
                <i className="pi pi-cloud-upload pt-upload-zone-icon" aria-hidden="true" />
                <div className="pt-text-body-strong">
                  {fileName ? fileName : "Click to choose a file"}
                </div>
                <div className="pt-text-meta pt-mt-1">
                  {fileName ? "Click to change file" : "Accepts .xlsx or .xls"}
                </div>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  disabled={loadingSizes}
                  className="pt-visually-hidden"
                />
              </label>

              {/* File summary */}
              {rows.length > 0 && (
                <div className="pt-mb-3">
                  <span className="pt-text-body">{rows.length} rows ready to upload</span>
                  {mergedDuplicateRows > 0 && (
                    <span className="pt-text-meta pt-ml-2">
                      ({mergedDuplicateRows} duplicate rows merged)
                    </span>
                  )}
                  <div className="pt-text-meta pt-mt-1">
                    Idempotency key: <span className="pt-text-code">{idempotencyKey}</span>
                  </div>
                </div>
              )}

              {/* Season selector (conditional) */}
              {requiresSeasonSelection && (
                <div className="pt-mb-3">
                  <div className="pt-text-label">Season for this file</div>
                  <select
                    className="pt-form-select"
                    value={selectedSeasonName}
                    onChange={(event) => {
                      setSelectedSeasonName(event.target.value);
                      setPageError(null);
                    }}
                    disabled={loadingSeasons}
                  >
                    <option value="">
                      {loadingSeasons ? "Loading seasons..." : "Select season"}
                    </option>
                    {seasonOptions.map((season) => (
                      <option key={season.seasonId} value={season.seasonName}>
                        {season.seasonName}
                      </option>
                    ))}
                  </select>
                  <div className="pt-text-meta pt-mt-1">
                    This file has no Season column — one season is required.
                  </div>
                </div>
              )}

              {/* Note input */}
              <div className="pt-mb-3">
                <div className="pt-text-label">Upload note (optional)</div>
                <input
                  className="pt-form-input"
                  type="text"
                  value={userNote}
                  onChange={(event) => setUserNote(event.target.value)}
                  placeholder="Example: annual count import"
                />
              </div>

              {/* Options row */}
              <div className="pt-form-row-split">
                <div>
                  <div className="pt-text-label">Missing size behavior</div>
                  <select
                    className="pt-form-select"
                    value={missingSizeBehavior}
                    onChange={(event) =>
                      setMissingSizeBehavior(event.target.value as MissingSizeBehavior)
                    }
                  >
                    <option value="zero">Set missing sizes to zero</option>
                    <option value="ignore">Leave missing sizes unchanged</option>
                  </select>
                </div>
                <div className="pt-flex-col-gap-sm">
                  <label className="pt-flex-label-row">
                    <input
                      type="checkbox"
                      checked={allowPartial}
                      onChange={(event) => setAllowPartial(event.target.checked)}
                    />
                    <span className="pt-text-body">Allow partial upload (apply valid rows only)</span>
                  </label>
                  <label className="pt-flex-label-row">
                    <input
                      type="checkbox"
                      checked={allowDuplicateDataset}
                      onChange={(event) => setAllowDuplicateDataset(event.target.checked)}
                    />
                    <span className="pt-text-body">Allow duplicate dataset upload</span>
                  </label>
                </div>
              </div>

              {/* Result messages */}
              {effectivePageError && (
                <div className="pt-alert pt-alert-danger" role="alert">
                  <span className="pt-text-body">{effectivePageError}</span>
                </div>
              )}

              {detectedSizeColumns.length > 0 && (
                <div className="pt-alert pt-alert-info" role="alert">
                  <span className="pt-text-body-strong">Detected size columns: </span>
                  <span className="pt-text-body">{detectedSizeColumns.join(", ")}</span>
                </div>
              )}

              {ignoredHeaderColumns.length > 0 && (
                <div className="pt-alert pt-alert-warning" role="alert">
                  <span className="pt-text-body-strong">Ignored columns: </span>
                  <span className="pt-text-body">{ignoredHeaderColumns.join(", ")}</span>
                </div>
              )}

              {parseErrors.length > 0 && (
                <div className="pt-alert pt-alert-danger" role="alert">
                  <div className="pt-text-body-strong pt-alert__header">
                    Fix these parse issues before validating/uploading:
                  </div>
                  <ul className="pt-alert__list">
                    {parseErrors.slice(0, 10).map((error) => (
                      <li key={error}><span className="pt-text-body">{renderParseErrorText(error)}</span></li>
                    ))}
                  </ul>
                  {parseErrors.length > 10 && (
                    <div className="pt-text-meta pt-alert__footer">
                      {parseErrors.length - 10} more issue(s) not shown.
                    </div>
                  )}
                </div>
              )}

              {preflightResult && (
                <div className={`pt-alert ${preflightResult.canUpload ? "pt-alert-success" : "pt-alert-danger"}`} role="alert">
                  <div className="pt-text-body-strong">
                    Preflight summary: {preflightResult.validRows} valid / {preflightResult.invalidRows} invalid rows.
                  </div>
                  <div className="pt-text-meta">
                    Errors: {preflightResult.errorCount} | Warnings: {preflightResult.warningCount}
                    {preflightResult.datasetHash ? ` | Hash: ${preflightResult.datasetHash}` : ""}
                  </div>
                  {preflightResult.duplicateDatasetDetected && (
                    <div className="pt-alert__footer">
                      <span className="badge badge-warning">Duplicate dataset detected</span>
                    </div>
                  )}
                  {preflightErrors.length > 0 && (
                    <ul className="pt-alert__list">
                      {preflightErrors.slice(0, 8).map((issue, index) => (
                        <li key={`${issue.rowNumber}-${issue.code}-${index}`}>
                          <span className="pt-text-body">
                            {getErrorRowLabel(issue.rowNumber)}: {issue.message}
                            {issue.suggestions.length > 0 && (
                              <span className="pt-text-meta"> (suggestions: {issue.suggestions.join(", ")})</span>
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {preflightWarnings.length > 0 && (
                    <ul className="pt-alert__list">
                      {preflightWarnings.slice(0, 5).map((issue, index) => (
                        <li key={`${issue.rowNumber}-${issue.code}-w-${index}`}>
                          <span className="pt-text-body">{getErrorRowLabel(issue.rowNumber)}: {issue.message}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {uploadResult && !hasUploadErrors && (
                <div className="pt-alert pt-alert-success" role="alert">
                  <span className="pt-text-body">
                    {uploadResult.message || "Upload completed."} Processed {uploadResult.processedRows} row(s).
                    Created {uploadResult.createdSkus} SKU(s), {uploadResult.createdItemColors} style-color links,
                    and {uploadResult.createdInventory} inventory record(s). Updated {uploadResult.updatedInventory} record(s).
                  </span>
                </div>
              )}

              {uploadResult && hasUploadErrors && (
                <div className="pt-alert pt-alert-danger" role="alert">
                  <div className="pt-text-body-strong pt-alert__header">Upload completed with issues:</div>
                  <ul className="pt-alert__list">
                    {uploadErrors.slice(0, 10).map((error) => (
                      <li key={`${error.rowNumber}-${error.message}`}>
                        <span className="pt-text-body">{getErrorRowLabel(error.rowNumber)}: {error.message}</span>
                      </li>
                    ))}
                  </ul>
                  {uploadWarnings.length > 0 && (
                    <>
                      <hr />
                      <div className="pt-text-body-strong pt-alert__header">Warnings:</div>
                      <ul className="pt-alert__list">
                        {uploadWarnings.slice(0, 8).map((warning) => (
                          <li key={`${warning.rowNumber}-${warning.message}`}>
                            <span className="pt-text-body">{getErrorRowLabel(warning.rowNumber)}: {warning.message}</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Card footer */}
            <div className="pt-card-footer">
              <button
                type="button"
                className="btn-neutral btn-text"
                onClick={handleExportIssues}
                disabled={
                  (preflightResult?.issues.length ?? 0) === 0 &&
                  uploadErrors.length === 0 &&
                  uploadWarnings.length === 0
                }
              >
                <i className="pi pi-download" aria-hidden="true" />
                Export Issues
              </button>
              <div className="pt-flex-row-gap-sm">
                <Button
                  type="button"
                  className="btn-neutral btn-outlined"
                  onClick={() => { void handleValidate(); }}
                  disabled={
                    rows.length === 0 ||
                    parseErrors.length > 0 ||
                    preflighting ||
                    (requiresSeasonSelection && !selectedSeasonName.trim())
                  }
                  unstyled
                >
                  {!preflighting && <i className="pi pi-check-circle" aria-hidden="true" />}
                  {preflighting ? "Validating..." : "Validate File"}
                </Button>
                <Button
                  type="button"
                  className="btn-primary"
                  onClick={() => { void handleUpload(); }}
                  disabled={
                    rows.length === 0 ||
                    parseErrors.length > 0 ||
                    uploading ||
                    preflighting ||
                    (requiresSeasonSelection && !selectedSeasonName.trim())
                  }
                  unstyled
                >
                  {!uploading && <i className="pi pi-upload" aria-hidden="true" />}
                  {uploading ? "Uploading..." : "Upload Inventory"}
                </Button>
              </div>
            </div>
          </div>

          {/* Card 2: Recent Upload Batches */}
          <div className="portal-content-card">
            <div className="pt-upload-section-header-pad">
              <div className="pt-text-card-title">Recent Upload Batches</div>
              <div className="pt-text-card-sub">Use undo to reverse a prior applied upload batch.</div>
            </div>
            <div className="table-responsive">
              <table className="table table-hover table-sm mb-0">
                <thead>
                  <tr>
                    <th><span className="pt-text-col-header">Created</span></th>
                    <th><span className="pt-text-col-header">Status</span></th>
                    <th><span className="pt-text-col-header">Mode</span></th>
                    <th><span className="pt-text-col-header">Rows</span></th>
                    <th><span className="pt-text-col-header">Processed</span></th>
                    <th><span className="pt-text-col-header">Hash</span></th>
                    <th><span className="pt-text-col-header">Message</span></th>
                    <th className="text-end"><span className="pt-text-col-header">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {uploadBatches.length === 0 && !loadingUploadBatches && (
                    <tr>
                      <td colSpan={8}>
                        <span className="pt-text-meta">No upload batches available.</span>
                      </td>
                    </tr>
                  )}
                  {uploadBatches.map((batch) => {
                    const canUndo =
                      batch.status.toLowerCase() === "applied" && !batch.isUndone;
                    return (
                      <tr key={batch.uploadBatchId}>
                        <td><span className="pt-text-body">{formatBatchTimestamp(batch.createdAt)}</span></td>
                        <td>
                          <span className={`badge bg-${getStatusVariant(batch.status)}`}>
                            {batch.status}
                          </span>
                        </td>
                        <td><span className="pt-text-body">{batch.mode}</span></td>
                        <td><span className="pt-text-body">{batch.rowCount}</span></td>
                        <td><span className="pt-text-body">{batch.processedRows}</span></td>
                        <td><span className="pt-text-code">{batch.datasetHash?.slice(0, 12) || "-"}</span></td>
                        <td><span className="pt-text-body">{batch.message || "-"}</span></td>
                        <td className="text-end">
                          <Button
                            type="button"
                            className="btn-danger btn-outlined btn-sm"
                            disabled={!canUndo || undoingBatchId === batch.uploadBatchId}
                            onClick={() => { void handleUndoBatch(batch.uploadBatchId); }}
                            unstyled
                          >
                            <i className="pi pi-undo" aria-hidden="true" />
                            {undoingBatchId === batch.uploadBatchId ? "Undoing..." : "Undo"}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right column: hint cards */}
        <div>

          {/* Hint card: File format */}
          <div className="pt-hint-card">
            <div className="pt-hint-card__header">
              <i className="pi pi-file" aria-hidden="true" />
              File format
            </div>
            <div className="pt-hint-row">
              <div className="pt-hint-icon"><i className="pi pi-check" /></div>
              <div>
                <div className="pt-text-body-strong">Required columns</div>
                <div className="pt-mt-2">
                  <span className="pt-col-badge pt-col-badge--required">Style</span>
                  <span className="pt-col-badge pt-col-badge--required">Color</span>
                  <span className="pt-col-badge pt-col-badge--required">size columns</span>
                </div>
              </div>
            </div>
            <div className="pt-hint-row">
              <div className="pt-hint-icon"><i className="pi pi-info-circle" /></div>
              <div>
                <div className="pt-text-body-strong">Optional columns</div>
                <div className="pt-mt-2">
                  <span className="pt-col-badge">Season</span>
                </div>
                <div className="pt-text-meta pt-mt-1">
                  If Season is omitted, you will be prompted to select one.
                </div>
              </div>
            </div>
            <div className="pt-hint-row">
              <div className="pt-hint-icon"><i className="pi pi-list" /></div>
              <div>
                <div className="pt-text-body-strong">Column aliases accepted</div>
                <div className="pt-text-meta pt-mt-1">
                  Color or Colour. Style or Item Number. Size columns are matched automatically.
                </div>
              </div>
            </div>
          </div>

          {/* Hint card: Download template */}
          <div className="pt-hint-card">
            <div className="pt-hint-card__header">
              <i className="pi pi-file-excel" aria-hidden="true" />
              Download template
            </div>
            <div className="pt-hint-row">
              <div className="pt-hint-icon"><i className="pi pi-file-excel" /></div>
              <div className="pt-flex-grow">
                <div className="pt-text-body pt-mb-2">
                  The template includes all size columns configured for this system.
                </div>
                <div>
                  <Button
                    type="button"
                    className="btn-neutral btn-outlined btn-sm"
                    onClick={handleDownloadTemplate}
                    disabled={loadingSizes}
                    unstyled
                  >
                    <i className="pi pi-download" aria-hidden="true" />
                    {loadingSizes ? "Loading sizes..." : "Download Template"}
                  </Button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </PageShell>
  );
}
