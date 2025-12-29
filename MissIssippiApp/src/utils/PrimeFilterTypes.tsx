export type PrimeFilterMatchMode =
    | "startsWith"
    | "contains"
    | "endsWith"
    | "equals"
    | "notEquals"
    | "in"
    | "notIn"
    | "lt"
    | "lte"
    | "gt"
    | "gte"
    | "custom"
    | "notContains"
    | "between"
    | "dateIs"
    | "dateIsNot"
    | "dateBefore"
    | "dateAfter";

export interface DataTableFilterConstraint {
    value: any;
    matchMode: string;
}

export interface DataTableFilterMeta {
    operator: "and" | "or";
    constraints: DataTableFilterConstraint[];
}

// Full filters object for all columns
export type DataTableFilters = Record<string, DataTableFilterMeta>;