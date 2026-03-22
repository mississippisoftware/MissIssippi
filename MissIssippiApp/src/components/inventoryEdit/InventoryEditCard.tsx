import { useEffect, useState } from "react";
import { Card, Form, Tab, Tabs } from "react-bootstrap";
import type { InventoryCardGroup } from "../../utils/buildInventoryCardGroups";
import type { iSize } from "../../utils/DataInterfaces";
import type { NotifyFn } from "../../hooks/useNotifier";
import { formatPrice } from "../../utils/formatters";
import ActionButton from "../ActionButton";
import PageActionsRow from "../PageActionsRow";
import InventoryCardTable from "../inventory/InventoryCardTable";
import { InventoryEditCardDetailsTab, InventoryEditCardSkuListTab } from "./InventoryEditCardTabs";
import { useInventoryCardDetails, type InventoryCardMeta } from "./useInventoryCardDetails";
import { useInventoryCardSku } from "./useInventoryCardSku";

// InventoryCardMeta is defined in the hook and re-exported here so existing
// imports (e.g. inventoryView.tsx) continue to resolve from this file.
export type { InventoryCardMeta };

type InventoryEditCardProps = {
  group: InventoryCardGroup;
  sizeColumns: iSize[];
  onQtyChange: (itemNumber: string, colorName: string, sizeName: string, qty: number) => void;
  onDownload: (group: InventoryCardGroup) => void;
  onDiscard: (itemNumber: string) => void;
  onSave: (itemNumber: string) => void;
  isDirty?: boolean;
  placeholderImage?: string;
  isEditable?: boolean;
  isActive?: boolean;
  itemMeta?: InventoryCardMeta;
  onDoneEditing?: (itemNumber: string) => void;
  notify?: NotifyFn;
};

const InventoryEditCard = ({
  group,
  sizeColumns,
  onQtyChange,
  onDownload,
  onDiscard,
  onSave,
  isDirty = false,
  placeholderImage,
  isEditable = false,
  isActive = false,
  itemMeta,
  onDoneEditing,
  notify,
}: InventoryEditCardProps) => {
  const [activeTab, setActiveTab] = useState("inventory");

  // Reset activeTab when the group changes.
  useEffect(() => {
    setActiveTab("inventory");
  }, [group.itemNumber, group.rows]);

  const details = useInventoryCardDetails({
    group,
    itemMeta,
    activeTab,
    isEditable,
    notify,
  });

  const sku = useInventoryCardSku({
    group,
    activeTab,
    isEditable,
    notify,
  });

  const activeStatusLabel = itemMeta?.inProduction === false ? "Inactive" : "Active";

  return (
    <Card className={`inventory-edit-card${isActive ? " is-active-edit" : ""}`}>
      <Card.Body className="inventory-edit-card-body inventory-edit-card-body--split">
        <div className="inventory-card-main-column">
          <div className="inventory-card-header-main">
            <div className="inventory-card-header-topline">
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <span className="fw-bold inventory-card-style-number">{group.itemNumber}</span>
                {isDirty ? <span className="badge bg-warning text-dark">Unsaved changes</span> : null}
                {isEditable ? <span className="badge bg-primary">Editing</span> : null}
              </div>
              {isEditable ? (
                <ActionButton
                  label="Done Editing"
                  icon="pi pi-check"
                  className="btn-neutral btn-outlined"
                  onClick={() => onDoneEditing?.(group.itemNumber)}
                />
              ) : null}
            </div>

            <div className="inventory-card-description">{group.description || "No description"}</div>

            <div className="inventory-card-meta-row">
              <span>
                <strong>Wholesale:</strong> {formatPrice(itemMeta?.wholesalePrice)}
              </span>
              <span>
                <strong>Retail:</strong> {formatPrice(itemMeta?.retailPrice)}
              </span>
            </div>
            <div className="inventory-card-active-line">{activeStatusLabel}</div>
          </div>

          <Tabs
            id={`inventory-card-tabs-${group.itemNumber}`}
            activeKey={activeTab}
            onSelect={(nextKey) => setActiveTab(nextKey ?? "inventory")}
            className="inventory-card-tabs"
            mountOnEnter
          >
            <Tab eventKey="inventory" title="Inventory">
              <div className="inventory-card-tab-panel">
                <div className="inventory-style-group-matrix">
                  <InventoryCardTable
                    rows={group.rows}
                    sizeColumns={sizeColumns}
                    editable={isEditable}
                    readonlyCellBoxed
                    compact
                    borderless
                    hoverable={false}
                    colorColumnHeader=""
                    onQtyChange={onQtyChange}
                  />
                </div>
              </div>
            </Tab>

            <Tab eventKey="sku-list" title="SKU List">
              <InventoryEditCardSkuListTab
                skuError={sku.skuError}
                skuLoading={sku.skuLoading}
                skuRows={sku.skuRows}
                skuEditingRows={sku.skuEditingRows}
                isEditable={isEditable}
                onEditingRowsChange={sku.setSkuEditingRows}
                onRowEditComplete={sku.onRowEditComplete}
                renderSkuEditor={renderSkuEditor}
              />
            </Tab>

            <Tab eventKey="details" title="Details">
              <InventoryEditCardDetailsTab
                detailsError={details.detailsError}
                detailsLoading={details.detailsLoading}
                visibleColors={details.visibleColors}
                isEditable={isEditable}
                onToggleColorActive={details.onToggleColorActive}
              />
            </Tab>

            <Tab eventKey="images" title="Images">
              <div className="inventory-card-tab-panel">
                <div className="inventory-card-details-title mb-2">Secondary Images</div>
                <div className="inventory-card-secondary-strip" aria-label="Secondary images">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div key={`${group.itemNumber}-secondary-${index + 1}`} className="inventory-card-secondary-item">
                      <div className="inventory-card-image-placeholder">No Image</div>
                    </div>
                  ))}
                </div>
              </div>
            </Tab>
          </Tabs>
        </div>

        <aside className="inventory-card-image-column">
          <div className="inventory-card-image-square">
            {placeholderImage ? (
              <img src={placeholderImage} alt={`${group.itemNumber} main`} className="inventory-card-image-square-asset" />
            ) : (
              <div className="inventory-card-image-placeholder">No Main Image Available</div>
            )}
          </div>
        </aside>
      </Card.Body>

      <Card.Footer className="inventory-edit-card-footer">
        <PageActionsRow>
          <ActionButton
            label="Download"
            icon="pi pi-download"
            className="btn-info btn-outlined"
            onClick={() => onDownload(group)}
          />
          {isEditable ? (
            <>
              <ActionButton
                label="Discard"
                icon="pi pi-times"
                className="btn-danger btn-outlined"
                onClick={() => onDiscard(group.itemNumber)}
                disabled={!isDirty}
              />
              <ActionButton
                label="Save"
                icon="pi pi-save"
                className="btn-success"
                onClick={() => onSave(group.itemNumber)}
                disabled={!isDirty}
              />
            </>
          ) : null}
        </PageActionsRow>
      </Card.Footer>
    </Card>
  );
};

function renderSkuEditor(options: { value?: unknown; editorCallback?: (value: unknown) => void }) {
  return (
    <Form.Control
      value={typeof options.value === "string" ? options.value : ""}
      onChange={(event) => options.editorCallback?.(event.target.value)}
      autoFocus
    />
  );
}

export default InventoryEditCard;
