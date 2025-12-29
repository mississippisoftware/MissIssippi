export interface iInventoryCell {
  qty: number;
  inventoryId?: number | string;
  sizeId?: number | string;
}

export interface iInventoryDisplayRow {
  id: string;
  styleNumber: string;
  colorName: string;
  styleId?: number | string;
  colorId?: number | string;
  styleColorId?: number | string;
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
  styleNumber: string;
  colorName: string;
  sizeName: string;
  inventoryId: number;
  styleColorId: number;
  styleId: number;
  colorId: number;
  sizeId: number;
  qty: number;
}