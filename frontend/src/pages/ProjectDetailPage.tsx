import { useParams } from 'react-router-dom'

/**
 * ProjectDetailPage — scaffold placeholder.
 *
 * Will display individual project details, associated sites, and analytics.
 * Requires /api/v1/projects/:projectId endpoint (not yet implemented).
 */
function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>()

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-slate-100">Project Detail</h1>
      <p className="text-slate-400 mt-2 text-sm">
        Project ID: <code className="text-earth-400">{projectId}</code>
      </p>
      <p className="text-slate-400 mt-1 text-sm">
        Project detail view — to be implemented once API endpoints are ready.
      </p>
    </div>
  )
}

export default ProjectDetailPage
