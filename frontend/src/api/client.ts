import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export const api = axios.create({ baseURL: API_URL })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Types
export interface User { id: number; email: string; role: string }
export interface Case { id: number; name: string; description?: string; status: string; created_by: number; created_at: string }
export interface Scan {
  id: number; case_id: number; image_path: string; image_hash?: string
  status: 'queued' | 'running' | 'complete' | 'failed'
  config: Record<string, unknown>; total_bytes?: number; elapsed_seconds?: number
  error_message?: string; started_at?: string; completed_at?: string; created_at: string
}
export interface Feature { id: number; feature_type: string; offset?: number; forensic_path?: string; value: string; context?: string }
export interface HistogramEntry { value: string; count: number }

// Auth
export const login = (email: string, password: string) =>
  api.post<{ access_token: string }>('/auth/login', new URLSearchParams({ username: email, password }))
export const register = (email: string, password: string) =>
  api.post<User>('/auth/register', { email, password })
export const getMe = () => api.get<User>('/auth/me')

// Cases
export const getCases = () => api.get<Case[]>('/cases')
export const createCase = (name: string, description?: string) => api.post<Case>('/cases', { name, description })
export const getCase = (id: number) => api.get<Case>(`/cases/${id}`)

// Scans
export const getScans = (caseId: number) => api.get<Scan[]>(`/cases/${caseId}/scans`)
export const createScan = (caseId: number, image_path: string, config = {}) =>
  api.post<Scan>(`/cases/${caseId}/scans`, { image_path, config })
export const getScan = (id: number) => api.get<Scan>(`/scans/${id}`)
export const getScanSummary = (id: number) => api.get<Record<string, number>>(`/scans/${id}/summary`)
export const getFeatures = (id: number, params: Record<string, unknown>) =>
  api.get<Feature[]>(`/scans/${id}/features`, { params })
export const getHistograms = (id: number, type: string) =>
  api.get<HistogramEntry[]>(`/scans/${id}/histograms`, { params: { type } })
export const getAlerts = (id: number) => api.get<Feature[]>(`/scans/${id}/alerts`)
