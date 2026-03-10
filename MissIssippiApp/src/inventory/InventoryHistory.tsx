import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Form } from "react-bootstrap";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Toast } from "primereact/toast";
import CatalogPageLayout from "../components/CatalogPageLayout";
import ActionButton from "../components/ActionButton";
import PageActionsRow from "../components/PageActionsRow";
import ViewToggle from "../components/ViewToggle";
import { useNotifier } from "../hooks/useNotifier";
import { useInventorySizes } from "../hooks/useInventorySizes";
import { InventoryHistoryService } from "../service/InventoryHistoryService";
import InventoryTable, { type FilterableColumn } from "./InventoryTable";
import type {
  InventoryHistoryBatchDetail,
  InventoryHistoryBatchSummary,
  InventoryHistorySource,
} from "../utils/inventoryHistoryTypes";
import { buildScanTableRows } from "../utils/buildScanTableRows";
import { exportInventoryHistory } from "../utils/inventoryHistoryExport";
import { formatSignedQty } from "../utils/format";
import { printInventoryHistory } from "../utils/printInventoryHistory";
import { getErrorMessage } from "../utils/errors";

type RangeOption = "all" | "7" | "30";
type DetailsView = "list" | "table";

const RANGE_OPTIONS: Array<{ label: string; value: RangeOption }> = [
  { label: "All", value: "all" },
  { label: "Last 7 days", value: "7" },
  { label: "Last 30 days", value: "30" },
];

const DEFAULT_TAKE = 200;
const HISTORY_TABLE_COLUMNS: FilterableColumn[] = [
  { field: "seasonName", header: "Season", filterMatchMode: "startsWith", className: "col-season" },
  { field: "itemNumber", header: "Style", filterMatchMode: "startsWith", className: "col-style" },
  { field: "colorName", header: "Color", filterMatchMode: "contains", className: "col-color" },
];

const formatBatchTimestamp = (value: string) =>
  new Date(value).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

const buildDateRange = (range: RangeOption) => {
  if (range === "all") {
    return {};
  }
  const now = new Date();
  const from = new Date(now);
  const days = range === "7" ? 7 : 30;
  from.setDate(now.getDate() - days);
  return {
    from: from.toISOString(),
    to: now.toISOString(),
  };
};

export default function InventoryHistory() {
  const toastRef = useRef<Toast>(null);
  const notify = useNotifier(toastRef);
  const [searchText, setSearchText] = useState("");
  const [sourceFilter, setSourceFilter] = useState<InventoryHistorySource | "all">("all");
  const [rangeFilter, setRangeFilter] = useState<RangeOption>("30");
  const [batches, setBatches] = useState<InventoryHistoryBatchSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBatches, setSelectedBatches] = useState<InventoryHistoryBatchSummary[]>([]);
  const [batchDetails, setBatchDetails] = useState<Record<string, InventoryHistoryBatchDetail>>({});
  const [visibleBatchIds, setVisibleBatchIds] = useState<string[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailsView, setDetailsView] = useState<DetailsView>("list");
  const initialFilters = useRef({ source: sourceFilter, range: rangeFilter });
  const { sizeColumns, sizeLoading, sizeError } = useInventorySizes();

  const loadBatches = useCallback(
    async (source: InventoryHistorySource | "all", range: RangeOption) => {
      setLoading(true);
      try {
        const { from, to } = buildDateRange(range);
        const data = await InventoryHistoryService.getBatches({
          source,
          from,
          to,
          take: DEFAULT_TAKE,
        });
        setBatches(data);
      } catch (err: unknown) {
        console.error(err);
        notify("error", "Load failed", getErrorMessage(err, "Unable to load inventory history."));
      } finally {
        setLoading(false);
      }
    },
    [notify]
  );

  useEffect(() => {
    loadBatches(initialFilters.current.source, initialFilters.current.range);
  }, [loadBatches]);

  useEffect(() => {
    setSelectedBatches([]);
    setVisibleBatchIds([]);
  }, [batches]);

  const filteredBatches = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) return batches;
    return batches.filter((batch) => {
      const timestamp = formatBatchTimestamp(batch.batchTimestamp).toLowerCase();
      return batch.batchId.toLowerCase().includes(query) || timestamp.includes(query);
    });
  }, [batches, searchText]);

  const selectedCount = selectedBatches.length;
  const hasSelection = selectedCount > 0;
  const selectedBatchMap = useMemo(
    () => new Map(selectedBatches.map((batch) => [batch.batchId, batch])),
    [selectedBatches]
  );

  const handleSearch = () => {
    loadBatches(sourceFilter, rangeFilter);
  };

  const handleClear = () => {
    const nextSource: InventoryHistorySource | "all" = "all";
    const nextRange: RangeOption = "30";
    setSearchText("");
    setSourceFilter(nextSource);
    setRangeFilter(nextRange);
    setSelectedBatches([]);
    setVisibleBatchIds([]);
    setDetailLoading(false);
    loadBatches(nextSource, nextRange);
  };

  const clearVisibleDetails = useCallback(() => {
    setVisibleBatchIds([]);
    setDetailLoading(false);
  }, []);

  const handleBatchSelectionChange = (next: InventoryHistoryBatchSummary[]) => {
    setSelectedBatches(next);
    clearVisibleDetails();
  };

  const getBatchReport = useCallback(
    async (batchId: string) => {
      const cached = batchDetails[batchId];
      if (cached) {
        return cached;
      }
      const data = await InventoryHistoryService.getBatchDetails(batchId);
      setBatchDetails((prev) => ({ ...prev, [batchId]: data }));
      return data;
    },
    [batchDetails]
  );

  const handlePrintSelected = async () => {
    if (!hasSelection) {
      notify("warn", "No batches selected", "Select at least one batch to print.");
      return;
    }

    try {
      const reports = await Promise.all(
        selectedBatches.map((batch) => getBatchReport(batch.batchId))
      );
      printInventoryHistory({ batches: reports, title: "Inventory History" });
    } catch (err: unknown) {
      console.error(err);
      notify("error", "Print failed", getErrorMessage(err, "Unable to print history."));
    }
  };

  const handleDownloadSelected = async () => {
    if (!hasSelection) {
      notify("warn", "No batches selected", "Select at least one batch to download.");
      return;
    }

    try {
      const reports = await Promise.all(
        selectedBatches.map((batch) => getBatchReport(batch.batchId))
      );
      exportInventoryHistory({ batches: reports, baseName: "inventory_history" });
    } catch (err: unknown) {
      console.error(err);
      notify("error", "Download failed", getErrorMessage(err, "Unable to download history."));
    }
  };

  const handleViewSelected = async () => {
    if (!hasSelection) {
      notify("warn", "No batches selected", "Select at least one batch to view details.");
      return;
    }

    const batchIds = selectedBatches.map((batch) => batch.batchId);
    setVisibleBatchIds(batchIds);

    try {
      setDetailLoading(true);
      await Promise.all(batchIds.map((batchId) => getBatchReport(batchId)));
    } catch (err: unknown) {
      console.error(err);
      notify("error", "Load failed", getErrorMessage(err, "Unable to load batch details."));
    } finally {
      setDetailLoading(false);
    }
  };

  const handleOpenBatchFromRow = async (batch: InventoryHistoryBatchSummary) => {
    setSelectedBatches([batch]);
    setVisibleBatchIds([batch.batchId]);
    try {
      setDetailLoading(true);
      await getBatchReport(batch.batchId);
    } catch (err: unknown) {
      console.error(err);
      notify("error", "Load failed", getErrorMessage(err, "Unable to load batch details."));
    } finally {
      setDetailLoading(false);
    }
  };

  const renderBatchId = (batch: InventoryHistoryBatchSummary) => (
    <span className="inventory-history-batch-id" title={batch.batchId}>
      {batch.batchId.slice(0, 8)}
    </span>
  );

  const renderDeltaValue = (value: number) => (
    <span
      className={`inventory-history-delta ${
        value > 0 ? "positive" : value < 0 ? "negative" : ""
      }`}
    >
      {formatSignedQty(value)}
    </span>
  );

  const renderDelta = (batch: InventoryHistoryBatchSummary) => renderDeltaValue(batch.totalDelta);

  return (
    <CatalogPageLayout
      title="Inventory History"
      subtitle="Review inventory adjustments by batch."
      className="catalog-page--wide"
    >
      <Toast ref={toastRef} position="top-right" />

      <div className="content-card inventory-history-filters">
        <div className="inventory-history-filters-row">
          <Form.Control
            type="search"
            placeholder="Search batch id or timestamp"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            aria-label="Search batch id or timestamp"
            className="inventory-history-search"
          />
          <Form.Select
            value={sourceFilter}
            onChange={(event) =>
              setSourceFilter(event.target.value as InventoryHistorySource | "all")
            }
            aria-label="Source filter"
            className="inventory-history-source"
          >
            <option value="all">All sources</option>
            <option value="scan">Scan</option>
            <option value="edit">Edit</option>
            <option value="upload">Upload</option>
          </Form.Select>
          <div className="inventory-history-range">
            {RANGE_OPTIONS.map((option) => (
              <ActionButton
                key={option.value}
                label={option.label}
                className={`btn-text${rangeFilter === option.value ? " is-active" : ""}`}
                onClick={() => setRangeFilter(option.value)}
              />
            ))}
          </div>
          <div className="inventory-history-filter-actions">
            <ActionButton
              label="Search"
              icon="pi pi-search"
              className="btn-text"
              onClick={handleSearch}
            />
            <ActionButton
              label="Clear"
              icon="pi pi-filter-slash"
              className="btn-text"
              onClick={handleClear}
            />
          </div>
        </div>
      </div>

      <div className="content-card inventory-history-card">
        <div className="inventory-history-card-header">
          <div className="inventory-history-card-title">Batches</div>
          <PageActionsRow className="inventory-history-card-actions">
            <ActionButton
              label="View Selected"
              icon="pi pi-eye"
              className="btn-neutral btn-outlined"
              onClick={handleViewSelected}
              disabled={!hasSelection}
            />
            <ActionButton
              label="Print Selected"
              icon="pi pi-print"
              className="btn-warn btn-outlined"
              onClick={handlePrintSelected}
              disabled={!hasSelection}
            />
            <ActionButton
              label="Download Selected"
              icon="pi pi-download"
              className="btn-info btn-outlined"
              onClick={handleDownloadSelected}
              disabled={!hasSelection}
            />
          </PageActionsRow>
        </div>
        <div className="inventory-history-table-wrapper">
          <DataTable
            value={filteredBatches}
            dataKey="batchId"
            loading={loading}
            rowHover
            selection={selectedBatches}
            onSelectionChange={(event) =>
              handleBatchSelectionChange((event.value as InventoryHistoryBatchSummary[]) ?? [])
            }
            onRowDoubleClick={(event) => {
              const row = event.data as InventoryHistoryBatchSummary | undefined;
              if (row) {
                void handleOpenBatchFromRow(row);
              }
            }}
            selectionMode="checkbox"
            className="p-datatable-gridlines"
          >
            <Column selectionMode="multiple" headerStyle={{ width: "3rem" }} />
            <Column
              field="batchTimestamp"
              header="Timestamp"
              body={(batch: InventoryHistoryBatchSummary) => formatBatchTimestamp(batch.batchTimestamp)}
            />
            <Column field="source" header="Source" />
            <Column field="totalLines" header="Total Lines" />
            <Column field="totalDelta" header="Total QtyChange" body={renderDelta} />
            <Column field="batchId" header="Batch Id" body={renderBatchId} />
          </DataTable>
        </div>
      </div>

      <div className="content-card inventory-history-details">
        <div className="inventory-history-details-header">
          <div>
            <div className="inventory-history-card-title">Batch Details</div>
            <div className="inventory-history-detail-subtitle">
              {visibleBatchIds.length > 0
                ? visibleBatchIds.length === 1
                  ? `Batch ${visibleBatchIds[0]}`
                  : `Viewing ${visibleBatchIds.length} batches.`
                : selectedCount === 0
                  ? "Select a batch to view details."
                  : "Select View Selected to load details."}
            </div>
          </div>
          <ViewToggle
            ariaLabel="Batch details view"
            leftLabel="List"
            rightLabel="Table"
            leftActive={detailsView === "list"}
            rightActive={detailsView === "table"}
            checked={detailsView === "table"}
            switchAriaLabel="Toggle batch details table view"
            leftIcon="pi pi-list"
            rightIcon="pi pi-table"
            leftIconWrapperClassName="scan-section-icon scan-icon-blue"
            rightIconWrapperClassName="scan-section-icon scan-icon-green"
            onLeftClick={() => setDetailsView("list")}
            onRightClick={() => setDetailsView("table")}
            onToggle={(checked) => setDetailsView(checked ? "table" : "list")}
          />
        </div>
        {visibleBatchIds.length === 0 ? (
          <div className="inventory-history-detail-empty">
            {selectedCount === 0
              ? "Select a batch to view details."
              : "Select View Selected to load details."}
          </div>
        ) : (
          <div className="inventory-history-details-body">
            {visibleBatchIds.map((batchId) => {
              const summary = selectedBatchMap.get(batchId);
              const detail = batchDetails[batchId];
              const headerTimestamp = summary
                ? formatBatchTimestamp(summary.batchTimestamp)
                : detail
                  ? formatBatchTimestamp(detail.batchTimestamp)
                  : "";
              const headerSource = summary?.source ?? detail?.source ?? "";
              const headerLines = summary?.totalLines ?? detail?.totalLines ?? 0;
              const headerDelta = summary?.totalDelta ?? detail?.totalDelta ?? 0;

              return (
                <div key={batchId} className="inventory-history-section">
                  <div className="inventory-history-section-header">
                    <div>
                      <div className="inventory-history-card-title">Batch {batchId}</div>
                      <div className="inventory-history-detail-subtitle">
                        {headerTimestamp}
                        {headerTimestamp && headerSource ? " - " : ""}
                        {headerSource}
                      </div>
                    </div>
                    <div className="inventory-history-section-summary">
                      <span>Lines: {headerLines}</span>
                      <span>Total QtyChange: {renderDeltaValue(headerDelta)}</span>
                    </div>
                  </div>
                  <div className="inventory-history-table-wrapper">
                    {detailsView === "table" ? (
                      <>
                        {sizeError ? (
                          <div className="text-danger mb-3">Failed to load sizes: {sizeError}</div>
                        ) : null}
                        {!detailLoading && detail && detail.lines.length === 0 && !sizeLoading ? (
                          <div className="text-center text-muted py-4">No detail rows for this batch.</div>
                        ) : (
                          <InventoryTable
                            embedded
                            inventory={detail ? buildScanTableRows(detail.lines) : []}
                            sizeColumns={sizeColumns}
                            filteredColumns={HISTORY_TABLE_COLUMNS}
                            loading={sizeLoading || (detailLoading && !detail)}
                            scrollHeight="360px"
                            showRowTotals
                            rowTotalHeader="Total QtyChange"
                          />
                        )}
                      </>
                    ) : (
                      <DataTable
                        value={detail?.lines ?? []}
                        loading={detailLoading && !detail}
                        className="p-datatable-gridlines"
                        emptyMessage={detail ? "No detail rows for this batch." : "Loading details..."}
                      >
                        <Column field="sku" header="SKU" />
                        <Column field="itemNumber" header="Style" />
                        <Column field="seasonName" header="Season" />
                        <Column field="colorName" header="Color" />
                        <Column field="sizeName" header="Size" />
                        <Column field="oldQty" header="Old Qty" />
                        <Column field="newQty" header="New Qty" />
                        <Column
                          field="delta"
                          header="QtyChange"
                          body={(line: InventoryHistoryBatchDetail["lines"][number]) =>
                            formatSignedQty(line.delta)
                          }
                        />
                      </DataTable>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </CatalogPageLayout>
  );
}
