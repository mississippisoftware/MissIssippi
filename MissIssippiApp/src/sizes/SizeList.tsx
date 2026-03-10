import { type KeyboardEvent, useMemo, useRef } from "react";
import { Alert, Button, Card, Col, Form, Modal, Row } from "react-bootstrap";
import { Column } from "primereact/column";
import { Toast } from "primereact/toast";
import CatalogPageLayout from "../components/CatalogPageLayout";
import CatalogCrudTable from "../components/catalog/CatalogCrudTable";
import PageActionsRow from "../components/PageActionsRow";
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

  const renderTextEditor = (options: EditorOptions<SizeRecord>) => (
    <Form.Control
      value={typeof options.value === "string" || typeof options.value === "number" ? options.value : ""}
      onChange={(e) => options.editorCallback?.(e.target.value)}
    />
  );

  const renderSequenceEditor = (options: EditorOptions<SizeRecord>) => (
    <Form.Control
      type="number"
      step={1}
      value={typeof options.value === "number" || typeof options.value === "string" ? options.value : 0}
      onChange={(e) => options.editorCallback?.(Number(e.target.value))}
    />
  );

  return (
    <CatalogPageLayout title="Size List" subtitle={`Total sizes: ${orderedSizes.length}`}>
      <Toast ref={toastRef} position="top-right" />

      {lookupError && <Alert variant="danger">{lookupError}</Alert>}

      <Card className="portal-content-card">
        <Card.Body>
          <Row className="items-actions-row align-items-center gy-2">
            <Col>
              <PageActionsRow justifyClassName="justify-content-md-end" className="flex-wrap">
                <Button type="button" className="btn-primary btn-outlined" onClick={handleAddSizeRow} disabled={loading}>
                  <i className="pi pi-plus" aria-hidden="true" />
                  Add Size
                </Button>
                <Button type="button" className="btn-neutral btn-outlined" onClick={loadSizes} disabled={loading}>
                  <i className="pi pi-refresh" aria-hidden="true" />
                  {loading ? "Refreshing..." : "Refresh list"}
                </Button>
              </PageActionsRow>
            </Col>
          </Row>

          <CatalogCrudTable
            data={orderedSizes}
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
              headerStyle={{ width: "9rem" }}
            />
            <Column rowEditor header="Save" headerStyle={{ width: "6rem" }} bodyStyle={{ textAlign: "center" }} />
            <Column
              header="Delete"
              body={(row: SizeRecord) => (
                <Button
                  type="button"
                  className="btn-danger btn-outlined btn-icon"
                  onClick={() => openDeleteSizeModal(row)}
                  disabled={Number(row.sizeId) < 0}
                  aria-label={`Delete ${row.sizeName}`}
                >
                  <i className="pi pi-trash" aria-hidden="true" />
                </Button>
              )}
              headerStyle={{ width: "6rem" }}
              bodyStyle={{ textAlign: "center" }}
            />
          </CatalogCrudTable>
        </Card.Body>
      </Card>

      <Modal
        show={Boolean(sizeToDelete)}
        onHide={closeDeleteSizeModal}
        centered
        onKeyDown={(event: KeyboardEvent<HTMLElement>) => {
          if (deletingSizeId !== null) return;
          if (!shouldSubmitOnEnter(event)) return;
          event.preventDefault();
          void handleDeleteSize();
        }}
      >
        <Modal.Header closeButton>
          <Modal.Title>Delete size</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-0">
            Delete <strong>{sizeToDelete?.sizeName}</strong>? This action cannot be undone.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button
            type="button"
            className="btn-neutral btn-outlined"
            onClick={closeDeleteSizeModal}
            disabled={deletingSizeId !== null}
          >
            <i className="pi pi-times" aria-hidden="true" />
            Cancel
          </Button>
          <Button
            type="button"
            className="btn-danger"
            onClick={() => void handleDeleteSize()}
            disabled={deletingSizeId !== null}
          >
            <i className="pi pi-trash" aria-hidden="true" />
            {deletingSizeId !== null ? "Deleting..." : "Delete"}
          </Button>
        </Modal.Footer>
      </Modal>
    </CatalogPageLayout>
  );
}
