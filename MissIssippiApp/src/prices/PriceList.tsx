import { type ChangeEvent, useEffect, useMemo, useState } from "react";
import { Alert, Button, Card, Col, Form, Modal, Row, Spinner } from "react-bootstrap";
import * as XLSX from "xlsx";
import CatalogPageLayout from "../components/CatalogPageLayout";
import CatalogService, { type ItemView } from "../service/CatalogService";
import { InventoryService } from "../service/InventoryService";
import { normalizeHeader, normalizeName } from "../items/itemsColorsUtils";
import { appendSheet, createWorkbook, saveWorkbook, sheetFromJson } from "../utils/xlsxUtils";

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

const parseOptionalNumber = (value: unknown) => {
  if (value === null || value === undefined) return null;
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  const raw = String(value).trim();
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isNaN(parsed) ? null : parsed;
};

const buildItemKey = (seasonName: string, itemNumber: string) =>
  `${normalizeName(seasonName)}|${normalizeName(itemNumber)}`;

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

  const loadItems = async () => {
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
      const rows = itemsData.map((item) => ({
        ...item,
        seasonName: item.seasonName ?? localSeasonMap.get(item.seasonId) ?? "",
      }));
      setItems(rows);
    } catch (err: any) {
      console.error(err);
      setLookupError(err?.message ?? "Failed to load items.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

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
      return;
    }

    setFileName(file.name);
    setUploadRows([]);
    setParseErrors([]);
    setUploadSummary(null);
    setMissingItems([]);

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
          if (index >= 0) return index;
        }
        return -1;
      };

      const seasonIndex = findHeaderIndex(["season", "season name", "seasonname"]);
      const itemIndex = findHeaderIndex(["style", "style number", "stylenumber", "style #", "style no"]);
      const wholesaleIndex = findHeaderIndex(["wholesale", "wholesale price", "wholesaleprice"]);
      const retailIndex = findHeaderIndex(["retail", "retail price", "retailprice"]);

      const missingRequired = [
        seasonIndex < 0 ? "Season" : null,
        itemIndex < 0 ? "Style Number" : null,
      ].filter(Boolean);

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

        if (!seasonName) {
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
    } catch (err: any) {
      console.error(err);
      setParseErrors([`Failed to read file: ${err?.message ?? "Unknown error"}`]);
    }
  };

  const handleUploadPrices = async () => {
    if (uploadRows.length === 0 || parseErrors.length > 0) return;

    setUploading(true);
    setUploadSummary(null);
    const errors: string[] = [];
    const missing: MissingItemRow[] = [];
    let updated = 0;

    for (const row of uploadRows) {
      const key = buildItemKey(row.seasonName, row.itemNumber);
      const item = itemKeyMap.get(key);
      if (!item) {
        missing.push({ rowNumber: row.rowNumber, seasonName: row.seasonName, itemNumber: row.itemNumber });
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
      } catch (err: any) {
        errors.push(`Row ${row.rowNumber}: ${err?.message ?? "Update failed."}`);
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

  return (
    <CatalogPageLayout
      title="Price List"
      subtitle="Download the current list, update wholesale and retail prices, then upload to apply changes."
      actions={[
        {
          label: "Download Price List",
          onClick: handleDownloadPriceList,
          variant: "primary",
          disabled: loading || items.length === 0,
          icon: "pi pi-download",
          className: "btn-info btn-outlined",
        },
      ]}
    >
      {lookupError && <Alert variant="danger">{lookupError}</Alert>}

      <Card className="portal-content-card inventory-upload-card">
        <Card.Body>
          <Row className="gy-3 align-items-center">
            <Col md={8}>
              <Form.Group controlId="priceListUploadFile">
                <Form.Label>Upload updated price list</Form.Label>
                <Form.Control type="file" accept=".xlsx,.xls" onChange={handleUploadFile} disabled={loading} />
                <Form.Text className="text-muted">
                  Columns expected: Season, Style Number, Wholesale, Retail.
                </Form.Text>
              </Form.Group>
              {fileName && <div className="text-muted mt-2">Selected file: {fileName}</div>}
            </Col>
            <Col md={4} className="text-md-end">
              <Button
                type="button"
                className="btn-success"
                onClick={handleUploadPrices}
                disabled={uploadRows.length === 0 || parseErrors.length > 0 || uploading}
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
                    Upload Prices
                  </>
                )}
              </Button>
            </Col>
          </Row>

          {uploadRows.length > 0 && (
            <div className="text-muted mt-3">Rows ready to upload: {uploadRows.length}</div>
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
                <div className="mt-2 text-muted">{parseErrors.length - 8} more issue(s) not shown.</div>
              )}
            </Alert>
          )}

          {uploadSummary && !hasUploadErrors && (
            <Alert variant="success" className="mt-3">
              Updated {uploadSummary.updated} item(s). {missingItems.length} item(s) not found.
            </Alert>
          )}

          {uploadSummary && hasUploadErrors && (
            <Alert variant="danger" className="mt-3">
              <strong>Upload completed with issues:</strong>
              <ul className="mb-0">
                {uploadErrors.slice(0, 8).map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
              {uploadErrors.length > 8 && (
                <div className="mt-2 text-muted">{uploadErrors.length - 8} more issue(s) not shown.</div>
              )}
            </Alert>
          )}
        </Card.Body>
      </Card>

      <Modal show={showMissingModal} onHide={() => setShowMissingModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Items not found</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-2">
            These styles were not updated because they were not found in the item list.
          </p>
          <ul className="mb-0">
            {missingItems.slice(0, 10).map((row) => (
              <li key={`${row.seasonName}-${row.itemNumber}-${row.rowNumber}`}>
                {row.seasonName} — {row.itemNumber}
              </li>
            ))}
          </ul>
          {missingItems.length > 10 && (
            <div className="mt-2 text-muted">{missingItems.length - 10} more item(s) not shown.</div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            type="button"
            className="btn-neutral btn-outlined"
            onClick={() => setShowMissingModal(false)}
          >
            <i className="pi pi-times" aria-hidden="true" />
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </CatalogPageLayout>
  );
}
