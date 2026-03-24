import { useCallback, useMemo, useRef, useState } from "react";
import { Alert, Form } from "react-bootstrap";
import type { DataTableRowEditCompleteEvent, DataTableRowClickEvent } from "primereact/datatable";
import { Toast } from "primereact/toast";
import CatalogService, { type ItemColorView } from "../../service/CatalogService";
import CatalogPageLayout from "../../components/CatalogPageLayout";
import PageActionsMenu from "../../components/PageActionsMenu";
import { printItemList } from "../../utils/printCatalogLists";
import { appendSheet, createWorkbook, saveWorkbook, sheetFromAoa } from "../../utils/xlsxUtils";
import ItemsColorsColorModal from "../../items/ItemsColorsColorModal";
import ItemsColorsColorReviewModal from "../../items/ItemsColorsColorReviewModal";
import type { ItemListRow } from "../../items/itemsColorsTypes";
import { getReadableTextColor, normalizeName } from "../../items/itemsColorsUtils";
import ItemsTable from "./ItemsTable";
import ItemUploadActions from "./ItemUploadActions";
import { ItemsColorsAdminDeleteModal, ItemsColorsDuplicateModal } from "./ItemsColorsDialogs";
import { useItemList } from "./useItemList";
import { useColorResolution } from "./useColorResolution";
import { useItemUpload } from "./useItemUpload";
import { useColorUpload } from "./useColorUpload";
import InventorySearchFiltersForm from "../../components/InventorySearchFilters";
import { useNotifier } from "../../hooks/useNotifier";
import { getErrorMessage } from "../../utils/errors";
import { formatPrice } from "../../utils/formatters";
import { dedupeItemColorsByColorId } from "../../utils/itemColorUtils";

export default function ItemsColors() {
  const toastRef = useRef<Toast | null>(null);
  const notify = useNotifier(toastRef);

  const {
    seasons,
    colors,
    setColors,
    collections,
    setCollections,
    lookupError,
    loadingLookups,
    itemList,
    setItemList,
    itemListLoading,
    filteredItems,
    itemKeyMap,
    buildItemKey,
    loadItemList,
    expandedRows,
    setExpandedRows,
    selectedItem,
    setSelectedItem,
    editingRows,
    setEditingRows,
    tempItemId,
    setTempItemId,
    activeFilter,
    setActiveFilter,
    colorModalItem,
    setColorModalItem,
    searchForm,
    setSearchForm,
    searchFilters,
    applySearchFilters,
    clearSearchFilters,
    handleItemSave,
    handleToggleColorActive,
  } = useItemList({ toastRef });

  const [showColorModal, setShowColorModal] = useState(false);
  const [showAdminDeleteModal, setShowAdminDeleteModal] = useState(false);
  const [adminDeleteMode, setAdminDeleteMode] = useState<"selected" | "filtered" | null>(null);
  const [adminDeletePassword, setAdminDeletePassword] = useState("");
  const [adminDeleteSubmitting, setAdminDeleteSubmitting] = useState(false);
  const uploadActionRef = useRef<{
    openItemUpload: () => void;
    openColorUpload: () => void;
  } | null>(null);

  const activeColorItem = colorModalItem ?? selectedItem;

  const {
    normalizedColors,
    colorInput,
    setColorInput,
    colorCollectionInput,
    setColorCollectionInput,
    colorPantoneInput,
    setColorPantoneInput,
    colorHexInput,
    setColorHexInput,
    pendingColors,
    setPendingColors,
    savingColors,
    colorResolutionMap,
    setColorResolutionMap,
    colorReviewItems,
    setColorReviewItems,
    setReviewContext,
    showColorReview,
    setShowColorReview,
    buildColorResolutions,
    handleAddColor,
    handleSaveColors,
    handleReviewConfirm: handleReviewConfirmBase,
    handleReviewClose,
    closeColorModal,
  } = useColorResolution({
    colors,
    activeColorItem,
    setColors,
    loadItemList,
    toastRef,
    setShowColorModal,
    setColorModalItem,
  });


  const handleCopyColorName = useCallback(
    async (colorName: string) => {
      const text = (colorName ?? "").trim();
      if (!text) {
        notify("warn", "Copy failed", "Color name is empty.");
        return;
      }

      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(text);
        } else {
          const textarea = document.createElement("textarea");
          textarea.value = text;
          textarea.setAttribute("readonly", "");
          textarea.style.position = "absolute";
          textarea.style.left = "-9999px";
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand("copy");
          document.body.removeChild(textarea);
        }
        notify("success", "Copied", `Copied color name: ${text}`);
      } catch (err: unknown) {
        console.error(err);
        notify("error", "Copy failed", "Unable to copy color name.");
      }
    },
    [notify]
  );

  const handleAddCollectionFromUploadModal = useCallback(
    async (collectionName: string) => {
      const trimmed = collectionName.trim();
      if (!trimmed) {
        throw new Error("Enter a collection name.");
      }
      if (collections.some((entry) => normalizeName(entry.collectionName) === normalizeName(trimmed))) {
        throw new Error("That collection already exists.");
      }

      const created = await CatalogService.addCollection({ collectionName: trimmed });
      setCollections((prev) => {
        if (prev.some((entry) => entry.collectionId === created.collectionId)) {
          return prev;
        }
        return [...prev, created].sort((a, b) => a.collectionName.localeCompare(b.collectionName));
      });
      notify("success", "Collection added", `${created.collectionName} is now available.`);
      return created.collectionName;
    },
    [collections, notify, setCollections]
  );

  const {
    defaultSeasonId,
    setDefaultSeasonId,
    fileName,
    uploadRows,
    parseErrors,
    requiresSeasonSelection,
    uploading,
    uploadSummary,
    showDuplicateModal,
    setShowDuplicateModal,
    duplicateRows,
    updateExistingItems,
    handleDownloadTemplate,
    handleUploadFile,
    handlePrepareUpload,
    executeUpload,
  } = useItemUpload({
    seasons,
    itemKeyMap,
    buildItemKey,
    normalizedColors,
    colorResolutionMap,
    buildColorResolutions,
    setColorResolutionMap,
    setColorReviewItems,
    setReviewContext,
    setShowColorReview,
    setColors,
    loadItemList,
  });

  const {
    colorDefaultSeasonId,
    setColorDefaultSeasonId,
    colorFileName,
    colorUploadRows,
    colorParseErrors,
    colorUploading,
    colorUploadSummary,
    handleDownloadItemColors,
    handleColorUploadFile,
    handlePrepareColorUpload,
    executeColorUpload,
  } = useColorUpload({
    seasons,
    itemList,
    filteredItems,
    itemKeyMap,
    buildItemKey,
    normalizedColors,
    colorResolutionMap,
    buildColorResolutions,
    setColorResolutionMap,
    setColorReviewItems,
    setReviewContext,
    setShowColorReview,
    setColors,
    loadItemList,
  });

  const resolveSeasonName = useCallback(
    (seasonId: number | string) =>
      seasons.find((season) => season.seasonId === Number(seasonId))?.seasonName ?? "",
    [seasons]
  );

  const seasonSummary = useMemo(() => {
    const selectedSeason = (searchFilters.seasonName ?? "").trim();
    if (selectedSeason) {
      return selectedSeason;
    }
    const names = Array.from(
      new Set(filteredItems.map((row) => row.seasonName).filter((name): name is string => Boolean(name)))
    );
    return names.length ? names.join(", ") : "All seasons";
  }, [filteredItems, searchFilters.seasonName]);

  const handleExpandAll = () => {
    const next: Record<string, boolean> = {};
    filteredItems.forEach((row) => {
      if (row.itemId > 0) {
        next[String(row.itemId)] = true;
      }
    });
    setExpandedRows(next);
  };

  const handleCollapseAll = () => {
    setExpandedRows({});
  };

  const handleAddItemRow = () => {
    const newId = tempItemId;
    setTempItemId((prev) => prev - 1);
    const selectedSeasonName = (searchFilters.seasonName ?? "").trim();
    const defaultSeason =
      seasons.find((season) => season.seasonName === selectedSeasonName) ?? seasons[0];
    const newRow: ItemListRow = {
      itemId: newId,
      itemNumber: "",
      description: "",
      costPrice: null,
      wholesalePrice: null,
      weight: null,
      seasonId: defaultSeason?.seasonId ?? 0,
      seasonName: defaultSeason?.seasonName ?? "",
      inProduction: false,
      colors: [],
    };
    setItemList((prev) => [newRow, ...prev]);
    setEditingRows((prev) => ({ ...prev, [String(newId)]: true }));
    setSelectedItem(newRow);
  };

  const openColorModal = (row: ItemListRow) => {
    setSelectedItem(row);
    setColorModalItem(row);
    setShowColorModal(true);
  };

  const handleRowEditComplete = async (event: DataTableRowEditCompleteEvent) => {
    const row = event.newData as ItemListRow;
    const saved = await handleItemSave(row);
    if (!saved) {
      setEditingRows((prev) => ({ ...prev, [String(row.itemId)]: true }));
      return;
    }
    setEditingRows((prev) => {
      const next = { ...prev };
      delete next[String(row.itemId)];
      return next;
    });
  };

  const handleRowEditCancel = (event: unknown) => {
    const row = (event as { data?: ItemListRow })?.data;
    if (!row) return;
    if (row.itemId < 0) {
      setItemList((prev) => prev.filter((entry) => entry.itemId !== row.itemId));
      if (selectedItem?.itemId === row.itemId) {
        setSelectedItem(null);
      }
    }
  };

  const handleRowEditChange = (event: unknown) => {
    const next = (event as { data?: Record<string, boolean> })?.data;
    setEditingRows(next ?? {});
  };

  const normalizeExpandedRows = (expanded: unknown) => {
    if (Array.isArray(expanded)) {
      const next: Record<string, boolean> = {};
      expanded.forEach((row) => {
        const itemId = (row as ItemListRow | null)?.itemId;
        if (typeof itemId === "number") {
          next[String(itemId)] = true;
        }
      });
      return next;
    }
    return (expanded as Record<string, boolean> | null) ?? {};
  };

  const toggleRowExpansion = (row: ItemListRow) => {
    if (!row || row.itemId <= 0) return;
    setExpandedRows((prev: Record<string, boolean>) => {
      const key = String(row.itemId);
      const next = { ...(prev ?? {}) };
      if (next[key]) {
        delete next[key];
      } else {
        next[key] = true;
      }
      return next;
    });
  };

  const handleRowClick = (event: DataTableRowClickEvent) => {
    const target = event.originalEvent?.target as HTMLElement | null;
    if (
      target?.closest(
        "button, a, input, select, textarea, .p-row-editor-init, .p-row-editor-save, .p-row-editor-cancel, .p-column-resizer, .p-row-toggler"
      )
    ) {
      return;
    }
    toggleRowExpansion(event.data as ItemListRow);
  };

  const getActiveColors = (colorsForItem: ItemColorView[]) =>
    dedupeItemColorsByColorId(colorsForItem).filter((color) => color.itemColorActive !== false);

  const handleDownloadItemList = () => {
    const colorLists = filteredItems.map((row) =>
      dedupeItemColorsByColorId(row.colors ?? []).map((color) => color.colorName ?? "")
    );
    const maxColorColumns = Math.max(1, ...colorLists.map((colors) => colors.length));
    const colorHeaders = Array.from({ length: maxColorColumns }, (_, index) => `Color ${index + 1}`);
    const headers = [
      "Season",
      "Style Number",
      "Description",
      "Active",
      "Wholesale",
      "Retail",
      ...colorHeaders,
    ];
    const rows = filteredItems.map((row, index) => {
      const colors = colorLists[index] ?? [];
      return [
        row.seasonName ?? "",
        row.itemNumber ?? "",
        row.description ?? "",
        row.inProduction ? "Yes" : "No",
        row.wholesalePrice ?? "",
        row.costPrice ?? "",
        ...Array.from({ length: maxColorColumns }, (_, colorIndex) => colors[colorIndex] ?? ""),
      ];
    });
    const worksheet = sheetFromAoa([headers, ...rows]);
    const workbook = createWorkbook();
    appendSheet(workbook, worksheet, "Item List");
    saveWorkbook(workbook, "item_list");
  };

  const handlePrintItemList = () => {
    printItemList({ rows: filteredItems, formatPrice, getUniqueColors: dedupeItemColorsByColorId });
  };

  const handleRefreshItemList = useCallback(async () => {
    clearSearchFilters();
    setActiveFilter("");
    await loadItemList();
  }, [clearSearchFilters, loadItemList, setActiveFilter]);

  const handleClearFilters = useCallback(() => {
    clearSearchFilters();
    setActiveFilter("");
  }, [clearSearchFilters, setActiveFilter]);

  const handleReviewConfirm = () => {
    handleReviewConfirmBase({
      onUploadResolve: (rows, resolutionMap) =>
        executeUpload(rows, resolutionMap, { updateExisting: updateExistingItems }),
      onColorUploadResolve: executeColorUpload,
    });
  };

  const getAdminDeleteTargets = useCallback(
    (mode: "selected" | "filtered"): ItemListRow[] => {
      if (mode === "selected") {
        return selectedItem && selectedItem.itemId > 0 ? [selectedItem] : [];
      }
      const seen = new Set<number>();
      return filteredItems.filter((row) => {
        if (row.itemId <= 0 || seen.has(row.itemId)) {
          return false;
        }
        seen.add(row.itemId);
        return true;
      });
    },
    [filteredItems, selectedItem]
  );

  const adminDeleteTargets = useMemo(
    () => (adminDeleteMode ? getAdminDeleteTargets(adminDeleteMode) : []),
    [adminDeleteMode, getAdminDeleteTargets]
  );

  const openAdminDeleteModal = (mode: "selected" | "filtered") => {
    const targets = getAdminDeleteTargets(mode);
    if (targets.length === 0) {
      notify(
        "warn",
        mode === "selected" ? "No style selected" : "No filtered styles",
        mode === "selected"
          ? "Select a saved style first."
          : "No saved styles are available in the current filter."
      );
      return;
    }
    setAdminDeleteMode(mode);
    setAdminDeletePassword("");
    setShowAdminDeleteModal(true);
  };

  const closeAdminDeleteModal = () => {
    setShowAdminDeleteModal(false);
    setAdminDeleteMode(null);
    setAdminDeletePassword("");
  };

  const handleConfirmAdminDelete = async () => {
    const targets = adminDeleteMode ? getAdminDeleteTargets(adminDeleteMode) : [];
    const itemIds = targets.map((row) => row.itemId).filter((id) => id > 0);
    if (itemIds.length === 0) {
      notify("warn", "Nothing to delete", "No saved styles were found for deletion.");
      closeAdminDeleteModal();
      return;
    }
    if (!adminDeletePassword.trim()) {
      notify("warn", "Password required", "Enter the admin delete password.");
      return;
    }

    setAdminDeleteSubmitting(true);
    try {
      const result = await CatalogService.adminHardDeleteItems({
        itemIds,
        password: adminDeletePassword,
      });

      setExpandedRows({});
      setShowColorModal(false);
      setColorModalItem(null);
      await loadItemList();

      notify(
        "success",
        "Hard delete complete",
        `Deleted ${result.deletedItemCount} style(s), ${result.deletedItemColorCount} style-color link(s), ${result.deletedSkuCount} SKU(s), and ${result.deletedInventoryCount} inventory row(s).`
      );

      if (result.missingItemIds.length > 0) {
        notify(
          "warn",
          "Some styles were already missing",
          `${result.missingItemIds.length} requested style id(s) were not found.`
        );
      }

      closeAdminDeleteModal();
    } catch (err: unknown) {
      console.error(err);
      notify("error", "Hard delete failed", getErrorMessage(err, "Unable to delete styles."));
    } finally {
      setAdminDeleteSubmitting(false);
    }
  };

  const headerActions = [
    {
      key: "addItem",
      label: "Add Item",
      icon: "pi pi-plus",
      onClick: handleAddItemRow,
      disabled: loadingLookups,
    },
    {
      key: "refreshList",
      label: itemListLoading ? "Refreshing..." : "Refresh List",
      icon: "pi pi-refresh",
      onClick: () => {
        void handleRefreshItemList();
      },
      disabled: itemListLoading,
    },
    {
      key: "expandAll",
      label: "Expand All",
      icon: "pi pi-plus",
      onClick: handleExpandAll,
      disabled: filteredItems.length === 0,
    },
    {
      key: "collapseAll",
      label: "Collapse All",
      icon: "pi pi-minus",
      onClick: handleCollapseAll,
      disabled: Object.keys(expandedRows).length === 0,
    },
    {
      key: "uploadNewItems",
      label: "Upload New Items",
      icon: "pi pi-upload",
      onClick: () => uploadActionRef.current?.openItemUpload(),
      separatorBefore: true,
    },
    {
      key: "uploadItemColors",
      label: "Upload Item Colors",
      icon: "pi pi-upload",
      onClick: () => uploadActionRef.current?.openColorUpload(),
    },
    {
      key: "downloadItems",
      label: "Download Item List",
      icon: "pi pi-download",
      onClick: handleDownloadItemList,
      separatorBefore: true,
    },
    {
      key: "printItems",
      label: "Print Item List",
      icon: "pi pi-print",
      onClick: handlePrintItemList,
    },
    {
      key: "adminDeleteSelected",
      label: "Admin Delete Selected",
      icon: "pi pi-trash",
      onClick: () => openAdminDeleteModal("selected"),
      disabled: !selectedItem || selectedItem.itemId <= 0,
      separatorBefore: true,
    },
    {
      key: "adminDeleteFiltered",
      label: "Admin Delete All Filtered",
      icon: "pi pi-exclamation-triangle",
      onClick: () => openAdminDeleteModal("filtered"),
      disabled: filteredItems.every((row) => row.itemId <= 0),
    },
  ];

  return (
    <CatalogPageLayout
      title="Item List"
      subtitle={`Seasons: ${seasonSummary}`}
      className="catalog-page--wide mt-3"
      actionsSlot={
        <>
          <PageActionsMenu items={headerActions} />
          <ItemUploadActions
            seasons={seasons}
            loadingLookups={loadingLookups}
            fileName={fileName}
            uploadRows={uploadRows}
            parseErrors={parseErrors}
            requiresSeasonSelection={requiresSeasonSelection}
            uploadSummary={uploadSummary}
            uploading={uploading}
            defaultSeasonId={defaultSeasonId}
            setDefaultSeasonId={setDefaultSeasonId}
            handleDownloadTemplate={handleDownloadTemplate}
            handleUploadFile={handleUploadFile}
            handlePrepareUpload={() => handlePrepareUpload()}
            colorDefaultSeasonId={colorDefaultSeasonId}
            setColorDefaultSeasonId={setColorDefaultSeasonId}
            handleDownloadItemColors={handleDownloadItemColors}
            colorFileName={colorFileName}
            colorUploadRows={colorUploadRows}
            colorParseErrors={colorParseErrors}
            colorUploadSummary={colorUploadSummary}
            colorUploading={colorUploading}
            handleColorUploadFile={handleColorUploadFile}
            handlePrepareColorUpload={handlePrepareColorUpload}
            onAddCollection={handleAddCollectionFromUploadModal}
            hideInlineTriggers
            onRegisterActions={(actions) => {
              uploadActionRef.current = actions;
            }}
          />
        </>
      }
    >
      <Toast ref={toastRef} position="top-right" />

      {lookupError && <Alert variant="danger">{lookupError}</Alert>}

      <div className="catalog-page-toolbar inventory-edit-header-actions">
        <InventorySearchFiltersForm
          filters={searchForm}
          seasons={seasons}
          searching={itemListLoading || loadingLookups}
          onChange={setSearchForm}
          onSubmit={applySearchFilters}
          onClear={handleClearFilters}
          advancedFiltersExtra={
            <div className="page-filter-field">
              <Form.Label className="page-filters-label">Active</Form.Label>
              <Form.Select
                value={activeFilter}
                onChange={(event) => setActiveFilter(event.target.value)}
                aria-label="Active status"
              >
                <option value="">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Form.Select>
            </div>
          }
        />
      </div>

      <div className="items-colors-layout items-colors-layout--single">
        <ItemsTable
          seasons={seasons}
          itemListLoading={itemListLoading}
          filteredItems={filteredItems}
          selectedItem={selectedItem}
          setSelectedItem={setSelectedItem}
          editingRows={editingRows}
          onRowEditChange={handleRowEditChange}
          onRowEditComplete={handleRowEditComplete}
          onRowEditCancel={handleRowEditCancel}
          expandedRows={expandedRows}
          setExpandedRows={setExpandedRows}
          normalizeExpandedRows={normalizeExpandedRows}
          onRowClick={handleRowClick}
          resolveSeasonName={resolveSeasonName}
          formatPrice={formatPrice}
          openColorModal={openColorModal}
          getUniqueColors={getActiveColors}
          getReadableTextColor={getReadableTextColor}
          onCopyColorName={handleCopyColorName}
        />
      </div>

      <ItemsColorsColorModal
        form={{
          collections,
          colorInput,
          colorCollectionInput,
          colorPantoneInput,
          colorHexInput,
          onColorInputChange: setColorInput,
          onCollectionChange: setColorCollectionInput,
          onPantoneChange: setColorPantoneInput,
          onHexChange: setColorHexInput,
        }}
        state={{
          show: showColorModal,
          activeItemLabel: activeColorItem
            ? `Edit colors for ${activeColorItem.itemNumber}`
            : "Edit colors",
          isLocked: !activeColorItem || activeColorItem.itemId <= 0,
          pendingColors,
          currentColors: activeColorItem ? dedupeItemColorsByColorId(activeColorItem.colors ?? []) : [],
          saving: savingColors,
          getReadableTextColor,
        }}
        actions={{
          onClose: closeColorModal,
          onSave: handleSaveColors,
          onAddColor: handleAddColor,
          onToggleActive: handleToggleColorActive,
          onRemovePending: (normalized) =>
            setPendingColors((prev) =>
              prev.filter((item) => item.normalized !== normalized)
            ),
        }}
      />

      <ItemsColorsAdminDeleteModal
        show={showAdminDeleteModal}
        submitting={adminDeleteSubmitting}
        mode={adminDeleteMode}
        targets={adminDeleteTargets}
        password={adminDeletePassword}
        onPasswordChange={setAdminDeletePassword}
        onClose={closeAdminDeleteModal}
        onConfirm={() => void handleConfirmAdminDelete()}
      />

      <ItemsColorsDuplicateModal
        show={showDuplicateModal}
        rows={duplicateRows}
        onCancel={() => setShowDuplicateModal(false)}
        onKeepExisting={() => {
          setShowDuplicateModal(false);
          handlePrepareUpload({ ignoreDuplicatePrompt: true, updateExisting: false });
        }}
        onUpdateDetails={() => {
          setShowDuplicateModal(false);
          handlePrepareUpload({ ignoreDuplicatePrompt: true, updateExisting: true });
        }}
      />

      <ItemsColorsColorReviewModal
        show={showColorReview}
        items={colorReviewItems}
        collections={collections}
        allColors={colors}
        onChoiceChange={(normalized, choice) =>
          setColorReviewItems((prev) =>
            prev.map((entry) =>
              entry.normalized === normalized ? { ...entry, choice } : entry
            )
          )
        }
        onNameChange={(normalized, value) =>
          setColorReviewItems((prev) =>
            prev.map((entry) =>
              entry.normalized === normalized ? { ...entry, resolvedName: value } : entry
            )
          )
        }
        onCollectionChange={(normalized, value) =>
          setColorReviewItems((prev) =>
            prev.map((entry) =>
              entry.normalized === normalized ? { ...entry, collection: value } : entry
            )
          )
        }
        onRememberChange={(normalized, value) =>
          setColorReviewItems((prev) =>
            prev.map((entry) =>
              entry.normalized === normalized ? { ...entry, remember: value } : entry
            )
          )
        }
        onClose={handleReviewClose}
        onConfirm={handleReviewConfirm}
      />
    </CatalogPageLayout>
  );
}

