import type { SiteAnalytics } from '@/types'
import type {
  MetricKey,
  TimeRangeMonths,
  PeriodComparison,
  TrendDirection,
  PerformanceScore,
} from './types'

/**
 * Sorts analytics chronologically (oldest to newest)
 */
export function sortAnalyticsChronologically(data: SiteAnalytics[]): SiteAnalytics[] {
  return [...data].sort(
    (a, b) => new Date(a.recorded_date).getTime() - new Date(b.recorded_date).getTime()
  )
}

/**
 * Filters analytics to only include records within the specified time range.
 * Data must be sorted chronologically first.
 */
export function filterByTimeRange(data: SiteAnalytics[], range: TimeRangeMonths): SiteAnalytics[] {
  if (range === 'all' || data.length === 0) return data

  const latestDate = new Date(data[data.length - 1].recorded_date)
  const cutoffDate = new Date(latestDate)
  cutoffDate.setMonth(cutoffDate.getMonth() - range)

  return data.filter(d => new Date(d.recorded_date) >= cutoffDate)
}

export function calculatePercentageChange(current: number, previous: number): number | null {
  if (previous === 0) {
    if (current === 0) return 0
    return null // Cannot calculate percentage change from 0 to non-zero meaningfully without infinity
  }
  return ((current - previous) / Math.abs(previous)) * 100
}

export function getTrendDirection(
  metric: MetricKey,
  percentageChange: number | null
): TrendDirection {
  if (percentageChange === null) return 'unknown'

  // A change of less than 0.5% is considered stable
  if (Math.abs(percentageChange) < 0.5) return 'stable'

  const isPositive = percentageChange > 0

  // For these demonstration metrics, higher is always better
  if (
    metric === 'carbon_storage_tons' ||
    metric === 'biodiversity_index' ||
    metric === 'vegetation_index' ||
    metric === 'tree_cover_percentage'
  ) {
    return isPositive ? 'improving' : 'declining'
  }

  return 'unknown'
}

/**
 * Splits data into current period and previous period of equal length,
 * then compares the averages (or totals depending on metric, here we'll use latest value or average).
 * For simplicity as requested, we compare the LATEST value of the current period
 * against the LATEST value of the previous period.
 */
export function calculatePeriodComparison(
  chronologicalData: SiteAnalytics[],
  metric: MetricKey,
  range: TimeRangeMonths
): PeriodComparison {
  if (chronologicalData.length === 0) {
    return {
      currentValue: 0,
      previousValue: null,
      absoluteChange: null,
      percentageChange: null,
      trend: 'unknown',
    }
  }

  const currentPeriodData = filterByTimeRange(chronologicalData, range)
  const currentValue =
    currentPeriodData.length > 0 ? currentPeriodData[currentPeriodData.length - 1][metric] : 0

  let previousValue: number | null = null

  if (range !== 'all' && chronologicalData.length > 0) {
    const latestDate = new Date(chronologicalData[chronologicalData.length - 1].recorded_date)

    // Calculate cutoff for current period (which is the end of the previous period)
    const currentCutoff = new Date(latestDate)
    currentCutoff.setMonth(currentCutoff.getMonth() - range)

    // Calculate cutoff for previous period
    const previousCutoff = new Date(currentCutoff)
    previousCutoff.setMonth(previousCutoff.getMonth() - range)

    const previousPeriodData = chronologicalData.filter(d => {
      const date = new Date(d.recorded_date)
      return date >= previousCutoff && date < currentCutoff
    })

    if (previousPeriodData.length > 0) {
      previousValue = previousPeriodData[previousPeriodData.length - 1][metric]
    }
  }

  const absoluteChange = previousValue !== null ? currentValue - previousValue : null
  const percentageChange =
    previousValue !== null ? calculatePercentageChange(currentValue, previousValue) : null
  const trend = getTrendDirection(metric, percentageChange)

  return {
    currentValue,
    previousValue,
    absoluteChange,
    percentageChange,
    trend,
  }
}

/**
 * Calculates a composite score (0-100) based on current site analytics.
 * Weights: Carbon (35%), Biodiversity (30%), Vegetation (20%), Tree cover (15%)
 * Normalization assumptions for synthetic data:
 * - Carbon: scales relative to an expected baseline (we'll assume 2000t is a "perfect" score for small sites, capping at 100)
 * - Biodiversity: index 0-1, multiply by 100
 * - Vegetation: index 0-1, multiply by 100
 * - Tree Cover: percentage 0-100
 */
export function calculatePerformanceScore(latestData: SiteAnalytics | null): PerformanceScore {
  if (!latestData) return { score: 0, label: 'Needs Attention' }

  const carbonNorm = Math.min((latestData.carbon_storage_tons / 2000) * 100, 100)
  const bioNorm = Math.min(Math.max(latestData.biodiversity_index * 100, 0), 100)
  const vegNorm = Math.min(Math.max(latestData.vegetation_index * 100, 0), 100)
  const treeNorm = Math.min(Math.max(latestData.tree_cover_percentage, 0), 100)

  const score = Math.round(carbonNorm * 0.35 + bioNorm * 0.3 + vegNorm * 0.2 + treeNorm * 0.15)

  let label = 'Needs Attention'
  if (score >= 40 && score < 70) label = 'Stable'
  else if (score >= 70 && score < 85) label = 'Positive'
  else if (score >= 85) label = 'Strong'

  return { score, label }
}
