import type { ReactElement } from "react";
import { Alert, Form, Spinner } from "react-bootstrap";
import { Column } from "primereact/column";
import { DataTable, type DataTableRowEditCompleteEvent } from "primereact/datatable";
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
      {skuError ? <Alert variant="danger">{skuError}</Alert> : null}
      {skuLoading ? (
        <div className="d-flex align-items-center gap-2 py-2 text-muted">
          <Spinner animation="border" size="sm" />
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
              headerStyle={{ width: "6rem" }}
              bodyStyle={{ textAlign: "center" }}
            />
          ) : null}
        </DataTable>
      )}
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
  isEditable,
  onToggleColorActive,
}: DetailsTabProps) {
  return (
    <div className="inventory-card-tab-panel inventory-card-tab-scroll">
      {detailsError ? <Alert variant="danger">{detailsError}</Alert> : null}
      {detailsLoading ? (
        <div className="d-flex align-items-center gap-2 py-2 text-muted">
          <Spinner animation="border" size="sm" />
          Loading details...
        </div>
      ) : (
        <div className="inventory-card-details-sections">
          <section>
            <div className="inventory-card-details-title">Current Colors</div>
            {visibleColors.length === 0 ? (
              <div className="text-muted">No colors linked.</div>
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
                    <Form.Check
                      type="switch"
                      id={`inventory-color-active-${color.itemColorId}`}
                      label="Active"
                      checked={color.itemColorActive !== false}
                      disabled={!isEditable}
                      onChange={(event) => {
                        void onToggleColorActive(color.itemColorId, event.target.checked);
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="inventory-card-details-title">Notes</div>
            <Form.Control
              as="textarea"
              rows={5}
              value="Notes are not available in the current style API."
              readOnly
              className="inventory-card-notes"
            />
          </section>
        </div>
      )}
    </div>
  );
}
