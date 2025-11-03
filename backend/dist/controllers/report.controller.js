"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportController = void 0;
const report_service_1 = require("../services/report.service");
const asyncHandler_1 = require("../utils/asyncHandler");
const ApiResponse_1 = require("../utils/ApiResponse");
const ApiError_1 = require("../utils/ApiError");
const reportService = new report_service_1.ReportService();
class ReportController {
    constructor() {
        this.generateReportFromOrder = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { orderId } = req.params;
            const { template, includeBarcode, includeQR } = req.body;
            const userId = req.user.id;
            const userName = `${req.user.firstName} ${req.user.lastName}`;
            const options = {
                template: template || 'standard',
                includeBarcode: includeBarcode || false,
                includeQR: includeQR || false,
                autoGeneratePDF: true
            };
            const report = await reportService.generateReportFromOrder(orderId, userId, userName, options);
            return res.status(201).json(new ApiResponse_1.ApiResponse(201, 'Report generated successfully', {
                data: report
            }));
        });
        this.generatePDFForReport = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { reportId } = req.params;
            const { template, includeBarcode, includeQR } = req.body;
            const options = {
                template: template || 'standard',
                includeBarcode: includeBarcode || false,
                includeQR: includeQR || false
            };
            const result = await reportService.generatePDFForReport(reportId, options);
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'PDF generated successfully', {
                data: result
            }));
        });
        this.downloadReportPDF = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { reportId } = req.params;
            const { pdfBuffer, filename } = await reportService.downloadReportPDF(reportId);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.setHeader('Content-Length', pdfBuffer.length);
            res.send(pdfBuffer);
        });
        this.viewReportPDF = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { reportId } = req.params;
            const { pdfBuffer, filename } = await reportService.downloadReportPDF(reportId);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
            res.setHeader('Content-Length', pdfBuffer.length);
            res.send(pdfBuffer);
        });
        this.generateBulkReports = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { orderIds, template, includeBarcode, includeQR } = req.body;
            const userId = req.user.id;
            const userName = `${req.user.firstName} ${req.user.lastName}`;
            if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
                throw new ApiError_1.ApiError(400, 'Order IDs array is required');
            }
            const options = {
                template: template || 'standard',
                includeBarcode: includeBarcode || false,
                includeQR: includeQR || false
            };
            const results = await reportService.generateBulkReports(orderIds, userId, userName, options);
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'Bulk reports generation completed', {
                data: results
            }));
        });
        this.getAllReports = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { page = 1, limit = 20, patientId, doctorId, status, type, dateFrom, dateTo, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
            const filters = {
                page: parseInt(page),
                limit: parseInt(limit),
                patientId: patientId,
                doctorId: doctorId,
                status: status,
                type: type,
                dateFrom: dateFrom ? new Date(dateFrom) : undefined,
                dateTo: dateTo ? new Date(dateTo) : undefined,
                sortBy: sortBy,
                sortOrder: sortOrder
            };
            const result = await reportService.getReports(filters);
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'Reports retrieved successfully', {
                data: {
                    reports: result.reports,
                    pagination: {
                        page: filters.page,
                        limit: filters.limit,
                        total: result.total,
                        pages: result.pages
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
        this.updateReportStatus = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { reportId } = req.params;
            const { status, notes } = req.body;
            const userId = req.user.id;
            const userName = `${req.user.firstName} ${req.user.lastName}`;
            if (!status) {
                throw new ApiError_1.ApiError(400, 'Status is required');
            }
            const report = await reportService.updateReportStatus(reportId, status, userId, userName, notes);
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'Report status updated successfully', {
                data: report
            }));
        });
        this.deleteReport = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { reportId } = req.params;
            const result = await reportService.deleteReport(reportId);
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'Report deleted successfully', {
                data: { deleted: result }
            }));
        });
        this.getReportStatistics = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { startDate, endDate } = req.query;
            let dateFilter = { isActive: true };
            if (startDate && endDate) {
                dateFilter.createdAt = {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                };
            }
            const Report = require('../schemas/report.schema').Report;
            const reports = await Report.find(dateFilter).lean();
            const statistics = {
                total: reports.length,
                draft: reports.filter(r => r.status === 'draft').length,
                pendingReview: reports.filter(r => r.status === 'pending_review').length,
                approved: reports.filter(r => r.status === 'approved').length,
                delivered: reports.filter(r => r.status === 'delivered').length,
                rejected: reports.filter(r => r.status === 'rejected').length,
                archived: reports.filter(r => r.status === 'archived').length,
                byType: {
                    preliminary: reports.filter(r => r.type === 'preliminary').length,
                    final: reports.filter(r => r.type === 'final').length,
                    amended: reports.filter(r => r.type === 'amended').length,
                    corrected: reports.filter(r => r.type === 'corrected').length
                },
                generatedToday: reports.filter(r => {
                    const today = new Date();
                    const reportDate = new Date(r.createdAt);
                    return reportDate.toDateString() === today.toDateString();
                }).length,
                pdfGenerated: reports.filter((r) => r.pdfFileId).length
            };
            console.log('Statistics calculated:', statistics);
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'Report statistics retrieved successfully', {
                data: statistics
            }));
        });
        this.searchReports = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { q, limit = 20 } = req.query;
            if (!q) {
                throw new ApiError_1.ApiError(400, 'Search query is required');
            }
            const { reports } = await reportService.getReports({
                limit: parseInt(limit),
                sortBy: 'createdAt',
                sortOrder: 'desc'
            });
            const searchResults = reports.filter((report) => {
                const query = q.toLowerCase();
                return (report.reportNumber?.toLowerCase().includes(query) ||
                    report.patientName?.toLowerCase().includes(query) ||
                    report.patientMRN?.toLowerCase().includes(query) ||
                    report.doctorName?.toLowerCase().includes(query) ||
                    report.orderNumber?.toLowerCase().includes(query));
            });
            return res.status(200).json(new ApiResponse_1.ApiResponse(200, 'Reports search completed', {
                data: searchResults
            }));
        });
    }
}
exports.ReportController = ReportController;
