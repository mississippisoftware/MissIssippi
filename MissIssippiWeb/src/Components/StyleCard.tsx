import React from "react";
import { Card } from "react-bootstrap";
import InventoryTableView from "../inventory/InventoryTableView";
import { useInventoryStore } from "../inventory/inventoryStore";
import type { iInventoryDisplayRow } from "../DataInterfaces";

interface StyleCardProps {
  style: {
    styleNumber: string;
    description: string;
    imageUrl?: string;
    variants: string[]; // colorNames
  };
  editable?: boolean;
}

export default function StyleCard({ style, editable = false }: StyleCardProps) {
  const inventory = useInventoryStore((state) => state.inventory);
  const updateCell = useInventoryStore((state) => state.updateCell);
  const saveInventory = useInventoryStore((state) => state.saveInventory);

  const variantsData: iInventoryDisplayRow[] = inventory.filter((row) =>
    style.variants.includes(row.colorName)
  );

  const sizeColumns = variantsData[0] ? Object.keys(variantsData[0].sizes) : [];

  return (
    <Card className="shadow-sm mb-3">
      <Card.Header>
        <strong>{style.styleNumber}</strong> — {style.description}
      </Card.Header>
      <Card.Body>
        <InventoryTableView
          inventory={variantsData}
          sizeColumns={sizeColumns}
          editable={editable}
          onQtyChange={updateCell}
          onSave={saveInventory}
        />
      </Card.Body>
    </Card>
  );
}