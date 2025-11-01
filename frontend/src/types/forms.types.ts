import { z } from 'zod';

// Common validation schemas
export const emailSchema = z.string().email('Please enter a valid email address');
export const passwordSchema = z.string().min(6, 'Password must be at least 6 characters long');
export const nameSchema = z.string().min(2, 'Name must be at least 2 characters long').max(50, 'Name must be less than 50 characters');
export const phoneSchema = z.string().regex(/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid phone number');

// Auth forms
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  role: z.enum(['admin', 'doctor', 'lab_technician', 'nurse', 'receptionist']).optional(),
  phoneNumber: phoneSchema.optional(),
  specialization: z.string().optional(),
  department: z.string().optional(),
  licenseNumber: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Patient forms
export const patientSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  dateOfBirth: z.string().refine((date) => {
    const parsed = new Date(date);
    return !isNaN(parsed.getTime()) && parsed < new Date();
  }, 'Please enter a valid date of birth'),
  gender: z.enum(['male', 'female', 'other']).refine(val => val !== undefined, {
    message: 'Please select a gender',
  }),
  email: emailSchema.optional(),
  phone: phoneSchema,
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
  bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
  emergencyContact: z.object({
    name: z.string().optional(),
    relationship: z.string().optional(),
    phoneNumber: phoneSchema.optional(),
  }).optional(),
});

// Test forms
export const testSchema = z.object({
  testCode: z.string().min(1, 'Test code is required').max(20, 'Test code must be less than 20 characters'),
  testName: z.string().min(1, 'Test name is required').max(100, 'Test name must be less than 100 characters'),
  category: z.enum(['hematology', 'biochemistry', 'microbiology', 'immunology', 'pathology', 'radiology', 'cardiology', 'other']).refine(val => val !== undefined, {
    message: 'Please select a category',
  }),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  normalRange: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    unit: z.string().optional(),
    text: z.string().optional(),
  }).optional(),
  specimenType: z.enum(['blood', 'urine', 'stool', 'sputum', 'swab', 'csf', 'synovial_fluid', 'other']).refine(val => val !== undefined, {
    message: 'Please select a specimen type',
  }),
  preparationInstructions: z.string().max(1000, 'Instructions must be less than 1000 characters').optional(),
  turnaroundTime: z.object({
    value: z.number().min(1, 'Turnaround time must be at least 1'),
    unit: z.enum(['minutes', 'hours', 'days']),
  }).optional(),
  price: z.number().min(0, 'Price must be a positive number'),
});

// Order forms
export const orderSchema = z.object({
  patient: z.string().min(1, 'Patient is required'),
  tests: z.array(z.string()).min(1, 'At least one test is required'),
  orderingDoctor: z.string().min(1, 'Ordering doctor is required'),
  priority: z.enum(['routine', 'urgent', 'stat']).optional(),
  notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional(),
});

// Result forms
export const resultSchema = z.object({
  order: z.string().min(1, 'Order is required'),
  test: z.string().min(1, 'Test is required'),
  patient: z.string().min(1, 'Patient is required'),
  value: z.any(), // Mixed type for different result values
  normalRange: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    unit: z.string().optional(),
    text: z.string().optional(),
  }).optional(),
  interpretation: z.enum(['normal', 'low', 'high', 'critical', 'borderline']).optional(),
  notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional(),
});

// Report forms
export const reportSchema = z.object({
  patient: z.string().min(1, 'Patient is required'),
  orders: z.array(z.string()).min(1, 'At least one order is required'),
  results: z.array(z.string()).min(1, 'At least one result is required'),
  type: z.enum(['preliminary', 'final', 'amended']).optional(),
  summary: z.string().max(2000, 'Summary must be less than 2000 characters').optional(),
  conclusion: z.string().max(2000, 'Conclusion must be less than 2000 characters').optional(),
  recommendations: z.array(z.string()).optional(),
});

// Search and filter forms
export const searchSchema = z.object({
  query: z.string().optional(),
  dateRange: z.object({
    from: z.string().optional(),
    to: z.string().optional(),
  }).optional(),
  filters: z.record(z.string(), z.any()).optional(),
});

// Pagination forms
export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
});

// Settings forms
export const userSettingsSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
  phoneNumber: phoneSchema.optional(),
  specialization: z.string().optional(),
  department: z.string().optional(),
  licenseNumber: z.string().optional(),
});

export const appSettingsSchema = z.object({
  language: z.string().default('en'),
  dateFormat: z.enum(['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD']).default('MM/DD/YYYY'),
  timeFormat: z.enum(['12h', '24h']).default('12h'),
  timezone: z.string().default('UTC'),
  notifications: z.object({
    email: z.boolean().default(true),
    push: z.boolean().default(true),
    sms: z.boolean().default(false),
  }),
  privacy: z.object({
    shareData: z.boolean().default(false),
    analytics: z.boolean().default(true),
  }),
  appearance: z.object({
    compactMode: z.boolean().default(false),
    showTooltips: z.boolean().default(true),
    animations: z.boolean().default(true),
  }),
});

// Type exports
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
export type PatientFormData = z.infer<typeof patientSchema>;
export type TestFormData = z.infer<typeof testSchema>;
export type OrderFormData = z.infer<typeof orderSchema>;
export type ResultFormData = z.infer<typeof resultSchema>;
export type ReportFormData = z.infer<typeof reportSchema>;
export type SearchFormData = z.infer<typeof searchSchema>;
export type PaginationFormData = z.infer<typeof paginationSchema>;
export type UserSettingsFormData = z.infer<typeof userSettingsSchema>;
export type AppSettingsFormData = z.infer<typeof appSettingsSchema>;