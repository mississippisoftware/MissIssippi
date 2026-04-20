import type { KeyboardEvent } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { shouldSubmitOnEnter } from "../utils/modalKeyHandlers";

type ConfirmSwitchModeModalProps = {
  show: boolean;
  pendingMode: "add" | "remove" | null;
  onCancel: () => void;
  onKeepAndSwitch: () => void;
  onClearAndSwitch: () => void;
};

export default function ConfirmSwitchModeModal({
  show,
  pendingMode,
  onCancel,
  onKeepAndSwitch,
  onClearAndSwitch,
}: ConfirmSwitchModeModalProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!shouldSubmitOnEnter(event)) return;
    event.preventDefault();
    onKeepAndSwitch();
  };

  const footer = (
    <>
      <Button className="btn-neutral btn-outlined" onClick={onCancel} unstyled>
        <i className="pi pi-times" aria-hidden="true" />
        Cancel
      </Button>
      <Button className="btn-neutral btn-outlined" onClick={onKeepAndSwitch} unstyled>
        <i className="pi pi-refresh" aria-hidden="true" />
        Keep List &amp; Switch
      </Button>
      <Button className="btn-danger" onClick={onClearAndSwitch} unstyled>
        <i className="pi pi-trash" aria-hidden="true" />
        Clear List &amp; Switch
      </Button>
    </>
  );

  return (
    <Dialog
      visible={show}
      onHide={onCancel}
      header="Switch mode?"
      footer={footer}
      modal
      closable
      draggable={false}
      resizable={false}
    >
      <div onKeyDown={handleKeyDown}>
        You have scanned items. Do you want to clear the list before switching to{" "}
        <strong>{pendingMode === "remove" ? "Remove Inventory" : "Add Inventory"}</strong>?
      </div>
    </Dialog>
  );
}
