import { create } from "zustand";
import { InventoryService } from "../service/InventoryService";
import type { iInventoryCell, iInventoryDisplayRow, iSize } from "../utils/DataInterfaces";
import type { InventorySearchFilters } from "../utils/InventorySearchFilters";

interface InventoryEditState {
  results: iInventoryDisplayRow[];
  sizeColumns: iSize[];
  seasons: Array<{ seasonId: number; seasonName: string }>;
  loading: boolean;
  searching: boolean;
  lastFilters?: InventorySearchFilters;
  initializeSizes: () => Promise<void>;
  fetchSeasons: () => Promise<void>;
  search: (filters: InventorySearchFilters) => Promise<iInventoryDisplayRow[]>;
  clearResults: () => void;
  updateCell: (itemNumber: string, colorName: string, size: string, qty: number) => void;
  saveByItem: (itemNumber: string) => Promise<void>;
  discardChanges: () => Promise<void>;
}

export const useInventoryEditStore = create<InventoryEditState>((set, get) => ({
  results: [],
  sizeColumns: [],
  seasons: [],
  loading: true,
  searching: false,

  initializeSizes: async () => {
    if (get().sizeColumns.length > 0) return;

    try {
      const sizesRaw = await InventoryService.getSizes();
      const ordered = [...sizesRaw].sort((a, b) => (a.sizeSequence ?? 0) - (b.sizeSequence ?? 0));
      const cleanSizes = ordered.map((s) => ({ ...s, sizeName: (s.sizeName ?? "").trim() }));
      set({ sizeColumns: cleanSizes, loading: false });
    } catch (err) {
      console.error("Failed to load sizes", err);
      set({ loading: false });
    }
  },

  fetchSeasons: async () => {
    if (get().seasons.length > 0) return;

    try {
      const seasons = await InventoryService.getSeasons();
      const ordered = [...seasons].sort((a, b) => a.seasonName.localeCompare(b.seasonName));
      set({ seasons: ordered });
    } catch (err) {
      console.error("Failed to load seasons", err);
    }
  },

  search: async (filters) => {
    set({ searching: true, lastFilters: filters, loading: false });
    try {
      const data = await InventoryService.searchPivotInventory(filters);
      set({ results: data, searching: false });
      return data;
    } catch (err) {
      console.error("Inventory search failed", err);
      set({ searching: false });
      throw err;
    }
  },

  clearResults: () => {
    set({ results: [], searching: false, lastFilters: undefined });
  },

  updateCell: (itemNumber, colorName, size, qty) => {
    set((state) => ({
      results: state.results.map((row) =>
        row.itemNumber === itemNumber && row.colorName === colorName
          ? {
              ...row,
              sizes: {
                ...row.sizes,
                [size]: {
                  ...row.sizes[size],
                  qty,
                  sizeId:
                    row.sizes[size]?.sizeId ??
                    get().sizeColumns.find((s) => s.sizeName === size)?.sizeId,
                } as iInventoryCell,
              },
            }
          : row
      ),
    }));
  },

  saveByItem: async (itemNumber) => {
    const sizeColumns = get().sizeColumns;
    const rowsForItem = get().results
      .filter((r) => r.itemNumber === itemNumber)
      .map((row) => ({
        ...row,
        sizes: Object.entries(row.sizes).reduce<Record<string, iInventoryCell>>((acc, [sizeName, cell]) => {
          if (!cell) {
            return acc;
          }
          acc[sizeName] = {
            qty: Number(cell.qty ?? 0),
            inventoryId: cell.inventoryId,
            sizeId:
              cell.sizeId ??
              sizeColumns.find((s) => s.sizeName === sizeName)?.sizeId,
          };
          return acc;
        }, {}),
      }));
    if (!rowsForItem.length) return;

    await InventoryService.savePivotInventory(rowsForItem);

    const filters = get().lastFilters;
    if (filters) {
      await get().search(filters);
    }
  },

  discardChanges: async () => {
    const filters = get().lastFilters;
    if (filters) {
      await get().search(filters);
    }
  },
}));

