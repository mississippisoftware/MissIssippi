import { useMemo, useRef, useState } from "react";
import type { SkuLookupResult } from "../utils/SkuInterfaces";
import { extractSku, hasCompleteSku, normalizeSkuInput } from "../utils/skuScan";

type ScanMode = "add" | "remove" | null;
type ScanTrigger = "auto" | "manual";

export type ScannedItem = SkuLookupResult & {
  delta: number;
  scans: number;
  direction: 1 | -1;
};

type ScanStatus = {
  type: "idle" | "recognized" | "unrecognized";
  message?: string;
};

type UseSkuScannerParams = {
  mode: ScanMode;
  trigger: ScanTrigger;
  lookupSku: (sku: string) => Promise<SkuLookupResult>;
};

const messageSeparator = " | ";

export const useSkuScanner = ({ mode, trigger, lookupSku }: UseSkuScannerParams) => {
  const [skuInput, setSkuInput] = useState("");
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const scannedItemsRef = useRef<ScannedItem[]>([]);
  const [preview, setPreview] = useState<SkuLookupResult | null>(null);
  const [status, setStatus] = useState<ScanStatus>({ type: "idle" });
  const [lookupLoading, setLookupLoading] = useState(false);
  const totalDelta = useMemo(
    () => scannedItems.reduce((sum, item) => sum + item.delta, 0),
    [scannedItems]
  );
  const readyToMatch = !!mode && trigger === "manual" && hasCompleteSku(skuInput);
  const instructionMessage = !mode
    ? "Choose Add Inventory or Remove Inventory to begin."
    : trigger === "auto"
      ? "Auto-scan is on. Enter SKU ending with * to scan."
      : "Manual scan is on. Type SKU and press Enter or Match.";

  const findItemIndexByNormalizedSku = (items: ScannedItem[], normalizedSku: string) => {
    for (let index = 0; index < items.length; index += 1) {
      if (normalizeSkuInput(items[index].sku) === normalizedSku) {
        return index;
      }
    }
    return -1;
  };

  const updateScannedItems = (updater: (prev: ScannedItem[]) => ScannedItem[]) => {
    scannedItemsRef.current = updater(scannedItemsRef.current);
    setScannedItems(updater);
  };

  const handleScan = async (rawValue: string) => {
    if (!mode) {
      setStatus({ type: "idle" });
      return;
    }

    const extracted = extractSku(rawValue);
    const normalized = normalizeSkuInput(extracted);
    if (!normalized) return;

    const delta = mode === "add" ? 1 : -1;
    const existingIndex = findItemIndexByNormalizedSku(scannedItemsRef.current, normalized);
    const existingSnapshot =
      existingIndex >= 0 ? scannedItemsRef.current[existingIndex] : null;

    if (existingSnapshot) {
      updateScannedItems((prev) => {
        const matchIndex = findItemIndexByNormalizedSku(prev, normalized);
        if (matchIndex < 0) return prev;
        const existing = prev[matchIndex];
        const nextDelta = existing.delta + delta;
        const nextDirection = nextDelta === 0 ? existing.direction : nextDelta >= 0 ? 1 : -1;
        const next = [...prev];
        next[matchIndex] = {
          ...existing,
          delta: nextDelta,
          scans: existing.scans + 1,
          direction: nextDirection,
        };
        return next;
      });
      setPreview(existingSnapshot);
      setStatus({
        type: "recognized",
        message: `${existingSnapshot.itemNumber}${messageSeparator}${existingSnapshot.colorName}${messageSeparator}${existingSnapshot.sizeName}`,
      });
      setSkuInput("");
      return;
    }

    setLookupLoading(true);
    try {
      const lookup = await lookupSku(normalized);
      const newItem: ScannedItem = {
        ...lookup,
        delta,
        scans: 1,
        direction: delta >= 0 ? 1 : -1,
      };

      updateScannedItems((prev) => {
        const matchIndex = findItemIndexByNormalizedSku(prev, normalized);
        if (matchIndex < 0) {
          return [newItem, ...prev];
        }
        const existing = prev[matchIndex];
        const nextDelta = existing.delta + delta;
        const nextDirection = nextDelta === 0 ? existing.direction : nextDelta >= 0 ? 1 : -1;
        const next = [...prev];
        next[matchIndex] = {
          ...existing,
          delta: nextDelta,
          scans: existing.scans + 1,
          direction: nextDirection,
        };
        return next;
      });
      setPreview(lookup);
      setStatus({
        type: "recognized",
        message: `${lookup.itemNumber}${messageSeparator}${lookup.colorName}${messageSeparator}${lookup.sizeName}`,
      });
      setSkuInput("");
    } catch (err: unknown) {
      console.error(err);
      setStatus({ type: "unrecognized", message: "SKU not recognized." });
      setPreview(null);
      setSkuInput("");
    } finally {
      setLookupLoading(false);
    }
  };

  const handleInputChange = (value: string) => {
    setSkuInput(value);
    if (!mode || trigger !== "auto") {
      return;
    }
    if (hasCompleteSku(value)) {
      handleScan(value);
    }
  };

  const resetStatus = () => {
    setStatus({ type: "idle" });
    setPreview(null);
  };

  const clearAll = () => {
    updateScannedItems(() => []);
    setPreview(null);
    setStatus({ type: "idle" });
    setSkuInput("");
  };

  const clearScansOnly = () => {
    updateScannedItems(() => []);
  };

  const replaceScannedItems = (items: ScannedItem[]) => {
    const next = [...items];
    scannedItemsRef.current = next;
    setScannedItems(next);
  };

  const onModeChanged = () => {
    setStatus({ type: "idle" });
    setPreview(null);
  };

  const handleRemoveItem = (sku: string) => {
    updateScannedItems((items) => items.filter((item) => item.sku !== sku));
    setPreview((current) => (current?.sku === sku ? null : current));
  };

  const handleQtyChange = (sku: string, value: string) => {
    const parsed = Number.parseInt(value, 10);
    const nextQty = Number.isNaN(parsed) ? 0 : Math.max(0, parsed);
    updateScannedItems((items) =>
      items.map((item) => (item.sku === sku ? { ...item, delta: nextQty * item.direction } : item))
    );
  };

  const handleGroupedQtyChange = (
    itemNumber: string,
    colorName: string,
    sizeName: string,
    qty: number,
    seasonName?: string
  ): boolean => {
    const nextQty = Math.max(0, Math.floor(Number.isFinite(qty) ? qty : 0));
    const normalizedSeason = (seasonName ?? "").trim().toLowerCase();
    const match = scannedItemsRef.current.find((item) => {
      if (item.itemNumber !== itemNumber || item.colorName !== colorName || item.sizeName !== sizeName) {
        return false;
      }
      if (!normalizedSeason) {
        return true;
      }
      return (item.seasonName ?? "").trim().toLowerCase() === normalizedSeason;
    });

    if (!match) {
      return false;
    }

    updateScannedItems((items) =>
      items.map((item) =>
        item.sku === match.sku ? { ...item, delta: nextQty * item.direction } : item
      )
    );
    return true;
  };

  return {
    skuInput,
    scannedItems,
    preview,
    status,
    lookupLoading,
    totalDelta,
    readyToMatch,
    instructionMessage,
    resetStatus,
    clearAll,
    clearScansOnly,
    replaceScannedItems,
    onModeChanged,
    handleScan,
    handleInputChange,
    handleQtyChange,
    handleGroupedQtyChange,
    handleRemoveItem,
  };
};
