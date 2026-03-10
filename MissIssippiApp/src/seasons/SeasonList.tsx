import { type KeyboardEvent, useRef } from "react";
import { Alert, Button, Card, Col, Form, Modal, Row } from "react-bootstrap";
import { Column } from "primereact/column";
import { Toast } from "primereact/toast";
import CatalogPageLayout from "../components/CatalogPageLayout";
import CatalogCrudTable from "../components/catalog/CatalogCrudTable";
import PageActionsRow from "../components/PageActionsRow";
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

  const renderTextEditor = (options: EditorOptions<SeasonRecord>) => (
    <Form.Control
      value={typeof options.value === "string" || typeof options.value === "number" ? options.value : ""}
      onChange={(e) => options.editorCallback?.(e.target.value)}
    />
  );

  const renderActiveEditor = (options: EditorOptions<SeasonRecord>) => (
    <Form.Check
      type="checkbox"
      checked={Boolean(options.value)}
      onChange={(e) => options.editorCallback?.(e.target.checked)}
    />
  );

  const renderActive = (row: SeasonRecord) => (
    <Form.Check type="checkbox" checked={Boolean(row.active)} readOnly disabled />
  );

  return (
    <CatalogPageLayout title="Season List" subtitle={`Total seasons: ${seasons.length}`}>
      <Toast ref={toastRef} position="top-right" />

      {lookupError && <Alert variant="danger">{lookupError}</Alert>}

      <Card className="portal-content-card">
        <Card.Body>
          <Row className="items-actions-row align-items-center gy-2">
            <Col>
              <PageActionsRow justifyClassName="justify-content-md-end" className="flex-wrap">
                <Button type="button" className="btn-primary btn-outlined" onClick={handleAddSeasonRow} disabled={loading}>
                  <i className="pi pi-plus" aria-hidden="true" />
                  Add Season
                </Button>
                <Button type="button" className="btn-neutral btn-outlined" onClick={loadSeasons} disabled={loading}>
                  <i className="pi pi-refresh" aria-hidden="true" />
                  {loading ? "Refreshing..." : "Refresh list"}
                </Button>
              </PageActionsRow>
            </Col>
          </Row>

          <CatalogCrudTable
            data={seasons}
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
            <Column rowEditor header="Save" headerStyle={{ width: "6rem" }} bodyStyle={{ textAlign: "center" }} />
            <Column
              header="Delete"
              body={(row: SeasonRecord) => (
                <Button
                  type="button"
                  className="btn-danger btn-outlined btn-icon"
                  onClick={() => openDeleteSeasonModal(row)}
                  disabled={Number(row.seasonId) < 0}
                  aria-label={`Delete ${row.seasonName}`}
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
        show={Boolean(seasonToDelete)}
        onHide={closeDeleteSeasonModal}
        centered
        onKeyDown={(event: KeyboardEvent<HTMLElement>) => {
          if (deletingSeasonId !== null) return;
          if (!shouldSubmitOnEnter(event)) return;
          event.preventDefault();
          void handleDeleteSeason();
        }}
      >
        <Modal.Header closeButton>
          <Modal.Title>Delete season</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-0">
            Delete <strong>{seasonToDelete?.seasonName}</strong>? This action cannot be undone.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button
            type="button"
            className="btn-neutral btn-outlined"
            onClick={closeDeleteSeasonModal}
            disabled={deletingSeasonId !== null}
          >
            <i className="pi pi-times" aria-hidden="true" />
            Cancel
          </Button>
          <Button
            type="button"
            className="btn-danger"
            onClick={() => void handleDeleteSeason()}
            disabled={deletingSeasonId !== null}
          >
            <i className="pi pi-trash" aria-hidden="true" />
            {deletingSeasonId !== null ? "Deleting..." : "Delete"}
          </Button>
        </Modal.Footer>
      </Modal>
    </CatalogPageLayout>
  );
}
