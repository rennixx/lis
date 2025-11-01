"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportModel = void 0;
const report_schema_1 = require("../schemas/report.schema");
class ReportModel {
    static async create(reportData) {
        return await report_schema_1.Report.create(reportData);
    }
    static async findById(id) {
        return await report_schema_1.Report.findById(id)
            .populate('order', 'orderNumber')
            .populate('patient', 'firstName lastName mrn')
            .populate('doctor', 'firstName lastName email')
            .populate('generatedBy', 'firstName lastName email')
            .populate('approvedBy', 'firstName lastName email')
            .populate('deliveredBy', 'firstName lastName email')
            .populate('tests', 'name code category')
            .populate('results');
    }
    static async findByReportNumber(reportNumber) {
        return await report_schema_1.Report.findOne({ reportNumber, isActive: true })
            .populate('order', 'orderNumber')
            .populate('patient', 'firstName lastName mrn')
            .populate('doctor', 'firstName lastName email')
            .populate('generatedBy', 'firstName lastName email')
            .populate('approvedBy', 'firstName lastName email');
    }
    static async findAll(filters = {}, options = {}) {
        const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', search, status, type, patientId, doctorId, generatedBy, approvedBy, confidentialityLevel, startDate, endDate, ...queryFilters } = filters;
        const skip = (page - 1) * limit;
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
        let query = { isActive: true, ...queryFilters };
        if (search) {
            query.$or = [
                { reportNumber: { $regex: search, $options: 'i' } },
                { orderNumber: { $regex: search, $options: 'i' } },
                { patientName: { $regex: search, $options: 'i' } },
                { patientMRN: { $regex: search, $options: 'i' } },
                { doctorName: { $regex: search, $options: 'i' } }
            ];
        }
        if (status)
            query.status = status;
        if (type)
            query.type = type;
        if (patientId)
            query.patient = patientId;
        if (doctorId)
            query.doctor = doctorId;
        if (generatedBy)
            query.generatedBy = generatedBy;
        if (approvedBy)
            query.approvedBy = approvedBy;
        if (confidentialityLevel)
            query.confidentialityLevel = confidentialityLevel;
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate)
                query.createdAt.$gte = new Date(startDate);
            if (endDate)
                query.createdAt.$lte = new Date(endDate);
        }
        return await report_schema_1.Report.find(query)
            .populate('patient', 'firstName lastName mrn')
            .populate('doctor', 'firstName lastName email')
            .populate('generatedBy', 'firstName lastName email')
            .populate('approvedBy', 'firstName lastName email')
            .populate('deliveredBy', 'firstName lastName email')
            .sort(sort)
            .skip(skip)
            .limit(limit);
    }
    static async updateById(id, updateData) {
        return await report_schema_1.Report.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).populate('patient', 'firstName lastName mrn')
            .populate('doctor', 'firstName lastName email')
            .populate('generatedBy', 'firstName lastName email')
            .populate('approvedBy', 'firstName lastName email');
    }
    static async deleteById(id) {
        return await report_schema_1.Report.findByIdAndUpdate(id, { isActive: false }, { new: true });
    }
    static async countDocuments(filters = {}) {
        let query = { isActive: true, ...filters };
        if (filters.search) {
            query.$or = [
                { reportNumber: { $regex: filters.search, $options: 'i' } },
                { patientName: { $regex: filters.search, $options: 'i' } },
                { doctorName: { $regex: filters.search, $options: 'i' } }
            ];
            delete query.search;
        }
        return await report_schema_1.Report.countDocuments(query);
    }
    static async createReport(reportData) {
        if (!reportData.sections || reportData.sections.length === 0) {
            reportData.sections = [
                {
                    title: 'Patient Information',
                    content: 'Patient details will be populated here.',
                    order: 1,
                    type: 'text'
                },
                {
                    title: 'Test Results',
                    content: 'Test results will be populated here.',
                    order: 2,
                    type: 'table'
                },
                {
                    title: 'Summary',
                    content: 'Summary will be populated here.',
                    order: 3,
                    type: 'text'
                }
            ];
        }
        return await report_schema_1.Report.create(reportData);
    }
    static async approveReport(reportId, approvedBy, approvedByUser) {
        const report = await report_schema_1.Report.findById(reportId);
        if (!report)
            return null;
        return await report_schema_1.Report.findByIdAndUpdate(reportId, {
            status: 'approved',
            approvedBy,
            approvedByUser,
            approvedAt: new Date(),
            $push: {
                auditTrail: {
                    action: 'approved',
                    performedBy: approvedBy,
                    performedAt: new Date()
                }
            }
        }, { new: true });
    }
    static async deliverReport(reportId, deliveredBy, method) {
        return await report_schema_1.Report.findByIdAndUpdate(reportId, {
            status: 'delivered',
            deliveredBy,
            deliveredAt: new Date(),
            deliveryMethod: method,
            $push: {
                auditTrail: {
                    action: 'delivered',
                    performedBy: deliveredBy,
                    performedAt: new Date(),
                    details: `Delivery method: ${method}`
                }
            }
        }, { new: true });
    }
    static async rejectReport(reportId, rejectedBy, reason) {
        return await report_schema_1.Report.findByIdAndUpdate(reportId, {
            status: 'rejected',
            $push: {
                auditTrail: {
                    action: 'rejected',
                    performedBy: rejectedBy,
                    performedAt: new Date(),
                    details: reason
                }
            }
        }, { new: true });
    }
    static async archiveReport(reportId) {
        return await report_schema_1.Report.findByIdAndUpdate(reportId, {
            status: 'archived',
            archivedAt: new Date(),
            $push: {
                auditTrail: {
                    action: 'archived',
                    performedBy: null,
                    performedAt: new Date()
                }
            }
        }, { new: true });
    }
    static async amendReport(reportId, amendedBy, reason, changes) {
        const report = await report_schema_1.Report.findById(reportId);
        if (!report)
            return null;
        const newReport = new report_schema_1.Report({
            ...report.toObject(),
            _id: undefined,
            reportNumber: `${report.reportNumber}-V${report.version + 1}`,
            type: 'amended',
            status: 'draft',
            version: report.version + 1,
            previousVersion: report._id,
            amendments: [
                ...(report.amendments || []),
                {
                    date: new Date(),
                    reason,
                    amendedBy,
                    changes
                }
            ],
            auditTrail: [
                ...(report.auditTrail || []),
                {
                    action: 'amended',
                    performedBy: amendedBy,
                    performedAt: new Date(),
                    details: reason
                }
            ]
        });
        const savedReport = await newReport.save();
        await report_schema_1.Report.findByIdAndUpdate(reportId, {
            nextVersion: savedReport._id
        });
        return savedReport;
    }
    static async getReportsByPatient(patientId, limit = 50) {
        return await report_schema_1.Report.find({
            patient: patientId,
            isActive: true
        })
            .populate('order', 'orderNumber createdAt')
            .populate('doctor', 'firstName lastName email')
            .populate('generatedBy', 'firstName lastName email')
            .sort({ createdAt: -1 })
            .limit(limit);
    }
    static async getReportsByDoctor(doctorId, limit = 50) {
        return await report_schema_1.Report.find({
            doctor: doctorId,
            isActive: true
        })
            .populate('patient', 'firstName lastName mrn')
            .populate('order', 'orderNumber createdAt')
            .sort({ createdAt: -1 })
            .limit(limit);
    }
    static async getReportsByStatus(status, limit = 50) {
        return await report_schema_1.Report.find({
            status: status,
            isActive: true
        })
            .populate('patient', 'firstName lastName mrn')
            .populate('doctor', 'firstName lastName email')
            .sort({ createdAt: -1 })
            .limit(limit);
    }
    static async getReportsByType(type, limit = 50) {
        return await report_schema_1.Report.find({
            type: type,
            isActive: true
        })
            .populate('patient', 'firstName lastName mrn')
            .populate('doctor', 'firstName lastName email')
            .sort({ createdAt: -1 })
            .limit(limit);
    }
    static async getPendingApprovalReports(limit = 20) {
        return await report_schema_1.Report.find({
            status: 'pending_review',
            isActive: true
        })
            .populate('patient', 'firstName lastName mrn phone')
            .populate('doctor', 'firstName lastName email')
            .populate('generatedBy', 'firstName lastName email')
            .sort({ createdAt: -1 })
            .limit(limit);
    }
    static async getDeliveredReports(days = 30, limit = 50) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        return await report_schema_1.Report.find({
            status: 'delivered',
            deliveredAt: { $gte: cutoffDate },
            isActive: true
        })
            .populate('patient', 'firstName lastName mrn')
            .populate('doctor', 'firstName lastName email')
            .populate('deliveredBy', 'firstName lastName email')
            .sort({ deliveredAt: -1 })
            .limit(limit);
    }
    static async getReportsForArchival() {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 365);
        return await report_schema_1.Report.find({
            status: 'delivered',
            deliveredAt: { $lt: cutoffDate },
            archivedAt: { $exists: false },
            isActive: true
        })
            .sort({ deliveredAt: 1 });
    }
    static async updateReportSections(reportId, sections) {
        return await report_schema_1.Report.findByIdAndUpdate(reportId, {
            sections,
            updatedAt: new Date(),
            $push: {
                auditTrail: {
                    action: 'sections_updated',
                    performedBy: null,
                    performedAt: new Date()
                }
            }
        }, { new: true });
    }
    static async updateReportContent(reportId, updates) {
        return await report_schema_1.Report.findByIdAndUpdate(reportId, {
            ...updates,
            updatedAt: new Date(),
            $push: {
                auditTrail: {
                    action: 'content_updated',
                    performedBy: null,
                    performedAt: new Date()
                }
            }
        }, { new: true });
    }
    static async getReportStatistics(dateRange) {
        const matchQuery = { isActive: true };
        if (dateRange) {
            matchQuery.createdAt = {
                $gte: dateRange.start,
                $lte: dateRange.end
            };
        }
        const statistics = await report_schema_1.Report.aggregate([
            { $match: matchQuery },
            {
                $facet: {
                    totalReports: [{ $count: "count" }],
                    statusDistribution: [
                        {
                            $group: {
                                _id: "$status",
                                count: { $sum: 1 }
                            }
                        }
                    ],
                    typeDistribution: [
                        {
                            $group: {
                                _id: "$type",
                                count: { $sum: 1 }
                            }
                        }
                    ],
                    confidentialityDistribution: [
                        {
                            $group: {
                                _id: "$confidentialityLevel",
                                count: { $sum: 1 }
                            }
                        }
                    ],
                    deliveryMethodDistribution: [
                        {
                            $match: { deliveryMethod: { $exists: true } }
                        },
                        {
                            $group: {
                                _id: "$deliveryMethod",
                                count: { $sum: 1 }
                            }
                        }
                    ],
                    dailyTrend: [
                        {
                            $group: {
                                _id: {
                                    $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
                                },
                                count: { $sum: 1 },
                                approvedCount: {
                                    $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] }
                                },
                                deliveredCount: {
                                    $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] }
                                }
                            }
                        },
                        { $sort: { _id: 1 } }
                    ],
                    averageProcessingTime: [
                        {
                            $match: {
                                approvedAt: { $exists: true },
                                createdAt: { $exists: true }
                            }
                        },
                        {
                            $group: {
                                _id: null,
                                averageTime: {
                                    $avg: {
                                        $subtract: ["$approvedAt", "$createdAt"]
                                    }
                                },
                                minTime: {
                                    $min: {
                                        $subtract: ["$approvedAt", "$createdAt"]
                                    }
                                },
                                maxTime: {
                                    $max: {
                                        $subtract: ["$approvedAt", "$createdAt"]
                                    }
                                }
                            }
                        }
                    ]
                }
            }
        ]);
        return statistics[0];
    }
    static async searchReports(searchTerm, limit = 20) {
        const query = {
            isActive: true,
            $or: [
                { reportNumber: { $regex: searchTerm, $options: 'i' } },
                { orderNumber: { $regex: searchTerm, $options: 'i' } },
                { patientName: { $regex: searchTerm, $options: 'i' } },
                { patientMRN: { $regex: searchTerm, $options: 'i' } },
                { doctorName: { $regex: searchTerm, $options: 'i' } }
            ]
        };
        return await report_schema_1.Report.find(query)
            .populate('patient', 'firstName lastName mrn')
            .populate('doctor', 'firstName lastName email')
            .sort({ createdAt: -1 })
            .limit(limit);
    }
    static async getReportVersions(reportId) {
        const report = await report_schema_1.Report.findById(reportId);
        if (!report)
            return [];
        const allVersions = await report_schema_1.Report.find({
            $or: [
                { _id: reportId },
                { previousVersion: reportId },
                { nextVersion: reportId }
            ],
            isActive: true
        })
            .sort({ version: 1 });
        return allVersions;
    }
    static async getReportWithFullDetails(reportId) {
        return await report_schema_1.Report.findById(reportId)
            .populate('order')
            .populate('patient')
            .populate('doctor')
            .populate('generatedBy')
            .populate('approvedBy')
            .populate('deliveredBy')
            .populate('tests')
            .populate({
            path: 'results',
            populate: {
                path: 'test',
                select: 'name code unit'
            }
        })
            .populate('previousVersion')
            .populate('nextVersion');
    }
    static async addTagToReport(reportId, tag) {
        return await report_schema_1.Report.findByIdAndUpdate(reportId, {
            $addToSet: { tags: tag },
            updatedAt: new Date()
        }, { new: true });
    }
    static async removeTagFromReport(reportId, tag) {
        return await report_schema_1.Report.findByIdAndUpdate(reportId, {
            $pull: { tags: tag },
            updatedAt: new Date()
        }, { new: true });
    }
    static async updateReportPDF(reportId, pdfPath) {
        return await report_schema_1.Report.findByIdAndUpdate(reportId, {
            pdfPath,
            updatedAt: new Date(),
            $push: {
                auditTrail: {
                    action: 'pdf_generated',
                    performedBy: null,
                    performedAt: new Date()
                }
            }
        }, { new: true });
    }
}
exports.ReportModel = ReportModel;
