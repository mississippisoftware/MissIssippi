import { type Dispatch, type RefObject, type SetStateAction, useEffect, useMemo, useState } from "react";
import { Toast } from "primereact/toast";
import CatalogService, { type ColorOption } from "../../service/CatalogService";
import type {
  ColorResolution,
  ColorResolutionMap,
  ColorReviewItem,
  ItemListRow,
  PendingColor,
  ReviewContext,
  UploadColorRow,
  UploadItemRow,
} from "../../items/itemsColorsTypes";
import { isSimilarName, normalizeName } from "../../items/itemsColorsUtils";
import { useNotifier } from "../../hooks/useNotifier";

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
  const [colorPantoneInput, setColorPantoneInput] = useState("");
  const [colorHexInput, setColorHexInput] = useState("");
  const [colorResolutionMap, setColorResolutionMap] = useState<ColorResolutionMap>({});
  const [colorReviewItems, setColorReviewItems] = useState<ColorReviewItem[]>([]);
  const [reviewContext, setReviewContext] = useState<ReviewContext | null>(null);
  const [showColorReview, setShowColorReview] = useState(false);

  const normalizedColors = useMemo(
    () =>
      colors.map((color) => ({
        ...color,
        normalized: normalizeName(color.colorName),
      })),
    [colors]
  );

  const resetColorInputs = () => {
    setColorInput("");
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
      notify(
        "success",
        "Colors saved",
        `Added ${added} color(s). Skipped ${skipped} existing link(s).`
      );
    } catch (err: any) {
      console.error(err);
      notify("error", "Color save failed", err?.message ?? "Unable to save colors.");
    } finally {
      setSavingColors(false);
    }
  };

  const handleReviewConfirm = async (handlers: ReviewHandlers = {}) => {
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
      await handlers.onColorUploadResolve?.(reviewContext.rows, mergedMap);
      return;
    }

    await handlers.onUploadResolve?.(reviewContext.rows, mergedMap);
  };

  const handleReviewClose = () => {
    setShowColorReview(false);
    setReviewContext(null);
  };

  return {
    normalizedColors,
    colorInput,
    setColorInput,
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
    addPendingColorFromResolution,
    handleAddColor,
    handleSaveColors,
    handleReviewConfirm,
    handleReviewClose,
    closeColorModal,
  };
}
