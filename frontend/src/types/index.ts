/**
 * Shared TypeScript types for Darukaa.Earth.
 *
 * This file contains domain type definitions.
 * Types are defined here as the application grows.
 * Do not add runtime logic to this file.
 */

// ─── API Response Envelope ───────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface ApiError {
  detail: string
  status_code?: number
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
}

// ─── Domain types ────────────────────────────────────────────────────────────

export interface User {
  id: string
  email: string
  name: string
  created_at: string
}

export interface Project {
  id: string
  owner_id: string
  name: string
  description: string | null
  project_type:
    | 'forest_restoration'
    | 'afforestation'
    | 'mangrove_conservation'
    | 'wetland_conservation'
    | 'biodiversity_conservation'
    | 'other'
  status: 'planning' | 'active' | 'monitoring' | 'completed' | 'archived'
  created_at: string
  updated_at: string
}

export interface ProjectSummary extends Project {
  site_count: number
  total_area_hectares: number
}

export interface Site {
  id: string
  project_id: string
  name: string
  geometry?: any // PostGIS Geometry string if not GeoJSON
  area_hectares: number
  centroid?: any
  created_at: string
  updated_at: string
}

export interface SiteAnalytics {
  id: string
  site_id: string
  recorded_date: string
  carbon_storage_tons: number
  biodiversity_index: number
  vegetation_index: number
  tree_cover_percentage: number
  created_at: string
}

export interface DashboardSummary {
  total_projects: number
  total_sites: number
  total_area_hectares: number
  latest_carbon_tonnes: number | null
}
