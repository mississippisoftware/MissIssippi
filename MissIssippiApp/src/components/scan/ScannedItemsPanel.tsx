import InventoryTable, { type FilterableColumn } from "../../inventory/InventoryTable";
import type { iInventoryDisplayRow, iSize } from "../../utils/DataInterfaces";
import type { ScannedItem } from "../../hooks/useSkuScanner";
import { formatSignedQty } from "../../utils/format";

type ScanMode = "add" | "remove" | null;
type ScanView = "list" | "table";

type ScannedItemsPanelProps = {
  mode: ScanMode;
  scanView: ScanView;
  totalDelta: number;
  scannedItems: ScannedItem[];
  saving: boolean;
  sizeColumns: iSize[];
  sizeLoading: boolean;
  sizeError: string | null;
  scanTableRows: iInventoryDisplayRow[];
  batchMemo: string;
  onBatchMemoChange: (value: string) => void;
  onToggleView: (next: ScanView) => void;
  onQtyChange: (sku: string, value: string) => void;
  onTableQtyChange: (
    itemNumber: string,
    colorName: string,
    sizeName: string,
    qty: number,
    row?: iInventoryDisplayRow
  ) => void;
  onRemoveItem: (sku: string) => void;
  onPrint: () => void;
  onDiscard: () => void;
  onSave: () => void;
};

const SCAN_TABLE_COLUMNS: FilterableColumn[] = [
  { field: "seasonName", header: "Season", filterMatchMode: "startsWith", className: "col-season" },
  { field: "itemNumber", header: "Style", filterMatchMode: "startsWith", className: "col-style" },
  { field: "colorName", header: "Color", filterMatchMode: "contains", className: "col-color" },
];

const ScannedItemsPanel = ({
  scanView,
  totalDelta,
  scannedItems,
  saving,
  sizeColumns,
  sizeLoading,
  sizeError,
  scanTableRows,
  batchMemo,
  onBatchMemoChange,
  onToggleView,
  onQtyChange,
  onTableQtyChange,
  onRemoveItem,
  onPrint,
  onDiscard,
  onSave,
}: ScannedItemsPanelProps) => {
  const netChange = totalDelta;

  return (
    <div className="scan-step">
      <div className="scan-step__label">
        <div className="scan-step__icon">
          <i className="pi pi-list" aria-hidden="true" />
        </div>
        <div className="scan-step__title">Scanned items</div>
        <div className="scan-step__desc">Review before saving. Switch to List view to edit quantities.</div>
      </div>

      <div className="scan-step__content">
        {/* Header: memo + net change left, view switch right */}
        <div className="scan-items-header">
          <div className="scan-items-header__left">
            <input
              type="text"
              className="scan-memo-input"
              placeholder="Batch memo (optional)"
              value={batchMemo}
              onChange={(e) => onBatchMemoChange(e.target.value)}
              maxLength={200}
              disabled={saving}
            />
            <div className="scan-net-change">
              Net change:{" "}
              <strong>{netChange >= 0 ? `+${netChange}` : formatSignedQty(netChange)}</strong>
            </div>
          </div>
          <div className="inventory-view-switch">
            <button
              type="button"
              className={`inventory-view-switch-track${scanView === "list" ? " inventory-view-switch-track--active" : ""}`}
              onClick={() => onToggleView("list")}
            >
              List
            </button>
            <button
              type="button"
              className={`inventory-view-switch-track${scanView === "table" ? " inventory-view-switch-track--active" : ""}`}
              onClick={() => onToggleView("table")}
            >
              Table
            </button>
          </div>
        </div>

        {/* Content: empty state or list/table */}
        {scannedItems.length === 0 ? (
          <div className="scan-empty-state">
            <i className="pi pi-clipboard" aria-hidden="true" />
            <p className="pt-text-meta">No scans yet — choose Add or Remove above to begin</p>
          </div>
        ) : scanView === "list" ? (
          <div className="sku-scan-list">
            <table className="table table-hover sku-scan-table mb-0">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Style</th>
                  <th>Color</th>
                  <th>Size</th>
                  <th className="text-end">Qty</th>
                  <th className="text-end">Remove</th>
                </tr>
              </thead>
              <tbody>
                {scannedItems.map((item) => (
                  <tr key={item.sku}>
                    <td className="text-nowrap">
                      <input
                        value={item.sku}
                        readOnly
                        className="sku-scan-sku-input pt-form-input"
                        onFocus={(e) => e.currentTarget.select()}
                        onClick={(e) => e.currentTarget.select()}
                      />
                    </td>
                    <td>{item.itemNumber}</td>
                    <td>{item.colorName}</td>
                    <td>{item.sizeName}</td>
                    <td className="text-end">
                      <div className="sku-scan-qty-input">
                        <span
                          className={`sku-scan-qty-sign ${item.direction >= 0 ? "sku-scan-delta-positive" : "sku-scan-delta-negative"}`}
                        >
                          {item.direction >= 0 ? "+" : "-"}
                        </span>
                        <input
                          type="number"
                          min={0}
                          step={1}
                          value={Math.abs(item.delta)}
                          className="sku-scan-qty-field pt-form-input"
                          onChange={(e) => onQtyChange(item.sku, e.target.value)}
                        />
                      </div>
                    </td>
                    <td className="text-end">
                      <button
                        type="button"
                        className="btn-danger btn-text btn-icon"
                        onClick={() => onRemoveItem(item.sku)}
                        aria-label="Remove item"
                      >
                        <i className="pi pi-trash" aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="sku-scan-table-view">
            {sizeError ? <div className="pt-error-notice">Failed to load sizes: {sizeError}</div> : null}
            {!sizeLoading && scanTableRows.length === 0 ? (
              <div className="pt-table-empty">No scans yet.</div>
            ) : (
              <InventoryTable
                embedded
                inventory={scanTableRows}
                sizeColumns={sizeColumns}
                editable
                filteredColumns={SCAN_TABLE_COLUMNS}
                loading={sizeLoading}
                scrollHeight="360px"
                showRowTotals
                onQtyChange={onTableQtyChange}
              />
            )}
          </div>
        )}

        {/* Footer actions */}
        <div className="scan-foot-actions">
          <button
            type="button"
            className="pt-btn pt-btn--secondary"
            onClick={onPrint}
            disabled={scannedItems.length === 0 || saving}
          >
            <i className="pi pi-print" aria-hidden="true" />
            Print
          </button>
          <button
            type="button"
            className="pt-btn pt-btn--danger-outline"
            onClick={onDiscard}
            disabled={scannedItems.length === 0 || saving}
          >
            <i className="pi pi-times" aria-hidden="true" />
            Discard
          </button>
          <button
            type="button"
            className="pt-btn pt-btn--primary"
            onClick={onSave}
            disabled={scannedItems.length === 0 || saving}
          >
            <i className="pi pi-save" aria-hidden="true" />
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScannedItemsPanel;
