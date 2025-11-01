"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const addressSchema = new mongoose_1.Schema({
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    zipCode: { type: String, trim: true },
    country: { type: String, trim: true, default: 'USA' },
}, { _id: false });
const emergencyContactSchema = new mongoose_1.Schema({
    name: { type: String, trim: true },
    relationship: { type: String, trim: true },
    phoneNumber: { type: String, trim: true },
}, { _id: false });
const medicalHistorySchema = new mongoose_1.Schema({
    condition: { type: String, required: true, trim: true },
    diagnosis: { type: String, required: true, trim: true },
    diagnosisDate: { type: Date, required: true },
    medications: [{ type: String, trim: true }],
}, { _id: false });
const patientSchema = new mongoose_1.Schema({
    patientId: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true,
    },
    firstName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50,
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50,
    },
    dateOfBirth: {
        type: Date,
        required: true,
        validate: {
            validator: function (value) {
                return !isNaN(value.getTime()) && value < new Date();
            },
            message: 'Please provide a valid date of birth in the past'
        }
    },
    gender: {
        type: String,
        required: true,
        enum: ['male', 'female', 'other'],
        lowercase: true,
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
    },
    phone: {
        type: String,
        required: true,
        trim: true,
        match: [/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid phone number'],
    },
    address: {
        type: addressSchema,
        default: {},
    },
    bloodGroup: {
        type: String,
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
        uppercase: true,
    },
    emergencyContact: {
        type: emergencyContactSchema,
        default: {},
    },
    medicalHistory: [medicalHistorySchema],
    allergies: [{
            type: String,
            trim: true,
        }],
    testHistory: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'Order'
        }],
    assignedDoctor: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true,
    },
}, {
    timestamps: true,
    collection: 'patients',
});
patientSchema.index({ patientId: 1, isActive: 1 });
patientSchema.index({ firstName: 1, lastName: 1, isActive: 1 });
patientSchema.index({ email: 1, isActive: 1 });
patientSchema.index({ phone: 1, isActive: 1 });
patientSchema.index({ dateOfBirth: 1 });
patientSchema.index({ createdAt: -1 });
patientSchema.index({
    firstName: 'text',
    lastName: 'text',
    patientId: 'text',
    email: 'text',
    phone: 'text'
});
patientSchema.pre('save', function (next) {
    if (this.phone) {
        this.phone = this.phone.replace(/\s+/g, '').replace(/[\(\)]/g, '');
    }
    if (this.email) {
        this.email = this.email.toLowerCase();
    }
    next();
});
patientSchema.virtual('fullName').get(function () {
    return `${this.firstName} ${this.lastName}`;
});
patientSchema.virtual('age').get(function () {
    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
});
patientSchema.virtual('displayName').get(function () {
    return `${this.firstName} ${this.lastName} (${this.patientId})`;
});
patientSchema.set('toJSON', {
    virtuals: true,
    transform: function (doc, ret) {
        return ret;
    },
});
patientSchema.set('toObject', {
    virtuals: true,
    transform: function (doc, ret) {
        return ret;
    },
});
exports.default = (0, mongoose_1.model)('Patient', patientSchema);
