"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MESSAGES = exports.HTTP_STATUS = exports.TIME_UNITS = exports.DELIVERY_METHODS = exports.PRIORITIES = exports.INTERPRETATION = exports.BLOOD_GROUPS = exports.GENDER = exports.SPECIMEN_TYPES = exports.TEST_CATEGORIES = exports.REPORT_STATUS = exports.RESULT_STATUS = exports.ORDER_STATUS = exports.ROLES = void 0;
exports.ROLES = {
    ADMIN: 'admin',
    DOCTOR: 'doctor',
    LAB_TECHNICIAN: 'lab_technician',
    NURSE: 'nurse',
    RECEPTIONIST: 'receptionist',
};
exports.ORDER_STATUS = {
    PENDING: 'pending',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
};
exports.RESULT_STATUS = {
    PENDING: 'pending',
    VERIFIED: 'verified',
    APPROVED: 'approved',
};
exports.REPORT_STATUS = {
    DRAFT: 'draft',
    GENERATED: 'generated',
    SENT: 'sent',
    DELIVERED: 'delivered',
};
exports.TEST_CATEGORIES = {
    HEMATOLOGY: 'hematology',
    BIOCHEMISTRY: 'biochemistry',
    MICROBIOLOGY: 'microbiology',
    IMMUNOLOGY: 'immunology',
    PATHOLOGY: 'pathology',
    RADIOLOGY: 'radiology',
    CARDIOLOGY: 'cardiology',
    OTHER: 'other',
};
exports.SPECIMEN_TYPES = {
    BLOOD: 'blood',
    URINE: 'urine',
    STOOL: 'stool',
    SPUTUM: 'sputum',
    SWAB: 'swab',
    CSF: 'csf',
    SYNOVIAL_FLUID: 'synovial_fluid',
    OTHER: 'other',
};
exports.GENDER = {
    MALE: 'male',
    FEMALE: 'female',
    OTHER: 'other',
};
exports.BLOOD_GROUPS = [
    'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
];
exports.INTERPRETATION = {
    NORMAL: 'normal',
    LOW: 'low',
    HIGH: 'high',
    CRITICAL: 'critical',
    BORDERLINE: 'borderline',
};
exports.PRIORITIES = {
    ROUTINE: 'routine',
    URGENT: 'urgent',
    STAT: 'stat',
};
exports.DELIVERY_METHODS = {
    EMAIL: 'email',
    PATIENT_PORTAL: 'patient_portal',
    PRINT: 'print',
    PHONE: 'phone',
};
exports.TIME_UNITS = {
    MINUTES: 'minutes',
    HOURS: 'hours',
    DAYS: 'days',
};
exports.HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
};
exports.MESSAGES = {
    SUCCESS: 'Operation successful',
    CREATED: 'Resource created successfully',
    UPDATED: 'Resource updated successfully',
    DELETED: 'Resource deleted successfully',
    LOGIN_SUCCESS: 'Login successful',
    LOGOUT_SUCCESS: 'Logout successful',
    REGISTER_SUCCESS: 'User registered successfully',
    EMAIL_VERIFIED: 'Email verified successfully',
    PASSWORD_RESET: 'Password reset successfully',
    NOT_FOUND: 'Resource not found',
    UNAUTHORIZED: 'Unauthorized access',
    FORBIDDEN: 'Access forbidden',
    INVALID_CREDENTIALS: 'Invalid credentials',
    EMAIL_EXISTS: 'Email already exists',
    USERNAME_EXISTS: 'Username already exists',
    VALIDATION_ERROR: 'Validation failed',
    DATABASE_ERROR: 'Database operation failed',
    SERVER_ERROR: 'Internal server error',
    TOKEN_EXPIRED: 'Token has expired',
    TOKEN_INVALID: 'Invalid token',
    ACCESS_DENIED: 'Access denied',
    INSUFFICIENT_PERMISSIONS: 'Insufficient permissions',
    PATIENT_NOT_FOUND: 'Patient not found',
    PATIENT_EXISTS: 'Patient already exists',
    ORDER_NOT_FOUND: 'Order not found',
    ORDER_CANNOT_BE_CANCELLED: 'Order cannot be cancelled',
    RESULT_NOT_FOUND: 'Result not found',
    RESULT_ALREADY_VERIFIED: 'Result already verified',
    RESULT_NOT_APPROVED: 'Result not approved',
    TEST_NOT_FOUND: 'Test not found',
    TEST_EXISTS: 'Test already exists',
    REPORT_NOT_FOUND: 'Report not found',
    REPORT_GENERATED: 'Report generated successfully',
};
