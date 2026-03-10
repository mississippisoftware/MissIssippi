import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, Form } from "react-bootstrap";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Toast } from "primereact/toast";
import CatalogPageLayout from "../components/CatalogPageLayout";
import ActionButton from "../components/ActionButton";
import PageActionsRow from "../components/PageActionsRow";
import { useNotifier } from "../hooks/useNotifier";
import CatalogService, { type ItemColorView } from "../service/CatalogService";
import { SkuService, type SkuLabelRow } from "../service/SkuService";
import { getErrorMessage } from "../utils/errors";
import { downloadInventoryLabelsDoc } from "../utils/inventoryLabelsDoc";

type LabelRow = SkuLabelRow & { labelQty: number };
const LABEL_PAGE_SIZE_OPTIONS = [25, 50, 100];

export default function InventoryLabels() {
  const toastRef = useRef<Toast>(null);
  const notify = useNotifier(toastRef);

  const [itemColors, setItemColors] = useState<ItemColorView[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [selection, setSelection] = useState<ItemColorView[]>([]);
  const [searchText, setSearchText] = useState("");
  const [seasonFilter, setSeasonFilter] = useState("");

  const [labelRows, setLabelRows] = useState<LabelRow[]>([]);
  const [labelSelection, setLabelSelection] = useState<LabelRow[]>([]);
  const [loadingLabels, setLoadingLabels] = useState(false);
  const [useStockQty, setUseStockQty] = useState(true);

  const loadItemColors = useCallback(async () => {
    setLoadingItems(true);
    try {
      const rows = await CatalogService.getItemColors();
      const active = rows.filter((row) => row.itemColorActive !== false);
      setItemColors(active);
    } catch (err: unknown) {
      console.error(err);
      notify("error", "Load failed", getErrorMessage(err, "Unable to load styles."));
    } finally {
      setLoadingItems(false);
    }
  }, [notify]);

  useEffect(() => {
    loadItemColors();
  }, [loadItemColors]);

  const seasonOptions = useMemo(() => {
    const unique = Array.from(new Set(itemColors.map((row) => row.seasonName).filter(Boolean)));
    return unique.sort((a, b) => a.localeCompare(b));
  }, [itemColors]);

  const filteredItemColors = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return itemColors.filter((row) => {
      if (seasonFilter && row.seasonName !== seasonFilter) {
        return false;
      }
      if (!query) {
        return true;
      }
      return (
        row.itemNumber.toLowerCase().includes(query) ||
        row.colorName.toLowerCase().includes(query)
      );
    });
  }, [itemColors, searchText, seasonFilter]);

  const renderColorActive = (row: ItemColorView) => (
    <Form.Check
      type="checkbox"
      className="item-production-check"
      checked={row.itemColorActive !== false}
      readOnly
      disabled
    />
  );

  const handleLoadLabels = async () => {
    if (selection.length === 0) {
      notify("info", "No selection", "Select at least one style/color.");
      return;
    }
    setLoadingLabels(true);
    try {
      const ids = selection.map((row) => row.itemColorId);
      const rows = await SkuService.getSkuLabels(ids);
      setLabelRows(rows.map((row) => ({ ...row, labelQty: row.qty })));
      setLabelSelection([]);
      setUseStockQty(true);
    } catch (err: unknown) {
      console.error(err);
      notify("error", "Load failed", getErrorMessage(err, "Unable to load SKUs."));
    } finally {
      setLoadingLabels(false);
    }
  };

  const handleResetToStock = useCallback(() => {
    setLabelRows((prev) => prev.map((row) => ({ ...row, labelQty: row.qty })));
  }, []);

  const handleClearSelectedLabelRows = useCallback(() => {
    if (labelSelection.length === 0) {
      return;
    }
    const selectedSkus = new Set(labelSelection.map((row) => row.sku));
    setLabelRows((prev) => prev.filter((row) => !selectedSkus.has(row.sku)));
    setLabelSelection([]);
  }, [labelSelection]);

  const handleToggleUseStock = (checked: boolean) => {
    setUseStockQty(checked);
    if (checked) {
      handleResetToStock();
    }
  };

  const handleLabelQtyChange = (sku: string, value: number | null) => {
    const nextValue = Math.max(0, Math.floor(value ?? 0));
    setLabelRows((prev) =>
      prev.map((row) => (row.sku === sku ? { ...row, labelQty: nextValue } : row))
    );
  };

  const totalLabels = useMemo(
    () => labelRows.reduce((sum, row) => sum + row.labelQty, 0),
    [labelRows]
  );

  const handleDownload = () => {
    const success = downloadInventoryLabelsDoc(labelRows);
    if (!success) {
      notify("info", "No labels", "Set label quantities before downloading.");
    }
  };

  const sortedLabelRows = useMemo(
    () =>
      [...labelRows].sort((a, b) => {
        const itemCompare = a.itemNumber.localeCompare(b.itemNumber);
        if (itemCompare !== 0) return itemCompare;
        const colorCompare = a.colorName.localeCompare(b.colorName);
        if (colorCompare !== 0) return colorCompare;
        return a.sizeSequence - b.sizeSequence;
      }),
    [labelRows]
  );

  return (
    <CatalogPageLayout
      title="Inventory Labels"
      subtitle="Create Avery 8160 labels from selected styles/colors."
      className="catalog-page--wide"
    >
      <Toast ref={toastRef} position="top-right" />

      <Card className="content-card inventory-labels-card">
        <Card.Body>
          <div className="inventory-labels-header">
            <div className="inventory-labels-title">Select Styles & Colors</div>
            <PageActionsRow className="inventory-labels-actions">
              <ActionButton
                label="Load SKUs"
                icon="pi pi-plus"
                className="btn-primary"
                onClick={handleLoadLabels}
                disabled={loadingItems || loadingLabels}
              />
              <ActionButton
                label="Select Filtered"
                icon="pi pi-check"
                className="btn-neutral btn-outlined"
                onClick={() => setSelection(filteredItemColors)}
                disabled={filteredItemColors.length === 0}
              />
              <ActionButton
                label="Clear Selection"
                icon="pi pi-times"
                className="btn-neutral btn-outlined"
                onClick={() => setSelection([])}
                disabled={selection.length === 0}
              />
            </PageActionsRow>
          </div>

          <div className="inventory-labels-filters">
            <div className="inventory-labels-search-wrap">
              <InputText
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search style or color"
                className="inventory-labels-search"
              />
              {searchText ? (
                <button
                  type="button"
                  className="inventory-labels-search-clear"
                  aria-label="Clear search"
                  onClick={() => {
                    setSearchText("");
                    setLabelRows([]);
                    setLabelSelection([]);
                  }}
                >
                  <i className="pi pi-times" aria-hidden="true" />
                </button>
              ) : null}
            </div>
            <Form.Select
              value={seasonFilter}
              onChange={(e) => setSeasonFilter(e.target.value)}
              className="inventory-labels-season"
            >
              <option value="">All seasons</option>
              {seasonOptions.map((season) => (
                <option key={season} value={season}>
                  {season}
                </option>
              ))}
            </Form.Select>
          </div>

          <div className="inventory-labels-table">
            <DataTable
              value={filteredItemColors}
              dataKey="itemColorId"
              loading={loadingItems}
              selection={selection}
              onSelectionChange={(event) =>
                setSelection((event.value as ItemColorView[]) ?? [])
              }
              selectionMode="checkbox"
              className="p-datatable-gridlines"
              paginator
              rows={25}
              rowsPerPageOptions={LABEL_PAGE_SIZE_OPTIONS}
              paginatorTemplate="PrevPageLink PageLinks NextPageLink CurrentPageReport RowsPerPageDropdown"
              currentPageReportTemplate="{first}-{last} of {totalRecords}"
            >
              <Column selectionMode="multiple" headerStyle={{ width: "3rem" }} />
              <Column field="seasonName" header="Season" />
              <Column field="itemNumber" header="Style" />
              <Column field="colorName" header="Color" />
              <Column field="itemColorActive" header="Active" body={renderColorActive} className="col-active" />
            </DataTable>
          </div>
        </Card.Body>
      </Card>

      {labelRows.length > 0 && (
        <Card className="content-card inventory-labels-card">
          <Card.Body>
            <div className="inventory-labels-header">
              <div>
                <div className="inventory-labels-title">Label Quantities</div>
                <div className="inventory-labels-subtitle">
                  {useStockQty ? "Using stock quantities" : "Custom quantities"} |{" "}
                  {totalLabels} total labels
                </div>
              </div>
              <PageActionsRow className="inventory-labels-actions">
                <ActionButton
                  label="Clear Selected"
                  icon="pi pi-times"
                  className="btn-neutral btn-outlined"
                  onClick={handleClearSelectedLabelRows}
                  disabled={labelSelection.length === 0}
                />
                <ActionButton
                  label="Reset to Stock"
                  icon="pi pi-refresh"
                  className="btn-neutral btn-outlined"
                  onClick={handleResetToStock}
                  disabled={useStockQty}
                />
                <ActionButton
                  label="Download Labels"
                  icon="pi pi-download"
                  className="btn-info btn-outlined"
                  onClick={handleDownload}
                  disabled={labelRows.length === 0}
                />
              </PageActionsRow>
            </div>

            <div className="inventory-labels-options">
              <Form.Check
                type="switch"
                id="labels-use-stock"
                label="Use stock quantities"
                checked={useStockQty}
                onChange={(e) => handleToggleUseStock(e.target.checked)}
              />
            </div>

            <div className="inventory-labels-table">
              <DataTable
                value={sortedLabelRows}
                dataKey="sku"
                loading={loadingLabels}
                selection={labelSelection}
                onSelectionChange={(event) => setLabelSelection((event.value as LabelRow[]) ?? [])}
                selectionMode="checkbox"
                className="p-datatable-gridlines"
                paginator
                rows={25}
                rowsPerPageOptions={LABEL_PAGE_SIZE_OPTIONS}
                paginatorTemplate="PrevPageLink PageLinks NextPageLink CurrentPageReport RowsPerPageDropdown"
                currentPageReportTemplate="{first}-{last} of {totalRecords}"
              >
                <Column selectionMode="multiple" headerStyle={{ width: "3rem" }} />
                <Column field="itemNumber" header="Style" />
                <Column field="colorName" header="Color" />
                <Column field="sizeName" header="Size" />
                <Column field="sku" header="SKU" />
                <Column field="qty" header="Stock" />
                <Column
                  header="Label Qty"
                  body={(row: LabelRow) => (
                    <InputNumber
                      value={row.labelQty}
                      onValueChange={(e) => handleLabelQtyChange(row.sku, e.value ?? 0)}
                      disabled={loadingLabels || useStockQty}
                      min={0}
                      useGrouping={false}
                      inputClassName="inventory-labels-qty-input"
                    />
                  )}
                />
              </DataTable>
            </div>
          </Card.Body>
        </Card>
      )}
    </CatalogPageLayout>
  );
}
