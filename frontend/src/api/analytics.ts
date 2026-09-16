import { apiClient } from './client'
import type { SiteAnalytics, PaginatedResponse } from '@/types'

interface BackendAnalytics {
  id: string
  site_id: string
  recorded_date: string
  carbon_tonnes: number
  biodiversity_score: number
  vegetation_index: number
  tree_cover_percentage: number
  created_at: string
}

export const analyticsApi = {
  getForSite: async (siteId: string): Promise<SiteAnalytics[]> => {
    const response = await apiClient.get<PaginatedResponse<BackendAnalytics>>(
      `/sites/${siteId}/analytics`
    )

    return response.data.items.map(item => ({
      id: item.id,
      site_id: item.site_id,
      recorded_date: item.recorded_date,
      carbon_storage_tons: item.carbon_tonnes,
      biodiversity_index: item.biodiversity_score,
      vegetation_index: item.vegetation_index,
      tree_cover_percentage: item.tree_cover_percentage,
      created_at: item.created_at,
    }))
  },
}
