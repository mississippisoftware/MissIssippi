import { Button } from "primereact/button";

type ActionButtonProps = {
  label?: string;
  icon?: string;
  className?: string;
  title?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  ariaLabel?: string;
  iconOnly?: boolean;
};

export default function ActionButton({
  label,
  icon,
  className,
  title,
  disabled,
  onClick,
  type = "button",
  ariaLabel,
  iconOnly = false,
}: ActionButtonProps) {
  const buttonClassName = [className, iconOnly ? "btn-icon" : ""]
    .filter(Boolean)
    .join(" ");
  const resolvedAriaLabel = iconOnly ? ariaLabel ?? label : ariaLabel;
  const resolvedTitle = title ?? (iconOnly ? resolvedAriaLabel : undefined);

  return (
    <Button
      type={type}
      className={buttonClassName}
      onClick={onClick}
      disabled={disabled}
      aria-label={resolvedAriaLabel}
      title={resolvedTitle}
      unstyled
    >
      {icon ? <i className={icon} aria-hidden="true" /> : null}
      {iconOnly ? null : label}
    </Button>
  );
}
