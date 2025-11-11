export interface iInventoryItem {
  styleNumber: string;
  description: string;
  colorName: string;
  sizeName: string;
  qty: number;
  seasonName: string;
  inStock: number;
  inventoryId: number;
  styleColorId: number;
  styleId: number;
  colorId: number;
  sizeId: number;
  seasonId: number;
}
export interface iInventoryCell {
  qty: number;
  inventoryId: number;
  sizeId: number;
}

export interface iInventoryDisplayRow {
  styleNumber: string;
  colorName: string;
  styleId: number;
  colorId: number;
  styleColorId: number;
  [sizeName: string]: iInventoryCell | string | number; 
}

export interface iInventoryUpdate {
  styleNumber: string;
  colorName: string;
  seasonName: string;   // <--- add this
  sizeName: string;
  inventoryId: number;
  styleColorId: number;
  styleId: number;
  colorId: number;
  sizeId: number;
  qty: number;
}

export interface iSize {
  sizeId: number;
  sizeName: string;
  sizeSequence: number;
}