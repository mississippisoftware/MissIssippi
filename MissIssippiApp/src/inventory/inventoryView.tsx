import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Card, Col, Form, Row } from "react-bootstrap";
import ActionButton from "../components/ActionButton";
import CatalogPageLayout from "../components/CatalogPageLayout";
import ViewToggle from "../components/ViewToggle";
import PageActionsRow from "../components/PageActionsRow";
import InventoryCardTable from "../components/inventory/InventoryCardTable";
import { useInventoryStore } from "../stores/InventoryStore";
import InventoryTable from "./InventoryTable";
import type { FilterableColumn, InventoryTableHandle } from "./InventoryTable";
import { exportInventory } from "../utils/exportInventory";
import { useShallow } from "zustand/shallow";
import { buildInventoryCardGroups } from "../utils/buildInventoryCardGroups";
import { filterInventoryRows } from "../utils/filterInventoryRows";
import { printInventoryCards, printInventoryList } from "../utils/printInventory";

const INVENTORY_VIEW_COLUMNS: FilterableColumn[] = [
    { field: "seasonName", header: "Season", filterMatchMode: "startsWith", className: "col-season" },
    { field: "itemNumber", header: "Style", filterMatchMode: "startsWith", className: "col-style" },
    { field: "colorName", header: "Color", filterMatchMode: "contains", className: "col-color" },
];

export default function InventoryView() {
    const { inventory, sizeColumns, loading, fetchInventory } = useInventoryStore(
        useShallow((s) => ({
            inventory: s.inventory,
            sizeColumns: s.sizeColumns,
            loading: s.loading,
            fetchInventory: s.fetchInventory,
        }))
    );

    const tableRef = useRef<InventoryTableHandle>(null);
    const [viewMode, setViewMode] = useState<"list" | "cards">("list");
    const [cardColumns, setCardColumns] = useState<1 | 2>(2);
    const [searchQuery, setSearchQuery] = useState("");
    const [inStockOnly, setInStockOnly] = useState(false);

    useEffect(() => {
        fetchInventory();
    }, [fetchInventory]);

    const filteredInventory = useMemo(() => {
        const searched = filterInventoryRows(inventory, searchQuery);
        if (!inStockOnly) {
            return searched;
        }

        return searched.filter((row) =>
            Object.values(row.sizes ?? {}).some((cell) => Number(cell?.qty ?? 0) > 0)
        );
    }, [inventory, searchQuery, inStockOnly]);

    const cardGroups = useMemo(
        () => buildInventoryCardGroups(filteredInventory),
        [filteredInventory]
    );

    const handleExport = () => {
        exportInventory({
            tableRef,
            fallbackRows: filteredInventory,
            sizeColumns,
            uiColumns: INVENTORY_VIEW_COLUMNS,
            title: "Inventory Download",
            sheetName: "Inventory",
            filename: "inventory.xlsx",
        });
    };

    const handlePrintList = () => {
        const rows = tableRef.current?.getProcessedRows() ?? filteredInventory;
        printInventoryList({
            rows,
            sizeColumns,
            uiColumns: INVENTORY_VIEW_COLUMNS,
            title: "Inventory List",
        });
    };

    const handlePrintCards = () => {
        printInventoryCards({
            subtitle: "View Inventory",
            sizeColumns,
            groups: cardGroups,
        });
    };

    const actionRow = (
        <PageActionsRow className="inventory-view-row">
            {viewMode === "list" ? (
                <ActionButton
                    label="Download"
                    icon="pi pi-download"
                    className="btn-info btn-outlined"
                    onClick={handleExport}
                    disabled={filteredInventory.length === 0}
                    title="Download"
                />
            ) : null}
            <ActionButton
                label={viewMode === "list" ? "Print List" : "Print Cards"}
                icon="pi pi-print"
                className="btn-warn btn-outlined"
                onClick={viewMode === "list" ? handlePrintList : handlePrintCards}
                disabled={filteredInventory.length === 0}
                title={viewMode === "list" ? "Print list" : "Print cards"}
            />
        </PageActionsRow>
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
            <Form.Check
                type="switch"
                id="view-inventory-in-stock-only"
                label="In Stock Only"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
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
                            <ViewToggle
                                ariaLabel="View mode"
                                leftLabel="List"
                                rightLabel="Card"
                                leftActive={viewMode === "list"}
                                rightActive={viewMode === "cards"}
                                checked={viewMode === "cards"}
                                switchAriaLabel="Toggle card view"
                                leftIcon="pi pi-list"
                                rightIcon="pi pi-th-large"
                                leftIconWrapperClassName="scan-section-icon scan-icon-blue"
                                rightIconWrapperClassName="scan-section-icon scan-icon-green"
                                onLeftClick={() => setViewMode("list")}
                                onRightClick={() => setViewMode("cards")}
                                onToggle={(checked) => setViewMode(checked ? "cards" : "list")}
                            />
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
                                    filteredColumns={INVENTORY_VIEW_COLUMNS}
                                    editable={false}
                                    scrollable={false}
                                    embedded
                                />
                            </div>
                            <div className={`inventory-view-panel ${viewMode === "cards" ? "is-active" : ""}`}>
                                <PageActionsRow className="inventory-cards-toolbar">
                                    <Button
                                        type="button"
                                        className="btn-neutral btn-outlined btn-icon"
                                        onClick={() => setCardColumns((prev) => (prev === 2 ? 1 : 2))}
                                        aria-label={cardColumns === 2 ? "Switch to one column" : "Switch to two columns"}
                                        title={cardColumns === 2 ? "Switch to one column" : "Switch to two columns"}
                                    >
                                        <i
                                            className={cardColumns === 2 ? "pi pi-th-large" : "pi pi-bars"}
                                            aria-hidden="true"
                                        />
                                    </Button>
                                </PageActionsRow>
                                <div className={`inventory-cards-grid ${cardColumns === 1 ? "one-column" : "two-columns"}`}>
                                    {cardGroups.map((group) => (
                                        <Card key={group.itemNumber} className="inventory-edit-card">
                                            <Card.Header className="bg-white border-0" style={{ flex: "0 0 40%" }}>
                                                <Row className="align-items-center inventory-card-header-row">
                                                    <Col md={4} className="inventory-card-header-left">
                                                        <div className="inventory-card-heading">
                                                            <span className="scan-section-icon scan-icon-green card-heading-icon" aria-hidden="true">
                                                                <i className="pi pi-box" aria-hidden="true"></i>
                                                            </span>
                                                            <div className="d-flex flex-column">
                                                                <span className="fw-bold inventory-card-style-number">{group.itemNumber}</span>
                                                                <span className="text-muted">{group.description || "No description"}</span>
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
                                                <InventoryCardTable rows={group.rows} sizeColumns={sizeColumns} />
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


