import type { ReactNode } from "react";

type PageActionsRowProps = {
  children: ReactNode;
  className?: string;
  justifyClassName?: string;
};

const PageActionsRow = ({ children, className, justifyClassName = "justify-content-end" }: PageActionsRowProps) => (
  <div
    className={`page-actions-row d-flex ${justifyClassName} gap-2${className ? ` ${className}` : ""}`}
  >
    {children}
  </div>
);

export default PageActionsRow;
