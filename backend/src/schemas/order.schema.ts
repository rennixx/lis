import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IOrderItem {
  testId: Types.ObjectId;
  testName: string;
  testCode: string;
  price: number;
  quantity?: number;
}

export interface IOrder extends Document {
  orderNumber: string;
  patient: Types.ObjectId;
  patientName?: string;
  patientMRN?: string;
  tests: Types.ObjectId[];
  samples: Types.ObjectId[];
  orderItems: IOrderItem[];
  status: 'pending' | 'processing' | 'sample_collected' | 'completed' | 'cancelled';
  priority: 'routine' | 'urgent' | 'stat' | 'critical';
  totalAmount: number;
  discountAmount?: number;
  finalAmount?: number;
  paymentStatus: 'pending' | 'paid' | 'partial' | 'refunded';
  orderedBy: Types.ObjectId;
  orderedByUser?: string;
  department?: string;
  clinicalInformation?: string;
  doctorName?: string;
  doctorId?: Types.ObjectId;
  sampleCollectedAt?: Date;
  collectedBy?: Types.ObjectId;
  completedAt?: Date;
  expectedDeliveryTime?: Date;
  notes?: string;
  lastModifiedBy?: Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema: Schema = new Schema({
  testId: {
    type: Schema.Types.ObjectId,
    ref: 'Test',
    required: true
  },
  testName: {
    type: String,
    required: true
  },
  testCode: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    default: 1,
    min: 1
  }
}, { _id: false });

const OrderSchema: Schema = new Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true
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
  tests: [{
    type: Schema.Types.ObjectId,
    ref: 'Test'
  }],
  samples: [{
    type: Schema.Types.ObjectId,
    ref: 'Sample'
  }],
  orderItems: [OrderItemSchema],
  status: {
    type: String,
    enum: ['pending', 'processing', 'sample_collected', 'completed', 'cancelled'],
    default: 'pending',
    index: true
  },
  priority: {
    type: String,
    enum: ['routine', 'urgent', 'stat', 'critical'],
    default: 'routine',
    index: true
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  discountAmount: {
    type: Number,
    min: 0,
    default: 0
  },
  finalAmount: {
    type: Number,
    min: 0
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'partial', 'refunded'],
    default: 'pending',
    index: true
  },
  orderedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  orderedByUser: {
    type: String
  },
  department: {
    type: String,
    trim: true
  },
  clinicalInformation: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  doctorName: {
    type: String,
    trim: true
  },
  doctorId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  sampleCollectedAt: {
    type: Date
  },
  collectedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  completedAt: {
    type: Date
  },
  expectedDeliveryTime: {
    type: Date
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  lastModifiedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
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

// Indexes (orderNumber index is automatically created by unique: true)
OrderSchema.index({ patient: 1, createdAt: -1 });
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ priority: 1, createdAt: -1 });
OrderSchema.index({ orderedBy: 1, createdAt: -1 });
OrderSchema.index({ department: 1, createdAt: -1 });
OrderSchema.index({ doctorId: 1, createdAt: -1 });

// Virtuals
OrderSchema.virtual('duration').get(function() {
  // @ts-ignore
  if (this.completedAt && this.createdAt) {
    // @ts-ignore
    return (this.completedAt as any).getTime() - (this.createdAt as any).getTime();
  }
  return null;
});

OrderSchema.virtual('isOverdue').get(function() {
  if (this.expectedDeliveryTime && this.status !== 'completed' && this.status !== 'cancelled') {
    return new Date() > this.expectedDeliveryTime;
  }
  return false;
});

// Pre-save middleware
OrderSchema.pre('save', async function(next) {
  if (this.isNew && this.patient) {
    try {
      const Patient = mongoose.model('Patient');
      const patient = await Patient.findById(this.patient);
      if (patient) {
        this.patientName = `${patient.firstName} ${patient.lastName}`;
        this.patientMRN = patient.mrn;
      }
    } catch (error) {
      // Handle error silently or log it
    }
  }
  next();
});

// Methods
OrderSchema.methods.calculateTotal = function() {
  this.totalAmount = this.orderItems.reduce((total: number, item: IOrderItem) => {
    return total + (item.price * (item.quantity || 1));
  }, 0);
  this.finalAmount = this.totalAmount - (this.discountAmount || 0);
  return this.finalAmount;
};

OrderSchema.methods.markAsCompleted = function() {
  this.status = 'completed';
  this.completedAt = new Date();
};

OrderSchema.methods.markSampleCollected = function(collectedBy?: Types.ObjectId) {
  this.status = 'sample_collected';
  this.sampleCollectedAt = new Date();
  if (collectedBy) {
    this.collectedBy = collectedBy;
  }
};

export const Order = mongoose.model<IOrder>('Order', OrderSchema);