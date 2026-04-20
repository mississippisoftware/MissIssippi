import type { ReactNode } from "react";
import PortalPageHeader from "./PortalPageHeader";

type CatalogPageLayoutProps = {
  title: string;
  subtitle?: string;
  actionsSlot?: ReactNode;
  headerClassName?: string;
  headerContent?: ReactNode;
  /** When provided, threads into PortalPageHeader as filtersSlot,
   *  activating the unified .page-control-zone layout.
   *  The content area becomes .page-data-surface (no outer padding/chrome). */
  filtersSlot?: ReactNode;
  className?: string;
  children: ReactNode;
};

export default function CatalogPageLayout({
  title,
  subtitle,
  actionsSlot,
  headerClassName = "",
  headerContent,
  filtersSlot,
  className = "",
  children,
}: CatalogPageLayoutProps) {
  const headerClasses = ["content-topbar--catalog", headerClassName].filter(Boolean).join(" ");

  const contentClass = filtersSlot
    ? ["page-data-surface", className].filter(Boolean).join(" ")
    : [`catalog-page`, className].filter(Boolean).join(" ");

  return (
    <>
      <PortalPageHeader
        title={title}
        subtitle={subtitle}
        actionsSlot={actionsSlot}
        filtersSlot={filtersSlot}
        className={headerClasses}
      >
        {headerContent}
      </PortalPageHeader>
      <div className={contentClass}>
        {children}
      </div>
    </>
  );
}
