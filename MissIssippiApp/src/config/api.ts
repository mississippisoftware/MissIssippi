import axios from 'axios'

function normalizeApiBase() {
  const raw = (import.meta.env.VITE_API_BASE ?? '/api').trim()
  if (!/^https?:\/\//i.test(raw) && !raw.startsWith('/')) {
    return `/${raw}`.replace(/\/$/, '')
  }
  return raw.replace(/\/$/, '')
}

export const api = axios.create({
  baseURL: normalizeApiBase(),
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('auth_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
