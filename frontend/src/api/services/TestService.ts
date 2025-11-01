import { apiGet } from '../client';
import { ENDPOINTS, buildQueryParams } from '../endpoints';
import { ApiResponse } from '@/types/api.types';

interface Test {
  id: string;
  testName: string;
  testCode: string;
  category: string;
  price: number;
  description?: string;
  specimenType?: string;
  turnaroundTime?: {
    value: number;
    unit: string;
  };
}

interface TestPanel {
  id: string;
  name: string;
  description: string;
  tests: Test[];
  category: string;
  totalPrice: number;
  actualPrice: number;
}

class TestService {
  private readonly baseUrl = ENDPOINTS.TESTS;

  // Get available tests for order creation
  async getAvailableTests(filters: {
    category?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  } = {}): Promise<Test[]> {
    const queryParams = buildQueryParams(filters);
    const response = await apiGet<ApiResponse<Test[]>>(`${this.baseUrl.AVAILABLE}${queryParams}`);

    if (response.success && response.data?.data) {
      return response.data.data;
    }
    throw new Error(response.message || 'Failed to get available tests');
  }

  // Get popular test panels
  async getPopularPanels(limit: number = 10): Promise<TestPanel[]> {
    const queryParams = buildQueryParams({ limit });
    const response = await apiGet<ApiResponse<TestPanel[]>>(`${this.baseUrl.POPULAR_PANELS}${queryParams}`);

    if (response.success && response.data?.data) {
      return response.data.data;
    }
    throw new Error(response.message || 'Failed to get popular panels');
  }

  // Get tests by category
  async getTestsByCategory(category: string): Promise<Test[]> {
    const response = await apiGet<ApiResponse<Test[]>>(`${this.baseUrl.CATEGORY}/${category}`);

    if (response.success && response.data?.data) {
      return response.data.data;
    }
    throw new Error(response.message || 'Failed to get tests by category');
  }

  // Search tests (autocomplete)
  async searchTests(query: string): Promise<Test[]> {
    const queryParams = buildQueryParams({ q: query });
    const response = await apiGet<ApiResponse<Test[]>>(`${this.baseUrl.SEARCH}${queryParams}`);

    if (response.success && response.data?.data) {
      return response.data.data;
    }
    throw new Error(response.message || 'Failed to search tests');
  }

  // Get all tests with pagination
  async getAllTests(params: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    isActive?: boolean;
    sortBy?: string;
    sortOrder?: string;
  } = {}): Promise<any> {
    const queryParams = buildQueryParams(params);
    const response = await apiGet<ApiResponse<any>>(`${this.baseUrl.LIST}${queryParams}`);

    if (response.success && response.data?.data) {
      return response.data.data;
    }
    throw new Error(response.message || 'Failed to get tests');
  }

  // Get single test
  async getTestById(id: string): Promise<Test> {
    const response = await apiGet<ApiResponse<Test>>(`${this.baseUrl.DETAIL}/${id}`);

    if (response.success && response.data?.data) {
      return response.data.data;
    }
    throw new Error(response.message || 'Failed to get test');
  }
}

export const testService = new TestService();