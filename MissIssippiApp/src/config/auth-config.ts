import { LogLevel } from '@azure/msal-browser'
import type { Configuration, RedirectRequest } from '@azure/msal-browser'

const clientId = import.meta.env.VITE_ENTRA_CLIENT_ID as string
const tenantId = import.meta.env.VITE_ENTRA_TENANT_ID as string

if (!clientId || !tenantId) {
  throw new Error(
    'Missing Entra ID config: VITE_ENTRA_CLIENT_ID and VITE_ENTRA_TENANT_ID must be set in .env.local'
  )
}

export const msalConfig: Configuration = {
  auth: {
    clientId,
    authority: `https://login.microsoftonline.com/${tenantId}`,
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: () => {},
      logLevel: LogLevel.Warning,
    },
  },
}

export const loginRequest: RedirectRequest = {
  scopes: [`api://${clientId}/access_as_user`],
}
