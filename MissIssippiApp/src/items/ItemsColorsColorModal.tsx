import type { KeyboardEvent } from "react";
import { Button, Col, Form, Modal, Row } from "react-bootstrap";
import type { PendingColor } from "./itemsColorsTypes";
import type { CollectionOption } from "../service/CatalogService";
import { shouldSubmitOnEnter } from "../utils/modalKeyHandlers";

type ColorSummary = {
  itemColorId: number;
  colorId: number;
  colorName: string;
  hexValue?: string | null;
  itemColorActive?: boolean | null;
};

type ItemsColorsColorModalForm = {
  collections: CollectionOption[];
  colorInput: string;
  colorCollectionInput: string;
  colorPantoneInput: string;
  colorHexInput: string;
  onColorInputChange: (value: string) => void;
  onCollectionChange: (value: string) => void;
  onPantoneChange: (value: string) => void;
  onHexChange: (value: string) => void;
};

type ItemsColorsColorModalState = {
  show: boolean;
  activeItemLabel: string;
  isLocked: boolean;
  pendingColors: PendingColor[];
  currentColors: ColorSummary[];
  saving: boolean;
  getReadableTextColor: (hex?: string | null) => string | undefined;
};

type ItemsColorsColorModalActions = {
  onClose: () => void;
  onSave: () => void;
  onAddColor: () => void;
  onRemovePending: (normalized: string) => void;
  onToggleActive: (itemColorId: number, nextActive: boolean) => void;
};

interface ItemsColorsColorModalProps {
  form: ItemsColorsColorModalForm;
  state: ItemsColorsColorModalState;
  actions: ItemsColorsColorModalActions;
}

export default function ItemsColorsColorModal({
  form,
  state,
  actions,
}: ItemsColorsColorModalProps) {
  const {
    show,
    activeItemLabel,
    isLocked,
    pendingColors,
    currentColors,
    saving,
    getReadableTextColor,
  } = state;
  const {
    collections,
    colorInput,
    colorCollectionInput,
    colorPantoneInput,
    colorHexInput,
    onColorInputChange,
    onCollectionChange,
    onPantoneChange,
    onHexChange,
  } = form;
  const { onClose, onSave, onAddColor, onRemovePending, onToggleActive } = actions;
  const collectionOptions = [...collections].sort((a, b) =>
    a.collectionName.localeCompare(b.collectionName)
  );
  const canAdd = Boolean(colorInput.trim() && colorCollectionInput && !isLocked);
  const saveDisabled = isLocked || pendingColors.length === 0 || saving;

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (saveDisabled) return;
    if (!shouldSubmitOnEnter(event)) return;
    event.preventDefault();
    onSave();
  };

  return (
    <Modal
      show={show}
      onHide={onClose}
      centered
      size="lg"
      className="items-colors-modal"
      onKeyDown={handleKeyDown}
    >
      <Modal.Header closeButton>
        <Modal.Title>{activeItemLabel}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="text-muted mb-3">
          {isLocked ? "Save the style before adding colors." : "Add colors and save to link them to this style."}
        </div>
        <Row className="gy-3 align-items-end">
          <Col md={3}>
            <Form.Label>Color name</Form.Label>
            <Form.Control
              value={colorInput}
              onChange={(e) => onColorInputChange(e.target.value)}
              disabled={isLocked}
              placeholder={isLocked ? "Save a style first" : "Enter color name"}
            />
          </Col>
          <Col md={3}>
            <Form.Label>Collection</Form.Label>
            <Form.Select
              value={colorCollectionInput}
              onChange={(e) => onCollectionChange(e.target.value)}
              disabled={isLocked}
            >
              <option value="">{isLocked ? "Save a style first" : "Select collection"}</option>
              {collectionOptions.map((collection) => (
                <option key={collection.collectionId} value={collection.collectionName}>
                  {collection.collectionName}
                </option>
              ))}
            </Form.Select>
          </Col>
          <Col md={2}>
            <Form.Label>Pantone</Form.Label>
            <Form.Control
              value={colorPantoneInput}
              onChange={(e) => onPantoneChange(e.target.value)}
              disabled={isLocked}
              placeholder="Optional"
            />
          </Col>
          <Col md={2}>
            <Form.Label>Hex</Form.Label>
            <Form.Control
              value={colorHexInput}
              onChange={(e) => onHexChange(e.target.value)}
              disabled={isLocked}
              placeholder="#1A2B3C"
            />
          </Col>
          <Col md={2} className="d-grid">
            <Button
              type="button"
              className="btn-primary btn-outlined"
              onClick={onAddColor}
              disabled={!canAdd}
            >
              <i className="pi pi-plus" aria-hidden="true" />
              Add
            </Button>
          </Col>
        </Row>

        {pendingColors.length === 0 ? (
          <div className="text-muted mt-3">No colors added yet.</div>
        ) : (
          <div className="mt-3">
            <div className="text-muted mb-2">Colors queued for this style:</div>
            <div className="d-flex flex-wrap gap-2">
              {pendingColors.map((color) => (
                <span
                  key={color.normalized}
                  className="badge bg-light text-dark border d-inline-flex align-items-center gap-2"
                >
                  {color.name}
                  {color.pantoneColor ? ` - ${color.pantoneColor}` : ""}
                  {color.hexValue ? ` - ${color.hexValue}` : ""}
                  <button
                    type="button"
                    className="btn-danger btn-text"
                    onClick={() => onRemovePending(color.normalized)}
                  >
                    <i className="pi pi-trash" aria-hidden="true" />
                    Remove
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4">
          <div className="text-muted mb-2">Current colors:</div>
          <div className="d-flex flex-column gap-2">
            {currentColors.length === 0 ? (
              <span className="text-muted">No colors linked yet.</span>
            ) : (
              <>
                <div className="d-flex align-items-center text-muted small">
                  <span className="flex-grow-1">Color</span>
                  <span>Active</span>
                </div>
                {currentColors.map((color) => (
                  <div key={`current-${color.itemColorId}`} className="d-flex align-items-center gap-2 flex-wrap">
                    <span
                      className={`item-color-rect${color.hexValue ? " has-hex" : ""}${
                        color.itemColorActive === false ? " opacity-50" : ""
                      }`}
                      style={
                        color.hexValue
                          ? { backgroundColor: color.hexValue, color: getReadableTextColor(color.hexValue) }
                          : undefined
                      }
                    >
                      {color.colorName}
                    </span>
                    <Form.Check
                      type="switch"
                      id={`color-active-${color.itemColorId}`}
                      label="Active"
                      checked={color.itemColorActive !== false}
                      onChange={(e) => onToggleActive(color.itemColorId, e.target.checked)}
                    />
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer className="justify-content-between">
        <Button type="button" className="btn-neutral btn-outlined" onClick={onClose}>
          <i className="pi pi-times" aria-hidden="true" />
          Close
        </Button>
        <Button
          type="button"
          className="btn-success"
          onClick={onSave}
          disabled={saveDisabled}
        >
          <i className="pi pi-save" aria-hidden="true" />
          {saving ? "Saving..." : "Save Colors"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
