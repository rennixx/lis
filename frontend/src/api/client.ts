import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from './endpoints';
import { ApiResponse } from '@/types/api.types';
import { STORAGE_KEYS } from '@/utils/constants';

// Extend InternalAxiosRequestConfig to include metadata
declare module 'axios' {
  interface InternalAxiosRequestConfig {
    metadata?: {
      startTime?: Date;
    };
  }
}

// Create axios instance
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000, // 30 seconds
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor
  client.interceptors.request.use(
    (config) => {
      // Add auth token if available
      const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Add request timestamp for debugging
      config.metadata = { startTime: new Date() };

      return config;
    },
    (error) => {
      console.error('Request interceptor error:', error);
      return Promise.reject(error);
    }
  );

  // Response interceptor
  client.interceptors.response.use(
    (response: AxiosResponse<ApiResponse>) => {
      // Calculate request duration
      const endTime = new Date();
      const startTime = response.config.metadata?.startTime;
      const duration = startTime ? endTime.getTime() - startTime.getTime() : 0;

      // Log response in development
      if (import.meta.env.DEV) {
        console.log(`API Response [${response.config.method?.toUpperCase()} ${response.config.url}]:`, {
          status: response.status,
          duration: `${duration}ms`,
          data: response.data,
        });
      }

      return response;
    },
    async (error: AxiosError<ApiResponse>) => {
      const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

      // Handle 401 Unauthorized - attempt token refresh
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
          console.log('🔄 [TOKEN] Attempting refresh with token:', refreshToken ? 'Present' : 'Missing');

          if (!refreshToken) {
            console.log('❌ [TOKEN] No refresh token available');
            throw new Error('No refresh token available');
          }

          // Attempt to refresh the token
          console.log('🔄 [TOKEN] Sending refresh request to:', `${API_BASE_URL}/auth/refresh`);
          const refreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });

          console.log('✅ [TOKEN] Refresh response:', refreshResponse.data);
          const { accessToken } = refreshResponse.data.data;

          if (!accessToken) {
            console.log('❌ [TOKEN] No access token in refresh response');
            throw new Error('No access token in refresh response');
          }

          localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, accessToken);
          console.log('✅ [TOKEN] New access token stored successfully');

          // Retry the original request with new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }
          console.log('🔄 [TOKEN] Retrying original request:', originalRequest.method?.toUpperCase(), originalRequest.url);
          return client(originalRequest);
        } catch (refreshError) {
          console.log('❌ [TOKEN] Refresh failed:', refreshError);
          // Refresh failed, clear tokens and redirect to login
          localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
          localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
          localStorage.removeItem(STORAGE_KEYS.USER);
          console.log('🧹 [TOKEN] Tokens cleared, redirecting to login');

          // Redirect to login page
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }

      // Handle network errors
      if (!error.response) {
        console.error('Network error:', error.message);
        return Promise.reject(new Error('Network error. Please check your connection.'));
      }

      // Handle API errors
      const apiError = error.response.data;
      const errorMessage = apiError?.message || 'An unexpected error occurred';

      // Log error in development
      if (import.meta.env.DEV) {
        console.error('API Error:', {
          status: error.response.status,
          message: errorMessage,
          data: apiError,
          config: error.config,
        });
      }

      // Return a more user-friendly error
      return Promise.reject(new Error(errorMessage));
    }
  );

  return client;
};

// Create and export the API client
export const apiClient = createApiClient();

// Generic API request function
export const apiRequest = async <T = any>(
  config: AxiosRequestConfig
): Promise<ApiResponse<T>> => {
  try {
    const response = await apiClient.request<ApiResponse<T>>(config);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// HTTP method helpers
export const apiGet = <T = any>(
  url: string,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> => {
  return apiRequest<T>({ ...config, method: 'GET', url });
};

export const apiPost = <T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> => {
  return apiRequest<T>({ ...config, method: 'POST', url, data });
};

export const apiPut = <T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> => {
  return apiRequest<T>({ ...config, method: 'PUT', url, data });
};

export const apiPatch = <T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> => {
  return apiRequest<T>({ ...config, method: 'PATCH', url, data });
};

export const apiDelete = <T = any>(
  url: string,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> => {
  return apiRequest<T>({ ...config, method: 'DELETE', url });
};

// File upload helper
export const uploadFile = async (
  url: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<ApiResponse<any>> => {
  const formData = new FormData();
  formData.append('file', file);

  return apiRequest({
    method: 'POST',
    url,
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(progress);
      }
    },
  });
};

// Download helper
export const downloadFile = async (
  url: string,
  filename?: string
): Promise<void> => {
  try {
    const response = await apiClient.get(url, {
      responseType: 'blob',
    });

    // Create download link
    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error('Download failed:', error);
    throw error;
  }
};

export default apiClient;