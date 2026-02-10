import { fetchJson } from "./apiClient";

const API = {
  uploadInventory: "/InventoryUpload/UploadInventory",
};

export interface InventoryUploadRow {
  rowNumber?: number;
  seasonName: string;
  itemNumber: string;
  colorName: string;
  sizes: Record<string, number | null>;
}

export type InventoryUploadMode = "replace" | "add" | "subtract";

export interface InventoryUploadError {
  rowNumber: number;
  message: string;
}

export interface InventoryUploadResult {
  processedRows: number;
  createdSkus: number;
  createdItemColors: number;
  createdInventory: number;
  updatedInventory: number;
  errors: InventoryUploadError[];
}

export const InventoryUploadService = {
  async uploadInventory(rows: InventoryUploadRow[], mode: InventoryUploadMode): Promise<InventoryUploadResult> {
    return fetchJson<InventoryUploadResult>(API.uploadInventory, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows, mode }),
    });
  },
};

export default InventoryUploadService;
