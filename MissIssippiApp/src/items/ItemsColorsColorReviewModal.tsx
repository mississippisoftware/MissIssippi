import { type KeyboardEvent, useEffect, useMemo, useState } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
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
    <Dialog
      visible={show}
      onHide={onClose}
      header="Review colors"
      footer={
        <>
          <Button type="button" className="btn-neutral btn-outlined" onClick={onClose} unstyled>
            <i className="pi pi-times" aria-hidden="true" />
            Cancel
          </Button>
          <Button type="button" className="btn-success" onClick={handleContinue} unstyled>
            <i className="pi pi-check" aria-hidden="true" />
            Continue
          </Button>
        </>
      }
      modal
      closable
      draggable={false}
      resizable={false}
      className="items-colors-modal"
      onKeyDown={(event: KeyboardEvent<HTMLElement>) => {
        if (!shouldSubmitOnEnter(event)) return;
        event.preventDefault();
        handleContinue();
      }}
    >
      <p className="text-muted">Review the colors below, choose existing matches, or create new ones.</p>
      {items.map((item) => (
        <div className="color-review-item" key={item.normalized}>
          <label className="pt-text-label">Color: {item.inputName}</label>
          {item.sourceItems && item.sourceItems.length > 0 && (
            <div className="pt-form-hint">Styles: {item.sourceItems.join(", ")}</div>
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
                <select
                  className="pt-form-select"
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
                </select>
                <select
                  className="pt-form-select mt-2"
                  value={typeof item.choice === "number" ? String(item.choice) : ""}
                  onChange={(e) => {
                    const nextId = Number(e.target.value);
                    if (!Number.isFinite(nextId) || nextId <= 0) return;
                    onChoiceChange(item.normalized, nextId);
                  }}
                >
                  <option value="">Choose another existing color</option>
                  {allColorOptions.map((option) => (
                    <option key={option.colorId} value={option.colorId}>
                      {formatColorOption(option)}
                    </option>
                  ))}
                </select>
              </>
            );
          })()}
          {item.choice !== "skip" && (
            <div className="pt-form-checkbox-group mt-2">
              <input
                type="checkbox"
                className="pt-form-checkbox"
                id={`remember-${item.normalized}`}
                checked={item.remember ?? false}
                onChange={(e) => onRememberChange(item.normalized, e.target.checked)}
              />
              <label className="pt-form-checkbox-label" htmlFor={`remember-${item.normalized}`}>
                Remember this choice
              </label>
            </div>
          )}
          {item.choice === "new" && (
            <div className="pt-flex-column mt-2">
              <input
                className={`pt-form-input${showValidation && !item.resolvedName.trim() ? " is-invalid" : ""}`}
                value={item.resolvedName}
                onChange={(e) => onNameChange(item.normalized, e.target.value)}
                placeholder="New color name"
              />
              <select
                className={`pt-form-select${showValidation && !item.collection ? " is-invalid" : ""}`}
                value={item.collection}
                onChange={(e) => onCollectionChange(item.normalized, e.target.value)}
              >
                <option value="">Select collection</option>
                {collectionOptions.map((option) => (
                  <option key={option.collectionId} value={option.collectionName}>
                    {option.collectionName}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      ))}
      {hasInvalidNew && showValidationAlert && (
        <div className="pt-alert pt-alert-warning" role="alert">
          Collection and name are required for new colors.
          <div className="pt-block-action-end pt-alert__footer">
            <Button
              type="button"
              className="btn-neutral btn-outlined"
              onClick={() => setShowValidationAlert(false)}
              unstyled
            >
              <i className="pi pi-check" aria-hidden="true" />
              OK
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
