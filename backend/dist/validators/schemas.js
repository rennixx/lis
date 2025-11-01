"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportZodSchema = exports.ResultZodSchema = exports.OrderZodSchema = exports.TestZodSchema = exports.PatientZodSchema = exports.AuthZodSchema = exports.SearchSchema = exports.DateRangeSchema = exports.PaginationSchema = void 0;
const zod_1 = require("zod");
exports.PaginationSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().min(1).default(1),
    limit: zod_1.z.coerce.number().min(1).max(100).default(10),
    sortBy: zod_1.z.string().default('createdAt'),
    sortOrder: zod_1.z.enum(['asc', 'desc']).default('desc')
});
exports.DateRangeSchema = zod_1.z.object({
    startDate: zod_1.z.string().datetime().optional(),
    endDate: zod_1.z.string().datetime().optional()
});
exports.SearchSchema = zod_1.z.object({
    search: zod_1.z.string().optional()
});
exports.AuthZodSchema = {
    register: zod_1.z.object({
        email: zod_1.z.string().email('Valid email is required'),
        username: zod_1.z.string().min(3, 'Username must be at least 3 characters'),
        password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
        fullName: zod_1.z.string().min(1, 'Full name is required'),
        role: zod_1.z.enum(['admin', 'doctor', 'lab_technician', 'nurse', 'receptionist']).optional(),
        phone: zod_1.z.string().optional(),
        address: zod_1.z.object({
            street: zod_1.z.string().optional(),
            city: zod_1.z.string().optional(),
            state: zod_1.z.string().optional(),
            zipCode: zod_1.z.string().optional(),
            country: zod_1.z.string().optional()
        }).optional(),
        specialization: zod_1.z.string().optional(),
        department: zod_1.z.string().optional(),
        licenseNumber: zod_1.z.string().optional()
    }),
    login: zod_1.z.object({
        email: zod_1.z.string().email('Valid email is required'),
        password: zod_1.z.string().min(1, 'Password is required')
    }),
    updateProfile: zod_1.z.object({
        fullName: zod_1.z.string().min(1, 'Full name is required').optional(),
        phone: zod_1.z.string().optional(),
        address: zod_1.z.object({
            street: zod_1.z.string().optional(),
            city: zod_1.z.string().optional(),
            state: zod_1.z.string().optional(),
            zipCode: zod_1.z.string().optional(),
            country: zod_1.z.string().optional()
        }).optional(),
        specialization: zod_1.z.string().optional(),
        department: zod_1.z.string().optional(),
        licenseNumber: zod_1.z.string().optional()
    }),
    changePassword: zod_1.z.object({
        currentPassword: zod_1.z.string().min(1, 'Current password is required'),
        newPassword: zod_1.z.string().min(6, 'New password must be at least 6 characters'),
        confirmPassword: zod_1.z.string()
    }).refine((data) => data.newPassword === data.confirmPassword, {
        message: "Passwords don't match",
        path: ["confirmPassword"]
    }),
    forgotPassword: zod_1.z.object({
        email: zod_1.z.string().email('Valid email is required')
    }),
    resetPassword: zod_1.z.object({
        token: zod_1.z.string(),
        newPassword: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
        confirmPassword: zod_1.z.string()
    }).refine((data) => data.newPassword === data.confirmPassword, {
        message: "Passwords don't match",
        path: ["confirmPassword"]
    }),
    updateUserStatus: zod_1.z.object({
        isActive: zod_1.z.boolean()
    }),
    updateUserRole: zod_1.z.object({
        role: zod_1.z.enum(['admin', 'doctor', 'lab_technician', 'nurse', 'receptionist'])
    }),
    refresh: zod_1.z.object({
        refreshToken: zod_1.z.string().min(1, 'Refresh token is required')
    })
};
exports.PatientZodSchema = {
    create: zod_1.z.object({
        firstName: zod_1.z.string().min(1, 'First name is required'),
        lastName: zod_1.z.string().min(1, 'Last name is required'),
        dateOfBirth: zod_1.z.string().datetime('Valid date of birth is required'),
        gender: zod_1.z.enum(['male', 'female', 'other'], { required_error: 'Valid gender is required' }),
        email: zod_1.z.string().email('Valid email is required').optional(),
        phone: zod_1.z.string().min(1, 'Phone number is required'),
        address: zod_1.z.object({
            street: zod_1.z.string().optional(),
            city: zod_1.z.string().optional(),
            state: zod_1.z.string().optional(),
            zipCode: zod_1.z.string().optional(),
            country: zod_1.z.string().optional()
        }).optional(),
        emergencyContact: zod_1.z.object({
            name: zod_1.z.string(),
            relationship: zod_1.z.string(),
            phone: zod_1.z.string()
        }).optional(),
        bloodType: zod_1.z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
        medicalConditions: zod_1.z.array(zod_1.z.string()).optional(),
        currentMedications: zod_1.z.array(zod_1.z.string()).optional(),
        allergies: zod_1.z.array(zod_1.z.string()).optional(),
        assignedDoctor: zod_1.z.string().optional()
    }),
    update: zod_1.z.object({
        firstName: zod_1.z.string().min(1).optional(),
        lastName: zod_1.z.string().min(1).optional(),
        phone: zod_1.z.string().optional(),
        address: zod_1.z.object({
            street: zod_1.z.string().optional(),
            city: zod_1.z.string().optional(),
            state: zod_1.z.string().optional(),
            zipCode: zod_1.z.string().optional(),
            country: zod_1.z.string().optional()
        }).optional(),
        emergencyContact: zod_1.z.object({
            name: zod_1.z.string().optional(),
            relationship: zod_1.z.string().optional(),
            phone: zod_1.z.string().optional()
        }).optional(),
        bloodType: zod_1.z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
        assignedDoctor: zod_1.z.string().optional()
    }),
    addMedicalCondition: zod_1.z.object({
        condition: zod_1.z.string().min(1, 'Condition is required')
    }),
    removeMedicalCondition: zod_1.z.object({
        condition: zod_1.z.string().min(1, 'Condition is required')
    }),
    addMedication: zod_1.z.object({
        medication: zod_1.z.string().min(1, 'Medication is required')
    }),
    removeMedication: zod_1.z.object({
        medication: zod_1.z.string().min(1, 'Medication is required')
    }),
    addAllergy: zod_1.z.object({
        allergy: zod_1.z.string().min(1, 'Allergy is required')
    }),
    removeAllergy: zod_1.z.object({
        allergy: zod_1.z.string().min(1, 'Allergy is required')
    })
};
exports.TestZodSchema = {
    create: zod_1.z.object({
        name: zod_1.z.string().min(1, 'Test name is required'),
        code: zod_1.z.string().min(1, 'Test code is required'),
        category: zod_1.z.string().min(1, 'Category is required'),
        department: zod_1.z.string().min(1, 'Department is required'),
        description: zod_1.z.string().optional(),
        specimen: zod_1.z.string().min(1, 'Specimen type is required'),
        price: zod_1.z.number().min(0, 'Price must be positive'),
        normalRange: zod_1.z.object({
            min: zod_1.z.number().optional(),
            max: zod_1.z.number().optional(),
            unit: zod_1.z.string().optional(),
            gender: zod_1.z.enum(['male', 'female', 'both']).default('both'),
            ageRange: zod_1.z.object({
                min: zod_1.z.number().optional(),
                max: zod_1.z.number().optional()
            }).optional(),
            text: zod_1.z.string().optional()
        }).optional(),
        testParameters: zod_1.z.array(zod_1.z.object({
            name: zod_1.z.string(),
            unit: zod_1.z.string().optional(),
            normalRange: zod_1.z.object({
                min: zod_1.z.number().optional(),
                max: zod_1.z.number().optional(),
                text: zod_1.z.string().optional()
            }).optional()
        })).optional(),
        turnaroundTime: zod_1.z.number().min(1).optional(),
        isActive: zod_1.z.boolean().default(true)
    }),
    update: zod_1.z.object({
        name: zod_1.z.string().min(1).optional(),
        category: zod_1.z.string().min(1).optional(),
        department: zod_1.z.string().min(1).optional(),
        description: zod_1.z.string().optional(),
        specimen: zod_1.z.string().min(1).optional(),
        price: zod_1.z.number().min(0).optional(),
        normalRange: zod_1.z.object({
            min: zod_1.z.number().optional(),
            max: zod_1.z.number().optional(),
            unit: zod_1.z.string().optional(),
            gender: zod_1.z.enum(['male', 'female', 'both']).optional(),
            ageRange: zod_1.z.object({
                min: zod_1.z.number().optional(),
                max: zod_1.z.number().optional()
            }).optional(),
            text: zod_1.z.string().optional()
        }).optional(),
        testParameters: zod_1.z.array(zod_1.z.object({
            name: zod_1.z.string(),
            unit: zod_1.z.string().optional(),
            normalRange: zod_1.z.object({
                min: zod_1.z.number().optional(),
                max: zod_1.z.number().optional(),
                text: zod_1.z.string().optional()
            }).optional()
        })).optional(),
        turnaroundTime: zod_1.z.number().min(1).optional(),
        isActive: zod_1.z.boolean().optional()
    }),
    updatePrice: zod_1.z.object({
        price: zod_1.z.number().min(0, 'Price must be positive')
    }),
    addParameter: zod_1.z.object({
        name: zod_1.z.string().min(1, 'Parameter name is required'),
        unit: zod_1.z.string().optional(),
        normalRange: zod_1.z.object({
            min: zod_1.z.number().optional(),
            max: zod_1.z.number().optional(),
            text: zod_1.z.string().optional()
        }).optional()
    }),
    updateParameter: zod_1.z.object({
        name: zod_1.z.string().min(1).optional(),
        unit: zod_1.z.string().optional(),
        normalRange: zod_1.z.object({
            min: zod_1.z.number().optional(),
            max: zod_1.z.number().optional(),
            text: zod_1.z.string().optional()
        }).optional()
    }),
    priceRange: zod_1.z.object({
        minPrice: zod_1.z.string(),
        maxPrice: zod_1.z.string()
    }),
    bulkUpdatePrices: zod_1.z.object({
        updates: zod_1.z.array(zod_1.z.object({
            testId: zod_1.z.string(),
            newPrice: zod_1.z.number().min(0)
        }))
    }),
    duplicate: zod_1.z.object({
        newName: zod_1.z.string().min(1, 'New name is required'),
        newCode: zod_1.z.string().min(1, 'New code is required')
    })
};
exports.OrderZodSchema = {
    create: zod_1.z.object({
        patientId: zod_1.z.string().min(1, 'Patient ID is required'),
        orderedBy: zod_1.z.string().min(1, 'Ordering doctor/user ID is required'),
        tests: zod_1.z.array(zod_1.z.object({
            testId: zod_1.z.string().min(1, 'Test ID is required'),
            price: zod_1.z.number().min(0, 'Price must be positive').optional()
        })).min(1, 'At least one test is required'),
        priority: zod_1.z.enum(['routine', 'urgent', 'stat']).default('routine'),
        clinicalNotes: zod_1.z.string().optional(),
        specimen: zod_1.z.object({
            type: zod_1.z.string().min(1, 'Specimen type is required'),
            collectionDate: zod_1.z.string().datetime().optional(),
            collectedBy: zod_1.z.string().optional(),
            notes: zod_1.z.string().optional()
        }).optional(),
        insuranceInfo: zod_1.z.object({
            provider: zod_1.z.string().optional(),
            policyNumber: zod_1.z.string().optional(),
            preAuthNumber: zod_1.z.string().optional()
        }).optional()
    }),
    update: zod_1.z.object({
        clinicalNotes: zod_1.z.string().optional(),
        priority: zod_1.z.enum(['routine', 'urgent', 'stat']).optional(),
        specimen: zod_1.z.object({
            type: zod_1.z.string().optional(),
            collectionDate: zod_1.z.string().datetime().optional(),
            collectedBy: zod_1.z.string().optional(),
            notes: zod_1.z.string().optional()
        }).optional(),
        insuranceInfo: zod_1.z.object({
            provider: zod_1.z.string().optional(),
            policyNumber: zod_1.z.string().optional(),
            preAuthNumber: zod_1.z.string().optional()
        }).optional()
    }),
    updateStatus: zod_1.z.object({
        status: zod_1.z.enum(['pending', 'sample_collected', 'in_progress', 'completed', 'cancelled']),
        notes: zod_1.z.string().optional()
    }),
    cancel: zod_1.z.object({
        reason: zod_1.z.string().min(1, 'Cancellation reason is required'),
        cancelledBy: zod_1.z.string().min(1, 'User ID is required')
    }),
    addTest: zod_1.z.object({
        testId: zod_1.z.string().min(1, 'Test ID is required'),
        price: zod_1.z.number().min(0, 'Price must be positive').optional()
    }),
    updatePayment: zod_1.z.object({
        status: zod_1.z.enum(['pending', 'partial', 'paid', 'overdue']),
        amount: zod_1.z.number().min(0, 'Payment amount must be positive').optional(),
        method: zod_1.z.enum(['cash', 'card', 'insurance', 'other']).optional(),
        transactionId: zod_1.z.string().optional(),
        notes: zod_1.z.string().optional()
    })
};
exports.ResultZodSchema = {
    create: zod_1.z.object({
        orderId: zod_1.z.string().min(1, 'Order ID is required'),
        testId: zod_1.z.string().min(1, 'Test ID is required'),
        performedBy: zod_1.z.string().min(1, 'Technician ID is required'),
        resultData: zod_1.z.record(zod_1.z.any()),
        status: zod_1.z.enum(['pending', 'in_progress', 'completed', 'failed', 'cancelled']).default('pending'),
        notes: zod_1.z.string().optional(),
        equipment: zod_1.z.string().optional(),
        qualityControl: zod_1.z.object({
            passed: zod_1.z.boolean(),
            notes: zod_1.z.string().optional(),
            reviewedBy: zod_1.z.string().optional()
        }).optional()
    }),
    update: zod_1.z.object({
        resultData: zod_1.z.record(zod_1.z.any()).optional(),
        status: zod_1.z.enum(['pending', 'in_progress', 'completed', 'failed', 'cancelled']).optional(),
        notes: zod_1.z.string().optional(),
        equipment: zod_1.z.string().optional(),
        qualityControl: zod_1.z.object({
            passed: zod_1.z.boolean(),
            notes: zod_1.z.string().optional(),
            reviewedBy: zod_1.z.string().optional()
        }).optional()
    }),
    addParameter: zod_1.z.object({
        name: zod_1.z.string().min(1, 'Parameter name is required'),
        value: zod_1.z.any(),
        unit: zod_1.z.string().optional(),
        normalRange: zod_1.z.string().optional(),
        flag: zod_1.z.enum(['normal', 'high', 'low', 'critical']).optional()
    }),
    approve: zod_1.z.object({
        approvedBy: zod_1.z.string().min(1, 'Approver ID is required'),
        notes: zod_1.z.string().optional()
    }),
    reject: zod_1.z.object({
        rejectedBy: zod_1.z.string().min(1, 'Rejecter ID is required'),
        reason: zod_1.z.string().min(1, 'Rejection reason is required'),
        notes: zod_1.z.string().optional()
    })
};
exports.ReportZodSchema = {
    create: zod_1.z.object({
        patientId: zod_1.z.string().min(1, 'Patient ID is required'),
        orderId: zod_1.z.string().min(1, 'Order ID is required'),
        template: zod_1.z.string().min(1, 'Report template is required'),
        generatedBy: zod_1.z.string().min(1, 'Generator ID is required'),
        format: zod_1.z.enum(['pdf', 'html', 'json']).default('pdf'),
        includeGraphs: zod_1.z.boolean().default(false),
        includeComparison: zod_1.z.boolean().default(false),
        customNotes: zod_1.z.string().optional()
    }),
    update: zod_1.z.object({
        template: zod_1.z.string().optional(),
        customNotes: zod_1.z.string().optional(),
        includeGraphs: zod_1.z.boolean().optional(),
        includeComparison: zod_1.z.boolean().optional()
    }),
    approve: zod_1.z.object({
        approvedBy: zod_1.z.string().min(1, 'Approver ID is required'),
        notes: zod_1.z.string().optional()
    }),
    share: zod_1.z.object({
        recipientEmail: zod_1.z.string().email('Valid email is required'),
        method: zod_1.z.enum(['email', 'sms', 'portal']),
        message: zod_1.z.string().optional(),
        expiresIn: zod_1.z.number().min(1).max(30).default(7)
    })
};
