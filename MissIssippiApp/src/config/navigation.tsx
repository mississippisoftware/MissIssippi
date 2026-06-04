// src/config/navigation.tsx
// Sidebar navigation configuration. Consumed by <AppShell>.
// Adding a new section means editing this file, not the shell.

import {
  HomeOutlined,
  InboxOutlined,
  UnorderedListOutlined,
  BarcodeOutlined,
  UploadOutlined,
  TagOutlined,
  HistoryOutlined,
  SafetyOutlined,
  BgColorsOutlined,
  DollarOutlined,
  CalendarOutlined,
  ColumnHeightOutlined,
} from '@ant-design/icons'
import type { ReactNode } from 'react'

export interface NavItem {
  key: string
  label: string
  to?: string
  icon?: ReactNode
  children?: NavItem[]
}

export const navigation: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', to: '/dashboard', icon: <HomeOutlined /> },
  {
    key: 'inventory',
    label: 'Inventory',
    icon: <InboxOutlined />,
    children: [
      { key: 'inventory-list', label: 'Inventory', to: '/inventory', icon: <UnorderedListOutlined /> },
      { key: 'inventory-scan', label: 'Scan Inventory', to: '/inventory/scan', icon: <BarcodeOutlined /> },
      { key: 'inventory-upload', label: 'Upload Inventory', to: '/inventory/upload-inventory', icon: <UploadOutlined /> },
      { key: 'inventory-labels', label: 'Inventory Labels', to: '/inventory/labels', icon: <TagOutlined /> },
      { key: 'inventory-history', label: 'Inventory History', to: '/inventory/history', icon: <HistoryOutlined /> },
    ],
  },
  {
    key: 'admin',
    label: 'Admin',
    icon: <SafetyOutlined />,
    children: [
      { key: 'admin-items', label: 'Item List', to: '/admin/items-colors', icon: <BgColorsOutlined /> },
      { key: 'admin-colors', label: 'Color List', to: '/admin/color-list', icon: <TagOutlined /> },
      { key: 'admin-skus', label: 'SKU List', to: '/admin/skus', icon: <BarcodeOutlined /> },
      { key: 'admin-prices', label: 'Price List', to: '/admin/price-list', icon: <DollarOutlined /> },
      {
        key: 'admin-more',
        label: 'More Lists',
        icon: <UnorderedListOutlined />,
        children: [
          { key: 'admin-seasons', label: 'Season List', to: '/admin/season-list', icon: <CalendarOutlined /> },
          { key: 'admin-sizes', label: 'Size List', to: '/admin/size-list', icon: <ColumnHeightOutlined /> },
        ],
      },
    ],
  },
]
