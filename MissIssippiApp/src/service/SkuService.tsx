import { fetchJson } from "./apiClient";
import type { SkuAdjustment, SkuAdjustmentsResult, SkuLookupResult } from "../utils/SkuInterfaces";

const API = {
  lookupSku: "/Sku/LookupSku",
  applyAdjustments: "/Sku/ApplySkuAdjustments",
};

export const SkuService = {
  async lookupSku(sku: string): Promise<SkuLookupResult> {
    const params = new URLSearchParams();
    params.set("sku", sku);
    return fetchJson<SkuLookupResult>(`${API.lookupSku}?${params.toString()}`);
  },

  async applyAdjustments(adjustments: SkuAdjustment[]): Promise<SkuAdjustmentsResult> {
    return fetchJson<SkuAdjustmentsResult>(API.applyAdjustments, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adjustments }),
    });
  },
};

export default SkuService;
