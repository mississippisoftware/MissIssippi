import { type ChangeEvent, useMemo, useState } from "react";
import { Alert, Button, Card, Col, Form, Row, Spinner } from "react-bootstrap";
import CatalogPageLayout from "../components/CatalogPageLayout";
import { useInventorySizes } from "../hooks/useInventorySizes";
import { useInventoryUpload } from "../hooks/useInventoryUpload";
import {
  type InventoryUploadError,
  InventoryUploadService,
} from "../service/InventoryUploadService";
import { downloadInventoryUploadTemplate } from "../utils/inventoryUploadTemplate";

export default function InventoryUpload() {
  const [pageError, setPageError] = useState<string | null>(null);

  const { sizeColumns: sizes, sizeLoading: loadingSizes, sizeError } = useInventorySizes();

  const sizeErrorMessage = sizeError ? `Failed to load sizes: ${sizeError}` : null;
  const effectivePageError = pageError ?? sizeErrorMessage;

  const sizeNames = useMemo(() => sizes.map((size) => size.sizeName), [sizes]);
  const {
    fileName,
    rows,
    parseErrors,
    uploadResult,
    uploading,
    uploadMode,
    setUploadMode,
    setFile,
    upload,
  } = useInventoryUpload({
    sizeNames,
    uploadInventory: InventoryUploadService.uploadInventory,
  });

  const handleDownloadTemplate = () => {
    downloadInventoryUploadTemplate(sizes);
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    await setFile(event.target.files?.[0] ?? null);
    setPageError(null);
  };

  const uploadErrors: InventoryUploadError[] = uploadResult?.errors ?? [];
  const hasUploadErrors = uploadErrors.length > 0;

  const handleUpload = async () => {
    if (rows.length === 0 || parseErrors.length > 0) {
      return;
    }

    try {
      await upload();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setPageError(`Upload failed: ${message}`);
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
              <h5 className="mb-1 card-heading-title">Inventory Template</h5>
              <p className="text-muted mb-0">
                Seasons, styles, and colors must already exist in the system. <br /> New styles can be added in Item List page.
              </p>
            </Col>
            <Col md={4} className="text-md-end">
              <Button
                type="button"
                className="btn-info btn-outlined"
                onClick={handleDownloadTemplate}
                disabled={loadingSizes}
              >
                <i className="pi pi-download" aria-hidden="true" />
                {loadingSizes ? "Loading sizes..." : "Download Template"}
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
              <Form.Text className="text-muted">
                Change replaces quantities. Add/Subtract adjust totals.
              </Form.Text>
            </Col>
          </Row>
          {effectivePageError && (
            <Alert variant="danger" className="mt-3">
              {effectivePageError}
            </Alert>
          )}
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
                  Columns expected: Season, Style, Color, Sizes.
                </Form.Text>
              </Form.Group>
              {fileName && (
                <div className="text-muted mt-2">Selected file: {fileName}</div>
              )}
            </Col>
            <Col md={4} className="text-md-end">
              <Button
                type="button"
                className="btn-success"
                onClick={handleUpload}
                disabled={rows.length === 0 || parseErrors.length > 0 || uploading}
              >
                {uploading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    <i className="pi pi-upload" aria-hidden="true" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <i className="pi pi-upload" aria-hidden="true" />
                    Upload Inventory
                  </>
                )}
              </Button>
            </Col>
          </Row>

          {rows.length > 0 && (
            <div className="text-muted mt-3">Rows ready to upload: {rows.length}</div>
          )}

          {sizeError && (
            <Alert variant="danger" className="mt-3">
              <strong>Fix these issues before uploading:</strong>
              <ul className="mb-0">
                <li>Failed to load sizes: {sizeError}</li>
              </ul>
            </Alert>
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
