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

// Specific response type for orders that matches backend structure
export interface OrdersResponse {
  success: boolean;
  message: string;
  orders: Order[];
  total: number;
  page: number;
  limit: number;
  pages: number;
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
  id: string; // Backend returns 'id' field
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
  orderNumber: string;
  patient: {
    _id: string;
    firstName: string;
    lastName: string;
    phone?: string;
    patientId?: string;
  };
  patientName?: string;
  patientMRN?: string;
  tests: Array<{
    _id: string;
    testName: string;
    testCode?: string;
    category?: string;
    price?: number;
  }>;
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
  patientId: string;
  tests: { testId: string; price?: number }[];
  priority?: 'routine' | 'urgent' | 'stat';
  clinicalNotes?: string;
  orderedBy: string;
  specimen?: {
    type: string;
    collectionDate?: string;
    collectedBy?: string;
    notes?: string;
  };
  insuranceInfo?: {
    provider?: string;
    policyNumber?: string;
    preAuthNumber?: string;
  };
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
  unit?: string;
  normalRange?: {
    min?: number;
    max?: number;
    unit?: string;
    text?: string;
  };
  referenceRange?: string;
  interpretation?: 'normal' | 'low' | 'high' | 'critical' | 'borderline';
  isAbnormal: boolean;
  status: 'pending' | 'in_progress' | 'completed' | 'verified' | 'rejected' | 'requires_review';
  notes?: string;
  comments?: string;
  enteredBy: string;
  enteredByUser?: string;
  verifiedBy?: string;
  verifiedByUser?: string;
  verifiedAt?: string;
  verificationDate?: string;
  testCompletedAt?: string;
  testName?: string;
  testCode?: string;
  patientName?: string;
  patientMRN?: string;
  orderNumber?: string;
  specimenType?: string;
  collectionDate?: string;
  analysisDate?: string;
  method?: string;
  equipment?: string;
  criticalValue?: boolean;
  criticalValueNotifiedAt?: string;
  turnaroundTime?: number;
  qualityControl?: {
    controlId?: string;
    controlResult?: any;
    accepted?: boolean;
  };
  flags?: string[];
  pdfFileId?: string;
  pdfGeneration?: {
    generatedAt?: string;
    pdfVersion?: string;
    generationTime?: number;
    templateUsed?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateResultRequest {
  orderId: string;
  testId: string;
  value: any;
  valueType?: 'number' | 'text' | 'boolean' | 'array' | 'object';
  status?: 'pending' | 'in_progress' | 'completed' | 'verified' | 'rejected' | 'requires_review';
  notes?: string;
  equipment?: string;
  method?: string;
  specimen?: string;
  specimenType?: string;
}

export interface UpdateResultRequest {
  value?: any;
  valueType?: 'number' | 'text' | 'boolean' | 'array' | 'object';
  status?: 'pending' | 'in_progress' | 'completed' | 'verified' | 'rejected' | 'requires_review';
  notes?: string;
  equipment?: string;
  method?: string;
  specimen?: string;
  specimenType?: string;
  comments?: string;
}

// Report types
export interface Report {
  _id: string;
  reportNumber: string;
  order: string;
  orderNumber?: string;
  patient: string;
  patientName?: string;
  patientMRN?: string;
  patientInfo?: {
    name: string;
    age: number;
    gender: string;
    contact: string;
  };
  doctor: string;
  doctorName?: string;
  tests: string[];
  results: string[];
  type: 'preliminary' | 'final' | 'amended' | 'corrected';
  status: 'draft' | 'pending_review' | 'approved' | 'rejected' | 'delivered' | 'archived';
  sections: ReportSection[];
  summary?: string;
  conclusion?: string;
  recommendations?: string;
  clinicalNotes?: string;
  generatedBy: string;
  generatedByUser?: string;
  approvedBy?: string;
  approvedByUser?: string;
  approvedAt?: string;
  deliveredBy?: string;
  deliveredAt?: string;
  deliveryMethod?: 'email' | 'print' | 'portal' | 'fax';
  emailSentTo?: string;
  printedCopies?: number;
  // GridFS storage for PDF
  pdfFileId?: string;
  pdfFileName?: string;
  pdfFileSize?: number;
  // Report generation metadata
  reportGeneration?: {
    generatedAt?: string;
    pdfVersion?: string;
    generationTime?: number;
    templateUsed?: string;
  };
  template?: string;
  version: number;
  tags?: string[];
  priority: 'routine' | 'urgent' | 'stat';
  confidentialityLevel: 'standard' | 'confidential' | 'restricted';
  retentionPeriod?: number;
  archivedAt?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReportSection {
  title: string;
  content: string;
  order: number;
  type: 'text' | 'table' | 'chart' | 'image';
  data?: any;
}

export interface CreateReportRequest {
  order: string;
  template?: 'standard' | 'detailed' | 'compact';
  includeBarcode?: boolean;
  includeQR?: boolean;
  includeNormalRanges?: boolean;
  includeDoctorNotes?: boolean;
  autoGeneratePDF?: boolean;
}

export interface GeneratePDFRequest {
  template?: 'standard' | 'detailed' | 'compact';
  includeBarcode?: boolean;
  includeQR?: boolean;
}

export interface BulkGenerateRequest {
  orderIds: string[];
  template?: 'standard' | 'detailed' | 'compact';
  includeBarcode?: boolean;
  includeQR?: boolean;
}

export interface ReportStatistics {
  total: number;
  draft: number;
  pendingReview: number;
  approved: number;
  delivered: number;
  rejected: number;
  archived: number;
  byType: {
    preliminary: number;
    final: number;
    amended: number;
    corrected: number;
  };
  generatedToday: number;
  pdfGenerated: number;
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
  patientId?: string;
  testId?: string;
  orderId?: string;
  criticalValue?: boolean;
  isAbnormal?: boolean;
  startDate?: string;
  endDate?: string;
}

export interface ReportQueryParams extends PaginationParams {
  patientId?: string;
  doctorId?: string;
  status?: string;
  type?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Sample types
export interface Sample {
  _id: string;
  sampleId: string;
  barcode: string;
  order: {
    _id: string;
    orderNumber: string;
    priority: string;
    clinicalNotes?: string;
  };
  patient: {
    _id: string;
    firstName: string;
    lastName: string;
    patientId: string;
    dateOfBirth: string;
    phone?: string;
  };
  tests: Array<{
    _id: string;
    name: string;
    code: string;
    category: string;
    description?: string;
    normalRange?: any;
  }>;

  // Sample information
  sampleType: 'blood' | 'urine' | 'swab' | 'tissue' | 'fluid' | 'stool' | 'sputum' | 'other';
  containerType: string;
  volume: number;
  volumeUnit: string;

  // Collection details
  collectionStatus: 'pending' | 'collected' | 'in_process' | 'processing' | 'completed' | 'cancelled' | 'rejected' | 'expired';
  priority: 'routine' | 'urgent' | 'stat' | 'critical';
  collectionMethod?: 'venipuncture' | 'catheter' | 'lumbar_puncture' | 'swab' | 'voided' | 'biopsy' | 'other';
  scheduledCollectionTime?: string;
  actualCollectionTime?: string;
  collectedBy?: {
    _id: string;
    fullName: string;
  };
  collectionNotes?: string;

  // Processing details
  receivedTime?: string;
  receivedBy?: {
    _id: string;
    fullName: string;
  };
  processingStartTime?: string;
  processingEndTime?: string;
  processedBy?: {
    _id: string;
    fullName: string;
  };

  // Quality control
  qualityChecks: Array<{
    checkType: string;
    result: 'pass' | 'fail' | 'warning';
    notes?: string;
    checkedBy: {
      _id: string;
      fullName: string;
    };
    checkedAt: string;
  }>;

  // Storage information
  storageLocation?: string;
  storageTemperature?: number;
  storageConditions?: string;
  expiryDate?: string;

  // Status tracking
  statusHistory: Array<{
    status: string;
    changedBy: {
      _id: string;
      fullName: string;
    };
    changedAt: string;
    notes?: string;
  }>;

  // Rejection information
  rejectionReason?: string;
  rejectedBy?: {
    _id: string;
    fullName: string;
  };
  rejectedAt?: string;

  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy: {
    _id: string;
    fullName: string;
  };
  lastModifiedBy?: {
    _id: string;
    fullName: string;
  };
}

export interface CreateSampleRequest {
  orderId: string;
  patientId: string;
  testIds: string[];
  sampleType: string;
  containerType: string;
  volume: number;
  volumeUnit: string;
  collectionMethod?: string;
  scheduledCollectionTime?: string;
  priority?: 'routine' | 'urgent' | 'stat' | 'critical';
  collectionNotes?: string;
}

export interface UpdateSampleRequest {
  sampleType?: string;
  containerType?: string;
  volume?: number;
  volumeUnit?: string;
  collectionMethod?: string;
  scheduledCollectionTime?: string;
  priority?: 'routine' | 'urgent' | 'stat' | 'critical';
  collectionNotes?: string;
  storageLocation?: string;
  storageTemperature?: number;
  storageConditions?: string;
}

export interface SampleQueryParams extends PaginationParams {
  status?: string;
  priority?: string;
  sampleType?: string;
  patientId?: string;
  orderId?: string;
  dateFrom?: string;
  dateTo?: string;
  collectedBy?: string;
  search?: string;
}