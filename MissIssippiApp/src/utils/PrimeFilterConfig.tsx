import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import type { DataTableFilterConstraint, DataTableFilterMeta, PrimeFilterMatchMode } from "./PrimeFilterTypes";

type SimpleFilterOptions = {
  value?: unknown;
  filterCallback: (value: unknown) => void;
};

type DropdownOption = {
  label: string;
  value: unknown;
};

type MultiRuleFilterOptions = {
  filterCallback: (constraints: DataTableFilterConstraint[], operator: DataTableFilterMeta["operator"]) => void;
  constraints?: DataTableFilterConstraint[];
  operator: DataTableFilterMeta["operator"];
};

type MultiRuleTextFilterProps = {
  value?: unknown;
  filterApplyCallback?: (value: unknown) => void;
};

export const stringMatchModes: Array<{ label: string; value: PrimeFilterMatchMode }> = [
  { label: "Starts With", value: "startsWith" },
  { label: "Contains", value: "contains" },
  { label: "Ends With", value: "endsWith" },
  { label: "Equals", value: "equals" },
];

// Generic Text Filter
export const textFilterTemplate = (placeholder: string) => (options: SimpleFilterOptions) => {
    const { value, filterCallback } = options;
    return (
        <div className="p-d-flex p-flex-column">
            <input
                type="text"
                value={typeof value === "string" || typeof value === "number" ? value : ""}
                onChange={(e) => filterCallback(e.target.value)}
                placeholder={placeholder}
                className="p-inputtext p-component p-mb-2"
            />
            <div className="p-d-flex p-jc-between">
                <Button
                    label="Apply"
                    icon="pi pi-search"
                    onClick={() => filterCallback(value)}
                    size="small"
                    className="btn-primary btn-outlined"
                />
                <Button
                    label="Clear"
                    icon="pi pi-filter-slash"
                    onClick={() => filterCallback("")}
                    size="small"
                    className="btn-text"
                />
            </div>
        </div>
    );
};

// Generic Numeric Filter
export const numericFilterTemplate = (placeholder: string) => (options: SimpleFilterOptions) => {
    const { value, filterCallback } = options;
    return (
        <div className="p-d-flex p-flex-column">
            <input
                type="number"
                value={typeof value === "string" || typeof value === "number" ? value : ""}
                onChange={(e) => filterCallback(e.target.value)}
                placeholder={placeholder}
                className="p-inputtext p-component p-mb-2"
            />
            <div className="p-d-flex p-jc-between">
                <Button
                    label="Apply"
                    icon="pi pi-search"
                    onClick={() => filterCallback(value)}
                    size="small"
                    className="btn-primary btn-outlined"
                />
                <Button
                    label="Clear"
                    icon="pi pi-filter-slash"
                    onClick={() => filterCallback("")}
                    size="small"
                    className="btn-text"
                />
            </div>
        </div>
    );
};

// Generic Dropdown Filter
export const dropdownFilterTemplate = (optionsList: DropdownOption[], placeholder: string) =>
  (options: SimpleFilterOptions) => {
    const { value, filterCallback } = options;
    return (
        <div className="p-d-flex p-flex-column">
            <Dropdown
                value={value}
                options={optionsList}
                onChange={(e) => filterCallback(e.value)}
                placeholder={placeholder}
                className="p-mb-2"
                showClear
            />
            <div className="p-d-flex p-jc-between">
                <Button
                    label="Apply"
                    icon="pi pi-search"
                    onClick={() => filterCallback(value)}
                    size="small"
                    className="btn-primary btn-outlined"
                />
                <Button
                    label="Clear"
                    icon="pi pi-filter-slash"
                    onClick={() => filterCallback("")}
                    size="small"
                    className="btn-text"
                />
            </div>
        </div>
    );
};


const matchModes: Array<{ label: string; value: PrimeFilterMatchMode }> = [
  { label: "Starts With", value: "startsWith" },
  { label: "Contains", value: "contains" },
  { label: "Equals", value: "equals" },
  { label: "Ends With", value: "endsWith" },
];

export const multiRuleTextFilterTemplate = (placeholder: string) =>
  (options: MultiRuleFilterOptions) => {
    const { filterCallback, constraints, operator } = options;

    // Single constraint for simplicity (can extend to multiple)
    const currentConstraint: DataTableFilterConstraint =
      constraints?.[0] ?? { value: "", matchMode: "startsWith" };

    return (
        <div className="p-d-flex p-flex-column">
            <input
                type="text"
                value={
                  typeof currentConstraint.value === "string" || typeof currentConstraint.value === "number"
                    ? currentConstraint.value
                    : ""
                }
                onChange={(e) =>
                    filterCallback([{ ...currentConstraint, value: e.target.value }], operator)
                }
                placeholder={placeholder}
                className="p-inputtext p-component p-mb-2"
            />
            <Dropdown
                value={currentConstraint.matchMode}
                options={matchModes}
                onChange={(e) =>
                    filterCallback([{ ...currentConstraint, matchMode: e.value }], operator)
                }
                placeholder="Select match mode"
                className="p-mb-2"
            />
            <div className="p-d-flex p-jc-between">
                <Button
                    label="Apply"
                    icon="pi pi-search"
                    onClick={() => filterCallback([currentConstraint], operator)}
                    size="small"
                    className="btn-primary btn-outlined"
                />
                <Button
                    label="Clear"
                    icon="pi pi-filter-slash"
                    onClick={() => filterCallback([], operator)}
                    size="small"
                    className="btn-text"
                />
            </div>
        </div>
    );
};

export function multiRuleTextFilterWithoutButtons(props: MultiRuleTextFilterProps) {
  const { value, filterApplyCallback } = props;

  return (
    <div className="p-d-flex p-flex-column p-gap-2">
      <input
        value={typeof value === "string" || typeof value === "number" ? value : ""}
        onChange={(e) => filterApplyCallback?.(e.target.value)}
        placeholder="Filter..."
      />
    </div>
  );
}
