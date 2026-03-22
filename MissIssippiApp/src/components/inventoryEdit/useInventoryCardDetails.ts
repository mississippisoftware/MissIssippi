import { useCallback, useEffect, useMemo, useState } from "react";
import CatalogService, { type ItemColorView } from "../../service/CatalogService";
import { getErrorMessage } from "../../utils/errors";
import { dedupeItemColorsByColorId } from "../../utils/itemColorUtils";
import type { NotifyFn } from "../../hooks/useNotifier";
import type { InventoryCardGroup } from "../../utils/buildInventoryCardGroups";

export type InventoryCardMeta = {
  itemId?: number;
  inProduction?: boolean;
  wholesalePrice?: number | null;
  retailPrice?: number | null;
  seasonName?: string;
};

export type UseInventoryCardDetailsArgs = {
  group: InventoryCardGroup;
  itemMeta: InventoryCardMeta | undefined;
  activeTab: string;
  isEditable: boolean;
  notify: NotifyFn | undefined;
};

export type UseInventoryCardDetailsResult = {
  detailsLoading: boolean;
  detailsError: string | null;
  visibleColors: ItemColorView[];
  onToggleColorActive: (itemColorId: number, nextActive: boolean) => Promise<void>;
};

const toPositiveNumber = (value: unknown): number | null => {
  const next = Number(value);
  if (!Number.isFinite(next) || next <= 0) {
    return null;
  }
  return next;
};

export const useInventoryCardDetails = ({
  group,
  itemMeta,
  activeTab,
  isEditable,
  notify,
}: UseInventoryCardDetailsArgs): UseInventoryCardDetailsResult => {
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsLoaded, setDetailsLoaded] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [styleColors, setStyleColors] = useState<ItemColorView[]>([]);
  const [resolvedItemId, setResolvedItemId] = useState<number | null>(itemMeta?.itemId ?? null);

  // Reset Details state when the group changes.
  useEffect(() => {
    const rowItemId =
      group.rows
        .map((row) => toPositiveNumber(row.itemId))
        .find((value): value is number => value !== null) ?? null;

    setDetailsLoaded(false);
    setDetailsError(null);
    setStyleColors([]);
    setResolvedItemId(rowItemId);
  }, [group.itemNumber, group.rows]);

  // Fill resolvedItemId from itemMeta when not yet resolved from row data.
  useEffect(() => {
    if (resolvedItemId) {
      return;
    }
    const metaItemId = toPositiveNumber(itemMeta?.itemId);
    if (metaItemId) {
      setResolvedItemId(metaItemId);
    }
  }, [itemMeta?.itemId, resolvedItemId]);

  const loadDetails = useCallback(async () => {
    setDetailsLoading(true);
    setDetailsError(null);

    try {
      const itemIdForQuery =
        toPositiveNumber(resolvedItemId) ?? toPositiveNumber(itemMeta?.itemId);
      const linkedColors = await (
        itemIdForQuery
          ? CatalogService.getItemColors({ itemId: itemIdForQuery })
          : CatalogService.getItemColors({ itemNumber: group.itemNumber })
      );

      const discoveredItemId =
        itemIdForQuery ??
        linkedColors.find((row) => row.itemNumber === group.itemNumber)?.itemId ??
        null;
      if (discoveredItemId && discoveredItemId !== resolvedItemId) {
        setResolvedItemId(discoveredItemId);
      }

      const filteredLinked = linkedColors.filter((row) =>
        discoveredItemId ? row.itemId === discoveredItemId : row.itemNumber === group.itemNumber
      );

      setStyleColors(filteredLinked);
      setDetailsLoaded(true);
    } catch (err: unknown) {
      setDetailsError(getErrorMessage(err, "Unable to load style details."));
    } finally {
      setDetailsLoading(false);
    }
  }, [group.itemNumber, itemMeta?.itemId, resolvedItemId]);

  // Lazy-load the Details tab on first activation.
  useEffect(() => {
    if (activeTab !== "details" || detailsLoaded) {
      return;
    }
    void loadDetails();
  }, [activeTab, detailsLoaded, loadDetails]);

  const visibleColors = useMemo(
    () => dedupeItemColorsByColorId(styleColors).sort((a, b) => a.colorName.localeCompare(b.colorName)),
    [styleColors]
  );

  const handleToggleColorActive = async (itemColorId: number, nextActive: boolean) => {
    if (!isEditable) {
      return;
    }
    try {
      await CatalogService.setItemColorActive({ itemColorId, active: nextActive });
      setStyleColors((prev) =>
        prev.map((row) =>
          row.itemColorId === itemColorId ? { ...row, itemColorActive: nextActive } : row
        )
      );
      notify?.(
        "success",
        nextActive ? "Color activated" : "Color deactivated",
        nextActive ? "Color is active again." : "Color is now inactive."
      );
    } catch (err: unknown) {
      notify?.("error", "Update failed", getErrorMessage(err, "Unable to update color status."));
    }
  };

  return {
    detailsLoading,
    detailsError,
    visibleColors,
    onToggleColorActive: handleToggleColorActive,
  };
};
