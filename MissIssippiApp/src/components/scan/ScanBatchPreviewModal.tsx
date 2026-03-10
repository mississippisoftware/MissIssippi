import { Button, Modal, Table } from "react-bootstrap";
import ViewToggle from "../ViewToggle";
import InventoryTable, { type FilterableColumn } from "../../inventory/InventoryTable";
import PageActionsRow from "../PageActionsRow";
import type { ScannedItem } from "../../hooks/useSkuScanner";
import type { iInventoryDisplayRow, iSize } from "../../utils/DataInterfaces";
import type { InventoryHistoryBatchDetail } from "../../utils/inventoryHistoryTypes";
import { formatSignedQty } from "../../utils/format";

type ScanBatchPreviewView = "list" | "table";

type ScanBatchPreviewModalProps = {
  show: boolean;
  loading: boolean;
  batch: InventoryHistoryBatchDetail | null;
  view: ScanBatchPreviewView;
  previewItems: ScannedItem[];
  scanTableRows: iInventoryDisplayRow[];
  sizeColumns: iSize[];
  sizeLoading: boolean;
  sizeError: string | null;
  onToggleView: (next: ScanBatchPreviewView) => void;
  onClose: () => void;
  onPrint: () => void;
  onDownload: () => void;
};

const SCAN_TABLE_COLUMNS: FilterableColumn[] = [
  { field: "seasonName", header: "Season", filterMatchMode: "startsWith", className: "col-season" },
  { field: "itemNumber", header: "Style", filterMatchMode: "startsWith", className: "col-style" },
  { field: "colorName", header: "Color", filterMatchMode: "contains", className: "col-color" },
];

const formatBatchTimestamp = (value?: string | null) =>
  value
    ? new Date(value).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "";

const getBatchTitle = (batch: InventoryHistoryBatchDetail | null) => {
  const memo = batch?.notes?.trim();
  return memo || formatBatchTimestamp(batch?.batchTimestamp) || "Scan Batch Preview";
};

export default function ScanBatchPreviewModal({
  show,
  loading,
  batch,
  view,
  previewItems,
  scanTableRows,
  sizeColumns,
  sizeLoading,
  sizeError,
  onToggleView,
  onClose,
  onPrint,
  onDownload,
}: ScanBatchPreviewModalProps) {
  const canPrint = previewItems.length > 0 && !loading;
  const canDownload = !!batch && !loading;

  return (
    <Modal show={show} onHide={onClose} centered size="xl">
      <Modal.Header closeButton>
        <Modal.Title>{getBatchTitle(batch)}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loading && <div className="text-muted">Loading batch details...</div>}
        {!loading && !batch && <div className="text-muted">No batch selected.</div>}

        {!loading && batch && (
          <>
            <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
              <div>
                <div className="fw-semibold">{formatBatchTimestamp(batch.batchTimestamp)}</div>
                <div className="text-muted small">
                  Batch {batch.batchId} | Lines: {batch.totalLines} | Total QtyChange:{" "}
                  {formatSignedQty(batch.totalDelta)}
                </div>
                {batch.notes?.trim() ? (
                  <div className="text-muted small mt-1">Memo: {batch.notes.trim()}</div>
                ) : null}
              </div>
              <ViewToggle
                ariaLabel="Batch preview view"
                leftLabel="List"
                rightLabel="Table"
                leftActive={view === "list"}
                rightActive={view === "table"}
                checked={view === "table"}
                switchAriaLabel="Toggle batch preview table view"
                leftIcon="pi pi-list"
                rightIcon="pi pi-table"
                leftIconWrapperClassName="scan-section-icon scan-icon-blue"
                rightIconWrapperClassName="scan-section-icon scan-icon-green"
                onLeftClick={() => onToggleView("list")}
                onRightClick={() => onToggleView("table")}
                onToggle={(checked) => onToggleView(checked ? "table" : "list")}
              />
            </div>

            {view === "list" ? (
              <div className="sku-scan-list">
                <Table hover responsive className="sku-scan-table mb-0">
                  <thead>
                    <tr>
                      <th>SKU</th>
                      <th>Style</th>
                      <th>Color</th>
                      <th>Size</th>
                      <th className="text-end">Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewItems.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center text-muted py-4">
                          No scan lines available for preview.
                        </td>
                      </tr>
                    ) : (
                      previewItems.map((item, index) => (
                        <tr key={`${item.sku}-${item.itemNumber}-${item.sizeName}-${index}`}>
                          <td>{item.sku}</td>
                          <td>{item.itemNumber}</td>
                          <td>{item.colorName}</td>
                          <td>{item.sizeName}</td>
                          <td className="text-end">{formatSignedQty(item.delta)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </div>
            ) : (
              <div className="sku-scan-table-view">
                {sizeError && <div className="text-danger mb-3">Failed to load sizes: {sizeError}</div>}
                {!sizeLoading && scanTableRows.length === 0 ? (
                  <div className="text-center text-muted py-4">No scan lines available for preview.</div>
                ) : (
                  <InventoryTable
                    embedded
                    inventory={scanTableRows}
                    sizeColumns={sizeColumns}
                    filteredColumns={SCAN_TABLE_COLUMNS}
                    loading={sizeLoading}
                    scrollHeight="360px"
                    showRowTotals
                  />
                )}
              </div>
            )}
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <PageActionsRow className="w-100 justify-content-end">
          <Button type="button" className="btn-neutral btn-outlined" onClick={onClose}>
            <i className="pi pi-times" aria-hidden="true" />
            Close
          </Button>
          <Button type="button" className="btn-warn btn-outlined" onClick={onPrint} disabled={!canPrint}>
            <i className="pi pi-print" aria-hidden="true" />
            Print
          </Button>
          <Button type="button" className="btn-info btn-outlined" onClick={onDownload} disabled={!canDownload}>
            <i className="pi pi-download" aria-hidden="true" />
            Download
          </Button>
        </PageActionsRow>
      </Modal.Footer>
    </Modal>
  );
}
