import { useMemo, useRef, useState } from "react";
import { Alert, Button, Modal } from "react-bootstrap";
import type { DataTableRowEditCompleteEvent } from "primereact/datatable";
import { Toast } from "primereact/toast";
import * as XLSX from "xlsx";
import CatalogService, { type ItemColorView } from "../../service/CatalogService";
import CatalogPageLayout from "../../components/CatalogPageLayout";
import { makeDateStamp } from "../../utils/dateFormat";
import { printItemList } from "../../utils/printCatalogLists";
import { useNotifier } from "../../hooks/useNotifier";
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

export default function ItemsColors() {
  const toastRef = useRef<Toast>(null);
  const notify = useNotifier(toastRef);

  const {
    seasons,
    colors,
    setColors,
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
    seasonFilterId,
    setSeasonFilterId,
    activeFilter,
    setActiveFilter,
    colorModalItem,
    setColorModalItem,
  } = useItemList({ toastRef });

  const [showColorModal, setShowColorModal] = useState(false);

  const activeColorItem = colorModalItem ?? selectedItem;

  const {
    normalizedColors,
    colorInput,
    setColorInput,
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

  const saveWorkbook = (workbook: XLSX.WorkBook, baseName: string) => {
    const timestamp = makeDateStamp();
    XLSX.writeFile(workbook, `${baseName}_${timestamp}.xlsx`);
  };

  const {
    fileName,
    uploadRows,
    parseErrors,
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
    saveWorkbook,
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
    saveWorkbook,
  });

  const resolveSeasonName = (seasonId: number | string) =>
    seasons.find((season) => season.seasonId === Number(seasonId))?.seasonName ?? "";

  const seasonSummary = useMemo(() => {
    if (seasonFilterId) {
      return resolveSeasonName(seasonFilterId) || "All seasons";
    }
    const names = Array.from(
      new Set(filteredItems.map((row) => row.seasonName).filter((name): name is string => Boolean(name)))
    );
    return names.length ? names.join(", ") : "All seasons";
  }, [filteredItems, seasonFilterId, seasons]);

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
    const defaultSeason =
      seasons.find((season) => String(season.seasonId) === seasonFilterId) ?? seasons[0];
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
      await CatalogService.addOrUpdateItem({
        itemId: row.itemId > 0 ? row.itemId : undefined,
        itemNumber: row.itemNumber.trim(),
        description: row.description.trim(),
        seasonId: Number(row.seasonId),
        costPrice: row.costPrice,
        wholesalePrice: row.wholesalePrice,
        inProduction: row.inProduction ?? false,
        weight: row.weight,
      });

      const rows = await loadItemList();
      const seasonName = resolveSeasonName(row.seasonId);
      const normalizedItem = normalizeName(row.itemNumber);
      const matched = rows.find(
        (item) =>
          normalizeName(item.itemNumber) === normalizedItem &&
          normalizeName(item.seasonName ?? "") === normalizeName(seasonName)
      );
      setSelectedItem(matched ?? null);
      notify("success", "Style saved", `${row.itemNumber} saved successfully.`);
      return true;
    } catch (err: any) {
      console.error(err);
      notify("error", "Style save failed", err?.message ?? "Unable to save style.");
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
    setEditingRows({});
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

  const handleRowClick = (event: any) => {
    const target = event.originalEvent?.target as HTMLElement | null;
    if (
      target?.closest(
        "button, a, input, select, textarea, .p-row-editor-init, .p-row-editor-save, .p-row-editor-cancel, .p-column-resizer, .p-row-toggler"
      )
    ) {
      return;
    }
    toggleRowExpansion(event.data);
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

  const handleDownloadItemList = () => {
    const headers = ["Season", "Style Number", "Description", "Active", "Wholesale", "Retail", "Colors"];
    const rows = filteredItems.map((row) => {
      const colors = getUniqueColors(row.colors ?? []).map((color) => color.colorName).join(", ");
      return {
        Season: row.seasonName ?? "",
        "Style Number": row.itemNumber ?? "",
        Description: row.description ?? "",
        Active: row.inProduction ? "Yes" : "No",
        Wholesale: row.wholesalePrice ?? "",
        Retail: row.costPrice ?? "",
        Colors: colors,
      };
    });
    const worksheet = XLSX.utils.json_to_sheet(rows, { header: headers });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Item List");
    saveWorkbook(workbook, "item_list");
  };

  const handlePrintItemList = () => {
    printItemList({ rows: filteredItems, formatPrice, getUniqueColors });
  };

  const handleReviewConfirm = () => {
    handleReviewConfirmBase({
      onUploadResolve: (rows, resolutionMap) =>
        executeUpload(rows, resolutionMap, { updateExisting: updateExistingItems }),
      onColorUploadResolve: executeColorUpload,
    });
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
      ]}
      actionsSlot={
        <ItemUploadActions
          seasons={seasons}
          loadingLookups={loadingLookups}
          fileName={fileName}
          uploadRows={uploadRows}
          parseErrors={parseErrors}
          uploadSummary={uploadSummary}
          uploading={uploading}
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
        />
      }
    >
      <Toast ref={toastRef} position="top-right" />

      {lookupError && <Alert variant="danger">{lookupError}</Alert>}

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
          loadItemList={loadItemList}
          handleExpandAll={handleExpandAll}
          handleCollapseAll={handleCollapseAll}
          seasonFilterId={seasonFilterId}
          setSeasonFilterId={setSeasonFilterId}
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
          resolveSeasonName={resolveSeasonName}
          formatPrice={formatPrice}
          openColorModal={openColorModal}
          getUniqueColors={getUniqueColors}
          getReadableTextColor={getReadableTextColor}
        />
      </div>

      <ItemsColorsColorModal
        show={showColorModal}
        onClose={closeColorModal}
        onSave={handleSaveColors}
        onAddColor={handleAddColor}
        onRemovePending={(normalized) =>
          setPendingColors((prev) => prev.filter((item) => item.normalized !== normalized))
        }
        activeItemLabel={
          activeColorItem ? `Edit colors for ${activeColorItem.itemNumber}` : "Edit colors"
        }
        isLocked={!activeColorItem || activeColorItem.itemId <= 0}
        pendingColors={pendingColors}
        currentColors={activeColorItem ? getUniqueColors(activeColorItem.colors ?? []) : []}
        colorInput={colorInput}
        colorPantoneInput={colorPantoneInput}
        colorHexInput={colorHexInput}
        onColorInputChange={setColorInput}
        onPantoneChange={setColorPantoneInput}
        onHexChange={setColorHexInput}
        saving={savingColors}
        getReadableTextColor={getReadableTextColor}
      />

      <Modal show={showDuplicateModal} onHide={() => setShowDuplicateModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Existing styles found</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-2">
            Some styles in this upload already exist. Do you want to update their details with the uploaded data?
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
        onChoiceChange={(normalized, choice) =>
          setColorReviewItems((prev) =>
            prev.map((entry) =>
              entry.normalized === normalized ? { ...entry, choice } : entry
            )
          )
        }
        onClose={handleReviewClose}
        onConfirm={handleReviewConfirm}
      />
    </CatalogPageLayout>
  );
}
