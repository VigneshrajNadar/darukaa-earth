import { describe, it, expect } from 'vitest'
import { getAttentionIndicators } from '../analytics/indicators'
import type { PeriodComparison, MetricKey } from '../analytics/types'

describe('Attention Indicators', () => {
  const createBaseComparison = (): Record<MetricKey, PeriodComparison> => ({
    carbon_storage_tons: {
      currentValue: 100,
      previousValue: 100,
      absoluteChange: 0,
      percentageChange: 0,
      trend: 'stable',
    },
    tree_cover_percentage: {
      currentValue: 50,
      previousValue: 50,
      absoluteChange: 0,
      percentageChange: 0,
      trend: 'stable',
    },
    biodiversity_index: {
      currentValue: 80,
      previousValue: 80,
      absoluteChange: 0,
      percentageChange: 0,
      trend: 'stable',
    },
    vegetation_index: {
      currentValue: 0.8,
      previousValue: 0.8,
      absoluteChange: 0,
      percentageChange: 0,
      trend: 'stable',
    },
  })

  it('returns no indicators when changes are below thresholds', () => {
    const comp = createBaseComparison()
    const indicators = getAttentionIndicators(comp)
    expect(indicators.length).toBe(0)
  })

  it('returns attention indicator for negative tree cover change crossing threshold', () => {
    const comp = createBaseComparison()
    comp.tree_cover_percentage.absoluteChange = -3.5
    comp.tree_cover_percentage.percentageChange = -7
    const indicators = getAttentionIndicators(comp)
    expect(indicators.length).toBe(1)
    expect(indicators[0].type).toBe('Attention')
    expect(indicators[0].message).toBe(
      'Tree cover decreased by 3.5 percentage points vs the previous period.'
    )
  })

  it('returns informational indicator for positive tree cover change crossing threshold', () => {
    const comp = createBaseComparison()
    comp.tree_cover_percentage.absoluteChange = 3.5
    comp.tree_cover_percentage.percentageChange = 7
    const indicators = getAttentionIndicators(comp)
    expect(indicators.length).toBe(1)
    expect(indicators[0].type).toBe('Informational')
    expect(indicators[0].message).toBe(
      'Tree cover increased by 3.5 percentage points vs the previous period.'
    )
  })

  it('returns indicators for biodiversity and vegetation changes', () => {
    const comp = createBaseComparison()
    comp.biodiversity_index.absoluteChange = 6
    comp.vegetation_index.absoluteChange = -0.06

    const indicators = getAttentionIndicators(comp)
    expect(indicators.length).toBe(2)

    const bio = indicators.find(i => i.message.includes('Biodiversity'))
    expect(bio?.type).toBe('Informational')
    expect(bio?.message).toBe('Biodiversity metric increased by 6.0 points vs the previous period.')

    const veg = indicators.find(i => i.message.includes('Vegetation'))
    expect(veg?.type).toBe('Attention')
    expect(veg?.message).toBe('Vegetation index decreased by 0.06 vs the previous period.')
  })

  it('carbon uses percentage change for threshold', () => {
    const comp = createBaseComparison()
    comp.carbon_storage_tons.absoluteChange = 100 // large absolute change
    comp.carbon_storage_tons.percentageChange = 4 // but < 5% percentage change

    let indicators = getAttentionIndicators(comp)
    expect(indicators.length).toBe(0)

    comp.carbon_storage_tons.percentageChange = -5.1
    comp.carbon_storage_tons.absoluteChange = -100

    indicators = getAttentionIndicators(comp)
    expect(indicators.length).toBe(1)
    expect(indicators[0].type).toBe('Attention')
    expect(indicators[0].message).toBe('Carbon storage decreased by 5.1% vs the previous period.')
  })

  it('ignores missing historical data', () => {
    const comp = createBaseComparison()
    comp.tree_cover_percentage.absoluteChange = null
    comp.tree_cover_percentage.percentageChange = null
    const indicators = getAttentionIndicators(comp)
    expect(indicators.length).toBe(0)
  })
})
