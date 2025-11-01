import { useQuery } from '@tanstack/react-query';
import { testService } from '../services/TestService';

// Query keys
export const testKeys = {
  all: ['tests'] as const,
  lists: () => [...testKeys.all, 'list'] as const,
  list: (filters: any) => [...testKeys.lists(), filters] as const,
  details: () => [...testKeys.all, 'detail'] as const,
  detail: (id: string) => [...testKeys.details(), id] as const,
  available: () => [...testKeys.all, 'available'] as const,
  panels: () => [...testKeys.all, 'panels'] as const,
  search: () => [...testKeys.all, 'search'] as const,
  category: (category: string) => [...testKeys.all, 'category', category] as const,
};

// Get available tests for order creation
export const useAvailableTests = (filters: {
  category?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
} = {}) => {
  return useQuery({
    queryKey: testKeys.available(),
    queryFn: () => testService.getAvailableTests(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};

// Get popular test panels
export const usePopularPanels = (limit: number = 10) => {
  return useQuery({
    queryKey: [...testKeys.panels(), limit],
    queryFn: () => testService.getPopularPanels(limit),
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });
};

// Get tests by category
export const useTestsByCategory = (category: string) => {
  return useQuery({
    queryKey: testKeys.category(category),
    queryFn: () => testService.getTestsByCategory(category),
    enabled: !!category,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};

// Search tests (autocomplete)
export const useSearchTests = (query: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: [...testKeys.search(), query],
    queryFn: () => testService.searchTests(query),
    enabled: enabled && query.length >= 2,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1,
  });
};

// Get all tests with pagination
export const useTests = (params: {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: string;
} = {}) => {
  return useQuery({
    queryKey: testKeys.list(params),
    queryFn: () => testService.getAllTests(params),
    staleTime: 30 * 1000, // 30 seconds
    retry: 2,
  });
};

// Get single test
export const useTest = (id: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: testKeys.detail(id),
    queryFn: () => testService.getTestById(id),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};