// @ts-nocheck
import { Schema, model } from 'mongoose';
import { ITest } from '../types/models.types';

const testParameterSchema = new Schema({
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

const normalRangeSchema = new Schema({
  min: { type: Number },
  max: { type: Number },
  unit: { type: String, trim: true },
  text: { type: String, trim: true },
}, { _id: false });

const testSchema = new Schema<ITest>({
  // @ts-ignore
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

// Compound indexes
testSchema.index({ testCode: 1, isActive: 1 });
testSchema.index({ category: 1, isActive: 1 });
testSchema.index({ testName: 1, isActive: 1 });

// Text index for search
testSchema.index({
  testName: 'text',
  testCode: 'text',
  category: 'text',
  description: 'text'
});

// Pre-save middleware for normalization
testSchema.pre('save', function(next) {
  // @ts-ignore
  if (this.testName) {
    // @ts-ignore
    this.testName = (this.testName as any).toLowerCase().replace(/\b\w/g, (char: any) => char.toUpperCase());
  }

  // @ts-ignore
  if (this.testCode) {
    // @ts-ignore
    this.testCode = (this.testCode as any).toUpperCase();
  }

  next();
});

// Virtual for display name
testSchema.virtual('displayName').get(function() {
  // @ts-ignore
  return `${(this.testName as any)} (${(this.testCode as any)})`;
});

// Virtual for formatted price
testSchema.virtual('formattedPrice').get(function() {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(this.price);
});

// Ensure virtuals are included in JSON output
testSchema.set('toJSON', {
  virtuals: true,
});

testSchema.set('toObject', {
  virtuals: true,
});

export default model<ITest>('Test', testSchema);