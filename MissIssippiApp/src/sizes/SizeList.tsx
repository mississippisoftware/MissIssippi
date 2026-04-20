import { type KeyboardEvent, useMemo, useRef, useState } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputSwitch } from "primereact/inputswitch";
import { Column } from "primereact/column";
import { Toast } from "primereact/toast";
import ActiveFilterChips, { type ActiveFilterChip } from "../components/ActiveFilterChips";
import CatalogPageLayout from "../components/CatalogPageLayout";
import PageActionsMenu from "../components/PageActionsMenu";
import PageFiltersBar from "../components/PageFiltersBar";
import CatalogCrudTable from "../components/catalog/CatalogCrudTable";
import { useCatalogCrud } from "../hooks/useCatalogCrud";
import { useNotifier } from "../hooks/useNotifier";
import { InventoryService, type SizeRecord } from "../service/InventoryService";
import type { EditorOptions } from "../types/editor";
import { getErrorMessage } from "../utils/errors";
import { shouldSubmitOnEnter } from "../utils/modalKeyHandlers";

const normalizeSizeRow = (row: SizeRecord): SizeRecord => ({
  ...row,
  sizeName: String(row.sizeName ?? "").trim(),
  sizeSequence: Number.isFinite(Number(row.sizeSequence)) ? Number(row.sizeSequence) : 0,
});

export default function SizeList() {
  const toastRef = useRef<Toast>(null);
  const notify = useNotifier(toastRef);

  const {
    rows: sizes,
    loading,
    lookupError,
    editingRows,
    load: loadSizes,
    addTempRow: handleAddSizeRow,
    handleRowEditChange,
    handleRowEditCancel,
    handleRowEditComplete,
    rowToDelete: sizeToDelete,
    openDeleteModal: openDeleteSizeModal,
    closeDeleteModal: closeDeleteSizeModal,
    confirmDelete: handleDeleteSize,
    deletingRowId: deletingSizeId,
  } = useCatalogCrud<SizeRecord>({
    loadRows: async () => {
      const data = await InventoryService.getSizes();
      return data.map(normalizeSizeRow);
    },
    loadErrorMessage: "Failed to load sizes.",
    getRowId: (row) => Number(row.sizeId),
    createTempRow: ({ tempId, rows }) => ({
      sizeId: tempId,
      sizeName: "",
      sizeSequence:
        rows.reduce((max, row) => Math.max(max, Number(row.sizeSequence) || 0), 0) + 1,
    }),
    normalizeRow: normalizeSizeRow,
    saveRow: async (row) => {
      const sizeName = String(row.sizeName ?? "").trim();
      const sizeSequence = Number(row.sizeSequence);

      if (!sizeName) {
        notify("warn", "Size required", "Enter a size name.");
        return false;
      }
      if (!Number.isFinite(sizeSequence)) {
        notify("warn", "Sequence required", "Enter a valid sequence number.");
        return false;
      }

      try {
        const saved = await InventoryService.addOrUpdateSize({
          sizeId: row.sizeId,
          sizeName,
          sizeSequence,
        });
        if (!saved) {
          notify("error", "Size save failed", "Unable to save size.");
          return false;
        }
        notify("success", "Size saved", `${sizeName} saved successfully.`);
        return true;
      } catch (err: unknown) {
        console.error(err);
        notify("error", "Size save failed", getErrorMessage(err, "Unable to save size."));
        return false;
      }
    },
    deleteRow: async (row) => {
      await InventoryService.deleteSize(Number(row.sizeId));
      notify("success", "Size deleted", `${row.sizeName} deleted successfully.`);
    },
    onDeleteError: (err) => {
      notify("error", "Delete failed", getErrorMessage(err, "Unable to delete size."));
    },
  });

  const orderedSizes = useMemo(
    () =>
      [...sizes].sort((a, b) => {
        const seqDiff = (Number(a.sizeSequence) || 0) - (Number(b.sizeSequence) || 0);
        if (seqDiff !== 0) return seqDiff;
        return String(a.sizeName ?? "").localeCompare(String(b.sizeName ?? ""));
      }),
    [sizes]
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [matchExactName, setMatchExactName] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [sequenceFilter, setSequenceFilter] = useState("");

  const filteredSizes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const targetSequence = sequenceFilter.trim();
    return orderedSizes.filter((row) => {
      const sizeName = String(row.sizeName ?? "").toLowerCase();
      if (query) {
        if (matchExactName ? sizeName !== query : !sizeName.includes(query)) {
          return false;
        }
      }

      if (targetSequence) {
        const sizeSequence = String(Number(row.sizeSequence) || 0);
        if (sizeSequence !== targetSequence) {
          return false;
        }
      }

      return true;
    });
  }, [matchExactName, orderedSizes, searchQuery, sequenceFilter]);

  const activeChips = useMemo<ActiveFilterChip[]>(() => {
    const chips: ActiveFilterChip[] = [];
    if (searchQuery.trim()) {
      chips.push({
        key: "search",
        label: "Search",
        value: searchQuery.trim(),
        onRemove: () => setSearchQuery(""),
      });
    }
    if (matchExactName) {
      chips.push({
        key: "exact",
        label: "Match",
        value: "Exact name",
        onRemove: () => setMatchExactName(false),
      });
    }
    if (sequenceFilter.trim()) {
      chips.push({
        key: "sequence",
        label: "Sequence",
        value: sequenceFilter.trim(),
        onRemove: () => setSequenceFilter(""),
      });
    }
    return chips;
  }, [matchExactName, searchQuery, sequenceFilter]);

  const clearFilters = () => {
    setSearchQuery("");
    setMatchExactName(false);
    setSequenceFilter("");
  };

  const headerActions = [
    {
      key: "addSize",
      label: "Add Size",
      icon: "pi pi-plus",
      onClick: handleAddSizeRow,
      disabled: loading,
    },
    {
      key: "refresh",
      label: loading ? "Refreshing..." : "Refresh List",
      icon: "pi pi-refresh",
      onClick: loadSizes,
      disabled: loading,
    },
    {
      key: "clearFilters",
      label: "Clear Filters",
      icon: "pi pi-filter-slash",
      onClick: clearFilters,
      separatorBefore: true,
    },
  ];

  const renderTextEditor = (options: EditorOptions<SizeRecord>) => (
    <input
      type="text"
      value={typeof options.value === "string" || typeof options.value === "number" ? String(options.value) : ""}
      onChange={(e) => options.editorCallback?.(e.target.value)}
      className="pt-form-input"
    />
  );

  const renderSequenceEditor = (options: EditorOptions<SizeRecord>) => (
    <input
      type="number"
      step={1}
      value={typeof options.value === "number" || typeof options.value === "string" ? options.value : 0}
      onChange={(e) => options.editorCallback?.(Number(e.target.value))}
      className="pt-form-input"
    />
  );

  const deleteFooter = (
    <>
      <Button
        type="button"
        className="btn-neutral btn-outlined"
        onClick={closeDeleteSizeModal}
        disabled={deletingSizeId !== null}
        unstyled
      >
        <i className="pi pi-times" aria-hidden="true" />
        Cancel
      </Button>
      <Button
        type="button"
        className="btn-danger"
        onClick={() => void handleDeleteSize()}
        disabled={deletingSizeId !== null}
        unstyled
      >
        <i className="pi pi-trash" aria-hidden="true" />
        {deletingSizeId !== null ? "Deleting..." : "Delete"}
      </Button>
    </>
  );

  return (
    <CatalogPageLayout
      title="Size List"
      subtitle={`Total sizes: ${filteredSizes.length}`}
      actionsSlot={<PageActionsMenu items={headerActions} />}
    >
      <Toast ref={toastRef} position="top-right" />

      {lookupError && <div className="alert alert-danger" role="alert">{lookupError}</div>}

      <div className="catalog-page-toolbar">
        <PageFiltersBar
          searchLabel=""
          searchPlaceholder="Quick search size"
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          showAdvanced={showAdvancedFilters}
          onToggleAdvanced={() => setShowAdvancedFilters((prev) => !prev)}
          advancedFilters={
            <div className="page-filters-advanced-grid">
              <div className="page-filter-field">
                <label className="page-filters-label">Sequence</label>
                <input
                  type="number"
                  value={sequenceFilter}
                  onChange={(event) => setSequenceFilter(event.target.value)}
                  placeholder="Exact sequence"
                  className="pt-form-input"
                />
              </div>
              <div className="page-filter-field page-filter-field--toggle">
                <div className="pt-flex-row">
                  <InputSwitch
                    inputId="size-exact-match"
                    checked={matchExactName}
                    onChange={(e) => setMatchExactName(e.value)}
                  />
                  <label htmlFor="size-exact-match">Exact name</label>
                </div>
              </div>
            </div>
          }
          onClearFilters={clearFilters}
          clearLabel="Clear Filters"
        />
        <ActiveFilterChips chips={activeChips} onClearAll={clearFilters} clearLabel="Clear Filters" />
      </div>

      <div className="portal-content-card">
        <div>
          <CatalogCrudTable
            data={filteredSizes}
            dataKey="sizeId"
            loading={loading}
            editingRows={editingRows}
            onRowEditChange={handleRowEditChange}
            onRowEditComplete={handleRowEditComplete}
            onRowEditCancel={handleRowEditCancel}
            sortField="sizeSequence"
            sortOrder={1}
            sortMode="single"
          >
            <Column field="sizeName" header="Size" editor={renderTextEditor} sortable />
            <Column
              field="sizeSequence"
              header="Sequence"
              editor={renderSequenceEditor}
              sortable
              headerClassName="col-sequence"
            />
            <Column rowEditor header="Save" headerClassName="col-actions" bodyClassName="col-center" />
            <Column
              header="Delete"
              body={(row: SizeRecord) => (
                <Button
                  type="button"
                  className="btn-danger btn-outlined btn-icon"
                  onClick={() => openDeleteSizeModal(row)}
                  disabled={Number(row.sizeId) < 0}
                  aria-label={`Delete ${row.sizeName}`}
                  unstyled
                >
                  <i className="pi pi-trash" aria-hidden="true" />
                </Button>
              )}
              headerClassName="col-actions"
              bodyClassName="col-center"
            />
          </CatalogCrudTable>
        </div>
      </div>

      <Dialog
        visible={Boolean(sizeToDelete)}
        onHide={closeDeleteSizeModal}
        header="Delete size"
        footer={deleteFooter}
        modal
        closable
        draggable={false}
        resizable={false}
        onKeyDown={(event: KeyboardEvent<HTMLElement>) => {
          if (deletingSizeId !== null) return;
          if (!shouldSubmitOnEnter(event)) return;
          event.preventDefault();
          void handleDeleteSize();
        }}
      >
        <p className="pt-text-desc">
          Delete <strong>{sizeToDelete?.sizeName}</strong>? This action cannot be undone.
        </p>
      </Dialog>
    </CatalogPageLayout>
  );
}
