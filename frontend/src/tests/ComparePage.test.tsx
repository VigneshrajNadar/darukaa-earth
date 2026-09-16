import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ComparePage from '@/pages/ComparePage'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { sitesApi } from '@/api/sites'
import { analyticsApi } from '@/api/analytics'

// Mock APIs
vi.mock('@/api/sites', () => ({
  sitesApi: { get: vi.fn() },
}))

vi.mock('@/api/analytics', () => ({
  analyticsApi: { getForSite: vi.fn() },
}))

// Mock Chart
vi.mock('react-chartjs-2', () => ({
  Line: () => <div data-testid="mock-chart">Mock Chart</div>,
}))

describe('ComparePage', () => {
  const mockSitesGet = vi.mocked(sitesApi.get)
  const mockAnalyticsGet = vi.mocked(analyticsApi.getForSite)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders empty state when no sites are selected', () => {
    render(
      <MemoryRouter initialEntries={['/compare']}>
        <Routes>
          <Route path="/compare" element={<ComparePage />} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('Compare Sites')).toBeInTheDocument()
    expect(screen.getByText(/Select up to 3 sites/)).toBeInTheDocument()
  })

  it('renders loading state initially with sites in url', () => {
    mockSitesGet.mockImplementation(() => new Promise(() => {}))

    render(
      <MemoryRouter initialEntries={['/compare?sites=s1,s2']}>
        <Routes>
          <Route path="/compare" element={<ComparePage />} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument()
  })

  it('renders error state if API fails', async () => {
    mockSitesGet.mockRejectedValue(new Error('API Error'))

    render(
      <MemoryRouter initialEntries={['/compare?sites=s1']}>
        <Routes>
          <Route path="/compare" element={<ComparePage />} />
        </Routes>
      </MemoryRouter>
    )

    expect(await screen.findByText('Unable to load comparison data.')).toBeInTheDocument()
  })

  it('loads valid sites, filters missing analytics, and renders comparison table', async () => {
    // 2 valid sites
    mockSitesGet.mockImplementation(async id => {
      if (id === 's1') return { id: 's1', name: 'Site One' } as any
      if (id === 's2') return { id: 's2', name: 'Site Two' } as any
      throw new Error('Not found')
    })

    mockAnalyticsGet.mockImplementation(async id => {
      if (id === 's1') {
        return [
          { recorded_date: '2023-01-01', tree_cover_percentage: 50 },
          { recorded_date: '2024-01-01', tree_cover_percentage: 55 },
        ] as any
      }
      return [] // Site Two has no analytics
    })

    render(
      <MemoryRouter initialEntries={['/compare?sites=s1,s2,s3']}>
        <Routes>
          <Route path="/compare" element={<ComparePage />} />
        </Routes>
      </MemoryRouter>
    )

    // Check titles
    expect((await screen.findAllByText('Site One')).length).toBeGreaterThan(0)
    expect((await screen.findAllByText('Site Two')).length).toBeGreaterThan(0)

    // Ensure chart is mocked
    expect(screen.getByTestId('mock-chart')).toBeInTheDocument()

    // Ensure table headers
    expect(screen.getAllByText('Site One').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Site Two').length).toBeGreaterThan(0)
  })

  it('removes site successfully when clicking remove', async () => {
    mockSitesGet.mockResolvedValue({ id: 's1', name: 'Site 1' } as any)
    mockAnalyticsGet.mockResolvedValue([])

    render(
      <MemoryRouter initialEntries={['/compare?sites=s1']}>
        <Routes>
          <Route path="/compare" element={<ComparePage />} />
        </Routes>
      </MemoryRouter>
    )

    const siteLabels = await screen.findAllByText('Site 1')
    expect(siteLabels.length).toBeGreaterThan(0)

    const removeBtn = screen.getByRole('button', { name: 'Remove Site 1' })
    fireEvent.click(removeBtn)

    // Should render empty state
    expect(await screen.findByText(/Select up to 3 sites/)).toBeInTheDocument()
  })
})
