import { type Dispatch, type SetStateAction } from "react";
import { Button, Card, Col, Form, Row } from "react-bootstrap";
import { DataTable, type DataTableRowEditCompleteEvent, type DataTableRowClickEvent } from "primereact/datatable";
import { Column } from "primereact/column";
import type { ItemListRow, SeasonOption } from "../../items/itemsColorsTypes";
import type { ItemColorView } from "../../service/CatalogService";

type ItemsTableProps = {
  seasons: SeasonOption[];
  loadingLookups: boolean;
  itemListLoading: boolean;
  filteredItems: ItemListRow[];
  selectedItem: ItemListRow | null;
  setSelectedItem: Dispatch<SetStateAction<ItemListRow | null>>;
  editingRows: Record<string, boolean>;
  onRowEditChange: (event: unknown) => void;
  onRowEditComplete: (event: DataTableRowEditCompleteEvent) => void;
  onRowEditCancel: (event: unknown) => void;
  expandedRows: Record<string, boolean>;
  setExpandedRows: Dispatch<SetStateAction<Record<string, boolean>>>;
  normalizeExpandedRows: (expanded: unknown) => Record<string, boolean>;
  onRowClick: (event: DataTableRowClickEvent) => void;
  handleAddItemRow: () => void;
  loadItemList: () => void;
  handleExpandAll: () => void;
  handleCollapseAll: () => void;
  seasonFilterId: string;
  setSeasonFilterId: (value: string) => void;
  activeFilter: string;
  setActiveFilter: (value: string) => void;
  resolveSeasonName: (seasonId: number | string) => string;
  formatPrice: (value?: number | null) => string;
  openColorModal: (row: ItemListRow) => void;
  getUniqueColors: (colorsForItem: ItemColorView[]) => ItemColorView[];
  getReadableTextColor: (hex?: string | null) => string | undefined;
};

type EditorOptions<T> = {
  value?: unknown;
  rowData: T;
  editorCallback?: (value: unknown) => void;
};

export default function ItemsTable({
  seasons,
  loadingLookups,
  itemListLoading,
  filteredItems,
  selectedItem,
  setSelectedItem,
  editingRows,
  onRowEditChange,
  onRowEditComplete,
  onRowEditCancel,
  expandedRows,
  setExpandedRows,
  normalizeExpandedRows,
  onRowClick,
  handleAddItemRow,
  loadItemList,
  handleExpandAll,
  handleCollapseAll,
  seasonFilterId,
  setSeasonFilterId,
  activeFilter,
  setActiveFilter,
  resolveSeasonName,
  formatPrice,
  openColorModal,
  getUniqueColors,
  getReadableTextColor,
}: ItemsTableProps) {
  const renderSeasonEditor = (options: EditorOptions<ItemListRow>) => (
    <Form.Select
      value={options.rowData.seasonId ?? 0}
      onChange={(e) => {
        const nextId = Number(e.target.value);
        const seasonName = resolveSeasonName(nextId);
        options.rowData.seasonId = nextId;
        options.rowData.seasonName = seasonName;
        options.editorCallback?.(nextId);
      }}
    >
      <option value={0}>Choose season</option>
      {seasons.map((season) => (
        <option key={season.seasonId} value={season.seasonId}>
          {season.seasonName}
        </option>
      ))}
    </Form.Select>
  );

  const renderTextEditor = (options: EditorOptions<ItemListRow>) => (
    <Form.Control
      value={typeof options.value === "string" || typeof options.value === "number" ? options.value : ""}
      onChange={(e) => options.editorCallback?.(e.target.value)}
    />
  );

  const renderItemNumber = (row: ItemListRow) => (
    <span className="item-style-value">{row.itemNumber}</span>
  );

  const renderPricePair = (row: ItemListRow) => (
    <div className="item-price-pair">
      <span className="text-muted">{formatPrice(row.wholesalePrice)}</span>
      <span className="item-price-strong">{formatPrice(row.costPrice)}</span>
    </div>
  );

  const renderPricePairEditor = (options: EditorOptions<ItemListRow>) => (
    <div className="item-price-editor">
      <Form.Control
        type="number"
        step="0.01"
        value={options.rowData.wholesalePrice ?? ""}
        placeholder="Wholesale"
        onChange={(e) => {
          const raw = e.target.value;
          const nextValue = raw === "" ? null : Number(raw);
          options.rowData.wholesalePrice = nextValue;
          options.editorCallback?.(nextValue);
        }}
      />
      <Form.Control
        type="number"
        step="0.01"
        value={options.rowData.costPrice ?? ""}
        placeholder="Retail"
        onChange={(e) => {
          const raw = e.target.value;
          const nextValue = raw === "" ? null : Number(raw);
          // eslint-disable-next-line react-hooks/immutability -- PrimeReact row editor mutates rowData
          options.rowData.costPrice = nextValue;
          options.editorCallback?.(options.rowData.wholesalePrice);
        }}
      />
    </div>
  );

  const renderProductionEditor = (options: EditorOptions<ItemListRow>) => (
    <Form.Check
      type="checkbox"
      checked={Boolean(options.value)}
      onChange={(e) => options.editorCallback?.(e.target.checked)}
    />
  );

  const renderInProduction = (row: ItemListRow) => (
    <Form.Check type="checkbox" className="item-production-check" checked={row.inProduction} readOnly disabled />
  );

  const renderColorSummary = (row: ItemListRow) => {
    if (row.itemId <= 0) {
      return <span className="text-muted">Save style first</span>;
    }
    const colorsForItem = getUniqueColors(row.colors ?? []);
    const preview = colorsForItem.slice(0, 4);
    const remaining = colorsForItem.length - preview.length;
    const isEditing = Boolean(editingRows[String(row.itemId)]);

    if (!colorsForItem.length) {
      return isEditing ? (
        <button type="button" className="item-color-edit-btn" onClick={() => openColorModal(row)}>
          <span className="text-muted">Add colors</span>
        </button>
      ) : (
        <span className="text-muted">No colors</span>
      );
    }

    const summary = (
      <div className="item-color-summary">
        {preview.map((color) => (
          <span
            key={`${row.itemId}-${color.colorId}`}
            className={`item-color-dot${color.hexValue ? " has-hex" : ""}`}
            style={color.hexValue ? { backgroundColor: color.hexValue } : undefined}
            title={color.colorName}
          />
        ))}
        {remaining > 0 && <span className="item-color-count">+{remaining}</span>}
      </div>
    );

    return isEditing ? (
      <button type="button" className="item-color-edit-btn" onClick={() => openColorModal(row)}>
        {summary}
        <span className="item-color-edit-text">Edit</span>
      </button>
    ) : (
      summary
    );
  };

  const renderExpandedRow = (row: ItemListRow) => {
    if (row.itemId <= 0) {
      return (
        <div className="item-row-expanded">
          <span className="text-muted">Save the style to add colors.</span>
        </div>
      );
    }
    const colorsForItem = getUniqueColors(row.colors ?? []);
    return (
      <div className="item-row-expanded">
        {colorsForItem.length === 0 ? (
          <span className="text-muted">No colors linked yet.</span>
        ) : (
          <div className="item-color-rect-list">
            {colorsForItem.map((color) => (
              <span
                key={`${row.itemId}-rect-${color.colorId}`}
                className={`item-color-rect${color.hexValue ? " has-hex" : ""}`}
                style={
                  color.hexValue
                    ? { backgroundColor: color.hexValue, color: getReadableTextColor(color.hexValue) }
                    : undefined
                }
              >
                {color.colorName}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="portal-content-card items-colors-main">
      <Card.Body>
        <Row className="items-actions-row align-items-center gy-2">
          <Col className="d-flex flex-wrap gap-2 justify-content-md-end">
            <Button
              type="button"
              className="btn-primary btn-outlined"
              onClick={handleAddItemRow}
              disabled={loadingLookups}
            >
              <i className="pi pi-plus" aria-hidden="true" />
              Add Item
            </Button>
            <Button
              type="button"
              className="btn-neutral btn-outlined"
              onClick={loadItemList}
              disabled={itemListLoading}
            >
              <i className="pi pi-refresh" aria-hidden="true" />
              {itemListLoading ? "Refreshing..." : "Refresh list"}
            </Button>
          </Col>
        </Row>
        <Row className="items-filter-row mt-3 gy-2 align-items-end">
          <Col md={4}>
            <Form.Label>Season</Form.Label>
            <Form.Select
              value={seasonFilterId}
              onChange={(e) => setSeasonFilterId(e.target.value)}
              disabled={loadingLookups}
            >
              <option value="">All seasons</option>
              {seasons.map((season) => (
                <option key={season.seasonId} value={season.seasonId}>
                  {season.seasonName}
                </option>
              ))}
            </Form.Select>
          </Col>
          <Col md={3}>
            <Form.Label>Active</Form.Label>
            <Form.Select value={activeFilter} onChange={(e) => setActiveFilter(e.target.value)}>
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Form.Select>
          </Col>
          <Col md="auto" className="items-filter-actions ms-md-auto">
            <div className="d-flex gap-2 justify-content-md-end">
              <Button
                type="button"
                className="btn-neutral btn-outlined btn-icon"
                onClick={handleExpandAll}
                aria-label="Expand all"
                title="Expand all"
              >
                <i className="pi pi-plus" aria-hidden="true" />
              </Button>
              <Button
                type="button"
                className="btn-neutral btn-outlined btn-icon"
                onClick={handleCollapseAll}
                aria-label="Collapse all"
                title="Collapse all"
              >
                <i className="pi pi-minus" aria-hidden="true" />
              </Button>
            </div>
          </Col>
        </Row>
        <div className="items-table-wrapper mt-3">
          <DataTable
            value={filteredItems}
            dataKey="itemId"
            loading={itemListLoading}
            rowHover
            selectionMode="single"
            selection={selectedItem}
            onSelectionChange={(e) => setSelectedItem((e.value as ItemListRow) ?? null)}
            onRowClick={onRowClick}
            editMode="row"
            editingRows={editingRows}
            onRowEditChange={onRowEditChange}
            onRowEditComplete={onRowEditComplete}
            onRowEditCancel={onRowEditCancel}
            expandedRows={expandedRows}
            onRowToggle={(e) => setExpandedRows(normalizeExpandedRows(e.data))}
            rowExpansionTemplate={renderExpandedRow}
            sortField="itemNumber"
            sortOrder={1}
            sortMode="single"
            className="p-datatable-gridlines items-colors-table"
          >
            <Column expander style={{ width: "2.25rem" }} />
            <Column
              field="inProduction"
              header="Active"
              body={renderInProduction}
              editor={renderProductionEditor}
              className="col-active"
              style={{ width: "4.5rem" }}
            />
            <Column
              field="seasonId"
              header="Season"
              body={(row: ItemListRow) => row.seasonName}
              editor={renderSeasonEditor}
              className="col-season"
            />
            <Column
              field="itemNumber"
              header="Style Number"
              body={renderItemNumber}
              editor={renderTextEditor}
              className="col-style"
              sortable
            />
            <Column field="description" header="Description" editor={renderTextEditor} className="col-description" />
            <Column header="Colors" body={renderColorSummary} className="col-color" />
            <Column
              field="wholesalePrice"
              header="Wholesale / Retail"
              body={renderPricePair}
              editor={renderPricePairEditor}
              className="col-price"
            />
            <Column rowEditor header="Save" headerStyle={{ width: "6rem" }} bodyStyle={{ textAlign: "center" }} />
          </DataTable>
        </div>
      </Card.Body>
    </Card>
  );
}
