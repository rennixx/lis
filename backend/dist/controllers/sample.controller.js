"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SampleController = void 0;
const sample_service_1 = require("../services/sample.service");
const asyncHandler_1 = require("../utils/asyncHandler");
const ApiResponse_1 = require("../utils/ApiResponse");
const ApiError_1 = require("../utils/ApiError");
const sampleService = new sample_service_1.SampleService();
class SampleController {
    constructor() {
        this.createSample = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const sampleData = {
                ...req.body,
                createdBy: req.user?.id
            };
            const sample = await sampleService.createSample(sampleData);
            return ApiResponse_1.ApiResponse.success(res, 'Sample created successfully', {
                data: sample
            }, 201);
        });
        this.getSamples = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { page = 1, limit = 20, status, priority, sampleType, patientId, orderId, dateFrom, dateTo, collectedBy, search } = req.query;
            const filters = {};
            if (status)
                filters.status = status;
            if (priority)
                filters.priority = priority;
            if (sampleType)
                filters.sampleType = sampleType;
            if (patientId)
                filters.patientId = patientId;
            if (orderId)
                filters.orderId = orderId;
            if (collectedBy)
                filters.collectedBy = collectedBy;
            if (search)
                filters.search = search;
            if (dateFrom || dateTo) {
                filters.dateFrom = dateFrom ? new Date(dateFrom) : undefined;
                filters.dateTo = dateTo ? new Date(dateTo) : undefined;
            }
            const result = await sampleService.getSamples(filters, parseInt(page), parseInt(limit));
            return ApiResponse_1.ApiResponse.success(res, 'Samples retrieved successfully', {
                data: result.samples,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: result.total,
                    pages: result.pages
                }
            });
        });
        this.getSampleById = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { id } = req.params;
            const sample = await sampleService.getSampleById(id);
            if (!sample) {
                throw new ApiError_1.ApiError('Sample not found', 404);
            }
            return ApiResponse_1.ApiResponse.success(res, 'Sample retrieved successfully', {
                data: sample
            });
        });
        this.getSampleByBarcode = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { barcode } = req.params;
            const sample = await sampleService.getSampleByBarcode(barcode);
            if (!sample) {
                throw new ApiError_1.ApiError('Sample not found', 404);
            }
            return ApiResponse_1.ApiResponse.success(res, 'Sample retrieved successfully', {
                data: sample
            });
        });
        this.getPendingCollectionsQueue = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { limit = 50 } = req.query;
            const samples = await sampleService.getPendingCollectionsQueue(parseInt(limit));
            return ApiResponse_1.ApiResponse.success(res, 'Pending collections retrieved successfully', {
                data: samples
            });
        });
        this.confirmCollection = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { sampleId } = req.params;
            const collectionData = {
                ...req.body,
                collectedBy: req.user?.id
            };
            const sample = await sampleService.confirmCollection({
                sampleId,
                ...collectionData
            });
            return ApiResponse_1.ApiResponse.success(res, 'Sample collection confirmed successfully', {
                data: sample
            });
        });
        this.bulkUpdateStatus = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { sampleIds, newStatus, notes } = req.body;
            const result = await sampleService.bulkUpdateStatus({
                sampleIds,
                newStatus,
                notes,
                updatedBy: req.user?.id || ''
            });
            return ApiResponse_1.ApiResponse.success(res, 'Sample statuses updated successfully', {
                data: {
                    modifiedCount: result.modifiedCount,
                    message: `${result.modifiedCount} samples updated`
                }
            });
        });
        this.receiveSamples = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { sampleIds, notes } = req.body;
            const result = await sampleService.receiveSamples(sampleIds, req.user?.id || '', notes);
            return ApiResponse_1.ApiResponse.success(res, 'Samples received successfully', {
                data: {
                    modifiedCount: result.modifiedCount,
                    message: `${result.modifiedCount} samples received`
                }
            });
        });
        this.startProcessing = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { sampleIds, notes } = req.body;
            const result = await sampleService.startProcessing(sampleIds, req.user?.id || '', notes);
            return ApiResponse_1.ApiResponse.success(res, 'Processing started successfully', {
                data: {
                    modifiedCount: result.modifiedCount,
                    message: `${result.modifiedCount} samples started processing`
                }
            });
        });
        this.completeProcessing = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { sampleIds, notes } = req.body;
            const result = await sampleService.completeProcessing(sampleIds, req.user?.id || '', notes);
            return ApiResponse_1.ApiResponse.success(res, 'Processing completed successfully', {
                data: {
                    modifiedCount: result.modifiedCount,
                    message: `${result.modifiedCount} samples completed`
                }
            });
        });
        this.searchSamples = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { q, limit = 20 } = req.query;
            if (!q) {
                throw new ApiError_1.ApiError('Search query is required', 400);
            }
            const samples = await sampleService.searchSamples(q, parseInt(limit));
            return ApiResponse_1.ApiResponse.success(res, 'Samples found', {
                data: samples
            });
        });
        this.getCollectionStatistics = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { startDate, endDate } = req.query;
            let dateRange;
            if (startDate && endDate) {
                dateRange = {
                    start: new Date(startDate),
                    end: new Date(endDate)
                };
            }
            const stats = await sampleService.getCollectionStatistics(dateRange);
            return ApiResponse_1.ApiResponse.success(res, 'Collection statistics retrieved successfully', {
                data: stats
            });
        });
        this.getSamplesByStatusCounts = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const counts = await sampleService.getSamplesByStatusCounts();
            return ApiResponse_1.ApiResponse.success(res, 'Sample status counts retrieved successfully', {
                data: counts
            });
        });
        this.generateBarcode = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { id } = req.params;
            const sample = await sampleService.getSampleById(id);
            if (!sample) {
                throw new ApiError_1.ApiError('Sample not found', 404);
            }
            return ApiResponse_1.ApiResponse.success(res, 'Barcode retrieved successfully', {
                data: {
                    sampleId: sample.sampleId,
                    barcode: sample.barcode,
                    sampleType: sample.sampleType,
                    collectionDate: sample.actualCollectionTime || sample.scheduledCollectionTime
                }
            });
        });
        this.printSampleLabels = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { sampleIds } = req.body;
            const samples = await Promise.all(sampleIds.map((id) => sampleService.getSampleById(id)));
            const validSamples = samples.filter(sample => sample !== null);
            const labels = validSamples.map(sample => ({
                sampleId: sample.sampleId,
                barcode: sample.barcode,
                sampleType: sample.sampleType,
                priority: sample.priority,
                collectionDate: sample.actualCollectionTime || sample.scheduledCollectionTime
            }));
            return ApiResponse_1.ApiResponse.success(res, 'Sample labels generated successfully', {
                data: {
                    labels,
                    count: labels.length
                }
            });
        });
    }
}
exports.SampleController = SampleController;
