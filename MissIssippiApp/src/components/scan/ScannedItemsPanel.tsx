import { Button, Card, Col, Form, Row, Table } from "react-bootstrap";
import ViewToggle from "../ViewToggle";
import InventoryTable, { type FilterableColumn } from "../../inventory/InventoryTable";
import PageActionsRow from "../PageActionsRow";
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
  mode,
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
}: ScannedItemsPanelProps) => (
  <Row className="gx-3 gy-4 align-items-start">
    <Col lg={3} className="scan-section-aside">
      <div className="scan-section-info">
        <div className="scan-section-title">
          <span className="scan-section-icon scan-icon-blue">
            <i className="pi pi-list" aria-hidden="true" />
          </span>
          <h5>Scanned Items</h5>
        </div>
        <p className="text-muted mb-0">Review the list and remove any mistakes before saving.</p>
      </div>
    </Col>
    <Col lg={9}>
      <Card
        className={`sku-scan-list-card ${mode === "add" ? "add-mode" : mode === "remove" ? "remove-mode" : ""}`}
      >
        <Card.Header className="bg-white border-0">
          <div className="d-flex justify-content-between align-items-start gap-3">
            <div className="card-heading flex-grow-1">
              <div>
                <h4 className="mb-1 card-heading-title">Scanned Items</h4>
                <Form.Control
                  type="text"
                  value={batchMemo}
                  onChange={(event) => onBatchMemoChange(event.target.value)}
                  placeholder="Batch memo (optional)"
                  aria-label="Batch memo"
                  maxLength={200}
                  disabled={saving}
                  className="scan-batch-memo-input mt-2"
                />
                <small className="text-muted">
                  Net change: {totalDelta === 0 ? "+0" : formatSignedQty(totalDelta)}
                </small>
              </div>
            </div>
            <div className="inventory-view-toggle-wrapper">
              <ViewToggle
                ariaLabel="Scanned items view"
                leftLabel="List"
                rightLabel="Table"
                leftActive={scanView === "list"}
                rightActive={scanView === "table"}
                checked={scanView === "table"}
                switchAriaLabel="Toggle table view"
                leftIcon="pi pi-list"
                rightIcon="pi pi-table"
                leftIconWrapperClassName="scan-section-icon scan-icon-blue"
                rightIconWrapperClassName="scan-section-icon scan-icon-green"
                onLeftClick={() => onToggleView("list")}
                onRightClick={() => onToggleView("table")}
                onToggle={(checked) => onToggleView(checked ? "table" : "list")}
              />
            </div>
          </div>
        </Card.Header>
        <Card.Body className="pt-0">
          {scanView === "list" ? (
            <div className="sku-scan-list">
              <Table hover responsive className="sku-scan-table mb-0">
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
                  {scannedItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center text-muted py-4">
                        No scans yet.
                      </td>
                    </tr>
                  ) : (
                    scannedItems.map((item) => (
                      <tr key={item.sku}>
                        <td className="text-nowrap">
                          <Form.Control
                            value={item.sku}
                            readOnly
                            className="sku-scan-sku-input"
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
                            <Form.Control
                              type="number"
                              min={0}
                              step={1}
                              value={Math.abs(item.delta)}
                              className="sku-scan-qty-field"
                              onChange={(e) => onQtyChange(item.sku, e.target.value)}
                            />
                          </div>
                        </td>
                        <td className="text-end">
                          <Button
                            type="button"
                            className="btn-danger btn-text btn-icon"
                            onClick={() => onRemoveItem(item.sku)}
                            aria-label="Remove item"
                          >
                            <i className="pi pi-trash" aria-hidden="true" />
                          </Button>
                        </td>
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
                <div className="text-center text-muted py-4">No scans yet.</div>
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
        </Card.Body>
        <Card.Footer className="bg-white border-0">
          <PageActionsRow>
            <Button
              type="button"
              className="btn-warn btn-outlined"
              onClick={onPrint}
              disabled={scannedItems.length === 0 || saving}
            >
              <i className="pi pi-print" aria-hidden="true" />
              Print
            </Button>
            <Button
              type="button"
              className="btn-danger btn-outlined"
              onClick={onDiscard}
              disabled={scannedItems.length === 0 || saving}
            >
              <i className="pi pi-times" aria-hidden="true" />
              Discard
            </Button>
            <Button
              type="button"
              className="btn-success"
              onClick={onSave}
              disabled={scannedItems.length === 0 || saving}
            >
              <i className="pi pi-save" aria-hidden="true" />
              {saving ? "Saving..." : "Save"}
            </Button>
          </PageActionsRow>
        </Card.Footer>
      </Card>
    </Col>
  </Row>
);

export default ScannedItemsPanel;
