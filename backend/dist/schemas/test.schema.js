"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const testParameterSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    unit: {
        type: String,
        trim: true,
    },
    normalRange: {
        min: { type: Number },
        max: { type: Number },
        text: { type: String, trim: true },
    },
}, { _id: false });
const normalRangeSchema = new mongoose_1.Schema({
    min: { type: Number },
    max: { type: Number },
    unit: { type: String, trim: true },
    text: { type: String, trim: true },
}, { _id: false });
const testSchema = new mongoose_1.Schema({
    testCode: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true,
        index: true,
    },
    testName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
    },
    category: {
        type: String,
        required: true,
        enum: ['hematology', 'biochemistry', 'microbiology', 'immunology', 'pathology', 'radiology', 'cardiology', 'other'],
        lowercase: true,
        index: true,
    },
    description: {
        type: String,
        trim: true,
        maxlength: 500,
    },
    normalRange: {
        type: normalRangeSchema,
        default: {},
    },
    specimenType: {
        type: String,
        required: true,
        enum: ['blood', 'urine', 'stool', 'sputum', 'swab', 'csf', 'synovial_fluid', 'other'],
        lowercase: true,
    },
    preparationInstructions: {
        type: String,
        trim: true,
        maxlength: 1000,
    },
    turnaroundTime: {
        value: { type: Number, min: 1 },
        unit: {
            type: String,
            enum: ['minutes', 'hours', 'days'],
            default: 'hours',
        },
    },
    price: {
        type: Number,
        required: true,
        min: 0,
    },
    testParameters: [testParameterSchema],
    isActive: {
        type: Boolean,
        default: true,
        index: true,
    },
}, {
    timestamps: true,
    collection: 'tests',
});
testSchema.index({ testCode: 1, isActive: 1 });
testSchema.index({ category: 1, isActive: 1 });
testSchema.index({ testName: 1, isActive: 1 });
testSchema.index({
    testName: 'text',
    testCode: 'text',
    category: 'text',
    description: 'text'
});
testSchema.pre('save', function (next) {
    if (this.testName) {
        this.testName = this.testName.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
    }
    if (this.testCode) {
        this.testCode = this.testCode.toUpperCase();
    }
    next();
});
testSchema.virtual('displayName').get(function () {
    return `${this.testName} (${this.testCode})`;
});
testSchema.virtual('formattedPrice').get(function () {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(this.price);
});
testSchema.set('toJSON', {
    virtuals: true,
});
testSchema.set('toObject', {
    virtuals: true,
});
exports.default = (0, mongoose_1.model)('Test', testSchema);
