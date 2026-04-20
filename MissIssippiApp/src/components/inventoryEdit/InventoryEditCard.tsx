import { useEffect, useState } from "react";
import type { InventoryCardGroup } from "../../utils/buildInventoryCardGroups";
import type { iSize } from "../../utils/DataInterfaces";
import type { NotifyFn } from "../../hooks/useNotifier";
import { formatPrice } from "../../utils/formatters";
import ActionButton from "../ActionButton";
import InventoryCardTable from "../inventory/InventoryCardTable";
import {
  InventoryEditCardDetailsTab,
  InventoryEditCardSkuListTab,
  InventoryEditCardImagesTab,
} from "./InventoryEditCardTabs";
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
  placeholderImage: _placeholderImage,
  isEditable = false,
  isActive = false,
  itemMeta,
  onDoneEditing,
  notify,
}: InventoryEditCardProps) => {
  const [activeTab, setActiveTab] = useState<string>("inventory");

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

  // Derived display values — pure UI derivation from props, not business logic.
  const stockTotal = group.rows.reduce(
    (total, row) =>
      total + Object.values(row.sizes).reduce((s, cell) => s + (cell?.qty ?? 0), 0),
    0,
  );
  const seasonName = itemMeta?.seasonName ?? group.rows[0]?.seasonName ?? "";
  const isActiveBadge = itemMeta?.inProduction !== false;

  return (
    <div
      className={`inventory-edit-card portal-card--flat${isActive ? " is-active-edit" : ""}`}
    >
      {/* ── Card header: compact, no image ───────────────────────────────── */}
      <div className="inventory-edit-card-header">
        <div className="inventory-edit-card-header__left">
          <div className="inventory-edit-card-header__top">
            <span className="inventory-style-group-style">{group.itemNumber}</span>
            <span className={`badge ${isActiveBadge ? "badge-success" : "badge-muted"}`}>
              {isActiveBadge ? "Active" : "Inactive"}
            </span>
            {isDirty ? <span className="badge badge-warning">Unsaved</span> : null}
            {isEditable ? <span className="badge badge-info">Editing</span> : null}
          </div>
          <div className="inventory-card-meta-row">
            {group.description ? (
              <span className="inventory-card-meta-item">
                <span className="meta-label">Type </span>
                <span className="meta-value">{group.description}</span>
              </span>
            ) : null}
            <span className="inventory-card-meta-item">
              <span className="meta-label">Stock </span>
              <span className="meta-value">{stockTotal}</span>
            </span>
            <span className="inventory-card-meta-item">
              <span className="meta-label">Wholesale </span>
              <span className="meta-value">{formatPrice(itemMeta?.wholesalePrice)}</span>
            </span>
            <span className="inventory-card-meta-item">
              <span className="meta-label">Retail </span>
              <span className="meta-value">{formatPrice(itemMeta?.retailPrice)}</span>
            </span>
            {seasonName ? (
              <span className="inventory-card-meta-item">
                <span className="meta-label">Season </span>
                <span className="meta-value">{seasonName}</span>
              </span>
            ) : null}
          </div>
        </div>
        <div className="inventory-edit-card-header__right">
          <button
            type="button"
            className="inventory-card-edit-btn"
            onClick={() => setActiveTab("details")}
            aria-label="View style details"
            title="View style details"
          >
            <i className="pi pi-pencil" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* ── Card body: two-column layout ─────────────────────────────────── */}
      <div className="inventory-edit-card-body">

        {/* Left column: tab strip + tab content */}
        <div className="inventory-edit-card-body__table">

          {/* Tab strip */}
          <div className="inventory-card-tabs">
            <button
              type="button"
              className={`inventory-card-tab${activeTab === "inventory" ? " inventory-card-tab--active" : ""}`}
              onClick={() => setActiveTab("inventory")}
            >
              Inventory
            </button>
            <button
              type="button"
              className={`inventory-card-tab${activeTab === "sku-list" ? " inventory-card-tab--active" : ""}`}
              onClick={() => setActiveTab("sku-list")}
            >
              SKU List
            </button>
            <button
              type="button"
              className={`inventory-card-tab${activeTab === "details" ? " inventory-card-tab--active" : ""}`}
              onClick={() => setActiveTab("details")}
            >
              Details
            </button>
            <button
              type="button"
              className={`inventory-card-tab${activeTab === "images" ? " inventory-card-tab--active" : ""}`}
              onClick={() => setActiveTab("images")}
            >
              Images
            </button>
          </div>

          {/* Tab panels */}
          {activeTab === "inventory" ? (
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
          ) : null}

          {activeTab === "sku-list" ? (
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
          ) : null}

          {activeTab === "details" ? (
            <InventoryEditCardDetailsTab
              detailsError={details.detailsError}
              detailsLoading={details.detailsLoading}
              visibleColors={details.visibleColors}
              isEditable={isEditable}
              onToggleColorActive={details.onToggleColorActive}
            />
          ) : null}

          {activeTab === "images" ? <InventoryEditCardImagesTab /> : null}
        </div>

        {/* Right column: image zone */}
        <div className="inventory-edit-card-body__image">
          <div className="inventory-card-image-label">Main image</div>
          <div className="inventory-card-image-zone">
            <div className="inventory-card-image-frame">
              <i className="pi pi-image" aria-hidden="true" />
            </div>
            <span className="inventory-card-image-caption">No image uploaded</span>
          </div>
        </div>

      </div>

      {/* ── Card footer ──────────────────────────────────────────────────── */}
      <div className="inventory-edit-card-footer">
        <span className="inventory-card-footer-info">
          Total on hand:{" "}
          <span className="inventory-card-meta-value">{stockTotal} units</span>
          <span className="inventory-card-footer-dot">·</span>
          {group.rows.length} color{group.rows.length !== 1 ? "s" : ""}
          {seasonName ? (
            <>
              <span className="inventory-card-footer-dot">·</span>
              {seasonName}
            </>
          ) : null}
        </span>
        <div className="inventory-card-footer-actions">
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
              <ActionButton
                label="Done Editing"
                icon="pi pi-check"
                className="btn-neutral btn-outlined"
                onClick={() => onDoneEditing?.(group.itemNumber)}
              />
            </>
          ) : null}
          <button
            type="button"
            className="pt-btn pt-btn--secondary"
            onClick={() => onDownload(group)}
          >
            <i className="pi pi-download" aria-hidden="true" />
            Download
          </button>
        </div>
      </div>
    </div>
  );
};

function renderSkuEditor(options: { value?: unknown; editorCallback?: (value: unknown) => void }) {
  return (
    <input
      type="text"
      value={typeof options.value === "string" ? options.value : ""}
      onChange={(event) => options.editorCallback?.(event.target.value)}
      autoFocus
      className="pt-form-input"
    />
  );
}

export default InventoryEditCard;
