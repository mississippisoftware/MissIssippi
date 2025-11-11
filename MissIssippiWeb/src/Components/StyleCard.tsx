import React from "react";
import { Card, Row, Col } from "react-bootstrap";
import InventoryTable from "./Inventory/InventoryTable";
import InventoryTableViewReadOnly from "./Inventory/InventoryTableViewReadOnly";

interface StyleData {
  styleNumber: string;
  description: string;
  imageUrl: string;
}

interface StyleCardProps {
  style: StyleData;
}

export default function StyleCard({ style }: StyleCardProps) {
  return (
    <Card>
      {/* Top: Style Info */}
      <Card.Body>
        <Row>
          <Col md={6}>
            <h4 className="fw-bold">{style.styleNumber}</h4>
            <p>{style.description}</p>
          </Col>
          <Col md={6}>
            <img
              src={style.imageUrl}
              alt={style.styleNumber}
              className="img-fluid"
              style={{ maxHeight: "150px", objectFit: "contain" }}
            />
          </Col>
        </Row>
      </Card.Body>

      {/* Bottom: Inventory Table */}
      <Card.Body>
        <InventoryTable
          ViewComponent={InventoryTableViewReadOnly}
          styleNumber={style.styleNumber} // filter inventory
        />
      </Card.Body>
    </Card>
  );
}