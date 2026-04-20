import { useId, useMemo, useRef } from "react";
import { Button } from "primereact/button";
import { Menu } from "primereact/menu";
import type { MenuItem } from "primereact/menuitem";

export type PageActionMenuItem = {
  key: string;
  label: string;
  icon?: string;
  onClick: () => void;
  disabled?: boolean;
  visible?: boolean;
  separatorBefore?: boolean;
  className?: string;
};

type PageActionsMenuProps = {
  label?: string;
  icon?: string;
  items: PageActionMenuItem[];
  disabled?: boolean;
  buttonClassName?: string;
};

export default function PageActionsMenu({
  label = "Actions",
  icon = "pi pi-ellipsis-h",
  items,
  disabled = false,
  buttonClassName = "btn-neutral btn-outlined btn-sm page-actions-trigger",
}: PageActionsMenuProps) {
  const menuRef = useRef<Menu>(null);
  const popupId = useId();

  const menuModel = useMemo<MenuItem[]>(() => {
    const visibleItems = items.filter((item) => item.visible !== false);
    const model: MenuItem[] = [];

    visibleItems.forEach((item) => {
      if (item.separatorBefore && model.length > 0) {
        model.push({ separator: true });
      }

      model.push({
        label: item.label,
        icon: item.icon,
        disabled: item.disabled,
        className: item.className,
        command: () => item.onClick(),
      });
    });

    return model;
  }, [items]);

  return (
    <div className="page-actions-menu">
      <Menu model={menuModel} popup ref={menuRef} id={popupId} className="page-actions-popup-menu" />
      <Button
        type="button"
        className={buttonClassName}
        onClick={(event) => menuRef.current?.toggle(event)}
        disabled={disabled || menuModel.length === 0}
        aria-haspopup="true"
        aria-controls={popupId}
        unstyled
      >
        <i className={icon} aria-hidden="true" />
        {label}
      </Button>
    </div>
  );
}
