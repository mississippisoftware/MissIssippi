import { type ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputSwitch } from 'primereact/inputswitch';
import {
  DataTable,
  type DataTablePageEvent,
  type DataTableRowEditCompleteEvent,
  type DataTableSortEvent,
} from "primereact/datatable";
import { Column } from "primereact/column";
import { Toast } from "primereact/toast";
import CatalogPageLayout from "../components/CatalogPageLayout";
import PageActionsMenu from "../components/PageActionsMenu";
import PageFiltersBar from "../components/PageFiltersBar";
import UploadModal from "../components/UploadModal";
import { useNotifier } from "../hooks/useNotifier";
import InventoryLabels from "../inventory/InventoryLabels";
import { InventoryService, type SeasonRecord } from "../service/InventoryService";
import {
  SkuService,
  type SkuBulkUpdateError,
  type SkuBulkUpdateResponse,
  type SkuListItem,
} from "../service/SkuService";
import { appendSheet, createWorkbook, saveWorkbook, sheetFromJson } from "../utils/xlsxUtils";
import { findHeaderIndex, normalizeHeaders, readFirstSheetRows } from "../utils/xlsxParse";
import { getErrorMessage } from "../utils/errors";

const DEFAULT_PAGE_SIZE = 25;
const PAGE_SIZE_OPTIONS = [25, 50, 100];
const SKU_EXPORT_PAGE_SIZE = 200;

export default function SkuList() {
  const toastRef = useRef<Toast>(null);
  const notify = useNotifier(toastRef);

  const [seasons, setSeasons] = useState<SeasonRecord[]>([]);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [loadingLookups, setLoadingLookups] = useState(true);

  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [seasonFilterId, setSeasonFilterId] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<SkuListItem[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [editingRows, setEditingRows] = useState<Record<string, boolean>>({});
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showLabelsModal, setShowLabelsModal] = useState(false);
  const [uploadFileName, setUploadFileName] = useState("");
  const [uploadRows, setUploadRows] = useState<Array<{ rowNumber: number; skuId: number; sku: string }>>([]);
  const [uploadParseErrors, setUploadParseErrors] = useState<string[]>([]);
  const [uploadSummary, setUploadSummary] = useState<SkuBulkUpdateResponse | null>(null);
  const [uploadingSkus, setUploadingSkus] = useState(false);

  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(DEFAULT_PAGE_SIZE);
  const [sortField, setSortField] = useState("sku");
  const [sortOrder, setSortOrder] = useState<1 | -1>(1);

  useEffect(() => {
    const handle = setTimeout(() => {
      setSearchQuery(searchInput);
      setFirst(0);
    }, 300);
    return () => clearTimeout(handle);
  }, [searchInput]);

  const seasonOptions = useMemo(() => {
    return [...seasons].sort((a, b) => a.seasonName.localeCompare(b.seasonName));
  }, [seasons]);

  const loadSeasons = useCallback(async () => {
    setLoadingLookups(true);
    setLookupError(null);
    try {
      const data = await InventoryService.getSeasons();
      setSeasons(data);
    } catch (err: unknown) {
      console.error(err);
      setLookupError(getErrorMessage(err, "Unable to load seasons."));
    } finally {
      setLoadingLookups(false);
    }
  }, []);

  const loadSkus = useCallback(async () => {
    setLoading(true);
    try {
      const page = Math.floor(first / rows) + 1;
      const response = await SkuService.getSkuList({
        q: searchQuery,
        seasonId: seasonFilterId ? Number(seasonFilterId) : undefined,
        inStock: inStockOnly ? true : undefined,
        page,
        pageSize: rows,
        sortField,
        sortOrder: sortOrder === -1 ? "desc" : "asc",
      });
      setItems(response.items);
      setTotalRecords(response.total);
    } catch (err: unknown) {
      console.error(err);
      notify("error", "Load failed", getErrorMessage(err, "Unable to load SKU list."));
    } finally {
      setLoading(false);
    }
  }, [first, rows, searchQuery, seasonFilterId, inStockOnly, sortField, sortOrder, notify]);

  useEffect(() => {
    loadSeasons();
  }, [loadSeasons]);

  useEffect(() => {
    loadSkus();
  }, [loadSkus]);

  const handleSeasonChange = (value: string) => {
    setSeasonFilterId(value);
    setFirst(0);
  };

  const handleInStockChange = (checked: boolean) => {
    setInStockOnly(checked);
    setFirst(0);
  };

  const handlePage = (event: DataTablePageEvent) => {
    setFirst(event.first);
    setRows(event.rows);
  };

  const handleSort = (event: DataTableSortEvent) => {
    if (typeof event.sortField === "string" && event.sortField) {
      setSortField(event.sortField);
    }
    setSortOrder(event.sortOrder === -1 ? -1 : 1);
    setFirst(0);
  };

  const applySearch = () => {
    setSearchQuery(searchInput);
    setFirst(0);
  };

  const clearFilters = () => {
    setSearchInput("");
    setSearchQuery("");
    setSeasonFilterId("");
    setInStockOnly(false);
    setShowAdvancedFilters(false);
    setFirst(0);
  };

  const handleDownloadSkuList = async () => {
    try {
      const allRows: SkuListItem[] = [];
      let page = 1;
      let total = 0;
      do {
        const response = await SkuService.getSkuList({
          page,
          pageSize: SKU_EXPORT_PAGE_SIZE,
          sortField: "sku",
          sortOrder: "asc",
        });
        allRows.push(...response.items);
        total = response.total;
        page += 1;
      } while (allRows.length < total);

      const worksheet = sheetFromJson(
        allRows.map((row) => ({
          SkuId: row.skuId,
          SKU: row.sku,
          Season: row.seasonName,
          ItemNumber: row.itemNumber,
          Description: row.description,
          Color: row.colorName,
          Size: row.sizeName,
          Qty: row.qty,
        })),
        { header: ["SkuId", "SKU", "Season", "ItemNumber", "Description", "Color", "Size", "Qty"] }
      );
      const workbook = createWorkbook();
      appendSheet(workbook, worksheet, "SKUs");
      saveWorkbook(workbook, "sku_list");
    } catch (err: unknown) {
      console.error(err);
      notify("error", "Download failed", getErrorMessage(err, "Unable to download SKU list."));
    }
  };

  const handleDownloadSkuTemplate = () => {
    const worksheet = sheetFromJson(
      [
        {
          SkuId: 1234,
          SKU: "SS261181WHTXYLW8",
          Season: "SS26",
          ItemNumber: "1181",
          Color: "White+Yellow",
          Size: "8",
        },
      ],
      { header: ["SkuId", "SKU", "Season", "ItemNumber", "Color", "Size"] }
    );
    const workbook = createWorkbook();
    appendSheet(workbook, worksheet, "SKU Corrections");
    saveWorkbook(workbook, "sku_corrections_template");
  };

  const resetUploadModalState = () => {
    setUploadFileName("");
    setUploadRows([]);
    setUploadParseErrors([]);
    setUploadSummary(null);
    setUploadingSkus(false);
  };

  const handleUploadFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      resetUploadModalState();
      return;
    }

    setUploadFileName(file.name);
    setUploadRows([]);
    setUploadParseErrors([]);
    setUploadSummary(null);

    try {
      const buffer = await file.arrayBuffer();
      const { rows: rawRows, errors: sheetErrors } = readFirstSheetRows(buffer);
      if (sheetErrors.length > 0) {
        setUploadParseErrors(sheetErrors);
        return;
      }

      const headerRow = rawRows[0] ?? [];
      const headers = normalizeHeaders(headerRow);
      const skuIdIndex = findHeaderIndex(headers, ["skuid", "sku id", "id"]);
      const skuIndex = findHeaderIndex(headers, ["sku", "sku value", "skuvalue"]);

      const missingRequired = [
        skuIdIndex < 0 ? "SkuId" : null,
        skuIndex < 0 ? "SKU" : null,
      ].filter(Boolean);
      if (missingRequired.length > 0) {
        setUploadParseErrors([`Missing required columns: ${missingRequired.join(", ")}.`]);
        return;
      }

      const parsed: Array<{ rowNumber: number; skuId: number; sku: string }> = [];
      const errors: string[] = [];
      const seenIds = new Map<number, number>();
      const seenSkus = new Map<string, number>();

      rawRows.slice(1).forEach((row, rowIndex) => {
        const values = row as unknown[];
        const rowNumber = rowIndex + 2;
        const rawSkuId = String(values[skuIdIndex] ?? "").trim();
        const rawSku = String(values[skuIndex] ?? "").trim().toUpperCase();

        if (!rawSkuId && !rawSku) return;

        const skuId = Number(rawSkuId);
        if (!Number.isFinite(skuId) || skuId <= 0) {
          errors.push(`Row ${rowNumber}: SkuId is required.`);
        }
        if (!rawSku) {
          errors.push(`Row ${rowNumber}: SKU is required.`);
        }
        if (!Number.isFinite(skuId) || skuId <= 0 || !rawSku) {
          return;
        }

        if (seenIds.has(skuId)) {
          errors.push(`Row ${rowNumber} | SkuId ${skuId}: Duplicate SkuId in file (also row ${seenIds.get(skuId)}).`);
        } else {
          seenIds.set(skuId, rowNumber);
        }

        if (seenSkus.has(rawSku)) {
          errors.push(`Row ${rowNumber} | SkuId ${skuId}: Duplicate target SKU '${rawSku}' in file (also row ${seenSkus.get(rawSku)}).`);
        } else {
          seenSkus.set(rawSku, rowNumber);
        }

        parsed.push({ rowNumber, skuId, sku: rawSku });
      });

      setUploadRows(parsed);
      setUploadParseErrors(errors);
    } catch (err: unknown) {
      console.error(err);
      setUploadParseErrors([getErrorMessage(err, "Unable to read file.")]);
    }
  };

  const formatBulkError = (error: SkuBulkUpdateError) => {
    const parts: string[] = [];
    if (error.rowNumber) parts.push(`Row ${error.rowNumber}`);
    if (error.skuId) parts.push(`SkuId ${error.skuId}`);
    return `${parts.length ? `${parts.join(" | ")}: ` : ""}${error.message}`;
  };

  const handleUploadSkuCorrections = async () => {
    if (uploadRows.length === 0 || uploadParseErrors.length > 0) return;

    setUploadingSkus(true);
    setUploadSummary(null);
    try {
      const result = await SkuService.bulkUpdateSkus(uploadRows);
      setUploadSummary(result);
      if (result.success) {
        notify("success", "SKUs updated", `Updated ${result.updated} SKU(s).`);
        await loadSkus();
      }
    } catch (err: unknown) {
      console.error(err);
      setUploadSummary({
        success: false,
        processed: uploadRows.length,
        updated: 0,
        errors: [{ rowNumber: 0, message: getErrorMessage(err, "Upload failed.") }],
      });
    } finally {
      setUploadingSkus(false);
    }
  };

  const handleRowEditComplete = async (event: DataTableRowEditCompleteEvent) => {
    const original = event.data as SkuListItem;
    const updated = event.newData as SkuListItem;
    const nextSku = (updated.sku ?? "").trim().toUpperCase();
    const currentSku = (original.sku ?? "").trim().toUpperCase();

    if (!nextSku) {
      notify("warn", "SKU required", "Enter a SKU value.");
      await loadSkus();
      return;
    }

    if (nextSku === currentSku) {
      setItems((prev) =>
        prev.map((row) => (row.skuId === updated.skuId ? { ...row, sku: nextSku } : row))
      );
      return;
    }

    try {
      const saved = await SkuService.updateSku(updated.skuId, nextSku);
      setItems((prev) =>
        prev.map((row) => (row.skuId === saved.skuId ? { ...row, sku: saved.sku } : row))
      );
      notify("success", "SKU updated", `${original.itemNumber} ${original.colorName} ${original.sizeName}`);
    } catch (err: unknown) {
      console.error(err);
      notify("error", "Save failed", getErrorMessage(err, "Unable to update SKU."));
      await loadSkus();
    }
  };

  const renderSkuEditor = (options: { value?: unknown; editorCallback?: (value: unknown) => void }) => (
    <input
      value={typeof options.value === "string" ? options.value : ""}
      onChange={(e) => options.editorCallback?.(e.target.value)}
      autoFocus
    />
  );

  const renderInProduction = (row: SkuListItem) => (
    <input type="checkbox" className="item-production-check" checked={row.inProduction} readOnly disabled onChange={() => {}} />
  );

  const headerActions = [
    {
      key: "download",
      label: "Download SKU List",
      onClick: handleDownloadSkuList,
      icon: "pi pi-download",
      disabled: loading,
    },
    {
      key: "upload-corrections",
      label: "Upload SKU Corrections",
      onClick: () => {
        resetUploadModalState();
        setShowUploadModal(true);
      },
      icon: "pi pi-upload",
    },
    {
      key: "inventory-labels",
      label: "Inventory Labels",
      onClick: () => setShowLabelsModal(true),
      icon: "pi pi-tags",
    },
  ];

  return (
    <CatalogPageLayout
      title="SKU List"
      subtitle={`Total SKUs: ${totalRecords}`}
      actionsSlot={<PageActionsMenu items={headerActions} />}
    >
      <Toast ref={toastRef} position="top-right" />

      {lookupError && <div className="pt-alert pt-alert-danger" role="alert">{lookupError}</div>}

      <div className="catalog-page-toolbar">
        <PageFiltersBar
          searchLabel=""
          searchValue={searchInput}
          searchPlaceholder="Quick search SKU, style, or color"
          onSearchChange={setSearchInput}
          onApply={applySearch}
          applyLabel="Search"
          applying={loading}
          showAdvanced={showAdvancedFilters}
          onToggleAdvanced={() => setShowAdvancedFilters((prev) => !prev)}
          advancedFilters={
            <div className="page-filters-advanced-grid">
              <div className="page-filter-field">
                <label className="page-filters-label">Season</label>
                <select
                  value={seasonFilterId}
                  onChange={(e) => handleSeasonChange(e.target.value)}
                  disabled={loadingLookups}
                >
                  <option value="">All seasons</option>
                  {seasonOptions.map((season) => (
                    <option key={season.seasonId} value={season.seasonId}>
                      {season.seasonName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="page-filter-field page-filter-field--toggle">
                <div className="pt-flex-row">
                  <InputSwitch
                    inputId="sku-in-stock"
                    checked={inStockOnly}
                    onChange={(e) => handleInStockChange(e.value)}
                  />
                  <label htmlFor="sku-in-stock">In Stock Only</label>
                </div>
              </div>
            </div>
          }
          onClearFilters={clearFilters}
          clearLabel="Clear Filters"
        />
      </div>

      <div className="portal-content-card">
        <div>
          <div className="items-table-wrapper">
            <DataTable
              value={items}
              dataKey="skuId"
              loading={loading}
              rowHover
              editMode="row"
              editingRows={editingRows}
              onRowEditChange={(e) => setEditingRows(e.data as Record<string, boolean>)}
              onRowEditComplete={handleRowEditComplete}
              lazy
              paginator
              first={first}
              rows={rows}
              totalRecords={totalRecords}
              rowsPerPageOptions={PAGE_SIZE_OPTIONS}
              onPage={handlePage}
              sortField={sortField}
              sortOrder={sortOrder}
              onSort={handleSort}
              sortMode="single"
              className="p-datatable-gridlines items-colors-table"
              emptyMessage="No SKUs found."
            >
              <Column field="sku" header="SKU" sortable editor={renderSkuEditor} />
              <Column field="seasonName" header="Season" sortable className="col-season" />
              <Column field="itemNumber" header="Item Number" sortable className="col-style" />
              <Column field="description" header="Description" sortable className="col-description" />
              <Column field="colorName" header="Color" sortable className="col-color" />
              <Column field="sizeName" sortField="sizeSequence" header="Size" sortable className="col-size" />
              <Column field="qty" header="Qty" sortable className="text-end" />
              <Column field="inProduction" header="Active" body={renderInProduction} className="col-active" />
              <Column rowEditor header="Save" headerClassName="col-actions" bodyClassName="col-center" />
            </DataTable>
          </div>
        </div>
      </div>

      <Dialog
        visible={showLabelsModal}
        onHide={() => setShowLabelsModal(false)}
        header="Inventory Labels"
        modal
        closable
        draggable={false}
        resizable={false}
        className="inventory-labels-modal"
      >
        <InventoryLabels embedded />
      </Dialog>

      <UploadModal
        show={showUploadModal}
        title="Upload SKU Corrections"
        onClose={() => setShowUploadModal(false)}
        closeDisabled={uploadingSkus}
        onEnterKey={handleUploadSkuCorrections}
        enterDisabled={uploadRows.length === 0 || uploadParseErrors.length > 0 || uploadingSkus}
        headerContent={
          <>
            <h6 className="pt-text-body-strong">Upload SKU corrections</h6>
            <p className="pt-text-desc">
              Update existing SKU values by `SkuId`. Use Download SKU List to get the current IDs.
            </p>
          </>
        }
        downloadAction={
          <Button type="button" className="btn-info btn-outlined" onClick={handleDownloadSkuTemplate} unstyled>
            <i className="pi pi-download" aria-hidden="true" />
            Download Template
          </Button>
        }
      >
        <div className="pt-form-row-action mt-2">
          <div>
            <div>
              <label>Upload file</label>
              <input type="file" accept=".xlsx,.xls" onChange={handleUploadFile} disabled={uploadingSkus} />
              <small className="text-muted">Columns required: SkuId, SKU.</small>
            </div>
            {uploadFileName && <div className="pt-form-hint">Selected file: {uploadFileName}</div>}
          </div>
          <div className="pt-form-row-action__end">
            <Button
              type="button"
              className="btn-success"
              onClick={handleUploadSkuCorrections}
              disabled={uploadRows.length === 0 || uploadParseErrors.length > 0 || uploadingSkus}
            >
              {uploadingSkus ? (
                <>
                  <i className="pi pi-spin pi-spinner" aria-hidden="true" />
                  <i className="pi pi-upload" aria-hidden="true" />
                  Uploading...
                </>
              ) : (
                <>
                  <i className="pi pi-upload" aria-hidden="true" />
                  Upload Corrections
                </>
              )}
            </Button>
          </div>
        </div>

        {uploadRows.length > 0 && <div className="pt-form-hint">Rows ready to upload: {uploadRows.length}</div>}

        {uploadParseErrors.length > 0 && (
          <div className="pt-alert pt-alert-danger" role="alert">
            <div className="pt-text-body-strong pt-alert__header">Fix these issues before uploading:</div>
            <ul className="pt-alert__list">
              {uploadParseErrors.slice(0, 8).map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
            {uploadParseErrors.length > 8 && (
              <div className="pt-alert__footer">{uploadParseErrors.length - 8} more issue(s) not shown.</div>
            )}
          </div>
        )}

        {uploadSummary && uploadSummary.success && (
          <div className="pt-alert pt-alert-success" role="alert">
            Updated {uploadSummary.updated} SKU(s).
          </div>
        )}

        {uploadSummary && !uploadSummary.success && uploadSummary.errors.length > 0 && (
          <div className="pt-alert pt-alert-danger" role="alert">
            <div className="pt-text-body-strong pt-alert__header">Upload completed with issues:</div>
            <ul className="pt-alert__list">
              {uploadSummary.errors.slice(0, 8).map((error, index) => (
                <li key={`${error.rowNumber}-${error.skuId ?? "na"}-${index}`}>{formatBulkError(error)}</li>
              ))}
            </ul>
            {uploadSummary.errors.length > 8 && (
              <div className="pt-alert__footer">{uploadSummary.errors.length - 8} more issue(s) not shown.</div>
            )}
          </div>
        )}
      </UploadModal>
    </CatalogPageLayout>
  );
}
