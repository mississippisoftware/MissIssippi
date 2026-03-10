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
import { isSimilarName, MAX_COLOR_COLUMNS, normalizeName, splitCompositeColorName } from "../../items/itemsColorsUtils";
import { useXlsxUploadParser } from "../../hooks/useXlsxUpload";
import { getErrorMessage } from "../../utils/errors";
import { appendSheet, createWorkbook, saveWorkbook, sheetFromAoa } from "../../utils/xlsxUtils";
import { findHeaderIndex, normalizeHeaders, parseOptionalNumber } from "../../utils/xlsxParse";

type UseItemUploadParams = {
  seasons: SeasonOption[];
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

const IN_PRODUCTION_HEADER_CANDIDATES = [
  "inproduction",
  "in production",
  "active",
  "is active",
  "status",
];

type ItemUploadParseContext = {
  seasonIndex: number;
  itemIndex: number;
  descriptionIndex: number;
  inProductionIndex: number;
  wholesaleIndex: number;
  retailIndex: number;
  colorIndexes: number[];
  defaultSeasonName: string;
  seasonNameToId: Map<string, number>;
};

const parseInProductionValue = (value: unknown): boolean | null | "invalid" => {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (!normalized) return null;
  if (
    ["1", "true", "t", "yes", "y", "active", "in production", "inproduction", "on"].includes(
      normalized
    )
  ) {
    return true;
  }
  if (
    ["0", "false", "f", "no", "n", "inactive", "out of production", "outofproduction", "off"].includes(
      normalized
    )
  ) {
    return false;
  }
  return "invalid";
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
  const MISSING_DEFAULT_SEASON_ERROR = "Please choose a default season for this file before uploading.";
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
  const buildSourcesByName = (rows: UploadItemRow[]) => {
    const sourcesByName = new Map<string, string[]>();
    const sourceSets = new Map<string, Set<string>>();
    rows.forEach((row) => {
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
    return sourcesByName;
  };
  const buildConflictReviewItems = (rows: UploadItemRow[], conflictNames: Map<string, string>) => {
    const sourcesByName = buildSourcesByName(rows);
    return Array.from(conflictNames.entries()).map(([normalized, inputName]) => {
      const suggestions = normalizedColors.filter((color) => isSimilarName(normalized, color.normalized));
      const exact = normalizedColors.find((color) => color.normalized === normalized);
      if (exact && !suggestions.some((item) => item.colorId === exact.colorId)) {
        suggestions.unshift(exact);
      }
      return {
        inputName,
        normalized,
        suggestions,
        choice: "new" as const,
        resolvedName: inputName,
        collection: "",
        sourceItems: sourcesByName.get(normalized),
      };
    });
  };
  const [defaultSeasonId, setDefaultSeasonId] = useState("");
  const [fileName, setFileName] = useState("");
  const [uploadRows, setUploadRows] = useState<UploadItemRow[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [requiresSeasonSelection, setRequiresSeasonSelection] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadSummary, setUploadSummary] = useState<UploadSummary | null>(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateRows, setDuplicateRows] = useState<UploadItemRow[]>([]);
  const [updateExistingItems, setUpdateExistingItems] = useState(false);

  const handleDefaultSeasonIdChange = (value: string) => {
    setDefaultSeasonId(value);
    setParseErrors((prev) =>
      prev.filter((error) => error !== MISSING_DEFAULT_SEASON_ERROR)
    );
  };

  const handleDownloadTemplate = () => {
    const headers = [
      "Season",
      "Style Number",
      "Description",
      "InProduction",
      "Wholesale",
      "Retail",
      ...Array.from({ length: MAX_COLOR_COLUMNS }, (_, i) => `Color ${i + 1}`),
    ];
    const worksheet = sheetFromAoa([headers]);
    const workbook = createWorkbook();
    appendSheet(workbook, worksheet, "Item List");
    saveWorkbook(workbook, "item_list_template");
  };

  const { parseFile: parseItemUploadFile } = useXlsxUploadParser<UploadItemRow, ItemUploadParseContext>({
    buildParseContext: (headerRow) => {
      const normalizedHeaders = normalizeHeaders(headerRow);

      const seasonIndex = findHeaderIndex(normalizedHeaders, ["season", "season name", "seasonname"]);
      const itemIndex = findHeaderIndex(normalizedHeaders, ITEM_NUMBER_HEADER_CANDIDATES);
      const descriptionIndex = findHeaderIndex(normalizedHeaders, ["description", "desc"]);
      const inProductionIndex = findHeaderIndex(normalizedHeaders, IN_PRODUCTION_HEADER_CANDIDATES);
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
        itemIndex < 0 ? "Style Number" : null,
        descriptionIndex < 0 ? "Description" : null,
        colorIndexes.length === 0 ? "Color columns" : null,
      ].filter(Boolean);

      const defaultSeasonName = defaultSeasonId
        ? seasons.find((season) => String(season.seasonId) === defaultSeasonId)?.seasonName ?? ""
        : "";

      const context: ItemUploadParseContext = {
        seasonIndex,
        itemIndex,
        descriptionIndex,
        inProductionIndex,
        wholesaleIndex,
        retailIndex,
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
      const description = context.descriptionIndex >= 0 ? String(values[context.descriptionIndex] ?? "").trim() : "";
      const inProductionParsed =
        context.inProductionIndex >= 0 ? parseInProductionValue(values[context.inProductionIndex]) : null;
      const wholesalePrice = context.wholesaleIndex >= 0 ? parseOptionalNumber(values[context.wholesaleIndex]) : null;
      const retailPrice = context.retailIndex >= 0 ? parseOptionalNumber(values[context.retailIndex]) : null;
      const colorNames = context.colorIndexes
        .map((index) => String(values[index] ?? "").trim())
        .filter(Boolean);

      if (!seasonName && !itemNumber && !description && colorNames.length === 0) {
        return { skip: true };
      }

      const errors: string[] = [];
      if (context.seasonIndex >= 0 && !seasonName) {
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
      if (context.inProductionIndex >= 0 && inProductionParsed === null) {
        errors.push(`Row ${rowNumber}: InProduction is required when the column is provided.`);
      }
      if (inProductionParsed === "invalid") {
        errors.push(
          `Row ${rowNumber}: InProduction value is invalid. Use Yes/No, True/False, Active/Inactive, or 1/0.`
        );
      }

      const uniqueColors = Array.from(new Map(colorNames.map((name) => [normalizeName(name), name])).values());

      return {
        row: {
          rowNumber,
          seasonName,
          itemNumber,
          description,
          inProduction: inProductionParsed === "invalid" ? null : inProductionParsed,
          wholesalePrice,
          retailPrice,
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
      }
      return errors;
    },
    getReadErrorMessage: (err) => `Failed to read file: ${getErrorMessage(err, "Unknown error")}`,
  });

  const handleUploadFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setFileName("");
      setUploadRows([]);
      setParseErrors([]);
      setRequiresSeasonSelection(false);
      setUploadSummary(null);
      setDuplicateRows([]);
      setShowDuplicateModal(false);
      return;
    }

    setFileName(file.name);
    setUploadRows([]);
    setParseErrors([]);
    setRequiresSeasonSelection(false);
    setUploadSummary(null);
    setDuplicateRows([]);
    setShowDuplicateModal(false);

    const result = await parseItemUploadFile(file);
    setRequiresSeasonSelection((result.context?.seasonIndex ?? -1) < 0);
    setUploadRows(result.rows);
    setParseErrors([...result.errors, ...result.warnings]);
  };

  const handlePrepareUpload = async (options?: { ignoreDuplicatePrompt?: boolean; updateExisting?: boolean }) => {
    if (uploadRows.length === 0 || parseErrors.length > 0) {
      return;
    }

    const selectedDefaultSeasonName = defaultSeasonId
      ? seasons.find((season) => String(season.seasonId) === defaultSeasonId)?.seasonName ?? ""
      : "";
    if (requiresSeasonSelection && !selectedDefaultSeasonName) {
      setParseErrors([MISSING_DEFAULT_SEASON_ERROR]);
      return;
    }

    const effectiveRows = uploadRows.map((row) => ({
      ...row,
      seasonName: row.seasonName?.trim() ? row.seasonName : selectedDefaultSeasonName,
    }));

    const updateExisting = options?.updateExisting ?? updateExistingItems;
    const ignoreDuplicatePrompt = options?.ignoreDuplicatePrompt ?? false;

    const duplicates = effectiveRows.filter((row) => {
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
      new Set(effectiveRows.flatMap((row) => row.colorNames.map((name) => name.trim())).filter(Boolean))
    );
    const sourcesByName = buildSourcesByName(effectiveRows);

    const { nextMap, reviewItems } = buildColorResolutions(uniqueColors, colorResolutionMap, {
      sourcesByName,
    });
    const baseMap = { ...colorResolutionMap, ...nextMap };

    if (reviewItems.length > 0) {
      setColorReviewItems(reviewItems);
      setReviewContext({ type: "upload", baseMap, rows: effectiveRows });
      setShowColorReview(true);
      return;
    }

    setColorResolutionMap(baseMap);
    await executeUpload(effectiveRows, baseMap, { updateExisting });
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
      updatedItemColors: 0,
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
    const itemColorCache = new Map<
      number,
      { list: ItemListRow["colors"]; byColorId: Map<number, ItemListRow["colors"][number]>; colorIds: Set<number> }
    >();

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

    const buildColorGroups = (colors: Set<string>) => {
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
      const itemMap = new Map<
        string,
        UploadItemRow & { seasonId: number; colors: Set<string>; rowNumbers: number[] }
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
            rowNumbers: [row.rowNumber],
          });
        }
        const entry = itemMap.get(itemKey);
        if (!entry) return;
        if (!entry.rowNumbers.includes(row.rowNumber)) {
          entry.rowNumbers.push(row.rowNumber);
        }
        if (entry.wholesalePrice == null && row.wholesalePrice != null) {
          entry.wholesalePrice = row.wholesalePrice;
        }
        if (entry.retailPrice == null && row.retailPrice != null) {
          entry.retailPrice = row.retailPrice;
        }
        if (entry.inProduction == null && row.inProduction != null) {
          entry.inProduction = row.inProduction;
        } else if (
          entry.inProduction != null &&
          row.inProduction != null &&
          entry.inProduction !== row.inProduction
        ) {
          summary.errors.push(
            `Rows ${Array.from(new Set(entry.rowNumbers)).join(", ")}: Conflicting InProduction values for style '${entry.itemNumber}'.`
          );
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
            inProduction: entry.inProduction ?? false,
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
        const shouldSyncStatus = entry.inProduction != null;
        if (origin === "existing" && (options.updateExisting || shouldSyncStatus)) {
          const nextInProduction = entry.inProduction ?? item.inProduction ?? false;
          await CatalogService.addOrUpdateItem({
            itemId: item.itemId,
            itemNumber: options.updateExisting ? entry.itemNumber.trim() : item.itemNumber,
            description: options.updateExisting
              ? entry.description.trim()
              : (item.description ?? entry.description).trim(),
            seasonId: options.updateExisting ? entry.seasonId : item.seasonId,
            wholesalePrice: options.updateExisting
              ? entry.wholesalePrice ?? undefined
              : item.wholesalePrice ?? undefined,
            costPrice: options.updateExisting ? entry.retailPrice ?? undefined : item.costPrice ?? undefined,
            inProduction: nextInProduction,
          });
          item = { ...item, inProduction: nextInProduction };
        }
        summary.processedItems += 1;
        if (!existingItemKeys.has(itemKey) && !createdItemKeys.has(itemKey)) {
          if (origin === "created") {
            createdItemKeys.add(itemKey);
          } else {
            existingItemKeys.add(itemKey);
          }
        }

        let cachedColors = itemColorCache.get(item.itemId);
        if (!cachedColors) {
          const list = await CatalogService.getItemColors({ itemId: item.itemId });
          const byColorId = new Map<number, ItemListRow["colors"][number]>();
          list.forEach((color) => {
            byColorId.set(color.colorId, color);
          });
          cachedColors = { list, byColorId, colorIds: new Set(list.map((color) => color.colorId)) };
          itemColorCache.set(item.itemId, cachedColors);
        }
        const existingColorIds = cachedColors.colorIds;

        const colorGroups = buildColorGroups(entry.colors);
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
          const shouldSyncSecondaries = options.updateExisting || secondaryIds.length > 0;
          const willSaveItemColor = !alreadyLinked || shouldSyncSecondaries;
          if (willSaveItemColor) {
            await CatalogService.addOrUpdateItemColor({
              itemId: item.itemId,
              colorId: primaryId,
              secondaryColorIds: shouldSyncSecondaries ? secondaryIds : undefined,
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

          if (options.updateExisting) {
            const existingColor = cachedColors.byColorId.get(primaryId);
            if (existingColor?.itemColorActive === false) {
              try {
                await CatalogService.setItemColorActive({
                  itemColorId: existingColor.itemColorId,
                  active: true,
                });
                existingColor.itemColorActive = true;
              } catch (err: unknown) {
                summary.errors.push(
                  `Style '${entry.itemNumber}': Could not activate color '${existingColor.colorName}'. ${getErrorMessage(err, "Unknown error.")}`
                );
              }
            }
          }
        }

        if (options.updateExisting) {
          const toDeactivate = cachedColors.list.filter((color) => !desiredPrimaryIds.has(color.colorId));
          for (const color of toDeactivate) {
            if (color.itemColorActive !== false) {
              try {
                await CatalogService.setItemColorActive({ itemColorId: color.itemColorId, active: false });
                color.itemColorActive = false;
              } catch (err: unknown) {
                summary.errors.push(
                  `Style '${entry.itemNumber}': Could not remove color '${color.colorName}'. ${getErrorMessage(err, "Unknown error.")}`
                );
              }
            }
          }
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
      if (summary.errors.length > 0) {
        const conflictNames = new Map<string, string>();
        summary.errors.forEach((error) => {
          const conflictName = getConflictName(error);
          if (conflictName) {
            conflictNames.set(normalizeName(conflictName), conflictName);
          }
        });
        if (conflictNames.size > 0) {
          const baseMap = { ...resolutionMap };
          conflictNames.forEach((_, key) => {
            delete baseMap[key];
          });
          const reviewItems = buildConflictReviewItems(rows, conflictNames);
          setColorReviewItems(reviewItems);
          setReviewContext({ type: "upload", baseMap, rows });
          setShowColorReview(true);
        }
      }
      await loadItemList();
    } catch (err: unknown) {
      console.error(err);
      summary.errors.push(getErrorMessage(err, "Upload failed."));
      setUploadSummary(summary);
      const conflictName = getConflictName(summary.errors[summary.errors.length - 1] ?? "");
      if (conflictName) {
        const conflictNames = new Map<string, string>();
        conflictNames.set(normalizeName(conflictName), conflictName);
        const baseMap = { ...resolutionMap };
        conflictNames.forEach((_, key) => {
          delete baseMap[key];
        });
        const reviewItems = buildConflictReviewItems(rows, conflictNames);
        setColorReviewItems(reviewItems);
        setReviewContext({ type: "upload", baseMap, rows });
        setShowColorReview(true);
      }
    } finally {
      setUploading(false);
    }
  };

  return {
    defaultSeasonId,
    setDefaultSeasonId: handleDefaultSeasonIdChange,
    fileName,
    uploadRows,
    parseErrors,
    requiresSeasonSelection,
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
