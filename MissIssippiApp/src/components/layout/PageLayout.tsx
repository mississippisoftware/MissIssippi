import type { ReactNode } from 'react'
import { Typography } from 'antd'

type PageLayoutProps = {
  title: string
  subtitle?: ReactNode
  actionsRight?: ReactNode
  stepper?: ReactNode
  // Transitional: allows pages to pass legacy className (e.g. catalog-page--wide) to the content div.
  // Will be cleaned up once portal-theme.css layout classes are fully replaced.
  className?: string
  children: ReactNode
}

export default function PageLayout({ title, subtitle, actionsRight, stepper, className, children }: PageLayoutProps) {
  return (
    <>
      {/* Header zone: border-bottom applied via style — no ConfigProvider token for page-header border */}
      <div
        style={{
          padding: '0 0 var(--space-5) 0',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'flex-start',
        }}
      >
        <div>
          <Typography.Title level={2} style={{ margin: 0, fontSize: 'var(--font-size-page-title)' }}>
            {title}
          </Typography.Title>
          {subtitle != null && (
            <Typography.Text type="secondary" style={{ fontSize: 'var(--font-size-sm)' }}>
              {subtitle}
            </Typography.Text>
          )}
        </div>
        {actionsRight != null && (
          <div style={{ marginLeft: 'auto' }}>
            {actionsRight}
          </div>
        )}
      </div>

      {/* Optional stepper slot — rendered between header border and content */}
      {stepper != null && <div style={{ marginTop: 'var(--space-4)' }}>{stepper}</div>}

      {/* Content area */}
      <div className={className} style={{ marginTop: 'var(--space-6)' }}>
        {children}
      </div>
    </>
  )
}
