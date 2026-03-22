export interface iInventoryCell {
  qty: number;
  inventoryId?: number | string;
  sizeId?: number | string;
}

export interface iInventoryDisplayRow {
  id: string;
  itemNumber: string;
  colorName: string;
  itemId?: number | string;
  colorId?: number | string;
  itemColorId?: number | string;
  seasonName?: string;
  description?: string;
  sizes: Record<string, iInventoryCell | undefined>;
}

export interface iSize {
  sizeId: number | string;
  sizeName: string;
  sizeSequence?: number;
}

export interface iInventoryUpdate {
  itemNumber: string;
  colorName: string;
  sizeName: string;
  inventoryId: number;
  itemColorId: number;
  itemId: number;
  colorId: number;
  sizeId: number;
  qty: number;
}