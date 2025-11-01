import mongoose, { Schema, Document, Types } from 'mongoose';
import { IDGenerator } from '../utils/generateID';

// Sample status enumeration
export enum SampleStatus {
  PENDING = 'pending',
  COLLECTED = 'collected',
  IN_PROCESS = 'in_process',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REJECTED = 'rejected',
  EXPIRED = 'expired'
}

// Sample priority enumeration
export enum SamplePriority {
  ROUTINE = 'routine',
  URGENT = 'urgent',
  STAT = 'stat',
  CRITICAL = 'critical'
}

// Sample type enumeration
export enum SampleType {
  BLOOD = 'blood',
  URINE = 'urine',
  SWAB = 'swab',
  TISSUE = 'tissue',
  FLUID = 'fluid',
  STOOL = 'stool',
  SPUTUM = 'sputum',
  OTHER = 'other'
}

// Collection method enumeration
export enum CollectionMethod {
  VENIPUNCTURE = 'venipuncture',
  CATHETER = 'catheter',
  LUMBAR_PUNCTURE = 'lumbar_puncture',
  SWAB = 'swab',
  VOIDED = 'voided',
  BIOPSY = 'biopsy',
  OTHER = 'other'
}

// Interface for Sample document
export interface ISample extends Document {
  // Identification
  sampleId: string;
  barcode: string;
  order: Types.ObjectId;
  patient: Types.ObjectId;
  tests: Types.ObjectId[];

  // Sample information
  sampleType: SampleType;
  containerType: string;
  volume: number;
  volumeUnit: string;

  // Collection details
  collectionStatus: SampleStatus;
  priority: SamplePriority;
  collectionMethod: CollectionMethod;
  scheduledCollectionTime?: Date;
  actualCollectionTime?: Date;
  collectedBy?: Types.ObjectId;
  collectionNotes?: string;

  // Processing details
  receivedTime?: Date;
  receivedBy?: Types.ObjectId;
  processingStartTime?: Date;
  processingEndTime?: Date;
  processedBy?: Types.ObjectId;

  // Quality control
  qualityChecks: {
    checkType: string;
    result: 'pass' | 'fail' | 'warning';
    notes?: string;
    checkedBy: Types.ObjectId;
    checkedAt: Date;
  }[];

  // Storage information
  storageLocation?: string;
  storageTemperature?: number;
  storageConditions?: string;
  expiryDate?: Date;

  // Status tracking
  statusHistory: {
    status: SampleStatus;
    changedBy: Types.ObjectId;
    changedAt: Date;
    notes?: string;
  }[];

  // Rejection information
  rejectionReason?: string;
  rejectedBy?: Types.ObjectId;
  rejectedAt?: Date;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: Types.ObjectId;
  lastModifiedBy?: Types.ObjectId;
}

// Sample schema definition
const SampleSchema = new Schema<ISample>({
  // Identification
  sampleId: {
    type: String,
    required: true,
    unique: true
  },
  barcode: {
    type: String,
    required: true,
    unique: true
  },
  order: {
    type: Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    index: true
  },
  patient: {
    type: Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
    index: true
  },
  tests: [{
    type: Schema.Types.ObjectId,
    ref: 'Test',
    required: true
  }],

  // Sample information
  sampleType: {
    type: String,
    enum: Object.values(SampleType),
    required: true
  },
  containerType: {
    type: String,
    required: true
  },
  volume: {
    type: Number,
    required: true,
    min: 0
  },
  volumeUnit: {
    type: String,
    required: true,
    default: 'ml'
  },

  // Collection details
  collectionStatus: {
    type: String,
    enum: Object.values(SampleStatus),
    default: SampleStatus.PENDING,
    index: true
  },
  priority: {
    type: String,
    enum: Object.values(SamplePriority),
    default: SamplePriority.ROUTINE,
    index: true
  },
  collectionMethod: {
    type: String,
    enum: Object.values(CollectionMethod)
  },
  scheduledCollectionTime: {
    type: Date,
    index: true
  },
  actualCollectionTime: {
    type: Date,
    index: true
  },
  collectedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  collectionNotes: {
    type: String,
    maxlength: 1000
  },

  // Processing details
  receivedTime: {
    type: Date,
    index: true
  },
  receivedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  processingStartTime: {
    type: Date
  },
  processingEndTime: {
    type: Date
  },
  processedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },

  // Quality control
  qualityChecks: [{
    checkType: {
      type: String,
      required: true
    },
    result: {
      type: String,
      enum: ['pass', 'fail', 'warning'],
      required: true
    },
    notes: String,
    checkedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    checkedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Storage information
  storageLocation: String,
  storageTemperature: Number,
  storageConditions: String,
  expiryDate: {
    type: Date,
    index: true
  },

  // Status tracking
  statusHistory: [{
    status: {
      type: String,
      enum: Object.values(SampleStatus),
      required: true
    },
    changedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    changedAt: {
      type: Date,
      default: Date.now
    },
    notes: String
  }],

  // Rejection information
  rejectionReason: {
    type: String,
    maxlength: 500
  },
  rejectedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectedAt: {
    type: Date
  },

  // Metadata
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastModifiedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance (unique indexes on sampleId and barcode are auto-created)
SampleSchema.index({ sampleId: 1, collectionStatus: 1 });
SampleSchema.index({ patient: 1, collectionStatus: 1 });
SampleSchema.index({ order: 1, sampleType: 1 });
SampleSchema.index({ collectionStatus: 1, priority: 1 });
SampleSchema.index({ scheduledCollectionTime: 1, collectionStatus: 1 });

// Virtual for time since collection
SampleSchema.virtual('timeSinceCollection').get(function() {
  if (!this.actualCollectionTime) return null;
  return Date.now() - this.actualCollectionTime.getTime();
});

// Virtual for processing duration
SampleSchema.virtual('processingDuration').get(function() {
  if (!this.processingStartTime || !this.processingEndTime) return null;
  return this.processingEndTime.getTime() - this.processingStartTime.getTime();
});

// Pre-save middleware to generate sample ID and barcode
SampleSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      // Generate unique sample ID
      if (!this.sampleId) {
        this.sampleId = await IDGenerator.generateSampleId();
      }

      // Generate unique barcode
      if (!this.barcode) {
        this.barcode = await IDGenerator.generateBarcode();
      }

      // Add initial status to history
      this.statusHistory = [{
        status: this.collectionStatus,
        changedBy: this.createdBy,
        changedAt: new Date(),
        notes: 'Sample created'
      }];

      // Set expiry date if not set (default 7 days from collection)
      if (!this.expiryDate && this.actualCollectionTime) {
        const expiryDate = new Date(this.actualCollectionTime);
        expiryDate.setDate(expiryDate.getDate() + 7);
        this.expiryDate = expiryDate;
      }
    } catch (error) {
      return next(error as Error);
    }
  }
  next();
});

// Instance method to update status
SampleSchema.methods.updateStatus = function(
  newStatus: SampleStatus,
  changedBy: Types.ObjectId,
  notes?: string
) {
  const oldStatus = this.collectionStatus;
  this.collectionStatus = newStatus;
  this.lastModifiedBy = changedBy;

  // Add to status history
  this.statusHistory.push({
    status: newStatus,
    changedBy,
    changedAt: new Date(),
    notes
  });

  // Handle specific status transitions
  if (newStatus === SampleStatus.COLLECTED && !this.actualCollectionTime) {
    this.actualCollectionTime = new Date();
  }

  if (newStatus === SampleStatus.IN_PROCESS && !this.receivedTime) {
    this.receivedTime = new Date();
  }

  if (newStatus === SampleStatus.PROCESSING && !this.processingStartTime) {
    this.processingStartTime = new Date();
    this.processedBy = changedBy;
  }

  if (newStatus === SampleStatus.COMPLETED && !this.processingEndTime) {
    this.processingEndTime = new Date();
  }

  if (newStatus === SampleStatus.REJECTED) {
    this.rejectedAt = new Date();
    this.rejectedBy = changedBy;
  }

  return this.save();
};

// Static method to get pending samples
SampleSchema.statics.getPendingSamples = function(filters = {}) {
  return this.find({
    collectionStatus: { $in: [SampleStatus.PENDING, SampleStatus.COLLECTED] },
    ...filters
  })
  .populate('patient', 'firstName lastName patientId dateOfBirth')
  .populate('order', 'orderNumber priority')
  .populate('tests', 'name code category')
  .sort({ priority: -1, scheduledCollectionTime: 1 });
};

// Static method to get samples by status
SampleSchema.statics.getSamplesByStatus = function(status: SampleStatus, additionalFilters = {}) {
  return this.find({
    collectionStatus: status,
    ...additionalFilters
  })
  .populate('patient', 'firstName lastName patientId')
  .populate('order', 'orderNumber')
  .populate('collectedBy', 'fullName')
  .populate('processedBy', 'fullName')
  .sort({ createdAt: -1 });
};

// Static method for bulk status update
SampleSchema.statics.bulkUpdateStatus = function(
  sampleIds: string[],
  newStatus: SampleStatus,
  changedBy: Types.ObjectId,
  notes?: string
) {
  const updateData: any = {
    collectionStatus: newStatus,
    lastModifiedBy: changedBy,
    $push: {
      statusHistory: {
        status: newStatus,
        changedBy,
        changedAt: new Date(),
        notes
      }
    }
  };

  // Add timestamps based on status
  if (newStatus === SampleStatus.COLLECTED) {
    updateData.actualCollectionTime = new Date();
  }

  if (newStatus === SampleStatus.IN_PROCESS) {
    updateData.receivedTime = new Date();
  }

  if (newStatus === SampleStatus.PROCESSING) {
    updateData.processingStartTime = new Date();
    updateData.processedBy = changedBy;
  }

  if (newStatus === SampleStatus.COMPLETED) {
    updateData.processingEndTime = new Date();
  }

  return this.updateMany(
    { _id: { $in: sampleIds } },
    updateData
  );
};

// Static method for aggregation analytics
SampleSchema.statics.getCollectionStats = function(dateRange?: { start: Date; end: Date }) {
  const matchStage = dateRange ? {
    createdAt: {
      $gte: dateRange.start,
      $lte: dateRange.end
    }
  } : {};

  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$collectionStatus',
        count: { $sum: 1 },
        averageProcessingTime: {
          $avg: {
            $subtract: ['$processingEndTime', '$processingStartTime']
          }
        }
      }
    },
    {
      $group: {
        _id: null,
        totalSamples: { $sum: '$count' },
        statusBreakdown: {
          $push: {
            status: '$_id',
            count: '$count',
            averageProcessingTime: '$averageProcessingTime'
          }
        }
      }
    }
  ]);
};

export const SampleModel = mongoose.model<ISample>('Sample', SampleSchema);
export default SampleModel;