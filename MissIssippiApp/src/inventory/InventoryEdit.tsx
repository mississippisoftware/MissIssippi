import { useEffect, useMemo, useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { ProgressSpinner } from "primereact/progressspinner";
import { useLocation } from "react-router-dom";
import { useShallow } from "zustand/shallow";
import ActionButton from "../components/ActionButton";
import CatalogPageLayout from "../components/CatalogPageLayout";
import InventoryEditCard from "../components/inventoryEdit/InventoryEditCard";
import { useNotifier } from "../hooks/useNotifier";
import { useInventoryEditStore } from "../stores/InventoryEditStore";
import InventorySearchFiltersForm from "../components/InventorySearchFilters";
import type { InventorySearchFilters as InventorySearchFiltersType } from "../utils/InventorySearchFilters";
import { buildInventoryCardGroups, type InventoryCardGroup } from "../utils/buildInventoryCardGroups";
import { printInventoryCards } from "../utils/printInventory";
import { getErrorMessage } from "../utils/errors";

const EMPTY_FILTERS: InventorySearchFiltersType = {
  itemNumber: "",
  description: "",
  colorName: "",
  seasonName: "",
};


export default function InventoryEdit() {
  const toastRef = useRef<Toast>(null);
  const notify = useNotifier(toastRef);
  const location = useLocation();
  const autoSearchRef = useRef<string | null>(null);
  const [cardColumns, setCardColumns] = useState<1 | 2>(2);

  const {
    results,
    sizeColumns,
    seasons,
    loading,
    searching,
    lastFilters,
    initializeSizes,
    fetchSeasons,
    search,
    clearResults,
    updateCell,
    saveByItem,
    discardChangesByItem,
    dirtyItemsSet,
  } = useInventoryEditStore(
    useShallow((s) => ({
      results: s.results,
      sizeColumns: s.sizeColumns,
      seasons: s.seasons,
      loading: s.loading,
      searching: s.searching,
      lastFilters: s.lastFilters,
      initializeSizes: s.initializeSizes,
      fetchSeasons: s.fetchSeasons,
      search: s.search,
      clearResults: s.clearResults,
      updateCell: s.updateCell,
      saveByItem: s.saveByItem,
      discardChangesByItem: s.discardChangesByItem,
      dirtyItemsSet: s.dirtyItemsSet,
    }))
  );

  const [form, setForm] = useState<InventorySearchFiltersType>(() => ({
    ...EMPTY_FILTERS,
    ...(lastFilters ?? {}),
  }));

  useEffect(() => {
    initializeSizes();
    fetchSeasons();
  }, [initializeSizes, fetchSeasons]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- keep form in sync with stored filters
    setForm({ ...EMPTY_FILTERS, ...(lastFilters ?? {}) });
  }, [lastFilters]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const itemNumber = params.get("itemNumber") ?? "";
    const description = params.get("description") ?? "";
    const colorName = params.get("colorName") ?? "";
    const seasonName = params.get("seasonName") ?? "";

    if (!itemNumber && !description && !colorName && !seasonName) {
      return;
    }

    const key = `${itemNumber}|${description}|${colorName}|${seasonName}`;
    if (autoSearchRef.current === key) {
      return;
    }
    autoSearchRef.current = key;

    const nextFilters: InventorySearchFiltersType = {
      itemNumber,
      description,
      colorName,
      seasonName,
    };

    // eslint-disable-next-line react-hooks/set-state-in-effect -- keep form in sync with URL query params
    setForm(nextFilters);
    search(nextFilters).catch((err: unknown) => {
      console.error(err);
      notify("error", "Auto search failed", getErrorMessage(err, "Unable to load inventory."));
    });
  }, [location.search, notify, search]);

  const cardGroups = useMemo(() => buildInventoryCardGroups(results), [results]);
  const hasCards = cardGroups.length > 0;

  const handleSearch = async (filters: InventorySearchFiltersType) => {
    const data = await search(filters);
    if (data.length === 0) {
      notify("info", "No results", "No styles found for that search.");
    }
  };

  const handleSave = async (itemNumber: string) => {
    try {
      await saveByItem(itemNumber);
      notify("success", "Saved", `Saved changes for ${itemNumber}`);
    } catch (err: unknown) {
      console.error(err);
      notify("error", "Error", getErrorMessage(err, "Failed to save"));
    }
  };

  const handleClear = () => {
    setForm(EMPTY_FILTERS);
    clearResults();
  };

  const handlePrintError = () => {
    notify("error", "Error", "Unable to render PDF preview.");
  };

  const downloadGroups = (groups: InventoryCardGroup[]) => {
    printInventoryCards(
      { subtitle: "Edit Inventory", sizeColumns, groups },
      { onError: handlePrintError }
    );
  };

  const handleDownloadPdf = (group: InventoryCardGroup) => {
    downloadGroups([group]);
  };

  const handleDownloadAll = () => {
    if (cardGroups.length === 0) {
      notify("info", "No results", "Search and load styles before downloading.");
      return;
    }
    downloadGroups(cardGroups);
  };

  const placeholderImage = "";

  return (
    <CatalogPageLayout
      title="Edit Inventory"
      subtitle="Search for styles to edit size quantities"
      className="catalog-page--wide"
    >
      <Toast ref={toastRef} position="top-right" />

      <div className="inventory-edit-header-actions">
        <div className="content-card inventory-edit-search-card">
          <InventorySearchFiltersForm
            filters={form}
            seasons={seasons}
            searching={searching}
            onChange={setForm}
            onSubmit={handleSearch}
            onClear={handleClear}
          />
        </div>
      </div>

      {loading && (
        <div className="inventory-edit-status d-flex justify-content-center py-5">
          <ProgressSpinner />
        </div>
      )}

      {!loading && !searching && results.length === 0 && (
        <div className="inventory-edit-status text-center text-muted">
          Search to load styles and start editing.
        </div>
      )}

      {searching && (
        <div className="inventory-edit-status d-flex justify-content-center py-4">
          <ProgressSpinner />
        </div>
      )}

      {hasCards && (
        <div className="inventory-edit-panel">
          <div className="inventory-view-card-header inventory-edit-panel-header">
            <div className="inventory-view-card-actions inventory-edit-panel-actions">
              <ActionButton
                label="Download All"
                icon="pi pi-download"
                className="btn-info btn-outlined"
                onClick={handleDownloadAll}
                title="Download All"
              />
              <ActionButton
                icon={cardColumns === 2 ? "pi pi-th-large" : "pi pi-bars"}
                className="btn-neutral btn-outlined"
                onClick={() => setCardColumns((prev) => (prev === 2 ? 1 : 2))}
                ariaLabel={cardColumns === 2 ? "Switch to one column" : "Switch to two columns"}
                title={cardColumns === 2 ? "Switch to one column" : "Switch to two columns"}
                iconOnly
              />
            </div>
          </div>

          <div className={`inventory-cards-grid ${cardColumns === 1 ? "one-column" : "two-columns"}`}>
            {cardGroups.map((group) => (
              <InventoryEditCard
                key={group.itemNumber}
                group={group}
                sizeColumns={sizeColumns}
                onQtyChange={updateCell}
                onDownload={handleDownloadPdf}
                onDiscard={discardChangesByItem}
                onSave={handleSave}
                isDirty={dirtyItemsSet.has(group.itemNumber)}
                placeholderImage={placeholderImage}
              />
            ))}
          </div>
        </div>
      )}
    </CatalogPageLayout>
  );
}

