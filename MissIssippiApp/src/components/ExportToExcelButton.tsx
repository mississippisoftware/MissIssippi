import { Button } from "primereact/button";

interface ExportButtonProps {
  onClick: () => void;
  className?: string;
  label?: string;
}

export default function ExportButton({
  onClick,
  className,
  label = "Export to Excel",
}: ExportButtonProps) {
  return (
    <Button
      label={label}
      icon="pi pi-download"
      severity="secondary"
      onClick={onClick}
      className={className}
    />
  );
}