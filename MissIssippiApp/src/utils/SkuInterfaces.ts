export interface SkuLookupResult {
  sku: string;
  seasonId: number;
  seasonName: string;
  itemId: number;
  itemNumber: string;
  colorId: number;
  colorName: string;
  sizeId: number;
  sizeName: string;
  itemColorId: number;
  inventoryId?: number | null;
  qty?: number | null;
  imageUrl?: string | null;
}

export interface SkuAdjustment {
  sku: string;
  delta: number;
}

export interface SkuAdjustmentsResult {
  updatedCount: number;
  missingSkus: string[];
}
