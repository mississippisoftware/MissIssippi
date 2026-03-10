import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { SkuService } from "../service/SkuService";
import { InventoryHistoryService } from "../service/InventoryHistoryService";
import CatalogPageLayout from "../components/CatalogPageLayout";
import ConfirmSwitchModeModal from "../components/ConfirmSwitchModeModal";
import ScannerPanel from "../components/scan/ScannerPanel";
import ScannedItemsPanel from "../components/scan/ScannedItemsPanel";
import RecentScanBatchesPanel from "../components/scan/RecentScanBatchesPanel";
import ScanBatchPreviewModal from "../components/scan/ScanBatchPreviewModal";
import { useInventorySizes } from "../hooks/useInventorySizes";
import { useConfirmSwitchMode } from "../hooks/useConfirmSwitchMode";
import { useNotifier } from "../hooks/useNotifier";
import { useSkuScanner, type ScannedItem } from "../hooks/useSkuScanner";
import type { SkuAdjustment } from "../utils/SkuInterfaces";
import type { InventoryHistoryBatchDetail, InventoryHistoryBatchSummary } from "../utils/inventoryHistoryTypes";
import { printScanHtml } from "../utils/scanPrintHtml";
import { buildScanTableRows } from "../utils/buildScanTableRows";
import { appendSheet, createWorkbook, saveWorkbook, sheetFromAoa } from "../utils/xlsxUtils";
import { getErrorMessage } from "../utils/errors";

type ScanMode = "add" | "remove";
type ScanTrigger = "auto" | "manual";

export default function InventoryScan() {
  const toastRef = useRef<Toast>(null);
  const notify = useNotifier(toastRef);
  const [mode, setMode] = useState<ScanMode | null>(null);
  const [trigger, setTrigger] = useState<ScanTrigger>("auto");
  const [scanView, setScanView] = useState<"list" | "table">("table");
  const { sizeColumns, sizeLoading, sizeError } = useInventorySizes();
  const [saving, setSaving] = useState(false);
  const [skuSuggestions, setSkuSuggestions] = useState<string[]>([]);
  const skuSuggestRequestRef = useRef(0);
  const [batchMemo, setBatchMemo] = useState("");
  const [recentScanBatches, setRecentScanBatches] = useState<InventoryHistoryBatchSummary[]>([]);
  const [loadingRecentScanBatches, setLoadingRecentScanBatches] = useState(false);
  const [recentBatchDetails, setRecentBatchDetails] = useState<Record<string, InventoryHistoryBatchDetail>>({});
  const [selectedRecentBatchId, setSelectedRecentBatchId] = useState<string | null>(null);
  const [showRecentBatchModal, setShowRecentBatchModal] = useState(false);
  const [loadingRecentBatchDetail, setLoadingRecentBatchDetail] = useState(false);
  const [recentBatchPreviewView, setRecentBatchPreviewView] = useState<"list" | "table">("table");

  const {
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
    onModeChanged,
    handleScan,
    handleInputChange,
    handleQtyChange,
    handleGroupedQtyChange,
    handleRemoveItem,
  } = useSkuScanner({
    mode,
    trigger,
    lookupSku: SkuService.lookupSku,
  });

  const clearCurrentScanBatch = useCallback(() => {
    clearAll();
    setBatchMemo("");
  }, [clearAll]);

  const {
    pendingMode,
    showModal,
    requestModeChange,
    confirmKeep,
    confirmClear,
    cancel,
  } = useConfirmSwitchMode({
    mode,
    hasScans: scannedItems.length > 0,
    clearAll: clearCurrentScanBatch,
    onModeSelected: (next) => {
      setMode(next);
      onModeChanged();
    },
  });

  const scanTableRows = useMemo(() => buildScanTableRows(scannedItems), [scannedItems]);
  const selectedRecentBatch = selectedRecentBatchId ? recentBatchDetails[selectedRecentBatchId] ?? null : null;

  const recentBatchPreview = useMemo(() => {
    if (!selectedRecentBatch) {
      return { items: [] as ScannedItem[] };
    }
    const items: ScannedItem[] = [];
    selectedRecentBatch.lines.forEach((line) => {
      if (!line.delta) {
        return;
      }
      const sku = (line.sku ?? "").trim();
      const direction: 1 | -1 = line.delta >= 0 ? 1 : -1;
      items.push({
        sku,
        seasonId: 0,
        seasonName: line.seasonName,
        itemId: 0,
        itemNumber: line.itemNumber,
        colorId: 0,
        colorName: line.colorName,
        sizeId: 0,
        sizeName: line.sizeName,
        itemColorId: 0,
        inventoryId: null,
        qty: null,
        imageUrl: null,
        delta: line.delta,
        scans: Math.abs(line.delta),
        direction,
      });
    });
    return { items };
  }, [selectedRecentBatch]);
  const recentBatchPreviewTableRows = useMemo(
    () => buildScanTableRows(recentBatchPreview.items),
    [recentBatchPreview.items]
  );

  const showPreview = status.type === "recognized" && !!preview;

  const loadRecentScanBatches = useCallback(async () => {
    setLoadingRecentScanBatches(true);
    try {
      const batches = await InventoryHistoryService.getBatches({ source: "scan", take: 3 });
      setRecentScanBatches(batches);
    } catch (err: unknown) {
      console.error(err);
      notify("error", "Load failed", getErrorMessage(err, "Unable to load recent scan batches."));
    } finally {
      setLoadingRecentScanBatches(false);
    }
  }, [notify]);

  useEffect(() => {
    loadRecentScanBatches();
  }, [loadRecentScanBatches]);

  const handleSkuSuggest = useCallback(
    async (query: string) => {
      if (trigger !== "manual") {
        return;
      }

      const trimmed = query.trim();
      if (trimmed.length < 2) {
        setSkuSuggestions([]);
        return;
      }

      const requestId = (skuSuggestRequestRef.current += 1);
      try {
        const response = await SkuService.getSkuList({
          q: trimmed,
          page: 1,
          pageSize: 100,
          sortField: "sku",
          sortOrder: "asc",
        });
        if (requestId !== skuSuggestRequestRef.current) {
          return;
        }
        setSkuSuggestions(response.items.map((item) => item.sku));
      } catch (err: unknown) {
        console.error(err);
        if (requestId === skuSuggestRequestRef.current) {
          setSkuSuggestions([]);
        }
      }
    },
    [trigger]
  );

  const handleSave = async () => {
    if (!scannedItems.length) {
      notify("info", "No scans", "Scan SKUs before saving.");
      return;
    }

    const adjustments: SkuAdjustment[] = scannedItems
      .filter((item) => item.delta !== 0)
      .map((item) => ({
        sku: item.sku,
        delta: item.delta,
      }));

    if (!adjustments.length) {
      notify("info", "No changes", "All scanned items are net zero.");
      return;
    }

    setSaving(true);
    try {
      const notes = batchMemo.trim();
      const result = await SkuService.applyAdjustments(adjustments, { notes: notes || null });
      const missing = result.missingSkus ?? [];

      if (missing.length) {
        notify("warn", "Partial save", `Saved ${result.updatedCount}. Missing SKUs: ${missing.join(", ")}`);
      } else {
        notify("success", "Saved", `Saved ${result.updatedCount} updates.`);
      }

      clearScansOnly();
      resetStatus();
      setBatchMemo("");
      await loadRecentScanBatches();
    } catch (err: unknown) {
      console.error(err);
      notify("error", "Save failed", getErrorMessage(err, "Unable to save adjustments."));
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    if (!scannedItems.length) {
      notify("info", "No scans", "Scan SKUs before printing.");
      return;
    }

    printScanHtml(
      {
        mode,
        totalDelta,
        scannedItems,
        scanView,
        sizeColumns,
        scanTableRows,
      },
      {
        onError: () => {
          notify("error", "Print failed", "Unable to open print preview.");
        },
      }
    );
  };

  const handleScanTableQtyChange = useCallback(
    (
      itemNumber: string,
      colorName: string,
      sizeName: string,
      qty: number,
      row?: { seasonName?: string }
    ) => {
      const updated = handleGroupedQtyChange(itemNumber, colorName, sizeName, qty, row?.seasonName);
      if (!updated) {
        notify(
          "warn",
          "Cannot edit that size yet",
          "That size is not in the current scanned list. Scan it first, then edit the QtyChange."
        );
      }
    },
    [handleGroupedQtyChange, notify]
  );

  const handleOpenRecentScanBatch = useCallback(
    async (batchId: string) => {
      setSelectedRecentBatchId(batchId);
      setShowRecentBatchModal(true);
      setRecentBatchPreviewView("table");

      if (recentBatchDetails[batchId]) {
        return;
      }

      setLoadingRecentBatchDetail(true);
      try {
        const detail = await InventoryHistoryService.getBatchDetails(batchId);
        setRecentBatchDetails((prev) => ({ ...prev, [batchId]: detail }));
      } catch (err: unknown) {
        console.error(err);
        notify("error", "Load failed", getErrorMessage(err, "Unable to load batch details."));
      } finally {
        setLoadingRecentBatchDetail(false);
      }
    },
    [getErrorMessage, notify, recentBatchDetails]
  );

  const handlePrintRecentBatch = () => {
    if (!selectedRecentBatch) {
      notify("info", "No batch", "Open a recent batch first.");
      return;
    }
    if (!recentBatchPreview.items.length) {
      notify("warn", "No printable lines", "This batch has no lines with an available SKU.");
      return;
    }
    printScanHtml(
      {
        mode: null,
        totalDelta: recentBatchPreview.items.reduce((sum, item) => sum + item.delta, 0),
        scannedItems: recentBatchPreview.items,
        scanView: recentBatchPreviewView,
        sizeColumns,
        scanTableRows: recentBatchPreviewTableRows,
      },
      {
        onError: () => notify("error", "Print failed", "Unable to open print preview."),
      }
    );
  };

  const handleDownloadRecentBatch = () => {
    if (!selectedRecentBatch) {
      notify("info", "No batch", "Open a recent batch first.");
      return;
    }
    if (recentBatchPreviewTableRows.length === 0) {
      notify("warn", "No rows", "No rows are available to download.");
      return;
    }
    try {
      const headers = ["Season", "Style", "Color", ...sizeColumns.map((size) => size.sizeName), "Total"];
      const rows = recentBatchPreviewTableRows.map((row) => {
        const sizeValues = sizeColumns.map((size) => row.sizes[size.sizeName]?.qty ?? 0);
        const total = sizeValues.reduce((sum, qty) => sum + qty, 0);
        return [row.seasonName ?? "", row.itemNumber, row.colorName, ...sizeValues, total];
      });

      const workbook = createWorkbook();
      appendSheet(workbook, sheetFromAoa([headers, ...rows]), "Scan Batch");
      saveWorkbook(workbook, "scan_batch_table");
    } catch (err: unknown) {
      console.error(err);
      notify("error", "Download failed", getErrorMessage(err, "Unable to download batch."));
    }
  };

  return (
    <CatalogPageLayout
      title="Scan Inventory"
      subtitle="Scan SKUs to adjust inventory counts."
      className="catalog-page--wide"
    >
      <Toast ref={toastRef} position="top-right" />

      <div className="scan-page">
        <div className="scan-section">
          <ScannerPanel
            mode={mode}
            trigger={trigger}
            skuInput={skuInput}
            readyToMatch={readyToMatch}
            lookupLoading={lookupLoading}
            saving={saving}
            instructionMessage={instructionMessage}
            skuSuggestions={skuSuggestions}
            onSearchSuggestions={handleSkuSuggest}
            onSelectMode={requestModeChange}
            onToggleTrigger={(checked) => {
              if (!mode) return;
              setTrigger(checked ? "manual" : "auto");
              setSkuSuggestions([]);
              resetStatus();
            }}
            onInputChange={handleInputChange}
            onEnter={() => handleScan(skuInput)}
            onMatch={() => handleScan(skuInput)}
            status={status}
            preview={preview}
            showPreview={showPreview}
          />
        </div>

        <div className="scan-section-divider" />

        <div className="scan-section">
          <ScannedItemsPanel
            mode={mode}
            scanView={scanView}
            totalDelta={totalDelta}
            scannedItems={scannedItems}
            saving={saving}
            sizeColumns={sizeColumns}
            sizeLoading={sizeLoading}
            sizeError={sizeError}
            scanTableRows={scanTableRows}
            batchMemo={batchMemo}
            onBatchMemoChange={setBatchMemo}
            onToggleView={(next) => setScanView(next)}
            onQtyChange={handleQtyChange}
            onTableQtyChange={handleScanTableQtyChange}
            onRemoveItem={handleRemoveItem}
            onPrint={handlePrint}
            onDiscard={clearCurrentScanBatch}
            onSave={handleSave}
          />
        </div>

        <div className="scan-section">
          <RecentScanBatchesPanel
            recentScanBatches={recentScanBatches}
            loadingRecentScanBatches={loadingRecentScanBatches}
            onRefreshRecentScanBatches={loadRecentScanBatches}
            onOpenRecentScanBatch={handleOpenRecentScanBatch}
          />
        </div>
      </div>

      <ScanBatchPreviewModal
        show={showRecentBatchModal}
        loading={loadingRecentBatchDetail && !selectedRecentBatch}
        batch={selectedRecentBatch}
        view={recentBatchPreviewView}
        previewItems={recentBatchPreview.items}
        scanTableRows={recentBatchPreviewTableRows}
        sizeColumns={sizeColumns}
        sizeLoading={sizeLoading}
        sizeError={sizeError}
        onToggleView={setRecentBatchPreviewView}
        onClose={() => setShowRecentBatchModal(false)}
        onPrint={handlePrintRecentBatch}
        onDownload={handleDownloadRecentBatch}
      />

      <ConfirmSwitchModeModal
        show={showModal}
        pendingMode={pendingMode}
        onCancel={cancel}
        onKeepAndSwitch={confirmKeep}
        onClearAndSwitch={confirmClear}
      />
    </CatalogPageLayout>
  );
}

