import { apiGet, apiPost, apiPut, apiDelete } from '../client';
import { ENDPOINTS, buildQueryParams, getPaginationParams } from '../endpoints';
import {
  Sample,
  CreateSampleRequest,
  UpdateSampleRequest,
  SampleQueryParams,
  PaginatedResponse,
  ApiResponse
} from '@/types/api.types';

class SampleService {
  private readonly baseUrl = ENDPOINTS.SAMPLES;

  // Get all samples with pagination and filtering
  async getSamples(params: SampleQueryParams = {}): Promise<PaginatedResponse<Sample>> {
    const paginationParams = getPaginationParams(params);
    const filterParams = buildQueryParams({
      status: params.status,
      priority: params.priority,
      sampleType: params.sampleType,
      patientId: params.patientId,
      orderId: params.orderId,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
      collectedBy: params.collectedBy,
      search: params.search
    });

    // Remove the leading '?' from filterParams if present
    const filterString = filterParams.startsWith('?') ? filterParams.slice(1) : filterParams;

    // Parse filter string into object
    const filterObj: Record<string, string> = {};
    if (filterString) {
      filterString.split('&').forEach(param => {
        const [key, value] = param.split('=');
        if (key && value) {
          filterObj[key] = decodeURIComponent(value);
        }
      });
    }

    const queryParams = { ...paginationParams, ...filterObj };

    const url = `${this.baseUrl.LIST}${buildQueryParams(queryParams)}`;
    console.log('🔍 [SAMPLE SERVICE] Fetching samples from:', url);

    const response = await apiGet<PaginatedResponse<Sample>>(url);

    if (response.success && response.data) {
      return {
        success: response.success,
        message: response.message,
        data: response.data.data,
        pagination: response.data.pagination || {
          page: 1,
          limit: Number(queryParams.limit) || 20,
          total: 0,
          pages: 0
        }
      };
    }

    throw new Error(response.message || 'Failed to get samples');
  }

  // Get single sample by ID
  async getSample(id: string): Promise<Sample> {
    const response = await apiGet<Sample>(this.baseUrl.GET(id));
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to get sample');
  }

  // Get sample by barcode
  async getSampleByBarcode(barcode: string): Promise<Sample> {
    const response = await apiGet<Sample>(this.baseUrl.BARCODE(barcode));
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to get sample by barcode');
  }

  // Create new sample
  async createSample(sampleData: CreateSampleRequest): Promise<Sample> {
    const response = await apiPost<Sample>(this.baseUrl.CREATE, sampleData);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to create sample');
  }

  // Update sample
  async updateSample(id: string, sampleData: UpdateSampleRequest): Promise<Sample> {
    const response = await apiPut<Sample>(this.baseUrl.UPDATE(id), sampleData);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to update sample');
  }

  // Delete sample
  async deleteSample(id: string): Promise<void> {
    const response = await apiDelete(this.baseUrl.DELETE(id));
    if (!response.success) {
      throw new Error(response.message || 'Failed to delete sample');
    }
  }

  // Get pending collections queue
  async getPendingCollectionsQueue(limit: number = 50): Promise<Sample[]> {
    const url = `${this.baseUrl.QUEUE}?limit=${limit}`;
    const response = await apiGet<Sample[]>(url);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to get pending collections');
  }

  // Confirm sample collection
  async confirmCollection(sampleId: string, collectionData: {
    actualVolume?: number;
    collectionNotes?: string;
  }): Promise<Sample> {
    const response = await apiPost<Sample>(this.baseUrl.CONFIRM_COLLECTION(sampleId), collectionData);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to confirm collection');
  }

  // Bulk update sample status
  async bulkUpdateStatus(sampleIds: string[], newStatus: string, notes?: string): Promise<{
    modifiedCount: number;
    message: string;
  }> {
    const response = await apiPost<any>(this.baseUrl.BULK_STATUS, {
      sampleIds,
      newStatus,
      notes
    });
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to bulk update status');
  }

  // Receive samples in laboratory
  async receiveSamples(sampleIds: string[], notes?: string): Promise<{
    modifiedCount: number;
    message: string;
  }> {
    const response = await apiPost<any>(this.baseUrl.RECEIVE, {
      sampleIds,
      notes
    });
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to receive samples');
  }

  // Start processing samples
  async startProcessing(sampleIds: string[], notes?: string): Promise<{
    modifiedCount: number;
    message: string;
  }> {
    const response = await apiPost<any>(this.baseUrl.START_PROCESSING, {
      sampleIds,
      notes
    });
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to start processing');
  }

  // Complete sample processing
  async completeProcessing(sampleIds: string[], notes?: string): Promise<{
    modifiedCount: number;
    message: string;
  }> {
    const response = await apiPost<any>(this.baseUrl.COMPLETE_PROCESSING, {
      sampleIds,
      notes
    });
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to complete processing');
  }

  // Search samples
  async searchSamples(query: string, limit: number = 20): Promise<Sample[]> {
    const url = `${this.baseUrl.SEARCH}?q=${encodeURIComponent(query)}&limit=${limit}`;
    const response = await apiGet<Sample[]>(url);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to search samples');
  }

  // Get collection statistics
  async getCollectionStatistics(startDate?: string, endDate?: string): Promise<any> {
    const queryParams = buildQueryParams({
      startDate,
      endDate
    });
    const url = `${this.baseUrl.STATISTICS}${queryParams}`;
    const response = await apiGet<any>(url);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to get collection statistics');
  }

  // Get samples by status counts
  async getSamplesByStatusCounts(): Promise<any> {
    const response = await apiGet<any>(this.baseUrl.STATUS_COUNTS);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to get status counts');
  }

  // Generate barcode for sample
  async generateBarcode(sampleId: string): Promise<{
    sampleId: string;
    barcode: string;
    sampleType: string;
    collectionDate: string;
  }> {
    const response = await apiGet<any>(this.baseUrl.GENERATE_BARCODE(sampleId));
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to generate barcode');
  }

  // Print sample labels
  async printSampleLabels(sampleIds: string[]): Promise<{
    labels: Array<{
      sampleId: string;
      barcode: string;
      sampleType: string;
      priority: string;
      collectionDate: string;
    }>;
    count: number;
  }> {
    const response = await apiPost<any>(this.baseUrl.PRINT_LABELS, {
      sampleIds
    });
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to print sample labels');
  }
}

export const sampleService = new SampleService();
export default sampleService;