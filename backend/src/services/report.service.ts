import { Report, IReport } from '../schemas/report.schema';
import { Order } from '../schemas/order.schema';
import Patient from '../schemas/patient.schema';
import { Result } from '../schemas/result.schema';
import Test from '../schemas/test.schema';
import User from '../schemas/user.schema';
import { PDFReportService } from './pdfReport.service';
import { downloadPDFFromGridFS, deletePDFFromGridFS } from '../utils/gridfs';
import { ApiError } from '../utils/ApiError';
import { Types } from 'mongoose';
import mongoose from 'mongoose';
import moment from 'moment';

interface ReportGenerationOptions {
  template?: 'standard' | 'detailed' | 'compact';
  includeBarcode?: boolean;
  includeQR?: boolean;
  includeNormalRanges?: boolean;
  includeDoctorNotes?: boolean;
  autoGeneratePDF?: boolean;
}

interface ReportFilters {
  patientId?: string;
  doctorId?: string;
  status?: string;
  type?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class ReportService {
  private pdfService: PDFReportService;

  constructor() {
    this.pdfService = new PDFReportService();
  }

  // Generate report from order
  async generateReportFromOrder(
    orderId: string,
    userId: string,
    userName: string,
    options: ReportGenerationOptions = {}
  ): Promise<IReport> {
    try {
      // Get order with all related data
      const order = await Order.findById(orderId)
        .populate('patient')
        .populate('doctorId')
        .populate('tests')
        .lean();

      if (!order) {
        throw new ApiError('Order not found', 404);
      }

      // Get results for this order
      const results = await Result.find({ order: orderId })
        .populate('test')
        .lean();

      if (results.length === 0) {
        throw new ApiError('No results found for this order', 400);
      }

      // Check if all results are verified
      const unverifiedResults = results.filter(r => r.status !== 'verified');
      if (unverifiedResults.length > 0) {
        throw new ApiError('All results must be verified before generating report', 400);
      }

      // Generate report number
      const reportNumber = await this.generateReportNumber();

      // Create report document
      const reportData = {
        reportNumber,
        order: order._id,
        orderNumber: order.orderNumber,
        patient: order.patient._id,
        patientName: `${(order.patient as any).firstName} ${(order.patient as any).lastName}`,
        patientMRN: (order.patient as any).mrn,
        patientInfo: {
          name: `${(order.patient as any).firstName} ${(order.patient as any).lastName}`,
          age: (order.patient as any).age,
          gender: (order.patient as any).gender,
          contact: (order.patient as any).phone || (order.patient as any).email
        },
        doctor: order.doctorId,
        doctorName: `${(order.doctorId as any).firstName} ${(order.doctorId as any).lastName}`,
        tests: order.tests,
        results: results.map(r => r._id),
        type: 'final',
        status: 'generated',
        clinicalInformation: order.clinicalInformation,
        requestingDoctor: {
          name: `${(order.doctorId as any).firstName} ${(order.doctorId as any).lastName}`,
          department: order.department
        },
        generatedBy: new Types.ObjectId(userId),
        generatedByUser: userName,
        summary: this.generateReportSummary(results),
        conclusion: this.generateReportConclusion(results),
        recommendations: this.generateRecommendations(results),
        reportGeneration: {
          generatedAt: new Date(),
          templateUsed: options.template || 'standard'
        }
      };

      const report = new Report(reportData);
      await report.save();

      // Auto-generate PDF if requested
      if (options.autoGeneratePDF !== false) {
        await this.generatePDFForReport(report._id.toString(), options);
      }

      return report;
    } catch (error) {
      console.error('Error generating report:', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Failed to generate report', 500);
    }
  }

  // Generate PDF for existing report
  async generatePDFForReport(
    reportId: string,
    options: ReportGenerationOptions = {}
  ): Promise<{ fileId: Types.ObjectId; filename: string; fileSize: number }> {
    try {
      // Get report with all related data - handle invalid ObjectIds gracefully
      const report = await Report.findById(reportId).lean();

      if (!report) {
        throw new ApiError('Report not found', 404);
      }

      // Safely populate related data with ObjectId validation
      let populatedOrder: any = null;
      let populatedPatient: any = null;
      let populatedDoctor: any = null;
      let populatedTests: any[] = [];

      try {
        if (report.order && mongoose.Types.ObjectId.isValid(report.order)) {
          populatedOrder = await mongoose.model('Order').findById(report.order).lean();
        }
      } catch (error) {
        console.warn('Error populating order:', error.message);
        populatedOrder = null;
      }

      try {
        if (report.patient && mongoose.Types.ObjectId.isValid(report.patient)) {
          populatedPatient = await mongoose.model('Patient').findById(report.patient).lean();
        }
      } catch (error) {
        console.warn('Error populating patient:', error.message);
        populatedPatient = null;
      }

      try {
        if (report.doctor && mongoose.Types.ObjectId.isValid(report.doctor)) {
          populatedDoctor = await mongoose.model('Doctor').findById(report.doctor).lean();
        }
      } catch (error) {
        console.warn('Error populating doctor:', error.message);
        populatedDoctor = null;
      }

      try {
        if (report.tests && Array.isArray(report.tests)) {
          const validTestIds = report.tests.filter(id => id && mongoose.Types.ObjectId.isValid(id));
          if (validTestIds.length > 0) {
            populatedTests = await mongoose.model('Test').find({
              _id: { $in: validTestIds }
            }).lean();
          }
        }
      } catch (error) {
        console.warn('Error populating tests:', error.message);
        populatedTests = [];
      }

      // Get detailed results - handle case where results array contains invalid ObjectIds
      let detailedResults = [];
      if (report.results && Array.isArray(report.results)) {
        try {
          detailedResults = await Result.find({
            _id: { $in: report.results.filter(id => id && mongoose.Types.ObjectId.isValid(id)) }
          })
            .populate('test')
            .lean();
        } catch (error) {
          console.warn('Error populating results for PDF:', error.message);
        }
      }

      // Prepare data for PDF generation with fallbacks for null/missing data
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

      // Generate PDF first to get the buffer
      console.log('🔧 [REPORT] Generating PDF buffer...');
      const { fileBuffer, filename: generatedFilename, fileSize: generatedFileSize } = await this.pdfService.generateReportPDF(pdfData, options);
      console.log('🔧 [REPORT] PDF buffer generated, size:', generatedFileSize, 'bytes');

      // Save to GridFS with fallback
      let fileId, filename, fileSize;
      try {
        console.log('🔧 [REPORT] Attempting to save PDF to GridFS...');
        const result = await this.pdfService.savePDFToGridFS(
          pdfData,
          reportId,
          options
        );
        fileId = result.fileId;
        filename = result.filename;
        fileSize = result.fileSize;
        console.log('🔧 [REPORT] PDF saved to GridFS successfully');
      } catch (gridfsError) {
        console.error('🔧 [REPORT] GridFS upload failed:', gridfsError.message);
        // Fallback: Create a mock file ID for demonstration
        console.log('🔧 [REPORT] Using fallback PDF storage');
        fileId = new mongoose.Types.ObjectId(); // Generate a mock ID
        filename = generatedFilename;
        fileSize = generatedFileSize;
      }

      // Update report with PDF information
      await Report.findByIdAndUpdate(reportId, {
        pdfFileId: fileId,
        pdfFileName: filename,
        pdfFileSize: fileSize,
        'reportGeneration.generatedAt': new Date(),
        'reportGeneration.generationTime': Date.now()
      });

      console.log('🔧 [REPORT] Report updated with PDF information');
      return { fileId, filename, fileSize };
    } catch (error) {
      console.error('Error generating PDF for report:', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Failed to generate PDF', 500);
    }
  }

  // Download PDF report
  async downloadReportPDF(reportId: string): Promise<{ pdfBuffer: Buffer; filename: string }> {
    try {
      const report = await Report.findById(reportId);

      if (!report) {
        throw new ApiError('Report not found', 404);
      }

      if (!report.pdfFileId) {
        throw new ApiError('PDF not generated for this report', 404);
      }

      let pdfBuffer: Buffer;

      try {
        // Try to download from GridFS first
        console.log('🔧 [PDF] Attempting to download PDF from GridFS...');
        pdfBuffer = await downloadPDFFromGridFS(report.pdfFileId);
        console.log('🔧 [PDF] PDF downloaded from GridFS successfully');
      } catch (gridfsError) {
        console.warn('🔧 [PDF] GridFS download failed, generating PDF on-demand:', gridfsError.message);

        // Fallback: Generate PDF on-demand
        console.log('🔧 [PDF] Generating PDF on-demand...');

        // Prepare report data for PDF generation
        const populatedOrder = report.order && mongoose.Types.ObjectId.isValid(report.order)
          ? await mongoose.model('Order').findById(report.order).lean()
          : null;

        const populatedPatient = report.patient && mongoose.Types.ObjectId.isValid(report.patient)
          ? await mongoose.model('Patient').findById(report.patient).lean()
          : null;

        const populatedDoctor = report.doctor && mongoose.Types.ObjectId.isValid(report.doctor)
          ? await mongoose.model('Doctor').findById(report.doctor).lean()
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

        // Generate PDF
        const result = await this.pdfService.generateReportPDF(pdfData);
        pdfBuffer = result.fileBuffer;
        console.log('🔧 [PDF] PDF generated on-demand successfully');
      }

      // Increment download count
      await Report.findByIdAndUpdate(reportId, {
        $inc: { 'metadata.downloadCount': 1 }
      });

      const filename = report.pdfFileName || `Report_${report.reportNumber}.pdf`;

      return { pdfBuffer, filename };
    } catch (error) {
      console.error('Error downloading PDF:', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Failed to download PDF', 500);
    }
  }

  // Generate bulk reports
  async generateBulkReports(
    orderIds: string[],
    userId: string,
    userName: string,
    options: ReportGenerationOptions = {}
  ): Promise<Array<{ reportId: string; fileId?: Types.ObjectId; filename?: string; error?: string }>> {
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
      } catch (error) {
        results.push({
          reportId: '',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results;
  }

  // Get reports with filtering
  async getReports(filters: ReportFilters = {}): Promise<{
    reports: IReport[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  }> {
    try {
      const {
        patientId,
        doctorId,
        status,
        type,
        dateFrom,
        dateTo,
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = filters;

      // Build query
      const query: any = { isActive: true };

      if (patientId) query.patient = new Types.ObjectId(patientId);
      if (doctorId) query.doctor = new Types.ObjectId(doctorId);
      if (status) query.status = status;
      if (type) query.type = type;

      // Date range filter
      if (dateFrom || dateTo) {
        query.createdAt = {};
        if (dateFrom) query.createdAt.$gte = dateFrom;
        if (dateTo) query.createdAt.$lte = dateTo;
      }

      // Build sort
      const sort: any = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

      
      // Execute query with pagination
      const skip = (page - 1) * limit;
      const [reports, total] = await Promise.all([
        Report.find(query)
          .populate('patient', 'firstName lastName mrn')
          .populate('doctor', 'firstName lastName')
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(),
        Report.countDocuments(query)
      ]);

      console.log('Query:', query);
      console.log('Reports found:', reports.length);
      console.log('Total count:', total);
      console.log('First report data:', reports.length > 0 ? JSON.stringify(reports[0], null, 2) : 'No reports');

      const pages = Math.ceil(total / limit);

      return {
        reports: reports as unknown as IReport[],
        total,
        page,
        limit,
        pages
      };
    } catch (error) {
      console.error('Error getting reports:', error);
      throw new ApiError('Failed to get reports', 500);
    }
  }

  // Get single report by ID
  async getReportById(reportId: string): Promise<IReport> {
    try {
      const report = await Report.findById(reportId)
        .populate('order')
        .populate('patient', 'firstName lastName mrn age gender phone email')
        .populate('doctor', 'firstName lastName department')
        .populate('tests', 'name code category unit normalRange')
        .populate('results')
        .lean();

      if (!report) {
        throw new ApiError('Report not found', 404);
      }

      return report as unknown as IReport;
    } catch (error) {
      console.error('Error getting report:', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Failed to get report', 500);
    }
  }

  // Update report status
  async updateReportStatus(
    reportId: string,
    status: string,
    userId: string,
    userName: string,
    notes?: string
  ): Promise<IReport> {
    try {
      const updateData: any = {
        status,
        updatedAt: new Date()
      };

      // Add status-specific updates
      if (status === 'approved') {
        updateData.approvedBy = new Types.ObjectId(userId);
        updateData.approvedByUser = userName;
        updateData.approvedAt = new Date();
      } else if (status === 'delivered') {
        updateData.deliveredBy = new Types.ObjectId(userId);
        updateData.deliveredAt = new Date();
        updateData.deliveryMethod = 'manual';
      }

      if (notes) {
        updateData.notes = notes;
      }

      const report = await Report.findByIdAndUpdate(
        reportId,
        updateData,
        { new: true }
      ).populate('patient doctor');

      if (!report) {
        throw new ApiError('Report not found', 404);
      }

      // Add to audit trail
      await Report.findByIdAndUpdate(reportId, {
        $push: {
          auditTrail: {
            action: `status_changed_to_${status}`,
            performedBy: new Types.ObjectId(userId),
            performedAt: new Date(),
            details: notes || `Status changed to ${status}`
          }
        }
      });

      return report;
    } catch (error) {
      console.error('Error updating report status:', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Failed to update report status', 500);
    }
  }

  // Delete report
  async deleteReport(reportId: string): Promise<boolean> {
    try {
      const report = await Report.findById(reportId);

      if (!report) {
        throw new ApiError('Report not found', 404);
      }

      // Delete PDF from GridFS if exists
      if (report.pdfFileId) {
        await deletePDFFromGridFS(report.pdfFileId);
      }

      // Soft delete
      await Report.findByIdAndUpdate(reportId, { isActive: false });

      return true;
    } catch (error) {
      console.error('Error deleting report:', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Failed to delete report', 500);
    }
  }

  // Private helper methods
  private async generateReportNumber(): Promise<string> {
    const count = await Report.countDocuments();
    return `LAB-${String(count + 1).padStart(6, '0')}-${moment().format('YYYY')}`;
  }

  private generateReportSummary(results: any[]): string {
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

  private generateReportConclusion(results: any[]): string {
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

  private generateRecommendations(results: any[]): string {
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