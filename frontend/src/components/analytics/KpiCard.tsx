import type { TrendDirection } from '@/analytics/types'
import { Card, CardContent } from '@/components/ui/Card'
import { formatPercentage } from '@/utils/formatters'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface KpiCardProps {
  title: string
  value: string | number
  unit?: string
  percentageChange: number | null
  trend: TrendDirection
  timeRangeLabel: string
}

export function KpiCard({ title, value, unit, percentageChange, trend }: KpiCardProps) {
  const getTrendColor = () => {
    switch (trend) {
      case 'improving':
        return 'text-emerald-400'
      case 'declining':
        return 'text-red-400'
      case 'stable':
        return 'text-slate-400'
      default:
        return 'text-slate-500'
    }
  }

  const TrendIcon =
    trend === 'improving' ? TrendingUp : trend === 'declining' ? TrendingDown : Minus

  return (
    <Card className="flex flex-col justify-between transition-all hover:border-slate-700">
      <CardContent className="p-5">
        <h3 className="text-sm font-medium text-slate-400 mb-2">{title}</h3>
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-bold text-slate-100">{value}</span>
          {unit && <span className="text-sm font-medium text-slate-500">{unit}</span>}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-slate-800/50 pt-3">
          {percentageChange !== null ? (
            <div className={`flex items-center text-sm font-medium ${getTrendColor()}`}>
              <TrendIcon className="mr-1.5 h-4 w-4 shrink-0" />
              <span>{formatPercentage(Math.abs(percentageChange))}</span>
              <span className="text-slate-500 font-normal ml-2">vs previous</span>
            </div>
          ) : (
            <div className="text-sm text-slate-500 flex items-center">
              <Minus className="mr-1.5 h-4 w-4 shrink-0" />
              N/A vs previous
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
