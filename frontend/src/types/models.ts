// Data models and enums
export enum UserRole {
  ADMIN = 'admin',
  DOCTOR = 'doctor',
  LAB_TECHNICIAN = 'lab_technician',
  NURSE = 'nurse',
  RECEPTIONIST = 'receptionist',
}

export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum ResultStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  APPROVED = 'approved',
}

export enum ReportStatus {
  DRAFT = 'draft',
  GENERATED = 'generated',
  SENT = 'sent',
  DELIVERED = 'delivered',
}

export enum TestCategory {
  HEMATOLOGY = 'hematology',
  BIOCHEMISTRY = 'biochemistry',
  MICROBIOLOGY = 'microbiology',
  IMMUNOLOGY = 'immunology',
  PATHOLOGY = 'pathology',
  RADIOLOGY = 'radiology',
  CARDIOLOGY = 'cardiology',
  OTHER = 'other',
}

export enum SpecimenType {
  BLOOD = 'blood',
  URINE = 'urine',
  STOOL = 'stool',
  SPUTUM = 'sputum',
  SWAB = 'swab',
  CSF = 'csf',
  SYNOVIAL_FLUID = 'synovial_fluid',
  OTHER = 'other',
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

export enum Priority {
  ROUTINE = 'routine',
  URGENT = 'urgent',
  STAT = 'stat',
}

export enum Interpretation {
  NORMAL = 'normal',
  LOW = 'low',
  HIGH = 'high',
  CRITICAL = 'critical',
  BORDERLINE = 'borderline',
}

export enum DeliveryMethod {
  EMAIL = 'email',
  PATIENT_PORTAL = 'patient_portal',
  PRINT = 'print',
  PHONE = 'phone',
}

// Blood groups
export const BLOOD_GROUPS = [
  'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
] as const;

export type BloodGroup = typeof BLOOD_GROUPS[number];

// Form field types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'date' | 'select' | 'textarea' | 'checkbox' | 'radio';
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  options?: Array<{ value: string; label: string }>;
  validation?: any;
}

// UI State types
export interface ModalState {
  isOpen: boolean;
  title?: string;
  content?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface ToastState {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

export interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  modals: Record<string, ModalState>;
  toasts: ToastState[];
  loading: boolean;
}

// Permission types
export interface Permission {
  resource: string;
  actions: ('create' | 'read' | 'update' | 'delete')[];
}

export interface RolePermissions {
  admin: Permission[];
  doctor: Permission[];
  lab_technician: Permission[];
  nurse: Permission[];
  receptionist: Permission[];
}

// Table types
export interface TableColumn<T> {
  id: string;
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  width?: number | string;
  className?: string;
}

export interface TableAction<T> {
  label: string;
  icon?: React.ReactNode;
  onClick: (row: T) => void;
  disabled?: (row: T) => boolean;
  variant?: 'default' | 'destructive' | 'outline';
  permission?: string;
}

// Filter types
export interface FilterOption {
  value: string;
  label: string;
}

export interface DateRange {
  from: Date;
  to: Date;
}

export interface SearchFilter {
  query: string;
  fields: string[];
}

// Chart data types
export interface ChartData {
  name: string;
  value: number;
  date?: string;
}

export interface RevenueData {
  month: string;
  revenue: number;
  orders: number;
}

export interface TestAnalytics {
  testName: string;
  count: number;
  revenue: number;
  averageTime: number;
}

// Print settings
export interface PrintSettings {
  orientation: 'portrait' | 'landscape';
  pageSize: 'A4' | 'letter';
  includeHeader: boolean;
  includeFooter: boolean;
  watermark?: string;
}

// Application settings
export interface AppSettings {
  language: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  timezone: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  privacy: {
    shareData: boolean;
    analytics: boolean;
  };
  appearance: {
    compactMode: boolean;
    showTooltips: boolean;
    animations: boolean;
  };
}