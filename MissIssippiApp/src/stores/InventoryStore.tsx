// src/stores/inventoryStore.ts
import { create } from "zustand";
import { inventoryService } from "../service/InventoryService";
import type { iInventoryCell, iInventoryDisplayRow, iSize } from "../utils/DataInterfaces";

interface InventoryState {
  inventory: iInventoryDisplayRow[];
  sizeColumns: iSize[];
  loading: boolean;
  fetchInventory: () => Promise<void>;
  updateCell: (styleNumber: string, colorName: string, size: string, qty: number) => void;
  saveInventory: (row: iInventoryDisplayRow) => Promise<void>;
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  inventory: [],
  sizeColumns: [],
  loading: true,

  fetchInventory: async () => {
    set({ loading: true });

    try {
      const sizesRaw = await inventoryService.getSizes();
      const inventoryRaw = await inventoryService.getPivotInventory();

      const orderedSizes = [...sizesRaw].sort((a, b) => {
        const seqA = a.sizeSequence ?? 0;
        const seqB = b.sizeSequence ?? 0;
        return seqA - seqB;
      });

      const cleanSizes = orderedSizes.map((s) => ({
        ...s,
        sizeName: (s.sizeName ?? "").trim(),
      }));

      set({ inventory: inventoryRaw, sizeColumns: cleanSizes, loading: false });

    } catch (err) {
      console.error("Inventory fetch error:", err);
      set({ loading: false });
    }
  },

  updateCell: (styleNumber, colorName, size, qty) => {
    set((state) => ({
      inventory: state.inventory.map((row) =>
        row.styleNumber === styleNumber && row.colorName === colorName
          ? { ...row, sizes: { ...row.sizes, [size]: { ...row.sizes[size], qty } } }
          : row
      ),
    }));
  },

  saveInventory: async (row) => {
    try {
      const sizeNames = get().sizeColumns.map((s) => s.sizeName);
      const normalizedRow: iInventoryDisplayRow = {
        ...row,
        sizes: sizeNames.reduce<Record<string, iInventoryCell>>((acc, size) => {
          const cell = row.sizes[size];
          if (cell) {
            acc[size] = {
              qty: Number(cell.qty ?? 0),
              inventoryId: cell.inventoryId,
              sizeId: cell.sizeId,
            };
          }
          return acc;
        }, {}),
      };

      await inventoryService.savePivotInventory([normalizedRow]);
      await get().fetchInventory();
    } catch (err) {
      console.error(err);
      throw err;
    }
  },
}));