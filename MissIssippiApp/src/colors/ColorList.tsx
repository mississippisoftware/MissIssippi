import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Button, Card, Col, Form, Row } from "react-bootstrap";
import { DataTable, type DataTableRowEditCompleteEvent } from "primereact/datatable";
import { Column } from "primereact/column";
import { Toast } from "primereact/toast";
import * as XLSX from "xlsx";
import CatalogPageLayout from "../components/CatalogPageLayout";
import UploadModal from "../components/UploadModal";
import CatalogService, { type ColorOption } from "../service/CatalogService";
import { InventoryService } from "../service/InventoryService";
import { normalizeHeader, normalizeName } from "../items/itemsColorsUtils";
import {
  appendSheet,
  createWorkbook,
  saveWorkbook,
  sheetFromAoa,
  sheetFromJson,
} from "../utils/xlsxUtils";
import { filterSeasonActiveRows } from "../utils/filterSeasonActiveRows";
import { printColorList } from "../utils/printCatalogLists";
import { useNotifier } from "../hooks/useNotifier";

type SeasonOption = { seasonId: number; seasonName: string };

type ColorListRow = ColorOption & { seasonName?: string | null };

type UploadColorRow = {
  rowNumber: number;
  seasonName: string;
  colorName: string;
  pantoneColor?: string;
  hexValue?: string;
};

type UploadSummary = {
  processed: number;
  errors: string[];
};

const buildColorKey = (name: string, seasonId?: number | null) =>
  `${normalizeName(name)}|${seasonId ?? ""}`;

const normalizeHex = (value: string) => {
  if (!value) return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  const cleaned = trimmed.startsWith("#") ? trimmed.toUpperCase() : `#${trimmed.toUpperCase()}`;
  return cleaned;
};

const isHexValid = (value: string) => {
  if (!value) return true;
  const cleaned = value.replace("#", "");
  return cleaned.length === 6;
};

export default function ColorList() {
  const toastRef = useRef<Toast>(null);
  const notify = useNotifier(toastRef);

  const [seasons, setSeasons] = useState<SeasonOption[]>([]);
  const [colors, setColors] = useState<ColorListRow[]>([]);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [loadingLookups, setLoadingLookups] = useState(true);

  const [editingRows, setEditingRows] = useState<Record<string, boolean>>({});
  const [tempColorId, setTempColorId] = useState(-1);
  const [seasonFilterId, setSeasonFilterId] = useState("");
  const [colorListLoading, setColorListLoading] = useState(false);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [defaultSeasonId, setDefaultSeasonId] = useState("");
  const [fileName, setFileName] = useState("");
  const [uploadRows, setUploadRows] = useState<UploadColorRow[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadSummary, setUploadSummary] = useState<UploadSummary | null>(null);

  const seasonMap = useMemo(() => {
    const map = new Map<number, string>();
    seasons.forEach((season) => {
      map.set(season.seasonId, season.seasonName);
    });
    return map;
  }, [seasons]);

  const normalizedSeasonMap = useMemo(() => {
    const map = new Map<string, number>();
    seasons.forEach((season) => {
      map.set(normalizeName(season.seasonName), season.seasonId);
    });
    return map;
  }, [seasons]);

  const normalizedColorMap = useMemo(() => {
    const map = new Map<string, ColorListRow>();
    colors.forEach((color) => {
      map.set(buildColorKey(color.colorName, color.seasonId ?? null), color);
    });
    return map;
  }, [colors]);

  const filteredColors = useMemo(() => {
    return filterSeasonActiveRows(colors, { seasonFilterId });
  }, [colors, seasonFilterId]);

  const loadLookups = async () => {
    setLoadingLookups(true);
    setLookupError(null);
    try {
      const [seasonData, colorData] = await Promise.all([
        InventoryService.getSeasons(),
        CatalogService.getColors(),
      ]);
      const localSeasonMap = new Map<number, string>();
      seasonData.forEach((season) => {
        localSeasonMap.set(season.seasonId, season.seasonName);
      });
      setSeasons(seasonData);
      const rows = colorData.map((color) => ({
        ...color,
        seasonName: color.seasonId ? localSeasonMap.get(color.seasonId) ?? "" : "",
      }));
      setColors(rows);
    } catch (err: any) {
      console.error(err);
      setLookupError(err?.message ?? "Failed to load colors.");
    } finally {
      setLoadingLookups(false);
    }
  };

  const loadColorList = async () => {
    setColorListLoading(true);
    try {
      const colorData = await CatalogService.getColors();
      const rows = colorData.map((color) => ({
        ...color,
        seasonName: color.seasonId ? seasonMap.get(color.seasonId) ?? "" : "",
      }));
      setColors(rows);
    } catch (err: any) {
      console.error(err);
      notify("error", "Color list failed", err?.message ?? "Unable to load color list.");
    } finally {
      setColorListLoading(false);
    }
  };

  useEffect(() => {
    loadLookups();
  }, []);

  useEffect(() => {
    if (seasons.length === 0) return;
    setColors((prev) =>
      prev.map((row) => ({
        ...row,
        seasonName: row.seasonId ? seasonMap.get(row.seasonId) ?? "" : "",
      }))
    );
  }, [seasonMap, seasons.length]);

  const handleAddColorRow = () => {
    const newId = tempColorId;
    setTempColorId((prev) => prev - 1);
    const defaultSeason =
      seasons.find((season) => String(season.seasonId) === seasonFilterId) ?? seasons[0];
    const newRow: ColorListRow = {
      colorId: newId,
      colorName: "",
      seasonId: defaultSeason?.seasonId ?? null,
      seasonName: defaultSeason?.seasonName ?? "",
      pantoneColor: "",
      hexValue: "",
    };
    setColors((prev) => [newRow, ...prev]);
    setEditingRows((prev) => ({ ...prev, [String(newId)]: true }));
  };

  const handleRowEditCancel = (event: unknown) => {
    const row = (event as { data?: ColorListRow })?.data;
    if (!row) return;
    if (row.colorId < 0) {
      setColors((prev) => prev.filter((entry) => entry.colorId !== row.colorId));
    }
  };

  const handleRowEditChange = (event: unknown) => {
    const next = (event as { data?: Record<string, boolean> })?.data;
    setEditingRows(next ?? {});
  };

  const handleColorSave = async (row: ColorListRow) => {
    if (!row.colorName?.trim()) {
      notify("warn", "Color required", "Enter a color name.");
      return false;
    }

    const normalizedHex = normalizeHex(row.hexValue ?? "");
    if (normalizedHex && !isHexValid(normalizedHex)) {
      notify("warn", "Hex format", "Hex should be 6 characters (for example, #1A2B3C).");
      return false;
    }

    try {
      await CatalogService.addOrUpdateColor({
        colorId: row.colorId > 0 ? row.colorId : undefined,
        colorName: row.colorName.trim(),
        seasonId: row.seasonId ? Number(row.seasonId) : null,
        pantoneColor: row.pantoneColor?.trim() || null,
        hexValue: normalizedHex || null,
      });
      await loadColorList();
      notify("success", "Color saved", `${row.colorName} saved successfully.`);
      return true;
    } catch (err: any) {
      console.error(err);
      notify("error", "Color save failed", err?.message ?? "Unable to save color.");
      return false;
    }
  };

  const handleRowEditComplete = async (event: DataTableRowEditCompleteEvent) => {
    const row = event.newData as ColorListRow;
    const saved = await handleColorSave(row);
    if (!saved) {
      setEditingRows((prev) => ({ ...prev, [String(row.colorId)]: true }));
      return;
    }
    setEditingRows({});
  };

  const renderSeasonEditor = (options: any) => (
    <Form.Select
      value={options.rowData.seasonId ?? ""}
      onChange={(e) => {
        const nextId = Number(e.target.value);
        const seasonName = seasonMap.get(nextId) ?? "";
        options.rowData.seasonId = nextId || null;
        options.rowData.seasonName = seasonName;
        options.editorCallback(nextId || null);
      }}
    >
      <option value="">No season</option>
      {seasons.map((season) => (
        <option key={season.seasonId} value={season.seasonId}>
          {season.seasonName}
        </option>
      ))}
    </Form.Select>
  );

  const renderTextEditor = (options: any) => (
    <Form.Control
      value={options.value ?? ""}
      onChange={(e) => options.editorCallback(e.target.value)}
    />
  );

  const renderHexEditor = (options: any) => (
    <Form.Control
      value={options.value ?? ""}
      onChange={(e) => options.editorCallback(e.target.value)}
      placeholder="#FFFFFF"
    />
  );

  const renderColorName = (row: ColorListRow) => (
    <div className="color-name-cell">
      <span
        className={`color-swatch${row.hexValue ? " has-hex" : ""}`}
        style={row.hexValue ? { backgroundColor: row.hexValue } : undefined}
      />
      <span className="color-name-value">{row.colorName}</span>
    </div>
  );

  const renderHexValue = (row: ColorListRow) => (
    <span className="color-hex-value">{row.hexValue ? row.hexValue.toUpperCase() : ""}</span>
  );

  const handleDownloadTemplate = () => {
    const headers = ["Season", "Color", "Pantone", "Hex"];
    const worksheet = sheetFromAoa([headers]);
    const workbook = createWorkbook();
    appendSheet(workbook, worksheet, "Colors");
    saveWorkbook(workbook, "color_list_template");
  };

  const handleDownloadColorList = () => {
    const headers = ["Season", "Color", "Pantone", "Hex"];
    const rows = filteredColors.map((row) => ({
      Season: row.seasonName ?? "",
      Color: row.colorName ?? "",
      Pantone: row.pantoneColor ?? "",
      Hex: row.hexValue ?? "",
    }));
    const worksheet = sheetFromJson(rows, { header: headers });
    const workbook = createWorkbook();
    appendSheet(workbook, worksheet, "Color List");
    saveWorkbook(workbook, "color_list");
  };

  const handlePrintColorList = () => {
    printColorList(filteredColors);
  };

  const handleUploadFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setFileName("");
      setUploadRows([]);
      setParseErrors([]);
      setUploadSummary(null);
      return;
    }

    setFileName(file.name);
    setUploadRows([]);
    setParseErrors([]);
    setUploadSummary(null);

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
      const colorIndex = findHeaderIndex(["color", "color name", "colorname"]);
      const pantoneIndex = findHeaderIndex(["pantone", "pantone color", "pantonecolor"]);
      const hexIndex = findHeaderIndex(["hex", "hex value", "hexvalue", "hex#"]);

      const missingRequired = [
        colorIndex < 0 ? "Color" : null,
        seasonIndex < 0 && !defaultSeasonId ? "Season" : null,
      ].filter(Boolean);

      if (missingRequired.length > 0) {
        setParseErrors([`Missing required columns: ${missingRequired.join(", ")}.`]);
        return;
      }

      const defaultSeasonName = defaultSeasonId
        ? seasons.find((season) => String(season.seasonId) === defaultSeasonId)?.seasonName ?? ""
        : "";

      const parsedRows: UploadColorRow[] = [];
      const errors: string[] = [];

      rawRows.slice(1).forEach((row, rowIndex) => {
        const values = row as Array<unknown>;
        const rowNumber = rowIndex + 2;

        const seasonName = seasonIndex >= 0 ? String(values[seasonIndex] ?? "").trim() : defaultSeasonName;
        const colorName = colorIndex >= 0 ? String(values[colorIndex] ?? "").trim() : "";
        const pantoneColor = pantoneIndex >= 0 ? String(values[pantoneIndex] ?? "").trim() : "";
        const rawHex = hexIndex >= 0 ? String(values[hexIndex] ?? "").trim() : "";
        const hexValue = normalizeHex(rawHex);

        if (!seasonName && !colorName && !pantoneColor && !hexValue) {
          return;
        }

        if (!seasonName) {
          errors.push(`Row ${rowNumber}: Season is required.`);
        }
        if (!colorName) {
          errors.push(`Row ${rowNumber}: Color is required.`);
        }
        if (hexValue && !isHexValid(hexValue)) {
          errors.push(`Row ${rowNumber}: Hex should be 6 characters (for example, #1A2B3C).`);
        }

        parsedRows.push({
          rowNumber,
          seasonName,
          colorName,
          pantoneColor,
          hexValue,
        });
      });

      setUploadRows(parsedRows);
      setParseErrors(errors);
    } catch (err: any) {
      console.error(err);
      setParseErrors([`Failed to read file: ${err?.message ?? "Unknown error"}`]);
    }
  };

  const handleUploadColors = async () => {
    if (uploadRows.length === 0 || parseErrors.length > 0) return;

    setUploading(true);
    setUploadSummary(null);
    const errors: string[] = [];
    let processed = 0;

    for (const row of uploadRows) {
      const normalizedSeason = normalizeName(row.seasonName);
      const seasonId = normalizedSeasonMap.get(normalizedSeason);
      if (!seasonId) {
        errors.push(`Row ${row.rowNumber}: Season '${row.seasonName}' not found.`);
        continue;
      }

      const colorKey = buildColorKey(row.colorName, seasonId);
      const existing = normalizedColorMap.get(colorKey);
      try {
        await CatalogService.addOrUpdateColor({
          colorId: existing?.colorId,
          colorName: row.colorName,
          seasonId,
          pantoneColor: row.pantoneColor?.trim() || null,
          hexValue: row.hexValue?.trim() || null,
        });
        processed += 1;
      } catch (err: any) {
        errors.push(`Row ${row.rowNumber}: ${err?.message ?? "Upload failed."}`);
      }
    }

    setUploadSummary({ processed, errors });
    setUploading(false);
    if (processed > 0) {
      await loadColorList();
    }
  };

  const uploadErrors = uploadSummary?.errors ?? [];
  const hasUploadErrors = uploadErrors.length > 0;

  return (
    <CatalogPageLayout
      title="Color List"
      subtitle={`Total colors: ${filteredColors.length}`}
      actions={[
        {
          label: "Download Color List",
          onClick: handleDownloadColorList,
          variant: "primary",
          icon: "pi pi-download",
          className: "btn-info btn-outlined",
        },
        {
          label: "Print Color List",
          onClick: handlePrintColorList,
          variant: "primary",
          icon: "pi pi-print",
          className: "btn-warn btn-outlined",
        },
        {
          label: "Upload Colors",
          onClick: () => setShowUploadModal(true),
          variant: "primary",
          icon: "pi pi-upload",
          className: "btn-success",
        },
      ]}
    >
      <Toast ref={toastRef} position="top-right" />

      {lookupError && <Alert variant="danger">{lookupError}</Alert>}

      <Card className="portal-content-card">
        <Card.Body>
          <Row className="items-actions-row align-items-center gy-2">
            <Col className="d-flex flex-wrap gap-2 justify-content-md-end">
              <Button
                type="button"
                className="btn-primary btn-outlined"
                onClick={handleAddColorRow}
                disabled={loadingLookups}
              >
                <i className="pi pi-plus" aria-hidden="true" />
                Add Color
              </Button>
              <Button
                type="button"
                className="btn-neutral btn-outlined"
                onClick={loadColorList}
                disabled={colorListLoading}
              >
                <i className="pi pi-refresh" aria-hidden="true" />
                {colorListLoading ? "Refreshing..." : "Refresh list"}
              </Button>
            </Col>
          </Row>

          <Row className="items-filter-row mt-3 gy-2 align-items-end">
            <Col md={4}>
              <Form.Label>Season</Form.Label>
              <Form.Select
                value={seasonFilterId}
                onChange={(e) => setSeasonFilterId(e.target.value)}
                disabled={loadingLookups}
              >
                <option value="">All seasons</option>
                {seasons.map((season) => (
                  <option key={season.seasonId} value={season.seasonId}>
                    {season.seasonName}
                  </option>
                ))}
              </Form.Select>
            </Col>
          </Row>

          <div className="items-table-wrapper mt-3">
            <DataTable
              value={filteredColors}
              dataKey="colorId"
              loading={colorListLoading}
              rowHover
              editMode="row"
              editingRows={editingRows}
              onRowEditChange={handleRowEditChange}
              onRowEditComplete={handleRowEditComplete}
              onRowEditCancel={handleRowEditCancel}
              className="p-datatable-gridlines items-colors-table"
            >
              <Column
                field="colorName"
                header="Color"
                body={renderColorName}
                editor={renderTextEditor}
                className="col-color"
              />
              <Column
                field="seasonId"
                header="Season"
                body={(row: ColorListRow) => row.seasonName ?? ""}
                editor={renderSeasonEditor}
                className="col-season"
              />
              <Column
                field="pantoneColor"
                header="Pantone"
                editor={renderTextEditor}
                className="col-description"
              />
              <Column
                field="hexValue"
                header="Hex"
                body={renderHexValue}
                editor={renderHexEditor}
                className="col-description"
              />
              <Column rowEditor header="Save" headerStyle={{ width: "6rem" }} bodyStyle={{ textAlign: "center" }} />
            </DataTable>
          </div>
        </Card.Body>
      </Card>

      <UploadModal
        show={showUploadModal}
        title="Upload Colors"
        onClose={() => setShowUploadModal(false)}
        closeDisabled={uploading}
        headerContent={
          <>
            <h6 className="mb-1">Upload color list</h6>
            <p className="text-muted mb-0">Add or update colors with season, Pantone, and hex values.</p>
          </>
        }
        downloadAction={
          <Button type="button" className="btn-info btn-outlined" onClick={handleDownloadTemplate}>
            <i className="pi pi-download" aria-hidden="true" />
            Download Template
          </Button>
        }
      >
        <Row className="gy-3 mt-2">
          <Col md={6}>
            <Form.Label>Default Season (optional)</Form.Label>
            <Form.Select
              value={defaultSeasonId}
              onChange={(e) => setDefaultSeasonId(e.target.value)}
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
          <Col md={6}>
            <Form.Label>Upload file</Form.Label>
            <Form.Control type="file" accept=".xlsx,.xls" onChange={handleUploadFile} />
          </Col>
        </Row>

        {fileName && <div className="text-muted mt-2">Selected file: {fileName}</div>}

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
            Upload successful. Processed {uploadSummary.processed} color(s).
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

        {uploadRows.length > 0 && (
          <div className="text-muted mt-2">Rows ready to upload: {uploadRows.length}</div>
        )}

        <div className="text-end mt-3">
          <Button
            type="button"
            className="btn-success"
            onClick={handleUploadColors}
            disabled={uploadRows.length === 0 || parseErrors.length > 0 || uploading}
          >
            <i className="pi pi-upload" aria-hidden="true" />
            {uploading ? "Uploading..." : "Upload colors"}
          </Button>
        </div>
      </UploadModal>
    </CatalogPageLayout>
  );
}
