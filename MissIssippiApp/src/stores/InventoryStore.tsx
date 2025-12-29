// src/stores/inventoryStore.ts
import { create } from "zustand";
import { inventoryService } from "../service/InventoryService";
import type { iInventoryDisplayRow, iSize, iInventoryUpdate } from "../utils/DataInterfaces";

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
      console.log("Sizes from API:", sizesRaw);
      const inventoryRaw = await inventoryService.getInventory();
      console.log("Inventory from API:", inventoryRaw);

      // Ensure the right field names
      // If your API returns SizeSequence (PascalCase), adjust here:
      const orderedSizes = [...sizesRaw].sort((a, b) => {
        const seqA = a.sizeSequence ?? a.sizeSequence ?? 0;
        const seqB = b.sizeSequence ?? b.sizeSequence ?? 0;
        return seqA - seqB;
      });

      // Optional: trim size names (prevents mismatch)
      const cleanSizes = orderedSizes.map((s) => ({
        ...s,
        SizeName: (s.sizeName ?? s.sizeName ?? "").trim(),
      }));

      set({
        inventory: inventoryRaw,
        sizeColumns: cleanSizes,
        loading: false,
      });

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
      const updates: iInventoryUpdate[] = sizeNames
        .map((size) => {
          const cell = row.sizes[size];
          if (!cell) return null;
          return {
            styleNumber: row.styleNumber,
            colorName: row.colorName,
            seasonName: row.seasonName || "",
            sizeName: size,
            inventoryId: cell.inventoryId,
            styleColorId: row.styleColorId,
            styleId: row.styleId,
            colorId: row.colorId,
            sizeId: cell.sizeId,
            qty: Number(cell.qty) ?? 0,
          };
        })
        .filter(Boolean) as iInventoryUpdate[];

      await inventoryService.saveInventory(updates);
      await get().fetchInventory();
    } catch (err) {
      console.error(err);
      throw err;
    }
  },
}));