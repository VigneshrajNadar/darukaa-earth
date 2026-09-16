import { describe, it, expect } from 'vitest'
import {
  calculatePercentageChange,
  getTrendDirection,
  calculatePerformanceScore,
  sortAnalyticsChronologically,
  filterByTimeRange,
  calculatePeriodComparison,
} from '@/analytics/calculations'
import type { SiteAnalytics } from '@/types'

describe('Analytics Calculations', () => {
  describe('calculatePercentageChange', () => {
    it('calculates correctly for normal numbers', () => {
      expect(calculatePercentageChange(150, 100)).toBe(50)
      expect(calculatePercentageChange(50, 100)).toBe(-50)
    })

    it('handles zero gracefully', () => {
      expect(calculatePercentageChange(100, 0)).toBeNull()
      expect(calculatePercentageChange(0, 0)).toBe(0)
    })
  })

  describe('getTrendDirection', () => {
    it('classifies small changes as stable', () => {
      expect(getTrendDirection('carbon_storage_tons', 0.4)).toBe('stable')
      expect(getTrendDirection('carbon_storage_tons', -0.4)).toBe('stable')
    })

    it('classifies positive changes as improving', () => {
      expect(getTrendDirection('carbon_storage_tons', 5)).toBe('improving')
    })

    it('classifies negative changes as declining', () => {
      expect(getTrendDirection('carbon_storage_tons', -5)).toBe('declining')
    })

    it('handles null', () => {
      expect(getTrendDirection('carbon_storage_tons', null)).toBe('unknown')
    })
  })

  describe('calculatePerformanceScore', () => {
    it('calculates weighted score correctly', () => {
      const mockData: SiteAnalytics = {
        id: '1',
        site_id: 's1',
        recorded_date: '2025-01-01',
        carbon_storage_tons: 1000, // 50 norm (50 * .35 = 17.5)
        biodiversity_index: 0.8, // 80 norm (80 * .3 = 24)
        vegetation_index: 0.6, // 60 norm (60 * .2 = 12)
        tree_cover_percentage: 50, // 50 norm (50 * .15 = 7.5)
        created_at: '2025-01-01',
      }

      const result = calculatePerformanceScore(mockData)
      expect(result.score).toBe(61) // 17.5 + 24 + 12 + 7.5 = 61
      expect(result.label).toBe('Stable')
    })

    it('caps norms at 100', () => {
      const mockData: SiteAnalytics = {
        id: '1',
        site_id: 's1',
        recorded_date: '2025-01-01',
        carbon_storage_tons: 5000, // >2000 -> 100
        biodiversity_index: 1.5, // >1 -> 100
        vegetation_index: 1.2, // >1 -> 100
        tree_cover_percentage: 120, // >100 -> 100
        created_at: '2025-01-01',
      }
      const result = calculatePerformanceScore(mockData)
      expect(result.score).toBe(100)
      expect(result.label).toBe('Strong')
    })
  })

  describe('time series functions', () => {
    const dates = ['2024-01-01T00:00:00Z', '2024-06-01T00:00:00Z', '2024-12-01T00:00:00Z']
    const data = dates.map((d, i) => ({
      id: `${i}`,
      site_id: 's1',
      recorded_date: d,
      carbon_storage_tons: i * 100 + 100, // 100, 200, 300
      biodiversity_index: 0,
      vegetation_index: 0,
      tree_cover_percentage: 0,
      created_at: d,
    }))

    it('sorts chronologically', () => {
      const unsorted = [data[2], data[0], data[1]]
      const sorted = sortAnalyticsChronologically(unsorted)
      expect(sorted[0].id).toBe('0')
      expect(sorted[2].id).toBe('2')
    })

    it('filters by time range', () => {
      // Latest is Dec 2024. 6 months back is June 2024.
      const filtered = filterByTimeRange(data, 6)
      expect(filtered.length).toBe(2) // June and Dec
      expect(filtered[0].id).toBe('1')
    })

    it('calculates period comparison', () => {
      // Current 6 months (June-Dec). Latest is Dec (300).
      // Previous 6 months (Dec 2023 - June 2024). Latest is June (200) since June 1 is < cutoff if we were strict?
      // Wait, filter logic: current is >= cutoff. So previous is >= previousCutoff && < currentCutoff.
      // currentCutoff = June 1. previousCutoff = Dec 1 2023.
      // So previous period includes Jan 1 2024 (100).

      const comp = calculatePeriodComparison(data, 'carbon_storage_tons', 6)
      expect(comp.currentValue).toBe(300)
      expect(comp.previousValue).toBe(100)
      expect(comp.absoluteChange).toBe(200)
      expect(comp.percentageChange).toBe(200) // (300-100)/100 * 100
      expect(comp.trend).toBe('improving')
    })
  })
})
