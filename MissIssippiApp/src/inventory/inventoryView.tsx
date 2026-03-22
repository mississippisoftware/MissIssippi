import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { Form, Modal } from "react-bootstrap";
import { ProgressSpinner } from "primereact/progressspinner";
import { Toast } from "primereact/toast";
import { useLocation } from "react-router-dom";
import { useShallow } from "zustand/shallow";
import ActiveFilterChips, { type ActiveFilterChip } from "../components/ActiveFilterChips";
import ActionButton from "../components/ActionButton";
import CatalogPageLayout from "../components/CatalogPageLayout";
import InventorySearchFiltersForm from "../components/InventorySearchFilters";
import PageActionsMenu from "../components/PageActionsMenu";
import ViewToggle from "../components/ViewToggle";
import { type InventoryCardMeta } from "../components/inventoryEdit/InventoryEditCard";
import { useNotifier } from "../hooks/useNotifier";
import CatalogService, { type ItemView } from "../service/CatalogService";
import InventoryLabels from "./InventoryLabels";
import { InventoryCardsSection, InventoryListSection, type InventoryStyleGroupView } from "./InventoryViewSections";
import { useInventoryEditStore } from "../stores/inventory";
import type { FilterableColumn } from "./InventoryTable";
import type { InventorySearchFilters as InventorySearchFiltersType } from "../utils/InventorySearchFilters";
import { buildInventoryCardGroups, type InventoryCardGroup } from "../utils/buildInventoryCardGroups";
import { getErrorMessage } from "../utils/errors";
import { exportInventoryToExcel } from "../utils/ExportInventoryToExcel";
import { printInventoryCards, printInventoryList } from "../utils/printInventory";
import { formatPrice } from "../utils/formatters";

const EMPTY_FILTERS: InventorySearchFiltersType = {
  itemNumber: "",
  description: "",
  colorName: "",
  seasonName: "",
};

const INVENTORY_EXPORT_COLUMNS: FilterableColumn[] = [
  { field: "seasonName", header: "Season", filterMatchMode: "startsWith", className: "col-season" },
  { field: "itemNumber", header: "Style #", filterMatchMode: "startsWith", className: "col-style" },
  { field: "description", header: "Description", filterMatchMode: "contains", className: "col-description" },
  { field: "colorName", header: "Color", filterMatchMode: "contains", className: "col-color" },
];

type InventoryViewMode = "list" | "cards";

type PendingTransition =
  | { type: "view"; nextViewMode: InventoryViewMode }
  | { type: "edit-item"; itemNumber: string }
  | { type: "leave-edit" }
  | { type: "search"; filters: InventorySearchFiltersType }
  | { type: "clear" };

type InventoryViewProps = {
  initialViewMode?: InventoryViewMode;
};


const toCardMeta = (item: ItemView): InventoryCardMeta => ({
  itemId: item.itemId,
  inProduction: item.inProduction,
  wholesalePrice: item.wholesalePrice ?? null,
  retailPrice: item.costPrice ?? null,
  seasonName: item.seasonName ?? undefined,
});

const hasStock = (rows: InventoryCardGroup["rows"]) =>
  rows.some((row) => Object.values(row.sizes ?? {}).some((cell) => Number(cell?.qty ?? 0) > 0));

const getStockTotal = (rows: InventoryCardGroup["rows"]) =>
  rows.reduce(
    (groupTotal, row) =>
      groupTotal + Object.values(row.sizes ?? {}).reduce((rowTotal, cell) => rowTotal + Number(cell?.qty ?? 0), 0),
    0
  );

const getPromptContext = (transition: PendingTransition | null, itemNumber: string | null) => {
  if (!transition) {
    return {
      message: "",
      cancelLabel: "Cancel",
      discardLabel: "Discard",
      saveLabel: "Save",
    };
  }

  if (transition.type === "view" && transition.nextViewMode === "list") {
    return {
      message: `You have unsaved changes on style ${itemNumber ?? ""}. Save or discard changes before returning to List view.`,
      cancelLabel: "Stay Here",
      discardLabel: "Discard & Leave",
      saveLabel: "Save & Leave",
    };
  }

  if (transition.type === "leave-edit") {
    return {
      message: `You have unsaved changes on style ${itemNumber ?? ""}. Save or discard changes before leaving edit mode.`,
      cancelLabel: "Cancel",
      discardLabel: "Discard",
      saveLabel: "Save",
    };
  }

  return {
    message: `You have unsaved changes on style ${itemNumber ?? ""}. Save or discard changes before continuing.`,
    cancelLabel: "Cancel",
    discardLabel: "Discard",
    saveLabel: "Save",
  };
};

export default function InventoryView({ initialViewMode = "list" }: InventoryViewProps) {
  const toastRef = useRef<Toast>(null);
  const notify = useNotifier(toastRef);
  const location = useLocation();

  const autoSearchRef = useRef<string | null>(null);
  const didBootstrapSearchRef = useRef(false);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

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
  const [viewMode, setViewMode] = useState<InventoryViewMode>(initialViewMode);
  const [cardColumns] = useState<1 | 2>(1);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [itemMetaByItemNumber, setItemMetaByItemNumber] = useState<Record<string, InventoryCardMeta>>({});
  const [activeEditableItemNumber, setActiveEditableItemNumber] = useState<string | null>(null);
  const [focusItemNumber, setFocusItemNumber] = useState<string | null>(null);
  const [pendingTransition, setPendingTransition] = useState<PendingTransition | null>(null);
  const [applyingPending, setApplyingPending] = useState(false);
  const [showLabelsModal, setShowLabelsModal] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  useEffect(() => {
    initializeSizes();
    fetchSeasons();
  }, [initializeSizes, fetchSeasons]);

  useEffect(() => {
    setForm({ ...EMPTY_FILTERS, ...(lastFilters ?? {}) });
  }, [lastFilters]);

  const loadItemMeta = useCallback(async () => {
    try {
      const items = await CatalogService.getItems();
      const next: Record<string, InventoryCardMeta> = {};
      items.forEach((item) => {
        next[item.itemNumber] = toCardMeta(item);
      });
      setItemMetaByItemNumber(next);
    } catch (err: unknown) {
      notify("error", "Load failed", getErrorMessage(err, "Unable to load style metadata."));
    }
  }, [notify]);

  useEffect(() => {
    void loadItemMeta();
  }, [loadItemMeta]);

  const executeSearch = useCallback(
    async (filters: InventorySearchFiltersType) => {
      try {
        const data = await search(filters);
        if (data.length === 0) {
          notify("info", "No results", "No styles found for that search.");
        }
        return data;
      } catch (err: unknown) {
        notify("error", "Search failed", getErrorMessage(err, "Unable to load inventory."));
        throw err;
      }
    },
    [notify, search]
  );

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

    setForm(nextFilters);
    void executeSearch(nextFilters);
  }, [executeSearch, location.search]);

  useEffect(() => {
    if (didBootstrapSearchRef.current || autoSearchRef.current) {
      return;
    }
    didBootstrapSearchRef.current = true;

    const initialFilters = { ...EMPTY_FILTERS, ...(lastFilters ?? {}) };
    setForm(initialFilters);
    void executeSearch(initialFilters);
  }, [executeSearch, lastFilters]);

  const filteredResults = useMemo(() => {
    const groups = buildInventoryCardGroups(results);
    if (!inStockOnly) {
      return groups.flatMap((group) => group.rows);
    }

    return groups.filter((group) => hasStock(group.rows)).flatMap((group) => group.rows);
  }, [inStockOnly, results]);

  const cardGroups = useMemo(() => buildInventoryCardGroups(filteredResults), [filteredResults]);

  useEffect(() => {
    if (!activeEditableItemNumber) {
      return;
    }
    if (cardGroups.some((group) => group.itemNumber === activeEditableItemNumber)) {
      return;
    }
    setActiveEditableItemNumber(null);
  }, [activeEditableItemNumber, cardGroups]);

  const styleGroups = useMemo<InventoryStyleGroupView[]>(() => {
    return cardGroups
      .map((group) => {
        const itemMeta = itemMetaByItemNumber[group.itemNumber];

        return {
          itemNumber: group.itemNumber,
          description: group.description ?? "",
          active: itemMeta?.inProduction ?? false,
          wholesalePrice: itemMeta?.wholesalePrice ?? null,
          retailPrice: itemMeta?.retailPrice ?? null,
          stockTotal: getStockTotal(group.rows),
          rows: group.rows,
        };
      })
      .sort((a, b) => a.itemNumber.localeCompare(b.itemNumber));
  }, [cardGroups, itemMetaByItemNumber]);

  useEffect(() => {
    if (viewMode !== "cards" || !focusItemNumber) {
      return;
    }

    const timer = window.setTimeout(() => {
      const element = cardRefs.current[focusItemNumber];
      element?.scrollIntoView({ behavior: "smooth", block: "start" });
      element?.focus();
      setFocusItemNumber(null);
    }, 120);

    return () => window.clearTimeout(timer);
  }, [cardGroups, focusItemNumber, viewMode]);

  const activeItemDirty = activeEditableItemNumber
    ? dirtyItemsSet.has(activeEditableItemNumber)
    : false;

  const applyTransition = useCallback(
    async (transition: PendingTransition) => {
      if (transition.type === "view") {
        setViewMode(transition.nextViewMode);
        if (transition.nextViewMode === "list") {
          setActiveEditableItemNumber(null);
        }
        return;
      }

      if (transition.type === "edit-item") {
        setViewMode("cards");
        setActiveEditableItemNumber(transition.itemNumber);
        setFocusItemNumber(transition.itemNumber);
        return;
      }

      if (transition.type === "leave-edit") {
        setActiveEditableItemNumber(null);
        return;
      }

      if (transition.type === "search") {
        await executeSearch(transition.filters);
        return;
      }

      setForm(EMPTY_FILTERS);
      await executeSearch(EMPTY_FILTERS);
    },
    [executeSearch]
  );

  const requestTransition = useCallback(
    (transition: PendingTransition) => {
      if (activeItemDirty) {
        setPendingTransition(transition);
        return;
      }
      void applyTransition(transition);
    },
    [activeItemDirty, applyTransition]
  );

  const handleSearch = useCallback(
    (filters: InventorySearchFiltersType) => {
      requestTransition({ type: "search", filters });
    },
    [requestTransition]
  );

  const handleClear = () => {
    setInStockOnly(false);
    setShowAdvancedFilters(false);
    requestTransition({ type: "clear" });
  };

  const handleRequestViewChange = (nextViewMode: InventoryViewMode) => {
    if (nextViewMode === viewMode) {
      return;
    }
    requestTransition({ type: "view", nextViewMode });
  };

  const handleRequestEditItem = (itemNumber: string) => {
    requestTransition({ type: "edit-item", itemNumber });
  };

  const handleCardClickToEdit = (itemNumber: string, event: ReactMouseEvent<HTMLDivElement>) => {
    if (activeEditableItemNumber) {
      return;
    }

    const targetNode = event.target as Node | null;
    const targetElement =
      targetNode instanceof Element
        ? targetNode
        : targetNode?.parentElement ?? null;

    const clickedInteractiveControl = targetElement?.closest(
      "button, a, input, select, textarea, label, [role='button'], [data-disable-card-activate='true']"
    );
    if (clickedInteractiveControl) {
      return;
    }

    handleRequestEditItem(itemNumber);
  };

  const handleDoneEditing = (itemNumber: string) => {
    if (activeEditableItemNumber !== itemNumber) {
      return;
    }
    requestTransition({ type: "leave-edit" });
  };

  const handleSave = async (itemNumber: string) => {
    try {
      await saveByItem(itemNumber);
      notify("success", "Saved", `Saved changes for ${itemNumber}.`);
      void loadItemMeta();
    } catch (err: unknown) {
      notify("error", "Error", getErrorMessage(err, "Failed to save style."));
    }
  };

  const handleDiscard = (itemNumber: string) => {
    discardChangesByItem(itemNumber);
    notify("info", "Discarded", `Discarded unsaved changes for ${itemNumber}.`);
  };

  const handleConfirmSaveAndContinue = async () => {
    if (!pendingTransition) {
      return;
    }

    setApplyingPending(true);
    try {
      if (activeEditableItemNumber && dirtyItemsSet.has(activeEditableItemNumber)) {
        await saveByItem(activeEditableItemNumber);
        notify("success", "Saved", `Saved changes for ${activeEditableItemNumber}.`);
        void loadItemMeta();
      }
      await applyTransition(pendingTransition);
      setPendingTransition(null);
    } catch (err: unknown) {
      notify("error", "Error", getErrorMessage(err, "Unable to continue."));
    } finally {
      setApplyingPending(false);
    }
  };

  const handleConfirmDiscardAndContinue = async () => {
    if (!pendingTransition) {
      return;
    }

    setApplyingPending(true);
    try {
      if (activeEditableItemNumber && dirtyItemsSet.has(activeEditableItemNumber)) {
        discardChangesByItem(activeEditableItemNumber);
      }
      await applyTransition(pendingTransition);
      setPendingTransition(null);
    } catch (err: unknown) {
      notify("error", "Error", getErrorMessage(err, "Unable to continue."));
    } finally {
      setApplyingPending(false);
    }
  };

  const handleDownloadAllCards = () => {
    if (cardGroups.length === 0) {
      notify("info", "No results", "Search and load styles before downloading.");
      return;
    }

    printInventoryCards(
      {
        subtitle: "Inventory",
        sizeColumns,
        groups: cardGroups,
      },
      {
        onError: () => notify("error", "Error", "Unable to render PDF preview."),
      }
    );
  };

  const handleDownloadCard = (group: InventoryCardGroup) => {
    printInventoryCards(
      {
        subtitle: `Inventory ${group.itemNumber}`,
        sizeColumns,
        groups: [group],
      },
      {
        onError: () => notify("error", "Error", "Unable to render PDF preview."),
      }
    );
  };

  const handleExportList = () => {
    exportInventoryToExcel({
      rows: filteredResults,
      sizeColumns,
      uiColumns: INVENTORY_EXPORT_COLUMNS,
      title: "Inventory Download",
      sheetName: "Inventory",
      filename: "inventory.xlsx",
    });
  };

  const handlePrintList = () => {
    printInventoryList({
      rows: filteredResults,
      sizeColumns,
      uiColumns: INVENTORY_EXPORT_COLUMNS,
      title: "Inventory List",
      subtitle: "Grouped by style",
    });
  };

  const handlePrintCards = () => {
    printInventoryCards(
      {
        subtitle: "Inventory Cards",
        sizeColumns,
        groups: cardGroups,
      },
      {
        onError: () => notify("error", "Error", "Unable to render PDF preview."),
      }
    );
  };

  const hasResults = styleGroups.length > 0;
  const promptContext = getPromptContext(pendingTransition, activeEditableItemNumber);
  const activeChips = useMemo<ActiveFilterChip[]>(() => {
    const chips: ActiveFilterChip[] = [];
    if (form.itemNumber?.trim()) {
      chips.push({
        key: "style",
        label: "Style #",
        value: form.itemNumber.trim(),
        onRemove: () => {
          const next = { ...form, itemNumber: "" };
          setForm(next);
          handleSearch(next);
        },
      });
    }
    if (form.seasonName?.trim()) {
      chips.push({
        key: "season",
        label: "Season",
        value: form.seasonName.trim(),
        onRemove: () => {
          const next = { ...form, seasonName: "" };
          setForm(next);
          handleSearch(next);
        },
      });
    }
    if (form.description?.trim()) {
      chips.push({
        key: "description",
        label: "Description",
        value: form.description.trim(),
        onRemove: () => {
          const next = { ...form, description: "" };
          setForm(next);
          handleSearch(next);
        },
      });
    }
    if (form.colorName?.trim()) {
      chips.push({
        key: "color",
        label: "Color",
        value: form.colorName.trim(),
        onRemove: () => {
          const next = { ...form, colorName: "" };
          setForm(next);
          handleSearch(next);
        },
      });
    }
    if (inStockOnly) {
      chips.push({
        key: "stock",
        label: "Stock",
        value: "In Stock Only",
        onRemove: () => setInStockOnly(false),
      });
    }
    return chips;
  }, [form, handleSearch, inStockOnly]);

  const headerActions = [
    {
      key: "labels",
      label: "Inventory Labels",
      icon: "pi pi-tags",
      onClick: () => setShowLabelsModal(true),
    },
    {
      key: "download",
      label: "Download",
      icon: "pi pi-download",
      onClick: handleExportList,
      disabled: !hasResults,
    },
    {
      key: "print",
      label: viewMode === "list" ? "Print List" : "Print Cards",
      icon: "pi pi-print",
      onClick: viewMode === "list" ? handlePrintList : handlePrintCards,
      disabled: !hasResults,
    },
    {
      key: "backToList",
      label: "Back to List",
      icon: "pi pi-arrow-left",
      onClick: () => handleRequestViewChange("list"),
      disabled: !hasResults,
      visible: viewMode === "cards",
    },
    {
      key: "downloadAll",
      label: "Download All Cards",
      icon: "pi pi-download",
      onClick: handleDownloadAllCards,
      disabled: !hasResults,
      visible: viewMode === "cards",
    },
  ];

  return (
    <CatalogPageLayout
      title="Inventory"
      subtitle="Browse by style and edit one style card at a time."
      className="catalog-page--wide inventory-unified-page"
      actionsSlot={<PageActionsMenu items={headerActions} />}
    >
      <Toast ref={toastRef} position="top-right" />

      <div className="catalog-page-toolbar inventory-unified-controls">
        <InventorySearchFiltersForm
          filters={form}
          seasons={seasons}
          searching={searching}
          showAdvanced={showAdvancedFilters}
          onChange={setForm}
          onSubmit={handleSearch}
          onClear={handleClear}
          onToggleAdvanced={() => setShowAdvancedFilters((prev) => !prev)}
          advancedFiltersExtra={
            <>
              <div className="page-filter-field page-filter-field--toggle">
                <Form.Check
                  type="switch"
                  id="inventory-in-stock-only"
                  label="In Stock Only"
                  checked={inStockOnly}
                  onChange={(event) => setInStockOnly(event.target.checked)}
                />
              </div>
              <div className="page-filter-field page-filter-field--toggle">
                <ViewToggle
                  ariaLabel="Inventory view mode"
                  leftLabel="List"
                  rightLabel="Cards"
                  leftActive={viewMode === "list"}
                  rightActive={viewMode === "cards"}
                  checked={viewMode === "cards"}
                  switchAriaLabel="Toggle card view"
                  onLeftClick={() => handleRequestViewChange("list")}
                  onRightClick={() => handleRequestViewChange("cards")}
                  onToggle={(checked) => handleRequestViewChange(checked ? "cards" : "list")}
                />
              </div>
            </>
          }
        />

        <ActiveFilterChips chips={activeChips} onClearAll={handleClear} clearLabel="Clear Filters" />
        <div className="inventory-inline-actions">
          {viewMode === "cards" ? (
            <ActionButton
              label="Back to List"
              icon="pi pi-arrow-left"
              className="btn-neutral btn-outlined"
              onClick={() => handleRequestViewChange("list")}
            />
          ) : (
            <ActionButton
              label="View Cards"
              icon="pi pi-id-card"
              className="btn-neutral btn-outlined"
              onClick={() => handleRequestViewChange("cards")}
              disabled={!hasResults}
            />
          )}
        </div>
      </div>

      {viewMode === "cards" && activeEditableItemNumber ? (
        <div className="inventory-editing-sticky">
          <span className="inventory-editing-sticky-label">Editing style</span>
          <strong>{activeEditableItemNumber}</strong>
        </div>
      ) : null}

      {loading ? (
        <div className="inventory-edit-status d-flex justify-content-center py-5">
          <ProgressSpinner />
        </div>
      ) : null}

      {!loading && searching ? (
        <div className="inventory-edit-status d-flex justify-content-center py-4">
          <ProgressSpinner />
        </div>
      ) : null}

      {!loading && !searching && !hasResults ? (
        <div className="inventory-edit-status text-center text-muted">
          Search to load styles.
        </div>
      ) : null}

      {!loading && !searching && hasResults && viewMode === "list" ? (
        <InventoryListSection
          styleGroups={styleGroups}
          sizeColumns={sizeColumns}
          onRequestEditItem={handleRequestEditItem}
          formatPrice={formatPrice}
        />
      ) : null}

      {!loading && !searching && hasResults && viewMode === "cards" ? (
        <InventoryCardsSection
          cardGroups={cardGroups}
          cardColumns={cardColumns}
          cardRefs={cardRefs}
          onCardClickToEdit={handleCardClickToEdit}
          itemMetaByItemNumber={itemMetaByItemNumber}
          activeEditableItemNumber={activeEditableItemNumber}
          sizeColumns={sizeColumns}
          onQtyChange={updateCell}
          onDownloadCard={handleDownloadCard}
          onDiscard={handleDiscard}
          onSave={(itemNumber) => {
            void handleSave(itemNumber);
          }}
          isDirty={(itemNumber) => dirtyItemsSet.has(itemNumber)}
          onDoneEditing={handleDoneEditing}
          notify={notify}
        />
      ) : null}

      <Modal
        show={showLabelsModal}
        onHide={() => setShowLabelsModal(false)}
        size="xl"
        dialogClassName="inventory-labels-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>Inventory Labels</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <InventoryLabels embedded />
        </Modal.Body>
      </Modal>

      <Modal show={pendingTransition !== null} onHide={() => setPendingTransition(null)} centered>
        <Modal.Header closeButton={!applyingPending}>
          <Modal.Title>Unsaved changes</Modal.Title>
        </Modal.Header>
        <Modal.Body>{promptContext.message}</Modal.Body>
        <Modal.Footer>
          <ActionButton
            label={promptContext.cancelLabel}
            icon="pi pi-times"
            className="btn-neutral btn-outlined"
            onClick={() => setPendingTransition(null)}
            disabled={applyingPending}
          />
          <ActionButton
            label={promptContext.discardLabel}
            icon="pi pi-trash"
            className="btn-danger btn-outlined"
            onClick={() => {
              void handleConfirmDiscardAndContinue();
            }}
            disabled={applyingPending}
          />
          <ActionButton
            label={applyingPending ? "Saving..." : promptContext.saveLabel}
            icon="pi pi-save"
            className="btn-success"
            onClick={() => {
              void handleConfirmSaveAndContinue();
            }}
            disabled={applyingPending}
          />
        </Modal.Footer>
      </Modal>
    </CatalogPageLayout>
  );
}
