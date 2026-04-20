import type { KeyboardEvent, ReactNode } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
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
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!onEnterKey || enterDisabled) return;
    if (!shouldSubmitOnEnter(event)) return;
    event.preventDefault();
    onEnterKey();
  };

  const footer = (
    <Button type="button" className="btn-neutral btn-outlined" onClick={onClose} disabled={closeDisabled} unstyled>
      <i className="pi pi-times" aria-hidden="true" />
      {closeLabel}
    </Button>
  );

  return (
    <Dialog
      visible={show}
      onHide={onClose}
      header={title}
      footer={footer}
      modal
      closable
      draggable={false}
      resizable={false}
    >
      <div onKeyDown={handleKeyDown}>
        <div className="upload-section">
          <div className="upload-section-header">
            <div>{headerContent}</div>
            {downloadAction}
          </div>
          {children}
        </div>
      </div>
    </Dialog>
  );
}
