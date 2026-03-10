import { fetchJson } from "./apiClient";

const API = {
  getColors: "/Color/GetColors",
  addColor: "/Color/AddOrUpdateColor",
  deleteColor: "/Color/DeleteColor",
  migrateColor: "/Color/MigrateColor",
  getItems: "/Item/GetItem",
  addItem: "/Item/AddOrUpdateItem",
  adminHardDeleteItems: "/Item/AdminHardDeleteItems",
  getItemColors: "/ItemColor/GetItemColor",
  addItemColor: "/ItemColor/AddOrUpdateItemColor",
  setItemColorActive: "/ItemColor/SetItemColorActive",
  getCollections: "/Collection/GetCollections",
  addCollection: "/Collection/AddCollection",
};

export interface ColorOption {
  colorId: number;
  colorName: string;
  seasonId?: number | null;
  collection?: string | null;
  pantoneColor?: string | null;
  hexValue?: string | null;
}

export interface ItemView {
  itemId: number;
  itemNumber: string;
  description: string;
  costPrice?: number | null;
  wholesalePrice?: number | null;
  weight?: number | null;
  seasonId: number;
  seasonName?: string | null;
  inProduction: boolean;
}

export interface CollectionOption {
  collectionId: number;
  collectionName: string;
}

export interface ItemColorView {
  itemColorId: number;
  colorId: number;
  colorName: string;
  collection?: string | null;
  pantoneColor?: string | null;
  hexValue?: string | null;
  colorSeasonId?: number | null;
  itemId: number;
  itemNumber: string;
  seasonId: number;
  seasonName: string;
  itemColorActive?: boolean | null;
}

export interface ItemSaveRequest {
  itemId?: number;
  itemNumber: string;
  description: string;
  costPrice?: number | null;
  wholesalePrice?: number | null;
  weight?: number | null;
  seasonId: number;
  inProduction: boolean;
}

export interface ItemColorSaveRequest {
  itemColorId?: number;
  itemId: number;
  colorId: number;
  secondaryColorIds?: number[];
}

export interface ItemAdminHardDeleteRequest {
  itemIds: number[];
  password: string;
}

export interface ItemAdminHardDeleteResult {
  requestedItemCount: number;
  deletedItemCount: number;
  deletedItemColorCount: number;
  deletedSkuCount: number;
  deletedInventoryCount: number;
  deletedInventoryActivityLogCount: number;
  deletedItemImageCount: number;
  deletedItemColorSecondaryColorCount: number;
  deletedItemIds: number[];
  missingItemIds: number[];
  deletedItemNumbers: string[];
}

const buildQuery = (params: Record<string, string | number | boolean | undefined | null>) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    query.set(key, String(value));
  });
  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
};

export const CatalogService = {
  async getColors(params: { colorId?: number; colorName?: string; seasonId?: number } = {}): Promise<ColorOption[]> {
    const query = buildQuery({
      ColorId: params.colorId,
      ColorName: params.colorName,
      SeasonId: params.seasonId,
    });
    return fetchJson<ColorOption[]>(`${API.getColors}${query}`);
  },

  async addOrUpdateColor(payload: {
    colorId?: number;
    colorName: string;
    seasonId?: number | null;
    collection?: string | null;
    pantoneColor?: string | null;
    hexValue?: string | null;
  }): Promise<boolean> {
    return fetchJson<boolean>(API.addColor, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        colorId: payload.colorId ?? 0,
        colorName: payload.colorName,
        seasonId: payload.seasonId ?? null,
        collection: payload.collection ?? null,
        pantoneColor: payload.pantoneColor ?? null,
        hexValue: payload.hexValue ?? null,
      }),
    });
  },

  async getItems(params: {
    itemId?: number;
    itemNumber?: string;
    description?: string;
    seasonName?: string;
    inProduction?: boolean;
  } = {}): Promise<ItemView[]> {
    const query = buildQuery({
      ItemId: params.itemId,
      ItemNumber: params.itemNumber,
      Description: params.description,
      SeasonName: params.seasonName,
      InProduction: params.inProduction,
    });
    return fetchJson<ItemView[]>(`${API.getItems}${query}`);
  },

  async addOrUpdateItem(payload: ItemSaveRequest): Promise<boolean> {
    return fetchJson<boolean>(API.addItem, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        itemId: payload.itemId ?? 0,
        itemNumber: payload.itemNumber,
        description: payload.description,
        costPrice: payload.costPrice,
        wholesalePrice: payload.wholesalePrice,
        weight: payload.weight,
        seasonId: payload.seasonId,
        inProduction: payload.inProduction,
      }),
    });
  },

  async adminHardDeleteItems(payload: ItemAdminHardDeleteRequest): Promise<ItemAdminHardDeleteResult> {
    return fetchJson<ItemAdminHardDeleteResult>(API.adminHardDeleteItems, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        itemIds: payload.itemIds,
        password: payload.password,
      }),
    });
  },

  async getCollections(params: { collectionId?: number; collectionName?: string } = {}): Promise<CollectionOption[]> {
    const query = buildQuery({
      CollectionId: params.collectionId,
      CollectionName: params.collectionName,
    });
    return fetchJson<CollectionOption[]>(`${API.getCollections}${query}`);
  },

  async addCollection(payload: { collectionName: string }): Promise<CollectionOption> {
    return fetchJson<CollectionOption>(API.addCollection, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        collectionName: payload.collectionName,
      }),
    });
  },

  async getItemColors(params: {
    itemId?: number;
    itemNumber?: string;
    seasonName?: string;
    itemColorId?: number;
    colorId?: number;
    seasonId?: number;
  } = {}): Promise<ItemColorView[]> {
    const query = buildQuery({
      ItemId: params.itemId,
      ItemNumber: params.itemNumber,
      SeasonName: params.seasonName,
      ItemColorId: params.itemColorId,
      ColorId: params.colorId,
      SeasonId: params.seasonId,
    });
    return fetchJson<ItemColorView[]>(`${API.getItemColors}${query}`);
  },

  async addOrUpdateItemColor(payload: ItemColorSaveRequest): Promise<boolean> {
    return fetchJson<boolean>(API.addItemColor, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        itemColorId: payload.itemColorId ?? 0,
        itemId: payload.itemId,
        colorId: payload.colorId,
        secondaryColorIds: payload.secondaryColorIds ?? null,
      }),
    });
  },

  async setItemColorActive(payload: { itemColorId: number; active: boolean }): Promise<boolean> {
    return fetchJson<boolean>(API.setItemColorActive, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        itemColorId: payload.itemColorId,
        active: payload.active,
      }),
    });
  },

  async deleteColor(colorId: number): Promise<boolean> {
    return fetchJson<boolean>(`${API.deleteColor}?ColorId=${colorId}`, {
      method: "DELETE",
    });
  },

  async migrateColor(payload: { sourceColorId: number; targetColorId: number }): Promise<boolean> {
    return fetchJson<boolean>(API.migrateColor, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sourceColorId: payload.sourceColorId,
        targetColorId: payload.targetColorId,
      }),
    });
  },
};

export default CatalogService;

