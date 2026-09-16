import { apiClient } from './client'
import type { Project, ProjectSummary, PaginatedResponse } from '@/types'

export const projectsApi = {
  list: async (pageSize = 100, page = 1): Promise<PaginatedResponse<ProjectSummary>> => {
    const response = await apiClient.get<PaginatedResponse<ProjectSummary>>('/projects', {
      params: { page, page_size: pageSize },
    })
    return response.data
  },
  get: async (id: string): Promise<ProjectSummary> => {
    const response = await apiClient.get<ProjectSummary>(`/projects/${id}`)
    return response.data
  },
  create: async (data: Partial<Project>): Promise<Project> => {
    const response = await apiClient.post<Project>('/projects', data)
    return response.data
  },
  update: async (id: string, data: Partial<Project>): Promise<Project> => {
    const response = await apiClient.patch<Project>(`/projects/${id}`, data)
    return response.data
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/projects/${id}`)
  },
}
