import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios'
import { API_BASE_URL, API_VERSION, STORAGE_KEYS, ERROR_MESSAGES } from '@/utils/constants'

class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: `${API_BASE_URL}/api/${API_VERSION}`,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true

          try {
            const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)
            if (refreshToken) {
              const response = await axios.post(
                `${API_BASE_URL}/api/${API_VERSION}/auth/refresh`,
                { refresh_token: refreshToken }
              )

              const { access_token } = response.data
              localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, access_token)

              // Retry the original request with new token
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${access_token}`
              }
              return this.client(originalRequest)
            }
          } catch (refreshError) {
            // Refresh failed, clear tokens and redirect to login
            localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
            localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
            localStorage.removeItem(STORAGE_KEYS.USER)
            window.location.href = '/login'
            return Promise.reject(refreshError)
          }
        }

        // Handle other errors
        let errorMessage = ERROR_MESSAGES.SERVER_ERROR

        if (error.response?.data && (error.response.data as any)?.detail) {
          errorMessage = (error.response.data as any).detail
        } else if (error.response?.status === 404) {
          errorMessage = ERROR_MESSAGES.NOT_FOUND as any
        } else if (error.response?.status === 403) {
          errorMessage = ERROR_MESSAGES.FORBIDDEN as any
        } else if (error.response?.status === 422) {
          errorMessage = ERROR_MESSAGES.VALIDATION_ERROR as any
        } else if (error.code === 'NETWORK_ERROR') {
          errorMessage = ERROR_MESSAGES.NETWORK_ERROR as any
        }

        return Promise.reject({
          ...error,
          message: errorMessage,
        })
      }
    )
  }

  // HTTP Methods
  async get<T>(url: string, params?: any): Promise<{ data: T }> {
    return this.client.get(url, { params })
  }

  async post<T>(url: string, data?: any): Promise<{ data: T }> {
    return this.client.post(url, data)
  }

  async put<T>(url: string, data?: any): Promise<{ data: T }> {
    return this.client.put(url, data)
  }

  async patch<T>(url: string, data?: any): Promise<{ data: T }> {
    return this.client.patch(url, data)
  }

  async delete<T>(url: string): Promise<{ data: T }> {
    return this.client.delete(url)
  }

  // Direct access to axios instance for advanced usage
  get axiosInstance(): AxiosInstance {
    return this.client
  }
}

export const apiClient = new ApiClient()