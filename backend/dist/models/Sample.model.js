"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SampleModel = exports.CollectionMethod = exports.SampleType = exports.SamplePriority = exports.SampleStatus = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const generateID_1 = require("../utils/generateID");
var SampleStatus;
(function (SampleStatus) {
    SampleStatus["PENDING"] = "pending";
    SampleStatus["COLLECTED"] = "collected";
    SampleStatus["IN_PROCESS"] = "in_process";
    SampleStatus["PROCESSING"] = "processing";
    SampleStatus["COMPLETED"] = "completed";
    SampleStatus["CANCELLED"] = "cancelled";
    SampleStatus["REJECTED"] = "rejected";
    SampleStatus["EXPIRED"] = "expired";
})(SampleStatus || (exports.SampleStatus = SampleStatus = {}));
var SamplePriority;
(function (SamplePriority) {
    SamplePriority["ROUTINE"] = "routine";
    SamplePriority["URGENT"] = "urgent";
    SamplePriority["STAT"] = "stat";
    SamplePriority["CRITICAL"] = "critical";
})(SamplePriority || (exports.SamplePriority = SamplePriority = {}));
var SampleType;
(function (SampleType) {
    SampleType["BLOOD"] = "blood";
    SampleType["URINE"] = "urine";
    SampleType["SWAB"] = "swab";
    SampleType["TISSUE"] = "tissue";
    SampleType["FLUID"] = "fluid";
    SampleType["STOOL"] = "stool";
    SampleType["SPUTUM"] = "sputum";
    SampleType["OTHER"] = "other";
})(SampleType || (exports.SampleType = SampleType = {}));
var CollectionMethod;
(function (CollectionMethod) {
    CollectionMethod["VENIPUNCTURE"] = "venipuncture";
    CollectionMethod["CATHETER"] = "catheter";
    CollectionMethod["LUMBAR_PUNCTURE"] = "lumbar_puncture";
    CollectionMethod["SWAB"] = "swab";
    CollectionMethod["VOIDED"] = "voided";
    CollectionMethod["BIOPSY"] = "biopsy";
    CollectionMethod["OTHER"] = "other";
})(CollectionMethod || (exports.CollectionMethod = CollectionMethod = {}));
const SampleSchema = new mongoose_1.Schema({
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
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Order',
        required: true,
        index: true
    },
    patient: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true,
        index: true
    },
    tests: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'Test',
            required: true
        }],
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
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User'
    },
    collectionNotes: {
        type: String,
        maxlength: 1000
    },
    receivedTime: {
        type: Date,
        index: true
    },
    receivedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User'
    },
    processingStartTime: {
        type: Date
    },
    processingEndTime: {
        type: Date
    },
    processedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User'
    },
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
                type: mongoose_1.Schema.Types.ObjectId,
                ref: 'User',
                required: true
            },
            checkedAt: {
                type: Date,
                default: Date.now
            }
        }],
    storageLocation: String,
    storageTemperature: Number,
    storageConditions: String,
    expiryDate: {
        type: Date,
        index: true
    },
    statusHistory: [{
            status: {
                type: String,
                enum: Object.values(SampleStatus),
                required: true
            },
            changedBy: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: 'User',
                required: true
            },
            changedAt: {
                type: Date,
                default: Date.now
            },
            notes: String
        }],
    rejectionReason: {
        type: String,
        maxlength: 500
    },
    rejectedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User'
    },
    rejectedAt: {
        type: Date
    },
    createdBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    lastModifiedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
SampleSchema.index({ sampleId: 1, collectionStatus: 1 });
SampleSchema.index({ patient: 1, collectionStatus: 1 });
SampleSchema.index({ order: 1, sampleType: 1 });
SampleSchema.index({ collectionStatus: 1, priority: 1 });
SampleSchema.index({ scheduledCollectionTime: 1, collectionStatus: 1 });
SampleSchema.virtual('timeSinceCollection').get(function () {
    if (!this.actualCollectionTime)
        return null;
    return Date.now() - this.actualCollectionTime.getTime();
});
SampleSchema.virtual('processingDuration').get(function () {
    if (!this.processingStartTime || !this.processingEndTime)
        return null;
    return this.processingEndTime.getTime() - this.processingStartTime.getTime();
});
SampleSchema.pre('save', async function (next) {
    if (this.isNew) {
        try {
            if (!this.sampleId) {
                this.sampleId = await generateID_1.IDGenerator.generateSampleId();
            }
            if (!this.barcode) {
                this.barcode = await generateID_1.IDGenerator.generateBarcode();
            }
            this.statusHistory = [{
                    status: this.collectionStatus,
                    changedBy: this.createdBy,
                    changedAt: new Date(),
                    notes: 'Sample created'
                }];
            if (!this.expiryDate && this.actualCollectionTime) {
                const expiryDate = new Date(this.actualCollectionTime);
                expiryDate.setDate(expiryDate.getDate() + 7);
                this.expiryDate = expiryDate;
            }
        }
        catch (error) {
            return next(error);
        }
    }
    next();
});
SampleSchema.methods.updateStatus = function (newStatus, changedBy, notes) {
    const oldStatus = this.collectionStatus;
    this.collectionStatus = newStatus;
    this.lastModifiedBy = changedBy;
    this.statusHistory.push({
        status: newStatus,
        changedBy,
        changedAt: new Date(),
        notes
    });
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
SampleSchema.statics.getPendingSamples = function (filters = {}) {
    return this.find({
        collectionStatus: { $in: [SampleStatus.PENDING, SampleStatus.COLLECTED] },
        ...filters
    })
        .populate('patient', 'firstName lastName patientId dateOfBirth')
        .populate('order', 'orderNumber priority')
        .populate('tests', 'name code category')
        .sort({ priority: -1, scheduledCollectionTime: 1 });
};
SampleSchema.statics.getSamplesByStatus = function (status, additionalFilters = {}) {
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
SampleSchema.statics.bulkUpdateStatus = function (sampleIds, newStatus, changedBy, notes) {
    const updateData = {
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
    return this.updateMany({ _id: { $in: sampleIds } }, updateData);
};
SampleSchema.statics.getCollectionStats = function (dateRange) {
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
exports.SampleModel = mongoose_1.default.model('Sample', SampleSchema);
exports.default = exports.SampleModel;
