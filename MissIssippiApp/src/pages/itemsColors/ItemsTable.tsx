import { type Dispatch, type SetStateAction } from "react";
import { DataTable, type DataTableRowEditCompleteEvent, type DataTableRowClickEvent } from "primereact/datatable";
import { Column } from "primereact/column";
import type { ItemListRow, SeasonOption } from "../../items/itemsColorsTypes";
import type { ItemColorView } from "../../service/CatalogService";
import type { EditorOptions } from "../../types/editor";
import ColorDot from "../../components/ColorDot";

type ItemsTableProps = {
  seasons: SeasonOption[];
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
  resolveSeasonName: (seasonId: number | string) => string;
  formatPrice: (value?: number | null) => string;
  openColorModal: (row: ItemListRow) => void;
  getUniqueColors: (colorsForItem: ItemColorView[]) => ItemColorView[];
  getReadableTextColor: (hex?: string | null) => string | undefined;
  onCopyColorName: (colorName: string) => void;
};

export default function ItemsTable({
  seasons,
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
  resolveSeasonName,
  formatPrice,
  openColorModal,
  getUniqueColors,
  getReadableTextColor,
  onCopyColorName,
}: ItemsTableProps) {
  const renderSeasonEditor = (options: EditorOptions<ItemListRow>) => (
    <select
      className="pt-form-select"
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
    </select>
  );

  const renderTextEditor = (options: EditorOptions<ItemListRow>) => (
    <input
      className="pt-form-input"
      value={typeof options.value === "string" || typeof options.value === "number" ? String(options.value) : ""}
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
      <input
        className="pt-form-input"
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
      <input
        className="pt-form-input"
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
    <input
      type="checkbox"
      checked={Boolean(options.value)}
      onChange={(e) => options.editorCallback?.(e.target.checked)}
    />
  );

  const renderInProduction = (row: ItemListRow) => (
    <input type="checkbox" className="item-production-check" checked={row.inProduction} readOnly disabled />
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
          <ColorDot
            key={`${row.itemId}-${color.colorId}`}
            colorName={color.colorName}
            hexColor={color.hexValue}
            size="lg"
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
              <button
                type="button"
                key={`${row.itemId}-rect-${color.colorId}`}
                className={`item-color-rect item-color-rect-button${color.hexValue ? " has-hex" : ""}`}
                style={
                  color.hexValue
                    ? { backgroundColor: color.hexValue, color: getReadableTextColor(color.hexValue) }
                    : undefined
                }
                onClick={(event) => {
                  event.stopPropagation();
                  onCopyColorName(color.colorName);
                }}
                title={`Copy ${color.colorName}`}
                aria-label={`Copy color name ${color.colorName}`}
              >
                {color.colorName}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="portal-content-card items-colors-main">
      <div>
        <div className="items-table-wrapper">
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
            <Column expander className="col-expander" />
            <Column
              field="inProduction"
              header="Active"
              body={renderInProduction}
              editor={renderProductionEditor}
              className="col-active"
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
            <Column rowEditor header="Save" headerClassName="col-actions" bodyClassName="col-center" />
          </DataTable>
        </div>
      </div>
    </div>
  );
}
