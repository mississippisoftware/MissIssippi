import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Card, Col, Form, Row, Table } from "react-bootstrap";
import CatalogPageLayout from "../components/CatalogPageLayout";
import { useInventoryStore } from "../stores/InventoryStore";
import InventoryTable from "./InventoryTable";
import type { FilterableColumn, InventoryTableHandle } from "./InventoryTable";
import { exportInventoryToExcel } from "../utils/ExportInventoryToExcel";
import { buildInventoryCardsHtml } from "../utils/InventoryCardPrint";

export default function InventoryView() {
    const inventory = useInventoryStore((s) => s.inventory);
    const sizeColumns = useInventoryStore((s) => s.sizeColumns);
    const loading = useInventoryStore((s) => s.loading);
    const fetchInventory = useInventoryStore((s) => s.fetchInventory);

    const tableRef = useRef<InventoryTableHandle>(null);
    const [viewMode, setViewMode] = useState<"list" | "cards">("list");
    const [cardColumns, setCardColumns] = useState<1 | 2>(2);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        fetchInventory();
    }, [fetchInventory]);

    const filteredColumns: FilterableColumn[] = useMemo(
        () => [
            { field: "seasonName", header: "Season", filterMatchMode: "startsWith", className: "col-season" },
            { field: "itemNumber", header: "Style", filterMatchMode: "startsWith", className: "col-style" },
            { field: "colorName", header: "Color", filterMatchMode: "contains", className: "col-color" },
        ],
        []
    );

    const filteredInventory = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return inventory;
        return inventory.filter((row) => {
            return [
                row.seasonName,
                row.itemNumber,
                row.colorName,
                row.description,
            ]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(query));
        });
    }, [inventory, searchQuery]);

    const groupedByItem = useMemo(() => {
        const groups: Record<string, { description?: string; rows: typeof inventory }> = {};
        filteredInventory.forEach((row) => {
            if (!groups[row.itemNumber]) {
                groups[row.itemNumber] = {
                    description: row.description,
                    rows: [],
                };
            }
            if (!groups[row.itemNumber].description && row.description) {
                groups[row.itemNumber].description = row.description;
            }
            groups[row.itemNumber].rows.push(row);
        });
        return groups;
    }, [filteredInventory]);

    const cardGroups = useMemo(
        () =>
            Object.entries(groupedByItem).map(([itemNumber, info]) => ({
                itemNumber,
                description: info.description,
                rows: info.rows,
            })),
        [groupedByItem]
    );

    const handleExport = () => {
        const rows = tableRef.current?.getProcessedRows() ?? filteredInventory;
        exportInventoryToExcel({
            rows,
            sizeColumns,
            uiColumns: filteredColumns,
            title: "Inventory Download",
            sheetName: "Inventory",
            filename: "inventory.xlsx",
        });
    };

    const buildInventoryListHtml = (rows: typeof inventory) => {
        const headerCells = [
            ...filteredColumns.map((col) => `<th>${col.header}</th>`),
            ...sizeColumns.map((size) => `<th>${size.sizeName}</th>`),
        ].join("");

        const bodyRows = rows
            .map((row) => {
                const baseCells = filteredColumns
                    .map((col) => `<td>${(row as any)[col.field] ?? ""}</td>`)
                    .join("");
                const sizeCells = sizeColumns
                    .map((size) => `<td>${row.sizes?.[size.sizeName]?.qty ?? 0}</td>`)
                    .join("");
                return `<tr>${baseCells}${sizeCells}</tr>`;
            })
            .join("");

        const timestamp = new Date().toLocaleString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
        });

        return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Inventory List</title>
    <style>
      * { box-sizing: border-box; }
      body { font-family: "Segoe UI", Arial, sans-serif; color: #111827; margin: 24px; }
      h1 { font-size: 20px; margin: 0 0 4px 0; }
      .timestamp { color: #6b7280; font-size: 12px; margin-bottom: 16px; }
      table { width: 100%; border-collapse: collapse; table-layout: fixed; }
      th, td { border: 1px solid #e5e7eb; padding: 6px 8px; font-size: 12px; text-align: center; }
      th { background: #f8fafc; font-weight: 600; }
      td:first-child, th:first-child { text-align: left; }
    </style>
  </head>
  <body>
    <h1>Inventory List</h1>
    <div class="timestamp">${timestamp}</div>
    <table>
      <thead>
        <tr>${headerCells}</tr>
      </thead>
      <tbody>
        ${bodyRows}
      </tbody>
    </table>
  </body>
</html>`;
    };

    const printHtml = (html: string) => {
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

    const handlePrintList = () => {
        const rows = tableRef.current?.getProcessedRows() ?? filteredInventory;
        if (!rows || rows.length === 0) {
            return;
        }

        const html = buildInventoryListHtml(rows);
        printHtml(html);
    };

    const handlePrintCards = () => {
        if (cardGroups.length === 0) {
            return;
        }

        const html = buildInventoryCardsHtml({
            subtitle: "View Inventory",
            sizeColumns,
            groups: cardGroups,
        });
        printHtml(html);
    };

    const actionRow = (
        <div className="inventory-view-row">
            {viewMode === "list" ? (
                <Button
                    type="button"
                    className="portal-btn portal-btn-download portal-page-action"
                    onClick={handleExport}
                    disabled={filteredInventory.length === 0}
                    title="Download"
                >
                    <i className="pi pi-download portal-page-action-icon" aria-hidden="true"></i>
                    Download
                </Button>
            ) : null}
            <Button
                type="button"
                className="portal-btn portal-btn-print portal-page-action"
                onClick={viewMode === "list" ? handlePrintList : handlePrintCards}
                disabled={filteredInventory.length === 0}
                title={viewMode === "list" ? "Print list" : "Print cards"}
            >
                <i className="pi pi-print portal-page-action-icon" aria-hidden="true"></i>
                {viewMode === "list" ? "Print List" : "Print Cards"}
            </Button>
        </div>
    );

    const searchControls = (
        <div className="inventory-view-topbar-controls">
            <Form.Control
                type="search"
                placeholder="Search inventory"
                className="inventory-view-search inventory-view-search-center"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search inventory"
            />
        </div>
    );

    return (
        <CatalogPageLayout
            title="View Inventory"
            subtitle="Browse current inventory levels and export data."
            className="catalog-page--wide"
        >
            <div className="inventory-view-search-row">{searchControls}</div>
            {loading ? (
                <div>Loading inventory...</div>
            ) : (
                <div className="content-card inventory-view-card">
                    <div className="inventory-view-card-header">
                        <div className="inventory-view-toggle-wrapper">
                            <div className="inventory-view-toggle" role="group" aria-label="View mode">
                                <span className={`inventory-view-toggle-label ${viewMode === "list" ? "is-active" : ""}`}>
                                    <span className="scan-section-icon scan-icon-blue" aria-hidden="true">
                                        <i className="pi pi-list" aria-hidden="true"></i>
                                    </span>
                                    List
                                </span>
                                <label className="inventory-view-switch">
                                    <input
                                        type="checkbox"
                                        checked={viewMode === "cards"}
                                        onChange={(e) => setViewMode(e.target.checked ? "cards" : "list")}
                                        aria-label="Toggle card view"
                                    />
                                    <span className="inventory-view-switch-track" aria-hidden="true"></span>
                                </label>
                                <span className={`inventory-view-toggle-label ${viewMode === "cards" ? "is-active" : ""}`}>
                                    <span className="scan-section-icon scan-icon-green" aria-hidden="true">
                                        <i className="pi pi-th-large" aria-hidden="true"></i>
                                    </span>
                                    Card
                                </span>
                            </div>
                        </div>
                        <div className="inventory-view-card-actions">{actionRow}</div>
                    </div>
                    <div className={`inventory-view-slider ${viewMode === "cards" ? "is-cards" : "is-list"}`}>
                        <div className="inventory-view-slider-track">
                            <div className={`inventory-view-panel ${viewMode === "list" ? "is-active" : ""}`}>
                                <InventoryTable
                                    ref={tableRef}
                                    inventory={filteredInventory}
                                    sizeColumns={sizeColumns}
                                    loading={loading}
                                    filteredColumns={filteredColumns}
                                    editable={false}
                                    scrollable={false}
                                    embedded
                                />
                            </div>
                            <div className={`inventory-view-panel ${viewMode === "cards" ? "is-active" : ""}`}>
                                <div className="inventory-cards-toolbar">
                                    <Button
                                        type="button"
                                        variant="outline-secondary"
                                        className="portal-btn portal-btn-outline inventory-cards-toggle"
                                        onClick={() => setCardColumns((prev) => (prev === 2 ? 1 : 2))}
                                        aria-label={cardColumns === 2 ? "Switch to one column" : "Switch to two columns"}
                                        title={cardColumns === 2 ? "Switch to one column" : "Switch to two columns"}
                                    >
                                        {cardColumns === 2 ? (
                                            <svg viewBox="0 0 24 24" aria-hidden="true">
                                                <rect x="4" y="5" width="10" height="10" rx="1" />
                                                <rect x="14" y="5" width="10" height="10" rx="1" />
                                                <rect x="4" y="13" width="10" height="10" rx="1" />
                                                <rect x="14" y="13" width="10" height="10" rx="1" />
                                            </svg>
                                        ) : (
                                            <svg viewBox="0 0 24 24" aria-hidden="true">
                                                <rect x="5" y="5" width="14" height="6" rx="1" />
                                                <rect x="5" y="13" width="14" height="6" rx="1" />
                                            </svg>
                                        )}
                                    </Button>
                                </div>
                                <div className={`inventory-cards-grid ${cardColumns === 1 ? "one-column" : "two-columns"}`}>
                                    {Object.entries(groupedByItem).map(([itemNumber, info]) => (
                                        <Card key={itemNumber} className="shadow-sm inventory-edit-card">
                                            <Card.Header className="bg-white border-0" style={{ flex: "0 0 40%" }}>
                                                <Row className="align-items-center inventory-card-header-row">
                                                    <Col md={4} className="inventory-card-header-left">
                                                        <div className="inventory-card-heading">
                                                            <span className="scan-section-icon scan-icon-green card-heading-icon" aria-hidden="true">
                                                                <i className="pi pi-box" aria-hidden="true"></i>
                                                            </span>
                                                            <div className="d-flex flex-column">
                                                                <span className="fw-bold inventory-card-style-number">{itemNumber}</span>
                                                                <span className="text-muted">{info.description || "No description"}</span>
                                                            </div>
                                                        </div>
                                                    </Col>
                                                    <Col
                                                        md={8}
                                                        className="text-md-end text-center inventory-card-header-divider inventory-card-header-right"
                                                    >
                                                        <div className="inventory-card-image-placeholder">No Image Available</div>
                                                    </Col>
                                                </Row>
                                            </Card.Header>
                                            <Card.Body className="inventory-edit-card-body">
                                                <Table responsive bordered hover className="inventory-edit-table">
                                                    <thead className="table-light">
                                                        <tr>
                                                            <th className="inventory-color-col">Color</th>
                                                            {sizeColumns.map((size) => (
                                                                <th key={size.sizeId} className="text-center inventory-size-col">
                                                                    {size.sizeName}
                                                                </th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {info.rows.map((row) => (
                                                            <tr key={row.id ?? `${row.itemNumber}-${row.colorName}`}>
                                                                <td className="fw-semibold align-middle inventory-color-cell">{row.colorName}</td>
                                                                {sizeColumns.map((size) => {
                                                                    const cell = row.sizes[size.sizeName];
                                                                    return (
                                                                        <td
                                                                            key={`${row.id ?? row.itemNumber}-${size.sizeId}`}
                                                                            className="align-middle text-center inventory-size-cell"
                                                                        >
                                                                            {cell?.qty ?? 0}
                                                                        </td>
                                                                    );
                                                                })}
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </Table>
                                            </Card.Body>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </CatalogPageLayout>
    );
}


