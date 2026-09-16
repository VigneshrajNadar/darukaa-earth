import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { projectsApi } from '@/api/projects'
import type { ProjectSummary, Project } from '@/types'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { Alert } from '@/components/ui/Alert'
import { EmptyState } from '@/components/ui/EmptyState'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { formatArea } from '@/utils/formatters'
import { FolderKanban, Map as MapIcon, ArrowRight, Plus } from 'lucide-react'

function getErrorMessage(error: unknown, fallback: string) {
  const detail = (error as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) return detail.map(item => item?.msg || 'Invalid request').join('. ')
  return fallback
}

function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [newProject, setNewProject] = useState<{
    name: string
    description: string
    project_type: Project['project_type']
    status: Project['status']
  }>({
    name: '',
    description: '',
    project_type: 'forest_restoration',
    status: 'active',
  })

  const loadProjects = () => {
    setIsLoading(true)
    projectsApi
      .list()
      .then(res => setProjects(res.items))
      .catch(err => setError(getErrorMessage(err, 'Failed to load projects')))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    loadProjects()
  }, [])

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setSuccessMessage(null)

    if (!newProject.name.trim()) {
      setFormError('Project name is required')
      return
    }

    setIsSubmitting(true)
    try {
      await projectsApi.create({
        name: newProject.name.trim(),
        description: newProject.description.trim() || undefined,
        project_type: newProject.project_type,
        status: newProject.status,
      })
      setIsCreateModalOpen(false)
      setNewProject({
        name: '',
        description: '',
        project_type: 'forest_restoration',
        status: 'active',
      })
      loadProjects()
      setSuccessMessage('Project created successfully.')
    } catch (err: unknown) {
      setFormError(getErrorMessage(err, 'Failed to create project'))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (error) {
    return (
      <div className="p-8">
        <Alert variant="error" title="Unable to load projects">
          {error}
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
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Projects</h1>
          <p className="text-slate-400 mt-1 text-sm">
            Manage and monitor your environmental portfolios.
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" /> Create Project
        </Button>
      </div>

      {successMessage && (
        <div
          role="status"
          className="mb-6 rounded-lg border border-emerald-800 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-200"
        >
          {successMessage}
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          title="No projects yet"
          description="You haven't created any environmental projects. Get started by creating your first project."
          icon={<FolderKanban className="h-10 w-10 text-slate-600" />}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(project => (
            <Card
              key={project.id}
              className="flex flex-col hover:border-slate-700 transition-colors"
            >
              <CardHeader>
                <div className="flex justify-between items-start gap-4">
                  <CardTitle className="truncate">{project.name}</CardTitle>
                  <Badge variant={getStatusVariant(project.status)}>
                    {project.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                <p className="text-sm text-slate-400 line-clamp-2">
                  {project.description || 'No description provided.'}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-between">
                  <div>
                    <span className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                      Type
                    </span>
                    <span className="text-sm text-slate-200 capitalize break-words">
                      {project.project_type.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="sm:text-right">
                    <span className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                      Area
                    </span>
                    <span className="text-sm text-slate-200">
                      {formatArea(project.total_area_hectares)}
                    </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="justify-between">
                <div className="flex items-center text-sm text-slate-400">
                  <MapIcon className="h-4 w-4 mr-1.5" />
                  {project.site_count} {project.site_count === 1 ? 'site' : 'sites'}
                </div>
                <Link to={`/projects/${project.id}`}>
                  <Button variant="ghost" size="sm" className="text-earth-400 hover:text-earth-300">
                    View <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => !isSubmitting && setIsCreateModalOpen(false)}
        title="Create New Project"
      >
        <form onSubmit={handleCreateProject} className="space-y-4">
          {formError && (
            <Alert variant="error" title="Validation Error">
              {formError}
            </Alert>
          )}

          <Input
            label="Project Name"
            placeholder="E.g. Alpha Sector Restoration"
            value={newProject.name}
            onChange={e => setNewProject({ ...newProject, name: e.target.value })}
            required
            disabled={isSubmitting}
          />

          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-300">Description</label>
            <textarea
              className="flex w-full rounded-md border border-slate-700 bg-slate-950/50 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-earth-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              placeholder="Optional description"
              rows={3}
              value={newProject.description}
              onChange={e => setNewProject({ ...newProject, description: e.target.value })}
              disabled={isSubmitting}
            />
          </div>

          <Select
            label="Project Type"
            value={newProject.project_type}
            onChange={e =>
              setNewProject({
                ...newProject,
                project_type: e.target.value as Project['project_type'],
              })
            }
            disabled={isSubmitting}
          >
            <option value="forest_restoration">Forest Restoration</option>
            <option value="afforestation">Afforestation</option>
            <option value="mangrove_conservation">Mangrove Conservation</option>
            <option value="wetland_conservation">Wetland Conservation</option>
            <option value="biodiversity_conservation">Biodiversity Conservation</option>
            <option value="other">Other</option>
          </Select>

          <Select
            label="Status"
            value={newProject.status}
            onChange={e =>
              setNewProject({ ...newProject, status: e.target.value as Project['status'] })
            }
            disabled={isSubmitting}
          >
            <option value="planning">Planning</option>
            <option value="active">Active</option>
            <option value="monitoring">Monitoring</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </Select>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsCreateModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Create Project
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default ProjectsPage
