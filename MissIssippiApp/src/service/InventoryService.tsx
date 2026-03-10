import type { iInventoryCell, iInventoryDisplayRow, iSize } from "../utils/DataInterfaces";
import type { InventorySearchFilters } from "../utils/InventorySearchFilters";
import { fetchJson } from "./apiClient";

// Adjust these action names to match your ASP.NET controller action names
const API = {
  getSizes: "/Sizes/GetSizes",
  addSize: "/Sizes/AddOrUpdateSize",
  deleteSize: "/Sizes/DeleteSize",
  getSeasons: "/Season/GetSeasons",
  addSeason: "/Season/AddOrUpdateSeason",
  deleteSeason: "/Season/DeleteSeason",
  getPivotInventory: "/Inventory/GetPivotInventory",
  savePivotInventory: "/Inventory/SavePivotInventory",
  searchPivotInventory: "/EditInventory/SearchInventory",

  // Optional / legacy
  getInventory: "/Inventory/GetInventory",
};

export type SeasonRecord = {
  seasonId: number;
  seasonName: string;
  active?: boolean | null;
  seasonDateCreated?: string | null;
};

export type SizeRecord = iSize;

export const InventoryService = {
  // Used by your store
  async getSizes(): Promise<iSize[]> {
    return fetchJson<iSize[]>(API.getSizes);
  },

  async addOrUpdateSize(payload: {
    sizeId?: number | string;
    sizeName: string;
    sizeSequence?: number;
  }): Promise<boolean> {
    const parsedSizeId = Number(payload.sizeId);
    const parsedSequence = Number(payload.sizeSequence);
    return fetchJson<boolean>(API.addSize, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sizeId: Number.isFinite(parsedSizeId) && parsedSizeId > 0 ? parsedSizeId : 0,
        sizeName: payload.sizeName,
        sizeSequence: Number.isFinite(parsedSequence) ? parsedSequence : 0,
      }),
    });
  },

  async deleteSize(sizeId: number): Promise<boolean> {
    return fetchJson<boolean>(`${API.deleteSize}?SizeId=${sizeId}`, {
      method: "DELETE",
    });
  },

  async getSeasons(): Promise<SeasonRecord[]> {
    return fetchJson<SeasonRecord[]>(API.getSeasons);
  },

  async addOrUpdateSeason(payload: {
    seasonId?: number;
    seasonName: string;
    active?: boolean | null;
  }): Promise<boolean> {
    return fetchJson<boolean>(API.addSeason, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        seasonId: payload.seasonId ?? 0,
        seasonName: payload.seasonName,
        active: payload.active ?? false,
      }),
    });
  },

  async deleteSeason(seasonId: number): Promise<boolean> {
    return fetchJson<boolean>(`${API.deleteSeason}?SeasonId=${seasonId}`, {
      method: "DELETE",
    });
  },

  // Used by your store
  async getPivotInventory(): Promise<iInventoryDisplayRow[]> {
    return fetchJson<iInventoryDisplayRow[]>(API.getPivotInventory);
  },

  // Used by your store
  async savePivotInventory(rows: iInventoryDisplayRow[]): Promise<void> {
    // If your API returns something (bool/message), change Promise<void> to that type
    await fetchJson<unknown>(API.savePivotInventory, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rows),
    });
  },

  // Optional: keep compatibility if other parts call getInventory()
  async getInventory(): Promise<iInventoryDisplayRow[]> {
    return fetchJson<iInventoryDisplayRow[]>(API.getInventory);
  },

  // Optional: if you still use manual/bulk update endpoints elsewhere
  async manualUpdate(payload: iInventoryCell): Promise<void> {
    await fetchJson<unknown>("/Inventory/ManualUpdate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },

  async searchPivotInventory(filters: InventorySearchFilters): Promise<iInventoryDisplayRow[]> {
    const params = new URLSearchParams();
    if (filters.itemNumber?.trim()) {
      params.set("ItemNumber", filters.itemNumber.trim());
    }
    if (filters.description?.trim()) {
      params.set("Description", filters.description.trim());
    }
    if (filters.colorName?.trim()) {
      params.set("ColorName", filters.colorName.trim());
    }
    if (filters.seasonName?.trim()) {
      params.set("SeasonName", filters.seasonName.trim());
    }

    const query = params.toString();
    const path = query ? `${API.searchPivotInventory}?${query}` : API.searchPivotInventory;
    return fetchJson<iInventoryDisplayRow[]>(path);
  },

  async bulkUpdate(payload: iInventoryCell[]): Promise<void> {
    await fetchJson<unknown>("/Inventory/BulkUpdate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },
};

export default InventoryService;
