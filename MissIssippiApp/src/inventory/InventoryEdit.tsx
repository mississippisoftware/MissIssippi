import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Card, Col, Row, Table } from "react-bootstrap";
import { InputNumber } from "primereact/inputnumber";
import { Toast } from "primereact/toast";
import { ProgressSpinner } from "primereact/progressspinner";
import { useLocation } from "react-router-dom";
import CatalogPageLayout from "../components/CatalogPageLayout";
import { useInventoryEditStore } from "../stores/InventoryEditStore";
import InventorySearchFiltersForm from "../components/InventorySearchFilters";
import type { InventorySearchFilters as InventorySearchFiltersType } from "../utils/InventorySearchFilters";
import { buildInventoryCardsHtml } from "../utils/InventoryCardPrint";

const EMPTY_FILTERS: InventorySearchFiltersType = {
  itemNumber: "",
  description: "",
  colorName: "",
  seasonName: "",
};


export default function InventoryEdit() {
  const toastRef = useRef<Toast>(null);
  const location = useLocation();
  const autoSearchRef = useRef<string | null>(null);
  const [cardColumns, setCardColumns] = useState<1 | 2>(2);

  const results = useInventoryEditStore((s) => s.results);
  const sizeColumns = useInventoryEditStore((s) => s.sizeColumns);
  const seasons = useInventoryEditStore((s) => s.seasons);
  const loading = useInventoryEditStore((s) => s.loading);
  const searching = useInventoryEditStore((s) => s.searching);
  const lastFilters = useInventoryEditStore((s) => s.lastFilters);
  const initializeSizes = useInventoryEditStore((s) => s.initializeSizes);
  const fetchSeasons = useInventoryEditStore((s) => s.fetchSeasons);
  const search = useInventoryEditStore((s) => s.search);
  const clearResults = useInventoryEditStore((s) => s.clearResults);
  const updateCell = useInventoryEditStore((s) => s.updateCell);
  const saveByItem = useInventoryEditStore((s) => s.saveByItem);
  const discardChanges = useInventoryEditStore((s) => s.discardChanges);

  const [form, setForm] = useState<InventorySearchFiltersType>(() => ({
    ...EMPTY_FILTERS,
    ...(lastFilters ?? {}),
  }));

  useEffect(() => {
    initializeSizes();
    fetchSeasons();
  }, [initializeSizes, fetchSeasons]);

  useEffect(() => {
    setForm({ ...EMPTY_FILTERS, ...(lastFilters ?? {}) });
  }, [lastFilters]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const itemNumber = params.get("itemNumber") ?? "";
    const description = params.get("description") ?? "";
    const colorName = params.get("colorName") ?? "";
    const seasonName = params.get("seasonName") ?? "";

    if (!itemNumber && !description && !colorName && !seasonName) {
      return;
    }

    const key = `${itemNumber}|${description}|${colorName}|${seasonName}`;
    if (autoSearchRef.current === key) {
      return;
    }
    autoSearchRef.current = key;

    const nextFilters: InventorySearchFiltersType = {
      itemNumber,
      description,
      colorName,
      seasonName,
    };

    setForm(nextFilters);
    search(nextFilters).catch((err: any) => {
      console.error(err);
      toastRef.current?.show({
        severity: "error",
        summary: "Auto search failed",
        detail: err?.message ?? "Unable to load inventory.",
      });
    });
  }, [location.search, search]);

  const groupedByItem = useMemo(() => {
    const groups: Record<string, { description?: string; rows: typeof results }> = {};
    results.forEach((row) => {
      if (!groups[row.itemNumber]) {
        groups[row.itemNumber] = {
          description: row.description,
          rows: [],
        };
      }
      groups[row.itemNumber].rows.push(row);
    });
    return groups;
  }, [results]);

  const cardGroups = useMemo(
    () =>
      Object.entries(groupedByItem).map(([itemNumber, info]) => ({
        itemNumber,
        description: info.description,
        rows: info.rows,
      })),
    [groupedByItem]
  );

  const handleSearch = async (filters: InventorySearchFiltersType) => {
    const data = await search(filters);
    if (data.length === 0) {
      toastRef.current?.show({
        severity: "info",
        summary: "No results",
        detail: "No styles found for that search.",
      });
    }
  };

  const handleSave = async (itemNumber: string) => {
    try {
      await saveByItem(itemNumber);
      toastRef.current?.show({ severity: "success", summary: "Saved", detail: `Saved changes for ${itemNumber}` });
    } catch (err: any) {
      console.error(err);
      toastRef.current?.show({ severity: "error", summary: "Error", detail: err?.message ?? "Failed to save" });
    }
  };

  const handleDiscard = async () => {
    await discardChanges();
  };

  const handleClear = () => {
    setForm(EMPTY_FILTERS);
    clearResults();
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
      toastRef.current?.show({ severity: "error", summary: "Error", detail: "Unable to render PDF preview." });
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

  const handleDownloadPdf = (itemNumber: string, info: { description?: string; rows: typeof results }) => {
    const html = buildInventoryCardsHtml({
      subtitle: "Edit Inventory",
      sizeColumns,
      groups: [
        {
          itemNumber,
          description: info.description,
          rows: info.rows,
        },
      ],
    });
    printHtml(html);
  };

  const handleDownloadAll = () => {
    if (cardGroups.length === 0) {
      toastRef.current?.show({
        severity: "info",
        summary: "No results",
        detail: "Search and load styles before downloading.",
      });
      return;
    }

    const html = buildInventoryCardsHtml({
      subtitle: "Edit Inventory",
      sizeColumns,
      groups: cardGroups,
    });
    printHtml(html);
  };

  const placeholderImage = "";

  return (
    <CatalogPageLayout
      title="Edit Inventory"
      subtitle="Search for styles to edit size quantities"
      className="catalog-page--wide"
    >
      <Toast ref={toastRef} position="top-right" />

      <div className="inventory-edit-header-actions">
        <InventorySearchFiltersForm
          filters={form}
          seasons={seasons}
          searching={searching}
          onChange={setForm}
          onSubmit={handleSearch}
          onClear={handleClear}
        />
      </div>

      {loading ? (
        <div className="d-flex justify-content-center py-5">
          <ProgressSpinner />
        </div>
      ) : null}

      {!loading && !searching && results.length === 0 && (
        <div className="text-center text-muted">Search to load styles and start editing.</div>
      )}

      {searching && (
        <div className="d-flex justify-content-center py-4">
          <ProgressSpinner />
        </div>
      )}

      <div className="inventory-cards-toolbar">
        <Button
          type="button"
          className="portal-btn portal-btn-download portal-page-action"
          onClick={handleDownloadAll}
          disabled={cardGroups.length === 0}
        >
          <i className="pi pi-download portal-page-action-icon" aria-hidden="true" />
          Download All
        </Button>
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
              <rect x="4" y="5" width="6" height="6" rx="1" />
              <rect x="14" y="5" width="6" height="6" rx="1" />
              <rect x="4" y="13" width="6" height="6" rx="1" />
              <rect x="14" y="13" width="6" height="6" rx="1" />
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
                  {placeholderImage ? (
                    <img src={placeholderImage} alt="style" style={{ maxHeight: "140px", objectFit: "cover" }} />
                  ) : (
                    <div className="inventory-card-image-placeholder">No Image Available</div>
                  )}
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
                    <tr key={row.id}>
                      <td className="fw-semibold align-middle inventory-color-cell">{row.colorName}</td>
                      {sizeColumns.map((size) => {
                        const cell = row.sizes[size.sizeName];
                        return (
                          <td key={`${row.id}-${size.sizeId}`} className="align-middle text-center inventory-size-cell">
                            <InputNumber
                              value={cell?.qty ?? 0}
                              onValueChange={(e) => updateCell(row.itemNumber, row.colorName, size.sizeName, Number(e.value ?? 0))}
                              min={0}
                              showButtons={false}
                              className="inventory-cell-input-wrapper"
                              inputClassName="text-center inventory-cell-input"
                            />
                          </td>
                        );
                      })}
                    </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
          <Card.Footer className="inventory-edit-card-footer">
            <div className="d-flex justify-content-end gap-2">
              <Button
                className="portal-btn portal-btn-download portal-page-action"
                onClick={() => handleDownloadPdf(itemNumber, info)}
              >
                <i className="pi pi-download portal-page-action-icon" aria-hidden="true" />
                Download
              </Button>
              <Button
                variant="outline-secondary"
                className="portal-btn portal-btn-outline"
                onClick={handleDiscard}
              >
                Discard
              </Button>
              <Button
                variant="success"
                className="portal-btn portal-btn-success"
                onClick={() => handleSave(itemNumber)}
              >
                Save
              </Button>
            </div>
          </Card.Footer>
        </Card>
      ))}
    </div>
    </CatalogPageLayout>
  );
}

