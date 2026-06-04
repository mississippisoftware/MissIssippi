import { PublicClientApplication } from '@azure/msal-browser'
import { msalConfig } from './auth-config'

export const msalInstance = new PublicClientApplication(msalConfig)
