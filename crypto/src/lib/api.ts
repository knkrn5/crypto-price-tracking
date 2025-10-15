import axios from 'axios'

const defaultBaseUrl = '/api'

const resolveBaseUrl = () => {
  const raw = import.meta.env.VITE_API_URL
  if (!raw || !raw.trim().length) {
    return defaultBaseUrl
  }
  const normalized = raw.trim().replace(/\/$/, '')
  return normalized.endsWith('/api') ? normalized : `${normalized}/api`
}

export const api = axios.create({
  baseURL: resolveBaseUrl(),
})
