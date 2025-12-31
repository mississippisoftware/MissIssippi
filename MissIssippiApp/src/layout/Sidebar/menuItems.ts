import type { SidebarMenuItem } from './Sidebar';

export const menuItems: SidebarMenuItem[] = [
  { label: 'Dashboard', to: '/dashboard', icon: 'pi pi-home' },
  {
    label: 'Inventory',
    icon: 'pi pi-box',
    items: [
      { label: 'View Inventory', to: '/inventory/view', icon: 'pi pi-eye' },
      { label: 'Edit Inventory', to: '/inventory/edit', icon: 'pi pi-pencil' },
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