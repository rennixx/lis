import { apiGet, apiPost, apiPut, apiDelete, apiPatch } from '../client';
import { ENDPOINTS, buildQueryParams, getPaginationParams, API_BASE_URL } from '../endpoints';
import {
  Result,
  CreateResultRequest,
  UpdateResultRequest,
  ResultQueryParams,
  PaginatedResponse,
  ApiResponse
} from '@/types/api.types';

class ResultService {
  private readonly baseUrl = ENDPOINTS.RESULTS;

  // Create new result
  async createResult(resultData: CreateResultRequest): Promise<Result> {
    const response = await apiPost<ApiResponse<Result>>(this.baseUrl.CREATE, resultData);

    if (response.success && response.data?.data) {
      return response.data.data;
    }
    throw new Error(response.message || 'Failed to create result');
  }

  // Create bulk results
  async createBulkResults(resultsData: CreateResultRequest[]): Promise<Result[]> {
    const response = await apiPost<ApiResponse<Result[]>>(this.baseUrl.BULK, { results: resultsData });

    if (response.success && response.data?.data) {
      return response.data.data;
    }
    throw new Error(response.message || 'Failed to create bulk results');
  }

  // Get all results with pagination and filtering
  async getResults(params: ResultQueryParams = {}): Promise<PaginatedResponse<Result>> {
    const queryParams = {
      ...getPaginationParams(params),
      status: params.status,
      patientId: params.patientId,
      testId: params.testId,
      orderId: params.orderId,
      criticalValue: params.criticalValue,
      isAbnormal: params.isAbnormal,
      startDate: params.startDate,
      endDate: params.endDate,
      search: params.search,
      sortBy: params.sort || 'createdAt',
      sortOrder: params.order || 'desc',
      // Add cache-busting timestamp
      t: Date.now()
    };
    const url = `${this.baseUrl.LIST}${buildQueryParams(queryParams)}`;
    console.log('🔍 [RESULT SERVICE] Fetching results from:', url);

    const response = await apiGet<ApiResponse<PaginatedResponse<Result>>>(url);

    if (response.success && response.data?.data) {
      return {
        success: response.success,
        message: response.message,
        data: (response.data.data as any).results || [],
        pagination: (response.data.data as any).pagination || {
          page: 1,
          limit: Number(params.limit) || 20,
          total: 0,
          pages: 0
        }
      };
    }

    throw new Error(response.message || 'Failed to get results');
  }

  // Get single result by ID
  async getResult(id: string): Promise<Result> {
    const response = await apiGet<ApiResponse<Result>>(this.baseUrl.GET(id));
    if (response.success && response.data?.data) {
      return response.data.data;
    }
    throw new Error(response.message || 'Failed to get result');
  }

  // Update result
  async updateResult(id: string, resultData: UpdateResultRequest): Promise<Result> {
    const response = await apiPatch<ApiResponse<Result>>(this.baseUrl.UPDATE(id), resultData);
    if (response.success && response.data?.data) {
      return response.data.data;
    }
    throw new Error(response.message || 'Failed to update result');
  }

  // Update result value
  async updateResultValue(id: string, value: any): Promise<Result> {
    const response = await apiPatch<ApiResponse<Result>>(this.baseUrl.UPDATE_VALUE(id), { value });
    if (response.success && response.data?.data) {
      return response.data.data;
    }
    throw new Error(response.message || 'Failed to update result value');
  }

  // Verify result
  async verifyResult(id: string): Promise<Result> {
    const response = await apiPost<ApiResponse<Result>>(this.baseUrl.VERIFY(id));
    if (response.success && response.data?.data) {
      return response.data.data;
    }
    throw new Error(response.message || 'Failed to verify result');
  }

  // Bulk verify results
  async bulkVerifyResults(resultIds: string[]): Promise<any> {
    const response = await apiPost<ApiResponse<any>>(this.baseUrl.BULK_VERIFY, { resultIds });
    if (response.success && response.data?.data) {
      return response.data.data;
    }
    throw new Error(response.message || 'Failed to bulk verify results');
  }

  // Reject result
  async rejectResult(id: string, reason: string): Promise<Result> {
    const response = await apiPost<ApiResponse<Result>>(this.baseUrl.REJECT(id), { reason });
    if (response.success && response.data?.data) {
      return response.data.data;
    }
    throw new Error(response.message || 'Failed to reject result');
  }

  // Bulk reject results
  async bulkRejectResults(resultIds: string[], reason: string): Promise<any> {
    const response = await apiPost<ApiResponse<any>>(this.baseUrl.BULK_REJECT, { resultIds, reason });
    if (response.success && response.data?.data) {
      return response.data.data;
    }
    throw new Error(response.message || 'Failed to bulk reject results');
  }

  // Mark result as critical
  async markResultAsCritical(id: string): Promise<Result> {
    const response = await apiPost<ApiResponse<Result>>(this.baseUrl.MARK_CRITICAL(id));
    if (response.success && response.data?.data) {
      return response.data.data;
    }
    throw new Error(response.message || 'Failed to mark result as critical');
  }

  // Add comment to result
  async addCommentToResult(id: string, comment: string): Promise<Result> {
    const response = await apiPost<ApiResponse<Result>>(this.baseUrl.COMMENT(id), { comment });
    if (response.success && response.data?.data) {
      return response.data.data;
    }
    throw new Error(response.message || 'Failed to add comment to result');
  }

  // Get results by order
  async getResultsByOrder(orderId: string): Promise<Result[]> {
    const response = await apiGet<ApiResponse<Result[]>>(this.baseUrl.BY_ORDER(orderId));
    if (response.success && response.data?.data) {
      return response.data.data;
    }
    throw new Error(response.message || 'Failed to get results by order');
  }

  // Get results by patient
  async getResultsByPatient(patientId: string, limit: number = 100): Promise<Result[]> {
    const response = await apiGet<ApiResponse<Result[]>>(
      `${this.baseUrl.BY_PATIENT(patientId)}${buildQueryParams({ limit })}`
    );
    if (response.success && response.data?.data) {
      return response.data.data;
    }
    throw new Error(response.message || 'Failed to get results by patient');
  }

  // Get critical results
  async getCriticalResults(): Promise<Result[]> {
    const response = await apiGet<ApiResponse<Result[]>>(this.baseUrl.CRITICAL);
    if (response.success && response.data?.data) {
      return (response.data.data as any) || [];
    }
    throw new Error(response.message || 'Failed to get critical results');
  }

  // Get abnormal results
  async getAbnormalResults(limit: number = 50): Promise<Result[]> {
    const response = await apiGet<ApiResponse<Result[]>>(
      `${this.baseUrl.ABNORMAL}${buildQueryParams({ limit })}`
    );
    if (response.success && response.data?.data) {
      return (response.data.data as any) || [];
    }
    throw new Error(response.message || 'Failed to get abnormal results');
  }

  // Get results for review
  async getResultsForReview(limit: number = 20): Promise<Result[]> {
    const response = await apiGet<ApiResponse<Result[]>>(
      `${this.baseUrl.REVIEW}${buildQueryParams({ limit })}`
    );
    if (response.success && response.data?.data) {
      return response.data.data;
    }
    throw new Error(response.message || 'Failed to get results for review');
  }

  // Search results
  async searchResults(query: string, limit: number = 20): Promise<Result[]> {
    const response = await apiGet<ApiResponse<Result[]>>(
      `${this.baseUrl.SEARCH}${buildQueryParams({ q: query, limit })}`
    );
    if (response.success && response.data?.data) {
      return response.data.data;
    }
    throw new Error(response.message || 'Failed to search results');
  }

  // Get result statistics
  async getResultStatistics(startDate?: string, endDate?: string): Promise<any> {
    const queryParams = buildQueryParams({ startDate, endDate });
    const response = await apiGet<ApiResponse<any>>(
      `${this.baseUrl.STATISTICS}${queryParams}`
    );
    if (response.success && response.data?.data) {
      return response.data.data;
    }
    throw new Error(response.message || 'Failed to get result statistics');
  }

  // Generate PDF for a result
  async generateResultPDF(resultId: string, options: { template?: string; includePatientInfo?: boolean; includeLabInfo?: boolean } = {}): Promise<any> {
    const response = await apiPost<ApiResponse<any>>(this.baseUrl.GENERATE_PDF(resultId), options);
    if (response.success && response.data?.data) {
      return response.data.data;
    }
    throw new Error(response.message || 'Failed to generate result PDF');
  }

  // Download PDF for a result
  async downloadResultPDF(resultId: string): Promise<Blob> {
    const token = localStorage.getItem('lis_auth_token');
    const response = await fetch(`${API_BASE_URL}${this.baseUrl.DOWNLOAD_PDF(resultId)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to download PDF: ${response.statusText}`);
    }

    return response.blob();
  }

  // View PDF for a result (inline)
  async viewResultPDF(resultId: string): Promise<string> {
    const token = localStorage.getItem('lis_auth_token');
    const response = await fetch(`${API_BASE_URL}${this.baseUrl.VIEW_PDF(resultId)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to view PDF: ${response.statusText}`);
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
  }
}

export const resultService = new ResultService();
export default resultService;