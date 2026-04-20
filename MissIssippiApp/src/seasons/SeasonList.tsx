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
import { InventoryService, type SeasonRecord } from "../service/InventoryService";
import type { EditorOptions } from "../types/editor";
import { getErrorMessage } from "../utils/errors";
import { shouldSubmitOnEnter } from "../utils/modalKeyHandlers";

const normalizeSeasonRow = (row: SeasonRecord): SeasonRecord => ({
  ...row,
  seasonId: Number(row.seasonId),
  seasonName: String(row.seasonName ?? ""),
  active: row.active ?? false,
});

export default function SeasonList() {
  const toastRef = useRef<Toast>(null);
  const notify = useNotifier(toastRef);

  const {
    rows: seasons,
    loading,
    lookupError,
    editingRows,
    load: loadSeasons,
    addTempRow: handleAddSeasonRow,
    handleRowEditChange,
    handleRowEditCancel,
    handleRowEditComplete,
    rowToDelete: seasonToDelete,
    openDeleteModal: openDeleteSeasonModal,
    closeDeleteModal: closeDeleteSeasonModal,
    confirmDelete: handleDeleteSeason,
    deletingRowId: deletingSeasonId,
  } = useCatalogCrud<SeasonRecord>({
    loadRows: async () => {
      const data = await InventoryService.getSeasons();
      return data.map(normalizeSeasonRow);
    },
    loadErrorMessage: "Failed to load seasons.",
    getRowId: (row) => Number(row.seasonId),
    createTempRow: ({ tempId }) => ({
      seasonId: tempId,
      seasonName: "",
      active: true,
    }),
    normalizeRow: normalizeSeasonRow,
    saveRow: async (row) => {
      const seasonName = row.seasonName?.trim() ?? "";
      if (!seasonName) {
        notify("warn", "Season required", "Enter a season name.");
        return false;
      }

      try {
        const saved = await InventoryService.addOrUpdateSeason({
          seasonId: row.seasonId > 0 ? row.seasonId : undefined,
          seasonName,
          active: row.active ?? false,
        });
        if (!saved) {
          notify("error", "Season save failed", "Unable to save season.");
          return false;
        }
        notify("success", "Season saved", `${seasonName} saved successfully.`);
        return true;
      } catch (err: unknown) {
        console.error(err);
        notify("error", "Season save failed", getErrorMessage(err, "Unable to save season."));
        return false;
      }
    },
    deleteRow: async (row) => {
      await InventoryService.deleteSeason(Number(row.seasonId));
      notify("success", "Season deleted", `${row.seasonName} deleted successfully.`);
    },
    onDeleteError: (err) => {
      notify("error", "Delete failed", getErrorMessage(err, "Unable to delete season."));
    },
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [activeOnly, setActiveOnly] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [exactName, setExactName] = useState("");

  const filteredSeasons = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const exact = exactName.trim().toLowerCase();
    return seasons.filter((row) => {
      if (activeOnly && !row.active) return false;
      if (exact && String(row.seasonName ?? "").toLowerCase() !== exact) return false;
      if (!query) return true;
      return String(row.seasonName ?? "").toLowerCase().includes(query);
    });
  }, [activeOnly, exactName, searchQuery, seasons]);

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
    if (activeOnly) {
      chips.push({
        key: "activeOnly",
        label: "Active",
        value: "Only active seasons",
        onRemove: () => setActiveOnly(false),
      });
    }
    if (exactName.trim()) {
      chips.push({
        key: "exactName",
        label: "Exact season",
        value: exactName.trim(),
        onRemove: () => setExactName(""),
      });
    }
    return chips;
  }, [activeOnly, exactName, searchQuery]);

  const clearFilters = () => {
    setSearchQuery("");
    setActiveOnly(false);
    setExactName("");
  };

  const headerActions = [
    {
      key: "addSeason",
      label: "Add Season",
      icon: "pi pi-plus",
      onClick: handleAddSeasonRow,
      disabled: loading,
    },
    {
      key: "refresh",
      label: loading ? "Refreshing..." : "Refresh List",
      icon: "pi pi-refresh",
      onClick: loadSeasons,
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

  const renderTextEditor = (options: EditorOptions<SeasonRecord>) => (
    <input
      type="text"
      value={typeof options.value === "string" || typeof options.value === "number" ? String(options.value) : ""}
      onChange={(e) => options.editorCallback?.(e.target.value)}
      className="pt-form-input"
    />
  );

  const renderActiveEditor = (options: EditorOptions<SeasonRecord>) => (
    <input
      type="checkbox"
      checked={Boolean(options.value)}
      onChange={(e) => options.editorCallback?.(e.target.checked)}
    />
  );

  const renderActive = (row: SeasonRecord) => (
    <input type="checkbox" checked={Boolean(row.active)} readOnly disabled onChange={() => {}} />
  );

  const deleteFooter = (
    <>
      <Button
        type="button"
        className="btn-neutral btn-outlined"
        onClick={closeDeleteSeasonModal}
        disabled={deletingSeasonId !== null}
        unstyled
      >
        <i className="pi pi-times" aria-hidden="true" />
        Cancel
      </Button>
      <Button
        type="button"
        className="btn-danger"
        onClick={() => void handleDeleteSeason()}
        disabled={deletingSeasonId !== null}
        unstyled
      >
        <i className="pi pi-trash" aria-hidden="true" />
        {deletingSeasonId !== null ? "Deleting..." : "Delete"}
      </Button>
    </>
  );

  return (
    <CatalogPageLayout
      title="Season List"
      subtitle={`Total seasons: ${filteredSeasons.length}`}
      actionsSlot={<PageActionsMenu items={headerActions} />}
    >
      <Toast ref={toastRef} position="top-right" />

      {lookupError && <div className="alert alert-danger" role="alert">{lookupError}</div>}

      <div className="catalog-page-toolbar">
        <PageFiltersBar
          searchLabel=""
          searchPlaceholder="Quick search season"
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          showAdvanced={showAdvancedFilters}
          onToggleAdvanced={() => setShowAdvancedFilters((prev) => !prev)}
          advancedFilters={
            <div className="page-filters-advanced-grid">
              <div className="page-filter-field">
                <label className="page-filters-label">Exact Season Name</label>
                <input
                  type="text"
                  value={exactName}
                  onChange={(event) => setExactName(event.target.value)}
                  placeholder="Match exact season"
                  className="pt-form-input"
                />
              </div>
              <div className="page-filter-field page-filter-field--toggle">
                <div className="pt-flex-row">
                  <InputSwitch
                    inputId="season-active-only"
                    checked={activeOnly}
                    onChange={(e) => setActiveOnly(e.value)}
                  />
                  <label htmlFor="season-active-only">Active only</label>
                </div>
              </div>
            </div>
          }
          onClearFilters={clearFilters}
          clearLabel="Clear Filters"
        />
        <ActiveFilterChips
          chips={activeChips}
          onClearAll={clearFilters}
          clearLabel="Clear Filters"
        />
      </div>

      <div className="portal-content-card">
        <div>
          <CatalogCrudTable
            data={filteredSeasons}
            dataKey="seasonId"
            loading={loading}
            editingRows={editingRows}
            onRowEditChange={handleRowEditChange}
            onRowEditComplete={handleRowEditComplete}
            onRowEditCancel={handleRowEditCancel}
            sortField="seasonName"
            sortOrder={1}
            sortMode="single"
          >
            <Column field="seasonName" header="Season" editor={renderTextEditor} className="col-season" sortable />
            <Column field="active" header="Active" body={renderActive} editor={renderActiveEditor} className="col-active" />
            <Column rowEditor header="Save" headerClassName="col-actions" bodyClassName="col-center" />
            <Column
              header="Delete"
              body={(row: SeasonRecord) => (
                <Button
                  type="button"
                  className="btn-danger btn-outlined btn-icon"
                  onClick={() => openDeleteSeasonModal(row)}
                  disabled={Number(row.seasonId) < 0}
                  aria-label={`Delete ${row.seasonName}`}
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
        visible={Boolean(seasonToDelete)}
        onHide={closeDeleteSeasonModal}
        header="Delete season"
        footer={deleteFooter}
        modal
        closable
        draggable={false}
        resizable={false}
        onKeyDown={(event: KeyboardEvent<HTMLElement>) => {
          if (deletingSeasonId !== null) return;
          if (!shouldSubmitOnEnter(event)) return;
          event.preventDefault();
          void handleDeleteSeason();
        }}
      >
        <p className="pt-text-desc">
          Delete <strong>{seasonToDelete?.seasonName}</strong>? This action cannot be undone.
        </p>
      </Dialog>
    </CatalogPageLayout>
  );
}
