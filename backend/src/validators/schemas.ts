import { z } from 'zod';

// Common schemas
export const PaginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

export const DateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
});

export const SearchSchema = z.object({
  search: z.string().optional()
});

// Auth schemas
export const AuthZodSchema = {
  register: z.object({
    email: z.string().email('Valid email is required'),
    username: z.string().min(3, 'Username must be at least 3 characters'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    fullName: z.string().min(1, 'Full name is required'),
    role: z.enum(['admin', 'doctor', 'lab_technician', 'nurse', 'receptionist']).optional(),
    phone: z.string().optional(),
    address: z.object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zipCode: z.string().optional(),
      country: z.string().optional()
    }).optional(),
    specialization: z.string().optional(),
    department: z.string().optional(),
    licenseNumber: z.string().optional()
  }),

  login: z.object({
    email: z.string().email('Valid email is required'),
    password: z.string().min(1, 'Password is required')
  }),

  updateProfile: z.object({
    fullName: z.string().min(1, 'Full name is required').optional(),
    phone: z.string().optional(),
    address: z.object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zipCode: z.string().optional(),
      country: z.string().optional()
    }).optional(),
    specialization: z.string().optional(),
    department: z.string().optional(),
    licenseNumber: z.string().optional()
  }),

  changePassword: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
    confirmPassword: z.string()
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"]
  }),

  forgotPassword: z.object({
    email: z.string().email('Valid email is required')
  }),

  resetPassword: z.object({
    token: z.string(),
    newPassword: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string()
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"]
  }),

  updateUserStatus: z.object({
    isActive: z.boolean()
  }),

  updateUserRole: z.object({
    role: z.enum(['admin', 'doctor', 'lab_technician', 'nurse', 'receptionist'])
  }),

  refresh: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required')
  })
};

// Patient schemas
export const PatientZodSchema = {
  create: z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    dateOfBirth: z.string().datetime('Valid date of birth is required'),
    gender: z.enum(['male', 'female', 'other'], { required_error: 'Valid gender is required' }),
    email: z.string().email('Valid email is required').optional(),
    phone: z.string().min(1, 'Phone number is required'),
    address: z.object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zipCode: z.string().optional(),
      country: z.string().optional()
    }).optional(),
    emergencyContact: z.object({
      name: z.string(),
      relationship: z.string(),
      phone: z.string()
    }).optional(),
    bloodType: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
    medicalConditions: z.array(z.string()).optional(),
    currentMedications: z.array(z.string()).optional(),
    allergies: z.array(z.string()).optional(),
    assignedDoctor: z.string().optional()
  }),

  update: z.object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    phone: z.string().optional(),
    address: z.object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zipCode: z.string().optional(),
      country: z.string().optional()
    }).optional(),
    emergencyContact: z.object({
      name: z.string().optional(),
      relationship: z.string().optional(),
      phone: z.string().optional()
    }).optional(),
    bloodType: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
    assignedDoctor: z.string().optional()
  }),

  addMedicalCondition: z.object({
    condition: z.string().min(1, 'Condition is required')
  }),

  removeMedicalCondition: z.object({
    condition: z.string().min(1, 'Condition is required')
  }),

  addMedication: z.object({
    medication: z.string().min(1, 'Medication is required')
  }),

  removeMedication: z.object({
    medication: z.string().min(1, 'Medication is required')
  }),

  addAllergy: z.object({
    allergy: z.string().min(1, 'Allergy is required')
  }),

  removeAllergy: z.object({
    allergy: z.string().min(1, 'Allergy is required')
  })
};

// Test schemas
export const TestZodSchema = {
  create: z.object({
    name: z.string().min(1, 'Test name is required'),
    code: z.string().min(1, 'Test code is required'),
    category: z.string().min(1, 'Category is required'),
    department: z.string().min(1, 'Department is required'),
    description: z.string().optional(),
    specimen: z.string().min(1, 'Specimen type is required'),
    price: z.number().min(0, 'Price must be positive'),
    normalRange: z.object({
      min: z.number().optional(),
      max: z.number().optional(),
      unit: z.string().optional(),
      gender: z.enum(['male', 'female', 'both']).default('both'),
      ageRange: z.object({
        min: z.number().optional(),
        max: z.number().optional()
      }).optional(),
      text: z.string().optional()
    }).optional(),
    testParameters: z.array(z.object({
      name: z.string(),
      unit: z.string().optional(),
      normalRange: z.object({
        min: z.number().optional(),
        max: z.number().optional(),
        text: z.string().optional()
      }).optional()
    })).optional(),
    turnaroundTime: z.number().min(1).optional(), // in hours
    isActive: z.boolean().default(true)
  }),

  update: z.object({
    name: z.string().min(1).optional(),
    category: z.string().min(1).optional(),
    department: z.string().min(1).optional(),
    description: z.string().optional(),
    specimen: z.string().min(1).optional(),
    price: z.number().min(0).optional(),
    normalRange: z.object({
      min: z.number().optional(),
      max: z.number().optional(),
      unit: z.string().optional(),
      gender: z.enum(['male', 'female', 'both']).optional(),
      ageRange: z.object({
        min: z.number().optional(),
        max: z.number().optional()
      }).optional(),
      text: z.string().optional()
    }).optional(),
    testParameters: z.array(z.object({
      name: z.string(),
      unit: z.string().optional(),
      normalRange: z.object({
        min: z.number().optional(),
        max: z.number().optional(),
        text: z.string().optional()
      }).optional()
    })).optional(),
    turnaroundTime: z.number().min(1).optional(),
    isActive: z.boolean().optional()
  }),

  updatePrice: z.object({
    price: z.number().min(0, 'Price must be positive')
  }),

  addParameter: z.object({
    name: z.string().min(1, 'Parameter name is required'),
    unit: z.string().optional(),
    normalRange: z.object({
      min: z.number().optional(),
      max: z.number().optional(),
      text: z.string().optional()
    }).optional()
  }),

  updateParameter: z.object({
    name: z.string().min(1).optional(),
    unit: z.string().optional(),
    normalRange: z.object({
      min: z.number().optional(),
      max: z.number().optional(),
      text: z.string().optional()
    }).optional()
  }),

  priceRange: z.object({
    minPrice: z.string(),
    maxPrice: z.string()
  }),

  bulkUpdatePrices: z.object({
    updates: z.array(z.object({
      testId: z.string(),
      newPrice: z.number().min(0)
    }))
  }),

  duplicate: z.object({
    newName: z.string().min(1, 'New name is required'),
    newCode: z.string().min(1, 'New code is required')
  })
};

// Order schemas
export const OrderZodSchema = {
  create: z.object({
    patientId: z.string().min(1, 'Patient ID is required'),
    orderedBy: z.string().min(1, 'Ordering doctor/user ID is required'),
    tests: z.array(z.object({
      testId: z.string().min(1, 'Test ID is required'),
      price: z.number().min(0, 'Price must be positive').optional()
    })).min(1, 'At least one test is required'),
    priority: z.enum(['routine', 'urgent', 'stat']).default('routine'),
    clinicalNotes: z.string().optional(),
    specimen: z.object({
      type: z.string().min(1, 'Specimen type is required'),
      collectionDate: z.string().datetime().optional(),
      collectedBy: z.string().optional(),
      notes: z.string().optional()
    }).optional(),
    insuranceInfo: z.object({
      provider: z.string().optional(),
      policyNumber: z.string().optional(),
      preAuthNumber: z.string().optional()
    }).optional()
  }),

  update: z.object({
    clinicalNotes: z.string().optional(),
    priority: z.enum(['routine', 'urgent', 'stat']).optional(),
    specimen: z.object({
      type: z.string().optional(),
      collectionDate: z.string().datetime().optional(),
      collectedBy: z.string().optional(),
      notes: z.string().optional()
    }).optional(),
    insuranceInfo: z.object({
      provider: z.string().optional(),
      policyNumber: z.string().optional(),
      preAuthNumber: z.string().optional()
    }).optional()
  }),

  updateStatus: z.object({
    status: z.enum(['pending', 'sample_collected', 'in_progress', 'completed', 'cancelled']),
    notes: z.string().optional()
  }),

  cancel: z.object({
    reason: z.string().min(1, 'Cancellation reason is required'),
    cancelledBy: z.string().min(1, 'User ID is required')
  }),

  addTest: z.object({
    testId: z.string().min(1, 'Test ID is required'),
    price: z.number().min(0, 'Price must be positive').optional()
  }),

  updatePayment: z.object({
    status: z.enum(['pending', 'partial', 'paid', 'overdue']),
    amount: z.number().min(0, 'Payment amount must be positive').optional(),
    method: z.enum(['cash', 'card', 'insurance', 'other']).optional(),
    transactionId: z.string().optional(),
    notes: z.string().optional()
  })
};

// Result schemas
export const ResultZodSchema = {
  create: z.object({
    orderId: z.string().min(1, 'Order ID is required'),
    testId: z.string().min(1, 'Test ID is required'),
    performedBy: z.string().min(1, 'Technician ID is required'),
    resultData: z.record(z.any()),
    status: z.enum(['pending', 'in_progress', 'completed', 'failed', 'cancelled']).default('pending'),
    notes: z.string().optional(),
    equipment: z.string().optional(),
    qualityControl: z.object({
      passed: z.boolean(),
      notes: z.string().optional(),
      reviewedBy: z.string().optional()
    }).optional()
  }),

  update: z.object({
    resultData: z.record(z.any()).optional(),
    status: z.enum(['pending', 'in_progress', 'completed', 'failed', 'cancelled']).optional(),
    notes: z.string().optional(),
    equipment: z.string().optional(),
    qualityControl: z.object({
      passed: z.boolean(),
      notes: z.string().optional(),
      reviewedBy: z.string().optional()
    }).optional()
  }),

  addParameter: z.object({
    name: z.string().min(1, 'Parameter name is required'),
    value: z.any(),
    unit: z.string().optional(),
    normalRange: z.string().optional(),
    flag: z.enum(['normal', 'high', 'low', 'critical']).optional()
  }),

  approve: z.object({
    approvedBy: z.string().min(1, 'Approver ID is required'),
    notes: z.string().optional()
  }),

  reject: z.object({
    rejectedBy: z.string().min(1, 'Rejecter ID is required'),
    reason: z.string().min(1, 'Rejection reason is required'),
    notes: z.string().optional()
  })
};

// Report schemas
export const ReportZodSchema = {
  create: z.object({
    patientId: z.string().min(1, 'Patient ID is required'),
    orderId: z.string().min(1, 'Order ID is required'),
    template: z.string().min(1, 'Report template is required'),
    generatedBy: z.string().min(1, 'Generator ID is required'),
    format: z.enum(['pdf', 'html', 'json']).default('pdf'),
    includeGraphs: z.boolean().default(false),
    includeComparison: z.boolean().default(false),
    customNotes: z.string().optional()
  }),

  update: z.object({
    template: z.string().optional(),
    customNotes: z.string().optional(),
    includeGraphs: z.boolean().optional(),
    includeComparison: z.boolean().optional()
  }),

  approve: z.object({
    approvedBy: z.string().min(1, 'Approver ID is required'),
    notes: z.string().optional()
  }),

  share: z.object({
    recipientEmail: z.string().email('Valid email is required'),
    method: z.enum(['email', 'sms', 'portal']),
    message: z.string().optional(),
    expiresIn: z.number().min(1).max(30).default(7) // days
  })
};