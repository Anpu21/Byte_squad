import axios from 'axios'
import { store } from '@/store'
import { selectAuthToken } from '@/store/selectors/auth'

/**
 * Axios client for the standalone realtime service (chat REST: open a group
 * thread, fetch history). It's a SEPARATE origin from the backend — `VITE_SOCKET_URL`
 * (e.g. http://localhost:3001) — with no `/api/v1` prefix, and it returns entities
 * directly (no IApiResponse envelope). Same Bearer auth as the backend `api`.
 */
const realtimeApi = axios.create({
  baseURL: import.meta.env.VITE_SOCKET_URL ?? '',
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
})

realtimeApi.interceptors.request.use((config) => {
  const token = selectAuthToken(store.getState())
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default realtimeApi
