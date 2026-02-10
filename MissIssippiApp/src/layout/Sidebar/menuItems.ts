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
    ],
  },
  {
    label: 'Admin',
    icon: 'pi pi-shield',
    items: [
      { label: 'Item List', to: '/admin/items-colors', icon: 'pi pi-palette' },
      { label: 'Color List', to: '/admin/color-list', icon: 'pi pi-tag' },
      { label: 'Price List', to: '/admin/price-list', icon: 'pi pi-dollar' },
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
