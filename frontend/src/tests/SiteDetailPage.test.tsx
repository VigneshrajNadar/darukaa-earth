import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import SiteDetailPage from '@/pages/SiteDetailPage'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { sitesApi } from '@/api/sites'
import { analyticsApi } from '@/api/analytics'

// Mock APIs
vi.mock('@/api/sites', () => ({
  sitesApi: {
    get: vi.fn(),
  },
}))

vi.mock('@/api/analytics', () => ({
  analyticsApi: {
    getForSite: vi.fn(),
  },
}))

// Mock Chart to avoid canvas errors in jsdom
vi.mock('react-chartjs-2', () => ({
  Line: () => <div data-testid="mock-chart">Mock Chart</div>,
}))

describe('SiteDetailPage', () => {
  const mockSitesGet = vi.mocked(sitesApi.get)
  const mockAnalyticsGet = vi.mocked(analyticsApi.getForSite)

  it('renders loading state initially', () => {
    mockSitesGet.mockImplementation(() => new Promise(() => {}))
    mockAnalyticsGet.mockImplementation(() => new Promise(() => {}))

    render(
      <MemoryRouter initialEntries={['/sites/123']}>
        <Routes>
          <Route path="/sites/:siteId" element={<SiteDetailPage />} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument()
  })

  it('renders error state on API failure', async () => {
    mockSitesGet.mockRejectedValue(new Error('API Error'))
    mockAnalyticsGet.mockRejectedValue(new Error('API Error'))

    render(
      <MemoryRouter initialEntries={['/sites/123']}>
        <Routes>
          <Route path="/sites/:siteId" element={<SiteDetailPage />} />
        </Routes>
      </MemoryRouter>
    )

    expect(await screen.findByText(/Unable to load environmental analytics/i)).toBeInTheDocument()
    expect(screen.getByText(/Retry/i)).toBeInTheDocument()
  })

  it('renders site data and empty state when no analytics', async () => {
    mockSitesGet.mockResolvedValue({
      id: '123',
      name: 'Test Site',
      project_id: 'p1',
      area_hectares: 15.5,
    } as any)
    mockAnalyticsGet.mockResolvedValue([])

    render(
      <MemoryRouter initialEntries={['/sites/123']}>
        <Routes>
          <Route path="/sites/:siteId" element={<SiteDetailPage />} />
        </Routes>
      </MemoryRouter>
    )

    expect(await screen.findByText('Test Site')).toBeInTheDocument()
    expect(screen.getAllByText('Demonstration Data').length).toBeGreaterThan(0)
    expect(screen.getByText(/No environmental analytics are available/i)).toBeInTheDocument()
  })

  it('renders biodiversity as a neutral demonstration index while retaining the performance score scale', async () => {
    mockSitesGet.mockResolvedValue({
      id: '123',
      name: 'Test Site',
      project_id: 'p1',
      area_hectares: 15.5,
    } as any)
    mockAnalyticsGet.mockResolvedValue([
      {
        id: 'a1',
        site_id: '123',
        recorded_date: '2025-01-01',
        carbon_storage_tons: 40,
        tree_cover_percentage: 50,
        biodiversity_index: 70,
        vegetation_index: 0.6,
        created_at: '2025-01-01',
      },
      {
        id: 'a2',
        site_id: '123',
        recorded_date: '2025-02-01',
        carbon_storage_tons: 56,
        tree_cover_percentage: 54,
        biodiversity_index: 76.5,
        vegetation_index: 0.658,
        created_at: '2025-02-01',
      },
    ] as any)

    render(
      <MemoryRouter initialEntries={['/sites/123']}>
        <Routes>
          <Route path="/sites/:siteId" element={<SiteDetailPage />} />
        </Routes>
      </MemoryRouter>
    )

    expect(await screen.findByText('76.5')).toBeInTheDocument()
    expect(screen.getByText('index points')).toBeInTheDocument()
    expect(screen.queryByText('/ 100')).not.toBeInTheDocument()
    expect(screen.getByText('/100')).toBeInTheDocument()
  })
})
