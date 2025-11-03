import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { resultService } from '../services/ResultService';
import { CreateResultRequest, UpdateResultRequest, ResultQueryParams, Result } from '@/types/api.types';

// Query keys
export const resultKeys = {
  all: ['results'] as const,
  lists: () => [...resultKeys.all, 'list'] as const,
  list: (params: ResultQueryParams) => [...resultKeys.lists(), params] as const,
  details: () => [...resultKeys.all, 'detail'] as const,
  detail: (id: string) => [...resultKeys.details(), id] as const,
  statistics: () => [...resultKeys.all, 'statistics'] as const,
  critical: () => [...resultKeys.all, 'critical'] as const,
  abnormal: () => [...resultKeys.all, 'abnormal'] as const,
  review: () => [...resultKeys.all, 'review'] as const,
  search: () => [...resultKeys.all, 'search'] as const,
  byOrder: (orderId: string) => [...resultKeys.all, 'order', orderId] as const,
  byPatient: (patientId: string) => [...resultKeys.all, 'patient', patientId] as const,
};

// Get results list
export const useResults = (params: ResultQueryParams = {}) => {
  return useQuery({
    queryKey: resultKeys.list(params),
    queryFn: () => resultService.getResults(params),
    staleTime: 30 * 1000, // 30 seconds
    retry: 2,
  });
};

// Get single result
export const useResult = (id: string, enabled = true) => {
  return useQuery({
    queryKey: resultKeys.detail(id),
    queryFn: () => resultService.getResult(id),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};

// Get results by order
export const useResultsByOrder = (orderId: string, enabled = true) => {
  return useQuery({
    queryKey: resultKeys.byOrder(orderId),
    queryFn: () => resultService.getResultsByOrder(orderId),
    enabled: enabled && !!orderId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 2,
  });
};

// Get results by patient
export const useResultsByPatient = (patientId: string, limit: number = 100, enabled = true) => {
  return useQuery({
    queryKey: [...resultKeys.byPatient(patientId), limit],
    queryFn: () => resultService.getResultsByPatient(patientId, limit),
    enabled: enabled && !!patientId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 2,
  });
};

// Get result statistics
export const useResultStatistics = (dateRange?: { start: string; end: string }) => {
  return useQuery({
    queryKey: [...resultKeys.statistics(), dateRange],
    queryFn: () => resultService.getResultStatistics(dateRange?.start, dateRange?.end),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};

// Get critical results
export const useCriticalResults = () => {
  return useQuery({
    queryKey: resultKeys.critical(),
    queryFn: () => resultService.getCriticalResults(),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
    retry: 2,
  });
};

// Get abnormal results
export const useAbnormalResults = (limit: number = 50) => {
  return useQuery({
    queryKey: [...resultKeys.abnormal(), limit],
    queryFn: () => resultService.getAbnormalResults(limit),
    staleTime: 30 * 1000, // 30 seconds
    retry: 2,
  });
};

// Get results for review
export const useResultsForReview = (limit: number = 20) => {
  return useQuery({
    queryKey: [...resultKeys.review(), limit],
    queryFn: () => resultService.getResultsForReview(limit),
    staleTime: 30 * 1000, // 30 seconds
    retry: 2,
  });
};

// Search results
export const useSearchResults = (query: string, limit: number = 20) => {
  return useQuery({
    queryKey: [...resultKeys.search(), { query, limit }],
    queryFn: () => resultService.searchResults(query, limit),
    enabled: !!query && query.length >= 2,
    staleTime: 10 * 1000, // 10 seconds
    retry: 1,
  });
};

// Create result mutation
export const useCreateResult = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (resultData: CreateResultRequest) =>
      resultService.createResult(resultData),
    onSuccess: (newResult) => {
      // Invalidate and refetch results list
      queryClient.invalidateQueries({ queryKey: resultKeys.lists() });
      queryClient.setQueryData(resultKeys.detail(newResult._id), newResult);
      console.log('Result created successfully');
    },
    onError: (error) => {
      console.error('Failed to create result:', error);
    },
  });
};

// Bulk create results mutation
export const useBulkCreateResults = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (resultsData: CreateResultRequest[]) =>
      resultService.createBulkResults(resultsData),
    onSuccess: (createdResults) => {
      // Invalidate and refetch results list
      queryClient.invalidateQueries({ queryKey: resultKeys.lists() });
      console.log(`Successfully created ${createdResults.length} results`);
    },
    onError: (error) => {
      console.error('Failed to create bulk results:', error);
    },
  });
};

// Update result mutation
export const useUpdateResult = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateResultRequest }) =>
      resultService.updateResult(id, data),
    onSuccess: (updatedResult) => {
      // Update cached result data
      queryClient.setQueryData(resultKeys.detail(updatedResult._id), updatedResult);
      // Invalidate and refetch results list
      queryClient.invalidateQueries({ queryKey: resultKeys.lists() });
      console.log('Result updated successfully');
    },
    onError: (error) => {
      console.error('Failed to update result:', error);
    },
  });
};

// Update result value mutation
export const useUpdateResultValue = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, value }: { id: string; value: any }) =>
      resultService.updateResultValue(id, value),
    onSuccess: (updatedResult) => {
      // Update cached result data
      queryClient.setQueryData(resultKeys.detail(updatedResult._id), updatedResult);
      // Invalidate and refetch results list
      queryClient.invalidateQueries({ queryKey: resultKeys.lists() });
      console.log('Result value updated successfully');
    },
    onError: (error) => {
      console.error('Failed to update result value:', error);
    },
  });
};

// Verify result mutation
export const useVerifyResult = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => resultService.verifyResult(id),
    onSuccess: (verifiedResult) => {
      // Update cached result data
      queryClient.setQueryData(resultKeys.detail(verifiedResult._id), verifiedResult);
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: resultKeys.lists() });
      queryClient.invalidateQueries({ queryKey: resultKeys.review() });
      console.log('Result verified successfully');
    },
    onError: (error) => {
      console.error('Failed to verify result:', error);
    },
  });
};

// Bulk verify results mutation
export const useBulkVerifyResults = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (resultIds: string[]) => resultService.bulkVerifyResults(resultIds),
    onSuccess: (result) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: resultKeys.lists() });
      queryClient.invalidateQueries({ queryKey: resultKeys.review() });
      console.log(`Successfully verified ${result.modifiedCount} results`);
    },
    onError: (error) => {
      console.error('Failed to bulk verify results:', error);
    },
  });
};

// Reject result mutation
export const useRejectResult = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      resultService.rejectResult(id, reason),
    onSuccess: (rejectedResult) => {
      // Update cached result data
      queryClient.setQueryData(resultKeys.detail(rejectedResult._id), rejectedResult);
      // Invalidate and refetch results list
      queryClient.invalidateQueries({ queryKey: resultKeys.lists() });
      console.log('Result rejected successfully');
    },
    onError: (error) => {
      console.error('Failed to reject result:', error);
    },
  });
};

// Bulk reject results mutation
export const useBulkRejectResults = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ resultIds, reason }: { resultIds: string[]; reason: string }) =>
      resultService.bulkRejectResults(resultIds, reason),
    onSuccess: (result) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: resultKeys.lists() });
      console.log(`Successfully rejected ${result.modifiedCount} results`);
    },
    onError: (error) => {
      console.error('Failed to bulk reject results:', error);
    },
  });
};

// Mark as critical mutation
export const useMarkResultAsCritical = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => resultService.markResultAsCritical(id),
    onSuccess: (criticalResult) => {
      // Update cached result data
      queryClient.setQueryData(resultKeys.detail(criticalResult._id), criticalResult);
      // Invalidate and refetch critical results
      queryClient.invalidateQueries({ queryKey: resultKeys.critical() });
      queryClient.invalidateQueries({ queryKey: resultKeys.lists() });
      console.log('Result marked as critical successfully');
    },
    onError: (error) => {
      console.error('Failed to mark result as critical:', error);
    },
  });
};

// Add comment mutation
export const useAddCommentToResult = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, comment }: { id: string; comment: string }) =>
      resultService.addCommentToResult(id, comment),
    onSuccess: (updatedResult) => {
      // Update cached result data
      queryClient.setQueryData(resultKeys.detail(updatedResult._id), updatedResult);
      console.log('Comment added to result successfully');
    },
    onError: (error) => {
      console.error('Failed to add comment to result:', error);
    },
  });
};

// Export Result type for convenience
export type { Result };