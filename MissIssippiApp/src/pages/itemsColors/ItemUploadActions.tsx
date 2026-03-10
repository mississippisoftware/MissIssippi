import { type ChangeEvent, useEffect, useMemo, useState } from "react";
import { Alert, Button, Col, Form, Row } from "react-bootstrap";
import UploadModal from "../../components/UploadModal";
import type {
  ColorUploadSummary,
  SeasonOption,
  UploadColorRow,
  UploadItemRow,
  UploadSummary,
} from "../../items/itemsColorsTypes";

type ItemUploadActionsProps = {
  seasons: SeasonOption[];
  loadingLookups: boolean;
  fileName: string;
  uploadRows: UploadItemRow[];
  parseErrors: string[];
  requiresSeasonSelection: boolean;
  uploadSummary: UploadSummary | null;
  uploading: boolean;
  defaultSeasonId: string;
  setDefaultSeasonId: (value: string) => void;
  handleDownloadTemplate: () => void;
  handleUploadFile: (event: ChangeEvent<HTMLInputElement>) => void;
  handlePrepareUpload: () => void;
  colorDefaultSeasonId: string;
  setColorDefaultSeasonId: (value: string) => void;
  handleDownloadItemColors: () => void;
  colorFileName: string;
  colorUploadRows: UploadColorRow[];
  colorParseErrors: string[];
  colorUploadSummary: ColorUploadSummary | null;
  colorUploading: boolean;
  handleColorUploadFile: (event: ChangeEvent<HTMLInputElement>) => void;
  handlePrepareColorUpload: () => void;
  onAddCollection: (collectionName: string) => Promise<string | void>;
};

export default function ItemUploadActions({
  seasons,
  loadingLookups,
  fileName,
  uploadRows,
  parseErrors,
  requiresSeasonSelection,
  uploadSummary,
  uploading,
  defaultSeasonId,
  setDefaultSeasonId,
  handleDownloadTemplate,
  handleUploadFile,
  handlePrepareUpload,
  colorDefaultSeasonId,
  setColorDefaultSeasonId,
  handleDownloadItemColors,
  colorFileName,
  colorUploadRows,
  colorParseErrors,
  colorUploadSummary,
  colorUploading,
  handleColorUploadFile,
  handlePrepareColorUpload,
  onAddCollection,
}: ItemUploadActionsProps) {
  const [showItemUploadModal, setShowItemUploadModal] = useState(false);
  const [showColorUploadModal, setShowColorUploadModal] = useState(false);
  const [showInlineCollectionAdd, setShowInlineCollectionAdd] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [addingCollection, setAddingCollection] = useState(false);
  const [collectionAddError, setCollectionAddError] = useState<string | null>(null);
  const [collectionAddSuccess, setCollectionAddSuccess] = useState<string | null>(null);
  const [dismissItemParseErrors, setDismissItemParseErrors] = useState(false);
  const [dismissItemUploadErrors, setDismissItemUploadErrors] = useState(false);
  const [dismissColorParseErrors, setDismissColorParseErrors] = useState(false);
  const [dismissColorUploadErrors, setDismissColorUploadErrors] = useState(false);
  const [dismissInlineCollectionError, setDismissInlineCollectionError] = useState(false);

  const uploadErrors = uploadSummary?.errors ?? [];
  const hasUploadErrors = uploadErrors.length > 0;
  const colorUploadErrors = colorUploadSummary?.errors ?? [];
  const hasColorUploadErrors = colorUploadErrors.length > 0;
  const itemUploadBlockedBySeasonSelection = requiresSeasonSelection && !defaultSeasonId.trim();
  const itemRowNumberToStyleMap = useMemo(() => {
    const map = new Map<number, string>();
    uploadRows.forEach((row) => {
      const rowNumber = Number(row.rowNumber);
      const itemNumber = String(row.itemNumber ?? "").trim();
      if (!Number.isFinite(rowNumber) || rowNumber <= 0 || !itemNumber || map.has(rowNumber)) {
        return;
      }
      map.set(rowNumber, itemNumber);
    });
    return map;
  }, [uploadRows]);

  const renderItemUploadIssue = (error: string) => {
    const match = error.match(/^Row\s+(\d+):\s*(.*)$/i);
    if (!match) return error;
    const rowNumber = Number(match[1]);
    const message = match[2] ?? "";
    const styleNumber = itemRowNumberToStyleMap.get(rowNumber);
    if (!styleNumber) return error;
    return `Row ${rowNumber} | Style ${styleNumber}: ${message}`;
  };

  useEffect(() => {
    setDismissItemParseErrors(false);
  }, [parseErrors]);

  useEffect(() => {
    setDismissItemUploadErrors(false);
  }, [uploadErrors]);

  useEffect(() => {
    setDismissColorParseErrors(false);
  }, [colorParseErrors]);

  useEffect(() => {
    setDismissColorUploadErrors(false);
  }, [colorUploadErrors]);

  useEffect(() => {
    setDismissInlineCollectionError(false);
  }, [collectionAddError]);

  const handleSaveInlineCollection = async () => {
    setCollectionAddError(null);
    setCollectionAddSuccess(null);
    setAddingCollection(true);
    try {
      const savedName = await onAddCollection(newCollectionName);
      setCollectionAddSuccess(
        savedName && String(savedName).trim()
          ? `Collection '${String(savedName).trim()}' added.`
          : "Collection added."
      );
      setNewCollectionName("");
      setShowInlineCollectionAdd(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unable to add collection.";
      setCollectionAddError(message);
    } finally {
      setAddingCollection(false);
    }
  };

  return (
    <>
      <div className="items-upload-actions">
        <Button type="button" className="btn-success" onClick={() => setShowItemUploadModal(true)}>
          <i className="pi pi-upload" aria-hidden="true" />
          Upload new items
        </Button>
        <Button type="button" className="btn-success" onClick={() => setShowColorUploadModal(true)}>
          <i className="pi pi-upload" aria-hidden="true" />
          Upload item colors
        </Button>
      </div>

      <UploadModal
        show={showItemUploadModal}
        title="Upload New Items"
        onClose={() => setShowItemUploadModal(false)}
        closeDisabled={uploading}
        onEnterKey={handlePrepareUpload}
        enterDisabled={
          uploadRows.length === 0 ||
          parseErrors.length > 0 ||
          uploading ||
          itemUploadBlockedBySeasonSelection
        }
        headerContent={
          <>
            <h3 className="mb-1">Upload new items</h3>
            <p className="text-muted mb-0">Add new items and colors to the list.</p>
          </>
        }
        downloadAction={
          <Button type="button" className="btn-info btn-outlined" onClick={handleDownloadTemplate}>
            <i className="pi pi-download" aria-hidden="true" />
            Download Template
          </Button>
        }
      >
        <Row className="gy-3 mt-1">
          {requiresSeasonSelection && (
            <Col md={12}>
              <Form.Label>Default Season for this file</Form.Label>
              <Form.Select
                value={defaultSeasonId}
                onChange={(e) => setDefaultSeasonId(e.target.value)}
                disabled={loadingLookups || uploading}
              >
                <option value="">Choose season</option>
                {seasons.map((season) => (
                  <option key={season.seasonId} value={season.seasonId}>
                    {season.seasonName}
                  </option>
                ))}
              </Form.Select>
              <Form.Text className="text-muted">
                This file has no Season column. One default season is required.
              </Form.Text>
            </Col>
          )}
          <Col md={12}>
            <Form.Label>Upload file</Form.Label>
            <Form.Control
              type="file"
              accept=".xlsx,.xls"
              onChange={handleUploadFile}
              disabled={loadingLookups}
            />
          </Col>
        </Row>

        {fileName && <div className="text-muted mt-2">Selected file: {fileName}</div>}

        {!dismissItemParseErrors && parseErrors.length > 0 && (
          <Alert variant="danger" className="mt-3">
            <strong>Fix these issues before uploading:</strong>
            <ul className="mb-0">
              {parseErrors.slice(0, 6).map((error) => (
                <li key={error}>{renderItemUploadIssue(error)}</li>
              ))}
            </ul>
            {parseErrors.length > 6 && (
              <div className="mt-2 text-muted">{parseErrors.length - 6} more issue(s) not shown.</div>
            )}
            <div className="text-end mt-2">
              <Button type="button" className="btn-neutral btn-outlined" onClick={() => setDismissItemParseErrors(true)}>
                <i className="pi pi-check" aria-hidden="true" />
                OK
              </Button>
            </div>
          </Alert>
        )}

        {uploadSummary && !hasUploadErrors && (
          <Alert variant="success" className="mt-3">
            Upload successful. Processed {uploadSummary.processedItems} style(s). Created{" "}
            {uploadSummary.createdItems} new style(s), {uploadSummary.createdColors} new color(s), and{" "}
            {uploadSummary.createdItemColors} new style-color link(s); updated{" "}
            {uploadSummary.updatedItemColors} existing style-color link(s); skipped{" "}
            {uploadSummary.skippedItemColors} unchanged style-color link(s).
          </Alert>
        )}

        {uploadSummary && hasUploadErrors && !dismissItemUploadErrors && (
          <Alert variant="danger" className="mt-3">
            <strong>Upload completed with issues:</strong>
            <ul className="mb-0">
              {uploadErrors.slice(0, 6).map((error) => (
                <li key={error}>{renderItemUploadIssue(error)}</li>
              ))}
            </ul>
            {uploadErrors.length > 6 && (
              <div className="mt-2 text-muted">
                {uploadErrors.length - 6} more issue(s) not shown.
              </div>
            )}
            <div className="text-end mt-2">
              <Button type="button" className="btn-neutral btn-outlined" onClick={() => setDismissItemUploadErrors(true)}>
                <i className="pi pi-check" aria-hidden="true" />
                OK
              </Button>
            </div>
          </Alert>
        )}

        {uploadRows.length > 0 && (
          <div className="text-muted mt-2">Rows ready to upload: {uploadRows.length}</div>
        )}

        <div className="text-end mt-3">
          <Button
            type="button"
            className="btn-success"
            onClick={handlePrepareUpload}
            disabled={
              uploadRows.length === 0 ||
              parseErrors.length > 0 ||
              uploading ||
              itemUploadBlockedBySeasonSelection
            }
          >
            <i className="pi pi-upload" aria-hidden="true" />
            {uploading ? "Uploading..." : "Upload new items"}
          </Button>
        </div>
      </UploadModal>

      <UploadModal
        show={showColorUploadModal}
        title="Upload Item Colors"
        onClose={() => setShowColorUploadModal(false)}
        closeDisabled={colorUploading}
        onEnterKey={handlePrepareColorUpload}
        enterDisabled={colorUploadRows.length === 0 || colorParseErrors.length > 0 || colorUploading}
        headerContent={
          <>
            <h6 className="mb-1">Upload item colors</h6>
            <p className="text-muted mb-0">Add or update colors for existing styles only.</p>
          </>
        }
        downloadAction={
          <Button type="button" className="btn-info btn-outlined" onClick={handleDownloadItemColors}>
            <i className="pi pi-download" aria-hidden="true" />
            Download Item Colors
          </Button>
        }
      >
        <Row className="gy-3 mt-1">
          <Col md={12}>
            <Form.Label>Default Season (optional)</Form.Label>
            <Form.Select
              value={colorDefaultSeasonId}
              onChange={(e) => setColorDefaultSeasonId(e.target.value)}
              disabled={loadingLookups}
            >
              <option value="">Choose season</option>
              {seasons.map((season) => (
                <option key={season.seasonId} value={season.seasonId}>
                  {season.seasonName}
                </option>
              ))}
            </Form.Select>
          </Col>
        </Row>
        <Row className="gy-2 mt-2">
          <Col md={12}>
            <div className="text-muted">
              Upload will replace each style's active colors with the colors listed in the file.
            </div>
          </Col>
        </Row>
        <Row className="gy-2 mt-2 align-items-end">
          <Col md={showInlineCollectionAdd ? 8 : 12}>
            {!showInlineCollectionAdd ? (
              <Button
                type="button"
                className="btn-neutral btn-outlined"
                onClick={() => {
                  setShowInlineCollectionAdd(true);
                  setCollectionAddError(null);
                  setCollectionAddSuccess(null);
                  setDismissInlineCollectionError(false);
                }}
                disabled={colorUploading || addingCollection}
              >
                <i className="pi pi-plus" aria-hidden="true" />
                Add Collection
              </Button>
            ) : (
              <>
                <Form.Label>Add collection (without leaving upload)</Form.Label>
                <Form.Control
                  type="text"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  placeholder="Enter collection name"
                  disabled={addingCollection || colorUploading}
                />
              </>
            )}
          </Col>
          {showInlineCollectionAdd && (
            <Col md={4} className="d-flex gap-2">
              <Button
                type="button"
                className="btn-success"
                onClick={handleSaveInlineCollection}
                disabled={addingCollection || colorUploading || !newCollectionName.trim()}
              >
                <i className="pi pi-save" aria-hidden="true" />
                {addingCollection ? "Saving..." : "Save"}
              </Button>
              <Button
                type="button"
                className="btn-neutral btn-outlined"
                onClick={() => {
                  setShowInlineCollectionAdd(false);
                  setNewCollectionName("");
                  setCollectionAddError(null);
                }}
                disabled={addingCollection}
              >
                <i className="pi pi-times" aria-hidden="true" />
                Cancel
              </Button>
            </Col>
          )}
        </Row>
        {collectionAddError && !dismissInlineCollectionError && (
          <Alert variant="danger" className="mt-2">
            {collectionAddError}
            <div className="text-end mt-2">
              <Button type="button" className="btn-neutral btn-outlined" onClick={() => setDismissInlineCollectionError(true)}>
                <i className="pi pi-check" aria-hidden="true" />
                OK
              </Button>
            </div>
          </Alert>
        )}
        {collectionAddSuccess && (
          <Alert variant="success" className="mt-2">
            {collectionAddSuccess}
          </Alert>
        )}
        <Row className="gy-3 mt-3">
          <Col md={12}>
            <Form.Label>Upload file</Form.Label>
            <Form.Control
              type="file"
              accept=".xlsx,.xls"
              onChange={handleColorUploadFile}
              disabled={loadingLookups}
            />
          </Col>
        </Row>

        {colorFileName && <div className="text-muted mt-2">Selected file: {colorFileName}</div>}

        {colorParseErrors.length > 0 && !dismissColorParseErrors && (
          <Alert variant="danger" className="mt-3">
            <strong>Fix these issues before uploading:</strong>
            <ul className="mb-0">
              {colorParseErrors.slice(0, 6).map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
            {colorParseErrors.length > 6 && (
              <div className="mt-2 text-muted">
                {colorParseErrors.length - 6} more issue(s) not shown.
              </div>
            )}
            <div className="text-end mt-2">
              <Button type="button" className="btn-neutral btn-outlined" onClick={() => setDismissColorParseErrors(true)}>
                <i className="pi pi-check" aria-hidden="true" />
                OK
              </Button>
            </div>
          </Alert>
        )}

        {colorUploadSummary && !hasColorUploadErrors && (
          <Alert variant="success" className="mt-3">
            Upload successful. Processed {colorUploadSummary.processedItems} style(s). Added{" "}
            {colorUploadSummary.createdItemColors} new style-color link(s), updated{" "}
            {colorUploadSummary.updatedItemColors} existing style-color link(s), skipped{" "}
            {colorUploadSummary.skippedItemColors} unchanged style-color link(s), and created{" "}
            {colorUploadSummary.createdColors} new color(s).
          </Alert>
        )}

        {colorUploadSummary && hasColorUploadErrors && !dismissColorUploadErrors && (
          <Alert variant="danger" className="mt-3">
            <strong>Upload completed with issues:</strong>
            <ul className="mb-0">
              {colorUploadErrors.slice(0, 6).map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
            {colorUploadErrors.length > 6 && (
              <div className="mt-2 text-muted">
                {colorUploadErrors.length - 6} more issue(s) not shown.
              </div>
            )}
            <div className="text-end mt-2">
              <Button type="button" className="btn-neutral btn-outlined" onClick={() => setDismissColorUploadErrors(true)}>
                <i className="pi pi-check" aria-hidden="true" />
                OK
              </Button>
            </div>
          </Alert>
        )}

        {colorUploadRows.length > 0 && (
          <div className="text-muted mt-2">Rows ready to upload: {colorUploadRows.length}</div>
        )}

        <div className="text-end mt-3">
          <Button
            type="button"
            className="btn-success"
            onClick={handlePrepareColorUpload}
            disabled={colorUploadRows.length === 0 || colorParseErrors.length > 0 || colorUploading}
          >
            <i className="pi pi-upload" aria-hidden="true" />
            {colorUploading ? "Uploading..." : "Upload item colors"}
          </Button>
        </div>
      </UploadModal>
    </>
  );
}
