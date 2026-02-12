import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "react-bootstrap";
import { Toast } from "primereact/toast";
import { ProgressSpinner } from "primereact/progressspinner";
import { useLocation } from "react-router-dom";
import { useShallow } from "zustand/shallow";
import CatalogPageLayout from "../components/CatalogPageLayout";
import InventoryEditCard from "../components/inventoryEdit/InventoryEditCard";
import PageActionsRow from "../components/PageActionsRow";
import { useNotifier } from "../hooks/useNotifier";
import { useInventoryEditStore } from "../stores/InventoryEditStore";
import InventorySearchFiltersForm from "../components/InventorySearchFilters";
import type { InventorySearchFilters as InventorySearchFiltersType } from "../utils/InventorySearchFilters";
import { buildInventoryCardGroups, type InventoryCardGroup } from "../utils/buildInventoryCardGroups";
import { printInventoryCards } from "../utils/printInventory";

const EMPTY_FILTERS: InventorySearchFiltersType = {
  itemNumber: "",
  description: "",
  colorName: "",
  seasonName: "",
};


export default function InventoryEdit() {
  const toastRef = useRef<Toast>(null);
  const notify = useNotifier(toastRef);
  const getErrorMessage = (err: unknown, fallback: string) =>
    err instanceof Error ? err.message : fallback;
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
        <InventorySearchFiltersForm
          filters={form}
          seasons={seasons}
          searching={searching}
          onChange={setForm}
          onSubmit={handleSearch}
          onClear={handleClear}
        />
      </div>

      {loading ? (
        <div className="d-flex justify-content-center py-5">
          <ProgressSpinner />
        </div>
      ) : null}

      {!loading && !searching && results.length === 0 && (
        <div className="text-center text-muted">Search to load styles and start editing.</div>
      )}

      {searching && (
        <div className="d-flex justify-content-center py-4">
          <ProgressSpinner />
        </div>
      )}

      <PageActionsRow className="inventory-cards-toolbar">
        <Button
          type="button"
          className="btn-info btn-outlined"
          onClick={handleDownloadAll}
          disabled={cardGroups.length === 0}
        >
          <i className="pi pi-download" aria-hidden="true" />
          Download All
        </Button>
        <Button
          type="button"
          className="btn-neutral btn-outlined btn-icon"
          onClick={() => setCardColumns((prev) => (prev === 2 ? 1 : 2))}
          aria-label={cardColumns === 2 ? "Switch to one column" : "Switch to two columns"}
          title={cardColumns === 2 ? "Switch to one column" : "Switch to two columns"}
        >
          <i
            className={cardColumns === 2 ? "pi pi-th-large" : "pi pi-bars"}
            aria-hidden="true"
          />
        </Button>
      </PageActionsRow>

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
    </CatalogPageLayout>
  );
}

