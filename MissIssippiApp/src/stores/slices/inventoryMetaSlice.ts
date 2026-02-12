import type { StateCreator } from "zustand";
import { InventoryService } from "../../service/InventoryService";
import type { iInventoryDisplayRow, iSize } from "../../utils/DataInterfaces";
import { buildDirtyItemsSet } from "./inventoryRowOpsSlice";

type SeasonOption = { seasonId: number; seasonName: string };

export type InventoryMetaSlice = {
  sizeColumns: iSize[];
  seasons: SeasonOption[];
  sizeLoading: boolean;
  seasonsLoading: boolean;
  sizeError: string | null;
  seasonsError: string | null;
  initializeSizes: (options?: {
    force?: boolean;
    setEditLoading?: boolean;
    throwOnError?: boolean;
  }) => Promise<void>;
  fetchSeasons: () => Promise<void>;
  // InventoryEdit relies on editLoading; keep it on the shared meta slice.
  editLoading: boolean;
};

type InventoryMetaSliceState = InventoryMetaSlice & {
  results?: iInventoryDisplayRow[];
  originalResultsById?: Record<string, iInventoryDisplayRow>;
  dirtyItemsSet?: Set<string>;
};

const getErrorMessage = (err: unknown, fallback: string) =>
  err instanceof Error ? err.message : fallback;

const orderSizes = (sizes: iSize[]) => {
  const cleaned = sizes.map((size) => ({
    ...size,
    sizeName: (size.sizeName ?? "").trim(),
  }));
  return cleaned.sort((a, b) => {
    const seqDiff = (a.sizeSequence ?? 0) - (b.sizeSequence ?? 0);
    if (seqDiff !== 0) return seqDiff;
    return a.sizeName.localeCompare(b.sizeName);
  });
};

const orderSeasons = (seasons: SeasonOption[]) =>
  [...seasons].sort((a, b) => a.seasonName.localeCompare(b.seasonName));

export const createInventoryMetaSlice: StateCreator<
  InventoryMetaSliceState,
  [],
  [],
  InventoryMetaSlice
> = (set, get) => ({
  sizeColumns: [],
  seasons: [],
  sizeLoading: false,
  seasonsLoading: false,
  sizeError: null,
  seasonsError: null,
  editLoading: true,
  initializeSizes: async (options) => {
    const force = options?.force ?? false;
    const setEditLoading = options?.setEditLoading ?? true;
    const throwOnError = options?.throwOnError ?? false;
    if (!force && get().sizeColumns.length > 0) {
      set({
        sizeLoading: false,
        sizeError: null,
        ...(setEditLoading ? { editLoading: false } : {}),
      });
      return;
    }

    set({ sizeLoading: true, sizeError: null });
    try {
      const sizesRaw = await InventoryService.getSizes();
      const cleanSizes = orderSizes(sizesRaw);
      set((state) => ({
        sizeColumns: cleanSizes,
        sizeLoading: false,
        dirtyItemsSet:
          setEditLoading && state.results && state.originalResultsById
            ? buildDirtyItemsSet(state.results, state.originalResultsById, cleanSizes)
            : state.dirtyItemsSet,
        ...(setEditLoading ? { editLoading: false } : {}),
      }));
    } catch (err) {
      console.error("Failed to load sizes", err);
      set({
        sizeLoading: false,
        sizeError: getErrorMessage(err, "Failed to load sizes."),
        ...(setEditLoading ? { editLoading: false } : {}),
      });
      if (throwOnError) {
        throw err;
      }
    }
  },
  fetchSeasons: async () => {
    if (get().seasons.length > 0) return;
    set({ seasonsLoading: true, seasonsError: null });
    try {
      const seasons = await InventoryService.getSeasons();
      set({ seasons: orderSeasons(seasons), seasonsLoading: false });
    } catch (err) {
      console.error("Failed to load seasons", err);
      set({
        seasonsLoading: false,
        seasonsError: getErrorMessage(err, "Failed to load seasons."),
      });
    }
  },
});
