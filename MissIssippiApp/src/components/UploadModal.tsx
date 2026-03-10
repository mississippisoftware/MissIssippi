import type { KeyboardEvent, ReactNode } from "react";
import { Button, Modal } from "react-bootstrap";
import { shouldSubmitOnEnter } from "../utils/modalKeyHandlers";

type UploadModalProps = {
  show: boolean;
  title: string;
  onClose: () => void;
  headerContent: ReactNode;
  downloadAction?: ReactNode;
  children: ReactNode;
  closeLabel?: string;
  closeDisabled?: boolean;
  onEnterKey?: () => void;
  enterDisabled?: boolean;
};

export default function UploadModal({
  show,
  title,
  onClose,
  headerContent,
  downloadAction,
  children,
  closeLabel = "Close",
  closeDisabled = false,
  onEnterKey,
  enterDisabled = false,
}: UploadModalProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!onEnterKey || enterDisabled) return;
    if (!shouldSubmitOnEnter(event)) return;
    event.preventDefault();
    onEnterKey();
  };

  return (
    <Modal show={show} onHide={onClose} centered onKeyDown={handleKeyDown}>
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="upload-section">
          <div className="upload-section-header">
            <div>{headerContent}</div>
            {downloadAction}
          </div>
          {children}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button type="button" className="btn-neutral btn-outlined" onClick={onClose} disabled={closeDisabled}>
          <i className="pi pi-times" aria-hidden="true" />
          {closeLabel}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
