import { fetchJson } from "./apiClient";
import type { SkuAdjustment, SkuAdjustmentsResult, SkuLookupResult } from "../utils/SkuInterfaces";

const API = {
  lookupSku: "/Sku/LookupSku",
  applyAdjustments: "/Sku/ApplySkuAdjustments",
  getSkuList: "/skus",
  getSkuLabels: "/skus/labels",
  bulkUpdateSkus: "/skus/bulk-update",
};

export type SkuListItem = {
  skuId: number;
  sku: string;
  seasonName: string;
  itemNumber: string;
  description: string;
  colorName: string;
  sizeName: string;
  sizeSequence: number;
  qty: number;
  inProduction: boolean;
};

export type SkuListResponse = {
  items: SkuListItem[];
  total: number;
};

export type SkuUpdateResponse = {
  skuId: number;
  sku: string;
};

export type SkuBulkUpdateRow = {
  rowNumber: number;
  skuId: number;
  sku: string;
};

export type SkuBulkUpdateError = {
  rowNumber: number;
  skuId?: number | null;
  message: string;
};

export type SkuBulkUpdateResponse = {
  success: boolean;
  processed: number;
  updated: number;
  errors: SkuBulkUpdateError[];
};

export type SkuLabelRow = {
  itemColorId: number;
  sku: string;
  itemNumber: string;
  colorName: string;
  sizeName: string;
  sizeSequence: number;
  qty: number;
};

const buildQuery = (params: Record<string, string | number | boolean | undefined | null>) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    query.set(key, String(value));
  });
  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
};

export const SkuService = {
  async lookupSku(sku: string): Promise<SkuLookupResult> {
    const params = new URLSearchParams();
    params.set("sku", sku);
    return fetchJson<SkuLookupResult>(`${API.lookupSku}?${params.toString()}`);
  },

  async applyAdjustments(adjustments: SkuAdjustment[], options?: { notes?: string | null }): Promise<SkuAdjustmentsResult> {
    return fetchJson<SkuAdjustmentsResult>(API.applyAdjustments, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adjustments, notes: options?.notes ?? null }),
    });
  },

  async getSkuList(params: {
    q?: string;
    seasonId?: number | null;
    inStock?: boolean | null;
    inProduction?: boolean | null;
    page?: number;
    pageSize?: number;
    sortField?: string;
    sortOrder?: "asc" | "desc";
  }): Promise<SkuListResponse> {
    const query = buildQuery({
      q: params.q?.trim(),
      seasonId: params.seasonId ?? undefined,
      inStock: params.inStock ?? undefined,
      inProduction: params.inProduction ?? undefined,
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 25,
      sortField: params.sortField,
      sortOrder: params.sortOrder,
    });
    return fetchJson<SkuListResponse>(`${API.getSkuList}${query}`);
  },

  async getSkuLabels(itemColorIds: number[]): Promise<SkuLabelRow[]> {
    return fetchJson<SkuLabelRow[]>(API.getSkuLabels, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemColorIds }),
    });
  },

  async updateSku(skuId: number, sku: string): Promise<SkuUpdateResponse> {
    return fetchJson<SkuUpdateResponse>(`${API.getSkuList}/${skuId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sku }),
    });
  },

  async bulkUpdateSkus(rows: SkuBulkUpdateRow[]): Promise<SkuBulkUpdateResponse> {
    return fetchJson<SkuBulkUpdateResponse>(API.bulkUpdateSkus, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows }),
    });
  },
};

export default SkuService;
