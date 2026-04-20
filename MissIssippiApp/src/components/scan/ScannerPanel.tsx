import { AutoComplete } from "primereact/autocomplete";
import { ProgressSpinner } from "primereact/progressspinner";
import type { SkuLookupResult } from "../../utils/SkuInterfaces";

type ScanMode = "add" | "remove" | null;
type ScanTrigger = "auto" | "manual";

type ScanStatus = {
  type: "idle" | "recognized" | "unrecognized";
  message?: string;
};

type ScannerPanelProps = {
  mode: ScanMode;
  trigger: ScanTrigger;
  skuInput: string;
  readyToMatch: boolean;
  lookupLoading: boolean;
  saving: boolean;
  instructionMessage: string;
  skuSuggestions: string[];
  onSearchSuggestions: (query: string) => void;
  onSelectMode: (next: "add" | "remove") => void;
  onToggleTrigger: (checked: boolean) => void;
  onInputChange: (value: string) => void;
  onEnter: () => void;
  onMatch: () => void;
  status: ScanStatus;
  preview: SkuLookupResult | null;
  showPreview: boolean;
};

const ScannerPanel = ({
  mode,
  trigger,
  skuInput,
  readyToMatch,
  lookupLoading,
  saving,
  skuSuggestions,
  onSearchSuggestions,
  onSelectMode,
  onToggleTrigger,
  onInputChange,
  onEnter,
  onMatch,
  status,
  preview,
  showPreview,
}: ScannerPanelProps) => (
  <div className="scan-step">
    <div className="scan-step__label">
      <div className="scan-step__icon">
        <i className="pi pi-barcode" aria-hidden="true" />
      </div>
      <div className="scan-step__title">Scanner</div>
      <div className="scan-step__desc">Choose Add or Remove, then scan or type a SKU to begin.</div>
    </div>

    <div className="scan-step__content">
      {/* Mode selection */}
      <div className="scan-mode-btn-group">
        <button
          type="button"
          className={`scan-mode-btn scan-mode-btn--add${mode === "add" ? " scan-mode-btn--active-add" : ""}`}
          onClick={() => onSelectMode("add")}
        >
          + Add Inventory
        </button>
        <button
          type="button"
          className={`scan-mode-btn scan-mode-btn--remove${mode === "remove" ? " scan-mode-btn--active-remove" : ""}`}
          onClick={() => onSelectMode("remove")}
        >
          &minus; Remove Inventory
        </button>
      </div>

      {/* SKU input */}
      <div className="scan-sku-row">
        <div className="scan-sku-input-row">
          {trigger === "manual" ? (
            <AutoComplete
              value={skuInput}
              suggestions={skuSuggestions}
              completeMethod={(e) => onSearchSuggestions(e.query)}
              onChange={(e) => onInputChange(String(e.value ?? ""))}
              onKeyUp={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onEnter();
                }
              }}
              placeholder="Scan or enter SKU..."
              disabled={!mode || saving}
              minLength={2}
              delay={250}
              scrollHeight="320px"
              className="flex-1"
              inputClassName="scan-sku-input"
            />
          ) : (
            <input
              value={skuInput}
              placeholder="Scan or enter SKU..."
              className="scan-sku-input"
              disabled={!mode || saving}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onEnter();
                }
              }}
            />
          )}
          {readyToMatch && !lookupLoading ? (
            <button
              type="button"
              className="scan-sku-ready-btn"
              onClick={onMatch}
              disabled={saving}
              aria-label="Match SKU"
              title="Match SKU"
            >
              <i className="pi pi-check" aria-hidden="true" />
              Match
            </button>
          ) : null}
          {lookupLoading ? (
            <ProgressSpinner className="spinner-sm" strokeWidth="6" />
          ) : null}
        </div>
      </div>

      {/* Auto / Manual segmented control */}
      <div className="scan-auto-row">
        <span className="pt-text-label">Mode</span>
        <div className="inventory-view-switch">
          <button
            type="button"
            className={`inventory-view-switch-track${trigger === "auto" ? " inventory-view-switch-track--active" : ""}`}
            onClick={() => onToggleTrigger(false)}
            disabled={!mode}
          >
            Auto-scan
          </button>
          <button
            type="button"
            className={`inventory-view-switch-track${trigger === "manual" ? " inventory-view-switch-track--active" : ""}`}
            onClick={() => onToggleTrigger(true)}
            disabled={!mode}
          >
            Manual
          </button>
        </div>
      </div>

      {/* Scan status */}
      {status.type !== "idle" ? (
        <div className={`scan-status-row ${status.type}`}>
          {status.message}
        </div>
      ) : null}

      {/* SKU preview (recognized item) */}
      {showPreview && preview ? (
        <div className="scan-preview-zone">
          {preview.imageUrl ? (
            <img
              src={preview.imageUrl}
              alt={preview.sku}
              className="scan-preview-image"
            />
          ) : null}
        </div>
      ) : null}
    </div>
  </div>
);

export default ScannerPanel;
