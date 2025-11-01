// API Response types
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

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role?: string;
  phoneNumber?: string;
  specialization?: string;
  department?: string;
  licenseNumber?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  phoneNumber?: string;
  specialization?: string;
  department?: string;
  licenseNumber?: string;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Patient types
export interface Patient {
  _id: string;
  patientId: string;
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
  medicalHistory: Array<{
    condition: string;
    diagnosis: string;
    diagnosisDate: string;
    medications: string[];
  }>;
  allergies: string[];
  testHistory: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePatientRequest {
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

// Test types
export interface Test {
  _id: string;
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
  testParameters: Array<{
    name: string;
    unit?: string;
    normalRange?: {
      min?: number;
      max?: number;
      text?: string;
    };
  }>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTestRequest {
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

// Order types
export interface Order {
  _id: string;
  id: string;
  orderNumber: string;
  patient: string;
  patientName?: string;
  patientMRN?: string;
  tests: string[];
  orderItems: Array<{
    testId: string;
    testName: string;
    testCode: string;
    price: number;
    quantity?: number;
  }>;
  status: 'pending' | 'processing' | 'sample_collected' | 'completed' | 'cancelled';
  priority: 'routine' | 'urgent' | 'stat' | 'critical';
  totalAmount: number;
  discountAmount?: number;
  finalAmount?: number;
  paymentStatus: 'pending' | 'paid' | 'partial' | 'refunded';
  orderedBy: string;
  orderedByUser?: string;
  department?: string;
  clinicalInformation?: string;
  doctorName?: string;
  doctorId?: string;
  sampleCollectedAt?: string;
  collectedBy?: string;
  completedAt?: string;
  expectedDeliveryTime?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderRequest {
  patient: string;
  tests: string[];
  priority?: 'routine' | 'urgent' | 'stat' | 'critical';
  clinicalInformation?: string;
  doctorName?: string;
  department?: string;
  totalAmount?: number;
  orderedBy: string;
}

export interface UpdateOrderRequest {
  priority?: 'routine' | 'urgent' | 'stat' | 'critical';
  clinicalInformation?: string;
  doctorName?: string;
  department?: string;
  notes?: string;
}

// Result types
export interface Result {
  _id: string;
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
  isAbnormal: boolean;
  notes?: string;
  enteredBy: string;
  verifiedBy?: string;
  verifiedAt?: string;
  testCompletedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateResultRequest {
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

// Report types
export interface Report {
  _id: string;
  reportNumber: string;
  patient: string;
  patientName?: string;
  orders: string[];
  results: string[];
  type: 'preliminary' | 'final' | 'amended';
  summary?: string;
  conclusion?: string;
  recommendations: string[];
  generatedBy: string;
  status: 'draft' | 'generated' | 'sent' | 'delivered';
  deliveryMethod?: 'email' | 'patient_portal' | 'print' | 'phone';
  sentAt?: string;
  deliveredAt?: string;
  filePath?: string;
  isAbnormal: boolean;
  requiresFollowUp: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReportRequest {
  patient: string;
  orders: string[];
  results: string[];
  type?: 'preliminary' | 'final' | 'amended';
  summary?: string;
  conclusion?: string;
  recommendations?: string[];
}

// Query params
export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PatientQueryParams extends PaginationParams {
  gender?: string;
  bloodGroup?: string;
}

export interface TestQueryParams extends PaginationParams {
  category?: string;
  specimenType?: string;
}

export interface OrderQueryParams extends PaginationParams {
  status?: string;
  priority?: string;
  urgent?: boolean;
}

export interface ResultQueryParams extends PaginationParams {
  status?: string;
  interpretation?: string;
  abnormal?: boolean;
}

export interface ReportQueryParams extends PaginationParams {
  status?: string;
  type?: string;
  deliveryMethod?: string;
}