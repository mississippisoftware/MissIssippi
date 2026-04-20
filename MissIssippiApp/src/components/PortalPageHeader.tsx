import type { ReactNode } from "react";

type PortalPageHeaderProps = {
  title: string;
  subtitle?: string;
  actionsSlot?: ReactNode;
  /** When provided, renders the unified .page-control-zone layout
   *  (small quiet title + filters band) instead of the legacy header. */
  filtersSlot?: ReactNode;
  className?: string;
  children?: ReactNode;
};

export default function PortalPageHeader({
  title,
  subtitle,
  actionsSlot,
  filtersSlot,
  className = "",
  children,
}: PortalPageHeaderProps) {
  const wrapperClass = ["content-topbar", className].filter(Boolean).join(" ");

  // ── Unified control-zone layout (data-first pages) ──────────────────────
  if (filtersSlot !== undefined) {
    const controlZoneClass = [wrapperClass, "page-control-zone"]
      .filter(Boolean)
      .join(" ");

    return (
      <div className={controlZoneClass}>
        <div className="page-control-zone__header">
          <span className="page-control-zone__title">{title}</span>
          {actionsSlot && (
            <div className="page-control-zone__actions">{actionsSlot}</div>
          )}
        </div>
        <div className="page-control-zone__filters">{filtersSlot}</div>
        {children}
      </div>
    );
  }

  // ── Legacy layout (non-catalog pages) ───────────────────────────────────
  return (
    <div className={wrapperClass}>
      <div className="portal-page-header">
        <div className="portal-page-header__left">
          <h1 className="portal-page-header__title">{title}</h1>
          {subtitle && <p className="portal-page-header__subtitle">{subtitle}</p>}
        </div>
        {actionsSlot && (
          <div className="portal-page-header__actions">{actionsSlot}</div>
        )}
      </div>
      {children}
    </div>
  );
}
