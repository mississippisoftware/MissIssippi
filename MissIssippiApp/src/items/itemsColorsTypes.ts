import type { ColorOption, ItemColorView, ItemView } from "../service/CatalogService";

export type SeasonOption = { seasonId: number; seasonName: string; active?: boolean | null };

export type UploadItemRow = {
  rowNumber: number;
  seasonName: string;
  itemNumber: string;
  description: string;
  inProduction?: boolean | null;
  wholesalePrice?: number | null;
  retailPrice?: number | null;
  colorNames: string[];
};

export type UploadColorRow = {
  rowNumber: number;
  seasonName: string;
  itemNumber: string;
  colorNames: string[];
};

export type PendingColor = {
  name: string;
  normalized: string;
  componentNames: string[];
  seasonId?: number | null;
  collection?: string | null;
  pantoneColor?: string | null;
  hexValue?: string | null;
};

export type UploadSummary = {
  processedItems: number;
  createdItems: number;
  existingItems: number;
  createdColors: number;
  existingColors: number;
  createdItemColors: number;
  updatedItemColors: number;
  skippedItemColors: number;
  errors: string[];
};

export type ColorUploadSummary = {
  processedItems: number;
  updatedItems: number;
  createdColors: number;
  existingColors: number;
  createdItemColors: number;
  updatedItemColors: number;
  skippedItemColors: number;
  errors: string[];
};

export type ColorResolution = {
  normalized: string;
  inputName: string;
  action: "existing" | "new";
  colorId?: number;
  resolvedName: string;
  collection?: string | null;
};

export type ColorResolutionMap = Record<string, ColorResolution>;

export type ColorReviewItem = {
  inputName: string;
  normalized: string;
  suggestions: Array<ColorOption & { normalized: string }>;
  choice: "new" | "skip" | number;
  resolvedName: string;
  collection: string;
  sourceItems?: string[];
  remember?: boolean;
};

export type ReviewContext =
  | {
      type: "manual";
      baseMap: ColorResolutionMap;
      inputName: string;
      seasonId?: number | null;
      pantoneColor?: string | null;
      hexValue?: string | null;
    }
  | { type: "upload"; baseMap: ColorResolutionMap; rows: UploadItemRow[] }
  | { type: "colorUpload"; baseMap: ColorResolutionMap; rows: UploadColorRow[] };

export type ItemListRow = ItemView & { colors: ItemColorView[] };
