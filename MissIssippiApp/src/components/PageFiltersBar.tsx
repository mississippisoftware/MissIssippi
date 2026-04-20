import type { ReactNode } from "react";
import { Button } from "primereact/button";

type PageFiltersBarProps = {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  searchLabel?: string;
  onApply?: () => void;
  applyLabel?: string;
  applying?: boolean;
  quickFilters?: ReactNode;
  showAdvanced?: boolean;
  onToggleAdvanced?: () => void;
  advancedFilters?: ReactNode;
  onClearFilters?: () => void;
  clearLabel?: string;
  /** Rendered inline in the filter row (e.g. active-filter chips). */
  chipsSlot?: ReactNode;
  className?: string;
};

export default function PageFiltersBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search",
  searchLabel = "Search",
  onApply,
  applying = false,
  quickFilters,
  showAdvanced = false,
  onToggleAdvanced,
  advancedFilters,
  onClearFilters,
  clearLabel = "Clear Filters",
  chipsSlot,
  className,
}: PageFiltersBarProps) {
  const hasAdvanced = Boolean(advancedFilters);
  const hasSearchLabel = Boolean(searchLabel?.trim());

  return (
    <div className={`page-filters-shell${className ? ` ${className}` : ""}`}>
      <div className="page-filters-row">
        <div className="page-filters-search">
          {hasSearchLabel ? <label className="page-filters-label">{searchLabel}</label> : null}
          <input
            type="search"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchLabel || "Search"}
            className="pt-form-input"
            onKeyDown={(event) => {
              if (event.key !== "Enter") return;
              event.preventDefault();
              onApply?.();
            }}
          />
        </div>

        {chipsSlot ? <div className="page-filters-chips-inline">{chipsSlot}</div> : null}

        {quickFilters ? <div className="page-filters-quick">{quickFilters}</div> : null}

        <div className="page-filters-actions">
          {hasAdvanced && onToggleAdvanced ? (
            <Button
              type="button"
              className="btn-neutral btn-text"
              onClick={onToggleAdvanced}
              unstyled
            >
              <i className={`pi ${showAdvanced ? "pi-angle-up" : "pi-angle-down"}`} aria-hidden="true" />
              More
            </Button>
          ) : null}
          {onClearFilters ? (
            <Button
              type="button"
              className="btn-neutral btn-text"
              onClick={onClearFilters}
              unstyled
            >
              <i className="pi pi-filter-slash" aria-hidden="true" />
              {clearLabel}
            </Button>
          ) : null}
        </div>
      </div>

      {hasAdvanced && showAdvanced ? (
        <div className="page-filters-advanced">{advancedFilters}</div>
      ) : null}
    </div>
  );
}
