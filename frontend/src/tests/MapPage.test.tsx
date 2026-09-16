import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import MapPage from '@/pages/MapPage'
import { MemoryRouter } from 'react-router-dom'

// Mock Mapbox GL JS to avoid WebGL errors in JSDOM
vi.mock('mapbox-gl', () => {
  return {
    default: {
      accessToken: '',
      Map: class {
        constructor() {}
        on = vi.fn()
        remove = vi.fn()
        addControl = vi.fn()
        addSource = vi.fn()
        addLayer = vi.fn()
        getSource = vi.fn()
        getCanvas = vi.fn(() => ({ style: {} }))
      },
      Popup: class {
        constructor() {}
        setLngLat = vi.fn().mockReturnThis()
        setHTML = vi.fn().mockReturnThis()
        addTo = vi.fn().mockReturnThis()
      },
      NavigationControl: class {
        constructor() {}
      },
    },
  }
})

// Mock the APIs
vi.mock('@/api/sites', () => ({
  sitesApi: {
    getMapFeatures: vi.fn().mockResolvedValue({ type: 'FeatureCollection', features: [] }),
  },
}))

vi.mock('@/api/projects', () => ({
  projectsApi: {
    list: vi.fn().mockResolvedValue({ items: [], total: 0, limit: 100, offset: 0 }),
  },
}))

describe('MapPage', () => {
  it('renders the map container and both toolbar selectors', async () => {
    render(
      <MemoryRouter>
        <MapPage />
      </MemoryRouter>
    )

    expect(screen.getByText('Sites Map')).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Project' })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Select site' })).toBeInTheDocument()
  })
})
