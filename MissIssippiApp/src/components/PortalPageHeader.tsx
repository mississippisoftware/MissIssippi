import type { ReactNode } from "react";
import { Button } from "react-bootstrap";

export type PageHeaderAction = {
  label: string;
  onClick: () => void;
  variant?: "outline" | "primary";
  className?: string;
  disabled?: boolean;
  icon?: string;
};

type PortalPageHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: PageHeaderAction[];
  actionsSlot?: ReactNode;
  actionsClassName?: string;
  className?: string;
  children?: ReactNode;
};

export default function PortalPageHeader({
  title,
  subtitle,
  actions = [],
  actionsSlot,
  actionsClassName = "",
  className = "",
  children,
}: PortalPageHeaderProps) {
  const wrapperClass = ["content-topbar", className].filter(Boolean).join(" ");
  const hasActions = actions.length > 0 || actionsSlot;
  const actionsClass = ["portal-page-actions", actionsClassName].filter(Boolean).join(" ");
  return (
    <div className={wrapperClass}>
      <div className="portal-page-header">
        <div>
          <h1 className="portal-page-title">{title}</h1>
          {subtitle && <p className="portal-page-subtitle">{subtitle}</p>}
        </div>
        {hasActions && (
          <div className={actionsClass}>
            {actions.map((action) => {
              const variant = action.variant ?? "outline";
              const fallbackClass =
                variant === "primary" ? "btn-primary" : "btn-neutral btn-outlined";
              const buttonClass = action.className ?? fallbackClass;
              return (
                <Button
                  key={action.label}
                  type="button"
                  className={buttonClass}
                  onClick={action.onClick}
                  disabled={action.disabled}
                >
                  {action.icon ? (
                    <i className={action.icon} aria-hidden="true" />
                  ) : null}
                  {action.label}
                </Button>
              );
            })}
            {actionsSlot}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}
