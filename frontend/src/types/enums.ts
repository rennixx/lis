// Status enums with display labels
export const ORDER_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'processing', label: 'Processing', color: 'bg-blue-100 text-blue-800' },
  { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' },
] as const;

export const RESULT_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'verified', label: 'Verified', color: 'bg-blue-100 text-blue-800' },
  { value: 'approved', label: 'Approved', color: 'bg-green-100 text-green-800' },
] as const;

export const REPORT_STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft', color: 'bg-gray-100 text-gray-800' },
  { value: 'generated', label: 'Generated', color: 'bg-blue-100 text-blue-800' },
  { value: 'sent', label: 'Sent', color: 'bg-purple-100 text-purple-800' },
  { value: 'delivered', label: 'Delivered', color: 'bg-green-100 text-green-800' },
] as const;

export const TEST_CATEGORY_OPTIONS = [
  { value: 'hematology', label: 'Hematology' },
  { value: 'biochemistry', label: 'Biochemistry' },
  { value: 'microbiology', label: 'Microbiology' },
  { value: 'immunology', label: 'Immunology' },
  { value: 'pathology', label: 'Pathology' },
  { value: 'radiology', label: 'Radiology' },
  { value: 'cardiology', label: 'Cardiology' },
  { value: 'other', label: 'Other' },
] as const;

export const SPECIMEN_TYPE_OPTIONS = [
  { value: 'blood', label: 'Blood' },
  { value: 'urine', label: 'Urine' },
  { value: 'stool', label: 'Stool' },
  { value: 'sputum', label: 'Sputum' },
  { value: 'swab', label: 'Swab' },
  { value: 'csf', label: 'CSF' },
  { value: 'synovial_fluid', label: 'Synovial Fluid' },
  { value: 'other', label: 'Other' },
] as const;

export const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
] as const;

export const USER_ROLE_OPTIONS = [
  { value: 'admin', label: 'Administrator', color: 'bg-purple-100 text-purple-800' },
  { value: 'doctor', label: 'Doctor', color: 'bg-blue-100 text-blue-800' },
  { value: 'lab_technician', label: 'Lab Technician', color: 'bg-green-100 text-green-800' },
  { value: 'nurse', label: 'Nurse', color: 'bg-pink-100 text-pink-800' },
  { value: 'receptionist', label: 'Receptionist', color: 'bg-gray-100 text-gray-800' },
] as const;

export const PRIORITY_OPTIONS = [
  { value: 'routine', label: 'Routine', color: 'bg-gray-100 text-gray-800' },
  { value: 'urgent', label: 'Urgent', color: 'bg-orange-100 text-orange-800' },
  { value: 'stat', label: 'STAT', color: 'bg-red-100 text-red-800' },
] as const;

export const INTERPRETATION_OPTIONS = [
  { value: 'normal', label: 'Normal', color: 'bg-green-100 text-green-800' },
  { value: 'low', label: 'Low', color: 'bg-blue-100 text-blue-800' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
  { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-800' },
  { value: 'borderline', label: 'Borderline', color: 'bg-yellow-100 text-yellow-800' },
] as const;

export const DELIVERY_METHOD_OPTIONS = [
  { value: 'email', label: 'Email' },
  { value: 'patient_portal', label: 'Patient Portal' },
  { value: 'print', label: 'Print' },
  { value: 'phone', label: 'Phone' },
] as const;

export const BLOOD_GROUP_OPTIONS = [
  { value: 'A+', label: 'A+' },
  { value: 'A-', label: 'A-' },
  { value: 'B+', label: 'B+' },
  { value: 'B-', label: 'B-' },
  { value: 'AB+', label: 'AB+' },
  { value: 'AB-', label: 'AB-' },
  { value: 'O+', label: 'O+' },
  { value: 'O-', label: 'O-' },
] as const;

// Date format options
export const DATE_FORMAT_OPTIONS = [
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
] as const;

// Time format options
export const TIME_FORMAT_OPTIONS = [
  { value: '12h', label: '12-hour (AM/PM)' },
  { value: '24h', label: '24-hour' },
] as const;

// Language options
export const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'zh', label: 'Chinese' },
] as const;

// Permission levels
export const PERMISSION_LEVELS = [
  { value: 'read', label: 'Read Only' },
  { value: 'write', label: 'Read & Write' },
  { value: 'admin', label: 'Full Access' },
] as const;

// Time units
export const TIME_UNIT_OPTIONS = [
  { value: 'minutes', label: 'Minutes' },
  { value: 'hours', label: 'Hours' },
  { value: 'days', label: 'Days' },
] as const;

// Export type definitions
export type OrderStatus = typeof ORDER_STATUS_OPTIONS[number]['value'];
export type ResultStatus = typeof RESULT_STATUS_OPTIONS[number]['value'];
export type ReportStatus = typeof REPORT_STATUS_OPTIONS[number]['value'];
export type TestCategory = typeof TEST_CATEGORY_OPTIONS[number]['value'];
export type SpecimenType = typeof SPECIMEN_TYPE_OPTIONS[number]['value'];
export type Gender = typeof GENDER_OPTIONS[number]['value'];
export type UserRole = typeof USER_ROLE_OPTIONS[number]['value'];
export type Priority = typeof PRIORITY_OPTIONS[number]['value'];
export type Interpretation = typeof INTERPRETATION_OPTIONS[number]['value'];
export type DeliveryMethod = typeof DELIVERY_METHOD_OPTIONS[number]['value'];
export type BloodGroup = typeof BLOOD_GROUP_OPTIONS[number]['value'];
export type DateFormat = typeof DATE_FORMAT_OPTIONS[number]['value'];
export type TimeFormat = typeof TIME_FORMAT_OPTIONS[number]['value'];
export type Language = typeof LANGUAGE_OPTIONS[number]['value'];
export type PermissionLevel = typeof PERMISSION_LEVELS[number]['value'];
export type TimeUnit = typeof TIME_UNIT_OPTIONS[number]['value'];