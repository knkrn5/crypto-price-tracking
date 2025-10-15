import axios from 'axios'

const defaultBaseUrl = '/api'
const envBaseUrl = import.meta.env.VITE_API_URL

export const api = axios.create({
  baseURL: envBaseUrl && envBaseUrl.trim().length ? envBaseUrl : defaultBaseUrl,
})
