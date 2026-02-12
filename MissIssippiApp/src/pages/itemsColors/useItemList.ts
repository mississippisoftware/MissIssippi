import { type RefObject, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { InventoryService } from "../../service/InventoryService";
import CatalogService, { type ColorOption, type ItemColorView } from "../../service/CatalogService";
import type { ItemListRow, SeasonOption } from "../../items/itemsColorsTypes";
import { normalizeName } from "../../items/itemsColorsUtils";
import { filterSeasonActiveRows } from "../../utils/filterSeasonActiveRows";
import { useNotifier } from "../../hooks/useNotifier";

type UseItemListParams = {
  toastRef: RefObject<Toast | null>;
};

const getErrorMessage = (err: unknown, fallback: string) =>
  err instanceof Error ? err.message : fallback;

export function useItemList({ toastRef }: UseItemListParams) {
  const notify = useNotifier(toastRef);
  const [seasons, setSeasons] = useState<SeasonOption[]>([]);
  const [colors, setColors] = useState<ColorOption[]>([]);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [loadingLookups, setLoadingLookups] = useState(true);

  const [itemList, setItemList] = useState<ItemListRow[]>([]);
  const [itemListLoading, setItemListLoading] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [selectedItem, setSelectedItem] = useState<ItemListRow | null>(null);
  const [editingRows, setEditingRows] = useState<Record<string, boolean>>({});
  const [tempItemId, setTempItemId] = useState(-1);
  const [seasonFilterId, setSeasonFilterId] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [colorModalItem, setColorModalItem] = useState<ItemListRow | null>(null);

  const buildItemKey = (seasonId: number, itemNumber: string) =>
    `${seasonId}|${normalizeName(itemNumber)}`;

  const itemKeyMap = useMemo(() => {
    const map = new Map<string, ItemListRow>();
    itemList.forEach((item) => {
      map.set(buildItemKey(item.seasonId, item.itemNumber), item);
    });
    return map;
  }, [itemList]);

  const filteredItems = useMemo(() => {
    return filterSeasonActiveRows(itemList, { seasonFilterId, activeFilter });
  }, [itemList, seasonFilterId, activeFilter]);

  const loadLookups = useCallback(async () => {
    setLoadingLookups(true);
    setLookupError(null);
    try {
      const [seasonData, colorData] = await Promise.all([
        InventoryService.getSeasons(),
        CatalogService.getColors(),
      ]);
      setSeasons(seasonData);
      setColors(colorData);
    } catch (err: unknown) {
      console.error(err);
      setLookupError(getErrorMessage(err, "Failed to load catalog lookups."));
    } finally {
      setLoadingLookups(false);
    }
  }, []);

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
    loadLookups();
    loadItemList();
  }, [loadItemList, loadLookups]);

  return {
    seasons,
    colors,
    setColors,
    lookupError,
    loadingLookups,
    itemList,
    setItemList,
    itemListLoading,
    filteredItems,
    itemKeyMap,
    buildItemKey,
    loadLookups,
    loadItemList,
    expandedRows,
    setExpandedRows,
    selectedItem,
    setSelectedItem,
    editingRows,
    setEditingRows,
    tempItemId,
    setTempItemId,
    seasonFilterId,
    setSeasonFilterId,
    activeFilter,
    setActiveFilter,
    colorModalItem,
    setColorModalItem,
  };
}
