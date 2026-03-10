import { type KeyboardEvent, useEffect, useMemo, useState } from "react";
import { Alert, Button, Form, Modal } from "react-bootstrap";
import type { ColorReviewItem } from "./itemsColorsTypes";
import type { CollectionOption, ColorOption } from "../service/CatalogService";
import { shouldSubmitOnEnter } from "../utils/modalKeyHandlers";

interface ItemsColorsColorReviewModalProps {
  show: boolean;
  items: ColorReviewItem[];
  collections: CollectionOption[];
  allColors: ColorOption[];
  onChoiceChange: (normalized: string, choice: "new" | "skip" | number) => void;
  onNameChange: (normalized: string, value: string) => void;
  onCollectionChange: (normalized: string, value: string) => void;
  onRememberChange: (normalized: string, value: boolean) => void;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ItemsColorsColorReviewModal({
  show,
  items,
  collections,
  allColors,
  onChoiceChange,
  onNameChange,
  onCollectionChange,
  onRememberChange,
  onClose,
  onConfirm,
}: ItemsColorsColorReviewModalProps) {
  const collectionOptions = [...collections].sort((a, b) =>
    a.collectionName.localeCompare(b.collectionName)
  );
  const allColorOptions = useMemo(
    () => [...allColors].sort((a, b) => a.colorName.localeCompare(b.colorName)),
    [allColors]
  );
  const formatColorOption = (color: ColorOption) =>
    color.collection ? `${color.colorName} (${color.collection})` : color.colorName;
  const hasInvalidNew = items.some(
    (item) => item.choice === "new" && (!item.resolvedName.trim() || !item.collection)
  );
  const [showValidationAlert, setShowValidationAlert] = useState(false);
  const [showValidation, setShowValidation] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect -- Reset validation flags when inputs or modal state change. */
  useEffect(() => {
    if (!hasInvalidNew) {
      setShowValidation(false);
      setShowValidationAlert(false);
    }
  }, [hasInvalidNew]);

  useEffect(() => {
    if (!show) {
      setShowValidation(false);
      setShowValidationAlert(false);
    }
  }, [show]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleContinue = () => {
    if (hasInvalidNew) {
      setShowValidation(true);
      setShowValidationAlert(true);
      return;
    }
    onConfirm();
  };

  return (
    <Modal
      show={show}
      onHide={onClose}
      centered
      className="items-colors-modal"
      onKeyDown={(event: KeyboardEvent<HTMLElement>) => {
        if (!shouldSubmitOnEnter(event)) return;
        event.preventDefault();
        handleContinue();
      }}
    >
      <Modal.Header closeButton>
        <Modal.Title>Review colors</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="text-muted">Review the colors below, choose existing matches, or create new ones.</p>
        {items.map((item) => (
          <Form.Group className="mb-3" key={item.normalized}>
            <Form.Label>Color: {item.inputName}</Form.Label>
            {item.sourceItems && item.sourceItems.length > 0 && (
              <div className="text-muted small mb-1">Styles: {item.sourceItems.join(", ")}</div>
            )}
            {(() => {
              const selectedExisting =
                typeof item.choice === "number"
                  ? item.suggestions.find((suggestion) => suggestion.colorId === item.choice) ??
                    allColorOptions.find((color) => color.colorId === item.choice)
                  : null;
              const missingSelected =
                selectedExisting &&
                !item.suggestions.some((suggestion) => suggestion.colorId === selectedExisting.colorId);
              return (
                <>
                  <Form.Select
                    value={
                      item.choice === "new" || item.choice === "skip"
                        ? item.choice
                        : String(item.choice)
                    }
                    onChange={(e) => {
                      const nextValue =
                        e.target.value === "new"
                          ? "new"
                          : e.target.value === "skip"
                            ? "skip"
                            : Number(e.target.value);
                      onChoiceChange(item.normalized, nextValue);
                    }}
                  >
                    <option value="new">Create new "{item.inputName}"</option>
                    <option value="skip">Remove from list</option>
                    {missingSelected && selectedExisting && (
                      <option value={selectedExisting.colorId}>
                        Use existing: {formatColorOption(selectedExisting)}
                      </option>
                    )}
                    {item.suggestions.map((suggestion) => (
                      <option key={suggestion.colorId} value={suggestion.colorId}>
                        Use existing: {suggestion.colorName}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Select
                    value={typeof item.choice === "number" ? String(item.choice) : ""}
                    onChange={(e) => {
                      const nextId = Number(e.target.value);
                      if (!Number.isFinite(nextId) || nextId <= 0) return;
                      onChoiceChange(item.normalized, nextId);
                    }}
                    className="mt-2"
                  >
                    <option value="">Choose another existing color</option>
                    {allColorOptions.map((option) => (
                      <option key={option.colorId} value={option.colorId}>
                        {formatColorOption(option)}
                      </option>
                    ))}
                  </Form.Select>
                </>
              );
            })()}
            {item.choice !== "skip" && (
              <Form.Check
                type="checkbox"
                id={`remember-${item.normalized}`}
                className="mt-2"
                label="Remember this choice"
                checked={item.remember ?? false}
                onChange={(e) => onRememberChange(item.normalized, e.target.checked)}
              />
            )}
            {item.choice === "new" && (
              <div className="mt-2 d-flex flex-column gap-2">
                <Form.Control
                  value={item.resolvedName}
                  onChange={(e) => onNameChange(item.normalized, e.target.value)}
                  placeholder="New color name"
                  isInvalid={showValidation && !item.resolvedName.trim()}
                />
                <Form.Select
                  value={item.collection}
                  onChange={(e) => onCollectionChange(item.normalized, e.target.value)}
                  isInvalid={showValidation && !item.collection}
                >
                  <option value="">Select collection</option>
                  {collectionOptions.map((option) => (
                    <option key={option.collectionId} value={option.collectionName}>
                      {option.collectionName}
                    </option>
                  ))}
                </Form.Select>
              </div>
            )}
          </Form.Group>
        ))}
        {hasInvalidNew && (
          <Alert
            variant="warning"
            dismissible
            show={showValidationAlert}
            onClose={() => setShowValidationAlert(false)}
            className="py-2"
          >
            Collection and name are required for new colors.
            <div className="text-end mt-2">
              <Button
                type="button"
                className="btn-neutral btn-outlined"
                onClick={() => setShowValidationAlert(false)}
              >
                <i className="pi pi-check" aria-hidden="true" />
                OK
              </Button>
            </div>
          </Alert>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button type="button" className="btn-neutral btn-outlined" onClick={onClose}>
          <i className="pi pi-times" aria-hidden="true" />
          Cancel
        </Button>
        <Button type="button" className="btn-success" onClick={handleContinue}>
          <i className="pi pi-check" aria-hidden="true" />
          Continue
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
