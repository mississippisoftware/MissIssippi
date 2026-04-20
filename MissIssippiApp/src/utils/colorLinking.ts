import CatalogService, { type ColorOption } from "../service/CatalogService";
import { normalizeName, splitCompositeColorName } from "../items/itemsColorsUtils";
import { getErrorMessage } from "./errors";

export type NormalizedColorOption = ColorOption & { normalized: string };

export type ColorResolutionLookupEntry = {
  action: "existing" | "new";
  colorId?: number;
  resolvedName: string;
  collection?: string | null;
};

export type ColorResolutionLookup = Record<string, ColorResolutionLookupEntry | undefined>;

export type ColorMetadata = {
  seasonId?: number | null;
  pantoneColor?: string | null;
  hexValue?: string | null;
  collection?: string | null;
};

export type UploadColorResolution = {
  action: "existing" | "new";
  colorId?: number;
  resolvedName: string;
  collection?: string | null;
};

export type UploadColorResolutionMap = Record<string, UploadColorResolution | undefined>;

export type PickExistingColorArgs = {
  matches: ColorOption[];
  normalizedColorName: string;
  seasonId: number;
  collection?: string | null;
};

export type PickExistingColorFn = (args: PickExistingColorArgs) => ColorOption | undefined;

export const pickExistingColor: PickExistingColorFn = ({
  matches,
  normalizedColorName,
  seasonId,
  collection,
}) => {
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

type ResolveCatalogColorIdArgs = {
  componentName: string;
  componentNormalized: string;
  meta: ColorMetadata | null;
  resolutionMap?: ColorResolutionLookup;
  normalizedColors: NormalizedColorOption[];
  createdColorIds: Map<string, number>;
  nextColors: ColorOption[];
};

const upsertColorBuffer = (buffer: ColorOption[], color: ColorOption) => {
  const index = buffer.findIndex((entry) => entry.colorId === color.colorId);
  if (index >= 0) {
    buffer[index] = color;
    return;
  }
  buffer.push(color);
};

const maybeUpdateColorMetadata = async (
  colorId: number,
  fallbackName: string,
  meta: ColorMetadata | null,
  normalizedColors: NormalizedColorOption[],
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

  const existing = normalizedColors.find((entry) => entry.colorId === colorId);
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
    upsertColorBuffer(nextColors, refreshed[0]);
  }
};

export const normalizeColorOptions = (colors: ColorOption[]): NormalizedColorOption[] =>
  colors.map((color) => ({
    ...color,
    normalized: normalizeName(color.colorName),
  }));

export const mergeColorOptions = (current: ColorOption[], updates: ColorOption[]) => {
  if (updates.length === 0) {
    return current;
  }

  const next = [...current];
  updates.forEach((color) => {
    const index = next.findIndex((entry) => entry.colorId === color.colorId);
    if (index >= 0) {
      next[index] = color;
    } else {
      next.push(color);
    }
  });
  return next;
};

export const resolveCatalogColorId = async ({
  componentName,
  componentNormalized,
  meta,
  resolutionMap,
  normalizedColors,
  createdColorIds,
  nextColors,
}: ResolveCatalogColorIdArgs): Promise<number | undefined> => {
  const resolution = resolutionMap?.[componentNormalized];
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
    const exact = normalizedColors.find((entry) => entry.normalized === componentNormalized);
    colorId = exact?.colorId;
  }
  if (!colorId && !resolution) {
    const exact = normalizedColors.find((entry) => entry.normalized === componentNormalized);
    colorId = exact?.colorId;
  }

  if (colorId) {
    if (!wasCreated) {
      await maybeUpdateColorMetadata(colorId, resolvedName, meta, normalizedColors, nextColors);
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
  const match =
    matches.find((entry) => normalizeName(entry.colorName) === componentNormalized) ?? matches[0];
  if (!match) {
    return undefined;
  }

  createdColorIds.set(componentNormalized, match.colorId);
  upsertColorBuffer(nextColors, match);
  return match.colorId;
};

type ResolveUploadColorIdArgs = {
  componentName: string;
  componentNormalized: string;
  seasonId: number;
  itemNumber: string;
  resolutionMap: UploadColorResolutionMap;
  normalizedColors: NormalizedColorOption[];
  createdColorIds: Map<string, number>;
  createdColorNames: Set<string>;
  existingColorNames: Set<string>;
  nextColors: ColorOption[];
  pickExistingColor: PickExistingColorFn;
  addError: (message: string) => void;
};

export const resolveUploadColorId = async ({
  componentName,
  componentNormalized,
  seasonId,
  itemNumber,
  resolutionMap,
  normalizedColors,
  createdColorIds,
  createdColorNames,
  existingColorNames,
  nextColors,
  pickExistingColor,
  addError,
}: ResolveUploadColorIdArgs): Promise<number | undefined> => {
  const resolution = resolutionMap[componentNormalized];
  if (!resolution) {
    addError(`Style '${itemNumber}': Color '${componentName}' has no resolution.`);
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
        addError(`Color '${resolution.resolvedName}' could not be created.`);
        return undefined;
      }
      colorId = match.colorId;
      createdColorIds.set(componentNormalized, colorId);
      upsertColorBuffer(nextColors, match);
      createdColorNames.add(componentNormalized);
      return colorId;
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Upload failed.");
      if (/already exists|conflict/i.test(message)) {
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
            addError(lookupMessage);
          }
        }
      }
      addError(message);
      return undefined;
    }
  }

  if (!createdColorIds.has(componentNormalized) && !createdColorNames.has(componentNormalized)) {
    existingColorNames.add(componentNormalized);
  }

  return colorId;
};

export const buildCompositeColorGroups = (colors: Iterable<string>) => {
  const groups = new Map<string, { primaryName: string; secondaryNames: string[] }>();
  const secondarySeen = new Map<string, Set<string>>();

  for (const rawColor of colors) {
    const parts = splitCompositeColorName(rawColor);
    if (parts.length === 0) {
      continue;
    }

    const primaryName = parts[0];
    const primaryNormalized = normalizeName(primaryName);
    if (!primaryNormalized) {
      continue;
    }

    if (!groups.has(primaryNormalized)) {
      groups.set(primaryNormalized, { primaryName, secondaryNames: [] });
      secondarySeen.set(primaryNormalized, new Set());
    }

    const group = groups.get(primaryNormalized);
    const seen = secondarySeen.get(primaryNormalized);
    if (!group || !seen) {
      continue;
    }

    for (const secondaryName of parts.slice(1)) {
      const secondaryNormalized = normalizeName(secondaryName);
      if (!secondaryNormalized || secondaryNormalized === primaryNormalized || seen.has(secondaryNormalized)) {
        continue;
      }
      seen.add(secondaryNormalized);
      group.secondaryNames.push(secondaryName);
    }
  }

  return groups;
};
