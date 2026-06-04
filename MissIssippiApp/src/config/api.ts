import axios from 'axios'
import { InteractionRequiredAuthError } from '@azure/msal-browser'
import { msalInstance } from './msalInstance'
import { loginRequest } from './auth-config'

function normalizeApiBase() {
  const raw = (import.meta.env.VITE_API_BASE ?? '/api').trim()
  if (!/^https?:\/\//i.test(raw) && !raw.startsWith('/')) {
    return `/${raw}`.replace(/\/$/, '')
  }
  return raw.replace(/\/$/, '')
}

const api = axios.create({
  baseURL: normalizeApiBase(),
})

api.interceptors.request.use(async (config) => {
  const account = msalInstance.getActiveAccount()
  if (account) {
    try {
      const result = await msalInstance.acquireTokenSilent({ ...loginRequest, account })
      config.headers.Authorization = `Bearer ${result.accessToken}`
    } catch (err) {
      if (err instanceof InteractionRequiredAuthError) {
        await msalInstance.acquireTokenRedirect(loginRequest)
      }
    }
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      msalInstance.logoutRedirect()
    }
    return Promise.reject(error)
  }
)

export default api
