export function formatNumber(val: number | null | undefined, decimals = 1): string {
  if (val == null || isNaN(val)) return 'N/A'
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(val)
}

export function formatArea(hectares: number | null | undefined): string {
  if (hectares == null || isNaN(hectares)) return 'N/A'
  return `${formatNumber(hectares, 1)} ha`
}

export function formatCarbon(tonnes: number | null | undefined): string {
  if (tonnes == null || isNaN(tonnes)) return 'N/A'
  return `${formatNumber(tonnes, 1)} t`
}

export function formatPercentage(val: number | null | undefined, decimals = 1): string {
  if (val == null || isNaN(val)) return 'N/A'
  return `${formatNumber(val, decimals)}%`
}

export function formatScore(score: number | null | undefined): string {
  if (score == null || isNaN(score)) return 'N/A'
  return `${Math.round(score)} / 100`
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'N/A'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return 'N/A'
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d)
}
