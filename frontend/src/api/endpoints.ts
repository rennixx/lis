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
    PENDING_TESTS: (id: string) => `/orders/${id}/pending-tests`,
  },

  // Sample endpoints
  SAMPLES: {
    LIST: '/samples',
    CREATE: '/samples',
    GET: (id: string) => `/samples/${id}`,
    UPDATE: (id: string) => `/samples/${id}`,
    DELETE: (id: string) => `/samples/${id}`,
    QUEUE: '/samples/queue',
    STATISTICS: '/samples/statistics',
    STATUS_COUNTS: '/samples/status-counts',
    SEARCH: '/samples/search',
    BARCODE: (barcode: string) => `/samples/barcode/${barcode}`,
    BULK_STATUS: '/samples/bulk-status',
    RECEIVE: '/samples/receive',
    START_PROCESSING: '/samples/start-processing',
    COMPLETE_PROCESSING: '/samples/complete-processing',
    PRINT_LABELS: '/samples/print-labels',
    CONFIRM_COLLECTION: (id: string) => `/samples/${id}/confirm-collection`,
    GENERATE_BARCODE: (id: string) => `/samples/${id}/barcode`,
  },

  // Result endpoints
  RESULTS: {
    LIST: '/results',
    CREATE: '/results',
    BULK: '/results/bulk',
    GET: (id: string) => `/results/${id}`,
    UPDATE: (id: string) => `/results/${id}`,
    UPDATE_VALUE: (id: string) => `/results/${id}/value`,
    DELETE: (id: string) => `/results/${id}`,
    VERIFY: (id: string) => `/results/${id}/verify`,
    BULK_VERIFY: '/results/bulk-verify',
    REJECT: (id: string) => `/results/${id}/reject`,
    BULK_REJECT: '/results/bulk-reject',
    MARK_CRITICAL: (id: string) => `/results/${id}/mark-critical`,
    COMMENT: (id: string) => `/results/${id}/comment`,
    APPROVE: (id: string) => `/results/${id}/approve`,
    SEARCH: '/results/search',
    STATISTICS: '/results/statistics',
    CRITICAL: '/results/critical',
    ABNORMAL: '/results/abnormal',
    REVIEW: '/results/review',
    BY_ORDER: (orderId: string) => `/results/order/${orderId}`,
    BY_PATIENT: (patientId: string) => `/results/patient/${patientId}`,
    // PDF Generation and Download for Results
    GENERATE_PDF: (id: string) => `/results/${id}/pdf`,
    DOWNLOAD_PDF: (id: string) => `/results/${id}/pdf/download`,
    VIEW_PDF: (id: string) => `/results/${id}/pdf/view`,
  },

  // Report endpoints
  REPORTS: {
    LIST: '/reports',
    SEARCH: '/reports/search',
    STATISTICS: '/reports/statistics',
    GET: (id: string) => `/reports/${id}`,
    UPDATE_STATUS: (id: string) => `/reports/${id}/status`,
    DELETE: (id: string) => `/reports/${id}`,
    // PDF Generation and Download
    GENERATE_FROM_ORDER: (orderId: string) => `/reports/generate/${orderId}`,
    GENERATE_PDF: (id: string) => `/reports/${id}/pdf`,
    DOWNLOAD_PDF: (id: string) => `/reports/${id}/pdf/download`,
    VIEW_PDF: (id: string) => `/reports/${id}/pdf/view`,
    BULK_GENERATE: '/reports/bulk-generate',
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