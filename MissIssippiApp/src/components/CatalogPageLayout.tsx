import type { ReactNode } from "react";
import PortalPageHeader, { type PageHeaderAction } from "./PortalPageHeader";

type CatalogPageLayoutProps = {
  title: string;
  subtitle?: string;
  actions?: PageHeaderAction[];
  actionsSlot?: ReactNode;
  actionsClassName?: string;
  headerClassName?: string;
  headerContent?: ReactNode;
  className?: string;
  children: ReactNode;
};

export default function CatalogPageLayout({
  title,
  subtitle,
  actions = [],
  actionsSlot,
  actionsClassName,
  headerClassName = "",
  headerContent,
  className = "",
  children,
}: CatalogPageLayoutProps) {
  const headerClasses = ["content-topbar--catalog", headerClassName].filter(Boolean).join(" ");
  return (
    <>
      <PortalPageHeader
        title={title}
        subtitle={subtitle}
        actions={actions}
        actionsSlot={actionsSlot}
        actionsClassName={actionsClassName}
        className={headerClasses}
      >
        {headerContent}
      </PortalPageHeader>
      <div className={`catalog-page ${className}`.trim()}>
        {children}
      </div>
    </>
  );
}
