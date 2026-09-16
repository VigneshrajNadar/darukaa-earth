import { Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from '@/layouts/AppLayout'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import DashboardPage from '@/pages/DashboardPage'
import ProjectsPage from '@/pages/ProjectsPage'
import ProjectDetailPage from '@/pages/ProjectDetailPage'
import MapPage from '@/pages/MapPage'
import SiteDetailPage from '@/pages/SiteDetailPage'

/**
 * App — top-level route configuration.
 *
 * NOTE: Authentication guards are intentionally NOT implemented yet.
 * All routes are publicly accessible during this scaffold stage.
 * Protected route wrappers will be added in the authentication stage.
 */
function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* App shell — all protected routes will live inside AppLayout */}
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/sites/:siteId" element={<SiteDetailPage />} />
      </Route>

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Catch-all: redirect unknown routes to dashboard */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default App
