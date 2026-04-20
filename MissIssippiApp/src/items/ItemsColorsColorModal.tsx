import type { KeyboardEvent } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputSwitch } from "primereact/inputswitch";
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
    <Dialog
      visible={show}
      onHide={onClose}
      header={activeItemLabel}
      footer={
        <>
          <Button type="button" className="btn-neutral btn-outlined" onClick={onClose} unstyled>
            <i className="pi pi-times" aria-hidden="true" />
            Close
          </Button>
          <Button
            type="button"
            className="btn-success"
            onClick={onSave}
            disabled={saveDisabled}
            unstyled
          >
            <i className="pi pi-save" aria-hidden="true" />
            {saving ? "Saving..." : "Save Colors"}
          </Button>
        </>
      }
      modal
      closable
      draggable={false}
      resizable={false}
      className="items-colors-modal"
    >
      <div onKeyDown={handleKeyDown}>
      <div className="pt-text-desc">
        {isLocked ? "Save the style before adding colors." : "Add colors and save to link them to this style."}
      </div>
      <div className="item-color-form-row">
        <div>
          <label className="pt-text-label">Color name</label>
          <input
            className="pt-form-input"
            value={colorInput}
            onChange={(e) => onColorInputChange(e.target.value)}
            disabled={isLocked}
            placeholder={isLocked ? "Save a style first" : "Enter color name"}
          />
        </div>
        <div>
          <label className="pt-text-label">Collection</label>
          <select
            className="pt-form-select"
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
          </select>
        </div>
        <div>
          <label className="pt-text-label">Pantone</label>
          <input
            className="pt-form-input"
            value={colorPantoneInput}
            onChange={(e) => onPantoneChange(e.target.value)}
            disabled={isLocked}
            placeholder="Optional"
          />
        </div>
        <div>
          <label className="pt-text-label">Hex</label>
          <input
            className="pt-form-input"
            value={colorHexInput}
            onChange={(e) => onHexChange(e.target.value)}
            disabled={isLocked}
            placeholder="#1A2B3C"
          />
        </div>
        <div>
          <Button
            type="button"
            className="btn-primary btn-outlined"
            onClick={onAddColor}
            disabled={!canAdd}
            unstyled
          >
            <i className="pi pi-plus" aria-hidden="true" />
            Add
          </Button>
        </div>
      </div>

      {pendingColors.length === 0 ? (
        <div className="pt-text-desc">No colors added yet.</div>
      ) : (
        <div className="color-modal-pending-section">
          <div className="pt-form-hint">Colors queued for this style:</div>
          <div className="pt-action-row">
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

      <div className="color-modal-current-section">
        <div className="pt-form-hint">Current colors:</div>
        <div className="pt-flex-column">
          {currentColors.length === 0 ? (
            <span className="text-muted">No colors linked yet.</span>
          ) : (
            <>
              <div className="pt-flex-row text-muted small">
                <span className="flex-grow-1">Color</span>
                <span>Active</span>
              </div>
              {currentColors.map((color) => (
                <div key={`current-${color.itemColorId}`} className="pt-flex-row">
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
                  <InputSwitch
                    inputId={`color-active-${color.itemColorId}`}
                    checked={color.itemColorActive !== false}
                    onChange={(e) => onToggleActive(color.itemColorId, e.value)}
                  />
                  <label htmlFor={`color-active-${color.itemColorId}`}>Active</label>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
      </div>
    </Dialog>
  );
}
