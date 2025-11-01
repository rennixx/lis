import { Document, Types } from 'mongoose';

export interface IUser extends Document {
  _id: Types.ObjectId;
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'doctor' | 'lab_technician' | 'nurse' | 'receptionist';
  refreshTokens: string[];
  lastLogin?: Date;
  isActive: boolean;
  isEmailVerified: boolean;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  specialization?: string;
  department?: string;
  licenseNumber?: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface IPatient extends Document {
  _id: Types.ObjectId;
  patientId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
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
    diagnosisDate: Date;
    medications: string[];
  }>;
  allergies: string[];
  testHistory: Types.ObjectId[];
  assignedDoctor?: Types.ObjectId | string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITest extends Document {
  _id: Types.ObjectId;
  code: string;
  name: string;
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
  createdAt: Date;
  updatedAt: Date;
}

export interface IOrder extends Document {
  _id: Types.ObjectId;
  orderNumber: string;
  patient: Types.ObjectId;
  doctorId?: Types.ObjectId;
  orderItems: Array<{
    testId: Types.ObjectId;
    price?: number;
  }>;
  status: 'pending' | 'sample_collected' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'routine' | 'urgent' | 'stat';
  clinicalNotes?: string;
  specimen?: {
    type?: string;
    collectionDate?: Date;
    collectedBy?: string;
    notes?: string;
  };
  insuranceInfo?: {
    provider?: string;
    policyNumber?: string;
    preAuthNumber?: string;
  };
  paymentStatus: 'pending' | 'partial' | 'paid' | 'overdue';
  totalAmount: number;
  discount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IResult extends Document {
  _id: Types.ObjectId;
  order: Types.ObjectId;
  test: Types.ObjectId;
  patient: Types.ObjectId;
  value: any; // Mixed type for different result types
  normalRange?: {
    min?: number;
    max?: number;
    unit?: string;
    text?: string;
  };
  interpretation?: 'normal' | 'low' | 'high' | 'critical' | 'borderline';
  isAbnormal: boolean;
  notes?: string;
  enteredBy: Types.ObjectId;
  verifiedBy?: Types.ObjectId;
  verifiedAt?: Date;
  testCompletedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IReport extends Document {
  _id: Types.ObjectId;
  reportNumber: string;
  patient: Types.ObjectId;
  patientName?: string; // denormalized
  orders: Types.ObjectId[];
  results: Types.ObjectId[];
  type: 'preliminary' | 'final' | 'amended';
  summary?: string;
  conclusion?: string;
  recommendations: string[];
  generatedBy: Types.ObjectId;
  status: 'draft' | 'generated' | 'sent' | 'delivered';
  deliveryMethod?: 'email' | 'patient_portal' | 'print' | 'phone';
  sentAt?: Date;
  deliveredAt?: Date;
  filePath?: string;
  isAbnormal: boolean;
  requiresFollowUp: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICounter extends Document {
  _id: Types.ObjectId;
  name: string;
  value: number;
  createdAt: Date;
  updatedAt: Date;
}

export type IUserDocument = IUser;
export type IPatientDocument = IPatient;
export type ITestDocument = ITest;
export type IOrderDocument = IOrder;
export type IResultDocument = IResult;
export type IReportDocument = IReport;
export type ICounterDocument = ICounter;