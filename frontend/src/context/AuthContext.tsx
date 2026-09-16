/* eslint-disable react-refresh/only-export-components */
// Context and hook files intentionally export non-component values.
import { createContext, useContext } from 'react'
import type { User } from '@/types'

/**
 * AuthContext — architectural scaffold.
 *
 * This file defines the shape of the authentication context.
 * Authentication is NOT implemented yet.
 *
 * Full implementation will happen in the dedicated auth stage:
 *  - JWT storage strategy
 *  - Login / logout actions
 *  - Token refresh logic
 *  - Protected route enforcement
 */

interface AuthContextValue {
  /** Currently authenticated user, or null if unauthenticated. */
  user: User | null
  /** True while an auth operation is in progress. */
  isLoading: boolean
  /** True if a user is authenticated. */
  isAuthenticated: boolean
  // Placeholders — will be implemented in auth stage:
  login: (_email: string, _password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

/**
 * useAuth — hook to consume the AuthContext.
 * Throws if used outside of an AuthProvider.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export { AuthContext }
export type { AuthContextValue }
