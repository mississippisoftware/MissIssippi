import type { ReactNode } from "react";
import PageFiltersBar from "./PageFiltersBar";
import type { InventorySearchFilters } from "../utils/InventorySearchFilters";

type SearchFieldKey = "description" | "colorName" | "seasonName";

const filterFields: Array<{ key: SearchFieldKey; label: string }> = [
  { key: "seasonName", label: "Season" },
  { key: "description", label: "Description" },
  { key: "colorName", label: "Color" },
];

interface InventorySearchFiltersProps {
  filters: InventorySearchFilters;
  seasons: Array<{ seasonId: number; seasonName: string }>;
  searching: boolean;
  showAdvanced: boolean;
  onChange: (filters: InventorySearchFilters) => void;
  onSubmit: (filters: InventorySearchFilters) => void;
  onClear: () => void;
  onToggleAdvanced: () => void;
  advancedFiltersExtra?: ReactNode;
  /** Passed through to PageFiltersBar chipsSlot — renders inline in the filter row. */
  chipsSlot?: ReactNode;
}

export default function InventorySearchFiltersForm({
  filters,
  seasons,
  searching,
  showAdvanced,
  onChange,
  onSubmit,
  onClear,
  onToggleAdvanced,
  advancedFiltersExtra,
  chipsSlot,
}: InventorySearchFiltersProps) {
  const updateField = (key: SearchFieldKey, value: string) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <PageFiltersBar
      searchLabel=""
      searchPlaceholder="Quick search"
      searchValue={filters.itemNumber ?? ""}
      onSearchChange={(value) => onChange({ ...filters, itemNumber: value })}
      onApply={() => onSubmit(filters)}
      applying={searching}
      onClearFilters={onClear}
      clearLabel="Clear Filters"
      showAdvanced={showAdvanced}
      onToggleAdvanced={onToggleAdvanced}
      chipsSlot={chipsSlot}
      advancedFilters={
        <div className="page-filters-advanced-grid">
          {filterFields.map((field) => (
            <div key={field.key} className="page-filter-field">
              <label className="page-filters-label">{field.label}</label>
              {field.key === "seasonName" ? (
                <select
                  value={filters[field.key] ?? ""}
                  onChange={(e) => updateField(field.key, e.target.value)}
                  aria-label={field.label}
                  className="pt-form-select"
                >
                  <option value="">{field.label}</option>
                  {seasons.map((season) => (
                    <option key={season.seasonId} value={season.seasonName}>
                      {season.seasonName}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={filters[field.key] ?? ""}
                  onChange={(e) => updateField(field.key, e.target.value)}
                  placeholder={field.label}
                  aria-label={field.label}
                  className="pt-form-input"
                />
              )}
            </div>
          ))}
          {advancedFiltersExtra}
        </div>
      }
    />
  );
}
