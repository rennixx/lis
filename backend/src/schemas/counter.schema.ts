import { Schema, model } from 'mongoose';
import { ICounter } from '../types/models.types';

const counterSchema = new Schema<ICounter>({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  value: {
    type: Number,
    required: true,
    default: 1,
    min: 1,
  },
}, {
  timestamps: true,
  collection: 'counters',
});

// Index is automatically created by unique: true in the field definition

export default model<ICounter>('Counter', counterSchema);