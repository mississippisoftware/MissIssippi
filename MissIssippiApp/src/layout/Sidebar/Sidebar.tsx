import { PanelMenu } from "primereact/panelmenu";
import type { MenuItem } from "primereact/menuitem";
import { useLocation, useNavigate } from "react-router-dom";
import { menuItems } from "./menuItems";

export interface SidebarMenuItem {
  label: string;
  icon?: string;
  to?: string;
  items?: SidebarMenuItem[];
}

function isPathActive(pathname: string, to?: string) {
  if (!to) return false;
  return pathname === to || pathname.startsWith(to + "/");
}

function hasActiveChild(pathname: string, item: SidebarMenuItem): boolean {
  if (!item.items?.length) return false;
  return item.items.some((child) => isPathActive(pathname, child.to) || hasActiveChild(pathname, child));
}

function toPanelMenuModel(
  items: SidebarMenuItem[],
  pathname: string,
  navigate: (to: string) => void
): MenuItem[] {
  const convert = (i: SidebarMenuItem): MenuItem => {
    const active = isPathActive(pathname, i.to) || hasActiveChild(pathname, i);

    return {
      label: i.label,
      icon: i.icon,
      className: active ? "active-menuitem" : undefined,
      command: i.to ? () => navigate(i.to!) : undefined,
      items: i.items?.map(convert),
    };
  };

  return items.map(convert);
}

export default function Sidebar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const model = toPanelMenuModel(menuItems, pathname, navigate);

  return (
    <aside className="app-sidebar">
      <div className="sidebar-header">
        <span className="sidebar-brand">Portal</span>
      </div>

      <nav className="sidebar-menu">
        <PanelMenu model={model} />
      </nav>
    </aside>
  );
}