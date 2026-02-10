import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Button, Card, Col, Form, Modal, Row } from "react-bootstrap";
import { DataTable, type DataTableRowEditCompleteEvent } from "primereact/datatable";
import { Column } from "primereact/column";
import { Toast } from "primereact/toast";
import * as XLSX from "xlsx";
import { InventoryService } from "../service/InventoryService";
import CatalogService, { type ColorOption } from "../service/CatalogService";
import CatalogPageLayout from "../components/CatalogPageLayout";
import { printHtml } from "../utils/printHtml";
import ItemsColorsColorModal from "./ItemsColorsColorModal";
import ItemsColorsColorReviewModal from "./ItemsColorsColorReviewModal";
import type {
  ColorResolution,
  ColorResolutionMap,
  ColorReviewItem,
  ColorUploadSummary,
  ItemListRow,
  PendingColor,
  ReviewContext,
  SeasonOption,
  UploadColorRow,
  UploadItemRow,
  UploadSummary,
} from "./itemsColorsTypes";
import {
  MAX_COLOR_COLUMNS,
  getReadableTextColor,
  isSimilarName,
  normalizeHeader,
  normalizeName,
} from "./itemsColorsUtils";

export default function ItemsColors() {
  const toastRef = useRef<Toast>(null);

  const [seasons, setSeasons] = useState<SeasonOption[]>([]);
  const [colors, setColors] = useState<ColorOption[]>([]);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [loadingLookups, setLoadingLookups] = useState(true);

  const [colorInput, setColorInput] = useState("");
  const [pendingColors, setPendingColors] = useState<PendingColor[]>([]);
  const [savingColors, setSavingColors] = useState(false);

  const [defaultSeasonId, setDefaultSeasonId] = useState("");
  const [fileName, setFileName] = useState("");
  const [uploadRows, setUploadRows] = useState<UploadItemRow[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadSummary, setUploadSummary] = useState<UploadSummary | null>(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateRows, setDuplicateRows] = useState<UploadItemRow[]>([]);
  const [updateExistingItems, setUpdateExistingItems] = useState(false);

  const [colorDefaultSeasonId, setColorDefaultSeasonId] = useState("");
  const [colorFileName, setColorFileName] = useState("");
  const [colorUploadRows, setColorUploadRows] = useState<UploadColorRow[]>([]);
  const [colorParseErrors, setColorParseErrors] = useState<string[]>([]);
  const [colorUploading, setColorUploading] = useState(false);
  const [colorUploadSummary, setColorUploadSummary] = useState<ColorUploadSummary | null>(null);

  const [colorResolutionMap, setColorResolutionMap] = useState<ColorResolutionMap>({});
  const [colorReviewItems, setColorReviewItems] = useState<ColorReviewItem[]>([]);
  const [reviewContext, setReviewContext] = useState<ReviewContext | null>(null);
  const [showColorReview, setShowColorReview] = useState(false);

  const [itemList, setItemList] = useState<ItemListRow[]>([]);
  const [itemListLoading, setItemListLoading] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [selectedItem, setSelectedItem] = useState<ItemListRow | null>(null);
  const [editingRows, setEditingRows] = useState<Record<string, boolean>>({});
  const [tempItemId, setTempItemId] = useState(-1);
  const [seasonFilterId, setSeasonFilterId] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [showColorModal, setShowColorModal] = useState(false);
  const [colorModalItem, setColorModalItem] = useState<ItemListRow | null>(null);
  const [colorPantoneInput, setColorPantoneInput] = useState("");
  const [colorHexInput, setColorHexInput] = useState("");

  const normalizedColors = useMemo(
    () =>
      colors.map((color) => ({
        ...color,
        normalized: normalizeName(color.colorName),
      })),
    [colors]
  );

  const priceFormatter = useMemo(
    () => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }),
    []
  );

  const filteredItems = useMemo(() => {
    let next = itemList;
    if (seasonFilterId) {
      const seasonId = Number(seasonFilterId);
      if (seasonId) {
        next = next.filter((row) => row.seasonId === seasonId);
      }
    }
    if (activeFilter === "active") {
      next = next.filter((row) => row.inProduction);
    } else if (activeFilter === "inactive") {
      next = next.filter((row) => !row.inProduction);
    }
    return next;
  }, [itemList, seasonFilterId, activeFilter]);

  const handleExpandAll = () => {
    const next: Record<string, boolean> = {};
    filteredItems.forEach((row) => {
      if (row.itemId > 0) {
        next[String(row.itemId)] = true;
      }
    });
    setExpandedRows(next);
  };

  const handleCollapseAll = () => {
    setExpandedRows({});
  };

  const formatPrice = (value?: number | null) =>
    value === null || value === undefined ? "--" : priceFormatter.format(value);

  const buildItemKey = (seasonId: number, itemNumber: string) =>
    `${seasonId}|${normalizeName(itemNumber)}`;

  const itemKeyMap = useMemo(() => {
    const map = new Map<string, ItemListRow>();
    itemList.forEach((item) => {
      map.set(buildItemKey(item.seasonId, item.itemNumber), item);
    });
    return map;
  }, [itemList]);

  const loadLookups = async () => {
    setLoadingLookups(true);
    setLookupError(null);
    try {
      const [seasonData, colorData] = await Promise.all([
        InventoryService.getSeasons(),
        CatalogService.getColors(),
      ]);
      setSeasons(seasonData);
      setColors(colorData);
    } catch (err: any) {
      console.error(err);
      setLookupError(err?.message ?? "Failed to load catalog lookups.");
    } finally {
      setLoadingLookups(false);
    }
  };

  const loadItemList = async () => {
    setItemListLoading(true);
    try {
      const [itemsData, itemColorData] = await Promise.all([
        CatalogService.getItems(),
        CatalogService.getItemColors(),
      ]);
      const itemColorMap = new Map<number, ItemColorView[]>();
      itemColorData.forEach((entry) => {
        const list = itemColorMap.get(entry.itemId);
        if (list) {
          list.push(entry);
        } else {
          itemColorMap.set(entry.itemId, [entry]);
        }
      });

      const rows = itemsData.map((item) => ({
        ...item,
        colors: (itemColorMap.get(item.itemId) ?? []).sort((a, b) =>
          a.colorName.localeCompare(b.colorName)
        ),
      }));
      setItemList(rows);
      if (selectedItem) {
        const match = rows.find((entry) => entry.itemId === selectedItem.itemId);
        setSelectedItem(match ?? null);
      }
      if (colorModalItem) {
        const match = rows.find((entry) => entry.itemId === colorModalItem.itemId);
        setColorModalItem(match ?? null);
      }
      return rows;
    } catch (err: any) {
      console.error(err);
      toastRef.current?.show({
        severity: "error",
        summary: "Item list failed",
        detail: err?.message ?? "Unable to load items list.",
      });
      return [];
    } finally {
      setItemListLoading(false);
    }
  };

  useEffect(() => {
    loadLookups();
    loadItemList();
  }, []);

  const activeColorItem = colorModalItem ?? selectedItem;
  const activeColorItemId = activeColorItem?.itemId ?? 0;

  useEffect(() => {
    setPendingColors([]);
    setColorInput("");
    setColorPantoneInput("");
    setColorHexInput("");
  }, [activeColorItemId]);

  const resolveSeasonName = (seasonId: number | string) =>
    seasons.find((season) => season.seasonId === Number(seasonId))?.seasonName ?? "";

  const seasonSummary = useMemo(() => {
    if (seasonFilterId) {
      return resolveSeasonName(seasonFilterId) || "All seasons";
    }
    const names = Array.from(
      new Set(filteredItems.map((row) => row.seasonName).filter((name): name is string => Boolean(name)))
    );
    return names.length ? names.join(", ") : "All seasons";
  }, [filteredItems, seasonFilterId, seasons]);

  const buildColorResolutions = (names: string[], baseMap: ColorResolutionMap) => {
    const nextMap: ColorResolutionMap = {};
    const reviewItems: ColorReviewItem[] = [];
    const seen = new Set<string>();

    names.forEach((name) => {
      const normalized = normalizeName(name);
      if (!normalized || seen.has(normalized)) return;
      seen.add(normalized);

      if (baseMap[normalized]) return;

      const exact = normalizedColors.find((color) => color.normalized === normalized);
      if (exact) {
        nextMap[normalized] = {
          normalized,
          inputName: name,
          action: "existing",
          colorId: exact.colorId,
          resolvedName: exact.colorName,
        };
        return;
      }

      const suggestions = normalizedColors.filter((color) => isSimilarName(normalized, color.normalized));
      if (suggestions.length) {
        reviewItems.push({
          inputName: name,
          normalized,
          suggestions,
          choice: "new",
        });
      } else {
        nextMap[normalized] = {
          normalized,
          inputName: name,
          action: "new",
          resolvedName: name,
        };
      }
    });

    return { nextMap, reviewItems };
  };

  const addPendingColorFromResolution = (
    resolution: ColorResolution,
    meta?: { seasonId?: number | null; pantoneColor?: string | null; hexValue?: string | null }
  ) => {
    const normalized = resolution.normalized;
    setPendingColors((prev) => {
      if (prev.some((item) => item.normalized === normalized)) {
        return prev;
      }
      return [
        ...prev,
        {
          name: resolution.resolvedName,
          normalized,
          colorId: resolution.colorId,
          source: resolution.action === "existing" ? "existing" : "new",
          seasonId: meta?.seasonId ?? null,
          pantoneColor: meta?.pantoneColor ?? null,
          hexValue: meta?.hexValue ?? null,
        },
      ];
    });
    setColorInput("");
    setColorPantoneInput("");
    setColorHexInput("");
  };

  const handleAddColor = () => {
    if (!activeColorItem || activeColorItem.itemId <= 0) {
      toastRef.current?.show({
        severity: "warn",
        summary: "Save the style first",
        detail: "Save the style before adding colors.",
      });
      return;
    }

    const name = colorInput.trim();
    if (!name) return;

    const normalized = normalizeName(name);
    if (pendingColors.some((color) => color.normalized === normalized)) {
      toastRef.current?.show({
        severity: "warn",
        summary: "Duplicate color",
        detail: "That color is already added.",
      });
      return;
    }

    const rawPantone = colorPantoneInput.trim();
    const rawHex = colorHexInput.trim();
    const normalizedHex =
      rawHex.length === 0
        ? ""
        : rawHex.startsWith("#")
          ? rawHex.toUpperCase()
          : `#${rawHex.toUpperCase()}`;
    if (normalizedHex && normalizedHex.length !== 7) {
      toastRef.current?.show({
        severity: "warn",
        summary: "Hex format",
        detail: "Hex should be 6 characters (for example, #1A2B3C).",
      });
      return;
    }

    const meta = {
      seasonId: activeColorItem.seasonId,
      pantoneColor: rawPantone || null,
      hexValue: normalizedHex || null,
    };

    const { nextMap, reviewItems } = buildColorResolutions([name], colorResolutionMap);
    const mergedMap = { ...colorResolutionMap, ...nextMap };

    if (reviewItems.length) {
      setColorReviewItems(reviewItems);
      setReviewContext({ type: "manual", baseMap: mergedMap, normalized, ...meta });
      setShowColorReview(true);
      return;
    }

    setColorResolutionMap(mergedMap);
    const resolution =
      mergedMap[normalized] ??
      ({
        normalized,
        inputName: name,
        action: "new",
        resolvedName: name,
      } satisfies ColorResolution);
    addPendingColorFromResolution(resolution, meta);
  };

  const handleAddItemRow = () => {
    const newId = tempItemId;
    setTempItemId((prev) => prev - 1);
    const defaultSeason =
      seasons.find((season) => String(season.seasonId) === seasonFilterId) ?? seasons[0];
    const newRow: ItemListRow = {
      itemId: newId,
      itemNumber: "",
      description: "",
      costPrice: null,
      wholesalePrice: null,
      weight: null,
      seasonId: defaultSeason?.seasonId ?? 0,
      seasonName: defaultSeason?.seasonName ?? "",
      inProduction: false,
      colors: [],
    };
    setItemList((prev) => [newRow, ...prev]);
    setEditingRows((prev) => ({ ...prev, [String(newId)]: true }));
    setSelectedItem(newRow);
  };

  const openColorModal = (row: ItemListRow) => {
    setSelectedItem(row);
    setColorModalItem(row);
    setShowColorModal(true);
  };

  const closeColorModal = () => {
    setShowColorModal(false);
    setColorModalItem(null);
    setPendingColors([]);
    setColorInput("");
    setColorPantoneInput("");
    setColorHexInput("");
  };

  const handleItemSave = async (row: ItemListRow) => {
    if (!row.itemNumber?.trim()) {
      toastRef.current?.show({
        severity: "warn",
        summary: "Style required",
        detail: "Enter a style number.",
      });
      return false;
    }
    if (!row.seasonId) {
      toastRef.current?.show({
        severity: "warn",
        summary: "Season required",
        detail: "Select a season.",
      });
      return false;
    }
    if (!row.description?.trim()) {
      toastRef.current?.show({
        severity: "warn",
        summary: "Description required",
        detail: "Enter a description.",
      });
      return false;
    }

    try {
      await CatalogService.addOrUpdateItem({
        itemId: row.itemId > 0 ? row.itemId : undefined,
        itemNumber: row.itemNumber.trim(),
        description: row.description.trim(),
        seasonId: Number(row.seasonId),
        costPrice: row.costPrice,
        wholesalePrice: row.wholesalePrice,
        inProduction: row.inProduction ?? false,
        weight: row.weight,
      });

      const rows = await loadItemList();
      const seasonName = resolveSeasonName(row.seasonId);
      const normalizedItem = normalizeName(row.itemNumber);
      const matched = rows.find(
        (item) =>
          normalizeName(item.itemNumber) === normalizedItem &&
          normalizeName(item.seasonName ?? "") === normalizeName(seasonName)
      );
      setSelectedItem(matched ?? null);
      toastRef.current?.show({
        severity: "success",
        summary: "Style saved",
        detail: `${row.itemNumber} saved successfully.`,
      });
      return true;
    } catch (err: any) {
      console.error(err);
      toastRef.current?.show({
        severity: "error",
        summary: "Style save failed",
        detail: err?.message ?? "Unable to save style.",
      });
      return false;
    }
  };

  const resolveColorId = async (
    color: PendingColor,
    createdColorIds: Map<string, number>,
    nextColors: ColorOption[]
  ) => {
    const desiredSeasonId = color.seasonId ?? null;
    const desiredPantone = color.pantoneColor?.trim() || null;
    const desiredHex = color.hexValue?.trim() || null;

    const refreshColor = (updated: ColorOption) => {
      nextColors.push(updated);
    };

    const ensureColorMetadata = async (colorId: number, fallbackName: string, existing?: ColorOption) => {
      const nextSeasonId = existing?.seasonId ?? desiredSeasonId ?? null;
      const nextPantone = existing?.pantoneColor ?? desiredPantone ?? null;
      const nextHex = existing?.hexValue ?? desiredHex ?? null;

      const shouldUpdate =
        (desiredSeasonId && existing?.seasonId == null) ||
        (desiredPantone && !existing?.pantoneColor) ||
        (desiredHex && !existing?.hexValue);

      if (!shouldUpdate) {
        return;
      }

      await CatalogService.addOrUpdateColor({
        colorId,
        colorName: existing?.colorName ?? fallbackName,
        seasonId: nextSeasonId ?? undefined,
        pantoneColor: nextPantone ?? undefined,
        hexValue: nextHex ?? undefined,
      });

      const refreshed = await CatalogService.getColors({ colorId });
      if (refreshed[0]) {
        refreshColor(refreshed[0]);
      }
    };

    if (color.colorId) {
      const existing = normalizedColors.find((item) => item.colorId === color.colorId);
      await ensureColorMetadata(color.colorId, color.name, existing);
      return color.colorId;
    }
    const cached = createdColorIds.get(color.normalized);
    if (cached) {
      const existing = normalizedColors.find((item) => item.colorId === cached);
      await ensureColorMetadata(cached, color.name, existing);
      return cached;
    }

    if (color.source === "existing") {
      const exact = normalizedColors.find((item) => item.normalized === color.normalized);
      if (exact) {
        await ensureColorMetadata(exact.colorId, exact.colorName, exact);
        return exact.colorId;
      }
    }

    await CatalogService.addOrUpdateColor({
      colorName: color.name,
      seasonId: desiredSeasonId ?? undefined,
      pantoneColor: desiredPantone ?? undefined,
      hexValue: desiredHex ?? undefined,
    });
    const matches = await CatalogService.getColors({ colorName: color.name });
    const match = matches.find((item) => normalizeName(item.colorName) === color.normalized);
    if (!match) return undefined;

    createdColorIds.set(color.normalized, match.colorId);
    nextColors.push(match);
    return match.colorId;
  };

  const handleSaveColors = async () => {
    if (!activeColorItem || activeColorItem.itemId <= 0) {
      toastRef.current?.show({
        severity: "warn",
        summary: "Save the style first",
        detail: "Save the style before adding colors.",
      });
      return;
    }
    if (pendingColors.length === 0) {
      toastRef.current?.show({
        severity: "info",
        summary: "No colors",
        detail: "Add colors before saving.",
      });
      return;
    }

    setSavingColors(true);
    try {
      const itemColors = await CatalogService.getItemColors({ itemId: activeColorItem.itemId });
      const existingColorIds = new Set(itemColors.map((sc) => sc.colorId));
      const createdColorIds = new Map<string, number>();
      const newColors: ColorOption[] = [];
      let added = 0;
      let skipped = 0;

      for (const color of pendingColors) {
        const colorId = await resolveColorId(color, createdColorIds, newColors);
        if (!colorId) {
          continue;
        }
        if (existingColorIds.has(colorId)) {
          skipped += 1;
          continue;
        }
        await CatalogService.addOrUpdateItemColor({
          itemId: activeColorItem.itemId,
          colorId,
        });
        existingColorIds.add(colorId);
        added += 1;
      }

      if (newColors.length) {
        setColors((prev) => {
          const next = [...prev];
          newColors.forEach((color) => {
            const index = next.findIndex((item) => item.colorId === color.colorId);
            if (index >= 0) {
              next[index] = color;
            } else {
              next.push(color);
            }
          });
          return next;
        });
      }

      setPendingColors([]);
      await loadItemList();
      closeColorModal();
      toastRef.current?.show({
        severity: "success",
        summary: "Colors saved",
        detail: `Added ${added} color(s). Skipped ${skipped} existing link(s).`,
      });
    } catch (err: any) {
      console.error(err);
      toastRef.current?.show({
        severity: "error",
        summary: "Color save failed",
        detail: err?.message ?? "Unable to save colors.",
      });
    } finally {
      setSavingColors(false);
    }
  };

  const handleRowEditComplete = async (event: DataTableRowEditCompleteEvent) => {
    const row = event.newData as ItemListRow;
    const saved = await handleItemSave(row);
    if (!saved) {
      setEditingRows((prev) => ({ ...prev, [String(row.itemId)]: true }));
      return;
    }
    setEditingRows({});
  };

  const handleRowEditCancel = (event: { data: ItemListRow }) => {
    const row = event.data;
    if (row?.itemId < 0) {
      setItemList((prev) => prev.filter((entry) => entry.itemId !== row.itemId));
      if (selectedItem?.itemId === row.itemId) {
        setSelectedItem(null);
      }
    }
  };

  const handleRowEditChange = (event: { data: Record<string, boolean> }) => {
    setEditingRows(event.data ?? {});
  };

  const toggleRowExpansion = (row: ItemListRow) => {
    if (!row || row.itemId <= 0) return;
    setExpandedRows((prev: Record<string, boolean>) => {
      const key = String(row.itemId);
      const next = { ...(prev ?? {}) };
      if (next[key]) {
        delete next[key];
      } else {
        next[key] = true;
      }
      return next;
    });
  };

  const handleRowClick = (event: any) => {
    const target = event.originalEvent?.target as HTMLElement | null;
    if (
      target?.closest(
        "button, a, input, select, textarea, .p-row-editor-init, .p-row-editor-save, .p-row-editor-cancel, .p-column-resizer, .p-row-toggler"
      )
    ) {
      return;
    }
    toggleRowExpansion(event.data);
  };

  const renderSeasonEditor = (options: any) => (
    <Form.Select
      value={options.rowData.seasonId ?? 0}
      onChange={(e) => {
        const nextId = Number(e.target.value);
        const seasonName = resolveSeasonName(nextId);
        options.rowData.seasonId = nextId;
        options.rowData.seasonName = seasonName;
        options.editorCallback(nextId);
      }}
    >
      <option value={0}>Choose season</option>
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

  const renderItemNumber = (row: ItemListRow) => (
    <span className="item-style-value">{row.itemNumber}</span>
  );

  const renderPricePair = (row: ItemListRow) => (
    <div className="item-price-pair">
      <span className="text-muted">{formatPrice(row.wholesalePrice)}</span>
      <span className="item-price-strong">{formatPrice(row.costPrice)}</span>
    </div>
  );

  const renderPricePairEditor = (options: any) => (
    <div className="item-price-editor">
      <Form.Control
        type="number"
        step="0.01"
        value={options.rowData.wholesalePrice ?? ""}
        placeholder="Wholesale"
        onChange={(e) => {
          const raw = e.target.value;
          const nextValue = raw === "" ? null : Number(raw);
          options.rowData.wholesalePrice = nextValue;
          options.editorCallback(nextValue);
        }}
      />
      <Form.Control
        type="number"
        step="0.01"
        value={options.rowData.costPrice ?? ""}
        placeholder="Retail"
        onChange={(e) => {
          const raw = e.target.value;
          const nextValue = raw === "" ? null : Number(raw);
          options.rowData.costPrice = nextValue;
          options.editorCallback(options.rowData.wholesalePrice);
        }}
      />
    </div>
  );

  const renderProductionEditor = (options: any) => (
    <Form.Check
      type="checkbox"
      checked={Boolean(options.value)}
      onChange={(e) => options.editorCallback(e.target.checked)}
    />
  );

  const handleDownloadTemplate = () => {
    const headers = [
      "Season",
      "Style Number",
      "Description",
      "Wholesale",
      "Retail",
      ...Array.from({ length: MAX_COLOR_COLUMNS }, (_, i) => `Color ${i + 1}`),
    ];
    const worksheet = XLSX.utils.aoa_to_sheet([headers]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Item List");

    const now = new Date();
    const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
      now.getDate()
    ).padStart(2, "0")}`;
    XLSX.writeFile(workbook, `item_list_template_${timestamp}.xlsx`);
  };

  const handleDownloadItemList = () => {
    const headers = ["Season", "Style Number", "Description", "Active", "Wholesale", "Retail", "Colors"];
    const rows = filteredItems.map((row) => {
      const colors = getUniqueColors(row.colors ?? []).map((color) => color.colorName).join(", ");
      return {
        Season: row.seasonName ?? "",
        "Style Number": row.itemNumber ?? "",
        Description: row.description ?? "",
        Active: row.inProduction ? "Yes" : "No",
        Wholesale: row.wholesalePrice ?? "",
        Retail: row.costPrice ?? "",
        Colors: colors,
      };
    });
    const worksheet = XLSX.utils.json_to_sheet(rows, { header: headers });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Item List");

    const now = new Date();
    const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
      now.getDate()
    ).padStart(2, "0")}`;
    XLSX.writeFile(workbook, `item_list_${timestamp}.xlsx`);
  };

  const handleDownloadItemColors = () => {
    const headers = ["Season", "Style Number", ...Array.from({ length: MAX_COLOR_COLUMNS }, (_, i) => `Color ${i + 1}`)];
    const rows = filteredItems.map((row) => {
      const colors = getUniqueColors(row.colors ?? []).map((color) => color.colorName);
      const cells = [row.seasonName ?? "", row.itemNumber ?? ""];
      for (let i = 0; i < MAX_COLOR_COLUMNS; i += 1) {
        cells.push(colors[i] ?? "");
      }
      return cells;
    });
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Item Colors");

    const now = new Date();
    const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
      now.getDate()
    ).padStart(2, "0")}`;
    XLSX.writeFile(workbook, `item_colors_${timestamp}.xlsx`);
  };

  const parseOptionalNumber = (value: unknown) => {
    if (value === null || value === undefined) return null;
    if (typeof value === "number" && !Number.isNaN(value)) return value;
    const raw = String(value).trim();
    if (!raw) return null;
    const parsed = Number(raw);
    return Number.isNaN(parsed) ? null : parsed;
  };

  const buildItemListHtml = (rows: ItemListRow[]) => {
    const timestamp = new Date().toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

    const cards = rows
      .map((row) => {
        const colors = getUniqueColors(row.colors ?? []);
        const colorHtml = colors.length
          ? colors
              .map((color) => {
                const bg = color.hexValue ?? "#f8fafc";
                const text = color.hexValue ? getReadableTextColor(color.hexValue) : "#334155";
                return `<span class="color-pill" style="background:${bg};color:${text}">${color.colorName}</span>`;
              })
              .join("")
          : `<span class="color-empty">No colors</span>`;

        const wholesale = row.wholesalePrice == null ? "--" : formatPrice(row.wholesalePrice);
        const retail = row.costPrice == null ? "--" : formatPrice(row.costPrice);

        return `<div class="item-card">
  <div class="item-card-header">
    <div>
      <div class="item-season">${row.seasonName ?? ""}</div>
      <div class="item-style">${row.itemNumber ?? ""}</div>
      <div class="item-desc">${row.description ?? ""}</div>
    </div>
    <div class="item-meta">
      <div><span class="label">Active</span><span class="value">${row.inProduction ? "Yes" : "No"}</span></div>
      <div><span class="label">Wholesale</span><span class="value">${wholesale}</span></div>
      <div><span class="label">Retail</span><span class="value">${retail}</span></div>
    </div>
  </div>
  <div class="item-card-colors">${colorHtml}</div>
</div>`;
      })
      .join("");

    return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Item List</title>
    <style>
      * { box-sizing: border-box; }
      body { font-family: "Segoe UI", Arial, sans-serif; color: #111827; margin: 24px; }
      h1 { font-size: 20px; margin: 0 0 4px 0; }
      .timestamp { color: #6b7280; font-size: 12px; margin-bottom: 16px; }
      .item-grid { display: grid; grid-template-columns: 1fr; gap: 12px; }
      .item-card { border: 1px solid #e5e7eb; border-radius: 10px; padding: 12px 16px; }
      .item-card-header { display: flex; justify-content: space-between; gap: 12px; }
      .item-season { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.08em; }
      .item-style { font-size: 16px; font-weight: 700; margin-top: 4px; }
      .item-desc { font-size: 12px; color: #475569; margin-top: 4px; }
      .item-meta { min-width: 180px; display: grid; gap: 6px; font-size: 12px; color: #475569; }
      .item-meta .label { display: inline-block; width: 80px; color: #94a3b8; }
      .item-meta .value { font-weight: 600; color: #0f172a; }
      .item-card-colors { margin-top: 10px; display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; }
      .color-pill { padding: 4px 10px; border-radius: 6px; border: 1px solid #d1d5db; font-size: 11px; font-weight: 600; }
      .color-empty { color: #94a3b8; font-size: 12px; }
    </style>
  </head>
  <body>
    <h1>Item List</h1>
    <div class="timestamp">${timestamp}</div>
    <div class="item-grid">${cards}</div>
  </body>
</html>`;
  };

  const handlePrintItemList = () => {
    if (filteredItems.length === 0) {
      return;
    }
    const html = buildItemListHtml(filteredItems);
    printHtml(html);
  };

  const handleUploadFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setFileName("");
      setUploadRows([]);
      setParseErrors([]);
      setUploadSummary(null);
      setDuplicateRows([]);
      setShowDuplicateModal(false);
      return;
    }

    setFileName(file.name);
    setUploadRows([]);
    setParseErrors([]);
    setUploadSummary(null);
    setDuplicateRows([]);
    setShowDuplicateModal(false);

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
      const descriptionIndex = findHeaderIndex(["description", "desc"]);
      const wholesaleIndex = findHeaderIndex(["wholesale", "wholesale price", "wholesaleprice"]);
      const retailIndex = findHeaderIndex(["retail", "retail price", "retailprice"]);

      const colorIndexes = normalizedHeaders
        .map((header, index) => (header.startsWith("color") ? index : -1))
        .filter((index) => index >= 0)
        .slice(0, MAX_COLOR_COLUMNS);

      const missingRequired = [
        seasonIndex < 0 && !defaultSeasonId ? "Season" : null,
        itemIndex < 0 ? "Style Number" : null,
        descriptionIndex < 0 ? "Description" : null,
        colorIndexes.length === 0 ? "Color columns" : null,
      ].filter(Boolean);

      if (missingRequired.length > 0) {
        setParseErrors([`Missing required columns: ${missingRequired.join(", ")}.`]);
        return;
      }

      const defaultSeasonName = defaultSeasonId ? resolveSeasonName(defaultSeasonId) : "";

      const parsedRows: UploadItemRow[] = [];
      const errors: string[] = [];

      rawRows.slice(1).forEach((row, rowIndex) => {
        const values = row as Array<unknown>;
        const rowNumber = rowIndex + 2;

        const seasonName = seasonIndex >= 0 ? String(values[seasonIndex] ?? "").trim() : defaultSeasonName;
        const itemNumber = itemIndex >= 0 ? String(values[itemIndex] ?? "").trim() : "";
        const description = descriptionIndex >= 0 ? String(values[descriptionIndex] ?? "").trim() : "";
        const wholesalePrice = wholesaleIndex >= 0 ? parseOptionalNumber(values[wholesaleIndex]) : null;
        const retailPrice = retailIndex >= 0 ? parseOptionalNumber(values[retailIndex]) : null;

        const colorNames = colorIndexes
          .map((index) => String(values[index] ?? "").trim())
          .filter(Boolean);

        if (!seasonName && !itemNumber && colorNames.length === 0) {
          return;
        }

        if (!seasonName) {
          errors.push(`Row ${rowNumber}: Season is required.`);
        }
        if (!itemNumber) {
          errors.push(`Row ${rowNumber}: Style Number is required.`);
        }
        if (!description) {
          errors.push(`Row ${rowNumber}: Description is required.`);
        }
        if (colorNames.length === 0) {
          errors.push(`Row ${rowNumber}: At least one color is required.`);
        }

        const uniqueColors = Array.from(
          new Map(colorNames.map((name) => [normalizeName(name), name])).values()
        );

        parsedRows.push({
          rowNumber,
          seasonName,
          itemNumber,
          description,
          wholesalePrice,
          retailPrice,
          colorNames: uniqueColors,
        });
      });

      setUploadRows(parsedRows);
      setParseErrors(errors);
    } catch (err: any) {
      console.error(err);
      setParseErrors([`Failed to read file: ${err?.message ?? "Unknown error"}`]);
    }
  };

  const handleColorUploadFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setColorFileName("");
      setColorUploadRows([]);
      setColorParseErrors([]);
      setColorUploadSummary(null);
      return;
    }

    setColorFileName(file.name);
    setColorUploadRows([]);
    setColorParseErrors([]);
    setColorUploadSummary(null);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        setColorParseErrors(["No worksheet found in the file."]);
        return;
      }

      const worksheet = workbook.Sheets[sheetName];
      const rawRows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1, defval: "" });
      if (rawRows.length === 0) {
        setColorParseErrors(["The worksheet is empty."]);
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

      const colorIndexes = normalizedHeaders
        .map((header, index) => (header.startsWith("color") ? index : -1))
        .filter((index) => index >= 0)
        .slice(0, MAX_COLOR_COLUMNS);

      const missingRequired = [
        seasonIndex < 0 && !colorDefaultSeasonId ? "Season" : null,
        itemIndex < 0 ? "Style Number" : null,
        colorIndexes.length === 0 ? "Color columns" : null,
      ].filter(Boolean);

      if (missingRequired.length > 0) {
        setColorParseErrors([`Missing required columns: ${missingRequired.join(", ")}.`]);
        return;
      }

      const defaultSeasonName = colorDefaultSeasonId
        ? resolveSeasonName(colorDefaultSeasonId)
        : "";

      const parsedRows: UploadColorRow[] = [];
      const errors: string[] = [];

      rawRows.slice(1).forEach((row, rowIndex) => {
        const values = row as Array<unknown>;
        const rowNumber = rowIndex + 2;

        const seasonName = seasonIndex >= 0 ? String(values[seasonIndex] ?? "").trim() : defaultSeasonName;
        const itemNumber = itemIndex >= 0 ? String(values[itemIndex] ?? "").trim() : "";

        const colorNames = colorIndexes
          .map((index) => String(values[index] ?? "").trim())
          .filter(Boolean);

        if (!seasonName && !itemNumber && colorNames.length === 0) {
          return;
        }

        if (!seasonName) {
          errors.push(`Row ${rowNumber}: Season is required.`);
        }
        if (!itemNumber) {
          errors.push(`Row ${rowNumber}: Style Number is required.`);
        }
        if (colorNames.length === 0) {
          errors.push(`Row ${rowNumber}: At least one color is required.`);
        }

        const uniqueColors = Array.from(
          new Map(colorNames.map((name) => [normalizeName(name), name])).values()
        );

        parsedRows.push({
          rowNumber,
          seasonName,
          itemNumber,
          colorNames: uniqueColors,
        });
      });

      const seasonNameToId = new Map(
        seasons.map((season) => [normalizeName(season.seasonName), season.seasonId])
      );
      parsedRows.forEach((row) => {
        if (!row.seasonName || !row.itemNumber) {
          return;
        }
        const seasonId = seasonNameToId.get(normalizeName(row.seasonName));
        if (!seasonId) {
          errors.push(`Row ${row.rowNumber}: Season '${row.seasonName}' not found.`);
          return;
        }
        const itemKey = buildItemKey(seasonId, row.itemNumber);
        if (!itemKeyMap.has(itemKey)) {
          errors.push(`Row ${row.rowNumber}: Style '${row.itemNumber}' not found.`);
        }
      });

      setColorUploadRows(parsedRows);
      setColorParseErrors(errors);
    } catch (err: any) {
      console.error(err);
      setColorParseErrors([`Failed to read file: ${err?.message ?? "Unknown error"}`]);
    }
  };

  const handlePrepareUpload = async (options?: { ignoreDuplicatePrompt?: boolean; updateExisting?: boolean }) => {
    if (uploadRows.length === 0 || parseErrors.length > 0) {
      return;
    }

    const updateExisting = options?.updateExisting ?? updateExistingItems;
    const ignoreDuplicatePrompt = options?.ignoreDuplicatePrompt ?? false;

    const duplicates = uploadRows.filter((row) => {
      const season = seasons.find(
        (entry) => normalizeName(entry.seasonName) === normalizeName(row.seasonName)
      );
      if (!season) return false;
      const key = buildItemKey(season.seasonId, row.itemNumber);
      return itemKeyMap.has(key);
    });

    if (!ignoreDuplicatePrompt && duplicates.length > 0) {
      setDuplicateRows(duplicates);
      setShowDuplicateModal(true);
      return;
    }

    setUpdateExistingItems(updateExisting);
    const uniqueColors = Array.from(
      new Set(uploadRows.flatMap((row) => row.colorNames.map((name) => name.trim())).filter(Boolean))
    );

    const { nextMap, reviewItems } = buildColorResolutions(uniqueColors, colorResolutionMap);
    const baseMap = { ...colorResolutionMap, ...nextMap };

    if (reviewItems.length > 0) {
      setColorReviewItems(reviewItems);
      setReviewContext({ type: "upload", baseMap, rows: uploadRows });
      setShowColorReview(true);
      return;
    }

    setColorResolutionMap(baseMap);
    await executeUpload(uploadRows, baseMap, { updateExisting });
  };

  const executeUpload = async (
    rows: UploadItemRow[],
    resolutionMap: ColorResolutionMap,
    options: { updateExisting: boolean }
  ) => {
    setUploading(true);
    setUploadSummary(null);

    const summary: UploadSummary = {
      processedItems: 0,
      createdItems: 0,
      existingItems: 0,
      createdColors: 0,
      existingColors: 0,
      createdItemColors: 0,
      skippedItemColors: 0,
      errors: [],
    };

    const createdItemKeys = new Set<string>();
    const existingItemKeys = new Set<string>();
    const createdColorNames = new Set<string>();
    const existingColorNames = new Set<string>();
    const newColors: ColorOption[] = [];

    const createdColorIds = new Map<string, number>();
    const itemCache = new Map<string, ItemView>();
    const itemOrigin = new Map<string, "existing" | "created">();
    const itemColorCache = new Map<number, Set<number>>();

    try {
      const itemMap = new Map<
        string,
        UploadItemRow & { seasonId: number; colors: Set<string> }
      >();

      rows.forEach((row) => {
        const season = seasons.find(
          (entry) => normalizeName(entry.seasonName) === normalizeName(row.seasonName)
        );
        if (!season) {
          summary.errors.push(`Row ${row.rowNumber}: Season '${row.seasonName}' not found.`);
          return;
        }
        const itemKey = `${season.seasonId}|${normalizeName(row.itemNumber)}`;
        if (!itemMap.has(itemKey)) {
          itemMap.set(itemKey, {
            ...row,
            seasonId: season.seasonId,
            colors: new Set<string>(),
          });
        }
        const entry = itemMap.get(itemKey);
        if (!entry) return;
        if (entry.wholesalePrice == null && row.wholesalePrice != null) {
          entry.wholesalePrice = row.wholesalePrice;
        }
        if (entry.retailPrice == null && row.retailPrice != null) {
          entry.retailPrice = row.retailPrice;
        }
        row.colorNames.forEach((color) => entry.colors.add(color));
      });

      for (const entry of itemMap.values()) {
        const itemKey = `${entry.seasonId}|${normalizeName(entry.itemNumber)}`;
        let item = itemCache.get(itemKey);
        let origin = itemOrigin.get(itemKey) ?? "existing";

        if (!item) {
          const matches = await CatalogService.getItems({
            itemNumber: entry.itemNumber,
            seasonName: entry.seasonName,
          });
          const normalizedItem = normalizeName(entry.itemNumber);
          item = matches.find(
            (match) =>
              normalizeName(match.itemNumber) === normalizedItem &&
              normalizeName(match.seasonName ?? "") === normalizeName(entry.seasonName)
          );
          origin = item ? "existing" : origin;
        }

        if (!item) {
          await CatalogService.addOrUpdateItem({
            itemNumber: entry.itemNumber.trim(),
            description: entry.description.trim(),
            seasonId: entry.seasonId,
            wholesalePrice: entry.wholesalePrice ?? undefined,
            costPrice: entry.retailPrice ?? undefined,
            inProduction: false,
          });
          const createdMatches = await CatalogService.getItems({
            itemNumber: entry.itemNumber,
            seasonName: entry.seasonName,
          });
          item = createdMatches.find(
            (match) =>
              normalizeName(match.itemNumber) === normalizeName(entry.itemNumber) &&
              normalizeName(match.seasonName ?? "") === normalizeName(entry.seasonName)
          );
          origin = item ? "created" : origin;
        }

        if (!item) {
          summary.errors.push(`Style '${entry.itemNumber}' could not be created.`);
          continue;
        }

        itemCache.set(itemKey, item);
        if (origin) {
          itemOrigin.set(itemKey, origin);
        }
        if (origin === "existing" && options.updateExisting) {
          await CatalogService.addOrUpdateItem({
            itemId: item.itemId,
            itemNumber: entry.itemNumber.trim(),
            description: entry.description.trim(),
            seasonId: entry.seasonId,
            wholesalePrice: entry.wholesalePrice ?? undefined,
            costPrice: entry.retailPrice ?? undefined,
            inProduction: item.inProduction ?? false,
          });
        }
        summary.processedItems += 1;
        if (!existingItemKeys.has(itemKey) && !createdItemKeys.has(itemKey)) {
          if (origin === "created") {
            createdItemKeys.add(itemKey);
          } else {
            existingItemKeys.add(itemKey);
          }
        }

        const existingColorIds =
          itemColorCache.get(item.itemId) ??
          new Set((await CatalogService.getItemColors({ itemId: item.itemId })).map((sc) => sc.colorId));
        itemColorCache.set(item.itemId, existingColorIds);

        for (const rawColor of entry.colors) {
          const normalized = normalizeName(rawColor);
          const resolution = resolutionMap[normalized];
          if (!resolution) {
            summary.errors.push(`Style '${entry.itemNumber}': Color '${rawColor}' has no resolution.`);
            continue;
          }

          let colorId = resolution.colorId;
          const resolvedName = resolution.resolvedName;

          if (!colorId) {
            const cached = createdColorIds.get(normalized);
            if (cached) {
              colorId = cached;
            }
          }

          if (!colorId && resolution.action === "existing") {
            const exact = normalizedColors.find((match) => match.normalized === normalized);
            colorId = exact?.colorId;
          }

          if (!colorId) {
            await CatalogService.addOrUpdateColor({
              colorName: resolvedName,
              seasonId: entry.seasonId,
            });
            const matches = await CatalogService.getColors({ colorName: resolvedName });
            const match = matches.find((entry) => normalizeName(entry.colorName) === normalized);
            if (!match) {
              summary.errors.push(`Color '${resolvedName}' could not be created.`);
              continue;
            }
            colorId = match.colorId;
            createdColorIds.set(normalized, colorId);
            newColors.push(match);
            createdColorNames.add(normalized);
          } else if (!createdColorNames.has(normalized)) {
            existingColorNames.add(normalized);
          }

          if (existingColorIds.has(colorId)) {
            summary.skippedItemColors += 1;
            continue;
          }

          await CatalogService.addOrUpdateItemColor({
            itemId: item.itemId,
            colorId,
          });
          existingColorIds.add(colorId);
          summary.createdItemColors += 1;

        }
      }

      summary.createdItems = createdItemKeys.size;
      summary.existingItems = existingItemKeys.size;
      summary.createdColors = createdColorNames.size;
      summary.existingColors = existingColorNames.size;

      if (newColors.length) {
        setColors((prev) => {
          const next = [...prev];
          newColors.forEach((color) => {
            const index = next.findIndex((item) => item.colorId === color.colorId);
            if (index >= 0) {
              next[index] = color;
            } else {
              next.push(color);
            }
          });
          return next;
        });
      }
      setUploadSummary(summary);
      await loadItemList();
    } catch (err: any) {
      console.error(err);
      summary.errors.push(err?.message ?? "Upload failed.");
      setUploadSummary(summary);
    } finally {
      setUploading(false);
    }
  };

  const handlePrepareColorUpload = async () => {
    if (colorUploadRows.length === 0 || colorParseErrors.length > 0) {
      return;
    }

    const uniqueColors = Array.from(
      new Set(colorUploadRows.flatMap((row) => row.colorNames.map((name) => name.trim())).filter(Boolean))
    );

    const { nextMap, reviewItems } = buildColorResolutions(uniqueColors, colorResolutionMap);
    const baseMap = { ...colorResolutionMap, ...nextMap };

    if (reviewItems.length > 0) {
      setColorReviewItems(reviewItems);
      setReviewContext({ type: "colorUpload", baseMap, rows: colorUploadRows });
      setShowColorReview(true);
      return;
    }

    setColorResolutionMap(baseMap);
    await executeColorUpload(colorUploadRows, baseMap);
  };

  const executeColorUpload = async (rows: UploadColorRow[], resolutionMap: ColorResolutionMap) => {
    setColorUploading(true);
    setColorUploadSummary(null);

    const summary: ColorUploadSummary = {
      processedItems: 0,
      updatedItems: 0,
      createdColors: 0,
      existingColors: 0,
      createdItemColors: 0,
      skippedItemColors: 0,
      errors: [],
    };

    const createdColorIds = new Map<string, number>();
    const createdColorNames = new Set<string>();
    const existingColorNames = new Set<string>();
    const itemColorCache = new Map<number, Set<number>>();
    const newColors: ColorOption[] = [];

    const seasonNameToId = new Map(
      seasons.map((season) => [normalizeName(season.seasonName), season.seasonId])
    );

    try {
      for (const entry of rows) {
        const seasonId = seasonNameToId.get(normalizeName(entry.seasonName));
        if (!seasonId) {
          summary.errors.push(`Row ${entry.rowNumber}: Season '${entry.seasonName}' not found.`);
          continue;
        }

        const itemKey = buildItemKey(seasonId, entry.itemNumber);
        const item = itemKeyMap.get(itemKey);
        if (!item) {
          summary.errors.push(`Row ${entry.rowNumber}: Style '${entry.itemNumber}' not found.`);
          continue;
        }

        summary.processedItems += 1;
        summary.updatedItems += 1;

        const existingColorIds =
          itemColorCache.get(item.itemId) ??
          new Set((await CatalogService.getItemColors({ itemId: item.itemId })).map((sc) => sc.colorId));
        itemColorCache.set(item.itemId, existingColorIds);

        for (const rawColor of entry.colorNames) {
          const normalized = normalizeName(rawColor);
          const resolution = resolutionMap[normalized];
          if (!resolution) {
            summary.errors.push(`Style '${entry.itemNumber}': Color '${rawColor}' has no resolution.`);
            continue;
          }

          let colorId = resolution.colorId;
          const resolvedName = resolution.resolvedName;

          if (!colorId) {
            const cached = createdColorIds.get(normalized);
            if (cached) {
              colorId = cached;
            }
          }

          if (!colorId && resolution.action === "existing") {
            const exact = normalizedColors.find((match) => match.normalized === normalized);
            colorId = exact?.colorId;
          }

          if (!colorId) {
            await CatalogService.addOrUpdateColor({
              colorName: resolvedName,
              seasonId,
            });
            const matches = await CatalogService.getColors({ colorName: resolvedName });
            const match = matches.find((entry) => normalizeName(entry.colorName) === normalized);
            if (!match) {
              summary.errors.push(`Color '${resolvedName}' could not be created.`);
              continue;
            }
            colorId = match.colorId;
            createdColorIds.set(normalized, colorId);
            newColors.push(match);
            createdColorNames.add(normalized);
          } else if (!createdColorNames.has(normalized)) {
            existingColorNames.add(normalized);
          }

          if (existingColorIds.has(colorId)) {
            summary.skippedItemColors += 1;
            continue;
          }

          await CatalogService.addOrUpdateItemColor({
            itemId: item.itemId,
            colorId,
          });
          existingColorIds.add(colorId);
          summary.createdItemColors += 1;
        }
      }

      summary.createdColors = createdColorNames.size;
      summary.existingColors = existingColorNames.size;

      if (newColors.length) {
        setColors((prev) => {
          const next = [...prev];
          newColors.forEach((color) => {
            const index = next.findIndex((item) => item.colorId === color.colorId);
            if (index >= 0) {
              next[index] = color;
            } else {
              next.push(color);
            }
          });
          return next;
        });
      }

      setColorUploadSummary(summary);
      await loadItemList();
    } catch (err: any) {
      console.error(err);
      summary.errors.push(err?.message ?? "Upload failed.");
      setColorUploadSummary(summary);
    } finally {
      setColorUploading(false);
    }
  };
  const handleReviewConfirm = () => {
    if (!reviewContext) return;

    const resolvedSelections: ColorResolutionMap = {};
    colorReviewItems.forEach((item) => {
      if (item.choice === "new") {
        resolvedSelections[item.normalized] = {
          normalized: item.normalized,
          inputName: item.inputName,
          action: "new",
          resolvedName: item.inputName,
        };
      } else {
        const match = item.suggestions.find((suggestion) => suggestion.colorId === item.choice);
        if (!match) return;
        resolvedSelections[item.normalized] = {
          normalized: item.normalized,
          inputName: item.inputName,
          action: "existing",
          colorId: match.colorId,
          resolvedName: match.colorName,
        };
      }
    });

    const mergedMap = { ...reviewContext.baseMap, ...resolvedSelections };
    setColorResolutionMap(mergedMap);
    setShowColorReview(false);
    setReviewContext(null);

    if (reviewContext.type === "manual") {
      const resolution = mergedMap[reviewContext.normalized];
      if (resolution) {
        addPendingColorFromResolution(resolution, {
          seasonId: reviewContext.seasonId ?? null,
          pantoneColor: reviewContext.pantoneColor ?? null,
          hexValue: reviewContext.hexValue ?? null,
        });
      }
      return;
    }

    if (reviewContext.type === "colorUpload") {
      executeColorUpload(reviewContext.rows, mergedMap);
      return;
    }

    executeUpload(reviewContext.rows, mergedMap, { updateExisting: updateExistingItems });
  };

  const handleReviewClose = () => {
    setShowColorReview(false);
    setReviewContext(null);
  };

  const getUniqueColors = (colorsForItem: ItemColorView[]) => {
    const map = new Map<number, ItemColorView>();
    colorsForItem.forEach((color) => {
      if (!map.has(color.colorId)) {
        map.set(color.colorId, color);
      }
    });
    return Array.from(map.values());
  };

  const renderInProduction = (row: ItemListRow) => (
    <Form.Check
      type="checkbox"
      className="item-production-check"
      checked={row.inProduction}
      readOnly
      disabled
    />
  );

  const renderColorSummary = (row: ItemListRow) => {
    if (row.itemId <= 0) {
      return <span className="text-muted">Save style first</span>;
    }
    const colorsForItem = getUniqueColors(row.colors ?? []);
    const preview = colorsForItem.slice(0, 4);
    const remaining = colorsForItem.length - preview.length;
    const isEditing = Boolean(editingRows[String(row.itemId)]);

    if (!colorsForItem.length) {
      return isEditing ? (
        <button type="button" className="item-color-edit-btn" onClick={() => openColorModal(row)}>
          <span className="text-muted">Add colors</span>
        </button>
      ) : (
        <span className="text-muted">No colors</span>
      );
    }

    const summary = (
      <div className="item-color-summary">
        {preview.map((color) => (
          <span
            key={`${row.itemId}-${color.colorId}`}
            className={`item-color-dot${color.hexValue ? " has-hex" : ""}`}
            style={color.hexValue ? { backgroundColor: color.hexValue } : undefined}
            title={color.colorName}
          />
        ))}
        {remaining > 0 && <span className="item-color-count">+{remaining}</span>}
      </div>
    );

    return isEditing ? (
      <button type="button" className="item-color-edit-btn" onClick={() => openColorModal(row)}>
        {summary}
        <span className="item-color-edit-text">Edit</span>
      </button>
    ) : (
      summary
    );
  };

  const renderExpandedRow = (row: ItemListRow) => {
    if (row.itemId <= 0) {
      return (
        <div className="item-row-expanded">
          <span className="text-muted">Save the style to add colors.</span>
        </div>
      );
    }
    const colorsForItem = getUniqueColors(row.colors ?? []);
    return (
      <div className="item-row-expanded">
        {colorsForItem.length === 0 ? (
          <span className="text-muted">No colors linked yet.</span>
        ) : (
          <div className="item-color-rect-list">
            {colorsForItem.map((color) => (
              <span
                key={`${row.itemId}-rect-${color.colorId}`}
                className={`item-color-rect${color.hexValue ? " has-hex" : ""}`}
                style={
                  color.hexValue
                    ? { backgroundColor: color.hexValue, color: getReadableTextColor(color.hexValue) }
                    : undefined
                }
              >
                {color.colorName}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  };

  const uploadErrors = uploadSummary?.errors ?? [];
  const hasUploadErrors = uploadErrors.length > 0;
  const colorUploadErrors = colorUploadSummary?.errors ?? [];
  const hasColorUploadErrors = colorUploadErrors.length > 0;

  return (
    <CatalogPageLayout
      title="Item List"
      subtitle={`Seasons: ${seasonSummary}`}
      className="catalog-page--wide mt-3"
      actions={[
        {
          label: "Download Item List",
          onClick: handleDownloadItemList,
          variant: "primary",
          icon: "pi pi-download",
          className: "portal-btn-download",
        },
        {
          label: "Print Item List",
          onClick: handlePrintItemList,
          variant: "primary",
          icon: "pi pi-print",
          className: "portal-btn-print",
        },
      ]}
    >
      <Toast ref={toastRef} position="top-right" />

      {lookupError && <Alert variant="danger">{lookupError}</Alert>}

      <div className="items-colors-layout">
        <Card className="portal-content-card items-colors-main">
          <Card.Body>
            <Row className="items-actions-row align-items-center gy-2">
              <Col className="d-flex flex-wrap gap-2 justify-content-md-end">
                <Button
                  type="button"
                  className="portal-btn portal-btn-outline"
                  onClick={handleAddItemRow}
                  disabled={loadingLookups}
                >
                  Add Item
                </Button>
                <Button
                  type="button"
                  className="portal-btn portal-btn-outline"
                  onClick={loadItemList}
                  disabled={itemListLoading}
                >
                  {itemListLoading ? "Refreshing..." : "Refresh list"}
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
              <Col md={3}>
                <Form.Label>Active</Form.Label>
                <Form.Select
                  value={activeFilter}
                  onChange={(e) => setActiveFilter(e.target.value)}
                >
                  <option value="">All</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </Form.Select>
              </Col>
              <Col md="auto" className="items-filter-actions ms-md-auto">
                <div className="d-flex gap-2 justify-content-md-end">
                  <Button
                    type="button"
                    className="portal-btn portal-btn-outline portal-icon-btn"
                    onClick={handleExpandAll}
                    aria-label="Expand all"
                    title="Expand all"
                  >
                    <i className="pi pi-plus" aria-hidden="true" />
                  </Button>
                  <Button
                    type="button"
                    className="portal-btn portal-btn-outline portal-icon-btn"
                    onClick={handleCollapseAll}
                    aria-label="Collapse all"
                    title="Collapse all"
                  >
                    <i className="pi pi-minus" aria-hidden="true" />
                  </Button>
                </div>
              </Col>
            </Row>
            <div className="items-table-wrapper mt-3">
              <DataTable
                value={filteredItems}
                dataKey="itemId"
                loading={itemListLoading}
                rowHover
                selectionMode="single"
                selection={selectedItem}
                onSelectionChange={(e) => setSelectedItem(e.value)}
                onRowClick={handleRowClick}
                editMode="row"
                editingRows={editingRows}
                onRowEditChange={handleRowEditChange}
                onRowEditComplete={handleRowEditComplete}
                onRowEditCancel={handleRowEditCancel}
                expandedRows={expandedRows}
                onRowToggle={(e) => setExpandedRows(e.data ?? {})}
                rowExpansionTemplate={renderExpandedRow}
                sortField="itemNumber"
                sortOrder={1}
                sortMode="single"
                className="p-datatable-gridlines items-colors-table"
              >
                <Column expander style={{ width: "2.25rem" }} />
                <Column
                  field="inProduction"
                  header="Active"
                  body={renderInProduction}
                  editor={renderProductionEditor}
                  className="col-active"
                  style={{ width: "4.5rem" }}
                />
                <Column
                  field="seasonId"
                  header="Season"
                  body={(row: ItemListRow) => row.seasonName}
                  editor={renderSeasonEditor}
                  className="col-season"
                />
                <Column
                  field="itemNumber"
                  header="Style Number"
                  body={renderItemNumber}
                  editor={renderTextEditor}
                  className="col-style"
                  sortable
                />
                <Column field="description" header="Description" editor={renderTextEditor} className="col-description" />
                <Column header="Colors" body={renderColorSummary} className="col-color" />
                <Column
                  field="wholesalePrice"
                  header="Wholesale / Retail"
                  body={renderPricePair}
                  editor={renderPricePairEditor}
                  className="col-price"
                />
                <Column rowEditor header="Save" headerStyle={{ width: "6rem" }} bodyStyle={{ textAlign: "center" }} />
              </DataTable>
            </div>
          </Card.Body>
        </Card>

        <Card className="portal-content-card items-upload-card">
          <Card.Body>
            <div className="items-upload-header">
              <h2 className="mb-1">Upload Center</h2>
              <p className="text-muted mb-0">Upload new items or update item colors.</p>
            </div>

            <div className="upload-section mt-3">
              <div className="upload-section-header">
                <div>
                  <h4 className="mb-1">Upload new items</h4>
                  <p className="text-muted mb-0">Add new items and colors to the list.</p>
                </div>
                <Button
                  type="button"
                  className="portal-btn portal-btn-download portal-page-action"
                  onClick={handleDownloadTemplate}
                >
                  <i className="pi pi-download portal-page-action-icon" aria-hidden="true" />
                  Download Template
                </Button>
              </div>
              <Row className="gy-3 mt-1">
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

              {parseErrors.length > 0 && (
                <Alert variant="danger" className="mt-3">
                  <strong>Fix these issues before uploading:</strong>
                  <ul className="mb-0">
                    {parseErrors.slice(0, 6).map((error) => (
                      <li key={error}>{error}</li>
                    ))}
                  </ul>
                  {parseErrors.length > 6 && (
                    <div className="mt-2 text-muted">{parseErrors.length - 6} more issue(s) not shown.</div>
                  )}
                </Alert>
              )}

              {uploadSummary && !hasUploadErrors && (
                <Alert variant="success" className="mt-3">
                  Upload successful. Processed {uploadSummary.processedItems} style(s). Created{" "}
                  {uploadSummary.createdItems} new style(s), {uploadSummary.createdColors} new color(s), and{" "}
                  {uploadSummary.createdItemColors} style-color link(s).
                </Alert>
              )}

              {uploadSummary && hasUploadErrors && (
                <Alert variant="danger" className="mt-3">
                  <strong>Upload completed with issues:</strong>
                  <ul className="mb-0">
                    {uploadErrors.slice(0, 6).map((error) => (
                      <li key={error}>{error}</li>
                    ))}
                  </ul>
                  {uploadErrors.length > 6 && (
                    <div className="mt-2 text-muted">
                      {uploadErrors.length - 6} more issue(s) not shown.
                    </div>
                  )}
                </Alert>
              )}

              {uploadRows.length > 0 && (
                <div className="text-muted mt-2">Rows ready to upload: {uploadRows.length}</div>
              )}

              <div className="text-end mt-3">
                <Button
                  type="button"
                  className="portal-btn portal-btn-upload portal-page-action"
                  onClick={handlePrepareUpload}
                  disabled={uploadRows.length === 0 || parseErrors.length > 0 || uploading}
                >
                  {uploading ? (
                    "Uploading..."
                  ) : (
                    <>
                      <i className="pi pi-upload portal-page-action-icon" aria-hidden="true" />
                      Upload new items
                    </>
                  )}
                </Button>
              </div>
            </div>

            <hr className="my-4" />

            <div className="upload-section">
              <div className="upload-section-header">
                <div>
                  <h6 className="mb-1">Upload item colors</h6>
                  <p className="text-muted mb-0">Add or update colors for existing styles only.</p>
                </div>
                <Button
                  type="button"
                  className="portal-btn portal-btn-download portal-page-action"
                  onClick={handleDownloadItemColors}
                >
                  <i className="pi pi-download portal-page-action-icon" aria-hidden="true" />
                  Download Item Colors
                </Button>
              </div>
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

              {colorParseErrors.length > 0 && (
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
                </Alert>
              )}

              {colorUploadSummary && !hasColorUploadErrors && (
                <Alert variant="success" className="mt-3">
                  Upload successful. Processed {colorUploadSummary.processedItems} style(s). Added{" "}
                  {colorUploadSummary.createdItemColors} new style-color link(s) and{" "}
                  {colorUploadSummary.createdColors} new color(s).
                </Alert>
              )}

              {colorUploadSummary && hasColorUploadErrors && (
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
                </Alert>
              )}

              {colorUploadRows.length > 0 && (
                <div className="text-muted mt-2">Rows ready to upload: {colorUploadRows.length}</div>
              )}

              <div className="text-end mt-3">
                <Button
                  type="button"
                  className="portal-btn portal-btn-upload portal-page-action"
                  onClick={handlePrepareColorUpload}
                  disabled={colorUploadRows.length === 0 || colorParseErrors.length > 0 || colorUploading}
                >
                  {colorUploading ? (
                    "Uploading..."
                  ) : (
                    <>
                      <i className="pi pi-upload portal-page-action-icon" aria-hidden="true" />
                      Upload item colors
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card.Body>
        </Card>
      </div>

      <ItemsColorsColorModal
        show={showColorModal}
        onClose={closeColorModal}
        onSave={handleSaveColors}
        onAddColor={handleAddColor}
        onRemovePending={(normalized) =>
          setPendingColors((prev) => prev.filter((item) => item.normalized !== normalized))
        }
        activeItemLabel={
          activeColorItem ? `Edit colors for ${activeColorItem.itemNumber}` : "Edit colors"
        }
        isLocked={!activeColorItem || activeColorItem.itemId <= 0}
        pendingColors={pendingColors}
        currentColors={activeColorItem ? getUniqueColors(activeColorItem.colors ?? []) : []}
        colorInput={colorInput}
        colorPantoneInput={colorPantoneInput}
        colorHexInput={colorHexInput}
        onColorInputChange={setColorInput}
        onPantoneChange={setColorPantoneInput}
        onHexChange={setColorHexInput}
        saving={savingColors}
        getReadableTextColor={getReadableTextColor}
      />

      <Modal show={showDuplicateModal} onHide={() => setShowDuplicateModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Existing styles found</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-2">
            Some styles in this upload already exist. Do you want to update their details with the uploaded data?
          </p>
          <ul className="mb-0">
            {duplicateRows.slice(0, 6).map((row) => (
              <li key={`${row.seasonName}-${row.itemNumber}-${row.rowNumber}`}>
                {row.seasonName} — {row.itemNumber}
              </li>
            ))}
          </ul>
          {duplicateRows.length > 6 && (
            <div className="text-muted mt-2">
              {duplicateRows.length - 6} more style(s) not shown.
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            type="button"
            className="portal-btn portal-btn-outline"
            onClick={() => setShowDuplicateModal(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="portal-btn portal-btn-outline"
            onClick={() => {
              setShowDuplicateModal(false);
              handlePrepareUpload({ ignoreDuplicatePrompt: true, updateExisting: false });
            }}
          >
            Keep existing details
          </Button>
          <Button
            type="button"
            className="portal-btn scan-action-save"
            onClick={() => {
              setShowDuplicateModal(false);
              handlePrepareUpload({ ignoreDuplicatePrompt: true, updateExisting: true });
            }}
          >
            Update details
          </Button>
        </Modal.Footer>
      </Modal>

      <ItemsColorsColorReviewModal
        show={showColorReview}
        items={colorReviewItems}
        onChoiceChange={(normalized, choice) =>
          setColorReviewItems((prev) =>
            prev.map((entry) =>
              entry.normalized === normalized ? { ...entry, choice } : entry
            )
          )
        }
        onClose={handleReviewClose}
        onConfirm={handleReviewConfirm}
      />
    </CatalogPageLayout>
  );
}







