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
exports.Report = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const ReportSectionSchema = new mongoose_1.Schema({
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
        type: mongoose_1.Schema.Types.Mixed
    }
}, { _id: false });
const AmendmentSchema = new mongoose_1.Schema({
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
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    changes: {
        type: String,
        required: true,
        trim: true
    }
}, { _id: false });
const AuditTrailSchema = new mongoose_1.Schema({
    action: {
        type: String,
        required: true,
        trim: true
    },
    performedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
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
const ReportSchema = new mongoose_1.Schema({
    reportNumber: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
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
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    doctorName: {
        type: String,
        trim: true
    },
    tests: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'Test'
        }],
    results: [{
            type: mongoose_1.Schema.Types.ObjectId,
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
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    generatedByUser: {
        type: String
    },
    approvedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
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
        type: mongoose_1.Schema.Types.ObjectId,
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
    pdfFileId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'fs.files'
    },
    pdfFileName: {
        type: String,
        trim: true
    },
    pdfFileSize: {
        type: Number
    },
    reportGeneration: {
        generatedAt: Date,
        pdfVersion: {
            type: String,
            default: '1.0'
        },
        generationTime: Number,
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
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Report'
    },
    nextVersion: {
        type: mongoose_1.Schema.Types.ObjectId,
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
        max: 240
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
ReportSchema.index({ reportNumber: 1 }, { unique: true });
ReportSchema.index({ order: 1, version: -1 });
ReportSchema.index({ patient: 1, createdAt: -1 });
ReportSchema.index({ doctor: 1, createdAt: -1 });
ReportSchema.index({ status: 1, createdAt: -1 });
ReportSchema.index({ type: 1, createdAt: -1 });
ReportSchema.index({ generatedBy: 1, createdAt: -1 });
ReportSchema.index({ approvedBy: 1, approvedAt: -1 });
ReportSchema.index({ confidentialityLevel: 1, createdAt: -1 });
ReportSchema.virtual('isEditable').get(function () {
    return this.status === 'draft' || this.status === 'rejected';
});
ReportSchema.virtual('isApprovable').get(function () {
    return this.status === 'pending_review';
});
ReportSchema.virtual('isDeliverable').get(function () {
    return this.status === 'approved';
});
ReportSchema.virtual('isArchivable').get(function () {
    return this.status === 'delivered' && !this.archivedAt;
});
ReportSchema.pre('save', async function (next) {
    if (this.isNew) {
        try {
            const Order = mongoose_1.default.model('Order');
            const Patient = mongoose_1.default.model('Patient');
            const User = mongoose_1.default.model('User');
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
            this.auditTrail = this.auditTrail || [];
            this.auditTrail.push({
                action: 'created',
                performedBy: this.generatedBy,
                performedAt: new Date()
            });
        }
        catch (error) {
        }
    }
    next();
});
ReportSchema.methods.approve = function (approvedBy, approvedByUser) {
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
ReportSchema.methods.deliver = function (deliveredBy, method) {
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
ReportSchema.methods.reject = function (rejectedBy, reason) {
    this.status = 'rejected';
    this.auditTrail = this.auditTrail || [];
    this.auditTrail.push({
        action: 'rejected',
        performedBy: rejectedBy,
        performedAt: new Date(),
        details: reason
    });
};
ReportSchema.methods.amend = function (amendedBy, reason, changes) {
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
ReportSchema.methods.archive = function () {
    this.status = 'archived';
    this.archivedAt = new Date();
    this.auditTrail = this.auditTrail || [];
    this.auditTrail.push({
        action: 'archived',
        performedBy: this.generatedBy,
        performedAt: new Date()
    });
};
exports.Report = mongoose_1.default.model('Report', ReportSchema);
