import { useParams } from 'react-router-dom'

/**
 * SiteDetailPage — scaffold placeholder.
 *
 * Will display individual site details including geospatial boundaries,
 * biodiversity metrics, and carbon data.
 * Requires /api/v1/sites/:siteId endpoint (not yet implemented).
 */
function SiteDetailPage() {
  const { siteId } = useParams<{ siteId: string }>()

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-slate-100">Site Detail</h1>
      <p className="text-slate-400 mt-2 text-sm">
        Site ID: <code className="text-earth-400">{siteId}</code>
      </p>
      <p className="text-slate-400 mt-1 text-sm">
        Site detail view — to be implemented once API endpoints are ready.
      </p>
    </div>
  )
}

export default SiteDetailPage
