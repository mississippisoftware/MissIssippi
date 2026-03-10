import type { SidebarMenuItem } from './Sidebar';

export const menuItems: SidebarMenuItem[] = [
  { label: 'Dashboard', to: '/dashboard', icon: 'pi pi-home' },
  {
    label: 'Inventory',
    icon: 'pi pi-box',
    items: [
      { label: 'Scan Inventory', to: '/inventory/scan', icon: 'pi pi-barcode' },
      { label: 'View Inventory', to: '/inventory/view', icon: 'pi pi-eye' },
      { label: 'Edit Inventory', to: '/inventory/edit', icon: 'pi pi-pencil' },
      { label: 'Upload Inventory', to: '/inventory/upload-inventory', icon: 'pi pi-upload' },
      { label: 'Inventory Labels', to: '/inventory/labels', icon: 'pi pi-ticket' },
      { label: 'Inventory History', to: '/inventory/history', icon: 'pi pi-history' },
    ],
  },
  {
    label: 'Admin',
    icon: 'pi pi-shield',
    items: [
      { label: 'Item List', to: '/admin/items-colors', icon: 'pi pi-palette' },
      { label: 'Color List', to: '/admin/color-list', icon: 'pi pi-tag' },
      { label: 'SKU List', to: '/admin/skus', icon: 'pi pi-barcode' },
      { label: 'Price List', to: '/admin/price-list', icon: 'pi pi-dollar' },
      {
        label: 'More Lists',
        icon: 'pi pi-list',
        items: [
          { label: 'Season List', to: '/admin/season-list', icon: 'pi pi-calendar' },
          { label: 'Size List', to: '/admin/size-list', icon: 'pi pi-arrows-v' },
        ],
      },
    ],
  },
  {
    label: 'Settings',
    icon: 'pi pi-cog',
    items: [
      { label: 'Profile', to: '/settings/profile', icon: 'pi pi-user' },
      { label: 'Account', to: '/settings/account', icon: 'pi pi-user-edit' },
    ],
  },
];
