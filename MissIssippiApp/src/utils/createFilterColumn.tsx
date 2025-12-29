import { Column } from "primereact/column";
import { stringMatchModes } from "./PrimeFilterConfig";

export const createFilterColumn = (
  field: string,
  header: string,
  defaultMatchMode: string = "startsWith"
) => {
  return (
    <Column
      key={field}
      field={field}
      header={header}
      filter
      filterMatchMode={defaultMatchMode}
      filterMatchModeOptions={stringMatchModes}
    />
  );
};