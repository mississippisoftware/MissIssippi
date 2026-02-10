import { Button, Form, Modal } from "react-bootstrap";
import type { ColorReviewItem } from "./itemsColorsTypes";

interface ItemsColorsColorReviewModalProps {
  show: boolean;
  items: ColorReviewItem[];
  onChoiceChange: (normalized: string, choice: "new" | number) => void;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ItemsColorsColorReviewModal({
  show,
  items,
  onChoiceChange,
  onClose,
  onConfirm,
}: ItemsColorsColorReviewModalProps) {
  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Similar colors found</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="text-muted">
          These colors look similar to existing names. Choose to reuse an existing color or add a new one.
        </p>
        {items.map((item) => (
          <Form.Group className="mb-3" key={item.normalized}>
            <Form.Label>Color: {item.inputName}</Form.Label>
            <Form.Select
              value={item.choice}
              onChange={(e) => {
                const value = e.target.value === "new" ? "new" : Number(e.target.value);
                onChoiceChange(item.normalized, value);
              }}
            >
              <option value="new">Create new "{item.inputName}"</option>
              {item.suggestions.map((suggestion) => (
                <option key={suggestion.colorId} value={suggestion.colorId}>
                  Use existing: {suggestion.colorName}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        ))}
      </Modal.Body>
      <Modal.Footer>
        <Button type="button" className="portal-btn portal-btn-outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="button" className="portal-btn scan-action-save" onClick={onConfirm}>
          Continue
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
