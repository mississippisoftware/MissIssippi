import { useCallback, useEffect, useState } from "react";
import CatalogService, { type CollectionOption, type ColorOption } from "../service/CatalogService";
import { InventoryService, type SeasonRecord } from "../service/InventoryService";
import { getErrorMessage } from "../utils/errors";

type UseCatalogLookupsOptions<TColor> = {
  mapColors?: (colors: ColorOption[], seasons: SeasonRecord[]) => TColor[];
  loadOnMount?: boolean;
  errorMessage?: string;
};

export const useCatalogLookups = <TColor = ColorOption>(
  options: UseCatalogLookupsOptions<TColor> = {}
) => {
  const { mapColors, loadOnMount = true, errorMessage } = options;

  const [seasons, setSeasons] = useState<SeasonRecord[]>([]);
  const [colors, setColors] = useState<TColor[]>([]);
  const [collections, setCollections] = useState<CollectionOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [seasonData, colorData, collectionData] = await Promise.all([
        InventoryService.getSeasons(),
        CatalogService.getColors(),
        CatalogService.getCollections(),
      ]);
      setSeasons(seasonData);
      setCollections(collectionData);
      const mappedColors = mapColors
        ? mapColors(colorData, seasonData)
        : (colorData as unknown as TColor[]);
      setColors(mappedColors);
    } catch (err: unknown) {
      console.error(err);
      setError(getErrorMessage(err, errorMessage ?? "Failed to load catalog lookups."));
    } finally {
      setLoading(false);
    }
  }, [errorMessage, mapColors]);

  useEffect(() => {
    if (!loadOnMount) return;
    refresh();
  }, [loadOnMount, refresh]);

  return {
    seasons,
    setSeasons,
    colors,
    setColors,
    collections,
    setCollections,
    loading,
    error,
    refresh,
  };
};
