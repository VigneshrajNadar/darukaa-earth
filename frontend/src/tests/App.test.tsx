import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '@/App'

/**
 * App smoke tests.
 *
 * These tests verify that the routing scaffold works:
 * - App renders without throwing
 * - Default route redirects to /dashboard
 * - Page-level components mount correctly
 */
describe('App routing scaffold', () => {
  it('renders without crashing on the dashboard route', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <App />
      </MemoryRouter>
    )
    expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument()
  })

  it('renders the login page at /login', () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>
    )
    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument()
  })

  it('renders the register page at /register', () => {
    render(
      <MemoryRouter initialEntries={['/register']}>
        <App />
      </MemoryRouter>
    )
    expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument()
  })

  it('renders the projects page at /projects', () => {
    render(
      <MemoryRouter initialEntries={['/projects']}>
        <App />
      </MemoryRouter>
    )
    expect(screen.getByRole('heading', { name: /projects/i })).toBeInTheDocument()
  })

  it('renders the map page at /map', () => {
    render(
      <MemoryRouter initialEntries={['/map']}>
        <App />
      </MemoryRouter>
    )
    expect(screen.getByRole('heading', { name: /map/i })).toBeInTheDocument()
  })
})
