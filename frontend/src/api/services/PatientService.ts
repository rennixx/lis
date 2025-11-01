import { apiGet, apiPost, apiPut, apiDelete } from '../client';
import { ENDPOINTS, buildQueryParams, getPaginationParams, getSearchParams } from '../endpoints';
import {
  Patient,
  CreatePatientRequest,
  PaginatedResponse,
  PaginationParams,
  PatientQueryParams,
  ApiResponse
} from '@/types/api.types';

class PatientService {
  private readonly baseUrl = ENDPOINTS.PATIENTS;

  // Get all patients with pagination and filtering
  async getPatients(params: PatientQueryParams = {}): Promise<PaginatedResponse<Patient>> {
    const queryParams = {
      ...getPaginationParams(params),
      ...getSearchParams({
        search: params.search,
        filters: {
          gender: params.gender,
          bloodGroup: params.bloodGroup,
        },
      }),
    };

    const url = `${this.baseUrl.LIST}${buildQueryParams(queryParams)}`;
    console.log('🔍 [PATIENT SERVICE] Fetching patients from:', url);
    console.log('🔍 [PATIENT SERVICE] Query params:', queryParams);

    const response = await apiGet<PaginatedResponse<Patient>>(url);

    console.log('🔍 [PATIENT SERVICE] Raw response:', response);
    console.log('🔍 [PATIENT SERVICE] Response success:', response.success);
    console.log('🔍 [PATIENT SERVICE] Response data:', response.data);

    if (response.success && response.data) {
      // Handle case where response.data is empty array
      if (Array.isArray(response.data) && response.data.length === 0) {
        console.log('🔍 [PATIENT SERVICE] Empty data array received, returning empty paginated response');
        return {
          success: true,
          message: response.message,
          data: [],
          pagination: response.pagination || {
            page: 1,
            limit: Number(queryParams.limit) || 10,
            total: 0,
            pages: 0
          }
        };
      }
      // Return the full paginated response structure
      return {
        success: response.success,
        message: response.message,
        data: response.data.data,
        pagination: response.data.pagination || {
          page: 1,
          limit: Number(queryParams.limit) || 10,
          total: 0,
          pages: 0
        }
      };
    }

    console.log('🔍 [PATIENT SERVICE] Failed to get patients:', response.message);
    throw new Error(response.message || 'Failed to get patients');
  }

  // Get single patient by ID
  async getPatient(id: string): Promise<Patient> {
    const response = await apiGet<Patient>(this.baseUrl.GET(id));
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to get patient');
  }

  // Create new patient
  async createPatient(patientData: CreatePatientRequest): Promise<Patient> {
    const response = await apiPost<Patient>(this.baseUrl.CREATE, patientData);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to create patient');
  }

  // Update patient
  async updatePatient(id: string, patientData: Partial<CreatePatientRequest>): Promise<Patient> {
    const response = await apiPut<Patient>(this.baseUrl.UPDATE(id), patientData);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to update patient');
  }

  // Delete patient (soft delete)
  async deletePatient(id: string): Promise<void> {
    const response = await apiDelete(this.baseUrl.DELETE(id));
    if (!response.success) {
      throw new Error(response.message || 'Failed to delete patient');
    }
  }

  // Search patients
  async searchPatients(query: string, filters?: Record<string, any>): Promise<Patient[]> {
    const queryParams = getSearchParams({
      search: query,
      filters,
    });

    const response = await apiGet<Patient[]>(
      `${this.baseUrl.SEARCH}${buildQueryParams(queryParams)}`
    );

    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to search patients');
  }

  // Get patient history
  async getPatientHistory(id: string): Promise<any[]> {
    const response = await apiGet<any[]>(this.baseUrl.HISTORY(id));
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to get patient history');
  }

  // Get patients by phone number
  async getPatientsByPhone(phone: string): Promise<Patient[]> {
    const response = await apiGet<Patient[]>(
      `${this.baseUrl.SEARCH}${buildQueryParams({ phone })}`
    );

    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to get patients by phone');
  }

  // Get patients by email
  async getPatientsByEmail(email: string): Promise<Patient[]> {
    const response = await apiGet<Patient[]>(
      `${this.baseUrl.SEARCH}${buildQueryParams({ email })}`
    );

    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to get patients by email');
  }

  // Get patients by date range
  async getPatientsByDateRange(fromDate: string, toDate: string): Promise<Patient[]> {
    const response = await apiGet<Patient[]>(
      `${this.baseUrl.LIST}${buildQueryParams({
        fromDate,
        toDate,
      })}`
    );

    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to get patients by date range');
  }

  // Get patient statistics
  async getPatientStats(): Promise<{
    total: number;
    active: number;
    newThisMonth: number;
    byGender: Record<string, number>;
    byBloodGroup: Record<string, number>;
  }> {
    const response = await apiGet<any>(`${this.baseUrl.LIST}/stats`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to get patient statistics');
  }

  // Get patient dashboard data
  async getPatientDashboard(id: string): Promise<{
    patient: Patient;
    recentOrders: any[];
    recentResults: any[];
    testHistory: any[];
  }> {
    const response = await apiGet<any>(`${this.baseUrl.GET(id)}/dashboard`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to get patient dashboard');
  }

  // Export patients to CSV
  async exportPatients(params: PatientQueryParams = {}): Promise<Blob> {
    const queryParams = {
      ...getPaginationParams(params),
      ...getSearchParams({
        search: params.search,
        filters: {
          gender: params.gender,
          bloodGroup: params.bloodGroup,
        },
      }),
      export: 'csv',
    };

    const response = await fetch(`${ENDPOINTS.PATIENTS.LIST}${buildQueryParams(queryParams)}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to export patients');
    }

    return response.blob();
  }

  // Import patients from CSV
  async importPatients(file: File): Promise<{
    success: number;
    failed: number;
    errors: string[];
  }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${ENDPOINTS.PATIENTS.LIST}/import`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to import patients');
    }

    return response.json();
  }
}

export const patientService = new PatientService();
export default patientService;