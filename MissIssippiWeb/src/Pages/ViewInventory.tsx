import InventoryTable from "../inventory/InventoryTable";

export default function ViewInventory() {
  return <InventoryTable editable={false} showStyleNumber={true} />;
}