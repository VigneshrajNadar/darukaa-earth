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

// ─── Domain types (stubs — will be expanded in later stages) ─────────────────

export interface User {
  id: string
  email: string
  full_name: string
  created_at: string
}

export interface Project {
  id: string
  name: string
  description: string
  created_at: string
  updated_at: string
}

export interface Site {
  id: string
  project_id: string
  name: string
  created_at: string
}
