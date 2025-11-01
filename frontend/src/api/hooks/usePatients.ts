import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { patientService } from '../services/PatientService';
import { CreatePatientRequest, PatientQueryParams } from '@/types/api.types';

// Query keys
export const patientKeys = {
  all: ['patients'] as const,
  lists: () => [...patientKeys.all, 'list'] as const,
  list: (params: PatientQueryParams) => [...patientKeys.lists(), params] as const,
  details: () => [...patientKeys.all, 'detail'] as const,
  detail: (id: string) => [...patientKeys.details(), id] as const,
  search: () => [...patientKeys.all, 'search'] as const,
  stats: () => [...patientKeys.all, 'stats'] as const,
};

// Get patients list
export const usePatients = (params: PatientQueryParams = {}) => {
  return useQuery({
    queryKey: patientKeys.list(params),
    queryFn: () => patientService.getPatients(params),
    staleTime: 30 * 1000, // 30 seconds
    retry: 2,
  });
};

// Get single patient
export const usePatient = (id: string, enabled = true) => {
  return useQuery({
    queryKey: patientKeys.detail(id),
    queryFn: () => patientService.getPatient(id),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get patient statistics
export const usePatientStats = () => {
  return useQuery({
    queryKey: patientKeys.stats(),
    queryFn: () => patientService.getPatientStats(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 2,
  });
};

// Search patients
export const useSearchPatients = (query: string, filters?: Record<string, any>) => {
  return useQuery({
    queryKey: [...patientKeys.search(), { query, filters }],
    queryFn: () => patientService.searchPatients(query, filters),
    enabled: !!query && query.length >= 2,
    staleTime: 10 * 1000, // 10 seconds
    retry: 1,
  });
};

// Get patient by phone
export const usePatientByPhone = (phone: string) => {
  return useQuery({
    queryKey: [...patientKeys.search(), { phone }],
    queryFn: () => patientService.getPatientsByPhone(phone),
    enabled: !!phone && phone.length >= 10,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
};

// Get patient dashboard
export const usePatientDashboard = (id: string) => {
  return useQuery({
    queryKey: [...patientKeys.detail(id), 'dashboard'],
    queryFn: () => patientService.getPatientDashboard(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 2,
  });
};

// Create patient mutation
export const useCreatePatient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (patientData: CreatePatientRequest) =>
      patientService.createPatient(patientData),
    onSuccess: (newPatient) => {
      // Invalidate and refetch patients list
      queryClient.invalidateQueries({ queryKey: patientKeys.lists() });
      queryClient.setQueryData(patientKeys.detail(newPatient._id), newPatient);
      console.log('Patient created successfully');
    },
    onError: (error) => {
      console.error('Failed to create patient:', error);
    },
  });
};

// Update patient mutation
export const useUpdatePatient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreatePatientRequest> }) =>
      patientService.updatePatient(id, data),
    onSuccess: (updatedPatient) => {
      // Update cached patient data
      queryClient.setQueryData(patientKeys.detail(updatedPatient._id), updatedPatient);
      // Invalidate and refetch patients list
      queryClient.invalidateQueries({ queryKey: patientKeys.lists() });
      console.log('Patient updated successfully');
    },
    onError: (error) => {
      console.error('Failed to update patient:', error);
    },
  });
};

// Delete patient mutation
export const useDeletePatient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => patientService.deletePatient(id),
    onSuccess: (_, deletedId) => {
      // Remove patient from cache
      queryClient.removeQueries({ queryKey: patientKeys.detail(deletedId) });
      // Invalidate and refetch patients list
      queryClient.invalidateQueries({ queryKey: patientKeys.lists() });
      console.log('Patient deleted successfully');
    },
    onError: (error) => {
      console.error('Failed to delete patient:', error);
    },
  });
};

// Search patients mutation
export const useSearchPatientsMutation = () => {
  return useMutation({
    mutationFn: (params: { query: string; filters?: Record<string, any> }) =>
      patientService.searchPatients(params.query, params.filters),
    onError: (error) => {
      console.error('Failed to search patients:', error);
    },
  });
};

// Export patients to CSV
export const useExportPatients = () => {
  return useMutation({
    mutationFn: (params: PatientQueryParams) => patientService.exportPatients(params),
    onError: (error) => {
      console.error('Failed to export patients:', error);
    },
  });
};

// Import patients from CSV
export const useImportPatients = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => patientService.importPatients(file),
    onSuccess: (result) => {
      // Invalidate and refetch patients list
      queryClient.invalidateQueries({ queryKey: patientKeys.lists() });
      console.log('Patients imported successfully', result);
    },
    onError: (error) => {
      console.error('Failed to import patients:', error);
    },
  });
};

// Get patient history
export const usePatientHistory = (id: string) => {
  return useQuery({
    queryKey: [...patientKeys.detail(id), 'history'],
    queryFn: () => patientService.getPatientHistory(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 2,
  });
};

// Batch operations
export const useBatchDeletePatients = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (patientIds: string[]) => {
      const results = await Promise.allSettled(
        patientIds.map(id => patientService.deletePatient(id))
      );

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      if (failed > 0) {
        throw new Error(`Failed to delete ${failed} out of ${patientIds.length} patients`);
      }

      return { successful, failed };
    },
    onSuccess: (_, deletedIds) => {
      // Remove deleted patients from cache
      deletedIds.forEach(id => {
        queryClient.removeQueries({ queryKey: patientKeys.detail(id) });
      });
      // Invalidate and refetch patients list
      queryClient.invalidateQueries({ queryKey: patientKeys.lists() });
      console.log(`Successfully deleted ${deletedIds.length} patients`);
    },
    onError: (error) => {
      console.error('Failed to batch delete patients:', error);
    },
  });
};