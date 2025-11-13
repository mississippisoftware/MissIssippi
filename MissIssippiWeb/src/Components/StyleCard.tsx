import { Card, Row, Col, Image } from "react-bootstrap";
import InventoryTable from "../inventory/InventoryTable";

interface StyleCardProps {
  style: {
    styleNumber: string;
    description: string;
    imageUrl?: string;
  };
  editable?: boolean;
}

const PLACEHOLDER_IMAGE = "/assets/images/placeholder.png";

export default function StyleCard({ style, editable = false }: StyleCardProps) {
  return (
    <Card className="shadow-sm mb-3" style={{ height: "400px" }}>
      {/* Header takes 1/3 of card height */}
      <Card.Header style={{ height: "33%", display: "flex", alignItems: "center" }}>
        <Row className="w-100 align-items-center">
          {/* Left Column: Style Number & Description */}
          <Col xs={6} className="text-center">
            <div style={{ fontSize: "2rem", fontWeight: "bold" }}>
              {style.styleNumber}
            </div>
            <div style={{ fontSize: "0.9rem", marginTop: "0.2rem" }}>
              {style.description}
            </div>
          </Col>

          {/* Right Column: Image */}
          <Col xs={6} className="text-center">
            <Image
              src={style.imageUrl || PLACEHOLDER_IMAGE}
              alt={style.description}
              fluid
              style={{ maxHeight: "100%", objectFit: "contain" }}
            />
          </Col>
        </Row>
      </Card.Header>

      {/* Body takes remaining 2/3 of card height */}
      <Card.Body style={{ height: "67%", overflowY: "auto" }}>
        <InventoryTable
          styleNumber={style.styleNumber}
          editable={editable}
          showStyleNumber={false}
        />
      </Card.Body>
    </Card>
  );
}