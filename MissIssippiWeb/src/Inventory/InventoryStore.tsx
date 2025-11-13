import { create } from "zustand";
import type { iInventoryDisplayRow, iInventoryCell, iSize, iInventoryUpdate } from "../DataInterfaces";

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
      const sizeRes = await fetch("https://localhost:7006/api/Sizes/GetSizes");
      const sizesData: iSize[] = await sizeRes.json();
      const sortedSizes = sizesData.sort((a, b) => a.sizeSequence - b.sizeSequence);

      const invRes = await fetch("https://localhost:7006/api/Inventory/GetInventory");
      const invData: any[] = await invRes.json();

      const grouped: Record<string, iInventoryDisplayRow> = {};
      invData.forEach((item) => {
        const key = `${item.styleNumber}-${item.colorName}`;
        if (!grouped[key]) {
          grouped[key] = {
            styleNumber: item.styleNumber,
            colorName: item.colorName,
            styleId: item.styleId,
            colorId: item.colorId,
            styleColorId: item.styleColorId,
            seasonName: item.seasonName,
            sizes: {} as Record<string, iInventoryCell>,
          };
        }
        grouped[key].sizes[item.sizeName] = {
          qty: item.qty,
          inventoryId: item.inventoryId,
          sizeId: item.sizeId,
        };
      });

      set({ inventory: Object.values(grouped), sizeColumns: sortedSizes, loading: false });
    } catch (err) {
      console.error("Error fetching inventory:", err);
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
      const sizeColumns = get().sizeColumns.map((s) => s.sizeName);
      const updates: iInventoryUpdate[] = sizeColumns
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

      const res = await fetch("https://localhost:7006/api/InventoryPage/SavePageInventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!res.ok) throw new Error(`Failed to save inventory: ${res.statusText}`);
      alert("Inventory saved successfully!");
    } catch (err) {
      console.error(err);
      alert("Error saving inventory");
    }
  },
}));