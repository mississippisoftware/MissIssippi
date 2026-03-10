import { type KeyboardEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Button, Card, Col, Form, Modal, Row } from "react-bootstrap";
import {
  DataTable,
  type DataTableRowEditCompleteEvent,
  type DataTableRowClickEvent,
  type DataTableSortEvent,
  type DataTableSortMeta,
} from "primereact/datatable";
import { Column } from "primereact/column";
import { Toast } from "primereact/toast";
import CatalogPageLayout from "../components/CatalogPageLayout";
import UploadModal from "../components/UploadModal";
import {
  DEFAULT_COLOR_LIST_SORT_META,
  buildColorKey,
  getRowNumberFromError,
  isDuplicateUploadError,
  isHexValid,
  normalizeForSimilarity,
  normalizeHex,
} from "./colorData";
import CatalogService, { type ColorOption } from "../service/CatalogService";
import { getPrimaryColorName, isSimilarName, normalizeName } from "../items/itemsColorsUtils";
import {
  appendSheet,
  createWorkbook,
  saveWorkbook,
  sheetFromAoa,
  sheetFromJson,
} from "../utils/xlsxUtils";
import { findHeaderIndex, normalizeHeaders } from "../utils/xlsxParse";
import { filterSeasonActiveRows } from "../utils/filterSeasonActiveRows";
import { printColorList } from "../utils/printCatalogLists";
import { shouldSubmitOnEnter } from "../utils/modalKeyHandlers";
import { useToastNotifier } from "../hooks/useToastNotifier";
import { useCatalogLookups } from "../hooks/useCatalogLookups";
import { useXlsxUpload } from "../hooks/useXlsxUpload";
import type { EditorOptions } from "../types/editor";

type SeasonOption = { seasonId: number; seasonName: string; active?: boolean | null };

type ColorListRow = ColorOption & { seasonName?: string | null };

type UploadColorRow = {
  rowNumber: number;
  seasonName: string;
  colorName: string;
  collection?: string;
  rawCollection?: string;
  pantoneColor?: string;
  hexValue?: string;
};

type UploadSummary = {
  processed: number;
  errors: string[];
};

type UploadParseContext = {
  seasonIndex: number;
  colorIndex: number;
  collectionIndex: number;
  pantoneIndex: number;
  hexIndex: number;
  defaultSeasonName: string;
};

type SimilarColorCandidate = {
  colorId: number;
  colorName: string;
  seasonId: number | null;
  seasonName: string;
  collection?: string | null;
  exact: boolean;
  sameSeason: boolean;
};

export default function ColorList() {
  const { toastRef, notify, getErrorMessage } = useToastNotifier();

  const mapColors = useCallback((colorData: ColorOption[], seasonData: SeasonOption[]) => {
    const localSeasonMap = new Map<number, string>();
    seasonData.forEach((season) => {
      localSeasonMap.set(season.seasonId, season.seasonName);
    });
    return colorData.map((color) => ({
      ...color,
      seasonName: color.seasonId ? localSeasonMap.get(color.seasonId) ?? "" : "",
    }));
  }, []);

  const {
    seasons,
    colors,
    setColors,
    collections,
    setCollections,
    loading: loadingLookups,
    error: lookupError,
  } = useCatalogLookups<ColorListRow>({ mapColors, errorMessage: "Failed to load colors." });

  const [editingRows, setEditingRows] = useState<Record<string, boolean>>({});
  const [tempColorId, setTempColorId] = useState(-1);
  const [listSearch, setListSearch] = useState("");
  const [colorListLoading, setColorListLoading] = useState(false);
  const [multiSortMeta, setMultiSortMeta] = useState<DataTableSortMeta[]>(DEFAULT_COLOR_LIST_SORT_META);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [collectionInput, setCollectionInput] = useState("");
  const [collectionSaving, setCollectionSaving] = useState(false);
  const [colorToDelete, setColorToDelete] = useState<ColorListRow | null>(null);
  const [deletingColorId, setDeletingColorId] = useState<number | null>(null);
  const [colorForm, setColorForm] = useState<ColorListRow | null>(null);
  const [colorSaving, setColorSaving] = useState(false);
  const [migrateTargetId, setMigrateTargetId] = useState("");
  const [showMigrateConfirm, setShowMigrateConfirm] = useState(false);
  const [migratingColor, setMigratingColor] = useState(false);
  const [defaultSeasonId, setDefaultSeasonId] = useState("");
  const [dismissUploadParseErrors, setDismissUploadParseErrors] = useState(false);
  const [dismissUploadErrors, setDismissUploadErrors] = useState(false);
  const [showUploadCollectionAdd, setShowUploadCollectionAdd] = useState(false);
  const [uploadCollectionInput, setUploadCollectionInput] = useState("");
  const [uploadCollectionSaving, setUploadCollectionSaving] = useState(false);
  const [uploadCollectionError, setUploadCollectionError] = useState<string | null>(null);
  const [uploadCollectionSuccess, setUploadCollectionSuccess] = useState<string | null>(null);
  const [dismissUploadCollectionError, setDismissUploadCollectionError] = useState(false);

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

  const activeSeasonIds = useMemo(
    () => new Set(seasons.filter((season) => season.active !== false).map((season) => season.seasonId)),
    [seasons]
  );

  const normalizedColorMap = useMemo(() => {
    const map = new Map<string, ColorListRow>();
    colors.forEach((color) => {
      map.set(buildColorKey(color.colorName, color.seasonId ?? null), color);
    });
    return map;
  }, [colors]);

  const normalizedCollectionMap = useMemo(() => {
    const map = new Map<string, string>();
    collections.forEach((collection) => {
      map.set(normalizeName(collection.collectionName), collection.collectionName);
    });
    return map;
  }, [collections]);

  const collectionOptions = useMemo(
    () => [...collections].sort((a, b) => a.collectionName.localeCompare(b.collectionName)),
    [collections]
  );

  const getSimilarColorCandidates = useCallback(
    (params: { colorName: string; seasonId?: number | null; excludeColorId?: number | null }) => {
      const inputNormalized = normalizeForSimilarity(params.colorName);
      if (inputNormalized.length < 2) {
        return [] as SimilarColorCandidate[];
      }
      const matches: SimilarColorCandidate[] = [];

      colors.forEach((color) => {
        if (color.colorId === (params.excludeColorId ?? null)) {
          return;
        }
        const candidateNormalized = normalizeForSimilarity(color.colorName ?? "");
        if (!candidateNormalized) {
          return;
        }
        const exact = candidateNormalized === inputNormalized;
        const similar = exact || isSimilarName(inputNormalized, candidateNormalized);
        if (!similar) {
          return;
        }
        matches.push({
          colorId: color.colorId,
          colorName: color.colorName,
          seasonId: color.seasonId ?? null,
          seasonName: color.seasonName ?? seasonMap.get(color.seasonId ?? 0) ?? "",
          collection: color.collection ?? null,
          exact,
          sameSeason: (color.seasonId ?? null) === (params.seasonId ?? null),
        });
      });

      return matches
        .sort((a, b) => {
          if (a.exact !== b.exact) return a.exact ? -1 : 1;
          if (a.sameSeason !== b.sameSeason) return a.sameSeason ? -1 : 1;
          const byName = a.colorName.localeCompare(b.colorName);
          if (byName !== 0) return byName;
          return a.seasonName.localeCompare(b.seasonName);
        })
        .slice(0, 6);
    },
    [colors, seasonMap]
  );

  const renderSimilarColorHint = (params: {
    colorName: string;
    seasonId?: number | null;
    excludeColorId?: number | null;
    className?: string;
  }) => {
    const matches = getSimilarColorCandidates(params);
    if (matches.length === 0) {
      return null;
    }

    return (
      <div className={params.className ?? "color-similar-hint"}>
        <div className="color-similar-hint-title">Similar existing colors:</div>
        <div className="color-similar-hint-list">
          {matches.map((match) => (
            <span
              key={`${match.colorId}-${match.colorName}-${match.seasonId ?? ""}`}
              className={`color-similar-chip${match.exact ? " is-exact" : ""}`}
              title={match.exact ? "Exact normalized match" : "Similar name"}
            >
              {match.colorName}
              {match.collection ? ` | ${match.collection}` : ""}
              {match.seasonName ? ` (${match.seasonName})` : ""}
              {match.exact ? " [Exact]" : ""}
            </span>
          ))}
        </div>
      </div>
    );
  };

  const buildUploadContext = useCallback(
    (headerRow: unknown[]) => {
      const normalizedHeaders = normalizeHeaders(headerRow);

      const seasonIndex = findHeaderIndex(normalizedHeaders, ["season", "season name", "seasonname"]);
      const colorIndex = findHeaderIndex(normalizedHeaders, ["color", "color name", "colorname"]);
      const collectionIndex = findHeaderIndex(normalizedHeaders, ["collection", "collection name"]);
      const pantoneIndex = findHeaderIndex(normalizedHeaders, ["pantone", "pantone color", "pantonecolor"]);
      const hexIndex = findHeaderIndex(normalizedHeaders, ["hex", "hex value", "hexvalue", "hex#"]);

      const missingRequired = [
        colorIndex < 0 ? "Color" : null,
        seasonIndex < 0 && !defaultSeasonId ? "Season" : null,
      ].filter(Boolean);

      const defaultSeasonName = defaultSeasonId
        ? seasons.find((season) => String(season.seasonId) === defaultSeasonId)?.seasonName ?? ""
        : "";

      const context: UploadParseContext = {
        seasonIndex,
        colorIndex,
        collectionIndex,
        pantoneIndex,
        hexIndex,
        defaultSeasonName,
      };

      if (missingRequired.length > 0) {
        return { context, errors: [`Missing required columns: ${missingRequired.join(", ")}.`] };
      }

      return { context };
    },
    [defaultSeasonId, seasons]
  );

  const parseUploadRow = useCallback(
    ({
      row,
      rowNumber,
      context,
    }: {
      row: unknown[];
      rowNumber: number;
      context: UploadParseContext;
    }) => {
      const values = row as Array<unknown>;
      const seasonName =
        context.seasonIndex >= 0 ? String(values[context.seasonIndex] ?? "").trim() : context.defaultSeasonName;
      const colorName = context.colorIndex >= 0 ? String(values[context.colorIndex] ?? "").trim() : "";
      const rawCollection = context.collectionIndex >= 0 ? String(values[context.collectionIndex] ?? "").trim() : "";
      const normalizedCollection = rawCollection
        ? normalizedCollectionMap.get(normalizeName(rawCollection)) ?? ""
        : "";
      const pantoneColor = context.pantoneIndex >= 0 ? String(values[context.pantoneIndex] ?? "").trim() : "";
      const rawHex = context.hexIndex >= 0 ? String(values[context.hexIndex] ?? "").trim() : "";
      const hexValue = normalizeHex(rawHex);

      if (!seasonName && !colorName && !rawCollection && !pantoneColor && !hexValue) {
        return { skip: true };
      }

      const errors: string[] = [];
      if (!seasonName) {
        errors.push(`Row ${rowNumber}: Season is required.`);
      }
      if (!colorName) {
        errors.push(`Row ${rowNumber}: Color is required.`);
      }
      if (rawCollection && !normalizedCollection) {
        errors.push(`Row ${rowNumber}: Collection '${rawCollection}' not found.`);
      }
      if (hexValue && !isHexValid(hexValue)) {
        errors.push(`Row ${rowNumber}: Hex should be 6 characters (for example, #1A2B3C).`);
      }

      return {
        row: {
          rowNumber,
          seasonName,
          colorName,
          collection: normalizedCollection,
          rawCollection: rawCollection || undefined,
          pantoneColor,
          hexValue,
        },
        errors,
      };
    },
    [normalizedCollectionMap]
  );

  const executeUpload = useCallback(
    async (uploadRows: UploadColorRow[]) => {
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
        const primaryName = getPrimaryColorName(row.colorName);
        const primaryKey = primaryName ? buildColorKey(primaryName, seasonId) : "";
        const primaryMatch = primaryKey ? normalizedColorMap.get(primaryKey) : undefined;
        const rawCollection = row.collection?.trim() || row.rawCollection?.trim() || "";
        const normalizedCollection = rawCollection
          ? normalizedCollectionMap.get(normalizeName(rawCollection)) ?? ""
          : "";
        if (rawCollection && !normalizedCollection) {
          errors.push(`Row ${row.rowNumber}: Collection '${rawCollection}' not found.`);
          continue;
        }
        const pantoneColor = row.pantoneColor?.trim() || primaryMatch?.pantoneColor?.trim() || null;
        const hexValue = row.hexValue?.trim() || primaryMatch?.hexValue?.trim() || "";
        const normalizedHex = normalizeHex(hexValue);
        try {
          await CatalogService.addOrUpdateColor({
            colorId: existing?.colorId,
            colorName: row.colorName,
            seasonId,
            collection: normalizedCollection || null,
            pantoneColor,
            hexValue: normalizedHex || null,
          });
          processed += 1;
        } catch (err: unknown) {
          errors.push(`Row ${row.rowNumber}: ${getErrorMessage(err, "Upload failed.")}`);
        }
      }

      return { processed, errors };
    },
    [getErrorMessage, normalizedColorMap, normalizedCollectionMap, normalizedSeasonMap]
  );

  const {
    fileName,
    rows: uploadRows,
    parseErrors,
    uploading,
    summary: uploadSummary,
    setRows: setUploadRows,
    setSummary: setUploadSummary,
    setParseErrors,
    handleFileChange: handleUploadFile,
    upload,
  } = useXlsxUpload<UploadColorRow, UploadSummary, never, UploadParseContext>({
    buildParseContext: buildUploadContext,
    parseRow: parseUploadRow,
    executeUpload,
    getReadErrorMessage: (err) => `Failed to read file: ${getErrorMessage(err, "Unknown error")}`,
  });

  const migrateOptions = useMemo(() => {
    if (!colorForm) return [];
    return colors
      .filter((color) => color.colorId !== colorForm.colorId)
      .slice()
      .sort((a, b) => a.colorName.localeCompare(b.colorName));
  }, [colorForm, colors]);

  const selectedMigrateTarget = useMemo(() => {
    if (!migrateTargetId) return null;
    const targetId = Number(migrateTargetId);
    if (!Number.isFinite(targetId)) return null;
    return migrateOptions.find((color) => color.colorId === targetId) ?? null;
  }, [migrateOptions, migrateTargetId]);

  const filteredColors = useMemo(() => {
    const baseRows = filterSeasonActiveRows(colors, { seasonFilterId: "" }).filter(
      (row) => !row.seasonId || activeSeasonIds.has(row.seasonId)
    );
    const query = normalizeName(listSearch);
    if (!query) {
      return baseRows;
    }

    return baseRows.filter((row) => {
      const colorName = normalizeName(row.colorName ?? "");
      const collectionName = normalizeName(row.collection ?? "");
      const seasonName = normalizeName(row.seasonName ?? "");
      return (
        colorName.includes(query) ||
        collectionName.includes(query) ||
        seasonName.includes(query)
      );
    });
  }, [activeSeasonIds, colors, listSearch]);

  const loadColorList = async () => {
    setColorListLoading(true);
    try {
      const colorData = await CatalogService.getColors();
      const rows = colorData.map((color) => ({
        ...color,
        seasonName: color.seasonId ? seasonMap.get(color.seasonId) ?? "" : "",
      }));
      setColors(rows);
    } catch (err: unknown) {
      console.error(err);
      notify("error", "Color list failed", getErrorMessage(err, "Unable to load color list."));
    } finally {
      setColorListLoading(false);
    }
  };

  useEffect(() => {
    if (seasons.length === 0) return;
    setColors((prev) =>
      prev.map((row) => ({
        ...row,
        seasonName: row.seasonId ? seasonMap.get(row.seasonId) ?? "" : "",
      }))
    );
  }, [seasonMap, seasons.length, setColors]);

  useEffect(() => {
    setDismissUploadParseErrors(false);
  }, [parseErrors]);

  useEffect(() => {
    setDismissUploadErrors(false);
  }, [uploadSummary?.errors]);

  useEffect(() => {
    setDismissUploadCollectionError(false);
  }, [uploadCollectionError]);

  const handleAddColorRow = () => {
    const newId = tempColorId;
    setTempColorId((prev) => prev - 1);
    const defaultSeason = seasons.find((season) => season.active !== false) ?? seasons[0];
    const newRow: ColorListRow = {
      colorId: newId,
      colorName: "",
      seasonId: defaultSeason?.seasonId ?? null,
      seasonName: defaultSeason?.seasonName ?? "",
      collection: "",
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

    const similarMatches = getSimilarColorCandidates({
      colorName: row.colorName,
      seasonId: row.seasonId ?? null,
      excludeColorId: row.colorId > 0 ? row.colorId : null,
    });
    if (row.colorId < 0 && similarMatches.length > 0) {
      notify(
        "info",
        "Similar colors exist",
        `Similar existing colors: ${similarMatches
          .slice(0, 3)
          .map((match) => match.colorName)
          .join(", ")}`
      );
    }

    const normalizedCollection = row.collection?.trim()
      ? normalizedCollectionMap.get(normalizeName(row.collection)) ?? null
      : null;
    if (row.collection?.trim() && !normalizedCollection) {
      notify("warn", "Collection required", "Select a collection from the list.");
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
        collection: normalizedCollection,
        pantoneColor: row.pantoneColor?.trim() || null,
        hexValue: normalizedHex || null,
      });
      await loadColorList();
      notify("success", "Color saved", `${row.colorName} saved successfully.`);
      return true;
    } catch (err: unknown) {
      console.error(err);
      notify("error", "Color save failed", getErrorMessage(err, "Unable to save color."));
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

  const handleRowClick = (event: DataTableRowClickEvent) => {
    const target = event.originalEvent?.target as HTMLElement | null;
    if (
      target?.closest(
        "button, a, input, select, textarea, .p-row-editor-init, .p-row-editor-save, .p-row-editor-cancel, .p-column-resizer"
      )
    ) {
      return;
    }
    const row = event.data as ColorListRow;
    setColorForm({
      ...row,
      seasonName: row.seasonName ?? seasonMap.get(row.seasonId ?? 0) ?? "",
      collection: row.collection ?? "",
      pantoneColor: row.pantoneColor ?? "",
      hexValue: row.hexValue ?? "",
    });
    setMigrateTargetId("");
    setShowMigrateConfirm(false);
  };

  const handleColorTableSort = (event: DataTableSortEvent) => {
    const nextField = event.sortField;
    const nextOrder = event.sortOrder;

    if (!nextField || !nextOrder) {
      const cleared = (event.multiSortMeta ?? []).filter((meta) => meta.order && meta.field !== nextField);
      setMultiSortMeta(cleared);
      return;
    }

    setMultiSortMeta((prev) => {
      const withoutField = prev.filter((meta) => meta.field !== nextField);
      return [...withoutField, { field: nextField, order: nextOrder }];
    });
  };

  const closeColorModal = () => {
    setColorForm(null);
    setMigrateTargetId("");
    setShowMigrateConfirm(false);
  };

  const handleModalSave = async () => {
    if (!colorForm) return;
    setColorSaving(true);
    const saved = await handleColorSave(colorForm);
    setColorSaving(false);
    if (saved) {
      closeColorModal();
    }
  };

  const formatColorLabel = (color: ColorListRow) => {
    const seasonLabel = color.seasonName ?? (color.seasonId ? seasonMap.get(color.seasonId) : "") ?? "";
    const collectionLabel = color.collection ? ` · ${color.collection}` : "";
    return `${color.colorName}${collectionLabel}${seasonLabel ? ` (${seasonLabel})` : ""}`;
  };

  const handleMigrateRequest = () => {
    if (!colorForm) return;
    if (!migrateTargetId || !selectedMigrateTarget) {
      notify("warn", "Select a target", "Choose a color to migrate into.");
      return;
    }
    notify(
      "warn",
      "Are you sure...",
      `This will move all records from ${colorForm.colorName} to ${selectedMigrateTarget.colorName}.`
    );
    setShowMigrateConfirm(true);
  };

  const handleConfirmMigrate = async () => {
    if (!colorForm || !selectedMigrateTarget) return;
    setMigratingColor(true);
    try {
      await CatalogService.migrateColor({
        sourceColorId: colorForm.colorId,
        targetColorId: selectedMigrateTarget.colorId,
      });
      notify(
        "success",
        "Color migrated",
        `${colorForm.colorName} migrated to ${selectedMigrateTarget.colorName}.`
      );
      closeColorModal();
      await loadColorList();
    } catch (err: unknown) {
      console.error(err);
      notify("error", "Migration failed", getErrorMessage(err, "Unable to migrate color."));
    } finally {
      setMigratingColor(false);
      setShowMigrateConfirm(false);
    }
  };

  const handleDeleteColor = async () => {
    if (!colorToDelete) return;
    setDeletingColorId(colorToDelete.colorId);
    try {
      await CatalogService.deleteColor(colorToDelete.colorId);
      notify("success", "Color deleted", `${colorToDelete.colorName} deleted successfully.`);
      setColorToDelete(null);
      await loadColorList();
    } catch (err: unknown) {
      console.error(err);
      notify("error", "Delete failed", getErrorMessage(err, "Unable to delete color."));
    } finally {
      setDeletingColorId(null);
    }
  };

  const handleCreateCollection = async () => {
    const name = collectionInput.trim();
    if (!name) {
      notify("warn", "Collection required", "Enter a collection name.");
      return;
    }
    if (normalizedCollectionMap.has(normalizeName(name))) {
      notify("warn", "Collection exists", "That collection already exists.");
      return;
    }

    setCollectionSaving(true);
    try {
      const created = await CatalogService.addCollection({ collectionName: name });
      setCollections((prev) => [...prev, created]);
      setCollectionInput("");
      setShowCollectionModal(false);
      notify("success", "Collection added", `${created.collectionName} is now available.`);
    } catch (err: unknown) {
      console.error(err);
      notify("error", "Add collection failed", getErrorMessage(err, "Unable to add collection."));
    } finally {
      setCollectionSaving(false);
    }
  };

  const handleCreateCollectionFromUploadModal = async () => {
    const name = uploadCollectionInput.trim();
    if (!name) {
      setUploadCollectionError("Enter a collection name.");
      setUploadCollectionSuccess(null);
      return;
    }
    if (normalizedCollectionMap.has(normalizeName(name))) {
      setUploadCollectionError("That collection already exists.");
      setUploadCollectionSuccess(null);
      return;
    }

    setUploadCollectionSaving(true);
    setUploadCollectionError(null);
    setUploadCollectionSuccess(null);
    try {
      const created = await CatalogService.addCollection({ collectionName: name });
      setCollections((prev) =>
        [...prev, created].sort((a, b) => a.collectionName.localeCompare(b.collectionName))
      );

      const normalizedCreated = normalizeName(created.collectionName);
      setUploadRows((prev) =>
        prev.map((row) => {
          const raw = (row.rawCollection ?? row.collection ?? "").trim();
          if (!raw || normalizeName(raw) !== normalizedCreated) {
            return row;
          }
          return { ...row, collection: created.collectionName };
        })
      );
      setParseErrors((prev) =>
        prev.filter((error) => {
          const match = /Collection '(.+?)' not found\./i.exec(error);
          if (!match) return true;
          return normalizeName(match[1]) !== normalizedCreated;
        })
      );

      setUploadCollectionSuccess(
        `Collection '${created.collectionName}' added and applied to matching upload rows.`
      );
      setUploadCollectionInput("");
      setShowUploadCollectionAdd(false);
      notify("success", "Collection added", `${created.collectionName} is now available.`);
    } catch (err: unknown) {
      console.error(err);
      setUploadCollectionError(getErrorMessage(err, "Unable to add collection."));
    } finally {
      setUploadCollectionSaving(false);
    }
  };

  const renderSeasonEditor = (options: EditorOptions<ColorListRow>) => (
    <Form.Select
      value={options.rowData.seasonId ?? ""}
      onChange={(e) => {
        const nextId = Number(e.target.value);
        const seasonName = seasonMap.get(nextId) ?? "";
        options.rowData.seasonId = nextId || null;
        options.rowData.seasonName = seasonName;
        options.editorCallback?.(nextId || null);
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

  const renderTextEditor = (options: EditorOptions<ColorListRow>) => (
    <Form.Control
      value={typeof options.value === "string" || typeof options.value === "number" ? options.value : ""}
      onChange={(e) => options.editorCallback?.(e.target.value)}
    />
  );

  const renderColorNameEditor = (options: EditorOptions<ColorListRow>) => {
    const value =
      typeof options.value === "string" || typeof options.value === "number" ? String(options.value) : "";
    return (
      <div className="color-name-editor">
        <Form.Control
          value={value}
          onChange={(e) => options.editorCallback?.(e.target.value)}
        />
        {renderSimilarColorHint({
          colorName: value,
          seasonId: options.rowData.seasonId ?? null,
          excludeColorId: options.rowData.colorId,
          className: "color-similar-hint color-similar-hint--inline",
        })}
      </div>
    );
  };

  const renderCollectionEditor = (options: EditorOptions<ColorListRow>) => (
    <Form.Select
      value={options.rowData.collection ?? ""}
      onChange={(e) => {
        const nextValue = e.target.value;
        options.rowData.collection = nextValue || null;
        options.editorCallback?.(nextValue || null);
      }}
    >
      <option value="">No collection</option>
      {collectionOptions.map((collection) => (
        <option key={collection.collectionId} value={collection.collectionName}>
          {collection.collectionName}
        </option>
      ))}
    </Form.Select>
  );

  const renderHexEditor = (options: EditorOptions<ColorListRow>) => (
    <Form.Control
      value={typeof options.value === "string" || typeof options.value === "number" ? options.value : ""}
      onChange={(e) => options.editorCallback?.(e.target.value)}
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
    const headers = ["Season", "Color", "Collection", "Pantone", "Hex"];
    const worksheet = sheetFromAoa([headers]);
    const workbook = createWorkbook();
    appendSheet(workbook, worksheet, "Colors");
    saveWorkbook(workbook, "color_list_template");
  };

  const handleDownloadColorList = () => {
    const headers = ["Season", "Color", "Collection", "Pantone", "Hex"];
    const rows = filteredColors.map((row) => ({
      Season: row.seasonName ?? "",
      Color: row.colorName ?? "",
      Collection: row.collection ?? "",
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

  const handleRefreshColorList = async () => {
    setListSearch("");
    await loadColorList();
  };

  const handleUploadColors = async () => {
    const result = await upload();
    if (result && result.processed > 0) {
      await loadColorList();
    }
  };

  const handleModalEnter =
    (action: () => void, disabled = false) =>
    (event: KeyboardEvent<HTMLElement>) => {
      if (disabled) return;
      if (!shouldSubmitOnEnter(event)) return;
      event.preventDefault();
      action();
    };

  const handleSkipDuplicateRow = (rowNumber: number) => {
    setUploadRows((prev) => prev.filter((row) => row.rowNumber !== rowNumber));
    setUploadSummary((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        errors: prev.errors.filter((error) => getRowNumberFromError(error) !== rowNumber),
      };
    });
  };

  const handleSkipAllDuplicates = (duplicateRows: Set<number>) => {
    if (duplicateRows.size === 0) return;
    setUploadRows((prev) => prev.filter((row) => !duplicateRows.has(row.rowNumber)));
    setUploadSummary((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        errors: prev.errors.filter((error) => {
          const rowNumber = getRowNumberFromError(error);
          return rowNumber === null || !duplicateRows.has(rowNumber);
        }),
      };
    });
  };

  const uploadErrors = useMemo(() => uploadSummary?.errors ?? [], [uploadSummary]);
  const hasUploadErrors = uploadErrors.length > 0;
  const duplicateRowNumbers = useMemo(() => {
    const rows = new Set<number>();
    uploadErrors.forEach((error) => {
      if (!isDuplicateUploadError(error)) return;
      const rowNumber = getRowNumberFromError(error);
      if (rowNumber !== null) {
        rows.add(rowNumber);
      }
    });
    return rows;
  }, [uploadErrors]);
  const hasDuplicateErrors = duplicateRowNumbers.size > 0;

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
            <Col md="auto" className="d-flex flex-wrap gap-2 justify-content-md-start">
              <Button
                type="button"
                className="btn-success btn-outlined"
                onClick={() => setShowCollectionModal(true)}
                disabled={loadingLookups}
              >
                <i className="pi pi-plus" aria-hidden="true" />
                Add Collection
              </Button>
            </Col>
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
                onClick={handleRefreshColorList}
                disabled={colorListLoading}
              >
                <i className="pi pi-refresh" aria-hidden="true" />
                {colorListLoading ? "Refreshing..." : "Refresh list"}
              </Button>
            </Col>
          </Row>

          <Row className="items-filter-row mt-3 gy-2 align-items-end">
            <Col md={6}>
              <Form.Label>Search (Color / Collection / Season)</Form.Label>
              <div className="inventory-labels-search-wrap">
                <Form.Control
                  className="inventory-labels-search"
                  value={listSearch}
                  onChange={(e) => setListSearch(e.target.value)}
                  placeholder="Search color, collection, or season"
                  disabled={loadingLookups}
                />
                {listSearch.trim() && (
                  <button
                    type="button"
                    className="inventory-labels-search-clear"
                    aria-label="Clear search"
                    onClick={() => setListSearch("")}
                  >
                    <i className="pi pi-times" aria-hidden="true" />
                  </button>
                )}
              </div>
            </Col>
          </Row>

          <div className="items-table-wrapper mt-3">
            <DataTable
              value={filteredColors}
              dataKey="colorId"
              loading={colorListLoading}
              sortMode="multiple"
              multiSortMeta={multiSortMeta}
              onSort={handleColorTableSort}
              rowHover
              editMode="row"
              editingRows={editingRows}
              onRowEditChange={handleRowEditChange}
              onRowEditComplete={handleRowEditComplete}
              onRowEditCancel={handleRowEditCancel}
              onRowClick={handleRowClick}
              className="p-datatable-gridlines items-colors-table"
            >
              <Column
                field="colorName"
                header="Color"
                body={renderColorName}
                editor={renderColorNameEditor}
                className="col-color"
                sortable
              />
              <Column
                field="seasonId"
                header="Season"
                body={(row: ColorListRow) => row.seasonName ?? ""}
                editor={renderSeasonEditor}
                className="col-season"
                sortField="seasonName"
                sortable
              />
              <Column
                field="collection"
                header="Collection"
                editor={renderCollectionEditor}
                className="col-description"
                sortable
              />
              <Column
                field="pantoneColor"
                header="Pantone"
                editor={renderTextEditor}
                className="col-description"
                sortable
              />
              <Column
                field="hexValue"
                header="Hex"
                body={renderHexValue}
                editor={renderHexEditor}
                className="col-description"
                sortable
              />
              <Column rowEditor header="Save" headerStyle={{ width: "6rem" }} bodyStyle={{ textAlign: "center" }} />
              <Column
                header="Delete"
                body={(row: ColorListRow) => (
                  <Button
                    type="button"
                    className="btn-danger btn-outlined btn-icon"
                    onClick={() => setColorToDelete(row)}
                    disabled={row.colorId < 0}
                    aria-label={`Delete ${row.colorName}`}
                  >
                    <i className="pi pi-trash" aria-hidden="true" />
                  </Button>
                )}
                headerStyle={{ width: "6rem" }}
                bodyStyle={{ textAlign: "center" }}
              />
            </DataTable>
          </div>
        </Card.Body>
      </Card>

      <Modal
        show={Boolean(colorForm)}
        onHide={closeColorModal}
        centered
        className="items-colors-modal"
        onKeyDown={handleModalEnter(handleModalSave, colorSaving)}
      >
        <Modal.Header closeButton>
          <Modal.Title>Edit color</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="gy-3">
            <Col md={6}>
              <Form.Label>Color name</Form.Label>
              <Form.Control
                value={colorForm?.colorName ?? ""}
                onChange={(e) =>
                  setColorForm((prev) => (prev ? { ...prev, colorName: e.target.value } : prev))
                }
              />
              {colorForm
                ? renderSimilarColorHint({
                    colorName: colorForm.colorName ?? "",
                    seasonId: colorForm.seasonId ?? null,
                    excludeColorId: colorForm.colorId,
                    className: "color-similar-hint mt-2",
                  })
                : null}
            </Col>
            <Col md={6}>
              <Form.Label>Season</Form.Label>
              <Form.Select
                value={colorForm?.seasonId ?? ""}
                onChange={(e) => {
                  const nextId = Number(e.target.value) || null;
                  const seasonName = nextId ? seasonMap.get(nextId) ?? "" : "";
                  setColorForm((prev) =>
                    prev ? { ...prev, seasonId: nextId, seasonName } : prev
                  );
                }}
              >
                <option value="">No season</option>
                {seasons.map((season) => (
                  <option key={season.seasonId} value={season.seasonId}>
                    {season.seasonName}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col md={6}>
              <Form.Label>Collection</Form.Label>
              <Form.Select
                value={colorForm?.collection ?? ""}
                onChange={(e) =>
                  setColorForm((prev) =>
                    prev ? { ...prev, collection: e.target.value || "" } : prev
                  )
                }
              >
                <option value="">No collection</option>
                {collectionOptions.map((collection) => (
                  <option key={collection.collectionId} value={collection.collectionName}>
                    {collection.collectionName}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col md={6}>
              <Form.Label>Pantone</Form.Label>
              <Form.Control
                value={colorForm?.pantoneColor ?? ""}
                onChange={(e) =>
                  setColorForm((prev) => (prev ? { ...prev, pantoneColor: e.target.value } : prev))
                }
              />
            </Col>
            <Col md={6}>
              <Form.Label>Hex</Form.Label>
              <Form.Control
                value={colorForm?.hexValue ?? ""}
                onChange={(e) =>
                  setColorForm((prev) => (prev ? { ...prev, hexValue: e.target.value } : prev))
                }
                placeholder="#FFFFFF"
              />
            </Col>
          </Row>

          <hr className="my-3" />
          <h6 className="mb-2">Migrate color</h6>
          <Row className="gy-2 align-items-end">
            <Col md={8}>
              <Form.Label>Target color</Form.Label>
              <Form.Select
                value={migrateTargetId}
                onChange={(e) => setMigrateTargetId(e.target.value)}
              >
                <option value="">Select a color</option>
                {migrateOptions.map((color) => (
                  <option key={color.colorId} value={color.colorId}>
                    {formatColorLabel(color)}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col md={4} className="text-md-end">
              <Button
                type="button"
                className="btn-danger btn-outlined"
                onClick={handleMigrateRequest}
                disabled={migratingColor}
              >
                <i className="pi pi-external-link" aria-hidden="true" />
                Migrate
              </Button>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button type="button" className="btn-neutral btn-outlined" onClick={closeColorModal}>
            <i className="pi pi-times" aria-hidden="true" />
            Close
          </Button>
          <Button
            type="button"
            className="btn-success"
            onClick={handleModalSave}
            disabled={colorSaving}
          >
            <i className="pi pi-save" aria-hidden="true" />
            {colorSaving ? "Saving..." : "Save changes"}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={showMigrateConfirm}
        onHide={() => setShowMigrateConfirm(false)}
        centered
        onKeyDown={handleModalEnter(handleConfirmMigrate, migratingColor)}
      >
        <Modal.Header closeButton>
          <Modal.Title>Confirm migration</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-0">
            Move <strong>{colorForm?.colorName}</strong> to{" "}
            <strong>{selectedMigrateTarget?.colorName}</strong>? This will update all related records.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button
            type="button"
            className="btn-neutral btn-outlined"
            onClick={() => setShowMigrateConfirm(false)}
            disabled={migratingColor}
          >
            <i className="pi pi-times" aria-hidden="true" />
            Cancel
          </Button>
          <Button
            type="button"
            className="btn-danger"
            onClick={handleConfirmMigrate}
            disabled={migratingColor}
          >
            <i className="pi pi-check" aria-hidden="true" />
            {migratingColor ? "Migrating..." : "Confirm migrate"}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={showCollectionModal}
        onHide={() => setShowCollectionModal(false)}
        centered
        onKeyDown={handleModalEnter(handleCreateCollection, collectionSaving)}
      >
        <Modal.Header closeButton>
          <Modal.Title>Add Collection</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Label>Collection name</Form.Label>
          <Form.Control
            value={collectionInput}
            onChange={(e) => setCollectionInput(e.target.value)}
            placeholder="Enter collection name"
            disabled={collectionSaving}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button
            type="button"
            className="btn-neutral btn-outlined"
            onClick={() => setShowCollectionModal(false)}
            disabled={collectionSaving}
          >
            <i className="pi pi-times" aria-hidden="true" />
            Cancel
          </Button>
          <Button
            type="button"
            className="btn-success"
            onClick={handleCreateCollection}
            disabled={collectionSaving}
          >
            <i className="pi pi-save" aria-hidden="true" />
            {collectionSaving ? "Saving..." : "Save collection"}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={Boolean(colorToDelete)}
        onHide={() => setColorToDelete(null)}
        centered
        onKeyDown={handleModalEnter(handleDeleteColor, deletingColorId !== null)}
      >
        <Modal.Header closeButton>
          <Modal.Title>Delete color</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-0">
            Delete <strong>{colorToDelete?.colorName}</strong>? This action cannot be undone.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button
            type="button"
            className="btn-neutral btn-outlined"
            onClick={() => setColorToDelete(null)}
            disabled={deletingColorId !== null}
          >
            <i className="pi pi-times" aria-hidden="true" />
            Cancel
          </Button>
          <Button
            type="button"
            className="btn-danger"
            onClick={handleDeleteColor}
            disabled={deletingColorId !== null}
          >
            <i className="pi pi-trash" aria-hidden="true" />
            {deletingColorId !== null ? "Deleting..." : "Delete"}
          </Button>
        </Modal.Footer>
      </Modal>

      <UploadModal
        show={showUploadModal}
        title="Upload Colors"
        onClose={() => setShowUploadModal(false)}
        closeDisabled={uploading}
        onEnterKey={handleUploadColors}
        enterDisabled={uploadRows.length === 0 || parseErrors.length > 0 || uploading}
        headerContent={
          <>
            <h6 className="mb-1">Upload color list</h6>
            <p className="text-muted mb-0">
              Add or update colors with season, collection, Pantone, and hex values.
            </p>
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

        <Row className="gy-2 mt-2 align-items-end">
          <Col xs={12} lg={showUploadCollectionAdd ? 8 : 12}>
            {!showUploadCollectionAdd ? (
              <Button
                type="button"
                className="btn-neutral btn-outlined"
                onClick={() => {
                  setShowUploadCollectionAdd(true);
                  setUploadCollectionError(null);
                  setUploadCollectionSuccess(null);
                  setDismissUploadCollectionError(false);
                }}
                disabled={uploading || uploadCollectionSaving}
              >
                <i className="pi pi-plus" aria-hidden="true" />
                Add Collection
              </Button>
            ) : (
              <>
                <Form.Label>Add collection (without leaving upload)</Form.Label>
                <Form.Control
                  type="text"
                  value={uploadCollectionInput}
                  onChange={(e) => setUploadCollectionInput(e.target.value)}
                  placeholder="Enter collection name"
                  disabled={uploading || uploadCollectionSaving}
                />
              </>
            )}
          </Col>
          {showUploadCollectionAdd && (
            <Col xs={12} lg={4} className="d-flex flex-wrap gap-2 justify-content-start justify-content-lg-end">
              <Button
                type="button"
                className="btn-success"
                onClick={handleCreateCollectionFromUploadModal}
                disabled={uploading || uploadCollectionSaving || !uploadCollectionInput.trim()}
              >
                <i className="pi pi-save" aria-hidden="true" />
                {uploadCollectionSaving ? "Saving..." : "Save"}
              </Button>
              <Button
                type="button"
                className="btn-neutral btn-outlined"
                onClick={() => {
                  setShowUploadCollectionAdd(false);
                  setUploadCollectionInput("");
                  setUploadCollectionError(null);
                }}
                disabled={uploadCollectionSaving}
              >
                <i className="pi pi-times" aria-hidden="true" />
                Cancel
              </Button>
            </Col>
          )}
        </Row>
        {uploadCollectionError && !dismissUploadCollectionError && (
          <Alert variant="danger" className="mt-2">
            {uploadCollectionError}
            <div className="text-end mt-2">
              <Button
                type="button"
                className="btn-neutral btn-outlined"
                onClick={() => setDismissUploadCollectionError(true)}
              >
                <i className="pi pi-check" aria-hidden="true" />
                OK
              </Button>
            </div>
          </Alert>
        )}
        {uploadCollectionSuccess && (
          <Alert variant="success" className="mt-2">
            {uploadCollectionSuccess}
          </Alert>
        )}

        {fileName && <div className="text-muted mt-2">Selected file: {fileName}</div>}

        {parseErrors.length > 0 && !dismissUploadParseErrors && (
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
            <div className="text-end mt-2">
              <Button type="button" className="btn-neutral btn-outlined" onClick={() => setDismissUploadParseErrors(true)}>
                <i className="pi pi-check" aria-hidden="true" />
                OK
              </Button>
            </div>
          </Alert>
        )}

        {uploadSummary && !hasUploadErrors && (
          <Alert variant="success" className="mt-3">
            Upload successful. Processed {uploadSummary.processed} color(s).
          </Alert>
        )}

        {uploadSummary && hasUploadErrors && !dismissUploadErrors && (
          <Alert variant="danger" className="mt-3">
            <strong>Upload completed with issues:</strong>
            <ul className="mb-0">
              {uploadErrors.slice(0, 8).map((error) => {
                const rowNumber = getRowNumberFromError(error);
                const isDuplicate = rowNumber !== null && isDuplicateUploadError(error);
                return (
                  <li
                    key={error}
                    className={isDuplicate ? "d-flex align-items-start justify-content-between gap-2" : undefined}
                  >
                    <span>{error}</span>
                    {isDuplicate && (
                      <Button
                        type="button"
                        className="btn-neutral btn-text"
                        onClick={() => handleSkipDuplicateRow(rowNumber)}
                      >
                        Skip
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
            {uploadErrors.length > 8 && (
              <div className="mt-2 text-muted">{uploadErrors.length - 8} more issue(s) not shown.</div>
            )}
            {hasDuplicateErrors && (
              <div className="text-end mt-2">
                <Button
                  type="button"
                  className="btn-neutral btn-outlined"
                  onClick={() => handleSkipAllDuplicates(duplicateRowNumbers)}
                >
                  <i className="pi pi-filter-slash" aria-hidden="true" />
                  Skip all duplicates
                </Button>
              </div>
            )}
            <div className="text-end mt-2">
              <Button type="button" className="btn-neutral btn-outlined" onClick={() => setDismissUploadErrors(true)}>
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
