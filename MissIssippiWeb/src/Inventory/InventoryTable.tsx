import React, { useMemo } from "react";
import { Spinner } from "react-bootstrap";
import { useInventoryStore } from "./inventoryStore";
import InventoryTableView from "./InventoryTableView";

interface InventoryTableProps {
  styleNumber?: string;
  editable?: boolean;
}

export default function InventoryTable({ styleNumber, editable = false }: InventoryTableProps) {
  const inventory = useInventoryStore((state) =>
    styleNumber
      ? state.inventory.filter((row) => row.styleNumber === styleNumber)
      : state.inventory
  );

  const sizeColumnsRaw = useInventoryStore((state) => state.sizeColumns);
  const loading = useInventoryStore((state) => state.loading);
  const updateCell = useInventoryStore((state) => state.updateCell);
  const saveInventory = useInventoryStore((state) => state.saveInventory);

  const sizeColumns = useMemo(() => sizeColumnsRaw.map((s) => s.sizeName), [sizeColumnsRaw]);

  if (loading) return <Spinner animation="border" />;

  return (
    <InventoryTableView
      inventory={inventory}
      sizeColumns={sizeColumns}
      editable={editable}
      onQtyChange={updateCell}  // <-- directly writes to store
      onSave={saveInventory}     // <-- directly saves to API
    />
  );
}