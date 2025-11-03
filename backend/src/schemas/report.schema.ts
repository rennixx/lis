import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IReportSection {
  title: string;
  content: string;
  order: number;
  type: 'text' | 'table' | 'chart' | 'image';
  data?: any;
}

export interface IReport extends Document {
  reportNumber: string;
  order: Types.ObjectId;
  orderNumber?: string;
  patient: Types.ObjectId;
  patientName?: string;
  patientMRN?: string;
  patientInfo?: {
    name: string;
    age: number;
    gender: string;
    contact: string;
  };
  doctor: Types.ObjectId;
  doctorName?: string;
  tests: Types.ObjectId[];
  results: Types.ObjectId[];
  type: 'preliminary' | 'final' | 'amended' | 'corrected';
  status: 'draft' | 'pending_review' | 'approved' | 'rejected' | 'delivered' | 'archived';
  sections: IReportSection[];
  summary?: string;
  conclusion?: string;
  recommendations?: string;
  clinicalNotes?: string;
  generatedBy: Types.ObjectId;
  generatedByUser?: string;
  approvedBy?: Types.ObjectId;
  approvedByUser?: string;
  approvedAt?: Date;
  deliveredBy?: Types.ObjectId;
  deliveredAt?: Date;
  deliveryMethod?: 'email' | 'print' | 'portal' | 'fax';
  emailSentTo?: string;
  printedCopies?: number;
  pdfPath?: string;
  // GridFS storage for PDF
  pdfFileId?: Types.ObjectId;
  pdfFileName?: string;
  pdfFileSize?: number;
  // Report generation metadata
  reportGeneration?: {
    generatedAt?: Date;
    pdfVersion?: string;
    generationTime?: number;
    templateUsed?: string;
  };
  template?: string;
  version: number;
  previousVersion?: Types.ObjectId;
  nextVersion?: Types.ObjectId;
  amendments?: {
    date: Date;
    reason: string;
    amendedBy: Types.ObjectId;
    changes: string;
  }[];
  auditTrail?: {
    action: string;
    performedBy: Types.ObjectId;
    performedAt: Date;
    details?: string;
  }[];
  tags?: string[];
  priority: 'routine' | 'urgent' | 'stat';
  confidentialityLevel: 'standard' | 'confidential' | 'restricted';
  retentionPeriod?: number; // in months
  archivedAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ReportSectionSchema: Schema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  order: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['text', 'table', 'chart', 'image'],
    default: 'text'
  },
  data: {
    type: Schema.Types.Mixed
  }
}, { _id: false });

const AmendmentSchema: Schema = new Schema({
  date: {
    type: Date,
    required: true
  },
  reason: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  amendedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  changes: {
    type: String,
    required: true,
    trim: true
  }
}, { _id: false });

const AuditTrailSchema: Schema = new Schema({
  action: {
    type: String,
    required: true,
    trim: true
  },
  performedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  performedAt: {
    type: Date,
    default: Date.now
  },
  details: {
    type: String,
    trim: true,
    maxlength: 1000
  }
}, { _id: false });

const ReportSchema: Schema = new Schema({
  reportNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
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
  patientInfo: {
    name: {
      type: String,
      trim: true
    },
    age: {
      type: Number
    },
    gender: {
      type: String,
      trim: true
    },
    contact: {
      type: String,
      trim: true
    }
  },
  doctor: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  doctorName: {
    type: String,
    trim: true
  },
  tests: [{
    type: Schema.Types.ObjectId,
    ref: 'Test'
  }],
  results: [{
    type: Schema.Types.ObjectId,
    ref: 'Result'
  }],
  type: {
    type: String,
    enum: ['preliminary', 'final', 'amended', 'corrected'],
    default: 'final',
    index: true
  },
  status: {
    type: String,
    enum: ['draft', 'pending_review', 'approved', 'rejected', 'delivered', 'archived'],
    default: 'draft',
    index: true
  },
  sections: [ReportSectionSchema],
  summary: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  conclusion: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  recommendations: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  clinicalNotes: {
    type: String,
    trim: true,
    maxlength: 3000
  },
  generatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  generatedByUser: {
    type: String
  },
  approvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  approvedByUser: {
    type: String
  },
  approvedAt: {
    type: Date
  },
  deliveredBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  deliveredAt: {
    type: Date
  },
  deliveryMethod: {
    type: String,
    enum: ['email', 'print', 'portal', 'fax']
  },
  emailSentTo: {
    type: String,
    trim: true
  },
  printedCopies: {
    type: Number,
    default: 0,
    min: 0
  },
  pdfPath: {
    type: String,
    trim: true
  },
  // GridFS storage for PDF
  pdfFileId: {
    type: Schema.Types.ObjectId,
    ref: 'fs.files'
  },
  pdfFileName: {
    type: String,
    trim: true
  },
  pdfFileSize: {
    type: Number
  },
  // Report generation metadata
  reportGeneration: {
    generatedAt: Date,
    pdfVersion: {
      type: String,
      default: '1.0'
    },
    generationTime: Number, // in milliseconds
    templateUsed: {
      type: String,
      default: 'standard'
    }
  },
  template: {
    type: String,
    trim: true,
    default: 'standard'
  },
  version: {
    type: Number,
    default: 1,
    min: 1
  },
  previousVersion: {
    type: Schema.Types.ObjectId,
    ref: 'Report'
  },
  nextVersion: {
    type: Schema.Types.ObjectId,
    ref: 'Report'
  },
  amendments: [AmendmentSchema],
  auditTrail: [AuditTrailSchema],
  tags: [{
    type: String,
    trim: true
  }],
  priority: {
    type: String,
    enum: ['routine', 'urgent', 'stat'],
    default: 'routine'
  },
  confidentialityLevel: {
    type: String,
    enum: ['standard', 'confidential', 'restricted'],
    default: 'standard'
  },
  retentionPeriod: {
    type: Number,
    min: 1,
    max: 240 // Max 20 years
  },
  archivedAt: {
    type: Date
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
ReportSchema.index({ reportNumber: 1 }, { unique: true });
ReportSchema.index({ order: 1, version: -1 });
ReportSchema.index({ patient: 1, createdAt: -1 });
ReportSchema.index({ doctor: 1, createdAt: -1 });
ReportSchema.index({ status: 1, createdAt: -1 });
ReportSchema.index({ type: 1, createdAt: -1 });
ReportSchema.index({ generatedBy: 1, createdAt: -1 });
ReportSchema.index({ approvedBy: 1, approvedAt: -1 });
ReportSchema.index({ confidentialityLevel: 1, createdAt: -1 });

// Virtuals
ReportSchema.virtual('isEditable').get(function() {
  return this.status === 'draft' || this.status === 'rejected';
});

ReportSchema.virtual('isApprovable').get(function() {
  return this.status === 'pending_review';
});

ReportSchema.virtual('isDeliverable').get(function() {
  return this.status === 'approved';
});

ReportSchema.virtual('isArchivable').get(function() {
  return this.status === 'delivered' && !this.archivedAt;
});

// Pre-save middleware
ReportSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      // Populate related fields
      const Order = mongoose.model('Order');
      const Patient = mongoose.model('Patient');
      const User = mongoose.model('User');

      if (this.order) {
        const order = await Order.findById(this.order);
        if (order) {
          this.orderNumber = order.orderNumber;
          this.doctor = order.doctorId;
          this.tests = order.tests;
        }
      }

      if (this.patient) {
        const patient = await Patient.findById(this.patient);
        if (patient) {
          this.patientName = `${patient.firstName} ${patient.lastName}`;
          this.patientMRN = patient.mrn;
          this.patientInfo = {
            name: this.patientName,
            age: patient.age,
            gender: patient.gender,
            contact: patient.phone || patient.email
          };
        }
      }

      if (this.doctor) {
        const doctor = await User.findById(this.doctor);
        if (doctor) {
          this.doctorName = `${doctor.firstName} ${doctor.lastName}`;
        }
      }

      // Add audit trail entry
      // @ts-ignore
      this.auditTrail = this.auditTrail || [];
      // @ts-ignore
      (this.auditTrail as any).push({
        action: 'created',
        performedBy: this.generatedBy,
        performedAt: new Date()
      });
    } catch (error) {
      // Handle error silently or log it
    }
  }
  next();
});

// Methods
ReportSchema.methods.approve = function(approvedBy: Types.ObjectId, approvedByUser: string) {
  this.status = 'approved';
  this.approvedBy = approvedBy;
  this.approvedByUser = approvedByUser;
  this.approvedAt = new Date();

  this.auditTrail = this.auditTrail || [];
  this.auditTrail.push({
    action: 'approved',
    performedBy: approvedBy,
    performedAt: new Date()
  });
};

ReportSchema.methods.deliver = function(deliveredBy: Types.ObjectId, method: string) {
  this.status = 'delivered';
  this.deliveredBy = deliveredBy;
  this.deliveredAt = new Date();
  this.deliveryMethod = method;

  this.auditTrail = this.auditTrail || [];
  this.auditTrail.push({
    action: 'delivered',
    performedBy: deliveredBy,
    performedAt: new Date(),
    details: `Delivery method: ${method}`
  });
};

ReportSchema.methods.reject = function(rejectedBy: Types.ObjectId, reason: string) {
  this.status = 'rejected';

  this.auditTrail = this.auditTrail || [];
  this.auditTrail.push({
    action: 'rejected',
    performedBy: rejectedBy,
    performedAt: new Date(),
    details: reason
  });
};

ReportSchema.methods.amend = function(amendedBy: Types.ObjectId, reason: string, changes: string) {
  this.amendments = this.amendments || [];
  this.amendments.push({
    date: new Date(),
    reason,
    amendedBy,
    changes
  });

  this.version += 1;

  this.auditTrail = this.auditTrail || [];
  this.auditTrail.push({
    action: 'amended',
    performedBy: amendedBy,
    performedAt: new Date(),
    details: reason
  });
};

ReportSchema.methods.archive = function() {
  this.status = 'archived';
  this.archivedAt = new Date();

  this.auditTrail = this.auditTrail || [];
  this.auditTrail.push({
    action: 'archived',
    performedBy: this.generatedBy,
    performedAt: new Date()
  });
};

export const Report = mongoose.model<IReport>('Report', ReportSchema);