import { type ChangeEvent, useEffect, useMemo, useState } from "react";
import { Alert, Badge, Button, Card, Col, Form, Row, Spinner, Table } from "react-bootstrap";
import CatalogPageLayout from "../components/CatalogPageLayout";
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

const formatBatchTimestamp = (value: string) =>
  new Date(value).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

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
    useState<MissingSizeBehavior>("zero");
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
    <CatalogPageLayout
      title="Upload Inventory"
      subtitle="Validate uploaded inventory before applying updates, then track and undo upload batches if needed."
    >
      <Card className="portal-content-card inventory-upload-card mb-4">
        <Card.Body>
          <Row className="align-items-center gy-3">
            <Col md={8}>
              <h5 className="mb-1 card-heading-title">Inventory Template</h5>
              <p className="text-muted mb-0">
                Existing system records (season, item, color, sizes) are validated before upload.
              </p>
            </Col>
            <Col md={4} className="text-md-end">
              <div className="d-flex flex-wrap gap-2 justify-content-md-end">
                <Button
                  type="button"
                  className="btn-neutral btn-outlined inventory-upload-top-btn"
                  onClick={handleDownloadTemplate}
                  disabled={loadingSizes || downloadingInventory}
                >
                  <i className="pi pi-file-excel" aria-hidden="true" />
                  {loadingSizes ? "Loading sizes..." : "Download Template"}
                </Button>
                <Button
                  type="button"
                  className="btn-info btn-outlined inventory-upload-top-btn"
                  onClick={handleDownloadInventory}
                  disabled={loadingSizes || downloadingInventory}
                >
                  {downloadingInventory ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <i className="pi pi-download" aria-hidden="true" />
                      Download Inventory
                    </>
                  )}
                </Button>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card className="portal-content-card inventory-upload-card mb-4">
        <Card.Body>
          <Row className="gy-2 align-items-center mb-3">
            <Col>
              <h5 className="mb-1 card-heading-title">Update Mode</h5>
              <p className="text-muted mb-2">
                Choose how validated quantities will be applied to inventory.
              </p>
              <div className="inventory-upload-mode-group">
                <Button
                  type="button"
                  className={`btn-mode btn-neutral ${uploadMode === "replace" ? "" : "btn-outlined"}`}
                  onClick={() => setUploadMode("replace")}
                >
                  <i className="pi pi-pencil" aria-hidden="true" />
                  Change
                </Button>
                <Button
                  type="button"
                  className={`btn-mode btn-success ${uploadMode === "add" ? "" : "btn-outlined"}`}
                  onClick={() => setUploadMode("add")}
                >
                  <i className="pi pi-plus" aria-hidden="true" />
                  Add
                </Button>
                <Button
                  type="button"
                  className={`btn-mode btn-danger ${uploadMode === "subtract" ? "" : "btn-outlined"}`}
                  onClick={() => setUploadMode("subtract")}
                >
                  <i className="pi pi-trash" aria-hidden="true" />
                  Subtract
                </Button>
              </div>
            </Col>
          </Row>

          {effectivePageError && (
            <Alert variant="danger" className="mt-3">
              {effectivePageError}
            </Alert>
          )}

          <Row className="gy-3">
            <Col md={8}>
              <Form.Group controlId="inventoryUploadFile">
                <Form.Label>Upload file</Form.Label>
                <Form.Control
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  disabled={loadingSizes}
                />
                <Form.Text className="text-muted">
                  Columns accepted: Season (optional), Style, Color/Colour, recognized sizes.
                </Form.Text>
              </Form.Group>

              {fileName && <div className="text-muted mt-2">Selected file: {fileName}</div>}
              {rows.length > 0 && (
                <>
                  <div className="text-muted mt-2">Rows ready to upload: {rows.length}</div>
                  {mergedDuplicateRows > 0 && (
                    <div className="text-muted">
                      Merged {mergedDuplicateRows} duplicate style/color row(s) before preflight.
                    </div>
                  )}
                  <div className="text-muted">
                    Idempotency key: <code>{idempotencyKey}</code>
                  </div>
                </>
              )}
            </Col>
            <Col md={4}>
              <Form.Group controlId="inventoryMissingSizeBehavior">
                <Form.Label>Missing size behavior</Form.Label>
                <Form.Select
                  value={missingSizeBehavior}
                  onChange={(event) =>
                    setMissingSizeBehavior(event.target.value as MissingSizeBehavior)
                  }
                >
                  <option value="zero">Set missing sizes to zero</option>
                  <option value="ignore">Leave missing sizes unchanged</option>
                </Form.Select>
              </Form.Group>
              <Form.Group controlId="inventoryAllowPartial" className="mt-2">
                <Form.Check
                  type="checkbox"
                  label="Allow partial upload (apply valid rows only)"
                  checked={allowPartial}
                  onChange={(event) => setAllowPartial(event.target.checked)}
                />
              </Form.Group>
              <Form.Group controlId="inventoryAllowDuplicate" className="mt-2">
                <Form.Check
                  type="checkbox"
                  label="Allow duplicate dataset upload"
                  checked={allowDuplicateDataset}
                  onChange={(event) => setAllowDuplicateDataset(event.target.checked)}
                />
              </Form.Group>
            </Col>
          </Row>

          <Row className="gy-3 mt-1">
            <Col md={8}>
              {requiresSeasonSelection && (
                <Form.Group controlId="inventoryUploadSeason" className="mt-2">
                  <Form.Label>Season for this file</Form.Label>
                  <Form.Select
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
                  </Form.Select>
                  <Form.Text className="text-muted">
                    This file has no Season column. One season is required.
                  </Form.Text>
                </Form.Group>
              )}
              <Form.Group controlId="inventoryUploadNote" className="mt-2">
                <Form.Label>Upload note (optional)</Form.Label>
                <Form.Control
                  type="text"
                  value={userNote}
                  onChange={(event) => setUserNote(event.target.value)}
                  placeholder="Example: annual count import"
                />
              </Form.Group>
            </Col>
            <Col md={4} className="text-md-end align-self-end">
              <div className="d-flex flex-wrap gap-2 justify-content-md-end">
                <Button
                  type="button"
                  className="btn-info btn-outlined"
                  onClick={handleValidate}
                  disabled={
                    rows.length === 0 ||
                    parseErrors.length > 0 ||
                    preflighting ||
                    (requiresSeasonSelection && !selectedSeasonName.trim())
                  }
                >
                  {preflighting ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Validating...
                    </>
                  ) : (
                    <>
                      <i className="pi pi-check-circle" aria-hidden="true" />
                      Validate File
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  className="btn-success"
                  onClick={handleUpload}
                  disabled={
                    rows.length === 0 ||
                    parseErrors.length > 0 ||
                    uploading ||
                    preflighting ||
                    (requiresSeasonSelection && !selectedSeasonName.trim())
                  }
                >
                  {uploading ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <i className="pi pi-upload" aria-hidden="true" />
                      Upload Inventory
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  className="btn-neutral btn-outlined"
                  onClick={handleExportIssues}
                  disabled={
                    (preflightResult?.issues.length ?? 0) === 0 &&
                    uploadErrors.length === 0 &&
                    uploadWarnings.length === 0
                  }
                >
                  <i className="pi pi-download" aria-hidden="true" />
                  Export Issues
                </Button>
              </div>
            </Col>
          </Row>

          {detectedSizeColumns.length > 0 && (
            <Alert variant="light" className="mt-3 mb-0">
              <strong>Detected size columns:</strong> {detectedSizeColumns.join(", ")}
            </Alert>
          )}

          {ignoredHeaderColumns.length > 0 && (
            <Alert variant="warning" className="mt-3">
              <strong>Ignored columns:</strong> {ignoredHeaderColumns.join(", ")}
            </Alert>
          )}

          {parseErrors.length > 0 && (
            <Alert variant="danger" className="mt-3">
              <strong>Fix these parse issues before validating/uploading:</strong>
              <ul className="mb-0">
                {parseErrors.slice(0, 10).map((error) => (
                  <li key={error}>{renderParseErrorText(error)}</li>
                ))}
              </ul>
              {parseErrors.length > 10 && (
                <div className="mt-2 text-muted">{parseErrors.length - 10} more issue(s) not shown.</div>
              )}
            </Alert>
          )}

          {preflightResult && (
            <Alert variant={preflightResult.canUpload ? "success" : "danger"} className="mt-3">
              <div>
                <strong>Preflight summary:</strong> {preflightResult.validRows} valid /{" "}
                {preflightResult.invalidRows} invalid rows.
              </div>
              <div className="text-muted">
                Errors: {preflightResult.errorCount} | Warnings: {preflightResult.warningCount}
                {preflightResult.datasetHash ? ` | Hash: ${preflightResult.datasetHash}` : ""}
              </div>
              {preflightResult.duplicateDatasetDetected && (
                <div className="mt-1">
                  <Badge bg="warning" text="dark">
                    Duplicate dataset detected
                  </Badge>
                </div>
              )}
              {preflightErrors.length > 0 && (
                <ul className="mb-0 mt-2">
                  {preflightErrors.slice(0, 8).map((issue, index) => (
                    <li key={`${issue.rowNumber}-${issue.code}-${index}`}>
                      {getErrorRowLabel(issue.rowNumber)}: {issue.message}
                      {issue.suggestions.length > 0 && (
                        <span className="text-muted"> (suggestions: {issue.suggestions.join(", ")})</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              {preflightWarnings.length > 0 && (
                <ul className="mb-0 mt-2">
                  {preflightWarnings.slice(0, 5).map((issue, index) => (
                    <li key={`${issue.rowNumber}-${issue.code}-w-${index}`}>
                      {getErrorRowLabel(issue.rowNumber)}: {issue.message}
                    </li>
                  ))}
                </ul>
              )}
            </Alert>
          )}

          {uploadResult && !hasUploadErrors && (
            <Alert variant="success" className="mt-3">
              {uploadResult.message || "Upload completed."} Processed {uploadResult.processedRows} row(s). Created{" "}
              {uploadResult.createdSkus} SKU(s), {uploadResult.createdItemColors} style-color links, and{" "}
              {uploadResult.createdInventory} inventory record(s). Updated {uploadResult.updatedInventory} record(s).
            </Alert>
          )}

          {uploadResult && hasUploadErrors && (
            <Alert variant="danger" className="mt-3">
              <strong>Upload completed with issues:</strong>
              <ul className="mb-0">
                {uploadErrors.slice(0, 10).map((error) => (
                  <li key={`${error.rowNumber}-${error.message}`}>
                    {getErrorRowLabel(error.rowNumber)}: {error.message}
                  </li>
                ))}
              </ul>
              {uploadWarnings.length > 0 && (
                <>
                  <hr />
                  <strong>Warnings:</strong>
                  <ul className="mb-0">
                    {uploadWarnings.slice(0, 8).map((warning) => (
                      <li key={`${warning.rowNumber}-${warning.message}`}>
                        {getErrorRowLabel(warning.rowNumber)}: {warning.message}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </Alert>
          )}
        </Card.Body>
      </Card>

      <Card className="portal-content-card inventory-upload-card">
        <Card.Body>
          <Row className="align-items-center gy-2 mb-3">
            <Col>
              <h5 className="mb-1 card-heading-title">Recent Upload Batches</h5>
              <p className="text-muted mb-0">Use undo to reverse a prior applied upload batch.</p>
            </Col>
            <Col className="text-md-end">
              <Button
                type="button"
                className="btn-neutral btn-outlined"
                onClick={loadUploadBatches}
                disabled={loadingUploadBatches}
              >
                <i className="pi pi-refresh" aria-hidden="true" />
                {loadingUploadBatches ? "Refreshing..." : "Refresh"}
              </Button>
            </Col>
          </Row>
          <div className="table-responsive">
            <Table hover size="sm" className="mb-0">
              <thead>
                <tr>
                  <th>Created</th>
                  <th>Status</th>
                  <th>Mode</th>
                  <th>Rows</th>
                  <th>Processed</th>
                  <th>Hash</th>
                  <th>Message</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {uploadBatches.length === 0 && !loadingUploadBatches && (
                  <tr>
                    <td colSpan={8} className="text-muted">
                      No upload batches available.
                    </td>
                  </tr>
                )}
                {uploadBatches.map((batch) => {
                  const canUndo =
                    batch.status.toLowerCase() === "applied" && !batch.isUndone;
                  return (
                    <tr key={batch.uploadBatchId}>
                      <td>{formatBatchTimestamp(batch.createdAt)}</td>
                      <td>
                        <Badge bg={getStatusVariant(batch.status)}>{batch.status}</Badge>
                      </td>
                      <td>{batch.mode}</td>
                      <td>{batch.rowCount}</td>
                      <td>{batch.processedRows}</td>
                      <td>
                        <code>{batch.datasetHash?.slice(0, 12) || "-"}</code>
                      </td>
                      <td>{batch.message || "-"}</td>
                      <td className="text-end">
                        <Button
                          type="button"
                          size="sm"
                          className="btn-danger btn-outlined"
                          disabled={!canUndo || undoingBatchId === batch.uploadBatchId}
                          onClick={() => handleUndoBatch(batch.uploadBatchId)}
                        >
                          {undoingBatchId === batch.uploadBatchId ? "Undoing..." : "Undo"}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>
    </CatalogPageLayout>
  );
}
