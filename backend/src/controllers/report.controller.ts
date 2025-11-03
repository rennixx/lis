import { Request, Response } from 'express';
import { ReportService } from '../services/report.service';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';

const reportService = new ReportService();

export class ReportController {
  // Generate report from order with auto PDF generation
  generateReportFromOrder = asyncHandler(async (req: Request, res: Response) => {
    const { orderId } = req.params;
    const { template, includeBarcode, includeQR } = req.body;
    // @ts-ignore
    const userId = (req.user as any).id;
    // @ts-ignore
    const userName = `${(req.user as any).firstName} ${(req.user as any).lastName}`;

    const options = {
      template: template || 'standard',
      includeBarcode: includeBarcode || false,
      includeQR: includeQR || false,
      autoGeneratePDF: true
    };

    const report = await reportService.generateReportFromOrder(orderId, userId, userName, options);

    return res.status(201).json(
      // @ts-ignore
      new ApiResponse(201 as any, 'Report generated successfully', {
        data: report
      })
    );
  });

  // Generate PDF for existing report
  generatePDFForReport = asyncHandler(async (req: Request, res: Response) => {
    const { reportId } = req.params;
    const { template, includeBarcode, includeQR } = req.body;

    const options = {
      template: template || 'standard',
      includeBarcode: includeBarcode || false,
      includeQR: includeQR || false
    };

    const result = await reportService.generatePDFForReport(reportId, options);

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'PDF generated successfully', {
        data: result
      })
    );
  });

  // Download PDF report
  downloadReportPDF = asyncHandler(async (req: Request, res: Response) => {
    const { reportId } = req.params;

    const { pdfBuffer, filename } = await reportService.downloadReportPDF(reportId);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);
  });

  // View PDF in browser
  viewReportPDF = asyncHandler(async (req: Request, res: Response) => {
    const { reportId } = req.params;

    const { pdfBuffer, filename } = await reportService.downloadReportPDF(reportId);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);
  });

  // Generate bulk reports
  generateBulkReports = asyncHandler(async (req: Request, res: Response) => {
    const { orderIds, template, includeBarcode, includeQR } = req.body;
    // @ts-ignore
    const userId = (req.user as any).id;
    // @ts-ignore
    const userName = `${(req.user as any).firstName} ${(req.user as any).lastName}`;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      // @ts-ignore
      throw new ApiError(400 as any, 'Order IDs array is required');
    }

    const options = {
      template: template || 'standard',
      includeBarcode: includeBarcode || false,
      includeQR: includeQR || false
    };

    const results = await reportService.generateBulkReports(orderIds, userId, userName, options);

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'Bulk reports generation completed', {
        data: results
      })
    );
  });

  // Get all reports with filtering
  getAllReports = asyncHandler(async (req: Request, res: Response) => {

    const {
      page = 1,
      limit = 20,
      patientId,
      doctorId,
      status,
      type,
      dateFrom,
      dateTo,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const filters = {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      patientId: patientId as string,
      doctorId: doctorId as string,
      status: status as string,
      type: type as string,
      dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
      dateTo: dateTo ? new Date(dateTo as string) : undefined,
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc'
    };

    const result = await reportService.getReports(filters);

    // Add cache-busting headers
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'Reports retrieved successfully', {
        data: {
          reports: result.reports,
          pagination: {
            page: filters.page,
            limit: filters.limit,
            total: result.total,
            pages: result.pages
          }
        }
      })
    );
  });

  // Get single report by ID
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

  // Update report status
  updateReportStatus = asyncHandler(async (req: Request, res: Response) => {
    const { reportId } = req.params;
    const { status, notes } = req.body;
    // @ts-ignore
    const userId = (req.user as any).id;
    // @ts-ignore
    const userName = `${(req.user as any).firstName} ${(req.user as any).lastName}`;

    if (!status) {
      // @ts-ignore
      throw new ApiError(400 as any, 'Status is required');
    }

    const report = await reportService.updateReportStatus(reportId, status, userId, userName, notes);

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'Report status updated successfully', {
        data: report
      })
    );
  });

  // Delete report
  deleteReport = asyncHandler(async (req: Request, res: Response) => {
    const { reportId } = req.params;

    const result = await reportService.deleteReport(reportId);

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'Report deleted successfully', {
        data: { deleted: result }
      })
    );
  });

  // Get report statistics
  getReportStatistics = asyncHandler(async (req: Request, res: Response) => {
    const { startDate, endDate } = req.query;

    // Build date filter
    let dateFilter: any = { isActive: true };
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string)
      };
    }

    // Get all reports for statistics (no pagination)
    const Report = require('../schemas/report.schema').Report;
    const reports = await Report.find(dateFilter).lean();

    // Calculate statistics
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
      pdfGenerated: reports.filter((r: any) => r.pdfFileId).length
    };

    console.log('Statistics calculated:', statistics);

    // Add cache-busting headers
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'Report statistics retrieved successfully', {
        data: statistics
      })
    );
  });

  // Search reports
  searchReports = asyncHandler(async (req: Request, res: Response) => {
    const { q, limit = 20 } = req.query;

    if (!q) {
      // @ts-ignore
      throw new ApiError(400 as any, 'Search query is required');
    }

    // For now, search in reports with basic text matching
    // In a production environment, you might want to use MongoDB text search
    const { reports } = await reportService.getReports({
      limit: parseInt(limit as string),
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });

    // Filter reports based on search query
    const searchResults = reports.filter((report: any) => {
      const query = (q as string).toLowerCase();
      return (
        report.reportNumber?.toLowerCase().includes(query) ||
        report.patientName?.toLowerCase().includes(query) ||
        report.patientMRN?.toLowerCase().includes(query) ||
        report.doctorName?.toLowerCase().includes(query) ||
        report.orderNumber?.toLowerCase().includes(query)
      );
    });

    return res.status(200).json(
      // @ts-ignore
      new ApiResponse(200 as any, 'Reports search completed', {
        data: searchResults
      })
    );
  });
}