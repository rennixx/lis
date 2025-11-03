"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResultController = void 0;
const result_validator_1 = require("../validators/result.validator");
const result_service_1 = require("../services/result.service");
const pdfResult_service_1 = require("../services/pdfResult.service");
const gridfs_1 = require("../utils/gridfs");
const asyncHandler_1 = require("../utils/asyncHandler");
const ApiResponse_1 = require("../utils/ApiResponse");
const ApiError_1 = require("../utils/ApiError");
const result_schema_1 = require("../schemas/result.schema");
const resultService = new result_service_1.ResultService();
const pdfResultService = new pdfResult_service_1.PDFResultService();
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
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
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
        this.bulkCreateResults = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { results } = req.body;
            const userId = req.user.id;
            const createdResults = await resultService.createBulkResults(results, userId);
            return res.status(201).json(new ApiResponse_1.ApiResponse(201, 'Bulk results created successfully', {
                data: createdResults
            }));
        });
        this.generateResultPDF = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { resultId } = req.params;
            const { template = 'standard', includePatientInfo = true, includeLabInfo = true } = req.body;
            console.log(`🔧 [RESULT PDF] Generating PDF for result: ${resultId}`);
            const result = await result_schema_1.Result.findById(resultId)
                .populate('patient')
                .populate('order')
                .populate('test')
                .populate('enteredBy', 'firstName lastName')
                .populate('verifiedBy', 'firstName lastName')
                .lean();
            if (!result) {
                console.log(`❌ [RESULT PDF] Result not found: ${resultId}`);
                throw new ApiError_1.ApiError(404, 'Result not found');
            }
            console.log(`✅ [RESULT PDF] Result found: ${result.testName}`);
            if (result.pdfFileId) {
                console.log(`🔧 [RESULT PDF] PDF already exists for result: ${resultId}`);
                return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'PDF already exists for this result', {
                    pdfFileId: result.pdfFileId,
                    message: 'PDF already generated'
                }));
            }
            try {
                const pdfGenerationPromise = pdfResultService.generateResultPDF({
                    result,
                    patient: result.patient,
                    order: result.order,
                    test: result.test
                }, {
                    template,
                    includePatientInfo,
                    includeLabInfo
                });
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('PDF generation timeout')), 25000);
                });
                const pdfResult = await Promise.race([pdfGenerationPromise, timeoutPromise]);
                console.log(`✅ [RESULT PDF] PDF generated successfully for result: ${resultId}`);
                let pdfFileId = null;
                try {
                    const uploadPromise = (0, gridfs_1.uploadPDFToGridFS)(pdfResult.fileBuffer, pdfResult.filename, {
                        resultId: result._id.toString(),
                        template,
                        generatedBy: req.user?.id,
                        generatedAt: new Date(),
                        fileSize: pdfResult.fileSize
                    });
                    const uploadTimeoutPromise = new Promise((_, reject) => {
                        setTimeout(() => reject(new Error('GridFS upload timeout')), 20000);
                    });
                    pdfFileId = await Promise.race([uploadPromise, uploadTimeoutPromise]);
                    console.log(`✅ [RESULT PDF] PDF uploaded to GridFS: ${pdfFileId}`);
                }
                catch (uploadError) {
                    console.warn(`⚠️ [RESULT PDF] GridFS upload failed, returning PDF directly:`, uploadError);
                    res.setHeader('Content-Type', 'application/pdf');
                    res.setHeader('Content-Disposition', `attachment; filename="${pdfResult.filename}"`);
                    res.setHeader('Content-Length', pdfResult.fileSize);
                    return res.send(pdfResult.fileBuffer);
                }
                await result_schema_1.Result.findByIdAndUpdate(resultId, {
                    pdfFileId,
                    pdfGeneration: {
                        generatedAt: new Date(),
                        pdfVersion: '1.0',
                        generationTime: Date.now() - Date.now(),
                        templateUsed: template
                    }
                });
                console.log(`🔧 [RESULT PDF] Result updated with PDF file ID: ${pdfFileId}`);
                return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'Result PDF generated successfully', {
                    pdfFileId,
                    filename: pdfResult.filename,
                    fileSize: pdfResult.fileSize,
                    message: 'PDF generated and saved successfully'
                }));
            }
            catch (error) {
                console.error(`❌ [RESULT PDF] PDF generation failed for result: ${resultId}`, error);
                throw new ApiError_1.ApiError(500, 'Failed to generate result PDF');
            }
        });
        this.downloadResultPDF = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { resultId } = req.params;
            console.log(`🔧 [RESULT PDF] Downloading PDF for result: ${resultId}`);
            const result = await result_schema_1.Result.findById(resultId);
            if (!result) {
                console.log(`❌ [RESULT PDF] Result not found: ${resultId}`);
                throw new ApiError_1.ApiError(404, 'Result not found');
            }
            let pdfBuffer;
            let filename;
            try {
                if (result.pdfFileId) {
                    try {
                        pdfBuffer = await (0, gridfs_1.downloadPDFFromGridFS)(result.pdfFileId);
                        console.log(`🔧 [RESULT PDF] PDF downloaded from GridFS successfully`);
                        filename = `Result_${result.testCode || result.testName}_${new Date().toISOString().split('T')[0]}.pdf`;
                    }
                    catch (gridfsError) {
                        console.warn(`🔧 [RESULT PDF] GridFS download failed, generating PDF on-demand:`, gridfsError);
                        const populatedResult = await result_schema_1.Result.findById(resultId)
                            .populate('patient')
                            .populate('order')
                            .populate('test')
                            .lean();
                        const pdfResult = await pdfResultService.generateResultPDF({
                            result: populatedResult,
                            patient: populatedResult.patient,
                            order: populatedResult.order,
                            test: populatedResult.test
                        }, { template: 'standard' });
                        pdfBuffer = pdfResult.fileBuffer;
                        filename = pdfResult.filename;
                        console.log(`🔧 [RESULT PDF] PDF generated on-demand successfully`);
                    }
                }
                else {
                    console.log(`🔧 [RESULT PDF] No PDF exists, generating on-demand`);
                    const populatedResult = await result_schema_1.Result.findById(resultId)
                        .populate('patient')
                        .populate('order')
                        .populate('test')
                        .lean();
                    const pdfResult = await pdfResultService.generateResultPDF({
                        result: populatedResult,
                        patient: populatedResult.patient,
                        order: populatedResult.order,
                        test: populatedResult.test
                    }, { template: 'standard' });
                    pdfBuffer = pdfResult.fileBuffer;
                    filename = pdfResult.filename;
                    console.log(`🔧 [RESULT PDF] PDF generated on-demand successfully`);
                }
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
                res.setHeader('Content-Length', pdfBuffer.length);
                res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
                res.setHeader('Pragma', 'no-cache');
                res.setHeader('Expires', '0');
                console.log(`🔧 [RESULT PDF] Sending PDF buffer (${pdfBuffer.length} bytes)`);
                return res.send(pdfBuffer);
            }
            catch (error) {
                console.error(`❌ [RESULT PDF] Failed to download PDF for result: ${resultId}`, error);
                throw new ApiError_1.ApiError(500, 'Failed to download result PDF');
            }
        });
        this.viewResultPDF = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { resultId } = req.params;
            console.log(`🔧 [RESULT PDF] Viewing PDF for result: ${resultId}`);
            const result = await result_schema_1.Result.findById(resultId);
            if (!result) {
                console.log(`❌ [RESULT PDF] Result not found: ${resultId}`);
                throw new ApiError_1.ApiError(404, 'Result not found');
            }
            let pdfBuffer;
            let filename;
            try {
                if (result.pdfFileId) {
                    try {
                        pdfBuffer = await (0, gridfs_1.downloadPDFFromGridFS)(result.pdfFileId);
                        console.log(`🔧 [RESULT PDF] PDF downloaded from GridFS successfully`);
                        filename = `Result_${result.testCode || result.testName}_${new Date().toISOString().split('T')[0]}.pdf`;
                    }
                    catch (gridfsError) {
                        console.warn(`🔧 [RESULT PDF] GridFS download failed, generating PDF on-demand:`, gridfsError);
                        const populatedResult = await result_schema_1.Result.findById(resultId)
                            .populate('patient')
                            .populate('order')
                            .populate('test')
                            .lean();
                        const pdfResult = await pdfResultService.generateResultPDF({
                            result: populatedResult,
                            patient: populatedResult.patient,
                            order: populatedResult.order,
                            test: populatedResult.test
                        }, { template: 'standard' });
                        pdfBuffer = pdfResult.fileBuffer;
                        filename = pdfResult.filename;
                        console.log(`🔧 [RESULT PDF] PDF generated on-demand successfully`);
                    }
                }
                else {
                    console.log(`🔧 [RESULT PDF] No PDF exists, generating on-demand`);
                    const populatedResult = await result_schema_1.Result.findById(resultId)
                        .populate('patient')
                        .populate('order')
                        .populate('test')
                        .lean();
                    const pdfResult = await pdfResultService.generateResultPDF({
                        result: populatedResult,
                        patient: populatedResult.patient,
                        order: populatedResult.order,
                        test: populatedResult.test
                    }, { template: 'standard' });
                    pdfBuffer = pdfResult.fileBuffer;
                    filename = pdfResult.filename;
                    console.log(`🔧 [RESULT PDF] PDF generated on-demand successfully`);
                }
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
                res.setHeader('Content-Length', pdfBuffer.length);
                res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
                res.setHeader('Pragma', 'no-cache');
                res.setHeader('Expires', '0');
                console.log(`🔧 [RESULT PDF] Sending PDF buffer for inline viewing (${pdfBuffer.length} bytes)`);
                return res.send(pdfBuffer);
            }
            catch (error) {
                console.error(`❌ [RESULT PDF] Failed to view PDF for result: ${resultId}`, error);
                throw new ApiError_1.ApiError(500, 'Failed to view result PDF');
            }
        });
    }
}
exports.ResultController = ResultController;
