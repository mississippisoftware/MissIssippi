import { type ChangeEvent, type Dispatch, type SetStateAction, useState } from "react";
import CatalogService, { type ColorOption, type ItemColorView } from "../../service/CatalogService";
import type {
  ColorResolutionMap,
  ColorReviewItem,
  ColorUploadSummary,
  ItemListRow,
  ReviewContext,
  SeasonOption,
  UploadColorRow,
} from "../../items/itemsColorsTypes";
import { MAX_COLOR_COLUMNS, normalizeName, splitCompositeColorName } from "../../items/itemsColorsUtils";
import { useXlsxUploadParser } from "../../hooks/useXlsxUpload";
import { getErrorMessage } from "../../utils/errors";
import { appendSheet, createWorkbook, saveWorkbook, sheetFromAoa } from "../../utils/xlsxUtils";
import { findHeaderIndex, normalizeHeaders } from "../../utils/xlsxParse";

type UseColorUploadParams = {
  seasons: SeasonOption[];
  itemList: ItemListRow[];
  filteredItems: ItemListRow[];
  itemKeyMap: Map<string, ItemListRow>;
  buildItemKey: (seasonId: number, itemNumber: string) => string;
  normalizedColors: Array<ColorOption & { normalized: string }>;
  colorResolutionMap: ColorResolutionMap;
  buildColorResolutions: (
    names: string[],
    baseMap: ColorResolutionMap,
    options?: { reviewAllNew?: boolean; sourcesByName?: Map<string, string[]> }
  ) => { nextMap: ColorResolutionMap; reviewItems: ColorReviewItem[] };
  setColorResolutionMap: Dispatch<SetStateAction<ColorResolutionMap>>;
  setColorReviewItems: Dispatch<SetStateAction<ColorReviewItem[]>>;
  setReviewContext: Dispatch<SetStateAction<ReviewContext | null>>;
  setShowColorReview: Dispatch<SetStateAction<boolean>>;
  setColors: Dispatch<SetStateAction<ColorOption[]>>;
  loadItemList: () => Promise<ItemListRow[]>;
};

const ITEM_NUMBER_HEADER_CANDIDATES = [
  "style",
  "style number",
  "stylenumber",
  "style #",
  "style no",
  "style no.",
  "item number",
  "item #",
  "item no",
  "number",
];

type ColorUploadParseContext = {
  seasonIndex: number;
  itemIndex: number;
  colorIndexes: number[];
  defaultSeasonName: string;
  seasonNameToId: Map<string, number>;
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
  const replaceExistingColors = true;
  const getConflictName = (message: string) => {
    const match = /Color '(.+?)' already exists/i.exec(message);
    return match?.[1] ?? null;
  };
  const pickExistingColor = (args: {
    matches: ColorOption[];
    normalizedColorName: string;
    seasonId: number;
    collection?: string | null;
  }): ColorOption | undefined => {
    const { matches, normalizedColorName, seasonId, collection } = args;
    const normalizedCollection = normalizeName(collection ?? "");
    return (
      matches.find(
        (entry) =>
          normalizeName(entry.colorName) === normalizedColorName &&
          (entry.seasonId ?? null) === seasonId &&
          (!normalizedCollection || normalizeName(entry.collection ?? "") === normalizedCollection)
      ) ??
      matches.find(
        (entry) =>
          normalizeName(entry.colorName) === normalizedColorName &&
          (entry.seasonId ?? null) === seasonId
      ) ??
      matches.find((entry) => normalizeName(entry.colorName) === normalizedColorName)
    );
  };

  const { parseFile: parseColorUploadFile } = useXlsxUploadParser<UploadColorRow, ColorUploadParseContext>({
    buildParseContext: (headerRow) => {
      const normalizedHeaders = normalizeHeaders(headerRow);

      const seasonIndex = findHeaderIndex(normalizedHeaders, ["season", "season name", "seasonname"]);
      const itemIndex = findHeaderIndex(normalizedHeaders, ITEM_NUMBER_HEADER_CANDIDATES);
      const colorIndexes = normalizedHeaders
        .map((header, index) => (header.startsWith("color") ? index : -1))
        .filter((index) => index >= 0)
        .slice(0, MAX_COLOR_COLUMNS);

      const missingRequired = [
        seasonIndex < 0 && !colorDefaultSeasonId ? "Season" : null,
        itemIndex < 0 ? "Style Number" : null,
        colorIndexes.length === 0 ? "Color columns" : null,
      ].filter(Boolean);

      const defaultSeasonName = colorDefaultSeasonId
        ? seasons.find((season) => String(season.seasonId) === colorDefaultSeasonId)?.seasonName ?? ""
        : "";

      const context: ColorUploadParseContext = {
        seasonIndex,
        itemIndex,
        colorIndexes,
        defaultSeasonName,
        seasonNameToId: new Map(seasons.map((season) => [normalizeName(season.seasonName), season.seasonId])),
      };

      if (missingRequired.length > 0) {
        return { context, errors: [`Missing required columns: ${missingRequired.join(", ")}.`] };
      }

      return { context };
    },
    parseRow: ({ row, rowNumber, context }) => {
      const values = row as Array<unknown>;
      const seasonName = context.seasonIndex >= 0 ? String(values[context.seasonIndex] ?? "").trim() : context.defaultSeasonName;
      const itemNumber = context.itemIndex >= 0 ? String(values[context.itemIndex] ?? "").trim() : "";
      const colorNames = context.colorIndexes
        .map((index) => String(values[index] ?? "").trim())
        .filter(Boolean);

      if (!seasonName && !itemNumber && colorNames.length === 0) {
        return { skip: true };
      }

      const errors: string[] = [];
      if (!seasonName) {
        errors.push(`Row ${rowNumber}: Season is required.`);
      }
      if (!itemNumber) {
        errors.push(`Row ${rowNumber}: Style Number is required.`);
      }
      if (colorNames.length === 0) {
        errors.push(`Row ${rowNumber}: At least one color is required.`);
      }

      const uniqueColors = Array.from(new Map(colorNames.map((name) => [normalizeName(name), name])).values());
      return {
        row: {
          rowNumber,
          seasonName,
          itemNumber,
          colorNames: uniqueColors,
        },
        errors,
      };
    },
    validateRow: (row, context) => {
      const errors: string[] = [];
      if (!row.seasonName || !row.itemNumber) {
        return errors;
      }
      const seasonId = context.seasonNameToId.get(normalizeName(row.seasonName));
      if (!seasonId) {
        errors.push(`Row ${row.rowNumber}: Season '${row.seasonName}' not found.`);
        return errors;
      }
      const itemKey = buildItemKey(seasonId, row.itemNumber);
      if (!itemKeyMap.has(itemKey)) {
        errors.push(`Row ${row.rowNumber}: Style '${row.itemNumber}' not found.`);
      }
      return errors;
    },
    getReadErrorMessage: (err) => `Failed to read file: ${getErrorMessage(err, "Unknown error")}`,
  });

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

    const result = await parseColorUploadFile(file);
    setColorUploadRows(result.rows);
    setColorParseErrors([...result.errors, ...result.warnings]);
  };

  const handlePrepareColorUpload = async () => {
    if (colorUploadRows.length === 0 || colorParseErrors.length > 0) {
      return;
    }

    const uniqueColors = Array.from(
      new Set(colorUploadRows.flatMap((row) => row.colorNames.map((name) => name.trim())).filter(Boolean))
    );
    const sourcesByName = new Map<string, string[]>();
    const sourceSets = new Map<string, Set<string>>();
    colorUploadRows.forEach((row) => {
      row.colorNames.forEach((name) => {
        splitCompositeColorName(name).forEach((part) => {
          const normalized = normalizeName(part);
          if (!normalized) return;
          if (!sourceSets.has(normalized)) {
            sourceSets.set(normalized, new Set());
          }
          sourceSets.get(normalized)?.add(row.itemNumber);
        });
      });
    });
    sourceSets.forEach((set, key) => {
      sourcesByName.set(key, Array.from(set).sort());
    });

    const { nextMap, reviewItems } = buildColorResolutions(uniqueColors, colorResolutionMap, {
      sourcesByName,
    });
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
      updatedItemColors: 0,
      skippedItemColors: 0,
      errors: [],
    };

    const createdColorIds = new Map<string, number>();
    const createdColorNames = new Set<string>();
    const existingColorNames = new Set<string>();
    const itemColorCache = new Map<number, Map<number, ItemColorView>>();
    const newColors: ColorOption[] = [];

    const seasonNameToId = new Map(
      seasons.map((season) => [normalizeName(season.seasonName), season.seasonId])
    );

    const resolveComponentColorId = async (
      componentName: string,
      componentNormalized: string,
      seasonId: number,
      itemNumber: string
    ) => {
      const resolution = resolutionMap[componentNormalized];
      if (!resolution) {
        summary.errors.push(`Style '${itemNumber}': Color '${componentName}' has no resolution.`);
        return undefined;
      }

      let colorId = resolution.colorId;
      const cached = createdColorIds.get(componentNormalized);
      if (!colorId && cached) {
        colorId = cached;
      }
      if (!colorId && resolution.action === "existing") {
        const exact = normalizedColors.find((match) => match.normalized === componentNormalized);
        colorId = exact?.colorId;
      }

      if (!colorId) {
        try {
          await CatalogService.addOrUpdateColor({
            colorName: resolution.resolvedName,
            seasonId,
            collection: resolution.collection ?? undefined,
          });
          const matches = await CatalogService.getColors({ colorName: resolution.resolvedName });
          const match = pickExistingColor({
            matches,
            normalizedColorName: componentNormalized,
            seasonId,
            collection: resolution.collection,
          });
          if (!match) {
            summary.errors.push(`Color '${resolution.resolvedName}' could not be created.`);
            return undefined;
          }
          colorId = match.colorId;
          createdColorIds.set(componentNormalized, colorId);
          newColors.push(match);
          createdColorNames.add(componentNormalized);
          return colorId;
        } catch (err: unknown) {
          const message = getErrorMessage(err, "Upload failed.");
          const conflictName = getConflictName(message);
          if (conflictName || /already exists|conflict/i.test(message)) {
            try {
              const matches = await CatalogService.getColors({ colorName: resolution.resolvedName });
              const existing = pickExistingColor({
                matches,
                normalizedColorName: componentNormalized,
                seasonId,
                collection: resolution.collection,
              });
              if (existing) {
                existingColorNames.add(componentNormalized);
                return existing.colorId;
              }
            } catch (lookupErr: unknown) {
              const lookupMessage = getErrorMessage(lookupErr, "");
              if (lookupMessage) {
                summary.errors.push(lookupMessage);
              }
            }
          }
          summary.errors.push(message);
          return undefined;
        }
      }

      if (!createdColorIds.has(componentNormalized) && !createdColorNames.has(componentNormalized)) {
        existingColorNames.add(componentNormalized);
      }

      return colorId;
    };

    const buildColorGroups = (colors: string[]) => {
      const groups = new Map<string, { primaryName: string; secondaryNames: string[] }>();
      const secondarySeen = new Map<string, Set<string>>();

      colors.forEach((rawColor) => {
        const parts = splitCompositeColorName(rawColor);
        if (parts.length === 0) {
          return;
        }

        const primaryName = parts[0];
        const primaryNormalized = normalizeName(primaryName);
        if (!primaryNormalized) {
          return;
        }

        if (!groups.has(primaryNormalized)) {
          groups.set(primaryNormalized, { primaryName, secondaryNames: [] });
          secondarySeen.set(primaryNormalized, new Set());
        }

        const group = groups.get(primaryNormalized);
        const seen = secondarySeen.get(primaryNormalized);
        if (!group || !seen) {
          return;
        }

        parts.slice(1).forEach((secondaryName) => {
          const secondaryNormalized = normalizeName(secondaryName);
          if (!secondaryNormalized || secondaryNormalized === primaryNormalized) {
            return;
          }
          if (seen.has(secondaryNormalized)) {
            return;
          }
          seen.add(secondaryNormalized);
          group.secondaryNames.push(secondaryName);
        });
      });

      return groups;
    };

    try {
      const groupedRows = new Map<
        string,
        {
          rowNumbers: number[];
          seasonId: number;
          seasonName: string;
          itemNumber: string;
          colorNames: Set<string>;
        }
      >();

      for (const row of rows) {
        const seasonId = seasonNameToId.get(normalizeName(row.seasonName));
        if (!seasonId) {
          summary.errors.push(`Row ${row.rowNumber}: Season '${row.seasonName}' not found.`);
          continue;
        }
        const key = buildItemKey(seasonId, row.itemNumber);
        const existing = groupedRows.get(key);
        if (!existing) {
          groupedRows.set(key, {
            rowNumbers: [row.rowNumber],
            seasonId,
            seasonName: row.seasonName,
            itemNumber: row.itemNumber,
            colorNames: new Set(row.colorNames),
          });
          continue;
        }
        existing.rowNumbers.push(row.rowNumber);
        row.colorNames.forEach((name) => existing.colorNames.add(name));
      }

      for (const entry of groupedRows.values()) {
        const rowLabel =
          entry.rowNumbers.length === 1
            ? `Row ${entry.rowNumbers[0]}`
            : `Rows ${entry.rowNumbers.join(", ")}`;

        const itemKey = buildItemKey(entry.seasonId, entry.itemNumber);
        const item = itemKeyMap.get(itemKey);
        if (!item) {
          summary.errors.push(`${rowLabel}: Style '${entry.itemNumber}' not found.`);
          continue;
        }

        summary.processedItems += 1;
        summary.updatedItems += 1;

        let itemColors = itemColorCache.get(item.itemId);
        if (!itemColors) {
          const list = await CatalogService.getItemColors({ itemId: item.itemId });
          itemColors = new Map(list.map((color) => [color.colorId, color]));
          itemColorCache.set(item.itemId, itemColors);
        }
        const existingColorIds = new Set(itemColors.keys());

        const colorGroups = buildColorGroups(Array.from(entry.colorNames));
        const desiredPrimaryIds = new Set<number>();
        for (const [primaryNormalized, group] of colorGroups) {
          const primaryId = await resolveComponentColorId(
            group.primaryName,
            primaryNormalized,
            entry.seasonId,
            entry.itemNumber
          );
          if (!primaryId) {
            continue;
          }
          desiredPrimaryIds.add(primaryId);

          const secondaryIds: number[] = [];
          const secondarySet = new Set<number>();
          for (const secondaryName of group.secondaryNames) {
            const secondaryNormalized = normalizeName(secondaryName);
            if (!secondaryNormalized || secondaryNormalized === primaryNormalized) {
              continue;
            }
            const secondaryId = await resolveComponentColorId(
              secondaryName,
              secondaryNormalized,
              entry.seasonId,
              entry.itemNumber
            );
            if (!secondaryId || secondarySet.has(secondaryId)) {
              continue;
            }
            secondarySet.add(secondaryId);
            secondaryIds.push(secondaryId);
          }

          const alreadyLinked = existingColorIds.has(primaryId);
          const shouldUpdateSecondaries = replaceExistingColors || secondaryIds.length > 0;
          const willSaveItemColor = !alreadyLinked || shouldUpdateSecondaries;
          if (willSaveItemColor) {
            await CatalogService.addOrUpdateItemColor({
              itemId: item.itemId,
              colorId: primaryId,
              secondaryColorIds: shouldUpdateSecondaries ? secondaryIds : undefined,
            });
          }

          if (alreadyLinked) {
            if (willSaveItemColor) {
              summary.updatedItemColors += 1;
            } else {
              summary.skippedItemColors += 1;
            }
          } else {
            existingColorIds.add(primaryId);
            summary.createdItemColors += 1;
          }
        }

        if (replaceExistingColors && itemColors.size > 0) {
          for (const [colorId, itemColor] of itemColors.entries()) {
            const shouldBeActive = desiredPrimaryIds.has(colorId);
            const isActive = itemColor.itemColorActive !== false;
            if (shouldBeActive && !isActive) {
              try {
                await CatalogService.setItemColorActive({
                  itemColorId: itemColor.itemColorId,
                  active: true,
                });
                itemColor.itemColorActive = true;
              } catch (err: unknown) {
                summary.errors.push(
                  `${rowLabel}: Could not activate color '${itemColor.colorName}' for style '${entry.itemNumber}'. ${getErrorMessage(err, "Unknown error.")}`
                );
              }
            }
            if (!shouldBeActive && isActive) {
              try {
                await CatalogService.setItemColorActive({
                  itemColorId: itemColor.itemColorId,
                  active: false,
                });
                itemColor.itemColorActive = false;
              } catch (err: unknown) {
                summary.errors.push(
                  `${rowLabel}: Could not remove color '${itemColor.colorName}' from style '${entry.itemNumber}'. ${getErrorMessage(err, "Unknown error.")}`
                );
              }
            }
          }
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
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Upload failed.";
      summary.errors.push(message);
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
