"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportController = void 0;
const report_validator_1 = require("../validators/report.validator");
const report_service_1 = require("../services/report.service");
const asyncHandler_1 = require("../utils/asyncHandler");
const ApiResponse_1 = require("../utils/ApiResponse");
const ApiError_1 = require("../utils/ApiError");
const reportService = new report_service_1.ReportService();
class ReportController {
    constructor() {
        this.createReport = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const validatedData = report_validator_1.ReportZodSchema.create.parse(req.body);
            validatedData.generatedBy = req.user.id;
            const report = await reportService.createReport(validatedData);
            return res.status(201).json(new ApiResponse_1.ApiResponse(201, 'Report created successfully', {
                data: report
            }));
        });
        this.getAllReports = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { page = 1, limit = 10, search, status, type, patientId, doctorId, confidentialityLevel, startDate, endDate, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
            const filters = {
                page: parseInt(page),
                limit: parseInt(limit),
                search: search,
                status: status,
                type: type,
                patientId: patientId,
                doctorId: doctorId,
                confidentialityLevel: confidentialityLevel,
                startDate: startDate,
                endDate: endDate,
                sortBy: sortBy,
                sortOrder: sortOrder
            };
            const result = await reportService.getAllReports(filters);
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'Reports retrieved successfully', {
                data: {
                    reports: result.reports,
                    pagination: {
                        page: filters.page,
                        limit: filters.limit,
                        total: result.total,
                        pages: Math.ceil(result.total / filters.limit)
                    }
                }
            }));
        });
        this.getReportById = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { reportId } = req.params;
            const report = await reportService.getReportById(reportId);
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'Report retrieved successfully', {
                data: report
            }));
        });
        this.getReportByNumber = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { reportNumber } = req.params;
            const report = await reportService.getReportByNumber(reportNumber);
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'Report retrieved successfully', {
                data: report
            }));
        });
        this.updateReport = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { reportId } = req.params;
            const validatedData = report_validator_1.ReportZodSchema.update.parse(req.body);
            const updatedReport = await reportService.updateReport(reportId, validatedData);
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'Report updated successfully', {
                data: updatedReport
            }));
        });
        this.updateReportSections = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { reportId } = req.params;
            const { sections } = report_validator_1.ReportZodSchema.updateSections.parse(req.body);
            const report = await reportService.updateReportSections(reportId, sections);
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'Report sections updated successfully', {
                data: report
            }));
        });
        this.updateReportContent = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { reportId } = req.params;
            const validatedData = report_validator_1.ReportZodSchema.updateContent.parse(req.body);
            const report = await reportService.updateReportContent(reportId, validatedData);
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'Report content updated successfully', {
                data: report
            }));
        });
        this.approveReport = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { reportId } = req.params;
            const userId = req.user.id;
            const userName = `${req.user.firstName} ${req.user.lastName}`;
            const report = await reportService.approveReport(reportId, userId, userName);
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'Report approved successfully', {
                data: report
            }));
        });
        this.deliverReport = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { reportId } = req.params;
            const { method } = report_validator_1.ReportZodSchema.deliver.parse(req.body);
            const userId = req.user.id;
            const report = await reportService.deliverReport(reportId, userId, method);
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'Report delivered successfully', {
                data: report
            }));
        });
        this.rejectReport = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { reportId } = req.params;
            const { reason } = report_validator_1.ReportZodSchema.reject.parse(req.body);
            const userId = req.user.id;
            const report = await reportService.rejectReport(reportId, userId, reason);
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'Report rejected successfully', {
                data: report
            }));
        });
        this.archiveReport = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { reportId } = req.params;
            const report = await reportService.archiveReport(reportId);
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'Report archived successfully', {
                data: report
            }));
        });
        this.amendReport = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { reportId } = req.params;
            const { reason, changes } = report_validator_1.ReportZodSchema.amend.parse(req.body);
            const userId = req.user.id;
            const report = await reportService.amendReport(reportId, userId, reason, changes);
            return res.status(201).json(new ApiResponse_1.ApiResponse(201, 'Report amended successfully', {
                data: report
            }));
        });
        this.getReportsByPatient = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { patientId } = req.params;
            const { limit = 50 } = req.query;
            const reports = await reportService.getReportsByPatient(patientId, parseInt(limit));
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'Reports by patient retrieved', {
                data: reports
            }));
        });
        this.getReportsByDoctor = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { doctorId } = req.params;
            const { limit = 50 } = req.query;
            const reports = await reportService.getReportsByDoctor(doctorId, parseInt(limit));
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'Reports by doctor retrieved', {
                data: reports
            }));
        });
        this.getPendingApprovalReports = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { limit = 20 } = req.query;
            const reports = await reportService.getPendingApprovalReports(parseInt(limit));
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'Pending approval reports retrieved', {
                data: reports
            }));
        });
        this.getDeliveredReports = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { days = 30, limit = 50 } = req.query;
            const reports = await reportService.getDeliveredReports(parseInt(days), parseInt(limit));
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'Delivered reports retrieved', {
                data: reports
            }));
        });
        this.getReportStatistics = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { startDate, endDate } = req.query;
            let dateRange;
            if (startDate && endDate) {
                dateRange = {
                    start: new Date(startDate),
                    end: new Date(endDate)
                };
            }
            const statistics = await reportService.getReportStatistics(dateRange);
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'Report statistics retrieved', {
                data: statistics
            }));
        });
        this.searchReports = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { q, limit = 20 } = req.query;
            if (!q) {
                throw new ApiError_1.ApiError(400, 'Search query is required');
            }
            const reports = await reportService.searchReports(q, parseInt(limit));
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'Reports search completed', {
                data: reports
            }));
        });
        this.getReportVersions = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { reportId } = req.params;
            const reports = await reportService.getReportVersions(reportId);
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'Report versions retrieved', {
                data: reports
            }));
        });
        this.addTag = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { reportId } = req.params;
            const { tag } = report_validator_1.ReportZodSchema.addTag.parse(req.body);
            const report = await reportService.addTagToReport(reportId, tag);
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'Tag added successfully', {
                data: {
                    id: report.id,
                    tags: report.tags
                }
            }));
        });
        this.removeTag = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { reportId } = req.params;
            const { tag } = report_validator_1.ReportZodSchema.removeTag.parse(req.body);
            const report = await reportService.removeTagFromReport(reportId, tag);
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'Tag removed successfully', {
                data: {
                    id: report.id,
                    tags: report.tags
                }
            }));
        });
        this.generatePDF = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { reportId } = req.params;
            const pdfData = await reportService.generateReportPDF(reportId);
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'Report PDF generated successfully', {
                data: pdfData
            }));
        });
    }
}
exports.ReportController = ReportController;
