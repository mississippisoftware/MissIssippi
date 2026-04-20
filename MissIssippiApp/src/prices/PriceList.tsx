import { type ChangeEvent, type KeyboardEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputSwitch } from 'primereact/inputswitch';
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import CatalogPageLayout from "../components/CatalogPageLayout";
import PageActionsMenu from "../components/PageActionsMenu";
import CatalogService, { type ItemView } from "../service/CatalogService";
import { InventoryService } from "../service/InventoryService";
import { normalizeName } from "../items/itemsColorsUtils";
import { appendSheet, createWorkbook, saveWorkbook, sheetFromJson } from "../utils/xlsxUtils";
import { findHeaderIndex, normalizeHeaders, parseOptionalNumber, readFirstSheetRows } from "../utils/xlsxParse";
import { getErrorMessage } from "../utils/errors";
import { shouldSubmitOnEnter } from "../utils/modalKeyHandlers";
import { printPriceList } from "../utils/printCatalogLists";

type SeasonOption = { seasonId: number; seasonName: string };

type PriceUploadRow = {
  rowNumber: number;
  seasonName: string;
  itemNumber: string;
  wholesalePrice: number | null;
  retailPrice: number | null;
};

type MissingItemRow = {
  rowNumber: number;
  seasonName: string;
  itemNumber: string;
};

type UploadSummary = {
  processed: number;
  updated: number;
  errors: string[];
};

const buildItemKey = (seasonName: string, itemNumber: string) =>
  `${normalizeName(seasonName)}|${normalizeName(itemNumber)}`;

const formatPrice = (value: number | null | undefined) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "";
  return Number(value).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export default function PriceList() {
  const [items, setItems] = useState<ItemView[]>([]);
  const [seasons, setSeasons] = useState<SeasonOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const [fileName, setFileName] = useState("");
  const [uploadRows, setUploadRows] = useState<PriceUploadRow[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [uploadSummary, setUploadSummary] = useState<UploadSummary | null>(null);
  const [missingItems, setMissingItems] = useState<MissingItemRow[]>([]);
  const [showMissingModal, setShowMissingModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [defaultUploadSeasonId, setDefaultUploadSeasonId] = useState("");
  const [uploadMissingSeasonColumn, setUploadMissingSeasonColumn] = useState(false);

  const seasonMap = useMemo(() => {
    const map = new Map<number, string>();
    seasons.forEach((season) => {
      map.set(season.seasonId, season.seasonName);
    });
    return map;
  }, [seasons]);

  const itemKeyMap = useMemo(() => {
    const map = new Map<string, ItemView>();
    items.forEach((item) => {
      const seasonName = item.seasonName ?? "";
      map.set(buildItemKey(seasonName, item.itemNumber), item);
    });
    return map;
  }, [items]);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setLookupError(null);
    try {
      const [itemsData, seasonData] = await Promise.all([
        CatalogService.getItems(),
        InventoryService.getSeasons(),
      ]);
      const localSeasonMap = new Map<number, string>();
      seasonData.forEach((season) => {
        localSeasonMap.set(season.seasonId, season.seasonName);
      });
      setSeasons(seasonData);
      if (seasonData.length > 0) {
        setDefaultUploadSeasonId((prev) => (prev ? prev : String(seasonData[0].seasonId)));
      }
      const rows = itemsData.map((item) => ({
        ...item,
        seasonName: item.seasonName ?? localSeasonMap.get(item.seasonId) ?? "",
      }));
      setItems(rows);
    } catch (err: unknown) {
      console.error(err);
      setLookupError(getErrorMessage(err, "Failed to load items."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  useEffect(() => {
    if (seasons.length === 0) return;
    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        seasonName: item.seasonName ?? seasonMap.get(item.seasonId) ?? "",
      }))
    );
  }, [seasonMap, seasons.length]);

  const handleDownloadPriceList = () => {
    if (items.length === 0) return;
    const headers = ["Season", "Style Number", "Wholesale", "Retail"];
    const rows = items.map((item) => ({
      Season: item.seasonName ?? "",
      "Style Number": item.itemNumber ?? "",
      Wholesale: item.wholesalePrice ?? "",
      Retail: item.costPrice ?? "",
    }));
    const worksheet = sheetFromJson(rows, { header: headers });
    const workbook = createWorkbook();
    appendSheet(workbook, worksheet, "Price List");
    saveWorkbook(workbook, "price_list");
  };

  const handleUploadFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setFileName("");
      setUploadRows([]);
      setParseErrors([]);
      setUploadSummary(null);
      setMissingItems([]);
      setUploadMissingSeasonColumn(false);
      return;
    }

    setFileName(file.name);
    setUploadRows([]);
    setParseErrors([]);
    setUploadSummary(null);
    setMissingItems([]);
    setUploadMissingSeasonColumn(false);

    try {
      const buffer = await file.arrayBuffer();
      const { rows: rawRows, errors: sheetErrors } = readFirstSheetRows(buffer);
      if (sheetErrors.length > 0) {
        setParseErrors(sheetErrors);
        return;
      }

      const headerRow = rawRows[0] as unknown[];
      const normalizedHeaders = normalizeHeaders(headerRow);

      const seasonIndex = findHeaderIndex(normalizedHeaders, ["season", "season name", "seasonname"]);
      const itemIndex = findHeaderIndex(normalizedHeaders, [
        "style",
        "style number",
        "stylenumber",
        "style #",
        "style no",
      ]);
      const wholesaleIndex = findHeaderIndex(normalizedHeaders, [
        "wholesale",
        "wholesale price",
        "wholesaleprice",
      ]);
      const retailIndex = findHeaderIndex(normalizedHeaders, ["retail", "retail price", "retailprice"]);

      setUploadMissingSeasonColumn(seasonIndex < 0);

      const missingRequired = [itemIndex < 0 ? "Style Number" : null].filter(Boolean);

      if (missingRequired.length > 0) {
        setParseErrors([`Missing required columns: ${missingRequired.join(", ")}.`]);
        return;
      }

      const parsedRows: PriceUploadRow[] = [];
      const errors: string[] = [];

      rawRows.slice(1).forEach((row, rowIndex) => {
        const values = row as Array<unknown>;
        const rowNumber = rowIndex + 2;

        const seasonName = seasonIndex >= 0 ? String(values[seasonIndex] ?? "").trim() : "";
        const itemNumber = itemIndex >= 0 ? String(values[itemIndex] ?? "").trim() : "";
        const wholesalePrice = wholesaleIndex >= 0 ? parseOptionalNumber(values[wholesaleIndex]) : null;
        const retailPrice = retailIndex >= 0 ? parseOptionalNumber(values[retailIndex]) : null;

        if (!seasonName && !itemNumber && wholesalePrice === null && retailPrice === null) {
          return;
        }

        if (seasonIndex >= 0 && !seasonName) {
          errors.push(`Row ${rowNumber}: Season is required.`);
        }
        if (!itemNumber) {
          errors.push(`Row ${rowNumber}: Style Number is required.`);
        }

        parsedRows.push({
          rowNumber,
          seasonName,
          itemNumber,
          wholesalePrice,
          retailPrice,
        });
      });

      setUploadRows(parsedRows);
      setParseErrors(errors);
    } catch (err: unknown) {
      console.error(err);
      setParseErrors([`Failed to read file: ${getErrorMessage(err, "Unknown error")}`]);
    }
  };

  const handleUploadPrices = async () => {
    if (uploadRows.length === 0 || parseErrors.length > 0) return;
    const defaultSeasonName =
      uploadMissingSeasonColumn && defaultUploadSeasonId
        ? seasons.find((season) => String(season.seasonId) === defaultUploadSeasonId)?.seasonName ?? ""
        : "";
    if (uploadMissingSeasonColumn && !defaultSeasonName) {
      setUploadSummary({
        processed: 0,
        updated: 0,
        errors: ["Select a season for this file before uploading."],
      });
      return;
    }

    setUploading(true);
    setUploadSummary(null);
    const errors: string[] = [];
    const missing: MissingItemRow[] = [];
    let updated = 0;

    for (const row of uploadRows) {
      const effectiveSeasonName = row.seasonName || defaultSeasonName;
      const key = buildItemKey(effectiveSeasonName, row.itemNumber);
      const item = itemKeyMap.get(key);
      if (!item) {
        missing.push({ rowNumber: row.rowNumber, seasonName: effectiveSeasonName, itemNumber: row.itemNumber });
        continue;
      }

      const nextWholesale = row.wholesalePrice ?? item.wholesalePrice ?? null;
      const nextRetail = row.retailPrice ?? item.costPrice ?? null;

      try {
        await CatalogService.addOrUpdateItem({
          itemId: item.itemId,
          itemNumber: item.itemNumber,
          description: item.description,
          seasonId: item.seasonId,
          inProduction: item.inProduction,
          wholesalePrice: nextWholesale,
          costPrice: nextRetail,
          weight: item.weight ?? null,
        });
        updated += 1;
      } catch (err: unknown) {
        errors.push(`Row ${row.rowNumber}: ${getErrorMessage(err, "Update failed.")}`);
      }
    }

    setUploadSummary({ processed: uploadRows.length, updated, errors });
    setMissingItems(missing);
    if (missing.length > 0) {
      setShowMissingModal(true);
    }
    setUploading(false);
    if (updated > 0) {
      await loadItems();
    }
  };

  const uploadErrors = uploadSummary?.errors ?? [];
  const hasUploadErrors = uploadErrors.length > 0;
  const priceRows = useMemo(
    () =>
      [...items].sort((a, b) => {
        const seasonDiff = String(a.seasonName ?? "").localeCompare(String(b.seasonName ?? ""));
        if (seasonDiff !== 0) return seasonDiff;
        return String(a.itemNumber ?? "").localeCompare(String(b.itemNumber ?? ""));
      }),
    [items]
  );

  const handlePrintPriceList = () => {
    printPriceList({ rows: priceRows, formatPrice });
  };

  const headerActions = [
    {
      key: "download-price-list",
      label: "Download Price List",
      onClick: handleDownloadPriceList,
      disabled: loading || items.length === 0,
      icon: "pi pi-download",
    },
    {
      key: "print-price-list",
      label: "Print Price List",
      onClick: handlePrintPriceList,
      disabled: loading || priceRows.length === 0,
      icon: "pi pi-print",
    },
  ];

  return (
    <CatalogPageLayout
      title="Price List"
      subtitle="Download the current list, update wholesale and retail prices, then upload to apply changes."
      actionsSlot={<PageActionsMenu items={headerActions} />}
    >
      {lookupError && <div className="pt-alert pt-alert-danger" role="alert">{lookupError}</div>}

      <div className="portal-content-card inventory-upload-card">
        <div>
          <div className="pt-form-row-action">
            <div>
              <div>
                <label>Upload updated price list</label>
                <input type="file" accept=".xlsx,.xls" onChange={handleUploadFile} disabled={loading} />
                <small className="text-muted">
                  Columns expected: Season, Style Number, Wholesale, Retail.
                </small>
              </div>
              {uploadMissingSeasonColumn && (
                <div>
                  <label>Season for this file</label>
                  <select
                    value={defaultUploadSeasonId}
                    onChange={(e) => setDefaultUploadSeasonId(e.target.value)}
                    disabled={loading || seasons.length === 0}
                  >
                    <option value="">Choose season</option>
                    {seasons.map((season) => (
                      <option key={season.seasonId} value={season.seasonId}>
                        {season.seasonName}
                      </option>
                    ))}
                  </select>
                  <small className="text-muted">
                    This file has no Season column. One season is required.
                  </small>
                </div>
              )}
              {fileName && <div className="pt-form-hint">Selected file: {fileName}</div>}
            </div>
            <div className="pt-form-row-action__end">
              <Button
                type="button"
                className="btn-success"
                onClick={handleUploadPrices}
                disabled={
                  uploadRows.length === 0 ||
                  parseErrors.length > 0 ||
                  uploading ||
                  (uploadMissingSeasonColumn && !defaultUploadSeasonId)
                }
              >
                {uploading ? (
                  <>
                    <i className="pi pi-spin pi-spinner" aria-hidden="true" />
                    <i className="pi pi-upload" aria-hidden="true" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <i className="pi pi-upload" aria-hidden="true" />
                    Upload Prices
                  </>
                )}
              </Button>
            </div>
          </div>

          {uploadRows.length > 0 && (
            <div className="pt-form-hint">Rows ready to upload: {uploadRows.length}</div>
          )}

          {parseErrors.length > 0 && (
            <div className="pt-alert pt-alert-danger" role="alert">
              <div className="pt-text-body-strong pt-alert__header">Fix these issues before uploading:</div>
              <ul className="pt-alert__list">
                {parseErrors.slice(0, 8).map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
              {parseErrors.length > 8 && (
                <div className="pt-alert__footer">{parseErrors.length - 8} more issue(s) not shown.</div>
              )}
            </div>
          )}

          {uploadSummary && !hasUploadErrors && (
            <div className="pt-alert pt-alert-success" role="alert">
              Updated {uploadSummary.updated} item(s). {missingItems.length} item(s) not found.
            </div>
          )}

          {uploadSummary && hasUploadErrors && (
            <div className="pt-alert pt-alert-danger" role="alert">
              <div className="pt-text-body-strong pt-alert__header">Upload completed with issues:</div>
              <ul className="pt-alert__list">
                {uploadErrors.slice(0, 8).map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
              {uploadErrors.length > 8 && (
                <div className="pt-alert__footer">{uploadErrors.length - 8} more issue(s) not shown.</div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="portal-content-card inventory-upload-card mt-4">
        <div>
          <div className="pt-form-group">
            <h5 className="card-heading-title">Current Price List</h5>
            <p className="pt-text-desc">
              View item wholesale and retail prices currently in the system.
            </p>
          </div>

          <div className="items-table-wrapper">
            <DataTable
              value={priceRows}
              dataKey="itemId"
              loading={loading}
              rowHover
              paginator
              rows={25}
              rowsPerPageOptions={[25, 50, 100]}
              className="p-datatable-gridlines items-colors-table"
              sortField="itemNumber"
              sortOrder={1}
              responsiveLayout="scroll"
            >
              <Column field="seasonName" header="Season" sortable />
              <Column field="itemNumber" header="Style" sortable />
              <Column field="description" header="Description" sortable />
              <Column
                field="wholesalePrice"
                header="Wholesale"
                sortable
                body={(row: ItemView) => formatPrice(row.wholesalePrice ?? null)}
              />
              <Column
                field="costPrice"
                header="Retail"
                sortable
                body={(row: ItemView) => formatPrice(row.costPrice ?? null)}
              />
            </DataTable>
          </div>
        </div>
      </div>

      <Dialog
        visible={showMissingModal}
        onHide={() => setShowMissingModal(false)}
        header="Items not found"
        footer={
          <Button type="button" className="btn-neutral btn-outlined" onClick={() => setShowMissingModal(false)} unstyled>
            <i className="pi pi-times" aria-hidden="true" />
            Close
          </Button>
        }
        modal
        closable
        draggable={false}
        resizable={false}
        onKeyDown={(event: KeyboardEvent<HTMLElement>) => {
          if (!shouldSubmitOnEnter(event)) return;
          event.preventDefault();
          setShowMissingModal(false);
        }}
      >
        <p className="mb-2">
          These styles were not updated because they were not found in the item list.
        </p>
        <ul className="pt-list-compact">
          {missingItems.slice(0, 10).map((row) => (
            <li key={`${row.seasonName}-${row.itemNumber}-${row.rowNumber}`}>
              {row.seasonName} — {row.itemNumber}
            </li>
          ))}
        </ul>
        {missingItems.length > 10 && (
          <div className="pt-form-hint">{missingItems.length - 10} more item(s) not shown.</div>
        )}
      </Dialog>
    </CatalogPageLayout>
  );
}
