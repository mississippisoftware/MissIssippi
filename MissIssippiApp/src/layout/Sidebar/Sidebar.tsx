import { PanelMenu } from "primereact/panelmenu";
import type { MenuItem } from "primereact/menuitem";
import { useLocation, useNavigate } from "react-router-dom";
import { menuItems } from "./menuItems";
import { useEffect, useMemo, useRef, useState } from "react";

export interface SidebarMenuItem {
  label: string;
  icon?: string;
  to?: string;
  items?: SidebarMenuItem[];
}

type PanelMenuItem = MenuItem & { key: string };

function isPathActive(pathname: string, to?: string) {
  if (!to) return false;
  return pathname === to || pathname.startsWith(to + "/");
}

function getItemKey(item: SidebarMenuItem) {
  return item.to ?? item.label;
}

function hasActiveChild(pathname: string, item: SidebarMenuItem): boolean {
  if (!item.items?.length) return false;
  const basePath = item.items
    .map((child) => child.to)
    .find((to): to is string => Boolean(to))
    ?.split("/")
    .slice(0, 2)
    .join("/");

  if (basePath && pathname.startsWith(basePath)) {
    return true;
  }

  return item.items.some((child) => isPathActive(pathname, child.to) || hasActiveChild(pathname, child));
}

function toPanelMenuModel(
  items: SidebarMenuItem[],
  pathname: string,
  onNavigate: (to: string) => void
): PanelMenuItem[] {
  const convert = (i: SidebarMenuItem): PanelMenuItem => {
    const active = isPathActive(pathname, i.to) || hasActiveChild(pathname, i);
    const key = getItemKey(i);

    return {
      key,
      id: key,
      label: i.label,
      icon: i.icon,
      className: active ? "active-menuitem" : undefined,
      command: i.to ? () => onNavigate(i.to!) : undefined,
      items: i.items?.map(convert),
    };
  };

  return items.map(convert);
}

type SidebarProps = {
  isOpen: boolean;
  onToggle: () => void;
};

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});
  const [flyoutKey, setFlyoutKey] = useState<string | null>(null);
  const sidebarRef = useRef<HTMLElement | null>(null);

  const handleNavigate = (to: string) => {
    if (!isOpen) {
      onToggle();
      setExpandedKeys({});
      setFlyoutKey(null);
    }
    navigate(to);
  };

  const model = useMemo(
    () => toPanelMenuModel(menuItems, pathname, handleNavigate),
    [pathname, handleNavigate]
  );

  useEffect(() => {
    if (!isOpen) {
      setExpandedKeys({});
      return;
    }
    const nextExpanded: Record<string, boolean> = {};
    const walk = (items: SidebarMenuItem[]) => {
      items.forEach((item) => {
        if (hasActiveChild(pathname, item) && item.items?.length) {
          const key = getItemKey(item);
          nextExpanded[key] = true;
        }
        if (item.items?.length) {
          walk(item.items);
        }
      });
    };
    walk(menuItems);
    setExpandedKeys((prev) => ({ ...prev, ...nextExpanded }));
  }, [pathname, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setFlyoutKey(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen || !flyoutKey) {
      return;
    }

    const handleClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!sidebarRef.current || sidebarRef.current.contains(target)) {
        return;
      }
      setExpandedKeys({});
      setFlyoutKey(null);
    };

    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("mousedown", handleClick);
    };
  }, [isOpen, flyoutKey]);

  const flyoutItem = useMemo(() => {
    if (isOpen || !flyoutKey) return null;
    return menuItems.find((item) => getItemKey(item) === flyoutKey) ?? null;
  }, [flyoutKey, isOpen]);

  return (
    <aside ref={sidebarRef} className={`app-sidebar${isOpen ? "" : " is-collapsed"}`}>
      <div className="sidebar-header">
        <span className="sidebar-brand">
          <span className="sidebar-brand-text"></span>
        </span>
        <button
          type="button"
          className="sidebar-toggle"
          aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
          onClick={onToggle}
        >
          <i className="pi pi-bars" aria-hidden="true" />
        </button>
      </div>

      <nav className="sidebar-menu">
        <PanelMenu
          model={model}
          expandedKeys={expandedKeys}
          multiple
          onExpandedKeysChange={(next) => {
            if (!isOpen) {
              onToggle();
              setExpandedKeys(next ?? {});
              setFlyoutKey(null);
              return;
            }
            setExpandedKeys(next);
          }}
        />
      </nav>

      {!isOpen && flyoutItem?.items?.length ? (
        <div className="sidebar-flyout" role="menu" aria-label={`${flyoutItem.label} submenu`}>
          <div className="sidebar-flyout-header">{flyoutItem.label}</div>
          <ul className="sidebar-flyout-list">
            {flyoutItem.items.map((item) => {
              const active = isPathActive(pathname, item.to);
              return (
                <li key={getItemKey(item)}>
                  <button
                    type="button"
                    className={`sidebar-flyout-link${active ? " is-active" : ""}`}
                    onClick={() => {
                      if (item.to) {
                        handleNavigate(item.to);
                      }
                    }}
                  >
                    {item.icon ? <i className={item.icon} aria-hidden="true" /> : null}
                    <span>{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </aside>
  );
}
