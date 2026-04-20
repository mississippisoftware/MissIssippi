import type { ReactNode } from "react";

type PageActionsRowProps = {
  children: ReactNode;
  className?: string;
};

const PageActionsRow = ({ children, className }: PageActionsRowProps) => (
  <div className={`page-actions-row${className ? ` ${className}` : ""}`}>
    {children}
  </div>
);

export default PageActionsRow;
