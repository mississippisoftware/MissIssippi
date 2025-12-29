import { InputText } from "primereact/inputtext";


export const stringMatchModes = [
    { label: 'Starts With', value: 'startsWith' },
    { label: 'Contains', value: 'contains' },
    { label: 'Ends With', value: 'endsWith' },
    { label: 'Equals', value: 'equals' },
];

import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";

// Generic Text Filter
export const textFilterTemplate = (placeholder: string) => (options: any) => {
    const { value, filterCallback } = options;
    return (
        <div className="p-d-flex p-flex-column">
            <input
                type="text"
                value={value || ""}
                onChange={(e) => filterCallback(e.target.value)}
                placeholder={placeholder}
                className="p-inputtext p-component p-mb-2"
            />
            <div className="p-d-flex p-jc-between">
                <Button label="Apply" icon="pi pi-check" onClick={() => filterCallback(value)} size="small" />
                <Button label="Clear" icon="pi pi-times" onClick={() => filterCallback("")} size="small" className="p-button-secondary" />
            </div>
        </div>
    );
};

// Generic Numeric Filter
export const numericFilterTemplate = (placeholder: string) => (options: any) => {
    const { value, filterCallback } = options;
    return (
        <div className="p-d-flex p-flex-column">
            <input
                type="number"
                value={value || ""}
                onChange={(e) => filterCallback(e.target.value)}
                placeholder={placeholder}
                className="p-inputtext p-component p-mb-2"
            />
            <div className="p-d-flex p-jc-between">
                <Button label="Apply" icon="pi pi-check" onClick={() => filterCallback(value)} size="small" />
                <Button label="Clear" icon="pi pi-times" onClick={() => filterCallback("")} size="small" className="p-button-secondary" />
            </div>
        </div>
    );
};

// Generic Dropdown Filter
export const dropdownFilterTemplate = (optionsList: any[], placeholder: string) => (options: any) => {
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
                <Button label="Apply" icon="pi pi-check" onClick={() => filterCallback(value)} size="small" />
                <Button label="Clear" icon="pi pi-times" onClick={() => filterCallback("")} size="small" className="p-button-secondary" />
            </div>
        </div>
    );
};


const matchModes = [
    { label: "Starts With", value: "startsWith" },
    { label: "Contains", value: "contains" },
    { label: "Equals", value: "equals" },
    { label: "Ends With", value: "endsWith" },
];

export const multiRuleTextFilterTemplate = (placeholder: string) => (options: any) => {
    const { value, filterCallback, constraints, operator } = options;

    // Single constraint for simplicity (can extend to multiple)
    const currentConstraint = constraints?.[0] || { value: "", matchMode: "startsWith" };

    return (
        <div className="p-d-flex p-flex-column">
            <input
                type="text"
                value={currentConstraint.value || ""}
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
                    icon="pi pi-check"
                    onClick={() => filterCallback([currentConstraint], operator)}
                    size="small"
                />
                <Button
                    label="Clear"
                    icon="pi pi-times"
                    onClick={() => filterCallback([], operator)}
                    size="small"
                    className="p-button-secondary"
                />
            </div>
        </div>
    );
};

interface ColumnFilterProps {
    filterModel: {
        value: any;
        matchMode: string;
    };
    filterCallback: (newVal: any, constraintIndex?: number) => void;
    constraints: any[]; // internal rule constraints array
}

export function multiRuleTextFilterWithoutButtons(props: any) {
  const { value, filterCallback, filterApplyCallback } = props;

  return (
    <div className="p-d-flex p-flex-column p-gap-2">
      <input
        value={value ?? ""}
        onChange={(e) => filterApplyCallback?.(e.target.value)}
        placeholder="Filter..."
      />
    </div>
  );
}