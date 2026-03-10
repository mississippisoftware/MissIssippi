import { type FormEvent } from "react";
import { Button, Form } from "react-bootstrap";
import { InputText } from "primereact/inputtext";
import type { InventorySearchFilters } from "../utils/InventorySearchFilters";

type SearchFieldKey = "itemNumber" | "description" | "colorName" | "seasonName";

const filterFields: Array<{ key: SearchFieldKey; label: string }> = [
  { key: "seasonName", label: "Season" },
  { key: "itemNumber", label: "Style Number" },
  { key: "description", label: "Description" },
  { key: "colorName", label: "Color" },
];

interface InventorySearchFiltersProps {
  filters: InventorySearchFilters;
  seasons: Array<{ seasonId: number; seasonName: string }>;
  searching: boolean;
  onChange: (filters: InventorySearchFilters) => void;
  onSubmit: (filters: InventorySearchFilters) => void;
  onClear: () => void;
}

export default function InventorySearchFiltersForm({
  filters,
  seasons,
  searching,
  onChange,
  onSubmit,
  onClear,
}: InventorySearchFiltersProps) {
  const updateField = (key: SearchFieldKey, value: string) => {
    onChange({ ...filters, [key]: value });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(filters);
  };

  return (
    <Form onSubmit={handleSubmit} className="inventory-search-form">
      <div className="inventory-search-fields">
        {filterFields.map((field) => (
          <div key={field.key} className="inventory-search-field-group">
            {field.key === "seasonName" ? (
              <Form.Select
                className="inventory-search-field"
                value={filters[field.key] ?? ""}
                onChange={(e) => updateField(field.key, e.target.value)}
                aria-label={field.label}
              >
                <option value="">{field.label}</option>
                {seasons.map((season) => (
                  <option key={season.seasonId} value={season.seasonName}>
                    {season.seasonName}
                  </option>
                ))}
              </Form.Select>
            ) : (
              <InputText
                className="inventory-search-field"
                value={filters[field.key] ?? ""}
                onChange={(e) => updateField(field.key, e.target.value)}
                placeholder={field.label}
                aria-label={field.label}
              />
            )}
          </div>
        ))}
      </div>
      <div className="inventory-search-actions">
        <Button type="submit" disabled={searching} className="btn-text">
          <i className="pi pi-search" aria-hidden="true" />
          {searching ? "Searching..." : "Search"}
        </Button>
        <Button type="button" onClick={onClear} className="btn-neutral btn-outlined">
          <i className="pi pi-filter-slash" aria-hidden="true" />
          Clear
        </Button>
      </div>
    </Form>
  );
}
