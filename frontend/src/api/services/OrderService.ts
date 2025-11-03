import { apiGet, apiPost, apiPut, apiDelete, apiPatch } from '../client';
import { ENDPOINTS, buildQueryParams } from '../endpoints';
import {
  Order,
  CreateOrderRequest,
  UpdateOrderRequest,
  OrderQueryParams,
  PaginatedResponse,
  ApiResponse
} from '@/types/api.types';

class OrderService {
  private readonly baseUrl = ENDPOINTS.ORDERS;

  // Create new order
  async createOrder(orderData: CreateOrderRequest): Promise<Order> {
    const response = await apiPost<ApiResponse<Order>>(this.baseUrl.CREATE, orderData);

    if (response.success && response.data?.data) {
      return response.data.data;
    }
    throw new Error(response.message || 'Failed to create order');
  }

  // Get all orders with pagination and filtering
  async getOrders(params: OrderQueryParams = {}): Promise<PaginatedResponse<Order>> {
    const queryParams = buildQueryParams(params);
    const response = await apiGet<ApiResponse<PaginatedResponse<Order>>>(
      `${this.baseUrl.LIST}${queryParams}`
    );

    if (response.success && response.data?.data) {
      return response.data.data;
    }
    throw new Error(response.message || 'Failed to get orders');
  }

  // Get single order by ID
  async getOrder(id: string): Promise<Order> {
    const response = await apiGet<ApiResponse<Order>>(this.baseUrl.GET(id));

    if (response.success && response.data?.data) {
      return response.data.data;
    }
    throw new Error(response.message || 'Failed to get order');
  }

  // Update order
  async updateOrder(id: string, data: UpdateOrderRequest): Promise<Order> {
    const response = await apiPut<ApiResponse<Order>>(this.baseUrl.UPDATE(id), data);

    if (response.success && response.data?.data) {
      return response.data.data;
    }
    throw new Error(response.message || 'Failed to update order');
  }

  // Update order status
  async updateOrderStatus(id: string, status: string, notes?: string): Promise<Order> {
    const response = await apiPatch<ApiResponse<Order>>(this.baseUrl.UPDATE_STATUS(id), {
      status,
      notes
    });

    if (response.success && response.data?.data) {
      return response.data.data;
    }
    throw new Error(response.message || 'Failed to update order status');
  }

  // Add test to order
  async addTestToOrder(orderId: string, testId: string): Promise<Order> {
    const response = await apiPost<ApiResponse<Order>>(this.baseUrl.ADD_TEST(orderId), {
      testId
    });

    if (response.success && response.data?.data) {
      return response.data.data;
    }
    throw new Error(response.message || 'Failed to add test to order');
  }

  // Remove test from order
  async removeTestFromOrder(orderId: string, testId: string): Promise<Order> {
    const response = await apiDelete<ApiResponse<Order>>(this.baseUrl.REMOVE_TEST(orderId, testId));

    if (response.success && response.data?.data) {
      return response.data.data;
    }
    throw new Error(response.message || 'Failed to remove test from order');
  }

  // Delete order
  async deleteOrder(id: string): Promise<void> {
    const response = await apiDelete<ApiResponse<void>>(this.baseUrl.DELETE(id));

    if (!response.success) {
      throw new Error(response.message || 'Failed to delete order');
    }
  }

  // Get order statistics
  async getOrderStatistics(dateRange?: { start: string; end: string }): Promise<any> {
    const queryParams = dateRange ? buildQueryParams(dateRange) : '';
    const response = await apiGet<ApiResponse<any>>(`${this.baseUrl.STATISTICS}${queryParams}`);

    if (response.success && response.data?.data) {
      return response.data.data;
    }
    throw new Error(response.message || 'Failed to get order statistics');
  }

  // Get recent orders
  async getRecentOrders(days: number = 7, limit: number = 10): Promise<Order[]> {
    const response = await apiGet<ApiResponse<Order[]>>(
      `${this.baseUrl.RECENT}?days=${days}&limit=${limit}`
    );

    if (response.success && response.data?.data) {
      return response.data.data;
    }
    throw new Error(response.message || 'Failed to get recent orders');
  }

  // Cancel order
  async cancelOrder(id: string, reason: string): Promise<Order> {
    const response = await apiPost<ApiResponse<Order>>(`${this.baseUrl.CANCEL}/${id}`, {
      reason
    });

    if (response.success && response.data?.data) {
      return response.data.data;
    }
    throw new Error(response.message || 'Failed to cancel order');
  }

  // Mark sample as collected
  async markSampleCollected(id: string, notes?: string): Promise<Order> {
    const response = await apiPost<ApiResponse<Order>>(`${this.baseUrl.COLLECT_SAMPLE}/${id}`, {
      notes
    });

    if (response.success && response.data?.data) {
      return response.data.data;
    }
    throw new Error(response.message || 'Failed to mark sample as collected');
  }

  // Complete order
  async completeOrder(id: string): Promise<Order> {
    const response = await apiPost<ApiResponse<Order>>(`${this.baseUrl.COMPLETE}/${id}`);

    if (response.success && response.data?.data) {
      return response.data.data;
    }
    throw new Error(response.message || 'Failed to complete order');
  }

  // Update payment status
  async updatePaymentStatus(id: string, status: string, discount?: number): Promise<Order> {
    const response = await apiPatch<ApiResponse<Order>>(`${this.baseUrl.UPDATE_PAYMENT}/${id}`, {
      status,
      discount
    });

    if (response.success && response.data?.data) {
      return response.data.data;
    }
    throw new Error(response.message || 'Failed to update payment status');
  }

  // Get pending tests for result entry
  async getPendingTests(orderId: string): Promise<any> {
    const response = await apiGet<ApiResponse<any>>(this.baseUrl.PENDING_TESTS(orderId));
    if (response.success && response.data?.data) {
      return response.data.data;
    }
    throw new Error(response.message || 'Failed to get pending tests');
  }
}

export const orderService = new OrderService();