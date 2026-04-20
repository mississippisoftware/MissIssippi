import type { ItemColorView } from "../service/CatalogService";

/**
 * Returns a deduplicated copy of the color list, keeping the first occurrence of each colorId.
 * Insertion order is preserved; callers that need sorted output should sort after calling this.
 */
export const dedupeItemColorsByColorId = (colors: ItemColorView[]): ItemColorView[] => {
  const map = new Map<number, ItemColorView>();
  colors.forEach((color) => {
    if (!map.has(color.colorId)) {
      map.set(color.colorId, color);
    }
  });
  return Array.from(map.values());
};
