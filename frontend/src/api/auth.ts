import { apiClient } from './client'
import type { User } from '@/types'

export const authApi = {
  login: async (
    username: string,
    password: string
  ): Promise<{ access_token: string; token_type: string }> => {
    // OAuth2PasswordRequestForm expects x-www-form-urlencoded
    const formData = new URLSearchParams()
    formData.append('username', username)
    formData.append('password', password)

    const response = await apiClient.post('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    return response.data
  },

  getMe: async (): Promise<User> => {
    const response = await apiClient.get<User>('/auth/me')
    return response.data
  },

  register: async (email: string, password: string, name: string): Promise<User> => {
    const response = await apiClient.post<User>('/auth/register', { email, password, name })
    return response.data
  },
}
