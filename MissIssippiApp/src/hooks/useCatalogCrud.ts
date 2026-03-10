import { useCallback, useEffect, useRef, useState } from "react";
import type { DataTableRowEditCompleteEvent } from "primereact/datatable";

type UseCatalogCrudOptions<TRecord> = {
  loadRows: () => Promise<TRecord[]>;
  loadErrorMessage: string;
  getRowId: (row: TRecord) => number;
  createTempRow: (args: { tempId: number; rows: TRecord[] }) => TRecord;
  saveRow: (row: TRecord) => Promise<boolean>;
  deleteRow: (row: TRecord) => Promise<void>;
  normalizeRow?: (row: TRecord) => TRecord;
  onLoadError?: (err: unknown) => void;
  onDeleteError?: (err: unknown, row: TRecord) => void;
};

export const useCatalogCrud = <TRecord>(options: UseCatalogCrudOptions<TRecord>) => {
  const {
    loadRows,
    loadErrorMessage,
    getRowId,
    createTempRow,
    saveRow,
    deleteRow,
    normalizeRow,
    onLoadError,
    onDeleteError,
  } = options;

  const loadRowsRef = useRef(loadRows);
  const getRowIdRef = useRef(getRowId);
  const createTempRowRef = useRef(createTempRow);
  const saveRowRef = useRef(saveRow);
  const deleteRowRef = useRef(deleteRow);
  const normalizeRowRef = useRef(normalizeRow);
  const onLoadErrorRef = useRef(onLoadError);
  const onDeleteErrorRef = useRef(onDeleteError);

  loadRowsRef.current = loadRows;
  getRowIdRef.current = getRowId;
  createTempRowRef.current = createTempRow;
  saveRowRef.current = saveRow;
  deleteRowRef.current = deleteRow;
  normalizeRowRef.current = normalizeRow;
  onLoadErrorRef.current = onLoadError;
  onDeleteErrorRef.current = onDeleteError;

  const [rows, setRows] = useState<TRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [editingRows, setEditingRows] = useState<Record<string, boolean>>({});
  const [tempId, setTempId] = useState(-1);
  const [rowToDelete, setRowToDelete] = useState<TRecord | null>(null);
  const [deletingRowId, setDeletingRowId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLookupError(null);
    try {
      const data = await loadRowsRef.current();
      setRows(data);
      return data;
    } catch (err: unknown) {
      console.error(err);
      setLookupError(loadErrorMessage);
      onLoadErrorRef.current?.(err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [loadErrorMessage]);

  useEffect(() => {
    void load();
  }, [load]);

  const startEdit = useCallback((rowId: number) => {
    setEditingRows((prev) => ({ ...prev, [String(rowId)]: true }));
  }, []);

  const addTempRow = useCallback(() => {
    const nextId = tempId;
    setTempId((prev) => prev - 1);
    setRows((prev) => {
      const nextRow = createTempRowRef.current({ tempId: nextId, rows: prev });
      return [nextRow, ...prev];
    });
    startEdit(nextId);
  }, [startEdit, tempId]);

  const handleRowEditChange = useCallback((event: unknown) => {
    const next = (event as { data?: Record<string, boolean> })?.data;
    setEditingRows(next ?? {});
  }, []);

  const handleRowEditCancel = useCallback(
    (event: unknown) => {
      const row = (event as { data?: TRecord })?.data;
      if (!row) return;
      const rowId = getRowIdRef.current(row);
      if (rowId < 0) {
        setRows((prev) => prev.filter((entry) => getRowIdRef.current(entry) !== rowId));
      }
    },
    []
  );

  const handleRowEditComplete = useCallback(
    async (event: DataTableRowEditCompleteEvent) => {
      const rawRow = event.newData as TRecord;
      const row = normalizeRowRef.current ? normalizeRowRef.current(rawRow) : rawRow;
      const rowId = getRowIdRef.current(row);

      const saved = await saveRowRef.current(row);
      if (!saved) {
        setEditingRows((prev) => ({ ...prev, [String(rowId)]: true }));
        return;
      }

      await load();
      setEditingRows({});
    },
    [load]
  );

  const openDeleteModal = useCallback((row: TRecord) => {
    setRowToDelete(row);
  }, []);

  const closeDeleteModal = useCallback(() => {
    setRowToDelete(null);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!rowToDelete) return;
    const rowId = getRowIdRef.current(rowToDelete);
    if (!Number.isFinite(rowId) || rowId <= 0) {
      setRowToDelete(null);
      return;
    }

    setDeletingRowId(rowId);
    try {
      await deleteRowRef.current(rowToDelete);
      setRowToDelete(null);
      await load();
    } catch (err: unknown) {
      console.error(err);
      onDeleteErrorRef.current?.(err, rowToDelete);
    } finally {
      setDeletingRowId(null);
    }
  }, [load, rowToDelete]);

  return {
    rows,
    setRows,
    loading,
    lookupError,
    editingRows,
    setEditingRows,
    load,
    addTempRow,
    startEdit,
    handleRowEditChange,
    handleRowEditCancel,
    handleRowEditComplete,
    rowToDelete,
    openDeleteModal,
    closeDeleteModal,
    confirmDelete,
    deletingRowId,
  };
};
