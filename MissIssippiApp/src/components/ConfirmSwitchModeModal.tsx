import type { KeyboardEvent } from "react";
import { Button, Modal } from "react-bootstrap";
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
  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!shouldSubmitOnEnter(event)) return;
    event.preventDefault();
    onKeepAndSwitch();
  };

  return (
    <Modal show={show} onHide={onCancel} centered onKeyDown={handleKeyDown}>
      <Modal.Header closeButton>
        <Modal.Title>Switch mode?</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        You have scanned items. Do you want to clear the list before switching to{" "}
        <strong>{pendingMode === "remove" ? "Remove Inventory" : "Add Inventory"}</strong>?
      </Modal.Body>
      <Modal.Footer>
        <Button className="btn-neutral btn-outlined" onClick={onCancel}>
          <i className="pi pi-times" aria-hidden="true" />
          Cancel
        </Button>
        <Button className="btn-neutral btn-outlined" onClick={onKeepAndSwitch}>
          <i className="pi pi-refresh" aria-hidden="true" />
          Keep List & Switch
        </Button>
        <Button className="btn-danger" onClick={onClearAndSwitch}>
          <i className="pi pi-trash" aria-hidden="true" />
          Clear List & Switch
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
