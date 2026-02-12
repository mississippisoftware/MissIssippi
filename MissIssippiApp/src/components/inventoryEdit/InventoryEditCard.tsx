import { Card, Col, Row } from "react-bootstrap";
import type { InventoryCardGroup } from "../../utils/buildInventoryCardGroups";
import type { iSize } from "../../utils/DataInterfaces";
import ActionButton from "../ActionButton";
import PageActionsRow from "../PageActionsRow";
import InventoryCardTable from "../inventory/InventoryCardTable";

type InventoryEditCardProps = {
  group: InventoryCardGroup;
  sizeColumns: iSize[];
  onQtyChange: (itemNumber: string, colorName: string, sizeName: string, qty: number) => void;
  onDownload: (group: InventoryCardGroup) => void;
  onDiscard: (itemNumber: string) => void;
  onSave: (itemNumber: string) => void;
  isDirty?: boolean;
  placeholderImage?: string;
};

const InventoryEditCard = ({
  group,
  sizeColumns,
  onQtyChange,
  onDownload,
  onDiscard,
  onSave,
  isDirty = false,
  placeholderImage,
}: InventoryEditCardProps) => (
  <Card className="inventory-edit-card">
    <Card.Header className="bg-white border-0 inventory-card-header">
      <Row className="align-items-center inventory-card-header-row">
        <Col md={4} className="inventory-card-header-left">
          <div className="inventory-card-heading">
            <span className="scan-section-icon scan-icon-green card-heading-icon" aria-hidden="true">
              <i className="pi pi-box" aria-hidden="true" />
            </span>
            <div className="d-flex flex-column">
              <div className="d-flex align-items-center gap-2">
                <span className="fw-bold inventory-card-style-number">{group.itemNumber}</span>
                {isDirty ? (
                  <span className="badge bg-warning text-dark">Unsaved changes</span>
                ) : null}
              </div>
              <span className="text-muted">{group.description || "No description"}</span>
            </div>
          </div>
        </Col>
        <Col
          md={8}
          className="text-md-end text-center inventory-card-header-divider inventory-card-header-right"
        >
          {placeholderImage ? (
            <img src={placeholderImage} alt="style" className="inventory-card-image" />
          ) : (
            <div className="inventory-card-image-placeholder">No Image Available</div>
          )}
        </Col>
      </Row>
    </Card.Header>
    <Card.Body className="inventory-edit-card-body">
      <InventoryCardTable rows={group.rows} sizeColumns={sizeColumns} editable onQtyChange={onQtyChange} />
    </Card.Body>
    <Card.Footer className="inventory-edit-card-footer">
      <PageActionsRow>
        <ActionButton
          label="Download"
          icon="pi pi-download"
          className="btn-info btn-outlined"
          onClick={() => onDownload(group)}
        />
        <ActionButton
          label="Discard"
          icon="pi pi-times"
          className="btn-danger btn-outlined"
          onClick={() => onDiscard(group.itemNumber)}
          disabled={!isDirty}
        />
        <ActionButton
          label="Save"
          icon="pi pi-save"
          className="btn-success"
          onClick={() => onSave(group.itemNumber)}
          disabled={!isDirty}
        />
      </PageActionsRow>
    </Card.Footer>
  </Card>
);

export default InventoryEditCard;
