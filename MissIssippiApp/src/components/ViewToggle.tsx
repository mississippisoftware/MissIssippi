type ViewToggleProps = {
  ariaLabel: string;
  leftLabel: string;
  rightLabel: string;
  leftActive: boolean;
  rightActive: boolean;
  checked: boolean;
  onToggle: (checked: boolean) => void;
  switchAriaLabel: string;
  disabled?: boolean;
  leftIcon?: string;
  rightIcon?: string;
  leftIconWrapperClassName?: string;
  rightIconWrapperClassName?: string;
  onLeftClick?: () => void;
  onRightClick?: () => void;
};

const handleToggleKeyDown = (event: React.KeyboardEvent<HTMLSpanElement>, onClick?: () => void) => {
  if (!onClick) return;
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    onClick();
  }
};

const ViewToggle = ({
  ariaLabel,
  leftLabel,
  rightLabel,
  leftActive,
  rightActive,
  checked,
  onToggle,
  switchAriaLabel,
  disabled = false,
  leftIcon,
  rightIcon,
  leftIconWrapperClassName,
  rightIconWrapperClassName,
  onLeftClick,
  onRightClick,
}: ViewToggleProps) => (
  <div className="inventory-view-toggle" role="group" aria-label={ariaLabel}>
    <span
      className={`inventory-view-toggle-label ${leftActive ? "is-active" : ""}`}
      role={onLeftClick ? "button" : undefined}
      tabIndex={onLeftClick ? 0 : undefined}
      onClick={onLeftClick}
      onKeyDown={(event) => handleToggleKeyDown(event, onLeftClick)}
    >
      {leftIcon ? (
        <span className={leftIconWrapperClassName} aria-hidden="true">
          <i className={leftIcon} aria-hidden="true" />
        </span>
      ) : null}
      {leftLabel}
    </span>
    <label className="inventory-view-switch">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onToggle(event.target.checked)}
        disabled={disabled}
        aria-label={switchAriaLabel}
      />
      <span className="inventory-view-switch-track" aria-hidden="true"></span>
    </label>
    <span
      className={`inventory-view-toggle-label ${rightActive ? "is-active" : ""}`}
      role={onRightClick ? "button" : undefined}
      tabIndex={onRightClick ? 0 : undefined}
      onClick={onRightClick}
      onKeyDown={(event) => handleToggleKeyDown(event, onRightClick)}
    >
      {rightIcon ? (
        <span className={rightIconWrapperClassName} aria-hidden="true">
          <i className={rightIcon} aria-hidden="true" />
        </span>
      ) : null}
      {rightLabel}
    </span>
  </div>
);

export default ViewToggle;
