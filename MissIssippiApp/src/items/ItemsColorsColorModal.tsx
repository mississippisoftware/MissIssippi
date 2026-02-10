import { Button, Col, Form, Modal, Row } from "react-bootstrap";
import type { PendingColor } from "./itemsColorsTypes";

type ColorSummary = {
  colorId: number;
  colorName: string;
  hexValue?: string | null;
};

interface ItemsColorsColorModalProps {
  show: boolean;
  onClose: () => void;
  onSave: () => void;
  onAddColor: () => void;
  onRemovePending: (normalized: string) => void;
  activeItemLabel: string;
  isLocked: boolean;
  pendingColors: PendingColor[];
  currentColors: ColorSummary[];
  colorInput: string;
  colorPantoneInput: string;
  colorHexInput: string;
  onColorInputChange: (value: string) => void;
  onPantoneChange: (value: string) => void;
  onHexChange: (value: string) => void;
  saving: boolean;
  getReadableTextColor: (hex?: string | null) => string | undefined;
}

export default function ItemsColorsColorModal({
  show,
  onClose,
  onSave,
  onAddColor,
  onRemovePending,
  activeItemLabel,
  isLocked,
  pendingColors,
  currentColors,
  colorInput,
  colorPantoneInput,
  colorHexInput,
  onColorInputChange,
  onPantoneChange,
  onHexChange,
  saving,
  getReadableTextColor,
}: ItemsColorsColorModalProps) {
  return (
    <Modal show={show} onHide={onClose} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>{activeItemLabel}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="text-muted mb-3">
          {isLocked ? "Save the style before adding colors." : "Add colors and save to link them to this style."}
        </div>
        <Row className="gy-3 align-items-end">
          <Col md={4}>
            <Form.Label>Color name</Form.Label>
            <Form.Control
              value={colorInput}
              onChange={(e) => onColorInputChange(e.target.value)}
              disabled={isLocked}
              placeholder={isLocked ? "Save a style first" : "Enter color name"}
            />
          </Col>
          <Col md={3}>
            <Form.Label>Pantone</Form.Label>
            <Form.Control
              value={colorPantoneInput}
              onChange={(e) => onPantoneChange(e.target.value)}
              disabled={isLocked}
              placeholder="Optional"
            />
          </Col>
          <Col md={3}>
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
              className="portal-btn portal-btn-outline"
              onClick={onAddColor}
              disabled={isLocked || !colorInput.trim()}
            >
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
                <span key={color.normalized} className="badge bg-light text-dark border">
                  {color.name}
                  {color.pantoneColor ? ` - ${color.pantoneColor}` : ""}
                  {color.hexValue ? ` - ${color.hexValue}` : ""}
                  <button
                    type="button"
                    className="btn btn-link btn-sm ms-2 p-0"
                    onClick={() => onRemovePending(color.normalized)}
                  >
                    Remove
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4">
          <div className="text-muted mb-2">Current colors:</div>
          <div className="d-flex flex-wrap gap-2">
            {currentColors.length === 0 ? (
              <span className="text-muted">No colors linked yet.</span>
            ) : (
              currentColors.map((color) => (
                <span
                  key={`current-${color.colorId}`}
                  className={`item-color-rect${color.hexValue ? " has-hex" : ""}`}
                  style={
                    color.hexValue
                      ? { backgroundColor: color.hexValue, color: getReadableTextColor(color.hexValue) }
                      : undefined
                  }
                >
                  {color.colorName}
                </span>
              ))
            )}
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer className="justify-content-between">
        <Button type="button" className="portal-btn portal-btn-outline" onClick={onClose}>
          Close
        </Button>
        <Button
          type="button"
          className="portal-btn scan-action-save"
          onClick={onSave}
          disabled={isLocked || pendingColors.length === 0 || saving}
        >
          {saving ? "Saving..." : "Save Colors"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
