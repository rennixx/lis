"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportService = void 0;
const report_schema_1 = require("../schemas/report.schema");
const order_schema_1 = require("../schemas/order.schema");
const result_schema_1 = require("../schemas/result.schema");
const pdfReport_service_1 = require("./pdfReport.service");
const gridfs_1 = require("../utils/gridfs");
const ApiError_1 = require("../utils/ApiError");
const mongoose_1 = require("mongoose");
const mongoose_2 = __importDefault(require("mongoose"));
const moment_1 = __importDefault(require("moment"));
class ReportService {
    constructor() {
        this.pdfService = new pdfReport_service_1.PDFReportService();
    }
    async generateReportFromOrder(orderId, userId, userName, options = {}) {
        try {
            const order = await order_schema_1.Order.findById(orderId)
                .populate('patient')
                .populate('doctorId')
                .populate('tests')
                .lean();
            if (!order) {
                throw new ApiError_1.ApiError('Order not found', 404);
            }
            const results = await result_schema_1.Result.find({ order: orderId })
                .populate('test')
                .lean();
            if (results.length === 0) {
                throw new ApiError_1.ApiError('No results found for this order', 400);
            }
            const unverifiedResults = results.filter(r => r.status !== 'verified');
            if (unverifiedResults.length > 0) {
                throw new ApiError_1.ApiError('All results must be verified before generating report', 400);
            }
            const reportNumber = await this.generateReportNumber();
            const reportData = {
                reportNumber,
                order: order._id,
                orderNumber: order.orderNumber,
                patient: order.patient._id,
                patientName: `${order.patient.firstName} ${order.patient.lastName}`,
                patientMRN: order.patient.mrn,
                patientInfo: {
                    name: `${order.patient.firstName} ${order.patient.lastName}`,
                    age: order.patient.age,
                    gender: order.patient.gender,
                    contact: order.patient.phone || order.patient.email
                },
                doctor: order.doctorId,
                doctorName: `${order.doctorId.firstName} ${order.doctorId.lastName}`,
                tests: order.tests,
                results: results.map(r => r._id),
                type: 'final',
                status: 'generated',
                clinicalInformation: order.clinicalInformation,
                requestingDoctor: {
                    name: `${order.doctorId.firstName} ${order.doctorId.lastName}`,
                    department: order.department
                },
                generatedBy: new mongoose_1.Types.ObjectId(userId),
                generatedByUser: userName,
                summary: this.generateReportSummary(results),
                conclusion: this.generateReportConclusion(results),
                recommendations: this.generateRecommendations(results),
                reportGeneration: {
                    generatedAt: new Date(),
                    templateUsed: options.template || 'standard'
                }
            };
            const report = new report_schema_1.Report(reportData);
            await report.save();
            if (options.autoGeneratePDF !== false) {
                await this.generatePDFForReport(report._id.toString(), options);
            }
            return report;
        }
        catch (error) {
            console.error('Error generating report:', error);
            if (error instanceof ApiError_1.ApiError) {
                throw error;
            }
            throw new ApiError_1.ApiError('Failed to generate report', 500);
        }
    }
    async generatePDFForReport(reportId, options = {}) {
        try {
            const report = await report_schema_1.Report.findById(reportId).lean();
            if (!report) {
                throw new ApiError_1.ApiError('Report not found', 404);
            }
            let populatedOrder = null;
            let populatedPatient = null;
            let populatedDoctor = null;
            let populatedTests = [];
            try {
                if (report.order && mongoose_2.default.Types.ObjectId.isValid(report.order)) {
                    populatedOrder = await mongoose_2.default.model('Order').findById(report.order).lean();
                }
            }
            catch (error) {
                console.warn('Error populating order:', error.message);
                populatedOrder = null;
            }
            try {
                if (report.patient && mongoose_2.default.Types.ObjectId.isValid(report.patient)) {
                    populatedPatient = await mongoose_2.default.model('Patient').findById(report.patient).lean();
                }
            }
            catch (error) {
                console.warn('Error populating patient:', error.message);
                populatedPatient = null;
            }
            try {
                if (report.doctor && mongoose_2.default.Types.ObjectId.isValid(report.doctor)) {
                    populatedDoctor = await mongoose_2.default.model('Doctor').findById(report.doctor).lean();
                }
            }
            catch (error) {
                console.warn('Error populating doctor:', error.message);
                populatedDoctor = null;
            }
            try {
                if (report.tests && Array.isArray(report.tests)) {
                    const validTestIds = report.tests.filter(id => id && mongoose_2.default.Types.ObjectId.isValid(id));
                    if (validTestIds.length > 0) {
                        populatedTests = await mongoose_2.default.model('Test').find({
                            _id: { $in: validTestIds }
                        }).lean();
                    }
                }
            }
            catch (error) {
                console.warn('Error populating tests:', error.message);
                populatedTests = [];
            }
            let detailedResults = [];
            if (report.results && Array.isArray(report.results)) {
                try {
                    detailedResults = await result_schema_1.Result.find({
                        _id: { $in: report.results.filter(id => id && mongoose_2.default.Types.ObjectId.isValid(id)) }
                    })
                        .populate('test')
                        .lean();
                }
                catch (error) {
                    console.warn('Error populating results for PDF:', error.message);
                }
            }
            const pdfData = {
                order: populatedOrder,
                patient: populatedPatient || {
                    name: report.patientName || 'Unknown Patient',
                    mrn: report.patientMRN || 'N/A'
                },
                doctor: populatedDoctor || {
                    name: report.doctorName || 'Unknown Doctor'
                },
                tests: populatedTests,
                results: detailedResults,
                reportNumber: report.reportNumber,
                reportDate: new Date(),
                clinicalInformation: report.clinicalNotes,
                summary: report.summary,
                conclusion: report.conclusion,
                recommendations: report.recommendations
            };
            console.log('🔧 [REPORT] Generating PDF buffer...');
            const { fileBuffer, filename: generatedFilename, fileSize: generatedFileSize } = await this.pdfService.generateReportPDF(pdfData, options);
            console.log('🔧 [REPORT] PDF buffer generated, size:', generatedFileSize, 'bytes');
            let fileId, filename, fileSize;
            try {
                console.log('🔧 [REPORT] Attempting to save PDF to GridFS...');
                const result = await this.pdfService.savePDFToGridFS(pdfData, reportId, options);
                fileId = result.fileId;
                filename = result.filename;
                fileSize = result.fileSize;
                console.log('🔧 [REPORT] PDF saved to GridFS successfully');
            }
            catch (gridfsError) {
                console.error('🔧 [REPORT] GridFS upload failed:', gridfsError.message);
                console.log('🔧 [REPORT] Using fallback PDF storage');
                fileId = new mongoose_2.default.Types.ObjectId();
                filename = generatedFilename;
                fileSize = generatedFileSize;
            }
            await report_schema_1.Report.findByIdAndUpdate(reportId, {
                pdfFileId: fileId,
                pdfFileName: filename,
                pdfFileSize: fileSize,
                'reportGeneration.generatedAt': new Date(),
                'reportGeneration.generationTime': Date.now()
            });
            console.log('🔧 [REPORT] Report updated with PDF information');
            return { fileId, filename, fileSize };
        }
        catch (error) {
            console.error('Error generating PDF for report:', error);
            if (error instanceof ApiError_1.ApiError) {
                throw error;
            }
            throw new ApiError_1.ApiError('Failed to generate PDF', 500);
        }
    }
    async downloadReportPDF(reportId) {
        try {
            const report = await report_schema_1.Report.findById(reportId);
            if (!report) {
                throw new ApiError_1.ApiError('Report not found', 404);
            }
            if (!report.pdfFileId) {
                throw new ApiError_1.ApiError('PDF not generated for this report', 404);
            }
            let pdfBuffer;
            try {
                console.log('🔧 [PDF] Attempting to download PDF from GridFS...');
                pdfBuffer = await (0, gridfs_1.downloadPDFFromGridFS)(report.pdfFileId);
                console.log('🔧 [PDF] PDF downloaded from GridFS successfully');
            }
            catch (gridfsError) {
                console.warn('🔧 [PDF] GridFS download failed, generating PDF on-demand:', gridfsError.message);
                console.log('🔧 [PDF] Generating PDF on-demand...');
                const populatedOrder = report.order && mongoose_2.default.Types.ObjectId.isValid(report.order)
                    ? await mongoose_2.default.model('Order').findById(report.order).lean()
                    : null;
                const populatedPatient = report.patient && mongoose_2.default.Types.ObjectId.isValid(report.patient)
                    ? await mongoose_2.default.model('Patient').findById(report.patient).lean()
                    : null;
                const populatedDoctor = report.doctor && mongoose_2.default.Types.ObjectId.isValid(report.doctor)
                    ? await mongoose_2.default.model('Doctor').findById(report.doctor).lean()
                    : null;
                const pdfData = {
                    order: populatedOrder,
                    patient: populatedPatient || {
                        name: report.patientName || 'Unknown Patient',
                        mrn: report.patientMRN || 'N/A'
                    },
                    doctor: populatedDoctor || {
                        name: report.doctorName || 'Unknown Doctor'
                    },
                    tests: report.tests || [],
                    results: report.results || [],
                    reportNumber: report.reportNumber,
                    reportDate: new Date(),
                    clinicalInformation: report.clinicalNotes,
                    summary: report.summary,
                    conclusion: report.conclusion,
                    recommendations: report.recommendations
                };
                const result = await this.pdfService.generateReportPDF(pdfData);
                pdfBuffer = result.fileBuffer;
                console.log('🔧 [PDF] PDF generated on-demand successfully');
            }
            await report_schema_1.Report.findByIdAndUpdate(reportId, {
                $inc: { 'metadata.downloadCount': 1 }
            });
            const filename = report.pdfFileName || `Report_${report.reportNumber}.pdf`;
            return { pdfBuffer, filename };
        }
        catch (error) {
            console.error('Error downloading PDF:', error);
            if (error instanceof ApiError_1.ApiError) {
                throw error;
            }
            throw new ApiError_1.ApiError('Failed to download PDF', 500);
        }
    }
    async generateBulkReports(orderIds, userId, userName, options = {}) {
        const results = [];
        for (const orderId of orderIds) {
            try {
                const report = await this.generateReportFromOrder(orderId, userId, userName, options);
                const pdfResult = report.pdfFileId ? {
                    fileId: report.pdfFileId,
                    filename: report.pdfFileName
                } : null;
                results.push({
                    reportId: report._id.toString(),
                    ...pdfResult
                });
            }
            catch (error) {
                results.push({
                    reportId: '',
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
        return results;
    }
    async getReports(filters = {}) {
        try {
            const { patientId, doctorId, status, type, dateFrom, dateTo, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = filters;
            const query = { isActive: true };
            if (patientId)
                query.patient = new mongoose_1.Types.ObjectId(patientId);
            if (doctorId)
                query.doctor = new mongoose_1.Types.ObjectId(doctorId);
            if (status)
                query.status = status;
            if (type)
                query.type = type;
            if (dateFrom || dateTo) {
                query.createdAt = {};
                if (dateFrom)
                    query.createdAt.$gte = dateFrom;
                if (dateTo)
                    query.createdAt.$lte = dateTo;
            }
            const sort = {};
            sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
            const skip = (page - 1) * limit;
            const [reports, total] = await Promise.all([
                report_schema_1.Report.find(query)
                    .populate('patient', 'firstName lastName mrn')
                    .populate('doctor', 'firstName lastName')
                    .sort(sort)
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                report_schema_1.Report.countDocuments(query)
            ]);
            console.log('Query:', query);
            console.log('Reports found:', reports.length);
            console.log('Total count:', total);
            console.log('First report data:', reports.length > 0 ? JSON.stringify(reports[0], null, 2) : 'No reports');
            const pages = Math.ceil(total / limit);
            return {
                reports: reports,
                total,
                page,
                limit,
                pages
            };
        }
        catch (error) {
            console.error('Error getting reports:', error);
            throw new ApiError_1.ApiError('Failed to get reports', 500);
        }
    }
    async getReportById(reportId) {
        try {
            const report = await report_schema_1.Report.findById(reportId)
                .populate('order')
                .populate('patient', 'firstName lastName mrn age gender phone email')
                .populate('doctor', 'firstName lastName department')
                .populate('tests', 'name code category unit normalRange')
                .populate('results')
                .lean();
            if (!report) {
                throw new ApiError_1.ApiError('Report not found', 404);
            }
            return report;
        }
        catch (error) {
            console.error('Error getting report:', error);
            if (error instanceof ApiError_1.ApiError) {
                throw error;
            }
            throw new ApiError_1.ApiError('Failed to get report', 500);
        }
    }
    async updateReportStatus(reportId, status, userId, userName, notes) {
        try {
            const updateData = {
                status,
                updatedAt: new Date()
            };
            if (status === 'approved') {
                updateData.approvedBy = new mongoose_1.Types.ObjectId(userId);
                updateData.approvedByUser = userName;
                updateData.approvedAt = new Date();
            }
            else if (status === 'delivered') {
                updateData.deliveredBy = new mongoose_1.Types.ObjectId(userId);
                updateData.deliveredAt = new Date();
                updateData.deliveryMethod = 'manual';
            }
            if (notes) {
                updateData.notes = notes;
            }
            const report = await report_schema_1.Report.findByIdAndUpdate(reportId, updateData, { new: true }).populate('patient doctor');
            if (!report) {
                throw new ApiError_1.ApiError('Report not found', 404);
            }
            await report_schema_1.Report.findByIdAndUpdate(reportId, {
                $push: {
                    auditTrail: {
                        action: `status_changed_to_${status}`,
                        performedBy: new mongoose_1.Types.ObjectId(userId),
                        performedAt: new Date(),
                        details: notes || `Status changed to ${status}`
                    }
                }
            });
            return report;
        }
        catch (error) {
            console.error('Error updating report status:', error);
            if (error instanceof ApiError_1.ApiError) {
                throw error;
            }
            throw new ApiError_1.ApiError('Failed to update report status', 500);
        }
    }
    async deleteReport(reportId) {
        try {
            const report = await report_schema_1.Report.findById(reportId);
            if (!report) {
                throw new ApiError_1.ApiError('Report not found', 404);
            }
            if (report.pdfFileId) {
                await (0, gridfs_1.deletePDFFromGridFS)(report.pdfFileId);
            }
            await report_schema_1.Report.findByIdAndUpdate(reportId, { isActive: false });
            return true;
        }
        catch (error) {
            console.error('Error deleting report:', error);
            if (error instanceof ApiError_1.ApiError) {
                throw error;
            }
            throw new ApiError_1.ApiError('Failed to delete report', 500);
        }
    }
    async generateReportNumber() {
        const count = await report_schema_1.Report.countDocuments();
        return `LAB-${String(count + 1).padStart(6, '0')}-${(0, moment_1.default)().format('YYYY')}`;
    }
    generateReportSummary(results) {
        const totalTests = results.length;
        const abnormalCount = results.filter(r => r.isAbnormal).length;
        const criticalCount = results.filter(r => r.criticalValue).length;
        let summary = `This report contains ${totalTests} laboratory test${totalTests !== 1 ? 's' : ''}.`;
        if (abnormalCount > 0) {
            summary += ` ${abnormalCount} abnormal result${abnormalCount !== 1 ? 's' : ''} detected.`;
        }
        if (criticalCount > 0) {
            summary += ` ${criticalCount} critical value${criticalCount !== 1 ? 's' : ''} requiring immediate attention.`;
        }
        return summary;
    }
    generateReportConclusion(results) {
        const criticalResults = results.filter(r => r.criticalValue);
        if (criticalResults.length > 0) {
            return 'CRITICAL VALUES DETECTED: Immediate clinical correlation and intervention required. Please contact the laboratory urgently.';
        }
        const abnormalResults = results.filter(r => r.isAbnormal);
        if (abnormalResults.length > 0) {
            return 'Abnormal results detected. Clinical correlation recommended.';
        }
        return 'All test results are within normal limits.';
    }
    generateRecommendations(results) {
        const criticalResults = results.filter(r => r.criticalValue);
        if (criticalResults.length > 0) {
            return 'URGENT: Please contact the referring physician and laboratory immediately for critical value notification protocol.';
        }
        const abnormalResults = results.filter(r => r.isAbnormal);
        if (abnormalResults.length > 0) {
            return 'Clinical correlation of abnormal results is recommended. Consider repeat testing if clinically indicated.';
        }
        return 'No specific recommendations. Continue routine follow-up as clinically indicated.';
    }
}
exports.ReportService = ReportService;
