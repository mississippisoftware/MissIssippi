interface InventoryCellProps {
  value: number;
  onChange: (value: number) => void;
}

const InventoryCell = ({ value, onChange }:InventoryCellProps) => {
  return (
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      style={{ width: "50px" }}
    />
  );
};

export default InventoryCell;