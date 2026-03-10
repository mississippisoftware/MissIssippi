import { type Dispatch, type RefObject, type SetStateAction, useEffect, useMemo, useState } from "react";
import { Toast } from "primereact/toast";
import CatalogService, { type ColorOption } from "../../service/CatalogService";
import type {
  ColorResolutionMap,
  ColorReviewItem,
  ItemListRow,
  PendingColor,
  ReviewContext,
  UploadColorRow,
  UploadItemRow,
} from "../../items/itemsColorsTypes";
import { isSimilarName, normalizeName, splitCompositeColorName } from "../../items/itemsColorsUtils";
import { useNotifier } from "../../hooks/useNotifier";

const COLOR_RESOLUTION_MEMORY_KEY = "mississippi.colorResolutionMemory";

type SavedColorResolution = {
  action: "existing" | "new";
  colorId?: number;
  resolvedName: string;
  collection?: string | null;
};

type SavedColorResolutionMap = Record<string, SavedColorResolution>;

type ReviewHandlers = {
  onUploadResolve?: (rows: UploadItemRow[], resolutionMap: ColorResolutionMap) => void | Promise<void>;
  onColorUploadResolve?: (rows: UploadColorRow[], resolutionMap: ColorResolutionMap) => void | Promise<void>;
};

type UseColorResolutionParams = {
  colors: ColorOption[];
  activeColorItem: ItemListRow | null;
  setColors: Dispatch<SetStateAction<ColorOption[]>>;
  loadItemList: () => Promise<ItemListRow[]>;
  toastRef: RefObject<Toast | null>;
  setShowColorModal: Dispatch<SetStateAction<boolean>>;
  setColorModalItem: Dispatch<SetStateAction<ItemListRow | null>>;
};

export function useColorResolution({
  colors,
  activeColorItem,
  setColors,
  loadItemList,
  toastRef,
  setShowColorModal,
  setColorModalItem,
}: UseColorResolutionParams) {
  const notify = useNotifier(toastRef);
  const [colorInput, setColorInput] = useState("");
  const [pendingColors, setPendingColors] = useState<PendingColor[]>([]);
  const [savingColors, setSavingColors] = useState(false);
  const [colorCollectionInput, setColorCollectionInput] = useState("");
  const [colorPantoneInput, setColorPantoneInput] = useState("");
  const [colorHexInput, setColorHexInput] = useState("");
  const [colorResolutionMap, setColorResolutionMap] = useState<ColorResolutionMap>({});
  const [colorReviewItems, setColorReviewItems] = useState<ColorReviewItem[]>([]);
  const [reviewContext, setReviewContext] = useState<ReviewContext | null>(null);
  const [showColorReview, setShowColorReview] = useState(false);
  const [savedResolutions, setSavedResolutions] = useState<SavedColorResolutionMap>({});

  const normalizedColors = useMemo(
    () =>
      colors.map((color) => ({
        ...color,
        normalized: normalizeName(color.colorName),
      })),
    [colors]
  );

  const persistSavedResolutions = (updates: SavedColorResolutionMap) => {
    if (Object.keys(updates).length === 0) return;
    setSavedResolutions((prev) => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem(COLOR_RESOLUTION_MEMORY_KEY, JSON.stringify(next));
      } catch (err) {
        console.warn("Unable to save color resolutions", err);
      }
      return next;
    });
  };

  const getSavedResolution = (normalized: string) => {
    const saved = savedResolutions[normalized];
    if (!saved) return null;
    const exact = normalizedColors.find((item) => item.normalized === normalized);
    if (saved.action === "new" && exact) {
      return {
        action: "existing" as const,
        colorId: exact.colorId,
        resolvedName: exact.colorName,
        collection: exact.collection ?? saved.collection ?? null,
      };
    }
    if (saved.action === "existing") {
      if (!saved.colorId) {
        if (!exact) return null;
        return {
          action: "existing" as const,
          colorId: exact.colorId,
          resolvedName: exact.colorName,
          collection: exact.collection ?? saved.collection ?? null,
        };
      }
      const exists = normalizedColors.some((item) => item.colorId === saved.colorId);
      if (!exists) {
        if (!exact) return null;
        return {
          action: "existing" as const,
          colorId: exact.colorId,
          resolvedName: exact.colorName,
          collection: exact.collection ?? saved.collection ?? null,
        };
      }
    }
    return saved;
  };
  const resetColorInputs = () => {
    setColorInput("");
    setColorCollectionInput("");
    setColorPantoneInput("");
    setColorHexInput("");
  };

  const closeColorModal = () => {
    setShowColorModal(false);
    setColorModalItem(null);
    setPendingColors([]);
    resetColorInputs();
  };

  useEffect(() => {
    setPendingColors([]);
    resetColorInputs();
  }, [activeColorItem?.itemId]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(COLOR_RESOLUTION_MEMORY_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as SavedColorResolutionMap;
      if (!parsed || typeof parsed !== "object") return;
      const next: SavedColorResolutionMap = {};
      Object.entries(parsed).forEach(([key, value]) => {
        if (!key || !value || typeof value !== "object") return;
        const action = (value as SavedColorResolution).action;
        if (action === "existing") {
          const colorId = Number((value as SavedColorResolution).colorId);
          const resolvedName =
            typeof (value as SavedColorResolution).resolvedName === "string"
              ? (value as SavedColorResolution).resolvedName
              : "";
          if (!Number.isFinite(colorId) || colorId <= 0 || !resolvedName) return;
          next[key] = {
            action,
            colorId,
            resolvedName,
            collection:
              typeof (value as SavedColorResolution).collection === "string"
                ? (value as SavedColorResolution).collection
                : null,
          };
        } else if (action === "new") {
          const resolvedName =
            typeof (value as SavedColorResolution).resolvedName === "string"
              ? (value as SavedColorResolution).resolvedName
              : "";
          if (!resolvedName) return;
          next[key] = {
            action,
            resolvedName,
            collection:
              typeof (value as SavedColorResolution).collection === "string"
                ? (value as SavedColorResolution).collection
                : null,
          };
        }
      });
      setSavedResolutions(next);
    } catch (err) {
      console.warn("Unable to load saved color resolutions", err);
    }
  }, []);

  const buildColorResolutions = (
    names: string[],
    baseMap: ColorResolutionMap,
    options?: {
      reviewAllNew?: boolean;
      sourcesByName?: Map<string, string[]>;
      defaultCollection?: string;
    }
  ) => {
    const nextMap: ColorResolutionMap = {};
    const reviewItems: ColorReviewItem[] = [];
    const seen = new Set<string>();
    const expandedNames = names.flatMap((name) => splitCompositeColorName(name));

    expandedNames.forEach((name) => {
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

      const saved = getSavedResolution(normalized);
      if (saved) {
        nextMap[normalized] = {
          normalized,
          inputName: name,
          action: saved.action,
          colorId: saved.colorId,
          resolvedName: saved.resolvedName,
          collection: saved.collection ?? null,
        };
        return;
      }

      const suggestions = normalizedColors.filter((color) => isSimilarName(normalized, color.normalized));
      const shouldReview = suggestions.length > 0 || options?.reviewAllNew;
      if (shouldReview) {
        reviewItems.push({
          inputName: name,
          normalized,
          suggestions,
          choice: "new",
          resolvedName: name,
          collection: options?.defaultCollection ?? "",
          remember: false,
          sourceItems: options?.sourcesByName?.get(normalized),
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

  const addPendingColor = (
    name: string,
    meta?: {
      seasonId?: number | null;
      pantoneColor?: string | null;
      hexValue?: string | null;
      collection?: string | null;
    }
  ) => {
    const normalized = normalizeName(name);
    if (!normalized) return;
    const seenParts = new Set<string>();
    const componentNames = splitCompositeColorName(name).filter((part) => {
      const key = normalizeName(part);
      if (!key || seenParts.has(key)) return false;
      seenParts.add(key);
      return true;
    });
    if (componentNames.length === 0) return;
    setPendingColors((prev) => {
      if (prev.some((item) => item.normalized === normalized)) {
        return prev;
      }
      return [
        ...prev,
        {
          name,
          normalized,
          componentNames,
          seasonId: meta?.seasonId ?? null,
          collection: meta?.collection ?? null,
          pantoneColor: meta?.pantoneColor ?? null,
          hexValue: meta?.hexValue ?? null,
        },
      ];
    });
    resetColorInputs();
  };

  const handleAddColor = () => {
    if (!activeColorItem || activeColorItem.itemId <= 0) {
      notify("warn", "Save the style first", "Save the style before adding colors.");
      return;
    }

    const name = colorInput.trim();
    if (!name) return;

    const normalized = normalizeName(name);
    if (pendingColors.some((color) => color.normalized === normalized)) {
      notify("warn", "Duplicate color", "That color is already added.");
      return;
    }

    const rawCollection = colorCollectionInput.trim();
    if (!rawCollection) {
      notify("warn", "Collection required", "Select a collection for this color.");
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
      notify("warn", "Hex format", "Hex should be 6 characters (for example, #1A2B3C).");
      return;
    }

    const meta = {
      seasonId: activeColorItem.seasonId,
      collection: rawCollection || null,
      pantoneColor: rawPantone || null,
      hexValue: normalizedHex || null,
    };

    const { nextMap, reviewItems } = buildColorResolutions([name], colorResolutionMap, {
      defaultCollection: rawCollection,
    });
    const mergedMap = { ...colorResolutionMap, ...nextMap };

    if (reviewItems.length) {
      setColorReviewItems(reviewItems);
      setReviewContext({ type: "manual", baseMap: mergedMap, inputName: name, ...meta });
      setShowColorReview(true);
      return;
    }

    setColorResolutionMap(mergedMap);
    addPendingColor(name, meta);
  };

  const maybeUpdateColorMetadata = async (
    colorId: number,
    fallbackName: string,
    meta: {
      seasonId?: number | null;
      pantoneColor?: string | null;
      hexValue?: string | null;
      collection?: string | null;
    } | null,
    nextColors: ColorOption[]
  ) => {
    if (!meta) return;
    const desiredSeasonId = meta.seasonId ?? null;
    const desiredPantone = meta.pantoneColor?.trim() || null;
    const desiredHex = meta.hexValue?.trim() || null;
    const desiredCollection = meta.collection?.trim() || null;
    if (!desiredSeasonId && !desiredPantone && !desiredHex && !desiredCollection) {
      return;
    }

    const existing = normalizedColors.find((item) => item.colorId === colorId);
    const shouldUpdate =
      (desiredSeasonId && existing?.seasonId == null) ||
      (desiredPantone && !existing?.pantoneColor) ||
      (desiredHex && !existing?.hexValue) ||
      (desiredCollection && !existing?.collection);

    if (!shouldUpdate) {
      return;
    }

    const nextSeasonId = existing?.seasonId ?? desiredSeasonId ?? null;
    const nextPantone = existing?.pantoneColor ?? desiredPantone ?? null;
    const nextHex = existing?.hexValue ?? desiredHex ?? null;
    const nextCollection = existing?.collection ?? desiredCollection ?? null;

    await CatalogService.addOrUpdateColor({
      colorId,
      colorName: existing?.colorName ?? fallbackName,
      seasonId: nextSeasonId ?? undefined,
      collection: nextCollection ?? undefined,
      pantoneColor: nextPantone ?? undefined,
      hexValue: nextHex ?? undefined,
    });
    const refreshed = await CatalogService.getColors({ colorId });
    if (refreshed[0]) {
      nextColors.push(refreshed[0]);
    }
  };

  const resolveComponentColorId = async (
    componentName: string,
    componentNormalized: string,
    meta: {
      seasonId?: number | null;
      pantoneColor?: string | null;
      hexValue?: string | null;
      collection?: string | null;
    } | null,
    createdColorIds: Map<string, number>,
    nextColors: ColorOption[]
  ) => {
    const resolution = colorResolutionMap[componentNormalized];
    const resolvedName = resolution?.resolvedName ?? componentName;

    let colorId = resolution?.colorId;
    if (!colorId) {
      const cached = createdColorIds.get(componentNormalized);
      if (cached) {
        colorId = cached;
      }
    }
    const wasCreated = createdColorIds.has(componentNormalized);
    if (!colorId && resolution?.action === "existing") {
      const exact = normalizedColors.find((item) => item.normalized === componentNormalized);
      colorId = exact?.colorId;
    }
    if (!colorId && !resolution) {
      const exact = normalizedColors.find((item) => item.normalized === componentNormalized);
      colorId = exact?.colorId;
    }

    if (colorId) {
      if (!wasCreated) {
        await maybeUpdateColorMetadata(colorId, resolvedName, meta, nextColors);
      }
      return colorId;
    }

    await CatalogService.addOrUpdateColor({
      colorName: resolvedName,
      seasonId: meta?.seasonId ?? undefined,
      pantoneColor: meta?.pantoneColor ?? undefined,
      hexValue: meta?.hexValue ?? undefined,
      collection: resolution?.collection ?? meta?.collection ?? undefined,
    });
    const matches = await CatalogService.getColors({ colorName: resolvedName });
    const match = matches.find((item) => normalizeName(item.colorName) === componentNormalized);
    if (!match) return undefined;

    createdColorIds.set(componentNormalized, match.colorId);
    nextColors.push(match);
    return match.colorId;
  };

  const handleSaveColors = async () => {
    if (!activeColorItem || activeColorItem.itemId <= 0) {
      notify("warn", "Save the style first", "Save the style before adding colors.");
      return;
    }
    if (pendingColors.length === 0) {
      notify("info", "No colors", "Add colors before saving.");
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
        const parts = color.componentNames;
        if (parts.length === 0) {
          continue;
        }

        const primaryName = parts[0];
        const primaryNormalized = normalizeName(primaryName);
        if (!primaryNormalized) {
          continue;
        }

        const primaryMeta = {
          seasonId: color.seasonId ?? null,
          collection: color.collection ?? null,
          pantoneColor: color.pantoneColor ?? null,
          hexValue: color.hexValue ?? null,
        };

        const primaryId = await resolveComponentColorId(
          primaryName,
          primaryNormalized,
          primaryMeta,
          createdColorIds,
          newColors
        );
        if (!primaryId) {
          continue;
        }

        const secondaryIds: number[] = [];
        const secondarySet = new Set<number>();
        for (const secondaryName of parts.slice(1)) {
          const secondaryNormalized = normalizeName(secondaryName);
          if (!secondaryNormalized || secondaryNormalized === primaryNormalized) {
            continue;
          }
          const secondaryMeta = {
            seasonId: color.seasonId ?? null,
            collection: color.collection ?? null,
            pantoneColor: null,
            hexValue: null,
          };
          const secondaryId = await resolveComponentColorId(
            secondaryName,
            secondaryNormalized,
            secondaryMeta,
            createdColorIds,
            newColors
          );
          if (!secondaryId || secondarySet.has(secondaryId)) {
            continue;
          }
          secondarySet.add(secondaryId);
          secondaryIds.push(secondaryId);
        }

        const alreadyLinked = existingColorIds.has(primaryId);
        await CatalogService.addOrUpdateItemColor({
          itemId: activeColorItem.itemId,
          colorId: primaryId,
          secondaryColorIds: secondaryIds.length > 0 ? secondaryIds : undefined,
        });

        if (alreadyLinked) {
          skipped += 1;
        } else {
          existingColorIds.add(primaryId);
          added += 1;
        }
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
      notify(
        "success",
        "Colors saved",
        `Added ${added} color(s). Skipped ${skipped} existing link(s).`
      );
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Unable to save colors.";
      notify("error", "Color save failed", message);
    } finally {
      setSavingColors(false);
    }
  };

  const clearReviewState = () => {
    setColorReviewItems([]);
    setReviewContext(null);
    setShowColorReview(false);
  };

  const handleReviewConfirm = async (handlers: ReviewHandlers = {}) => {
    if (!reviewContext) return;

    const resolvedSelections: ColorResolutionMap = {};
    const skipped = new Set<string>();
    colorReviewItems.forEach((item) => {
      if (item.choice === "skip") {
        skipped.add(item.normalized);
        return;
      }
      if (item.choice === "new") {
        resolvedSelections[item.normalized] = {
          normalized: item.normalized,
          inputName: item.inputName,
          action: "new",
          resolvedName: item.resolvedName.trim() || item.inputName,
          collection: item.collection.trim() || null,
        };
      } else {
        const match =
          item.suggestions.find((suggestion) => suggestion.colorId === item.choice) ??
          normalizedColors.find((color) => color.colorId === item.choice);
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

    const remembered: SavedColorResolutionMap = {};
    colorReviewItems.forEach((item) => {
      if (!item.remember || item.choice === "skip") {
        return;
      }
      if (item.choice === "new") {
        const resolvedName = item.resolvedName.trim() || item.inputName;
        if (!resolvedName) return;
        remembered[item.normalized] = {
          action: "new",
          resolvedName,
          collection: item.collection.trim() || null,
        };
        return;
      }
      const match =
        item.suggestions.find((suggestion) => suggestion.colorId === item.choice) ??
        normalizedColors.find((color) => color.colorId === item.choice);
      if (!match) return;
      remembered[item.normalized] = {
        action: "existing",
        colorId: match.colorId,
        resolvedName: match.colorName,
      };
    });
    persistSavedResolutions(remembered);

    const mergedMap = { ...reviewContext.baseMap, ...resolvedSelections };
    setColorResolutionMap(mergedMap);

    const applySkip = <T extends { colorNames: string[] }>(rows: T[]) => {
      if (skipped.size === 0) return rows;
      return rows.map((row) => ({
        ...row,
        colorNames: row.colorNames.filter((colorName) => {
          const parts = splitCompositeColorName(colorName);
          return !parts.some((part) => skipped.has(normalizeName(part)));
        }),
      }));
    };

    if (reviewContext.type === "manual") {
      const normalizedInput = normalizeName(reviewContext.inputName);
      const manualItem = colorReviewItems.find((item) => item.normalized === normalizedInput);
      if (manualItem?.choice === "skip") {
        clearReviewState();
        return;
      }
      addPendingColor(manualItem?.resolvedName ?? reviewContext.inputName, {
        seasonId: reviewContext.seasonId ?? null,
        collection: manualItem?.collection ?? null,
        pantoneColor: reviewContext.pantoneColor ?? null,
        hexValue: reviewContext.hexValue ?? null,
      });
      clearReviewState();
      return;
    }

    if (reviewContext.type === "colorUpload") {
      const filteredRows = applySkip(reviewContext.rows);
      await handlers.onColorUploadResolve?.(filteredRows, mergedMap);
      clearReviewState();
      return;
    }

    const filteredRows = applySkip(reviewContext.rows);
    await handlers.onUploadResolve?.(filteredRows, mergedMap);
    clearReviewState();
  };

  const handleReviewClose = () => {
    clearReviewState();
  };

  return {
    normalizedColors,
    colorInput,
    setColorInput,
    colorCollectionInput,
    setColorCollectionInput,
    colorPantoneInput,
    setColorPantoneInput,
    colorHexInput,
    setColorHexInput,
    pendingColors,
    setPendingColors,
    savingColors,
    colorResolutionMap,
    setColorResolutionMap,
    colorReviewItems,
    setColorReviewItems,
    reviewContext,
    setReviewContext,
    showColorReview,
    setShowColorReview,
    buildColorResolutions,
    addPendingColor,
    handleAddColor,
    handleSaveColors,
    handleReviewConfirm,
    handleReviewClose,
    closeColorModal,
  };
}
