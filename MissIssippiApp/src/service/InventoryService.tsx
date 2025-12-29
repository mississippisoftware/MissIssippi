import type { iInventoryDisplayRow, iInventoryUpdate, iSize } from "../utils/DataInterfaces";

const API_BASE = "https://localhost:7006/api";

export const inventoryService = {
  async getSizes(): Promise<iSize[]> {
    const res = await fetch(`${API_BASE}/Sizes/GetSizes`);
    return res.json();
  },

  async getInventory(): Promise<iInventoryDisplayRow[]> {
    const res = await fetch(`${API_BASE}/Inventory/GetInventory`);
    const data: any[] = await res.json();

    const grouped: Record<string, iInventoryDisplayRow> = {};
    data.forEach((item) => {
      const key = `${item.styleNumber}-${item.colorName}`;
      if (!grouped[key]) {
        grouped[key] = {
            id:key,
          styleNumber: item.styleNumber,
          colorName: item.colorName,
          styleId: item.styleId,
          colorId: item.colorId,
          styleColorId: item.styleColorId,
          seasonName: item.seasonName,
          description: item.description,
          sizes: {},
        };
      }
      grouped[key].sizes[item.sizeName] = {
        qty: item.qty,
        inventoryId: item.inventoryId,
        sizeId: item.sizeId,
      };
    });

    return Object.values(grouped);
  },

  async saveInventory(updates: iInventoryUpdate[]): Promise<void> {
    const res = await fetch(`${API_BASE}/InventoryPage/SavePageInventory`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error(`Save failed: ${res.statusText}`);
  },
};
