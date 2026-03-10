import { type KeyboardEvent, useCallback, useMemo, useState } from "react";
import { Alert, Button, Form, Modal } from "react-bootstrap";
import type { DataTableRowEditCompleteEvent, DataTableRowClickEvent } from "primereact/datatable";
import { Toast } from "primereact/toast";
import CatalogService, { type ItemColorView } from "../../service/CatalogService";
import CatalogPageLayout from "../../components/CatalogPageLayout";
import { printItemList } from "../../utils/printCatalogLists";
import { appendSheet, createWorkbook, saveWorkbook, sheetFromAoa } from "../../utils/xlsxUtils";
import ItemsColorsColorModal from "../../items/ItemsColorsColorModal";
import ItemsColorsColorReviewModal from "../../items/ItemsColorsColorReviewModal";
import type { ItemListRow } from "../../items/itemsColorsTypes";
import { getReadableTextColor, normalizeName } from "../../items/itemsColorsUtils";
import ItemsTable from "./ItemsTable";
import ItemUploadActions from "./ItemUploadActions";
import { useItemList } from "./useItemList";
import { useColorResolution } from "./useColorResolution";
import { useItemUpload } from "./useItemUpload";
import { useColorUpload } from "./useColorUpload";
import InventorySearchFiltersForm from "../../components/InventorySearchFilters";
import { shouldSubmitOnEnter } from "../../utils/modalKeyHandlers";
import { useToastNotifier } from "../../hooks/useToastNotifier";

export default function ItemsColors() {
  const { toastRef, notify, getErrorMessage } = useToastNotifier();

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
  } = useItemList({ toastRef });

  const [showColorModal, setShowColorModal] = useState(false);
  const [showAdminDeleteModal, setShowAdminDeleteModal] = useState(false);
  const [adminDeleteMode, setAdminDeleteMode] = useState<"selected" | "filtered" | null>(null);
  const [adminDeletePassword, setAdminDeletePassword] = useState("");
  const [adminDeleteSubmitting, setAdminDeleteSubmitting] = useState(false);

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

  const priceFormatter = useMemo(
    () => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }),
    []
  );

  const formatPrice = (value?: number | null) =>
    value === null || value === undefined ? "--" : priceFormatter.format(value);

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

  const handleToggleColorActive = async (itemColorId: number, nextActive: boolean) => {
    try {
      await CatalogService.setItemColorActive({ itemColorId, active: nextActive });
      notify(
        "success",
        nextActive ? "Color activated" : "Color deactivated",
        nextActive ? "Color is active again." : "Color is now inactive."
      );
      let nextSelected: ItemListRow | null = null;
      let nextModalItem: ItemListRow | null = null;
      setItemList((prev) =>
        prev.map((item) => {
          if (!(item.colors ?? []).some((color) => color.itemColorId === itemColorId)) {
            return item;
          }
          const nextColors = (item.colors ?? []).map((color) =>
            color.itemColorId === itemColorId ? { ...color, itemColorActive: nextActive } : color
          );
          const updated: ItemListRow = { ...item, colors: nextColors };
          if (selectedItem?.itemId === item.itemId) {
            nextSelected = updated;
          }
          if (colorModalItem?.itemId === item.itemId) {
            nextModalItem = updated;
          }
          return updated;
        })
      );
      if (nextSelected) {
        setSelectedItem(nextSelected);
      }
      if (nextModalItem) {
        setColorModalItem(nextModalItem);
      }
    } catch (err: unknown) {
      console.error(err);
      notify("error", "Update failed", getErrorMessage(err, "Unable to update color status."));
    }
  };

  const handleItemSave = async (row: ItemListRow) => {
    if (!row.itemNumber?.trim()) {
      notify("warn", "Style required", "Enter a style number.");
      return false;
    }
    if (!row.seasonId) {
      notify("warn", "Season required", "Select a season.");
      return false;
    }
    if (!row.description?.trim()) {
      notify("warn", "Description required", "Enter a description.");
      return false;
    }

    try {
      const isNew = row.itemId <= 0;
      const trimmedItemNumber = row.itemNumber.trim();
      const trimmedDescription = row.description.trim();
      const seasonName = resolveSeasonName(row.seasonId);
      await CatalogService.addOrUpdateItem({
        itemId: row.itemId > 0 ? row.itemId : undefined,
        itemNumber: trimmedItemNumber,
        description: trimmedDescription,
        seasonId: Number(row.seasonId),
        costPrice: row.costPrice,
        wholesalePrice: row.wholesalePrice,
        inProduction: row.inProduction ?? false,
        weight: row.weight,
      });

      let savedItem: ItemListRow | null = null;
      if (isNew) {
        const normalizedItem = normalizeName(trimmedItemNumber);
        const normalizedSeason = normalizeName(seasonName);
        const matches = await CatalogService.getItems({
          itemNumber: trimmedItemNumber,
          seasonName,
        });
        const match = matches.find(
          (item) =>
            normalizeName(item.itemNumber) === normalizedItem &&
            normalizeName(item.seasonName ?? seasonName) === normalizedSeason
        );
        if (match) {
          savedItem = {
            ...match,
            seasonName: match.seasonName ?? seasonName,
            colors: [],
          };
        }
      }

      let nextSelected: ItemListRow | null = null;
      setItemList((prev) =>
        prev.map((item) => {
          if (item.itemId !== row.itemId) return item;
          const wasInProduction = item.inProduction ?? false;
          const updated: ItemListRow = {
            ...item,
            ...(savedItem ?? {
              itemId: item.itemId,
              itemNumber: trimmedItemNumber,
              description: trimmedDescription,
              seasonId: Number(row.seasonId),
              seasonName,
              costPrice: row.costPrice,
              wholesalePrice: row.wholesalePrice,
              weight: row.weight,
              inProduction: row.inProduction ?? false,
            }),
            colors: item.colors ?? [],
          };
          if (!wasInProduction && updated.inProduction) {
            updated.colors = (updated.colors ?? []).map((color) => ({
              ...color,
              itemColorActive: true,
            }));
          }
          nextSelected = updated;
          return updated;
        })
      );
      if (nextSelected) {
        setSelectedItem(nextSelected);
        if (colorModalItem?.itemId === row.itemId) {
          setColorModalItem(nextSelected);
        }
        if (savedItem && row.itemId !== savedItem.itemId) {
          setExpandedRows((prev) => {
            if (!prev[String(row.itemId)]) return prev;
            const next = { ...prev };
            delete next[String(row.itemId)];
            next[String(savedItem.itemId)] = true;
            return next;
          });
        }
      }
      notify("success", "Style saved", `${row.itemNumber} saved successfully.`);
      return true;
    } catch (err: unknown) {
      console.error(err);
      notify("error", "Style save failed", getErrorMessage(err, "Unable to save style."));
      return false;
    }
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

  const getUniqueColors = (colorsForItem: ItemColorView[]) => {
    const map = new Map<number, ItemColorView>();
    colorsForItem.forEach((color) => {
      if (!map.has(color.colorId)) {
        map.set(color.colorId, color);
      }
    });
    return Array.from(map.values());
  };

  const getActiveColors = (colorsForItem: ItemColorView[]) =>
    getUniqueColors(colorsForItem).filter((color) => color.itemColorActive !== false);

  const handleDownloadItemList = () => {
    const colorLists = filteredItems.map((row) =>
      getUniqueColors(row.colors ?? []).map((color) => color.colorName ?? "")
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
    printItemList({ rows: filteredItems, formatPrice, getUniqueColors });
  };

  const handleRefreshItemList = useCallback(async () => {
    clearSearchFilters();
    setActiveFilter("");
    await loadItemList();
  }, [clearSearchFilters, loadItemList, setActiveFilter]);

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

  return (
    <CatalogPageLayout
      title="Item List"
      subtitle={`Seasons: ${seasonSummary}`}
      className="catalog-page--wide mt-3"
      actions={[
        {
          label: "Download Item List",
          onClick: handleDownloadItemList,
          variant: "primary",
          icon: "pi pi-download",
          className: "btn-info btn-outlined",
        },
        {
          label: "Print Item List",
          onClick: handlePrintItemList,
          variant: "primary",
          icon: "pi pi-print",
          className: "btn-warn btn-outlined",
        },
        {
          label: "Admin Delete Selected",
          onClick: () => openAdminDeleteModal("selected"),
          variant: "primary",
          icon: "pi pi-trash",
          className: "btn-danger btn-outlined",
          disabled: !selectedItem || selectedItem.itemId <= 0,
        },
        {
          label: "Admin Delete All Filtered",
          onClick: () => openAdminDeleteModal("filtered"),
          variant: "primary",
          icon: "pi pi-exclamation-triangle",
          className: "btn-danger",
          disabled: filteredItems.every((row) => row.itemId <= 0),
        },
      ]}
      actionsSlot={
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
        />
      }
    >
      <Toast ref={toastRef} position="top-right" />

      {lookupError && <Alert variant="danger">{lookupError}</Alert>}

      <div className="inventory-edit-header-actions">
        <div className="content-card inventory-edit-search-card">
          <InventorySearchFiltersForm
            filters={searchForm}
            seasons={seasons}
            searching={itemListLoading || loadingLookups}
            onChange={setSearchForm}
            onSubmit={applySearchFilters}
            onClear={clearSearchFilters}
          />
        </div>
      </div>

      <div className="items-colors-layout items-colors-layout--single">
        <ItemsTable
          seasons={seasons}
          loadingLookups={loadingLookups}
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
          handleAddItemRow={handleAddItemRow}
          loadItemList={handleRefreshItemList}
          handleExpandAll={handleExpandAll}
          handleCollapseAll={handleCollapseAll}
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
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
          currentColors: activeColorItem ? getUniqueColors(activeColorItem.colors ?? []) : [],
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

      <Modal show={showAdminDeleteModal} onHide={closeAdminDeleteModal} centered>
        <Modal.Header closeButton={!adminDeleteSubmitting}>
          <Modal.Title>
            {adminDeleteMode === "filtered" ? "Admin hard delete filtered styles" : "Admin hard delete style"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="danger" className="mb-3">
            This permanently deletes styles and related item colors, SKUs, inventory, inventory history, and images.
            This cannot be undone.
          </Alert>
          <div className="mb-2">
            <strong>Target count:</strong> {adminDeleteTargets.length}
          </div>
          {adminDeleteTargets.length > 0 && (
            <ul className="mb-3">
              {adminDeleteTargets.slice(0, 6).map((row) => (
                <li key={`admin-delete-${row.itemId}`}>
                  {row.seasonName || "?"} - {row.itemNumber || `Item ${row.itemId}`} (ID {row.itemId})
                </li>
              ))}
            </ul>
          )}
          {adminDeleteTargets.length > 6 && (
            <div className="text-muted mb-3">{adminDeleteTargets.length - 6} more style(s) not shown.</div>
          )}
          <Form.Group controlId="adminDeletePassword">
            <Form.Label>Admin password</Form.Label>
            <Form.Control
              type="password"
              value={adminDeletePassword}
              onChange={(e) => setAdminDeletePassword(e.target.value)}
              placeholder="Enter admin delete password"
              autoFocus
              disabled={adminDeleteSubmitting}
              onKeyDown={(event) => {
                if (!shouldSubmitOnEnter(event)) return;
                event.preventDefault();
                void handleConfirmAdminDelete();
              }}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button
            type="button"
            className="btn-neutral btn-outlined"
            onClick={closeAdminDeleteModal}
            disabled={adminDeleteSubmitting}
          >
            <i className="pi pi-times" aria-hidden="true" />
            Cancel
          </Button>
          <Button
            type="button"
            className="btn-danger"
            onClick={() => void handleConfirmAdminDelete()}
            disabled={adminDeleteSubmitting || adminDeleteTargets.length === 0}
          >
            <i className="pi pi-trash" aria-hidden="true" />
            {adminDeleteSubmitting ? "Deleting..." : "Permanently Delete"}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={showDuplicateModal}
        onHide={() => setShowDuplicateModal(false)}
        centered
        onKeyDown={(event: KeyboardEvent<HTMLElement>) => {
          if (!shouldSubmitOnEnter(event)) return;
          event.preventDefault();
          setShowDuplicateModal(false);
          handlePrepareUpload({ ignoreDuplicatePrompt: true, updateExisting: true });
        }}
      >
        <Modal.Header closeButton>
          <Modal.Title>Existing styles found</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-2">
            Some styles in this upload already exist. Do you want to update their details with the uploaded data?
          </p>
          <p className="text-muted mb-2">
            InProduction status will still sync from the upload file when that column is present.
          </p>
          <ul className="mb-0">
            {duplicateRows.slice(0, 6).map((row) => (
              <li key={`${row.seasonName}-${row.itemNumber}-${row.rowNumber}`}>
                {row.seasonName} — {row.itemNumber}
              </li>
            ))}
          </ul>
          {duplicateRows.length > 6 && (
            <div className="text-muted mt-2">
              {duplicateRows.length - 6} more style(s) not shown.
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            type="button"
            className="btn-neutral btn-outlined"
            onClick={() => setShowDuplicateModal(false)}
          >
            <i className="pi pi-times" aria-hidden="true" />
            Cancel
          </Button>
          <Button
            type="button"
            className="btn-neutral btn-outlined"
            onClick={() => {
              setShowDuplicateModal(false);
              handlePrepareUpload({ ignoreDuplicatePrompt: true, updateExisting: false });
            }}
          >
            <i className="pi pi-refresh" aria-hidden="true" />
            Keep existing details
          </Button>
          <Button
            type="button"
            className="btn-success"
            onClick={() => {
              setShowDuplicateModal(false);
              handlePrepareUpload({ ignoreDuplicatePrompt: true, updateExisting: true });
            }}
          >
            <i className="pi pi-save" aria-hidden="true" />
            Update details
          </Button>
        </Modal.Footer>
      </Modal>

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
