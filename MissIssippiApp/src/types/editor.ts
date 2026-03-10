export type EditorOptions<T> = {
  value?: unknown;
  rowData: T;
  editorCallback?: (value: unknown) => void;
};

