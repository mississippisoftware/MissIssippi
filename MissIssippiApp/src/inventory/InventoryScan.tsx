import { useMemo, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { SkuService } from "../service/SkuService";
import CatalogPageLayout from "../components/CatalogPageLayout";
import ConfirmSwitchModeModal from "../components/ConfirmSwitchModeModal";
import ScannerPanel from "../components/scan/ScannerPanel";
import ScannedItemsPanel from "../components/scan/ScannedItemsPanel";
import { useInventorySizes } from "../hooks/useInventorySizes";
import { useConfirmSwitchMode } from "../hooks/useConfirmSwitchMode";
import { useNotifier } from "../hooks/useNotifier";
import { useSkuScanner } from "../hooks/useSkuScanner";
import type { SkuAdjustment } from "../utils/SkuInterfaces";
import { printScanHtml } from "../utils/scanPrintHtml";
import { buildScanTableRows } from "../utils/buildScanTableRows";

type ScanMode = "add" | "remove";
type ScanTrigger = "auto" | "manual";

const getErrorMessage = (err: unknown, fallback: string) =>
  err instanceof Error ? err.message : fallback;

export default function InventoryScan() {
  const toastRef = useRef<Toast>(null);
  const notify = useNotifier(toastRef);
  const [mode, setMode] = useState<ScanMode | null>(null);
  const [trigger, setTrigger] = useState<ScanTrigger>("auto");
  const [scanView, setScanView] = useState<"list" | "table">("list");
  const { sizeColumns, sizeLoading, sizeError } = useInventorySizes();
  const [saving, setSaving] = useState(false);

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
    handleRemoveItem,
  } = useSkuScanner({
    mode,
    trigger,
    lookupSku: SkuService.lookupSku,
  });

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
    clearAll,
    onModeSelected: (next) => {
      setMode(next);
      onModeChanged();
    },
  });

  const scanTableRows = useMemo(() => buildScanTableRows(scannedItems), [scannedItems]);

  const showPreview = status.type === "recognized" && !!preview;

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
      const result = await SkuService.applyAdjustments(adjustments);
      const missing = result.missingSkus ?? [];

      if (missing.length) {
        notify("warn", "Partial save", `Saved ${result.updatedCount}. Missing SKUs: ${missing.join(", ")}`);
      } else {
        notify("success", "Saved", `Saved ${result.updatedCount} updates.`);
      }

      clearScansOnly();
      resetStatus();
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
            onSelectMode={requestModeChange}
            onToggleTrigger={(checked) => {
              if (!mode) return;
              setTrigger(checked ? "manual" : "auto");
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
            onToggleView={(next) => setScanView(next)}
            onQtyChange={handleQtyChange}
            onRemoveItem={handleRemoveItem}
            onPrint={handlePrint}
            onDiscard={clearAll}
            onSave={handleSave}
          />
        </div>
      </div>

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

