import { Report, IReport } from '../schemas/report.schema';
// @ts-ignore
import { Order } from '../schemas/order.schema';
// @ts-ignore
import { Patient } from '../schemas/patient.schema';

export class ReportModel {
  // Basic CRUD operations
  static async create(reportData: Partial<IReport>): Promise<IReport> {
    return await Report.create(reportData);
  }

  static async findById(id: string): Promise<IReport | null> {
    return await Report.findById(id)
      .populate('order', 'orderNumber')
      .populate('patient', 'firstName lastName mrn')
      .populate('doctor', 'firstName lastName email')
      .populate('generatedBy', 'firstName lastName email')
      .populate('approvedBy', 'firstName lastName email')
      .populate('deliveredBy', 'firstName lastName email')
      .populate('tests', 'name code category')
      .populate('results');
  }

  static async findByReportNumber(reportNumber: string): Promise<IReport | null> {
    return await Report.findOne({ reportNumber, isActive: true })
      .populate('order', 'orderNumber')
      .populate('patient', 'firstName lastName mrn')
      .populate('doctor', 'firstName lastName email')
      .populate('generatedBy', 'firstName lastName email')
      .populate('approvedBy', 'firstName lastName email');
  }

  static async findAll(filters: any = {}, options: any = {}): Promise<IReport[]> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search,
      status,
      type,
      patientId,
      doctorId,
      generatedBy,
      approvedBy,
      confidentialityLevel,
      startDate,
      endDate,
      ...queryFilters
    } = filters;

    const skip = (page - 1) * limit;
    const sort: any = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    let query: any = { isActive: true, ...queryFilters };

    if (search) {
      query.$or = [
        { reportNumber: { $regex: search, $options: 'i' } },
        { orderNumber: { $regex: search, $options: 'i' } },
        { patientName: { $regex: search, $options: 'i' } },
        { patientMRN: { $regex: search, $options: 'i' } },
        { doctorName: { $regex: search, $options: 'i' } }
      ];
    }

    if (status) query.status = status;
    if (type) query.type = type;
    if (patientId) query.patient = patientId;
    if (doctorId) query.doctor = doctorId;
    if (generatedBy) query.generatedBy = generatedBy;
    if (approvedBy) query.approvedBy = approvedBy;
    if (confidentialityLevel) query.confidentialityLevel = confidentialityLevel;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    return await Report.find(query)
      .populate('patient', 'firstName lastName mrn')
      .populate('doctor', 'firstName lastName email')
      .populate('generatedBy', 'firstName lastName email')
      .populate('approvedBy', 'firstName lastName email')
      .populate('deliveredBy', 'firstName lastName email')
      .sort(sort)
      .skip(skip)
      .limit(limit);
  }

  static async updateById(id: string, updateData: Partial<IReport>): Promise<IReport | null> {
    return await Report.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('patient', 'firstName lastName mrn')
     .populate('doctor', 'firstName lastName email')
     .populate('generatedBy', 'firstName lastName email')
     .populate('approvedBy', 'firstName lastName email');
  }

  static async deleteById(id: string): Promise<IReport | null> {
    return await Report.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );
  }

  static async countDocuments(filters: any = {}): Promise<number> {
    let query: any = { isActive: true, ...filters };

    if (filters.search) {
      query.$or = [
        { reportNumber: { $regex: filters.search, $options: 'i' } },
        { patientName: { $regex: filters.search, $options: 'i' } },
        { doctorName: { $regex: filters.search, $options: 'i' } }
      ];
      delete query.search;
    }

    return await Report.countDocuments(query);
  }

  // Specific methods for report operations
  static async createReport(reportData: Partial<IReport>): Promise<IReport> {
    // Set default sections if not provided
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

    return await Report.create(reportData);
  }

  static async approveReport(reportId: string, approvedBy: string, approvedByUser: string): Promise<IReport | null> {
    const report = await Report.findById(reportId);
    if (!report) return null;

    return await Report.findByIdAndUpdate(
      reportId,
      {
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
      },
      { new: true }
    );
  }

  static async deliverReport(reportId: string, deliveredBy: string, method: string): Promise<IReport | null> {
    return await Report.findByIdAndUpdate(
      reportId,
      {
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
      },
      { new: true }
    );
  }

  static async rejectReport(reportId: string, rejectedBy: string, reason: string): Promise<IReport | null> {
    return await Report.findByIdAndUpdate(
      reportId,
      {
        status: 'rejected',
        $push: {
          auditTrail: {
            action: 'rejected',
            performedBy: rejectedBy,
            performedAt: new Date(),
            details: reason
          }
        }
      },
      { new: true }
    );
  }

  static async archiveReport(reportId: string): Promise<IReport | null> {
    return await Report.findByIdAndUpdate(
      reportId,
      {
        status: 'archived',
        archivedAt: new Date(),
        $push: {
          auditTrail: {
            action: 'archived',
            performedBy: null, // Will be populated by middleware
            performedAt: new Date()
          }
        }
      },
      { new: true }
    );
  }

  static async amendReport(reportId: string, amendedBy: string, reason: string, changes: string): Promise<IReport | null> {
    const report = await Report.findById(reportId);
    if (!report) return null;

    // Create new version
    const newReport = new Report({
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

    // Update original report to point to new version
    await Report.findByIdAndUpdate(reportId, {
      nextVersion: savedReport._id
    });

    return savedReport;
  }

  static async getReportsByPatient(patientId: string, limit: number = 50): Promise<IReport[]> {
    return await Report.find({
      patient: patientId,
      isActive: true
    })
    .populate('order', 'orderNumber createdAt')
    .populate('doctor', 'firstName lastName email')
    .populate('generatedBy', 'firstName lastName email')
    .sort({ createdAt: -1 })
    .limit(limit);
  }

  static async getReportsByDoctor(doctorId: string, limit: number = 50): Promise<IReport[]> {
    return await Report.find({
      doctor: doctorId,
      isActive: true
    })
    .populate('patient', 'firstName lastName mrn')
    .populate('order', 'orderNumber createdAt')
    .sort({ createdAt: -1 })
    .limit(limit);
  }

  static async getReportsByStatus(status: string, limit: number = 50): Promise<IReport[]> {
    return await Report.find({
      status: status,
      isActive: true
    })
    .populate('patient', 'firstName lastName mrn')
    .populate('doctor', 'firstName lastName email')
    .sort({ createdAt: -1 })
    .limit(limit);
  }

  static async getReportsByType(type: string, limit: number = 50): Promise<IReport[]> {
    return await Report.find({
      type: type,
      isActive: true
    })
    .populate('patient', 'firstName lastName mrn')
    .populate('doctor', 'firstName lastName email')
    .sort({ createdAt: -1 })
    .limit(limit);
  }

  static async getPendingApprovalReports(limit: number = 20): Promise<IReport[]> {
    return await Report.find({
      status: 'pending_review',
      isActive: true
    })
    .populate('patient', 'firstName lastName mrn phone')
    .populate('doctor', 'firstName lastName email')
    .populate('generatedBy', 'firstName lastName email')
    .sort({ createdAt: -1 })
    .limit(limit);
  }

  static async getDeliveredReports(days: number = 30, limit: number = 50): Promise<IReport[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return await Report.find({
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

  static async getReportsForArchival(): Promise<IReport[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 365); // 1 year old delivered reports

    return await Report.find({
      status: 'delivered',
      deliveredAt: { $lt: cutoffDate },
      archivedAt: { $exists: false },
      isActive: true
    })
    .sort({ deliveredAt: 1 });
  }

  static async updateReportSections(reportId: string, sections: any[]): Promise<IReport | null> {
    return await Report.findByIdAndUpdate(
      reportId,
      {
        sections,
        updatedAt: new Date(),
        $push: {
          auditTrail: {
            action: 'sections_updated',
            performedBy: null, // Will be populated by middleware
            performedAt: new Date()
          }
        }
      },
      { new: true }
    );
  }

  static async updateReportContent(reportId: string, updates: {
    summary?: string;
    conclusion?: string;
    recommendations?: string;
    clinicalNotes?: string;
  }): Promise<IReport | null> {
    return await Report.findByIdAndUpdate(
      reportId,
      {
        ...updates,
        updatedAt: new Date(),
        $push: {
          auditTrail: {
            action: 'content_updated',
            performedBy: null, // Will be populated by middleware
            performedAt: new Date()
          }
        }
      },
      { new: true }
    );
  }

  static async getReportStatistics(dateRange?: { start: Date; end: Date }): Promise<any> {
    const matchQuery: any = { isActive: true };

    if (dateRange) {
      matchQuery.createdAt = {
        $gte: dateRange.start,
        $lte: dateRange.end
      };
    }

    const statistics = await Report.aggregate([
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

  static async searchReports(searchTerm: string, limit: number = 20): Promise<IReport[]> {
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

    return await Report.find(query)
      .populate('patient', 'firstName lastName mrn')
      .populate('doctor', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  static async getReportVersions(reportId: string): Promise<IReport[]> {
    const report = await Report.findById(reportId);
    if (!report) return [];

    const allVersions = await Report.find({
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

  static async getReportWithFullDetails(reportId: string): Promise<IReport | null> {
    return await Report.findById(reportId)
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

  static async addTagToReport(reportId: string, tag: string): Promise<IReport | null> {
    return await Report.findByIdAndUpdate(
      reportId,
      {
        $addToSet: { tags: tag },
        updatedAt: new Date()
      },
      { new: true }
    );
  }

  static async removeTagFromReport(reportId: string, tag: string): Promise<IReport | null> {
    return await Report.findByIdAndUpdate(
      reportId,
      {
        $pull: { tags: tag },
        updatedAt: new Date()
      },
      { new: true }
    );
  }

  static async updateReportPDF(reportId: string, pdfPath: string): Promise<IReport | null> {
    return await Report.findByIdAndUpdate(
      reportId,
      {
        pdfPath,
        updatedAt: new Date(),
        $push: {
          auditTrail: {
            action: 'pdf_generated',
            performedBy: null, // Will be populated by middleware
            performedAt: new Date()
          }
        }
      },
      { new: true }
    );
  }
}