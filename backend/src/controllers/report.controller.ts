import { Request, Response } from 'express';
import { ReportZodSchema } from '../validators/report.validator';
import { ReportService } from '../services/report.service';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';

const reportService = new ReportService();

export class ReportController {
  // Create Report
  createReport = asyncHandler(async (req: Request, res: Response) => {
    const validatedData = ReportZodSchema.create.parse(req.body);
    validatedData.generatedBy = (req.user as any).id;

    const report = await reportService.createReport(validatedData);

    return res.status(201).json(
      // @ts-ignore
      new ApiResponse(201 as any, 'Report created successfully', {
        data: report
      })
    );
  });

  // Get All Reports
  getAllReports = asyncHandler(async (req: Request, res: Response) => {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      type,
      patientId,
      doctorId,
      confidentialityLevel,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const filters = {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      search: search as string,
      status: status as string,
      type: type as string,
      patientId: patientId as string,
      doctorId: doctorId as string,
      confidentialityLevel: confidentialityLevel as string,
      startDate: startDate as string,
      endDate: endDate as string,
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc'
    };

    const result = await reportService.getAllReports(filters);

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'Reports retrieved successfully', {
        data: {
          reports: result.reports,
          pagination: {
            page: filters.page,
            limit: filters.limit,
            total: result.total,
            pages: Math.ceil(result.total / filters.limit)
          }
        }
      })
    );
  });

  // Get Report by ID
  getReportById = asyncHandler(async (req: Request, res: Response) => {
    const { reportId } = req.params;

    const report = await reportService.getReportById(reportId);

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'Report retrieved successfully', {
        data: report
      })
    );
  });

  // Get Report by Report Number
  getReportByNumber = asyncHandler(async (req: Request, res: Response) => {
    const { reportNumber } = req.params;

    const report = await reportService.getReportByNumber(reportNumber);

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'Report retrieved successfully', {
        data: report
      })
    );
  });

  // Update Report
  updateReport = asyncHandler(async (req: Request, res: Response) => {
    const { reportId } = req.params;
    const validatedData = ReportZodSchema.update.parse(req.body);

    const updatedReport = await reportService.updateReport(reportId, validatedData);

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'Report updated successfully', {
        data: updatedReport
      })
    );
  });

  // Update Report Sections
  updateReportSections = asyncHandler(async (req: Request, res: Response) => {
    const { reportId } = req.params;
    // @ts-ignore
    const { sections } = (ReportZodSchema as any).updateSections.parse(req.body);

    const report = await reportService.updateReportSections(reportId, sections);

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'Report sections updated successfully', {
        data: report
      })
    );
  });

  // Update Report Content
  updateReportContent = asyncHandler(async (req: Request, res: Response) => {
    const { reportId } = req.params;
    // @ts-ignore
    const validatedData = (ReportZodSchema as any).updateContent.parse(req.body);

    const report = await reportService.updateReportContent(reportId, validatedData);

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'Report content updated successfully', {
        data: report
      })
    );
  });

  // Approve Report
  approveReport = asyncHandler(async (req: Request, res: Response) => {
    const { reportId } = req.params;
    const userId = (req.user as any).id;
    const userName = `${(req.user as any).firstName} ${(req.user as any).lastName}`;

    const report = await reportService.approveReport(reportId, userId, userName);

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'Report approved successfully', {
        data: report
      })
    );
  });

  // Deliver Report
  deliverReport = asyncHandler(async (req: Request, res: Response) => {
    const { reportId } = req.params;
    // @ts-ignore
    const { method } = (ReportZodSchema as any).deliver.parse(req.body);
    const userId = (req.user as any).id;

    const report = await reportService.deliverReport(reportId, userId, method);

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'Report delivered successfully', {
        data: report
      })
    );
  });

  // Reject Report
  rejectReport = asyncHandler(async (req: Request, res: Response) => {
    const { reportId } = req.params;
    // @ts-ignore
    const { reason } = (ReportZodSchema as any).reject.parse(req.body);
    const userId = (req.user as any).id;

    const report = await reportService.rejectReport(reportId, userId, reason);

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'Report rejected successfully', {
        data: report
      })
    );
  });

  // Archive Report
  archiveReport = asyncHandler(async (req: Request, res: Response) => {
    const { reportId } = req.params;

    const report = await reportService.archiveReport(reportId);

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'Report archived successfully', {
        data: report
      })
    );
  });

  // Amend Report
  amendReport = asyncHandler(async (req: Request, res: Response) => {
    const { reportId } = req.params;
    // @ts-ignore
    const { reason, changes } = (ReportZodSchema as any).amend.parse(req.body);
    const userId = (req.user as any).id;

    const report = await reportService.amendReport(reportId, userId, reason, changes);

    return res.status(201).json(
      // @ts-ignore
      new ApiResponse(201 as any, 'Report amended successfully', {
        data: report
      })
    );
  });

  // Get Reports by Patient
  getReportsByPatient = asyncHandler(async (req: Request, res: Response) => {
    const { patientId } = req.params;
    const { limit = 50 } = req.query;

    const reports = await reportService.getReportsByPatient(
      patientId,
      parseInt(limit as string)
    );

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'Reports by patient retrieved', {
        data: reports
      })
    );
  });

  // Get Reports by Doctor
  getReportsByDoctor = asyncHandler(async (req: Request, res: Response) => {
    const { doctorId } = req.params;
    const { limit = 50 } = req.query;

    const reports = await reportService.getReportsByDoctor(
      doctorId,
      parseInt(limit as string)
    );

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'Reports by doctor retrieved', {
        data: reports
      })
    );
  });

  // Get Pending Approval Reports
  getPendingApprovalReports = asyncHandler(async (req: Request, res: Response) => {
    const { limit = 20 } = req.query;

    const reports = await reportService.getPendingApprovalReports(
      parseInt(limit as string)
    );

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'Pending approval reports retrieved', {
        data: reports
      })
    );
  });

  // Get Delivered Reports
  getDeliveredReports = asyncHandler(async (req: Request, res: Response) => {
    const { days = 30, limit = 50 } = req.query;

    const reports = await reportService.getDeliveredReports(
      parseInt(days as string),
      parseInt(limit as string)
    );

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'Delivered reports retrieved', {
        data: reports
      })
    );
  });

  // Get Report Statistics
  getReportStatistics = asyncHandler(async (req: Request, res: Response) => {
    const { startDate, endDate } = req.query;

    let dateRange;
    if (startDate && endDate) {
      dateRange = {
        start: new Date(startDate as string),
        end: new Date(endDate as string)
      };
    }

    const statistics = await reportService.getReportStatistics(dateRange);

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'Report statistics retrieved', {
        data: statistics
      })
    );
  });

  // Search Reports
  searchReports = asyncHandler(async (req: Request, res: Response) => {
    const { q, limit = 20 } = req.query;

    if (!q) {
      // @ts-ignore
      throw new ApiError(400 as any, 'Search query is required');
    }

    const reports = await reportService.searchReports(q as string, parseInt(limit as string));

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'Reports search completed', {
        data: reports
      })
    );
  });

  // Get Report Versions
  getReportVersions = asyncHandler(async (req: Request, res: Response) => {
    const { reportId } = req.params;

    const reports = await reportService.getReportVersions(reportId);

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'Report versions retrieved', {
        data: reports
      })
    );
  });

  // Add Tag to Report
  addTag = asyncHandler(async (req: Request, res: Response) => {
    const { reportId } = req.params;
    // @ts-ignore
    const { tag } = (ReportZodSchema as any).addTag.parse(req.body);

    const report = await reportService.addTagToReport(reportId, tag);

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'Tag added successfully', {
        data: {
          id: (report as any).id,
          tags: (report as any).tags
        }
      })
    );
  });

  // Remove Tag from Report
  removeTag = asyncHandler(async (req: Request, res: Response) => {
    const { reportId } = req.params;
    // @ts-ignore
    const { tag } = (ReportZodSchema as any).removeTag.parse(req.body);

    const report = await reportService.removeTagFromReport(reportId, tag);

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'Tag removed successfully', {
        data: {
          id: (report as any).id,
          tags: (report as any).tags
        }
      })
    );
  });

  // Generate Report PDF
  generatePDF = asyncHandler(async (req: Request, res: Response) => {
    const { reportId } = req.params;

    const pdfData = await reportService.generateReportPDF(reportId);

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'Report PDF generated successfully', {
        data: pdfData
      })
    );
  });
}