import axios from 'axios'

/**
 * Axios instance pre-configured for the Darukaa.Earth API.
 *
 * Base URL is read from the VITE_API_BASE_URL environment variable.
 * Interceptors for authentication tokens will be added in the auth stage.
 *
 * SECURITY: axios@1.20.0 is pinned to avoid the supply chain attack
 * that affected versions 1.14.1 and 0.30.4 (March 2026).
 */
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
})

// ─── Request interceptor ─────────────────────────────────────────────────────
// TODO (auth stage): attach Authorization: Bearer <token> header here.
apiClient.interceptors.request.use(
  config => config,
  error => Promise.reject(error)
)

// ─── Response interceptor ────────────────────────────────────────────────────
// TODO (auth stage): handle 401 responses and trigger token refresh here.
apiClient.interceptors.response.use(
  response => response,
  error => Promise.reject(error)
)

export default apiClient
