import { type ChangeEvent, type Dispatch, type SetStateAction, useState } from "react";
import CatalogService, { type ColorOption, type ItemView } from "../../service/CatalogService";
import type {
  ColorResolutionMap,
  ColorReviewItem,
  ItemListRow,
  ReviewContext,
  SeasonOption,
  UploadItemRow,
  UploadSummary,
} from "../../items/itemsColorsTypes";
import { MAX_COLOR_COLUMNS, normalizeName } from "../../items/itemsColorsUtils";
import { appendSheet, createWorkbook, saveWorkbook, sheetFromAoa } from "../../utils/xlsxUtils";
import { findHeaderIndex, normalizeHeaders, parseOptionalNumber, readFirstSheetRows } from "../../utils/xlsxParse";

type UseItemUploadParams = {
  seasons: SeasonOption[];
  itemKeyMap: Map<string, ItemListRow>;
  buildItemKey: (seasonId: number, itemNumber: string) => string;
  normalizedColors: Array<ColorOption & { normalized: string }>;
  colorResolutionMap: ColorResolutionMap;
  buildColorResolutions: (names: string[], baseMap: ColorResolutionMap) => {
    nextMap: ColorResolutionMap;
    reviewItems: ColorReviewItem[];
  };
  setColorResolutionMap: Dispatch<SetStateAction<ColorResolutionMap>>;
  setColorReviewItems: Dispatch<SetStateAction<ColorReviewItem[]>>;
  setReviewContext: Dispatch<SetStateAction<ReviewContext | null>>;
  setShowColorReview: Dispatch<SetStateAction<boolean>>;
  setColors: Dispatch<SetStateAction<ColorOption[]>>;
  loadItemList: () => Promise<ItemListRow[]>;
};

export function useItemUpload({
  seasons,
  itemKeyMap,
  buildItemKey,
  normalizedColors,
  colorResolutionMap,
  buildColorResolutions,
  setColorResolutionMap,
  setColorReviewItems,
  setReviewContext,
  setShowColorReview,
  setColors,
  loadItemList,
}: UseItemUploadParams) {
  const getErrorMessage = (err: unknown, fallback: string) =>
    err instanceof Error ? err.message : fallback;
  const [defaultSeasonId] = useState("");
  const [fileName, setFileName] = useState("");
  const [uploadRows, setUploadRows] = useState<UploadItemRow[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadSummary, setUploadSummary] = useState<UploadSummary | null>(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateRows, setDuplicateRows] = useState<UploadItemRow[]>([]);
  const [updateExistingItems, setUpdateExistingItems] = useState(false);

  const handleDownloadTemplate = () => {
    const headers = [
      "Season",
      "Style Number",
      "Description",
      "Wholesale",
      "Retail",
      ...Array.from({ length: MAX_COLOR_COLUMNS }, (_, i) => `Color ${i + 1}`),
    ];
    const worksheet = sheetFromAoa([headers]);
    const workbook = createWorkbook();
    appendSheet(workbook, worksheet, "Item List");
    saveWorkbook(workbook, "item_list_template");
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
      const descriptionIndex = findHeaderIndex(normalizedHeaders, ["description", "desc"]);
      const wholesaleIndex = findHeaderIndex(normalizedHeaders, [
        "wholesale",
        "wholesale price",
        "wholesaleprice",
      ]);
      const retailIndex = findHeaderIndex(normalizedHeaders, ["retail", "retail price", "retailprice"]);

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

      const defaultSeasonName = defaultSeasonId
        ? seasons.find((season) => String(season.seasonId) === defaultSeasonId)?.seasonName ?? ""
        : "";

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

        if (!seasonName && !itemNumber && !description && colorNames.length === 0) {
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

      setUploadRows(parsedRows);
      setParseErrors(errors);
    } catch (err: unknown) {
      console.error(err);
      setParseErrors([`Failed to read file: ${getErrorMessage(err, "Unknown error")}`]);
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
    } catch (err: unknown) {
      console.error(err);
      summary.errors.push(getErrorMessage(err, "Upload failed."));
      setUploadSummary(summary);
    } finally {
      setUploading(false);
    }
  };

  return {
    fileName,
    uploadRows,
    parseErrors,
    uploading,
    uploadSummary,
    showDuplicateModal,
    setShowDuplicateModal,
    duplicateRows,
    updateExistingItems,
    handleDownloadTemplate,
    handleUploadFile,
    handlePrepareUpload,
    executeUpload,
  };
}
