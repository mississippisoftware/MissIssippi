import { type RefObject, useCallback, useEffect, useMemo, useState } from "react";
import { Toast } from "primereact/toast";
import CatalogService, { type ColorOption, type ItemColorView } from "../../service/CatalogService";
import type { ItemListRow } from "../../items/itemsColorsTypes";
import { normalizeName } from "../../items/itemsColorsUtils";
import { filterSeasonActiveRows } from "../../utils/filterSeasonActiveRows";
import type { InventorySearchFilters } from "../../utils/InventorySearchFilters";
import { getErrorMessage } from "../../utils/errors";
import { useNotifier } from "../../hooks/useNotifier";
import { useCatalogLookups } from "../../hooks/useCatalogLookups";
import { useTableSearch } from "../../hooks/useTableSearch";

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

  const activeSeasonRows = useMemo(() => {
    const baseRows = filterSeasonActiveRows(itemList, { activeFilter });
    return baseRows.filter((row) => !row.seasonId || activeSeasonIds.has(row.seasonId));
  }, [itemList, activeFilter, activeSeasonIds]);

  const { filtered: quickSearchRows, setQuery: setQuickSearchQuery, clear: clearQuickSearch } =
    useTableSearch(activeSeasonRows, {
      fields: ["itemNumber", "description", "colors[].colorName"],
    });

  const applySearchFilters = useCallback((filters: InventorySearchFilters) => {
    setQuickSearchQuery(filters.itemNumber ?? "");
    setSearchFilters(filters);
  }, [setQuickSearchQuery]);

  const clearSearchFilters = useCallback(() => {
    setSearchForm(EMPTY_SEARCH_FILTERS);
    setSearchFilters(EMPTY_SEARCH_FILTERS);
    clearQuickSearch();
  }, [clearQuickSearch]);

  const filteredItems = useMemo(() => {
    const colorQuery = normalizeName(searchFilters.colorName ?? "");
    const seasonQuery = normalizeName(searchFilters.seasonName ?? "");
    const descriptionQuery = (searchFilters.description ?? "").trim().toLowerCase();

    if (!colorQuery && !seasonQuery && !descriptionQuery) {
      return quickSearchRows;
    }

    return quickSearchRows.filter((row) => {
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
  }, [quickSearchRows, searchFilters]);

  const handleToggleColorActive = useCallback(
    async (itemColorId: number, nextActive: boolean) => {
      try {
        await CatalogService.setItemColorActive({ itemColorId, active: nextActive });
        notify(
          "success",
          nextActive ? "Color activated" : "Color deactivated",
          nextActive ? "Color is active again." : "Color is now inactive."
        );
        let nextSelected: ItemListRow | null = null;
        let nextModalItem: ItemListRow | null = null;
        setItemList((prev) =>
          prev.map((item) => {
            if (!(item.colors ?? []).some((color) => color.itemColorId === itemColorId)) {
              return item;
            }
            const nextColors = (item.colors ?? []).map((color) =>
              color.itemColorId === itemColorId ? { ...color, itemColorActive: nextActive } : color
            );
            const updated: ItemListRow = { ...item, colors: nextColors };
            if (selectedItem?.itemId === item.itemId) {
              nextSelected = updated;
            }
            if (colorModalItem?.itemId === item.itemId) {
              nextModalItem = updated;
            }
            return updated;
          })
        );
        if (nextSelected) {
          setSelectedItem(nextSelected);
        }
        if (nextModalItem) {
          setColorModalItem(nextModalItem);
        }
      } catch (err: unknown) {
        console.error(err);
        notify("error", "Update failed", getErrorMessage(err, "Unable to update color status."));
      }
    },
    [colorModalItem, notify, selectedItem]
  );

  const handleItemSave = useCallback(
    async (row: ItemListRow): Promise<boolean> => {
      if (!row.itemNumber?.trim()) {
        notify("warn", "Style required", "Enter a style number.");
        return false;
      }
      if (!row.seasonId) {
        notify("warn", "Season required", "Select a season.");
        return false;
      }
      if (!row.description?.trim()) {
        notify("warn", "Description required", "Enter a description.");
        return false;
      }

      try {
        const isNew = row.itemId <= 0;
        const trimmedItemNumber = row.itemNumber.trim();
        const trimmedDescription = row.description.trim();
        const seasonName =
          seasons.find((s) => s.seasonId === Number(row.seasonId))?.seasonName ?? "";
        await CatalogService.addOrUpdateItem({
          itemId: row.itemId > 0 ? row.itemId : undefined,
          itemNumber: trimmedItemNumber,
          description: trimmedDescription,
          seasonId: Number(row.seasonId),
          costPrice: row.costPrice,
          wholesalePrice: row.wholesalePrice,
          inProduction: row.inProduction ?? false,
          weight: row.weight,
        });

        let savedItem: ItemListRow | null = null;
        if (isNew) {
          const normalizedItem = normalizeName(trimmedItemNumber);
          const normalizedSeason = normalizeName(seasonName);
          const matches = await CatalogService.getItems({
            itemNumber: trimmedItemNumber,
            seasonName,
          });
          const match = matches.find(
            (item) =>
              normalizeName(item.itemNumber) === normalizedItem &&
              normalizeName(item.seasonName ?? seasonName) === normalizedSeason
          );
          if (match) {
            savedItem = {
              ...match,
              seasonName: match.seasonName ?? seasonName,
              colors: [],
            };
          }
        }

        let nextSelected: ItemListRow | null = null;
        setItemList((prev) =>
          prev.map((item) => {
            if (item.itemId !== row.itemId) return item;
            const wasInProduction = item.inProduction ?? false;
            const updated: ItemListRow = {
              ...item,
              ...(savedItem ?? {
                itemId: item.itemId,
                itemNumber: trimmedItemNumber,
                description: trimmedDescription,
                seasonId: Number(row.seasonId),
                seasonName,
                costPrice: row.costPrice,
                wholesalePrice: row.wholesalePrice,
                weight: row.weight,
                inProduction: row.inProduction ?? false,
              }),
              colors: item.colors ?? [],
            };
            if (!wasInProduction && updated.inProduction) {
              updated.colors = (updated.colors ?? []).map((color) => ({
                ...color,
                itemColorActive: true,
              }));
            }
            nextSelected = updated;
            return updated;
          })
        );
        if (nextSelected) {
          setSelectedItem(nextSelected);
          if (colorModalItem?.itemId === row.itemId) {
            setColorModalItem(nextSelected);
          }
          if (savedItem && row.itemId !== savedItem.itemId) {
            setExpandedRows((prev) => {
              if (!prev[String(row.itemId)]) return prev;
              const next = { ...prev };
              delete next[String(row.itemId)];
              next[String(savedItem.itemId)] = true;
              return next;
            });
          }
        }
        notify("success", "Style saved", `${row.itemNumber} saved successfully.`);
        return true;
      } catch (err: unknown) {
        console.error(err);
        notify("error", "Style save failed", getErrorMessage(err, "Unable to save style."));
        return false;
      }
    },
    [colorModalItem, notify, seasons]
  );

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

  // Run once on mount. loadItemList reads selectedItem/colorModalItem at call time
  // but those are null on mount, so no selection sync is needed at init.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { void loadItemList(); }, []);

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
    handleItemSave,
    handleToggleColorActive,
  };
}
