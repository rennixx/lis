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
exports.Order = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const OrderItemSchema = new mongoose_1.Schema({
    testId: {
        type: mongoose_1.Schema.Types.ObjectId,
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
const OrderSchema = new mongoose_1.Schema({
    orderNumber: {
        type: String,
        required: true,
        unique: true
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
    tests: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'Test'
        }],
    samples: [{
            type: mongoose_1.Schema.Types.ObjectId,
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
        type: mongoose_1.Schema.Types.ObjectId,
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
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User'
    },
    sampleCollectedAt: {
        type: Date
    },
    collectedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
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
        type: mongoose_1.Schema.Types.ObjectId,
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
OrderSchema.index({ patient: 1, createdAt: -1 });
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ priority: 1, createdAt: -1 });
OrderSchema.index({ orderedBy: 1, createdAt: -1 });
OrderSchema.index({ department: 1, createdAt: -1 });
OrderSchema.index({ doctorId: 1, createdAt: -1 });
OrderSchema.virtual('duration').get(function () {
    if (this.completedAt && this.createdAt) {
        return this.completedAt.getTime() - this.createdAt.getTime();
    }
    return null;
});
OrderSchema.virtual('isOverdue').get(function () {
    if (this.expectedDeliveryTime && this.status !== 'completed' && this.status !== 'cancelled') {
        return new Date() > this.expectedDeliveryTime;
    }
    return false;
});
OrderSchema.pre('save', async function (next) {
    if (this.isNew && this.patient) {
        try {
            const Patient = mongoose_1.default.model('Patient');
            const patient = await Patient.findById(this.patient);
            if (patient) {
                this.patientName = `${patient.firstName} ${patient.lastName}`;
                this.patientMRN = patient.mrn;
            }
        }
        catch (error) {
        }
    }
    next();
});
OrderSchema.methods.calculateTotal = function () {
    this.totalAmount = this.orderItems.reduce((total, item) => {
        return total + (item.price * (item.quantity || 1));
    }, 0);
    this.finalAmount = this.totalAmount - (this.discountAmount || 0);
    return this.finalAmount;
};
OrderSchema.methods.markAsCompleted = function () {
    this.status = 'completed';
    this.completedAt = new Date();
};
OrderSchema.methods.markSampleCollected = function (collectedBy) {
    this.status = 'sample_collected';
    this.sampleCollectedAt = new Date();
    if (collectedBy) {
        this.collectedBy = collectedBy;
    }
};
exports.Order = mongoose_1.default.model('Order', OrderSchema);
