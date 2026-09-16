import type { MetricKey, PeriodComparison } from './types'

export type IndicatorType = 'Attention' | 'Informational'

export interface Indicator {
  type: IndicatorType
  message: string
}

// Application-defined demonstration thresholds
export const THRESHOLDS = {
  tree_cover_percentage: 3, // absolute percentage points
  biodiversity_index: 5, // absolute points
  vegetation_index: 0.05, // absolute index value
  carbon_storage_tons: 5, // percentage change
}

function formatChangeText(
  metricName: string,
  absoluteChange: number,
  percentageChange: number | null,
  metric: MetricKey
): string {
  const isIncrease = absoluteChange > 0
  const direction = isIncrease ? 'increased' : 'decreased'

  if (metric === 'carbon_storage_tons') {
    // Carbon threshold is based on percentage change, so we describe percentage change
    const val = percentageChange !== null ? Math.abs(percentageChange).toFixed(1) : '0'
    return `${metricName} ${direction} by ${val}% vs the previous period.`
  }

  if (metric === 'tree_cover_percentage') {
    return `${metricName} ${direction} by ${Math.abs(absoluteChange).toFixed(1)} percentage points vs the previous period.`
  }

  if (metric === 'biodiversity_index') {
    return `${metricName} ${direction} by ${Math.abs(absoluteChange).toFixed(1)} points vs the previous period.`
  }

  // vegetation_index
  return `${metricName} ${direction} by ${Math.abs(absoluteChange).toFixed(2)} vs the previous period.`
}

export function getAttentionIndicators(
  comparisons: Record<MetricKey, PeriodComparison>
): Indicator[] {
  const indicators: Indicator[] = []

  // Tree Cover
  const treeComp = comparisons['tree_cover_percentage']
  if (treeComp.absoluteChange !== null) {
    if (Math.abs(treeComp.absoluteChange) >= THRESHOLDS.tree_cover_percentage) {
      indicators.push({
        type: treeComp.absoluteChange < 0 ? 'Attention' : 'Informational',
        message: formatChangeText(
          'Tree cover',
          treeComp.absoluteChange,
          treeComp.percentageChange,
          'tree_cover_percentage'
        ),
      })
    }
  }

  // Biodiversity
  const bioComp = comparisons['biodiversity_index']
  if (bioComp.absoluteChange !== null) {
    if (Math.abs(bioComp.absoluteChange) >= THRESHOLDS.biodiversity_index) {
      indicators.push({
        type: bioComp.absoluteChange < 0 ? 'Attention' : 'Informational',
        message: formatChangeText(
          'Biodiversity metric',
          bioComp.absoluteChange,
          bioComp.percentageChange,
          'biodiversity_index'
        ),
      })
    }
  }

  // Vegetation
  const vegComp = comparisons['vegetation_index']
  if (vegComp.absoluteChange !== null) {
    if (Math.abs(vegComp.absoluteChange) >= THRESHOLDS.vegetation_index) {
      indicators.push({
        type: vegComp.absoluteChange < 0 ? 'Attention' : 'Informational',
        message: formatChangeText(
          'Vegetation index',
          vegComp.absoluteChange,
          vegComp.percentageChange,
          'vegetation_index'
        ),
      })
    }
  }

  // Carbon
  const carbComp = comparisons['carbon_storage_tons']
  if (carbComp.absoluteChange !== null && carbComp.percentageChange !== null) {
    if (Math.abs(carbComp.percentageChange) >= THRESHOLDS.carbon_storage_tons) {
      indicators.push({
        type: carbComp.absoluteChange < 0 ? 'Attention' : 'Informational',
        message: formatChangeText(
          'Carbon storage',
          carbComp.absoluteChange,
          carbComp.percentageChange,
          'carbon_storage_tons'
        ),
      })
    }
  }

  return indicators
}
