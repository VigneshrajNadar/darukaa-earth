import { useCallback, useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useNavigate } from 'react-router-dom'
import { Map as MapIcon, MapPinned, PencilRuler, Plus, X } from 'lucide-react'
import { MapboxDrawControl, type MapboxDrawHandle } from '@/components/MapboxDrawControl'
import { sitesApi } from '@/api/sites'
import { projectsApi } from '@/api/projects'
import type { ProjectSummary } from '@/types'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatArea } from '@/utils/formatters'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || ''

type MapStatus = 'initializing' | 'loading' | 'success' | 'empty' | 'api_error' | 'map_error'
type ComparedSite = { id: string; name: string }
type SiteFeature = GeoJSON.Feature<
  GeoJSON.Polygon | GeoJSON.MultiPolygon,
  Record<string, string | number>
>
const EMPTY_FEATURE_COLLECTION: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [],
}

function addGeometryToBounds(bounds: mapboxgl.LngLatBounds, geometry: GeoJSON.Geometry) {
  const addRing = (ring: number[][]) =>
    ring.forEach(([longitude, latitude]) => bounds.extend([longitude, latitude]))
  if (geometry.type === 'Polygon') geometry.coordinates.forEach(addRing)
  if (geometry.type === 'MultiPolygon')
    geometry.coordinates.forEach(polygon => polygon.forEach(addRing))
  return geometry.type === 'Polygon' || geometry.type === 'MultiPolygon'
}

function MapPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const mapReadyRef = useRef(false)
  const isDrawingRef = useRef(false)
  const drawControlRef = useRef<MapboxDrawHandle>(null)
  const focusSiteRef = useRef<(feature: SiteFeature) => void>(() => undefined)
  const navigate = useNavigate()
  const [mapReady, setMapReady] = useState(false)
  const [projects, setProjects] = useState<ProjectSummary[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [compareSites, setCompareSites] = useState<ComparedSite[]>([])
  const [drawnFeature, setDrawnFeature] = useState<GeoJSON.Feature | null>(null)
  const [newSiteName, setNewSiteName] = useState('')
  const [newSiteProject, setNewSiteProject] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [mapStatus, setMapStatus] = useState<MapStatus>('initializing')
  const [mapMessage, setMapMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [createdArea, setCreatedArea] = useState<number | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [siteFeatures, setSiteFeatures] = useState<SiteFeature[]>([])
  const [selectedSiteId, setSelectedSiteId] = useState('')

  const loadSites = useCallback(async (projectId = '') => {
    const map = mapRef.current
    if (!map || !mapReadyRef.current) return
    setMapStatus('loading')
    try {
      const collection = await sitesApi.getMapFeatures(projectId || undefined)
      const source = map.getSource('sites') as mapboxgl.GeoJSONSource | undefined
      if (!source) throw new Error('Map source was not initialized')
      source.setData(collection)
      setSiteFeatures(
        collection.features.filter(
          (feature): feature is SiteFeature =>
            feature.geometry?.type === 'Polygon' || feature.geometry?.type === 'MultiPolygon'
        )
      )
      setSelectedSiteId('')
      if (!collection.features.length) {
        setMapStatus('empty')
        return
      }
      const bounds = new mapboxgl.LngLatBounds()
      const hasGeometry = collection.features.reduce(
        (hasBounds, feature) =>
          feature.geometry ? addGeometryToBounds(bounds, feature.geometry) || hasBounds : hasBounds,
        false
      )
      if (hasGeometry) map.fitBounds(bounds, { padding: 64, maxZoom: 14, duration: 700 })
      setMapStatus('success')
    } catch (error) {
      console.error('Unable to load map sites', error)
      const response = error as { response?: { status?: number } }
      setMapMessage(
        response.response?.status === 404
          ? 'The sites API is unavailable. Restart the backend with “uvicorn main:app --reload”.'
          : 'The sites API could not be reached. Confirm that the backend is running on port 8000.'
      )
      setMapStatus('api_error')
    }
  }, [])

  const addToCompare = useCallback((site: ComparedSite) => {
    setCompareSites(current => {
      if (current.some(({ id }) => id === site.id)) {
        setSuccessMessage('This site is already in comparison.')
        return current
      }
      setSuccessMessage('Added to comparison.')
      return [...current, site]
    })
  }, [])

  const focusSite = useCallback(
    (feature: SiteFeature) => {
      const map = mapRef.current
      if (!map || !feature.geometry) return
      const siteId = String(feature.properties.id)
      const bounds = new mapboxgl.LngLatBounds()
      if (!addGeometryToBounds(bounds, feature.geometry)) return
      setSelectedSiteId(siteId)
      map.fitBounds(bounds, { padding: 110, maxZoom: 13, duration: 650 })

      const content = document.createElement('div')
      content.className = 'min-w-52 space-y-3 text-slate-800'
      const title = document.createElement('p')
      title.className = 'text-sm font-semibold'
      title.textContent = String(feature.properties.name || 'Unnamed site')
      const summary = document.createElement('p')
      summary.className = 'text-xs leading-5 text-slate-600'
      summary.textContent = `${feature.properties.project_name || 'Project unavailable'} · ${formatArea(Number(feature.properties.area_hectares || 0))}`
      const actions = document.createElement('div')
      actions.className = 'flex gap-2'
      const details = document.createElement('button')
      details.type = 'button'
      details.className = 'rounded bg-emerald-800 px-2.5 py-1.5 text-xs font-medium text-white'
      details.textContent = 'View Details'
      details.addEventListener('click', () => navigate(`/sites/${siteId}`))
      const compare = document.createElement('button')
      compare.type = 'button'
      compare.className =
        'rounded border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700'
      compare.textContent = 'Add to Compare'
      compare.addEventListener('click', () =>
        addToCompare({ id: siteId, name: String(feature.properties.name || 'Unnamed site') })
      )
      actions.append(details, compare)
      content.append(title, summary, actions)
      new mapboxgl.Popup({ offset: 12, maxWidth: '280px' })
        .setLngLat(bounds.getCenter())
        .setDOMContent(content)
        .addTo(map)
    },
    [addToCompare, navigate]
  )

  useEffect(() => {
    focusSiteRef.current = focusSite
  }, [focusSite])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReadyRef.current) return
    map.setFilter('sites-selected-fill', ['==', ['get', 'id'], selectedSiteId])
    map.setFilter('sites-selected-outline', ['==', ['get', 'id'], selectedSiteId])
  }, [selectedSiteId])

  useEffect(() => {
    projectsApi
      .list()
      .then(response => setProjects(response.items))
      .catch(error => console.error('Unable to load projects', error))
  }, [])

  useEffect(() => {
    if (!mapboxgl.accessToken) {
      setMapMessage('No public Mapbox token is configured for this environment.')
      setMapStatus('map_error')
      return
    }
    if (!containerRef.current || mapRef.current) return
    const map = new mapboxgl.Map({
      container: containerRef.current,
      // Satellite land cover gives environmental context while the application
      // layers retain ownership of site/drawing/selection semantics.
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [78.9629, 20.5937],
      zoom: 4,
    })
    mapRef.current = map
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')
    map.on('error', event => {
      console.error('Mapbox error', event.error)
      setMapMessage(event.error?.message || 'Mapbox could not load the selected map style.')
      setMapStatus('map_error')
    })
    map.on('load', () => {
      map.addSource('sites', { type: 'geojson', data: EMPTY_FEATURE_COLLECTION })
      map.addLayer({
        id: 'sites-fill',
        type: 'fill',
        source: 'sites',
        paint: { 'fill-color': '#34d399', 'fill-opacity': 0.32 },
      })
      map.addLayer({
        id: 'sites-selected-fill',
        type: 'fill',
        source: 'sites',
        filter: ['==', ['get', 'id'], ''],
        paint: { 'fill-color': '#6fbe75', 'fill-opacity': 0.52 },
      })
      map.addLayer({
        id: 'sites-selected-outline',
        type: 'line',
        source: 'sites',
        filter: ['==', ['get', 'id'], ''],
        paint: { 'line-color': '#d2f2b8', 'line-width': 3.5 },
      })
      map.addLayer({
        id: 'sites-outline',
        type: 'line',
        source: 'sites',
        paint: { 'line-color': '#6ee7b7', 'line-width': 2 },
      })
      mapReadyRef.current = true
      requestAnimationFrame(() => map.resize())
      setMapReady(true)
    })
    map.on('click', 'sites-fill', event => {
      if (isDrawingRef.current || !event.features?.[0]) return
      focusSiteRef.current(event.features[0] as SiteFeature)
    })
    map.on('mouseenter', 'sites-fill', () => {
      map.getCanvas().style.cursor = 'pointer'
    })
    map.on('mouseleave', 'sites-fill', () => {
      map.getCanvas().style.cursor = ''
    })
    return () => {
      mapReadyRef.current = false
      map.remove()
      mapRef.current = null
    }
  }, [addToCompare, loadSites, navigate])

  useEffect(() => {
    if (mapReady) void loadSites(selectedProjectId)
  }, [loadSites, mapReady, selectedProjectId])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return
    const frame = requestAnimationFrame(() => map.resize())
    return () => cancelAnimationFrame(frame)
  }, [isDrawing, mapReady])

  const saveSite = async () => {
    const name = newSiteName.trim()
    if (!drawnFeature || !name || !newSiteProject) {
      setFormError('Enter a site name and select a project before saving.')
      return
    }
    setIsSubmitting(true)
    setFormError('')
    try {
      const createdSite = await sitesApi.create({
        name,
        project_id: newSiteProject,
        geometry: drawnFeature.geometry,
      })
      setDrawnFeature(null)
      setNewSiteName('')
      setCreatedArea(createdSite.area_hectares)
      setSuccessMessage(
        `Site saved — server-calculated area: ${formatArea(createdSite.area_hectares)}.`
      )
      drawControlRef.current?.clear()
      await loadSites(selectedProjectId)
    } catch (error: unknown) {
      const response = error as { response?: { data?: { detail?: string } } }
      setFormError(response.response?.data?.detail || 'Unable to save this site.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const cancelDrawing = () => {
    drawControlRef.current?.clear()
    isDrawingRef.current = false
    setIsDrawing(false)
    setDrawnFeature(null)
    setNewSiteName('')
    setFormError('')
  }

  const startDrawing = () => {
    if (!selectedProjectId) {
      setFormError('Select a project before creating a site.')
      return
    }
    setFormError('')
    setSuccessMessage('')
    setCreatedArea(null)
    setNewSiteProject(selectedProjectId)
    drawControlRef.current?.startPolygon()
    isDrawingRef.current = true
    setIsDrawing(true)
  }

  return (
    <div className="flex h-[calc(100dvh-74px)] min-h-0 flex-col">
      {!isDrawing && (
        <header className="shrink-0 border-b border-[#dfe5d9] bg-[#fbfcf8]/95 px-4 py-2 backdrop-blur sm:px-6">
          <div className="mx-auto max-w-screen-2xl">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <div className="mr-auto min-w-[12rem]">
                <h1 className="flex items-center gap-2 text-lg font-bold text-[#183c25]">
                  <MapIcon className="h-4 w-4 text-earth-600" /> Sites Map
                </h1>
                <p className="mt-0.5 text-xs text-[#718073]">
                  Curated demonstration geometries. Analytics are synthetic demonstration data.
                </p>
              </div>
              <Select
                id="map-project-filter"
                label="Project"
                aria-label="Project"
                value={selectedProjectId}
                onChange={event => setSelectedProjectId(event.target.value)}
                className="h-11 min-w-0"
                containerClassName="w-full sm:w-52"
                labelClassName="sr-only"
              >
                <option value="">All Projects</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </Select>
              <Select
                id="map-site-selector"
                label="Select site"
                aria-label="Select site"
                value={selectedSiteId}
                onChange={event => {
                  const feature = siteFeatures.find(
                    item => String(item.properties.id) === event.target.value
                  )
                  if (feature) focusSite(feature)
                }}
                className="h-11 min-w-0"
                containerClassName="w-full sm:w-52"
                labelClassName="sr-only"
              >
                <option value="">Select Site</option>
                {siteFeatures.map(feature => (
                  <option key={String(feature.properties.id)} value={String(feature.properties.id)}>
                    {String(feature.properties.name)}
                  </option>
                ))}
              </Select>
              <Button
                variant="secondary"
                disabled={compareSites.length === 0}
                onClick={() =>
                  navigate(`/compare?sites=${compareSites.map(({ id }) => id).join(',')}`)
                }
                className="h-11 shrink-0 px-3 sm:min-w-32"
                aria-label={`Compare ${compareSites.length} sites`}
              >
                Compare {compareSites.length}
              </Button>
              <Button
                onClick={startDrawing}
                disabled={!selectedProjectId || !mapReady}
                className="h-11 shrink-0 px-4"
                title={!selectedProjectId ? 'Select a project before adding a site' : undefined}
              >
                <MapPinned className="mr-2 h-4 w-4" /> <Plus className="-ml-1.5 mr-1 h-3 w-3" />
                Add Site
              </Button>
            </div>
          </div>
        </header>
      )}
      <section className="relative min-h-0 flex-1 bg-slate-950" aria-label="Interactive sites map">
        <div ref={containerRef} className="sites-map-canvas absolute inset-0" />
        {!isDrawing && (
          <Button
            onClick={startDrawing}
            disabled={!selectedProjectId || !mapReady}
            className="absolute right-[4.75rem] top-4 z-20 h-11 px-3.5 shadow-md"
            title={!selectedProjectId ? 'Select a project before drawing a site' : undefined}
            aria-label="Draw site boundary"
          >
            <PencilRuler className="mr-2 h-4 w-4" /> Draw site
          </Button>
        )}
        {successMessage && (
          <div
            className="pointer-events-none absolute left-1/2 top-4 z-20 w-[min(32rem,calc(100%-2rem))] -translate-x-1/2 rounded-lg border border-earth-200 bg-white/95 px-4 py-3 text-center text-sm font-medium text-earth-800 shadow-lg"
            role="status"
          >
            {successMessage}
          </div>
        )}
        {isDrawing && (
          <div className="pointer-events-auto absolute left-4 top-4 z-20 max-w-sm rounded-xl border border-earth-200 bg-white/95 p-4 shadow-md">
            <p className="brand-eyebrow">Drawing site</p>
            <p className="mt-2 text-sm font-medium text-earth-900">
              Click points on the map to define the site boundary. Close the polygon to continue.
            </p>
            <Button variant="ghost" size="sm" onClick={cancelDrawing} className="mt-3">
              Cancel drawing
            </Button>
          </div>
        )}
        <aside
          className="pointer-events-none absolute bottom-5 left-4 z-20 rounded-lg border border-white/20 bg-[#183c25]/90 px-3 py-2.5 text-xs text-white shadow-lg"
          aria-label="Map legend"
        >
          <p className="mb-1.5 text-[10px] font-bold tracking-[0.16em] text-[#cfe8c2]">LEGEND</p>
          <div className="space-y-1">
            <p>
              <span className="mr-2 inline-block h-2.5 w-2.5 rounded-sm bg-[#34d399]" />
              Site
            </p>
            <p>
              <span className="mr-2 inline-block h-2.5 w-2.5 rounded-sm border-2 border-[#d2f2b8] bg-[#6fbe75]" />
              Selected site
            </p>
            <p>
              <span className="mr-2 inline-block h-2.5 w-2.5 rotate-45 border border-amber-300 bg-amber-500" />
              Drawing
            </p>
          </div>
        </aside>
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-4">
          {mapStatus === 'loading' && (
            <div className="rounded-full border border-earth-200 bg-white/95 px-5 py-3 text-sm font-medium text-earth-800 shadow-lg">
              Loading sites…
            </div>
          )}
          {mapStatus === 'empty' && (
            <div className="max-w-sm rounded-xl border border-slate-700 bg-slate-900/95 p-5 text-center shadow-lg">
              <MapIcon className="mx-auto mb-2 h-7 w-7 text-slate-500" />
              <p className="font-medium text-slate-100">
                {selectedProjectId
                  ? 'No sites are currently assigned to this project.'
                  : 'No sites are currently available.'}
              </p>
            </div>
          )}
          {mapStatus === 'api_error' && (
            <div className="pointer-events-auto rounded-xl border border-red-900 bg-slate-900 p-5 text-center shadow-lg">
              <p className="mb-3 font-medium text-red-200">Unable to load sites.</p>
              <p className="mb-3 max-w-sm text-xs text-slate-500">{mapMessage}</p>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => void loadSites(selectedProjectId)}
              >
                Retry
              </Button>
            </div>
          )}
          {mapStatus === 'map_error' && (
            <div className="pointer-events-auto max-w-md rounded-xl border border-red-900 bg-slate-900 p-6 text-center shadow-lg">
              <X className="mx-auto mb-3 h-8 w-8 text-red-400" />
              <h2 className="font-semibold text-slate-100">Map could not be loaded.</h2>
              <p className="mt-2 text-sm text-slate-400">
                {mapMessage ||
                  'Check the public Mapbox token and your connection, then reload the page.'}
              </p>
            </div>
          )}
        </div>
        {mapReady && mapRef.current && (
          <MapboxDrawControl
            ref={drawControlRef}
            map={mapRef.current}
            onDrawCreate={event => {
              const feature = event.features?.[0] as GeoJSON.Feature | undefined
              if (feature) {
                isDrawingRef.current = false
                setIsDrawing(false)
                setDrawnFeature(feature)
                setFormError('')
              }
            }}
            onDrawUpdate={event => {
              const feature = event.features?.[0] as GeoJSON.Feature | undefined
              if (feature) setDrawnFeature(feature)
            }}
            onDrawDelete={() => {
              isDrawingRef.current = false
              setIsDrawing(false)
              setDrawnFeature(null)
            }}
            onModeChange={event => {
              isDrawingRef.current = event.mode === 'draw_polygon'
              setIsDrawing(event.mode === 'draw_polygon')
              if (event.mode === 'draw_polygon' && selectedProjectId)
                setNewSiteProject(selectedProjectId)
            }}
          />
        )}
        {drawnFeature && (
          <Card className="absolute left-1/2 top-4 z-20 w-[min(24rem,calc(100%-2rem))] -translate-x-1/2 shadow-md">
            <CardContent className="space-y-4 p-5">
              <h2 className="text-lg font-semibold text-slate-100">Save New Site</h2>
              {formError && (
                <p className="text-sm text-red-300" role="alert">
                  {formError}
                </p>
              )}
              <Input
                id="new-site-name"
                label="Site Name *"
                value={newSiteName}
                onChange={event => setNewSiteName(event.target.value)}
                placeholder="e.g. North restoration area"
                disabled={isSubmitting}
              />
              <Select
                id="new-site-project"
                label="Project"
                value={newSiteProject}
                onChange={event => setNewSiteProject(event.target.value)}
                disabled={isSubmitting}
              >
                <option value="">Select a project</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </Select>
              {createdArea !== null && (
                <p className="text-xs text-slate-500">
                  Server-calculated area: {formatArea(createdArea)}
                </p>
              )}
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={cancelDrawing}
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button onClick={() => void saveSite()} className="flex-1" isLoading={isSubmitting}>
                  Save site
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        {compareSites.length > 0 && (
          <Card className="absolute bottom-5 left-1/2 z-20 w-[min(28rem,calc(100%-2rem))] -translate-x-1/2 shadow-md">
            <CardContent className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-100">Compare sites</h2>
                <Badge variant="default">{compareSites.length} selected</Badge>
              </div>
              <div className="mb-3 flex flex-wrap gap-2">
                {compareSites.map(site => (
                  <Badge key={site.id} variant="info" className="gap-1.5 pr-1.5">
                    <span>{site.name}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setCompareSites(current => current.filter(({ id }) => id !== site.id))
                      }
                      className="rounded p-0.5 hover:bg-slate-800"
                      aria-label={`Remove ${site.name} from comparison`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <Button
                className="w-full"
                onClick={() =>
                  navigate(`/compare?sites=${compareSites.map(({ id }) => id).join(',')}`)
                }
              >
                Compare selected sites
              </Button>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  )
}

export default MapPage
