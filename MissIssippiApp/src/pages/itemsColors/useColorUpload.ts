import { type ChangeEvent, type Dispatch, type SetStateAction, useState } from "react";
import CatalogService, { type ColorOption } from "../../service/CatalogService";
import type {
  ColorResolutionMap,
  ColorReviewItem,
  ColorUploadSummary,
  ItemListRow,
  ReviewContext,
  SeasonOption,
  UploadColorRow,
} from "../../items/itemsColorsTypes";
import { MAX_COLOR_COLUMNS, normalizeName } from "../../items/itemsColorsUtils";
import { appendSheet, createWorkbook, saveWorkbook, sheetFromAoa } from "../../utils/xlsxUtils";
import { findHeaderIndex, normalizeHeaders, readFirstSheetRows } from "../../utils/xlsxParse";

type UseColorUploadParams = {
  seasons: SeasonOption[];
  itemList: ItemListRow[];
  filteredItems: ItemListRow[];
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

export function useColorUpload({
  seasons,
  itemList,
  filteredItems,
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
}: UseColorUploadParams) {
  const [colorDefaultSeasonId, setColorDefaultSeasonId] = useState("");
  const [colorFileName, setColorFileName] = useState("");
  const [colorUploadRows, setColorUploadRows] = useState<UploadColorRow[]>([]);
  const [colorParseErrors, setColorParseErrors] = useState<string[]>([]);
  const [colorUploading, setColorUploading] = useState(false);
  const [colorUploadSummary, setColorUploadSummary] = useState<ColorUploadSummary | null>(null);

  const handleDownloadItemColors = () => {
    const headers = ["Season", "Style Number", ...Array.from({ length: MAX_COLOR_COLUMNS }, (_, i) => `Color ${i + 1}`)];
    const selectedSeasonId = Number(colorDefaultSeasonId);
    const hasSelectedSeason = Number.isFinite(selectedSeasonId) && selectedSeasonId > 0;
    const sourceItems = hasSelectedSeason
      ? itemList.filter((row) => row.seasonId === selectedSeasonId)
      : filteredItems;
    const rows = sourceItems.map((row) => {
      const colors = Array.from(
        new Map((row.colors ?? []).map((color) => [color.colorId, color])).values()
      );
      const cells = [row.seasonName ?? "", row.itemNumber ?? ""];
      for (let i = 0; i < MAX_COLOR_COLUMNS; i += 1) {
        cells.push(colors[i]?.colorName ?? "");
      }
      return cells;
    });
    const worksheet = sheetFromAoa([headers, ...rows]);
    const workbook = createWorkbook();
    appendSheet(workbook, worksheet, "Item Colors");
    saveWorkbook(workbook, "item_colors");
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
      const { rows: rawRows, errors: sheetErrors } = readFirstSheetRows(buffer);
      if (sheetErrors.length > 0) {
        setColorParseErrors(sheetErrors);
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
        ? seasons.find((season) => String(season.seasonId) === colorDefaultSeasonId)?.seasonName ?? ""
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

  return {
    colorDefaultSeasonId,
    setColorDefaultSeasonId,
    colorFileName,
    colorUploadRows,
    colorParseErrors,
    colorUploading,
    colorUploadSummary,
    handleDownloadItemColors,
    handleColorUploadFile,
    handlePrepareColorUpload,
    executeColorUpload,
  };
}
