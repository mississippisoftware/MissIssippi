import { type RefObject, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import CatalogService, { type ColorOption, type ItemColorView } from "../../service/CatalogService";
import type { ItemListRow } from "../../items/itemsColorsTypes";
import { normalizeName } from "../../items/itemsColorsUtils";
import { filterSeasonActiveRows } from "../../utils/filterSeasonActiveRows";
import type { InventorySearchFilters } from "../../utils/InventorySearchFilters";
import { getErrorMessage } from "../../utils/errors";
import { useNotifier } from "../../hooks/useNotifier";
import { useCatalogLookups } from "../../hooks/useCatalogLookups";

type UseItemListParams = {
  toastRef: RefObject<Toast | null>;
};

const EMPTY_SEARCH_FILTERS: InventorySearchFilters = {
  itemNumber: "",
  description: "",
  colorName: "",
  seasonName: "",
};

export function useItemList({ toastRef }: UseItemListParams) {
  const notify = useNotifier(toastRef);
  const {
    seasons,
    colors,
    setColors,
    collections,
    setCollections,
    loading: loadingLookups,
    error: lookupError,
  } = useCatalogLookups<ColorOption>();

  const [itemList, setItemList] = useState<ItemListRow[]>([]);
  const [itemListLoading, setItemListLoading] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [selectedItem, setSelectedItem] = useState<ItemListRow | null>(null);
  const [editingRows, setEditingRows] = useState<Record<string, boolean>>({});
  const [tempItemId, setTempItemId] = useState(-1);
  const [activeFilter, setActiveFilter] = useState("");
  const [colorModalItem, setColorModalItem] = useState<ItemListRow | null>(null);
  const [searchForm, setSearchForm] = useState<InventorySearchFilters>(EMPTY_SEARCH_FILTERS);
  const [searchFilters, setSearchFilters] = useState<InventorySearchFilters>(EMPTY_SEARCH_FILTERS);

  const buildItemKey = (seasonId: number, itemNumber: string) =>
    `${seasonId}|${normalizeName(itemNumber)}`;

  const itemKeyMap = useMemo(() => {
    const map = new Map<string, ItemListRow>();
    itemList.forEach((item) => {
      map.set(buildItemKey(item.seasonId, item.itemNumber), item);
    });
    return map;
  }, [itemList]);

  const activeSeasonIds = useMemo(
    () => new Set(seasons.filter((season) => season.active !== false).map((season) => season.seasonId)),
    [seasons]
  );

  const applySearchFilters = useCallback((filters: InventorySearchFilters) => {
    setSearchFilters(filters);
  }, []);

  const clearSearchFilters = useCallback(() => {
    setSearchForm(EMPTY_SEARCH_FILTERS);
    setSearchFilters(EMPTY_SEARCH_FILTERS);
  }, []);

  const filteredItems = useMemo(() => {
    const baseRows = filterSeasonActiveRows(itemList, { activeFilter });
    const activeSeasonRows = baseRows.filter((row) => !row.seasonId || activeSeasonIds.has(row.seasonId));

    const itemQuery = normalizeName(searchFilters.itemNumber ?? "");
    const colorQuery = normalizeName(searchFilters.colorName ?? "");
    const seasonQuery = normalizeName(searchFilters.seasonName ?? "");
    const descriptionQuery = (searchFilters.description ?? "").trim().toLowerCase();

    if (!itemQuery && !colorQuery && !seasonQuery && !descriptionQuery) {
      return activeSeasonRows;
    }

    return activeSeasonRows.filter((row) => {
      if (itemQuery && !normalizeName(row.itemNumber ?? "").includes(itemQuery)) {
        return false;
      }
      if (seasonQuery && !normalizeName(row.seasonName ?? "").includes(seasonQuery)) {
        return false;
      }
      if (descriptionQuery && !(row.description ?? "").toLowerCase().includes(descriptionQuery)) {
        return false;
      }
      if (
        colorQuery &&
        !(row.colors ?? []).some((color) => normalizeName(color.colorName).includes(colorQuery))
      ) {
        return false;
      }
      return true;
    });
  }, [itemList, activeFilter, activeSeasonIds, searchFilters]);

  const loadItemList = useCallback(async () => {
    setItemListLoading(true);
    try {
      const [itemsData, itemColorData] = await Promise.all([
        CatalogService.getItems(),
        CatalogService.getItemColors(),
      ]);
      const itemColorMap = new Map<number, ItemColorView[]>();
      itemColorData.forEach((entry) => {
        const list = itemColorMap.get(entry.itemId);
        if (list) {
          list.push(entry);
        } else {
          itemColorMap.set(entry.itemId, [entry]);
        }
      });

      const rows = itemsData.map((item) => ({
        ...item,
        colors: (itemColorMap.get(item.itemId) ?? []).sort((a, b) =>
          a.colorName.localeCompare(b.colorName)
        ),
      }));
      setItemList(rows);
      if (selectedItem) {
        const match = rows.find((entry) => entry.itemId === selectedItem.itemId);
        setSelectedItem(match ?? null);
      }
      if (colorModalItem) {
        const match = rows.find((entry) => entry.itemId === colorModalItem.itemId);
        setColorModalItem(match ?? null);
      }
      return rows;
    } catch (err: unknown) {
      console.error(err);
      notify("error", "Item list failed", getErrorMessage(err, "Unable to load items list."));
      return [];
    } finally {
      setItemListLoading(false);
    }
  }, [colorModalItem, notify, selectedItem]);

  const didInit = useRef(false);

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    loadItemList();
  }, [loadItemList]);

  return {
    seasons,
    colors,
    setColors,
    collections,
    setCollections,
    lookupError,
    loadingLookups,
    itemList,
    setItemList,
    itemListLoading,
    filteredItems,
    itemKeyMap,
    buildItemKey,
    loadItemList,
    expandedRows,
    setExpandedRows,
    selectedItem,
    setSelectedItem,
    editingRows,
    setEditingRows,
    tempItemId,
    setTempItemId,
    activeFilter,
    setActiveFilter,
    colorModalItem,
    setColorModalItem,
    searchForm,
    setSearchForm,
    searchFilters,
    applySearchFilters,
    clearSearchFilters,
  };
}
