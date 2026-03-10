import { normalizeName } from "../items/itemsColorsUtils";

export const DEFAULT_COLOR_LIST_SORT_META = [{ field: "colorName", order: 1 as const }];

export const buildColorKey = (name: string, seasonId?: number | null) =>
  `${normalizeName(name)}|${seasonId ?? ""}`;

export const normalizeHex = (value: string) => {
  if (!value) return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed.startsWith("#") ? trimmed.toUpperCase() : `#${trimmed.toUpperCase()}`;
};

export const isHexValid = (value: string) => {
  if (!value) return true;
  const cleaned = value.replace("#", "");
  return cleaned.length === 6;
};

export const getRowNumberFromError = (error: string) => {
  const match = error.match(/Row\s+(\d+):/i);
  if (!match) return null;
  const rowNumber = Number(match[1]);
  return Number.isFinite(rowNumber) ? rowNumber : null;
};

export const normalizeForSimilarity = (value: string) => normalizeName(value || "");

export const isDuplicateUploadError = (error: string) => /already exists|conflict/i.test(error);

