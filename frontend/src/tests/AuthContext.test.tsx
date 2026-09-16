import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { MemoryRouter } from 'react-router-dom'

// Mock the API client
vi.mock('@/api/auth', () => ({
  authApi: {
    getMe: vi.fn().mockResolvedValue({ id: '1', name: 'Test User', email: 'test@example.com' }),
    login: vi.fn().mockResolvedValue({ access_token: 'test_token', token_type: 'bearer' }),
  },
}))

const TestComponent = () => {
  const { isAuthenticated, isLoading, user } = useAuth()

  if (isLoading) return <div>Loading...</div>

  return (
    <div>
      <div data-testid="auth-status">{isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</div>
      {user && <div data-testid="user-name">{user.name}</div>}
    </div>
  )
}

describe('AuthContext', () => {
  it('provides authentication state', async () => {
    // Need to mock localStorage for the initial token check
    Storage.prototype.getItem = vi.fn(() => 'fake-token')

    render(
      <MemoryRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </MemoryRouter>
    )

    // Wait for the async effect to complete
    expect(await screen.findByTestId('auth-status')).toHaveTextContent('Authenticated')
    expect(screen.getByTestId('user-name')).toHaveTextContent('Test User')
  })
})
