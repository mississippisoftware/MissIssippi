import type { MutableRefObject, MouseEvent as ReactMouseEvent } from "react";
import type { iSize } from "../utils/DataInterfaces";
import type { InventoryCardGroup } from "../utils/buildInventoryCardGroups";
import ActionButton from "../components/ActionButton";
import InventoryCardTable from "../components/inventory/InventoryCardTable";
import InventoryEditCard, { type InventoryCardMeta } from "../components/inventoryEdit/InventoryEditCard";
import type { NotifyFn } from "../hooks/useNotifier";

export type InventoryStyleGroupView = {
  itemNumber: string;
  description: string;
  active: boolean;
  wholesalePrice: number | null;
  retailPrice: number | null;
  stockTotal: number;
  rows: InventoryCardGroup["rows"];
};

type InventoryListSectionProps = {
  styleGroups: InventoryStyleGroupView[];
  sizeColumns: iSize[];
  onRequestEditItem: (itemNumber: string) => void;
  formatPrice: (value: number | null) => string;
};

export function InventoryListSection({
  styleGroups,
  sizeColumns,
  onRequestEditItem,
  formatPrice,
}: InventoryListSectionProps) {
  return (
    <div className="content-card inventory-unified-list-card">
      <div className="inventory-style-group-list">
        {styleGroups.filter((group) => group.itemNumber && group.itemNumber.trim() !== "").map((group) => (
          <section key={group.itemNumber} className="inventory-style-group">
            <div className="inventory-style-group-header">
              <div className="inventory-style-group-header__left">
                <div className="inventory-style-group-topline">
                  <span className="inventory-style-group-style">{group.itemNumber}</span>
                  <span className={`badge ${group.active ? "badge-success" : "badge-muted"}`}>
                    {group.active ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="inventory-style-group-description">{group.description || "No description"}</div>
                <div className="inventory-card-meta-row">
                  <span className="inventory-style-group-stock">
                    <span className="inventory-style-group-price-label">Stock</span>
                    <strong>{group.stockTotal}</strong>
                  </span>
                  <span className="inventory-style-group-price">
                    <span className="inventory-style-group-price-label">Wholesale</span>
                    <strong>{formatPrice(group.wholesalePrice)}</strong>
                  </span>
                  <span className="inventory-style-group-price">
                    <span className="inventory-style-group-price-label">Retail</span>
                    <strong>{formatPrice(group.retailPrice)}</strong>
                  </span>
                </div>
              </div>
              <div className="inventory-style-group-header__right">
                <ActionButton
                  icon="pi pi-pencil"
                  className="btn-neutral btn-outlined btn-sm inventory-style-edit-btn"
                  onClick={() => onRequestEditItem(group.itemNumber)}
                  iconOnly
                  ariaLabel={`Edit ${group.itemNumber}`}
                  title={`Edit ${group.itemNumber}`}
                />
              </div>
            </div>
            <div className="inventory-style-group-matrix">
              <InventoryCardTable
                rows={group.rows}
                sizeColumns={sizeColumns}
                compact
                borderless
                hoverable={false}
              />
            </div>
            <div className="inventory-edit-card-footer">
              <span className="inventory-card-meta-row">
                Total on hand: <strong className="inventory-style-group-style">{group.stockTotal} units</strong>
              </span>
              <span className="inventory-card-meta-row">
                {group.rows.length} color{group.rows.length !== 1 ? "s" : ""}
                {group.rows[0]?.seasonName ? ` · ${group.rows[0].seasonName}` : ""}
              </span>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

type InventoryCardsSectionProps = {
  cardGroups: InventoryCardGroup[];
  cardColumns: 1 | 2;
  cardRefs: MutableRefObject<Record<string, HTMLDivElement | null>>;
  onCardClickToEdit: (itemNumber: string, event: ReactMouseEvent<HTMLDivElement>) => void;
  itemMetaByItemNumber: Record<string, InventoryCardMeta>;
  activeEditableItemNumber: string | null;
  sizeColumns: iSize[];
  onQtyChange: (itemNumber: string, colorName: string, sizeName: string, qty: number) => void;
  onDownloadCard: (group: InventoryCardGroup) => void;
  onDiscard: (itemNumber: string) => void;
  onSave: (itemNumber: string) => void;
  isDirty: (itemNumber: string) => boolean;
  onDoneEditing: (itemNumber: string) => void;
  notify: NotifyFn;
};

export function InventoryCardsSection({
  cardGroups,
  cardColumns,
  cardRefs,
  onCardClickToEdit,
  itemMetaByItemNumber,
  activeEditableItemNumber,
  sizeColumns,
  onQtyChange,
  onDownloadCard,
  onDiscard,
  onSave,
  isDirty,
  onDoneEditing,
  notify,
}: InventoryCardsSectionProps) {
  return (
    <div className="inventory-unified-list-card">
      <div className={`inventory-cards-grid ${cardColumns === 1 ? "one-column" : "two-columns"}`}>
        {cardGroups.map((group) => {
          const itemMeta = itemMetaByItemNumber[group.itemNumber];
          const editable = activeEditableItemNumber === group.itemNumber;
          return (
            <div
              key={group.itemNumber}
              ref={(element) => {
                cardRefs.current[group.itemNumber] = element;
              }}
              tabIndex={-1}
              className="inventory-unified-card-anchor"
              onClick={(event) => onCardClickToEdit(group.itemNumber, event)}
            >
              <InventoryEditCard
                group={group}
                sizeColumns={sizeColumns}
                onQtyChange={onQtyChange}
                onDownload={onDownloadCard}
                onDiscard={onDiscard}
                onSave={onSave}
                isDirty={isDirty(group.itemNumber)}
                placeholderImage=""
                isEditable={editable}
                isActive={editable}
                itemMeta={itemMeta}
                onDoneEditing={onDoneEditing}
                notify={notify}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
