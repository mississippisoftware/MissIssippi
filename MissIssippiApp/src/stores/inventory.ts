import { createStore } from "zustand/vanilla";
import { useStore } from "zustand";
import type { StateCreator } from "zustand";
import { InventoryService } from "../service/InventoryService";
import type { iInventoryDisplayRow, iSize } from "../utils/DataInterfaces";
import type { InventorySearchFilters } from "../utils/InventorySearchFilters";
import {
  buildDirtyItemsSet,
  cloneInventoryRow,
  createInventoryRowOpsSlice,
  getRowKey,
  normalizeRowForSave,
  normalizeRowsForSave,
  updateCell,
  type InventoryRowOpsSlice,
} from "./slices/inventoryRowOpsSlice";
import { createInventoryMetaSlice, type InventoryMetaSlice } from "./slices/inventoryMetaSlice";

type InventoryReadSlice = {
  inventory: iInventoryDisplayRow[];
  inventoryLoading: boolean;
  fetchInventory: () => Promise<void>;
  updateInventoryCell: (itemNumber: string, colorName: string, size: string, qty: number) => void;
  saveInventory: (row: iInventoryDisplayRow) => Promise<void>;
};

type InventoryEditSlice = {
  results: iInventoryDisplayRow[];
  originalResultsById: Record<string, iInventoryDisplayRow>;
  searching: boolean;
  lastFilters?: InventorySearchFilters;
  dirtyItemsSet: Set<string>;
  isItemDirty: (itemNumber: string) => boolean;
  search: (filters: InventorySearchFilters) => Promise<iInventoryDisplayRow[]>;
  clearResults: () => void;
  updateEditCell: (itemNumber: string, colorName: string, size: string, qty: number) => void;
  saveByItem: (itemNumber: string) => Promise<void>;
  discardChanges: () => Promise<void>;
  discardChangesByItem: (itemNumber: string) => void;
};

type InventoryStoreState = InventoryMetaSlice & InventoryRowOpsSlice & InventoryReadSlice & InventoryEditSlice;

export type InventoryReadState = {
  inventory: iInventoryDisplayRow[];
  sizeColumns: iSize[];
  loading: boolean;
  fetchInventory: () => Promise<void>;
  updateCell: (itemNumber: string, colorName: string, size: string, qty: number) => void;
  saveInventory: (row: iInventoryDisplayRow) => Promise<void>;
};

export type InventoryEditState = {
  results: iInventoryDisplayRow[];
  originalResultsById: Record<string, iInventoryDisplayRow>;
  sizeColumns: iSize[];
  seasons: Array<{ seasonId: number; seasonName: string }>;
  loading: boolean;
  searching: boolean;
  lastFilters?: InventorySearchFilters;
  initializeSizes: InventoryMetaSlice["initializeSizes"];
  fetchSeasons: InventoryMetaSlice["fetchSeasons"];
  search: (filters: InventorySearchFilters) => Promise<iInventoryDisplayRow[]>;
  clearResults: () => void;
  updateCell: (itemNumber: string, colorName: string, size: string, qty: number) => void;
  saveByItem: (itemNumber: string) => Promise<void>;
  discardChanges: () => Promise<void>;
  discardChangesByItem: (itemNumber: string) => void;
  dirtyItemsSet: Set<string>;
  isItemDirty: (itemNumber: string) => boolean;
};

export const createInventoryReadSlice: StateCreator<
  InventoryStoreState,
  [],
  [],
  InventoryReadSlice
> = (set, get) => ({
  inventory: [],
  inventoryLoading: true,
  fetchInventory: async () => {
    set({ inventoryLoading: true });

    try {
      await get().initializeSizes({ force: true, setEditLoading: false, throwOnError: true });
      const inventoryRaw = await InventoryService.getPivotInventory();
      const sizeColumns = get().sizeColumns;

      set((state) => ({
        inventory: inventoryRaw,
        inventoryLoading: false,
        dirtyItemsSet: buildDirtyItemsSet(state.results, state.originalResultsById, sizeColumns),
      }));
    } catch (err) {
      console.error("Inventory fetch error:", err);
      set({ inventoryLoading: false });
    }
  },
  updateInventoryCell: (itemNumber, colorName, size, qty) => {
    set((state) => ({
      inventory: updateCell(state.inventory, itemNumber, colorName, size, qty),
    }));
  },
  saveInventory: async (row) => {
    try {
      const sizeColumns = get().sizeColumns;
      const normalizedRow = normalizeRowForSave(row, sizeColumns);

      await InventoryService.savePivotInventory([normalizedRow]);
      await get().fetchInventory();
    } catch (err) {
      console.error(err);
      throw err;
    }
  },
});

export const createInventoryEditSlice: StateCreator<
  InventoryStoreState,
  [],
  [],
  InventoryEditSlice
> = (set, get) => ({
  results: [],
  originalResultsById: {},
  searching: false,
  dirtyItemsSet: new Set(),
  isItemDirty: (itemNumber) => get().dirtyItemsSet.has(itemNumber),
  search: async (filters) => {
    set({ searching: true, lastFilters: filters, editLoading: false });
    try {
      const data = await InventoryService.searchPivotInventory(filters);
      const originalResultsById = data.reduce<Record<string, iInventoryDisplayRow>>((acc, row) => {
        acc[getRowKey(row)] = cloneInventoryRow(row);
        return acc;
      }, {});
      const dirtyItemsSet = buildDirtyItemsSet(data, originalResultsById, get().sizeColumns);
      set({ results: data, searching: false, originalResultsById, dirtyItemsSet });
      return data;
    } catch (err) {
      console.error("Inventory search failed", err);
      set({ searching: false });
      throw err;
    }
  },
  clearResults: () => {
    set({
      results: [],
      searching: false,
      lastFilters: undefined,
      originalResultsById: {},
      dirtyItemsSet: new Set(),
    });
  },
  updateEditCell: (itemNumber, colorName, size, qty) => {
    const sizeColumns = get().sizeColumns;
    set((state) => {
      const results = updateCell(state.results, itemNumber, colorName, size, qty, {
        ensureSizeId: true,
        sizeColumns,
      });
      return {
        results,
        dirtyItemsSet: buildDirtyItemsSet(results, state.originalResultsById, sizeColumns),
      };
    });
  },
  saveByItem: async (itemNumber) => {
    const sizeColumns = get().sizeColumns;
    const rowsForItem = get().results.filter((row) => row.itemNumber === itemNumber);
    if (!rowsForItem.length) return;

    const normalizedRows = normalizeRowsForSave(rowsForItem, sizeColumns);
    await InventoryService.savePivotInventory(normalizedRows);
    set((state) => {
      const nextOriginalResultsById = { ...state.originalResultsById };
      rowsForItem.forEach((row) => {
        nextOriginalResultsById[getRowKey(row)] = cloneInventoryRow(row);
      });
      const dirtyItemsSet = new Set(state.dirtyItemsSet);
      dirtyItemsSet.delete(itemNumber);
      return {
        originalResultsById: nextOriginalResultsById,
        dirtyItemsSet,
      };
    });
  },
  discardChanges: async () => {
    const filters = get().lastFilters;
    if (filters) {
      await get().search(filters);
    }
  },
  discardChangesByItem: (itemNumber) => {
    const originalResultsById = get().originalResultsById;
    set((state) => {
      const results = state.results.map((row) =>
        row.itemNumber === itemNumber && originalResultsById[getRowKey(row)]
          ? cloneInventoryRow(originalResultsById[getRowKey(row)])
          : row
      );
      return {
        results,
        dirtyItemsSet: buildDirtyItemsSet(results, state.originalResultsById, get().sizeColumns),
      };
    });
  },
});

const inventoryStore = createStore<InventoryStoreState>()((...args) => ({
  ...createInventoryMetaSlice(...args),
  ...createInventoryRowOpsSlice(...args),
  ...createInventoryReadSlice(...args),
  ...createInventoryEditSlice(...args),
}));

const selectInventoryReadSlice = (state: InventoryStoreState): InventoryReadState => ({
  inventory: state.inventory,
  sizeColumns: state.sizeColumns,
  loading: state.inventoryLoading,
  fetchInventory: state.fetchInventory,
  updateCell: state.updateInventoryCell,
  saveInventory: state.saveInventory,
});

const selectInventoryEditSlice = (state: InventoryStoreState): InventoryEditState => ({
  results: state.results,
  originalResultsById: state.originalResultsById,
  sizeColumns: state.sizeColumns,
  seasons: state.seasons,
  loading: state.editLoading,
  searching: state.searching,
  lastFilters: state.lastFilters,
  initializeSizes: state.initializeSizes,
  fetchSeasons: state.fetchSeasons,
  search: state.search,
  clearResults: state.clearResults,
  updateCell: state.updateEditCell,
  saveByItem: state.saveByItem,
  discardChanges: state.discardChanges,
  discardChangesByItem: state.discardChangesByItem,
  dirtyItemsSet: state.dirtyItemsSet,
  isItemDirty: state.isItemDirty,
});

type StoreSelector<TState, T> = (state: TState) => T;

const useInventoryStoreImpl = <T = InventoryReadState>(
  selector?: StoreSelector<InventoryReadState, T>
) => {
  const boundSelector = (state: InventoryStoreState) => {
    const slice = selectInventoryReadSlice(state);
    return selector ? selector(slice) : (slice as unknown as T);
  };
  return useStore(inventoryStore, boundSelector);
};

const useInventoryEditStoreImpl = <T = InventoryEditState>(
  selector?: StoreSelector<InventoryEditState, T>
) => {
  const boundSelector = (state: InventoryStoreState) => {
    const slice = selectInventoryEditSlice(state);
    return selector ? selector(slice) : (slice as unknown as T);
  };
  return useStore(inventoryStore, boundSelector);
};

export const useInventoryStore = Object.assign(
  useInventoryStoreImpl,
  inventoryStore
) as typeof useInventoryStoreImpl & typeof inventoryStore;

export const useInventoryEditStore = Object.assign(
  useInventoryEditStoreImpl,
  inventoryStore
) as typeof useInventoryEditStoreImpl & typeof inventoryStore;
