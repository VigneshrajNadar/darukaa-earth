import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { projectsApi } from '@/api/projects'
import { sitesApi } from '@/api/sites'
import type { ProjectSummary, Site } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatArea } from '@/utils/formatters'
import { Map as MapIcon, ArrowLeft, ArrowRight, Calendar } from 'lucide-react'

function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>()

  const [project, setProject] = useState<ProjectSummary | null>(null)
  const [sites, setSites] = useState<Site[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!projectId) return

    Promise.all([projectsApi.get(projectId), sitesApi.list(projectId)])
      .then(([projData, sitesData]) => {
        setProject(projData)
        setSites(sitesData.items)
      })
      .catch(err => setError(err?.response?.data?.detail || 'Failed to load project details'))
      .finally(() => setIsLoading(false))
  }, [projectId])

  if (isLoading) {
    return (
      <div className="p-8 max-w-6xl mx-auto animate-pulse">
        <Skeleton className="h-8 w-32 mb-6" />
        <Skeleton className="h-24 w-full mb-8 rounded-xl" />
        <Skeleton className="h-10 w-48 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <Alert variant="error" title="Unable to load project">
          {error || 'Project not found'}
        </Alert>
      </div>
    )
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'success'
      case 'planning':
        return 'info'
      case 'completed':
        return 'default'
      case 'on_hold':
        return 'warning'
      default:
        return 'default'
    }
  }

  return (
    <div className="p-8 animate-in fade-in duration-500 max-w-6xl mx-auto">
      <div className="mb-8">
        <Link
          to="/projects"
          className="text-earth-500 hover:text-earth-400 text-sm mb-4 inline-flex items-center transition-colors"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to Projects
        </Link>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mt-2">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-slate-100 tracking-tight">{project.name}</h1>
              <Badge variant={getStatusVariant(project.status)}>
                {project.status.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
            <p className="text-slate-400 mt-1 max-w-2xl">
              {project.description || 'No description provided.'}
            </p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 min-w-[200px]">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">
                  Total Area
                </p>
                <p className="text-lg font-bold text-slate-100">
                  {formatArea(project.total_area_hectares)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">
                  Type
                </p>
                <p className="text-sm font-medium text-slate-200 capitalize">
                  {project.project_type}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 flex justify-between items-center border-b border-slate-800 pb-4">
        <h2 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
          <MapIcon className="h-5 w-5 text-earth-500" /> Sites
        </h2>
        <Link to="/map">
          <Button variant="secondary" size="sm">
            Add Site
          </Button>
        </Link>
      </div>

      {sites.length === 0 ? (
        <EmptyState
          title="No sites yet"
          description="This project does not have any monitoring sites associated with it yet."
          icon={<MapIcon className="h-10 w-10 text-slate-600" />}
          action={
            <Link to="/map">
              <Button className="mt-2">Go to Map to Add Sites</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sites.map(site => (
            <Card key={site.id} className="flex flex-col hover:border-slate-700 transition-colors">
              <CardHeader className="pb-3">
                <CardTitle className="truncate">{site.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                      Area
                    </span>
                    <span className="text-sm text-slate-200">{formatArea(site.area_hectares)}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                      Created
                    </span>
                    <span className="text-sm text-slate-200 flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-500" />
                      {new Date(site.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardContent>
              <div className="px-6 py-4 border-t border-slate-800/50 mt-auto">
                <Link to={`/sites/${site.id}`}>
                  <Button variant="ghost" className="w-full text-earth-400 hover:text-earth-300">
                    View Analytics <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default ProjectDetailPage
