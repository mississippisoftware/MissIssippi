import { type KeyboardEvent } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { shouldSubmitOnEnter } from "../../utils/modalKeyHandlers";

type AdminDeleteTarget = {
  itemId: number;
  seasonName?: string | null;
  itemNumber?: string | null;
};

type DuplicateRow = {
  seasonName: string;
  itemNumber: string;
  rowNumber: number;
};

type AdminDeleteModalProps = {
  show: boolean;
  submitting: boolean;
  mode: "selected" | "filtered" | null;
  targets: AdminDeleteTarget[];
  password: string;
  onPasswordChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
};

export function ItemsColorsAdminDeleteModal({
  show,
  submitting,
  mode,
  targets,
  password,
  onPasswordChange,
  onClose,
  onConfirm,
}: AdminDeleteModalProps) {
  return (
    <Dialog
      visible={show}
      onHide={onClose}
      header={mode === "filtered" ? "Admin hard delete filtered styles" : "Admin hard delete style"}
      footer={
        <>
          <Button
            type="button"
            className="btn-neutral btn-outlined"
            onClick={onClose}
            disabled={submitting}
            unstyled
          >
            <i className="pi pi-times" aria-hidden="true" />
            Cancel
          </Button>
          <Button
            type="button"
            className="btn-danger"
            onClick={onConfirm}
            disabled={submitting || targets.length === 0}
            unstyled
          >
            <i className="pi pi-trash" aria-hidden="true" />
            {submitting ? "Deleting..." : "Permanently Delete"}
          </Button>
        </>
      }
      modal
      closable={!submitting}
      draggable={false}
      resizable={false}
    >
      <div className="alert alert-danger mb-3" role="alert">
        This permanently deletes styles and related item colors, SKUs, inventory, inventory history, and images.
        This cannot be undone.
      </div>
      <div className="pt-text-body-strong">
        <strong>Target count:</strong> {targets.length}
      </div>
      {targets.length > 0 && (
        <ul>
          {targets.slice(0, 6).map((row) => (
            <li key={`admin-delete-${row.itemId}`}>
              {row.seasonName || "?"} - {row.itemNumber || `Item ${row.itemId}`} (ID {row.itemId})
            </li>
          ))}
        </ul>
      )}
      {targets.length > 6 && (
        <div className="pt-text-desc">{targets.length - 6} more style(s) not shown.</div>
      )}
      <div>
        <label htmlFor="adminDeletePassword" className="pt-text-label">Admin password</label>
        <input
          id="adminDeletePassword"
          type="password"
          className="pt-form-input"
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          placeholder="Enter admin delete password"
          autoFocus
          disabled={submitting}
          onKeyDown={(event) => {
            if (!shouldSubmitOnEnter(event)) return;
            event.preventDefault();
            onConfirm();
          }}
        />
      </div>
    </Dialog>
  );
}

type DuplicateModalProps = {
  show: boolean;
  rows: DuplicateRow[];
  onCancel: () => void;
  onKeepExisting: () => void;
  onUpdateDetails: () => void;
};

export function ItemsColorsDuplicateModal({
  show,
  rows,
  onCancel,
  onKeepExisting,
  onUpdateDetails,
}: DuplicateModalProps) {
  return (
    <Dialog
      visible={show}
      onHide={onCancel}
      header="Existing styles found"
      footer={
        <>
          <Button
            type="button"
            className="btn-neutral btn-outlined"
            onClick={onCancel}
            unstyled
          >
            <i className="pi pi-times" aria-hidden="true" />
            Cancel
          </Button>
          <Button
            type="button"
            className="btn-neutral btn-outlined"
            onClick={onKeepExisting}
            unstyled
          >
            <i className="pi pi-refresh" aria-hidden="true" />
            Keep existing details
          </Button>
          <Button
            type="button"
            className="btn-success"
            onClick={onUpdateDetails}
            unstyled
          >
            <i className="pi pi-save" aria-hidden="true" />
            Update details
          </Button>
        </>
      }
      modal
      closable
      draggable={false}
      resizable={false}
      onKeyDown={(event: KeyboardEvent<HTMLElement>) => {
        if (!shouldSubmitOnEnter(event)) return;
        event.preventDefault();
        onUpdateDetails();
      }}
    >
      <p className="pt-text-body">
        Some styles in this upload already exist. Do you want to update their details with the uploaded data?
      </p>
      <p className="pt-text-desc">
        InProduction status will still sync from the upload file when that column is present.
      </p>
      <ul>
        {rows.slice(0, 6).map((row) => (
          <li key={`${row.seasonName}-${row.itemNumber}-${row.rowNumber}`}>
            {row.seasonName} - {row.itemNumber}
          </li>
        ))}
      </ul>
      {rows.length > 6 && (
        <div className="pt-text-desc">
          {rows.length - 6} more style(s) not shown.
        </div>
      )}
    </Dialog>
  );
}
