import { z } from 'zod';
import { SampleStatus, SamplePriority, SampleType, CollectionMethod } from '../models/Sample.model';

export const sampleValidator = {
  // Create sample validation
  create: z.object({
    orderId: z.string().min(1, 'Order ID is required'),
    patientId: z.string().min(1, 'Patient ID is required'),
    testIds: z.array(z.string().min(1)).min(1, 'At least one test is required'),
    sampleType: z.nativeEnum(SampleType, { errorMap: () => ({ message: 'Valid sample type is required' }) }),
    containerType: z.string().min(1, 'Container type is required'),
    volume: z.number().min(0, 'Volume must be positive'),
    volumeUnit: z.string().min(1, 'Volume unit is required'),
    collectionMethod: z.nativeEnum(CollectionMethod).optional(),
    scheduledCollectionTime: z.string().datetime().optional(),
    priority: z.nativeEnum(SamplePriority).optional(),
    collectionNotes: z.string().max(1000, 'Collection notes must be less than 1000 characters').optional()
  }),

  // Update sample validation
  update: z.object({
    sampleType: z.nativeEnum(SampleType).optional(),
    containerType: z.string().min(1).optional(),
    volume: z.number().min(0).optional(),
    volumeUnit: z.string().min(1).optional(),
    collectionMethod: z.nativeEnum(CollectionMethod).optional(),
    scheduledCollectionTime: z.string().datetime().optional(),
    priority: z.nativeEnum(SamplePriority).optional(),
    collectionNotes: z.string().max(1000).optional(),
    storageLocation: z.string().optional(),
    storageTemperature: z.number().optional(),
    storageConditions: z.string().optional()
  }),

  // Confirm collection validation
  confirmCollection: z.object({
    actualVolume: z.number().min(0).optional(),
    collectionNotes: z.string().max(1000).optional(),
    qualityChecks: z.array(z.object({
      checkType: z.string().min(1, 'Check type is required'),
      result: z.enum(['pass', 'fail', 'warning']),
      notes: z.string().optional()
    })).optional()
  }),

  // Update status validation
  updateStatus: z.object({
    status: z.nativeEnum(SampleStatus, { errorMap: () => ({ message: 'Valid status is required' }) }),
    notes: z.string().max(500, 'Notes must be less than 500 characters').optional()
  }),

  // Bulk status update validation
  bulkStatusUpdate: z.object({
    sampleIds: z.array(z.string().min(1)).min(1, 'At least one sample ID is required'),
    newStatus: z.nativeEnum(SampleStatus, { errorMap: () => ({ message: 'Valid status is required' }) }),
    notes: z.string().max(500).optional()
  }),

  // Bulk receive validation
  bulkReceive: z.object({
    sampleIds: z.array(z.string().min(1)).min(1, 'At least one sample ID is required'),
    notes: z.string().max(500).optional()
  }),

  // Bulk processing validation
  bulkProcessing: z.object({
    sampleIds: z.array(z.string().min(1)).min(1, 'At least one sample ID is required'),
    notes: z.string().max(500).optional()
  }),

  // Bulk reject validation
  bulkReject: z.object({
    sampleIds: z.array(z.string().min(1)).min(1, 'At least one sample ID is required'),
    rejectionReason: z.string().min(1, 'Rejection reason is required').max(500, 'Rejection reason must be less than 500 characters')
  }),

  // Print labels validation
  printLabels: z.object({
    sampleIds: z.array(z.string().min(1)).min(1, 'At least one sample ID is required')
  }),

  // Search validation
  search: z.object({
    q: z.string().min(1, 'Search query is required'),
    limit: z.coerce.number().min(1).max(100).default(20)
  }),

  // Get statistics validation
  getStatistics: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional()
  }).refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.startDate) <= new Date(data.endDate);
      }
      return true;
    },
    {
      message: 'End date must be after start date',
      path: ['endDate']
    }
  ),

  // Filter validation
  filter: z.object({
    status: z.nativeEnum(SampleStatus).optional(),
    priority: z.nativeEnum(SamplePriority).optional(),
    sampleType: z.nativeEnum(SampleType).optional(),
    patientId: z.string().optional(),
    orderId: z.string().optional(),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
    collectedBy: z.string().optional(),
    search: z.string().optional(),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20)
  }).refine(
    (data) => {
      if (data.dateFrom && data.dateTo) {
        return new Date(data.dateFrom) <= new Date(data.dateTo);
      }
      return true;
    },
    {
      message: 'End date must be after start date',
      path: ['dateTo']
    }
  )
};