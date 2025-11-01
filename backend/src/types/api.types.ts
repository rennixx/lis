export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ApiError extends Error {
  statusCode: number;
  isOperational: boolean;
}

export interface JWTPayload {
  userId: string;
  role: string;
  email: string;
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface SearchQuery {
  search?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: any;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  fullName: string;
  role?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  specialization?: string;
  department?: string;
  licenseNumber?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  user: any;
}

export interface PatientCreateRequest {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  email?: string;
  phone: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  bloodGroup?: string;
  emergencyContact?: {
    name?: string;
    relationship?: string;
    phoneNumber?: string;
  };
}

export interface TestCreateRequest {
  testCode: string;
  testName: string;
  category: string;
  description?: string;
  normalRange?: {
    min?: number;
    max?: number;
    unit?: string;
    text?: string;
  };
  specimenType: string;
  preparationInstructions?: string;
  turnaroundTime?: {
    value: number;
    unit: 'minutes' | 'hours' | 'days';
  };
  price: number;
  testParameters?: Array<{
    name: string;
    unit?: string;
    normalRange?: {
      min?: number;
      max?: number;
      text?: string;
    };
  }>;
}

export interface OrderCreateRequest {
  patient: string;
  tests: Array<{
    test: string;
    price: number;
  }>;
  orderingDoctor: string;
  priority?: 'routine' | 'urgent' | 'stat';
  notes?: string;
}

export interface ResultCreateRequest {
  order: string;
  test: string;
  patient: string;
  value: any;
  normalRange?: {
    min?: number;
    max?: number;
    unit?: string;
    text?: string;
  };
  interpretation?: 'normal' | 'low' | 'high' | 'critical' | 'borderline';
  notes?: string;
}

export interface ReportCreateRequest {
  patient: string;
  orders: string[];
  results: string[];
  type?: 'preliminary' | 'final' | 'amended';
  summary?: string;
  conclusion?: string;
  recommendations?: string[];
}