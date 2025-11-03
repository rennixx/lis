import { apiGet, apiPost, apiPut, apiDelete } from '../client';
import { ENDPOINTS, buildQueryParams, getPaginationParams, API_BASE_URL } from '../endpoints';
import { STORAGE_KEYS } from '@/utils/constants';
import {
  Report,
  CreateReportRequest,
  GeneratePDFRequest,
  BulkGenerateRequest,
  ReportStatistics,
  ReportQueryParams,
  PaginatedResponse,
  ApiResponse
} from '@/types/api.types';

class ReportService {
  private readonly baseUrl = ENDPOINTS.REPORTS;

  // Get all reports with pagination and filtering
  async getReports(params: ReportQueryParams = {}): Promise<PaginatedResponse<Report>> {
    const queryParams = {
      ...getPaginationParams(params),
      patientId: params.patientId,
      doctorId: params.doctorId,
      status: params.status,
      type: params.type,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
      sortBy: params.sortBy || 'createdAt',
      sortOrder: params.sortOrder || 'desc',
    };

    const url = `${this.baseUrl.LIST}${buildQueryParams(queryParams)}`;
    console.log('📊 [REPORT SERVICE] Fetching reports from:', url);

    const response = await apiGet<any>(url);

    console.log('📊 [REPORT SERVICE] Raw API response:', JSON.stringify(response, null, 2));

    if (response.success && response.data) {
      return {
        success: response.success,
        message: response.message,
        data: response.data.data?.reports || [],
        pagination: response.data.data?.pagination || {
          page: params.page || 1,
          limit: params.limit || 20,
          total: 0,
          pages: 0
        }
      };
    }

    throw new Error(response.message || 'Failed to get reports');
  }

  // Get single report by ID
  async getReport(id: string): Promise<Report> {
    const response = await apiGet<Report>(this.baseUrl.GET(id));
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to get report');
  }

  // Update report status
  async updateReportStatus(id: string, status: string, notes?: string): Promise<Report> {
    const response = await apiPut<Report>(this.baseUrl.UPDATE_STATUS(id), {
      status,
      notes
    });
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to update report status');
  }

  // Delete report
  async deleteReport(id: string): Promise<void> {
    const response = await apiDelete(this.baseUrl.DELETE(id));
    if (!response.success) {
      throw new Error(response.message || 'Failed to delete report');
    }
  }

  // Generate report from order
  async generateReportFromOrder(orderId: string, options: Omit<CreateReportRequest, 'order'> = {}): Promise<Report> {
    const requestData: CreateReportRequest = {
      order: orderId,
      ...options
    };
    const response = await apiPost<Report>(this.baseUrl.GENERATE_FROM_ORDER(orderId), requestData);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to generate report from order');
  }

  // Generate PDF for existing report
  async generatePDF(id: string, options: GeneratePDFRequest = {}): Promise<any> {
    const response = await apiPost<any>(this.baseUrl.GENERATE_PDF(id), options);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to generate PDF');
  }

  // Download PDF report
  async downloadPDF(id: string): Promise<{ blob: Blob; filename: string }> {
    const response = await fetch(`${API_BASE_URL}${this.baseUrl.DOWNLOAD_PDF(id)}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to download PDF');
    }

    // Get filename from Content-Disposition header or use default
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = `report_${id}.pdf`;

    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }

    const blob = await response.blob();
    return { blob, filename };
  }

  // View PDF in browser
  async viewPDF(id: string): Promise<string> {
    const response = await fetch(`${API_BASE_URL}${this.baseUrl.VIEW_PDF(id)}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to view PDF');
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
  }

  // Bulk generate reports
  async bulkGenerateReports(request: BulkGenerateRequest): Promise<any[]> {
    const response = await apiPost<any[]>(this.baseUrl.BULK_GENERATE, request);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to bulk generate reports');
  }

  // Search reports
  async searchReports(query: string, limit: number = 20): Promise<Report[]> {
    const response = await apiGet<Report[]>(
      `${this.baseUrl.SEARCH}${buildQueryParams({ q: query, limit })}`
    );

    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to search reports');
  }

  // Get report statistics
  async getReportStatistics(startDate?: string, endDate?: string): Promise<ReportStatistics> {
    const queryParams: any = {};
    if (startDate) queryParams.startDate = startDate;
    if (endDate) queryParams.endDate = endDate;
    // Add cache-busting timestamp
    queryParams.t = Date.now();

    const url = `${this.baseUrl.STATISTICS}${buildQueryParams(queryParams)}`;
    console.log('📊 [REPORT SERVICE] Fetching statistics from:', url);

    try {
      const response = await apiGet<ReportStatistics>(url);
      console.log('📊 [REPORT SERVICE] Statistics response:', response);
      console.log('📊 [REPORT SERVICE] Response data:', JSON.stringify(response.data, null, 2));

      if (response.success && response.data) {
        console.log('📊 [REPORT SERVICE] Returning statistics data:', response.data);
        return (response.data as any).data || response.data;
      } else {
        console.error('📊 [REPORT SERVICE] Invalid response structure:', response);
        throw new Error(response.message || 'Invalid response structure');
      }
    } catch (error) {
      console.error('📊 [REPORT SERVICE] Error fetching statistics:', error);
      throw error;
    }
  }

  // Get reports by patient
  async getReportsByPatient(patientId: string, params: ReportQueryParams = {}): Promise<PaginatedResponse<Report>> {
    return this.getReports({ ...params, patientId });
  }

  // Get reports by doctor
  async getReportsByDoctor(doctorId: string, params: ReportQueryParams = {}): Promise<PaginatedResponse<Report>> {
    return this.getReports({ ...params, doctorId });
  }

  // Get reports by date range
  async getReportsByDateRange(
    dateFrom: string,
    dateTo: string,
    params: ReportQueryParams = {}
  ): Promise<PaginatedResponse<Report>> {
    return this.getReports({ ...params, dateFrom, dateTo });
  }

  // Print report (opens print dialog)
  async printReport(id: string): Promise<void> {
    try {
      const pdfUrl = await this.viewPDF(id);
      const printWindow = window.open(pdfUrl, '_blank');

      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      } else {
        // Fallback: download and open
        const { blob } = await this.downloadPDF(id);
        const url = URL.createObjectURL(blob);
        const printWindow = window.open(url, '_blank');

        if (printWindow) {
          printWindow.onload = () => {
            printWindow.print();
          };
        }
      }
    } catch (error) {
      throw new Error('Failed to print report');
    }
  }

  // Email report (placeholder - would need backend email functionality)
  async emailReport(id: string, emailAddress: string, subject?: string): Promise<void> {
    // This would be implemented when email functionality is added to the backend
    throw new Error('Email functionality not yet implemented');
  }
}

export const reportService = new ReportService();
export default reportService;