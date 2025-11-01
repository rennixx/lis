"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SampleService = void 0;
const mongoose_1 = require("mongoose");
const Sample_model_1 = require("../models/Sample.model");
const ApiError_1 = require("../utils/ApiError");
class SampleService {
    async createSample(data) {
        try {
            const sample = new Sample_model_1.SampleModel({
                order: new mongoose_1.Types.ObjectId(data.orderId),
                patient: new mongoose_1.Types.ObjectId(data.patientId),
                tests: data.testIds.map(id => new mongoose_1.Types.ObjectId(id)),
                sampleType: data.sampleType,
                containerType: data.containerType,
                volume: data.volume,
                volumeUnit: data.volumeUnit,
                collectionMethod: data.collectionMethod,
                scheduledCollectionTime: data.scheduledCollectionTime,
                priority: data.priority || Sample_model_1.SamplePriority.ROUTINE,
                collectionNotes: data.collectionNotes,
                createdBy: new mongoose_1.Types.ObjectId(data.createdBy)
            });
            return await sample.save();
        }
        catch (error) {
            throw new ApiError_1.ApiError('Failed to create sample', 500);
        }
    }
    async getSamples(filters = {}, page = 1, limit = 20) {
        try {
            const query = {};
            if (filters.status) {
                query.collectionStatus = filters.status;
            }
            if (filters.priority) {
                query.priority = filters.priority;
            }
            if (filters.sampleType) {
                query.sampleType = filters.sampleType;
            }
            if (filters.patientId) {
                query.patient = new mongoose_1.Types.ObjectId(filters.patientId);
            }
            if (filters.orderId) {
                query.order = new mongoose_1.Types.ObjectId(filters.orderId);
            }
            if (filters.dateFrom || filters.dateTo) {
                query.createdAt = {};
                if (filters.dateFrom) {
                    query.createdAt.$gte = filters.dateFrom;
                }
                if (filters.dateTo) {
                    query.createdAt.$lte = filters.dateTo;
                }
            }
            if (filters.search) {
                query.$or = [
                    { sampleId: { $regex: filters.search, $options: 'i' } },
                    { barcode: { $regex: filters.search, $options: 'i' } }
                ];
            }
            const skip = (page - 1) * limit;
            const samples = await Sample_model_1.SampleModel.find(query)
                .populate('patient', 'firstName lastName patientId dateOfBirth')
                .populate('order', 'orderNumber priority')
                .populate('tests', 'name code category')
                .populate('collectedBy', 'fullName')
                .populate('processedBy', 'fullName')
                .sort({ priority: -1, scheduledCollectionTime: 1, createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .exec();
            const total = await Sample_model_1.SampleModel.countDocuments(query);
            const pages = Math.ceil(total / limit);
            return { samples, total, pages };
        }
        catch (error) {
            throw new ApiError_1.ApiError('Failed to get samples', 500);
        }
    }
    async getSampleById(id) {
        try {
            return await Sample_model_1.SampleModel.findById(id)
                .populate('patient', 'firstName lastName patientId dateOfBirth phone')
                .populate('order', 'orderNumber priority clinicalNotes')
                .populate('tests', 'name code category description normalRange')
                .populate('collectedBy', 'fullName')
                .populate('receivedBy', 'fullName')
                .populate('processedBy', 'fullName')
                .populate('createdBy', 'fullName')
                .populate('statusHistory.changedBy', 'fullName')
                .populate('qualityChecks.checkedBy', 'fullName')
                .exec();
        }
        catch (error) {
            throw new ApiError_1.ApiError('Failed to get sample', 500);
        }
    }
    async getSampleByBarcode(barcode) {
        try {
            return await Sample_model_1.SampleModel.findOne({ barcode })
                .populate('patient', 'firstName lastName patientId dateOfBirth')
                .populate('order', 'orderNumber priority')
                .populate('tests', 'name code category')
                .exec();
        }
        catch (error) {
            throw new ApiError_1.ApiError('Failed to get sample by barcode', 500);
        }
    }
    async getPendingCollectionsQueue(limit = 50) {
        try {
            return await Sample_model_1.SampleModel.find({
                collectionStatus: { $in: ['pending', 'collected'] }
            })
                .populate('patient', 'firstName lastName patientId dateOfBirth')
                .populate('order', 'orderNumber priority')
                .populate('tests', 'name code category')
                .sort({ priority: -1, scheduledCollectionTime: 1 })
                .limit(limit)
                .exec();
        }
        catch (error) {
            throw new ApiError_1.ApiError('Failed to get pending collections', 500);
        }
    }
    async confirmCollection(data) {
        try {
            const sample = await Sample_model_1.SampleModel.findById(data.sampleId);
            if (!sample) {
                throw new ApiError_1.ApiError('Sample not found', 404);
            }
            if (sample.collectionStatus !== 'pending') {
                throw new ApiError_1.ApiError('Sample has already been collected', 400);
            }
            sample.actualCollectionTime = new Date();
            sample.collectedBy = new mongoose_1.Types.ObjectId(data.collectedBy);
            sample.collectionStatus = Sample_model_1.SampleStatus.COLLECTED;
            if (data.actualVolume !== undefined) {
                sample.volume = data.actualVolume;
            }
            if (data.collectionNotes) {
                sample.collectionNotes = data.collectionNotes;
            }
            sample.statusHistory.push({
                status: Sample_model_1.SampleStatus.COLLECTED,
                changedBy: new mongoose_1.Types.ObjectId(data.collectedBy),
                changedAt: new Date(),
                notes: data.collectionNotes || 'Sample collected successfully'
            });
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + 7);
            sample.expiryDate = expiryDate;
            return await sample.save();
        }
        catch (error) {
            throw new ApiError_1.ApiError('Failed to confirm collection', 500);
        }
    }
    async bulkUpdateStatus(data) {
        try {
            const sampleObjectIds = data.sampleIds.map(id => new mongoose_1.Types.ObjectId(id));
            const result = await Sample_model_1.SampleModel.updateMany({ _id: { $in: sampleObjectIds } }, {
                collectionStatus: data.newStatus,
                lastModifiedBy: new mongoose_1.Types.ObjectId(data.updatedBy),
                $push: {
                    statusHistory: {
                        status: data.newStatus,
                        changedBy: new mongoose_1.Types.ObjectId(data.updatedBy),
                        changedAt: new Date(),
                        notes: data.notes
                    }
                }
            });
            return { modifiedCount: result.modifiedCount };
        }
        catch (error) {
            throw new ApiError_1.ApiError('Failed to bulk update sample status', 500);
        }
    }
    async receiveSamples(sampleIds, receivedBy, notes) {
        try {
            const sampleObjectIds = sampleIds.map(id => new mongoose_1.Types.ObjectId(id));
            const result = await Sample_model_1.SampleModel.updateMany({
                _id: { $in: sampleObjectIds },
                collectionStatus: Sample_model_1.SampleStatus.COLLECTED
            }, {
                collectionStatus: Sample_model_1.SampleStatus.IN_PROCESS,
                receivedTime: new Date(),
                receivedBy: new mongoose_1.Types.ObjectId(receivedBy),
                $push: {
                    statusHistory: {
                        status: Sample_model_1.SampleStatus.IN_PROCESS,
                        changedBy: new mongoose_1.Types.ObjectId(receivedBy),
                        changedAt: new Date(),
                        notes: notes || 'Sample received in laboratory'
                    }
                }
            });
            return { modifiedCount: result.modifiedCount };
        }
        catch (error) {
            throw new ApiError_1.ApiError('Failed to receive samples', 500);
        }
    }
    async startProcessing(sampleIds, processedBy, notes) {
        try {
            const sampleObjectIds = sampleIds.map(id => new mongoose_1.Types.ObjectId(id));
            const result = await Sample_model_1.SampleModel.updateMany({
                _id: { $in: sampleObjectIds },
                collectionStatus: Sample_model_1.SampleStatus.IN_PROCESS
            }, {
                collectionStatus: Sample_model_1.SampleStatus.PROCESSING,
                processingStartTime: new Date(),
                processedBy: new mongoose_1.Types.ObjectId(processedBy),
                $push: {
                    statusHistory: {
                        status: Sample_model_1.SampleStatus.PROCESSING,
                        changedBy: new mongoose_1.Types.ObjectId(processedBy),
                        changedAt: new Date(),
                        notes: notes || 'Processing started'
                    }
                }
            });
            return { modifiedCount: result.modifiedCount };
        }
        catch (error) {
            throw new ApiError_1.ApiError('Failed to start processing', 500);
        }
    }
    async completeProcessing(sampleIds, completedBy, notes) {
        try {
            const sampleObjectIds = sampleIds.map(id => new mongoose_1.Types.ObjectId(id));
            const result = await Sample_model_1.SampleModel.updateMany({
                _id: { $in: sampleObjectIds },
                collectionStatus: Sample_model_1.SampleStatus.PROCESSING
            }, {
                collectionStatus: Sample_model_1.SampleStatus.COMPLETED,
                processingEndTime: new Date(),
                $push: {
                    statusHistory: {
                        status: Sample_model_1.SampleStatus.COMPLETED,
                        changedBy: new mongoose_1.Types.ObjectId(completedBy),
                        changedAt: new Date(),
                        notes: notes || 'Processing completed'
                    }
                }
            });
            return { modifiedCount: result.modifiedCount };
        }
        catch (error) {
            throw new ApiError_1.ApiError('Failed to complete processing', 500);
        }
    }
    async getSamplesByStatusCounts() {
        try {
            const pipeline = [
                {
                    $group: {
                        _id: '$collectionStatus',
                        count: { $sum: 1 }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalSamples: { $sum: '$count' },
                        statusCounts: {
                            $push: {
                                status: '$_id',
                                count: '$count'
                            }
                        }
                    }
                }
            ];
            const result = await Sample_model_1.SampleModel.aggregate(pipeline);
            return result[0] || { totalSamples: 0, statusCounts: [] };
        }
        catch (error) {
            throw new ApiError_1.ApiError('Failed to get status counts', 500);
        }
    }
    async searchSamples(query, limit = 20) {
        try {
            const searchRegex = new RegExp(query, 'i');
            return await Sample_model_1.SampleModel.find({
                $or: [
                    { sampleId: searchRegex },
                    { barcode: searchRegex },
                    { collectionNotes: searchRegex }
                ]
            })
                .populate('patient', 'firstName lastName patientId')
                .populate('order', 'orderNumber')
                .limit(limit)
                .exec();
        }
        catch (error) {
            throw new ApiError_1.ApiError('Failed to search samples', 500);
        }
    }
    async getCollectionStatistics(dateRange) {
        try {
            const matchStage = dateRange ? {
                createdAt: {
                    $gte: dateRange.start,
                    $lte: dateRange.end
                }
            } : {};
            const pipeline = [
                { $match: matchStage },
                {
                    $group: {
                        _id: '$collectionStatus',
                        count: { $sum: 1 }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalSamples: { $sum: '$count' },
                        statusBreakdown: {
                            $push: {
                                status: '$_id',
                                count: '$count'
                            }
                        }
                    }
                }
            ];
            const result = await Sample_model_1.SampleModel.aggregate(pipeline);
            return result[0] || { totalSamples: 0, statusBreakdown: [] };
        }
        catch (error) {
            throw new ApiError_1.ApiError('Failed to get collection statistics', 500);
        }
    }
}
exports.SampleService = SampleService;
