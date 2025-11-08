import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService } from '../services/OrderService';
import { CreateOrderRequest, UpdateOrderRequest, OrderQueryParams, OrdersResponse } from '@/types/api.types';

// Query keys
export const orderKeys = {
  all: ['orders'] as const,
  lists: () => [...orderKeys.all, 'list'] as const,
  list: (params: OrderQueryParams) => [...orderKeys.lists(), params] as const,
  details: () => [...orderKeys.all, 'detail'] as const,
  detail: (id: string) => [...orderKeys.details(), id] as const,
  statistics: () => [...orderKeys.all, 'statistics'] as const,
  recent: () => [...orderKeys.all, 'recent'] as const,
  pendingTests: (id: string) => [...orderKeys.all, 'pendingTests', id] as const,
};

// Get orders list
export const useOrders = (params: OrderQueryParams = {}) => {
  return useQuery<OrdersResponse>({
    queryKey: orderKeys.list(params),
    queryFn: () => orderService.getOrders(params),
    staleTime: 30 * 1000, // 30 seconds
    retry: 2,
  });
};

// Get single order
export const useOrder = (id: string, enabled = true) => {
  return useQuery({
    queryKey: orderKeys.detail(id),
    queryFn: () => orderService.getOrder(id),
    enabled: enabled && !!id,
    staleTime: 60 * 1000, // 1 minute
    retry: 2,
  });
};

// Get order statistics
export const useOrderStatistics = (dateRange?: { start: string; end: string }) => {
  return useQuery({
    queryKey: [...orderKeys.statistics(), dateRange],
    queryFn: () => orderService.getOrderStatistics(dateRange),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};

// Get recent orders
export const useRecentOrders = (days: number = 7, limit: number = 10) => {
  return useQuery({
    queryKey: [...orderKeys.recent(), days, limit],
    queryFn: () => orderService.getRecentOrders(days, limit),
    staleTime: 60 * 1000, // 1 minute
    retry: 2,
  });
};

// Create order mutation
export const useCreateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderData: CreateOrderRequest) => orderService.createOrder(orderData),
    onSuccess: (newOrder) => {
      // Invalidate orders list
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: orderKeys.recent() });

      // Optionally pre-populate the new order in cache
      queryClient.setQueryData(orderKeys.detail(newOrder._id), newOrder);
    },
    onError: (error) => {
      console.error('Failed to create order:', error);
    },
  });
};

// Update order mutation
export const useUpdateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateOrderRequest }) =>
      orderService.updateOrder(id, data),
    onSuccess: (updatedOrder, { id }) => {
      // Update the order in cache
      queryClient.setQueryData(orderKeys.detail(id), updatedOrder);
      // Invalidate orders list
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
    },
    onError: (error) => {
      console.error('Failed to update order:', error);
    },
  });
};

// Update order status mutation
export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: string; notes?: string }) =>
      orderService.updateOrderStatus(id, status, notes),
    onSuccess: (updatedOrder, { id }) => {
      // Update the order in cache
      queryClient.setQueryData(orderKeys.detail(id), updatedOrder);
      // Invalidate orders list
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
    },
    onError: (error) => {
      console.error('Failed to update order status:', error);
    },
  });
};

// Add test to order mutation
export const useAddTestToOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, testId }: { orderId: string; testId: string }) =>
      orderService.addTestToOrder(orderId, testId),
    onSuccess: (updatedOrder, { orderId }) => {
      // Update the order in cache
      queryClient.setQueryData(orderKeys.detail(orderId), updatedOrder);
      // Invalidate orders list
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
    },
    onError: (error) => {
      console.error('Failed to add test to order:', error);
    },
  });
};

// Remove test from order mutation
export const useRemoveTestFromOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, testId }: { orderId: string; testId: string }) =>
      orderService.removeTestFromOrder(orderId, testId),
    onSuccess: (updatedOrder, { orderId }) => {
      // Update the order in cache
      queryClient.setQueryData(orderKeys.detail(orderId), updatedOrder);
      // Invalidate orders list
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
    },
    onError: (error) => {
      console.error('Failed to remove test from order:', error);
    },
  });
};

// Delete order mutation
export const useDeleteOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => orderService.deleteOrder(id),
    onSuccess: (_, id) => {
      // Remove the order from cache
      queryClient.removeQueries({ queryKey: orderKeys.detail(id) });
      // Invalidate orders list
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
    },
    onError: (error) => {
      console.error('Failed to delete order:', error);
    },
  });
};

// Cancel order mutation
export const useCancelOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      orderService.cancelOrder(id, reason),
    onSuccess: (updatedOrder, { id }) => {
      // Update the order in cache
      queryClient.setQueryData(orderKeys.detail(id), updatedOrder);
      // Invalidate orders list
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
    },
    onError: (error) => {
      console.error('Failed to cancel order:', error);
    },
  });
};

// Mark sample collected mutation
export const useMarkSampleCollected = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      orderService.markSampleCollected(id, notes),
    onSuccess: (updatedOrder, { id }) => {
      // Update the order in cache
      queryClient.setQueryData(orderKeys.detail(id), updatedOrder);
      // Invalidate orders list
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
    },
    onError: (error) => {
      console.error('Failed to mark sample as collected:', error);
    },
  });
};

// Complete order mutation
export const useCompleteOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => orderService.completeOrder(id),
    onSuccess: (updatedOrder, variables) => {
      // Update the order in cache
      queryClient.setQueryData(orderKeys.detail(variables), updatedOrder);
      // Invalidate orders list
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
    },
    onError: (error) => {
      console.error('Failed to complete order:', error);
    },
  });
};

// Update payment status mutation
export const useUpdatePaymentStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status, discount }: { id: string; status: string; discount?: number }) =>
      orderService.updatePaymentStatus(id, status, discount),
    onSuccess: (updatedOrder, { id }) => {
      // Update the order in cache
      queryClient.setQueryData(orderKeys.detail(id), updatedOrder);
      // Invalidate orders list
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
    },
    onError: (error) => {
      console.error('Failed to update payment status:', error);
    },
  });
};

// Get pending tests for result entry
export const usePendingTests = (orderId: string, enabled = true) => {
  return useQuery({
    queryKey: orderKeys.pendingTests(orderId),
    queryFn: () => orderService.getPendingTests(orderId),
    enabled: enabled && !!orderId,
    staleTime: 30 * 1000, // 30 seconds
    retry: 2,
  });
};