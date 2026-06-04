// src/styles/antd-theme.ts
// Ant Design ConfigProvider theme — single source of global styling.
// See DESIGN_SPEC.md §3 for the visual identity this configures.

import type { ThemeConfig } from 'antd'

export const antdTheme: ThemeConfig = {
  token: {
    // Color
    colorPrimary: '#15a362',
    colorSuccess: '#10b981',
    colorWarning: '#f59e0b',
    colorError:   '#ef4444',
    colorTextBase: '#252930',
    colorBgBase:   '#ffffff',

    // Typography
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: 14,

    // Layout
    borderRadius: 4,

    // Component sizes
    controlHeight: 38,
  },
  components: {
    Button: {
      fontWeight: 500,
      controlHeight: 38,
      borderRadius: 4,
    },
    Card: {
      borderRadiusLG: 4,
      paddingLG: 24,
    },
    Table: {
      headerBg: '#f9fafb',
      headerColor: '#5d6778',
      rowHoverBg: '#f5f6fe',
    },
    Layout: {
      siderBg: '#ffffff',
      headerBg: '#ffffff',
      bodyBg: '#f5f6fe',
    },
  },
}
