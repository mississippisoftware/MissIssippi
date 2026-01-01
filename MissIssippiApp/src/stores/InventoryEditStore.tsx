import { create } from "zustand";
import { inventoryService, type InventorySearchFilters } from "../service/InventoryService";
import type { iInventoryCell, iInventoryDisplayRow, iSize } from "../utils/DataInterfaces";

interface InventoryEditState {
  results: iInventoryDisplayRow[];
  sizeColumns: iSize[];
  loading: boolean;
  searching: boolean;
  lastFilters?: InventorySearchFilters;
  initializeSizes: () => Promise<void>;
  search: (filters: InventorySearchFilters) => Promise<void>;
  updateCell: (styleNumber: string, colorName: string, size: string, qty: number) => void;
  saveByStyle: (styleNumber: string) => Promise<void>;
}

export const useInventoryEditStore = create<InventoryEditState>((set, get) => ({
  results: [],
  sizeColumns: [],
  loading: true,
  searching: false,

  initializeSizes: async () => {
    if (get().sizeColumns.length > 0) return;

    try {
      const sizesRaw = await inventoryService.getSizes();
      const ordered = [...sizesRaw].sort((a, b) => (a.sizeSequence ?? 0) - (b.sizeSequence ?? 0));
      const cleanSizes = ordered.map((s) => ({ ...s, sizeName: (s.sizeName ?? "").trim() }));
      set({ sizeColumns: cleanSizes, loading: false });
    } catch (err) {
      console.error("Failed to load sizes", err);
      set({ loading: false });
    }
  },

  search: async (filters) => {
    set({ searching: true, lastFilters: filters, loading: false });
    try {
      const data = await inventoryService.searchPivotInventory(filters);
      set({ results: data, searching: false });
    } catch (err) {
      console.error("Inventory search failed", err);
      set({ searching: false });
      throw err;
    }
  },

  updateCell: (styleNumber, colorName, size, qty) => {
    set((state) => ({
      results: state.results.map((row) =>
        row.styleNumber === styleNumber && row.colorName === colorName
          ? { ...row, sizes: { ...row.sizes, [size]: { ...row.sizes[size], qty } as iInventoryCell } }
          : row
      ),
    }));
  },

  saveByStyle: async (styleNumber) => {
    const rowsForStyle = get().results.filter((r) => r.styleNumber === styleNumber);
    if (!rowsForStyle.length) return;

    await inventoryService.savePivotInventory(rowsForStyle);

    const filters = get().lastFilters;
    if (filters) {
      await get().search(filters);
    }
  },
}));
