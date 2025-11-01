"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResultController = void 0;
const result_validator_1 = require("../validators/result.validator");
const result_service_1 = require("../services/result.service");
const asyncHandler_1 = require("../utils/asyncHandler");
const ApiResponse_1 = require("../utils/ApiResponse");
const ApiError_1 = require("../utils/ApiError");
const resultService = new result_service_1.ResultService();
class ResultController {
    constructor() {
        this.createResult = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const validatedData = result_validator_1.ResultZodSchema.create.parse(req.body);
            validatedData.enteredBy = req.user.id;
            const result = await resultService.createResult(validatedData);
            return res.status(201).json(new ApiResponse_1.ApiResponse(201, 'Result created successfully', {
                data: result
            }));
        });
        this.getAllResults = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { page = 1, limit = 10, search, status, patientId, testId, orderId, criticalValue, isAbnormal, startDate, endDate, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
            const filters = {
                page: parseInt(page),
                limit: parseInt(limit),
                search: search,
                status: status,
                patientId: patientId,
                testId: testId,
                orderId: orderId,
                criticalValue: criticalValue === 'true' ? true : criticalValue === 'false' ? false : undefined,
                isAbnormal: isAbnormal === 'true' ? true : isAbnormal === 'false' ? false : undefined,
                startDate: startDate,
                endDate: endDate,
                sortBy: sortBy,
                sortOrder: sortOrder
            };
            const result = await resultService.getAllResults(filters);
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'Results retrieved successfully', {
                data: {
                    results: result.results,
                    pagination: {
                        page: filters.page,
                        limit: filters.limit,
                        total: result.total,
                        pages: Math.ceil(result.total / filters.limit)
                    }
                }
            }));
        });
        this.getResultById = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { resultId } = req.params;
            const result = await resultService.getResultById(resultId);
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'Result retrieved successfully', {
                data: result
            }));
        });
        this.updateResult = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { resultId } = req.params;
            const validatedData = result_validator_1.ResultZodSchema.update.parse(req.body);
            const updatedResult = await resultService.updateResult(resultId, validatedData);
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'Result updated successfully', {
                data: updatedResult
            }));
        });
        this.updateResultValue = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { resultId } = req.params;
            const { value } = result_validator_1.ResultZodSchema.updateValue.parse(req.body);
            const userId = req.user.id;
            const result = await resultService.updateResultValue(resultId, value, userId);
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'Result value updated successfully', {
                data: result
            }));
        });
        this.verifyResult = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { resultId } = req.params;
            const userId = req.user.id;
            const userName = `${req.user.firstName} ${req.user.lastName}`;
            const result = await resultService.verifyResult(resultId, userId, userName);
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'Result verified successfully', {
                data: result
            }));
        });
        this.rejectResult = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { resultId } = req.params;
            const { reason } = result_validator_1.ResultZodSchema.reject.parse(req.body);
            const userId = req.user.id;
            const result = await resultService.rejectResult(resultId, userId, reason);
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'Result rejected successfully', {
                data: result
            }));
        });
        this.markAsCritical = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { resultId } = req.params;
            const result = await resultService.markResultAsCritical(resultId);
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'Result marked as critical', {
                data: result
            }));
        });
        this.getResultsByOrder = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { orderId } = req.params;
            const results = await resultService.getResultsByOrder(orderId);
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'Results by order retrieved', {
                data: results
            }));
        });
        this.getResultsByPatient = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { patientId } = req.params;
            const { limit = 100 } = req.query;
            const results = await resultService.getResultsByPatient(patientId, parseInt(limit));
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'Results by patient retrieved', {
                data: results
            }));
        });
        this.getCriticalResults = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const results = await resultService.getCriticalResults();
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'Critical results retrieved', {
                data: results
            }));
        });
        this.getAbnormalResults = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { limit = 50 } = req.query;
            const results = await resultService.getAbnormalResults(parseInt(limit));
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'Abnormal results retrieved', {
                data: results
            }));
        });
        this.getResultsForReview = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { limit = 20 } = req.query;
            const results = await resultService.getResultsForReview(parseInt(limit));
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'Results for review retrieved', {
                data: results
            }));
        });
        this.bulkVerifyResults = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { resultIds } = result_validator_1.ResultZodSchema.bulkVerify.parse(req.body);
            const userId = req.user.id;
            const userName = `${req.user.firstName} ${req.user.lastName}`;
            const result = await resultService.bulkVerifyResults(resultIds, userId, userName);
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'Results verified successfully', {
                data: result
            }));
        });
        this.bulkRejectResults = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { resultIds, reason } = result_validator_1.ResultZodSchema.bulkReject.parse(req.body);
            const userId = req.user.id;
            const result = await resultService.bulkRejectResults(resultIds, userId, reason);
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'Results rejected successfully', {
                data: result
            }));
        });
        this.addComment = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { resultId } = req.params;
            const { comment } = result_validator_1.ResultZodSchema.addComment.parse(req.body);
            const result = await resultService.addCommentToResult(resultId, comment);
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'Comment added successfully', {
                data: result
            }));
        });
        this.getResultStatistics = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { startDate, endDate } = req.query;
            let dateRange;
            if (startDate && endDate) {
                dateRange = {
                    start: new Date(startDate),
                    end: new Date(endDate)
                };
            }
            const statistics = await resultService.getResultStatistics(dateRange);
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'Result statistics retrieved', {
                data: statistics
            }));
        });
        this.searchResults = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { q, limit = 20 } = req.query;
            if (!q) {
                throw new ApiError_1.ApiError(400, 'Search query is required');
            }
            const results = await resultService.searchResults(q, parseInt(limit));
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'Results search completed', {
                data: results
            }));
        });
    }
}
exports.ResultController = ResultController;
