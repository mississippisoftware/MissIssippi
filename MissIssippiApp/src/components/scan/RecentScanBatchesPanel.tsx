import type { InventoryHistoryBatchSummary } from "../../utils/inventoryHistoryTypes";
import { formatSignedQty } from "../../utils/format";
import { formatBatchTimestamp } from "../../utils/dateFormat";

type RecentScanBatchesPanelProps = {
  recentScanBatches: InventoryHistoryBatchSummary[];
  loadingRecentScanBatches: boolean;
  onRefreshRecentScanBatches: () => void;
  onOpenRecentScanBatch: (batchId: string) => void;
};

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
  <div className="scan-step">
    <div className="scan-step__label">
      <div className="scan-step__icon">
        <i className="pi pi-history" aria-hidden="true" />
      </div>
      <div className="scan-step__title">Recent scans</div>
      <div className="scan-step__desc">Last 3 saved batches. See Inventory History for more.</div>
    </div>

    <div className="scan-step__content">
      <div className="scan-batches-header">
        <span className="pt-text-body-strong">Recent scan batches</span>
        <button
          type="button"
          className="scan-refresh-btn"
          onClick={onRefreshRecentScanBatches}
          disabled={loadingRecentScanBatches}
        >
          <i className="pi pi-refresh" aria-hidden="true" />
          {loadingRecentScanBatches ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {recentScanBatches.length === 0 && !loadingRecentScanBatches ? (
        <div className="scan-empty-state">
          <i className="pi pi-inbox" aria-hidden="true" />
          <p className="pt-text-meta">No recent scan batches yet.</p>
        </div>
      ) : (
        <table className="scan-batch-table">
          <thead>
            <tr>
              <th>Batch</th>
              <th className="r">Lines</th>
              <th className="r">Qty change</th>
              <th className="r">Open</th>
            </tr>
          </thead>
          <tbody>
            {recentScanBatches.map((batch) => (
              <tr key={batch.batchId}>
                <td>
                  <div className="pt-text-body-strong">{getBatchDisplayName(batch)}</div>
                  {batch.notes?.trim() ? (
                    <div className="pt-text-meta">{formatBatchTimestamp(batch.batchTimestamp)}</div>
                  ) : null}
                </td>
                <td className="r">{batch.totalLines}</td>
                <td className="r">
                  <span className={batch.totalDelta >= 0 ? "scan-delta-pos" : "scan-delta-neg"}>
                    {batch.totalDelta >= 0 ? `+${batch.totalDelta}` : formatSignedQty(batch.totalDelta)}
                  </span>
                </td>
                <td className="r">
                  <button
                    type="button"
                    className="scan-view-btn"
                    onClick={() => onOpenRecentScanBatch(batch.batchId)}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  </div>
);

export default RecentScanBatchesPanel;
