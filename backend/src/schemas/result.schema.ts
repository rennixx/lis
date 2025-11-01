import mongoose, { Schema, Document, Types } from 'mongoose';

export interface INormalRange {
  min?: number;
  max?: number;
  unit?: string;
  gender?: 'male' | 'female' | 'both';
  ageRange?: {
    min?: number;
    max?: number;
  };
  text?: string;
}

export interface IResult extends Document {
  order: Types.ObjectId;
  orderNumber?: string;
  test: Types.ObjectId;
  testCode?: string;
  testName?: string;
  patient: Types.ObjectId;
  patientName?: string;
  patientMRN?: string;
  value: any; // Mixed type for different result types
  valueType: 'number' | 'text' | 'boolean' | 'array' | 'object';
  normalRange: INormalRange;
  isAbnormal: boolean;
  status: 'pending' | 'in_progress' | 'completed' | 'verified' | 'rejected' | 'requires_review';
  comments?: string;
  notes?: string;
  referenceRange?: string;
  method?: string;
  equipment?: string;
  specimen?: string;
  specimenType?: string;
  collectionDate?: Date;
  analysisDate?: Date;
  verificationDate?: Date;
  enteredBy: Types.ObjectId;
  enteredByUser?: string;
  verifiedBy?: Types.ObjectId;
  verifiedByUser?: string;
  rejectedBy?: Types.ObjectId;
  rejectedReason?: string;
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  attachments?: Types.ObjectId[];
  flags?: string[];
  criticalValue?: boolean;
  criticalValueNotifiedAt?: Date;
  turnaroundTime?: number; // in minutes
  qualityControl?: {
    controlId?: string;
    controlResult?: any;
    accepted?: boolean;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NormalRangeSchema: Schema = new Schema({
  min: {
    type: Number
  },
  max: {
    type: Number
  },
  unit: {
    type: String,
    trim: true
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'both'],
    default: 'both'
  },
  ageRange: {
    min: {
      type: Number
    },
    max: {
      type: Number
    }
  },
  text: {
    type: String,
    trim: true
  }
}, { _id: false });

const ResultSchema: Schema = new Schema({
  order: {
    type: Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    index: true
  },
  orderNumber: {
    type: String,
    trim: true
  },
  test: {
    type: Schema.Types.ObjectId,
    ref: 'Test',
    required: true,
    index: true
  },
  testCode: {
    type: String,
    trim: true,
    index: true
  },
  testName: {
    type: String,
    trim: true
  },
  patient: {
    type: Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
    index: true
  },
  patientName: {
    type: String,
    trim: true
  },
  patientMRN: {
    type: String,
    trim: true
  },
  value: {
    type: Schema.Types.Mixed,
    required: true
  },
  valueType: {
    type: String,
    enum: ['number', 'text', 'boolean', 'array', 'object'],
    required: true
  },
  normalRange: {
    type: NormalRangeSchema,
    default: {}
  },
  isAbnormal: {
    type: Boolean,
    default: false,
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'verified', 'rejected', 'requires_review'],
    default: 'pending',
    index: true
  },
  comments: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  referenceRange: {
    type: String,
    trim: true
  },
  method: {
    type: String,
    trim: true
  },
  equipment: {
    type: String,
    trim: true
  },
  specimen: {
    type: String,
    trim: true
  },
  specimenType: {
    type: String,
    trim: true
  },
  collectionDate: {
    type: Date
  },
  analysisDate: {
    type: Date
  },
  verificationDate: {
    type: Date
  },
  enteredBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  enteredByUser: {
    type: String
  },
  verifiedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  verifiedByUser: {
    type: String
  },
  rejectedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectedReason: {
    type: String,
    trim: true,
    maxlength: 500
  },
  reviewedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  attachments: [{
    type: Schema.Types.ObjectId,
    ref: 'Attachment'
  }],
  flags: [{
    type: String,
    trim: true
  }],
  criticalValue: {
    type: Boolean,
    default: false,
    index: true
  },
  criticalValueNotifiedAt: {
    type: Date
  },
  turnaroundTime: {
    type: Number
  },
  qualityControl: {
    controlId: {
      type: String,
      trim: true
    },
    controlResult: {
      type: Schema.Types.Mixed
    },
    accepted: {
      type: Boolean,
      default: true
    }
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
ResultSchema.index({ order: 1, test: 1 }, { unique: true });
ResultSchema.index({ patient: 1, test: 1, createdAt: -1 });
ResultSchema.index({ status: 1, createdAt: -1 });
ResultSchema.index({ enteredBy: 1, createdAt: -1 });
ResultSchema.index({ verifiedBy: 1, verificationDate: -1 });
ResultSchema.index({ criticalValue: 1, createdAt: -1 });
ResultSchema.index({ isAbnormal: 1, createdAt: -1 });
ResultSchema.index({ specimenType: 1, createdAt: -1 });

// Virtuals
ResultSchema.virtual('isOverdue').get(function() {
  // @ts-ignore
  if (this.status === 'pending' || this.status === 'in_progress') {
    // @ts-ignore
    const expectedTime = new Date((this.createdAt as any).getTime() + ((this.turnaroundTime as any) || 1440) * 60000); // Default 24 hours
    return new Date() > expectedTime;
  }
  return false;
});

// Pre-save middleware
ResultSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      // Populate related fields
      const Order = mongoose.model('Order');
      const Test = mongoose.model('Test');
      const Patient = mongoose.model('Patient');

      if (this.order) {
        const order = await Order.findById(this.order);
        if (order) {
          this.orderNumber = order.orderNumber;
          this.patient = order.patient;
        }
      }

      if (this.test) {
        const test = await Test.findById(this.test);
        if (test) {
          this.testName = test.name;
          this.testCode = test.code;
          if (!this.normalRange || Object.keys(this.normalRange).length === 0) {
            this.normalRange = test.normalRange || {};
          }
          this.turnaroundTime = test.turnaroundTime;
        }
      }

      if (this.patient) {
        const patient = await Patient.findById(this.patient);
        if (patient) {
          this.patientName = `${patient.firstName} ${patient.lastName}`;
          this.patientMRN = patient.mrn;
        }
      }
    } catch (error) {
      // Handle error silently or log it
    }
  }

  // Check if result is abnormal
  if (this.isModified('value') && this.valueType === 'number' && this.normalRange) {
      // @ts-ignore
    this.isAbnormal = (this.checkIfAbnormal as any)();
  }

  next();
});

// Methods
ResultSchema.methods.checkIfAbnormal = function(): boolean {
  if (this.valueType !== 'number' || !this.normalRange) {
    return false;
  }

  const value = parseFloat(this.value);
  if (isNaN(value)) {
    return false;
  }

  if (this.normalRange.min !== undefined && value < this.normalRange.min) {
    return true;
  }

  if (this.normalRange.max !== undefined && value > this.normalRange.max) {
    return true;
  }

  return false;
};

ResultSchema.methods.markAsVerified = function(verifiedBy: Types.ObjectId, verifiedByUser: string) {
  this.status = 'verified';
  this.verifiedBy = verifiedBy;
  this.verifiedByUser = verifiedByUser;
  this.verificationDate = new Date();
};

ResultSchema.methods.markAsRejected = function(rejectedBy: Types.ObjectId, reason: string) {
  this.status = 'rejected';
  this.rejectedBy = rejectedBy;
  this.rejectedReason = reason;
};

ResultSchema.methods.markAsCritical = function() {
  this.criticalValue = true;
  this.criticalValueNotifiedAt = new Date();
};

export const Result = mongoose.model<IResult>('Result', ResultSchema);