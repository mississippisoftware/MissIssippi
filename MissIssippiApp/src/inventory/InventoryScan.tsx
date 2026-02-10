import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Card, Col, Form, Modal, Row, Table } from "react-bootstrap";
import { Toast } from "primereact/toast";
import { ProgressSpinner } from "primereact/progressspinner";
import { SkuService } from "../service/SkuService";
import { InventoryService } from "../service/InventoryService";
import CatalogPageLayout from "../components/CatalogPageLayout";
import type { SkuAdjustment, SkuLookupResult } from "../utils/SkuInterfaces";
import type { iInventoryCell, iInventoryDisplayRow, iSize } from "../utils/DataInterfaces";
import InventoryTable, { type FilterableColumn } from "./InventoryTable";

type ScanMode = "add" | "remove";
type ScanTrigger = "auto" | "manual";

interface ScannedItem extends SkuLookupResult {
  delta: number;
  scans: number;
  direction: 1 | -1;
}

function normalizeSkuInput(value: string) {
  return value.trim().toUpperCase();
}

function extractSku(value: string) {
  const trimmed = value.trim();
  const first = trimmed.indexOf("*");
  const last = trimmed.lastIndexOf("*");
  if (first !== -1 && last > first) {
    return trimmed.slice(first, last + 1);
  }
  return trimmed;
}

function hasCompleteSku(value: string) {
  const first = value.indexOf("*");
  const last = value.lastIndexOf("*");
  return first !== -1 && last > first;
}

export default function InventoryScan() {
  const toastRef = useRef<Toast>(null);
  const [mode, setMode] = useState<ScanMode | null>(null);
  const [pendingMode, setPendingMode] = useState<ScanMode | null>(null);
  const [showModeModal, setShowModeModal] = useState(false);
  const [trigger, setTrigger] = useState<ScanTrigger>("auto");
  const [skuInput, setSkuInput] = useState("");
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [preview, setPreview] = useState<SkuLookupResult | null>(null);
  const [status, setStatus] = useState<{ type: "idle" | "recognized" | "unrecognized"; message?: string }>({
    type: "idle",
  });
  const [scanView, setScanView] = useState<"list" | "table">("list");
  const [sizeColumns, setSizeColumns] = useState<iSize[]>([]);
  const [sizeLoading, setSizeLoading] = useState(true);
  const [sizeError, setSizeError] = useState<string | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const totalDelta = useMemo(
    () => scannedItems.reduce((sum, item) => sum + item.delta, 0),
    [scannedItems]
  );

  const scanTableRows = useMemo<iInventoryDisplayRow[]>(() => {
    const rows = new Map<string, iInventoryDisplayRow>();
    scannedItems
      .filter((item) => item.delta !== 0)
      .forEach((item) => {
        const key = `${item.seasonName}|${item.itemNumber}|${item.colorName}`;
        if (!rows.has(key)) {
          rows.set(key, {
            id: key,
            itemNumber: item.itemNumber,
            colorName: item.colorName,
            seasonName: item.seasonName,
            sizes: {},
          });
        }

        const row = rows.get(key);
        if (!row) return;
        const currentQty = row.sizes[item.sizeName]?.qty ?? 0;
        row.sizes[item.sizeName] = {
          qty: currentQty + item.delta,
        } as iInventoryCell;
      });

    return Array.from(rows.values()).sort((a, b) => {
      const itemCompare = a.itemNumber.localeCompare(b.itemNumber);
      if (itemCompare !== 0) return itemCompare;
      return a.colorName.localeCompare(b.colorName);
    });
  }, [scannedItems]);

  const scanTableKey = useMemo(
    () => scannedItems.reduce((sum, item) => sum + item.scans, 0),
    [scannedItems]
  );

  const scanTableColumns: FilterableColumn[] = useMemo(
    () => [
      { field: "seasonName", header: "Season", filterMatchMode: "startsWith", className: "col-season" },
      { field: "itemNumber", header: "Style", filterMatchMode: "startsWith", className: "col-style" },
      { field: "colorName", header: "Color", filterMatchMode: "contains", className: "col-color" },
    ],
    []
  );

  useEffect(() => {
    let isMounted = true;
    setSizeLoading(true);
    setSizeError(null);

    InventoryService.getSizes()
      .then((data) => {
        if (!isMounted) return;
        const ordered = [...data].sort((a, b) => (a.sizeSequence ?? 0) - (b.sizeSequence ?? 0));
        const cleanSizes = ordered.map((s) => ({ ...s, sizeName: (s.sizeName ?? "").trim() }));
        setSizeColumns(cleanSizes);
      })
      .catch((err: any) => {
        if (!isMounted) return;
        console.error(err);
        setSizeError(err?.message ?? "Failed to load sizes.");
      })
      .finally(() => {
        if (!isMounted) return;
        setSizeLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const showPreview = status.type === "recognized" && preview;
  const readyToMatch = !!mode && trigger === "manual" && hasCompleteSku(skuInput);

  const instructionMessage = !mode
    ? "Choose Add Inventory or Remove Inventory to begin."
    : trigger === "auto"
      ? "Auto-scan is on. Enter SKU ending with * to scan."
      : "Manual scan is on. Type SKU and press Enter or Match.";

  const setModeSelection = (next: ScanMode) => {
    setMode(next);
    setStatus({ type: "idle" });
    setPreview(null);
  };

  const requestModeChange = (next: ScanMode) => {
    if (mode === next) {
      return;
    }

    if (scannedItems.length > 0) {
      setPendingMode(next);
      setShowModeModal(true);
      return;
    }

    setModeSelection(next);
  };

  const handleScan = async (rawValue: string) => {
    if (!mode) {
      setStatus({ type: "idle" });
      return;
    }

    const extracted = extractSku(rawValue);
    const normalized = normalizeSkuInput(extracted);
    if (!normalized) return;

    const existing = scannedItems.find(
      (item) => normalizeSkuInput(item.sku) === normalized
    );

    if (existing) {
      const delta = mode === "add" ? 1 : -1;
      const nextDelta = existing.delta + delta;
      const nextDirection = nextDelta === 0 ? existing.direction : nextDelta >= 0 ? 1 : -1;
      setScannedItems((items) =>
        items.map((item) =>
          normalizeSkuInput(item.sku) === normalized
            ? {
              ...item,
              delta: nextDelta,
              scans: item.scans + 1,
              direction: nextDirection,
            }
            : item
        )
      );
      setPreview(existing);
      setStatus({
        type: "recognized",
        message: `${existing.itemNumber} • ${existing.colorName} • ${existing.sizeName}`,
      });
      setSkuInput("");
      return;
    }

    setLookupLoading(true);
    try {
      const lookup = await SkuService.lookupSku(normalized);
      const delta = mode === "add" ? 1 : -1;
      const newItem: ScannedItem = {
        ...lookup,
        delta,
        scans: 1,
        direction: delta >= 0 ? 1 : -1,
      };

      setScannedItems((items) => [newItem, ...items]);
      setPreview(lookup);
      setStatus({
        type: "recognized",
        message: `${lookup.itemNumber} • ${lookup.colorName} • ${lookup.sizeName}`,
      });
      setSkuInput("");
    } catch (err: any) {
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
    const first = value.indexOf("*");
    const last = value.lastIndexOf("*");
    if (first !== -1 && last > first) {
      handleScan(value);
    }
  };

  const handleSave = async () => {
    if (!scannedItems.length) {
      toastRef.current?.show({
        severity: "info",
        summary: "No scans",
        detail: "Scan SKUs before saving.",
      });
      return;
    }

    const adjustments: SkuAdjustment[] = scannedItems
      .filter((item) => item.delta !== 0)
      .map((item) => ({
        sku: item.sku,
        delta: item.delta,
      }));

    if (!adjustments.length) {
      toastRef.current?.show({
        severity: "info",
        summary: "No changes",
        detail: "All scanned items are net zero.",
      });
      return;
    }

    setSaving(true);
    try {
      const result = await SkuService.applyAdjustments(adjustments);
      const missing = result.missingSkus ?? [];

      if (missing.length) {
        toastRef.current?.show({
          severity: "warn",
          summary: "Partial save",
          detail: `Saved ${result.updatedCount}. Missing SKUs: ${missing.join(", ")}`,
        });
      } else {
        toastRef.current?.show({
          severity: "success",
          summary: "Saved",
          detail: `Saved ${result.updatedCount} updates.`,
        });
      }

      setScannedItems([]);
      setPreview(null);
      setStatus({ type: "idle" });
    } catch (err: any) {
      console.error(err);
      toastRef.current?.show({
        severity: "error",
        summary: "Save failed",
        detail: err?.message ?? "Unable to save adjustments.",
      });
    } finally {
      setSaving(false);
    }
  };

  const formatTimestamp = (date: Date) =>
    date.toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

  const formatSignedQty = (value: number) => (value > 0 ? `+${value}` : `${value}`);

  const buildPrintHtml = () => {
    const timestamp = formatTimestamp(new Date());
    const modeLabel =
      mode === "add" ? "Add Inventory" : mode === "remove" ? "Remove Inventory" : "Scan Inventory";
    const netChange = formatSignedQty(totalDelta);
    const itemCount = scannedItems.length;
    const itemLabel = `${itemCount} item${itemCount === 1 ? "" : "s"}`;
    const useTableView = scanView === "table" && sizeColumns.length > 0 && scanTableRows.length > 0;

    const tableHeader = useTableView
      ? `<tr><th>Season</th><th>Style</th><th>Color</th>${sizeColumns
        .map((size) => `<th>${size.sizeName}</th>`)
        .join("")}<th class="total">Total</th></tr>`
      : "<tr><th>SKU</th><th>Style</th><th>Color</th><th>Size</th><th class=\"qty\">Qty</th></tr>";

    const tableRows = useTableView
      ? scanTableRows
        .map((row) => {
          const sizeCells = sizeColumns
            .map((size) => `<td class="qty">${row.sizes[size.sizeName]?.qty ?? 0}</td>`)
            .join("");
          const rowTotal = sizeColumns.reduce(
            (sum, size) => sum + (row.sizes[size.sizeName]?.qty ?? 0),
            0
          );
          return `<tr><td>${row.seasonName ?? ""}</td><td>${row.itemNumber}</td><td>${row.colorName}</td>${sizeCells}<td class="total">${rowTotal}</td></tr>`;
        })
        .join("")
      : scannedItems
        .map((item) => {
          const qty = formatSignedQty(item.delta);
          return `<tr><td>${item.sku}</td><td>${item.itemNumber}</td><td>${item.colorName}</td><td>${item.sizeName}</td><td class="qty">${qty}</td></tr>`;
        })
        .join("");

    return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Scanned Items</title>
    <style>
      * { box-sizing: border-box; }
      body { font-family: "Segoe UI", Arial, sans-serif; color: #1f2937; margin: 24px; }
      h1 { font-size: 20px; margin: 0 0 4px 0; }
      .meta { color: #6b7280; font-size: 12px; margin-bottom: 16px; display: flex; gap: 12px; flex-wrap: wrap; }
      table { width: 100%; border-collapse: collapse; table-layout: fixed; }
      th, td { border: 1px solid #e5e7eb; padding: 6px 8px; font-size: 12px; text-align: left; }
      th { background: #f7f7f7; font-weight: 600; }
      th.qty, td.qty, th.total, td.total { text-align: center; }
      @media print { body { margin: 12mm; } }
    </style>
  </head>
  <body>
    <h1>Miss Issippi - Scanned Items</h1>
    <div class="meta">
      <span>${modeLabel}</span>
      <span>${timestamp}</span>
      <span>${itemLabel}</span>
      <span>Net change: ${netChange}</span>
    </div>
    <table>
      <thead>${tableHeader}</thead>
      <tbody>${tableRows}</tbody>
    </table>
  </body>
</html>`;
  };

  const handlePrint = () => {
    if (!scannedItems.length) {
      toastRef.current?.show({
        severity: "info",
        summary: "No scans",
        detail: "Scan SKUs before printing.",
      });
      return;
    }

    const html = buildPrintHtml();
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      document.body.removeChild(iframe);
      toastRef.current?.show({
        severity: "error",
        summary: "Print failed",
        detail: "Unable to open print preview.",
      });
      return;
    }

    doc.open();
    doc.write(html);
    doc.close();

    iframe.onload = () => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 500);
    };
  };

  const handleDiscard = () => {
    setScannedItems([]);
    setPreview(null);
    setStatus({ type: "idle" });
    setSkuInput("");
  };

  const handleRemoveItem = (sku: string) => {
    setScannedItems((items) => items.filter((item) => item.sku !== sku));
    setPreview((current) => (current?.sku === sku ? null : current));
  };

  const handleQtyChange = (sku: string, value: string) => {
    const parsed = Number.parseInt(value, 10);
    const nextQty = Number.isNaN(parsed) ? 0 : Math.max(0, parsed);
    setScannedItems((items) =>
      items.map((item) =>
        item.sku === sku ? { ...item, delta: nextQty * item.direction } : item
      )
    );
  };

  const handleModeCancel = () => {
    setShowModeModal(false);
    setPendingMode(null);
  };

  const handleModeClearAndSwitch = () => {
    handleDiscard();
    if (pendingMode) {
      setModeSelection(pendingMode);
    }
    setShowModeModal(false);
    setPendingMode(null);
  };

  const handleModeKeepAndSwitch = () => {
    if (pendingMode) {
      setModeSelection(pendingMode);
    }
    setShowModeModal(false);
    setPendingMode(null);
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
          <Row className="gx-3 gy-4 align-items-start">
            <Col lg={3} className="scan-section-aside">
              <div className="scan-section-info">
                <div className="scan-section-title">
                  <span className="scan-section-icon scan-icon-green">
                    <i className="pi pi-barcode" aria-hidden="true" />
                  </span>
                  <h5>Scanner</h5>
                </div>
                <p className="text-muted mb-0">{instructionMessage}</p>
              </div>
            </Col>
            <Col lg={9}>
              <Card className="scan-section-card shadow-sm">
                <Card.Body>
                  <Row className="g-3 align-items-stretch">
                    <Col md={7} className="scan-card-left">
                      <div className="sku-scan-controls">
                        <div className="sku-scan-toggle-group">
                          <Button
                            type="button"
                            className={`portal-btn sku-scan-toggle sku-scan-toggle-add ${mode === "add" ? "portal-btn-primary" : "portal-btn-outline"
                              }`}
                            onClick={() => requestModeChange("add")}
                          >
                            Add Inventory
                          </Button>
                          <Button
                            type="button"
                            className={`portal-btn sku-scan-toggle sku-scan-toggle-remove ${mode === "remove" ? "portal-btn-primary" : "portal-btn-outline"
                              }`}
                            onClick={() => requestModeChange("remove")}
                          >
                            Remove Inventory
                          </Button>
                        </div>

                        <div className="sku-scan-input-wrapper">
                          <div className="sku-scan-input-row">
                            <Form.Control
                              value={skuInput}
                              placeholder="Scan or enter SKU"
                              className={`sku-scan-input ${readyToMatch ? "has-ready" : ""}`}
                              disabled={!mode || saving}
                              onChange={(e) => handleInputChange(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleScan(skuInput);
                                }
                              }}
                            />
                            {readyToMatch && !lookupLoading ? (
                              <button
                                type="button"
                                className="sku-scan-ready-button"
                                onClick={() => handleScan(skuInput)}
                                disabled={saving}
                                aria-label="Match SKU"
                                title="Match SKU"
                              >
                                <i className="pi pi-check" aria-hidden="true" />
                              </button>
                            ) : null}
                          </div>
                          {lookupLoading ? (
                            <div className="sku-scan-loading">
                              <ProgressSpinner style={{ width: "28px", height: "28px" }} strokeWidth="6" />
                            </div>
                          ) : null}
                        </div>

                        <div className="sku-scan-trigger-toggle">
                          <div className="inventory-view-toggle" role="group" aria-label="Scan trigger">
                            <span className={`inventory-view-toggle-label ${trigger === "auto" ? "is-active" : ""}`}>
                              Auto-scan
                            </span>
                            <label className="inventory-view-switch">
                              <input
                                type="checkbox"
                                checked={trigger === "manual"}
                                onChange={(e) => {
                                  if (!mode) return;
                                  setTrigger(e.target.checked ? "manual" : "auto");
                                  setStatus({ type: "idle" });
                                }}
                                disabled={!mode}
                                aria-label="Toggle scan trigger"
                              />
                              <span className="inventory-view-switch-track" aria-hidden="true"></span>
                            </label>
                            <span className={`inventory-view-toggle-label ${trigger === "manual" ? "is-active" : ""}`}>
                              Manual
                            </span>
                          </div>
                        </div>

                        {status.type !== "idle" && (
                          <div className={`sku-scan-status ${status.type}`}>
                            {status.type === "recognized" && status.message}
                            {status.type === "unrecognized" && status.message}
                          </div>
                        )}
                      </div>
                    </Col>
                    <Col md={5} className="scan-card-right">
                      <Card className={`sku-scan-preview-card shadow-sm ${showPreview ? "" : "is-hidden"}`}>
                        <Card.Body className="p-0">
                          {preview?.imageUrl ? (
                            <img src={preview.imageUrl} alt={preview.sku} className="sku-scan-preview-image" />
                          ) : (
                            <div className="sku-scan-preview-placeholder">No Image Available</div>
                          )}
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </div>

        <div className="scan-section-divider" />

        <div className="scan-section">
          <Row className="gx-3 gy-4 align-items-start">
            <Col lg={3} className="scan-section-aside">
              <div className="scan-section-info">
                <div className="scan-section-title">
                  <span className="scan-section-icon scan-icon-blue">
                    <i className="pi pi-list" aria-hidden="true" />
                  </span>
                  <h5>Scanned Items</h5>
                </div>
                <p className="text-muted mb-0">
                  Review the list and remove any mistakes before saving.
                </p>
              </div>
            </Col>
            <Col lg={9}>
              <Card
                className={`sku-scan-list-card shadow-sm ${mode === "add" ? "add-mode" : mode === "remove" ? "remove-mode" : ""
                  }`}
              >
                <Card.Header className="bg-white border-0">
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="card-heading">
                      <div>
                        <h4 className="mb-1 card-heading-title">Scanned Items</h4>
                        <small className="text-muted">
                          Net change: {totalDelta >= 0 ? `+${totalDelta}` : totalDelta}
                        </small>
                      </div>
                    </div>
                    <div className="inventory-view-toggle-wrapper">
                      <div className="inventory-view-toggle" role="group" aria-label="Scanned items view">
                        <span
                          className={`inventory-view-toggle-label ${scanView === "list" ? "is-active" : ""}`}
                          role="button"
                          tabIndex={0}
                          onClick={() => setScanView("list")}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              setScanView("list");
                            }
                          }}
                        >
                          <span className="scan-section-icon scan-icon-blue" aria-hidden="true">
                            <i className="pi pi-list" aria-hidden="true" />
                          </span>
                          List
                        </span>
                        <label className="inventory-view-switch">
                          <input
                            type="checkbox"
                            checked={scanView === "table"}
                            onChange={(e) => setScanView(e.target.checked ? "table" : "list")}
                            aria-label="Toggle table view"
                          />
                          <span className="inventory-view-switch-track" aria-hidden="true"></span>
                        </label>
                        <span
                          className={`inventory-view-toggle-label ${scanView === "table" ? "is-active" : ""}`}
                          role="button"
                          tabIndex={0}
                          onClick={() => setScanView("table")}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              setScanView("table");
                            }
                          }}
                        >
                          <span className="scan-section-icon scan-icon-green" aria-hidden="true">
                            <i className="pi pi-table" aria-hidden="true" />
                          </span>
                          Table
                        </span>
                      </div>
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
                                      className={`sku-scan-qty-sign ${item.direction >= 0 ? "sku-scan-delta-positive" : "sku-scan-delta-negative"
                                        }`}
                                    >
                                      {item.direction >= 0 ? "+" : "-"}
                                    </span>
                                    <Form.Control
                                      type="number"
                                      min={0}
                                      step={1}
                                      value={Math.abs(item.delta)}
                                      className="sku-scan-qty-field"
                                      onChange={(e) => handleQtyChange(item.sku, e.target.value)}
                                    />
                                  </div>
                                </td>
                                <td className="text-end">
                                  <Button
                                    type="button"
                                    className="sku-scan-remove-btn"
                                    onClick={() => handleRemoveItem(item.sku)}
                                  >
                                    <i className="pi pi-times" aria-hidden="true" />
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
                      {sizeError && (
                        <div className="text-danger mb-3">Failed to load sizes: {sizeError}</div>
                      )}
                      {!sizeLoading && scanTableRows.length === 0 ? (
                        <div className="text-center text-muted py-4">No scans yet.</div>
                      ) : (
                        <InventoryTable
                          key={`scan-table-${scanTableKey}`}
                          embedded
                          inventory={scanTableRows}
                          sizeColumns={sizeColumns}
                          filteredColumns={scanTableColumns}
                          loading={sizeLoading}
                          scrollHeight="360px"
                          showRowTotals
                        />
                      )}
                    </div>
                  )}
                </Card.Body>
                <Card.Footer className="bg-white border-0">
                  <div className="d-flex justify-content-end gap-2">
                    <Button
                      type="button"
                      className="portal-btn portal-btn-print portal-page-action"
                      onClick={handlePrint}
                      disabled={scannedItems.length === 0 || saving}
                    >
                      <i className="pi pi-print portal-page-action-icon" aria-hidden="true" />
                      Print
                    </Button>
                    <Button
                      type="button"
                      className="portal-btn scan-action-discard"
                      onClick={handleDiscard}
                      disabled={scannedItems.length === 0 || saving}
                    >
                      Discard
                    </Button>
                    <Button
                      type="button"
                      className="portal-btn scan-action-save"
                      onClick={handleSave}
                      disabled={scannedItems.length === 0 || saving}
                    >
                      {saving ? "Saving..." : "Save"}
                    </Button>
                  </div>
                </Card.Footer>
              </Card>
            </Col>
          </Row>
        </div>
      </div>

      <Modal show={showModeModal} onHide={handleModeCancel} centered>
        <Modal.Header closeButton>
          <Modal.Title>Switch mode?</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          You have scanned items. Do you want to clear the list before switching to{" "}
          <strong>{pendingMode === "remove" ? "Remove Inventory" : "Add Inventory"}</strong>?
        </Modal.Body>
        <Modal.Footer>
          <Button className="portal-btn portal-btn-outline" onClick={handleModeCancel}>
            Cancel
          </Button>
          <Button className="portal-btn portal-btn-outline" onClick={handleModeKeepAndSwitch}>
            Keep List & Switch
          </Button>
          <Button className="portal-btn portal-btn-primary" onClick={handleModeClearAndSwitch}>
            Clear List & Switch
          </Button>
        </Modal.Footer>
      </Modal>
    </CatalogPageLayout>
  );
}

