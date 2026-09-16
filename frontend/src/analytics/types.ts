export type MetricKey =
  'carbon_storage_tons' | 'biodiversity_index' | 'vegetation_index' | 'tree_cover_percentage'

export type TimeRangeMonths = 3 | 6 | 12 | 24 | 'all'

export type TrendDirection = 'improving' | 'declining' | 'stable' | 'unknown'

export interface PeriodComparison {
  currentValue: number
  previousValue: number | null
  absoluteChange: number | null
  percentageChange: number | null
  trend: TrendDirection
}

export interface PerformanceScore {
  score: number
  label: string
}
