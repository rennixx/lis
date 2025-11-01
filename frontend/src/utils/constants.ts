// API Configuration
export const API_BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:3000'
export const API_VERSION = 'v1'
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    ME: '/auth/profile',
    RESET_PASSWORD: '/auth/reset-password',
    RESET_PASSWORD_CONFIRM: '/auth/reset-password-confirm',
    VERIFY_EMAIL: '/auth/verify-email',
  },
  USERS: {
    LIST: '/users',
    ME: '/users/me',
    UPDATE_ME: '/users/me',
    DETAIL: (id: number) => `/users/${id}`,
    UPDATE: (id: number) => `/users/${id}`,
    DELETE: (id: number) => `/users/${id}`,
  },
  PATIENTS: {
    LIST: '/patients',
    CREATE: '/patients',
    SEARCH: '/patients/search',
    DETAIL: (id: number) => `/patients/${id}`,
    UPDATE: (id: number) => `/patients/${id}`,
    DELETE: (id: number) => `/patients/${id}`,
    HISTORY: (id: number) => `/patients/${id}/history`,
    STATISTICS: '/patients/statistics/overview',
  },
  TESTS: {
    LIST: '/tests',
    CREATE: '/tests',
    SEARCH: '/tests/search',
    DETAIL: (id: number) => `/tests/${id}`,
    UPDATE: (id: number) => `/tests/${id}`,
    DELETE: (id: number) => `/tests/${id}`,
    TYPES: '/test-types',
    BULK_CREATE: '/tests/bulk',
    STATISTICS: '/tests/statistics',
  },
  RESULTS: {
    LIST: '/results',
    CREATE: '/results',
    SEARCH: '/results/search',
    DETAIL: (id: number) => `/results/${id}`,
    UPDATE: (id: number) => `/results/${id}`,
    DELETE: (id: number) => `/results/${id}`,
    VERIFY: '/results/verify',
    BULK_VERIFY: '/results/bulk-verify',
    STATISTICS: '/results/statistics',
  },
  REPORTS: {
    LIST: '/reports',
    CREATE: '/reports',
    SEARCH: '/reports/search',
    DETAIL: (id: number) => `/reports/${id}`,
    UPDATE: (id: number) => `/reports/${id}`,
    DELETE: (id: number) => `/reports/${id}`,
    APPROVE: (id: number) => `/reports/${id}/approve`,
    DELIVER: (id: number) => `/reports/${id}/deliver`,
    STATISTICS: '/reports/statistics',
  },
  SAMPLES: {
    LIST: '/samples',
    CREATE: '/samples',
    SEARCH: '/samples/search',
    DETAIL: (id: number) => `/samples/${id}`,
    UPDATE: (id: number) => `/samples/${id}`,
    DELETE: (id: number) => `/samples/${id}`,
    RECEIVE: (id: number) => `/samples/${id}/receive`,
    PROCESS: (id: number) => `/samples/${id}/process`,
    REJECT: (id: number) => `/samples/${id}/reject`,
    BULK_UPDATE: '/samples/bulk',
    STATISTICS: '/samples/statistics',
  },
  APPOINTMENTS: {
    LIST: '/appointments',
    CREATE: '/appointments',
    SEARCH: '/appointments/search',
    DETAIL: (id: number) => `/appointments/${id}`,
    UPDATE: (id: number) => `/appointments/${id}`,
    DELETE: (id: number) => `/appointments/${id}`,
    CHECK_IN: (id: number) => `/appointments/${id}/check-in`,
    CANCEL: (id: number) => `/appointments/${id}/cancel`,
    RESCHEDULE: (id: number) => `/appointments/${id}/reschedule`,
    SLOTS: '/appointments/slots',
    STATISTICS: '/appointments/statistics',
  },
}

// User Roles and Permissions
export const USER_ROLES = {
  ADMIN: 'admin',
  DOCTOR: 'doctor',
  LAB_TECHNICIAN: 'lab_technician',
  NURSE: 'nurse',
  RECEPTIONIST: 'receptionist',
} as const

export const ROLE_PERMISSIONS = {
  [USER_ROLES.ADMIN]: ['*'],
  [USER_ROLES.DOCTOR]: [
    'view:patients',
    'create:patients',
    'edit:patients',
    'order:tests',
    'view:results',
    'view:reports',
    'generate:reports'
  ],
  [USER_ROLES.LAB_TECHNICIAN]: [
    'view:patients',
    'view:tests',
    'enter:results',
    'manage:samples',
    'view:reports'
  ],
  [USER_ROLES.NURSE]: [
    'view:patients',
    'create:patients',
    'edit:patients',
    'order:tests',
    'view:results',
    'collect:samples'
  ],
  [USER_ROLES.RECEPTIONIST]: [
    'view:patients',
    'create:patients',
    'edit:patients',
    'schedule:appointments',
    'view:appointments'
  ],
} as const

// Test Statuses
export const TEST_STATUSES = {
  ORDERED: 'ordered',
  SAMPLE_COLLECTED: 'sample_collected',
  SAMPLE_RECEIVED: 'sample_received',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  REJECTED: 'rejected',
} as const

export const TEST_PRIORITIES = {
  ROUTINE: 'routine',
  URGENT: 'urgent',
  STAT: 'stat',
  CRITICAL: 'critical',
} as const

// Sample Statuses
export const SAMPLE_STATUSES = {
  ORDERED: 'ordered',
  COLLECTED: 'collected',
  RECEIVED: 'received',
  PROCESSED: 'processed',
  STORED: 'stored',
  EXPIRED: 'expired',
  DISCARDED: 'discarded',
  REJECTED: 'rejected',
} as const

// Appointment Statuses
export const APPOINTMENT_STATUSES = {
  SCHEDULED: 'scheduled',
  CONFIRMED: 'confirmed',
  CHECKED_IN: 'checked_in',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show',
  RESCHEDULED: 'rescheduled',
} as const

// Date and Time Formats
export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  INPUT: 'yyyy-MM-dd',
  DATETIME_DISPLAY: 'MMM dd, yyyy HH:mm',
  DATETIME_INPUT: 'yyyy-MM-dd HH:mm',
  TIME: 'HH:mm',
} as const

// Pagination
export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'lis_auth_token',
  REFRESH_TOKEN: 'lis_refresh_token',
  USER: 'lis_user',
  THEME: 'lis_theme',
  PREFERENCES: 'lis_preferences',
} as const

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'You do not have permission to access this resource.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  SERVER_ERROR: 'An unexpected error occurred. Please try again later.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
} as const

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logged out successfully',
  CREATE_SUCCESS: 'Created successfully',
  UPDATE_SUCCESS: 'Updated successfully',
  DELETE_SUCCESS: 'Deleted successfully',
  SAVE_SUCCESS: 'Saved successfully',
} as const

// Navigation Items
export const NAVIGATION_ITEMS = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: 'layout-dashboard',
    roles: ['admin', 'doctor', 'lab_technician', 'nurse', 'receptionist'],
  },
  {
    title: 'Patients',
    href: '/patients',
    icon: 'users',
    roles: ['admin', 'doctor', 'lab_technician', 'nurse', 'receptionist'],
  },
  {
    title: 'Orders',
    href: '/orders',
    icon: 'clipboard-list',
    roles: ['admin', 'doctor', 'lab_technician', 'nurse', 'receptionist'],
  },
  {
    title: 'Tests',
    href: '/tests',
    icon: 'flask',
    roles: ['admin', 'doctor', 'lab_technician', 'nurse'],
  },
  {
    title: 'Results',
    href: '/results',
    icon: 'clipboard-check',
    roles: ['admin', 'doctor', 'lab_technician', 'nurse'],
  },
  {
    title: 'Reports',
    href: '/reports',
    icon: 'file-text',
    roles: ['admin', 'doctor', 'lab_technician'],
  },
  {
    title: 'Samples',
    href: '/samples',
    icon: 'vial',
    roles: ['admin', 'lab_technician', 'nurse'],
  },
  {
    title: 'Sample Collection',
    href: '/samples/collection',
    icon: 'package',
    roles: ['admin', 'lab_technician', 'nurse'],
  },
  {
    title: 'Appointments',
    href: '/appointments',
    icon: 'calendar',
    roles: ['admin', 'doctor', 'nurse', 'receptionist'],
  },
  {
    title: 'Users',
    href: '/users',
    icon: 'user-cog',
    roles: ['admin'],
  },
] as const

// Chart Colors
export const CHART_COLORS = {
  PRIMARY: '#3b82f6',
  SECONDARY: '#10b981',
  SUCCESS: '#22c55e',
  WARNING: '#f59e0b',
  DANGER: '#ef4444',
  INFO: '#06b6d4',
  PURPLE: '#8b5cf6',
  PINK: '#ec4899',
} as const