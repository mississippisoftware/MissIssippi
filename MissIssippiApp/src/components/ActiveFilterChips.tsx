import { Button } from "primereact/button";

export type ActiveFilterChip = {
  key: string;
  label: string;
  value: string;
  onRemove?: () => void;
};

type ActiveFilterChipsProps = {
  chips: ActiveFilterChip[];
  onClearAll?: () => void;
  clearLabel?: string;
  /** When true, renders as a compact inline group (no block wrapper padding).
   *  Use inside a filter row chipsSlot. */
  inline?: boolean;
  className?: string;
};

export default function ActiveFilterChips({
  chips,
  onClearAll,
  clearLabel = "Clear Filters",
  inline = false,
  className,
}: ActiveFilterChipsProps) {
  if (chips.length === 0) return null;

  const baseClass = inline ? "active-filter-chips active-filter-chips--inline" : "active-filter-chips";

  return (
    <div className={`${baseClass}${className ? ` ${className}` : ""}`}>
      <div className="active-filter-chip-list">
        {chips.map((chip) => (
          <span key={chip.key} className="active-filter-chip">
            <strong>{chip.label}:</strong> {chip.value}
            {chip.onRemove ? (
              <button
                type="button"
                className="active-filter-chip-remove"
                onClick={chip.onRemove}
                aria-label={`Remove ${chip.label} filter`}
              >
                <i className="pi pi-times" aria-hidden="true" />
              </button>
            ) : null}
          </span>
        ))}
      </div>
      {onClearAll ? (
        <Button type="button" className="btn-neutral btn-text" onClick={onClearAll} unstyled>
          <i className="pi pi-filter-slash" aria-hidden="true" />
          {clearLabel}
        </Button>
      ) : null}
    </div>
  );
}
