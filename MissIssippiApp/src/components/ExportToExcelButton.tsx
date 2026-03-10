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
  const buttonClassName = className ?? "btn-info btn-outlined";
  return (
    <Button
      label={label}
      icon="pi pi-download"
      onClick={onClick}
      className={buttonClassName}
    />
  );
}
