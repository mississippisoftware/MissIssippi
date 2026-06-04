import { type ReactNode, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Layout, Menu, Avatar, Space, Typography, Dropdown } from 'antd'
import type { MenuProps } from 'antd'
import { useAuth } from '../../hooks/useAuth'
import { navigation } from '../../config/navigation'
import type { NavItem } from '../../config/navigation'

type AntMenuItem = Required<MenuProps>['items'][number]

function toAntMenuItems(items: NavItem[]): AntMenuItem[] {
  return items.map(item => ({
    key: item.key,
    label: item.label,
    icon: item.icon,
    children: item.children ? toAntMenuItems(item.children) : undefined,
  }))
}

function buildKeyToPath(items: NavItem[], map: Record<string, string> = {}): Record<string, string> {
  for (const item of items) {
    if (item.to) map[item.key] = item.to
    if (item.children) buildKeyToPath(item.children, map)
  }
  return map
}

function findActiveKey(items: NavItem[], pathname: string): string | null {
  let bestKey: string | null = null
  let bestScore = -1

  function score(to: string): number {
    if (pathname === to) return to.length + 1000
    if (pathname.startsWith(to + '/')) return to.length
    return -1
  }

  function walk(items: NavItem[]) {
    for (const item of items) {
      if (item.to) {
        const s = score(item.to)
        if (s > bestScore) {
          bestScore = s
          bestKey = item.key
        }
      }
      if (item.children) walk(item.children)
    }
  }

  walk(items)
  return bestKey
}

function findParentKeys(items: NavItem[], targetKey: string, ancestors: string[] = []): string[] | null {
  for (const item of items) {
    if (item.key === targetKey) return ancestors
    if (item.children) {
      const result = findParentKeys(item.children, targetKey, [...ancestors, item.key])
      if (result !== null) return result
    }
  }
  return null
}

function getInitials(name?: string, username?: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    return parts[0][0].toUpperCase()
  }
  if (username) return username[0].toUpperCase()
  return '?'
}

// Computed once from static config — no need to useMemo in the component.
const menuItems = toAntMenuItems(navigation)
const keyToPath = buildKeyToPath(navigation)

export default function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { currentUser, logout } = useAuth()

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'logout',
      label: 'Sign out',
      onClick: () => { logout() },
    },
  ]

  const selectedKeys = useMemo(() => {
    const key = findActiveKey(navigation, pathname)
    return key ? [key] : []
  }, [pathname])

  const defaultOpenKeys = useMemo(() => {
    const key = findActiveKey(navigation, pathname)
    return key ? (findParentKeys(navigation, key) ?? []) : []
  }, [pathname])

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout.Sider
        width={250}
        theme="light"
        collapsible={false}
        // Layout.Sider has no built-in border token; using inline style to separate sidebar from content.
        style={{ borderRight: '1px solid var(--color-border)' }}
      >
        <div style={{ height: 56, display: 'flex', alignItems: 'center', padding: '0 var(--space-5)' }}>
          <Space>
            <Avatar size={28} style={{ backgroundColor: 'var(--color-primary)' }}>M</Avatar>
            <Typography.Title level={4} style={{ margin: 0 }}>Miss Issippi</Typography.Title>
          </Space>
        </div>
        <Menu
          mode="inline"
          theme="light"
          selectedKeys={selectedKeys}
          defaultOpenKeys={defaultOpenKeys}
          inlineIndent={16}
          items={menuItems}
          onClick={({ key }) => {
            const to = keyToPath[key]
            if (to) navigate(to)
          }}
        />
      </Layout.Sider>

      <Layout>
        {/* Height overridden to 56px via style — Layout.Header does not expose a height token in ConfigProvider. */}
        <Layout.Header
          style={{
            height: 56,
            lineHeight: '56px',
            padding: '0 var(--space-6)',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Space style={{ marginLeft: 'auto' }} className="topbar-user">
            <Dropdown menu={{ items: userMenuItems }} trigger={['click']} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar
                  size={28}
                  style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}
                  className="topbar-user__avatar"
                >
                  {getInitials(currentUser?.displayName, currentUser?.email)}
                </Avatar>
                <Typography.Text className="topbar-user__name">
                  {currentUser?.displayName ?? currentUser?.email ?? ''}
                </Typography.Text>
              </Space>
            </Dropdown>
          </Space>
        </Layout.Header>

        <Layout.Content style={{ padding: 'var(--space-6)' }}>
          {children}
        </Layout.Content>
      </Layout>
    </Layout>
  )
}
