import { useCallback, useEffect, useState } from "react";
import type { DataTableRowEditCompleteEvent } from "primereact/datatable";
import { SkuService, type SkuListItem } from "../../service/SkuService";
import { getErrorMessage } from "../../utils/errors";
import type { NotifyFn } from "../../hooks/useNotifier";
import type { InventoryCardGroup } from "../../utils/buildInventoryCardGroups";

export type UseInventoryCardSkuArgs = {
  group: InventoryCardGroup;
  activeTab: string;
  isEditable: boolean;
  notify: NotifyFn | undefined;
};

export type UseInventoryCardSkuResult = {
  skuRows: SkuListItem[];
  skuLoading: boolean;
  skuError: string | null;
  skuEditingRows: Record<string, boolean>;
  setSkuEditingRows: (rows: Record<string, boolean>) => void;
  onRowEditComplete: (event: DataTableRowEditCompleteEvent) => Promise<void>;
};

export const useInventoryCardSku = ({
  group,
  activeTab,
  isEditable,
  notify,
}: UseInventoryCardSkuArgs): UseInventoryCardSkuResult => {
  const [skuRows, setSkuRows] = useState<SkuListItem[]>([]);
  const [skuLoading, setSkuLoading] = useState(false);
  const [skuLoaded, setSkuLoaded] = useState(false);
  const [skuError, setSkuError] = useState<string | null>(null);
  const [skuEditingRows, setSkuEditingRows] = useState<Record<string, boolean>>({});

  // Reset SKU state when the group changes.
  useEffect(() => {
    setSkuRows([]);
    setSkuLoaded(false);
    setSkuError(null);
    setSkuEditingRows({});
  }, [group.itemNumber, group.rows]);

  const loadSkus = useCallback(async () => {
    setSkuLoading(true);
    setSkuError(null);

    try {
      const pageSize = 200;
      let page = 1;
      let total = 0;
      const nextRows: SkuListItem[] = [];

      do {
        const response = await SkuService.getSkuList({
          q: group.itemNumber,
          page,
          pageSize,
          sortField: "sku",
          sortOrder: "asc",
        });

        const exactMatches = response.items.filter((row) => row.itemNumber === group.itemNumber);
        nextRows.push(...exactMatches);

        total = response.total;
        page += 1;

        if (response.items.length === 0) {
          break;
        }
      } while ((page - 1) * pageSize < total);

      setSkuRows(nextRows);
      setSkuLoaded(true);
    } catch (err: unknown) {
      setSkuError(getErrorMessage(err, "Unable to load SKU list."));
    } finally {
      setSkuLoading(false);
    }
  }, [group.itemNumber]);

  // Lazy-load the SKU List tab on first activation.
  useEffect(() => {
    if (activeTab !== "sku-list" || skuLoaded) {
      return;
    }
    void loadSkus();
  }, [activeTab, skuLoaded, loadSkus]);

  const handleSkuRowEditComplete = useCallback(async (event: DataTableRowEditCompleteEvent) => {
    if (!isEditable) {
      return;
    }

    const original = event.data as SkuListItem;
    const updated = event.newData as SkuListItem;
    const nextSku = (updated.sku ?? "").trim().toUpperCase();
    const currentSku = (original.sku ?? "").trim().toUpperCase();

    if (!nextSku) {
      notify?.("warn", "SKU required", "Enter a SKU value.");
      await loadSkus();
      return;
    }

    if (nextSku === currentSku) {
      setSkuRows((prev) =>
        prev.map((row) => (row.skuId === updated.skuId ? { ...row, sku: nextSku } : row))
      );
      return;
    }

    try {
      const saved = await SkuService.updateSku(updated.skuId, nextSku);
      setSkuRows((prev) =>
        prev.map((row) => (row.skuId === saved.skuId ? { ...row, sku: saved.sku } : row))
      );
      notify?.("success", "SKU updated", `${original.itemNumber} ${original.colorName} ${original.sizeName}`);
    } catch (err: unknown) {
      notify?.("error", "Save failed", getErrorMessage(err, "Unable to update SKU."));
      await loadSkus();
    }
  }, [isEditable, loadSkus, notify]);

  return {
    skuRows,
    skuLoading,
    skuError,
    skuEditingRows,
    setSkuEditingRows,
    onRowEditComplete: handleSkuRowEditComplete,
  };
};
