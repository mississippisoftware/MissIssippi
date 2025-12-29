import { useMemo } from "react";
import { MultiSelect } from "primereact/multiselect";
import { Button } from "primereact/button";
import type { iInventoryDisplayRow } from "../utils/DataInterfaces";
import { inventoryFieldLabels } from "../utils/LabelMap"

interface SearchPanelProps {
  inventory: iInventoryDisplayRow[];
  filters: Record<string, string[]>;
  setFilters: (filters: Record<string, string[]>) => void;
  fields: (keyof iInventoryDisplayRow)[];
}

export default function SearchPanel({ inventory, filters, setFilters, fields }: SearchPanelProps) {

  const allOptions = useMemo(() => {
    if (!inventory || inventory.length === 0) return {};

    const options: Record<string, { label: string; value: string }[]> = {};
    fields.forEach((key) => {
      const uniqueValues = Array.from(
        new Set(inventory.map((i) => String(i[key] ?? "")))
      );
      options[key] = uniqueValues.map((v) => ({ label: v || "N/A", value: v }));
    });
    return options;
  }, [inventory, fields]);


  return (
    <div style={{ height: "100%" }}>
      <div
        className="p-fluid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "1rem",
          height: "100%",
        }}
      >
        {Object.keys(allOptions).map((key) => (
          <div key={key}>
            <label htmlFor={key}>{inventoryFieldLabels[key] ?? key}</label>
            <MultiSelect
              inputId={key}
              value={filters[key] || []}
              options={allOptions[key]}
              onChange={(e) => {
                const newFilters = { ...filters, [key]: e.value };
                setFilters(newFilters);
              }}
              placeholder={`Select ${inventoryFieldLabels[key] ?? key}`}
              display="chip"
              className="w-full"
            />
          </div>
        ))}
        <div style={{ alignSelf: "end" }}>
          <Button
            label="Clear Filters"
            icon="pi pi-filter-slash"
            onClick={() => setFilters({})}
          />
        </div>
      </div>
    </div>
  );
}