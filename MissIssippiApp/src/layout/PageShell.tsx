import type { ReactNode } from "react";

type PageShellProps = {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  tabs?: ReactNode;
  children: ReactNode;
};

export default function PageShell({ title, subtitle, actions, tabs, children }: PageShellProps) {
  return (
    <div className="pt-page">
      <div className={`portal-page-header${tabs != null ? " portal-page-header--has-tabs" : ""}`}>
        <div className="portal-page-header__left">
          <h1 className="portal-page-header__title">{title}</h1>
          {subtitle != null && <p className="portal-page-header__subtitle">{subtitle}</p>}
        </div>
        {actions != null && <div className="portal-page-header__actions">{actions}</div>}
      </div>
      {tabs != null && <div className="portal-page-header__tabs">{tabs}</div>}
      <div className="pt-page-canvas">
        {children}
      </div>
    </div>
  );
}
