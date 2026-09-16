import { apiClient } from './client'
import type { Site, PaginatedResponse } from '@/types'

export const sitesApi = {
  list: async (projectId: string, limit = 100, offset = 0): Promise<PaginatedResponse<Site>> => {
    const response = await apiClient.get<PaginatedResponse<Site>>('/sites', {
      params: { project_id: projectId, limit, offset },
    })
    return response.data
  },
  get: async (id: string): Promise<Site> => {
    const response = await apiClient.get<Site>(`/sites/${id}`)
    return response.data
  },
  getMapFeatures: async (projectId?: string): Promise<GeoJSON.FeatureCollection> => {
    const response = await apiClient.get<GeoJSON.FeatureCollection>('/sites/map', {
      params: projectId ? { project_id: projectId } : {},
    })
    return response.data
  },
  create: async (data: { name: string; project_id: string; geometry: any }): Promise<Site> => {
    const response = await apiClient.post<Site>('/sites', data)
    return response.data
  },
  update: async (id: string, data: Partial<Site>): Promise<Site> => {
    const response = await apiClient.patch<Site>(`/sites/${id}`, data)
    return response.data
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/sites/${id}`)
  },
}
