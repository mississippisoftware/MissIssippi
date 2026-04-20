import type { ReactElement } from "react";
import { Column } from "primereact/column";
import { DataTable, type DataTableRowEditCompleteEvent } from "primereact/datatable";
import { ProgressSpinner } from "primereact/progressspinner";
import type { SkuListItem } from "../../service/SkuService";
import type { ItemColorView } from "../../service/CatalogService";

type SkuListTabProps = {
  skuError: string | null;
  skuLoading: boolean;
  skuRows: SkuListItem[];
  skuEditingRows: Record<string, boolean>;
  isEditable: boolean;
  onEditingRowsChange: (rows: Record<string, boolean>) => void;
  onRowEditComplete: (event: DataTableRowEditCompleteEvent) => void;
  renderSkuEditor: (options: { value?: unknown; editorCallback?: (value: unknown) => void }) => ReactElement;
};

export function InventoryEditCardSkuListTab({
  skuError,
  skuLoading,
  skuRows,
  skuEditingRows,
  isEditable,
  onEditingRowsChange,
  onRowEditComplete,
  renderSkuEditor,
}: SkuListTabProps) {
  return (
    <div className="inventory-card-tab-panel inventory-card-tab-scroll">
      {skuError ? (
        <div className="pt-alert pt-alert-danger" role="alert">{skuError}</div>
      ) : null}
      {skuLoading ? (
        <div className="pt-flex-row pt-form-hint">
          <ProgressSpinner className="pt-spinner-sm" strokeWidth="6" />
          Loading SKUs...
        </div>
      ) : (
        <DataTable
          value={skuRows}
          dataKey="skuId"
          rowHover
          editMode="row"
          editingRows={skuEditingRows}
          onRowEditChange={(event) => onEditingRowsChange((event.data as Record<string, boolean>) ?? {})}
          onRowEditComplete={onRowEditComplete}
          className="p-datatable-gridlines inventory-card-sku-table"
          scrollable
          scrollHeight="260px"
          emptyMessage="No SKUs found for this style."
        >
          <Column field="sku" header="SKU" editor={isEditable ? renderSkuEditor : undefined} />
          <Column field="colorName" header="Color" />
          <Column field="sizeName" header="Size" />
          <Column field="qty" header="Qty" className="text-end" />
          <Column
            field="inProduction"
            header="Active"
            body={(row: SkuListItem) => (row.inProduction ? "Yes" : "No")}
          />
          {isEditable ? (
            <Column
              rowEditor
              header="Save"
              headerClassName="col-actions"
              bodyClassName="col-center"
            />
          ) : null}
        </DataTable>
      )}
    </div>
  );
}

// TODO: wire up style images API — no endpoint exists yet, rendering empty state.
export function InventoryEditCardImagesTab() {
  return (
    <div className="inventory-card-tab-panel inventory-images-tab">
      <div className="inventory-images-header">
        <span className="pt-text-label">All images · 0 files</span>
      </div>
      <div className="inventory-images-empty">
        <i className="pi pi-image" aria-hidden="true" />
        <p className="pt-text-meta">No images uploaded for this style</p>
      </div>
    </div>
  );
}

type DetailsTabProps = {
  detailsError: string | null;
  detailsLoading: boolean;
  visibleColors: ItemColorView[];
  isEditable: boolean;
  onToggleColorActive: (itemColorId: number, nextActive: boolean) => Promise<void>;
};

export function InventoryEditCardDetailsTab({
  detailsError,
  detailsLoading,
  visibleColors,
}: DetailsTabProps) {
  return (
    <div className="inventory-card-tab-panel inventory-card-tab-scroll">
      {detailsError ? (
        <div className="pt-alert pt-alert-danger" role="alert">{detailsError}</div>
      ) : null}
      {detailsLoading ? (
        <div className="pt-flex-row pt-form-hint">
          <ProgressSpinner className="pt-spinner-sm" strokeWidth="6" />
          Loading details...
        </div>
      ) : (
        <div className="inventory-card-details-sections">
          <section>
            <div className="inventory-card-details-title">Current Colors</div>
            {visibleColors.length === 0 ? (
              <div className="pt-text-desc">No colors linked.</div>
            ) : (
              <div className="inventory-card-color-chip-list">
                {visibleColors.map((color) => (
                  <div key={color.itemColorId} className="inventory-card-color-chip">
                    <div className="inventory-card-color-chip-main">
                      <span
                        className={`inventory-card-color-tile${color.hexValue ? " has-hex" : ""}`}
                        style={color.hexValue ? { backgroundColor: color.hexValue } : undefined}
                        aria-hidden="true"
                      />
                      <span className="inventory-card-color-chip-name">{color.colorName}</span>
                      {color.hexValue ? (
                        <span className="inventory-card-color-chip-hex">{color.hexValue.toUpperCase()}</span>
                      ) : null}
                    </div>
                    <span className={`badge ${color.itemColorActive !== false ? "badge-success" : "badge-muted"}`}>
                      {color.itemColorActive !== false ? "Active" : "Inactive"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="inventory-card-details-title">Notes</div>
            <textarea
              rows={5}
              value="Notes are not available in the current style API."
              readOnly
              className="inventory-card-notes pt-form-input"
            />
          </section>
        </div>
      )}
    </div>
  );
}
