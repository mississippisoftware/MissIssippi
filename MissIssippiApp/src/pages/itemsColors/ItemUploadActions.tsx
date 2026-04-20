import { type ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "primereact/button";
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
  hideInlineTriggers?: boolean;
  onRegisterActions?: (actions: {
    openItemUpload: () => void;
    openColorUpload: () => void;
  }) => void;
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
  hideInlineTriggers = false,
  onRegisterActions,
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

  const openItemUpload = useCallback(() => setShowItemUploadModal(true), []);
  const openColorUpload = useCallback(() => setShowColorUploadModal(true), []);

  const uploadErrors = useMemo(() => uploadSummary?.errors ?? [], [uploadSummary?.errors]);
  const hasUploadErrors = uploadErrors.length > 0;
  const colorUploadErrors = useMemo(
    () => colorUploadSummary?.errors ?? [],
    [colorUploadSummary?.errors]
  );
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

  useEffect(() => {
    onRegisterActions?.({
      openItemUpload,
      openColorUpload,
    });
  }, [onRegisterActions, openColorUpload, openItemUpload]);

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
      {!hideInlineTriggers ? (
        <div className="items-upload-actions">
          <Button type="button" className="btn-success" onClick={openItemUpload} unstyled>
            <i className="pi pi-upload" aria-hidden="true" />
            Upload new items
          </Button>
          <Button type="button" className="btn-success" onClick={openColorUpload} unstyled>
            <i className="pi pi-upload" aria-hidden="true" />
            Upload item colors
          </Button>
        </div>
      ) : null}

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
            <h3 className="pt-text-body-strong">Upload new items</h3>
            <p className="pt-text-desc">Add new items and colors to the list.</p>
          </>
        }
        downloadAction={
          <Button type="button" className="btn-info btn-outlined" onClick={handleDownloadTemplate} unstyled>
            <i className="pi pi-download" aria-hidden="true" />
            Download Template
          </Button>
        }
      >
        <div className="pt-flex-column mt-1">
          {requiresSeasonSelection && (
            <div>
              <label className="pt-text-label">Default Season for this file</label>
              <select
                className="pt-form-select"
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
              </select>
              <div className="text-muted">
                This file has no Season column. One default season is required.
              </div>
            </div>
          )}
          <div>
            <label className="pt-text-label">Upload file</label>
            <input
              type="file"
              className="pt-form-input"
              accept=".xlsx,.xls"
              onChange={handleUploadFile}
              disabled={loadingLookups}
            />
          </div>
        </div>

        {fileName && <div className="pt-form-hint">Selected file: {fileName}</div>}

        {!dismissItemParseErrors && parseErrors.length > 0 && (
          <div className="alert alert-danger mt-3" role="alert">
            <strong>Fix these issues before uploading:</strong>
            <ul className="pt-list-compact">
              {parseErrors.slice(0, 6).map((error) => (
                <li key={error}>{renderItemUploadIssue(error)}</li>
              ))}
            </ul>
            {parseErrors.length > 6 && (
              <div className="mt-2 text-muted">{parseErrors.length - 6} more issue(s) not shown.</div>
            )}
            <div className="pt-block-action-end">
              <Button type="button" className="btn-neutral btn-outlined" onClick={() => setDismissItemParseErrors(true)} unstyled>
                <i className="pi pi-check" aria-hidden="true" />
                OK
              </Button>
            </div>
          </div>
        )}

        {uploadSummary && !hasUploadErrors && (
          <div className="alert alert-success mt-3" role="alert">
            Upload successful. Processed {uploadSummary.processedItems} style(s). Created{" "}
            {uploadSummary.createdItems} new style(s), {uploadSummary.createdColors} new color(s), and{" "}
            {uploadSummary.createdItemColors} new style-color link(s); updated{" "}
            {uploadSummary.updatedItemColors} existing style-color link(s); skipped{" "}
            {uploadSummary.skippedItemColors} unchanged style-color link(s).
          </div>
        )}

        {uploadSummary && hasUploadErrors && !dismissItemUploadErrors && (
          <div className="alert alert-danger mt-3" role="alert">
            <strong>Upload completed with issues:</strong>
            <ul className="pt-list-compact">
              {uploadErrors.slice(0, 6).map((error) => (
                <li key={error}>{renderItemUploadIssue(error)}</li>
              ))}
            </ul>
            {uploadErrors.length > 6 && (
              <div className="mt-2 text-muted">
                {uploadErrors.length - 6} more issue(s) not shown.
              </div>
            )}
            <div className="pt-block-action-end">
              <Button type="button" className="btn-neutral btn-outlined" onClick={() => setDismissItemUploadErrors(true)} unstyled>
                <i className="pi pi-check" aria-hidden="true" />
                OK
              </Button>
            </div>
          </div>
        )}

        {uploadRows.length > 0 && (
          <div className="pt-form-hint">Rows ready to upload: {uploadRows.length}</div>
        )}

        <div className="pt-block-action-end">
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
            unstyled
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
            <h6 className="pt-text-body-strong">Upload item colors</h6>
            <p className="pt-text-desc">Add or update colors for existing styles only.</p>
          </>
        }
        downloadAction={
          <Button type="button" className="btn-info btn-outlined" onClick={handleDownloadItemColors} unstyled>
            <i className="pi pi-download" aria-hidden="true" />
            Download Item Colors
          </Button>
        }
      >
        <div className="pt-flex-column mt-1">
          <div>
            <label className="pt-text-label">Default Season (optional)</label>
            <select
              className="pt-form-select"
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
            </select>
          </div>
        </div>
        <div className="pt-text-desc">
          Upload will replace each style's active colors with the colors listed in the file.
        </div>
        <div className="pt-form-row-action mt-2">
          <div>
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
                unstyled
              >
                <i className="pi pi-plus" aria-hidden="true" />
                Add Collection
              </Button>
            ) : (
              <>
                <label className="pt-text-label">Add collection (without leaving upload)</label>
                <input
                  type="text"
                  className="pt-form-input"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  placeholder="Enter collection name"
                  disabled={addingCollection || colorUploading}
                />
              </>
            )}
          </div>
          {showInlineCollectionAdd && (
            <div className="pt-action-row pt-form-row-action__end">
              <Button
                type="button"
                className="btn-success"
                onClick={handleSaveInlineCollection}
                disabled={addingCollection || colorUploading || !newCollectionName.trim()}
                unstyled
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
                unstyled
              >
                <i className="pi pi-times" aria-hidden="true" />
                Cancel
              </Button>
            </div>
          )}
        </div>
        {collectionAddError && !dismissInlineCollectionError && (
          <div className="alert alert-danger mt-2" role="alert">
            {collectionAddError}
            <div className="pt-block-action-end">
              <Button type="button" className="btn-neutral btn-outlined" onClick={() => setDismissInlineCollectionError(true)} unstyled>
                <i className="pi pi-check" aria-hidden="true" />
                OK
              </Button>
            </div>
          </div>
        )}
        {collectionAddSuccess && (
          <div className="alert alert-success mt-2" role="alert">
            {collectionAddSuccess}
          </div>
        )}
        <div className="pt-form-group mt-3">
          <label className="pt-text-label">Upload file</label>
          <input
            type="file"
            className="pt-form-input"
            accept=".xlsx,.xls"
            onChange={handleColorUploadFile}
            disabled={loadingLookups}
          />
        </div>

        {colorFileName && <div className="pt-form-hint">Selected file: {colorFileName}</div>}

        {colorParseErrors.length > 0 && !dismissColorParseErrors && (
          <div className="alert alert-danger mt-3" role="alert">
            <strong>Fix these issues before uploading:</strong>
            <ul className="pt-list-compact">
              {colorParseErrors.slice(0, 6).map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
            {colorParseErrors.length > 6 && (
              <div className="mt-2 text-muted">
                {colorParseErrors.length - 6} more issue(s) not shown.
              </div>
            )}
            <div className="pt-block-action-end">
              <Button type="button" className="btn-neutral btn-outlined" onClick={() => setDismissColorParseErrors(true)} unstyled>
                <i className="pi pi-check" aria-hidden="true" />
                OK
              </Button>
            </div>
          </div>
        )}

        {colorUploadSummary && !hasColorUploadErrors && (
          <div className="alert alert-success mt-3" role="alert">
            Upload successful. Processed {colorUploadSummary.processedItems} style(s). Added{" "}
            {colorUploadSummary.createdItemColors} new style-color link(s), updated{" "}
            {colorUploadSummary.updatedItemColors} existing style-color link(s), skipped{" "}
            {colorUploadSummary.skippedItemColors} unchanged style-color link(s), and created{" "}
            {colorUploadSummary.createdColors} new color(s).
          </div>
        )}

        {colorUploadSummary && hasColorUploadErrors && !dismissColorUploadErrors && (
          <div className="alert alert-danger mt-3" role="alert">
            <strong>Upload completed with issues:</strong>
            <ul className="pt-list-compact">
              {colorUploadErrors.slice(0, 6).map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
            {colorUploadErrors.length > 6 && (
              <div className="mt-2 text-muted">
                {colorUploadErrors.length - 6} more issue(s) not shown.
              </div>
            )}
            <div className="pt-block-action-end">
              <Button type="button" className="btn-neutral btn-outlined" onClick={() => setDismissColorUploadErrors(true)} unstyled>
                <i className="pi pi-check" aria-hidden="true" />
                OK
              </Button>
            </div>
          </div>
        )}

        {colorUploadRows.length > 0 && (
          <div className="pt-form-hint">Rows ready to upload: {colorUploadRows.length}</div>
        )}

        <div className="pt-block-action-end">
          <Button
            type="button"
            className="btn-success"
            onClick={handlePrepareColorUpload}
            disabled={colorUploadRows.length === 0 || colorParseErrors.length > 0 || colorUploading}
            unstyled
          >
            <i className="pi pi-upload" aria-hidden="true" />
            {colorUploading ? "Uploading..." : "Upload item colors"}
          </Button>
        </div>
      </UploadModal>
    </>
  );
}
