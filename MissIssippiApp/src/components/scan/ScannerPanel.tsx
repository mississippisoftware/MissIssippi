import { AutoComplete } from "primereact/autocomplete";
import { Button, Card, Col, Form, Row } from "react-bootstrap";
import { ProgressSpinner } from "primereact/progressspinner";
import ViewToggle from "../ViewToggle";
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
  instructionMessage,
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
  <Row className="gx-3 gy-4 align-items-start">
    <Col lg={3} className="scan-section-aside">
      <div className="scan-section-info">
        <div className="scan-section-title">
          <span className="scan-section-icon scan-icon-green">
            <i className="pi pi-barcode" aria-hidden="true" />
          </span>
          <h5>Scanner</h5>
        </div>
        <p className="text-muted mb-0">{instructionMessage}</p>
      </div>
    </Col>
    <Col lg={9}>
      <Card className="scan-section-card">
        <Card.Body>
          <Row className="g-3 align-items-stretch">
            <Col md={7} className="scan-card-left">
              <div className="sku-scan-controls">
                <div className="sku-scan-toggle-group">
                  <Button
                    type="button"
                    className={`btn-mode btn-success ${mode === "add" ? "" : "btn-outlined"}`}
                    onClick={() => onSelectMode("add")}
                  >
                    <i className="pi pi-plus" aria-hidden="true" />
                    Add Inventory
                  </Button>
                  <Button
                    type="button"
                    className={`btn-mode btn-danger ${mode === "remove" ? "" : "btn-outlined"}`}
                    onClick={() => onSelectMode("remove")}
                  >
                    <i className="pi pi-trash" aria-hidden="true" />
                    Remove Inventory
                  </Button>
                </div>

                <div className="sku-scan-input-wrapper">
                  <div className="sku-scan-input-row">
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
                        placeholder="Scan or enter SKU"
                        disabled={!mode || saving}
                        minLength={2}
                        delay={250}
                        scrollHeight="320px"
                        className="sku-scan-autocomplete"
                        inputClassName={`sku-scan-input ${readyToMatch ? "has-ready" : ""}`}
                      />
                    ) : (
                      <Form.Control
                        value={skuInput}
                        placeholder="Scan or enter SKU"
                        className={`sku-scan-input ${readyToMatch ? "has-ready" : ""}`}
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
                        className="sku-scan-ready-button"
                        onClick={onMatch}
                        disabled={saving}
                        aria-label="Match SKU"
                        title="Match SKU"
                      >
                        <i className="pi pi-check" aria-hidden="true" />
                      </button>
                    ) : null}
                  </div>
                  {lookupLoading ? (
                    <div className="sku-scan-loading">
                      <ProgressSpinner style={{ width: "28px", height: "28px" }} strokeWidth="6" />
                    </div>
                  ) : null}
                </div>

                <div className="sku-scan-trigger-toggle">
                  <ViewToggle
                    ariaLabel="Scan trigger"
                    leftLabel="Auto-scan"
                    rightLabel="Manual"
                    leftActive={trigger === "auto"}
                    rightActive={trigger === "manual"}
                    checked={trigger === "manual"}
                    switchAriaLabel="Toggle scan trigger"
                    disabled={!mode}
                    onToggle={onToggleTrigger}
                  />
                </div>

                {status.type !== "idle" && (
                  <div className={`sku-scan-status ${status.type}`}>
                    {status.type === "recognized" && status.message}
                    {status.type === "unrecognized" && status.message}
                  </div>
                )}
              </div>
            </Col>
            <Col md={5} className="scan-card-right">
              <Card className={`sku-scan-preview-card ${showPreview ? "" : "is-hidden"}`}>
                <Card.Body className="p-0">
                  {preview?.imageUrl ? (
                    <img src={preview.imageUrl} alt={preview.sku} className="sku-scan-preview-image" />
                  ) : (
                    <div className="sku-scan-preview-placeholder">No Image Available</div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </Col>
  </Row>
);

export default ScannerPanel;
