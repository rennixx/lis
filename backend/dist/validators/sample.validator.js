"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sampleValidator = void 0;
const zod_1 = require("zod");
const Sample_model_1 = require("../models/Sample.model");
exports.sampleValidator = {
    create: zod_1.z.object({
        orderId: zod_1.z.string().min(1, 'Order ID is required'),
        patientId: zod_1.z.string().min(1, 'Patient ID is required'),
        testIds: zod_1.z.array(zod_1.z.string().min(1)).min(1, 'At least one test is required'),
        sampleType: zod_1.z.nativeEnum(Sample_model_1.SampleType, { errorMap: () => ({ message: 'Valid sample type is required' }) }),
        containerType: zod_1.z.string().min(1, 'Container type is required'),
        volume: zod_1.z.number().min(0, 'Volume must be positive'),
        volumeUnit: zod_1.z.string().min(1, 'Volume unit is required'),
        collectionMethod: zod_1.z.nativeEnum(Sample_model_1.CollectionMethod).optional(),
        scheduledCollectionTime: zod_1.z.string().datetime().optional(),
        priority: zod_1.z.nativeEnum(Sample_model_1.SamplePriority).optional(),
        collectionNotes: zod_1.z.string().max(1000, 'Collection notes must be less than 1000 characters').optional()
    }),
    update: zod_1.z.object({
        sampleType: zod_1.z.nativeEnum(Sample_model_1.SampleType).optional(),
        containerType: zod_1.z.string().min(1).optional(),
        volume: zod_1.z.number().min(0).optional(),
        volumeUnit: zod_1.z.string().min(1).optional(),
        collectionMethod: zod_1.z.nativeEnum(Sample_model_1.CollectionMethod).optional(),
        scheduledCollectionTime: zod_1.z.string().datetime().optional(),
        priority: zod_1.z.nativeEnum(Sample_model_1.SamplePriority).optional(),
        collectionNotes: zod_1.z.string().max(1000).optional(),
        storageLocation: zod_1.z.string().optional(),
        storageTemperature: zod_1.z.number().optional(),
        storageConditions: zod_1.z.string().optional()
    }),
    confirmCollection: zod_1.z.object({
        actualVolume: zod_1.z.number().min(0).optional(),
        collectionNotes: zod_1.z.string().max(1000).optional(),
        qualityChecks: zod_1.z.array(zod_1.z.object({
            checkType: zod_1.z.string().min(1, 'Check type is required'),
            result: zod_1.z.enum(['pass', 'fail', 'warning']),
            notes: zod_1.z.string().optional()
        })).optional()
    }),
    updateStatus: zod_1.z.object({
        status: zod_1.z.nativeEnum(Sample_model_1.SampleStatus, { errorMap: () => ({ message: 'Valid status is required' }) }),
        notes: zod_1.z.string().max(500, 'Notes must be less than 500 characters').optional()
    }),
    bulkStatusUpdate: zod_1.z.object({
        sampleIds: zod_1.z.array(zod_1.z.string().min(1)).min(1, 'At least one sample ID is required'),
        newStatus: zod_1.z.nativeEnum(Sample_model_1.SampleStatus, { errorMap: () => ({ message: 'Valid status is required' }) }),
        notes: zod_1.z.string().max(500).optional()
    }),
    bulkReceive: zod_1.z.object({
        sampleIds: zod_1.z.array(zod_1.z.string().min(1)).min(1, 'At least one sample ID is required'),
        notes: zod_1.z.string().max(500).optional()
    }),
    bulkProcessing: zod_1.z.object({
        sampleIds: zod_1.z.array(zod_1.z.string().min(1)).min(1, 'At least one sample ID is required'),
        notes: zod_1.z.string().max(500).optional()
    }),
    bulkReject: zod_1.z.object({
        sampleIds: zod_1.z.array(zod_1.z.string().min(1)).min(1, 'At least one sample ID is required'),
        rejectionReason: zod_1.z.string().min(1, 'Rejection reason is required').max(500, 'Rejection reason must be less than 500 characters')
    }),
    printLabels: zod_1.z.object({
        sampleIds: zod_1.z.array(zod_1.z.string().min(1)).min(1, 'At least one sample ID is required')
    }),
    search: zod_1.z.object({
        q: zod_1.z.string().min(1, 'Search query is required'),
        limit: zod_1.z.coerce.number().min(1).max(100).default(20)
    }),
    getStatistics: zod_1.z.object({
        startDate: zod_1.z.string().datetime().optional(),
        endDate: zod_1.z.string().datetime().optional()
    }).refine((data) => {
        if (data.startDate && data.endDate) {
            return new Date(data.startDate) <= new Date(data.endDate);
        }
        return true;
    }, {
        message: 'End date must be after start date',
        path: ['endDate']
    }),
    filter: zod_1.z.object({
        status: zod_1.z.nativeEnum(Sample_model_1.SampleStatus).optional(),
        priority: zod_1.z.nativeEnum(Sample_model_1.SamplePriority).optional(),
        sampleType: zod_1.z.nativeEnum(Sample_model_1.SampleType).optional(),
        patientId: zod_1.z.string().optional(),
        orderId: zod_1.z.string().optional(),
        dateFrom: zod_1.z.string().datetime().optional(),
        dateTo: zod_1.z.string().datetime().optional(),
        collectedBy: zod_1.z.string().optional(),
        search: zod_1.z.string().optional(),
        page: zod_1.z.coerce.number().min(1).default(1),
        limit: zod_1.z.coerce.number().min(1).max(100).default(20)
    }).refine((data) => {
        if (data.dateFrom && data.dateTo) {
            return new Date(data.dateFrom) <= new Date(data.dateTo);
        }
        return true;
    }, {
        message: 'End date must be after start date',
        path: ['dateTo']
    })
};
