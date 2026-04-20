import type { ColorOption } from "../service/CatalogService";
import { normalizeName } from "../items/itemsColorsUtils";
import {
  resolveCatalogColorId,
  type ColorResolutionLookup,
  type NormalizedColorOption,
} from "./colorLinking";

export type ColorWorkflowMeta = {
  collection: string | null;
  pantoneColor: string | null;
  hexValue: string | null;
};

type BuildColorWorkflowMetaArgs = {
  collection?: string | null;
  pantone?: string | null;
  hex?: string | null;
  requireCollection?: boolean;
};

type ResolveOrCreateColorArgs = {
  name: string;
  collection?: string | null;
  pantone?: string | null;
  hex?: string | null;
  normalizedColors: NormalizedColorOption[];
  resolutionMap?: ColorResolutionLookup;
  createdColorIds?: Map<string, number>;
  nextColors?: ColorOption[];
  requireCollection?: boolean;
};

export const buildColorWorkflowMeta = ({
  collection,
  pantone,
  hex,
  requireCollection = true,
}: BuildColorWorkflowMetaArgs): ColorWorkflowMeta => {
  const collectionValue = (collection ?? "").trim();
  if (requireCollection && !collectionValue) {
    throw new Error("Collection is required.");
  }

  const pantoneValue = (pantone ?? "").trim();
  const rawHex = (hex ?? "").trim();
  const hexValue = rawHex
    ? (rawHex.startsWith("#") ? rawHex.toUpperCase() : `#${rawHex.toUpperCase()}`)
    : "";

  if (hexValue && !/^#[0-9A-F]{6}$/.test(hexValue)) {
    throw new Error("Hex should be 6 characters (for example, #1A2B3C).");
  }

  return {
    collection: collectionValue || null,
    pantoneColor: pantoneValue || null,
    hexValue: hexValue || null,
  };
};

export const resolveOrCreateColor = async ({
  name,
  collection,
  pantone,
  hex,
  normalizedColors,
  resolutionMap,
  createdColorIds,
  nextColors,
  requireCollection = true,
}: ResolveOrCreateColorArgs): Promise<{ colorId: number; normalizedName: string }> => {
  const componentName = name.trim();
  const componentNormalized = normalizeName(componentName);
  if (!componentNormalized) {
    throw new Error("Enter a valid color name.");
  }

  const meta = buildColorWorkflowMeta({
    collection,
    pantone,
    hex,
    requireCollection,
  });

  const localCreatedColorIds = createdColorIds ?? new Map<string, number>();
  const localNextColors = nextColors ?? [];
  const colorId = await resolveCatalogColorId({
    componentName,
    componentNormalized,
    meta,
    resolutionMap,
    normalizedColors,
    createdColorIds: localCreatedColorIds,
    nextColors: localNextColors,
  });

  if (!colorId) {
    throw new Error(`Unable to create or resolve color '${componentName}'.`);
  }

  return {
    colorId,
    normalizedName: componentNormalized,
  };
};
