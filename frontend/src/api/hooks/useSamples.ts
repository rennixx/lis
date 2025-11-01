import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sampleService } from '../services/SampleService';
import { CreateSampleRequest, UpdateSampleRequest, SampleQueryParams, Sample } from '@/types/api.types';

// Query keys
export const sampleKeys = {
  all: ['samples'] as const,
  lists: () => [...sampleKeys.all, 'list'] as const,
  list: (params: SampleQueryParams) => [...sampleKeys.lists(), params] as const,
  details: () => [...sampleKeys.all, 'detail'] as const,
  detail: (id: string) => [...sampleKeys.details(), id] as const,
  queue: () => [...sampleKeys.all, 'queue'] as const,
  statistics: () => [...sampleKeys.all, 'statistics'] as const,
  statusCounts: () => [...sampleKeys.all, 'statusCounts'] as const,
  search: () => [...sampleKeys.all, 'search'] as const,
  barcode: (barcode: string) => [...sampleKeys.all, 'barcode', barcode] as const,
};

// Get samples list
export const useSamples = (params: SampleQueryParams = {}) => {
  return useQuery({
    queryKey: sampleKeys.list(params),
    queryFn: () => sampleService.getSamples(params),
    staleTime: 30 * 1000, // 30 seconds
    retry: 2,
  });
};

// Get single sample
export const useSample = (id: string, enabled = true) => {
  return useQuery({
    queryKey: sampleKeys.detail(id),
    queryFn: () => sampleService.getSample(id),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get sample by barcode
export const useSampleByBarcode = (barcode: string, enabled = true) => {
  return useQuery({
    queryKey: sampleKeys.barcode(barcode),
    queryFn: () => sampleService.getSampleByBarcode(barcode),
    enabled: enabled && !!barcode,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1,
  });
};

// Get pending collections queue
export const usePendingCollectionsQueue = (limit: number = 50) => {
  return useQuery({
    queryKey: [...sampleKeys.queue(), { limit }],
    queryFn: () => sampleService.getPendingCollectionsQueue(limit),
    staleTime: 10 * 1000, // 10 seconds
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
    retry: 2,
  });
};

// Get collection statistics
export const useCollectionStatistics = (startDate?: string, endDate?: string) => {
  return useQuery({
    queryKey: [...sampleKeys.statistics(), { startDate, endDate }],
    queryFn: () => sampleService.getCollectionStatistics(startDate, endDate),
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 2,
  });
};

// Get samples by status counts
export const useSamplesByStatusCounts = () => {
  return useQuery({
    queryKey: sampleKeys.statusCounts(),
    queryFn: () => sampleService.getSamplesByStatusCounts(),
    staleTime: 60 * 1000, // 1 minute
    retry: 2,
  });
};

// Search samples
export const useSearchSamples = (query: string, limit: number = 20) => {
  return useQuery({
    queryKey: [...sampleKeys.search(), { query, limit }],
    queryFn: () => sampleService.searchSamples(query, limit),
    enabled: !!query && query.length >= 2,
    staleTime: 10 * 1000, // 10 seconds
    retry: 1,
  });
};

// Create sample mutation
export const useCreateSample = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sampleData: CreateSampleRequest) =>
      sampleService.createSample(sampleData),
    onSuccess: (newSample) => {
      // Invalidate and refetch samples list
      queryClient.invalidateQueries({ queryKey: sampleKeys.lists() });
      queryClient.setQueryData(sampleKeys.detail(newSample._id), newSample);
      console.log('Sample created successfully');
    },
    onError: (error) => {
      console.error('Failed to create sample:', error);
    },
  });
};

// Update sample mutation
export const useUpdateSample = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSampleRequest }) =>
      sampleService.updateSample(id, data),
    onSuccess: (updatedSample) => {
      // Update cached sample data
      queryClient.setQueryData(sampleKeys.detail(updatedSample._id), updatedSample);
      // Invalidate and refetch samples list
      queryClient.invalidateQueries({ queryKey: sampleKeys.lists() });
      console.log('Sample updated successfully');
    },
    onError: (error) => {
      console.error('Failed to update sample:', error);
    },
  });
};

// Delete sample mutation
export const useDeleteSample = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => sampleService.deleteSample(id),
    onSuccess: (_, deletedId) => {
      // Remove sample from cache
      queryClient.removeQueries({ queryKey: sampleKeys.detail(deletedId) });
      // Invalidate and refetch samples list
      queryClient.invalidateQueries({ queryKey: sampleKeys.lists() });
      console.log('Sample deleted successfully');
    },
    onError: (error) => {
      console.error('Failed to delete sample:', error);
    },
  });
};

// Confirm collection mutation
export const useConfirmCollection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sampleId,
      collectionData
    }: {
      sampleId: string;
      collectionData: { actualVolume?: number; collectionNotes?: string; };
    }) => sampleService.confirmCollection(sampleId, collectionData),
    onSuccess: (updatedSample) => {
      // Update cached sample data
      queryClient.setQueryData(sampleKeys.detail(updatedSample._id), updatedSample);
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: sampleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: sampleKeys.queue() });
      queryClient.invalidateQueries({ queryKey: sampleKeys.statusCounts() });
      console.log('Sample collection confirmed successfully');
    },
    onError: (error) => {
      console.error('Failed to confirm collection:', error);
    },
  });
};

// Bulk update status mutation
export const useBulkUpdateStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sampleIds,
      newStatus,
      notes
    }: {
      sampleIds: string[];
      newStatus: string;
      notes?: string;
    }) => sampleService.bulkUpdateStatus(sampleIds, newStatus, notes),
    onSuccess: (result) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: sampleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: sampleKeys.queue() });
      queryClient.invalidateQueries({ queryKey: sampleKeys.statusCounts() });
      console.log(`Successfully updated ${result.modifiedCount} samples`);
    },
    onError: (error) => {
      console.error('Failed to bulk update sample status:', error);
    },
  });
};

// Receive samples mutation
export const useReceiveSamples = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sampleIds,
      notes
    }: {
      sampleIds: string[];
      notes?: string;
    }) => sampleService.receiveSamples(sampleIds, notes),
    onSuccess: (result) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: sampleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: sampleKeys.queue() });
      queryClient.invalidateQueries({ queryKey: sampleKeys.statusCounts() });
      console.log(`Successfully received ${result.modifiedCount} samples`);
    },
    onError: (error) => {
      console.error('Failed to receive samples:', error);
    },
  });
};

// Start processing mutation
export const useStartProcessing = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sampleIds,
      notes
    }: {
      sampleIds: string[];
      notes?: string;
    }) => sampleService.startProcessing(sampleIds, notes),
    onSuccess: (result) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: sampleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: sampleKeys.queue() });
      queryClient.invalidateQueries({ queryKey: sampleKeys.statusCounts() });
      console.log(`Successfully started processing ${result.modifiedCount} samples`);
    },
    onError: (error) => {
      console.error('Failed to start processing:', error);
    },
  });
};

// Complete processing mutation
export const useCompleteProcessing = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sampleIds,
      notes
    }: {
      sampleIds: string[];
      notes?: string;
    }) => sampleService.completeProcessing(sampleIds, notes),
    onSuccess: (result) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: sampleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: sampleKeys.queue() });
      queryClient.invalidateQueries({ queryKey: sampleKeys.statusCounts() });
      console.log(`Successfully completed processing ${result.modifiedCount} samples`);
    },
    onError: (error) => {
      console.error('Failed to complete processing:', error);
    },
  });
};

// Generate barcode mutation
export const useGenerateBarcode = () => {
  return useMutation({
    mutationFn: (sampleId: string) => sampleService.generateBarcode(sampleId),
    onError: (error) => {
      console.error('Failed to generate barcode:', error);
    },
  });
};

// Print labels mutation
export const usePrintSampleLabels = () => {
  return useMutation({
    mutationFn: (sampleIds: string[]) => sampleService.printSampleLabels(sampleIds),
    onSuccess: (result) => {
      console.log(`Successfully generated ${result.count} sample labels`);
      // Here you could trigger a print dialog or download the labels
    },
    onError: (error) => {
      console.error('Failed to print sample labels:', error);
    },
  });
};

// Batch operations
export const useBatchDeleteSamples = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sampleIds: string[]) => {
      const results = await Promise.allSettled(
        sampleIds.map(id => sampleService.deleteSample(id))
      );

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      if (failed > 0) {
        throw new Error(`Failed to delete ${failed} out of ${sampleIds.length} samples`);
      }

      return { successful, failed };
    },
    onSuccess: (_, deletedIds) => {
      // Remove deleted samples from cache
      deletedIds.forEach(id => {
        queryClient.removeQueries({ queryKey: sampleKeys.detail(id) });
      });
      // Invalidate and refetch samples list
      queryClient.invalidateQueries({ queryKey: sampleKeys.lists() });
      console.log(`Successfully deleted ${deletedIds.length} samples`);
    },
    onError: (error) => {
      console.error('Failed to batch delete samples:', error);
    },
  });
};

// Export Sample type for convenience
export type { Sample };