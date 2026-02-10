import { type ChangeEvent, useEffect, useMemo, useState } from "react";
import { Alert, Button, Card, Col, Form, Row, Spinner } from "react-bootstrap";
import * as XLSX from "xlsx";
import CatalogPageLayout from "../components/CatalogPageLayout";
import InventoryService from "../service/InventoryService";
import {
  type InventoryUploadError,
  type InventoryUploadResult,
  type InventoryUploadRow,
  type InventoryUploadMode,
  InventoryUploadService,
} from "../service/InventoryUploadService";
import type { iSize } from "../utils/DataInterfaces";

const REQUIRED_HEADERS = {
  season: ["season", "season name", "seasonname"],
  style: ["style", "style number", "stylenumber", "style #", "style no"],
  color: ["color", "color name", "colorname"],
};

const normalizeHeader = (value: unknown) => String(value ?? "").trim().toLowerCase();

export default function InventoryUpload() {
  const [sizes, setSizes] = useState<iSize[]>([]);
  const [loadingSizes, setLoadingSizes] = useState(true);
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<InventoryUploadRow[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [uploadResult, setUploadResult] = useState<InventoryUploadResult | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMode, setUploadMode] = useState<InventoryUploadMode>("replace");

  useEffect(() => {
    let isMounted = true;
    setLoadingSizes(true);
    InventoryService.getSizes()
      .then((data) => {
        if (!isMounted) return;
        const ordered = [...data].sort((a, b) => {
          const sequenceA = a.sizeSequence ?? 0;
          const sequenceB = b.sizeSequence ?? 0;
          if (sequenceA !== sequenceB) return sequenceA - sequenceB;
          return String(a.sizeName ?? "").localeCompare(String(b.sizeName ?? ""));
        });
        const cleanSizes = ordered.map((size) => ({
          ...size,
          sizeName: (size.sizeName ?? "").trim(),
        }));
        setSizes(cleanSizes);
      })
      .catch((err) => {
        if (!isMounted) return;
        setParseErrors([`Failed to load sizes: ${err?.message ?? "Unknown error"}`]);
      })
      .finally(() => {
        if (!isMounted) return;
        setLoadingSizes(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const sizeNames = useMemo(() => sizes.map((size) => size.sizeName), [sizes]);

  const handleDownloadTemplate = () => {
    if (sizes.length === 0) return;

    const headers = ["Season", "Style", "Color", ...sizeNames];
    const worksheet = XLSX.utils.aoa_to_sheet([headers]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory Upload");

    const now = new Date();
    const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
      now.getDate()
    ).padStart(2, "0")}`;
    XLSX.writeFile(workbook, `inventory_upload_template_${timestamp}.xlsx`);
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setFileName("");
      setRows([]);
      setParseErrors([]);
      setUploadResult(null);
      return;
    }

    setFileName(file.name);
    setRows([]);
    setParseErrors([]);
    setUploadResult(null);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        setParseErrors(["No worksheet found in the file."]);
        return;
      }

      const worksheet = workbook.Sheets[sheetName];
      const rawRows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1, defval: "" });

      if (rawRows.length === 0) {
        setParseErrors(["The worksheet is empty."]);
        return;
      }

      const headerRow = rawRows[0] as unknown[];
      const normalizedHeaders = headerRow.map(normalizeHeader);

      const findHeaderIndex = (candidates: string[]) => {
        for (const candidate of candidates) {
          const index = normalizedHeaders.indexOf(normalizeHeader(candidate));
          if (index >= 0) {
            return index;
          }
        }
        return -1;
      };

      const seasonIndex = findHeaderIndex(REQUIRED_HEADERS.season);
      const styleIndex = findHeaderIndex(REQUIRED_HEADERS.style);
      const colorIndex = findHeaderIndex(REQUIRED_HEADERS.color);

      const missingRequired = [
        seasonIndex < 0 ? "Season" : null,
        styleIndex < 0 ? "Style" : null,
        colorIndex < 0 ? "Color" : null,
      ].filter(Boolean);

      if (missingRequired.length > 0) {
        setParseErrors([`Missing required columns: ${missingRequired.join(", ")}.`]);
        return;
      }

      const sizeIndexMap = new Map<string, number>();
      normalizedHeaders.forEach((header, index) => {
        if (!header) return;
        sizeIndexMap.set(header, index);
      });

      const missingSizes = sizeNames.filter(
        (sizeName) => !sizeIndexMap.has(normalizeHeader(sizeName))
      );

      if (missingSizes.length > 0) {
        setParseErrors([`Missing size columns: ${missingSizes.join(", ")}.`]);
        return;
      }

      const parsedRows: InventoryUploadRow[] = [];
      const errors: string[] = [];

      rawRows.slice(1).forEach((row, rowIndex) => {
        const values = row as Array<unknown>;
        const rowNumber = rowIndex + 2;

        const seasonName = String(values[seasonIndex] ?? "").trim();
        const itemNumber = String(values[styleIndex] ?? "").trim();
        const colorName = String(values[colorIndex] ?? "").trim();

        const hasSizeValues = sizeNames.some((sizeName) => {
          const sizeIndex = sizeIndexMap.get(normalizeHeader(sizeName)) ?? -1;
          const cell = values[sizeIndex];
          return cell !== "" && cell !== null && cell !== undefined;
        });

        if (!seasonName && !itemNumber && !colorName && !hasSizeValues) {
          return;
        }

        if (!seasonName) {
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
          const sizeIndex = sizeIndexMap.get(normalizeHeader(sizeName)) ?? -1;
          const rawValue = values[sizeIndex];
          if (rawValue === "" || rawValue === null || rawValue === undefined) {
            sizesPayload[sizeName] = 0;
            return;
          }

          const numericValue = typeof rawValue === "number" ? rawValue : Number(String(rawValue).trim());
          if (Number.isNaN(numericValue)) {
            errors.push(`Row ${rowNumber}: Quantity for size '${sizeName}' is not a number.`);
            sizesPayload[sizeName] = 0;
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

      setRows(parsedRows);
      setParseErrors(errors);
    } catch (err: any) {
      setParseErrors([`Failed to read file: ${err?.message ?? "Unknown error"}`]);
    }
  };

  const uploadErrors: InventoryUploadError[] = uploadResult?.errors ?? [];
  const hasUploadErrors = uploadErrors.length > 0;

  const handleUpload = async () => {
    if (rows.length === 0 || parseErrors.length > 0) {
      return;
    }

    setUploading(true);
    setUploadResult(null);

    try {
      const result = await InventoryUploadService.uploadInventory(rows, uploadMode);
      setUploadResult(result);
    } catch (err: any) {
      setParseErrors([`Upload failed: ${err?.message ?? "Unknown error"}`]);
    } finally {
      setUploading(false);
    }
  };

  return (
    <CatalogPageLayout
      title="Upload Inventory"
      subtitle="Download the template, enter season/style/color with size quantities, then upload to create inventory and SKUs."
    >
      <Card className="portal-content-card inventory-upload-card mb-4">
        <Card.Body>
          <Row className="align-items-center gy-3">
            <Col md={8}>
              <h5 className="mb-1 card-heading-title">Template</h5>
              <p className="text-muted mb-0">
                Seasons, styles, and colors must already exist in the system. Unknown values will be
                rejected.
              </p>
            </Col>
            <Col md={4} className="text-md-end">
              <Button
                type="button"
                className="portal-btn portal-btn-download portal-page-action"
                onClick={handleDownloadTemplate}
                disabled={loadingSizes}
              >
                {loadingSizes ? (
                  "Loading sizes..."
                ) : (
                  <>
                    <i className="pi pi-download portal-page-action-icon" aria-hidden="true" />
                    Download Template
                  </>
                )}
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card className="portal-content-card inventory-upload-card">
        <Card.Body>
          <Row className="gy-2 align-items-center mb-3">
            <Col>
              <h5 className="mb-1 card-heading-title">Update Mode</h5>
              <p className="text-muted mb-2">
                Choose how the upload will adjust quantities in inventory.
              </p>
              <div className="inventory-upload-mode-group">
                <Button
                  type="button"
                  className={`portal-btn inventory-upload-mode-btn inventory-upload-mode-change${
                    uploadMode === "replace" ? " is-active" : ""
                  }`}
                  onClick={() => setUploadMode("replace")}
                >
                  Change
                </Button>
                <Button
                  type="button"
                  className={`portal-btn inventory-upload-mode-btn inventory-upload-mode-add${
                    uploadMode === "add" ? " is-active" : ""
                  }`}
                  onClick={() => setUploadMode("add")}
                >
                  Add
                </Button>
                <Button
                  type="button"
                  className={`portal-btn inventory-upload-mode-btn inventory-upload-mode-subtract${
                    uploadMode === "subtract" ? " is-active" : ""
                  }`}
                  onClick={() => setUploadMode("subtract")}
                >
                  Subtract
                </Button>
              </div>
              <Form.Text className="text-muted">
                Change replaces quantities. Add/Subtract adjust totals and clamp at 0.
              </Form.Text>
            </Col>
          </Row>
          <Row className="gy-3 align-items-center">
            <Col md={8}>
              <Form.Group controlId="inventoryUploadFile">
                <Form.Label>Upload completed template</Form.Label>
                <Form.Control
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  disabled={loadingSizes}
                />
                <Form.Text className="text-muted">
                  Columns expected: Season, Style, Color, then all size columns ({sizeNames.join(", ")}).
                </Form.Text>
              </Form.Group>
              {fileName && (
                <div className="text-muted mt-2">Selected file: {fileName}</div>
              )}
            </Col>
            <Col md={4} className="text-md-end">
              <Button
                type="button"
                className="portal-btn portal-btn-upload portal-page-action"
                onClick={handleUpload}
                disabled={rows.length === 0 || parseErrors.length > 0 || uploading}
              >
                {uploading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" /> Uploading...
                  </>
                ) : (
                  <>
                    <i className="pi pi-upload portal-page-action-icon" aria-hidden="true" />
                    Upload Inventory
                  </>
                )}
              </Button>
            </Col>
          </Row>

          {rows.length > 0 && (
            <div className="text-muted mt-3">Rows ready to upload: {rows.length}</div>
          )}

          {parseErrors.length > 0 && (
            <Alert variant="danger" className="mt-3">
              <strong>Fix these issues before uploading:</strong>
              <ul className="mb-0">
                {parseErrors.slice(0, 8).map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
              {parseErrors.length > 8 && (
                <div className="mt-2 text-muted">
                  {parseErrors.length - 8} more issue(s) not shown.
                </div>
              )}
            </Alert>
          )}

          {uploadResult && !hasUploadErrors && (
            <Alert variant="success" className="mt-3">
              Uploaded {uploadResult.processedRows} row(s). Created {uploadResult.createdSkus} SKU(s), {uploadResult.createdItemColors} style-color
              links, and {uploadResult.createdInventory} inventory record(s). Updated {uploadResult.updatedInventory} inventory record(s).
            </Alert>
          )}

          {uploadResult && hasUploadErrors && (
            <Alert variant="danger" className="mt-3">
              <strong>Upload completed with issues:</strong>
              <ul className="mb-0">
                {uploadErrors.slice(0, 8).map((error) => (
                  <li key={`${error.rowNumber}-${error.message}`}>
                    Row {error.rowNumber}: {error.message}
                  </li>
                ))}
              </ul>
              {uploadErrors.length > 8 && (
                <div className="mt-2 text-muted">
                  {uploadErrors.length - 8} more issue(s) not shown.
                </div>
              )}
            </Alert>
          )}
        </Card.Body>
      </Card>
    </CatalogPageLayout>
  );
}
