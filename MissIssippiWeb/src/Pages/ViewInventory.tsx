import InventoryTable from "../Inventory/InventoryTable";
import InventoryTableViewReadOnly from "../Inventory/InventoryTableViewReadOnly";

export default function ViewInventory() {
  return (
    <div>
      <InventoryTable ViewComponent={InventoryTableViewReadOnly} />
    </div>
  );
}