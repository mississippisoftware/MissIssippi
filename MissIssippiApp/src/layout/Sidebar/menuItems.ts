import type { SidebarMenuItem } from './Sidebar';

export const menuItems: SidebarMenuItem[] = [
  { label: 'Dashboard', to: '/dashboard', icon: 'pi pi-home' },
  { label: 'Inventory', to: '/inventory', icon: 'pi pi-box' },
  {
    label: 'Settings',
    icon: 'pi pi-cog',
    items: [
      { label: 'Profile', to: '/settings/profile', icon: 'pi pi-user' },
      { label: 'Account', to: '/settings/account', icon: 'pi pi-user-edit' },
    ],
  },
];