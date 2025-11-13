import React, { useMemo } from "react";
import InventoryTableView from "../inventory/InventoryTableView";
import { useInventoryStore } from "../inventory/inventoryStore";

export default function ViewInventory() {
  const inventory = useInventoryStore((state) => state.inventory);
  const sizeColumns = useInventoryStore((state) => state.sizeColumns);
  const loading = useInventoryStore((state) => state.loading);

  // Memoize size names so they don't change on every render
  const sizeNames = useMemo(() => sizeColumns.map((s) => s.sizeName), [sizeColumns]);

  if (loading) return <div>Loading inventory...</div>;

  return (
    <InventoryTableView
      inventory={inventory}
      sizeColumns={sizeNames}
      editable={false} // read-only
    />
  );
}