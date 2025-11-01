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
exports.Result = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const NormalRangeSchema = new mongoose_1.Schema({
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
const ResultSchema = new mongoose_1.Schema({
    order: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Order',
        required: true,
        index: true
    },
    orderNumber: {
        type: String,
        trim: true
    },
    test: {
        type: mongoose_1.Schema.Types.ObjectId,
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
        type: mongoose_1.Schema.Types.ObjectId,
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
        type: mongoose_1.Schema.Types.Mixed,
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
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    enteredByUser: {
        type: String
    },
    verifiedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        index: true
    },
    verifiedByUser: {
        type: String
    },
    rejectedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User'
    },
    rejectedReason: {
        type: String,
        trim: true,
        maxlength: 500
    },
    reviewedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User'
    },
    reviewedAt: {
        type: Date
    },
    attachments: [{
            type: mongoose_1.Schema.Types.ObjectId,
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
            type: mongoose_1.Schema.Types.Mixed
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
ResultSchema.index({ order: 1, test: 1 }, { unique: true });
ResultSchema.index({ patient: 1, test: 1, createdAt: -1 });
ResultSchema.index({ status: 1, createdAt: -1 });
ResultSchema.index({ enteredBy: 1, createdAt: -1 });
ResultSchema.index({ verifiedBy: 1, verificationDate: -1 });
ResultSchema.index({ criticalValue: 1, createdAt: -1 });
ResultSchema.index({ isAbnormal: 1, createdAt: -1 });
ResultSchema.index({ specimenType: 1, createdAt: -1 });
ResultSchema.virtual('isOverdue').get(function () {
    if (this.status === 'pending' || this.status === 'in_progress') {
        const expectedTime = new Date(this.createdAt.getTime() + (this.turnaroundTime || 1440) * 60000);
        return new Date() > expectedTime;
    }
    return false;
});
ResultSchema.pre('save', async function (next) {
    if (this.isNew) {
        try {
            const Order = mongoose_1.default.model('Order');
            const Test = mongoose_1.default.model('Test');
            const Patient = mongoose_1.default.model('Patient');
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
        }
        catch (error) {
        }
    }
    if (this.isModified('value') && this.valueType === 'number' && this.normalRange) {
        this.isAbnormal = this.checkIfAbnormal();
    }
    next();
});
ResultSchema.methods.checkIfAbnormal = function () {
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
ResultSchema.methods.markAsVerified = function (verifiedBy, verifiedByUser) {
    this.status = 'verified';
    this.verifiedBy = verifiedBy;
    this.verifiedByUser = verifiedByUser;
    this.verificationDate = new Date();
};
ResultSchema.methods.markAsRejected = function (rejectedBy, reason) {
    this.status = 'rejected';
    this.rejectedBy = rejectedBy;
    this.rejectedReason = reason;
};
ResultSchema.methods.markAsCritical = function () {
    this.criticalValue = true;
    this.criticalValueNotifiedAt = new Date();
};
exports.Result = mongoose_1.default.model('Result', ResultSchema);
