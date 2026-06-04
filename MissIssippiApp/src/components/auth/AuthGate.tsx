import { AuthenticatedTemplate, UnauthenticatedTemplate, useMsal } from '@azure/msal-react'
import { Button, Card } from 'antd'
import { LoginOutlined } from '@ant-design/icons'
import type { ReactNode } from 'react'
import { loginRequest } from '../../config/auth-config'

interface AuthGateProps {
  children: ReactNode
}

export default function AuthGate({ children }: AuthGateProps) {
  const { instance } = useMsal()

  const handleLogin = () => {
    instance.loginRedirect(loginRequest).catch((err) => {
      console.error('Login redirect failed:', err)
    })
  }

  return (
    <>
      <AuthenticatedTemplate>{children}</AuthenticatedTemplate>
      <UnauthenticatedTemplate>
        <div className="auth-gate">
          <Card className="auth-gate__card">
            <h1 className="auth-gate__title">MissIssippi</h1>
            <p className="auth-gate__subtitle">Sign in to continue</p>
            <Button
              type="primary"
              size="large"
              icon={<LoginOutlined />}
              onClick={handleLogin}
              block
            >
              Sign in with Microsoft
            </Button>
          </Card>
        </div>
      </UnauthenticatedTemplate>
    </>
  )
}
