import { Button, Card, Col, Row, Table } from "react-bootstrap";
import type { InventoryHistoryBatchSummary } from "../../utils/inventoryHistoryTypes";
import { formatSignedQty } from "../../utils/format";

type RecentScanBatchesPanelProps = {
  recentScanBatches: InventoryHistoryBatchSummary[];
  loadingRecentScanBatches: boolean;
  onRefreshRecentScanBatches: () => void;
  onOpenRecentScanBatch: (batchId: string) => void;
};

const formatBatchTimestamp = (value: string) =>
  new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

const getBatchDisplayName = (batch: InventoryHistoryBatchSummary) => {
  const memo = batch.notes?.trim();
  return memo || formatBatchTimestamp(batch.batchTimestamp);
};

const RecentScanBatchesPanel = ({
  recentScanBatches,
  loadingRecentScanBatches,
  onRefreshRecentScanBatches,
  onOpenRecentScanBatch,
}: RecentScanBatchesPanelProps) => (
  <Row className="gx-3 gy-4 align-items-start">
    <Col lg={3} className="scan-section-aside">
      <div className="scan-section-info">
        <div className="scan-section-title">
          <span className="scan-section-icon scan-icon-green">
            <i className="pi pi-history" aria-hidden="true" />
          </span>
          <h5>Recent Scans</h5>
        </div>
        <p className="text-muted mb-0">
          Last 3 saved scan batches. For more scan batches, see Inventory History.
        </p>
      </div>
    </Col>
    <Col lg={9}>
      <Card className="sku-scan-list-card">
        <Card.Header className="bg-white border-0 d-flex justify-content-between align-items-center">
          <div className="card-heading">
            <div>
              <h4 className="mb-0 card-heading-title">Recent Scan Batches</h4>
            </div>
          </div>
          <Button
            type="button"
            className="btn-neutral btn-outlined btn-sm"
            onClick={onRefreshRecentScanBatches}
            disabled={loadingRecentScanBatches}
          >
            <i className="pi pi-refresh" aria-hidden="true" />
            {loadingRecentScanBatches ? "Refreshing..." : "Refresh"}
          </Button>
        </Card.Header>
        <Card.Body className="pt-0">
          {recentScanBatches.length === 0 && !loadingRecentScanBatches ? (
            <div className="text-muted py-2">No recent scan batches yet.</div>
          ) : (
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead>
                  <tr>
                    <th>Batch</th>
                    <th className="text-end">Lines</th>
                    <th className="text-end">QtyChange</th>
                    <th className="text-end">Open</th>
                  </tr>
                </thead>
                <tbody>
                  {recentScanBatches.map((batch) => (
                    <tr
                      key={batch.batchId}
                      role="button"
                      tabIndex={0}
                      onClick={() => onOpenRecentScanBatch(batch.batchId)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          onOpenRecentScanBatch(batch.batchId);
                        }
                      }}
                    >
                      <td>
                        <div className="fw-semibold">{getBatchDisplayName(batch)}</div>
                        {batch.notes?.trim() ? (
                          <div className="text-muted small text-nowrap">
                            {formatBatchTimestamp(batch.batchTimestamp)}
                          </div>
                        ) : null}
                      </td>
                      <td className="text-end">{batch.totalLines}</td>
                      <td className="text-end">{formatSignedQty(batch.totalDelta)}</td>
                      <td className="text-end">
                        <Button
                          type="button"
                          className="btn-neutral btn-outlined btn-sm"
                          onClick={(event) => {
                            event.stopPropagation();
                            onOpenRecentScanBatch(batch.batchId);
                          }}
                        >
                          <i className="pi pi-eye" aria-hidden="true" />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>
    </Col>
  </Row>
);

export default RecentScanBatchesPanel;
