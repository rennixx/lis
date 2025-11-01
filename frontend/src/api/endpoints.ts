// API endpoint constants
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export const ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
    CHANGE_PASSWORD: '/auth/change-password',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    USERS: '/auth/users',
  },

  // Patient endpoints
  PATIENTS: {
    LIST: '/patients',
    CREATE: '/patients',
    GET: (id: string) => `/patients/${id}`,
    UPDATE: (id: string) => `/patients/${id}`,
    DELETE: (id: string) => `/patients/${id}`,
    SEARCH: '/patients/search',
    HISTORY: (id: string) => `/patients/${id}/history`,
  },

  // Test endpoints
  TESTS: {
    LIST: '/tests',
    CREATE: '/tests',
    GET: (id: string) => `/tests/${id}`,
    UPDATE: (id: string) => `/tests/${id}`,
    DELETE: (id: string) => `/tests/${id}`,
    AVAILABLE: '/tests/available',
    POPULAR_PANELS: '/tests/panels/popular',
    CATEGORY: (category: string) => `/tests/category/${category}`,
    SEARCH: '/tests/search',
    DETAIL: (id: string) => `/tests/${id}`,
  },

  // Order endpoints
  ORDERS: {
    LIST: '/orders',
    CREATE: '/orders',
    GET: (id: string) => `/orders/${id}`,
    UPDATE: (id: string) => `/orders/${id}`,
    DELETE: (id: string) => `/orders/${id}`,
    UPDATE_STATUS: (id: string) => `/orders/${id}/status`,
    ADD_TEST: (id: string) => `/orders/${id}/tests`,
    REMOVE_TEST: (id: string, testId: string) => `/orders/${id}/tests/${testId}`,
    STATISTICS: '/orders/statistics',
    RECENT: '/orders/recent',
    DETAIL: (id: string) => `/orders/${id}`,
    CANCEL: (id: string) => `/orders/${id}/cancel`,
    COLLECT_SAMPLE: (id: string) => `/orders/${id}/collect-sample`,
    COMPLETE: (id: string) => `/orders/${id}/complete`,
    UPDATE_PAYMENT: (id: string) => `/orders/${id}/payment`,
    SEARCH: '/orders/search',
  },

  // Result endpoints
  RESULTS: {
    LIST: '/results',
    CREATE: '/results',
    GET: (id: string) => `/results/${id}`,
    UPDATE: (id: string) => `/results/${id}`,
    DELETE: (id: string) => `/results/${id}`,
    VERIFY: (id: string) => `/results/${id}/verify`,
    APPROVE: (id: string) => `/results/${id}/approve`,
    SEARCH: '/results/search',
    ABNORMAL: '/results/abnormal',
  },

  // Report endpoints
  REPORTS: {
    LIST: '/reports',
    CREATE: '/reports',
    GET: (id: string) => `/reports/${id}`,
    UPDATE: (id: string) => `/reports/${id}`,
    DELETE: (id: string) => `/reports/${id}`,
    GENERATE: (id: string) => `/reports/${id}/generate`,
    PREVIEW: (id: string) => `/reports/${id}/preview`,
    PRINT: (id: string) => `/reports/${id}/print`,
    BULK_PRINT: '/reports/bulk-print',
    QUEUE: '/reports/queue',
  },

  // Dashboard endpoints
  DASHBOARD: {
    STATS: '/dashboard/stats',
    REVENUE: '/dashboard/revenue',
    ANALYTICS: '/dashboard/analytics',
    PENDING_TESTS: '/dashboard/pending-tests',
  },

  // Health check
  HEALTH: '/health',
} as const;

// Query parameter builders
export const buildQueryParams = (params: Record<string, any>): string => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach(v => searchParams.append(key, String(v)));
      } else {
        searchParams.append(key, String(value));
      }
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
};

// Common query params for pagination
export const getPaginationParams = (params: {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}): Record<string, string> => {
  const queryParams: Record<string, string> = {};

  if (params.page) queryParams.page = String(params.page);
  if (params.limit) queryParams.limit = String(params.limit);
  if (params.sort) queryParams.sort = params.sort;
  if (params.order) queryParams.order = params.order;

  return queryParams;
};

// Search query params
export const getSearchParams = (params: {
  search?: string;
  filters?: Record<string, any>;
}): Record<string, string> => {
  const queryParams: Record<string, string> = {};

  if (params.search) queryParams.search = params.search;

  if (params.filters) {
    Object.entries(params.filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams[key] = String(value);
      }
    });
  }

  return queryParams;
};