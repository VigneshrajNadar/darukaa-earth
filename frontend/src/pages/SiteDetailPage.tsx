import { useEffect, useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { sitesApi } from '@/api/sites'
import { analyticsApi } from '@/api/analytics'
import { KpiCard } from '@/components/analytics/KpiCard'
import { TrendChart } from '@/components/analytics/TrendChart'
import {
  sortAnalyticsChronologically,
  filterByTimeRange,
  calculatePeriodComparison,
  calculatePerformanceScore,
} from '@/analytics/calculations'
import { getAttentionIndicators } from '@/analytics/indicators'
import type { Site, SiteAnalytics } from '@/types'
import type { MetricKey, TimeRangeMonths } from '@/analytics/types'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { Alert } from '@/components/ui/Alert'
import { Skeleton } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/Button'
import { formatNumber, formatArea } from '@/utils/formatters'
import { ArrowLeft } from 'lucide-react'

const METRICS: { key: MetricKey; label: string; unit: string; color: string }[] = [
  { key: 'carbon_storage_tons', label: 'Carbon Storage', unit: 't', color: '#10b981' }, // emerald
  { key: 'tree_cover_percentage', label: 'Tree Cover', unit: '%', color: '#84cc16' }, // lime
  { key: 'biodiversity_index', label: 'Biodiversity', unit: 'index points', color: '#3b82f6' }, // blue
  { key: 'vegetation_index', label: 'Vegetation', unit: 'idx', color: '#f59e0b' }, // amber
]

function SiteDetailPage() {
  const { siteId } = useParams<{ siteId: string }>()

  const [site, setSite] = useState<Site | null>(null)
  const [rawAnalytics, setRawAnalytics] = useState<SiteAnalytics[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [selectedMetric, setSelectedMetric] = useState<MetricKey>('carbon_storage_tons')
  const [timeRange, setTimeRange] = useState<TimeRangeMonths>(12)

  useEffect(() => {
    if (!siteId) return
    let isMounted = true

    const loadData = async () => {
      setLoading(true)
      try {
        const [siteData, analyticsData] = await Promise.all([
          sitesApi.get(siteId),
          analyticsApi.getForSite(siteId),
        ])

        if (isMounted) {
          setSite(siteData)
          setRawAnalytics(sortAnalyticsChronologically(analyticsData))
        }
      } catch {
        if (isMounted) setError('Unable to load environmental analytics.')
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    loadData()

    return () => {
      isMounted = false
    }
  }, [siteId])

  const { filteredAnalytics, comparisons, performanceScore, indicators } = useMemo(() => {
    const latestData = rawAnalytics.length > 0 ? rawAnalytics[rawAnalytics.length - 1] : null
    const score = calculatePerformanceScore(latestData)

    const comps = {
      carbon_storage_tons: calculatePeriodComparison(
        rawAnalytics,
        'carbon_storage_tons',
        timeRange
      ),
      tree_cover_percentage: calculatePeriodComparison(
        rawAnalytics,
        'tree_cover_percentage',
        timeRange
      ),
      biodiversity_index: calculatePeriodComparison(rawAnalytics, 'biodiversity_index', timeRange),
      vegetation_index: calculatePeriodComparison(rawAnalytics, 'vegetation_index', timeRange),
    }

    const filtered = filterByTimeRange(rawAnalytics, timeRange)

    const calculatedIndicators = getAttentionIndicators(comps)

    return {
      filteredAnalytics: filtered,
      comparisons: comps,
      performanceScore: score,
      indicators: calculatedIndicators,
    }
  }, [rawAnalytics, timeRange])

  if (loading) {
    return (
      <div data-testid="loading-skeleton" className="p-8 max-w-7xl mx-auto animate-pulse">
        <Skeleton className="h-10 w-1/4 mb-4" />
        <Skeleton className="h-32 w-full mb-8" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    )
  }

  if (error || !site) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <Alert variant="error" title="Unable to load site details" className="mb-4">
          {error || 'Site not found'}
        </Alert>
        <Button variant="secondary" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    )
  }

  const activeMetricConfig = METRICS.find(m => m.key === selectedMetric)!

  // Chart specific Data
  const chartLabels = filteredAnalytics.map(a => {
    const d = new Date(a.recorded_date)
    return d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
  })
  const chartData = filteredAnalytics.map(a => {
    const val = a[selectedMetric]
    return Number(val.toFixed(2))
  })

  // Format values for display
  const formatDisplayValue = (metric: MetricKey, value: number) => {
    if (metric === 'biodiversity_index') return formatNumber(value, 1)
    if (metric === 'vegetation_index') return formatNumber(value, 3)
    return formatNumber(value, 0)
  }

  const hasSufficientData = Object.values(comparisons).some(c => c.previousValue !== null)
  const attentionCount = indicators.filter(i => i.type === 'Attention').length

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header & Disclaimer */}
      <div className="mb-8 flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <Link
            to="/map"
            className="text-earth-500 hover:text-earth-400 text-sm mb-4 inline-flex items-center transition-colors"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to Map
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-slate-100 tracking-tight">{site.name}</h1>
            <Badge variant="warning">Demonstration Data</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-400">
            <p>
              Area: <span className="text-slate-200">{formatArea(site.area_hectares)}</span>
            </p>
            <p>
              Project ID: <span className="text-slate-200">{site.project_id}</span>
            </p>
          </div>
        </div>

        <Card className="min-w-[200px] flex items-center gap-4">
          <CardContent className="p-4 flex w-full items-center gap-4">
            <div className="flex-1">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">
                Performance Score
              </p>
              {rawAnalytics.length > 0 ? (
                <p className="text-3xl font-bold text-slate-100">
                  {performanceScore.score}
                  <span className="ml-1 text-lg text-slate-500">/ 100</span>
                </p>
              ) : (
                <p className="text-3xl font-bold text-slate-100">N/A</p>
              )}
              <p className="text-[10px] text-slate-500 mt-1 max-w-[120px] leading-tight">
                {rawAnalytics.length > 0
                  ? 'Demonstration metric (app-defined weights).'
                  : 'No analytics available'}
              </p>
            </div>
            {rawAnalytics.length > 0 && (
              <Badge
                variant={
                  performanceScore.score >= 85
                    ? 'success'
                    : performanceScore.score >= 70
                      ? 'info'
                      : performanceScore.score >= 40
                        ? 'warning'
                        : 'danger'
                }
              >
                {performanceScore.label}
              </Badge>
            )}
          </CardContent>
        </Card>
      </div>

      {rawAnalytics.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
          <p className="text-slate-400">No environmental analytics are available for this site.</p>
        </div>
      ) : (
        <>
          {/* KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {METRICS.map(m => {
              const comp = comparisons[m.key]
              return (
                <KpiCard
                  key={m.key}
                  title={m.label}
                  value={formatDisplayValue(m.key, comp.currentValue)}
                  unit={m.unit}
                  percentageChange={comp.percentageChange}
                  trend={comp.trend}
                  timeRangeLabel={`${timeRange} months`}
                />
              )
            })}
          </div>

          {/* Environmental Indicators Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-slate-100">Environmental Indicators</h2>
              {attentionCount > 0 && (
                <span className="px-2.5 py-1 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium rounded-full">
                  {attentionCount} indicator{attentionCount > 1 ? 's' : ''} require attention
                </span>
              )}
            </div>

            {!hasSufficientData ? (
              <p className="text-slate-400 text-sm">
                Not enough historical data to calculate indicators.
              </p>
            ) : indicators.length === 0 ? (
              <p className="text-slate-400 text-sm">
                No notable changes detected under the current demonstration rules.
              </p>
            ) : (
              <ul className="space-y-3">
                {indicators.map((ind, idx) => (
                  <li
                    key={idx}
                    className={`p-3 rounded-lg border text-sm flex gap-3 ${
                      ind.type === 'Attention'
                        ? 'bg-red-50 border-red-200 text-red-900'
                        : 'bg-earth-50 border-earth-200 text-earth-900'
                    }`}
                  >
                    <span
                      className={`font-bold mt-0.5 ${ind.type === 'Attention' ? 'text-red-600' : 'text-earth-700'}`}
                    >
                      [{ind.type}]
                    </span>
                    <span>{ind.message}</span>
                  </li>
                ))}
              </ul>
            )}

            <p className="mt-4 text-xs text-slate-500 italic">
              These indicators use application-defined demonstration thresholds to highlight notable
              metric changes. They are not scientific, regulatory, or ecological assessments.
            </p>
          </div>

          {/* Primary Chart Area */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h2 className="text-lg font-semibold text-slate-100">Environmental Trends</h2>
                <p className="text-sm text-slate-400">
                  Synthetic time-series metrics over selected period
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Select
                  value={selectedMetric}
                  onChange={e => setSelectedMetric(e.target.value as MetricKey)}
                  aria-label="Select metric to graph"
                  className="w-auto min-w-[150px]"
                >
                  {METRICS.map(m => (
                    <option key={m.key} value={m.key}>
                      {m.label}
                    </option>
                  ))}
                </Select>

                <Select
                  value={timeRange}
                  onChange={e =>
                    setTimeRange(
                      e.target.value === 'all' ? 'all' : (Number(e.target.value) as TimeRangeMonths)
                    )
                  }
                  aria-label="Select time range"
                  className="w-auto min-w-[150px]"
                >
                  <option value={3}>Last 3 months</option>
                  <option value={6}>Last 6 months</option>
                  <option value={12}>Last 12 months</option>
                  <option value={24}>Last 24 months</option>
                  <option value="all">All available</option>
                </Select>
              </div>
            </div>

            <div className="h-[400px]">
              <TrendChart
                labels={chartLabels}
                data={chartData}
                metricName={activeMetricConfig.label}
                unit={activeMetricConfig.unit}
                color={activeMetricConfig.color}
              />
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 text-sm text-slate-300">
              <strong className="text-slate-200">Analytics Summary: </strong>
              Over the selected period, {activeMetricConfig.label.toLowerCase()}
              {comparisons[selectedMetric].percentageChange !== null ? (
                <>
                  {' '}
                  changed by{' '}
                  <span
                    className={
                      comparisons[selectedMetric].trend === 'improving'
                        ? 'text-emerald-400'
                        : comparisons[selectedMetric].trend === 'declining'
                          ? 'text-red-400'
                          : 'text-slate-400'
                    }
                  >
                    {comparisons[selectedMetric].percentageChange! > 0 ? '+' : ''}
                    {comparisons[selectedMetric].percentageChange!.toFixed(1)}%
                  </span>{' '}
                  vs the previous period.
                </>
              ) : (
                <> data is insufficient for a period comparison.</>
              )}
            </div>
          </div>
        </>
      )}

      {/* Data Source Panel */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">
          Data Provenance
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div>
            <strong className="block text-slate-200 mb-1">Data Classification</strong>
            <span className="text-amber-500 font-medium">Demonstration Data</span>
          </div>
          <div>
            <strong className="block text-slate-200 mb-1">Geographic Boundaries</strong>
            <p className="text-slate-400 leading-relaxed">
              Curated demonstration geometries inspired by Indian conservation regions. Not
              authoritative boundaries.
            </p>
          </div>
          <div>
            <strong className="block text-slate-200 mb-1">Environmental Analytics</strong>
            <p className="text-slate-400 leading-relaxed">
              Synthetic demonstration time series. These values are for product demonstration and do
              not represent measured ecological conditions.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SiteDetailPage
