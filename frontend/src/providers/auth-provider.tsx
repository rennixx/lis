import React, { createContext, useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from '@/hooks/use-toast'
import { STORAGE_KEYS, API_ENDPOINTS } from '@/utils/constants'
import { apiClient } from '@/services/api-client'
import type { User, LoginRequest, RegisterRequest } from '@/types/auth'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (credentials: LoginRequest) => Promise<void>
  register: (userData: RegisterRequest) => Promise<void>
  logout: () => void
  refreshToken: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
      const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)
      const storedUser = localStorage.getItem(STORAGE_KEYS.USER)

      if (token && refreshToken && storedUser) {
        try {
          // Try to use stored user data first for immediate UI
          const parsedUser = JSON.parse(storedUser)
          setUser(parsedUser)

          // Then validate token by fetching current user (this will fail silently and not clear session)
          const response = await apiClient.get(API_ENDPOINTS.AUTH.ME)
          setUser(response.data as User)
        } catch (error) {
          console.warn('Token validation failed, but keeping session:', error)
          // Don't clear the session automatically - let the user continue with stored data
          // Token validation errors will be handled when making actual API calls
        }
      }
      setIsLoading(false)
    }

    initAuth()
  }, [])

  const login = async (credentials: LoginRequest) => {
    try {
      setIsLoading(true)
      console.log('Sending login request:', credentials)
      const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, credentials)
      console.log('Login response:', response.data)
      const { data } = response.data as { data: {
        user: User
        accessToken: string
        refreshToken: string
        expiresIn: string
      }}

      // Store tokens and user data
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, data.accessToken)
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken)
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user))

      setUser(data.user)
      toast({
        title: "Login successful",
        description: `Welcome back, ${data.user.full_name}!`,
      })

      navigate('/dashboard')
    } catch (error: any) {
      console.error('Login error:', error)
      console.error('Error response:', error.response?.data)
      const message = error.response?.data?.detail || 'Login failed'
      toast({
        title: "Login failed",
        description: message,
        variant: "destructive",
      })
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (userData: RegisterRequest) => {
    try {
      setIsLoading(true)
      await apiClient.post(API_ENDPOINTS.AUTH.REGISTER, userData)

      toast({
        title: "Registration successful",
        description: "Please log in with your credentials.",
      })

      navigate('/login')
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Registration failed'
      toast({
        title: "Registration failed",
        description: message,
        variant: "destructive",
      })
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    clearAuth()
    navigate('/login')
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    })
  }

  const refreshToken = async () => {
    await refreshAccessToken()
  }

  const refreshAccessToken = async () => {
    const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)
    if (!refreshToken) {
      throw new Error('No refresh token available')
    }

    try {
      const response = await apiClient.post(API_ENDPOINTS.AUTH.REFRESH, {
        refreshToken: refreshToken
      })
      const { data } = response.data as { data: { accessToken: string } }

      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, data.accessToken)
    } catch (error) {
      clearAuth()
      throw error
    }
  }

  const clearAuth = () => {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
    localStorage.removeItem(STORAGE_KEYS.USER)
    setUser(null)
  }

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    register,
    logout,
    refreshToken,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}