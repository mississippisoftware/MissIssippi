import { type KeyboardEventHandler } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";

type ColorListDialogsProps = {
  showMigrateConfirm: boolean;
  migratingColor: boolean;
  colorName?: string | null;
  targetColorName?: string | null;
  onMigrateKeyDown: KeyboardEventHandler<HTMLElement>;
  onCancelMigrate: () => void;
  onConfirmMigrate: () => void;
  showCollectionModal: boolean;
  collectionInput: string;
  collectionSaving: boolean;
  onCollectionKeyDown: KeyboardEventHandler<HTMLElement>;
  onCollectionInputChange: (value: string) => void;
  onCancelCollection: () => void;
  onSaveCollection: () => void;
  showDeleteModal: boolean;
  deletingColor: boolean;
  deleteColorName?: string | null;
  onDeleteKeyDown: KeyboardEventHandler<HTMLElement>;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
};

export default function ColorListDialogs({
  showMigrateConfirm,
  migratingColor,
  colorName,
  targetColorName,
  onMigrateKeyDown,
  onCancelMigrate,
  onConfirmMigrate,
  showCollectionModal,
  collectionInput,
  collectionSaving,
  onCollectionKeyDown,
  onCollectionInputChange,
  onCancelCollection,
  onSaveCollection,
  showDeleteModal,
  deletingColor,
  deleteColorName,
  onDeleteKeyDown,
  onCancelDelete,
  onConfirmDelete,
}: ColorListDialogsProps) {
  return (
    <>
      <Dialog
        visible={showMigrateConfirm}
        onHide={onCancelMigrate}
        header="Confirm migration"
        footer={
          <>
            <Button type="button" className="btn-neutral btn-outlined" onClick={onCancelMigrate} disabled={migratingColor} unstyled>
              <i className="pi pi-times" aria-hidden="true" />
              Cancel
            </Button>
            <Button type="button" className="btn-danger" onClick={onConfirmMigrate} disabled={migratingColor} unstyled>
              <i className="pi pi-check" aria-hidden="true" />
              {migratingColor ? "Migrating..." : "Confirm migrate"}
            </Button>
          </>
        }
        modal
        closable
        draggable={false}
        resizable={false}
        onKeyDown={onMigrateKeyDown}
      >
        <p className="pt-text-desc">
          Move <strong>{colorName}</strong> to{" "}
          <strong>{targetColorName}</strong>? This will update all related records.
        </p>
      </Dialog>

      <Dialog
        visible={showCollectionModal}
        onHide={onCancelCollection}
        header="Add Collection"
        footer={
          <>
            <Button type="button" className="btn-neutral btn-outlined" onClick={onCancelCollection} disabled={collectionSaving} unstyled>
              <i className="pi pi-times" aria-hidden="true" />
              Cancel
            </Button>
            <Button type="button" className="btn-success" onClick={onSaveCollection} disabled={collectionSaving} unstyled>
              <i className="pi pi-save" aria-hidden="true" />
              {collectionSaving ? "Saving..." : "Save collection"}
            </Button>
          </>
        }
        modal
        closable
        draggable={false}
        resizable={false}
        onKeyDown={onCollectionKeyDown}
      >
        <label className="page-filters-label">Collection name</label>
        <input
          type="text"
          value={collectionInput}
          onChange={(event) => onCollectionInputChange(event.target.value)}
          placeholder="Enter collection name"
          disabled={collectionSaving}
          className="pt-form-input"
        />
      </Dialog>

      <Dialog
        visible={showDeleteModal}
        onHide={onCancelDelete}
        header="Delete color"
        footer={
          <>
            <Button type="button" className="btn-neutral btn-outlined" onClick={onCancelDelete} disabled={deletingColor} unstyled>
              <i className="pi pi-times" aria-hidden="true" />
              Cancel
            </Button>
            <Button type="button" className="btn-danger" onClick={onConfirmDelete} disabled={deletingColor} unstyled>
              <i className="pi pi-trash" aria-hidden="true" />
              {deletingColor ? "Deleting..." : "Delete"}
            </Button>
          </>
        }
        modal
        closable
        draggable={false}
        resizable={false}
        onKeyDown={onDeleteKeyDown}
      >
        <p className="pt-text-desc">
          Delete <strong>{deleteColorName}</strong>? This action cannot be undone.
        </p>
      </Dialog>
    </>
  );
}
