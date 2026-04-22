import { PanelMenu } from "primereact/panelmenu";
import type { MenuItem } from "primereact/menuitem";
import { useLocation, useNavigate } from "react-router-dom";
import { menuItems } from "./menuItems";
import { useCallback, useMemo, useState } from "react";

export interface SidebarMenuItem {
  label: string;
  icon?: string;
  to?: string;
  items?: SidebarMenuItem[];
}

type PanelMenuItem = MenuItem & { key: string };

function getPathMatchScore(pathname: string, to?: string) {
  if (!to) return -1;
  if (pathname === to) return to.length + 1000;
  if (pathname.startsWith(to + "/")) return to.length;
  return -1;
}

function getItemKey(item: SidebarMenuItem) {
  return item.to ?? item.label;
}

function getBestDirectMatchKey(pathname: string, items: SidebarMenuItem[]): string | null {
  let bestKey: string | null = null;
  let bestScore = -1;

  items.forEach((item) => {
    const score = getPathMatchScore(pathname, item.to);
    if (score > bestScore) {
      bestScore = score;
      bestKey = getItemKey(item);
    }
  });

  return bestScore >= 0 ? bestKey : null;
}

function hasActiveChild(pathname: string, item: SidebarMenuItem): boolean {
  if (!item.items?.length) return false;
  return item.items.some((child) => getPathMatchScore(pathname, child.to) >= 0 || hasActiveChild(pathname, child));
}

function toPanelMenuModel(
  items: SidebarMenuItem[],
  pathname: string,
  onNavigate: (to: string) => void
): PanelMenuItem[] {
  const convertList = (list: SidebarMenuItem[]): PanelMenuItem[] => {
    const bestDirectKey = getBestDirectMatchKey(pathname, list);
    return list.map((item) => convert(item, bestDirectKey));
  };

  const convert = (i: SidebarMenuItem, bestDirectKey: string | null): PanelMenuItem => {
    const children = i.items?.length ? convertList(i.items) : undefined;
    const hasActiveDescendant = children?.some((child) => child.className === "active-menuitem") ?? false;
    const active = bestDirectKey === getItemKey(i) || hasActiveDescendant || hasActiveChild(pathname, i);
    const key = getItemKey(i);

    return {
      key,
      id: key,
      label: i.label,
      icon: i.icon,
      className: active ? "active-menuitem" : undefined,
      command: i.to ? () => onNavigate(i.to!) : undefined,
      items: children,
    };
  };

  return convertList(items);
}

type SidebarProps = {
  isOpen: boolean;
  onToggle: () => void;
};

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});

  const handleNavigate = useCallback(
    (to: string) => {
      if (!isOpen) {
        onToggle();
        setExpandedKeys({});
      }
      navigate(to);
    },
    [isOpen, navigate, onToggle]
  );

  const autoExpandedKeys = useMemo(() => {
    if (!isOpen) {
      return {};
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
    return nextExpanded;
  }, [isOpen, pathname]);

  const model = useMemo(
    () => toPanelMenuModel(menuItems, pathname, handleNavigate),
    [pathname, handleNavigate]
  );

  const resolvedExpandedKeys = useMemo(
    () => (isOpen ? { ...expandedKeys, ...autoExpandedKeys } : {}),
    [autoExpandedKeys, expandedKeys, isOpen]
  );

  return (
    <aside className={`portal-sidebar${isOpen ? "" : " portal-sidebar--collapsed"}`}>
      <nav className="portal-sidebar__nav">
        {isOpen && (
          <div className="portal-sidebar__nav-header">
            <button
              type="button"
              className="portal-sidebar__toggle"
              aria-label="Collapse sidebar"
              onClick={() => {
                setExpandedKeys({});
                onToggle();
              }}
            >
              <i className="pi pi-chevron-left" aria-hidden="true" />
            </button>
          </div>
        )}
        <PanelMenu
          model={model}
          expandedKeys={resolvedExpandedKeys}
          multiple
          onExpandedKeysChange={(next) => {
            if (!isOpen) {
              onToggle();
              setExpandedKeys(next ?? {});
              return;
            }
            setExpandedKeys(next);
          }}
        />
      </nav>
    </aside>
  );
}
