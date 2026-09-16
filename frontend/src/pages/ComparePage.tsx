import { useEffect, useState, useMemo } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { sitesApi } from '@/api/sites'
import { analyticsApi } from '@/api/analytics'
import {
  sortAnalyticsChronologically,
  filterByTimeRange,
  calculatePeriodComparison,
} from '@/analytics/calculations'
import type { Site, SiteAnalytics } from '@/types'
import type { MetricKey, TimeRangeMonths, PeriodComparison } from '@/analytics/types'
import { Select } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import { Alert } from '@/components/ui/Alert'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { formatNumber, formatPercentage as formatPercStr } from '@/utils/formatters'
import { Map as MapIcon } from 'lucide-react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const METRICS: { key: MetricKey; label: string; unit: string }[] = [
  { key: 'carbon_storage_tons', label: 'Carbon Storage', unit: 't' },
  { key: 'tree_cover_percentage', label: 'Tree Cover', unit: '%' },
  { key: 'biodiversity_index', label: 'Biodiversity', unit: 'index points' },
  { key: 'vegetation_index', label: 'Vegetation', unit: 'idx' },
]

const siteColor = (index: number) => `hsl(${(index * 137.508 + 212) % 360} 72% 47%)`

function ComparePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const siteIdsParam = searchParams.get('sites')
  const siteIds = useMemo(() => {
    if (!siteIdsParam) return []
    return siteIdsParam.split(',').filter(id => id.trim().length > 0)
  }, [siteIdsParam])

  const [sites, setSites] = useState<Site[]>([])
  const [analytics, setAnalytics] = useState<Record<string, SiteAnalytics[]>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [selectedMetric, setSelectedMetric] = useState<MetricKey>('carbon_storage_tons')
  const [timeRange, setTimeRange] = useState<TimeRangeMonths>(12)

  useEffect(() => {
    if (siteIds.length === 0) {
      setSites([])
      setAnalytics({})
      setLoading(false)
      return
    }

    let isMounted = true
    const loadData = async () => {
      setLoading(true)
      setError('')
      try {
        const sitePromises = siteIds.map(id => sitesApi.get(id).catch(() => null))
        const fetchedSites = await Promise.all(sitePromises)
        const validSites = fetchedSites.filter((s): s is Site => s !== null)

        if (validSites.length === 0 && siteIds.length > 0) {
          throw new Error('All sites failed to load')
        }

        const analyticsMap: Record<string, SiteAnalytics[]> = {}
        const analyticsPromises = validSites.map(async s => {
          try {
            const data = await analyticsApi.getForSite(s.id)
            analyticsMap[s.id] = sortAnalyticsChronologically(data)
          } catch {
            analyticsMap[s.id] = []
          }
        })
        await Promise.all(analyticsPromises)

        if (isMounted) {
          setSites(validSites)
          setAnalytics(analyticsMap)
        }
      } catch {
        if (isMounted) setError('Unable to load comparison data.')
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadData()
    return () => {
      isMounted = false
    }
  }, [siteIdsParam]) // Re-run if URL changes

  const removeSite = (idToRemove: string) => {
    const newIds = siteIds.filter(id => id !== idToRemove)
    if (newIds.length > 0) {
      setSearchParams({ sites: newIds.join(',') })
    } else {
      setSearchParams({})
    }
  }

  // Derived Data
  const { filteredAnalytics, comparisons } = useMemo(() => {
    const filtered: Record<string, SiteAnalytics[]> = {}
    const comps: Record<string, PeriodComparison> = {}

    sites.forEach(site => {
      const siteData = analytics[site.id] || []
      filtered[site.id] = filterByTimeRange(siteData, timeRange)
      comps[site.id] = calculatePeriodComparison(siteData, selectedMetric, timeRange)
    })

    return { filteredAnalytics: filtered, comparisons: comps }
  }, [sites, analytics, timeRange, selectedMetric])

  if (loading) {
    return (
      <div data-testid="loading-skeleton" className="p-8 max-w-7xl mx-auto animate-pulse">
        <Skeleton className="h-10 w-1/4 mb-4" />
        <Skeleton className="h-64 w-full mb-8" />
        <Skeleton className="h-48 w-full mb-8" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <Alert variant="error" title="Unable to load comparison" className="mb-4">
          {error}
        </Alert>
        <Button variant="secondary" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    )
  }

  if (siteIds.length === 0 || sites.length === 0) {
    return (
      <div className="p-8 max-w-7xl mx-auto h-[calc(100vh-100px)] flex items-center justify-center">
        <EmptyState
          title="Compare Sites"
          description="Select sites to compare their environmental indicators side-by-side."
          icon={<MapIcon className="h-10 w-10 text-slate-600" />}
          action={
            <Button onClick={() => navigate('/map')} className="mt-2">
              Browse Sites
            </Button>
          }
        />
      </div>
    )
  }

  const activeMetricConfig = METRICS.find(m => m.key === selectedMetric)!

  // Prepare Chart Data
  // We need a unified set of labels (dates) for the X-axis.
  // We'll collect all unique dates across all sites in the filtered range, sort them, and use them.
  const allDates = new Set<string>()
  sites.forEach(s => {
    filteredAnalytics[s.id]?.forEach(a => {
      allDates.add(a.recorded_date)
    })
  })

  const sortedDates = Array.from(allDates).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  )

  const chartLabels = sortedDates.map(d => {
    return new Date(d).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
  })

  const datasets = sites.map((site, index) => {
    const siteDataMap = new Map(filteredAnalytics[site.id]?.map(a => [a.recorded_date, a]))
    const data = sortedDates.map(dateStr => {
      const a = siteDataMap.get(dateStr)
      if (!a) return null
      const val = a[selectedMetric]
      if (val === undefined || val === null) return null
      return Number(val.toFixed(2))
    })

    return {
      label: site.name,
      data,
      borderColor: siteColor(index),
      backgroundColor: siteColor(index),
      borderWidth: 2,
      pointRadius: 3,
      pointHoverRadius: 5,
      tension: 0.3, // smooth curves
    }
  })

  const formatDisplayValue = (metric: MetricKey, value: number | null) => {
    if (value === null) return 'N/A'
    if (metric === 'biodiversity_index') return formatNumber(value, 1)
    if (metric === 'vegetation_index') return formatNumber(value, 3)
    return formatNumber(value, 0)
  }

  const formatPercentage = (value: number | null) => {
    if (value === null) return 'N/A'
    return `${value > 0 ? '+' : ''}${formatPercStr(value)}`
  }

  const formatAbsoluteChange = (metric: MetricKey, value: number | null) => {
    if (value === null) return 'N/A'
    let formatted = ''
    if (metric === 'biodiversity_index') formatted = formatNumber(value, 1)
    else if (metric === 'vegetation_index') formatted = formatNumber(value, 3)
    else formatted = formatNumber(value, 0)
    return `${value > 0 ? '+' : ''}${formatted}`
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-100 tracking-tight mb-6">Compare Sites</h1>

        <div className="flex flex-wrap gap-4 items-center mb-6">
          <span className="text-slate-400 text-sm">Selected Sites:</span>
          {sites.map((site, idx) => (
            <div
              key={site.id}
              className="flex items-center gap-2 bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-full text-sm"
            >
              <span style={{ color: siteColor(idx) }}>●</span>
              <span className="text-slate-200">{site.name}</span>
              <button
                onClick={() => removeSite(site.id)}
                className="text-slate-500 hover:text-red-400 transition-colors ml-1"
                aria-label={`Remove ${site.name}`}
              >
                &times;
              </button>
            </div>
          ))}
          <Link
            to="/map"
            className="text-earth-600 hover:text-earth-800 text-sm border border-earth-500/40 rounded-full px-3 py-1.5 transition-colors"
          >
            + Add Site
          </Link>
        </div>

        <div className="flex flex-wrap gap-4 items-center bg-slate-900 p-5 rounded-xl border border-slate-800">
          <Select
            label="Metric"
            value={selectedMetric}
            onChange={e => setSelectedMetric(e.target.value as MetricKey)}
            className="w-auto min-w-[200px]"
          >
            {METRICS.map(m => (
              <option key={m.key} value={m.key}>
                {m.label}
              </option>
            ))}
          </Select>

          <Select
            label="Time Range"
            value={timeRange}
            onChange={e =>
              setTimeRange(
                e.target.value === 'all' ? 'all' : (Number(e.target.value) as TimeRangeMonths)
              )
            }
            className="w-auto min-w-[200px]"
          >
            <option value={3}>Last 3 months</option>
            <option value={6}>Last 6 months</option>
            <option value={12}>Last 12 months</option>
            <option value={24}>Last 24 months</option>
            <option value="all">All available</option>
          </Select>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-8">
        <h2 className="text-lg font-semibold text-slate-100 mb-6">Comparison Chart</h2>
        <div className="h-[400px]">
          <Line
            data={{ labels: chartLabels, datasets }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              interaction: {
                mode: 'index',
                intersect: false,
              },
              plugins: {
                legend: {
                  position: 'top',
                  labels: { color: '#345440', usePointStyle: true },
                },
                tooltip: {
                  backgroundColor: '#0f172a',
                  titleColor: '#f1f5f9',
                  bodyColor: '#cbd5e1',
                  borderColor: '#334155',
                  borderWidth: 1,
                  callbacks: {
                    label: context =>
                      `${context.dataset.label}: ${context.parsed.y} ${activeMetricConfig.unit}`,
                  },
                },
              },
              scales: {
                x: {
                  grid: { color: '#d7e1d2' },
                  ticks: { color: '#526356' },
                },
                y: {
                  grid: { color: '#d7e1d2' },
                  ticks: { color: '#526356' },
                  beginAtZero: true,
                },
              },
            }}
          />
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden mb-8">
        <div className="p-5 border-b border-slate-800">
          <h2 className="text-lg font-semibold text-slate-100">Comparison Table</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-xs uppercase text-slate-400">
              <tr>
                <th className="px-6 py-4 font-medium">Metric</th>
                {sites.map(s => (
                  <th key={s.id} className="px-6 py-4 font-medium">
                    {s.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              <tr className="hover:bg-slate-800/50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-200">Latest Value</td>
                {sites.map(s => (
                  <td key={s.id} className="px-6 py-4">
                    {formatDisplayValue(selectedMetric, comparisons[s.id].currentValue)}{' '}
                    {activeMetricConfig.unit}
                  </td>
                ))}
              </tr>
              <tr className="hover:bg-slate-800/50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-200">Previous Period</td>
                {sites.map(s => (
                  <td key={s.id} className="px-6 py-4">
                    {comparisons[s.id].previousValue !== null
                      ? `${formatDisplayValue(selectedMetric, comparisons[s.id].previousValue as number)} ${activeMetricConfig.unit}`
                      : 'No previous period'}
                  </td>
                ))}
              </tr>
              <tr className="hover:bg-slate-800/50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-200">Absolute Change</td>
                {sites.map(s => (
                  <td key={s.id} className="px-6 py-4">
                    {formatAbsoluteChange(selectedMetric, comparisons[s.id].absoluteChange)}{' '}
                    {comparisons[s.id].absoluteChange !== null ? activeMetricConfig.unit : ''}
                  </td>
                ))}
              </tr>
              <tr className="hover:bg-slate-800/50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-200">Percentage Change</td>
                {sites.map(s => (
                  <td key={s.id} className="px-6 py-4">
                    {formatPercentage(comparisons[s.id].percentageChange)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">
          Data Provenance
        </h3>
        <p className="text-slate-400 text-sm leading-relaxed mb-2">
          <span className="text-amber-500 font-medium">
            Demonstration Data · Synthetic environmental metrics
          </span>
        </p>
        <p className="text-slate-400 text-sm leading-relaxed">
          Comparisons and attention indicators are derived from application-defined rules applied to
          synthetic demonstration data. They are not scientific, regulatory, or ecological
          assessments.
        </p>
      </div>
    </div>
  )
}

export default ComparePage
