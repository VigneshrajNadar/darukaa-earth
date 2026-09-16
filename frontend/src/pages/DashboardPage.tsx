import { useEffect, useState } from 'react'
import { ArrowUpRight, Cloud, FolderKanban, Map as MapIcon, Maximize, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { dashboardApi } from '@/api/dashboard'
import type { DashboardSummary } from '@/types'
import { Card, CardContent } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { formatArea, formatCarbon, formatNumber } from '@/utils/formatters'

const metrics = [
  {
    key: 'projects',
    label: 'Active projects',
    icon: FolderKanban,
    format: (data: DashboardSummary | null) => formatNumber(data?.total_projects, 0),
  },
  {
    key: 'sites',
    label: 'Monitored sites',
    icon: MapIcon,
    format: (data: DashboardSummary | null) => formatNumber(data?.total_sites, 0),
  },
  {
    key: 'area',
    label: 'Total area',
    icon: Maximize,
    format: (data: DashboardSummary | null) => formatArea(data?.total_area_hectares),
  },
  {
    key: 'carbon',
    label: 'Latest carbon',
    icon: Cloud,
    format: (data: DashboardSummary | null) => formatCarbon(data?.latest_carbon_tonnes),
  },
]

function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    dashboardApi
      .getSummary()
      .then(setSummary)
      .catch(requestError =>
        setError(requestError?.response?.data?.detail || 'Failed to load dashboard summary')
      )
      .finally(() => setIsLoading(false))
  }, [])

  if (error)
    return (
      <div className="mx-auto max-w-7xl p-6 lg:p-8">
        <Alert variant="error" title="Unable to load dashboard">
          {error}
        </Alert>
      </div>
    )

  return (
    <div className="mx-auto max-w-7xl p-5 pb-12 lg:p-8">
      <section className="reveal-up relative isolate overflow-hidden rounded-[2rem] bg-[#193c25] px-6 py-10 text-white shadow-[0_24px_65px_rgba(19,58,34,0.22)] md:px-10 md:py-14">
        <div className="ambient-orb absolute -right-20 -top-24 h-80 w-80 rounded-full bg-[#9cc88a]/25 blur-3xl" />
        <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.1)_1px,transparent_1px)] [background-size:44px_44px]" />
        <div className="relative max-w-2xl">
          <p className="brand-eyebrow text-[#a9d497]">Built for informed decisions</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.055em] md:text-6xl">
            Nature intelligence,
            <br />
            made actionable.
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-6 text-[#d4e4d5] md:text-base">
            Bring projects, sites, and demonstration environmental context into one operational
            view.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/map">
              <Button className="bg-[#79b85e] hover:bg-[#8acb70]">
                Explore site map <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/projects">
              <Button
                variant="secondary"
                className="border-white/35 bg-white/10 text-white hover:bg-white/20"
              >
                View projects
              </Button>
            </Link>
          </div>
        </div>
      </section>
      <section
        className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        aria-label="Portfolio summary"
      >
        {metrics.map(({ key, label, icon: Icon, format }, index) => (
          <Card
            key={key}
            className={`reveal-up ${index > 1 ? 'reveal-delay-2' : 'reveal-delay-1'}`}
          >
            <CardContent className="p-5">
              <div className="mb-7 flex items-center justify-between">
                <span className="text-sm font-semibold text-[#627066]">{label}</span>
                <span className="grid h-9 w-9 place-items-center rounded-full bg-earth-50 text-earth-700">
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              {isLoading ? (
                <Skeleton className="h-9 w-20" />
              ) : (
                <p className="text-3xl font-semibold tracking-[-0.05em] text-[#193c25]">
                  {format(summary)}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </section>
      {!isLoading && summary && (
        <section className="reveal-up reveal-delay-2 mt-7 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <Card>
            <CardContent className="p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="brand-eyebrow">Portfolio intelligence</p>
                  <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[#193c25]">
                    Explore your geography
                  </h2>
                  <p className="mt-3 max-w-lg text-sm leading-6 text-[#637267]">
                    Inspect site boundaries, filter by project, and move directly into the
                    associated demonstration analytics.
                  </p>
                </div>
                <Sparkles className="h-5 w-5 text-earth-600" />
              </div>
              <Link
                to="/map"
                className="mt-7 inline-flex items-center text-sm font-semibold text-earth-700 hover:text-earth-900"
              >
                Open interactive map <ArrowUpRight className="ml-1.5 h-4 w-4" />
              </Link>
            </CardContent>
          </Card>
          <Card className="bg-[#eaf1e3]">
            <CardContent className="p-7">
              <p className="brand-eyebrow">Data note</p>
              <p className="mt-4 text-lg font-semibold tracking-[-0.03em] text-[#193c25]">
                Demonstration environment
              </p>
              <p className="mt-2 text-sm leading-6 text-[#55695a]">
                Site geometries are curated demonstration areas and the time series is synthetic.
                Use it to evaluate the product workflow, not as a scientific assessment.
              </p>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  )
}

export default DashboardPage
